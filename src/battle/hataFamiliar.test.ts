/**
 * HATA-FAMILIAR (Kuyruk KQ1): kurulumda Find Familiar yeniden çağrılınca eski familiar kaydı kalmaz (tek familiar, yeniden çağrı =
 * biçim değişimi); haritada olmayan (kaybolmuş) artık kayıtlar "Savaşı başlat"ı kilitlemez; eski kayıtlar çalışır.
 */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { applyEvents } from './reduce';
import { GM, P1, mk, scripted } from './fixtures';
import type { Offset } from '../rules/hex';
import type { BattleState, Combatant } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const pad = () => scripted(...Array.from({ length: 60 }, () => [12, 10] as [number, number]));
const flat = Array.from({ length: 7 }, () => '.'.repeat(15));

function setupArena(): BattleState {
  const parts = [
    mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, spellMod: 3, proficiency: 3, spellNames: ['Find Familiar'], spellSlots: [4, 3, 3, 0, 0, 0, 0, 0, 0] }),
    mk('B', { side: 'enemies', hp: 20, maxHp: 20 }),
  ];
  const started = startBattle('s', 'd-z-zemin', parts, scripted([20, 18], [20, 12]), { map: { id: 'col' } });
  const combatants = { ...started.state.combatants };
  combatants.A = { ...(combatants.A as Combatant), pos: o(3, 3) };
  return { ...started.state, status: 'setup', combatants, map: { ...(started.state.map as NonNullable<BattleState['map']>), tiles: flat } };
}
const familiars = (s: BattleState) => Object.values(s.combatants).filter((c) => c.summon?.spellId === 'find-familiar');

describe('HATA-FAMILIAR', () => {
  it('3 kez farklı biçimle çağrı: tek familiar kaydı, yerleşince savaş başlar', () => {
    let s = setupArena();
    for (const form of ['spider', 'rat', 'owl']) {
      const r = execute(s, { type: 'cast_spell', actorId: 'A', spellName: 'Find Familiar', form }, P1, pad());
      if (!r.ok) throw new Error(r.error);
      s = r.state;
    }
    const all = familiars(s);
    expect(all).toHaveLength(1); // eski kayıtlar silinir (yeni kayıt eklenmez)
    expect(s.order.filter((id) => s.combatants[id]?.summon?.spellId === 'find-familiar')).toHaveLength(1);
    // düşman yerleştir ve başlat
    const r1 = execute(s, { type: 'place', actorId: 'B', at: o(10, 3) }, GM, pad());
    if (r1.ok) s = r1.state;
    const start = execute(s, { type: 'start_battle' }, GM, pad());
    expect(start.ok, start.ok ? '' : start.error).toBe(true);
  });
  it('eski kayıt: haritada olmayan kaybolmuş (gone) familiar kayıtları başlatmayı engellemez', () => {
    let s = setupArena();
    const r = execute(s, { type: 'cast_spell', actorId: 'A', spellName: 'Find Familiar', form: 'spider' }, P1, pad());
    if (!r.ok) throw new Error(r.error);
    s = r.state;
    const fam = familiars(s)[0] as Combatant;
    // Eski sürümde oluşan artık: kaybolmuş (gone), pos null, sırada kalmış
    const ghost: Combatant = { ...fam, id: 'A-cagri9', pos: null, hp: 0, life: 'dead', summon: { ...(fam.summon as NonNullable<Combatant['summon']>), gone: true } };
    s = { ...s, combatants: { ...s.combatants, [ghost.id]: ghost }, order: [...s.order, ghost.id] };
    const r1 = execute(s, { type: 'place', actorId: 'B', at: o(10, 3) }, GM, pad());
    if (r1.ok) s = r1.state;
    const start = execute(s, { type: 'start_battle' }, GM, pad());
    expect(start.ok, start.ok ? '' : start.error).toBe(true);
  });
});
