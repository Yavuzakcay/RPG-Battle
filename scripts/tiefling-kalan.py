"""Tiefling kalanları: elle maske önerisi (kıyafet maskeye giriyor) ve koyu/gri tenli "yarı boyalı" jeton teşhisi.
Yalnız önizleme ve öneri: assets/soy-maske-el/, public/ ve data/ değişmez; oyun kodu değişmez.
Önce oyunun şimdiki çizimi: `npx vite-node scripts/tiefling-kalan-oyun.ts <oyun-klasörü> abyssal`, sonra:
`python scripts/tiefling-kalan.py <oyun-klasörü>`
Çıktı: docs/sabah/tiefling-elle-maske/ (3 jetonun maske önerisi + aynı sorunu taşıyan jeton listesi),
       docs/sabah/tiefling-koyu-ten/ (yarı boyalı jetonlar, 8× önce/sonra, ölçüler)."""
import importlib.util, json, math, os, sys
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHAR = os.path.join(ROOT, 'public/characters')
def _mod(n):
    s = importlib.util.spec_from_file_location(n.replace('-', '_'), os.path.join(ROOT, 'scripts', n + '.py')); m = importlib.util.module_from_spec(s); s.loader.exec_module(m); return m
tb = _mod('tiefling-beyaz'); v2 = tb.v2
lab, comps, dil, ero, fill_holes = v2.lab, v2.comps, v2.dil, v2.ero, v2.fill_holes
SPEC = json.load(open(os.path.join(ROOT, 'data/soy-renkleri.json'), encoding='utf-8'))['races']['tiefling']
TEMIZ = SPEC['temizlik']; KROMA_KOMSU = TEMIZ['golge']['kromaKomsu']
OUT_EL = os.path.join(ROOT, 'docs/sabah/tiefling-elle-maske'); OUT_KT = os.path.join(ROOT, 'docs/sabah/tiefling-koyu-ten')
ELLE = ['tiefling-erkek-ranger-ID9', 'tiefling-erkek-wizard-GR', 'tiefling-male-rogue']
# Elle kutular (256 px, [x0, y0, x1, y1]): `haric` öneriden çıkar, `oyundan` o kutudaki oyun maskesini öneriye katar.
# Ranger ID9: gömlek ve kasket tenle aynı tonda (ton/kroma kuralı ayıramıyor); kuyruk koyu mor, oyun maskesinden.
# Kutulu jetonda öneri oyun maskesinden başlar (yüz, boynuz, kuyruk zaten doğru): `haric` kutularındaki maske silinir, `tonHaric` kutularında
# yalnız ten tonundan (±12°) sapan pikseller (turuncu kasket) silinir.
KUTU = {'tiefling-erkek-ranger-ID9': {'haric': [[75, 100, 185, 152], [170, 168, 232, 202]], 'tonHaric': [[88, 12, 190, 56]]}}
P = {'tonFark': 15, 'kromaAlt': 28, 'kromaOran': 0.55, 'Lmin': 18, 'minBilesen': 40, 'delik': 12, 'dusukKroma': 25,
     'kiyafetPx': 200, 'kiyafetOran': 0.10, 'tonDisiPx': 150, 'koyuTonFark': 22, 'koyuKromaMin': 6, 'yariOran': 0.30, 'yariPx': 250,
     'griKroma': 15, 'koyuL': 25, 'koyuPay': 0.5, 'kiyafetPxSiki': 300, 'kiyafetOranSiki': 0.15, 'tonDisiSiki': 300}
BG = np.array([44, 48, 58])

def hue(L): return (np.degrees(np.arctan2(L[..., 2], L[..., 1])) + 360) % 360
def circ_mean(L, sel):
    return math.degrees(math.atan2(L[..., 2][sel].mean(), L[..., 1][sel].mean())) % 360
def dhue(h, h0): return np.abs((h - h0 + 180) % 360 - 180)

def load(n, game_dir):
    rgba = np.array(Image.open(os.path.join(CHAR, n + '.webp')).convert('RGBA')); W = rgba.shape[0]
    L = lab(rgba[..., :3].astype(float))
    gm = (np.array(Image.open(os.path.join(game_dir, n + '.mask.png')).convert('L')) > 127) & (rgba[..., 3] >= 10)
    game = np.array(Image.open(os.path.join(game_dir, n + '.png')).convert('RGBA'))
    return rgba, L, gm, game

def skin_ref(L, gm, rgba):
    """Tenin kendi tonu: oyun maskesinin doygun (C ≥ kromaAlt) pikselleri; yoksa bütün maske."""
    C = np.hypot(L[..., 1], L[..., 2]); s = gm & (C >= P['kromaAlt'])
    if s.sum() < 40: s = gm
    return circ_mean(L, s), float(np.median(C[s]))

def proposal(rgba, L, gm):
    """Elle maske önerisi: ton (±tonFark) ve kroma (≥ max(kromaAlt, kromaOran × ten kroması)) koşulu, 3×3 kapama, küçük bileşen atma,
    küçük delik doldurma; göz (sarı/doygun sıcak) hariç."""
    op = rgba[..., 3] >= 10; C = np.hypot(L[..., 1], L[..., 2]); h = hue(L)
    h0, c0 = skin_ref(L, gm, rgba)
    cand = op & (L[..., 0] > P['Lmin']) & (dhue(h, h0) <= P['tonFark']) & (C >= max(P['kromaAlt'], P['kromaOran'] * c0))
    cand = ero(dil(cand)) & op
    keep = np.zeros_like(cand)
    for c in comps(cand):
        if len(c) >= P['minBilesen']: keep[c[:, 0], c[:, 1]] = True
    for c in comps(fill_holes(keep) & ~keep):
        if len(c) <= P['delik']: keep[c[:, 0], c[:, 1]] = True
    eye = (L[..., 2] > 25) & (C > 35) & (h > 40) & (h < 110)
    return keep & op & ~eye & (dhue(h, h0) <= P['tonFark'] + 10), h0, c0

def on_bg(a, scale=1, box=None):
    al = a[..., 3:4] / 255.0; im = (a[..., :3] * al + BG * (1 - al)).astype(np.uint8); p = Image.fromarray(im)
    if box: p = p.crop(box)
    return p.resize((p.width * scale, p.height * scale), Image.NEAREST) if scale > 1 else p

def overlay(a, m, col=(255, 0, 220)):
    al = a[..., 3:4] / 255.0; im = a[..., :3] * al + BG * (1 - al); im[m] = im[m] * 0.35 + np.array(col) * 0.65
    return Image.fromarray(im.astype(np.uint8))

def label(img, t, xy=(4, 4)): ImageDraw.Draw(img).text(xy, t, fill=(235, 236, 240))

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    game_dir = sys.argv[1]; os.makedirs(OUT_EL, exist_ok=True); os.makedirs(OUT_KT, exist_ok=True)
    names = sorted(f[:-4] for f in os.listdir(game_dir) if f.endswith('.png') and not f.endswith('.mask.png'))
    abyssal = SPEC['lineages']['abyssal']['lch']
    # ---- 1) üç jetonun elle maske önerisi ----
    el = {}
    for n in ELLE:
        rgba, L, gm, game = load(n, game_dir); pm, h0, c0 = proposal(rgba, L, gm)
        if n in KUTU:
            pm = gm.copy(); off = dhue(hue(L), h0) > 12
            for x0, y0, x1, y1 in KUTU[n].get('haric', []): pm[y0:y1, x0:x1] = False
            for x0, y0, x1, y1 in KUTU[n].get('tonHaric', []): pm[y0:y1, x0:x1] &= ~off[y0:y1, x0:x1]
        new = tb.lch_tint(rgba, pm, abyssal, L)
        Image.fromarray((pm * 255).astype(np.uint8), 'L').save(os.path.join(OUT_EL, f'oneri-maske-{n}.png'))
        S = 2; tiles = [(on_bg(rgba), 'orijinal'), (overlay(rgba, gm), 'şimdiki maske (TG1 sonrası)'), (overlay(rgba, pm), 'önerilen elle maske'),
                        (on_bg(game), 'oyun şimdi (Abyssal)'), (on_bg(new), 'öneriyle (Abyssal)')]
        pg = Image.new('RGB', (len(tiles) * 256 * S, 256 * S + 22), tuple(BG))
        for i, (im, t) in enumerate(tiles): pg.paste(im.resize((256 * S, 256 * S), Image.NEAREST), (i * 256 * S, 22)); label(pg, t, (i * 256 * S + 4, 4))
        pg.save(os.path.join(OUT_EL, f'{n}.png'))
        el[n] = {'tonH': round(h0), 'tenKroma': round(c0, 1), 'simdikiMaske': int(gm.sum()), 'oneri': int(pm.sum()),
                 'cikan': int((gm & ~pm).sum()), 'eklenen': int((pm & ~gm).sum()), 'elleKutu': KUTU.get(n)}
    # ---- 2) aynı sorunu taşıyan jetonlar: maskede düşük kroma (kıyafet/gri kumaş) ya da ten tonu dışı doygun piksel ----
    liste = []; koyu = []
    for n in names:
        rgba, L, gm, game = load(n, game_dir)
        if gm.sum() < 30: continue
        C = np.hypot(L[..., 1], L[..., 2]); h = hue(L); h0, c0 = skin_ref(L, gm, rgba)
        low = gm & (C < P['dusukKroma'])
        # komşu-maske: düşük kromalı maske bileşeninin bitişik maskesi doygun ten (≥ kromaKomsu) değilse kıyafet sayılır
        lowc = 0
        for c in comps(low):
            if len(c) < 20: continue
            cm = np.zeros_like(gm); cm[c[:, 0], c[:, 1]] = True; ring = dil(dil(cm)) & ~cm & gm
            if ring.sum() == 0 or np.median(C[ring]) < KROMA_KOMSU: lowc += len(c)
        off = int((gm & (C >= P['dusukKroma']) & (dhue(h, h0) > 20)).sum())
        if (lowc >= P['kiyafetPxSiki'] and lowc >= P['kiyafetOranSiki'] * gm.sum()) or off >= P['tonDisiSiki']:
            liste.append({'jeton': n, 'maske': int(gm.sum()), 'dusukKromaKiyafet': int(lowc), 'oran': round(lowc / gm.sum(), 2), 'tonDisi': off, 'tonH': round(h0)})
        # ---- 3) yarı boyalı: kendi ten tonundaki (±koyuTonFark, C ≥ koyuKromaMin) ve maskeye bağlı bölgenin boyanmayan payı ----
        op = rgba[..., 3] >= 10
        skin = op & (L[..., 0] > 12) & (L[..., 0] < 85) & (dhue(h, h0) <= P['koyuTonFark']) & (C >= P['koyuKromaMin'])
        reg = np.zeros_like(gm)
        for c in comps(ero(dil(skin | gm)) & op):
            if gm[c[:, 0], c[:, 1]].any() and len(c) >= 40: reg[c[:, 0], c[:, 1]] = True
        reg &= skin | gm
        unp = reg & ~gm
        if unp.sum() >= P['yariPx'] and unp.sum() >= P['yariOran'] * reg.sum():
            dark = unp & ((C < P['griKroma']) | (L[..., 0] < P['koyuL']))
            koyu.append({'tur': 'koyu/gri' if dark.sum() >= P['koyuPay'] * unp.sum() else 'parlak/palet dışı', 'koyuPay': round(dark.sum() / unp.sum(), 2),'jeton': n, 'bolge': int(reg.sum()), 'boyanmayan': int(unp.sum()), 'oran': round(unp.sum() / reg.sum(), 2), 'tenKroma': round(c0, 1),
                         'tonH': round(h0), 'boyanmayanKromaMedyan': round(float(np.median(C[unp])), 1), 'boyanmayanLMedyan': round(float(np.median(L[..., 0][unp])), 1),
                         'maskeKromaMedyan': round(float(np.median(C[gm])), 1), '_reg': reg})
    liste.sort(key=lambda r: -(r['dusukKromaKiyafet'] + r['tonDisi']))
    koyu.sort(key=lambda r: (r['tur'] != 'koyu/gri', -r['oran']))
    # 8× önce/sonra (sonra = öneri: maske ∪ bölge, oyunun lch formülü); en çok boyanmayan 8 jeton
    for r in [x for x in koyu if x['tur'] == 'koyu/gri'][:8]:
        n = r['jeton']; rgba, L, gm, game = load(n, game_dir); reg = r['_reg']
        new = tb.lch_tint(rgba, gm | reg, abyssal, L)
        ys, xs = np.nonzero(reg & ~gm); cy, cx = int(np.median(ys)), int(np.median(xs)); x0 = min(max(cx - 24, 0), 208); y0 = min(max(cy - 24, 0), 208)
        box = (x0, y0, x0 + 48, y0 + 48); Z = 8
        tiles = [(on_bg(rgba), 'orijinal'), (on_bg(game), 'oyun şimdi'), (overlay(rgba, reg & ~gm, (0, 230, 255)), 'boyanmayan ten (camgöbeği)'), (on_bg(new), 'öneri: ten bölgesi')]
        pg = Image.new('RGB', (4 * 48 * Z, 48 * Z + 256 + 44), tuple(BG))
        for i, (im, t) in enumerate(tiles):
            pg.paste(im.crop(box).resize((48 * Z, 48 * Z), Image.NEAREST) if im.size[0] == 256 else im, (i * 48 * Z, 22)); label(pg, t + ' (8×)', (i * 48 * Z + 4, 4))
            pg.paste(im.resize((256, 256), Image.NEAREST), (i * 48 * Z + 64, 48 * Z + 30))
        pg.save(os.path.join(OUT_KT, f'{n}.png'))
    for r in koyu: r.pop('_reg')
    json.dump({'not': 'scripts/tiefling-kalan.py', 'parametre': P, 'kromaKomsu': KROMA_KOMSU, 'elleMaske': el, 'kiyafetListesi': liste},
              open(os.path.join(OUT_EL, 'olcum.json'), 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)
    json.dump({'not': 'scripts/tiefling-kalan.py', 'parametre': P, 'yariBoyali': koyu},
              open(os.path.join(OUT_KT, 'olcum.json'), 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)
    print('elle', json.dumps(el, ensure_ascii=False)); print('kıyafet', len(liste), [r['jeton'][9:] for r in liste])
    print('yarı boyalı', len(koyu), 'koyu/gri', [(r['jeton'][9:], r['oran'], r['koyuPay']) for r in koyu if r['tur'] == 'koyu/gri'])
    # koyu/gri listesinin hepsi için küçük kontak sayfası (oyun şimdi | boyanmayan ten camgöbeği)
    kg = [r['jeton'] for r in koyu if r['tur'] == 'koyu/gri']; S = 160
    if kg:
        sh = Image.new('RGB', (6 * S, -(-len(kg) // 3) * (S + 16)), tuple(BG))
        for i, n in enumerate(kg):
            rgba, L, gm, game = load(n, game_dir); C = np.hypot(L[..., 1], L[..., 2]); h0, c0 = skin_ref(L, gm, rgba); h = hue(L); op = rgba[..., 3] >= 10
            skin = op & (L[..., 0] > 12) & (L[..., 0] < 85) & (dhue(h, h0) <= P['koyuTonFark']) & (C >= P['koyuKromaMin']); reg = np.zeros_like(gm)
            for c in comps(ero(dil(skin | gm)) & op):
                if gm[c[:, 0], c[:, 1]].any() and len(c) >= 40: reg[c[:, 0], c[:, 1]] = True
            x, y = (i % 3) * 2 * S, (i // 3) * (S + 16)
            sh.paste(on_bg(game).resize((S, S), Image.NEAREST), (x, y)); sh.paste(overlay(rgba, reg & skin & ~gm, (0, 230, 255)).resize((S, S), Image.NEAREST), (x + S, y))
            label(sh, n[9:], (x + 2, y + S + 1))
        sh.save(os.path.join(OUT_KT, 'liste-koyu-gri.png'))
