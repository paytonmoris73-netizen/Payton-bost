"""Draws the FRXST app icon (frost crystal on an ice-blue tile) as a multi-size .ico."""

import math
import sys

from PIL import Image, ImageDraw

S = 1024  # drawn large, downsampled for clean edges
img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
grad = Image.new("RGBA", (S, S))
px = grad.load()
for y in range(S):
    for x in range(S):
        t = (x + y) / (2 * S - 2)
        # #9cecff -> #5ccbff -> #4d86ff
        if t < 0.45:
            u = t / 0.45
            c = (156 + (92 - 156) * u, 236 + (203 - 236) * u, 255)
        else:
            u = (t - 0.45) / 0.55
            c = (92 + (77 - 92) * u, 203 + (134 - 203) * u, 255)
        px[x, y] = (int(c[0]), int(c[1]), int(c[2]), 255)
mask = Image.new("L", (S, S), 0)
ImageDraw.Draw(mask).rounded_rectangle((32, 32, S - 32, S - 32), radius=230, fill=255)
img.paste(grad, (0, 0), mask)

d = ImageDraw.Draw(img)
ink = (4, 18, 28, 255)
cx = cy = S / 2
R, w = 330, 58
for k in range(6):
    a = math.radians(90 + k * 60)
    ex, ey = cx + R * math.cos(a), cy - R * math.sin(a)
    d.line([(cx, cy), (ex, ey)], fill=ink, width=w)
    # branch tips
    for side in (-1, 1):
        b = a + side * math.radians(40)
        mx, my = cx + R * 0.62 * math.cos(a), cy - R * 0.62 * math.sin(a)
        d.line([(mx, my), (mx + 120 * math.cos(b), my - 120 * math.sin(b))], fill=ink, width=int(w * 0.8))
    d.ellipse((ex - w / 2, ey - w / 2, ex + w / 2, ey + w / 2), fill=ink)
d.ellipse((cx - 70, cy - 70, cx + 70, cy + 70), fill=ink)

img = img.resize((256, 256), Image.LANCZOS)
img.save(sys.argv[1] if len(sys.argv) > 1 else "frxst.ico",
         sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
