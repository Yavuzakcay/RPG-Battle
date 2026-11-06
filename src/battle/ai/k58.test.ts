/**
 * Kuyruk K58 G5/G6: yapay zekâ zorluğu kurulumdan savaş durumuna (kayıtta, replay aynı), Game Master rol ataması,
 * zorluk sıralaması (parti yapay zekâsı: Kolay ≤ Normal; Usta deneysel: Normal'in en çok 10 puan altında).
 */
import { describe, expect, it } from 'vitest';
import { createMapBattle } from '../../app/setup';
import { combatantFromMonster } from '../create';
import { execute } from '../commands';
import { replay } from '../reduce';
import { getMonster } from '../../data';
import { seededRng } from '../../rules/dice';
import { GM, P1, setup } from '../fixtures';
import { roleOf } from './evaluate';
import type { BattleEvent, Combatant } from '../types';

describe('K58 yapay zekâ zorluğu ve rol', () => {
  it('kurulumdaki zorluk savaş durumunda ve başlangıç olayında (replay aynı)', () => {
    const foes = ['goblin-warrior', 'wolf'].map((m, i) => ({ ...combatantFromMonster(getMonster(m), { id: `O${i}`, name: m }), side: 'enemies' as const }));
    const s = createMapBattle(foes, { mapId: 'ortamlar-diyari', variantId: 'gunduz', yz: { zorluk: { enemies: 'kolay', party: 'usta' } } }, seededRng(3));
    expect(s.state.yz?.zorluk).toEqual({ enemies: 'kolay', party: 'usta' });
    const start = s.events.find((e): e is Extract<BattleEvent, { type: 'battle_started' }> => e.type === 'battle_started');
    expect(start?.state.yz?.zorluk?.enemies).toBe('kolay');
    expect(replay(s.events).yz).toEqual(s.state.yz);
    // Varsayılan: alan yok (Normal).
    expect(createMapBattle(foes, { mapId: 'ortamlar-diyari', variantId: 'gunduz' }, seededRng(3)).state.yz).toBeUndefined();
  });

  it('rol: yalnız Game Master atar; atanan rol türetilenin yerine geçer, null geri alır', () => {
    const s0 = setup('Düz');
    expect(execute(s0, { type: 'set_ai_role', targetId: 'B', role: 'tank' }, P1, seededRng(1)).ok).toBe(false);
    const r = execute(s0, { type: 'set_ai_role', targetId: 'B', role: 'destek' }, GM, seededRng(1));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(roleOf(r.state.combatants.B as Combatant)).toBe('destek');
    const back = execute(r.state, { type: 'set_ai_role', targetId: 'B', role: null }, GM, seededRng(1));
    expect(back.ok && roleOf(back.state.combatants.B as Combatant)).toBe(roleOf(s0.combatants.B as Combatant));
  });

  it('zorluk sıralaması (parti yapay zekâsı): Kolay ≤ Normal + 5, Usta ≥ Normal − 10 (deneysel)', async () => {
    const { SCENARIOS, measure, setSimYz, setPartyKind } = await import('../../sim/balance');
    setPartyKind('standart');
    // 1. seviye Çöl ve Mağara: parti kazanma oranı tavanda değil (K58 ölçümü 30 tohum: Kolay %43, Normal %60–67, Usta %70–73).
    const sc = ['col', 'magara'].map((id) => SCENARIOS.find((x) => x.id === id)).filter((x): x is NonNullable<typeof x> => !!x);
    const rate = (d: 'kolay' | 'normal' | 'usta') => {
      setSimYz(d === 'normal' ? undefined : { zorluk: { party: d } });
      let w = 0, n = 0;
      for (const s of sc) { const m = measure(s, 20, 1, 1); w += m.partyWins; n += m.runs; }
      return w / n;
    };
    const [k, n, u] = [rate('kolay'), rate('normal'), rate('usta')];
    setSimYz(undefined);
    expect(k).toBeLessThanOrEqual(n + 0.05);
    expect(u).toBeGreaterThanOrEqual(n - 0.1);
  }, 600_000);
});
