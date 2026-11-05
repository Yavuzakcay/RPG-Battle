/**
 * Kuyruk A2: canavar saldırı eklerinin veriyle bağlanması (data/canavar-ekleri-a2.json, ridersA2.ts; kural sürümü 30).
 * Her ek türü: uygulanır, süre/kurtarma işler, sürüm 29'da (eski kayıt) yok; K53 itme/çarpma bağlantısı; replay aynı.
 */
import { describe, expect, it } from 'vitest';
import { combatantFromMonster, execute, replay, startBattle } from './index';
import type { BattleEvent, BattleState, Combatant, Command } from './index';
import type { Offset } from '../rules/hex';
import { distance } from '../rules/hex';
import type { Rng } from '../rules/dice';
import { getMonster } from '../data';
import { GM, P1, mk, scripted, zero } from './fixtures';
import { FRESH_ECONOMY } from './types';
import { forcedMove } from './motion';
import { A2_RIDERS, RIDERS_A2_VERSION, a2Of } from './ridersA2';
import { allRiders } from './riders';
import { CURRENT_RULES } from './ruleVersion';

const o = (col: number, row: number): Offset => ({ col, row });
const flat = () => Array.from({ length: 7 }, () => '.'.repeat(15));
/** Önce verilen değerler, sonra `rest` (0..1): d20 = floor(v·20)+1. */
const seq = (vals: number[], rest: number): Rng => { let i = 0; return () => (i < vals.length ? vals[i++]! : rest); };
const LOW: Rng = () => 0.01;
const HIGH: Rng = () => 0.99;

function field(parts: Combatant[], positions: Record<string, Offset>, version = CURRENT_RULES, houseRules?: Record<string, boolean>): BattleState {
  const { state } = startBattle('a2', 'd-z-zemin', parts.map((c) => ({ ...c, initiativeBonus: 0 })), scripted(...parts.map((_, i) => [20, 20 - i] as [number, number])), { map: { id: 'kale' } });
  const combatants = { ...state.combatants };
  for (const [id, pos] of Object.entries(positions)) combatants[id] = { ...(combatants[id] as Combatant), pos };
  return { ...state, status: 'active', combatants, map: { ...(state.map as NonNullable<BattleState['map']>), tiles: flat() }, kuralSurumu: version,
    ...(houseRules ? { evKurallari: { ...(state as { evKurallari?: Record<string, boolean> }).evKurallari, ...houseRules } } : {}) } as BattleState;
}
const monster = (id: string, cid: string): Combatant => ({ ...combatantFromMonster(getMonster(id), { id: cid }), side: 'enemies' });
const hero = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', hp: 60, maxHp: 60, ac: 10, modifiers: { ...zero }, ...p });
const idx = (c: Combatant, name: string) => c.attacks.findIndex((a) => a.name === name);

class Run {
  events: BattleEvent[];
  constructor(public state: BattleState) { this.events = [{ type: 'battle_started', state }]; }
  do(cmd: Command, rng: Rng = LOW) {
    const own = 'actorId' in cmd && this.state.combatants[(cmd as { actorId: string }).actorId]?.ownerId === 'p1';
    const r = execute(this.state, cmd, own ? P1 : GM, rng);
    if (!r.ok) throw new Error(r.error);
    this.state = r.state; this.events.push(...r.events);
    return r.events;
  }
  attack(actorId: string, name: string, rng: Rng, targetId = 'A') {
    return this.do({ type: 'monster_attack', actorId, targetId, attackIndex: idx(this.state.combatants[actorId]!, name) }, rng);
  }
}

describe('A2 veri', () => {
  it('kural sürümü 30; her kayıt attack-riders.json\'da yok/kısmen olan bir saldırıya ait', () => {
    expect(RIDERS_A2_VERSION).toBe(30);
    expect(CURRENT_RULES).toBeGreaterThanOrEqual(30);
    const riders = allRiders();
    for (const k of Object.keys(A2_RIDERS)) {
      expect(riders[k], k).toBeDefined();
      expect(['yok', 'kısmen'], k).toContain(riders[k]!.status);
    }
    expect(a2Of({ kuralSurumu: 29 }, 'satyr', 'Hooves')).toBeUndefined();
    expect(a2Of({ kuralSurumu: 30 }, 'satyr', 'Hooves')?.push).toEqual({ mode: 'push', ft: 10, maxSize: 'M' });
  });
});

describe('itme/çekme (K53 forcedMove)', () => {
  it('Satyr Hooves: isabette 10 ft itme; sürüm 29\'da itme yok; replay aynı', () => {
    const r = new Run(field([monster('satyr', 'S'), hero()], { S: o(3, 3), A: o(4, 3) }));
    r.attack('S', 'Hooves', HIGH);
    expect(distance(o(3, 3), r.state.combatants.A!.pos!)).toBe(3);
    expect(replay(r.events)).toEqual(r.state);
    const old = new Run(field([monster('satyr', 'S'), hero()], { S: o(3, 3), A: o(4, 3) }, 29));
    old.attack('S', 'Hooves', HIGH);
    expect(old.state.combatants.A!.pos).toEqual(o(4, 3));
  });
  it('Merrow Harpoon: 15 ft çekme, bitişikte durur', () => {
    const r = new Run(field([monster('merrow', 'M'), hero()], { M: o(2, 3), A: o(4, 3) }));
    r.attack('M', 'Harpoon (menzilli)', HIGH);
    expect(distance(o(2, 3), r.state.combatants.A!.pos!)).toBe(1);
  });
  it('Satyr Hooves boyut sınırı: Large hedef itilmez', () => {
    const r = new Run(field([monster('satyr', 'S'), hero({ size: 'L' })], { S: o(3, 3), A: o(4, 3) }));
    r.attack('S', 'Hooves', HIGH);
    expect(r.state.combatants.A!.pos).toEqual(o(4, 3));
  });
  it('çarpma ev kuralı (carpmaHasari) açıkken duvara itilen hasar alır', () => {
    const s0 = field([monster('satyr', 'S'), hero()], { S: o(4, 3), A: o(5, 3) }, CURRENT_RULES);
    const first = (forcedMove(s0, 'A', 'push', 5, 'S', HIGH, { origin: o(4, 3) })[0] as Extract<BattleEvent, { type: 'pushed' }>).to;
    const tiles = flat().map((row, i) => (i === first.row ? `${row.slice(0, first.col)}#${row.slice(first.col + 1)}` : row));
    const s = { ...s0, map: { ...(s0.map as NonNullable<BattleState['map']>), tiles } } as BattleState;
    const on = new Run({ ...s, houseRules: { ...(s.houseRules ?? {}), carpmaHasari: true } } as BattleState);
    const evs = on.attack('S', 'Hooves', HIGH);
    expect(evs.some((e) => e.type === 'map_effect' && e.rule === 'carpmaHasari')).toBe(true);
  });
});

describe('hız/eylem kısıtı', () => {
  it('Ettin Morningstar: hedefin sonraki saldırısı dezavantajlı, kendi tur sonunda biter', () => {
    const r = new Run(field([monster('ettin', 'E'), hero()], { E: o(3, 3), A: o(4, 3) }));
    r.attack('E', 'Morningstar', HIGH);
    const e = r.state.combatants.A!.effects?.find((x) => x.attackDis);
    expect(e).toMatchObject({ attackDis: { single: true }, untilOwnTurnEnd: true });
    expect(replay(r.events)).toEqual(r.state);
  });
  it('Balor Lightning Blade: Balor\'un sonraki turunun başına dek tepki yok', () => {
    const r = new Run(field([monster('balor', 'B'), hero({ hp: 300, maxHp: 300 })], { B: o(3, 3), A: o(4, 3) }));
    r.attack('B', 'Lightning Blade', HIGH);
    expect(r.state.combatants.A!.effects?.find((x) => x.noReactions)).toMatchObject({ untilSourceTurn: true, sourceId: 'B' });
  });
  it('Pirate Captain Rapier: kaptan bu tur ilk saldırısında avantajlı (kendine etki)', () => {
    const r = new Run(field([monster('pirate-captain', 'P'), hero()], { P: o(3, 3), A: o(4, 3) }));
    r.attack('P', 'Rapier', HIGH);
    expect(r.state.combatants.P!.effects?.find((x) => x.firstRoll)).toMatchObject({ firstRoll: { mode: 'advantage', on: ['attack'] }, untilOwnTurnEnd: true });
  });
  it('Copper Slowing Breath (save başarısız): tepki yok, hız yarı, slowed; save başarılıysa yok', () => {
    const r = new Run(field([monster('copper-dragon-wyrmling', 'D'), hero()], { D: o(3, 3), A: o(4, 3) }));
    r.attack('D', 'Slowing Breath', LOW);
    expect(r.state.combatants.A!.effects?.find((x) => x.slowed)).toMatchObject({ noReactions: true, speedMult: 0.5, slowed: true });
    const ok = new Run(field([monster('copper-dragon-wyrmling', 'D'), hero()], { D: o(3, 3), A: o(4, 3) }));
    ok.attack('D', 'Slowing Breath', HIGH);
    expect(ok.state.combatants.A!.effects?.some((x) => x.slowed) ?? false).toBe(false);
  });
  it('Gold Weakening Breath: STR dezavantajı + hasar cezası + tekrar save; zaten etkilenene yeniden işlemez', () => {
    const r = new Run(field([monster('gold-dragon-wyrmling', 'D'), hero()], { D: o(3, 3), A: o(4, 3) }));
    r.attack('D', 'Weakening Breath', LOW);
    const e = r.state.combatants.A!.effects?.find((x) => x.damagePenalty);
    expect(e).toMatchObject({ checkDis: ['str'], saveDis: ['str'], damagePenalty: { die: '1d4' }, repeatSave: { ability: 'str', dc: 13 } });
    const before = r.state.combatants.A!.effects?.length;
    r.state = { ...r.state, combatants: { ...r.state.combatants, D: { ...r.state.combatants.D!, rechargeUsed: [], economy: FRESH_ECONOMY } } };
    r.attack('D', 'Weakening Breath', LOW);
    expect(r.state.combatants.A!.effects?.length).toBe(before);
  });
});

describe('ikinci aşama ve süreli durumlar', () => {
  it('Brass Sleep Breath: Incapacitated → ikinci başarısız save Unconscious (hasarla uyanır)', () => {
    const r = new Run(field([monster('brass-dragon-wyrmling', 'D'), hero()], { D: o(3, 3), A: o(4, 3) }));
    r.attack('D', 'Sleep Breath', LOW);
    expect(r.state.combatants.A!.conditions).toContain('Incapacitated');
    expect(r.state.combatants.A!.conditionTimers?.find((t) => t.condition === 'Incapacitated')).toMatchObject({ save: { ability: 'con', dc: 11 }, escalate: { condition: 'Unconscious', rounds: 10 }, wakeOnDamage: true });
    r.do({ type: 'end_turn', actorId: 'D' });
    r.do({ type: 'end_turn', actorId: 'A' }, LOW);
    expect(r.state.combatants.A!.conditions).toContain('Unconscious');
    expect(r.state.combatants.A!.conditions).not.toContain('Incapacitated');
    expect(replay(r.events)).toEqual(r.state);
  });
  it('Silver Paralyzing Breath: ikinci aşama Paralyzed (save sürer); Gorgon Petrified', () => {
    const r = new Run(field([monster('silver-dragon-wyrmling', 'D'), hero()], { D: o(3, 3), A: o(4, 3) }));
    r.attack('D', 'Paralyzing Breath', LOW);
    r.do({ type: 'end_turn', actorId: 'D' });
    r.do({ type: 'end_turn', actorId: 'A' }, LOW);
    expect(r.state.combatants.A!.conditions).toContain('Paralyzed');
    expect(r.state.combatants.A!.conditionTimers?.find((t) => t.condition === 'Paralyzed')?.save).toEqual({ ability: 'con', dc: 13 });
    const g = new Run(field([monster('gorgon', 'G'), hero()], { G: o(3, 3), A: o(4, 3) }));
    g.attack('G', 'Petrifying Breath', LOW);
    expect(g.state.combatants.A!.conditions).toContain('Restrained');
  });
  it('sürüm 29: Sleep Breath durum vermez (eski davranış)', () => {
    const r = new Run(field([monster('brass-dragon-wyrmling', 'D'), hero()], { D: o(3, 3), A: o(4, 3) }, 29));
    r.attack('D', 'Sleep Breath', LOW);
    expect(r.state.combatants.A!.conditions).not.toContain('Incapacitated');
  });
  it('Djinni Create Whirlwind: Restrained + tur başı thunder + save', () => {
    const r = new Run(field([monster('djinni', 'J'), hero({ hp: 200, maxHp: 200 })], { J: o(3, 3), A: o(4, 3) }));
    r.attack('J', 'Create Whirlwind', LOW);
    expect(r.state.combatants.A!.conditionTimers?.find((t) => t.condition === 'Restrained')).toMatchObject({ dot: { dice: '6d6', type: 'thunder' }, save: { ability: 'str', dc: 17 } });
  });
});

describe('yakalamaya bağlı, 0 HP, HP eşiği, yutma, aşındırma, ek hasar', () => {
  it('Roper Tentacle: yakalama sürdükçe Poisoned; yakalama bitince düşer', () => {
    const r = new Run(field([monster('roper', 'R'), hero()], { R: o(3, 3), A: o(4, 3) }));
    r.attack('R', 'Tentacle', HIGH);
    expect(r.state.combatants.A!.conditions).toEqual(expect.arrayContaining(['Grappled', 'Poisoned']));
    r.do({ type: 'end_turn', actorId: 'R' });
    // Kaçış başarılı (d20 = 20): yakalama ve ona bağlı Poisoned biter.
    r.do({ type: 'escape_grapple', actorId: 'A' } as Command, HIGH);
    expect(r.state.combatants.A!.conditions).not.toContain('Poisoned');
    expect(replay(r.events)).toEqual(r.state);
  });
  it('Phase Spider Bite 0 HP: Stable + Poisoned + Paralyzed', () => {
    const r = new Run(field([monster('phase-spider', 'P'), hero({ hp: 1, maxHp: 30 })], { P: o(3, 3), A: o(4, 3) }));
    r.attack('P', 'Bite', HIGH);
    const a = r.state.combatants.A!;
    expect(a.life).toBe('stable');
    expect(a.conditions).toEqual(expect.arrayContaining(['Poisoned', 'Paralyzed']));
  });
  it('Gibbering Mouther Bite 0 HP: ölür', () => {
    const r = new Run(field([monster('gibbering-mouther', 'G'), hero({ hp: 1, maxHp: 30 })], { G: o(3, 3), A: o(4, 3) }));
    r.attack('G', 'Bite', HIGH);
    expect(r.state.combatants.A!.life).toBe('dead');
  });
  it('Sea Hag Death Glare: HP ≤ 20 → 0 HP (ölmekte); üstünde 3d8 psychic', () => {
    const r = new Run(field([monster('sea-hag', 'H'), hero({ hp: 15, maxHp: 30 })], { H: o(3, 3), A: o(4, 3) }));
    r.attack('H', 'Death Glare', LOW);
    expect(r.state.combatants.A!.hp).toBe(0);
    expect(r.state.combatants.A!.life).toBe('dying');
    const b = new Run(field([monster('sea-hag', 'H'), hero({ hp: 50, maxHp: 50 })], { H: o(3, 3), A: o(4, 3) }));
    b.attack('H', 'Death Glare', LOW);
    expect(b.state.combatants.A!.hp).toBeLessThan(50);
    expect(b.state.combatants.A!.hp).toBeGreaterThan(20);
  });
  it('Mummy Rotting Fist: lanet (HP kazanamaz)', () => {
    const r = new Run(field([monster('mummy', 'M'), hero()], { M: o(3, 3), A: o(4, 3) }));
    r.attack('M', 'Rotting Fist', HIGH);
    expect(r.state.combatants.A!.effects?.some((e) => e.noHeal)).toBe(true);
  });
  it('Gelatinous Cube Engulf: yutma yolu (Restrained, hedef alınamaz) ve kaçış kontrolü', () => {
    const r = new Run(field([monster('gelatinous-cube', 'G'), hero()], { G: o(3, 3), A: o(4, 3) }));
    r.attack('G', 'Engulf', LOW);
    const e = r.state.combatants.A!.effects?.find((x) => x.swallowedBy === 'G');
    expect(e).toMatchObject({ swallow: { dice: '3d6', type: 'acid' }, escapeCheck: { dc: 12 } });
    expect(r.state.combatants.A!.conditions).toContain('Restrained');
  });
  it('Gray Ooze Pseudopod: zırhlı hedefte AC −1 birikimli; zırhsızda yok', () => {
    const r = new Run(field([monster('gray-ooze', 'O'), hero({ ac: 16 })], { O: o(3, 3), A: o(4, 3) }));
    r.attack('O', 'Pseudopod', HIGH);
    expect(r.state.combatants.A!.effects?.find((e) => e.id.startsWith('a2:corrode-armor'))?.ac).toBe(-1);
    const n = new Run(field([monster('gray-ooze', 'O'), hero({ ac: 10 })], { O: o(3, 3), A: o(4, 3) }));
    n.attack('O', 'Pseudopod', HIGH);
    expect(n.state.combatants.A!.effects?.some((e) => e.id.startsWith('a2:corrode-armor')) ?? false).toBe(false);
  });
  it('Cultist Ritual Sickle: +1 necrotic ek hasar; sürüm 29\'da yok', () => {
    const r = new Run(field([monster('cultist', 'C'), hero()], { C: o(3, 3), A: o(4, 3) }));
    const evs = r.attack('C', 'Ritual Sickle', HIGH);
    const atk = evs.find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }> & { extra?: Array<{ type: string; raw: number }> };
    expect(atk.extra?.find((x) => x.type === 'necrotic')?.raw).toBe(1);
    const old = new Run(field([monster('cultist', 'C'), hero()], { C: o(3, 3), A: o(4, 3) }, 29));
    const e2 = old.attack('C', 'Ritual Sickle', HIGH).find((e) => e.type === 'attack_resolved') as { extra?: unknown[] };
    expect(e2.extra).toBeUndefined();
  });
  it('Magmin Touch: tutuşur (tur başı ateş + DEX ile söner)', () => {
    const r = new Run(field([monster('magmin', 'M'), hero()], { M: o(3, 3), A: o(4, 3) }));
    r.attack('M', 'Touch', HIGH);
    expect(r.state.combatants.A!.effects?.find((e) => e.ongoing)).toMatchObject({ ongoing: { dice: '1d4', type: 'fire', save: 'dex', dc: 10 } });
  });
});
