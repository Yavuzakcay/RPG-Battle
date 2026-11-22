"""
Celestial jeton kaynak denetimi (yalnız rapor; hiçbir jeton yazılmaz, yeniden kesim yapılmaz).

Oyundaki her Celestial jetonu (`public/characters/celestial-*.webp`, kucuk/ hariç) kendi aday ham kaynak hücreleriyle görsel olarak
karşılaştırılır ve "oyundaki dosya hangi çizimden geliyor, en yeni kabul edilen kaynak bu mu" sorusu yanıtlanır.

Kaynaklar (ham klasör depo dışı; varsayılan ../RPG-Battle-ham/assets-ham, `--ham <klasör>`):
  - eski çizim: eksikler/hale-gemini-sayfa-NN.png hücre h (hale-gemini-eslesme.csv; özgün tam sınıf sayfasının halesi silinmiş
    hâli, çizim aynı)
  - hale düzeltme: eksikler/hale-gemini-duzeltme-sayfa-0N.jpg (hale-gemini-duzeltme-eslesme.csv)
  - yeniden çizilmiş tam sayfalar (kullanıcının kabul ettiği son çizimler): clerik-male-celestial.jpg (3x3, hücre n = Cleric IDn),
    warlock-male-celestial.jpg (WL-1..11), gladiator-tiefling-celestial-*.jpg (hücre 2 = fighter ID12), erkek/kadin-5'li.jpg
    (hücre 1 = bard ID3), celestial-kadin-rogue-ID3-duzeltme.jpg
Öncelik (en yeni kabul edilen): tek hücre düzeltmesi > yeniden çizilmiş tam sayfa > hale düzeltme sayfası > hale sayfası.

Benzerlik: zemin (macenta/yeşil anahtar) ayıklanır, ana figür (büyük bileşenler) alınır; skor 0–100 = bütün figürün ve baş
bölgesinin (üst %30: saç, alın, göz) renk dağılımı (6×6×6 histogram) farkının ortalaması. Oyundaki jeton en çok hangi kaynağa benziyorsa "kaynağı" odur.

Çıktı: harita/belgeler/CELESTIAL-KAYNAK-DENETIM.md + gorsel-dokum/celestial-kaynak/*.png (görseller commit edilmez).
Çalıştırma: python scripts/celestial-kaynak-denetim.py [--ham <klasör>]
"""
import csv, json, os, subprocess, sys
from collections import Counter, defaultdict
import numpy as np
from PIL import Image, ImageDraw, ImageFont
try: FONT = ImageFont.truetype('arial.ttf', 12)
except OSError: FONT = ImageFont.load_default()

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HAM = sys.argv[sys.argv.index('--ham') + 1] if '--ham' in sys.argv else os.path.join(ROOT, '..', 'RPG-Battle-ham', 'assets-ham')
EK = os.path.join(HAM, 'eksikler')
PUB = os.path.join(ROOT, 'public', 'characters')
OUT = os.path.join(ROOT, 'gorsel-dokum', 'celestial-kaynak')
MD = os.path.join(ROOT, 'harita', 'belgeler', 'CELESTIAL-KAYNAK-DENETIM.md')
N = 64
os.makedirs(OUT, exist_ok=True)

# ------------------------------------------------------------------ figür ayıklama
def fg_mask(rgb: np.ndarray) -> np.ndarray:
    """Ön plan: macenta ve yeşil zemin (anahtar renkleri) ile tam boy koyu ızgara çizgileri dışı."""
    a = rgb.astype(int); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    magenta = (r > 170) & (b > 170) & (g < 110)
    green = (g > 160) & (r < 120) & (b < 120)
    m = ~(magenta | green)
    dark = a.sum(axis=2) < 150
    rr = dark.mean(axis=1) > 0.4; cc = dark.mean(axis=0) > 0.4
    m[rr, :] &= ~dark[rr, :]
    m[:, cc] &= ~dark[:, cc]
    return m

def components(mask: np.ndarray, step: int = 4):
    """8-bağlı bileşenler (küçültülmüş maske üstünde BFS); dönüş: [(alan, (y0, y1, x0, x1) tam boy, etiket maskesi tam boy)]."""
    small = mask[::step, ::step]
    h, w = small.shape; lab = np.zeros((h, w), np.int32); cur = 0; out = []
    ys, xs = np.nonzero(small)
    for y, x in zip(ys, xs):
        if lab[y, x]: continue
        cur += 1; stack = [(y, x)]; lab[y, x] = cur; pts = []
        while stack:
            cy, cx = stack.pop(); pts.append((cy, cx))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < h and 0 <= nx < w and small[ny, nx] and not lab[ny, nx]:
                        lab[ny, nx] = cur; stack.append((ny, nx))
        py = [p[0] for p in pts]; px = [p[1] for p in pts]
        out.append((len(pts), (min(py) * step, (max(py) + 1) * step, min(px) * step, (max(px) + 1) * step), cur))
    return out, lab, step

def body(rgb: np.ndarray, mask: np.ndarray, step: int = 4):
    """Ana figür: en büyük bileşen ve onun %15'inden büyük parçalar (kıvılcım, komşu hücre taşması, ızgara kalıntısı düşer)."""
    comps, lab, st = components(mask, step)
    if not comps: return rgb, mask
    big = max(comps, key=lambda c: c[0])
    keep = {c[2] for c in comps if c[0] >= big[0] * 0.15}
    full = np.kron(np.isin(lab, list(keep)), np.ones((st, st), bool))[:mask.shape[0], :mask.shape[1]]
    return rgb, mask & full

def trim(mask: np.ndarray):
    rows, cols = mask.sum(1), mask.sum(0)
    r = np.where(rows > max(1, rows.max() * 0.01))[0]; c = np.where(cols > max(1, cols.max() * 0.01))[0]
    if len(r) == 0 or len(c) == 0: return None
    return r[0], r[-1] + 1, c[0], c[-1] + 1

BINS = 6
def chist(px: np.ndarray) -> np.ndarray:
    if len(px) == 0: return np.zeros(BINS ** 3)
    q = np.clip(px.astype(int) * BINS // 256, 0, BINS - 1)
    h = np.bincount(q[:, 0] * BINS * BINS + q[:, 1] * BINS + q[:, 2], minlength=BINS ** 3).astype(float)
    return h / h.sum()

def norm(rgb: np.ndarray, mask: np.ndarray):
    """Renk dağılımı özellikleri (kırpma ve ölçekten bağımsız): bütün figür ve baş bölgesi (figürün üst %30'u: saç, alın, göz)."""
    bb = trim(mask)
    if bb is None: return None
    y0, y1, x0, x1 = bb
    m = mask[y0:y1, x0:x1]; c = rgb[y0:y1, x0:x1]
    hy = max(1, int((y1 - y0) * 0.30))
    return {'h': chist(c[m]), 'hh': chist(c[:hy][m[:hy]])}

def dist(a, b):
    all_ = float(np.abs(a['h'] - b['h']).sum()) * 50; head = float(np.abs(a['hh'] - b['hh']).sum()) * 50
    return {'skor': round((all_ + head) / 2, 1), 'renk': round(all_, 1), 'bas': round(head, 1)}

def token_fig(name: str):
    im = np.asarray(Image.open(os.path.join(PUB, name)).convert('RGBA'))
    return norm(*body(im[..., :3], im[..., 3] > 40, 2))

_pages = {}
def page(path):
    if path not in _pages: _pages[path] = np.asarray(Image.open(path).convert('RGB'))
    return _pages[path]

def grid_cell(path, n, cols, rows):
    a = page(path); h, w, _ = a.shape; cw, ch = w // cols, h // rows
    r, c = (n - 1) // cols, (n - 1) % cols
    sub = a[r * ch:(r + 1) * ch, c * cw:(c + 1) * cw]
    return body(sub, fg_mask(sub))

def split_figs(path):
    """Figürler okuma sırasıyla: büyük bileşenler (en büyüğün %15'i ve üstü), üst kenara göre satırlara, satırda soldan sağa."""
    a = page(path); m = fg_mask(a)
    comps, lab, st = components(m)
    big = max(c[0] for c in comps)
    figs = [c for c in comps if c[0] >= big * 0.15]
    hs = sorted(c[1][1] - c[1][0] for c in figs); med = hs[len(hs) // 2]
    figs.sort(key=lambda c: c[1][0]); rowsl = []
    for c in figs:
        if rowsl and c[1][0] - rowsl[-1][0][1][0] < med * 0.5: rowsl[-1].append(c)
        else: rowsl.append([c])
    out = []
    for row in rowsl:
        for c in sorted(row, key=lambda c: c[1][2]):
            y0, y1, x0, x1 = c[1]
            full = np.kron(lab == c[2], np.ones((st, st), bool))[:m.shape[0], :m.shape[1]]
            out.append((a[y0:y1, x0:x1], (m & full)[y0:y1, x0:x1]))
    return out

_split = {}
def split_cell(path, n):
    if path not in _split: _split[path] = split_figs(path)
    f = _split[path]
    return f[n - 1] if 0 < n <= len(f) else None

# ------------------------------------------------------------------ kaynak listesi
def rcsv(name):
    return list(csv.DictReader(open(os.path.join(EK, name), encoding='utf-8-sig')))

src = defaultdict(list)  # jeton adı (uzantısız) → [(öncelik, etiket, yol, hücre, yöntem)]
for r in rcsv('hale-gemini-eslesme.csv'):
    src[r['dosya'][:-5]].append((1, f"hale sayfa {r['sayfa']} h{r['hucre']}", os.path.join(EK, f"hale-gemini-sayfa-{r['sayfa']}.png"), int(r['hucre']), 'grid3'))
for r in rcsv('hale-gemini-duzeltme-eslesme.csv'):
    if r['yeni_sayfa']:
        src[r['dosya'][:-5]].append((2, f"hale düzeltme {r['yeni_sayfa']} h{r['yeni_hucre']}", os.path.join(EK, f"hale-gemini-duzeltme-sayfa-{r['yeni_sayfa']}.jpg"), int(r['yeni_hucre']), 'split'))
for n in range(1, 10):
    src[f'celestial-erkek-cleric-ID{n}'].append((3, f'clerik-male-celestial h{n}', os.path.join(EK, 'clerik-male-celestial.jpg'), n, 'grid3'))
for n in range(1, 12):
    src[f'celestial-erkek-warlock-WL-{n}'].append((3, f'warlock-male-celestial h{n}', os.path.join(EK, 'warlock-male-celestial.jpg'), n, 'split'))
for g, f in (('erkek', 'gladiator-tiefling-celestial-male.jpg'), ('kadin', 'gladiator-tiefling-celestial-female.jpg')):
    src[f'celestial-{g}-fighter-ID12'].append((3, f'{f[:-4]} h2', os.path.join(EK, f), 2, 'split'))
for g, f in (('erkek', "erkek-5'li.jpg"), ('kadin', "kadin-5'li.jpg")):
    src[f'celestial-{g}-bard-ID3'].append((3, f'{f[:-4]} h1', os.path.join(EK, f), 1, 'split'))
src['celestial-kadin-rogue-ID3'].append((4, 'celestial-kadin-rogue-ID3-duzeltme', os.path.join(EK, 'celestial-kadin-rogue-ID3-duzeltme.jpg'), 1, 'split'))

ledger = json.load(open(os.path.join(ROOT, 'data', 'cc-kesim-kaynak.json'), encoding='utf-8'))['jetonlar']
# Kesim defterinin (scripts/cc-kesim.py) kazanan kaynağı listede yoksa o da aday (ör. erkek WZ-B5 düzeltme 03 h7, kadın SC-3 sorcerer-duzelt-B).
PR = {'taban': 1, 'yeni': 3, 'diger': 3, 'duzeltme': 4}
for name, v in ledger.items():
    k = v['kazanan']; path = os.path.join(EK, k['dosya'])
    if name.startswith('celestial-') and os.path.exists(path) and not any(c[2] == path for c in src[name]):
        src[name].append((PR.get(k['kaynak'], 2), f"{k['dosya'].rsplit('.', 1)[0]} h{k['hucre']} (defter)", path, int(k['hucre']), 'split'))

# Git uyumu: dosyanın son commit'i, defterdeki kazanan kaynağın kesim adımının commit'i olmalı (sonradan başka bir şey üstüne yazmamış).
ADIM = {'taban': 'fd1fc974', 'yeni': 'bf3f183b', 'diger': '456a7d6d'}
def adim_commit(k):
    if k is None: return None
    if k['dosya'] == 'git:2360265b': return '3c1d443d'
    if k['dosya'] == 'celestial-kadin-rogue-ID3-duzeltme.jpg': return 'a7634e45'
    if k['dosya'].startswith('hale-gemini-duzeltme'): return '09f2ec04'
    return ADIM.get(k['kaynak'])
CC_ONCESI = {'d58f314f', '2c48a5b2', '2360265b', '636d4136', '987fc6de', '4fd37780', '5f34ed3a', 'e6b1fc3a'}

def git_hist(f):
    out = subprocess.run(['git', 'log', '--format=%h %ad %s', '--date=short', '--', f'public/characters/{f}'], cwd=ROOT, capture_output=True, text=True, encoding='utf-8').stdout.strip().splitlines()
    return out

tokens = sorted(f for f in os.listdir(PUB) if f.startswith('celestial-') and f.endswith('.webp'))
rows = []
for f in tokens:
    name = f[:-5]; tf = token_fig(f)
    cands = []
    for pr, label, path, n, how in sorted(src.get(name, []), key=lambda x: -x[0]):
        if not os.path.exists(path): cands.append({'pr': pr, 'etiket': label, 'yok': True}); continue
        cell = grid_cell(path, n, 3, 3) if how == 'grid3' else split_cell(path, n)
        nf = norm(*cell) if cell is not None else None
        if nf is None: cands.append({'pr': pr, 'etiket': label, 'yok': True}); continue
        cands.append({'pr': pr, 'etiket': label, 'path': path, 'n': n, 'how': how, **dist(tf, nf)})
    ok = [c for c in cands if not c.get('yok')]
    newest = ok[0] if ok else None
    best = min(ok, key=lambda c: c['skor']) if ok else None
    hist = git_hist(f)
    st = os.stat(os.path.join(PUB, f))
    led = ledger.get(name, {}).get('kazanan')
    son = hist[0].split()[0] if hist else None
    beklenen = adim_commit(led)
    git_uyum = (son == beklenen) if led else (son in CC_ONCESI)
    if not ok: durum = 'kaynak yok'
    elif best is newest: durum = 'güncel' if newest['skor'] < 25 else 'güncel? (uzak)'
    elif newest['skor'] - best['skor'] < 4: durum = 'belirsiz'
    else: durum = 'ESKİ KESİM'
    rows.append({'f': f, 'name': name, 'durum': durum, 'newest': newest, 'best': best, 'cands': cands, 'git': hist, 'mtime': st.st_mtime, 'led': led, 'git_uyum': git_uyum, 'beklenen': beklenen})

# ------------------------------------------------------------------ görseller
def thumb_token(f, s=128):
    im = Image.open(os.path.join(PUB, f)).convert('RGBA').resize((s, s), Image.NEAREST)
    bg = Image.new('RGBA', (s, s), (58, 63, 74, 255)); bg.alpha_composite(im); return bg

def thumb_cell(c, s=128):
    cell = grid_cell(c['path'], c['n'], 3, 3) if c['how'] == 'grid3' else split_cell(c['path'], c['n'])
    rgb, m = cell; bb = trim(m)
    y0, y1, x0, x1 = bb; pad = 6
    crop = Image.fromarray(rgb[max(0, y0 - pad):y1 + pad, max(0, x0 - pad):x1 + pad].astype(np.uint8))
    w, h = crop.size; k = s / max(w, h)
    crop = crop.resize((max(1, int(w * k)), max(1, int(h * k))), Image.BILINEAR)
    bg = Image.new('RGBA', (s, s), (40, 40, 40, 255)); bg.paste(crop, ((s - crop.size[0]) // 2, s - crop.size[1])); return bg

def sheet(items, path, title, cols=1):
    """items: [(etiket, [görseller])] → satır başına: etiket + görseller."""
    s = 128; per = max(len(x[1]) for x in items); cw = 230 + per * (s + 6)
    rows_n = (len(items) + cols - 1) // cols
    out = Image.new('RGB', (cw * cols, 30 + rows_n * (s + 8)), (24, 27, 33)); d = ImageDraw.Draw(out)
    d.text((8, 8), title, fill=(232, 228, 218), font=FONT)
    for i, (lab, ims) in enumerate(items):
        x = (i % cols) * cw; y = 30 + (i // cols) * (s + 8)
        for j, line in enumerate(lab.split('\n')): d.text((x + 6, y + 4 + j * 13), line, fill=(200, 205, 215), font=FONT)
        for k, im in enumerate(ims): out.paste(im.convert('RGB'), (x + 230 + k * (s + 6), y))
    out.save(path)

cl = [r for r in rows if r['name'].startswith('celestial-erkek-cleric-ID')]
cl.sort(key=lambda r: int(r['name'].rsplit('ID', 1)[1]))
items = []
for r in cl:
    old = next((c for c in r['cands'] if c['pr'] == 1 and not c.get('yok')), None)
    new = next((c for c in r['cands'] if c['etiket'].startswith('clerik')), None)
    items.append((f"{r['f']}\n{r['durum']}\nyeni sayfa skor {new['skor']} (baş {new['bas']})\neski sayfa skor {old['skor'] if old else '-'} (baş {old['bas'] if old else '-'})\nsütun: eski | kabul edilen | oyunda",
                  [thumb_cell(old) if old else Image.new('RGBA', (128, 128)), thumb_cell(new), thumb_token(r['f'])]))
sheet(items, os.path.join(OUT, 'cleric-erkek-9-hucre.png'), 'clerik-male-celestial.jpg 9 hücre: eski çizim (hale sayfa 06/07) | kabul edilen son çizim | oyundaki jeton')

multi = [r for r in rows if len([c for c in r['cands'] if not c.get('yok')]) > 1 and not r['name'].startswith('celestial-erkek-cleric-ID')]
items = []
for r in multi:
    ims = [thumb_cell(c) for c in reversed([c for c in r['cands'] if not c.get('yok')])] + [thumb_token(r['f'])]
    items.append((f"{r['f']}\n{r['durum']}\nen yeni: {r['newest']['etiket']} ({r['newest']['skor']})\nen yakın: {r['best']['etiket']} ({r['best']['skor']})", ims))
if items: sheet(items, os.path.join(OUT, 'cok-kaynakli.png'), 'Birden çok kaynağı olan Celestial jetonları: eski → yeni kaynak hücreleri | oyundaki jeton', cols=2)

sup = [r for r in rows if r['durum'] not in ('güncel', 'kaynak yok') and not r['name'].startswith('celestial-erkek-cleric-ID')]
items = []
for r in sup:
    ims = [thumb_cell(c) for c in reversed([c for c in r['cands'] if not c.get('yok')])] + [thumb_token(r['f'])]
    lab = chr(10).join([r['f'], r['durum'], f"en yeni: {r['newest']['etiket']} ({r['newest']['skor']})", f"en yakın: {r['best']['etiket']} ({r['best']['skor']})"])
    items.append((lab, ims))
if items: sheet(items, os.path.join(OUT, 'supheli.png'), 'Şüpheli (görsel uzak ya da en yeni kaynağa en yakın değil): kaynak hücreleri (eski → yeni) | oyundaki jeton', cols=2)

# Bütün jetonlar (göz denetimi): sınıf × cinsiyet sıraları
byk = defaultdict(list)
for r in rows:
    parts = r['name'].split('-'); byk[(parts[2], parts[1])].append(r)
items = [(f"{c} {g}\n{len(v)} jeton", [thumb_token(r['f'], 96) for r in sorted(v, key=lambda r: r['name'])]) for (c, g), v in sorted(byk.items())]
s = 96; per = max(len(x[1]) for x in items); W = 130 + per * (s + 4)
out = Image.new('RGB', (W, 30 + len(items) * (s + 6)), (24, 27, 33)); d = ImageDraw.Draw(out)
d.text((8, 8), 'Bütün Celestial jetonları (oyundaki dosyalar; sınıf × cinsiyet, ada göre sıralı)', fill=(232, 228, 218), font=FONT)
for i, (lab, ims) in enumerate(items):
    y = 30 + i * (s + 6)
    for j, line in enumerate(lab.split('\n')): d.text((6, y + 4 + j * 13), line, fill=(200, 205, 215), font=FONT)
    for k, im in enumerate(ims): out.paste(im.convert('RGB'), (130 + k * (s + 4), y))
out.save(os.path.join(OUT, 'butun-celestial.png'))

# ------------------------------------------------------------------ rapor
import datetime
# Ölçünün işaretlediği ama göz denetiminde (gorsel-dokum/celestial-kaynak/supheli.png, 2026-11-22) aynı çizim çıkanlar ve nedeni.
KIRPMA = 'aynı çizim; fark hale sayfasının eşit ızgara kırpmasında (hücreye sığmayan gölge, efekt, komşu taşma) ya da koyu figürde renk dağılımı oynaması'
GOZ = {n: KIRPMA for n in ['celestial-erkek-bard-ID7', 'celestial-erkek-monk-ID8', 'celestial-erkek-paladin-ID3', 'celestial-erkek-sorcerer-SC-5',
       'celestial-erkek-sorcerer-SC-9', 'celestial-kadin-bard-ID7', 'celestial-kadin-monk-ID8', 'celestial-kadin-paladin-ID3', 'celestial-kadin-rogue-ID7',
       'celestial-kadin-sorcerer-SC-3', 'celestial-kadin-sorcerer-SC-5', 'celestial-kadin-sorcerer-SC-9', 'celestial-kadin-warlock-WL-1', 'celestial-kadin-warlock-WL-5']}
GOZ['celestial-erkek-barbarian-ID8'] = 'düzeltme hücresinin figürü + kaynak jetondan geri konan öfke aurası (cc-kesim.py düzeltme adımının tasarımı); yüz düzeltmeyle aynı'
GOZ['celestial-kadin-warlock-WL-10'] = 'iki kaynak aynı çizim (düzeltme yalnız haleyi kaldırdı); defter düzeltme, git uyumlu'
for r in rows:
    if r['durum'] == 'güncel': r['sonuc'] = 'güncel'
    elif r['durum'] == 'kaynak yok': r['sonuc'] = 'kaynak sayfası yok'
    elif r['name'] in GOZ and not r['name'].startswith('celestial-erkek-cleric-ID'): r['sonuc'] = 'güncel (göz denetimi)'
    else: r['sonuc'] = r['durum']
cnt = Counter(r['sonuc'] for r in rows)
eski = [r for r in rows if r['sonuc'] == 'ESKİ KESİM']
L = ['# Celestial jeton kaynak denetimi', '',
     f'Üretildi: `python scripts/celestial-kaynak-denetim.py` ({datetime.date.today().isoformat()}). **Yalnız rapor**: hiçbir jeton yazılmadı, yeniden kesim yapılmadı.', '',
     f'Oyundaki Celestial jetonu: **{len(rows)}** (`public/characters/celestial-*.webp`; hale eşleme listesindeki 288 + 2 Gladyatör ID12). '
     'Ham kaynaklar depo dışında: `RPG-Battle-ham/assets-ham/eksikler/` (dal `wip/karakter-ham`).', '',
     'Yöntem: her jeton aday ham kaynak hücreleriyle karşılaştırılır (zemin ayıklanır, ana figür alınır; skor 0–100 = bütün figürün ve '
     '"baş" bölgesinin (figürün üst %30\'u: saç, alın, göz) renk dağılımı farkının ortalaması; kırpma ve ölçekten bağımsız; aynı çizim ≈ 2–20, '
     'farklı baş ≈ 25–75). En yeni kabul edilen kaynak: tek hücre düzeltmesi > yeniden çizilmiş tam sayfa > hale düzeltme sayfası > hale sayfası. '
     'Oyundaki jeton en yeni kaynağa değil de eskisine daha yakınsa **ESKİ KESİM**. Ölçünün işaretleyip göz denetiminde aynı çizim çıkanlar '
     '"güncel (göz denetimi)" (gerekçe tabloda).', '',
     '## Özet', '', '| Sonuç | Jeton |', '|---|---:|'] + [f'| {k} | {v} |' for k, v in sorted(cnt.items())] + ['',
     (f'**Eski kesimde kalan: {len(eski)}**: ' + ', '.join(f"`{r['f']}`" for r in eski) + '.' if eski else '**Eski kesimde kalan: 0.**'), '']
L += ['## Cleric erkek: clerik-male-celestial.jpg (kabul edilen son çizim, 3×3)', '',
      'Hücre → jeton: Cleric alt sınıf eşlemesinden (`data/cleric-jeton.json`, hücre adları `data/jeton-hucre-sirasi.json`): '
      '1 Yaşam Manastırı (life-domain), 2 Aydın, 3 Birlik Manastırı 3–16, 4 Demirci, 5 Fırtına, 6 Mezar, 7 Savaş, 8 Yakamoz, 9 Birlik Manastırı 17+. '
      'Ham sayfa: `eksikler/clerik-male-celestial.jpg` (2048×2048; dosya tarihi 2026-11-17 23:19; ham depoya b345279d "Eksikler ham sayfalari (2026-11-19)"). '
      'Eski çizim: `eksikler/hale-gemini-sayfa-06.png` (özgün `karakter/cleric-male-celestial.jpg` 2026-11-16 sayfasının halesi silinmiş hâli; kahverengi kısa saç, yıldız yok).', '',
      '| Hücre | Jeton | Sonuç | Kabul edilen sayfa skor (baş) | Eski sayfa skor (baş) | Kesim defteri (`data/cc-kesim-kaynak.json`) | Dosya tarihi | Git geçmişi (yeniden eskiye) |',
      '|---:|---|---|---|---|---|---|---|']
for r in cl:
    n = int(r['name'].rsplit('ID', 1)[1])
    new = next(c for c in r['cands'] if c['etiket'].startswith('clerik'))
    old = next((c for c in r['cands'] if c['pr'] == 1 and not c.get('yok')), None)
    led = f"{r['led']['dosya']} h{r['led']['hucre']}" if r['led'] else 'kayıt yok (CC kesimi dokunmadı)'
    L.append(f"| {n} | `{r['f']}` | {r['sonuc']} | {new['skor']} ({new['bas']}) | {old['skor'] if old else '-'} ({old['bas'] if old else '-'}) | {led} | "
             f"{datetime.datetime.fromtimestamp(r['mtime']).strftime('%Y-%m-%d %H:%M')} | {'<br>'.join(r['git'][:4])} |")
L += ['', 'Görsel: `gorsel-dokum/celestial-kaynak/cleric-erkek-9-hucre.png` (eski çizim | kabul edilen | oyunda).', '',
      '**Kök neden:** `scripts/cc-kesim.py` `diger` adımı (commit 456a7d6d "… Celestial Cleric 2") bu sayfadan yalnız hücre 7 ve 9\'u kesti; '
      'koddaki gerekçe (satır 607): "hale-gemini sayfa 06\'nın yeniden yapılmışı; yalnız haleli hücreler 7 ve 9, halesiz-temiz dokunulmaz". '
      'Sayfa yalnız hale için değil Celestial başı (kısa dikenli sarı saç, altın göz, alında yıldız) için yeniden çizilmişti; "halesiz-temiz" '
      'sayılan 7 hücre (ID1–ID6, ID8) hiç kesilmedi, oyunda 2026-11-17 d58f314f\'teki eski kesim kalmıştı.', '']
duz = [r for r in cl if (r['led'] or {}).get('dosya') == 'clerik-male-celestial.jpg']
if len(duz) == len(cl):
    L += ['**Düzeltme (2026-11-22, kullanıcı onayı):** `PYTHONUTF8=1 CC_HAM=<ham klasör> python scripts/cc-kesim.py yeniden clerik-male-celestial.jpg` '
          'eksik 7 hücreyi aynı hat ve sayfa ölçeğiyle kesti; 9 hücrenin hepsi bu sayfadan. Eski dosyalar `public/characters/_yedek-celestial-2026-11-22/` '
          '(depo dışı). Kural: defterde `yenidenCizilmis` işaretli sayfanın bütün hücreleri kesilir (`cc-kesim.py` `tum_hucreler`, '
          'test `src/data/ccKesimYenidenCizilmis.test.ts`). Önceki hâlin görseli `gorsel-dokum/celestial-kaynak/cleric-erkek-9-hucre-once.png`.', '']
L += ['## Kesim sırası denetimi', '',
      'Git sırası (`public/characters/celestial-*`, hepsi 2026-11-19): fd1fc974 adım 1 taban (hale sayfaları, 15:01) → bf3f183b adım 2 yeni '
      '(Gladyatör + Warlock, 15:11) → 09f2ec04 adım 3 hale düzeltme 01–03 (15:14) → 456a7d6d C diğer (5\'li Bard, Sorcerer düzeltme, '
      'clerik-male-celestial, 15:30) → a7634e45 kadın Rogue ID3 tek hücre (17:03) → 3c1d443d erkek Wizard WZ-B halesiz (17:18). '
      'Hale düzeltme sayfaları Gladyatör ve Warlock\'tan sonra geldi. C adımı düzeltmeden sonra çalıştı ama `ONCELIK` (düzeltme 3 > diğer 2) '
      'düzeltmenin yazdığı jetonu ezemez; Celestial\'de C adımının yazdığı jetonların (Bard ID3 ×2, Cleric ID7/ID9, kadın SC-3) hiçbiri düzeltme sayfasında yok.', '']
ezil = [(k, g) for k, v in ledger.items() if k.startswith('celestial-') for g in v['gecmis'] if g['sonuc'] != 'yazıldı']
uyumsuz = [r for r in rows if not r['git_uyum']]
L += [f'- Defterde öncelik yüzünden reddedilen yazım (Celestial): {len(ezil)}.',
      f'- Son commit\'i defterdeki kazanan kaynağın adımı olmayan jeton (sonradan üstüne yazılmış ya da defter dışı kesim): {len(uyumsuz)}.']
for r in uyumsuz: L.append(f"  - `{r['f']}`: son {r['git'][0] if r['git'] else '-'}; beklenen {r['beklenen'] or 'CC öncesi commit'}")
L.append('')
multi_t = [r for r in rows if len([c for c in r['cands'] if not c.get('yok')]) > 1 and not r['name'].startswith('celestial-erkek-cleric-ID')]
L += ['## Birden çok kaynağı olan diğer jetonlar', '', '| Jeton | Sonuç | En yeni kaynak (skor, baş) | En yakın kaynak (skor, baş) | Kesim defteri | Son commit | Not |', '|---|---|---|---|---|---|---|']
for r in sorted(multi_t, key=lambda r: (r['sonuc'] != 'ESKİ KESİM', r['name'])):
    led = f"{r['led']['kaynak']}: {r['led']['dosya']} h{r['led']['hucre']}" if r['led'] else 'kayıt yok'
    L.append(f"| `{r['f']}` | {r['sonuc']} | {r['newest']['etiket']} ({r['newest']['skor']}, {r['newest']['bas']}) | {r['best']['etiket']} ({r['best']['skor']}, {r['best']['bas']}) | {led} | {r['git'][0] if r['git'] else '-'} | {GOZ.get(r['name'], '')} |")
L += ['', 'Görsel: `gorsel-dokum/celestial-kaynak/cok-kaynakli.png`.', '']
tek = [r for r in rows if len([c for c in r['cands'] if not c.get('yok')]) == 1]
L += ['## Tek kaynaklı jetonlar (yalnız hale sayfası)', '',
      f'{len(tek)} jetonun hale sayfasından başka ham kaynağı yok: ham klasörde bu jetonlar için yeniden çizilmiş sayfa bulunmadı '
      '(kadın Cleric dahil: `eksikler/` altında kadın Celestial Cleric sayfası yok). Hepsi hale sayfasındaki çizimle aynı (ölçü ya da göz denetimi).', '']
gz = [r for r in tek if r['sonuc'] == 'güncel (göz denetimi)']
if gz:
    L += ['| Jeton | Hale sayfası skor (baş) | Not |', '|---|---|---|']
    for r in gz: L.append(f"| `{r['f']}` | {r['newest']['skor']} ({r['newest']['bas']}) | {GOZ[r['name']]} |")
    L += ['', 'Görsel: `gorsel-dokum/celestial-kaynak/supheli.png`.', '']
yok = [r for r in rows if r['sonuc'] == 'kaynak sayfası yok']
if yok:
    L += ['## Ham kaynağı bulunamayanlar', '', 'Hale sayfa 30 (`hale-gemini-sayfa-30.png`) ham klasörde yok (fd1fc974 "sayfa 30 yok"); bu sayfanın jetonları (erkek Wizard WZ-A7…B7) '
          'karşılaştırılamadı. Kesim defteri: WZ-B1/B2/B3/B4/B7 2360265b halesiz hâlinden (3c1d443d), WZ-B5 hale düzeltme 03 h7 (09f2ec04), '
          'WZ-A7/A8/B6 CC öncesi kesim (d58f314f).', ''] + [f"- `{r['f']}` (son commit {r['git'][0] if r['git'] else '-'})" for r in yok] + ['']
L += ['Bütün jetonların göz denetimi: `gorsel-dokum/celestial-kaynak/butun-celestial.png` (sınıf × cinsiyet sıraları).', '']
open(MD, 'w', encoding='utf-8', newline='\n').write('\n'.join(L))
print(json.dumps(cnt, ensure_ascii=False))
for r in rows:
    if r['sonuc'] not in ('güncel',): print(r['sonuc'], r['f'], r['newest']['etiket'] if r['newest'] else '-', r['newest']['skor'] if r['newest'] else '-', '| en yakın', r['best']['etiket'] if r['best'] else '-', r['best']['skor'] if r['best'] else '-')
print('git uyumsuz:', [(r['f'], r['git'][0][:8] if r['git'] else None, r['beklenen']) for r in rows if not r['git_uyum']])
