/**
 * Kuyruk K52: hizalanma ↔ Moral bağı savaşa girmez. Moral tam modu açıkken hizalanma + hizalanmaMoral kapalı/açık iki
 * koşum aynı sonucu verir (4 senaryo × 5 tohum, 3. seviye). Uzun ölçüm (30 tohum) DENGE.md'de.
 */
import { describe, expect, it } from 'vitest';
import { measure, SCENARIOS, setSimHouseRules } from './balance';
import { houseRuleDefaults } from '../battle/houseRules';

describe('K52 duman: Moral bağı savaş ölçümünü değiştirmez', () => {
  it('col, kale, magara, orman × 5 tohum: kapalı = açık', () => {
    const base = { ...houseRuleDefaults(), moralSistemi: true };
    const pick = SCENARIOS.filter((s) => ['col', 'kale', 'magara', 'orman'].includes(s.id));
    const run = (r: Record<string, boolean>) => { setSimHouseRules(r); try { return pick.map((s) => { const m = measure(s, 5, 1, 3); return [m.partyWins, m.avgRounds, m.avgDead]; }); } finally { setSimHouseRules(null); } };
    const off = run(base);
    const on = run({ ...base, hizalanma: true, hizalanmaMoral: true });
    expect(on).toEqual(off);
  }, 240000);
});
