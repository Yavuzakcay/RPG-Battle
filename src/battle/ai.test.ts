import { describe, it, expect } from 'vitest';
import { combatantFromMonster, startBattle } from './index';
import type { BattleState, Combatant } from './index';
import { getMonster } from '../data';
import { distance, type Offset } from '../rules/hex';
import { chooseEnemyCommand } from './ai';
import { autoplayEnemyTurns } from '../ui/autoplay';
import { createSession, dispatch } from '../ui/session';
import { mk, scripted } from './fixtures';

const o = (col: number, row: number): Offset => ({ col, row });
function board(fill: string, patch: Array<[Offset, string]> = []): string[] {
  const rows = Array.from({ length: 7 }, () => fill.repeat(15).split(''));
  for (const [h, ch] of patch) (rows[h.row] as string[])[h.col] = ch;
  return rows.map((r) => r.join(''));
}
/** Haritalı savaş, sıra listedeki ilk savaşçıda (düşman). */
function field(mapId: string, parts: Combatant[], positions: Record<string, Offset>, tiles: string[], options?: string[]): BattleState {
  const { state } = startBattle('ai', 'd-z-zemin', parts, scripted(...parts.map((_, i) => [20, 20 - i] as [number, number])),
    { map: { id: mapId, ...(options ? { options } : {}) } });
  const combatants = { ...state.combatants };
  for (const [id, pos] of Object.entries(positions)) combatants[id] = { ...(combatants[id] as Combatant), pos };
  return { ...state, status: 'active', combatants, map: { ...(state.map as NonNullable<BattleState['map']>), tiles } };
}
const wolf = (id = 'W') => combatantFromMonster(getMonster('wolf'), { id });
const hero = (p: Partial<Combatant> = {}) => mk('H', { ownerId: 'p1', hp: 30, maxHp: 30, ac: 30, ...p });
const always = (u: number) => () => u;

describe('haritada düşman yapay zekâsı', () => {
  it('uzaktaki hedefe yürür, yanına varınca saldırır, sonra turu bitirir', () => {
    const s = field('col', [wolf(), hero()], { W: o(10, 3), H: o(4, 3) }, board('.'));
    const first = chooseEnemyCommand(s);
    expect(first.type).toBe('move');
    const played = autoplayEnemyTurns(createSession(s, []), always(0.5));
    const types = played.events.map((e) => e.type);
    expect(types.indexOf('moved')).toBeLessThan(types.indexOf('attack_resolved'));
    expect(distance(played.state.combatants.W?.pos as Offset, o(4, 3))).toBe(1);
    expect(played.state.order[played.state.turnIndex]).toBe('H');
  });
  it('yetişemiyorsa yaklaşır', () => {
    const s = field('col', [wolf(), hero()], { W: o(14, 6), H: o(0, 0) }, board('.'));
    const cmd = chooseEnemyCommand(s);
    expect(cmd.type).toBe('move');
    if (cmd.type === 'move') expect(distance(cmd.to, o(0, 0))).toBeLessThan(distance(o(14, 6), o(0, 0)));
  });
  it('menzilli saldırısı olan yerinden ateş eder (Goblin Warrior: Shortbow)', () => {
    const goblin = combatantFromMonster(getMonster('goblin-warrior'), { id: 'G' });
    const s = field('kale', [goblin, hero()], { G: o(10, 3), H: o(4, 3) }, board('.'));
    const cmd = chooseEnemyCommand(s);
    expect(cmd.type).toBe('monster_attack');
    // Dağda sert rüzgâr menzilli atışı bozar (ortam, SRD Strong Wind): kötü koşullu atış yerine
    // yakın dövüşe yürür. Çölde ortamdan yay dezavantajı yok: yerinden atar.
    const windy = field('dag', [goblin, hero()], { G: o(10, 3), H: o(4, 3) }, board('.'));
    expect(chooseEnemyCommand(windy).type).toBe('move');
    const desert = field('col', [goblin, hero()], { G: o(10, 3), H: o(4, 3) }, board('.'));
    expect(chooseEnemyCommand(desert).type).toBe('monster_attack');
  });
  it('3/4 siper arkasındaki hedefe dezavantajlı atış yerine daha iyi yere yürür', () => {
    const goblin = combatantFromMonster(getMonster('goblin-warrior'), { id: 'G' });
    // Aradaki direk (m) 3/4 siper verir; yana kayınca açık atış var.
    const s = field('kale', [goblin, hero()], { G: o(10, 3), H: o(4, 3) }, board('.', [[o(6, 3), 'm'], [o(5, 3), 'm'], [o(5, 2), 'm']]));
    const cmd = chooseEnemyCommand(s);
    expect(cmd.type).toBe('move');
    // Hedefin kendi altıgenindeki siperden kaçılamaz: yine yerinden ateş eder.
    const rock = field('kale', [goblin, hero()], { G: o(10, 3), H: o(4, 3) }, board('.', [[o(4, 3), 'r']]));
    expect(chooseEnemyCommand(rock).type).toBe('monster_attack');
  });
  it('alevden ve lav kenarından kaçınır: aynı maliyette güvenli altıgeni seçer', () => {
    // Hedefin bir yanı alev, öbür yanı lav kenarı; üçüncü yan güvenli.
    const tiles = board('.', [[o(5, 2), 'f'], [o(6, 3), '~']]);
    const s = field('volkan', [wolf(), hero()], { W: o(9, 3), H: o(5, 3) }, tiles);
    const cmd = chooseEnemyCommand(s);
    expect(cmd.type).toBe('move');
    if (cmd.type === 'move') {
      expect(cmd.to).not.toEqual(o(5, 2));
      expect(distance(cmd.to, o(6, 3))).toBeGreaterThan(1);
      expect(distance(cmd.to, o(5, 3))).toBe(1);
    }
  });
  it('lav uyarısı olan altıgende durmaz', () => {
    const s0 = field('volkan', [wolf(), hero()], { W: o(9, 3), H: o(5, 3) }, board('.'));
    const warned = { ...s0, map: { ...(s0.map as NonNullable<BattleState['map']>), lavaWarning: { hexes: [o(6, 3), o(6, 2), o(5, 2), o(4, 2), o(4, 3)], round: 1 } } };
    const cmd = chooseEnemyCommand(warned);
    if (cmd.type === 'move') expect(warned.map.lavaWarning.hexes.some((h) => h.col === cmd.to.col && h.row === cmd.to.row)).toBe(false);
  });
  it('batağa saplanınca çıkmaya çalışır', () => {
    const s = field('bataklik', [{ ...wolf(), mapStatus: { sink: 1, lingeringPoison: false } }, hero()], { W: o(7, 3), H: o(2, 3) },
      board('.', [[o(7, 3), 'b']]));
    expect(chooseEnemyCommand(s).type).toBe('escape');
  });
  it('gizlenmiş veya karanlıkta görülmeyen hedefi kovalamaz', () => {
    const hidden = field('col', [wolf(), hero({ hidden: { dc: 30 } })], { W: o(10, 3), H: o(4, 3) }, board('.'));
    expect(chooseEnemyCommand(hidden).type).toBe('end_turn');
    const dark = field('dungeon', [{ ...wolf(), darkvision: 0 }, hero()], { W: o(12, 3), H: o(2, 3) }, board('.'), ['darkness']);
    expect(chooseEnemyCommand(dark).type).toBe('end_turn');
  });
  it('eylemi harcandıysa turu bitirir', () => {
    const s = field('col', [wolf(), hero()], { W: o(5, 3), H: o(4, 3) }, board('.'));
    const used = { ...s, combatants: { ...s.combatants, W: { ...(s.combatants.W as Combatant), economy: { ...(s.combatants.W as Combatant).economy, action: true } } } };
    expect(chooseEnemyCommand(used).type).toBe('end_turn');
  });
  it('hazır savaşta bütün düşman turları makul sürede oynanır', () => {
    const parts = [hero(), mk('H2', { ownerId: 'p1', hp: 30, maxHp: 30 }), combatantFromMonster(getMonster('troll'), { id: 'T' }), wolf('W1'), wolf('W2')];
    const s = field('col', parts, { H: o(1, 3), H2: o(1, 4), T: o(13, 3), W1: o(13, 2), W2: o(13, 4) }, board('.'));
    const t0 = Date.now();
    const played = autoplayEnemyTurns(createSession({ ...s, turnIndex: s.order.indexOf('T') }, []), always(0.5));
    expect(Date.now() - t0).toBeLessThan(3000);
    expect(played.error).toBe(null);
  });
});

describe('atlama', () => {
  it('adaları tek tek atlayarak kahramana ulaşır: kenara yürür, atlar; ortadaki adada beklemez', () => {
    // 5. ve 9. sütunlar baştan sona lav: üç ada. Kahraman soldaki, kurt sağdaki adanın içinde.
    // Her atlama yalnızca ilk karaya ve hareketin yerine: kenara yürü → atla → karşı kenara yürü → atla.
    const lava = (col: number) => Array.from({ length: 7 }, (_, row) => [o(col, row), '~'] as [Offset, string]);
    const tiles = board('.', [...lava(5), ...lava(9)]);
    // Lav kenarı her tur yakar: kurt dayanıklı (HP %40 altında yapay zekâ atlamaz).
    const s = field('volkan', [{ ...wolf(), hp: 100, maxHp: 100 }, hero()], { W: o(12, 3), H: o(1, 3) }, tiles);
    let ses = createSession(s, []);
    const cols: number[] = [];
    for (let turn = 0; turn < 5; turn++) {
      ses = autoplayEnemyTurns(ses, always(0.5));
      cols.push((ses.state.combatants.W?.pos as Offset).col);
      ses = dispatch(ses, { type: 'end_turn', actorId: 'H' }, always(0.5));
    }
    const jumps = ses.events.filter((e) => e.type === 'jumped');
    expect(jumps).toHaveLength(2);
    // Her atlama tek kanalı geçer (bir adayı atlayıp ötekine geçmez).
    for (const e of jumps) if (e.type === 'jumped') expect(e.gap).toBe(1);
    // Ortadaki adada en çok iki tur (iniş ve karşı kenara yürüyüş); sonunda kahramanın yanında.
    expect(cols.filter((c) => c > 5 && c < 9).length).toBeLessThanOrEqual(2);
    expect(distance(ses.state.combatants.W?.pos as Offset, o(1, 3))).toBe(1);
  });
});
