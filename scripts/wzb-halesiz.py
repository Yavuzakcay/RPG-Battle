#!/usr/bin/env python3
"""Erkek Celestial Wizard WZ-B1/B2/B3/B4/B7 halesiz uygulama (2026-11-19). Kaynak: git 2360265b public/characters/halesiz/<ad>.webp (KQ6-12
programla hale silinmiş varyant; opak pikseller mevcut jetonla bire bir aynı, fark yalnız başın üstü). Uygulama: mevcut jeton + varyantın
baş tepesi + 25 satıra kadarki kısmı; başın üstünde gövdeye bağlı olmayan küçük hale kalıntıları (B2: 4 px, B3: 17 px çizgi; B1/B7 tek piksel kırıntı)
KALINTI listesindeki kutularla silinir. Öncelik defterine `duzeltme` (dosya git:2360265b) yazılır. Önce/sonra 4× docs/sabah/celestial-final/wzb-duzeltme/.
`python3 scripts/wzb-halesiz.py`"""
import importlib.util, io, os, subprocess
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
_s = importlib.util.spec_from_file_location('cc', 'scripts/cc-kesim.py'); cc = importlib.util.module_from_spec(_s); _s.loader.exec_module(cc)
REF = '2360265b'
# jeton kodu → silinecek kalıntı kutuları (x0, y0, x1, y1; yalnız gövdeye bağlı olmayan pikseller)
KALINTI = {'B1': [(146, 12, 151, 17)], 'B2': [(110, 26, 121, 33)], 'B3': [(112, 37, 136, 44)], 'B4': [], 'B7': [(105, 19, 110, 24)]}
OUT = 'docs/sabah/celestial-final/wzb-duzeltme'

def main():
    os.makedirs(OUT, exist_ok=True)
    L = cc.ledger(); rep = {'adim': 'wzb', 'yazilan': [], 'ezilmedi': []}
    for c, boxes in KALINTI.items():
        n = f'celestial-erkek-wizard-WZ-{c}'
        v = np.array(Image.open(io.BytesIO(subprocess.run(['git', 'show', f'{REF}:public/characters/halesiz/{n}.webp'], capture_output=True, check=True).stdout)).convert('RGBA'))
        cur = np.array(Image.open(f'public/characters/{n}.webp').convert('RGBA'))
        ys, _ = np.where(cur[..., 3] > 127)
        cut = int(ys.min()) + 25
        out = cur.copy(); out[:cut] = v[:cut]
        al = out[..., 3] > 0
        lab, k = ndi.label(al, structure=np.ones((3, 3))); sz = ndi.sum(al, lab, range(1, k + 1)); body = lab == 1 + int(np.argmax(sz))
        for (x0, y0, x1, y1) in boxes:
            m = np.zeros_like(al); m[y0:y1, x0:x1] = True; m &= al & ~body
            out[m] = 0
        cc.write_token(L, n, Image.fromarray(out, 'RGBA'), 'duzeltme', f'git:{REF}', 1, rep)
        im = Image.new('RGBA', (2048 + 24, 1024 + 28), (52, 54, 60, 255)); d = ImageDraw.Draw(im)
        for i, (t, lab_) in enumerate([(cur, 'once'), (out, 'sonra (2360265b halesiz + kalinti silindi)')]):
            im.alpha_composite(Image.fromarray(t, 'RGBA').resize((1024, 1024), Image.NEAREST), (i * 1048, 28)); d.text((i * 1048 + 6, 6), f'{n} {lab_}', fill='white')
        im.convert('RGB').save(f'{OUT}/{n}.png')
    cc.save_ledger(L); cc.hold_sync(L); cc.oncelik_rapor(L)
    print(rep)

if __name__ == '__main__': main()
