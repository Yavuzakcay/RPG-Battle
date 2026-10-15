/** İlk ekran için hazır bir savaş: iki karakter, bir Troll ve iki Wolf, buzul ortamı. */
import type { Combatant } from './battle';
import { combatantFromMonster, combatantFromSheet, startBattle } from './battle';
import { environments, getMonster } from './data';
import type { Rng } from './rules/dice';
import type { CharacterSheet } from './rules/stats';
import { createSession, type Session } from './ui/session';
import { createMapBattle } from './app/setup';

const MIRA: CharacterSheet = {
  name: 'Mira', raceId: 'elf', classId: 'wizard', level: 5, gender: 'kadin',
  baseScores: { str: 8, dex: 14, con: 14, int: 16, wis: 10, cha: 10 },
  backgroundBonuses: { dex: 2, int: 1 },
  armorName: 'Zırhsız', shield: false, itemNames: [],
  spellNames: ['Fire Bolt', 'Ray of Frost', 'Magic Missile', 'Fireball', 'Cure Wounds', 'Hold Person', 'Sleep'],
  weapons: [{ name: 'Quarterstaff' }],
  // Wizard: Arcana, Investigation; Sage: History (+ Arcana yerine Insight); Elf Keen Senses: Perception.
  skills: ['arcana', 'investigation', 'history', 'insight', 'perception'],
};

const BOR: CharacterSheet = {
  name: 'Bor', raceId: 'dwarf', classId: 'fighter', level: 5, gender: 'erkek',
  baseScores: { str: 16, dex: 12, con: 15, int: 8, wis: 10, cha: 8 },
  backgroundBonuses: { con: 2, wis: 1 },
  armorName: 'Chain Mail', shield: true, itemNames: [],
  weapons: [{ name: 'Longsword', enchant: 1 }, { name: 'Light crossbow' }],
  // Fighter: Athletics, Perception; Soldier: Intimidation (+ Athletics yerine Survival).
  skills: ['athletics', 'perception', 'intimidation', 'survival'],
};

function lowered(c: Combatant, hp: number | null): Combatant {
  return hp === null ? c : { ...c, hp: Math.min(hp, c.maxHp) };
}

export type Scenario = 'standart' | 'dusuk-hp';
export const SCENARIOS: Array<{ id: Scenario; label: string }> = [
  { id: 'standart', label: 'Standart' },
  { id: 'dusuk-hp', label: 'Düşük HP (hızlı sonuç)' },
];

export function createDemoSession(rng: Rng = Math.random, scenario: Scenario = 'standart'): Session {
  const buzul = environments.find((e) => e.name.startsWith('Buzul'));
  if (!buzul) throw new Error('Buzul ortamı bulunamadı');
  const { state, events } = startBattle(
    'demo',
    buzul.id,
    [
      lowered(combatantFromSheet(MIRA, { id: 'mira', ownerId: 'p1', height: 1 }), scenario === 'dusuk-hp' ? 6 : null),
      lowered(combatantFromSheet(BOR, { id: 'bor', ownerId: 'p2', height: 0 }), scenario === 'dusuk-hp' ? 10 : null),
      combatantFromMonster(getMonster('troll'), { id: 'troll', height: -1 }),
      combatantFromMonster(getMonster('wolf'), { id: 'wolf1', name: 'Wolf 1', height: 0 }),
      combatantFromMonster(getMonster('wolf'), { id: 'wolf2', name: 'Wolf 2', height: 0 }),
    ],
    rng,
  );
  return createSession(state, events);
}

/** Haritalı demo: Mira ve Bor, karşılarında bir Troll ve iki Wolf. */
function demoParticipants(): Combatant[] {
  return [
    combatantFromSheet(MIRA, { id: 'mira', ownerId: 'p1' }),
    combatantFromSheet(BOR, { id: 'bor', ownerId: 'p2' }),
    combatantFromMonster(getMonster('troll'), { id: 'troll' }),
    combatantFromMonster(getMonster('wolf'), { id: 'wolf1', name: 'Wolf 1' }),
    combatantFromMonster(getMonster('wolf'), { id: 'wolf2', name: 'Wolf 2' }),
  ];
}

/**
 * Haritalı demo savaşı: Mira, Bor, Troll ve iki Wolf; herkes kendi başlangıç bölgesine
 * otomatik yerleşir (istenirse `place` ile değiştirilir), GM `start_battle` ile başlatır.
 */
export function createMapSession(
  mapId: string, variantId: string, mirrored: boolean, rng: Rng = Math.random,
  extra: { options?: string[]; civilians?: number } = {},
): Session {
  return createMapBattle(demoParticipants(), { mapId, variantId, mirrored, ...extra }, rng);
}

/** Oluşturucunun "örnek karakter" düğmeleri için demo karakter formları. */
export const DEMO_SHEETS = { MIRA, BOR };
