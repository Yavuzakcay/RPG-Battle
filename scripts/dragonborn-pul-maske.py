"""Dragonborn pul deseni (v2) oyun verisi: 264 beyaz taban jetonun pul maskesi ve desen ayarı.
`python scripts/dragonborn-pul-maske.py`
- public/characters/maske-pul/<jeton>.png: ikili maske (255 = boyanır), scripts/dragonborn-desen-v2.py `mask_of` ile aynı yöntem
  (ten tonu jetonun kendi başından, kapama, küçük bileşen atma, kapalı delik doldurma, yoldaş başı çıkarma; boynuz/kontur/göz hariç).
  Maske üretilemeyen ya da boş çıkan jetonun dosyası yazılmaz (o jeton boyanmaz, beyaz kalır).
  Jeton başına elle düzeltme data/dragonborn-pul-duzeltme.json (`yalniz`/`haric`/`beyazKutu` alanları, `bos`): bu jetonlara renk kapısı uygulanmaz.
  Diğer jetonlarda renk kapısı (v2 `renk_kapisi`: yalnız ejderha derisine yakın renk bölgeleri); kapı bağımsız taşma tahminini
  (`tasma_tahmini`) kötüleştirir ya da baş bandındaki teni > %10 keserse o jetonda eski maske kalır. Riskli jetonlar
  data/dragonborn-pul-kapali.json (maske yazılmaz). Rapor harita/belgeler/DRAGONBORN-PUL-KAPI.md.
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
DUZELTME = os.path.join(ROOT, 'data/dragonborn-pul-duzeltme.json')
KAPALI = os.path.join(ROOT, 'data/dragonborn-pul-kapali.json')
RAPOR = os.path.join(ROOT, 'harita/belgeler/DRAGONBORN-PUL-KAPI.md')
ASGARI_PX = 30

def rapor(olcum, duz, kapali, toplam):
    say = {}
    for v in olcum.values(): say[v['karar']] = say.get(v['karar'], 0) + 1
    iy = [v for v in olcum.values() if v['karar'].startswith('kapı')]
    o0 = sum(v['p0'] * v['px0'] for v in iy) / max(1, sum(v['px0'] for v in iy)); o1 = sum(v['p1'] * v['px1'] for v in iy) / max(1, sum(v['px1'] for v in iy))
    L = ['# Dragonborn pul v2: renk kapısı ve kapatılan jetonlar', '',
         '`python scripts/dragonborn-pul-maske.py` üretir (elle düzenleme). Yalnız görünüm; kural ve kayıt sürümü değişmez.', '',
         '## Yöntem', '',
         '- **Renk kapısı** (`scripts/dragonborn-desen-v2.py` `renk_kapisi`, ayar `KAPI`, kopyası `data/dragonborn-pul.json` `kapi`): maske, renk farkı '
         f"(Lab) < {v2.KAPI['tol']} olan komşu piksellerden bölgelere ayrılır; bölgenin ortalama rengi jetonun baş ten örneğine yakın değilse "
         f"(ton farkı > {v2.KAPI['ton']}°, kroma oranı {v2.KAPI['kAlt']}–{v2.KAPI['kUst']} dışı ya da açık ve renksiz) bölge boyanmaz. Kapının açtığı, maskeyle "
         f"çevrili ≤ {v2.KAPI['delik']} px delikler (ten parlaması) geri konur.",
         '- **Doğrulama** (etiketli veri: el yamalı 30 jeton, otomatik maske − yamalı maske = taşma): kapı tenin **%95,8**ini korur, taşmanın **%36**sını keser '
         '(kalan %63,6). Bu jetonlar ten rengine en yakın kıyafetli olanlardır; renk kapısı tek başına onları çözemez, yamaları korunur.',
         '- **Taşma ölçüsü** (kapıdan bağımsız tahmin, `tasma_tahmini`): baş bandı dışında parlak renksiz (beyaz kumaş/metal) ya da ton dışı renkli '
         'maske piksellerinin oranı. Etiketli jetonlarda gerçek taşmayla korelasyonu 0,52 (kaba bir gösterge; küçük silah ağzı, cep saati, duman '
         'gibi kabul edilen sızıntıları da sayar).',
         f"- **Kötüleşme kuralı:** kapı sonrası taşma tahmini {v2.KAPI['kotulesme']:.3f}'ten fazla artarsa ya da baş bandındaki maske %{int(v2.KAPI['basKayip'] * 100)}'dan "
         'fazla azalırsa (ten kesiliyor) o jetonda eski maske korunur.',
         '- `data/dragonborn-pul-duzeltme.json` el yamalı jetonlara kapı uygulanmaz (maskeleri aynen).', '',
         '## Sonuç', '',
         f'- Dragonborn jetonu: {toplam}; el yamalı: {len(duz)} (dokunulmadı); otomatik maskeli: {len(olcum)}.',
         f"- Kapı uygulandı: **{say.get('kapı: taşma azaldı', 0)}** jetonda taşma tahmini azaldı, **{say.get('kapı: taşma aynı', 0)}** jetonda aynı kaldı "
         f"(yalnız ten tonuna uzak küçük bölgeler çıktı); eski maske korundu (kötüleşti): **{say.get('eski maske (kötüleşti)', 0)}**; "
         f"kapatıldı (beyaz kalır): **{say.get('kapalı', 0)}**.",
         f'- Kapı uygulanan jetonlarda taşma tahmini (piksel ağırlıklı) %{o0 * 100:.1f} → %{o1 * 100:.1f}.', '',
         '## Kapatılan jetonlar (boyanmaz, beyaz kalır)', '', '| Jeton | Neden | Kaynak |', '|---|---|---|']
    for n, a in duz.items():
        if a.get('bos'): L.append(f"| {n[11:]} | {a['bos']} | el yaması (`bos`) |")
    for n, why in kapali.items(): L.append(f'| {n[11:]} | {why} | `data/dragonborn-pul-kapali.json` |')
    L += ['', '## Jeton başına ölçüm (otomatik maskeli jetonlar)', '', '| Jeton | Maske px önce → sonra | Taşma tahmini önce → sonra | Baş bandı kaybı | Karar |', '|---|---|---|---|---|']
    for n, v in sorted(olcum.items()):
        L.append(f"| {n} | {v['px0']} → {v['px1']} | %{v['p0'] * 100:.1f} → %{v['p1'] * 100:.1f} | %{v['basKayip'] * 100:.0f} | {v['karar']} |")
    import re
    txt = re.sub(r'(?<=\d)\.(?=\d)', ',', '\n'.join(L))   # Türkçe ondalık virgül
    open(RAPOR, 'w', encoding='utf-8', newline='\n').write(txt + '\n')

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    os.makedirs(OUT, exist_ok=True)
    names = v2.all_tokens(); bos = {}; boya = {}
    duz = json.load(open(DUZELTME, encoding='utf-8'))['jetonlar']
    bilinmeyen = set(duz) - {f'dragonborn-{n}' for n in names}
    if bilinmeyen: raise SystemExit(f'düzeltmede bilinmeyen jeton: {sorted(bilinmeyen)}')
    kapali = json.load(open(KAPALI, encoding='utf-8'))['jetonlar']
    olcum = {}
    for n in names:
        f = os.path.join(OUT, f'dragonborn-{n}.png')
        ayar = duz.get(f'dragonborn-{n}')
        if ayar and ayar.get('bos'):
            bos[f'dragonborn-{n}'] = ayar['bos']
            if os.path.exists(f): os.remove(f)
            continue
        rgba = np.array(Image.open(os.path.join(v2.CHAR, f'dragonborn-{n}.webp')).convert('RGBA'))
        m, info = v2.mask_of(rgba, ayar)
        if not ayar and m is not None and int(m.sum()) >= ASGARI_PX:
            g = v2.renk_kapisi(rgba, info, m)
            p0, h0 = v2.tasma_tahmini(rgba, info, m); p1, h1 = v2.tasma_tahmini(rgba, info, g)
            kayip = 1 - h1 / max(1, h0)
            kotu = kayip > v2.KAPI['basKayip'] or p1 > p0 + v2.KAPI['kotulesme']
            karar = 'kapalı' if f'dragonborn-{n}' in kapali else ('eski maske (kötüleşti)' if kotu else ('kapı: taşma azaldı' if p1 < p0 - 0.0005 else 'kapı: taşma aynı'))
            olcum[n] = {'px0': int(m.sum()), 'px1': int(g.sum()), 'p0': p0, 'p1': p1, 'basKayip': kayip, 'karar': karar}
            if not kotu: m = g
        if f'dragonborn-{n}' in kapali:
            bos[f'dragonborn-{n}'] = 'riskli: ' + kapali[f'dragonborn-{n}']
            if os.path.exists(f): os.remove(f)
            continue
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
        'kapi': {k: v for k, v in v2.KAPI.items()},
    }
    json.dump(data, open(DATA, 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)
    sizes = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
    rapor(olcum, duz, kapali, len(names))
    print(f'{len(boya)} maske, {len(bos)} maskesiz, {sizes // 1024} kB'); print(json.dumps(bos, ensure_ascii=False, indent=1))
