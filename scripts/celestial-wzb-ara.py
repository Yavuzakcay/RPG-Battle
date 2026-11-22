#!/usr/bin/env python3
"""Celestial final kontrol, görev 1: erkek Wizard WZ-B1/B2/B3/B4/B7 için assets-ham/ altındaki BÜTÜN görsellerde (karakter/, eksikler/, _eski/)
figür taraması: her figürün alt gövdesi (üst %35 hariç: hale/baş farkı) 48×48 ön-çarpımlı RGB ile jetonun alt gövdesine karşı ortalama mutlak fark.
`python3 scripts/celestial-wzb-ara.py <çıktı.json>` → en yakın 8 aday (sonra gözle hale denetimi). Yalnız rapor."""
import glob, importlib.util, json, os, sys
import numpy as np
from multiprocessing import Pool
from PIL import Image
from scipy import ndimage as ndi
s=importlib.util.spec_from_file_location('cc','scripts/cc-kesim.py'); cc=importlib.util.module_from_spec(s); s.loader.exec_module(cc)
TG=['B1','B2','B3','B4','B7']
def sig(rgba):
    al=rgba[...,3]>127; ys,xs=np.where(al)
    if len(ys)<50: return None
    top=int(ys.min()+0.35*(ys.max()-ys.min())); y1=ys.max()+1; x0,x1=xs.min(),xs.max()+1
    crop=rgba[top:y1,x0:x1].copy(); crop[crop[...,3]<128]=0
    im=Image.fromarray(crop,'RGBA').resize((48,48),Image.BILINEAR)
    a=np.array(im).astype(float); return a[...,:3]*(a[...,3:]/255.0)
REF={c:sig(np.array(Image.open(f'public/characters/celestial-erkek-wizard-WZ-{c}.webp').convert('RGBA'))) for c in TG}
def job(path):
    out=[]
    try:
        a=np.asarray(Image.open(path).convert('RGB')); H,W=a.shape[:2]
        if max(H,W)>3500: return out
        fg=cc.key_page(a); figs,lab=cc.figures(fg,min_frac=0.004,join=12)
        for k,(i,(x0,y0,x1,y1),c,n) in enumerate(cc.reading_order(figs,H),1):
            m=(lab[y0:y1,x0:x1]==i)&fg[y0:y1,x0:x1]
            rgba=np.dstack([a[y0:y1,x0:x1],(m*255).astype(np.uint8)]); sg=sig(rgba)
            if sg is None: continue
            for t,r in REF.items():
                d=float(np.abs(sg-r).mean()); out.append((t,d,path,k,(int(x0),int(y0),int(x1),int(y1))))
    except Exception as e: out.append(('HATA',0,path,str(e),None))
    return out
if __name__=='__main__':
    files=sorted(set(f for f in glob.glob('assets-ham/**/*',recursive=True) if f.lower().endswith(('.jpg','.png','.jpeg','.webp'))))
    print(len(files),'dosya',file=sys.stderr)
    with Pool(4) as p: res=[x for r in p.map(job,files,chunksize=2) for x in r]
    json.dump(res,open(sys.argv[1],'w'))
    errs=[r for r in res if r[0]=='HATA']; print('hata',len(errs),errs[:3])
    for t in TG:
        best=sorted([r for r in res if r[0]==t],key=lambda r:r[1])[:8]
        print(t); [print('  %.1f'%r[1], r[2], 'figür',r[3]) for r in best]
