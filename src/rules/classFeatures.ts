/**
 * Seviyeye bağlı sınıf özelliği motoru (Görev N). Hangi özelliğin hangi seviyede geldiği SRD tablosundan
 * (`data/srd/progression.json`), ne yaptığı `data/class-features.json`'dan okunur; kodda sınıf adıyla koşul yok.
 * Özellik türleri: pasif sayı (Extra Attack, Sneak Attack zarı, hız, Unarmored Defense, uzmanlık), kaynak
 * (kullanım sayısı + yenilenme), eylem, bonus eylem, tepki ve eylemsiz (Action Surge).
 * Saf fonksiyonlar; veri `loadClassData()` ile yüklenmiş olmalı.
 */
import { classData, getProgression, type FeatureMechanic, type ResourceDef } from '../data';
import type { Ability } from './abilities';

export interface GainedFeature {
  /** `sınıf:özellik` ya da `sınıf/altsınıf:özellik`. */
  key: string;
  id: string;
  name: string;
  level: number;
  from: 'class' | 'subclass';
  mechanic?: FeatureMechanic;
}

/** Yapı taşı özellikleri (seçim ya da başka bir yerde ele alınanlar): eksik sayılmaz. */
const STRUCTURAL = new Set(['ability-score-improvement', 'epic-boon', 'subclass-feature']);

/** Sınıfın SRD alt sınıfları; ilki varsayılan (SRD 5.2.1'de her sınıfın tek alt sınıfı var). */
export function subclassesOf(classId: string) {
  return getProgression(classId).subclasses;
}
export const defaultSubclass = (classId: string): string | undefined => subclassesOf(classId)[0]?.id;
/** Alt sınıfın seçildiği seviye (SRD: 3). */
export const subclassLevel = (classId: string): number | null => getProgression(classId).subclassLevel;

/** Bu seviyeye dek kazanılan özellikler (sınıf + alt sınıf), seviye sırasıyla; aynı özellik bir kez (en düşük seviyesi). */
export function gainedFeatures(classId: string, level: number, subclassId?: string): GainedFeature[] {
  const p = getProgression(classId);
  const out: GainedFeature[] = [];
  const seen = new Set<string>();
  for (const row of p.rows) {
    if (row.level > level) break;
    for (const f of row.features) {
      if (STRUCTURAL.has(f.id) || f.id === `${classId}-subclass`) continue;
      const key = `${classId}:${f.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ key, id: f.id, name: f.name.replace(/\s*\(.*\)$/, ''), level: row.level, from: 'class', mechanic: classData.mechanics.features[key] });
    }
  }
  const sub = p.subclasses.find((s) => s.id === (subclassId ?? p.subclasses[0]?.id));
  if (sub && p.subclassLevel !== null && level >= p.subclassLevel) {
    for (const f of sub.features) {
      if (f.level > level) continue;
      const key = `${classId}/${sub.id}:${f.id}`;
      out.push({ key, id: f.id, name: f.name, level: f.level, from: 'subclass', mechanic: classData.mechanics.features[key] });
    }
  }
  return out.sort((a, b) => a.level - b.level);
}

/** SRD tablosundaki değer (o seviyenin satırı). */
export function tableValue(classId: string, level: number, column: string): number | string | null {
  const row = getProgression(classId).rows.find((r) => r.level === Math.min(20, Math.max(1, level)));
  return row?.values[column] ?? null;
}

/** Tablo değerinden sayı: "3d6" → 3, "+10 ft." → 10, sayı olduğu gibi, yok → 0. */
function numberOf(v: number | string | null): number {
  if (typeof v === 'number') return v;
  if (typeof v !== 'string') return 0;
  const dice = /^(\d+)d\d+$/.exec(v);
  if (dice) return Number(dice[1]);
  const n = /[+-]?\d+/.exec(v);
  return n ? Number(n[0]) : 0;
}

/** Özelliğin sayısal değeri: sabit, tablo sütunu ya da 0. */
function valueOf(m: FeatureMechanic, classId: string, level: number): number {
  if (m.value !== undefined) return m.value;
  if (m.column) return numberOf(tableValue(classId, level, m.column));
  return 0;
}

/** Bu seviyede birden çok kez kazanılan özelliğin sayısı (Expertise 1 ve 6 → 2). */
function timesGained(classId: string, level: number, featureId: string): number {
  return getProgression(classId).rows.filter((r) => r.level <= level && r.features.some((f) => f.id === featureId)).length;
}

export interface ArmorState { type: 'none' | 'light' | 'medium' | 'heavy'; shield: boolean }

/** Sınıf özelliklerinin pasif sayıları ve eylem seçenekleri (karakter ve savaşçı kurulurken). */
export interface ClassKit {
  features: GainedFeature[];
  /** Attack eylemindeki saldırı sayısı (Extra Attack). */
  attacksPerAction: number;
  /** Bonus eylemle yapılabilenler (Cunning Action). */
  bonusActions: Array<'dash' | 'disengage' | 'hide'>;
  /** Sneak Attack zar sayısı (d6). */
  sneakAttackDice: number;
  /** Uzmanlık hakkı (Expertise): seçilebilecek beceri sayısı. */
  expertise: number;
  /** Zırhsız AC'ye eklenen yetenekler (Unarmored Defense); null: yok. */
  unarmoredDefense: { abilities: Ability[]; shield: boolean } | null;
  /** Feat seçme yuvaları (Fighting Style). */
  featSlots: Array<{ level: number; category: string; feature: string }>;
}

export function classKit(classId: string, level: number, subclassId?: string): ClassKit {
  const features = gainedFeatures(classId, level, subclassId);
  const kit: ClassKit = { features, attacksPerAction: 1, bonusActions: [], sneakAttackDice: 0, expertise: 0, unarmoredDefense: null, featSlots: [] };
  for (const f of features) {
    const m = f.mechanic;
    if (!m || m.status === 'missing') continue;
    if (m.stat === 'attacksPerAction') kit.attacksPerAction = Math.max(kit.attacksPerAction, valueOf(m, classId, level));
    if (m.stat === 'sneakAttackDice') kit.sneakAttackDice = valueOf(m, classId, level);
    if (m.stat === 'expertise') kit.expertise += valueOf(m, classId, level) * timesGained(classId, level, f.id);
    if (m.stat === 'unarmoredDefense') kit.unarmoredDefense = { abilities: m.abilities ?? [], shield: m.shield ?? true };
    if (m.stat === 'featSlot' && m.category) kit.featSlots.push({ level: f.level, category: m.category, feature: f.key });
    for (const g of m.grants ?? []) if (!kit.bonusActions.includes(g)) kit.bonusActions.push(g);
  }
  return kit;
}

/** Zırha göre hız artışı (Fast Movement, Unarmored Movement). */
export function speedBonus(classId: string, level: number, armor: ArmorState, subclassId?: string): number {
  let bonus = 0;
  for (const f of gainedFeatures(classId, level, subclassId)) {
    const m = f.mechanic;
    if (!m || m.status === 'missing' || m.stat !== 'speed') continue;
    if (m.when === 'noHeavyArmor' && armor.type === 'heavy') continue;
    if (m.when === 'noArmorNoShield' && (armor.type !== 'none' || armor.shield)) continue;
    bonus += valueOf(m, classId, level);
  }
  return bonus;
}

// ------------------------------------------------------------------ kaynaklar

const featureList = (d: ResourceDef) => (Array.isArray(d.feature) ? d.feature : [d.feature]);

/** Kaynağın tanımı. */
export const resourceDef = (id: string): ResourceDef | undefined => classData.mechanics.resources[id];

/** Kaynağın en çok kullanım sayısı (sınıf, seviye ve yetenek değiştiricilerine göre). */
export function resourceMax(id: string, classId: string, level: number, mods: Partial<Record<Ability, number>> = {}): number {
  const d = resourceDef(id);
  if (!d) return 0;
  const has = gainedFeatures(classId, level).some((f) => featureList(d).includes(f.key));
  if (!has) return 0;
  const u = d.uses;
  if (u.column) return numberOf(tableValue(classId, level, u.column));
  if (u.byLevel) return Object.entries(u.byLevel).filter(([l]) => level >= Number(l)).reduce((n, [, v]) => Math.max(n, v), 0);
  if (u.perLevel) return u.perLevel * level;
  if (u.abilityMod) return Math.max(u.min ?? 0, mods[u.abilityMod] ?? 0);
  return u.fixed ?? 0;
}

/** Karakterin bütün sınıf kaynakları (en çok değerleriyle); sahip olmadığı kaynak listede yok. */
export function classResources(classId: string, level: number, mods: Partial<Record<Ability, number>> = {}): Record<string, number> {
  const out: Record<string, number> = {};
  for (const id of Object.keys(classData.mechanics.resources)) {
    const n = resourceMax(id, classId, level, mods);
    if (n > 0) out[id] = n;
  }
  return out;
}

/** Kaynak savaşta bir eylemle kullanılabiliyor mu (özelliği uygulanıyor). */
export function resourceUsable(id: string): boolean {
  const d = resourceDef(id);
  if (!d) return false;
  return featureList(d).some((k) => {
    const m = classData.mechanics.features[k];
    return !!m && (m.status === 'ok' || m.status === 'partial');
  });
}

export type RechargeKind = 'short' | 'long' | 'turn';

/**
 * Dinlenme ya da tur başı yenilenme: her kaynak tanımındaki kurala göre ("all" hepsi, sayı o kadar), en çok
 * değerini aşmadan. `level` kısa dinlenme eşiği (`shortFrom`) için.
 */
export function rechargeResources(
  current: Record<string, number>, max: Record<string, number>, kind: RechargeKind, level: number,
): Record<string, number> {
  const out = { ...current };
  for (const [id, cap] of Object.entries(max)) {
    const d = resourceDef(id);
    const rule = d?.recharge[kind];
    if (rule === undefined) continue;
    if (kind === 'short' && d?.recharge.shortFrom !== undefined && level < d.recharge.shortFrom) continue;
    const now = out[id] ?? 0;
    out[id] = rule === 'all' ? cap : Math.min(cap, now + rule);
  }
  return out;
}

/** Kaynak kaldıkça slotsuz yapılabilen büyü: kaynağın kimliği (yoksa undefined). */
export function freeSpellResource(spellName: string): string | undefined {
  return Object.entries(classData.mechanics.resources).find(([, d]) => d.freeSpell === spellName)?.[0];
}

// ------------------------------------------------------------------ tamlık (oluşturucu uyarısı)

/** Mekaniği eksik (missing ya da tanımsız) özellikler: bu seviyeye dek. */
export function missingFeatures(classId: string, level: number, subclassId?: string): GainedFeature[] {
  return gainedFeatures(classId, level, subclassId).filter((f) => !f.mechanic || f.mechanic.status === 'missing');
}

/** Kısmen uygulanan özellikler (notlarıyla). */
export function partialFeatures(classId: string, level: number, subclassId?: string): GainedFeature[] {
  return gainedFeatures(classId, level, subclassId).filter((f) => f.mechanic?.status === 'partial');
}

/** Sınıfın bütün özellikleri uygulanmış en yüksek seviye (0: 1. seviyede bile eksik var). Veriden hesaplanır. */
export function completeThrough(classId: string, subclassId?: string): number {
  let ok = 0;
  for (let l = 1; l <= 20; l++) {
    if (missingFeatures(classId, l, subclassId).length > 0) break;
    ok = l;
  }
  return ok;
}

/** "Deneysel" uyarısının başladığı seviye: 6 ya da sınıf daha yükseğe dek tamamsa ondan sonrası. */
export const EXPERIMENTAL_FROM = 6;
export function experimentalFrom(classId: string, subclassId?: string): number {
  return Math.max(EXPERIMENTAL_FROM, completeThrough(classId, subclassId) + 1);
}
