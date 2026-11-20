"""Tiefling beyaz benek teşhisi ve v2 maske yöntemiyle yeniden boyama (yalnız ölçüm/önizleme: docs/sabah/tiefling-beyaz-piksel/).
Önce: `npx vite-node scripts/tiefling-beyaz-oyun.ts <oyun-klasörü>` (oyundaki boyamanın birebir kopyası). Sonra:
`python scripts/tiefling-beyaz.py <oyun-klasörü>`
Beyaz benek: ten bölgesinde (oyun maskesi 2 kez kapanmış + kapalı delikler doldurulmuş) kalan, boyamanın değiştirmediği, açık
(L* > beyazL) ve ten tonunda ya da renksiz (kroma < beyazC) piksellerden oluşan, en çok `benek` px'lik ve çevresinin en az `halka` payı ten olan parça (diş, göz ışığı, kaş gibi koyu/renkli komşulu ayrıntılar sayılmaz);
daha büyük açık alanlar (göz akı, diş, beyaz boya/yara izi) ayrı sayılır ve boyanmaz (yeni maskede delik doldurma da `delik` px ile sınırlı).
Yeni yöntem: ten tonu jetonun kendi başından (oyun maskesinin baş kısmı) örneklenir; tona yakın + parlama adayları, 3×3 kapama,
küçük bileşen atma, kapalı delik doldurma (scripts/dragonborn-desen-v2.py ile aynı çekirdek); renk oyunun lch formülüyle
(src/ui/tint.ts maskedPixels: hedef ton/kroma, hueKeep, chromaKeep, dL, gain), yalnız maske farklı."""
import importlib.util, json, math, os, sys
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHAR = os.path.join(ROOT, 'public/characters')
OUT = os.path.join(ROOT, 'docs/sabah/tiefling-beyaz-piksel')
_s = importlib.util.spec_from_file_location('v2', os.path.join(ROOT, 'scripts', 'dragonborn-desen-v2.py')); v2 = importlib.util.module_from_spec(_s); _s.loader.exec_module(v2)
lab, comps, dil, ero, fill_holes = v2.lab, v2.comps, v2.dil, v2.ero, v2.fill_holes
SOYLAR = ['abyssal', 'chthonic', 'winged']
P = {'beyazL': 65, 'beyazC': 12, 'tonFark': 28, 'cAlt': 0.25, 'cUst': 2.6, 'parlamaL': 78, 'parlamaC': 14, 'konturL': 25, 'minBilesen': 30, 'delik': 12, 'benek': 12, 'halka': 0.75}

def hue(L): return (np.degrees(np.arctan2(L[..., 2], L[..., 1])) + 360) % 360

def region(gm):
    r = gm
    for _ in range(2): r = dil(r)
    for _ in range(2): r = ero(r)
    return fill_holes(r | gm)

def white_specks(orig, out, R, L, h0, skin_any, big=False):
    """Benek: boyamanın değiştirmediği açık piksellerden oluşan, en çok BENEK px'lik ve çevresinin en az yarısı ten (oyun ya da yeni
    maske) olan parça (eşik `halka`). big=True: daha büyük açık alanlar (göz akı, diş, beyaz boya/yara izi; bilgi için, hedef dışı)."""
    op = orig[..., 3] >= 10; same = np.all(orig[..., :3] == out[..., :3], -1)
    C = np.hypot(L[..., 1], L[..., 2]); dh = np.abs((hue(L) - h0 + 180) % 360 - 180)
    eye = (L[..., 2] > 25) & (C > 35)
    w = R & op & same & (L[..., 0] > P['beyazL']) & ((C < P['beyazC']) | (dh < 35)) & ~eye
    o = np.zeros_like(w)
    for c in comps(w):
        cm = np.zeros_like(w); cm[c[:, 0], c[:, 1]] = True; ring = dil(cm) & ~cm
        small = len(c) <= P['benek'] and (skin_any & ring).sum() >= P['halka'] * max(ring.sum(), 1)
        if small != big: o |= cm
    return o

def new_mask(rgba, gm, L):
    op = rgba[..., 3] >= 10; ys, xs = np.nonzero(op); y0, y1 = ys.min(), ys.max()
    head = np.zeros_like(op); head[y0:y0 + int((y1 - y0) * 0.35)] = True
    s = gm & head & (L[..., 0] > 35)
    if s.sum() < 40: s = gm & (L[..., 0] > 35)
    if s.sum() < 40: return None, None
    a, b = L[..., 1][s].mean(), L[..., 2][s].mean(); h0 = math.degrees(math.atan2(b, a)) % 360
    C = np.hypot(L[..., 1], L[..., 2]); c0 = float(np.median(C[s]))
    dh = np.abs((hue(L) - h0 + 180) % 360 - 180)
    skin = op & (L[..., 0] > P['konturL']) & (dh <= P['tonFark']) & (C >= c0 * P['cAlt']) & (C <= c0 * P['cUst'] + 3)
    glow = op & (L[..., 0] > P['parlamaL']) & ((C < P['parlamaC']) | (dh <= P['tonFark']))
    cand = ero(dil(skin | glow)) & op
    keep = np.zeros_like(cand)
    for c in comps(cand):
        cs = np.zeros_like(cand); cs[c[:, 0], c[:, 1]] = True
        # bileşen gerçek tene (oyun maskesi ya da ton adayı) dayanmalı; yalnız parlama ise atılır
        if len(c) >= P['minBilesen'] and (skin & cs).sum() >= 0.3 * len(c): keep |= cs
    hole = fill_holes(keep) & ~keep
    for c in comps(hole):
        if len(c) <= P['delik']: keep[c[:, 0], c[:, 1]] = True
    eye = (L[..., 2] > 25) & (C > 35)
    m = (keep | gm) & op & ~eye & (L[..., 0] > P['konturL'])        # oyun maskesi bilinen tendir: yeni maske onu da kapsar
    return m, h0

def lch_tint(rgba, m, spec, L):
    """src/ui/tint.ts maskedPixels lch yolunun numpy kopyası."""
    h, c = spec['h'], spec['c']; hk, ck = spec.get('hueKeep', 0.3), spec.get('chromaKeep', 0.5)
    gain, dL, con, tL = spec.get('gain', 1), spec.get('dL', 0), spec.get('contrast', 1), spec.get('L')
    l = L[m]; C = np.hypot(l[:, 1], l[:, 2])
    mh = math.degrees(math.atan2(l[:, 2].sum(), l[:, 1].sum())); mc = C.mean(); ml = l[:, 0].mean()
    dh = (np.degrees(np.arctan2(l[:, 2], l[:, 1])) - mh + 540) % 360 - 180
    nh = np.radians(h + dh * hk); nc = np.maximum(0, c + (C - mc) * ck)
    nl = np.clip(tL + (l[:, 0] - ml) * con, 0, 100) if tL is not None else np.clip((ml + (l[:, 0] - ml) * con) * gain + dL, 0, 100)
    rgb, _ = v2._lab2rgb(nl, nc * np.cos(nh), nc * np.sin(nh))
    o = rgba.copy(); o[..., :3][m] = np.clip(np.round(rgb), 0, 255).astype(np.uint8); return o

def on_bg(a): return v2.on_bg(a)

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    game_dir = sys.argv[1]; os.makedirs(os.path.join(OUT, 'ornek'), exist_ok=True)
    spec = json.load(open(os.path.join(ROOT, 'data/soy-renkleri.json'), encoding='utf-8'))['races']['tiefling']['lineages']
    names = sorted(f[:-4] for f in os.listdir(os.path.join(game_dir, SOYLAR[0])))
    rows = {}
    for n in names:
        mf = os.path.join(CHAR, 'maske', n + '.png')
        if not os.path.exists(mf): rows[n] = {'maske': False}; continue
        orig = np.array(Image.open(os.path.join(CHAR, n + '.webp')).convert('RGBA')); L = lab(orig[..., :3].astype(float))
        gm = (np.array(Image.open(mf).convert('L').resize(orig.shape[1::-1], Image.NEAREST)) > 127) & (orig[..., 3] >= 10)
        R = region(gm); nm, h0 = new_mask(orig, gm, L)
        if nm is None: rows[n] = {'maske': True, 'ornekYok': True}; continue
        r = {'maske': True, 'tonH': round(h0, 1), 'oyunMaske': int(gm.sum()), 'yeniMaske': int(nm.sum()), 'oyun': {}, 'yeni': {}}
        for soy in SOYLAR:
            game = np.array(Image.open(os.path.join(game_dir, soy, n + '.png')).convert('RGBA'))
            sk = gm | nm; new = lch_tint(orig, nm, spec[soy]['lch'], L)
            r['oyun'][soy] = int(white_specks(orig, game, R, L, h0, sk).sum())
            r['yeni'][soy] = int(white_specks(orig, new, R, L, h0, sk).sum())
            r.setdefault('buyukAcik', {})[soy] = {'oyun': int(white_specks(orig, game, R, L, h0, sk, True).sum()), 'yeni': int(white_specks(orig, new, R, L, h0, sk, True).sum())}
        rows[n] = r
    ok = {n: r for n, r in rows.items() if 'oyun' in r}
    tot = {k: {s: sum(r[k][s] for r in ok.values()) for s in SOYLAR} for k in ('oyun', 'yeni')}
    withw = {k: {s: sum(1 for r in ok.values() if r[k][s] > 0) for s in SOYLAR} for k in ('oyun', 'yeni')}
    # 6 örnek: oyunda en çok beneği olan, farklı sınıflardan
    srt = sorted(ok, key=lambda n: -ok[n]['oyun']['abyssal']); ex, seen = [], set()
    for n in srt:
        cls = n.split('-')[2]
        if cls not in seen: ex.append(n); seen.add(cls)
        if len(ex) == 6: break
    for n in ex:
        orig = np.array(Image.open(os.path.join(CHAR, n + '.webp')).convert('RGBA')); L = lab(orig[..., :3].astype(float))
        gm = (np.array(Image.open(os.path.join(CHAR, 'maske', n + '.png')).convert('L').resize(orig.shape[1::-1], Image.NEAREST)) > 127) & (orig[..., 3] >= 10)
        R = region(gm); nm, h0 = new_mask(orig, gm, L)
        Z = 2; pg = Image.new('RGB', (5 * 256 * Z // 2 + 40, 3 * (256 + 22) + 30), (44, 48, 58)); dr = ImageDraw.Draw(pg)
        for c, hd in enumerate(['orijinal', 'oyun', 'oyun: beyaz benek (kırmızı)', 'yeni', 'yeni: beyaz benek']): dr.text((c * (256 + 8) + 4, 6), hd, fill=(230, 232, 238), font=v2.v1.FONT)
        for r_, soy in enumerate(SOYLAR):
            game = np.array(Image.open(os.path.join(game_dir, soy, n + '.png')).convert('RGBA')); new = lch_tint(orig, nm, spec[soy]['lch'], L)
            wg = white_specks(orig, game, R, L, h0, gm | nm); wn = white_specks(orig, new, R, L, h0, gm | nm)
            def mark(a, w):
                im = np.array(on_bg(a)); im[w] = [255, 30, 30]; return Image.fromarray(im)
            y = 26 + r_ * (256 + 22)
            for c, im in enumerate([on_bg(orig), on_bg(game), mark(game, wg), on_bg(new), mark(new, wn)]): pg.paste(im, (c * (256 + 8), y))
            dr.text((4, y + 258), f'{soy}: oyun {int(wg.sum())} beyaz piksel, yeni {int(wn.sum())}', fill=(230, 232, 238), font=v2.v1.FONT)
        pg.save(os.path.join(OUT, 'ornek', n[9:] + '.png'))
    json.dump({'not': 'scripts/tiefling-beyaz.py: Tiefling jetonu başına beyaz benek sayısı (oyundaki boyama ve v2 maskeli yeni boyama).',
               'parametre': P, 'toplam': tot, 'beneklijeton': withw, 'ornekler': ex, 'jetonlar': rows},
              open(os.path.join(OUT, 'teshis.json'), 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)
    print(json.dumps({'jeton': len(ok), 'toplam': tot, 'beneklijeton': withw, 'ornekler': ex}, ensure_ascii=False))
