#!/usr/bin/env python3
"""Hale düzeltme paketi: eski 32 sayfalık setten (docs/sabah/hale-gemini-eslesme.csv) seçilen hücreler, kaynak hale-öncesi orijinaller (git),
3×3, hücre 512×512, magenta zemin (v2 ile aynı); aynı sınıf aynı sayfaya düşmesin diye sınıf-major sırayla dağıtılır."""
import csv, io, re, subprocess, collections
from PIL import Image
D = 'public/characters'
SEL = {1: [4, 9], 11: [6], 14: [3, 5], 15: [1, 3, 8], 17: [1, 6], 21: [6, 8], 22: [1, 3, 4, 9], 26: [5, 6, 7, 8, 9], 27: [1, 2, 4, 5, 6], 28: [1, 2, 3, 7, 9], 32: list(range(1, 9))}
NOT = {(1, 4): 'mavi gözler kalsın, alına yıldız eklensin', (1, 9): 'kırmızı aura tam olsun'}
def git_img(ref, name):
    r = subprocess.run(['git', 'show', f'{ref}:{D}/{name}.webp'], capture_output=True)
    return Image.open(io.BytesIO(r.stdout)).convert('RGBA') if r.returncode == 0 and r.stdout else None
BASTAN = {(26, c) for c in range(5, 10)} | {(27, c) for c in (1, 2, 4, 5, 6)}   # erkek Celestial Warlock: baştan yapılacak
SUPHELI = {(32, c) for c in range(1, 9)} | {(22, 9), (28, 7)}   # piksel ölçümüyle şimdiki dosyalar halesiz doğrulandı (docs/sabah/hale-kontrol/supheli-10.png)
allrows = [r for r in csv.DictReader(open('docs/sabah/hale-gemini-eslesme.csv')) if int(r['hucre']) in SEL.get(int(r['sayfa']), [])]
key = lambda r: (int(r['sayfa']), int(r['hucre']))
rows = [r for r in allrows if key(r) not in BASTAN and key(r) not in SUPHELI]
cls = lambda r: re.match(r'celestial-(?:erkek|kadin|male|female)-([a-z]+)', r['dosya']).group(1)
rows.sort(key=lambda r: (cls(r), r['dosya']))
NP = (len(rows) + 8) // 9
pages = [[] for _ in range(NP)]
for i, r in enumerate(rows): pages[i % NP].append(r)
out = []
for p, items in enumerate(pages):
    sheet = Image.new('RGB', (1536, 1536), (255, 0, 255))
    for c, r in enumerate(items):
        n = r['dosya'][:-5]; img = git_img(r['kaynak'][4:], n) if r['kaynak'].startswith('git:') else None; kaynak = r['kaynak']
        if img is None: img = Image.open(f'{D}/{n}.webp').convert('RGBA'); kaynak = 'mevcut'
        big = img.resize((512, 512), Image.NEAREST); sheet.paste(big, ((c % 3) * 512, (c // 3) * 512), big)
        out.append((f'{p + 1:02d}', c + 1, r['dosya'], r['sayfa'], r['hucre'], r['durum'], kaynak, NOT.get((int(r['sayfa']), int(r['hucre'])), '')))
    sheet.save(f'docs/sabah/hale-gemini-duzeltme-sayfa-{p + 1:02d}.png')
for r in allrows:
    if key(r) in BASTAN: out.append(('', '', r['dosya'], r['sayfa'], r['hucre'], 'baştan-warlock', r['kaynak'], 'baştan yapılacak, halka düzeltmesine girmez'))
    elif key(r) in SUPHELI: out.append(('', '', r['dosya'], r['sayfa'], r['hucre'], 'halesiz-doğrulandı', r['kaynak'], 'şimdiki dosya halesiz (hale px ölçümü + görsel); eski sayfadaki halka kaynak orijinaldeydi; pakete konmadı'))
with open('docs/sabah/hale-gemini-duzeltme-eslesme.csv', 'w', newline='') as fh:
    w = csv.writer(fh); w.writerow(['yeni_sayfa', 'yeni_hucre', 'dosya', 'eski_sayfa', 'eski_hucre', 'durum', 'kaynak', 'not']); w.writerows(out)
print(len(rows), NP, [len(x) for x in pages])
for p in pages: print(collections.Counter(cls(r) for r in p).most_common(1))
