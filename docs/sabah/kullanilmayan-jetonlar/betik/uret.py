#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""KJ1: kullanılmayan jeton adayları raporu (salt rapor; hiçbir dosyayı silmez, taşımaz, değiştirmez).

Önce 1. yol (gerçek çözücü):   npx vite-node docs/sabah/kullanilmayan-jetonlar/betik/coz.ts     → ../bagli-kume.tsv, ../coz-ozet.json
Sonra bu betik (depo kökünden): python docs/sabah/kullanilmayan-jetonlar/betik/uret.py           → ../liste.md, ../adaylar.csv, ../kontak-<n>.png

Bu betik 2. yolu kurar: çözücü koduna bakmadan `data/*-jeton.json` tablolarından erişim kümesini yeniden hesaplar ve `rg` ile depodaki bütün
metin dosyalarında geçen jeton adlarını tarar; iki yolu karşılaştırır. Gerekenler: python3, Pillow, ripgrep (`rg`).
"""
import collections
import csv
import glob
import json
import os
import re
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
OUT = HERE.parent
ROOT = OUT.parents[2]
RACES = ['celestial', 'dragonborn', 'dwarf', 'elf', 'gnome', 'goliath', 'halfling', 'human', 'orc', 'tiefling']
CLASSES = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard']
MASK_RACES = {'goliath', 'tiefling', 'elf', 'dragonborn', 'human', 'gnome'}
GEN = {'erkek': 'male', 'kadin': 'female', 'male': 'male', 'female': 'female'}
TRG = {'erkek': 'erkek', 'kadin': 'kadin', 'male': 'erkek', 'female': 'kadin'}
J = lambda p: json.load(open(ROOT / p, encoding='utf-8'))
stem = lambda f, ext: os.path.basename(f)[:-len(ext)]
PAT = re.compile(r'^(%s)-(erkek|kadin|male|female)-(%s)(?:-(.+))?$' % ('|'.join(RACES), '|'.join(CLASSES)))
nf = lambda x: f'{x:,}'.replace(',', '.')

# ───────── dosya kümeleri ─────────
disk = sorted(stem(f, '.webp') for f in glob.glob(f'{ROOT}/public/characters/*.webp'))
D = set(disk)
kucuk = {stem(f, '.webp') for f in glob.glob(f'{ROOT}/public/characters/kucuk/*.webp')}
maske = {stem(f, '.png') for f in glob.glob(f'{ROOT}/public/characters/maske/*.png')}
maske_el = {stem(f, '.png') for f in glob.glob(f'{ROOT}/public/characters/maske-el/*.png')}
maske_pul = {stem(f, '.png') for f in glob.glob(f'{ROOT}/public/characters/maske-pul/*.png')}
bas = {stem(f, '.png') for f in glob.glob(f'{ROOT}/public/characters/bas/*.png')}
maske_pul_dizin = (ROOT / 'public/characters/maske-pul').is_dir()
pul_duz = J('data/dragonborn-pul-duzeltme.json')['jetonlar'] if (ROOT / 'data/dragonborn-pul-duzeltme.json').is_file() else None
pul_kapali = J('data/dragonborn-pul-kapali.json')['jetonlar'] if (ROOT / 'data/dragonborn-pul-kapali.json').is_file() else None
git = lambda *a: subprocess.run(['git', *a], cwd=ROOT, capture_output=True, text=True).stdout.strip()
head = git('rev-parse', '--short', 'origin/birlesik') or git('rev-parse', '--short', 'HEAD')

# ───────── 1. yol: çözücü çıktısı ─────────
coz = json.load(open(OUT / 'coz-ozet.json', encoding='utf-8'))
rows = [l.rstrip('\n').split('\t') for l in open(OUT / 'bagli-kume.tsv', encoding='utf-8')][1:]
R1 = {r[0][:-5] for r in rows}
ana = {r[0][:-5] for r in rows if int(r[1]) > 0}
yalniz_yedek = sorted(r[0][:-5] for r in rows if int(r[1]) == 0)

# ───────── 2. yol (a): tablolardan yeniden kurulan erişim kümesi (çözücü koduna bakmadan) ─────────
R2 = set()
for f in sorted(glob.glob(f'{ROOT}/data/*-jeton.json')):
    T = json.load(open(f, encoding='utf-8')); cls = T['sinif']
    for race, gens in T['irklar'].items():
        for g in gens:
            R2.add(f'{race}-{g}-{cls}-GR')                                              # Gariban: seviye < 3, tablodaki her ırk × cinsiyet
            for sub, cell in T['altSiniflar'].items():
                if T.get('cinsiyet', {}).get(sub) not in (None, g): continue              # alt sınıfın cinsiyet kısıtı
                R2.add(f'{race}-{g}-{cls}-{cell}')
                fm = (T.get('formlar') or {}).get(sub)                                   # seviyeye bağlı ikinci form
                if fm and f'{race}-{g}' not in fm.get('ikinciYok', []): R2.add(f'{race}-{g}-{cls}-{fm["ikinci"]}')
for race in RACES:
    for g in ('male', 'female'):
        for cls in CLASSES: R2.add(f'{race}-{g}-{cls}')                                  # ırk × cinsiyet × sınıf varsayılanı

KARAR = {n for n in disk if re.match(r'^[a-z]+-(erkek|kadin)-cleric-(ID3|ID9)$', n)}      # kullanıcı kararı: Cleric ID3 ve ID9 bağlı sayılır (artık çözücüde de bağlı)
cand1_ham, cand2_ham = sorted(D - R1), sorted(D - R2)
cand1, cand2 = sorted(D - R1 - KARAR), sorted(D - R2 - KARAR)
karar_cozucude_degil = sorted(KARAR - R1)

# ───────── 2. yol (b): rg ile jeton adı taraması ─────────
RX = r'\b(%s)-(erkek|kadin|male|female)-(%s)(-(GR|ID[0-9]+|WL-[0-9]+|SC-[0-9]+|WZ-[AB][0-9]+))?\b' % ('|'.join(RACES), '|'.join(CLASSES))
cmd = ['rg', '-o', '--no-heading', '-n', '-H', '--no-messages', '-e', RX, '--glob', '!node_modules', '--glob', '!dist', '--glob', '!test-results',
       '--glob', '!docs/sabah/kullanilmayan-jetonlar/**', '--glob', '!public/characters/**', '--glob', '!*.webp', '--glob', '!*.png', '--glob', '!*.jpg', '--glob', '!*.mp3',
       '--glob', '!*.ogg', '--glob', '!*.mp4', '--glob', '!*.webm', '--glob', '!package-lock.json', '--glob', '!assets-ham/**', '.']
p = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
rg = collections.defaultdict(lambda: collections.defaultdict(int))
for line in p.stdout.splitlines():
    m = re.match(r'^(.*?):(\d+):(.*)$', line)
    if m: rg[m.group(3)][m.group(1).lstrip('./')] += 1
rg_match = len(p.stdout.splitlines())

def cat(f):
    if re.search(r'\.test\.|^tests/|test-setup|/fixtures/', f): return 'test'
    if f.startswith('src/'): return 'kod'
    if f.startswith('scripts/'): return 'betik'
    if f.startswith('data/'): return 'veri-rapor' if re.search(r'(rapor|olcum|halesiz|hale-elle|kesim-yeniden|kesim-kaynak|pul-duzeltme)', f) else 'veri-tablo'
    return 'belge'
rg_cat = collections.defaultdict(set)
for tok, fs in rg.items():
    for f in fs: rg_cat[cat(f)].add(tok)
eksik_ad = {c: sorted(t for t in rg_cat[c] if t not in D) for c in ('kod', 'test', 'betik', 'veri-tablo', 'veri-rapor', 'belge')}
is_prefix = lambda t: any(d.startswith(t + '-') for d in D)                        # <önek>-{c} gibi kalıp/önek kullanımı: dosya adı değil
kirik_metin = {c: [t for t in v if not is_prefix(t)] for c, v in eksik_ad.items()}
onek_ad = {t: sorted({f for c in eksik_ad for f in rg[t] if t in eksik_ad[c]}) for t in sorted({t for v in eksik_ad.values() for t in v if is_prefix(t)})}
literal = {t for c in ('kod', 'test', 'betik', 'veri-tablo') for t in rg_cat[c]}         # elle yazılmış ad kanıtı (rapor/belge sayılmaz)
cand_rg = sorted(D - R2 - KARAR - literal)
literal_hits = {t: sorted(f for f in rg[t] if cat(f) in ('kod', 'test', 'betik', 'veri-tablo')) for t in cand2 if t in literal}

# ───────── maske / küçük kopya envanteri ─────────
alt_rapor = J('data/soy-maske-alt-rapor.json')['jetonlar']
CONN = R1 | KARAR
def mask_kind(n):
    r, g, c, cell = PAT.match(n).groups()
    if r not in MASK_RACES: return None
    if r == 'dragonborn' and cell is not None: return 'pul'        # beyaz taban Dragonborn hücre jetonları: pul maskesi
    return 'maske'
mask_missing = []
for n in disk:
    k = mask_kind(n)
    if n not in CONN or k is None: continue
    if k == 'pul' and n not in maske_pul: mask_missing.append((n, 'maske-pul', None))
    if k == 'maske' and n not in maske and n not in maske_el: mask_missing.append((n, 'maske', alt_rapor.get(n)))
beklenmeyen_maske = [n for n, tur, px in mask_missing if tur == 'maske' and (px is None or px >= 30)]
db_cell = [n for n in disk if PAT.match(n).group(1) == 'dragonborn' and PAT.match(n).group(4) is not None]
db_legacy_mask = sorted(n for n in db_cell if n in maske)                                # eski `maske/` (çarpma/maskAlt dönemi) dosyaları
orphan = dict(maske=sorted(maske - D), maske_el=sorted(maske_el - D), maske_pul=sorted(maske_pul - D), kucuk=sorted(kucuk - D), bas=sorted(n for n in bas if n not in D))
small_missing = sorted(D - kucuk)
conn_small_missing = [n for n in CONN if n not in kucuk]

# ───────── ham kaynak (bilgi) ─────────
raw_dir = ROOT / 'assets-ham' / 'karakter'
raw_files = set(os.listdir(raw_dir)) if raw_dir.is_dir() else set()
cc = J('data/cc-kesim-kaynak.json')['jetonlar'] if (ROOT / 'data/cc-kesim-kaynak.json').is_file() else {}
gr_pages = {}
for s in J('data/toplu-kesim-yeni-rapor.json')['sayfalar']:
    for k in s['kesilen']: gr_pages[k['cikti']] = (s['dosya'], k['hucre'])
def parts(n):
    r, g, c, cell = PAT.match(n).groups(); return r, g, c, cell
def raw_of(n):
    kay = cc.get(n)
    if kay and kay.get('kazanan'):
        w = kay['kazanan']; return f'{w.get("kaynak")}: {w.get("dosya")}', w.get('hucre'), 'data/cc-kesim-kaynak.json', True
    if n in gr_pages:
        f, h = gr_pages[n]; return f'assets-ham/karakter/{f}', h, 'data/toplu-kesim-yeni-rapor.json', f in raw_files
    return None, None, '', False

# ───────── ayrıntı kayıtları ─────────
KISA = {'data/hale-halesiz.json': 'hale-halesiz', 'data/hale-elle.json': 'hale-elle', 'data/toplu-kesim-yeni-rapor.json': 'toplu-kesim-yeni-rapor', 'data/soy-maske-rapor.json': 'soy-maske-rapor',
        'data/soy-olcum.json': 'soy-olcum', 'data/soy-maske-alt-rapor.json': 'soy-maske-alt-rapor', 'data/soy-maske-dragonborn-rapor.json': 'soy-maske-dragonborn-rapor',
        'data/kesim-yeniden.json': 'kesim-yeniden', 'data/soy-renkleri.json': 'soy-renkleri (maskFix)', 'data/soy-bas.json': 'soy-bas', 'data/cc-kesim-kaynak.json': 'cc-kesim-kaynak',
        'data/dragonborn-pul-duzeltme.json': 'dragonborn-pul-duzeltme'}
def kayit(n):
    out = [KISA.get(f, f) for f in sorted(f for f in rg.get(n, {}) if f.startswith('data/'))]
    if pul_duz is not None and n in pul_duz and 'dragonborn-pul-duzeltme' not in out: out.append('dragonborn-pul-duzeltme')
    return out
def compress(cells):
    out, run = [], []
    def flush():
        if not run: return
        out.append(run[0][0] if len(run) == 1 else f'{run[0][0]}–{run[-1][0]}'); run.clear()
    for c in cells:
        m = re.match(r'^(.*?)(\d+)$', c); pre, num = (m.group(1), int(m.group(2))) if m else (c, None)
        if run and num is not None and run[-1][1] == pre and run[-1][2] == num - 1: run.append((c, pre, num))
        else: flush(); run.append((c, pre, num))
    flush(); return ', '.join(out)
def kardes(n):
    r, g, c, cell = parts(n)
    sib = [x.split('-', 3)[3] for x in R1 if x.startswith(f'{r}-{TRG[g]}-{c}-')]
    cells = sorted(sib, key=lambda s: (re.sub(r'\d+$', '', s), int(re.search(r'(\d+)$', s).group(1)) if re.search(r'(\d+)$', s) else 0))
    gen = f'{r}-{GEN[g]}-{c}'
    return cells, (gen if gen in R1 else None)
def info(n):
    raw, h, how, ok = raw_of(n)
    cells, gen = kardes(n)
    return dict(ad=n, kucuk=n in kucuk, maske=n in maske, maske_el=n in maske_el, maske_pul=n in maske_pul, kayit=kayit(n), ham=raw, hucre=h, ham_yontem=how, ham_var=ok, kardes=cells, genel=gen,
                literal=sorted(f for f in rg.get(n, {}) if cat(f) in ('kod', 'test', 'betik', 'veri-tablo')))
adaylar = [info(n) for n in cand1]
zayif = [info(n) for n in yalniz_yedek]

# İlk taramada (c6095ad, 2880 jeton) bağsız çıkıp sonradan bağlananlar: bilgi sayfaları için adlar (yalnız diskte varsa)
ILK_GR = [n for n in disk if re.match(r'^celestial-(erkek|kadin)-[a-z]+-GR$', n)]
ILK_ID3 = [n for n in disk if re.match(r'^[a-z]+-(erkek|kadin)-cleric-ID3$', n)]

# ───────── kontak sayfaları ─────────
def font(size):
    for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/dejavu/DejaVuSans.ttf', 'DejaVuSans.ttf', 'arial.ttf'):
        try: return ImageFont.truetype(f, size)
        except OSError: pass
    return ImageFont.load_default()
FT, FS = font(15), font(11)
def kontak(yol, baslik, alt, names, kol=8, th=144):
    cw, ch = th + 16, th + 44
    n_rows = max(1, (len(names) + kol - 1) // kol)
    W, H = cw * kol + 16, 50 + n_rows * ch + 8
    img = Image.new('RGB', (W, H), (36, 40, 48)); d = ImageDraw.Draw(img)
    d.text((10, 6), baslik, fill=(255, 255, 255), font=FT); d.text((10, 27), alt, fill=(170, 178, 190), font=FS)
    for i, nm in enumerate(names):
        x0, y0 = 8 + (i % kol) * cw, 50 + (i // kol) * ch
        tile = Image.new('RGBA', (th, th))
        for yy in range(0, th, 12):
            for xx in range(0, th, 12): ImageDraw.Draw(tile).rectangle([xx, yy, xx + 11, yy + 11], fill=(88, 94, 106, 255) if ((xx + yy) // 12) % 2 else (72, 78, 90, 255))
        tok = Image.open(ROOT / 'public' / 'characters' / f'{nm}.webp').convert('RGBA').resize((th, th), Image.LANCZOS)
        img.paste(Image.alpha_composite(tile, tok).convert('RGB'), (x0 + 8, y0))
        d.rectangle([x0 + 7, y0 - 1, x0 + 8 + th, y0 + th], outline=(110, 118, 132))
        pp = nm.split('-'); l1, l2 = '-'.join(pp[:2]) + '-', '-'.join(pp[2:])
        d.text((x0 + 8, y0 + th + 3), l1, fill=(230, 232, 238), font=FS); d.text((x0 + 8, y0 + th + 17), l2, fill=(255, 214, 120), font=FS)
    img.save(yol)
kontak(OUT / 'kontak-1.png', f'kontak-1: ZAYIF BAĞLI (aday değil) · Dragonborn sınıf-genel · {len(zayif)} jeton',
       'yalnız yedek zinciri + Builder önyüklemesi ile çözülüyor; hiçbir kombinasyonda ana jeton olarak seçilmiyor · liste.md §6', yalniz_yedek)
kontak(OUT / 'kontak-2.png', f'kontak-2: BİLGİ · ilk taramada (c6095ad) bağsızdı, sonradan bağlandı · Celestial Gariban -GR · {len(ILK_GR)} jeton',
       '74e32da "Celestial Gariban (GR) jetonları bağlandı"; güncel durumda çözücüde bağlı · liste.md §2', ILK_GR)
kontak(OUT / 'kontak-3.png', f'kontak-3: BİLGİ · ilk taramada (c6095ad) bağsızdı, sonradan bağlandı · Cleric ID3 · {len(ILK_ID3)} jeton',
       '5cc08c1 "Birlik Manastırı jetonu seviyeye göre: 3–16 ID3, 17+ ID9 (veride formlar)"; güncel durumda çözücüde bağlı · liste.md §2', ILK_ID3)

# ───────── adaylar.csv ─────────
def csv_row(grup, d, neden):
    return [grup, d['ad'] + '.webp', neden, '; '.join(d['kardes']) + (f' | genel: {d["genel"]}.webp' if d['genel'] else ''), 'var' if d['kucuk'] else 'YOK', 'var' if d['maske'] else 'yok', 'var' if d['maske_el'] else 'yok',
            'var' if d['maske_pul'] else 'yok', '; '.join(d['kayit']), d['ham'] or '', d['hucre'] or '', d['ham_yontem'] + ('' if d['ham_var'] or not d['ham'] else ' (dosya bulunamadı)')]
def neden_aday(n):
    r, g, c, cell = parts(n)
    tab = J(f'data/{c}-jeton.json')
    if cell is None: return 'sınıf-genel jeton: çözücü hiçbir yolda seçmiyor'
    if cell == 'GR': return 'Gariban: bu ırk × cinsiyet tablo `irklar` listesinde yok ya da çözücü bağlamıyor'
    if cell not in set(tab['altSiniflar'].values()) | {f['ikinci'] for f in (tab.get('formlar') or {}).values()}: return f'hücre {cell} `{c}-jeton.json` tablosunda hiçbir alt sınıfa/forma bağlı değil'
    return 'cinsiyet kısıtı ya da `ikinciYok` nedeniyle çözülmüyor'
NEDEN_DB = 'sheetAvatar Dragonborn için hep GR/alt sınıf jetonu seçer; genel jeton yalnız yedek zinciri ve Builder ön yüklemesi'
with open(OUT / 'adaylar.csv', 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f, lineterminator='\n')
    w.writerow(['grup', 'dosya', 'neden_bagli_degil', 'en_yakin_bagli_kardesler', 'kucuk_96px', 'maske', 'maske_el', 'maske_pul', 'data_kayitlari', 'ham_kaynak', 'ham_hucre', 'ham_yontem'])
    for d in adaylar: w.writerow(csv_row('aday', d, neden_aday(d['ad'])))
    for d in zayif: w.writerow(csv_row('zayıf bağlı (aday değil)', d, NEDEN_DB))

# ───────── liste.md ─────────
yn = lambda b: 'var' if b else '**YOK**'
n_generic = sum(1 for n in disk if parts(n)[3] is None)
kirik_n = sum(len(v) for v in kirik_metin.values())
rg_n = {c: len(v) for c, v in rg_cat.items()}
per_class = {c: dict(top=sum(1 for n in disk if parts(n)[2] == c), bagli=sum(1 for n in disk if n in CONN and parts(n)[2] == c), aday=sum(1 for n in cand1 if parts(n)[2] == c)) for c in CLASSES}
L = []
A = L.append
A('# Kullanılmayan jeton adayları (KJ1, salt rapor)')
A('')
A(f'`public/characters/` altında **hiçbir yere bağlı olmayan** jeton dosyalarının listesi. **Hiçbir dosya silinmedi, taşınmadı, yeniden adlandırılmadı; jeton, maske, JSON ve kod değişmedi** (yalnız bu klasör eklendi). Hesaplandığı durum: `origin/birlesik` @ `{head}`.')
A('')
A('Yeniden üretim (depo kökünden):')
A('')
A('```bash')
A('npx vite-node docs/sabah/kullanilmayan-jetonlar/betik/coz.ts')
A('python docs/sabah/kullanilmayan-jetonlar/betik/uret.py')
A('```')
A('')
A('## Özet')
A('')
A('| Ölçü | Sayı |')
A('|---|---:|')
A(f'| Toplam jeton (`public/characters/*.webp`) | **{len(disk)}** |')
A(f'| – sınıf-genel (`<ırk>-<male\\|female>-<sınıf>`) | {n_generic} |')
A(f'| – alt sınıf / Gariban hücresi (`<ırk>-<erkek\\|kadin>-<sınıf>-<hücre>`) | {len(disk) - n_generic} |')
A(f'| Çözücüde **bağlı** (gerçek kod çalıştırılarak) | **{len(R1)}** |')
A(f'| – karakter jetonu olarak seçilen (ana yol) | {len(ana)} |')
A(f'| – yalnız yedek zinciri / Builder önyüklemesi (zayıf bağ) | {len(yalniz_yedek)} |')
A(f'| Kullanıcı kararıyla bağlı sayılan, çözücüde bağlı olmayan (Cleric ID3/ID9) | {len(karar_cozucude_degil)} |')
A(f'| **Aday** (hiçbir yere bağlı değil) | **{len(cand1)}** |')
A(f'| – kesin aday | **{len(cand1)}** |')
A('| – riskli aday | **0** |')
A(f'| Zayıf bağlı, aday değil (Dragonborn sınıf-genel) | {len(zayif)} |')
A(f'| Kırık bağ (çözücü `characters/` çözümü, dosyası olmayan) | **{len(coz["diskteOlmayanCozum"])}** |')
A(f'| Kırık bağ (metinde adı geçen ama dosyası olmayan jeton adı; {len(rg)} farklı ad) | **{kirik_n}** (+ {len(onek_ad)} ad yalnız önek/kalıp, §8) |')
A(f'| (Bilgi) eski `avatars/` yedek yolu: son halka, dizin yok | {len(coz["digerYedekYol"])} yol |')
A(f'| Küçük kopya (`kucuk/`, 96 px) | {len(kucuk)} (jetonla bire bir; eksik {len(small_missing)}, yetim {len(orphan["kucuk"])}) |')
A(f'| Ten maskesi (`maske/`) | {len(maske)} (yetim {len(orphan["maske"])}) |')
A(f'| Pul maskesi (`maske-pul/`, Dragonborn) | {len(maske_pul)} (yetim {len(orphan["maske_pul"])}) |')
A(f'| Elle maske (`maske-el/`) | {len(maske_el)} dosya |')
A(f'| Kafa kaplaması (`bas/`) | {len(bas)} (yetim {len(orphan["bas"])}) |')
A(f'| Bağlı jetonda beklenen maskenin eksik olduğu | {len(mask_missing)} |')
A(f'| **Yetim maske / yetim küçük kopya** (jetonu olmayan) | **{sum(len(orphan[k]) for k in ("maske", "maske_el", "maske_pul", "bas"))} / {len(orphan["kucuk"])}** |')
A('')
if not cand1:
    A(f'**Sonuç: aday yok.** `{head}` durumunda {len(disk)} jetonun {len(R1)}\'i çözücüde bağlı; iki bağımsız yol da aynı sonucu veriyor (§2). Bağsız dosya yok, kırık bağ yok, yetim maske/kopya yok. Silinecek aday listesi **boş**; bu yüzden 2. aşama için onaylanacak dosya çıkmadı.')
    A('')
    A(f'Yöntem sınaması: aynı tarama bu raporun ilk hesabında (`c6095ad`, {len(disk) - 20} jeton) **44 bağsız dosya** bulmuştu: Celestial Gariban `-GR` ×24 ve Cleric ID3 ×20. İkisi de ben raporu yazarken başka oturumlarca bağlandı (`74e32da` Celestial Gariban bağlandı, `5cc08c1` Birlik Manastırı `formlar`: 3–16 ID3, 17+ ID9); tarama birleşen son duruma göre yeniden çalıştırıldı ve 0 çıktı (`kontak-2.png`, `kontak-3.png`).')
else:
    A(f'**Sonuç:** {len(cand1)} aday var (§3).')
A('')
A('| Sınıf | Toplam | Bağlı sayılan | Aday |')
A('|---|---:|---:|---:|')
for c in CLASSES: A(f'| {c} | {per_class[c]["top"]} | {per_class[c]["bagli"]} | {per_class[c]["aday"]} |')
A('')
A('## 1. Yöntem')
A('')
A('**"Bağlı"** = jeton şu yollardan biriyle oyunda ya da test/üretimde kullanılıyor: alt sınıf jeton tabloları (`data/*-jeton.json`, `formlar`, `imza.json`, paket alt sınıflarının eşlemeleri), ırk × sınıf × cinsiyet varsayılanları ve Builder önerisi, soy/ten eşlemeleri, `import.meta.glob`/addan türetilen yollar, elle yazılmış adlar. Hedef: hiçbirine bağlı olmayanlar.')
A('')
A(f'**1. yol: çözücü taraması** (`betik/coz.ts`, `npx vite-node`; dosya adı eşleştirmesi yok). `src/battle/avatar.ts` `sheetAvatar` gerçekten çalıştırıldı: 10 ırk × 2 cinsiyet × 12 sınıf × ({coz["altSinifKimligi"]} alt sınıf kimliği + alt sınıfsız + bilinmeyen kimlik) × seviye 1–20 = **{nf(coz["sheetAvatarCagri"])}** çağrı; her sınıf her alt sınıf kimliğiyle çaprazlandı (yanlış sınıfın kimliği çözülmemeli). Üstüne {nf(coz["dogrudanCagri"])} doğrudan `subclassTokenFile`/`garibanTokenFile` çağrısı (seviye eşikleri 1, 2, 3, 9, 10, 16, 17, 20: `formlar` ikinci hücreleri dahil) ve çözücü dışında addan kurulan girişler: Builder\'ın sınıf jetonu ön yüklemesi (`characterTokenFile`, `src/screens/Builder.tsx:191`) ve Hapishane mahkûm kıyafeti (`src/app/seruvenBattle.ts:235`, sınıf `{J("data/hapishane.json")["kostum"]["sinif"]}`). Birleşim = bağlı küme: **{len(R1)}** jeton (`bagli-kume.tsv`: jeton başına ana/yedek/genel çözülme sayısı, seviye aralığı, ilk örnek kombinasyon). Alt sınıf kimlikleri 12 jeton tablosundan ve `imza.json`\'dan toplandı ({coz["altSinifKimligi"]}; paket klasörü `icerik/` bu depoda yok, ama paket alt sınıflarının jeton eşlemeleri zaten bu tablolarda). `formlar`: Fighter Pehlivan (ID4 → ID5, seviye ≥ 10) ve Cleric Birlik Manastırı / Barış Alanı (ID3 → ID9, seviye ≥ 17).')
A('')
A(f'**2. yol: tablo yeniden kurulumu + `rg`** (`betik/uret.py`). (a) Çözücü koduna bakmadan `data/*-jeton.json` tablolarından erişim kümesi yeniden hesaplandı (`irklar` × cinsiyet kısıtı × `altSiniflar` hücreleri + `formlar` ikinci hücreleri + Gariban + ırk × cinsiyet × sınıf varsayılanı): **{len(R2)}** jeton. (b) `rg` ile `src`, `data`, `scripts`, `tests`, `docs` vb. bütün metin dosyalarında jeton adı kalıbı (`<ırk>-<cinsiyet>-<sınıf>[-<hücre>]`) tarandı: **{len(rg)}** farklı ad, {nf(rg_match)} eşleşme. Dağılım (dosya türüne göre farklı ad): kod {rg_n.get("kod", 0)}, test {rg_n.get("test", 0)}, betik {rg_n.get("betik", 0)}, veri tablosu {rg_n.get("veri-tablo", 0)}, üretim raporu (`*-rapor.json`, `soy-olcum.json`, `hale-*.json`, `kesim-yeniden.json`, `cc-kesim-kaynak.json`, `dragonborn-pul-duzeltme.json`) {rg_n.get("veri-rapor", 0)}, belge {rg_n.get("belge", 0)}. Üretim raporları ve belgeler her dosyayı listelediği için jetonu **bağlamaz**; yalnız kod, test, betik ve veri tablolarında aynen geçen ad "elle yazılmış ad" kanıtı sayıldı. `maske-pul/`, soy maskeleri ve kafa kaplaması jetonu bağlamaz, yalnız maske dosyalarının sahibini gösterir (§7).')
A('')
A('## 2. Doğrulama: iki bağımsız yol')
A('')
A('| Yol | Bağlı | Bağsız (ham) | Aday |')
A('|---|---:|---:|---:|')
A(f'| 1. çözücü taraması (gerçek kod) | {len(R1)} | {len(cand1_ham)} | **{len(cand1)}** |')
A(f'| 2a. tablolardan yeniden kurulum (kod yok) | {len(R2)} | {len(cand2_ham)} | **{len(cand2)}** |')
A(f'| 2b. 2a + `rg`: kod/test/betik/veri tablosunda adı aynen geçen jeton bağlı sayılırsa | – | – | **{len(cand_rg)}** |')
A('')
if cand1 == cand2:
    A(f'Fark: **yok**. 1. yol ile 2a aynı kümeyi veriyor (çözücüde olup tabloda olmayan {len(R1 - R2)}, tabloda olup çözücüde olmayan {len(R2 - R1)}; aday kümeleri özdeş); `rg` adı geçen ek bağlantı bulmadı (2b = {len(cand_rg)}).')
else:
    A(f'Fark: 1. yol {len(cand1)}, 2a {len(cand2)} aday; fark: {sorted(set(cand1) ^ set(cand2))}.')
A('')
A('Yöntemin duyarlılığı (aynı üç yol, `c6095ad` durumunda): çözücü 2836 bağlı / 44 bağsız, tablo yeniden kurulumu 2836 / 44, `rg` adı taraması 23 aday (tek fark `celestial-erkek-monk-GR`: `scripts/hale-alternatif.py` içinde elle yazılmış ad). Bağsız 44 dosya: Celestial Gariban `-GR` ×24 (`garibanTokenFile` Celestial\'ı dışlıyordu) ve Cleric ID3 ×20 (`cleric-jeton.json`\'da hiçbir alt sınıf ID3\'e bağlı değildi). Bunlar `74e32da` (`garibanTokenFile` Celestial dahil) ve `5cc08c1` (Cleric `formlar`) ile bağlandı; güncel sonuç aşağıdaki gibi.')
A('')
A(f'Kırık bağ taraması: çözücü {len(coz["diskteOlmayanCozum"])} ({nf(coz["sheetAvatarCagri"])} çözümün hiçbiri dosyasız jeton üretmiyor); metin taraması {kirik_n} (adı geçen {len(rg)} jeton adından {len(onek_ad)} tanesi diskte yok ama ikisi de önek/kalıp kullanımı, §8; gerisi diskte var).')
A('')
A('## 3. Aday tablosu')
A('')
if not cand1:
    A('**Boş.** Çözücüde hiçbir yola bağlı olmayan jeton yok; aday tablosu, riskli ve kesin aday listeleri (§4, §5) boş. En zayıf bağlı jetonlar §6\'da ayrı gösteriliyor (aday değil).')
else:
    A('| Dosya | Neden bağlı değil; en yakın bağlı kardeş | 96 px | maske / maske-el / maske-pul | Yama ve kayıtlar (`data/`) | Ham kaynak (bilgi) |')
    A('|---|---|:---:|:---:|---|---|')
    for d in adaylar:
        ham = (f'`{d["ham"]}` hücre {d["hucre"]}' if d['ham'] else '–')
        A(f'| `{d["ad"]}.webp` | {neden_aday(d["ad"])}; hücreler: {compress(d["kardes"])} | {yn(d["kucuk"])} | {"var" if d["maske"] else "yok"} / {"var" if d["maske_el"] else "yok"} / {"var" if d["maske_pul"] else "yok"} | {", ".join(d["kayit"]) or "–"} | {ham} |')
A('')
A('## 4. Riskli adaylar')
A('')
A('Yok (aday yok). Risk ölçütleri: kodda dinamik yolla ulaşılabilir görünen (`import.meta.glob`), soy/ten varyantı olan, test fikstürü olan jetonlar kesin listesine alınmazdı.')
A('')
A('## 5. Kesin adaylar')
A('')
A(f'**{"Yok." if not cand1 else len(cand1)}** Emin olamadığım hiçbir dosyayı "kesin" listesine koymadım.')
A('')
A('## 6. Zayıf bağlı (aday değil): Dragonborn sınıf-genel jetonlar (24)')
A('')
A('`sheetAvatar` Dragonborn için her zaman Gariban/alt sınıf jetonu seçiyor (`src/battle/avatar.ts:177`, "eski insansı genel jeton yerine"); sınıf-genel jeton yalnız yedek zincirinde (ilk görsel yüklenemezse) ve Builder\'ın sınıf ön yüklemesinde (`kucuk/` kopyaları indirilir ama gösterilmez) çözülüyor. Tanımınıza göre **bağlı** (ırk × sınıf × cinsiyet varsayılanı + test fikstürü: `src/ui/avatar.test.ts:46` 240 sınıf-genel jetonun hepsinin var olmasını bekliyor), bu yüzden aday değil; 2. aşamada isterseniz karar vermeniz için ayrı gösteriyorum. Kontrol sayfası: `kontak-1.png`.')
A('')
A('| Sınıf | Erkek | Kadın |')
A('|---|---|---|')
zb = {d['ad']: d for d in zayif}
for c in CLASSES:
    e, k = zb.get(f'dragonborn-male-{c}'), zb.get(f'dragonborn-female-{c}')
    if e and k: A(f'| {c} | `{e["ad"]}.webp` | `{k["ad"]}.webp` |')
A('')
A(f'Hepsinin 96 px kopyası ({sum(1 for d in zayif if d["kucuk"])}/{len(zayif)}) ve ten maskesi ({sum(1 for d in zayif if d["maske"])}/{len(zayif)}; pul maskesi yok: genel jetonlar beyaz taban değil) var; kayıtlar: `soy-maske-rapor`, `soy-olcum`, `soy-renkleri` (maskFix). Ham kaynak: `data/cc-kesim-kaynak.json` ve `assets-ham/karakter/` içinde bu jetonlara ait kayıt/dosya bulunamadı (eski genel set).')
A('')
A('## 7. Maske ve küçük kopya envanteri')
A('')
A(f'- **Küçük kopya (`public/characters/kucuk/`)**: {len(kucuk)} dosya, jeton kümesiyle birebir aynı; bağlı jetonda eksik {len(conn_small_missing)}, yetim {len(orphan["kucuk"])}.')
A(f'- **Ten maskesi (`maske/`)**: {len(maske)} dosya: ' + ', '.join(f'{r} {n}' for r, n in sorted(collections.Counter(n.split('-')[0] for n in maske).items())) + f'. Yetim maske {len(orphan["maske"])}.')
A(f'- **Pul maskesi (`maske-pul/`)**: {len(maske_pul)} dosya (Dragonborn beyaz taban jetonları: {len(db_cell)} hücre jetonunun {len([n for n in db_cell if n in maske_pul])}\'i); yetim {len(orphan["maske_pul"])}. Veri: `data/dragonborn-pul.json`, `data/dragonborn-pul-duzeltme.json` ({len(pul_duz) if pul_duz is not None else "yok"} jeton yaması), `data/dragonborn-pul-kapali.json` ({len(pul_kapali) if pul_kapali is not None else "yok"} jeton).')
A(f'- **Elle maske (`maske-el/`)**: {len(maske_el)} dosya (`data/soy-maske-rapor.json` `sprites` içinde "el" yok); yetim {len(orphan["maske_el"])}.')
A(f'- **Kafa kaplaması (`bas/`)**: {len(bas)} dosya (`data/soy-bas.json`: Goliath Paladin/Fighter/Cleric temel jetonları), hepsinin sahibi jeton var.')
A('')
A(f'### Bağlı jetonda beklenen maske eksik ({len(mask_missing)})')
A('')
if mask_missing:
    A('Beklenen maske: Goliath/Tiefling/Elf/Human/Gnome ve Dragonborn sınıf-genel için `maske/`, Dragonborn hücre jetonları için `maske-pul/`. Eksikler:')
    A('')
    A('| Hücre | Jeton (maske türü: px) |')
    A('|---|---|')
    grp = collections.defaultdict(list)
    for n, tur, px in mask_missing:
        r, g, c, cell = parts(n); grp[f'{c}-{cell}'].append(f'{r}-{g} ({tur}: {px})' if px is not None else f'{r}-{g} ({tur})')
    for k in sorted(grp): A(f'| {k} | {", ".join(grp[k])} |')
    A('')
    A(f'Karşılığı veride: `data/soy-maske-alt-rapor.json` otomatik maske piksel sayısı 30\'un altındaysa "maske yok = boyanmaz" (`DECISIONS.md` KQ6; `src/battle/baglamaKq6.test.ts` sınıyor); eksiklerin hepsi bu ölçütte ({"hepsi 30\'un altında" if not beklenmeyen_maske else "BEKLENMEYEN: " + ", ".join(beklenmeyen_maske)}). Jeton yine çözülüyor, yalnız soy rengi/ten tonu uygulanmıyor.')
else:
    A('Yok: ten maskesi beklenen her bağlı jetonun maske dosyası var.')
A('')
A('### Bilgi: yetim olmayan ama çalışma anında okunmuyor görünen maskeler')
A('')
A(f'Dragonborn beyaz taban jetonları artık `pul` boyamasıyla `maske-pul/` kullanıyor (`src/ui/tint.ts` `maskUrlFor`). Eski `maske/dragonborn-<cinsiyet>-<sınıf>-<hücre>.png` dosyalarının ({len(db_legacy_mask)} adet) çalışma anındaki tek okuyucusu `lineageTint(…, \'maske\')` yolu (`lineagesAltMaske`); bunu yalnız `scripts/dragonborn-renk-sayfa.ts` çağırıyor, `src` içinde çağıran yok. Jetonları olduğu için **yetim değiller** ve silme listesine alınmadı; yalnız bilgi.')
A('')
A('## 8. Kırık bağlar')
A('')
A(f'- Çözücü: **{len(coz["diskteOlmayanCozum"])}**. {nf(coz["sheetAvatarCagri"])} çağrının hiçbiri `public/characters/` altında olmayan bir dosyaya çözülmüyor.')
A(f'- Metin referansı: **{kirik_n}**. Adı geçen {len(rg)} jeton adından {len(onek_ad)} tanesi diskte yok, ama ikisi de dosya adı değil önek/kalıp: ' + '; '.join(f'`{t}` ({", ".join(fs)})' for t, fs in onek_ad.items()) + ' (örn. `celestial-erkek-wizard-WZ-{c}` biçimli f-string, belge başlığındaki `…-kontak.png` adı). Gerisi diskte var.')
A(f'- Bilgi: `sheetAvatar` yedek zincirinin son halkası eski `avatars/<ırk>-<sınıf>-<cinsiyet>.webp` yolu; {len(coz["digerYedekYol"])} yol, `public/avatars/` dizini {"var" if coz["avatarsDizinVar"] else "yok"}. Bilinçli son yedek (ardından baş harfli rozet; `src/ui/avatar.test.ts:36`), kırık bağ sayılmadı.')
A('')
A('## 9. Ham kaynaklar (yalnız bilgi; silme listesinde değil)')
A('')
n_cc = sum(1 for n in disk if n in cc)
A(f'Aday olmadığı için ham kaynağı listelenecek jeton yok. İleride aday çıkarsa: `data/cc-kesim-kaynak.json` ({n_cc}/{len(disk)} jeton için kaynak geçmişi: kaynak, dosya, hücre) ve `assets-ham/karakter/` ({len(raw_files)} dosya, depo dışı/`.gitignore`; `gariban-<male|female>-<ırk>.jpg` hücre 1–12 = barbarian … wizard, `<sınıf>-<male|female>-<ırk>.jpg` hücre = ID/WL/SC numarası; sıra `data/jeton-hucre-sirasi.json`, kesim kaydı `data/toplu-kesim-yeni-rapor.json`). Zayıf bağlı Dragonborn sınıf-genel jetonların ham kaynağı bu kayıtlarda yok.')
A('')
A('## 10. 2. aşama için notlar')
A('')
A('Aday listesi boş: **silinecek dosya yok**, 96 px kopya/maske tarafında yetim yok. Yalnız isterseniz Dragonborn sınıf-genel jetonlar (§6) konuşulabilir; silinirse şunlar etkilenir: `src/ui/avatar.test.ts:46-48` (240 sınıf-genel jetonun var olması), `src/ui/loading.test.ts:15` (toplam jeton sayısı ve `small == big`), `data/soy-renkleri.json` maskFix kayıtları, `data/soy-maske-rapor.json`, `data/soy-olcum.json`; Builder ön yüklemesi (`Builder.tsx:191`) ve yedek zinciri bu dosyaları artık bulamaz (zararsız: görsel yüklenemezse bir sonraki halka).')
A('')
A('## 11. Dosyalar')
A('')
A('| Dosya | İçerik |')
A('|---|---|')
A('| `liste.md` | Bu rapor |')
A(f'| `kontak-1.png` | Zayıf bağlı Dragonborn sınıf-genel {len(zayif)} jeton (aday değil), 8 sütun |')
A(f'| `kontak-2.png` | Bilgi: ilk taramada bağsız çıkıp sonradan bağlanan Celestial Gariban {len(ILK_GR)} jeton |')
A(f'| `kontak-3.png` | Bilgi: ilk taramada bağsız çıkıp sonradan bağlanan Cleric ID3 {len(ILK_ID3)} jeton |')
A('| `adaylar.csv` | Aday ve zayıf bağlı jetonların ayrıntıları (neden, kardeş, kopya, maske, kayıt, ham kaynak) |')
A(f'| `bagli-kume.tsv` | Çözücünün bağladığı {len(R1)} jeton: ana/yedek/genel çözülme sayısı, seviye aralığı, ilk örnek kombinasyon |')
A('| `coz-ozet.json` | Çözücü taraması özeti (çağrı sayıları, alt sınıf kimlikleri, `avatars/` yedek yolları) |')
A('| `betik/coz.ts`, `betik/uret.py` | Yeniden üretim betikleri (yalnız okur) |')
(OUT / 'liste.md').write_text('\n'.join(L) + '\n', encoding='utf-8')

print(json.dumps(dict(toplam=len(disk), r1=len(R1), r2=len(R2), cand1_ham=len(cand1_ham), cand2_ham=len(cand2_ham), cand1=len(cand1), cand2=len(cand2), cand_rg=len(cand_rg), karar_cozucude_degil=len(karar_cozucude_degil),
                      zayif=len(zayif), rg_ad=len(rg), rg_eslesme=rg_match, kirik_metin=kirik_n, maske_eksik=len(mask_missing), r1_eksi_r2=len(R1 - R2), r2_eksi_r1=len(R2 - R1), maske=len(maske), maske_pul=len(maske_pul),
                      yetim={k: len(v) for k, v in orphan.items()}, db_legacy_mask=len(db_legacy_mask), head=head), ensure_ascii=False))
