"""
CLI entry point for audio source separation.

Usage:
    python -m src.separate --input song.mp3 --output ./stems --model htdemucs

Progress is reported via stdout as PROGRESS:N (0-100).
Errors are reported via stderr as ERROR:message.
"""
import argparse
import sys
from pathlib import Path

from .config import SUPPORTED_MODELS, DEFAULT_MODEL, MAX_AUDIO_LENGTH
from .utils.audio_io import get_audio_info
from .models.demucs_wrapper import DemucsWrapper


def print_progress(pct):
    """Print progress to stdout for Node.js to parse."""
    print(f"PROGRESS:{pct}", flush=True)


def main():
    parser = argparse.ArgumentParser(description="Audio source separation using Demucs")
    parser.add_argument("--input", required=True, help="Input audio file path")
    parser.add_argument("--output", required=True, help="Output directory for stems")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Model name (htdemucs, htdemucs_6s, mdx_extra)")
    parser.add_argument("--device", default=None, help="Device: cpu or cuda (default: auto-detect)")
    parser.add_argument("--segment", type=int, default=None, help="Segment length in seconds")
    parser.add_argument("--format", default="wav", help="Output format (default: wav)")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_dir = Path(args.output)

    # Validate input
    if not input_path.exists():
        print(f"ERROR:Input file not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    if args.model not in SUPPORTED_MODELS:
        print(f"ERROR:Unknown model: {args.model}. Available: {', '.join(SUPPORTED_MODELS.keys())}", file=sys.stderr)
        sys.exit(1)

    # Check audio duration
    try:
        info = get_audio_info(str(input_path))
        if info["duration"] > MAX_AUDIO_LENGTH:
            print(f"ERROR:Audio too long ({info['duration']:.0f}s). Max: {MAX_AUDIO_LENGTH}s", file=sys.stderr)
            sys.exit(1)
    except Exception as e:
        print(f"ERROR:Cannot read audio file: {e}", file=sys.stderr)
        sys.exit(1)

    # Run separation
    try:
        print_progress(0)

        wrapper = DemucsWrapper(model_name=args.model, device=args.device)
        stem_paths = wrapper.separate(
            input_path=str(input_path),
            output_dir=str(output_dir),
            progress_callback=print_progress,
            segment=args.segment,
        )

        print_progress(100)

        # Print output paths
        for p in stem_paths:
            print(f"STEM:{p}", flush=True)

    except Exception as e:
        print(f"ERROR:{e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
