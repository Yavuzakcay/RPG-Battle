"""
MASKE-DUZELT: seçili jetonların otomatik ten maskesini (public/characters/maske/<ad>.png) yeni kesime ve yüzün ham ten rengine göre yeniden
üretir. Yalnız `data/maske-duzelt.json` `jetonlar` listesindekiler yazılır; elle maske (assets/soy-maske-el/ → maske-el/) olan, bilerek
maskesiz (Human ID3 Paladin, SC-5, WL-10) ve Dragonborn jetonlarına dokunulmaz.

Yöntem (jeton başına, 256 px ham jeton):
  1. Yüz tohumu: ırkın gevşek ten aralığındaki (Lab: açıklık, kroma, ton) adaylardan baş bandında (bbox'un üst %42'si, ortadaki %80)
     en büyük ve yeterince doygun bileşen; ya da veride `seed` kutusu (256 px koordinat) içindeki adaylar.
  2. Ten referansı: tohum piksellerinin parlak yarısının medyanı (gölge ve kontur karışmasın) + tohumun koyu ucu.
  3. Ten: referansa ΔE ≤ `th` ya da aynı ton ailesinde gölge (ton farkı ≤ `ton`, kroma ≥ refC × `kroma`, açıklık referansın `golge`
     altına dek, `isik` üstüne dek). Kıyafet/şapka/kapüşon (düşük kroma ya da başka ton) dışarıda kalır; belirsiz piksel alınmaz (daraltma).
  4. Temizlik: ≥ `enAz` piksellik bileşenler kalır; bileşenin ortalaması referanstan ΔE > `bilesen` ise atılır (ten tonuna yakın kumaş
     yaması). Veride `exclude` kutuları çıkarılır, `include` kutularındaki ten pikselleri eklenir, `bos: true` bilerek boş maske
     (yüzü olmayan çizim: maske dosyası yazılmaz, eski dosya silinir).
  5. Güvenlik: maske opak alanın %40'ını aşarsa yazılmaz (rapora "aşırı").

Çalıştırma:  python scripts/maske-duzelt.py [--kuru] [--el-de] [ad ...]   (PYTHONUTF8=1; --el-de: elle maskesi olanı da üret)
TEN-MASKE-4-IRK: `irkTum` ırklarının (Orc, Goliath, Dwarf, Gnome) bütün jetonları: --irk <ırk> (ya da argümansız: liste + irkTum);
  --kontak <klasör> --irk <ırk> inceleme sayfaları; --gemini <klasör> [--irk a,b] Gemini sayfaları. Ayarlar harita/belgeler/TEN-MASKE-4-IRK.md.
Çıktı: public/characters/maske/<ad>.png (iki renkli palet PNG, soy-maske.ts ile aynı biçim), data/maske-duzelt.json `sonuc` (piksel sayıları).
"""
import os, sys, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); os.chdir(ROOT)
PUB = 'public/characters'
VERI = 'data/maske-duzelt.json'
VALFLAGS = ('--gemini', '--irk', '--kontak')  # değer alan bayraklar
ARG = [a for i, a in enumerate(sys.argv[1:], 1) if not a.startswith('--') and sys.argv[i - 1] not in VALFLAGS]
FLAG = lambda f: sys.argv[sys.argv.index(f) + 1] if f in sys.argv else None
import glob as _glob
def race_tokens(race):
    """TEN-MASKE-4-IRK: ırkın bütün jetonları (sınıf-genel `<ırk>-<male|female>-<sınıf>` + alt sınıf/Gariban `<ırk>-<erkek|kadin>-…`)."""
    return sorted(os.path.basename(f)[:-5] for f in _glob.glob(f'{PUB}/{race}-*.webp'))
KURU = '--kuru' in sys.argv
OUTDIR = os.environ.get('MASKE_CIKTI', f'{PUB}/maske')

def srgb_to_lab(rgb):
    c = rgb.astype(np.float64) / 255.0
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = c @ M.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)

def hue_in(h, ranges):
    ok = np.zeros(h.shape, bool)
    for a, b in ranges: ok |= ((h >= a) & (h <= b)) if a <= b else ((h >= a) | (h <= b))
    return ok

def box_mask(shape, b):
    m = np.zeros(shape, bool); m[max(0, int(b[1])):int(b[3]) + 1, max(0, int(b[0])):int(b[2]) + 1] = True; return m  # eksi köşe kırpılır (dilim sarmasın)

def make_mask(nm, cfg, race_cfg):
    im = np.asarray(Image.open(f'{PUB}/{nm}.webp').convert('RGBA'))
    H, W = im.shape[:2]
    a = im[..., 3] >= 128
    lab = srgb_to_lab(im[..., :3])
    L, A, B = lab[..., 0], lab[..., 1], lab[..., 2]
    C = np.hypot(A, B); h = (np.degrees(np.arctan2(B, A)) + 360) % 360
    p = {**race_cfg, **cfg}
    cand = a & (L >= p['L'][0]) & (L <= p['L'][1]) & (C >= p['C'][0]) & (C <= p['C'][1]) & hue_in(h, p['h'])
    ys, xs = np.where(a); y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    # `exclude` kutuları tohum seçiminden önce de (maske/kafatası yüz sanılmasın)
    for b in cfg.get('exclude', []): cand &= ~box_mask(a.shape, b)
    if cfg.get('bos'): return np.zeros((H, W), bool), dict(bos=True)
    if 'seed' in cfg:
        seed = cand & box_mask(a.shape, cfg['seed'])
    else:
        band = np.zeros_like(a)
        band[y0:y0 + int((y1 - y0) * p['bas']) + 1, int(x0 + (x1 - x0) * 0.1):int(x1 - (x1 - x0) * 0.1) + 1] = True
        lb, n = ndi.label(cand & band, structure=np.ones((3, 3)))
        best, bs = 0, 0.0
        pri = np.array(p['onceli'])
        for k in range(1, n + 1):
            c = lb == k; s = int(c.sum())
            if s < 12 or np.median(C[c]) < p['tohumKroma']: continue
            # puan: boyut × ırk önceline yakınlık (iyi maskelerin ten medyanı; kumaş/saç/kapüşon uzak)
            sc = s * np.exp(-np.linalg.norm(np.median(lab[c], 0) - pri) / 12.0)
            if sc > bs: best, bs = k, sc
        seed = (lb == best) if best else np.zeros_like(a)
    if seed.sum() < 8: return np.zeros((H, W), bool), dict(tohum=int(seed.sum()))
    sl = lab[seed]
    bright = sl[sl[:, 0] >= np.median(sl[:, 0])]
    ref = np.median(bright, 0)
    refC = float(np.hypot(ref[1], ref[2])); refh = float((np.degrees(np.arctan2(ref[2], ref[1])) + 360) % 360)
    dE = np.linalg.norm(lab - ref, axis=-1)
    dh = np.abs(((h - refh) + 180) % 360 - 180)
    Lband = (L >= ref[0] - p['golge']) & (L <= ref[0] + p['isik'])
    if refC < p.get('griKroma', 0):
        # TEN-MASKE-4-IRK: gri ten (Goliath): ton belirsiz; gölge = ab düzleminde referansa yakın (`abTol`) ve açıklık bandında
        shade = (np.hypot(A - ref[1], B - ref[2]) <= p['abTol']) & Lband
    else:
        shade = (dh <= p['ton']) & (C >= refC * p['kroma']) & Lband
    if 'kromaUst' in p: shade &= C <= max(refC * p['kromaUst'], refC + 6)  # sakal/saç (aynı ton ailesi, daha doygun) dışarıda
    skin = a & ((dE <= p['th']) | shade)
    # kutu sınırları (yalniz/basKutu/exclude); TEN-MASKE-4-IRK: büyüme ve delik doldurmadan sonra da geçerli (`limit`)
    limit = np.ones_like(a)
    if cfg.get('yalniz'):
        keep = np.zeros_like(a)
        for b in cfg['yalniz']: keep |= box_mask(a.shape, b)
        limit &= keep
    if cfg.get('basKutu') is not None:
        # TEN-MASKE-4-IRK: yalnız tohumun (yüz) kutusu + `basKutu` px pay (baş, kulak, boyun); sancak/silah bbox'ı büyütse de baş kalır
        sy, sx = np.where(seed); k = cfg['basKutu']
        limit &= box_mask(a.shape, [sx.min() - k, sy.min() - k, sx.max() + k, sy.max() + k])
    for b in cfg.get('exclude', []): limit &= ~box_mask(a.shape, b)
    skin &= limit
    inc = np.zeros_like(a)
    for b in cfg.get('include', []):
        bm = box_mask(a.shape, b)
        # kutudaki ten adayları + 1 px kapama (aynı tonlu kalkan/kabza arasında benekli kalmasın), yalnız opak ve kontur dışı (L ≥ 18)
        part = ndi.binary_closing(cand & bm, structure=np.ones((3, 3)), iterations=1) & bm & a & (L >= 18)
        inc |= part
    skin &= ~inc
    # bileşen temizliği
    lb, n = ndi.label(skin, structure=np.ones((3, 3)))
    out = np.zeros_like(skin)
    # TEN-MASKE-4-IRK `parlakKenar`: çelik (Goliath silahı/zırhı) parlak beyaz kenarla çizilir: bileşenin bu payından fazlası parlak
    # (L ≥ 82, C < 8) piksele 2 px yakınsa atılır. Yoksa eski davranış.
    shine = ndi.binary_dilation(a & (L >= 82) & (C < 8), iterations=2) if p.get('parlakKenar') else None
    for k in range(1, n + 1):
        c = lb == k
        if c.sum() < p['enAz']: continue
        if np.linalg.norm(lab[c].mean(0) - ref) > p['bilesen']: continue
        if shine is not None and c.sum() >= 40 and not (c & seed).any() and (shine & c).sum() > c.sum() * p['parlakKenar']: continue  # tohum (yüz) bileşeni kalır
        out |= c
    # tek tük pikseller (8 komşudan < 2'si maskede)
    nb = ndi.convolve(out.astype(np.int32), np.ones((3, 3), np.int32), mode='constant') - out
    out &= nb >= 2
    # TEN-MASKE-4-IRK `buyume`: kesin tenden komşuluğa (3×3, N adım) gölge rampası: ırk aday aralığında, referansa ΔE ≤ `buyumeDE`,
    # saç/sakal değil (koyu ve doygun: L < ref − `sacL` iken C ≥ refC × `sacKroma` olanlar dışarıda), kontur değil (L ≥ 28).
    if p.get('buyume'):
        hair = (L < ref[0] - p.get('sacL', 25)) & (C >= refC * p.get('sacKroma', 1.2))
        grow = cand & (L >= 28) & (dE <= p.get('buyumeDE', 40)) & ~hair & (C <= max(refC * p.get('kromaUst', 9), refC + 6))
        for _ in range(p['buyume']):
            nxt = out | (ndi.binary_dilation(out, structure=np.ones((3, 3))) & grow)
            if (nxt == out).all(): break
            out = nxt
    # TEN-MASKE-4-IRK `delik`: maskenin tamamen çevrelediği ≤ N px delikler (gövde gölgesi benekleri) ten adayıysa doldurulur
    # (sakal/saç adayı değil: kroma üst sınırı; çizgi/kontur L < 18 değil). Yoksa eski davranış.
    if p.get('delik'):
        holes = ndi.binary_fill_holes(out) & ~out
        lb, n = ndi.label(holes, structure=np.ones((3, 3)))
        if n:
            sz = ndi.sum(np.ones_like(lb), lb, range(1, n + 1))
            small = np.isin(lb, 1 + np.where(sz <= p['delik'])[0])
            ok = cand & (L >= 18) & (C <= max(refC * p.get('kromaUst', 9), refC + 6))
            out |= small & ok
    if p.get('buyume') or p.get('delik'): out &= limit
    # `include` kutuları (ör. Human eldiven/el: yüzden koyu ama ten yerine boyanacak) temizlikten sonra olduğu gibi eklenir
    out |= inc
    return out, dict(ref=[round(float(v), 1) for v in ref], tohum=int(seed.sum()))

def gemini(out):
    """`gemini` listesindeki jetonlar için Gemini sayfaları: <ad>-sablon.png (768 px, siyah zemin, jeton %35 saydam: soy-maske-yz.md
    şablonu) ve <ad>-sayfa.png (iki 768 px hücre: jeton | şimdiki otomatik maske taslağı, beyaz = boyanan)."""
    from PIL import ImageDraw
    veri = json.load(open(VERI, encoding='utf-8'))
    os.makedirs(out, exist_ok=True)
    S = 768
    irk = FLAG('--irk')  # TEN-MASKE-4-IRK: virgüllü ırk süzgeci (yoksa hepsi)
    for nm in veri.get('gemini', {}):
        if irk and nm.split('-')[0] not in irk.split(','): continue
        im = Image.open(f'{PUB}/{nm}.webp').convert('RGBA')
        sab = Image.new('RGBA', im.size, (0, 0, 0, 255))
        ghost = im.copy(); ghost.putalpha(ghost.getchannel('A').point(lambda v: int(v * 0.35)))
        sab.alpha_composite(ghost)
        sab.convert('RGB').resize((S, S), Image.NEAREST).save(f'{out}/{nm}-sablon.png')
        p = f'{PUB}/maske-el/{nm}.png' if os.path.exists(f'{PUB}/maske-el/{nm}.png') else f'{OUTDIR}/{nm}.png'
        m = Image.open(p).convert('L').resize(im.size, Image.NEAREST) if os.path.exists(p) else Image.new('L', im.size, 0)
        bg = Image.new('RGBA', im.size, (40, 40, 48, 255)); bg.alpha_composite(im)
        page = Image.new('RGB', (2 * S + 24, S + 40), (16, 16, 20))
        page.paste(bg.convert('RGB').resize((S, S), Image.NEAREST), (8, 32))
        page.paste(m.point(lambda v: 255 if v > 127 else 0).convert('RGB').resize((S, S), Image.NEAREST), (S + 16, 32))
        ImageDraw.Draw(page).text((10, 8), f'{nm}  |  sol: jeton  |  sag: simdiki otomatik maske taslagi (beyaz = boyanan)', fill=(240, 230, 200))
        page.save(f'{out}/{nm}-sayfa.png')
    print('gemini:', len(os.listdir(out)) // 2, out)

def lch_tint(im, m, hexc):
    """İnceleme önizlemesi: tint.ts `maskedPixels` lch yolunun aynısı (skinTint: hueKeep 0,3, chromaKeep 0,5, ortalama açıklık hedefe)."""
    out = im.copy()
    if not m.any() or not hexc: return out
    lab = srgb_to_lab(im[..., :3]); sel = m & (im[..., 3] >= 10)
    l = lab[sel]
    n = int(hexc[1:], 16); tl = srgb_to_lab(np.array([[(n >> 16) & 255, (n >> 8) & 255, n & 255]], np.uint8))[0]
    th = np.arctan2(tl[2], tl[1]); tc = float(np.hypot(tl[1], tl[2]))
    C = np.hypot(l[:, 1], l[:, 2]); mh = np.arctan2(l[:, 2].sum(), l[:, 1].sum()); mc = C.mean(); ml = l[:, 0].mean()
    dh = (np.arctan2(l[:, 2], l[:, 1]) - mh + np.pi) % (2 * np.pi) - np.pi
    nh = th + dh * 0.3; nc = np.maximum(0, tc + (C - mc) * 0.5); nl = np.clip(tl[0] + (l[:, 0] - ml), 0, 100)
    out[sel, :3] = lab_to_srgb(np.stack([nl, nc * np.cos(nh), nc * np.sin(nh)], -1))
    return out

def lab_to_srgb(lab):
    fy = (lab[..., 0] + 16) / 116; fx = fy + lab[..., 1] / 500; fz = fy - lab[..., 2] / 200
    f = np.stack([fx, fy, fz], -1)
    xyz = np.where(f ** 3 > 0.008856, f ** 3, (f - 16 / 116) / 7.787) * np.array([0.95047, 1.0, 1.08883])
    Mi = np.linalg.inv(np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]]))
    c = xyz @ Mi.T
    c = np.where(c > 0.0031308, 1.055 * np.clip(c, 0, None) ** (1 / 2.4) - 0.055, 12.92 * c)
    return np.clip(np.round(c * 255), 0, 255).astype(np.uint8)

def kontak(out, race):
    """TEN-MASKE-4-IRK inceleme sayfaları (git dışı): jeton başına üç hücre: ham | maske (macenta) | soyun ilk boyalı renginde boya
    (`data/soy-ten-renkleri.json`). 6 jeton/satır, 8 satır/sayfa, hücre 128 px."""
    from PIL import ImageDraw
    os.makedirs(out, exist_ok=True)
    ten = json.load(open('data/soy-ten-renkleri.json', encoding='utf-8'))['soylar'] if os.path.exists('data/soy-ten-renkleri.json') else {}
    hexes = [v for k, v in ten.items() if k.startswith(race + '/') and v]
    hexc = hexes[0] if hexes else '#3060c0'
    names = race_tokens(race); S = 128; per = 6 * 8
    for pg in range(0, len(names), per):
        chunk = names[pg:pg + per]
        page = Image.new('RGB', (6 * (3 * S + 8), 8 * (S + 14)), (28, 28, 34)); d = ImageDraw.Draw(page)
        for i, nm in enumerate(chunk):
            im = np.asarray(Image.open(f'{PUB}/{nm}.webp').convert('RGBA'))
            mp = f'{PUB}/maske-el/{nm}.png' if os.path.exists(f'{PUB}/maske-el/{nm}.png') else f'{OUTDIR}/{nm}.png'
            m = (np.asarray(Image.open(mp).convert('L').resize(im.shape[1::-1], Image.NEAREST)) > 127) if os.path.exists(mp) else np.zeros(im.shape[:2], bool)
            ov = im.copy(); ov[m, 0] = 255; ov[m, 1] = 0; ov[m, 2] = 255
            x, y = (i % 6) * (3 * S + 8), (i // 6) * (S + 14)
            for j, arr in enumerate([im, ov, lch_tint(im, m, hexc)]):
                bg = Image.new('RGBA', im.shape[1::-1], (70, 70, 82, 255)); bg.alpha_composite(Image.fromarray(arr))
                page.paste(bg.convert('RGB').resize((S, S), Image.NEAREST), (x + j * S, y + 14))
            d.text((x + 2, y + 1), f"{nm[len(race) + 1:]}{'' if os.path.exists(mp) else ' (maske yok)'}{' BOS' if os.path.exists(mp) and not m.any() else ''}", fill=(255, 235, 170))
        page.save(f'{out}/{race}-{pg // per + 1:02d}.png')
    print('kontak:', race, len(names), out)

def main():
    if '--gemini' in sys.argv:
        return gemini(FLAG('--gemini'))
    if '--kontak' in sys.argv:
        return kontak(FLAG('--kontak'), FLAG('--irk'))
    veri = json.load(open(VERI, encoding='utf-8'))
    races = veri['irklar']; jet = veri['jetonlar']
    tum = veri.get('irkTum', [])
    if FLAG('--irk'): names = race_tokens(FLAG('--irk'))
    else: names = ARG or sorted(set(jet) | {n for r in tum for n in race_tokens(r)})
    sonuc = veri.get('sonuc', {})
    for nm in names:
        cfg = jet.get(nm, {})
        race = nm.split('-')[0]
        if race not in races: print('atla (ırk kapsam dışı):', nm); continue
        # `--el-de`: elle maskesi olan jetonu da üret (maske/ çıktısı; elle maskenin yerine konacaksa elle kopyalanır, betik maske-el'e yazmaz)
        if os.path.exists(f'{PUB}/maske-el/{nm}.png') and '--el-de' not in sys.argv: print('atla (elle maske):', nm); continue
        m, info = make_mask(nm, cfg, races[race])
        im = np.asarray(Image.open(f'{PUB}/{nm}.webp').convert('RGBA')); opq = int((im[..., 3] >= 128).sum())
        n = int(m.sum())
        out = f'{OUTDIR}/{nm}.png'
        if n > opq * races[race].get('asiri', 0.4):
            info['asiri'] = True; print('aşırı, yazılmadı:', nm, n, opq); sonuc[nm] = {**info, 'px': n}
            # TEN-MASKE-4-IRK: bütün jetonları bu betikle üretilen ırkta eski (baş) maske kalmasın: bilerek boş maske (boyanmaz)
            if race not in tum or KURU: continue
            m = np.zeros_like(m); n = 0
        sonuc[nm] = {**info, 'px': n}
        if KURU: continue
        os.makedirs(OUTDIR, exist_ok=True)
        # < 30 px: bilerek boş maske (dosya kalır, tümü 0): jeton boyanmaz, yedek filtre de uygulanmaz (tint.ts: maske var sayılır).
        if n < 30: m = np.zeros_like(m)
        Image.fromarray((m * 255).astype(np.uint8), 'L').convert('P', palette=Image.ADAPTIVE, colors=2).save(out, optimize=True)
    if not KURU and not ARG:
        veri['sonuc'] = {k: sonuc[k] for k in sorted(sonuc)}
        open(VERI, 'w', encoding='utf-8').write(json.dumps(veri, ensure_ascii=False, indent=1) + '\n')
    print('maske:', len(names))

if __name__ == '__main__': main()
