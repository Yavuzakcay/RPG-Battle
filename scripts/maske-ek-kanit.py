"""
MASKE-EK kanıtı (yalnız okur): önce/sonra tarayıcı boya dökümünü (`npx vite-node scripts/jeton-denetim-cizim.ts --yalniz boya`, oyunun
kendi `tintedUrl` çıktısı + yedek filtre kaydı) karşılaştırır.
  1. Hedef dışı görünüşler (maskesi değişmeyen jetonlar): aynı anahtar, aynı boya kaydı (png var/yok, yedek filtre), piksel piksel aynı PNG.
  2. Hedef görünüşler (sonra): boyalı jetonun ham jetondan farklı her pikseli yeni maskenin içinde ya da çalışma anı onarımının payında
     (maskenin 1 px komşuluğu + maskenin çevrelediği delikler: Human/Drow `closeSkinHoles`, Tiefling `fixSkinMask` gölge bandı; bu payın
     dışında değişen piksel = kıyafet/saç/zırh boyası). Opak piksel RGB birebir, yarı saydam görünen değer (RGB × alfa) ±2, alfa birebir.
  3. Yedek filtre geçişleri: önce bütün jetona CSS filtresi (maske yoktu) → sonra boyasız (bilerek boş) ya da maskeli boya.
  4. Önce/sonra sayfaları (hedef jeton başına bir görünüş: önce | sonra), git dışı.
Çalıştırma: python scripts/maske-ek-kanit.py <önce klasörü> <sonra klasörü> <çıktı klasörü> <hedef listesi (satır başına jeton)> [hariç listesi]
  (hariç: bu görev dışında aynı anda değişen jetonlar, ör. yeni elle maskeler; ayrı sayılır)
"""
import os, sys, json
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

ONCE, SONRA, OUT, LISTE = sys.argv[1:5]
os.makedirs(OUT, exist_ok=True)
HEDEF = {l.strip() for l in open(LISTE, encoding='utf-8') if l.strip()}
HARIC = {l.strip() for l in open(sys.argv[5], encoding='utf-8') if l.strip()} if len(sys.argv) > 5 else set()
meta = lambda d: json.load(open(f'{d}/veri/boya.json', encoding='utf-8'))
mo, ms = meta(ONCE), meta(SONRA)
name = lambda src: src.split('/')[-1][:-5]
png = lambda d, k: np.asarray(Image.open(f'{d}/boya/{k}.png').convert('RGBA'))
sonuc = {}

# 1) hedef dışı
same = diff = haric = 0; farkli = []
for k, m in mo.items():
    if name(m['src']) in HEDEF: continue
    if name(m['src']) in HARIC: haric += 1; continue
    s = ms.get(k)
    if not s or m['png'] != s['png'] or m['fb'] != s['fb'] or m['mask'] != s['mask']: diff += 1; farkli.append(k); continue
    if m['png'] and not np.array_equal(png(ONCE, k), png(SONRA, k)): diff += 1; farkli.append(k); continue
    same += 1
yeni = [k for k, s in ms.items() if name(s['src']) not in HEDEF and k not in mo]
yeni = [k for k in yeni if name(ms[k]['src']) not in HARIC]
sonuc['hedefDisi'] = dict(ayni=same, farkli=diff, yalnizSonra=len(yeni), haric=haric, ornekFarkli=farkli[:10])

# 2) hedef: maske dışı fark; 3) yedek filtre geçişleri
irk = lambda n: n.split('-')[0]
dis, gecis, kotu, ornek = {}, {}, [], {}
for k, s in ms.items():
    n = name(s['src'])
    if n not in HEDEF: continue
    d = dis.setdefault(irk(n), dict(gorunus=0, boyali=0, bos=0, maskeDisi=0, maskeDisiPx=0, payIci=0))
    d['gorunus'] += 1
    m = mo.get(k)
    if m and m['fb'] and not s['fb']: gecis[irk(n)] = gecis.get(irk(n), 0) + 1
    ornek.setdefault(n, k)
    if not s['png'] or not s['mask']: d['maskesizYol'] = d.get('maskesizYol', 0) + (0 if s['mask'] else 1); continue  # High Elf HSL yolu maske kullanmaz
    orig = np.asarray(Image.open(f"public/{s['src']}").convert('RGBA'))
    mp = f'public/characters/maske-el/{n}.png' if os.path.exists(f'public/characters/maske-el/{n}.png') else f'public/characters/maske/{n}.png'
    mask = (np.asarray(Image.open(mp).convert('L').resize(orig.shape[1::-1], Image.NEAREST)) > 127) if os.path.exists(mp) else np.zeros(orig.shape[:2], bool)
    oi, pi = orig.astype(int), png(SONRA, k).astype(int)
    op = oi[..., 3] == 255; semi = (oi[..., 3] > 0) & ~op
    pm = np.abs(oi[..., :3] * oi[..., 3:] // 255 - pi[..., :3] * pi[..., 3:] // 255).max(-1)
    ch = (op & (np.abs(oi - pi)[..., :3].max(-1) > 0)) | (semi & (pm > 2)) | (oi[..., 3] != pi[..., 3])
    if mask.any(): d['boyali'] += 1
    else: d['bos'] += 1
    o = ch & ~mask
    if o.any():
        pay = ndi.binary_dilation(mask, structure=np.ones((3, 3))) | ndi.binary_fill_holes(ndi.binary_closing(mask, structure=np.ones((3, 3))))
        d['payIci'] += int((o & pay).sum()); o &= ~pay
    if o.any(): d['maskeDisi'] += 1; d['maskeDisiPx'] += int(o.sum()); kotu.append((k, n, int(o.sum())))
sonuc['hedef'] = dis
sonuc['yedekFiltreKalkti'] = gecis
sonuc['maskeDisiOrnek'] = sorted(kotu, key=lambda x: -x[2])[:15]

# 4) önce | sonra sayfaları (hedef jeton başına ilk görünüş; önce yedek filtreliyse filtre yazıyla belirtilir)
S, per = 128, 24
names = sorted(ornek)
for pg in range(0, len(names), per):
    page = Image.new('RGB', (6 * (2 * S + 8), 4 * (S + 14)), (24, 24, 30)); dr = ImageDraw.Draw(page)
    for i, n in enumerate(names[pg:pg + per]):
        k = ornek[n]; x, y = (i % 6) * (2 * S + 8), (i // 6) * (S + 14)
        for j, (D, M) in enumerate(((ONCE, mo), (SONRA, ms))):
            e = M.get(k)
            arr = png(D, k) if e and e['png'] else np.asarray(Image.open(f'public/characters/{n}.webp').convert('RGBA'))
            bg = Image.new('RGBA', arr.shape[1::-1], (62, 64, 74, 255)); bg.alpha_composite(Image.fromarray(arr))
            page.paste(bg.convert('RGB').resize((S, S), Image.NEAREST), (x + j * S, y + 14))
            if e and e['fb']: dr.text((x + j * S + 2, y + 16), 'YEDEK FILTRE', fill=(255, 120, 120))
        dr.text((x + 2, y + 1), n[:40], fill=(255, 230, 160))
    page.save(f'{OUT}/once-sonra-{pg // per + 1:02d}.png')
json.dump(sonuc, open(f'{OUT}/kanit.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(json.dumps(sonuc, ensure_ascii=False, indent=1))
