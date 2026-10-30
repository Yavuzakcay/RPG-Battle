/**
 * Sınıf büyü listeleri (Görev K6; SRD 5.2.1): `data/sinif-buyuleri.json` (SRD büyü verisinden türetilir: kimlik, ad,
 * seviye). Oyunda mekaniği olan büyü `data/spells.json`'da aynı kimlikle; olmayan listede "oyunda yok" diye gösterilir.
 * Yalnızca oluşturucu kullanır (ayrı parça). Saf.
 */
import { spells, type Spell } from '../data';
import lists from '../../data/sinif-buyuleri.json';

export interface ClassSpell { id: string; name: string; level: number; spell?: Spell }

/** Sınıfın SRD büyü listesi (seviye, ad sırasıyla); oyundaki kaydı varsa `spell`. */
export function classSpellList(classId: string): ClassSpell[] {
  const rows = (lists.classes as unknown as Record<string, Array<[string, string, number]>>)[classId] ?? [];
  return rows.map(([id, name, level]) => {
    const spell = spells.find((x) => x.id === id);
    return { id, name: spell?.name ?? name, level, ...(spell ? { spell } : {}) };
  });
}
