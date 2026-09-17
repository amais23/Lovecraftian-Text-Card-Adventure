#!/usr/bin/env python3
"""
Slice Cursors Pipeline (ADR-0028 & Issue #49)
Extracts, processes background transparency, and outputs standard (32x32)
and Retina @2x (64x64) cursor PNGs from the unified cursor sprite sheet.
"""

import os
import sys
import shutil
from PIL import Image, ImageFilter
import numpy as np
from scipy.ndimage import label, distance_transform_edt

def remove_background(cell_image: Image.Image) -> Image.Image:
    """
    Identifies white background connected to borders, preserves inner details
    and glowing auras, and performs color de-matting for crisp anti-aliased edges.
    """
    arr = np.array(cell_image).astype(float)
    h, w, _ = arr.shape

    # White background detection (high luminance, low saturation)
    lum = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
    sat = np.max(arr, axis=2) - np.min(arr, axis=2)
    is_white = (lum > 238) & (sat < 25)

    # Connected components starting from borders
    labeled, _ = label(is_white)
    border_labels = set(np.unique(np.concatenate([
        labeled[0, :], labeled[-1, :], labeled[:, 0], labeled[:, -1]
    ])))
    border_labels.discard(0)
    bg_mask = np.isin(labeled, list(border_labels))

    # Calculate alpha
    alpha = np.ones((h, w), dtype=float)
    alpha[bg_mask] = 0.0

    fg_mask = ~bg_mask
    dist_to_fg = distance_transform_edt(~fg_mask)

    # Anti-aliasing transition zone around the foreground perimeter
    border_zone = (dist_to_fg <= 2.5) & (dist_to_fg > 0)
    border_alpha = np.clip((lum[border_zone] - 255.0) / -60.0, 0.0, 1.0)
    alpha[border_zone] = np.maximum(alpha[border_zone], border_alpha)

    # Preserve glowing colored auras (e.g. golden glow, violet mist, red rune aura)
    glow_zone = bg_mask & ((sat > 14) | (lum < 240))
    glow_alpha = np.clip((255.0 - lum[glow_zone]) / 90.0, 0.05, 0.95)
    alpha[glow_zone] = np.maximum(alpha[glow_zone], glow_alpha)

    # De-mat semi-transparent pixels against white background
    rgb = arr.copy()
    semi = (alpha > 0.02) & (alpha < 0.98)
    for c in range(3):
        rgb[semi, c] = np.clip(
            (rgb[semi, c] - 255.0 * (1.0 - alpha[semi])) / np.maximum(alpha[semi], 0.05),
            0.0, 255.0
        )

    rgba = np.dstack([rgb, alpha * 255.0]).astype(np.uint8)
    return Image.fromarray(rgba, 'RGBA')

def format_cursor(img: Image.Image, size: int, anchor: str) -> Image.Image:
    """
    Resizes and positions the cursor icon on a canvas of `size` x `size`.
    Anchor types:
      - 'top-left': needle or pointer tip anchored at (4,4) for 32px or (8,8) for 64px.
      - 'center': grip or lock centered around (16,16) for 32px or (32,32) for 64px.
    """
    bbox = img.getbbox()
    if not bbox:
        return Image.new('RGBA', (size, size), (0, 0, 0, 0))

    cropped = img.crop(bbox)
    cw, ch = cropped.size

    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))

    if anchor == 'top-left':
        # Fit into slightly smaller area leaving margin for tip hotspot
        target_size = int(size * 0.82)
        scale = min(target_size / cw, target_size / ch)
        nw, nh = max(1, int(cw * scale)), max(1, int(ch * scale))
        resized = cropped.resize((nw, nh), Image.Resampling.LANCZOS)
        offset = 4 if size == 32 else 8
        canvas.paste(resized, (offset, offset), resized)
    else:  # 'center'
        target_size = int(size * 0.85)
        scale = min(target_size / cw, target_size / ch)
        nw, nh = max(1, int(cw * scale)), max(1, int(ch * scale))
        resized = cropped.resize((nw, nh), Image.Resampling.LANCZOS)
        ox = (size - nw) // 2
        oy = (size - nh) // 2
        canvas.paste(resized, (ox, oy), resized)

    return canvas

def main():
    workspace_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    source_img_path = os.path.join(workspace_root, 'public', 'cursors', 'cursor-sheet.png')
    raw_source = '/Users/liuchiahan/.gemini/antigravity-ide/brain/4087c956-4308-4aa2-b4da-7bed28e39f52/cur_sprite_sheet_1789632270080.jpg'

    if not os.path.exists(source_img_path):
        if os.path.exists(raw_source):
            shutil.copyfile(raw_source, source_img_path)
            print(f"Copied raw atlas to {source_img_path}")
        else:
            print(f"Error: Neither {source_img_path} nor {raw_source} exists.")
            sys.exit(1)

    atlas_img = Image.open(source_img_path).convert('RGB')
    print(f"Loaded sprite atlas: {source_img_path}, size={atlas_img.size}")

    # Define cells to extract from 1024x1024 grid (4 rows x 4 cols, each 256x256)
    cursor_definitions = {
        'default': {'row': 0, 'col': 0, 'anchor': 'top-left'},
        'pointer': {'row': 0, 'col': 1, 'anchor': 'top-left'},
        'grab': {'row': 0, 'col': 2, 'anchor': 'center'},
        'grabbing': {'row': 1, 'col': 2, 'anchor': 'center'},
        'disabled': {'row': 0, 'col': 3, 'anchor': 'center'},
        'madness-default': {'row': 2, 'col': 0, 'anchor': 'top-left'},
        'madness-pointer': {'row': 2, 'col': 1, 'anchor': 'top-left'},
        'madness-grab': {'row': 2, 'col': 2, 'anchor': 'center'},
        'madness-grabbing': {'row': 3, 'col': 2, 'anchor': 'center'},
        'madness-disabled': {'row': 3, 'col': 3, 'anchor': 'center'},
    }

    out_std_dir = os.path.join(workspace_root, 'public', 'cursors')
    out_2x_dir = os.path.join(workspace_root, 'public', 'cursors', '@2x')
    os.makedirs(out_std_dir, exist_ok=True)
    os.makedirs(out_2x_dir, exist_ok=True)

    # Extract clean 4x2 unified atlas
    # Row 0: default, pointer, grab, disabled
    # Row 1: madness-default, madness-pointer, madness-grab, madness-disabled
    unified_4x2 = Image.new('RGBA', (1024, 512), (0, 0, 0, 0))
    grid_4x2_names = [
        ['default', 'pointer', 'grab', 'disabled'],
        ['madness-default', 'madness-pointer', 'madness-grab', 'madness-disabled']
    ]

    for name, info in cursor_definitions.items():
        row, col = info['row'], info['col']
        anchor = info['anchor']

        # Crop with 4px inner border margin to avoid dividing lines
        x0, y0 = col * 256 + 4, row * 256 + 4
        x1, y1 = (col + 1) * 256 - 4, (row + 1) * 256 - 4
        cell = atlas_img.crop((x0, y0, x1, y1))

        # Background transparency removal
        transparent_cell = remove_background(cell)

        # Standard 32x32
        cur_32 = format_cursor(transparent_cell, 32, anchor)
        out_32_path = os.path.join(out_std_dir, f"{name}.png")
        cur_32.save(out_32_path, 'PNG')

        # Retina 64x64 (@2x)
        cur_64 = format_cursor(transparent_cell, 64, anchor)
        out_64_path = os.path.join(out_2x_dir, f"{name}.png")
        cur_64.save(out_64_path, 'PNG')

        print(f"Generated {name:18} -> 32x32 ({out_32_path}) & 64x64 ({out_64_path})")

    # Assemble 4x2 unified sheet
    for r_idx, row_names in enumerate(grid_4x2_names):
        for c_idx, cur_name in enumerate(row_names):
            cur_64_path = os.path.join(out_2x_dir, f"{cur_name}.png")
            c_img = Image.open(cur_64_path)
            # Center on 256x256 cell
            scale = 220 / 64
            large = c_img.resize((int(64 * scale), int(64 * scale)), Image.Resampling.LANCZOS)
            cx = c_idx * 256 + (256 - large.width) // 2
            cy = r_idx * 256 + (256 - large.height) // 2
            unified_4x2.paste(large, (cx, cy), large)

    unified_sheet_path = os.path.join(workspace_root, 'public', 'cursors', 'cursor-sheet.png')
    unified_4x2.save(unified_sheet_path, 'PNG')
    print(f"Saved clean 4x2 unified sprite atlas to {unified_sheet_path}")

if __name__ == '__main__':
    main()
