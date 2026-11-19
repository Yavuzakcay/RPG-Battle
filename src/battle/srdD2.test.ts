/**
 * Görev D2 (kural sürümü 88): savaş sırasında eklenen canavarlar savaş başındakiyle aynı kurulumdan geçer
 * (`monsterSetup.ts`), çağrı blokları SRD 5.2.1'e göre (`data/summons.json`). Her ekleme yolu için 88'de canavar özellikleri
 * ve yetenekleri var, 87'de eski davranış; genel denetim: 88'deki yaratık = 87'deki ham yaratığın `setupMonster`'dan geçmiş
 * hâli. Çağrı blokları (Draconic Spirit, Animated Object, Otherworldly Steed, Find Familiar) ve Life Bond; katman ve replay.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { applyEvents, replay } from './reduce';
import { GM, P1, mk, scripted } from './fixtures';
import { forestRoundEvents } from './forest';
import { desertRoundEvents } from './desert';
import { setupMonster } from './monsterSetup';
import { abilitiesOf } from './monsterAbilities';
import { summonCreature, summonDef } from './summons';
import { steedActions } from './steed';
import { SRD_DUZELTMELER, srdKayit } from './srdD1';
import { SRD_D2_VERSION, srdD2On } from './srdD2Surum';
import { CURRENT_RULES } from './ruleVersion';
import { kitArena } from './k54bKit';
import { withPaket } from './paket/core';
import { combatantFromMonster, combatantFromSheet } from './create';
import { blankCharacter } from '../rules/builder';
import { classData, getMonster } from '../data';
import { validatePack } from '../content/schema';
import { applyPackSubclasses } from '../content/paket';
import p7 from '../../tests/fixtures/paket-p7.json';
import summonData from '../../data/summons.json';
import srdTablo from '../../data/srd/monsters.json';
import type { CharacterSheet } from '../rules/stats';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import { FRESH_ECONOMY, type BattleEvent, type BattleState, type Combatant, type Command } from './types';

const NEW = SRD_D2_VERSION;
const OLD = SRD_D2_VERSION - 1;
const o = (col: number, row = 3): Offset => ({ col, row });
const flat = Array.from({ length: 7 }, () => '.'.repeat(15));
const pad = () => scripted(...Array.from({ length: 60 }, () => [20, 10] as [number, number]));
const high: Rng = () => 0.99;
const low: Rng = () => 0.01;
const ok = (r: ReturnType<typeof execute>) => { if (!r.ok) throw new Error(r.error); return r; };
const SLOTS = [4, 3, 3, 3, 2, 1, 1, 0, 0];
const summoned = (evs: BattleEvent[]) => evs.filter((e): e is Extract<BattleEvent, { type: 'summoned' }> => e.type === 'summoned').map((e) => e.combatant);
const immune = (c: Combatant | undefined) => (c?.effects ?? []).flatMap((e) => e.immune ?? []).sort();
const replays = (s0: BattleState, evs: BattleEvent[], after: BattleState) => expect(replay([{ type: 'battle_started', state: s0 }, ...evs])).toEqual(after);
/** 88'deki yaratık, aynı senaryonun 87'deki ham yaratığının savaş başı kurulumundan geçmiş hâli. */
const setUp = (s88: BattleState, c87: Combatant, m?: Parameters<typeof setupMonster>[2]) => setupMonster({ ...s88, combatants: { ...s88.combatants, [c87.id]: c87 } }, c87, m).combatant;

/** A büyücü (3,3), B düşman (10,3), C dost (2,3); sürüm `v`. */
function arena(v: number, status: BattleState['status'] = 'active', a: Partial<Combatant> = {}): BattleState {
  const parts = [
    mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, spellAttack: 5, spellSaveDc: 13, spellMod: 3, proficiency: 3, initiative: 0, level: 13,
      spellNames: ['Find Steed', 'Summon Dragon', 'Animate Objects', 'Find Familiar', 'Animate Dead', 'Cure Wounds', 'Finger of Death'], spellSlots: SLOTS, ...a }),
    mk('B', { side: 'enemies', hp: 40, maxHp: 40, creatureType: 'humanoid' }),
    mk('C', { ownerId: 'p2' }),
  ];
  const s0 = startBattle('d2', 'd-z-zemin', parts, pad(), { kuralSurumu: v, map: { id: 'col' } }).state;
  const cs = { ...s0.combatants };
  for (const [id, p] of Object.entries({ A: o(3), B: o(10), C: o(2) })) cs[id] = { ...(cs[id] as Combatant), pos: p };
  return { ...s0, kuralSurumu: v, status, turnIndex: 0, combatants: cs, map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: flat } };
}
const cast = (s: BattleState, cmd: Omit<Extract<Command, { type: 'cast_spell' }>, 'type' | 'actorId'>) => execute(s, { type: 'cast_spell', actorId: 'A', ...cmd }, P1, pad());
const summonOf = (s: BattleState) => Object.values(s.combatants).find((c) => c.summon?.by === 'A' && !c.summon.gone) as Combatant;

describe('D2 katmanı ve çağrı verisi (SRD 5.2.1)', () => {
  it('5 kayıt `surum: 88`; her yeni çağrı verisinde, her eski 87 görünümünde', () => {
    expect(SRD_D2_VERSION).toBe(88);
    expect(CURRENT_RULES).toBeGreaterThanOrEqual(SRD_D2_VERSION);
    expect(srdD2On({ kuralSurumu: 88 })).toBe(true);
    expect(srdD2On({ kuralSurumu: 87 })).toBe(false);
    const d2 = SRD_DUZELTMELER.filter((d) => d.surum === 88);
    expect(d2).toHaveLength(5);
    const raw = summonData as unknown as { summons: Record<string, Record<string, unknown>>; creatures: Record<string, Record<string, unknown>> };
    for (const d of d2) {
      expect(d.dosya).toBe('data/summons.json');
      const [kind, id] = d.kayit.split('/') as ['summons' | 'creatures', string];
      const cur = raw[kind][id] as Record<string, unknown>;
      // Görev D3 (89): aynı alan sonra yine düzeltildiyse (Draconic Spirit `unsupported`) `yeni` 88 görünümünde.
      const at88 = srdKayit(d.dosya, d.kayit, cur, NEW) as Record<string, unknown>;
      expect(at88[d.alan], `${d.kayit} ${d.alan} yeni`).toEqual(d.yeni);
      const old = srdKayit(d.dosya, d.kayit, cur, OLD) as Record<string, unknown>;
      expect(old[d.alan] ?? null, `${d.kayit} ${d.alan} eski`).toEqual(d.eski);
      expect(srdKayit(d.dosya, d.kayit, cur, CURRENT_RULES)).toBe(cur);
      // D1 düzeltmeleri 86–87'de yeni, D2'ninkiler eski.
      expect(srdKayit(d.dosya, d.kayit, cur, 86)).toEqual(old);
    }
  });
  it('Find Familiar: 11 adlandırılmış biçim + SRD tablosundaki her CR 0 Beast (24); 87\'de 11', () => {
    const t = (srdTablo as unknown as { monsters: Record<string, { type: string; cr: string }> }).monsters;
    const cr0 = Object.keys(t).filter((id) => t[id]?.type === 'beast' && t[id]?.cr === '0').sort();
    expect([...(summonDef('find-familiar')?.forms ?? [])].sort()).toEqual(cr0);
    expect(summonDef('find-familiar', OLD)?.forms).toEqual(['bat', 'cat', 'frog', 'hawk', 'lizard', 'octopus', 'owl', 'rat', 'raven', 'spider', 'weasel']);
  });
  it('çağrı blokları SRD stat bloğuyla: Draconic Spirit (s. 166), Animated Object (s. 109), Otherworldly Steed (s. 131)', () => {
    const ds = summonCreature('draconic-spirit')!;
    expect(ds.speed).toBe(30);
    expect(ds.fly?.ft).toBe(60);
    expect(ds.swimFt).toBe(30);
    expect(ds.darkvision).toBe(60);
    expect(ds.unsupported).toEqual(expect.arrayContaining(['Duyu: Blindsight 30 ft', 'Durum bağışıklığı: Charmed, Frightened, Poisoned']));
    expect(ds.resistances).toEqual(['acid', 'cold', 'fire', 'lightning', 'poison']);
    const ao = summonCreature('animated-object')!;
    expect(ao.immunities).toEqual(['poison', 'psychic']);
    expect(ao.unsupported).toEqual(['Duyu: Blindsight 30 ft', 'Durum bağışıklığı: Charmed, Exhaustion, Frightened, Paralyzed, Poisoned']);
    expect(summonCreature('draconic-spirit', OLD)?.swimFt).toBeUndefined();
    // Otherworldly Steed'in Life Bond'u ve bonus eylemleri `steed.ts`'te (Kuyruk 19): veri değişmedi. SRD'de olmayan soyut
    // bloklar da değişmedi.
    for (const id of ['otherworldly-steed', 'flaming-sphere', 'spirit-pack', 'elemental-spirit', 'arcane-hand']) expect(summonCreature(id, OLD)).toBe(summonCreature(id));
  });
});

describe('D2 büyüyle çağrı', () => {
  it('Summon Dragon: 88\'de yüzme 30, Blindsight 30, Charmed/Frightened/Poisoned bağışıklığı; 87\'de yok', () => {
    const r = ok(cast(arena(NEW), { spellName: 'Summon Dragon', choice: 'fire', targetHex: o(4) }));
    const d = summonOf(r.state);
    expect(d.swimFt).toBe(30);
    expect(d.senses?.blindsight).toBe(30);
    expect(immune(d)).toEqual(['Charmed', 'Frightened', 'Poisoned']);
    replays(arena(NEW), r.events, r.state);
    const d87 = summonOf(ok(cast(arena(OLD), { spellName: 'Summon Dragon', choice: 'fire', targetHex: o(4) })).state);
    expect(d87.swimFt).toBeUndefined();
    expect(d87.senses?.blindsight).toBeUndefined();
    expect(immune(d87)).toEqual([]);
  });
  it('Animate Objects: 88\'de Poison/Psychic bağışıklığı, Blindsight 30, beş durum bağışıklığı', () => {
    const r = ok(cast(arena(NEW), { spellName: 'Animate Objects', targetHex: o(4) }));
    const a = summonOf(r.state);
    expect(a.immunities).toEqual(['poison', 'psychic']);
    expect(a.senses?.blindsight).toBe(30);
    expect(immune(a)).toEqual(['Charmed', 'Exhaustion', 'Frightened', 'Paralyzed', 'Poisoned']);
    const a87 = summonOf(ok(cast(arena(OLD), { spellName: 'Animate Objects', targetHex: o(4) })).state);
    expect(a87.immunities).toEqual([]);
    expect(immune(a87)).toEqual([]);
  });
  it('Find Steed (steed.ts, Kuyruk 19): türe göre bonus eylem ve Life Bond 88\'de de aynı; at kurulumdan geçer ama yetenek ikilenmez', () => {
    for (const [type, kind] of [['fiend', 'fell-glare'], ['fey', 'fey-step'], ['celestial', 'healing-touch']] as const) {
      for (const v of [OLD, NEW]) {
        const st = summonOf(ok(cast(arena(v), { spellName: 'Find Steed', choice: type, targetHex: o(4) })).state);
        expect(steedActions(ok(cast(arena(v), { spellName: 'Find Steed', choice: type, targetHex: o(4) })).state, st), `${v} ${type}`).toEqual([kind]);
        expect(abilitiesOf(arena(v), st)).toEqual([]);
      }
    }
    // Fell Glare: sahibin büyü DC'siyle WIS (13).
    const r = ok(cast(arena(NEW), { spellName: 'Find Steed', choice: 'fiend', targetHex: o(4) }));
    const st = summonOf(r.state);
    const g = ok(execute({ ...r.state, turnIndex: r.state.order.indexOf(st.id) }, { type: 'steed_action', actorId: st.id, kind: 'fell-glare', targetId: 'B' }, P1, low));
    expect(g.events.find((e) => e.type === 'condition_save')).toMatchObject({ targetId: 'B', ability: 'wis', dc: 13, success: false });
  });
  it('Life Bond 88\'de bir kez (D2 ikinci bir kanca eklemedi); sahibi 5 ft içinde Cure Wounds ile iyileşince at aynı miktarda', () => {
    const fresh = (s: BattleState) => ({ ...s, combatants: { ...s.combatants, A: { ...(s.combatants.A as Combatant), economy: FRESH_ECONOMY } } });
    for (const v of [OLD, NEW]) {
      const r = ok(cast(arena(v, 'active', { hp: 10 }), { spellName: 'Find Steed', choice: 'celestial', targetHex: o(4) }));
      const st = summonOf(r.state);
      const hurt = fresh({ ...r.state, combatants: { ...r.state.combatants, [st.id]: { ...st, hp: st.maxHp - 20 } } });
      const cw = ok(execute(hurt, { type: 'cast_spell', actorId: 'A', spellName: 'Cure Wounds', targetId: 'A', slotLevel: 1 }, P1, () => 0.5));
      const self = cw.events.find((e) => e.type === 'healed' && e.targetId === 'A') as Extract<BattleEvent, { type: 'healed' }>;
      const bond = cw.events.filter((e) => e.type === 'healed' && e.targetId === st.id);
      expect(bond, `${v}`).toHaveLength(1);
      expect(bond[0]).toMatchObject({ label: 'Life Bond', amount: self.amount });
      replays(hurt, cw.events, cw.state);
    }
  });
  it('Find Familiar (kurulum ritüeli): 88\'de CR 0 Beast (Eagle) seçilir ve canavar özellikleri gelir (Owl Flyby); 87\'de Eagle reddedilir', () => {
    const owl = ok(cast(arena(NEW, 'setup'), { spellName: 'Find Familiar', form: 'owl', choice: 'fey', targetHex: o(4) }));
    expect(summonOf(owl.state).traits).toContain('flyby');
    const owl87 = ok(cast(arena(OLD, 'setup'), { spellName: 'Find Familiar', form: 'owl', choice: 'fey', targetHex: o(4) }));
    expect(summonOf(owl87.state).traits ?? []).not.toContain('flyby');
    expect(setUp(owl.state, summonOf(owl87.state))).toEqual(summonOf(owl.state));
    expect(ok(cast(arena(NEW, 'setup'), { spellName: 'Find Familiar', form: 'eagle', choice: 'fey', targetHex: o(4) })).state).toBeTruthy();
    expect(cast(arena(OLD, 'setup'), { spellName: 'Find Familiar', form: 'eagle', choice: 'fey', targetHex: o(4) }).ok).toBe(false);
  });
  it('Animate Dead (kurulum): zombi 88\'de Exhaustion/Poisoned bağışıklığıyla', () => {
    const z = summonOf(ok(cast(arena(NEW, 'setup'), { spellName: 'Animate Dead', form: 'zombie', targetHex: o(4) })).state);
    expect(immune(z)).toEqual(['Exhaustion', 'Poisoned']);
    const z87 = summonOf(ok(cast(arena(OLD, 'setup'), { spellName: 'Animate Dead', form: 'zombie', targetHex: o(4) })).state);
    expect(immune(z87)).toEqual([]);
  });
});

describe('D2 savaş sırasında eklenen canavarlar (çağrı dışı yollar)', () => {
  const LOWS = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };
  function field(mapId: string, pos: Record<string, Offset>, v: number, opt: { params?: Record<string, Record<string, number | string>>; extra?: Combatant[] } = {}): BattleState {
    const parts = [mk('A', { ownerId: 'p1', hp: 60, maxHp: 60, skills: { perception: -10 } }), mk('B', { side: 'enemies', hp: 60, maxHp: 60, ac: 5, saves: LOWS }), ...(opt.extra ?? [])];
    const st = startBattle('d2', 'orman', parts, () => 0.5, { kuralSurumu: v, map: { id: mapId, ...(opt.params ? { ruleParams: opt.params } : {}) } }).state;
    const combatants = Object.fromEntries(Object.entries(st.combatants).map(([id, c]) => [id, { ...(c as Combatant), pos: pos[id] ?? null }]));
    return { ...st, status: 'active', order: Object.keys(pos), turnIndex: 0, combatants } as BattleState;
  }
  it('Orman kemik yığını: iskeletler savaş başındaki kurulumla (Exhaustion/Poisoned)', () => {
    const pos = { A: o(14, 5), B: o(19, 4) };
    const at = (v: number) => { const s = { ...field('orman-kemik-acikligi', pos, v, { params: { boneRise: { rounds: 1 } } }), round: 2 }; return { s, evs: forestRoundEvents(s, high) }; };
    const n = at(NEW); const o87 = at(OLD);
    const sk = summoned(n.evs); const sk87 = summoned(o87.evs);
    expect(sk.length).toBeGreaterThan(0);
    expect(sk.every((c) => immune(c).join() === 'Exhaustion,Poisoned')).toBe(true);
    expect(sk87.every((c) => immune(c).length === 0)).toBe(true);
    sk.forEach((c, i) => expect(c).toEqual(setUp(n.s, sk87[i] as Combatant)));
    const after = applyEvents(n.s, n.evs);
    replays(n.s, n.evs, after);
  });
  it('Çöl kum pususu: Ankheg pasifleriyle (yer altından geçiş, kazma)', () => {
    const pos = { A: o(5, 5), B: o(19, 4) };
    const at = (v: number) => { const s = { ...field('col-vaha', pos, v), round: 3 }; return { s, evs: desertRoundEvents(s, low) }; };
    const n = at(NEW); const o87 = at(OLD);
    const w = summoned(n.evs)[0]; const w87 = summoned(o87.evs)[0];
    if (!w || !w87) return expect.fail('kum pususu tetiklenmedi');
    expect(w.effects?.some((e) => e.id === `srd19:${w.id}:passive` && e.burrow)).toBe(true);
    expect(w87.effects?.some((e) => e.id === `srd19:${w87.id}:passive`) ?? false).toBe(false);
    expect(w).toEqual(setUp(n.s, w87));
  });
  it('Buz mühür pusu: Ice Mephit kurulumla (bağışıklık) ve aynı olaylarla replay', () => {
    const pos = { A: o(13, 3), B: o(2, 9) };
    const club = { label: 'Sopa', attackBonus: 20, damage: '1d2+40', damageType: 'bludgeoning', ranged: false, spell: false, tag: 'x' };
    const at = (v: number) => {
      const s0 = field('buzul-kayalik', pos, v, { params: { iceSeal: { content: 1 } } });
      const s = { ...s0, combatants: { ...s0.combatants, A: { ...(s0.combatants.A as Combatant), weaponOptions: [club] } } };
      return { s, r: ok(execute(s, { type: 'attack_object', actorId: 'A', objectId: 'muhur', option: club }, P1, high)) };
    };
    const n = at(NEW); const o87 = at(OLD);
    const m = summoned(n.r.events); const m87 = summoned(o87.r.events);
    expect(m).toHaveLength(2);
    expect(immune(m[0])).toEqual(['Exhaustion', 'Poisoned']);
    expect(immune(m87[0])).toEqual([]);
    m.forEach((c, i) => expect(c).toEqual(setUp(n.s, m87[i] as Combatant)));
    replays(n.s, n.r.events, n.r.state);
  });
  it('Kat değişimi: alt katta gelen düşmanlar kurulumla', () => {
    const up = (v: number) => {
      const parts = [mk('A', { ownerId: 'p1', hp: 30, maxHp: 30 }), mk('D', { ownerId: 'p2', hp: 30, maxHp: 30 }), mk('B', { side: 'enemies', hp: 20, maxHp: 20 })];
      const st = startBattle('d2k', 'magara', parts, () => 0.5, { kuralSurumu: v, map: { id: 'derinlikler-magara-karakol' } }).state;
      const pos: Record<string, Offset> = { A: o(14, 8), D: o(13, 9), B: o(25, 3) };
      const cs = Object.fromEntries(Object.entries(st.combatants).map(([id, c]) => [id, { ...(c as Combatant), pos: pos[id] ?? null }]));
      const s = { ...st, status: 'active', order: ['A', 'D', 'B'], turnIndex: 0, combatants: cs } as BattleState;
      return { s, r: ok(execute(s, { type: 'change_floor', actorId: 'A' } as Command, P1, () => 0.3)) };
    };
    const n = up(NEW); const o87 = up(OLD);
    const added = Object.values(n.r.state.combatants).filter((c) => c.id.startsWith('kat-'));
    const added87 = Object.values(o87.r.state.combatants).filter((c) => c.id.startsWith('kat-'));
    expect(added).toHaveLength(4);
    const fc = n.r.events.find((e) => e.type === 'floor_changed') as Extract<BattleEvent, { type: 'floor_changed' }>;
    const fc87 = o87.r.events.find((e) => e.type === 'floor_changed') as Extract<BattleEvent, { type: 'floor_changed' }>;
    const s88 = { ...n.s, map: fc.map };
    fc.added.forEach((c, i) => expect(c).toEqual(setUp(s88, fc87.added[i] as Combatant)));
    expect(added.some((c, i) => JSON.stringify(c.effects ?? []) !== JSON.stringify(added87[i]?.effects ?? []))).toBe(true);
    replays(n.s, n.r.events, n.r.state);
  });
});

describe('D2 canavar yeteneği, büyü ve paket çağrısı', () => {
  /** X canavarı (7,3), A dost oyuncu (6,3). */
  function mon(monId: string, v: number, extra: Combatant[] = []): BattleState {
    const x = { ...combatantFromMonster(getMonster(monId), { id: 'X', kuralSurumu: v }), side: 'enemies' as const };
    const st = startBattle('d2m', 'd-z-zemin', [mk('A', { ownerId: 'p1', hp: 200, maxHp: 200, creatureType: 'humanoid' }), x, ...extra], () => 0.5, { kuralSurumu: v, map: { id: 'col' } }).state;
    const cs: Record<string, Combatant> = { ...st.combatants, X: { ...(st.combatants.X as Combatant), pos: o(7) }, A: { ...(st.combatants.A as Combatant), pos: o(6) } };
    for (const e of extra) cs[e.id] = { ...(cs[e.id] as Combatant), ...e };
    return { ...st, status: 'active', round: 1, order: ['X', 'A', ...extra.map((e) => e.id)], turnIndex: 0, combatants: cs, map: { ...(st.map as NonNullable<BattleState['map']>), tiles: flat } };
  }
  it('Create Specter (Wraith): Specter savaş başındaki kurulumla (bağışıklıklar); 87\'de kurulumsuz', () => {
    const corpse = mk('K', { hp: 0, maxHp: 10, life: 'dead', creatureType: 'humanoid', pos: o(8) });
    const run = (v: number) => { const s = mon('wraith', v, [corpse]); return { s, r: ok(execute(s, { type: 'monster_ability', actorId: 'X', abilityId: 'create-specter' }, GM, low)) }; };
    const n = run(NEW); const o87 = run(OLD);
    const sp = summoned(n.r.events)[0] as Combatant; const sp87 = summoned(o87.r.events)[0] as Combatant;
    expect(immune(sp).length).toBeGreaterThan(0);
    expect(immune(sp87)).toEqual([]);
    expect(sp).toEqual(setUp(n.s, sp87));
    replays(n.s, n.r.events, n.r.state);
  });
  it('Finger of Death: ölen Humanoid zombi olarak Exhaustion/Poisoned bağışıklığıyla kalkar', () => {
    const run = (v: number) => {
      const s = arena(v, 'active', { spellSaveDc: 30 });
      const s1 = { ...s, combatants: { ...s.combatants, B: { ...(s.combatants.B as Combatant), hp: 5 } } };
      return { s: s1, r: execute(s1, { type: 'cast_spell', actorId: 'A', spellName: 'Finger of Death', targetId: 'B', slotLevel: 7 }, P1, low) };
    };
    const n = run(NEW); const o87 = run(OLD);
    if (!n.r.ok || !o87.r.ok) return expect.fail(`Finger of Death yapılamadı: ${!n.r.ok ? n.r.error : ''}`);
    const z = summoned(n.r.events)[0]; const z87 = summoned(o87.r.events)[0];
    if (!z || !z87) return expect.fail('zombi kalkmadı');
    expect(immune(z)).toEqual(['Exhaustion', 'Poisoned']);
    expect(immune(z87)).toEqual([]);
    expect(z).toEqual(setUp(n.s, z87));
  });
  describe('paket çağrısı (eşya kancası, ödünç canavar)', () => {
    beforeEach(() => {
      const r = validatePack(p7, { taken: classData.subclasses.map((s) => s.id), packs: [] });
      if (!r.ok) throw new Error(JSON.stringify(r.errors));
      applyPackSubclasses(r.pack.subclasses);
    });
    afterEach(() => applyPackSubclasses([]));
    it('Staff of the Python: Giant Constrictor Snake 88\'de canavar özellikleriyle (yüzücü işareti); 87\'de kurulumsuz', () => {
      const hero = combatantFromSheet({ ...blankCharacter('d2').sheet, name: 'E', raceId: 'human', classId: 'fighter', level: 5,
        baseScores: { str: 14, dex: 14, con: 14, int: 10, wis: 10, cha: 10 }, itemNames: ['Staff of the Python'] } as CharacterSheet, { id: 'A', ownerId: 'p1' });
      const run = (v: number) => {
        const r = kitArena({ cls: 'fighter', sub: 'tunc-kalkan', level: 5, place: { A: o(3), B: o(9) } });
        const c = r.state.combatants.A as Combatant;
        r.state = withPaket({ ...r.state, kuralSurumu: v, combatants: { ...r.state.combatants, A: { ...c, paket: hero.paket, features: hero.features, resources: { ...c.resources, ...hero.resources } } } });
        const s = r.state;
        return { s, res: ok(execute(s, { type: 'use_feature', actorId: 'A', feature: 'pk:esya:staff-of-the-python:bonus' }, P1, () => 0.5)) };
      };
      const n = run(NEW); const o87 = run(OLD);
      const sn = summoned(n.res.events)[0] as Combatant; const sn87 = summoned(o87.res.events)[0] as Combatant;
      expect(sn.traits).toContain('gift-of-the-depths');
      expect(sn87.traits ?? []).not.toContain('gift-of-the-depths');
      // Paket yaratığının `monsterId`'si ödünç canavar değil; kurulum ödünç canavar kaydıyla (yoldaki gibi).
      expect(sn).toEqual(setUp(n.s, sn87, getMonster('giant-constrictor-snake')));
      replays(n.s, n.res.events, n.res.state);
    });
  });
});
