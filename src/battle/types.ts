import type { Ability } from '../rules/abilities';
import type { Height } from '../rules/conditions';
import type { DamageNote } from '../rules/damage';
import type { RollMode } from '../rules/dice';
import type { Scores } from '../rules/stats';

export type Side = 'party' | 'enemies';

/** Hasar uygulanırken ortaya çıkan ek sonuçlar. */
export type DamageEffect =
  | { kind: 'regen_blocked' }
  | { kind: 'regen_pending' }
  | { kind: 'undead_fortitude'; dc: number; natural: number; total: number; success: boolean }
  /** Karakter 0 HP'ye düştü: ölüm save'lerine başlar. */
  | { kind: 'dying' }
  /** Kalan hasar maksimum HP'ye eşit veya fazla: anında ölüm. */
  | { kind: 'instant_death' }
  /** 0 HP'deki karaktere hasar: başarısız ölüm save'i sayılır. */
  | { kind: 'death_save_failed'; failures: number; died: boolean };

/** Bir canavarın saldırısı (şablondan türetilmiş). */
export interface CombatantAttack {
  name: string;
  bonus: number;
  damageDice?: string;
  damageType?: string;
  save?: { ability: Ability; dc: number; halfOnSave: boolean };
  rider?: string;
  recharge?: number;
  repeat: number;
  ranged: boolean;
  /** Orijinal hasar metni. */
  text: string;
}

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
  /** Karakter seviyesi (canavarlarda 0). */
  level: number;
  /** Büyü yapma ability modifier'ı. */
  spellMod: number;
  spellSaveDc: number | null;
  spellAttack: number | null;
  /** Yapabildiği büyüler. */
  spellNames: string[];
  /** Ortam kurallarında aranan küçük harfli tarif (ırk ve sınıf). */
  casterTag: string;
  attacks: CombatantAttack[];
  multiattack: boolean;
  undeadFortitude: boolean;
  /** Tur başına yenilenen HP (Troll gibi), yoksa 0. */
  regeneration: number;
  /** Kullanılmış ve henüz yenilenmemiş (Recharge'lı) saldırıların sıra numaraları. */
  rechargeUsed: number[];
  /** Acid veya fire hasarı aldı: bir sonraki turunda yenilenemez. */
  regenBlocked: boolean;
  /** 0 HP'ye düştü ama turu başında yenilenip ayağa kalkabilir. */
  regenPending: boolean;
  /** Karakterin yaşam durumu: ayakta, ölmekte (0 HP), stabil veya ölü. */
  life: 'alive' | 'dying' | 'stable' | 'dead';
  deathSaves: { successes: number; failures: number };
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
  | { type: 'end_turn'; actorId: string }
  | { type: 'cast_spell'; actorId: string; spellName: string; targetId?: string; slotLevel?: number }
  /** Yalnızca GM: bir savaşçıya durum ekler veya kaldırır. */
  | { type: 'set_condition'; targetId: string; condition: string; present: boolean }
  | { type: 'monster_attack'; actorId: string; targetId: string; attackIndex: number }
  /** Ölmekte olan bir müttefiki stabilize etmeye çalışır (Medicine, DC 10). */
  | { type: 'stabilize'; actorId: string; targetId: string }
  | { type: 'multiattack'; actorId: string; targetId: string };

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
      effects: DamageEffect[];
      rider?: string;
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
  | { type: 'slot_spent'; actorId: string; level: number; remaining: number }
  | {
      type: 'save_resolved';
      actorId: string;
      targetId: string;
      label: string;
      ability: Ability;
      dc: number;
      mode: RollMode;
      reasons: string[];
      d20: number[];
      natural: number | null;
      total: number | null;
      success: boolean;
      damageRolls: number[];
      rawDamage: number;
      appliedDamage: number;
      damageType: string;
      damageNote: DamageNote;
      targetHpAfter: number;
      conditionsAdded: string[];
      effects: DamageEffect[];
      rider?: string;
    }
  | { type: 'healed'; actorId: string; targetId: string; label: string; amount: number; targetHpAfter: number }
  | { type: 'condition_changed'; targetId: string; condition: string; present: boolean; reason: string }
  | { type: 'spell_cast'; actorId: string; targetId: string | null; label: string; slotLevel: number | null; note: string }
  | {
      type: 'death_save';
      actorId: string;
      natural: number;
      successes: number;
      failures: number;
      outcome: 'success' | 'failure' | 'stable' | 'dead' | 'revived';
    }
  | { type: 'stabilized'; actorId: string; targetId: string; natural: number; success: boolean }
  | { type: 'recharge_used'; actorId: string; attackIndex: number }
  | { type: 'recharge_rolled'; actorId: string; attackIndex: number; d6: number; recharged: boolean }
  | { type: 'regeneration'; actorId: string; amount: number; blocked: boolean; died: boolean; hpAfter: number }
  | { type: 'battle_finished'; winner: Side };

export interface CommandContext {
  /** İsteği gönderen oyuncunun kimliği (GM için de kendi kimliği). */
  playerId: string | null;
  isGm: boolean;
}
