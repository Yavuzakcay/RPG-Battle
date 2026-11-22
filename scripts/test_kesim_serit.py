#!/usr/bin/env python3
"""KESIM-DUZELT (2026-11-22): kesim betiklerinin şerit silme testleri (`toplu-kesim.py` `grid_lines`, `drop_lines`, `trim_lines`,
`components_of_sheet`; `cc-kesim.py` `keyed_rgba`).

Kural: şerit silme yalnız sayfanın GERÇEK ızgara çizgisi üstündeki koyu şeridi siler; figürün kendi ince uzun parçaları (kontur, ayak
tabanı, kalkan/kanat kenarı, kabza, bilek, asa, zincir) kalır; ızgara artığı ve zemin rengi kenar yine silinir.

Sentetik sayfalar kodla üretilir (görsel dosyası yok; geçici PNG yalnız `components_of_sheet` yol istediği için). Bilinen vakalar
(Human Fighter GR, Warlock WL-1/2/4, Gariban bileği, Wizard Dragonborn ızgara artığı, yeşil zemin kenarı) yalnız ham sayfalar varken
çalışır (`CC_HAM`, yoksa assets-ham/karakter; wip/karakter-ham dalının karakter/ + eksikler/ birleşimi); yoksa atlanır.
Çalıştırma: python -X utf8 scripts/test_kesim_serit.py   (vitest sarmalayıcı: src/data/kesimSerit.test.ts)"""
import importlib.util, os, sys, tempfile, unittest
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); os.chdir(ROOT)

def _load(name, path):
    s = importlib.util.spec_from_file_location(name, path); m = importlib.util.module_from_spec(s); s.loader.exec_module(m); return m

tk = _load('tk_test', 'scripts/toplu-kesim.py')
RAW = os.environ.get('CC_HAM', 'assets-ham/karakter')
MAG, GRN, GRID, OUTL = (255, 0, 255), (0, 255, 0), (22, 22, 24), (52, 30, 40)

def blank(W=1200, H=900, bg=MAG):
    a = np.zeros((H, W, 3), np.uint8); a[:] = bg; return a

def grid(a, cols=4, rows=3, t=10):
    H, W = a.shape[:2]
    for i in range(cols + 1): x = min(W - t, max(0, round(i * W / cols) - t // 2)); a[:, x:x + t] = GRID
    for j in range(rows + 1): y = min(H - t, max(0, round(j * H / rows) - t // 2)); a[y:y + t, :] = GRID
    return a

def body(a, x0, y0, w, h, fill=(200, 150, 100), t=4):
    """Koyu konturlu dolu gövde (pixel art figürü gibi)."""
    a[y0:y0 + h, x0:x0 + w] = OUTL; a[y0 + t:y0 + h - t, x0 + t:x0 + w - t] = fill

def rgba_of(a, x0, y0, x1, y1, bg=MAG):
    """Kırpık: zemin rengi saydam (anahtar), geri kalan opak."""
    c = a[y0:y1, x0:x1]; al = ~np.all(c == np.array(bg, np.uint8), axis=2)
    return np.dstack([c, (al * 255).astype(np.uint8)])

class Kurallar(unittest.TestCase):
    def test_long_runs_binary_opening_ile_ayni(self):
        r = np.random.default_rng(7).random((60, 90)) > 0.3
        for L in (1, 2, 5, 9, 40):
            for ax in (0, 1):
                st = np.ones((1, L) if ax == 1 else (L, 1), bool)
                self.assertTrue((tk.long_runs(r, L, ax) == ndi.binary_opening(r, structure=st)).all(), (L, ax))

    def test_grid_lines_izgarayi_bulur_figurun_koyu_asasini_bulmaz(self):
        a = grid(blank()); body(a, 120, 60, 70, 200)
        a[40:400, 750:758] = GRID              # figürün siyah asası: 360 px dikey koyu koşu, hücrenin ortasında (sınırlar x = 600, 900)
        g = tk.grid_lines(a, (4, 3))
        self.assertGreater(g[:, 596:604].mean(), 0.9)         # iç dikey çizgi (x = 600)
        self.assertGreater(g[296:304, :].mean(), 0.9)         # iç yatay çizgi (y = 300)
        self.assertEqual(int(g[60:260, 120:190].sum()), 0)    # figür gövdesi (kontur dahil) değil
        self.assertEqual(int(g[40:290, 750:758].sum() + g[310:400, 750:758].sum()), 0)    # figürün siyah asası değil (y=300 çizgisinin kesiştiği satırlar hariç)
        a2 = blank(); a2[40:400, 750:758] = GRID              # ızgarasız sayfada tek uzun koyu asa: kapsam yok
        self.assertEqual(int(tk.grid_lines(a2, (4, 3)).sum()), 0)
        self.assertEqual(int(tk.grid_lines(a2).sum()), 0)

    def test_izgarasiz_sayfada_bos(self):
        a = blank(bg=GRN); body(a, 100, 100, 80, 220)
        self.assertEqual(int(tk.grid_lines(a, (4, 3)).sum()), 0)

    def test_trim_kutu_kenarindaki_figur_konturunu_silmez(self):
        """Ayak tabanı (alt kenar), kalkan kenarı (yan), saç tepesi (üst): eski trim_lines bunları ızgara artığı sanıp siliyordu."""
        a = blank(W=400, H=400); body(a, 100, 60, 120, 260)
        a[316:322, 90:230] = OUTL          # ayak tabanı: kutunun alt bandında 140 px yatay koyu şerit
        a[120:240, 216:222] = OUTL         # kalkan kenarı: sağ bantta 120 px dikey koyu şerit
        crop = rgba_of(a, 90, 60, 230, 322)
        for g in (np.zeros(crop.shape[:2], bool), None):
            out = tk.trim_lines(crop, g)
            self.assertEqual(int(((crop[..., 3] > 0) & (out[..., 3] == 0)).sum()), 0)

    def test_trim_izgara_artigini_siler(self):
        """Figürün değdiği ızgara çizgisi parçası (kutunun alt bandında, sayfa ızgarasının üstünde) silinir, ayak konturu kalır."""
        a = blank(W=1200, H=900); grid(a)
        body(a, 330, 60, 120, 236)                       # ayakları 1. satırın alt çizgisine (y ≈ 295–305) değiyor
        crop_box = (300, 55, 480, 305)
        crop = rgba_of(a, *crop_box)
        g = tk.grid_lines(a, (4, 3))[crop_box[1]:crop_box[3], crop_box[0]:crop_box[2]]
        out = tk.trim_lines(crop, g)
        line_rows = slice(295 - crop_box[1], 305 - crop_box[1])
        self.assertEqual(int((out[line_rows, :, 3] > 0).sum()), 0)                 # çizgi gitti
        self.assertGreater(int((out[200:230, 40:140, 3] > 0).sum()), 2500)           # gövde duruyor

    def test_drop_lines_renk_ve_izgara_kosulu(self):
        a = grid(blank(W=1200, H=900)); body(a, 100, 40, 90, 220)
        a[60:250, 210:216] = (150, 100, 50)     # renkli asa (kahverengi), gövdeden ayrık, ince uzun
        a[60:250, 240:246] = (30, 28, 34)       # koyu zincir/kamçı: koyu ama ızgara dışında
        fg = tk.key_sheet(a, tk.sheet_bg(a)); g = tk.grid_lines(a, (4, 3))
        ln = tk.drop_lines(fg, a, g)
        self.assertEqual(int(ln[60:250, 210:216].sum()), 0)
        self.assertEqual(int(ln[60:250, 240:246].sum()), 0)
        self.assertGreater(int(ln[:, 596:604].sum()), 0)          # ince ızgara çizgisi silinecekler arasında

class SentetikSayfa(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        a = grid(blank(W=2400, H=1800), t=12)
        cls.boxes = {}
        for n in range(1, 13):
            c, r = (n - 1) % 4, (n - 1) // 4; x0, y0 = c * 600 + 200, r * 600 + 80
            body(a, x0, y0, 200, 420); cls.boxes[n] = (x0, y0)
        x0, y0 = cls.boxes[5]
        a[y0 + 200:y0 + 206, x0 - 70:x0] = OUTL                        # kabza: gövdenin solunda koyu yatay şerit (kutunun sol kenarı)
        a[y0 + 420:y0 + 426, x0 - 10:x0 + 210] = OUTL                  # ayak tabanı (kutunun alt kenarı)
        x0, y0 = cls.boxes[6]
        a[y0 - 60:y0 + 300, x0 + 230:x0 + 236] = (140, 95, 45)          # renkli asa, gövdeden ayrık
        a[y0 + 100:y0 + 104, x0 + 200:x0 + 230] = (140, 95, 45)         # asayı tutan kol
        x0, y0 = cls.boxes[7]
        a[y0 + 420:y0 + 520, x0 + 40:x0 + 160] = (200, 150, 100)        # bacak: hücrenin alt ızgara çizgisine (y = 1200) dek iner
        cls.a = a
        cls.tmp = tempfile.NamedTemporaryFile(suffix='.png', delete=False); cls.tmp.close()
        Image.fromarray(a).save(cls.tmp.name)
        cls.comps = tk.components_of_sheet(cls.tmp.name, 'gariban')

    @classmethod
    def tearDownClass(cls):
        os.unlink(cls.tmp.name)

    def alpha_at(self, n, x0, y0, x1, y1):
        rgba, (bx0, by0, bx1, by1), _ = self.comps[n]
        m = np.zeros(self.a.shape[:2], bool); m[by0:by1, bx0:bx1] = rgba[..., 3] > 0
        return m[y0:y1, x0:x1]

    def test_bütün_hücreler_bulunur_elle_yok(self):
        self.assertEqual(sorted(self.comps), list(range(1, 13)))
        self.assertFalse(any(w.startswith('ELLE') for v in self.comps.values() for w in v[2]))

    def test_kabza_ve_ayak_tabani_kalir(self):
        x0, y0 = self.boxes[5]
        self.assertGreater(self.alpha_at(5, x0 - 60, y0 + 201, x0 - 5, y0 + 205).mean(), 0.9)       # kabza (yarık yok)
        self.assertGreater(self.alpha_at(5, x0 + 20, y0 + 421, x0 + 190, y0 + 425).mean(), 0.9)     # ayak tabanı

    def test_renkli_asa_kalir(self):
        x0, y0 = self.boxes[6]
        self.assertGreater(self.alpha_at(6, x0 + 231, y0 - 50, x0 + 235, y0 + 290).mean(), 0.9)

    def test_izgara_artigi_kirpikta_kalmaz(self):
        g = tk.grid_lines(self.a, (4, 3))
        for n, (rgba, (bx0, by0, bx1, by1), _) in self.comps.items():
            self.assertEqual(int(((rgba[..., 3] > 0) & g[by0:by1, bx0:bx1]).sum()), 0, f'hücre {n}')
        x0, y0 = self.boxes[7]
        self.assertGreater(self.alpha_at(7, x0 + 50, y0 + 430, x0 + 150, y0 + 510).mean(), 0.9)       # bacak (renkli) duruyor

def straight_gap(op, at, yon, win=8, kal=6):
    """Jetonda `at` satırının (yatay) / sütununun (dikey) ±win çevresindeki en uzun DÜZ kesim yarığı (jeton-denetim ölçüsü): ardışık
    sütunlarda üst ve alt kenarı aynı (±1) olan, iki ucu opak, 2–kal px kalın saydam bölüm. → uzunluk (px)."""
    m = op if yon == 'yatay' else op.T
    segs = []
    for x in range(m.shape[1]):
        col = m[:, x]; ys = np.where(col)[0]; s = []
        if len(ys):
            d = np.diff(np.concatenate([[1], col[ys[0]:ys[-1] + 1].astype(np.int8), [1]]))
            st = np.where(d == -1)[0]; en = np.where(d == 1)[0]
            s = [(ys[0] + a, ys[0] + b) for a, b in zip(st, en) if 2 <= b - a <= kal and at - win <= ys[0] + a <= at + win]
        segs.append(s)
    best = 0
    for x in range(len(segs)):
        for sg in segs[x]:
            n, cur = 1, sg
            while x + n < len(segs):
                nxt = next((t for t in segs[x + n] if abs(t[0] - cur[0]) <= 1 and abs(t[1] - cur[1]) <= 1), None)
                if nxt is None: break
                cur, n = nxt, n + 1
            best = max(best, n)
    return best

@unittest.skipUnless(os.path.isdir(RAW), f'ham klasör yok ({RAW})')
class BilinenVakalar(unittest.TestCase):
    """Ham sayfadan sayfa ölçeğiyle çizilen jetonda JETON-DENETIM'in ölçtüğü düz kesim yarığı artık yok; ızgara artığı ve zemin rengi kenar
    yine silinmiş. Satır/sütun eski jetonun koordinatı (JETON-DENETIM 1a; Human Fighter GR 18a311bc öncesi ölçü)."""
    cache = {}
    VAKALAR = [('gariban-male-human.jpg', 'gariban', 5, 'yatay', 162, 'human-erkek-fighter-GR kabza-bilek'),
               ('warlock-male-human.jpg', 'warlock', 1, 'yatay', 236, 'human-erkek-warlock-WL-1 zincir'),
               ('warlock-male-human.jpg', 'warlock', 2, 'yatay', 230, 'human-erkek-warlock-WL-2 ayak tabanı'),
               ('warlock-male-dwarf.jpg', 'warlock', 4, 'yatay', 235, 'dwarf-erkek-warlock-WL-4'),
               ('gariban-male-dwarf.jpg', 'gariban', 1, 'yatay', 225, 'dwarf-erkek-barbarian-GR'),
               ('gariban-male-human.jpg', 'gariban', 4, 'yatay', 161, 'human-erkek-druid-GR'),
               ('gariban-male-halfling.jpg', 'gariban', 5, 'dikey', 213, 'halfling-erkek-fighter-GR kalkan kenarı'),
               ('monk-female-dragonborn.jpg', 'monk', 8, 'yatay', 93, 'dragonborn-kadin-monk-ID8 bo sopası'),
               ('warlock-male-human.jpg', 'warlock', 6, 'dikey', 151, 'human-erkek-warlock-WL-6')]

    def comps(self, page, layout):
        p = f'{RAW}/{page}'
        if not os.path.exists(p): self.skipTest(f'{page} yok')
        if (page, layout) not in self.cache: self.cache[(page, layout)] = tk.components_of_sheet(p, layout)
        return self.cache[(page, layout)]

    def token(self, page, layout, n):
        """Toplu kesimin sayfa ölçeği (normal hücrelerin en büyük kırpığı 240 / 252) ve `render` yerleşimi."""
        comps = self.comps(page, layout)
        ok = {k: v for k, v in comps.items() if k <= len(tk.CLASSES[layout][3]) and not any(w.startswith('ELLE') for w in v[2])}
        norm = [k for k in ok if tk.TALL.get(layout) != k]
        sc = min(tk.FIG_H / max(ok[k][0].shape[0] for k in norm), (tk.SIZE - 4) / max(ok[k][0].shape[1] for k in norm))
        rgba = comps[n][0]
        if tk.TALL.get(layout) == n: sc = min(tk.FIG_H / rgba.shape[0], (tk.SIZE - 4) / rgba.shape[1])
        return np.asarray(tk.render(rgba, tk.bbox(rgba), sc, rgba.shape[1] / 2)[0])

    def test_bilinen_kesim_yariklari_kapanir(self):
        for page, layout, n, yon, at, ad in self.VAKALAR:
            with self.subTest(ad):
                tok = self.token(page, layout, n)
                self.assertLess(straight_gap(tok[..., 3] > 100, at, yon), 10, ad)

    def test_wizard_dragonborn_izgara_artigi_silinir(self):
        # botun durduğu alt ızgara çizgisi (eski kesimde de silinen tek gerçek artık; 10 sayfada 562 trim adayının biri)
        page = 'wizard-male-dragonborn-a.jpg'; comps = self.comps(page, 'wizard_a')
        img = np.asarray(Image.open(f'{RAW}/{page}').convert('RGB')); g = ndi.binary_dilation(tk.grid_lines(img, (4, 2)), iterations=1)
        for k, (rgba, (x0, y0, x1, y1), _) in comps.items():
            self.assertEqual(int(((rgba[..., 3] > 0) & g[y0:y1, x0:x1]).sum()), 0, f'hücre {k}')

    def test_yesil_zemin_kenari_temiz(self):
        for page in ('gariban-male-gnome.jpg', 'gariban-female-elf.jpg'):
            for n, (rgba, _, _) in self.comps(page, 'gariban').items():
                al = rgba[..., 3] > 0; edge = al & ~ndi.binary_erosion(al)
                rgb = rgba[..., :3].astype(int)
                green = edge & (rgb[..., 1] - np.maximum(rgb[..., 0], rgb[..., 2]) > 120)
                self.assertLess(int(green.sum()), 40, f'{page} hücre {n}')

if __name__ == '__main__':
    unittest.main(verbosity=2)
