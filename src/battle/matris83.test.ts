/**
 * Mekanik matris düzeltmeleri (kural sürümü 83; harita/belgeler/MEKANIK-MATRIS.md). Her düzeltme 83'te açık, 82'de eski
 * davranış (eski kayıt ve replay aynen).
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { GM, mk, P1, sword } from './fixtures';
import { MATRIS_VERSION, matrisOn } from './matrisSurum';
import { CURRENT_RULES } from './ruleVersion';
import { saveMode } from './durations';
import { wardSources } from './divine';
import type { DiceRequest, Rng } from '../rules/dice';
import { FRESH_ECONOMY, type BattleEvent, type BattleState, type Combatant, type Command } from './types';

type D20 = { one: number; two: [number, number] };
/** Kancalı zar: d20 tek zarda `one`, çift zarda `two`; diğer zarlar ⌊yüz/2⌋ + 1. */
function hooked(d20: D20): Rng {
  const f = (() => 0.5) as Rng & { dice?: (r: DiceRequest) => number[] };
  f.dice = (req) => (req.sides === 20 ? (req.count >= 2 ? [...d20.two] : [d20.one]) : Array.from({ length: req.count }, () => Math.floor(req.sides / 2) + 1));
  return f;
}
/** DC 15'e karşı: tek zarda başarılı (19), dezavantajda başarısız (3). */
const PROBE: D20 = { one: 19, two: [19, 3] };

const flat = (): string[] => Array.from({ length: 11 }, () => '.'.repeat(21));
function scene(v: number, parts: Combatant[]): BattleState {
  const s0 = startBattle('m83', 'd', parts.map((p) => ({ ...p, pos: null })), () => 0.5, { kuralSurumu: v, map: { id: 'kale-onu', variantId: 'gunduz' } } as never).state;
  const cs: Record<string, Combatant> = {};
  for (const p of parts) cs[p.id] = { ...(s0.combatants[p.id] as Combatant), pos: p.pos, initiative: 0 };
  return { ...s0, kuralSurumu: v, status: 'active', round: 1, order: parts.map((p) => p.id), turnIndex: 0, combatants: cs,
    map: { ...s0.map!, tiles: flat(), objects: [], zones: [] } };
}
const caster = (p: Partial<Combatant> = {}): Combatant => mk('A', { ownerId: 'p1', hp: 100, maxHp: 100, level: 9, spellSaveDc: 15, spellAttack: 7, spellMod: 4,
  spellSlots: [4, 3, 3, 3, 1, 0, 0, 0, 0], pos: { col: 3, row: 5 }, ...p });
const foe = (id: string, p: Partial<Combatant> = {}): Combatant => mk(id, { side: 'enemies', hp: 100, maxHp: 100, pos: { col: 4, row: 5 }, ...p });
function run(s: BattleState, cmd: Command, rng: Rng): { ok: boolean; error?: string; events: BattleEvent[]; state: BattleState } {
  const r = execute(s, cmd, P1, rng);
  return r.ok ? { ok: true, events: r.events, state: r.state } : { ok: false, error: r.error, events: [], state: s };
}
const saveOf = (events: BattleEvent[], id: string) => events.find((e): e is Extract<BattleEvent, { type: 'save_resolved' }> => e.type === 'save_resolved' && e.targetId === id);

describe('Matris: sürüm', () => {
  it('83; güncel sürüm 83+; 82 kapalı', () => {
    expect(MATRIS_VERSION).toBe(83);
    expect(CURRENT_RULES).toBeGreaterThanOrEqual(83);
    expect(matrisOn({ kuralSurumu: 82 })).toBe(false);
    expect(matrisOn({ kuralSurumu: 83 })).toBe(true);
  });
});

describe('B01: Restrained hedefin DEX save\'i dezavantajlı (SRD 5.2.1 Restrained)', () => {
  it('saveMode: yalnız `srd83` işaretiyle ve yalnız DEX', () => {
    expect(saveMode('normal', { conditions: ['Restrained'], srd83: true }, 'dex')).toBe('disadvantage');
    expect(saveMode('normal', { conditions: ['Restrained'], srd83: true }, 'str')).toBe('normal');
    expect(saveMode('normal', { conditions: ['Restrained'] }, 'dex')).toBe('normal');
    expect(saveMode('advantage', { conditions: ['Restrained'], srd83: true }, 'dex')).toBe('normal');
  });
  it('83: Burning Hands save\'i dezavantajlı (iki zar, düşük olan); 82: tek zar', () => {
    const parts = (): Combatant[] => [caster({ spellNames: ['Burning Hands'] }), foe('T', { conditions: ['Restrained'] })];
    const cmd: Command = { type: 'cast_spell', actorId: 'A', spellName: 'Burning Hands', slotLevel: 1, targetHex: { col: 4, row: 5 } } as Command;
    const s83 = scene(83, parts());
    expect(s83.combatants.T?.srd83).toBe(true);
    const r83 = run(s83, cmd, hooked(PROBE));
    expect(r83.ok, r83.error).toBe(true);
    const sv83 = saveOf(r83.events, 'T');
    expect(sv83?.d20).toEqual([19, 3]);
    expect(sv83?.success).toBe(false);
    const s82 = scene(82, parts());
    expect(s82.combatants.T?.srd83).toBeUndefined();
    const sv82 = saveOf(run(s82, cmd, hooked(PROBE)).events, 'T');
    expect(sv82?.d20).toEqual([19]);
    expect(sv82?.success).toBe(true);
  });
});

describe('B02: "a creature you can see" büyüleri görülmeyen hedefe yapılamaz (SRD 5.2.1 Invisible)', () => {
  const sf: Command = { type: 'cast_spell', actorId: 'A', spellName: 'Sacred Flame', targetId: 'T' } as Command;
  it('83: Invisible hedefe Sacred Flame reddedilir; 82 kabul', () => {
    const parts = (): Combatant[] => [caster({ spellNames: ['Sacred Flame'] }), foe('T', { conditions: ['Invisible'] })];
    const r83 = run(scene(83, parts()), sf, hooked(PROBE));
    expect(r83.ok).toBe(false);
    expect(r83.error).toMatch(/görmen gerekir/);
    expect(run(scene(82, parts()), sf, hooked(PROBE)).ok).toBe(true);
  });
  it('83: See Invisibility ile görülen, görünür ve açığa çıkmış hedef kabul; Blinded büyücü görünür hedefe yapamaz', () => {
    const seer = caster({ spellNames: ['Sacred Flame'], effects: [{ id: 'see-invisibility', name: 'See Invisibility', sourceId: 'A', until: 99, seeInvisible: true } as never] });
    expect(run(scene(83, [seer, foe('T', { conditions: ['Invisible'] })]), sf, hooked(PROBE)).ok).toBe(true);
    expect(run(scene(83, [caster({ spellNames: ['Sacred Flame'] }), foe('T')]), sf, hooked(PROBE)).ok).toBe(true);
    const lit = foe('T', { conditions: ['Invisible'], effects: [{ id: 'faerie-fire', name: 'Faerie Fire', sourceId: 'A', until: 99, revealed: true } as never] });
    expect(run(scene(83, [caster({ spellNames: ['Sacred Flame'] }), lit]), sf, hooked(PROBE)).ok).toBe(true);
    const blind = run(scene(83, [caster({ spellNames: ['Sacred Flame'], conditions: ['Blinded'] }), foe('T')]), sf, hooked(PROBE));
    expect(blind.ok).toBe(false);
  });
  it('83: çok hedefli Bane\'de görülmeyen hedef varsa reddedilir; Healing Word görünmez dosta yapılamaz', () => {
    const bane: Command = { type: 'cast_spell', actorId: 'A', spellName: 'Bane', slotLevel: 1, targetIds: ['T', 'U'] } as Command;
    const s = scene(83, [caster({ spellNames: ['Bane'] }), foe('T'), foe('U', { pos: { col: 5, row: 5 }, conditions: ['Invisible'] })]);
    expect(run(s, bane, hooked(PROBE)).ok).toBe(false);
    const hw: Command = { type: 'cast_spell', actorId: 'A', spellName: 'Healing Word', slotLevel: 1, targetId: 'B' } as Command;
    const ally = mk('B', { ownerId: 'p1', hp: 5, maxHp: 30, pos: { col: 3, row: 7 }, conditions: ['Invisible'] });
    expect(run(scene(83, [caster({ spellNames: ['Healing Word'] }), ally, foe('T')]), hw, hooked(PROBE)).ok).toBe(false);
    expect(run(scene(82, [caster({ spellNames: ['Healing Word'] }), ally, foe('T')]), hw, hooked(PROBE)).ok).toBe(true);
  });
});

describe('B02: alan büyüsünde görülmeyen yaratık etkilenmez (Compulsion "each creature of your choice that you can see")', () => {
  it('83: görünmez düşman save atmaz, görünür düşman atar; 82 ikisi de', () => {
    const parts = (): Combatant[] => [caster({ spellNames: ['Compulsion'] }), foe('T'), foe('U', { pos: { col: 3, row: 7 }, conditions: ['Invisible'] })];
    const cmd: Command = { type: 'cast_spell', actorId: 'A', spellName: 'Compulsion', slotLevel: 4, targetHex: { col: 4, row: 5 } } as Command;
    const r83 = run(scene(83, parts()), cmd, hooked(PROBE));
    expect(r83.ok, r83.error).toBe(true);
    expect(saveOf(r83.events, 'T')).toBeDefined();
    expect(saveOf(r83.events, 'U')).toBeUndefined();
    const r82 = run(scene(82, parts()), cmd, hooked(PROBE));
    expect(saveOf(r82.events, 'U')).toBeDefined();
  });
});

describe('B03: Counterspell SRD akışı (CON save; başarısızlıkta büyü etkisiz, eylem boşa, slot harcanmaz)', () => {
  const counter = (p: Partial<Combatant> = {}): Combatant => foe('K', { pos: { col: 8, row: 5 }, spellNames: ['Counterspell'], spellSlots: [0, 0, 2, 0, 0, 0, 0, 0, 0], spellSaveDc: 15,
    reactions: [{ id: 'spells:counterspell', name: 'Counterspell', spell: 'Counterspell', kind: 'counterspell', save: 'con', rangeFt: 60 }] as never, ...p });
  const bh: Command = { type: 'cast_spell', actorId: 'A', spellName: 'Burning Hands', slotLevel: 1, targetHex: { col: 4, row: 5 } } as Command;
  const parts = (k: Combatant = counter(), a: Partial<Combatant> = {}): Combatant[] => [caster({ spellNames: ['Burning Hands'], ...a }), foe('T'), k];
  for (const v of [82, 83]) {
    it(`${v}: büyücünün CON save'i başarısız → büyü etkisiz, eylem harcanır, büyücünün slotu harcanmaz; karşı büyücünün 3. seviye slotu ve tepkisi harcanır`, () => {
      const r = run(scene(v, parts()), bh, hooked({ one: 1, two: [1, 1] }));
      expect(r.ok, r.error).toBe(true);
      const sv = r.events.find((e) => e.type === 'save_resolved' && e.targetId === 'A') as Extract<BattleEvent, { type: 'save_resolved' }> | undefined;
      expect(sv?.ability).toBe('con');
      expect(sv?.dc).toBe(15);
      expect(sv?.success).toBe(false);
      expect(saveOf(r.events, 'T')).toBeUndefined();
      expect(r.state.combatants.T?.hp).toBe(100);
      expect(r.state.combatants.A?.spellSlots[0]).toBe(4);
      expect(r.state.combatants.A?.economy.action).toBe(true);
      expect(r.state.combatants.K?.spellSlots[2]).toBe(1);
      expect(r.events.some((e) => e.type === 'reaction_used' && e.actorId === 'K')).toBe(true);
    });
    it(`${v}: CON save başarılı → büyü işler, büyücünün slotu harcanır`, () => {
      const r = run(scene(v, parts()), bh, hooked({ one: 20, two: [20, 20] }));
      expect(r.ok, r.error).toBe(true);
      expect(saveOf(r.events, 'T')).toBeDefined();
      expect(r.state.combatants.A?.spellSlots[0]).toBe(3);
      expect(r.state.combatants.K?.spellSlots[2]).toBe(1);
    });
  }
  it('60 ft dışındaki ya da büyücüyü görmeyen karşı büyücü tepki vermez', () => {
    const far = run(scene(83, parts(counter({ pos: { col: 16, row: 5 } }))), bh, hooked({ one: 1, two: [1, 1] }));
    expect(far.events.some((e) => e.type === 'reaction_used')).toBe(false);
    const unseen = run(scene(83, parts(counter(), { conditions: ['Invisible'] })), bh, hooked({ one: 1, two: [1, 1] }));
    expect(unseen.events.some((e) => e.type === 'reaction_used')).toBe(false);
  });
  it('83: durdurulan Power Word Kill öldürmez (6.–9. seviye kancası çalışmaz); 82 eski davranış (öldürür)', () => {
    const pwk: Command = { type: 'cast_spell', actorId: 'A', spellName: 'Power Word Kill', slotLevel: 9, targetId: 'T' } as Command;
    const p = (): Combatant[] => [caster({ level: 17, spellNames: ['Power Word Kill'], spellSlots: [4, 3, 3, 3, 3, 2, 2, 1, 1] }), foe('T', { hp: 50, maxHp: 50 }), counter()];
    const r83 = run(scene(83, p()), pwk, hooked({ one: 1, two: [1, 1] }));
    expect(r83.ok, r83.error).toBe(true);
    expect(r83.state.combatants.T?.hp).toBe(50);
    expect(r83.state.combatants.A?.spellSlots[8]).toBe(1);
    const r82 = run(scene(82, p()), pwk, hooked({ one: 1, two: [1, 1] }));
    expect(r82.state.combatants.T?.hp).toBe(0);
  });
});

describe('B05: alan büyülerinin yapım anı save\'i ve tetik zamanı (SRD metni)', () => {
  const high = (spell: string, p: Partial<Combatant> = {}): Combatant => caster({ level: 17, spellNames: [spell], spellSlots: [4, 3, 3, 3, 3, 2, 2, 1, 1], ...p });
  const at = (col: number, row: number) => ({ col, row });
  const savesOn = (events: BattleEvent[], id: string) => events.filter((e): e is Extract<BattleEvent, { type: 'save_resolved' }> => e.type === 'save_resolved' && e.targetId === id);
  it('Incendiary Cloud: 83 yapımda içerideki herkes DEX save atar (hasar bir kez atılır); 82 yapımda save yok', () => {
    const parts = (): Combatant[] => [high('Incendiary Cloud'), foe('T', { pos: at(10, 5) }), foe('U', { pos: at(11, 5) })];
    const cmd: Command = { type: 'cast_spell', actorId: 'A', spellName: 'Incendiary Cloud', slotLevel: 8, targetHex: at(10, 5) } as Command;
    const r83 = run(scene(83, parts()), cmd, hooked({ one: 1, two: [1, 1] }));
    expect(r83.ok, r83.error).toBe(true);
    const t = savesOn(r83.events, 'T'), u = savesOn(r83.events, 'U');
    expect(t).toHaveLength(1);
    expect(u).toHaveLength(1);
    expect(t[0]?.ability).toBe('dex');
    expect(t[0]?.damageType).toBe('fire');
    expect(t[0]?.rawDamage).toBe(u[0]?.rawDamage);
    expect(r83.state.combatants.T?.hp).toBe(100 - 50);
    expect(savesOn(run(scene(82, parts()), cmd, hooked({ one: 1, two: [1, 1] })).events, 'T')).toHaveLength(0);
  });
  it('Incendiary Cloud 83: yarım siper (çıkış noktasıyla hedef arasında) DEX save\'ine +2', () => {
    const parts = [high('Incendiary Cloud'), foe('T', { pos: at(10, 5) }), foe('U', { pos: at(10, 7) })];
    const s = scene(83, parts);
    const tiles = s.map!.tiles.map((r, i) => (i === 6 ? `${r.slice(0, 10)}d${r.slice(11)}` : r));
    const r = run({ ...s, map: { ...s.map!, tiles } }, { type: 'cast_spell', actorId: 'A', spellName: 'Incendiary Cloud', slotLevel: 8, targetHex: at(10, 5) } as Command, hooked({ one: 16, two: [16, 16] }));
    expect(r.ok, r.error).toBe(true);
    const u = savesOn(r.events, 'U')[0];
    expect(u?.cover).toBe(2);
    expect(u?.total).toBe(18);
    expect(u?.success).toBe(true);
  });
  it('Wall of Thorns 83: yapımda Piercing, sonra Slashing', () => {
    const parts = [high('Wall of Thorns'), foe('T', { pos: at(10, 5) })];
    const r = run(scene(83, parts), { type: 'cast_spell', actorId: 'A', spellName: 'Wall of Thorns', slotLevel: 6, targetHex: at(10, 5) } as Command, hooked({ one: 1, two: [1, 1] }));
    expect(r.ok, r.error).toBe(true);
    expect(savesOn(r.events, 'T')[0]?.damageType).toBe('piercing');
    const zone = r.state.map?.zones?.find((z) => z.name === 'Wall of Thorns');
    expect(zone?.spec?.damageType).toBe('slashing');
    expect(zone?.spec?.on).toEqual(['cast', 'enter', 'end']);
  });
  it('Blade Barrier 83: tetikler yapım, giriş ve tur sonu (82: giriş ve tur başı)', () => {
    const parts = (): Combatant[] => [high('Blade Barrier'), foe('T', { pos: at(10, 5) })];
    const cmd: Command = { type: 'cast_spell', actorId: 'A', spellName: 'Blade Barrier', slotLevel: 6, targetHex: at(10, 5) } as Command;
    const r83 = run(scene(83, parts()), cmd, hooked({ one: 1, two: [1, 1] }));
    expect(r83.ok, r83.error).toBe(true);
    expect(savesOn(r83.events, 'T')[0]?.damageType).toBe('force');
    expect(r83.state.map?.zones?.find((z) => z.name === 'Blade Barrier')?.spec?.on).toEqual(['cast', 'enter', 'end']);
    expect(savesOn(run(scene(82, parts()), cmd, hooked({ one: 1, two: [1, 1] })).events, 'T')).toHaveLength(0);
  });
  it('Storm of Vengeance 83: bulutun altındaki herkes CON save; başarısızlıkta 2d6 Thunder ve büyü süresince Deafened', () => {
    // Büyücü de bulutun altında: kendi CON save'ini geçer (yoksa hasarla konsantrasyonu bozulup Deafened biterdi).
    const parts = [high('Storm of Vengeance', { saves: { str: 0, dex: 0, con: 30, int: 0, wis: 0, cha: 0 } }), foe('T', { pos: at(10, 5) })];
    const r = run(scene(83, parts), { type: 'cast_spell', actorId: 'A', spellName: 'Storm of Vengeance', slotLevel: 9, targetHex: at(10, 5) } as Command, hooked({ one: 1, two: [1, 1] }));
    expect(r.ok, r.error).toBe(true);
    const t = savesOn(r.events, 'T')[0];
    expect(t?.ability).toBe('con');
    expect(t?.damageType).toBe('thunder');
    expect(t?.rawDamage).toBe(8);
    expect(r.state.combatants.T?.conditions).toContain('Deafened');
    expect(r.state.combatants.T?.effects?.some((e) => e.grants?.includes('Deafened') && e.concentration === 'Storm of Vengeance')).toBe(true);
    expect(savesOn(r.events, 'A')[0]?.success).toBe(true);
  });
  it('Storm of Vengeance 83: büyücünün kendi save hasarıyla konsantrasyonu bozulsa da bulutun altındaki diğerleri yine save atar (eşzamanlı)', () => {
    const parts = [high('Storm of Vengeance'), foe('T', { pos: at(10, 5) })];
    const r = run(scene(83, parts), { type: 'cast_spell', actorId: 'A', spellName: 'Storm of Vengeance', slotLevel: 9, targetHex: at(10, 5) } as Command, hooked({ one: 1, two: [1, 1] }));
    expect(savesOn(r.events, 'A')).toHaveLength(1);
    expect(savesOn(r.events, 'T')).toHaveLength(1);
  });
  it('Conjure Celestial 83: düşmana Searing Light (DEX save), dosta Healing Light (4d12 + büyü değiştiricisi)', () => {
    const ally = mk('B', { ownerId: 'p1', hp: 10, maxHp: 100, pos: at(10, 6) });
    const parts = [high('Conjure Celestial'), foe('T', { pos: at(10, 5) }), ally];
    const r = run(scene(83, parts), { type: 'cast_spell', actorId: 'A', spellName: 'Conjure Celestial', slotLevel: 7, targetHex: at(10, 5) } as Command, hooked({ one: 1, two: [1, 1] }));
    expect(r.ok, r.error).toBe(true);
    expect(savesOn(r.events, 'T')[0]?.damageType).toBe('radiant');
    const heal = r.events.find((e) => e.type === 'healed' && e.targetId === 'B') as Extract<BattleEvent, { type: 'healed' }> | undefined;
    expect(heal?.amount).toBe(4 * 7 + 4);
    expect(savesOn(r.events, 'B')).toHaveLength(0);
  });
});

describe('B07: Ensnaring Strike — Large ve büyük hedef save\'i avantajlı (SRD "A Large or larger creature has Advantage on this save.")', () => {
  for (const [v, mode] of [[83, 'advantage'], [82, 'normal']] as const) {
    it(`${v}: Large hedefte STR save kipi ${mode}`, () => {
      const ranger = caster({ spellNames: ['Ensnaring Strike'], weaponOptions: [{ label: 'Longsword', attackBonus: 9, damage: '1d8+4', damageType: 'slashing', ranged: false, spell: false, tag: 'longsword', reachFt: 5 }] });
      const s = scene(v, [ranger, foe('T', { size: 'L', ac: 10 })]);
      const a = s.combatants.A as Combatant;
      const prepared = { ...s, combatants: { ...s.combatants, A: { ...a, economy: { ...a.economy, meleeHit: { targetId: 'T', critical: false } } } as Combatant } };
      const r = run(prepared, { type: 'cast_spell', actorId: 'A', spellName: 'Ensnaring Strike', slotLevel: 1, targetId: 'T' } as Command, hooked({ one: 5, two: [5, 19] }));
      expect(r.ok, r.error).toBe(true);
      const sv = r.events.find((e) => e.type === 'save_resolved' && e.targetId === 'T') as Extract<BattleEvent, { type: 'save_resolved' }> | undefined;
      expect(sv?.d20.length).toBe(mode === 'advantage' ? 2 : 1);
      expect(sv?.success).toBe(mode === 'advantage');
    });
  }
});

describe('B09: Arcane Sword hasarına büyü yeteneği değiştiricisi (SRD "4d12 plus your spellcasting ability modifier")', () => {
  for (const [v, dmg] of [[83, 4 * 7 + 4], [82, 4 * 7]] as const) {
    it(`${v}: isabette hasar ${dmg}`, () => {
      const s = scene(v, [caster({ level: 17, spellNames: ['Arcane Sword'], spellSlots: [4, 3, 3, 3, 3, 2, 2, 1, 1] }), foe('T', { ac: 10 })]);
      const r = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Arcane Sword', slotLevel: 7, targetId: 'T' } as Command, hooked({ one: 15, two: [15, 15] }));
      expect(r.ok, r.error).toBe(true);
      expect(100 - (r.state.combatants.T?.hp ?? 0)).toBe(dmg);
    });
  }
});

describe('B12: Chain Lightning yukarı slotta ek şimşek (SRD "One additional bolt … for each spell slot level above 6")', () => {
  for (const [v, n] of [[83, 4], [82, 3]] as const) {
    it(`${v}: 7. seviye slotla ilk hedef + ${n} sıçrama`, () => {
      const foes = ['T', 'U', 'V', 'W', 'X'].map((id, i) => foe(id, { pos: { col: 8 + (i % 3), row: 4 + Math.floor(i / 3) * 2 } }));
      const s = scene(v, [caster({ level: 17, spellNames: ['Chain Lightning'], spellSlots: [4, 3, 3, 3, 3, 2, 2, 1, 1] }), ...foes]);
      const r = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Chain Lightning', slotLevel: 7, targetId: 'T' } as Command, hooked({ one: 1, two: [1, 1] }));
      expect(r.ok, r.error).toBe(true);
      const hit = ['T', 'U', 'V', 'W', 'X'].filter((id) => (r.state.combatants[id]?.hp ?? 100) < 100);
      expect(hit).toHaveLength(1 + n);
    });
  }
});

describe('B17: Protection from Energy süresi 1 saat (SRD "Concentration, up to 1 hour")', () => {
  for (const [v, rounds] of [[83, 600], [82, 100]] as const) {
    it(`${v}: etki ${rounds} tur`, () => {
      const ally = mk('B', { ownerId: 'p1', hp: 30, maxHp: 30, pos: { col: 3, row: 6 } });
      const s = scene(v, [caster({ spellNames: ['Protection from Energy'] }), ally, foe('T')]);
      const r = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Protection from Energy', slotLevel: 3, targetId: 'B', choice: 'fire' } as Command, hooked(PROBE));
      expect(r.ok, r.error).toBe(true);
      const e = r.state.combatants.B?.effects?.find((x) => x.name === 'Protection from Energy');
      expect(e?.until).toBe(s.round + rounds - 1);
      expect(e?.resist).toEqual(['fire']);
    });
  }
});

describe('U01: Irresistible Dance başarısız save\'de Charmed (SRD "On a failed save, the target has the Charmed condition … Disadvantage on Dexterity saving throws")', () => {
  const cmd: Command = { type: 'cast_spell', actorId: 'A', spellName: 'Irresistible Dance', slotLevel: 6, targetId: 'T' } as Command;
  const parts = (): Combatant[] => [caster({ level: 17, spellNames: ['Irresistible Dance'], spellSlots: [4, 3, 3, 3, 3, 2, 2, 1, 1] }), foe('T')];
  it('83: Charmed (büyüleyen büyücü), DEX save dezavantajı yalnız DEX', () => {
    const r = run(scene(83, parts()), cmd, hooked({ one: 1, two: [1, 1] }));
    expect(r.ok, r.error).toBe(true);
    const t = r.state.combatants.T as Combatant;
    expect(t.conditions).toContain('Charmed');
    expect(saveMode('normal', t, 'dex')).toBe('disadvantage');
    expect(saveMode('normal', t, 'wis')).toBe('normal');
  });
  it('82: eski davranış (Charmed yok)', () => {
    const r = run(scene(82, parts()), cmd, hooked({ one: 1, two: [1, 1] }));
    expect(r.state.combatants.T?.conditions).not.toContain('Charmed');
  });
});

describe('B19: iki hasar türlü büyülerin alan kaydı (Flame Strike "5d6 Fire damage and 5d6 Radiant damage", Ice Storm "2d10 Bludgeoning damage and 4d6 Cold damage")', () => {
  const oil = (st: BattleState, at: { col: number; row: number }): BattleState => ({ ...st, map: { ...st.map!, zones: [
    { id: 'surface:oil:1', spellId: 'surface:oil', name: 'oil', casterId: 'harita', side: 'enemies', dc: 10, slotLevel: 0, hexes: [at], surface: 'oil' } as never] } });
  const cast = (spell: string, slot: number, v: number) => {
    const s = oil(scene(v, [caster({ level: 17, spellNames: [spell], spellSlots: [4, 3, 3, 3, 3, 2, 2, 1, 1] }), foe('T', { pos: { col: 10, row: 5 } })]), { col: 10, row: 5 });
    return run(s, { type: 'cast_spell', actorId: 'A', spellName: spell, slotLevel: slot, targetHex: { col: 10, row: 5 } } as Command, hooked({ one: 1, two: [1, 1] }));
  };
  it('83: Flame Strike alan kaydı Fire + Radiant parçaları; yağ tutuşur (fireOil)', () => {
    const r = cast('Flame Strike', 5, 83);
    expect(r.ok, r.error).toBe(true);
    const sc = r.events.find((e) => e.type === 'spell_cast' && e.area) as Extract<BattleEvent, { type: 'spell_cast' }> | undefined;
    expect(sc?.area?.parts?.map((p) => p.damageType)).toEqual(['fire', 'radiant']);
    expect(sc?.area?.damageType).toBeUndefined();
    expect(r.events.some((e) => e.type === 'surface_reacted' && e.row === 'fireOil')).toBe(true);
  });
  it('82: eski alan kaydı (tek tür Radiant, parça yok)', () => {
    const sc = cast('Flame Strike', 5, 82).events.find((e) => e.type === 'spell_cast' && e.area) as Extract<BattleEvent, { type: 'spell_cast' }> | undefined;
    expect(sc?.area?.parts).toBeUndefined();
    expect(sc?.area?.damageType).toBe('radiant');
  });
});

describe('B04: tepki büyüleri komutla (eylemle) yapılamaz (SRD "Casting Time: Reaction, which you take when …")', () => {
  for (const name of ['Shield', 'Counterspell', 'Feather Fall', 'Hellish Rebuke']) {
    it(`${name}: 83 red, slot harcanmaz; 82 eski davranış (kabul)`, () => {
      const parts = (): Combatant[] => [caster({ spellNames: [name] }), foe('T')];
      const cmd: Command = { type: 'cast_spell', actorId: 'A', spellName: name, slotLevel: name === 'Counterspell' ? 3 : 1, targetId: 'T' } as Command;
      const r83 = run(scene(83, parts()), cmd, hooked(PROBE));
      expect(r83.ok).toBe(false);
      expect(r83.error).toMatch(/tepki büyüsüdür/);
      expect(run(scene(82, parts()), cmd, hooked(PROBE)).ok).toBe(true);
    });
  }
});

describe('B08: Sacred Flame siperden yararlandırmaz (SRD "The target gains no benefit from Half Cover or Three-Quarters Cover for this save.")', () => {
  for (const [v, ok] of [[83, false], [82, true]] as const) {
    it(`${v}: yarım siperdeki hedefin DEX save'i ${ok ? '+2 ile geçer' : 'siper bonusu almaz'}`, () => {
      const s = scene(v, [caster({ spellNames: ['Sacred Flame'], pos: { col: 3, row: 5 } }), foe('T', { pos: { col: 7, row: 5 } })]);
      const tiles = s.map!.tiles.map((r, i) => (i === 5 ? `${r.slice(0, 5)}d${r.slice(6)}` : r));
      const r = run({ ...s, map: { ...s.map!, tiles } }, { type: 'cast_spell', actorId: 'A', spellName: 'Sacred Flame', targetId: 'T' } as Command, hooked({ one: 13, two: [13, 13] }));
      expect(r.ok, r.error).toBe(true);
      expect(saveOf(r.events, 'T')?.success).toBe(ok);
    });
  }
});

describe('B13: Holy Aura büyücüden 30 ft dost yayılımı (SRD "you emit an aura in a 30-foot Emanation. While in the aura, creatures of your choice have Advantage on all saving throws, and other creatures have Disadvantage on attack rolls against them")', () => {
  const ha: Command = { type: 'cast_spell', actorId: 'A', spellName: 'Holy Aura', slotLevel: 8 } as Command;
  const claw = { ...sword, label: 'Claw', attackBonus: 5, mastery: undefined };
  const parts = (): Combatant[] => [
    caster({ level: 15, spellNames: ['Holy Aura'], spellSlots: [4, 3, 3, 3, 2, 1, 1, 1, 0] }),
    mk('B', { ownerId: 'p1', hp: 50, maxHp: 50, ac: 12, pos: { col: 5, row: 5 } }),
    mk('C', { ownerId: 'p1', hp: 50, maxHp: 50, pos: { col: 13, row: 5 } }),
    foe('T', { pos: { col: 6, row: 5 }, creatureType: 'fiend', attacks: [claw] as never }),
  ];
  it('83: yayılımdaki dost ve büyücü yararlanır; 30 ft dışındaki dost ve düşman yararlanmaz', () => {
    const r = run(scene(83, parts()), ha, hooked(PROBE));
    expect(r.ok, r.error).toBe(true);
    const cs = r.state.combatants;
    expect(cs.A?.allyAura?.by).toBe('A');
    expect(cs.B?.allyAura).toMatchObject({ by: 'A', saveAdvAll: true, attackedDis: true });
    expect(cs.C?.allyAura).toBeUndefined();
    expect(cs.T?.allyAura).toBeUndefined();
    expect(saveMode('normal', cs.B as Combatant, 'wis')).toBe('advantage');
    expect(saveMode('normal', cs.T as Combatant, 'wis')).toBe('normal');
    expect(wardSources(r.state, cs.T as Combatant, cs.B as Combatant, { melee: true }).some((x) => x.effect === 'disadvantage' && x.reason === 'Holy Aura')).toBe(true);
  });
  it('83: yayılım büyücüyle yürür (yaklaşılan dost yararlanır, uzaklaşılan yitirir)', () => {
    const s = run(scene(83, parts()), ha, hooked(PROBE)).state;
    const m = run(s, { type: 'move', actorId: 'A', to: { col: 3, row: 9 } } as Command, hooked(PROBE));
    expect(m.ok, m.error).toBe(true);
    expect(m.state.combatants.B?.allyAura?.by).toBe('A');
    const far = { ...s, combatants: { ...s.combatants, B: { ...(s.combatants.B as Combatant), pos: { col: 11, row: 5 } } } };
    const m2 = run(far, { type: 'move', actorId: 'A', to: { col: 5, row: 5 } } as Command, hooked(PROBE));
    expect(m2.ok, m2.error).toBe(true);
    expect(m2.state.combatants.B?.allyAura?.by).toBe('A');
    expect(m2.state.combatants.C?.allyAura).toBeUndefined();
  });
  it('83: yakın dövüşte isabet ettiren Fiend CON save atar, başarısızsa Blinded', () => {
    const s = run(scene(83, parts()), ha, hooked(PROBE)).state;
    const tTurn = { ...s, turnIndex: s.order.indexOf('T') };
    const x = execute(tTurn, { type: 'attack', actorId: 'T', targetId: 'B', option: claw } as unknown as Command, GM, hooked({ one: 2, two: [19, 18] }));
    expect(x.ok, x.ok ? '' : x.error).toBe(true);
    const r = x as Extract<typeof x, { ok: true }>;
    const atk = r.events.find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }> | undefined;
    expect(atk?.mode).toBe('disadvantage');
    expect(saveOf(r.events, 'T')?.success).toBe(false);
    expect(r.state.combatants.T?.effects?.some((e) => e.grants?.includes('Blinded'))).toBe(true);
  });
  it('83: konsantrasyon bitince (başka konsantrasyon büyüsü) yararlar kalkar', () => {
    const p0 = parts();
    p0[0] = { ...(p0[0] as Combatant), spellNames: ['Holy Aura', 'Bless'] };
    const s = run(scene(83, p0), ha, hooked(PROBE)).state;
    expect(s.combatants.B?.allyAura?.by).toBe('A');
    const fresh = { ...s, combatants: { ...s.combatants, A: { ...(s.combatants.A as Combatant), economy: FRESH_ECONOMY } } };
    const r = run(fresh, { type: 'cast_spell', actorId: 'A', spellName: 'Bless', slotLevel: 1, targetIds: ['A'] } as Command, hooked(PROBE));
    expect(r.ok, r.error).toBe(true);
    expect(r.state.combatants.A?.effects?.some((e) => e.id === 'spells:holy-aura')).toBe(false);
    expect(r.state.combatants.B?.allyAura).toBeUndefined();
    expect(r.state.combatants.A?.allyAura).toBeUndefined();
  });
  it('82: eski davranış (etki yalnız büyücüde, dost yararlanmaz)', () => {
    const r = run(scene(82, parts()), ha, hooked(PROBE));
    expect(r.ok, r.error).toBe(true);
    expect(r.state.combatants.B?.allyAura).toBeUndefined();
    expect(r.state.combatants.A?.allyAura).toBeUndefined();
    expect(r.state.combatants.A?.effects?.some((e) => e.id === 'spells:holy-aura' && e.saveAdv?.length === 6)).toBe(true);
    expect(saveMode('normal', r.state.combatants.B as Combatant, 'wis')).toBe('normal');
  });
});

describe('B14: Weird yalnız seçilen yaratıkları etkiler (SRD "Each creature of your choice in a 30-foot-radius Sphere centered on a point within range makes a Wisdom saving throw")', () => {
  const parts = (): Combatant[] => [caster({ level: 17, spellNames: ['Weird'], spellSlots: [4, 3, 3, 3, 3, 2, 2, 1, 1] }),
    mk('B', { ownerId: 'p1', hp: 50, maxHp: 50, pos: { col: 7, row: 6 } }), foe('T', { pos: { col: 8, row: 5 } })];
  const cmd: Command = { type: 'cast_spell', actorId: 'A', spellName: 'Weird', slotLevel: 9, targetHex: { col: 8, row: 5 } } as Command;
  for (const [v, ally] of [[83, false], [82, true]] as const) {
    it(`${v}: alandaki dost ${ally ? 'etkilenir (eski davranış)' : 'etkilenmez'}, düşman etkilenir`, () => {
      const r = run(scene(v, parts()), cmd, hooked({ one: 2, two: [2, 2] }));
      expect(r.ok, r.error).toBe(true);
      expect(!!saveOf(r.events, 'T')).toBe(true);
      expect(!!saveOf(r.events, 'B')).toBe(ally);
      expect((r.state.combatants.B?.hp ?? 0) < 50).toBe(ally);
      expect(r.state.combatants.T?.hp).toBeLessThan(100);
    });
  }
});

describe('B15: Compulsion büyücü merkezli 30 ft (SRD "Range: 30 feet … Each creature of your choice that you can see within range must succeed on a Wisdom saving throw or have the Charmed condition")', () => {
  const parts = (): Combatant[] => [caster({ spellNames: ['Compulsion'], pos: { col: 10, row: 5 } }),
    foe('T', { pos: { col: 12, row: 5 } }), foe('U', { pos: { col: 8, row: 5 } }), foe('Z', { pos: { col: 17, row: 5 } }), mk('B', { ownerId: 'p1', pos: { col: 11, row: 6 } })];
  const cmd: Command = { type: 'cast_spell', actorId: 'A', spellName: 'Compulsion', slotLevel: 4, targetHex: { col: 11, row: 5 } } as Command;
  it('83: 30 ft içindeki düşmanlar save atar; 35 ft\'teki ve dost atmaz', () => {
    const r = run(scene(83, parts()), cmd, hooked(PROBE));
    expect(r.ok, r.error).toBe(true);
    expect(['T', 'U', 'Z', 'B'].map((id) => !!saveOf(r.events, id))).toEqual([true, true, false, false]);
  });
  it('82: eski küre büyücünün bitişiğinden 30 ft (35 ft\'teki de atar)', () => {
    const r = run(scene(82, parts()), cmd, hooked(PROBE));
    expect(r.ok, r.error).toBe(true);
    expect(['T', 'U', 'Z', 'B'].map((id) => !!saveOf(r.events, id))).toEqual([true, true, true, false]);
  });
});
