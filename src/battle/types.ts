import type { Ability } from '../rules/abilities';
import type { Height } from '../rules/conditions';
import type { DamageNote } from '../rules/damage';
import type { RollMode } from '../rules/dice';
import type { Offset } from '../rules/hex';
import type { Skill } from '../rules/skills';
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

/** Bonus eylemle yapılabilen eylemler (Rogue Cunning Action, Goblin Nimble Escape). */
export type BonusOption = 'dash' | 'disengage' | 'hide';

/**
 * Tur içi eylem ekonomisi (SRD 5.2.1): bir eylem, bir bonus eylem, bir tepki ve hareket.
 * Eylem, bonus eylem, kalan saldırılar, koşma ve ayrılma savaşçının kendi turunun başında;
 * tepki de kendi turunun başında yenilenir.
 */
export interface Economy {
  action: boolean;
  bonus: boolean;
  reaction: boolean;
  /** Attack eylemiyle kalan saldırı sayısı (Extra Attack). */
  attacksLeft: number;
  /** Bu turda kaç kez koştu (Dash): her biri hızı bir kez daha ekler. */
  dashes: number;
  /** Bu tur ayrılma (Disengage) yaptı: fırsat saldırısı tetiklemez (fırsat saldırısı henüz yok). */
  disengaged: boolean;
  /** Son kez slotlu büyü yaptığı tur ("tur:sıra"); turda yalnızca bir slot harcanır. */
  slotTurn: string | null;
}

export const FRESH_ECONOMY: Economy = {
  action: false, bonus: false, reaction: false, attacksLeft: 0, dashes: 0, disengaged: false, slotTurn: null,
};

/** Harita kurallarının savaşçı üstündeki sayaçları. */
export interface MapStatus {
  /** Batma sayacı (batak, derin su, hendek); eşiğe ulaşınca boğulur. */
  sink: number;
  /** Bataktan çıktıktan sonra süren zehir (tur başı hasar, tur sonu CON save ile biter). */
  lingeringPoison: boolean;
}

export const FRESH_MAP_STATUS: MapStatus = { sink: 0, lingeringPoison: false };

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
  /** Yakın dövüş erişimi (ft). */
  reachFt?: number;
  /** Normal ve uzun menzil (ft). */
  range?: [number, number];
  /** Orijinal hasar metni. */
  text: string;
}

/** Avatar: görsel yolu (`public/` altında) ve görsel yoksa yer tutucunun rengi ve yazısı. */
export interface Avatar {
  src: string;
  bg: string;
  label: string;
}

/** Savaştaki bir yaratık (karakter veya düşman). */
export interface Combatant {
  id: string;
  name: string;
  avatar: Avatar;
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
  /** Haritadaki altıgeni (0 tabanlı); haritasız savaşta veya yerleşmeden önce null. */
  pos: Offset | null;
  /** Bu turda harcanan hareket (altıgen). Turu gelince sıfırlanır. */
  movementUsed: number;
  /** Uçuş hızı (ft), yoksa 0. Uçan yaratık lav ve zorlu zeminden etkilenmez. */
  fly: number;
  /** STR skoru (uzun atlama menzili için). */
  strScore: number;
  /** Gizlenmişse bulunma DC'si (Stealth toplamı); değilse null. */
  hidden: { dc: number } | null;
  /** Zırhı Stealth zarında dezavantaj veriyor. */
  stealthDisadvantage: boolean;
  /** Ağır zırh giyiyor (çöl sıcağı, derin suda batma). */
  heavyArmor: boolean;
  /** Harita kurallarının savaşçıya bıraktığı izler (Adım 8). */
  mapStatus: MapStatus;
  /** Harcanan eylemler (true: bu tur kullanıldı). */
  economy: Economy;
  /** Attack eylemindeki saldırı sayısı (Extra Attack ile 2 veya daha çok). */
  attacksPerAction: number;
  /** Bonus eylemle yapabildikleri. */
  bonusActions: BonusOption[];
  /**
   * Bu turdaki son yürüyüşün sonundaki düz koşu: yön (hex.ts AXIAL_DIRECTIONS indeksi) ve
   * art arda o yönde atılan adım sayısı. Tur başında ve atlamadan sonra null.
   */
  run: { dir: number; hexes: number } | null;
  conditions: string[];
  /** Ability modifier'ları. */
  modifiers: Scores;
  /** Save bonusları. */
  saves: Scores;
  /** Yetkin olunan becerilerin bonusları; olmayanınki ability modifier'ı (`skillBonus`). */
  skills: Partial<Record<Skill, number>>;
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
  /** Karakterin silah saldırı seçenekleri (canavarlarda boş; onların `attacks` listesi var). */
  weaponOptions: AttackOption[];
}

/** Haritalı savaşta haritanın durumu. Altıgenler durumda tutulur (lav yükselince değişir). */
export interface MapState {
  id: string;
  variantId: string;
  mirrored: boolean;
  /** Satır satır zemin harfleri (lav yükselmesi gibi kurallarla değişebilir). */
  tiles: string[];
  /** Açılmış isteğe bağlı kurallar (karanlık, masumları koru); GM tetiklemeli olanlar komutla. */
  options?: string[];
  /** Bir sonraki tur başında lava dönecek altıgenler (lav yükselmesi uyarısı). */
  lavaWarning?: { hexes: Offset[]; round: number };
  /** Bulunmuş veya tetiklenmiş tuzaklar ("sütun,satır" anahtarları). */
  trapsFound?: string[];
  trapsSprung?: string[];
  /** Kapı durumları ("sütun,satır" → açık/kapalı/kırık ve HP). */
  gates?: Record<string, { state: 'open' | 'closed' | 'broken'; hp: number }>;
}

export interface BattleState {
  id: string;
  environmentId: string;
  /** Haritalı savaş `setup` (yerleştirme) aşamasıyla başlar; GM `start_battle` ile başlatır. */
  status: 'setup' | 'active' | 'finished';
  /** Haritasız savaşta yok. */
  map?: MapState;
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
  /** Yakın dövüş erişimi (ft); verilmezse 5. */
  reachFt?: number;
  /** Menzilli saldırının normal ve uzun menzili (ft). */
  range?: [number, number];
  /** Ortam kurallarında anahtar kelime aramak için küçük harfli tarif. */
  tag: string;
}

/** Oyuncunun veya GM'in göndermek istediği istekler. */
export type Command =
  | { type: 'attack'; actorId: string; targetId: string; option: AttackOption }
  /** Yalnızca haritasız savaş: soyut yükseklik değiştirme (çıkarken tırmanma kontrolü). */
  | { type: 'change_height'; actorId: string; toHeight: Height }
  /** Haritalı savaş: hedef altıgene en ucuz yoldan yürür. */
  | { type: 'move'; actorId: string; to: Offset }
  /** Haritalı savaş: düz bir doğrultuda kanalın üstünden atlar (5e uzun atlama). */
  | { type: 'jump'; actorId: string; to: Offset }
  /** Haritalı savaş: gizlenme yerinde Dexterity (Stealth) ile gizlenir (DC 15). */
  | { type: 'hide'; actorId: string; bonus?: boolean }
  /** Koşma (Dash): bu tur hızı kadar ek hareket. */
  | { type: 'dash'; actorId: string; bonus?: boolean }
  /** Ayrılma (Disengage): bu tur fırsat saldırısı tetiklemez. */
  | { type: 'disengage'; actorId: string; bonus?: boolean }
  /** Haritalı savaş: Wisdom (Perception) ile gizlenmiş düşmanları arar. */
  | { type: 'search'; actorId: string }
  /** Yalnızca GM: haritanın tetiklemeli kuralı (patlama, lav yükselmesi, dalga). */
  | { type: 'map_trigger'; rule: string; at?: Offset }
  /** Yalnızca GM: kapıyı aç veya kapat. */
  | { type: 'gate'; at: Offset; open: boolean }
  /** Batağa saplanmış savaşçı kendini çıkarmaya çalışır (Athletics). */
  | { type: 'escape'; actorId: string }
  /** Bitişikteki batmış müttefiki çeker (Athletics). */
  | { type: 'pull'; actorId: string; targetId: string }
  /** Yalnızca GM: bir savaşçıdan beceri kontrolü ister (sıra beklemez). */
  | { type: 'skill_check'; actorId: string; skill: Skill; dc: number }
  /** Kurulum aşaması: savaşçıyı kendi başlangıç bölgesine yerleştirir. */
  | { type: 'place'; actorId: string; at: Offset }
  /** Yalnızca GM, kurulum aşaması: herkes yerleştiyse savaşı başlatır. */
  | { type: 'start_battle' }
  | { type: 'end_turn'; actorId: string }
  /**
   * Büyü. Haritalı savaşta alan büyüleri hedef altıgen (`targetHex`) alır; verilmezse
   * `targetId`nin altıgeni kullanılır.
   */
  | { type: 'cast_spell'; actorId: string; spellName: string; targetId?: string; targetHex?: Offset; slotLevel?: number }
  /** Yalnızca GM: bir savaşçıya durum ekler veya kaldırır. */
  | { type: 'set_condition'; targetId: string; condition: string; present: boolean }
  /** Yalnızca GM: bir savaşçının HP'sini elle ayarlar (0..maxHp). */
  | { type: 'adjust_hp'; targetId: string; hp: number }
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
      /** Hedefin siperi (AC'ye eklendi, `targetAc` siper dahil). */
      cover?: 2 | 5;
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
  | { type: 'placed'; actorId: string; at: Offset }
  | { type: 'combat_started' }
  /** Yol başlangıcı hariç girilen altıgenler; maliyet altıgen cinsinden. */
  | { type: 'moved'; actorId: string; path: Offset[]; cost: number }
  /** Uzun atlama: aradaki `gap` altıgen atlandı, `cost` hareketten düştü. */
  | { type: 'jumped'; actorId: string; from: Offset; to: Offset; gap: number; cost: number; running: boolean }
  | {
      type: 'hide_attempted';
      actorId: string;
      mode: RollMode;
      d20: number[];
      natural: number;
      /** Zemin bonusu dahil toplam; başarılıysa bulunma DC'si olur. */
      total: number;
      bonus: number;
      dc: number;
      success: boolean;
    }
  /** Gizlenmiş yaratık ortaya çıktı (saldırdı, yürüdü, büyü yaptı veya bulundu). */
  | { type: 'revealed'; actorId: string; reason: string }
  | { type: 'searched'; actorId: string; natural: number; total: number; found: string[] }
  /**
   * Eylem harcandı: `kind` neyin harcandığı (`attack`: Extra Attack ile kalan saldırılardan biri).
   * `attacksLeft` Attack eyleminde kalan saldırılar; `slotTurn` slotlu büyü yapılan tur.
   */
  | {
      type: 'action_used'; actorId: string; kind: 'action' | 'bonus' | 'reaction' | 'attack'; what: string;
      attacksLeft?: number; slotTurn?: string;
    }
  | { type: 'dashed'; actorId: string }
  /**
   * Harita kuralının bir savaşçıya etkisi: isteğe bağlı save veya beceri kontrolü, hasar,
   * durum ekleme/kaldırma, sayaç değişimi, yer değiştirme (bataktan çıkış).
   */
  | {
      type: 'map_effect'; rule: string; targetId: string; text: string;
      roll?: { label: string; dc: number; d20: number[]; natural: number; total: number; success: boolean; mode: RollMode };
      damage?: { rolls: number[]; raw: number; applied: number; type: string; note: DamageNote };
      hpAfter?: number;
      effects?: DamageEffect[];
      addCondition?: string;
      removeCondition?: string;
      mapStatus?: Partial<MapStatus>;
      moveTo?: Offset;
      /** Bu tur hareket biter (buzda kayma). */
      stopMovement?: boolean;
    }
  /** Harita altıgeni değişti (lav yükselmesi). */
  | { type: 'tile_changed'; at: Offset; to: string }
  /** Lav yükselmesi uyarısı: bu altıgenler bir sonraki tur başında lav olur. */
  | { type: 'lava_warning'; hexes: Offset[]; round: number }
  | { type: 'map_note'; text: string; trapFound?: Offset; trapSprung?: Offset; gate?: { at: Offset; state: 'open' | 'closed' | 'broken'; hp: number } }
  | { type: 'disengaged'; actorId: string }
  /** Beceri kontrolü; `reason` kontrolü doğuran kural (ör. "bataklık"). */
  | {
      type: 'skill_checked'; actorId: string; skill: Skill; mode: RollMode; d20: number[]; natural: number;
      total: number; dc: number; success: boolean; reason?: string;
    }
  /** Zorla hareket veya lav yükselmesi: HP 0, ölüm kurtarması yok. */
  | { type: 'fell_into_lava'; actorId: string; at: Offset }
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
      /** DEX save'ine eklenen siper bonusu. */
      cover?: 2 | 5;
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
  | { type: 'hp_adjusted'; targetId: string; hpAfter: number; life: Combatant['life'] }
  | { type: 'battle_finished'; winner: Side };

export interface CommandContext {
  /** İsteği gönderen oyuncunun kimliği (GM için de kendi kimliği). */
  playerId: string | null;
  isGm: boolean;
}
