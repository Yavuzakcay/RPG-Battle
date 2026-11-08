"""Kuyruk K71a: dikey veri tek kaynağı (tavan + engel yüksekliği + altıgen tavanı). K68b `k68-tavan.py` buraya taşındı.

Yaptığı işler (idempotent; harita üreticilerinden SONRA çalıştırılır; metin biçimi korunur, yalnız satır eklenir/silinir):

1. **Tavan (`tavanFt`, K68b, sürüm 52+):** `TAVAN` tablosundaki 14 haritanın BÜTÜN varyantlarına `"tavanFt": N` satırı
   (varyantın `id` satırının altına); tabloda olmayan haritalardan eski satır silinir. Değerler K68b'den aynen.
2. **Altıgen/harf ezmesi (`dikey`, K71a, sürüm 56+):** `ONAYLI` tablosundaki haritaların varyantlarına tek satır
   `"dikey": {...}` (harfFt, engel, tavan, tavanBolge). Kuyruk K71b: 23 duvarlı açık haritanın değerleri onaylandı
   (K71a öneri tablosu); bina içi tavan bölgesi yalnız tespit edilen odalarda (avlular tavansız).
3. **Öneri raporu** (`--oneri`): `harita/belgeler/K71-HARITA-ONERI.md`: 59 haritanın engel harfi sayıları ve harf
   tablosundaki yükseklikleri; 23 duvarlı açık haritada duvar bileşenleri (altıgen aralığı), önerilen sur/bina boyu,
   duvarla çevrili kapalı alanlar (bina içi tavan bölgesi önerisi) ve gerekçe. Haritalara yazmaz.

Harf tablosu `data/dikey.json` (motor da aynı dosyayı okur; ⚠ değerler tasarım, SRD duvar yüksekliği vermez).

Kullanım: python scripts/k71-dikey.py [--kuru] [--oneri]
"""
import glob
import json
import re
import sys

# --- 1. Tavan (K68b'den aynen taşındı) ---------------------------------------------------------------------------------
# kimlik: (tavanFt, gerekçe). Açık üstlü (açık gök, tavansız; kullanıcı kararı, K68b düzeltmesi): Portal Salonu
# (`isinlanma-salonu`), Lav Tapınağı (`lav-tapinagi`), Volkanik Demirhane (`volkanik-demirhane`).
TAVAN = {
    'dungeon': (15, 'zindan koridoru ve odaları, taş tonoz'),
    'magara': (20, 'doğal mağara'),
    'magara-genis': (20, 'doğal mağara (geniş)'),
    'kasaba-lagim': (10, 'lağım tüneli, alçak tonoz'),
    'yeralti-nehri': (10, 'su altı geçidi, alçak tünel (kullanıcı kararı, K68b düzeltmesi)'),
    'derinlikler-magara-karakol': (20, 'maden galerisi ve karakol mağarası'),
    'derinlikler-mezar-labirenti': (15, 'mezar koridorları (oda)'),
    'derinlikler-mantar-magarasi': (30, 'dev mantarlı büyük mağara'),
    'derinlikler-lav-salonu': (30, 'lav salonu (salon)'),
    'orman-heykel-magarasi': (20, 'heykelli mağara'),
    'hapishane-hucre-platformu': (20, 'kaya içine oyulmuş hücre katı'),
    'hapishane-mudur-kulesi': (15, 'kule katı (oda)'),
    'taverna': (12, 'han salonu, ahşap kirişli tek kat'),
    'kale-taht-salonu': (30, 'taht salonu (salon)'),
}

# --- 2. Onaylı altıgen/harf ezmeleri (Kuyruk K71b: kullanıcı onayı, K71a öneri tablosu aynen) ------------------------------
# kimlik: { 'harfFt': {...}, 'engel': {'s,r': ft}, 'tavan': {'s,r': ft}, 'tavanBolge': [{'dikdortgen': [c0, r0, c1, r1], 'ft': N}] }
# Duvar boyu `s` ve duvardaki kapalı kapı `O` için aynı değer (kapı lentosunun üstü duvar). Bina içi tavan bölgesi yalnız
# betiğin kapalı alan tespitinin bulduğu odalarda (kale-avlu, kale-baskini: 3×3'lük iki oda, dikdörtgen tam); açık zemin
# (`.`) içeren kapalı alanlar avludur (kale-avlu/kale-baskini 162 altıgenlik avlu, kale-ic-avlu 93 altıgenlik iç avlu):
# tavansız kalır (⚠ K71b kararı: avluya tavan konmaz). Önerideki diğer iç tavan değerleri (saray odaları 20, hapishane/
# kasaba odaları 12, şehir 15, buzul tapınağı 20) bölgesi bulunamadığı için işlenmedi: elle bölge gerekir.
def _duvar(ft, oda=None):
    d = {'harfFt': {'s': ft, 'O': ft}}
    if oda:
        d['tavanBolge'] = [{'dikdortgen': list(r), 'ft': oda[0]} for r in oda[1]]
    return d


_KALE_ODALAR = (15, [(22, 4, 24, 6), (22, 10, 24, 12)])
ONAYLI: dict = {
    'kale': _duvar(30),
    'kale-baskini': _duvar(30, _KALE_ODALAR),
    'kale-avlu': _duvar(30, _KALE_ODALAR),
    'kale-ic-avlu': _duvar(30),
    'kale-onu': _duvar(30),
    'beyaz-sehir-dis-kapi': _duvar(30),
    'batak-kale': _duvar(25),
    'beyaz-sehir-saray-avlusu': _duvar(30),
    'hapishane-dis-halka': _duvar(20),
    'hapishane-iskele': _duvar(20),
    'kasaba-han': _duvar(15),
    'kasaba-demirci-tapinak': _duvar(15),
    'sehir-meydani': _duvar(20),
    'orman-ork-kampi': _duvar(10),
    'orman-oduncu-kampi': _duvar(10),
    'orman-kemik-acikligi': _duvar(10),
    'orman-heykel-golu': _duvar(15),
    'buzul-tapinak': _duvar(20),
    'kanyon-koprusu': _duvar(20),
    'volkanik-demirhane': _duvar(20),
    'isinlanma-salonu': _duvar(20),
    'lav-tapinagi': _duvar(20),
    'ortamlar-diyari': _duvar(20),
}

# --- 3. Öneri: 23 duvarlı açık haritanın kategorisi (duvar boyu, kapalı alan tavanı, gerekçe) -------------------------------
KATEGORI = {
    'kale': ('kale', 30, 15, 'kale suru; iç bina odaları'),
    'kale-baskini': ('kale', 30, 15, 'kale suru ve kuleler; iç bina odaları'),
    'kale-avlu': ('kale', 30, 15, 'avlu suru; avlu çevresi binalar'),
    'kale-ic-avlu': ('kale', 30, 15, 'kale iç avlu suru; bina odaları'),
    'kale-onu': ('kale', 30, 15, 'dış sur ve kapı kuleleri'),
    'batak-kale': ('kale', 25, 15, 'bataklık kalesi (yıkık sur)'),
    'beyaz-sehir-dis-kapi': ('kale', 30, 15, 'şehir suru ve kapı'),
    'beyaz-sehir-saray-avlusu': ('kale', 30, 20, 'saray avlusu duvarı; saray odaları yüksek tavan'),
    'hapishane-dis-halka': ('hapishane', 20, 12, 'hapishane halka duvarı; nöbetçi odaları'),
    'hapishane-iskele': ('hapishane', 20, 12, 'iskele binası duvarı'),
    'kasaba-han': ('bina', 15, 12, 'han binası duvarı; han içi tek kat'),
    'kasaba-demirci-tapinak': ('bina', 15, 12, 'demirci ve tapınak duvarları (tapınak içi daha yüksek olabilir)'),
    'sehir-meydani': ('bina', 20, 15, 'meydan çevresi bina cepheleri'),
    'orman-oduncu-kampi': ('cit', 10, 10, 'kamp çiti/kulübe duvarı'),
    'orman-ork-kampi': ('cit', 10, 10, 'ork kampı palisadı'),
    'orman-kemik-acikligi': ('cit', 10, None, 'yıkık taş çit/kalıntı'),
    'orman-heykel-golu': ('kalinti', 15, None, 'göl kıyısı kalıntı duvarı'),
    'buzul-tapinak': ('tapinak', 20, 20, 'buzul tapınağı duvarı; tapınak içi'),
    'kanyon-koprusu': ('kaya', 20, None, 'kanyon duvarı/köprü korkuluğu (varsayılan)'),
    'isinlanma-salonu': ('acik-ustlu', 20, None, 'açık üstlü salon (K68b kullanıcı kararı); duvar varsayılan'),
    'lav-tapinagi': ('acik-ustlu', 20, None, 'açık üstlü tapınak (K68b kullanıcı kararı); duvar varsayılan'),
    'volkanik-demirhane': ('acik-ustlu', 20, None, 'açık üstlü demirhane (K68b kullanıcı kararı); duvar varsayılan'),
    'ortamlar-diyari': ('vitrin', 20, None, 'vitrin/test haritası; varsayılan'),
}

AXIAL = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)]
WALL = set('sO')
ENCLOSE = set('sOo#')  # kapalı alan tespitinde geçilmez: duvar, kapalı kapı, kapı/geçit, harita dışı


def neighbors(c, r, cols, rows):
    q, rr = c, r - (c - (c & 1)) // 2
    for dq, dr in AXIAL:
        nq, nr = q + dq, rr + dr
        oc, orow = nq, nr + (nq - (nq & 1)) // 2
        if 0 <= oc < cols and 0 <= orow < rows:
            yield oc, orow


def components(tiles, pred):
    rows, cols = len(tiles), len(tiles[0])
    seen, out = set(), []
    for r in range(rows):
        for c in range(cols):
            if (c, r) in seen or not pred(tiles[r][c]):
                continue
            comp, stack = [], [(c, r)]
            seen.add((c, r))
            while stack:
                x, y = stack.pop()
                comp.append((x, y))
                for n in neighbors(x, y, cols, rows):
                    if n not in seen and pred(tiles[n[1]][n[0]]):
                        seen.add(n)
                        stack.append(n)
            out.append(comp)
    return out


def enclosed(tiles):
    """Harita kenarından duvar/kapı geçilmeden ulaşılamayan duvar dışı altıgen kümeleri (bina içi adayları)."""
    rows, cols = len(tiles), len(tiles[0])
    outside, stack = set(), []
    for r in range(rows):
        for c in range(cols):
            if (r in (0, rows - 1) or c in (0, cols - 1)) and tiles[r][c] not in ENCLOSE:
                outside.add((c, r))
                stack.append((c, r))
    while stack:
        x, y = stack.pop()
        for n in neighbors(x, y, cols, rows):
            if n not in outside and tiles[n[1]][n[0]] not in ENCLOSE:
                outside.add(n)
                stack.append(n)
    inner = lambda ch: ch not in ENCLOSE  # noqa: E731
    return [comp for comp in components(tiles, inner) if comp[0] not in outside and not any(p in outside for p in comp)]


def bbox(comp):
    cs = [p[0] for p in comp]
    rs = [p[1] for p in comp]
    return min(cs), min(rs), max(cs), max(rs)


def map_files():
    for path in sorted(glob.glob('harita/*/*.json')):
        p = path.replace('\\', '/')
        if '/belgeler/' in p or '/_ortak/' in p:
            continue
        yield path


def write_maps(dry):
    touched, seen = [], set()
    for path in map_files():
        text = open(path, encoding='utf-8').read()
        data = json.loads(text)
        mid = data.get('id')
        want = TAVAN.get(mid)
        dik = ONAYLI.get(mid)
        text2 = re.sub(r'\n[ \t]*"tavanFt": \d+,', '', text)
        text2 = re.sub(r'\n[ \t]*"dikey": \{.*\},', '', text2)
        if mid in TAVAN or mid in ONAYLI:
            seen.add(mid)
        if dik and dik.get('tavanBolge'):
            rooms = {bbox(c) for c in enclosed(first_tiles(data)) if not any(first_tiles(data)[r][cc] == '.' for cc, r in c)}
            for b in dik['tavanBolge']:
                if tuple(b['dikdortgen']) not in rooms:
                    raise SystemExit(f'{path}: onaylı oda {b["dikdortgen"]} kapalı alan tespitiyle eşleşmiyor')
        if want or dik:
            start = text2.index('"variants"')
            ins, pos = [], start
            for v in data.get('variants', []):
                m = re.compile(r'\n([ \t]*)"id": "' + re.escape(v['id']) + r'",').search(text2, pos)
                if not m:
                    raise SystemExit(f'{path}: varyant "{v["id"]}" satırı bulunamadı')
                add = ''
                if want:
                    add += f'\n{m.group(1)}"tavanFt": {want[0]},'
                if dik:
                    add += f'\n{m.group(1)}"dikey": {json.dumps(dik, ensure_ascii=False, separators=(", ", ": "))},'
                ins.append((m.end(), add))
                pos = m.end()
            for at, s in sorted(ins, reverse=True):
                text2 = text2[:at] + s + text2[at:]
        check = json.loads(text2)
        if want and any(v.get('tavanFt') != want[0] for v in check.get('variants', [])):
            raise SystemExit(f'{path}: tavanFt bütün varyantlara yazılamadı')
        if text2 != text:
            touched.append(f'{mid} ({path})')
            if not dry:
                open(path, 'w', encoding='utf-8', newline='\n').write(text2)
    missing = sorted((set(TAVAN) | set(ONAYLI)) - seen)
    if missing:
        raise SystemExit(f'Haritası bulunamayan kimlikler: {", ".join(missing)}')
    print(f'{len(touched)} harita değişti ({len(TAVAN)} tavanlı, {len(ONAYLI)} onaylı dikey ezme):')
    for t in touched:
        print(' ', t)


def first_tiles(data):
    vs = data.get('variants', [])
    return data.get('tiles') or (vs[0].get('tiles') if vs else None) or []


def report():
    harf = json.load(open('data/dikey.json', encoding='utf-8'))['harfFt']
    rows_all, sections = [], []
    for path in map_files():
        data = json.load(open(path, encoding='utf-8'))
        mid = data['id']
        tiles = first_tiles(data)
        if not tiles:
            continue
        cols, rows = len(tiles[0]), len(tiles)
        counts = {ch: sum(row.count(ch) for row in tiles) for ch in harf}
        counts = {k: v for k, v in counts.items() if v}
        tav = next((v.get('tavanFt') for v in data.get('variants', []) if v.get('tavanFt')), None)
        layered = bool(data.get('heights') or any(v.get('heights') for v in data.get('variants', [])))
        rows_all.append((mid, f'{cols}×{rows}', tav, layered, counts))
        if mid in KATEGORI:
            kat, duvar, tavan, why = KATEGORI[mid]
            walls = sorted(components(tiles, lambda ch: ch in WALL), key=len, reverse=True)
            rooms = sorted(enclosed(tiles), key=len, reverse=True)
            lines = [f'### {mid} ({cols}×{rows}, kategori: {kat})', '',
                     f'- **Önerilen duvar boyu:** {duvar} ft (harf `s`/`O` ezmesi `harfFt`; bugün 20). Gerekçe: {why}.']
            if walls:
                lines.append(f'- **Duvar bileşenleri** ({len(walls)}; sütun–satır aralığı, altıgen sayısı):')
                for comp in walls[:6]:
                    c0, r0, c1, r1 = bbox(comp)
                    lines.append(f'  - sütun {c0}–{c1}, satır {r0}–{r1}: {len(comp)} altıgen')
                if len(walls) > 6:
                    lines.append(f'  - … {len(walls) - 6} küçük bileşen daha')
            if rooms:
                tv = f'{tavan} ft' if tavan else 'açık (öneri yok)'
                lines.append(f'- **Duvarla çevrili kapalı alanlar** (bina içi adayı; öneri tavan {tv}, `tavanBolge`):')
                for comp in rooms[:6]:
                    c0, r0, c1, r1 = bbox(comp)
                    lines.append(f'  - sütun {c0}–{c1}, satır {r0}–{r1}: {len(comp)} altıgen')
                if len(rooms) > 6:
                    lines.append(f'  - … {len(rooms) - 6} küçük alan daha')
            else:
                lines.append('- **Kapalı alan:** yok (duvarlar alanı tamamen çevirmiyor; bina içi tavanı elle bölge gerekir).')
            lines.append('')
            sections.append('\n'.join(lines))
    out = ['# K71a: 23 duvarlı açık harita için dikey veri önerisi (K71b\'de onaylandı)', '',
           'Üreten: `python scripts/k71-dikey.py --oneri`. **Kuyruk K71b:** öneri tablosu kullanıcı onayıyla `scripts/k71-dikey.py`',
           '`ONAYLI` tablosuna yazıldı ve betik varyantlara `"dikey": {...}` satırı ekledi (duvar boyu `harfFt` `s`/`O`). Bina içi',
           'tavan bölgesi yalnız açık zemin (`.`) içermeyen kapalı alanlarda (kale-avlu, kale-baskini: iki 3×3 oda, 15 ft); açık zeminli',
           'kapalı alanlar avludur, tavansız (kale-avlu/kale-baskini 162 altıgen, kale-ic-avlu 93 altıgen). Bölgesi bulunamayan iç',
           'tavan önerileri işlenmedi (elle bölge gerekir).', '',
           '⚠ Sur/bina boyları ve bina içi bölgeleri görselden doğrulanmalı; kapalı alan tespiti zemin harflerinden (duvar `s`,',
           'kapalı kapı `O`, kapı/geçit `o`, harita dışı `#` geçilmez sayılarak kenardan ulaşılamayan alanlar). Kapısı açık',
           '(`o` dışında geçiş olan) binalar kapalı alan çıkmaz: onlar için bölge elle verilir.', '',
           '## 23 harita', '']
    out += sections
    out += ['## Ek: 59 haritanın engel harfleri (harf tablosuyla)', '',
            'Harf tablosu (ft): ' + ', '.join(f'`{k}` {v}' for k, v in harf.items()) + '.', '',
            '| Harita | Boyut | Tavan (ft) | Katmanlı | Engel harfleri (sayı) |', '|---|---|---|---|---|']
    for mid, size, tav, layered, counts in rows_all:
        c = ', '.join(f'`{k}` {v}' for k, v in sorted(counts.items(), key=lambda kv: -kv[1])) or '—'
        out.append(f'| {mid} | {size} | {tav or "—"} | {"evet" if layered else ""} | {c} |')
    open('harita/belgeler/K71-HARITA-ONERI.md', 'w', encoding='utf-8', newline='\n').write('\n'.join(out) + '\n')
    print(f'öneri: harita/belgeler/K71-HARITA-ONERI.md ({len(sections)} harita bölümü, {len(rows_all)} harita eki)')


def main() -> None:
    dry = '--kuru' in sys.argv
    write_maps(dry)
    if '--oneri' in sys.argv:
        report()


if __name__ == '__main__':
    main()
