import type { Skill } from '../rules/skills';
import type { Ability } from '../rules/abilities';
import type { AreaShape } from '../rules/area';

export type Size = 'S' | 'M';

/** Türün alt seçeneği: Tiefling mirası, Dragonborn ejderha türü gibi. */
/** Soydan gelen büyü (Görev K3): `level` karakter seviyesi eşiği; seviyeli büyüde `resource` uzun dinlenmede dolan slotsuz kullanım. */
export interface LineageSpell {
  name: string;
  level: number;
  resource?: string;
}

/** Goliath Giant Ancestry seçeneği (Görev K3). */
export type GiantAncestry = 'cloud' | 'fire' | 'frost' | 'hill' | 'stone' | 'storm';

export interface Lineage {
  id: string;
  name: string;
  /** Kuyruk AS1a: görünen ad (TR/EN); yoksa `name`. */
  ad?: LocalText;
  /** Seçim kartında, özet panelinde ve karakter kartında: yalnızca bu seçeneği ayıran özellikler (Görev K3). */
  summary: LocalText;
  /** Bu seçimden gelen hasar dirençleri. */
  resistances: string[];
  /** Türün karanlık görüşünün yerine (Drow 120 ft). */
  darkvision?: number;
  /** Türün hızının yerine (Wood Elf 35 ft). */
  speed?: number;
  /** Soy büyüleri (Elven Lineage, Gnomish Lineage, Fiendish Legacy). */
  spells?: LineageSpell[];
  /** Goliath: Giant Ancestry seçeneği (kaynak `giantAncestry`). */
  giant?: GiantAncestry;
  /** Oyunda olmayan ya da kısmi soy özellikleri (yalnızca ⓘ ipucunda). */
  extras?: Array<{ name: LocalText; status: 'partial' | 'none'; note: LocalText }>;
  /**
   * Kuyruk AS1b: etkinin oyundaki durumu (savaş sürümü ≥ 71): `calisir`, `kismi` (not `data/alt-soy-metin.json` `kismiNot`) ya da
   * `planli` (yalnız açıklama). Buff/debuff metinleri ana parçayı şişirmemek için `data/alt-soy-metin.json`'da (oluşturucu okur).
   */
  durum?: 'planli' | 'calisir' | 'kismi';
  /** Kuyruk AS1b (savaş sürümü ≥ 71): alt soyun mekaniği (veriden; kodda alt soy adıyla koşul yok). */
  etki?: LineageEtki;
}

/**
 * Kuyruk AS1b: alt soy mekaniği. Statik kısım karakter türetmesine (`rules/lineageMods.ts`), `efekt` savaş başında süren etkiye
 * (`battle/soyEtki.ts`; alanlar `ActiveEffect` alanlarıdır), `harita` haritaya bağlı koşullara (savaş başında çözülür),
 * `ozellik` kullanılabilir özelliğe dönüşür.
 */
export interface LineageEtki {
  /** Yetenek skoru artışı (geçmiş bonusuna ek; tavan 20). */
  yetenek?: Partial<Record<Ability, number>>;
  /** Hız (ft) farkı. */
  hiz?: number;
  /** Kurtarma zarı sabit farkı. */
  kurtarma?: Partial<Record<Ability, number>>;
  /** Beceri bonusu (negatif: ceza). */
  beceri?: Partial<Record<Skill, number>>;
  /** Zırhsızken AC farkı. */
  zirhsizAc?: number;
  /** Ek hasar direnci. */
  direnc?: string[];
  /** Karanlık görüş (ft; türünkinin yerine). */
  karanlikGorus?: number;
  /** Ağır zırhın Güç şartı hız cezası yok sayılır. */
  agirZirhHizCezasiYok?: boolean;
  /** Taşıma kapasitesi çarpanı. */
  tasima?: number;
  /** Savaşta süren etki alanları (`ActiveEffect`): saveDis, checkDis, saveDisVs, checkDisSkill, concDis, fallMult, … */
  efekt?: Record<string, unknown>;
  /** Haritaya bağlı koşullar (savaş başında): gün ışığında saldırı dezavantajı, iç mekânda saldırı ve inisiyatif farkı. */
  harita?: { gunisigiSaldiriDez?: boolean; icMekanSaldiri?: number; icMekanInisiyatif?: number };
  /** Kullanılabilir özellik (uçuş ilkeli parametreleriyle). */
  ozellik?: { anahtar: string; ad: LocalText; tur: 'bonus' | 'action' | 'free'; kullanim: 'pb'; zirhYok?: Array<'medium' | 'heavy'>; ucus: Record<string, unknown> };
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
  /**
   * Kuyruk AS1a: soyu isteğe bağlı tür (Dwarf, Halfling, Orc, Human): `defaultLineage` yoktur; eski kayıt soysuz kalır
   * (`migrateLineages` atamaz, bir kerelik bildirim), seçilene dek soy etkisi yoktur.
   */
  lineageOptional?: boolean;
  traits: string;
  /** Görev TE99 (SRD 5.2.1 s. 85–86 Skillful, Keen Senses): türden beceri yetkinliği (sayı, isteğe bağlı liste). */
  skillChoice?: { count: number; from?: string[] };
  /** Görev TE99 (SRD 5.2.1 s. 86 Versatile): türden ek bir Origin feat'i. */
  originFeat?: boolean;
  /** Kuyruk K20: ev kuralı türü (Celestial): bu ev kuralı açık değilse oluşturucuda seçilemez (`data/ev-kurallari.json`). */
  evKurali?: string;
  /** Kuyruk K20: hikâye yurdu ve oyuna başladığı bölge (kefaret yolu henüz yok). */
  yurt?: string;
  baslangic?: string;
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
  /** Görev TE99 (SRD 5.2.1 sınıf tablosu "Tool Proficiencies"): savaşta kullanılan alet yetkinliği (Rogue: Thieves' Tools). */
  tools?: string[];
  /** Simple sınıfların proficient olduğu martial silah özellikleri (Rogue: finesse/light, Monk: light). */
  martialWeaponProperties: Array<'finesse' | 'light'>;
  /** Görev K6: büyü kitabı (Wizard): 1. seviyede `initial`, sonraki her seviyede `perLevel` büyü. */
  spellbook?: { initial: number; perLevel: number };
  /** Görev K4: zırh eğitimi (SRD sınıf tablosu "Armor Training"); `shield` kalkan. */
  armorTraining: Array<'light' | 'medium' | 'heavy' | 'shield'>;
  /** 1. seviyede seçilen beceri yetkinlikleri (SRD 5.2.1 sınıf tablosu): sayı ve liste ya da "any". */
  skillChoices: { count: number; from: Skill[] | 'any' };
}

export type ArmorType = 'none' | 'light' | 'medium' | 'heavy';

export interface Armor {
  name: string;
  baseAc: number;
  type: ArmorType;
  /** Görev K5: ağırlık (lb; SRD Armor tablosu). */
  weight?: number;
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
  /** Kuyruk 19: cephane türü (arrow, bolt, bullet, needle) ve "binekteyken tek el" (Lance). */
  ammo?: string;
  twoHandedUnlessMounted?: boolean;
  /** Görev K5: ağırlık (lb; SRD Weapons tablosu). */
  weight?: number;
}

export interface SpellUpcast {
  dice?: string;
  rays?: number;
  targets?: number;
  hp?: number;
  duration?: boolean;
  other?: boolean;
  /** Görev K9b: alan yarıçapı slot başına artar (Fog Cloud +20 ft). */
  radiusFt?: number;
  /** Görev K9b: saldırı sonrası patlamanın zarı slot başına artar (Ice Knife cold +1d6). */
  burstDice?: string;
  /** Görev K9b: slot eşiğinden itibaren güçlendirme bonusu (Magic Weapon: 3 → +2, 6 → +3). */
  bonusBySlot?: Record<string, number>;
  /** Görev K9b: slot eşiğinden itibaren süre (tur) ve konsantrasyon (Bestow Curse: 4 → 10 dk, 5 → 8 saat konsantrasyonsuz). */
  durationBySlot?: Record<string, { rounds: number; concentration?: boolean }>;
  /** Motor bu etkiyi uyguluyor. */
  applied?: boolean;
}

export interface SpellMechanics {
  /**
   * `mark`: hedefi işaretler, işaretliye her isabette ek hasar (Hunter's Mark). `smite`: bu tur yakın dövüş silahıyla
   * vurulan hedefe isabetin ek hasarı (Divine Smite; kritikte zarlar iki kat). `buff`: büyücüye (`selfBuff`) ya da
   * konsantrasyon hedefine (`ward`) süren etki (Görev P-Paladin).
   */
  kind: 'attack' | 'save' | 'auto' | 'heal' | 'sleep' | 'utility' | 'mark' | 'smite' | 'buff' | 'effect' | 'summon' | 'teleport' | 'cure' | 'revive' | 'zone' | 'dispel';
  /** Görev S1, `kind: cure`: dosttan kaldırılan durumlar (ilk bulunan; Lesser Restoration). */
  cures?: string[];
  /** Görev S1, `kind: revive`: `stabilize` 0 HP'deki dostu stabil eder (Spare the Dying), `revive` ölü dostu 1 HP ile kaldırır (Revivify). */
  revive?: 'stabilize' | 'revive';
  /** Görev S1, `kind: teleport`: büyücü görebildiği boş bir altıgene ışınlanır (Misty Step); menzil ft. */
  teleport?: { rangeFt: number; sight: boolean; trees?: boolean; companion?: boolean; reuse?: boolean };
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
  /** Görev WIZARD: Chromatic Orb: aynı iki hasar zarında başka yaratığa sıçrar (slot seviyesi kadar). */
  leap?: boolean;
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
  selfBuff?: { attackBonus?: number; damageBonus?: number; extraDamage?: string; damageType?: string; rounds: number;
    anyAttack?: boolean; withinFt?: number; extraTypes?: string[]; upcastDice?: string };
  /** Süren etki (Görev R2): hedeflere konan zar eklentisi, hasar azaltma, geçici HP, tur atlatma (`EffectSpec`). */
  effect?: EffectSpec;
  /** Smite'ın hedefte bıraktığı süregelen hasar (Searing Smite: her tur başı zar, ardından save; başarıda biter). */
  ongoing?: { dice: string; type: string; save: Ability; rounds: number; icon?: string; escape?: boolean };
  /** Tepki büyüsü (Görev R1): tetik ve etkisi; `castingTime: reaction` olanlar motorun tetiğiyle yapılır. */
  reaction?: ReactionMechanic;
  /** Oyunda çalışmıyorsa nedeni (oluşturucu ve savaş "çalışmıyor" gösterir). */
  unsupported?: string;
  /** Görev B1: silahla büyü saldırısı (True Strike): büyü yeteneğiyle bir silah saldırısı; cantrip kademesine göre ek Radiant zarı. */
  weaponStrike?: { extra: string[] };
  /** Görev B1, `kind: heal`: en çok kaç hedef (Mass Healing Word 6). */
  healTargets?: number;
  /** Görev B1, `kind: attack`: ıskada hasarın yarısı (Acid Arrow). */
  halfOnMiss?: boolean;
  /**
   * Görev B1: isabetten (attack) ya da hasardan (auto) sonra hedefte kalan etki: gecikmeli hasar (Acid Arrow; hedefin
   * sonraki turunun sonunda), ya da `save` başarısızsa saldırıları dezavantajlı (Heat Metal; büyücünün sonraki turuna dek).
   */
  afterHit?: { save?: Ability; attackDis?: { melee?: boolean; single?: boolean }; untilSourceTurn?: boolean; grants?: string[]; checkDis?: Ability[]; delayed?: { dice: string; type: string };
    /** Görev B4 (Starry Wisp): hedef görünmez olamaz ve ışık yayar (altıgen). */
    revealed?: boolean; light?: number; /** Kuyruk K67a */ lightDim?: number; untilSourceTurnEnd?: boolean };
  /** Görev B1: verilen hasarın bu oranı kadar büyücü iyileşir (Vampiric Touch 0,5). */
  drain?: number;
  /**
   * Görev B1: süreli tekrar (Heat Metal, Call Lightning, Vampiric Touch, Gust of Wind): konsantrasyon sürerken sonraki
   * turlarda slotsuz tekrar (`spell_followup`); maliyet eylem ya da bonus eylem, hedef aynı (`same`) ya da yeni (`any`).
   */
  repeat?: { cost: 'action' | 'bonus'; target: 'same' | 'any' | 'enemy'; direction?: boolean; moveZoneFt?: number; point?: boolean; moveFt?: number;
    /** A1: bu büyüye karşı save'i başaran yaratık yeniden hedeflenemez (Eyebite). */
    noRetarget?: boolean };
  /**
   * Kuyruk K68b (sürüm 52, Call Lightning): döküm yerinin üstünde sabit fırtına bulutu (silindir). Şimşek noktası bulutun
   * altında (yatayda `radiusFt` içinde, irtifası tabandan alçak); taban açık gökte `openBaseFt`, tavanlıda tavan −
   * `ceilingGapFt`; tavan − büyücü boyu `minRoomFt`'ten azsa yapılamaz (`src/battle/cloud.ts`).
   */
  cloud?: { radiusFt: number; heightFt: number; openBaseFt: number; ceilingGapFt: number; minRoomFt: number };
  /** A1: menzili "Self" olup etkisi bir yaratığı hedefleyen büyü (Eyebite: 60 ft içinde görülen yaratık). */
  targetFt?: number;
  /** Görev B1, smite: isabette save; başarısızsa süregelen etki (`ongoing`) ve süresince durumlar (Ensnaring Strike: Restrained). */
  smiteSave?: { ability: Ability; grants: string[]; largeAdvantage?: boolean };
  /**
   * Görev B3: alan save'inde başarısız olana süren etki (Fear: kaçış; Hypnotic Pattern: hasarla biten Charmed +
   * Incapacitated, hız 0). `grants` varsa büyünün düz `conditions`'ı kullanılmaz (durumlar etkiyle gelir ve gider).
   */
  /** Kuyruk A2 (sürüm 30+): seçilen duruma göre başarısızlığın süren etkisi (Eyebite: Asleep hasarla biter, Panicked kaçış + Dash); `grants` durumu etkiye bağlar. */
  choiceEffects?: Record<string, Partial<EffectSpec> & { grants?: string[]; breakOnDamage?: boolean; command?: string[]; commandPersist?: boolean; fleeDash?: boolean; rounds?: number }>;
  failEffect?: Partial<EffectSpec> & { grants?: string[]; delayed?: { dice: string; type: string }; repeatFailDamage?: { dice: string; type: string }; compel?: boolean;
    /** Kuyruk 19: Contagion: tur sonu save'i N başarıda biter, N başarısızlıkta kalıcı (sayaç); seçilen yetenekte save dezavantajı; durumu kaldıran etkiye CON save. */
    repeatTally?: number; saveDisChoice?: boolean; stubborn?: boolean; confused?: boolean; noBonus?: boolean;
    attackDis?: Record<string, never>; checkDis?: Array<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'>; repeatSaveUnseen?: boolean; untilSourceTurnEnd?: boolean;
    /** Kuyruk G6 (sürüm 43): başarısız save'de yaratık elindeki silahları düşürür (Fear; el modeli `dropEvents`). */
    dropHeld?: boolean;
    /** Kuyruk K61 (sürüm 44): üç başarısızlıkta etkinin verdiği durum bu olur (Flesh to Stone: Restrained → Petrified). */
    tallyFailGrants?: string[] };
  /**
   * Kuyruk 19: anahtar `spellsK19` açıkken mekaniğin üstüne yazılan alanlar (tam SRD hâli; eski sürümde eski mekanik).
   */
  upgrade?: Partial<SpellMechanics>;
  /** Kuyruk A4: kural sürümü 32+ savaşta mekaniğin üstüne yazılan alanlar (kısmi büyülerin tamamlanmış hâli). */
  a4?: Partial<SpellMechanics>;
  /** Kuyruk A6: kural sürümü 35+ savaşta (a4'ten sonra) mekaniğin üstüne yazılan alanlar (küçük kısmilerin kapatılması). */
  a6?: Partial<SpellMechanics>;
  /** Kuyruk A7 (sürüm 36) ve A8 (sürüm 37): aynı biçimde sonraki tamamlamalar. */
  a7?: Partial<SpellMechanics>;
  a8?: Partial<SpellMechanics>;
  /** Kuyruk S1 (sürüm 40): sığmayan parçaların kapatılması (aynı biçimde, a8'den sonra). */
  s1?: Partial<SpellMechanics>;
  /** Kuyruk S2 (sürüm 41): kalan sığmayan parçalar. */
  s2?: Partial<SpellMechanics>;
  /** Kuyruk G6 (sürüm 43): Game Master notlu büyülerin savaş kolları (Charm Person taraf değiştirme, Fear eşya düşürme). */
  g6?: Partial<SpellMechanics>;
  /** Kuyruk K62 (sürüm 46): SRD uyumu 2 (Wall of Ice panelleri ve perdesi, Forcecage, Delayed Blast Fireball). */
  k62?: Partial<SpellMechanics>;
  /** Kuyruk K63 (sürüm 47): Truesight (True Seeing) ve görsel yanılsama bayrağı. */
  k63?: Partial<SpellMechanics>;
  /** Kuyruk K64a (kural sürümü 48): ele geçirme (Protection from Evil and Good engeli, Dispel Evil and Good Break Enchantment). */
  k64?: Partial<SpellMechanics>;
  /** Kuyruk K65a (kural sürümü 49): serbest şekil alan (Fire Storm). */
  k65?: Partial<SpellMechanics>;
  /** Kuyruk K66a (kural sürümü 50): Earthquake yarıkları (alanda `fissures`). */
  k66?: Partial<SpellMechanics>;
  /** Kuyruk K67a (kural sürümü 51): loş ışık (Light, Continual Flame, Faerie Fire, Daylight; Wall of Fire ışıksız). */
  k67?: Partial<SpellMechanics>;
  /** Kuyruk K68a (sürüm 52): dikey geometri (Sleet Storm 40 ft silindir, Fog/Stinking Cloud tepe = yarıçap). */
  k68?: Partial<SpellMechanics>;
  /** Kuyruk K70 (sürüm 54): küçük SRD farkları (Flesh to Stone Construct, Disintegrate duvarı). */
  k70?: Partial<SpellMechanics>;
  /** Kuyruk Y1 (sürüm 55): K70 artıkları (Dispel Magic bağışıklığı, Disintegrate küresi). */
  y1?: Partial<SpellMechanics>;
  /** Kuyruk K73c (sürüm 64): havada merkezli silindir yüksekliği, Call Lightning fırtına devralma. */
  k73c?: Partial<SpellMechanics>;
  /** Kuyruk MB7 (kural sürümü 70+): Phantom Steed çağırma (`data/summons.json` `phantom-steed`). */
  mb7?: Partial<SpellMechanics>;
  /** Mekanik matris düzeltmeleri (kural sürümü 83+; harita/belgeler/MEKANIK-MATRIS.md): bloktaki alanlar üstüne yazılır. */
  m83?: Partial<SpellMechanics>;
  /** Gece kuyruğu Aşama 3 (kural sürümü 102, BUYU-TAM): SRD tam tarama düzeltmeleri (mekaniğin üstüne yazılır). */
  b102?: Partial<SpellMechanics>;
  /** Görev KARAR104 (kural sürümü 104): bekleyen kararlar (Storm of Vengeance tur aşamaları); mekaniğin üstüne yazılır. */
  k104?: Partial<SpellMechanics>;
  /** BUYU-TAM (102): çok hedefli iyileştirmede hedefler menzil içinde merkezli bu yarıçaplı kürede (Mass Cure Wounds 30 ft). */
  healSphereFt?: number;
  /** BUYU-TAM (102): büyünün menzili (ft) bu değerle değişir (Etherealness yukarı slot hedefleri "within 10 feet"). */
  castRangeFt?: number;
  /**
   * Control Water girdabı (kural sürümü 84, Game Master anahtarı `controlWaterWhirlpool`; `src/battle/girdap.ts`): anahtar açıkken
   * yapım bu bloğun girdabıyla (`whirlpool`); kapalıyken ve 83 ve altında eski mekanik (`upgrade`, `spellsK19`).
   */
  k84?: Partial<SpellMechanics>;
  whirlpool?: boolean;
  /**
   * Mekanik matris B14 (yalnız `m83` bloğunda; Weird): alan yalnız düşmanları etkiler ("Each creature of your choice in a
   * 30-foot-radius Sphere"); büyünün `area.targets` alanını ezer.
   */
  areaTargets?: 'enemies';
  /**
   * Mekanik matris B15 (yalnız `m83` bloğunda; Compulsion): büyünün alan tanımını ezer (SRD "Range: 30 feet … Each
   * creature of your choice that you can see within range": büyücü merkezli 30 ft yayılım). Okuma `spellAreaAt`.
   */
  area83?: NonNullable<Spell['area']>;
  /**
   * Mekanik matris B18 (yalnız `m83` bloğunda; Shining Smite): isabet alan hedef büyü sürdükçe Invisible'dan yararlanamaz
   * ("it can't benefit from the Invisible condition"): hedefe konsantrasyona bağlı `revealed` etkisi.
   */
  smiteReveal?: boolean;
  /** Mekanik matris B08 (yalnız `m83` bloğunda; Sacred Flame): hedefin DEX save'ine siper bonusu eklenmez. */
  ignoresCover?: boolean;
  /**
   * Kuyruk K73c (sürüm 64+, Görev 3): anlık silindir büyüsünün yüksekliği (ft; veride biçim küre). Havada merkezlenince
   * dairesi merkezde, silindir aşağı uzanır (`src/battle/airArea.ts`). Yerde merkezliyken kullanılmaz.
   */
  cylinderFt?: number;
  /**
   * Kuyruk K73c (sürüm 64+, Görev 4; Call Lightning): büyücü açık gökte bir fırtınanın içindeyse (harita kuralı `mapRule`
   * ya da `zoneSpells` büyülerinden birinin alanı) yeni bulut kurulmaz, fırtına devralınır (`src/battle/cloud.ts`).
   */
  stormTakeover?: { mapRule: string; zoneSpells: string[] };
  /** Kuyruk K65a: serbest şekil (`src/battle/freeShape.ts`): en çok altıgen, menzil her altıgende, görüş ilk altıgende. */
  /** Kuyruk K65c: serbest duvar yolunun ek kuralları (her altıgen menzilde, ilk altıgen görüşte; Wind Wall'da yok). */
  pathRules?: { rangeAll?: boolean; sightFirst?: boolean };
  freeShape?: { maxHexes: number; rangeAll?: boolean; sightFirst?: boolean; maxByChoice?: Record<string, number>; defaultChoice?: string };
  /** Kuyruk K64a: ele geçirme kolunun açıklaması (bilgi; motor `src/battle/possession.ts`). */
  possession?: string;
  /** Kuyruk K64b: kurulumda kurulan koruma alanı (Magic Circle, Hallow; `src/battle/possession.ts` `executeSetupWard`). */
  setupWard?: { kind: 'circle' | 'hallow'; radiusFt: number; maxRadiusFt?: number; rangeFt: number; rounds?: number; types: string[]; reverse?: boolean; note?: string };
  /** Kuyruk K63 (sürüm 47): görsel yanılsama büyüsü; Truesight'lı hedef onun save'ini otomatik geçer (Phantasmal Force/Killer, Weird). */
  illusion?: boolean;
  /** Kuyruk K61 (sürüm 44): SRD uyumu 1 (Blade Barrier Force, Conjure Fey +1d12, Irresistible Dance, Flesh to Stone, Earthquake). */
  k61?: Partial<SpellMechanics>;
  /** Kuyruk K61: tek hedefli save büyüsünde başarılı save'in hafif etkisi (Flesh to Stone: hız 0, büyücünün sonraki turunun başına dek). */
  successEffect?: { speedZero?: boolean; icon?: string };
  /** Kuyruk G6: savaş büyü listesinde ve yapay zekâda yok (kartta savaş dışı + Game Master notu; Animal Shapes, Enhance Ability). */
  battleHidden?: boolean;
  /** Kuyruk A7: savaşta uygulanan kısmın yanında savaş dışı parça Game Master notu (kartta ve günlükte; BUYU-KISMI "tamam (GM notlu)"). */
  gmNoted?: boolean;
  /**
   * Kuyruk A6: SRD'nin oyuna sığmayan parçası (Game Master'a not: kartta ve günlükte). Büyü "tamam (sığmayan parça notlu)"
   * sayılır; satırı harita/belgeler/BUYU-SIGMAYAN.md'de.
   */
  sigmayan?: string;
  /** Kuyruk A4: işaret büyüsü hedefin seçilen yetenek kontrollerine dezavantaj verir (Hex). */
  markCheckDis?: boolean;
  /** Kuyruk A4: kısmi kalan ama eksik parçası savaş modelinin dışında olan (sosyal, nesne, düzlem, saatlik süre) kısım; denetimde "çalışır". */
  kapsamDisi?: string;
  /** Kuyruk 19: büyü süresince büyücünün bonus eylemle yapabildikleri (Conjure Woodland Beings: Disengage). */
  bonusGrant?: Array<'hide' | 'dash' | 'disengage'>;
  /** Kuyruk 19: `failEffect` yalnızca bu global anahtar açıkken (yeni eklenen etki; eski sürümde yok). */
  failEffectGate?: string;
  /** Kuyruk 19: save'i otomatik kaçıran yaratık türleri (Blight: plant). */
  autoFailTypes?: string[];
  /** Kuyruk K70 (sürüm 54): save'i otomatik başaran yaratık türleri, ilk save ve tur sonu save'leri (Flesh to Stone: construct). */
  autoSuccessTypes?: string[];
  /** Kuyruk K70 (sürüm 54): büyü hedef altıgenindeki bu büyülerin kuvvet yapısını anında yok eder (Disintegrate: Wall of Force). */
  destroysForce?: string[];
  /** Kuyruk Y1 (sürüm 55): bu büyünün alanı Dispel Magic ile kaldırılamaz (Wall of Force, Forcecage). */
  dispelImmune?: boolean;
  /** Kuyruk Y1 (sürüm 55): kürede (Resilient Sphere, `sealed`) hedefi içindekine zarar vermeden küreyi yok eder (Disintegrate). */
  destroysSphere?: boolean;
  /** Görev B3: Calm Emotions: alandaki dost Humanoid'lere Charmed/Frightened bağışıklığı, düşmanlara (save) duraksama. */
  calm?: boolean;
  /** Kuyruk A6: Calm Emotions'ta dostlar da save yapar; düşmanlar kayıtsızlaşır (`indifferentTo`). */
  calmSaveAll?: boolean;
  /** Kuyruk A6 (Produce Flame): `castOnly` büyü konsantrasyonsuz elde tutulur (bu kadar tur; yeniden yapınca eskisi biter). */
  held?: number;
  /** Kuyruk A6 (Call Lightning): fırtınalı haritada hasara eklenen zar (aynı zar boyu). */
  stormBonus?: string;
  /** Kuyruk A6 (Chromatic Orb): sıçrama hedefi komuttaki `targetIds` sırasıyla seçilir. */
  leapPick?: boolean;
  /** Kuyruk S1 (sürüm 40): sıçrama hedefi seçim istemiyle (komut sırası vermediyse). */
  leapAsk?: boolean;
  /** Kuyruk S1 (sürüm 40, Alter Self): sonraki turlarda `spell_followup` ile seçenek değiştirme. */
  swapChoice?: boolean;
  /** Kuyruk S1 (sürüm 40, Calm Emotions): dostlardaki Charmed/Frightened bastırılır (büyü bitince geri gelir). */
  calmSuppress?: boolean;
  /** Kuyruk S1 (sürüm 40, Plane Shift): büyücü ve en çok `max` istekli dost haritadan ayrılır (el ele: `linkFt`). */
  retreat?: { max: number; linkFt: number };
  /** Kuyruk S1 (sürüm 40, Magic Weapon): güçlendirme tek silaha (`cast_spell.choice` silah kimliği). */
  enchantOne?: boolean;
  /** Kuyruk S2 (sürüm 41): Heat Metal yalnız metal tutan/giyen hedefe; başarısız save'de bırakma seçeneği. */
  metalDrop?: boolean;
  /** Kuyruk S2: Flame Blade bırakılır, bonus eylemle yeniden çağrılır. */
  bladeRecall?: boolean;
  /** Kuyruk S2: büyü taşınmayan bir nesneye de yapılır (Enlarge/Reduce boyut, Levitate irtifa). */
  resizeObjects?: boolean;
  levitateObject?: boolean;
  /** Kuyruk S2: Phantasmal Force yanılsaması seçilen altıgende (hasar yalnız 5 ft içindeyken). */
  illusionAt?: boolean;
  /** Kuyruk S2: alandan altıgen çıkarılabilir (Plant Growth `cast_spell.excludeHexes`). */
  excludable?: boolean;
  /** Kuyruk S2: serbest duvar yolu (Wind Wall `cast_spell.targetHexes`, en çok N altıgen). */
  wallPath?: number;
  /** Kuyruk S2: Flaming Sphere engel/çukur ve yanıcı nesne tutuşturma. */
  sphereTerrain?: boolean;
  /** Kuyruk S1 (sürüm 40): alandaki nesneler parlar (Faerie Fire) / ateşli alanda yanıcı nesneler tutuşur (Meteor Swarm). */
  outlineObjects?: boolean;
  ignitesObjects?: boolean;
  /** Kuyruk A6: tek hedefli save büyüsünde de başarısızlığın süren etkisi (`failEffect`; Mind Spike yer bilgisi). */
  failEffectSingle?: boolean;
  /** Kuyruk A6: süren güç/ruh (`lingering: weapon`) sonraki turlarda bu kadar ft yer değiştirip yanındakine saldırır (yoksa 20). */
  lingerMoveFt?: number;
  /** Kuyruk A6 (Sleep): uyumayan (Elf) ya da Exhaustion'a bağışık yaratık save'i kendiliğinden başarır. */
  sleeplessPass?: boolean;
  /** Kuyruk A7: dokunulan dostun silahına güçlendirme (Magic Weapon); boş el gerekir (Flame Blade). */
  touchBuff?: boolean;
  freeHand?: boolean;
  /** Kuyruk A7 (Light, Continual Flame): altıgendeki nesneye ışık (yarıçap altıgen); `objectLightKeep` yeniden yapınca eskisi sürer. */
  objectLight?: number;
  /** Kuyruk K67a (sürüm 51): nesne ışığının ek loş halkası (Light, Continual Flame 4). */
  objectLightDim?: number;
  objectLightKeep?: boolean;
  /** Kuyruk A8 (Meteor Swarm): en çok bu kadar merkez (komutta `targetHexes`; her yaratık bir kez). */
  multiPoint?: number;
  /** Kuyruk A8 (Slow): hedefler bu boyda (ft) bir küpe sığmalı. Slow'lanan somatik büyüde başarısızlık (`slowed`). */
  cubeFt?: number;
  /** Kuyruk A6 (Gust of Wind): alan save'inden sonra alanın altıgenlerinde süren alan (konsantrasyon; yeniden esintide yerini alır). */
  lingerZone?: ZoneSpec;
  /** Kuyruk A6: lanet büyüsü (Hex, Bestow Curse); Remove Curse `curseAll` ile bütün lanetleri kaldırır. */
  curse?: boolean;
  curseAll?: boolean;
  calmIndifferent?: boolean;
  /** Görev B2: kalıcı zemin etkisi ya da geçici engel (`ZoneSpec`); alan büyünün `area`'sından. */
  zone?: ZoneSpec;
  /**
   * Görev B4: savaşta mekanik karşılığı yok (kartta "savaş dışı"; yapınca günlüğe `gmNote`, Game Master uygular).
   */
  offCombat?: boolean;
  gmNote?: string;
  /** Görev K9a: Game Master notunun İngilizcesi. */
  gmNoteEn?: string;
  /**
   * Görev B4 (Flame Blade): yapmak saldırı içermez (yalnızca konsantrasyon ve büyücüde `selfLight` ışığı); saldırı
   * `repeat` ile (`spell_followup`), aynı turda da.
   */
  castOnly?: boolean;
  selfLight?: number;
  /** Kuyruk K67b (sürüm 51): büyücüdeki ışığın ek loş halkası (Flame Blade, Produce Flame; altıgen). */
  selfLightDim?: number;
  /** Kuyruk K67b (sürüm 51, Dancing Lights): en çok N ayrı ışık noktası (`cast_spell.targetHexes`; `choice: 'birlesik'` tek biçim). */
  lightPoints?: number;
  /** Kuyruk K67b (sürüm 51, Shining Smite): konsantrasyon hedefinin saçtığı parlak ışık (altıgen). */
  wardLight?: number;
  /** Görev B4 (Sorcerous Burst): seçilebilen hasar türleri (komutta `choice`; yoksa `damageType`). */
  damageChoices?: string[];
  /** Görev SORCERER: patlayan zar (Sorcerous Burst): bu yüz gelince ek zar, en çok büyü yeteneği değiştiricisi kadar. */
  explode?: number;
  /** CILA (Blindness/Deafness): seçilebilen durumlar (komutta `choice`; yoksa `conditions`). */
  conditionChoices?: string[];
  /** Kuyruk 19: Greater Restoration: kaldırılacak etki seçimi (`gr-*`, Charmed, Petrified; anahtar spellsK19). */
  restoreChoices?: string[];
  /** Kuyruk 19: Mislead: yanılsama ikizi (alan; Magic eylemiyle 2 × hız taşınır, `repeat.moveZoneFt: 0`). */
  decoy?: boolean;
  /** Kuyruk 19: Telekinesis tam hâli (telekinesis.ts). */
  telekinesis?: boolean;
  /** Kuyruk 19: Dispel Evil and Good: Break Enchantment / Dismissal (spell_followup, Magic eylemi, büyü biter). */
  endFunctions?: boolean;
  /** Kuyruk 19: seçilen yetenek (Contagion: save dezavantajı). */
  abilityChoices?: string[];
  /**
   * Kuyruk 19: ikinci hasar türü (SRD: Ice Storm 2d10 Bludgeoning + 4d6 Cold; Flame Strike 5d6 Fire + 5d6 Radiant).
   * Anahtar `spellsK19` açıkken ana hasar `damage`/`damageType` yerine `split[0]`, ayrıca `split[1]`; yukarı slot zarı
   * her parçanın kendi `upcast`'i.
   */
  split?: Array<{ dice: string; type: string; upcast?: string }>;
  /** Kuyruk 19: güçlendirme büyüsünün büyücüye bağlı yürüyen alanı (Conjure Minor Elementals; `anchorSelf` yarıçap). */
  buffZone?: ZoneSpec;
  /** Kuyruk 19: alan büyüsünün ardından alanda kalan zemin etkisi (Ice Storm: zorlu arazi; anahtar `spellsK19`). */
  aftermath?: ZoneSpec;
  /** Kuyruk 19: harita dönüştüren büyü (Passwall, Stone Shape, Control Water; `src/battle/terraform.ts`). */
  terraform?: { mode: 'passwall' | 'stoneShape' | 'controlWater' };
  /** Kuyruk 19: alan büyüsü gaz/buhar bulutlarını dağıtır (Gust of Wind). */
  disperses?: boolean;
  /**
   * Görev B5 (Ice Knife): saldırıdan sonra (isabet ya da ıska) hedefin altıgeni ve çevresinde save'li hasar (yarı yok).
   */
  burst?: { save: Ability; damage: string; damageType: string };
  /** Görev B5, `kind: dispel`: yalnızca lanetler (Remove Curse); yoksa bütün süren büyü etkileri (Dispel Magic). */
  curseOnly?: boolean;
}

/**
 * Görev B2: büyü alanının kuralı. `rounds` süre (yoksa kalıcı; konsantrasyonda konsantrasyonla da biter). Zemin:
 * `difficult` altıgen maliyeti (2 zorlu arazi, 4 Plant Growth; üst üste binince en büyüğü; uçana işlemez), `ground` tetikleri
 * uçanı etkilemez (S1 uçuş kuralı). Görüş: `obscured: heavy` (saldırıda görülmeyen hedef/saldıran). `silence`: içeride sözlü (V) büyü
 * yapılamaz. `windWall`: duvar (alan şekli `wall`: noktada büyücüye dik çizgi); menzilli silah
 * saldırısı içinden geçemez, Small ve küçük uçan yaratık giremez. Tetik `on`: `cast` (oluşunca ve taşınınca içindekiler),
 * `enter` (girince), `start`/`end` (turu içinde başlatınca/bitirince), `move` (içinde her altıgen yürüyüşte; Spike
 * Growth), `anchorMove` (yürüyen alan yaklaşınca). `once`: yaratık başına turda bir kez. Etki: `save` (yoksa doğrudan),
 * `damage`/`damageType`/`half`, durumlar (`conditions`; `hold: spell` büyü sürdükçe — `escape` ile tur sonu kurtulma save'i —,
 * `turn` o turun sonuna dek, yoksa kalıcı Prone gibi), `dropConcentration`, `targets: enemies` (yalnızca büyücünün
 * düşmanları). `move`: sonraki turlarda alan taşınır (`spell_followup`; maliyet ve ft).
 */
/**
 * Görev KARAR104 (sürüm 104, A1 Storm of Vengeance): büyücünün sonraki turlarının başında alanın aşaması. `turn` 2 = yapımdan
 * sonraki ilk tur başı; `through` varsa o tura dek her tur. Altındakilere save'li ya da save'siz hasar (`targets`: en çok bu kadar
 * farklı yaratık, büyücünün düşmanlarından); `persist` aşamaya girilince büyü bitene dek alan kuralına eklenir.
 */
export interface ZoneStage {
  turn: number;
  through?: number;
  save?: Ability;
  damage: string;
  damageType: string;
  half?: boolean;
  targets?: number;
  persist?: Partial<Omit<ZoneSpec, 'stages' | 'castTrigger'>>;
}

export interface ZoneSpec {
  /** Görev KARAR104 (sürüm 104): tur aşamaları (Storm of Vengeance); eski veride `true` yalnız işaretti (okunmaz). */
  stages?: boolean | ZoneStage[];
  /** Görev KARAR104 (sürüm 104): alandaki saldıranın ya da hedefin menzilli silah saldırısı yapılamaz (Storm of Vengeance 5–10. tur). */
  noRangedWeapon?: boolean;
  /**
   * Mekanik matris B05 (sürüm 83+): yapım anı (`on: 'cast'`) tetiğinin farkları; alan kuralının üstüne yazılır. Wall of Thorns
   * yapımda Piercing (sonra Slashing), Storm of Vengeance yapımda CON save, 2d6 Thunder ve büyü süresince Deafened.
   */
  castTrigger?: Partial<Omit<ZoneSpec, 'castTrigger'>>;
  /** Mekanik matris B05 (sürüm 83+, Conjure Celestial Healing Light): büyücünün tarafı save yerine bu zar + büyü değiştiricisi kadar iyileşir (yukarı slot zarı dahil). */
  healAllies?: string;
  /** Kuyruk 19: Wall of Stone: altıgen başına kırılabilir panel (walls.ts); `permanent` konsantrasyon tam sürerse kalıcı. */
  panels?: boolean;
  /** Kuyruk K62 (sürüm 46): panel değerleri (Wall of Ice: AC 12, 30 HP; yoksa Wall of Stone 15/90), bağışık ve zayıf türler (zayıf = hasar iki kat). */
  panelHp?: number; panelAc?: number; panelImmune?: string[]; panelVuln?: string[];
  /** Kuyruk K62 (sürüm 46): yıkılan panelin yerinde kalan donuk hava perdesi (CON save, perdeden turda ilk geçişte; yukarı slot başına `upDice`). */
  /** Kuyruk K62 (sürüm 46): duvar yaratığın altıgeninden geçince yaratık itilir ve bu save'i atar (Wall of Ice 10d6 Cold, yukarı slot başına `upDice`). */
  cutDamage?: { dice: string; type: string; save: Ability; upDice: string };
  /** Kuyruk K62 (sürüm 46): Forcecage; alan hazır ayarlı kafes (yarıçap `barsRadius` altıgen) ya da kutu (2×2) olur, tutsakları çıkarmaz (`forcecage.ts`). */
  cage?: { barsRadius: number };
  /** Kuyruk K62 (sürüm 46): Delayed Blast Fireball; boncuk alanı (`bead.ts`): süre (tur) ve fırlatma menzili (ft); konsantrasyon bağı alanda değil, patlama kancasında. */
  bead?: { rounds: number; throwFt: number };
  frigidAir?: { dice: string; type: string; save: Ability; upDice: string };
  permanent?: boolean;
  /** Kuyruk 19: Wall of Force: görünmez (görüşü kesmez, geçilmez). */
  transparent?: boolean;
  /** Kuyruk 19: Wall of Fire: tur sonu hasarı seçilen yüzde (10 ft) ve duvarın içinde. */
  sideDamage?: boolean;
  /** Kuyruk 19: tek tutsak (Conjure Elemental): tutsak varken kimse save atmaz; tutsak tur başında save, başarısızsa `repeatDice`, başarılıysa kurtulur. */
  captive?: { repeatDice: string };
  /** Kuyruk 19: toplam bu kadar hasar verince alan biter (Guardian of Faith 60). */
  budget?: number;
  /** Kuyruk 19: alanın merkez altıgeni dolu (Guardian of Faith; geçilmez, görüşü kesmez). */
  occupy?: boolean;
  /** Kuyruk 19: büyücünün turunun başında alandaki tek düşmana (Faithful Hound); giriş/tur başı tetiği yok. */
  casterTurn?: boolean;
  /** Kuyruk K61 (sürüm 44): büyücünün her tur sonunda alandaki herkes tetiklenir (Earthquake). */
  casterEnd?: boolean;
  /**
   * Kuyruk K66a (sürüm 50): Earthquake yarıkları (`src/battle/fissure.ts`): sayı zarı, derinlik zarı × adım ft, genişlik
   * (altıgen), altından yarık geçemeyen yapı nesneleri.
   */
  fissures?: { count: string; depthDie: string; depthStepFt: number; widthHexes: number; structureKinds: string[] };
  /**
   * Kuyruk K66b (sürüm 50): Earthquake yapı hasarı (`src/battle/quake.ts`): dökümde ve büyücünün tur sonlarında yapıya hasar;
   * yükseklik (ft) yapı türü başına (`panel`: Wall of Stone/Ice paneli); çöküş save'i, zarı, enkazdan kurtulma DC'si, enkaz zemini.
   */
  structures?: { damage: number; damageType: string; heightsFt: Record<string, number>;
    collapse: { save: 'dex'; dice: string; type: string; escapeDc: number; rubble: string } };
  rounds?: number;
  difficult?: number;
  ground?: boolean;
  obscured?: 'heavy' | 'light';
  silence?: boolean;
  windWall?: boolean;
  on?: Array<'cast' | 'enter' | 'start' | 'end' | 'move' | 'anchorMove'>;
  once?: boolean;
  /** Kuyruk 18b: tetik yalnızca bu global Game Master anahtarı açıkken (yağda kayma: `mixOilSlip`). */
  gate?: string;
  save?: Ability;
  damage?: string;
  damageType?: string;
  half?: boolean;
  conditions?: string[];
  hold?: 'spell' | 'turn';
  escape?: Ability;
  dropConcentration?: boolean;
  targets?: 'all' | 'enemies' | 'allies';
  /** Görev P7: tetikte hasar yerine iyileştirme (ek paket `yuzeyOlustur.iyilestir`). */
  heal?: string;
  /** Büyücünün kendisi etkilenmez (Entangle). */
  notCaster?: boolean;
  color?: string;
  icon?: string;
  /**
   * Görev B4: ışık (alanın altıgenleri ve çevresinde bu kadar altıgen aydınlık; karanlık/gece haritası), büyülü
   * karanlık (`dark`: altıgenler ışıksız, ışık aydınlatamaz, karanlık görüş göremez), oluşunca kaldırdığı alanlar
   * (`dispels`: büyü kimlikleri; Daylight → Darkness).
   */
  light?: number;
  /** Kuyruk K67a (sürüm 51): parlak yarıçapın ötesinde ek loş ışık (altıgen; Daylight 12). */
  lightDim?: number;
  dark?: boolean;
  dispels?: string[];
  /** Görev Y1: oluşunca altındaki alev yüzeylerini söndürür (Sleet Storm: SRD "exposed flames in the area are doused"). */
  douses?: boolean;
  /** Görev K13B: alan bir yüzeydir (Stinking Cloud → zehir bulutu): kural yüzey verisinden, tepkimeler yüzey yolundan. */
  surface?: 'poison';
  /** K17 G1: geçilmez duvar (Wall of Force, Wall of Stone): altıgenlere girilmez, saldırı ve büyü hattını keser. */
  solid?: boolean;
  /** Kuyruk 18 H2: büyücüye bağlı yürüyen alan (yarıçap altıgen; Antilife Shell). */
  anchorSelf?: number;
  /** Kuyruk 19: büyücünün turunun başında ondan bu kadar ft uzaklaşır (Cloudkill). */
  drift?: number;
  /** Kuyruk 19: zorlu arazi yalnızca düşmanlar için. */
  difficultFor?: 'enemies';
  /** Kuyruk 18 H2: itici aura (Antilife Shell): Undead/Construct dışındakiler giremez ve dışarıdan içeriye yakın dövüş yapamaz. */
  repel?: boolean;
  /** Kuyruk 19 (11–20): alandaki dostlara (alanın tarafı) en az yarım siper ve dirençler (Nature's Sanctuary). */
  coverFor?: 'allies';
  resist?: string[];
  /** Kuyruk 19: girdap (Control Water): tur başında alandaki sudakileri merkeze `pull` altıgen çeker; uzaklaşmak için Athletics. */
  vortex?: { pull: number };
  /**
   * Control Water girdabı (kural sürümü 84): alanın `band` altıgen ötesine kadar (dışındakiler) tur başında merkeze `pullFt`
   * çekilir; başarısız save'de yakalanır (hız 0, kurtulma eylemle Athletics `escape`). `src/battle/girdap.ts`.
   */
  whirl?: { band: number; pullFt: number };
  /** Kuyruk A6 (Gust of Wind): başarısız save'de büyücüden bu kadar ft itme; büyücüye yaklaşan adım bu kat maliyet. */
  push?: number;
  costToward?: number;
  /** Kuyruk S2 (sürüm 41): silindir yüksekliği (ft; Moonbeam 40); irtifası bunun üstündeki yaratık etkilenmez. */
  heightFt?: number;
  /** Kuyruk K68a (sürüm 52): tepe = alanın (yukarı slotla büyümüş) yarıçapı (Fog Cloud, Stinking Cloud; zemine merkezli küre). */
  heightFromRadius?: boolean;
  /** Kuyruk S2: kamufle alan (Spike Growth): büyücünün karşı tarafından gizli. */
  camouflaged?: boolean;
  /** Kuyruk S2: kuşatma mermisi geçer (Wind Wall; saldırı adında bu sözcükler). */
  siegePass?: string[];
  /** Kuyruk S1 (sürüm 40, Gust of Wind `anchorSelf`): çizgi büyücüye bağlı; büyücü yer değiştirince komut sonunda onunla kayar. */
  followCaster?: boolean;
  /** Kuyruk A7 (Darkness): oluşunca örtüştüğü, en çok bu seviyedeki büyülerin ışığını kaldırır. */
  dispelLight?: number;
  /** Kuyruk A7 (Daylight): güneş ışığı (Sunlight Sensitivity dezavantajı). */
  sunlight?: boolean;
  /** Kuyruk A8 (Stinking Cloud): tutulan etki eylem ve bonus eylemi yasaklar. Wind Wall: oluşunca gaz bulutlarını dağıtır. Moonbeam: başarısız save'de biçim değiştiren gerçek biçimine döner. */
  noActBonus?: boolean;
  dispersesGas?: boolean;
  revertShape?: boolean;
}

/**
 * Süren etki büyüsü (Görev R2; `kind: effect`): kaç hedef (yukarı slot başına `upcast.targets`), dost mu düşman mı,
 * düşmansa save (büyünün `save`'i; başarısızsa etki), ne kadar sürer (`rounds`; konsantrasyonda konsantrasyon
 * bitince de biter). Etki: zar eklentisi (`dice`: +/− zar, saldırı/save/kontrol; `skill: 'chosen'` seçilen beceri),
 * hasar azaltma (`reduce`: turda bir, seçilen tür), her tur başı geçici HP (`tempHp: 'spellMod'`), durum bağışıklığı
 * (`immune`), anında en çok HP artışı (`hpBonus`, slot başına `upcast.hp`), sonraki turunu kaybetme (`command`).
 */
export interface EffectSpec {
  /**
   * Kuyruk A6: etkiye olduğu gibi yazılan alanlar (ActiveEffect); "$caster" büyücünün kimliği, "$side" tarafı, "$dc"
   * büyü DC'si olur.
   */
  raw?: Record<string, unknown>;
  /** Kuyruk A6: zırh giyen hedefe yapılamaz (Mage Armor). */
  noArmor?: boolean;
  /** Kuyruk A6 (Warding Bond): bağlı yaratıklardan birine başkası yeniden yapınca önceki bağ biter. */
  bondRecast?: boolean;
  /** Kuyruk A7 (Dragon's Breath): dokunulan yaratığa bu boyda (ft) koni nefes verir. */
  breathGrant?: number;
  targets: number;
  /** `any` (Görev B1: Levitate, Enlarge/Reduce): dosta save'siz, düşmana save'li. */
  side: 'ally' | 'enemy' | 'any';
  /** Görev B1: yalnızca büyücünün kendisi (Shillelagh, Blur). */
  self?: boolean;
  /** BUYU-TAM (102): büyücü hedeflerden biri olmalı (Etherealness yukarı slot). */
  includeSelf?: boolean;
  /** BUYU-TAM (102): hedef Ethereal düzleme geçer (hedef alınmaz; Etherealness). 101 ve altında etkiye yazılmıyordu. */
  ethereal?: boolean;
  rounds: number;
  dice?: { die: string; sign: 1 | -1; on: Array<'attack' | 'save' | 'check'>; skill?: 'chosen'; single?: boolean };
  reduce?: { die: string; type: 'chosen' };
  tempHp?: 'spellMod';
  immune?: string[];
  hpBonus?: number;
  command?: Array<'grovel' | 'halt' | 'approach' | 'drop' | 'flee'>;
  /** Seçim (beceri ya da hasar türü) listesi. */
  choices?: string[];
  /** Jetonda ve kartta gösterilen simge. */
  icon?: string;
  /** Görev S1: uçuş hızı (ft; Fly), havada süzülme (Levitate), yürüyemez, süresince verilen durumlar (Invisibility). */
  fly?: number;
  airborne?: boolean;
  speedZero?: boolean;
  /** Görev K9c: tırmanma hızı (Spider Climb), büyülü zıplama menzili ft (Jump). */
  climb?: boolean;
  jumpFt?: number;
  /** Kuyruk 19: Freedom of Movement. */
  freeMove?: boolean;
  /** Kuyruk 19: Fire Shield karşılık zarı (tür seçilen direncin tersi: Cold direnci → Fire). */
  retortDice?: string;
  /** Kuyruk 19: Aura of Life. */
  auraLife?: { radiusFt: number; resist: string[]; revive: boolean };
  /** Kuyruk 19: Water Walk. */
  waterWalk?: boolean;
  /** Görev CLERIC: Sanctuary, Warding Bond (bağ + tüm türlere direnç + saves/AC), Bestow Curse seçenekleri. */
  sanctuary?: boolean;
  bond?: boolean;
  saveBonusAll?: number;
  attackDisVs?: boolean;
  turnSave?: 'wis';
  curseDamage?: { dice: string; type: string; spells?: boolean };
  /** Görev WIZARD: Blink. */
  blink?: boolean;
  grants?: string[];
  /** AC eklentisi, AC tabanı (`'mageArmor'`: 13 + hedefin DEX'i), hız çarpanı, eylemle biter (Görev S1). */
  ac?: number;
  acMin?: number | 'mageArmor';
  speedMult?: number;
  breakOnAct?: boolean;
  /** Hıza eklenen ft (Longstrider); anında geçici HP zarı (False Life; yukarı slotta `upcast.hp` × fark eklenir). */
  speedFt?: number;
  /** Görev A5: süre boyunca her turda ek bonus eylem. */
  extraBonus?: number;
  /** Görev A4: tasma: hedef büyücüden `radiusFt` uzağa kendi hareketiyle gidemez. */
  leash?: { radiusFt: number };
  /** Görev A2: engelden geçme (`true` ya da `{ difficult }`; data/gecis.json). */
  phase?: boolean | { difficult?: boolean };
  tempHpNow?: string;
  /**
   * Görev B1: avantajlı/dezavantajlı save'ler, direnç (`'chosen'`: seçilen tür; Protection from Energy), bu yaratığa
   * saldırılar dezavantajlı (Blur), bu yaratığın saldırıları dezavantajlı, silah isabetinde ek zar (Enlarge), hasardan
   * düşülen zar (Reduce, Ray of Enfeeblement), silahta büyü yeteneği ve zarı (Shillelagh; zar cantrip kademesiyle),
   * tur sonu tekrar save (büyünün save'i; başarıda biter), tepki yok, saldırı ve büyü yok (Gaseous Form), ölüm save'i
   * avantajı ve en yüksek iyileştirme (Beacon of Hope), boyut etiketi, bitince uyuşukluk (Haste).
   */
  saveAdv?: Ability[];
  /** Görev B5: `'chosen'` seçilen yetenek (Bestow Curse). */
  saveDis?: Ability[] | 'chosen';
  resist?: string[] | 'chosen';
  attackedDis?: boolean;
  attackDis?: { melee?: boolean; single?: boolean; str?: boolean };
  hitDie?: string;
  damagePenalty?: { die: string; weaponOnly?: boolean; min?: number };
  weaponOverride?: { weapons: string[]; dice: string[]; force?: boolean; type?: string };
  /** Kuyruk A6 (Alter Self, Aquatic Adaptation): yüzme hızı. */
  swim?: boolean;
  repeatSave?: boolean;
  noReactions?: boolean;
  /** Kuyruk S1 (Suggestion "bırak"): silahını bırakır (silahla saldıramaz). */
  disarmed?: boolean;
  /** Kuyruk S2: Levitate (irtifa), Gaseous Form yaratık altıgeninde durma ve dar aralıktan (kapı) geçme. */
  levitate?: boolean;
  shareSpace?: boolean;
  squeeze?: boolean;
  noAttack?: boolean;
  /** Kuyruk A8 (Gaseous Form): bu biçimde büyü yapılamaz. */
  noCastForm?: boolean;
  deathSaveAdv?: boolean;
  maxHeal?: boolean;
  size?: 1 | -1;
  lethargy?: boolean;
  dropAtZero?: boolean;
  /** Kuyruk 41b: ilk kez 0 HP'ye düşecekken 1 HP'de kalır, etki biter (Death Ward). */
  deathWard?: boolean;
  /** K17 G1: Banishment (savaştan geçici çıkış) ve Resilient Sphere (kapalı küre: bütün hasara bağışık). */
  banished?: boolean;
  sealed?: boolean;
  /** Kuyruk 18 H1: taraf değiştirme (Dominate). */
  dominate?: boolean;
  /** Kuyruk K61 (sürüm 44): Dominate'e özgü tepki bağı (yönetilen yaratığın tepkisi büyücününkini harcar); Charm Person'da yok. */
  reactionLink?: boolean;
  /** Kuyruk 18 H2: Polymorph (Beast biçimi, geçici HP). */
  polymorph?: boolean;
  /**
   * Görev B3: büyüleme (`charm`: koyana saldıramaz), hasarla biter (`breakOnDamage`), hasar alınca büyünün save'i
   * (`damageSave`, avantajlı), süren zorlama (`commandPersist`; Command sözcüğü her tur), kaçarken Dash (`fleeDash`),
   * koyanın her turunda hasar (`sourceTurnDamage`; Phantasmal Force), yanılsama kopyaları (`images`; Mirror Image),
   * yalnızca bu yaratık türleri (`onlyTypes`; türsüz parti üyesi humanoid sayılır), oluşta hedefin save'i avantajlı
   * (`saveAdvantage`; Charm Person savaşta).
   */
  charm?: boolean;
  breakOnDamage?: boolean | 'casterSide';
  /** Kuyruk 19: başka bir büyünün hedefi olunca biter (Modify Memory). */
  breakOnSpell?: boolean;
  damageSave?: { advantage?: boolean };
  commandPersist?: boolean;
  fleeDash?: boolean;
  sourceTurnDamage?: { dice: string; type: string };
  images?: number;
  onlyTypes?: string[];
  saveAdvantage?: boolean;
  /**
   * Görev B4: taşıyan ışık yayar (altıgen; Light), görünmez olamaz (`revealed`; Faerie Fire), görünmezi görür
   * (`seeInvisible`; See Invisibility), ona saldırılar avantajlı (`attackedAdv`; Faerie Fire).
   */
  light?: number;
  /** Kuyruk K67a (sürüm 51): ek loş ışık (altıgen; parlak yoksa merkezden: Faerie Fire 2). */
  lightDim?: number;
  revealed?: boolean;
  seeInvisible?: boolean;
  /** Kuyruk K63 (sürüm 47): süren etki Truesight verir (ft; True Seeing 120). */
  truesight?: number;
  attackedAdv?: boolean;
  /**
   * Görev B5: karanlık görüş (ft; Darkvision), seçilen yetenekte kontrollere avantaj (Enhance Ability), taşıyanın bu
   * kadar altıgen içindeki dostlarına Stealth +10 (Pass without Trace), yapılınca kalkan durumlar (Protection from Poison).
   */
  darkvision?: number;
  checkAdv?: 'chosen';
  /** CILA: Haste ek eylemi, Slow eylem kısıtı, kontrol dezavantajı (yetenekler). */
  extraAction?: boolean;
  slowed?: boolean;
  checkDis?: Ability[] | 'chosen';
  /** Kuyruk A4: duruma karşı save avantajı (Protection from Poison: Poisoned). */
  saveAdvAgainst?: string[];
  /** Kuyruk A4: Blindsight/Truesight menzilindeki saldıran etkilenmez (Blur, Mirror Image). */
  sensesPierce?: boolean;
  /** Kuyruk A4: büyücünün sonraki turunun sonunda biter. */
  untilSourceTurnEnd?: boolean;
  /** Kuyruk A4: süresince bonus eylemle yapılabilenler ve yapılınca Dash (Expeditious Retreat). */
  bonusGrant?: Array<'hide' | 'dash' | 'disengage'>;
  dashOnCast?: boolean;
  /** Kuyruk A4 (Holy Aura): yakın dövüşle isabet ettiren bu türler CON save ya da Blinded. */
  blindRetort?: string[];
  /**
   * Mekanik matris B13 (yalnız `m83` bloğunda; Holy Aura): büyücüden yayılım. Etki büyücüde; yarıçap içindeki dostlar
   * (kendisi dahil) yayılımda kaldıkça save avantajı, onlara saldırı dezavantajı ve yakın dövüş yansıması alır (`syncAuras`).
   */
  allyAura?: { radiusFt: number; saveAdvAll?: boolean; attackedDis?: boolean; blindRetort?: string[] };
  /** CILA: sözlü buyruk: hedef Deafened ise işlemez (Command, Suggestion). */
  needsHearing?: boolean;
  /** CILA: save'e sabit eklenti (yetenek → değer; Slow DEX −2). */
  saveMod?: Partial<Record<Ability, number>>;
  stealthAura?: number;
  cureOnCast?: string[];
  /** Görev B1: seçenekli biçimler (Enlarge/Reduce): seçim anahtarı; seçilmezse dosta ilki, düşmana ikincisi. */
  variants?: Record<string, Partial<Omit<EffectSpec, 'variants'>>>;
  /** Görev B1: düşman save'i başarırsa konan hafif etki (Ray of Enfeeblement: sonraki saldırı dezavantajlı). */
  onSave?: { attackDis?: { melee?: boolean; single?: boolean }; untilSourceTurn?: boolean; icon?: string;
    /** Kuyruk K61: başarılı save'de de hız 0, hedefin sonraki turunun sonuna dek (Irresistible Dance). */
    speedZero?: boolean; untilOwnTurnEnd?: boolean };
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
    | 'rebuke' | 'retaliate' | 'redirectAttack' | 'gaze'
    /** Görev K3: Storm's Thunder (hasar verene zar kadar hasar; saldırı ya da save yok). */
    | 'thunder'
    /** Görev BARD: Cutting Words (dosta isabet eden saldırıda Bardic Inspiration zarı düşülür). */
    | 'cutting'
    /** Kuyruk 19 (srdK19, SRD canavar tepkileri): Protection (5 ft'teki dosta AC), Reflexive Antennae, Ink Cloud,
     * Pursuit, Burst of Ingenuity. */
    | 'guard' | 'antennae' | 'ink' | 'pursuit' | 'burst';
  acBonus?: number;
  /** Kuyruk 19: Whirlwind of Sand: AC'nin ardından ışınlanma (ft) ve varışta 5 ft'tekilere Blinded. */
  teleportFt?: number;
  /** Kuyruk 19: Deflect Missile: hasar 0'a inerse görülen bir yaratığa save'li geri yöneltme. */
  redirectSave?: { ability: 'dex'; dc: number; dice: string; type: string; rangeFt: number };
  /** Kuyruk 19: Ink Cloud: küp kenarı (ft) ve tetik (tur sonu yakında / hasar). */
  sizeFt?: number;
  on?: 'turnEnd' | 'damaged';
  /** Yalnızca yakın dövüş (`melee`) ya da menzilli (`ranged`) saldırıda. */
  melee?: boolean;
  ranged?: boolean;
  /** Hasar türü koşulu (B/P/S). */
  types?: string[];
  /** Azaltma zarı (`reduce`). */
  dice?: string;
  /** KARAR101 (sürüm 101+, Stone's Endurance "When you take damage"): her hasarda (`damageEffects`), yalnız isabette değil. */
  anyDamage?: boolean;
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
  /** Görev K3: kullanım bu kaynaktan (Giant Ancestry); kalmadıysa tepki yok. */
  resource?: string;
  /** Görev K3 (`thunder`): hasar türü. */
  damageType?: string;
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
  area?: { shape: AreaShape; sizeFt: number; origin: 'point' | 'self'; targets: 'all' | 'enemies'; widthFt?: number };
  text: string;
  mechanics: SpellMechanics;
  /** SRD 5.2.1'den (`npm run srd:buyu`): okul ve sayfa (bileşen ve süre data/srd/spells.json'da). */
  school?: string;
  srdPage?: number;
  /** Görev B2: sözlü (V) bileşeni yok (SRD; Silence içinde yapılabilir). */
  noVerbal?: boolean;
}

export interface ItemEffects {
  acBonus?: number;
  saveBonus?: number;
  /** Zırhsız ve kalkansızken ek AC (Bracers of Defense gibi). */
  unarmoredAcBonus?: number;
  /** Görev KATALOG-1 B: zırhsızken taban AC = bu + DEX (Mage Armor gibi; Unarmored Defense'le toplanmaz, yüksek olan; kalkan eklenir). */
  unarmoredBase?: number;
  /** Skoru en az bu değere çeker (Gauntlets of Ogre Power gibi). */
  setAbility?: Partial<Record<Ability, number>>;
  /** Kuyruk 19: Armor +N (zırh giyiliyken) ve Shield +N (kalkan taşınırken). */
  armorAcBonus?: number;
  shieldAcBonus?: number;
}

/**
 * Görev KATALOG-1 (P0): özgün katalog eşyasının bir özelliği, PDF'teki metin ve sayılarla birebir. `durum` motorun bugünkü
 * karşılığı (alt sınıf AS2 deseni): `calisir` veriden çalışır, `kismi` bir parçası çalışır, `planli`/`calismiyor` metin olarak
 * kayıtta durur, savaşta etkisi yok. `not` hangi kancanın gerektiğini söyler.
 */
export type KatalogDurum = 'calisir' | 'kismi' | 'planli' | 'calismiyor';
export interface KatalogOzellik { ad: string; metin: string; durum: KatalogDurum; not?: string }
/** Görev KATALOG-1: özgün katalog eşyasının PDF'ten gelen bilgileri (Dungeondex prospektüsü ve oluşturucu için; savaş etkisi `Item` alanlarında). */
export interface KatalogEsya {
  /** Kaynak katalog ve sıra (`harita/belgeler/KATALOG-1-ENVANTER.md`): S1#1, S2#41, KY#3, ZK#5, GY#7, YT#9, TK#12, BOSS#… */
  ref: string;
  /** Türkçe ad (EN-AD `Item.name`). */
  tr: string;
  /** Görev BOSS-IMZA-GORSEL: değişmeden önceki EN ad (kayıt geçişi `data/esya-ad-degisim.json`). */
  eskiAd?: string;
  nadirlik: 'olagandisi' | 'nadir' | 'cokNadir' | 'efsanevi' | 'yadigar';
  tur: 'silah' | 'zirh' | 'kalkan' | 'tuketilebilir' | 'aksesuar' | 'sihirli';
  /** PDF başlığındaki sınıf/yuva ("Savaş silahı (yakın dövüş)", "başlık", "yüzük"…). */
  yuva: string;
  /** Uyum koşulu ("Büyücü", "Druid"); yoksa yalnız `Item.attunement`. */
  uyumKosulu?: string;
  /** GP; `null` = satılamaz / paha biçilemez. */
  fiyatGp: number | null;
  /** Bağlanan SRD silahı (`data/weapons.json` kimliği) ya da zırh adı; K11: SRD karşılığı yoksa en yakın SRD silahı. */
  taban?: string;
  /** K11: taban silahla istatistik farkı (motorda karşılığı yok; kanca). */
  tabanFarki?: string;
  hasar?: string;
  ustalik?: string;
  silahOzellikleri?: string[];
  menzil?: string;
  bonus?: string;
  /** PDF "Ne işe yarar" paragrafı (birebir). */
  ozet?: string;
  ozellikler: KatalogOzellik[];
  riskler?: string;
  kimlerKullanamaz?: string;
}

export interface Item {
  /** Sabit kimlik (değişmez; Dungeondex vb. açıklamalar buna bağlanır). */
  id: string;
  /**
   * SRD 5.2.1 karşılığı: `<dosya>:<kimlik>` (data/srd/<dosya>.json). Görev KATALOG-1: özgün katalog eşyasında yok
   * (`kaynak: 'katalog-1'`); sihirli eşya sorgusu `isMagicItem`.
   */
  srd?: string;
  /** Görev KATALOG-1: SRD dışı özgün eşyanın kaynağı (`data/items-katalog.json`). */
  kaynak?: 'katalog-1';
  /** Görev KATALOG-1: PDF bilgileri (yalnız `kaynak: 'katalog-1'`). */
  katalog?: KatalogEsya;
  name: string;
  attunement: boolean;
  /** Görev K5: ağırlık (lb); `weightApprox` SRD'de ağırlığı yazmayan eşyada varsayım (DECISIONS.md). */
  weight?: number;
  weightApprox?: boolean;
  text: string;
  effects: ItemEffects;
  /** Kuyruk 43: savaşta kullanılan sarf eşyası (iksir: bonus eylem, kendine ya da 5 ft içindeki birine; SRD 5.2.1). */
  use?: ItemUse;
  /** Kuyruk 19 (SRD denetimi): taşınırken/giyilirken savaşta kalıcı etki (savaşçıda `item:<id>` süren etkisi; ActiveEffect alanları). */
  passive?: Record<string, unknown>;
  /** Kuyruk 19: büyülü bonus: zırh AC'si, kalkan AC'si, silah saldırı ve hasarı, büyü saldırısı ve DC'si. */
  bonus?: { armor?: number; shield?: number; weapon?: number; spell?: number; /** Görev TE99 (99+): `weapon` bonusu yalnız cephaneli silaha (Ammunition, +N). */ ammoOnly?: boolean };
  /** Kuyruk 19: silah isabetinde ek hasar (Flame Tongue, Dragon Slayer…); `vs` yaratık türleri; `ranged`/`melee` silah türü. */
  onHit?: { dice: string; type: string; vs?: string[]; ranged?: boolean; melee?: boolean; label?: string; /** yalnızca doğal 20 */ critOnly?: boolean;
    /** Görev TE99 (99+): yalnız cephaneli silahın isabetinde (Ammunition of Slaying). */ ammo?: boolean;
    /** Görev TE99 (99+): eşyanın kendisi bu silah (Javelin of Lightning: `javelin`). */ weaponId?: string;
    /** Görev TE99 (99+): ek hasar değil, o silahın hasar türü `type` olabilir (Javelin of Lightning "Lightning damage instead of Piercing"). */ replaceType?: boolean };
  /** Kuyruk 19: yüklü büyüler (değnek, asa, yüzük): her yapım `cost` yük harcar; DC/saldırı eşyanınki (yoksa büyücününki). */
  spells?: Array<{ name: string; cost?: number; level?: number }>;
  charges?: number;
  /**
   * Görev TE99: yükün şafakta yenilenmesi (SRD 5.2.1 "regains … daily at dawn"; oyunda uzun dinlenme): zar ("1d6+1"),
   * sabit sayı ("1") ya da "all". Yoksa yenilenmez (tek kullanımlık: Bead of Force, Necklace of Fireballs…).
   */
  recharge?: string;
  dc?: number;
  attack?: number;
  /** Kuyruk 19: savaşta etkisi yok (gerekçe; envanterde "savaş dışı" etiketi). */
  offCombat?: string;
  /** Görev P7: eşya kancası: ek paket ilkelleri ve yaratıkları (`cagir`, `ekSaldiri`…; `paket/bag.ts` `itemBag`). */
  paket?: { ilkeller: Array<Record<string, unknown> & { tur: string }>; yaratiklar?: Array<Record<string, unknown>> };
}

/** Kuyruk 19: savaşta kullanılan eşya türleri. */
export type ItemUse =
  | { kind: 'heal'; dice: string; action: 'bonus' | 'action'; reachFt: number }
  /** İçilen/uygulanan: kendine ya da 5 ft içindeki dosta süreli etki (iksirler, Antitoxin), geçici HP ya da hasar (Potion of Poison). */
  | { kind: 'effect'; action: 'bonus' | 'action'; reachFt: number; rounds: number; effect?: Record<string, unknown>; tempHp?: string; damage?: string; damageType?: string; save?: { ability: 'con'; dc: number };
    /** Görev SRD-TAMAMLAMA-1 (106+): bütün Exhaustion seviyelerini kaldırır (Potion of Vitality). */
    cureExhaustion?: boolean }
  /** Fırlatılan (Attack eyleminde bir saldırının yerine): DEX save (DC 8 + DEX + PB ya da sabit), hasar, durum, yanma. */
  | { kind: 'throw'; rangeFt: number; save: 'dex' | 'str' | 'con'; dc?: number; damage?: string; damageType?: string; vs?: string[]; grants?: string[]; escapeDc?: number; burning?: string; radiusFt?: number }
  /** Silaha sürülen (Basic Poison): sonraki isabetlere ek hasar. */
  | { kind: 'coat'; action: 'bonus'; dice: string; damageType: string; rounds: number };

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
  /** Kuyruk 19: bonus eylemle yapılan saldırı (Multiattack'a girmez; Giant Insect: Venomous Spew). */
  bonusAction?: boolean;
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

/**
 * Görev KATALOG-F0 (kural sürümü 107+): yarı can fazı (Faz 2) bloğu, canavar kaydında isteğe bağlı. Can ⌊maxHp × `esik`⌋'e
 * inince komut sonunda bir kez (`phase_changed`). Doğrulama `src/rules/faz2Schema.ts`; tasarım harita/belgeler/KATALOG-F-TASARIM.md §3.
 */
export interface Faz2Block {
  /** Eşik (0–1, varsayılan 0,5). */
  esik?: number;
  /** Geçici HP: sabit ya da zar ("4d10"); tetikte bir kez atılır. */
  geciciCan?: number | string;
  /** AC değişimi. */
  ac?: number;
  /** Saldırı zarına ek: sabit ("2") ya da zar ("1d4"). */
  saldiri?: number | string;
  /** İsabet başına ek hasar: sabit ya da zar; türü `hasarTuru` (yoksa saldırının türü). */
  hasar?: number | string;
  hasarTuru?: string;
  direncEkle?: string[]; direncKaldir?: string[];
  zayiflikEkle?: string[]; zayiflikKaldir?: string[];
  bagisiklikEkle?: string[]; bagisiklikKaldir?: string[];
  /** Recharge'lı saldırı ve yetenekler hemen dolar. */
  nefesDoldur?: boolean;
  /** Recharge'lı alan saldırılarının boy çarpanı (koni/çizgi uzunluğu, küre/yayılım yarıçapı; 5 ft'e aşağı). */
  nefesAlan?: number;
  /** Tur başına ek efsanevi eylem hakkı. */
  efsaneviEk?: number;
  /** Günlük ve kart metni. */
  not?: { tr: string; en: string };
}

export interface Monster {
  id: string;
  /** Görev KATALOG-F0: yarı can fazı (107+). */
  faz2?: Faz2Block;
  /**
   * KATALOG-1 F: özgün katalog canavarı (`data/bosslar-muhur.json`; SRD tablosu `canavar-turleri.json`/`yuzme-hizi.json` dışında):
   * yaratık türü ve yüzme hızı (ft) kendi kaydında; saldırı ekleri `riders` (anahtar saldırı adı, `attack-riders.json` biçimi).
   */
  creatureType?: string;
  swim?: number;
  kaynak?: string;
  riders?: Record<string, unknown>;
  name: string;
  /** KAPSAM103 (kural sürümü 103+): SRD stat bloğundaki "Initiative +X" (`scripts/srd-canavar.mjs`; yoksa DEX değiştiricisi). */
  initiative?: number;
  /** SRD 5.2.1 PDF sayfası (stat bloğu; `data/srd/monsters.json` `page`). */
  srdPage?: number;
  /** Kuyruk K75 (79+): binicisini kabul etmeye eğitilmiş binek (kontrollü binek; `data/binek.json` `egitimli` listesine ek, özel canavar için). */
  egitimli?: boolean;
  /** Boyut; verilmezse Medium. */
  size?: CreatureSize;
  ac: number;
  hp: number;
  speed: number;
  /** Uçuş hızı (ft). */
  fly?: number;
  /** `public/` altındaki jeton resmi; verilmezse `monsters/<id>.webp` (uyurken `<id>-uyku.webp`). */
  avatar?: string;
  /** MUHUR-OLCEK: jetonun görsel ölçeği (boyut sınıfı yerine; `data/bosslar-muhur.json`, Mühür Ruhu kademe ölçeği). Yalnız görünüm. */
  jetonOlcek?: number;
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
/**
 * Alt sınıf özelliğinin oyundaki durumu: çalışır, kısmen çalışır (Görev P0), planlanan sistemi bekliyor, savaş dışı
 * (anlatı), çalışmıyor.
 */
export type SubclassStatus = 'calisir' | 'kismi' | 'planli' | 'hikaye' | 'calismiyor';
export const SUBCLASS_STATUSES: SubclassStatus[] = ['calisir', 'kismi', 'planli', 'hikaye', 'calismiyor'];
/** Jenerik alt sınıf şemasında bir özellik (data/subclasses.json ve dış içerik paketleri). */
export interface SubclassFeatureDef {
  id: string;
  level: number;
  name: LocalText;
  description: LocalText;
  status: SubclassStatus;
  /** Mekanik: data/class-features.json özelliğiyle aynı biçim; yoksa özellik çalışmaz. */
  effect?: FeatureMechanic;
  /** Görev P0: ek paket etki ilkelleri (`src/content/ilkelSema.ts`; yorumlayıcı `src/battle/paket/`). */
  ilkeller?: Array<Record<string, unknown>>;
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
  /** Kuyruk K48: oyunun kendi alt sınıfı (SRD dışı; imza ve Karadul). Görev AS2: anahtar yok, hep seçilebilir. */
  ev?: boolean;
  /** Görev AS2: cinsiyet kuralı (oluşturucuda yalnız bu cinsiyetteki karaktere görünür; Karadul kadın, İmparator erkek). */
  cinsiyet?: 'erkek' | 'kadin';
  /** Kuyruk K48: bu alt sınıf seçilince kaybedilen sınıf özellikleri (anahtar; ör. `druid:wild-shape`). */
  replaces?: string[];
  /** Kuyruk K48: alt sınıf seviyesinde ek beceri yetkinlikleri. */
  ekBeceriler?: string[];
  /** Kuyruk K50: imza alt sınıfın ev kuralı kimliği (`imza_<ad>`); null her zaman açık (Birlik Manastırı). Görev AS2: yalnız
   * kural sürümü < 78 savaşta (eski kayıt/replay) kapı; 78+ hep açık. */
  evKurali?: string | null;
  /** Görev P0: paketin çağrı yaratıkları (yükleyici paket düzeyindeki `yaratiklar`ı her alt sınıfa kopyalar). */
  yaratiklar?: Array<Record<string, unknown>>;
}

export type FeatureType = 'passive' | 'resource' | 'action' | 'bonus' | 'reaction' | 'free';
export type FeatureStatus = 'ok' | 'partial' | 'none' | 'missing';

/** Bir sınıf özelliğinin oyundaki mekaniği (data/class-features.json). */
export interface FeatureMechanic {
  type: FeatureType;
  status: FeatureStatus;
  /** Kuyruk P12: ek paket hikâye özelliği (savaş dışı; yalnız gösterim etiketi "Hikâye"). */
  story?: boolean;
  /** Pasif sayının türü. */
  stat?: 'attacksPerAction' | 'sneakAttackDice' | 'speed' | 'unarmoredDefense' | 'expertise' | 'spellcasting' | 'featSlot' | 'weaponMastery'
    | 'saveAdvantage' | /** Kuyruk 19: yetenek artışı (Primal Champion, Body and Mind; `abilities`, `value`, `max`). */ 'scoreBonus' | 'classSkills' | 'frenzy' | 'martialArts' | 'critOn' | 'saveProficiency' | 'metamagic' | 'invocations' | 'jackOfAllTrades'
    /** Görev A5: her turda `value` kadar ek bonus eylem. */
    | 'extraBonusActions';
  /**
   * Görev F: motorun baktığı pasif işaret (`Combatant.traits`): evasion, elusive, reliable-talent, studied-attacks,
   * survivor, precise-hunter, colossus-slayer… Anlamı ilgili kural modülünde.
   */
  trait?: string;
  /** Kuyruk 19: ek işaretler (Archdruid: Nature Magician). */
  traits?: string[];
  /** Kuyruk 19: oluşturucuda seçilen büyüler (Spell Mastery, Signature Spells): `featureChoices['<özellik>/<slot>']`. */
  /** Kuyruk 19: `cls` sınıf listesi (varsayılan Wiz), `all` bütün sınıf listesinden (bilinmesi gerekmez; Mystic Arcanum), `minClassLevel` bu seviyeden. */
  /** Görev B93 (Ritual Adept): büyü kitabındaki SRD ritüel büyüleri hazırlanmadan ritüel olarak (kurulum). */
  ritualFromBook?: boolean;
  /** Görev B93 (Evocation Savant): büyü kitabına bu okuldan bedelsiz büyüler: `base` (en çok `maxBaseLevel`), alt sınıf seviyesinden sonra her yeni slot seviyesinde +1. */
  spellbookBonus?: { school: string; base: number; maxBaseLevel: number; perNewSlotLevel: number };
  spellPicks?: Array<{ slot: string; level: number; cls?: string; all?: boolean; minClassLevel?: number;
    /** Görev B93: büyü kitabından seçilir ve her zaman hazırdır (hazır sayısına girmez; Spell Mastery, Signature Spells). */ fromBook?: boolean;
    /** Görev B93: yalnız bu yapım süresindeki büyü (Spell Mastery: Action). */ castingTime?: string }>;
  /** Görev F: oyuncunun seçtiği seçenek (Hunter's Prey, Defensive Tactics): her biri bir işaret; `default` seçilmediyse. */
  options?: Array<{ id: string; trait: string; armor?: Array<'light' | 'medium' | 'heavy' | 'shield'>; martialWeapons?: boolean; cantrips?: number; resist?: string[];
    /** Görev DRUID: seçeneğe bağlı her zaman hazır büyüler (arazi) ve Nature's Ward direnci. */
    alwaysPrepared?: Record<string, string[]>; ward?: string }>;
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
  /** Görev CLERIC: aynı kaynağı harcayan birden çok eylem (Channel Divinity: Divine Spark, Turn Undead); anahtar `özellik/id`. */
  actions?: Array<{ id: string; name: string; type: 'action' | 'bonus'; effect: FeatureEffect }>;
  /** Görev SORCERER: Metamagic: seviyeye göre seçenek sayısı ve her seçeneğin Sorcery Point bedeli. */
  metamagic?: { counts: Record<string, number>; costs: Record<string, number> };
  /** Görev WARLOCK: Eldritch Invocations seçenekleri (sayı `column` sütunundan). */
  invocations?: Invocation[];
  /** Görev SORCERER: sınıf seviyesi başına ek HP (Draconic Resilience). */
  hpPerLevel?: number;
  /** Koşul: ağır zırh yok / zırh ve kalkan yok (hız); `attackAction` Attack eylemi sürerken ya da başlamadan (Sacred Weapon). */
  when?: 'noHeavyArmor' | 'noArmorNoShield' | 'attackAction';
  note?: string;
  /** Kuyruk 19: `scoreBonus` tavanı (25). */
  max?: number;
}

/** Görev WARLOCK: bir Eldritch Invocation (SRD 5.2.1) ve oyundaki etkisi. */
export interface Invocation {
  id: string;
  name: string;
  minLevel: number;
  status: FeatureStatus;
  /** Ön koşul Invocation (Thirsting Blade → Pact of the Blade). */
  requires?: string;
  /** Tekrarlanabilir, her seferinde uygun bir cantrip seçilir: hasar, saldırı zarı, menzil (10+ ft) ya da köken feat'i. */
  repeatable?: 'damage' | 'attack' | 'range' | 'feat';
  /** Kuyruk 19: Pact of the Tome'da seçilebilen ritüel büyüleri. */
  ritualOptions?: string[];
  effect?: {
    trait?: string;
    /** Slotsuz büyü (kendine ya da herkese). */
    atWill?: { spell: string; self: boolean };
    /** Savaştan önce yapılmış sayılan büyü (Armor of Shadows: zırhsızsa Mage Armor). */
    preCast?: string;
    /** Seçilen cantrip'e: hasar zarına büyü yeteneği, isabette itme, seviye başına menzil. */
    cantrip?: { ability?: boolean; pushFt?: number; rangePerLevel?: number };
    /** Attack eyleminde saldırı sayısı (Thirsting Blade). */
    attacks?: number;
    /** Pact silahı (Pact of the Blade). */
    pactWeapon?: boolean;
    /** Ek cantrip (Pact of the Tome). */
    cantrips?: number;
    /** Kuyruk 19: Pact of the Tome: ritüel büyü sayısı. */
    rituals?: number;
  };
  note?: string;
  /** Savaş dışı etkinin Game Master notu. */
  gmNote?: string;
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
  /** Kuyruk 18 H3: kendini iyileştirme (Wholeness of Body): zar (`martial`: Martial Arts zarı) + yetenek değiştiricisi. */
  | { kind: 'selfHeal'; dice: string; ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'; min: number }
  /** Kendine durum (Nature's Veil; Görev F): sonraki turunun sonuna dek. */
  | { kind: 'condition'; condition: string; until: 'nextTurnEnd' }
  /** Işınlanma (Cloud's Jaunt; Görev K3): komutta hedef altıgen (`to`). */
  | { kind: 'teleport'; rangeFt: number; sight: boolean }
  /** Görev CLERIC: Divine Spark (iyileştirme ya da save'li hasar; zar sayısı seviye eşiklerinden), Turn Undead, Preserve Life. */
  | { kind: 'divineSpark'; rangeFt: number; dice: Record<string, number>; types: string[]; save: 'con' }
  | { kind: 'turnUndead'; rangeFt: number; save: 'wis'; rounds: number; conditions: string[] }
  | { kind: 'preserveLife'; rangeFt: number; perLevel: number }
  /** Kuyruk 18 H3: Abjure Foes (Paladin 9): görülen CHA değiştiricisi kadar (en az 1) düşmana WIS save ya da süreli durumlar (hasarla biter). */
  | { kind: 'abjure'; rangeFt: number; save: 'wis'; rounds: number; conditions: string[] }
  /** Görev SORCERER: Innate Sorcery: kendine süreli etki (büyü save DC'si +1, büyü saldırısında avantaj). */
  | { kind: 'innate'; rounds: number }
  /** Kuyruk 19: Divine Sense (Paladin Channel Divinity): `rangeFt` içindeki bu türlerin yeri bilinir (gizlense de hedef alınır). */
  | { kind: 'divineSense'; rangeFt: number; types: string[]; rounds: number }
  /** Görev BARD: Bardic Inspiration: menzildeki dosta süreli zar (başarısız D20 Testine eklenir). */
  | { kind: 'inspire'; rangeFt: number; rounds: number; die?: string }
  /** Görev DRUID: Wild Shape: seviye → [bilinen biçim, en yüksek CR, uçuş] (SRD Beast Shapes tablosu). */
  | { kind: 'wildShape'; forms: Record<string, [number, string, boolean]> }
  /** Görev DRUID: Land's Aid: noktada küre, düşmanlara CON save'li Necrotic, bir dosta iyileşme; zar sayısı seviyeden. */
  | { kind: 'landsAid'; rangeFt: number; radiusFt: number; dice: Record<string, number> }
  /** Görev A4: tasma: menzildeki düşman save atar; başarısızsa `rounds` tur kullanandan `radiusFt` uzağa gidemez. */
  | { kind: 'leash'; rangeFt: number; radiusFt: number; save: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'; rounds: number }
  /** Kuyruk 19 (11–20): Intimidating Presence: menzildeki seçilen yaratıklar WIS save ya da süreli durum (tur sonu tekrar save); kullanım yoksa `altResource`ten bir. */
  | { kind: 'fearAura'; rangeFt: number; save: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'; dcAbility: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'; condition: string; rounds: number; altResource?: string }
  /** Kuyruk 19 (11–20): Holy Nimbus: yarıçaplı yürüyen alan (tur başında düşmana CHA + PB Radiant), ışık, türlere save avantajı. */
  | { kind: 'nimbus'; radiusFt: number; rounds: number; types: string[]; light: number }
  /** Kuyruk 19 (11–20): Dragon Wings: süreli uçuş hızı; kullanım yoksa `altResource`ten `altCost`. */
  | { kind: 'wings'; flyFt: number; rounds: number; altResource?: string; altCost?: number }
  /** Kuyruk 19 (11–20): Quivering Palm: bu tur Unarmed Strike isabeti alan hedefe titreşim (Focus); sonra eylemle CON save'li hasar. */
  | { kind: 'quiveringPalm'; cost: number; dice: string; save: 'con'; damageType: string }
  /** Kuyruk 19 (11–20): Nature's Sanctuary: menzilde küp (yarıçap altıgen): dostlara yarım siper ve Nature's Ward direnci; varken bonus eylemle taşınır. */
  | { kind: 'sanctuary'; rangeFt: number; radius: number; rounds: number; moveFt: number }
  /** Kuyruk 19 (Epic Boon): Blink Steps: Attack ya da Magic eyleminden sonra ışınlanma; Merge with Shadows: loşta Invisible. */
  | { kind: 'blinkStep'; rangeFt: number }
  /** Kuyruk 19 (tür özellikleri): kendine süreli etki (Stonecunning, Draconic Flight, Large Form), isteğe bağlı Dash ve geçici HP (Adrenaline Rush). */
  | { kind: 'selfEffect'; rounds: number; effect: Record<string, unknown>; dash?: boolean; tempHp?: number }
  | { kind: 'shadowMerge' }
  /** Kuyruk K20 (ev kuralı): Celestial Şifa Eli (dokunuş, PB × d4) ve Göksel Uyanış (seçilen biçim; `src/battle/celestial.ts`). */
  | { kind: 'celestialHeal' }
  | { kind: 'celestialAwakening'; option: string }
  /** Kuyruk K48 (ev kuralı): Karadul Büyüleyici Bakış ve Örümcek Biçimi (`src/battle/karadul.ts`). */
  | { kind: 'karadulGaze' }
  | { kind: 'karadulSpider' }
  /** Kuyruk K50 (ev kuralı): imza alt sınıf eylemleri (`src/battle/imza.ts`, `data/imza.json` `eylemler`). */
  | { kind: 'imza' }
  /** Görev P0: ek paket ilkel düğmesi (`src/battle/paket/`; veri savaşçının `paket` alanında). */
  | { kind: 'paket'; target?: 'ally' | 'enemy' | 'any'; hex?: 'hex' | 'after' };

export interface ResourceDef {
  /** Görev B93: bu büyüler bu kaynakla yapılınca kaynak zar kadar uzun dinlenme kullanılamaz (Greater Divine Intervention: Wish, 2d4). */
  wait?: { spells: string[]; dice: string };
  /** Görev B93: kaynak yalnız özelliğin bu seçim yuvasındaki büyüye (Signature Spells: her büyüye ayrı kullanım). */
  pickSlot?: string;
  /** Görev B93: yalnız savaş dışında (dinlenmede) kullanılan kaynak: savaş ekranında gösterilmez (Arcane Recovery). */
  outOfCombat?: boolean;
  name: string;
  /** Kaynağı veren özellik(ler): `sınıf:özellik`. */
  feature: string | string[];
  uses: { column?: string; byLevel?: Record<string, number>; perLevel?: number; abilityMod?: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'; min?: number; fixed?: number; proficiency?: boolean };
  /** Yenilenme: kısa/uzun dinlenme ya da tur başı; "all" hepsi, sayı o kadar. `shortFrom`: kısa dinlenme bu seviyeden. */
  recharge: { short?: 'all' | number; long?: 'all' | number; turn?: 'all' | number; shortFrom?: number };
  /**
   * Kuyruk P12 (paket `kaynak.yenilenme: depo`): sayaç kaynağı. Yeni karakter ve uzun dinlenme bu değere döner (en çok
   * üst sınır); kısa dinlenme yalnız sayaç 0'sa bu değere getirir. Üst sınır `uses`.
   */
  depot?: number;
  /** Kuyruk E4c: yalnız görünüm: kaynak ikonu (`data/kaynak-ikon.json` `ikonlar`; ek paket zar havuzu kaynağı `ustunluk-zari`). */
  icon?: string;
  /** Kaynak kaldıkça bu büyü slotsuz yapılır (Favored Enemy → Hunter's Mark). */
  freeSpell?: string;
  /** Görev P0: ek paket kaynağı birden çok büyüyü slotsuz yaptırır (`buyuVer.bedava`). */
  freeSpells?: string[];
  /**
   * Kuyruk 41b: kaynak bilinen (hazırlanan) büyülerden bu listeye uyanları slotsuz yaptırır (Divine Intervention: Cleric,
   * 5. seviyeye dek, tepki değil). `lastResort`: yalnızca büyünün seviyesinde ya da üstünde slot kalmadıysa harcanır.
   */
  freeSpellList?: { classes: string[]; /** Kuyruk 19: yalnızca bu adlar (Natural Recovery: daire büyüleri). */ names?: string[]; minLevel?: number; maxLevel: number; lastResort?: boolean;
    /** Görev B93: yalnız bu yapım süresindeki büyü (Spell Mastery: Action). */ castingTime?: string;
    /** Görev B93 (sürüm 93+, Divine Intervention): listedeki herhangi bir büyü, hazırlanmamış olsa da (oyuncu isteğiyle `cast_spell.free`). */ anyFromList?: boolean;
    /** Görev B94 (sürüm 94+, Natural Recovery): `names` ile birlikte yalnız karakterin her zaman hazır büyüleri (seçili arazinin Circle Spells). */ alwaysPreparedOnly?: boolean;
    /** Kuyruk 18 H3: seviye başına yalnızca bilinen ilk büyü (Spell Mastery, Signature Spells: seçim arayüzü yerine). */ perLevel?: number;
    /** Kuyruk 19: sınıf ve seviye sınırı dışında bu adlar da (Greater Divine Intervention: Wish). */ extraNames?: string[] };
  /** Görev SORCERER: savaşta dönüştürmeyle bu kaynağın tavanı aşılmaz (Font of Magic: Sorcery Points). */
  cap?: boolean;
  /** Görev SORCERER: puandan slot yaratma (Font of Magic): slot seviyesi → [bedel, en düşük sınıf seviyesi]. */
  slotCost?: Record<string, [number, number]>;
  /** Tür kaynağı (Görev R4; Dragonborn Breath Weapon): sınıftan değil bu türden gelir. */
  race?: string;
  /** Görev K3: yalnızca bu soyda (Drow, Infernal…) ve `minLevel` karakter seviyesinden. */
  lineage?: string;
  minLevel?: number;
  /** F1: feat kaynağı (Magic Initiate): sınıftan değil karakterin feat seçiminden gelir (`featResources`). */
  feat?: string;
  featList?: string;
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
  /** F1: savaşçıya işaret (`traits`; Savage Attacker). */
  trait?: string;
  /** Kuyruk 19: ek işaretler (Archdruid: Nature Magician). */
  traits?: string[];
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
