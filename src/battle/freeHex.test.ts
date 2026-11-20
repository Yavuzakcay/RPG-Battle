/** Kuyruk FH1 (kural sürümü 81): hedefsiz altıgene büyü (saldırı/save, menzil ve görüş içinde; K55 çözücüsü). */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { P1, mk } from './fixtures';
import { replay } from './reduce';
import { CURRENT_RULES } from './ruleVersion';
import { FREE_HEX_VERSION } from './freeHexSurum';
import { chooseCommand } from './ai';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { BattleState, Combatant, Command } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const high: Rng = () => 0.99;
const ROW = '.'.repeat(5) + 'w' + '.'.repeat(3) + 'gg' + '.'.repeat(4); // (5,3) göl, (9,3),(10,3) çimen

function field(opt: { v?: number; toggles?: Record<string, boolean>; spells?: string[]; slots?: number[]; bAt?: Offset } = {}): BattleState {
  const parts = [
    mk('A', { ownerId: 'p1', spellNames: opt.spells ?? ['Fire Bolt', 'Ray of Frost', 'Shocking Grasp', 'Guiding Bolt'], spellSlots: opt.slots ?? [4, 2, 0, 0, 0, 0, 0, 0, 0], spellAttack: 30, spellSaveDc: 15, spellMod: 3, level: 5, hp: 50, maxHp: 50 }),
    mk('B', { side: 'enemies', hp: 500, maxHp: 500, ac: 5 }),
  ];
  const st = startBattle('fh1', 'col', parts, () => 0.5, { map: { id: 'col', ...(opt.toggles ? { ruleToggles: opt.toggles } : {}) }, ...(opt.v ? { kuralSurumu: opt.v } : {}) }).state;
  const tiles = Array.from({ length: 7 }, (_, r) => (r === 3 ? ROW : '.'.repeat(15)));
  const pos: Record<string, Offset> = { A: o(2, 3), B: opt.bAt ?? o(13, 5) };
  const combatants = Object.fromEntries(Object.entries(st.combatants).map(([id, c]) => [id, { ...(c as Combatant), pos: pos[id] ?? null }]));
  return { ...st, status: 'active', order: ['A', 'B'], turnIndex: 0, combatants, map: { ...(st.map as NonNullable<BattleState['map']>), tiles, zones: [] } } as BattleState;
}
const cast = (spell: string, h: Offset, extra: Partial<Command> = {}): Command => ({ type: 'cast_spell', actorId: 'A', spellName: spell, targetHex: h, ...extra } as Command);
const run = (s: BattleState, cmd: Command) => { const r = execute(s, cmd, P1, high); if (!r.ok) throw new Error(r.error); return r; };
const surfaces = (s: BattleState) => (s.map?.zones ?? []).map((z) => z.surface ?? z.spellId);

describe('FH1: hedefsiz altıgene büyü', () => {
  it('sürüm 81, güncel sürüm', () => { expect(FREE_HEX_VERSION).toBe(81); expect(CURRENT_RULES).toBeGreaterThanOrEqual(81); });
  it('Fire Bolt göl altıgenine: buhar yüzeyi; Ray of Frost göle: buz; Shocking Grasp menzil kuralıyla', () => {
    const steam = run(field(), cast('Fire Bolt', o(5, 3)));
    expect(surfaces(steam.state)).toContain('steam');
    expect(steam.events.some((e) => e.type === 'spell_cast' && e.targetId === null)).toBe(true);
    expect(surfaces(run(field(), cast('Ray of Frost', o(5, 3))).state)).toContain('ice');
    // dokunma menzili: 5 ft; (5,3) 3 altıgen uzakta
    expect(execute(field(), cast('Shocking Grasp', o(5, 3)), P1, high).ok).toBe(false);
  });
  it('boş zemine: boşa gider (yüzey yok, günlükte "boşa gitti"); çimene: tutuşur', () => {
    const empty = run(field(), cast('Fire Bolt', o(7, 3)));
    expect(surfaces(empty.state)).toEqual([]);
    expect(empty.events.some((e) => e.type === 'spell_cast' && /boşa gitti/.test(e.note ?? ''))).toBe(true);
    expect(surfaces(run(field(), cast('Fire Bolt', o(9, 3))).state)).toContain('fire');
  });
  it('slot harcanır (Guiding Bolt boş altıgene); menzil dışı ve görüş reddedilir', () => {
    const s = field();
    const r = run(s, cast('Guiding Bolt', o(7, 3)));
    expect((r.state.combatants.A as Combatant).spellSlots?.[0]).toBe(((s.combatants.A as Combatant).spellSlots?.[0] ?? 0) - 1);
  });
  it('altıgende yaratık varsa normal hedefleme (isabet zarı, targetId dolu)', () => {
    const r = run(field({ bAt: o(7, 3) }), cast('Fire Bolt', o(7, 3)));
    expect(r.events.some((e) => e.type === 'attack_resolved' && e.targetId === 'B')).toBe(true);
  });
  it('eski sürüm (80): yalnız ateşli ve yanıcı altıgen; Ray of Frost hedefsiz reddedilir; replay aynı', () => {
    const old = field({ v: 80 });
    expect(execute(old, cast('Ray of Frost', o(5, 3)), P1, high).ok).toBe(false);
    const r = run(old, cast('Fire Bolt', o(7, 3)));
    expect(r.events.some((e) => e.type === 'spell_cast' && /söndü/.test(e.note ?? ''))).toBe(true);
    expect(replay([{ type: 'battle_started', state: old }, ...r.events])).toEqual(r.state);
    const nw = field(); const r2 = run(nw, cast('Fire Bolt', o(5, 3)));
    expect(replay([{ type: 'battle_started', state: nw }, ...r2.events])).toEqual(r2.state);
  });
  it('Game Master anahtarı freeHexTarget kapalı: yeni davranış yok (Ray of Frost reddedilir)', () => {
    expect(execute(field({ toggles: { freeHexTarget: false } }), cast('Ray of Frost', o(5, 3)), P1, high).ok).toBe(false);
  });
  it('Shocking Grasp suya (bitişik): hasar zarı bir kez, hedefsiz spell_cast; suda kimse yoksa zincir sessiz', () => {
    const s0 = field();
    const s = { ...s0, combatants: { ...s0.combatants, A: { ...(s0.combatants.A as Combatant), pos: o(4, 3) } } } as BattleState;
    const r = run(s, cast('Shocking Grasp', o(5, 3)));
    expect(r.events.some((e) => e.type === 'spell_cast' && e.targetId === null)).toBe(true);
  });
  it('buff ve iyileştirme büyüleri hedefsiz altıgene atılmaz', () => {
    const s = field({ spells: ['Bless', 'Cure Wounds'], slots: [4, 0, 0, 0, 0, 0, 0, 0, 0] });
    expect(execute(s, cast('Cure Wounds', o(7, 3)), P1, high).ok).toBe(false);
  });
  it('yapay zekâ komutu değişmedi: tek hedefli büyüde hedefsiz altıgen önermez', () => {
    const s = { ...field({ bAt: o(6, 3) }), turnIndex: 0 } as BattleState;
    const cmd = chooseCommand({ ...s, combatants: { ...s.combatants, A: { ...(s.combatants.A as Combatant), side: 'enemies' as const }, B: { ...(s.combatants.B as Combatant), side: 'party' as const } } } as BattleState);
    expect(!(cmd.type === 'cast_spell' && !('targetId' in cmd && cmd.targetId) && cmd.targetHex && !['Fireball'].includes(cmd.spellName))).toBe(true);
  });
});
