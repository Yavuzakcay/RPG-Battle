/**
 * Ses planı (Görev S), saf fonksiyonlar: hangi ekranda/haritada ne çalar (data/ses.json), döngü ve çapraz geçiş
 * zamanlaması, seviyeler ve ayarlar, zar sesi seçimi. Web Audio bilmez (motor `engine.ts`); testlerde çalışır.
 */
import config from '../../../data/ses.json';
import { zar as zarClips } from '../../../data/ses-klipler.json';

export type MusicKind = 'gunduz' | 'gece';

export interface MapSound { ambient: string[]; music: MusicKind; silent?: string }
export interface SoundRule {
  id: string;
  when: { map?: string; variant?: string; dragon?: boolean; enemyPattern?: string };
  music?: MusicKind;
  ambient?: string[];
}
export interface SoundConfig {
  levels: { ambientDb: number; musicDb: number; effectsDb: number; menuDb: number };
  timing: {
    loopCrossfadeSec: number; musicCrossfadeSec: number; musicFadeInSec: number; themeCrossfadeSec: number;
    exitFadeSec: number; ambientFadeInSec: number;
  };
  menu: { light: string; dark: string };
  music: Record<MusicKind, string>;
  maps: Record<string, Record<string, MapSound>>;
  rules: SoundRule[];
  enemyPattern: string;
  dice: Record<'single' | 'multi' | 'bounce' | 'settle' | 'crit' | 'fumble', string>;
  /**
   * Savaş sonu ezgileri (Görev U) ve düzeni (Görev U2): müzik ve ortamın kısılıp durma süresi, ezginin gecikmesi
   * (kısılma başladıktan sonra), ekran erken kapanınca ezginin kısılma süresi (ms).
   */
  end: { victory: string; defeat: string; fadeOutMs: number; jingleDelayMs: number; jingleStopMs: number };
  /** Açılış ekranı sesi (Görev L): dosya varsa çalar. */
  splash?: string;
  /** Görev U4: açılışta dönen d20'nin sesi (hızlanan çoklu zar; dönüş başında çalar, durunca kesilir). */
  splashDice?: string;
}

export const SOUND = config as unknown as SoundConfig;
/** Zar ham dosyasından bölünen klipler: grup → klip adları. */
export const DICE_CLIPS: Record<string, string[]> = zarClips;

export const soundUrl = (name: string, base = '/'): string => `${base}ses/${name}.mp3`;

/** Savaşın ses bağlamı: harita, varyant, düşman canavar kimlikleri, uyuyan ejderha ayarı. */
export interface SoundContext { mapId: string; variantId: string; enemyMonsterIds: string[]; dragonSetup: boolean }

/** Kural koşulu tutuyor mu. `dragon`: uyuyan ejderha ayarı ya da canavar kimliği ejderha kalıbına uyan düşman. */
export function ruleMatches(rule: SoundRule, ctx: SoundContext, cfg: SoundConfig = SOUND): boolean {
  const w = rule.when;
  if (w.map !== undefined && w.map !== ctx.mapId) return false;
  if (w.variant !== undefined && w.variant !== ctx.variantId) return false;
  const pattern = new RegExp(w.enemyPattern ?? cfg.enemyPattern, 'i');
  const enemyHit = ctx.enemyMonsterIds.some((id) => pattern.test(id));
  if (w.dragon !== undefined && w.dragon !== (ctx.dragonSetup || enemyHit)) return false;
  if (w.enemyPattern !== undefined && w.dragon === undefined && !enemyHit) return false;
  return true;
}

/** Haritanın eşlemesi (varyant yoksa "*"); bilinmeyen harita: sessiz, gündüz müziği. */
export function mapSound(mapId: string, variantId: string, cfg: SoundConfig = SOUND): MapSound {
  const m = cfg.maps[mapId];
  return m?.[variantId] ?? m?.['*'] ?? { ambient: [], music: 'gunduz', silent: `eşleme yok: ${mapId}/${variantId}` };
}

/** Savaş sahnesi: ortam klipleri ve müzik dosyası (kurallar uygulanmış). */
export function battleScene(ctx: SoundContext, cfg: SoundConfig = SOUND): { ambient: string[]; music: string; musicKind: MusicKind; rule?: string } {
  const base = mapSound(ctx.mapId, ctx.variantId, cfg);
  let music = base.music;
  let ambient = base.ambient;
  let rule: string | undefined;
  for (const r of cfg.rules) {
    if (!ruleMatches(r, ctx, cfg)) continue;
    if (r.music) music = r.music;
    if (r.ambient) ambient = r.ambient;
    rule = r.id;
    break;
  }
  return { ambient, music: cfg.music[music], musicKind: music, ...(rule ? { rule } : {}) };
}

/**
 * Ekran → ses (Görev T): savaş ekranı (yeni ya da kayıttan yüklenen savaş) haritanın ortam sesi ve savaş müziği;
 * diğer bütün ekranlar, Game Master savaş kurulumu dahil, yalnızca menü müziği. Kurulumda ortam sesi yok.
 */
export type ScreenName = 'home' | 'player' | 'builder' | 'gm' | 'status' | 'battle' | 'settings';
export const SCREEN_SOUND: Record<ScreenName, 'menu' | 'battle'> = {
  home: 'menu', player: 'menu', builder: 'menu', gm: 'menu', status: 'menu', battle: 'battle', settings: 'menu',
};

/** Menü müziği (temaya göre). */
export const menuTrack = (theme: 'light' | 'dark', cfg: SoundConfig = SOUND): string => cfg.menu[theme];

// ------------------------------------------------------------------ döngü ve çapraz geçiş

/** Eşit güçlü (equal-power) çapraz geçiş kazancı: x 0→1 ilerlerken giden cos, gelen sin (toplam güç sabit). */
export function equalPower(x: number): { out: number; in: number } {
  const t = Math.min(1, Math.max(0, x));
  return { out: Math.cos((t * Math.PI) / 2), in: Math.sin((t * Math.PI) / 2) };
}

/** Eşit güçlü giriş/çıkış eğrisi (setValueCurveAtTime için), `steps` örnek. */
export function fadeCurve(kind: 'in' | 'out', steps = 32): Float32Array {
  const c = new Float32Array(steps);
  for (let i = 0; i < steps; i++) c[i] = equalPower(i / (steps - 1))[kind];
  return c;
}

/**
 * Döngü takvimi: klip `duration` sn, ardışık kopyalar `crossfade` sn üst üste biner (dikiş gizlenir). Klip
 * çapraz geçişten kısaysa geçiş klibin yarısına iner. Döner: her kopyanın başlangıcı (sn, `from`dan itibaren).
 */
export function loopStarts(duration: number, crossfade: number, from: number, until: number): number[] {
  const xf = effectiveCrossfade(duration, crossfade);
  const step = duration - xf;
  const out: number[] = [];
  for (let t = from; t < until && out.length < 10_000; t += step) out.push(t);
  return out;
}

export const effectiveCrossfade = (duration: number, crossfade: number): number => Math.max(0, Math.min(crossfade, duration / 2));

/** Desibelden doğrusal kazanca. */
export const dbToGain = (db: number): number => 10 ** (db / 20);

// ------------------------------------------------------------------ ayarlar

export type Channel = 'master' | 'ambient' | 'music' | 'effects';
export interface SoundSettings {
  volume: Record<Channel, number>;
  muted: Record<Channel, boolean>;
}
export const DEFAULT_SETTINGS: SoundSettings = {
  volume: { master: 0.8, ambient: 1, music: 1, effects: 1 },
  muted: { master: false, ambient: false, music: false, effects: false },
};
export const SETTINGS_KEY = 'rpg-battle-ses';

type Store = Pick<Storage, 'getItem' | 'setItem'> | null;
const store = (): Store => { try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; } };

/** Kayıtlı ayarlar (bozuk ya da yoksa varsayılan; eksik alanlar varsayılandan). */
export function loadSoundSettings(s: Store = store()): SoundSettings {
  try {
    const raw = s?.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const v = JSON.parse(raw) as Partial<SoundSettings>;
    const clamp = (x: unknown, d: number) => (typeof x === 'number' && Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : d);
    const volume = { ...DEFAULT_SETTINGS.volume };
    const muted = { ...DEFAULT_SETTINGS.muted };
    for (const k of Object.keys(volume) as Channel[]) {
      volume[k] = clamp(v.volume?.[k], DEFAULT_SETTINGS.volume[k]);
      muted[k] = v.muted?.[k] === true;
    }
    return { volume, muted };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSoundSettings(v: SoundSettings, s: Store = store()): void {
  try { s?.setItem(SETTINGS_KEY, JSON.stringify(v)); } catch { /* yalnızca bu oturumda */ }
}

/** Kanalın son kazancı: kaydırıcı × veri seviyesi; kapalıysa 0 (ana ses ayrı düğümde). */
export function channelGain(v: SoundSettings, ch: Channel, levelDb = 0): number {
  if (v.muted[ch]) return 0;
  return v.volume[ch] * dbToGain(levelDb);
}

// ------------------------------------------------------------------ zar sesleri

export type DiceGroup = keyof SoundConfig['dice'];

/** Gruptan rastgele klip; az önce çalanı (varsa ve başka seçenek varsa) seçmez. */
export function pickClip(group: DiceGroup, last: string | undefined, rand: () => number, cfg: SoundConfig = SOUND): string | null {
  const all = DICE_CLIPS[cfg.dice[group]] ?? [];
  const pool = all.length > 1 ? all.filter((c) => c !== last) : all;
  if (pool.length === 0) return null;
  return pool[Math.min(pool.length - 1, Math.floor(rand() * pool.length))] ?? null;
}

/** Zar olayı → çalınacak gruplar (sırayla). Atış: zar sayısına göre tekli/çoklu; durma: dur, doğal 20/1 ayrıca. */
export function diceGroups(e: { type: 'throw'; count: number } | { type: 'bounce' } | { type: 'settle'; crit: boolean; fumble: boolean }): DiceGroup[] {
  if (e.type === 'throw') return [e.count > 1 ? 'multi' : 'single'];
  if (e.type === 'bounce') return ['bounce'];
  return ['settle', ...(e.crit ? ['crit' as const] : []), ...(e.fumble ? ['fumble' as const] : [])];
}
