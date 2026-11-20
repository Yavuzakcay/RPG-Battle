#!/usr/bin/env python3
"""CC 2026-11-19: Gladyatör ten kayması denetimi (yalnız rapor, düzeltme yok). Tiefling, Goliath, Orc, Dragonborn Gladyatör (fighter ID12) ↔ aynı ırk/cinsiyet
Fighter jetonları (ID1–ID11, ID5 dev hali hariç). Ten = ten maskesi (public/characters/maske/<ad>.png) pikselleri; maskesi olmayan Orc'ta baş bölgesinde
(figürün üst %35'i) yeşil ten tonu (h 70–150°, C ≥ 8, L 25–80). ten_hex = maske piksellerinin ortalaması; ΔE = CIE76 (Lab). Çıktı docs/sabah/cc-kesim/ten-denetim.md."""
import os
import numpy as np
from PIL import Image
C = 'public/characters'
def lab(rgb):
    c = rgb / 255.0; c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = c @ M.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)
def skin(name):
    if not os.path.exists(f'{C}/{name}.webp'): return None, 0
    a = np.array(Image.open(f'{C}/{name}.webp').convert('RGBA')).astype(float)
    mp = f'{C}/maske/{name}.png'
    if os.path.exists(mp):
        m = np.array(Image.open(mp).convert('L')) > 127
    else:
        L_ = lab(a[..., :3]); h = np.degrees(np.arctan2(L_[..., 2], L_[..., 1])) % 360; ch = np.hypot(L_[..., 1], L_[..., 2])
        al = a[..., 3] > 127; ys, _ = np.where(al); top = ys.min() + 0.35 * (ys.max() - ys.min())
        m = al & (h >= 70) & (h <= 150) & (ch >= 8) & (L_[..., 0] >= 25) & (L_[..., 0] <= 80); m[int(top):] = False
    m &= a[..., 3] > 127
    if m.sum() < 30: return None, 0
    rgb = a[m][:, :3].mean(0); return rgb, int(m.sum())
rows = []
for race in ('tiefling', 'goliath', 'orc', 'dragonborn'):
    for g in ('erkek', 'kadin'):
        new, n_new = skin(f'{race}-{g}-fighter-ID12')
        refs = [skin(f'{race}-{g}-fighter-ID{i}') for i in (1, 2, 3, 4, 6, 7, 8, 9, 10, 11)]
        refs = [r for r, n in refs if r is not None]
        if new is None or not refs: rows.append((race, g, '—', '—', '—', 'ölçülemedi')); continue
        ref = np.median(np.array(refs), 0)
        d = float(np.linalg.norm(lab(new[None])[0] - lab(ref[None])[0]))
        spread = float(np.median([np.linalg.norm(lab(r[None])[0] - lab(ref[None])[0]) for r in refs]))
        hx = lambda c: '#%02X%02X%02X' % tuple(int(round(v)) for v in c)
        rows.append((race, g, hx(new), hx(ref), f'{d:.1f} (Fighter içi ortanca {spread:.1f})', 'BÜYÜK' if d > max(10, 2 * spread) else 'olağan'))
os.makedirs('docs/sabah/cc-kesim', exist_ok=True)
with open('docs/sabah/cc-kesim/ten-denetim.md', 'w') as f:
    f.write('# Gladyatör ten kayması denetimi (yalnız rapor)\n\nÜretici `scripts/cc-ten-denetim.py`. Gladyatör (fighter ID12) ten ortalaması ↔ aynı ırk/cinsiyet Fighter jetonlarının (ID1–ID11, ID5 hariç) ortanca teni; ΔE CIE76. "BÜYÜK": ΔE > 10 ve Fighter jetonlarının kendi aralarındaki ortanca sapmanın 2 katından büyük. Düzeltme yapılmadı.\n\n| Irk | Cinsiyet | Gladyatör ten_hex | Fighter ten_hex | ΔE | Sonuç |\n|---|---|---|---|---|---|\n')
    for r in rows: f.write('| ' + ' | '.join(r) + ' |\n')
for r in rows: print(r)
