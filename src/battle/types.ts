import type { Height } from '../rules/conditions';
import type { DamageNote } from '../rules/damage';
import type { RollMode } from '../rules/dice';
import type { Scores } from '../rules/stats';

export type Side = 'party' | 'enemies';

/** Savaştaki bir yaratık (karakter veya düşman). */
export interface Combatant {
  id: string;
  name: string;
  side: Side;
  /** Karakteri oynayan oyuncunun kimliği. Düşmanlarda null (GM yönetir). */
  ownerId: string | null;
  ac: number;
  hp: number;
  maxHp: number;
  speed: number;
  initiativeBonus: number;
  /** Savaş başında atılan initiative toplamı. */
  initiative: number;
  height: Height;
  conditions: string[];
  /** Ability modifier'ları. */
  modifiers: Scores;
  /** Save bonusları. */
  saves: Scores;
  /** Tırmanma kontrolü bonusu (STR veya DEX modifier'ının yükseği). */
  climbMod: number;
  spellSlots: number[];
  resistances: string[];
  immunities: string[];
  vulnerabilities: string[];
  packTactics: boolean;
}

export interface BattleState {
  id: string;
  environmentId: string;
  status: 'active' | 'finished';
  round: number;
  /** Initiative sırasına göre yaratık kimlikleri. */
  order: string[];
  turnIndex: number;
  combatants: Record<string, Combatant>;
  winner?: Side;
}

/** Bir saldırı seçeneği (silah saldırısı veya büyü saldırısı). */
export interface AttackOption {
  label: string;
  attackBonus: number;
  /** Hasar zarı, örneğin "2d10" veya "1d8+3". */
  damage: string;
  damageType?: string;
  ranged: boolean;
  spell: boolean;
  /** Ortam kurallarında anahtar kelime aramak için küçük harfli tarif. */
  tag: string;
}

/** Oyuncunun veya GM'in göndermek istediği istekler. */
export type Command =
  | { type: 'attack'; actorId: string; targetId: string; option: AttackOption }
  | { type: 'move'; actorId: string; toHeight: Height }
  | { type: 'end_turn'; actorId: string };

/** Olaylar: olmuş ve sonuçlanmış gerçekler. Durum yalnızca olaylardan türetilir. */
export type BattleEvent =
  | { type: 'battle_started'; state: BattleState }
  | {
      type: 'attack_resolved';
      actorId: string;
      targetId: string;
      label: string;
      mode: RollMode;
      reasons: string[];
      d20: number[];
      natural: number;
      total: number;
      targetAc: number;
      hit: boolean;
      critical: boolean;
      fumble: boolean;
      damageRolls: number[];
      rawDamage: number;
      appliedDamage: number;
      damageType: string;
      damageNote: DamageNote;
      targetHpAfter: number;
    }
  | {
      type: 'height_changed';
      actorId: string;
      from: Height;
      to: Height;
      moved: boolean;
      check: { natural: number; total: number; dc: number } | null;
    }
  | { type: 'turn_ended'; actorId: string; nextActorId: string; round: number }
  | { type: 'battle_finished'; winner: Side };

export interface CommandContext {
  /** İsteği gönderen oyuncunun kimliği (GM için de kendi kimliği). */
  playerId: string | null;
  isGm: boolean;
}
