"""
Kesim yarığı taraması (yalnız rapor): toplu kesimin `drop_lines` adımı figürün içindeki ince yatay/dikey parçaları (kabza, bilek, manşet,
asa) ızgara çizgisi sanıp silebiliyor; jetonda figürün İÇİNDE düz, ince (≤ 6 px) saydam bir yarık ve çoğu zaman kopuk küçük bir parça
kalıyor (örnek: human-erkek-fighter-GR, kabza ile bilek arası).

Ölçü (256 px jeton, alfa > 100): saydam piksel, üstünde ve altında (ya da solunda ve sağında) 6 px içinde opak piksel varsa "yarık pikseli".
Ardışık sütunlarda yarığın üst ve alt kenarı aynı satırda (± 1 px; cetvelle kesilmiş gibi) ve koşu ≥ ESIK px ise düz yarık. Doğal
boşlukların (bacak arası, kol-gövde) kenarı eğridir; yine de kesin karar görsele bakılarak verilir: kontak sayfası en yüksek puanlıları gösterir.

Çalıştırma: python scripts/kesim-yarik-tara.py [--esik 14] [--hepsi]
Çıktı: harita/belgeler/KESIM-YARIK-TARAMA.md, gorsel-dokum/kesim-yarik/en-yuksek.png (commit edilmez).
"""
import os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); os.chdir(ROOT)
ESIK = int(sys.argv[sys.argv.index('--esik') + 1]) if '--esik' in sys.argv else 14
PUB = 'public/characters'; OUT = 'gorsel-dokum/kesim-yarik'; MD = 'harita/belgeler/KESIM-YARIK-TARAMA.md'
KAL = 6   # yarık en çok bu kalınlıkta
os.makedirs(OUT, exist_ok=True)
try: FONT = ImageFont.truetype('arial.ttf', 11)
except OSError: FONT = ImageFont.load_default()

def runs(row):
    """Bir satırdaki True koşuları → [(başlangıç, uzunluk)]."""
    d = np.diff(np.concatenate([[0], row.astype(np.int8), [0]]))
    s = np.where(d == 1)[0]; e = np.where(d == -1)[0]
    return list(zip(s, e - s))

def slit(a):
    """Düz kesim yarığı: saydam, 1–KAL px kalın, iki ucu opak (sütun boyunca: üst ve alt kenar); ardışık sütunlarda üst ve alt kenar
    AYNI satırda (± 1; cetvelle kesilmiş gibi). Doğal boşlukların kenarı eğridir. → (en uzun düz koşu, yön, satır, başlangıç) ya da None."""
    best = (0, None, None, None)
    for axis in (0, 1):
        m = a if axis == 0 else a.T          # m[y, x]: x sütununda y boyunca yarık aranır
        h, w = m.shape
        seg = {}                              # x → [(üst, alt)] saydam bölümler (iki ucu opak, kalınlık ≤ KAL)
        for x in range(w):
            col = m[:, x]
            if not col.any(): continue
            ys = np.where(col)[0]; lo, hi = ys[0], ys[-1]
            out = []
            for st, n in runs(~col[lo:hi + 1]):
                if 2 <= n <= KAL: out.append((lo + st, lo + st + n))   # 1 px boşluk çizgi arası doğal ayrım; kesim bandı ≥ 2 px
            seg[x] = out
        run_x, run_seg, run_n = None, None, 0
        def close():
            nonlocal best
            if run_n > best[0]: best = (run_n, 'yatay' if axis == 0 else 'dikey', run_seg[0], run_x)
        for x in range(w):
            hit = None
            if run_seg is not None:
                hit = next((sg for sg in seg.get(x, []) if abs(sg[0] - run_seg[0]) <= 1 and abs(sg[1] - run_seg[1]) <= 1), None)
            if hit is not None: run_n += 1; continue
            if run_seg is not None: close()
            run_seg, run_x, run_n = None, None, 0
            for sg in seg.get(x, []):
                # yeni koşu: sonraki sütunda da aynı bölüm varsa başlat
                if any(abs(sg[0] - t[0]) <= 1 and abs(sg[1] - t[1]) <= 1 for t in seg.get(x + 1, [])):
                    run_seg, run_x, run_n = sg, x, 1; break
        if run_seg is not None: close()
    return best if best[0] else None

def fragments(a):
    """Gövdeye 4 px içinde ama kopuk küçük parçalar (15–600 px)."""
    from scipy import ndimage as ndi
    lab, n = ndi.label(a, structure=np.ones((3, 3)))
    if n < 2: return 0
    sz = ndi.sum(a, lab, range(1, n + 1)); body = lab == (1 + int(np.argmax(sz)))
    near = ndi.binary_dilation(body, iterations=4)
    return sum(1 for k in range(1, n + 1) if 15 <= sz[k - 1] <= 600 and (near & (lab == k)).any() and not (body & (lab == k)).any())

files = sorted(f for f in os.listdir(PUB) if f.endswith('.webp'))
hits = []
for f in files:
    a = np.asarray(Image.open(f'{PUB}/{f}').convert('RGBA'))[..., 3] > 100
    s = slit(a)
    if s and s[0] >= ESIK:
        hits.append((s[0], fragments(a), f, s))
hits.sort(key=lambda h: (-h[1] > 0, -h[0]))
hits.sort(key=lambda h: (-(h[1] > 0), -h[0]))

# kontak: başvuru örneği (human-erkek-fighter-GR) + en yüksek 59; her biri bütün jeton | yarığın çevresi 3× büyütülmüş (kırmızı çerçeve)
ref = [h for h in hits if h[2] == 'human-erkek-fighter-GR.webp']
top = ref + [h for h in hits if h not in ref][:59]; s = 150; z = 150; cols = 4
im = Image.new('RGB', (cols * (s + z + 14), 24 + ((len(top) + cols - 1) // cols) * (s + 30)), (24, 27, 33)); d = ImageDraw.Draw(im)
d.text((6, 5), f'Kesim yarığı adayları (düz saydam yarık ≥ {ESIK} px): jeton | yarık çevresi 3× (ilk: başvuru örneği human-erkek-fighter-GR)', fill=(232, 228, 218), font=FONT)
for i, (n, fr, f, (ln, yon, y, x0)) in enumerate(top):
    t = Image.open(f'{PUB}/{f}').convert('RGBA'); bg = Image.new('RGBA', t.size, (58, 63, 74, 255)); bg.alpha_composite(t)
    cx, cy = (x0 + ln / 2, y) if yon == 'yatay' else (y, x0 + ln / 2)
    box = (int(max(0, min(206, cx - 25))), int(max(0, min(206, cy - 25)))); box = box + (box[0] + 50, box[1] + 50)
    zoom = bg.crop(box).resize((z, z), Image.NEAREST); ImageDraw.Draw(bg).rectangle(box, outline=(255, 60, 60, 255))
    x = (i % cols) * (s + z + 14); yy = 24 + (i // cols) * (s + 30)
    im.paste(bg.resize((s, s), Image.NEAREST).convert('RGB'), (x, yy)); im.paste(zoom.convert('RGB'), (x + s + 4, yy))
    d.text((x, yy + s + 2), f[:-5][:40], fill=(200, 205, 215), font=FONT)
    d.text((x, yy + s + 15), f'{yon} {ln} px, kopuk parça {fr}', fill=(255, 150, 150) if fr else (200, 205, 215), font=FONT)
im.save(f'{OUT}/en-yuksek.png')

L = ['# Kesim yarığı taraması', '', f'Üretildi: `python scripts/kesim-yarik-tara.py` (eşik {ESIK} px). **Yalnız rapor**; jeton değiştirilmedi.', '',
     'Aranan kusur: toplu kesimin `drop_lines` adımı (`scripts/toplu-kesim.py`) ince yatay/dikey figür parçalarını (kabza, bilek, manşet) '
     'ızgara çizgisi sanıp siliyor; figürün içinde düz, ince saydam yarık ve çoğu zaman yanında kopuk küçük parça kalıyor '
     '(örnek `human-erkek-fighter-GR`). Ölçü: figürün içinde 1–6 px kalın saydam bölüm (iki ucu opak); ardışık sütunlarda üst ve alt '
     'kenarı aynı satırda (± 1 px), koşu uzunluğu ≥ eşik. Kopuk parça: gövdeye 4 px yakın ama ayrık 15–600 px bileşen. Doğal boşluklar da yakalanabilir: karar görselle.', '',
     f'Taranan: {len(files)} jeton (`public/characters/*.webp`, küçük kopyalar hariç); aday: **{len(hits)}**; kopuk parçalı aday: **{sum(1 for h in hits if h[1])}**.', '',
     'Görsel: `gorsel-dokum/kesim-yarik/en-yuksek.png` (en yüksek 60).', '',
     '| Jeton | Yön | Yarık (px) | Kopuk parça |', '|---|---|---:|---:|']
for n, fr, f, (ln, yon, y, x0) in hits[: (len(hits) if '--hepsi' in sys.argv else 120)]:
    L.append(f'| `{f[:-5]}` | {yon} | {ln} | {fr} |')
if len(hits) > 120 and '--hepsi' not in sys.argv: L.append(f'| … | | | (+{len(hits) - 120}; `--hepsi`) |')
open(MD, 'w', encoding='utf-8', newline='\n').write('\n'.join(L) + '\n')
print(len(files), 'jeton;', len(hits), 'aday;', sum(1 for h in hits if h[1]), 'kopuk parçalı')
for h in hits[:25]: print(h[2], h[3][1], h[0], 'kopuk', h[1])
print('human-erkek-fighter-GR:', [h for h in hits if h[2] == 'human-erkek-fighter-GR.webp'])
