/**
 * Kuyruk K62 (kural sürümü 46): Forcecage (SRD 5.2.1). Büyü bir alandır (`SpellZone.cage`: kafes `bars` ya da katı kutu
 * `box`); alandaki yaratıklar tutsaktır: büyüsüz yolla (yürüyüş, zorla hareket) çıkamaz, dışarıdan kimse giremez
 * (`cageStepBlocked`). Işınlanarak çıkmak önce CHA save ister (`cageTeleport`). Kutu görüşü ve içeri/dışarı hedeflemeyi
 * keser (`cageBoxBlock`); kafeste saldırı ve büyü geçer. Dökümde sığmayan ya da kısmen içeride kalan çok altıgenli yaratık
 * dışarı itilir (`cageOpenEvents`). Dispel Magic bozamaz (`dispelSpells`). Alan hazır ayarları: kutu 2×2 altıgen, kafes
 * yarıçap 2 altıgen (`castCageHexes`; serbest şekil sonraki kuyruğa). Saf modül.
 */
import { hexKey, isInside, line, neighbors, distance, withinRange, type Offset } from '../rules/hex';
import { saveEffect } from './maprules';
import { bodyAt, isMultiHex } from './body';
import { occupantAt } from './movement';
import { ruleVersion } from './ruleVersion';
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, SpellZone } from './types';
import binekData from '../../data/binek.json';
import { binekMb3On } from './binekSurum';
import { heightFtOf, seatedRider } from './riderCore';

const KAFES = (binekData as { kafesBoyuFt: Record<string, number> }).kafesBoyuFt;

export const CAGE_VERSION = 46;
const on = (s: Pick<BattleState, 'kuralSurumu'>) => ruleVersion(s) >= CAGE_VERSION;
const sizeOf = (s: BattleState) => ({ cols: s.map?.tiles[0]?.length ?? 0, rows: s.map?.tiles.length ?? 0 });
const has = (z: SpellZone, h: Offset) => z.hexes.some((x) => x.col === h.col && x.row === h.row);

/** Haritadaki kafes alanları (sürüm 46+). */
export const cagesOf = (s: BattleState): SpellZone[] => (on(s) ? (s.map?.zones ?? []).filter((z) => !!z.cage) : []);

/** Büyücü kafes/kutu için altıgenleri seçer: kutu = hedef altıgen + 3 komşu (2×2), kafes = yarıçap 2. */
export function castCageHexes(state: BattleState, aim: Offset, kind: 'bars' | 'box', radius = 2): Offset[] {
  const size = sizeOf(state);
  if (kind === 'bars') return withinRange(aim, radius, size);
  const around = neighbors(aim, size).sort((a, b) => a.col - b.col || a.row - b.row).slice(0, 3);
  return [aim, ...around];
}

/** Adım kafes sınırını geçiyor mu (içeri ya da dışarı): büyüsüz yolla geçilemez. */
export function cageStepBlocked(state: BattleState, from: Offset, to: Offset): boolean {
  return cagesOf(state).some((z) => has(z, from) !== has(z, to));
}

/** Kutu görüşü ve içeri/dışarı hedeflemeyi keser: bir uç kutuda, diğeri dışarıda; ya da çizgi kutunun içinden geçer. */
export function cageBoxBlock(state: BattleState, a: Offset, b: Offset): string | null {
  for (const z of cagesOf(state)) {
    if (z.cage !== 'box') continue;
    const ia = has(z, a), ib = has(z, b);
    if (ia !== ib) return z.name;
    if (!ia && line(a, b).slice(1, -1).some((h) => has(z, h))) return z.name;
  }
  return null;
}

/**
 * Tutsak yaratık ışınlanarak çıkmak isterse (hedef kafesin dışında) önce CHA save. Başarıda ışınlanma sürer;
 * başarısızlıkta büyü ya da etki boşa gider. Kafes yoksa null.
 */
export function cageTeleport(state: BattleState, mover: Combatant, to: Offset, rng: Rng): { ok: boolean; events: BattleEvent[] } | null {
  if (!mover.pos) return null;
  const z = cagesOf(state).find((c) => has(c, mover.pos as Offset) && !has(c, to));
  if (!z) return null;
  const ev = saveEffect(mover, 'forcecage', `${z.name}: ışınlanma`, 'cha', z.dc, rng);
  const ok = ev.type === 'map_effect' && !!ev.roll?.success;
  return { ok, events: ok ? [ev] : [ev, { type: 'map_note', text: `${mover.name}: ${z.name} içinden çıkamadı, büyü ya da etki boşa gitti.` }] };
}

/**
 * Döküm: tamamen içeride kalan tutsak olur; kısmen içeride kalan ya da sığmayan çok altıgenli yaratık merkezden dışarı,
 * tamamen çıkana dek itilir (en yakın boş uygun konum; yoksa Game Master notu).
 */
export function cageOpenEvents(state: BattleState, zone: SpellZone): BattleEvent[] {
  const out: BattleEvent[] = [];
  if (!on(state)) return out;
  const size = sizeOf(state);
  const keys = new Set(zone.hexes.map(hexKey));
  for (const c of Object.values(state.combatants)) {
    if (!c.pos || c.hp <= 0 || c.life === 'dead') continue;
    const body = isMultiHex(state, c) ? bodyAt(state, c, c.pos) : [c.pos];
    const inside = body.filter((h) => keys.has(hexKey(h))).length;
    // Kuyruk MB3 (69+, B11 ⚠ yorum): binek + binici yığını küpün kenarından (`data/binek.json` `kafesBoyuFt`) uzunsa binici
    // sığmaz ve dışarı itilir (binek tutsak kalır).
    const m = c.riding && binekMb3On(state) && seatedRider(state, c) ? state.combatants[c.riding] : undefined;
    const tooTall = !!m && (m.altitudeFt ?? 0) + heightFtOf(m) + heightFtOf(c) > (KAFES[zone.cage ?? 'box'] ?? Infinity);
    if (!inside || (inside === body.length && body.length <= zone.hexes.length && !tooTall)) continue;
    const options = withinRange(c.pos, 6, size)
      .filter((p) => isInside(p, size) && !occupantAt(state, p, c.id) && (isMultiHex(state, c) ? bodyAt(state, c, p) : [p]).every((h) => isInside(h, size) && !keys.has(hexKey(h))))
      .sort((a, b) => distance(c.pos as Offset, a) - distance(c.pos as Offset, b));
    const to = options[0];
    if (to) out.push({ type: 'pushed', targetId: c.id, from: c.pos, to, by: zone.casterId });
    else out.push({ type: 'map_note', text: `${c.name}: ${zone.name} alanına sığmıyor, Game Master yerleştirir.` });
  }
  return out;
}
