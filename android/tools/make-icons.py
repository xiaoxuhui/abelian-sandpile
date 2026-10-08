from pathlib import Path
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
RES=ROOT/'app/src/main/res'
PALETTE=['#ead8b8','#d79f56','#678e88','#374a52']
PATTERN=[[0,1,2,1,0],[1,2,3,2,1],[2,3,0,3,2],[1,2,3,2,1],[0,1,2,1,0]]
def grid(image, size):
    draw=ImageDraw.Draw(image); step=size/5; start=(1024-size)/2
    for y,row in enumerate(PATTERN):
        for x,n in enumerate(row):
            a=start+x*step+step*.06; b=start+y*step+step*.06
            draw.rounded_rectangle((a,b,a+step*.88,b+step*.88),radius=step*.14,fill=PALETTE[n])
    draw.ellipse((476,476,548,548),fill='#fff4d7')
full=Image.new('RGBA',(1024,1024),'#f4efe4');grid(full,740)
foreground=Image.new('RGBA',(1024,1024),(0,0,0,0));grid(foreground,560)
source=ROOT/'icon-source';source.mkdir(exist_ok=True)
full.save(source/'icon-full.png');foreground.save(source/'icon-foreground.png')
for density,scale in [('mdpi',1),('hdpi',1.5),('xhdpi',2),('xxhdpi',3),('xxxhdpi',4)]:
    folder=RES/f'mipmap-{density}';folder.mkdir(parents=True,exist_ok=True)
    full.resize((int(48*scale),int(48*scale)),Image.Resampling.LANCZOS).save(folder/'ic_launcher.png')
    foreground.resize((int(108*scale),int(108*scale)),Image.Resampling.LANCZOS).save(folder/'ic_launcher_foreground.png')
print('Generated 10 density icons and 2 archived geometric sources')
