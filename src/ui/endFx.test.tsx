/** Görev U: savaş sonu efekti ve ezgisi. */
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import EndFx from './EndFx';
import { playEndJingle } from './audio/sound';
import { SOUND } from './audio/soundPlan';
import klipler from '../../data/ses-klipler.json';

const files = new Set(Object.keys(import.meta.glob('/public/ses/*.mp3')).map((f) => f.replace('/public/ses/', '').replace(/\.mp3$/, '')));

describe('savaş sonu', () => {
  it('zaferde parıltı ve konfeti, yenilgide yalnızca karartma; tıklamayı yutmaz (aria-hidden)', () => {
    const win = renderToStaticMarkup(<EndFx outcome="victory" />);
    expect(win).toContain('end-fx victory');
    expect(win).toContain('aria-hidden="true"');
    expect((win.match(/end-fx-bit/g) ?? []).length).toBeGreaterThan(10);
    const lose = renderToStaticMarkup(<EndFx outcome="defeat" />);
    expect(lose).toContain('end-fx defeat');
    expect(lose).not.toContain('end-fx-bit');
  });
  it('ezgiler veride, dosyaları ve klip kaydı var (yer tutucu, ASCII ad)', () => {
    for (const name of [SOUND.end.victory, SOUND.end.defeat]) {
      expect(name).toMatch(/^[a-z0-9-]+$/);
      expect(files.has(name)).toBe(true);
      expect((klipler.files as Record<string, { category: string }>)[name]?.category).toBe('son');
    }
  });
  it('ses motoru yüklenmeden (dokunuş yok) ezgi çalmaz', () => {
    expect(playEndJingle('victory')).toBeNull();
  });
});
