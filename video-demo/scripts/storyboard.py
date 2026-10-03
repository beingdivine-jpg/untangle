"""Build a review contact sheet and poster from rendered composition frames."""
from pathlib import Path
import re
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
output = root / 'output'
files = sorted((p for p in (output / 'stills').glob('*.png') if re.fullmatch(r'\d+-\d+', p.stem)), key=lambda p: float(p.stem.replace('-', '.')))
w, h, label = 640, 360, 36
board = Image.new('RGB', (w*2, (h+label)*((len(files)+1)//2)), '#ede5da')
draw = ImageDraw.Draw(board)
for index, file in enumerate(files):
    frame = Image.open(file).convert('RGB')
    frame.thumbnail((w,h), Image.Resampling.LANCZOS)
    x, y = index%2*w, index//2*(h+label)
    board.paste(frame,(x,y))
    draw.text((x+18,y+h+10), file.stem.replace('-', '.')+' seconds', fill='#322b2a')
board.save(output/'storyboard.jpg',quality=93)
Image.open(output/'stills/59-97.png').convert('RGB').save(output/'poster.jpg',quality=95)
print('Storyboard and poster exported.')
