/**
 * Kuyruk K58 G4: tehlike katmanı (açılır/kapanır). Altıgen başına türler: yüzey, aura (bağlı ya da yarıçaplı alan),
 * geçici engel, alev yayılım riski (alevin komşusu yanıcı yüzey: yağ, kaygan/gres, yanan ağ), hareket menzili,
 * fırsat saldırısı bölgesi (tepkisi duran düşmanların yakın dövüş erişimi), seçili düşmanın tehdit menzili (yaklaşık:
 * hız + erişim), K74: çamur/batak zemini (harita kuralının zemin harfi). Yalnız gösterim: motor sorgusu, durum değişmez. Saf.
 */
import { distance, hexKey, neighbors, type Offset } from '../rules/hex';
import { canReact } from '../battle/reactions';
import { zoneHexes } from '../battle/zones';
import type { BattleState, Combatant } from '../battle/types';
import { gridOf } from './mapView';
import { ruleOf } from '../battle/maprules';
import k74 from '../../data/k74.json';

export type HazardKind = 'surface' | 'aura' | 'barrier' | 'fireSpread' | 'mud' | 'move' | 'oa' | 'threat';
export const HAZARD_KINDS: HazardKind[] = ['surface', 'aura', 'barrier', 'fireSpread', 'mud', 'move', 'oa', 'threat'];

const FLAMMABLE = new Set(['oil', 'slick', 'burningWeb']);

/** Yakın dövüş erişimi (altıgen): en uzun yakın dövüş saldırısının erişimi, yoksa 5 ft. */
export function meleeReachHexes(c: Combatant): number {
  const ft = Math.max(5, ...c.attacks.filter((a) => !a.ranged).map((a) => a.reachFt ?? 5), ...c.weaponOptions.filter((o) => !o.ranged).map((o) => o.reachFt ?? 5));
  return Math.max(1, Math.round(ft / 5));
}

const live = (c: Combatant) => !!c.pos && c.hp > 0 && c.life === 'alive' && !c.summon?.gone && !c.summon?.intangible;

export function hazardHexes(state: BattleState, o: { actorId?: string; movable?: Iterable<string>; threatId?: string | null }): Map<string, HazardKind[]> {
  const out = new Map<string, HazardKind[]>();
  const add = (h: Offset | string, k: HazardKind) => {
    const key = typeof h === 'string' ? h : hexKey(h);
    const arr = out.get(key) ?? [];
    if (!arr.includes(k)) arr.push(k);
    out.set(key, arr);
  };
  const zones = state.map?.zones ?? [];
  const fire: Offset[] = [];
  const flam = new Set<string>();
  for (const z of zones) {
    const hs = zoneHexes(state, z);
    const kind: HazardKind = z.barrier ? 'barrier' : z.anchorId ? 'aura' : 'surface';
    for (const h of hs) add(h, kind);
    if (z.surface === 'fire') fire.push(...hs);
    if (z.surface && FLAMMABLE.has(z.surface)) for (const h of hs) flam.add(hexKey(h));
  }
  for (const f of fire) for (const n of neighbors(f)) if (flam.has(hexKey(n))) add(n, 'fireSpread');
  // Kuyruk K74: çamur/batak zemini (açık harita kuralının zemin harfi: batıran çamur, sülük, derin batak; yalnız görünüm).
  const letters = new Set<string>();
  for (const [id, def] of Object.entries(k74.tehlikeZemin.kurallar)) {
    const r = state.map?.id ? ruleOf(state, id) : undefined;
    if (r) letters.add(typeof r.terrain === 'string' ? r.terrain : def);
  }
  if (letters.size) (state.map?.tiles ?? []).forEach((row, r) => [...row].forEach((ch, c) => { if (letters.has(ch)) add({ col: c, row: r }, 'mud'); }));
  for (const k of o.movable ?? []) add(k, 'move');
  const actor = o.actorId ? state.combatants[o.actorId] : undefined;
  if (actor) {
    for (const e of Object.values(state.combatants)) {
      if (e.side === actor.side || !live(e) || !canReact(e) || !e.pos) continue;
      const r = meleeReachHexes(e);
      ringsAround(e.pos, r).forEach((h) => add(h, 'oa'));
    }
  }
  const th = o.threatId ? state.combatants[o.threatId] : undefined;
  if (th?.pos && live(th)) ringsAround(th.pos, Math.ceil(Math.max(th.speed, th.fly ?? 0) / 5) + meleeReachHexes(th)).forEach((h) => add(h, 'threat'));
  const g = gridOf(state);
  if (g) for (const k of [...out.keys()]) { const [c, r] = k.split(',').map(Number) as [number, number]; if (c >= g.cols || r >= g.rows) out.delete(k); }
  return out;
}

/** Merkezden `r` altıgen içindekiler (merkez hariç), haritada kalanlar. */
function ringsAround(c: Offset, r: number): Offset[] {
  const out: Offset[] = [];
  for (let dc = -r * 2; dc <= r * 2; dc++) for (let dr = -r * 2; dr <= r * 2; dr++) {
    const h = { col: c.col + dc, row: c.row + dr };
    if (h.col < 0 || h.row < 0 || (dc === 0 && dr === 0)) continue;
    if (distance(c, h) <= r) out.push(h);
  }
  return out;
}
