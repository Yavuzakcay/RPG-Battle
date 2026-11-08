/**
 * Kuyruk K67b (kural sürümü 51): loş ışık ikinci parça. Dancing Lights dört ışık ve birleşik biçim (20 ft bağ, menzil,
 * bonus eylemle taşıma, menzil dışında sönme), Moonbeam / Starry Wisp / Fire Shield / Flame Blade / Produce Flame /
 * Flaming Sphere / Shining Smite ışıkları, Conjure Celestial silindiri, harita ışıkları (meşale, mangal), Blindsight ve
 * Truesight ile Algı, yapay zekâ ışık kuralı (`k67:isik`), sürüm 50 davranışı. `run` replay'i denetler.
 */
import { describe, expect, it } from 'vitest';
import { spells } from '../data';
import { mk, P1 } from './fixtures';
import { execute, replay, startBattle } from './index';
import { lightLevelAt, litHexes, perceivedLevel } from './maprules';
import { distance } from '../rules/hex';
import { passivePerception } from './stealth';
import { mechanicsAt } from './spellVersion';
import { danceAddProblem, danceProblem } from './danceLights';
import { chooseCommand } from './ai';
import { seededRng } from '../rules/dice';
import type { Offset } from '../rules/hex';
import type { ActiveEffect, BattleEvent, BattleState, Combatant, Command, SpellZone } from './types';

const SP = (n: string) => spells.find((s) => s.name === n) as NonNullable<(typeof spells)[number]>;
const SLOTS = [4, 3, 3, 3, 3, 2, 2, 1, 1];
/** Karanlık zindan (`dungeon` `mesale`, karanlık kuralı açık), `cols`×`rows` düz zemin, harita ışığı yok. */
function dark(parts: Combatant[], pos: Record<string, Offset>, ver = 51, cols = 15, rows = 7): BattleState {
  const s = startBattle('k67b', 'k67b', parts, () => 0.5, { kuralSurumu: ver, map: { id: 'dungeon', variantId: 'mesale' } } as never).state;
  const combatants = { ...s.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return { ...s, status: 'active', order: parts.map((c) => c.id), turnIndex: 0, combatants,
    map: { ...(s.map as NonNullable<BattleState['map']>), options: ['darkness'], tiles: Array.from({ length: rows }, () => '.'.repeat(cols)) } };
}
const run = (s: BattleState, cmd: Command, seed = 3) => {
  const r = execute(s, cmd, P1, seededRng(seed));
  if (!r.ok) throw new Error(r.error);
  expect(replay([{ type: 'battle_started', state: s }, ...r.events] as BattleEvent[])).toEqual(r.state);
  return r;
};
const tryRun = (s: BattleState, cmd: Command) => execute(s, cmd, P1, seededRng(3));
const fx = (id: string, p: Partial<ActiveEffect>): ActiveEffect => ({ id, name: id, sourceId: 'A', ...p });
const wiz = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', spellNames: ['Dancing Lights', 'Moonbeam', 'Starry Wisp', 'Fire Shield', 'Flame Blade', 'Produce Flame', 'Light'], spellSlots: SLOTS,
  spellSaveDc: 30, spellAttack: 30, spellMod: 5, casterTag: 'wizard', hp: 200, maxHp: 200, ...p });
const H = (col: number, row = 3): Offset => ({ col, row });
const dl = (s: BattleState) => s.map?.zones?.find((z) => z.spellId === 'dancing-lights') as SpellZone;
const DL = (pts: Offset[], extra: Partial<Extract<Command, { type: 'cast_spell' }>> = {}): Command =>
  ({ type: 'cast_spell', actorId: 'A', spellName: 'Dancing Lights', targetHex: pts[0], targetHexes: pts, ...extra } as Command);

describe('K67b veri', () => {
  it('sürüm 51 ışıkları SRD metninden; sürüm 50 eski', () => {
    const s51 = { kuralSurumu: 51 }; const s50 = { kuralSurumu: 50 };
    expect(mechanicsAt(s51, SP('Dancing Lights'))).toMatchObject({ lightPoints: 4, zone: { lightDim: 2 } });
    expect(mechanicsAt(s51, SP('Dancing Lights')).zone?.light).toBeUndefined();
    expect(mechanicsAt(s50, SP('Dancing Lights'))).toMatchObject({ zone: { light: 2 } });
    expect(mechanicsAt(s50, SP('Dancing Lights')).lightPoints).toBeUndefined();
    expect(mechanicsAt(s51, SP('Moonbeam')).zone).toMatchObject({ lightDim: 0, heightFt: 40 });
    expect(mechanicsAt(s51, SP('Starry Wisp')).afterHit).toMatchObject({ lightDim: 2, revealed: true });
    expect(mechanicsAt(s51, SP('Starry Wisp')).afterHit?.light).toBeUndefined();
    expect(mechanicsAt(s51, SP('Fire Shield')).effect).toMatchObject({ light: 2, lightDim: 2 });
    expect(mechanicsAt(s51, SP('Flame Blade'))).toMatchObject({ selfLight: 2, selfLightDim: 2 });
    expect(mechanicsAt(s51, SP('Produce Flame'))).toMatchObject({ selfLight: 4, selfLightDim: 4 });
    expect(mechanicsAt(s51, SP('Flaming Sphere')).zone).toMatchObject({ light: 4, lightDim: 4 });
    expect(mechanicsAt(s51, SP('Shining Smite')).wardLight).toBe(1);
    expect(mechanicsAt(s50, SP('Shining Smite')).wardLight).toBeUndefined();
  });
});

describe('K67b Dancing Lights', () => {
  it('dört ayrı ışık: her biri 10 ft loş, parlak yok; replay aynı', () => {
    const r = run(dark([wiz()], { A: H(0) }), DL([H(3), H(6), H(9), H(12)]));
    const z = dl(r.state);
    expect(z.hexes).toHaveLength(4);
    expect(lightLevelAt(r.state, H(3))).toBe('dim');
    expect(lightLevelAt(r.state, H(12, 5))).toBe('dim');
    expect([...Array(15).keys()].some((c) => lightLevelAt(r.state, H(c)) === 'bright')).toBe(false);
    expect(lightLevelAt(r.state, H(6, 0))).toBe('dark');
    expect(litHexes(r.state).has('9,1')).toBe(true);
  });
  it('20 ft bağı: başka bir ışığın 20 ft içinde olmayan ışık reddedilir (motor ve seçici aynı ileti)', () => {
    const s = dark([wiz()], { A: H(0) });
    const bad = tryRun(s, DL([H(2), H(3), H(11)]));
    expect(bad.ok).toBe(false);
    const msg = bad.ok ? '' : bad.error;
    expect(msg).toContain('20 ft');
    expect(danceProblem(s, s.combatants.A as Combatant, SP('Dancing Lights'), [H(2), H(3), H(11)])).toBe(msg);
    expect(danceAddProblem(s, s.combatants.A as Combatant, SP('Dancing Lights'), [H(2), H(3)], H(11))).toBe(msg);
    expect(danceAddProblem(s, s.combatants.A as Combatant, SP('Dancing Lights'), [H(2), H(3)], H(7))).toBeNull();
    // Beşinci ışık yok; aynı altıgende iki ışık yok.
    expect(tryRun(s, DL([H(2), H(3), H(4), H(5), H(6)])).ok).toBe(false);
    expect(tryRun(s, DL([H(2), H(2)])).ok).toBe(false);
  });
  it('menzil 120 ft: menzil dışındaki ışık reddedilir; büyücü uzaklaşınca menzil dışına çıkan ışık söner', () => {
    const s = dark([wiz(), mk('B', { side: 'enemies' })], { A: H(4), B: H(30, 0) }, 51, 31, 7);
    const far = tryRun(s, DL([H(29)]));
    expect(far.ok ? '' : far.error).toContain('menzil');
    const r = run(s, DL([H(24), H(28)]));
    // Büyücü geri çekilmiş gibi (yer doğrudan değişir); bir sonraki komutta 28'deki ışık menzil dışı (28 altıgen > 24).
    const moved = { ...r.state, combatants: { ...r.state.combatants, A: { ...(r.state.combatants.A as Combatant), pos: H(0, 3), movementUsed: 0 } } };
    const r2 = run(moved, { type: 'move', actorId: 'A', to: H(0, 2) } as Command);
    expect(dl(r2.state).hexes).toEqual([H(24)]);
    expect(r2.events.some((e) => e.type === 'zone_moved')).toBe(true);
  });
  it('birleşik biçim: tek ışık, adı "(birleşik)", 10 ft loş', () => {
    const r = run(dark([wiz()], { A: H(0) }), DL([H(7), H(8)], { choice: 'birlesik' }));
    const z = dl(r.state);
    expect(z.hexes).toEqual([H(7)]);
    expect(z.name).toBe('Dancing Lights (birleşik)');
    expect(lightLevelAt(r.state, H(9))).toBe('dim');
    expect(lightLevelAt(r.state, H(10))).toBe('dark');
  });
  it('bonus eylemle taşıma: hepsi birlikte ötelenir ya da ayrı ayrı; 60 ft sınırı; sürüm 50 tek nokta', () => {
    const r = run(dark([wiz(), mk('E', { side: 'enemies' })], { A: H(0), E: H(14, 6) }), DL([H(3), H(5)]));
    const tr = run(r.state, { type: 'spell_followup', actorId: 'A', targetId: 'A', targetHex: H(8) } as Command);
    expect(dl(tr.state).hexes).toEqual([H(8), H(10)]);
    expect((tr.state.combatants.A as Combatant).economy.bonus).toBe(true);
    expect((tr.state.combatants.A as Combatant).economy.action).toBe(true);
    const r3 = run(r.state, { type: 'spell_followup', actorId: 'A', targetId: 'A', targetHex: H(9, 1), targetHexes: [H(9, 1), H(11, 2)] } as Command);
    expect(dl(r3.state).hexes).toEqual([H(9, 1), H(11, 2)]);
    // Ayrı taşımada bağ kuralı yine geçerli.
    const bad = tryRun(r.state, { type: 'spell_followup', actorId: 'A', targetId: 'A', targetHex: H(2, 0), targetHexes: [H(2, 0), H(12, 6)] } as Command);
    expect(bad.ok ? '' : bad.error).toContain('20 ft');
    // Sürüm 50: tek alan, 2 altıgen aydınlık (eski davranış).
    const old = run(dark([wiz()], { A: H(0) }, 50), { type: 'cast_spell', actorId: 'A', spellName: 'Dancing Lights', targetHex: H(7) } as Command);
    expect(litHexes(old.state).has('9,3')).toBe(true);
    expect(dl(old.state).name).toBe('Dancing Lights');
  });
});

describe('K67b diğer ışık büyüleri', () => {
  it('Moonbeam: silindir loş, çevresi karanlık (sürüm 50: ışıksız)', () => {
    const r = run(dark([wiz()], { A: H(0) }), { type: 'cast_spell', actorId: 'A', spellName: 'Moonbeam', targetHex: H(8) } as Command);
    const z = r.state.map?.zones?.find((x) => x.spellId === 'moonbeam') as SpellZone;
    expect(z.hexes.every((h) => lightLevelAt(r.state, h) === 'dim')).toBe(true);
    expect(lightLevelAt(r.state, H(11))).toBe('dark');
    const old = run(dark([wiz()], { A: H(0) }, 50), { type: 'cast_spell', actorId: 'A', spellName: 'Moonbeam', targetHex: H(8) } as Command);
    expect(litHexes(old.state).has('8,3')).toBe(false);
  });
  it('Starry Wisp isabeti: hedef 10 ft loş (parlak yok)', () => {
    const s = dark([wiz({ darkvision: 60 }), mk('B', { side: 'enemies', ac: 1, hp: 50, maxHp: 50 })], { A: H(0), B: H(8) });
    const r = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Starry Wisp', targetId: 'B' } as Command);
    expect(r.events.some((e) => e.type === 'attack_resolved' && e.hit)).toBe(true);
    expect(lightLevelAt(r.state, H(8))).toBe('dim');
    expect(lightLevelAt(r.state, H(10))).toBe('dim');
    expect(lightLevelAt(r.state, H(11))).toBe('dark');
  });
  it('Fire Shield ve Flame Blade 10 ft parlak + 10 ft loş; Produce Flame 20 + 20', () => {
    const cases: Array<[string, number, number]> = [['Fire Shield', 2, 4], ['Flame Blade', 2, 4], ['Produce Flame', 4, 8]];
    for (const [n, br, out] of cases) {
      const r = run(dark([wiz()], { A: H(1) }), { type: 'cast_spell', actorId: 'A', spellName: n, targetId: 'A', ...(n === 'Fire Shield' ? { choice: 'fire' } : {}) } as Command);
      expect(lightLevelAt(r.state, H(1 + br))).toBe('bright');
      expect(lightLevelAt(r.state, H(1 + br + 1))).toBe('dim');
      expect(lightLevelAt(r.state, H(1 + out))).toBe('dim');
      expect(lightLevelAt(r.state, H(1 + out + 1))).toBe('dark');
    }
  });
  it('Shining Smite hedefi 5 ft parlak ışık saçar (konsantrasyon sürdükçe; sürüm 50 ışıksız)', () => {
    const base = (ver: number) => {
      const s = dark([mk('A', { ownerId: 'p1', concentration: { spell: 'Shining Smite', targetId: 'B', slotLevel: 2 } as never }), mk('B', { side: 'enemies' })], { A: H(1), B: H(9) }, ver);
      return s;
    };
    expect(lightLevelAt(base(51), H(9))).toBe('bright');
    expect(lightLevelAt(base(51), H(10))).toBe('bright');
    expect(lightLevelAt(base(51), H(11))).toBe('dark');
    expect(lightLevelAt(base(50), H(9))).toBe('dark');
  });
  it('Conjure Celestial: ışık yalnız silindirde (parlak), çevresi karanlık', async () => {
    const z = (spec: unknown): SpellZone => ({ id: 'cc', spellId: 'conjure-celestial', name: 'Conjure Celestial', casterId: 'A', side: 'party', dc: 10, slotLevel: 7, hexes: [H(7), H(7, 2), H(7, 4), H(6, 2), H(6, 3), H(8, 2), H(8, 3)], spec } as SpellZone);
    const s0 = dark([wiz()], { A: H(0) });
    const k67 = (await import('../../data/spells-69.json')).default.find((x: { id: string }) => x.id === 'conjure-celestial') as { mechanics: { k67: { zone: unknown } } };
    const s = { ...s0, map: { ...(s0.map as NonNullable<BattleState['map']>), zones: [z(k67.mechanics.k67.zone)] } };
    expect(lightLevelAt(s, H(7))).toBe('bright');
    expect(lightLevelAt(s, H(10))).toBe('dark');
  });
});

describe('K67b harita ışıkları', () => {
  const onMap = (id: string, variantId: string, ver: number) =>
    startBattle('m', 'm', [mk('A', { ownerId: 'p1' }), mk('E', { side: 'enemies' })], () => 0.5, { kuralSurumu: ver, map: { id, variantId } } as never).state;
  /** Sürüm 51'de parlak olup 50'de ışıksız kalan ve 51'de loş olan altıgen sayıları. */
  const diff = (s51: BattleState, s50: BattleState) => {
    let brighter = 0; let dim = 0;
    for (let row = 0; row < (s51.map?.tiles.length ?? 0); row++) for (let col = 0; col < (s51.map?.tiles[0]?.length ?? 0); col++) {
      if (lightLevelAt(s51, { col, row }) === 'bright' && !litHexes(s50).has(`${col},${row}`)) brighter++;
      if (lightLevelAt(s51, { col, row }) === 'dim') dim++;
    }
    return { brighter, dim };
  };
  // Kuyruk K67c (kullanıcı kararı): meşale ve mangal 10 ft parlak + 5 ft loş (2 + 1 altıgen; SRD 20 + 20 ft'ten sapma).
  it('meşale (Kale gece): sürüm 51 10 ft parlak + 5 ft loş; parlak alan sürüm 50 ile aynı, yalnız loş halka eklenir', () => {
    const s51 = onMap('kale', 'gece', 51);
    const s50 = onMap('kale', 'gece', 50);
    const d = diff(s51, s50);
    expect(d.brighter).toBe(0);
    expect(d.dim).toBeGreaterThan(0);
    // Loş halka yalnız parlak alanın bir altıgen dışı: her loş altıgenin bir komşusu parlak; karanlık altıgen kalır.
    const levels = [...Array(7).keys()].flatMap((row) => [...Array(15).keys()].map((col) => ({ col, row, lv: lightLevelAt(s51, { col, row }) })));
    expect(levels.some((x) => x.lv === 'dark')).toBe(true);
    for (const x of levels.filter((y) => y.lv === 'dim')) expect(levels.some((y) => y.lv === 'bright' && distance(y, x) === 1)).toBe(true);
    expect([...litHexes(s50)].every((k) => lightLevelAt(s51, { col: Number(k.split(',')[0]), row: Number(k.split(',')[1]) }) === 'bright')).toBe(true);
  });
  it('mangal (Buzul Tapınağı gece): sürüm 51 meşale değeri (2 + 1), parlak alan 50 ile aynı', () => {
    const s51 = onMap('buzul-tapinak', 'gece', 51);
    const s50 = onMap('buzul-tapinak', 'gece', 50);
    const d = diff(s51, s50);
    expect(d.brighter).toBe(0);
    expect(d.dim).toBeGreaterThan(0);
  });
  it('Mağara (sürüm 51): loş halkayla ışıklı pay sürüm 50\'nin %40–60\'ından büyük, karanlık altıgen kalır', () => {
    const s51 = onMap('magara', 'magara', 51);
    const s50 = onMap('magara', 'magara', 50);
    let open = 0; let lit51 = 0; let lit50 = 0; let dark51 = 0;
    s51.map?.tiles.forEach((row, r) => [...row].forEach((_, col) => {
      open++;
      if (litHexes(s51).has(`${col},${r}`)) lit51++;
      if (litHexes(s50).has(`${col},${r}`)) lit50++;
      if (lightLevelAt(s51, { col, row: r }) === 'dark') dark51++;
    }));
    expect(lit51).toBeGreaterThan(lit50);
    expect(dark51).toBeGreaterThan(0);
  });
  it('mangal söndürülünce (sürüm 51) parlak alan küçülür', () => {
    const s0 = startBattle('m', 'm', [mk('A', { ownerId: 'p1' }), mk('E', { side: 'enemies' })], () => 0.5, { kuralSurumu: 51, map: { id: 'buzul-tapinak', variantId: 'gece' } } as never).state;
    const s = { ...s0, status: 'active' as const, order: ['A', 'E'], turnIndex: 0, combatants: { ...s0.combatants, A: { ...(s0.combatants.A as Combatant), pos: { col: 8, row: 4 } }, E: { ...(s0.combatants.E as Combatant), pos: { col: 2, row: 9 } } } };
    const bright = (st: BattleState) => [...Array(st.map?.tiles.length ?? 0).keys()].flatMap((row) => [...Array(st.map?.tiles[0]?.length ?? 0).keys()].map((col) => lightLevelAt(st, { col, row }))).filter((x) => x === 'bright').length;
    const r = run(s, { type: 'object_use', actorId: 'A', objectId: 'mangal4', action: 'douse' } as Command);
    expect(bright(r.state)).toBeLessThan(bright(s));
  });
});

describe('K67b Darkvision (sürüm 51, ışıksız harita)', () => {
  it('Darkvision büyüsü: uzaktaki karanlıktaki hedef görülür (loş gibi)', async () => {
    const { canSee } = await import('./maprules');
    const s = dark([mk('A', { ownerId: 'p1', spellNames: ['Darkvision'], spellSlots: SLOTS, spellMod: 3, casterTag: 'wizard' }), mk('B', { side: 'enemies' })], { A: H(1), B: H(10) });
    expect(canSee(s, s.combatants.A as Combatant, s.combatants.B as Combatant)).toBe(false);
    const r = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Darkvision', targetIds: ['A'] } as Command);
    expect(canSee(r.state, r.state.combatants.A as Combatant, r.state.combatants.B as Combatant)).toBe(true);
    expect(perceivedLevel(r.state, r.state.combatants.A as Combatant, H(10))).toBe('dim');
  });
});

describe('K67b Blindsight ve Truesight', () => {
  const scene = (watcher: Partial<Combatant>, ver = 51) =>
    dark([mk('A', { ownerId: 'p1' }), mk('W', { side: 'enemies', darkvision: 60, ...watcher })], { A: H(0, 0), W: H(2) }, ver);
  it('Blindsight menzilinde karanlıkta Algı cezası yok, menzil dışında karanlık görüşle −5', () => {
    const s = scene({ senses: { blindsight: 30 } as never });
    const w = s.combatants.W as Combatant;
    expect(perceivedLevel(s, w, H(7))).toBe('bright');
    expect(perceivedLevel(s, w, H(9))).toBe('dim');
    expect(passivePerception(s, w, H(9)) - passivePerception(s, w, H(7))).toBe(-5);
  });
  it('Truesight (True Seeing 120 ft) normal ve büyülü karanlıkta cezasız; sürüm 50 Algı kuralı yok', () => {
    const s0 = scene({ effects: [fx('ts', { truesight: 120 })] });
    const mdark: SpellZone = { id: 'd', spellId: 'darkness', name: 'Darkness', casterId: 'A', side: 'party', dc: 10, slotLevel: 2, hexes: [H(10)] };
    const s = { ...s0, map: { ...(s0.map as NonNullable<BattleState['map']>), zones: [mdark] } };
    const w = s.combatants.W as Combatant;
    expect(perceivedLevel(s, w, H(12))).toBe('bright');
    expect(perceivedLevel(s, w, H(10))).toBe('bright');
    const plain = scene({});
    expect(perceivedLevel(plain, plain.combatants.W as Combatant, H(10))).toBe('dim');
    const old = scene({ effects: [fx('ts', { truesight: 120 })] }, 50);
    expect(passivePerception(old, old.combatants.W as Combatant, H(12))).toBe(passivePerception(old, old.combatants.W as Combatant, H(3)));
  });
});

describe('K67b yapay zekâ ışık kuralı', () => {
  const caster = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', spellNames: ['Dancing Lights', 'Light'], spellSlots: SLOTS, spellSaveDc: 13, spellAttack: 5, spellMod: 3, casterTag: 'wizard', ...p });
  const at = (s: BattleState) => ({ ...s, turnIndex: 0 });
  it('görmeyen dost varken ışık büyüsü yapar (dört ışık düşmanların üstüne)', () => {
    const s = at(dark([caster(), mk('E', { side: 'enemies' }), mk('F', { side: 'enemies' })], { A: H(1), E: H(9), F: H(11) }));
    const cmd = chooseCommand(s);
    expect(cmd).toMatchObject({ type: 'cast_spell', spellName: 'Dancing Lights' });
    const r = run(s, cmd as Command);
    expect(lightLevelAt(r.state, H(9))).toBe('dim');
    // Bir kez: süren ışığı varken yeniden yapmaz.
    const again = chooseCommand({ ...r.state, combatants: { ...r.state.combatants, A: { ...(r.state.combatants.A as Combatant), economy: (s.combatants.A as Combatant).economy } } });
    expect(again).not.toMatchObject({ type: 'cast_spell', spellName: 'Dancing Lights' });
  });
  it('görmeyen dost yoksa (düşman parlak ışıkta) ışık büyüsü yapmaz; sürüm 50\'de kural yok', () => {
    const lit = at(dark([caster(), mk('E', { side: 'enemies', effects: [fx('l', { light: 4, sourceId: 'E' })] })], { A: H(1), E: H(5) }));
    expect(chooseCommand(lit)).not.toMatchObject({ type: 'cast_spell', spellName: 'Dancing Lights' });
    expect(chooseCommand(lit)).not.toMatchObject({ type: 'cast_spell', spellName: 'Light' });
    const old = at(dark([caster(), mk('E', { side: 'enemies' })], { A: H(1), E: H(9) }, 50));
    expect(chooseCommand(old)).not.toMatchObject({ type: 'cast_spell', spellName: 'Dancing Lights' });
  });
});
