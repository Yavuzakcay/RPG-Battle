"""
K49 C6: ana haritada (dünya / Serüven) karşılığı olmayan savaş haritaları. Bir harita "dünyada" sayılır: Serüven düğümünün
senaryosu ya da sefer durağı onu açıyorsa, yerleşim/hapishane/şehir görünümü verisinde ya da Serüven bağlantısında
(koridor) geçiyorsa. Yeraltı haritaları (bölge derinlikler/yeralti ya da yeraltı bölgesinin altı) listelenmez, kalır.
Başka yerde kullanılan (sefer, sim senaryosu, test, vitrin) ayrı listelenir; hiçbir yerde geçmeyen "yetim"dir.

    python scripts/k49-yetim-haritalar.py   → harita/belgeler/ana-haritada-olmayanlar.md
"""
import glob
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *p: os.path.join(ROOT, *p)
J = lambda *p: json.load(open(P(*p), encoding='utf-8'))


def strings(x):
    if isinstance(x, str):
        yield x
    elif isinstance(x, dict):
        for k, v in x.items():
            yield k
            yield from strings(v)
    elif isinstance(x, list):
        for v in x:
            yield from strings(v)


maps = {}
for f in sorted(glob.glob(P('harita', '*', '*.json'))):
    if os.sep + 'belgeler' + os.sep in f or os.sep + '_ortak' + os.sep in f:
        continue
    d = json.load(open(f, encoding='utf-8'))
    if 'id' in d and 'tiles' in d or 'variants' in d:
        maps[d['id']] = {'dosya': os.path.relpath(f, ROOT), 'bolge': d.get('bolge', ''), 'gizli': d.get('gizli', False), 'vitrin': d.get('vitrin', False)}

regions = J('harita', '_ortak', 'harita-bolgeleri.json')
under = {'derinlikler', 'yeralti'}
for b in regions.get('bolgeler', []):
    if isinstance(b, dict) and b.get('ust') in under:
        under.add(b.get('id'))

scen = {s['id']: (s.get('map') or {}).get('mapId') for s in J('data', 'sim-senaryolar.json')['scenarios']}
sefer = J('data', 'seferler.json')['seferler']
sefer_node = {f"{s['id']}:{n['id']}": scen.get(n.get('scenario')) for s in sefer for n in s.get('nodes', [])}

world = {}
def mark(mid, why):
    if mid in maps:
        world.setdefault(mid, set()).add(why)

seruven = J('data', 'seruven.json')
for pg in seruven['pages']:
    for n in pg['nodes']:
        if n.get('scenario'):
            mark(scen.get(n['scenario']), f"Serüven {pg['id']}/{n['id']}")
        if n.get('sefer'):
            for k, v in sefer_node.items():
                if k.startswith(n['sefer'] + ':') or k == n['sefer']:
                    mark(v, f"Serüven {pg['id']}/{n['id']} (sefer)")
def walk(x, path=''):
    if isinstance(x, dict):
        for k, v in x.items():
            yield from walk(v, f'{path}.{k}')
    elif isinstance(x, list):
        for v in x:
            yield from walk(v, f'{path}[]')
    elif isinstance(x, str):
        yield path, x

# Yalnızca harita alanları (sayfa kimlikleri col/dag/... klasik harita kimlikleriyle çakışır).
MAP_KEYS = ('.mapId', '.kapilar[].to', '.harita', '.map', '.haritalar[]', '.girisler[].to')
for src in ('data/seruven.json', 'data/yerlesim.json', 'data/hapishane.json', 'data/sehir-gorunum.json'):
    if os.path.exists(P(src)):
        for path, s in walk(J(*src.split('/'))):
            ok = path.endswith(MAP_KEYS) or path == '.baglantilar[].id' or s.startswith('yer:')
            for mid in maps:
                if ok and (s == mid or s == f'yer:{mid}'):
                    mark(mid, f'{os.path.basename(src)} {path}')

other = {}
def use(mid, why):
    if mid in maps and mid not in world:
        other.setdefault(mid, set()).add(why)

for k, v in sefer_node.items():
    use(v, f'sefer {k.split(":")[0]}')
for sid, mid in scen.items():
    use(mid, f'sim senaryosu {sid}')
for f in ('data/sim-a2.json', 'data/sim-boss.json', 'data/bolge-karsilasma.json'):
    if os.path.exists(P(f)):
        for s in strings(J(*f.split('/'))):
            use(s if s in maps else scen.get(s), os.path.basename(f))
tests = [t for t in glob.glob(P('src', '**', '*.test.ts*'), recursive=True)] + [t for t in glob.glob(P('scripts', '*.*')) if 'k49-' not in t]
texts = {t: open(t, encoding='utf-8', errors='ignore').read() for t in tests}
for mid in maps:
    if mid in world:
        continue
    pat = re.compile(r"['\"`]" + re.escape(mid) + r"['\"`]")
    for t, txt in texts.items():
        if pat.search(txt):
            use(mid, os.path.relpath(t, ROOT))
    if maps[mid]['vitrin']:
        use(mid, 'vitrin')

rows_under = [m for m in maps if m not in world and maps[m]['bolge'] in under]
rows_other = [m for m in maps if m not in world and m not in rows_under and m in other]
rows_orphan = [m for m in maps if m not in world and m not in rows_under and m not in other]

L = ['# Ana haritada olmayan haritalar (K49 C6)', '',
     '`python scripts/k49-yetim-haritalar.py` üretir. "Dünyada": Serüven düğümü (senaryo ya da sefer durağı), yerleşim, hapishane, '
     'şehir görünümü ya da Serüven bağlantısı açıyor. Yeraltı haritaları kalır (ayrı liste).', '',
     f'Toplam {len(maps)} harita: dünyada {len(world)}, yeraltı {len(rows_under)}, başka yerde kullanılan {len(rows_other)}, yetim {len(rows_orphan)}.', '',
     '## Yetim (hiçbir yerde kullanılmıyor; kaldırma adayı)', '']
L += [f"- `{m}` ({maps[m]['dosya']}{', gizli' if maps[m]['gizli'] else ''})" for m in rows_orphan] or ['- yok']
L += ['', '## Dünyada yok ama başka yerde kullanılıyor (kalır)', '']
L += [f"- `{m}` ({maps[m]['dosya']}): {', '.join(sorted(other[m]))[:300]}" for m in rows_other] or ['- yok']
L += ['', '## Yeraltı (kalır)', '']
L += [f"- `{m}` ({maps[m]['dosya']})" for m in rows_under] or ['- yok']
L += ['', '## Dünyada', '']
L += [f"- `{m}`: {', '.join(sorted(world[m]))[:200]}" for m in maps if m in world]
L.append('')
open(P('harita', 'belgeler', 'ana-haritada-olmayanlar.md'), 'w', encoding='utf-8').write('\n'.join(L))
print('\n'.join(L[:60]))
