/**
 * Kuyruk K65c (kural sürümü 49, K65a/b ile aynı): panelli duvarlar (Wall of Stone, Wall of Ice, Wall of Force) serbest
 * panel yolu. Yol Wind Wall seçicisiyle aynı (yalnız uca bitişik uzar), bütçe 10 panel × 2 altıgen = 20; her altıgen
 * menzilde, ilk altıgen görüşte. Panel canı K62/K19 gibi altıgen başına. `run` replay'i denetler.
 */
import { describe, expect, it } from 'vitest';
import { spells } from '../data';
import { chooseCommand } from './ai';
import { mk, P1 } from './fixtures';
import { pathAddProblem, pathProblem, wallAim } from './freeShape';
import { execute } from './index';
import { caster, field, run } from './k19spells.test';
import { panelDamageEvents, panelId, panelOf, panelStats } from './walls';
import { applyEvents } from './reduce';
import { areaActPreview, areaPointCount } from '../ui/hud';
import { mechanicsAt } from './spellVersion';
import { seededRng } from '../rules/dice';
import type { Offset } from '../rules/hex';
import type { BattleState, Combatant, Command, SpellZone } from './types';

const SP = (n: string) => spells.find((s) => s.name === n) as NonNullable<(typeof spells)[number]>;
const WALLS = ['Wall of Stone', 'Wall of Ice', 'Wall of Force'];
const SLOTS = [4, 3, 3, 3, 3, 2, 2, 1, 1];
const wiz = (p: Partial<Combatant> = {}) => caster({ spellNames: WALLS, spellSlots: SLOTS, concentration: null, hp: 300, maxHp: 300, ...p });
const foe = (id: string, p: Partial<Combatant> = {}) => mk(id, { side: 'enemies', hp: 200, maxHp: 200, ...p });
const POS = { A: { col: 1, row: 3 }, F0: { col: 9, row: 2 }, F1: { col: 10, row: 4 } };
const setup = (ver = 49, parts: Combatant[] = [wiz(), foe('F0'), foe('F1')], pos: Record<string, Offset> = POS) => field(parts, pos, ver);
const PATH: Offset[] = [{ col: 5, row: 1 }, { col: 5, row: 2 }, { col: 5, row: 3 }, { col: 6, row: 3 }, { col: 6, row: 4 }, { col: 6, row: 5 }];
const wall = (name: string, path: Offset[], extra: Record<string, unknown> = {}): Command => ({ type: 'cast_spell', actorId: 'A', spellName: name, targetHex: path[0] as Offset, targetHexes: path, ...extra } as Command);
const zoneOf = (s: BattleState, id: string): SpellZone => (s.map?.zones ?? []).find((z) => z.spellId === id) as SpellZone;
const err = (s: BattleState, cmd: Command) => { const r = execute(s, cmd, P1, seededRng(1)); return r.ok ? null : r.error; };

describe('K65c veri ve sürüm', () => {
  it('sürüm 49\'da üç duvarda 20 altıgenlik yol (10 panel × 2), menzil her altıgende, görüş ilkinde; 48\'de yok', () => {
    for (const n of WALLS) {
      expect(mechanicsAt(setup(), SP(n))).toMatchObject({ wallPath: 20, pathRules: { rangeAll: true, sightFirst: true } });
      expect(mechanicsAt(setup(48), SP(n)).pathRules).toBeUndefined();
    }
  });
});

describe('K65c serbest panel yolu', () => {
  it('Wall of Stone: yol bitişik altıgenlerden; her altıgen ayrı panel (AC 15, 90 HP); panel kimliği yol altıgeninden', () => {
    const r = run(setup(), wall('Wall of Stone', PATH));
    const z = zoneOf(r.state, 'wall-of-stone');
    expect(z.hexes).toEqual(PATH);
    expect(panelStats(z)).toMatchObject({ hp: 90, ac: 15 });
    for (const h of PATH) expect(panelOf(r.state, panelId(z, h))?.hex).toEqual(h);
    // Bir panel kırılınca yalnızca o altıgen düşer, öteki kimlikler aynı.
    const broken = applyEvents(r.state, panelDamageEvents(r.state, z, PATH[2] as Offset, 999, 'bludgeoning'));
    const z2 = zoneOf(broken, 'wall-of-stone');
    expect(z2.hexes).toHaveLength(5);
    expect(panelOf(broken, panelId(z2, PATH[3] as Offset))?.hex).toEqual(PATH[3]);
    expect(panelOf(broken, panelId(z2, PATH[2] as Offset))).toBeNull();
  });
  it('Wall of Ice: panel AC 12 / 30 HP, Fire iki kat, Cold bağışık (K62 aynen); Wall of Force: panel yok (hasara bağışık)', () => {
    const ice = run(setup(), wall('Wall of Ice', PATH, { slotLevel: 6 }));
    const zi = zoneOf(ice.state, 'wall-of-ice');
    expect(zi.hexes).toEqual(PATH);
    expect(panelStats(zi)).toMatchObject({ hp: 30, ac: 12, immune: ['cold', 'poison', 'psychic'], vuln: ['fire'] });
    expect(panelDamageEvents(ice.state, zi, PATH[0] as Offset, 99, 'cold')).toEqual([]);
    const force = run(setup(), wall('Wall of Force', PATH));
    const zf = zoneOf(force.state, 'wall-of-force');
    expect(zf.hexes).toEqual(PATH);
    expect(panelOf(force.state, panelId(zf, PATH[0] as Offset))).toBeNull();
  });
  it('kenar durumlar: 21 altıgen, bitişik olmayan, tekrar, duvar arkasında ilk altıgen reddedilir; ilk altıgen görülüyorsa duvar ardına uzanır', () => {
    const s = setup();
    const long = [...Array(15).keys()].map((c) => ({ col: c, row: 0 })).concat([...Array(6).keys()].map((r) => ({ col: 14, row: r + 1 })));
    expect(err(s, wall('Wall of Stone', long))).toMatch(/en çok 20/);
    expect(err(s, wall('Wall of Stone', [{ col: 5, row: 1 }, { col: 7, row: 1 }]))).toMatch(/bitişik olmalı/);
    expect(err(s, wall('Wall of Stone', [{ col: 5, row: 1 }, { col: 5, row: 2 }, { col: 5, row: 1 }]))).toMatch(/iki kez/);
    const walled = { ...s, map: { ...(s.map as NonNullable<BattleState['map']>), tiles: (s.map?.tiles ?? []).map((row) => `${row.slice(0, 3)}s${row.slice(4)}`) } };
    expect(err(walled, wall('Wall of Stone', [{ col: 5, row: 2 }, { col: 5, row: 3 }]))).toMatch(/görülemiyor/);
    expect(err(walled, wall('Wall of Stone', [{ col: 2, row: 2 }, { col: 2, row: 1 }]))).toBeNull();
    // Her altıgen menzilde (saf doğrulayıcı, 20 ft menzilli kopya).
    const short = { ...SP('Wall of Stone'), rangeFt: 20 };
    expect(pathProblem(s, s.combatants.A as Combatant, short, [{ col: 4, row: 3 }, { col: 5, row: 3 }, { col: 6, row: 3 }], 20, { rangeAll: true, sightFirst: true })).toMatch(/menzil dışında/);
    expect(pathAddProblem(s, s.combatants.A as Combatant, SP('Wall of Stone'), PATH.slice(0, 2), 20, { col: 6, row: 1 })).toMatch(/son altıgene bitişik/);
  });
  it('sürüm 49\'da düz duvar hâlâ yapılır (yol seçilmezse); sürüm 48\'de targetHexes yok sayılır (K62 düz duvar)', () => {
    const straight = run(setup(), { type: 'cast_spell', actorId: 'A', spellName: 'Wall of Stone', targetHex: { col: 6, row: 3 } } as Command);
    expect(zoneOf(straight.state, 'wall-of-stone').hexes.length).toBeGreaterThan(6);
    const old = run(setup(48), wall('Wall of Stone', PATH));
    expect(zoneOf(old.state, 'wall-of-stone').hexes).not.toEqual(PATH);
  });
  it('seçici: sayaç yalnızca "Yol"da 20; önizleme motorun iletisini verir', () => {
    const s = setup();
    const act = { kind: 'spell' as const, spell: SP('Wall of Ice') };
    expect(areaPointCount(s, act, null, 'line')).toBe(1);
    expect(areaPointCount(s, act, null, 'path')).toBe(20);
    expect(areaActPreview(s, s.combatants.A as Combatant, act, null, null, [{ col: 5, row: 1 }, { col: 8, row: 1 }]).error).toMatch(/bitişik olmalı/);
  });
});

describe('K65c yapay zekâ', () => {
  it('düşman grubuyla arasına dostsuz, yaratıksız bitişik yol; komut geçerli ve karar sürer ölçülür', () => {
    const parts = [wiz({ spellNames: ['Wall of Stone'] }), foe('F0'), foe('F1'), mk('P', { ownerId: 'p1', hp: 30, maxHp: 30 })];
    const s = setup(49, parts, { A: { col: 1, row: 3 }, F0: { col: 6, row: 2 }, F1: { col: 6, row: 4 }, P: { col: 1, row: 1 } });
    const path = wallAim(s, s.combatants.A as Combatant, SP('Wall of Stone'), 20, { rangeAll: true, sightFirst: true }, ['F0', 'F1'].map((id) => s.combatants[id] as Combatant))!;
    expect(path.length).toBeGreaterThanOrEqual(4);
    expect(pathProblem(s, s.combatants.A as Combatant, SP('Wall of Stone'), path, 20, { rangeAll: true, sightFirst: true })).toBeNull();
    const occupied = Object.values(s.combatants).flatMap((c) => (c.pos ? [`${c.pos.col},${c.pos.row}`] : []));
    expect(path.some((h) => occupied.includes(`${h.col},${h.row}`))).toBe(false);
    const t0 = performance.now();
    const cmd = chooseCommand(s);
    const ms = performance.now() - t0;
    expect(cmd).toMatchObject({ type: 'cast_spell', spellName: 'Wall of Stone' });
    expect(cmd.type === 'cast_spell' && (cmd.targetHexes?.length ?? 0)).toBeGreaterThanOrEqual(4);
    expect(ms).toBeLessThan(5000);
  });
});
