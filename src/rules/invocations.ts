/**
 * Görev WARLOCK: Eldritch Invocations (SRD 5.2.1; veriden: `data/class-features.json` `invocations`). Kodda sınıf adı yok:
 * Invocation'ları taşıyan özellik `stat: invocations` ile bulunur, sayısı SRD tablosunun sütunundan.
 * Seçim karakterde `invocations` (kimlik; tekrarlanabilenlerde `kimlik:Cantrip Adı`). Saf.
 */
import { classData, spells, type Invocation } from '../data';
import { gainedFeatures, tableValue } from './classFeatures';

/** Bu sınıfın Invocation özelliği ve seviyedeki sayı (yoksa null). */
export function invocationSlots(classId: string, level: number): { list: Invocation[]; count: number } | null {
  const f = gainedFeatures(classId, level).find((x) => x.mechanic?.stat === 'invocations');
  const list = f?.mechanic?.invocations;
  if (!f || !list) return null;
  const n = Number(tableValue(classId, level, f.mechanic?.column ?? ''));
  return { list, count: Number.isFinite(n) ? n : 0 };
}

/** Bütün Invocation kayıtları (veriden). */
export const allInvocations = (): Invocation[] =>
  Object.values(classData.mechanics.features).flatMap((m) => m.invocations ?? []);

/** `kimlik:Cantrip` → [kimlik, cantrip]. */
export const parseInvocation = (x: string): [string, string | undefined] => {
  const i = x.indexOf(':');
  return i < 0 ? [x, undefined] : [x.slice(0, i), x.slice(i + 1)];
};

/** Tekrarlanabilir Invocation'a uygun cantrip'ler (karakterin bildiği cantrip'lerden). */
export function eligibleCantrips(inv: Invocation, known: string[]): string[] {
  return known.filter((n) => {
    const s = spells.find((x) => x.name === n);
    if (!s || s.level !== 0 || !s.mechanics.damage) return false;
    if (inv.repeatable === 'attack') return s.mechanics.kind === 'attack';
    if (inv.repeatable === 'range') return s.rangeFt >= 10;
    return true;
  });
}

/** Seçimin sorunları (boş liste: geçerli). */
export function invocationProblems(classId: string, level: number, chosen: string[] = [], known: string[] = []): string[] {
  const slots = invocationSlots(classId, level);
  if (!slots) return chosen.length ? ['Bu sınıfta Invocation yok.'] : [];
  const out: string[] = [];
  if (chosen.length !== slots.count) out.push(`Eldritch Invocations: ${slots.count} seçilmeli (${chosen.length} seçildi).`);
  const ids = chosen.map((x) => parseInvocation(x)[0]);
  for (const x of chosen) {
    const [id, cantrip] = parseInvocation(x);
    const inv = slots.list.find((v) => v.id === id);
    if (!inv) { out.push(`Bilinmeyen Invocation: ${id}.`); continue; }
    if (level < inv.minLevel) out.push(`${inv.name} ${inv.minLevel}. seviyeden.`);
    if (inv.requires && !ids.includes(inv.requires)) out.push(`${inv.name} için önce ${slots.list.find((v) => v.id === inv.requires)?.name ?? inv.requires}.`);
    if (inv.repeatable && inv.repeatable !== 'feat' && (!cantrip || !eligibleCantrips(inv, known).includes(cantrip))) out.push(`${inv.name}: uygun bir cantrip seçilmeli.`);
    if (!inv.repeatable && ids.filter((y) => y === id).length > 1) out.push(`${inv.name} bir kez seçilir.`);
  }
  if (new Set(chosen).size !== chosen.length) out.push('Aynı Invocation aynı cantrip için iki kez seçilemez.');
  return out;
}

/** Savaşçıya geçen Invocation etkileri (seçilenlerden, seviyede geçerli ve oyunda çalışanlar). */
export interface InvocationKit {
  traits: string[];
  atWill: Record<string, 'self' | 'any'>;
  cantripMods: Record<string, { ability?: boolean; pushFt?: number; rangeFt?: number }>;
  attacks: number;
  pactWeapon: boolean;
  cantrips: number;
  preCast: string[];
}

export function invocationKit(classId: string, level: number, chosen: string[] = []): InvocationKit {
  const kit: InvocationKit = { traits: [], atWill: {}, cantripMods: {}, attacks: 1, pactWeapon: false, cantrips: 0, preCast: [] };
  const slots = invocationSlots(classId, level);
  if (!slots) return kit;
  for (const x of chosen) {
    const [id, cantrip] = parseInvocation(x);
    const inv = slots.list.find((v) => v.id === id);
    const e = inv?.effect;
    if (!inv || !e || inv.status === 'none' || level < inv.minLevel) continue;
    if (e.trait && !kit.traits.includes(e.trait)) kit.traits.push(e.trait);
    if (e.atWill) kit.atWill[e.atWill.spell] = e.atWill.self ? 'self' : 'any';
    if (e.preCast) kit.preCast.push(e.preCast);
    if (e.attacks) kit.attacks = Math.max(kit.attacks, e.attacks);
    if (e.pactWeapon) kit.pactWeapon = true;
    if (e.cantrips) kit.cantrips += e.cantrips;
    if (e.cantrip && cantrip) {
      const m = { ...kit.cantripMods[cantrip] };
      if (e.cantrip.ability) m.ability = true;
      if (e.cantrip.pushFt) m.pushFt = Math.max(m.pushFt ?? 0, e.cantrip.pushFt);
      if (e.cantrip.rangePerLevel) m.rangeFt = (m.rangeFt ?? 0) + e.cantrip.rangePerLevel * level;
      kit.cantripMods[cantrip] = m;
    }
  }
  return kit;
}
