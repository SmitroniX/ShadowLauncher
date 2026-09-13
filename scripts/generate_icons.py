import math
from PIL import Image, ImageDraw, ImageFilter

def create_shadow_launcher_icon(size):
    # Base image with transparent or deep background
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Scale factor
    s = size / 512.0
    pad = int(24 * s)
    r = int(100 * s)

    # Rounded background with smooth gradient
    bg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bg_draw = ImageDraw.Draw(bg)

    # Gradient background
    for y in range(size):
        ratio = y / size
        # Dark obsidian purple gradient
        r_c = int(12 + ratio * 18)
        g_c = int(10 + ratio * 12)
        b_c = int(24 + ratio * 38)
        bg_draw.line([(0, y), (size, y)], fill=(r_c, g_c, b_c, 255))

    # Mask for rounded rectangle
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([pad, pad, size - pad, size - pad], radius=r, fill=255)
    
    # Composite background
    img.paste(bg, (0, 0), mask)

    # Outer border glow
    border_draw = ImageDraw.Draw(img)
    border_draw.rounded_rectangle(
        [pad, pad, size - pad, size - pad],
        radius=r,
        outline=(139, 92, 246, 180),
        width=int(4 * s)
    )

    # Draw Inner Glowing Cyber Minecraft Pickaxe / Sword / "S" Crest
    center_x = size // 2
    center_y = size // 2

    # Draw isometric 3D glowing Minecraft cube with "S" crest
    # Top diamond face
    cube_s = 110 * s
    top_points = [
        (center_x, center_y - cube_s),
        (center_x + cube_s * 1.15, center_y - cube_s * 0.4),
        (center_x, center_y + cube_s * 0.2),
        (center_x - cube_s * 1.15, center_y - cube_s * 0.4)
    ]
    border_draw.polygon(top_points, fill=(139, 92, 246, 230), outline=(192, 132, 252, 255))

    # Left face (dark shadow violet)
    left_points = [
        (center_x - cube_s * 1.15, center_y - cube_s * 0.4),
        (center_x, center_y + cube_s * 0.2),
        (center_x, center_y + cube_s * 1.3),
        (center_x - cube_s * 1.15, center_y + cube_s * 0.7)
    ]
    border_draw.polygon(left_points, fill=(76, 29, 149, 240), outline=(109, 40, 217, 255))

    # Right face (cyber cyan / neon teal shadow)
    right_points = [
        (center_x, center_y + cube_s * 0.2),
        (center_x + cube_s * 1.15, center_y - cube_s * 0.4),
        (center_x + cube_s * 1.15, center_y + cube_s * 0.7),
        (center_x, center_y + cube_s * 1.3)
    ]
    border_draw.polygon(right_points, fill=(14, 116, 144, 240), outline=(6, 182, 212, 255))

    # Add stylized "S" glow symbol in center
    s_poly = [
        (center_x - 45 * s, center_y - 80 * s),
        (center_x + 35 * s, center_y - 80 * s),
        (center_x + 45 * s, center_y - 50 * s),
        (center_x - 15 * s, center_y - 20 * s),
        (center_x + 40 * s, center_y + 20 * s),
        (center_x + 30 * s, center_y + 70 * s),
        (center_x - 45 * s, center_y + 70 * s),
        (center_x - 45 * s, center_y + 40 * s),
        (center_x + 15 * s, center_y + 15 * s),
        (center_x - 40 * s, center_y - 25 * s),
        (center_x - 30 * s, center_y - 70 * s),
    ]
    border_draw.line(s_poly, fill=(255, 255, 255, 240), width=int(12 * s), joint="curve")

    # Corner power indicators / speed streaks
    streak_y = center_y + 160 * s
    border_draw.line([(center_x - 80 * s, streak_y), (center_x + 80 * s, streak_y)], fill=(6, 182, 212, 200), width=int(4 * s))
    border_draw.line([(center_x - 40 * s, streak_y + 14 * s), (center_x + 40 * s, streak_y + 14 * s)], fill=(139, 92, 246, 200), width=int(3 * s))

    return img

if __name__ == "__main__":
    icon512 = create_shadow_launcher_icon(512)
    icon512.save("/home/ubuntu/ShadowLauncher/website/icon-512.png")
    icon512.save("/home/ubuntu/ShadowLauncher/android/res/mipmap-xxhdpi/ic_launcher.png")

    icon180 = create_shadow_launcher_icon(180)
    icon180.save("/home/ubuntu/ShadowLauncher/website/icon-180.png")

    icon96 = create_shadow_launcher_icon(96)
    icon96.save("/home/ubuntu/ShadowLauncher/android/res/drawable/ic_launcher.png")
    
    print("Shadow Launcher icons generated successfully.")
