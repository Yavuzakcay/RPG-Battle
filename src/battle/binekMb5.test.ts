/**
 * Kuyruk MB5 (kural sürümü 73; `harita/belgeler/BINEK-PLAN.md` §16): yapay zekâ binicisi ve çok altıgenli bineğin dar geçitten
 * kaçınması. Yalnız YZ kararı: komut ve olay yok; 72'de eski karar.
 */
import { describe, expect, it } from 'vitest';
import { chooseCommand } from './ai';
import { aiStats } from './ai/preview';
import { bodyUnfit, riderStays } from './ai/binekMb5';
import { BINEK_MB5_VERSION, binekMb5On } from './binekMb5Surum';
import { execute } from './commands';
import { startBattle } from './create';
import { GM, mk, P1 } from './fixtures';
import { bodyFitProblem } from './movement';
import { CURRENT_RULES } from './ruleVersion';
import type { Offset } from '../rules/hex';
import type { AttackOption, BattleState, Combatant, Command } from './types';

const o = (col: number, row = 3): Offset => ({ col, row });
const sword: AttackOption = { label: 'Longsword', attackBonus: 5, damage: '1d8', damageType: 'slashing', ranged: false, spell: false, tag: 'longsword' };
const slam = [{ name: 'Slam', bonus: 6, damageDice: '2d6', damageType: 'bludgeoning', repeat: 1, ranged: false, reachFt: 5, text: '' }] as never;
/** Sütun 10'da duvar; 5. satırda tek altıgenlik dar geçit, 8–10. satırlarda üç altıgenlik geniş geçit. */
const wallMap = (narrowOnly = false) => Array.from({ length: 11 }, (_, r) => Array.from({ length: 21 }, (_, c) => (c === 10 && (narrowOnly ? r !== 5 : r < 8 && r !== 5) ? 's' : '.')).join(''));
const flat = () => Array.from({ length: 11 }, () => '.'.repeat(21));

/** Sıra: H (binek), A (binici), B (düşman). multiHex açık; A, H'nin üstünde (`mounted`). */
function scene(v: number, o2: { size?: 'L' | 'H'; tiles?: string[]; mounted?: boolean; from?: Offset; foe?: Offset; turn?: 'H' | 'A'; side?: 'party' | 'enemies' } = {}): BattleState {
  const side = o2.side ?? 'party', foeSide = side === 'party' ? 'enemies' : 'party';
  const parts = [
    mk('H', { side, ownerId: side === 'party' ? 'p1' : '', size: o2.size ?? 'H', speed: 60, hp: 60, maxHp: 60, attacks: slam }),
    mk('A', { side, ownerId: side === 'party' ? 'p1' : '', size: 'M', speed: 30, weaponOptions: [sword] }),
    mk('B', { side: foeSide, hp: 90, maxHp: 90 }),
  ];
  const s0 = startBattle('b', 'd', parts, () => 0.5, { kuralSurumu: v, map: { id: 'col', variantId: 'gunduz', ruleToggles: { darkness: false, trap: false } } } as never).state;
  const cs = { ...s0.combatants };
  const at = o2.from ?? o(4, 5);
  cs.H = { ...cs.H!, pos: at, ...(o2.mounted === false ? {} : { rider: 'A' }) } as Combatant;
  cs.A = { ...cs.A!, pos: at, ...(o2.mounted === false ? {} : { riding: 'H' }) } as Combatant;
  cs.B = { ...cs.B!, pos: o2.foe ?? o(16, 5) } as Combatant;
  const order = ['H', 'A', 'B'];
  return { ...s0, kuralSurumu: v, status: 'active', round: 1, order, turnIndex: order.indexOf(o2.turn ?? 'H'), combatants: cs, multiHex: true,
    map: { ...s0.map!, tiles: o2.tiles ?? wallMap(), objects: [] } };
}
const ctx = (s: BattleState, cmd: Command) => ('actorId' in cmd && s.combatants[cmd.actorId]?.ownerId === 'p1' ? P1 : GM);
const exec = (s: BattleState, cmd: Command) => execute(s, cmd, ctx(s, cmd), () => 0.5);
const misses = (s: BattleState): { cmd: Command; n: number } => { aiStats.tryMisses = 0; const cmd = chooseCommand(s); return { cmd, n: aiStats.tryMisses }; };

describe('MB5: sürüm kapısı', () => {
  it('sürüm 73; güncel sürüm 73 ya da üstü; 72 kapalı, 73 açık', () => {
    expect(BINEK_MB5_VERSION).toBe(73);
    expect(CURRENT_RULES).toBeGreaterThanOrEqual(73);
    expect(binekMb5On({ kuralSurumu: 72 })).toBe(false);
    expect(binekMb5On({ kuralSurumu: 73 })).toBe(true);
    expect(binekMb5On({})).toBe(false);
  });
});

describe('MB5: YZ binicisi', () => {
  it('binici yürüyüş adayı üretmez (73): kararı aynı, ama 72\'de her aday kuru çalıştırılıp reddedilir', () => {
    const a = misses(scene(72, { turn: 'A' })), b = misses(scene(73, { turn: 'A' }));
    expect(b.cmd).toEqual(a.cmd);
    expect(b.cmd.type).toBe('end_turn');
    expect(a.n).toBeGreaterThan(30);
    expect(b.n).toBeLessThan(5);
  });
  it('binici yardımcıları: binicide yürüyüş yok (73), bineksizde var; 72\'de hiçbir yerde', () => {
    expect(riderStays(scene(73), scene(73).combatants.A!)).toBe(true);
    expect(riderStays(scene(73, { mounted: false }), scene(73, { mounted: false }).combatants.A!)).toBe(false);
    expect(riderStays(scene(72), scene(72).combatants.A!)).toBe(false);
  });
  it('iki taraf da: düşman tarafındaki binici de yürümez, bineği kendi sırasında hareket eder', () => {
    for (const side of ['party', 'enemies'] as const) {
      const r = misses(scene(73, { turn: 'A', side }));
      expect(r.cmd.type).toBe('end_turn');
      const mount = chooseCommand(scene(73, { turn: 'H', side }));
      expect(mount.type).toBe('move');
      expect(exec(scene(73, { turn: 'H', side }), mount).ok).toBe(true);
    }
  });
  it('binicinin erişimindeki düşmana saldırır (binici hareket aramadan eylemini yapar), 72 ile aynı', () => {
    for (const v of [72, 73]) {
      const s = scene(v, { turn: 'A', size: 'L', foe: o(5, 5), from: o(4, 5) });
      const c = chooseCommand(s);
      expect(c.type, `${v}`).toBe('attack');
      expect(exec(s, c).ok).toBe(true);
    }
  });
});

describe('MB5: büyük binek dar geçitten kaçınır', () => {
  it('Huge binek (7 altıgen) tek altıgenlik geçide girmez: geniş geçitten dolanır, hareketi motor kabul eder', () => {
    const s = scene(73);
    const c = chooseCommand(s);
    expect(c.type).toBe('move');
    if (c.type !== 'move') return;
    expect(exec(s, c).ok).toBe(true);
    expect(bodyFitProblem(s, s.combatants.H!, c.to, ['A'])).toBeNull();
    expect(bodyUnfit(s, s.combatants.H!, c.to)).toBe(false);
    // Duvarın (10. sütun) ötesine geçmiş: geçit geniş olandan.
    expect(c.to.col).toBeGreaterThan(10);
  });
  it('gövdesi sığmayan çapa (dar geçidin ağzı) aday sayılmaz; 72\'de yardımcı kapalı', () => {
    const s = scene(73), h = s.combatants.H!;
    expect(bodyUnfit(s, h, o(10, 5))).toBe(true);
    expect(bodyUnfit(s, h, o(14, 5))).toBe(false);
    expect(bodyUnfit(scene(72), scene(72).combatants.H!, o(10, 5))).toBe(false);
  });
  it('tek altıgenli yaratık ve çok altıgen kapalıyken değişmez', () => {
    const s = scene(73, { size: 'L' });
    expect(bodyUnfit({ ...s, multiHex: false }, s.combatants.H!, o(10, 5))).toBe(false);
    const m = { ...s, combatants: { ...s.combatants, H: { ...s.combatants.H!, size: 'M' as const } } };
    expect(bodyUnfit(m, m.combatants.H!, o(10, 5))).toBe(false);
  });
  it('alternatif yol yoksa mevcut davranışa düşer: komut üretir, motor reddedeceği hamleyi önermez', () => {
    for (const v of [72, 73]) {
      const s = scene(v, { tiles: wallMap(true) });
      const c = chooseCommand(s);
      expect(['move', 'end_turn']).toContain(c.type);
      if (c.type === 'move') expect(exec(s, c).ok, `${v}`).toBe(true);
    }
  });
});
