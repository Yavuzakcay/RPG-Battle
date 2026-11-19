/**
 * G01 (yalnız görünüm; kural ve kayıt sürümü değişmez): `save_resolved` olaylarına save kipinin kaynakları (`modeWhy`).
 * 64 ayrı save kurulumu değişmez: komutun sonunda (`execute`) her save olayı için kip, merkezi hesapla (`saveModeWhy`) komut
 * öncesi durumdan yeniden kurulur. Neden yalnız atılan zarla tutarlıysa yazılır: iki zar atıldıysa (avantaj ya da dezavantaj)
 * ya da kaynaklar birbirini götürdüyse (tek zar, iki tür). Tutarsızsa (kip başka yoldan geldiyse) alan yazılmaz, günlük eskisi
 * gibi. Reducer alanı yok sayar; replay aynı. Saf.
 */
import { saveModeWhy, type SaveWhy } from './durations';
import type { BattleEvent, BattleState } from './types';

/** Bir save olayının kip kaynakları (yoksa ya da zarla tutarsızsa boş). */
export function saveWhyFor(before: BattleState, after: BattleState, e: Extract<BattleEvent, { type: 'save_resolved' }>): SaveWhy[] {
  if (!e.d20.length) return [];
  const t = before.combatants[e.targetId] ?? after.combatants[e.targetId];
  if (!t) return [];
  const src = before.combatants[e.actorId] ?? after.combatants[e.actorId];
  const { why } = saveModeWhy('normal', t, e.ability, src, e.damageType ? { damage: e.damageType } : undefined);
  const adv = why.some((w) => w.kip === 'adv'), dis = why.some((w) => w.kip === 'dis');
  const consistent = adv && dis ? e.d20.length === 1 : (adv || dis) && e.d20.length === 2;
  return consistent ? why : [];
}

/** Komutun olayları: save olaylarına `modeWhy` (yalnız gerekçe varsa). Save olayı yoksa aynı dizi. */
export function annotateSaveWhy(before: BattleState, after: BattleState, events: BattleEvent[]): BattleEvent[] {
  if (!events.some((e) => e.type === 'save_resolved' && !e.modeWhy)) return events;
  return events.map((e) => {
    if (e.type !== 'save_resolved' || e.modeWhy) return e;
    const why = saveWhyFor(before, after, e);
    return why.length ? { ...e, modeWhy: why } : e;
  });
}
