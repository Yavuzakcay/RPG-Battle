/**
 * Kuyruk 33 M2: boss paketi (kural sürümü 11). Efsanevi eylemler (SRD 5.2.1 Legendary Actions, `data/efsanevi.json`):
 * boss başka bir yaratığın turunun hemen ardından bir kullanım harcar, kendi turunun başında yenilenir; in olayı
 * (Volkan `lairEruption`): tur başında (inisiyatif 20) lav püskürmesi. Uçan boss yapay zekâsı `ai.ts`'te
 * (`bossFlightMove`). Hepsi Game Master anahtarı; eski savaşlar (sürüm < 11) birebir aynı.
 */
import data from '../../data/efsanevi.json';
import { distance, sameHex, type Offset } from '../rules/hex';
import { rollD20, rollDice, rollTag, type Rng } from '../rules/dice';
import { isIncapacitated } from '../rules/conditions';
import { globalRule } from './ruleControl';
import { canSee, damageEffect, ruleOf, saveEffect } from './maprules';
import { applyEvents } from './reduce';
import { isTargetable } from './common';
import { effectiveAc } from './divine';
import { strikeApi } from './reactions';
import { surfaceEvent } from './surfaces';
import { isAirborne } from './flight';
import type { BattleEvent, BattleState, Combatant } from './types';

export interface LegendaryAction {
  id: string; tr: string; en: string; kind: 'strike' | 'rays';
  attack?: string; count?: number; dice?: string; damageType?: string; bonus?: number; rangeFt?: number; oncePerTurn?: boolean;
}
export interface LegendarySpec { uses: number; actions: LegendaryAction[] }
const DATA = data as unknown as { defaultUses: number; monsters: Record<string, LegendarySpec>; yuva: LegendarySpec };

/** Savaşçının efsanevi eylemleri (anahtar kapalıysa, eski savaşta ya da boss değilse null). */
export function legendaryOf(state: BattleState, c: Combatant): LegendarySpec | null {
  if (!globalRule(state, 'legendaryActions')) return null;
  if (c.monsterId && DATA.monsters[c.monsterId]) return DATA.monsters[c.monsterId] as LegendarySpec;
  if (state.map?.dragon?.id === c.id) return DATA.yuva;
  return null;
}
export const legendaryLeft = (c: Combatant, spec: LegendarySpec): number => c.legendaryLeft ?? spec.uses;

const awake = (c: Combatant) => c.hp > 0 && c.life !== 'dead' && !c.asleep && !c.unaware && !c.summon?.gone && !!c.pos && !isIncapacitated(c.conditions);
const foesOf = (s: BattleState, c: Combatant) =>
  Object.values(s.combatants).filter((o) => o.side !== c.side && !o.civilian && o.hp > 0 && o.life !== 'dead' && o.pos && isTargetable(o));

/** Bosslar (ayakta, uyanık, efsanevi eylemli). */
export function bosses(state: BattleState): Array<{ c: Combatant; spec: LegendarySpec }> {
  const out: Array<{ c: Combatant; spec: LegendarySpec }> = [];
  for (const c of Object.values(state.combatants)) {
    const spec = legendaryOf(state, c);
    if (spec) out.push({ c, spec });
  }
  return out;
}

/** Boss'un turu başlıyor: kullanımlar yenilenir (yalnızca harcanmışsa olay). */
export function legendaryRefreshEvents(state: BattleState, actorId: string): BattleEvent[] {
  const c = state.combatants[actorId];
  const spec = c ? legendaryOf(state, c) : null;
  if (!c || !spec || (c.legendaryLeft === undefined && !c.legendaryUsed?.length)) return [];
  return [{ type: 'legendary_refresh', actorId, left: spec.uses }];
}

/** Işın: büyü saldırısı (d20 + bonus, AC'ye karşı), isabette ateş hasarı. */
function rayEvents(state: BattleState, boss: Combatant, a: LegendaryAction, target: Combatant, rng: Rng): BattleEvent[] {
  const events: BattleEvent[] = [];
  let cur = state;
  for (let i = 0; i < (a.count ?? 1); i++) {
    const t = cur.combatants[target.id];
    if (!t || t.hp <= 0) break;
    const d = rollD20('normal', rollTag(rng, { by: boss.id, kind: 'attack' }));
    const total = d.kept + (a.bonus ?? 0);
    const hit = d.kept === 20 || (d.kept !== 1 && total >= effectiveAc(cur, t));
    const what = `${a.tr} ${i + 1}: d20 ${d.kept} + ${a.bonus ?? 0} = ${total} → ${hit ? 'isabet' : 'ıska'}`;
    const ev: BattleEvent = hit
      ? damageEffect(t, 'legendaryActions', what, { dice: d.kept === 20 ? doubled(a.dice ?? '1d6') : (a.dice ?? '1d6'), type: a.damageType ?? 'fire' }, rng)
      : { type: 'map_note', text: `${boss.name} → ${t.name}: ${what}.` };
    events.push(ev);
    cur = applyEvents(cur, [ev]);
  }
  return events;
}
const doubled = (dice: string) => dice.replace(/^(\d+)d/, (_, n: string) => `${Number(n) * 2}d`);

/**
 * Bir yaratığın turu bitti: her boss (başka biri, uyanık, kullanımı kalan) bir efsanevi eylem dener. Sıra: kullanılabilir
 * ışın (görüş + menzil), sonra erişimdeki düşmana tek saldırı. Kuralsız ya da eski savaşta boş.
 */
export function legendaryEvents(state: BattleState, endedId: string, rng: Rng): BattleEvent[] {
  if (state.status !== 'active' || !state.map) return [];
  const events: BattleEvent[] = [];
  let cur = state;
  for (const { c: b0, spec } of bosses(state)) {
    const b = cur.combatants[b0.id];
    if (!b || b.id === endedId || !awake(b) || legendaryLeft(b, spec) <= 0) continue;
    const foes = foesOf(cur, b).sort((x, y) => distance(x.pos as Offset, b.pos as Offset) - distance(y.pos as Offset, b.pos as Offset) || x.hp - y.hp);
    let done: BattleEvent[] = [];
    let used: LegendaryAction | null = null;
    for (const a of spec.actions) {
      if (a.oncePerTurn && b.legendaryUsed?.includes(a.id)) continue;
      if (a.kind === 'rays') {
        const t = foes.find((f) => distance(f.pos as Offset, b.pos as Offset) * 5 <= (a.rangeFt ?? 120) && canSee(cur, b, f));
        if (!t) continue;
        done = rayEvents(cur, b, a, t, rng); used = a; break;
      }
      const api = strikeApi();
      const t = api ? foes.find((f) => api.can(cur, b.id, f.id)) : undefined;
      if (!api || !t) continue;
      done = api.strike(cur, b.id, t.id, rng, a.attack);
      if (!done.length) continue;
      used = a; break;
    }
    if (!used) continue;
    const note: BattleEvent = { type: 'legendary_used', actorId: b.id, actionId: used.id, name: used.tr, left: legendaryLeft(b, spec) - 1 };
    events.push(note, ...done);
    cur = applyEvents(cur, [note, ...done]);
  }
  return events;
}

/**
 * İn olayı (inisiyatif 20 = tur başı): Volkan'da ejderha (boss) uyanık ve ayaktayken yerdeki parti üyelerinden en
 * çok `count` tanesinin altıgeninde lav püskürür: DEX save, ateş hasarı (başarıda yarı; zar bir kez), altıgenler bir
 * tur alev yüzeyi.
 */
export function lairEvents(state: BattleState, rng: Rng): BattleEvent[] {
  const r = ruleOf(state, 'lairEruption');
  if (!r || state.status !== 'active') return [];
  const boss = bosses(state).map((x) => x.c).find(awake);
  if (!boss) return [];
  const victims = foesOf(state, boss).filter((f) => !isAirborne(f))
    .sort((a, b) => b.hp - a.hp || a.id.localeCompare(b.id)).slice(0, typeof r.count === 'number' ? r.count : 2);
  if (!victims.length) return [];
  const dice = typeof r.damage === 'string' ? r.damage : '3d6';
  const rolled = rollDice(dice, rollTag(rng, { by: boss.id, kind: 'damage' }));
  const hexes = victims.map((v) => v.pos as Offset);
  const events: BattleEvent[] = [{ type: 'map_note', text: `İn olayı: ${boss.name} lav püskürtüyor (${hexes.map((h) => `${h.col + 1},${h.row + 1}`).join('; ')}), hasar ${rolled.rolls.join('+')} = ${rolled.total}.` }];
  for (const v of victims) {
    events.push(saveEffect(v, 'lairEruption', 'lav püskürmesi', 'dex', typeof r.dc === 'number' ? r.dc : 15, rng,
      { hit: { dice, type: typeof r.damageType === 'string' ? r.damageType : 'fire', rolled, halfOnSave: true } }));
  }
  const fire = surfaceEvent(state, 'fire', hexes.filter((h, i) => hexes.findIndex((x) => sameHex(x, h)) === i), boss.id, boss.side);
  if (fire.type === 'zone_created') fire.zone.until = state.round;
  events.push(fire);
  return events;
}
