/**
 * Kuyruk K73c (kural sürümü 64+, Görev 3; `harita/belgeler/K73C-DENETIM.md` §3): havada merkezli küre ve silindir.
 *
 * - Noktadan çıkan küre (Fireball, Fog Cloud, Stinking Cloud, Darkness…) ve silindir (Moonbeam, Sleet Storm…) merkezi bir
 *   altıgenin üstünde, 5 ft adımla bir yükseklikte seçilebilir (`cast_spell.targetFt`, ft; altıgenin zemininden). 0 ya da
 *   verilmezse bugünkü yer merkezli davranış aynen.
 * - Dikey kapsam K71c prizma ızgarasında: küre [merkez − yarıçap, merkez + yarıçap], havadaki silindirin dairesi üstte
 *   (SRD 5.2.1 Cylinder: "The circle must either be on the ground or at the height of the spell effect"), silindir merkezden
 *   aşağı yüksekliği kadar uzanır. Yaratık mutlak bandı (K71d `absBand`: zemin + irtifa, boy kadar düzey) bu aralıkla
 *   kesişirse içeride. Yatay altıgen kümesi aynen (K73b 3B uzaklığı yatay ve dikeyin büyüğü: küre kesitinde daralma yok).
 * - Menzil 3B: yatay (K69 gövdenin en yakın altıgeni) ile dikey (büyücünün K9 yüksekliğinden merkeze) farkın büyüğü. Görüş
 *   ve siper merkez noktasından (K68c irtifalı hat). Tavan altıgende tavana, açık gökte uçuş üst sınırına (`ucusUstFt`) dek.
 * - Kalıcı alanda aralık alanın kaydında (`SpellZone.air`, zemine göre ft); yere bağlı alan (zemin, yüzey, kafes, yarık,
 *   kaplanan merkez, büyücüye bağlı) havada merkezlenmez.
 * Yön (koni, çizgi) kapsam dışı. Saf.
 */
import { distance, type Offset } from '../rules/hex';
import type { Spell, ZoneSpec } from '../data/types';
import { k73cOn } from './k73cSurum';
import { bandOf, bandsOverlap, levelOf, type Band } from './cells';
import { absBand, k9Ft } from './vertical';
import { ceilingFt, flyCapFt } from './altitude';
import { reachToHex } from './body';
import { sightBlockedBetween } from './cover';
import type { BattleState, Combatant, SpellZone } from './types';

type AreaSpec = NonNullable<Spell['area']>;

/** Havada merkezlenebilen biçimler. */
const AIR_SHAPES = new Set(['sphere', 'cylinder']);

/** Biçim havada merkezlenebilir mi (noktadan çıkan küre/silindir). */
export const airShapeOk = (area: Pick<AreaSpec, 'shape' | 'origin'> | undefined): boolean => !!area && area.origin === 'point' && AIR_SHAPES.has(area.shape);

/**
 * Yere ya da altıgene bağlı alan kuralları (2B: altıgen başına çözülür; yükseklik bilmez). Bunlardan birini taşıyan kalıcı
 * alan havada merkezlenmez: zemin, yüzey, zorlu arazi, çevresine ışık ya da büyülü karanlık, sessizlik, duvar/engel, kafes,
 * yarık, yapı, kaplanan merkez, büyücüye bağlı aura, boncuk, girdap, itme.
 */
const GROUND_KEYS = ['ground', 'surface', 'difficult', 'difficultFor', 'dark', 'dispels', 'dispelLight', 'silence',
  'windWall', 'solid', 'panels', 'cage', 'fissures', 'structures', 'occupy', 'casterTurn', 'anchorSelf', 'bead', 'vortex', 'repel',
  'camouflaged', 'coverFor', 'douses'] as const;

/** Kalıcı alan havada merkezlenebilir mi (yere/altıgene bağlı kural yok). */
export function airZoneOk(spec: ZoneSpec | null | undefined): boolean {
  if (!spec) return true;
  // Işık: yalnız alanın kendi altıgenleri (yarıçap 0: Moonbeam loş, Conjure Celestial parlak) kalır; çevresine ışık
  // yayan (Dancing Lights, Daylight) 2B ışık modelinde altıgenlerden yayılır, havada merkezlenmez.
  if ((spec.light ?? 0) > 0 || (spec.lightDim ?? 0) > 0) return false;
  return !GROUND_KEYS.some((k) => (spec as Record<string, unknown>)[k] !== undefined && (spec as Record<string, unknown>)[k] !== false);
}

/**
 * Silindir yüksekliği (ft) ya da küre için undefined: kalıcı alanda alanın `heightFt`'i (Moonbeam, Sleet Storm; tepe =
 * yarıçap olan küreler hariç), anlık büyüde `cylinderFt` (Flame Strike, Ice Storm; `k73c` verisi). Veride biçim küre.
 */
export function cylinderHeightFt(m: { cylinderFt?: number }, zone?: ZoneSpec | null): number | undefined {
  if (zone?.heightFt !== undefined && !zone.heightFromRadius) return zone.heightFt;
  return m.cylinderFt;
}

/** Merkezin dikey aralığı (ft, merkezle aynı ölçekte): küre ±yarıçap, silindir (dairesi üstte) merkezden aşağı. */
export function airSpanFt(radiusFt: number, cylFt: number | undefined, centerFt: number): { loFt: number; hiFt: number } {
  if (cylFt !== undefined) return { loFt: centerFt - cylFt, hiFt: centerFt };
  return { loFt: centerFt - radiusFt, hiFt: centerFt + radiusFt };
}

/** Aralığın prizma düzeyleri (5 ft; sınır dahil). */
export const spanBand = (loFt: number, hiFt: number): Band => ({ lo: levelOf(loFt), hi: levelOf(hiFt) });

/** Havadaki merkez noktası (görüş/siper ucu; boyutsuz nokta: Tiny göz yüksekliği). */
export const airPoint = (aim: Offset, targetFt: number): Combatant => ({ id: '', pos: aim, altitudeFt: targetFt, size: 'T' }) as unknown as Combatant;

/** Merkezin mutlak yüksekliği (ft): altıgenin K9 zemini + merkez yüksekliği. */
export const airCenterAbsFt = (state: BattleState, aim: Offset, targetFt: number): number => k9Ft(state, { pos: aim, altitudeFt: targetFt });

/**
 * Havada merkezin sorunu (yoksa null). `zone`: kalıcı alanın kuralı (yere bağlıysa red). `rangeFt` büyünün menzili.
 */
export function airCenterProblem(state: BattleState, actor: Combatant, area: AreaSpec | undefined, rangeFt: number, aim: Offset | null, targetFt: number, zone?: ZoneSpec | null): string | null {
  if (!k73cOn(state)) return 'Havada merkez yalnız kural sürümü 64+ savaşta.';
  if (!airShapeOk(area)) return 'Yalnız noktadan çıkan küre ve silindir havada merkezlenir.';
  if (zone !== undefined && !airZoneOk(zone)) return 'Bu alan yere bağlı: havada merkezlenemez.';
  if (!aim || !actor.pos) return 'Hedef altıgen seçmelisin.';
  if (targetFt < 0 || targetFt % 5) return 'Merkez yüksekliği 5 ft adımla seçilir.';
  const ceil = ceilingFt(state, aim);
  const cap = ceil ?? flyCapFt(state);
  if (targetFt > cap) return ceil !== null ? `Tavan ${ceil} ft: merkez daha yükseğe konamaz.` : `Merkez en çok ${cap} ft yükseğe konur.`;
  const flat = reachToHex(state, actor, aim) * 5;
  const up = Math.abs(airCenterAbsFt(state, aim, targetFt) - k9Ft(state, actor));
  const d = Math.max(flat, up);
  if (d > rangeFt) return `Nokta menzil dışında: ${d} ft (3B), menzil ${rangeFt} ft.`;
  const wall = distance(actor.pos, aim) ? sightBlockedBetween(state, actor.pos, aim, { from: actor, to: airPoint(aim, targetFt) }) : null;
  if (wall) return `Nokta görülemiyor: arada ${wall} var.`;
  return null;
}

/** Yaratık havadaki alanın dikey aralığında mı (mutlak; `span` merkez altıgeninin zeminine göre). */
export function inAirSpan(state: BattleState, c: Combatant, aim: Offset, span: { loFt: number; hiFt: number }): boolean {
  const base = k9Ft(state, { pos: aim, altitudeFt: 0 });
  return bandsOverlap(absBand(state, c), spanBand(base + span.loFt, base + span.hiFt));
}

/** Kalıcı alanın havadaki aralığı yaratığı kapsıyor mu (zemine göre: alanın bütün altıgenlerinde aynı; K73b alan modeli). */
export const inZoneAir = (z: Pick<SpellZone, 'air'>, c: Pick<Combatant, 'size' | 'altitudeFt'>): boolean =>
  !z.air || bandsOverlap(bandOf(c), spanBand(z.air.loFt, z.air.hiFt));

/**
 * Büyünün merkezi havaya konabilir mi (arayüz, 64+): Call Lightning şimşek noktası, ya da noktadan çıkan küre/silindir
 * (serbest şekil ve çok noktalı değil; kalıcı alansa yere bağlı değil). `m` sürümdeki mekanik (`mechanicsAt`).
 */
export function airAimable(state: Pick<BattleState, 'kuralSurumu'>, spell: Spell, m: Spell['mechanics']): boolean {
  if (!k73cOn(state)) return false;
  if (m.cloud) return true;
  if (!airShapeOk(spell.area) || m.freeShape || m.multiPoint) return false;
  return m.zone ? airZoneOk(m.zone) : m.kind === 'save' || m.kind === 'sleep';
}
