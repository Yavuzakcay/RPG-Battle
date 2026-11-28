/**
 * Görev Y1: yolculuğun savaş durağı ↔ savaş motoru. Durak senaryosunun (sim senaryosu) haritası ve partinin
 * seviyesindeki düşman listesiyle haritalı savaş kurulur (Game Master yerleştirir ve başlatır); savaş bitince
 * karakter durumları (`applyBattleResult`, normal savaştakiyle aynı) ve XP yolculuğa `battle_result` olarak döner.
 */
import { combatantFromMonster, combatantFromSheet, type BattleState, type Combatant } from '../battle';
import { goalsFromData } from '../battle/goals';
import { getMonster } from '../data';
import type { Rng } from '../rules/dice';
import type { SavedCharacter } from '../rules/builder';
import type { CharacterStatus } from '../rules/characterRest';
import { SCENARIOS, enemiesAt, scenarioXp } from '../sim/balance';
import { currentStop } from '../journey/engine';
import type { JourneyCommand, JourneyState } from '../journey/types';
import { applyBattleResult, withStatus } from './partyStatus';
import { createMapBattle } from './setup';
import { KAGIT_PREFIX, isKagitKey, kagitCr, kagitKaydi, sheetFoeCombatant } from './sheetFoe';
import { crXp } from '../journey/encounter';
import type { Session } from '../ui/session';

/** Savaşa girebilen üyeler (ölü ve 0 HP'deki savaşamaz). */
export const fighters = (j: JourneyState) => j.party.filter((m) => !m.status.dead && m.status.hp > 0);

/** Duraktaki savaşın katılımcıları (parti kayıtlı durumuyla + senaryonun düşmanları) ve XP'si. */
export function stopParticipants(j: JourneyState): { participants: Combatant[]; scenario: (typeof SCENARIOS)[number]; xp: number } | null {
  const stop = currentStop(j);
  const scenario = stop?.kind === 'battle' ? SCENARIOS.find((s) => s.id === stop.scenario) : undefined;
  if (!scenario?.map) return null;
  const party = fighters(j).map((m, i) => withStatus(combatantFromSheet(m.sheet, { id: `pc${i + 1}`, ownerId: m.id }), m));
  const foes: Combatant[] = [];
  const list = stop?.enemies ?? enemiesAt(scenario, j.level);
  for (const [id, n] of Object.entries(list)) {
    // Görev DUSMAN-KAGIT-1: `kagit:<kimlik>` anahtarı karakter kâğıdından düşman (`data/kagit-dusmanlar.json`; kayıt yoksa atlanır).
    if (isKagitKey(id)) {
      const k = kagitKaydi(id);
      for (let i = 1; k && i <= n; i++) foes.push(sheetFoeCombatant(k.sheet, { id: `${id.slice(KAGIT_PREFIX.length)}-${i}`, name: n > 1 ? `${k.sheet.name} ${i}` : k.sheet.name }));
      continue;
    }
    for (let i = 1; i <= n; i++) foes.push(combatantFromMonster(getMonster(id), { id: `${id}-${i}`, name: n > 1 ? `${getMonster(id).name} ${i}` : getMonster(id).name }));
  }
  // Kâğıt anahtarı yoksa XP eskisi gibi; varsa canavarlar eski yoldan, kâğıtlar CR tahmininden.
  const kagit = Object.entries(list).filter(([id]) => isKagitKey(id));
  const monsters = kagit.length ? Object.fromEntries(Object.entries(list).filter(([id]) => !isKagitKey(id))) : list;
  const kagitXp = kagit.reduce((n, [id, k]) => n + crXp(kagitCr(id) ?? '0') * (kagitKaydi(id) ? k : 0), 0);
  const xp = (stop?.enemies || kagit.length ? scenarioXp({ ...scenario, enemies: monsters, byLevel: { [j.level]: monsters } }, j.level) : scenarioXp(scenario, j.level)) + kagitXp;
  return { participants: [...party, ...foes], scenario, xp };
}

/** Durak savaşının oturumu (kurulum aşamasında; Game Master yerleştirir ve başlatır). */
export function journeyBattleSession(j: JourneyState, rng: Rng): Session | null {
  const p = stopParticipants(j);
  if (!p?.scenario.map) return null;
  const stop = currentStop(j);
  // Kuyruk 18 V2 (sefer): durağın hedefi ve parti girişi (1 tabanlı) haritanınkinin yerine.
  const goals = stop?.goals ? goalsFromData(stop.goals) : undefined;
  return createMapBattle(p.participants, {
    ...p.scenario.map, mirrored: false, ...(goals ? { goals } : {}),
    ...(stop?.partyStart ? { partyStart: stop.partyStart.map(([c, r]) => ({ col: c - 1, row: r - 1 })) } : {}),
  }, rng);
}

/** Biten savaştan yolculuk komutu: sonuç, karakter durumları, XP. */
export function battleResultCommand(j: JourneyState, final: BattleState): JourneyCommand {
  const won = final.status === 'finished' && final.winner === 'party';
  const after = applyBattleResult(j.party as unknown as SavedCharacter[], final);
  const statuses: Record<string, CharacterStatus> = {};
  for (const c of after) if (c.status) statuses[c.id] = c.status;
  return { type: 'battle_result', outcome: won ? 'won' : 'lost', statuses, xp: won ? stopParticipants(j)?.xp ?? 0 : 0,
    ...(final.flags?.length ? { flags: [...final.flags] } : {}) };
}
