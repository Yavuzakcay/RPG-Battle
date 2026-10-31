/**
 * Kuyruk 16 K16E: kural sürümü (`data/kural-surumu.json`). Savaş durumunda `kuralSurumu` (başlangıç olayında); yoksa 1:
 * eski kayıtlar ve replay eski kurallarla aynı oynar. Sürüm 2'nin SRD 5.2.1 durum düzeltmeleri buradaki yardımcılarla.
 */
import data from '../../data/kural-surumu.json';
import { distance } from '../rules/hex';
import { lineOfFire } from './cover';
import type { BattleState, Combatant } from './types';

export const CURRENT_RULES: number = data.surum;
export const ruleVersion = (s: Pick<BattleState, 'kuralSurumu'>): number => s.kuralSurumu ?? 1;
/** Sürüm 2 (SRD 5.2.1 durum düzeltmeleri) geçerli mi. */
export const srdConditions = (s: Pick<BattleState, 'kuralSurumu'>): boolean => ruleVersion(s) >= 2;

/**
 * Korku kaynakları: Frightened'ı veren yaratıklar (süreli durum sayacının `sourceId`'si, durumu veren süren etki,
 * konsantrasyonla bağlı durum). Kaynağı bilinmeyen korkuda boş liste.
 */
export function fearSources(state: BattleState, c: Combatant): Combatant[] {
  if (!c.conditions.includes('Frightened')) return [];
  const ids = new Set<string>();
  for (const t of c.conditionTimers ?? []) if (t.condition === 'Frightened' && t.sourceId) ids.add(t.sourceId);
  for (const e of c.effects ?? []) if (e.grants?.includes('Frightened') && e.sourceId) ids.add(e.sourceId);
  for (const o of Object.values(state.combatants)) {
    if (o.concentration?.conditions?.some((x) => x.targetId === c.id && x.condition === 'Frightened')) ids.add(o.id);
  }
  ids.delete(c.id);
  return [...ids].map((id) => state.combatants[id]).filter((x): x is Combatant => !!x && x.hp > 0 && !x.summon?.gone);
}

/**
 * Frightened'ın dezavantajı şu an geçerli mi (SRD 5.2.1: "while the source of fear is within line of sight"). Sürüm 1:
 * durum varsa hep. Sürüm 2: kaynaklardan biri görüş hattındaysa (haritasız savaşta hep); kaynağı bilinmeyen korkuda hep
 * (eski davranış).
 */
export function frightenedNow(state: BattleState, c: Combatant): boolean {
  if (!c.conditions.includes('Frightened')) return false;
  if (!srdConditions(state)) return true;
  const src = fearSources(state, c);
  if (!src.length || !state.map) return true;
  return src.some((s) => !!s.pos && !!c.pos && !lineOfFire(state, c, s).blocked);
}

/**
 * Sürüm 2: korkan yaratık korku kaynağına isteyerek yaklaşamaz: adım, kaynaklardan herhangi birine uzaklığı azaltıyorsa
 * yasak (zorlama hareketi bu yoldan geçmez).
 */
export function fearBlocksStep(state: BattleState, c: Combatant): ((to: { col: number; row: number }, from: { col: number; row: number }) => boolean) | null {
  if (!srdConditions(state) || !c.conditions.includes('Frightened')) return null;
  const src = fearSources(state, c).filter((s) => s.pos);
  if (!src.length) return null;
  return (to, from) => src.some((s) => distance(to, s.pos as { col: number; row: number }) < distance(from, s.pos as { col: number; row: number }));
}

/** Yetenek kontrolünün temel kipi: sürüm 2'de korku kaynağı görüş hattındaki Frightened yaratık dezavantajlı. */
export function checkBase(state: BattleState, c: Combatant, base: 'normal' | 'advantage' | 'disadvantage' = 'normal'): 'normal' | 'advantage' | 'disadvantage' {
  if (!srdConditions(state) || !frightenedNow(state, c)) return base;
  return base === 'advantage' ? 'normal' : 'disadvantage';
}
