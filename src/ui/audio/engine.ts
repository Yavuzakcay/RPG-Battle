/**
 * Ses motoru (Görev S, Web Audio API). Kanallar: ortam, müzik, efekt → ana ses → çıkış.
 * - AudioContext ilk kullanıcı dokunuşunda başlar (tarayıcının otomatik oynatma engeli); sekme arka plana geçince
 *   askıya alınır, geri gelince devam eder. Bu modül ayrı parça: ilk dokunuşta yüklenir (`sound.tsx`).
 * - Ortam: sahnenin her klibi (a ve b) kendi uzunluğunda ayrı döngüde çalar; döngü dikişi eşit güçlü çapraz geçişle
 *   gizlenir. Müzik de çapraz geçişli döngü.
 * - Sahne değişince eski parçalar yavaşça kapanır, yenileri açılır; artık kullanılmayan klipler bellekten atılır.
 * - Klipler yalnızca ihtiyaç olunca yüklenir (fetch + decodeAudioData).
 * Zamanlama hesapları saf `soundPlan.ts`'te.
 */
import {
  DEFAULT_SETTINGS, SOUND, channelGain, diceGroups, effectiveCrossfade, fadeCurve, pickClip, soundUrl,
  type Channel, type DiceGroup, type SoundSettings,
} from './soundPlan';
import type { DiceSoundEvent } from '../diceSound';

type Ctx = AudioContext;

/** Döngülü parça: klibin kopyaları üst üste binerek (çapraz geçiş) sırayla çalar. */
class Looper {
  private nodes: AudioBufferSourceNode[] = [];
  private timer: number | null = null;
  readonly out: GainNode;
  private stopped = false;

  constructor(private ctx: Ctx, private buffer: AudioBuffer, dest: AudioNode, private crossfade: number) {
    this.out = ctx.createGain();
    this.out.gain.value = 0;
    this.out.connect(dest);
  }

  /** `fadeIn` sn içinde açılarak başlar; başlangıç noktası rastgele kayabilir (iki klip aynı anda dikiş yapmasın). */
  start(fadeIn: number, offset = 0): void {
    const now = this.ctx.currentTime;
    this.out.gain.setValueAtTime(0, now);
    this.out.gain.setValueCurveAtTime(fadeCurve('in'), now, Math.max(0.05, fadeIn));
    this.schedule(now, offset, true);
  }

  private schedule(at: number, offset: number, first: boolean): void {
    if (this.stopped) return;
    const dur = this.buffer.duration;
    const xf = effectiveCrossfade(dur, this.crossfade);
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffer;
    const g = this.ctx.createGain();
    src.connect(g).connect(this.out);
    const playLen = dur - offset;
    // Giriş (ilk kopya hariç) ve çıkış eşit güçlü eğriyle: üst üste binen iki kopyanın toplam gücü sabit.
    if (!first && xf > 0) { g.gain.setValueAtTime(0, at); g.gain.setValueCurveAtTime(fadeCurve('in'), at, xf); } else g.gain.setValueAtTime(1, at);
    if (xf > 0 && playLen > xf) g.gain.setValueCurveAtTime(fadeCurve('out'), at + playLen - xf, xf);
    src.start(at, offset);
    src.stop(at + playLen + 0.05);
    this.nodes.push(src);
    src.onended = () => { this.nodes = this.nodes.filter((n) => n !== src); try { g.disconnect(); } catch { /* yok */ } };
    const next = at + Math.max(0.05, playLen - xf);
    const wait = Math.max(0, (next - this.ctx.currentTime - 1) * 1000);
    this.timer = window.setTimeout(() => this.schedule(next, 0, false), wait);
  }

  /** `fade` sn içinde kapanır ve durur. */
  stop(fade: number): void {
    this.stopped = true;
    if (this.timer !== null) window.clearTimeout(this.timer);
    const now = this.ctx.currentTime;
    const g = this.out.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0, now + Math.max(0.05, fade));
    const end = now + fade + 0.1;
    for (const n of this.nodes) { try { n.stop(end); } catch { /* yok */ } }
    window.setTimeout(() => { try { this.out.disconnect(); } catch { /* yok */ } }, (fade + 0.2) * 1000);
  }
}

export interface Scene {
  /** Sahne kimliği (aynıysa değişiklik yok). */
  key: string;
  ambient: string[];
  music: string | null;
  /** Müzik kanalı mı menü seviyesi mi (menü müziği daha alçak). */
  musicLevel: 'battle' | 'menu';
  /** Müziğin açılış süresi (sn; savaş başlarken yavaşça). */
  musicFadeIn: number;
}

export class SoundEngine {
  private ctx: Ctx | null = null;
  private buses: Partial<Record<Channel, GainNode>> = {};
  private menuGain: GainNode | null = null;
  private buffers = new Map<string, Promise<AudioBuffer | null>>();
  private loops = new Map<string, Looper>();
  private scene: Scene | null = null;
  private settings: SoundSettings = DEFAULT_SETTINGS;
  private lastClip = new Map<DiceGroup, string>();
  private lastPlayed = new Map<string, number>();
  private unlocked = false;
  /** Çalınan efekt klipleri (tarayıcı doğrulaması için sayaç ve son adlar). */
  private effects: string[] = [];
  private base: string;

  constructor(base = '/') {
    this.base = base;
  }

  /** Bağlamı kur (kullanıcı dokunuşundan sonra çağrılır). */
  private ensure(): Ctx | null {
    if (this.ctx) return this.ctx;
    const AC = (globalThis as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
      ?? (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    const ctx = new AC();
    this.ctx = ctx;
    const master = ctx.createGain();
    master.connect(ctx.destination);
    this.buses.master = master;
    for (const ch of ['ambient', 'music', 'effects'] as const) {
      const g = ctx.createGain();
      g.connect(master);
      this.buses[ch] = g;
    }
    // Menü müziği müzik kanalından geçer ama kendi seviyesiyle.
    this.menuGain = ctx.createGain();
    this.menuGain.connect(this.buses.music as GainNode);
    this.applySettings(this.settings);
    return ctx;
  }

  /** Kullanıcı dokunuşunda çağrılır: bağlamı başlat ve bekleyen sahneyi çal. */
  unlock(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    void ctx.resume();
    if (!this.unlocked) {
      this.unlocked = true;
      const pending = this.scene;
      this.scene = null;
      if (pending) this.setScene(pending);
    }
  }

  /** Sekme gizlenince askıya al, görünür olunca devam et. */
  visibility(hidden: boolean): void {
    if (!this.ctx) return;
    if (hidden) void this.ctx.suspend();
    else if (this.unlocked) void this.ctx.resume();
  }

  applySettings(v: SoundSettings): void {
    this.settings = v;
    if (!this.ctx) return;
    const L = SOUND.levels;
    const set = (g: GainNode | undefined, value: number) => {
      if (!g || !this.ctx) return;
      g.gain.setTargetAtTime(value, this.ctx.currentTime, 0.05);
    };
    set(this.buses.master, channelGain(v, 'master'));
    set(this.buses.ambient, channelGain(v, 'ambient', L.ambientDb));
    set(this.buses.music, channelGain(v, 'music', L.musicDb));
    set(this.buses.effects, channelGain(v, 'effects', L.effectsDb));
    // Menü müziği müzik kanalının -9 dB'ini geri alıp kendi seviyesini uygular.
    set(this.menuGain ?? undefined, 10 ** ((L.menuDb - L.musicDb) / 20));
  }

  private load(name: string): Promise<AudioBuffer | null> {
    const hit = this.buffers.get(name);
    if (hit) return hit;
    const p = (async () => {
      const ctx = this.ensure();
      if (!ctx) return null;
      try {
        const res = await fetch(soundUrl(name, this.base));
        if (!res.ok) return null;
        return await ctx.decodeAudioData(await res.arrayBuffer());
      } catch {
        return null; // dosya yok ya da çözülemedi: sessiz
      }
    })();
    this.buffers.set(name, p);
    return p;
  }

  /**
   * Sahneyi çal: ortam klipleri ve müzik. Aynı kalan parçalar sürer; giden parçalar `exitFadeSec`'te kapanır,
   * gelenler açılır. Kullanılmayan klipler bellekten atılır. Bağlam açılmadan önce yalnızca istek saklanır.
   */
  setScene(next: Scene): void {
    if (this.scene?.key === next.key && this.unlocked) return;
    this.scene = next;
    if (!this.unlocked || !this.ensure()) return;
    const T = SOUND.timing;
    const want = new Map<string, { bus: GainNode; xf: number; fadeIn: number }>();
    for (const a of next.ambient) want.set(`a:${a}`, { bus: this.buses.ambient as GainNode, xf: T.loopCrossfadeSec, fadeIn: T.ambientFadeInSec });
    if (next.music) {
      want.set(`${next.musicLevel === 'menu' ? 'menu' : 'm'}:${next.music}`, {
        bus: (next.musicLevel === 'menu' ? this.menuGain : this.buses.music) as GainNode, xf: T.musicCrossfadeSec, fadeIn: next.musicFadeIn,
      });
    }
    for (const [key, loop] of this.loops) {
      if (!want.has(key)) {
        loop.stop(key.startsWith('menu:') ? T.themeCrossfadeSec : T.exitFadeSec);
        this.loops.delete(key);
      }
    }
    for (const [key, w] of want) {
      if (this.loops.has(key)) continue;
      const name = key.slice(key.indexOf(':') + 1);
      void this.load(name).then((buf) => {
        if (!buf || !this.ctx || this.scene !== next || this.loops.has(key)) return;
        const loop = new Looper(this.ctx, buf, w.bus, w.xf);
        // Ortamın ikinci klibi farklı yerden başlar: iki döngünün dikişleri çakışmaz.
        loop.start(w.fadeIn, key.startsWith('a:') && next.ambient.indexOf(name) > 0 ? buf.duration / 2 : 0);
        this.loops.set(key, loop);
      });
    }
    // Bellek: sahnede ve zar kliplerinde olmayan çözülmüş klipler atılır (geçiş bittikten sonra yeniden yüklenebilir).
    const keep = new Set([...want.keys()].map((k) => k.slice(k.indexOf(':') + 1)));
    for (const name of [...this.buffers.keys()]) if (!keep.has(name) && !name.startsWith('zar-')) this.buffers.delete(name);
  }

  /** Efekt klibi çal (yükleme bitince); aynı klip 40 ms içinde ikinci kez çalmaz (çoklu zar aynı anda durunca). */
  playEffect(name: string, gain = 1): void {
    if (!this.unlocked || !this.ensure()) return;
    const now = performance.now();
    if ((this.lastPlayed.get(name) ?? -1e9) > now - 40) return;
    this.lastPlayed.set(name, now);
    void this.load(name).then((buf) => {
      if (!buf || !this.ctx) return;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const g = this.ctx.createGain();
      g.gain.value = gain;
      src.connect(g).connect(this.buses.effects as GainNode);
      src.start();
      this.effects = [...this.effects.slice(-19), name];
      src.onended = () => { try { g.disconnect(); } catch { /* yok */ } };
    });
  }

  /** Zar olayı → klip(ler): rastgele, art arda aynı klip seçilmez. */
  dice(e: DiceSoundEvent): void {
    const groups = diceGroups(e.type === 'throw' ? { type: 'throw', count: e.count }
      : e.type === 'bounce' ? { type: 'bounce' } : { type: 'settle', crit: e.crit, fumble: e.fumble });
    const strength = e.type === 'bounce' ? Math.max(0.35, e.strength) : 1;
    for (const g of groups) {
      const clip = pickClip(g, this.lastClip.get(g), Math.random);
      if (!clip) continue;
      this.lastClip.set(g, clip);
      this.playEffect(clip, strength);
    }
  }

  /** Tarayıcı doğrulaması için durum (kanallar bağlı mı, ne çalıyor). */
  debug(): { state: string; unlocked: boolean; playing: string[]; buses: string[]; scene: string | null; effects: string[] } {
    return {
      state: this.ctx?.state ?? 'none', unlocked: this.unlocked, playing: [...this.loops.keys()],
      buses: Object.keys(this.buses), scene: this.scene?.key ?? null, effects: [...this.effects],
    };
  }
}
