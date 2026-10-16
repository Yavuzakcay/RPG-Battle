import { describe, it, expect } from 'vitest';
import { combatantFromMonster, execute, replay, startBattle } from './index';
import type { BattleEvent, BattleState, Combatant, Command, CommandContext } from './index';
import { getMonster, monsters } from '../data';
import type { Rng } from '../rules/dice';
import { GM, P1, P2, dice, envId, mk, scripted, sword } from './fixtures';

const monster = (id: string, cid: string, p: Partial<Combatant> = {}): Combatant => ({
  ...combatantFromMonster(getMonster(id), { id: cid }), ...p,
});

/** Parti üyeleri sırayla düşük initiative alır, düşmanlar yüksek: sıra düşmanlarla başlar. */
function arena(env: string, enemies: Combatant[], party?: Combatant[]): BattleState {
  const members = party ?? [mk('A', { ownerId: 'p1', ac: 13, hp: 40, maxHp: 40 })];
  const rolls: Array<[number, number]> = [
    ...members.map((_, i) => [20, 2 - i] as [number, number]),
    ...enemies.map(() => [20, 20] as [number, number]),
  ];
  return startBattle('b1', envId(env), [...members, ...enemies], scripted(...rolls)).state;
}

function ok(r: ReturnType<typeof execute>) {
  if (!r.ok) throw new Error(r.error);
  return r;
}
const run = (s: BattleState, cmd: Command, ctx: CommandContext, rng: Rng = scripted()) => execute(s, cmd, ctx, rng);
const hit = (actorId: string, targetId: string, attackIndex: number): Command => ({ type: 'monster_attack', actorId, targetId, attackIndex });
const endTurn = (actorId: string): Command => ({ type: 'end_turn', actorId });
/** Olay türleri; eylem ekonomisi olayı (`action_used`, economy.test.ts) dışarıda. */
const types = (events: BattleEvent[]) => events.filter((e) => e.type !== 'action_used').map((e) => e.type);

describe('şablondan canavar', () => {
  it('Troll: yenilenme, Multiattack ve saldırı bilgileri (SRD 5.2.1)', () => {
    const t = monster('troll', 'T');
    expect(t.regeneration).toBe(15);
    expect(t.multiattack).toBe(true);
    expect(t.attacks.length).toBe(1);
    expect(t.attacks[0]?.name).toBe('Rend');
    expect(t.attacks[0]?.repeat).toBe(3);
    expect(t.attacks[0]?.damageDice).toBe('2d6+4');
  });
  it('Zombie, Wolf ve ejderha nefesi', () => {
    expect(monster('zombie', 'Z').undeadFortitude).toBe(true);
    expect(monster('wolf', 'W').packTactics).toBe(true);
    const breath = monster('young-red-dragon', 'D').attacks[1];
    expect(breath?.save).toEqual({ ability: 'dex', dc: 17, halfOnSave: true });
    expect(breath?.recharge).toBe(5);
    expect(breath?.damageDice).toBe('16d6');
  });
  it('stat bloğundaki save bonusları modifier yerine kullanılır', () => {
    const d = monster('young-red-dragon', 'D');
    expect(d.saves.dex).toBe(4); // DEX 10 (+0), save +4
    expect(d.saves.str).toBe(6);
    expect(monster('zombie', 'Z').saves.wis).toBe(0); // WIS 6 (−2), save +0
  });
  it('her saldırının hasar zarı veya ek etkisi var, nefes save tabanlı', () => {
    for (const m of monsters) {
      for (const a of m.attacks) {
        expect(a.damageDice !== undefined || a.rider !== undefined).toBe(true);
      }
    }
  });
});

describe('canavar saldırısı', () => {
  it('Troll Rend isabet eder ve hasar verir', () => {
    const s = arena('Düz', [monster('troll', 'T')]);
    const r = ok(run(s, hit('T', 'A', 0), GM, scripted([20, 15], [6, 3], [6, 2])));
    expect(r.state.combatants.A?.hp).toBe(31); // 40 - (3 + 2 + 4)
  });
  it('yalnızca GM canavarı yönetir', () => {
    const s = arena('Düz', [monster('troll', 'T')]);
    expect(run(s, hit('T', 'A', 0), P1, scripted([20, 15], [6, 3])).ok).toBe(false);
  });
  it('Pack Tactics: yanında müttefik varken Wolf avantajlı saldırır', () => {
    const s = arena('Düz', [monster('wolf', 'W1'), monster('wolf', 'W2')]);
    const r = ok(run(s, hit('W1', 'A', 0), GM, scripted([20, 10], [20, 12], [6, 1])));
    const ev = r.events[0];
    if (!ev || ev.type !== 'attack_resolved') throw new Error('beklenmeyen olay');
    expect(ev.mode).toBe('advantage');
    expect(ev.reasons.includes('Pack Tactics')).toBe(true);
  });
  it('ek etki metni olayda yer alır (Wyvern Sting)', () => {
    const s = arena('Düz', [monster('wyvern', 'Y')]);
    const r = ok(run(s, hit('Y', 'A', 1), GM, scripted([20, 15], [6, 1], [6, 1])));
    const ev = r.events[0];
    if (!ev || ev.type !== 'attack_resolved') throw new Error('beklenmeyen olay');
    expect(ev.rider?.includes('7d6 poison')).toBe(true);
  });
  it('hasarsız save saldırısı (Web): DEX save, ek etki metni, hasar yok; başarısızsa Restrained (her tur sonu STR DC 13)', () => {
    const s = arena('Düz', [monster('giant-spider', 'S')]);
    const r = ok(run(s, hit('S', 'A', 1), GM, scripted([20, 5])));
    const ev = r.events[0];
    if (!ev || ev.type !== 'save_resolved') throw new Error('beklenmeyen olay');
    expect(ev.ability).toBe('dex');
    expect(ev.dc).toBe(13);
    expect(ev.success).toBe(false);
    expect(ev.appliedDamage).toBe(0);
    expect(ev.rider?.includes('Restrained')).toBe(true);
    // Süreli etki (data/condition-effects.json): Restrained, "save ends" STR DC 13.
    expect(types(r.events)).toEqual(['save_resolved', 'condition_changed', 'recharge_used']);
    expect(r.state.combatants.A?.conditions).toContain('Restrained');
    expect(r.state.combatants.A?.conditionTimers).toEqual([
      expect.objectContaining({ condition: 'Restrained', ownerId: 'A', end: 'turnEnd', save: { ability: 'str', dc: 13 } })]);
  });
});

describe('Multiattack', () => {
  it('Troll: Rend ×3 arka arkaya', () => {
    const s = arena('Düz', [monster('troll', 'T')]);
    const rng = scripted([20, 15], [6, 3], [6, 2], [20, 15], [6, 2], [6, 2], [20, 15], [6, 1], [6, 1]);
    const r = ok(run(s, { type: 'multiattack', actorId: 'T', targetId: 'A' }, GM, rng));
    expect(types(r.events)).toEqual(['attack_resolved', 'attack_resolved', 'attack_resolved']);
    expect(r.state.combatants.A?.hp).toBe(17); // 40 - 9 - 8 - 6
  });
  it('hedef düşünce durur', () => {
    const s = arena('Düz', [monster('troll', 'T')], [mk('A', { ownerId: 'p1', ac: 13, hp: 5, maxHp: 40 })]);
    const r = ok(run(s, { type: 'multiattack', actorId: 'T', targetId: 'A' }, GM, scripted([20, 15], [6, 3], [6, 2])));
    expect(types(r.events)).toEqual(['attack_resolved', 'battle_finished']);
    expect(r.state.winner).toBe('enemies');
  });
  it('Hill Giant: Trash Lob tekrarı 0 olduğu için atlanır, iki Tree Club vurur', () => {
    const s = arena('Düz', [monster('hill-giant', 'H')], [mk('A', { ownerId: 'p1', ac: 13, hp: 100, maxHp: 100 })]);
    const rng = scripted([20, 15], ...dice(8, 1, 1, 1), [20, 15], ...dice(8, 1, 1, 1));
    const r = ok(run(s, { type: 'multiattack', actorId: 'H', targetId: 'A' }, GM, rng));
    expect(types(r.events)).toEqual(['attack_resolved', 'attack_resolved']);
  });
  it('Multiattack\'ı olmayan yaratık kullanamaz', () => {
    const s = arena('Düz', [monster('goblin-warrior', 'G')]);
    expect(run(s, { type: 'multiattack', actorId: 'G', targetId: 'A' }, GM).ok).toBe(false);
  });
});

describe('Recharge ve nefes', () => {
  const sixteenThrees = dice(6, ...Array<number>(16).fill(3));
  const dragonArena = (env = 'Düz') =>
    arena(env, [monster('young-red-dragon', 'D')], [mk('A', { ownerId: 'p1', ac: 13, hp: 100, maxHp: 100 })]);
  const breath = (s: BattleState, rng: Rng) => run(s, hit('D', 'A', 1), GM, rng);

  it('save başarısızsa tam, başarılıysa yarım hasar', () => {
    const fail = ok(breath(dragonArena(), scripted([20, 5], ...sixteenThrees)));
    expect(fail.state.combatants.A?.hp).toBe(52); // 100 - 48
    const pass = ok(breath(dragonArena(), scripted([20, 19], ...sixteenThrees)));
    expect(pass.state.combatants.A?.hp).toBe(76); // 100 - 24
    expect(types(fail.events)).toEqual(['save_resolved', 'recharge_used']);
  });
  it('buzulda ateş nefesinin hedefi save\'de avantaj alır', () => {
    const r = ok(breath(dragonArena('Buzul'), scripted([20, 3], [20, 18], ...sixteenThrees)));
    const ev = r.events[0];
    if (!ev || ev.type !== 'save_resolved') throw new Error('beklenmeyen olay');
    expect(ev.mode).toBe('advantage');
    expect(ev.success).toBe(true);
  });
  it('kullanılan nefes, tur başında d6 5 veya 6 gelene kadar kullanılamaz', () => {
    let s = ok(breath(dragonArena(), scripted([20, 5], ...sixteenThrees))).state;
    expect(breath(s, scripted()).ok).toBe(false); // şarj yok
    s = ok(run(s, endTurn('D'), GM)).state; // sıra A'da
    const notYet = ok(run(s, endTurn('A'), P1, scripted([6, 4]))); // ejderhanın turu: d6 = 4
    const rolled = notYet.events.find((e) => e.type === 'recharge_rolled');
    expect(rolled?.type === 'recharge_rolled' && rolled.recharged).toBe(false);
    expect(breath(notYet.state, scripted()).ok).toBe(false);
    s = ok(run(notYet.state, endTurn('D'), GM)).state;
    const again = ok(run(s, endTurn('A'), P1, scripted([6, 5]))); // d6 = 5
    expect(again.state.combatants.D?.rechargeUsed).toEqual([]);
    expect(breath(again.state, scripted([20, 19], ...sixteenThrees)).ok).toBe(true);
  });
});

describe('Undead Fortitude', () => {
  /** Zombie önce oynar, ardından sıra A'ya gelir. */
  const zombieTurnA = (hp = 5) => {
    const s = arena('Düz', [monster('zombie', 'Z', { hp })]);
    return ok(run(s, endTurn('Z'), GM)).state;
  };
  const strike = (s: BattleState, option: typeof sword, rng: Rng) =>
    ok(run(s, { type: 'attack', actorId: 'A', targetId: 'Z', option }, P1, rng));

  it('CON save başarılıysa 1 HP ile ayakta kalır', () => {
    const r = strike(zombieTurnA(), sword, scripted([20, 15], [8, 6], [20, 12]));
    expect(r.state.combatants.Z?.hp).toBe(1);
    const ev = r.events[0];
    if (!ev || ev.type !== 'attack_resolved') throw new Error('beklenmeyen olay');
    const uf = ev.effects.find((e) => e.kind === 'undead_fortitude');
    expect(uf !== undefined && uf.kind === 'undead_fortitude' && uf.dc === 14 && uf.success).toBe(true);
  });
  it('save başarısızsa düşer', () => {
    const r = strike(zombieTurnA(), sword, scripted([20, 15], [8, 6], [20, 5]));
    expect(r.state.combatants.Z?.hp).toBe(0);
  });
  it('radiant hasar ve kritik vuruş Undead Fortitude\'u atlar', () => {
    const radiant = strike(zombieTurnA(), { ...sword, damageType: 'radiant' }, scripted([20, 15], [8, 6]));
    expect(radiant.state.combatants.Z?.hp).toBe(0);
    const crit = strike(zombieTurnA(), sword, scripted([20, 20], [8, 3], [8, 3]));
    expect(crit.state.combatants.Z?.hp).toBe(0);
  });
});

describe('Regeneration', () => {
  const trollArena = (hp: number, party?: Combatant[]) =>
    arena('Düz', [monster('troll', 'T', { hp })], party);
  const fireSword = { ...sword, damageType: 'fire' };
  const heal = (events: BattleEvent[]) => events.find((e) => e.type === 'regeneration');

  it('tur başında 15 HP yenilenir', () => {
    let s = ok(run(trollArena(30), endTurn('T'), GM)).state;
    const r = ok(run(s, endTurn('A'), P1));
    const ev = heal(r.events);
    expect(ev?.type === 'regeneration' && ev.amount).toBe(15);
    expect(r.state.combatants.T?.hp).toBe(45);
    s = r.state;
  });
  it('canı doluysa yenilenme olayı (günlük satırı) yok', () => {
    const s = ok(run(trollArena(94), endTurn('T'), GM)).state;
    const r = ok(run(s, endTurn('A'), P1));
    expect(heal(r.events)).toBeUndefined();
    expect(r.state.combatants.T?.hp).toBe(94);
  });
  it('acid veya fire hasarı sonraki yenilenmeyi engeller, sonra normale döner', () => {
    let s = ok(run(trollArena(30), endTurn('T'), GM)).state;
    const struck = ok(run(s, { type: 'attack', actorId: 'A', targetId: 'T', option: fireSword }, P1, scripted([20, 15], [8, 2])));
    expect(struck.state.combatants.T?.hp).toBe(25);
    expect(struck.state.combatants.T?.regenBlocked).toBe(true);
    const blocked = ok(run(struck.state, endTurn('A'), P1));
    const ev = heal(blocked.events);
    expect(ev?.type === 'regeneration' && ev.blocked).toBe(true);
    expect(blocked.state.combatants.T?.hp).toBe(25);
    s = ok(run(blocked.state, endTurn('T'), GM)).state;
    const next = ok(run(s, endTurn('A'), P1));
    expect(next.state.combatants.T?.hp).toBe(40);
  });
  it('0 HP\'ye düşen Troll ayakta kalmaya çalışır: savaş sürer, turunda yenilenir', () => {
    const s = ok(run(trollArena(5), endTurn('T'), GM)).state;
    const down = ok(run(s, { type: 'attack', actorId: 'A', targetId: 'T', option: sword }, P1, scripted([20, 15], [8, 6])));
    expect(down.state.combatants.T?.hp).toBe(0);
    expect(down.state.combatants.T?.regenPending).toBe(true);
    expect(down.state.status).toBe('active');
    const back = ok(run(down.state, endTurn('A'), P1));
    expect(back.state.combatants.T?.hp).toBe(15);
    expect(back.state.combatants.T?.regenPending).toBe(false);
  });
  it('fire ile 0 HP\'ye düşen Troll yenilenemez, savaş biter', () => {
    const s = ok(run(trollArena(5), endTurn('T'), GM)).state;
    const r = ok(run(s, { type: 'attack', actorId: 'A', targetId: 'T', option: fireSword }, P1, scripted([20, 15], [8, 2])));
    expect(r.state.status).toBe('finished');
    expect(r.state.winner).toBe('party');
  });
  it('yenilenmeyi bekleyen Troll\'e ikinci oyuncu fire vurursa turunda ölür', () => {
    const party = [mk('A', { ownerId: 'p1', ac: 13, hp: 40, maxHp: 40 }), mk('C', { ownerId: 'p2', ac: 13, hp: 40, maxHp: 40 })];
    let s = ok(run(trollArena(5, party), endTurn('T'), GM)).state; // sıra A'da
    s = ok(run(s, { type: 'attack', actorId: 'A', targetId: 'T', option: sword }, P1, scripted([20, 15], [8, 6]))).state;
    expect(s.combatants.T?.regenPending).toBe(true);
    s = ok(run(s, endTurn('A'), P1)).state; // sıra C'de (A'nın turu bitti)
    s = ok(run(s, { type: 'attack', actorId: 'C', targetId: 'T', option: fireSword }, P2, scripted([20, 15], [8, 2]))).state;
    expect(s.combatants.T?.regenBlocked).toBe(true);
    const end = ok(run(s, endTurn('C'), P2));
    expect(types(end.events).includes('regeneration')).toBe(true);
    expect(types(end.events).includes('battle_finished')).toBe(true);
    expect(end.state.status).toBe('finished');
    expect(end.state.winner).toBe('party');
  });
});

describe('olaylardan yeniden kurma (canavar yetenekleri)', () => {
  it('Recharge ve yenilenme olayları baştan oynatılınca aynı durum çıkar', () => {
    const start = startBattle('b', envId('Düz'),
      [mk('A', { ownerId: 'p1', ac: 13, hp: 100, maxHp: 100 }), monster('young-red-dragon', 'D'), monster('troll', 'T', { hp: 30 })],
      scripted([20, 2], [20, 20], [20, 19]));
    let state = start.state;
    const all: BattleEvent[] = [...start.events];
    const go = (cmd: Command, ctx: CommandContext, rng: Rng) => {
      const r = ok(run(state, cmd, ctx, rng));
      state = r.state;
      all.push(...r.events);
    };
    const first = state.order[state.turnIndex] ?? '';
    expect(first).toBe('D');
    go(hit('D', 'A', 1), GM, scripted([20, 5], ...dice(6, ...Array<number>(16).fill(2))));
    go(endTurn('D'), GM, scripted());
    go(hit('T', 'A', 0), GM, scripted([20, 15], [6, 3], [6, 2]));
    go(endTurn('T'), GM, scripted());
    go(endTurn('A'), P1, scripted([6, 6]));
    expect(replay(all)).toEqual(state);
  });
});
