/**
 * Kuyruk K65a (kural sürümü 49): serbest şekil alan seçici + Fire Storm (SRD 5.2.1: on bitişik 10 ft küp = en çok 40
 * altıgen; her altıgen menzilde, ilk altıgen görüşte). Sürüm 48'de tek 25 ft küre aynen. `run` replay'i denetler.
 */
import { describe, expect, it } from 'vitest';
import { spells } from '../data';
import { chooseCommand } from './ai';
import { mk } from './fixtures';
import { connected, freeAddProblem, freeRemoveProblem, freeShapeAim, freeShapeOf, freeShapeProblem } from './freeShape';
import { execute } from './index';
import { caster, field, run } from './k19spells.test';
import { areaActPreview, areaPointCount } from '../ui/hud';
import { seededRng } from '../rules/dice';
import { P1 } from './fixtures';
import type { Offset } from '../rules/hex';
import type { BattleState, Combatant, Command } from './types';

const SP = () => spells.find((s) => s.name === 'Fire Storm') as NonNullable<(typeof spells)[number]>;
const SLOTS = [4, 3, 3, 3, 3, 2, 2, 1, 1];
const wiz = (p: Partial<Combatant> = {}) => caster({ spellNames: ['Fire Storm'], spellSlots: SLOTS, concentration: null, hp: 300, maxHp: 300, ...p });
const foe = (id: string, p: Partial<Combatant> = {}) => mk(id, { side: 'enemies', hp: 200, maxHp: 200, ...p });
const rect = (c0: number, c1: number, r0: number, r1: number): Offset[] => {
  const out: Offset[] = [];
  for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) out.push({ col: c, row: r });
  return out;
};
const storm = (hexes: Offset[]): Command => ({ type: 'cast_spell', actorId: 'A', spellName: 'Fire Storm', targetHex: hexes[0] as Offset, targetHexes: hexes });
const setup = (ver = 49, parts: Combatant[] = [wiz(), foe('F0'), foe('F1'), foe('F2')], pos: Record<string, Offset> = { A: { col: 1, row: 3 }, F0: { col: 5, row: 2 }, F1: { col: 11, row: 4 }, F2: { col: 13, row: 3 } }) =>
  field(parts, pos, ver);
const err = (s: BattleState, cmd: Command) => { const r = execute(s, cmd, P1, seededRng(1)); return r.ok ? null : r.error; };

describe('K65a Fire Storm serbest şekil', () => {
  it('veri: sürüm 49\'da 40 altıgen, menzil her altıgende, görüş ilkinde; 48\'de yok', () => {
    expect(freeShapeOf(setup(), SP())).toEqual({ maxHexes: 40, rangeAll: true, sightFirst: true });
    expect(freeShapeOf(setup(48), SP())).toBeUndefined();
  });
  it('40 altıgenlik tek parça alan: içindeki her yaratık bir kez DEX save atar, hasar bir kez; alan dışındaki komşu etkilenmez', () => {
    const shape = rect(3, 12, 1, 4);
    expect(shape).toHaveLength(40);
    const r = run(setup(), storm(shape));
    const saves = r.events.filter((e) => e.type === 'save_resolved');
    expect(saves.map((e) => e.type === 'save_resolved' && e.targetId).sort()).toEqual(['F0', 'F1']);
    expect(new Set(saves.map((e) => e.type === 'save_resolved' && e.rawDamage)).size).toBe(1);
    const cast = r.events.find((e) => e.type === 'spell_cast');
    expect(cast?.type === 'spell_cast' && cast.area?.hexes).toHaveLength(40);
    expect(cast?.type === 'spell_cast' && cast.note).toMatch(/40 altıgen \(serbest şekil\)/);
    expect(r.state.combatants.F2?.hp).toBe(200);
  });
  it('kenar durumlar: 41 altıgen, iki parça, tekrar, ilk altıgen duvar arkasında reddedilir; menzil her altıgende', () => {
    const s = setup();
    expect(err(s, storm(rect(3, 12, 1, 4).concat([{ col: 13, row: 1 }])))).toMatch(/en çok 40/);
    expect(err(s, storm([{ col: 4, row: 2 }, { col: 9, row: 2 }]))).toMatch(/tek parça/);
    expect(err(s, storm([{ col: 4, row: 2 }, { col: 4, row: 3 }, { col: 4, row: 2 }]))).toMatch(/iki kez/);
    // Duvar: 3. sütun boydan boya; arkasındaki ilk altıgen görülemez, ama önündeki ilk altıgenden duvar ardına uzanılabilir.
    const walled = { ...s, map: { ...(s.map as NonNullable<BattleState['map']>), tiles: (s.map?.tiles ?? []).map((row) => `${row.slice(0, 3)}s${row.slice(4)}`) } };
    expect(err(walled, storm([{ col: 5, row: 2 }]))).toMatch(/görülemiyor/);
    expect(err(walled, storm([{ col: 2, row: 2 }, { col: 3, row: 2 }, { col: 4, row: 2 }, { col: 5, row: 2 }]))).toBeNull();
    // Menzil (saf doğrulayıcı, 20 ft menzilli kopya): her altıgen menzilde olmalı.
    const short = { ...SP(), rangeFt: 20 };
    const fs = freeShapeOf(s, SP())!;
    expect(freeShapeProblem(s, s.combatants.A as Combatant, short, fs, [{ col: 4, row: 3 }, { col: 5, row: 3 }, { col: 6, row: 3 }])).toMatch(/menzil dışında/);
  });
  it('sürüm 48: aynı komut eski 25 ft küre (targetHexes yok sayılır)', () => {
    const r = run(setup(48), storm([{ col: 5, row: 2 }]));
    const cast = r.events.find((e) => e.type === 'spell_cast');
    expect(cast?.type === 'spell_cast' && cast.note).toMatch(/25 ft/);
    expect((cast?.type === 'spell_cast' && cast.area?.hexes.length) || 0).toBeGreaterThan(40);
  });
});

describe('K65a seçici yardımcıları', () => {
  const s = setup();
  const me = s.combatants.A as Combatant;
  const fs = freeShapeOf(s, SP())!;
  it('ekleme bitişik olmalı, sınırda durur; çıkarma alanı bölmemeli', () => {
    expect(freeAddProblem(s, me, SP(), fs, [], { col: 4, row: 2 })).toBeNull();
    expect(freeAddProblem(s, me, SP(), fs, [{ col: 4, row: 2 }], { col: 8, row: 2 })).toMatch(/bitişik değil/);
    expect(freeAddProblem(s, me, SP(), { ...fs, maxHexes: 1 }, [{ col: 4, row: 2 }], { col: 5, row: 2 })).toMatch(/sınır doldu/);
    const line = [{ col: 4, row: 2 }, { col: 5, row: 2 }, { col: 6, row: 2 }];
    expect(connected(line)).toBe(true);
    expect(freeRemoveProblem(s, me, SP(), fs, line, { col: 5, row: 2 })).toMatch(/ikiye böler/);
    expect(freeRemoveProblem(s, me, SP(), fs, line, { col: 6, row: 2 })).toBeNull();
  });
  it('önizleme motorla aynı: sayaç 40, dost/düşman, geçersizde neden', () => {
    const act = { kind: 'spell' as const, spell: SP() };
    expect(areaPointCount(s, act)).toBe(40);
    const pv = areaActPreview(s, me, act, null, null, rect(3, 6, 1, 3));
    expect(pv.foes.map((c) => c.id)).toEqual(['F0']);
    expect(areaActPreview(s, me, act, null, null, [{ col: 4, row: 2 }, { col: 9, row: 2 }]).error).toMatch(/tek parça/);
  });
});

describe('K65a yapay zekâ', () => {
  it('iki düşman grubunu dostsuz yolla birleştirir; dost altıgenine girmez; komut geçerli', () => {
    const parts = [wiz(), foe('F0'), foe('F1'), foe('F2'), mk('P', { ownerId: 'p1', hp: 30, maxHp: 30 })];
    const pos = { A: { col: 1, row: 3 }, F0: { col: 5, row: 2 }, F1: { col: 6, row: 2 }, F2: { col: 11, row: 2 }, P: { col: 8, row: 2 } };
    const s = setup(49, parts, pos);
    const aim = freeShapeAim(s, s.combatants.A as Combatant, SP(), freeShapeOf(s, SP())!, ['F0', 'F1', 'F2'].map((id) => s.combatants[id] as Combatant))!;
    expect(aim.covered.map((c) => c.id).sort()).toEqual(['F0', 'F1', 'F2']);
    expect(aim.hexes.some((h) => h.col === 8 && h.row === 2)).toBe(false);
    expect(connected(aim.hexes)).toBe(true);
    expect(aim.hexes.length).toBeLessThanOrEqual(40);
    // Bütçe küçükse en kalabalık grupla yetinir.
    const small = freeShapeAim(s, s.combatants.A as Combatant, SP(), { ...freeShapeOf(s, SP())!, maxHexes: 3 }, ['F0', 'F1', 'F2'].map((id) => s.combatants[id] as Combatant))!;
    expect(small.covered.map((c) => c.id).sort()).toEqual(['F0', 'F1']);
    const t0 = performance.now();
    const cmd = chooseCommand(s);
    const ms = performance.now() - t0;
    expect(cmd).toMatchObject({ type: 'cast_spell', spellName: 'Fire Storm' });
    expect(cmd.type === 'cast_spell' && cmd.targetHexes?.some((h) => h.col === 8 && h.row === 2)).toBe(false);
    expect(ms).toBeLessThan(5000);
  });
});
