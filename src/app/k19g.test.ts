/**
 * Kuyruk 19 (0g): hata listesinin doğrulama maddeleri. 26: özel canavar adı 50 karakter; 29: zar teması seçimi;
 * 32: geçmiş çeşitlendirme (SRD 4 + özgün 8); ana menüde Durum düğmesi yok (m1.test.tsx sınar).
 */
import { describe, expect, it } from 'vitest';
import { CUSTOM_NAME_MAX } from './limits';
import { customMonsterProblems } from './setup';
import { DICE_THEMES, DEFAULT_DICE_THEME, diceThemeOf } from '../ui/diceTheme';
import backgrounds from '../../data/backgrounds.json';

describe('Kuyruk 19: hata listesi doğrulamaları', () => {
  const base = { name: 'x', ac: 13, hp: 20, speed: 30, attackName: 'Pala', attackBonus: 4, damage: '1d6+2', damageType: 'slashing', ranged: false };
  it('26: özel canavar adı en çok 50 karakter', () => {
    expect(CUSTOM_NAME_MAX).toBe(50);
    expect(customMonsterProblems({ ...base, name: 'a'.repeat(50) })).toEqual([]);
    expect(customMonsterProblems({ ...base, name: 'a'.repeat(51) }).length).toBeGreaterThan(0);
  });
  it('29: zar teması seçilebilir (Klasik + üç renk teması), bilinmeyen kimlik varsayılana düşer', () => {
    expect(DICE_THEMES.length).toBeGreaterThanOrEqual(4);
    expect(diceThemeOf('yok-boyle-tema').id).toBe(DEFAULT_DICE_THEME);
  });
  it('32: geçmişler çeşitlendi (en az 12; SRD 4 + özgün)', () => {
    const list = (Array.isArray(backgrounds) ? backgrounds : (backgrounds as { backgrounds: unknown[] }).backgrounds) as Array<{ id: string; ozgun?: boolean }>;
    expect(list.length).toBeGreaterThanOrEqual(12);
    expect(list.filter((b) => !b.ozgun).length).toBe(4);
  });
});
