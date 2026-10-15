/**
 * Gizlenme (haritalı savaş). Genel mekanik: altıgen bir "gizlenme yeri" ise (zemin kataloğunda
 * `hide`, ya da haritanın `hideTerrain` listesinde) orada Gizlen (hide) denenebilir.
 * Çöl'de açık kum (`.`) ve kum tepesi (`d`) bunun bir örneği; orman ve bataklıktaki çalılık
 * (`g`, +2) katalogdan gelir.
 *
 * SRD 5.2.1 Hide: DC 15 Dexterity (Stealth); başarılı toplam, bulmak için gereken Wisdom
 * (Perception) DC'si olur. Gizlenen düşmanlarca hedeflenemez, saldırısında avantaj alır;
 * saldırınca, büyü yapınca, yürüyünce veya atlayınca ya da bulununca ortaya çıkar.
 */
import { getMap } from '../map/maps';
import { rollD20, type Rng } from '../rules/dice';
import type { Offset } from '../rules/hex';
import { skillBonus } from '../rules/skills';
import { fail, type CommandResult } from './common';
import { lineOfFire } from './cover';
import { mapHideSources } from './maprules';
import { combineModes } from '../rules/modes';
import { terrainAt } from './movement';
import { applyEvents } from './reduce';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

/** SRD 5.2.1 Hide eyleminin zorluğu. */
export const HIDE_DC = 15;

/** Altıgen gizlenme yeriyse Stealth bonusu, değilse null. */
export function hideSpotBonus(state: BattleState, at: Offset): number | null {
  if (!state.map) return null;
  const t = terrainAt(state, at);
  if (t.hide) return t.hide.bonus;
  const extra = getMap(state.map.id).hideTerrain[t.char];
  return extra ?? null;
}

export function executeHide(state: BattleState, actor: Combatant, rng: Rng): CommandResult {
  if (!state.map || !actor.pos) return fail('Gizlenme yalnızca haritalı savaşta yapılır.');
  if (actor.hidden) return fail('Zaten gizlenmiş.');
  const bonus = hideSpotBonus(state, actor.pos);
  if (bonus === null) return fail(`Burada gizlenilemez (${terrainAt(state, actor.pos).name}).`);
  const mode = combineModes([
    ...(actor.stealthDisadvantage ? [{ effect: 'disadvantage' as const, reason: 'Zırh' }] : []),
    ...mapHideSources(state),
  ]);
  const roll = rollD20(mode, rng);
  const total = roll.kept + skillBonus(actor, 'stealth') + bonus;
  const events: BattleEvent[] = [{
    type: 'hide_attempted', actorId: actor.id, mode, d20: roll.rolls, natural: roll.kept, total, bonus,
    dc: HIDE_DC, success: total >= HIDE_DC,
  }];
  return { ok: true, state: applyEvents(state, events), events };
}

/**
 * Arama: Wisdom (Perception) zarı; görüş hattındaki gizlenmiş düşmanlardan bulunma DC'si
 * toplamı aşmayanlar bulunur.
 */
export function executeSearch(state: BattleState, actor: Combatant, rng: Rng): CommandResult {
  if (!state.map || !actor.pos) return fail('Arama yalnızca haritalı savaşta yapılır.');
  const roll = rollD20('normal', rng);
  const total = roll.kept + skillBonus(actor, 'perception');
  const found = Object.values(state.combatants)
    .filter((c) => c.side !== actor.side && c.hidden && c.hidden.dc <= total && !lineOfFire(state, actor, c).blocked)
    .map((c) => c.id);
  const events: BattleEvent[] = [{ type: 'searched', actorId: actor.id, natural: roll.kept, total, found }];
  return { ok: true, state: applyEvents(state, events), events };
}

/** Gizlenmiş yaratığı ortaya çıkaran komutlar ve sebepleri. */
const REVEALING: Partial<Record<Command['type'], string>> = {
  attack: 'saldırdı',
  monster_attack: 'saldırdı',
  multiattack: 'saldırdı',
  cast_spell: 'büyü yaptı',
  move: 'yürüdü',
  jump: 'atladı',
};

/** Başarılı bir komuttan sonra, komutu veren gizlenmişse ortaya çıkma olayı. */
export function revealEvent(before: BattleState, after: BattleState, cmd: Command): BattleEvent | null {
  if (!('actorId' in cmd)) return null;
  const reason = REVEALING[cmd.type];
  if (!reason || !before.combatants[cmd.actorId]?.hidden) return null;
  if (after.status !== 'active' || !after.combatants[cmd.actorId]?.hidden) return null;
  return { type: 'revealed', actorId: cmd.actorId, reason };
}
