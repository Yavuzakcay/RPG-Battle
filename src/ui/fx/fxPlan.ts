/**
 * Görev E1: efekt bağlama (yalnızca görsel; motoru, kuralları, sayıları ve kural sürümünü değiştirmez). Saf: React/DOM yok.
 * Sprite tablosu `npm run sprite-ice -- --efekt` → data/sprite-esleme.json `efektler` (public/sprites/efekt-<ad>.webp, yatay
 * şerit, siyah zeminli sayfalardan parlaklık alfası, `screen` karışımı). Olay → efekt kuralları data/efekt-baglama.json.
 * - Tek seferlik efektler (`fxShots`): yalnızca motorda ZATEN olan olaylardan (saldırı isabeti, iyileştirme, ışınlanma,
 *   alan, koruma etkisi, çağırma, itme, çarpma, Moral); ölüm olay değil durum farkıdır (`deathShots`: önceki durumda
 *   ayakta olup şimdi ölü/kaybolmuş jeton).
 * - Kalıcı efektler (`groundFx`): aura (K53 aura etkisi ya da yaratığa bağlı büyü alanı) ve engel/duvar alanları.
 * - Bütçe (`allocate`): ekranda en çok `butce.ekran` animasyon, jeton başına en çok `butce.jeton`; aşan statik tek kare.
 *   Efekt ayarı kapalı ya da "hareketi azalt" açıkken hepsi statik tek kare.
 */
import esleme from '../../../data/sprite-esleme.json';
import baglama from '../../../data/efekt-baglama.json';
import type { Offset } from '../../rules/hex';
import type { ActiveEffect, BattleEvent, BattleState, Combatant, SpellZone } from '../../battle/types';

export interface FxSprite {
  /** Sprite adı (efekt- öneki olmadan, ör. `darbe-kesik`). */
  id: string; file: string; frames: number; ms: number; kind: string; loop: boolean; w: number; h: number;
  dir: 'sag' | null; blend: string; overlap: number;
}
interface Rec { kare: number; sure: number; tur: string; karisim: string; yon: string | null; en: number; boy: number; dongu: boolean; ortusme?: number }

const RECS = (esleme as unknown as { efektler?: Record<string, Rec> }).efektler ?? {};
export const FX: Record<string, FxSprite> = Object.fromEntries(Object.entries(RECS).map(([name, r]) => {
  const id = name.replace(/^efekt-/, '');
  return [id, { id, file: `sprites/${name}.webp`, frames: r.kare, ms: r.sure, kind: r.tur, loop: r.dongu, w: r.en, h: r.boy,
    dir: r.yon === 'sag' ? 'sag' : null, blend: r.karisim, overlap: r.ortusme ?? 0 }];
}));
/** Durum ikonları (SRD durum adı küçük harf → sprite yolu). */
export const STATUS_ICON_FILES: Record<string, string> = Object.fromEntries(
  Object.entries((esleme as unknown as { efektIkonlari?: Record<string, string> }).efektIkonlari ?? {}).map(([k, v]) => [k, `sprites/${v}.webp`]));

export const B = baglama;
export const SCREEN_BUDGET = B.butce.ekran;
export const TOKEN_BUDGET = B.butce.jeton;

/** Tek seferlik efekt: jetonun üstünde (`targetId`) ya da altıgende (`at`); ışın `from`→`to`. */
export interface FxShot {
  sprite: FxSprite; delay: number;
  targetId?: string; at?: Offset; from?: Offset; to?: Offset;
  /** Çizim boyu (altıgen eni katı; alanda yarıçaptan). */
  scale: number;
  /** Derece; yönlü sprite (itme) hedefin itilme yönüne. */
  rotate?: number;
}

const sp = (id: string | undefined): FxSprite | null => (id && FX[id]) || null;
const scaleOf = (kind: string): number => (B.olcek as Record<string, number>)[kind] ?? 2;

/** Flat-top odd-q altıgen merkezi (birim: altıgen eni 1; yalnızca açı ve uzaklık için). */
function center(h: Offset): { x: number; y: number } {
  return { x: h.col * 0.75, y: (h.row + (h.col & 1 ? 0.5 : 0)) * (Math.sqrt(3) / 2) };
}
export const angleDeg = (a: Offset, b: Offset): number => {
  const p = center(a); const q = center(b);
  return (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
};

/** Koruma satırı: süren etkinin ilk eşleşen alanı (data `koruma`). */
export function protectionSprite(e: Partial<ActiveEffect> & Record<string, unknown>): FxSprite | null {
  for (const r of B.koruma as Array<{ alan: string; isaret?: number; sprite: string }>) {
    const v = (e as Record<string, unknown>)[r.alan];
    if (v === undefined || v === null || v === false) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (typeof v === 'number' && v <= 0) continue;
    if (r.isaret !== undefined && (v as { sign?: number }).sign !== r.isaret) continue;
    return sp(r.sprite);
  }
  return null;
}

/** Çağırma satırı: dokunulamaz (ruh sürüsü, Flaming Sphere) ya da veri listesi; yoksa portal. */
export function summonSprite(c: Pick<Combatant, 'summon'>): FxSprite | null {
  const id = c.summon?.spellId ?? '';
  const C = B.cagir;
  if (c.summon?.intangible || C.ruhBuyuler.includes(id)) return sp(C.ruh);
  if (C.dogalBuyuler.includes(id)) return sp(C.dogal);
  return sp(C.varsayilan);
}

/** Alanın kapladığı yarıçap (altıgen): altıgen sayısından (1 + 3r(r+1) ≈ n). */
const radiusOf = (n: number): number => Math.max(1, (-3 + Math.sqrt(9 + 12 * Math.max(0, n - 1))) / 6);
const centroid = (hexes: Offset[]): Offset => {
  const c = hexes.reduce((s, h) => ({ col: s.col + h.col, row: s.row + h.row }), { col: 0, row: 0 });
  const p = { col: c.col / hexes.length, row: c.row / hexes.length };
  return hexes.reduce((b, h) => (Math.hypot(h.col - p.col, h.row - p.row) < Math.hypot(b.col - p.col, b.row - p.row) ? h : b), hexes[0]!);
};

/** Bu olaylardaki tek seferlik efektler (sırayla; `stagger` ms aralıkla). `before`: olaylardan önceki durum (konumlar). */
export function fxShots(events: BattleEvent[], before: BattleState, stagger = 120): FxShot[] {
  const out: FxShot[] = [];
  let d = 0;
  const push = (s: FxSprite | null, x: Omit<FxShot, 'sprite' | 'delay' | 'scale'> & { scale?: number; delay?: number }) => {
    if (!s) return;
    out.push({ sprite: s, scale: x.scale ?? scaleOf(s.kind), ...x, delay: d + (x.delay ?? 0) });
    d += stagger;
  };
  const posOf = (id: string): Offset | null => before.combatants[id]?.pos ?? null;
  const areas = new Set<string>();
  const area = (actorId: string, hexes: Offset[], type: string | undefined, shape?: string, aim?: Offset) => {
    if (!hexes.length || !type) return;
    const key = hexes.map((h) => `${h.col},${h.row}`).sort().join(';');
    if (areas.has(key)) return;
    areas.add(key);
    const from = posOf(actorId);
    if (shape === 'line' && from) {
      // Çizgi alan: ışın parçaları, çıkıştan en uzak altıgene.
      const far = hexes.reduce((b, h) => (Math.hypot(h.col - from.col, h.row - from.row) > Math.hypot(b.col - from.col, b.row - from.row) ? h : b), hexes[0]!);
      push(sp((B.isin as Record<string, string>)[type]), { from, to: far, scale: 1 });
      return;
    }
    const at = aim ?? centroid(hexes);
    push(sp((B.alan as Record<string, string>)[type]), { at, scale: 2 * radiusOf(hexes.length) + 1.2 });
  };
  for (const e of events) {
    switch (e.type) {
      case 'attack_resolved':
        if (e.hit) push(sp(e.critical ? B.darbe.kritik : (B.darbe as Record<string, string>)[e.damageType] ?? B.darbe.varsayilan), { targetId: e.targetId });
        break;
      case 'healed':
        if (e.amount > 0) push(sp(e.amount >= B.iyilestirBuyuk ? 'iyilestir-buyuk' : 'iyilestir-kucuk'), { targetId: e.targetId });
        break;
      case 'teleported':
        push(sp(B.isinlan.cikis), { at: e.from });
        push(sp(B.isinlan.giris), { at: e.to, delay: B.isinlan.girisGecikme });
        break;
      case 'area_used':
        area(e.actorId, e.hexes, e.damageType, e.shape, e.aim);
        break;
      case 'spell_cast':
        if (e.area) area(e.actorId, e.area.hexes.length ? e.area.hexes : e.area.airHexes ?? [], e.area.damageType);
        break;
      case 'effect_added':
        if (e.effect.sourceId === e.targetId || before.combatants[e.effect.sourceId]?.side === before.combatants[e.targetId]?.side) {
          push(protectionSprite(e.effect as unknown as Record<string, unknown>), { targetId: e.targetId });
        }
        break;
      case 'summoned':
        if (e.combatant.pos) push(summonSprite(e.combatant), { at: e.combatant.pos });
        break;
      case 'pushed':
        push(sp(B.itme), { at: e.from, rotate: angleDeg(e.from, e.to) });
        break;
      case 'map_effect': {
        const C = B.carpma as Record<string, string>;
        if (e.rule === 'carpmaHasari') push(sp(/nesne/.test(e.text) ? C.nesne : C.carpmaHasari), { targetId: e.targetId });
        else if (C[e.rule]) push(sp(C[e.rule]), { targetId: e.targetId });
        break;
      }
      case 'moral_changed':
        push(sp((B.moral as Record<string, string>)[e.reason]), { targetId: e.targetId });
        break;
      default:
        break;
    }
  }
  return out;
}

/** Haritada çizilen (ayakta ya da ölmekte) jeton: savaş ekranının jeton süzgeciyle aynı. */
export const onBoard = (c: Combatant | undefined): boolean =>
  !!c && !!c.pos && c.life !== 'dead' && !c.summon?.gone && (c.hp > 0 || c.life !== 'alive' || !!c.regenPending);

/** Ölüm: önceki durumda haritada olan, şimdi ölü ya da kaybolmuş (0 HP canavar, çağrı) jeton → toz (son konumunda). */
export function deathShots(before: BattleState, after: BattleState): FxShot[] {
  const s = sp(B.olum);
  if (!s) return [];
  const out: FxShot[] = [];
  for (const c of Object.values(before.combatants)) {
    if (!onBoard(c) || onBoard(after.combatants[c.id])) continue;
    // Kat değişimi ya da keşifte haritadan alınan (ölmeyen) jeton toz bırakmaz.
    const n = after.combatants[c.id];
    if (n && n.life === 'alive' && n.hp > 0 && !n.summon?.gone) continue;
    out.push({ sprite: s, at: c.pos as Offset, scale: scaleOf(s.kind), delay: 0 });
  }
  return out;
}

/** Aura rengi: hasar türü (ateş/nekrotik kırmızı, soğuk buz), düşmana yönelik kırmızı, yoksa altın. */
function auraSprite(type: string | undefined, filter: string | undefined): FxSprite | null {
  const A = B.aura as Record<string, string>;
  return sp((type && A[type]) || (filter === 'enemies' ? A.enemies : undefined) || A.varsayilan);
}

export interface GroundAura { key: string; ownerId: string; radius: number; sprite: FxSprite }
export interface GroundWall { key: string; hexes: Array<{ at: Offset; rotate: number }>; sprite: FxSprite; tint?: string; outline?: string }

/** Kalıcı efektler: auralar (yaratığa bağlı) ve duvarlar (engel alanları). */
export function groundFx(state: BattleState): { auras: GroundAura[]; walls: GroundWall[] } {
  const auras: GroundAura[] = []; const walls: GroundWall[] = [];
  for (const c of Object.values(state.combatants)) {
    if (!c.pos || c.hp <= 0 || c.summon?.gone) continue;
    for (const e of c.effects ?? []) {
      for (const a of [...(e.aura ? [e.aura] : []), ...(e.auras ?? [])]) {
        const type = a.effect.kind === 'damage' ? a.effect.type : undefined;
        const s = auraSprite(type, a.filter);
        if (s) auras.push({ key: `${c.id}:${e.id}:${a.id}`, ownerId: c.id, radius: a.radius, sprite: s });
      }
    }
  }
  const zones: SpellZone[] = state.map?.zones ?? [];
  for (const z of zones) {
    if (z.anchorId && z.radius !== undefined && state.combatants[z.anchorId]?.pos && !z.surface) {
      const s = auraSprite(z.spec?.damageType, undefined);
      if (s) auras.push({ key: `z:${z.id}`, ownerId: z.anchorId, radius: z.radius, sprite: s });
    }
    const D = B.duvar as Record<string, string>;
    const name = (z.barrier && D[z.barrier.kind]) || D[z.spellId];
    const s = sp(name);
    if (!s || !name || !z.hexes.length) continue;
    const outline = ((B as unknown as { kontur?: Record<string, string> }).kontur ?? {})[name];
    walls.push({ key: z.id, sprite: s, tint: (B.ton as Record<string, string>)[name], ...(outline ? { outline } : {}), hexes: z.hexes.map((h) => ({ at: h, rotate: wallAngle(h, z.hexes) })) });
  }
  return { auras, walls };
}

/** Duvar parçasının açısı: duvarın komşu altıgenine doğru (üç eksenden biri: dikey eksene göre 0°/60°/120°). */
export function wallAngle(h: Offset, all: Offset[]): number {
  const nb = all.filter((o) => (o.col !== h.col || o.row !== h.row) && Math.hypot(center(o).x - center(h).x, center(o).y - center(h).y) < 0.9);
  if (!nb.length) return 0;
  // Komşuların ortalama doğrultusu (180° katlı), üç eksenden en yakını: 90° (dikey), 30°, 150°.
  const deg = nb.map((o) => ((angleDeg(h, o) % 180) + 180) % 180);
  const AXES = [30, 90, 150];
  const score = (ax: number) => deg.reduce((s, d) => s + Math.min(Math.abs(d - ax), 180 - Math.abs(d - ax)), 0);
  return AXES.reduce((b, ax) => (score(ax) < score(b) ? ax : b), AXES[0]!);
}

/** Bütçe isteği: anahtar, jeton (varsa) ve öncelik sırası (dizideki sıra). */
export interface FxReq { key: string; tokenId?: string }

/**
 * Animasyon bütçesi: istekler sırayla (öncelik dizideki sıra); ekranda en çok `screen`, jeton başına en çok `perToken`.
 * Ayar kapalı ya da hareketi azaltta hiçbiri animasyonlu değil (statik tek kare). Dönen küme animasyonlu anahtarlar.
 */
export function allocate(reqs: FxReq[], opts: { enabled: boolean; reduceMotion: boolean; screen?: number; perToken?: number; used?: number; tokenUsed?: ReadonlyMap<string, number> }): Set<string> {
  const out = new Set<string>();
  if (!opts.enabled || opts.reduceMotion) return out;
  let left = (opts.screen ?? SCREEN_BUDGET) - (opts.used ?? 0);
  const per = new Map(opts.tokenUsed ?? []);
  const cap = opts.perToken ?? TOKEN_BUDGET;
  for (const r of reqs) {
    if (left <= 0) break;
    if (r.tokenId) {
      const n = per.get(r.tokenId) ?? 0;
      if (n >= cap) continue;
      per.set(r.tokenId, n + 1);
    }
    out.add(r.key);
    left--;
  }
  return out;
}

/** Statik görünümde gösterilecek kare (ortadaki; tek kare). */
export const stillFrame = (s: Pick<FxSprite, 'frames'>): number => Math.floor(s.frames / 2);
