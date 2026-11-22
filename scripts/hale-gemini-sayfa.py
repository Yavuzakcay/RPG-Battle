#!/usr/bin/env python3
"""KQ6-22: Gemini hale temizleme referans sayfaları, TÜM Celestial jetonlar (288). Her sayfa 3×3, hücre 512×512 (256 px sprite 2× en yakın komşu), zemin #FF00FF, görüntüde yazı yok.
Kaynak: hale-öncesi orijinal sprite (git: 2151397 = d58f314'ten önce; Barbarian ID1 ve Bard ID5 erkek için bb36b76, hale çizilmeden önce); bulunamazsa mevcut dosya (kaynak = mevcut).
Sıra: sınıf, erkek/kadın, kodlar (genel, ID/WL/SC/WZ sayısal, GR en sonda). Eşleme docs/sabah/hale-gemini-eslesme.csv: sayfa, hücre, dosya, durum, kaynak.
Durum: haleli (sprite'ta pişmiş hale, data/hale-halesiz.json bekleyen), halesiz-temiz, halesiz-supheli (doğrulamada kalıntı çıkan 19 jeton)."""
import csv, io, json, os, re, subprocess
from PIL import Image
D = 'public/characters'
SUPHELI = {'erkek-rogue-ID4', 'erkek-bard-ID8', 'erkek-monk-ID10', 'erkek-monk-ID3', 'kadin-rogue-ID3', 'kadin-monk-ID1', 'female-ranger', 'kadin-ranger-GR', 'kadin-ranger-ID2', 'kadin-ranger-ID3',
            'male-ranger', 'kadin-ranger-ID5', 'kadin-ranger-ID8', 'erkek-ranger-ID7', 'erkek-sorcerer-SC-3', 'kadin-warlock-WL-8', 'kadin-warlock-GR', 'kadin-wizard-WZ-A6', 'erkek-wizard-WZ-A6'}
PRE_BAKE = {'celestial-erkek-barbarian-ID1', 'celestial-erkek-bard-ID5'}     # hale-uygula bunlara hale çizmişti: çizim öncesi sürüm
REF_NEW, REF_OLD = '2151397', 'bb36b76'

def git_img(ref, name):
    r = subprocess.run(['git', 'show', f'{ref}:{D}/{name}.webp'], capture_output=True)
    return Image.open(io.BytesIO(r.stdout)).convert('RGBA') if r.returncode == 0 and r.stdout else None

def order_key(n):
    m = re.match(r'celestial-(erkek|kadin|male|female)-([a-z]+)(?:-(.+))?$', n)
    g = {'male': 'erkek', 'female': 'kadin'}.get(m.group(1), m.group(1)); code = m.group(3) or ''
    if code == '': ck = (0, 0, '', 0)
    elif code == 'GR': ck = (3, 0, '', 0)
    else:
        mm = re.match(r'([A-Z]+)-?([A-Z]?)(\d+)$', code); ck = (1, int(mm.group(3)), mm.group(1) + mm.group(2), 0) if mm else (2, 0, code, 0)
        ck = (1, mm.group(1) + mm.group(2), int(mm.group(3)), 0) if mm else ck
    return (m.group(2), 0 if g == 'erkek' else 1, ck)

def main():
    hold = set(json.load(open('data/hale-halesiz.json'))['bekleyen'])
    names = sorted((f[:-5] for f in os.listdir(D) if f.startswith('celestial-') and f.endswith('.webp')), key=order_key)
    assert len(names) == 288
    os.makedirs('docs/sabah', exist_ok=True)
    rows = []; pages = (len(names) + 8) // 9
    for p in range(pages):
        sheet = Image.new('RGB', (1536, 1536), (255, 0, 255))
        for c, n in enumerate(names[p * 9:(p + 1) * 9]):
            ref = REF_OLD if n in PRE_BAKE else REF_NEW
            img = git_img(ref, n); kaynak = f'git:{ref}'
            if img is None: img = Image.open(f'{D}/{n}.webp').convert('RGBA'); kaynak = 'mevcut'
            big = img.resize((512, 512), Image.NEAREST); ox, oy = (c % 3) * 512, (c // 3) * 512
            sheet.paste(big, (ox, oy), big)
            short = n[len('celestial-'):]
            durum = 'haleli' if n in hold else ('halesiz-supheli' if short in SUPHELI else 'halesiz-temiz')
            rows.append((f'{p + 1:02d}', c + 1, f'{n}.webp', durum, kaynak))
        sheet.save(f'docs/sabah/hale-gemini-sayfa-{p + 1:02d}.png')
    with open('docs/sabah/hale-gemini-eslesme.csv', 'w', newline='') as fh:
        w = csv.writer(fh); w.writerow(['sayfa', 'hucre', 'dosya', 'durum', 'kaynak']); w.writerows(rows)
    from collections import Counter
    print(len(rows), pages, Counter(r[3] for r in rows), Counter(r[4] for r in rows))
if __name__ == '__main__': main()
