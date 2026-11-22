"""
Eksikler (güncel) ham sayfaları ile oyundaki jetonların karşılaştırması: yalnız rapor (jeton yazılmaz, yeniden kesim yok).

Soru: `scripts/cc-kesim.py` bir sayfadan yalnız bazı hücreleri kestiyse ("yalnız bazı hücreler" tuzağı, bkz. Celestial erkek Cleric) ya da
kesilen jetonun üstüne sonradan başka bir şey yazıldıysa, oyundaki dosya o sayfadaki çizimden mi, eski kesimden mi?

Hücre ayıklama kesicinin KENDİ işlevleriyle (`cc-kesim.py` içe aktarılır): tam sınıf sayfası `tk.components_of_sheet`, Bard/Barbarian/tek
figür `cut_bodies`, Sorcerer `cut_grid` (`SORC_IZGARA`), Gladyatör `cut_figures`. Hücre → jeton: tam sınıf sayfasında sınıf düzeninden
(`tk.CLASSES`; bütün hücreler, kesilmemişler dahil), ötekilerde kesim defterinden (`data/cc-kesim-kaynak.json`).
Benzerlik: Celestial denetimiyle aynı ölçü (renk dağılımı; bütün figür + baş bölgesi; 0–100, aynı çizim ≈ 2–20, farklı ≈ 25+).

Çalıştırma (Windows: PYTHONUTF8=1): python scripts/eksikler-kaynak-denetim.py [--ham <klasör>]
Çıktı: harita/belgeler/EKSIKLER-KAYNAK-DENETIM.md, gorsel-dokum/eksikler-kaynak/<sayfa>.png (görseller commit edilmez).
"""
import importlib.util, json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
HAM = sys.argv[sys.argv.index('--ham') + 1] if '--ham' in sys.argv else os.path.expanduser('~/OneDrive/Masaüstü/sinif-sayfalari-final/Eksikler')
# Aynı adlı ESKİ tam sınıf sayfası (2026-11-16 toplu kesimin kaynağı; ham dal wip/karakter-ham): yeni sayfa yeniden üretimse hangisinden kesildiği
ESKI = sys.argv[sys.argv.index('--eski') + 1] if '--eski' in sys.argv else os.path.join(ROOT, '..', 'RPG-Battle-ham', 'assets-ham', 'karakter')
os.environ['CC_HAM'] = HAM
_s = importlib.util.spec_from_file_location('cc', 'scripts/cc-kesim.py'); cc = importlib.util.module_from_spec(_s); _s.loader.exec_module(cc)
tk = cc.tk
PUB = 'public/characters'
OUT = 'gorsel-dokum/eksikler-kaynak'
MD = 'harita/belgeler/EKSIKLER-KAYNAK-DENETIM.md'
os.makedirs(OUT, exist_ok=True)
try: FONT = ImageFont.truetype('arial.ttf', 12)
except OSError: FONT = ImageFont.load_default()

# ------------------------------------------------------------------ ölçü (celestial-kaynak-denetim.py ile aynı)
BINS = 6
def chist(px):
    if len(px) == 0: return np.zeros(BINS ** 3)
    q = np.clip(px.astype(int) * BINS // 256, 0, BINS - 1)
    h = np.bincount(q[:, 0] * BINS * BINS + q[:, 1] * BINS + q[:, 2], minlength=BINS ** 3).astype(float)
    return h / h.sum()

def feat(rgba):
    a = np.asarray(rgba); m = a[..., 3] > 40
    rows, cols = m.sum(1), m.sum(0)
    r = np.where(rows > max(1, rows.max() * 0.01))[0]; c = np.where(cols > max(1, cols.max() * 0.01))[0]
    if len(r) == 0: return None
    y0, y1, x0, x1 = r[0], r[-1] + 1, c[0], c[-1] + 1
    mm = m[y0:y1, x0:x1]; cc_ = a[y0:y1, x0:x1, :3]; hy = max(1, int((y1 - y0) * 0.30))
    return {'h': chist(cc_[mm]), 'hh': chist(cc_[:hy][mm[:hy]])}

def dist(a, b):
    t = float(np.abs(a['h'] - b['h']).sum()) * 50; h = float(np.abs(a['hh'] - b['hh']).sum()) * 50
    return round((t + h) / 2, 1), round(h, 1)

N = 64
def struct_norm(rgba):
    """Biçim karşılaştırması için: figür sınır kutusu 64x64'e (taban ortada), parlaklık + maske. Renk kayması (zemin anahtarı/despill)
    biçimi etkilemez; aynı tasarımın iki yeniden üretimini (eski/yeni sayfa) ayırmak için."""
    im = rgba.copy(); bb = im.getbbox()
    if not bb: return None
    im = im.crop(bb); w, h = im.size; k = N / max(w, h); im = im.resize((max(1, round(w * k)), max(1, round(h * k))), Image.BILINEAR)
    c = Image.new('RGBA', (N, N), (0, 0, 0, 0)); c.paste(im, ((N - im.size[0]) // 2, N - im.size[1]))
    a = np.asarray(c).astype(float); m = a[..., 3] > 100
    lum = a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114
    return lum, m

def struct(a, b):
    if a is None or b is None: return None
    (la, ma), (lb, mb) = a, b
    both = ma & mb; iou = both.sum() / max(1, (ma | mb).sum())
    # parlaklık farkı: iki figürün ortalama parlaklığı eşitlenir (genel ton farkı sayılmaz), yalnız desen
    d = np.abs((la - la[both].mean()) - (lb - lb[both].mean()))[both].mean() if both.any() else 255
    return round(float(d) + (1 - float(iou)) * 100, 1)

def token(name):
    p = f'{PUB}/{name}.webp'
    return Image.open(p).convert('RGBA') if os.path.exists(p) else None

def git_hist(name):
    return subprocess.run(['git', 'log', '--format=%h %ad %s', '--date=short', '--', f'{PUB}/{name}.webp'], capture_output=True, text=True, encoding='utf-8').stdout.strip().splitlines()

# ------------------------------------------------------------------ sayfalar
L = json.load(open('data/cc-kesim-kaynak.json', encoding='utf-8'))
J = L['jetonlar']
BOS = json.load(open('data/jeton-hucre-sirasi.json', encoding='utf-8')).get('bos', {})
def ledger_cells(f):
    """Defterde bu sayfadan yazılmış (ya da denenmiş) hücreler → jeton."""
    out = {}
    for k, v in J.items():
        for g in v['gecmis']:
            if g['dosya'] == f: out[int(g['hucre'])] = k
    return out

def sinif(f, cls, race, g, kod):
    names = tk.CLASSES[cls][3]
    blank = set(BOS.get(cls, {}).get(g, []))
    return {n: f'{race}-{g}-{cls}-{kod}{n}' for n in range(1, len(names) + 1) if n not in blank}

SAYFALAR = []   # (dosya, yöntem, {hücre: jeton}, not)
for g, gen in (('female', 'kadin'), ('male', 'erkek')):
    SAYFALAR.append((f'druid-{g}-tiefling.jpg', 'sinif:druid', sinif(f'druid-{g}-tiefling.jpg', 'druid', 'tiefling', gen, 'ID'), 'Druid Tiefling (tam sınıf sayfası; C adımında yalnız hücre 4 kesildi)'))
SAYFALAR.append(('cleric-male-tiefling.jpg', 'sinif:cleric', sinif('cleric-male-tiefling.jpg', 'cleric', 'tiefling', 'erkek', 'ID'), 'Cleric erkek Tiefling (tam sınıf sayfası; C adımında yalnız hücre 9 kesildi)'))
SAYFALAR.append(('tiefling-kadin-cleric-ID9.jpg', 'tek', {1: 'tiefling-kadin-cleric-ID9'}, 'kadın Tiefling Cleric ID9 (tek figür; defterde "tiefling-kadin-cleric-ID9-yeni.jpg + halka")'))
for f, g in (('barbarian-female-aurasiz.jpg', 'kadin'), ('barbarian-male-aurasiz.jpg', 'erkek')):
    SAYFALAR.append((f, 'bodies:8', ledger_cells(f), f'Barbarian aurasız ID8 ({g}; sıra {", ".join(cc.BARB_SIRA)})'))
for f, g in (('fighter-male-human.jpg', 'erkek'), ('fighter-female-human.jpg', 'kadin')):
    SAYFALAR.append((f, 'sinif:fighter', sinif(f, 'fighter', 'human', g, 'ID'), f'Human Fighter {g} (tam sınıf sayfası)'))
for f in sorted(x for x in os.listdir(HAM) if x.startswith('gladiator-')):
    SAYFALAR.append((f, 'figures', ledger_cells(f), 'Gladyatör ustası (champion, fighter ID12)'))
for f in sorted(x for x in os.listdir(HAM) if x.startswith('warlock-')):
    _, g, race = f[:-4].split('-')
    SAYFALAR.append((f, 'sinif:warlock', sinif(f, 'warlock', race, 'kadin' if g == 'female' else 'erkek', 'WL-'), f'Warlock {race} (tam sınıf sayfası)'))
for f, cell, lst in cc.SORC:
    m = {i: f'{race}-{g}-sorcerer-SC-{cell}' for i, (race, g) in enumerate(lst, 1)}
    SAYFALAR.append((f, 'grid', m, f'Sorcerer düzeltme (SC-{cell}; ızgara {cc.SORC_IZGARA[f]})'))
for f, lst in cc.BARD:
    SAYFALAR.append((f, f'bodies:{len(lst)}', {i: f'{race}-{g}-bard-ID3' for i, (race, g) in enumerate(lst, 1)}, 'Bard hokkabaz (ID3)'))
for f in ("4'lü.jpg", "erkek-5'li.jpg", "kadin-5'li.jpg"):
    m = ledger_cells(f); SAYFALAR.append((f, f'bodies:{len(m)}', m, 'Bard hokkabaz (ID3): ' + ', '.join(m[k].rsplit('-bard', 1)[0] for k in sorted(m))))
SAYFALAR.append(('clerik-male-celestial.jpg', 'sinif:cleric', sinif('clerik-male-celestial.jpg', 'cleric', 'celestial', 'erkek', 'ID'), 'denetim kontrolü: Celestial erkek Cleric (2026-11-22 yeniden kesildi)'))

def cells_of(f, how):
    path = f'{HAM}/{f}'
    if how.startswith('sinif:'):
        comps = tk.components_of_sheet(path, how.split(':')[1])
        return {n: (Image.fromarray(v[0], 'RGBA'), [x for x in v[2] if x.startswith('ELLE')], v[1]) for n, v in comps.items()}, []
    if how == 'grid':
        out, warn = cc.cut_grid(path, *cc.SORC_IZGARA[f])
    elif how == 'figures':
        out, warn = cc.cut_figures(path, len(ledger_cells(f)) or 1)
    elif how == 'tek':
        out, warn = cc.cut_bodies(path, 1)
    else:
        out, warn = cc.cut_bodies(path, int(how.split(':')[1]))
    return {i: (Image.fromarray(rgba, 'RGBA'), [], None) for i, (rgba, bb, kind) in enumerate(out, 1)}, warn

def thumb(im, s=112, bg=(58, 63, 74, 255)):
    im = im.copy(); bb = im.getbbox()
    if bb: im = im.crop(bb)
    w, h = im.size; k = s / max(w, h); im = im.resize((max(1, int(w * k)), max(1, int(h * k))), Image.LANCZOS)
    o = Image.new('RGBA', (s, s), bg); o.alpha_composite(im, ((s - im.size[0]) // 2, s - im.size[1])); return o

rows = []
for f, how, mapping, note in SAYFALAR:
    if not os.path.exists(f'{HAM}/{f}'): rows.append({'f': f, 'note': note, 'yok': True}); continue
    cells, warn = cells_of(f, how)
    old_cells = {}; old_page = None; new_page = None
    if how.startswith('sinif:') and os.path.exists(f'{ESKI}/{f}'):
        old_cells = {n: Image.fromarray(v[0], 'RGBA') for n, v in tk.components_of_sheet(f'{ESKI}/{f}', how.split(':')[1]).items()}
        old_page = np.asarray(Image.open(f'{ESKI}/{f}').convert('RGB')).astype(int); new_page = np.asarray(Image.open(f'{HAM}/{f}').convert('RGB')).astype(int)
        if old_page.shape != new_page.shape: old_page = new_page = None   # boyut farklı: yeniden üretilmiş sayfa, piksel karşılaştırması yok
    items = []
    for n in sorted(set(mapping) | set(cells)):
        name = mapping.get(n)
        c = cells.get(n); t = token(name) if name else None
        e = {'n': n, 'name': name, 'elle': c[1] if c else [], 'warn': None}
        if c is None: e['durum'] = 'hücre bulunamadı'
        elif name is None: e['durum'] = 'eşleme yok'
        elif t is None: e['durum'] = 'oyunda dosya yok'
        else:
            e['skor'], e['bas'] = dist(feat(c[0]), feat(t))
            k = (J.get(name) or {}).get('kazanan')
            e['kazanan'] = f"{k['dosya']} h{k['hucre']}" if k else None
            e['bu_sayfa'] = bool(k and k['dosya'] == f and int(k['hucre']) == n)
            e['git'] = git_hist(name)
            if n in old_cells:
                tn = struct_norm(t); e['yapi_yeni'] = struct(struct_norm(c[0]), tn); e['yapi_eski'] = struct(struct_norm(old_cells[n]), tn)
                e['sayfa_farki'] = struct(struct_norm(c[0]), struct_norm(old_cells[n]))
            if old_page is not None and c[2] is not None:
                # aynı boyutlu eski/yeni sayfa: hücre kutusunda ham piksel farkı (JPEG gürültüsü ≈ 2–4); ≤ 6 ise çizim aynı
                x0, y0, x1, y1 = c[2]; e['piksel'] = round(float(np.abs(old_page[y0:y1, x0:x1] - new_page[y0:y1, x0:x1]).sum(2).mean()), 1)
            if (f, n) in cc.SORC_BELIRSIZ:
                e['durum'] = 'uygulanmadı: iki Goliath ayırt edilemedi (2026-11-19 kararı, cc-kesim.py SORC_BELIRSIZ)'
            elif e.get('piksel') is not None and e['piksel'] <= 6 and not e['bu_sayfa']:
                e['durum'] = 'aynı çizim (eski ve yeni sayfa piksel düzeyinde aynı)'
            elif 'yapi_eski' in e and not e['bu_sayfa'] and e['yapi_eski'] is not None and e['yapi_yeni'] is not None and e['yapi_eski'] + 3 < e['yapi_yeni']:
                e['durum'] = 'ESKİ SAYFADAN (yeni sayfadan kesilmemiş)'
            elif e['skor'] <= 20: e['durum'] = 'güncel' if e['bu_sayfa'] else 'aynı çizim (bu sayfadan kesilmedi)'
            else: e['durum'] = 'kesildi, sonra başka kaynak' if e['bu_sayfa'] is False and k and any(g['dosya'] == f for g in J[name]['gecmis']) else ('FARKLI (bu sayfadan kesilmemiş)' if not e['bu_sayfa'] else 'güncel? (uzak)')
        items.append((e, c[0] if c else None, t))
        if c is not None and t is not None: pass
    rows.append({'f': f, 'note': note, 'how': how, 'warn': warn, 'items': items})
    # kontak: sayfa hücresi | oyundaki jeton
    s = 112; per = 6; n_it = len(items)
    out = Image.new('RGB', (per * (2 * s + 24), 26 + ((n_it + per - 1) // per) * (s + 44)), (24, 27, 33)); d = ImageDraw.Draw(out)
    d.text((6, 6), f'{f}: hücre (sayfa) | oyundaki jeton', fill=(232, 228, 218), font=FONT)
    for i, (e, ci, ti) in enumerate(items):
        x = (i % per) * (2 * s + 24); y = 26 + (i // per) * (s + 44)
        if ci is not None: out.paste(thumb(ci, s, (40, 40, 40, 255)).convert('RGB'), (x, y))
        if ti is not None: out.paste(thumb(ti, s).convert('RGB'), (x + s + 4, y))
        d.text((x, y + s + 2), f"h{e['n']} {e['name'] or '-'}"[:40], fill=(200, 205, 215), font=FONT)
        d.text((x, y + s + 16), f"{e['durum']} {e.get('skor', '')}"[:44], fill=(255, 140, 140) if 'FARKLI' in e['durum'] or 'sonra' in e['durum'] else (160, 220, 160), font=FONT)
    out.save(f"{OUT}/{f.rsplit('.', 1)[0]}.png")

# Eski sayfadan kalanlar: eski sayfa hücresi | yeni (güncel) sayfa hücresi | oyundaki jeton
ek = []
for r in rows:
    if r.get('yok') or not r['how'].startswith('sinif:') or not os.path.exists(f"{ESKI}/{r['f']}"): continue
    olds = None
    for e, ci, ti in r['items']:
        if 'ESKİ' in e['durum'] or 'FARKLI' in e['durum']:
            if olds is None: olds = {n: Image.fromarray(v[0], 'RGBA') for n, v in tk.components_of_sheet(f"{ESKI}/{r['f']}", r['how'].split(':')[1]).items()}
            ek.append((f"{r['f']} h{e['n']}", e, olds.get(e['n']), ci, ti))
if ek:
    s = 128; W = 3 * (s + 6) + 250
    out = Image.new('RGB', (W * 2, 26 + ((len(ek) + 1) // 2) * (s + 10)), (24, 27, 33)); d = ImageDraw.Draw(out)
    d.text((6, 6), 'Güncel sayfadan kesilmemiş hücreler: eski sayfa | güncel sayfa | oyundaki jeton', fill=(232, 228, 218), font=FONT)
    for i, (lab, e, o, ci, ti) in enumerate(ek):
        x = (i % 2) * W; y = 26 + (i // 2) * (s + 10)
        for j, line in enumerate([lab, e['name'], e['durum'][:34], f"biçim yeni {e.get('yapi_yeni')} / eski {e.get('yapi_eski')}", f"sayfalar arası {e.get('sayfa_farki')}"]):
            d.text((x + 4, y + 4 + j * 14), line, fill=(200, 205, 215), font=FONT)
        for k, im in enumerate([o, ci, ti]):
            if im is not None: out.paste(thumb(im, s, (58, 63, 74, 255) if k == 2 else (40, 40, 40, 255)).convert('RGB'), (x + 250 + k * (s + 6), y))
    out.save(f'{OUT}/eski-kalanlar.png')

# ------------------------------------------------------------------ rapor
import datetime
from collections import Counter
cnt = Counter(e['durum'] for r in rows if not r.get('yok') for e, _, _ in r['items'])
Lm = ['# Eksikler ham sayfaları: kaynak denetimi', '',
      f'Üretildi: `PYTHONUTF8=1 python scripts/eksikler-kaynak-denetim.py` ({datetime.date.today().isoformat()}). **Yalnız rapor**: jeton yazılmadı. '
      f'Ham klasör: `{HAM.replace(os.path.expanduser("~"), "~").replace(chr(92), "/")}` (Celestial hale sayfaları hariç; onlar `CELESTIAL-KAYNAK-DENETIM.md`).', '',
      'Hücreler kesicinin kendi işlevleriyle ayıklanır (`cc-kesim.py`); hücre → jeton tam sınıf sayfasında sınıf düzeninden (kesilmemiş hücreler dahil), '
      'ötekilerde kesim defterinden. Skor 0–100 (renk dağılımı; bütün figür + baş): aynı çizim ≈ 2–20, farklı ≈ 25+. '
      'Kesim defteri: `data/cc-kesim-kaynak.json` kazananı. Tam sınıf sayfasında aynı adlı ESKİ sayfa (2026-11-16 toplu kesimin kaynağı, '
      '`RPG-Battle-ham/assets-ham/karakter/`) varsa biçim karşılaştırması da yapılır (parlaklık deseni + örtüşme; renk kayması sayılmaz): '
      'jeton eski sayfaya belirgin yakınsa (≥ 3) "ESKİ SAYFADAN"; eski ve yeni sayfa aynı boyuttaysa hücre kutusunda ham piksel farkı da ölçülür '
      '(≤ 6: JPEG gürültüsü, çizim aynı). Görsel: `gorsel-dokum/eksikler-kaynak/eski-kalanlar.png` (eski sayfa | güncel sayfa | oyunda).', '',
      '## Özet', '', '| Durum | Hücre |', '|---|---:|'] + [f'| {k} | {v} |' for k, v in sorted(cnt.items())] + ['']
farkli = [(r['f'], e) for r in rows if not r.get('yok') for e, _, _ in r['items'] if 'FARKLI' in e['durum'] or 'sonra' in e['durum'] or 'uzak' in e['durum'] or 'ESKİ' in e['durum']]
Lm += ['## Oyundaki jeton sayfadaki çizimden farklı', '']
if farkli:
    Lm += ['| Sayfa | Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni sayfa / eski sayfa (sayfalar arası) | Kesim defteri kazananı | Son commit |', '|---|---:|---|---|---|---|---|---|']
    for f, e in farkli: Lm.append(f"| {f} | {e['n']} | `{e['name']}` | {e['durum']} | {e.get('skor')} ({e.get('bas')}) | {e.get('yapi_yeni', '-')} / {e.get('yapi_eski', '-')} ({e.get('sayfa_farki', '-')}) | {e.get('kazanan') or 'kayıt yok'} | {(e.get('git') or ['-'])[0]} |")
else: Lm.append('Yok.')
Lm.append('')
Lm += ['## Sayfa sayfa', '']
for r in rows:
    if r.get('yok'): Lm += [f"### {r['f']}", '', f"{r['note']}: ham klasörde yok.", '']; continue
    c = Counter(e['durum'] for e, _, _ in r['items'])
    Lm += [f"### {r['f']}", '', f"{r['note']}. Ayıklama `{r['how']}`; " + ', '.join(f'{k}: {v}' for k, v in sorted(c.items())) + '.' + (f" Uyarı: {'; '.join(r['warn'])}." if r['warn'] else ''), '',
           '| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |', '|---:|---|---|---|---|---|']
    for e, _, _ in r['items']:
        Lm.append(f"| {e['n']} | `{e['name'] or '-'}` | {e['durum']}{' (ELLE)' if e['elle'] else ''} | {e.get('skor', '-')} ({e.get('bas', '-')}) | {e.get('yapi_yeni', '-')} / {e.get('yapi_eski', '-')} ({e.get('sayfa_farki', '-')}) | {e.get('kazanan') or 'kayıt yok'} |")
    Lm += ['', f"Görsel: `{OUT}/{r['f'].rsplit('.', 1)[0]}.png`.", '']
open(MD, 'w', encoding='utf-8', newline='\n').write('\n'.join(Lm) + '\n')
print(json.dumps(cnt, ensure_ascii=False))
for f, e in farkli: print(f, e['n'], e['name'], e['durum'], e.get('skor'), e.get('kazanan'))
