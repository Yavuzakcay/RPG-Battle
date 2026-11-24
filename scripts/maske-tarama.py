"""
MASKE-EK tarama: ten maskesi olan 7 ırkın (Elf, Human, Tiefling, Orc, Goliath, Dwarf, Gnome) bütün jetonları için maske ölçüsü ve şüpheli
sıralaması. `scripts/jeton-denetim.py --asama boya` Elf/Human'da krem kapüşonu ten sayabildiğinden onun yerine: ten referansı jetonun
yüzünden (maske-duzelt.py'nin tohumu: ırk ten aralığı + ırkın iyi maskelerinin ten medyanına yakınlık, jeton başına `seed`), maske
dosyasından bağımsız.

Ölçüler (jeton başına; maske = maske-el/ varsa o, yoksa maske/; 256 px):
  alan   maske / opak piksel; aynı ırk + cinsiyetin (erkek|male / kadin|female) medyanına göre MAD z-puanı (a: aykırı büyük/küçük)
  disi   maske piksellerinden yüz referansına ΔE > 30 ve ten ailesi dışında olanların oranı (ton farkı > 30° ya da kroma < referans × 0,35;
         gri referansta ab uzaklığı > 12) (b: kıyafet/zırh/saç/silah boyalı)
  bas    yüz tohumu (baş bandı) piksellerinin maskede olmayan oranı (c: yüz boyasız; bilerek boş değilse)
  hayalet adı bilinen tensiz çizim kalıbında (iskelet, hayalet, gölge, zombi, ağaç…) ama maskesi dolu ya da dosyası yok (d)

Çalıştırma: python scripts/maske-tarama.py [--json <çıktı>] [--kontak <klasör> [--en-cok 120]]   (PYTHONUTF8=1)
Kontak sayfası: jeton başına üç hücre (ham | maske macenta | soyun boya renginde LCH önizleme), 4 jeton/satır, 5 satır/sayfa.
"""
import os, sys, json, glob, importlib.util
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); os.chdir(ROOT)
spec = importlib.util.spec_from_file_location('md', 'scripts/maske-duzelt.py'); md = importlib.util.module_from_spec(spec)
sys.argv, _argv = sys.argv[:1], sys.argv; spec.loader.exec_module(md); sys.argv = _argv
PUB = 'public/characters'
IRKLAR = ['elf', 'human', 'tiefling', 'orc', 'goliath', 'dwarf', 'gnome']
FLAG = lambda f, d=None: sys.argv[sys.argv.index(f) + 1] if f in sys.argv else d
# Tensiz çizim kalıpları (MASKE-DUZELT / TEN-MASKE-4-IRK bilerek boş kararları): alt sınıf kodu → not
HAYALET = {'cleric-ID6': 'azrail', 'druid-ID4': 'ağaç adam', 'sorcerer-SC-3': 'zombi çocuk/hayalet', 'sorcerer-SC-5': 'gölge',
           'sorcerer-SC-9': 'silindir şapkalı iskelet/ghoul', 'warlock-WL-4': 'zombi', 'warlock-WL-10': 'hayalet', 'monk-ID10': 'ölü',
           'paladin-ID3': 'kapalı miğfer'}
# Boya önizlemesi rengi (ırkın boyalı soylarından biri; Drow ve Tiefling gradyanı yerine temsilî renk)
ONIZLEME = {'elf': '#4A3F66', 'human': '#5A3A28', 'tiefling': '#3D7FB0', 'orc': '#C3D6E0', 'goliath': '#C4573B', 'dwarf': '#6A5F78',
            'gnome': '#A39AB0'}

def mask_of(nm):
    for d in ('maske-el', 'maske'):
        p = f'{PUB}/{d}/{nm}.png'
        if os.path.exists(p):
            return (np.asarray(Image.open(p).convert('L').resize((256, 256), Image.NEAREST)) > 127), d
    return None, None

def cins(nm):
    g = nm.split('-')[1]
    return 'erkek' if g in ('erkek', 'male') else 'kadin'

def olc(nm, veri):
    race = nm.split('-')[0]
    cfg = veri['jetonlar'].get(nm, {})
    im = np.asarray(Image.open(f'{PUB}/{nm}.webp').convert('RGBA'))
    a = im[..., 3] >= 128; opq = int(a.sum())
    m, kaynak = mask_of(nm)
    r = dict(ad=nm, irk=race, cins=cins(nm), opak=opq, kaynak=kaynak or 'yok', bos=bool(cfg.get('bos')))
    kod = '-'.join(nm.split('-')[2:])
    r['hayalet'] = HAYALET.get(kod)
    # yüz referansı: maske-duzelt.py tohumu (`bos` kararı tohumu yok sayar: ölçü için kutusuz tohum)
    c2 = {k: v for k, v in cfg.items() if k not in ('bos', 'yalniz', 'include', 'exclude', 'basKutu')}
    _, info = md.make_mask(nm, c2, veri['irklar'][race])
    r['px'] = int(m.sum()) if m is not None else 0
    r['alan'] = r['px'] / max(opq, 1)
    if 'ref' not in info:
        r.update(ref=None, disi=0.0, bas=None); return r
    ref = np.array(info['ref']); r['ref'] = info['ref']
    lab = md.srgb_to_lab(im[..., :3]); L, A, B = lab[..., 0], lab[..., 1], lab[..., 2]
    C = np.hypot(A, B); h = (np.degrees(np.arctan2(B, A)) + 360) % 360
    refC = float(np.hypot(ref[1], ref[2])); refh = float((np.degrees(np.arctan2(ref[2], ref[1])) + 360) % 360)
    if m is not None and m.any():
        dE = np.linalg.norm(lab[m] - ref, axis=-1)
        if refC < 10: fam = np.hypot(A[m] - ref[1], B[m] - ref[2]) <= 12
        else: fam = (np.abs(((h[m] - refh) + 180) % 360 - 180) <= 30) & (C[m] >= refC * 0.35)
        r['disi'] = float(((dE > 30) & ~fam).mean())
    else:
        r['disi'] = 0.0
    # yüz tohumu (baş bandı): kutusuz tohumun yeniden kurulması: referansa ΔE ≤ 10, baş bandında
    ys, xs = np.where(a); y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    band = np.zeros_like(a); band[y0:y0 + int((y1 - y0) * 0.42) + 1, int(x0 + (x1 - x0) * 0.1):int(x1 - (x1 - x0) * 0.1) + 1] = True
    if 'seed' in cfg: band = md.box_mask(a.shape, cfg['seed'])
    face = band & a & (np.linalg.norm(lab - ref, axis=-1) <= 10)
    r['yuz'] = int(face.sum())
    r['bas'] = float((face & ~(m if m is not None else np.zeros_like(a))).sum() / max(face.sum(), 1)) if face.sum() >= 20 else None
    return r

def puanla(rs):
    gr = {}
    for r in rs: gr.setdefault((r['irk'], r['cins']), []).append(r['alan'])
    for r in rs:
        v = np.array([x for x in gr[(r['irk'], r['cins'])] if x > 0])
        med = float(np.median(v)); mad = float(np.median(np.abs(v - med))) or 0.01
        r['z'] = (r['alan'] - med) / (1.4826 * mad) if r['px'] else None
        neden, p = [], 0.0
        if r['px'] and r['z'] > 3: neden.append(f"a:büyük z={r['z']:.1f}"); p += min(r['z'], 12) / 3
        if r['px'] and r['z'] < -2.2: neden.append(f"a:küçük z={r['z']:.1f}"); p += min(-r['z'], 6) / 3
        if r['disi'] >= 0.12: neden.append(f"b:dışı {r['disi']:.2f}"); p += r['disi'] * 6
        if not r['bos'] and r['bas'] is not None and r['bas'] >= 0.6 and r['yuz'] >= 40 and not r['hayalet']:
            neden.append(f"c:yüz boyasız {r['bas']:.2f}"); p += 1 + r['bas']
        if r['hayalet'] and not r['bos'] and (r['px'] > 0 or r['kaynak'] == 'yok'):
            neden.append(f"d:{r['hayalet']} ({'maske yok: yedek filtre' if r['kaynak'] == 'yok' else 'maske dolu'})"); p += 3
        r['neden'] = neden; r['puan'] = round(p, 2)
    return rs

def kontak(rs, out):
    os.makedirs(out, exist_ok=True)
    S, per, cols = 128, 20, 4
    for pg in range(0, len(rs), per):
        chunk = rs[pg:pg + per]
        page = Image.new('RGB', (cols * (3 * S + 10), (per // cols) * (S + 26)), (28, 28, 34)); d = ImageDraw.Draw(page)
        for i, r in enumerate(chunk):
            nm = r['ad']; im = np.asarray(Image.open(f'{PUB}/{nm}.webp').convert('RGBA'))
            m, _ = mask_of(nm); m = m if m is not None else np.zeros(im.shape[:2], bool)
            ov = im.copy(); ov[m, 0] = 255; ov[m, 1] = 0; ov[m, 2] = 255
            x, y = (i % cols) * (3 * S + 10), (i // cols) * (S + 26)
            for j, arr in enumerate([im, ov, md.lch_tint(im, m, ONIZLEME[r['irk']])]):
                bg = Image.new('RGBA', im.shape[1::-1], (70, 70, 82, 255)); bg.alpha_composite(Image.fromarray(arr))
                page.paste(bg.convert('RGB').resize((S, S), Image.NEAREST), (x + j * S, y + 26))
            d.text((x + 2, y + 1), f"{pg + i + 1}. {nm}", fill=(255, 235, 170))
            d.text((x + 2, y + 13), ' '.join(r['neden'])[:64], fill=(170, 210, 255))
        page.save(f'{out}/tarama-{pg // per + 1:02d}.png')
    print('kontak:', len(rs), out)

def main():
    veri = json.load(open(md.VERI, encoding='utf-8'))
    names = [os.path.basename(f)[:-5] for r in IRKLAR for f in sorted(glob.glob(f'{PUB}/{r}-*.webp'))]
    rs = puanla([olc(n, veri) for n in names])
    gem = set(veri.get('gemini', {}))
    for r in rs: r['gemini'] = r['ad'] in gem
    sus = sorted([r for r in rs if r['neden']], key=lambda r: -r['puan'])
    print('jeton:', len(rs), 'şüpheli:', len(sus))
    for irk in IRKLAR: print(f"  {irk}: {sum(1 for r in sus if r['irk'] == irk)}")
    if FLAG('--json'):
        json.dump(dict(jetonlar=rs, supheli=[r['ad'] for r in sus]), open(FLAG('--json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    if FLAG('--kontak'):
        kontak(sus[:int(FLAG('--en-cok', 120))], FLAG('--kontak'))

if __name__ == '__main__': main()
