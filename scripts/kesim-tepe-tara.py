"""
KESIM-TEPE taraması (yalnız okur): public/characters/*.webp ve kucuk/*.webp jetonlarında kenardaki 2 piksel şeritte opak (alfa > 32)
piksel sayısı (üst, alt, sol, sağ). Çıktı harita/belgeler/KESIM-TEPE.md'nin tablo bölümü (stdout) ve --json <yol>.
Çalıştırma: python scripts/kesim-tepe-tara.py [--json <yol>]   (PYTHONUTF8=1)
"""
import os, sys, json
from collections import Counter, defaultdict
import numpy as np
from PIL import Image

KENAR, ESIK = 2, 32
res = {}
for sub in ['', 'kucuk/']:
    d = f'public/characters/{sub}'
    for f in sorted(os.listdir(d)):
        if not f.endswith('.webp'): continue
        a = np.asarray(Image.open(d + f).convert('RGBA'))[..., 3] > ESIK
        e = {'ust': int(a[:KENAR].sum()), 'alt': int(a[-KENAR:].sum()), 'sol': int(a[:, :KENAR].sum()), 'sag': int(a[:, -KENAR:].sum())}
        if any(e.values()): res[sub + f[:-5]] = e
if '--json' in sys.argv: json.dump(res, open(sys.argv[sys.argv.index('--json') + 1], 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

def parca(n):
    """ırk, sınıf, alt sınıf kodu (sınıf-genel jetonda 'genel')."""
    p = n.split('-')
    return p[0], p[2], ('-'.join(p[3:]) or 'genel')

for sub, baslik in (('', 'Büyük jetonlar (256 px)'), ('kucuk/', 'Küçük kopyalar (96 px)')):
    rows = {k[len(sub):]: v for k, v in res.items() if k.startswith(sub) and (sub or not k.startswith('kucuk/'))}
    toplam = len([f for f in os.listdir(f'public/characters/{sub}') if f.endswith('.webp')])
    print(f'\n### {baslik}: {len(rows)} / {toplam} jeton kenara değiyor\n')
    say = Counter(s for v in rows.values() for s in ('ust', 'alt', 'sol', 'sag') if v[s])
    print(f"Kenar başına: üst {say['ust']}, alt {say['alt']}, sol {say['sol']}, sağ {say['sag']}.\n")
    grup = defaultdict(list)
    for n in rows: r, c, s = parca(n); grup[(r, c, s)].append(n)
    print('| Irk | Sınıf | Alt sınıf | Jeton | Üst | Alt | Sol | Sağ |')
    print('|---|---|---|---|---:|---:|---:|---:|')
    for (r, c, s), ns in sorted(grup.items()):
        for n in ns:
            v = rows[n]
            print(f"| {r} | {c} | {s} | `{n}` | {v['ust']} | {v['alt']} | {v['sol']} | {v['sag']} |")
