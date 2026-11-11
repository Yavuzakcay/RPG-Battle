/**
 * Kuyruk K62-ACIK: K62–K67 açık maddeleri. (1) Delayed Blast Fireball boncuğu arayüzü (önizleme/komut motorla aynı),
 * (2) Wall of Ice YZ hedeflemesi (canavar saldırısı, bağışıklık, ateş), (3) Truesight YZ yolları tek sorguda,
 * (4) Magic Circle: isteyerek giriş ve ışınlanmada CHA save (sürüm 67), (5) Hallow: isteyerek girememe (sürüm 67).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { mk, P1 } from './fixtures';
import { execute, startBattle } from './index';
import { applyEvents, replay } from './reduce';
import { chooseCommand, blindChoice } from './ai';
import { setDefaultRuleVersion } from './create';
import { CURRENT_RULES } from './ruleVersion';
import { beadThrowLanding, touchableBeads } from './bead';
import { areaActCommand, areaActPreview } from '../ui/hud';
import spells69 from '../../data/spells-69.json';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command, SpellZone } from './types';

const H = (col: number, row = 3): Offset => ({ col, row });
const open = () => Array.from({ length: 7 }, () => '.'.repeat(15));
function field(parts: Combatant[], pos: Record<string, Offset>, ver = 67, turn?: string): BattleState {
  const s = startBattle('k62acik', 'l-kavurucu-s-cak', parts, () => 0.5, { kuralSurumu: ver, map: { id: 'col', variantId: 'gunduz', ruleToggles: { darkness: false, trap: false } } } as never).state;
  const combatants = { ...s.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  const order = parts.map((c) => c.id);
  return { ...s, status: 'active', order, turnIndex: turn ? order.indexOf(turn) : 0, combatants, map: { ...(s.map as NonNullable<BattleState['map']>), tiles: open(), objects: [] } };
}
const withZone = (s: BattleState, zone: SpellZone): BattleState => applyEvents(s, [{ type: 'zone_created', zone } as BattleEvent]);
const ring = (c: Offset, r = 1): Offset[] => {
  const out: Offset[] = [];
  for (let col = c.col - r - 1; col <= c.col + r + 1; col++) for (let row = c.row - r - 1; row <= c.row + r + 1; row++) {
    const dc = col - c.col, dr = row - c.row;
    if (Math.abs(dc) <= r && Math.abs(dr) <= r) out.push({ col, row });
  }
  return out;
};
const ward = (kind: 'circle' | 'hallow', hexes: Offset[], extra: Partial<SpellZone['ward']> = {}): SpellZone => ({
  id: `ward:${kind}`, spellId: kind === 'circle' ? 'magic-circle' : 'hallow', name: kind === 'circle' ? 'Magic Circle' : 'Hallow', casterId: 'P', side: 'party', dc: 0,
  slotLevel: 3, hexes, center: hexes[Math.floor(hexes.length / 2)], ward: { kind, types: ['undead', 'fiend'], ...extra } } as SpellZone);
const GM = { playerId: 'gm', isGm: true };
const run = (s: BattleState, cmd: Command, ctx = P1, rng: Rng = () => 0.5) => execute(s, cmd, ctx, rng);
const of = (s: BattleState, id: string) => s.combatants[id] as Combatant;
const BITE = [{ name: 'Claw', bonus: 6, damageDice: '2d6+3', damageType: 'slashing', repeat: 1, ranged: false, reachFt: 5, text: 'Claw' }] as never;
const mace: AttackOption = { label: 'Mace', attackBonus: 5, damage: '1d6+3', damageType: 'bludgeoning', ranged: false, spell: false, tag: 'mace' };

afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

describe('K62-ACIK 1: Delayed Blast Fireball boncuğu arayüzü', () => {
  const bead = (center: Offset): SpellZone => ({ id: 'bead1', spellId: 'delayed-blast-fireball', name: 'Delayed Blast Fireball', casterId: 'W', side: 'enemies', dc: 10,
    slotLevel: 7, hexes: ring(center), center, bead: { until: 99, throwFt: 40 }, dealt: 2 } as SpellZone);
  const scene = () => withZone(field([mk('A', { ownerId: 'p1', saves: { str: 0, dex: 20, con: 0, int: 0, wis: 0, cha: 0 } }), mk('W', { side: 'enemies', concentration: { spell: 'Delayed Blast Fireball', slotLevel: 7, turn: '0:0' } }), mk('E', { side: 'enemies' })],
    { A: H(3), W: H(0, 0), E: H(10) }), bead(H(4)));
  it('bitişikteki boncuk dokunulabilir; uzaktaki değil', () => {
    const s = scene();
    expect(touchableBeads(s, of(s, 'A')).map((z) => z.id)).toEqual(['bead1']);
    const far = { ...s, combatants: { ...s.combatants, A: { ...of(s, 'A'), pos: H(0) } } };
    expect(touchableBeads(far, of(far, 'A'))).toEqual([]);
    expect(areaActPreview(far, of(far, 'A'), { kind: 'bead', zoneId: 'bead1' }, H(9)).error).toMatch(/yanında/);
  });
  it('önizleme motorun inişiyle aynı: yaratığa çarpınca orada; küredeki düşman sayılır', () => {
    const s = scene();
    const pv = areaActPreview(s, of(s, 'A'), { kind: 'bead', zoneId: 'bead1' }, H(12));
    const land = beadThrowLanding(s, of(s, 'A'), s.map?.zones?.find((z) => z.id === 'bead1') as SpellZone, H(12));
    expect([land.land, land.hit]).toEqual([H(10), true]);
    expect([pv.error, pv.foes.map((c) => c.id)]).toEqual([null, ['E']]);
    const cmd = areaActCommand('A', { kind: 'bead', zoneId: 'bead1' }, H(12));
    expect(cmd).toEqual({ type: 'spell_followup', actorId: 'A', targetId: 'bead1', targetHex: H(12), choice: 'bead' });
    const r = run(s, cmd, P1, () => 0.99);
    expect(r.ok).toBe(true);
    // Çarpınca büyü biter ve boncuk patlar (komut sonunda): alan kalkar.
    expect(r.ok && r.state.map?.zones?.some((z) => z.id === 'bead1')).toBe(false);
  });
  it('yalnız dokunma: nişansız komut DEX save atar, boncuk yerinde kalır (başarı)', () => {
    const s = scene();
    const r = run(s, areaActCommand('A', { kind: 'bead', zoneId: 'bead1' }, null), P1, () => 0.99);
    expect(r.ok && r.state.map?.zones?.find((z) => z.id === 'bead1')?.center).toEqual(H(4));
  });
});

describe('K62-ACIK 2: Wall of Ice YZ hedeflemesi', () => {
  // Parti duvarı (Wall of Ice paneli) düşmanın yolunu kesiyor; düşman canavar saldırısıyla panele vurur.
  const wallHexes = Array.from({ length: 7 }, (_, r) => H(6, r));
  // Dökümde saklanan sürümlü kural (K62 `zone.spec`: panel AC 12 / 30 HP, Cold bağışık, Fire iki kat).
  const ice = (): SpellZone => ({ id: 'ice', spellId: 'wall-of-ice', name: 'Wall of Ice', casterId: 'A', side: 'party', dc: 15, slotLevel: 6, hexes: wallHexes,
    spec: (spells69.find((x) => x.id === 'wall-of-ice') as { mechanics: { k62: { zone: unknown } } }).mechanics.k62.zone } as SpellZone);
  const scene = (attacks: unknown, weaponOptions: AttackOption[] = []) => withZone(field([mk('A', { ownerId: 'p1' }), mk('M', { side: 'enemies', speed: 30, attacks: attacks as never, weaponOptions })], { A: H(2), M: H(7) }, 67, 'M'), ice());
  it('canavar saldırısıyla bitişik panele saldırır (önceden yalnız silah seçenekleri deneniyordu)', () => {
    const cmd = chooseCommand(scene(BITE));
    expect(cmd).toMatchObject({ type: 'attack_object', actorId: 'M', option: { label: 'Claw', damage: '2d6+3' } });
    expect((cmd as { objectId: string }).objectId.startsWith('wall:')).toBe(true);
  });
  it('bağışık türle (soğuk) vurmaz; ateş seçeneği varsa onu seçer (iki kat)', () => {
    const cold = [{ ...(BITE as unknown as object[])[0], name: 'Frost Bite', damageType: 'cold', damageDice: '4d6' }];
    expect(chooseCommand(scene(cold))).not.toMatchObject({ type: 'attack_object' });
    const fire = [...(BITE as unknown as object[]), { ...(BITE as unknown as object[])[0], name: 'Fire Touch', damageType: 'fire', damageDice: '1d10' }];
    expect(chooseCommand(scene(fire))).toMatchObject({ type: 'attack_object', option: { label: 'Fire Touch' } });
    expect(chooseCommand(scene([], [mace]))).toMatchObject({ type: 'attack_object', option: { label: 'Mace' } });
  });
});

describe('K62-ACIK 3: Truesight YZ yolları tek sorguda', () => {
  it('Blindness seçimi: True Seeing etkisindeki hedefe Deafened (önceden ham duyuya bakıyordu)', () => {
    const caster = mk('C', { side: 'enemies', spellNames: ['Blindness/Deafness'], spellSlots: [4, 3, 2] as never, spellSaveDc: 14, spellMod: 3, casterTag: 'wizard' });
    const seer = mk('S', { ownerId: 'p1', hp: 40, maxHp: 40, effects: [{ id: 'true-seeing', name: 'True Seeing', sourceId: 'S', until: 99, truesight: 120 }] });
    const plain = mk('S', { ownerId: 'p1', hp: 40, maxHp: 40 });
    const choice = (t: Combatant) => (blindChoice(field([caster, t], { C: H(8), S: H(3) }, 67, 'C'), caster) as { choice?: string } | null)?.choice;
    expect(choice(seer)).toBe('Deafened');
    expect(choice(plain)).toBe('Blinded');
  });
});

describe('K62-ACIK 4–5: Magic Circle ve Hallow (sürüm 67)', () => {
  const circleHexes = ring(H(9));
  const undead = (p: Partial<Combatant> = {}) => mk('U', { side: 'enemies', creatureType: 'undead', speed: 30, attacks: BITE, ...p });
  const base = (ver: number, kind: 'circle' | 'hallow' = 'circle', extra = {}, u = undead()) =>
    withZone(field([mk('P', { ownerId: 'p1', spellSaveDc: 15 }), u], { P: H(9), U: H(5) }, ver, 'U'), ward(kind, circleHexes, extra));
  it('seçilen tür silindire yürüyerek giremez (67); 66\'da girer', () => {
    expect(run(base(67), { type: 'move', actorId: 'U', to: H(8) }, GM)).toMatchObject({ ok: false });
    expect(run(base(66), { type: 'move', actorId: 'U', to: H(8) }, GM).ok).toBe(true);
    // Seçilmeyen tür girer.
    const beast = withZone(field([mk('P', { ownerId: 'p1' }), mk('U', { side: 'enemies', creatureType: 'beast', speed: 30 })], { P: H(9), U: H(5) }, 67, 'U'), ward('circle', circleHexes));
    expect(run(beast, { type: 'move', actorId: 'U', to: H(8) }, GM).ok).toBe(true);
  });
  it('atlayarak da giremez; ters yönde içeriden çıkamaz', () => {
    const jumper = (ver: number) => { const s = base(ver, 'circle', {}, undead({ strScore: 18 })); return { ...s, combatants: { ...s.combatants, U: { ...of(s, 'U'), pos: H(9, 0) } } }; };
    expect(run(jumper(67), { type: 'jump', actorId: 'U', to: H(9, 2) }, GM)).toMatchObject({ ok: false, error: expect.stringContaining('isteyerek giremez') });
    expect(run(jumper(66), { type: 'jump', actorId: 'U', to: H(9, 2) }, GM).ok).toBe(true);
    const inside = { ...base(67, 'circle', { reverse: true }), combatants: { ...base(67, 'circle', { reverse: true }).combatants, U: { ...of(base(67), 'U'), pos: H(9, 2) } } };
    expect(run(inside, { type: 'move', actorId: 'U', to: H(9, 5) }, GM)).toMatchObject({ ok: false });
    expect(run(inside, { type: 'move', actorId: 'U', to: H(9, 4) }, GM).ok).toBe(true);
  });
  it('Hallow: seçilen tür alana isteyerek giremez (67)', () => {
    expect(run(base(67, 'hallow'), { type: 'move', actorId: 'U', to: H(8) }, GM)).toMatchObject({ ok: false });
    expect(run(base(66, 'hallow'), { type: 'move', actorId: 'U', to: H(8) }, GM).ok).toBe(true);
  });
  it('ışınlanarak giriş: CHA save; başarısızlıkta geri döner, başarıda kalır; 66\'da save yok', () => {
    const tele = (ver: number, cha: number) => {
      const s = base(ver, 'circle', {}, undead({ spellNames: ['Misty Step'], spellSlots: [4, 3] as never, spellMod: 3, casterTag: 'wizard', saves: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha } }));
      return run(s, { type: 'cast_spell', actorId: 'U', spellName: 'Misty Step', targetHex: H(9, 2) }, GM, () => 0.5);
    };
    const fail = tele(67, -10);
    expect(fail.ok && [of(fail.state, 'U').pos, fail.events.some((e) => e.type === 'map_effect' && (e as { rule?: string }).rule === 'magicCircle')]).toEqual([H(5), true]);
    const pass = tele(67, 20);
    expect(pass.ok && of(pass.state, 'U').pos).toEqual(H(9, 2));
    const old = tele(66, -10);
    expect(old.ok && [of(old.state, 'U').pos, old.events.some((e) => e.type === 'map_effect' && (e as { rule?: string }).rule === 'magicCircle')]).toEqual([H(9, 2), false]);
  });
  it('replay: geri döndürülen ışınlanma aynı durumu verir', () => {
    const s = base(67, 'circle', {}, undead({ spellNames: ['Misty Step'], spellSlots: [4, 3] as never, spellMod: 3, casterTag: 'wizard', saves: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: -10 } }));
    const r = run(s, { type: 'cast_spell', actorId: 'U', spellName: 'Misty Step', targetHex: H(9, 2) }, GM);
    if (!r.ok) throw new Error(r.error);
    expect(JSON.stringify(replay([{ type: 'battle_started', state: s } as BattleEvent, ...r.events]).combatants)).toBe(JSON.stringify(r.state.combatants));
  });
});
