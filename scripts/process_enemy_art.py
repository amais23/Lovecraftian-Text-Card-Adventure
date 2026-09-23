import sys
import rembg
from PIL import Image

def process_image(input_path: str, output_path: str):
    img = Image.open(input_path)
    out = rembg.remove(img)
    out = out.resize((1024, 1024), Image.Resampling.LANCZOS)
    out.save(output_path, 'PNG')
    print(f'Successfully processed {input_path} -> {output_path}')

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print('Usage: python3 process_enemy_art.py <input_path> <output_path>')
        sys.exit(1)
    process_image(sys.argv[1], sys.argv[2])
