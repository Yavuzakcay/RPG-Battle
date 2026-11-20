/**
 * Mekanik matris: 339 büyünün bağlam üreticilerine dağıtımı.
 */
import { spells } from '../../data';
import { SRD_SPELLS } from './srd';
import { damageRows, healRows } from './buyu';
import { otherRows } from './buyuDiger';
import type { Satir } from './ortak';

export function tumBuyuSatirlari(only?: string[]): Satir[] {
  const out: Satir[] = [];
  for (const sp of spells) {
    if (only && !only.includes(sp.name)) continue;
    const s = SRD_SPELLS.find((x) => `spells:${x.id}` === sp.srd);
    if (!s) {
      out.push({ tur: 'büyü', ad: sp.name, seviye: String(sp.level), siniflar: '', mekanik: sp.mechanics.kind, baglam: 'SRD kaydı', kategori: 'yapım',
        beklenen: 'SRD kaydı var', gercek: `yok (${sp.srd})`, sonuc: 'yanlış', not: 'Büyünün SRD kimliği eşleşmiyor.' });
      continue;
    }
    out.push(...otherRows(sp, s, (sp2, s2) => {
      if (s2.heal && !s2.damage.length && s2.cast !== 'long') return healRows(sp2, s2);
      return damageRows(sp2, s2);
    }));
  }
  return out;
}
