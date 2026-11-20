#!/usr/bin/env python3
"""Hale Gemini v2: docs/sabah/hale-gemini-eslesme.csv'deki durumu haleli ve halesiz-supheli olan jetonlar (168), yeniden paketlenmiş 3×3 sayfalar
(hücre 512×512, zemin #FF00FF, yazı yok; sıra ve kaynak v1 ile aynı). Çıktı: docs/sabah/hale-gemini-v2-sayfa-NN.png, hale-gemini-v2-eslesme.csv. Eski sayfalar ve CSV'ye dokunulmaz."""
import csv, io, subprocess
from collections import Counter
from PIL import Image
D = 'public/characters'
def git_img(ref, name):
    r = subprocess.run(['git', 'show', f'{ref}:{D}/{name}.webp'], capture_output=True)
    return Image.open(io.BytesIO(r.stdout)).convert('RGBA') if r.returncode == 0 and r.stdout else None
rows_in = [r for r in csv.DictReader(open('docs/sabah/hale-gemini-eslesme.csv')) if r['durum'] in ('haleli', 'halesiz-supheli')]
pages = (len(rows_in) + 8) // 9; out = []
for p in range(pages):
    sheet = Image.new('RGB', (1536, 1536), (255, 0, 255))
    for c, r in enumerate(rows_in[p * 9:(p + 1) * 9]):
        n = r['dosya'][:-5]; img = None; kaynak = r['kaynak']
        if kaynak.startswith('git:'): img = git_img(kaynak[4:], n)
        if img is None: img = Image.open(f'{D}/{n}.webp').convert('RGBA'); kaynak = 'mevcut'
        big = img.resize((512, 512), Image.NEAREST); sheet.paste(big, ((c % 3) * 512, (c // 3) * 512), big)
        out.append((f'{p + 1:02d}', c + 1, r['dosya'], r['durum'], kaynak))
    sheet.save(f'docs/sabah/hale-gemini-v2-sayfa-{p + 1:02d}.png')
with open('docs/sabah/hale-gemini-v2-eslesme.csv', 'w', newline='') as fh:
    w = csv.writer(fh); w.writerow(['sayfa', 'hucre', 'dosya', 'durum', 'kaynak']); w.writerows(out)
cls = Counter(r[2][:-5].split('-')[2] for r in out)
print(len(out), pages, Counter(r[3] for r in out), Counter(r[4] for r in out)); print(sorted(cls.items()))
