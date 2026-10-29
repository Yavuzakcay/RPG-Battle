/**
 * Görev B1 (SRD 5.2.1): büyü sistemleri bölüm 1: süren etki (Shillelagh, True Strike, Blur, Beacon of Hope, Protection
 * from Energy, Haste, Slow), süreli tekrar (Acid Arrow, Heat Metal, Ray of Enfeeblement, Call Lightning, Vampiric Touch),
 * iyileştirme (Mass Healing Word, Revivify), itme (Gust of Wind), boyut (Enlarge/Reduce), uçuş (Levitate, Gaseous Form),
 * Ensnaring Strike. Süre bitişi, konsantrasyon kaybı ve replay.
 */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { replay } from './reduce';
import { GM, P1, P2, mk } from './fixtures';
import { damageProfile } from './common';
import { canReact } from './reactions';
import { buffExtraDice, effectiveAc } from './divine';
import { saveMode } from './durations';
import { spells } from '../data';
import { effectTargetCount } from './spells';
import { spellMenu } from '../ui/hud';
import srdSpells from '../../data/srd/spells.json';
import { distance, type Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command, CommandContext } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const mid: Rng = () => 0.5;
const ok = (r: ReturnType<typeof execute>) => { if (!r.ok) throw new Error(r.error); return r; };
const err = (r: ReturnType<typeof execute>) => (r.ok ? null : r.error);
const claw = { name: 'Claw', bonus: 4, damageDice: '1d8+2', damageType: 'slashing', repeat: 1, ranged: false, reachFt: 5, text: '' };
const SLOTS = [4, 3, 3, 0, 0, 0, 0, 0, 0];
const staff: AttackOption = { label: 'Quarterstaff', attackBonus: 2, damage: '1d6', damageType: 'bludgeoning', ranged: false, spell: false,
  tag: 'quarterstaff', weaponId: 'quarterstaff', weaponDamage: '1d6', abilityMod: 0 };
const sword: AttackOption = { label: 'Longsword', attackBonus: 4, damage: '1d8+2', damageType: 'slashing', ranged: false, spell: false,
  tag: 'longsword', weaponId: 'longsword', weaponDamage: '1d8', abilityMod: 2 };

/** Düz harita; sıra A (büyücü, 3,3), B (düşman, 4,3), C (dost, 2,3). */
function arena(a: Partial<Combatant> = {}, b: Partial<Combatant> = {}, c: Partial<Combatant> = {}, bPos = o(4, 3)) {
  const parts = [
    mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, spellAttack: 5, spellSaveDc: 13, spellMod: 3, proficiency: 3, spellSlots: SLOTS, weaponOptions: [staff, sword], ...a }),
    mk('B', { side: 'enemies', hp: 60, maxHp: 60, attacks: [claw], ...b }),
    mk('C', { ownerId: 'p2', hp: 20, maxHp: 20, weaponOptions: [sword], ...c }),
  ];
  const started = startBattle('b1', 'd-z-zemin', parts, () => 0.5, { map: { id: 'col' } });
  const pos: Record<string, Offset> = { A: o(3, 3), B: bPos, C: o(2, 3) };
  const combatants = { ...started.state.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  const tiles = Array.from({ length: 7 }, () => '.'.repeat(15));
  const state: BattleState = { ...started.state, status: 'active', order: ['A', 'B', 'C'], turnIndex: 0, combatants,
    map: { ...(started.state.map as NonNullable<BattleState['map']>), tiles } };
  return new Run(state);
}

/** Komutları sırayla uygular, olayları biriktirir (replay denetimi için). */
class Run {
  events: BattleEvent[];
  constructor(public state: BattleState) { this.events = [{ type: 'battle_started', state }]; }
  do(cmd: Command, ctx: CommandContext = P1, rng: Rng = mid) {
    const r = ok(execute(this.state, cmd, ctx, rng));
    this.state = r.state;
    this.events.push(...r.events);
    return r.events;
  }
  try(cmd: Command, ctx: CommandContext = P1, rng: Rng = mid) { return err(execute(this.state, cmd, ctx, rng)); }
  cast(cmd: Omit<Extract<Command, { type: 'cast_spell' }>, 'type' | 'actorId'>, rng: Rng = mid) {
    return this.do({ type: 'cast_spell', actorId: 'A', ...cmd }, P1, rng);
  }
  /** Sıradakinin turunu bitirir. */
  end(rng: Rng = mid) {
    const id = this.state.order[this.state.turnIndex] as string;
    const c = this.state.combatants[id] as Combatant;
    return this.do({ type: 'end_turn', actorId: id }, c.side === 'enemies' ? GM : c.id === 'C' ? P2 : P1, rng);
  }
  /** Bir tam tur: A'ya yeniden gelene dek. */
  round(rng: Rng = mid) { const out: BattleEvent[] = []; do out.push(...this.end(rng)); while (this.state.order[this.state.turnIndex] !== 'A'); return out; }
  c(id: string) { return this.state.combatants[id] as Combatant; }
  replays() { expect(replay(this.events)).toEqual(this.state); }
}
const spell = (name: string) => spells.find((x) => x.name === name);
const fx = (c: Combatant, id: string) => c.effects?.find((e) => e.id === id);

describe('veri: B1 büyüleri SRD kaydıyla ve korunan alanlar', () => {
  it('yeni büyüler SRD kimliğiyle; değişen büyülerin mekaniği ve yukarı slot alanları yerinde', () => {
    const ids = new Set((srdSpells.spells as Array<{ id: string }>).map((x) => `spells:${x.id}`));
    for (const n of ['Ray of Enfeeblement', 'Ensnaring Strike', 'Enlarge/Reduce', 'Gaseous Form', 'Gust of Wind', 'Shillelagh', 'True Strike', 'Blur',
      'Beacon of Hope', 'Protection from Energy']) {
      expect(ids.has(spell(n)?.srd ?? '')).toBe(true);
    }
    expect(spell('Heat Metal')?.mechanics).toMatchObject({ kind: 'auto', damage: '2d8', upcast: { dice: '1d8' }, repeat: { cost: 'bonus', target: 'same' } });
    expect(spell('Call Lightning')?.mechanics).toMatchObject({ damage: '3d10', upcast: { dice: '1d10' }, repeat: { cost: 'action' } });
    expect(spell('Vampiric Touch')?.mechanics).toMatchObject({ damage: '3d6', upcast: { dice: '1d6' }, drain: 0.5 });
    expect(spell('Acid Arrow')?.mechanics).toMatchObject({ damage: '4d4', upcast: { dice: '1d4' }, halfOnMiss: true });
    expect(spell('Mass Healing Word')?.mechanics).toMatchObject({ damage: '2d4', upcast: { dice: '1d4' }, healTargets: 6 });
    expect(spell('Haste')?.mechanics.effect).toMatchObject({ ac: 2, speedMult: 2, saveAdv: ['dex'], lethargy: true });
    expect(spell('Slow')?.mechanics.effect).toMatchObject({ ac: -2, speedMult: 0.5, noReactions: true, repeatSave: true });
    // S1'de kazara silinen türden alanlar: uygulanan yukarı slotlar yerinde.
    expect(spell('Searing Smite')?.mechanics.upcast).toEqual({ dice: '1d6', applied: true });
    expect(spell('Ensnaring Strike')?.mechanics.upcast).toEqual({ dice: '1d6', applied: true });
  });
});

describe('süren etki', () => {
  it('Shillelagh: bonus eylem, kendine; Quarterstaff saldırısı büyü saldırısı + d8 + büyü değiştiricisi, dirençte Force; süre bitince biter', () => {
    const r = arena({ spellNames: ['Shillelagh'] }, { resistances: ['bludgeoning'] });
    expect(r.try({ type: 'cast_spell', actorId: 'A', spellName: 'Shillelagh', targetId: 'C' })).toMatch(/kendisine/);
    r.cast({ spellName: 'Shillelagh' });
    expect(r.c('A').economy.bonus).toBe(true);
    expect(fx(r.c('A'), 'spells:shillelagh')?.weaponOverride).toMatchObject({ die: '1d8', attack: 5, mod: 3, force: true });
    const ev = r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: staff }).find((e) => e.type === 'attack_resolved');
    expect(ev).toMatchObject({ total: 11 + 5, hit: true, rawDamage: 5 + 3, appliedDamage: 8, damageType: 'force' });
    // Longsword etkilenmez; 5. seviyede zar d10.
    const r5 = arena({ spellNames: ['Shillelagh'], level: 5 });
    r5.cast({ spellName: 'Shillelagh' });
    expect(fx(r5.c('A'), 'spells:shillelagh')?.weaponOverride?.die).toBe('1d10');
    for (let i = 0; i < 10; i++) r.round();
    expect(fx(r.c('A'), 'spells:shillelagh')).toBeUndefined();
    r.replays();
  });
  it('True Strike: silahla saldırı, büyü saldırısı ve büyü değiştiricisi; 5. seviyede +1d6 Radiant tek seferlik', () => {
    const r = arena({ spellNames: ['True Strike'], level: 5 });
    const evs = r.cast({ spellName: 'True Strike', targetId: 'B', choice: 'Longsword' });
    const hit = evs.find((e) => e.type === 'attack_resolved');
    expect(hit).toMatchObject({ total: 11 + 5, hit: true, rawDamage: 5 + 3 });
    expect(hit?.type === 'attack_resolved' && hit.extra?.[0]).toMatchObject({ type: 'radiant', raw: 4 });
    expect(r.c('A').effects ?? []).toEqual([]);
    expect(r.c('A').economy.action).toBe(true);
    expect(r.try({ type: 'cast_spell', actorId: 'A', spellName: 'True Strike', targetId: 'B' })).toBeTruthy();
    r.replays();
  });
  it('Blur: büyücüye saldırılar dezavantajlı; konsantrasyon bitince biter', () => {
    const r = arena({ spellNames: ['Blur'] });
    r.cast({ spellName: 'Blur' });
    r.end();
    const ev = r.do({ type: 'monster_attack', actorId: 'B', targetId: 'A', attackIndex: 0 }, GM).find((e) => e.type === 'attack_resolved');
    expect(ev?.type === 'attack_resolved' && ev.mode).toBe('disadvantage');
    r.end(); r.end();
    r.cast({ spellName: 'Blur' });
    expect(fx(r.c('A'), 'spells:blur')?.attackedDis).toBe(true);
    r.replays();
  });
  it('Beacon of Hope: WIS save avantajı, iyileştirme en yüksek değer, ölüm save avantajı', () => {
    const r = arena({ spellNames: ['Beacon of Hope', 'Healing Word'] }, {}, { hp: 5 });
    r.cast({ spellName: 'Beacon of Hope', targetIds: ['A', 'C'] });
    expect(saveMode('normal', r.c('C'), 'wis')).toBe('advantage');
    r.round();
    const healed = r.cast({ spellName: 'Healing Word', targetId: 'C' }).find((e) => e.type === 'healed');
    expect(healed).toMatchObject({ amount: 8 + 3, targetHpAfter: 16 });
    expect(fx(r.c('C'), 'spells:beacon-of-hope')?.deathSaveAdv).toBe(true);
    r.replays();
  });
  it('Protection from Energy: seçilen türe direnç; konsantrasyon kaybıyla biter', () => {
    const r = arena({ spellNames: ['Protection from Energy', 'Blur'] });
    expect(r.try({ type: 'cast_spell', actorId: 'A', spellName: 'Protection from Energy', targetId: 'C', choice: 'poison' })).toMatch(/seçim/);
    r.cast({ spellName: 'Protection from Energy', targetId: 'C', choice: 'fire' });
    expect(damageProfile(r.c('C')).resistances).toContain('fire');
    r.round();
    r.cast({ spellName: 'Blur' }); // yeni konsantrasyon eskisini bitirir
    expect(damageProfile(r.c('C')).resistances).not.toContain('fire');
    r.replays();
  });
  it('Haste: DEX save avantajı; bitince bir tur uyuşukluk (Incapacitated, hız 0), sonra kalkar', () => {
    const r = arena({ spellNames: ['Haste', 'Blur'] });
    r.cast({ spellName: 'Haste', targetId: 'C' });
    expect(saveMode('normal', r.c('C'), 'dex')).toBe('advantage');
    r.round();
    r.cast({ spellName: 'Blur' });
    expect(r.c('C').conditions).toContain('Incapacitated');
    expect(fx(r.c('C'), 'spells:haste/lethargy')?.speedZero).toBe(true);
    r.round(); r.round();
    expect(r.c('C').conditions).not.toContain('Incapacitated');
    r.replays();
  });
  it('Slow: tepki yok; tur sonu WIS save başarısında biter', () => {
    const r = arena({ spellNames: ['Slow'] }, { saves: { str: 0, dex: 0, con: 0, int: 0, wis: -10, cha: 0 } });
    r.cast({ spellName: 'Slow', targetIds: ['B'] });
    expect(fx(r.c('B'), 'spells:slow')?.repeatSave).toEqual({ ability: 'wis', dc: 13 });
    expect(canReact(r.c('B'))).toBe(false);
    r.end();
    const tick = r.end().find((e) => e.type === 'effect_tick');
    expect(tick?.type === 'effect_tick' && tick.save?.success).toBe(false);
    expect(fx(r.c('B'), 'spells:slow')).toBeDefined();
    r.state = { ...r.state, combatants: { ...r.state.combatants, B: { ...r.c('B'), saves: { ...r.c('B').saves, wis: 10 } } } };
    r.events.push({ type: 'battle_started', state: r.state });
    r.round();
    r.end();
    expect(r.end().some((e) => e.type === 'effect_ended' && e.effectId === 'spells:slow' && e.reason === 'save')).toBe(true);
    expect(canReact(r.c('B'))).toBe(true);
    r.replays();
  });
});

describe('süreli tekrar', () => {
  it('Acid Arrow: isabette hedefin sonraki tur sonunda 2d4 acid bir kez; ıskada yarı hasar', () => {
    const r = arena({ spellNames: ['Acid Arrow'] }, {}, {}, o(8, 3));
    const hit = r.cast({ spellName: 'Acid Arrow', targetId: 'B' }).find((e) => e.type === 'attack_resolved');
    expect(hit).toMatchObject({ hit: true, appliedDamage: 12 });
    expect(fx(r.c('B'), 'spells:acid-arrow')?.delayed).toEqual({ dice: '2d4', type: 'acid' });
    r.end();
    const end = r.end();
    expect(end.find((e) => e.type === 'effect_tick')).toMatchObject({ appliedDamage: 6, damageType: 'acid' });
    expect(fx(r.c('B'), 'spells:acid-arrow')).toBeUndefined();
    expect(r.c('B').hp).toBe(60 - 12 - 6);
    r.replays();
    const miss = arena({ spellNames: ['Acid Arrow'] }, { ac: 30 }, {}, o(8, 3));
    const ev = miss.cast({ spellName: 'Acid Arrow', targetId: 'B' }).find((e) => e.type === 'attack_resolved');
    expect(ev).toMatchObject({ hit: false, rawDamage: 6, appliedDamage: 6 });
    expect(fx(miss.c('B'), 'spells:acid-arrow')).toBeUndefined();
  });
  it('Heat Metal: CON save başarısızsa saldırıları dezavantajlı (büyücünün sonraki turuna dek); sonraki turlarda bonus eylemle aynı hedefe, slotsuz', () => {
    const r = arena({ spellNames: ['Heat Metal'] }, { saves: { str: 0, dex: 0, con: -10, int: 0, wis: 0, cha: 0 } }, {}, o(8, 3));
    r.cast({ spellName: 'Heat Metal', targetId: 'B' });
    expect(r.c('B').hp).toBe(50);
    expect(fx(r.c('B'), 'spells:heat-metal')).toMatchObject({ attackDis: {}, untilSourceTurn: true });
    expect(r.try({ type: 'spell_followup', actorId: 'A', targetId: 'B' })).toMatch(/sonraki tur/);
    r.end();
    expect(fx(r.c('B'), 'spells:heat-metal')).toBeDefined();
    r.end(); r.end();
    expect(fx(r.c('B'), 'spells:heat-metal')).toBeUndefined();
    const slots = r.c('A').spellSlots;
    expect(r.try({ type: 'spell_followup', actorId: 'A', targetId: 'C' })).toMatch(/ilk hedefe/);
    r.do({ type: 'spell_followup', actorId: 'A', targetId: 'B' });
    expect(r.c('B').hp).toBe(40);
    expect(r.c('A').spellSlots).toEqual(slots);
    expect(r.c('A').economy.bonus).toBe(true);
    expect(r.c('A').economy.action).toBe(false);
    r.replays();
  });
  it('Ray of Enfeeblement: başarısızsa STR save dezavantajı ve hasar −1d8, tur sonu save; başarılıysa sonraki saldırı dezavantajlı', () => {
    const r = arena({ spellNames: ['Ray of Enfeeblement'] }, { saves: { str: 0, dex: 0, con: -10, int: 0, wis: 0, cha: 0 } });
    r.cast({ spellName: 'Ray of Enfeeblement', targetId: 'B' });
    expect(saveMode('normal', r.c('B'), 'str')).toBe('disadvantage');
    r.end();
    const ev = r.do({ type: 'monster_attack', actorId: 'B', targetId: 'A', attackIndex: 0 }, GM).find((e) => e.type === 'attack_resolved');
    // Pençe 1d8+2 = 7; −1d8 (5): ham hasar cezadan sonra.
    expect(ev).toMatchObject({ damageRolls: [5], rawDamage: 2, appliedDamage: 2, penalty: 'Ray of Enfeeblement −5' });
    const ticks = r.end().filter((e) => e.type === 'effect_tick');
    expect(ticks).toHaveLength(1);
    r.replays();
    const s = arena({ spellNames: ['Ray of Enfeeblement'] }, { saves: { str: 0, dex: 0, con: 10, int: 0, wis: 0, cha: 0 } });
    s.cast({ spellName: 'Ray of Enfeeblement', targetId: 'B' });
    expect(fx(s.c('B'), 'spells:ray-of-enfeeblement')).toMatchObject({ attackDis: { single: true }, untilSourceTurn: true });
    s.end();
    const a1 = s.do({ type: 'monster_attack', actorId: 'B', targetId: 'A', attackIndex: 0 }, GM).find((e) => e.type === 'attack_resolved');
    expect(a1?.type === 'attack_resolved' && a1.mode).toBe('disadvantage');
    expect(fx(s.c('B'), 'spells:ray-of-enfeeblement')).toBeUndefined();
    s.replays();
  });
  it('Call Lightning: sonraki turda eylemle yeni şimşek, slot harcanmaz; Vampiric Touch hasarın yarısı kadar iyileştirir ve eylemle tekrar', () => {
    const r = arena({ spellNames: ['Call Lightning'] }, {}, {}, o(8, 3));
    r.cast({ spellName: 'Call Lightning', targetHex: o(8, 3) });
    r.round();
    const slots = r.c('A').spellSlots;
    const evs = r.do({ type: 'spell_followup', actorId: 'A', targetId: 'B' });
    expect(evs.some((e) => e.type === 'save_resolved' && e.targetId === 'B')).toBe(true);
    expect(r.c('A').spellSlots).toEqual(slots);
    expect(r.c('A').economy.action).toBe(true);
    r.replays();

    const v = arena({ spellNames: ['Vampiric Touch'], hp: 10 });
    const hit = v.cast({ spellName: 'Vampiric Touch', targetId: 'B' });
    const dealt = (hit.find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>).appliedDamage;
    expect(hit.find((e) => e.type === 'healed')).toMatchObject({ targetId: 'A', amount: Math.floor(dealt / 2) });
    v.round();
    v.do({ type: 'spell_followup', actorId: 'A', targetId: 'B' });
    expect(v.c('A').economy.action).toBe(true);
    v.replays();
  });
});

describe('iyileştirme', () => {
  it('Mass Healing Word: en çok altı hedef, her biri ayrı; Revivify yalnızca son 10 turda ölene', () => {
    const r = arena({ spellNames: ['Mass Healing Word', 'Revivify'], hp: 10 }, {}, { hp: 1 });
    const evs = r.cast({ spellName: 'Mass Healing Word', targetIds: ['A', 'C'] });
    expect(evs.filter((e) => e.type === 'healed').map((e) => e.type === 'healed' && e.targetId)).toEqual(['A', 'C']);
    expect(r.c('C').hp).toBe(1 + 6 + 3);
    expect(spellMenu(r.c('A')).find((x) => x.spell.name === 'Mass Healing Word')?.kind).toBe('effect');
    expect(effectTargetCount(spell('Mass Healing Word') as NonNullable<ReturnType<typeof spell>>, 3)).toBe(6);
    r.replays();
    const dead = arena({ spellNames: ['Revivify'] }, {}, { hp: 0, life: 'dead', diedRound: 1 });
    dead.state = { ...dead.state, round: 12 };
    expect(dead.try({ type: 'cast_spell', actorId: 'A', spellName: 'Revivify', targetId: 'C' })).toMatch(/10 tur/);
    dead.state = { ...dead.state, round: 5 };
    dead.cast({ spellName: 'Revivify', targetId: 'C' });
    expect(dead.c('C')).toMatchObject({ hp: 1, life: 'alive' });
  });
  it('0 HP\'ye düşen savaşçıda ölüm turu yazılır (diedRound), ayağa kalkınca silinir', () => {
    const r = arena({}, {}, { hp: 0, life: 'dying', deathSaves: { successes: 0, failures: 1 } });
    r.end(); r.end(() => 0.01);
    expect(r.c('C').life).toBe('dead');
    expect(r.c('C').diedRound).toBe(1);
    r.replays();
  });
});

describe('boyut, uçuş, itme ve Ensnaring Strike', () => {
  it('Enlarge/Reduce: dosta büyütme (save yok, +1d4 silah zarı, ⬆), düşmana küçültme (CON save, −1d4 en az 1, ⬇)', () => {
    const r = arena({ spellNames: ['Enlarge/Reduce'] }, { saves: { str: 0, dex: 0, con: -10, int: 0, wis: 0, cha: 0 } });
    r.cast({ spellName: 'Enlarge/Reduce', targetId: 'C' });
    expect(fx(r.c('C'), 'spells:enlarge-reduce')).toMatchObject({ name: 'Enlarge/Reduce (Enlarge)', size: 1, icon: '⬆', hitDie: '1d4' });
    expect(saveMode('normal', r.c('C'), 'str')).toBe('advantage');
    expect(buffExtraDice(r.state, r.c('C'), 'slashing')).toContainEqual({ label: 'Enlarge/Reduce (Enlarge)', expr: '1d4', type: 'slashing' });
    r.round();
    r.cast({ spellName: 'Enlarge/Reduce', targetId: 'B' });
    expect(fx(r.c('C'), 'spells:enlarge-reduce')).toBeUndefined();
    expect(fx(r.c('B'), 'spells:enlarge-reduce')).toMatchObject({ size: -1, icon: '⬇', damagePenalty: { die: '1d4', weaponOnly: true, min: 1 } });
    r.end();
    const ev = r.do({ type: 'monster_attack', actorId: 'B', targetId: 'A', attackIndex: 0 }, GM).find((e) => e.type === 'attack_resolved');
    expect(ev).toMatchObject({ damageRolls: [5], rawDamage: 4, appliedDamage: 4, penalty: 'Enlarge/Reduce (Reduce) −3' });
    r.replays();
  });
  it('Levitate dosta save\'siz; Gaseous Form: uçuş 10, B/P/S direnci, Prone bağışıklığı, saldırı ve büyü yok', () => {
    const r = arena({ spellNames: ['Levitate', 'Gaseous Form'] });
    const lev = r.cast({ spellName: 'Levitate', targetId: 'C' });
    expect(lev.some((e) => e.type === 'save_resolved')).toBe(false);
    expect(fx(r.c('C'), 'spells:levitate')?.airborne).toBe(true);
    r.round();
    r.cast({ spellName: 'Gaseous Form', targetId: 'C' });
    expect(fx(r.c('C'), 'spells:levitate')).toBeUndefined();
    expect(damageProfile(r.c('C')).resistances).toEqual(expect.arrayContaining(['bludgeoning', 'piercing', 'slashing']));
    r.end(); r.end();
    expect(r.try({ type: 'attack', actorId: 'C', targetId: 'B', option: sword }, P2)).toMatch(/Gaseous Form/);
    // 0 HP'ye düşünce biter.
    r.do({ type: 'adjust_hp', actorId: 'C', targetId: 'C', hp: 0 } as Command, GM);
    expect(fx(r.c('C'), 'spells:gaseous-form')).toBeUndefined();
    r.replays();
  });
  it('Gust of Wind: 60×10 ft çizgi, STR save başarısızsa 15 ft itilir (fırsat saldırısı yok); sonraki turda bonus eylemle yeni esinti', () => {
    const r = arena({ spellNames: ['Gust of Wind'] }, { saves: { str: -10, dex: 0, con: 0, int: 0, wis: 0, cha: 0 } });
    const evs = r.cast({ spellName: 'Gust of Wind', targetHex: o(8, 3) });
    expect(evs.some((e) => e.type === 'pushed' && e.targetId === 'B')).toBe(true);
    expect(evs.some((e) => e.type === 'attack_resolved')).toBe(false);
    expect(distance(r.c('A').pos as Offset, r.c('B').pos as Offset)).toBe(4);
    r.round();
    r.do({ type: 'spell_followup', actorId: 'A', targetId: 'B' });
    expect(distance(r.c('A').pos as Offset, r.c('B').pos as Offset)).toBe(7);
    expect(r.c('A').economy.bonus).toBe(true);
    r.replays();
  });
  it('Ensnaring Strike: isabetten sonra STR save; başarısızsa Restrained ve tur başı 1d6; konsantrasyon bitince Restrained kalkar', () => {
    const r = arena({ spellNames: ['Ensnaring Strike', 'Blur'] }, { saves: { str: -10, dex: 0, con: 0, int: 0, wis: 0, cha: 0 } });
    r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: sword });
    r.cast({ spellName: 'Ensnaring Strike', targetId: 'B' });
    expect(r.c('B').conditions).toContain('Restrained');
    r.end();
    expect(r.c('B').hp).toBeLessThan(60 - 7);
    r.end(); r.end();
    r.cast({ spellName: 'Blur' });
    expect(r.c('B').conditions).not.toContain('Restrained');
    expect(effectiveAc(r.state, r.c('B'))).toBe(12);
    r.replays();
  });
});
