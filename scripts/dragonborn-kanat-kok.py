#!/usr/bin/env python3
"""KW1 (yalnız görünüm): Dragonborn kanat kökü konumu → data/dragonborn-kanat-kok.json.
Kök = kanadın gövdeye bağlandığı nokta: jeton uzayında (256 px) omuz–dirsek bandında (y = `omuz` × 256; `data/kanat-esleme.json` `dragonborn.omuz`),
sol ve sağ kök x'i gövde siluetinin SOL/SAĞ kenarının biraz İÇİNDE. Kanat jetonun arkasında çizildiği için kökün siluet içinde olması
bağlantıyı garanti eder (içeri taşan kısım gizlenir, dışarı çıkan "sırttan çıkıyor" görünür); fazla içeride kök bozulmaz, dışarıda kalırsa boşluk olur.
Kestirim (jeton başına): alfa > 128 maskesi, yatay açma (YATAY_ACMA px: ince kol/asa/kılıç/kuyruk ucu atılır), bant satırlarında orta koşunun
(jeton merkezini içeren ya da en yakın) kenarlarının medyanı; kenar merkezden `ust_sinir` × 256 px'ten uzaksa (geniş pelerin/silah/uzanmış kol)
kök merkezden `yedek_dx` × 256 px'e konur (bu uzaklıkta siluet zaten geniştir).
Çıktı: `sinif` = `<sınıf>-<erkek|kadin>[-gr|-genel]` (src/ui/haloCrown.ts `crownKey` ile aynı) grup medyanı [sol, sag];
`jeton` = grup değerinden SAPMA_PX'ten fazla sapanlar için jeton kaydı (anahtar = dosya adı, `dragonborn-` ve `.webp` öneksiz/sonsuz).
`python3 scripts/dragonborn-kanat-kok.py [--rapor <klasör>]`  (ölçüm özeti; jeton dosyalarına yazmaz)."""
import argparse, glob, json, os, re, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
YATAY_ACMA = 21      # yatay açma genişliği (px)
BANT = 0.04          # omuz yüksekliği ± bu oran (jeton boyu) satırları kullanılır
INSET = 6            # kök, siluet kenarının bu kadar (px) içinde
UST_SINIR = 0.24     # kenar merkezden bu orandan (jeton genişliği) uzaksa gövde dışı sayılır
YEDEK_DX = 0.17      # yukarıdaki durumda kökün merkezden uzaklığı (jeton genişliği oranı)
SAPMA_PX = 5         # grup değerinden bu kadar sapan jeton için kayıt
ERISIM = 30          # orta koşu: merkez dışında en çok bu kadar uzaktaki koşu

def kosular(satir):
    d = np.diff(np.concatenate([[0], satir.astype(np.int8), [0]]))
    return list(zip(np.where(d == 1)[0], np.where(d == -1)[0] - 1))

def orta_kosu(satir, cx=128):
    en, uz = None, 1e9
    for a, b in kosular(satir):
        d = 0 if a <= cx <= b else min(abs(a - cx), abs(b - cx))
        if d < uz: uz, en = d, (a, b)
    return en if en is not None and uz <= ERISIM else None

def kenarlar(alfa, y0, y1):
    s = alfa > 128
    se = np.ones((1, YATAY_ACMA), bool)
    c = ndi.binary_dilation(ndi.binary_erosion(s, se), se)
    sol, sag = [], []
    for y in range(y0, y1 + 1):
        r = orta_kosu(c[y]) or orta_kosu(s[y])
        if r: sol.append(r[0]); sag.append(r[1] + 1)
    if not sol: return None
    return float(np.median(sol)), float(np.median(sag))

def kok_x(sol, sag, w=256):
    cx = w / 2
    l = sol + INSET if cx - sol <= UST_SINIR * w else cx - YEDEK_DX * w
    r = sag - INSET if sag - cx <= UST_SINIR * w else cx + YEDEK_DX * w
    return int(round(l)), int(round(r))

def grup(ad):
    """haloCrown.ts crownKey ile aynı: `<cinsiyet>-<sınıf>[-<hücre>]` → `<sınıf>-<erkek|kadin>[-gr|-genel]`."""
    m = re.match(r'^(erkek|kadin|male|female)-([a-z]+)(?:-(.+))?$', ad)
    g = {'male': 'erkek', 'female': 'kadin'}.get(m.group(1), m.group(1))
    return f"{m.group(2)}-{g}{'-gr' if m.group(3) == 'GR' else ('' if m.group(3) else '-genel')}"

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--rapor', help='ayrıntılı ölçümü bu klasöre json yaz'); a = ap.parse_args()
    kanat = json.load(open(os.path.join(ROOT, 'data/kanat-esleme.json'), encoding='utf-8'))['slotlar']['dragonborn']
    y = int(round(kanat['omuz'] * 256))
    y0, y1 = int(round(y - BANT * 256)), int(round(y + BANT * 256))
    est, bos = {}, []
    for f in sorted(glob.glob(os.path.join(ROOT, 'public/characters/dragonborn-*.webp'))):
        ad = os.path.basename(f)[len('dragonborn-'):-len('.webp')]
        al = np.array(Image.open(f).convert('RGBA'))[..., 3]
        e = kenarlar(al, y0, y1)
        if e is None: bos.append(ad); continue
        est[ad] = (kok_x(*e), e)
    if bos: print('kestirilemeyen (varsayılan kök):', bos)
    gruplar = {}
    for ad, (k, _) in est.items(): gruplar.setdefault(grup(ad), []).append(k)
    sinif = {g: [int(round(np.median([k[0] for k in v]))), int(round(np.median([k[1] for k in v])))] for g, v in sorted(gruplar.items())}
    jeton = {}
    for ad, (k, _) in sorted(est.items()):
        d = sinif[grup(ad)]
        if abs(k[0] - d[0]) > SAPMA_PX or abs(k[1] - d[1]) > SAPMA_PX: jeton[ad] = [k[0], k[1]]
    out = {
        '_not': 'KW1: Dragonborn kanat kökü (yalnız görünüm). Jeton uzayı 256 px: [sol x, sağ x]; y = kanat-esleme.json dragonborn.omuz × 256. sinif: <sınıf>-<erkek|kadin>[-gr|-genel] medyanı; jeton: gruptan > '
               f'{SAPMA_PX} px sapanlar için ezme (anahtar = dosya adı, dragonborn- öneksiz). Üretici scripts/dragonborn-kanat-kok.py (siluet kenarı − {INSET} px içeri; ayrıntı betik başlığında).',
        'sinif': sinif, 'jeton': jeton}
    yol = os.path.join(ROOT, 'data/dragonborn-kanat-kok.json')
    with open(yol, 'w', encoding='utf-8', newline='\n') as fh: json.dump(out, fh, ensure_ascii=False, indent=1); fh.write('\n')
    print(f'{len(est)} jeton, {len(sinif)} grup, {len(jeton)} jeton kaydı (sapma > {SAPMA_PX} px) → {yol}')
    if a.rapor:
        os.makedirs(a.rapor, exist_ok=True)
        json.dump({ad: {'kok': k, 'kenar': e} for ad, (k, e) in est.items()}, open(os.path.join(a.rapor, 'kok-kestirim.json'), 'w'), ensure_ascii=False)

if __name__ == '__main__': main()
