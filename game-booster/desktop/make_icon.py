"""Draws the FRXST app icon (blue→purple tile with a lightning bolt) as a multi-size .ico."""

import sys

from PIL import Image, ImageDraw

S = 256
img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
grad = Image.new("RGBA", (S, S))
px = grad.load()
for y in range(S):
    for x in range(S):
        t = (x + y) / (2 * S - 2)
        px[x, y] = (int(75 + (155 - 75) * t), int(142 + (109 - 142) * t), int(248 + (255 - 248) * t), 255)
mask = Image.new("L", (S, S), 0)
ImageDraw.Draw(mask).rounded_rectangle((8, 8, S - 8, S - 8), radius=58, fill=255)
img.paste(grad, (0, 0), mask)
bolt = [(148, 34), (70, 142), (122, 142), (100, 222), (186, 108), (132, 108), (148, 34)]
ImageDraw.Draw(img).polygon(bolt, fill=(255, 255, 255, 255))
img.save(sys.argv[1] if len(sys.argv) > 1 else "frxst.ico",
         sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
