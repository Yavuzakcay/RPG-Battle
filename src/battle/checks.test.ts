import { describe, it, expect } from 'vitest';
import { getMonster } from '../data';
import { combatantFromMonster } from './create';
import { execute } from './index';
import { GM, P1, mk, scripted, setup } from './fixtures';

describe('beceri kontrolü (GM komutu)', () => {
  it('d20 + beceri bonusu DC\'ye karşı; sıra beklemez; durum değişmez', () => {
    const s = setup('Düz', { A: { skills: { athletics: 5 } } });
    const r = execute(s, { type: 'skill_check', actorId: 'A', skill: 'athletics', dc: 12 }, GM, scripted([20, 7]));
    if (!r.ok) throw new Error(r.error);
    const e = r.events[0];
    expect(e?.type === 'skill_checked' && [e.total, e.success]).toEqual([12, true]);
    expect(r.state).toEqual(s);
  });
  it('oyuncu isteyemez; ağır zırh Stealth\'te dezavantaj', () => {
    const s = setup('Düz', { A: { stealthDisadvantage: true } });
    expect(execute(s, { type: 'skill_check', actorId: 'A', skill: 'stealth', dc: 10 }, P1, scripted()).ok).toBe(false);
    const r = execute(s, { type: 'skill_check', actorId: 'A', skill: 'stealth', dc: 10 }, GM, scripted([20, 15], [20, 4]));
    const e = r.ok ? r.events[0] : undefined;
    expect(e?.type === 'skill_checked' && [e.mode, e.natural]).toEqual(['disadvantage', 4]);
  });
});

describe('canavar becerileri (SRD 5.2.1 Skills satırı)', () => {
  it('Wolf: Perception +5, Stealth +4; listede olmayan ability modifier\'ı', () => {
    const w = combatantFromMonster(getMonster('wolf'), { id: 'w' });
    expect(w.skills).toEqual({ perception: 5, stealth: 4 });
    expect(mk('x').skills).toEqual({});
  });
});
