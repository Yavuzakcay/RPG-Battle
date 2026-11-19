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
            a = np.array(Image.open(f'{D}/{n}.webp').convert('RGBA'))
            _, clean, m = split_ring(a)
            ht, cx, _, body = head(clean); hw = skull_width(body, ht, cx)
            sc_raw = hw / rhw; sc = float(np.clip(sc_raw, *OLCEK))
            rw, rh = max(1, round(ring.shape[1] * sc)), max(1, round(ring.shape[0] * sc))
            rimg = Image.fromarray(ring, 'RGBA').resize((rw, rh), Image.NEAREST)
            x0 = round(cx + ((rb[0] + rb[2]) / 2 - rcx) * sc - rw / 2); y0 = round(ht + (rb[1] - rht) * sc)
            kayma = max(0, 1 - y0); y0 += kayma   # tuvalin üstüne taşarsa halka aşağı kayar (başın arkasında kalır)
            can = Image.new('RGBA', (256, 256), (0, 0, 0, 0)); can.paste(rimg, (x0, y0), rimg)
            can.alpha_composite(Image.fromarray(clean, 'RGBA'))
            out = np.array(can)
            info = {'silinen_px': int(m.sum()), 'bas_tepe': int(ht), 'bas_en': int(hw), 'olcek_ham': round(sc_raw, 3), 'olcek': round(sc, 3), 'halka_kutu': [x0, y0, x0 + rw, y0 + rh],
                    'asagi_kayma_px': int(kayma), 'kirpik': bool(y0 < 0 or x0 < 0 or x0 + rw > 256)}
            pm = f'{D}/../characters/maske-pul/{n}.png'
            if race == 'dragonborn' and os.path.exists(pm):
                mk = np.array(Image.open(pm).convert('L')) > 127; info['pul_maske_kesisim_px'] = int((mk & m).sum())
            rep['jetonlar'][n] = info
            Image.fromarray(out, 'RGBA').save(f'{OUT}/aday/{n}.png')
            pairs.append((n, a, out))
    S = 3 * 256; cols = 3
    im = Image.new('RGB', (cols * (2 * S + 24), 6 * (S + 30)), (52, 54, 60)); d = ImageDraw.Draw(im)
    for i, (n, a, b) in enumerate(pairs):
        x, y = (i % cols) * (2 * S + 24), (i // cols) * (S + 30)
        for j, t in enumerate((a, b)):
            p = Image.fromarray(t, 'RGBA').resize((S, S), Image.NEAREST); im.paste(p, (x + j * S, y + 26), p)
        d.text((x + 4, y + 6), f'{n}   once | sonra', fill=(255, 255, 255))
    im.save(f'{OUT}/once-sonra-3x.png')
    json.dump(rep, open(f'{OUT}/rapor.json', 'w'), ensure_ascii=False, indent=1)
    print(json.dumps(rep['referans'])); [print(k, v) for k, v in rep['jetonlar'].items()]

if __name__ == '__main__': main()
