#!/usr/bin/env python3
"""
Generate ADR-0028 Custom Help / Inspect Cursors:
1. Normal State: Vintage Brass Magnifying Glass (1920s Antique Brass & Glass)
2. Madness State: Bleeding Eldritch Eye (Void Violet Flesh & Dripping Blood)

Outputs:
  - public/cursors/help.png (32x32)
  - public/cursors/@2x/help.png (64x64)
  - public/cursors/madness-help.png (32x32)
  - public/cursors/@2x/madness-help.png (64x64)
Hotspot: (10, 10) in 32x32, (20, 20) in 64x64.
"""

import os
import math
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

def create_vintage_magnifying_glass(size: int = 512) -> Image.Image:
    """
    Renders high-resolution 1920s brass magnifying glass.
    Lens center is at (size * 10 / 32, size * 10 / 32) = (160, 160).
    Handle extends towards bottom-right (420, 420).
    """
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Scale factor
    s = size / 512.0
    cx, cy = 160 * s, 160 * s
    r_lens = 95 * s
    rim_w = 20 * s

    # 1. Handle (angled down-right at ~45 degrees)
    # Angle in radians: pi / 4
    angle = math.pi / 4.0
    dx = math.cos(angle)
    dy = math.sin(angle)
    px = -math.sin(angle)
    py = math.cos(angle)

    h_start = r_lens + rim_w * 0.8
    h_len = 240 * s
    h_width = 16 * s

    # Handle points
    p0 = (cx + dx * h_start + px * h_width, cy + dy * h_start + py * h_width)
    p1 = (cx + dx * (h_start + h_len) + px * (h_width * 0.7), cy + dy * (h_start + h_len) + py * (h_width * 0.7))
    p2 = (cx + dx * (h_start + h_len) - px * (h_width * 0.7), cy + dy * (h_start + h_len) - py * (h_width * 0.7))
    p3 = (cx + dx * h_start - px * h_width, cy + dy * h_start - py * h_width)

    # Draw handle shadow / glow
    shadow_img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_img)
    s_draw.polygon([p0, p1, p2, p3], fill=(20, 15, 10, 180))
    s_draw.ellipse([cx - r_lens - rim_w, cy - r_lens - rim_w, cx + r_lens + rim_w, cy + r_lens + rim_w], fill=(15, 10, 5, 140))
    shadow_img = shadow_img.filter(ImageFilter.GaussianBlur(8 * s))
    img.paste(shadow_img, (int(4 * s), int(4 * s)), shadow_img)

    # Handle connector brass bracket
    c_start = r_lens + rim_w * 0.4
    c_end = r_lens + rim_w * 1.3
    c_w = 22 * s
    cp0 = (cx + dx * c_start + px * c_w, cy + dy * c_start + py * c_w)
    cp1 = (cx + dx * c_end + px * (c_w * 0.8), cy + dy * c_end + py * (c_w * 0.8))
    cp2 = (cx + dx * c_end - px * (c_w * 0.8), cy + dy * c_end - py * (c_w * 0.8))
    cp3 = (cx + dx * c_start - px * c_w, cy + dy * c_start - py * c_w)
    draw.polygon([cp0, cp1, cp2, cp3], fill=(180, 130, 45, 255))
    draw.line([cp0, cp1, cp2, cp3, cp0], fill=(240, 205, 110, 255), width=max(1, int(2 * s)))

    # Main ebony wood handle with brass grooves
    draw.polygon([p0, p1, p2, p3], fill=(35, 25, 20, 255))

    # Brass rings / inlays on handle
    for t_frac in [0.25, 0.45, 0.65, 0.85]:
        t_pos = h_start + h_len * t_frac
        rw = h_width * (1.0 - 0.25 * t_frac)
        rp0 = (cx + dx * t_pos + px * rw, cy + dy * t_pos + py * rw)
        rp1 = (cx + dx * t_pos - px * rw, cy + dy * t_pos - py * rw)
        draw.line([rp0, rp1], fill=(215, 175, 85, 255), width=max(2, int(5 * s)))

    # Brass Pommel tip (end sphere)
    end_cx = cx + dx * (h_start + h_len + 12 * s)
    end_cy = cy + dy * (h_start + h_len + 12 * s)
    pr = 14 * s
    draw.ellipse([end_cx - pr, end_cy - pr, end_cx + pr, end_cy + pr], fill=(215, 170, 75, 255), outline=(255, 225, 130, 255), width=max(1, int(2 * s)))

    # 2. Outer Brass Rim (Engraved antique brass)
    outer_r = r_lens + rim_w
    # Draw metallic gradient rim
    for i in range(int(rim_w)):
        cur_r = outer_r - i
        t = i / rim_w
        # Brass gradient: highlight gold -> antique bronze -> inner dark ring
        r = int(245 * (1 - t) + 160 * t)
        g = int(200 * (1 - t) + 120 * t)
        b = int(100 * (1 - t) + 40 * t)
        draw.ellipse([cx - cur_r, cy - cur_r, cx + cur_r, cy + cur_r], outline=(r, g, b, 255), width=2)

    # Rim bevel highlights (top-left light source)
    draw.arc([cx - outer_r, cy - outer_r, cx + outer_r, cy + outer_r], start=135, end=315, fill=(255, 245, 180, 255), width=max(2, int(4 * s)))
    draw.arc([cx - outer_r, cy - outer_r, cx + outer_r, cy + outer_r], start=315, end=135, fill=(110, 75, 25, 255), width=max(2, int(4 * s)))

    # 3. Translucent Glass Lens
    lens_img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    l_draw = ImageDraw.Draw(lens_img)
    # Glass subtle celestial blue-cyan tint
    l_draw.ellipse([cx - r_lens, cy - r_lens, cx + r_lens, cy + r_lens], fill=(130, 190, 230, 55))

    # Glass specular reflection arc (crescent in upper-left)
    refl_r = r_lens * 0.78
    refl_w = max(2, int(10 * s))
    l_draw.arc([cx - refl_r, cy - refl_r, cx + refl_r, cy + refl_r], start=180, end=270, fill=(255, 255, 255, 190), width=refl_w)

    # Second subtle bottom reflection
    refl_b = r_lens * 0.72
    l_draw.arc([cx - refl_b, cy - refl_b, cx + refl_b, cy + refl_b], start=20, end=60, fill=(255, 240, 200, 110), width=max(1, int(5 * s)))

    # Blur glass highlights slightly
    lens_img = lens_img.filter(ImageFilter.GaussianBlur(1.5 * s))
    img.paste(lens_img, (0, 0), lens_img)

    # Hotspot indicator: tiny occult center glint at (cx, cy)
    draw.ellipse([cx - 2.5 * s, cy - 2.5 * s, cx + 2.5 * s, cy + 2.5 * s], fill=(255, 250, 220, 200))

    return img

def create_bleeding_eldritch_eye(size: int = 512) -> Image.Image:
    """
    Renders high-resolution bleeding eldritch eye (Madness State).
    Eye pupil center is at (size * 10 / 32, size * 10 / 32) = (160, 160).
    Tendrils and dark dripping blood stream down towards bottom-right (420, 420).
    """
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    s = size / 512.0
    cx, cy = 160 * s, 160 * s
    r_eye = 90 * s
    rim_w = 22 * s

    angle = math.pi / 4.0
    dx = math.cos(angle)
    dy = math.sin(angle)
    px = -math.sin(angle)
    py = math.cos(angle)

    # 1. Void Violet Flesh & Creeping Tendrils
    # Outer dark shadow / violet miasma
    shadow_img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_img)
    s_draw.ellipse([cx - r_eye - rim_w * 1.5, cy - r_eye - rim_w * 1.5, cx + r_eye + rim_w * 1.5, cy + r_eye + rim_w * 1.5], fill=(50, 10, 75, 170))
    shadow_img = shadow_img.filter(ImageFilter.GaussianBlur(12 * s))
    img.paste(shadow_img, (0, 0), shadow_img)

    # Tendril 1: Main fleshy tentacle stalk trailing down-right
    t_start = r_eye + rim_w * 0.7
    t_len = 230 * s
    t_w = 18 * s

    tp0 = (cx + dx * t_start + px * t_w, cy + dy * t_start + py * t_w)
    tp1 = (cx + dx * (t_start + t_len * 0.5) + px * (t_w * 1.3), cy + dy * (t_start + t_len * 0.5) + py * (t_w * 1.3))
    tp2 = (cx + dx * (t_start + t_len) + px * (t_w * 0.2), cy + dy * (t_start + t_len) + py * (t_w * 0.2))
    tp3 = (cx + dx * (t_start + t_len) - px * (t_w * 0.2), cy + dy * (t_start + t_len) - py * (t_w * 0.2))
    tp4 = (cx + dx * (t_start + t_len * 0.5) - px * (t_w * 0.7), cy + dy * (t_start + t_len * 0.5) - py * (t_w * 0.7))
    tp5 = (cx + dx * t_start - px * t_w, cy + dy * t_start - py * t_w)

    draw.polygon([tp0, tp1, tp2, tp3, tp4, tp5], fill=(45, 12, 60, 255))

    # Blood drops along the tentacle trailing off
    for frac, drop_size in [(0.4, 10 * s), (0.7, 13 * s), (0.95, 16 * s), (1.12, 11 * s)]:
        bx = cx + dx * (t_start + t_len * frac)
        by = cy + dy * (t_start + t_len * frac)
        draw.ellipse([bx - drop_size, by - drop_size, bx + drop_size, by + drop_size], fill=(170, 10, 35, 255), outline=(230, 20, 50, 255), width=max(1, int(1.5 * s)))
        # Specular glint on blood drop
        draw.ellipse([bx - drop_size * 0.4, by - drop_size * 0.4, bx - drop_size * 0.1, by - drop_size * 0.1], fill=(255, 180, 200, 220))

    # Secondary curly tentacle whipping to the side
    side_pts = [
        (cx + px * (r_eye + 5 * s), cy + py * (r_eye + 5 * s)),
        (cx + px * (r_eye + 35 * s) + dx * 30 * s, cy + py * (r_eye + 35 * s) + dy * 30 * s),
        (cx + px * (r_eye + 50 * s) + dx * 75 * s, cy + py * (r_eye + 50 * s) + dy * 75 * s),
        (cx + px * (r_eye + 35 * s) + dx * 70 * s, cy + py * (r_eye + 35 * s) + dy * 70 * s),
    ]
    draw.polygon(side_pts, fill=(65, 18, 90, 255))

    # 2. Eldritch Flesh Eye Socket (Veiny purple and dark crimson)
    outer_r = r_eye + rim_w
    for i in range(int(rim_w)):
        cur_r = outer_r - i
        t = i / rim_w
        r = int(95 * (1 - t) + 40 * t)
        g = int(20 * (1 - t) + 8 * t)
        b = int(120 * (1 - t) + 50 * t)
        draw.ellipse([cx - cur_r, cy - cur_r, cx + cur_r, cy + cur_r], outline=(r, g, b, 255), width=2)

    # Eldritch Veins around socket
    draw.arc([cx - outer_r, cy - outer_r, cx + outer_r, cy + outer_r], start=40, end=200, fill=(200, 20, 60, 255), width=max(2, int(4 * s)))
    draw.arc([cx - outer_r, cy - outer_r, cx + outer_r, cy + outer_r], start=210, end=360, fill=(130, 40, 180, 255), width=max(2, int(3 * s)))

    # 3. Eyeball Sclera (Pale ochre/gray with bloodshot red streaks)
    draw.ellipse([cx - r_eye, cy - r_eye, cx + r_eye, cy + r_eye], fill=(225, 218, 205, 255))

    # Capillaries / Bloodshot veins radiating from edges towards center
    for vein_deg in [30, 75, 120, 160, 210, 260, 310, 345]:
        v_rad = math.radians(vein_deg)
        vx0 = cx + math.cos(v_rad) * r_eye * 0.95
        vy0 = cy + math.sin(v_rad) * r_eye * 0.95
        # Zig-zag vein
        vx1 = cx + math.cos(v_rad + 0.1) * r_eye * 0.65
        vy1 = cy + math.sin(v_rad + 0.1) * r_eye * 0.65
        vx2 = cx + math.cos(v_rad - 0.05) * r_eye * 0.4
        vy2 = cy + math.sin(v_rad - 0.05) * r_eye * 0.4
        draw.line([(vx0, vy0), (vx1, vy1), (vx2, vy2)], fill=(195, 25, 45, 210), width=max(1, int(2.5 * s)))

    # 4. Iridescent Purple / Crimson Iris
    r_iris = r_eye * 0.52
    draw.ellipse([cx - r_iris, cy - r_iris, cx + r_iris, cy + r_iris], fill=(120, 20, 130, 255), outline=(180, 30, 90, 255), width=max(1, int(3 * s)))
    # Inner iris texture ring
    r_iris_in = r_iris * 0.75
    draw.ellipse([cx - r_iris_in, cy - r_iris_in, cx + r_iris_in, cy + r_iris_in], fill=(75, 10, 85, 255))

    # 5. Void Slit Pupil (Piercing dark slit centered at (cx, cy))
    pw = 11 * s
    ph = 36 * s
    draw.ellipse([cx - pw, cy - ph, cx + pw, cy + ph], fill=(10, 2, 15, 255))

    # 6. Dripping Blood Streams from Lower Eyelid
    # Tears of fresh blood streaming down
    d_x0, d_y0 = cx + 15 * s, cy + r_eye * 0.8
    d_x1, d_y1 = cx + 35 * s, cy + r_eye * 1.5
    draw.line([(d_x0, d_y0), (d_x1, d_y1)], fill=(210, 15, 30, 255), width=max(2, int(4 * s)))
    draw.ellipse([d_x1 - 6 * s, d_y1 - 6 * s, d_x1 + 6 * s, d_y1 + 6 * s], fill=(225, 20, 40, 255))

    # 7. Uncanny Glint in the Pupil
    draw.ellipse([cx - 5 * s, cy - 10 * s, cx - 1 * s, cy - 6 * s], fill=(255, 255, 255, 240))
    draw.ellipse([cx + 3 * s, cy + 4 * s, cx + 5 * s, cy + 6 * s], fill=(255, 170, 220, 190))

    # Hotspot indicator at exact center of pupil
    draw.ellipse([cx - 1.5 * s, cy - 1.5 * s, cx + 1.5 * s, cy + 1.5 * s], fill=(240, 60, 90, 230))

    return img

def main():
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    out_dir = os.path.join(root, 'public', 'cursors')
    out_2x_dir = os.path.join(root, 'public', 'cursors', '@2x')
    os.makedirs(out_dir, exist_ok=True)
    os.makedirs(out_2x_dir, exist_ok=True)

    print("Generating high-resolution vintage brass magnifying glass...")
    normal_glass = create_vintage_magnifying_glass(512)

    # 32x32 standard
    normal_32 = normal_glass.resize((32, 32), Image.Resampling.LANCZOS)
    p32 = os.path.join(out_dir, 'help.png')
    normal_32.save(p32, 'PNG')
    print(f"Saved: {p32}")

    # 64x64 @2x retina
    normal_64 = normal_glass.resize((64, 64), Image.Resampling.LANCZOS)
    p64 = os.path.join(out_2x_dir, 'help.png')
    normal_64.save(p64, 'PNG')
    print(f"Saved: {p64}")

    print("Generating high-resolution bleeding eldritch eye...")
    madness_eye = create_bleeding_eldritch_eye(512)

    # 32x32 standard
    madness_32 = madness_eye.resize((32, 32), Image.Resampling.LANCZOS)
    mp32 = os.path.join(out_dir, 'madness-help.png')
    madness_32.save(mp32, 'PNG')
    print(f"Saved: {mp32}")

    # 64x64 @2x retina
    madness_64 = madness_eye.resize((64, 64), Image.Resampling.LANCZOS)
    mp64 = os.path.join(out_2x_dir, 'madness-help.png')
    madness_64.save(mp64, 'PNG')
    print(f"Saved: {mp64}")

    print("Cursor generation complete!")

if __name__ == '__main__':
    main()
