/**
 * Kuyruk AS1a/AS1b: alt soy buff/debuff açıklaması (oluşturucu; metinler `data/alt-soy-metin.json`, ana parçaya girmez) ve
 * durum etiketi (`data/races.json` `durum`: calisir / kismi / planli).
 */
import metin from '../../data/alt-soy-metin.json';
import type { Lineage, LocalText } from '../data';

const M = metin as unknown as { kismiNot: LocalText; soylar: Record<string, { buff?: LocalText[]; debuff?: LocalText[] }> };

export interface LineageNotes { buff: string[]; debuff: string[]; status: NonNullable<Lineage['durum']> | null; note: string | null }

export function lineageNotes(raceId: string, l: Lineage, lang: 'tr' | 'en'): LineageNotes {
  const m = M.soylar[`${raceId}/${l.id}`];
  return {
    buff: (m?.buff ?? []).map((x) => x[lang] ?? x.tr), debuff: (m?.debuff ?? []).map((x) => x[lang] ?? x.tr),
    status: l.durum ?? null, note: l.durum === 'kismi' ? M.kismiNot[lang] ?? M.kismiNot.tr : null,
  };
}
