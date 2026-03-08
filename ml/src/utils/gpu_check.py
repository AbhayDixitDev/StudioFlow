import psutil


def has_cuda():
    """Check if CUDA is available."""
    try:
        import torch
        return torch.cuda.is_available()
    except ImportError:
        return False


def get_gpu_info():
    """Return GPU name and VRAM size in GB."""
    try:
        import torch
        if not torch.cuda.is_available():
            return None
        name = torch.cuda.get_device_name(0)
        vram = torch.cuda.get_device_properties(0).total_mem / (1024 ** 3)
        return {"name": name, "vram_gb": round(vram, 1)}
    except Exception:
        return None


def get_ram_gb():
    """Return system RAM in GB."""
    return round(psutil.virtual_memory().total / (1024 ** 3), 1)


def get_device():
    """Return 'cuda' if available, else 'cpu'."""
    return "cuda" if has_cuda() else "cpu"


def recommend_model():
    """Recommend a model based on available hardware."""
    gpu = get_gpu_info()
    ram = get_ram_gb()

    if gpu and gpu["vram_gb"] >= 6:
        return "htdemucs_6s"
    elif gpu and gpu["vram_gb"] >= 4:
        return "htdemucs"
    elif ram >= 8:
        return "htdemucs"
    else:
        return "htdemucs"


def recommend_segment_size():
    """Recommend segment size based on available memory."""
    gpu = get_gpu_info()
    ram = get_ram_gb()

    if gpu:
        if gpu["vram_gb"] >= 8:
            return None  # No segmentation needed
        elif gpu["vram_gb"] >= 4:
            return 40
        else:
            return 20
    else:
        if ram >= 16:
            return 40
        elif ram >= 8:
            return 20
        else:
            return 10
