/**
 * Kuyruk A8: yükseklik ve alan geometrisi büyüleri (kural sürümü 37, mekaniğin `a8` hâli). Yeni davranış (37) ve eski (36);
 * replay aynı (`run` denetler).
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { triggerEvents } from './zones';
import { applyEvents } from './reduce';
import { castBarrierKind } from './castBarrier';
import { mechanicsAt, sigmayanNote } from './spellVersion';
import { GM, P1, mk } from './fixtures';
import { seededRng } from '../rules/dice';
import { spells } from '../data';
import { caster, field, run } from './k19spells.test';
import type { BattleEvent, BattleState, Combatant, Command, SpellZone } from './types';

const foe = (id: string, p: Partial<Combatant> = {}) => mk(id, { side: 'enemies', hp: 200, maxHp: 200, ...p });
const ally = (id: string, p: Partial<Combatant> = {}) => mk(id, { ownerId: 'p1', hp: 40, maxHp: 40, ...p });
const fx = (s: BattleState, id: string, srd: string) => s.combatants[id]?.effects?.find((e) => e.id === srd);
const pos = { A: { col: 2, row: 3 }, C: { col: 3, row: 3 }, F0: { col: 8, row: 3 } };
const cast = (spellName: string, extra: Partial<Command> = {}) => ({ type: 'cast_spell', actorId: 'A', spellName, ...extra }) as Command;
const ALL = [4, 3, 3, 3, 3, 2, 2, 1, 1];
const LOW = { str: -9, dex: -9, con: -9, int: -9, wis: -9, cha: -9 };
const wiz = (spellNames: string[], p: Partial<Combatant> = {}) => caster({ spellNames, spellSlots: ALL, ...p });
const tryCmd = (s: BattleState, cmd: Command, seed = 3) => execute(s, cmd, s.combatants[(cmd as { actorId: string }).actorId]?.side === 'enemies' ? GM : P1, seededRng(seed));
const nextRound = (s: BattleState): BattleState => ({ ...s, round: s.round + 1, combatants: Object.fromEntries(Object.entries(s.combatants).map(([k, c]) => [k, { ...c, movementUsed: 0, economy: { ...c.economy, action: false, bonus: false, slotTurn: null } }])) });
const note = (evs: BattleEvent[], name: string) => evs.some((e) => e.type === 'map_note' && e.text.startsWith(`Game Master notu — ${name}`));
const spell = (name: string) => spells.find((s) => s.name === name)!;
const zoneOf = (s: BattleState, name: string) => s.map?.zones?.find((z) => z.name === name) as SpellZone;
/** Yükseklik katmanlı düz harita (yalnızca `C` altıgeni seviye 2). */
const withHeights = (s: BattleState): BattleState => {
  const heights = Array.from({ length: 7 }, () => Array(15).fill(0) as number[]);
  (heights[3] as number[])[3] = 2;
  return { ...s, map: { ...(s.map as NonNullable<BattleState['map']>), heights } };
};

describe('A8-1 yükseklik', () => {
  it('Jump: katmanlı haritada komşu yüksek altıgene (20 ft) zıplar, 10 ft harcar (37)', () => {
    const s = withHeights(field([wiz(['Jump']), foe('F0')], { A: pos.A, F0: pos.F0 }, 37));
    const r = run(s, cast('Jump', { targetId: 'A' }));
    const j = run(r.state, { type: 'jump', actorId: 'A', to: { col: 3, row: 3 } });
    expect(j.state.combatants.A?.pos).toEqual({ col: 3, row: 3 });
    expect(j.events.find((e) => e.type === 'jumped')).toMatchObject({ cost: 2, gap: 0 });
  });
  it('Jump: 36\'da ve katmansız haritada eski kural (komşuya atlanmaz)', () => {
    const old = run(withHeights(field([wiz(['Jump']), foe('F0')], { A: pos.A, F0: pos.F0 }, 36)), cast('Jump', { targetId: 'A' }));
    expect(tryCmd(old.state, { type: 'jump', actorId: 'A', to: { col: 3, row: 3 } }).ok).toBe(false);
    const flat = run(field([wiz(['Jump']), foe('F0')], { A: pos.A, F0: pos.F0 }, 37), cast('Jump', { targetId: 'A' }));
    expect(tryCmd(flat.state, { type: 'jump', actorId: 'A', to: { col: 3, row: 3 } }).ok).toBe(false);
  });
  it('Flaming Sphere: küre 20 ft ışık saçar ve sığmayan parça günlüğe düşer (37)', () => {
    const r = run(field([wiz(['Flaming Sphere']), foe('F0')], pos, 37), cast('Flaming Sphere', { targetHex: { col: 4, row: 3 } }));
    expect(zoneOf(r.state, 'Flaming Sphere').spec?.light).toBe(4);
    expect(note(r.events, 'Flaming Sphere')).toBe(true);
  });
  it('Flaming Sphere: 36\'da ışık yok, not yok', () => {
    const r = run(field([wiz(['Flaming Sphere']), foe('F0')], pos, 36), cast('Flaming Sphere', { targetHex: { col: 4, row: 3 } }));
    expect(zoneOf(r.state, 'Flaming Sphere').spec?.light).toBeUndefined();
    expect(note(r.events, 'Flaming Sphere')).toBe(false);
  });
  it('Levitate: havada süzülme aynı, yükseklik parçası Game Master notu (37)', () => {
    const r = run(field([wiz(['Levitate']), foe('F0', { saves: LOW })], { A: pos.A, F0: { col: 4, row: 3 } }, 37), cast('Levitate', { targetId: 'F0' }), 5);
    expect(note(r.events, 'Levitate')).toBe(true);
    expect(mechanicsAt({ kuralSurumu: 37 }, spell('Levitate')).approx).toBeNull();
  });
  it('Levitate: 36\'da not yok, yaklaşık metni yerinde', () => {
    const r = run(field([wiz(['Levitate']), foe('F0', { saves: LOW })], { A: pos.A, F0: { col: 4, row: 3 } }, 36), cast('Levitate', { targetId: 'F0' }), 5);
    expect(note(r.events, 'Levitate')).toBe(false);
    expect(sigmayanNote({ kuralSurumu: 36 }, spell('Levitate'))).toBeNull();
  });
  it('Moonbeam: sonraki turda Magic eylemiyle en çok 60 ft taşınır (37)', () => {
    const r = run(field([wiz(['Moonbeam']), foe('F0')], { A: { col: 0, row: 3 }, F0: { col: 12, row: 3 } }, 37), cast('Moonbeam', { targetHex: { col: 1, row: 0 } }));
    const s2 = nextRound(r.state);
    expect(tryCmd(s2, { type: 'spell_followup', actorId: 'A', targetId: '', targetHex: { col: 14, row: 6 } }).ok).toBe(false);
    const m = run(s2, { type: 'spell_followup', actorId: 'A', targetId: '', targetHex: { col: 8, row: 0 } });
    expect(m.events.some((e) => e.type === 'zone_moved')).toBe(true);
    expect(note(r.events, 'Moonbeam')).toBe(true);
  });
  it('Moonbeam: 36\'da taşıma mesafe sınırı yok', () => {
    const r = run(field([wiz(['Moonbeam']), foe('F0')], { A: { col: 0, row: 3 }, F0: { col: 12, row: 3 } }, 36), cast('Moonbeam', { targetHex: { col: 1, row: 0 } }));
    expect(tryCmd(nextRound(r.state), { type: 'spell_followup', actorId: 'A', targetId: 'F0' }).ok).toBe(true);
  });
  it('Moonbeam: başarısız save biçim değiştireni gerçek biçimine döndürür (37); 36\'da dönmez', () => {
    for (const [k, gone] of [[37, true], [36, false]] as const) {
      const shaped = foe('F0', { saves: LOW, effects: [{ id: 'spells:polymorph', name: 'Polymorph', sourceId: 'X', until: 99, polymorph: true }] as Combatant['effects'] });
      const r = run(field([wiz(['Moonbeam']), shaped], { A: { col: 1, row: 3 }, F0: { col: 4, row: 3 } }, k), cast('Moonbeam', { targetHex: { col: 4, row: 3 } }));
      expect(!fx(r.state, 'F0', 'spells:polymorph')).toBe(gone);
    }
  });
  it('Spider Climb: tırmanma etkisi aynı; 37\'de yaklaşık metni kapanır', () => {
    for (const k of [37, 36]) {
      const r = run(field([wiz(['Spider Climb']), ally('C'), foe('F0')], pos, k), cast('Spider Climb', { targetId: 'C' }));
      expect(fx(r.state, 'C', 'spells:spider-climb')?.climb).toBe(true);
    }
    expect(mechanicsAt({ kuralSurumu: 37 }, spell('Spider Climb')).approx).toBeNull();
  });
  it('Spider Climb: kapsam dışı parça not üretmez (yalnızca veri)', () => {
    const r = run(field([wiz(['Spider Climb']), ally('C'), foe('F0')], pos, 37), cast('Spider Climb', { targetId: 'C' }));
    expect(note(r.events, 'Spider Climb')).toBe(false);
    expect(mechanicsAt({ kuralSurumu: 37 }, spell('Spider Climb')).kapsamDisi).toMatch(/tavan/);
  });
  it('Fly: uçuş hızı verir; büyü bitince düşme parçası Game Master notu (37)', () => {
    const r = run(field([wiz(['Fly']), ally('C'), foe('F0')], pos, 37), cast('Fly', { targetId: 'C' }));
    expect(fx(r.state, 'C', 'spells:fly')?.fly).toBe(60);
    expect(note(r.events, 'Fly')).toBe(true);
  });
  it('Fly: 36\'da not yok', () => {
    const r = run(field([wiz(['Fly']), ally('C'), foe('F0')], pos, 36), cast('Fly', { targetId: 'C' }));
    expect(note(r.events, 'Fly')).toBe(false);
  });
  it('Gaseous Form: bu biçimde büyü yapılamaz (37)', () => {
    const r = run(field([wiz(['Gaseous Form', 'Fire Bolt']), foe('F0')], pos, 37), cast('Gaseous Form', { targetId: 'A' }));
    expect(castBarrierKind(r.state, r.state.combatants.A as Combatant, spell('Fire Bolt'))).toBe('form');
    const s2 = nextRound(r.state);
    expect(tryCmd(s2, cast('Fire Bolt', { targetId: 'F0' })).ok).toBe(false);
    expect(note(r.events, 'Gaseous Form')).toBe(true);
  });
  it('Gaseous Form: 36\'da büyü engeli yok', () => {
    const r = run(field([wiz(['Gaseous Form', 'Fire Bolt']), foe('F0')], pos, 36), cast('Gaseous Form', { targetId: 'A' }));
    expect(castBarrierKind(r.state, r.state.combatants.A as Combatant, spell('Fire Bolt'))).toBeNull();
  });
  it('Sleet Storm: alan aynı (zorlu arazi, örtü); 37\'de yaklaşık metni kapanır', () => {
    const r = run(field([wiz(['Sleet Storm']), foe('F0')], pos, 37), cast('Sleet Storm', { targetHex: { col: 8, row: 3 } }));
    expect(zoneOf(r.state, 'Sleet Storm')).toBeDefined();
    expect(mechanicsAt({ kuralSurumu: 37 }, spell('Sleet Storm')).approx).toBeNull();
  });
  it('Sleet Storm: 36\'da aynı alan', () => {
    const r = run(field([wiz(['Sleet Storm']), foe('F0')], pos, 36), cast('Sleet Storm', { targetHex: { col: 8, row: 3 } }));
    expect(zoneOf(r.state, 'Sleet Storm').spec).toBeUndefined();
  });
});

describe('A8-2 alan', () => {
  it('Entangle: Restrained ve zorlu arazi aynı; 37\'de yaklaşık metni kapanır', () => {
    const r = run(field([wiz(['Entangle']), foe('F0', { saves: LOW })], pos, 37), cast('Entangle', { targetHex: { col: 8, row: 3 } }));
    expect(r.state.combatants.F0?.conditions).toContain('Restrained');
    expect(mechanicsAt({ kuralSurumu: 37 }, spell('Entangle')).approx).toBeNull();
  });
  it('Entangle: 36\'da aynı', () => {
    const r = run(field([wiz(['Entangle']), foe('F0', { saves: LOW })], pos, 36), cast('Entangle', { targetHex: { col: 8, row: 3 } }));
    expect(r.state.combatants.F0?.conditions).toContain('Restrained');
  });
  it('Fog Cloud: yoğun örtü alanı; 37\'de not yok, yaklaşık kapanır', () => {
    const r = run(field([wiz(['Fog Cloud']), foe('F0')], pos, 37), cast('Fog Cloud', { targetHex: { col: 8, row: 3 } }));
    expect(zoneOf(r.state, 'Fog Cloud')).toBeDefined();
    expect(note(r.events, 'Fog Cloud')).toBe(false);
    expect(mechanicsAt({ kuralSurumu: 37 }, spell('Fog Cloud')).approx).toBeNull();
  });
  it('Fog Cloud: 36\'da aynı', () => {
    const r = run(field([wiz(['Fog Cloud']), foe('F0')], pos, 36), cast('Fog Cloud', { targetHex: { col: 8, row: 3 } }));
    expect(zoneOf(r.state, 'Fog Cloud')).toBeDefined();
  });
  it('Plant Growth: dörtlü zorlu arazi; alan dışı bırakma Game Master notu (37)', () => {
    const r = run(field([wiz(['Plant Growth']), foe('F0')], pos, 37), cast('Plant Growth', { targetHex: { col: 8, row: 3 } }));
    expect(zoneOf(r.state, 'Plant Growth')).toBeDefined();
    expect(note(r.events, 'Plant Growth')).toBe(true);
  });
  it('Plant Growth: 36\'da not yok', () => {
    const r = run(field([wiz(['Plant Growth']), foe('F0')], pos, 36), cast('Plant Growth', { targetHex: { col: 8, row: 3 } }));
    expect(note(r.events, 'Plant Growth')).toBe(false);
  });
  it('Slow: hedefler 40 ft küpe sığmalı (37); 36\'da sınır yok', () => {
    const p = { A: { col: 1, row: 3 }, F0: { col: 4, row: 3 }, F1: { col: 14, row: 3 } };
    const s = (k: number) => field([wiz(['Slow'], { spellSaveDc: 10 }), foe('F0'), foe('F1')], p, k);
    expect(tryCmd(s(37), cast('Slow', { targetIds: ['F0', 'F1'] })).ok).toBe(false);
    expect(run(s(36), cast('Slow', { targetIds: ['F0', 'F1'] })).ok).toBe(true);
    expect(run(field([wiz(['Slow']), foe('F0'), foe('F1')], { ...p, F1: { col: 8, row: 3 } }, 37), cast('Slow', { targetIds: ['F0', 'F1'] })).ok).toBe(true);
  });
  it('Slow: yavaşlamış büyücünün somatik büyüsü d4 = 1\'de boşa gider (37); 36\'da gitmez', () => {
    const slowed = { id: 'spells:slow', name: 'Slow', sourceId: 'X', until: 99, slowed: true } as NonNullable<Combatant['effects']>[number];
    let failed = false;
    for (let seed = 1; seed < 40 && !failed; seed++) {
      const r = tryCmd(field([wiz(['Fire Bolt'], { effects: [slowed] }), foe('F0')], pos, 37), cast('Fire Bolt', { targetId: 'F0' }), seed);
      if (r.ok && r.events.some((e) => e.type === 'spell_cast' && /Slow: el hareketleri/.test(e.note ?? ''))) {
        failed = true;
        expect(r.events.some((e) => e.type === 'attack_resolved')).toBe(false);
      }
    }
    expect(failed).toBe(true);
    for (let seed = 1; seed < 40; seed++) {
      const r = tryCmd(field([wiz(['Fire Bolt'], { effects: [slowed] }), foe('F0')], pos, 36), cast('Fire Bolt', { targetId: 'F0' }), seed);
      expect(r.ok && r.events.some((e) => e.type === 'spell_cast' && /Slow: el hareketleri/.test(e.note ?? ''))).toBe(false);
    }
  });
  it('Stinking Cloud: başarısızlıkta Poisoned + eylem/bonus yasağı, tepki serbest (37)', () => {
    const r = run(field([wiz(['Stinking Cloud']), foe('F0', { saves: LOW })], pos, 37), cast('Stinking Cloud', { targetHex: { col: 8, row: 3 } }));
    const t = triggerEvents(r.state, zoneOf(r.state, 'Stinking Cloud'), 'F0', seededRng(2));
    const held = t.find((e) => e.type === 'effect_added');
    expect(held).toMatchObject({ effect: { grants: ['Poisoned'], noActBonus: true } });
    // Eylem yasak, tepki serbest.
    const s2 = { ...applyEvents(r.state, t), turnIndex: 1 };
    expect(tryCmd(s2, { type: 'dodge', actorId: 'F0' } as Command).ok).toBe(false);
    expect(s2.combatants.F0?.conditions ?? []).not.toContain('Incapacitated');
  });
  it('Stinking Cloud: 36\'da Poisoned + Incapacitated', () => {
    const r = run(field([wiz(['Stinking Cloud']), foe('F0', { saves: LOW })], pos, 36), cast('Stinking Cloud', { targetHex: { col: 8, row: 3 } }));
    const t = triggerEvents(r.state, zoneOf(r.state, 'Stinking Cloud'), 'F0', seededRng(2));
    expect(t.find((e) => e.type === 'effect_added')).toMatchObject({ effect: { grants: ['Poisoned', 'Incapacitated'] } });
  });
  it('Wind Wall: değdiği gaz bulutunu dağıtır (37); 36\'da dağıtmaz', () => {
    for (const [k, gone] of [[37, true], [36, false]] as const) {
      // Sis başka bir büyücünün (C) konsantrasyonunda; A'nın duvarı ona değer.
      const c2 = caster({ spellNames: ['Fog Cloud'], spellSlots: ALL }); const cMage = { ...c2, id: 'C', name: 'C' };
      const s0 = field([wiz(['Wind Wall']), cMage, foe('F0')], { A: { col: 1, row: 3 }, C: { col: 1, row: 5 }, F0: { col: 13, row: 3 } }, k);
      const r1 = run({ ...s0, turnIndex: 1 }, { type: 'cast_spell', actorId: 'C', spellName: 'Fog Cloud', targetHex: { col: 7, row: 3 } } as Command);
      const r2 = run({ ...r1.state, turnIndex: 0 }, cast('Wind Wall', { targetHex: { col: 7, row: 3 } }));
      expect(!zoneOf(r2.state, 'Fog Cloud')).toBe(gone);
    }
  });
  it('Wind Wall: serbest biçim Game Master notu (37)', () => {
    const r = run(field([wiz(['Wind Wall']), foe('F0')], pos, 37), cast('Wind Wall', { targetHex: { col: 6, row: 3 } }));
    expect(note(r.events, 'Wind Wall')).toBe(true);
  });
  it('Meteor Swarm: dört nokta, her yaratık bir kez (37)', () => {
    const p = { A: { col: 0, row: 0 }, F0: { col: 3, row: 3 }, F1: { col: 12, row: 3 } };
    const s = field([wiz(['Meteor Swarm']), foe('F0'), foe('F1')], p, 37);
    const r = run(s, cast('Meteor Swarm', { targetHexes: [{ col: 3, row: 3 }, { col: 12, row: 3 }, { col: 3, row: 4 }] }));
    const saves = r.events.filter((e) => e.type === 'save_resolved');
    expect(saves.filter((e) => e.targetId === 'F0')).toHaveLength(1);
    expect(saves.filter((e) => e.targetId === 'F1')).toHaveLength(1);
    expect(note(r.events, 'Meteor Swarm')).toBe(true);
  });
  it('Meteor Swarm: 36\'da tek nokta (ikinci noktadaki etkilenmez)', () => {
    const p = { A: { col: 0, row: 0 }, F0: { col: 3, row: 3 }, F1: { col: 12, row: 3 } };
    const r = run(field([wiz(['Meteor Swarm']), foe('F0'), foe('F1')], p, 36), cast('Meteor Swarm', { targetHex: { col: 3, row: 3 }, targetHexes: [{ col: 3, row: 3 }, { col: 12, row: 3 }] }));
    expect(r.events.some((e) => e.type === 'save_resolved' && e.targetId === 'F1')).toBe(false);
  });
});

describe('K57 Meteor Swarm arayüz ve yapay zekâ', () => {
  it('yapay zekâ iki uzak düşman grubunu ayrı noktalarla kapsar, dostu kapsamaz', async () => {
    const { multiPointAim } = await import('./ai');
    // 40 ft küre 8 altıgen yarıçap: 48×17 düz harita, üç ayrı düşman kümesi, aralarında dost.
    const p = { A: { col: 0, row: 8 }, F0: { col: 20, row: 2 }, F1: { col: 40, row: 2 }, F2: { col: 40, row: 15 }, B: { col: 26, row: 15 } };
    const s0 = field([wiz(['Meteor Swarm']), foe('F0'), foe('F1'), foe('F2'), ally('B')], p, 37);
    const s = { ...s0, map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 17 }, () => '.'.repeat(48)) } };
    const sp = spell('Meteor Swarm');
    const foes = ['F0', 'F1', 'F2'].map((id) => s.combatants[id] as Combatant);
    const pts = multiPointAim(s, s.combatants.A as Combatant, sp.area!, sp.rangeFt, foes, 4);
    expect(pts).not.toBeNull();
    const r = run(s, cast('Meteor Swarm', { targetHex: pts![0], targetHexes: pts! }));
    const hit = new Set(r.events.flatMap((e) => (e.type === 'save_resolved' ? [e.targetId] : [])));
    expect([...hit].sort()).toEqual(['F0', 'F1', 'F2']);
    expect(pts!.length).toBe(3);
  });
  it('arayüz önizlemesi noktaları birleştirir, komut targetHexes taşır', async () => {
    const { areaActPreview, areaActCommand, areaPointCount } = await import('../ui/hud');
    const p = { A: { col: 0, row: 0 }, F0: { col: 3, row: 3 }, F1: { col: 12, row: 3 } };
    const s = field([wiz(['Meteor Swarm']), foe('F0'), foe('F1')], p, 37);
    const act = { kind: 'spell' as const, spell: spell('Meteor Swarm') };
    expect(areaPointCount(s, act)).toBe(4);
    expect(areaPointCount({ ...s, kuralSurumu: 36 }, act)).toBe(1);
    const pts = [{ col: 3, row: 3 }, { col: 12, row: 3 }];
    const one = areaActPreview(s, s.combatants.A as Combatant, act, pts[0]!);
    const two = areaActPreview(s, s.combatants.A as Combatant, act, pts[0]!, null, pts);
    expect(one.foes.map((c) => c.id)).toEqual(['F0']);
    expect(two.foes.map((c) => c.id).sort()).toEqual(['F0', 'F1']);
    expect(two.hexes.length).toBeGreaterThan(one.hexes.length);
    expect(areaActCommand('A', act, null, null, null, null, pts)).toMatchObject({ targetHex: pts[0], targetHexes: pts });
  });
});
