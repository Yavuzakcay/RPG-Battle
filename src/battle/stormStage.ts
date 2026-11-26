/**
 * Görev KARAR104 (kural sürümü 104, A1): aşamalı alanların büyücünün sonraki tur başlarındaki etkileri (SRD 5.2.1 s. 165 Storm of
 * Vengeance: "At the start of each of your later turns, the storm produces different effects"). Kural büyü verisinde
 * (`zone.stages`, `k104` bloğu); alan 1. aşamada açılır, büyücünün her tur başında `zone_stage` ile bir artar.
 * - Hasar altındakilerin hepsine bir kez atılır (SRD "Damage against Multiple Targets"); save'li aşamada yarı hasar.
 * - `targets` (3. tur, altı yıldırım): en çok N farklı yaratık büyücüye sorulur (`askPicks`; öneri büyücünün düşmanlarından
 *   alanın merkezine en yakın N; KARAR104-KALAN). ⚠ Nesneler hedef alınmaz.
 * - `persist` (5–10. tur): o aşamaya girilince alan kuralına eklenir (`zones.ts` `stagedSpec`): zorlu arazi, yoğun örtü,
 *   menzilli silah saldırısı yok. Nesnelere asit hasarı (2. tur) uygulanmaz (⚠).
 * 103 ve altında alan `stage` taşımaz: yalnız yapım turu (eski davranış).
 */
import { rollDice, rollTag, type Rng } from '../rules/dice';
import { askPicks } from '../rules/choice';
import { distance, type Offset } from '../rules/hex';
import type { ZoneSpec } from '../data';
import { altitudeInZone } from './altitude';
import { applyEvents } from './reduce';
import { karar104On } from './karar104Surum';
import { affects, bodyInZone, triggerEvents, zoneSpecOf } from './zones';
import type { BattleEvent, BattleState, SpellZone } from './types';

const liveZone = (s: BattleState, id: string): SpellZone | undefined => s.map?.zones?.find((x) => x.id === id);

export function stormStageEvents(state: BattleState, casterId: string, rng: Rng): BattleEvent[] {
  if (!karar104On(state) || !state.map?.zones?.length) return [];
  const out: BattleEvent[] = [];
  let s = state;
  for (const z0 of state.map.zones) {
    const stages = zoneSpecOf(z0)?.stages;
    if (z0.casterId !== casterId || !z0.stage || !Array.isArray(stages)) continue;
    const next = z0.stage + 1;
    const step: BattleEvent[] = [{ type: 'zone_stage', zoneId: z0.id, stage: next }];
    out.push(...step);
    s = applyEvents(s, step);
    const st = stages.find((x) => next >= x.turn && next <= (x.through ?? x.turn));
    const z = liveZone(s, z0.id);
    if (!st || !z) continue;
    const base = zoneSpecOf(z) as ZoneSpec;
    const spec: ZoneSpec = { ...base, save: st.save, damage: st.damage, damageType: st.damageType, half: st.half,
      conditions: undefined, hold: undefined, once: undefined, castTrigger: undefined, dropConcentration: undefined };
    let inside = Object.values(s.combatants).filter((c) => c.pos && c.hp > 0 && !c.summon?.gone && bodyInZone(s, z, c, c.pos)
      && altitudeInZone(s, z, spec, c) && affects(s, z, spec, c));
    if (st.targets) {
      const center: Offset | undefined = z.center ?? z.hexes[Math.floor(z.hexes.length / 2)];
      const near = (a: { id: string; pos: Offset | null }, b: { id: string; pos: Offset | null }) =>
        (center ? distance(a.pos as Offset, center) - distance(b.pos as Offset, center) : 0) || a.id.localeCompare(b.id);
      // Öneri = eski otomatik seçim: büyücünün düşmanlarından merkeze en yakın N.
      const auto = inside.filter((c) => c.side !== z.side).sort(near).slice(0, st.targets);
      // Görev KARAR104-KALAN (⚠ kapandı; SRD "six different creatures … of your choice beneath the cloud"): büyücüye sorulur
      // (`askPicks`, Sor ayarı; kancasız Rng, yapay zekâ ve "Her zaman/Asla"da öneri aynen). Adaylar bulutun altındaki bütün
      // yaratıklar (dost da seçilebilir), önce öneri sırası.
      const cands = [...auto, ...inside.filter((c) => !auto.includes(c)).sort(near)];
      const picked = askPicks(rng, { actorId: casterId, label: `${z.name}: yıldırım hedefi`, options: cands.map((c) => ({ id: c.id, label: c.name })),
        suggested: auto.map((c) => c.id), max: st.targets });
      inside = picked.map((id) => cands.find((c) => c.id === id)).filter((c): c is (typeof cands)[number] => !!c);
    }
    if (!inside.length) continue;
    const rolled = rollDice(st.damage, rollTag(rng, { kind: 'damage', by: casterId }));
    for (const c of inside) {
      const live = liveZone(s, z.id);
      if (!live) break;
      const evs = triggerEvents(s, live, c.id, rng, spec, { rolled });
      out.push(...evs);
      s = applyEvents(s, evs);
    }
  }
  return out;
}
