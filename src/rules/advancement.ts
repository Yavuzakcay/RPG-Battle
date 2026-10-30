/**
 * Seviye ilerlemesindeki seçimler (Görev N): yetenek artışı (ASI) ya da feat, Fighting Style feat'i, Epic Boon,
 * köken (origin) feat'i ve uzmanlık (Expertise) hakkı. Hangi seviyede hangi yuvanın açıldığı SRD sınıf tablosundan
 * (`data/srd/progression.json`), feat listesi SRD'den (`data/srd/feats.json`), feat'in oyundaki etkisi
 * `data/class-features.json` "feats"ten okunur. Saf fonksiyonlar.
 *
 * Boş yuva sorun sayılmaz (seçilmemiş artış: skorlar 1. seviyedeki gibi kalır); yalnızca kurala aykırı seçim sorundur.
 */
import { classData, getProgression, type FeatMechanic, type SrdFeat } from '../data';
import { ABILITIES, type Ability } from './abilities';
import { classKit } from './classFeatures';
import { originFeatOf } from './backgrounds';

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
}

export type SlotKind = 'asi' | 'epic' | 'style';
export interface AdvancementSlot { level: number; kind: SlotKind; category: string }

/** Sınıf ve seviyede açılan yuvalar (SRD tablosundaki ASI ve Epic Boon satırları, Fighting Style özelliği). */
export function advancementSlots(classId: string, level: number, subclassId?: string): AdvancementSlot[] {
  const p = getProgression(classId);
  const out: AdvancementSlot[] = [];
  for (const s of classKit(classId, level, subclassId).featSlots) out.push({ level: s.level, kind: 'style', category: s.category });
  for (const l of p.asiLevels) if (l <= level) out.push({ level: l, kind: 'asi', category: 'General' });
  for (const l of p.epicBoonLevels) if (l <= level) out.push({ level: l, kind: 'epic', category: 'Epic Boon' });
  return out.sort((a, b) => a.level - b.level || a.kind.localeCompare(b.kind));
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
export function featProblem(f: SrdFeat, slot: AdvancementSlot, ctx: { scores: Scores; casterClass: boolean }): string | null {
  if (slot.kind === 'style' && f.category !== 'Fighting Style') return `${f.name} bir Fighting Style feat'i değil.`;
  // F1: SRD 5.2.1 "Ability Score Improvement… or another feat of your choice for which you qualify": ön koşulsuz köken
  // feat'leri de (Magic Initiate, Skilled…) seviye yuvasına alınabilir.
  if (slot.kind === 'asi' && !['General', 'Origin'].includes(f.category)) return `${f.name} bu seviyede alınamaz (General ya da Origin feat ya da ASI).`;
  if (slot.kind === 'epic' && !['Epic Boon', 'General', 'Origin'].includes(f.category)) return `${f.name} bu seviyede alınamaz (Epic Boon, General ya da Origin).`;
  if (prereqLevel(f) > slot.level) return `${f.name} için en az ${prereqLevel(f)}. seviye gerekir.`;
  const pre = f.prerequisite ?? '';
  const ab = /(Strength|Dexterity) or (Strength|Dexterity) (\d+)\+/.exec(pre);
  if (ab && Math.max(ctx.scores.str, ctx.scores.dex) < Number(ab[3])) return `${f.name}: Güç ya da Çeviklik ${ab[3]}+ gerekir.`;
  if (/Spellcasting Feature/.test(pre) && !ctx.casterClass) return `${f.name}: büyü yapma özelliği gerekir.`;
  return null;
}

/** Yuvaya seçilebilen feat'ler (ön koşulu tutanlar). */
export function featOptions(slot: AdvancementSlot, ctx: { scores: Scores; casterClass: boolean }): SrdFeat[] {
  return allFeats().filter((f) => featProblem(f, slot, ctx) === null);
}

export const originFeats = (): SrdFeat[] => allFeats().filter((f) => f.category === 'Origin');

/** Seçimin yetenek artışı kurala uygun mu (ASI: +2 bir skora ya da +1 iki skora; diğerleri: tek skora +amount). */
export function increaseProblem(a: Advancement): string | null {
  const m = featMechanic(a.featId)?.abilityIncrease;
  const vals = Object.entries(a.abilities ?? {}).filter(([, v]) => v);
  if (!m) return vals.length > 0 ? `${featById(a.featId)?.name ?? a.featId} yetenek artışı vermez.` : null;
  if (vals.length === 0) return null; // henüz dağıtılmadı
  if (m.kind === 'asi') {
    const key = vals.map(([, v]) => v).sort().join(',');
    return key === '2' || key === '1,1' ? null : 'ASI: bir skora +2 ya da iki skora +1.';
  }
  if (vals.length !== 1 || vals[0]?.[1] !== (m.amount ?? 1)) return `Bir skora +${m.amount ?? 1}.`;
  const ab = vals[0]?.[0] as Ability;
  if (m.choices && !m.choices.includes(ab)) return `Yalnızca ${m.choices.map((x) => x.toUpperCase()).join(' ya da ')}.`;
  return null;
}

/** Karakterin bütün feat'leri: köken feat'i ve yuvalarda seçilenler. */
export function sheetFeats(sheet: { originFeat?: string; backgroundId?: string; advancements?: Advancement[] }): string[] {
  // Görev G1: köken feat'i geçmişten (geçmiş yoksa eski serbest seçim).
  const origin = originFeatOf(sheet);
  return [...(origin ? [origin] : []), ...(sheet.advancements ?? []).map((a) => a.featId)];
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
  offhandModifier: boolean;
} {
  const ms = featIds.map((id) => featMechanic(id)).filter((m): m is FeatMechanic => !!m && m.status !== 'missing');
  return {
    initiativeProficiency: ms.some((m) => m.initiativeProficiency),
    extraSkills: ms.reduce((n, m) => n + (m.extraSkills ?? 0), 0),
    rangedAttackBonus: Math.max(0, ...ms.map((m) => m.rangedAttackBonus ?? 0)),
    armoredAcBonus: Math.max(0, ...ms.map((m) => m.armoredAcBonus ?? 0)),
    minDamageDie: Math.max(0, ...ms.map((m) => m.minDamageDie ?? 0)),
    offhandModifier: ms.some((m) => m.offhandModifier),
  };
}

/** Seçimlerin kurala uygunluğu (oluşturucu): sorun listesi. Boş yuva sorun değildir. */
export function advancementProblems(
  sheet: { classId: string; level: number; subclassId?: string; originFeat?: string; backgroundId?: string; advancements?: Advancement[] },
  ctx: { scores: Scores; casterClass: boolean },
): string[] {
  const out: string[] = [];
  const origin = originFeatOf(sheet);
  if (origin) {
    const f = featById(origin);
    if (!f) out.push(`Bilinmeyen köken feat'i: ${origin}`);
    else if (f.category !== 'Origin') out.push(`${f.name} bir köken (Origin) feat'i değil.`);
  }
  const slots = advancementSlots(sheet.classId, sheet.level, sheet.subclassId);
  const used = new Set<string>();
  const taken: string[] = [...(origin ? [origin] : [])];
  for (const a of sheet.advancements ?? []) {
    const slot = slots.find((s) => s.level === a.level && !used.has(`${s.level}:${s.kind}`)
      && (s.kind === 'style' ? isStyleChoice(a.featId) : true));
    // Yuvanın seçeneği (Blessed Warrior): yalnızca o sınıfın Fighting Style yuvasında.
    if (slotAlternativeById(a.featId)) {
      const own = classKit(sheet.classId, sheet.level, sheet.subclassId).slotAlternatives.some((x) => x.id === a.featId && x.level === a.level);
      if (!slot || slot.kind !== 'style' || !own) { out.push(`${a.level}. seviyede ${slotAlternativeById(a.featId)?.name} için yuva yok.`); continue; }
      used.add(`${slot.level}:${slot.kind}`);
      continue;
    }
    const f = featById(a.featId);
    if (!f) { out.push(`Bilinmeyen feat: ${a.featId}`); continue; }
    if (!slot) { out.push(`${a.level}. seviyede ${f.name} için yuva yok.`); continue; }
    used.add(`${slot.level}:${slot.kind}`);
    const p = featProblem(f, slot, ctx);
    if (p) out.push(p);
    if (taken.includes(f.id) && !f.repeatable) out.push(`${f.name} bir kez alınabilir.`);
    taken.push(f.id);
    const inc = increaseProblem(a);
    if (inc) out.push(`${a.level}. seviye ${f.name}: ${inc}`);
  }
  return out;
}
