#!/usr/bin/env python3
"""Cleric ID9 halka: onaylı 18 adayı public/characters/'a yazar (2026-11-19; `python3 scripts/cleric-id9-yaz.py`).
Kaynak docs/sabah/cleric-id9-halka/aday/<jeton>.png (scripts/cleric-id9-halka.py 3. tur; elf kadın 0,86 ölçekli büyük halka, Tiefling kadın yeni çizim).
Dragonborn erkek: başın çevresindeki sönük yeşil kırıntılar (eski halka artığı: sol boynuz yanı, başın sağı) temizlenir: baş bölgesinde, yeni halka
kutusu dışında, yeşil baskın (g > max(r, b) + 40, g > 90) ya da yarı saydam (alfa < 128) yeşilimsi pikseller. Koyu yeşil dış çizgi (g < 60) kalır.
96 px küçük kopya + öncelik defteri (`data/cc-kesim-kaynak.json`, kaynak `duzeltme`)."""
import importlib.util, json, numpy as np
from PIL import Image
_s = importlib.util.spec_from_file_location('cc', 'scripts/cc-kesim.py'); cc = importlib.util.module_from_spec(_s); _s.loader.exec_module(cc)
SRC = 'docs/sabah/cleric-id9-halka'
RACES = ['human', 'elf', 'dwarf', 'orc', 'gnome', 'goliath', 'halfling', 'tiefling', 'dragonborn']

def clean_green(a, ring_box):
    x0, y0, x1, y1 = ring_box
    b = a.copy(); r, g, bl, al = [b[..., i].astype(int) for i in range(4)]
    reg = np.zeros(al.shape, bool); reg[25:106, 70:206] = True; reg[95:, 195:] = False          # baş bölgesi (çaydanlık buharı hariç)
    reg[max(0, y0 - 1):y1 + 1, max(0, x0 - 1):x1 + 1] = False                                 # yeni halka
    bright = (g > np.maximum(r, bl) + 40) & (g > 90)
    faint = (al < 128) & (g > np.maximum(r, bl) + 8)
    m = reg & (al > 0) & (bright | faint)
    b[m] = 0
    return b, int(m.sum())

def main():
    rap = json.load(open(f'{SRC}/rapor.json'))['jetonlar']
    L = cc.ledger(); rep = {'yazilan': [], 'ezilmedi': []}; notes = {}
    for race in RACES:
        for g in ('erkek', 'kadin'):
            n = f'{race}-{g}-cleric-ID9'
            a = np.array(Image.open(f'{SRC}/aday/{n}.png').convert('RGBA'))
            if n == 'dragonborn-erkek-cleric-ID9':
                a, k = clean_green(a, rap[n]['halka_kutu']); notes[n] = f'yeşil kırıntı silindi: {k} px'
            dosya = 'tiefling-kadin-cleric-ID9-yeni.jpg + halka' if n == 'tiefling-kadin-cleric-ID9' else 'cleric-id9-halka/aday'
            cc.write_token(L, n, Image.fromarray(a, 'RGBA'), 'duzeltme', dosya, 9, rep)
    cc.save_ledger(L); cc.oncelik_rapor(L)
    print(len(rep['yazilan']), 'yazıldı', rep['ezilmedi'], notes)

if __name__ == '__main__': main()
