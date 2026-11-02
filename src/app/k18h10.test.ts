/** Kuyruk 18 H10: özel canavarın yerel görseli (data URL, sınır) ve 50 karakter ad sınırı. */
import { describe, it, expect } from 'vitest';
import { CUSTOM_IMAGE_MAX, customMonster, customMonsterProblems, type CustomMonsterInput } from './setup';
import { monsterAvatar } from '../battle/avatar';

const base: CustomMonsterInput = { name: 'Gölge Kurt', ac: 13, hp: 20, speed: 40, attackName: 'Isırık', attackBonus: 4, damage: '1d6+2', damageType: 'piercing', ranged: false };
describe('K18 H10: özel canavar görseli', () => {
  it('data URL görsel jetona geçer; geçersiz ya da çok büyük görsel reddedilir', () => {
    const img = 'data:image/webp;base64,AAAA';
    expect(customMonsterProblems({ ...base, image: img })).toEqual([]);
    expect(monsterAvatar(customMonster({ ...base, image: img }, 'ozel-1')).src).toBe(img);
    expect(customMonsterProblems({ ...base, image: 'http://x/y.png' })).toContain('Görsel geçersiz ya da çok büyük.');
    expect(customMonsterProblems({ ...base, image: 'data:image/png;base64,' + 'A'.repeat(CUSTOM_IMAGE_MAX) })).toContain('Görsel geçersiz ya da çok büyük.');
    expect(customMonsterProblems({ ...base, name: 'x'.repeat(51) })).toContain('Ad en fazla 50 karakter olabilir.');
  });
});
