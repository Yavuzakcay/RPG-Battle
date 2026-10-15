/** İtme (Shove) ve zorunlu hareket (SRD 5.2.1 s. 191 Unarmed Strike; s. 182 Falling). */
import { describe, it, expect } from 'vitest';
import { combatantFromMonster, execute, startBattle } from './index';
import type { BattleEvent, BattleState, Combatant, Command } from './index';
import { getMonster } from '../data';
import type { Offset } from '../rules/hex';
import { chooseCommand } from './ai';
import { pushOutcome, shoveDc, shoveHex } from './forced';
import { GM, P1, mk, scripted, sword, zero } from './fixtures';

const o = (col: number, row: number): Offset => ({ col, row });
function board(fill: string, patch: Array<[Offset, string]> = []): string[] {
  const rows = Array.from({ length: 7 }, () => fill.repeat(15).split(''));
  for (const [h, ch] of patch) (rows[h.row] as string[])[h.col] = ch;
  return rows.map((r) => r.join(''));
}
/** Sıra listedeki ilk savaşçıda. */
function field(mapId: string, parts: Combatant[], positions: Record<string, Offset>, tiles: string[], options?: string[]): BattleState {
  const { state } = startBattle('f', 'd-z-zemin', parts.map((c) => ({ ...c, initiativeBonus: 0 })), scripted(...parts.map((_, i) => [20, 20 - i] as [number, number])),
    { map: { id: mapId, ...(options ? { options } : {}) } });
  const combatants = { ...state.combatants };
  for (const [id, pos] of Object.entries(positions)) combatants[id] = { ...(combatants[id] as Combatant), pos };
  return { ...state, status: 'active', combatants, map: { ...(state.map as NonNullable<BattleState['map']>), tiles } };
}
const A = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, modifiers: { ...zero, str: 3 }, ...p });
const B = (p: Partial<Combatant> = {}) => mk('B', { side: 'enemies', hp: 30, maxHp: 30, ...p });
const ctx = (s: BattleState, id: string) => (s.combatants[id]?.side === 'enemies' ? GM : P1);
const run = (s: BattleState, cmd: Command, rng = scripted([20, 2], ...Array.from({ length: 20 }, () => [6, 3] as [number, number]))) => {
  const r = execute(s, cmd, ctx(s, 'actorId' in cmd ? cmd.actorId : ''), rng);
  if (!r.ok) throw new Error(r.error);
  return r;
};
const err = (s: BattleState, cmd: Command) => {
  const r = execute(s, cmd, ctx(s, 'actorId' in cmd ? cmd.actorId : ''), scripted([20, 2]));
  return r.ok ? null : r.error;
};
const shove = (effect: 'push' | 'prone' = 'push', targetId = 'B'): Command => ({ type: 'shove', actorId: 'A', targetId, effect });
/** A (5,3) → B (6,3); itilecek altıgen eksenin devamı. */
const behind = () => shoveHex({ ...A(), pos: o(5, 3) }, { ...B(), pos: o(6, 3) }) as Offset;
const types = (events: BattleEvent[]) => events.map((e) => e.type).filter((t) => t !== 'action_used');

describe('Shove: kural ve save', () => {
  it('DC = 8 + STR + yetkinlik; hedef STR ve DEX save\'inden yükseğini seçer', () => {
    const s = field('kale', [A(), B({ saves: { ...zero, dex: 4 } })], { A: o(5, 3), B: o(6, 3) }, board('.'));
    expect(shoveDc(s.combatants.A as Combatant)).toBe(13);
    const r = run(s, shove('prone'));
    expect(r.events[0]).toMatchObject({ type: 'shove_resolved', ability: 'dex', dc: 13, natural: 2, total: 6, success: false, effect: 'prone' });
    expect(r.state.combatants.B?.conditions).toContain('Prone');
    const ok = run(s, shove('prone'), scripted([20, 15]));
    expect(ok.events[0]).toMatchObject({ success: true });
    expect(ok.state.combatants.B?.conditions).not.toContain('Prone');
  });
  it('itme: hedef eksen yönünde 5 ft gider; yalnızca bitişik hedef', () => {
    const s = field('kale', [A(), B()], { A: o(5, 3), B: o(6, 3) }, board('.'));
    const r = run(s, shove());
    expect(r.state.combatants.B?.pos).toEqual(behind());
    expect(types(r.events)).toEqual(['shove_resolved', 'pushed']);
    const far = field('kale', [A(), B()], { A: o(3, 3), B: o(6, 3) }, board('.'));
    expect(err(far, shove())).toBe('İtmek için hedef bitişik olmalı (5 ft).');
  });
  it('boyut sınırı: en çok bir boyut büyük hedef', () => {
    const ogre = combatantFromMonster(getMonster('ogre'), { id: 'B' });
    const giant = combatantFromMonster(getMonster('hill-giant'), { id: 'B' });
    expect(ogre.size).toBe('L');
    expect(giant.size).toBe('H');
    const s = field('kale', [A(), { ...giant, side: 'enemies' }], { A: o(5, 3), B: o(6, 3) }, board('.'));
    expect(err(s, shove())).toContain('itilemeyecek kadar büyük');
    const ok = field('kale', [A(), ogre], { A: o(5, 3), B: o(6, 3) }, board('.'));
    expect(err(ok, shove('prone'))).toBe(null);
  });
  it('Attack eylemindeki bir saldırının yerine geçer (Extra Attack: itme + saldırı)', () => {
    let s = field('kale', [A({ attacksPerAction: 2 }), B()], { A: o(5, 3), B: o(6, 3) }, board('.'));
    s = run(s, shove('prone')).state;
    expect(s.combatants.A?.economy).toMatchObject({ action: true, attacksLeft: 1 });
    s = run(s, { type: 'attack', actorId: 'A', targetId: 'B', option: sword }, scripted([20, 15], [8, 4])).state;
    expect(err(s, shove('prone'))).toBe('Eylem bu tur kullanıldı.');
  });
});

describe('itme: engel ve zorunlu hareket', () => {
  it('arkada duvar, yaratık, harita dışı ya da yüksek zemin varsa itilmez; Prone kalır', () => {
    for (const [patch, extra] of [[[[behind(), 's']], {}], [[[behind(), 'h']], {}]] as Array<[Array<[Offset, string]>, object]>) {
      const s = field('kale', [A(), B()], { A: o(5, 3), B: o(6, 3), ...extra }, board('.', patch));
      expect(err(s, shove())).toMatch(/İtilemez .*yalnızca yere düşürülebilir/);
      expect(err(s, shove('prone'))).toBe(null);
    }
    const crowd = field('kale', [A(), B(), mk('C', { side: 'enemies' })], { A: o(5, 3), B: o(6, 3), C: behind() }, board('.'));
    expect(err(crowd, shove())).toContain('arkada C var');
    const edge = field('kale', [A(), B()], { A: o(13, 3), B: o(14, 3) }, board('.'));
    expect(err(edge, shove())).toContain('harita dışı');
  });
  it('lava itilen ölür; uçan etkilenmez', () => {
    const s = field('volkan', [A(), B()], { A: o(5, 3), B: o(6, 3) }, board('.', [[behind(), '~']]));
    const r = run(s, shove());
    expect(types(r.events)).toEqual(['shove_resolved', 'pushed', 'fell_into_lava', 'battle_finished']);
    expect(r.state.combatants.B?.life).toBe('dead');
    const fly = field('volkan', [A(), B({ fly: 30 })], { A: o(5, 3), B: o(6, 3) }, board('.', [[behind(), '~']]));
    const f = run(fly, shove());
    expect(f.state.combatants.B?.hp).toBe(30);
    expect(f.state.combatants.B?.pos).toEqual(behind());
  });
  it('bataklığa itilen saplanır (batma sayacı, zehir)', () => {
    const s = field('bataklik', [A(), B()], { A: o(5, 3), B: o(6, 3) }, board('.', [[behind(), 'b']]));
    const r = run(s, shove());
    expect(r.events.some((e) => e.type === 'map_effect' && e.rule === 'bog')).toBe(true);
    expect(r.state.combatants.B?.mapStatus.sink).toBeGreaterThan(0);
  });
  it('alçak altıgene itilen düşer (10 ft = 1d6, Prone); uçuruma itilen 30 ft düşer', () => {
    const s = field('dag', [A(), B()], { A: o(5, 3), B: o(6, 3) }, board('h', [[behind(), '.']]));
    expect(pushOutcome(s, s.combatants.B as Combatant, o(6, 3), behind())).toMatchObject({ ok: true, kind: 'fall', fallFeet: 10 });
    const r = run(s, shove());
    const fall = r.events.find((e) => e.type === 'map_effect' && e.rule === 'fall');
    expect(fall).toMatchObject({ text: '10 ft düştü', damage: { rolls: [3], applied: 3, type: 'bludgeoning' }, addCondition: 'Prone' });
    expect(r.state.combatants.B?.hp).toBe(27);
    const chasm = field('dag', [A(), B()], { A: o(5, 3), B: o(6, 3) }, board('.', [[behind(), 'u']]));
    const c = run(chasm, shove());
    expect(c.events.find((e) => e.type === 'map_effect' && e.rule === 'fall')).toMatchObject({ text: '30 ft düştü', damage: { rolls: [3, 3, 3] } });
  });
  it('zorunlu hareket fırsat saldırısı tetiklemez', () => {
    // B'nin yanında partiden C (yakın dövüşçü) var; B itilip C'nin erişiminden çıkar.
    const s = field('kale', [A(), B(), mk('C', { ownerId: 'p1', weaponOptions: [sword] })], { A: o(5, 3), B: o(6, 3), C: o(6, 2) }, board('.'));
    const r = run(s, shove());
    expect(r.events.some((e) => e.type === 'attack_resolved')).toBe(false);
    expect(r.state.combatants.C?.economy.reaction).toBe(false);
  });
  it('haritasız savaşta itme yalnızca Prone uygular', () => {
    const { state } = startBattle('m', 'd-z-zemin', [A(), B()], scripted([20, 20], [20, 1]));
    const r = run(state, shove('push'));
    expect(r.events[0]).toMatchObject({ type: 'shove_resolved', effect: 'prone', success: false });
    expect(r.state.combatants.B?.conditions).toContain('Prone');
  });
});

describe('büyüyle itme ve yapay zekâ', () => {
  it('Thunderwave başarısız save\'de 10 ft (2 altıgen) uzağa iter; lavda durur ve ölür', () => {
    const wiz = A({ spellNames: ['Thunderwave'], spellSlots: [2, 0, 0, 0, 0, 0, 0, 0, 0], spellSaveDc: 30 });
    const s = field('kale', [wiz, B()], { A: o(5, 3), B: o(6, 3) }, board('.'));
    const r = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Thunderwave', targetHex: o(6, 3) },
      scripted(...Array.from({ length: 4 }, () => [8, 4] as [number, number]), [20, 2], [6, 3]));
    const pushes = r.events.filter((e) => e.type === 'pushed');
    expect(pushes).toHaveLength(2);
    expect(r.state.combatants.B?.pos?.col).toBe(8);
    const lava = field('volkan', [wiz, B()], { A: o(5, 3), B: o(6, 3) }, board('.', [[behind(), '~']]));
    const l = run(lava, { type: 'cast_spell', actorId: 'A', spellName: 'Thunderwave', targetHex: o(6, 3) },
      scripted(...Array.from({ length: 4 }, () => [8, 4] as [number, number]), [20, 2]));
    expect(l.state.combatants.B?.life).toBe('dead');
  });
  it('düşman, arkası lav olan bitişik hedefi iter; arkası güvenliyse saldırır', () => {
    const ogre = combatantFromMonster(getMonster('ogre'), { id: 'O' });
    const hero = mk('H', { ownerId: 'p1', hp: 30, maxHp: 30 });
    const to = shoveHex({ ...ogre, pos: o(5, 3) }, { ...hero, pos: o(6, 3) }) as Offset;
    const lava = field('volkan', [ogre, hero], { O: o(5, 3), H: o(6, 3) }, board('.', [[to, '~']]));
    expect(chooseCommand(lava)).toEqual({ type: 'shove', actorId: 'O', targetId: 'H', effect: 'push' });
    const safe = field('volkan', [ogre, hero], { O: o(5, 3), H: o(6, 3) }, board('.'));
    expect(chooseCommand(safe).type).not.toBe('shove');
  });
  it('bataklık haritasında (gerçek zemin) iki taraf da bitişik hedefi bataklığa iter', () => {
    const { state } = startBattle('b', 'd-z-zemin', [], scripted(), { map: { id: 'bataklik' } });
    const tiles = state.map?.tiles as string[];
    // Gerçek haritada arkası `b` olan bir dizilim bul: saldıran ve hedef `b` olmayan altıgende.
    let found: { a: Offset; t: Offset; to: Offset } | null = null;
    for (let row = 0; row < 7 && !found; row++) {
      for (let col = 0; col < 14 && !found; col++) {
        const a = o(col, row);
        const t = o(col + 1, row);
        const ok = (h: Offset) => '.pn'.includes(tiles[h.row]?.[h.col] ?? '#');
        const to = shoveHex({ ...A(), pos: a }, { ...B(), pos: t });
        if (to && ok(a) && ok(t) && tiles[to.row]?.[to.col] === 'b') found = { a, t, to };
      }
    }
    expect(found).not.toBe(null);
    const f = found as { a: Offset; t: Offset; to: Offset };
    const ogre = combatantFromMonster(getMonster('ogre'), { id: 'O' });
    const hero = mk('H', { ownerId: 'p1', hp: 30, maxHp: 30 });
    const enemy = field('bataklik', [ogre, hero], { O: f.a, H: f.t }, tiles);
    expect(pushOutcome(enemy, enemy.combatants.H as Combatant, f.t, f.to)).toMatchObject({ ok: true, kind: 'bog' });
    expect(chooseCommand(enemy)).toEqual({ type: 'shove', actorId: 'O', targetId: 'H', effect: 'push' });
    const r = run(enemy, { type: 'shove', actorId: 'O', targetId: 'H', effect: 'push' });
    expect(r.state.combatants.H?.pos).toEqual(f.to);
    expect(r.state.combatants.H?.conditions).toContain('Poisoned');
    expect(r.state.combatants.H?.mapStatus.sink).toBe(1);
    const fighter = A({ modifiers: { ...zero, str: 4 }, proficiency: 3, weaponOptions: [sword] });
    const wolf = combatantFromMonster(getMonster('wolf'), { id: 'B' });
    const party = field('bataklik', [fighter, wolf], { A: f.a, B: f.t }, tiles);
    expect(chooseCommand(party)).toEqual({ type: 'shove', actorId: 'A', targetId: 'B', effect: 'push' });
  });
  it('parti de aynı kuralla iter (arkası uçurum)', () => {
    const fighter = A({ modifiers: { ...zero, str: 4 }, proficiency: 3, weaponOptions: [sword] });
    const wolf = combatantFromMonster(getMonster('wolf'), { id: 'B' });
    const to = shoveHex({ ...fighter, pos: o(5, 3) }, { ...wolf, pos: o(6, 3) }) as Offset;
    const s = field('dag', [fighter, wolf], { A: o(5, 3), B: o(6, 3) }, board('.', [[to, 'u']]));
    expect(chooseCommand(s)).toEqual({ type: 'shove', actorId: 'A', targetId: 'B', effect: 'push' });
  });
});
