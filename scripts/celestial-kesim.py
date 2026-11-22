#!/usr/bin/env python3
"""CELESTIAL-KESIM: Celestial jetonlarının güncel ham sayfalardan yeniden kesimi (yalnız görsel veri; kural/kayıt sürümü değişmez).
Kesim mantığı yok: scripts/cc-kesim.py adımları (→ scripts/toplu-kesim.py) seçim ayarlarıyla çalıştırılır.
Ham: assets-ham/karakter/ (wip/karakter-ham dalının assets-ham/eksikler/ dosyaları karakter/'e; aynı adlı eskiler karakter/_eski/).

  python3 scripts/celestial-kesim.py envanter    # oyundaki her Celestial jetonun kaynağı ↔ hedef ham sayfa; eski kalanlar
  python3 scripts/celestial-kesim.py onizleme    # yeni kesim assets-ham/celestial-kesim-onizleme/ altına (public/characters'a dokunmaz)
                                                 # + sınıf başına temas sayfası (eski solda | yeni sağda)
  python3 scripts/celestial-kesim.py uygula      # (onaydan sonra) önizlemedeki jetonlar public/characters'a; eskiler yedeğe; defter birleşir

Sıra ve öncelik (kullanıcı, CELESTIAL-KESIM): Gladyatör + Warlock sayfaları → hale sayfaları 01–32 (30 hariç; 06 yerine yeniden yapılmış
clerik-male-celestial.jpg) → Bard/Sorcerer hücre düzeltmeleri → hale düzeltme sayfaları 01–03 EN SON (sayfa 03 figür 7 = eski sayfa 30
hücre 7) → kadın Rogue ID3 kullanıcı düzeltmesi. cc-kesim önceliği (düzeltme > yeni/diğer > taban) aynı sırayı garanti eder.
Erkek Celestial Warlock hale sayfalarından (26/27) alınmaz: baştan yapılmış Warlock sayfası esas (düzeltme eşleşmesi 'baştan-warlock')."""
import csv, glob, importlib.util, json, os, re, shutil, subprocess, sys
from collections import Counter, defaultdict

ONIZ = 'assets-ham/celestial-kesim-onizleme'
MODE = sys.argv[1] if len(sys.argv) > 1 else ''
if MODE == 'onizleme': os.environ['CC_KURU'] = ONIZ

def load_cc():
    s = importlib.util.spec_from_file_location('cc', 'scripts/cc-kesim.py'); m = importlib.util.module_from_spec(s); s.loader.exec_module(m)
    m.SECIM = lambda n: n.startswith('celestial-')
    m.TABAN_DURUM = ('haleli', 'halesiz-supheli', 'halesiz-temiz')
    m.TABAN_DOGRULANDI_ATLA = False
    m.TABAN_SAYFA_ATLA = {'06'}
    m.CLERIC_CELESTIAL_HUCRE = list(range(1, 10))
    return m

ESLESME = 'docs/sabah/hale-gemini-eslesme.csv'
DUZ = 'assets-ham/eksikler/hale-gemini-duzeltme-eslesme.csv'
ERKEK_WL = {('26', str(c)) for c in range(5, 10)} | {('27', str(c)) for c in range(1, 7)}

def hedef():
    """Jeton → (adım, ham dosya, hücre/figür) kullanıcı sırasına göre (sonraki ezer)."""
    t = {}
    for g, gen in (('female', 'kadin'), ('male', 'erkek')):
        t[f'celestial-{gen}-fighter-ID12'] = ('yeni', f'gladiator-tiefling-celestial-{g}.jpg', 2)
    for n in range(1, 12): t[f'celestial-erkek-warlock-WL-{n}'] = ('yeni', 'warlock-male-celestial.jpg', n)
    for r in csv.DictReader(open(ESLESME)):
        nm = r['dosya'][:-5]
        if (r['sayfa'], r['hucre']) in ERKEK_WL: continue
        if r['sayfa'] == '30': t.setdefault(nm, ('ham yok', 'hale-gemini-sayfa-30 (yok)', int(r['hucre']))); continue
        if r['sayfa'] == '06': t[nm] = ('diger', 'clerik-male-celestial.jpg', int(r['hucre'])); continue
        t[nm] = ('taban', f"hale-gemini-sayfa-{r['sayfa']}.png", int(r['hucre']))
    t['celestial-erkek-bard-ID3'] = ('diger', "erkek-5'li.jpg", 1)
    t['celestial-kadin-bard-ID3'] = ('diger', "kadin-5'li.jpg", 1)
    t['celestial-kadin-sorcerer-SC-3'] = ('diger', 'sorcerer-duzelt-B-sonuc.jpg', 1)
    for r in csv.DictReader(open(DUZ, encoding='utf-8-sig')):
        if r['yeni_sayfa']: t[r['dosya'][:-5]] = ('duzeltme', f"hale-gemini-duzeltme-sayfa-{r['yeni_sayfa']}.jpg", int(r['yeni_hucre']))
    t['celestial-erkek-wizard-WZ-B5'] = ('duzeltme', 'hale-gemini-duzeltme-sayfa-03.jpg', 7)
    t['celestial-kadin-rogue-ID3'] = ('duzeltme', 'celestial-kadin-rogue-ID3-duzeltme.jpg', 1)
    return t

def tokens():
    return sorted(f[:-5] for f in os.listdir('public/characters') if f.startswith('celestial-') and f.endswith('.webp'))

def cls_of(n):
    p = n.split('-'); return p[2]

def gen_of(n):
    g = n.split('-')[1]; return {'male': 'erkek', 'female': 'kadin'}.get(g, g)

def code_of(n):
    p = n.split('-'); return '-'.join(p[3:]) or 'genel'

def last_commit(n):
    r = subprocess.run(['git', 'log', '-1', '--format=%h %cs %s', '--', f'public/characters/{n}.webp'], capture_output=True, text=True)
    return r.stdout.strip()

def envanter():
    L = json.load(open('data/cc-kesim-kaynak.json'))['jetonlar']
    T = hedef(); rows = []
    for n in tokens():
        w = L.get(n, {}).get('kazanan')
        cur = (w['dosya'], w['hucre']) if w else None
        tg = T.get(n)
        if tg is None: durum = 'hedef yok'
        elif tg[0] == 'ham yok': durum = 'eski (ham sayfa yok)'
        elif cur == (tg[1], tg[2]): durum = 'güncel'
        else: durum = 'eski kalan'
        rows.append({'jeton': n, 'sinif': cls_of(n), 'cinsiyet': gen_of(n), 'kod': code_of(n), 'simdiki': f"{w['kaynak']}: {w['dosya']} #{w['hucre']}" if w else 'eski kesim (cc-kesim dışı)',
                     'commit': last_commit(n), 'hedef': f'{tg[0]}: {tg[1]} #{tg[2]}' if tg else '-', 'durum': durum})
    os.makedirs(ONIZ, exist_ok=True)
    json.dump(rows, open(f'{ONIZ}/envanter.json', 'w'), ensure_ascii=False, indent=1)
    c = Counter(r['durum'] for r in rows)
    lines = ['# Celestial jeton envanteri', '', f'Toplam {len(rows)} jeton: ' + ', '.join(f'{k} {v}' for k, v in c.most_common()), '',
             '## Sınıf × cinsiyet: eski kalanlar', '', '| Sınıf | Cinsiyet | Eski kalan | Kodlar | Hedef ham |', '|---|---|---|---|---|']
    g = defaultdict(list)
    for r in rows:
        if r['durum'] != 'güncel': g[(r['sinif'], r['cinsiyet'])].append(r)
    for (s, ge), lst in sorted(g.items()):
        lines.append(f"| {s} | {ge} | {len(lst)} | {', '.join(x['kod'] + ('' if x['durum'] == 'eski kalan' else ' (ham yok)') for x in lst)} | {', '.join(sorted({x['hedef'].split(': ')[1].split(' #')[0] for x in lst}))} |")
    lines += ['', '## Bütün jetonlar', '', '| Jeton | Şimdiki kaynak | Son commit | Hedef | Durum |', '|---|---|---|---|---|']
    lines += [f"| {r['jeton']} | {r['simdiki']} | {r['commit']} | {r['hedef']} | {r['durum']} |" for r in rows]
    open(f'{ONIZ}/ENVANTER.md', 'w').write('\n'.join(lines) + '\n')
    print(dict(c)); return rows

def onizleme():
    cc = load_cc()
    os.makedirs(f'{cc.OUT}/kucuk', exist_ok=True)
    if os.path.exists(cc.LEDGER): os.remove(cc.LEDGER)   # önizleme defteri her seferinde temiz
    out = {}
    for step in ('yeni', 'taban', 'diger', 'duzeltme', 'tek'):
        r = getattr(cc, step)(); out[step] = {k: v for k, v in r.items() if k not in ('sayfalar',)}
        print(step, {k: (len(v) if isinstance(v, (list, dict)) else v) for k, v in r.items()}, flush=True)
    json.dump(out, open(f'{ONIZ}/adimlar.json', 'w'), ensure_ascii=False, indent=1)
    temas(cc)

def temas(cc=None):
    """Sınıf başına temas sayfası: her jeton için eski (public) | yeni (önizleme); etikette kod, kaynak ve 'aynı'/'yok' işareti."""
    import numpy as np
    from PIL import Image, ImageDraw
    cc = cc or load_cc()
    L = json.load(open(f'{ONIZ}/kaynak.json'))['jetonlar']
    by = defaultdict(list)
    for n in tokens(): by[cls_of(n)].append(n)
    order = lambda n: (gen_of(n), int(re.sub(r'\D', '', code_of(n)) or 0) if code_of(n) not in ('GR', 'genel') else 99, code_of(n))
    paths, ozet = [], Counter()
    px, cols = 112, 5
    for s, lst in sorted(by.items()):
        lst.sort(key=order)
        pages = [lst[i:i + 30] for i in range(0, len(lst), 30)]
        for pi, pl in enumerate(pages, 1):
            cw = 2 * px + 10; rows = (len(pl) + cols - 1) // cols
            im = Image.new('RGB', (cw * cols, 26 + rows * (px + 30)), (58, 62, 72)); d = ImageDraw.Draw(im)
            d.text((6, 6), f'Celestial {s} ({pi}/{len(pages)}): ESKI (oyundaki) solda | YENI (onizleme) sagda', fill=(255, 255, 255))
            for i, n in enumerate(pl):
                ox, oy = (i % cols) * cw, 26 + (i // cols) * (px + 30)
                old = Image.open(f'public/characters/{n}.webp').convert('RGBA')
                nf = f'{ONIZ}/characters/{n}.webp'
                new = Image.open(nf).convert('RGBA') if os.path.exists(nf) else None
                same = new is not None and np.array_equal(np.array(old), np.array(new))
                tag = 'YOK' if new is None else ('ayni' if same else 'DEGISTI')
                ozet[tag] += 1
                bg = (72, 76, 88) if tag == 'DEGISTI' else (50, 52, 58)
                d.rectangle([ox + 2, oy + 2, ox + cw - 8, oy + px + 28], fill=bg)
                im.paste(old.resize((px, px), Image.LANCZOS), (ox + 2, oy + 28), old.resize((px, px), Image.LANCZOS))
                if new is not None: im.paste(new.resize((px, px), Image.LANCZOS), (ox + 2 + px, oy + 28), new.resize((px, px), Image.LANCZOS))
                else: d.text((ox + px + 20, oy + 70), 'eski kalir', fill=(255, 200, 120))
                w = L.get(n, {}).get('kazanan')
                src = f"{w['dosya'].replace('hale-gemini-', 'hg-').replace('duzeltme-sayfa-', 'dz')[:22]}#{w['hucre']}" if w else '-'
                col = {'DEGISTI': (140, 255, 140), 'ayni': (190, 190, 190), 'YOK': (255, 200, 120)}[tag]
                d.text((ox + 4, oy + 4), f"{gen_of(n)[0].upper()} {code_of(n)} {tag}", fill=col)
                d.text((ox + 4, oy + 16), src, fill=(200, 200, 220))
            p = f'{ONIZ}/temas/{s}-{pi}.jpg'; os.makedirs(os.path.dirname(p), exist_ok=True); im.save(p, quality=88); paths.append(p)
    print(dict(ozet)); print('\n'.join(paths))
    return paths

if __name__ == '__main__':
    fn = {'envanter': envanter, 'onizleme': onizleme, 'temas': temas}.get(MODE)
    if not fn: sys.exit(__doc__)
    fn()
