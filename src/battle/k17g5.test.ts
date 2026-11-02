/**
 * Kuyruk 17 G5: yapay zekâ yükseklikte tırmanır (kural sürümü 13; fikstür `yukseklik-sahnesi`), yeni yükseklik
 * katmanlı üç harita (Tapınak, Açık Buzul, Sessiz Nöbetçi) duman testi ve replay.
 */
import { describe, expect, it, vi } from 'vitest';
vi.mock('../map/maps', async (importOriginal) => (await import('../map/fixtures/yukseklikSahnesi')).withYukseklik(await importOriginal()));
import { execute } from './commands';
import { startBattle } from './create';
import { replay } from './reduce';
import { GM, mk } from './fixtures';
import { chooseCommand } from './ai';
import { getMap } from '../map/maps';
import { SCENARIOS, simulate } from '../sim/balance';
import type { Offset } from '../rules/hex';
import type { BattleEvent, BattleState, Combatant } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const claw = { name: 'Claw', bonus: 4, damageDice: '1d8+2', damageType: 'slashing', repeat: 1, ranged: false, reachFt: 5, text: '' };

function scene(b: Offset, v?: number): BattleState {
  const r = startBattle('k17', 'da-u-urum', [mk('A', { ownerId: 'p1' }), mk('B', { side: 'enemies', attacks: [claw], skills: { athletics: 20 }, strScore: 3 })], () => 0.5, {
    map: { id: 'yukseklik-sahnesi' }, ...(v ? { kuralSurumu: v } : {}),
  });
  return { ...r.state, status: 'active', order: ['B', 'A'], turnIndex: 0, round: 1,
    combatants: { A: { ...(r.state.combatants.A as Combatant), pos: o(8, 2) }, B: { ...(r.state.combatants.B as Combatant), pos: b, movementUsed: 0 } } } as BattleState;
}

describe('K17 G5: yapay zekâ tırmanması', () => {
  it('yürüyerek yaklaşamayan yakın dövüşçü platoya tırmanır (sürüm 13); sürüm 12 tırmanmaz; replay aynı', () => {
    const s = scene(o(10, 2));
    const cmd = chooseCommand(s);
    expect(cmd).toMatchObject({ type: 'climb', actorId: 'B' });
    const r = execute(s, cmd, GM, () => 0.99);
    expect(r.ok).toBe(true);
    if (r.ok) expect(replay([{ type: 'battle_started', state: s }, ...r.events] as BattleEvent[])).toEqual(r.state);
    expect(chooseCommand(scene(o(10, 2), 12))).not.toMatchObject({ type: 'climb' });
  });
});

describe('K17 G5: yeni yükseklik katmanları', () => {
  it('Tapınak, Açık Buzul, Sessiz Nöbetçi katmanlı; şelale geçidi duvar yüksekliği almaz', () => {
    for (const id of ['buzul-tapinak', 'buzul-acik', 'dag-nobetci']) expect(getMap(id).heights?.length, id).toBe(11);
    expect(getMap('buzul-tapinak').heights?.[1]?.[19]).toBe(0);
  });
  it.each(['k29-buzul-tapinak', 'k29-buzul-acik', 'k29-dag-nobetci'])('%s: savaş çökmeden biter', (id) => {
    const sc = SCENARIOS.find((x) => x.id === id);
    expect(sc).toBeTruthy();
    expect(simulate(sc!, 2, 20, 3).rounds).toBeGreaterThan(0);
  }, 60_000);
});
