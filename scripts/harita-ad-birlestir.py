"""Kuyruk 19D: bir haritanın bütün dosyaları aynı ad tabanını taşısın (bir kerelik; git mv). Depo kökünde çalıştırılır.

<ad> = ilk varyantın görsel adı (kaydın `gorsel` alanı "<bolge>/<ad>"). JSON içindeki `id` ve `gorsel` DEĞİŞMEZ.
  harita/<bolge>/<kimlik>.json            → harita/<bolge>/<ad>.json
  onizleme/<kimlik>-izgara(siz).png       → onizleme/<ad>-izgara(siz).png  (ayrı görselli varyantta <ad>-<varyant>)
  prompt/<kimlik>.md                      → prompt/<ad>.md
  duzeltme/<kimlik>.json                  → duzeltme/<ad>.json (varsa)
D2: harita dışı denetim belgeleri harita/belgeler/ → docs/.
"""
import glob, json, os, subprocess

def mv(a, b):
    if a == b or not os.path.exists(a):
        return
    os.makedirs(os.path.dirname(b), exist_ok=True)
    subprocess.run(['git', 'mv', a, b], check=True)
    print(f'{a} -> {b}')

taken = set()
for f in sorted(glob.glob('harita/*/*.json')):
    d = f.split('/')[1]
    if d in ('_ortak', 'belgeler'):
        continue
    m = json.load(open(f, encoding='utf-8'))
    bolge, ad = m['gorsel'].split('/')
    base = ad if (bolge, ad) not in taken else f'{ad}-2'  # aynı ada düşen ikinci haritaya -2
    taken.add((bolge, base))
    mid = m['id']
    mv(f, f'harita/{bolge}/{base}.json')
    images = {v['image'] for v in m['variants']}
    for v in m['variants']:
        old = mid if len(images) <= 1 else f"{mid}-{v['id']}"
        new = base if len(images) <= 1 else f"{base}-{v['id']}"
        for suf in ['-izgara.png', '-izgarasiz.png']:
            mv(f'harita/{bolge}/onizleme/{old}{suf}', f'harita/{bolge}/onizleme/{new}{suf}')
        mv(f'harita/{bolge}/prompt/{old}.md', f'harita/{bolge}/prompt/{new}.md')
    mv(f'harita/{bolge}/duzeltme/{mid}.json', f'harita/{bolge}/duzeltme/{base}.json')

for f in ['BUYU-DENETIMI.md', 'BUYU-DENETIMI-4-5.md', 'SALDIRI-DENETIMI.md', 'UPCAST.md', 'ALT-IRK-GORSEL.md', 'canavar-listesi.csv']:
    mv(f'harita/belgeler/{f}', f'docs/{f}')
