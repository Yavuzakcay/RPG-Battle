/**
 * 2026-11-22: yeniden çizilmiş (kullanıcının kabul ettiği güncel çizim) ham sayfanın BÜTÜN hücreleri oyunda o sayfadan kesilmiş olmalı
 * (kesim defteri `data/cc-kesim-kaynak.json` `yenidenCizilmis`). Kısmi kesim tuzağı: `clerik-male-celestial.jpg`'den 2026-11-19'da
 * yalnız hücre 7 ve 9 kesildi ("halesiz-temiz dokunulmaz"), kalan 7 hücre eski çizimde (kahverengi saç, yıldızsız) kaldı. Kesicideki
 * kural `scripts/cc-kesim.py` `tum_hucreler` (kısmi listeyi uyarıyla tamamlar), yalnız eksik hücreler için adım `yeniden`.
 * Denetim raporu: harita/belgeler/CELESTIAL-KAYNAK-DENETIM.md (`python scripts/celestial-kaynak-denetim.py`).
 */
import { describe, expect, it } from 'vitest';
import defter from '../../data/cc-kesim-kaynak.json';
import kesimSrc from '../../scripts/cc-kesim.py?raw';

type Spec = { sinif: string; irk: string; cinsiyet: string; kod: string; hucre: number };
const D = defter as unknown as { yenidenCizilmis?: Record<string, Spec>; jetonlar: Record<string, { kazanan?: { kaynak: string; dosya: string; hucre: number } }> };
/** Jeton dosya adları (yalnız ad; görsel yüklenmez). */
const files = new Set(Object.keys(import.meta.glob('../../public/characters/*.webp')).map((p) => p.split('/').pop()));

describe('yeniden çizilmiş ham sayfalar: bütün hücreler kesilir', () => {
  const sayfalar = Object.entries(D.yenidenCizilmis ?? {});
  it('defterde işaretli sayfa var (Celestial erkek Cleric)', () => {
    expect(sayfalar.map(([f]) => f)).toContain('clerik-male-celestial.jpg');
  });
  it('her işaretli sayfanın bütün hücreleri oyunda o sayfadan (kesim defteri kazananı) ve dosyası var', () => {
    for (const [f, s] of sayfalar) {
      expect(s.hucre, f).toBeGreaterThan(0);
      for (let n = 1; n <= s.hucre; n++) {
        const name = `${s.irk}-${s.cinsiyet}-${s.sinif}-${s.kod}${n}`;
        expect(D.jetonlar[name]?.kazanan, `${f} hücre ${n} → ${name}`).toMatchObject({ dosya: f, hucre: n });
        expect(files.has(`${name}.webp`), name).toBe(true);
      }
    }
  });
  it('kesici yeniden çizilmiş sayfada kısmi hücre listesini tamamlar (diger adımı tum_hucreler üstünden)', () => {
    expect(kesimSrc).toMatch(/def tum_hucreler\(/);
    expect(kesimSrc).toContain('cells = tum_hucreler(f, cells, len(names), rep, L)');
    expect(kesimSrc).toMatch(/'yeniden': lambda: yeniden\(/);
  });
});
