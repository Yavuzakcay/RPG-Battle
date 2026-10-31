"""TARİHÇE (bir kez çalıştı; Kuyruk 19D sonrası harita dosyaları <ad>.json, bkz. scripts/harita-ad-birlestir.py).

Kuyruk 19C: harita dosyalarını tek köke taşır (bir kerelik; git mv, tarihçe korunur). Depo kökünde çalıştırılır.

harita/<bolge>/<kimlik>.json                 ← data/maps/<kimlik>.json (bölge kaydın `bolge` alanından)
harita/<bolge>/gorsel/<bolge>-<ad>.jpg       ← docs/harita/referans/<bolge>/*.jpg
harita/<bolge>/onizleme/<kimlik>-*.png       ← docs/harita/onizleme/ (önizleme anahtarının haritasının bölgesi)
harita/<bolge>/prompt/<kimlik>.md            ← docs/harita/prompt/
harita/belgeler/                              ← docs/harita/ kökündeki dosyalar
harita/_ortak/                                ← data/harita-bolgeleri.json, data/harita-referans.json
Üretilen README'ler (docs/harita/referans/<bolge>/README.md, data/maps/duzeltme/README.md, docs/harita/README.md)
silinir; `npm run varlik-indeks` yenilerini yazar.
"""
import json, os, subprocess

def mv(a, b):
    if not os.path.exists(a):
        return
    os.makedirs(os.path.dirname(b), exist_ok=True)
    subprocess.run(['git', 'mv', a, b], check=True)
    print(f'{a} -> {b}')

def rm(a):
    if os.path.exists(a):
        subprocess.run(['git', 'rm', '-q', a], check=True)
        print(f'{a} silindi (üretilen)')

maps = {}
for fn in sorted(os.listdir('data/maps')):
    if fn.endswith('.json'):
        m = json.load(open(f'data/maps/{fn}', encoding='utf-8'))
        maps[m['id']] = m

# Önizleme/prompt anahtarı → bölge (src/map/mapArt.ts previewKey ile aynı kural).
key_bolge = {}
for m in maps.values():
    images = {v['image'] for v in m['variants']}
    for v in m['variants']:
        key_bolge[m['id'] if len(images) <= 1 else f"{m['id']}-{v['id']}"] = m['bolge']

for mid, m in maps.items():
    mv(f'data/maps/{mid}.json', f"harita/{m['bolge']}/{mid}.json")

REF = 'docs/harita/referans'
for b in sorted(os.listdir(REF)):
    for f in sorted(os.listdir(f'{REF}/{b}')):
        if f == 'README.md':
            rm(f'{REF}/{b}/{f}')
        else:
            mv(f'{REF}/{b}/{f}', f'harita/{b}/gorsel/{f}')

for f in sorted(os.listdir('docs/harita/onizleme')):
    key = f.rsplit('-izgara', 1)[0]
    mv(f'docs/harita/onizleme/{f}', f'harita/{key_bolge[key]}/onizleme/{f}')
for f in sorted(os.listdir('docs/harita/prompt')):
    key = f[:-3]
    mv(f'docs/harita/prompt/{f}', f'harita/{key_bolge[key]}/prompt/{f}')

rm('data/maps/duzeltme/README.md')
rm('docs/harita/README.md')
for f in sorted(os.listdir('docs/harita')):
    if os.path.isfile(f'docs/harita/{f}'):
        mv(f'docs/harita/{f}', f'harita/belgeler/{f}')

for f in ['harita-bolgeleri.json', 'harita-referans.json']:
    mv(f'data/{f}', f'harita/_ortak/{f}')
