/**
 * Kuyruk S2: kalan sığmayan büyü parçaları (kural sürümü 41, mekaniğin `s2` hâli). Her parça için yeni davranış (41) ve
 * eski davranış (40); replay aynı.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { applyEvents, replay } from './reduce';
import { effectTurnStartEvents } from './effects';
import { moveCostFn } from './movement';
import { passivePerception } from './stealth';
import { zoneKnownBy, zoneShownTo } from './hiddenZones';
import { checkReach, optionReach } from './range';
import { GM, P1, mk, sword } from './fixtures';
import { seededRng, type Rng } from '../rules/dice';
import { caster, field } from './k19spells.test';
import type { ReactionRequest } from '../rules/reactionChoice';
import type { BattleEvent, BattleState, Combatant, Command, MapObject } from './types';

const foe = (id: string, p: Partial<Combatant> = {}) => mk(id, { side: 'enemies', hp: 200, maxHp: 200, ...p });
const ally = (id: string, p: Partial<Combatant> = {}) => mk(id, { ownerId: 'p1', hp: 40, maxHp: 40, ...p });
const cast = (spellName: string, extra: Partial<Command> = {}) => ({ type: 'cast_spell', actorId: 'A', spellName, ...extra }) as Command;
const ALL = [4, 3, 3, 3, 3, 2, 2, 1, 1];
const wiz = (spellNames: string[], p: Partial<Combatant> = {}) => caster({ spellNames, spellSlots: ALL, ...p });
const turnOf = (s: BattleState, id: string): BattleState => ({ ...s, turnIndex: s.order.indexOf(id) });
const bad = { str: -5, dex: -5, con: -5, int: -5, wis: -5, cha: -5 };
const sw = { ...sword, weaponId: 'longsword' };
const club = { ...sword, label: 'Club', weaponId: 'club', damage: '1d4+3' };
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
const patch = (s: BattleState, id: string, p: Partial<Combatant>): BattleState => ({ ...s, combatants: { ...s.combatants, [id]: { ...(s.combatants[id] as Combatant), ...p } } });
const alt = (s: BattleState, id: string) => s.combatants[id]?.altitudeFt ?? 0;
/** Komut sonu kancalarını çalıştırmak için eylemi tazelenmiş Arama. */
const tick = (s: BattleState, id = 'A') => go(patch(s, id, { economy: { ...(s.combatants[id] as Combatant).economy, action: false } }), { type: 'search', actorId: id } as Command);

describe('S2 irtifa: Fly, Levitate, Moonbeam', () => {
  const pos = { A: { col: 2, row: 3 }, F0: { col: 3, row: 3 } };
  it('Fly: uçan yükselir (hareketten öder), büyü bitince düşer (hasar + Prone); 40\'ta dikey hareket yok', () => {
    const s0 = field([wiz(['Fly']), foe('F0')], pos, 41);
    const s1 = go(s0, cast('Fly', { targetIds: ['A'] })).state;
    const up = go(s1, { type: 'vertical_move', actorId: 'A', toFt: 20 });
    expect(alt(up.state, 'A')).toBe(20);
    expect(up.state.combatants.A?.movementUsed).toBe(4);
    const ended = applyEvents(up.state, [{ type: 'concentration_ended', actorId: 'A', label: 't' }]);
    const r = tick(ended);
    expect(alt(r.state, 'A')).toBe(0);
    expect(r.events.some((e) => e.type === 'map_effect' && e.rule === 'fall')).toBe(true);
    expect(tryGo(go(field([wiz(['Fly']), foe('F0')], pos, 40), cast('Fly', { targetIds: ['A'] })).state, { type: 'vertical_move', actorId: 'A', toFt: 20 }).ok).toBe(false);
  });
  it('irtifadaki hedefe yakın dövüş ulaşmaz; Levitate hedefi 20 ft yükselir, yapan indirir; bitince süzülerek iner (hasarsız)', () => {
    const s = go(field([wiz(['Levitate']), foe('F0', { saves: bad })], pos, 41), cast('Levitate', { targetIds: ['F0'] })).state;
    expect(alt(s, 'F0')).toBe(20);
    expect(checkReach(s, s.combatants.A as Combatant, s.combatants.F0 as Combatant, optionReach(sw)).ok).toBe(false);
    const down = go(s, { type: 'vertical_move', actorId: 'A', targetId: 'F0', toFt: 0 }).state;
    expect(checkReach(down, down.combatants.A as Combatant, down.combatants.F0 as Combatant, optionReach(sw)).ok).toBe(true);
    const ended = tick(applyEvents(s, [{ type: 'concentration_ended', actorId: 'A', label: 't' }]));
    expect(alt(ended.state, 'F0')).toBe(0);
    expect(ended.events.some((e) => e.type === 'map_effect' && e.rule === 'fall')).toBe(false);
    // Levitate'li yaratık duvar yoksa yürüyemez; 40'ta irtifa yok.
    expect(moveCostFn(s, s.combatants.F0 as Combatant)({ col: 4, row: 3 }, { col: 3, row: 3 })).toBeNull();
    expect(alt(go(field([wiz(['Levitate']), foe('F0', { saves: bad })], pos, 40), cast('Levitate', { targetIds: ['F0'] })).state, 'F0')).toBe(0);
  });
  it('Moonbeam silindiri 40 ft: 30 ft\'teki uçan etkilenir, 50 ft\'teki etkilenmez', () => {
    for (const [ft, hit] of [[30, true], [50, false]] as const) {
      const s = patch(field([wiz(['Moonbeam']), foe('F0', { fly: 60 })], { A: { col: 2, row: 3 }, F0: { col: 8, row: 3 } }, 41), 'F0', { altitudeFt: ft });
      const r = go(s, cast('Moonbeam', { targetHex: { col: 8, row: 3 } }));
      expect(r.events.some((e) => e.type === 'save_resolved' && e.targetId === 'F0')).toBe(hit);
    }
  });
  it('alan büyüsü irtifaya küre yarıçapı kadar ulaşır (Fireball 20 ft)', () => {
    for (const [ft, hit] of [[15, true], [40, false]] as const) {
      const s = patch(field([wiz(['Fireball']), foe('F0', { fly: 60 })], { A: { col: 1, row: 3 }, F0: { col: 8, row: 3 } }, 41), 'F0', { altitudeFt: ft });
      const r = go(s, cast('Fireball', { targetHex: { col: 8, row: 3 } }));
      expect(r.events.some((e) => e.type === 'save_resolved' && e.targetId === 'F0')).toBe(hit);
    }
  });
});

describe('S2 Flaming Sphere ve Gaseous Form', () => {
  it('Flaming Sphere 10 ft\'lik yarığı atlar, 15 ft\'liğini atlayamaz (41); 40\'ta yarığa giremez', () => {
    const mkS = (k: number, gap: number) => {
      const s = field([wiz([]), foe('F0')], { A: { col: 1, row: 3 }, F0: { col: 13, row: 3 } }, k);
      // Yarık: 5. sütundan başlayan `gap` sütun (bütün satırlar; hangi yönden geçilirse geçilsin genişlik aynı).
      const row = '.'.repeat(5) + 'u'.repeat(gap) + '.'.repeat(10 - gap);
      const tiles = (s.map as NonNullable<BattleState['map']>).tiles.map(() => row);
      const sphere = mk('S', { ownerId: 'p1', pos: { col: 4, row: 3 }, summon: { by: 'A', spellId: 'flaming-sphere', spell: 'Flaming Sphere', turn: 'after-owner', level: 2, intangible: true } as never });
      return { ...s, map: { ...(s.map as NonNullable<BattleState['map']>), tiles }, combatants: { ...s.combatants, S: sphere } } as BattleState;
    };
    expect(moveCostFn(mkS(41, 2), mkS(41, 2).combatants.S as Combatant)({ col: 5, row: 3 }, { col: 4, row: 3 })).toBe(1);
    expect(moveCostFn(mkS(41, 3), mkS(41, 3).combatants.S as Combatant)({ col: 5, row: 3 }, { col: 4, row: 3 })).toBeNull();
    // 40'ta küre yarığa giremez (atlama yok).
    expect(moveCostFn(mkS(40, 2), mkS(40, 2).combatants.S as Combatant)({ col: 5, row: 3 }, { col: 4, row: 3 })).toBeNull();
  });
  it('Gaseous Form: başka yaratığın altıgeninde durur, kapalı kapıdan süzülür (41); 40\'ta dolu altıgen', () => {
    for (const [k, ok] of [[41, true], [40, false]] as const) {
      const s0 = field([wiz(['Gaseous Form']), ally('C'), foe('F0')], { A: { col: 2, row: 3 }, C: { col: 3, row: 3 }, F0: { col: 12, row: 3 } }, k);
      const s1 = go(s0, cast('Gaseous Form', { targetIds: ['A'] })).state;
      const fresh = patch(s1, 'A', { economy: { ...(s1.combatants.A as Combatant).economy, action: false }, movementUsed: 0 });
      expect(tryGo(fresh, { type: 'move', actorId: 'A', to: { col: 3, row: 3 } } as Command).ok).toBe(ok);
      if (ok) {
        const door: MapObject = { id: 'd1', kind: 'door', at: { col: 2, row: 4 }, hp: 18, state: 'closed' };
        expect(tryGo(withObj(fresh, door), { type: 'move', actorId: 'A', to: { col: 2, row: 4 } } as Command).ok).toBe(true);
      }
    }
  });
});

describe('S2 gizli katman: Spike Growth, Phantasmal Force', () => {
  it('Spike Growth düşmandan gizli: fark etmeyen bilmez, oyuncu ekranı çizer (parti büyüsü); Arama ile fark edilir', () => {
    const s = go(field([wiz(['Spike Growth']), foe('F0', { skills: { perception: 30 } as never })], { A: { col: 2, row: 3 }, F0: { col: 12, row: 3 } }, 41), cast('Spike Growth', { targetHex: { col: 8, row: 3 } })).state;
    const z = s.map?.zones?.find((x) => x.spellId === 'spike-growth');
    expect(z?.hiddenFrom).toBe('enemies');
    expect(zoneKnownBy(z as never, s.combatants.F0 as Combatant)).toBe(false);
    expect(zoneShownTo(s, z as never, 'party', false)).toBe(true);
    const found = go(turnOf(s, 'F0'), { type: 'search', actorId: 'F0' } as Command);
    expect(found.events.some((e) => e.type === 'zone_spotted')).toBe(true);
    const old = go(field([wiz(['Spike Growth']), foe('F0')], { A: { col: 2, row: 3 }, F0: { col: 12, row: 3 } }, 40), cast('Spike Growth', { targetHex: { col: 8, row: 3 } })).state;
    expect(old.map?.zones?.find((x) => x.spellId === 'spike-growth')?.hiddenFrom).toBeUndefined();
  });
  it('düşmanın gizli alanı oyuncu ekranında çizilmez; Game Master anahtarı hepsini gösterir; hasarı alan fark eder', () => {
    const s0 = field([foe('F0', { spellNames: ['Spike Growth'], spellSlots: ALL, spellSaveDc: 15, casterTag: 'druid' }), wiz([])], { F0: { col: 2, row: 3 }, A: { col: 9, row: 3 } }, 41);
    const s = go(turnOf(s0, 'F0'), { type: 'cast_spell', actorId: 'F0', spellName: 'Spike Growth', targetHex: { col: 8, row: 3 } } as Command).state;
    const z = s.map?.zones?.find((x) => x.spellId === 'spike-growth') as NonNullable<BattleState['map']>['zones'] extends (infer T)[] | undefined ? T : never;
    expect(zoneShownTo(s, z, 'party', false)).toBe(false);
    expect(zoneShownTo(s, z, 'party', true)).toBe(true);
    const walked = go(turnOf(s, 'A'), { type: 'move', actorId: 'A', to: { col: 8, row: 3 } } as Command);
    expect(walked.events.some((e) => e.type === 'zone_spotted' && e.by.includes('A'))).toBe(true);
  });
  it('Phantasmal Force: hasar yalnız hedef yanılsamanın 5 ft içindeyken (41); 40\'ta her tur', () => {
    for (const [k, far, hurt] of [[41, true, false], [41, false, true], [40, true, true]] as const) {
      const s = go(field([wiz(['Phantasmal Force']), foe('F0', { saves: bad })], { A: { col: 2, row: 3 }, F0: { col: 6, row: 3 } }, k),
        cast('Phantasmal Force', { targetIds: ['F0'], targetHex: far ? { col: 11, row: 3 } : { col: 6, row: 3 } })).state;
      const t = effectTurnStartEvents(s, 'A', seededRng(2));
      expect(t.events.some((e) => e.type === 'effect_tick' && e.targetId === 'F0' && e.appliedDamage > 0)).toBe(hurt);
    }
  });
});

describe('S2 el modeli: Command, Heat Metal, Flame Blade, Enlarge/Reduce, Levitate nesne', () => {
  it('Command Drop: hedef silahını yere bırakır (nesne), saldıramaz; yerden alınca geri gelir (41)', () => {
    const s0 = field([wiz(['Command']), foe('F0', { saves: bad, weaponOptions: [sw] })], { A: { col: 2, row: 3 }, F0: { col: 3, row: 3 } }, 41);
    const s1 = go(s0, cast('Command', { targetIds: ['F0'], choice: 'drop' })).state;
    const tick = effectTurnStartEvents(turnOf(s1, 'F0'), 'F0', seededRng(1));
    const s2 = applyEvents(s1, tick.events);
    expect(s2.combatants.F0?.weaponOptions).toHaveLength(0);
    const obj = s2.map?.objects?.find((o) => o.kind === 'droppedItem');
    expect(obj?.item).toBe('longsword');
    const back = go(turnOf(s2, 'F0'), { type: 'pick_up', actorId: 'F0', objectId: obj?.id as string });
    expect(back.state.combatants.F0?.weaponOptions[0]?.weaponId).toBe('longsword');
    expect(back.state.map?.objects?.some((o) => o.kind === 'droppedItem')).toBe(false);
  });
  it('Heat Metal: metal tutmayana yapılmaz; başarısız save\'de bırakmayı seçen dezavantaj almaz (41)', () => {
    const pos = { A: { col: 2, row: 3 }, F0: { col: 6, row: 3 } };
    expect(tryGo(field([wiz(['Heat Metal']), foe('F0', { weaponOptions: [club] })], pos, 41), cast('Heat Metal', { targetId: 'F0' })).ok).toBe(false);
    const drop = go(field([wiz(['Heat Metal']), foe('F0', { saves: bad, weaponOptions: [sw] })], pos, 41), cast('Heat Metal', { targetId: 'F0' }), hooked(2, () => 'drop'));
    expect(drop.events.some((e) => e.type === 'item_dropped')).toBe(true);
    expect(drop.state.combatants.F0?.effects?.some((e) => e.id === 'spells:heat-metal') ?? false).toBe(false);
    const keep = go(field([wiz(['Heat Metal']), foe('F0', { saves: bad, weaponOptions: [sw] })], pos, 41), cast('Heat Metal', { targetId: 'F0' }), hooked(2, () => 'keep'));
    expect(keep.state.combatants.F0?.effects?.some((e) => e.id === 'spells:heat-metal')).toBe(true);
    expect(go(field([wiz(['Heat Metal']), foe('F0', { weaponOptions: [club] })], pos, 40), cast('Heat Metal', { targetId: 'F0' })).ok).toBe(true);
  });
  it('Flame Blade: bıçak bırakılır, bonus eylemle yeniden çağrılır (41)', () => {
    const s1 = go(field([wiz(['Flame Blade']), foe('F0')], { A: { col: 2, row: 3 }, F0: { col: 3, row: 3 } }, 41), cast('Flame Blade')).state;
    const d = go(s1, { type: 'drop_item', actorId: 'A', item: 'flame-blade' }).state;
    expect(d.combatants.A?.effects?.find((e) => e.id === 'spells:flame-blade')?.bladeGone).toBe(true);
    const back = go({ ...d, round: d.round + 1, combatants: { ...d.combatants, A: { ...(d.combatants.A as Combatant), economy: { ...(d.combatants.A as Combatant).economy, bonus: false } } } }, { type: 'spell_followup', actorId: 'A', targetId: 'F0' });
    expect(back.state.combatants.A?.effects?.find((e) => e.id === 'spells:flame-blade')?.bladeGone).toBeUndefined();
    expect(back.events.some((e) => e.type === 'action_used' && e.kind === 'bonus')).toBe(true);
    expect(tryGo(go(field([wiz(['Flame Blade']), foe('F0')], { A: { col: 2, row: 3 }, F0: { col: 3, row: 3 } }, 40), cast('Flame Blade')).state, { type: 'drop_item', actorId: 'A', item: 'flame-blade' }).ok).toBe(false);
  });
  it('Enlarge/Reduce taşınmayan nesneye: HP boyutla ölçeklenir, konsantrasyon bitince döner (41)', () => {
    const table: MapObject = { id: 'o1', kind: 'table', at: { col: 4, row: 3 }, hp: 18 };
    const s = go(withObj(field([wiz(['Enlarge/Reduce']), foe('F0')], { A: { col: 2, row: 3 }, F0: { col: 12, row: 3 } }, 41), table), cast('Enlarge/Reduce', { targetHex: { col: 4, row: 3 }, choice: 'Enlarge' })).state;
    expect(s.map?.objects?.find((o) => o.id === 'o1')?.hp).toBe(27);
    const ended = tick(applyEvents(s, [{ type: 'concentration_ended', actorId: 'A', label: 't' }])).state;
    expect(ended.map?.objects?.find((o) => o.id === 'o1')).toMatchObject({ hp: 18 });
    expect(ended.map?.objects?.find((o) => o.id === 'o1')?.resized).toBeUndefined();
  });
  it('Levitate nesneye: 500 lb\'ye dek kalkar; ağır nesne kalkmaz (41)', () => {
    const chest: MapObject = { id: 'c1', kind: 'chest', at: { col: 4, row: 3 }, hp: 10 };
    const tree: MapObject = { id: 't1', kind: 'tree', at: { col: 5, row: 3 }, hp: 50 };
    const s = withObj(withObj(field([wiz(['Levitate']), foe('F0')], { A: { col: 2, row: 3 }, F0: { col: 12, row: 3 } }, 41), chest), tree);
    const r = go(s, cast('Levitate', { targetHex: { col: 4, row: 3 } }));
    expect(r.state.map?.objects?.find((o) => o.id === 'c1')).toMatchObject({ altitudeFt: 20, levitatedBy: 'A' });
    expect(tryGo(s, cast('Levitate', { targetHex: { col: 5, row: 3 } })).ok).toBe(false);
  });
});

describe('S2 küçük kurallar: Web, Plant Growth, Wind Wall', () => {
  it('Web: hafif örtülü altıgendeki hedefe pasif Algı −5 (41); 40\'ta değişmez', () => {
    for (const [k, minus] of [[41, 5], [40, 0]] as const) {
      const s = go(field([wiz(['Web']), foe('F0')], { A: { col: 2, row: 3 }, F0: { col: 12, row: 3 } }, k), cast('Web', { targetHex: { col: 7, row: 3 } })).state;
      const w = s.combatants.F0 as Combatant;
      expect(passivePerception(s, w, { col: 1, row: 1 }) - passivePerception(s, w, { col: 7, row: 3 })).toBe(minus);
    }
  });
  it('Plant Growth: seçilen altıgenler alanın dışında kalır (41); 40\'ta yok sayılır', () => {
    for (const [k, out] of [[41, true], [40, false]] as const) {
      const r = go(field([wiz(['Plant Growth']), foe('F0')], { A: { col: 1, row: 3 }, F0: { col: 13, row: 3 } }, k), cast('Plant Growth', { targetHex: { col: 7, row: 3 }, excludeHexes: [{ col: 7, row: 3 }, { col: 8, row: 3 }] }));
      const z = r.state.map?.zones?.find((x) => x.spellId === 'plant-growth');
      expect(!z?.hexes.some((h) => h.col === 7 && h.row === 3)).toBe(out);
    }
  });
  it('Wind Wall: serbest yol (bitişik altıgenler); kuşatma mermisi (Rock) duvardan geçer, ok geçmez (41)', () => {
    const path = [{ col: 6, row: 1 }, { col: 6, row: 2 }, { col: 6, row: 3 }, { col: 7, row: 3 }, { col: 7, row: 4 }];
    const s = go(field([wiz(['Wind Wall']), foe('F0', { saves: { ...bad, str: 30 } })], { A: { col: 2, row: 3 }, F0: { col: 12, row: 3 } }, 41), cast('Wind Wall', { targetHex: { col: 6, row: 1 }, targetHexes: path })).state;
    const z = s.map?.zones?.find((x) => x.spellId === 'wind-wall');
    expect(z?.hexes).toHaveLength(5);
    expect(tryGo(field([wiz(['Wind Wall']), foe('F0')], { A: { col: 2, row: 3 }, F0: { col: 12, row: 3 } }, 41), cast('Wind Wall', { targetHexes: [{ col: 6, row: 1 }, { col: 9, row: 1 }] })).ok).toBe(false);
    const a = s.combatants.F0 as Combatant; const t = s.combatants.A as Combatant;
    const rock = checkReach(s, a, t, { kind: 'ranged', normalFt: 60, longFt: 240, label: 'Rock' });
    const arrow = checkReach(s, a, t, { kind: 'ranged', normalFt: 60, longFt: 240, label: 'Longbow' });
    expect(rock.ok && !rock.autoMiss).toBe(true);
    expect(arrow.ok && !!arrow.autoMiss).toBe(true);
  });
});
