/**
 * Görev KATALOG-F0 (kural sürümü 107): yarı can fazı (Faz 2). Tetiklenme, tek seferlik, 0 HP'ye tek vuruş, eşiğin üstü,
 * replay, faz bloğu olmayan canavar, eski sürümde kapalı, şema, günlük ve rozet.
 */
import { describe, expect, it } from 'vitest';
import { getMonster, type Faz2Block, type Monster } from '../data';
import { execute } from './commands';
import { combatantFromMonster, startBattle } from './create';
import { replay } from './reduce';
import { monsterAreaOf } from './areaAttack';
import { legendaryLeft, legendaryOf, legendaryRefreshEvents } from './boss';
import { FAZ2_VERSION, faz2On } from './faz2Surum';
import { faz2Due } from './faz2';
import { faz2Errors } from '../rules/faz2Schema';
import { CURRENT_RULES } from './ruleVersion';
import { GM, mk, scripted } from './fixtures';
import { describeEvent } from '../ui/log';
import { statusIcons } from '../ui/damageFloats';
import type { BattleEvent, BattleState, Combatant } from './types';

const BLOCK: Faz2Block = {
  geciciCan: 10, ac: 2, hasar: '1d6', hasarTuru: 'fire', zayiflikKaldir: ['cold'], direncEkle: ['cold'],
  nefesDoldur: true, nefesAlan: 1.25, efsaneviEk: 1, not: { tr: 'Taş Uyanışı', en: 'Stone Awakening' },
};
const dragon = (faz2?: Faz2Block): Monster => ({ ...getMonster('adult-red-dragon'), vulnerabilities: ['cold'], ...(faz2 ? { faz2 } : {}) });

function arena(m: Monster, v = CURRENT_RULES): { state: BattleState; start: BattleEvent } {
  const d = { ...combatantFromMonster(m, { id: 'D', kuralSurumu: v }), initiativeBonus: 30 };
  const parts = [d, mk('A', { ownerId: 'p1', hp: 100, maxHp: 100 })];
  const started = startBattle('f', 'd-z-zemin', parts, scripted(...parts.map(() => [20, 10] as [number, number])), { map: { id: 'col' }, kuralSurumu: v });
  const breath = (started.state.combatants.D as Combatant).attacks.findIndex((a) => !!a.area && a.recharge);
  const D = { ...(started.state.combatants.D as Combatant), rechargeUsed: [breath] };
  const state: BattleState = { ...started.state, status: 'active', combatants: { ...started.state.combatants, D } };
  return { state, start: { type: 'battle_started', state } };
}
const hp = (s: BattleState, n: number) => {
  const r = execute(s, { type: 'adjust_hp', targetId: 'D', hp: n }, GM, () => 0.5);
  if (!r.ok) throw new Error(r.error);
  return r;
};
const phases = (ev: BattleEvent[]) => ev.filter((e) => e.type === 'phase_changed');
const D = (s: BattleState) => s.combatants.D as Combatant;

describe('KATALOG-F0: yarı can fazı', () => {
  it('sürüm 107, güncel', () => {
    expect(FAZ2_VERSION).toBe(107);
    expect(CURRENT_RULES).toBeGreaterThanOrEqual(107);
    expect(faz2On({ kuralSurumu: 107 })).toBe(true);
    expect(faz2On({ kuralSurumu: 106 })).toBe(false);
  });

  it('eşiğe inince bir kez: geçici HP, AC/hasar etkisi, zayıflık kalkar, direnç eklenir, nefes dolar, alan ×1,25, efsanevi +1', () => {
    const { state } = arena(dragon(BLOCK));
    const max = D(state).maxHp;
    expect(D(state).faz2).toBeDefined();
    const breath = D(state).rechargeUsed[0] as number;
    const before = monsterAreaOf(D(state), breath, state)!.spec.sizeFt;
    const r = hp(state, Math.floor(max / 2));
    const ev = phases(r.events);
    expect(ev).toHaveLength(1);
    const c = D(r.state);
    expect(c.faz).toBe(2);
    expect(c.tempHp).toBe(10);
    expect(c.vulnerabilities).not.toContain('cold');
    expect(c.rechargeUsed).toEqual([]);
    expect(c.effects?.find((e) => e.id === 'faz2:D')).toMatchObject({ ac: 2, hitDie: '1d6', hitType: 'fire', resist: ['cold'] });
    expect(monsterAreaOf(c, breath, r.state)!.spec.sizeFt).toBe(Math.floor((before * 1.25) / 5) * 5);
    const spec = legendaryOf(r.state, c)!;
    expect(legendaryLeft(c, spec)).toBe(spec.uses + 1);
    const used = { ...c, legendaryLeft: 0 };
    expect(legendaryRefreshEvents({ ...r.state, combatants: { ...r.state.combatants, D: used } }, 'D')).toEqual([{ type: 'legendary_refresh', actorId: 'D', left: spec.uses + 1 }]);
    // Günlük ve rozet (yalnız görünüm).
    expect(describeEvent(ev[0] as BattleEvent, r.state)).toContain('Faz 2');
    expect(describeEvent(ev[0] as BattleEvent, r.state)).toContain('Taş Uyanışı');
    expect(statusIcons(c).some((i) => i.key === 'faz2')).toBe(true);
  });

  it('tek seferlik: iyileşip yeniden yarının altına inince ikinci olay yok; değerler kalır', () => {
    const { state } = arena(dragon(BLOCK));
    const max = D(state).maxHp;
    const r1 = hp(state, Math.floor(max / 2) - 5);
    expect(phases(r1.events)).toHaveLength(1);
    const r2 = hp(r1.state, max);
    expect(phases(r2.events)).toHaveLength(0);
    expect(D(r2.state).faz).toBe(2);
    expect(D(r2.state).vulnerabilities).not.toContain('cold');
    const r3 = hp(r2.state, 10);
    expect(phases(r3.events)).toHaveLength(0);
  });

  it('eşiğin üstünde ve tek vuruşta 0 HP: faz yok', () => {
    const { state } = arena(dragon(BLOCK));
    const max = D(state).maxHp;
    expect(phases(hp(state, Math.floor(max / 2) + 1).events)).toHaveLength(0);
    const dead = hp(state, 0);
    expect(phases(dead.events)).toHaveLength(0);
    expect(D(dead.state).faz).toBeUndefined();
  });

  it('eşik veriden (0,25)', () => {
    const { state } = arena(dragon({ esik: 0.25, nefesDoldur: true }));
    const max = D(state).maxHp;
    expect(phases(hp(state, Math.floor(max / 2)).events)).toHaveLength(0);
    expect(phases(hp(state, Math.floor(max / 4)).events)).toHaveLength(1);
  });

  it('replay aynı durumu verir', () => {
    const { state, start } = arena(dragon(BLOCK));
    const r1 = hp(state, Math.floor(D(state).maxHp / 2));
    const r2 = hp(r1.state, 20);
    const back = replay([start, ...r1.events, ...r2.events]);
    expect(back.combatants.D).toEqual(r2.state.combatants.D);
  });

  it('faz bloğu olmayan canavar: olay ve alan yok, alan boyu aynı', () => {
    const { state } = arena(dragon());
    expect(D(state).faz2).toBeUndefined();
    const breath = D(state).rechargeUsed[0] as number;
    const r = hp(state, Math.floor(D(state).maxHp / 2) - 1);
    expect(phases(r.events)).toHaveLength(0);
    const c = D(r.state);
    expect(c.faz).toBeUndefined();
    expect(c.vulnerabilities).toContain('cold');
    expect(monsterAreaOf(c, breath, r.state)!.spec).toBe(c.attacks[breath]!.area);
    expect(faz2Due(c)).toBe(false);
  });

  it('eski sürümde (106) kapalı: blok kopyalanmaz, eşikte olay yok', () => {
    const { state } = arena(dragon(BLOCK), 106);
    expect(state.kuralSurumu).toBe(106);
    expect(D(state).faz2).toBeUndefined();
    expect(phases(hp(state, 10).events)).toHaveLength(0);
    // 107'de kurulmuş savaşçı 106 savaşına girerse de blok düşer (startBattle).
    const c107 = combatantFromMonster(dragon(BLOCK), { id: 'D', kuralSurumu: 107 });
    const s106 = startBattle('f', 'd-z-zemin', [c107, mk('A', { ownerId: 'p1' })], () => 0.5, { kuralSurumu: 106 }).state;
    expect((s106.combatants.D as Combatant).faz2).toBeUndefined();
  });

  it('şema: geçerli blok, bilinmeyen alan, yanlış tür', () => {
    expect(faz2Errors(BLOCK)).toEqual([]);
    expect(faz2Errors({ esik: 0.5, zayiflikKaldir: ['fire'], nefesAlan: 1.25, geciciCan: '4d10', saldiri: 2 })).toEqual([]);
    expect(faz2Errors({ foo: 1 })).toEqual(['faz2: bilinmeyen alan "foo"']);
    expect(faz2Errors({ esik: 2, geciciCan: 'x', nefesAlan: 5, efsaneviEk: -1, zayiflikKaldir: 'fire' }, 'M').length).toBe(5);
    expect(faz2Errors(null)).toEqual(['faz2: nesne olmalı']);
  });
});
