/**
 * Savaş sonu ses düzeni (Görev U2), sahte ses motoruyla: müzik ve ortam kısılır (sessiz sahne), ezgi gecikmeyle başlar,
 * ezgiden sonra müzik geri gelmez, erken kapatma, ayarlar, çift tetik, kayıttan açılan bitmiş savaş.
 */
import { describe, expect, it } from 'vitest';
import { BattleEndSound, endSilenceScene, liveFinish, type EndSoundEngine } from './battleEnd';
import { DEFAULT_SETTINGS, SOUND, type SoundSettings } from './soundPlan';
import { battleSoundScene } from './sound';
import { setup } from '../../battle/fixtures';

/** Sahte motor ve elle ilerletilen zamanlayıcı. */
function rig(settings: SoundSettings = DEFAULT_SETTINGS, withEngine = true) {
  const calls: string[] = [];
  const engine: EndSoundEngine = {
    playEffect: (n) => { calls.push(`play:${n}`); },
    stopEffect: (n, f) => { calls.push(`stop:${n}:${f}`); },
  };
  let now = 0;
  const timers: Array<{ at: number; f: () => void; id: number; done?: boolean }> = [];
  let seq = 0;
  const end = new BattleEndSound({
    engine: () => (withEngine ? engine : null),
    settings: () => settings,
    setTimer: (f, ms) => { seq += 1; timers.push({ at: now + ms, f, id: seq }); return seq; },
    clearTimer: (id) => { const t = timers.find((x) => x.id === id); if (t) t.done = true; },
  });
  const advance = (ms: number) => {
    now += ms;
    for (const t of timers) if (!t.done && t.at <= now) { t.done = true; t.f(); }
  };
  return { end, calls, advance };
}

const muted = (p: Partial<SoundSettings['muted']>): SoundSettings => ({ ...DEFAULT_SETTINGS, muted: { ...DEFAULT_SETTINGS.muted, ...p } });

describe('savaş sonu ses düzeni (Görev U2)', () => {
  it('süreler veride: kısılma 0,5–0,8 sn, ezgi gecikmesi ≈0,3 sn, erken kapatmada ezgi 0,3 sn', () => {
    expect(SOUND.end.fadeOutMs).toBeGreaterThanOrEqual(500);
    expect(SOUND.end.fadeOutMs).toBeLessThanOrEqual(800);
    expect(SOUND.end.jingleDelayMs).toBe(300);
    expect(SOUND.end.jingleStopMs).toBe(300);
  });
  it('savaş bitince sahne sessizleşir: müzik ve ortam fadeOutMs içinde kısılır; bitmiş savaş hep sessiz (ezgiden sonra geri gelmez)', () => {
    const silent = endSilenceScene();
    expect(silent).toMatchObject({ ambient: [], music: null, exitFade: SOUND.end.fadeOutMs / 1000 });
    const live = setup('Düz');
    expect(battleSoundScene(live).music).not.toBeNull();
    expect(battleSoundScene({ ...live, status: 'finished', winner: 'party' })).toEqual(silent);
  });
  it('ezgi kısılma başladıktan jingleDelayMs sonra bir kez çalar', () => {
    const { end, calls, advance } = rig();
    expect(end.finish('s1', 'victory')).toBe(SOUND.end.victory);
    advance(SOUND.end.jingleDelayMs - 1);
    expect(calls).toEqual([]);
    advance(1);
    expect(calls).toEqual([`play:${SOUND.end.victory}`]);
    advance(10000);
    expect(calls).toHaveLength(1);
  });
  it('çift tetik (replay, yeniden çizim): aynı savaş için ezgi bir kez', () => {
    const { end, calls, advance } = rig();
    end.finish('s1', 'defeat');
    expect(end.finish('s1', 'defeat')).toBeNull();
    advance(1000);
    expect(calls).toEqual([`play:${SOUND.end.defeat}`]);
    expect(end.finish('s2', 'victory')).toBe(SOUND.end.victory);
  });
  it('ekran ezgi başlamadan kapanırsa ezgi çalmaz; çalarken kapanırsa 0,3 sn içinde kısılıp durur', () => {
    const a = rig();
    a.end.finish('s1', 'victory');
    a.end.leave();
    a.advance(1000);
    expect(a.calls).toEqual([]);
    const b = rig();
    b.end.finish('s1', 'victory');
    b.advance(400);
    b.end.leave();
    expect(b.calls).toEqual([`play:${SOUND.end.victory}`, `stop:${SOUND.end.victory}:${SOUND.end.jingleStopMs / 1000}`]);
    expect(b.end.state()).toEqual({ pending: null, playing: null });
  });
  it('ayarlar: ana ses ya da efektler kapalıysa ezgi yok; müzik kapalıyken ezgi çalar; motor yoksa sessiz', () => {
    for (const s of [muted({ master: true }), muted({ effects: true })]) {
      const r = rig(s);
      expect(r.end.finish('s1', 'victory')).toBeNull();
      r.advance(1000);
      expect(r.calls).toEqual([]);
    }
    const m = rig(muted({ music: true, ambient: true }));
    m.end.finish('s1', 'victory');
    m.advance(1000);
    expect(m.calls).toEqual([`play:${SOUND.end.victory}`]);
    expect(rig(DEFAULT_SETTINGS, false).end.finish('s1', 'victory')).toBeNull();
  });
  it('yalnızca canlı geçişte: kayıttan açılan bitmiş savaşta (önceki durum da bitmiş) ezgi yok', () => {
    expect(liveFinish('active', { status: 'finished', winner: 'party' })).toBe('victory');
    expect(liveFinish('active', { status: 'finished', winner: 'enemies' })).toBe('defeat');
    expect(liveFinish('finished', { status: 'finished', winner: 'party' })).toBeNull();
    expect(liveFinish('active', { status: 'active' })).toBeNull();
  });
});
