/** Stunning Strike'ın koşulu (Görev P-Monk); ekonomi ve komut ortak kullanır. Saf. */
import { resourceLeft, type Combatant } from './types';

/** Stunning Strike yapılabilir mi: sorun yoksa null. */
export function stunningProblem(actor: Combatant, targetId: string | undefined): string | null {
  const s = actor.stunning;
  if (!s) return 'Stunning Strike yok.';
  if (actor.economy.stunUsed) return 'Stunning Strike bu tur denendi (turda bir kez).';
  if (resourceLeft(actor, s.resource) < 1) return 'Focus Point kalmadı.';
  const hit = actor.economy.meleeHit;
  if (!hit?.martialArts) return 'Önce bu tur Monk silahı ya da Unarmed Strike ile vurmalısın.';
  if (targetId && hit.targetId !== targetId) return 'Yalnızca bu tur vurduğun hedefe.';
  return null;
}

