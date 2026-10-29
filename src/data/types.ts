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
  /**
   * Dragonborn Breath Weapon (Görev R4; SRD tür özelliği `species:<tür>/<özellik>`): şekil seçenekleri (koni ya da
   * çizgi), save, karakter seviyesine göre zar, kullanım kaynağı (uzun dinlenmede dolar). Hasar türü mirasın direnci.
   */
  breathWeapon?: {
    srd: string;
    resource: string;
    save: Ability;
    shapes: Array<{ shape: 'cone' | 'line'; sizeFt: number; widthFt?: number }>;
    dice: Record<string, string>;
    note?: string;
  };
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
  /** Sabit kimlik (değişmez; Dungeondex vb. açıklamalar buna bağlanır). */
  id: string;
  /** SRD 5.2.1 karşılığı: `<dosya>:<kimlik>` (data/srd/<dosya>.json). */
  srd: string;
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
  /**
   * `mark`: hedefi işaretler, işaretliye her isabette ek hasar (Hunter's Mark). `smite`: bu tur yakın dövüş silahıyla
   * vurulan hedefe isabetin ek hasarı (Divine Smite; kritikte zarlar iki kat). `buff`: büyücüye (`selfBuff`) ya da
   * konsantrasyon hedefine (`ward`) süren etki (Görev P-Paladin).
   */
  kind: 'attack' | 'save' | 'auto' | 'heal' | 'sleep' | 'utility' | 'mark' | 'smite' | 'buff' | 'effect' | 'summon' | 'teleport' | 'cure' | 'revive';
  /** Görev S1, `kind: cure`: dosttan kaldırılan durumlar (ilk bulunan; Lesser Restoration). */
  cures?: string[];
  /** Görev S1, `kind: revive`: `stabilize` 0 HP'deki dostu stabil eder (Spare the Dying), `revive` ölü dostu 1 HP ile kaldırır (Revivify). */
  revive?: 'stabilize' | 'revive';
  /** Görev S1, `kind: teleport`: büyücü görebildiği boş bir altıgene ışınlanır (Misty Step); menzil ft. */
  teleport?: { rangeFt: number; sight: boolean };
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
  /** smite: bu yaratık türlerine ek zar (Divine Smite: Fiend, Undead +1d8). */
  vsTypes?: { types: string[]; dice: string };
  /** Konsantrasyon hedefindeki etki: AC bonusu, ona saldırılar avantajlı, bu türlerin saldırıları dezavantajlı. */
  ward?: { ac?: number; advantageAgainst?: boolean; disadvantageFromTypes?: string[] };
  /** Büyücünün silah saldırılarına süren etki (tur sayısı): saldırı/hasar bonusu, isabette ek zar. */
  selfBuff?: { attackBonus?: number; damageBonus?: number; extraDamage?: string; damageType?: string; rounds: number };
  /** Süren etki (Görev R2): hedeflere konan zar eklentisi, hasar azaltma, geçici HP, tur atlatma (`EffectSpec`). */
  effect?: EffectSpec;
  /** Smite'ın hedefte bıraktığı süregelen hasar (Searing Smite: her tur başı zar, ardından save; başarıda biter). */
  ongoing?: { dice: string; type: string; save: Ability; rounds: number; icon?: string };
  /** Tepki büyüsü (Görev R1): tetik ve etkisi; `castingTime: reaction` olanlar motorun tetiğiyle yapılır. */
  reaction?: ReactionMechanic;
  /** Oyunda çalışmıyorsa nedeni (oluşturucu ve savaş "çalışmıyor" gösterir). */
  unsupported?: string;
}

/**
 * Süren etki büyüsü (Görev R2; `kind: effect`): kaç hedef (yukarı slot başına `upcast.targets`), dost mu düşman mı,
 * düşmansa save (büyünün `save`'i; başarısızsa etki), ne kadar sürer (`rounds`; konsantrasyonda konsantrasyon
 * bitince de biter). Etki: zar eklentisi (`dice`: +/− zar, saldırı/save/kontrol; `skill: 'chosen'` seçilen beceri),
 * hasar azaltma (`reduce`: turda bir, seçilen tür), her tur başı geçici HP (`tempHp: 'spellMod'`), durum bağışıklığı
 * (`immune`), anında en çok HP artışı (`hpBonus`, slot başına `upcast.hp`), sonraki turunu kaybetme (`command`).
 */
export interface EffectSpec {
  targets: number;
  side: 'ally' | 'enemy';
  rounds: number;
  dice?: { die: string; sign: 1 | -1; on: Array<'attack' | 'save' | 'check'>; skill?: 'chosen'; single?: boolean };
  reduce?: { die: string; type: 'chosen' };
  tempHp?: 'spellMod';
  immune?: string[];
  hpBonus?: number;
  command?: Array<'grovel' | 'halt'>;
  /** Seçim (beceri ya da hasar türü) listesi. */
  choices?: string[];
  /** Jetonda ve kartta gösterilen simge. */
  icon?: string;
  /** Görev S1: uçuş hızı (ft; Fly), havada süzülme (Levitate), yürüyemez, süresince verilen durumlar (Invisibility). */
  fly?: number;
  airborne?: boolean;
  speedZero?: boolean;
  grants?: string[];
  /** AC eklentisi, AC tabanı (`'mageArmor'`: 13 + hedefin DEX'i), hız çarpanı, eylemle biter (Görev S1). */
  ac?: number;
  acMin?: number | 'mageArmor';
  speedMult?: number;
  breakOnAct?: boolean;
  /** Hıza eklenen ft (Longstrider); anında geçici HP zarı (False Life; yukarı slotta `upcast.hp` × fark eklenir). */
  speedFt?: number;
  tempHpNow?: string;
}

/**
 * Tepki mekaniği (Görev R1; büyü, sınıf özelliği ve canavar tepkisi aynı biçimde). Türler:
 * `shield` (isabette AC +`acBonus` sonraki turunun başına dek; Magic Missile'a bağışık), `parry` (isabette yalnızca
 * o saldırıya AC +`acBonus`; `counterAttack` ıskalatınca o saldırıyla karşılık), `halve` (isabetin hasarı yarıya),
 * `resist` (isabetin hasarına direnç), `deflect` (Deflect Attacks, savaşçının `deflect` verisi), `reduce` (isabette
 * `dice` kadar azaltma), `slowFall`, `featherFall` (düşme), `counterspell` (büyü yapılırken), `rebuke` (hasar alınca
 * büyü), `retaliate` (hasar alınca yakın dövüş saldırısı), `redirectAttack` (hedef alınınca yanındaki dostla yer
 * değiştirme), `gaze` (yakınında tur başlatana save, başarısızsa durum).
 */
export interface ReactionMechanic {
  kind: 'shield' | 'parry' | 'halve' | 'resist' | 'deflect' | 'reduce' | 'slowFall' | 'featherFall' | 'counterspell'
    | 'rebuke' | 'retaliate' | 'redirectAttack' | 'gaze';
  acBonus?: number;
  /** Yalnızca yakın dövüş (`melee`) ya da menzilli (`ranged`) saldırıda. */
  melee?: boolean;
  ranged?: boolean;
  /** Hasar türü koşulu (B/P/S). */
  types?: string[];
  /** Azaltma zarı (`reduce`). */
  dice?: string;
  /** Karşılık saldırısı (Riposte): canavar saldırısının adı. */
  counterAttack?: string;
  /** Recharge (d6 ≥ değer; tur başında). */
  recharge?: number;
  /** Günlük kullanım havuzu (Protective Magic 3/Day): havuz kimliği ve kullanım. */
  pool?: string;
  uses?: number;
  /** Save (`counterspell`: hedefin; `gaze`: tetikleyenin) ve DC (canavarda sabit; karakterde büyü DC'si). */
  save?: Ability;
  dc?: number;
  condition?: string;
  /** Menzil (ft). */
  rangeFt?: number;
  /** Bu büyülerin hasarını keser (Shield → `spells:magic-missile`). */
  blocks?: string[];
}

export interface Spell {
  /** Sabit kimlik (değişmez; Dungeondex vb. açıklamalar buna bağlanır). */
  id: string;
  /** SRD 5.2.1 karşılığı: `<dosya>:<kimlik>` (data/srd/<dosya>.json). */
  srd: string;
  name: string;
  level: number;
  /** Büyü yapma süresi (SRD 5.2.1 Casting Time): eylem, bonus eylem veya tepki. */
  castingTime: 'action' | 'bonus' | 'reaction' | 'ritual';
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
  /** Sabit kimlik (değişmez; Dungeondex vb. açıklamalar buna bağlanır). */
  id: string;
  /** SRD 5.2.1 karşılığı: `<dosya>:<kimlik>` (data/srd/<dosya>.json). */
  srd: string;
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
  /** Alan (Görev R4): verilmezse save'li saldırının metninden ayrıştırılır (`rules/areaParse.ts`). */
  area?: import('../rules/areaParse').AttackArea;
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

/** TR/EN metin (Görev E1). */
export interface LocalText { tr: string; en: string }
/** Alt sınıf özelliğinin oyundaki durumu: çalışır, planlanan sistemi bekliyor, savaş dışı (anlatı), çalışmıyor. */
export type SubclassStatus = 'calisir' | 'planli' | 'hikaye' | 'calismiyor';
export const SUBCLASS_STATUSES: SubclassStatus[] = ['calisir', 'planli', 'hikaye', 'calismiyor'];
/** Jenerik alt sınıf şemasında bir özellik (data/subclasses.json ve dış içerik paketleri). */
export interface SubclassFeatureDef {
  id: string;
  level: number;
  name: LocalText;
  description: LocalText;
  status: SubclassStatus;
  /** Mekanik: data/class-features.json özelliğiyle aynı biçim; yoksa özellik çalışmaz. */
  effect?: FeatureMechanic;
}
/** Jenerik alt sınıf (Görev E1). `srd` yalnızca SRD alt sınıflarında; `pack` dış içerik paketinin kimliği. */
export interface SubclassDef {
  id: string;
  class: string;
  srd?: string;
  pack?: string;
  name: LocalText;
  role: LocalText;
  features: SubclassFeatureDef[];
}

export type FeatureType = 'passive' | 'resource' | 'action' | 'bonus' | 'reaction' | 'free';
export type FeatureStatus = 'ok' | 'partial' | 'none' | 'missing';

/** Bir sınıf özelliğinin oyundaki mekaniği (data/class-features.json). */
export interface FeatureMechanic {
  type: FeatureType;
  status: FeatureStatus;
  /** Pasif sayının türü. */
  stat?: 'attacksPerAction' | 'sneakAttackDice' | 'speed' | 'unarmoredDefense' | 'expertise' | 'spellcasting' | 'featSlot' | 'weaponMastery'
    | 'saveAdvantage' | 'classSkills' | 'frenzy' | 'martialArts' | 'critOn' | 'saveProficiency';
  /**
   * Görev F: motorun baktığı pasif işaret (`Combatant.traits`): evasion, elusive, reliable-talent, studied-attacks,
   * survivor, precise-hunter, colossus-slayer… Anlamı ilgili kural modülünde.
   */
  trait?: string;
  /** Görev F: oyuncunun seçtiği seçenek (Hunter's Prey, Defensive Tactics): her biri bir işaret; `default` seçilmediyse. */
  options?: Array<{ id: string; trait: string }>;
  default?: string;
  value?: number;
  /** Değer SRD tablosunun bu sütunundan ("Sneak Attack" → "3d6" → 3). */
  column?: string;
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
  /** Rage: direnç türleri, hasar bonusunun SRD tablo sütunu, Strength avantajı. */
  rage?: { resist: string[]; damageColumn: string; strAdvantage?: boolean };
  /** classSkills (Primal Knowledge): Rage sürerken STR ile yapılabilen beceriler. */
  skills?: string[];
  /** weaponMastery: yalnızca yakın dövüş silahları seçilebilir (Barbarian). */
  melee?: boolean;
  /** weaponMastery: uzun dinlenmede değiştirilebilen seçim sayısı (1) ya da hepsi. */
  swap?: number | 'all';
  /** Her zaman hazır büyüler (seviye → büyü adları; hazır büyü sayısına girmez): Divine Smite, yemin büyüleri. */
  alwaysPrepared?: Record<string, string[]>;
  /** featSlot'a feat yerine seçilebilen seçenek (Blessed Warrior: başka sınıf listesinden cantrip). */
  alternatives?: FeatureAlternative[];
  /** Martial Arts (Görev P-Monk): Monk silahları (basit yakın dövüş, Light yakın dövüş martial), bonus eylemle Unarmed Strike. */
  martialArts?: { simpleMelee: boolean; martialLight: boolean; bonusStrike: boolean };
  /** Focus ile yapılan bonus eylemler (Flurry of Blows: `strikes` Unarmed Strike; diğerleri `actions` eylemleri). */
  focusActions?: FocusAction[];
  /** İnisiyatifte kaynak doldurma ve iyileşme (Uncanny Metabolism): doldurulan kaynak, zar sütunu (+ seviye HP). */
  metabolism?: { refill: string; dieColumn: string };
  /** Tepkiyle hasar azaltma (Deflect Attacks): zar + DEX + seviye, bu hasar türlerinde. */
  deflect?: { dice: string; types: string[]; redirect?: { resource: string; dieCount: number; save: Ability } };
  /** Düşme hasarı azaltma: seviye × bu sayı (Slow Fall). */
  fallReduction?: number;
  /** İsabetten sonra kaynakla durum (Stunning Strike): hedef save'i, DC yeteneği, durum. */
  stunningStrike?: { save: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'; dcAbility: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'; condition: string };
  /** Flurry isabetindeki teknik seçenekleri (Open Hand Technique). */
  openHand?: Array<'addle' | 'push' | 'topple'>;
  /** Tepki (Görev R1): tetik ve etki (`ReactionMechanic`). */
  reaction?: ReactionMechanic;
  /** Savaşta kullanılan özellik (`use_feature` komutu): iyileştirme havuzu ya da süren güçlendirme. */
  effect?: FeatureEffect;
  /** Koşul: ağır zırh yok / zırh ve kalkan yok (hız); `attackAction` Attack eylemi sürerken ya da başlamadan (Sacred Weapon). */
  when?: 'noHeavyArmor' | 'noArmorNoShield' | 'attackAction';
  note?: string;
}

export interface FocusAction {
  id: string;
  name: string;
  /** Bonus eylemle yapılan Unarmed Strike sayısı (Flurry of Blows). */
  strikes?: number;
  /** Birlikte yapılan eylemler (Patient Defense: Disengage + Dodge). */
  actions?: Array<'disengage' | 'dodge' | 'dash'>;
}

export interface FeatureAlternative {
  id: string;
  name: string;
  /** Seçilen cantrip sayısı ve listesi (büyü sınıf kodu: Clr…). */
  cantrips: number;
  spellList: string;
}

export type FeatureEffect =
  /** Havuzdan iyileştirme (Lay On Hands): dokunuş; `cureCost` puanla `cures` durumlarından biri kalkar. */
  | { kind: 'healPool'; touch: boolean; cureCost: number; cures: string[] }
  /** Kendine süren güçlendirme (Sacred Weapon): yakın dövüş silah saldırısına yetenek bonusu, Radiant hasar. */
  | { kind: 'buff'; attackBonusAbility: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'; min: number; radiant: boolean; rounds: number }
  /** Kendine geçici HP (Tireless; Görev F): zar + yetenek değiştiricisi (en az `min`). */
  | { kind: 'tempHp'; dice: string; ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'; min: number }
  /** Kendine durum (Nature's Veil; Görev F): sonraki turunun sonuna dek. */
  | { kind: 'condition'; condition: string; until: 'nextTurnEnd' };

export interface ResourceDef {
  name: string;
  /** Kaynağı veren özellik(ler): `sınıf:özellik`. */
  feature: string | string[];
  uses: { column?: string; byLevel?: Record<string, number>; perLevel?: number; abilityMod?: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'; min?: number; fixed?: number; proficiency?: boolean };
  /** Yenilenme: kısa/uzun dinlenme ya da tur başı; "all" hepsi, sayı o kadar. `shortFrom`: kısa dinlenme bu seviyeden. */
  recharge: { short?: 'all' | number; long?: 'all' | number; turn?: 'all' | number; shortFrom?: number };
  /** Kaynak kaldıkça bu büyü slotsuz yapılır (Favored Enemy → Hunter's Mark). */
  freeSpell?: string;
  /** Tür kaynağı (Görev R4; Dragonborn Breath Weapon): sınıftan değil bu türden gelir. */
  race?: string;
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
  /** Great Weapon Fighting: iki elle tutulan yakın dövüş silahının hasar zarlarında en düşük değer. */
  minDamageDie?: number;
  /** Two-Weapon Fighting: Light ek saldırısının hasarına yetenek değiştiricisi eklenir. */
  offhandModifier?: boolean;
  note?: string;
}

export type MasteryId = 'cleave' | 'graze' | 'nick' | 'push' | 'sap' | 'slow' | 'topple' | 'vex';

/** Silah ustalığının (Weapon Mastery) oyundaki durumu ve parametreleri (data/class-features.json "masteries"). */
export interface MasteryMechanic {
  status: FeatureStatus;
  /** Push: itme (ft) ve en büyük boyut; Slow: hız azalması (ft). */
  feet?: number;
  maxSize?: CreatureSize;
  /** Topple: save yeteneği. */
  save?: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
  /** Yapay zekânın silah seçiminde ortalama hasara eklediği öncelik. */
  ai?: number;
  note?: string;
}

/** SRD silah tablosu kaydı (data/srd/weapons.json). */
export interface SrdWeapon {
  id: string;
  name: string;
  category: string;
  damage: string;
  damageType: string;
  properties: string[];
  mastery: string;
  source: { page: number; section: string };
}

/** SRD silah ustalığı metni (data/srd/weapons.json "masteries"). */
export interface SrdMastery {
  id: MasteryId;
  name: string;
  text: string;
  source: { page: number; section: string };
}

export interface ClassMechanics {
  resources: Record<string, ResourceDef>;
  features: Record<string, FeatureMechanic>;
  feats: Record<string, FeatMechanic>;
  masteries: Record<string, MasteryMechanic>;
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
