import { describe, it, expect } from 'vitest';
import { execute, replay, startBattle } from './index';
import type { BattleEvent, BattleState, Combatant, Command } from './index';
import type { Offset } from '../rules/hex';
import { P1, dice, mk, scripted, zero } from './fixtures';

const o = (col: number, row: number): Offset => ({ col, row });

function board(patch: Array<[Offset, string]> = []): string[] {
  const rows = Array.from({ length: 7 }, () => '.'.repeat(15).split(''));
  for (const [h, ch] of patch) (rows[h.row] as string[])[h.col] = ch;
  return rows.map((r) => r.join(''));
}

/** Düz zemin ortamlı haritalı savaş (Ada güneşli: ortam kuralı yok); sıra büyücüde. */
function field(parts: Combatant[], positions: Record<string, Offset>, tiles = board()): BattleState {
  const { state } = startBattle('a', 'd-z-zemin', parts, scripted(...parts.map((_, i) => [20, 20 - i] as [number, number])), {
    map: { id: 'ada', variantId: 'gunes' },
  });
  const combatants = { ...state.combatants };
  for (const [id, pos] of Object.entries(positions)) combatants[id] = { ...(combatants[id] as Combatant), pos };
  return { ...state, status: 'active', combatants, map: { ...(state.map as NonNullable<BattleState['map']>), tiles } };
}

const KNOWN = ['Fireball', 'Burning Hands', 'Lightning Bolt', 'Spirit Guardians', 'Sleep', 'Fire Bolt'];
const wizard = () => mk('W', {
  ownerId: 'p1', level: 5, spellMod: 4, spellSaveDc: 15, spellAttack: 7, spellNames: KNOWN,
  spellSlots: [4, 3, 2, 0, 0, 0, 0, 0, 0], hp: 60, maxHp: 60,
});
const foe = (id: string, p: Partial<Combatant> = {}) => mk(id, { side: 'enemies', hp: 60, maxHp: 60, ...p });
const ally = (id: string) => mk(id, { ownerId: 'p2', hp: 60, maxHp: 60 });

const cast = (s: BattleState, spellName: string, at: { targetHex?: Offset; targetId?: string }, rng = scripted()) =>
  execute(s, { type: 'cast_spell', actorId: 'W', spellName, ...at }, P1, rng);
function ok(r: ReturnType<typeof execute>) {
  if (!r.ok) throw new Error(r.error);
  return r;
}
const errorOf = (r: ReturnType<typeof execute>) => (r.ok ? '' : r.error);
const saves = (events: BattleEvent[]) =>
  events.filter((e): e is Extract<BattleEvent, { type: 'save_resolved' }> => e.type === 'save_resolved');
/** Her hedef için bir save zarı (5) ve 8d6 hasar (hepsi 3). */
const fireballRng = (targets: number) => scripted(...dice(6, 3, 3, 3, 3, 3, 3, 3, 3), ...dice(20, ...Array<number>(targets).fill(5)));

describe('Fireball (20 ft küre, noktadan)', () => {
  it('alandaki herkesi etkiler (müttefik ve büyücü dahil); hasar bir kez atılır', () => {
    const s = field([wizard(), foe('E1'), foe('E2'), ally('M'), foe('Far')],
      { W: o(9, 3), E1: o(10, 3), E2: o(12, 4), M: o(9, 5), Far: o(1, 3) });
    const r = ok(cast(s, 'Fireball', { targetHex: o(11, 3) }, fireballRng(4)));
    const hit = saves(r.events);
    expect(hit.map((e) => e.targetId).sort()).toEqual(['E1', 'E2', 'M', 'W']);
    expect(new Set(hit.map((e) => e.rawDamage))).toEqual(new Set([24]));
    expect(hit.every((e) => e.damageRolls.length === 8)).toBe(true);
    const note = r.events.find((e) => e.type === 'spell_cast');
    expect(note?.type === 'spell_cast' && note.note).toContain('20 ft küre, merkez sütun 12, satır 4');
  });
  it('nokta menzil dışında, duvarın arkasında veya duvarın içindeyse reddedilir', () => {
    const s = (tiles?: string[]) => field([wizard(), foe('E')], { W: o(0, 3), E: o(14, 3) }, tiles);
    expect(ok(cast(s(), 'Fireball', { targetHex: o(14, 3) }, fireballRng(1))).ok).toBe(true); // 70 ft < 150
    const walled = board([[o(2, 2), 's'], [o(2, 3), 's'], [o(2, 4), 's']]);
    expect(errorOf(cast(s(walled), 'Fireball', { targetHex: o(6, 3) }))).toBe('Nokta görülemiyor: arada Duvar var.');
    expect(errorOf(cast(s(board([[o(6, 3), 's']])), 'Fireball', { targetHex: o(6, 3) }))).toContain('büyü yapılamaz (Duvar)');
  });
  it('patlama noktasından tam siper arkasındaki etkilenmez; siper noktadan hesaplanır', () => {
    // Nokta (7,1); E1 (7,3) arada duvar (7,2) → etkilenmez. E2 (7,0) açık. Büyücü uzakta solda.
    const wall = field([wizard(), foe('E1'), foe('E2')], { W: o(1, 1), E1: o(7, 3), E2: o(7, 0) }, board([[o(7, 2), 's']]));
    const r = ok(cast(wall, 'Fireball', { targetHex: o(7, 1) }, fireballRng(1)));
    expect(saves(r.events).map((e) => e.targetId)).toEqual(['E2']);
    // Noktayla E arasında varil (7,2): büyücü→E çizgisinde varil yok, yine de E yarım siper alır.
    const barrel = field([wizard(), foe('E')], { W: o(1, 3), E: o(7, 3) }, board([[o(7, 2), 'x']]));
    const ev = saves(ok(cast(barrel, 'Fireball', { targetHex: o(7, 1) }, fireballRng(1))).events)[0];
    expect(ev?.cover).toBe(2);
    expect(ev?.total).toBe(7); // zar 5 + DEX 0 + siper 2
  });
  it('hedef yaratık verilirse alanın merkezi onun altıgeni olur', () => {
    const s = field([wizard(), foe('E')], { W: o(1, 3), E: o(9, 3) });
    const r = ok(cast(s, 'Fireball', { targetId: 'E' }, fireballRng(1)));
    expect(saves(r.events).map((e) => e.targetId)).toEqual(['E']);
  });
});

describe('büyücüden çıkan alanlar', () => {
  it('Burning Hands (15 ft koni): yalnızca koninin içindekiler', () => {
    const s = field([wizard(), foe('In'), foe('Side'), foe('Far')], { W: o(7, 1), In: o(7, 3), Side: o(5, 1), Far: o(7, 5) });
    const r = ok(cast(s, 'Burning Hands', { targetHex: o(7, 4) }, scripted(...dice(6, 3, 3, 3), [20, 5])));
    expect(saves(r.events).map((e) => e.targetId)).toEqual(['In']);
    expect(errorOf(cast(s, 'Burning Hands', { targetId: 'Far' }))).toBe('Far alanın dışında veya tam siper arkasında.');
    expect(ok(cast(s, 'Burning Hands', { targetHex: o(9, 0) }, scripted(...dice(6, 3, 3, 3)))).events.some((e) => e.type === 'save_resolved')).toBe(false);
    expect(errorOf(cast(s, 'Burning Hands', { targetHex: o(7, 1) }))).toContain('Yön için');
  });
  it('Lightning Bolt (100 ft çizgi): çizgideki herkes, duvarın arkası hariç', () => {
    const s = field([wizard(), foe('A1'), foe('A2'), foe('Behind')], { W: o(7, 0), A1: o(7, 2), A2: o(7, 4), Behind: o(7, 6) },
      board([[o(7, 5), 's']]));
    const r = ok(cast(s, 'Lightning Bolt', { targetHex: o(7, 1) }, scripted(...dice(6, 3, 3, 3, 3, 3, 3, 3, 3), [20, 5], [20, 5])));
    expect(saves(r.events).map((e) => e.targetId).sort()).toEqual(['A1', 'A2']);
  });
  it('Spirit Guardians (15 ft yayılım, yalnızca düşmanlar): müttefik ve uzaktaki etkilenmez', () => {
    const s = field([wizard(), foe('Near'), ally('Friend'), foe('Far')], { W: o(7, 3), Near: o(9, 3), Friend: o(8, 3), Far: o(12, 3) });
    const r = ok(cast(s, 'Spirit Guardians', {}, scripted(...dice(8, 4, 4, 4), [20, 5])));
    expect(saves(r.events).map((e) => e.targetId)).toEqual(['Near']);
  });
});

describe('Sleep (5 ft küre, yalnızca düşmanlar)', () => {
  it('zar toplamı en düşük HP\'den başlayarak düşmanları uyutur; müttefik etkilenmez', () => {
    const s = field([wizard(), foe('Weak', { hp: 8 }), foe('Mid', { hp: 12 }), ally('Friend')],
      { W: o(1, 3), Weak: o(7, 3), Mid: o(8, 3), Friend: o(7, 4) });
    const r = ok(cast(s, 'Sleep', { targetHex: o(7, 3) }, scripted(...dice(8, 5, 5, 5, 3, 3))));
    const asleep = r.events.filter((e) => e.type === 'condition_changed').map((e) => e.type === 'condition_changed' && e.targetId);
    expect(asleep).toEqual(['Weak', 'Mid']); // 21 puan: 8 + 12
    expect(r.state.combatants.Friend?.conditions).toEqual([]);
  });
});

describe('haritasız savaş ve yeniden kurma', () => {
  it('haritasız savaşta alan büyüsü eskisi gibi tek hedefe', () => {
    const { state } = startBattle('x', 'd-z-zemin', [wizard(), foe('E'), foe('F')], scripted([20, 20], [20, 10], [20, 9]));
    const r = ok(execute(state, { type: 'cast_spell', actorId: 'W', spellName: 'Fireball', targetId: 'E' }, P1, fireballRng(1)));
    expect(saves(r.events).map((e) => e.targetId)).toEqual(['E']);
  });
  it('alan büyüsü olayları baştan oynatılınca aynı durum çıkar', () => {
    let s = field([wizard(), foe('E1'), foe('E2', { modifiers: { ...zero, dex: 2 } })], { W: o(1, 3), E1: o(9, 3), E2: o(10, 3) });
    const all: BattleEvent[] = [{ type: 'battle_started', state: s }];
    const r = ok(execute(s, { type: 'cast_spell', actorId: 'W', spellName: 'Fireball', targetHex: o(9, 3) } as Command, P1, fireballRng(2)));
    s = r.state;
    all.push(...r.events);
    expect(replay(all)).toEqual(s);
  });
});
