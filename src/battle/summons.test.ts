/**
 * Çağırma ve yoldaş (Görev R3; SRD 5.2.1): Find Steed (Otherworldly Steed), Summon Dragon (Draconic Spirit), Find
 * Familiar. Stat bloğu ölçeklemesi, sıra (sahibinin ardı / kendi inisiyatifi), kontrol, kaybolma (0 HP, konsantrasyon,
 * sahibin ölümü, yenisi, süre), yapay zekâ, elle zar ve replay.
 */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { winnerOf } from './common';
import { applyEvents, replay } from './reduce';
import { chooseCommand } from './ai';
import { GM, P1, P2, mk, scripted, sword } from './fixtures';
import { askFor, newBook, runWithDice } from '../rules/manualDice';
import { describeEvent } from '../ui/log';
import { getMonster, spells } from '../data';
import summonData from '../../data/summons.json';
import srdSpells from '../../data/srd/spells.json';
import { LOADABLE_VERSIONS, restoreSession, serializeSession } from '../app/battleSave';
import type { Offset } from '../rules/hex';
import { distance } from '../rules/hex';
import type { BattleEvent, BattleState, Combatant, Command, CommandContext } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const flat = Array.from({ length: 7 }, () => '.'.repeat(15));
const pad = (...xs: Array<[number, number]>) => scripted(...xs, ...Array.from({ length: 40 }, () => [20, 10] as [number, number]));
const ok = (r: ReturnType<typeof execute>) => { if (!r.ok) throw new Error(r.error); return r; };
const claw = { name: 'Claw', bonus: 4, damageDice: '1d8+2', damageType: 'slashing', repeat: 1, ranged: false, reachFt: 5, text: '' };

/** Büyücü (A, oyuncu p1), düşman B, dost C (oyuncu p2); düz harita, sıra A, B, C. */
function arena(a: Partial<Combatant> = {}, b: Partial<Combatant> = {}, status: BattleState['status'] = 'active'): { state: BattleState; events: BattleEvent[] } {
  const parts = [
    mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, spellAttack: 5, spellSaveDc: 13, spellMod: 3, proficiency: 3, initiative: 0, ...a }),
    mk('B', { side: 'enemies', hp: 40, maxHp: 40, attacks: [claw], ...b }),
    mk('C', { ownerId: 'p2', weaponOptions: [sword] }),
  ];
  const started = startBattle('s', 'd-z-zemin', parts, scripted([20, 18], [20, 12], [20, 5]), { map: { id: 'col' } });
  const pos: Record<string, Offset> = { A: o(3, 3), B: o(6, 3), C: o(2, 3) };
  const combatants = { ...started.state.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  const state: BattleState = { ...started.state, status, turnIndex: 0, combatants, map: { ...(started.state.map as NonNullable<BattleState['map']>), tiles: flat } };
  return { state, events: [{ type: 'battle_started', state }] };
}
const paladin = (p: Partial<Combatant> = {}) => ({ spellNames: ['Find Steed'], spellSlots: [4, 3, 2, 1, 0, 0, 0, 0, 0], ...p });
const wizard = (p: Partial<Combatant> = {}) => ({ spellNames: ['Summon Dragon', 'Find Familiar'], spellSlots: [4, 3, 3, 3, 2, 1, 0, 0, 0], ...p });
const cast = (s: BattleState, cmd: Omit<Extract<Command, { type: 'cast_spell' }>, 'type' | 'actorId'>, rng = pad(), ctx: CommandContext = P1) =>
  ok(execute(s, { type: 'cast_spell', actorId: 'A', ...cmd }, ctx, rng));
const summonOf = (s: BattleState, owner = 'A') => Object.values(s.combatants).find((c) => c.summon?.by === owner && !c.summon.gone) as Combatant;
const endTurn = (s: BattleState) => {
  const id = s.order[s.turnIndex] as string;
  const c = s.combatants[id] as Combatant;
  return ok(execute(s, { type: 'end_turn', actorId: id }, c.side === 'enemies' ? GM : { playerId: c.ownerId, isGm: false }, pad()));
};
const vanished = (events: BattleEvent[]) => events.filter((e): e is Extract<BattleEvent, { type: 'summon_vanished' }> => e.type === 'summon_vanished');

describe('veri (data/summons.json; kimlik kuralı)', () => {
  it('her çağırma büyüsü spells.json\'da (aynı SRD kimliği) ve SRD büyü kaydıyla eşleşir; yaratıklar SRD büyüsüne bağlı; familiar biçimleri CR 0 Beast', () => {
    const data = summonData as { summons: Record<string, { srd: string; creature?: string; forms?: string[] }>; creatures: Record<string, { srd: string }> };
    const srdIds = new Set((srdSpells.spells as Array<{ id: string }>).map((x) => `spells:${x.id}`));
    for (const [id, def] of Object.entries(data.summons)) {
      expect(spells.find((x) => x.id === id)).toMatchObject({ srd: def.srd, mechanics: { kind: 'summon' } });
      expect(srdIds.has(def.srd)).toBe(true);
      if (def.creature) expect(data.creatures[def.creature]?.srd).toBe(def.srd);
      for (const f of def.forms ?? []) expect(getMonster(f)).toMatchObject({ cr: '0' });
    }
    for (const c of Object.values(data.creatures)) expect(srdIds.has(c.srd)).toBe(true);
    expect(spells.filter((x) => x.mechanics.kind === 'summon').map((x) => x.id).sort()).toEqual(Object.keys(data.summons).sort());
  });
});

describe('Find Steed: Otherworldly Steed', () => {
  it('stat bloğu büyü seviyesiyle ölçeklenir (AC 10+L, HP 5+10L, Slam 1d8+L, saldırı = büyü saldırısı), tür seçimi hasar türünü belirler', () => {
    const s = arena(paladin()).state;
    const r = cast(s, { spellName: 'Find Steed', targetHex: o(4, 3), choice: 'fiend' });
    const steed = summonOf(r.state);
    expect(steed).toMatchObject({ name: 'Otherworldly Steed (A)', side: 'party', ownerId: 'p1', ac: 12, hp: 25, maxHp: 25, speed: 60, fly: 0, size: 'L',
      creatureType: 'fiend', proficiency: 3, pos: o(4, 3), summon: { by: 'A', spellId: 'find-steed', level: 2, turn: 'after-owner', endsOnOwnerDeath: true } });
    expect(steed.attacks).toEqual([expect.objectContaining({ name: 'Otherworldly Slam', bonus: 5, damageDice: '1d8+2', damageType: 'necrotic', reachFt: 5 })]);
    expect(r.events.map((e) => e.type).slice(0, 2)).toEqual(['slot_spent', 'summoned']);
    // 4. seviye slot: AC 14, HP 45, uçuş 60; Celestial → radiant.
    const up = summonOf(cast(s, { spellName: 'Find Steed', targetHex: o(4, 3), choice: 'celestial', slotLevel: 4 }).state);
    expect(up).toMatchObject({ ac: 14, hp: 45, fly: 60, creatureType: 'celestial', summon: { level: 4 } });
    expect(up.attacks[0]).toMatchObject({ damageDice: '1d8+4', damageType: 'radiant' });
    // Günlük satırı.
    const line = describeEvent(r.events[1] as BattleEvent, r.state);
    expect(line).toContain('Otherworldly Steed (A)');
    expect(line).toContain('ardından');
  });

  it('çağırma yeri: menzilde (30 ft) boş geçilebilir altıgen; verilmezse sahibine en yakın uygun yer', () => {
    const s = arena(paladin()).state;
    expect(execute(s, { type: 'cast_spell', actorId: 'A', spellName: 'Find Steed', targetHex: o(10, 3) }, P1, pad()).ok).toBe(false);
    expect(execute(s, { type: 'cast_spell', actorId: 'A', spellName: 'Find Steed', targetHex: o(2, 3) }, P1, pad()).ok).toBe(false);
    const auto = summonOf(cast(s, { spellName: 'Find Steed' }).state);
    expect(distance(auto.pos as Offset, o(3, 3))).toBe(1);
  });

  it('sahibinin inisiyatifini paylaşır, turunu hemen ardından oynar; sahibinin oyuncusu yönetir, başkası yönetemez', () => {
    const r = cast(arena(paladin()).state, { spellName: 'Find Steed', targetHex: o(5, 3) });
    const steed = summonOf(r.state);
    expect(r.state.order).toEqual(['A', steed.id, 'B', 'C']);
    expect(steed.initiative).toBe(r.state.combatants.A?.initiative);
    const atSteed = endTurn(r.state).state;
    expect(atSteed.order[atSteed.turnIndex]).toBe(steed.id);
    const slam: Command = { type: 'monster_attack', actorId: steed.id, targetId: 'B', attackIndex: 0 };
    expect(execute(atSteed, slam, P2, pad()).ok).toBe(false);
    expect(execute(atSteed, slam, GM, pad()).ok).toBe(false);
    const hit = ok(execute(atSteed, slam, P1, pad([20, 15], [8, 5])));
    expect(hit.events.find((e) => e.type === 'attack_resolved')).toMatchObject({ actorId: steed.id, targetId: 'B', hit: true, total: 20 });
    expect(hit.state.combatants.B?.hp).toBe(40 - 7);
    // Sırası biten at, B'ye geçer.
    const next = endTurn(hit.state).state;
    expect(next.order[next.turnIndex]).toBe('B');
  });

  it('0 HP\'de kaybolur (ölüm save\'i yok), sırada atlanır; taraf yalnız çağrılmış yaratıkla ayakta kalmaz', () => {
    const r = cast(arena(paladin()).state, { spellName: 'Find Steed', targetHex: o(5, 3) });
    const steed = summonOf(r.state);
    const atB = endTurn(endTurn(r.state).state).state;
    expect(atB.order[atB.turnIndex]).toBe('B');
    const hit = ok(execute({ ...atB, combatants: { ...atB.combatants, [steed.id]: { ...steed, hp: 3 } } },
      { type: 'monster_attack', actorId: 'B', targetId: steed.id, attackIndex: 0 }, GM, pad([20, 15], [8, 8])));
    expect(vanished(hit.events)).toEqual([{ type: 'summon_vanished', actorId: steed.id, ownerId: 'A', reason: 'hp' }]);
    expect(hit.state.combatants[steed.id]).toMatchObject({ hp: 0, pos: null, life: 'dead', summon: { gone: true } });
    // Sıra: C, sonra A; at atlanır.
    const round = endTurn(endTurn(hit.state).state).state;
    expect(round.order[round.turnIndex]).toBe('A');
    const afterA = endTurn(round).state;
    expect(afterA.order[afterA.turnIndex]).toBe('B');
    // Parti karakterleri düşünce at yaşasa da düşmanlar kazanır.
    const r2 = cast(arena(paladin()).state, { spellName: 'Find Steed', targetHex: o(5, 3) }).state;
    const downed = { ...r2, combatants: { ...r2.combatants, A: { ...(r2.combatants.A as Combatant), hp: 0, life: 'dying' as const }, C: { ...(r2.combatants.C as Combatant), hp: 0, life: 'dying' as const } } };
    expect(winnerOf(downed)).toBe('enemies');
  });

  it('sahibi ölünce kaybolur; yeniden yapılınca önceki at gider (tek at); Faithful Steed slotsuz yapar', () => {
    const r = cast(arena(paladin({ hp: 1, deathSaves: { successes: 0, failures: 2 }, life: 'dying' })).state, { spellName: 'Find Steed', targetHex: o(5, 3) });
    const steed = summonOf(r.state);
    // A ölüyor (GM HP ayarı bir şey değiştirmez; ölüm save'i başarısızlığıyla ölür).
    const dead = ok(execute(r.state, { type: 'adjust_hp', targetId: 'A', hp: 0 }, GM, pad()));
    expect(vanished(dead.events)).toEqual([]);
    const died = applyEvents(dead.state, [{ type: 'death_save', actorId: 'A', natural: 2, successes: 0, failures: 3, outcome: 'dead' }]);
    const after = ok(execute(died, { type: 'set_condition', targetId: 'B', condition: 'Prone', present: true }, GM, pad()));
    expect(vanished(after.events)).toEqual([{ type: 'summon_vanished', actorId: steed.id, ownerId: 'A', reason: 'owner' }]);
    // Yeniden: önceki 'replaced'.
    const s2 = arena(paladin({ resources: { faithfulSteed: 1 } })).state;
    const first = cast(s2, { spellName: 'Find Steed', targetHex: o(5, 3) });
    expect(first.events[0]).toMatchObject({ type: 'feature_used', feature: 'faithfulSteed', remaining: 0 });
    const old = summonOf(first.state);
    const again = cast({ ...first.state, combatants: { ...first.state.combatants, A: { ...(first.state.combatants.A as Combatant), economy: { ...(first.state.combatants.A as Combatant).economy, action: false } } } },
      { spellName: 'Find Steed', targetHex: o(4, 2) });
    expect(vanished(again.events)).toEqual([{ type: 'summon_vanished', actorId: old.id, ownerId: 'A', reason: 'replaced' }]);
    expect(again.events.find((e) => e.type === 'slot_spent')).toMatchObject({ level: 2 });
    expect(summonOf(again.state).id).not.toBe(old.id);
  });
});

describe('Summon Dragon: Draconic Spirit', () => {
  it('5. seviye: AC 19, HP 50, Rend ×2 (1d6+4+5, erişim 10 ft) + nefes (DEX, büyü DC\'si, seçilen tür); 7. seviye ölçeği', () => {
    const r = cast(arena(wizard()).state, { spellName: 'Summon Dragon', targetHex: o(5, 3), choice: 'cold' });
    const d = summonOf(r.state);
    expect(d).toMatchObject({ ac: 19, hp: 50, speed: 30, fly: 60, creatureType: 'dragon', multiattack: true, darkvision: 60,
      resistances: ['acid', 'cold', 'fire', 'lightning', 'poison'], summon: { concentration: true, level: 5, until: 600 } });
    expect(d.attacks).toEqual([
      expect.objectContaining({ name: 'Rend', bonus: 5, damageDice: '1d6+9', damageType: 'piercing', reachFt: 10, repeat: 2 }),
      expect.objectContaining({ name: 'Breath Weapon', damageDice: '2d6', damageType: 'cold', save: { ability: 'dex', dc: 13, halfOnSave: true }, repeat: 1 }),
    ]);
    expect(r.state.combatants.A?.concentration?.spell).toBe('Summon Dragon');
    const s7 = arena(wizard({ spellSlots: [4, 3, 3, 3, 2, 1, 1, 0, 0] })).state;
    const d7 = summonOf(cast(s7, { spellName: 'Summon Dragon', targetHex: o(5, 3), slotLevel: 7 }).state);
    expect(d7).toMatchObject({ ac: 21, hp: 70 });
    expect(d7.attacks[0]).toMatchObject({ damageDice: '1d6+11', repeat: 3 });
  });

  it('Multiattack: iki Rend ve nefes aynı hedefe', () => {
    const r = cast(arena(wizard()).state, { spellName: 'Summon Dragon', targetHex: o(5, 3) });
    const d = summonOf(r.state);
    const atD = endTurn(r.state).state;
    const m = ok(execute(atD, { type: 'multiattack', actorId: d.id, targetId: 'B' }, P1, pad()));
    expect(m.events.filter((e) => e.type === 'attack_resolved').map((e) => 'label' in e && e.label)).toEqual(['Rend', 'Rend']);
    expect(m.events.find((e) => e.type === 'save_resolved')).toMatchObject({ actorId: d.id, targetId: 'B', label: 'Breath Weapon', dc: 13 });
  });

  it('konsantrasyon bitince kaybolur (sahibi 0 HP; başka konsantrasyon büyüsü); süre dolunca kaybolur', () => {
    const r = cast(arena(wizard()).state, { spellName: 'Summon Dragon', targetHex: o(5, 3) });
    const d = summonOf(r.state);
    const down = ok(execute(r.state, { type: 'adjust_hp', targetId: 'A', hp: 0 }, GM, pad()));
    expect(vanished(down.events)).toEqual([{ type: 'summon_vanished', actorId: d.id, ownerId: 'A', reason: 'concentration' }]);
    // Süre: son tur geçince.
    const short = { ...r.state, combatants: { ...r.state.combatants, [d.id]: { ...d, summon: { ...(d.summon as NonNullable<Combatant['summon']>), until: 1 } } } };
    let s = short;
    let events: BattleEvent[] = [];
    for (let i = 0; i < 5 && s.round < 2; i++) { const e = endTurn(s); s = e.state; events = [...events, ...e.events]; }
    expect(vanished(events)).toEqual([{ type: 'summon_vanished', actorId: d.id, ownerId: 'A', reason: 'duration' }]);
  });
});

describe('Find Familiar', () => {
  it('ritüel: yalnızca kurulumda, slotsuz; seçilen biçim ve tür, kendi inisiyatifi, 10 ft içinde; saldıramaz', () => {
    const active = arena(wizard()).state;
    expect(execute(active, { type: 'cast_spell', actorId: 'A', spellName: 'Find Familiar', form: 'owl' }, P1, pad()).ok).toBe(false);
    const setup = arena(wizard(), {}, 'setup').state;
    expect(execute(setup, { type: 'cast_spell', actorId: 'A', spellName: 'Find Familiar', form: 'owl' }, P2, pad()).ok).toBe(false);
    expect(execute(setup, { type: 'cast_spell', actorId: 'A', spellName: 'Find Familiar', form: 'dragon' }, P1, pad()).ok).toBe(false);
    // İnisiyatif: d20 = 7, DEX +1 (Owl 13) → 8: C (5) önünde, B (12) ardında.
    const r = ok(execute(setup, { type: 'cast_spell', actorId: 'A', spellName: 'Find Familiar', form: 'owl', choice: 'fey', targetHex: o(4, 2) }, P1, pad([20, 7])));
    const f = summonOf(r.state);
    expect(f).toMatchObject({ name: 'Owl (A)', monsterId: 'owl', side: 'party', ownerId: 'p1', creatureType: 'fey', initiative: 8, attacks: [], fly: 60,
      summon: { turn: 'own', noAttack: true, spellId: 'find-familiar' } });
    expect(r.events.map((e) => e.type)).toEqual(['summoned']);
    expect(r.state.order).toEqual(['A', 'B', f.id, 'C']);
    expect(r.state.combatants.A?.spellSlots).toEqual(setup.combatants.A?.spellSlots);
    // Tek familiar: yeniden yapılınca önceki gider.
    const again = ok(execute(r.state, { type: 'cast_spell', actorId: 'A', spellName: 'Find Familiar', form: 'cat', targetHex: o(4, 3) }, P1, pad([20, 1])));
    expect(vanished(again.events)).toHaveLength(1);
    expect(summonOf(again.state).name).toBe('Cat (A)');
    // Savaşta: saldıramaz, Yardım eder.
    const started = ok(execute(r.state, { type: 'start_battle' }, GM, pad())).state;
    const atF = { ...started, turnIndex: started.order.indexOf(f.id), combatants: { ...started.combatants, [f.id]: { ...(started.combatants[f.id] as Combatant), pos: o(5, 3) } } };
    expect(execute(atF, { type: 'monster_attack', actorId: f.id, targetId: 'B', attackIndex: 0 }, P1, pad()).ok).toBe(false);
    expect(execute(atF, { type: 'help', actorId: f.id, targetId: 'B' }, P1, pad()).ok).toBe(true);
  });
});

describe('yapay zekâ ve düşman çağrıları', () => {
  it('at bitişik düşmana saldırır; sahibine bitişik düşmanı öne alır; familiar Yardım ya da Kaçın yapar', () => {
    const r = cast(arena(paladin()).state, { spellName: 'Find Steed', targetHex: o(5, 3) });
    const atSteed = endTurn(r.state).state;
    expect(chooseCommand(atSteed)).toMatchObject({ actorId: summonOf(r.state).id, targetId: 'B' });
    // Familiar: dostla yakın dövüşteki bitişik düşmana Yardım.
    const setup = arena(wizard(), {}, 'setup').state;
    const fam = ok(execute(setup, { type: 'cast_spell', actorId: 'A', spellName: 'Find Familiar', form: 'cat', targetHex: o(4, 3) }, P1, pad([20, 7])));
    const started = ok(execute(fam.state, { type: 'start_battle' }, GM, pad())).state;
    const f = summonOf(started);
    const near = { ...started, turnIndex: started.order.indexOf(f.id), combatants: { ...started.combatants,
      [f.id]: { ...f, pos: o(5, 3) }, C: { ...(started.combatants.C as Combatant), pos: o(7, 3) } } };
    expect(chooseCommand(near)).toEqual({ type: 'help', actorId: f.id, targetId: 'B' });
    const far = { ...started, turnIndex: started.order.indexOf(f.id), combatants: { ...started.combatants, B: { ...(started.combatants.B as Combatant), pos: o(12, 1) } } };
    expect(chooseCommand(far)).toEqual({ type: 'dodge', actorId: f.id });
    // Sahibinden uzaktaysa önce yanına yürür.
    const away = { ...far, combatants: { ...far.combatants, [f.id]: { ...f, pos: o(7, 5) } } };
    const go = chooseCommand(away);
    expect(go.type).toBe('move');
    expect(go.type === 'move' && distance(go.to, o(3, 3))).toBe(1);
  });

  it('düşman tarafının çağrısını Game Master yönetir', () => {
    const s0 = arena({}, { spellNames: ['Find Steed'], spellSlots: [0, 2, 0, 0, 0, 0, 0, 0, 0], spellAttack: 4, spellSaveDc: 12 }).state;
    const atB = endTurn(s0).state;
    const r = ok(execute(atB, { type: 'cast_spell', actorId: 'B', spellName: 'Find Steed', targetHex: o(7, 3) }, GM, pad()));
    const steed = summonOf(r.state, 'B');
    expect(steed).toMatchObject({ side: 'enemies', ownerId: null });
    const atSteed = endTurn(r.state).state;
    expect(atSteed.order[atSteed.turnIndex]).toBe(steed.id);
    expect(execute(atSteed, { type: 'end_turn', actorId: steed.id }, P1, pad()).ok).toBe(false);
    expect(execute(atSteed, { type: 'end_turn', actorId: steed.id }, GM, pad()).ok).toBe(true);
  });
});

describe('elle zar ve replay', () => {
  it('familiar inisiyatifi elle istenir; olaylar baştan oynatılınca aynı durum', () => {
    const { state, events } = arena(wizard(), {}, 'setup');
    const cmd: Command = { type: 'cast_spell', actorId: 'A', spellName: 'Find Familiar', form: 'raven', targetHex: o(4, 3) };
    const run = runWithDice((rng) => execute(state, cmd, P1, rng), newBook(), { ask: askFor('everyone', () => true), auto: pad() });
    expect(run.ok ? null : run.need).toMatchObject({ sides: 20, kind: 'initiative' });
    const book = { entries: [{ group: { sides: 20, count: 1, values: [14] } }] };
    const done = runWithDice((rng) => execute(state, cmd, P1, rng), book, { ask: askFor('everyone', () => true), auto: pad() });
    if (!done.ok || !done.value.ok) throw new Error('elle zar');
    expect(summonOf(done.value.state).initiative).toBe(16);

    // Replay: at çağrılır, saldırır, kaybolur.
    const a = arena(paladin());
    const log: BattleEvent[] = [...a.events];
    let s = a.state;
    const step = (r: ReturnType<typeof ok>) => { log.push(...r.events); s = r.state; };
    step(cast(s, { spellName: 'Find Steed', targetHex: o(5, 3) }));
    const steed = summonOf(s);
    step(endTurn(s));
    step(ok(execute(s, { type: 'monster_attack', actorId: steed.id, targetId: 'B', attackIndex: 0 }, P1, pad([20, 15], [8, 5]))));
    step(ok(execute(s, { type: 'adjust_hp', targetId: steed.id, hp: 0 }, GM, pad())));
    expect(vanished(log)).toHaveLength(1);
    expect(replay(log)).toEqual(s);
    // Kayıt: 15. sürümle kaydedilir ve geri yüklenir; çağırmasız 14. sürüm kaydı da yüklenir.
    const text = serializeSession({ state: s, events: log, lines: [], error: null });
    expect(JSON.parse(text).version).toBe(15);
    const back = restoreSession(text);
    expect(back.ok && back.session.state).toEqual(s);
    expect(LOADABLE_VERSIONS).toContain(14);
    expect(restoreSession(JSON.stringify({ version: 14, savedAt: '', events: a.events })).ok).toBe(true);
  });
});
