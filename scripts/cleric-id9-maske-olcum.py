#!/usr/bin/env python3
"""KJ4: bayat 8 Cleric ID9 ten maskesinin yeniden üretimi için ÖLÇÜM ve önce/sonra görüntüsü. YALNIZ OKUR: jeton ve maske dosyalarına yazmaz,
yalnız çıktı klasörüne (varsayılan docs/sabah/cleric-id9-halka/) rapor ve görüntü yazar.
`python3 scripts/cleric-id9-maske-olcum.py [--once <git-ref>] [--sonra <maske klasörü>] [--cikti <klasör>]`
- önce: `<git-ref>:public/characters/maske/<jeton>.png` (varsayılan HEAD); sonra: `--sonra` klasöründeki maske (varsayılan çalışma ağacı public/characters/maske).
- halka: scripts/cleric-id9-halka.py `split_ring` (jetondaki mevcut boncuk halkası). Ölçüler: değişen/eklenen/silinen piksel, halka ∩ maske (0 olmalı),
  ten Lab dağılımı (ortalama, sapma, ΔE p50/p90), önce/sonra ortalamaları arası ΔE, ten dışı piksel (baş bandı ten medyanına ΔE > 25) ve baş bandının altındaki
  maske pikseli (eller dahil).
- çıktı: maske-8-rapor.json, maske-8-once-sonra.png (jeton | önce | sonra | fark)."""
import argparse, importlib.util, io, json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BAYAT = ['elf-erkek', 'gnome-erkek', 'gnome-kadin', 'goliath-erkek', 'goliath-kadin', 'human-erkek', 'human-kadin', 'tiefling-erkek']   # jeton = <ad>-cleric-ID9
TEN_DISI_DE = 25.0   # baş bandı ten medyanından ΔE bu değerden büyük maske pikseli "ten dışı" sayılır
BAS_BANDI = 80       # baş tepesinden aşağı satır sayısı (scripts/cleric-id9-halka.py split_ring bölgesiyle aynı)

def yukle_halka():
    spec = importlib.util.spec_from_file_location('cleric_id9_halka', os.path.join(ROOT, 'scripts', 'cleric-id9-halka.py'))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m

def lab(rgb):
    c = rgb.astype(float) / 255.0; c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = c @ M.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)

def git_mask(ref, name):
    b = subprocess.check_output(['git', '-C', ROOT, 'show', f'{ref}:public/characters/maske/{name}.png'])
    return np.array(Image.open(io.BytesIO(b)).convert('L')) > 127

def dagilim(L, m):
    """Maske pikselleri için Lab dağılımı: ortalama, sapma, ΔE(piksel, ortalama) p50/p90."""
    if not m.any(): return {'px': 0}, None
    p = L[m]; mu = p.mean(0); d = np.linalg.norm(p - mu, axis=1)
    return {'px': int(m.sum()), 'L': round(float(mu[0]), 1), 'a': round(float(mu[1]), 1), 'b': round(float(mu[2]), 1),
            'sapmaL': round(float(p[:, 0].std()), 1), 'sapmaC': round(float(np.hypot(p[:, 1], p[:, 2]).std()), 1),
            'dE_p50': round(float(np.percentile(d, 50)), 1), 'dE_p90': round(float(np.percentile(d, 90)), 1)}, mu

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--once', default='HEAD', help='önce maskelerin okunacağı git sürümü (varsayılan HEAD)')
    ap.add_argument('--sonra', default=os.path.join(ROOT, 'public/characters/maske'), help='sonra maskelerin klasörü')
    ap.add_argument('--cikti', default=os.path.join(ROOT, 'docs/sabah/cleric-id9-halka'))
    a = ap.parse_args()
    if hasattr(sys.stdout, 'reconfigure'): sys.stdout.reconfigure(encoding='utf-8')
    halka = yukle_halka(); satirlar = {}; kareler = []
    for t in BAYAT:
        n = f'{t}-cleric-ID9'
        rgba = np.array(Image.open(os.path.join(ROOT, 'public/characters', n + '.webp')).convert('RGBA'))
        L = lab(rgba[..., :3]); gorunur = rgba[..., 3] >= 128
        once = git_mask(a.once, n); sonra = np.array(Image.open(os.path.join(a.sonra, n + '.png')).convert('L')) > 127
        _, temiz, halka_m = halka.split_ring(rgba); halka_m = halka_m & (rgba[..., 3] > 20)
        bas_tepe = halka.head(temiz)[0]; sat = np.arange(256)[:, None] * np.ones((1, 256), int)
        mo, ms = once & gorunur, sonra & gorunur
        do, mu_o = dagilim(L, mo); ds, mu_s = dagilim(L, ms)
        merkez = np.median(L[(mo | ms) & (sat >= bas_tepe) & (sat < bas_tepe + BAS_BANDI)], 0)
        de_merkez = np.linalg.norm(L - merkez, axis=-1)
        r = {'maske_px_once': int(once.sum()), 'maske_px_sonra': int(sonra.sum()), 'degisen_px': int((once ^ sonra).sum()),
             'eklenen_px': int((sonra & ~once).sum()), 'silinen_px': int((once & ~sonra).sum()),
             'halka_px': int(halka_m.sum()), 'halka_kesisim_once_px': int((halka_m & once).sum()), 'halka_kesisim_sonra_px': int((halka_m & sonra).sum()),
             'halka_1px_yakin_sonra_px': int((ndi.binary_dilation(halka_m, iterations=1) & sonra).sum()),
             'ten_once': do, 'ten_sonra': ds,
             'ten_ortalama_dE': round(float(np.linalg.norm(mu_o - mu_s)), 2) if mu_o is not None and mu_s is not None else None,
             'ten_disi_px_once': int((mo & (de_merkez > TEN_DISI_DE)).sum()), 'ten_disi_px_sonra': int((ms & (de_merkez > TEN_DISI_DE)).sum()),
             'bas_bandi_alti_px_once': int((mo & (sat >= bas_tepe + BAS_BANDI)).sum()), 'bas_bandi_alti_px_sonra': int((ms & (sat >= bas_tepe + BAS_BANDI)).sum())}
        satirlar[n] = r
        zemin = np.zeros((256, 256, 3), np.uint8) + np.array([52, 56, 66], np.uint8); al = rgba[..., 3:4] / 255.0
        taban = (rgba[..., :3] * al + zemin * (1 - al)).astype(np.uint8)
        def kapla(m, renk=(255, 0, 255), k=0.62):
            im = taban.astype(float).copy(); im[m] = im[m] * (1 - k) + np.array(renk) * k; return im.astype(np.uint8)
        fark = taban.astype(float) * 0.55
        fark[once & sonra] = [150, 150, 150]; fark[sonra & ~once] = [60, 220, 90]; fark[once & ~sonra] = [235, 70, 70]
        fark[halka_m & ~sonra] = [60, 150, 255]; fark[halka_m & sonra] = [255, 230, 40]
        kareler.append((n, r, [taban, kapla(once), kapla(sonra), fark.astype(np.uint8)]))

    os.makedirs(a.cikti, exist_ok=True)
    json.dump({'not': f'scripts/cleric-id9-maske-olcum.py: 8 bayat Cleric ID9 ten maskesi, önce ({a.once}) / sonra (yeniden üretilen); halka = scripts/cleric-id9-halka.py split_ring; ten dışı = baş bandı ten medyanına ΔE > {TEN_DISI_DE:g}.',
               'once': a.once, 'en_buyuk_halka_kesisim_sonra_px': max(r['halka_kesisim_sonra_px'] for r in satirlar.values()), 'jetonlar': satirlar},
              open(os.path.join(a.cikti, 'maske-8-rapor.json'), 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)
    S, ETIKET, UST = 256, 30, 52
    sayfa = Image.new('RGB', (4 * S, UST + len(kareler) * (S + ETIKET)), (30, 33, 40)); d = ImageDraw.Draw(sayfa)
    try: yazi = ImageFont.truetype('DejaVuSans.ttf', 13); kalin = ImageFont.truetype('DejaVuSans-Bold.ttf', 14)
    except Exception: yazi = kalin = ImageFont.load_default()
    for c, h in enumerate(['jeton (mevcut)', f'ÖNCE: {a.once} ten maskesi', 'SONRA: yeniden üretilen', 'fark']): d.text((c * S + 6, 6), h, fill=(225, 230, 240), font=kalin)
    d.text((6, 28), 'fark: yeşil = eklenen   kırmızı = silinen   gri = ortak   mavi = halka   sarı = halka ∩ maske (yok olmalı)   pembe = ten maskesi', fill=(190, 196, 210), font=yazi)
    for i, (n, r, ps) in enumerate(kareler):
        y = UST + i * (S + ETIKET)
        for c, p in enumerate(ps): sayfa.paste(Image.fromarray(p), (c * S, y + ETIKET))
        d.text((6, y + 7), f"{n}   maske {r['maske_px_once']} → {r['maske_px_sonra']} px (değişen {r['degisen_px']}: +{r['eklenen_px']} −{r['silinen_px']})   halka {r['halka_px']} px, halka∩maske önce {r['halka_kesisim_once_px']} / sonra {r['halka_kesisim_sonra_px']}   ten ΔE {r['ten_ortalama_dE']}", fill=(235, 238, 245), font=yazi)
    sayfa.quantize(256, dither=Image.Dither.NONE).save(os.path.join(a.cikti, 'maske-8-once-sonra.png'), optimize=True)
    print(f"{'jeton':26s} {'önce':>5s} {'sonra':>5s} {'değişen':>7s} {'+':>4s} {'-':>4s} {'halka':>5s} {'h∩ö':>4s} {'h∩s':>4s} {'tenΔE':>5s} {'tendışı ö→s':>11s} {'gövde ö→s':>11s}")
    for n, r in satirlar.items():
        print(f"{n:26s} {r['maske_px_once']:5d} {r['maske_px_sonra']:5d} {r['degisen_px']:7d} {r['eklenen_px']:4d} {r['silinen_px']:4d} {r['halka_px']:5d} {r['halka_kesisim_once_px']:4d} {r['halka_kesisim_sonra_px']:4d} {str(r['ten_ortalama_dE']):>5s} "
              f"{r['ten_disi_px_once']:5d}→{r['ten_disi_px_sonra']:<5d} {r['bas_bandi_alti_px_once']:5d}→{r['bas_bandi_alti_px_sonra']:<5d}")
    print('en büyük halka ∩ maske (sonra):', max(r['halka_kesisim_sonra_px'] for r in satirlar.values()), 'px; çıktı:', a.cikti)

if __name__ == '__main__': main()
