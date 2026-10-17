/** Canavar saldırı ek etkileri (rider): ek hasar, koşullu hasar, hasar değişimi; süreli etkiyle çift uygulama yok. */
import { describe, it, expect } from 'vitest';
import { combatantFromMonster, execute, startBattle } from './index';
import type { BattleEvent, BattleState, Combatant } from './index';
import { getMonster, monsters } from '../data';
import { parseDice } from '../rules/dice';
import { GM, envId, mk, scripted } from './fixtures';
import { allRiders, riderOf } from './riders';
import { describeEvent } from '../ui/log';

const monster = (id: string, cid: string, p: Partial<Combatant> = {}): Combatant => ({ ...combatantFromMonster(getMonster(id), { id: cid }), ...p });
function arena(parts: Combatant[]): BattleState {
  return startBattle('r', envId('Düz'), parts, scripted(...parts.map((_, i) => [20, 20 - i] as [number, number]))).state;
}
const target = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', ac: 10, hp: 200, maxHp: 200, ...p });
const attack = (s: BattleState, id: string, name: string, rng: ReturnType<typeof scripted>) => {
  const i = s.combatants[id]?.attacks.findIndex((a) => a.name === name) ?? -1;
  const r = execute(s, { type: 'monster_attack', actorId: id, targetId: 'A', attackIndex: i }, GM, rng);
  if (!r.ok) throw new Error(r.error);
  return r;
};
const resolved = (events: BattleEvent[]) => events.find((e): e is Extract<BattleEvent, { type: 'attack_resolved' }> => e.type === 'attack_resolved');

describe('rider verisi', () => {
  it('rider metni olan her saldırı yapılandırılmış; zarlar geçerli, durum bilinen değerlerden', () => {
    const all = allRiders();
    const withRider = monsters.flatMap((m) => m.attacks.filter((a) => a.rider).map((a) => `${m.id}:${a.name}`));
    expect(withRider.length).toBe(325);
    for (const k of withRider) expect(all[k], k).toBeDefined();
    for (const [k, r] of Object.entries(all)) {
      expect(['uygulandı', 'kısmen', 'süreli etki', 'yok'], k).toContain(r.status);
      for (const p of [...(r.extra ?? []), ...(r.conditional ?? []), ...(r.replace ? [r.replace] : [])]) expect(() => parseDice(p.dice), k).not.toThrow();
      if (r.status === 'kısmen' || r.status === 'yok') expect(r.unsupported, k).toBeTruthy();
    }
  });
});

describe('ek hasar', () => {
  it('Ghoul Bite: isabette +1d6 necrotic; kritikte ek zarlar da ikiye katlanır', () => {
    const s = arena([monster('ghoul', 'G'), target()]);
    const hit = resolved(attack(s, 'G', 'Bite', scripted([20, 15], [6, 3], [6, 4])).events);
    expect(hit?.extra).toEqual([expect.objectContaining({ type: 'necrotic', rolls: [4], applied: 4 })]);
    expect(hit?.appliedDamage).toBe(3 + 2 + 4); // 1d6+2 + 1d6
    const crit = resolved(attack(s, 'G', 'Bite', scripted([20, 20], [6, 1], [6, 1], [6, 5], [6, 6])).events);
    expect(crit?.critical).toBe(true);
    expect(crit?.extra?.[0]?.rolls).toEqual([5, 6]);
    expect(describeEvent(crit as BattleEvent, s)).toContain('ek necrotic');
  });
  it('ıskada ek hasar yok; bağışıklıkta 0 (Young Red Rend +1d6 fire, hedef fire bağışık)', () => {
    const s = arena([monster('young-red-dragon', 'D'), target({ immunities: ['fire'] })]);
    const miss = resolved(attack(s, 'D', 'Rend', scripted([20, 1])).events);
    expect(miss?.extra).toBeUndefined();
    const hit = resolved(attack(s, 'D', 'Rend', scripted([20, 15], [6, 3], [6, 3], [6, 6])).events);
    expect(hit?.extra?.[0]).toMatchObject({ type: 'fire', raw: 6, applied: 0 });
  });
  it('Goblin Warrior: +1d4 yalnızca avantajlı isabette', () => {
    const s = arena([monster('goblin-warrior', 'K'), target()]);
    expect(resolved(attack(s, 'K', 'Scimitar', scripted([20, 15], [6, 3])).events)?.extra).toBeUndefined();
    const prone = { ...s, combatants: { ...s.combatants, A: { ...(s.combatants.A as Combatant), conditions: ['Prone'] } } };
    const adv = resolved(attack(prone, 'K', 'Scimitar', scripted([20, 15], [20, 4], [6, 3], [4, 2])).events);
    expect(adv?.mode).toBe('advantage');
    expect(adv?.extra).toEqual([expect.objectContaining({ type: 'slashing', applied: 2 })]);
  });
  it('Bloodied sürü daha az vurur (Swarm of Rats: hasar 1d4\'e iner)', () => {
    const s = arena([monster('swarm-of-rats', 'R'), target()]);
    const full = resolved(attack(s, 'R', 'Bites', scripted([20, 15], [4, 4], [4, 4])).events);
    const hurt = { ...s, combatants: { ...s.combatants, R: { ...(s.combatants.R as Combatant), hp: 1 } } };
    const low = resolved(attack(hurt, 'R', 'Bites', scripted([20, 15], [4, 4], [4, 4])).events);
    expect(low?.damageRolls.length).toBe(1);
    expect(low?.rawDamage).toBeLessThan(full?.rawDamage ?? 0);
  });
  it('Wyvern Sting: +7d6 poison ve Poisoned birer kez (rider ile süreli etki çift uygulanmaz)', () => {
    const s = arena([monster('wyvern', 'W'), target()]);
    const r = attack(s, 'W', 'Sting', scripted([20, 15], [6, 3], [6, 3], [6, 1], [6, 1], [6, 1], [6, 1], [6, 1], [6, 1], [6, 1]));
    expect(resolved(r.events)?.extra).toEqual([expect.objectContaining({ type: 'poison', raw: 7 })]);
    expect(r.state.combatants.A?.conditions.filter((c) => c === 'Poisoned')).toHaveLength(1);
    expect(r.state.combatants.A?.conditionTimers).toHaveLength(1);
    expect(riderOf('wyvern', 'Sting')?.status).toBe('uygulandı');
  });
  it('uygulanamayan kısım günlükte gerekçesiyle (Wolf Bite: Prone)', () => {
    const s = arena([monster('wolf', 'F'), target()]);
    const ev = resolved(attack(s, 'F', 'Bite', scripted([20, 15], [4, 2])).events) as BattleEvent;
    expect(describeEvent(ev, s)).toContain('ek etki uygulanmadı (Prone');
  });
});
