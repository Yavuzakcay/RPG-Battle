/**
 * Test ve kontrol betikleri için örnek karakterler (arayüzde gösterilmez; uygulama bu dosyayı içe aktarmaz).
 * `scripts/kara-ekran.mjs` bunları tarayıcı belleğine yazıp GM ekranını açar.
 */
import { DEMO_SHEETS } from '../demo';
import { newId } from '../app/storage';
import type { SavedCharacter } from '../rules/builder';

/**
 * Örnek karakterler: demo savaşındaki Mira ve Bor'un oluşturucu kurallarına uyan kopyaları
 * (standart dizi; Mira'nın listesindeki Cure Wounds wizard büyüsü olmadığı için yok).
 */
export function demoCharacters(): SavedCharacter[] {
  const { MIRA, BOR } = DEMO_SHEETS;
  return [
    {
      id: newId(), method: 'standard', classSkills: ['arcana', 'investigation'], otherSkills: ['history', 'insight', 'perception'],
      sheet: {
        ...MIRA, lineageId: 'high-elf', subclassId: 'evoker', baseScores: { str: 8, dex: 14, con: 13, int: 15, wis: 12, cha: 10 },
        spellNames: (MIRA.spellNames ?? []).filter((n) => n !== 'Cure Wounds'),
        skills: ['arcana', 'investigation', 'history', 'insight', 'perception'],
      },
    },
    {
      id: newId(), method: 'standard', classSkills: ['athletics', 'perception'], otherSkills: ['intimidation', 'survival'],
      sheet: { ...BOR, subclassId: 'champion', baseScores: { str: 15, dex: 13, con: 14, int: 10, wis: 12, cha: 8 } },
    },
  ];
}


/** Örnek savaş: örnek karakterler, harita ve canavarlar (testler). */
export const READY_BATTLE = { mapId: 'col', variantId: 'gunduz', enemies: { troll: 1, wolf: 2 } as Record<string, number> };

