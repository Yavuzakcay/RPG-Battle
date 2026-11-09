/**
 * Kuyruk K73b (kural sürümü 63): çok turlu sur tırmanışı (başla / tutun / devam / düş; YZ), tek 3B bitişiklik `adjacent3D`
 * (aynı yüzey, üst üste, üst kat döşemesi, büyük yaratık; otomatik kritik, yakalama, itme, aura), gönüllü düşme
 * (`jump_down`; YZ), SRD suya düşme, düşman tarafındaki uçan menzilli yükselme. 62'de eski davranış; replay aynı.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { mk, P1 } from './fixtures';
import { execute, startBattle } from './index';
import { replay } from './reduce';
import { chooseCommand } from './ai';
import { adjacent3D, gap3D } from './adjacency';
import { withinFiveFt } from './common';
import { auraSaveOf } from './auras';
import { dropTargets } from './drop';
import { setDefaultRuleVersion } from './create';
import { CURRENT_RULES } from './ruleVersion';
import { KATLI_BINA_DIKEY, KATLI_BINA_TILES } from '../map/fixtures/katliBina';
import type { MapDikey } from '../map/maps';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command } from './types';

const H = (col: number, row = 3): Offset => ({ col, row });
const open = () => Array.from({ length: 7 }, () => '.'.repeat(15));
const wallCol = (col = 7, ch = 's') => Array.from({ length: 7 }, () => Array.from({ length: 15 }, (_, c) => (c === col ? ch : '.')).join(''));
/** 25 ft kaba sur (×2, DC 10): 30 ft hızla tek turda çıkılmaz (1 + 10 altıgen). */
const SUR25: MapDikey = { harfFt: { s: 25 }, surUstu: ['s'], yuzey: { s: 'kaba' } } as MapDikey;
interface Opts { ver?: number; tiles?: string[]; dikey?: MapDikey }
function field(parts: Combatant[], pos: Record<string, [Offset, number?]>, o: Opts = {}): BattleState {
  const s = startBattle('k73b', 'k73b', parts, () => 0.5, { kuralSurumu: o.ver ?? 63,
    map: { id: 'col', variantId: 'gunduz', ruleToggles: { darkness: false, trap: false } } } as never).state;
  const combatants = { ...s.combatants };
  for (const [id, [p, alt]] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p, ...(alt ? { altitudeFt: alt } : {}) };
  return { ...s, status: 'active', order: parts.map((c) => c.id), turnIndex: 0, combatants,
    map: { ...(s.map as NonNullable<BattleState['map']>), tiles: o.tiles ?? open(), objects: [], ...(o.dikey ? { dikey: o.dikey } : {}) } };
}
const BITE = [{ name: 'Bite', bonus: 5, damageDice: '1d6', damageType: 'piercing', repeat: 1, ranged: false, reachFt: 5, text: 'Bite' }] as never;
const SHORTBOW = [{ name: 'Shortbow', bonus: 4, damageDice: '1d6+2', damageType: 'piercing', repeat: 1, ranged: true, range: [80, 320], text: 'Shortbow' }] as never;
const bow: AttackOption = { label: 'Longbow', attackBonus: 6, damage: '1d8+3', damageType: 'piercing', ranged: true, spell: false, range: [150, 600], tag: 'longbow' };
const sword: AttackOption = { label: 'Longsword', attackBonus: 5, damage: '1d8+3', damageType: 'slashing', ranged: false, spell: false, tag: 'longsword' };
const DEX3 = { str: 0, dex: 3, con: 0, int: 0, wis: 0, cha: 0 };
const A = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', speed: 30, weaponOptions: [bow], modifiers: DEX3, ...p });
const G = (id = 'G', p: Partial<Combatant> = {}) => mk(id, { side: 'enemies', attacks: BITE, hp: 30, maxHp: 30, ...p });
const run = (s: BattleState, cmd: Command, rng: Rng = () => 0.9) => execute(s, cmd, P1, rng);
const ok = (r: ReturnType<typeof execute>): BattleState => { if (!r.ok) throw new Error(r.error); return r.state; };
/** Sıradaki tur gibi: hareket ve eylem tazelenir (konum, irtifa, tırmanma işareti aynı). */
const fresh = (s: BattleState, id: string): BattleState => {
  const c = s.combatants[id] as Combatant;
  return { ...s, combatants: { ...s.combatants, [id]: { ...c, movementUsed: 0, economy: { ...c.economy, action: false, bonus: false, attacksLeft: 1 } } } };
};
const of = (s: BattleState, id: string) => s.combatants[id] as Combatant;

afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

describe('K73b çok turlu sur tırmanışı (Görev 1)', () => {
  const scene = (ver: number) => field([A(), G()], { A: [H(6)], G: [H(13)] }, { ver, tiles: wallCol(), dikey: SUR25 });
  it('başla: hareket yetmeyince yüzde yetebildiği kadar yükselir (Çeviklik bir kez), tutunur; 62\'de ret', () => {
    const r = run(scene(63), { type: 'climb', actorId: 'A', to: H(7) });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.events.filter((e) => e.type === 'map_effect' && e.rule === 'climb')).toHaveLength(1);
    const a = of(r.state, 'A');
    expect([a.altitudeFt, a.climbing, a.movementUsed, a.pos]).toEqual([15, true, 6, H(6)]);
    expect(run(scene(62), { type: 'climb', actorId: 'A', to: H(7) }).ok).toBe(false);
  });
  it('devam: sonraki turda zarsız kalan 10 ft + tepeye adım; tepede durur (tırmanma işareti kalkar)', () => {
    const s1 = fresh(ok(run(scene(63), { type: 'climb', actorId: 'A', to: H(7) })), 'A');
    const r = run(s1, { type: 'climb', actorId: 'A', to: H(7) });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.events.some((e) => e.type === 'map_effect' && e.rule === 'climb')).toBe(false);
    const a = of(r.state, 'A');
    expect([a.altitudeFt, a.climbing, a.pos, a.movementUsed]).toEqual([25, undefined, H(7), 5]);
  });
  it('tutunurken Prone olursa komut sonunda düşer (K71b)', () => {
    const s1 = ok(run(scene(63), { type: 'climb', actorId: 'A', to: H(7) }));
    const prone: BattleState = { ...s1, combatants: { ...s1.combatants, A: { ...of(s1, 'A'), conditions: ['Prone'] } } };
    const r = run(prone, { type: 'end_turn', actorId: 'A' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(of(r.state, 'A').altitudeFt ?? 0).toBe(0);
  });
  it('tırmanma zarı tutmazsa yerinde kalır, ilk 5 ft yanar (düşme yok)', () => {
    const r = run(scene(63), { type: 'climb', actorId: 'A', to: H(7) }, () => 0.01);
    expect(r.ok).toBe(true);
    if (r.ok) expect([of(r.state, 'A').altitudeFt ?? 0, of(r.state, 'A').movementUsed]).toEqual([0, 2]);
  });
  it('tepeden tırmanarak iniş de çok turlu (1 altıgen + yettiği kadar)', () => {
    const s = field([A({ speed: 15 }), G()], { A: [H(7), 25], G: [H(13)] }, { tiles: wallCol(), dikey: SUR25 });
    const r = run(s, { type: 'climb', actorId: 'A', to: H(8) });
    expect(r.ok).toBe(true);
    // 15 ft hız = 3 altıgen: 1 yatay + 2 (5 ft × ×2).
    if (r.ok) expect([of(r.state, 'A').pos, of(r.state, 'A').altitudeFt, of(r.state, 'A').climbing]).toEqual([H(8), 20, true]);
  });
  it('YZ: ölü bölgedeki okçu tek tura sığmayan sura çok turlu tırmanır, sonraki tur sürdürür; 62\'de başlamaz', () => {
    const at = (ver: number) => field([A(), G()], { A: [H(6)], G: [H(10)] }, { ver, tiles: wallCol(), dikey: SUR25 });
    expect(chooseCommand(at(63))).toEqual({ type: 'climb', actorId: 'A', to: H(7) });
    expect(chooseCommand(at(62))).not.toEqual({ type: 'climb', actorId: 'A', to: H(7) });
    const s1 = fresh(ok(run(at(63), { type: 'climb', actorId: 'A', to: H(7) })), 'A');
    expect(chooseCommand(s1)).toEqual({ type: 'climb', actorId: 'A', to: H(7) });
  });
});

describe('K73b 3B bitişiklik (Görev 2)', () => {
  it('aynı yüzey, üst üste, dikey 10 ft; büyük yaratık boyu', () => {
    const s = field([A(), G('G'), G('F', { fly: 60 }), G('L', { size: 'L' })], { A: [H(3)], G: [H(4)], F: [H(3), 5], L: [H(8)] });
    const a = of(s, 'A');
    expect(adjacent3D(s, a, of(s, 'G'))).toBe(true);
    expect(adjacent3D(s, a, of(s, 'F'))).toBe(true);
    const high = { ...of(s, 'F'), altitudeFt: 10 };
    expect(adjacent3D(s, a, high)).toBe(false);
    expect(gap3D(s, a, high)).toBe(2);
    // Large (2 düzey: 0–10 ft) bitişik altıgende 10 ft'teki Medium'a 5 ft: bitişik; Medium'a değil.
    const L = of(s, 'L');
    expect(adjacent3D(s, L, { ...high, pos: H(9) })).toBe(true);
    expect(adjacent3D(s, a, { ...high, pos: H(4) })).toBe(false);
  });
  it('kat döşemesi ayırır (üst kat ile alt kat aynı altıgen/bitişik)', () => {
    const s = field([A(), G()], { A: [H(6), 10], G: [H(6)] }, { tiles: KATLI_BINA_TILES, dikey: KATLI_BINA_DIKEY });
    expect(adjacent3D(s, of(s, 'A'), of(s, 'G'))).toBe(false);
    expect(gap3D(s, of(s, 'A'), of(s, 'G'))).toBe(Infinity);
    const same = field([A(), G()], { A: [H(6), 10], G: [H(7), 10] }, { tiles: KATLI_BINA_TILES, dikey: KATLI_BINA_DIKEY });
    expect(adjacent3D(same, of(same, 'A'), of(same, 'G'))).toBe(true);
  });
  it('otomatik kritik 5 ft: bitişik altıgende 30 ft yukarıdaki için 63\'te yok, 62\'de var', () => {
    for (const [ver, want] of [[63, false], [62, true]] as const) {
      const s = field([A(), G('G', { fly: 60, conditions: ['Paralyzed'] })], { A: [H(3)], G: [H(4), 30] }, { ver });
      expect(withinFiveFt(s, of(s, 'A'), of(s, 'G'), false)).toBe(want);
    }
  });
  it('yakalama ve itme dikeyde 5 ft: 30 ft\'teki uçana 63\'te yok; 62\'de denenir', () => {
    for (const cmd of [{ type: 'grapple', actorId: 'A', targetId: 'G' }, { type: 'shove', actorId: 'A', targetId: 'G', effect: 'prone' }] as Command[]) {
      const s = (ver: number) => field([A({ weaponOptions: [sword] }), G('G', { fly: 60 })], { A: [H(3)], G: [H(4), 30] }, { ver });
      const r63 = run(s(63), cmd);
      expect(r63.ok).toBe(false);
      if (!r63.ok) expect(r63.error).toContain('dikeyde');
      expect(run(s(62), cmd).ok).toBe(true);
    }
  });
  it('itme döşemenin içinden yapılmaz (K72 kısıtı adjacent3D\'de): 63 ve 62', () => {
    for (const ver of [63, 62]) {
      const s = field([A({ weaponOptions: [sword] }), G()], { A: [H(6), 10], G: [H(7)] }, { ver, tiles: KATLI_BINA_TILES, dikey: KATLI_BINA_DIKEY });
      const r = run(s, { type: 'shove', actorId: 'A', targetId: 'G', effect: 'prone' } as Command);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toContain('döşeme');
    }
  });
  it('aura (Aura of Protection) dikeyde de: 30 ft yukarıdaki dosta 63\'te yok, 62\'de var; döşeme keser', () => {
    const pal = (p: Partial<Combatant> = {}) => mk('P', { ownerId: 'p1', traits: ['aura-of-protection'], level: 6, modifiers: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 3 }, ...p });
    for (const [ver, want] of [[63, 0], [62, 3]] as const) {
      const s = field([pal(), A({ fly: 60 })], { P: [H(3)], A: [H(4), 30] }, { ver });
      expect(auraSaveOf(s, of(s, 'A'))).toBe(want);
    }
    const near = field([pal(), A()], { P: [H(3)], A: [H(4)] });
    expect(auraSaveOf(near, of(near, 'A'))).toBe(3);
    const floors = field([pal(), A()], { P: [H(6)], A: [H(6), 10] }, { tiles: KATLI_BINA_TILES, dikey: KATLI_BINA_DIKEY });
    expect(auraSaveOf(floors, of(floors, 'A'))).toBe(0);
  });
});

describe('K73b gönüllü düşme (Görev 3)', () => {
  const top = (ver: number, p: Partial<Combatant> = {}) => field([A({ weaponOptions: [sword], hp: 40, maxHp: 40, ...p }), G()], { A: [H(7), 25], G: [H(12)] }, { ver, tiles: wallCol(), dikey: SUR25 });
  it('sur tepesinden bitişik yere atlar: 25 ft = 2d6, Prone, 1 altıgen; 62\'de komut yok', () => {
    const r = run(top(63), { type: 'jump_down', actorId: 'A', to: H(8) });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const a = of(r.state, 'A');
    expect([a.pos, a.altitudeFt ?? 0, a.movementUsed, a.conditions.includes('Prone')]).toEqual([H(8), 0, 1, true]);
    const fall = r.events.find((e) => e.type === 'map_effect' && e.rule === 'fall') as Extract<BattleEvent, { type: 'map_effect' }>;
    expect(fall.damage?.rolls).toHaveLength(2);
    expect(run(top(62), { type: 'jump_down', actorId: 'A', to: H(8) }).ok).toBe(false);
  });
  it('önizleme: hedefler ft ve zarla; aynı yükseklikteki sur altıgenine atlanmaz', () => {
    const plans = dropTargets(top(63), of(top(63), 'A'));
    expect(plans.find((p) => p.to.col === 8 && p.to.row === 3)).toMatchObject({ ft: 25, dice: '2d6', land: 0, cost: 1 });
    expect(plans.some((p) => p.to.col === 7)).toBe(false);
  });
  it('duvar yüzünde tutunan kendi altıgeninde bırakır (hareketsiz)', () => {
    const s = field([A(), G()], { A: [H(6), 15], G: [H(12)] }, { tiles: wallCol(), dikey: SUR25 });
    const clinging: BattleState = { ...s, combatants: { ...s.combatants, A: { ...of(s, 'A'), climbing: true } } };
    const r = run(clinging, { type: 'jump_down', actorId: 'A', to: H(6) });
    expect(r.ok).toBe(true);
    if (r.ok) expect([of(r.state, 'A').altitudeFt ?? 0, of(r.state, 'A').movementUsed, of(r.state, 'A').climbing]).toEqual([0, 0, undefined]);
  });
  it('üst kattan delikten alt kata: döşemesiz altıgene atlar, zemine iner (10 ft)', () => {
    const s = field([A(), G()], { A: [H(7, 4), 10], G: [H(13)] }, { tiles: KATLI_BINA_TILES, dikey: KATLI_BINA_DIKEY });
    const r = run(s, { type: 'jump_down', actorId: 'A', to: H(8, 4) });
    expect(r.ok).toBe(true);
    if (r.ok) expect([of(r.state, 'A').pos, of(r.state, 'A').altitudeFt ?? 0]).toEqual([H(8, 4), 0]);
    // Döşemeli komşuya atlanmaz (aynı yükseklikte yürünür).
    expect(run(s, { type: 'jump_down', actorId: 'A', to: H(6, 4) }).ok).toBe(false);
  });
  it('YZ: sur tepesindeki yakın dövüşçü aşağıdaki düşmana atlar; canı en kötü hasarı kaldırmıyorsa atlamaz; 62\'de atlamaz', () => {
    const near = (ver: number, hp = 40) => field([A({ weaponOptions: [sword], hp, maxHp: 40 }), G()], { A: [H(7), 25], G: [H(9)] }, { ver, tiles: wallCol(), dikey: SUR25 });
    expect(chooseCommand(near(63))).toEqual({ type: 'jump_down', actorId: 'A', to: H(8) });
    expect(chooseCommand(near(63, 10)).type).not.toBe('jump_down');
    expect(chooseCommand(near(62)).type).not.toBe('jump_down');
  });
});

describe('K73b suya düşme (Görev 4)', () => {
  const pool = () => Array.from({ length: 7 }, (_, r) => Array.from({ length: 15 }, (_, c) => (c === 7 ? 's' : c === 8 && r === 3 ? 'w' : '.')).join(''));
  const scene = (ver: number, p: Partial<Combatant> = {}) => field([A({ hp: 40, maxHp: 40, ...p }), G()], { A: [H(7), 25], G: [H(13)] }, { ver, tiles: pool(), dikey: SUR25 });
  it('derin suya düşen hasar alır; tepkisiyle DC 15 başarılıysa yarı hasar (63); 62\'de itmeyle düşme hasarsız', () => {
    const r = run(scene(63), { type: 'jump_down', actorId: 'A', to: H(8) }, () => 0.99);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.events.some((e) => e.type === 'reaction_used' && e.reaction === 'suya-dusus')).toBe(true);
    const check = r.events.find((e) => e.type === 'map_effect' && e.rule === 'fall' && e.roll) as Extract<BattleEvent, { type: 'map_effect' }>;
    expect(check.roll?.dc).toBe(15);
    expect(check.roll?.success).toBe(true);
    const hit = r.events.find((e) => e.type === 'map_effect' && e.rule === 'fall' && e.damage) as Extract<BattleEvent, { type: 'map_effect' }>;
    const rolled = (hit.damage?.rolls ?? []).reduce((n, x) => n + x, 0);
    expect(hit.damage?.raw).toBe(Math.floor(rolled / 2));
  });
  it('tepkisi harcanmışsa tam hasar', () => {
    const s = scene(63);
    const used: BattleState = { ...s, combatants: { ...s.combatants, A: { ...of(s, 'A'), economy: { ...of(s, 'A').economy, reaction: true } } } };
    const r = run(used, { type: 'jump_down', actorId: 'A', to: H(8) }, () => 0.99);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const hit = r.events.find((e) => e.type === 'map_effect' && e.rule === 'fall' && e.damage) as Extract<BattleEvent, { type: 'map_effect' }>;
    expect(hit.damage?.raw).toBe((hit.damage?.rolls ?? []).reduce((n, x) => n + x, 0));
  });
  it('62: duvardan suya düşüş (komut sonu) hasarsız; 63: hasarlı', () => {
    for (const [ver, hurt] of [[62, false], [63, true]] as const) {
      const s = field([A({ hp: 40, maxHp: 40, conditions: ['Prone'] }), G()], { A: [H(8), 15], G: [H(13)] }, { ver, tiles: pool(), dikey: SUR25 });
      const cling: BattleState = { ...s, combatants: { ...s.combatants, A: { ...of(s, 'A'), climbing: true } } };
      const r = run(cling, { type: 'end_turn', actorId: 'A' }, () => 0.5);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.events.some((e) => e.type === 'map_effect' && e.rule === 'fall' && (e.damage?.applied ?? 0) > 0)).toBe(hurt);
    }
  });
});

describe('K73b düşman uçan menzilli (Görev 5)', () => {
  const scene = (ver: number) => {
    const E = mk('E', { side: 'enemies', fly: 60, attacks: SHORTBOW, hp: 20, maxHp: 20 });
    const s = field([E, A({ weaponOptions: [sword] })], { E: [H(3)], A: [H(7)] }, { ver });
    return s;
  };
  it('yerdeki yakın dövüşçünün erişiminin üstüne (10 ft) yükselir; 62\'de doğrudan saldırır', () => {
    expect(chooseCommand(scene(63))).toEqual({ type: 'vertical_move', actorId: 'E', toFt: 10 });
    expect(chooseCommand(scene(62)).type).toBe('monster_attack');
  });
});

describe('K73b replay', () => {
  it('tırmanış, atlama ve suya düşme olayları baştan oynatılınca aynı durum', () => {
    const pool = Array.from({ length: 7 }, (_, r) => Array.from({ length: 15 }, (_, c) => (c === 7 ? 's' : c === 8 && r === 3 ? 'w' : '.')).join(''));
    let s = field([A({ hp: 40, maxHp: 40 }), G()], { A: [H(6)], G: [H(13)] }, { tiles: pool, dikey: SUR25 });
    const events: BattleEvent[] = [{ type: 'battle_started', state: s } as BattleEvent];
    const step = (cmd: Command, ctx = P1) => { const r = execute(s, cmd, ctx, () => 0.9); if (!r.ok) throw new Error(r.error); s = r.state; events.push(...r.events); };
    const round = () => { step({ type: 'end_turn', actorId: 'A' }); step({ type: 'end_turn', actorId: 'G' }, { playerId: 'gm', isGm: true }); };
    step({ type: 'climb', actorId: 'A', to: H(7) });
    round();
    step({ type: 'climb', actorId: 'A', to: H(7) });
    round();
    step({ type: 'jump_down', actorId: 'A', to: H(8) });
    expect(events.some((e) => e.type === 'reaction_used')).toBe(true);
    expect(JSON.stringify(replay(events).combatants)).toBe(JSON.stringify(s.combatants));
  });
});
