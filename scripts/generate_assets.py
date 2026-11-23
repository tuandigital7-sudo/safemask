#!/usr/bin/env python3
"""
SafeMask Brand & Store Asset Generator
Generates crisp Shield+Lock Emerald-on-Obsidian icons, splash screens,
Android feature graphic, and iPhone 6.7" App Store screenshots (EN & VI).
"""
import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, "public")
ICONS_DIR = os.path.join(PUBLIC, "icons")
STORE_IOS = os.path.join(ROOT, "store-assets", "ios")
STORE_ANDROID = os.path.join(ROOT, "store-assets", "android")
SS_EN = os.path.join(STORE_IOS, "screenshots-en")
SS_VI = os.path.join(STORE_IOS, "screenshots-vi")

for d in [ICONS_DIR, STORE_IOS, STORE_ANDROID, SS_EN, SS_VI]:
    os.makedirs(d, exist_ok=True)

BG_DARK = (8, 10, 13)
GRAPHITE = (17, 22, 29)
SURFACE = (24, 31, 41)
EMERALD = (16, 185, 129)
EMERALD_BRIGHT = (0, 230, 118)
EMERALD_DEEP = (5, 122, 85)
WHITE = (244, 247, 250)
MUTED = (148, 163, 184)


def load_font(size: int, bold: bool = False):
    candidates = [
        "/System/Library/Fonts/SFNS.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()


def draw_shield_lock_icon(size: int, maskable: bool = False, opaque: bool = True) -> Image.Image:
    # Draw at 2x for crisp anti-aliasing
    s = size * 2
    mode = "RGB" if opaque else "RGBA"
    img = Image.new(mode, (s, s), BG_DARK if opaque else (0, 0, 0, 0))
    draw = ImageDraw.Draw(img, "RGBA")

    # Subtle radial emerald glow
    glow = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    r_glow = int(s * 0.36)
    gd.ellipse((s // 2 - r_glow, s // 2 - r_glow, s // 2 + r_glow, s // 2 + r_glow), fill=(16, 185, 129, 42))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=int(s * 0.09)))
    if opaque:
        base_rgba = img.convert("RGBA")
        base_rgba = Image.alpha_composite(base_rgba, glow)
        img = base_rgba.convert("RGB")
        draw = ImageDraw.Draw(img, "RGBA")
    else:
        img = Image.alpha_composite(img, glow)
        draw = ImageDraw.Draw(img, "RGBA")

    scale = 0.72 if maskable else 0.84
    cx, cy = s // 2, s // 2

    def shield_poly(sc: float):
        w = int(s * 0.34 * sc)
        top = int(cy - s * 0.40 * sc)
        shoulder_y = int(cy - s * 0.28 * sc)
        mid_y = int(cy + s * 0.05 * sc)
        bot_y = int(cy + s * 0.42 * sc)
        pts = [
            (cx, top),
            (cx + w, shoulder_y),
            (cx + w, mid_y),
            (cx + int(w * 0.68), int(cy + s * 0.27 * sc)),
            (cx, bot_y),
            (cx - int(w * 0.68), int(cy + s * 0.27 * sc)),
            (cx - w, mid_y),
            (cx - w, shoulder_y),
        ]
        return pts

    # Outer emerald shield
    draw.polygon(shield_poly(scale), fill=EMERALD)
    # Inner dark shield
    draw.polygon(shield_poly(scale * 0.86), fill=GRAPHITE)

    # Lock shackle
    sh_w = int(s * 0.115 * scale)
    sh_top = int(cy - s * 0.17 * scale)
    sh_bot = int(cy + s * 0.02 * scale)
    stroke = max(6, int(s * 0.044 * scale))
    draw.arc(
        (cx - sh_w, sh_top, cx + sh_w, sh_top + sh_w * 2),
        start=180,
        end=360,
        fill=EMERALD_BRIGHT,
        width=stroke,
    )
    draw.line((cx - sh_w, sh_top + sh_w, cx - sh_w, sh_bot), fill=EMERALD_BRIGHT, width=stroke)
    draw.line((cx + sh_w, sh_top + sh_w, cx + sh_w, sh_bot), fill=EMERALD_BRIGHT, width=stroke)

    # Lock body
    lb_w = int(s * 0.165 * scale)
    lb_top = int(cy - s * 0.02 * scale)
    lb_bot = int(cy + s * 0.22 * scale)
    rad = int(s * 0.045 * scale)
    draw.rounded_rectangle((cx - lb_w, lb_top, cx + lb_w, lb_bot), radius=rad, fill=EMERALD)

    # Keyhole
    kr = int(s * 0.032 * scale)
    ky = int(cy + s * 0.075 * scale)
    draw.ellipse((cx - kr, ky - kr, cx + kr, ky + kr), fill=BG_DARK)
    kw = int(s * 0.017 * scale)
    draw.rounded_rectangle((cx - kw, ky, cx + kw, ky + int(s * 0.08 * scale)), radius=kw, fill=BG_DARK)

    return img.resize((size, size), Image.Resampling.LANCZOS)


def generate_icons():
    icon_1024 = draw_shield_lock_icon(1024, maskable=False, opaque=True)
    icon_1024.save(os.path.join(STORE_IOS, "AppIcon-1024.png"), "PNG")

    icon_512 = draw_shield_lock_icon(512, maskable=False, opaque=True)
    icon_512.save(os.path.join(ICONS_DIR, "icon-512.png"), "PNG")
    icon_512.save(os.path.join(STORE_ANDROID, "AppIcon-512.png"), "PNG")

    maskable_512 = draw_shield_lock_icon(512, maskable=True, opaque=True)
    maskable_512.save(os.path.join(ICONS_DIR, "maskable-icon-512.png"), "PNG")

    icon_192 = icon_512.resize((192, 192), Image.Resampling.LANCZOS)
    icon_192.save(os.path.join(ICONS_DIR, "icon-192.png"), "PNG")

    apple_180 = icon_512.resize((180, 180), Image.Resampling.LANCZOS)
    apple_180.save(os.path.join(PUBLIC, "apple-touch-icon.png"), "PNG")

    fav32 = icon_512.resize((32, 32), Image.Resampling.LANCZOS)
    fav32.save(os.path.join(PUBLIC, "favicon-32x32.png"), "PNG")
    fav16 = icon_512.resize((16, 16), Image.Resampling.LANCZOS)
    fav16.save(os.path.join(PUBLIC, "favicon-16x16.png"), "PNG")
    icon_512.resize((64, 64), Image.Resampling.LANCZOS).save(
        os.path.join(PUBLIC, "favicon.ico"), format="ICO", sizes=[(16, 16), (32, 32), (48, 48)]
    )

    # Splash 2732x2732 (Capacitor standard)
    splash = Image.new("RGB", (2732, 2732), BG_DARK)
    logo_mid = draw_shield_lock_icon(640, maskable=False, opaque=True)
    splash.paste(logo_mid, ((2732 - 640) // 2, (2732 - 640) // 2 - 120))
    sd = ImageDraw.Draw(splash)
    f_title = load_font(120, bold=True)
    f_sub = load_font(54, bold=False)
    sd.text((1366, 1740), "SafeMask", fill=WHITE, font=f_title, anchor="mm")
    sd.text((1366, 1850), "Hide it. Share it. Stay safe.", fill=EMERALD, font=f_sub, anchor="mm")
    splash.save(os.path.join(ROOT, "store-assets", "splash-2732x2732.png"), "PNG")

    # Android Feature Graphic 1024x500
    fg = Image.new("RGB", (1024, 500), BG_DARK)
    fgd = ImageDraw.Draw(fg, "RGBA")
    fgd.ellipse((50, 50, 450, 450), fill=(16, 185, 129, 28))
    logo_fg = draw_shield_lock_icon(240, maskable=False, opaque=True)
    fg.paste(logo_fg, (110, 130))
    fgd.text((400, 185), "SafeMask", fill=WHITE, font=load_font(76, bold=True))
    fgd.text((400, 275), "Privacy Toolkit", fill=EMERALD_BRIGHT, font=load_font(40, bold=True))
    fgd.text((400, 335), "Hide it. Share it. Stay safe.", fill=MUTED, font=load_font(28, bold=False))
    fg.save(os.path.join(STORE_ANDROID, "FeatureGraphic-1024x500.png"), "PNG")


def draw_screenshot(out_path: str, badge: str, headline: str, subline: str, visual_type: str):
    W, H = 1290, 2796
    img = Image.new("RGB", (W, H), BG_DARK)
    draw = ImageDraw.Draw(img, "RGBA")

    # Top ambient emerald glow
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((145, -180, 1145, 780), fill=(16, 185, 129, 36))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=140))
    img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")
    draw = ImageDraw.Draw(img, "RGBA")

    # Badge pill
    f_badge = load_font(38, bold=True)
    draw.rounded_rectangle((W // 2 - 220, 150, W // 2 + 220, 224), radius=37, fill=(16, 185, 129, 34), outline=EMERALD, width=3)
    draw.text((W // 2, 187), badge.upper(), fill=EMERALD_BRIGHT, font=f_badge, anchor="mm")

    # Headline (wrap up to 2 lines)
    f_head = load_font(86, bold=True)
    f_sub = load_font(44, bold=False)
    lines = headline.split("\n")
    y = 330
    for ln in lines:
        draw.text((W // 2, y), ln, fill=WHITE, font=f_head, anchor="mm")
        y += 106
    draw.text((W // 2, y + 32), subline, fill=MUTED, font=f_sub, anchor="mm")

    # Phone device frame mockup
    px1, py1, px2, py2 = 135, 760, W - 135, H - 150
    draw.rounded_rectangle((px1 - 14, py1 - 14, px2 + 14, py2 + 14), radius=104, fill=(32, 40, 52), outline=(56, 70, 88), width=4)
    draw.rounded_rectangle((px1, py1, px2, py2), radius=92, fill=GRAPHITE)
    # Dynamic island notch
    draw.rounded_rectangle((W // 2 - 140, py1 + 36, W // 2 + 140, py1 + 92), radius=28, fill=(5, 6, 8))

    # Header inside phone
    logo_sm = draw_shield_lock_icon(72, opaque=True)
    img.paste(logo_sm, (px1 + 56, py1 + 135))
    draw.text((px1 + 148, py1 + 170), "SafeMask", fill=WHITE, font=load_font(44, bold=True), anchor="lm")
    draw.rounded_rectangle((px2 - 210, py1 + 142, px2 - 56, py1 + 198), radius=28, fill=(16, 185, 129, 40), outline=EMERALD, width=2)
    draw.text((px2 - 133, py1 + 170), "LOCAL", fill=EMERALD_BRIGHT, font=load_font(26, bold=True), anchor="mm")

    # Visual content per screen
    cx1, cy1, cx2, cy2 = px1 + 56, py1 + 260, px2 - 56, py2 - 120
    draw.rounded_rectangle((cx1, cy1, cx2, cy2), radius=48, fill=SURFACE, outline=(42, 54, 68), width=3)

    if visual_type == "home":
        # 2x3 visual cards
        card_titles = ["Image Shield", "AI Privacy", "PDF Shield", "Smart OCR", "Clean EXIF", "Batch Mode"]
        cw = (cx2 - cx1 - 90) // 2
        ch = 360
        for i, title in enumerate(card_titles):
            col = i % 2
            row = i // 2
            x0 = cx1 + 30 + col * (cw + 30)
            y0 = cy1 + 80 + row * (ch + 34)
            draw.rounded_rectangle((x0, y0, x0 + cw, y0 + ch), radius=34, fill=GRAPHITE, outline=(36, 48, 62), width=2)
            draw.rounded_rectangle((x0 + 28, y0 + 28, x0 + 116, y0 + 116), radius=24, fill=(16, 185, 129, 34))
            draw.ellipse((x0 + 52, y0 + 52, x0 + 92, y0 + 92), fill=EMERALD)
            draw.text((x0 + 30, y0 + 210), title, fill=WHITE, font=load_font(38, bold=True))
            draw.rounded_rectangle((x0 + 30, y0 + 275, x0 + cw - 50, y0 + 295), radius=10, fill=(40, 52, 66))
    elif visual_type in ("ocr", "redact"):
        # Mock ID card / Document with redacted emerald/black bars
        draw.rounded_rectangle((cx1 + 54, cy1 + 120, cx2 - 54, cy1 + 860), radius=36, fill=(28, 36, 48), outline=(58, 72, 90), width=3)
        draw.text((cx1 + 100, cy1 + 180), "ID DOCUMENT PREVIEW", fill=EMERALD_BRIGHT, font=load_font(32, bold=True))
        # Avatar placeholder
        draw.rounded_rectangle((cx1 + 100, cy1 + 260, cx1 + 320, cy1 + 540), radius=24, fill=(45, 58, 74))
        # Redacted bars
        bars = [
            (cx1 + 360, cy1 + 290, cx2 - 110, cy1 + 350, "BLACKOUT"),
            (cx1 + 360, cy1 + 400, cx2 - 160, cy1 + 460, "BLUR"),
            (cx1 + 360, cy1 + 510, cx2 - 130, cy1 + 570, "PIXELATE"),
            (cx1 + 100, cy1 + 640, cx2 - 120, cy1 + 710, "ID NUMBER HIDDEN"),
        ]
        for bx1, by1, bx2, by2, lbl in bars:
            fill_c = (8, 10, 13) if visual_type == "redact" else (16, 185, 129, 60)
            draw.rounded_rectangle((bx1, by1, bx2, by2), radius=14, fill=fill_c, outline=EMERALD, width=4)
            draw.text(((bx1 + bx2) // 2, (by1 + by2) // 2), lbl, fill=EMERALD_BRIGHT, font=load_font(26, bold=True), anchor="mm")
        # Action pill
        draw.rounded_rectangle((cx1 + 80, cy2 - 220, cx2 - 80, cy2 - 96), radius=48, fill=EMERALD)
        draw.text((W // 2, cy2 - 158), "Apply Redaction & Export", fill=BG_DARK, font=load_font(40, bold=True), anchor="mm")
    elif visual_type == "pdf":
        draw.rounded_rectangle((cx1 + 70, cy1 + 90, cx2 - 70, cy2 - 260), radius=24, fill=(235, 240, 246))
        draw.text((cx1 + 120, cy1 + 150), "CONTRACT_2026.PDF", fill=(20, 26, 34), font=load_font(34, bold=True))
        for ry in range(250, 960, 110):
            draw.rounded_rectangle((cx1 + 120, cy1 + ry, cx2 - 140, cy1 + ry + 34), radius=8, fill=(180, 192, 206))
        # Permanent black redaction blocks
        draw.rounded_rectangle((cx1 + 120, cy1 + 350, cx2 - 220, cy1 + 430), radius=10, fill=(8, 10, 13))
        draw.rounded_rectangle((cx1 + 120, cy1 + 570, cx2 - 180, cy1 + 650), radius=10, fill=(8, 10, 13))
        draw.rounded_rectangle((cx1 + 80, cy2 - 200, cx2 - 80, cy2 - 86), radius=42, fill=EMERALD)
        draw.text((W // 2, cy2 - 143), "Export Rasterized PDF", fill=BG_DARK, font=load_font(38, bold=True), anchor="mm")
    elif visual_type == "ai":
        draw.text((cx1 + 56, cy1 + 80), "SANITIZED FOR AI", fill=EMERALD_BRIGHT, font=load_font(32, bold=True))
        lines_ai = [
            ("Contact me at ", "[PHONE_1]"),
            ("Email address: ", "[EMAIL_1]"),
            ("National ID: ", "[ID_1]"),
            ("Bank Account: ", "[ACCOUNT_1]"),
            ("Home Address: ", "[ADDRESS_1]"),
        ]
        ly = cy1 + 200
        for prefix, token in lines_ai:
            draw.rounded_rectangle((cx1 + 44, ly, cx2 - 44, ly + 110), radius=24, fill=GRAPHITE, outline=(40, 52, 66), width=2)
            draw.text((cx1 + 80, ly + 55), prefix, fill=MUTED, font=load_font(34), anchor="lm")
            draw.rounded_rectangle((cx2 - 340, ly + 22, cx2 - 74, ly + 88), radius=18, fill=(16, 185, 129, 40), outline=EMERALD, width=2)
            draw.text((cx2 - 207, ly + 55), token, fill=EMERALD_BRIGHT, font=load_font(30, bold=True), anchor="mm")
            ly += 150
        draw.rounded_rectangle((cx1 + 80, cy2 - 200, cx2 - 80, cy2 - 86), radius=42, fill=EMERALD)
        draw.text((W // 2, cy2 - 143), "Copy Safe Text", fill=BG_DARK, font=load_font(40, bold=True), anchor="mm")
    elif visual_type == "exif":
        items = [
            ("GPS Location", "20.4463° N, 106.3366° E", "REMOVED"),
            ("Camera Device", "iPhone 16 Pro Max", "REMOVED"),
            ("Capture Date", "2026-11-23 11:42:08", "REMOVED"),
            ("Lens & EXIF", "24mm f/1.78 ISO 64", "REMOVED"),
        ]
        ly = cy1 + 140
        for k, v, status in items:
            draw.rounded_rectangle((cx1 + 44, ly, cx2 - 44, ly + 160), radius=28, fill=GRAPHITE, outline=(40, 52, 66), width=2)
            draw.text((cx1 + 84, ly + 54), k, fill=WHITE, font=load_font(36, bold=True))
            draw.text((cx1 + 84, ly + 106), v, fill=MUTED, font=load_font(28))
            draw.rounded_rectangle((cx2 - 260, ly + 50, cx2 - 74, ly + 110), radius=24, fill=(16, 185, 129, 40), outline=EMERALD, width=2)
            draw.text((cx2 - 167, ly + 80), status, fill=EMERALD_BRIGHT, font=load_font(26, bold=True), anchor="mm")
            ly += 200
    else:  # on-device privacy
        logo_big = draw_shield_lock_icon(360, opaque=True)
        img.paste(logo_big, (W // 2 - 180, cy1 + 220))
        draw.text((W // 2, cy1 + 690), "100% On-Device Core", fill=WHITE, font=load_font(54, bold=True), anchor="mm")
        draw.text((W // 2, cy1 + 780), "Zero Cloud Uploads", fill=EMERALD_BRIGHT, font=load_font(42, bold=True), anchor="mm")
        draw.text((W // 2, cy1 + 870), "No Account Required", fill=MUTED, font=load_font(38), anchor="mm")

    img.save(out_path, "PNG")


def generate_screenshots():
    en_specs = [
        ("01-protect.png", "PRIVACY TOOLKIT", "Protect Your\nPersonal Data", "Hide it. Share it. Stay safe.", "home"),
        ("02-smart-ocr.png", "SMART OCR", "Auto-Detect\nSensitive Data", "Phones, emails, IDs & bank accounts", "ocr"),
        ("03-image-shield.png", "IMAGE SHIELD", "Redact Photos\nin Seconds", "Blackout, Blur, Pixelate & Watermark", "redact"),
        ("04-pdf-shield.png", "PDF SHIELD", "Protect Your\nPDF Documents", "Permanent rasterized redaction export", "pdf"),
        ("05-ai-privacy.png", "AI PRIVACY COPY", "Sanitize Text\nBefore AI", "Replace sensitive data with safe tokens", "ai"),
        ("06-metadata.png", "METADATA CLEANER", "Remove Hidden\nGPS & EXIF", "Verify clean output before sharing", "exif"),
        ("07-on-device.png", "ZERO UPLOADS", "Processed Locally\non Your Device", "Your files never leave your phone", "local"),
    ]
    vi_specs = [
        ("01-bao-ve.png", "BỘ CÔNG CỤ BẢO MẬT", "Bảo Vệ Thông Tin\nCá Nhân", "Che dữ liệu. Chia sẻ an toàn.", "home"),
        ("02-ocr.png", "QUÉT OCR CỤC BỘ", "Tự Động Phát Hiện\nDữ Liệu Nhạy Cảm", "SĐT, Email, CCCD & Số tài khoản", "ocr"),
        ("03-che-anh.png", "CHE ẢNH NHANH", "Che Ảnh Chỉ Trong\nVài Giây", "Blackout, Làm mờ, Pixelate & Đóng dấu", "redact"),
        ("04-pdf.png", "BẢO VỆ PDF", "Bảo Vệ Tài Liệu\nPDF An Toàn", "Xuất PDF rasterized xóa dữ liệu gốc", "pdf"),
        ("05-loc-ai.png", "LỌC VĂN BẢN AI", "Ẩn Dữ Liệu Trước\nKhi Gửi Cho AI", "Thay thế tự động bằng nhãn an toàn", "ai"),
        ("06-xoa-exif.png", "XÓA DỮ LIỆU ẨN", "Xóa GPS & EXIF\nKhỏi Hình Ảnh", "Kiểm chứng lại file xuất thực tế", "exif"),
        ("07-cuc-bo.png", "KHÔNG UPLOAD", "Xử Lý Trực Tiếp\nTrên Thiết Bị", "Không cần tài khoản. Riêng tư tối đa.", "local"),
    ]
    for fn, b, h, s, v in en_specs:
        draw_screenshot(os.path.join(SS_EN, fn), b, h, s, v)
    for fn, b, h, s, v in vi_specs:
        draw_screenshot(os.path.join(SS_VI, fn), b, h, s, v)


if __name__ == "__main__":
    generate_icons()
    generate_screenshots()
    print("Generated all SafeMask icons, splash screens, feature graphic, and EN/VI App Store screenshots.")
