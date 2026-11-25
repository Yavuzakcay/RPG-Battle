/**
 * Görev MC2/MC3: çoklu sınıf hesapları (SRD 5.2.1 s. 24–26). Tembel parça: `loadClassData()` yükler ve `mcHook.ts`'e
 * kaydeder; ana parçadaki modüller yalnız çoklu sınıflı sayfada `mcImpl()` ile çağırır (tek sınıflı yol bu modüle hiç
 * dokunmaz). `data/cok-sinif.json` (`multiclass.ts`) yalnız buradan yüklenir.
 */
import { classes, getClass, spellSlots, spells, type Weapon } from '../data';
import type { Ability } from './abilities';
import { classKit, gainedFeatures, optionTraining, packTraining, speedBonus, type ClassKit } from './classFeatures';
import { armorProficient, finalScores, spellSlotsFor, type CharacterSheet, type DerivedStats, type Scores } from './stats';
import { weaponProficient } from './mastery';
import { classesOf } from './mcHook';
import { multiclassInfo, multiclassProblems, type MulticlassProblem } from './multiclass';
import { rollDie, type Rng } from './dice';
import type { RestState } from './rest';
import type { CharacterStatus } from './characterRest';
import { alternativeCantrips, needsSubclass, spellLimits, spellOptions, tomeCantrips } from './builder';
import { advancementSlots, casterCtx, type AdvancementSlot, type FeatCtx } from './advancement';
import { subclassLevel } from './classFeatures';
import { SKILLS } from './skills';
import { I, IMc } from './issueText';

type Sheet = Pick<CharacterSheet, 'classId' | 'level' | 'subclassId' | 'classes' | 'featureChoices'>;
type Die = 6 | 8 | 10 | 12;

/** Çoklu sınıfın büyü yapısı (SRD 5.2.1 s. 25–26). */
export interface McSpellcasting {
  /** Spellcasting yuvaları (tek Spellcasting sınıfında onun tablosu, 2+ sınıfta Multiclass Spellcaster tablosu). */
  slots: number[];
  /** Varsayılan büyü yeteneğinin sınıfı (ilk Spellcasting sınıfı; yoksa Pact sınıfı). */
  castClass: string | null;
  /** Ayrı Pact Magic havuzu: yalnız Warlock'un yanında Spellcasting sınıfı varken (yoksa Pact yuvaları `slots`'ta). */
  pact: { level: number; count: number; classId: string } | null;
  /** Büyü yapabilen sınıf → büyü yeteneği. */
  abilities: Record<string, Ability>;
}

function pactOf(classId: string, level: number): { level: number; count: number; classId: string } {
  const arr = spellSlotsFor(classId, level);
  const i = arr.findIndex((n) => n > 0);
  return { level: i + 1, count: arr[i] ?? 0, classId };
}

/** Ana parçaya kaydedilen çoklu sınıf uygulaması. */
export const MC_IMPL = {
  /** Zırh eğitimi: ilk sınıfın tamamı; sonrakilerden kutu (`ek.zirh`) + o sınıfın kazanılmış özellikleri. */
  armorProficient(sheet: Sheet, type: 'none' | 'light' | 'medium' | 'heavy' | 'shield' | undefined): boolean {
    if (!type || type === 'none') return true;
    return classesOf(sheet).some((e, i) => i === 0
      ? armorProficient(e.classId, type, sheet.featureChoices, { subclassId: e.subclassId, level: e.level })
      : (multiclassInfo(e.classId)?.ek.zirh ?? []).includes(type) || optionTraining(e.classId, sheet.featureChoices).armor.includes(type)
        || packTraining(e.classId, { subclassId: e.subclassId, level: e.level }).armor.includes(type));
  },

  /** Silah yetkinliği: ilk sınıfın tamamı; sonrakilerden kutudaki Martial silahlar + o sınıfın özellikleri. */
  weaponProficient(sheet: Sheet, weapon: Weapon): boolean {
    return classesOf(sheet).some((e, i) => i === 0
      ? weaponProficient(e.classId, weapon, sheet.featureChoices, { subclassId: e.subclassId, level: e.level })
      : weapon.category === 'simple' || ((multiclassInfo(e.classId)?.ek.silah ?? []).includes('martial') && weapon.category === 'martial')
        || optionTraining(e.classId, sheet.featureChoices).martialWeapons || packTraining(e.classId, { subclassId: e.subclassId, level: e.level }).martialWeapons);
  },

  /** Sınıf özelliğinden yetenek artışları, her sınıfın kendi seviyesiyle. */
  scoreBonus(sheet: Sheet): ClassKit['scoreBonus'] {
    return classesOf(sheet).flatMap((e) => classKit(e.classId, e.level, e.subclassId).scoreBonus);
  },

  /** Büyü yuvaları, ayrı Pact havuzu ve sınıf başına büyü yeteneği. */
  spellcasting(sheet: Sheet): McSpellcasting {
    const list = classesOf(sheet);
    const casters = list.filter((e) => { const y = multiclassInfo(e.classId)?.yuva; return y === 'tam' || y === 'yari'; });
    const pactE = list.find((e) => multiclassInfo(e.classId)?.yuva === 'pact');
    const abilities: Record<string, Ability> = {};
    for (const e of list) { const c = getClass(e.classId).casting; if (c) abilities[e.classId] = c.ability; }
    if (casters.length === 0) {
      return pactE ? { slots: spellSlotsFor(pactE.classId, pactE.level), castClass: pactE.classId, pact: null, abilities }
        : { slots: [0, 0, 0, 0, 0, 0, 0, 0, 0], castClass: null, pact: null, abilities };
    }
    const pact = pactE ? pactOf(pactE.classId, pactE.level) : null;
    if (casters.length === 1) return { slots: spellSlotsFor(casters[0]!.classId, casters[0]!.level), castClass: casters[0]!.classId, pact, abilities };
    const casterLevel = casters.reduce((n, e) => n + (multiclassInfo(e.classId)?.yuva === 'tam' ? e.level : Math.ceil(e.level / 2)), 0);
    const slots = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    (spellSlots.full[Math.min(20, casterLevel) - 1] ?? []).forEach((n, i) => { slots[i] = n; });
    return { slots, castClass: casters[0]!.classId, pact, abilities };
  },

  /**
   * `deriveStats`'in çoklu sınıf parçaları: zırhsız AC (en yüksek, K8), sınıflardan gelen can (ilk sınıfın 1. seviyesi tam,
   * sonrası her sınıfın "1. seviye sonrası"; Draconic Resilience o sınıfın seviyesiyle), hız bonusu (toplanır, K7),
   * özellikten gelen kurtarma yetkinlikleri, Jack of All Trades, kalkan eğitimi.
   */
  derive(sheet: Sheet & { shield: boolean }, modifiers: Scores, armorType: 'none' | 'light' | 'medium' | 'heavy') {
    const kits = classesOf(sheet).map((e) => ({ e, kit: classKit(e.classId, e.level, e.subclassId, sheet.featureChoices) }));
    const con = modifiers.con;
    const fits = (u: ClassKit['unarmoredDefense']) => !!u && (u.shield || !sheet.shield);
    const udValue = (u: NonNullable<ClassKit['unarmoredDefense']>) => u.abilities.filter((a) => a !== 'dex').reduce((n, a) => n + modifiers[a], 0);
    const ud = kits.map((k) => k.kit.unarmoredDefense).filter(fits).reduce<ClassKit['unarmoredDefense']>((best, u) => (!best || udValue(u!) > udValue(best) ? u : best), null);
    const hp = Math.max(1, getClass(kits[0]!.e.classId).hitDie + con)
      + kits.reduce((n, { e, kit: k }, i) => n + (i === 0 ? e.level - 1 : e.level) * Math.max(1, getClass(e.classId).hitDie / 2 + 1 + con) + k.hpPerLevel * e.level, 0);
    const speed = kits.reduce((n, { e }) => n + speedBonus(e.classId, e.level, { type: armorType, shield: sheet.shield }, e.subclassId), 0);
    const kitSaves = [...new Set(kits.flatMap((k) => k.kit.saveProficiencies))];
    const jack = kits.some(({ e }) => gainedFeatures(e.classId, e.level, e.subclassId).some((f) => f.mechanic?.stat === 'jackOfAllTrades' && f.mechanic.status !== 'none'));
    return { ud, hp, speed, kitSaves, jack, shieldTrained: MC_IMPL.armorProficient(sheet, 'shield') };
  },

  /** Can zarı havuzu (zar türü → sayı; aynı türler birleşir). */
  hitDicePool(sheet: Sheet): Partial<Record<Die, number>> {
    const pool: Partial<Record<Die, number>> = {};
    for (const e of classesOf(sheet)) { const d = getClass(e.classId).hitDie; pool[d] = (pool[d] ?? 0) + e.level; }
    return pool;
  },

  /** Harcanan zarlar havuza kırpılır; boşsa yazılmaz. */
  spentBy(sheet: Sheet, by: CharacterStatus['hitDiceSpentBy']): Pick<CharacterStatus, 'hitDiceSpentBy'> {
    if (!by) return {};
    const pool = MC_IMPL.hitDicePool(sheet);
    const out: Partial<Record<Die, number>> = {};
    for (const [d, n] of Object.entries(by)) { const v = Math.min(pool[Number(d) as Die] ?? 0, Math.max(0, n ?? 0)); if (v > 0) out[Number(d) as Die] = v; }
    return Object.keys(out).length ? { hitDiceSpentBy: out } : {};
  },

  /**
   * Kısa dinlenme (SRD 5.2.1 s. 25, s. 187): `dice` kadar zar, havuzda kalanlardan büyük zardan başlayarak; her biri zar +
   * CON, en az 1. Türü kayıtlı olmayan harcanmış zarlar (tek sınıftan çoklu sınıfa geçen kayıt) büyük zardan düşülür.
   */
  shortRest(sheet: Sheet & { level: number }, s: CharacterStatus, st: RestState, dice: number, rng: Rng) {
    const pool = MC_IMPL.hitDicePool(sheet);
    const spentBy: Partial<Record<Die, number>> = { ...(MC_IMPL.spentBy(sheet, s.hitDiceSpentBy).hitDiceSpentBy ?? {}) };
    const rolls: number[] = [];
    let hp = st.hp;
    const order = ([12, 10, 8, 6] as const).filter((d) => pool[d]);
    let untracked = Math.max(0, s.hitDiceSpent - Object.values(spentBy).reduce((n, x) => n + (x ?? 0), 0));
    for (const d of order) { const take = Math.min(untracked, (pool[d] ?? 0) - (spentBy[d] ?? 0)); if (take > 0) { spentBy[d] = (spentBy[d] ?? 0) + take; untracked -= take; } }
    for (let i = 0; i < dice; i++) {
      const d = order.find((x) => (pool[x] ?? 0) - (spentBy[x] ?? 0) > 0);
      if (d === undefined) break;
      const roll = rollDie(d, rng);
      rolls.push(roll);
      hp = Math.min(st.maxHp, hp + Math.max(1, roll + st.conMod));
      spentBy[d] = (spentBy[d] ?? 0) + 1;
    }
    const spent = Object.values(spentBy).reduce((n, x) => n + (x ?? 0), 0);
    return { state: { ...st, hp, hitDiceLeft: sheet.level - spent, spellSlots: st.pactMagic ? [...st.maxSpellSlots] : [...st.spellSlots] }, rolls, healed: hp - st.hp, spentBy };
  },

  /** Slot dizisi Pact mı (kısa dinlenmede dolar): yalnız tek büyücü Warlock'sa. */
  pactArray(sheet: Sheet): boolean {
    const c = MC_IMPL.spellcasting(sheet).castClass;
    return !!c && getClass(c).casting?.type === 'pact';
  },

  /** Çoklu sınıf sorunları (yapılandırılmış; metni oluşturucu verir). */
  problems(sheet: Sheet, scores: Scores): MulticlassProblem[] {
    return multiclassProblems(sheet, scores, (id) => getClass(id).skillChoices.from);
  },

  /**
   * Büyünün sınıfı (SRD 5.2.1 s. 25: "Each spell you prepare is associated with one of your classes"): sayfadaki bağ
   * (`spellClass`) o sınıfın listesindeyse o; yoksa listesinde olduğu ilk büyücü sınıf. Hiçbirinde yoksa null (tür, feat,
   * eşya büyüsü: varsayılan büyü yeteneği).
   */
  spellClassOf(sheet: Sheet & Pick<CharacterSheet, 'spellClass'>, spellName: string): string | null {
    const casting = classesOf(sheet).filter((e) => getClass(e.classId).casting);
    const has = (e: { classId: string; level: number; subclassId?: string }) => spellOptions(e.classId, e.level, e.subclassId).includes(spellName);
    const bound = sheet.spellClass?.[spellName];
    const own = bound ? casting.find((e) => e.classId === bound && has(e)) : undefined;
    return (own ?? casting.find(has))?.classId ?? null;
  },

  /** Bütün hazırlanan büyülerin sınıf bağı (savaşçı kurulumu). */
  spellClassMap(sheet: Sheet & Pick<CharacterSheet, 'spellClass' | 'spellNames'>): Record<string, string> {
    const out: Record<string, string> = {};
    for (const n of sheet.spellNames ?? []) { const c = MC_IMPL.spellClassOf(sheet, n); if (c) out[n] = c; }
    return out;
  },

  /**
   * Sınıf başına hazırlama (SRD 5.2.1 s. 25 "Spells Prepared": her sınıf tek sınıflıymış gibi): her sınıfın cantrip, hazır
   * büyü ve büyü kitabı sınırı kendi seviyesiyle; bağlı olduğu sınıfın listesinde olmayan büyü. Her zaman hazır büyüler sayılmaz.
   */
  spellProblems(sheet: Sheet & Pick<CharacterSheet, 'spellClass' | 'spellNames' | 'spellbook' | 'invocations'>, skip: ReadonlySet<string>): McSpellProblem[] {
    const out: McSpellProblem[] = [];
    const casting = classesOf(sheet).filter((e) => getClass(e.classId).casting);
    const always = new Set(classesOf(sheet).flatMap((e) => classKit(e.classId, e.level, e.subclassId, sheet.featureChoices).alwaysPrepared));
    const tally: Record<string, { cantrips: number; prepared: string[] }> = {};
    for (const n of sheet.spellNames ?? []) {
      if (skip.has(n) || always.has(n)) continue;
      const sp = spells.find((x) => x.name === n);
      if (!sp) continue;
      const bound = sheet.spellClass?.[n];
      const cls = MC_IMPL.spellClassOf(sheet, n);
      if (bound && bound !== cls) out.push({ kind: 'bag', spell: n, classId: bound });
      if (!cls) continue;
      const t = (tally[cls] ??= { cantrips: 0, prepared: [] });
      if (sp.level === 0) t.cantrips += 1; else t.prepared.push(n);
    }
    for (const e of casting) {
      const lim = spellLimits(e.classId, e.level, sheet.featureChoices, sheet.invocations, e.subclassId);
      const t = tally[e.classId] ?? { cantrips: 0, prepared: [] };
      if (t.cantrips > lim.cantrips) out.push({ kind: 'cantrip', classId: e.classId, n: t.cantrips, max: lim.cantrips });
      if (t.prepared.length > lim.prepared) out.push({ kind: 'hazir', classId: e.classId, n: t.prepared.length, max: lim.prepared });
      if (lim.spellbook !== null) {
        const own = new Set(spellOptions(e.classId, e.level, e.subclassId));
        const book = (sheet.spellbook ?? t.prepared).filter((n) => own.has(n));
        if (book.length > lim.spellbook) out.push({ kind: 'kitap', classId: e.classId, n: book.length, max: lim.spellbook });
        for (const n of t.prepared) if (sheet.spellbook && !sheet.spellbook.includes(n)) out.push({ kind: 'kitapDisi', classId: e.classId, spell: n });
      }
    }
    return out;
  },

  /** `deriveStats` ekleri: ayrı Pact havuzu ve (2+ büyücü sınıfta) sınıf başına büyü DC'si/saldırısı. */
  spellExtras(m: McSpellcasting, prof: number, modifiers: Scores): Pick<DerivedStats, 'pactSlots' | 'spellByClass'> {
    const ids = Object.keys(m.abilities);
    return {
      ...(m.pact ? { pactSlots: { level: m.pact.level, count: m.pact.count } } : {}),
      ...(ids.length > 1 ? { spellByClass: Object.fromEntries(ids.map((id) => { const v = modifiers[m.abilities[id]!]; return [id, { dc: 8 + prof + v, attack: prof + v, mod: v }]; })) } : {}),
    };
  },

  /** Seviye yuvaları, her sınıfın kendi seviyesiyle ve `classId` ile. */
  advancementSlots(sheet: Sheet): AdvancementSlot[] {
    return classesOf(sheet).flatMap((e) => advancementSlots(e.classId, e.level, e.subclassId).map((x) => ({ ...x, classId: e.classId })));
  },

  /** Feat bağlamı: herhangi bir sınıfın Spellcasting'i ya da Fighting Style özelliği. */
  casterCtx(sheet: Sheet): Pick<FeatCtx, 'casterClass' | 'hasStyle'> {
    const all = classesOf(sheet).map((e) => casterCtx(e.classId, e.level, e.subclassId));
    return { casterClass: all.some((x) => x.casterClass), hasStyle: all.some((x) => x.hasStyle) };
  },

  /**
   * Oluşturucu sorunları (TR/EN `issues`): sınıf başına alt sınıf (o sınıfın alt sınıf seviyesinde), ön koşul ve sınır
   * (`multiclassProblems`), sınıf başına büyü hazırlama (`spellProblems`).
   */
  issueTexts(s: CharacterSheet): string[] {
    const out: string[] = [];
    for (const e of classesOf(s)) if (!e.subclassId && needsSubclass(e)) out.push(IMc().mcSubclass(className(e.classId), subclassLevel(e.classId) ?? 0));
    try { out.push(...MC_IMPL.problems(s, finalScores(s)).map(problemText)); } catch (e) { out.push(e instanceof Error ? e.message : String(e)); }
    const skip = new Set([...alternativeCantrips(s).options, ...tomeCantrips(s).options]);
    out.push(...MC_IMPL.spellProblems(s, skip).map(spellText));
    return out;
  },
};
export type McImpl = typeof MC_IMPL;

const className = (id: string): string => classes.find((k) => k.id === id)?.name ?? id;
const problemText = (p: MulticlassProblem): string => {
  switch (p.kind) {
    case 'cok': return IMc().mcTooMany(p.max, p.count);
    case 'tekrar': return IMc().mcDuplicate(className(p.classId));
    case 'bilinmeyen': return I().classMissing;
    case 'seviye': return IMc().mcLevel(className(p.classId), p.level);
    case 'toplam': return IMc().mcTotal(p.total, p.max);
    case 'onKosul': return IMc().mcPrereq(className(p.classId), p.abilities.map((a) => a.toUpperCase()), p.any);
    case 'ekBeceri': return IMc().mcSkill(className(p.classId), SKILLS[p.skill]?.name ?? p.skill);
  }
};
const spellText = (p: McSpellProblem): string => {
  switch (p.kind) {
    case 'cantrip': return IMc().mcSpellClass(className(p.classId), I().cantripsOver(p.n, p.max));
    case 'hazir': return IMc().mcSpellClass(className(p.classId), I().preparedOver(p.n, p.max));
    case 'kitap': return IMc().mcSpellClass(className(p.classId), I().bookOver(p.n, p.max));
    case 'kitapDisi': return IMc().mcSpellClass(className(p.classId), I().notInBook(p.spell));
    case 'bag': return IMc().mcSpellBind(p.spell, className(p.classId));
  }
};

/** Sınıf başına hazırlama sorunu. */
export type McSpellProblem =
  | { kind: 'cantrip' | 'hazir' | 'kitap'; classId: string; n: number; max: number }
  | { kind: 'kitapDisi'; classId: string; spell: string }
  | { kind: 'bag'; spell: string; classId: string };
