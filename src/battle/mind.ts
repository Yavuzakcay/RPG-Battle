/**
 * Zihin kontrolü ve yanılsama (Görev B3; SRD 5.2.1). Mevcut sistemlerin (süren etki, Command, durum bağışıklığı,
 * isabet tepkisi) üstüne küçük yardımcılar:
 * - Zorlama hareketi (`compelEvents`): Command'ın Approach ve Flee'si, Fear'in kaçışı (Dash), Suggestion'ın "uzaklaş"ı.
 *   Etkilenen yaratık sırası gelince motorca yürütülür (yapay zekâ da oyuncu da aynı): yaklaşır ya da uzaklaşır, turu biter.
 * - Protection from Evil and Good (`wardedFrom`): korunan, Aberration/Celestial/Elemental/Fey/Fiend/Undead kaynaklı
 *   Charmed ve Frightened almaz (reducer).
 * - Mirror Image (`mirrorImageHit`): isabette her kopya için d6, biri 3+ ise kopya vurulur ve yok olur.
 */
import { spells } from '../data';
import { costsFrom, distance, type Offset } from '../rules/hex';
import { rollDie, rollTag, type Rng } from '../rules/dice';
import { executeMove, moveCostFn, occupantAt, speedHexes, terrainAt } from './movement';
import { applyEvents } from './reduce';
import type { ActiveEffect, BattleEvent, BattleState, Combatant } from './types';

/** Protection from Evil and Good'un koruduğu türler (büyü verisinden; ward `disadvantageFromTypes`). */
function pfegTypes(): string[] {
  return spells.find((s) => s.id === 'protection-from-evil-and-good')?.mechanics.ward?.disadvantageFromTypes ?? [];
}

/**
 * Hedef bu kaynaktan bu durumu alamaz mı (Protection from Evil and Good: korunan türlerden Charmed ve Frightened).
 * Kaynak yaratığın türü `creatureType`; korumayı veren büyücünün konsantrasyon hedefi hedef olmalı.
 */
export function wardedFrom(state: BattleState, targetId: string, sourceId: string | undefined, condition: string): boolean {
  if (condition !== 'Charmed' && condition !== 'Frightened') return false;
  const type = sourceId ? state.combatants[sourceId]?.creatureType : undefined;
  if (!type || !pfegTypes().includes(type)) return false;
  return Object.values(state.combatants).some((c) => c.concentration?.spell === 'Protection from Evil and Good' && c.concentration.targetId === targetId);
}

/**
 * Zorlamayla hareket (sırası gelen yaratık): `approach` kaynağa en yakın (bitişikse durur), `flee` en uzak yere;
 * `dash` önce Dash. Ulaşılabilir boş altıgenler maliyetle (fırsat saldırıları ve zemin yürüyüşün kendisinde).
 */
export function compelEvents(state: BattleState, id: string, e: ActiveEffect, mode: 'approach' | 'flee', rng: Rng): BattleEvent[] {
  const c = state.combatants[id];
  const src = state.combatants[e.sourceId];
  if (!state.map || !c?.pos || !src?.pos || c.hp <= 0) return [];
  const events: BattleEvent[] = [];
  let current = state;
  if (e.fleeDash && mode === 'flee') {
    const dash: BattleEvent = { type: 'dashed', actorId: id };
    events.push(dash);
    current = applyEvents(current, [dash]);
  }
  const me = current.combatants[id] as Combatant;
  const budget = speedHexes(me) - me.movementUsed;
  if (budget <= 0) return events;
  if (mode === 'approach' && distance(me.pos as Offset, src.pos) <= 1) return events;
  const size = { cols: current.map?.tiles[0]?.length ?? 0, rows: current.map?.tiles.length ?? 0 };
  const costs = costsFrom(me.pos as Offset, size, moveCostFn(current, me), budget);
  const here = distance(me.pos as Offset, src.pos);
  let best: { to: Offset; d: number; cost: number } | null = null;
  for (const [key, cost] of costs) {
    if (cost === 0) continue;
    const [col, row] = key.split(',').map(Number) as [number, number];
    const to = { col, row };
    if (occupantAt(current, to, id) || terrainAt(current, to).movement === 'blocked') continue;
    const d = distance(to, src.pos);
    const better = !best || (mode === 'flee' ? d > best.d || (d === best.d && cost < best.cost) : d < best.d || (d === best.d && cost < best.cost));
    if (better) best = { to, d, cost };
  }
  if (!best || (mode === 'flee' ? best.d <= here : best.d >= here)) return events;
  const r = executeMove(current, me, best.to, rng);
  if (r.ok) events.push(...r.events);
  return events;
}

/**
 * Mirror Image: hedefte kopya varsa ve saldıran Blinded değilse her kopya için d6; biri 3+ ise kopya vurulur (isabet
 * boşa gider, kopya yok olur). Döner: kopya vuruldu mu ve olaylar (kopya sayısı azalır; sıfırda etki biter).
 */
export function mirrorImageHit(target: Combatant, attacker: Combatant, rng: Rng): { blocked: boolean; events: BattleEvent[] } {
  const e = target.effects?.find((x) => (x.images ?? 0) > 0);
  if (!e || attacker.conditions.includes('Blinded')) return { blocked: false, events: [] };
  const n = e.images ?? 0;
  let blocked = false;
  for (let i = 0; i < n; i++) if (rollDie(6, rollTag(rng, { by: target.id, kind: 'save' })) >= 3) blocked = true;
  if (!blocked) return { blocked: false, events: [] };
  const left = n - 1;
  return {
    blocked: true,
    events: [left > 0
      ? { type: 'effect_added', targetId: target.id, effect: { ...e, images: left } }
      : { type: 'effect_ended', targetId: target.id, effectId: e.id, name: e.name, reason: 'used' }],
  };
}
