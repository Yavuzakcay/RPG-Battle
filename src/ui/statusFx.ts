/**
 * Sürekli durum efektleri ve jeton filtreleri (Görev V; yalnızca arayüz, motoru değiştirmez).
 * Döngü sprite'ları `npm run efektler` → data/efekt-sprites.json (`kind: status`, `loop: true`), görseller
 * public/efektler/*.webp; jeton çizilince tarayıcı yükler (önden yükleme yok). Görev V2: bir jetonda aynı anda
 * yalnızca bir döngü efekti; birden çok durum varken öncelik sırasıyla (veriden: paralyzed > stunned > incapacitated >
 * frightened > charmed > restrained > grappled) `ROTATE_MS` aralıkla sırayla, diğerleri rozetle. Ekranda aynı anda en
 * çok `MAX_ANIMATED` animasyon; aşan ve "hareketi azalt" tercihi statik tek kare (azaltta sıra değişmez). Filtreler
 * (taşlaşma, görünmezlik, baygınlık, yerde, bitkinlik, çağrılmış) CSS. Oyun akışı işaretleri ışık hüzmesi (`beamFor`).
 */
import spriteData from '../../data/efekt-sprites.json';
import baglama from '../../data/efekt-baglama.json';
import type { Combatant } from '../battle/types';

export interface LoopSprite { id: string; file: string; frames: number; size: number; frameMs: number; priority: number; conditions: string[] }
export interface EngelSprite { id: string; file: string; frames: number; size: number; frameMs: number; phases: Record<'appear' | 'loop' | 'break', [number, number]> }

interface Entry {
  file: string; frames: number; size: number; kind?: string; loop?: boolean; priority?: number; conditions?: string[];
  phases?: Record<'appear' | 'loop' | 'break', number[]>;
}
const DATA = spriteData as { frameMs: number; effects: Record<string, Entry> };

/** Ekranda aynı anda çalışan animasyonlu döngü efekti üst sınırı (telefon performansı). */
export const MAX_ANIMATED = 8;
/** Efekt halkasının jeton çapına oranı (halkalar jetonun çevresinde). */
export const LOOP_SCALE = 1.15;
/** Birden çok durum varken sıradaki efekte geçiş aralığı (ms; Görev V2). */
export const ROTATE_MS = 2500;

// Görev E1: Görev V şeritlerine ek durum bağları (data/efekt-baglama.json `jetonDongu`: zehir şeridi Poisoned döngüsü).
const EXTRA = baglama.jetonDongu as Record<string, { durumlar: string[]; oncelik: number }>;
export const STATUS_SPRITES: LoopSprite[] = [
  ...Object.entries(DATA.effects)
    .filter(([, e]) => e.kind === 'status' && e.loop)
    .map(([id, e]) => ({ id, file: e.file, frames: e.frames, size: e.size, frameMs: DATA.frameMs, priority: e.priority ?? 99, conditions: e.conditions ?? [] })),
  ...Object.entries(EXTRA).flatMap(([id, x]) => {
    const e = DATA.effects[id];
    return e ? [{ id, file: e.file, frames: e.frames, size: e.size, frameMs: DATA.frameMs, priority: x.oncelik, conditions: x.durumlar }] : [];
  }),
].sort((a, b) => a.priority - b.priority);

export const ENGEL_SPRITES: EngelSprite[] = Object.entries(DATA.effects)
  .filter(([, e]) => e.kind === 'engel' && e.phases)
  .map(([id, e]) => ({ id, file: e.file, frames: e.frames, size: e.size, frameMs: DATA.frameMs, phases: e.phases as unknown as EngelSprite['phases'] }));

/** Incapacitated'ı içeren durumlar: onlar varken ayrıca "incapacitated" efekti oynamaz (rozetteki gibi). */
const IMPLIES_INCAPACITATED = ['Paralyzed', 'Stunned', 'Unconscious', 'Petrified'];

/** Jetonun döngü efektleri (bütün etkin durumlar), öncelik sırasıyla; aynı anda yalnızca biri oynar (`placeLoops`). */
export function loopEffectsFor(c: Pick<Combatant, 'conditions'>): LoopSprite[] {
  const has = (name: string) => c.conditions.includes(name);
  const implied = IMPLIES_INCAPACITATED.some(has);
  return STATUS_SPRITES
    .filter((s) => s.conditions.some(has))
    .filter((s) => !(implied && s.conditions.includes('Incapacitated')));
}

/** Sırası: `now` (ms) anında kaçıncı efekt; "hareketi azalt"ta hep ilki (öncelikli). */
export const rotationIndex = (count: number, now: number, reduceMotion: boolean): number =>
  (count <= 1 || reduceMotion ? 0 : Math.floor(now / ROTATE_MS) % count);

export interface PlacedLoop { sprite: LoopSprite; animated: boolean; count: number }

/**
 * Ekrandaki jetonlara döngü efekti: jeton başına tek efekt (çoklu durumda `now` anına göre sırayla). Animasyon
 * bütçesi jeton sırasıyla dağılır; aşan ya da hareketi azaltılmış görünümde statik tek kare. `paused`: o an tek
 * seferlik hasar efekti oynayan jetonlar (döngü o sırada gizlenir).
 */
export function placeLoops(tokens: Array<Pick<Combatant, 'id' | 'conditions'>>,
  opts: { enabled: boolean; reduceMotion: boolean; now?: number; budget?: number; paused?: ReadonlySet<string> }): Map<string, PlacedLoop> {
  const out = new Map<string, PlacedLoop>();
  if (!opts.enabled) return out;
  let left = opts.reduceMotion ? 0 : (opts.budget ?? MAX_ANIMATED);
  for (const t of tokens) {
    if (opts.paused?.has(t.id)) continue;
    const loops = loopEffectsFor(t);
    const sprite = loops[rotationIndex(loops.length, opts.now ?? 0, opts.reduceMotion)];
    if (!sprite) continue;
    const animated = left > 0;
    if (animated) left--;
    out.set(t.id, { sprite, animated, count: loops.length });
  }
  return out;
}

/** Oyun akışı işaretleri (Görev V2; 'goal' jetona değil hedef altıgenine, Görev S3): altıgen tabanından yukarı ışık hüzmesi; jetonda yalnızca en öncelikli biri. */
export type BeamKind = 'turn' | 'selected' | 'target' | 'picked' | 'pickable' | 'area-foe' | 'area-friend' | 'goal';
export const BEAM_PRIORITY: readonly BeamKind[] = ['turn', 'selected', 'target', 'picked', 'pickable', 'area-foe', 'area-friend'];
/** Jetonun işaretlerinden çizilecek hüzme (yoksa null). Kurulumdaki seçim savaşta sıra işaretiyle çakışmaz. */
export function beamFor(flags: Partial<Record<BeamKind, boolean>>): BeamKind | null {
  return BEAM_PRIORITY.find((k) => flags[k]) ?? null;
}

export type TokenFilter = 'petrified' | 'invisible' | 'unconscious' | 'prone' | 'exhaustion' | 'spirit' | 'blinded';

/**
 * Jeton filtreleri (durum adları data/conditions.json'dan; yeni durum yok). Baygınlık: Unconscious ya da 0 HP'de
 * ölmekte/stabil karakter. Bitkinlik: `exhaustion` seviyesi (Görev S1; eski "Exhaustion" adlı durum da).
 * Çağrılmış yaratık (R3; ileride klon/ruh): hayalet filtresi.
 */
export function tokenFilters(c: Pick<Combatant, 'conditions' | 'life' | 'summon' | 'exhaustion'>): TokenFilter[] {
  const out: TokenFilter[] = [];
  const has = (n: string) => c.conditions.includes(n);
  if (has('Petrified')) out.push('petrified');
  // Görev E1: kör jeton kısık/karartılmış (yalnızca görsel).
  if (has('Blinded')) out.push('blinded');
  if (has('Invisible')) out.push('invisible');
  if (has('Unconscious') || c.life === 'dying' || c.life === 'stable') out.push('unconscious');
  if (has('Prone')) out.push('prone');
  if ((c.exhaustion ?? 0) > 0 || c.conditions.some((n) => n.startsWith('Exhaustion'))) out.push('exhaustion');
  if (c.summon) out.push('spirit');
  return out;
}

/** Filtrelerin birleşik görünümü: CSS filtresi, saydamlık ve küçültme (birden çok filtre üst üste binebilir). */
export function filterStyle(filters: TokenFilter[]): { filter: string; opacity: number; shrink: number; tilt?: number } {
  const parts: string[] = [];
  const J = baglama.jeton;
  let opacity = 1;
  let shrink = 1;
  let tilt = 0;
  for (const f of filters) {
    if (f === 'petrified') parts.push('grayscale(1)', 'contrast(0.85)');
    // Görev E1: görünmez %40 saydam (opaklık veriden).
    if (f === 'invisible') opacity = Math.min(opacity, J.gorunmezOpaklik);
    if (f === 'blinded') parts.push(`brightness(${J.korParlaklik})`);
    if (f === 'unconscious') parts.push('brightness(0.6)');
    // Yerde: küçülme ve yatık eğim (Görev E1).
    if (f === 'prone') { shrink = 0.82; tilt = J.yatikDerece; }
    if (f === 'exhaustion') parts.push('saturate(0.45)', 'brightness(0.92)');
    if (f === 'spirit') { parts.push('grayscale(0.5)', 'sepia(0.4)', 'hue-rotate(170deg)', 'brightness(1.15)'); opacity = Math.min(opacity, 0.7); }
  }
  return { filter: parts.join(' '), opacity, shrink, ...(tilt ? { tilt } : {}) };
}

/**
 * Kuyruk A2: jeton rozetleri en çok `rozet.enCok` (3), fazlası "+N". Sıra veriden (`rozet.oncelik`: eylemi kesen durumlar
 * önde); listede olmayan (süren etki rozetleri) arkada, kendi sıralarıyla.
 */
export function limitBadges<T extends { key: string }>(list: T[], max: number = baglama.rozet.enCok): { shown: T[]; more: number } {
  const order = baglama.rozet.oncelik as string[];
  const rank = (k: string) => { const i = order.indexOf(k); return i < 0 ? order.length : i; };
  const sorted = list.map((x, i) => ({ x, i })).sort((a, b) => rank(a.x.key) - rank(b.x.key) || a.i - b.i).map((y) => y.x);
  return { shown: sorted.slice(0, max), more: Math.max(0, sorted.length - max) };
}
