# Section H: Audio Separator - Python ML (Phases 081-088)

## Progress Checklist
- [x] Phase 081 - Python Project Setup (requirements.txt, pyproject.toml)
- [x] Phase 082 - GPU Detection Utility (gpu_check.py)
- [x] Phase 083 - Audio I/O Utility (audio_io.py)
- [x] Phase 084 - Demucs Wrapper (demucs_wrapper.py)
- [x] Phase 085 - Separate CLI (separate.py with PROGRESS output)
- [x] Phase 086 - Config File (config.py)
- [x] Phase 087 - Test Separation (manual testing)
- [x] Phase 088 - FastAPI Server (optional HTTP API)

---

## Phase 081 - Python Project Setup
**Status:** Pending

### Tasks:
1. Create `ml/requirements.txt`:
   ```
   demucs
   torch>=2.0
   torchaudio>=2.0
   soundfile>=0.12
   numpy>=1.24
   fastapi>=0.100
   uvicorn>=0.23
   pydantic>=2.0
   psutil>=5.9
   ```
2. Create `ml/pyproject.toml` with project metadata
3. Create `ml/src/__init__.py`
4. Create `ml/models/.gitkeep` (model weights directory, gitignored)

---

## Phase 082 - GPU Detection Utility
**Status:** Pending

### Tasks:
1. Create `ml/src/utils/__init__.py`
2. Create `ml/src/utils/gpu_check.py`:
   - `has_cuda()`: check if CUDA is available
   - `get_gpu_info()`: return GPU name, VRAM size
   - `get_ram_gb()`: return system RAM in GB
   - `recommend_model()`: based on hardware, return best model name
   - `recommend_segment_size()`: based on RAM, return segment size
   - `get_device()`: return 'cuda' or 'cpu'

---

## Phase 083 - Audio I/O Utility
**Status:** Pending

### Tasks:
1. Create `ml/src/utils/audio_io.py`:
   - `load_audio(path)`: load audio file, return numpy array + sample rate
   - `save_audio(array, path, sample_rate, format)`: save numpy array as audio file
   - `get_audio_info(path)`: return duration, sample_rate, channels
   - `convert_format(input_path, output_path, format)`: convert between formats
   - Support: wav, mp3, flac, ogg

---

## Phase 084 - Demucs Wrapper
**Status:** Pending

### Tasks:
1. Create `ml/src/models/__init__.py`
2. Create `ml/src/models/demucs_wrapper.py`:
   - `DemucsWrapper` class:
     - `__init__(model_name, device)`: load model, cache in memory
     - `separate(input_path, output_dir)`: run separation
       - Load audio
       - Run through model
       - Save each stem as WAV to output_dir
       - Return list of stem paths
     - `get_stem_names()`: return list of stem names for current model
   - Model caching: load once, reuse for subsequent calls
   - CPU/GPU fallback: try CUDA, fall back to CPU
   - Segment processing: use --segment flag for large files

---

## Phase 085 - Separate CLI
**Status:** Pending

### Tasks:
1. Create `ml/src/separate.py`:
   - CLI entry point using argparse
   - Arguments:
     - `--input`: input audio file path (required)
     - `--output`: output directory (required)
     - `--model`: model name (default: htdemucs)
     - `--device`: cpu or cuda (default: auto-detect)
     - `--segment`: segment length in seconds (optional)
     - `--format`: output format (default: wav)
   - Progress reporting: print `PROGRESS:N` to stdout (0-100)
   - Error reporting: print `ERROR:message` to stderr
   - Exit code: 0 on success, 1 on failure
   - Example: `python ml/src/separate.py --input song.mp3 --output ./stems --model htdemucs_6s`

---

## Phase 086 - Config File
**Status:** Pending

### Tasks:
1. Create `ml/src/config.py`:
   - `MODEL_DIR`: directory for cached model weights
   - `DEFAULT_MODEL`: 'htdemucs'
   - `SUPPORTED_MODELS`: dict of model info (name, stems, description)
   - `DEFAULT_FORMAT`: 'wav'
   - `DEFAULT_SEGMENT`: None (auto)
   - `MAX_AUDIO_LENGTH`: 3600 seconds (1 hour limit)

---

## Phase 087 - Test Separation
**Status:** Pending

### Tasks:
1. Manually test the separation pipeline:
   - Install requirements: `pip install -r requirements.txt`
   - Download a test audio file
   - Run: `python ml/src/separate.py --input test.mp3 --output ./test_output --model htdemucs`
   - Verify output stems exist: vocals.wav, drums.wav, bass.wav, other.wav
   - Verify PROGRESS:N output appears
   - Test with htdemucs_6s: verify 6 stems
   - Test error handling: invalid file, non-existent path

---

## Phase 088 - FastAPI Server (Optional)
**Status:** Pending

### Tasks:
1. Create `ml/src/server.py`:
   - FastAPI app with endpoints:
     - POST /separate: accept file upload + model param, return stem file paths
     - GET /health: return status + available models
     - GET /models: list available models
   - Background task processing
   - Progress reporting via WebSocket or SSE
   - This is an alternative to spawning CLI from Node.js
   - Useful for: remote ML server, microservice deployment

### Section H Verification:
- `python ml/src/separate.py --input test.mp3 --output ./out --model htdemucs` produces 4 stem files
- `python ml/src/separate.py --input test.mp3 --output ./out --model htdemucs_6s` produces 6 stem files
- PROGRESS:0 through PROGRESS:100 printed to stdout
- Each stem file plays correctly and contains the correct instrument
- GPU detection correctly identifies available hardware
