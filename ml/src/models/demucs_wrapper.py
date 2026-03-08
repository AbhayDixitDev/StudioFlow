import os
import torch
import soundfile as sf
import numpy as np
from pathlib import Path

from ..config import SUPPORTED_MODELS, DEFAULT_MODEL
from ..utils.gpu_check import get_device

# Max out CPU parallelism
torch.set_num_threads(os.cpu_count())
torch.set_num_interop_threads(max(os.cpu_count() // 2, 1))


class DemucsWrapper:
    """Wrapper around Demucs for audio source separation."""

    _instances = {}

    def __init__(self, model_name=DEFAULT_MODEL, device=None):
        self.model_name = model_name
        self.device = device or get_device()
        self.model = None
        self._load_model()

    def _load_model(self):
        """Load the Demucs model."""
        from demucs.pretrained import get_model

        if self.model_name in DemucsWrapper._instances:
            self.model = DemucsWrapper._instances[self.model_name]
            return

        self.model = get_model(self.model_name)
        self.model.to(self.device)
        self.model.eval()
        DemucsWrapper._instances[self.model_name] = self.model

    def get_stem_names(self):
        """Return stem names from the model itself (order must match output tensor)."""
        return list(self.model.sources)

    def separate(self, input_path, output_dir, progress_callback=None, segment=None):
        """
        Run separation on an audio file. Processes full audio using
        chunked pipeline (split=True) for memory efficiency.
        """
        from demucs.apply import apply_model
        import torchaudio.functional as F
        import threading

        input_path = Path(input_path)
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        if progress_callback:
            progress_callback(0)

        # Load full audio — no duration cap
        data, sr = sf.read(str(input_path), dtype="float32")
        if data.ndim == 1:
            wav = torch.from_numpy(data).unsqueeze(0)
        else:
            wav = torch.from_numpy(data.T)

        if progress_callback:
            progress_callback(5)

        # Resample if needed
        if sr != self.model.samplerate:
            wav = F.resample(wav, sr, self.model.samplerate)
            sr = self.model.samplerate

        # Ensure stereo
        if wav.shape[0] == 1:
            wav = wav.repeat(2, 1)
        elif wav.shape[0] > 2:
            wav = wav[:2]

        wav = wav.unsqueeze(0).to(self.device)
        audio_secs = wav.shape[-1] / sr

        if progress_callback:
            progress_callback(10)

        # Background timer for progress (10->85%) during heavy ML step
        timer_stop = threading.Event()
        # CPU time estimates per second of audio (with 12 threads):
        #   htdemucs: ~2s, htdemucs_6s: ~3s, mdx_extra: ~8s
        cpu_multipliers = {'htdemucs': 2.0, 'htdemucs_6s': 3.0, 'mdx_extra': 8.0}
        cpu_mult = cpu_multipliers.get(self.model_name, 4.0)
        est_time = max(audio_secs * (0.4 if self.device != 'cpu' else cpu_mult), 10)

        def _tick():
            import time
            t0 = time.time()
            while not timer_stop.is_set():
                frac = min((time.time() - t0) / est_time, 0.95)
                if progress_callback:
                    progress_callback(int(10 + frac * 75))
                timer_stop.wait(2)

        t = threading.Thread(target=_tick, daemon=True)
        t.start()

        # split=True: processes audio in chunks (pipeline), memory efficient
        with torch.inference_mode():
            sources = apply_model(self.model, wav, split=True, overlap=0.25, progress=False)

        timer_stop.set()
        t.join(timeout=1)

        if progress_callback:
            progress_callback(85)

        # Save stems
        stem_names = self.get_stem_names()
        output_paths = []

        for i, name in enumerate(stem_names):
            stem_path = output_dir / f"{name}.wav"
            stem_audio = sources[0, i].cpu().numpy().T
            # PCM_16: half the file size of float32, sufficient quality
            sf.write(str(stem_path), stem_audio, sr, subtype='PCM_16')
            output_paths.append(str(stem_path))

            if progress_callback:
                progress_callback(85 + int((i + 1) / len(stem_names) * 15))

        return output_paths
