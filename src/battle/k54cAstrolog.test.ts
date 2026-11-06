/**
 * Kuyruk K54c G3: Astrolog (kural sürümü 28): Yıldız Falı ilk zar avantaj/dezavantajı (atılınca biter), Yazgı Değişir
 * (dosta isabeti ıskaya çeviren tepki + bedel), Yazgı Mührü (turun ilk saldırısı kendiliğinden isabet, +PB hasar);
 * sürüm 27'de eski davranış.
 */
import { describe, it, expect } from 'vitest';
import { kitArena, o, mid, low } from './k54bKit';
import { applyEvents } from './reduce';
import { hitReactions } from './reactions';
import { wardSources } from './divine';
import { saveMode } from './durations';
import { combatantFromSheet } from './create';
import { blankCharacter } from '../rules/builder';
import { chooseCommand } from './ai';
import './imza';
import type { CharacterSheet } from '../rules/stats';

const W = (level: number, extra: Partial<Parameters<typeof kitArena>[0]> = {}) => kitArena({ cls: 'warlock', sub: 'imza_astrolog', level, scores: { cha: 16 }, ...extra });

describe('K54c Astrolog', () => {
  it('Yıldız Falı (28): Uğurlu ilk saldırı/kurtulma avantajlı, Uğursuz dezavantajlı; sürüm 27\'de +1d6', () => {
    const r = W(3, { place: { A: o(3, 3), C: o(4, 4), B: o(6, 3) } });
    r.do(r.use('luck-2', 'C'));
    expect(wardSources(r.state, r.c('C'), r.c('B')).some((x) => x.effect === 'advantage' && x.reason === 'Uğurlu')).toBe(true);
    expect(saveMode('normal', r.c('C'), 'dex')).toBe('advantage');
    r.fresh();
    r.do(r.use('ill-luck-2', 'B'), low);
    expect(saveMode('normal', r.c('B'), 'wis')).toBe('disadvantage');
    expect(W(3, { kuralSurumu: 27 }).keys()).toContain('imza:imza_astrolog/luck');
    expect(W(3).keys()).not.toContain('imza:imza_astrolog/luck');
  });
  it('Yazgı Değişir (6): dosta isabet ıskaya döner, astrologa bedel; tepki ve kaynak harcanır', () => {
    const r = W(6, { place: { A: o(3, 3), C: o(4, 4), B: o(5, 4) } });
    const out = hitReactions(r.state, { attacker: r.c('B'), target: r.c('C'), label: 'Kılıç', total: 18, ac: 12, critical: false, melee: true, ranged: false, damage: 15, damageType: 'slashing' }, mid);
    expect(out.hit).toBe(false);
    const s = applyEvents(r.state, out.events);
    expect(s.combatants.A!.economy.reaction).toBe(true);
    expect(s.combatants.A!.effects?.some((e) => e.attackDis)).toBe(true);
    const old = W(6, { kuralSurumu: 27, place: { A: o(3, 3), C: o(4, 4), B: o(5, 4) } });
    expect(hitReactions(old.state, { attacker: old.c('B'), target: old.c('C'), label: 'Kılıç', total: 18, ac: 12, critical: false, melee: true, ranged: false, damage: 15, damageType: 'slashing' }, mid).hit).toBe(true);
  });
  it('Yazgı Mührü (14): dostun turdaki ilk saldırısı kendiliğinden isabet ve +PB hasar', () => {
    const hero = combatantFromSheet({ ...blankCharacter('f').sheet, name: 'F', raceId: 'human', classId: 'fighter', level: 5, weapons: [{ name: 'Longsword' }], baseScores: { str: 8, dex: 10, con: 14, int: 10, wis: 10, cha: 10 } } as CharacterSheet, { id: 'C', ownerId: 'p1' });
    const r = W(14, { place: { A: o(3, 3), C: o(4, 4), B: o(5, 4) }, enemy: { ac: 30 } });
    r.state = { ...r.state, combatants: { ...r.state.combatants, C: { ...hero, pos: o(4, 4) } } };
    r.do(r.use('seal-of-fate-2', 'B'), low);
    expect(r.c('B').effects?.some((e) => e.fateSeal)).toBe(true);
    r.state = { ...r.state, turnIndex: r.state.order.indexOf('C') };
    const opt = r.c('C').weaponOptions.find((x) => x.weaponId === 'longsword')!;
    const ev = r.do({ type: 'attack', actorId: 'C', targetId: 'B', option: opt } as never, mid);
    const atk = ev.find((e) => e.type === 'attack_resolved');
    expect(atk?.type === 'attack_resolved' && atk.hit).toBe(true);
    expect(atk?.type === 'attack_resolved' && atk.extra?.some((x) => x.label === 'Yazgı Mührü')).toBe(true);
  });
  it('YZ: Yıldız Falı (Uğur) bonus eylemle dosta', () => {
    const r = W(3, { place: { A: o(3, 3), C: o(4, 4), B: o(9, 3) } });
    const c = chooseCommand(r.state);
    expect(c.type === 'use_feature' && c.feature).toMatch(/imza:imza_astrolog\/(luck-2|ill-luck-2)/);
  });
});
