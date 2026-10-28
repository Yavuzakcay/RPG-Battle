import type { Ability } from '../rules/abilities';
import type { Height } from '../rules/conditions';
import type { DamageNote } from '../rules/damage';
import type { RollKind, RollMode } from '../rules/dice';
import type { DiceMode } from '../rules/manualDice';

/** Olaydaki zar grubu (`dice_rolled`). */
export interface DiceRoll {
  sides: number;
  values: number[];
  kind?: RollKind;
  by?: string;
  bonus?: number;
  mode?: RollMode;
  critical?: boolean;
  /** Fiziksel zarla elle girildi. */
  manual?: boolean;
}
import type { Offset } from '../rules/hex';
import type { AttackArea } from '../rules/areaParse';
import type { Skill } from '../rules/skills';
import type { CreatureSize, FeatureEffect, MasteryId, ReactionMechanic } from '../data/types';
import type { ReactionTrigger } from '../rules/reactionChoice';
import type { RolledExtra } from '../rules/attack';
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
  | { kind: 'death_save_failed'; failures: number; died: boolean }
  /** Konsantrasyondaki yaratık hasar aldı: CON save (DC 10 veya hasarın yarısı, en çok 30). */
  | { kind: 'concentration'; spell: string; dc: number; natural: number; total: number; success: boolean; extra?: RolledExtra[] }
  /** Geçici HP hasarı karşıladı (Görev R2): emilen ve kalan. */
  | { kind: 'temp_absorbed'; amount: number; left: number }
  /** Hasar azaltma etkisi (Resistance, turda bir): zar ve düşülen. */
  | { kind: 'reduced'; label: string; effectId: string; roll: number; amount: number };

/** Bonus eylemle yapılabilen eylemler (Rogue Cunning Action, Goblin Nimble Escape). */
export type BonusOption = 'dash' | 'disengage' | 'hide';

/**
 * Tur içi eylem ekonomisi (SRD 5.2.1): bir eylem, bir bonus eylem, bir tepki ve hareket.
 * Eylem, bonus eylem, kalan saldırılar, koşma ve ayrılma savaşçının kendi turunun başında;
 * tepki de kendi turunun başında yenilenir.
 */
/**
 * Savaşçının üzerindeki süren etki (Görev R2): kaynak (büyücü), kimlik (SRD büyü kimliği), bitiş turu (dahil) ya da
 * konsantrasyon bağı (`concentration`: kaynağın bu büyüdeki konsantrasyonu bitince biter). Etkiler: zar eklentisi
 * (`dice`; `single` ilk kullanımda biter), turda bir hasar azaltma (`reduce`; `spent` her tur geçişinde sıfırlanır),
 * her tur başı geçici HP (`tempHp`), durum bağışıklığı (`immune`), her tur başı süregelen hasar ve ardından save
 * (`ongoing`; başarıda biter), sonraki turunu kaybetme (`command`: Grovel yere düşer, Halt yalnızca bekler).
 */
export interface ActiveEffect {
  id: string;
  name: string;
  sourceId: string;
  until?: number;
  concentration?: string;
  dice?: { die: string; sign: 1 | -1; on: Array<'attack' | 'save' | 'check'>; skill?: string; single?: boolean };
  reduce?: { die: string; types: string[]; spent?: boolean };
  tempHp?: number;
  immune?: string[];
  ongoing?: { dice: string; type: string; save: Ability; dc: number };
  command?: 'grovel' | 'halt';
}

/** Savaşçının tepkisi (Görev R1): kimlik (SRD), ad, mekanik; tepki büyüsünde büyünün adı. */
export type ReactionSpec = ReactionMechanic & { id: string; name: string; spell?: string };

/** Süren güçlendirme (Görev P-Paladin): `until` turuna dek (o tur dahil) geçerli. */
export interface Buff {
  /** Kaynak (büyü ya da özellik adı); aynı kaynaktan ikincisi öncekinin yerine geçer. */
  source: string;
  by: string;
  until: number;
  attackBonus?: number;
  damageBonus?: number;
  /** Silah isabetinde ek zar (Divine Favor). */
  extraDamage?: string;
  damageType?: string;
  /** Yalnızca yakın dövüş silah saldırıları (Sacred Weapon). */
  meleeOnly?: boolean;
  /** Hasar Radiant olabilir: hedef silahın türüne dirençliyse Radiant seçilir. */
  radiant?: boolean;
}

/** Savaşta kullanılabilen sınıf özelliği (kurulurken veriden kopyalanır). */
export interface UsableFeature {
  key: string;
  name: string;
  type: 'action' | 'bonus' | 'free';
  resource?: string;
  when?: 'attackAction';
  effect: FeatureEffect;
}

export interface Economy {
  action: boolean;
  bonus: boolean;
  reaction: boolean;
  /** Attack eylemiyle kalan saldırı sayısı (Extra Attack). */
  attacksLeft: number;
  /** Bu turda kaç kez koştu (Dash): her biri hızı bir kez daha ekler. */
  dashes: number;
  /** Bu tur ayrılma (Disengage) yaptı: fırsat saldırısı tetiklemez. */
  disengaged: boolean;
  /** Bu tur Action Surge kullandı (ek eylem; o eylemle büyü yapılamaz). */
  surged: boolean;
  /** Son kez slotlu büyü yaptığı tur ("tur:sıra"); turda yalnızca bir slot harcanır. */
  slotTurn: string | null;
  /** Bu tur Attack eylemiyle (yan el silahından farklı) bir Light silahla saldırdı: yan el ek saldırısı açılır (Görev P1). */
  lightAttack?: boolean;
  /** Bu tur yan el ek saldırısı yapıldı (turda bir kez). */
  offhandUsed?: boolean;
  /** Bu tur yakın dövüş silahıyla son vurduğu hedef (smite büyüleri; kritik vuruşta smite zarları iki kat). */
  meleeHit?: { targetId: string; critical: boolean; martialArts?: boolean };
  /** Flurry of Blows'tan kalan Unarmed Strike sayısı (Görev P-Monk). */
  flurryLeft?: number;
  /** Bu tur Stunning Strike denendi (turda bir kez). */
  stunUsed?: boolean;
}

export const FRESH_ECONOMY: Economy = {
  action: false, bonus: false, reaction: false, attacksLeft: 0, dashes: 0, disengaged: false, surged: false, slotTurn: null,
};

/** Harita kurallarının savaşçı üstündeki sayaçları. */
export interface MapStatus {
  /** Batma sayacı (batak, derin su, hendek); eşiğe ulaşınca boğulur. */
  sink: number;
  /** Bataktan çıktıktan sonra süren zehir (tur başı hasar, tur sonu CON save ile biter). */
  lingeringPoison: boolean;
}

export const FRESH_MAP_STATUS: MapStatus = { sink: 0, lingeringPoison: false };

/**
 * Sınıf kaynaklarının kalan kullanımları: kaynak kimliği → sayı (Görev N; tanımlar data/class-features.json
 * "resources": Action Surge, Second Wind, Favored Enemy, Rage, Focus…). Savaş içinde yenilenmez; kısa ve uzun
 * dinlenme kurala göre yeniler. Olmayan kaynak 0 sayılır. Eski kayıtlarda üç alanlı nesne (sıfırlar dahil).
 */
export type Resources = Record<string, number>;

export const NO_RESOURCES: Resources = {};

/** Kaynağın kalan kullanımı (yoksa 0). */
export const resourceLeft = (c: { resources: Resources }, id: string): number => c.resources[id] ?? 0;

/**
 * Süren konsantrasyon (SRD 5.2.1): büyü, yapıldığı slot ve tur, işaretli hedef (Hunter's Mark),
 * gücün altıgeni (Spiritual Weapon), büyünün verdiği durumlar (bitince kalkar) ve yayılımın
 * bu tur kimi etkilediği (Spirit Guardians: yaratık başına turda bir save).
 */
export interface Concentration {
  spell: string;
  slotLevel: number;
  /** Yapıldığı tur ("tur:sıra"): sonraki turlarda bonus eylemle sürdürülür. */
  turn: string;
  targetId?: string;
  pos?: Offset;
  /** Büyünün koyduğu durumlar: konsantrasyon bitince kalkar. */
  conditions?: Array<{ targetId: string; condition: string }>;
  /** Yayılımın etkilediği yaratık → tur anahtarı. */
  auraHits?: Record<string, string>;
}

/**
 * Çağrılmış yaratığın bağı (Görev R3; data/summons.json): çağıran, büyü, sıradaki yeri (kendi inisiyatifi ya da
 * sahibinin hemen ardı), büyü seviyesi ve kaybolma koşulları. Kaybolan yaratık savaşçılarda kalır (`gone`; günlük
 * adları için), sırada atlanır, haritada çizilmez.
 */
/** Dragonborn Breath Weapon (SRD 5.2.1 tür özelliği). */
export interface BreathSpec {
  srd: string;
  resource: string;
  save: Ability;
  dc: number;
  dice: string;
  damageType: string;
  shapes: Array<{ shape: 'cone' | 'line'; sizeFt: number; widthFt?: number }>;
}

export type SummonVanishReason = 'hp' | 'concentration' | 'owner' | 'replaced' | 'duration';

export interface SummonInfo {
  /** Çağıranın savaşçı kimliği. */
  by: string;
  /** Büyünün kimliği (data/spells.json `id`; data/summons.json anahtarı) ve adı (konsantrasyon karşılaştırması). */
  spellId: string;
  spell: string;
  turn: 'own' | 'after-owner';
  /** Büyü seviyesi (yukarı slotta slot seviyesi; stat bloğundaki "spell's level"). */
  level: number;
  /** Seçilen yaratık türü ya da nefes hasar türü. */
  choice?: string;
  concentration?: boolean;
  /** Bu turdan sonra kaybolur (süre). */
  until?: number;
  endsOnOwnerDeath?: boolean;
  /** Saldırı yapamaz (familiar). */
  noAttack?: boolean;
  gone?: boolean;
}

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
  /** Alanlı save saldırısı (nefes, Cone/Line…; Görev R4): metinden ya da çağırma verisinden. */
  area?: AttackArea;
}

/** Avatar: görsel yolu (`public/` altında) ve görsel yoksa yer tutucunun rengi ve yazısı. */
export interface Avatar {
  src: string;
  bg: string;
  label: string;
  /** Uyurken gösterilecek resim (varsa; yoksa `src`). Canavarlarda `monsters/<id>-uyku.webp`. */
  asleepSrc?: string;
  /** `src` yüklenemezse sırayla denenecek eski yollar; hiçbiri yoksa `label`. */
  fallbacks?: string[];
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
  /** Karanlık görüş (ft); 0 ise yok. */
  darkvision: number;
  /** Korunması gereken masum (GM yönetir; `objective` kuralı). */
  civilian: boolean;
  /** Masumun görünümü (data/masumlar.json kimliği); GM kurulumda seçer, yoksa tohumlu varsayılan. */
  gorselId?: string;
  /** Oyuncu karakterinin ırkı (jetonun görsel ölçeği için; mekanik boyut değişmez). */
  raceId?: string;
  /** Canavardan geldiyse canavar kimliği (saldırı etkileri `data/condition-effects.json` için). */
  monsterId?: string;
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
  /** Etkin durumların adları (süresizler dahil). Süreli olanların süresi `conditionTimers`'ta. */
  conditions: string[];
  /** Süreli durumlar (durum adı `conditions`'ta da bulunur; durum kalkınca sayacı da düşer). */
  conditionTimers?: ConditionTimer[];
  /**
   * Yakalandı (Grappled): yakalayan, kaçış DC'si ve kavrama sürerken Restrained mi. Süresiz; kaçış
   * eylemiyle, yakalayan düşünce/etkisiz kalınca ya da aralarındaki mesafe açılınca biter.
   */
  grapple?: { by: string; escapeDc: number; restrained: boolean };
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
  /** Süren konsantrasyon büyüsü. */
  concentration: Concentration | null;
  /** Sınıf özelliklerinin kalan kullanımları. */
  resources: Resources;
  /** Sneak Attack zarı (d6 sayısı; haydut değilse 0). */
  sneakAttackDice: number;
  /** Sneak Attack'ın son kullanıldığı tur (turda bir kez, başkasının turu dahil). */
  sneakTurn: string | null;
  /** Boyut (itme sınırı: hedef en çok bir boyut büyük). */
  size: CreatureSize;
  /** Yetkinlik bonusu (Shove DC'si: 8 + STR + yetkinlik). */
  proficiency: number;
  /**
   * Yan el (Görev P1; eski kayıtlarda yok): Light ek saldırısının seçeneği ve yan el silahında Nick varsa ek saldırı
   * Attack eyleminin içinde (bonus eylem harcamaz).
   */
  offHandOption?: AttackOption;
  nickOffhand?: boolean;
  /**
   * Barbarian (Görev P-Barbarian; eski kayıtlarda yok): Rage bilgisi (`rageDamage` hasar bonusu, `rageResist` direnç
   * türleri), etkin Rage (`rage`: bu tur uzatıldı mı, Rage'in eklediği dirençler), avantajlı save'ler (Danger Sense),
   * Reckless Attack ve Frenzy hakkı, Rage'de STR ile yapılabilen beceriler (Primal Knowledge).
   */
  rageDamage?: number;
  rageResist?: string[];
  rageStrAdvantage?: boolean;
  rage?: { refreshed: boolean; added: string[] } | null;
  saveAdvantage?: Ability[];
  canReckless?: boolean;
  frenzy?: boolean;
  /** Frenzy'nin kullanıldığı tur ("tur:sıra"; turda bir kez). */
  frenzyTurn?: string;
  primalSkills?: Skill[];
  /**
   * Görev P-Paladin (eski kayıtlarda yok): SRD yaratık türü (canavarda; Divine Smite, Protection from Evil and Good),
   * süren güçlendirmeler (Divine Favor, Magic Weapon, Sacred Weapon) ve savaşta kullanılan sınıf özellikleri
   * (`use_feature`: Lay On Hands, Sacred Weapon).
   */
  creatureType?: string;
  buffs?: Buff[];
  features?: UsableFeature[];
  /**
   * Görev P-Monk (eski kayıtlarda yok; veriden): bonus eylemle Unarmed Strike (Martial Arts), Focus ile bonus eylemler
   * (Flurry of Blows, Patient Defense, Step of the Wind), Uncanny Metabolism, Deflect Attacks, Slow Fall, Stunning
   * Strike, Open Hand Technique.
   */
  bonusStrike?: AttackOption;
  focusActions?: Array<{ id: string; name: string; resource: string; strikes?: number; actions?: Array<'disengage' | 'dodge' | 'dash'> }>;
  metabolism?: { refill: string; die: string; resource: string; max: number };
  deflect?: { dice: string; bonus: number; types: string[]; redirect?: { resource: string; dice: string; save: Ability; dc: number } };
  fallReduction?: number;
  stunning?: { resource: string; save: Ability; dc: number; condition: string };
  openHand?: Array<'addle' | 'push' | 'topple'>;
  /**
   * Görev R1 (eski kayıtlarda yok): tepkiler (sınıf özelliği, tepki büyüsü, canavar tepkisi; fırsat saldırısı
   * herkeste ayrıca), canavar tepkisi kullanım havuzları (Protective Magic 3/Day) ve Recharge bekleyenler.
   */
  reactions?: ReactionSpec[];
  reactionUses?: Record<string, number>;
  reactionSpent?: string[];
  /** Görev R4 (eski kayıtlarda yok): türün nefesi (Dragonborn Breath Weapon; koni ya da çizgi, kaynakla). */
  breath?: BreathSpec;
  /** Görev R3 (eski kayıtlarda yok): çağrılmış yaratık (Find Familiar, Find Steed, Summon Dragon). */
  summon?: SummonInfo;
  /** Görev R2 (eski kayıtlarda yok): süren etkiler (Bless, Bane, Heroism…) ve geçici HP. */
  effects?: ActiveEffect[];
  tempHp?: number;
  /** Silah ustalığı işaretleri (Sap, Slow, Vex); eski kayıtta yok. */
  marks?: MasteryMark[];
  /** Cleave'in son kullanıldığı tur (turda bir kez). */
  cleaveTurn?: string;
  /** Uyuyor (uyuyan ejderha): turunu atlar, hareket etmez, yakın dövüş saldırıları ona avantajlı. */
  asleep?: boolean;
  /** Ejderhayı uyandırma eğilimi zarının atıldığı tur ("tur:sıra") ve tuttu mu (`dragonWake: chance`). */
  rouseTurn?: string;
  rouseHit?: boolean;
}

/**
 * Silah ustalığının süreli işareti (Weapon Mastery). Sap: tutanın bir sonraki saldırısı dezavantajlı; Slow: tutanın
 * hızı `feet` azalır; Vex: tutanın `targetId`ye bir sonraki saldırısı avantajlı. `by` ustalığı uygulayan; süre onun
 * tur başı/sonu sayısıyla (`end`, `count`) düşer.
 */
export interface MasteryMark {
  /**
   * `reckless`: Reckless Attack (tutanın STR saldırıları avantajlı, ona yapılan saldırılar avantajlı). `shield`: Shield
   * büyüsü (Görev R1): tutanın AC'si `ac` artar, sonraki turunun başına dek.
   */
  kind: 'sap' | 'slow' | 'vex' | 'reckless' | 'shield';
  ac?: number;
  by: string;
  targetId?: string;
  feet?: number;
  end: 'turnStart' | 'turnEnd';
  count: number;
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
  /**
   * Masumları koru: kaç masum var ve kaçının hayatta kalması hedefleniyor. Varsayılan bilgi
   * amaçlı (sonucu etkilemez, GM hikâyede işler); `strict` açıksa hayatta kalan `needed`ın
   * altına düşünce düşmanlar kazanır.
   */
  objective?: { total: number; needed: number; strict?: boolean };
  /** Kapı durumları ("sütun,satır" → açık/kapalı/kırık ve HP). */
  gates?: Record<string, { state: 'open' | 'closed' | 'broken'; hp: number }>;
  /**
   * Uyuyan ejderha (`sleepingDragon` kuralı): savaşçı kimliği ve yapay zekâ düşmanlarının onu
   * uyandırma kipi. `never`: asla; `chance`: her düşman turunda `chancePct` yüzdeyle; `gm`: yalnızca GM.
   */
  dragon?: { id: string; mode: DragonWakeMode; chancePct: number };
}

/**
 * Bir durumun süresi. `ownerId` kimin turunda sayıldığı (etkiyi veren ya da hedefin kendisi):
 * `end` turun başında mı sonunda mı; `count` o savaşçının kaç tur başı/sonu daha (0'a inince biter).
 * `save` varsa ("save ends"): her `end` anında hedef bu yetenek ve DC ile kurtarma zarı atar, başarıda biter.
 */
export interface ConditionTimer {
  condition: string;
  ownerId: string;
  end: 'turnStart' | 'turnEnd';
  count: number;
  save?: { ability: Ability; dc: number };
  /** Etkinin adı (günlük için: "Wyvern: Sting", "Hold Person"). */
  label: string;
  sourceId?: string;
  /** Durum sürerken hedefin her tur başında aldığı hasar (Pit Fiend zehri, cehennem yarası); tür boşsa türsüz. */
  dot?: { dice: string; type: string };
}

export type DragonWakeMode = 'never' | 'chance' | 'gm';

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
  /** Zar modu (Görev J): otomatik ya da fiziksel zar (yalnızca oyuncular / herkes). Eski kayıtta yok = otomatik. */
  diceMode?: DiceMode;
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
  /** Saldırı zarındaki yetenek (Rage hasarı ve Reckless Attack: STR). */
  ability?: 'str' | 'dex';
  /** Finesse silah (Sneak Attack için). */
  finesse?: boolean;
  /** Silahın kimliği (data/weapons.json). */
  weaponId?: string;
  /** Karakterin bu silahta kullandığı ustalık (Weapon Mastery; yalnızca oyunda çalışanlar). */
  mastery?: MasteryId;
  /** Saldırı zarındaki yetenek değiştiricisi (Graze hasarı, Cleave). */
  abilityMod?: number;
  /** Yetenek değiştiricisiz silah hasarı (Cleave'in ikinci saldırısı; büyülü bonus dahil). */
  weaponDamage?: string;
  /** Ustalığın save DC'si: 8 + yetenek değiştiricisi + yetkinlik (Topple). */
  masteryDc?: number;
  /** Silahın hasar zarlarında en düşük sayılan değer (Great Weapon Fighting: 3). */
  minDie?: number;
  /** Light silah (Light özelliğinin ek saldırısı; Görev P1). */
  light?: boolean;
  /** İki elle tutuluyor (Two-Handed ya da iki elle Versatile). */
  twoHands?: boolean;
  /** Yan el saldırısı (Light ek saldırısı). */
  offhand?: boolean;
  /** Hasar Radiant olabilir (Sacred Weapon): hedefe göre en iyi tür seçilir (Görev P-Paladin). */
  radiantOption?: boolean;
  /** Monk silahı ya da Unarmed Strike, Martial Arts'la (Stunning Strike, Flurry; Görev P-Monk). */
  martialArts?: boolean;
}

/** İsabetteki ek hasar (Sneak Attack, Hunter's Mark). */
export interface ExtraDamage {
  label: string;
  rolls: number[];
  raw: number;
  applied: number;
  type: string;
  note: DamageNote;
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
  /** GM: uyuyan ejderhayı uyandır (her kipte, her an). */
  | { type: 'wake_dragon' }
  /** Yapay zekâ düşmanı (`dragonWake: chance`): tur başında uyandırma eğilimi zarı. */
  | { type: 'rouse_dragon'; actorId: string }
  /** Kapalı kapıya silahla saldırı (kırmak için). */
  | { type: 'attack_gate'; actorId: string; at: Offset; option: AttackOption }
  /** Batağa saplanmış savaşçı kendini çıkarmaya çalışır (Athletics). */
  | { type: 'escape'; actorId: string }
  /** Bitişikteki batmış müttefiki çeker (Athletics). */
  | { type: 'pull'; actorId: string; targetId: string }
  /** Yalnızca GM: bir savaşçıdan beceri kontrolü ister (sıra beklemez). */
  | { type: 'skill_check'; actorId: string; skill: Skill; dc: number }
  /** Kurulum aşaması: savaşçıyı kendi başlangıç bölgesine yerleştirir. */
  | { type: 'place'; actorId: string; at: Offset }
  /** GM kurulumda masumun görselini seçer (data/masumlar.json kimliği). */
  | { type: 'choose_civilian_art'; actorId: string; gorselId: string }
  /** Yalnızca GM, kurulum aşaması: herkes yerleştiyse savaşı başlatır. */
  | { type: 'start_battle' }
  | { type: 'end_turn'; actorId: string }
  /**
   * Büyü. Haritalı savaşta alan büyüleri hedef altıgen (`targetHex`) alır; verilmezse
   * `targetId`nin altıgeni kullanılır.
   */
  | {
      type: 'cast_spell'; actorId: string; spellName: string; targetId?: string; targetHex?: Offset; slotLevel?: number;
      /** Çok hedefli etki büyüsü (Bless, Bane, Heroism; Görev R2): hedefler (yoksa `targetId`). */
      targetIds?: string[];
      /**
       * Etki büyüsünün seçimi: beceri (Guidance), hasar türü (Resistance), komut (Command). Çağırma büyüsünde
       * (Görev R3) yaratık türü (Find Familiar, Find Steed) ya da nefes hasar türü (Summon Dragon).
       */
      choice?: string;
      /** Find Familiar: familiar biçimi (data/monsters.json kimliği; data/summons.json `forms`). */
      form?: string;
    }
  /** Yalnızca GM: bir savaşçıya durum ekler veya kaldırır. */
  | { type: 'set_condition'; targetId: string; condition: string; present: boolean }
  /** Yalnızca GM: bir savaşçının HP'sini elle ayarlar (0..maxHp). */
  | { type: 'adjust_hp'; targetId: string; hp: number }
  /** `targetHex` (Görev R4): alanlı saldırının hedef altıgeni (koni/çizgi yönü ya da küre merkezi); yoksa hedefin altıgeni. */
  | { type: 'monster_attack'; actorId: string; targetId: string; attackIndex: number; targetHex?: Offset }
  /** Ölmekte olan bir müttefiki stabilize etmeye çalışır (Medicine, DC 10). */
  | { type: 'stabilize'; actorId: string; targetId: string }
  | { type: 'multiattack'; actorId: string; targetId: string }
  /**
   * İtme (Unarmed Strike'ın Shove seçeneği): Attack eylemindeki bir saldırının yerine. Hedef STR
   * ya da DEX save'i yapar; başarısızsa 5 ft itilir (`push`) ya da Prone olur (`prone`).
   */
  | { type: 'shove'; actorId: string; targetId: string; effect: 'push' | 'prone' }
  /** Kaçın (Dodge): sonraki turunun başına dek saldıranlar dezavantajlı, DEX save'leri avantajlı. */
  | { type: 'dodge'; actorId: string }
  /** Ayağa kalk (Prone kalkar, hızın yarısı harcanır). */
  | { type: 'stand_up'; actorId: string }
  /** Yakalamadan kaçmaya çalış (eylem; Athletics ya da Acrobatics vs kaçış DC'si). */
  | { type: 'escape_grapple'; actorId: string }
  /** Yardım (Help): bitişik düşmana karşı tarafının ilk saldırısı avantajlı (sonraki turunun başına dek). */
  | { type: 'help'; actorId: string; targetId: string }
  /** Fighter: Action Surge (eylemini kullandıktan sonra bir eylem daha). */
  | { type: 'action_surge'; actorId: string }
  /** Fighter: Second Wind (bonus eylem, 1d10 + seviye HP). */
  | { type: 'second_wind'; actorId: string }
  /** Yan el ek saldırısı (Light özelliği): Attack eyleminde Light silahla saldırdıktan sonra; Nick varsa eylemin içinde. */
  | { type: 'offhand_attack'; actorId: string; targetId: string }
  /** Görev R4: Dragonborn Breath Weapon; Attack eyleminin bir saldırısının yerine; şekil (koni/çizgi) ve yön altıgeni. */
  | { type: 'breath_weapon'; actorId: string; shape: 'cone' | 'line'; targetHex: Offset }
  /** Rage (bonus eylem): başlatır ya da süren Rage'i bir tur daha uzatır. */
  | { type: 'rage'; actorId: string }
  /** Reckless Attack (eylemsiz): turun ilk saldırısından önce. */
  | { type: 'reckless'; actorId: string }
  /**
   * Savaşta kullanılan sınıf özelliği (veriden, `FeatureMechanic.effect`; Görev P-Paladin): iyileştirme havuzu
   * (`amount` HP, `cure` ile durum kaldırma) ya da süren güçlendirme.
   */
  | { type: 'use_feature'; actorId: string; feature: string; targetId?: string; amount?: number; cure?: boolean }
  /** Bonus eylemle Unarmed Strike (Martial Arts) ya da Flurry of Blows'un vuruşu (Open Hand Technique seçimiyle). */
  | { type: 'bonus_strike'; actorId: string; targetId: string; technique?: 'addle' | 'push' | 'topple' }
  /** Focus ile bonus eylem (veriden: Flurry of Blows, Patient Defense, Step of the Wind). */
  | { type: 'focus_action'; actorId: string; action: string }
  /** Stunning Strike: bu tur Monk silahı ya da Unarmed Strike ile vurulan hedefe (eylemsiz, Focus harcar). */
  | { type: 'stunning_strike'; actorId: string; targetId: string }
  /**
   * Süren konsantrasyon büyüsünü bonus eylemle sürdürür: Spiritual Weapon gücü 20 ft taşınıp
   * saldırır; Hunter's Mark işareti, hedefi 0 HP'ye düştüyse yeni hedefe taşınır.
   */
  | { type: 'spell_followup'; actorId: string; targetId: string };

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
      /** İsabetteki ek hasarlar (`appliedDamage` bunları da içerir). */
      extra?: ExtraDamage[];
      /** Sneak Attack kullanıldı: bu tur anahtarı saldırana yazılır. */
      sneakTurn?: string;
      /** Frenzy kullanıldı: bu tur anahtarı saldırana yazılır. */
      frenzyTurn?: string;
      /** Fırsat saldırısı (tepki). */
      opportunity?: boolean;
      /** Yakın dövüş silah saldırısı (smite büyülerinin tetiği; Görev P-Paladin). */
      melee?: boolean;
      /** Monk silahı ya da Unarmed Strike (Stunning Strike tetiği; Görev P-Monk). */
      martialArts?: boolean;
      /** Deflect Attacks ile azaltılan hasar (tepki harcandı). */
      deflected?: number;
      /**
       * Hedefin tepkisi (Görev R1): adı, AC'ye eklenen (Shield, Parry; `targetAc` dahil) ve azaltılan hasar
       * (Uncanny Dodge, Deflect; `appliedDamage` sonrası).
       */
      reacted?: { name: string; ac?: number; reduced?: number };
      /** Saldırı zarının eklenti zarları (Bless, Bane; Görev R2; `total` dahil). */
      bonusDice?: RolledExtra[];
    }
  | {
      /**
       * Tepki kullanıldı (Görev R1; kayıt sürümü 13): tepki hakkı harcanır. Havuzlu canavar tepkisinde kalan kullanım,
       * Recharge'lı tepkide yeniden dolması beklenir.
       */
      type: 'reaction_used'; actorId: string; reaction: string; name: string; trigger: ReactionTrigger;
      sourceId?: string; pool?: { id: string; remaining: number }; recharge?: boolean;
      /** Süren etki (Shield: AC işareti, sonraki turunun başına dek). */
      mark?: MasteryMark;
    }
  | { type: 'reaction_recharged'; actorId: string; reaction: string; d6: number; recharged: boolean }
  /** Süren etki kondu (Görev R2; kayıt sürümü 14); aynı kimlikli etki yenisiyle değişir. */
  | { type: 'effect_added'; targetId: string; effect: ActiveEffect }
  /** Süren etki bitti (save, süre, kullanım, komutun turu). */
  | { type: 'effect_ended'; targetId: string; effectId: string; name: string; reason: 'save' | 'used' | 'expired' | 'turn' }
  /** Geçici HP (Heroism): yığılmaz, yüksek olan kalır. */
  | { type: 'temp_hp'; targetId: string; amount: number; label: string }
  /** En çok HP ve HP artışı (Aid). */
  | { type: 'hp_boosted'; targetId: string; amount: number; label: string }
  /** Süregelen hasar (Searing Smite): tur başında hasar, ardından save. */
  | {
      type: 'effect_tick'; targetId: string; effectId: string; name: string; damageRolls: number[]; appliedDamage: number;
      damageType: string; targetHpAfter: number; effects: DamageEffect[];
      save?: { ability: Ability; dc: number; d20: number[]; total: number; success: boolean; extra?: RolledExtra[] };
    }
  /** Komut (Command): sırası gelen yaratık turunu kaybetti (Grovel: önce yere düşer). */
  | { type: 'turn_lost'; actorId: string; label: string; command: 'grovel' | 'halt' }
  /** İki yaratık yer değiştirdi (Redirect Attack). */
  | { type: 'swapped'; actorId: string; otherId: string }
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
  /** Masumun görseli seçildi (kayıt sürümü 4). */
  | { type: 'civilian_art'; actorId: string; gorselId: string }
  /**
   * Bu adımda atılan zarlar (Görev J; kayıt sürümü 5): değerleri, kimin ne için attığı, elle mi girildiği.
   * Durumu değiştirmez (sonuçlar zaten ardından gelen olaylarda); zar animasyonu ve elle girilen zarların kaydı için.
   */
  | { type: 'dice_rolled'; rolls: DiceRoll[] }
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
      /** Toplamın geçmesi gereken pasif Algı DC 15'ten yüksekse o gözcü (Görev K). */
      watcherId?: string;
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
      /** Light silahla saldırı (yan el ek saldırısını açar) ve yan el ek saldırısı yapıldı (kayıt sürümü 10). */
      light?: boolean; offhand?: boolean;
      /** Flurry of Blows'tan kalan vuruş ve Stunning Strike denendi (Görev P-Monk). */
      flurryLeft?: number; stunUsed?: boolean;
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
      /** Kontrol zarının eklenti zarları (Guidance; Görev R2). */
      bonusDice?: RolledExtra[];
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
      /** Yayılım save'i (Spirit Guardians): büyücü ve tur; yaratık turda bir kez save yapar. */
      aura?: { casterId: string; turn: string };
      /** Save zarının eklenti zarları (Bless, Bane; Görev R2; `total` dahil). */
      bonusDice?: RolledExtra[];
    }
  | { type: 'healed'; actorId: string; targetId: string; label: string; amount: number; targetHpAfter: number }
  /** `sourceId`: durumu koyan büyücü (konsantrasyon bitince kalkar). */
  | { type: 'condition_changed'; targetId: string; condition: string; present: boolean; reason: string; sourceId?: string; timer?: ConditionTimer }
  /** Süreli durum sayacı azaldı (`count` yeni değer). */
  | { type: 'condition_timer'; targetId: string; condition: string; count: number }
  /** "Save ends" kurtarma zarı (her kendi turunun sonunda). */
  | { type: 'condition_save'; targetId: string; condition: string; ability: Ability; dc: number; d20: number[]; total: number; success: boolean; bonusDice?: RolledExtra[] }
  /** Süreli durum bitti (süre doldu, kurtarma başarılı, kullanıldı). */
  | { type: 'condition_ended'; targetId: string; condition: string; reason: string }
  /** Yere düşmüş savaşçı ayağa kalktı: hızının yarısı kadar hareket harcar (`cost` altıgen). */
  | { type: 'stood_up'; actorId: string; cost: number }
  /** Yakalandı (Grappled; `restrained`: kavrama sürerken Restrained da). */
  | { type: 'grappled'; targetId: string; by: string; escapeDc: number; restrained: boolean; label: string }
  /** Yakalama bitti (kaçtı, yakalayan düştü/etkisiz, uzaklaştı). */
  | { type: 'grapple_ended'; targetId: string; reason: string }
  /** Kaçış denemesi: Athletics ya da Acrobatics (yüksek olan) vs kaçış DC'si. */
  | { type: 'grapple_escape'; actorId: string; skill: 'athletics' | 'acrobatics'; d20: number[]; total: number; dc: number; success: boolean }
  /** İtme: hedefin save'i ve sonucu; başarısızsa `effect` uygulanır (`to`: itileceği altıgen). */
  | {
      type: 'shove_resolved'; actorId: string; targetId: string; ability: 'str' | 'dex'; dc: number;
      d20: number[]; natural: number | null; total: number | null; success: boolean; effect: 'push' | 'prone'; to?: Offset;
    }
  /** Riskli atlama zarı (`lavJump`): sonuç güvenli iniş, yanarak iniş ya da düşme. */
  | {
      type: 'jump_check'; actorId: string; from: Offset; to: Offset; skill: Skill; d20: number[]; natural: number;
      total: number; dc: number; over: number; outcome: 'safe' | 'burned' | 'fell';
    }
  /** Zorunlu hareket (itme): fırsat saldırısı tetiklemez; harita kuralları ayrıca çalışır. */
  | { type: 'pushed'; targetId: string; from: Offset; to: Offset; by: string }
  /**
   * Silah ustalığı uygulandı (kayıt sürümü 8). Graze: `damage` ve `hpAfter`; Topple: `save`; Sap/Slow/Vex: `mark`
   * (`holderId` işareti taşıyan); Cleave: `turn` (saldırana yazılır, ardından ikinci saldırı); Push: ardından `pushed`.
   */
  | {
      type: 'mastery_applied'; actorId: string; targetId: string; mastery: MasteryId; label: string;
      damage?: { raw: number; applied: number; type: string; note: DamageNote };
      hpAfter?: number;
      effects?: DamageEffect[];
      save?: { ability: Ability; dc: number; d20: number[]; natural: number | null; total: number | null; success: boolean };
      mark?: { holderId: string; mark: MasteryMark };
      turn?: string;
    }
  /** Rage başladı (`added`: Rage'in eklediği dirençler; konsantrasyon biter; kayıt sürümü 9). */
  | { type: 'rage_started'; actorId: string; added: string[] }
  /** Rage bonus eylemle uzatıldı. */
  | { type: 'rage_extended'; actorId: string }
  /** Rage bitti (`reason`: süre doldu, Incapacitated…). */
  | { type: 'rage_ended'; actorId: string; reason: string }
  /** Reckless Attack: sonraki turunun başına dek (işaret `reckless`). */
  | { type: 'reckless_started'; actorId: string }
  /** Ustalık işareti kullanıldı ve kalktı (Sap: dezavantajlı saldırı; Vex: avantajlı saldırı). */
  | { type: 'mastery_mark_used'; holderId: string; kind: MasteryMark['kind']; by: string; targetId?: string }
  /** Sınıf özelliği kullanıldı; `remaining` kalan kullanım. */
  | { type: 'feature_used'; actorId: string; feature: string; remaining: number }
  /** Süren güçlendirme eklendi (aynı kaynaktan olan yenilenir). */
  | { type: 'buff_added'; targetId: string; buff: Buff }
  /** Konsantrasyon başladı (öncekini bitirir). */
  /** Görev R3: çağrılan yaratık savaşa girer; `index` sıradaki yeri (sahibinin ardı ya da inisiyatifine göre). */
  /**
   * Görev R4: alan etkisi (canavar nefesi, Dragonborn, Draconic Spirit): şekil, ölçü, hedef altıgen, kapladığı altıgenler
   * ve etkilenenler; ardından her hedefin `save_resolved` olayı. Durumu değiştirmez (günlük ve önizleme).
   */
  | { type: 'area_used'; actorId: string; label: string; shape: string; sizeFt: number; widthFt?: number; aim?: Offset; hexes: Offset[]; targetIds: string[] }
  | { type: 'summoned'; ownerId: string; spell: string; combatant: Combatant; index: number }
  /** Görev R3: çağrılan yaratık kaybolur (0 HP, konsantrasyon, sahibinin ölümü, yenisiyle değişme, süre). */
  | { type: 'summon_vanished'; actorId: string; ownerId: string; reason: SummonVanishReason }
  | { type: 'concentration_started'; actorId: string; spell: string; slotLevel: number; turn: string; targetId?: string; pos?: Offset }
  /** Konsantrasyon büyüsü taşındı: işaretin yeni hedefi veya gücün yeni altıgeni. */
  | { type: 'concentration_moved'; actorId: string; targetId?: string; pos?: Offset }
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
  | { type: 'battle_finished'; winner: Side }
  /** Uyuyan ejderha uyandı; `reason` günlük metni (hasar, yanına girdi, gürültü, Algı, GM). */
  | { type: 'dragon_woke'; actorId: string; reason: string; byId?: string }
  /** Tur sonunda ejderhanın Algı zarı: 25 ft içindeki gizlenmemiş karakteri fark etti mi. */
  | { type: 'dragon_perception'; actorId: string; watcherId: string; d20: number[]; total: number; dc: number; success: boolean }
  /** Düşmanın ejderhayı uyandırma eğilimi zarı (d100 < yüzde tutar). */
  | { type: 'rouse_roll'; actorId: string; roll: number; pct: number; success: boolean; turn: string };

export interface CommandContext {
  /** İsteği gönderen oyuncunun kimliği (GM için de kendi kimliği). */
  playerId: string | null;
  isGm: boolean;
}
