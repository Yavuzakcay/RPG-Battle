/**
 * Zar animasyonu (Görev J, yalnızca sunum): hangi zarlar oynatılır, ne kadar sürer, altına ne yazılır.
 * Kaynak `dice_rolled` olayları; yalnızca canlı gelenler oynar (kayıt yüklenince eski zarlar oynamaz).
 */
import { useState } from 'react';
import type { BattleEvent, BattleState, DiceRoll } from '../battle';
import { t } from '../i18n';

export type DiceAnimSpeed = 'normal' | 'fast' | 'off';
const KEY = 'rpg-battle-dice-anim';
const NEXT: Record<DiceAnimSpeed, DiceAnimSpeed> = { normal: 'fast', fast: 'off', off: 'normal' };

export function storedDiceAnim(): DiceAnimSpeed {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'fast' || v === 'off' ? v : 'normal';
  } catch {
    return 'normal';
  }
}

/** Ayar: Normal → Hızlı → Kapalı (varsayılan Normal), bu cihazda hatırlanır. */
export function useDiceAnimSetting(): [DiceAnimSpeed, () => void] {
  const [speed, setSpeed] = useState<DiceAnimSpeed>(storedDiceAnim);
  const cycle = () => setSpeed((s) => {
    const n = NEXT[s];
    try { localStorage.setItem(KEY, n); } catch { /* yalnızca bu oturumda */ }
    return n;
  });
  return [speed, cycle];
}

/** Süreler (ms): dönme ve sonucu gösterme. Kapalıysa null; hareketi azaltmada dönme yok, yalnızca sonuç. */
export function diceTimings(speed: DiceAnimSpeed, reducedMotion: boolean): { spin: number; show: number } | null {
  if (speed === 'off') return null;
  if (reducedMotion) return { spin: 0, show: speed === 'fast' ? 500 : 900 };
  // Normal toplam 1,5 sn (3D atış 0,75 sn + okuma 0,75 sn; Görev J3); Hızlı 0,75 sn ve her zaman 2D.
  return speed === 'fast' ? { spin: 300, show: 450 } : { spin: 750, show: 750 };
}

/** Zarların ardından gelen hasar/sonuç animasyonlarının gecikmesi (ms): bu adımın zarları kadar, en çok 3,2 sn. */
export const MAX_DICE_LEAD = 3200;
export function diceLead(groups: number, timings: { spin: number; show: number } | null): number {
  return timings ? Math.min(MAX_DICE_LEAD, groups * (timings.spin + timings.show)) : 0;
}

/** `from` sırasından sonraki olaylardaki zar grupları (canlı gelenler). */
export function liveDiceRolls(events: readonly BattleEvent[], from: number): DiceRoll[] {
  return events.slice(from).flatMap((e) => (e.type === 'dice_rolled' ? e.rolls : []));
}

/**
 * Animasyonun başlangıç noktası: kayıttan yüklenen oturumda bütün olaylar görülmüş sayılır (oynamaz);
 * yeni kurulan savaşta inisiyatif zarları da oynar.
 */
export const diceSeenAtStart = (events: readonly BattleEvent[], restored: boolean): number => (restored ? events.length : 0);

/** d20'de sayılan zarın sırası (avantajda yüksek, dezavantajda düşük; öteki soluk). */
export function keptIndex(r: DiceRoll): number {
  if (r.sides !== 20 || r.values.length < 2) return 0;
  const pick = r.mode === 'disadvantage' ? Math.min(...r.values) : Math.max(...r.values);
  return r.values.indexOf(pick);
}

const sign = (n: number) => (n >= 0 ? `+${n}` : `−${Math.abs(n)}`);

/** Zar grubunun yazısı: "d20: 14 +5 = 19", "2d6: 3 + 5 +3 = 11"; kritik (doğal 20) ve kritik hata (doğal 1). */
export function diceCaption(r: DiceRoll): { text: string; crit: boolean; fumble: boolean } {
  const D = t().dice;
  const bonus = r.bonus ?? 0;
  if (r.sides === 20) {
    const kept = r.values[keptIndex(r)] ?? 0;
    const text = bonus ? `d20: ${kept} ${sign(bonus)} = ${kept + bonus}` : `d20: ${kept}`;
    return { text, crit: kept === 20, fumble: kept === 1 };
  }
  const sum = r.values.reduce((a, b) => a + b, 0);
  const head = `${r.values.length > 1 ? r.values.length : ''}d${r.sides}${r.critical ? ` (${D.critDice})` : ''}`;
  const parts = r.values.length > 1 ? `${r.values.join(' + ')}` : `${r.values[0] ?? 0}`;
  const text = bonus ? `${head}: ${parts} ${sign(bonus)} = ${sum + bonus}` : r.values.length > 1 ? `${head}: ${parts} = ${sum}` : `${head}: ${parts}`;
  return { text, crit: false, fumble: false };
}

/** Tepside başlık: "Mira — Saldırı" (atan yoksa yalnızca zarın amacı). */
export function diceTitle(r: DiceRoll, state: BattleState): string {
  const D = t().dice;
  const kind = D.kind[r.kind ?? 'other'] ?? D.kind.other ?? '';
  const who = r.by ? state.combatants[r.by]?.name : undefined;
  return who ? `${who} — ${kind}` : kind;
}
