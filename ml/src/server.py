"""
Optional FastAPI server for audio separation.
Alternative to spawning CLI from Node.js.

Usage:
    uvicorn src.server:app --host 0.0.0.0 --port 8000
"""
import os
import uuid
import shutil
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.responses import JSONResponse

from .config import SUPPORTED_MODELS, DEFAULT_MODEL
from .models.demucs_wrapper import DemucsWrapper
from .utils.gpu_check import get_device, get_gpu_info, get_ram_gb, has_cuda

app = FastAPI(title="Audio Separator ML", version="0.1.0")

UPLOAD_DIR = Path(os.environ.get("ML_UPLOAD_DIR", "/tmp/audio-sep-ml"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "device": get_device(),
        "cuda": has_cuda(),
        "gpu": get_gpu_info(),
        "ram_gb": get_ram_gb(),
    }


@app.get("/models")
async def list_models():
    return {"models": SUPPORTED_MODELS}


@app.post("/separate")
async def separate(
    file: UploadFile = File(...),
    model: str = Query(DEFAULT_MODEL),
):
    if model not in SUPPORTED_MODELS:
        raise HTTPException(400, f"Unknown model: {model}")

    # Save uploaded file
    job_id = str(uuid.uuid4())
    job_dir = UPLOAD_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    input_path = job_dir / file.filename
    with open(input_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    output_dir = job_dir / "stems"

    try:
        wrapper = DemucsWrapper(model_name=model)
        stem_paths = wrapper.separate(str(input_path), str(output_dir))

        stems = []
        for p in stem_paths:
            name = Path(p).stem
            size = os.path.getsize(p)
            stems.append({"name": name, "path": p, "size": size})

        return JSONResponse({
            "job_id": job_id,
            "model": model,
            "stems": stems,
        })
    except Exception as e:
        raise HTTPException(500, str(e))
