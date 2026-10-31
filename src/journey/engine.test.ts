/**
 * Görev Y0/Y1: yolculuk motoru. Başlat, savaş sonucu (XP, altın, iksir), kısa dinlenme sınırı (ev kuralı; Kolay'da
 * yok), uzun dinlenme (dinlenme yeri + 16 saat), saat sayacı, Kolay'da 1 HP ile kalkma, kalıcı ölüm, kilometre taşı ve
 * XP ile seviye, iksir, bitiş; her adımda replay aynı durumu verir.
 */
import { describe, expect, it } from 'vitest';
import route from '../../data/yolculuk/ilk-gun.json';
import { JOURNEY_RULES, executeJourney, longRestBlock, replayJourney, shortRestsLeft } from './engine';
import { blankCharacter, suggestedScores } from '../rules/builder';
import { fullStatus } from '../rules/characterRest';
import type { CharacterSheet } from '../rules/stats';
import type { Difficulty, JourneyCommand, JourneyEvent, JourneyRoute, JourneyState, Progression } from './types';

const R = route as unknown as JourneyRoute;
const sheet = (classId: string, name: string): CharacterSheet => ({ ...blankCharacter(name).sheet, name, classId, level: 3, baseScores: suggestedScores(classId), weapons: [{ name: 'Mace' }] });
const PARTY = [{ id: 'a', name: 'Bor', sheet: sheet('fighter', 'Bor') }, { id: 'b', name: 'Mira', sheet: sheet('cleric', 'Mira') }];
const mid = () => 0.5;

function play(cmds: JourneyCommand[], difficulty: Difficulty = 'normal', progression: Progression = 'milestone', r: JourneyRoute = R) {
  let s: JourneyState | null = null;
  const events: JourneyEvent[] = [];
  for (const c of [{ type: 'start', id: 'j1', route: r, seed: 1, difficulty, progression, party: PARTY } as JourneyCommand, ...cmds]) {
    const x = executeJourney(s, c, mid);
    if (!x.ok) throw new Error(`${c.type}: ${x.error}`);
    s = x.state; events.push(...x.events);
  }
  expect(replayJourney(events)).toEqual(s);
  return s as JourneyState;
}
const hurt = (s: JourneyState, hp: Record<string, number>, dead: string[] = []) => Object.fromEntries(s.party.map((m) => [m.id, { ...m.status, hp: hp[m.id] ?? m.status.hp, ...(dead.includes(m.id) ? { dead: true } : {}) }]));

describe('yolculuk motoru', () => {
  it('başlangıç: ilk durak, saat 6 + yürüyüş, tam durum; güzergâh 5 durak 3 savaş', () => {
    const s = play([]);
    expect(R.stops.length).toBe(5);
    expect(R.stops.filter((x) => x.kind === 'battle').length).toBe(3);
    expect(s).toMatchObject({ stop: 0, stopDone: false, hour: 8, level: 3, gold: 0, result: null });
    expect(s.party[0]?.status.hp).toBe(fullStatus(PARTY[0]!.sheet).hp);
  });
  it('savaş sonucu: durum, XP, altın (XP × katsayı), iksir; sonra ilerle', () => {
    let s = play([]);
    const x = executeJourney(s, { type: 'battle_result', outcome: 'won', statuses: hurt(s, { a: 5 }), xp: 1000 }, mid);
    if (!x.ok) throw new Error(x.error);
    s = x.state;
    expect(s).toMatchObject({ stopDone: true, xp: 1000, gold: Math.round(1000 * JOURNEY_RULES.altinKatsayi), potions: 1 });
    expect(s.party[0]?.status.hp).toBe(5);
    expect(executeJourney(s, { type: 'battle_result', outcome: 'won', statuses: {}, xp: 1 }, mid).ok).toBe(false);
  });
  it('kısa dinlenme: 1 saat, HP zarı; Normal\'de iki uzun dinlenme arası en çok 2, Kolay\'da sınırsız', () => {
    const won = (s: JourneyState) => ({ type: 'battle_result', outcome: 'won', statuses: hurt(s, { a: 3 }), xp: 100 }) as JourneyCommand;
    let s = play([]);
    s = play([won(s), { type: 'short_rest', dice: { a: 2 } }, { type: 'short_rest', dice: {} }]);
    expect(s.hour).toBe(10);
    expect(s.party[0]!.status.hp).toBeGreaterThan(3);
    expect(shortRestsLeft(s)).toBe(0);
    expect(executeJourney(s, { type: 'short_rest', dice: {} }, mid).ok).toBe(false);
    const easy = play([won(play([], 'kolay')), { type: 'short_rest', dice: {} }, { type: 'short_rest', dice: {} }, { type: 'short_rest', dice: {} }], 'kolay');
    expect(shortRestsLeft(easy)).toBeNull();
  });
  it('uzun dinlenme yalnızca dinlenme yerinde ve 16 saatten sonra; sayaç ve kısa dinlenme hakkı sıfırlanır', () => {
    const s0 = play([]);
    const atCamp = play([{ type: 'battle_result', outcome: 'won', statuses: hurt(s0, { a: 2 }), xp: 0 }, { type: 'advance' }]);
    expect(atCamp).toMatchObject({ stop: 1, stopDone: true, hour: 11 });
    expect(longRestBlock(atCamp)).toBe('tooSoon');
    // Yolda iki kısa dinlenmeyle saat 13; yine erken. Test güzergâhında uzun yürüyüşle geç saat.
    const long: JourneyRoute = { ...R, stops: [R.stops[0]!, { ...R.stops[1]!, travelHours: 20 }, ...R.stops.slice(2)] };
    const s1 = play([], 'normal', 'milestone', long);
    const rested = play([{ type: 'battle_result', outcome: 'won', statuses: hurt(s1, { a: 2 }), xp: 0 }, { type: 'short_rest', dice: {} }, { type: 'advance' }, { type: 'long_rest' }], 'normal', 'milestone', long);
    expect(rested).toMatchObject({ hour: 8 + 1 + 20 + 8, lastLongRest: 37, shortRests: 0 });
    expect(rested.party[0]!.status.hp).toBe(fullStatus(PARTY[0]!.sheet).hp);
  });
  it('ölüm kalıcı (Normal); Kolay\'da durak sonunda 1 HP ile kalkar', () => {
    const s0 = play([]);
    const dead = (d: Difficulty) => play([{ type: 'battle_result', outcome: 'won', statuses: hurt(s0, { b: 0 }, ['b']), xp: 50 }, { type: 'advance' }], d);
    expect(dead('normal').party[1]!.status).toMatchObject({ hp: 0, dead: true });
    expect(dead('kolay').party[1]!.status.hp).toBe(1);
    expect(dead('kolay').party[1]!.status.dead).toBeUndefined();
  });
  it('kilometre taşı: levelUp durağında seviye; XP kipinde eşik geçilip uzun dinlenmede', () => {
    const ms: JourneyRoute = { ...R, stops: [{ ...R.stops[0]!, levelUp: true }, ...R.stops.slice(1)] };
    const s0 = play([], 'normal', 'milestone', ms);
    const up = play([{ type: 'battle_result', outcome: 'won', statuses: hurt(s0, {}), xp: 10 }], 'normal', 'milestone', ms);
    expect(up.level).toBe(4);
    expect(up.party.every((m) => m.sheet.level === 4)).toBe(true);
    const long: JourneyRoute = { ...R, stops: [R.stops[0]!, { ...R.stops[1]!, travelHours: 20 }, ...R.stops.slice(2)] };
    const x0 = play([], 'normal', 'xp', long);
    const xp = play([{ type: 'battle_result', outcome: 'won', statuses: hurt(x0, {}), xp: 2700 }, { type: 'advance' }, { type: 'long_rest' }], 'normal', 'xp', long);
    expect(xp.level).toBe(4);
  });
  it('iksir: 2d4+2 HP (en çok tam); kaybedilen savaş yolculuğu bitirir; son savaş kazanılınca biter', () => {
    const s0 = play([]);
    const s = play([{ type: 'battle_result', outcome: 'won', statuses: hurt(s0, { a: 1 }), xp: 0 }, { type: 'drink_potion', memberId: 'a' }]);
    expect(s.potions).toBe(0);
    expect(s.party[0]!.status.hp).toBe(1 + 3 + 3 + 2); // rng 0,5: d4 = 3
    expect(play([{ type: 'battle_result', outcome: 'lost', statuses: hurt(s0, {}), xp: 0 }]).result).toBe('lost');
    const one: JourneyRoute = { ...R, stops: [R.stops[0]!] };
    const w0 = play([], 'normal', 'milestone', one);
    expect(play([{ type: 'battle_result', outcome: 'won', statuses: hurt(w0, {}), xp: 0 }], 'normal', 'milestone', one).result).toBe('won');
  });
});
