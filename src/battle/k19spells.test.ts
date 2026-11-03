/** Kuyruk 19 (0a): 4–5. seviye büyülerin tam SRD yan etkileri (anahtar `spellsK19`, kural sürümü 16). */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { replay } from './reduce';
import { GM, P1, mk, sword } from './fixtures';
import { seededRng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const SPELLS = ['Ice Storm', 'Flame Strike', 'Vitriolic Sphere', 'Blight'];
export function caster(extra: Partial<Combatant> = {}): Combatant {
  return mk('A', { ownerId: 'p1', spellNames: SPELLS, spellSlots: [4, 3, 3, 3, 3, 0, 0, 0, 0], spellSaveDc: 30, spellAttack: 10, spellMod: 5, casterTag: 'wizard', ...extra });
}
export function field(parts: Combatant[], pos: Record<string, { col: number; row: number }>, kuralSurumu = 16, toggles?: Record<string, boolean>): BattleState {
  const s = startBattle('k19', 'd-z-zemin', parts, () => 0.5, { kuralSurumu, map: { id: 'col', ...(toggles ? { ruleToggles: toggles } : {}) } }).state;
  const combatants = { ...s.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return { ...s, status: 'active', order: parts.map((c) => c.id), turnIndex: 0, combatants,
    map: { ...(s.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } };
}
export function run(s: BattleState, cmd: Command, seed = 3) {
  const r = execute(s, cmd, cmd.type === 'cast_spell' && s.combatants[cmd.actorId]?.side === 'enemies' ? GM : P1, seededRng(seed));
  if (!r.ok) throw new Error(r.error);
  expect(replay([{ type: 'battle_started', state: s }, ...r.events] as BattleEvent[])).toEqual(r.state);
  return r;
}
const foes = (n: number, p: Partial<Combatant> = {}) => Array.from({ length: n }, (_, i) => mk(`F${i}`, { side: 'enemies', hp: 200, maxHp: 200, ...p }));

describe('Kuyruk 19: Ice Storm ve Flame Strike (iki hasar türü)', () => {
  const pos = { A: { col: 1, row: 3 }, F0: { col: 8, row: 3 }, F1: { col: 8, row: 4 } };
  it('Ice Storm: Bludgeoning + Cold ayrı, alanda zorlu arazi; anahtar kapalı/eski sürüm: tek Cold zarı, zemin yok', () => {
    const cmd: Command = { type: 'cast_spell', actorId: 'A', spellName: 'Ice Storm', targetHex: { col: 8, row: 3 } };
    const r = run(field([caster(), ...foes(2)], pos), cmd);
    const sv = r.events.find((e) => e.type === 'save_resolved') as Extract<BattleEvent, { type: 'save_resolved' }>;
    expect(sv.damageType).toBe('bludgeoning');
    expect(sv.secondary?.type).toBe('cold');
    expect(sv.appliedDamage).toBe(sv.rawDamage + (sv.secondary?.raw ?? 0));
    expect(r.events.some((e) => e.type === 'zone_created' && e.zone.spellId === 'ice-storm')).toBe(true);
    for (const s of [field([caster(), ...foes(2)], pos, 16, { spellsK19: false }), field([caster(), ...foes(2)], pos, 15)]) {
      const q = run(s, cmd);
      const sv2 = q.events.find((e) => e.type === 'save_resolved') as Extract<BattleEvent, { type: 'save_resolved' }>;
      expect([sv2.damageType, sv2.secondary]).toEqual(['cold', undefined]);
      expect(q.events.some((e) => e.type === 'zone_created')).toBe(false);
    }
  });
  it('Flame Strike: Fire + Radiant; Fire\'a bağışık hedef yalnızca Radiant alır', () => {
    const r = run(field([caster(), ...foes(1, { immunities: ['fire'] })], pos), { type: 'cast_spell', actorId: 'A', spellName: 'Flame Strike', targetHex: { col: 8, row: 3 } });
    const sv = r.events.find((e) => e.type === 'save_resolved') as Extract<BattleEvent, { type: 'save_resolved' }>;
    expect([sv.damageType, sv.secondary?.type]).toEqual(['fire', 'radiant']);
    expect(sv.appliedDamage).toBe(sv.secondary?.applied);
  });
});

describe('Kuyruk 19: Vitriolic Sphere ve Blight', () => {
  const pos = { A: { col: 1, row: 3 }, F0: { col: 8, row: 3 } };
  it('Vitriolic Sphere: başarısız hedefe gecikmeli 5d4 Acid etkisi; anahtar kapalıyken yok', () => {
    const cmd: Command = { type: 'cast_spell', actorId: 'A', spellName: 'Vitriolic Sphere', targetHex: { col: 8, row: 3 } };
    const r = run(field([caster(), ...foes(1)], pos), cmd);
    expect(r.state.combatants.F0?.effects?.some((e) => e.delayed?.dice === '5d4' && e.delayed.type === 'acid')).toBe(true);
    const off = run(field([caster(), ...foes(1)], pos, 16, { spellsK19: false }), cmd);
    expect(off.state.combatants.F0?.effects?.some((e) => e.delayed) ?? false).toBe(false);
  });
  it('Blight: Plant save\'i otomatik kaçırır; eski sürümde zar atar', () => {
    const plant = mk('F0', { side: 'enemies', hp: 200, maxHp: 200, creatureType: 'plant', saves: { str: 0, dex: 0, con: 40, int: 0, wis: 0, cha: 0 } });
    const cmd: Command = { type: 'cast_spell', actorId: 'A', spellName: 'Blight', targetId: 'F0' };
    const sv = (q: ReturnType<typeof run>) => q.events.find((e) => e.type === 'save_resolved') as Extract<BattleEvent, { type: 'save_resolved' }>;
    const on = sv(run(field([caster(), plant], { A: { col: 1, row: 3 }, F0: { col: 4, row: 3 } }), cmd));
    expect([on.success, on.natural]).toEqual([false, null]);
    const old = sv(run(field([caster(), plant], { A: { col: 1, row: 3 }, F0: { col: 4, row: 3 } }, 15), cmd));
    expect(old.success).toBe(true);
  });
});

import { effectTurnEndEvents } from './effects';

describe('Kuyruk 19: Phantasmal Killer', () => {
  const pos = { A: { col: 1, row: 3 }, F0: { col: 4, row: 3 } };
  const low = { str: -9, dex: -9, con: -9, int: -9, wis: -9, cha: -9 };
  it('başarısızlıkta saldırı/kontrol dezavantajı ve tur sonu save: başarısızsa hasar yinelenir; eski sürümde etki yok', () => {
    const cmd: Command = { type: 'cast_spell', actorId: 'A', spellName: 'Phantasmal Killer', targetId: 'F0' };
    const c = caster({ spellNames: [...SPELLS, 'Phantasmal Killer'] });
    const r = run(field([c, ...foes(1, { saves: low })], pos), cmd);
    const eff = r.state.combatants.F0?.effects?.find((e) => e.id === 'spells:phantasmal-killer');
    expect(eff?.attackDis).toBeDefined();
    expect(eff?.checkDis).toContain('wis');
    expect(eff?.repeatSave?.failDamage?.type).toBe('psychic');
    const hp0 = r.state.combatants.F0?.hp ?? 0;
    const tick = effectTurnEndEvents(r.state, 'F0', seededRng(5));
    const t = tick.find((e) => e.type === 'effect_tick') as Extract<BattleEvent, { type: 'effect_tick' }>;
    expect(t.save?.success).toBe(false);
    expect(t.appliedDamage).toBeGreaterThan(0);
    expect(t.targetHpAfter).toBe(hp0 - t.appliedDamage);
    const old = run(field([c, ...foes(1, { saves: low })], pos, 15), cmd);
    expect(old.state.combatants.F0?.effects?.some((e) => e.id === 'spells:phantasmal-killer') ?? false).toBe(false);
  });
});

import { effectTurnStartEvents } from './effects';

describe('Kuyruk 19: Aura of Life ve Black Tentacles', () => {
  it('Aura of Life: 30 ft içindeki dostlar Necrotic dirençli; 0 HP\'deki dost tur başında 1 HP; eski sürümde 6 hedefli etki', () => {
    const c = caster({ spellNames: ['Aura of Life'] });
    const ally = mk('B', { ownerId: 'p1', hp: 0, maxHp: 20, life: 'dying' });
    const far = mk('C', { ownerId: 'p1', hp: 10, maxHp: 20 });
    const s = field([c, ally, far, ...foes(1)], { A: { col: 2, row: 3 }, B: { col: 3, row: 3 }, C: { col: 14, row: 0 }, F0: { col: 10, row: 3 } });
    const r = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Aura of Life', targetIds: ['A'] });
    expect(r.state.combatants.A?.auraResist).toEqual(['necrotic']);
    expect(r.state.combatants.B?.auraResist).toEqual(['necrotic']);
    expect(r.state.combatants.C?.auraResist).toBeUndefined();
    const st = effectTurnStartEvents(r.state, 'B', seededRng(1));
    expect(st.events.some((e) => e.type === 'healed' && e.targetId === 'B' && e.targetHpAfter === 1)).toBe(true);
    const old = run(field([c, ally, far, ...foes(1)], { A: { col: 2, row: 3 }, B: { col: 3, row: 3 }, C: { col: 14, row: 0 }, F0: { col: 10, row: 3 } }, 15),
      { type: 'cast_spell', actorId: 'A', spellName: 'Aura of Life', targetIds: ['A'] });
    expect(old.state.combatants.A?.effects?.some((e) => e.auraLife) ?? false).toBe(false);
  });
});

import { scripted } from './fixtures';

describe('Kuyruk 19: Fire Shield', () => {
  it('soğuk direnç seçilince yakın dövüşte vurana 2d8 Fire; uzaktan vurana ya da anahtar kapalıyken yok', () => {
    const c = caster({ spellNames: ['Fire Shield'], hp: 60, maxHp: 60 });
    const s0 = field([c, mk('F0', { side: 'enemies', hp: 50, maxHp: 50 })], { A: { col: 3, row: 3 }, F0: { col: 4, row: 3 } });
    const cast = run(s0, { type: 'cast_spell', actorId: 'A', spellName: 'Fire Shield', targetIds: ['A'], choice: 'cold' } as Command);
    expect(cast.state.combatants.A?.effects?.find((e) => e.retort)?.retort).toEqual({ dice: '2d8', type: 'fire' });
    const hit = (s: BattleState) => execute({ ...s, turnIndex: 1 }, { type: 'attack', actorId: 'F0', targetId: 'A', option: sword }, GM, scripted([20, 18], [8, 5], [8, 4], [8, 3]));
    const r = hit(cast.state);
    expect(r.ok && r.events.some((e) => e.type === 'effect_tick' && e.targetId === 'F0' && e.damageType === 'fire')).toBe(true);
    const off = hit({ ...cast.state, map: { ...(cast.state.map as NonNullable<BattleState['map']>), ruleToggles: { spellsK19: false } } });
    expect(off.ok && off.events.some((e) => e.type === 'effect_tick' && e.targetId === 'F0')).toBe(false);
  });
});

import { moveCostFn } from './movement';
import { speedHexes } from './reduce';

describe('Kuyruk 19: Freedom of Movement', () => {
  it('zorlu arazi 1 maliyet, Slow hızı düşürmez, yakalamadan 5 ft ile eylemsiz kurtulur; eski sürümde etki yalnızca bağışıklık', () => {
    const c = caster({ spellNames: ['Freedom of Movement'] });
    const s0 = field([c, ...foes(1)], { A: { col: 2, row: 3 }, F0: { col: 12, row: 3 } });
    const s = { ...s0, map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, (_, r) => (r === 3 ? '...nnnn........' : '...............')) } };
    const r = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Freedom of Movement', targetIds: ['A'] });
    const a = r.state.combatants.A as Combatant;
    expect(a.effects?.some((e) => e.freeMove)).toBe(true);
    expect(moveCostFn(r.state, a)({ col: 3, row: 3 }, { col: 2, row: 3 })).toBe(1);
    const slowed = { ...a, effects: [...(a.effects ?? []), { id: 'slow', name: 'Slow', sourceId: 'F0', speedMult: 0.5 }] };
    expect(speedHexes(slowed)).toBe(speedHexes(a));
    const grabbed = { ...r.state, combatants: { ...r.state.combatants, A: { ...a, grapple: { by: 'F0', escapeDc: 30, restrained: false } } } };
    const esc = execute(grabbed, { type: 'escape_grapple', actorId: 'A' }, P1, () => 0.5);
    expect(esc.ok && esc.state.combatants.A?.grapple).toBeUndefined();
    expect(esc.ok && esc.events.some((e) => e.type === 'action_used')).toBe(false);
    const old = run({ ...s, kuralSurumu: 15 }, { type: 'cast_spell', actorId: 'A', spellName: 'Freedom of Movement', targetIds: ['A'] });
    expect(old.state.combatants.A?.effects?.some((e) => e.freeMove) ?? false).toBe(false);
  });
});

describe('Kuyruk 19: Conjure Minor Elementals', () => {
  it('15 ft içindeki hedefe +2d8 (hedefe en çok işleyen tür), düşmana zorlu arazi; uzak hedefe ek zar yok', () => {
    const c = caster({ spellNames: ['Conjure Minor Elementals'] });
    const near = mk('F0', { side: 'enemies', hp: 99, maxHp: 99, resistances: ['acid', 'cold', 'fire'] });
    const far = mk('F1', { side: 'enemies', hp: 99, maxHp: 99 });
    const s = field([c, near, far], { A: { col: 3, row: 3 }, F0: { col: 4, row: 3 }, F1: { col: 9, row: 3 } });
    const r = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Conjure Minor Elementals', targetId: 'A' });
    expect(r.state.map?.zones?.some((z) => z.spellId === 'conjure-minor-elementals' && z.anchorId === 'A')).toBe(true);
    expect(moveCostFn(r.state, r.state.combatants.F0 as Combatant)({ col: 3, row: 2 }, { col: 4, row: 2 })).toBe(2);
    const st = { ...r.state, combatants: { ...r.state.combatants, A: { ...(r.state.combatants.A as Combatant), economy: { ...(r.state.combatants.A as Combatant).economy, action: false } } } };
    const hit = execute(st, { type: 'attack', actorId: 'A', targetId: 'F0', option: sword }, P1, scripted([20, 18], [8, 5], [8, 4], [8, 3], [8, 2]));
    const atk = hit.ok ? hit.events.find((e) => e.type === 'attack_resolved') as { extra?: Array<{ label: string; type: string }> } : undefined;
    expect(atk?.extra?.find((x) => x.label === 'Conjure Minor Elementals')?.type).toBe('lightning');
  });
});

import { zoneDriftEvents } from './zones';

describe('Kuyruk 19: Cloudkill', () => {
  it('bulut büyücünün tur başında ondan 10 ft (2 altıgen) uzaklaşır; anahtar kapalıyken durur', () => {
    const c = caster({ spellNames: ['Cloudkill'] });
    const s = field([c, ...foes(1)], { A: { col: 1, row: 3 }, F0: { col: 13, row: 0 } });
    const r = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Cloudkill', targetHex: { col: 6, row: 3 } });
    const z = r.state.map?.zones?.find((x) => x.spellId === 'cloudkill');
    expect(z).toBeDefined();
    const ev = zoneDriftEvents(r.state, 'A');
    const moved = ev.find((e) => e.type === 'zone_moved') as Extract<BattleEvent, { type: 'zone_moved' }>;
    const avg = (hs: Array<{ col: number }>) => hs.reduce((n, h) => n + h.col, 0) / hs.length;
    expect(avg(moved.hexes)).toBeGreaterThan(avg(z?.hexes ?? []));
    const off = { ...r.state, map: { ...(r.state.map as NonNullable<BattleState['map']>), ruleToggles: { spellsK19: false } } };
    expect(zoneDriftEvents(off, 'A')).toEqual([]);
  });
});

describe('Kuyruk 19: Compulsion', () => {
  const pos = { A: { col: 2, row: 3 }, B: { col: 8, row: 3 }, F0: { col: 4, row: 3 } };
  it('bonus eylemle yön: büyülenen hedef sonraki turunda o yöne ilerler, yön silinir; yön yokken hareket yok; eski sürümde kaçış', () => {
    const cast: Command = { type: 'cast_spell', actorId: 'A', spellName: 'Compulsion', targetHex: { col: 4, row: 3 } };
    const party = () => [caster({ spellNames: ['Compulsion'], casterTag: 'bard' }), mk('B', { ownerId: 'p1' }), ...foes(1, { speed: 30 })];
    const r = run(field(party(), pos), cast);
    expect(r.state.combatants.F0?.effects?.find((e) => e.id === 'spells:compulsion')?.compel).toEqual({});
    const dir = run(r.state, { type: 'spell_followup', actorId: 'A', targetId: 'B' });
    expect(dir.state.combatants.F0?.effects?.find((e) => e.id === 'spells:compulsion')?.compel?.dir).toBeDefined();
    const s2 = { ...dir.state, order: ['A', 'F0', 'B'] };
    const moved = run(s2, { type: 'end_turn', actorId: 'A' });
    const f0 = moved.state.combatants.F0 as Combatant;
    expect(f0.pos?.col).toBeGreaterThan(4);
    expect(f0.effects?.find((e) => e.id === 'spells:compulsion')?.compel).toEqual({});
    // Yön seçilmeden tur: hareket yok.
    const idle = run({ ...r.state, order: ['A', 'F0', 'B'] }, { type: 'end_turn', actorId: 'A' });
    expect(idle.state.combatants.F0?.pos).toEqual({ col: 4, row: 3 });
    // Eski sürüm: yön seçimi yok.
    const old = run(field(party(), pos, 15), cast);
    expect(execute(old.state, { type: 'spell_followup', actorId: 'A', targetId: 'B' }, P1, seededRng(1)).ok).toBe(false);
  });
});

describe('Kuyruk 19: Contagion', () => {
  const pos = { A: { col: 2, row: 3 }, F0: { col: 3, row: 3 } };
  it('Poisoned + seçilen yetenekte save dezavantajı; üç başarıda biter, üç başarısızlıkta kalıcı; eski sürümde durum zamanlayıcısı', () => {
    const cmd: Command = { type: 'cast_spell', actorId: 'A', spellName: 'Contagion', targetId: 'F0', choice: 'wis' };
    const party = () => [caster({ spellNames: ['Contagion'], casterTag: 'cleric' }), ...foes(1)];
    const r = run(field(party(), pos), cmd);
    const e = r.state.combatants.F0?.effects?.find((x) => x.id === 'spells:contagion');
    expect(e?.saveDis).toEqual(['wis']);
    expect(e?.repeatSave?.tally).toEqual({ need: 3, s: 0, f: 0 });
    expect(r.state.combatants.F0?.conditions).toContain('Poisoned');
    // Üç tur sonu save'i (DC 30: hep başarısız) → kalıcı, save'ler durur.
    let s = { ...r.state, order: ['F0', 'A'], turnIndex: 0 };
    for (let i = 0; i < 3; i++) { const q = execute({ ...s, turnIndex: 0 }, { type: 'end_turn', actorId: 'F0' }, GM, seededRng(10 + i)); if (!q.ok) throw new Error(q.error); s = q.state; }
    const after = s.combatants.F0?.effects?.find((x) => x.id === 'spells:contagion');
    expect(after?.repeatSave).toBeUndefined();
    expect(s.combatants.F0?.conditions).toContain('Poisoned');
    const old = run(field(party(), pos, 15), cmd);
    expect(old.state.combatants.F0?.effects?.some((x) => x.id === 'spells:contagion')).toBeFalsy();
    expect(old.state.combatants.F0?.conditions).toContain('Poisoned');
  });
});

describe('Kuyruk 19: Confusion', () => {
  const pos = { A: { col: 2, row: 3 }, F0: { col: 8, row: 3 }, F1: { col: 9, row: 3 } };
  it('tur başında d10: kaybedilen tur, rastgele saldırı ya da serbest; bonus eylem/tepki yok; eski sürümde her tur kayıp', () => {
    const cmd: Command = { type: 'cast_spell', actorId: 'A', spellName: 'Confusion', targetHex: { col: 8, row: 3 } };
    const party = () => [caster({ spellNames: ['Confusion'] }), ...foes(2, { weaponOptions: [sword] })];
    const r = run(field(party(), pos), cmd);
    const e = r.state.combatants.F0?.effects?.find((x) => x.id === 'spells:confusion');
    expect([e?.confused, e?.noBonus, e?.noReactions]).toEqual([true, true, true]);
    const seen = new Set<string>();
    for (let seed = 1; seed < 80 && seen.size < 3; seed++) {
      const q = execute({ ...r.state, order: ['A', 'F0', 'F1'], turnIndex: 0 }, { type: 'end_turn', actorId: 'A' }, P1, seededRng(seed));
      if (!q.ok) throw new Error(q.error);
      const n = q.events.find((x) => x.type === 'map_note' && x.text.includes('Confusion d10')) as Extract<BattleEvent, { type: 'map_note' }> | undefined;
      if (!n) continue;
      if (/seçer/.test(n.text)) seen.add('free');
      else if (/saldırır/.test(n.text)) { seen.add('strike'); expect(q.events.some((x) => x.type === 'attack_resolved' || x.type === 'save_resolved')).toBe(true); }
      else if (/hareket etmez/.test(n.text)) seen.add('lost');
    }
    expect([...seen].sort()).toEqual(['free', 'lost', 'strike']);
    const old = run(field(party(), pos, 15), cmd);
    expect(old.state.combatants.F0?.effects?.find((x) => x.id === 'spells:confusion')?.confused).toBeUndefined();
  });
});

describe('Kuyruk 19: Guardian of Faith ve Faithful Hound', () => {
  it('Guardian: merkez geçilmez, dolu altıgende belirmez, 60 hasarda kaybolur; eski sürümde merkez/bütçe yok', async () => {
    const { terrainAt } = await import('./movement');
    const pos = { A: { col: 2, row: 3 }, F0: { col: 5, row: 3 } };
    const party = () => [caster({ spellNames: ['Guardian of Faith'], casterTag: 'cleric' }), ...foes(1, { hp: 500, maxHp: 500 })];
    expect(execute(field(party(), pos), { type: 'cast_spell', actorId: 'A', spellName: 'Guardian of Faith', targetHex: { col: 5, row: 3 } }, P1, seededRng(1)).ok).toBe(false);
    const r = run(field(party(), pos), { type: 'cast_spell', actorId: 'A', spellName: 'Guardian of Faith', targetHex: { col: 4, row: 3 } });
    expect(terrainAt(r.state, { col: 4, row: 3 }).movement).toBe('blocked');
    let s = r.state;
    for (let i = 0; i < 6 && s.map?.zones?.some((z) => z.spellId === 'guardian-of-faith'); i++) {
      const q = execute({ ...s, order: ['A', 'F0'], turnIndex: 0 }, { type: 'end_turn', actorId: 'A' }, P1, seededRng(20 + i));
      if (!q.ok) throw new Error(q.error);
      const q2 = execute(q.state, { type: 'end_turn', actorId: 'F0' }, GM, seededRng(40 + i));
      if (!q2.ok) throw new Error(q2.error);
      s = q2.state;
    }
    expect(s.map?.zones?.some((z) => z.spellId === 'guardian-of-faith')).toBe(false);
    expect(500 - (s.combatants.F0?.hp ?? 0)).toBeGreaterThanOrEqual(60);
    const old = run(field(party(), pos, 15), { type: 'cast_spell', actorId: 'A', spellName: 'Guardian of Faith', targetHex: { col: 4, row: 3 } });
    expect(terrainAt(old.state, { col: 4, row: 3 }).movement).not.toBe('blocked');
  });
  it('Hound: büyücünün tur başında tek düşmana ısırık, düşmanın turunda değil; Magic eylemiyle 30 ft taşınır', () => {
    const pos = { A: { col: 1, row: 3 }, F0: { col: 6, row: 3 }, F1: { col: 6, row: 4 } };
    const party = () => [caster({ spellNames: ['Faithful Hound'] }), ...foes(2)];
    const r = run(field(party(), pos), { type: 'cast_spell', actorId: 'A', spellName: 'Faithful Hound', targetHex: { col: 5, row: 3 } });
    // Düşmanın tur başı: ısırık yok.
    const foeTurn = execute({ ...r.state, order: ['A', 'F0', 'F1'], turnIndex: 0 }, { type: 'end_turn', actorId: 'A' }, P1, seededRng(2));
    if (!foeTurn.ok) throw new Error(foeTurn.error);
    expect(foeTurn.events.some((e) => e.type === 'save_resolved' && e.label === 'Faithful Hound')).toBe(false);
    // Büyücünün tur başı: tek ısırık.
    const mine = execute({ ...r.state, order: ['F0', 'A', 'F1'], turnIndex: 0 }, { type: 'end_turn', actorId: 'F0' }, GM, seededRng(3));
    if (!mine.ok) throw new Error(mine.error);
    expect(mine.events.filter((e) => e.type === 'save_resolved' && e.label === 'Faithful Hound')).toHaveLength(1);
    const mv = run({ ...r.state, combatants: { ...r.state.combatants, A: { ...(r.state.combatants.A as Combatant), economy: { ...(r.state.combatants.A as Combatant).economy, action: false } } } },
      { type: 'spell_followup', actorId: 'A', targetId: 'A', targetHex: { col: 8, row: 3 } });
    expect(mv.state.map?.zones?.find((z) => z.spellId === 'faithful-hound')?.center).toEqual({ col: 8, row: 3 });
    expect(execute(r.state, { type: 'spell_followup', actorId: 'A', targetId: 'A', targetHex: { col: 13, row: 3 } }, P1, seededRng(1)).ok).toBe(false);
  });
});

describe('Kuyruk 19: Dimension Door ve Tree Stride', () => {
  it('Dimension Door bitişik dostu varışın yanına götürür; eski sürümde yalnızca büyücü', () => {
    const pos = { A: { col: 2, row: 3 }, B: { col: 3, row: 3 } };
    const party = () => [caster({ spellNames: ['Dimension Door'] }), mk('B', { ownerId: 'p1' })];
    const cmd: Command = { type: 'cast_spell', actorId: 'A', spellName: 'Dimension Door', targetHex: { col: 10, row: 3 }, targetId: 'B' };
    const r = run(field(party(), pos), cmd);
    expect(r.state.combatants.A?.pos).toEqual({ col: 10, row: 3 });
    const b = r.state.combatants.B?.pos as { col: number; row: number };
    expect(Math.abs(b.col - 10) + Math.abs(b.row - 3)).toBeLessThanOrEqual(2);
    const old = run(field(party(), pos, 15), cmd);
    expect(old.state.combatants.B?.pos).toEqual({ col: 3, row: 3 });
  });
  it('Tree Stride her tur bir kez 5 ft hareketle ağaçtan ağaca; eski sürümde yeniden kullanım yok', () => {
    const pos = { A: { col: 2, row: 3 }, F0: { col: 13, row: 6 } };
    const mkField = (k: number) => {
      const s = field([caster({ spellNames: ['Tree Stride'] }), ...foes(1)], pos, k);
      const tiles = (s.map as NonNullable<BattleState['map']>).tiles.map((row, ri) => [...row].map((ch, ci) => ((ci === 3 || ci === 8 || ci === 12) && ri === 3 ? 'a' : ch)).join(''));
      return { ...s, map: { ...(s.map as NonNullable<BattleState['map']>), tiles } };
    };
    const r = run(mkField(16), { type: 'cast_spell', actorId: 'A', spellName: 'Tree Stride', targetHex: { col: 7, row: 3 } });
    const a1 = run(r.state, { type: 'spell_followup', actorId: 'A', targetId: 'A', targetHex: { col: 11, row: 3 } });
    expect(a1.state.combatants.A?.pos).toEqual({ col: 11, row: 3 });
    expect(a1.state.combatants.A?.movementUsed).toBe((r.state.combatants.A?.movementUsed ?? 0) + 1);
    expect(execute(a1.state, { type: 'spell_followup', actorId: 'A', targetId: 'A', targetHex: { col: 7, row: 3 } }, P1, seededRng(1)).ok).toBe(false);
    const old = run(mkField(15), { type: 'cast_spell', actorId: 'A', spellName: 'Tree Stride', targetHex: { col: 7, row: 3 } });
    expect(execute(old.state, { type: 'spell_followup', actorId: 'A', targetId: 'A', targetHex: { col: 11, row: 3 } }, P1, seededRng(1)).ok).toBe(false);
  });
});

describe('Kuyruk 19: Banishment ve Dispel Evil and Good', () => {
  const pos = { A: { col: 2, row: 3 }, F0: { col: 3, row: 3 }, F1: { col: 9, row: 3 } };
  const cycle = (s0: BattleState, rounds: number) => {
    let s = s0;
    for (let i = 0; i < rounds * 3 && s.status === 'active'; i++) {
      const id = s.order[s.turnIndex] as string;
      const q = execute(s, { type: 'end_turn', actorId: id }, s.combatants[id]?.side === 'enemies' ? GM : P1, seededRng(100 + i));
      if (!q.ok) throw new Error(q.error);
      s = q.state;
    }
    return s;
  };
  it('Banishment tam sürerse Fiend geri dönmez; Humanoid aynı yerine (dolu ise en yakın boş) döner', () => {
    const party = (type: string) => [caster({ spellNames: ['Banishment'], hp: 999, maxHp: 999 }), ...foes(2, { creatureType: type })];
    const r = run(field(party('fiend'), pos), { type: 'cast_spell', actorId: 'A', spellName: 'Banishment', targetId: 'F0' });
    expect(r.state.combatants.F0?.effects?.find((e) => e.banished)?.banishForever).toBe(true);
    const after = cycle(r.state, 12);
    expect(after.combatants.F0?.exiled).toBe(true);
    const h = run(field(party('humanoid'), pos), { type: 'cast_spell', actorId: 'A', spellName: 'Banishment', targetId: 'F0' });
    expect(h.state.combatants.F0?.effects?.find((e) => e.banished)?.banishForever).toBeUndefined();
    // F1 sürgündekinin altıgenine geçer; dönüşte F0 komşu boş altıgene.
    const crowd = { ...h.state, combatants: { ...h.state.combatants, F1: { ...(h.state.combatants.F1 as Combatant), pos: { col: 3, row: 3 } } } };
    const back = cycle(crowd, 12);
    expect(back.combatants.F0?.exiled).toBeUndefined();
    expect(back.combatants.F0?.pos).not.toEqual(back.combatants.F1?.pos);
  });
  it('Dispel Evil and Good: Dismissal bitişik Fiend\'i savaştan çıkarır ve büyü biter; eski sürümde özel işlev yok', () => {
    const party = () => [caster({ spellNames: ['Dispel Evil and Good'], casterTag: 'cleric' }), ...foes(2, { creatureType: 'fiend' })];
    const r = run(field(party(), pos), { type: 'cast_spell', actorId: 'A', spellName: 'Dispel Evil and Good' });
    const s = { ...r.state, combatants: { ...r.state.combatants, A: { ...(r.state.combatants.A as Combatant), economy: { ...(r.state.combatants.A as Combatant).economy, action: false } } } };
    const d = run(s, { type: 'spell_followup', actorId: 'A', targetId: 'F0' });
    expect(d.state.combatants.F0?.exiled).toBe(true);
    expect(d.state.combatants.A?.concentration).toBeNull();
    const o = run(field(party(), pos, 15), { type: 'cast_spell', actorId: 'A', spellName: 'Dispel Evil and Good' });
    const os = { ...o.state, combatants: { ...o.state.combatants, A: { ...(o.state.combatants.A as Combatant), economy: { ...(o.state.combatants.A as Combatant).economy, action: false } } } };
    expect(execute(os, { type: 'spell_followup', actorId: 'A', targetId: 'F0' }, P1, seededRng(1)).ok).toBe(false);
  });
});

describe('Kuyruk 19: Dominate tepkisi', () => {
  it('yönetilenin tepkisi büyücünün tepkisini harcar; büyücünün tepkisi yoksa yönetilen tepki veremez', async () => {
    const { applyEvents } = await import('./reduce');
    const { canReact } = await import('./reactions');
    const s = field([caster(), ...foes(1)], { A: { col: 2, row: 3 }, F0: { col: 3, row: 3 } });
    const dom = applyEvents(s, [{ type: 'effect_added', targetId: 'F0', effect: { id: 'spells:dominate-person', name: 'Dominate Person', sourceId: 'A', dominate: true } }]);
    const used = applyEvents(dom, [{ type: 'reaction_used', actorId: 'F0', reaction: OPP, name: 'Fırsat', trigger: 'leave' }]);
    expect(used.combatants.A?.economy.reaction).toBe(true);
    const casterUsed = applyEvents(dom, [{ type: 'reaction_used', actorId: 'A', reaction: OPP, name: 'Fırsat', trigger: 'leave' }]);
    expect(canReact(casterUsed.combatants.F0)).toBe(false);
    const old = { ...dom, kuralSurumu: 15 };
    expect(canReact(applyEvents(old, [{ type: 'reaction_used', actorId: 'A', reaction: OPP, name: 'Fırsat', trigger: 'leave' }]).combatants.F0)).toBe(true);
  });
});
const OPP = 'opportunity-attack';

describe('Kuyruk 19: Telekinesis', () => {
  const pos = { A: { col: 2, row: 3 }, F0: { col: 5, row: 3 } };
  const party = () => [caster({ spellNames: ['Telekinesis'] }), ...foes(1)];
  it('seçilen altıgene taşır ve Restrained; havaya kaldırılan büyücünün sonraki tur sonunda düşer; eski sürümde uzağa itme', () => {
    const r = run(field(party(), pos), { type: 'cast_spell', actorId: 'A', spellName: 'Telekinesis', targetId: 'F0', targetHex: { col: 5, row: 6 } });
    expect(r.state.combatants.F0?.pos).toEqual({ col: 5, row: 6 });
    expect(r.state.combatants.F0?.conditions).toContain('Restrained');
    const lift = run(field(party(), pos), { type: 'cast_spell', actorId: 'A', spellName: 'Telekinesis', targetId: 'F0', choice: 'lift' });
    let s = { ...lift.state, order: ['A', 'F0'] };
    for (let i = 0; i < 4; i++) {
      const id = s.order[s.turnIndex] as string;
      const q = execute(s, { type: 'end_turn', actorId: id }, id === 'A' ? P1 : GM, seededRng(5 + i));
      if (!q.ok) throw new Error(q.error);
      if (i === 2) expect(q.events.some((e) => e.type === 'map_effect' && e.rule === 'fall' && e.targetId === 'F0')).toBe(true);
      s = q.state;
    }
    expect(s.combatants.F0?.effects?.some((e) => e.id === 'spells:telekinesis')).toBeFalsy();
    const old = run(field(party(), pos, 15), { type: 'cast_spell', actorId: 'A', spellName: 'Telekinesis', targetHex: { col: 5, row: 3 } });
    expect(old.state.combatants.F0?.pos?.col).toBeGreaterThan(5);
  });
  it('taşınmayan nesne kendiliğinden taşınır', () => {
    const s0 = field(party(), pos);
    const s = { ...s0, map: { ...(s0.map as NonNullable<BattleState['map']>), objects: [{ id: 'o1', kind: 'crate', at: { col: 4, row: 2 } } as never] } };
    const r = run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Telekinesis', targetId: 'o1', targetHex: { col: 4, row: 5 } });
    expect(r.state.map?.objects?.[0]?.at).toEqual({ col: 4, row: 5 });
  });
});
