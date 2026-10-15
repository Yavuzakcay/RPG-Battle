import { describe, it, expect } from 'vitest';
import { combatantFromMonster, combatantFromSheet, execute, replay, startBattle } from './index';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command, CommandContext } from './index';
import { getMonster } from '../data';
import { RAW_MAPS, validateMap, type RawMap } from '../map/maps';
import type { Offset } from '../rules/hex';
import { chooseEnemyCommand } from '../ui/autoplay';
import { GM, P1, mk, scripted, sword, zero } from './fixtures';

const o = (col: number, row: number): Offset => ({ col, row });

function board(fill: string, patch: Array<[Offset, string]> = []): string[] {
  const rows = Array.from({ length: 7 }, () => fill.repeat(15).split(''));
  for (const [h, ch] of patch) (rows[h.row] as string[])[h.col] = ch;
  return rows.map((r) => r.join(''));
}

/** Haritalı savaş (verilen harita kimliği ve altıgenlerle); sıra listedeki ilk savaşçıda. */
function field(mapId: string, parts: Combatant[], positions: Record<string, Offset>, tiles: string[]): BattleState {
  const { state } = startBattle('s', 'd-z-zemin', parts, scripted(...parts.map((_, i) => [20, 20 - i] as [number, number])), {
    map: { id: mapId },
  });
  const combatants = { ...state.combatants };
  for (const [id, pos] of Object.entries(positions)) combatants[id] = { ...(combatants[id] as Combatant), pos };
  return { ...state, status: 'active', combatants, map: { ...(state.map as NonNullable<BattleState['map']>), tiles } };
}

const A = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', modifiers: { ...zero, dex: 3 }, ...p });
const B = (p: Partial<Combatant> = {}) => mk('B', { side: 'enemies', hp: 50, maxHp: 50, ...p });
const bow: AttackOption = { ...sword, label: 'Longbow', ranged: true, range: [150, 600] };

function ok(r: ReturnType<typeof execute>) {
  if (!r.ok) throw new Error(r.error);
  return r;
}
const errorOf = (r: ReturnType<typeof execute>) => (r.ok ? '' : r.error);
const hide = (s: BattleState, roll: number, actorId = 'A', ctx: CommandContext = P1) =>
  execute(s, { type: 'hide', actorId }, ctx, scripted([20, roll], [20, roll]));
const hideEvent = (r: ReturnType<typeof execute>) => {
  const ev = ok(r).events[0];
  if (!ev || ev.type !== 'hide_attempted') throw new Error('beklenmeyen olay');
  return ev;
};
/** A'yı gizlenmiş hâlde (DC verilen) başlatır. */
const hiddenA = (dc: number, extra: Partial<Combatant> = {}) => A({ hidden: { dc }, ...extra });

describe('gizlenme yeri', () => {
  it('Çöl\'de açık kum gizlenme yeri (harita verisi), Volkan\'da açık zemin değil', () => {
    const desert = field('col', [A(), B()], { A: o(3, 3), B: o(12, 3) }, board('.'));
    expect(hideEvent(hide(desert, 12)).success).toBe(true); // 12 + DEX 3 = 15
    const volcano = field('volkan', [A(), B()], { A: o(3, 3), B: o(12, 3) }, board('.'));
    expect(errorOf(hide(volcano, 12))).toBe('Burada gizlenilemez (Açık zemin).');
  });
  it('çalılık (g) her haritada gizlenme yeri ve +2 verir; kum tepesi (d) katalogdan', () => {
    const bush = field('volkan', [A(), B()], { A: o(3, 3), B: o(12, 3) }, board('.', [[o(3, 3), 'g']]));
    const ev = hideEvent(hide(bush, 10));
    expect(ev.bonus).toBe(2);
    expect(ev.total).toBe(15); // 10 + DEX 3 + 2
    expect(ev.success).toBe(true);
    const dune = field('volkan', [A(), B()], { A: o(3, 3), B: o(12, 3) }, board('.', [[o(3, 3), 'd']]));
    expect(hide(dune, 12).ok).toBe(true);
  });
  it('başarı bulunma DC\'sini toplam yapar; başarısızlıkta gizlenmez; zaten gizliyse reddedilir', () => {
    const s = field('col', [A(), B()], { A: o(3, 3), B: o(12, 3) }, board('.'));
    const done = ok(hide(s, 16));
    expect(done.state.combatants.A?.hidden).toEqual({ dc: 19 });
    expect(errorOf(hide(done.state, 16))).toBe('Zaten gizlenmiş.');
    expect(ok(hide(s, 11)).state.combatants.A?.hidden).toBe(null); // 14 < 15
  });
  it('Stealth yetkinliği zara eklenir (5c)', () => {
    const s = field('col', [A({ skills: { stealth: 7 } }), B()], { A: o(3, 3), B: o(12, 3) }, board('.'));
    const ev = hideEvent(hide(s, 8));
    expect(ev.total).toBe(15); // 8 + Stealth 7 (DEX 3 + yetkinlik 2 + uzmanlık 2)
    expect(ev.success).toBe(true);
  });
  it('Stealth dezavantajlı zırh (Chain Mail) iki zar atar, düşüğünü alır', () => {
    const sheet = (armorName: string) => combatantFromSheet({
      name: 'X', raceId: 'human', classId: 'fighter', level: 1,
      baseScores: { str: 15, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }, armorName, shield: false, itemNames: [],
    }, { id: 'A', ownerId: 'p1' });
    expect(sheet('Chain Mail').stealthDisadvantage).toBe(true);
    expect(sheet('Half Plate Armor').stealthDisadvantage).toBe(true);
    expect(sheet('Breastplate').stealthDisadvantage).toBe(false);
    const s = field('col', [sheet('Chain Mail'), B()], { A: o(3, 3), B: o(12, 3) }, board('.'));
    const ev = hideEvent(execute(s, { type: 'hide', actorId: 'A' }, P1, scripted([20, 18], [20, 4])));
    expect(ev.mode).toBe('disadvantage');
    expect(ev.natural).toBe(4);
    expect(ev.success).toBe(false);
  });
  it('haritasız savaşta gizlenme yok', () => {
    const { state } = startBattle('x', 'd-z-zemin', [A(), B()], scripted([20, 20], [20, 1]));
    expect(errorOf(hide(state, 20))).toContain('haritalı savaşta');
  });
  it('harita doğrulaması: gizlenme yeri harfi katalogda olmalı', () => {
    const raw = JSON.parse(JSON.stringify(RAW_MAPS.find((m) => m.id === 'col'))) as RawMap;
    raw.hideTerrain = { '?': 0 };
    expect(validateMap(raw).some((e) => e.includes('gizlenme yeri bilinmeyen harf'))).toBe(true);
  });
});

describe('gizlenmiş yaratık', () => {
  it('düşmanlarca hedeflenemez: silah, büyü ve canavar saldırısı', () => {
    const wolf = combatantFromMonster(getMonster('wolf'), { id: 'W' });
    const caster = mk('C', { side: 'enemies', spellNames: ['Fire Bolt'], spellAttack: 5, level: 1 });
    const s = field('col', [B(), wolf, caster, hiddenA(18)], { A: o(3, 3), B: o(4, 3), W: o(3, 4), C: o(9, 3) }, board('.'));
    const msg = 'A gizlenmiş: hedef alınamaz, önce Ara ile bulunmalı.';
    const turnB = { ...s, turnIndex: s.order.indexOf('B') };
    expect(errorOf(execute(turnB, { type: 'attack', actorId: 'B', targetId: 'A', option: sword }, GM, scripted()))).toBe(msg);
    const turnW = { ...s, turnIndex: s.order.indexOf('W') };
    expect(errorOf(execute(turnW, { type: 'monster_attack', actorId: 'W', targetId: 'A', attackIndex: 0 }, GM, scripted()))).toBe(`Bite: ${msg}`);
    const turnC = { ...s, turnIndex: s.order.indexOf('C') };
    expect(errorOf(execute(turnC, { type: 'cast_spell', actorId: 'C', spellName: 'Fire Bolt', targetId: 'A' }, GM, scripted()))).toBe(msg);
  });
  it('müttefik gizlenmiş müttefikini iyileştirebilir', () => {
    const healer = mk('H', { ownerId: 'p2', spellNames: ['Cure Wounds'], spellMod: 3, spellSlots: [2, 0, 0, 0, 0, 0, 0, 0, 0] });
    const s = field('col', [healer, B(), hiddenA(18, { hp: 5 })], { H: o(3, 2), A: o(3, 3), B: o(12, 3) }, board('.'));
    const r = execute(s, { type: 'cast_spell', actorId: 'H', spellName: 'Cure Wounds', targetId: 'A' }, { playerId: 'p2', isGm: false },
      scripted([8, 4], [8, 4]));
    expect(r.ok).toBe(true);
  });
  it('saldırırken avantaj alır, sonra ortaya çıkar', () => {
    const s = field('col', [hiddenA(18), B()], { A: o(3, 3), B: o(9, 3) }, board('.'));
    const r = ok(execute(s, { type: 'attack', actorId: 'A', targetId: 'B', option: bow }, P1, scripted([20, 4], [20, 15], [8, 1])));
    const ev = r.events[0];
    expect(ev?.type === 'attack_resolved' && ev.mode).toBe('advantage');
    expect(ev?.type === 'attack_resolved' && ev.reasons).toContain('Gizlenmiş saldıran');
    expect(r.events[r.events.length - 1]).toEqual({ type: 'revealed', actorId: 'A', reason: 'saldırdı' });
    expect(r.state.combatants.A?.hidden).toBe(null);
  });
  it('yürüyünce, atlayınca ve büyü yapınca ortaya çıkar; arama yapınca çıkmaz', () => {
    const at = (p: Partial<Combatant> = {}) => field('col', [hiddenA(18, p), B()], { A: o(3, 3), B: o(12, 3) }, board('.'));
    expect(ok(execute(at(), { type: 'move', actorId: 'A', to: o(3, 5) }, P1, scripted())).state.combatants.A?.hidden).toBe(null);
    const jumped = ok(execute(at({ strScore: 15 }), { type: 'jump', actorId: 'A', to: o(3, 5) }, P1, scripted()));
    expect(jumped.events.map((e) => e.type)).toEqual(['jumped', 'revealed']);
    const caster = at({ spellNames: ['Fire Bolt'], spellAttack: 5, level: 1 });
    const cast = ok(execute(caster, { type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetId: 'B' }, P1, scripted([20, 15], [20, 15], [10, 1])));
    expect(cast.state.combatants.A?.hidden).toBe(null);
    expect(ok(execute(at(), { type: 'search', actorId: 'A' }, P1, scripted([20, 1]))).state.combatants.A?.hidden).toEqual({ dc: 18 });
  });
  it('düşman yapay zekâsı gizlenmiş karakteri hedef seçmez', () => {
    const wolf = combatantFromMonster(getMonster('wolf'), { id: 'W' });
    const s = field('col', [wolf, hiddenA(18, { hp: 1 }), mk('C', { ownerId: 'p2' })], { W: o(5, 3), A: o(3, 3), C: o(6, 3) }, board('.'));
    const cmd = chooseEnemyCommand(s);
    expect(cmd.type === 'monster_attack' && cmd.targetId).toBe('C');
  });
});

describe('arama (search)', () => {
  const searchAt = (roll: number, tiles = board('.'), wis = 0) => {
    const s = field('col', [B({ modifiers: { ...zero, wis } }), hiddenA(16)], { B: o(9, 3), A: o(3, 3) }, tiles);
    return ok(execute(s, { type: 'search', actorId: 'B' }, GM, scripted([20, roll])));
  };
  it('Perception toplamı bulunma DC\'sine ulaşırsa bulur', () => {
    const found = searchAt(14, board('.'), 2);
    expect(found.events[0]).toMatchObject({ type: 'searched', total: 16, found: ['A'] });
    expect(found.state.combatants.A?.hidden).toBe(null);
    const missed = searchAt(15);
    expect(missed.events[0]).toMatchObject({ found: [] });
    expect(missed.state.combatants.A?.hidden).toEqual({ dc: 16 });
  });
  it('Perception yetkinliği arama zarına eklenir (Wolf +5)', () => {
    const s = field('col', [hiddenA(16), combatantFromMonster(getMonster('wolf'), { id: 'W' })], { A: o(3, 3), W: o(12, 3) }, board('.'));
    const start = { ...s, turnIndex: s.order.indexOf('W') };
    const r = ok(execute(start, { type: 'search', actorId: 'W' }, GM, scripted([20, 11])));
    expect(r.events[0]).toMatchObject({ type: 'searched', total: 16, found: ['A'] });
  });
  it('görüş hattı kapalıysa bulamaz', () => {
    const walled = board('.', [[o(6, 3), 's'], [o(6, 2), 's'], [o(6, 4), 's']]);
    expect(searchAt(20, walled).events[0]).toMatchObject({ found: [] });
  });
});

describe('olaylardan yeniden kurma', () => {
  it('gizlenme, saldırı ve ortaya çıkma baştan oynatılınca aynı durum çıkar', () => {
    let s = field('col', [A(), B()], { A: o(3, 3), B: o(9, 3) }, board('.'));
    const all: BattleEvent[] = [{ type: 'battle_started', state: s }];
    const go = (cmd: Command, rng: ReturnType<typeof scripted>) => {
      const r = ok(execute(s, cmd, P1, rng));
      s = r.state;
      all.push(...r.events);
    };
    go({ type: 'hide', actorId: 'A' }, scripted([20, 15]));
    go({ type: 'attack', actorId: 'A', targetId: 'B', option: bow }, scripted([20, 4], [20, 15], [8, 1]));
    expect(replay(all)).toEqual(s);
  });
});
