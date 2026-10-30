/**
 * Görev A2: engelden geçme (phase). Kaynak veride: canavar özelliği (`data/gecis.json` `monsterTraits`, SRD 5.2.1
 * Incorporeal Movement) ya da süreli etki (`ActiveEffect.phase`). Geçen yaratık yaratık ve duvar/engel altıgenlerinden
 * yürür (harita dışı hariç); yürüyüş boş ve geçilebilir altıgende biter (`executeMove` hedefi denetler). Saf modül.
 */
import gecis from '../../data/gecis.json';
import type { Combatant, PhaseSpec } from './types';

const TRAITS = (gecis as { monsterTraits: Record<string, PhaseSpec> }).monsterTraits;

/** Canavarın özellik metninden doğuştan geçme yeteneği (yoksa undefined). */
export function monsterPhase(traits: string | undefined): PhaseSpec | undefined {
  if (!traits) return undefined;
  for (const [name, spec] of Object.entries(TRAITS)) if (traits.includes(name)) return { ...spec };
  return undefined;
}

/** Yaratık şu an engelden geçebiliyor mu; geçebiliyorsa geçişin kuralı (zorlu zemin mi). */
export function phaseOf(c: Pick<Combatant, 'phase' | 'effects'>): PhaseSpec | null {
  const fromEffect = c.effects?.find((e) => e.phase)?.phase;
  if (!c.phase && !fromEffect) return null;
  // İki kaynak varsa daha serbest olan (zorlu zemin saymayan) geçerli.
  const specs = [c.phase, fromEffect].filter((x): x is PhaseSpec => !!x);
  return { difficult: specs.every((x) => x.difficult) };
}
