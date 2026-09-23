"""
Offline image processing tool for Lovecraftian Card Game enemy artworks.
Removes background and normalizes to 1024x1024 RGBA transparent PNG.
Requires: rembg, Pillow
"""
import sys
import rembg
from PIL import Image

def process_enemy_artwork(source_path: str, target_png_path: str) -> None:
    source_image = Image.open(source_path)
    transparent_cutout = rembg.remove(source_image)
    normalized_image = transparent_cutout.resize((1024, 1024), Image.Resampling.LANCZOS)
    normalized_image.save(target_png_path, 'PNG')
    print(f'Successfully processed {source_path} -> {target_png_path}')

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print('Usage: python3 process_enemy_art.py <source_path> <target_png_path>')
        sys.exit(1)
    process_enemy_artwork(sys.argv[1], sys.argv[2])

