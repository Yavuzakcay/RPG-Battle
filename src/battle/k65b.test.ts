/**
 * Kuyruk K65b (kural sürümü 49, K65a ile aynı): Forcecage serbest şekil (kutu en çok 4, kafes en çok 19 altıgen; menzil her
 * altıgende, görüş ilkinde; hapis/itme/görüş kesme K62 gibi) ve Wind Wall yol denetiminin seçiciyle ortaklaşması. `run`
 * replay'i denetler.
 */
import { describe, expect, it } from 'vitest';
import { spells } from '../data';
import { chooseCommand } from './ai';
import { mk, P1 } from './fixtures';
import { cageAim, connected, freeShapeFor, freeShapeOf, pathAddProblem, pathProblem } from './freeShape';
import { cageBoxBlock, cageStepBlocked } from './forcecage';
import { execute } from './index';
import { caster, field, run } from './k19spells.test';
import { areaActPreview, areaPointCount } from '../ui/hud';
import { seededRng } from '../rules/dice';
import type { Offset } from '../rules/hex';
import type { BattleState, Combatant, Command } from './types';

const SP = (n: string) => spells.find((s) => s.name === n) as NonNullable<(typeof spells)[number]>;
const SLOTS = [4, 3, 3, 3, 3, 2, 2, 1, 1];
const wiz = (p: Partial<Combatant> = {}) => caster({ spellNames: ['Forcecage', 'Wind Wall'], spellSlots: SLOTS, concentration: null, hp: 300, maxHp: 300, ...p });
const foe = (id: string, p: Partial<Combatant> = {}) => mk(id, { side: 'enemies', hp: 200, maxHp: 200, ...p });
const POS = { A: { col: 1, row: 3 }, F0: { col: 6, row: 3 }, F1: { col: 7, row: 3 }, F2: { col: 12, row: 1 } };
const setup = (ver = 49, parts: Combatant[] = [wiz(), foe('F0'), foe('F1'), foe('F2')], pos: Record<string, Offset> = POS) => field(parts, pos, ver);
const cage = (hexes: Offset[], choice?: 'box' | 'cage'): Command => ({ type: 'cast_spell', actorId: 'A', spellName: 'Forcecage', targetHex: hexes[0] as Offset, targetHexes: hexes, ...(choice ? { choice } : {}) });
const err = (s: BattleState, cmd: Command) => { const r = execute(s, cmd, P1, seededRng(1)); return r.ok ? null : r.error; };
const zone = (s: BattleState) => (s.map?.zones ?? []).find((z) => z.cage);

describe('K65b Forcecage serbest şekil', () => {
  it('veri: sürüm 49\'da kutu 4 / kafes 19, varsayılan kutu; 48\'de yok', () => {
    const fs = freeShapeOf(setup(), SP('Forcecage'))!;
    expect(freeShapeFor(fs, null).maxHexes).toBe(4);
    expect(freeShapeFor(fs, 'cage').maxHexes).toBe(19);
    expect(freeShapeOf(setup(48), SP('Forcecage'))).toBeUndefined();
  });
  it('kutu: seçilen bitişik 3 altıgen; içerideki tutsak (sınır geçilmez), kutu görüşü keser', () => {
    const hexes = [{ col: 6, row: 3 }, { col: 7, row: 3 }, { col: 6, row: 2 }];
    const r = run(setup(), cage(hexes, 'box'));
    const z = zone(r.state)!;
    expect(z.cage).toBe('box');
    expect(z.hexes).toEqual(hexes);
    expect(cageStepBlocked(r.state, { col: 6, row: 3 }, { col: 5, row: 3 })).toBe(true);
    expect(cageBoxBlock(r.state, { col: 1, row: 3 }, { col: 6, row: 3 })).toBeTruthy();
  });
  it('kafes: 19 altıgene dek serbest, kafes görüşü kesmez; kutu sınırı 5. altıgende reddeder', () => {
    const big = [{ col: 5, row: 3 }, { col: 6, row: 3 }, { col: 7, row: 3 }, { col: 8, row: 3 }, { col: 9, row: 3 }];
    expect(err(setup(), cage(big, 'box'))).toMatch(/en çok 4/);
    const r = run(setup(), cage(big, 'cage'));
    expect(zone(r.state)?.cage).toBe('bars');
    expect(zone(r.state)?.hexes).toHaveLength(5);
    expect(cageBoxBlock(r.state, { col: 1, row: 3 }, { col: 6, row: 3 })).toBeNull();
    const twenty = [...Array(15).keys()].map((c) => ({ col: c, row: 1 })).concat([...Array(5).keys()].map((c) => ({ col: c, row: 2 })));
    expect(err(setup(), cage(twenty, 'cage'))).toMatch(/en çok 19/);
  });
  it('kenar durumlar: iki parça, menzil, duvar arkasında ilk altıgen reddedilir', () => {
    const s = setup();
    expect(err(s, cage([{ col: 6, row: 3 }, { col: 9, row: 3 }]))).toMatch(/tek parça/);
    const walled = { ...s, map: { ...(s.map as NonNullable<BattleState['map']>), tiles: (s.map?.tiles ?? []).map((row) => `${row.slice(0, 3)}s${row.slice(4)}`) } };
    expect(err(walled, cage([{ col: 6, row: 3 }]))).toMatch(/görülemiyor/);
  });
  it('sürüm 48: K62 ön ayarı aynen (targetHexes yok sayılır; kutu = hedef + 3 komşu)', () => {
    const r = run(setup(48), cage([{ col: 6, row: 3 }], 'box'));
    expect(zone(r.state)?.hexes).toHaveLength(4);
    const bars = run(setup(48), cage([{ col: 6, row: 3 }], 'cage'));
    expect(zone(bars.state)?.hexes).toHaveLength(19);
  });
  it('önizleme ve sayaç seçime göre (kutu 4, kafes 19)', () => {
    const s = setup();
    const act = { kind: 'spell' as const, spell: SP('Forcecage') };
    expect(areaPointCount(s, act, 'box')).toBe(4);
    expect(areaPointCount(s, act, 'cage')).toBe(19);
    const pv = areaActPreview(s, s.combatants.A as Combatant, act, null, null, [{ col: 6, row: 3 }, { col: 7, row: 3 }], 'box');
    expect(pv.foes.map((c) => c.id).sort()).toEqual(['F0', 'F1']);
  });
});

describe('K65b yapay zekâ (Forcecage)', () => {
  it('en güçlü düşmanı ve bitişik düşmanı dostsuz kutuya alır; dost bitişikse onu kapsamaz', () => {
    const parts = [wiz(), foe('F0', { hp: 250, maxHp: 250 }), foe('F1'), foe('F2'), mk('P', { ownerId: 'p1', hp: 30, maxHp: 30 })];
    const s = setup(49, parts, { ...POS, P: { col: 6, row: 4 } });
    const fs = freeShapeOf(s, SP('Forcecage'))!;
    const shape = cageAim(s, s.combatants.A as Combatant, SP('Forcecage'), freeShapeFor(fs, 'box'), s.combatants.F0 as Combatant, ['F0', 'F1', 'F2'].map((id) => s.combatants[id] as Combatant))!;
    expect(shape.map((h) => `${h.col},${h.row}`).sort()).toEqual(['6,3', '7,3']);
    expect(connected(shape)).toBe(true);
    const t0 = performance.now();
    const cmd = chooseCommand(s);
    const ms = performance.now() - t0;
    expect(cmd).toMatchObject({ type: 'cast_spell', spellName: 'Forcecage', choice: 'box' });
    expect(cmd.type === 'cast_spell' && cmd.targetHexes?.some((h) => h.col === 6 && h.row === 4)).toBe(false);
    expect(ms).toBeLessThan(5000);
  });
});

describe('K65b Wind Wall yolu (seçici ve motor aynı denetim)', () => {
  it('yol yalnızca son altıgene bitişik uzar; bitişik olmayan ve tekrar reddedilir; motor aynı iletiyi verir', () => {
    const s = setup();
    const me = s.combatants.A as Combatant;
    const ww = SP('Wind Wall');
    const path = [{ col: 4, row: 2 }, { col: 4, row: 3 }];
    expect(pathAddProblem(s, me, ww, path, 10, { col: 4, row: 4 })).toBeNull();
    expect(pathAddProblem(s, me, ww, path, 10, { col: 4, row: 1 })).toMatch(/son altıgene bitişik/);
    expect(pathProblem(s, me, ww, [...path, { col: 4, row: 2 }], 10)).toMatch(/iki kez/);
    const r = execute(s, { type: 'cast_spell', actorId: 'A', spellName: 'Wind Wall', targetHex: path[0] as Offset, targetHexes: [path[0] as Offset, { col: 6, row: 2 }] }, P1, seededRng(1));
    expect(!r.ok && r.error).toMatch(/bitişik olmalı/);
    const ok = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Wind Wall', targetHex: path[0] as Offset, targetHexes: [...path, { col: 4, row: 4 }] });
    expect(ok.state.map?.zones?.some((z) => z.spellId === ww.id && z.hexes.length === 3)).toBe(true);
    const act = { kind: 'spell' as const, spell: ww };
    expect(areaActPreview(s, me, act, null, null, [{ col: 4, row: 2 }, { col: 7, row: 2 }]).error).toMatch(/bitişik olmalı/);
  });
});
