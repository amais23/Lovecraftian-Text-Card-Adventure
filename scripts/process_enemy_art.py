"""
Offline image processing tool for Lovecraftian Card Game enemy artworks.
Removes background and normalizes to 1024x1024 RGBA transparent PNG.
Requires: rembg, Pillow
"""
import sys
import rembg
from PIL import Image

import os

_session = None

def get_session():
    global _session
    if _session is None:
        # Check available local models in order of quality
        model_candidates = [
            ("birefnet-general", "~/.rembg/models/birefnet-general/birefnet-general.onnx"),
            ("bria-rmbg", "~/.rembg/models/bria-rmbg/bria-rmbg.onnx"),
            ("isnet-general-use", "~/.rembg/models/isnet-general-use/isnet-general-use.onnx"),
            ("u2netp", "~/.rembg/models/u2netp/u2netp.onnx"),
        ]
        chosen_model = "u2netp"
        for name, path in model_candidates:
            expanded = os.path.expanduser(path)
            if os.path.exists(expanded) and os.access(expanded, os.R_OK):
                chosen_model = name
                break
        print(f"[process_enemy_art] Using rembg model: {chosen_model}")
        _session = rembg.new_session(chosen_model)
    return _session

def process_enemy_artwork(source_path: str, target_png_path: str, target_size=(1024, 1024), margin: int = 32) -> None:
    source_image = Image.open(source_path)
    session = get_session()
    transparent_cutout: Image.Image = rembg.remove(source_image, session=session)  # type: ignore

    # Crop to non-transparent bounding box to remove excess white border
    bbox = transparent_cutout.getbbox()
    cropped = transparent_cutout.crop(bbox) if bbox else transparent_cutout

    # Calculate proportional scale to fit within target bounding box
    max_w = max(1, target_size[0] - margin * 2)
    max_h = max(1, target_size[1] - margin * 2)
    scale = min(max_w / cropped.width, max_h / cropped.height)
    new_w = max(1, int(cropped.width * scale))
    new_h = max(1, int(cropped.height * scale))

    fitted = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)

    # Place centered on transparent canvas
    canvas = Image.new('RGBA', target_size, (0, 0, 0, 0))
    paste_x = (target_size[0] - new_w) // 2
    paste_y = (target_size[1] - new_h) // 2
    canvas.paste(fitted, (paste_x, paste_y), fitted)

    os.makedirs(os.path.dirname(os.path.abspath(target_png_path)), exist_ok=True)
    canvas.save(target_png_path, 'PNG')
    print(f'Successfully processed {source_path} -> {target_png_path}')

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print('Usage: python3 process_enemy_art.py <source_path> <target_png_path>')
        sys.exit(1)

    process_enemy_artwork(sys.argv[1], sys.argv[2])
    os._exit(0)

