/**
 * Görev KATALOG-GUC-TAM (kural sürümü 109): katalog güçlerinin motor ilkelleri. Grup 1: canavar aurası (tur başı save, zar eki,
 * tepki yok, Cosmic Madness, dost aurası, temizleme), eski sürümde kapalı.
 */
import { describe, expect, it } from 'vitest';
import { getMonster } from '../data';
import { combatantFromMonster, startBattle } from './create';
import { auraTriggerEvents, passiveAuraOf } from './auraCore';
import { applyEvents } from './reduce';
import { madnessEvents } from './katalog109';
import { KATALOG109_VERSION, katalog109On } from './katalog109Surum';
import { allGuc } from './katalog109Data';
import { CURRENT_RULES } from './ruleVersion';
import { mk, scripted } from './fixtures';
import type { BattleState, Combatant } from './types';

export function arena109(monsterId: string, others: Combatant[], v = CURRENT_RULES, bossPos = { col: 3, row: 3 }): BattleState {
  const d = { ...combatantFromMonster(getMonster(monsterId), { id: 'D', kuralSurumu: v }), initiativeBonus: 30 };
  const parts = [d, ...others];
  const started = startBattle('k109', 'd-z-zemin', parts, scripted(...parts.map(() => [20, 10] as [number, number])), { map: { id: 'col' }, kuralSurumu: v });
  const cs = { ...started.state.combatants };
  cs.D = { ...(cs.D as Combatant), pos: bossPos };
  for (const o of others) if (o.pos) cs[o.id] = { ...(cs[o.id] as Combatant), pos: o.pos };
  return { ...started.state, status: 'active', combatants: cs };
}
const C = (s: BattleState, id: string) => s.combatants[id] as Combatant;

describe('KATALOG-GUC-TAM: sürüm', () => {
  it('109, güncel; veri canavar kimlikleri katalogda', () => {
    expect(KATALOG109_VERSION).toBe(109);
    expect(CURRENT_RULES).toBeGreaterThanOrEqual(109);
    expect(katalog109On({ kuralSurumu: 108 })).toBe(false);
    for (const id of Object.keys(allGuc())) expect(() => getMonster(id)).not.toThrow();
  });
});

describe('Grup 1: canavar aurası', () => {
  const foe = (id: string, col: number, p: Partial<Combatant> = {}) => mk(id, { ownerId: 'p1', hp: 100, maxHp: 100, pos: { col, row: 3 }, ...p });

  it('Non-Euclidean Aura: başarısız WIS save → 1 tur −1d6 saldırı/save, tepki yok, Cosmic Madness', () => {
    const s = arena109('titan-of-nightmare', [foe('A', 8)]);
    expect(C(s, 'D').effects?.some((e) => e.id === 'k109:D' && e.auras?.length)).toBe(true);
    const ev = auraTriggerEvents(s, 'A', 'turnStart', scripted([20, 1]));
    const s2 = applyEvents(s, ev);
    const fx = C(s2, 'A').effects?.find((e) => e.name === 'Cosmic Madness');
    expect(fx).toMatchObject({ noReactions: true, dice: { die: '1d6', sign: -1 }, k109: { madAlly: 2 } });
    // Aynı turda ikinci kez işlemez (giriş tetiği de aynı kimlik).
    expect(auraTriggerEvents(s2, 'A', 'enter', scripted([20, 1])).filter((e) => e.type === 'effect_added')).toHaveLength(0);
  });

  it('60 ft dışında aura yok; 108 savaşta aura etkisi kurulmaz', () => {
    const far = arena109('titan-of-nightmare', [foe('A', 3, { pos: { col: 3, row: 3 } })]);
    const s = { ...far, combatants: { ...far.combatants, A: { ...C(far, 'A'), pos: { col: 18, row: 3 } } } };
    expect(auraTriggerEvents(s, 'A', 'turnStart', scripted([20, 1]))).toHaveLength(0);
    const old = arena109('titan-of-nightmare', [foe('A', 8)], 108);
    expect(C(old, 'D').effects?.some((e) => e.id === 'k109:D')).toBe(false);
    expect(auraTriggerEvents(old, 'A', 'turnStart', scripted([20, 1]))).toHaveLength(0);
  });

  it('Cosmic Madness: d6 ≤ 2 ise erişimdeki dosta saldırır ve eylem harcanır; 3+ ise yalnız not', () => {
    const s = arena109('titan-of-nightmare', [foe('A', 8, { attacks: [{ name: 'Slam', bonus: 5, damageDice: '1d6', damageType: 'bludgeoning', ranged: false, repeat: 1 }] as never }), foe('B', 9)]);
    const mad = applyEvents(s, [{ type: 'effect_added', targetId: 'A', effect: { id: 'm', name: 'Cosmic Madness', sourceId: 'D', until: s.round + 1, k109: { madAlly: 2 } } }]);
    const hit = madnessEvents(mad, 'A', scripted([6, 1], [20, 15], [6, 3]));
    expect(hit.some((e) => e.type === 'action_used')).toBe(true);
    const miss = madnessEvents(mad, 'A', scripted([6, 4]));
    expect(miss.filter((e) => e.type === 'action_used')).toHaveLength(0);
    expect(madnessEvents(s, 'A', scripted([6, 1]))).toHaveLength(0);
  });

  it('Dread Tide: 30 ft, −1d4', () => {
    const s = arena109('ocean-nightmare', [foe('A', 6)]);
    const s2 = applyEvents(s, auraTriggerEvents(s, 'A', 'turnStart', scripted([20, 1])));
    expect(C(s2, 'A').effects?.find((e) => e.name === 'Dread Tide')?.dice).toMatchObject({ die: '1d4', sign: -1 });
  });

  it('Anka halesi: dostta Frightened, düşmanda Invisible silinir', () => {
    const ally = mk('Y', { side: 'enemies', hp: 50, maxHp: 50, pos: { col: 5, row: 3 }, conditions: ['Frightened'] });
    const s = arena109('kozmik-anka', [ally, foe('A', 7, { conditions: ['Invisible'] })]);
    const s2 = applyEvents(s, auraTriggerEvents(s, 'Y', 'turnStart', scripted()));
    expect(C(s2, 'Y').conditions).not.toContain('Frightened');
    const s3 = applyEvents(s2, auraTriggerEvents(s2, 'A', 'turnStart', scripted()));
    expect(C(s3, 'A').conditions).not.toContain('Invisible');
  });

  it('Ten Seals Core: 300 ft dostlara +6 save, korku/büyü bağışıklığı', () => {
    const ally = mk('Y', { side: 'enemies', hp: 50, maxHp: 50, pos: { col: 14, row: 3 } });
    const s = arena109('dragon-of-hexonia-a', [ally, foe('A', 12)]);
    expect(passiveAuraOf(s, C(s, 'Y'))).toMatchObject({ saveBonus: 6, immune: ['Frightened', 'Charmed'] });
    expect(passiveAuraOf(s, C(s, 'A')).saveBonus).toBe(0);
  });
});
