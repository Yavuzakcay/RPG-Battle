/**
 * Savaş sonu ses düzeni (Görev U2). Savaş canlı olarak bitince (zafer ya da yenilgi):
 * - savaş müziği ve ortam sesi `fadeOutMs` içinde kısılıp durur (savaş katmanının sahnesi sessiz sahneye geçer,
 *   motorun mevcut kısma yolu: `setScene` + `exitFade`);
 * - ezgi kısılma başladıktan `jingleDelayMs` sonra efekt kanalından tam seviyede çalar (zar efektleri etkilenmez);
 * - ezgi bitince müzik ve ortam geri gelmez: savaş sonu ekranı sessiz kalır (sahne `finished` oldukça sessiz);
 * - ekran ezgi bitmeden kapanırsa ezgi `jingleStopMs` içinde kısılıp durur, bekleyen ezgi hiç çalmaz.
 * Aynı savaş için bir kez çalışır (savaş kimliğiyle); kayıttan açılan bitmiş savaşta ezgi yoktur (çağıran yalnızca
 * canlı geçişte `finish` çağırır). Ayarlar: ezgi efekt kanalında; ana ses ya da efektler kapalıysa çalmaz (müzik
 * kanalının kapalı olması ezgiyi etkilemez).
 */
import type { Scene } from './engine';
import { SOUND, type SoundSettings } from './soundPlan';

/** Ezgiyi çalan/durduran motor yüzü (gerçek motor ya da test sahtesi). */
export interface EndSoundEngine {
  playEffect(name: string): void;
  stopEffect(name: string, fadeSec: number): void;
}

export interface BattleEndDeps {
  engine: () => EndSoundEngine | null;
  settings: () => SoundSettings;
  setTimer?: (f: () => void, ms: number) => unknown;
  clearTimer?: (t: unknown) => void;
}

/**
 * Canlı savaş sonu geçişi mi: önceki durum bitmemiş, şimdiki bitmiş ve kazanan belli. Kayıttan açılan bitmiş savaşta
 * önceki durum da `finished` olduğu için ezgi çalmaz.
 */
export function liveFinish(prev: string, next: { status: string; winner?: string }): 'victory' | 'defeat' | null {
  if (prev === 'finished' || next.status !== 'finished' || !next.winner) return null;
  return next.winner === 'party' ? 'victory' : 'defeat';
}

/** Savaş sonu sessiz sahnesi: gidenler (savaş müziği, ortam) `fadeOutMs` içinde kısılır. */
export function endSilenceScene(cfg = SOUND): Scene {
  return { key: 'battle:end', ambient: [], music: null, musicLevel: 'battle', musicFadeIn: 0, exitFade: cfg.end.fadeOutMs / 1000 };
}

export class BattleEndSound {
  private done = new Set<string>();
  private timer: unknown = null;
  private pending: string | null = null;
  private playing: string | null = null;
  private setTimer: (f: () => void, ms: number) => unknown;
  private clearTimer: (t: unknown) => void;

  constructor(private deps: BattleEndDeps, private cfg = SOUND) {
    this.setTimer = deps.setTimer ?? ((f, ms) => globalThis.setTimeout(f, ms));
    this.clearTimer = deps.clearTimer ?? ((t) => globalThis.clearTimeout(t as ReturnType<typeof setTimeout>));
  }

  /**
   * Savaş canlı olarak bitti: ezgi gecikmeyle çalar (aynı savaş için bir kez). Döner: çalınacak klip ya da null
   * (ayarlar kapalı, motor yok, zaten çalındı).
   */
  finish(battleId: string, outcome: 'victory' | 'defeat'): string | null {
    if (this.done.has(battleId)) return null;
    this.done.add(battleId);
    const s = this.deps.settings();
    if (s.muted.master || s.muted.effects || !this.deps.engine()) return null;
    const clip = this.cfg.end[outcome];
    this.pending = clip;
    this.timer = this.setTimer(() => {
      this.timer = null;
      this.pending = null;
      const e = this.deps.engine();
      if (!e) return;
      e.playEffect(clip);
      this.playing = clip;
    }, this.cfg.end.jingleDelayMs);
    return clip;
  }

  /** Savaş ekranı kapandı: bekleyen ezgi iptal, çalan ezgi kısılıp durur. */
  leave(): void {
    if (this.timer !== null) { this.clearTimer(this.timer); this.timer = null; }
    this.pending = null;
    const clip = this.playing;
    this.playing = null;
    if (clip) this.deps.engine()?.stopEffect(clip, this.cfg.end.jingleStopMs / 1000);
  }

  /** Test ve doğrulama için durum. */
  state(): { pending: string | null; playing: string | null } {
    return { pending: this.pending, playing: this.playing };
  }
}
