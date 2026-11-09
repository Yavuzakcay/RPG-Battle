"""Kuyruk K72 (kural sürümü 60+): bina içi tavan bölgeleri (oda tavanı) ve sur üstü işareti.

`scripts/k71-dikey.py` varyantlara `"dikey": {...}` satırını yazar; bu betik o satıra iki alan ekler (idempotent: önce
siler, sonra yazar; satırın geri kalanı aynen). `k71-dikey.py` bitince bu betiği kendiliğinden çağırır.

1. **Oda tavanı (`dikey.odalar`, sürüm 60+):** `TAVAN_DEGER` tablosundaki haritalarda kapalı odalar (duvar `s`, kapalı kapı
   `O`, kapı/geçit `o` ve tek altıgenlik kapı aralığıyla çevrili, dikdörtgene yakın bölge) otomatik bulunur:
   - kapalı alan tespiti (K71b) ve kapı aralığı sezgisi (iki karşı yanında duvar olan duvar dışı altıgen geçit sayılır,
     kenardan taşkın doldurmada geçilmez);
   - 3–40 altıgen ve kutu doluluğu ≥ 0,6: oda (otomatik); 41–100: belirsiz (salon mu avlu mu; listede); > 100: avlu
     (tavansız, K71b kararı).
   K71b'nin `tavanBolge` odaları (kale-avlu, kale-baskini) aynen kalır; burada yalnız yeni odalar yazılır.
   Kullanıcının verdiği bölgeler `ONAYLI_BOLGE` tablosundan (altıgen listesi ya da dikdörtgen; 0 tabanlı sütun/satır,
   önizlemedeki etiketler). Duvar ve kapı altıgenleri bölgeden düşülür (duvar tavansız: dışarıdan tırmanılır, K71a).
2. **Sur üstü (`dikey.surUstu`, K5, sürüm 60+):** `SUR_USTU` tablosundaki haritalarda duvar `s` ve duvardaki kapalı kapı
   `O` tepesinde durulur (ONAYLI sur 25–30 ft, çit ve alçak duvar 10–15 ft; 20 ft bina duvarları işaretsiz).
3. **Liste (`harita/belgeler/K72-BOLGE-LISTESI.md`) ve önizleme** (`harita/<bolge>/onizleme/<ad>-oda.png`: sütun/satır
   etiketli ızgara, duvar koyu, oda adayları renkli): otomatik bulunamayan ya da belirsiz her harita.

Kullanım: python scripts/k72-tavan-bolge.py [--kuru] [--rapor]
"""
import glob
import json
import os
import re
import sys

# --- Tablolar ------------------------------------------------------------------------------------------------------------
# K71a/K71b öneri tablosunun iç tavan değerleri (kullanıcı kararı K72: kale grubu 15, saray odaları 20, hapishane/kasaba
# odaları 12, şehir meydanı 15, buzul tapınağı 20).
TAVAN_DEGER = {
    'kale': 15, 'kale-baskini': 15, 'kale-avlu': 15, 'kale-ic-avlu': 15, 'kale-onu': 15, 'batak-kale': 15,
    'beyaz-sehir-dis-kapi': 15,
    'beyaz-sehir-saray-avlusu': 20,
    'hapishane-dis-halka': 12, 'hapishane-iskele': 12, 'kasaba-han': 12, 'kasaba-demirci-tapinak': 12,
    'sehir-meydani': 15,
    'buzul-tapinak': 20,
}

# Kullanıcının verdiği odalar (K72-BOLGE-LISTESI.md'deki önizlemeden). Biçim:
#   'harita-kimligi': [ {'ft': 15, 'altigenler': [(sütun, satır), ...]}, {'ft': 15, 'dikdortgen': (c0, r0, c1, r1)} ]
# Tavan değeri verilmezse `TAVAN_DEGER`. Sütun/satır 0 tabanlı (önizlemedeki etiketler).
ONAYLI_BOLGE: dict = {}

# K5: tepesinde durulan duvar haritaları (K71b ONAYLI duvar boyu 10, 15, 25, 30 ft).
SUR_USTU = {
    'kale', 'kale-baskini', 'kale-avlu', 'kale-ic-avlu', 'kale-onu', 'beyaz-sehir-dis-kapi', 'beyaz-sehir-saray-avlusu',
    'batak-kale', 'kasaba-han', 'kasaba-demirci-tapinak', 'orman-heykel-golu', 'orman-ork-kampi', 'orman-oduncu-kampi',
    'orman-kemik-acikligi',
}
SUR_HARF = ['s', 'O']

ODA_MIN, ODA_MAX, BELIRSIZ_MAX, DOLULUK = 3, 40, 100, 0.6
ENCLOSE = set('sOo#')
AXIAL = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)]


def ring(c, r, cols, rows):
    q, rr = c, r - (c - (c & 1)) // 2
    out = []
    for dq, dr in AXIAL:
        nq, nr = q + dq, rr + dr
        oc, orow = nq, nr + (nq - (nq & 1)) // 2
        out.append((oc, orow) if 0 <= oc < cols and 0 <= orow < rows else None)
    return out


def neighbors(c, r, cols, rows):
    return [n for n in ring(c, r, cols, rows) if n]


def flood_outside(tiles, block):
    rows, cols = len(tiles), len(tiles[0])
    out, st = set(), []
    for r in range(rows):
        for c in range(cols):
            if (r in (0, rows - 1) or c in (0, cols - 1)) and not block(c, r):
                out.add((c, r))
                st.append((c, r))
    while st:
        x, y = st.pop()
        for n in neighbors(x, y, cols, rows):
            if n not in out and not block(*n):
                out.add(n)
                st.append(n)
    return out


def components(tiles, ok):
    rows, cols = len(tiles), len(tiles[0])
    seen, res = set(), []
    for r in range(rows):
        for c in range(cols):
            if (c, r) in seen or not ok(c, r):
                continue
            comp, st = [], [(c, r)]
            seen.add((c, r))
            while st:
                x, y = st.pop()
                comp.append((x, y))
                for n in neighbors(x, y, cols, rows):
                    if n not in seen and ok(*n):
                        seen.add(n)
                        st.append(n)
            res.append(sorted(comp))
    return res


def bbox(comp):
    cs = [p[0] for p in comp]
    rs = [p[1] for p in comp]
    return min(cs), min(rs), max(cs), max(rs)


def fill(comp):
    c0, r0, c1, r1 = bbox(comp)
    return len(comp) / ((c1 - c0 + 1) * (r1 - r0 + 1))


def doorways(tiles):
    """Kapı aralığı: duvar dışı, iki karşı yanında duvar/kapı/harita dışı olan altıgen."""
    rows, cols = len(tiles), len(tiles[0])
    wall = lambda x: x is None or tiles[x[1]][x[0]] in ENCLOSE  # noqa: E731
    out = set()
    for r in range(rows):
        for c in range(cols):
            if tiles[r][c] in ENCLOSE:
                continue
            g = ring(c, r, cols, rows)
            if any(wall(g[i]) and wall(g[i + 3]) for i in range(3)):
                out.add((c, r))
    return out


def candidates(tiles):
    """(kapalı alan bileşenleri, kapı aralıklı bileşenler): duvar dışı, kenardan ulaşılamayan."""
    closed_block = lambda c, r: tiles[r][c] in ENCLOSE  # noqa: E731
    outside = flood_outside(tiles, closed_block)
    closed = components(tiles, lambda c, r: not closed_block(c, r) and (c, r) not in outside)
    doors = doorways(tiles)
    door_block = lambda c, r: closed_block(c, r) or (c, r) in doors  # noqa: E731
    outside2 = flood_outside(tiles, door_block)
    # Küçük kapalı odaların içi ikinci geçişte yeniden sayılmaz; büyük kapalı alanın (avlu) içindeki kapı aralıklı odalar sayılır.
    inner = set(p for comp in closed if len(comp) <= ODA_MAX for p in comp)
    opened = components(tiles, lambda c, r: not door_block(c, r) and (c, r) not in outside2 and (c, r) not in inner)
    return closed, opened


def classify(tiles, known_rects):
    """Otomatik oda, belirsiz bölge ve avlu listesi."""
    closed, opened = candidates(tiles)
    rooms, unsure, yards = [], [], []
    for comp in closed + opened:
        if bbox(comp) in known_rects:
            continue
        n = len(comp)
        if ODA_MIN <= n <= ODA_MAX and fill(comp) >= DOLULUK:
            rooms.append(comp)
        elif n > BELIRSIZ_MAX:
            yards.append(comp)
        elif n >= ODA_MIN:
            unsure.append(comp)
    return rooms, unsure, yards


def first_tiles(data):
    vs = data.get('variants', [])
    return data.get('tiles') or (vs[0].get('tiles') if vs else None) or []


def map_files():
    for path in sorted(glob.glob('harita/*/*.json')):
        p = path.replace('\\', '/')
        if '/belgeler/' in p or '/_ortak/' in p:
            continue
        yield path


def base_name(data):
    img = (data.get('variants') or [{}])[0].get('image', '')
    m = re.match(r'maps/([^/]+)/([^/.]+)\.', img)
    return (m.group(1), m.group(2)) if m else (data.get('bolge', ''), data['id'])


def user_rooms(mid, tiles):
    out = []
    for b in ONAYLI_BOLGE.get(mid, []):
        ft = b.get('ft', TAVAN_DEGER.get(mid))
        if 'dikdortgen' in b:
            c0, r0, c1, r1 = b['dikdortgen']
            hexes = [(c, r) for r in range(r0, r1 + 1) for c in range(c0, c1 + 1)]
        else:
            hexes = [tuple(h) for h in b['altigenler']]
        hexes = [h for h in hexes if 0 <= h[1] < len(tiles) and 0 <= h[0] < len(tiles[0]) and tiles[h[1]][h[0]] not in ENCLOSE]
        if not ft or not hexes:
            raise SystemExit(f'{mid}: ONAYLI_BOLGE girdisi geçersiz ({b})')
        out.append((ft, sorted(set(hexes))))
    return out


def dikey_line_edit(text, add):
    """Her varyantın `"dikey": {...},` satırına `add` alanlarını yazar (önce eski odalar/surUstu silinir)."""
    def repl(m):
        d = json.loads(m.group(2))
        d.pop('odalar', None)
        d.pop('surUstu', None)
        d.update(add)
        return f'{m.group(1)}"dikey": {json.dumps(d, ensure_ascii=False, separators=(", ", ": "))},'
    return re.sub(r'(\n[ \t]*)"dikey": (\{.*\}),', repl, text)


def run(dry, report):
    touched, sections, kalan, auto_total = [], [], [], 0
    for path in map_files():
        text = open(path, encoding='utf-8').read()
        data = json.loads(text)
        mid = data.get('id')
        if mid not in TAVAN_DEGER and mid not in SUR_USTU and mid not in ONAYLI_BOLGE:
            continue
        if '"dikey":' not in text:
            raise SystemExit(f'{path}: "dikey" satırı yok (önce python scripts/k71-dikey.py)')
        tiles = first_tiles(data)
        known = set()
        for v in data.get('variants', []):
            for b in (v.get('dikey') or {}).get('tavanBolge', []):
                known.add(tuple(b['dikdortgen']))
        add = {}
        rooms, unsure, yards = ([], [], []) if mid not in TAVAN_DEGER else classify(tiles, known)
        ft = TAVAN_DEGER.get(mid)
        odalar = [{'ft': ft, 'altigenler': [f'{c},{r}' for c, r in comp]} for comp in rooms]
        odalar += [{'ft': f, 'altigenler': [f'{c},{r}' for c, r in hexes]} for f, hexes in user_rooms(mid, tiles)]
        auto_total += len(rooms)
        if odalar:
            add['odalar'] = odalar
        if mid in SUR_USTU:
            add['surUstu'] = SUR_HARF
        text2 = dikey_line_edit(text, add)
        if text2 != text:
            touched.append(mid)
            if not dry:
                open(path, 'w', encoding='utf-8', newline='\n').write(text2)
        if mid in TAVAN_DEGER:
            bolge, ad = base_name(data)
            png = f'harita/{bolge}/onizleme/{ad}-oda.png'
            needs = (not rooms and not ONAYLI_BOLGE.get(mid)) or unsure
            lines = [f'### {mid} ({len(tiles[0])}×{len(tiles)}, tavan {ft} ft)', '']
            if known:
                lines.append(f'- K71b odaları (tavanBolge, sürüm 56+): {", ".join(str(list(k)) for k in sorted(known))}')
            for comp in rooms:
                c0, r0, c1, r1 = bbox(comp)
                lines.append(f'- **Otomatik oda:** sütun {c0}–{c1}, satır {r0}–{r1}: {len(comp)} altıgen (doluluk {fill(comp):.2f})')
            for f, hexes in user_rooms(mid, tiles):
                c0, r0, c1, r1 = bbox(hexes)
                lines.append(f'- **Onaylı bölge:** sütun {c0}–{c1}, satır {r0}–{r1}: {len(hexes)} altıgen, {f} ft')
            for comp in unsure:
                c0, r0, c1, r1 = bbox(comp)
                lines.append(f'- **Belirsiz:** sütun {c0}–{c1}, satır {r0}–{r1}: {len(comp)} altıgen (doluluk {fill(comp):.2f}; salon mu avlu mu?)')
            for comp in yards:
                c0, r0, c1, r1 = bbox(comp)
                lines.append(f'- Avlu (tavansız): sütun {c0}–{c1}, satır {r0}–{r1}: {len(comp)} altıgen')
            if not rooms and not unsure and not ONAYLI_BOLGE.get(mid):
                lines.append('- **Oda bulunamadı:** binalar dolu duvar bloğu ya da kapıları açık; bölge elle verilmeli.')
            if needs:
                kalan.append(mid)
                lines.append(f'- Önizleme: `{png}`')
                if report:
                    preview(tiles, rooms + [h for _, h in user_rooms(mid, tiles)], unsure, png)
            lines.append('')
            sections.append('\n'.join(lines))
    print(f'{len(touched)} harita değişti; otomatik oda {auto_total}; elle bölge bekleyen {len(kalan)}: {", ".join(kalan)}')
    if report:
        out = ['# K72: bina içi tavan bölgeleri listesi', '',
               'Üreten: `python scripts/k72-tavan-bolge.py --rapor`. Sürüm 60+ davranışı (varyant `dikey.odalar`).', '',
               '**Otomatik tespit:**',
               '- Kapalı alan (duvar `s`, kapalı kapı `O`, kapı/geçit `o`, harita dışı `#`) ve tek altıgenlik kapı aralığı (iki karşı yanında duvar).',
               f'- {ODA_MIN}–{ODA_MAX} altıgen ve kutu doluluğu ≥ {DOLULUK}: oda.',
               f'- {ODA_MAX + 1}–{BELIRSIZ_MAX}: belirsiz. Daha büyüğü avlu (tavansız).', '',
               '**Elle bölge:**',
               '- `scripts/k72-tavan-bolge.py` `ONAYLI_BOLGE` tablosuna yazılır.',
               '- Biçim: `\'harita\': [{\'dikdortgen\': (c0, r0, c1, r1)}]` ya da `{\'altigenler\': [(c, r), ...], \'ft\': N}`.',
               '- Sütun/satır 0 tabanlı, önizlemedeki etiketler. Duvar/kapı altıgenleri kendiliğinden düşülür.',
               '- Sonra `python scripts/k72-tavan-bolge.py --rapor` çalıştırılır.', '',
               f'**Kalan (elle bölge bekleyen, {len(kalan)}):** ' + (', '.join(f'`{k}`' for k in kalan) or 'yok'), '',
               '## Haritalar', '']
        out += sections
        open('harita/belgeler/K72-BOLGE-LISTESI.md', 'w', encoding='utf-8', newline='\n').write('\n'.join(out) + '\n')
        print('liste: harita/belgeler/K72-BOLGE-LISTESI.md')


def preview(tiles, rooms, unsure, png):
    """Sütun/satır etiketli altıgen ızgarası (flat-top, odd-q)."""
    from PIL import Image, ImageDraw
    rows, cols = len(tiles), len(tiles[0])
    R = 16
    w = R * 2
    h = int(R * 3 ** 0.5)
    ox, oy = 34, 30
    W = ox + int(cols * w * 0.75 + w * 0.25) + 10
    H = oy + rows * h + h // 2 + 10
    img = Image.new('RGB', (W, H), (250, 248, 240))
    d = ImageDraw.Draw(img)
    color = {}
    for comp in rooms:
        for p in comp:
            color[p] = (120, 200, 120)
    for comp in unsure:
        for p in comp:
            color[p] = (240, 200, 90)

    def center(c, r):
        return ox + R + c * w * 0.75, oy + h / 2 + r * h + (h / 2 if c & 1 else 0)
    for r in range(rows):
        for c in range(cols):
            cx, cy = center(c, r)
            pts = [(cx + R * a, cy + h / 2 * b) for a, b in [(1, 0), (0.5, 1), (-0.5, 1), (-1, 0), (-0.5, -1), (0.5, -1)]]
            ch = tiles[r][c]
            fill_c = color.get((c, r)) or ((70, 70, 80) if ch in 'sO' else (160, 120, 80) if ch in 'o' else (30, 30, 30) if ch == '#' else (225, 222, 210))
            d.polygon(pts, fill=fill_c, outline=(150, 150, 150))
            d.text((cx - 3, cy - 6), ch, fill=(255, 255, 255) if ch in 'sO#' else (60, 60, 60))
    for c in range(cols):
        cx, _ = center(c, 0)
        d.text((cx - 5, 4), str(c), fill=(200, 30, 30))
    for r in range(rows):
        _, cy = center(0, r)
        d.text((4, cy - 6), str(r), fill=(30, 30, 200))
    os.makedirs(os.path.dirname(png), exist_ok=True)
    img.save(png, optimize=True)


if __name__ == '__main__':
    run('--kuru' in sys.argv, '--rapor' in sys.argv)
