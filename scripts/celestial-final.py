#!/usr/bin/env python3
"""Celestial final kontrol (yalnız rapor; jeton değiştirmez). `python3 scripts/celestial-final.py`
- docs/sabah/celestial-final/<sınıf>.jpg: sınıf başına sayfa; 1. satır erkek, 2. satır kadın (genel, ID/WL/SC/WZ sırası, GR sonda); 256 px, koyu gri zemin.
  Kırmızı çerçeve = ölçüm "haleli", turuncu = "belirsiz", çerçevesiz = halesiz.
- docs/sabah/celestial-final/olcum.csv: jeton başına ölçüm. haleli-liste.md: haleli + belirsiz tablo (jeton, ölçü, kazanan kaynak).
Ölçüm scripts/hale-olcum.py `halo_all` (ince elips halka + sütun yayı; kalibrasyon orada): skor ≥ 0,5 haleli, 0,2–0,5 belirsiz, < 0,2 halesiz.
Eski KQ6-16 çekirdeği (celestial-denetim.py) şapka/miğfer/sancakta 140 "belirsiz" verdiği için kullanılmadı. Şekil temelli, kesin değil: işaretliler gözle denetlenmeli."""
import csv, importlib.util, json, os, re
import numpy as np
from PIL import Image, ImageDraw

def load(name, path):
    s = importlib.util.spec_from_file_location(name, path); m = importlib.util.module_from_spec(s); s.loader.exec_module(m); return m
ho_ = load('ho_', 'scripts/hale-olcum.py')
D, OUT = 'public/characters', 'docs/sabah/celestial-final'
CLASSES = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard']
CELL, LAB = 256, 18
# Görsel kontrol (2026-11-19; 12 sınıf sayfası tam gözden geçirildi, işaretliler 2× büyütülerek): ölçümü düzelten karar. Yoksa ölçüm geçerli.
GORSEL = {
    'celestial-erkek-wizard-WZ-B1': ('haleli', 'altın halka başın üstünde (sayfa 30 yok, hiç işlenmedi)'),
    'celestial-erkek-wizard-WZ-B2': ('haleli', 'altın halka başın üstünde (sayfa 30 yok)'),
    'celestial-erkek-wizard-WZ-B3': ('haleli', 'altın halka başın üstünde (sayfa 30 yok)'),
    'celestial-erkek-wizard-WZ-B4': ('haleli', 'altın halka başın üstünde (sayfa 30 yok)'),
    'celestial-erkek-wizard-WZ-B7': ('haleli', 'altın halka başın üstünde (sayfa 30 yok)'),
    'celestial-male-bard': ('halesiz', 'yanlış alarm: şapka tüyü'),
    'celestial-female-bard': ('halesiz', 'yanlış alarm: şapka tüyü'),
    'celestial-kadin-wizard-WZ-B1': ('halesiz', 'yanlış alarm: rüzgâr parçacıkları'),
    'celestial-erkek-warlock-WL-8': ('halesiz', 'yanlış alarm: Gulyabani saç telleri (taç yok kararı ayrı)'),
    'celestial-kadin-rogue-ID3': ('belirsiz', 'silindir şapkanın tepesinde ince sarı çizgi: hale kalıntısı olabilir (halesiz-doğrulandı, dokunulmamıştı)'),
}

def order(n):
    m = re.match(r'celestial-(erkek|kadin|male|female)-([a-z]+)(?:-(.+))?$', n); code = m.group(3) or ''
    if code == '': return (0, 0, '')
    if code == 'GR': return (3, 0, '')
    mm = re.match(r'([A-Z]+)-?([A-Z]?)(\d+)$', code)
    return (1, mm.group(1) + mm.group(2), int(mm.group(3))) if mm else (2, code, 0)

def measure(a):
    sc, m = ho_.halo_all(a)
    lab = 'haleli' if sc >= 0.5 else ('belirsiz' if sc >= 0.2 else 'halesiz')
    return {'sonuc': lab, 'skor': sc, 'yontem': m.get('yontem', ''), 'olcu': ', '.join(f'{k} {v}' for k, v in m.items() if k != 'yontem')}

def source_of(L, n):
    j = L.get(n)
    if j and j.get('kazanan'): w = j['kazanan']; return f"{w['kaynak']} ({w['dosya']} / {w['hucre']})"
    return 'CC öncesi (değişmedi)'

def main():
    os.makedirs(OUT, exist_ok=True)
    L = json.load(open('data/cc-kesim-kaynak.json'))['jetonlar']
    hold = set(json.load(open('data/hale-halesiz.json'))['bekleyen'])
    names = sorted(f[:-5] for f in os.listdir(D) if f.startswith('celestial-') and f.endswith('.webp'))
    rows = []
    by = {c: {'erkek': [], 'kadin': []} for c in CLASSES}
    for n in names:
        m = re.match(r'celestial-(erkek|kadin|male|female)-([a-z]+)', n)
        g = {'male': 'erkek', 'female': 'kadin'}.get(m.group(1), m.group(1)); by[m.group(2)][g].append(n)
        a = np.array(Image.open(f'{D}/{n}.webp').convert('RGBA'))
        r = measure(a); r.update(jeton=n, sinif=m.group(2), cinsiyet=g, kaynak=source_of(L, n), tac='yok (bekleyen)' if n in hold else 'çizilir')
        r['olcum'] = r['sonuc']; gv = GORSEL.get(n); r['gorsel'] = gv[1] if gv else ''
        if gv: r['sonuc'] = gv[0]
        rows.append(r)
    R = {r['jeton']: r for r in rows}
    for cls, gs in by.items():
        mx = max(len(v) for v in gs.values())
        im = Image.new('RGB', (mx * CELL, 2 * (CELL + LAB)), (52, 54, 60)); dr = ImageDraw.Draw(im)
        for ri, g in enumerate(('erkek', 'kadin')):
            for ci, n in enumerate(sorted(gs[g], key=order)):
                t = Image.open(f'{D}/{n}.webp').convert('RGBA'); x, y = ci * CELL, ri * (CELL + LAB)
                im.paste(t, (x, y + LAB), t); r = R[n]
                col = {'haleli': (230, 40, 40), 'belirsiz': (240, 150, 30)}.get(r['sonuc'])
                if col: dr.rectangle((x + 1, y + LAB + 1, x + CELL - 2, y + LAB + CELL - 2), outline=col, width=4)
                dr.text((x + 3, y + 3), n.replace('celestial-', '') + ('' if r['sonuc'] == 'halesiz' and r['olcum'] == 'halesiz' else f"  [{r['sonuc']}; ölçüm {r['skor']}]"), fill=col or (235, 235, 235))
        im.save(f'{OUT}/{cls}.jpg', quality=90)
    keys = ['jeton', 'sinif', 'cinsiyet', 'sonuc', 'olcum', 'skor', 'yontem', 'olcu', 'gorsel', 'tac', 'kaynak']
    with open(f'{OUT}/olcum.csv', 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=keys); w.writeheader(); [w.writerow({k: r[k] for k in keys}) for r in rows]
    json.dump(rows, open(f'{OUT}/olcum.json', 'w'), ensure_ascii=False, indent=1)
    import io, subprocess
    eski = []
    for c in ('B1', 'B2', 'B3', 'B4', 'B7'):
        n = f'celestial-erkek-wizard-WZ-{c}'
        b = subprocess.run(['git', 'show', f'2360265b:public/characters/halesiz/{n}.webp'], capture_output=True).stdout
        if b: r = measure(np.array(Image.open(io.BytesIO(b)).convert('RGBA'))); eski.append({'jeton': n, **r})
    json.dump(eski, open(f'{OUT}/eski-wzb-halesiz.json', 'w'), ensure_ascii=False, indent=1)
    from collections import Counter
    final = Counter(r['sonuc'] for r in rows); olc = Counter(r['olcum'] for r in rows)
    T = ['# Celestial final hale listesi (2026-11-19; yalnız rapor, jeton değiştirilmedi)', '',
         f"Üretici `scripts/celestial-final.py`, ölçüm `scripts/hale-olcum.py`. {len(rows)} Celestial jeton. Sınıf sayfaları bu klasörde (`<sınıf>.jpg`; kırmızı = haleli, turuncu = belirsiz), bütün ölçüm `olcum.csv`.", '',
         f"**Sonuç (ölçüm + görsel kontrol): halesiz {final['halesiz']}, haleli {final['haleli']}, belirsiz {final['belirsiz']}.** Yalnız ölçüm: halesiz {olc['halesiz']}, haleli {olc['haleli']}, belirsiz {olc['belirsiz']}.", '',
         'Ölçüm: başın tepesinde/üstünde ince elips halka ya da ince yay (skor 0–1; ≥ 0,5 haleli, 0,2–0,5 belirsiz). Duyarlılık sınırlı (kalibrasyonda bilinen halelerin ≈ %65’i), bu yüzden 12 sınıf sayfası ayrıca gözle tarandı; gözle görülen ek hale yok.', '',
         '| Jeton | Sonuç | Ölçüm (skor, yöntem, ölçüler) | Görsel kontrol | Kazanan kaynak | Taç |', '|---|---|---|---|---|---|']
    for r in sorted(rows, key=lambda r: ({'haleli': 0, 'belirsiz': 1, 'halesiz': 2}[r['sonuc']], r['jeton'])):
        if r['sonuc'] == 'halesiz' and r['olcum'] == 'halesiz': continue
        T.append(f"| {r['jeton']} | **{r['sonuc']}** | {r['olcum']} {r['skor']} ({r['yontem']}; {r['olcu']}) | {r['gorsel'] or '—'} | {r['kaynak']} | {r['tac']} |")
    bek = [r for r in rows if r['tac'].startswith('yok') and r['sonuc'] == 'halesiz']
    T += ['', '## Halesiz ama taç bekleme listesinde (oyunda yıldız tacı çizilmez)', '',
          'Bilgi için: `data/hale-halesiz.json` `bekleyen` listesinde olup ölçüm + gözle halesiz görünen jetonlar. Jeton ve liste değiştirilmedi.', '',
          '| Jeton | Neden listede | Kazanan kaynak |', '|---|---|---|']
    why = {'celestial-erkek-warlock-WL-8': 'kullanıcı kararı: Gulyabani, taç yok', 'celestial-kadin-fighter-ID3': 'CC taban: uyum düşük, uygulanmadı', 'celestial-kadin-fighter-ID4': 'CC taban: Gemini çıktısı kaynakla aynı (hale silinmemiş sayıldı)'}
    T += [f"| {r['jeton']} | {why.get(r['jeton'], '—')} | {r['kaynak']} |" for r in bek]
    T += ['', 'Erkek Wizard WZ-B halesiz hâl araması: `wzb-arama.md`.']
    open(f'{OUT}/haleli-liste.md', 'w').write('\n'.join(T) + '\n')
    print(len(rows), 'final', final, 'ölçüm', olc)

if __name__ == '__main__': main()
