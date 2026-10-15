/** İlk ekran için hazır bir savaş: iki karakter, bir Troll ve iki Wolf, buzul ortamı. */
import type { Combatant } from './battle';
import { combatantFromMonster, combatantFromSheet, startBattle } from './battle';
import { environments, getMonster } from './data';
import type { Rng } from './rules/dice';
import type { CharacterSheet } from './rules/stats';
import { createSession, dispatch, type Session } from './ui/session';
import { getMap } from './map/maps';
import type { Offset } from './rules/hex';

const MIRA: CharacterSheet = {
  name: 'Mira', raceId: 'elf', classId: 'wizard', level: 5,
  baseScores: { str: 8, dex: 14, con: 14, int: 16, wis: 10, cha: 10 },
  backgroundBonuses: { dex: 2, int: 1 },
  armorName: 'Zırhsız', shield: false, itemNames: [],
  spellNames: ['Fire Bolt', 'Ray of Frost', 'Magic Missile', 'Fireball', 'Cure Wounds', 'Hold Person', 'Sleep'],
  weapons: [{ name: 'Quarterstaff' }],
};

const BOR: CharacterSheet = {
  name: 'Bor', raceId: 'dwarf', classId: 'fighter', level: 5,
  baseScores: { str: 16, dex: 12, con: 15, int: 8, wis: 10, cha: 8 },
  backgroundBonuses: { con: 2, wis: 1 },
  armorName: 'Chain Mail', shield: true, itemNames: [],
  weapons: [{ name: 'Longsword', enchant: 1 }, { name: 'Light crossbow' }],
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

/** Başlangıç bölgesindeki altıgenler, haritanın ortasına (satır 4) yakın olanlar önce. */
function preferred(zone: Offset[]): Offset[] {
  return [...zone].sort((a, b) => Math.abs(a.row - 3) - Math.abs(b.row - 3) || a.row - b.row || a.col - b.col);
}

/**
 * Haritalı savaş oturumu: kurulum aşamasında başlar, herkes kendi başlangıç bölgesine
 * otomatik yerleşir (istenirse `place` ile değiştirilir), GM `start_battle` ile başlatır.
 */
export function createMapSession(
  mapId: string, variantId: string, mirrored: boolean, rng: Rng = Math.random,
): Session {
  const map = getMap(mapId, { mirrored });
  const { state, events } = startBattle('harita', map.environmentId, demoParticipants(), rng, {
    map: { id: mapId, variantId, mirrored },
  });
  let session = createSession(state, events);
  const free = { party: preferred(map.startZones.players), enemies: preferred(map.startZones.enemies) };
  for (const c of Object.values(session.state.combatants)) {
    const at = free[c.side].shift();
    if (at) session = dispatch(session, { type: 'place', actorId: c.id, at }, rng);
  }
  return { ...session, error: null };
}
