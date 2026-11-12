/** Eylem düğmesi açıklamaları: her menü öğesinin Türkçe açıklaması var, kullanılamıyorsa nedeni eklenir. */
import { describe, it, expect } from 'vitest';
import { actionHint, actionTip } from './actionHints';
import { TOP_KEYS } from './actionMenu';
import mapBattleSrc from '../MapBattle.tsx?raw';

describe('eylem düğmesi açıklamaları', () => {
  // Görev SD2: menü yapısı değişti (halka menü 6 büyük düğme + alt menüler). Tarama aralığı artık `moveItems` ile
  // halka menüyü kuran `const actorPx` arasında: Hareket alt menüsü, mainItems ve üst düzey `topItems` aynı blokta.
  // Sayfalama düğmesi `more` yalnız gezinme olduğu için açıklaması aranmaz.
  const block = mapBattleSrc.slice(mapBattleSrc.indexOf('const moveItems: Item[]'), mapBattleSrc.indexOf('const actorPx'));
  const keys = [...new Set([...block.matchAll(/key: '([a-z_]+)'/g)].map((m) => m[1] as string))].filter((k) => k !== 'more');

  it('menüdeki her düğme anahtarının açıklaması var (MapBattle ile aynı anahtarlar)', () => {
    expect(keys.length).toBeGreaterThanOrEqual(9);
    for (const k of keys) expect(actionHint(k), k).toBeTruthy();
  });
  it('halka menünün 6 büyük düğmesinin her birinin açıklaması var ve kaynakta üst düzey öğe olarak kurulur', () => {
    expect(TOP_KEYS).toEqual(['attack', 'move', 'spell', 'special', 'items', 'end']);
    for (const k of TOP_KEYS) {
      expect(actionHint(k), k).toBeTruthy();
      expect(block, k).toContain(`key: '${k}'`);
    }
  });
  it('değişken kimlikli öğeler (hayvan formu, slot yenileme, iksir) ortak açıklamayı kullanır', () => {
    expect(actionHint('shape-giant-eagle')).toBe(actionHint('shape'));
    expect(actionHint('magician-2')).toBe(actionHint('magician'));
    expect(actionHint('item-potions-of-healing')).toBe(actionHint('itemUse'));
    expect(actionHint('shape-off')).not.toBe(actionHint('shape'));
  });
  it('kullanılamayan düğmede neden de yazılır', () => {
    expect(actionTip('hide', { reason: 'Zaten gizli (DC 14).' })).toMatch(/Stealth.*Şu an kullanılamaz: Zaten gizli/);
    expect(actionTip('search', { disabled: true })).toMatch(/Şu an kullanılamaz\.$/);
    expect(actionTip('end')).toBe('Turunu bitir; sıra sonraki savaşçıya geçer.');
  });
});
