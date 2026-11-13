/** Kuyruk K75 (kural sürümü 79): küçük açıklar. */
import { describe, expect, it } from 'vitest';
import { mountDecision, INME_CAN } from './ai/k75';
import { mountControlled } from './binekMb2';
import { execute } from './commands';
import { startBattle } from './create';
import { GM, mk, P1 } from './fixtures';
import { K75_VERSION, k75On } from './k75Surum';
import { CURRENT_RULES } from './ruleVersion';
import type { AttackOption, BattleState, Combatant, Command } from './types';

const sword: AttackOption = { label: 'Longsword', attackBonus: 5, damage: '1d8', damageType: 'slashing', ranged: false, spell: false, tag: 'longsword' };
const bow: AttackOption = { ...sword, label: 'Longbow', ranged: true };

function scene(v: number, o: { trained?: boolean; ranged?: boolean; mountHp?: number } = {}): BattleState {
  const parts = [
    mk('H', { side: 'party', ownerId: 'p1', size: 'L', speed: 60, hp: o.mountHp ?? 60, maxHp: 60, ...(o.trained === false ? {} : { egitimli: true as const }) }),
    mk('A', { side: 'party', ownerId: 'p1', size: 'M', speed: 30, weaponOptions: [o.ranged ? bow : sword] }),
    mk('B', { side: 'enemies', hp: 90, maxHp: 90 }),
  ];
  const s0 = startBattle('b', 'd', parts, () => 0.5, { kuralSurumu: v, map: { id: 'col', variantId: 'gunduz', ruleToggles: { darkness: false, trap: false } } } as never).state;
  const cs = { ...s0.combatants };
  cs.H = { ...cs.H!, pos: { col: 4, row: 5 } } as Combatant;
  cs.A = { ...cs.A!, pos: { col: 5, row: 5 } } as Combatant;
  cs.B = { ...cs.B!, pos: { col: 18, row: 5 } } as Combatant;
  const order = ['A', 'H', 'B'];
  return { ...s0, kuralSurumu: v, status: 'active', round: 1, order, turnIndex: 0, combatants: cs,
    map: { ...s0.map!, tiles: Array.from({ length: 11 }, () => '.'.repeat(21)), objects: [] } };
}
const ok = (s: BattleState) => (c: Command) => execute(s, c, P1, () => 0.5).ok !== false && !('error' in execute(s, c, P1, () => 0.5));

describe('K75: sürüm', () => {
  it('79; güncel sürüm 79+; 78 kapalı', () => {
    expect(K75_VERSION).toBe(79);
    expect(CURRENT_RULES).toBeGreaterThanOrEqual(79);
    expect(k75On({ kuralSurumu: 78 })).toBe(false);
    expect(k75On({ kuralSurumu: 79 })).toBe(true);
  });
});

describe('K75: eğitimli binek bayrağı ve YZ', () => {
  it('egitimli bayrağı canavar kimliğinden bağımsız kontrollü yapar', () => {
    expect(mountControlled({ egitimli: true })).toBe(true);
    expect(mountControlled({})).toBe(false);
  });
  it('79: yakın dövüşçü bitişik eğitimli bineğe biner; 78\'de karar yok', () => {
    const s = scene(79);
    expect(mountDecision(s, s.combatants.A!, ok(s))).toEqual({ type: 'mount', actorId: 'A', mountId: 'H' });
    const old = scene(78);
    expect(mountDecision(old, old.combatants.A!, ok(old))).toBeNull();
  });
  it('menzilli binici ya da eğitimsiz binek: binmez', () => {
    const r = scene(79, { ranged: true });
    expect(mountDecision(r, r.combatants.A!, ok(r))).toBeNull();
    const u = scene(79, { trained: false });
    expect(mountDecision(u, u.combatants.A!, ok(u))).toBeNull();
  });
  it('ağır yaralı bineğinden iner', () => {
    const s = scene(79, { mountHp: Math.floor(60 * INME_CAN) });
    const cs = { ...s.combatants, A: { ...s.combatants.A!, riding: 'H', pos: s.combatants.H!.pos } as Combatant, H: { ...s.combatants.H!, rider: 'A' } as Combatant };
    const m = { ...s, combatants: cs };
    expect(mountDecision(m, m.combatants.A!, ok(m))?.type).toBe('dismount');
  });
});
void GM;

describe('K75: batıran çamur ölü satırı', () => {
  it('sinkMud kuralı olan her haritada kuralın zemin harfi haritada var (Kale ve Çukur\'dan kalktı)', async () => {
    const { maps: MAPS } = await import('../map/maps');
    for (const m of MAPS) {
      for (const v of m.variants) {
        for (const r of v.rules ?? []) {
          if (r.id !== 'sinkMud') continue;
          expect(m.tiles.some((row) => row.includes(String(r.terrain ?? 'n'))), `${m.id}/${v.id}`).toBe(true);
        }
      }
    }
  });
});
