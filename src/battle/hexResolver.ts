/**
 * Kuyruk K55: altıgen etki çözücüsü (kural sürümü 26, Game Master anahtarı `hexResolver`; tablo
 * `data/yuzey-etkilesimleri.json`, etiketler `data/buyu-etiketleri.json`). Yüzeyler, gazlar, duvarlar ve büyüler aynı
 * altıgende buluşunca tek giriş (`resolveHexEffects`) sabit sırayla çözer:
 *   1. engel/duvar: katı engel altıgenleri (K53 geçici engel, Wall of Stone/Force) gelen etkiden düşer;
 *   2. yüzey × yüzey (bu adımda oluşan yüzey/alan → altındakiler);
 *   3. büyü × yüzey (element etiketi);
 *   3b. arazi × büyü (Kuyruk K56, `terrainSpell.ts`: zemin etiketine göre yüzey; sürüm 33, anahtar `araziBuyuEtkisi`);
 *   4. aura ve durum kancaları (tutsak serbest);
 *   5. hasar ve kurtulma zarları (patlama, suda yıldırım).
 * Aynı öncelikte tablo sırası; altıgenler indeks (satır × en + sütun) artan sırada. Katman başına (zemin, gaz, nesne)
 * en çok bir yüzey: aynı katmanda yeni yüzey eskisinin yerine geçer (tepkime satırı varsa önce o çalışır). Zincir:
 * tepkimenin oluşturduğu yüzey sonraki derinlikte yeniden tetikler; derinlik en çok `zincirDerinligi` (3); zincirde aynı
 * ikili aynı altıgende turda bir kez (`hexReacted`); sınırı aşan "zincir sınırı" olarak günlüğe yazılır. Tepkime
 * hasarı aynı komutta aynı yaratığa bir kez (kaynak: o komutun ateşi). Konsantrasyonlu alandan doğan yüzey o
 * konsantrasyona bağlanır. Eski savaş (sürüm < 26) ya da anahtar kapalı: eski geçişler (`surfaces.ts`, `ignite.ts`,
 * `surfaceMix.ts`) aynen. Saf; `rng` enjekte; `dryRun` önizleme (yapay zekâ, K58 keşif defteri) aynı çözücüyü çalıştırır.
 */
import { touches } from './body';
import table from '../../data/yuzey-etkilesimleri.json';
import tags from '../../data/buyu-etiketleri.json';
import { hexKey, neighbors, type Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import { applyEvents } from './reduce';
import { globalRule } from './ruleControl';
import { houseRule, type HouseRuleId } from './houseRules';
import { ruleVersion } from './ruleVersion';
import { zoneHexes, zoneSpecOf, triggerEvents } from './zones';
import { SURFACE_DATA, burstEvents, isWater, registerResolver, shrink, surfaceEvent, surfacesReact, waterChain } from './surfaces';
import { freeCaptives } from './surfaceMix';
import { solidBarrierAt } from './barriers';
import { isAirborne } from './flight';
import { terrainSpellEvents } from './terrainSpell';
import type { BattleEvent, BattleState, Side, SpellZone, SurfaceKind, SurfaceReaction } from './types';

export const RESOLVER_VERSION = 26;
type Gate = { tur: 'srd' | 'ev' | 'anahtar' | 'anahtarDegil'; id?: string };
interface Match { element?: string[]; yuzey?: string[]; alan?: string[]; su?: boolean; zemin?: string; douses?: boolean }
export interface InteractionRow {
  id: string; oncelik: number; tetik: string; a: Match & Record<string, unknown>; b: Match & Record<string, unknown>; tepkime: string; gate: Gate[];
  kapsam: 'degen' | 'tum' | 'bitisik'; sonuc?: { kaldir?: boolean; yuzey?: SurfaceKind; sure?: string; yoksa?: boolean; konsantrasyon?: boolean };
  isleyici?: string; dokunus?: 'genis'; motor?: string;
}
export const INTERACTIONS = table.satirlar as unknown as InteractionRow[];
const PARAMS = table.params as Record<string, number>;
/** Çözücünün çalıştırdığı satırlar (öncelik, tablo sırası). */
const ACTIVE = INTERACTIONS.map((r, i) => ({ r, i })).filter(({ r }) => r.oncelik > 0 && !r.motor).sort((x, y) => x.r.oncelik - y.r.oncelik || x.i - y.i).map(({ r }) => r);
const MAX_DEPTH = PARAMS.zincirDerinligi ?? 3;
const LAYER = { ...(tags.yuzeyler as Record<string, { katman: string }>) };

/** Çözücü bu savaşta mı (sürüm 26+, anahtar açık, yüzey etkileşimi açık, haritalı). */
export const hexResolverOn = (s: BattleState): boolean => ruleVersion(s) >= RESOLVER_VERSION && !!globalRule(s, 'hexResolver') && surfacesReact(s);

/** Büyünün etiketleri (etiketsiz büyü etkileşimsiz: boş). */
export function spellTags(spellId: string): { element: string[]; tur: string[] } {
  const t = (tags.buyuler as Record<string, { element?: string[]; tur?: string[] }>)[spellId];
  return { element: t?.element ?? [], tur: t?.tur ?? [] };
}
/** Yüzeyin katmanı (zemin/gaz/nesne; işaret ve bilinmeyen: null). */
export const layerOf = (kind: string | undefined): string | null => (kind ? LAYER[kind]?.katman ?? null : null);

function gateOpen(s: BattleState, gates: Gate[]): boolean {
  return gates.every((g) => g.tur === 'srd' || (g.tur === 'ev' ? houseRule(s, g.id as HouseRuleId)
    : g.tur === 'anahtar' ? !!globalRule(s, g.id as string) : !globalRule(s, g.id as string)));
}

/** Gelen etki: element dokunuşu ya da bu adımda oluşan yüzey/alan. */
export type Incoming =
  | { kind: 'element'; element: string; hexes: Offset[]; actorId: string; dc: number; damage: number | null; dice?: string; hitIds: string[]; label: string; genis?: boolean }
  | { kind: 'zone'; zoneId: string; origin?: string };
export interface HexResult { events: BattleEvent[]; reactions: string[]; chainLimited: boolean }

const sizeOf = (s: BattleState) => ({ cols: s.map?.tiles[0]?.length ?? 0, rows: s.map?.tiles.length ?? 0 });
const keys = (hs: Offset[]) => new Set(hs.map(hexKey));
const idxOf = (s: BattleState) => { const c = sizeOf(s).cols; return (h: Offset) => h.row * c + h.col; };
const sorted = (s: BattleState, hs: Offset[]) => { const ix = idxOf(s); const seen = new Set<string>(); return [...hs].filter((h) => !seen.has(hexKey(h)) && !!seen.add(hexKey(h))).sort((a, b) => ix(a) - ix(b)); };
const zonesOf = (s: BattleState) => s.map?.zones ?? [];
const matchesZone = (z: SpellZone, m: Match) => (z.surface ? !!m.yuzey?.includes(z.surface) : !!m.alan?.includes(z.spellId)) || (!!m.douses && !z.surface && !!zoneSpecOf(z)?.douses);
const turnKey = (s: BattleState) => `${s.round}:${s.turnIndex}`;
const blocked = (s: BattleState, h: Offset) => !!solidBarrierAt(s, h)
  || zonesOf(s).some((z) => !z.surface && !!(zoneSpecOf(z) as { solid?: boolean } | undefined)?.solid && z.hexes.some((x) => hexKey(x) === hexKey(h)));

interface Ctx { depth: number; burned: Set<string>; reactions: string[]; pairs: Set<string>; parents: Map<string, SpellZone> }

/**
 * Tek giriş: gelen etkiler (komut dokunuşları ya da oluşan yüzeyler) için tepkime olayları. Zincir derinliği ve
 * döngü engeli burada. `dryRun`: aynı çözüm (saf), yalnızca sonucu döner.
 */
export function resolveHexEffects(state: BattleState, incoming: Incoming[], rng: Rng, opts: { dryRun?: boolean; rows?: InteractionRow[] } = {}): HexResult {
  const rows = opts.rows ?? ACTIVE;
  const out: BattleEvent[] = [];
  let s = state;
  const push = (evs: BattleEvent[]) => { if (evs.length) { out.push(...evs); s = applyEvents(s, evs); } };
  const prevTurn = s.hexReacted?.turn === turnKey(s) ? new Set(s.hexReacted.keys) : new Set<string>();
  const ctx: Ctx = { depth: 0, burned: new Set(), reactions: [], pairs: prevTurn, parents: new Map() };
  // 1. Engel: katı engel altıgenleri gelen etkiden düşer.
  let items: Incoming[] = incoming.map((x) => (x.kind === 'element' ? { ...x, hexes: sorted(s, x.hexes.filter((h) => !blocked(s, h))) } : x))
    .filter((x) => x.kind !== 'element' || x.hexes.length > 0);
  let chainLimited = false;
  for (let depth = 0; items.length; depth++) {
    ctx.depth = depth;
    const created: Incoming[] = [];
    const collect = (evs: BattleEvent[], origin: string) => { for (const e of evs) if (e.type === 'zone_created') created.push({ kind: 'zone', zoneId: e.zone.id, origin }); };
    for (const row of rows) {
      if (!gateOpen(s, row.gate)) continue;
      for (const it of items) {
        if (row.tetik === 'element' && it.kind === 'element') {
          if (depth > 0 || !row.a.element?.includes(it.element) || (it.genis && row.dokunus !== 'genis')) continue;
          const evs = applyRow(s, row, it, it.hexes, ctx, rng);
          push(evs); collect(evs, row.id);
        } else if (row.tetik === 'olusan' && it.kind === 'zone') {
          const z = zonesOf(s).find((x) => x.id === it.zoneId);
          if (!z || !matchesZone(z, row.a)) continue;
          const evs = applyRow(s, row, { kind: 'element', element: z.surface ?? z.spellId, hexes: zoneHexes(s, z), actorId: z.casterId, dc: z.dc, damage: null, hitIds: [], label: z.name }, zoneHexes(s, z), ctx, rng, z, it.origin);
          push(evs); collect(evs, row.id);
        }
      }
    }
    // Kuyruk K56: arazi × büyü (büyü × yüzey adımından sonra, aura adımından önce): element dokunuşu zemin türüne göre
    // yüzey bırakır; oluşan yüzey zincire girer.
    if (depth === 0) for (const it of items) {
      if (it.kind !== 'element') continue;
      const evs = terrainSpellEvents(s, it.element, it.hexes, it.actorId, s.combatants[it.actorId]?.side ?? 'enemies', it.label);
      push(evs); collect(evs, 'arazi');
    }
    // Katman kuralı: bu adımda oluşan (ya da komutla gelen) yüzey aynı katmandaki eskisinin yerine geçer.
    for (const it of items) if (it.kind === 'zone') push(replaceEvents(s, it.zoneId));
    if (depth + 1 >= MAX_DEPTH && created.length) {
      // Zincir sınırı: bekleyen tepkime varsa kayda yaz, çalıştırma.
      const pending = created.filter((c) => c.kind === 'zone' && rows.some((r) => r.tetik === 'olusan' && gateOpen(s, r.gate) && (() => { const z = zonesOf(s).find((x) => x.id === c.zoneId); return !!z && matchesZone(z, r.a); })()));
      for (const it of created) push(replaceEvents(s, (it as { zoneId: string }).zoneId));
      if (pending.length) {
        chainLimited = true;
        const hexes = pending.flatMap((c) => zonesOf(s).find((x) => x.id === (c as { zoneId: string }).zoneId)?.hexes ?? []);
        push([{ type: 'surface_reacted', reaction: 'chainLimit', hexes: sorted(s, hexes), label: 'zincir sınırı', row: 'chainLimit' }]);
      }
      break;
    }
    items = created;
  }
  return { events: out, reactions: ctx.reactions, chainLimited };
}

/** Aynı katmandaki eski yüzeyler yeni yüzeyin altıgenlerinden çekilir. */
function replaceEvents(s: BattleState, zoneId: string): BattleEvent[] {
  const z = zonesOf(s).find((x) => x.id === zoneId);
  const layer = layerOf(z?.surface);
  if (!z || !layer || layer === 'isaret') return [];
  const mine = keys(z.hexes);
  const out: BattleEvent[] = [];
  for (const o of zonesOf(s)) {
    if (o.id === z.id || !o.surface || layerOf(o.surface) !== layer) continue;
    const hit = o.hexes.filter((h) => mine.has(hexKey(h)));
    if (!hit.length) continue;
    out.push({ type: 'surface_reacted', reaction: 'replace', hexes: sorted(s, hit), sourceId: z.casterId, label: `${z.name} → ${o.name}`, row: 'replace' }, shrink(o, keys(hit)));
  }
  return out;
}

const note = (row: InteractionRow, hexes: Offset[], sourceId: string, label: string, pairs?: string[]): BattleEvent =>
  ({ type: 'surface_reacted', reaction: row.tepkime as SurfaceReaction, hexes, sourceId, label, row: row.id, ...(pairs?.length ? { pairs } : {}) });

/** Satırın uygulanması (genel sonuç ya da işleyici). `made`: tetikleyen oluşan alan. */
function applyRow(s0: BattleState, row: InteractionRow, it: Extract<Incoming, { kind: 'element' }>, area: Offset[], ctx: Ctx, rng: Rng, made?: SpellZone, origin?: string): BattleEvent[] {
  const out: BattleEvent[] = [];
  let s = s0;
  const push = (evs: BattleEvent[]) => { if (evs.length) { out.push(...evs); s = applyEvents(s, evs); } };
  const side: Side = s.combatants[it.actorId]?.side ?? made?.side ?? 'enemies';
  let touchKeys = keys(area);
  if (row.kapsam === 'bitisik') touchKeys = keys(area.flatMap((h) => [h, ...neighbors(h, sizeOf(s))]));
  // Zincirde (derinlik ≥ 1) aynı ikili aynı altıgende turda bir kez.
  const fresh = (hs: Offset[]) => (ctx.depth === 0 ? hs : hs.filter((h) => !ctx.pairs.has(`${row.id}@${hexKey(h)}`)));
  const pairsOf = (hs: Offset[]) => { if (ctx.depth === 0) return undefined; const p = hs.map((h) => `${row.id}@${hexKey(h)}`); p.forEach((k) => ctx.pairs.add(k)); return p; };
  const done = (hs: Offset[]) => { if (!ctx.reactions.includes(row.id)) ctx.reactions.push(row.id); return pairsOf(hs); };
  const hurtOnce = (zone: SpellZone, hexes: Offset[]) => {
    const at = keys(hexes);
    const ix = idxOf(s);
    for (const c of Object.values(s.combatants).filter((x) => x.pos && touches(s, x, at)).sort((a, b) => ix(a.pos as Offset) - ix(b.pos as Offset))) {
      if (c.hp <= 0 || isAirborne(c) || ctx.burned.has(c.id)) continue;
      const live = zonesOf(s).find((x) => x.id === zone.id);
      if (!live) break;
      ctx.burned.add(c.id);
      push(triggerEvents(s, live, c.id, rng));
    }
  };

  if (row.isleyici === 'zincir') {
    const chain = waterChain(s, it.hexes);
    if (!chain.length) return [];
    const evs = burstEvents(s, chain, new Set(it.hitIds), it.dc, it.damage, it.dice ?? '1d8', 'lightning', it.actorId, `${it.label}: suda yıldırım`, rng, true);
    if (evs.length) push([note(row, chain, it.actorId, it.label, done(chain)), ...evs]);
    return out;
  }
  if (row.b.su || row.b.zemin) {
    const tiles = row.b.zemin ? new Set((SURFACE_DATA as Record<string, unknown>)[row.b.zemin] as string[]) : null;
    const res = row.sonuc?.yuzey;
    const iced = res && row.sonuc?.yoksa ? keys(zonesOf(s).filter((z) => z.surface === res).flatMap((z) => z.hexes)) : new Set<string>();
    const hit = fresh(sorted(s, it.hexes.filter((h) => (tiles ? tiles.has(s.map?.tiles[h.row]?.[h.col] ?? '#') : isWater(s, h)) && !iced.has(hexKey(h)))));
    if (!hit.length || !res) return [];
    push([note(row, hit, it.actorId, it.label, done(hit)), surfaceEvent(s, res, hit, it.actorId, side)]);
    return out;
  }
  if (row.isleyici === 'agYak') {
    // Yanan ağ: tutsaklar doğduğu ağdan (ağ yanan altıgenlerden çekilmiş olabilir).
    const web = (made && ctx.parents.get(made.id)) ?? zonesOf(s).find((z) => matchesZone(z, row.b));
    const live = made && zonesOf(s).find((x) => x.id === made.id);
    if (!web || !live) return [];
    done(live.hexes);
    push(freeCaptives(s, web, live.hexes, rng, live));
    return out;
  }
  // Yüzey/alan eşleşmesi: tablo sırasıyla, alan listesi sırasıyla.
  const targets = zonesOf(s).filter((z) => z.id !== made?.id && matchesZone(z, row.b) && zoneHexes(s, z).some((h) => touchKeys.has(hexKey(h))));
  for (const z0 of targets) {
    const z = zonesOf(s).find((x) => x.id === z0.id);
    if (!z) continue;
    const all = sorted(s, zoneHexes(s, z));
    const touched = all.filter((h) => touchKeys.has(hexKey(h)));
    const hexes = fresh(row.kapsam === 'tum' || row.kapsam === 'bitisik' ? all : touched);
    if (!hexes.length) continue;
    if (row.isleyici === 'gres') {
      const rule = globalRule(s, 'greaseFlammable');
      if (!rule) continue;
      const rounds = Math.max(1, typeof rule.burnRounds === 'number' ? rule.burnRounds : 3);
      const lit = surfaceEvent(s, 'fire', all, it.actorId, side);
      const fire = lit.type === 'zone_created' ? { ...lit, zone: { ...lit.zone, until: s.round + rounds - 1 } } : lit;
      push([{ ...note(row, all, it.actorId, `${z.name} tutuştu`, done(all)) }, { type: 'zone_ended', zoneId: z.id, name: z.name, reason: 'reacted' }, fire]);
      if (fire.type === 'zone_created') hurtOnce(fire.zone, all);
      continue;
    }
    if (row.isleyici === 'patlama') {
      push([note(row, all, it.actorId, it.label, done(all)), { type: 'zone_ended', zoneId: z.id, name: z.name, reason: 'reacted' }]);
      const ex = SURFACE_DATA.explosion;
      push(burstEvents(s, all, new Set(), z.dc, null, ex.damage, ex.damageType, it.actorId, `${z.name}: patlama`, rng, true));
      continue;
    }
    if (row.isleyici === 'tasma') {
      const have = keys(z.hexes);
      const grow: Offset[] = [];
      for (let ring = 0; ring < (PARAMS.forceWaterRing ?? 1); ring++) {
        for (const h of [...z.hexes, ...grow]) for (const n of neighbors(h, sizeOf(s))) {
          if (have.has(hexKey(n)) || (s.map?.tiles[n.row]?.[n.col] ?? '#') === '#') continue;
          have.add(hexKey(n)); grow.push(n);
        }
      }
      if (grow.length) push([note(row, sorted(s, grow), it.actorId, it.label, done(grow)), { type: 'zone_moved', zoneId: z.id, hexes: [...z.hexes, ...grow] }]);
      continue;
    }
    if (row.isleyici === 'agCoz') {
      push([note(row, hexes, it.actorId, it.label, done(hexes))]);
      push(freeCaptives(s, z, hexes, rng));
      const live = zonesOf(s).find((x) => x.id === z.id);
      if (live) push([shrink(live, keys(hexes))]);
      continue;
    }

    if (row.isleyici === 'yayilma' && made) {
      if (z.surface === 'oil') {
        push([note(row, all, made.casterId, made.name, done(all)), { type: 'zone_ended', zoneId: z.id, name: z.name, reason: 'reacted' }, surfaceEvent(s, 'fire', all, made.casterId, made.side)]);
      } else {
        // Gres: gres işleyicisiyle aynı (mekanik anahtarı greaseFlammable).
        const g = INTERACTIONS.find((r) => r.id === 'fireGrease') as InteractionRow;
        if (gateOpen(s, g.gate)) push(applyRow(s, g, { ...it, hexes: all, actorId: made.casterId, label: made.name }, all, ctx, rng));
      }
      continue;
    }
    // Genel sonuç.
    const res = row.sonuc ?? {};
    const evs: BattleEvent[] = [note(row, hexes, it.actorId, it.label, done(hexes))];
    if (res.sure) {
      const until = s.round + (PARAMS[res.sure] ?? 1) - 1;
      if (z.until !== undefined && z.until <= until) continue;
      evs.push({ type: 'zone_moved', zoneId: z.id, hexes: z.hexes, until });
    } else if (res.kaldir) {
      evs.push(row.kapsam === 'tum' ? { type: 'zone_ended', zoneId: z.id, name: z.name, reason: 'reacted' } : shrink(z, keys(hexes)));
    }
    if (res.yuzey) {
      const ev = surfaceEvent(applyEvents(s, evs), res.yuzey, hexes, it.actorId, side);
      // Konsantrasyonlu alandan doğan yüzey o konsantrasyona bağlı (Web → yanan ağ).
      evs.push(res.konsantrasyon && z.concentration && ev.type === 'zone_created' ? { ...ev, zone: { ...ev.zone, casterId: z.casterId, concentration: z.concentration } } : ev);
      if (ev.type === 'zone_created') ctx.parents.set(ev.zone.id, z);
    }
    push(evs);
  }
  // Yağdan doğan alev: üstündekiler hemen yanar (aynı kaynaktan bir kez).
  if (row.isleyici === 'yayilma' && made && origin && ['fireOil', 'lightningOil', 'oilSpread'].includes(origin)) hurtOnce(made, made.hexes);
  return out;
}

// ---------------------------------------------------------------- komut sonu ve önizleme

/** Komut olaylarından gelen etkiler: alan, alanlı saldırı, isabetli saldırı (+ geniş ateş dokunuşu) ve oluşan alanlar. */
export function incomingOf(next: BattleState, events: BattleEvent[]): Incoming[] {
  const out: Incoming[] = [];
  const firstRaw = (from: number, type: string) => {
    for (let i = from; i < events.length; i++) {
      const e = events[i] as BattleEvent;
      if (e.type === 'save_resolved' && e.damageType === type && e.damageRolls.length) return e.rawDamage;
      if (e.type === 'spell_cast' || e.type === 'area_used') break;
    }
    return null;
  };
  const pos = (id: string) => next.combatants[id]?.pos;
  events.forEach((e, i) => {
    if (e.type === 'spell_cast' && e.area?.damageType) {
      out.push({ kind: 'element', element: e.area.damageType, hexes: e.area.hexes, actorId: e.actorId, dc: e.area.dc ?? 10, damage: firstRaw(i + 1, e.area.damageType),
        ...(e.area.dice ? { dice: e.area.dice } : {}), hitIds: e.area.targetIds ?? [], label: e.label });
    } else if (e.type === 'area_used' && e.damageType) {
      out.push({ kind: 'element', element: e.damageType, hexes: e.hexes, actorId: e.actorId, dc: e.dc ?? 10, damage: firstRaw(i + 1, e.damageType),
        ...(e.dice ? { dice: e.dice } : {}), hitIds: e.targetIds, label: e.label });
    } else if (e.type === 'attack_resolved' && e.hit) {
      const p = pos(e.targetId);
      if (p) out.push({ kind: 'element', element: e.damageType, hexes: [p], actorId: e.actorId, dc: next.combatants[e.actorId]?.spellSaveDc ?? 10, damage: e.rawDamage, hitIds: [e.targetId], label: e.label });
    } else if (e.type === 'save_resolved' && e.damageType === 'fire' && e.appliedDamage > 0) {
      const p = pos(e.targetId);
      if (p) out.push({ kind: 'element', element: 'fire', hexes: [p], actorId: e.actorId, dc: e.dc, damage: null, hitIds: [], label: e.label, genis: true });
    } else if (e.type === 'map_effect' && e.damage?.type === 'fire' && e.damage.applied > 0) {
      const p = pos(e.targetId);
      if (p) out.push({ kind: 'element', element: 'fire', hexes: [p], actorId: 'harita', dc: 10, damage: null, hitIds: [], label: e.text ?? 'ateş', genis: true });
    } else if (e.type === 'zone_created' && next.map?.zones?.some((z) => z.id === e.zone.id)) {
      out.push({ kind: 'zone', zoneId: e.zone.id });
    }
  });
  return out;
}

/** Komut sonu (`execute`, sürüm 26+): bütün yüzey tepkimeleri tek çözücüden. */
export function resolveCommandEffects(next: BattleState, events: BattleEvent[], rng: Rng, opts: { dryRun?: boolean } = {}): HexResult {
  if (!hexResolverOn(next)) return { events: [], reactions: [], chainLimited: false };
  return resolveHexEffects(next, incomingOf(next, events), rng, opts);
}

/**
 * Önizleme (kuru çalıştırma): bu element bu altıgenlere değerse ne olur. Zarlar sabit (ortalama), durum değişmez.
 * Dönüş: tepkime kimlikleri, tepkimeden hasar alan yaratıklar, oluşan yüzeyler. Yapay zekâ dost riskini buradan ölçer.
 */
export function previewHexEffects(state: BattleState, actorId: string, element: string, hexes: Offset[], label = 'önizleme'):
  { reactions: string[]; damaged: string[]; surfaces: SurfaceKind[]; chainLimited: boolean } {
  if (!hexResolverOn(state)) return { reactions: [], damaged: [], surfaces: [], chainLimited: false };
  const r = resolveHexEffects(state, [{ kind: 'element', element, hexes, actorId, dc: state.combatants[actorId]?.spellSaveDc ?? 10, damage: null, hitIds: [], label }], () => 0.5, { dryRun: true });
  const damaged = new Set<string>();
  const surfaces: SurfaceKind[] = [];
  for (const e of r.events) {
    for (const id of hurtIds([e])) damaged.add(id);
    if (e.type === 'zone_created' && e.zone.surface) surfaces.push(e.zone.surface);
  }
  return { reactions: r.reactions, damaged: [...damaged], surfaces, chainLimited: r.chainLimited };
}

registerResolver({
  on: hexResolverOn,
  run: (s, element, hexes, actorId, label, rng, damage, dc) => resolveHexEffects(s, [{ kind: 'element', element, hexes, actorId, dc, damage, hitIds: [], label }], rng).events,
});

/** Olaylarda hasar alan yaratıklar (save, süren hasar, harita etkisi). */
export function hurtIds(events: BattleEvent[]): string[] {
  const out: string[] = [];
  for (const e of events) {
    if ((e.type === 'save_resolved' || e.type === 'effect_tick') && e.appliedDamage > 0) out.push(e.targetId);
    else if (e.type === 'map_effect' && (e.damage?.applied ?? 0) > 0) out.push(e.targetId);
  }
  return out;
}
/** Yapay zekâ: denenen komutun yüzey tepkimesi (ilk `surface_reacted`'tan sonrası) bu tarafın yaratığını yakıyor mu. */
export function reactionHurtsSide(state: BattleState, events: BattleEvent[], side: Side): boolean {
  const i = events.findIndex((e) => e.type === 'surface_reacted');
  if (i < 0) return false;
  return hurtIds(events.slice(i)).some((id) => state.combatants[id]?.side === side);
}
