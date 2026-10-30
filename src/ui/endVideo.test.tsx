/** Görev U3: savaş sonu başlık videosu (plan, akış, ayar, dosyalar). */
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import EndVideo from './EndVideo';
import { EndVideoGate, endVideoPlan, type EndVideoExit } from './endVideo';
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
});
