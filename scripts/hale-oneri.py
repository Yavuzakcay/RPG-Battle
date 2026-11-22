#!/usr/bin/env python3
"""KQ6-13 (yalnız ÖNERİ, hiçbir jeton yazılmaz): ELLE 'karar bekliyor' jetonları şekle göre sınıflandırır.
 (a) hale var (halka şekilli, parlak, ince, baş kütlesinden ayrık) → halesiz varyant önerisi (güvenli silme varsa)
 (b) hale yok (taç/şapka/kapüşon/çıplak baş fark etmez) → kardeş jetonların oran ve renginde, en üst pikselin üstüne, yalnız alfa=0 piksellere hale
 (c) belirsiz ya da hale var ama güvenli silme yok → dokunma
Çıktı: docs/sabah/hale-oneri.png, data/hale-elle.json `bekleyen.<ad>.oneri` (+ boş `karar`).
"""
import importlib.util, io, json, os, re, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
spec = importlib.util.spec_from_file_location('hv', 'scripts/hale-v2.py'); hv = importlib.util.module_from_spec(spec); spec.loader.exec_module(hv)
N = 256; D = 'public/characters'; REF = 'bb36b76'
disk, dil = hv.disk, hv.dil

def src(n):
    b = subprocess.run(['git', 'show', f'{REF}:{D}/{n}.webp'], capture_output=True, check=True).stdout
    return np.array(Image.open(io.BytesIO(b)).convert('RGBA'))

def mass_info(a):
    """Ana gövde kütlesi: 3 px açılmış opak maskenin en büyük bağlı bileşeni (ince hançer/tüy/halka ayrılır); üst satırı = şapka/taç/saçın en üst pikseli."""
    solid = a[..., 3] > 100
    thick = ndi.binary_opening(solid, structure=disk(3))
    lab, k = ndi.label(thick, structure=np.ones((3, 3)))
    big = np.zeros_like(solid)
    if k:
        sizes = ndi.sum(thick, lab, range(1, k + 1)); big = lab == (1 + int(np.argmax(sizes)))
    ys = np.where(big.any(axis=1))[0]; top_px = int(ys[0]) if len(ys) else 0
    # Kalın halka kütleye karışabilir: baş/şapka/taç üst kenarı = koyu konturun ilk satırı (halede koyu kontur yoktur)
    dark = (a[..., 3] > 200) & (a[..., :3].max(axis=2) < 90) & big
    td = next((y for y in range(top_px, N) if int(dark[y].sum()) >= 4), None)
    nodark = td is None
    top_px = td if td is not None else top_px
    merged = big & (np.arange(N)[:, None] < top_px - 1)                     # koyu konturun üstünde kalan kütle: halka kütleye karışmış
    big = big & (np.arange(N)[:, None] >= top_px - 1)
    xs = np.where(big[top_px:top_px + 12].any(axis=0))[0]
    cx = int(round(xs.mean())) if len(xs) else 128
    return {'thick': thick, 'big': big, 'top_px': top_px, 'cx': cx, 'merged': merged, 'nodark': nodark}

def rings(a):
    """Baş kütlesinin üstündeki pencerede (üst kenardan 34 px yukarı, 4 px aşağı; ±60 px yatay) kütle dışı opak piksel = kanıt.
    Halka: yatay uzun (en/boy ≥ 1,6), ince (kalınlık ≤ 7 px), kısa (≤ 26 px) bileşen; renk fark etmez (koyu, soluk, parlak). Taç/şapka/kapüşon kütledir, hale sayılmaz."""
    mi = mass_info(a); top, cx = mi['top_px'], mi['cx']
    W = np.zeros(a.shape[:2], bool); W[max(0, top - 34):top + 5, max(0, cx - 60):cx + 61] = True
    E = (a[..., 3] > 40) & W & ~dil(mi['big'], 1)
    mg = int(mi['merged'].sum())
    out = {'sinif': 'yok', 'mask': np.zeros(a.shape[:2], bool), 'mi': mi, 'frac': 0.0, 'renk': None, 'rx': 0, 'ry': 0, 'touch': False, 'n': int(E.sum())}
    if mi['nodark']: out['sinif'] = 'belirsiz'; out['neden'] = 'koyu kontur yok: hale kütleye karışmış olabilir'; return out
    if E.sum() < 12 and mg < 25: return out
    lab, k = ndi.label(dil(E, 1)); comps = []
    for i, sl in enumerate(ndi.find_objects(lab), 1):
        m = E & (lab == i); n = int(m.sum())
        if n < 10: continue
        w = sl[1].stop - sl[1].start; h = sl[0].stop - sl[0].start
        dt = ndi.distance_transform_edt(np.pad(m, 1))
        comps.append({'m': m, 'n': n, 'w': w, 'h': h, 'sl': sl, 'dt': float(dt.max())})
    good = [c for c in comps if c['w'] >= 18 and c['h'] <= 26 and c['w'] / max(c['h'], 1) >= 1.6 and c['dt'] <= 4.0]
    if not good:
        yatay = [c for c in comps if not (c['h'] >= 14 and c['h'] >= 1.8 * c['w'])]   # çok dikey ince parça (kılıç, asa, tüy sapı) halka sayılmaz
        if sum(c['n'] for c in yatay) < 30: yatay = []
        if yatay or mg >= 25: out['sinif'] = 'belirsiz'; out['mask'] = E | mi['merged']
        return out
    base = max(good, key=lambda c: c['n']); sl = base['sl']
    reg = np.zeros(a.shape[:2], bool); reg[max(0, sl[0].start - 10):sl[0].stop + 11, max(0, sl[1].start - 26):sl[1].stop + 27] = True
    m = E & reg
    yy, xx = np.where(m); x0, x1, y0, y1 = xx.min(), xx.max(), yy.min(), yy.max()
    rx, ry = (x1 - x0) / 2, max((y1 - y0) / 2, 1); cxe, cye = (x0 + x1) / 2, (y0 + y1) / 2
    dd = dil(m, 2)
    hits = sum(int(dd[min(255, max(0, int(round(cye + ry * np.sin(np.radians(t)))))), min(255, max(0, int(round(cxe + rx * np.cos(np.radians(t))))))]) for t in range(0, 360, 5))
    touch = bool(y0 <= 0 or x0 <= 0 or x1 >= 255)
    col = np.median(a[m][:, :3].astype(float), axis=0)
    out.update(sinif='var', mask=m, frac=hits / 72, touch=touch, renk=col, rx=rx, ry=ry, bottom=int(y1), bbox=(int(x0), int(y0), int(x1) + 1, int(y1) + 1))
    return out

def safe_erase(a, r):
    """Halka maskesini sil; baş kutusu (kütle üst satırından 56 satır) alfa>0 değişirse None."""
    mi = r['mi']; thick = mi['thick']
    rows = np.where(thick.any(axis=1))[0]
    if not len(rows): return None, 'baş kütlesi bulunamadı'
    top = next((y for y in range(N) if hv.ht.runs(thick[y]) >= 18), int(rows[0]))
    cols = np.where(thick[top:top + 56].any(axis=0))[0]; box = (int(cols.min()), top, int(cols.max()) + 1, min(N, top + 56))
    prot = dil(thick, 2); mx = a[..., :3].max(axis=2) / 255.0
    rm = dil(r['mask'], 2) & (a[..., 3] > 0) & ~prot & ((mx > 0.45) | (a[..., 3] < 180))
    b = a.copy(); b[rm, 3] = 0
    x0, y0, x1, y1 = box
    once = int((a[y0:y1, x0:x1, 3] > 0).sum()); sonra = int((b[y0:y1, x0:x1, 3] > 0).sum())
    kalan = int((dil(r['mask'], 2) & (a[..., 3] >= 24) & ~rm).sum())
    if once != sonra: return None, f'baş kutusunda {once - sonra} px değişir'
    if kalan > 40: return None, f'{kalan} px halka kalıntısı başa değiyor'
    return b, f'{int(rm.sum())} px silinir, kalıntı {kalan}'

def draw_halo(a, mi, p):
    """p: rx, ry, renk, kalinlik. Yalnız alfa=0 piksellere; en üst pikselin hemen üstünde, başa ortalı."""
    from PIL import ImageFilter
    rx, ry = int(round(p['rx'])), max(3, int(round(p['ry'])))
    cy = mi['top_px'] - 1 - ry
    cy = max(ry + 1, cy); cx = mi['cx']
    c = np.array(p['renk'], float)
    dark = tuple(int(v) for v in np.clip(c * 0.82, 0, 255)) + (255,); mid = tuple(int(v) for v in c) + (255,); light = tuple(int(v) for v in np.clip(c + (255 - c) * 0.55, 0, 255)) + (255,)
    L = Image.new('RGBA', (N, N), (0, 0, 0, 0)); dr = ImageDraw.Draw(L)
    for w, col in ((3, dark), (2, mid), (1, light)):
        dr.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), outline=col, width=w)
    h = np.array(L); free = a[..., 3] == 0; o = a.copy(); o[free] = h[free]
    return o, (cx, cy, rx, ry)

def main():
    elle = json.load(open('data/hale-elle.json')); bek = elle['bekleyen']
    names = sorted(f[:-5] for f in os.listdir(D) if f.startswith('celestial-') and f.endswith('.webp'))
    info = {n: rings(src(n)) for n in names}
    # kardeş parametreleri: kapalı halkası (frac ≥ .6) olan jetonlar
    par = {}
    for n in names:                      # kardeş parametreleri: halesiz varyantı üretilmiş jetonlarda silinen halka pikselleri (asıl - halesiz) = gerçek hale
        hp = f'{D}/halesiz/{n}.webp'
        if not os.path.exists(hp): continue
        o = src(n); h = np.array(Image.open(hp).convert('RGBA')); rm = (o[..., 3] > 0) & (h[..., 3] == 0)
        if rm.sum() < 60: continue
        core = rm & (o[..., 3] > 150)
        if core.sum() < 20: continue
        yy, xx = np.where(core)
        rx, ry = (xx.max() - xx.min()) / 2, (yy.max() - yy.min()) / 2
        if not (16 <= rx <= 32 and 3 <= ry <= 10): continue
        par[n] = {'rx': float(rx), 'ry': float(ry), 'renk': [float(x) for x in np.median(o[core][:, :3].astype(float), axis=0)]}
    def cls_of(n):
        m = re.match(r'celestial-(erkek|kadin)-([a-z]+)-(.+)$', n); return (m.group(2), m.group(3)) if m else (None, None)
    def params_for(n):
        c, code = cls_of(n)
        sib = [m for m in par if cls_of(m) == (c, code) and m != n]
        if sib and 16 <= par[sib[0]]['rx'] <= 32 and 3 <= par[sib[0]]['ry'] <= 10: return par[sib[0]], f'kardeş: {sib[0][10:]}'
        same = [par[m] for m in par if cls_of(m)[0] == c]
        pool, tag = (same, f'{c} sınıfı ortalaması ({len(same)} jeton)') if len(same) >= 3 else ([par[m] for m in par], f'genel ortalama ({len(par)} jeton)')
        return {'rx': float(np.median([p['rx'] for p in pool])), 'ry': float(np.median([p['ry'] for p in pool])), 'renk': list(np.median([p['renk'] for p in pool], axis=0))}, tag
    todo = [n for n, v in sorted(bek.items()) if v['durum'] == 'karar bekliyor']
    res = {}
    cw, chh, Z = 200, 90, 2
    cols = 2; rows = (len(todo) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * (cw * Z * 2 + 10), rows * (chh * Z + 30)), (96, 100, 112)); sd = ImageDraw.Draw(sheet)
    for i, n in enumerate(todo):
        a = src(n); r = info[n]; new = a; karar = 'c'; nota = ''
        if r['sinif'] == 'var':
            b, why = safe_erase(a, r)
            if b is not None: karar, new, nota = 'a', b, f'hale var ({"kesik" if r["frac"] < 0.6 or r.get("touch") else "kapalı, başa yakın"}, kapsama {r["frac"]:.2f}); halesiz varyant: {why}'
            else: karar, nota = 'c', f'hale var ama güvenli silme yok ({why})'
        elif r['sinif'] == 'yok':
            p, tag = params_for(n); new, g = draw_halo(a, r['mi'], p); karar = 'b'
            nota = f'hale yok; {tag}: rx {p["rx"]:.0f}, ry {p["ry"]:.0f}, renk #{int(p["renk"][0]):02x}{int(p["renk"][1]):02x}{int(p["renk"][2]):02x}; en üst piksel y={r["mi"]["top_px"]}'
        else: nota = r.get('neden') or 'şekil belirsiz (halka benzeri parça var ama halka değil)'
        res[n] = {'oneri': karar, 'oneriNot': nota}
        ox = (i % cols) * (cw * Z * 2 + 10); oy = (i // cols) * (chh * Z + 30)
        for k, arr in enumerate((a, new)):
            v = Image.fromarray(arr).crop((28, 0, 228, chh)).resize((cw * Z, chh * Z), Image.NEAREST); sheet.paste(v, (ox + k * cw * Z, oy + 14), v)
        sd.text((ox + 2, oy + 1), f'{n[10:]}  ONCE | ONERI: {karar.upper()}', fill=(255, 255, 255))
        sd.text((ox + 2, oy + 14 + chh * Z + 1), (f'{n[10:]} -> ({karar}) ' + nota)[:150].encode('ascii', 'replace').decode(), fill=(255, 220, 140))
    sheet.save('docs/sabah/hale-oneri.png')
    for n, v in res.items(): bek[n]['oneri'] = v['oneri']; bek[n]['oneriNot'] = v['oneriNot']; bek[n]['karar'] = ''
    json.dump(elle, open('data/hale-elle.json', 'w'), ensure_ascii=False, indent=1)
    from collections import Counter
    print(len(todo), Counter(v['oneri'] for v in res.values()), sheet.size)
    for n, v in res.items(): print(v['oneri'], n[10:], '-', v['oneriNot'][:100])

if __name__ == '__main__': main()
