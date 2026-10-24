from pathlib import Path
import base64, subprocess, math, json

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / 'assets'
ASSETS.mkdir(exist_ok=True)
fontfile = ASSETS / 'lesson.woff'
if not fontfile.exists():
    from fontTools import subset
    opts = subset.Options()
    opts.flavor = 'woff'
    font = subset.load_font('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', opts)
    sub = subset.Subsetter(options=opts)
    sub.populate(unicodes=list(range(0x20, 0x100)) + list(range(0x600, 0x700)) + list(range(0x750, 0x780)) + list(range(0x8A0, 0x900)) + list(range(0x2000, 0x2070)) + list(range(0xFB50, 0xFE00)) + list(range(0xFE70, 0xFF00)))
    sub.subset(font)
    subset.save_font(font, str(fontfile), opts)

video = ASSETS / 'riyadh-practice.mp4'
if not video.exists():
    from PIL import Image, ImageDraw
    proc = subprocess.Popen(['ffmpeg','-loglevel','error','-y','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s','640x360','-r','12','-i','-','-an','-vcodec','libx264','-pix_fmt','yuv420p','-movflags','+faststart',str(video)], stdin=subprocess.PIPE)
    for f in range(96):
        im=Image.new('RGB',(640,360),'#bfebed'); d=ImageDraw.Draw(im)
        for yy in range(280):
            t=yy/280
            d.line((0,yy,640,yy), fill=(int(183+57*t),int(229+12*t),int(233-16*t)))
        sunx=525-f*.2; d.ellipse((sunx-36,35,sunx+36,107),fill='#ffd36b')
        for bx,bw,bh,c in [(18,65,110,'#5b9fa9'),(98,78,151,'#417888'),(194,56,123,'#74b4bc'),(270,62,195,'#236c7d'),(353,65,135,'#88bcc0'),(440,66,173,'#498f9b'),(535,75,111,'#69a9b0')]:
            d.rounded_rectangle((bx,280-bh,bx+bw,280),radius=5,fill=c)
            if bx==270:
                d.polygon([(bx,85),(bx+bw/2,35),(bx+bw,85)],fill=c)
                d.rectangle((bx+18,100,bx+44,127),fill='#d4f0ef')
            for wx in range(bx+10,bx+bw-8,17):
                for wy in range(292-bh,269,22): d.rounded_rectangle((wx,wy,wx+7,wy+10),radius=2,fill='#ffe2a0')
        d.rectangle((0,277,640,360),fill='#e6cfaa')
        d.rounded_rectangle((0,310,640,342),radius=8,fill='#6a8694')
        for xx in range(-50,700,90): d.rectangle((xx,324,xx+42,327),fill='#fff8da')
        for xx in [45,225,400,585]:
            d.rectangle((xx,245,xx+5,294),fill='#ad8257')
            for a in [-1,0,1]: d.ellipse((xx-24+a*13,228-abs(a)*4,xx+28+a*13,257-abs(a)*4),fill='#418c71')
        cx=(f*7)%760-80
        d.rounded_rectangle((cx,304,cx+55,328),radius=8,fill='#ef996c')
        d.rounded_rectangle((cx+9,295,cx+42,315),radius=8,fill='#ef996c')
        d.rectangle((cx+15,299,cx+35,310),fill='#e1f2ed')
        d.ellipse((cx+8,320,cx+20,332),fill='#25485c');d.ellipse((cx+37,320,cx+49,332),fill='#25485c')
        proc.stdin.write(im.tobytes())
    proc.stdin.close(); proc.wait()
    if proc.returncode: raise RuntimeError('Video encoding failed')

template=(ROOT/'src/template.html').read_text()
template=template.replace('/*__STYLE__*/',(ROOT/'src/styles.css').read_text())
template=template.replace('/*__RENDERER__*/',(ROOT/'src/renderer.js').read_text())
template=template.replace('/*__APP__*/',(ROOT/'src/app.js').read_text())
template=template.replace('__FONT__',base64.b64encode(fontfile.read_bytes()).decode())
template=template.replace('__VIDEO__',base64.b64encode(video.read_bytes()).decode())
(ROOT/'dist').mkdir(exist_ok=True)
(ROOT/'dist/index.html').write_text(template)
print(json.dumps({'output':str(ROOT/'dist/index.html'),'bytes':len(template.encode()),'video_bytes':video.stat().st_size,'font_bytes':fontfile.stat().st_size}))
