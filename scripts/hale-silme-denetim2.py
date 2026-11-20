#!/usr/bin/env python3
"""KQ6-18: silme + kalıntı denetimi, bütün Celestial jetonlarda (288). Halesiz varyantı olanlar: hale bölgesi dışında silinen piksel (> 3 şüpheli) ve halesizde hale kalıntısı (şekil temelli).
Halesiz varyantı olmayanlar (bekleyen: Gemini / dokunma / ertele / karar bekliyor) listelenir, silme yapılmadığı için denetlenmez.
Çıktı: docs/sabah/hale-silme-denetim2.png (yalnız hâlâ kalıntılı ya da şüpheli: orijinal | halesiz | fark) ve docs/sabah/hale-silme-denetim2.csv (288 satır)."""
import csv, importlib.util, json, os
import numpy as np
from PIL import Image, ImageDraw
def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
sd = load('sd', 'scripts/hale-silme-denetim.py'); hv = sd.hv; hg = load('hg', 'scripts/hale-guclu.py')
D = 'public/characters'; N = 256; ESIK = 3

def main():
    hv.OPAQUE_R = 3
    bek = json.load(open('data/hale-elle.json'))['bekleyen']
    names = sorted(f[:-5] for f in os.listdir(D) if f.startswith('celestial-') and f.endswith('.webp'))
    rows = []; sus = []
    for n in names:
        p = f'{D}/halesiz/{n}.webp'
        if not os.path.exists(p):
            b = bek.get(n, {}); rows.append((f'{n}.webp', 'halesiz yok', '', '', '', '', '', '', b.get('durum', ''), 'bekleyen: ' + (b.get('karar') or 'karar bekliyor'))); continue
        o = np.array(Image.open(f'{D}/{n}.webp').convert('RGBA')); f = np.array(Image.open(p).convert('RGBA'))
        rem = (o[..., 3] > 0) & (f[..., 3] == 0); zone, mi = sd.halo_zone(o); out = rem & ~zone; top, cx = mi['top_px'], mi['cx']
        yy, xx = np.mgrid[0:N, 0:N]; ust = out & (yy < top - 1); alt = out & ~ust
        sol, sag, u = int((alt & (xx < cx)).sum()), int((alt & (xx >= cx)).sum()), int(ust.sum()); disari = int(out.sum()); kal = sd.halo_left(f) or hg.residual(o, f) > hg.RESIDUAL_MAX   # şekil temelli ya da ton temelli kalıntı
        sonuc = 'temiz' if disari <= ESIK and not kal else ('şüpheli+kalıntı' if disari > ESIK and kal else ('şüpheli' if disari > ESIK else 'kalıntılı'))
        rows.append((f'{n}.webp', 'halesiz var', disari, sol, sag, u, int((rem & zone).sum()), 'evet' if kal else 'hayir', '', sonuc))
        if sonuc != 'temiz': sus.append((n, o, f, rem, zone, out, disari, kal, sonuc))
    with open('docs/sabah/hale-silme-denetim2.csv', 'w', newline='') as fh:
        w = csv.writer(fh); w.writerow(['dosya', 'durum', 'hale_disinda_silinen_px', 'sol_px', 'sag_px', 'ust_px', 'hale_bolgesinde_silinen_px', 'halesizde_hale_kaldi', 'bekleyen_durum', 'sonuc']); w.writerows(rows)
    cols = 2; rws = max(1, (len(sus) + cols - 1) // cols); lab = 18
    sheet = Image.new('RGB', (cols * (N * 3 + 12), rws * (N + lab)), (60, 64, 72)); dr = ImageDraw.Draw(sheet)
    for i, (n, o, f, rem, zone, out, disari, kal, sonuc) in enumerate(sus):
        ox = (i % cols) * (N * 3 + 12); oy = (i // cols) * (N + lab)
        for k, arr in enumerate((o, f)):
            im = Image.fromarray(arr); t = Image.new('RGB', (N, N), (96, 100, 112)); t.paste(im, (0, 0), im); sheet.paste(t, (ox + k * N, oy))
        m = np.full((N, N, 3), 40, np.uint8); m[f[..., 3] > 0] = (110, 110, 118); m[rem & zone] = (245, 215, 80); m[out] = (255, 40, 40)
        sheet.paste(Image.fromarray(m), (ox + 2 * N, oy)); dr.text((ox + 2, oy + N + 3), f'{n.replace("celestial-", "")}  {sonuc}  disarida {disari} px  hale kaldi: {"evet" if kal else "hayir"}', fill=(255, 255, 255))
    if not sus:
        n_ok = sum(1 for r in rows if r[9] == 'temiz'); n_b = sum(1 for r in rows if r[9].startswith('bekleyen'))
        dr.text((12, 10), f'Kalintili ya da supheli halesiz varyant kalmadi. 288 jeton: {n_ok} halesiz varyant temiz, {n_b} jeton bekleyen (Gemini / dokunma / ertele / karar bekliyor): hale gorunur kaliyor, varyant uretilmedi.', fill=(255, 255, 255))
        sheet = sheet.crop((0, 0, sheet.width, 40))
    sheet.save('docs/sabah/hale-silme-denetim2.png')
    from collections import Counter
    print(len(rows), Counter(r[9].split(':')[0] for r in rows))
    for s in sus: print(' ', s[0], s[8], s[6])

if __name__ == '__main__': main()
