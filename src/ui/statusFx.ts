/**
 * Sürekli durum efektleri ve jeton filtreleri (Görev V; yalnızca arayüz, motoru değiştirmez).
 * Döngü sprite'ları `npm run efektler` → data/efekt-sprites.json (`kind: status`, `loop: true`), görseller
 * public/efektler/*.webp; jeton çizilince tarayıcı yükler (önden yükleme yok). Bir jetonda en çok iki döngü
 * efekti (öncelik veriden: paralyzed > stunned > incapacitated > frightened > charmed > restrained > grappled),
 * fazlası yalnızca rozetle. Ekranda aynı anda en çok `MAX_ANIMATED` animasyon; aşan ve "hareketi azalt" tercihi
 * statik tek kare. Filtreler (taşlaşma, görünmezlik, baygınlık, yerde, bitkinlik, çağrılmış) CSS sınıfı.
 */
import spriteData from '../../data/efekt-sprites.json';
import type { Combatant } from '../battle/types';

export interface LoopSprite { id: string; file: string; frames: number; size: number; frameMs: number; priority: number; conditions: string[] }
export interface EngelSprite { id: string; file: string; frames: number; size: number; frameMs: number; phases: Record<'appear' | 'loop' | 'break', [number, number]> }

interface Entry {
  file: string; frames: number; size: number; kind?: string; loop?: boolean; priority?: number; conditions?: string[];
  phases?: Record<'appear' | 'loop' | 'break', number[]>;
}
const DATA = spriteData as { frameMs: number; effects: Record<string, Entry> };

/** Bir jetonda aynı anda en çok bu kadar döngü efekti. */
export const MAX_LOOPS_PER_TOKEN = 2;
/** Ekranda aynı anda çalışan animasyonlu döngü efekti üst sınırı (telefon performansı). */
export const MAX_ANIMATED = 8;
/** Efekt halkasının jeton çapına oranı (halkalar jetonun çevresinde). */
export const LOOP_SCALE = 1.15;

export const STATUS_SPRITES: LoopSprite[] = Object.entries(DATA.effects)
  .filter(([, e]) => e.kind === 'status' && e.loop)
  .map(([id, e]) => ({ id, file: e.file, frames: e.frames, size: e.size, frameMs: DATA.frameMs, priority: e.priority ?? 99, conditions: e.conditions ?? [] }))
  .sort((a, b) => a.priority - b.priority);

export const ENGEL_SPRITES: EngelSprite[] = Object.entries(DATA.effects)
  .filter(([, e]) => e.kind === 'engel' && e.phases)
  .map(([id, e]) => ({ id, file: e.file, frames: e.frames, size: e.size, frameMs: DATA.frameMs, phases: e.phases as unknown as EngelSprite['phases'] }));

/** Incapacitated'ı içeren durumlar: onlar varken ayrıca "incapacitated" efekti oynamaz (rozetteki gibi). */
const IMPLIES_INCAPACITATED = ['Paralyzed', 'Stunned', 'Unconscious', 'Petrified'];

/** Jetonun döngü efektleri, öncelik sırasıyla, en çok iki. */
export function loopEffectsFor(c: Pick<Combatant, 'conditions'>): LoopSprite[] {
  const has = (name: string) => c.conditions.includes(name);
  const implied = IMPLIES_INCAPACITATED.some(has);
  return STATUS_SPRITES
    .filter((s) => s.conditions.some(has))
    .filter((s) => !(implied && s.conditions.includes('Incapacitated')))
    .slice(0, MAX_LOOPS_PER_TOKEN);
}

export interface PlacedLoop { sprite: LoopSprite; animated: boolean }

/**
 * Ekrandaki jetonlara döngü efektleri: önce her jetonun ilk efekti, sonra ikincisi animasyon bütçesinden pay alır
 * (sıra: verilen jeton sırası). Bütçeyi aşan ya da hareketi azaltılmış görünümde efekt statik tek kare.
 */
export function placeLoops(tokens: Array<Pick<Combatant, 'id' | 'conditions'>>, opts: { enabled: boolean; reduceMotion: boolean; budget?: number }): Map<string, PlacedLoop[]> {
  const out = new Map<string, PlacedLoop[]>();
  if (!opts.enabled) return out;
  let left = opts.reduceMotion ? 0 : (opts.budget ?? MAX_ANIMATED);
  const lists = tokens.map((t) => ({ id: t.id, loops: loopEffectsFor(t) }));
  for (const t of lists) out.set(t.id, []);
  for (let k = 0; k < MAX_LOOPS_PER_TOKEN; k++) {
    for (const t of lists) {
      const s = t.loops[k];
      if (!s) continue;
      const animated = left > 0;
      if (animated) left--;
      out.get(t.id)?.push({ sprite: s, animated });
    }
  }
  for (const [id, v] of out) if (v.length === 0) out.delete(id);
  return out;
}

export type TokenFilter = 'petrified' | 'invisible' | 'unconscious' | 'prone' | 'exhaustion' | 'spirit';

/**
 * Jeton filtreleri (durum adları data/conditions.json'dan; yeni durum yok). Baygınlık: Unconscious ya da 0 HP'de
 * ölmekte/stabil karakter. Bitkinlik: "Exhaustion" ile başlayan durum (motor şimdilik uygulamıyor; ileride).
 * Çağrılmış yaratık (R3; ileride klon/ruh): hayalet filtresi.
 */
export function tokenFilters(c: Pick<Combatant, 'conditions' | 'life' | 'summon'>): TokenFilter[] {
  const out: TokenFilter[] = [];
  const has = (n: string) => c.conditions.includes(n);
  if (has('Petrified')) out.push('petrified');
  if (has('Invisible')) out.push('invisible');
  if (has('Unconscious') || c.life === 'dying' || c.life === 'stable') out.push('unconscious');
  if (has('Prone')) out.push('prone');
  if (c.conditions.some((n) => n.startsWith('Exhaustion'))) out.push('exhaustion');
  if (c.summon) out.push('spirit');
  return out;
}

/** Filtrelerin birleşik görünümü: CSS filtresi, saydamlık ve küçültme (birden çok filtre üst üste binebilir). */
export function filterStyle(filters: TokenFilter[]): { filter: string; opacity: number; shrink: number } {
  const parts: string[] = [];
  let opacity = 1;
  let shrink = 1;
  for (const f of filters) {
    if (f === 'petrified') parts.push('grayscale(1)', 'contrast(0.85)');
    if (f === 'invisible') opacity = Math.min(opacity, 0.45);
    if (f === 'unconscious') parts.push('brightness(0.6)');
    if (f === 'prone') shrink = 0.82;
    if (f === 'exhaustion') parts.push('saturate(0.45)', 'brightness(0.92)');
    if (f === 'spirit') { parts.push('grayscale(0.5)', 'sepia(0.4)', 'hue-rotate(170deg)', 'brightness(1.15)'); opacity = Math.min(opacity, 0.7); }
  }
  return { filter: parts.join(' '), opacity, shrink };
}
