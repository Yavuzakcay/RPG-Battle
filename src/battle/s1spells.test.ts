/**
 * Kuyruk S1: sığmayan büyü parçalarının kapatılması (kural sürümü 40, mekaniğin `s1` hâli). Her büyü için yeni davranış
 * (sürüm 40) ve eski davranış (sürüm 39); replay aynı. Seçim istemi (`choice`) Rng'deki karar kancasıyla yanıtlanır
 * (arayüzün zar defteri yolu); kancasız Rng'de öneri.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { applyEvents, replay } from './reduce';
import { effectTurnStartEvents } from './effects';
import { zoneMoveCost } from './zones';
import { withBuffs } from './divine';
import { decideBy } from '../rules/reactionChoice';
import { GM, P1, mk, sword } from './fixtures';
import { seededRng, type Rng } from '../rules/dice';
import { caster, field } from './k19spells.test';
import { chooseCommand } from './ai';
import type { ReactionRequest } from '../rules/reactionChoice';
import type { BattleEvent, BattleState, Combatant, Command, MapObject } from './types';

const foe = (id: string, p: Partial<Combatant> = {}) => mk(id, { side: 'enemies', hp: 200, maxHp: 200, ...p });
const ally = (id: string, p: Partial<Combatant> = {}) => mk(id, { ownerId: 'p1', hp: 40, maxHp: 40, ...p });
const fx = (s: BattleState, id: string, srd: string) => s.combatants[id]?.effects?.find((e) => e.id === srd);
const cast = (spellName: string, extra: Partial<Command> = {}) => ({ type: 'cast_spell', actorId: 'A', spellName, ...extra }) as Command;
const ALL = [4, 3, 3, 3, 3, 2, 2, 1, 1];
const wiz = (spellNames: string[], p: Partial<Combatant> = {}) => caster({ spellNames, spellSlots: ALL, ...p });
const turnOf = (s: BattleState, id: string): BattleState => ({ ...s, turnIndex: s.order.indexOf(id) });
const bad = { str: -5, dex: -5, con: -5, int: -5, wis: -5, cha: -5 };
/** Seçim istemlerini `pick` ile yanıtlayan Rng (arayüzün zar defteri kancası gibi); diğer kararlar öneri. */
const hooked = (seed: number, pick: (req: ReactionRequest) => string | null): Rng => Object.assign(seededRng(seed),
  { react: (req: ReactionRequest) => (req.trigger === 'choice' ? (((c) => (c ? { option: 'choice', choice: c } : null))(pick(req))) : req.suggested) });
function go(s: BattleState, cmd: Command, rng: Rng = seededRng(3)) {
  const actor = 'actorId' in cmd ? s.combatants[cmd.actorId] : undefined;
  const r = execute(s, cmd, actor?.side === 'enemies' ? GM : P1, rng);
  if (!r.ok) throw new Error(r.error);
  expect(replay([{ type: 'battle_started', state: s }, ...r.events] as BattleEvent[])).toEqual(r.state);
  return r;
}
const tryGo = (s: BattleState, cmd: Command, rng: Rng = seededRng(3)) => execute(s, cmd, ('actorId' in cmd && s.combatants[cmd.actorId]?.side === 'enemies') ? GM : P1, rng);
const withObj = (s: BattleState, o: MapObject): BattleState => ({ ...s, map: { ...(s.map as NonNullable<BattleState['map']>), objects: [...(s.map?.objects ?? []), o] } });

describe('S1 seçim istemi (choice)', () => {
  it('seçim istemi tepki ayarından bağımsız: "Asla"da da öneri; "Sor"da sorulur', () => {
    const req: ReactionRequest = { reactorId: 'A', trigger: 'choice', info: { label: 'x' }, options: [{ id: 'choice', name: 'x', choices: [{ id: 'a', label: 'a' }] }], suggested: { option: 'choice', choice: 'a' } };
    expect(decideBy('never', req)).toEqual({ option: 'choice', choice: 'a' });
    expect(decideBy('ask', req)).toBe('ask');
  });
  it('Chromatic Orb: sıçrama hedefi sorulur (40; seçilen F2), "Seçme" sıçramaz; 39\'da en yakın düşman', () => {
    const p = { A: { col: 2, row: 3 }, F0: { col: 6, row: 3 }, F1: { col: 7, row: 3 }, F2: { col: 6, row: 5 } };
    const mkS = (k: number) => field([wiz(['Chromatic Orb'], { spellAttack: 30 }), foe('F0'), foe('F1'), foe('F2')], p, k);
    const cmd = cast('Chromatic Orb', { targetId: 'F0', slotLevel: 1, choice: 'fire' });
    let picked = 0; let skipped = 0; let old = 0;
    for (let seed = 1; seed < 500 && (!picked || !skipped || !old); seed++) {
      const leaps = (r: ReturnType<typeof tryGo>) => (r.ok ? r.events.filter((e): e is Extract<BattleEvent, { type: 'attack_resolved' }> => e.type === 'attack_resolved') : []);
      const a = leaps(tryGo(mkS(40), cmd, hooked(seed, () => 'F2')));
      if (a.length > 1) { expect(a[1]?.targetId).toBe('F2'); picked++; go(mkS(40), cmd, hooked(seed, () => 'F2')); }
      const b = tryGo(mkS(40), cmd, hooked(seed, () => null));
      if (b.ok && b.events.some((e) => e.type === 'attack_resolved' && e.hit && new Set(e.damageRolls).size < e.damageRolls.length)) { expect(leaps(b).length).toBe(1); skipped++; }
      const c = leaps(tryGo(mkS(39), cmd, hooked(seed, () => 'F2')));
      if (c.length > 1) { expect(c[1]?.targetId).toBe('F1'); old++; }
    }
    expect([picked > 0, skipped > 0, old > 0]).toEqual([true, true, true]);
  });
  it('Blink: dönüşte 10 ft içinde seçilen altıgene (40); 39\'da aynı altıgen', () => {
    const base = (k: number) => {
      const s = field([wiz(['Blink']), foe('F0')], { A: { col: 5, row: 3 }, F0: { col: 6, row: 3 } }, k);
      return { ...s, combatants: { ...s.combatants, A: { ...(s.combatants.A as Combatant), effects: [{ id: 'blink:ethereal', name: 'Blink: Ethereal', sourceId: 'A', ethereal: true }] } } } as BattleState;
    };
    const r = effectTurnStartEvents(base(40), 'A', hooked(1, (req) => (req.options[0]?.choices?.some((c) => c.id === '3,3') ? '3,3' : null)));
    expect(r.events.find((e) => e.type === 'teleported')).toMatchObject({ to: { col: 3, row: 3 } });
    // Kancasız: öneri düşmandan uzaklaşan altıgen.
    const ai = effectTurnStartEvents(base(40), 'A', seededRng(1)).events.find((e): e is Extract<BattleEvent, { type: 'teleported' }> => e.type === 'teleported');
    expect(ai && Math.abs(ai.to.col - 6) + Math.abs(ai.to.row - 3)).toBeGreaterThan(1);
    expect(effectTurnStartEvents(base(39), 'A', hooked(1, () => '3,3')).events.some((e) => e.type === 'teleported')).toBe(false);
  });
  it('Alter Self: sonraki turda Magic eylemiyle seçenek değişir (40; süre ve konsantrasyon aynı); 39\'da tekrar yok', () => {
    const s0 = field([wiz(['Alter Self']), foe('F0')], { A: { col: 2, row: 3 }, F0: { col: 8, row: 3 } }, 40);
    const s1 = go(s0, cast('Alter Self', { targetIds: ['A'], choice: 'claws' })).state;
    const before = fx(s1, 'A', 'spells:alter-self');
    expect(before?.weaponOverride?.type).toBe('slashing');
    const next = { ...s1, round: s1.round + 1, combatants: { ...s1.combatants, A: { ...(s1.combatants.A as Combatant), economy: { ...(s1.combatants.A as Combatant).economy, action: false } } } };
    const r = go(next, { type: 'spell_followup', actorId: 'A', targetId: 'A' }, hooked(2, () => 'fangs'));
    const after = fx(r.state, 'A', 'spells:alter-self');
    expect(after?.weaponOverride?.type).toBe('piercing');
    expect(after?.until).toBe(before?.until);
    expect(r.events.some((e) => e.type === 'action_used' && e.kind === 'action')).toBe(true);
    // Aynı turda değişmez; 39'da sürdürme yok.
    expect(tryGo(s1, { type: 'spell_followup', actorId: 'A', targetId: 'A' }).ok).toBe(false);
    const old = go(field([wiz(['Alter Self']), foe('F0')], { A: { col: 2, row: 3 }, F0: { col: 8, row: 3 } }, 39), cast('Alter Self', { targetIds: ['A'], choice: 'claws' })).state;
    expect(tryGo({ ...old, round: old.round + 1 }, { type: 'spell_followup', actorId: 'A', targetId: 'A' }).ok).toBe(false);
  });
});

describe('S1 Calm Emotions: bastırma (suppress)', () => {
  it('dosttaki süreli Frightened bastırılır, büyü bitince geri gelir (40); 39\'da kalkar ve gelmez', () => {
    for (const [k, back] of [[40, true], [39, false]] as const) {
      const s0 = field([wiz(['Calm Emotions']), ally('C', { saves: bad, conditions: ['Frightened'], conditionTimers: [{ condition: 'Frightened', ownerId: 'C', end: 'turnEnd', count: 5, label: 'Korku' }] }), foe('F0')],
        { A: { col: 2, row: 3 }, C: { col: 3, row: 3 }, F0: { col: 12, row: 3 } }, k);
      const r = go(s0, cast('Calm Emotions', { targetHex: { col: 3, row: 3 } }), seededRng(4));
      expect(r.state.combatants.C?.conditions.includes('Frightened')).toBe(false);
      // Konsantrasyon bitince etki biter: bastırılan durum geri gelir.
      const ended = applyEvents(r.state, [{ type: 'concentration_ended', actorId: 'A', label: 'test' }]);
      expect(fx(ended, 'C', 'spells:calm-emotions')).toBeUndefined();
      expect(ended.combatants.C?.conditions.includes('Frightened')).toBe(back);
    }
  });
});

describe('S1 Plane Shift: retreat', () => {
  const pos = { A: { col: 2, row: 3 }, C: { col: 3, row: 3 }, D: { col: 9, row: 3 }, F0: { col: 12, row: 3 } };
  const mkS = (k: number) => field([wiz(['Plane Shift']), ally('C'), ally('D'), foe('F0')], pos, k);
  it('büyücü ve el ele dost haritadan ayrılır; uzaktaki dost götürülemez (40)', () => {
    const r = go(mkS(40), cast('Plane Shift', { targetIds: ['A', 'C'] }));
    expect(r.events.find((e) => e.type === 'retreated')).toMatchObject({ ids: ['A', 'C'] });
    expect(r.state.combatants.A?.pos).toBeNull();
    expect(r.state.combatants.C?.offFloor).toBe('duzlem');
    expect(r.state.status).toBe('active');
    expect(tryGo(mkS(40), cast('Plane Shift', { targetIds: ['A', 'D'] })).ok).toBe(false);
    // `retreat` komutu aynı yol.
    const r2 = go(mkS(40), { type: 'retreat', actorId: 'A', spellName: 'Plane Shift', targetIds: ['C'] });
    expect(r2.events.some((e) => e.type === 'retreated')).toBe(true);
  });
  it('taraf boşalırsa savaş biter (geri çekilme); 39\'da yalnızca Game Master notu', () => {
    const s = field([wiz(['Plane Shift']), ally('C'), foe('F0')], { A: pos.A, C: pos.C, F0: pos.F0 }, 40);
    const r = go(s, cast('Plane Shift', { targetIds: ['A', 'C'] }));
    expect(r.events.find((e) => e.type === 'battle_finished')).toMatchObject({ winner: 'enemies', retreat: true });
    const old = go(mkS(39), cast('Plane Shift', { targetIds: ['A', 'C'] }));
    expect(old.events.some((e) => e.type === 'retreated')).toBe(false);
  });
  it('yapay zekâ son çare olarak geri çekilir (taraf %20 altı, karşı taraf %50 üstü)', () => {
    const s0 = field([wiz(['Plane Shift'], { hp: 3, maxHp: 40 }), ally('C', { hp: 2 }), foe('F0')], { A: pos.A, C: pos.C, F0: pos.F0 }, 40);
    const cmd = chooseCommand(s0);
    expect(cmd).toMatchObject({ type: 'cast_spell', spellName: 'Plane Shift' });
    const healthy = field([wiz(['Plane Shift']), ally('C'), foe('F0')], { A: pos.A, C: pos.C, F0: pos.F0 }, 40);
    expect(chooseCommand(healthy)).not.toMatchObject({ spellName: 'Plane Shift' });
  });
});

describe('S1 Suggestion / Mass Suggestion: öneri kalıpları', () => {
  const pos = { A: { col: 2, row: 3 }, F0: { col: 6, row: 3 } };
  const sword1 = { ...sword, weaponId: 'longsword' };
  const mkS = (k: number, spell = 'Suggestion') => field([wiz([spell]), foe('F0', { saves: bad, weaponOptions: [sword1], attacks: [{ name: 'Kılıç', attackBonus: 5, damage: '1d8', damageType: 'slashing', reachFt: 5 }] as never })], pos, k);
  it('"bırak": silahla saldıramaz (40); "getir": büyücüye yaklaşır', () => {
    const r = go(mkS(40), cast('Suggestion', { targetIds: ['F0'], choice: 'drop' }));
    expect(fx(r.state, 'F0', 'spells:suggestion')?.disarmed).toBe(true);
    const near = { ...r.state, combatants: { ...r.state.combatants, F0: { ...(r.state.combatants.F0 as Combatant), pos: { col: 3, row: 3 } } } };
    expect(tryGo(turnOf(near, 'F0'), { type: 'monster_attack', actorId: 'F0', targetId: 'A', attackIndex: 0 }).ok).toBe(false);
    const g = go(mkS(40), cast('Suggestion', { targetIds: ['F0'], choice: 'approach' }));
    const tick = effectTurnStartEvents(g.state, 'F0', seededRng(1));
    const moved = applyEvents(g.state, tick.events).combatants.F0?.pos;
    expect(moved && Math.abs(moved.col - 2)).toBeLessThan(4);
    expect(tick.skip).toBe(true);
  });
  it('39\'da yalnızca dur/uzaklaş (bırak geçersiz); Mass Suggestion da dört kalıp (40)', () => {
    expect(tryGo(mkS(39), cast('Suggestion', { targetIds: ['F0'], choice: 'drop' })).ok).toBe(false);
    const m = go(mkS(40, 'Mass Suggestion'), cast('Mass Suggestion', { targetIds: ['F0'], choice: 'approach' }));
    expect(fx(m.state, 'F0', 'spells:mass-suggestion')?.command).toBe('approach');
  });
});

describe('S1 Sanctuary: retargetOnly', () => {
  const atk: Command = { type: 'monster_attack', actorId: 'F0', targetId: 'A', attackIndex: 0 };
  const mkS = (k: number) => {
    const s0 = field([wiz(['Sanctuary']), ally('C'), foe('F0', { saves: bad, attacks: [{ name: 'Pençe', attackBonus: 5, damage: '1d6', damageType: 'slashing', reachFt: 5 }] as never })],
      { A: { col: 2, row: 3 }, C: { col: 3, row: 4 }, F0: { col: 3, row: 3 } }, k);
    return turnOf(go(s0, cast('Sanctuary', { targetIds: ['A'] })).state, 'F0');
  };
  it('save\'i kaçıran yeni hedef seçer: saldırı C\'ye (40), eylem harcanır', () => {
    const r = go(mkS(40), atk, hooked(1, () => 'C'));
    expect(r.events.find((e) => e.type === 'sanctuary_save')).toMatchObject({ success: false });
    expect(r.events.some((e) => e.type === 'attack_resolved' && e.targetId === 'C')).toBe(true);
    expect(r.events.some((e) => e.type === 'action_used')).toBe(true);
  });
  it('hedef seçmezse saldırı boşa gider (40); 39\'da eylem harcanmaz', () => {
    const r = go(mkS(40), atk, hooked(1, () => null));
    expect(r.events.some((e) => e.type === 'attack_resolved')).toBe(false);
    expect(r.events.some((e) => e.type === 'action_used')).toBe(true);
    const old = go(mkS(39), atk, hooked(1, () => 'C'));
    expect(old.events.some((e) => e.type === 'action_used')).toBe(false);
    expect(old.events.some((e) => e.type === 'attack_resolved')).toBe(false);
  });
});

describe('S1 nesne bayrakları: Magic Weapon, Faerie Fire, Meteor Swarm', () => {
  const axe = { ...sword, label: 'Handaxe', weaponId: 'handaxe', damage: '1d6+3' };
  const sw = { ...sword, weaponId: 'longsword' };
  it('Magic Weapon: yalnızca seçilen silah +1 (40); 39\'da bütün silahlar', () => {
    for (const [k, axeBonus] of [[40, 0], [39, 1]] as const) {
      const s = field([wiz(['Magic Weapon'], { weaponOptions: [sw, axe] }), foe('F0')], { A: { col: 2, row: 3 }, F0: { col: 9, row: 3 } }, k);
      const r = go(s, cast('Magic Weapon', { targetId: 'A', choice: 'longsword', slotLevel: 2 }), hooked(1, () => 'longsword'));
      const a = r.state.combatants.A as Combatant;
      expect(withBuffs(r.state, a, sw).attackBonus - sw.attackBonus).toBe(1);
      expect(withBuffs(r.state, a, axe).attackBonus - axe.attackBonus).toBe(axeBonus);
    }
  });
  it('Magic Weapon: seçim istemi (komut seçmediyse) ikinci silahı seçer (40)', () => {
    const s = field([wiz(['Magic Weapon'], { weaponOptions: [sw, axe] }), foe('F0')], { A: { col: 2, row: 3 }, F0: { col: 9, row: 3 } }, 40);
    const r = go(s, cast('Magic Weapon', { targetId: 'A', slotLevel: 2 }), hooked(1, () => 'handaxe'));
    expect(r.state.combatants.A?.buffs?.[0]?.enchantBy).toBe('handaxe');
  });
  const table: MapObject = { id: 'o1', kind: 'table', at: { col: 6, row: 3 }, hp: 200 };
  it('Faerie Fire: küpteki nesne parlar, ona saldırı avantajlı (40); 39\'da parlamaz', () => {
    for (const [k, lit] of [[40, true], [39, false]] as const) {
      const s = withObj(field([wiz(['Faerie Fire'], { weaponOptions: [sw] }), foe('F0', { saves: bad })], { A: { col: 2, row: 3 }, F0: { col: 6, row: 4 } }, k), table);
      const r = go(s, cast('Faerie Fire', { targetHex: { col: 6, row: 3 } }));
      const o = r.state.map?.objects?.find((x) => x.id === 'o1');
      expect((o?.outlined ?? -1) >= r.state.round).toBe(lit);
      if (lit) {
        const near = { ...r.state, combatants: { ...r.state.combatants, A: { ...(r.state.combatants.A as Combatant), pos: { col: 5, row: 3 }, economy: { ...(r.state.combatants.A as Combatant).economy, action: false } } } };
        const hit = go(near, { type: 'attack_object', actorId: 'A', objectId: 'o1', option: sw });
        expect(hit.events.some((e) => e.type === 'object_damaged' || e.type === 'object_changed' || e.type === 'map_note')).toBe(true);
      }
    }
  });
  it('Meteor Swarm: ateşli alandaki yanıcı nesne tutuşur (alev yüzeyi, 40); 39\'da yüzey yok', () => {
    for (const [k, fire] of [[40, true], [39, false]] as const) {
      const s = withObj(field([wiz(['Meteor Swarm']), foe('F0')], { A: { col: 0, row: 0 }, F0: { col: 12, row: 3 } }, k), { ...table, hp: 5000 });
      const r = go(s, cast('Meteor Swarm', { targetHexes: [{ col: 6, row: 3 }] }));
      expect((r.state.map?.zones ?? []).some((z) => z.surface === 'fire' && z.hexes.some((h) => h.col === 6 && h.row === 3))).toBe(fire);
    }
  });
});

describe('S1 Gust of Wind: anchorSelf + yönlü maliyet', () => {
  const pos = { A: { col: 2, row: 3 }, F0: { col: 5, row: 3 } };
  const strong = { str: 30, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
  it('yaklaşma maliyeti adım adım: çizgide yanlamasına adım normal, yaklaşan adım iki kat (40)', () => {
    const r = go(field([wiz(['Gust of Wind']), foe('F0', { saves: strong })], pos, 40), cast('Gust of Wind', { targetHex: { col: 5, row: 3 } }));
    const cost = zoneMoveCost(r.state, { ...(r.state.combatants.F0 as Combatant), pos: { col: 7, row: 3 } });
    // Hareket başı uzakta (7,3); 5,3 → 4,3 adımı yaklaşma: iki kat; 4,3 → 5,3 uzaklaşma: 1.
    expect(cost({ col: 4, row: 3 }, { col: 5, row: 3 })).toBe(2);
    expect(cost({ col: 5, row: 3 }, { col: 4, row: 3 })).toBe(1);
  });
  it('çizgi büyücüyle kayar (40); 39\'da yerinde kalır', () => {
    for (const [k, follows] of [[40, true], [39, false]] as const) {
      const s = go(field([wiz(['Gust of Wind']), foe('F0', { saves: strong })], pos, k), cast('Gust of Wind', { targetHex: { col: 5, row: 3 } })).state;
      const z0 = s.map?.zones?.find((x) => x.spellId === 'gust-of-wind');
      const moved = go(s, { type: 'move', actorId: 'A', to: { col: 2, row: 5 } } as Command).state;
      const z1 = moved.map?.zones?.find((x) => x.spellId === 'gust-of-wind');
      expect(JSON.stringify(z1?.hexes) !== JSON.stringify(z0?.hexes)).toBe(follows);
    }
  });
});
