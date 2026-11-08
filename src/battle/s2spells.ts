/**
 * Kuyruk S2 (kural sürümü 41): büyüye özgü kalan parçalar (mekaniğin `s2` bloğu).
 * - Flame Blade (`bladeRecall`): `drop_item` ile bıçak bırakılır (kaybolur, konsantrasyon sürer); "Büyüyü sürdür" bonus
 *   eylemle yeniden çağırır (boş el gerekir); bıçak yokken saldırı yok.
 * - Enlarge/Reduce (`resizeObjects`): taşınmayan nesneye; HP boyut tablosuyla ölçeklenir (SRD nesne HP'si, dayanıklı
 *   sütun; AC malzemeden, değişmez); konsantrasyon bitince geri döner.
 * - Levitate (`levitateObject`): 500 lb'ye dek taşınmayan nesne 20 ft yükselir (altından geçilir; nesne örtüsü kalkar).
 * - Phantasmal Force (`illusionAt`): yanılsama seçilen altıgende (yalnız hedefe ve büyücüye görünen alan `visibleTo`);
 *   hasar yalnız hedef yanılsamanın 5 ft içindeyken (`effects.ts`).
 * Saf.
 */
import rules from '../../data/s2-kurallar.json';
import { spells, type Spell } from '../data';
import { distance, type Offset } from '../rules/hex';
import { fail, finish, type CommandResult } from './common';
import { OBJECTS } from './objectData';
import { concentrationEvent, spendSlot } from './slots';
import { mechanicsAt } from './spellVersion';
import { registerCommandEnd } from './turnHooks';
import type { BattleEvent, BattleState, Combatant, Command, MapObject } from './types';

type CastCommand = Extract<Command, { type: 'cast_spell' }>;
const SIZES = rules.nesneBoyut;

const bladeOf = (actor: Combatant) => {
  const sp = spells.find((x) => x.name === actor.concentration?.spell);
  return sp && actor.effects?.find((e) => e.id === sp.srd && e.sourceId === actor.id) ? { sp, e: actor.effects.find((e) => e.id === sp.srd) as NonNullable<Combatant['effects']>[number] } : null;
};

/** Flame Blade bırakma (`drop_item`, eşya `flame-blade`). */
export function executeDropBlade(state: BattleState, actor: Combatant): CommandResult {
  const b = bladeOf(actor);
  if (!b || !mechanicsAt(state, b.sp).bladeRecall) return fail('Elinde alev bıçağı yok.');
  if (b.e.bladeGone) return fail('Bıçak zaten bırakıldı.');
  const { light: _l, lightDim: _d, ...rest } = b.e;
  return finish(state, [{ type: 'effect_added', targetId: actor.id, effect: { ...rest, bladeGone: true } },
    { type: 'map_note', text: `${actor.name}: ${b.sp.name} bıçağını bıraktı (kayboldu; bonus eylemle yeniden çağrılır).` }]);
}

/** Flame Blade yeniden çağırma (bıçak bırakılmışsa "Büyüyü sürdür"; bonus eylem `economy.ts`). Bıçak eldeyse null. */
export function recallBlade(state: BattleState, actor: Combatant, spell: Spell): CommandResult | null {
  const e = actor.effects?.find((x) => x.id === spell.srd && x.sourceId === actor.id);
  if (!e?.bladeGone) return null;
  if (actor.offHandOption || actor.shieldHeld) return fail(`${spell.name} için boş bir el gerekir (yan el silahı ya da kalkan var).`);
  const m = mechanicsAt(state, spell);
  const { bladeGone: _g, ...rest } = e;
  return finish(state, [{ type: 'effect_added', targetId: actor.id, effect: { ...rest, ...(m.selfLight !== undefined ? { light: m.selfLight } : {}), ...(m.selfLightDim ? { lightDim: m.selfLightDim } : {}) } },
    { type: 'spell_cast', actorId: actor.id, targetId: actor.id, label: `${spell.name} (yeniden çağrıldı)`, slotLevel: null, note: '' }]);
}

const objectAt = (state: BattleState, h: Offset | undefined): MapObject | undefined =>
  h ? (state.map?.objects ?? []).find((o) => !o.carriedBy && o.at.col === h.col && o.at.row === h.row && o.kind !== 'droppedItem') : undefined;

function targetObject(state: BattleState, actor: Combatant, cmd: CastCommand, spell: Spell): MapObject | string {
  const o = objectAt(state, cmd.targetHex);
  if (!o) return 'Bu altıgende taşınmayan bir nesne yok.';
  if (!actor.pos || distance(actor.pos, o.at) * 5 > spell.rangeFt) return `Nesne menzil dışında (${spell.rangeFt} ft).`;
  return o;
}

/** Enlarge/Reduce nesneye (Kuyruk S2). */
export function executeResizeObject(state: BattleState, actor: Combatant, cmd: CastCommand, spell: Spell): CommandResult {
  const o = targetObject(state, actor, cmd, spell);
  if (typeof o === 'string') return fail(o);
  const kind = cmd.choice === 'Reduce' ? 'Reduce' : 'Enlarge';
  const size = OBJECTS[o.kind]?.size ?? 'Medium';
  const i = SIZES.order.indexOf(size);
  const next = SIZES.order[Math.max(0, Math.min(SIZES.order.length - 1, i + (kind === 'Enlarge' ? 1 : -1)))] as keyof typeof SIZES.hp;
  const from = SIZES.hp[size as keyof typeof SIZES.hp] ?? 18;
  const hp = Math.max(1, Math.round(o.hp * (SIZES.hp[next] ?? from) / from));
  const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name, cmd.free);
  if (!slot.ok) return slot;
  return finish(state, [...slot.events, ...concentrationEvent(state, actor, spell, slot.slotLevel),
    { type: 'spell_cast', actorId: actor.id, targetId: null, label: `${spell.name} (${kind})`, slotLevel: slot.slotLevel, note: `${OBJECTS[o.kind]?.tr ?? o.kind}: ${size} → ${next}` },
    { type: 'object_changed', objectId: o.id, label: `${spell.name}: ${kind}`, resized: kind, resizedBy: actor.id, hp }]);
}

/** Levitate nesneye (Kuyruk S2). */
export function executeLevitateObject(state: BattleState, actor: Combatant, cmd: CastCommand, spell: Spell): CommandResult {
  const o = targetObject(state, actor, cmd, spell);
  if (typeof o === 'string') return fail(o);
  const size = OBJECTS[o.kind]?.size ?? 'Medium';
  const lb = SIZES.weightLb[size as keyof typeof SIZES.weightLb] ?? 150;
  if (lb > rules.irtifa.levitateObjectMaxLb) return fail(`${OBJECTS[o.kind]?.tr ?? o.kind} çok ağır (≈${lb} lb; en çok ${rules.irtifa.levitateObjectMaxLb}).`);
  const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name, cmd.free);
  if (!slot.ok) return slot;
  const ft = Math.max(5, Math.min(rules.irtifa.levitateRiseFt, cmd.altitudeFt ?? rules.irtifa.levitateRiseFt));
  return finish(state, [...slot.events, ...concentrationEvent(state, actor, spell, slot.slotLevel),
    { type: 'spell_cast', actorId: actor.id, targetId: null, label: spell.name, slotLevel: slot.slotLevel, note: `${OBJECTS[o.kind]?.tr ?? o.kind} ${ft} ft yükseldi` },
    { type: 'object_changed', objectId: o.id, label: `${spell.name}: havada`, levitatedBy: actor.id, altitudeFt: ft }]);
}

/** Phantasmal Force yanılsama alanı: büyü yapılınca, etkiyi alan hedefe (yalnız hedefe ve büyücüye görünür). */
export function illusionEvents(state: BattleState, actor: Combatant, spell: Spell, cmd: CastCommand, events: BattleEvent[]): BattleEvent[] {
  const fx = events.find((e): e is Extract<BattleEvent, { type: 'effect_added' }> => e.type === 'effect_added' && e.effect.id === spell.srd && !!e.effect.sourceTurnDamage);
  const t = fx ? state.combatants[fx.targetId] : undefined;
  const at = cmd.targetHex ?? t?.pos;
  if (!fx || !t || !at || !state.map) return [];
  const id = `illusion:${actor.id}:${t.id}`;
  return [{ type: 'zone_created', zone: { id, spellId: spell.id, name: `${spell.name} (yanılsama)`, casterId: actor.id, side: actor.side, dc: actor.spellSaveDc ?? 10,
    slotLevel: spell.level, hexes: [at], visibleTo: [t.id, actor.id], ...(spell.concentration ? { concentration: spell.name } : {}), spec: { color: '#b38cff', icon: '👁' } } },
  { type: 'effect_added', targetId: t.id, effect: { ...fx.effect, illusionZone: id } }];
}

// Komut sonu: boyut büyüsü biten nesne eski HP oranına döner.
registerCommandEnd((_before, next) => {
  const out: BattleEvent[] = [];
  for (const o of next.map?.objects ?? []) {
    if (!o.resized || !o.resizedBy) continue;
    const caster = next.combatants[o.resizedBy];
    const sp = spells.find((x) => x.id === 'enlarge-reduce');
    if (caster?.concentration?.spell === sp?.name) continue;
    const size = OBJECTS[o.kind]?.size ?? 'Medium';
    const i = SIZES.order.indexOf(size);
    const now = SIZES.order[Math.max(0, Math.min(SIZES.order.length - 1, i + (o.resized === 'Enlarge' ? 1 : -1)))] as keyof typeof SIZES.hp;
    const base = SIZES.hp[size as keyof typeof SIZES.hp] ?? 18;
    const hp = Math.max(1, Math.round(o.hp * base / (SIZES.hp[now] ?? base)));
    out.push({ type: 'object_changed', objectId: o.id, label: `${sp?.name ?? 'Enlarge/Reduce'} bitti`, resized: null, hp });
  }
  return out;
});
