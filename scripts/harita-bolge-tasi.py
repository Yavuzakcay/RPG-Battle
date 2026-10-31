"""TARİHÇE (Kuyruk 19 D1; bir kez çalıştı). Kuyruk 19C sonrası yollar artık geçerli değil: harita kayıtları harita/<bolge>/,
kaynaklar harita/<bolge>/gorsel/, ortak veri harita/_ortak/ (scripts/harita-tek-kok-tasi.py). Yeniden çalıştırılmaz.

Kuyruk 19 D1: harita görsellerini bölge klasörlerine taşır (bir kerelik; git mv, tarihçe korunur).

Harita kimlikleri DEĞİŞMEZ. Her harita kaydına `bolge` ve `gorsel` ("<bolge>/<bolge>-<ad>", uzantısız) eklenir;
varyant `image` yolları: ilk varyant `maps/<gorsel>.webp`, ayrı görseli olan diğer varyantlar
`maps/<gorsel>-<varyant>.webp` (aynı görseli paylaşan varyant aynı dosyayı gösterir). Referans çıktıları
(docs/harita/referans/<kimlik>[-varyant]{.png,-izgarasiz.png,-prompt.md}) `docs/harita/referans/<bolge>/<gorsel adı>…`'e.
Çalıştırma (depo kökünde): python3 scripts/harita-bolge-tasi.py
"""
import json, os, re, subprocess

BOLGE = {
    # kimlik: (bölge, ad)
    'ada': ('deniz', 'deniz-ada'), 'gemi': ('deniz', 'deniz-gemi'),
    'bataklik': ('bataklik', 'bataklik-klasik'),
    'col': ('col', 'col-klasik'), 'dag': ('dag', 'dag-klasik'),
    'orman': ('orman', 'orman-klasik'), 'orman-yolu': ('orman', 'orman-yol'),
    'dungeon': ('yeralti', 'yeralti-zindan'), 'magara': ('yeralti', 'yeralti-magara'), 'magara-genis': ('yeralti', 'yeralti-magara-genis'),
    'kale': ('kale', 'kale-klasik'), 'kale-avlu': ('kale', 'kale-avlu'), 'kale-baskini': ('kale', 'kale-baskini'),
    'sehir-meydani': ('sehir', 'sehir-meydani'), 'taverna': ('sehir', 'sehir-taverna'),
    'ortamlar-diyari': ('vitrin', 'vitrin-ortamlar-diyari'),
    'volkan': ('volkan', 'volkan-boss'), 'isinlanma-salonu': ('volkan', 'volkan-portal-salonu'),
    'lav-tapinagi': ('volkan', 'volkan-tapinak'), 'kanyon-koprusu': ('volkan', 'volkan-kopru'),
    'volkanik-demirhane': ('volkan', 'volkan-demirhane'),
}

def git_mv(a, b):
    if a == b or not os.path.exists(a):
        return
    os.makedirs(os.path.dirname(b), exist_ok=True)
    subprocess.run(['git', 'mv', a, b], check=True)

renamed = {}  # eski public yolu → yeni
ref_names = {}  # eski referans adı → (bölge, yeni ad)
for fn in sorted(os.listdir('data/maps')):
    p = f'data/maps/{fn}'
    text = open(p, encoding='utf-8').read()
    m = json.loads(text)
    bolge, ad = BOLGE[m['id']]
    gorsel = f'{bolge}/{ad}'
    first = m['variants'][0]
    for i, v in enumerate(m['variants']):
        old = v['image']
        if old in renamed:
            new = renamed[old]
        else:
            new = f'maps/{gorsel}.webp' if i == 0 or old == first['image'] else f'maps/{gorsel}-{v["id"]}.webp'
            renamed[old] = new
            git_mv(f'public/{old}', f'public/{new}')
        text = text.replace(f'"image": "{old}"', f'"image": "{new}"')
        ref_old = m['id'] if len(m['variants']) == 1 else f'{m["id"]}-{v["id"]}'
        ref_names[ref_old] = (bolge, os.path.basename(new)[:-5])
    if '"bolge"' not in text:
        text = re.sub(r'(\n  "id": "[^"]+",\n)', lambda mm: f'{mm.group(1)}  "bolge": "{bolge}",\n  "gorsel": "{gorsel}",\n', text, count=1)
    open(p, 'w', encoding='utf-8').write(text)

# Referans çıktıları.
REF = 'docs/harita/referans'
for old, (bolge, new) in ref_names.items():
    for suf in ['.png', '-izgarasiz.png', '-prompt.md']:
        git_mv(f'{REF}/{old}{suf}', f'{REF}/{bolge}/{new}{suf}')

# Veri dosyalarındaki yollar: sefer küçük resimleri, ödül sahnesi, referans stil örnekleri.
def rewrite(path, fn):
    t = open(path, encoding='utf-8').read()
    n = fn(t)
    if n != t:
        open(path, 'w', encoding='utf-8').write(n)

def sub_paths(t):
    for old, new in renamed.items():
        t = t.replace(f'"{old}"', f'"{new}"').replace(f'"{old[len("maps/"):]}"', f'"{new[len("maps/"):]}"')
    return t.replace('"odul/odul-sahnesi.webp"', '"maps/volkan/volkan-hazine.webp"')

rewrite('data/seferler.json', sub_paths)
rewrite('data/harita-referans.json', sub_paths)
print(f'{len(renamed)} görsel, {len(ref_names)} referans adı')
