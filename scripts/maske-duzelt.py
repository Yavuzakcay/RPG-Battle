"""
MASKE-DUZELT: seçili jetonların otomatik ten maskesini (public/characters/maske/<ad>.png) yeni kesime ve yüzün ham ten rengine göre yeniden
üretir. Yalnız `data/maske-duzelt.json` `jetonlar` listesindekiler yazılır; elle maske (assets/soy-maske-el/ → maske-el/) olan, bilerek
maskesiz (Human ID3 Paladin, SC-5, WL-10) ve Dragonborn/Gnome/Goliath/Orc/Dwarf jetonlarına dokunulmaz.

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

Çalıştırma:  python scripts/maske-duzelt.py [--kuru] [ad ...]   (PYTHONUTF8=1)
Çıktı: public/characters/maske/<ad>.png (iki renkli palet PNG, soy-maske.ts ile aynı biçim), data/maske-duzelt.json `sonuc` (piksel sayıları).
"""
import os, sys, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); os.chdir(ROOT)
PUB = 'public/characters'
VERI = 'data/maske-duzelt.json'
ARG = [a for a in sys.argv[1:] if not a.startswith('--')]
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
    m = np.zeros(shape, bool); m[int(b[1]):int(b[3]) + 1, int(b[0]):int(b[2]) + 1] = True; return m

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
    shade = (dh <= p['ton']) & (C >= refC * p['kroma']) & (L >= ref[0] - p['golge']) & (L <= ref[0] + p['isik'])
    skin = a & ((dE <= p['th']) | shade)
    if cfg.get('yalniz'):
        keep = np.zeros_like(a)
        for b in cfg['yalniz']: keep |= box_mask(a.shape, b)
        skin &= keep
    for b in cfg.get('exclude', []): skin &= ~box_mask(a.shape, b)
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
    for k in range(1, n + 1):
        c = lb == k
        if c.sum() < p['enAz']: continue
        if np.linalg.norm(lab[c].mean(0) - ref) > p['bilesen']: continue
        out |= c
    # tek tük pikseller (8 komşudan < 2'si maskede)
    nb = ndi.convolve(out.astype(np.int32), np.ones((3, 3), np.int32), mode='constant') - out
    out &= nb >= 2
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
    for nm in veri.get('gemini', {}):
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
    print('gemini:', len(veri.get('gemini', {})), out)

def main():
    if '--gemini' in sys.argv:
        return gemini(sys.argv[sys.argv.index('--gemini') + 1])
    veri = json.load(open(VERI, encoding='utf-8'))
    races = veri['irklar']; jet = veri['jetonlar']
    names = ARG or sorted(jet)
    sonuc = veri.get('sonuc', {})
    for nm in names:
        cfg = jet.get(nm, {})
        race = nm.split('-')[0]
        if race not in races: print('atla (ırk kapsam dışı):', nm); continue
        if os.path.exists(f'{PUB}/maske-el/{nm}.png'): print('atla (elle maske):', nm); continue
        m, info = make_mask(nm, cfg, races[race])
        im = np.asarray(Image.open(f'{PUB}/{nm}.webp').convert('RGBA')); opq = int((im[..., 3] >= 128).sum())
        n = int(m.sum())
        out = f'{OUTDIR}/{nm}.png'
        if n > opq * 0.4: info['asiri'] = True; print('aşırı, yazılmadı:', nm, n, opq); sonuc[nm] = {**info, 'px': n}; continue
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
