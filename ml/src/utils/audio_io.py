import soundfile as sf
import numpy as np
from pathlib import Path


def load_audio(path):
    """Load audio file, return (numpy array, sample_rate)."""
    data, sr = sf.read(str(path), dtype="float32")
    return data, sr


def save_audio(array, path, sample_rate, fmt="wav"):
    """Save numpy array as audio file."""
    path = Path(path)
    if path.suffix == "":
        path = path.with_suffix(f".{fmt}")
    sf.write(str(path), array, sample_rate)
    return str(path)


def get_audio_info(path):
    """Return dict with duration, sample_rate, channels."""
    info = sf.info(str(path))
    return {
        "duration": info.duration,
        "sample_rate": info.samplerate,
        "channels": info.channels,
        "frames": info.frames,
        "format": info.format,
    }


def convert_format(input_path, output_path, fmt="wav"):
    """Convert audio between formats."""
    data, sr = load_audio(input_path)
    return save_audio(data, output_path, sr, fmt)
