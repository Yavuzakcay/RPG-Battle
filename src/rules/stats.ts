/**
 * Karakter formundan türetilen değerler: skorlar, AC, HP, hız, save'ler, büyü DC'si ve slotlar.
 * Saf fonksiyonlar: ekran veya depolama bilmez, aynı girdiye hep aynı sonucu verir.
 */
import { socketImpl } from './socketHook';
import { SHIELD, armor as armorList, getClass, getRace, items as itemList, spellSlots } from '../data';
import { ABILITIES, abilityModifier, proficiencyBonus, type Ability } from './abilities';
import { isSkill, SKILLS, skillTable, type Skill } from './skills';
import { classKit, gainedFeatures, optionTraining, packTraining, speedBonus, type ClassKit } from './classFeatures';
import { applyIncreases, featEffects, sheetFeats, type Advancement } from './advancement';
import { lineageEtki, raceSpeed } from './lineage';
import { findSubclass } from './subclasses';
import { bonusesOf, type MagicInitiatePick } from './backgrounds';
import { I } from './issueText';
import { classesOf, isMultiSheet, mcImpl } from './mcHook';

export type Scores = Record<Ability, number>;

export interface CharacterSheet {
  name: string;
  raceId: string;
  classId: string;
  /** SRD alt sınıfı (data/srd/progression.json); verilmezse sınıfın SRD alt sınıfı (her sınıfın tek alt sınıfı var). */
  subclassId?: string;
  level: number;
  /** Geçmiş bonuslarından önceki ham skorlar. */
  baseScores: Scores;
  /**
   * Geçmişten (background) gelen bonuslar: bir skora +2 ve diğerine +1, ya da üç skora +1. Geçmiş seçiliyse
   * yalnızca onun üç yeteneğindekiler geçerli (`bonusesOf`; Görev G1), diğerleri sessizce yok sayılır.
   */
  backgroundBonuses?: Partial<Scores>;
  /** Görev G1: SRD geçmişi (`data/backgrounds.json`); yoksa eski kayıt (serbest köken feat'i ve bonus). */
  backgroundId?: string;
  /** Görev G1: Magic Initiate seçimleri, büyü listesi başına (Acolyte: cleric, Sage: wizard). */
  magicInitiate?: Record<string, MagicInitiatePick>;
  /** Türün soy seçimi (Tiefling: abyssal/chthonic/infernal, Dragonborn: ejderha rengi; Görev K3: Elf, Gnome, Goliath). */
  lineageId?: string;
  /** Avatar dosya adı kuralı için (varsayılan erkek). */
  gender?: 'erkek' | 'kadin';
  /** `public/` altındaki avatar yolu; verilmezse `avatars/<ırk>-<sınıf>-<cinsiyet>.webp`. */
  avatar?: string;
  /** data/armor.json içindeki zırh adı ("Zırhsız" dahil). */
  armorName: string;
  shield: boolean;
  /** data/items.json içindeki item adları. */
  itemNames: string[];
  /**
   * Görev KATALOG-GUC-TAM: zırh/kalkan/cübbe yuvalarına takılı mühür taşları (eşya kimliği → takılı taş kimlikleri; `src/rules/sockets.ts`).
   * Taş ayrı bir kapsayıcı değil; takılınca etkisini yuvanın eşyasını giyene verir.
   */
  yuvalar?: Record<string, string[]>;
  /** Bildiği veya hazırladığı büyüler (data/spells.json içindeki adlar). */
  spellNames?: string[];
  /** Görev K6: büyü kitabındaki seviyeli büyüler (Wizard); hazırlananlar kitaptan seçilir. Yoksa (eski kayıt) hazırlananlar kitapta sayılır. */
  spellbook?: string[];
  /**
   * Beceri yetkinlikleri (sınıf, geçmiş ve türden gelenlerin hepsi). Kaynakları ayrı tutulmuyor;
   * sınıf seçimlerinin kurala uygunluğu oluşturucuda denetlenir (`classSkillProblem`).
   */
  skills?: Skill[];
  /** Uzmanlık (Expertise): yetkinlik bonusu iki kat; yalnızca yetkin olunan becerilerde. */
  expertise?: Skill[];
  /** Görev F: seçenekli sınıf özelliklerinin seçimi (özellik anahtarı → seçenek; Hunter's Prey, Defensive Tactics). */
  featureChoices?: Record<string, string>;
  /** Kuyruk K20 (ev kuralı): Celestial Göksel Uyanış biçimi (`data/celestial.json` `awakening.secenekler`). */
  celestialAwakening?: string;
  /** Kuyruk AS1b: savaş sürümü < 71'de oluşan savaşçı için alt soy mekaniği kapalı (yalnız savaş kurulumu yazar; kayda girmez). */
  soyKapali?: true;
  /** Kuyruk AS1a: Human ten tonu (`data/alt-soy-gorunum.json` `ten.tonlar`); kültürden bağımsız, yalnızca görünüm. */
  skinTone?: string;
  /** Görev AS1b düzeltmesi: Human Sur Dışı'nın sürgün kültürü (yalnız görünüm; buff/debuff Sur Dışı'nınki). Eski kayıtta yok. */
  exileCulture?: string;
  /** Taşıdığı silahlar (data/weapons.json adları), isteğe bağlı büyülü bonusla. */
  weapons?: Array<{ name: string; enchant?: number }>;
  /** Yan eldeki Light silah (data/weapons.json adı; Görev P1): Light özelliğinin ek saldırısı. Kalkanla olmaz. */
  offHand?: string;
  /**
   * Görev KARAR104 (A10): silah olan büyülü eşyanın bağlı silahı (eşya adı → silah adı; `rules/itemBinding.ts`). Yoksa ana silah
   * (sayfadaki ilk uygun silah). Savaşta 104+ eşyanın bonusu ve isabet eki yalnız bu silahla.
   */
  silahBagi?: Record<string, string>;
  /** Weapon Mastery: ustalığı kullanılan silahlar (data/weapons.json kimlikleri; sayı sınıf tablosundan). */
  weaponMasteries?: string[];
  /** Görev WARLOCK: seçilen Eldritch Invocations (`kimlik` ya da tekrarlanabilende `kimlik:Cantrip`) ve pact silahı. */
  invocations?: string[];
  pactWeapon?: string;
  /** Görev DRUID: bilinen Wild Shape biçimleri (canavar kimlikleri; sayı ve CR veriden). */
  wildShapeForms?: string[];
  /** Görev SORCERER: seçilen Metamagic seçenekleri (kimlikler; sayı sınıf verisinden). */
  metamagic?: string[];
  /** Köken (Origin) feat'i, SRD kimliği (Alert, Magic Initiate, Savage Attacker, Skilled). Geçmiş seçiliyse geçmişinki geçerli (`originFeatOf`). */
  originFeat?: string;
  /** Görev TE99 (SRD 5.2.1 s. 86 Versatile): Human'ın ek Origin feat'i (`kimlik[@liste]`). */
  speciesFeat?: string;
  /** Görev TE99 (SRD 5.2.1 s. 85–86): soy büyülerinin yeteneği (INT, WIS ya da CHA; soy seçilirken). Yoksa eski kural. */
  lineageAbility?: 'int' | 'wis' | 'cha';
  /** Seviye yuvalarındaki seçimler: ASI ya da feat, Fighting Style, Epic Boon (bkz. `rules/advancement.ts`). */
  advancements?: Advancement[];
  /**
   * Görev MC1: çoklu sınıf (SRD 5.2.1 s. 24–26). Yalnız 2+ sınıfta yazılır; yoksa tek sınıf (`classId`, `level`,
   * `subclassId`). Varken `classId`/`subclassId` ilk öğeninkiyle, `level` seviyelerin toplamıyla aynı tutulur
   * (`syncClassFields`). Kod bu alanı doğrudan okumaz: `classesOf` (`rules/multiclass.ts`).
   */
  classes?: ClassEntry[];
  /**
   * Görev MC3 (SRD 5.2.1 s. 25 "Each spell you prepare is associated with one of your classes"): çoklu sınıfta hazırlanan
   * büyünün sınıfı (büyü adı → sınıf). Yoksa büyü listesinde olduğu ilk büyücü sınıfa bağlanır. Tek sınıfta yazılmaz.
   */
  spellClass?: Record<string, string>;
}

/** Görev MC1: karakterin bir sınıfı ve o sınıftaki seviyesi. Sıra alınış sırası; ilk öğe başlangıç sınıfı. */
export interface ClassEntry {
  classId: string;
  /** Bu sınıftaki seviye (≥ 1). */
  level: number;
  subclassId?: string;
  /** Ek sınıfın SRD ilk seviye beceri seçimi (Bard serbest, Ranger/Rogue sınıf listesinden); `skills`'e de yazılır. */
  ekBeceri?: Skill;
  /** Ek sınıfın SRD ilk seviye Musical Instrument seçimi (Bard). */
  ekCalgi?: string;
}

export interface DerivedStats {
  scores: Scores;
  modifiers: Scores;
  proficiency: number;
  ac: number;
  /** KARAR101: kalkanın AC katkısı (kalkan yoksa 0). */
  shieldAc?: number;
  /**
   * AC'nin bileşenleri (özet ekranı için): `base` zırhsız 10, `armor` zırhın taban AC'si, `dex`/`con`/`wis`
   * yetenek katkısı, `shield` kalkan, `item` eşya bonusları (`name` eşyanın adı).
   */
  acParts: Array<{ kind: 'base' | 'armor' | 'dex' | 'con' | 'wis' | 'str' | 'int' | 'cha' | 'shield' | 'item' | 'feat'; value: number; name?: string }>;
  /** Zırhın Güç şartı karşılanmadı: hız 10 ft azaldı (SRD 5.2.1). */
  armorStrengthShort?: number;
  maxHp: number;
  speed: number;
  initiative: number;
  /** Görev BARD: Jack of All Trades (yetkin olunmayan beceri kontrollerine; 0: yok). */
  jack: number;
  /** Her ability için save bonusu (proficiency ve item bonusları dahil). */
  saves: Scores;
  /** Görev WS92: kurtarmalara eşyalardan gelen toplam ek (Wild Shape biçiminde eşya kaynaşır, ek düşer). */
  itemSaveBonus?: number;
  saveProficiencies: Ability[];
  /** Yetkin olunan becerilerin bonusları; listede olmayanın bonusu ability modifier'ıdır. */
  skills: Partial<Record<Skill, number>>;
  spellSaveDc: number | null;
  spellAttack: number | null;
  /** 1.–9. seviye büyü slotları (9 elemanlı). */
  spellSlots: number[];
  /** Görev MC3: çoklu sınıfta ayrı Pact Magic havuzu (Warlock'un yanında Spellcasting sınıfı varken; SRD 5.2.1 s. 26). */
  pactSlots?: { level: number; count: number };
  /** Görev MC3: çoklu sınıfta büyü yapabilen her sınıfın büyü DC'si ve saldırısı (o sınıfın büyü yeteneğiyle). */
  spellByClass?: Record<string, { dc: number; attack: number; mod: number }>;
}

function findArmor(name: string) {
  const found = armorList.find((a) => a.name === name);
  if (!found) throw new Error(`Zırh bulunamadı: "${name}"`);
  return found;
}

/** Görev K4: sınıf bu zırh türünde (ya da kalkanda) eğitimli mi (SRD "Armor Training"; zırhsız her zaman). */
export function armorProficient(classId: string, type: 'none' | 'light' | 'medium' | 'heavy' | 'shield' | undefined, choices?: Record<string, string>, who?: { subclassId?: string; level?: number }): boolean {
  // Görev CLERIC: seçenekli özellikten eğitim (Divine Order: Protector → Heavy).
  return !type || type === 'none' || getClass(classId).armorTraining.includes(type) || optionTraining(classId, choices).armor.includes(type)
    // Kuyruk P11: ek paket alt sınıfının `yetkinlik` ilkeli.
    || (!!who && packTraining(classId, who).armor.includes(type));
}

/**
 * Görev MC2: karakter bu zırh türünde (ya da kalkanda) eğitimli mi. Tek sınıfta `armorProficient` aynen. Çoklu sınıfta
 * (SRD 5.2.1 s. 25 "Proficiencies"): ilk sınıfın bütün eğitimi; sonraki sınıflardan yalnız "As a Multiclass Character"
 * kutusundakiler (`data/cok-sinif.json` `ek.zirh`) ve o sınıfın kazanılmış özelliklerinden gelenler (seçenekli özellik,
 * paket `yetkinlik` ilkeli; sınıf seviyesiyle).
 */
export function sheetArmorProficient(sheet: Pick<CharacterSheet, 'classId' | 'level' | 'subclassId' | 'classes' | 'featureChoices'>, type: 'none' | 'light' | 'medium' | 'heavy' | 'shield' | undefined): boolean {
  return isMultiSheet(sheet) ? mcImpl().armorProficient(sheet, type) : armorProficient(sheet.classId, type, sheet.featureChoices, sheet);
}

/** SRD 5.2.1 "Attunement": bir yaratık aynı anda en çok 3 eşyaya uyumlu olabilir. */
export const MAX_ATTUNED = 3;

/**
 * Görev K4: etkisi uygulanan eşyalar. Uyum gerektirmeyenlerin hepsi; uyum gerektirenlerden listedeki ilk 3'ü (fazlası
 * oluşturucuda sorun sayılır, eski kayıtta etkisiz kalır).
 */
export function activeItemNames(sheet: Pick<CharacterSheet, 'itemNames'> & Partial<Pick<CharacterSheet, 'yuvalar' | 'armorName' | 'shield'>>): string[] {
  let attuned = 0;
  const base = sheet.itemNames.filter((n) => {
    const it = itemList.find((i) => i.name === n);
    // Görev KATALOG-GUC-TAM D: yuva sistemine kayıtlı mühür taşı gevşek taşınınca etkisiz (yalnız yuvada; `sockets.ts`).
    if (it && socketImpl()?.isStone(it.id)) return false;
    if (!it?.attunement) return true;
    attuned += 1;
    return attuned <= MAX_ATTUNED;
  });
  const sock = sheet.yuvalar ? socketImpl()?.socketItemNames(sheet) ?? [] : [];
  return sock.length ? [...base, ...sock.filter((n) => !base.includes(n))] : base;
}

function findItem(name: string) {
  const found = itemList.find((i) => i.name === name);
  if (!found) throw new Error(`Item bulunamadı: "${name}"`);
  return found;
}

/** Geçmiş bonusu SRD 5.2.1 kalıbına uyuyor mu: +2/+1 veya +1/+1/+1. */
function checkBackgroundBonuses(bonuses: Partial<Scores>): void {
  const values = Object.values(bonuses).filter((v) => v !== 0).sort();
  const key = values.join(',');
  if (values.length > 0 && key !== '1,2' && key !== '1,1,1') {
    throw new Error(`Geçersiz geçmiş bonusu: ${JSON.stringify(bonuses)} (+2/+1 veya +1/+1/+1 olmalı)`);
  }
}

/** Geçmiş bonusları ve itemler uygulandıktan sonraki nihai skorlar. */
export function finalScores(sheet: CharacterSheet): Scores {
  const bonuses = bonusesOf(sheet);
  checkBackgroundBonuses(bonuses);
  const base = {} as Scores;
  // Kuyruk AS1b: alt soyun yetenek artışı geçmiş bonusuna ek (tavan 20; savaş sürümü ≥ 71).
  const soyUp = lineageEtki(sheet)?.yetenek ?? {};
  for (const a of ABILITIES) base[a] = Math.min(20, sheet.baseScores[a] + (bonuses[a] ?? 0) + (soyUp[a] ?? 0));
  // Seviye yuvalarındaki yetenek artışları (ASI +2/+1, feat'lerin +1'i; tavan feat'e göre).
  const s = applyIncreases(base, sheet.advancements);
  // Kuyruk 19: sınıf özelliğinden yetenek artışı (Primal Champion, Body and Mind: +4, en çok 25).
  // Görev MC2: çoklu sınıfta her sınıfın kendi seviyesiyle.
  const scoreBonus = isMultiSheet(sheet) ? mcImpl().scoreBonus(sheet) : classKit(sheet.classId, sheet.level, sheet.subclassId).scoreBonus;
  for (const b of scoreBonus) for (const a of b.abilities) s[a] = Math.max(s[a], Math.min(b.max, s[a] + b.value));
  // "Skoru en az X yap" etkisi olan itemler (sınır 20'yi aşabilir).
  for (const name of activeItemNames(sheet)) {
    const set = findItem(name).effects.setAbility;
    if (!set) continue;
    for (const a of ABILITIES) {
      const v = set[a];
      if (v !== undefined) s[a] = Math.max(s[a], v);
    }
  }
  return s;
}

/** Türden ve seçilen mirastan gelen hasar dirençleri. */
export function raceResistances(sheet: Pick<CharacterSheet, 'raceId' | 'lineageId' | 'soyKapali'>): string[] {
  const race = getRace(sheet.raceId);
  const lineageId = sheet.lineageId ?? race.defaultLineage;
  if (lineageId === undefined) return [...race.resistances];
  const lineage = race.lineages?.find((l) => l.id === lineageId);
  if (!lineage) throw new Error(`${race.name} için miras bulunamadı: "${lineageId}"`);
  return [...new Set([...race.resistances, ...lineage.resistances, ...(lineageEtki(sheet)?.direnc ?? [])])];
}

/** Sınıfın büyü slotları (9 elemanlı dizi). Büyücü olmayanlarda hepsi 0. */
export function spellSlotsFor(classId: string, level: number): number[] {
  const slots = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const casting = getClass(classId).casting;
  if (!casting) return slots;
  if (casting.type === 'full') {
    (spellSlots.full[level - 1] ?? []).forEach((n, i) => { slots[i] = n; });
  } else if (casting.type === 'half') {
    const keys = Object.keys(spellSlots.half).map(Number).filter((k) => k <= level);
    if (keys.length > 0) {
      const best = spellSlots.half[String(Math.max(...keys))] ?? [];
      best.forEach((n, i) => { slots[i] = n; });
    }
  } else {
    // Pact Magic: tek bir seviyede birkaç slot.
    const count = level < 2 ? 1 : level < 11 ? 2 : level < 17 ? 3 : 4;
    const slotLevel = level < 3 ? 1 : level < 5 ? 2 : level < 7 ? 3 : level < 9 ? 4 : 5;
    slots[slotLevel - 1] = count;
  }
  return slots;
}

/**
 * Görev MC2: karakterin büyü slotları ve büyü yeteneği sınıfı (SRD 5.2.1 s. 25–26). Tek sınıfta `spellSlotsFor` aynen.
 * Çoklu sınıfta: Spellcasting yalnız bir sınıftan geliyorsa o sınıfın kendi tablosu; iki ve daha çok Spellcasting sınıfında
 * Multiclass Spellcaster tablosu (Bard/Cleric/Druid/Sorcerer/Wizard seviyelerinin tamamı + Paladin/Ranger seviyelerinin
 * yarısı, yukarı yuvarlanır; tablo `spellSlots.full` ile aynı). Pact Magic Spellcasting sayılmaz: tek büyücü Warlock'sa
 * onun Pact slotları bu dizide (tek sınıflı Warlock gibi); başka Spellcasting sınıfı varken Pact havuzu MC3'te ayrı gelir.
 * Büyü yeteneği: ilk Spellcasting sınıfı (yoksa Pact sınıfı); sınıf başına yetenek MC3.
 */
export function sheetSpellcasting(sheet: Pick<CharacterSheet, 'classId' | 'level' | 'subclassId' | 'classes'>): { slots: number[]; castClass: string | null } {
  if (!isMultiSheet(sheet)) return { slots: spellSlotsFor(sheet.classId, sheet.level), castClass: getClass(sheet.classId).casting ? sheet.classId : null };
  const m = mcImpl().spellcasting(sheet);
  return { slots: m.slots, castClass: m.castClass };
}

/** Kuyruk K48: alt sınıfın ek beceri yetkinlikleri (alt sınıf seviyesinden; Karadul: Persuasion, Deception). */
function subclassSkills(sheet: CharacterSheet): Skill[] {
  const own = sheet.skills ?? [];
  if (isMultiSheet(sheet)) {
    // Görev MC5: çoklu sınıfta her sınıfın alt sınıf becerileri (o sınıfın seviyesiyle) ve ek sınıfın ilk seviye becerisi
    // (SRD 5.2.1 s. 25 "As a Multiclass Character": Bard, Ranger, Rogue; `ClassEntry.ekBeceri`).
    const extra: Skill[] = [];
    classesOf(sheet).forEach((e, i) => {
      const sub = e.subclassId && e.level >= 3 ? findSubclass(e.classId, e.subclassId) : undefined;
      for (const s of sub?.ekBeceriler ?? []) if (isSkill(s)) extra.push(s);
      if (i > 0 && e.ekBeceri && isSkill(e.ekBeceri)) extra.push(e.ekBeceri);
    });
    const add = [...new Set(extra)].filter((s) => !own.includes(s));
    return add.length ? [...own, ...add] : own;
  }
  const sub = sheet.subclassId && sheet.level >= 3 ? findSubclass(sheet.classId, sheet.subclassId) : undefined;
  const extra = (sub?.ekBeceriler ?? []).filter((s): s is Skill => isSkill(s) && !own.includes(s));
  return extra.length ? [...own, ...extra] : own;
}

/** Beceri listeleri geçerli mi: bilinen adlar, tekrar yok, uzmanlık yalnızca yetkin olunanlarda. */
function checkSkills(sheet: CharacterSheet): void {
  const skills = sheet.skills ?? [];
  const expertise = sheet.expertise ?? [];
  for (const s of [...skills, ...expertise]) if (!isSkill(s)) throw new Error(`Bilinmeyen beceri: "${s}"`);
  if (new Set(skills).size !== skills.length) throw new Error('Beceri yetkinliği iki kez yazılmış.');
  const bad = expertise.filter((s) => !skills.includes(s));
  if (bad.length > 0) throw new Error(`Uzmanlık yalnızca yetkin olunan beceride olur: ${bad.join(', ')}`);
}

/**
 * Sınıfın 1. seviye beceri seçimi kurala uygun mu (oluşturucu için). Sorun yoksa null.
 * `chosen` yalnızca sınıftan seçilenlerdir (geçmiş ve tür becerileri ayrı).
 */
/** `extra`: sınıf özelliklerinden gelen ek sınıf becerisi (Primal Knowledge: 3. seviyede +1). */
export function classSkillProblem(classId: string, chosen: readonly Skill[], extra = 0): string | null {
  const { from } = getClass(classId).skillChoices;
  const count = getClass(classId).skillChoices.count + extra;
  if (chosen.length !== count) return I().skillCount(count, chosen.length);
  if (new Set(chosen).size !== chosen.length) return I().skillDup;
  if (from !== 'any') {
    const bad = chosen.filter((s) => !from.includes(s));
    if (bad.length > 0) return I().skillNotInClass(bad.join(', '));
  }
  return null;
}

/** Kuyruk AS1b: alt soyun beceri bonusu (yetkin olunmayan beceride yetenek değiştiricisi + Jack üstüne). */
function withSoySkills(skills: DerivedStats['skills'], modifiers: Scores, jack: number, bonus: Partial<Record<Skill, number>> | undefined): DerivedStats['skills'] {
  if (!bonus) return skills;
  const out = { ...skills };
  for (const [k, v] of Object.entries(bonus) as Array<[Skill, number]>) out[k] = (out[k] ?? modifiers[SKILLS[k].ability] + jack) + v;
  return out;
}

export function deriveStats(sheet: CharacterSheet): DerivedStats {
  checkSkills(sheet);
  const race = getRace(sheet.raceId);
  const cls = getClass(sheet.classId);
  const ar = findArmor(sheet.armorName);
  const level = sheet.level;

  const scores = finalScores(sheet);
  const modifiers = {} as Scores;
  for (const a of ABILITIES) modifiers[a] = abilityModifier(scores[a]);
  const prof = proficiencyBonus(level);

  const fx = activeItemNames(sheet).map((n) => findItem(n).effects);
  const sum = (pick: (e: (typeof fx)[number]) => number | undefined) =>
    fx.reduce((total, e) => total + (pick(e) ?? 0), 0);

  // AC (bileşenleriyle)
  const acParts: DerivedStats['acParts'] = [];
  // Görev MC2/MC3: çoklu sınıfın parçaları tembel modülden (`mcImpl().derive`; her sınıf kendi seviyesiyle); tek sınıfta
  // `mv` yok ve hesap eskisiyle aynı.
  const mv = isMultiSheet(sheet) ? mcImpl().derive(sheet, modifiers, ar.type) : null;
  const kit = mv ? null : classKit(cls.id, level, sheet.subclassId, sheet.featureChoices);
  if (ar.type === 'none') {
    // Unarmored Defense (veriden): yetenek değiştiricileri; bazı sınıflarda kalkanla geçmez.
    // Görev MC2 (SRD 5.2.1 s. 25 "Armor Class": aynı anda yalnız bir hesap; kullanıcı kararı K8): çoklu sınıfta
    // geçerli zırhsız AC hesaplarından en yüksek olanı (eşitlikte sınıf sırasıyla ilki).
    const ud = mv ? mv.ud : kit!.unarmoredDefense;
    const udParts = ud && (ud.shield || !sheet.shield) ? ud.abilities.filter((a) => a !== 'dex').map((a) => ({ kind: a, value: modifiers[a] })) : [];
    // Görev KATALOG-1 B: eşyanın zırhsız taban AC'si (`unarmoredBase` + DEX; Kör Nokta Cübbesi 15): Mage Armor gibi taban,
    // Unarmored Defense'le toplanmaz, yüksek olan geçerli; kalkan üstüne eklenir.
    const itemBase = Math.max(0, ...fx.map((e) => e.unarmoredBase ?? 0));
    if (itemBase > 10 + udParts.reduce((n, p) => n + p.value, 0)) acParts.push({ kind: 'base', value: itemBase }, { kind: 'dex', value: modifiers.dex });
    else acParts.push({ kind: 'base', value: 10 }, { kind: 'dex', value: modifiers.dex }, ...udParts);
    // Kuyruk AS1b: alt soyun zırhsız AC farkı (Saf Kent −1).
    const soyAc = lineageEtki(sheet)?.zirhsizAc;
    if (soyAc) acParts.push({ kind: 'feat', value: soyAc, name: 'Alt soy' });
  } else {
    acParts.push({ kind: 'armor', value: ar.baseAc, name: ar.name });
    const dexPart = ar.type === 'light' ? modifiers.dex : ar.type === 'medium' ? Math.min(modifiers.dex, 2) : 0;
    if (ar.type !== 'heavy') acParts.push({ kind: 'dex', value: dexPart });
  }
  // Görev K9d: kalkanın AC'si yalnızca eğitimle (SRD 5.2.1 Armor Training: Shield).
  if (sheet.shield && (mv ? mv.shieldTrained : armorProficient(cls.id, 'shield', sheet.featureChoices, sheet))) acParts.push({ kind: 'shield', value: SHIELD.baseAc });
  const feats = featEffects(sheetFeats(sheet));
  // Defense (Fighting Style): zırh giyerken +1.
  if (feats.armoredAcBonus && ar.type !== 'none') acParts.push({ kind: 'feat', value: feats.armoredAcBonus, name: 'Defense' });
  for (const n of activeItemNames(sheet)) {
    const e = findItem(n).effects;
    // Kuyruk 19: Armor/Shield +N yalnızca zırh/kalkan varken.
    const v = (e.acBonus ?? 0) + (ar.type === 'none' && !sheet.shield ? (e.unarmoredAcBonus ?? 0) : 0)
      + (ar.type !== 'none' ? (e.armorAcBonus ?? 0) : 0) + (sheet.shield ? (e.shieldAcBonus ?? 0) : 0);
    if (v) acParts.push({ kind: 'item', value: v, name: n });
  }
  const ac = acParts.reduce((n, p) => n + p.value, 0);
  // KARAR101: kalkanın AC katkısı (kalkan parçası + eşyaların `shieldAcBonus`'u); kalkan tak/çıkar komutu bu kadar değiştirir.
  const shieldAc = !sheet.shield ? 0 : acParts.filter((p) => p.kind === 'shield').reduce((n, p) => n + p.value, 0)
    + activeItemNames(sheet).reduce((n, x) => n + (findItem(x).effects.shieldAcBonus ?? 0), 0);

  // HP
  const hd = cls.hitDie;
  const con = modifiers.con;
  // Görev MC2 (SRD 5.2.1 s. 25 "Hit Points and Hit Point Dice"): 1. seviye canı yalnız toplam seviye 1'de (ilk sınıf);
  // sonraki her seviye o seviyenin sınıfının "1. seviye sonrası" değeri. Draconic Resilience o sınıfın seviyesiyle.
  const maxHp = mv
    ? mv.hp + (race.hpPerLevel ?? 0) * level
    : Math.max(1, hd + con) +
    (level - 1) * Math.max(1, hd / 2 + 1 + con) +
    (race.hpPerLevel ?? 0) * level +
    // Görev SORCERER: Draconic Resilience (veriden: seviye başına +1).
    kit!.hpPerLevel * level;

  // Hız; zırhın Güç şartı karşılanmazsa −10 ft (SRD 5.2.1 Armor: Strength).
  // Görev K3: soy hızı (Wood Elf 35 ft).
  let speed = raceSpeed(sheet);
  const armorStrengthShort = ar.strength !== undefined && scores.str < ar.strength ? ar.strength : undefined;
  // Kuyruk AS1b: Dağ alt soyu ağır zırhın Güç şartı hız cezasını yok sayar.
  if (armorStrengthShort !== undefined && !(ar.type === 'heavy' && lineageEtki(sheet)?.agirZirhHizCezasiYok)) speed -= 10;
  // Fast Movement, Unarmored Movement (veriden).
  // Görev MC2 (kullanıcı kararı K7): çoklu sınıfta hız bonusları (Fast Movement, Unarmored Movement) toplanır.
  speed += mv ? mv.speed
    : speedBonus(cls.id, level, { type: ar.type, shield: sheet.shield }, sheet.subclassId);

  // Save'ler
  const soyEtki = lineageEtki(sheet);
  const saveBonus = sum((e) => e.saveBonus);
  // Görev MC2 (SRD 5.2.1 s. 25): temel kurtarma yetkinliği yalnız ilk sınıftan (ek sınıf kutularında kurtarma yok);
  // özellikten gelen kurtarma yetkinliği (Slippery Mind, Disciplined Survivor…) her sınıfın kendi seviyesinden.
  const kitSaves = mv ? mv.kitSaves : kit!.saveProficiencies;
  const saves = {} as Scores;
  for (const a of ABILITIES) {
    saves[a] = modifiers[a] + saveBonus + (soyEtki?.kurtarma?.[a] ?? 0) + (cls.saves.includes(a) || kitSaves.includes(a) ? prof : 0);
  }

  // Görev MC2/MC3: büyü yeteneği, slotlar ve ayrı Pact havuzu (tek sınıfta eskisiyle aynı: sınıfın kendisi).
  const casting = mv ? mcImpl().spellcasting(sheet) : null;
  const castCls = casting ? (casting.castClass ? getClass(casting.castClass) : null) : cls;
  const castMod = castCls?.casting ? modifiers[castCls.casting.ability] : 0;
  // Görev BARD: Jack of All Trades (veriden: `stat: jackOfAllTrades`).
  // Görev MC2: çoklu sınıfta herhangi bir sınıfın kazanılmış özelliğinden (sınıf seviyesiyle).
  const jack = (mv ? mv.jack : gainedFeatures(cls.id, level, sheet.subclassId).some((f) => f.mechanic?.stat === 'jackOfAllTrades' && f.mechanic.status !== 'none')) ? Math.floor(prof / 2) : 0;
  return {
    scores,
    modifiers,
    proficiency: prof,
    ac,
    acParts,
    ...(shieldAc ? { shieldAc } : {}),
    ...(armorStrengthShort !== undefined ? { armorStrengthShort } : {}),
    maxHp,
    speed,
    // Alert: inisiyatife yetkinlik bonusu.
    // Görev BARD: Jack of All Trades inisiyatife de (DEX kontrolü; yetkinlik yoksa).
    initiative: modifiers.dex + (feats.initiativeProficiency ? prof : jack),
    jack,
    saves,
    ...(saveBonus ? { itemSaveBonus: saveBonus } : {}),
    saveProficiencies: [...cls.saves, ...kitSaves.filter((a) => !cls.saves.includes(a))],
    skills: withSoySkills(skillTable(modifiers, prof, subclassSkills(sheet), sheet.expertise ?? []), modifiers, jack, soyEtki?.beceri),
    spellSaveDc: castCls?.casting ? 8 + prof + castMod : null,
    spellAttack: castCls?.casting ? prof + castMod : null,
    spellSlots: casting ? casting.slots : spellSlotsFor(cls.id, level),
    ...(casting ? mcImpl().spellExtras(casting, prof, modifiers) : {}),
  };
}
