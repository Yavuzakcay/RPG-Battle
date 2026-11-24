/**
 * Seviye ilerlemesindeki seçimler (Görev N): yetenek artışı (ASI) ya da feat, Fighting Style feat'i, Epic Boon,
 * köken (origin) feat'i ve uzmanlık (Expertise) hakkı. Hangi seviyede hangi yuvanın açıldığı SRD sınıf tablosundan
 * (`data/srd/progression.json`), feat listesi SRD'den (`data/srd/feats.json`), feat'in oyundaki etkisi
 * `data/class-features.json` "feats"ten okunur. Saf fonksiyonlar.
 *
 * Boş yuva sorun sayılmaz (seçilmemiş artış: skorlar 1. seviyedeki gibi kalır); yalnızca kurala aykırı seçim sorundur.
 */
import { lessonsFeats } from './backgrounds';
import { classData, getClass, getProgression, type FeatMechanic, type SrdFeat } from '../data';
import { ABILITIES, type Ability } from './abilities';
import { classKit } from './classFeatures';
import { originFeatOf, speciesFeatOf } from './backgrounds';
import { I } from './issueText';
import { classesOf, isMulticlass } from './multiclass';
import type { ClassEntry } from './stats';

export type Scores = Record<Ability, number>;

/** Bir seviye yuvasında yapılan seçim. */
export interface Advancement {
  /** Yuvanın seviyesi (ASI: 4, 8…; Fighting Style: 1 ya da 2; Epic Boon: 19). */
  level: number;
  /** Seçilen feat'in SRD kimliği ("ability-score-improvement" dahil). */
  featId: string;
  /** Yetenek artışı: ASI'de +2 bir skora ya da +1 iki skora; diğer feat'lerde seçilen skora +1. */
  abilities?: Partial<Scores>;
  /** F1: Magic Initiate'in büyü listesi (cleric, druid, wizard); seçimler `sheet.magicInitiate[list]`. */
  list?: string;
  /** Görev MC1: yuvanın sınıfı (çoklu sınıfta iki sınıfın aynı seviyeli yuvaları ayrılır); yoksa ilk sınıf. */
  classId?: string;
}

export type SlotKind = 'asi' | 'epic' | 'style';
/** `classId`: Görev MC2, çoklu sınıfta yuvanın sınıfı (`sheetAdvancementSlots`); tek sınıfta yok. */
export interface AdvancementSlot { level: number; kind: SlotKind; category: string; classId?: string }

/** Sınıf ve seviyede açılan yuvalar (SRD tablosundaki ASI ve Epic Boon satırları, Fighting Style özelliği). */
export function advancementSlots(classId: string, level: number, subclassId?: string): AdvancementSlot[] {
  const p = getProgression(classId);
  const out: AdvancementSlot[] = [];
  for (const s of classKit(classId, level, subclassId).featSlots) out.push({ level: s.level, kind: 'style', category: s.category });
  for (const l of p.asiLevels) if (l <= level) out.push({ level: l, kind: 'asi', category: 'General' });
  for (const l of p.epicBoonLevels) if (l <= level) out.push({ level: l, kind: 'epic', category: 'Epic Boon' });
  return out.sort((a, b) => a.level - b.level || a.kind.localeCompare(b.kind));
}

/**
 * Görev MC2: karakterin bütün seviye yuvaları. Tek sınıfta `advancementSlots` aynen. Çoklu sınıfta her sınıfın yuvaları
 * kendi sınıf seviyesiyle ve `classId` ile (ASI 4, 8… sınıf seviyesi; iki sınıfın 4. seviye yuvaları ayrı).
 */
export function sheetAdvancementSlots(sheet: { classId: string; level: number; subclassId?: string; classes?: ClassEntry[] }): AdvancementSlot[] {
  if (!isMulticlass(sheet)) return advancementSlots(sheet.classId, sheet.level, sheet.subclassId);
  return classesOf(sheet).flatMap((e) => advancementSlots(e.classId, e.level, e.subclassId).map((x) => ({ ...x, classId: e.classId })));
}

export const allFeats = (): SrdFeat[] => classData.feats;
export const featById = (id: string): SrdFeat | undefined => classData.feats.find((f) => f.id === id);
export const featMechanic = (id: string): FeatMechanic | undefined => classData.mechanics.feats[id];

/** Fighting Style yuvasında feat yerine seçilebilen seçenek (Blessed Warrior; özelliğin verisinden). */
export function slotAlternativeById(id: string) {
  for (const m of Object.values(classData.mechanics.features)) {
    const alt = (m.alternatives ?? []).find((a) => a.id === id);
    if (alt) return alt;
  }
  return undefined;
}

/** Seçim Fighting Style yuvasına mı ait (Fighting Style feat'i ya da yuvanın seçeneği). */
export const isStyleChoice = (id: string): boolean => featById(id)?.category === 'Fighting Style' || !!slotAlternativeById(id);

/** Ön koşuldaki en düşük seviye ("Level 4+" → 4). */
function prereqLevel(f: SrdFeat): number {
  const m = /Level (\d+)\+/.exec(f.prerequisite ?? '');
  return m ? Number(m[1]) : 0;
}

/** Feat bu yuvaya ve karaktere uygun mu; uygunsa null, değilse nedeni. */
export function featProblem(f: SrdFeat, slot: AdvancementSlot, ctx: FeatCtx): string | null {
  if (slot.kind === 'style' && f.category !== 'Fighting Style') return I().featNotStyle(f.name);
  // F1: SRD 5.2.1 "Ability Score Improvement… or another feat of your choice for which you qualify": ön koşulsuz köken
  // feat'leri de (Magic Initiate, Skilled…) seviye yuvasına alınabilir. Görev TE99 (SRD 5.2.1 s. 87 "Fighting Style Feat
  // (Prerequisite: Fighting Style Feature)"): Fighting Style özelliği olan sınıf ASI/Epic yuvasında da alır.
  const style = f.category === 'Fighting Style' && !!ctx.hasStyle;
  if (slot.kind === 'asi' && !['General', 'Origin'].includes(f.category) && !style) return I().featNotAsi(f.name);
  if (slot.kind === 'epic' && !['Epic Boon', 'General', 'Origin'].includes(f.category) && !style) return I().featNotEpic(f.name);
  if (prereqLevel(f) > slot.level) return I().featLevel(f.name, prereqLevel(f));
  const pre = f.prerequisite ?? '';
  const ab = /(Strength|Dexterity) or (Strength|Dexterity) (\d+)\+/.exec(pre);
  if (ab && Math.max(ctx.scores.str, ctx.scores.dex) < Number(ab[3])) return I().featAbility(f.name, ab[3] as string);
  if (/Spellcasting Feature/.test(pre) && !ctx.casterClass) return I().featSpellcasting(f.name);
  return null;
}

/** Yuvaya seçilebilen feat'ler (ön koşulu tutanlar). */
/**
 * Feat ön koşul bağlamı. `casterClass`: Spellcasting özelliği (Görev TE99: SRD 5.2.1 s. 24 çoklu sınıf "the Pact Magic feature
 * … and the Spellcasting feature": Pact Magic Spellcasting sayılmaz; `casterCtx`). `hasStyle`: Fighting Style özelliği.
 */
export interface FeatCtx { scores: Scores; casterClass: boolean; hasStyle?: boolean }
/** Görev TE99: sınıfın Spellcasting (Pact Magic değil) ve Fighting Style özellikleri. */
export function casterCtx(classId: string, level: number, subclassId?: string): Pick<FeatCtx, 'casterClass' | 'hasStyle'> {
  const casting = getClass(classId).casting;
  return { casterClass: !!casting && casting.type !== 'pact', hasStyle: advancementSlots(classId, level, subclassId).some((s) => s.kind === 'style') };
}
/**
 * Görev MC2: karakterin feat bağlamı. Tek sınıfta `casterCtx` aynen; çoklu sınıfta herhangi bir sınıfın Spellcasting'i ya da
 * Fighting Style özelliği (sınıf seviyesiyle).
 */
export function sheetCasterCtx(sheet: { classId: string; level: number; subclassId?: string; classes?: ClassEntry[] }): Pick<FeatCtx, 'casterClass' | 'hasStyle'> {
  if (!isMulticlass(sheet)) return casterCtx(sheet.classId, sheet.level, sheet.subclassId);
  const all = classesOf(sheet).map((e) => casterCtx(e.classId, e.level, e.subclassId));
  return { casterClass: all.some((x) => x.casterClass), hasStyle: all.some((x) => x.hasStyle) };
}
export function featOptions(slot: AdvancementSlot, ctx: FeatCtx): SrdFeat[] {
  return allFeats().filter((f) => featProblem(f, slot, ctx) === null);
}

export const originFeats = (): SrdFeat[] => allFeats().filter((f) => f.category === 'Origin');

/** Seçimin yetenek artışı kurala uygun mu (ASI: +2 bir skora ya da +1 iki skora; diğerleri: tek skora +amount). */
export function increaseProblem(a: Advancement): string | null {
  const m = featMechanic(a.featId)?.abilityIncrease;
  const vals = Object.entries(a.abilities ?? {}).filter(([, v]) => v);
  if (!m) return vals.length > 0 ? I().noIncrease(featById(a.featId)?.name ?? a.featId) : null;
  if (vals.length === 0) return null; // henüz dağıtılmadı
  if (m.kind === 'asi') {
    const key = vals.map(([, v]) => v).sort().join(',');
    return key === '2' || key === '1,1' ? null : I().asiRule;
  }
  if (vals.length !== 1 || vals[0]?.[1] !== (m.amount ?? 1)) return I().oneScore(m.amount ?? 1);
  const ab = vals[0]?.[0] as Ability;
  if (m.choices && !m.choices.includes(ab)) return I().onlyAbilities(m.choices.map((x) => x.toUpperCase()).join(I().orWord));
  return null;
}

/** Karakterin bütün feat'leri: köken feat'i ve yuvalarda seçilenler. */
export function sheetFeats(sheet: { originFeat?: string; backgroundId?: string; advancements?: Advancement[]; invocations?: string[]; raceId?: string; speciesFeat?: string }): string[] {
  // Görev G1: köken feat'i geçmişten (geçmiş yoksa eski serbest seçim).
  const origin = originFeatOf(sheet);
  // Görev TE99 (SRD 5.2.1 s. 86): Human Versatile ek köken feat'i.
  const species = speciesFeatOf(sheet);
  // Kuyruk 19: Lessons of the First Ones (Warlock) köken feat'leri.
  return [...(origin ? [origin] : []), ...(species ? [species] : []), ...(sheet.advancements ?? []).map((a) => a.featId), ...lessonsFeats(sheet.invocations).map((x) => x.split('@')[0] as string)];
}

/** Yetenek artışlarını sırayla uygular (her feat'in kendi tavanı: ASI 20, Epic Boon 30). */
export function applyIncreases(scores: Scores, advancements: Advancement[] = []): Scores {
  const out = { ...scores };
  for (const a of [...advancements].sort((x, y) => x.level - y.level)) {
    const max = featMechanic(a.featId)?.abilityIncrease?.max ?? 20;
    for (const ab of ABILITIES) {
      const v = a.abilities?.[ab] ?? 0;
      if (v) out[ab] = Math.max(out[ab], Math.min(max, out[ab] + v));
    }
  }
  return out;
}

/** Yetenek artışı (ASI) feat'inin kimliği. */
export const ASI_FEAT = 'ability-score-improvement';
/** Bir ASI yuvasının puanı (SRD: bir skora +2 ya da iki skora +1). */
export const ASI_POINTS = 2;

/** Yuvada kullanılan ASI puanı. */
const spent = (a: Advancement | undefined): number =>
  Object.values(a?.abilities ?? {}).reduce((n, v) => n + (v ?? 0), 0);

/** ASI yuvasında kalan puan (yuva boşsa ya da ASI seçiliyse); feat seçiliyse 0. */
export function asiPointsLeft(a: Advancement | undefined): number {
  if (a && a.featId !== ASI_FEAT) return 0;
  return Math.max(0, ASI_POINTS - spent(a));
}

/** Yuvanın seviyesinden önceki skorlar (taban + daha önceki yuvaların artışları). */
export function scoresBeforeSlot(base: Scores, advancements: Advancement[] = [], level: number): Scores {
  return applyIncreases(base, advancements.filter((a) => a.level < level));
}

/** Bu yuvada bu yeteneğe +1 verilebilir mi: puan kaldı, skor ASI tavanını (20) aşmaz. */
export function asiCanRaise(before: Scores, a: Advancement | undefined, ab: Ability): boolean {
  if (asiPointsLeft(a) <= 0) return false;
  const max = featMechanic(ASI_FEAT)?.abilityIncrease?.max ?? 20;
  return before[ab] + (a?.abilities?.[ab] ?? 0) + 1 <= max;
}

/**
 * ASI yuvasında bir yeteneğe +1 (`step` 1) ya da bu yuvadaki artışı geri alma (`step` −1). Yuva boşsa ASI olarak
 * açılır; geri alma yalnızca bu yuvadaki artış kadar. Kural dışı adımda yuva değişmez.
 */
export function asiStep(before: Scores, slotLevel: number, a: Advancement | undefined, ab: Ability, step: 1 | -1): Advancement | undefined {
  if (a && a.featId !== ASI_FEAT) return a;
  const cur = a?.abilities?.[ab] ?? 0;
  if (step === 1 && !asiCanRaise(before, a, ab)) return a;
  if (step === -1 && cur <= 0) return a;
  const abilities: Partial<Scores> = { ...(a?.abilities ?? {}) };
  if (cur + step === 0) delete abilities[ab]; else abilities[ab] = cur + step;
  return { level: slotLevel, featId: ASI_FEAT, abilities };
}

/**
 * Havuz (Görev M4): yetenek artışı seçilen bütün yuvaların puanı tek havuzda. + puanı en erken uygun yuvaya koyar
 * (yuvanın 2 puanı ve skorun 20 tavanı korunur), − en son yuvadaki artışı geri alır. `levels`: ASI seçili ya da boş
 * yuvaların seviyeleri (feat seçilenler havuza girmez).
 */
export function poolLeft(advancements: Advancement[] = [], levels: number[]): number {
  return levels.reduce((n, l) => n + asiPointsLeft(asiAt(advancements, l)), 0);
}

const asiAt = (advancements: Advancement[], level: number): Advancement | undefined =>
  advancements.find((a) => a.level === level && !isStyleChoice(a.featId));

/** Havuzdan bu yeteneğe +1 (olmuyorsa null). */
export function poolRaise(base: Scores, advancements: Advancement[] = [], levels: number[], ab: Ability): Advancement[] | null {
  const now = applyIncreases(base, advancements)[ab];
  for (const l of [...levels].sort((x, y) => x - y)) {
    const a = asiAt(advancements, l);
    if (a && a.featId !== ASI_FEAT) continue;
    if (!asiCanRaise(scoresBeforeSlot(base, advancements, l), a, ab)) continue;
    const next = [...advancements.filter((x) => x !== a), asiStep(scoresBeforeSlot(base, advancements, l), l, a, ab, 1) as Advancement]
      .sort((x, y) => x.level - y.level);
    if (applyIncreases(base, next)[ab] > now) return next;
  }
  return null;
}

/** Bu yeteneğe seviyelerden gelen artışın sonuncusunu geri alır (yoksa null). */
export function poolLower(advancements: Advancement[] = [], levels: number[], ab: Ability): Advancement[] | null {
  for (const l of [...levels].sort((x, y) => y - x)) {
    const a = asiAt(advancements, l);
    if (!a || a.featId !== ASI_FEAT || !(a.abilities?.[ab])) continue;
    const step = asiStep({} as Scores, l, a, ab, -1) as Advancement;
    return advancements.map((x) => (x === a ? step : x));
  }
  return null;
}

/** Havuzdaki yuvalarda bu yeteneğe verilen toplam artış. */
export function poolSpent(advancements: Advancement[] = [], levels: number[], ab: Ability): number {
  return levels.reduce((n, l) => {
    const a = asiAt(advancements, l);
    return n + (a?.featId === ASI_FEAT ? a.abilities?.[ab] ?? 0 : 0);
  }, 0);
}

/** Feat etkilerinin toplamı (deriveStats ve silah saldırısı için). */
export function featEffects(featIds: string[]): {
  initiativeProficiency: boolean; extraSkills: number; rangedAttackBonus: number; armoredAcBonus: number; minDamageDie: number;
  offhandModifier: boolean; traits: string[];
} {
  const ms = featIds.map((id) => featMechanic(id)).filter((m): m is FeatMechanic => !!m && m.status !== 'missing');
  return {
    initiativeProficiency: ms.some((m) => m.initiativeProficiency),
    extraSkills: ms.reduce((n, m) => n + (m.extraSkills ?? 0), 0),
    rangedAttackBonus: Math.max(0, ...ms.map((m) => m.rangedAttackBonus ?? 0)),
    armoredAcBonus: Math.max(0, ...ms.map((m) => m.armoredAcBonus ?? 0)),
    minDamageDie: Math.max(0, ...ms.map((m) => m.minDamageDie ?? 0)),
    offhandModifier: ms.some((m) => m.offhandModifier),
    traits: ms.map((m) => m.trait).filter((x): x is string => !!x),
  };
}

/** Seçimlerin kurala uygunluğu (oluşturucu): sorun listesi. Boş yuva sorun değildir. */
export function advancementProblems(
  sheet: { classId: string; level: number; subclassId?: string; originFeat?: string; backgroundId?: string; advancements?: Advancement[]; raceId?: string; speciesFeat?: string; classes?: ClassEntry[] },
  ctx: FeatCtx,
): string[] {
  const out: string[] = [];
  const origin = originFeatOf(sheet);
  if (origin) {
    const f = featById(origin);
    if (!f) out.push(I().originUnknown(origin));
    else if (f.category !== 'Origin') out.push(I().originNot(f.name));
  }
  // Görev TE99 (SRD 5.2.1 s. 86 Versatile "an Origin feat of your choice"): Human'ın ek köken feat'i.
  const species = speciesFeatOf(sheet);
  if (species) {
    const f = featById(species);
    if (!f) out.push(I().originUnknown(species));
    else if (f.category !== 'Origin') out.push(I().originNot(f.name));
    else if (species === origin && !f.repeatable) out.push(I().featOnce(f.name));
  }
  // Görev MC2: çoklu sınıfta yuva sınıfıyla eşleşir (`Advancement.classId`, yoksa ilk sınıf); tek sınıfta eskisi gibi.
  const slots = sheetAdvancementSlots(sheet);
  const slotKey = (s: AdvancementSlot) => `${s.classId ? `${s.classId}/` : ''}${s.level}:${s.kind}`;
  const ofClass = (s: AdvancementSlot, a: Advancement) => !s.classId || s.classId === (a.classId ?? sheet.classId);
  const used = new Set<string>();
  const taken: string[] = [...(origin ? [origin] : []), ...(species ? [species] : [])];
  for (const a of sheet.advancements ?? []) {
    const slot = slots.find((s) => s.level === a.level && ofClass(s, a) && !used.has(slotKey(s))
      && (s.kind === 'style' ? isStyleChoice(a.featId) : true));
    // Yuvanın seçeneği (Blessed Warrior): yalnızca o sınıfın Fighting Style yuvasında.
    if (slotAlternativeById(a.featId)) {
      const e = slot?.classId ? classesOf(sheet).find((x) => x.classId === slot.classId) : undefined;
      const own = (e ? classKit(e.classId, e.level, e.subclassId) : classKit(sheet.classId, sheet.level, sheet.subclassId)).slotAlternatives.some((x) => x.id === a.featId && x.level === a.level);
      if (!slot || slot.kind !== 'style' || !own) { out.push(I().noSlotAlt(a.level, slotAlternativeById(a.featId)?.name ?? a.featId)); continue; }
      used.add(slotKey(slot));
      continue;
    }
    const f = featById(a.featId);
    if (!f) { out.push(I().featUnknown(a.featId)); continue; }
    if (!slot) { out.push(I().noSlotAlt(a.level, f.name)); continue; }
    used.add(slotKey(slot));
    const p = featProblem(f, slot, ctx);
    if (p) out.push(p);
    if (taken.includes(f.id) && !f.repeatable) out.push(I().featOnce(f.name));
    taken.push(f.id);
    const inc = increaseProblem(a);
    if (inc) out.push(I().featLine(a.level, f.name, inc));
  }
  return out;
}
