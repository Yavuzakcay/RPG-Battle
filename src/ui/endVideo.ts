/**
 * Savaş sonu başlık videosu (Görev U3; saf mantık, React yok). Canlı biten savaşta (zafer ya da yenilgi) sonuç
 * ekranından önce tam ekran video: dile göre dosya (`data/son-video.json`), "hareketi azalt"ta poster kare
 * `posterHoldMs`, ayar kapalıysa yok. Akış (`EndVideoGate`): video bitince, oynatılamazsa ya da dokununca bir kez
 * biter; dokunarak geçilirse ezgi `end.jingleStopMs` ile söner (çağıranın `stopJingle`'ı). Yeniden oynatma, simülasyon
 * ve kayıttan açılan bitmiş savaş canlı bitiş değildir (`liveFinish` null): video hiç planlanmaz.
 */
import cfg from '../../data/son-video.json';
import { SOUND } from './audio/soundPlan';
import type { Lang } from '../i18n/strings';

export type EndOutcome = 'victory' | 'defeat';
export interface EndVideoPlan {
  /** `video`: tam ekran video (poster karesiyle açılır); `poster`: hareketi azalt, poster kare `holdMs`. */
  kind: 'video' | 'poster';
  src: string;
  /** VP9 yedeği (H.264 çözmeyen tarayıcılar). */
  webm: string;
  poster: string;
  holdMs: number;
  /** Savaş bitişinden videonun başlamasına (müziğin sönmesi) ve ezgiye kadar geçen süre. */
  startMs: number;
  jingleMs: number;
}

const FILES = cfg.files as Record<Lang, Record<EndOutcome, string>>;

/** Canlı bitişte gösterilecek video ya da poster; ayar kapalıysa ya da canlı bitiş değilse null. */
export function endVideoPlan(outcome: EndOutcome | null, lang: Lang, opts: { enabled: boolean; reducedMotion: boolean }): EndVideoPlan | null {
  if (!outcome || !opts.enabled) return null;
  const name = (FILES[lang] ?? FILES.tr)[outcome];
  const startMs = SOUND.end.fadeOutMs;
  return {
    kind: opts.reducedMotion ? 'poster' : 'video',
    src: `${cfg.dir}${name}.mp4`, webm: `${cfg.dir}${name}.webm`, poster: `${cfg.dir}${name}-poster.jpg`,
    holdMs: cfg.posterHoldMs, startMs, jingleMs: startMs + cfg.jingleAfterStartMs,
  };
}

/** Oynamaya başlamazsa (otomatik oynatma kısıtı, yükleme) bu süre sonunda sonuç ekranına geçilir. */
export const START_TIMEOUT_MS = cfg.startTimeoutMs;

export type EndVideoExit = 'ended' | 'error' | 'tap' | 'timeout' | 'poster';

/** Videonun bitişi tek yerde: bir kez `onDone`; dokunarak geçişte önce ezgi söner. */
export class EndVideoGate {
  private closed = false;
  constructor(private deps: { onDone: (why: EndVideoExit) => void; stopJingle: () => void }) {}
  exit(why: EndVideoExit): boolean {
    if (this.closed) return false;
    this.closed = true;
    if (why === 'tap') this.deps.stopJingle();
    this.deps.onDone(why);
    return true;
  }
  get done(): boolean { return this.closed; }
}
