"""
JETON-DENETIM (yalnız rapor; hiçbir jetona, maskeye, filtre verisine ya da data/ dosyasına yazmaz).

Oyundaki bütün karakter jetonlarını ve görünüşlerini (ırk × soy/ton/uyanış × cinsiyet × sınıf × Gariban/alt sınıf/ikinci form × seviye
eşiği) iki düzeyde ölçer:
  1. dosya: public/characters/*.webp (kesim yarığı, kenara değme / düz üst kesik, kopuk parça, yeşil/beyaz zemin kalıntısı, yeşil kontur,
     bulanıklık, sayfa içi boy aykırılığı, küçük kopya farkı),
  2. oyunda çizilmiş hâl: `scripts/jeton-denetim-cizim.ts` dökümü (oyunun `sheetAvatar` → `tintedUrl` → `TokenFigure` / `LookFrame` +
     `AvatarBadge` yolu; gorsel-dokum/jeton-denetim/): boyanan piksellerin ham rengi (ten mi kıyafet mi), boyanmamış ten, yüz ile el/kol
     ton farkı, alfa kaybı, rozet çerçevesinin kestiği baş pikselleri, yedek filtre, kanat rengi.
Sonra kontak sayfaları (gorsel-dokum/jeton-denetim/kontak/, commit edilmez) ve rapor harita/belgeler/JETON-DENETIM.md.

Çalıştırma:
  python scripts/jeton-denetim.py --ciz      # önce tarayıcı dökümü (npx vite-node scripts/jeton-denetim-cizim.ts; PW_CHROMIUM)
  python scripts/jeton-denetim.py            # ölçüm + kontak + rapor (döküm hazırsa)
  python scripts/jeton-denetim.py --asama dosya|boya|cizim|kontak|rapor   # tek aşama (önceki aşamaların ara sonuçları veri/'de)
Gereken: numpy, Pillow, scipy.
"""
import os, sys, json, subprocess, hashlib, re, math, collections
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); os.chdir(ROOT)
PUB = 'public/characters'
OUT = 'gorsel-dokum/jeton-denetim'
VERI = f'{OUT}/veri'
KONTAK = f'{OUT}/kontak'
MD = 'harita/belgeler/JETON-DENETIM.md'
ARG = sys.argv[1:]
ASAMA = ARG[ARG.index('--asama') + 1].split(',') if '--asama' in ARG else ['dosya', 'boya', 'cizim', 'kontak', 'rapor']
for d in (VERI, KONTAK): os.makedirs(d, exist_ok=True)
try: FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 11)
except OSError:
    try: FONT = ImageFont.truetype('arial.ttf', 11)
    except OSError: FONT = ImageFont.load_default()
A_OP = 100          # opak eşiği (alfa)

# ---- Gözle verilen kararlar (2026-11-22; kontak sayfalarına bizzat bakılarak). Betik bunları rapora yazar; yeniden bakınca burada güncellenir.
# GOZ_BOYA: maskeli soy boya haritalarında (boya-tum-*.png) kıyafet/saç/zırh/eşya boyanan ya da yüzü boyanmayan jetonlar. Maske jeton
# başına tek dosya: aynı ırkın bütün boyalı soyları/tonları aynı bozukluğu taşır.
# GOZ_YARIK: kesim yarığı adayları (yarik-*.png): kusur = figür parçası (bilek, kabza, kol, asa, etek) düz biçilmiş; belirsiz = yakın
# görüntüde karar verilemedi; geri kalanı doğal boşluk.
GOZ_BOYA = {"elf/drow": {"bozuk": ["elf-kadin-barbarian-ID4", "elf-erkek-bard-ID7", "elf-kadin-bard-ID7", "elf-erkek-fighter-ID10", "elf-erkek-rogue-ID4", "elf-kadin-rogue-ID4", "elf-erkek-rogue-ID8", "elf-kadin-rogue-ID8", "elf-kadin-sorcerer-SC-3", "elf-kadin-sorcerer-SC-9", "elf-erkek-warlock-WL-3"], "supheli": ["elf-erkek-barbarian-ID4", "elf-kadin-cleric-ID1", "elf-erkek-druid-ID4", "elf-kadin-druid-ID4", "elf-kadin-druid-ID8", "elf-erkek-paladin-ID2", "elf-kadin-paladin-ID2", "elf-erkek-paladin-ID8", "elf-kadin-paladin-ID8", "elf-erkek-warlock-WL-4", "elf-kadin-warlock-WL-4", "elf-kadin-warlock-WL-8"]}, "human/ten-siyahi": {"bozuk": ["human-erkek-barbarian-ID4", "human-kadin-fighter-ID1", "human-kadin-fighter-ID10", "human-kadin-fighter-ID3", "human-erkek-rogue-ID4", "human-kadin-rogue-ID8", "human-erkek-sorcerer-SC-3", "human-erkek-sorcerer-SC-9", "human-kadin-sorcerer-SC-9", "human-erkek-warlock-WL-3", "human-kadin-warlock-WL-3", "human-erkek-wizard-WZ-A3"], "supheli": ["human-kadin-barbarian-ID4", "human-erkek-bard-ID7", "human-erkek-cleric-ID1", "human-kadin-cleric-ID1", "human-erkek-druid-ID4", "human-erkek-fighter-ID10", "human-kadin-paladin-ID2", "human-erkek-paladin-ID8", "human-kadin-paladin-ID8", "human-kadin-rogue-ID10", "human-kadin-rogue-ID4", "human-kadin-sorcerer-SC-3", "human-erkek-warlock-WL-4", "human-kadin-warlock-WL-4"]}, "tiefling/abyssal": {"bozuk": ["tiefling-kadin-bard-ID7", "tiefling-erkek-fighter-ID2", "tiefling-erkek-rogue-ID3", "tiefling-kadin-rogue-ID3", "tiefling-erkek-sorcerer-SC-2", "tiefling-erkek-sorcerer-SC-3", "tiefling-erkek-sorcerer-SC-9", "tiefling-kadin-sorcerer-SC-9", "tiefling-erkek-warlock-WL-7", "tiefling-kadin-warlock-WL-7", "tiefling-erkek-wizard-GR"], "supheli": ["tiefling-erkek-barbarian-ID8", "tiefling-kadin-barbarian-ID8", "tiefling-kadin-bard-ID1", "tiefling-erkek-cleric-ID9", "tiefling-kadin-monk-ID10", "tiefling-erkek-monk-ID11", "tiefling-kadin-monk-ID9", "tiefling-erkek-warlock-WL-4", "tiefling-erkek-fighter-ID4", "tiefling-kadin-fighter-ID4", "tiefling-erkek-fighter-ID5", "tiefling-kadin-fighter-ID5"]}, "gnome/subterranean": {"bozuk": ["gnome-kadin-fighter-ID1", "gnome-kadin-fighter-ID10", "gnome-erkek-rogue-ID4", "gnome-kadin-rogue-ID4", "gnome-erkek-rogue-ID8", "gnome-kadin-rogue-ID8", "gnome-erkek-sorcerer-SC-3", "gnome-kadin-sorcerer-SC-9", "gnome-erkek-wizard-GR"], "supheli": ["gnome-erkek-barbarian-ID4", "gnome-erkek-bard-ID3", "gnome-erkek-bard-ID7", "gnome-kadin-bard-ID7", "gnome-erkek-druid-ID4", "gnome-kadin-druid-ID4", "gnome-erkek-fighter-ID5", "gnome-kadin-sorcerer-SC-3", "gnome-erkek-warlock-WL-4", "gnome-kadin-warlock-WL-4", "gnome-kadin-warlock-WL-8"]}}
GOZ_YARIK = {"kusur": ["celestial-erkek-barbarian-GR", "celestial-erkek-barbarian-ID8", "celestial-erkek-cleric-ID8", "celestial-erkek-warlock-WL-1", "celestial-erkek-warlock-WL-2", "celestial-erkek-warlock-WL-4", "celestial-erkek-warlock-WL-6", "celestial-female-wizard", "celestial-kadin-barbarian-ID1", "celestial-male-warlock", "celestial-male-wizard", "dragonborn-erkek-fighter-ID8", "dragonborn-erkek-monk-ID9", "dragonborn-erkek-rogue-ID7", "dragonborn-erkek-sorcerer-SC-5", "dragonborn-erkek-warlock-WL-1", "dragonborn-erkek-warlock-WL-2", "dragonborn-erkek-warlock-WL-4", "dragonborn-erkek-warlock-WL-6", "dragonborn-kadin-bard-ID5", "dragonborn-kadin-bard-ID9", "dragonborn-kadin-druid-ID2", "dragonborn-kadin-fighter-GR", "dragonborn-kadin-monk-GR", "dragonborn-kadin-monk-ID8", "dragonborn-kadin-monk-ID9", "dragonborn-kadin-rogue-ID7", "dragonborn-kadin-warlock-WL-1", "dragonborn-kadin-warlock-WL-2", "dragonborn-kadin-warlock-WL-4", "dragonborn-male-warlock", "dwarf-erkek-barbarian-GR", "dwarf-erkek-druid-GR", "dwarf-erkek-monk-GR", "dwarf-erkek-sorcerer-GR", "dwarf-erkek-warlock-WL-4", "dwarf-female-warlock", "dwarf-kadin-barbarian-GR", "dwarf-kadin-barbarian-ID7", "dwarf-kadin-bard-GR", "dwarf-kadin-fighter-GR", "dwarf-kadin-monk-GR", "dwarf-kadin-warlock-WL-2", "dwarf-kadin-warlock-WL-6", "dwarf-male-warlock", "dwarf-male-wizard", "elf-erkek-barbarian-ID3", "elf-erkek-fighter-GR", "elf-erkek-monk-GR", "elf-erkek-paladin-GR", "elf-erkek-warlock-WL-1", "elf-erkek-warlock-WL-2", "elf-erkek-warlock-WL-6", "elf-female-warlock", "elf-kadin-druid-ID7", "elf-kadin-fighter-GR", "elf-kadin-warlock-WL-2", "elf-kadin-warlock-WL-4", "elf-kadin-warlock-WL-6", "elf-male-warlock", "gnome-erkek-druid-GR", "gnome-erkek-fighter-GR", "gnome-erkek-warlock-WL-2", "gnome-erkek-warlock-WL-6", "gnome-erkek-warlock-WL-7", "gnome-kadin-druid-GR", "gnome-kadin-monk-GR", "gnome-male-warlock", "goliath-erkek-monk-GR", "goliath-erkek-rogue-GR", "goliath-kadin-bard-GR", "goliath-kadin-druid-GR", "goliath-kadin-monk-GR", "halfling-erkek-barbarian-GR", "halfling-erkek-bard-GR", "halfling-erkek-druid-GR", "halfling-erkek-fighter-GR", "halfling-female-warlock", "halfling-kadin-barbarian-GR", "halfling-kadin-druid-GR", "halfling-kadin-fighter-GR", "halfling-kadin-monk-GR", "halfling-male-warlock", "human-erkek-barbarian-ID8", "human-erkek-druid-GR", "human-erkek-sorcerer-GR", "human-erkek-warlock-WL-1", "human-erkek-warlock-WL-2", "human-erkek-warlock-WL-6", "human-kadin-bard-ID5", "human-kadin-monk-GR", "human-kadin-paladin-GR", "human-kadin-warlock-WL-1", "human-kadin-warlock-WL-2", "human-kadin-warlock-WL-6", "human-male-warlock", "orc-erkek-bard-GR", "orc-erkek-monk-GR", "orc-erkek-sorcerer-GR", "orc-kadin-barbarian-GR", "orc-kadin-druid-GR", "orc-male-wizard", "tiefling-erkek-warlock-WL-1", "tiefling-erkek-warlock-WL-4", "tiefling-female-warlock", "tiefling-kadin-monk-GR", "tiefling-kadin-warlock-WL-2", "tiefling-kadin-warlock-WL-6", "tiefling-male-wizard"], "belirsiz": ["celestial-erkek-bard-GR", "celestial-erkek-cleric-ID4", "celestial-erkek-cleric-ID6", "celestial-erkek-cleric-ID7", "celestial-erkek-sorcerer-SC-9", "celestial-kadin-cleric-ID3", "celestial-kadin-fighter-GR", "celestial-kadin-ranger-GR", "celestial-kadin-rogue-ID9", "celestial-kadin-wizard-GR", "celestial-male-bard", "dragonborn-erkek-barbarian-ID9", "dragonborn-erkek-bard-GR", "dragonborn-erkek-bard-ID7", "dragonborn-erkek-fighter-ID2", "dragonborn-erkek-fighter-ID3", "dragonborn-erkek-paladin-GR", "dragonborn-erkek-paladin-ID10", "dragonborn-erkek-paladin-ID6", "dragonborn-erkek-paladin-ID9", "dragonborn-kadin-bard-GR", "dragonborn-kadin-bard-ID6", "dragonborn-kadin-cleric-ID6", "dragonborn-kadin-druid-ID8", "dragonborn-kadin-fighter-ID10", "dragonborn-kadin-fighter-ID3", "dragonborn-kadin-paladin-ID2", "dragonborn-kadin-ranger-ID4", "dragonborn-kadin-ranger-ID5", "dragonborn-kadin-ranger-ID6", "dragonborn-kadin-rogue-ID10", "dragonborn-kadin-sorcerer-SC-3", "dwarf-erkek-barbarian-ID4", "dwarf-erkek-cleric-GR", "dwarf-female-bard", "dwarf-kadin-barbarian-ID4", "dwarf-kadin-cleric-GR", "dwarf-kadin-druid-GR", "dwarf-kadin-paladin-GR", "dwarf-kadin-warlock-GR", "dwarf-kadin-warlock-WL-1", "dwarf-kadin-warlock-WL-7", "dwarf-kadin-wizard-WZ-B5", "elf-erkek-bard-GR", "elf-erkek-rogue-ID9", "elf-erkek-warlock-WL-4", "elf-kadin-bard-GR", "elf-kadin-monk-GR", "elf-kadin-warlock-WL-3", "gnome-erkek-ranger-GR", "gnome-female-bard", "gnome-female-paladin", "gnome-female-warlock", "gnome-kadin-bard-GR", "gnome-kadin-fighter-ID9", "gnome-kadin-paladin-GR", "gnome-kadin-sorcerer-GR", "gnome-kadin-warlock-GR", "gnome-kadin-wizard-WZ-B5", "goliath-erkek-cleric-GR", "goliath-erkek-cleric-ID1", "goliath-erkek-cleric-ID3", "goliath-erkek-sorcerer-SC-9", "goliath-female-bard", "goliath-kadin-cleric-ID7", "goliath-kadin-fighter-ID12", "goliath-kadin-fighter-ID8", "goliath-kadin-wizard-GR", "goliath-male-warlock", "halfling-erkek-bard-ID6", "halfling-erkek-druid-ID7", "halfling-erkek-rogue-ID3", "halfling-female-bard", "halfling-kadin-bard-GR", "halfling-kadin-bard-ID7", "halfling-kadin-cleric-ID8", "halfling-kadin-sorcerer-GR", "halfling-kadin-warlock-WL-4", "human-erkek-barbarian-ID6", "human-erkek-fighter-ID3", "human-erkek-fighter-ID8", "human-erkek-paladin-GR", "human-erkek-rogue-ID4", "human-erkek-warlock-WL-11", "human-erkek-warlock-WL-7", "human-kadin-fighter-GR", "human-kadin-fighter-ID6", "human-kadin-fighter-ID7", "human-kadin-monk-ID10", "human-kadin-sorcerer-GR", "human-kadin-warlock-GR", "human-male-barbarian", "orc-erkek-barbarian-GR", "orc-erkek-bard-ID5", "orc-erkek-fighter-ID10", "orc-erkek-fighter-ID2", "orc-erkek-monk-ID4", "orc-erkek-rogue-ID4", "orc-erkek-sorcerer-SC-9", "orc-kadin-barbarian-ID4", "orc-kadin-cleric-ID4", "orc-kadin-fighter-GR", "orc-kadin-paladin-GR", "orc-kadin-warlock-GR", "orc-kadin-warlock-WL-3", "orc-kadin-warlock-WL-6", "orc-male-warlock", "tiefling-erkek-cleric-ID4", "tiefling-erkek-druid-ID7", "tiefling-erkek-sorcerer-SC-9", "tiefling-female-bard", "tiefling-kadin-bard-ID1", "tiefling-kadin-ranger-ID5"]}

def load(name):
    return np.asarray(Image.open(f'{PUB}/{name}.webp').convert('RGBA')).astype(np.int16)

def jdump(path, obj): open(path, 'w', encoding='utf-8').write(json.dumps(obj, ensure_ascii=False))
def jload(path): return json.load(open(path, encoding='utf-8'))

def parse(name):
    """`<ırk>-<erkek|kadin>-<sınıf>-<hücre>` ya da sınıf-genel `<ırk>-<male|female>-<sınıf>`."""
    m = re.match(r'^([a-z]+)-(erkek|kadin)-([a-z]+)-(.+)$', name)
    if m: return dict(race=m[1], gender=m[2], cls=m[3], cell=m[4], genel=False)
    m = re.match(r'^([a-z]+)-(male|female)-([a-z]+)$', name)
    return dict(race=m[1], gender={'male': 'erkek', 'female': 'kadin'}[m[2]], cls=m[3], cell='genel', genel=True) if m else None

# ---------------------------------------------------------------- renk yardımcıları
def srgb_to_lab(rgb):
    """rgb (…,3) 0–255 → Lab (D65)."""
    c = rgb.astype(np.float64) / 255.0
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = c @ M.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)

def hsv(rgb):
    c = rgb.astype(np.float64) / 255.0
    mx, mn = c.max(-1), c.min(-1); d = mx - mn
    h = np.zeros_like(mx)
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    m = d > 1e-9
    hr = (mx == r) & m; hg = (mx == g) & m & ~hr; hb = m & ~hr & ~hg
    h[hr] = ((g - b)[hr] / d[hr]) % 6; h[hg] = (b - r)[hg] / d[hg] + 2; h[hb] = (r - g)[hb] / d[hb] + 4
    return h * 60, np.where(mx > 0, d / np.maximum(mx, 1e-9), 0), mx

# ---------------------------------------------------------------- 1. dosya düzeyi
KAL = 6
def runs(row):
    d = np.diff(np.concatenate([[0], row.astype(np.int8), [0]]))
    s = np.where(d == 1)[0]; e = np.where(d == -1)[0]
    return list(zip(s, e - s))

def slit(a):
    """Düz kesim yarığı (kesim-yarik-tara.py ile aynı ölçü): figür içinde 2–6 px kalın saydam bölüm, ardışık sütunlarda üst/alt kenar aynı
    satırda (±1). → (uzunluk, yön, satır, başlangıç, kalınlık) ya da None."""
    best = (0, None, None, None, None)
    for axis in (0, 1):
        m = a if axis == 0 else a.T
        h, w = m.shape
        seg = {}
        for x in range(w):
            col = m[:, x]
            if not col.any(): continue
            ys = np.where(col)[0]; lo, hi = ys[0], ys[-1]
            seg[x] = [(lo + st, lo + st + n) for st, n in runs(~col[lo:hi + 1]) if 2 <= n <= KAL]
        run_x, run_seg, run_n, th = None, None, 0, []
        for x in range(w + 1):
            hit = None
            if run_seg is not None:
                hit = next((sg for sg in seg.get(x, []) if abs(sg[0] - run_seg[0]) <= 1 and abs(sg[1] - run_seg[1]) <= 1), None)
            if hit is not None: run_n += 1; th.append(hit[1] - hit[0]); continue
            if run_seg is not None and run_n > best[0]:
                best = (run_n, 'yatay' if axis == 0 else 'dikey', run_seg[0], run_x, float(np.mean(th)))
            run_seg, run_x, run_n, th = None, None, 0, []
            for sg in seg.get(x, []):
                if any(abs(sg[0] - t[0]) <= 1 and abs(sg[1] - t[1]) <= 1 for t in seg.get(x + 1, [])):
                    run_seg, run_x, run_n, th = sg, x, 1, [sg[1] - sg[0]]; break
    return best if best[0] else None

def slit_class(a, s):
    """Yarığı sınıfla (ölçüyle): kesim kusuru mu doğal boşluk mu.
    Kesim kusuru (trim_lines/drop_lines): kalınlık sabit (çizgi), iki kenar cetvel gibi düz VE yarığın iki yanındaki opak satırlar birbirinin
    devamı (yarık bir parçayı ortadan biçmiş: üst ve alt kenardaki opak sütun kümeleri büyük ölçüde örtüşür), yarığın uçları figürün içinde.
    Doğal boşluk: iki kenar farklı şekilde (bacak arası, kol-gövde), örtüşme düşük."""
    n, yon, row, x0, th = s
    m = a if yon == 'yatay' else a.T
    x1 = x0 + n
    up = m[max(0, row - 1), x0:x1]; t = int(round(th)); dn = m[min(m.shape[0] - 1, row + t), x0:x1]
    up2 = m[max(0, row - 3):row, x0:x1].any(0); dn2 = m[row + t:row + t + 3, x0:x1].any(0)
    ov = float((up2 & dn2).sum()) / max(1, n)
    return ov

def cut_edges(im, minlen=8):
    a = im[..., 3] > A_OP; _, _, v = hsv(im[..., :3]); solid = (im[..., 3] >= 230) & (v >= 0.33)
    out = []
    for name, arr, ss in (('ust', a, solid), ('alt', a[::-1], solid[::-1]), ('sol', a.T, solid.T), ('sag', a.T[::-1], solid.T[::-1])):
        H, W = arr.shape
        for y in range(H):
            above = arr[y - 1] if y > 0 else np.zeros(W, bool)
            for st, ln in runs(arr[y] & ~above):
                if ln >= minlen: out.append((int(ln), round(float(ss[y, st:st + ln].mean()), 2), name, int(y), int(st)))
    return out

def file_stage():
    names = sorted(f[:-5] for f in os.listdir(PUB) if f.endswith('.webp'))
    rows = {}
    for i, nm in enumerate(names):
        im = load(nm); a = im[..., 3]; op = a > A_OP
        P = parse(nm)
        r = dict(name=nm, **P)
        ys, xs = np.where(op)
        if not len(ys): r['bos'] = True; rows[nm] = r; continue
        y0, y1, x0, x1 = int(ys.min()), int(ys.max()), int(xs.min()), int(xs.max())
        r.update(bbox=[x0, y0, x1, y1], opak=int(op.sum()))
        # kenara değme (dosyada kırpılma): her kenarda opak piksel sayısı (satır/sütun 0–1)
        r['kenar'] = dict(ust=int(op[:2].sum()), alt=int(op[-2:].sum()), sol=int(op[:, :2].sum()), sag=int(op[:, -2:].sum()))
        # düz yatay üst kesik: figürün üst %35'inde, üstü saydam olan en uzun yatay opak koşu (saç/şapka tepesi dalgalıdır)
        top = op[y0:y0 + max(4, int((y1 - y0) * 0.35))]
        best = 0; best_y = None
        for yy in range(top.shape[0]):
            above = op[y0 + yy - 1] if y0 + yy > 0 else np.zeros(op.shape[1], bool)
            edge = top[yy] & ~above
            for st, ln in runs(edge):
                if ln > best: best, best_y = ln, y0 + yy
        r['duzUst'] = [int(best), best_y]
        # konturu olmayan düz kenar (kesim kutusu/hücre sınırı biçmiş): siluetin dört yönünde ≥ 8 px düz sınır koşusu, koşudaki piksellerin
        # çoğu dolu renk (kontur değil: alfa ≥ 230 ve parlaklık ≥ 0,33). Doğal kenarda koyu/yarı saydam kontur olur.
        r['kesikKenar'] = sorted([c for c in cut_edges(im) if c[1] >= 0.5], reverse=True)[:4]
        # yarık
        s = slit(op)
        if s and s[0] >= 10:
            r['yarik'] = dict(uzunluk=int(s[0]), yon=s[1], satir=int(s[2]), bas=int(s[3]), kalinlik=round(s[4], 1), ortusme=round(slit_class(op, s), 2))
        # kopuk parçalar
        lab, n = ndi.label(op, structure=np.ones((3, 3)))
        if n > 1:
            sz = ndi.sum(op, lab, range(1, n + 1)); bi = int(np.argmax(sz)) + 1; body = lab == bi
            near = ndi.binary_dilation(body, iterations=4)
            fr = []
            for k in range(1, n + 1):
                if k == bi: continue
                comp = lab == k; c = int(sz[k - 1])
                if c < 6: continue
                cy, cx = ndi.center_of_mass(comp)
                fr.append(dict(px=c, yakin=bool((near & comp).any()), y=int(cy), x=int(cx)))
            r['parca'] = sorted(fr, key=lambda f: -f['px'])[:8]
        # zemin kalıntısı: kroma yeşili (ham sayfa yeşil zemin) ve beyaz hale; siluet kenarında (3 px) ya da tek başına
        rgb = im[..., :3]
        R, G, B = rgb[..., 0], rgb[..., 1], rgb[..., 2]
        green = op & (G >= 110) & (G - R >= 55) & (G - B >= 45)
        edge = op & ~ndi.binary_erosion(op, iterations=3)
        r['yesil'] = dict(kenar=int((green & edge).sum()), ic=int((green & ~edge).sum()))
        h_, s_, v_ = hsv(rgb)
        white = op & (v_ > 0.88) & (s_ < 0.12)
        edge1 = op & ~ndi.binary_erosion(op, iterations=1)
        r['beyazKenar'] = round(float((white & edge1).sum()) / max(1, edge1.sum()), 3)
        # kontur rengi: 1 px kenarın koyu piksellerinde yeşil baskınlığı
        dark = edge1 & (v_ < 0.35)
        if dark.sum() > 20:
            g_dom = ((G - np.maximum(R, B)) > 8) & dark
            r['yesilKontur'] = round(float(g_dom.sum()) / float(dark.sum()), 3)
        # yarı saydam kenar (yeniden örnekleme bulanıklığı) ve keskinlik
        semi = (a > 20) & (a < 235)
        r['yariSaydam'] = round(float(semi.sum()) / max(1, op.sum()), 3)
        L = srgb_to_lab(rgb)[..., 0]
        gx = np.abs(np.diff(L, axis=1)); gy = np.abs(np.diff(L, axis=0))
        inner = ndi.binary_erosion(op, iterations=2)
        gm = np.zeros_like(L); gm[:, :-1] += gx; gm[:-1, :] += gy
        v = gm[inner]
        r['keskin'] = round(float(np.percentile(v, 90)), 1) if v.size > 50 else None
        # 2×2 blok eşliği: pixel art büyütülmüşse komşu pikseller aynı; bulanık/yeniden örneklenmişse değil
        rows[nm] = r
        if i % 400 == 0: print('dosya', i, len(names))
    # küçük kopya farkı
    for nm, r in rows.items():
        kp = f'{PUB}/kucuk/{nm}.webp'
        if not os.path.exists(kp): r['kucuk'] = 'yok'; continue
        big = Image.open(f'{PUB}/{nm}.webp').convert('RGBA').resize((96, 96), Image.LANCZOS)
        sm = Image.open(kp).convert('RGBA')
        if sm.size != (96, 96): r['kucuk'] = f'boyut {sm.size}'; continue
        b = np.asarray(big).astype(int); s_ = np.asarray(sm).astype(int)
        r['kucukFark'] = round(float(np.abs(b[..., 3] - s_[..., 3]).mean()), 2)
    # sayfa içi boy aykırılığı (aynı ırk-cinsiyet-sınıf sayfası): figür yüksekliği ve üst kenarı
    pages = collections.defaultdict(list)
    for nm, r in rows.items():
        if r.get('bbox') and not r['genel']: pages[(r['race'], r['gender'], r['cls'], r['cell'][:2])].append(r)
    for k, lst in pages.items():
        hs = np.array([q['bbox'][3] - q['bbox'][1] for q in lst]); med = float(np.median(hs))
        for q in lst: q['boyOran'] = round((q['bbox'][3] - q['bbox'][1]) / max(1, med), 3)
    jdump(f'{VERI}/dosya.json', rows)
    print('dosya:', len(rows))

# ---------------------------------------------------------------- yardımcı: maske
def mask_of(nm):
    """Oyunun seçtiği maske dosyası (tint.ts maskUrlFor ile aynı öncelik): elle maske ağırlığı (0–1) ya da otomatik maske (0/1); yoksa None."""
    el = f'{PUB}/maske-el/{nm}.png'
    if os.path.exists(el):
        m = np.asarray(Image.open(el).convert('RGBA')).astype(float); return (m[..., 0] * m[..., 3] / 255.0) / 255.0, 'el'
    oto = f'{PUB}/maske/{nm}.png'
    if os.path.exists(oto):
        m = np.asarray(Image.open(oto).convert('RGBA')); return (m[..., 0] > 127).astype(float), 'oto'
    return None, None


# ---------------------------------------------------------------- 2. boya (tintedUrl çıktısı ↔ ham jeton)
def race_priors():
    """Irk başına ham ten rengi önceli: maske altındaki ham piksellerin Lab medyanı ve uzaklık eşiği (p90; en az 28). Maskesi olmayan ırkta
    Human önceli (ten ailesi)."""
    import glob, random
    random.seed(7)
    pri = {}
    for race in ('human', 'elf', 'gnome', 'tiefling', 'goliath', 'dragonborn'):
        fs = sorted(glob.glob(f'{PUB}/maske/{race}-*.png')) + sorted(glob.glob(f'{PUB}/maske-el/{race}-*.png'))
        labs = []
        for f in random.sample(fs, min(80, len(fs))):
            nm = os.path.basename(f)[:-4]; m, _ = mask_of(nm); im = load(nm)
            sel = (m > 0.5) & (im[..., 3] > A_OP)
            if sel.any(): labs.append(srgb_to_lab(im[..., :3][sel]))
        if not labs: continue  # KJ2: Dragonborn otomatik maskesi yok (pul maskesi ayrı); öncel Human'dan
        L = np.concatenate(labs); med = np.median(L, 0); d = np.linalg.norm(L - med, axis=1)
        pri[race] = dict(lab=med.tolist(), esik=float(max(28.0, np.percentile(d, 90))))
    return pri

def comps(mask, min_px):
    lab, n = ndi.label(mask, structure=np.ones((3, 3)))
    out = []
    for k in range(1, n + 1):
        c = lab == k; px = int(c.sum())
        if px >= min_px:
            ys, xs = np.where(c); out.append(dict(m=c, px=px, y=float(ys.mean()), x=float(xs.mean()), y0=int(ys.min()), y1=int(ys.max())))
    return out

def paint_analysis(nm, tinted, pri):
    """Boyalı jetonu ham jetonla karşılaştırır. Döner: boyanan piksel, ten dışı renkte boyanan oranı, yüz (en üstteki büyük boyalı bileşen)
    ile öteki boyalı bileşenlerin ΔE'si (boyalı hâlde), boyanmamış ten (yüzün ham rengine yakın ama boyanmamış), baş bölgesi boyası."""
    im = load(nm); a = im[..., 3] > A_OP
    t = np.asarray(tinted.convert('RGBA')).astype(np.int16)
    r = dict(alfaFark=int((np.abs(t[..., 3] - im[..., 3]) > 8).sum()))
    painted = a & (np.abs(t[..., :3] - im[..., :3]).max(-1) > 4)
    r['boyanan'] = int(painted.sum())
    if r['boyanan'] < 10: return r
    race = nm.split('-')[0]; P = pri.get(race, pri['human'])
    lab0 = srgb_to_lab(im[..., :3]); lab1 = srgb_to_lab(t[..., :3])
    dprior = np.linalg.norm(lab0 - np.array(P['lab']), axis=-1)
    nonskin = painted & (dprior > P['esik'])
    r['tenDisi'] = round(float(nonskin.sum()) / r['boyanan'], 3)
    if nonskin.sum():
        # ten dışı boyanan piksellerin ham renk medyanı (rapor: hangi renk boyanmış)
        r['tenDisiRenk'] = '#%02x%02x%02x' % tuple(int(v) for v in np.median(im[..., :3][nonskin], 0))
        ys = np.where(nonskin)[0]; r['tenDisiY'] = int(np.median(ys))
    ys, xs = np.where(a); by0, by1 = ys.min(), ys.max(); hh = by1 - by0
    head = np.zeros_like(a); head[by0:by0 + int(hh * 0.38) + 1] = True
    # baş bölgesindeki ten renkli (önceliğe yakın) ham piksellerden boyanmayan oran
    skin_head = a & head & (dprior <= P['esik'] * 0.8)
    if skin_head.sum() > 30: r['basTenBoyasiz'] = round(float((skin_head & ~painted).sum()) / float(skin_head.sum()), 3)
    cs = sorted(comps(painted, max(8, int(r['boyanan'] * 0.01))), key=lambda c: c['y'])
    if not cs: return r
    face = next((c for c in cs if c['px'] >= 0.08 * r['boyanan']), cs[0])
    r['yuzY'] = round((face['y'] - by0) / max(1, hh), 2)
    fl = lab1[face['m']].mean(0); f0 = lab0[face['m']].mean(0)
    others = []
    for c in cs:
        if c is face or c['px'] < 15: continue
        d = float(np.linalg.norm(lab1[c['m']].mean(0) - fl))
        others.append(dict(dE=round(d, 1), dL=round(float(lab1[c['m']].mean(0)[0] - fl[0]), 1), px=c['px'], y=round((c['y'] - by0) / max(1, hh), 2), x=int(c['x'])))
    r['parcalar'] = sorted(others, key=lambda o: -o['dE'])[:5]
    r['yuzDisiBoya'] = int(sum(o['px'] for o in others))
    # boyanmamış ten: yüzün ham ortalamasına ΔE < 9, boyanmamış, ≥ 5 px bileşen (kulak, boyun, el)
    near = a & ~painted & (np.linalg.norm(lab0 - f0, axis=-1) < 9)
    un = comps(near, 5)
    r['boyasizTen'] = int(sum(c['px'] for c in un))
    if un:
        big = max(un, key=lambda c: c['px']); r['boyasizTenYer'] = [int(big['x']), int(big['y']), big['px']]
        r['boyasizTenDE'] = round(float(np.linalg.norm(lab1[big['m']].mean(0) - fl)), 1)
    # yüz dışı ten rengi aile bileşenleri (eldiven/el adayı): boyanmamış, ten ailesi tonu (h 5–45°, s 0.25–0.8), koyu-orta açıklık,
    # bbox'un %35–80 yüksekliğinde; yüz boyasıyla ΔE (oyunda göze batan koyu el)
    h_, s_, v_ = hsv(im[..., :3])
    fam = a & ~painted & (h_ >= 5) & (h_ <= 45) & (s_ >= 0.25) & (s_ <= 0.85) & (lab0[..., 0] >= 22) & (lab0[..., 0] <= 62)
    band = np.zeros_like(a); band[by0 + int(hh * 0.35):by0 + int(hh * 0.8)] = True
    el = [c for c in comps(fam & band, 20) if c['px'] <= 500]
    if el:
        best = max(el, key=lambda c: c['px'])
        r['elAday'] = dict(px=best['px'], x=int(best['x']), y=int(best['y']), dE=round(float(np.linalg.norm(lab0[best['m']].mean(0) - lab1[face['m']].mean(0))), 1),
                           dL=round(float(lab0[best['m']].mean(0)[0] - lab1[face['m']].mean(0)[0]), 1))
    return r

def boya_stage():
    pri = race_priors(); jdump(f'{VERI}/ten-onceli.json', pri)
    meta = jload(f'{VERI}/boya.json')
    res = {}
    for i, (k, m) in enumerate(meta.items()):
        nm = m['src'].split('/')[-1][:-5]
        row = dict(src=nm, mask=m['mask'], fb=m['fb'], png=m['png'], tint=m['tint'])
        if m['png']:
            row.update(paint_analysis(nm, Image.open(f'{OUT}/boya/{k}.png'), pri))
        res[k] = row
        if i % 500 == 0: print('boya', i, len(meta))
    jdump(f'{VERI}/boya-olcum.json', res)
    print('boya:', len(res))

# ---------------------------------------------------------------- 2b. maske yeri (jeton başına; boyanan bölge = en çok pikseli boyayan soy boyası)
def mask_stage():
    """Jeton başına: boyanan bölgenin ham rengi baştaki TEN rengine (önceliğe yakın baş pikselleri; yoksa baştaki boyanan pikseller) göre
    ölçülür. tenDisi: boyanan piksellerden ham rengi bu tenden ΔE > 32 olanlar (kıyafet/saç/zırh/kanat renginde boya). yuzBoyasiz: baş
    bölgesinde bu tene ΔE < 12 olup boyanmayan oran. boyasizTen: bütün figürde tene ΔE < 10, boyanmamış, ≥ 6 px bileşenler (kulak, el, boyun)."""
    pri = jload(f'{VERI}/ten-onceli.json'); meta = jload(f'{VERI}/boya.json'); bo = jload(f'{VERI}/boya-olcum.json')
    todo = sorted(((v['src'], k) for k, v in bo.items() if v.get('png') and v.get('boyanan', 0) >= 10 and not v['src'].startswith('dragonborn-')))
    res = {}
    for i, (nm, k) in enumerate(todo):
        im = load(nm); a = im[..., 3] > A_OP
        t = np.asarray(Image.open(f'{OUT}/boya/{k}.png').convert('RGBA')).astype(np.int16)
        painted = a & (np.abs(t[..., :3] - im[..., :3]).max(-1) > 4)
        race = nm.split('-')[0]; P = pri.get(race, pri['human'])
        lab0 = srgb_to_lab(im[..., :3])
        ys, xs = np.where(a); by0, by1 = ys.min(), ys.max(); hh = by1 - by0
        head = np.zeros_like(a); head[by0:by0 + int(hh * 0.38) + 1] = True
        dpri = np.linalg.norm(lab0 - np.array(P['lab']), axis=-1)
        cand = a & head & (dpri <= P['esik'] * 1.2)
        src_ref = 'baş teni'
        if cand.sum() >= 40: ref = np.median(lab0[cand], 0)
        elif (painted & head).sum() >= 40: ref = np.median(lab0[painted & head], 0); src_ref = 'baştaki boya'
        else: ref = np.median(lab0[painted], 0); src_ref = 'bütün boya'
        d = np.linalg.norm(lab0 - ref, axis=-1)
        nonskin = painted & (d > 32)
        r = dict(src=nm, tint=meta[k]['tint'], boyanan=int(painted.sum()), ref=[round(float(q), 1) for q in ref], refKaynak=src_ref,
                 tenDisi=round(float(nonskin.sum()) / max(1, painted.sum()), 3), tenDisiPx=int(nonskin.sum()))
        if nonskin.sum() >= 10:
            r['tenDisiRenk'] = '#%02x%02x%02x' % tuple(int(q) for q in np.median(im[..., :3][nonskin], 0))
            r['tenDisiY'] = round((float(np.median(np.where(nonskin)[0])) - by0) / max(1, hh), 2)
        hs = a & head & (d < 12)
        if hs.sum() >= 20: r['yuzBoyasiz'] = round(float((hs & ~painted).sum()) / float(hs.sum()), 3)
        un = comps(a & ~painted & (d < 10), 6)
        r['boyasizTen'] = int(sum(c['px'] for c in un))
        if un:
            bg = max(un, key=lambda c: c['px']); r['boyasizTenYer'] = [int(bg['x']), int(bg['y']), bg['px']]
        res[k] = r
        if i % 500 == 0: print('maske', i, len(todo))
    # soy/ton sütunu (kombinasyonlardan: jeton + boya → görünüş sütunu)
    tl = {}
    for c in jload(f'{VERI}/kombinasyonlar.json'):
        if c['avatar'].get('tint'): tl[(c['avatar']['src'].split('/')[-1][:-5], json.dumps(c['avatar']['tint'], sort_keys=True))] = c['variant']
    for v in res.values(): v['variant'] = tl.get((v['src'], json.dumps(v['tint'], sort_keys=True)), '?')
    jdump(f'{VERI}/maske-olcum.json', res)
    print('maske:', len(res))

def paint_tile(nm, k, ref, size=192):
    """Boya haritası: ham | boyanan (yeşil: ten renginde, kırmızı: ten dışı renkte, sarı: boyanmamış ten) | oyundaki boyalı."""
    im = load(nm); a = im[..., 3] > A_OP
    t = np.asarray(Image.open(f'{OUT}/boya/{k}.png').convert('RGBA')).astype(np.int16)
    painted = a & (np.abs(t[..., :3] - im[..., :3]).max(-1) > 4)
    d = np.linalg.norm(srgb_to_lab(im[..., :3]) - np.array(ref), axis=-1)
    ov = im.copy().astype(np.float64); ov[..., :3] = ov[..., :3] * 0.35 + 40
    for m_, c in ((painted & (d <= 32), (60, 230, 90)), (painted & (d > 32), (255, 50, 50)), (a & ~painted & (d < 10), (255, 230, 40))):
        ov[m_, :3] = c
    ims = [on_bg(im.astype(np.uint8)), on_bg(ov.clip(0, 255).astype(np.uint8)), on_bg(t.astype(np.uint8))]
    can = Image.new('RGB', (3 * size + 4, size), (28, 31, 37))
    for j, q in enumerate(ims): can.paste(q.resize((size, size), Image.NEAREST), (j * (size + 2), 0))
    return can


# ---------------------------------------------------------------- 2c. ten tonu (yüz ↔ el/kol/boyun), Human dört kültür ve bütün tonlar
def tone_stage():
    """Human jetonlarının her tonu (Orijinal: ham jeton; Koyu/Altın: tintedUrl çıktısı) için: yüz = maskenin baş bandındaki en büyük
    bileşeni (oyunun boyadığı ten), öteki maske bileşenleri (el, kol, boyun; boyalı) ve maskeye girmeyen ten ailesi renkli bileşenler
    (h 5–45°, s 0,25–0,85; baş bandının altında, 20–500 px: el/bilek adayı; eldiven/deri de bu renkte olabilir → gözle). Ölçü: yüzle
    ΔE ve ΔL (çizilmiş hâlde)."""
    meta = jload(f'{VERI}/boya.json')
    tints = {}
    for k, v in meta.items():
        if v['src'].startswith('characters/human-') and v.get('png'):
            h = v['tint']['to']['lch']['h']; tints.setdefault(v['src'].split('/')[-1][:-5], {})['koyu' if h < 68 else 'altin'] = k
    res = {}
    names = sorted(f[:-5] for f in os.listdir(PUB) if f.startswith('human-') and f.endswith('.webp'))
    for nm in names:
        m, kind = mask_of(nm); raw = load(nm); a = raw[..., 3] > A_OP
        if m is None: continue
        mk = (m > 0.3) & a
        ys, xs = np.where(a); by0, by1 = ys.min(), ys.max(); hh = by1 - by0
        head = np.zeros_like(a); head[by0:by0 + int(hh * 0.4)] = True
        fc = comps(mk & head, 15)
        if not fc: res[nm] = dict(yuzYok=True); continue
        face = max(fc, key=lambda c: c['px'])
        h_, s_, v_ = hsv(raw[..., :3]); lab0 = srgb_to_lab(raw[..., :3])
        band = np.zeros_like(a); band[by0 + int(hh * 0.36):by0 + int(hh * 0.88)] = True
        fam = a & ~ndi.binary_dilation(mk, iterations=1) & band & (h_ >= 5) & (h_ <= 45) & (s_ >= 0.25) & (s_ <= 0.85) & (lab0[..., 0] >= 18)
        cand = [c for c in comps(fam, 20) if c['px'] <= 500]
        others = [c for c in comps(mk & ~face['m'], 12)]
        row = {}
        for tone in ('orijinal', 'koyu', 'altin'):
            if tone == 'orijinal': img = raw
            elif tone in tints.get(nm, {}): img = np.asarray(Image.open(f'{OUT}/boya/{tints[nm][tone]}.png').convert('RGBA')).astype(np.int16)
            else: continue
            lab = srgb_to_lab(img[..., :3]); fl = lab[face['m']].mean(0)
            def st(c): cl = lab[c['m']].mean(0); return dict(dE=round(float(np.linalg.norm(cl - fl)), 1), dL=round(float(cl[0] - fl[0]), 1), px=c['px'], x=int(c['x']), y=int(c['y']))
            row[tone] = dict(yuzL=round(float(fl[0]), 1), maske=sorted([st(c) for c in others], key=lambda q: -q['dE'])[:4],
                             el=sorted([st(c) for c in cand], key=lambda q: q['dL'])[:4])
        res[nm] = row
    jdump(f'{VERI}/ten-tonu.json', res)
    print('ten tonu:', len(res))

# ---------------------------------------------------------------- 3. oyunda çizilmiş hâl (savaş jetonu, rozet, kanat)
_shots = {}
def shot(path):
    if path not in _shots:
        if len(_shots) > 6: _shots.clear()
        _shots[path] = np.asarray(Image.open(path).convert('RGBA')).astype(np.int16)
    return _shots[path]

AYNA = set(jload('data/jeton-ayna.json')['sinifHucre'])
GOR = jload('data/alt-soy-gorunum.json')
FOOT = GOR.get('ayak', {}).get('yuzde', 1)
def mirrored(nm):
    m = re.match(r'^[a-z]+-(?:erkek|kadin|male|female)-([a-z]+-[A-Za-z]+-?\d+)$', nm)
    return bool(m and m[1] in AYNA)
def oran_of(race, lin):
    o = GOR['altSoylar'].get(f'{race}/{lin}', {}).get('oran')
    return (o['en'], o['boy']) if o else (1, 1)

def cizim_stage():
    combos = jload(f'{VERI}/kombinasyonlar.json')
    lookby = {}
    for c in combos: lookby.setdefault(c['avatar']['src'], c['look'])
    out = dict(jeton={}, rozet={}, kanat={})
    # 3a) savaş jetonu: ham alfa ↔ çizilmiş alfa (oran 1×1 olanlarda piksel piksel; oranlıda ayak çizgisinden ölçekli karşılık)
    J = jload(f'{VERI}/jeton.json'); cols, cell = J['cols'], J['cell']
    for e in J['index']:
        av = J['cells'][e['key']]; nm = av['src'].split('/')[-1][:-5]
        S = shot(f'{OUT}/cizim/jeton-{e["shot"]}.png'); i = e['i']
        x, y = (i % cols) * cell, (i // cols) * cell
        fin = S[y:y + cell, x:x + cell]
        im = load(nm)
        o = (im[..., 3] > A_OP); f = fin[..., 3] > 40
        if mirrored(nm): o = o[:, ::-1]
        lin = (av.get('look') or {}).get('lineageId')
        if lin and oran_of(av['look']['raceId'], lin) != (1, 1):
            # oranlı soy: ham silueti aynı dönüşümle (ayak çizgisinden, yatayda ortadan) ölçekle
            ex, by = oran_of(av['look']['raceId'], lin); foot = 256 * FOOT
            yy, xx = np.mgrid[0:256, 0:256]
            sx_ = np.clip(((xx - 128) / ex + 128).round().astype(int), 0, 255); sy_ = np.clip(((yy - foot) / by + foot).round().astype(int), 0, 255)
            o = o[sy_, sx_]
        lost = o & ~f
        out['jeton'][e['key']] = dict(src=nm, kayip=int(lost.sum()), fazla=int((f & ~ndi.binary_dilation(o, iterations=2)).sum()),
                                     kayipUst=int(lost[:int(256 * 0.3)].sum()))
    # 3b) rozet (LookFrame + AvatarBadge 84 px): kırpmalı ↔ kırpmasız; kırpılan figür pikselleri, figürün üst %30'unda olanlar (baş/şapka/taç)
    R = jload(f'{VERI}/rozet.json'); cols, cw, pad, size = R['cols'], R['cell'], R['pad'], R['size']
    for e in R['index']:
        av = R['cells'][e['key']]; nm = av['src'].split('/')[-1][:-5]
        K = shot(f'{OUT}/cizim/rozet-{e["shot"]}-kirp.png'); F = shot(f'{OUT}/cizim/rozet-{e["shot"]}-serbest.png'); i = e['i']
        x, y = (i % cols) * cw, (i // cols) * cw
        k = K[y:y + cw, x:x + cw, 3] > 60; f = F[y:y + cw, x:x + cw, 3] > 60
        clip = f & ~k
        ys, xs = np.where(f)
        if not len(ys): out['rozet'][e['key']] = dict(src=nm, bos=True); continue
        fy0, fy1 = ys.min(), ys.max(); top = fy0 + int((fy1 - fy0) * 0.3)
        ct = clip.copy(); ct[top + 1:] = False
        out['rozet'][e['key']] = dict(src=nm, look=av.get('look'), kirpilan=int(clip.sum()), kirpilanUst=int(ct.sum()), figur=int(f.sum()),
                                     ustTasma=int(max(0, pad - fy0)))
    # 3c) kanat: jeton yarı boyda hücre ortasında; kanat pikselleri = çizilmiş opak − jetonun kendi silueti (2 px genişletilmiş)
    Kn = jload(f'{VERI}/kanat.json'); cols, cell = Kn['cols'], Kn['cell']
    for e in Kn['index']:
        av = Kn['cells'][e['key']]; nm = av['src'].split('/')[-1][:-5]
        S = shot(f'{OUT}/cizim/kanat-{e["shot"]}.png'); i = e['i']
        x, y = (i % cols) * cell, (i // cols) * cell
        fin = S[y:y + cell, x:x + cell]
        tok = np.asarray(Image.open(f'{PUB}/{nm}.webp').convert('RGBA').resize((128, 128), Image.NEAREST))[..., 3] > 60
        sil = np.zeros((cell, cell), bool); sil[64:192, 64:192] = tok
        if lookby.get(av['src']) and lookby[av['src']].get('mirror'): sil[64:192, 64:192] = tok[:, ::-1]
        wing = (fin[..., 3] > 120) & ~ndi.binary_dilation(sil, iterations=3)
        if wing.sum() < 30: out['kanat'][e['key']] = dict(src=nm, look=av.get('look'), kanatPx=int(wing.sum())); continue
        h_, s_, v_ = hsv(fin[..., :3])
        hh = h_[wing]; ss = s_[wing]
        ang = np.deg2rad(hh); w = ss
        mh = float(np.rad2deg(np.arctan2((np.sin(ang) * w).sum(), (np.cos(ang) * w).sum())) % 360)
        out['kanat'][e['key']] = dict(src=nm, look=av.get('look'), kanatPx=int(wing.sum()), ton=round(mh), doygunluk=round(float(np.median(ss)), 3),
                                     parlaklik=round(float(np.median(v_[wing])), 3), renk='#%02x%02x%02x' % tuple(int(q) for q in np.median(fin[..., :3][wing], 0)))
    jdump(f'{VERI}/cizim-olcum.json', out)
    print('cizim:', {k: len(v) for k, v in out.items()})

# ---------------------------------------------------------------- 4. kontak sayfaları
def on_bg(arr, bg=(96, 104, 96)):
    im = Image.fromarray(arr.astype(np.uint8), 'RGBA'); b = Image.new('RGBA', im.size, bg + (255,)); b.alpha_composite(im); return b.convert('RGB')

def grid_page(path, tiles, cols, title, tw, th, lab_h=26):
    """tiles: [(PIL RGB, satır1, satır2, renk)]"""
    rows = (len(tiles) + cols - 1) // cols
    can = Image.new('RGB', (cols * (tw + 6) + 6, 22 + rows * (th + lab_h + 4)), (28, 31, 37)); d = ImageDraw.Draw(can)
    d.text((6, 5), title, fill=(240, 232, 200), font=FONT)
    for n, (im, l1, l2, col) in enumerate(tiles):
        x = 6 + (n % cols) * (tw + 6); y = 22 + (n // cols) * (th + lab_h + 4)
        can.paste(im, (x, y)); d.text((x, y + th + 1), l1[:int(tw / 6.2)], fill=col or (215, 218, 225), font=FONT)
        if l2: d.text((x, y + th + 13), l2[:int(tw / 6.2)], fill=col or (170, 175, 185), font=FONT)
    can.save(path)

def slit_pages(rows):
    """Kesim yarığı adaylarının yakın görüntüsü (yarığın çevresi 56 px, 2,25×; kırmızı çentik yarığın iki ucu)."""
    ys = sorted([r for r in rows.values() if 'yarik' in r], key=lambda r: -r['yarik']['uzunluk'])
    per = 96
    for pg in range(0, len(ys), per):
        tiles = []
        for r in ys[pg:pg + per]:
            y = r['yarik']; im = load(r['name']).astype(np.uint8)
            n, row, x0 = y['uzunluk'], y['satir'], y['bas']
            cx, cy = (x0 + n / 2, row) if y['yon'] == 'yatay' else (row, x0 + n / 2)
            half = max(28, min(64, n // 2 + 10))
            bx = int(max(0, min(256 - 2 * half, cx - half))); by = int(max(0, min(256 - 2 * half, cy - half)))
            crop = on_bg(im[by:by + 2 * half, bx:bx + 2 * half]).resize((126, 126), Image.NEAREST)
            d = ImageDraw.Draw(crop); k = 126 / (2 * half)
            if y['yon'] == 'yatay':
                for xx in (x0, x0 + n): d.line([((xx - bx) * k, (row - by) * k - 6), ((xx - bx) * k, (row - by) * k - 1)], fill=(255, 40, 40), width=2)
            else:
                for yy in (x0, x0 + n): d.line([((row - bx) * k - 6, (yy - by) * k), ((row - bx) * k - 1, (yy - by) * k)], fill=(255, 40, 40), width=2)
            no = pg + len(tiles) + 1; r['yarik']['no'] = no
            ab = r['name'].replace('-erkek-', '-E-').replace('-kadin-', '-K-').replace('-male-', '-E-').replace('-female-', '-K-')
            ab = re.sub(r'^(\w{3})\w*-', r'\1-', ab)
            tiles.append((crop, f'#{no} {ab}', f"{y['yon'][0]} {n}px", None))
        grid_page(f'{KONTAK}/yarik-{pg // per + 1}.png', tiles, 12, f'Kesim yarığı adayları {pg + 1}–{pg + len(tiles)} / {len(ys)} (uzunluğa göre; kırmızı çentik: yarığın uçları)', 126, 126)

def paint_pages():
    """Maskeli soyların bütün boya haritaları (jeton başına: boya haritası | oyundaki boyalı; sınıf/hücre sırasıyla), 84'er karo."""
    m = jload(f'{VERI}/maske-olcum.json')
    for var in ('elf/drow', 'elf/high-elf', 'human/ten-siyahi', 'tiefling/abyssal', 'gnome/subterranean'):
        L = sorted([(k, v) for k, v in m.items() if v.get('variant') == var], key=lambda kv: (parse(kv[1]['src'])['cls'], parse(kv[1]['src'])['cell'], kv[1]['src']))
        for pg in range(0, len(L), 84):
            tiles = []
            for n, (k, v) in enumerate(L[pg:pg + 84]):
                t = paint_tile(v['src'], k, v['ref'], size=96)
                t = t.crop((98, 0, t.width, 96))   # boya haritası | oyundaki
                nm = v['src'].replace('-erkek-', '-E-').replace('-kadin-', '-K-').replace('-male-', '-E-').replace('-female-', '-K-')
                tiles.append((t, f'#{pg + n + 1} {nm.split("-", 1)[1]}', None, None))
            grid_page(f'{KONTAK}/boya-tum-{var.replace("/", "-")}-{pg // 84 + 1}.png', tiles, 7,
                      f'{var} {pg + 1}–{pg + len(tiles)}/{len(L)}: boya haritası (yeşil ten renginde boyalı, kırmızı ten dışı, sarı boyanmamış ten) | oyundaki', 194, 96, lab_h=14)

def race_pages():
    """Irk başına bütün ham jetonlar (sınıf/hücre sırası; sınıf-genel jetonlar sonda), 80 px: kesim/oran/kalıntı gözle taraması."""
    for race in sorted({n.split('-')[0] for n in os.listdir(PUB) if n.endswith('.webp')}):
        names = sorted([f[:-5] for f in os.listdir(PUB) if f.startswith(race + '-') and f.endswith('.webp')], key=lambda n: (parse(n)['genel'], parse(n)['cls'], parse(n)['cell'], parse(n)['gender']))
        ab = lambda n: (lambda P: f"{'E' if P['gender'] == 'erkek' else 'K'} {P['cls'][:3]} {P['cell']}")(parse(n))
        tiles = [(on_bg(load(n).astype(np.uint8)).resize((80, 80), Image.LANCZOS), f'{ab(n)}', None, None) for i, n in enumerate(names)]
        grid_page(f'{KONTAK}/irk-{race}.png', tiles, 18, f'{race}: {len(names)} ham jeton (sınıf/hücre sırası; sınıf-genel jetonlar sonda, oyunda yalnız yedek)', 80, 80, lab_h=13)

def tone_pages():
    """Human Altın (en açık ton) ve Koyu tonda bütün jetonlar yan yana (yüz ↔ el uyumu gözle): orijinal | Koyu | Altın, gövde kırpılı."""
    meta = jload(f'{VERI}/boya.json'); tints = {}
    for k, v in meta.items():
        if v['src'].startswith('characters/human-') and v.get('png'):
            tints.setdefault(v['src'].split('/')[-1][:-5], {})['koyu' if v['tint']['to']['lch']['h'] < 68 else 'altin'] = k
    names = sorted([f[:-5] for f in os.listdir(PUB) if f.startswith('human-') and f.endswith('.webp')], key=lambda n: (parse(n)['genel'], parse(n)['cls'], parse(n)['cell'], parse(n)['gender']))
    tiles = []
    for i, nm in enumerate(names):
        row = [load(nm)] + [np.asarray(Image.open(f'{OUT}/boya/{tints[nm][t]}.png').convert('RGBA')).astype(np.int16) if t in tints.get(nm, {}) else load(nm) for t in ('koyu', 'altin')]
        can = Image.new('RGB', (3 * 100 + 4, 110), (28, 31, 37))
        for j, arr in enumerate(row): can.paste(on_bg(arr[20:240, 18:238].astype(np.uint8)).resize((100, 110), Image.NEAREST), (j * 102, 0))
        P = parse(nm); tiles.append((can, f"#{i + 1} {'E' if P['gender'] == 'erkek' else 'K'} {P['cls']} {P['cell']}" + ('' if nm in tints else ' (maskesiz)'), None, None))
    for pg in range(0, len(tiles), 60):
        grid_page(f'{KONTAK}/ten-human-{pg // 60 + 1}.png', tiles[pg:pg + 60], 6, f'Human ten tonu: Orijinal | Koyu (Tenhausser) | Altın (Saf Kent); yüz ile el/kol aynı tonda mı ({pg + 1}–{min(len(tiles), pg + 60)}/{len(tiles)})', 304, 110, lab_h=14)

# ---------------------------------------------------------------- 5. rapor
KESIM_DEFTERI = jload('data/cc-kesim-kaynak.json')['jetonlar'] if os.path.exists('data/cc-kesim-kaynak.json') else {}
def kaynak(nm):
    """Kaynak sayfa + hücre: kesim defteri (cc-kesim) kazananı; yoksa toplu kesim adlandırmasından tahmin (<sınıf>-<male|female>-<ırk>, hücre n)."""
    k = KESIM_DEFTERI.get(nm, {}).get('kazanan')
    if k: return f"{k['dosya']} h{k['hucre']}"
    P = parse(nm)
    if not P: return '?'
    g = 'male' if P['gender'] == 'erkek' else 'female'
    if P['genel']: return f"eski sınıf-genel ({P['race']}-{g}-{P['cls']})"
    if P['cell'] == 'GR': return f"Gariban sayfası ({P['race']} {g}) (tahmin)"
    n = re.sub(r'^(ID|SC-|WL-|WZ-)', '', P['cell'])
    return f"{P['cls']}-{g}-{P['race']}.jpg h{n} (tahmin)"

def rapor_stage():
    D = jload(f'{VERI}/dosya.json'); C = jload(f'{VERI}/kombinasyonlar.json'); B = jload(f'{VERI}/boya.json')
    M = jload(f'{VERI}/maske-olcum.json'); Z = jload(f'{VERI}/cizim-olcum.json'); RB = jload(f'{VERI}/rozet-bas.json')
    JJ = jload(f'{VERI}/jeton.json')
    races = sorted({r['race'] for r in D.values()}); classes = sorted({r['cls'] for r in D.values()})
    bozuk = collections.defaultdict(set); supheli = collections.defaultdict(set)   # ad → sorun türleri
    # kesim
    for n in GOZ_YARIK['kusur']: bozuk[n].add('kesim: yarık')
    for n in GOZ_YARIK['belirsiz']: supheli[n].add('kesim: yarık?')
    grp = collections.defaultdict(list)
    for r in D.values(): grp[(r['race'], r['gender'])].append(r['bbox'][3] - r['bbox'][1])
    med = {k: sorted(v)[len(v) // 2] for k, v in grp.items()}
    kucuk = sorted([(round((r['bbox'][3] - r['bbox'][1]) / med[(r['race'], r['gender'])], 2), r['name']) for r in D.values() if (r['bbox'][3] - r['bbox'][1]) / med[(r['race'], r['gender'])] < 0.8])
    for _, n in kucuk: bozuk[n].add('kesim: yanlış oran (yarı boy)')
    # kırpılma (dosya)
    kesik = ['celestial-kadin-sorcerer-SC-9']; kesik_s = ['dwarf-kadin-cleric-ID9']
    for n in kesik: bozuk[n].add('kırpılma: dosyada kafa/şapka üstten kesik')
    for n in kesik_s: supheli[n].add('kırpılma: hale ucu tuval kenarında')
    # rozet kırpması
    ragg = {}
    for npx, src, key in RB:
        nm = src.split('/')[-1][:-5]; ragg[nm] = max(ragg.get(nm, 0), npx)
    rozet = sorted([(v, k) for k, v in ragg.items() if v >= 10], reverse=True)
    for v, n in rozet: supheli[n].add('kırpılma: rozet çerçevesi baş üstünü kesiyor')
    # yanlış yer boyama
    for var, d in GOZ_BOYA.items():
        for n in d['bozuk']: bozuk[n].add(f'boya: yanlış yer ({var})')
        for n in d['supheli']: supheli[n].add(f'boya: yanlış yer? ({var})')
    # eski çizim (önceki kaynak denetimi, git: 2026-11-16'dan beri değişmedi)
    eski = [f'tiefling-kadin-druid-ID{i}' for i in (1, 2, 3, 5, 6, 7, 8)] + ['tiefling-erkek-druid-ID7']
    for n in eski: bozuk[n].add('eski çizim')
    # ten tonu
    bozuk['human-erkek-fighter-GR'].add('ten tonu: eller yüzden koyu (maskede el yok)')
    # ---- özet tablo
    L = ['# Jeton denetimi (JETON-DENETIM)', '',
         f'Üretildi: `python scripts/jeton-denetim.py` (2026-11-22, commit {subprocess.run("git rev-parse --short HEAD", shell=True, capture_output=True, text=True).stdout.strip()}). **Yalnız rapor**: hiçbir jeton, maske, filtre ya da `data/` dosyası değişmedi.',
         'Çizim oyunun kendi kodu ve bileşenleriyle (`scripts/jeton-denetim-cizim.ts` + `jeton-denetim-sayfa.tsx`, Vite + Chromium): `sheetAvatar` → `tintedUrl` (maske, maske onarımı, kafa kaplaması) → `TokenFigure` (savaş jetonu) ve `LookFrame` + `AvatarBadge` (rozet 84 px, kırpmalı/kırpmasız). Kontak sayfaları `gorsel-dokum/jeton-denetim/kontak/` (git dışı).', '',
         '## Kapsam ve yöntem', '',
         f'- Görünüş: **{len(C)}** kombinasyon (12 sınıf × Gariban + her alt sınıf hücre kimliği + ikinci form + alt sınıfsız 5. seviye × 10 ırk/{len({c["variant"] for c in C})} soy-ton-uyanış sütunu × 2 cinsiyet; jeton tabloları `data/<sınıf>-jeton.json` doğrudan, `icerik/` gerekmez). Ayrı jeton dosyası: {len({c["avatar"]["src"] for c in C})} (oyunda kullanılan) / {len(D)} (`public/characters/`).',
         f'- Boyalı jeton (jeton × soy boyası): {len(B)}; savaş jetonu çizimi {len(Z["jeton"])}; rozet çizimi {len(Z["rozet"])} (kırpmalı + kırpmasız); açık kanat {len(Z["kanat"])}.',
         '- Otomatik eleme (dosya: yarık, düz/konturuz kenar, kenara değme, kopuk parça, zemin kalıntısı, boy; boya: ham rengi ten mi, boyanmamış ten; çizim: alfa kaybı, rozet kırpması, kanat rengi) + **gözle**: aşağıdaki kontak sayfalarının hepsine bizzat bakıldı.',
         '- Bakılan sayfalar: `irk-<ırk>.png` (10 ırk × 290 ham jeton), `yarik-1…8.png` (729 yarık adayının hepsi, yakın görüntü), `boya-tum-<soy>-1…4.png` (Drow, Human Koyu, Tiefling Abyssal, Gnome Yeraltı: her maskeli jetonun boya haritası + oyundaki hâli; High Elf yalnız 1. sayfa), `boya-drow-rogue.png`, `boya-drow-sorcerer.png`, `ten-human-1…2.png` (Orijinal | Koyu | Altın), `ten-human-el-aday.png`, `bas-tepe.png`, `kesik-kenar*.png`, `rozet-bas.png`, `rozet-kirpma-en.png`, `kanat-0.png`.', '',
         '### Bilinen kötü örnekler (denetim yakalıyor mu)', '',
         '| Örnek | Sonuç |', '|---|---|',
         '| Human erkek Fighter GR, eski kesim (git `e6b1fc3a`): bilek/kabza yarığı | **Yakalandı**: yatay yarık 17 px (satır 162, kalınlık 3,8 px, üst kenar %94 dolu renk). Güncel dosyada yarık yok (düzeltilmiş). |',
         '| Human erkek Fighter GR, düzeltilmiş: eller yüzden koyu | **Yakalandı (ölçü + göz)**: maske yalnız yüz ve boyun; eller maskesiz. Altın tonda yüz L 81, el L ≈ 26–30 (ΔL −52…−56), Koyu (Tenhausser) tonda ΔL −19…−25, Orijinal ΔL ≈ −45. Kontak `ten-human-2.png` #78. Not: aynı otomatik ölçü saç örgüsünü de "el" sanıyor (`ten-human-el-aday.png`): el uyumsuzluğu için tek başına güvenilir değil, göz gerekli. |',
         '| Celestial erkek Cleric ID1–ID6, ID8 eski çizim | **Kaynak sayfası olmadan yakalanamaz** (ham sayfalar bu ortamda yok; aşağıda "Kapsam dışı"). Önceki `CELESTIAL-KAYNAK-DENETIM.md` yakalamıştı; dosyalar 4bdedcaf (2026-11-22) ile yenilendi. |',
         '| Dragonborn beyaz kanat (düzeltme öncesi) | Eski hâl çizim yarışıydı (kanat filtresi geç yüklenince beyaz); dosyada değil. Gerçek tarayıcıda açık kanat çizilip renk ölçüldü: 10 Dragonborn soyunun hepsi kendi tonunda (Black #57464e … Red #944940, White #f7d2d2); beyaz kalan yok. Ölçü (doygunluk < 0,10 ve beyaz olmayan soy) eski hatayı yakalardı; eski kod geri alınmadan gösterilemedi. |',
         '| Elf Drow "Sorcerer": gülen elf, mor tunik ve şapka boyanmış, yüz boyasız | **Yakalandı**, ama jeton Sorcerer değil **Bard ID7** (korkuluk kılıklı gülen elf; erkek ve kadın): maske şapka ve tuniği kapsıyor, yüz dışarıda. Sorcerer\'da aynı tarif yok; Sorcerer\'da ayrıca kadın SC-9 (yalnız sepet boyalı, yüz boyasız) ve kadın SC-3 bozuk. |',
         '| Elf Drow Rogue "19": kapüşon ve zırh boyanmış, yüz doğal | **Yakalandı**: Rogue **ID8** (boya sayfasında #199/#200), erkek ve kadın: maske kapüşonu ve göğüs zırhını kapsıyor, yüz dışarıda. |',
         '| İyi örnek: monokllü Elf Drow | Temiz: Rogue ID1 (erkek/kadın) yüz ve eller boyalı, giysi siyah (ten dışı boya oranı %3–4). |',
         '| Kafası kesik jetonlar | **Bulundu**: dosyada `celestial-kadin-sorcerer-SC-9` (silindir şapka tuvalin üst kenarında düz kesik, 164 opak piksel satır 0\'da); oyunda rozet çerçevesi 69 jetonda başın/şapkanın üstünü ≥ 10 px kesiyor (aşağıda). |', '']
    L += ['## Özet tablo (ırk × sınıf)', '', 'Hücre: bozuk / şüpheli jeton sayısı (bütün jetonlara bakıldı; "temiz" = 0/0). Bir jeton birden çok sorun taşıyabilir.', '',
          '| Irk | ' + ' | '.join(classes) + ' |', '|---|' + '---:|' * len(classes)]
    for rc in races:
        cells = []
        for cl in classes:
            ns = [n for n, r in D.items() if r['race'] == rc and r['cls'] == cl]
            bz = sum(1 for n in ns if n in bozuk); sp = sum(1 for n in ns if n in supheli and n not in bozuk)
            cells.append('temiz' if not bz and not sp else f'{bz}/{sp}')
        L.append(f'| {rc} | ' + ' | '.join(cells) + ' |')
    L += ['', f'Toplam: bozuk **{len(bozuk)}** jeton, şüpheli **{len([n for n in supheli if n not in bozuk and supheli[n]])}** jeton (sınıf-genel jetonlar dahil; oyunda yalnız alt sınıfsız eski kayıtta kullanılır).', '']
    # ---- bölümler
    def tab(rows, head):
        out = ['| ' + ' | '.join(head) + ' |', '|' + '---|' * len(head)]
        out += ['| ' + ' | '.join(str(c) for c in r) + ' |' for r in rows]
        return out
    L += ['## 1. Kesim', '', '### 1a. Yarık (bilek, kabza, kol, asa, etek düz biçilmiş): gerçek kusur', '',
          f'729 adayın hepsi yakın görüntüde (`yarik-1…8.png`) tek tek sınıflandı: **{len(GOZ_YARIK["kusur"])} gerçek kusur**, {len(GOZ_YARIK["belirsiz"])} belirsiz, geri kalanı doğal boşluk (bacak arası, kuyruk/pelerin şeridi, halka, kemer). Gariban (GR) ve Warlock WL-1/WL-2/WL-4 kusurların çoğunluğu (kullanıcının gördüğü bilek/el kopukluğu).',
          'Tahmini neden: eski `trim_lines` (2026-11-22 öncesi her yöndeki koyu şeridi kutunun herhangi bir bandına değince siliyordu) ve `drop_lines` (renkten bağımsız 60 px ince uzun parçayı siliyor). Toplu kesim ve `cc-kesim.py` aynı işlevi kullanır (`tk.trim_lines`); Warlock 110 jeton (bf3f183b) ve Gariban sayfaları düzeltmeden önce kesildi. Önerilen düzeltme: bu jetonları düzeltilmiş `trim_lines` ile ham sayfadan yeniden kesmek; `drop_lines`\'i yalnız koyu çizgiye ve yalnız kutu dış bandına sınırlamak (bkz. 1d).', '']
    yr = []
    for n in GOZ_YARIK['kusur']:
        y = D[n].get('yarik', {}); yr.append((f'`{n}`', y.get('yon', '?'), y.get('uzunluk', '?'), y.get('satir', '?'), kaynak(n)))
    L += tab(yr, ['Jeton', 'Yön', 'Yarık px', 'Satır/sütun', 'Kaynak (sayfa, hücre)']) + ['']
    L += ['Belirsiz (yakın görüntüde karar verilemedi; ham sayfayla karşılaştırılmalı): ' + ', '.join(f'`{n}`' for n in GOZ_YARIK['belirsiz']), '']
    L += ['### 1b. Yanlış oran (figür tuvalde yarı boyda)', '', 'Figür yüksekliği aynı ırk-cinsiyetin medyanının %52–59\'u (≈120–135 px; medyan ≈ 228 px). Gözle doğrulandı (`irk-gnome.png`, `irk-halfling.png`, boya sayfaları): figür tuvalin alt yarısında küçücük. Tahmini neden: sayfada iki sıra/küçük ölçekli çizim ya da yükseklik normalleştirmesi atlandı (aynı sayfanın 9 hücresi birlikte). Önerilen düzeltme: bu iki sayfayı (Barbarian kadın Gnome, Barbarian erkek Halfling) hedef figür boyuna (`FIG_H`) yeniden ölçeklemek.', '']
    L += tab([(f'`{n}`', f'{v:.2f}', kaynak(n)) for v, n in kucuk], ['Jeton', 'Boy / medyan', 'Kaynak']) + ['']
    yes = sorted([(r['yesil']['kenar'], r['name']) for r in D.values() if r['yesil']['kenar'] >= 400], reverse=True)
    L += ['### 1c. Zemin kalıntısı, kopuk parça, bulanıklık', '',
          f'- Yeşil (kroma) kenar pikseli ≥ 400 olan {len(yes)} jeton ölçüldü; ırk sayfalarında bakılanlar kasıtlı yeşil efekt (aura, büyü, zehir): kalıntı görmedim. Ölçü listesi `veri/dosya.json` `yesil`. **Tek tek yakın bakılmadı.**',
          f'- Beyaz hale (1 px kenarın beyaz oranı) en yüksek: ' + ', '.join(f"`{r['name']}` {r['beyazKenar']}" for r in sorted(D.values(), key=lambda r: -r['beyazKenar'])[:6]) + ' — kar/bulut/beyaz cüppe çizimi; ırk sayfalarında hale görmedim.',
          '- Bulanıklık: keskinlik (iç gradyan p90) en düşük jetonlar Sorcerer **SC-5** (gölge biçimi, kasıtlı yumuşak) ve Monk ID8 (duman); bulanık kesim görmedim.',
          '- Kopuk küçük parçalar yarık kusurlarıyla birlikte (`veri/dosya.json` `parca`); ayrıca bakılmadı.', '',
          '### 1d. Kesim betiklerinde aynı tuzak', '',
          '- `scripts/toplu-kesim.py` `trim_lines` (2026-11-22 düzeltmesi) hâlâ: kutunun üst/alt 16 px bandına değen ≥ 40 px yatay koyu şeridi ve sol/sağ banda değen dikey koyu şeridi siliyor. Kutu = figürün kendi sınırı olduğundan ayak tabanı, yere değen koyu gölge, başın üstündeki yatay asa/şapka siperi, figürün yanındaki dikey asa/mızrak sapı hâlâ silinebilir.',
          '- `scripts/cc-kesim.py` `keyed_rgba` her figür kutusunda aynı `tk.trim_lines`\'ı çağırır: düzeltmeden önce kesilen bütün CC jetonları (Warlock sayfaları, Gladyatör, Celestial Cleric 4bdedcaf) eski davranışla kesildi.',
          '- `scripts/toplu-kesim.py` `drop_lines`: yorumu "yalnız koyu ince çizgiler" diyor ama kod renkten bağımsız (`fg` üstünde 1×60 / 60×1 açma); 16×16 dolu bölgeye 3 px\'ten uzak her ince uzun parça (mızrak, yay kirişi, asa, kılıç namlusu) sayfa düzeyinde silinir. Öneri: `dk` (koyu) ile kesişim ve uzunluk eşiğini ızgara çizgisine göre (≥ 300 px) sınırlamak.', '']
    L += ['## 2. Kırpılma', '', '### 2a. Dosyada', '',
          '- **`celestial-kadin-sorcerer-SC-9`** (bozuk): silindir şapka tuvalin üst kenarında düz kesik (satır 0\'da 164 opak piksel). Kaynak: ' + kaynak('celestial-kadin-sorcerer-SC-9') + '. Öneri: daha küçük ölçekle yeniden yerleştirme ya da ham hücreden yeniden kesim.',
          '- `dwarf-kadin-cleric-ID9` (şüpheli): hale halkasının üst noktası tuval kenarına değiyor (7 px).',
          f'- Üst kenarı düz ve konturuz 130 jetonun hepsine bakıldı (`bas-tepe.png`): silindir şapka, miğfer, kapüşon, bayrak, kar başlığı, hale çizgisi: doğal; kafası traşlanmış başka jeton yok. Sol/sağ kenara değen 13+13 jeton silah/efekt ucu.', '',
          '### 2b. Oyunda: rozet çerçevesi (LookFrame + AvatarBadge)', '',
          'Savaş jetonu (`TokenFigure`) ve karakter ekranı figürü (`CharacterFigure`, taç/kanat kutusu dahil) kırpmıyor. Rozet (`.avatar`: daire, `overflow: hidden`, 3 px kenarlık) dairenin dışını kesiyor; kırpmasız çizimle farkı ölçüldü. Başın üstünde (orta ±18 px bant, figür tepesinden 30 px) kesilen piksel ≥ 10 olan **' + str(len(rozet)) + '** jeton (en çok: uzun şapka, kapüşon ucu, sivri saç, taç). Örnekler `rozet-bas.png`. Celestial yıldız tacı kırpılmıyor (`has-crown` taşmaya izin veriyor). Öneri: rozette figürü ayak çizgisinden %6–8 küçültmek ya da üst yarıda `overflow: visible` (taçtaki gibi).', '']
    L += ['Rozet kırpması ≥ 10 px (en çok kesilen önce): ' + ', '.join(f'`{n}` {v}' for v, n in rozet), '']
    # 3 ten tonu
    L += ['## 3. Ten tonu', '',
          '- **`human-erkek-fighter-GR`** (bozuk): eller maskede yok; yüz Altın/Koyu tona boyanırken eller ham kahverengi kalıyor (Altın ΔL ≈ −52). Kullanıcının gördüğü hata. Tenhausser (Koyu) tonda da yüz–el ayrımı (ΔL −19…−25) belirgin. Öneri: elle maskeye (`assets/soy-maske-el/`) iki eli eklemek ya da eldiven olarak bırakılacaksa Orijinal tonda da yüzle uyumlu hâle getirmek (karar kullanıcıda).',
          '- Human 290 jeton × 3 ton (Orijinal | Koyu | Altın) yan yana: `ten-human-1…5.png`. **1–2. sayfalara (120 jeton) gözle bakıldı**: başka belirgin yüz–el uyumsuzluğu görmedim; 100 px\'te el ayrıntısı sınırda. **3–5. sayfalara (170 jeton) bakılmadı** (otomatik ölçü güvenilmez çıktı: saç örgüsü/deri giysi el sanılıyor).',
          '- Maskeli öteki ırklarda (Drow, Tiefling, Gnome) yüz ile maskedeki öteki parçaların (el, kol, boyun) boyalı hâldeki farkı: aynı boyadan geçtikleri için ΔE ≤ 16 (`veri/boya-olcum.json` `parcalar`); boyanmamış ten parçaları boya sayfalarında sarıyla işaretli ve aşağıdaki "yanlış yer boyama" listelerinde.', '']
    # 4 yanlış yer boyama
    L += ['## 4. Yanlış yer boyama (maske kıyafet/saç/eşya üstünde ya da yüz dışarıda)', '',
          'Boya haritası: yeşil = ten renginde boyanan, kırmızı = ten dışı renkte boyanan (ham renk baştaki tenden ΔE > 32), sarı = boyanmamış ten. Maske jeton başına tek dosya olduğundan liste o ırkın bütün boyalı soylarında geçerli (Human Koyu/Altın; Tiefling Abyssal/Chthonic/Winged; Elf Drow; Gnome Yeraltı). Ölçü sütunu: ten dışı boyanan oranı / baştaki tenin boyanmayan oranı.', '']
    for var, d in GOZ_BOYA.items():
        mk = {v['src']: v for v in M.values() if v.get('variant') == var}
        rows = []
        for kind in ('bozuk', 'supheli'):
            for n in d[kind]:
                v = mk.get(n, {})
                rows.append((kind, f'`{n}`', f"{v.get('tenDisi', 0):.2f} / {(v.get('yuzBoyasiz') or 0):.2f}", v.get('tenDisiRenk', ''), kaynak(n)))
        L += [f'### {var}', ''] + tab(rows, ['Durum', 'Jeton', 'Ten dışı / yüz boyasız', 'Boyanan ham renk', 'Kaynak']) + ['']
    L += ['Öneri: maskesi bozuk jetonlar için `assets/soy-maske-el/` elle maske (yüz + eller + boyun; kıyafet/saç/eşya dışarıda) ya da `npm run soy-maske-ice`. Yüzü olmayan çizimler (iskelet, korkuluk maskesi, gölge, hayalet) için bilerek boş maske (Human\'daki 5 jeton gibi).', '',
          '- **High Elf** maskesiz HSL yolu (`soy-renkleri.json` `elf.lineages.high-elf`): ten tonu aralığındaki **bütün** pikseller (saç, deri, ahşap dahil) hafifçe kayıyor; tasarım gereği, etkisi küçük (s ×0,7, l ×1,08). 1. sayfaya bakıldı, ayrı listelenmedi.',
          '- **Goliath**: otomatik maske ırkta kapalı (`otoMaske: false`), bütün jetona soy filtresi; seçim bekliyor (ayrı görev). Orc, Dwarf, Halfling: boya yok (filtre ya da orijinal).', '']
    # 5 alfa
    kay = sorted({(v['kayip'], v['src'], (JJ['cells'][k].get('look') or {}).get('lineageId')) for k, v in Z['jeton'].items() if v['kayip'] >= 20}, reverse=True)
    L += ['## 5. Alfa kaybı (ham jeton ↔ oyunda çizilmiş)', '',
          f'- Boya (`tintedUrl`): {len(B)} boyalı çıktının hiçbirinde alfa değişmiyor (0 piksel).',
          f'- Savaş jetonu: oranlı soylarda (Halfling Kalın ×1,07/×0,93, Dwarf Knoll ×1,04) `image-rendering: pixelated` ölçeklemesi ince parçalardan piksel düşürüyor: **{len(kay)}** jetonda ≥ 20 piksel (en çok `{kay[0][1]}` {kay[0][0]} px). Oransız soylarda kayıp 0. Bu yakın bakılmadı; silah ucu/ince asa incelmesi olabilir. Öneri: oranı bütün jeton yerine ölçeklenmiş kopya dosyayla vermek ya da `image-rendering: auto`.',
          '- Rozet: çerçevenin kestiği pikseller bölüm 2b. Ham sayfa hücresi ↔ jeton kaybı (kesimde silinen) bölüm 1a (ham sayfalar yok; yarık ölçüsüyle).', '']
    # 6 eski çizim
    L += ['## 6. Eski çizim (kaynak uyumu)', '',
          '- Ham sayfalar (`sinif-sayfalari-final/Eksikler`, `assets-ham/`) bu ortamda **yok** (bulut kapsayıcısı; bağlı bilgisayar yok): kaynak karşılaştırması yeniden yapılamadı. Önceki iki denetimin bulguları git\'le doğrulandı:',
          '- **Kadın Tiefling Druid ID1, ID2, ID3, ID5, ID6, ID7, ID8** ve **erkek Tiefling Druid ID7**: dosyalar hâlâ 987fc6de (2026-11-16 toplu kesim); güncel `druid-female-tiefling.jpg` / `druid-male-tiefling.jpg` sayfalarından kesilmemiş (EKSIKLER-KAYNAK-DENETIM.md). Öneri: `cc-kesim.py` ile güncel sayfadan yeniden kesim.',
          '- Celestial erkek Cleric ID1–ID6, ID8: 4bdedcaf (2026-11-22) ile kabul edilen sayfadan yeniden kesildi (güncel). Ancak bu kesim `trim_lines` düzeltmesinden (18a311bc) önce: yarık kusuru erkek Cleric ID8, belirsiz erkek ID4, ID6 (yeni kesilenlerden) ve ID7, kadın ID3 (bölüm 1a).',
          '- Öteki 2900 jetonun "en güncel kabul edilmiş çizim mi" sorusu ham sayfa olmadan cevaplanamaz (bakılamadı).', '']
    # 7 filtre ve kanat
    fb = collections.Counter(); fbn = collections.defaultdict(set)
    for v in B.values():
        if v['fb']:
            r = v['src'].split('/')[-1].split('-')[0]; fb[r] += 1; fbn[r].add(v['src'].split('/')[-1][:-5])
    L += ['## 7. Filtre ve kanat', '',
          '- Maske varsa yedek filtre kapalı: boyası başarılı hiçbir jetonda yedek filtre yok (ölçüldü). Yedek filtreyle çizilenler (maske yok ya da boş HSL):',
          '  - Goliath: bütün jetonlar × 6 soy (otomatik maske kapalı; ayrı görev, seçim bekliyor).',
          '  - Gnome Yeraltı: ' + ', '.join(f'`{n}`' for n in sorted(fbn['gnome'])),
          '  - Elf (Drow/High Elf): ' + ', '.join(f'`{n}`' for n in sorted(fbn['elf'])),
          '  - Tiefling: ' + ', '.join(f'`{n}`' for n in sorted(fbn['tiefling'])),
          '  - Human: yok. Bilerek boş maske (çıplak ten yok, boyasız): Paladin ID3 erkek/kadın, Sorcerer SC-5 erkek, Warlock WL-10 erkek/kadın (beklenen 5 jeton, doğrulandı). Elf\'te de boş maske: Sorcerer SC-5 e/k, Warlock WL-10 e/k, WL-4 e/k, Paladin ID3 kadın.',
          '- Kanat (gerçek tarayıcıda uçarken, `kanat-0.png`): Dragonborn 10 soyun her biri kendi renginde (beyaz kalan yok); Dragonborn Cleric ID1 kendi melek kanadıyla çizili, ejderha kanadı eklenmiyor (doğru). Tiefling Kanatlı mor (#9d5793), Celestial Kırık Kanat beyaz-gri (#e7e7e7; tasarım). Celestial Gece Gözyaşı gri filtresi ve hale gizleme çözücüden.',
          '- Orc, Goliath, Dwarf, Gnome maske işi ayrı görevde: yalnız mevcut durum (Orc/Dwarf soy filtresi, Gnome Yeraltı maskeli, Goliath yedek filtre).', '']
    # 8-9 eşleme ve görünen hâl
    gen = collections.Counter(c['avatar']['src'] for c in C if '-male-' in c['avatar']['src'] or '-female-' in c['avatar']['src'])
    L += ['## 8. Eşleme ve oyunda görünen hâl', '',
          '- Dragonborn eski sınıf-genel jetonları: **hiçbir kombinasyonda kullanılmıyor** (alt sınıfsız 5. seviyede de Gariban jetonu). Doğrulandı.',
          f'- Sınıf-genel jetonlar yalnız "alt sınıfsız seviye ≥ 3" satırında ({sum(gen.values())} kombinasyon; oluşturucu alt sınıf istediği için yalnız eski kayıt).',
          '- Birlik Manastırı Cleric < 17 → ID3, 17+ → ID9; Gladyatör = Champion → Fighter ID12; Pehlivan 10+ → ID5; kadın İmparator ve erkek Karadul kombinasyonu yok (normal). Hepsi doğrulandı. Kadın Gnome beyaz saç bilinçli (Gnome sayfalarında kadınlar beyaz saçlı).',
          '- Eksik jeton dosyası: 0 (her kombinasyonun jetonu var).',
          '- Hapishane mahkûm kıyafeti (`outfit-mahkum`: Monk jetonu + sepya filtre): ayrıca çizilmedi; **bakılmadı** (Monk jetonları savaş jetonu ve ırk sayfalarında bakıldı).', '']
    L += ['## Kapsam dışı / bakılamayanlar', '',
          '- Ham sınıf sayfaları (Windows `C:\\Users\\90546\\OneDrive\\Masaüstü\\sinif-sayfalari-final\\Eksikler`, `assets-ham/`): bu ortamda yok → kaynak uyumu (madde 3) ve ham hücre ↔ jeton baş yüksekliği karşılaştırması yapılamadı; eksik sayfalar (sayfa 30: 8 erkek Wizard vb.) da denetlenemedi.',
          '- Human ten sayfaları 3–5 (170 jeton) gözle bakılmadı; High Elf boya sayfaları 2–4 bakılmadı.',
          '- Yeşil kenar ölçüsü yüksek 736 jetona ayrı yakın bakılmadı (ırk sayfalarında genel bakış).',
          '- Oranlı soyların savaş jetonu piksel kaybı (106 jeton) yakın bakılmadı.',
          '- Ölçüm ve kontak sayfaları: `gorsel-dokum/jeton-denetim/` (git dışı); yeniden üretim `python scripts/jeton-denetim.py --ciz`.', '']
    open(MD, 'w', encoding='utf-8', newline='\n').write('\n'.join(L) + '\n')
    print('rapor:', MD, len(bozuk), 'bozuk')

if __name__ == '__main__':
    if '--ciz' in ARG:
        subprocess.run('npx vite-node scripts/jeton-denetim-cizim.ts', shell=True, check=True)
    if 'dosya' in ASAMA: file_stage()
    if 'boya' in ASAMA: boya_stage(); mask_stage(); tone_stage()
    if 'cizim' in ASAMA: cizim_stage()
    if 'kontak' in ASAMA:
        rows = jload(f'{VERI}/dosya.json'); slit_pages(rows); jdump(f'{VERI}/yarik-no.json', {r['yarik']['no']: r['name'] for r in rows.values() if 'yarik' in r})
        paint_pages(); race_pages(); tone_pages()
    if 'rapor' in ASAMA: rapor_stage()
