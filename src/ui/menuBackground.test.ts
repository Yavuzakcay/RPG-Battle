import { describe, it, expect } from 'vitest';
import { menuBackgroundSources } from './MenuBackground';

describe('menü arka planı', () => {
  it('ekran yönüne ve temaya göre dosya; hareketsizde yalnızca poster', () => {
    expect(menuBackgroundSources({ portrait: false, dark: false, motion: true }))
      .toEqual({ video: 'acilis/acilis-pc-light.mp4', poster: 'acilis/acilis-pc-light.webp' });
    expect(menuBackgroundSources({ portrait: true, dark: true, motion: true }))
      .toEqual({ video: 'acilis/acilis-mobil-dark.mp4', poster: 'acilis/acilis-mobil-dark.webp' });
    expect(menuBackgroundSources({ portrait: true, dark: false, motion: false }).video).toBe(null);
  });
});
