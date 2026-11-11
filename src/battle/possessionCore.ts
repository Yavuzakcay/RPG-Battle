/**
 * Kuyruk K64a (kural sürümü 48): ele geçirmenin döngüsüz çekirdeği (yalnızca türler). `common.ts` (checkActor,
 * winnerOf), `allegiance.ts` ve yapay zekâ buradan okur; kurallar `possession.ts`.
 */
import type { Offset } from '../rules/hex';
import type { ActiveEffect, BattleState, Combatant, SpellZone } from './types';

/** Ele geçirenin `offFloor` değeri (haritadan çekilmiş: hedef alınmaz, sırada atlanır, alan ve doluluk dışı). */
export const POSSESS_FLOOR = 'beden';

/** Bedendeki ele geçirme etkisi (yoksa undefined). */
export const possessedEffect = (c: Pick<Combatant, 'effects'> | undefined): ActiveEffect | undefined => c?.effects?.find((e) => e.possessed);

/**
 * Kuyruk K64b: etkin ele geçirme (Hallow alanında bastırılmış `dormant` etki sayılmaz: beden o sırada ele geçirilmiş
 * değildir; SRD "isn't possessed ... by them while in the area").
 */
export const activePossession = (c: Pick<Combatant, 'effects'> | undefined): ActiveEffect | undefined => {
  const e = possessedEffect(c);
  return e && !e.dormant ? e : undefined;
};

/** Ele geçirilmiş beden mi (canlı; bastırılmış ele geçirme sayılmaz)? */
export const isPossessedBody = (c: Pick<Combatant, 'effects' | 'hp'>): boolean => c.hp > 0 && !!activePossession(c);

/**
 * Eylem denetiminde sayılan durumlar: ele geçirmenin verdiği Incapacitated ev sahibinin kendisi içindir; bedeni
 * ele geçiren yönetir (SRD 5.2.1 "The ghost now controls the body"). Başka bir kaynak (etki, süreli durum) da
 * Incapacitated veriyorsa ya da durum ele geçirmeden önce vardıysa (etki o zaman durum vermez) düşülmez.
 */
export function controlConditions(c: Pick<Combatant, 'conditions' | 'effects' | 'conditionTimers'>): string[] {
  const p = activePossession(c);
  if (!p?.grants?.includes('Incapacitated')) return c.conditions;
  const other = (c.effects ?? []).some((e) => e !== p && e.grants?.includes('Incapacitated'))
    || (c.conditionTimers ?? []).some((t) => t.condition === 'Incapacitated');
  return other ? c.conditions : c.conditions.filter((x) => x !== 'Incapacitated');
}

/**
 * Kuyruk K64b: bedeni yöneten ele geçiren etkisiz mi (Turn Undead: Incapacitated)? Beden o zaman eylem yapamaz: ele
 * geçiren bedeni yönetir, kendisi eylem yapamıyorsa beden de yapamaz.
 */
export function possessorDisabled(state: Pick<BattleState, 'combatants'>, c: Pick<Combatant, 'effects'>, incapacitated: (conds: string[]) => boolean): boolean {
  const p = activePossession(c);
  const g = p ? state.combatants[p.sourceId] : undefined;
  return !!g && incapacitated(g.conditions);
}

/**
 * Kuyruk K64b ("specifically target Undead" istisnası): bedendeki ele geçirenin konumu (ev sahibinin altıgeni). Yalnızca
 * Undead'i hedef alan etkiler (Turn Undead, Dispel Evil and Good Dismissal) bu konumdan ulaşır; başka hiçbir şey ulaşmaz.
 */
export function possessorAt(state: Pick<BattleState, 'combatants'>, c: Pick<Combatant, 'possessing' | 'offFloor' | 'hp'>): Offset | null {
  if (!c.possessing || c.offFloor !== POSSESS_FLOOR || c.hp <= 0) return null;
  return state.combatants[c.possessing]?.pos ?? null;
}

/** Kuyruk K64b: Magic Circle / Hallow koruma alanı (`SpellZone.ward`). */
const wardZones = (state: Pick<BattleState, 'map'>): SpellZone[] => (state.map?.zones ?? []).filter((z) => !!z.ward);
const inZone = (z: SpellZone, c: Pick<Combatant, 'pos'>): boolean => !!c.pos && z.hexes.some((h) => h.col === c.pos?.col && h.row === c.pos?.row);

/**
 * Kuyruk K64b: hedef, kaynağa karşı bir koruma alanıyla korunuyor mu (yeni ele geçirme, Charmed, Frightened)?
 * Magic Circle: silindirin içindeki hedef seçilen türlerce ele geçirilemez, Charmed/Frightened almaz; ters yönde
 * silindirin içindeki kaynağa karşı dışarıdaki hedef korunur. Hallow (Hallowed Ward): alandaki hedef.
 */
export function wardProtects(state: Pick<BattleState, 'map'>, target: Pick<Combatant, 'pos'>, source: Pick<Combatant, 'pos' | 'creatureType'> | undefined): SpellZone | undefined {
  const type = source?.creatureType;
  if (!type) return undefined;
  return wardZones(state).find((z) => z.ward?.types.includes(type) && (z.ward.reverse ? !inZone(z, target) && inZone(z, source) : inZone(z, target)));
}

/**
 * Kuyruk K62-ACIK (sürüm 67+, çağıran denetler): koruma alanı bu adımı engelliyor mu (SRD 5.2.1). Magic Circle: seçilen tür
 * silindire büyüsüz yollarla isteyerek giremez; ters yönde silindirden çıkamaz. Hallow (Hallowed Ward): seçilen tür alana
 * isteyerek giremez. Yalnız isteyerek yapılan adım (yürüme, atlama, kazma); zorla hareket ve ışınlanma ayrı.
 */
export function wardStepBlocked(state: Pick<BattleState, 'map'>, mover: Pick<Combatant, 'creatureType'>, from: Offset, to: Offset): SpellZone | undefined {
  const type = mover.creatureType;
  if (!type) return undefined;
  const has = (z: SpellZone, h: Offset) => z.hexes.some((x) => x.col === h.col && x.row === h.row);
  return wardZones(state).find((z) => z.ward?.types.includes(type) && (z.ward.kind === 'circle' && z.ward.reverse ? has(z, from) && !has(z, to) : !has(z, from) && has(z, to)));
}

/** Kuyruk K64b: Hallow alanında mı (bu türün ele geçirmesi/durumu bastırılır)? */
export function hallowAt(state: Pick<BattleState, 'map'>, target: Pick<Combatant, 'pos'>, type: string | undefined): SpellZone | undefined {
  if (!type) return undefined;
  return wardZones(state).find((z) => z.ward?.kind === 'hallow' && z.ward.types.includes(type) && inZone(z, target));
}

/** Kuyruk K64b: Magic Circle saldırı dezavantajı (seçilen türün silindirdeki hedefe; ters yönde dışarıdakine). */
export function circleAttackDis(state: Pick<BattleState, 'map'>, attacker: Pick<Combatant, 'pos' | 'creatureType'>, target: Pick<Combatant, 'pos'>): SpellZone | undefined {
  const type = attacker.creatureType;
  if (!type) return undefined;
  return wardZones(state).find((z) => z.ward?.kind === 'circle' && z.ward.types.includes(type) && (z.ward.reverse ? !inZone(z, target) && inZone(z, attacker) : inZone(z, target)));
}
