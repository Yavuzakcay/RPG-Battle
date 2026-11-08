/**
 * Kuyruk K68b (kural sürümü 52): Call Lightning fırtına bulutu (SRD 5.2.1: "A storm cloud appears at a point within range
 * that you can see above yourself. It takes the shape of a Cylinder that is 10 feet tall with a 60-foot radius. … choose a
 * point you can see under the cloud").
 *
 * - Bulut dökümde büyücünün altıgeninin üstünde sabit (büyücüyle yürümez; K68 karar 6): alan kaydı `SpellZone.cloud`
 *   (merkez `center`, yarıçap altıgen, taban ft), konsantrasyonla biter. Kuralsız alan (yalnız sınır çizilir).
 * - Taban açık gökte `openBaseFt` (30 ft), tavanlı haritada tavan − `ceilingGapFt` (10 ft). ⚠ SRD yükseklik vermez.
 * - Tavan − büyücü boyu `minRoomFt`'ten (10 ft) azsa büyü yapılamaz (karar 7; ⚠ SRD yasak koymaz).
 * - Şimşek noktası bulutun altında: yatayda bulut merkezinden yarıçap içinde (ve büyü menzilinde); yaratık seçilirse nokta
 *   onun irtifasında (karar 8; ⚠ SRD açık değil), tabandan yukarıdaki yaratık seçilemez.
 * Yeni olay yok (`zone_created`). Saf.
 */
import { distance, type Offset } from '../rules/hex';
import type { Spell, SpellMechanics } from '../data/types';
import { altitudeOf, bodyHeightFt, ceilingFt } from './altitude';
import { newZoneId } from './zones';
import type { BattleEvent, BattleState, Combatant, SpellZone } from './types';

export type CloudSpec = NonNullable<SpellMechanics['cloud']>;

/** Bulutun tabanı (ft): açık gökte `openBaseFt`, tavanlı haritada tavan − `ceilingGapFt`. */
export function cloudBaseFt(state: BattleState, spec: CloudSpec, at?: Offset | null): number {
  // Kuyruk K71a (sürüm 56+): döküm altıgeninin tavanı (altıgen başına tavan); 55 ve altında harita tavanı.
  const ceil = ceilingFt(state, at);
  return ceil === null ? spec.openBaseFt : Math.max(0, ceil - spec.ceilingGapFt);
}

/** Dökümün tavan sorunu (yoksa null): tavan − büyücü boyu `minRoomFt`'ten az. */
export function cloudCastProblem(state: BattleState, actor: Combatant, spell: Spell, spec: CloudSpec): string | null {
  const ceil = ceilingFt(state, actor.pos);
  if (ceil !== null && ceil - bodyHeightFt(actor) < spec.minRoomFt) return `${spell.name}: bulut için tavan alçak (${ceil} ft).`;
  return null;
}

/** Büyücünün bu büyüye ait bulutu (konsantrasyon sürerken). */
export const cloudOf = (state: BattleState, actor: Combatant, spell: Spell): SpellZone | undefined =>
  (state.map?.zones ?? []).find((z) => z.cloud && z.spellId === spell.id && z.casterId === actor.id);

/**
 * Şimşek noktasının sorunu (yoksa null). Dökümde bulut büyücünün altıgeninde doğar; tekrarda var olan bulut (yoksa
 * büyücünün yeri: eski kayıttan gelen bulutsuz konsantrasyon). `named`: seçilen yaratık (nokta onun irtifasında).
 */
export function cloudPointProblem(state: BattleState, actor: Combatant, spell: Spell, spec: CloudSpec, aim: Offset, named: Combatant | undefined, repeat: boolean): string | null {
  const cloud = repeat ? cloudOf(state, actor, spell) : undefined;
  const center = cloud?.center ?? actor.pos;
  if (!center) return null;
  const r = cloud?.cloud?.radiusHexes ?? Math.floor(spec.radiusFt / 5);
  if (distance(center, aim) > r) return `${spell.name}: şimşek noktası bulutun altında olmalı (merkezden ${r * 5} ft).`;
  const base = cloud?.cloud?.baseFt ?? cloudBaseFt(state, spec, center);
  if (named && altitudeOf(named) > base) return `${spell.name}: ${named.name} bulutun (taban ${base} ft) üstünde.`;
  return null;
}

/** Dökümde bulut alanı (konsantrasyonla biter). */
export function cloudZoneEvent(state: BattleState, actor: Combatant, spell: Spell, spec: CloudSpec, slotLevel: number | null): BattleEvent[] {
  if (!actor.pos) return [];
  return [{ type: 'zone_created', zone: {
    id: newZoneId(state, spell.id, actor.id), spellId: spell.id, name: `${spell.name} (bulut)`, casterId: actor.id, side: actor.side,
    dc: actor.spellSaveDc ?? 10, slotLevel: slotLevel ?? spell.level, hexes: [actor.pos], center: actor.pos,
    ...(spell.concentration ? { concentration: spell.name } : {}),
    cloud: { radiusHexes: Math.floor(spec.radiusFt / 5), baseFt: cloudBaseFt(state, spec, actor.pos) },
  } }];
}

/** Bulutun sınır altıgenleri (merkezden tam `r` altıgen uzaklıkta; arayüz çizgisi). */
export function cloudRing(state: BattleState, c: Offset | undefined, r: number): Offset[] {
  if (!c || !r) return [];
  const rows = state.map?.tiles.length ?? 0; const cols = state.map?.tiles[0]?.length ?? 0;
  const out: Offset[] = [];
  for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) if (distance(c, { col, row }) === r) out.push({ col, row });
  return out;
}
