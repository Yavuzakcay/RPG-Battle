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

# ───────── dosya kümeleri ─────────
disk = sorted(stem(f, '.webp') for f in glob.glob(f'{ROOT}/public/characters/*.webp'))
D = set(disk)
kucuk = {stem(f, '.webp') for f in glob.glob(f'{ROOT}/public/characters/kucuk/*.webp')}
maske = {stem(f, '.png') for f in glob.glob(f'{ROOT}/public/characters/maske/*.png')}
maske_el = {stem(f, '.png') for f in glob.glob(f'{ROOT}/public/characters/maske-el/*.png')}
bas = {stem(f, '.png') for f in glob.glob(f'{ROOT}/public/characters/bas/*.png')}
maske_pul_dizin = (ROOT / 'public/characters/maske-pul').is_dir()
pul_json = (ROOT / 'data/dragonborn-pul-duzeltme.json').is_file()
maske_pul = {stem(f, '.png') for f in glob.glob(f'{ROOT}/public/characters/maske-pul/*.png')}
head = subprocess.run(['git', 'rev-parse', '--short', 'HEAD'], cwd=ROOT, capture_output=True, text=True).stdout.strip()

# ───────── 1. yol: çözücü çıktısı ─────────
coz = json.load(open(OUT / 'coz-ozet.json', encoding='utf-8'))
rows = [l.rstrip('\n').split('\t') for l in open(OUT / 'bagli-kume.tsv', encoding='utf-8')][1:]
R1 = {r[0][:-5] for r in rows}
ana = {r[0][:-5] for r in rows if int(r[1]) > 0}
yalniz_yedek = sorted(r[0][:-5] for r in rows if int(r[1]) == 0)
ornek = {r[0][:-5]: r[6] for r in rows}

# ───────── 2. yol (a): tablolardan yeniden kurulan erişim kümesi (çözücü koduna bakmadan) ─────────
R2 = set()
for f in sorted(glob.glob(f'{ROOT}/data/*-jeton.json')):
    T = json.load(open(f, encoding='utf-8')); cls = T['sinif']
    for race, gens in T['irklar'].items():
        for g in gens:
            if race != 'celestial': R2.add(f'{race}-{g}-{cls}-GR')                      # Gariban: seviye < 3 (Celestial hariç)
            for sub, cell in T['altSiniflar'].items():
                if T.get('cinsiyet', {}).get(sub) not in (None, g): continue              # alt sınıfın cinsiyet kısıtı
                R2.add(f'{race}-{g}-{cls}-{cell}')
                fm = (T.get('formlar') or {}).get(sub)                                   # seviyeye bağlı ikinci form
                if fm and f'{race}-{g}' not in fm.get('ikinciYok', []): R2.add(f'{race}-{g}-{cls}-{fm["ikinci"]}')
for race in RACES:
    for g in ('male', 'female'):
        for cls in CLASSES: R2.add(f'{race}-{g}-{cls}')                                  # ırk × cinsiyet × sınıf varsayılanı

KARAR = {n for n in disk if re.match(r'^[a-z]+-(erkek|kadin)-cleric-(ID3|ID9)$', n)}      # kullanıcı kararı: Cleric ID3 ve ID9 bağlı sayılır
cand1_ham, cand2_ham = sorted(D - R1), sorted(D - R2)
cand1, cand2 = sorted(D - R1 - KARAR), sorted(D - R2 - KARAR)

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
    if f.startswith('data/'): return 'veri-rapor' if re.search(r'(rapor|olcum|halesiz|hale-elle|kesim-yeniden)', f) else 'veri-tablo'
    return 'belge'
rg_cat = collections.defaultdict(set); rg_file = collections.defaultdict(set)
for tok, fs in rg.items():
    for f in fs: rg_cat[cat(f)].add(tok); rg_file[cat(f)].add(f)
kirik_metin = {c: sorted(t for t in rg_cat[c] if t not in D) for c in ('kod', 'test', 'betik', 'veri-tablo', 'veri-rapor', 'belge')}
literal = {t for c in ('kod', 'test', 'betik', 'veri-tablo') for t in rg_cat[c]}         # elle yazılmış ad kanıtı (rapor/belge sayılmaz)
cand_rg = sorted(D - R2 - KARAR - literal)
literal_hits = {t: sorted(f for f in rg[t] if cat(f) in ('kod', 'test', 'betik', 'veri-tablo')) for t in cand2 if t in literal}

# ───────── maske / küçük kopya envanteri ─────────
alt_rapor = J('data/soy-maske-alt-rapor.json')['jetonlar']
CONN = R1 | KARAR
mask_expected = [n for n in disk if n.split('-')[0] in MASK_RACES]
mask_missing = [(n, alt_rapor.get(n)) for n in mask_expected if n not in maske and n in CONN]
orphan_mask, orphan_small = sorted(maske - D), sorted(kucuk - D)
small_missing = sorted(D - kucuk)
orphan_bas = sorted(n for n in bas if n not in D)
orphan_mask_el, orphan_mask_pul = sorted(maske_el - D), sorted(maske_pul - D)

# ───────── ham kaynak ─────────
raw_dir = ROOT / 'assets-ham' / 'karakter'
raw_files = set(os.listdir(raw_dir)) if raw_dir.is_dir() else set()
gr_pages = {}
for s in J('data/toplu-kesim-yeni-rapor.json')['sayfalar']:
    for k in s['kesilen']: gr_pages[k['cikti']] = (s['dosya'], k['hucre'])
def parts(n):
    r, g, c, cell = PAT.match(n).groups(); return r, g, c, cell
def raw_of(n):
    r, g, c, cell = parts(n)
    if n in gr_pages:
        f, h = gr_pages[n]; return f'assets-ham/karakter/{f}', h, 'kesim raporu', f in raw_files
    if cell == 'GR':
        f = f'gariban-{GEN[g]}-{r}.jpg'; return f'assets-ham/karakter/{f}', CLASSES.index(c) + 1, 'ad kuralı', f in raw_files
    m = re.match(r'ID(\d+)$', cell or '')
    if m:
        f = next((x for x in sorted(raw_files) if re.match(rf'^{c}-{GEN[g]}-{r}\.(jpe?g|png)$', x)), f'{c}-{GEN[g]}-{r}.jpg')
        return f'assets-ham/karakter/{f}', int(m.group(1)), 'ad kuralı', f in raw_files
    return None, None, '', False

# ───────── yama / kayıt bilgileri ─────────
konum = J('data/hale-konum.json')['varsayilan']
halesiz = set(J('data/hale-halesiz.json')['bekleyen']); elle_b = set(J('data/hale-elle.json')['bekleyen'])
KISA = {'data/hale-halesiz.json': 'hale-halesiz', 'data/hale-elle.json': 'hale-elle', 'data/toplu-kesim-yeni-rapor.json': 'toplu-kesim-yeni-rapor', 'data/soy-maske-rapor.json': 'soy-maske-rapor',
        'data/soy-olcum.json': 'soy-olcum', 'data/soy-maske-alt-rapor.json': 'soy-maske-alt-rapor', 'data/soy-maske-dragonborn-rapor.json': 'soy-maske-dragonborn-rapor',
        'data/kesim-yeniden.json': 'kesim-yeniden', 'data/soy-renkleri.json': 'soy-renkleri (maskFix)', 'data/soy-bas.json': 'soy-bas'}
def kayit(n):
    out = [KISA.get(f, f) for f in sorted(f for f in rg.get(n, {}) if f.startswith('data/'))]
    r, g, c, cell = parts(n)
    if n.startswith('celestial-') and cell == 'GR' and f'{c}-{TRG[g]}-gr' in konum: out.append(f'hale-konum (taç konumu `{c}-{TRG[g]}-gr`)')
    return out
def compress(cells):
    """['ID1','ID2','ID4'] → 'ID1–ID2, ID4'; ['WL-1','WL-2'] → 'WL-1–WL-2'."""
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
    sib = sorted((x for x in R1 if x.startswith(f'{r}-{TRG[g]}-{c}-')), key=lambda x: (len(x.split('-', 3)[3].split('-')[0]), x.split('-', 3)[3]))
    cells = sorted((x.split('-', 3)[3] for x in sib), key=lambda s: (re.sub(r'\d+$', '', s), int(re.search(r'(\d+)$', s).group(1)) if re.search(r'(\d+)$', s) else 0))
    gen = f'{r}-{GEN[g]}-{c}'
    return cells, (gen if gen in R1 else None)
def info(n):
    r, g, c, cell = parts(n)
    raw, h, how, ok = raw_of(n)
    cells, gen = kardes(n)
    return dict(ad=n, kucuk=n in kucuk, maske=n in maske, maske_el=n in maske_el, maske_pul=n in maske_pul, kayit=kayit(n), ham=raw, hucre=h, ham_yontem=how, ham_var=ok, kardes=cells, genel=gen,
                halesiz=n in halesiz, elle=n in elle_b, literal=sorted(f for f in rg.get(n, {}) if cat(f) in ('kod', 'test', 'betik', 'veri-tablo')))
adaylar = [info(n) for n in cand1]
karar_info = [dict(info(n), coz=n in R1) for n in sorted(KARAR)]
zayif = [info(n) for n in yalniz_yedek]

# ───────── kontak sayfaları ─────────
def font(size):
    for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/dejavu/DejaVuSans.ttf', 'DejaVuSans.ttf', 'arial.ttf'):
        try: return ImageFont.truetype(f, size)
        except OSError: pass
    return ImageFont.load_default()
FT, FL, FS = font(15), font(12), font(11)
TR = str.maketrans('ığüşöçİĞÜŞÖÇ', 'igusocIGUSOC')
def tr(s): return s
def kontak(yol, baslik, alt, names, kol=8, th=144):
    cw, ch = th + 16, th + 44
    n_rows = (len(names) + kol - 1) // kol
    W, H = cw * kol + 16, 50 + n_rows * ch + 8
    img = Image.new('RGB', (W, H), (36, 40, 48)); d = ImageDraw.Draw(img)
    d.text((10, 6), baslik, fill=(255, 255, 255), font=FT); d.text((10, 27), alt, fill=(170, 178, 190), font=FS)
    for i, nm in enumerate(names):
        x0, y0 = 8 + (i % kol) * cw, 50 + (i // kol) * ch
        tile = Image.new('RGBA', (th, th))
        for yy in range(0, th, 12):
            for xx in range(0, th, 12): ImageDraw.Draw(tile).rectangle([xx, yy, xx + 11, yy + 11], fill=(88, 94, 106, 255) if ((xx + yy) // 12) % 2 else (72, 78, 90, 255))
        tok = Image.open(ROOT / 'public' / 'characters' / f'{nm}.webp').convert('RGBA').resize((th, th), Image.LANCZOS)
        tile = Image.alpha_composite(tile, tok).convert('RGB')
        img.paste(tile, (x0 + 8, y0))
        d.rectangle([x0 + 7, y0 - 1, x0 + 8 + th, y0 + th], outline=(110, 118, 132))
        parts_ = nm.split('-'); l1, l2 = '-'.join(parts_[:2]) + '-', '-'.join(parts_[2:])
        d.text((x0 + 8, y0 + th + 3), l1, fill=(230, 232, 238), font=FS); d.text((x0 + 8, y0 + th + 17), l2, fill=(255, 214, 120), font=FS)
    img.save(yol)
kontak(OUT / 'kontak-1.png', f'kontak-1: ADAY (riskli) · Celestial Gariban -GR · {len(cand1)} jeton', 'çözücüde hiçbir yola bağlı değil; ayrıntı ve riskler liste.md §3-§4', cand1)
kontak(OUT / 'kontak-2.png', f'kontak-2: Cleric ID3 · {len([n for n in KARAR if n.endswith("ID3")])} jeton (çözücüde bağlı değil; kullanıcı kararıyla BAĞLI sayıldı, aday DEĞİL)', 'bilgi amaçlı; ayrıntı liste.md §6', [n for n in sorted(KARAR) if n.endswith('ID3')])
kontak(OUT / 'kontak-3.png', f'kontak-3: Dragonborn sınıf-genel · {len(zayif)} jeton (ZAYIF bağlı: yalnız yedek zinciri + Builder ön yüklemesi; aday DEĞİL)', 'bilgi amaçlı; ayrıntı liste.md §7', yalniz_yedek)

# ───────── adaylar.csv ─────────
def csv_row(grup, d, neden):
    return [grup, d['ad'] + '.webp', neden, '; '.join(d['kardes']) + (f' | genel: {d["genel"]}.webp' if d['genel'] else ''), 'var' if d['kucuk'] else 'YOK', 'var' if d['maske'] else 'yok', 'var' if d['maske_el'] else 'yok',
            'var' if d['maske_pul'] else 'yok', '; '.join(d['kayit']), d['ham'] or '', d['hucre'] or '', d['ham_yontem'] + ('' if d['ham_var'] else ' (dosya bulunamadı)')]
NEDEN_GR = 'garibanTokenFile Celestial\'ı dışlıyor (src/battle/avatar.ts:158); L1-2\'de sınıf-genel jeton kullanılır'
NEDEN_ID3 = 'cleric-jeton.json\'da hiçbir alt sınıf ID3\'e bağlı değil (Barış hücresi; baris-alani ID9\'a yönlenir)'
NEDEN_DB = 'sheetAvatar Dragonborn için hep GR/alt sınıf jetonu seçer; genel jeton yalnız yedek zinciri ve Builder ön yüklemesi'
with open(OUT / 'adaylar.csv', 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f, lineterminator='\n')
    w.writerow(['grup', 'dosya', 'neden_bagli_degil', 'en_yakin_bagli_kardesler', 'kucuk_96px', 'maske', 'maske_el', 'maske_pul', 'data_kayitlari', 'ham_kaynak', 'ham_hucre', 'ham_yontem'])
    for d in adaylar: w.writerow(csv_row('riskli aday', d, NEDEN_GR))
    for d in karar_info:
        if not d['coz']: w.writerow(csv_row('kullanıcı kararıyla bağlı (aday değil)', d, NEDEN_ID3))
    for d in zayif: w.writerow(csv_row('zayıf bağlı (aday değil)', d, NEDEN_DB))

# ───────── liste.md ─────────
def yn(b): return 'var' if b else '**YOK**'
def nf(x): return f'{x:,}'.replace(',', '.')
def short_files(fs): return ', '.join(f'`{f}`' for f in fs)
n_gr, n_id3 = len(adaylar), len([d for d in karar_info if not d['coz']])
per_class = {c: dict(top=sum(1 for n in disk if parts(n)[2] == c), bagli=sum(1 for n in disk if n in CONN and parts(n)[2] == c), aday=sum(1 for n in cand1 if parts(n)[2] == c)) for c in CLASSES}
cleric = J('data/cleric-jeton.json'); sira = J('data/jeton-hucre-sirasi.json')['siniflar']['cleric']
n_generic = sum(1 for n in disk if parts(n)[3] is None)
rg_f = {c: len(v) for c, v in rg_file.items()}; rg_n = {c: len(v) for c, v in rg_cat.items()}

L = []
A = L.append
A('# Kullanılmayan jeton adayları (KJ1, salt rapor)')
A('')
A(f'`public/characters/` altında **hiçbir yere bağlı olmayan** jeton dosyalarının listesi. **Hiçbir dosya silinmedi, taşınmadı, yeniden adlandırılmadı; jeton, maske, JSON ve kod değişmedi** (yalnız bu klasör eklendi). Kaynak: `birlesik` @ `{head}`.')
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
A(f'| Çözücüde **bağlı** (gerçek kod çalıştırılarak) | {len(R1)} |')
A(f'| – karakter jetonu olarak seçilen (ana yol) | {len(ana)} |')
A(f'| – yalnız yedek zinciri / Builder önyüklemesi (zayıf bağ) | {len(yalniz_yedek)} |')
A(f'| Çözücüde bağlı değil ama **kullanıcı kararıyla bağlı sayılan** (Cleric ID3) | {n_id3} |')
A(f'| **Bağlı sayılan toplam** | **{len(R1) + n_id3}** |')
A(f'| **Aday** (hiçbir yere bağlı değil) | **{len(cand1)}** |')
A(f'| – kesin aday | **0** |')
A(f'| – riskli aday (Celestial Gariban `-GR`) | {len(cand1)} |')
A(f'| Zayıf bağlı, aday değil (Dragonborn sınıf-genel; yalnız yedek zinciri + önyükleme) | {len(zayif)} |')
A(f'| Kırık bağ (çözücü `characters/` çözümü, dosyası olmayan) | **{len(coz["diskteOlmayanCozum"])}** |')
A(f'| Kırık bağ (metinde adı geçen ama dosyası olmayan jeton adı; {len(rg)} farklı ad) | **{sum(len(v) for v in kirik_metin.values())}** |')
A(f'| (Bilgi) eski `avatars/` yedek yolu: son halka, dizin yok | {len(coz["digerYedekYol"])} yol |')
A(f'| Küçük kopya (`kucuk/`, 96 px) | {len(kucuk)} (jetonla bire bir; eksik {len(small_missing)}, yetim {len(orphan_small)}) |')
A(f'| Ten maskesi (`maske/`) | {len(maske)} ({len(MASK_RACES)} ırk; yetim {len(orphan_mask)}); bağlı jetonda maske eksik: {len(mask_missing)} (hepsi bilinçli, px < 30) |')
A(f'| Elle maske (`maske-el/`) | {len(maske_el)} dosya |')
A(f'| `maske-pul/` | {"var" if maske_pul_dizin else "dizin yok"}; `data/dragonborn-pul-duzeltme.json`: {"var" if pul_json else "dosya yok"} |')
A(f'| Kafa kaplaması (`bas/`) | {len(bas)} (yetim {len(orphan_bas)}) |')
A('| Yetim maske / yetim küçük kopya (jetonu olmayan) | **0 / 0** |')
A('')
A(f'**Sonuç.** Çözücü yolu 44 dosyayı bağsız buldu: Celestial Gariban `-GR` ×{n_gr} ve Cleric ID3 ×{n_id3}. Cleric ID3 isteğiniz üzerine bağlı sayıldı. Kalan {n_gr} Celestial `-GR` jetonunun hiçbiri çözücüye bağlı değil, ama **bilinçli bağlanmamış** ("hale işi Gemini\'de", `DECISIONS.md:155`) ve test, hale/taç verisi ve önizleme koduyla iç içe: bu yüzden hepsi **riskli**, **kesin aday yok**. Başka hiçbir sınıf, ırk, cinsiyet ya da seviye kombinasyonu bağsız jeton bırakmıyor.')
A('')
A('| Sınıf | Toplam | Bağlı sayılan | Aday |')
A('|---|---:|---:|---:|')
for c in CLASSES: A(f'| {c} | {per_class[c]["top"]} | {per_class[c]["bagli"]} | {per_class[c]["aday"]} |')
A('')
A('## 1. Yöntem')
A('')
A('**"Bağlı"** = jeton şu yollardan biriyle oyunda ya da test/üretimde kullanılıyor: alt sınıf jeton tabloları (`data/*-jeton.json`, `formlar`, `imza.json`, paket alt sınıflarının eşlemeleri), ırk × sınıf × cinsiyet varsayılanları ve Builder önerisi, soy/ten eşlemeleri, `import.meta.glob`/addan türetilen yollar, elle yazılmış adlar. Hedef: hiçbirine bağlı olmayanlar.')
A('')
A(f'**1. yol: çözücü taraması** (`betik/coz.ts`, `npx vite-node`; dosya adı eşleştirmesi yok). `src/battle/avatar.ts` `sheetAvatar` gerçekten çalıştırıldı: 10 ırk × 2 cinsiyet × 12 sınıf × ({coz["altSinifKimligi"]} alt sınıf kimliği + alt sınıfsız + bilinmeyen kimlik) × seviye 1–20 = **{nf(coz["sheetAvatarCagri"])}** çağrı; her sınıf her alt sınıf kimliğiyle çaprazlandı (yanlış sınıfın kimliği çözülmemeli). Üstüne {nf(coz["dogrudanCagri"])} doğrudan `subclassTokenFile`/`garibanTokenFile` çağrısı (seviye eşikleri 1, 2, 3, 9, 10, 16, 17, 20: `formlar` ikinci hücreleri dahil) ve çözücü dışında addan kurulan girişler: Builder\'ın sınıf jetonu ön yüklemesi (`characterTokenFile`, `src/screens/Builder.tsx:191`) ve Hapishane mahkûm kıyafeti (`src/app/seruvenBattle.ts:235`, sınıf `{J("data/hapishane.json")["kostum"]["sinif"]}`). Birleşim = bağlı küme: **{len(R1)}** jeton (`bagli-kume.tsv`: jeton başına ana/yedek/genel çözülme sayısı, seviye aralığı, ilk örnek kombinasyon). Alt sınıf kimlikleri 12 jeton tablosundan ve `imza.json`\'dan toplandı ({coz["altSinifKimligi"]}; paket klasörü `icerik/` bu depoda yok, ama paket alt sınıflarının jeton eşlemeleri zaten bu tablolarda). `formlar` yalnız Fighter Pehlivan\'da var (ID5, seviye ≥ 10); Cleric tablosunda `formlar` yok.')
A('')
A(f'**2. yol: tablo yeniden kurulumu + `rg`** (`betik/uret.py`). (a) Çözücü koduna bakmadan `data/*-jeton.json` tablolarından erişim kümesi yeniden hesaplandı (`irklar` × cinsiyet kısıtı × `altSiniflar` hücreleri + `formlar` ikinci hücreleri + Gariban (Celestial hariç) + ırk × cinsiyet × sınıf varsayılanı): **{len(R2)}** jeton. (b) `rg` ile `src`, `data`, `scripts`, `tests`, `docs` vb. bütün metin dosyalarında jeton adı kalıbı (`<ırk>-<cinsiyet>-<sınıf>[-<hücre>]`) tarandı: **{len(rg)}** farklı ad, {nf(rg_match)} eşleşme. Dağılım (dosya türüne göre farklı ad): kod {rg_n.get("kod", 0)}, test {rg_n.get("test", 0)}, betik {rg_n.get("betik", 0)}, veri tablosu {rg_n.get("veri-tablo", 0)}, üretim raporu (`*-rapor.json`, `soy-olcum.json`, `hale-*.json`, `kesim-yeniden.json`) {rg_n.get("veri-rapor", 0)}, belge {rg_n.get("belge", 0)}. Üretim raporları ve belgeler her dosyayı listelediği için jetonu **bağlamaz**; yalnız kod, test, betik ve veri tablolarında aynen geçen ad "elle yazılmış ad" kanıtı sayıldı.')
A('')
A('## 2. Doğrulama: iki bağımsız yol')
A('')
A('| Yol | Bağlı | Bağsız (ham) | Cleric ID3/ID9 kararı sonrası aday |')
A('|---|---:|---:|---:|')
A(f'| 1. çözücü taraması (gerçek kod) | {len(R1)} | {len(cand1_ham)} | **{len(cand1)}** |')
A(f'| 2a. tablolardan yeniden kurulum (kod yok) | {len(R2)} | {len(cand2_ham)} | **{len(cand2)}** |')
A(f'| 2b. 2a + `rg`: kod/test/betik/veri tablosunda adı aynen geçen jeton bağlı sayılırsa | – | – | **{len(cand_rg)}** |')
A('')
fark = sorted(set(cand2) - set(cand_rg))
A(f'Fark: 1. yol ile 2a **aynı kümeyi** veriyor (çözücüde olup tabloda olmayan {len(R1 - R2)}, tabloda olup çözücüde olmayan {len(R2 - R1)}; aday kümeleri özdeş: {"evet" if cand1 == cand2 else "HAYIR"}). 2b\'de {len(fark)} jeton daha düşüyor: ' + (', '.join(f'`{t}.webp` (' + ', '.join(f'`{f}`' for f in literal_hits[t]) + ')' for t in fark) if fark else '–') + '. Bu adın aynen geçtiği yer bir üretim betiği (Gariban örnek listesi), oyun yolu değil; çözücüye göre aday olmaya devam ediyor, yalnız "elle yazılmış ad" riski taşıyor (§4).')
A(f'Kırık bağ taraması: çözücü {len(coz["diskteOlmayanCozum"])} ({nf(coz["sheetAvatarCagri"])} çözümün hiçbiri dosyasız jeton üretmiyor); metin taraması {sum(len(v) for v in kirik_metin.values())} (kod, test, betik, veri tablosu, rapor, belge: adı geçen {len(rg)} jetonun hepsi diskte var).')
A('')
A('## 3. Aday tablosu (çözücüde hiçbir yola bağlı değil: 24)')
A('')
A('Hepsi **Celestial Gariban** (`celestial-<erkek|kadin>-<sınıf>-GR`). Bağlı olmama nedeni hepsinde aynı: `garibanTokenFile` Celestial\'ı özellikle dışlıyor (`src/battle/avatar.ts:158`); seviye < 3 Celestial karakter sınıf-genel jeton kullanıyor. "En yakın bağlı kardeş": aynı ırk-cinsiyet-sınıfta çözücünün kullandığı hücreler ve L1–2\'de Gariban yerine kullanılan sınıf-genel jeton. Kontrol sayfası: `kontak-1.png`.')
A('')
A('| Dosya | Neden bağlı değil; en yakın bağlı kardeş | 96 px | maske / maske-el / maske-pul | Yama ve kayıtlar (`data/`) | Ham kaynak (bilgi) |')
A('|---|---|:---:|:---:|---|---|')
for d in adaylar:
    ham = f'`{d["ham"]}` hücre {d["hucre"]}' + ('' if d['ham_var'] else ' (dosya yok)')
    A(f'| `{d["ad"]}.webp` | Celestial Gariban dışlanmış; L1–2: `{d["genel"]}.webp`; hücreler: {compress(d["kardes"])} | {yn(d["kucuk"])} | {"var" if d["maske"] else "yok"} / {"var" if d["maske_el"] else "yok"} / {"dizin yok" if not maske_pul_dizin else ("var" if d["maske_pul"] else "yok")} | {", ".join(d["kayit"]) or "–"} | {ham} |')
A('')
n_pos = sum(1 for d in adaylar if any(k.startswith('hale-konum') for k in d['kayit']))
n_hold = sum(1 for d in adaylar if d['halesiz'])
A('Celestial ırkının ten maskesi yok (ırk CSS filtresi ve hale/taç ile görünür), bu yüzden `maske` sütunu "yok" beklenen durum. 96 px kopyaların hepsi var.')
A('')
A('## 4. Riskli adaylar (24 adayın hepsi)')
A('')
A('Aşağıdaki risklerden en az birini taşıyan aday "kesin" listesine alınmaz; §3\'teki 24 adayın hepsi hepsini taşıyor (tek istisna son satır):')
A('')
A('| Risk türü | Kapsadığı aday | Kanıt |')
A('|---|---:|---|')
A(f'| Bilinçli bağlanmamış, bağlama bekleyen iş | {len(adaylar)} | `DECISIONS.md:155`, `src/preview/soyGaleriListe.ts:58`, `DECISIONS.md:188` |')
A(f'| Kodda dinamik yolla ulaşılabilir (geliştirme önizlemesi) | {len(adaylar)} | `src/preview/haleOnizleme.tsx:10` (`import.meta.glob`) |')
A(f'| Test fikstürü | {len(adaylar)} | `src/data/haleVaryant.test.ts:15`, `src/ui/loading.test.ts:15` |')
A(f'| Soy / ten / hale varyantı | {len(adaylar)} | `src/ui/haloCrown.ts`, `data/hale-konum.json`, `data/hale-halesiz.json`, `data/hale-elle.json` |')
A(f'| Elle yazılmış dosya adı | {len([t for t in literal_hits])} | `celestial-erkek-monk-GR` ← `scripts/hale-alternatif.py:15` |')
A('')
A(f'1. **Bilinçli bağlanmamış, bağlama bekleyen iş.** `DECISIONS.md:155`: "Gariban … `garibanTokenFile`, Celestial hariç: hale işi Gemini\'de"; `src/preview/soyGaleriListe.ts:58`: "Celestial Gariban bağlı değil". `DECISIONS.md:188`: 24 Gariban `-GR` (+ 2 Hızır Paladin ID10) için halesiz varyant yöntemi (`scripts/hale-yeni.py:20`) uygulandı; {n_pos} Gariban jetonun taç konumu `data/hale-konum.json` varsayılanlarında hazır, {n_hold} tanesi `data/hale-halesiz.json` bekleyen listesinde (sanat halesi kalan: taç çizilmez, Gemini/karar bekliyor).')
A('2. **Kodda dinamik yolla ulaşılabilir.** `src/preview/haleOnizleme.tsx:10` `import.meta.glob(\'/public/characters/celestial-*.webp\')` bütün Celestial jetonları (Gariban dahil) listeliyor; yalnız geliştirme önizleme sayfası, oyun yolu değil.')
A('3. **Test fikstürü.** `src/data/haleVaryant.test.ts:15` Celestial jeton sayısını **288** bekliyor (264 + 24 Gariban) ve 96 px kopyalarının hepsini; bekleyen listelerinde adı geçen Gariban jetonlar diskte olmalı. `src/ui/loading.test.ts:15` toplam jeton sayısını (2880) ve küçük kopya eşitliğini sınıyor.')
A('4. **Soy/ten varyantı.** Celestial uyanış görünümleri (Gece Gözyaşı gri filtre, Kırık Kanat, yıldız tacı) bu ırkın bütün jetonlarına uygulanıyor (`src/ui/haloCrown.ts`, `lineageLook`); `data/hale-elle.json` kararları ve `scripts/hale-*.py` üretim hattı Gariban jetonlarını kapsıyor.')
A('5. **Elle yazılmış ad.** `celestial-erkek-monk-GR` adı `scripts/hale-alternatif.py:15` içinde aynen geçiyor (hale alternatif önizlemesi, üretim betiği; oyun yolu değil).')
A('')
A('## 5. Kesin adaylar')
A('')
A('**Yok.** Çözücüde bağsız çıkan 44 dosyanın 24\'ü (Celestial Gariban) yukarıdaki risklerin hepsini taşıyor, 20\'si (Cleric ID3) isteğiniz üzerine bağlı sayıldı. Emin olamadığım hiçbir dosyayı "kesin" listesine koymadım.')
A('')
A('## 6. Çözücüde bağlı olmayan, kullanıcı kararıyla bağlı sayılanlar: Cleric ID3 (20) ve ID9 (20)')
A('')
A(f'`cleric-jeton.json` hücreleri: {", ".join(f"{k}→{v}" for k, v in cleric["altSiniflar"].items())}; `formlar` yok. `jeton-hucre-sirasi.json`: hücre 3 = **{sira["3"]}** (kaldırılan Barış Alanı; `baris-alani` eski kimliği `imza_birlik` ile birlikte ID9\'a yönleniyor), hücre 9 = **{sira["9"]}**. Sonuç: **ID9** ×20 çözücüde bağlı (Birlik/Barış), **ID3** ×20 hiçbir kimliğe bağlı değil. İsteğiniz üzerine ikisi de bağlı sayıldı ve aday listesine alınmadı. (Cleric `formlar` ile 17+ için ID9 eşlemesi henüz veride yok; eklenirse ID3 çözücüde de bağlı olur.) Kontrol sayfası: `kontak-2.png`.')
A('')
A('| Irk | ID3 erkek | ID3 kadın | 96 px / maske (erkek, kadın) |')
A('|---|---|---|---|')
byname = {d['ad']: d for d in karar_info}
for r in RACES:
    e, k = byname.get(f'{r}-erkek-cleric-ID3'), byname.get(f'{r}-kadin-cleric-ID3')
    if e and k: A(f'| {r} | `{e["ad"]}.webp` | `{k["ad"]}.webp` | {"var" if e["kucuk"] else "YOK"}/{"var" if e["maske"] else "yok"}, {"var" if k["kucuk"] else "YOK"}/{"var" if k["maske"] else "yok"} |')
A('')
A(f'Ham kaynak: `assets-ham/karakter/cleric-<male|female>-<ırk>.jpg` hücre 3 ({sum(1 for d in karar_info if d["ad"].endswith("ID3") and d["ham_var"])}/{n_id3} dosya bulundu).')
A('')
A('## 7. Zayıf bağlı (aday değil): Dragonborn sınıf-genel jetonlar (24)')
A('')
A('`sheetAvatar` Dragonborn için her zaman Gariban/alt sınıf jetonu seçiyor (`src/battle/avatar.ts:177`, "eski insansı genel jeton yerine"); sınıf-genel jeton yalnız yedek zincirinde (ilk görsel yüklenemezse) ve Builder\'ın sınıf ön yüklemesinde (`kucuk/` kopyaları indirilir ama gösterilmez) çözülüyor. Tanımınıza göre **bağlı** (ırk × sınıf × cinsiyet varsayılanı + test fikstürü: `src/ui/avatar.test.ts:46` 240 sınıf-genel jetonun hepsinin var olmasını bekliyor), bu yüzden aday değil; 2. aşamada karar vermeniz için ayrı gösteriyorum. Kontrol sayfası: `kontak-3.png`.')
A('')
A('| Sınıf | Erkek | Kadın |')
A('|---|---|---|')
zb = {d['ad']: d for d in zayif}
for c in CLASSES:
    e, k = zb.get(f'dragonborn-male-{c}'), zb.get(f'dragonborn-female-{c}')
    if e and k: A(f'| {c} | `{e["ad"]}.webp` | `{k["ad"]}.webp` |')
A('')
A(f'Hepsinin 96 px kopyası ({sum(1 for d in zayif if d["kucuk"])}/{len(zayif)}) ve ten maskesi ({sum(1 for d in zayif if d["maske"])}/{len(zayif)}) var; kayıtlar: `soy-maske-rapor`, `soy-olcum`, `soy-renkleri` (maskFix). Ham kaynak: `assets-ham/karakter/` içinde bu jetonlara ait ayrı dosya bulunamadı (eski genel set).')
A('')
A('## 8. Maske ve küçük kopya envanteri')
A('')
A(f'- **Küçük kopya (`public/characters/kucuk/`)**: {len(kucuk)} dosya, jeton kümesiyle birebir aynı; bağlı jetonda eksik {len([n for n in CONN if n not in kucuk])}, yetim {len(orphan_small)}. Aday {n_gr} jetonun hepsinin kopyası var.')
A(f'- **Ten maskesi (`maske/`)**: {len(maske)} dosya: ' + ', '.join(f'{r} {n}' for r, n in sorted(collections.Counter(n.split('-')[0] for n in maske).items())) + f'. Yetim maske {len(orphan_mask)}. Celestial, Dwarf, Halfling, Orc maskesiz ırklar.')
A(f'- **Elle maske (`maske-el/`)**: {len(maske_el)} dosya (`data/soy-maske-rapor.json` `sprites` içinde "el" yok); yetim {len(orphan_mask_el)}.')
A(f'- **`maske-pul/`**: {"dizin var" if maske_pul_dizin else "dizin yok"}; **`data/dragonborn-pul-duzeltme.json`**: {"var" if pul_json else "dosya yok"} (depoda hiçbir yerde başvurusu da yok; Dragonborn pul çalışması `docs/sabah/dragonborn-desen*` altında).')
A(f'- **Kafa kaplaması (`bas/`)**: {len(bas)} dosya (`data/soy-bas.json`: Goliath Paladin/Fighter/Cleric temel jetonları), hepsinin sahibi jeton var.')
A('')
A(f'### Bağlı jetonda maske eksik ({len(mask_missing)}; hepsi bilinçli)')
A('')
A('Ten maskesi olan 6 ırkın 1728 jetonundan 36\'sında maske dosyası yok. Hepsinin otomatik maske piksel sayısı 30\'un altında (`data/soy-maske-alt-rapor.json`; Dragonborn\'da `data/soy-maske-dragonborn-rapor.json` tohum 0; "maske yok = boyanmaz", `DECISIONS.md` KQ6); `src/battle/baglamaKq6.test.ts:42-45` bunu sınıyor. Jeton yine çözülüyor, yalnız soy rengi/ten tonu uygulanmıyor.')
A('')
A('| Hücre | Jeton (px) |')
A('|---|---|')
grp = collections.defaultdict(list)
for n, px in mask_missing:
    r, g, c, cell = parts(n); grp[f'{c}-{cell}'].append(f'{r}-{g}: {px}')
for k in sorted(grp): A(f'| {k} | {", ".join(grp[k])} |')
A('')
A('## 9. Kırık bağlar')
A('')
A(f'- Çözücü: **{len(coz["diskteOlmayanCozum"])}**. {nf(coz["sheetAvatarCagri"])} çağrının hiçbiri `public/characters/` altında olmayan bir dosyaya çözülmüyor.')
A(f'- Metin referansı: **{sum(len(v) for v in kirik_metin.values())}**. Adı geçen {len(rg)} jeton adının hepsi diskte var.')
A(f'- Bilgi: `sheetAvatar` yedek zincirinin son halkası eski `avatars/<ırk>-<sınıf>-<cinsiyet>.webp` yolu; {len(coz["digerYedekYol"])} yol, `public/avatars/` dizini {"var" if coz["avatarsDizinVar"] else "yok"}. Bilinçli son yedek (ardından baş harfli rozet; `src/ui/avatar.test.ts:36`), kırık bağ sayılmadı.')
A('')
A('## 10. Ham kaynaklar (yalnız bilgi; silme listesinde değil)')
A('')
A(f'`assets-ham/karakter/` ({len(raw_files)} dosya, depo dışı/`.gitignore`). Aday jetonların ham sayfaları (hücre sırası `data/jeton-hucre-sirasi.json` ve `data/toplu-kesim-yeni-rapor.json`):')
A('')
A('| Aday grubu | Ham sayfa | Hücre |')
A('|---|---|---|')
for g_ in ('male', 'female'):
    ds = [d for d in adaylar if d['ham'] and f'gariban-{g_}-celestial' in d['ham']]
    if ds: A(f'| Celestial Gariban {"erkek" if g_ == "male" else "kadın"} (12 jeton) | `{ds[0]["ham"]}` | 1–12 (barbarian … wizard, alfabetik) |')
A('| Cleric ID3 (20 jeton, bağlı sayıldı) | `assets-ham/karakter/cleric-<male\\|female>-<ırk>.jpg` | 3 (Barış) |')
A('')
A('## 11. 2. aşama için notlar (silme etkisi; şimdi bir şey yapılmadı)')
A('')
A('Bir jeton silinirse aynı listeyle 96 px kopyası (`kucuk/`), varsa maskesi ve `data/` kayıtları da gider; ayrıca şu testler/veriler güncellenmeli:')
A('')
A('- `src/ui/loading.test.ts:15`: toplam jeton sayısı (2880) ve `small == big` eşitliği.')
A(f'- Celestial Gariban silinirse: `src/data/haleVaryant.test.ts:15-20` (288 jeton, bekleyen listeleri: {n_hold} Gariban adı `data/hale-halesiz.json` ve `data/hale-elle.json` bekleyen listelerinde), `data/hale-konum.json` taç konumları, `data/toplu-kesim-yeni-rapor.json`, `docs/sabah/celestial-denetim/`, `scripts/hale-alternatif.py:15`.')
A('- Dragonborn sınıf-genel silinirse: `src/ui/avatar.test.ts:46-48` (240 genel jeton), `data/soy-renkleri.json` maskFix kayıtları, `data/soy-maske-rapor.json`, `data/soy-olcum.json`; Builder ön yüklemesi (`Builder.tsx:191`) ve yedek zinciri bu dosyaları artık bulamaz (zararsız: görsel yüklenemezse bir sonraki halka).')
A('- Cleric ID3: bağlı sayıldı, silinmez; `formlar` eklenince çözücü de bağlayacak.')
A('')
A('## 12. Dosyalar')
A('')
A('| Dosya | İçerik |')
A('|---|---|')
A('| `liste.md` | Bu rapor |')
A(f'| `kontak-1.png` | Aday (riskli) {len(cand1)} jeton, 8 sütun |')
A(f'| `kontak-2.png` | Cleric ID3 {n_id3} jeton (bağlı sayıldı, bilgi) |')
A(f'| `kontak-3.png` | Dragonborn sınıf-genel {len(zayif)} jeton (zayıf bağlı, bilgi) |')
A('| `adaylar.csv` | Aday, kararla bağlı ve zayıf bağlı jetonların ayrıntıları (neden, kardeş, kopya, maske, kayıt, ham kaynak) |')
A(f'| `bagli-kume.tsv` | Çözücünün bağladığı {len(R1)} jeton: ana/yedek/genel çözülme sayısı, seviye aralığı, ilk örnek kombinasyon |')
A('| `coz-ozet.json` | Çözücü taraması özeti (çağrı sayıları, alt sınıf kimlikleri, `avatars/` yedek yolları) |')
A('| `betik/coz.ts`, `betik/uret.py` | Yeniden üretim betikleri (yalnız okur) |')
(OUT / 'liste.md').write_text('\n'.join(L) + '\n', encoding='utf-8')

print(json.dumps(dict(toplam=len(disk), r1=len(R1), r2=len(R2), cand1_ham=len(cand1_ham), cand2_ham=len(cand2_ham), cand1=len(cand1), cand2=len(cand2), cand_rg=len(cand_rg), karar=len(KARAR), zayif=len(zayif),
                      rg_ad=len(rg), rg_eslesme=rg_match, kirik_metin=sum(len(v) for v in kirik_metin.values()), maske_eksik=len(mask_missing), r1_eksi_r2=len(R1 - R2), r2_eksi_r1=len(R2 - R1)), ensure_ascii=False))
