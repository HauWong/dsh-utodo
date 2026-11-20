from PIL import Image, ImageDraw
import math
S = 4
W = 180 * S
img = Image.new('RGBA', (W, W), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
r = 40 * S
d.rounded_rectangle([0, 0, W - 1, W - 1], radius=r, fill='#F7F3EC', outline='#E3DACA', width=2 * S)
accent = '#E0A15B'
ink = '#2E2A26'
mute = '#C7BFB2'
rows = [52, 90, 128]
for i, y in enumerate(rows):
    cy = y * S
    cx = 42 * S
    rad = 9 * S
    box = [cx - rad, cy - rad, cx + rad, cy + rad]
    if i < 2:
        d.ellipse(box, fill=accent)
        d.line([(cx - 4.2 * S, cy + 0.2 * S), (cx - 1.2 * S, cy + 3.2 * S), (cx + 4.4 * S, cy - 3.4 * S)], fill='#FFFFFF', width=int(2.2 * S), joint='curve')
    else:
        d.ellipse(box, outline=mute, width=int(1.8 * S))
    bar = [70 * S, cy - 5 * S, (70 + 68) * S if i != 2 else (70 + 52) * S, cy + 5 * S]
    d.rounded_rectangle(bar, radius=5 * S, fill=ink if i < 2 else mute)
img = img.resize((180, 180), Image.LANCZOS)
img.save('assets/icon-180.png')
print('saved', img.size)