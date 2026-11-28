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

describe('Grup 2: saldırı ekleri ve pasifler', () => {
  const foe = (id: string, col: number, p: Partial<Combatant> = {}) => mk(id, { ownerId: 'p1', hp: 200, maxHp: 200, pos: { col, row: 3 }, ...p });

  it('A2 ekleri yalnız 109: Tail 20 ft itme, Roar 30 ft itme + 8d8 thunder', async () => {
    const { a2Of } = await import('./ridersA2');
    const { saveExtraRolls } = await import('./katalog109Hit');
    const s = arena109('tutsak-dragon', [foe('A', 6)]);
    expect(a2Of(s, 'tutsak-dragon', 'Tail')?.push).toEqual({ mode: 'push', ft: 20 });
    expect(a2Of({ kuralSurumu: 108 }, 'tutsak-dragon', 'Tail')).toBeUndefined();
    expect(saveExtraRolls(s, C(s, 'D'), 'Continent Roar Breath', () => 0.5)[0]).toMatchObject({ type: 'thunder' });
    expect(saveExtraRolls({ ...s, kuralSurumu: 108 }, C(s, 'D'), 'Continent Roar Breath', () => 0.5)).toEqual([]);
  });

  it('direnç delme: Ten Seals Core bağışıklığı da yok sayar; Anka ateş bağışıklığını dirence indirir', async () => {
    const { profileIn } = await import('./zones');
    const s = arena109('dragon-of-hexonia-a', [foe('A', 8, { resistances: ['force'], immunities: ['radiant'] })]);
    const p = profileIn(s, C(s, 'A'), false, C(s, 'D'));
    expect(p.resistances).not.toContain('force');
    expect(p.immunities).not.toContain('radiant');
    expect(profileIn({ ...s, kuralSurumu: 108 }, C(s, 'A'), false, C(s, 'D')).immunities).toContain('radiant');
    const a = arena109('kozmik-anka', [foe('A', 8, { immunities: ['fire'] })]);
    const pa = profileIn(a, C(a, 'A'), false, C(a, 'D'));
    expect(pa.immunities).not.toContain('fire');
    expect(pa.resistances).toContain('fire');
  });

  it('zorla harekete bağışık (Gongar): itme olayı yok', async () => {
    const { forcedMove } = await import('./motion');
    const s = arena109('gongar', [foe('A', 4)]);
    expect(forcedMove(s, 'D', 'push', 15, 'A', () => 0.5, { origin: { col: 4, row: 3 } })).toEqual([]);
  });

  it('iyileşme çarpanı ve mühür: healed olayında yarı / hiç', () => {
    const s = arena109('cerbones', [foe('A', 8, { hp: 100 })]);
    const half = applyEvents(s, [{ type: 'effect_added', targetId: 'A', effect: { id: 'h', name: 'h', sourceId: 'D', k109: { healMult: 0.5 } } },
      { type: 'healed', actorId: 'A', targetId: 'A', label: 'x', amount: 20, targetHpAfter: 120 }]);
    expect(C(half, 'A').hp).toBe(110);
    const sealed = applyEvents(s, [{ type: 'effect_added', targetId: 'A', effect: { id: 'h', name: 'h', sourceId: 'D', k109: { sealed: true } } },
      { type: 'healed', actorId: 'A', targetId: 'A', label: 'x', amount: 20, targetHpAfter: 120 }]);
    expect(C(sealed, 'A').hp).toBe(100);
  });

  it('yakın dövüşte karşı hasar ve Star Mark', async () => {
    const { retaliateEvents, starMarkEvents } = await import('./katalog109');
    const s0 = arena109('hydraxe', [foe('A', 4, { conditions: ['Invisible'] })]);
    const s = applyEvents(s0, [{ type: 'effect_added', targetId: 'D', effect: { id: 'r', name: 'r', sourceId: 'D', k109: { meleeRetaliate: { dice: '1d8', type: 'acid' } } } },
      { type: 'effect_added', targetId: 'A', effect: { id: 'm', name: 'Star Mark', sourceId: 'D', k109: { starMark: true } } }]);
    expect(retaliateEvents(s, 'A', 'D', { melee: true, hit: true }, () => 0.5)).toHaveLength(1);
    expect(retaliateEvents(s, 'A', 'D', { melee: false, hit: true }, () => 0.5)).toHaveLength(0);
    expect(starMarkEvents(s).some((e) => e.type === 'map_effect' && e.removeCondition === 'Invisible')).toBe(true);
  });

  it('Storm Lightning 3 hedefe (tek şarj); 108 tek hedef', async () => {
    const { monsterAttackEvents } = await import('./monsters');
    const run = (v: number) => {
      const s = arena109('ocean-nightmare', [foe('A', 8), foe('B', 9), foe('E', 10)], v);
      const i = C(s, 'D').attacks.findIndex((a) => a.name === 'Storm Lightning');
      const st = { ...s, combatants: { ...s.combatants, D: { ...C(s, 'D'), rechargeUsed: [] } } };
      const r = monsterAttackEvents(st, C(st, 'D'), C(st, 'A'), i, () => 0.3);
      if (!r.ok) throw new Error(r.error);
      return r.events;
    };
    expect(run(CURRENT_RULES).filter((e) => e.type === 'save_resolved')).toHaveLength(3);
    expect(run(CURRENT_RULES).filter((e) => e.type === 'recharge_used')).toHaveLength(1);
    expect(run(108).filter((e) => e.type === 'save_resolved')).toHaveLength(1);
  });

  it('Continent Tail: hedefin 15 ft çevresi savrulur ve Prone', async () => {
    const { a2Events } = await import('./ridersA2');
    const s = arena109('dragon-of-hexonia-a', [foe('A', 9), foe('B', 10)]);
    const ev = a2Events(s, C(s, 'D'), C(s, 'A'), 'Continent Tail', () => 0.5);
    expect(ev.filter((e) => e.type === 'condition_changed' && e.condition === 'Prone')).toHaveLength(2);
    expect(ev.some((e) => e.type === 'pushed')).toBe(true);
  });
});

describe('Grup 3: canavar eylemi', () => {
  const foe = (id: string, col: number, p: Partial<Combatant> = {}) => mk(id, { ownerId: 'p1', hp: 200, maxHp: 200, pos: { col, row: 3 }, ...p });

  it('yetenek yamaları ve eklemeleri yalnız 109 (Yıldız Çöküşü önce çeker; Mirage Misty Step)', async () => {
    const { abilitiesOf } = await import('./monsterAbilities');
    const s = arena109('kongark', [foe('A', 8)]);
    expect(abilitiesOf(s, C(s, 'D')).find((a) => a.id === 'star-collapse')?.pre).toMatchObject({ kind: 'pull', pullFt: 15 });
    const old = arena109('kongark', [foe('A', 8)], 108);
    expect(abilitiesOf(old, C(old, 'D')).find((a) => a.id === 'star-collapse')?.pre).toBeUndefined();
    const m = arena109('mirage', [foe('A', 8)]);
    expect(abilitiesOf(m, C(m, 'D')).map((a) => a.id)).toEqual(expect.arrayContaining(['misty-step', 'false-shadow']));
  });

  it('Yıldız Çöküşü: başarısız STR save çeker, sonra alan', async () => {
    const { abilitiesOf, abilityEvents } = await import('./monsterAbilities');
    const s = arena109('kongark', [foe('A', 7)]);
    const a = abilitiesOf(s, C(s, 'D')).find((x) => x.id === 'star-collapse')!;
    const ev = abilityEvents(s, C(s, 'D'), a, undefined, undefined, () => 0.01);
    expect(ev.some((e) => e.type === 'pushed' && e.targetId === 'A')).toBe(true);
  });

  it('alan bırakma: sanat alev yüzeyi (2 tur); Roar Çatlak Kaya kalıcı alanı', async () => {
    const { areaLeaveEvents } = await import('./katalog109Alan');
    const s = arena109('cimbombom', [foe('A', 5)]);
    const area = (label: string, actorId = 'D') => ({ type: 'area_used', actorId, label, shape: 'emanation', sizeFt: 15, hexes: [{ col: 4, row: 3 }, { col: 5, row: 3 }], targetIds: [], dc: 16 }) as never;
    const ev = areaLeaveEvents(s, [area('Erimiş Örs Patlaması')]);
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ type: 'zone_created', zone: { surface: 'fire', until: s.round + 2 } });
    expect(areaLeaveEvents({ ...s, kuralSurumu: 108 }, [area('Erimiş Örs Patlaması')])).toEqual([]);
    const t = arena109('tutsak-dragon', [foe('A', 9)]);
    const r = areaLeaveEvents(t, [area('Continent Roar Breath')]);
    expect(r[0]).toMatchObject({ type: 'zone_created', zone: { name: 'Çatlak Kaya', spec: { difficult: 2 } } });
  });

  it('Celestial Glide: Anka alanın ucuna süzülür, iki alev alanı', async () => {
    const { areaLeaveEvents } = await import('./katalog109Alan');
    const s = arena109('kozmik-anka', [foe('A', 9)]);
    const hexes = [4, 5, 6, 7, 8].map((col) => ({ col, row: 3 }));
    const ev = areaLeaveEvents(s, [{ type: 'area_used', actorId: 'D', label: 'Celestial Glide', shape: 'line', sizeFt: 120, hexes, targetIds: [] } as never]);
    expect(ev.filter((e) => e.type === 'zone_created')).toHaveLength(2);
    expect(ev.find((e) => e.type === 'teleported')).toMatchObject({ to: { col: 8, row: 3 } });
  });

  it('efsanevi eklemeler: Star Tear dostu iyileştirir ve durumunu siler, Seal-Melting mühürler, Seal Pull taş taşıyanı çeker', async () => {
    const { legendaryOf, k19Legendary } = await import('./boss');
    const ally = mk('Y', { side: 'enemies', hp: 20, maxHp: 100, pos: { col: 5, row: 3 }, conditions: ['Stunned'] });
    const s = arena109('kozmik-anka', [ally, foe('A', 4)]);
    const spec = legendaryOf(s, C(s, 'D'))!;
    const tear = spec.actions.find((a) => a.id === 'star-tear')!;
    const ev = k19Legendary(s, C(s, 'D'), tear, [C(s, 'A')], () => 0.5);
    const s2 = applyEvents(s, ev);
    expect(C(s2, 'Y').conditions).not.toContain('Stunned');
    expect(C(s2, 'Y').hp).toBeGreaterThan(20);
    const seal = k19Legendary(s, C(s, 'D'), spec.actions.find((a) => a.id === 'seal-melting-talon')!, [C(s, 'A')], () => 0.5);
    expect(seal[0]).toMatchObject({ type: 'effect_added', targetId: 'A', effect: { k109: { sealed: true } } });
    const t = arena109('tutsak-dragon', [foe('A', 9, { carried: ['ember-core'] }), foe('B', 7, { pos: { col: 7, row: 6 } })]);
    const pull = legendaryOf(t, C(t, 'D'))!.actions.find((a) => a.id === 'seal-pull')!;
    const pe = k19Legendary(t, C(t, 'D'), pull, [C(t, 'A'), C(t, 'B')], () => 0.01);
    expect(pe.some((e) => e.type === 'pushed' && e.targetId === 'A')).toBe(true);
    expect(legendaryOf({ ...t, kuralSurumu: 108 }, C(t, 'D'))!.actions.some((a) => a.id === 'seal-pull')).toBe(false);
  });

  it('ışın uzaktakini seçer (Mühür Ruhu efsanevi)', async () => {
    const { legendaryOf } = await import('./boss');
    const s = arena109('cimbombom', [foe('A', 5)]);
    expect(legendaryOf(s, C(s, 'D'))!.actions.find((a) => a.id === 'flame-spit')?.target).toBe('far');
  });
});
