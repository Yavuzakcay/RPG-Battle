/**
 * Görev A1: ortak can havuzu. Birden çok savaşçı tek bir HP havuzunu paylaşır (çağrılmış sürü, bağlı yaratıklar,
 * alt sınıf özelliklerinin gereği). Durum yalnızca olaylarla değişir:
 * - `hp_pool_created`: havuz kurulur, üyelerin `hp`/`maxHp`'si havuzunki olur.
 * - Herhangi bir olay bir üyenin HP'sini değiştirirse (hasar, iyileştirme, geçici HP sonrası kalan) fark havuza
 *   yansır (`trackPools`, reducer'da her olaydan sonra); havuz 0–azami arasında kalır, 0 olunca bütün üyeler düşer.
 * - `hp_pool_synced`: komutun sonunda üyelerin HP'si havuzunkine eşitlenir (`poolSyncEvents`). Komut içinde üyeler
 *   eşitlenmez: aynı komutta birden çok üyeye gelen hasar (alan büyüsü), komutun başındaki HP'den hesaplandığı için
 *   ayrı ayrı düşülür.
 * Üyenin kendi HP'si yok; jeton ve kart üyenin `hp`'sini (= havuz) gösterir. Saf modül.
 */
import type { BattleEvent, BattleState, Combatant, HpPool } from './types';

const members = (state: BattleState, poolId: string) => Object.values(state.combatants).filter((c) => c.poolId === poolId);

/** Olayın ardından havuzlara HP farkını yansıtır (reducer çağırır). */
export function trackPools(before: BattleState, after: BattleState, event: BattleEvent): BattleState {
  if (!after.hpPools || event.type === 'hp_pool_created' || event.type === 'hp_pool_synced') return after;
  let next = after;
  for (const pool of Object.values(after.hpPools)) {
    let delta = 0;
    for (const c of members(after, pool.id)) delta += c.hp - (before.combatants[c.id]?.hp ?? c.hp);
    if (!delta) continue;
    const hp = Math.max(0, Math.min(pool.max, pool.hp + delta));
    next = { ...next, hpPools: { ...next.hpPools, [pool.id]: { ...pool, hp } } };
    if (hp > 0) continue;
    // Havuz bitti: bütün üyeler düşer.
    const combatants = { ...next.combatants };
    for (const c of members(next, pool.id)) {
      if (c.life === 'dead' && c.hp === 0) continue;
      combatants[c.id] = { ...c, hp: 0, life: 'dead', concentration: null } as Combatant;
    }
    next = { ...next, combatants };
  }
  return next;
}

/** Reducer: `hp_pool_created` ve `hp_pool_synced`. */
export function applyPoolEvent(state: BattleState, event: Extract<BattleEvent, { type: 'hp_pool_created' | 'hp_pool_synced' }>): BattleState {
  const combatants = { ...state.combatants };
  if (event.type === 'hp_pool_created') {
    const pool: HpPool = { id: event.poolId, hp: event.hp, max: event.max, ...(event.label ? { label: event.label } : {}) };
    for (const id of event.memberIds) {
      const c = combatants[id];
      if (c) combatants[id] = { ...c, poolId: pool.id, hp: pool.hp, maxHp: pool.max };
    }
    return { ...state, combatants, hpPools: { ...state.hpPools, [pool.id]: pool } };
  }
  const pool = state.hpPools?.[event.poolId];
  if (!pool) return state;
  for (const c of members(state, pool.id)) {
    if (c.life === 'dead' || c.summon?.gone) continue;
    combatants[c.id] = { ...c, hp: event.hp };
  }
  return { ...state, combatants, hpPools: { ...state.hpPools, [pool.id]: { ...pool, hp: event.hp } } };
}

/** Komutun sonunda eşitlenmesi gereken havuzlar (üyelerden birinin HP'si havuzunkinden farklı). */
export function poolSyncEvents(state: BattleState): BattleEvent[] {
  const out: BattleEvent[] = [];
  for (const pool of Object.values(state.hpPools ?? {})) {
    const live = members(state, pool.id).filter((c) => c.life !== 'dead' && !c.summon?.gone);
    if (live.some((c) => c.hp !== pool.hp)) out.push({ type: 'hp_pool_synced', poolId: pool.id, hp: pool.hp });
  }
  return out;
}

/** Game Master komutu: üyeleri tek havuzda birleştirir. */
export function poolCreateEvents(state: BattleState, cmd: { memberIds: string[]; poolId?: string; hp?: number; max?: number; label?: string }): { ok: true; events: BattleEvent[] } | { ok: false; error: string } {
  const ids = [...new Set(cmd.memberIds)];
  if (ids.length < 2) return { ok: false, error: 'Can havuzu en az iki yaratıkla kurulur.' };
  const cs = ids.map((id) => state.combatants[id]);
  if (cs.some((c) => !c)) return { ok: false, error: 'Savaşçı bulunamadı.' };
  const list = cs as Combatant[];
  if (list.some((c) => c.poolId)) return { ok: false, error: 'Yaratık zaten bir can havuzunda.' };
  if (list.some((c) => c.life === 'dead' || c.summon?.gone)) return { ok: false, error: 'Ölü ya da kaybolmuş yaratık havuza katılamaz.' };
  const max = Math.round(cmd.max ?? list.reduce((s, c) => s + c.maxHp, 0));
  const hp = Math.round(cmd.hp ?? Math.min(max, list.reduce((s, c) => s + c.hp, 0)));
  if (!(max > 0) || hp < 1 || hp > max) return { ok: false, error: 'Havuz HP 1 ile azami arasında olmalı.' };
  let n = Object.keys(state.hpPools ?? {}).length + 1;
  while (state.hpPools?.[`havuz-${n}`]) n++;
  const poolId = cmd.poolId ?? `havuz-${n}`;
  if (state.hpPools?.[poolId]) return { ok: false, error: 'Bu kimlikte bir havuz var.' };
  return { ok: true, events: [{ type: 'hp_pool_created', poolId, memberIds: ids, hp, max, ...(cmd.label ? { label: cmd.label } : {}) }] };
}
