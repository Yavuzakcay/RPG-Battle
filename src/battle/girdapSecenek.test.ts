/**
 * Control Water dört seçenek (kullanıcı kararı 2026-11-19; sürüm 84 + `controlWaterWhirlpool`): menüde Whirlpool, Flood,
 * Part Water, Redirect Flow; girdap savaş mekaniği, diğer üçü etkisiz ama slot ve konsantrasyon harcanır, günlükte ve kartta
 * Game Master notu (TR veri, EN metin). Arayüzün altıgen seçimi (`targetHex`) girdabı altıgendeki yaratığa açar.
 * G01 ekleri: girdabın STR save'inde süren etki kaynaklı kip nedeni; Incapacitated'ta Danger Sense yazılmaz; Gnomish Cunning EN.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { GM, mk, P1 } from './fixtures';
import { replay } from './reduce';
import { saveModeWhy } from './durations';
import { waterChoices } from '../ui/hud';
import { describeEvent } from '../ui/log';
import { setLang } from '../i18n';
import { spells } from '../data';
import type { DiceRequest, Rng } from '../rules/dice';
import type { ActiveEffect, BattleEvent, BattleState, Combatant, Command } from './types';

function hooked(one: number, two: [number, number]): Rng {
  const f = (() => 0.5) as Rng & { dice?: (r: DiceRequest) => number[] };
  f.dice = (req) => (req.sides === 20 ? (req.count >= 2 ? [...two] : [one]) : Array.from({ length: req.count }, () => Math.floor(req.sides / 2) + 1));
  return f;
}
const CW = spells.find((s) => s.id === 'control-water')!;
const flat = (): string[] => Array.from({ length: 11 }, () => '.'.repeat(21));
function scene(v: number, parts: Combatant[], toggles?: Record<string, boolean>): BattleState {
  const s0 = startBattle('cw4', 'd', parts.map((p) => ({ ...p, pos: null })), () => 0.5, { kuralSurumu: v, map: { id: 'kale-onu', variantId: 'gunduz' } } as never).state;
  const cs: Record<string, Combatant> = {};
  for (const p of parts) cs[p.id] = { ...(s0.combatants[p.id] as Combatant), pos: p.pos, initiative: 0 };
  return { ...s0, kuralSurumu: v, status: 'active', round: 1, order: parts.map((p) => p.id), turnIndex: 0, combatants: cs,
    map: { ...s0.map!, tiles: flat(), objects: [], zones: [], ...(toggles ? { ruleToggles: toggles } : {}) } };
}
const caster = (): Combatant => mk('A', { ownerId: 'p1', hp: 100, maxHp: 100, level: 17, spellSaveDc: 15, spellAttack: 7, spellMod: 4,
  spellNames: ['Control Water'], spellSlots: [4, 3, 3, 3, 3, 2, 1, 1, 1], pos: { col: 2, row: 5 } });
const foe = (p: Partial<Combatant> = {}): Combatant => mk('T', { side: 'enemies', hp: 100, maxHp: 100, pos: { col: 10, row: 5 }, ...p });
const notes = (evs: BattleEvent[]) => evs.filter((e): e is Extract<BattleEvent, { type: 'map_note' }> => e.type === 'map_note' && !!e.secenekNotu);

describe('Control Water: dört seçenek', () => {
  afterEach(() => setLang('tr'));
  it('menü: sürüm 84 + anahtar dört seçenek; 83 ve anahtar kapalı Kuyruk 19 üçlüsü', () => {
    expect(waterChoices(scene(84, [caster(), foe()]), CW)).toEqual(['whirlpool', 'flood', 'part', 'redirect']);
    expect(waterChoices(scene(83, [caster(), foe()]), CW)).toEqual(['whirlpool', 'flood', 'part']);
    expect(waterChoices(scene(84, [caster(), foe()], { controlWaterWhirlpool: false }), CW)).toEqual(['whirlpool', 'flood', 'part']);
  });
  it('girdap dışı seçenek: alan ve hasar yok; slot ve konsantrasyon harcanır; Game Master notu TR/EN', () => {
    for (const [choice, ad] of [['flood', 'Flood'], ['part', 'Part Water'], ['redirect', 'Redirect Flow']] as const) {
      const s = scene(84, [caster(), foe()]);
      const r = execute(s, { type: 'cast_spell', actorId: 'A', spellName: 'Control Water', targetHex: { col: 8, row: 3 }, slotLevel: 4, choice } as Command, P1, hooked(1, [1, 1]));
      expect(r.ok, r.ok ? '' : r.error).toBe(true);
      if (!r.ok) continue;
      expect(r.state.map?.zones ?? []).toHaveLength(0);
      expect(r.state.combatants.T?.hp).toBe(100);
      expect(r.state.combatants.A?.spellSlots[3]).toBe(2);
      expect(r.state.combatants.A?.concentration?.spell).toBe('Control Water');
      const n = notes(r.events);
      expect(n).toHaveLength(1);
      expect(n[0]!.secenekNotu).toEqual({ spell: 'control-water', choice });
      setLang('tr');
      expect(describeEvent(n[0]!, r.state)).toMatch(new RegExp(`^Game Master notu — Control Water \\(${ad}\\): .*Savaşta etkisi yok`));
      setLang('en');
      expect(describeEvent(n[0]!, r.state)).toMatch(new RegExp(`^Game Master note — Control Water \\(${ad}\\): .*No combat effect`));
      setLang('tr');
      expect(replay([{ type: 'battle_started', state: s }, ...r.events] as BattleEvent[])).toEqual(r.state);
    }
  });
  it('arayüzün altıgen seçimi: girdap altıgendeki yaratığa açılır (choice whirlpool ya da yok)', () => {
    for (const choice of [undefined, 'whirlpool']) {
      const r = execute(scene(84, [caster(), foe()]), { type: 'cast_spell', actorId: 'A', spellName: 'Control Water', targetHex: { col: 10, row: 5 }, slotLevel: 4, ...(choice ? { choice } : {}) } as Command, P1, hooked(1, [1, 1]));
      expect(r.ok, r.ok ? '' : r.error).toBe(true);
      if (r.ok) expect(r.state.map?.zones?.find((z) => z.spec?.whirl)?.center).toEqual({ col: 10, row: 5 });
    }
  });
  it('83: seçenek notu yok (eski yol)', () => {
    const r = execute(scene(83, [caster(), foe()]), { type: 'cast_spell', actorId: 'A', spellName: 'Control Water', targetHex: { col: 8, row: 3 }, slotLevel: 4, choice: 'redirect' } as Command, P1, hooked(1, [1, 1]));
    if (r.ok) expect(notes(r.events)).toHaveLength(0);
  });
});

describe('G01 ekleri', () => {
  afterEach(() => setLang('tr'));
  it('girdabın tur başı STR save\'i: süren etki (Enlarge/Reduce) dezavantajının nedeni günlükte', () => {
    const reduce = { id: 't:reduce', name: 'Enlarge/Reduce', sourceId: 'A', until: 99, saveDis: ['str'] } as ActiveEffect;
    let s = scene(84, [caster(), foe({ effects: [reduce] })]);
    const c = execute(s, { type: 'cast_spell', actorId: 'A', spellName: 'Control Water', targetId: 'T', slotLevel: 4 } as Command, P1, hooked(10, [19, 3]));
    if (!c.ok) throw new Error(c.error);
    s = c.state;
    const r = execute(s, { type: 'end_turn', actorId: 'A' } as Command, P1, hooked(10, [19, 3]));
    if (!r.ok) throw new Error(r.error);
    const sv = r.events.find((e): e is Extract<BattleEvent, { type: 'save_resolved' }> => e.type === 'save_resolved' && e.targetId === 'T')!;
    expect(sv.ability).toBe('str');
    expect(sv.d20).toEqual([19, 3]);
    expect(sv.modeWhy).toEqual([{ kip: 'dis', key: 'effect', name: 'Enlarge/Reduce' }]);
    expect(describeEvent(sv, r.state)).toContain('Dezavantaj: Enlarge/Reduce (STR save)');
    void GM;
  });
  it('Incapacitated iken Danger Sense yazılmaz (SRD: Incapacitated değilken)', () => {
    expect(saveModeWhy('normal', { conditions: [], saveAdvantage: ['dex'] }, 'dex').why).toHaveLength(1);
    expect(saveModeWhy('normal', { conditions: ['Incapacitated'], saveAdvantage: ['dex'] }, 'dex')).toEqual({ mode: 'normal', why: [] });
  });
  it('Gnomish Cunning ve Danger Sense İngilizce satırı', () => {
    const gn = saveModeWhy('normal', { conditions: [], effects: [{ name: 'Gnomish Cunning', saveAdv: ['int', 'wis', 'cha'] }] }, 'wis');
    expect(gn.mode).toBe('advantage');
    const ev = { type: 'save_resolved', actorId: 'A', targetId: 'T', label: 'Vicious Mockery', ability: 'wis', dc: 13, mode: 'normal', reasons: [], d20: [19, 3], natural: 19,
      total: 19, success: true, damageRolls: [], rawDamage: 0, appliedDamage: 0, damageType: '', damageNote: null, targetHpAfter: 100, effects: [], conditionsAdded: [], modeWhy: gn.why } as unknown as BattleEvent;
    const st = scene(84, [caster(), foe()]);
    setLang('en');
    expect(describeEvent(ev, st)).toContain('Advantage: Gnomish Cunning (WIS save)');
    const ds = saveModeWhy('normal', { conditions: [], saveAdvantage: ['dex'] }, 'dex');
    expect(describeEvent({ ...(ev as object), ability: 'dex', modeWhy: ds.why } as BattleEvent, st)).toContain('Advantage: Danger Sense (DEX save)');
  });
});
