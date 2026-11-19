#!/usr/bin/env python3
"""CC toplu kesim ve yerleştirme (2026-11-19). Ham: assets-ham/karakter/ (wip/karakter-ham dalı assets-ham/eksikler/ → karakter/, eski aynı adlılar _eski/).
Çalıştırma (sırayla; her adım ayrı commit):
  python3 scripts/cc-kesim.py taban      # 1) Gemini hale sayfaları 01–32 (haleli + halesiz-supheli; erkek Celestial Warlock ve halesiz-doğrulandı hariç)
  python3 scripts/cc-kesim.py yeni       # 2) Gladyatör (champion, fighter ID12) + Warlock sayfaları
  python3 scripts/cc-kesim.py duzeltme   # 3) hale düzeltme sayfaları 01–03 (kesin yetkili)
  python3 scripts/cc-kesim.py diger      # C) Bard, Sorcerer, Druid, Barbarian aurasız, Cleric, Human Fighter
Öncelik kuralı (aynı jeton kimliği): düzeltme > yeni sayfa > taban (`ONCELIK`). Defter data/cc-kesim-kaynak.json her yazımı kaydeder;
daha düşük öncelikli bir adım, daha yüksek öncelikli kaynağın yazdığı jetonu ezmez (adımlar hangi sırayla çalışırsa çalışsın).
Çıktı: public/characters/<ad>.webp (+ kucuk/ 96 px), kontak sayfaları docs/sabah/cc-kesim/, rapor docs/sabah/cc-kesim/<adım>.json."""
import csv, glob, importlib.util, io, json, os, re, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

_s = importlib.util.spec_from_file_location('tk', 'scripts/toplu-kesim.py'); tk = importlib.util.module_from_spec(_s); _s.loader.exec_module(tk)
RAW = 'assets-ham/karakter'
KURU = os.environ.get('CC_KURU')   # deneme: çıktılar bu klasöre, defter ve belgeler de oraya
OUT = f'{KURU}/characters' if KURU else 'public/characters'
DOC = f'{KURU}/doc' if KURU else 'docs/sabah/cc-kesim'
LEDGER = f'{KURU}/kaynak.json' if KURU else 'data/cc-kesim-kaynak.json'
ONCELIK = {'taban': 1, 'yeni': 2, 'diger': 2, 'duzeltme': 3}
SIZE = 256
GREEN, MAGENTA = np.array([0, 255, 0], float), np.array([255, 0, 255], float)


# ---------------------------------------------------------------------------------------------------------------- defter ve yazım
def ledger():
    return json.load(open(LEDGER)) if os.path.exists(LEDGER) else {'_not': 'scripts/cc-kesim.py: jeton kimliği → yazan kaynak geçmişi; öncelik düzeltme > yeni sayfa > taban.', 'jetonlar': {}}

def write_token(L, name, img, kaynak, dosya, hucre, rep):
    """Öncelik kuralı: kayıtlı kaynağın önceliği bu adımınkinden yüksekse yazmaz (çakışma raporlanır)."""
    j = L['jetonlar'].setdefault(name, {'gecmis': []})
    cur = j.get('kazanan')
    if cur and ONCELIK[cur['kaynak']] > ONCELIK[kaynak]:
        j['gecmis'].append({'kaynak': kaynak, 'dosya': dosya, 'hucre': hucre, 'sonuc': f'ezilmedi ({cur["kaynak"]} öncelikli)'})
        rep['ezilmedi'].append(name); return False
    img.save(f'{OUT}/{name}.webp', 'WEBP', quality=92, alpha_quality=100, method=4)
    img.resize((96, 96), Image.LANCZOS).save(f'{OUT}/kucuk/{name}.webp', 'WEBP', quality=82, method=4)
    j['gecmis'].append({'kaynak': kaynak, 'dosya': dosya, 'hucre': hucre, 'sonuc': 'yazıldı'})
    j['kazanan'] = {'kaynak': kaynak, 'dosya': dosya, 'hucre': hucre}
    rep['yazilan'].append(name); return True

def save_ledger(L):
    json.dump(L, open(LEDGER, 'w'), ensure_ascii=False, indent=1); open(LEDGER, 'a').write('\n')

def git_token(ref, name):
    r = subprocess.run(['git', 'show', f'{ref}:public/characters/{name}.webp'], capture_output=True)
    return np.array(Image.open(io.BytesIO(r.stdout)).convert('RGBA')) if r.returncode == 0 and r.stdout else None


# Taç kararı: Gemini/yeni sayfadan halesiz gelen Celestial jetonu bekleme listesinden çıkar (oyunda yıldız tacı çizilir).
# TAC_YOK: halesiz gelse de taç çizilmeyecekler (kullanıcı: erkek Celestial Warlock Gulyabani altın tellerle olduğu gibi kalır, hale çizme).
TAC_YOK = {'celestial-erkek-warlock-WL-8': 'Gulyabani: altın teller olduğu gibi, hale/taç çizilmez (kullanıcı, 2026-11-19)'}

def hold_sync(L):
    if KURU: return
    hh = json.load(open('data/hale-halesiz.json')); he = json.load(open('data/hale-elle.json'))
    free = {n for n, j in L['jetonlar'].items() if n.startswith('celestial-') and j.get('kazanan')}
    keep = [n for n in hh['bekleyen'] if n not in free or n in TAC_YOK]
    for n, why in TAC_YOK.items():
        if n in free and n not in keep: keep.append(n)
        if n in free: he['bekleyen'][n] = {'neden': why, 'durum': 'taç yok', 'karar': 'dokunma'}
    hh['bekleyen'] = sorted(keep)
    he['bekleyen'] = {k: v for k, v in sorted(he['bekleyen'].items()) if k in keep}
    for f, d in (('data/hale-halesiz.json', hh), ('data/hale-elle.json', he)):
        json.dump(d, open(f, 'w'), ensure_ascii=False, indent=1); open(f, 'a').write('\n')

# ---------------------------------------------------------------------------------------------------------------- anahtar
def key_page(a):
    """Sayfa zemini (yeşil ve macenta karışık olabilir): saf anahtara ve sayfanın kendi tonlarına yakın büyük bölgeler. → fg maskesi."""
    fg = tk.key_sheet(a, tk.sheet_bg(a))
    return ndi.binary_opening(fg, iterations=1)

def cell_kind(a, fg):
    bg = a[~fg].astype(float)
    if len(bg) < 50: return 'magenta'
    med = np.median(bg, axis=0)
    return 'green' if np.linalg.norm(med - GREEN) < np.linalg.norm(med - MAGENTA) else 'magenta'

def keyed_rgba(a, fg):
    rgba = np.dstack([a, (fg * 255).astype(np.uint8)])
    return tk.despill(tk.trim_lines(rgba), cell_kind(a, fg))

def figures(fg, min_frac=0.004, join=14):
    """Sayfadaki figür kümeleri (yakın parçalar `join` px genişletmeyle birleşir) → [(maske, kutu, merkez)] büyükten küçüğe."""
    lab, n = ndi.label(ndi.binary_dilation(fg, iterations=join))
    if not n: return []
    out = []
    for i, sl in enumerate(ndi.find_objects(lab), 1):
        m = (lab[sl] == i) & fg[sl]
        if m.sum() < min_frac * fg.size: continue
        ys, xs = np.where(m)
        out.append((i, (sl[1].start, sl[0].start, sl[1].stop, sl[0].stop), (xs.mean() + sl[1].start, ys.mean() + sl[0].start), int(m.sum())))
    return out, lab

def reading_order(figs, H):
    """Okuma sırası: satırlar merkez y'ye göre kümelenir (satır aralığı > %12 sayfa), satır içinde soldan sağa."""
    figs = sorted(figs, key=lambda f: f[2][1]); rows = []
    for f in figs:
        if rows and abs(f[2][1] - np.mean([g[2][1] for g in rows[-1]])) < 0.12 * H: rows[-1].append(f)
        else: rows.append([f])
    return [f for r in rows for f in sorted(r, key=lambda g: g[2][0])]


# ---------------------------------------------------------------------------------------------------------------- hizalama
def lower_band(alpha, frac=0.35):
    ys, xs = np.where(alpha)
    if not len(ys): return alpha
    top = int(ys.min() + frac * (ys.max() - ys.min()))
    m = alpha.copy(); m[:top] = False; return m

def resample(rgba, s, dx, dy, size=SIZE):
    """rgba'yı s ile ölçekleyip (dx, dy) ötelemesiyle size×size tuvale koyar (LANCZOS, ön-çarpımlı alfa)."""
    h, w = rgba.shape[:2]
    nw, nh = max(1, round(w * s)), max(1, round(h * s))
    im = Image.fromarray(rgba, 'RGBA').convert('RGBa').resize((nw, nh), Image.LANCZOS).convert('RGBA')
    can = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    can.paste(im, (round(dx), round(dy)))
    return np.array(can)

def fit(new_rgba, ref_alpha):
    """new_rgba (Gemini hücresi, yerel çözünürlük) → jeton uzayında (256) ref_alpha'ya (kaynak jeton) en iyi oturan ölçek/öteleme.
    Ölçüt: alt gövde (figürün üst %35'i hariç: hale/baş değişikliği) IoU. → (s, dx, dy, iou)."""
    na = new_rgba[..., 3] > 127
    ys, xs = np.where(na); rys, rxs = np.where(ref_alpha)
    if not len(ys) or not len(rys): return None
    refL = lower_band(ref_alpha)
    # ölçek adayları: genişlik oranı ve alt gövde (üst %35 hariç) yükseklik oranı; her birinin ±%15'i taranır
    ny0 = ys.min() + 0.35 * (ys.max() - ys.min()); ry0 = rys.min() + 0.35 * (rys.max() - rys.min())
    s_w = (rxs.max() - rxs.min() + 1) / (xs.max() - xs.min() + 1); s_h = (rys.max() - ry0 + 1) / (ys.max() - ny0 + 1)
    best = None
    small = Image.fromarray((na * 255).astype(np.uint8))
    for s in sorted({round(b * f, 4) for b in (s_w, s_h) for f in np.arange(0.85, 1.151, 0.01)}):
        nw, nh = max(1, round(na.shape[1] * s)), max(1, round(na.shape[0] * s))
        m = np.array(small.resize((nw, nh), Image.BILINEAR)) > 127
        my, mx = np.where(m)
        if not len(my): continue
        # alt kenarı ve alt bandın yatay merkezini eşle, sonra ±3 px ara
        mL = lower_band(m); ly, lx = np.where(mL); ry, rx = np.where(refL)
        bx = rx.mean() - lx.mean(); by = rys.max() - my.max()
        for ddx in range(-3, 4):
            for ddy in range(-3, 4):
                ox, oy = round(bx + ddx), round(by + ddy)
                can = np.zeros_like(ref_alpha)
                x0, y0 = max(0, ox), max(0, oy); x1, y1 = min(SIZE, ox + nw), min(SIZE, oy + nh)
                if x1 <= x0 or y1 <= y0: continue
                can[y0:y1, x0:x1] = m[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
                cL = can & (np.arange(SIZE)[:, None] >= int(rys.min() + 0.35 * (rys.max() - rys.min())))
                iou = (cL & refL).sum() / max(1, (cL | refL).sum())
                if best is None or iou > best[3]: best = (s, ox, oy, iou)
    return best

def rescue(tok, ref, tol=60):
    """Kaynakta opak, yenide anahtarla silinmiş ama rengi kaynakla aynı pikseller (zemine yakın mor/pembe sanat): geri opak."""
    t = tok.copy(); lost = (ref[..., 3] > 127) & (t[..., 3] < 64)
    if not lost.any(): return t, 0
    # yeni tuvalde bu piksellerin rengi yok (saydam); renk benzerliğini kaynak görüntünün ham hücresinden değil, komşu opak pikselden kuramayız:
    # bu yüzden yalnız zemin anahtarına yakın OLMAYAN kaynak pikseller ve yeni figürün içinde kalanlar (kapalı delik) geri gelir.
    inside = ndi.binary_fill_holes(t[..., 3] > 127)
    src_rgb = ref[..., :3].astype(float)
    keyish = (np.linalg.norm(src_rgb - MAGENTA, axis=2) < tol) | (np.linalg.norm(src_rgb - GREEN, axis=2) < tol)
    m = lost & inside & ~keyish
    t[m] = ref[m]
    return t, int(m.sum())


# ---------------------------------------------------------------------------------------------------------------- kontak sayfası
def contact(items, path, px=128, cols=8, title=None):
    """items: [(etiket, RGBA np ya da yol, (önce RGBA|None))]; önce varsa yan yana (önce | sonra)."""
    if not items: return
    pair = any(it[2] is not None for it in items)
    cw = px * (2 if pair else 1) + 6
    rows = (len(items) + cols - 1) // cols
    im = Image.new('RGB', (cw * cols, (px + 16) * rows + (18 if title else 0)), (90, 94, 106)); d = ImageDraw.Draw(im)
    if title: d.text((4, 3), title, fill=(255, 255, 255))
    oy0 = 18 if title else 0
    for i, (lab, a, b) in enumerate(items):
        ox, oy = (i % cols) * cw, oy0 + (i // cols) * (px + 16)
        imgs = ([b] if pair else []) + [a]
        for j, x in enumerate(imgs):
            if x is None: continue
            t = Image.fromarray(x if isinstance(x, np.ndarray) else np.array(Image.open(x).convert('RGBA')), 'RGBA').resize((px, px), Image.LANCZOS)
            im.paste(t, (ox + j * px, oy + 16), t)
        d.text((ox + 2, oy + 2), lab[:34], fill=(255, 255, 255))
    os.makedirs(os.path.dirname(path), exist_ok=True); im.save(path, quality=88)


# ---------------------------------------------------------------------------------------------------------------- 1) taban
ERKEK_WL = {('26', str(c)) for c in range(5, 10)} | {('27', str(c)) for c in range(1, 7)}

def halo_removed(ref_alpha, tok_alpha):
    """Kaynakta olup yenide olmayan, figürün üst %30'undaki opak piksel sayısı (hale silindi mi)."""
    ys, _ = np.where(ref_alpha)
    top = int(ys.min() + 0.30 * (ys.max() - ys.min()))
    gone = ref_alpha & ~tok_alpha; gone[top:] = False
    return int(gone.sum())

def taban():
    rows = list(csv.DictReader(open('docs/sabah/hale-gemini-eslesme.csv')))
    duz = list(csv.DictReader(open('assets-ham/eksikler/hale-gemini-duzeltme-eslesme.csv', encoding='utf-8-sig')))
    dogru = {r['dosya'][:-5] for r in duz if r['durum'] == 'halesiz-doğrulandı'}
    L = ledger(); rep = {'adim': 'taban', 'yazilan': [], 'ezilmedi': [], 'atlanan': [], 'eksik_sayfa': [], 'hale_kaldi': [], 'uyum_dusuk': [], 'kurtarilan_px': {}}
    items = []; pages = {}
    for r in rows:
        if r['durum'] not in ('haleli', 'halesiz-supheli'): continue
        name = r['dosya'][:-5]
        if (r['sayfa'], r['hucre']) in ERKEK_WL: rep['atlanan'].append((name, 'erkek Celestial Warlock: yeni sayfadan (adım 2)')); continue
        if name in dogru: rep['atlanan'].append((name, 'halesiz-doğrulandı (düzeltme eşleşmesi): dokunulmadı')); continue
        pages.setdefault(r['sayfa'], []).append(r)
    for p, lst in sorted(pages.items()):
        path = f'assets-ham/karakter/hale-gemini-sayfa-{p}.png'
        if not os.path.exists(path):
            for r in lst: rep['eksik_sayfa'].append((r['dosya'][:-5], f'sayfa {p} hücre {r["hucre"]}'))
            continue
        a = np.asarray(Image.open(path).convert('RGB')); H, W = a.shape[:2]; fg = key_page(a)
        for r in lst:
            name = r['dosya'][:-5]; c = int(r['hucre']) - 1
            x0, y0, x1, y1 = round((c % 3) * W / 3), round((c // 3) * H / 3), round((c % 3 + 1) * W / 3), round((c // 3 + 1) * H / 3)
            cf = fg[y0:y1, x0:x1].copy()
            # hücreye komşudan taşan parça yok sayılır: en büyük küme + ona yakın parçalar
            lab, n = ndi.label(ndi.binary_dilation(cf, iterations=10))
            if n:
                sz = ndi.sum(cf, lab, range(1, n + 1)); keep = [i + 1 for i, v in enumerate(sz) if v >= 0.08 * sz.max()]
                edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
                keep = [i for i in keep if i == int(np.argmax(sz)) + 1 or i not in edge]
                cf &= np.isin(lab, keep)
            cell = keyed_rgba(a[y0:y1, x0:x1], cf)
            src = git_token(r['kaynak'].split(':')[1], name)
            ref_a = src[..., 3] > 127
            f = fit(cell, ref_a)
            if f is None or f[3] < 0.80:
                rep['uyum_dusuk'].append((name, round(f[3], 3) if f else None)); continue
            s, dx, dy, iou = f
            tok = resample(cell, s, dx, dy)
            tok, nres = rescue(tok, src)
            if nres: rep['kurtarilan_px'][name] = nres
            tok = tk.clean_edges(tok)
            gone = halo_removed(ref_a, tok[..., 3] > 127)
            if r['durum'] == 'haleli' and gone < 25:
                rep['hale_kaldi'].append((name, f'sayfa {p} hücre {r["hucre"]}', gone)); continue
            write_token(L, name, Image.fromarray(tok, 'RGBA'), 'taban', f'hale-gemini-sayfa-{p}.png', int(r['hucre']), rep)
            items.append((f'{p}/{r["hucre"]} {name[10:]} {iou:.2f}', tok, src))
    save_ledger(L); hold_sync(L); os.makedirs(DOC, exist_ok=True)
    contact(items, f'{DOC}/adim1-taban.jpg', title='Adım 1 hale tabanı: önce (git kaynak) | sonra')
    json.dump(rep, open(f'{DOC}/adim1-taban.json', 'w'), ensure_ascii=False, indent=1)
    return rep


# ---------------------------------------------------------------------------------------------------------------- 2) yeni sayfalar
GEN = {'female': 'kadin', 'male': 'erkek'}
GLAD_KOD = 'ID12'   # Gladyatör (champion): Fighter 4×3 sayfasının boş 12. hücresinin kodu; data/fighter-jeton.json altSiniflar.champion

def body_height(race, gen, cls='fighter', codes=('ID1', 'ID2', 'ID3', 'ID4', 'ID6', 'ID7', 'ID8', 'ID9')):
    hs = []
    for c in codes:
        f = f'public/characters/{race}-{gen}-{cls}-{c}.webp'
        if os.path.exists(f):
            a = np.array(Image.open(f).convert('RGBA'))[..., 3] > 127; ys, _ = np.where(a)
            if len(ys): hs.append(ys.max() - ys.min() + 1)
    return float(np.median(hs)) if hs else tk.FIG_H

def cut_figures(path, want):
    """Hücreleri otomatik bulur (elle ızgara yok): zemin anahtarı + figür kümeleri, okuma sırası. → [(rgba, kutu)], uyarılar."""
    a = np.asarray(Image.open(path).convert('RGB')); H, W = a.shape[:2]; fg = key_page(a)
    figs, lab = figures(fg, min_frac=0.02, join=18)
    warn = []
    if len(figs) != want: warn.append(f'{len(figs)} figür bulundu, beklenen {want}')
    out = []
    for f in reading_order(figs, H):
        i, (x0, y0, x1, y1), _, _ = f
        m = (lab[y0:y1, x0:x1] == i) & fg[y0:y1, x0:x1]
        # ayak şeridi / kenar lekesi: en büyük bağlı bileşen + ona yakın (≤ 12 px) parçalar
        l2, n2 = ndi.label(m, structure=np.ones((3, 3)))
        if n2 > 1:
            sz = ndi.sum(m, l2, range(1, n2 + 1)); big = l2 == (1 + int(np.argmax(sz)))
            near = ndi.binary_dilation(big, iterations=12)
            keep = [k for k in range(1, n2 + 1) if (near & (l2 == k)).any() and sz[k - 1] >= 30]
            m = np.isin(l2, keep)
        touch = x0 <= 1 or y0 <= 1 or x1 >= W - 1 or y1 >= H - 1
        if touch: warn.append(f'figür sayfa kenarına değiyor ({x0},{y0},{x1},{y1})')
        out.append((keyed_rgba(a[y0:y1, x0:x1], m), (x0, y0, x1, y1), cell_kind(a[y0:y1, x0:x1], m)))
    return out, warn

def place_token(rgba, target_h):
    bb = tk.bbox(rgba)
    h, w = bb[3] - bb[1], bb[2] - bb[0]
    sc = min(target_h / h, (SIZE - 4) / w)
    tok, nh, shifted = tk.render(rgba, bb, sc, (bb[0] + bb[2]) / 2)
    return np.array(tok), round(sc, 4)

def yeni():
    L = ledger(); rep = {'adim': 'yeni', 'yazilan': [], 'ezilmedi': [], 'sayfalar': [], 'eksik': []}
    items = []
    # A) Gladyatör
    for path in sorted(glob.glob(f'{RAW}/gladiator-*.jpg')):
        m = re.match(r'gladiator-([a-z-]+)-(female|male)\.jpg$', os.path.basename(path)); races = m.group(1).split('-'); gen = GEN[m.group(2)]
        figs, warn = cut_figures(path, len(races))
        pr = {'dosya': os.path.basename(path), 'beklenen': len(races), 'bulunan': len(figs), 'zemin': [k for _, _, k in figs], 'uyari': warn, 'jeton': []}
        if len(figs) != len(races): rep['eksik'].append((pr['dosya'], warn)); rep['sayfalar'].append(pr); continue
        for race, (rgba, bb, kind) in zip(races, figs):
            name = f'{race}-{gen}-fighter-{GLAD_KOD}'
            tok, sc = place_token(rgba, body_height(race, gen))
            src = f'public/characters/{race}-{gen}-fighter-ID1.webp'
            write_token(L, name, Image.fromarray(tok, 'RGBA'), 'yeni', pr['dosya'], races.index(race) + 1, rep)
            pr['jeton'].append({'ad': name, 'olcek': sc}); items.append((f'G {race} {gen}', tok, np.array(Image.open(src).convert('RGBA')) if os.path.exists(src) else None))
        rep['sayfalar'].append(pr)
    contact(items, f'{DOC}/adim2-gladyator.jpg', cols=5, title='Adım 2 Gladyatör: Fighter ID1 (ölçek referansı) | yeni ID12')
    # B) Warlock (eski aynı adlı sayfalar assets-ham/karakter/_eski/)
    witems = []
    for path in sorted(glob.glob('assets-ham/eksikler/warlock-*.jpg')):
        m = re.match(r'warlock-(female|male)-([a-z]+)\.jpg$', os.path.basename(path)); gen, race = GEN[m.group(1)], m.group(2)
        comps = tk.components_of_sheet(f'{RAW}/{os.path.basename(path)}', 'warlock')
        names = tk.CLASSES['warlock'][3]
        valid = {n: v for n, v in comps.items() if n <= len(names)}
        pr = {'dosya': os.path.basename(path), 'beklenen': len(names), 'bulunan': len(valid), 'eksik': [n for n in range(1, len(names) + 1) if n not in valid],
              'elle': [(n, v[2][0]) for n, v in valid.items() if any(x.startswith('ELLE') for x in v[2])], 'jeton': []}
        ok = {n: v for n, v in valid.items() if not any(x.startswith('ELLE') for x in v[2])}
        norm = [n for n in ok if tk.TALL.get('warlock') != n]
        hmax = max(ok[n][0].shape[0] for n in norm); wmax = max(ok[n][0].shape[1] for n in norm)
        scale = min(tk.FIG_H / hmax, (SIZE - 4) / wmax)
        for n, (rgba, bb, w) in sorted(ok.items()):
            sc = scale if n in norm else min(tk.FIG_H / rgba.shape[0], (SIZE - 4) / rgba.shape[1])
            tok, nh, shifted = tk.render(rgba, tk.bbox(rgba), sc, rgba.shape[1] / 2)
            name = f'{race}-{gen}-warlock-WL-{n}'
            old = f'public/characters/{name}.webp'; before = np.array(Image.open(old).convert('RGBA')) if os.path.exists(old) else None
            write_token(L, name, tok, 'yeni', pr['dosya'], n, rep)
            pr['jeton'].append(name); witems.append((f'{race}-{gen} WL-{n}', np.array(tok), before))
        rep['sayfalar'].append(pr)
    contact(witems, f'{DOC}/adim2-warlock.jpg', cols=6, title='Adım 2 Warlock: eski | yeni')
    save_ledger(L); hold_sync(L)
    json.dump(rep, open(f'{DOC}/adim2-yeni.json', 'w'), ensure_ascii=False, indent=1)
    return rep


def gladyator_onizleme():
    """docs/sabah/gladyator-sayfa/kesim-onizleme/<kaynak>.jpg: solda kaynak sayfa (yükseklik 300), sağda kesilen jetonlar (256, koyu zemin)."""
    d = 'docs/sabah/gladyator-sayfa/kesim-onizleme'; os.makedirs(d, exist_ok=True)
    for path in sorted(glob.glob(f'{RAW}/gladiator-*.jpg')):
        m = re.match(r'gladiator-([a-z-]+)-(female|male)\.jpg$', os.path.basename(path)); races = m.group(1).split('-'); gen = GEN[m.group(2)]
        src = Image.open(path).convert('RGB'); src = src.resize((round(src.width * 300 / src.height), 300))
        im = Image.new('RGB', (src.width + 20 + 266 * len(races), 320), (54, 58, 66)); im.paste(src, (0, 10)); dr = ImageDraw.Draw(im)
        for i, race in enumerate(races):
            t = Image.open(f'public/characters/{race}-{gen}-fighter-{GLAD_KOD}.webp').convert('RGBA')
            x = src.width + 20 + i * 266; im.paste(t, (x, 40), t); dr.text((x, 14), f'{race}-{gen}-fighter-{GLAD_KOD}', fill=(255, 255, 255))
        im.save(f'{d}/{os.path.splitext(os.path.basename(path))[0]}.jpg', quality=88)

# ---------------------------------------------------------------------------------------------------------------- 3) düzeltme
# Eşleşme dışı ek hücre: kullanıcı notu (2026-11-19) "sayfa 30 hücre 7 düzeltme sayfa 03'ten gelir" → sayfa 03'ün 7. figürü.
DUZ_EK = {('03', 7): ('celestial-erkek-wizard-WZ-B5', '2151397', 'kullanıcı notu: eski sayfa 30 hücre 7')}

# Düzeltme notu "kırmızı aura tam olsun" (eşleşme CSV'si): Gemini sayfasında pembe aura macenta zeminle birleştiği için anahtarda gider;
# aura kaynak jetondan geri konur (yalnız yeni figürün dışında kalan, aura tonundaki kaynak pikseller; altın hale tonu girmez).
AURA_KORU = {'celestial-erkek-barbarian-ID8': ((300, 360), (0, 20))}

def aura_back(tok, src, hues):
    t = tok.copy(); rgb = src[..., :3].astype(float) / 255
    mx, mn = rgb.max(-1), rgb.min(-1); d = mx - mn + 1e-9
    h = np.where(mx == rgb[..., 0], (60 * (rgb[..., 1] - rgb[..., 2]) / d) % 360, np.where(mx == rgb[..., 1], 60 * (rgb[..., 2] - rgb[..., 0]) / d + 120, 60 * (rgb[..., 0] - rgb[..., 1]) / d + 240))
    sat = d / (mx + 1e-9)
    hue_ok = np.zeros(h.shape, bool)
    for lo, hi in hues: hue_ok |= (h >= lo) & (h <= hi)
    m = (src[..., 3] > 16) & (t[..., 3] < 16) & hue_ok & (sat > 0.35) & (mx > 0.35)
    t[m] = src[m]
    return t, int(m.sum())

def duzeltme():
    rows = list(csv.DictReader(open('assets-ham/eksikler/hale-gemini-duzeltme-eslesme.csv', encoding='utf-8-sig')))
    L = ledger(); rep = {'adim': 'duzeltme', 'yazilan': [], 'ezilmedi': [], 'dokunulmadi': [], 'eslesmeyen_hucre': [], 'hale_kaldi': [], 'uyum_dusuk': [], 'sayfalar': [], 'kurtarilan_px': {}}
    want = {}
    for r in rows:
        if not r['yeni_sayfa']: rep['dokunulmadi'].append((r['dosya'][:-5], r['durum'])); continue
        want[(r['yeni_sayfa'], int(r['yeni_hucre']))] = (r['dosya'][:-5], r['kaynak'].split(':')[1], f"eski {r['eski_sayfa']}/{r['eski_hucre']}")
    want.update(DUZ_EK)
    items = []
    for p in ('01', '02', '03'):
        path = f'{RAW}/hale-gemini-duzeltme-sayfa-{p}.jpg'
        a = np.asarray(Image.open(path).convert('RGB')); H, W = a.shape[:2]; fg = key_page(a)
        figs, lab = figures(fg, min_frac=0.008, join=16)
        order = reading_order(figs, H)
        rep['sayfalar'].append({'sayfa': p, 'figur': len(order), 'eslesen': sum(1 for k in want if k[0] == p)})
        for n, f in enumerate(order, 1):
            i, (x0, y0, x1, y1), _, _ = f
            if (p, n) not in want: rep['eslesmeyen_hucre'].append(f'düzeltme sayfa {p} figür {n} (kutu {x0},{y0},{x1},{y1}): eşleşmede yok, uygulanmadı'); continue
            name, ref, note = want[(p, n)]
            m = (lab[y0:y1, x0:x1] == i) & fg[y0:y1, x0:x1]
            cell = keyed_rgba(a[y0:y1, x0:x1], m)
            src = git_token(ref, name); ref_a = src[..., 3] > 127
            ft = fit(cell, ref_a)
            if ft is None or ft[3] < (0.65 if name in AURA_KORU else 0.75): rep['uyum_dusuk'].append((name, f'sayfa {p} figür {n}', round(ft[3], 3) if ft else None)); continue
            sc, dx, dy, iou = ft
            tok = resample(cell, sc, dx, dy); tok, nres = rescue(tok, src)
            if nres: rep['kurtarilan_px'][name] = nres
            tok = tk.clean_edges(tok)
            gone = halo_removed(ref_a, tok[..., 3] > 127)
            if gone < 25: rep['hale_kaldi'].append((name, f'sayfa {p} figür {n}', gone)); continue
            if name in AURA_KORU:
                tok, na_ = aura_back(tok, src, AURA_KORU[name]); rep.setdefault('aura_geri_px', {})[name] = na_
            write_token(L, name, Image.fromarray(tok, 'RGBA'), 'duzeltme', f'hale-gemini-duzeltme-sayfa-{p}.jpg', n, rep)
            items.append((f'D{p}/{n} {name[10:]} {iou:.2f}', tok, src))
        for k in want:
            if k[0] == p and k[1] > len(order): rep['eslesmeyen_hucre'].append(f'düzeltme sayfa {p} hücre {k[1]} ({want[k][0]}): figür bulunamadı')
    save_ledger(L); hold_sync(L)
    contact(items, f'{DOC}/adim3-duzeltme.jpg', cols=5, title='Adım 3 düzeltme: önce (git kaynak) | sonra')
    json.dump(rep, open(f'{DOC}/adim3-duzeltme.json', 'w'), ensure_ascii=False, indent=1)
    oncelik_rapor(L)
    return rep

def oncelik_rapor(L):
    """docs/sabah/celestial-oncelik.md: birden çok kaynağın yazdığı (ya da yazmaya çalıştığı) Celestial jetonlar ve kazanan."""
    if KURU: return
    lines = ['# Celestial jeton öncelik raporu (CC 2026-11-19)', '', 'Kural (`scripts/cc-kesim.py` `ONCELIK`, `write_token`): aynı jeton kimliği için **düzeltme > yeni sayfa > taban**. '
             'Defter `data/cc-kesim-kaynak.json`. Aşağıda yalnız birden fazla kaynağın dokunduğu Celestial jetonlar.', '',
             '| Jeton | Kaynaklar (sırayla) | Kazanan | Kazanan dosya / hücre |', '|---|---|---|---|']
    tek = 0
    for n, j in sorted(L['jetonlar'].items()):
        if not n.startswith('celestial-'): continue
        ks = [g['kaynak'] for g in j['gecmis']]
        if len(set(ks)) < 2: tek += 1; continue
        w = j['kazanan']
        lines.append(f"| {n} | {' → '.join(ks)} | {w['kaynak']} | {w['dosya']} / {w['hucre']} |")
    lines += ['', f'Tek kaynaktan yazılan Celestial jeton: {tek}.']
    open('docs/sabah/celestial-oncelik.md', 'w').write('\n'.join(lines) + '\n')

# ---------------------------------------------------------------------------------------------------------------- C) diğer düzeltme sayfaları
def cut_bodies(path, want, near=0.55):
    """Gövde + kopuk parçalar (hokkabaz bıçağı, kitap, taş, ay): en büyük `want` bileşen gövde; ≥ 25 px diğer parçalar en yakın gövdeye
    (uzaklık ≤ near × gövde boyu) bağlanır, uzak/sahipsiz parçalar atılır. → okuma sırasında [(rgba, kutu, zemin)], uyarılar."""
    a = np.asarray(Image.open(path).convert('RGB')); H, W = a.shape[:2]; fg = key_page(a)
    lab, n = ndi.label(fg, structure=np.ones((3, 3)))
    sz = ndi.sum(fg, lab, range(1, n + 1))
    objs0 = ndi.find_objects(lab)
    def frame(i):   # sayfa çerçevesi/ızgara: kutusu sayfanın yarısından büyük ve doluluğu düşük
        sl = objs0[i - 1]; bh, bw = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        return bh * bw > 0.25 * H * W and sz[i - 1] < 0.15 * bh * bw
    sz = np.where([frame(i) for i in range(1, n + 1)], 0, sz); order = np.argsort(-sz)
    bodies = [int(i) + 1 for i in order[:want]]
    warn = []
    if n < want or sz[order[want - 1]] < 0.25 * sz[order[0]]: warn.append(f'gövde sayısı belirsiz (en büyük {want} bileşen: {[int(sz[i]) for i in order[:want + 1]]})')
    objs = ndi.find_objects(lab)
    dist, owner = None, {}
    # her pikselin en yakın gövdesi: gövdelere ayrı uzaklık dönüşümü (4× küçültülmüş ızgarada)
    k = 4; small = lab[::k, ::k]
    dts = [ndi.distance_transform_edt(small != b) * k for b in bodies]
    hgt = {b: objs[b - 1][0].stop - objs[b - 1][0].start for b in bodies}
    members = {b: [b] for b in bodies}
    def lineish(i):   # ızgara/çerçeve çizgisi kırıntısı: ince, uzun, koyu-nötr
        sl = objs[i - 1]; h_, w_ = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if min(h_, w_) > 14 or max(h_, w_) < 40: return False
        px_ = a[sl][lab[sl] == i].astype(int)
        return px_.max(axis=1).mean() < 110 and float((px_.max(axis=1) - px_.min(axis=1)).mean()) < 40
    for i in range(1, n + 1):
        if i in bodies or sz[i - 1] < 25: continue
        if lineish(i): warn.append(f'çizgi kırıntısı atıldı ({objs[i - 1][1].start},{objs[i - 1][0].start})'); continue
        sl = objs[i - 1]
        if sl[0].start <= 2 or sl[1].start <= 2 or sl[0].stop >= H - 2 or sl[1].stop >= W - 2: continue   # sayfa çerçevesi / ayraç
        y_, x_ = (sl[0].start + sl[0].stop) / 2, (sl[1].start + sl[1].stop) / 2
        cy, cx = min(int(y_) // k, small.shape[0] - 1), min(int(x_) // k, small.shape[1] - 1)
        ds = [dt[cy, cx] for dt in dts]
        for j in np.argsort(ds):   # en yakın gövde; parça merkezi gövde kutusunun %25 genişletilmiş hâlinin içinde olmalı
            b = bodies[j]; bs = objs[b - 1]; ph, pw = 0.25 * (bs[0].stop - bs[0].start), 0.25 * (bs[1].stop - bs[1].start)
            if ds[j] > near * hgt[b]: break
            if bs[0].start - ph <= y_ <= bs[0].stop + ph and bs[1].start - pw <= x_ <= bs[1].stop + pw: members[b].append(i); break
    out = []
    figs = []
    for b in bodies:
        m = np.isin(lab, members[b]); ys, xs = np.where(m)
        figs.append((b, (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1), (np.mean(xs), np.mean(ys)), int(m.sum())))
    for b, (x0, y0, x1, y1), _, _ in reading_order(figs, H):
        m = np.isin(lab[y0:y1, x0:x1], members[b])
        out.append((keyed_rgba(a[y0:y1, x0:x1], m), (x0, y0, x1, y1), cell_kind(a[y0:y1, x0:x1], m)))
    return out, warn

def cut_grid(path, rows, cols):
    """Düzenli ızgaralı sayfa: bileşenler merkezlerinin düştüğü hücreye; hücrede en büyük bileşen gövde, aynı hücrenin ≥ 25 px parçaları onun;
    sayfa kenarına değen ve çizgi benzeri (ince, koyu-nötr) parçalar atılır. → okuma sırasında [(rgba, kutu, zemin)], uyarılar."""
    a = np.asarray(Image.open(path).convert('RGB')); H, W = a.shape[:2]; fg = key_page(a)
    # ızgara ve çerçeve çizgileri (bilinen konum ± 14 px, koyu pikseller) önce silinir: figür çizgiye değse de çerçeveyle birleşmez
    dark = a.max(axis=2) < 100; band = np.zeros_like(fg)
    for c in range(cols + 1): x = round(c * W / cols); band[:, max(0, x - 14):x + 14] = True
    for r in range(rows + 1): y = round(r * H / rows); band[max(0, y - 14):y + 14, :] = True
    fg &= ~(band & dark)
    lab, n = ndi.label(fg, structure=np.ones((3, 3))); objs = ndi.find_objects(lab); sz = ndi.sum(fg, lab, range(1, n + 1))
    big = 0.01 * H * W
    cells = {}
    for i in range(1, n + 1):
        sl = objs[i - 1]
        if sz[i - 1] < 25: continue
        if sz[i - 1] < big and (sl[0].start <= 2 or sl[1].start <= 2 or sl[0].stop >= H - 2 or sl[1].stop >= W - 2): continue
        h_, w_ = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        px_ = a[sl][lab[sl] == i].astype(int)
        if min(h_, w_) <= 14 and max(h_, w_) >= 40 and px_.max(axis=1).mean() < 110: continue
        ys, xs = np.where(lab[sl] == i); cy, cx = ys.mean() + sl[0].start, xs.mean() + sl[1].start
        cells.setdefault((min(rows - 1, int(cy / H * rows)), min(cols - 1, int(cx / W * cols))), []).append(i)
    out, warn = [], []
    for r in range(rows):
        for c in range(cols):
            lst = cells.get((r, c))
            if not lst: warn.append(f'hücre {r * cols + c + 1} boş'); out.append(None); continue
            m = np.isin(lab, lst); ys, xs = np.where(m); x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
            mm = m[y0:y1, x0:x1]; out.append((keyed_rgba(a[y0:y1, x0:x1], mm), (x0, y0, x1, y1), cell_kind(a[y0:y1, x0:x1], mm)))
    return out, warn

def token_height(name):
    f = f'public/characters/{name}.webp'
    if not os.path.exists(f): return None
    al = np.array(Image.open(f).convert('RGBA'))[..., 3] > 127; ys, _ = np.where(al)
    return float(ys.max() - ys.min() + 1)

def sim(tok, old):
    """Görsel benzerlik (eşleştirme): iki jetonun 64 px küçültülmüş, ön-çarpımlı RGB farkı (küçük = benzer)."""
    f = lambda x: np.array(Image.fromarray(x, 'RGBA').convert('RGBa').resize((64, 64), Image.BILINEAR)).astype(float)
    a, b = f(tok), f(old); return float(np.abs(a - b).mean())

BARD = [("bard-m-tiefling-dragonborn.png", [('tiefling', 'erkek'), ('dragonborn', 'erkek')]),
        ("bard-f-halfling-orc-tiefling-dragonborn.png", [('human', 'kadin'), ('orc', 'kadin'), ('tiefling', 'kadin'), ('dragonborn', 'kadin')]),
        ("kadin-5'li.jpg", [('celestial', 'kadin'), ('dwarf', 'kadin'), ('elf', 'kadin'), ('gnome', 'kadin'), ('goliath', 'kadin')]),
        ("4'lü.jpg", [('human', 'erkek'), ('orc', 'erkek'), ('halfling', 'erkek'), ('halfling', 'kadin')]),
        ("erkek-5'li.jpg", [('celestial', 'erkek'), ('dwarf', 'erkek'), ('elf', 'erkek'), ('gnome', 'erkek'), ('goliath', 'erkek')])]
SORC_IZGARA = {'sorcerer-duzelt-A-sonuc.jpg': (2, 2), 'sorcerer-duzelt-B-sonuc.jpg': (2, 2), 'sorcerer-duzelt-C-sonuc.jpg': (3, 3)}
SORC = [('sorcerer-duzelt-A-sonuc.jpg', 2, [('orc', 'erkek'), ('halfling', 'erkek'), ('human', 'kadin'), ('orc', 'kadin')]),
        ('sorcerer-duzelt-B-sonuc.jpg', 3, [('celestial', 'kadin'), ('halfling', 'kadin'), ('human', 'kadin'), ('tiefling', 'kadin')]),
        ('sorcerer-duzelt-C-sonuc.jpg', 9, [('goliath', 'erkek'), ('elf', 'erkek'), ('tiefling', 'erkek'), ('orc', 'erkek'),
                                            ('dragonborn', 'kadin'), ('dwarf', 'kadin'), ('goliath', 'kadin'), ('human', 'kadin'), ('tiefling', 'kadin')])]

def match(toks, names, margin=0.12):
    """Macar eşleştirme (küçük boyutta kaba kuvvet yerine açgözlü + ikinci en iyi farkı): → {figür: ad}, belirsizler."""
    olds = {nm: np.array(Image.open(f'public/characters/{nm}.webp').convert('RGBA')) for nm in names}
    from itertools import permutations
    C = np.array([[sim(t, olds[nm]) for nm in names] for t in toks])
    if len(names) <= 9:
        from scipy.optimize import linear_sum_assignment
        r, c = linear_sum_assignment(C)
    res, amb = {}, []
    for i, j in zip(r, c):
        res[i] = names[j]
        alt = sorted(C[i]); second = alt[1] if len(alt) > 1 else alt[0] * 2
        if (second - C[i, j]) / max(1e-6, second) < margin: amb.append((i, names[j], round(C[i, j], 1), round(second, 1)))
    return res, amb, C

# Sorcerer C: 1. ve 7. figür (kel kafatası yüzlü iki Goliath) görsel olarak ayırt edilemiyor (cinsiyet ipucu yok): uygulanmaz, docs/sabah/sorcerer-eslesme.md.
SORC_BELIRSIZ = {('sorcerer-duzelt-C-sonuc.jpg', 1), ('sorcerer-duzelt-C-sonuc.jpg', 7)}
BARB_SIRA = ['human', 'elf', 'dwarf', 'halfling', 'gnome', 'orc', 'tiefling', 'goliath']   # aura-sil v3 sayfa sırası (9. hücre boş)

def moon_clean(rgba, kind):
    """Ay parıltısı kalıntısı: gövde dışındaki parçalarda zemin tonuna çalan (yeşil/macenta) yarı parlak pikseller silinir; ayın kendisi (beyaz-mavi) kalır."""
    a = rgba.copy(); rgb = a[..., :3].astype(int); al = a[..., 3] > 0
    lab_, n = ndi.label(al, structure=np.ones((3, 3)))
    if n < 1: return a, 0
    sz = ndi.sum(al, lab_, range(1, n + 1)); body = lab_ == (1 + int(np.argmax(sz)))
    tint = (rgb[..., 1] - np.maximum(rgb[..., 0], rgb[..., 2]) > 12) if kind == 'green' else (np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1] > 40)
    # aya bitişik (gövdeyle birleşmiş) parıltı: çok açık ve güçlü zemin tonlu pikseller, figürün üst %45'inde (zombi yüzü gibi soluk yeşil sanat eşiğin altında kalır)
    strong = ((rgb[..., 1] - np.maximum(rgb[..., 0], rgb[..., 2]) > 40) if kind == 'green' else (np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1] > 70)) & (rgb.max(-1) > 170)
    ys, _ = np.where(al); top = np.zeros_like(al); top[:int(ys.min() + 0.45 * (ys.max() - ys.min()))] = True
    m = al & ((~body & tint) | (strong & top))
    a[m, 3] = 0
    return a, int(m.sum())

def sheet_scale(comps, cls):
    ok = {n: v for n, v in comps.items() if n <= len(tk.CLASSES[cls][3]) and not any(x.startswith('ELLE') for x in v[2])}
    norm = [n for n in ok if tk.TALL.get(cls) != n]
    return min(tk.FIG_H / max(ok[n][0].shape[0] for n in norm), (SIZE - 4) / max(ok[n][0].shape[1] for n in norm)), ok

def sibling_height(race, gen, cls, skip):
    hs = []
    for f in glob.glob(f'public/characters/{race}-{gen}-{cls}-ID*.webp'):
        if re.search(rf'-{cls}-ID{skip}\.webp$', f): continue
        h = token_height(os.path.basename(f)[:-5])
        if h: hs.append(h)
    return float(np.median(hs))

def align_or_height(rgba, name, rep, min_iou=0.70):
    """Eski jetonla aynı kompozisyon: alt gövde hizalaması (fit); uyum düşükse (yön değişmiş, sağa dönük vb.) eski figür boyuna göre ölçek."""
    old_a = np.array(Image.open(f'public/characters/{name}.webp').convert('RGBA'))[..., 3] > 127
    f = fit(rgba, old_a)
    if f and f[3] >= min_iou:
        tok = tk.clean_edges(resample(rgba, *f[:3]))
        if tok[..., 3].any() and not (tok[0, :, 3].any() or tok[:, 0, 3].any() or tok[:, -1, 3].any()): rep.setdefault('hizalama', {})[name] = round(f[3], 3); return tok
    rep.setdefault('boy_esleme', []).append(name)
    return place_token(rgba, token_height(name))[0]

def diger():
    L = ledger(); rep = {'adim': 'diger', 'yazilan': [], 'ezilmedi': [], 'sayfalar': [], 'belirsiz': [], 'uyari': []}
    old = lambda nm: np.array(Image.open(f'public/characters/{nm}.webp').convert('RGBA')) if os.path.exists(f'public/characters/{nm}.webp') else None
    groups = {}
    def put(group, name, tok, dosya, hucre):
        b = old(name); write_token(L, name, Image.fromarray(tok, 'RGBA') if isinstance(tok, np.ndarray) else tok, 'diger', dosya, hucre, rep)
        groups.setdefault(group, []).append((name.replace('-', ' ', 2)[:34], np.array(tok), b))
    # 1) Bard hücre 3 (hokkabaz)
    for f, lst in BARD:
        out, warn = cut_bodies(f'{RAW}/{f}', len(lst))
        rep['sayfalar'].append({'dosya': f, 'beklenen': len(lst), 'bulunan': len(out), 'zemin': [k for _, _, k in out], 'uyari': warn})
        for i, ((rgba, bb, kind), (race, g)) in enumerate(zip(out, lst), 1):
            name = f'{race}-{g}-bard-ID3'; put('bard', name, align_or_height(rgba, name, rep), f, i)
    # 2) Sorcerer
    for f, cell, lst in SORC:
        out, warn = cut_grid(f'{RAW}/{f}', *SORC_IZGARA[f])
        rep['sayfalar'].append({'dosya': f, 'beklenen': len(lst), 'bulunan': len(out), 'zemin': [k for _, _, k in out], 'uyari': warn})
        for i, ((rgba, bb, kind), (race, g)) in enumerate(zip(out, lst), 1):
            name = f'{race}-{g}-sorcerer-SC-{cell}'
            if (f, i) in SORC_BELIRSIZ: rep['belirsiz'].append((f, i, name)); continue
            if cell == 9:
                rgba, nm_ = moon_clean(rgba, kind)
                if nm_: rep['uyari'].append(f'{name}: ay parıltısı kalıntısı {nm_} px silindi')
            put('sorcerer', name, align_or_height(rgba, name, rep), f, i)
    # 3) tam sınıf sayfasından tek hücre (özgün hat ve sayfa ölçeği): Druid Tiefling hücre 4, Cleric erkek Tiefling hücre 9,
    #    Celestial erkek Cleric (hale-gemini sayfa 06'nın yeniden yapılmışı; yalnız haleli hücreler 7 ve 9, halesiz-temiz dokunulmaz)
    for f, cls, cells, race, g in [('druid-female-tiefling.jpg', 'druid', [4], 'tiefling', 'kadin'), ('druid-male-tiefling.jpg', 'druid', [4], 'tiefling', 'erkek'),
                                   ('cleric-male-tiefling.jpg', 'cleric', [9], 'tiefling', 'erkek'), ('clerik-male-celestial.jpg', 'cleric', [7, 9], 'celestial', 'erkek'),
                                   ('fighter-male-human.jpg', 'fighter', list(range(1, 12)), 'human', 'erkek'), ('fighter-female-human.jpg', 'fighter', list(range(1, 11)), 'human', 'kadin')]:
        comps = tk.components_of_sheet(f'{RAW}/{f}', cls)
        scale, ok = sheet_scale(comps, cls)
        names = tk.CLASSES[cls][3]
        pr = {'dosya': f, 'beklenen_hucre': len(names), 'bulunan': sorted(comps), 'elle': [(n, v[2][0]) for n, v in comps.items() if any(x.startswith('ELLE') for x in v[2])], 'yazilan_hucre': []}
        for n in cells:
            if n not in ok: rep['uyari'].append(f'{f} hücre {n}: figür yok ya da ELLE, uygulanmadı'); continue
            rgba = ok[n][0]; sc = scale if tk.TALL.get(cls) != n else min(tk.FIG_H / rgba.shape[0], (SIZE - 4) / rgba.shape[1])
            tok, nh, shifted = tk.render(rgba, tk.bbox(rgba), sc, rgba.shape[1] / 2)
            put(cls if race != 'celestial' else 'cleric-celestial', f'{race}-{g}-{cls}-ID{n}', np.array(tok), f, n); pr['yazilan_hucre'].append(n)
        rep['sayfalar'].append(pr)
    # 4) Barbarian aurasız (Çılgın Yol hücre 8): ölçek = aynı ırk/cinsiyet Barbarian jetonlarının (ID8 hariç) ortanca boyu
    for f, g in (('barbarian-female-aurasiz.jpg', 'kadin'), ('barbarian-male-aurasiz.jpg', 'erkek')):
        out, warn = cut_bodies(f'{RAW}/{f}', 8)
        rep['sayfalar'].append({'dosya': f, 'beklenen': 8, 'bulunan': len(out), 'zemin': [k for _, _, k in out], 'uyari': warn})
        for i, ((rgba, bb, kind), race) in enumerate(zip(out, BARB_SIRA), 1):
            name = f'{race}-{g}-barbarian-ID8'; tok, sc = place_token(rgba, sibling_height(race, g, 'barbarian', 8)); put('barbarian', name, tok, f, i)
    save_ledger(L); hold_sync(L)
    for k, it in groups.items(): contact(it, f'{DOC}/C-{k}.jpg', cols=5, title=f'C {k}: eski | yeni')
    json.dump(rep, open(f'{DOC}/C-diger.json', 'w'), ensure_ascii=False, indent=1)
    oncelik_rapor(L)
    return rep

if __name__ == '__main__':
    os.makedirs(f'{OUT}/kucuk', exist_ok=True)
    step = sys.argv[1] if len(sys.argv) > 1 else ''
    fn = {'taban': taban, 'yeni': yeni, 'duzeltme': duzeltme, 'diger': diger, 'gladyator-onizleme': lambda: (gladyator_onizleme(), {'tamam': 1})[1]}.get(step)
    if not fn: sys.exit(__doc__)
    r = fn()
    print({k: (len(v) if isinstance(v, (list, dict)) else v) for k, v in r.items()})
