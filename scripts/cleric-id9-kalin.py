#!/usr/bin/env python3
"""Cleric ID9 küçük halka kalınlaştırma (2026-11-19; `python3 scripts/cleric-id9-kalin.py`): Tiefling erkek, Dragonborn erkek ve kadın.
96 px rozette halka soluk kaldığı için (bkz. docs/sabah/cleric-id9-halka/NOT.md) boncuk çizgisi 256 px'te 1 px kalınlaşır ve tam opak olur.
- Halka 3. turdaki gibi yeniden üretilir (scripts/cleric-id9-halka.py `small_ring`: aynı ölçek, kutu ve yatay konum; temiz figür = yazmadan önceki
  jetonun (f0687c93^) `split_ring` çıktısı). Kalınlık: halka maskesi (alfa > 40) içe doğru 1 px genişler (elips merkezine bakan komşu), dış kutu
  aynı kalır; yeni piksel en yakın boncuk pikselinin rengini alır. Boynuz altına düşen yeni piksel eklenmez (boynuz kesişimi aynı kalır).
  Halka pikselleri alfa 255, yumuşak kenar (alfa ≤ 40) atılır.
- Jetonun yalnız halka kutusu (±1 px) değişir; kalan pikseller yayımlı jetondan aynen (Dragonborn erkek yeşil kırıntı temizliği korunur).
- Dragonborn: değişen piksellerin pul maskesiyle kesişimi 0 olmalı (değilse o pikseller dışarıda bırakılır ve raporlanır).
96 px kopya + öncelik defteri (`duzeltme`). Rapor docs/sabah/cleric-id9-halka/kalin.json."""
import importlib.util, io, json, subprocess
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
def load(name, path):
    s = importlib.util.spec_from_file_location(name, path); m = importlib.util.module_from_spec(s); s.loader.exec_module(m); return m
hk = load('hk', 'scripts/cleric-id9-halka.py'); cc = load('cc', 'scripts/cc-kesim.py')
D, OUT = 'public/characters', 'docs/sabah/cleric-id9-halka'
HEDEF = ['tiefling-erkek-cleric-ID9', 'dragonborn-erkek-cleric-ID9', 'dragonborn-kadin-cleric-ID9']
ONCE = 'f0687c93^'

def old_token(n):
    b = subprocess.run(['git', 'show', f'{ONCE}:{D}/{n}.webp'], capture_output=True, check=True).stdout
    return np.array(Image.open(io.BytesIO(b)).convert('RGBA'))

def ring_ref():
    ref = old_token('human-erkek-cleric-ID9')               # 3. turdaki referansla aynı kaynak
    rl, rc, rm = hk.split_ring(ref)
    al_ = rl[..., 3] > 0; lab_, k_ = ndi.label(al_, structure=np.ones((3, 3))); sz_ = ndi.sum(al_, lab_, range(1, k_ + 1))
    big_ = lab_ == 1 + int(np.argmax(sz_)); rl[~ndi.binary_dilation(big_, iterations=3)] = 0
    ys, xs = np.where(rl[..., 3] > 0)
    return rl[ys.min():ys.max() + 1, xs.min():xs.max() + 1]

def thick_ring(rimg_a):
    """rimg_a: küçültülmüş halka (RGBA, alfa ×2 uygulanmış). İçe 1 px kalınlaştır, tam opak."""
    m = rimg_a[..., 3] > 40; h, w = m.shape; cy, cx = (h - 1) / 2, (w - 1) / 2
    add = np.zeros_like(m)
    ys, xs = np.where(m)
    for y, x in zip(ys, xs):                                # her halka pikselinin merkeze bakan komşusu
        dy, dx = cy - y, cx - x; L = max(abs(dy), abs(dx)) or 1
        yy, xx = int(round(y + dy / L)), int(round(x + dx / L))
        if 0 <= yy < h and 0 <= xx < w and not m[yy, xx]: add[yy, xx] = True
    return m, add

def main():
    ring = ring_ref(); rep = {}; L = cc.ledger(); wr = {'yazilan': [], 'ezilmedi': []}
    hrap = json.load(open(f'{OUT}/rapor.json'))['jetonlar']
    for n in HEDEF:
        race = n.split('-')[0]
        _, clean, _ = hk.split_ring(old_token(n))
        ht, cx, _, body = hk.head(clean); sw = hk.skull_width(body, ht, cx)
        rw = max(8, round(sw * hk.ORNEK['en'])); rh = max(5, round(rw * hk.ORNEK['boy_en']))
        x0, y0, x1, y1 = hrap[n]['halka_kutu']; assert (x1 - x0, y1 - y0) == (rw, rh), (n, rw, rh)
        rimg = Image.fromarray(ring, 'RGBA').convert('RGBa').resize((rw, rh), Image.LANCZOS).convert('RGBA')
        ra = np.array(rimg); ra[..., 3] = np.clip(ra[..., 3].astype(int) * 2, 0, 255).astype(np.uint8)
        m, add = thick_ring(ra)
        horn = hk.forbidden_of(clean, 'boynuz')[y0:y1, x0:x1]
        add &= ~horn
        _, idx = ndi.distance_transform_edt(~m, return_indices=True)
        out = np.zeros_like(ra); full = m | add
        out[full, :3] = ra[idx[0][full], idx[1][full], :3]; out[full, 3] = 255
        comp = hk.compose(clean, Image.fromarray(out, 'RGBA'), x0, y0)
        cur = np.array(Image.open(f'{D}/{n}.webp').convert('RGBA')); new = cur.copy()
        box = (slice(max(0, y0 - 1), y1 + 1), slice(max(0, x0 - 1), x1 + 1))
        new[box] = comp[box]
        if n == 'dragonborn-erkek-cleric-ID9':                 # yeşil kırıntı temizliği kutu dışında kaldı; kutu içinde aynısı
            g2, _ = load('yz', 'scripts/cleric-id9-yaz.py').clean_green(new, [x0, y0, x1, y1]), None
            new = g2[0]
        diff = np.abs(new.astype(int) - cur.astype(int)).max(-1) > 0
        info = {'halka_kutu': [x0, y0, x1, y1], 'halka_px_once': int((ra[..., 3] > 40).sum()), 'eklenen_ic_px': int(add.sum()),
                'boynuz_altinda_eklenmedi_px': int((thick_ring(ra)[1] & horn).sum()),
                'boynuz_kesisim_px': int((full & horn).sum()), 'boynuz_kesisim_once': hrap[n]['boynuz_kesisim_px'], 'degisen_px': int(diff.sum())}
        pm = f'{D}/maske-pul/{n}.png'
        if race == 'dragonborn':
            mk = np.array(Image.open(pm).convert('L')) > 127; k = mk & diff
            if k.any(): new[k] = cur[k]
            info['pul_maske_kesisim_px'] = int(k.sum())
            fm = np.zeros((256, 256), bool); fm[y0:y1, x0:x1] = full; info['halka_pul_kesisim_px'] = int((fm & mk & (new[..., 3] > 0)).sum())
        cc.write_token(L, n, Image.fromarray(new, 'RGBA'), 'duzeltme', 'cleric-id9-halka/aday + kalın halka', 9, wr)
        rep[n] = info
    cc.save_ledger(L); cc.oncelik_rapor(L)
    json.dump(rep, open(f'{OUT}/kalin.json', 'w'), ensure_ascii=False, indent=1)
    [print(k, v) for k, v in rep.items()]; print(wr)

if __name__ == '__main__': main()
