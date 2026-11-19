"""Dragonborn pul deseni (v2) oyun verisi: 264 beyaz taban jetonun pul maskesi ve desen ayarı.
`python scripts/dragonborn-pul-maske.py`
- public/characters/maske-pul/<jeton>.png: ikili maske (255 = boyanır), scripts/dragonborn-desen-v2.py `mask_of` ile aynı yöntem
  (ten tonu jetonun kendi başından, kapama, küçük bileşen atma, kapalı delik doldurma, yoldaş başı çıkarma; boynuz/kontur/göz hariç).
  Maske üretilemeyen ya da boş çıkan jetonun dosyası yazılmaz (o jeton boyanmaz, beyaz kalır).
- data/dragonborn-pul.json: pul karosu (16×16 ton dizisi, v1 geometrisi, pul 8 px), L* modülasyonu, 10 soy renk tablosu
  (scripts/dragonborn-desen-renk.py; Kırmızı açık ton #E86343), maskesiz jeton listesi ve nedeni.
Boyama oyunda: src/ui/scaleTint.ts (tembel parça)."""
import importlib.util, json, os, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def _mod(n):
    s = importlib.util.spec_from_file_location(n.replace('-', '_'), os.path.join(ROOT, 'scripts', n + '.py')); m = importlib.util.module_from_spec(s); s.loader.exec_module(m); return m
v2 = _mod('dragonborn-desen-v2'); renk = v2.renk; v1 = v2.v1
OUT = os.path.join(ROOT, 'public/characters/maske-pul')
DATA = os.path.join(ROOT, 'data/dragonborn-pul.json')
ASGARI_PX = 30

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    os.makedirs(OUT, exist_ok=True)
    names = v2.all_tokens(); bos = {}; boya = {}
    for n in names:
        rgba = np.array(Image.open(os.path.join(v2.CHAR, f'dragonborn-{n}.webp')).convert('RGBA'))
        m, info = v2.mask_of(rgba)
        f = os.path.join(OUT, f'dragonborn-{n}.png')
        if m is None or int(m.sum()) < ASGARI_PX:
            bos[f'dragonborn-{n}'] = info.get('neden') or f'maske boş (< {ASGARI_PX} px)'
            if os.path.exists(f): os.remove(f)
            continue
        boya[f'dragonborn-{n}'] = int(m.sum())
        Image.fromarray((m * 255).astype(np.uint8), 'L').convert('1').save(f, optimize=True)
    tab, ref = renk.table()
    t = v1.tile(8)
    soylar = {v['soy']: {'acik': v['acik'] if k != 'kirmizi' else '#E86343', 'orta': v['orta'], 'koyu': v['koyu']} for k, v in tab.items()}
    data = {
        'not': 'scripts/dragonborn-pul-maske.py üretir; elle düzenleme. Dragonborn beyaz taban jetonlarının pul boyaması (src/ui/scaleTint.ts): '
               'maske public/characters/maske-pul/<jeton>.png; renk yalnız `orta` tondan (ton + kroma), açıklık jetonun kendi gölgesinden '
               '(L* = orta L* + (piksel L* − maskenin L* ortancası)); kroma uç ışık/gölgede `kromaDusus` ölçeğinde en çok `kromaAlt` katına iner; '
               'pul dokusu karo tonuna göre L* oynaması (`mod`: koyu/orta/açık; `modKoyu` soylarında koyulaştırma yönünde). Karo 256 px jeton uzayında, '
               'küçük kopyada W/256 ölçekli. `acik`/`koyu` kayıt için (v2 boyamasında kullanılmaz).',
        'karo': [''.join(str(int(v)) for v in row) for row in t],
        'mod': [-5, 0, 5],
        'modKoyu': {'silver': [-6, -3, 0], 'white': [-6, -3, 0]},
        'kromaDusus': 120, 'kromaAlt': 0.6, 'Lmin': 2, 'Lmax': 99,
        'soylar': soylar,
        'maskesiz': bos,
    }
    json.dump(data, open(DATA, 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)
    sizes = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
    print(f'{len(boya)} maske, {len(bos)} maskesiz, {sizes // 1024} kB'); print(json.dumps(bos, ensure_ascii=False, indent=1))
