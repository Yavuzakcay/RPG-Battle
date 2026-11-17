#!/usr/bin/env python3
"""Jeton bağlama teşhisi: ırk × sınıf × cinsiyet × alt soy/alt sınıf için oyunun çözümü (data/<sınıf>-jeton.json) ve dosya/maske durumu.
Çıktı: docs/sabah/baglama-eksik.csv (ırk, sınıf, cinsiyet, alt soy, sebep). Celestial yalnız raporlanır, dokunulmaz."""
import csv, json, os
from collections import Counter
C = 'public/characters'
RACES = ['dragonborn', 'dwarf', 'elf', 'gnome', 'goliath', 'halfling', 'human', 'orc', 'tiefling', 'celestial']
CLASSES = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard']
G = {'erkek': 'male', 'kadin': 'female'}
hand = json.load(open('data/soy-maske-rapor.json'))['sprites']
hs = json.load(open('data/jeton-hucre-sirasi.json'))
have = lambda n: os.path.exists(f'{C}/{n}.webp')
masked = lambda n: os.path.exists(f'{C}/maske/{n}.png') or os.path.exists(f'{C}/maske-el/{n}.png')
rows = []; stat = Counter()
for cls in CLASSES:
    T = json.load(open(f'data/{cls}-jeton.json'))
    for race in RACES:
        for g in ('erkek', 'kadin'):
            gen = f'{race}-{G[g]}-{cls}'
            if not have(gen): rows.append((race, cls, g, 'sınıf-genel', 'jeton dosyası yok'))
            elif not masked(gen) and race not in ('orc', 'dwarf', 'halfling'): rows.append((race, cls, g, 'sınıf-genel', 'maske yok'))
            gr = f'{race}-{g}-{cls}-GR'
            if not have(gr): rows.append((race, cls, g, 'Gariban (GR)', 'jeton dosyası yok'))
            else:
                stat['GR dosya'] += 1
                bound_gr = race != 'celestial' and g in T['irklar'].get(race, []) and os.environ.get('SONRA') == '1'
                if not bound_gr: rows.append((race, cls, g, 'Gariban (GR)', ('Celestial: hale işi ayrı, bağlanmadı' if race == 'celestial' and os.environ.get('SONRA') == '1' else 'dosya var, oyunda hiçbir yerden çözülmüyor (eşleme yok)') + ('' if masked(gr) or race in ('orc', 'dwarf', 'halfling') else '; maske yok')))
                elif not masked(gr) and race not in ('orc', 'dwarf', 'halfling'): rows.append((race, cls, g, 'Gariban (GR)', 'bağlı, ten/soy maskesi çıkmadı (boyanmaz: kabuk/örtülü/geniş alan)'))
            for sub, cell in T['altSiniflar'].items():
                only = (T.get('cinsiyet') or {}).get(sub)
                if only and only != g: continue
                f = f'{race}-{g}-{cls}-{cell}'
                bound = g in T['irklar'].get(race, [])
                n = int(cell.replace('WL-', '').replace('SC-', '').replace('ID', '').replace('WZ-A', '').replace('WZ-B', '')) if False else None
                if not have(f):
                    kos = hs['bos'].get(cls, {}).get(g, [])
                    rows.append((race, cls, g, sub, 'jeton dosyası yok' + (' (kaynak sayfada boş hücre)' if any(cell.endswith(str(k)) for k in kos) else '')))
                    continue
                stat['dosya var'] += 1
                if not bound: rows.append((race, cls, g, sub, 'dosya var, ırk data/%s-jeton.json irklar listesinde yok (bağlanmamış)' % cls)); stat['bağsız'] += 1; continue
                if not masked(f) and race not in ('orc', 'dwarf', 'halfling', 'celestial'):
                    rows.append((race, cls, g, sub, ('bağlı, ten/soy maskesi çıkmadı (boyanmaz: kabuk/örtülü/geniş alan)' if os.environ.get('SONRA') == '1' else 'bağlı, ten/soy maskesi yok (renk uygulanmaz)'))); stat['maskesiz'] += 1
with open('docs/sabah/baglama-eksik-sonra.csv' if os.environ.get('SONRA') == '1' else 'docs/sabah/baglama-eksik.csv', 'w', newline='') as fh:
    w = csv.writer(fh); w.writerow(['irk', 'sinif', 'cinsiyet', 'alt_soy', 'sebep']); w.writerows(rows)
print(len(rows), stat); print(Counter((r[0], r[4].split(';')[0][:40]) for r in rows).most_common(30))
