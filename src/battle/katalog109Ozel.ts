/**
 * Görev KATALOG-GUC-TAM (kural sürümü 109): özel güçler (`data/katalog-gucler.json` `ozel`).
 * - Rebirth from Ashes (`rebirth`): 0 HP'ye düşen sahip bir kez Supernova patlatır (yarıçapta düşmana CON save'li hasar, dosta
 *   iyileşme), yerinde Ember Egg doğar (bağımsız savaşçı, sahibin inisiyatifiyle). Yumurtanın turu başladığında yumurta
 *   ayaktaysa sahip `hp` ile kalkar, şarjlı saldırısı (`yenile`) dolar, yumurta kaybolur; yumurta kırılırsa sahip ölü kalır.
 *   Bu güç varken Faz 2 bloğu (eski 450 geçici can yaklaşığı) işlemez.
 * - Hunter Soul Bond (`soulBond`): savaş başında aynı taraftaki ilk `sinif` karakteri Avcı olur; sahip sırada Avcı'nın hemen
 *   ardına girer (aynı inisiyatif), Avcı'nın konsantrasyon save'leri avantajlı; Avcı `radiusFt` içindeyken bir komutta aldığı
 *   hasarın `pay` kadarını sahip üstlenir (Avcı iyileşir, sahibin canı düşer).
 * - Mücevher binek bağı (`binekBag`): binek eğitimli (kontrollü binek); bineğe binen biniciye bağ etkisi (`etki`: direnç…),
 *   inince kalkar.
 * 108 ve altında hiçbiri yok. Saf; `rng` enjekte.
 */
import { distance, type Offset } from '../rules/hex';
import { getMonster } from '../data';
import { gucOf } from './katalog109Data';
import { katalog109On } from './katalog109Surum';
import { combatantFromMonster } from './create';
import { lateSummonEvents } from './monsterSetup';
import { saveEffect } from './maprules';
import { registerCommandEnd, registerTurnStart } from './turnHooks';
import type { ActiveEffect, BattleEvent, BattleState, Combatant } from './types';

interface Rebirth { radiusFt: number; dc: number; dice: string; type: string; healAllies: number; egg: string; hp: number; yenile?: string }
interface SoulBond { sinif: string; radiusFt: number; pay: number }
const rebirthOf = (s: BattleState, c: Combatant) => gucOf(s, c.monsterId)?.ozel?.rebirth as Rebirth | undefined;
const bondOf = (s: Pick<BattleState, 'kuralSurumu'>, c: Combatant) => gucOf(s, c.monsterId)?.ozel?.soulBond as SoulBond | undefined;
const near = (a: Combatant, b: Combatant, ft: number) => !!a.pos && !!b.pos && distance(a.pos, b.pos) * 5 <= ft;
const MARK = 'k109:rebirth';

/** Faz 2 bloğu bu yaratıkta yeniden doğuşla değişti mi (faz2.ts atlar). */
export const rebirthReplacesPhase = (s: BattleState, c: Combatant): boolean => !!rebirthOf(s, c);

/** Komut sonunda 0 HP'ye düşmüş, yeniden doğuşu kullanılmamış sahipler: Supernova + Ember Egg. */
export function rebirthEvents(state: BattleState, rng: import('../rules/dice').Rng): BattleEvent[] {
  if (!katalog109On(state) || !state.map) return [];
  const out: BattleEvent[] = [];
  for (const c of Object.values(state.combatants)) {
    const r = rebirthOf(state, c);
    if (!r || c.hp > 0 || !c.pos || c.traitTurns?.[MARK] || c.summon) continue;
    out.push({ type: 'trait_turn', actorId: c.id, trait: MARK, key: `r${state.round}` },
      { type: 'map_note', text: `${c.name}: Rebirth from Ashes — Supernova!` });
    for (const o of Object.values(state.combatants)) {
      if (o.id === c.id || o.hp <= 0 || !near(c, o, r.radiusFt) || o.summon?.gone) continue;
      if (o.side === c.side) {
        const amount = Math.min(o.maxHp - o.hp, r.healAllies);
        if (amount > 0) out.push({ type: 'healed', actorId: c.id, targetId: o.id, label: 'Supernova', amount, targetHpAfter: o.hp + amount });
      } else out.push(saveEffect(o, 'katalog109', 'Supernova', 'con', r.dc, rng, { hit: { dice: r.dice, type: r.type, halfOnSave: true } }));
    }
    let m;
    try { m = getMonster(r.egg); } catch { continue; }
    let id = `${c.id}-ember-egg`;
    for (let n = 2; state.combatants[id]; n++) id = `${c.id}-ember-egg-${n}`;
    const base = combatantFromMonster(m, { id, name: `${m.name} (${c.name})`, kuralSurumu: state.kuralSurumu ?? 1 });
    const egg: Combatant = { ...base, side: c.side, pos: c.pos as Offset, initiative: c.initiative, speed: 0,
      effects: [...(base.effects ?? []), { id: `k109:egg:${id}`, name: m.name, sourceId: c.id, k109: { eggOf: c.id } } as ActiveEffect] };
    out.push(...lateSummonEvents(state, { type: 'summoned', ownerId: c.id, spell: 'Rebirth from Ashes', combatant: egg, index: state.order.indexOf(c.id) + 1 }));
  }
  return out;
}

/** Yumurtanın turu başladı: ayaktaysa sahibi kalkar, yumurta kaybolur. */
export function eggHatchEvents(state: BattleState, id: string): BattleEvent[] {
  const egg = state.combatants[id];
  const ownerId = egg?.effects?.find((e) => e.k109?.eggOf)?.k109?.eggOf;
  if (!egg || !ownerId || !katalog109On(state) || egg.hp <= 0) return [];
  const o = state.combatants[ownerId];
  const r = o ? rebirthOf(state, o) : undefined;
  if (!o || !r || o.hp > 0) return [];
  const i = r.yenile ? o.attacks.findIndex((a) => a.name === r.yenile) : -1;
  return [{ type: 'map_note', text: `${egg.name} çatlıyor: ${o.name} küllerinden doğuyor.` },
    { type: 'hp_adjusted', targetId: o.id, hpAfter: Math.min(o.maxHp, r.hp), life: 'alive' },
    ...(i >= 0 && o.rechargeUsed.includes(i) ? [{ type: 'recharge_rolled', actorId: o.id, attackIndex: i, d6: 6, recharged: true } as BattleEvent] : []),
    { type: 'hp_adjusted', targetId: egg.id, hpAfter: 0, life: 'dead' }];
}

/** Savaş başı: Soul Bond (Avcı ardına sıra, aynı inisiyatif; iki tarafa süren etki). `startBattle` sıralamadan sonra çağırır. */
export function soulBondSetup(s: Pick<BattleState, 'kuralSurumu'>, sorted: Combatant[]): Combatant[] {
  if (!katalog109On(s)) return sorted;
  let list = sorted;
  for (const c of sorted) {
    const b = bondOf(s, c);
    if (!b) continue;
    const hunter = list.find((h) => h.side === c.side && !h.monsterId && h.avatar?.look?.classId === b.sinif);
    if (!hunter) continue;
    const me = { ...c, initiative: hunter.initiative, effects: [...(c.effects ?? []), { id: 'k109:soul-bond', name: 'Hunter Soul Bond', sourceId: hunter.id, k109: { soulBondOf: hunter.id } } as ActiveEffect] };
    const h2 = { ...hunter, effects: [...(hunter.effects ?? []), { id: `k109:soul-bond:${c.id}`, name: 'Hunter Soul Bond', sourceId: c.id, concAdv: true } as ActiveEffect] };
    list = list.filter((x) => x.id !== c.id).map((x) => (x.id === hunter.id ? h2 : x));
    list.splice(list.findIndex((x) => x.id === hunter.id) + 1, 0, me);
  }
  return list;
}

/** Bir komutta Avcı'nın kaybettiği canın payını bağlı yaratık üstlenir. */
export function soulShareEvents(before: BattleState, next: BattleState): BattleEvent[] {
  if (!katalog109On(next)) return [];
  const out: BattleEvent[] = [];
  for (const c of Object.values(next.combatants)) {
    const hid = c.effects?.find((e) => e.k109?.soulBondOf)?.k109?.soulBondOf;
    const b = hid ? bondOf(next, c) : undefined;
    const h0 = hid ? before.combatants[hid] : undefined;
    const h = hid ? next.combatants[hid] : undefined;
    if (!b || !h0 || !h || c.hp <= 0 || !near(c, h, b.radiusFt)) continue;
    const lost = h0.hp - h.hp;
    const share = Math.min(Math.floor(lost * b.pay), c.hp - 1);
    if (lost <= 0 || share <= 0) continue;
    out.push({ type: 'map_note', text: `${c.name}: Hunter Soul Bond (${h.name} hasarının ${share}'ini üstlendi).` },
      { type: 'hp_adjusted', targetId: c.id, hpAfter: c.hp - share, life: 'alive' },
      { type: 'healed', actorId: c.id, targetId: h.id, label: 'Hunter Soul Bond', amount: share, targetHpAfter: h.hp + share });
  }
  return out;
}

/** Binek bağı: binicide bağ etkisi (binerken eklenir, inince kalkar). */
export function mountBondEvents(next: BattleState): BattleEvent[] {
  if (!katalog109On(next)) return [];
  const out: BattleEvent[] = [];
  for (const r of Object.values(next.combatants)) {
    const mount = r.riding ? next.combatants[r.riding] : undefined;
    const bag = mount ? gucOf(next, mount.monsterId)?.ozel?.binekBag as { name: string; etki: Record<string, unknown> } | undefined : undefined;
    const want = mount && bag ? `k109:bag:${mount.id}` : undefined;
    for (const e of r.effects ?? []) if (e.id.startsWith('k109:bag:') && e.id !== want) out.push({ type: 'effect_ended', targetId: r.id, effectId: e.id, name: e.name, reason: 'expired' });
    if (want && bag && mount && !r.effects?.some((e) => e.id === want)) out.push({ type: 'effect_added', targetId: r.id, effect: { ...bag.etki, id: want, name: bag.name, sourceId: mount.id } as ActiveEffect });
  }
  return out;
}

registerCommandEnd((before, next, _e, _cmd, rng) => [...soulShareEvents(before, next), ...rebirthEvents(next, rng), ...mountBondEvents(next)]);
registerTurnStart((s, id) => eggHatchEvents(s, id));
