/**
 * Görev P6: ek paket ikinci şans girişleri (tek zar çözümü girişi `effectDice.ts` `secondChances`):
 * - d20 alt sınırı (`zarEtkisi.d20AltSinir`; sahibin süren etkisi `pkD20Min`),
 * - zar mührü (`zarMuhru`: sahibinde saklı d20'ler `pkMuhur` etkileri; kendisi, menzildeki dost ya da düşman),
 * - zorla sonuç (`tepki` etkisi `zorlaSonuc`: tepki + kaynak; başarı ya da başarısızlık sayılır).
 * Kimin hangi kaynağa menzilde olduğu reducer türetimidir (`syncAuras` → `Combatant.pkSans`; replay aynı). Saf; ağır içe
 * aktarma yok.
 */
import { gap } from '../body';
import { isIncapacitated } from '../../rules/conditions';
import type { ExtraDie } from '../../rules/attack';
import type { BattleState, Combatant } from '../types';

type On = 'attack' | 'save' | 'check';
const ON: Record<string, On> = { saldiri: 'attack', kurtulma: 'save', kontrol: 'check' };
export interface PkSans {
  holderId: string;
  kind: 'muhur' | 'zorla';
  /** Testi atan, sahibin dostu (kendisi dahil) mi düşmanı mı. */
  foe: boolean;
  on: On[];
  label: string;
  /** Mühür: saklı zarlar (etki kimliği, değer). */
  values?: Array<{ effectId: string; v: number }>;
  resource?: string;
  reaction?: boolean;
}

const prims = (c: Combatant, tur: string) => (c.paket?.ozellikler ?? []).flatMap((f) => f.ilkeller.map((p, i) => ({ f, p, i }))).filter((x) => x.p.tur === tur);
const resKey = (c: Combatant, id: string) => c.paket?.kaynaklar?.[id] ?? id;
const ready = (c: Combatant) => c.hp > 0 && c.life !== 'dead' && !c.summon?.gone && !isIncapacitated(c.conditions);

/** Bu savaşta mühür ya da zorla sonuç tutan biri var mı (eşitleme hesabı yoksa atlanır). */
export const anyPaketSans = (state: BattleState): boolean =>
  Object.values(state.combatants).some((c) => c.paket && (prims(c, 'zarMuhru').length > 0 || prims(c, 'tepki').some((x) => x.p.etki === 'zorlaSonuc')));

/** `c`'nin d20 testlerine menzildeki mühür/zorla kaynakları. */
export function paketSansOf(state: BattleState, c: Combatant): PkSans[] {
  const out: PkSans[] = [];
  for (const h of Object.values(state.combatants)) {
    if (!h.paket || !ready(h)) continue;
    const foe = h.side !== c.side;
    const near = (ft: number) => h.id === c.id || !state.map || !h.pos || !c.pos || gap(state, h, c) * 5 <= ft;
    for (const { f, p } of prims(h, 'zarMuhru')) {
      const kim = (p.kim as string[] | undefined) ?? ['kendi', 'dost', 'dusman'];
      const who = h.id === c.id ? 'kendi' : foe ? 'dusman' : 'dost';
      if (!kim.includes(who) || !near((p.menzilFt as number | undefined) ?? 60)) continue;
      const values = (h.effects ?? []).filter((e) => e.pkMuhur !== undefined && e.sourceId === h.id).map((e) => ({ effectId: e.id, v: e.pkMuhur as number }))
        .sort((a, b) => (foe ? b.v - a.v : a.v - b.v));
      const k = p.kaynak as { id: string } | undefined;
      if (!values.length || (k && (h.resources[resKey(h, k.id)] ?? 0) <= 0)) continue;
      out.push({ holderId: h.id, kind: 'muhur', foe, on: ['attack', 'save', 'check'], label: (p.ad as string | undefined) ?? f.ad, values, ...(k ? { resource: resKey(h, k.id) } : {}) });
    }
    if (h.economy.reaction || h.reactionLocked) continue;
    for (const { f, p } of prims(h, 'tepki').filter((x) => x.p.etki === 'zorlaSonuc')) {
      const kim = (p.kim as string | undefined) ?? 'dost';
      if ((kim === 'kendi' && h.id !== c.id) || (kim === 'dost' && foe) || (kim === 'dusman' && !foe)) continue;
      if (!near((p.menzilFt as number | undefined) ?? 30)) continue;
      const k = p.kaynak as { id: string } | undefined;
      if (k && (h.resources[resKey(h, k.id)] ?? 0) <= 0) continue;
      const on = ((p.testler as string[] | undefined) ?? ['saldiri', 'kurtulma', 'kontrol']).map((x) => ON[x] as On);
      out.push({ holderId: h.id, kind: 'zorla', foe: kim === 'dusman', on, label: (p.ad as string | undefined) ?? f.ad, reaction: true, ...(k ? { resource: resKey(h, k.id) } : {}) });
    }
  }
  return out;
}

/** İkinci şans girişleri (`effectDice.ts` `secondChances`). */
export function paketChances(c: Combatant, on: On): ExtraDie[] {
  const out: ExtraDie[] = [];
  for (const e of c.effects ?? []) {
    if (e.pkD20Min && e.pkD20Min.on.includes(on)) out.push({ label: e.name, die: `≥${e.pkD20Min.value}`, sign: 1, reroll: 'natFloor', rerollBonus: e.pkD20Min.value, holderId: c.id });
  }
  for (const s of c.pkSans ?? []) {
    if (!s.on.includes(on)) continue;
    if (s.kind === 'muhur') {
      for (const v of s.values ?? []) {
        out.push({ label: s.label, die: `d20=${v.v}`, sign: 1, reroll: s.foe ? 'setSpoil' : 'set', rerollBonus: v.v, single: true, effectId: v.effectId, holderId: s.holderId, ...(s.resource ? { resource: s.resource } : {}) });
      }
    } else {
      out.push({ label: s.label, die: s.foe ? '✗' : '✓', sign: 1, reroll: s.foe ? 'forceFail' : 'success', effectId: `pk-zorla:${s.holderId}`, holderId: s.holderId, reaction: true, ...(s.resource ? { resource: s.resource } : {}) });
    }
  }
  return out;
}
