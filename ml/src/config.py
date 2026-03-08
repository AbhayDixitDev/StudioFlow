import os
from pathlib import Path

# Directories
BASE_DIR = Path(__file__).parent.parent
MODEL_DIR = os.environ.get("MODEL_DIR", str(BASE_DIR / "models"))

# Models
DEFAULT_MODEL = "htdemucs"

SUPPORTED_MODELS = {
    "htdemucs": {
        "name": "HTDemucs",
        "stems": ["drums", "bass", "other", "vocals"],
        "description": "Hybrid Transformer Demucs - 4 stems, best quality",
    },
    "htdemucs_6s": {
        "name": "HTDemucs 6-stem",
        "stems": ["drums", "bass", "other", "vocals", "guitar", "piano"],
        "description": "6-stem separation with guitar and piano",
    },
    "mdx_extra": {
        "name": "MDX Extra",
        "stems": ["drums", "bass", "other", "vocals"],
        "description": "MDX-Net architecture, fast inference",
    },
}

# Defaults
DEFAULT_FORMAT = "wav"
DEFAULT_SEGMENT = None  # Auto-detect based on available memory
MAX_AUDIO_LENGTH = 3600  # 1 hour limit in seconds
