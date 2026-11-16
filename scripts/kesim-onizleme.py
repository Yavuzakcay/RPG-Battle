import importlib.util,sys,os


spec=importlib.util.spec_from_file_location('tk','scripts/toplu-kesim.py');tk=importlib.util.module_from_spec(spec);spec.loader.exec_module(tk)
from PIL import Image,ImageDraw
samples=[('cleric','male','elf',9,'Dark Elf Cleric Birlik'),('barbarian','male','dwarf',1,'Dwarf Barbarian Varis'),('barbarian','male','dwarf',8,'Dwarf Barbarian Cilgin'),('paladin','male','elf',10,'Dark Elf Paladin Hizir'),('barbarian','male','celestial',8,'Celestial Barbarian hale'),('warlock','female','celestial',8,'Celestial Warlock')]
cache={}
pre={'warlock':'WL-','sorcerer':'SC-'}
W=256;im=Image.new('RGB',(W*len(samples),W*2+20),(96,100,112));d=ImageDraw.Draw(im)
for i,(cls,g,race,n,label) in enumerate(samples):
    gen=tk.GEN[g]
    path=f'assets-ham/karakter/{cls}-{g}-{race}.jpg'
    if (cls,g,race) not in cache: cache[(cls,g,race)]=tk.process_cc((cls,path))
    res,toks=cache[(cls,g,race)]
    old=Image.open(f'public/characters/{race}-{gen}-{cls}-{pre.get(cls,"ID")}{n}.webp').convert('RGBA')
    new=toks.get(n)
    im.paste(old,(i*W,20),old)
    if new is not None: im.paste(new,(i*W,W+20),new)
    d.text((i*W+4,4),label,fill=(255,255,255))
    print(label,'yeni' if new is not None else 'YOK',res['uyari'],res['elle'])
os.makedirs('docs/sabah',exist_ok=True)
im.save('docs/sabah/kesim-onizleme-is1.png')
