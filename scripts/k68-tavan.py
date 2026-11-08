"""Kuyruk K68b: iç mekân haritalarının tavan yüksekliği (`tavanFt`, ft; yalnız kural sürümü 52+ okunur).

Değerlerin TEK yeri bu betikteki `TAVAN` tablosudur (⚠ tasarım tahmini, SRD tavan yüksekliği vermez; K68 planı karar 2:
oda 12–15 ft, mağara 20 ft, salon 30 ft). Betik tablodaki her haritanın BÜTÜN varyantlarına `"tavanFt": N` satırını
varyantın `id` satırının hemen altına yazar; tabloda olmayan haritalardan eski `tavanFt` satırını siler (açık gök).
Harita üreticilerinden (k27b, k34a, k35, k36, col, orman, derinlikler, sefer…) SONRA çalıştırılır; idempotent.
Metin biçimi korunur (yalnız satır eklenir/silinir/değişir).

Kullanım: python scripts/k68-tavan.py [--kuru]
"""
import glob
import json
import re
import sys

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


def main() -> None:
    dry = '--kuru' in sys.argv
    touched, seen = [], set()
    for path in sorted(glob.glob('harita/*/*.json')):
        p = path.replace('\\', '/')
        if '/belgeler/' in p or '/_ortak/' in p:
            continue
        text = open(path, encoding='utf-8').read()
        data = json.loads(text)
        mid = data.get('id')
        want = TAVAN.get(mid)
        # Eski satırları kaldır (idempotent), sonra yeniden yaz.
        text2 = re.sub(r'\n[ \t]*"tavanFt": \d+,', '', text)
        if want:
            seen.add(mid)
            start = text2.index('"variants"')
            ins = []
            pos = start
            for v in data.get('variants', []):
                m = re.compile(r'\n([ \t]*)"id": "' + re.escape(v['id']) + r'",').search(text2, pos)
                if not m:
                    raise SystemExit(f'{path}: varyant "{v["id"]}" satırı bulunamadı')
                ins.append((m.end(), f'\n{m.group(1)}"tavanFt": {want[0]},'))
                pos = m.end()
            for at, s in sorted(ins, reverse=True):
                text2 = text2[:at] + s + text2[at:]
        check = json.loads(text2)
        if want and any(v.get('tavanFt') != want[0] for v in check.get('variants', [])):
            raise SystemExit(f'{path}: tavanFt bütün varyantlara yazılamadı')
        if text2 != text:
            touched.append(f'{mid} ({path}): ' + (f'{want[0]} ft, {len(check["variants"])} varyant' if want else 'tavan kaldırıldı'))
            if not dry:
                open(path, 'w', encoding='utf-8', newline='\n').write(text2)
    missing = sorted(set(TAVAN) - seen)
    if missing:
        raise SystemExit(f'Haritası bulunamayan kimlikler: {", ".join(missing)}')
    print(f'{len(touched)} harita değişti ({len(TAVAN)} tavanlı):')
    for t in touched:
        print(' ', t)


if __name__ == '__main__':
    main()
