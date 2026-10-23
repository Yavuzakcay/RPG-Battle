/**
 * Eller (Görev P1, SRD 5.2.1 silah özellikleri): kalkan bir eli, yan eldeki Light silah diğer eli tutar.
 * - Yan el silahı (`sheet.offHand`): Light olmalı, kalkan olmamalı, iki elli (Two-Handed) yakın dövüş silahı taşınmamalı
 *   ve ana elde kullanılacak farklı bir Light silah bulunmalı (Light özelliğinin ek saldırısı "farklı bir Light silahla").
 *   İki elli menzilli silah (yay, arbalet) engel değil: SRD'de silah saldırıyla birlikte çekilip kaldırılabilir
 *   (Equipping and Unequipping Weapons); yay atışından sonra yakın dövüşe çift silahla geçilir.
 * - Versatile: diğer el boşsa (kalkan ve yan el silahı yok) iki elle tutulur, parantezdeki hasar zarı kullanılır.
 * Saf fonksiyonlar.
 */
import { weapons, type Weapon } from '../data';
import type { CharacterSheet } from './stats';

type HandsSheet = Pick<CharacterSheet, 'weapons' | 'shield' | 'offHand'>;

const carried = (s: HandsSheet): Weapon[] =>
  (s.weapons ?? []).map((w) => weapons.find((x) => x.name === w.name)).filter((w): w is Weapon => !!w);

/** Bu silah yan ele alınabilir mi: sorun yoksa null, varsa nedeni. */
export function offHandOptionProblem(s: HandsSheet, weaponName: string): string | null {
  const w = weapons.find((x) => x.name === weaponName);
  if (!w || !(s.weapons ?? []).some((x) => x.name === weaponName)) return 'Yan el silahı taşınan silahlardan olmalı.';
  if (!w.light) return `${w.name} Light değil: yan elde yalnızca Light silah tutulur.`;
  if (s.shield) return 'Kalkan varken yan elde silah tutulamaz.';
  const two = carried(s).find((x) => x.twoHanded && !x.ranged);
  if (two) return `İki elli yakın dövüş silahı taşınıyor (${two.name}): yan el silahı seçilemez.`;
  if (!carried(s).some((x) => x.light && x.name !== w.name)) return 'Ana elde farklı bir Light silah gerekir.';
  return null;
}

/** Karakterin yan el seçimi geçerli mi (seçim yoksa null). */
export const offHandProblem = (s: HandsSheet): string | null => (s.offHand ? offHandOptionProblem(s, s.offHand) : null);

/** Diğer el boş mu (kalkan ve geçerli yan el silahı yok): Versatile iki elle tutulur. */
export const otherHandFree = (s: HandsSheet): boolean => !s.shield && !(s.offHand && offHandProblem(s) === null);
