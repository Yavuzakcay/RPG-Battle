/** Görev U3: savaş sonu başlık videosu (plan, akış, ayar, dosyalar). */
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import EndVideo from './EndVideo';
import { endVideoMode } from './endVideoPlan';
import { EndVideoGate, endVideoPlan, type EndVideoExit } from './endVideoPlan';
import { storedEndVideo } from './endVideoSetting';
import { BattleEndSound, liveFinish } from './audio/battleEnd';
import { SOUND } from './audio/soundPlan';
import cfg from '../../data/son-video.json';

const files = new Set(Object.keys(import.meta.glob('/public/son/*')).map((f) => f.replace('/public/son/', '')));
const on = { enabled: true, reducedMotion: false };

describe('savaş sonu başlık videosu', () => {
  it('yalnızca canlı bitişte: kayıttan açılan bitmiş savaşta ve sürerken plan yok', () => {
    const live = liveFinish('active', { status: 'finished', winner: 'party' });
    expect(endVideoPlan(live, 'tr', on)?.src).toBe('son/son-zafer.mp4');
    expect(endVideoPlan(liveFinish('finished', { status: 'finished', winner: 'party' }), 'tr', on)).toBeNull();
    expect(endVideoPlan(liveFinish('active', { status: 'active' }), 'tr', on)).toBeNull();
    expect(endVideoPlan('defeat', 'en', on)?.src).toBe('son/son-defeat.mp4');
    expect(endVideoPlan('defeat', 'tr', on)?.poster).toBe('son/son-bozgun-poster.jpg');
  });
  it('ayar kapalıyken tetiklenmez; varsayılan açık; hareketi azalt: poster 2 sn', () => {
    expect(endVideoPlan('victory', 'tr', { enabled: false, reducedMotion: false })).toBeNull();
    expect(storedEndVideo()).toBe(true);
    const p = endVideoPlan('victory', 'tr', { enabled: true, reducedMotion: true });
    expect(p?.kind).toBe('poster');
    expect(p?.holdMs).toBe(2000);
  });
  it('sıra: müzik söner (fadeOutMs), video başlar, ezgi videonun başından 300 ms sonra', () => {
    const p = endVideoPlan('victory', 'tr', on);
    expect(p?.startMs).toBe(SOUND.end.fadeOutMs);
    expect(p?.jingleMs).toBe(SOUND.end.fadeOutMs + 300);
  });
  it('hata ya da zaman aşımında sonuç ekranı açılır (bir kez); ezgi sürer', () => {
    const done: EndVideoExit[] = [];
    let stopped = 0;
    const g = new EndVideoGate({ onDone: (w) => done.push(w), stopJingle: () => { stopped++; } });
    expect(g.exit('error')).toBe(true);
    expect(g.exit('ended')).toBe(false);
    expect(done).toEqual(['error']);
    expect(stopped).toBe(0);
  });
  it('dokunarak geçince ezgi jingleStopMs ile söner', () => {
    const calls: string[] = [];
    const timers: Array<() => void> = [];
    const engine = { playEffect: (n: string) => calls.push(`play:${n}`), stopEffect: (n: string, s: number) => calls.push(`stop:${n}:${s}`) };
    const sound = new BattleEndSound({ engine: () => engine, settings: () => ({ muted: { master: false, effects: false } }) as never,
      setTimer: (f) => { timers.push(f); return timers.length; }, clearTimer: () => {} });
    const plan = endVideoPlan('victory', 'tr', on);
    expect(sound.finish('b1', 'victory', plan?.jingleMs)).toBe(SOUND.end.victory);
    timers.forEach((f) => f());
    const done: EndVideoExit[] = [];
    const g = new EndVideoGate({ onDone: (w) => done.push(w), stopJingle: () => sound.leave() });
    g.exit('tap');
    expect(done).toEqual(['tap']);
    expect(calls).toEqual([`play:${SOUND.end.victory}`, `stop:${SOUND.end.victory}:${SOUND.end.jingleStopMs / 1000}`]);
  });
  it('video sessiz, satır içi, poster karesiyle; hareketi azaltta yalnızca poster', () => {
    const v = renderToStaticMarkup(<EndVideo plan={endVideoPlan('victory', 'tr', on)!} label="x" onDone={() => {}} stopJingle={() => {}} />);
    expect(v).toContain('muted');
    expect(v).toContain('playsInline'.toLowerCase());
    expect(v).toContain('son-zafer-poster.jpg');
    expect(v).toContain('son-zafer.webm');
    const r = renderToStaticMarkup(<EndVideo plan={endVideoPlan('defeat', 'en', { enabled: true, reducedMotion: true })!} label="x" onDone={() => {}} stopJingle={() => {}} />);
    expect(r).not.toContain('<video');
    expect(r).toContain('son-defeat-poster.jpg');
  });
  it('dört video ve posterleri public/son/ altında', () => {
    for (const set of Object.values(cfg.files)) for (const n of Object.values(set)) {
      expect(files.has(`${n}.mp4`), n).toBe(true);
      expect(files.has(`${n}.webm`), n).toBe(true);
      expect(files.has(`${n}-poster.jpg`), n).toBe(true);
    }
  });
  it('SV1: şeffaf kip: screen karışımı, karartma ve geçiş süresi veriden; tıklama katmanı; hareketi azalt posteri aynı kipte', () => {
    const plan = endVideoPlan('victory', 'tr', on)!;
    expect(plan.dim).toBe(cfg.karartma); expect(plan.dim).toBeGreaterThanOrEqual(0.35); expect(plan.dim).toBeLessThanOrEqual(0.5);
    expect(plan.fadeMs).toBe(cfg.gecisMs);
    const v = renderToStaticMarkup(<EndVideo plan={plan} label="x" mode="blend" onDone={() => {}} stopJingle={() => {}} />);
    expect(v).toContain('end-video blend'); expect(v).toContain('data-mode="blend"');
    expect(v).toContain('end-video-dim'); expect(v).toContain('end-video-media'); expect(v).toContain('end-video-click');
    expect(v).toContain(`--end-dim:${cfg.karartma}`); expect(v).toContain(`--end-fade:${cfg.gecisMs}ms`);
    for (const [lang, o] of [['tr', 'victory'], ['tr', 'defeat'], ['en', 'victory'], ['en', 'defeat']] as const) {
      const h = renderToStaticMarkup(<EndVideo plan={endVideoPlan(o, lang, on)!} label="x" mode="blend" onDone={() => {}} stopJingle={() => {}} />);
      expect(h).toContain('end-video blend');
    }
    const r = renderToStaticMarkup(<EndVideo plan={endVideoPlan('defeat', 'en', { enabled: true, reducedMotion: true })!} label="x" mode="blend" onDone={() => {}} stopJingle={() => {}} />);
    expect(r).not.toContain('<video'); expect(r).toContain('end-video blend'); expect(r).toContain('<img class="end-video-media"');
  });
  it('SV1: yedek: blend desteklenmiyorsa ya da efekt animasyonu kapalıysa eski siyah zemin (solid, karartma katmanı yok)', () => {
    expect(endVideoMode({ effects: true, supported: true })).toBe('blend');
    expect(endVideoMode({ effects: true, supported: false })).toBe('solid');
    expect(endVideoMode({ effects: false, supported: true })).toBe('solid');
    const plan = endVideoPlan('victory', 'tr', on)!;
    const s = renderToStaticMarkup(<EndVideo plan={plan} label="x" mode="solid" onDone={() => {}} stopJingle={() => {}} />);
    expect(s).toContain('end-video solid'); expect(s).not.toContain('end-video-dim');
    // test ortamında CSS.supports yok: otomatik kip de güvenli yedek
    expect(renderToStaticMarkup(<EndVideo plan={plan} label="x" onDone={() => {}} stopJingle={() => {}} />)).toContain('end-video solid');
  });
  it('SV1: ses zamanlaması değişmedi (başlangıç fadeOutMs, ezgi +jingleAfterStartMs)', () => {
    const plan = endVideoPlan('victory', 'tr', on)!;
    expect(plan.startMs).toBe(SOUND.end.fadeOutMs);
    expect(plan.jingleMs).toBe(SOUND.end.fadeOutMs + cfg.jingleAfterStartMs);
  });
});
