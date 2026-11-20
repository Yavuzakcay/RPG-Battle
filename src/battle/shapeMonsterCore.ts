/**
 * Görev WS91 (kural sürümü 91): biçimin canavar parçasının reducer yardımcıları ve canavar aramalarının kimliği. Yaprak
 * modül (reducer ve canavar saldırı yolları içe aktarır; biçim parçasını hesaplayan `shapeMonster.ts` savaşçı kurulumuna
 * bağlıdır). Saf.
 */
import type { ActiveEffect, Combatant, ShapeMonster, ShapeMonsterPrev } from './types';

/**
 * Canavar aramalarının (yetenek verisi, ek etkiler, Multiattack planı, efsanevi eylemler, su soluma) kimliği: 91+ Wild
 * Shape/Polymorph biçimindeyse biçimin, değilse canavarın kendi kimliği.
 */
export const formMonsterId = (c: Pick<Combatant, 'monsterId' | 'shape'>): string | undefined => (c.shape?.monster ? c.shape.form : c.monsterId);

/** Biçimden önceki değerlerin anlık görüntüsü (yeni biçimin kaynak ve etki kimlikleri için de; varsa eskisi korunur). */
export function monsterPrevOf(c: Combatant, part: ShapeMonster, old?: ShapeMonsterPrev): ShapeMonsterPrev {
  const res: Record<string, number | null> = {};
  for (const k of Object.keys(part.resources)) res[k] = c.resources[k] ?? null;
  const effects = (c.effects ?? []).filter((e) => part.dropEffects.includes(e.id));
  if (old) return { ...old, resources: { ...res, ...old.resources }, effects: [...old.effects, ...effects.filter((e) => !old.effects.some((x) => x.id === e.id))] };
  return {
    resistances: c.resistances, immunities: c.immunities, vulnerabilities: c.vulnerabilities, darkvision: c.darkvision,
    packTactics: c.packTactics, bonusActions: c.bonusActions,
    ...(c.senses ? { senses: c.senses } : {}), ...(c.traits ? { traits: c.traits } : {}), ...(c.burrowFt !== undefined ? { burrowFt: c.burrowFt } : {}),
    ...(c.phase ? { phase: c.phase } : {}), ...(c.reactions ? { reactions: c.reactions } : {}), ...(c.reactionUses ? { reactionUses: c.reactionUses } : {}),
    effects, resources: res,
  };
}

/** Biçimin canavar parçasını kaldırır: asıl değerler, etkiler ve kaynaklar geri gelir. */
export function withoutMonsterPart(c: Combatant, part: ShapeMonster, prev: ShapeMonsterPrev): Combatant {
  const drop = new Set([...part.dropEffects, ...part.effects.map((e) => e.id)]);
  const resources = { ...c.resources };
  for (const k of Object.keys(part.resources)) if (!(k in prev.resources)) delete resources[k];
  for (const [k, n] of Object.entries(prev.resources)) { if (n === null) delete resources[k]; else resources[k] = n; }
  const { senses: _s, traits: _t, burrowFt: _b, phase: _p, reactions: _r, reactionUses: _u, ...rest } = c;
  const { effects: prevEffects, resources: _pr, ...fields } = prev;
  return { ...rest, ...fields, resources, effects: [...(c.effects ?? []).filter((e) => !drop.has(e.id)), ...prevEffects] };
}

/** Biçimin canavar parçasını uygular (asıl değerlerdeki savaşçıya). */
export function withMonsterPart(c: Combatant, part: ShapeMonster): Combatant {
  const drop = new Set([...part.dropEffects, ...part.effects.map((e) => e.id)]);
  const { senses: _s, burrowFt: _b, phase: _p, reactions: _r, reactionUses: _u, ...rest } = c;
  return {
    ...rest, resistances: part.resistances, immunities: part.immunities, vulnerabilities: part.vulnerabilities, darkvision: part.darkvision,
    packTactics: part.packTactics, traits: part.traits, bonusActions: part.bonusActions, resources: { ...c.resources, ...part.resources },
    effects: [...(c.effects ?? []).filter((e) => !drop.has(e.id)), ...part.effects] as ActiveEffect[],
    ...(part.senses ? { senses: part.senses } : {}), ...(part.burrowFt ? { burrowFt: part.burrowFt } : {}), ...(part.phase ? { phase: part.phase } : {}),
    ...(part.reactions ? { reactions: part.reactions } : {}), ...(part.reactionUses ? { reactionUses: part.reactionUses } : {}),
  };
}
