/**
 * Görev KATALOG-GUC-TAM (kural sürümü 109): canavar saldırısı ve yeteneğinin alan bırakması (`alanBirak`): alanın altıgenleri
 * yüzey (`data/yuzeyler.json`: alev, buz, su, zehir bulutu…) ya da kalıcı alan (`SpellZone.spec`: Ink Cloud, Çatlak Kaya, Kozmik
 * Anka Alevi), saldıranın alanın ucuna süzülmesi (Celestial Glide) ve büyülü karanlığın silinmesi. Komut sonunda komutun
 * `area_used` olaylarından (efsanevi eylem ve tepki dahil). 108 ve altında boş. Saf.
 */
import { distance, sameHex, type Offset } from '../rules/hex';
import { gucOf } from './katalog109Data';
import { katalog109On } from './katalog109Surum';
import { abilitiesOf } from './monsterAbilities';
import { occupantAt, terrainAt } from './movement';
import { surfaceEvent } from './surfaces';
import { zoneSpecOf } from './zones';
import { registerCommandEnd } from './turnHooks';
import { formMonsterId } from './shapeMonsterCore';
import type { SurfaceKind } from './types';
import type { BattleEvent, BattleState, SpellZone } from './types';

/** Etiketin (saldırı adı ya da yetenek adı) `alanBirak` kaydı. */
function leaveOf(state: BattleState, actorId: string, label: string) {
  const c = state.combatants[actorId];
  const g = c ? gucOf(state, formMonsterId(c)) : undefined;
  if (!g?.alanBirak || !c) return undefined;
  if (g.alanBirak[label]) return g.alanBirak[label];
  const ab = abilitiesOf(state, c).find((a) => a.tr === label || a.en === label);
  return ab ? g.alanBirak[ab.id] : undefined;
}

export function areaLeaveEvents(state: BattleState, events: BattleEvent[]): BattleEvent[] {
  if (!katalog109On(state) || !state.map) return [];
  const out: BattleEvent[] = [];
  const used = new Set((state.map.zones ?? []).map((z) => z.id));
  for (const e of events) {
    if (e.type !== 'area_used' || !e.hexes.length) continue;
    const spec = leaveOf(state, e.actorId, e.label);
    const actor = state.combatants[e.actorId];
    if (!spec || !actor) continue;
    if (spec.yuzey) {
      const ev = surfaceEvent(state, spec.yuzey.kind as SurfaceKind, e.hexes, actor.id, actor.side);
      if (ev.type === 'zone_created') { ev.zone.until = state.round + spec.yuzey.rounds; used.add(ev.zone.id); }
      out.push(ev);
    }
    for (const [i, a] of (spec.alanlar ?? []).entries()) {
      let id = `k109:${actor.id}:${e.label}:${i}`;
      for (let n = 2; used.has(id); n++) id = `k109:${actor.id}:${e.label}:${i}:${n}`;
      used.add(id);
      const zone: SpellZone = { id, spellId: `k109:${e.label}`, name: a.name, casterId: actor.id, side: actor.side, dc: e.dc ?? 15, slotLevel: 0,
        hexes: e.hexes, until: state.round + a.rounds, spec: a.spec as SpellZone['spec'] };
      out.push({ type: 'zone_created', zone });
    }
    if (spec.karanlikSil) {
      for (const z of state.map.zones ?? []) if (zoneSpecOf(z)?.dark && z.hexes.some((h) => e.hexes.some((x) => sameHex(x, h)))) out.push({ type: 'zone_ended', zoneId: z.id, name: z.name, reason: 'dispelled' });
    }
    if (spec.tasi && actor.pos) {
      const far = [...e.hexes].sort((x, y) => distance(y, actor.pos as Offset) - distance(x, actor.pos as Offset))
        .find((h) => !occupantAt(state, h, actor.id) && terrainAt(state, h).movement === 'normal');
      if (far) out.push({ type: 'teleported', actorId: actor.id, from: actor.pos, to: far, label: e.label });
    }
  }
  return out;
}

registerCommandEnd((_b, next, events) => areaLeaveEvents(next, events));
