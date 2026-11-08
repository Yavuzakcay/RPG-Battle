/**
 * Kuyruk K67a (kural sürümü 51): loş ışık. Üç seviye (parlak / loş / karanlık), çakışmada en parlak; Light ve Continual Flame
 * 20 ft + 20 ft, Faerie Fire 10 ft loş, Daylight 60 ft + 60 ft; görmeye dayalı Algı loşta (ve karanlık görüşle karanlıkta)
 * pasif −5 / aktif dezavantaj, hafif örtüyle birikmez; büyülü karanlık her ışığa kapalı; Wall of Fire ışığı 51'de yok.
 * Sürüm 50'de `litHexes` bugünkü küme. `run` replay'i denetler.
 */
import { describe, expect, it } from 'vitest';
import { spells } from '../data';
import { mk, scripted, P1 } from './fixtures';
import { execute, replay, startBattle } from './index';
import { inShadowAt, lightLevelAt, lightLevels, litHexes } from './maprules';
import { passivePerception } from './stealth';
import { wardSources } from './divine';
import { mechanicsAt } from './spellVersion';
import { lightlyObscured } from './zones';
import { seededRng } from '../rules/dice';
import type { Offset } from '../rules/hex';
import type { ActiveEffect, BattleEvent, BattleState, Combatant, Command, SpellZone } from './types';

const SP = (n: string) => spells.find((s) => s.name === n) as NonNullable<(typeof spells)[number]>;
const SLOTS = [4, 3, 3, 3, 3, 2, 2, 1, 1];
/** Karanlık zindan (`dungeon` `mesale`, karanlık kuralı açık), 15×7 düz zemin, harita ışığı yok. */
function dark(parts: Combatant[], pos: Record<string, Offset>, ver = 51): BattleState {
  const s = startBattle('k67', 'k67', parts, () => 0.5, { kuralSurumu: ver, map: { id: 'dungeon', variantId: 'mesale' } } as never).state;
  const combatants = { ...s.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return { ...s, status: 'active', order: parts.map((c) => c.id), turnIndex: 0, combatants,
    map: { ...(s.map as NonNullable<BattleState['map']>), options: ['darkness'], tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } };
}
const run = (s: BattleState, cmd: Command, seed = 3) => {
  const r = execute(s, cmd, P1, seededRng(seed));
  if (!r.ok) throw new Error(r.error);
  expect(replay([{ type: 'battle_started', state: s }, ...r.events] as BattleEvent[])).toEqual(r.state);
  return r;
};
const fx = (id: string, p: Partial<ActiveEffect>): ActiveEffect => ({ id, name: id, sourceId: 'A', ...p });
const wiz = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', spellNames: ['Light', 'Continual Flame', 'Daylight', 'Darkness', 'Faerie Fire', 'Wall of Fire'], spellSlots: SLOTS,
  spellSaveDc: 30, spellAttack: 10, spellMod: 5, casterTag: 'wizard', hp: 200, maxHp: 200, ...p });
const H = (col: number, row = 3): Offset => ({ col, row });

describe('K67a veri', () => {
  it('sürüm 51: Light/Continual Flame 4 + 4, Faerie Fire 2 loş, Daylight alan + 12 loş, Wall of Fire ışıksız; 50\'de eski tek yarıçap', () => {
    const s51 = dark([wiz()], { A: H(1) });
    const s50 = dark([wiz()], { A: H(1) }, 50);
    for (const n of ['Light', 'Continual Flame']) {
      expect(mechanicsAt(s51, SP(n)).effect).toMatchObject({ light: 4, lightDim: 4 });
      expect(mechanicsAt(s50, SP(n)).effect?.lightDim).toBeUndefined();
    }
    expect(mechanicsAt(s51, SP('Faerie Fire')).failEffect).toMatchObject({ lightDim: 2 });
    expect(mechanicsAt(s51, SP('Faerie Fire')).failEffect?.light).toBeUndefined();
    expect(mechanicsAt(s50, SP('Faerie Fire')).failEffect).toMatchObject({ light: 2 });
    expect(mechanicsAt(s51, SP('Daylight')).zone).toMatchObject({ light: 0, lightDim: 12, sunlight: true });
    expect(mechanicsAt(s51, SP('Wall of Fire')).zone?.light).toBeUndefined();
    expect(mechanicsAt(s50, SP('Wall of Fire')).zone?.light).toBe(2);
  });
});

describe('K67a üç seviye', () => {
  it('parlak 4, loş +4, ötesi karanlık; çakışmada en parlak; aynı durumda önbellek', () => {
    const s = dark([wiz({ effects: [fx('l', { light: 4, lightDim: 4 })] }), mk('B', { effects: [fx('f', { lightDim: 2 })] })], { A: H(1), B: H(9) });
    expect(lightLevelAt(s, H(5))).toBe('bright');
    expect(lightLevelAt(s, H(7))).toBe('dim');
    expect(lightLevelAt(s, H(13))).toBe('dark');
    // B'nin loş halkası (9 ± 2) A'nın loşuyla çakışır: loş; A'nın parlağıyla çakışmaz.
    expect(lightLevelAt(s, H(10))).toBe('dim');
    expect(lightLevelAt(s, H(12))).toBe('dark');
    expect(lightLevels(s)).toBe(lightLevels(s));
    // litHexes = parlak + loş (görülebilir ışık).
    expect(litHexes(s).has('7,3')).toBe(true);
    // Sürüm 50: yalnız parlak yarıçap (bugünkü küme).
    const old = { ...s, kuralSurumu: 50 };
    expect(litHexes(old).has('7,3')).toBe(false);
    expect(litHexes(old).has('5,3')).toBe(true);
  });
  it('Light büyüsü (döküm) 20 ft parlak + 20 ft loş; Continual Flame aynı', () => {
    for (const n of ['Light', 'Continual Flame']) {
      const r = run(dark([wiz()], { A: H(1) }), { type: 'cast_spell', actorId: 'A', spellName: n, targetId: 'A' } as Command);
      expect(lightLevelAt(r.state, H(5))).toBe('bright');
      expect(lightLevelAt(r.state, H(9))).toBe('dim');
      expect(lightLevelAt(r.state, H(10))).toBe('dark');
    }
  });
  it('büyülü karanlık her ışığa kapalı: Darkness alanında parlak ve loş yok', () => {
    const z: SpellZone = { id: 'd', spellId: 'darkness', name: 'Darkness', casterId: 'B', side: 'enemies', dc: 10, slotLevel: 2, hexes: [H(4), H(7)] };
    const s0 = dark([wiz({ effects: [fx('l', { light: 4, lightDim: 4 })] }), mk('B', { side: 'enemies' })], { A: H(1), B: H(13) });
    const s = { ...s0, map: { ...(s0.map as NonNullable<BattleState['map']>), zones: [z] } };
    expect(lightLevelAt(s, H(4))).toBe('dark');
    expect(lightLevelAt(s, H(7))).toBe('dark');
    expect(lightLevelAt(s, H(3))).toBe('bright');
  });
  it('Daylight: alan parlak, +12 altıgen loş; Sunlight Sensitivity yalnız parlak alanda', () => {
    const r = run(dark([wiz()], { A: H(0) }), { type: 'cast_spell', actorId: 'A', spellName: 'Daylight', targetHex: H(0, 0) } as Command);
    const zone = r.state.map?.zones?.find((x) => x.spellId === 'daylight') as SpellZone;
    const inside = zone.hexes.some((h) => h.col === 14 && h.row === 6);
    expect(inside).toBe(false);
    expect(lightLevelAt(r.state, H(14, 6))).toBe('dim');
    expect(lightLevelAt(r.state, H(1, 1))).toBe('bright');
    const drow = (at: Offset) => ({ ...(mk('D', { side: 'enemies', traits: ['sunlight-sensitive'] })), pos: at });
    const t = r.state.combatants.A as Combatant;
    expect(wardSources(r.state, drow(H(1, 1)), t).some((x) => x.reason === 'Sunlight Sensitivity')).toBe(true);
    expect(wardSources(r.state, drow(H(14, 6)), t).some((x) => x.reason === 'Sunlight Sensitivity')).toBe(false);
  });
  it('Faerie Fire işaretlediği yaratık 10 ft loş ışık yayar (parlak değil)', () => {
    const s = dark([wiz(), mk('F', { side: 'enemies', saves: { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 } })], { A: H(1), F: H(9) });
    const r = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Faerie Fire', targetHex: H(9) } as Command);
    expect(lightLevelAt(r.state, H(9))).toBe('dim');
    expect(lightLevelAt(r.state, H(11))).toBe('dim');
    expect(lightLevelAt(r.state, H(12))).toBe('dark');
  });
  it('Wall of Fire: 51\'de ışık yok, 50\'de duvarın çevresi aydınlık', () => {
    const cast = (ver: number) => run(dark([wiz()], { A: H(1) }, ver), { type: 'cast_spell', actorId: 'A', spellName: 'Wall of Fire', targetHex: H(8) } as Command).state;
    const w51 = cast(51);
    const wall = w51.map?.zones?.find((z) => z.spellId === 'wall-of-fire')?.hexes ?? [];
    expect(wall.length).toBeGreaterThan(0);
    expect(wall.every((h) => lightLevelAt(w51, h) === 'dark')).toBe(true);
    const w50 = cast(50);
    expect((w50.map?.zones?.find((z) => z.spellId === 'wall-of-fire')?.hexes ?? []).every((h) => litHexes(w50).has(`${h.col},${h.row}`))).toBe(true);
  });
});

describe('K67a Algı', () => {
  const scene = (watcher: Partial<Combatant>, ver = 51, extraZones: SpellZone[] = []) => {
    const s0 = dark([wiz({ effects: [fx('l', { light: 4, lightDim: 4 })] }), mk('W', { side: 'enemies', ...watcher })], { A: H(1), W: H(10) }, ver);
    return { ...s0, map: { ...(s0.map as NonNullable<BattleState['map']>), zones: extraZones } } as BattleState;
  };
  it('loşta karanlık görüşsüz gözcü −5; karanlık görüşlü cezasız; parlakta ceza yok', () => {
    const plain = scene({});
    const w = plain.combatants.W as Combatant;
    expect(passivePerception(plain, w, H(5)) - passivePerception(plain, w, H(7))).toBe(5);
    const dv = scene({ darkvision: 60 });
    expect(passivePerception(dv, dv.combatants.W as Combatant, H(7))).toBe(passivePerception(dv, dv.combatants.W as Combatant, H(5)));
  });
  it('karanlık görüş karanlığı loş sayar: menzilde −5 (sürüm 50\'de 0); Devil\'s Sight cezasız', () => {
    const dv = scene({ darkvision: 60 });
    const w = dv.combatants.W as Combatant;
    expect(lightLevelAt(dv, H(12))).toBe('dark');
    expect(passivePerception(dv, w, H(5)) - passivePerception(dv, w, H(12))).toBe(5);
    const old = scene({ darkvision: 60 }, 50);
    expect(passivePerception(old, old.combatants.W as Combatant, H(5)) - passivePerception(old, old.combatants.W as Combatant, H(12))).toBe(0);
    const ds = scene({ darkvision: 120, traits: ['devils-sight'] });
    expect(passivePerception(ds, ds.combatants.W as Combatant, H(12))).toBe(passivePerception(ds, ds.combatants.W as Combatant, H(5)));
  });
  it('hafif örtü (Web) ile loş birikmez: −5', () => {
    const web: SpellZone = { id: 'w', spellId: 'web', name: 'Web', casterId: 'A', side: 'party', dc: 10, slotLevel: 2, hexes: [H(7)], spec: { ...mechanicsAt({ kuralSurumu: 51 }, SP('Web')).zone, obscured: 'light' } };
    const s = scene({}, 51, [web]);
    expect(lightlyObscured(s, H(7))).toBe(true);
    const w = s.combatants.W as Combatant;
    expect(passivePerception(s, w, H(5)) - passivePerception(s, w, H(7))).toBe(5);
  });
  it('aktif Algı (Ara) loştaki gizlenene dezavantajlı: ikinci düşük zar', () => {
    const hid = (at: Offset) => {
      const s0 = dark([mk('S', { ownerId: 'p1' }), wiz({ effects: [fx('l', { light: 4, lightDim: 4 })] }), mk('H', { side: 'enemies', hidden: { dc: 15 } as never })], { S: H(2), A: H(1), H: at });
      const r = execute(s0, { type: 'search', actorId: 'S' } as Command, P1, scripted([20, 18], [20, 2]));
      if (!r.ok) throw new Error(r.error);
      return r.events.find((e): e is Extract<BattleEvent, { type: 'searched' }> => e.type === 'searched')?.found ?? [];
    };
    expect(hid(H(5))).toEqual(['H']);
    expect(hid(H(7))).toEqual([]);
  });
  it('One with Shadows / gölgede: loş ve karanlıkta evet, parlakta hayır (sürüm 50: yalnız ışıksız)', () => {
    const s = scene({});
    expect(inShadowAt(s, H(5))).toBe(false);
    expect(inShadowAt(s, H(7))).toBe(true);
    expect(inShadowAt(s, H(12))).toBe(true);
    expect(inShadowAt({ ...s, kuralSurumu: 50 }, H(7))).toBe(true);
  });
});
