/**
 * Uyuyan ejderha (harita kuralı `sleepingDragon`, Volkan "Uyuyan ejderha" varyantı). Ejderha
 * uykudayken turunu atlar, hareket etmez, yakın dövüş saldırıları ona avantajlıdır.
 *
 * Uyanma (değerler varyantın JSON'unda, `wake`):
 * - herhangi bir hasar (HP düşerse);
 * - `loudFt` içinde gürültülü büyü/yetenek: hasar türü `loud.damageTypes` (gök gürültüsü) ya da
 *   adı `loud.names` / `loud.words` (Thunderwave, roar, screech...); büyücü ya da alan merkezi yakınsa;
 * - bitişik altıgene bir yaratığın girmesi (yürürken geçmek dahil);
 * - her tur (round) sonunda `perceptionFt` içindeki gizlenmemiş her karakter için ejderhanın
 *   Algı zarı: d20 + Perception ≥ `perceptionDc`.
 * GM her an uyandırabilir (`wake_dragon`). Yapay zekâ düşmanları `dragonWake` kipine uyar (ai.ts);
 * `chance` kipinde tur başında `rouse_dragon` ile uyandırma eğilimi zarı atılır.
 */
import { spells } from '../data';
import { rollD20, rollDie, rollTag, type Rng } from '../rules/dice';
import { distance, sameHex, type Offset } from '../rules/hex';
import { skillBonus } from '../rules/skills';
import { fail, finish, isTargetable, type CommandResult } from './common';
import { ruleOf } from './maprules';
import type { BattleEvent, BattleState, Combatant, Command, CommandContext } from './types';

interface WakeRule {
  onDamage: boolean;
  adjacent: boolean;
  loudFt: number;
  loud: { damageTypes: string[]; names: string[]; words: string[] };
  perceptionFt: number;
  perceptionDc: number;
}

const DEFAULT_WAKE: WakeRule = {
  onDamage: true, adjacent: true, loudFt: 25,
  loud: { damageTypes: ['thunder'], names: [], words: [] }, perceptionFt: 25, perceptionDc: 12,
};

/** Kuralın uyanma değerleri (JSON'dan, eksikler varsayılanla). */
export function wakeRule(state: BattleState): WakeRule {
  const w = (ruleOf(state, 'sleepingDragon')?.wake ?? {}) as Partial<WakeRule>;
  return { ...DEFAULT_WAKE, ...w, loud: { ...DEFAULT_WAKE.loud, ...(w.loud ?? {}) } };
}

/** Uyuyan ejderha (yoksa ya da uyanıksa undefined). */
export function sleepingDragon(state: BattleState): Combatant | undefined {
  const id = state.map?.dragon?.id;
  const c = id ? state.combatants[id] : undefined;
  return c?.asleep && c.pos && isTargetable(c) ? c : undefined;
}

/** Komut ya da saldırı adı gürültülü mü (gök gürültüsü, kükreme...). */
export function isLoud(state: BattleState, name: string, damageType?: string): boolean {
  const w = wakeRule(state).loud;
  const n = name.toLowerCase();
  return (damageType !== undefined && w.damageTypes.includes(damageType))
    || w.names.some((x) => x.toLowerCase() === n) || w.words.some((x) => n.includes(x.toLowerCase()));
}

/** Komutun gürültüsü: kaynak altıgen(ler)i; gürültüsüzse boş. */
function loudSources(state: BattleState, cmd: Command): Offset[] {
  if (!('actorId' in cmd)) return [];
  const actor = state.combatants[cmd.actorId];
  if (!actor?.pos) return [];
  if (cmd.type === 'cast_spell') {
    const sp = spells.find((s) => s.name === cmd.spellName);
    if (!sp || !isLoud(state, sp.name, sp.mechanics.damageType)) return [];
    const target = cmd.targetId ? state.combatants[cmd.targetId]?.pos : undefined;
    return [actor.pos, ...(cmd.targetHex ? [cmd.targetHex] : []), ...(target ? [target] : [])];
  }
  if (cmd.type === 'monster_attack' || cmd.type === 'multiattack') {
    const atks = cmd.type === 'monster_attack' ? [actor.attacks[cmd.attackIndex]] : actor.attacks.filter((a) => (a.repeat ?? 1) > 0 && !a.recharge);
    return atks.some((a) => a && isLoud(state, a.name, a.damageType)) ? [actor.pos] : [];
  }
  return [];
}

/**
 * Komuttan sonra ejderha uyandı mı: hasar, bitişik altıgene giriş, gürültü. Komutun olayları
 * uygulandıktan sonraki durumla karşılaştırılır; uyandıysa `dragon_woke` olayı.
 */
export function dragonWakeAfter(before: BattleState, after: BattleState, events: BattleEvent[], cmd: Command): BattleEvent | null {
  if (before.status !== 'active') return null;
  const d = sleepingDragon(before);
  const now = d ? after.combatants[d.id] : undefined;
  if (!d || !now?.asleep || !d.pos) return null;
  const w = wakeRule(before);
  if (w.onDamage && now.hp < d.hp) return { type: 'dragon_woke', actorId: d.id, reason: 'hasar aldı' };
  const at = d.pos;
  if (w.adjacent) {
    const near = (h: Offset) => distance(h, at) === 1;
    for (const e of events) {
      if (e.type === 'moved' && e.path.some(near)) return { type: 'dragon_woke', actorId: d.id, reason: 'yanına biri girdi', byId: e.actorId };
      if (e.type === 'jumped' && near(e.to)) return { type: 'dragon_woke', actorId: d.id, reason: 'yanına biri atladı', byId: e.actorId };
    }
    for (const c of Object.values(after.combatants)) {
      const was = before.combatants[c.id]?.pos;
      if (c.id === d.id || !c.pos || !isTargetable(c) || !near(c.pos)) continue;
      if (!was || !sameHex(was, c.pos)) return { type: 'dragon_woke', actorId: d.id, reason: 'yanına biri girdi', byId: c.id };
    }
  }
  const loud = loudSources(before, cmd);
  if (loud.some((h) => distance(h, at) * 5 <= w.loudFt)) {
    return { type: 'dragon_woke', actorId: d.id, reason: 'gürültü', byId: 'actorId' in cmd ? cmd.actorId : undefined };
  }
  return null;
}

/** Tur (round) sonu: menzildeki gizlenmemiş her karakter için ejderhanın Algı zarı; ilk başarıda uyanır. */
export function dragonRoundEvents(state: BattleState, rng: Rng): BattleEvent[] {
  const d = sleepingDragon(state);
  if (!d?.pos) return [];
  const w = wakeRule(state);
  const at = d.pos;
  const events: BattleEvent[] = [];
  const watchers = Object.values(state.combatants)
    .filter((c) => c.side === 'party' && !c.civilian && c.hp > 0 && !c.hidden && c.pos && distance(c.pos, at) * 5 <= w.perceptionFt);
  const bonus = skillBonus(d, 'perception');
  for (const c of watchers) {
    const r = rollD20('normal', rollTag(rng, { kind: 'check', by: d.id, bonus }));
    const total = r.kept + bonus;
    const success = total >= w.perceptionDc;
    events.push({ type: 'dragon_perception', actorId: d.id, watcherId: c.id, d20: r.rolls, total, dc: w.perceptionDc, success });
    if (success) {
      events.push({ type: 'dragon_woke', actorId: d.id, reason: `Algı ile ${c.name}'i fark etti`, byId: c.id });
      break;
    }
  }
  return events;
}

/** GM: ejderhayı her kipte, her an uyandırır. */
export function executeWakeDragon(state: BattleState, ctx: CommandContext): CommandResult {
  if (!ctx.isGm) return fail('Ejderhayı yalnızca GM uyandırabilir.');
  if (state.status !== 'active') return fail('Savaş başlamadı.');
  const d = sleepingDragon(state);
  if (!d) return fail('Uyuyan ejderha yok.');
  return finish(state, [{ type: 'dragon_woke', actorId: d.id, reason: 'GM', byId: 'gm' }]);
}

/** Sıradaki turun anahtarı (eğilim zarı turda bir kez). */
export const turnKey = (state: BattleState) => `${state.round}:${state.turnIndex}`;

/**
 * `dragonWake: chance`: yapay zekâ düşmanının tur başı eğilim zarı (d100 < yüzde). Tutarsa ve
 * ejderhaya gürültü menzilindeyse bağırır (uyanır); değilse bu tur ejderhanın yanına gider (ai.ts).
 */
export function executeRouse(state: BattleState, actor: Combatant, rng: Rng): CommandResult {
  const conf = state.map?.dragon;
  const d = sleepingDragon(state);
  if (!conf || conf.mode !== 'chance' || !d) return fail('Uyandırma eğilimi yalnızca "şansa bağlı" kipte, ejderha uyurken.');
  if (actor.side !== 'enemies' || actor.id === d.id) return fail('Yalnızca düşmanlar ejderhayı uyandırmaya yeltenir.');
  const key = turnKey(state);
  if (actor.rouseTurn === key) return fail('Bu tur zaten atıldı.');
  // Yüzdelik zar: d100 − 1 (0–99); eskiden floor(rng()·100), aynı dağılım ve aynı dizi.
  const roll = rollDie(100, rollTag(rng, { kind: 'percent', by: actor.id })) - 1;
  const success = roll < conf.chancePct;
  const events: BattleEvent[] = [{ type: 'rouse_roll', actorId: actor.id, roll, pct: conf.chancePct, success, turn: key }];
  if (success && actor.pos && d.pos && distance(actor.pos, d.pos) * 5 <= wakeRule(state).loudFt) {
    events.push({ type: 'dragon_woke', actorId: d.id, reason: 'gürültü', byId: actor.id });
  }
  return finish(state, events);
}

/** Olaylar ejderhayı uyandırıyor mu (yapay zekânın komut elemesi için). */
export const wakesDragon = (events: BattleEvent[]) => events.some((e) => e.type === 'dragon_woke');
