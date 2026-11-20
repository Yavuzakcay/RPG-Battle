/**
 * Görev D3 (kural sürümü 89; SRD 5.2.1 PDF'inden doğrulandı): Draconic Spirit Shared Resistances (s. 166), süren etkinin
 * verdiği durumların durum bağışıklığına takılması ve Vampire Familiar'ın efendisinden Charmed olması (s. 334), Wild Shape
 * becerileri (s. 43) ve Polymorph'ta stat bloğunun becerileri. 88 ve altı aynen; replay.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromMonster, combatantFromSheet, setDefaultRuleVersion, startBattle } from './create';
import { applyEvents, replay } from './reduce';
import { P1, mk, scripted } from './fixtures';
import { setupMonster } from './monsterSetup';
import { polymorphEvents } from './polymorph';
import { summonCreature } from './summons';
import { srdKayit } from './srdD1';
import { grantsAfterImmunity } from './srdD3';
import { SRD_D3_VERSION, srdD3On } from './srdD3Surum';
import { CURRENT_RULES } from './ruleVersion';
import { blankCharacter, suggestedScores } from '../rules/builder';
import { getMonster } from '../data';
import summonData from '../../data/summons.json';
import type { CharacterSheet } from '../rules/stats';
import type { ActiveEffect, BattleEvent, BattleState, Combatant, Command } from './types';

const NEW = SRD_D3_VERSION;
const OLD = SRD_D3_VERSION - 1;
const pad = () => scripted(...Array.from({ length: 60 }, () => [10, 10] as [number, number]));
const low = () => 0.01;
const ok = (r: ReturnType<typeof execute>) => { if (!r.ok) throw new Error(r.error); return r; };
const SLOTS = [4, 3, 3, 3, 2, 1, 1, 0, 0];

afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

/** A büyücü (3,3) + verilen diğerleri; düz 15×7 zemin; sürüm `v`, savaş açık, sıra A'da. */
function arena(v: number, others: Combatant[], a: Partial<Combatant> = {}): BattleState {
  const A = mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, spellAttack: 7, spellSaveDc: 19, spellMod: 5, proficiency: 5, level: 13,
    spellNames: ['Summon Dragon', 'Charm Person', 'Hideous Laughter'], spellSlots: SLOTS, ...a });
  const s0 = startBattle('d3', 'd-z-zemin', [A, ...others], pad(), { kuralSurumu: v, map: { id: 'col' } }).state;
  const cs: Record<string, Combatant> = { ...s0.combatants, A: { ...(s0.combatants.A as Combatant), pos: { col: 3, row: 3 } } };
  others.forEach((o, i) => { cs[o.id] = { ...(cs[o.id] as Combatant), pos: { col: 5 + i, row: 3 } }; });
  const flat = Array.from({ length: 7 }, () => '.'.repeat(15));
  return { ...s0, kuralSurumu: v, status: 'active', turnIndex: s0.order.indexOf('A'), combatants: cs,
    map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: flat } };
}
const cast = (s: BattleState, cmd: Omit<Extract<Command, { type: 'cast_spell' }>, 'type' | 'actorId'>, rng = pad()) =>
  ok(execute(s, { type: 'cast_spell', actorId: 'A', ...cmd }, P1, rng));
const replays = (s0: BattleState, evs: BattleEvent[], after: BattleState) => expect(replay([{ type: 'battle_started', state: s0 }, ...evs])).toEqual(after);
/** Savaşa canavar (SRD kurulumu, sürüm `v`). */
function monster(v: number, id: string, cid: string, side: Combatant['side'] = 'enemies'): Combatant {
  return { ...combatantFromMonster(getMonster(id)!, { id: cid, kuralSurumu: v }), side };
}
const withSetup = (s: BattleState, ids: string[]): BattleState => {
  let cur = s;
  for (const id of ids) cur = { ...cur, combatants: { ...cur.combatants, [id]: setupMonster(cur, cur.combatants[id] as Combatant).combatant } };
  return cur;
};

describe('D3: sabit ve katman', () => {
  it('sürüm 89; Draconic Spirit 89\'da sharedResistance, 88\'de yok; not 89/88/87 görünümü sırayla geri sarılır', () => {
    expect(SRD_D3_VERSION).toBe(89);
    expect(CURRENT_RULES).toBeGreaterThanOrEqual(SRD_D3_VERSION);
    expect(srdD3On({ kuralSurumu: 89 })).toBe(true);
    expect(srdD3On({ kuralSurumu: 88 })).toBe(false);
    expect(summonCreature('draconic-spirit', NEW)?.sharedResistance).toBe(true);
    expect(summonCreature('draconic-spirit', OLD)?.sharedResistance).toBeUndefined();
    const raw = (summonData as unknown as { creatures: Record<string, { unsupported: string[] }> }).creatures['draconic-spirit']!;
    const u = (v: number) => (srdKayit('data/summons.json', 'creatures/draconic-spirit', raw, v) as { unsupported: string[] }).unsupported;
    expect(u(NEW)).toEqual(['Duyu: Blindsight 30 ft', 'Durum bağışıklığı: Charmed, Frightened, Poisoned']);
    expect(u(88)).toEqual(['Shared Resistances', 'Duyu: Blindsight 30 ft', 'Durum bağışıklığı: Charmed, Frightened, Poisoned']);
    expect(u(87)).toEqual(['Shared Resistances', 'durum bağışıklıkları (Charmed, Frightened, Poisoned)', 'Blindsight', 'yüzme hızı']);
  });
});

describe('D3: Shared Resistances (SRD s. 166)', () => {
  it('89: büyücü seçilen hasar türüne direnç, konsantrasyona bağlı; 88: yok; replay', () => {
    for (const v of [NEW, OLD]) {
      const s0 = arena(v, [mk('B', { side: 'enemies', hp: 40, maxHp: 40 })]);
      const r = cast(s0, { spellName: 'Summon Dragon', slotLevel: 5, choice: 'cold' });
      const fx = (r.state.combatants.A?.effects ?? []).find((e) => e.name === 'Shared Resistances');
      if (v === NEW) {
        expect(fx?.resist).toEqual(['cold']);
        expect(fx?.concentration).toBe('Summon Dragon');
        replays(s0, r.events, r.state);
        // Konsantrasyon bitince direnç de biter.
        const end = applyEvents(r.state, [{ type: 'concentration_ended', actorId: 'A', label: 'test' }]);
        expect((end.combatants.A?.effects ?? []).some((e) => e.name === 'Shared Resistances')).toBe(false);
      } else expect(fx).toBeUndefined();
    }
  });
  it('yeniden çağırınca yeni seçim eskisinin yerine (tek etki)', () => {
    const s0 = arena(NEW, [mk('B', { side: 'enemies', hp: 40, maxHp: 40 })]);
    const r1 = cast(s0, { spellName: 'Summon Dragon', slotLevel: 5, choice: 'cold' });
    const s1 = { ...r1.state, combatants: { ...r1.state.combatants, A: { ...(r1.state.combatants.A as Combatant), economy: { ...(s0.combatants.A as Combatant).economy } } } };
    const r2 = cast(s1, { spellName: 'Summon Dragon', slotLevel: 6, choice: 'fire' });
    const fx = (r2.state.combatants.A?.effects ?? []).filter((e) => e.name === 'Shared Resistances');
    expect(fx.map((e) => e.resist)).toEqual([['fire']]);
  });
});

describe('D3: süren etkinin verdiği durum ve durum bağışıklığı', () => {
  it('kural: taşıyıcı (Charmed/Frightened) ya da hepsi bağışıksa null, yoksa yalnız bağışık düşer', () => {
    const imm = (...xs: string[]) => (g: string) => xs.includes(g);
    expect(grantsAfterImmunity(['Charmed'], imm('Charmed'))).toBeNull();
    expect(grantsAfterImmunity(['Charmed', 'Incapacitated'], imm('Charmed'))).toBeNull();
    expect(grantsAfterImmunity(['Prone', 'Incapacitated'], imm('Prone'))).toEqual(['Incapacitated']);
    expect(grantsAfterImmunity(['Blinded', 'Restrained'], imm('Blinded', 'Restrained'))).toBeNull();
    const g = ['Restrained'];
    expect(grantsAfterImmunity(g, imm())).toBe(g);
  });
  it('Charm Person Charmed bağışığı Vampire Familiar\'a 89\'da tutmaz, 88\'de tutar (eski davranış)', () => {
    for (const v of [NEW, OLD]) {
      const s0 = withSetup(arena(v, [monster(v, 'vampire-familiar', 'B')]), ['B']);
      expect((s0.combatants.B?.effects ?? []).flatMap((e) => e.immune ?? [])).toContain('Charmed');
      const r = cast(s0, { spellName: 'Charm Person', targetId: 'B' }, scripted(...Array.from({ length: 20 }, () => [1, 1] as [number, number])));
      const b = r.state.combatants.B as Combatant;
      expect(b.conditions.includes('Charmed'), String(v)).toBe(v === OLD);
      expect((b.effects ?? []).some((e) => e.name === 'Charm Person'), String(v)).toBe(v === OLD);
      if (v === NEW) replays(s0, r.events, r.state);
    }
  });
  it('Hideous Laughter Prone bağışığında 89: yalnız Incapacitated; 88: ikisi de', () => {
    for (const v of [NEW, OLD]) {
      const ward: ActiveEffect = { id: 'imm', name: 'Prone bağışıklığı', sourceId: 'B', immune: ['Prone'] };
      const s0 = arena(v, [mk('B', { side: 'enemies', hp: 40, maxHp: 40, creatureType: 'humanoid', effects: [ward] })]);
      const r = cast(s0, { spellName: 'Hideous Laughter', targetId: 'B' }, scripted(...Array.from({ length: 20 }, () => [1, 1] as [number, number])));
      const b = r.state.combatants.B as Combatant;
      expect(b.conditions.includes('Incapacitated'), String(v)).toBe(true);
      expect(b.conditions.includes('Prone'), String(v)).toBe(v === OLD);
    }
  });
});

describe('D3: Vampire Familiar efendisinden Charmed olur (SRD s. 334)', () => {
  const charm = (sourceId: string): BattleEvent => ({ type: 'condition_changed', targetId: 'B', condition: 'Charmed', present: true, reason: 'test', sourceId });
  it('89: aynı taraftaki Vampire\'dan Charmed olur; karşı taraftaki Vampire\'dan ve başkasından olmaz; 88: hiç olmaz', () => {
    for (const v of [NEW, OLD]) {
      const s0 = withSetup(arena(v, [monster(v, 'vampire-familiar', 'B'), monster(v, 'vampire', 'V'), monster(v, 'vampire', 'W', 'party')]), ['B', 'V', 'W']);
      const fam = (s0.combatants.B?.effects ?? []).find((e) => e.immune?.includes('Charmed'));
      expect(fam?.immuneExcept, String(v)).toEqual(v === NEW ? { Charmed: 'vampire' } : undefined);
      const has = (src: string) => !!applyEvents(s0, [charm(src)]).combatants.B?.conditions.includes('Charmed');
      expect(has('V'), `${v} efendi`).toBe(v === NEW);
      expect(has('W'), `${v} karşı taraftaki Vampire`).toBe(false);
      expect(has('A'), `${v} büyücü`).toBe(false);
    }
  });
  it('89: efendi istisnası kurtarma yolunda da (save_resolved)', () => {
    const s0 = withSetup(arena(NEW, [monster(NEW, 'vampire-familiar', 'B'), monster(NEW, 'vampire', 'V')]), ['B', 'V']);
    const save = (actorId: string): BattleEvent => ({ type: 'save_resolved', actorId, targetId: 'B', label: 'Charm', ability: 'wis', dc: 17, mode: 'normal', reasons: [],
      d20: [1], natural: 1, total: 1, success: false, damageRolls: [], rawDamage: 0, appliedDamage: 0, damageType: 'psychic', damageNote: null,
      targetHpAfter: (s0.combatants.B as Combatant).hp, conditionsAdded: ['Charmed'], effects: [] } as unknown as BattleEvent);
    expect(applyEvents(s0, [save('V')]).combatants.B?.conditions).toContain('Charmed');
    expect(applyEvents(s0, [save('A')]).combatants.B?.conditions).not.toContain('Charmed');
  });
});

describe('D3: Wild Shape ve Polymorph becerileri (SRD s. 43)', () => {
  const sheet = (patch: Partial<CharacterSheet> = {}): CharacterSheet => ({
    ...blankCharacter('d').sheet, name: 'Ayla', classId: 'druid', subclassId: 'circle-of-the-land', level: 4, baseScores: suggestedScores('druid'),
    wildShapeForms: ['wolf'], ...patch,
  });
  function druidArena(v: number): BattleState {
    const d = combatantFromSheet(sheet(), { id: 'A', ownerId: 'p1' });
    const pb = d.proficiency ?? 2;
    // Stealth uzmanlığı (2 × yetkinlik), Perception yetkinliği; Athletics yetkinliği yok.
    const dz: Combatant = { ...d, skills: { stealth: d.modifiers.dex + 2 * pb, perception: d.modifiers.wis + pb } };
    const s0 = startBattle('d3w', 'd', [dz, mk('T', { side: 'enemies', hp: 40, maxHp: 40 })], () => 0.5, { kuralSurumu: v, map: { id: 'col' } } as never).state;
    return { ...s0, kuralSurumu: v, status: 'active', turnIndex: s0.order.indexOf('A'),
      combatants: { ...s0.combatants, A: { ...(s0.combatants.A as Combatant), pos: { col: 3, row: 3 } }, T: { ...(s0.combatants.T as Combatant), pos: { col: 12, row: 0 } } } };
  }
  it('89: yetkinlik biçimin değiştiricisiyle, stat bloğundaki yüksekse o; bırakınca eski beceriler; 88: değişmez', () => {
    const wolf = getMonster('wolf')!;
    const mod = (n: number) => Math.floor((n - 10) / 2);
    for (const v of [NEW, OLD]) {
      const s0 = druidArena(v);
      const before = (s0.combatants.A as Combatant).skills;
      const d = s0.combatants.A as Combatant;
      const r = ok(execute(s0, { type: 'wild_shape', actorId: 'A', form: 'wolf' } as Command, P1, () => 0.5));
      const sk = (r.state.combatants.A as Combatant).skills;
      if (v === NEW) {
        const stealthOwn = mod(wolf.abilities.dex) + (before.stealth! - d.modifiers.dex);
        expect(sk.stealth).toBe(Math.max(stealthOwn, wolf.skills!.stealth!));
        expect(sk.perception).toBe(Math.max(before.perception!, wolf.skills!.perception!));
        expect(sk.athletics).toBeUndefined();
        replays(s0, r.events, r.state);
        // Biçimi bırakma (bonus eylem; yeni tur gibi bonus açılır).
        const a = r.state.combatants.A as Combatant;
        const fresh = { ...r.state, combatants: { ...r.state.combatants, A: { ...a, economy: { ...a.economy, bonus: false } } } };
        const back = ok(execute(fresh, { type: 'wild_shape', actorId: 'A' } as Command, P1, () => 0.5));
        expect((back.state.combatants.A as Combatant).skills).toEqual(before);
      } else expect(sk).toEqual(before);
    }
  });
  it('Polymorph 89: beceriler stat bloğundan (Crocodile: yalnız Stealth); 88: değişmez', () => {
    for (const v of [NEW, OLD]) {
      const s0 = druidArena(v);
      const before = (s0.combatants.A as Combatant).skills;
      const after = applyEvents(s0, polymorphEvents(s0, s0.combatants.T as Combatant, s0.combatants.A as Combatant, 'crocodile'));
      expect((after.combatants.A as Combatant).skills, String(v)).toEqual(v === NEW ? { ...getMonster('crocodile')!.skills } : before);
    }
  });
});
