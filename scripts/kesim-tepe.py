#!/usr/bin/env python3
"""KESIM-TEPE (2026-11-23): tepesi kesik jetonları bulur ve KESIM-DUZELT işi olarak yazar.

Kök neden: KESIM-DUZELT (2026-11-22, 102538ec) öncesi `toplu-kesim.py` şerit silmesi (`trim_lines`/`drop_lines`) figürün üst kenarındaki
koyu kontur satırlarını (saç, kapüşon, şapka tepesi) ızgara çizgisi artığı sanıp siliyordu. Kod düzeltildi ama o gün yalnız 126 jeton
yeniden kesildi; 11-16 toplu kesiminden (1890 jeton) ve CC kesiminden kalanlar eski kesimde.

Ölçü (yazmaz): her jeton güncel kodla ham sayfadan kesilir, eski jetona alt piksel kaydedilir (`kesim-yenile.py` `register`) ve
geri gelen piksellerden (`lost_gain`) eski siluetin ÜSTÜNE eklenenler sayılır (sütunda eski en üst opak pikselin üstü): `tepeKazanc`.
Kaynak: defter (`data/cc-kesim-kaynak.json` kazanan) ya da toplu kesim adı (`<ırk>-<cinsiyet>-<sınıf>-<ID|WL-|SC-><n>` → sayfa
`<sınıf>-<male|female|erkek|kadin>-<ırk>.jpg` hücre n). Gariban (GR): sayfa gariban-<g>-<ırk>, hücre GARIBAN sırası. Wizard (WZ-, ayrı betik) ve sınıf-genel (ham sayfa yok) kapsam dışı;
Celestial ada göre eşlenmez (sınıf sayfası haleli, jeton halesiz: hale geri eklenirdi), yalnız defterdeyse.

  python scripts/kesim-tepe.py olc [--is ad,...]      → gorsel-dokum/kesim-tepe/olcum.json + kontak sayfaları
  python scripts/kesim-tepe.py isler [--esik 6]        → data/kesim-duzelt.json'a `grup: tepe`, `yerlesim: eski` işleri (var olanı ezmez)
Uygulama: python scripts/kesim-yenile.py uygula --is <adlar>  (eski yerleşim: yalnız geri gelen pikseller eklenir, eski pikseller ve
maske hizası değişmez). Ham klasör `CC_HAM` (wip/karakter-ham karakter/ + eksikler/ birleşik; bkz. kesim-yenile.py).
"""
import importlib.util, json, os, re, sys
from multiprocessing import Pool
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); os.chdir(ROOT)
_s = importlib.util.spec_from_file_location('ky', 'scripts/kesim-yenile.py'); ky = importlib.util.module_from_spec(_s); _s.loader.exec_module(ky)
cc = ky.cc
OUT = 'gorsel-dokum/kesim-tepe'
GEN = {'erkek': ['erkek', 'male'], 'kadin': ['kadin', 'female']}
KOD = {'ID': None, 'WL-': 'warlock', 'SC-': 'sorcerer'}

def spec_for(name, L):
    w = L.get(name, {}).get('kazanan')
    if w: return ky.spec_of(w['dosya'], w['hucre'])
    m = re.match(r'([a-z]+)-(erkek|kadin)-([a-z]+)-GR$', name)
    if m:   # Gariban: `toplu-kesim.py --yeni` sayfası gariban-<g>-<ırk>, hücre = GARIBAN sırası
        race, gen, cls = m.groups()
        if race == 'celestial': return None
        for g in GEN[gen]:
            f = f'gariban-{g}-{race}.jpg'
            if os.path.exists(f'{cc.RAW}/{f}') and cls in cc.tk.GARIBAN: return {'kesici': 'sayfa', 'sayfa': f, 'hucre': cc.tk.GARIBAN.index(cls) + 1, 'duzen': 'gariban'}
        return None
    m = re.match(r'([a-z]+)-(erkek|kadin)-([a-z]+)-(ID|WL-|SC-)(\d+)$', name)
    if not m: return None
    if m.group(1) == 'celestial': return None
    if m.group(3) == 'paladin' and m.group(5) == '10': return None   # Hızır: ayrı sayfa (hizir-sayfa1/2)
    race, gen, cls, kod, n = m.groups()
    for g in GEN[gen]:
        f = f'{cls}-{g}-{race}.jpg'
        if os.path.exists(f'{cc.RAW}/{f}'): return ky.spec_of(f, int(n))
    return None

def top_gain(old, new):
    """Eski siluetin üstüne eklenen geri gelen pikseller (sütunda eski en üst opak pikselin üstünde)."""
    lost, gain = ky.lost_gain(old, new)
    a = old[..., 3] >= 32
    top = np.where(a.any(0), a.argmax(0), old.shape[0])
    yy = np.arange(old.shape[0])[:, None]
    return gain & (yy < top[None, :]), lost, gain

def olc_one(item):
    name, spec = item
    old = ky.tok_of(name); r = {'jeton': name, 'kaynak': spec}
    try:
        c = ky.kes(spec)
        if c is None: r['hata'] = 'figür bulunamadı/ELLE'; return r, None
        crop, box = c; reg = ky.register(crop, old)
        if reg is None: r['hata'] = 'kayıt yok'; return r, None
        new = ky.render_map(crop, *reg[:4])
        tg, lost, gain = top_gain(old, new)
        r.update(iou=round(reg[5], 4), tepeKazanc=int(tg.sum()), kazanc=int(gain.sum()), kayip=int(lost.sum()), kutu=[int(v) for v in box])
        return r, (old, new, box) if tg.sum() else None
    except Exception as e:
        r['hata'] = repr(e); return r, None

def olc_group(items):
    out = [olc_one(it) for it in items]; ky._cache.clear(); return out

def olc():
    L = cc.ledger()['jetonlar']
    only = set((ky.arg('--is') or '').split(',')) - {''}
    names = sorted(f[:-5] for f in os.listdir('public/characters') if f.endswith('.webp'))
    items, disi = [], []
    for n in names:
        if only and n not in only: continue
        sp = spec_for(n, L)
        if sp and os.path.exists(f'{cc.RAW}/{sp["sayfa"]}'): items.append((n, sp))
        else: disi.append(n)
    groups = {}
    for n, sp in items: groups.setdefault(sp['sayfa'], []).append((n, sp))
    with Pool(4) as p: res = [x for g in p.map(olc_group, list(groups.values()), chunksize=1) for x in g]
    os.makedirs(OUT, exist_ok=True)
    rows = []
    for r, vis in sorted(res, key=lambda x: -x[0].get('tepeKazanc', 0)):
        if vis and r['tepeKazanc'] >= 6 and len(rows) < 240:
            old, new, box = vis
            rows.append((r['jeton'], f"tepe +{r['tepeKazanc']} (toplam +{r['kazanc']} -{r['kayip']}) iou {r['iou']}",
                         [ky.raw_tile(r['kaynak'], tuple(box)), ky.on_bg(old), ky.on_bg(new), ky.diff_tile(old, new)]))
    for k in range(0, len(rows), 15):
        ky.contact(rows[k:k + 15], f'{OUT}/kontak-{k // 15 + 1}.jpg', 'KESIM-TEPE (yazılmadı): ham | mevcut | güncel kesim (kayıtlı) | fark: yeşil eklenen, kırmızı kaybolan')
    res = [r for r, _ in res]
    json.dump({'olculen': len(res), 'kapsamDisi': disi, 'sonuc': res}, open(f'{OUT}/olcum.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    ok = [r for r in res if 'hata' not in r]
    print(f'ölçülen {len(ok)}, hata {len(res) - len(ok)}, kapsam dışı {len(disi)}')
    for e in (1, 6, 12, 25): print(f'  tepeKazanc ≥ {e}: {sum(1 for r in ok if r["tepeKazanc"] >= e)}')

def isler():
    """olcum*.json (ana + gr) → işler. Süzgeç: tepeKazanc ≥ esik, iou ≥ 0,97, kaynak bugünkü `spec_for` ile aynı (Celestial/Hızır ada göre değil)."""
    esik = int(ky.arg('--esik', 6)); L = cc.ledger()['jetonlar']
    import glob as _g
    M = {'sonuc': [r for f in sorted(_g.glob(f'{OUT}/olcum*.json')) for r in json.load(open(f, encoding='utf-8'))['sonuc']]}
    seen = {}
    for r in M['sonuc']: seen[r['jeton']] = r
    M['sonuc'] = [r for r in seen.values() if spec_for(r['jeton'], L) == r['kaynak']]
    J = json.load(open(ky.ISLER, encoding='utf-8')); var = {j['jeton'] for j in J['isler']}
    yeni = []
    for r in M['sonuc']:
        if 'hata' in r or r['tepeKazanc'] < esik or r['jeton'] in var or r['iou'] < 0.97: continue
        sp = r['kaynak']
        yeni.append({'jeton': r['jeton'], 'grup': 'tepe', **sp, 'yerlesim': 'eski', 'cizgiSuz': True,
                     'not': f"KESIM-TEPE 2026-11-23: üst kontur/tepe geri ({r['tepeKazanc']} px; iou {r['iou']})"})
    J['isler'] += yeni
    open(ky.ISLER, 'w', encoding='utf-8').write(json.dumps(J, ensure_ascii=False, indent=1) + '\n')
    print('eklenen iş', len(yeni)); print(','.join(j['jeton'] for j in yeni))

if __name__ == '__main__':
    {'olc': olc, 'isler': isler}[sys.argv[1]]()
