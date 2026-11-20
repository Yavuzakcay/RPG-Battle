/**
 * G01 (yalnız görünüm): save zarının avantaj/dezavantaj nedeni günlükte (`save_resolved.modeWhy`, `saveWhy.ts`).
 * Durumdan (Restrained DEX), özellikten (Danger Sense, Gnomish Cunning), süren etkiden (Haste, Reduce) gelen kip; nedensiz kip
 * eski görünüm; birbirini götüren kaynaklar; EN metni; reducer alanı yok sayar (replay aynı).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { mk, P1 } from './fixtures';
import { saveModeWhy } from './durations';
import { replay } from './reduce';
import { describeEvent } from '../ui/log';
import { setLang } from '../i18n';
import type { DiceRequest, Rng } from '../rules/dice';
import type { ActiveEffect, BattleEvent, BattleState, Combatant, Command } from './types';

/** d20: tek zarda 10, çift zarda [19, 3]; diğer zarlar ⌊yüz/2⌋ + 1. */
function hooked(): Rng {
  const f = (() => 0.5) as Rng & { dice?: (r: DiceRequest) => number[] };
  f.dice = (req) => (req.sides === 20 ? (req.count >= 2 ? [19, 3] : [10]) : Array.from({ length: req.count }, () => Math.floor(req.sides / 2) + 1));
  return f;
}
const flat = (): string[] => Array.from({ length: 11 }, () => '.'.repeat(21));
function scene(target: Partial<Combatant>): BattleState {
  const parts = [mk('A', { ownerId: 'p1', hp: 50, maxHp: 50, level: 5, spellSaveDc: 13, spellMod: 3, spellNames: ['Sacred Flame', 'Vicious Mockery'], pos: { col: 3, row: 5 } }),
    mk('B', { side: 'enemies', hp: 60, maxHp: 60, pos: { col: 5, row: 5 }, ...target })];
  const s0 = startBattle('g01', 'd', parts.map((p) => ({ ...p, pos: null })), () => 0.5, { map: { id: 'kale-onu', variantId: 'gunduz' } } as never).state;
  const cs: Record<string, Combatant> = {};
  for (const p of parts) cs[p.id] = { ...(s0.combatants[p.id] as Combatant), ...p, initiative: 0 };
  return { ...s0, status: 'active', round: 1, order: ['A', 'B'], turnIndex: 0, combatants: cs, map: { ...s0.map!, tiles: flat(), objects: [], zones: [] } };
}
const fx = (name: string, extra: Partial<ActiveEffect>): ActiveEffect => ({ id: `t:${name}`, name, sourceId: 'B', ...extra } as ActiveEffect);
function cast(target: Partial<Combatant>, spell = 'Sacred Flame') {
  const s = scene(target);
  const r = execute(s, { type: 'cast_spell', actorId: 'A', spellName: spell, targetId: 'B' } as Command, P1, hooked());
  if (!r.ok) throw new Error(r.error);
  const ev = r.events.find((e): e is Extract<BattleEvent, { type: 'save_resolved' }> => e.type === 'save_resolved')!;
  return { s, r, ev, text: describeEvent(ev, r.state) };
}

describe('G01: save kipinin nedeni', () => {
  afterEach(() => setLang('tr'));
  it('durum: Restrained DEX save dezavantajı (sürüm 83+)', () => {
    const { ev, text } = cast({ conditions: ['Restrained'], srd83: true } as Partial<Combatant>);
    expect(ev.d20).toEqual([19, 3]);
    expect(ev.modeWhy).toEqual([{ kip: 'dis', key: 'condition', name: 'Restrained' }]);
    expect(text).toContain('(dezavantaj)');
    expect(text).toContain('Dezavantaj: Restrained (DEX save)');
  });
  it('özellik: Danger Sense (DEX) ve Gnomish Cunning (WIS) avantajı', () => {
    const ds = cast({ saveAdvantage: ['dex'] });
    expect(ds.ev.modeWhy).toEqual([{ kip: 'adv', key: 'feature', name: 'Danger Sense' }]);
    expect(ds.text).toContain('Avantaj: Danger Sense (DEX save)');
    const gn = cast({ effects: [fx('Gnomish Cunning', { saveAdv: ['int', 'wis', 'cha'] })] }, 'Vicious Mockery');
    expect(gn.ev.modeWhy).toEqual([{ kip: 'adv', key: 'effect', name: 'Gnomish Cunning' }]);
    expect(gn.text).toContain('Avantaj: Gnomish Cunning (WIS save)');
  });
  it('süren etki: Haste DEX avantajı; Reduce STR dezavantajı (merkezi hesap)', () => {
    const h = cast({ effects: [fx('Haste', { saveAdv: ['dex'] })] });
    expect(h.text).toContain('Avantaj: Haste (DEX save)');
    const r = saveModeWhy('normal', { conditions: [], effects: [{ name: 'Reduce', saveDis: ['str'] }] }, 'str');
    expect(r).toEqual({ mode: 'disadvantage', why: [{ kip: 'dis', key: 'effect', name: 'Reduce' }] });
  });
  it('birbirini götüren kaynaklar: tek zar, ikisi de yazılır', () => {
    const { ev, text } = cast({ conditions: ['Restrained'], srd83: true, effects: [fx('Haste', { saveAdv: ['dex'] })] } as Partial<Combatant>);
    expect(ev.d20).toEqual([10]);
    expect(text).toContain('Avantaj ve dezavantaj birbirini götürdü: Haste / Restrained (DEX save)');
  });
  it('nedensiz kip: alan yok, günlük eskisi gibi', () => {
    const { ev, text } = cast({});
    expect(ev.modeWhy).toBeUndefined();
    expect(text).not.toMatch(/Avantaj|Dezavantaj/);
  });
  it('EN metni', () => {
    const { ev, r } = cast({ conditions: ['Restrained'], srd83: true } as Partial<Combatant>);
    setLang('en');
    expect(describeEvent(ev, r.state)).toContain('Disadvantage: Restrained (DEX save)');
  });
  it('reducer alanı yok sayar: replay aynı', () => {
    const { s, r } = cast({ conditions: ['Restrained'], srd83: true } as Partial<Combatant>);
    expect(replay([{ type: 'battle_started', state: s }, ...r.events] as BattleEvent[])).toEqual(r.state);
  });
});
