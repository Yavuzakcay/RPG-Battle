#!/usr/bin/env python3
"""Cleric ID9 (Birlik Manastırı) boncuk halkası tek tip ÖNİZLEMESİ (2026-11-19; jetonlara YAZMAZ, onay bekliyor).
`python3 scripts/cleric-id9-halka.py` → docs/sabah/cleric-id9-halka/: once-sonra-3x.png (18 jeton, önce | sonra), aday/<jeton>.png (256 px aday),
rapor.json. 9 ırk × 2 cinsiyet (Celestial hariç).
1) Silme: baş bölgesinde (baş tepesinin 40 px üstünden baş tepesi + 80 px'e, baş merkezine ±80 px) sarı-yeşil boncuk renkli pikseller
   (ton 40–95°, doygunluk ≥ 0,30, parlaklık ≥ 0,45) halka sayılır; halka çıkarılınca karakterin ana gövdesinden kopan bu bölgedeki opak parçalar
   (boncuk dış çizgileri) de silinir. Çaydanlık buharı (nane yeşili, ton > 95°) ve bölge dışı eşya dokunulmaz.
2) Referans: human-erkek-cleric-ID9 halkası (aynı yöntemle ayrılan katman). Baş geometrisi: baş merkez sütununu kesen ilk geniş (≥ 10 px) koşu =
   baş tepesi (boynuz uçları yanlarda kaldığı için sayılmaz), baş genişliği = tepe + 14 satırdaki merkez koşu. Halka ölçek = hedef kafatası eni /
   referans kafatası eni (tepe + 6/10/14 satırlarının en darı; 0,85–1,10 arası sınırlı); konum referanstaki baş tepesine göre aynı oranla. Halka karakterin ARKASINDA (jeton halkanın üstüne bindirilir).
2b) 2026-11-19 ek: Tiefling ve Dragonborn (BOYNUZLU) halka boynuz uçlarının üstüne alınır (boncuk ile kafatası dışındaki baş bölgesi gövdesi
   kesişmez); elf kadın (TAM) boncukları tam görünür (halka figürün hiçbir pikseliyle kesişmez). Halka yukarı kaydırılır; tuvale sığmazsa figür ayak
   hizası sabit kalarak 0,01 adımla en az gereken kadar küçültülür (en çok 0,80). Diğer ırklar değişmez. Tiefling kadın ID9 (çizim erkek) önizlemede yok.
3) Dragonborn: pul maskesine dokunulmaz; silinen eski halka piksellerinin pul maskesiyle kesişimi raporlanır (beklenen 0)."""
import json, os
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
D, OUT = 'public/characters', 'docs/sabah/cleric-id9-halka'
RACES = ['human', 'elf', 'dwarf', 'orc', 'gnome', 'goliath', 'halfling', 'tiefling', 'dragonborn']

def hsv(rgb):
    c = rgb.astype(float) / 255; mx = c.max(-1); mn = c.min(-1); d = mx - mn + 1e-9
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    return h, d / (mx + 1e-9), mx

def head(a, ring=None):
    al = a[..., 3] > 127
    if ring is not None: al &= ~ring
    lab, n = ndi.label(al, structure=np.ones((3, 3))); sz = ndi.sum(al, lab, range(1, n + 1)); body = lab == 1 + int(np.argmax(sz))
    ys, xs = np.where(body); top = ys.min()
    cx = int(np.median(xs[ys < top + 70]))
    def run(y):
        row = body[y]
        if not row[cx]: return None
        x0 = cx
        while x0 > 0 and row[x0 - 1]: x0 -= 1
        x1 = cx
        while x1 < 255 and row[x1 + 1]: x1 += 1
        return x0, x1
    ht = next(y for y in range(top, 256) if (r := run(y)) and r[1] - r[0] + 1 >= 10)
    r = run(ht + 14) or run(ht + 10)
    return ht, (r[0] + r[1]) / 2, r[1] - r[0] + 1, body

def split_ring(a):
    """→ (halka katmanı RGBA, halkasız jeton, halka maskesi). (a) baş üstü bandında (tepe − 40 … tepe + 80, merkez ± 80) boncuk renkli her piksel;
    (b) daha geniş bölgede (tepe − 40 … tepe + 190, merkez ± 110) ana gövdeden kopuk, en az %15'i boncuk renkli, küçük (≤ 400 px) ve boncuk
    biçimli (≤ 30×30, en/boy 0,5–2) parçalar (yandaki dağınık boncuklar); (c) (a)'ya bitişik, gövdeden kopuk dış çizgiler. Gövdeye bağlı eşya (çaydanlık, fincan) ve buhar (ton > 95°) kalır."""
    h, s, v = hsv(a[..., :3]); al = a[..., 3] > 20
    col = al & (h >= 40) & (h <= 95) & (s >= 0.30) & (v >= 0.45)
    ht0, cx0, hw0, _ = head(a, ndi.binary_dilation(col, iterations=2))
    reg = np.zeros(al.shape, bool); reg[max(0, ht0 - 40):ht0 + 80, max(0, int(cx0) - 80):int(cx0) + 81] = True
    wide = np.zeros(al.shape, bool); wide[max(0, ht0 - 40):ht0 + 190, max(0, int(cx0) - 110):int(cx0) + 111] = True
    ring = col & reg
    op = a[..., 3] > 0
    lab, n = ndi.label(op, structure=np.ones((3, 3))); sz = ndi.sum(op, lab, range(1, n + 1)); mainid = 1 + int(np.argmax(sz))
    for i, sl in enumerate(ndi.find_objects(lab), 1):
        if i == mainid or sz[i - 1] > 400: continue
        m_ = lab == i; bw, bh = sl[1].stop - sl[1].start, sl[0].stop - sl[0].start
        bead = bw <= 30 and bh <= 30 and 0.5 <= bw / max(bh, 1) <= 2.0          # yuvarlak, küçük (boncuk); yaprak/alev efekti değil
        hm = float(np.median(h[m_ & (s > 0.25)])) if (m_ & (s > 0.25)).any() else 0.0   # parçanın baskın tonu (buhar nane yeşili > 95° kalır)
        if (m_ & wide).sum() == m_.sum() and (m_ & col).sum() >= 0.15 * m_.sum() and 40 <= hm <= 95 and (bead or sl[0].stop <= ht0 + 80): ring |= m_
    rest = op & ~ring
    lab, n = ndi.label(rest, structure=np.ones((3, 3))); sz = ndi.sum(rest, lab, range(1, n + 1)); main = lab == 1 + int(np.argmax(sz))
    loose = rest & ~main & wide & ndi.binary_dilation(ring, iterations=4)
    m = ring | loose
    layer = np.zeros_like(a); layer[m] = a[m]
    clean = a.copy(); clean[m] = 0
    return layer, clean, m

def skull_width(body, ht, cx):
    """Kafatası eni: tepe + 6/10/14 satırlarında merkez sütunu kesen koşuların en darı (alt satırlarda saç, kulak ve boynuz eni şişirir)."""
    ws = []
    for y in (ht + 6, ht + 10, ht + 14):
        row = body[y]; c = int(cx)
        if not row[c]: continue
        x0 = c
        while x0 > 0 and row[x0 - 1]: x0 -= 1
        x1 = c
        while x1 < 255 and row[x1 + 1]: x1 += 1
        ws.append(x1 - x0 + 1)
    return min(ws)

OLCEK = (0.85, 1.10)   # ölçek sınırı: saç/kulak/boynuz eni yine şişirirse halka aşırı büyümesin

BOYNUZLU = {'tiefling', 'dragonborn'}          # halka boynuz uçlarının üstüne: boncuklar boynuzla hiç kesişmez
TAM = {'elf-kadin-cleric-ID9'}                 # boncuklar tam görünür: halka figürün hiçbir pikseliyle kesişmez
HARIC = {}   # 3. tur: Tiefling kadın ID9 yeni çizimle geri geldi
KUCULT = [round(1 - 0.01 * i, 2) for i in range(0, 21)]   # 1,00 … 0,80: üstten sığmazsa figür ayak hizası sabit kalarak en az gereken kadar küçültülür

def shrink(clean, f):
    if f == 1.0: return clean
    al = clean[..., 3] > 0; ys, xs = np.where(al); foot, cxm = ys.max(), (xs.min() + xs.max()) / 2
    im = Image.fromarray(clean, 'RGBA').convert('RGBa'); w = round(256 * f)
    sm = im.resize((w, w), Image.LANCZOS).convert('RGBA')
    can = Image.new('RGBA', (256, 256), (0, 0, 0, 0)); can.paste(sm, (round(cxm - cxm * f), round(foot - foot * f)), sm)
    return np.array(can)

def forbidden_of(clean, mode):
    ht, cx, _, body = head(clean)
    if mode == 'tam': return body
    skull = np.zeros_like(body)                       # kafatası: baş tepesinden aşağı, merkez sütunu kesen koşu
    for y in range(ht, min(256, ht + 60)):
        row = body[y]; c = int(cx)
        if not row[c]: continue
        x0 = c
        while x0 > 0 and row[x0 - 1]: x0 -= 1
        x1 = c
        while x1 < 255 and row[x1 + 1]: x1 += 1
        skull[y, x0:x1 + 1] = True
    zone = np.zeros_like(body); zone[:ht + 40] = True
    return body & ~skull & zone                       # boynuz: baş bölgesinde kafatası dışındaki gövde

def place(clean0, ring, rb, rht, rcx, rhw, mode):
    best = None
    for f in (KUCULT if mode != 'normal' else [1.0]):
        clean = shrink(clean0, f)
        ht, cx, _, body = head(clean); hw = skull_width(body, ht, cx)
        sc_raw = hw / rhw; sc = float(np.clip(sc_raw, *OLCEK))
        rw, rh = max(1, round(ring.shape[1] * sc)), max(1, round(ring.shape[0] * sc))
        rimg = Image.fromarray(ring, 'RGBA').resize((rw, rh), Image.NEAREST); rmask = np.array(rimg)[..., 3] > 0
        x0 = round(cx + ((rb[0] + rb[2]) / 2 - rcx) * sc - rw / 2); y_ideal = round(ht + (rb[1] - rht) * sc)
        if mode == 'normal':
            y0 = y_ideal; kayma = max(0, 1 - y0); y0 += kayma
            info = {'figur_olcek': 1.0, 'bas_tepe': int(ht), 'bas_en': int(hw), 'olcek_ham': round(sc_raw, 3), 'olcek': round(sc, 3), 'asagi_kayma_px': int(kayma)}
            return compose(clean, rimg, x0, y0), {**info, 'halka_kutu': [x0, y0, x0 + rw, y0 + rh]}
        forb = forbidden_of(clean, mode)
        for y0 in range(max(1, min(y_ideal, 256)), 0, -1):
            can = np.zeros((256, 256), bool)
            ys_, xs_ = np.where(rmask); yy, xx = ys_ + y0, xs_ + x0; ok = (yy >= 0) & (yy < 256) & (xx >= 0) & (xx < 256)
            can[yy[ok], xx[ok]] = True
            ov = int((can & forb).sum())
            if best is None or ov < best[0]: best = (ov, f, y0, clean, rimg, x0, rw, rh, ht, hw, sc_raw, sc, y_ideal)
            if ov == 0: break
        if best[0] == 0: break
    ov, f, y0, clean, rimg, x0, rw, rh, ht, hw, sc_raw, sc, y_ideal = best
    info = {'figur_olcek': f, 'bas_tepe': int(ht), 'bas_en': int(hw), 'olcek_ham': round(sc_raw, 3), 'olcek': round(sc, 3),
            'yukari_kayma_px': int(y_ideal - y0), 'kesisim_px': ov, 'halka_kutu': [x0, y0, x0 + rw, y0 + rh]}
    return compose(clean, rimg, x0, y0), info

def compose(clean, rimg, x0, y0):
    can = Image.new('RGBA', (256, 256), (0, 0, 0, 0)); can.paste(rimg, (x0, y0), rimg)
    can.alpha_composite(Image.fromarray(clean, 'RGBA')); return np.array(can)

# 2026-11-19 (3. tur): kullanıcı örnekleri (assets-ham/eksikler/halka-ornek-tiefling-erkek.png, -dragonborn-kadin.png; 1/4 indirgeme = jeton ölçeği)
# ölçüldü: halka eni = kafatası eni × 0,48 (0,50 / 0,46), boy/en 0,68 (25/36, 21/31), alt kenar = baş tepesi + 2 (başın arkasına girer),
# yatay merkez = baş merkezi + ırk payı × kafatası eni (Tiefling −0,035, Dragonborn −0,11). Figür küçültülmez.
ORNEK = {'en': 0.48, 'boy_en': 0.68, 'alt': 2, 'x': {'tiefling': -0.035, 'dragonborn': -0.11, 'elf': 0.0}}
YENI = {'tiefling-kadin-cleric-ID9': 'tiefling-kadin-cleric-ID9-yeni.jpg'}   # yeni çizim kaynağı (assets-ham/karakter/)

def small_ring(clean, ring, race):
    ht, cx, _, body = head(clean); sw = skull_width(body, ht, cx)
    rw = max(8, round(sw * ORNEK['en'])); rh = max(5, round(rw * ORNEK['boy_en']))
    rimg = Image.fromarray(ring, 'RGBA').convert('RGBa').resize((rw, rh), Image.LANCZOS).convert('RGBA')
    ra_ = np.array(rimg); ra_[..., 3] = np.clip(ra_[..., 3].astype(int) * 2, 0, 255).astype(np.uint8)   # küçültmede incelen boncuklar örnekteki gibi tam parlaklıkta
    rimg = Image.fromarray(ra_, 'RGBA')
    xm = round(cx + ORNEK['x'].get(race, 0.0) * sw - rw / 2); y0 = ht + ORNEK['alt'] - rh
    ra = np.array(rimg)[..., 3] > 40; ys_, xs_ = np.where(ra); horn = forbidden_of(clean, 'boynuz')
    def mask_at(x0):
        mk = np.zeros((256, 256), bool); yy, xx = ys_ + y0, xs_ + x0; ok = (yy >= 0) & (yy < 256) & (xx >= 0) & (xx < 256); mk[yy[ok], xx[ok]] = True; return mk
    # boynuzlar halkanın iki yanında kalsın: ölçülen merkezin ±12 px içinde boynuz kesişimi en az olan yatay konum (eşitlikte ölçülene en yakın)
    x0 = min(range(xm - 12, xm + 13), key=lambda x: (int((mask_at(x) & horn).sum()), abs(x - xm)))
    out = compose(clean, rimg, x0, y0); rmask = mask_at(x0)
    vis = rmask & ~(clean[..., 3] > 127)                # görünen halka pikselleri (başın önünde kalmayan)
    info = {'kip': 'ornek', 'figur_olcek': 1.0, 'bas_tepe': int(ht), 'kafatasi_en': int(sw), 'halka_kutu': [x0, y0, x0 + rw, y0 + rh], 'yatay_kayma_px': int(x0 - xm),
            'boynuz_kesisim_px': int((rmask & horn).sum()), 'kirpik': bool(y0 < 0 or x0 < 0 or x0 + rw > 256),
            'gorunur_oran': round(float(vis.sum()) / max(1, int(rmask.sum())), 3)}
    return out, info, rmask

def new_token(name):
    """Yeni çizim: yeşil anahtar (açık yeşil buhar ten/zemin değil, kalır), figür + buhar; ölçek = aynı ırk/cinsiyet Cleric ID1–ID8 ortanca boyu,
    ayak tuvalin 247. satırında (diğer ID9'larla aynı)."""
    import importlib.util as iu
    sp = iu.spec_from_file_location('cc', 'scripts/cc-kesim.py'); cc = iu.module_from_spec(sp); sp.loader.exec_module(cc)
    a = np.asarray(Image.open(f'assets-ham/karakter/{YENI[name]}').convert('RGB')); fg = cc.key_page(a)
    lab, n = ndi.label(fg, structure=np.ones((3, 3))); sz = ndi.sum(fg, lab, range(1, n + 1)); H, W = fg.shape; objs = ndi.find_objects(lab)
    keep = [i for i in range(1, n + 1) if sz[i - 1] >= 30 and not (objs[i - 1][0].start <= 1 or objs[i - 1][1].start <= 1 or objs[i - 1][0].stop >= H - 1 or objs[i - 1][1].stop >= W - 1)]
    m = np.isin(lab, keep); ys, xs = np.where(m)
    cell = cc.keyed_rgba(a[ys.min():ys.max() + 1, xs.min():xs.max() + 1], m[ys.min():ys.max() + 1, xs.min():xs.max() + 1])
    race, g = name.split('-')[0], name.split('-')[1]
    hs = []
    for i in range(1, 9):
        t = np.array(Image.open(f'{D}/{race}-{g}-cleric-ID{i}.webp').convert('RGBA'))[..., 3] > 127; yy, _ = np.where(t); hs.append(yy.max() - yy.min() + 1)
    tok, sc = cc.place_token(cell, float(np.median(hs)))
    return tok, {'kaynak': YENI[name], 'hedef_boy': float(np.median(hs)), 'olcek': sc, 'yesil_px_kalan': int(((tok[..., 1].astype(int) - np.maximum(tok[..., 0], tok[..., 2]).astype(int) > 120) & (tok[..., 3] > 0)).sum())}

def main():
    os.makedirs(f'{OUT}/aday', exist_ok=True)
    ref = np.array(Image.open(f'{D}/human-erkek-cleric-ID9.webp').convert('RGBA'))
    rl, rc, rm = split_ring(ref); rht, rcx, _, rbody = head(rc); rhw = skull_width(rbody, rht, rcx)
    al_ = rl[..., 3] > 0; lab_, k_ = ndi.label(al_, structure=np.ones((3, 3))); sz_ = ndi.sum(al_, lab_, range(1, k_ + 1))
    big_ = lab_ == 1 + int(np.argmax(sz_)); rl[~ndi.binary_dilation(big_, iterations=3)] = 0       # referans: yalnız halka yayı (kopuk kırıntı yok)
    ys, xs = np.where(rl[..., 3] > 0); rb = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    ring = rl[rb[1]:rb[3], rb[0]:rb[2]]
    rep = {'referans': {'bas_tepe': int(rht), 'bas_merkez': rcx, 'bas_en': int(rhw), 'halka_kutu': [int(x) for x in rb]}, 'jetonlar': {}}
    pairs = []
    for race in RACES:
        for g in ('erkek', 'kadin'):
            n = f'{race}-{g}-cleric-ID9'
            if n in HARIC: rep['haric'] = {**rep.get('haric', {}), n: HARIC[n]}; continue
            a = np.array(Image.open(f'{D}/{n}.webp').convert('RGBA'))
            yeni = None
            if n in YENI: tokn, yeni = new_token(n); clean, m = tokn, np.zeros(tokn.shape[:2], bool)   # yeni çizimde halka yok (sarı gözler silinmesin)
            else: _, clean, m = split_ring(a)
            if race in BOYNUZLU or n in TAM:
                out, info, rmask = small_ring(clean, ring, race)
                if n in TAM and (info['kirpik'] or info['gorunur_oran'] < 0.98):   # saç üstüne sığmadı: 2. turun 0,86 ölçekli önizlemesi kalır
                    out, info2 = place(clean, ring, rb, rht, rcx, rhw, 'tam'); info = {**info2, 'kip': 'tam (geri dönüş)', 'kucuk_halka_denemesi': info}
            else:
                out, info = place(clean, ring, rb, rht, rcx, rhw, 'normal'); info['kip'] = 'normal'
            info['silinen_px'] = int(m.sum())
            if yeni: info['yeni_cizim'] = yeni
            pm = f'{D}/maske-pul/{n}.png'
            if race == 'dragonborn' and os.path.exists(pm):
                mk = np.array(Image.open(pm).convert('L')) > 127; info['pul_maske_kesisim_px'] = int((mk & m).sum())
                info['halka_pul_maske_kesisim_px'] = int((mk & (np.abs(out.astype(int) - a.astype(int)).max(-1) > 0)).sum()) if info.get('figur_olcek', 1) == 1 else 'figür küçüldü'
            rep['jetonlar'][n] = info
            Image.fromarray(out, 'RGBA').save(f'{OUT}/aday/{n}.png')
            pairs.append((n, a, out))
    for n in HARIC:
        if os.path.exists(f'{OUT}/aday/{n}.png'): os.remove(f'{OUT}/aday/{n}.png')
    S = 3 * 256; cols = 3
    im = Image.new('RGB', (cols * (2 * S + 24), ((len(pairs) + cols - 1) // cols) * (S + 30)), (52, 54, 60)); d = ImageDraw.Draw(im)
    for i, (n, a, b) in enumerate(pairs):
        x, y = (i % cols) * (2 * S + 24), (i // cols) * (S + 30)
        for j, t in enumerate((a, b)):
            p = Image.fromarray(t, 'RGBA').resize((S, S), Image.NEAREST); im.paste(p, (x + j * S, y + 26), p)
        d.text((x + 4, y + 6), f'{n}   once | sonra', fill=(255, 255, 255))
    im.save(f'{OUT}/once-sonra-3x.png')
    for n, a, b in pairs:                              # boynuzlu ırklar ve elf kadın: 4× yakın (baş bölgesi)
        if not (n.split('-')[0] in BOYNUZLU or n in TAM or n in YENI): continue
        c = Image.new('RGBA', (2 * 640 + 24, 520 + 26), (52, 54, 60, 255)); d2 = ImageDraw.Draw(c)
        for j, t in enumerate((a, b)):
            c.alpha_composite(Image.fromarray(t, 'RGBA').crop((48, 0, 208, 130)).resize((640, 520), Image.NEAREST), (j * 664, 26))
        d2.text((6, 6), f'{n}   once | sonra (4x, bas bolgesi)', fill=(255, 255, 255)); c.convert('RGB').save(f'{OUT}/yakin-4x-{n}.png')
    json.dump(rep, open(f'{OUT}/rapor.json', 'w'), ensure_ascii=False, indent=1)
    print(json.dumps(rep['referans'])); [print(k, v) for k, v in rep['jetonlar'].items()]

if __name__ == '__main__': main()
