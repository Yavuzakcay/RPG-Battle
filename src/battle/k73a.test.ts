/**
 * Kuyruk K73a (kural sürümü 62): YZ dikey taktiği. Yol mesafeli yaklaşma (cep kilitlenmesi), parti hava düzeyi (yükselme,
 * iniş, yakın dövüşçü uçanın inişi, özellik uçuşu), sur tepesine tırmanma/konma (ölü bölgeden çıkış), kat seçimi, Buzul —
 * Kamp kilitlenmesi; 61'de eski davranış, replay aynı.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { mk, P1 } from './fixtures';
import { execute, startBattle } from './index';
import { replay } from './reduce';
import { chooseCommand } from './ai';
import { currentActorId } from './common';
import { highGroundBonus, riseFt } from './ai/k73a';
import { setDefaultRuleVersion } from './create';
import { setDefaultRuleToggles } from './ruleControl';
import { K26_RULES } from './highlands';
import { CURRENT_RULES } from './ruleVersion';
import { SCENARIOS, simulate } from '../sim/balance';
import { contextFor } from '../ui/session';
import { KATLI_BINA_DIKEY, KATLI_BINA_TILES } from '../map/fixtures/katliBina';
import type { MapDikey } from '../map/maps';
import type { Offset } from '../rules/hex';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command } from './types';

const H = (col: number, row = 3): Offset => ({ col, row });
const open = () => Array.from({ length: 7 }, () => '.'.repeat(15));
const wallCol = (col = 7, ch = 's') => Array.from({ length: 7 }, () => Array.from({ length: 15 }, (_, c) => (c === col ? ch : '.')).join(''));
const SUR: MapDikey = { harfFt: { s: 15 }, surUstu: ['s'] };
interface Opts { ver?: number; tiles?: string[]; dikey?: MapDikey }
function field(parts: Combatant[], pos: Record<string, [Offset, number?]>, o: Opts = {}): BattleState {
  const s = startBattle('k73a', 'k73a', parts, () => 0.5, { kuralSurumu: o.ver ?? 62,
    map: { id: 'col', variantId: 'gunduz', ruleToggles: { darkness: false, trap: false } } } as never).state;
  const combatants = { ...s.combatants };
  for (const [id, [p, alt]] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p, ...(alt ? { altitudeFt: alt } : {}) };
  return { ...s, status: 'active', order: parts.map((c) => c.id), turnIndex: 0, combatants,
    map: { ...(s.map as NonNullable<BattleState['map']>), tiles: o.tiles ?? open(), objects: [], ...(o.dikey ? { dikey: o.dikey } : {}) } };
}
const BITE = [{ name: 'Bite', bonus: 5, damageDice: '1d6', damageType: 'piercing', repeat: 1, ranged: false, reachFt: 5, text: 'Bite' }] as never;
const POLE = [{ name: 'Glaive', bonus: 5, damageDice: '1d10', damageType: 'slashing', repeat: 1, ranged: false, reachFt: 10, text: 'Glaive' }] as never;
const bow: AttackOption = { label: 'Longbow', attackBonus: 6, damage: '1d8+3', damageType: 'piercing', ranged: true, spell: false, range: [150, 600], tag: 'longbow' };
const sword: AttackOption = { label: 'Longsword', attackBonus: 5, damage: '1d8+3', damageType: 'slashing', ranged: false, spell: false, tag: 'longsword' };
const FLY = { id: 'fly-spell', name: 'Fly', sourceId: 'A', fly: 60, concentration: 'Fly' };
const CONC = { spell: 'Fly', slotLevel: 3, turn: '0:0' };
const A = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', speed: 30, weaponOptions: [bow], modifiers: { str: 0, dex: 3, con: 0, int: 0, wis: 0, cha: 0 },
  ...(p.effects?.some((e) => e.concentration === 'Fly') ? { concentration: CONC } : {}), ...p });
const G = (id = 'G', p: Partial<Combatant> = {}) => mk(id, { side: 'enemies', attacks: BITE, hp: 30, maxHp: 30, ...p });
const choose = (s: BattleState): Command => chooseCommand(s);

afterEach(() => { setDefaultRuleVersion(CURRENT_RULES); setDefaultRuleToggles({}); });

describe('K73a yaklaşma yol mesafesiyle (Görev 4)', () => {
  // 6. sütun 0–5. satır duvar; açıklık yalnız 6. satırda. A (yakın dövüşçü, 20 ft) duvarın batısında üst köşede: düz
  // mesafeyi kısaltan hiçbir yer yok (cep), yol aşağıdan dolanıyor.
  const pocket = () => Array.from({ length: 7 }, (_, r) => Array.from({ length: 15 }, (_, c) => (c === 6 && r <= 5 ? 's' : '.')).join(''));
  const scene = (ver: number) => field([A({ speed: 20, weaponOptions: [sword] }), G()], { A: [H(5, 0)], G: [H(12, 0)] }, { ver, tiles: pocket() });
  it('62: cepten yol boyunca çıkar; 61: turu bitirir (yerel minimum)', () => {
    const c62 = choose(scene(62));
    expect(c62.type).toBe('move');
    expect(c62.type === 'move' && c62.to.row).toBeGreaterThan(0);
    expect(choose(scene(61)).type).toBe('end_turn');
  });
});

describe('K73a parti hava düzeyi (Görev 1)', () => {
  const sky = (ver: number, a: Partial<Combatant> = {}, g: Partial<Combatant> = {}, gPos = H(8)) =>
    field([A({ effects: [FLY], ...a }), G('G', g)], { A: [H(3)], G: [gPos] }, { ver });
  it('menzilli uçan, yerdeki yakın dövüşçünün erişiminin üstüne (10 ft) yükselir; 61\'de doğrudan saldırır', () => {
    const c = choose(sky(62));
    expect(c).toEqual({ type: 'vertical_move', actorId: 'A', toFt: 10 });
    expect(choose(sky(61)).type).toBe('attack');
  });
  it('yükseldikten sonra oradan saldırır (yeniden yükselmez)', () => {
    const r = execute(sky(62), { type: 'vertical_move', actorId: 'A', toFt: 10 }, P1, () => 0.5);
    expect(r.ok).toBe(true);
    if (r.ok) expect(choose(r.state).type).toBe('attack');
  });
  it('10 ft erişimli düşmana karşı konsantrasyonlu uçuş (en çok 10 ft) yetmez: yükselmez; kendi uçuşuyla 15 ft', () => {
    const s = sky(62, {}, { attacks: POLE });
    expect(riseFt(s, s.combatants.A as Combatant, [s.combatants.G as Combatant])).toBeNull();
    expect(choose(s).type).toBe('attack');
    const own = sky(62, { effects: [], fly: 60 }, { attacks: POLE });
    expect(choose(own)).toEqual({ type: 'vertical_move', actorId: 'A', toFt: 15 });
  });
  it('bitişikte düşman varken yükselmez (fırsat saldırısı)', () => {
    expect(choose(sky(62, {}, {}, H(4))).type).not.toBe('vertical_move');
  });
  it('uçuşu bu tur biten (süre) ya da zorunlu inişli uçan turu bitirmeden iner; 61\'de inmez', () => {
    const spent = { economy: { ...mk('x').economy, action: true, attacksLeft: 0 } };
    const ending = (ver: number, fx: Record<string, unknown>) => {
      const s = field([A({ effects: [fx as never], ...spent }), G()], { A: [H(3), 20], G: [H(12)] }, { ver });
      return choose(s);
    };
    expect(ending(62, { ...FLY, until: 1 })).toEqual({ type: 'vertical_move', actorId: 'A', toFt: 0 });
    expect(ending(62, { id: 'pk:x#0:A:kanat', name: 'Kanat', sourceId: 'A', fly: 30, until: 10 })).toEqual({ type: 'vertical_move', actorId: 'A', toFt: 0 });
    // Hareketi yetmezse yettiği kadar alçalır (15 ft uçuş = 3 altıgen: 20 ft'ten 5 ft'e).
    expect(ending(62, { id: 'pk:x#0:A:kanat', name: 'Kanat', sourceId: 'A', fly: 15, until: 10 })).toEqual({ type: 'vertical_move', actorId: 'A', toFt: 5 });
    expect(ending(62, { ...FLY, until: 10 }).type).toBe('end_turn');
    expect(ending(61, { ...FLY, until: 1 }).type).toBe('end_turn');
  });
  it('konsantrasyonlu uçuşta can eşiğin altındaysa iner', () => {
    const s = field([A({ effects: [{ ...FLY, until: 10 }], hp: 5, maxHp: 20, economy: { ...mk('x').economy, action: true, attacksLeft: 0 } }), G()], { A: [H(3), 10], G: [H(12)] });
    expect(choose(s)).toEqual({ type: 'vertical_move', actorId: 'A', toFt: 0 });
  });
  it('yakın dövüşçü uçan parti üyesi yerdeki hedefe iner (hava yeri partiye açık); 61\'de inmez', () => {
    const melee = (ver: number) => field([A({ effects: [{ ...FLY, until: 10 }], weaponOptions: [sword] }), G()], { A: [H(3), 30], G: [H(6)] }, { ver });
    const c = choose(melee(62));
    expect(c.type).toBe('move');
    expect(c.type === 'move' ? c.toFt : undefined).toBeLessThanOrEqual(5);
    const old = choose(melee(61));
    expect(old.type === 'move' && old.toFt !== undefined).toBe(false);
  });
  it('özellik uçuşu (Draconic Flight) yalnız yürüyerek yetişilemeyen hedefe karşı', () => {
    const chasm = Array.from({ length: 7 }, () => Array.from({ length: 15 }, (_, c) => (c >= 6 && c <= 9 ? 'u' : '.')).join(''));
    const feat = { key: 'srd19:draconic-flight', name: 'Draconic Flight', type: 'bonus' as const, resource: 'draconicFlight', effect: { kind: 'selfEffect', rounds: 100, effect: { fly: 30 } } as never };
    const scene = (ver: number, tiles = chasm) => field([A({ weaponOptions: [sword], features: [feat], resources: { ...mk('x').resources, draconicFlight: 1 } }), G()], { A: [H(4)], G: [H(11)] }, { ver, tiles });
    expect(choose(scene(62))).toEqual({ type: 'use_feature', actorId: 'A', feature: 'srd19:draconic-flight' });
    expect(choose(scene(61)).type).not.toBe('use_feature');
    expect(choose(scene(62, open())).type).not.toBe('use_feature');
  });
});

describe('K73a sur ve yüksek zemin (Görev 2, 3)', () => {
  it('ölü bölgedeki okçu (sur arkasında hedef yok) sura tırmanır; 61\'de tırmanmaz', () => {
    const scene = (ver: number) => field([A({ speed: 40, modifiers: { str: 0, dex: 5, con: 0, int: 0, wis: 0, cha: 0 } }), G()], { A: [H(6)], G: [H(10)] }, { ver, tiles: wallCol(), dikey: SUR });
    expect(choose(scene(62))).toEqual({ type: 'climb', actorId: 'A', to: H(7) });
    expect(choose(scene(61))).not.toEqual({ type: 'climb', actorId: 'A', to: H(7) });
  });
  it('uçan okçu yakındaki sur tepesine konar (K8)', () => {
    const s = field([A({ effects: [{ ...FLY, until: 10 }] }), G('G', { attacks: [] })], { A: [H(6)], G: [H(10)] }, { tiles: wallCol(), dikey: SUR });
    const c = choose(s);
    expect(c.type).toBe('move');
    expect(c.type === 'move' ? [c.to.col, c.toFt] : null).toEqual([7, 15]);
  });
  it('yüksek zemin indirimi: sur tepesinde yerdeki düşmana karşı var; yerde ve havada yok', () => {
    const s = field([A(), G()], { A: [H(7), 15], G: [H(10)] }, { tiles: wallCol(), dikey: SUR });
    const a = s.combatants.A as Combatant;
    const foes = [s.combatants.G as Combatant];
    expect(highGroundBonus(s, a, foes, H(7), 15)).toBeGreaterThan(0);
    expect(highGroundBonus(s, a, foes, H(5), 0)).toBe(0);
    const fly = field([A({ effects: [FLY] }), G()], { A: [H(5), 15], G: [H(10)] });
    expect(highGroundBonus(fly, fly.combatants.A as Combatant, [fly.combatants.G as Combatant], H(5), 15)).toBe(0);
  });
  it('kat: en yakın düşman üst kattaysa merdivene yürür (aynı katta uzak düşman olsa da); 61\'de yürümez', () => {
    const scene = (ver: number) => {
      // A 20 ft (4 altıgen): dışarıdaki F bu tur yetişilemez; üst kattaki U en yakın.
      const s = field([A({ weaponOptions: [sword], speed: 20 }), G('U'), G('F')], { A: [H(8, 3)], U: [H(5, 3), 10], F: [H(14, 6)] }, { ver, tiles: KATLI_BINA_TILES, dikey: KATLI_BINA_DIKEY });
      return s;
    };
    const c = choose(scene(62));
    expect(c).toEqual({ type: 'move', actorId: 'A', to: H(4, 2) });
    expect(choose(scene(61))).not.toEqual({ type: 'move', actorId: 'A', to: H(4, 2) });
  });
});

describe('K73a kilitlenme ve replay', () => {
  it('Buzul — Kamp tohum 1 (K26 kuralları açık) 62\'de 20 turda biter; 61\'de zaman aşımı', () => {
    setDefaultRuleToggles(Object.fromEntries(K26_RULES.map((id) => [id, true])));
    const sc = SCENARIOS.find((x) => x.id === 'k29-buzul-kamp');
    expect(sc).toBeTruthy();
    const now = simulate(sc!, 1, 20, 3);
    expect(now.winner).not.toBe('timeout');
    expect(now.rounds).toBeLessThanOrEqual(20);
    setDefaultRuleVersion(61);
    expect(simulate(sc!, 1, 20, 3).winner).toBe('timeout');
  }, 120_000);
  it('YZ ile oynanan dikey savaş baştan oynatılınca aynı durum', () => {
    let s = field([A({ effects: [FLY], hp: 30, maxHp: 30 }), G('G'), G('H')], { A: [H(3)], G: [H(8)], H: [H(9, 5)] });
    const events: BattleEvent[] = [{ type: 'battle_started', state: s } as BattleEvent];
    const rng = (() => { let i = 0; return () => ((i++ * 37) % 100) / 100; })();
    for (let step = 0; step < 60 && s.status === 'active'; step++) {
      const id = currentActorId(s);
      const cmd = chooseCommand(s);
      const r = execute(s, cmd, contextFor(s, id), rng);
      if (!r.ok) { const e = execute(s, { type: 'end_turn', actorId: id }, contextFor(s, id), rng); if (!e.ok) break; s = e.state; events.push(...e.events); continue; }
      s = r.state; events.push(...r.events);
    }
    expect(events.some((e) => e.type === 'altitude_changed')).toBe(true);
    expect(JSON.stringify(replay(events).combatants)).toBe(JSON.stringify(s.combatants));
  });
});
