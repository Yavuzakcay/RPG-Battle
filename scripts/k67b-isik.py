"""Kuyruk K67b/K67c: harita ışıklarının parlak ve loş yarıçapı (yalnız kural sürümü 51+ okunur; 50 ve öncesi
`lightRadiusHexes`).

Karanlık/gece kuralında ışık listesi olan her harita kuralına `brightRadiusHexes` ve `dimRadiusHexes`, mangal kuralına
(`brazierLight`) `brightRadius` ve `dimRadius` yazar. Meşale ve mangal: `TORCH` (K67c kullanıcı kararı: 10 ft parlak +
5 ft loş = 2 + 1 altıgen; SRD Torch'tan bilinçli sapma). SRD değerine dönmek için `TORCH = TORCH_SRD` (tek değer) ve
betiği yeniden çalıştır. Fener haritası (sehir-meydani) SRD Hooded Lantern 30 + 30 ft (6 + 6), değişmez. SRD'de mangal
yok: meşale değeri. Harita üreticilerinden (k27b, k28b, k34a, k35, col, orman, derinlikler…) SONRA çalıştırılır;
idempotent (var olan alanları günceller). Metin biçimi korunur (yalnız satır eklenir/değişir).

Kullanım: python scripts/k67b-isik.py [--kuru]
"""
import glob
import json
import re
import sys

# SRD Torch: "Bright Light in a 20-foot radius and Dim Light for an additional 20 feet" (4 + 4 altıgen).
TORCH_SRD = (4, 4)
# Kuyruk K67c (kullanıcı kararı): meşale ve mangal 10 ft parlak + 5 ft loş (2 + 1 altıgen; toplam 3). ⚠ SRD'den sapma.
TORCH_K67C = (2, 1)
TORCH = TORCH_K67C
LANTERN = (6, 6)
# Işık listesi fener olan haritalar (harita notu: "fenerlerin 4 altıgeni").
LANTERN_MAPS = {'sehir-meydani'}
# Meşale olmayan ışık listeleri: ay ışıklı açıklıklar (Dere Kenarı `orman`: "iki açıklık ay ışığında"); değişmez.
SKIP_MAPS = {'orman'}

def main() -> None:
    dry = '--kuru' in sys.argv
    touched = []
    for path in sorted(glob.glob('harita/*/*.json')):
        if '/belgeler/' in path.replace('\\', '/') or '/_ortak/' in path.replace('\\', '/'):
            continue
        text = open(path, encoding='utf-8').read()
        data = json.loads(text)
        wanted = []  # belge sırasıyla her "lightRadiusHexes" için (parlak, loş) ya da None
        braz = []
        def walk(o):
            if isinstance(o, dict):
                if 'lightRadiusHexes' in o:
                    skip = data.get('id') in SKIP_MAPS or not o.get('lights')
                    wanted.append(None if skip else LANTERN if data.get('id') in LANTERN_MAPS else TORCH)
                if o.get('id') == 'brazierLight':
                    braz.append(TORCH)
                for v in o.values():
                    walk(v)
            elif isinstance(o, list):
                for v in o:
                    walk(v)
        walk(data)
        # Eski eklemeleri kaldır (idempotent), sonra yeniden yaz.
        text2 = re.sub(r'\n[ \t]*"(brightRadiusHexes|dimRadiusHexes|brightRadius|dimRadius)": \d+,', '', text)
        out, i = [], 0
        for m in re.finditer(r'\n([ \t]*)"lightRadiusHexes": \d+', text2):
            v = wanted[i] if i < len(wanted) else None
            i += 1
            if v:
                ind = m.group(1)
                out.append((m.start(), f'\n{ind}"brightRadiusHexes": {v[0]},\n{ind}"dimRadiusHexes": {v[1]},'))
        j = 0
        for m in re.finditer(r'\n([ \t]*)"id": "brazierLight",', text2):
            v = braz[j] if j < len(braz) else TORCH
            j += 1
            ind = m.group(1)
            out.append((m.end(), f'\n{ind}"brightRadius": {v[0]},\n{ind}"dimRadius": {v[1]},'))
        for pos, ins in sorted(out, reverse=True):
            text2 = text2[:pos] + ins + text2[pos:]
        json.loads(text2)
        if text2 != text:
            touched.append(f"{data.get('id')} ({path}): {sum(1 for w in wanted if w)} ışık kuralı, {len(braz)} mangal kuralı")
            if not dry:
                open(path, 'w', encoding='utf-8', newline='\n').write(text2)
    print(f'{len(touched)} harita:')
    for t in touched:
        print(' ', t)

if __name__ == '__main__':
    main()
