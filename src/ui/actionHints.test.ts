/** Eylem düğmesi açıklamaları: her menü öğesinin Türkçe açıklaması var, kullanılamıyorsa nedeni eklenir. */
import { describe, it, expect } from 'vitest';
import { ACTION_HINTS, actionTip } from './actionHints';
import mapBattleSrc from '../MapBattle.tsx?raw';

describe('eylem düğmesi açıklamaları', () => {
  it('menüdeki her düğme anahtarının açıklaması var (MapBattle ile aynı anahtarlar)', () => {
    const src = mapBattleSrc;
    const block = src.slice(src.indexOf('const moveItems: Item[]'), src.indexOf('const actorPx'));
    const keys = [...block.matchAll(/key: '([a-z_]+)'/g)].map((m) => m[1] as string);
    expect(keys.length).toBeGreaterThanOrEqual(9);
    for (const k of keys) expect(ACTION_HINTS[k], k).toBeTruthy();
  });
  it('kullanılamayan düğmede neden de yazılır', () => {
    expect(actionTip('hide', { reason: 'Zaten gizli (DC 14).' })).toMatch(/Stealth.*Şu an kullanılamaz: Zaten gizli/);
    expect(actionTip('search', { disabled: true })).toMatch(/Şu an kullanılamaz\.$/);
    expect(actionTip('end')).toBe('Turunu bitir; sıra sonraki savaşçıya geçer.');
  });
});
