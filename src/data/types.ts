import type { Skill } from '../rules/skills';
import type { Ability } from '../rules/abilities';
import type { AreaShape } from '../rules/area';

export type Size = 'S' | 'M';

/** Türün alt seçeneği: Tiefling mirası, Dragonborn ejderha türü gibi. */
export interface Lineage {
  id: string;
  name: string;
  /** Bu seçimden gelen hasar dirençleri. */
  resistances: string[];
}

/** SRD 5.2.1 türü (species). Ability bonusları türden değil, geçmişten (background) gelir. */
export interface Race {
  id: string;
  name: string;
  /** Seçilebilir boyutlar. */
  sizes: Size[];
  speed: number;
  /** Darkvision menzili (ft), yoksa 0. */
  darkvision: number;
  /** Türden gelen hasar dirençleri. */
  resistances: string[];
  /** Seviye başına ek HP (Dwarven Toughness). */
  hpPerLevel?: number;
  /** Seçilebilir miras/soy; karakter formunda lineageId ile seçilir. */
  lineages?: Lineage[];
  /** Seçim yapılmamışsa kullanılan miras (oluşturucu ekranı gelene kadar geçici). */
  defaultLineage?: string;
  traits: string;
}

export type CastingType = 'full' | 'half' | 'pact';

export interface CharacterClass {
  id: string;
  name: string;
  hitDie: 6 | 8 | 10 | 12;
  saves: Ability[];
  casting: { type: CastingType; ability: Ability } | null;
  /** Standart diziyi (15, 14, 13, 12, 10, 8) dağıtırken kullanılan ability sırası. */
  abilityPriority: Ability[];
  /** Büyü listesi kodu (spells.json içindeki "classes" alanıyla eşleşir). */
  spellCode: string | null;
  weaponProficiency: 'simple' | 'martial';
  /** Simple sınıfların proficient olduğu martial silah özellikleri (Rogue: finesse/light, Monk: light). */
  martialWeaponProperties: Array<'finesse' | 'light'>;
  /** 1. seviyede seçilen beceri yetkinlikleri (SRD 5.2.1 sınıf tablosu): sayı ve liste ya da "any". */
  skillChoices: { count: number; from: Skill[] | 'any' };
}

export type ArmorType = 'none' | 'light' | 'medium' | 'heavy';

export interface Armor {
  name: string;
  baseAc: number;
  type: ArmorType;
  /** Giyen Dexterity (Stealth) zarlarında dezavantaj alır (SRD 5.2.1 zırh tablosu). */
  stealthDisadvantage?: boolean;
  /** Güç şartı (SRD 5.2.1 zırh tablosu): giyenin Güç skoru daha düşükse hızı 10 ft azalır. */
  strength?: number;
}

export type DamageType = 'slashing' | 'piercing' | 'bludgeoning';

export interface Weapon {
  name: string;
  damage: string;
  versatileDamage?: string;
  damageType: DamageType;
  category: 'simple' | 'martial';
  finesse: boolean;
  light: boolean;
  ranged: boolean;
  /** Normal ve uzun menzil (ft): mühimmatlı ve fırlatılabilir silahlar. */
  range?: [number, number];
  /** Fırlatılabilir yakın dövüş silahı (Thrown). */
  thrown?: boolean;
  /** Uzun erişim (Reach): erişim 10 ft. */
  reach?: boolean;
  /** SRD 5.2.1 silah özellikleri (açıklama için): Heavy, Two-Handed, Loading, Ammunition. */
  heavy?: boolean;
  twoHanded?: boolean;
  loading?: boolean;
  ammunition?: boolean;
}

export interface SpellUpcast {
  dice?: string;
  rays?: number;
  targets?: number;
  hp?: number;
  duration?: boolean;
  other?: boolean;
  /** Motor bu etkiyi uyguluyor. */
  applied?: boolean;
}

export interface SpellMechanics {
  /** `mark`: hedefi işaretler, işaretliye her isabette ek hasar (Hunter's Mark). */
  kind: 'attack' | 'save' | 'auto' | 'heal' | 'sleep' | 'utility' | 'mark';
  /** Hasar veya iyileştirme zarı (örneğin "8d6"). */
  damage?: string;
  damageType?: string;
  /** Büyü yapma ability modifier'ını ekle (Cure Wounds gibi). */
  addCastingMod?: boolean;
  /** Hedefin yapacağı save. */
  save?: Ability;
  /** Save başarılıysa hasar yarıya iner (cantrip'lerde hasar hiç olmaz). */
  halfOnSave?: boolean;
  /** Başarısız save'de büyücüden uzağa itme (ft), Thunderwave gibi. */
  pushFt?: number;
  /** Tek seferde kaç dart veya ışın. */
  rays?: number;
  /** Işın sayısı karakter seviyesiyle artar (Eldritch Blast). */
  raysByLevel?: boolean;
  /** Cantrip zar sayısı 5., 11. ve 17. seviyede artar. */
  scalesWithLevel?: boolean;
  /** Save başarısızsa uygulanan durumlar. */
  conditions?: string[];
  /**
   * Yukarı slot etkisi (SRD "Using a Higher-Level Spell Slot", `npm run srd:buyu` üretir): slot seviyesi başına
   * ek zar (`dice`), ek ışın/dart (`rays`), ek hedef (`targets`), ek HP (`hp`) ya da yalnızca süre (`duration`).
   * Motor yalnızca `applied` olanları uygular; diğerleri veri olarak durur (Aşama 1).
   */
  upcast?: SpellUpcast;
  /** SRD'den bilinen sapma (oyunun yaklaşıklığı), raporda listelenir. */
  approx?: string;
  /**
   * Konsantrasyon süresince süren etki: `weapon` sonraki turlarda bonus eylemle yeniden saldıran
   * güç (Spiritual Weapon), `aura` büyücüyle yürüyen yayılım (Spirit Guardians).
   */
  lingering?: 'weapon' | 'aura';
}

export interface Spell {
  name: string;
  level: number;
  /** Büyü yapma süresi (SRD 5.2.1 Casting Time): eylem, bonus eylem veya tepki. */
  castingTime: 'action' | 'bonus' | 'reaction';
  classes: string[];
  /** Menzil (ft). Dokunma 5, Kendi 0; kendinden çıkan alan ve fırlatmada etkinin ulaştığı uzaklık. */
  rangeFt: number;
  /** Süresi "Concentration" (SRD 5.2.1): yeni konsantrasyon büyüsü eskisini bitirir. */
  concentration?: boolean;
  /**
   * Alan (SRD 5.2.1): şekil, boyut (ft), çıkış (seçilen nokta veya büyücü) ve kimleri etkilediği
   * (herkes veya yalnızca büyücünün seçtiği düşmanlar). Haritalı savaşta kullanılır.
   */
  area?: { shape: AreaShape; sizeFt: number; origin: 'point' | 'self'; targets: 'all' | 'enemies' };
  text: string;
  mechanics: SpellMechanics;
  /** SRD 5.2.1'den (`npm run srd:buyu`): okul ve sayfa (bileşen ve süre data/srd/spells.json'da). */
  school?: string;
  srdPage?: number;
}

export interface ItemEffects {
  acBonus?: number;
  saveBonus?: number;
  /** Zırhsız ve kalkansızken ek AC (Bracers of Defense gibi). */
  unarmoredAcBonus?: number;
  /** Skoru en az bu değere çeker (Gauntlets of Ogre Power gibi). */
  setAbility?: Partial<Record<Ability, number>>;
}

export interface Item {
  name: string;
  attunement: boolean;
  text: string;
  effects: ItemEffects;
}

export type EnvironmentCategory = 'spell' | 'race' | 'class' | 'weapon';

export interface EnvironmentRule {
  /** `weapon` kuralları yalnızca silah saldırısına (büyüye ve save'li etkiye değil) uygulanır. */
  category: EnvironmentCategory;
  keywords: string[];
  effect: 'advantage' | 'disadvantage';
  note: string;
  /** Yalnızca menzilli (`true`) ya da yalnızca yakın dövüş (`false`) silah saldırısı. */
  ranged?: boolean;
}

export interface Environment {
  id: string;
  name: string;
  description: string;
  rules: EnvironmentRule[];
}

export interface MonsterAttack {
  name: string;
  bonus: number;
  damage: string;
  /** Recharge değeri (5 = "Recharge 5-6"). */
  recharge?: number;
  /** Multiattack sırasında kaç kez kullanılacağı (0 = hiç). */
  repeat?: number;
  /** Hasar zarı ("2d6+4"), metinden ayrıştırılmış. Yoksa saldırı hasar vermez (Web gibi). */
  damageDice?: string;
  damageType?: string;
  /** Saldırı zarı yerine hedefin save'i ile çözülen saldırılar (nefes gibi). */
  save?: { ability: Ability; dc: number; halfOnSave: boolean };
  /** Ek etki metni; elle uygulanır (zehir, felç gibi). */
  rider?: string;
  ranged?: boolean;
  /** Yakın dövüş erişimi (ft). */
  reachFt?: number;
  /** Menzilli saldırı veya alan etkisinin normal ve uzun menzili (ft); alanlarda ikisi eşit. */
  range?: [number, number];
}

/** Yaratık boyutu (SRD 5.2.1): Tiny, Small, Medium, Large, Huge, Gargantuan. */
export type CreatureSize = 'T' | 'S' | 'M' | 'L' | 'H' | 'G';

export interface Monster {
  id: string;
  name: string;
  /** Boyut; verilmezse Medium. */
  size?: CreatureSize;
  ac: number;
  hp: number;
  speed: number;
  /** Uçuş hızı (ft). */
  fly?: number;
  /** `public/` altındaki jeton resmi; verilmezse `monsters/<id>.webp` (uyurken `<id>-uyku.webp`). */
  avatar?: string;
  abilities: Record<Ability, number>;
  /** Modifier'dan farklı olan save bonusları (stat bloğundaki SAVE sütunu). */
  saves?: Partial<Record<Ability, number>>;
  /** Stat bloğundaki Skills satırı (toplam bonus); yoksa ability modifier'ı kullanılır. */
  skills?: Partial<Record<Skill, number>>;
  /** Karanlık görüş (ft), stat bloğundaki Senses satırından. */
  darkvision?: number;
  /** Bonus eylemle yapabildikleri (Goblin Nimble Escape: Disengage veya Hide). */
  bonusActions?: Array<'dash' | 'disengage' | 'hide'>;
  cr: string;
  attacks: MonsterAttack[];
  traits: string;
  packTactics?: boolean;
  undeadFortitude?: boolean;
  multiattack?: boolean;
  regeneration?: number;
  resistances?: string[];
  immunities?: string[];
  vulnerabilities?: string[];
  /**
   * Motorun desteklemediği özellikler (bilgi): alan şekilleri, Legendary Actions, çok hex'li boyut,
   * büyü, tepkiler... Canavar yine kullanılabilir; bu özellikler yok sayılır ya da basit karşılıkla
   * (ör. nefes tek hedefe) oynanır. Liste DECISIONS.md'de.
   */
  unsupported?: string[];
}

export interface SpellSlotTables {
  /** Seviye 1–20 için, 1. ile 9. seviye büyü slot sayıları. */
  full: number[][];
  /** Anahtar: seviye. Paladin ve Ranger için. */
  half: Record<string, number[]>;
}

export interface ConditionList {
  all: string[];
  incapacitating: string[];
}

// ------------------------------------------------------------------ sınıf ilerlemesi (Görev N)

/** SRD sınıf tablosunun bir satırı (data/srd/progression.json, `npm run srd`). */
export interface ProgressionRow {
  level: number;
  features: Array<{ id: string; name: string }>;
  /** Tablo sütunları (Rages, Sneak Attack, slot1…): sayı, metin ("1d6", "+10 ft.") ya da yok (null). */
  values: Record<string, number | string | null>;
}

export interface ClassProgression {
  id: string;
  name: string;
  hitDie: number;
  subclassLevel: number | null;
  asiLevels: number[];
  epicBoonLevels: number[];
  subclassFeatureLevels: number[];
  columns: string[];
  rows: ProgressionRow[];
  subclasses: Array<{ id: string; name: string; features: Array<{ id: string; name: string; level: number }>; source: { page: number } }>;
  source: { page: number; section: string };
}

export type FeatureType = 'passive' | 'resource' | 'action' | 'bonus' | 'reaction' | 'free';
export type FeatureStatus = 'ok' | 'partial' | 'none' | 'missing';

/** Bir sınıf özelliğinin oyundaki mekaniği (data/class-features.json). */
export interface FeatureMechanic {
  type: FeatureType;
  status: FeatureStatus;
  /** Pasif sayının türü. */
  stat?: 'attacksPerAction' | 'sneakAttackDice' | 'speed' | 'unarmoredDefense' | 'expertise' | 'spellcasting' | 'featSlot';
  value?: number;
  /** Değer SRD tablosunun bu sütunundan ("Sneak Attack" → "3d6" → 3). */
  column?: string;
  /** Koşul: ağır zırh yok / zırh ve kalkan yok. */
  when?: 'noHeavyArmor' | 'noArmorNoShield';
  /** Unarmored Defense: AC'ye eklenen yetenekler ve kalkanla geçerli mi. */
  abilities?: Array<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'>;
  shield?: boolean;
  /** Bonus eylemle yapılabilenler (Cunning Action). */
  grants?: Array<'dash' | 'disengage' | 'hide'>;
  /** Özelliği kullanan komut ve harcadığı kaynak. */
  command?: string;
  resource?: string;
  /** featSlot: seçilecek feat kategorisi (Fighting Style). */
  category?: string;
  note?: string;
}

export interface ResourceDef {
  name: string;
  /** Kaynağı veren özellik(ler): `sınıf:özellik`. */
  feature: string | string[];
  uses: { column?: string; byLevel?: Record<string, number>; perLevel?: number; abilityMod?: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'; min?: number; fixed?: number };
  /** Yenilenme: kısa/uzun dinlenme ya da tur başı; "all" hepsi, sayı o kadar. `shortFrom`: kısa dinlenme bu seviyeden. */
  recharge: { short?: 'all' | number; long?: 'all' | number; turn?: 'all' | number; shortFrom?: number };
  /** Kaynak kaldıkça bu büyü slotsuz yapılır (Favored Enemy → Hunter's Mark). */
  freeSpell?: string;
}

/** Feat'in oyundaki etkisi (data/class-features.json "feats"). */
export interface FeatMechanic {
  status: FeatureStatus;
  /** asi: +2 bir skora ya da +1 iki skora; one: bir skora +amount (choices verilirse onlardan). */
  abilityIncrease?: { kind: 'asi' | 'one'; choices?: Array<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'>; amount?: number; max: number };
  initiativeProficiency?: boolean;
  extraSkills?: number;
  rangedAttackBonus?: number;
  armoredAcBonus?: number;
  note?: string;
}

export interface ClassMechanics {
  resources: Record<string, ResourceDef>;
  features: Record<string, FeatureMechanic>;
  feats: Record<string, FeatMechanic>;
}

/** SRD feat'i (data/srd/feats.json). */
export interface SrdFeat {
  id: string;
  name: string;
  category: string;
  prerequisite?: string;
  repeatable: boolean;
  benefits: Array<{ name: string; text: string }>;
  text: string;
  source: { page: number; section: string };
}
