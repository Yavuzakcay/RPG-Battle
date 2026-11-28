/**
 * GECE-KATALOG-KALAN (kural sürümü 110): ⚠ düzeltmeleri. Kongark Boşluk Çekimi 2 turda bir, Mirage Vesvese sahibinin tur
 * başında tek rastgele hedefe; 109 savaşta eski davranış.
 */
import { describe, expect, it } from 'vitest';
import { auraOwnerTurnEvents, auraTriggerEvents } from './auraCore';
import { applyEvents } from './reduce';
import { faz2Events } from './faz2';
import { KATALOG110_VERSION, katalog110On } from './katalog110Surum';
import { gucOf } from './katalog109Data';
import { CURRENT_RULES } from './ruleVersion';
import { mk, scripted } from './fixtures';
import { getMonster } from '../data';
import { combatantFromMonster, startBattle } from './create';
import type { BattleState, Combatant } from './types';

/** katalog109.test.ts `arena109` eşi (o dosyayı içe aktarmak testlerini yeniden çalıştırırdı). */
export function arena109(monsterId: string, others: Combatant[], v = CURRENT_RULES, bossPos = { col: 3, row: 3 }): BattleState {
  const d = { ...combatantFromMonster(getMonster(monsterId), { id: 'D', kuralSurumu: v }), initiativeBonus: 30 };
  const parts = [d, ...others];
  const started = startBattle('k110', 'd-z-zemin', parts, scripted(...parts.map(() => [20, 10] as [number, number])), { map: { id: 'col' }, kuralSurumu: v });
  const cs = { ...started.state.combatants };
  cs.D = { ...(cs.D as Combatant), pos: bossPos };
  for (const o of others) if (o.pos) cs[o.id] = { ...(cs[o.id] as Combatant), pos: o.pos };
  return { ...started.state, status: 'active', combatants: cs };
}
const C = (s: BattleState, id: string) => s.combatants[id] as Combatant;
const foe = (id: string, col: number) => mk(id, { ownerId: 'p1', hp: 100, maxHp: 100, pos: { col, row: 3 } });
/** Bossu faza sok (canı yarıya). */
function inPhase(s: BattleState): BattleState {
  const half = { ...s, combatants: { ...s.combatants, D: { ...C(s, 'D'), hp: Math.floor(C(s, 'D').maxHp / 2) } } };
  return applyEvents(half, faz2Events(half, scripted([20, 10], [20, 10], [20, 10])));
}
const atRound = (s: BattleState, round: number) => ({ ...s, round });

describe('GECE-KATALOG-KALAN: sürüm 110', () => {
  it('110 güncel; s110 yalnız 110+ savaşta', () => {
    expect(KATALOG110_VERSION).toBe(110);
    expect(CURRENT_RULES).toBeGreaterThanOrEqual(110);
    expect(katalog110On({ kuralSurumu: 109 })).toBe(false);
    expect(gucOf({ kuralSurumu: 109 }, 'kongark')?.faz2?.auralar?.[0]?.everyRounds).toBeUndefined();
    expect(gucOf({ kuralSurumu: 110 }, 'kongark')?.faz2?.auralar?.[0]?.everyRounds).toBe(2);
    expect((gucOf({ kuralSurumu: 109 }, 'kongark') as Record<string, unknown>).s110).toBeUndefined();
  });
});

describe('Kongark: Boşluk Çekimi her 2 turda bir', () => {
  it('110: ilk tur çeker, sonraki tur çekmez, iki tur sonra yine çeker', () => {
    const s = inPhase(arena109('kongark', [foe('A', 8)]));
    const pulled = (st: BattleState) => auraTriggerEvents(st, 'A', 'turnStart', scripted([20, 1], [20, 1])).some((e) => e.type === 'pushed' || e.type === 'map_note');
    const r1 = atRound(s, 3);
    const ev1 = auraTriggerEvents(r1, 'A', 'turnStart', scripted([20, 1], [20, 1]));
    expect(ev1.some((e) => e.type === 'trait_turn' && e.trait === 'aura-every:void-gravity')).toBe(true);
    const after = applyEvents(r1, ev1);
    expect(pulled(atRound(after, 4))).toBe(false);
    expect(pulled(atRound(after, 5))).toBe(true);
  });
  it('109: her tur çeker (eski yaklaşık)', () => {
    const s = inPhase(arena109('kongark', [foe('A', 8)], 109));
    const ev = auraTriggerEvents(atRound(s, 3), 'A', 'turnStart', scripted([20, 1], [20, 1]));
    const s2 = applyEvents(atRound(s, 3), ev);
    expect(auraTriggerEvents(atRound(s2, 4), 'A', 'turnStart', scripted([20, 1], [20, 1])).some((e) => e.type === 'map_note')).toBe(true);
  });
});

describe('Mirage: Vesvese tek hedef', () => {
  it('110: tur başında yalnız bir düşman save atar; hedef tur başı aurası yok', () => {
    const s = inPhase(arena109('mirage', [foe('A', 6), foe('B', 7), foe('E', 8)]));
    expect(auraTriggerEvents(s, 'A', 'turnStart', scripted([20, 1]))).toHaveLength(0);
    const ev = auraOwnerTurnEvents(s, 'D', scripted([3, 2], [20, 1]));
    const s2 = applyEvents(s, ev);
    const scared = ['A', 'B', 'E'].filter((id) => C(s2, id).conditions.includes('Frightened'));
    expect(scared).toEqual(['B']);
  });
  it('109: her düşman kendi tur başında save atar; sahip kancası boş', () => {
    const s = inPhase(arena109('mirage', [foe('A', 6), foe('B', 7)], 109));
    expect(auraOwnerTurnEvents(s, 'D', scripted([3, 2], [20, 1]))).toHaveLength(0);
    const s2 = applyEvents(s, auraTriggerEvents(s, 'A', 'turnStart', scripted([20, 1])));
    expect(C(s2, 'A').conditions).toContain('Frightened');
  });
});

describe('4. adım: motor yaklaşıkları (110)', () => {
  it('Out-of-Time Storm: düşmanın doğrudan hedef aldığı büyü turda bir iptal (saldırı iptaliyle ortak hak); 109 yok', async () => {
    const { outOfTimeSpellEvents } = await import('./katalog110');
    const s = arena109('dragon-of-hexonia-a', [foe('A', 8)]);
    const a = C(s, 'A');
    const ev = outOfTimeSpellEvents(s, a, ['D'], 'Hold Monster');
    expect(ev?.[0]).toMatchObject({ type: 'trait_turn', trait: 'k109:negate' });
    expect(outOfTimeSpellEvents(applyEvents(s, ev!), a, ['D'], 'Hold Monster')).toBeNull();
    expect(outOfTimeSpellEvents(s, a, ['A'], 'Bless')).toBeNull();
    expect(outOfTimeSpellEvents(arena109('dragon-of-hexonia-a', [foe('A', 8)], 109), a, ['D'], 'Hold Monster')).toBeNull();
  });

  it('dokunaç yakalama sınırı: Titan 12 yaratık tutarken yeni yakalama yok', async () => {
    const { grappleCapReached } = await import('./katalog110');
    const s = arena109('titan-of-nightmare', [foe('A', 8)]);
    expect(grappleCapReached(s, C(s, 'D'))).toBe(false);
    const many: Record<string, Combatant> = { ...s.combatants };
    for (let i = 0; i < 12; i++) many[`G${i}`] = { ...foe(`G${i}`, 1), grapple: { by: 'D', escapeDc: 27 } } as Combatant;
    expect(grappleCapReached({ ...s, combatants: many }, C(s, 'D'))).toBe(true);
    expect(grappleCapReached({ ...arena109('titan-of-nightmare', [foe('A', 8)], 109), combatants: many }, C(s, 'D'))).toBe(false);
  });

  it('Kongark düşük yerçekimi: Faz 2\'de zorla hareket 5 ft uzar', async () => {
    const { lowGravityFt } = await import('./katalog110');
    const s = inPhase(arena109('kongark', [foe('A', 8)]));
    expect(lowGravityFt(s)).toBe(5);
    expect(lowGravityFt(inPhase(arena109('kongark', [foe('A', 8)], 109)))).toBe(0);
  });

  it('kadim duyular ve Siege Monster savaşçıya geçer; 109 geçmez', () => {
    const s = arena109('titan-of-nightmare', [foe('A', 8)]);
    expect(C(s, 'D').senses).toMatchObject({ truesight: 180 });
    expect(C(s, 'D').traits).toContain('siege-monster');
    expect(C(arena109('dragon-of-hexonia-a', [foe('A', 8)]), 'D').senses).toMatchObject({ truesight: 300, tremorsense: 5280 });
    // 109'da Truesight/Blindsight zaten `unsupported` duyu satırından; 110'un kattığı "1 mil" Tremorsense ve Siege Monster.
    const old = arena109('titan-of-nightmare', [foe('A', 8)], 109);
    expect(C(old, 'D').traits ?? []).not.toContain('siege-monster');
    expect(C(arena109('dragon-of-hexonia-a', [foe('A', 8)], 109), 'D').senses?.tremorsense).toBeUndefined();
  });

  it('Titan Dream Call: başarısız WIS save → 30 ft bossa çekilir', async () => {
    const { legendarySave } = await import('./boss');
    const { k109Legendary } = await import('./katalog109Data');
    const s = arena109('titan-of-nightmare', [foe('A', 14)]);
    const act = k109Legendary(s, 'titan-of-nightmare', [] as Array<{ id: string }>).find((x) => x.id === 'dream-call');
    expect(act).toMatchObject({ kind: 'save', save: 'wis', dc: 27, pull: 30, dropHeld: true });
    const ev = legendarySave(s, C(s, 'D'), act as never, [C(s, 'A')], scripted([20, 1], [20, 1]));
    const s2 = applyEvents(s, ev);
    expect(C(s2, 'A').pos!.col).toBeLessThan(14);
    expect(k109Legendary({ kuralSurumu: 109 }, 'titan-of-nightmare', [] as Array<{ id: string }>).some((x) => x.id === 'dream-call')).toBe(false);
  });

  it('Cimbombom Faz 2: arena kenarı alev; Lightaur Faz 2: harita ışık alanı', () => {
    const s = inPhase(arena109('cimbombom', [foe('A', 8)]));
    const fire = (s.map?.zones ?? []).find((z) => z.surface === 'fire' || z.spellId.includes('fire') || z.name.toLowerCase().includes('alev'));
    expect(fire).toBeDefined();
    const rows = s.map!.tiles.length, cols = s.map!.tiles[0]!.length;
    expect(fire!.hexes.every((h) => h.row === 0 || h.col === 0 || h.row === rows - 1 || h.col === cols - 1)).toBe(true);
    const l = inPhase(arena109('lightaur', [foe('A', 8)]));
    expect((l.map?.zones ?? []).find((z) => z.name === 'Kör Güneş Işığı')?.spec).toMatchObject({ light: 1 });
  });
});
