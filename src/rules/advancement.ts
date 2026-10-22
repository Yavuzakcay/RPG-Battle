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

export type Scores = Record<Ability, number>;

/** Bir seviye yuvasında yapılan seçim. */
export interface Advancement {
  /** Yuvanın seviyesi (ASI: 4, 8…; Fighting Style: 1 ya da 2; Epic Boon: 19). */
  level: number;
  /** Seçilen feat'in SRD kimliği ("ability-score-improvement" dahil). */
  featId: string;
  /** Yetenek artışı: ASI'de +2 bir skora ya da +1 iki skora; diğer feat'lerde seçilen skora +1. */
  abilities?: Partial<Scores>;
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

/** Ön koşuldaki en düşük seviye ("Level 4+" → 4). */
function prereqLevel(f: SrdFeat): number {
  const m = /Level (\d+)\+/.exec(f.prerequisite ?? '');
  return m ? Number(m[1]) : 0;
}

/** Feat bu yuvaya ve karaktere uygun mu; uygunsa null, değilse nedeni. */
export function featProblem(f: SrdFeat, slot: AdvancementSlot, ctx: { scores: Scores; casterClass: boolean }): string | null {
  if (slot.kind === 'style' && f.category !== 'Fighting Style') return `${f.name} bir Fighting Style feat'i değil.`;
  if (slot.kind === 'asi' && f.category !== 'General') return `${f.name} bu seviyede alınamaz (General feat ya da ASI).`;
  if (slot.kind === 'epic' && !['Epic Boon', 'General'].includes(f.category)) return `${f.name} bu seviyede alınamaz (Epic Boon ya da General).`;
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
export function sheetFeats(sheet: { originFeat?: string; advancements?: Advancement[] }): string[] {
  return [...(sheet.originFeat ? [sheet.originFeat] : []), ...(sheet.advancements ?? []).map((a) => a.featId)];
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

/** Feat etkilerinin toplamı (deriveStats ve silah saldırısı için). */
export function featEffects(featIds: string[]): {
  initiativeProficiency: boolean; extraSkills: number; rangedAttackBonus: number; armoredAcBonus: number; minDamageDie: number;
} {
  const ms = featIds.map((id) => featMechanic(id)).filter((m): m is FeatMechanic => !!m && m.status !== 'missing');
  return {
    initiativeProficiency: ms.some((m) => m.initiativeProficiency),
    extraSkills: ms.reduce((n, m) => n + (m.extraSkills ?? 0), 0),
    rangedAttackBonus: Math.max(0, ...ms.map((m) => m.rangedAttackBonus ?? 0)),
    armoredAcBonus: Math.max(0, ...ms.map((m) => m.armoredAcBonus ?? 0)),
    minDamageDie: Math.max(0, ...ms.map((m) => m.minDamageDie ?? 0)),
  };
}

/** Seçimlerin kurala uygunluğu (oluşturucu): sorun listesi. Boş yuva sorun değildir. */
export function advancementProblems(
  sheet: { classId: string; level: number; subclassId?: string; originFeat?: string; advancements?: Advancement[] },
  ctx: { scores: Scores; casterClass: boolean },
): string[] {
  const out: string[] = [];
  if (sheet.originFeat) {
    const f = featById(sheet.originFeat);
    if (!f) out.push(`Bilinmeyen köken feat'i: ${sheet.originFeat}`);
    else if (f.category !== 'Origin') out.push(`${f.name} bir köken (Origin) feat'i değil.`);
  }
  const slots = advancementSlots(sheet.classId, sheet.level, sheet.subclassId);
  const used = new Set<string>();
  const taken: string[] = [...(sheet.originFeat ? [sheet.originFeat] : [])];
  for (const a of sheet.advancements ?? []) {
    const slot = slots.find((s) => s.level === a.level && !used.has(`${s.level}:${s.kind}`)
      && (s.kind === 'style' ? featById(a.featId)?.category === 'Fighting Style' : true));
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
