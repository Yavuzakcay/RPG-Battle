/**
 * Görev S3: hedef sistemi (docs/harita/SEFER-TASARIMI.md §3). Hedefler `state.goals` içinde: defeat, reach, protect,
 * destroy (S2 nesnesi), survive, retrieve; `all`/`any` ile birleşir, `fail` koşulları ayrı. Durum her komutun sonunda
 * hesaplanır; anlık başarılar (ulaşma, çıkışa taşıma) ve kalıcı başarısızlıklar `goal_changed` olayıyla kilitlenir
 * (replay aynı). `state.goals` yoksa hiçbir şey değişmez: eski `objective` (masumlar) kuralı aynen çalışır.
 */
import alarmData from '../../data/alarm.json';
import { hexKey, type Offset } from '../rules/hex';
import type { BattleEvent, BattleState, Combatant, Goal, GoalFail, GoalStatus, Goals } from './types';

const fighters = (s: BattleState, side: 'party' | 'enemies') =>
  Object.values(s.combatants).filter((c) => c.side === side && !c.civilian && !c.summon);
const up = (c: Combatant) => c.hp > 0 || !!c.regenPending;
const objOf = (s: BattleState, id: string | undefined) => (id ? s.map?.objects?.find((o) => o.id === id) : undefined);
const onAny = (c: Combatant, hexes: Offset[] | undefined) => !!c.pos && !!hexes?.some((h) => hexKey(h) === hexKey(c.pos as Offset));

/** Korunanlar: kimlik listesi ya da (yoksa) bütün masumlar. */
function protectedOf(s: BattleState, g: Goal): Combatant[] {
  const all = Object.values(s.combatants);
  return g.ids?.length ? all.filter((c) => g.ids?.includes(c.id)) : all.filter((c) => c.civilian);
}

/** Hedefin anlık durumu (kilit hesaba katılmaz). */
export function liveGoalStatus(s: BattleState, g: Goal): GoalStatus {
  switch (g.kind) {
    case 'defeat': {
      const foes = fighters(s, 'enemies').filter((c) => !g.ids?.length || g.ids.includes(c.id));
      return foes.some((c) => up(c) && !(c.asleep && !c.group)) ? 'open' : 'done';
    }
    case 'reach': {
      const party = fighters(s, 'party').filter(up);
      if (!party.length) return 'open';
      return (g.who === 'all' ? party.every((c) => onAny(c, g.hexes)) : party.some((c) => onAny(c, g.hexes))) ? 'done' : 'open';
    }
    case 'protect': {
      if (g.objectId && !objOf(s, g.objectId)) return 'failed';
      if (!g.objectId && protectedOf(s, g).some((c) => !up(c))) return 'failed';
      return g.rounds && s.round > g.rounds ? 'done' : 'open';
    }
    case 'destroy':
      return objOf(s, g.objectId) ? 'open' : 'done';
    case 'survive':
      return g.rounds && s.round > g.rounds && fighters(s, 'party').some(up) ? 'done' : 'open';
    case 'retrieve': {
      const o = objOf(s, g.objectId);
      if (!o) return 'failed';
      const carrier = o.carriedBy ? s.combatants[o.carriedBy] : undefined;
      return carrier && up(carrier) && onAny(carrier, g.hexes) ? 'done' : 'open';
    }
  }
}

export function goalStatus(s: BattleState, g: Goal): GoalStatus {
  return s.goals?.status?.[g.id] ?? liveGoalStatus(s, g);
}

/** Başarısızlık koşulu gerçekleşti mi? */
export function failHit(s: BattleState, f: GoalFail): boolean {
  switch (f.kind) {
    case 'rounds': return !!f.rounds && s.round > f.rounds;
    case 'civilians': return Object.values(s.combatants).filter((c) => c.civilian && up(c)).length < (f.needed ?? 1);
    case 'object': return !objOf(s, f.objectId);
    case 'down': return Object.values(s.combatants).some((c) => f.ids?.includes(c.id) && !up(c));
    case 'alarm': return s.alarmRound !== undefined && s.round - s.alarmRound >= (f.rounds ?? alarmData.failRounds);
  }
}

/** Korunma hedefi (tur sınırsız) bütün hedefler için engel değil; ayakta kaldıkça sağlanmış sayılır. */
const satisfied = (g: Goal, st: GoalStatus) => st === 'done' || (g.kind === 'protect' && !g.rounds && st === 'open');

/** Hedeflerin sonucu: parti kazandı, düşman kazandı ya da sürüyor. */
export function goalOutcome(s: BattleState): 'party' | 'enemies' | null {
  const goals = s.goals;
  if (!goals?.list.length && !goals?.fail?.length) return null;
  if (goals.fail?.some((f) => failHit(s, f))) return 'enemies';
  const list = goals.list;
  if (!list.length) return null;
  const st = list.map((g) => goalStatus(s, g));
  if (goals.mode === 'any') {
    if (st.some((x) => x === 'done')) return 'party';
    return st.every((x) => x === 'failed') ? 'enemies' : null;
  }
  if (st.some((x) => x === 'failed')) return 'enemies';
  return list.every((g, i) => satisfied(g, st[i] as GoalStatus)) && st.some((x) => x === 'done') ? 'party' : null;
}

/**
 * Komut sonu: anlık başarıyı ve kalıcı başarısızlığı kilitler (`goal_changed`); düşen taşıyıcının nesnesini yere
 * bırakır (`object_changed`). Savunma (defeat, tur sınırsız protect) kilitlenmez; anlık hesaplanır.
 */
export function goalEvents(s: BattleState): BattleEvent[] {
  if (!s.goals) return [];
  const out: BattleEvent[] = [];
  for (const o of s.map?.objects ?? []) {
    const c = o.carriedBy ? s.combatants[o.carriedBy] : undefined;
    if (o.carriedBy && (!c || !up(c) || c.summon?.gone)) {
      out.push({ type: 'object_changed', objectId: o.id, carriedBy: null, ...(c?.pos ? { at: c.pos } : {}), label: `${c?.name ?? '?'}: nesne yere düştü` });
    }
  }
  for (const g of s.goals.list) {
    if (s.goals.status?.[g.id]) continue;
    const st = liveGoalStatus(s, g);
    const lock = (st === 'done' && g.kind !== 'defeat' && !(g.kind === 'protect' && !g.rounds)) || st === 'failed';
    if (lock) out.push({ type: 'goal_changed', goalId: g.id, status: st });
  }
  return out;
}

/** Harita verisinden hedefler (1 tabanlı altıgenler → 0 tabanlı). */
export function goalsFromData(raw: unknown): Goals | undefined {
  const r = raw as { mode?: 'all' | 'any'; list?: Array<Goal & { hexes?: Array<[number, number] | Offset> }>; fail?: GoalFail[] } | undefined;
  if (!r?.list) return undefined;
  const hex = (h: [number, number] | Offset): Offset => (Array.isArray(h) ? { col: h[0] - 1, row: h[1] - 1 } : h);
  return {
    mode: r.mode ?? 'all',
    list: r.list.map((g, i) => ({ ...g, id: g.id ?? `g${i + 1}`, ...(g.hexes ? { hexes: g.hexes.map(hex) } : {}) })),
    ...(r.fail?.length ? { fail: r.fail.map((f) => ({ ...f })) } : {}),
  };
}

/** Hedef altıgenleri (haritada hüzme): ulaşma/çıkış altıgenleri ve hedef nesnelerin yeri. */
export function goalHexes(s: BattleState): Offset[] {
  const out: Offset[] = [];
  for (const g of s.goals?.list ?? []) {
    if (goalStatus(s, g) !== 'open') continue;
    if (g.hexes && (g.kind === 'reach' || g.kind === 'retrieve')) out.push(...g.hexes);
    const o = objOf(s, g.objectId);
    if (o && !o.carriedBy && (g.kind === 'destroy' || g.kind === 'retrieve' || g.kind === 'protect')) out.push(o.at);
  }
  return out;
}
