/**
 * Kuyruk K64b (kural sürümü 48, Game Master anahtarı `possession`): ele geçirme tamamlayıcıları. Magic Circle / Hallow
 * koruma alanı, "specifically target Undead" istisnası (Turn Undead, Dismissal), yapay zekânın bedeni bırakması, çok
 * altıgenli beden, bedende canavar yetenekleri. Her komutta replay denetlenir.
 */
import { describe, expect, it } from 'vitest';
import { getMonster } from '../data';
import { seededRng } from '../rules/dice';
import { blankCharacter, suggestedScores } from '../rules/builder';
import type { CharacterSheet } from '../rules/stats';
import { chooseCommand } from './ai';
import { gap } from './body';
import { combatantFromMonster, combatantFromSheet } from './create';
import { wardSources } from './divine';
import { GM, mk, P1 } from './fixtures';
import { execute, replay } from './index';
import { field } from './k19spells.test';
import { possessedEffect } from './possession';
import { applyEvents } from './reduce';
import type { BattleEvent, BattleState, Combatant, Command, CommandContext, SpellZone } from './types';

const LOW = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };
const ghost = (): Combatant => ({ ...combatantFromMonster(getMonster('ghost'), { id: 'G' }), side: 'enemies', ownerId: null });
const host = (p: Partial<Combatant> = {}) => mk('H', { ownerId: 'p1', hp: 40, maxHp: 40, ac: 17, speed: 25, saves: LOW, ...p });
const ally = (p: Partial<Combatant> = {}) => mk('P', { ownerId: 'p1', hp: 40, maxHp: 40, ...p });
const POS = { G: { col: 5, row: 3 }, H: { col: 6, row: 3 }, P: { col: 7, row: 3 } };

function go(s: BattleState, cmd: Command, ctx: CommandContext = GM, seed = 3) {
  const r = execute(s, cmd, ctx, seededRng(seed));
  if (!r.ok) throw new Error(r.error);
  expect(replay([{ type: 'battle_started', state: s }, ...r.events] as BattleEvent[])).toEqual(r.state);
  return r;
}
const tryRun = (s: BattleState, cmd: Command, ctx: CommandContext = GM) => execute(s, cmd, ctx, seededRng(3));
const turnOf = (s: BattleState, id: string): BattleState => ({ ...s, turnIndex: s.order.indexOf(id) });
const possIdx = (s: BattleState) => (s.combatants.G as Combatant).attacks.findIndex((a) => a.name === 'Possession');
const possess = (s: BattleState): Command => ({ type: 'monster_attack', actorId: 'G', targetId: 'H', attackIndex: possIdx(s) });
const setup = (ver = 48, parts: Combatant[] = [ghost(), host(), ally()], pos: Record<string, { col: number; row: number }> = POS) => field(parts, pos, ver);
const possessed = (s = setup()) => go(s, possess(s)).state;
const at = (s: BattleState, id: string, p: { col: number; row: number }): BattleState => ({ ...s, combatants: { ...s.combatants, [id]: { ...(s.combatants[id] as Combatant), pos: p } } });
const zone = (kind: 'circle' | 'hallow', center: { col: number; row: number }, r: number, extra: Partial<SpellZone> = {}): BattleEvent => {
  const hexes = [];
  for (let c = center.col - r; c <= center.col + r; c++) for (let w = center.row - r; w <= center.row + r; w++) if (Math.max(Math.abs(c - center.col), Math.abs(w - center.row)) <= r) hexes.push({ col: c, row: w });
  return { type: 'zone_created', zone: { id: `ward:${kind}`, spellId: kind === 'circle' ? 'magic-circle' : 'hallow', name: kind === 'circle' ? 'Magic Circle' : 'Hallow', casterId: 'P', side: 'party', dc: 0, slotLevel: 3, hexes, center,
    ward: { kind, types: ['celestial', 'elemental', 'fey', 'fiend', 'undead'], ...(kind === 'hallow' ? { types: ['aberration', 'celestial', 'elemental', 'fey', 'fiend', 'undead'] } : {}) }, ...extra } as SpellZone };
};
const withZone = (s: BattleState, z: BattleEvent) => applyEvents(s, [z]);
const fear = (s: BattleState): BattleState => applyEvents(s, [{ type: 'effect_added', targetId: 'H', effect: { id: 'fear-g', name: 'Korku', sourceId: 'G', until: 99, grants: ['Frightened'] } }]);

describe('K64b koruma alanı: kurulumda yapım', () => {
  const wiz = (names: string[], slots = [4, 3, 3, 3, 3, 0, 0, 0, 0]) => ally({ spellNames: names, spellSlots: slots, spellSaveDc: 15 });
  it('Magic Circle kurulumda: 10 ft silindir, beş tür, 3. seviye slot; sürüm 47\'de kurulmaz', () => {
    const s = { ...setup(48, [ghost(), host(), wiz(['Magic Circle'])]), status: 'setup' as const };
    const r = go(s, { type: 'cast_spell', actorId: 'P', spellName: 'Magic Circle' }, P1);
    const z = r.state.map?.zones?.find((x) => x.ward);
    expect(z?.ward).toMatchObject({ kind: 'circle', types: ['celestial', 'elemental', 'fey', 'fiend', 'undead'] });
    expect(z?.hexes.length).toBe(19);
    expect(r.state.combatants.P?.spellSlots[2]).toBe(2);
    const rev = go(s, { type: 'cast_spell', actorId: 'P', spellName: 'Magic Circle', choice: 'ters;tur=undead' }, P1);
    expect(rev.state.map?.zones?.find((x) => x.ward)?.ward).toEqual({ kind: 'circle', types: ['undead'], reverse: true });
    const old = { ...setup(47, [ghost(), host(), wiz(['Magic Circle'])]), status: 'setup' as const };
    expect(tryRun(old, { type: 'cast_spell', actorId: 'P', spellName: 'Magic Circle' }, P1).ok).toBe(false);
  });
  it('Hallow kurulumda: varsayılan 30 ft, "r=60" ile 60 ft, altı tür; savaşta yapılamaz (savaş dışı)', () => {
    const s = { ...setup(48, [ghost(), host(), wiz(['Hallow'])]), status: 'setup' as const };
    const r = go(s, { type: 'cast_spell', actorId: 'P', spellName: 'Hallow' }, P1);
    const z = r.state.map?.zones?.find((x) => x.ward);
    expect(z?.ward?.kind).toBe('hallow'); expect(z?.ward?.types).toHaveLength(6); expect(z?.until).toBeUndefined();
    const big = go(s, { type: 'cast_spell', actorId: 'P', spellName: 'Hallow', choice: 'r=60' }, P1).state.map?.zones?.find((x) => x.ward);
    expect((big?.hexes.length ?? 0)).toBeGreaterThan(z?.hexes.length ?? 0);
    const war = tryRun(turnOf(setup(48, [ghost(), host(), wiz(['Hallow'])]), 'P'), { type: 'cast_spell', actorId: 'P', spellName: 'Hallow' }, P1);
    expect(!war.ok || !war.events.some((e) => e.type === 'zone_created')).toBe(true);
  });
});

describe('K64b Magic Circle', () => {
  it('silindirdeki hedef seçilen türlerce ele geçirilemez, Charmed/Frightened almaz; dışarıdaki alır', () => {
    const s = withZone(setup(), zone('circle', POS.H, 1));
    const r = tryRun(s, possess(s));
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toMatch(/Magic Circle/);
    expect(fear(s).combatants.H?.conditions).not.toContain('Frightened');
    const out = withZone(setup(), zone('circle', { col: 12, row: 3 }, 1));
    expect(go(out, possess(out)).events.some((e) => e.type === 'possessed')).toBe(true);
    expect(fear(out).combatants.H?.conditions).toContain('Frightened');
  });
  it('seçilen türün silindirdekine saldırısı dezavantajlı; ters yönde silindirdekinin dışarıdakine', () => {
    const s = withZone(setup(), zone('circle', POS.H, 1));
    const reasons = (st: BattleState) => wardSources(st, st.combatants.G as Combatant, st.combatants.H as Combatant).map((x) => x.reason);
    expect(reasons(s)).toContain('Magic Circle');
    const rev = withZone(setup(), zone('circle', POS.G, 0, { ward: { kind: 'circle', types: ['undead'], reverse: true } }));
    expect(reasons(rev)).toContain('Magic Circle');
    expect(reasons(withZone(setup(), zone('circle', { col: 12, row: 3 }, 1)))).not.toContain('Magic Circle');
  });
  it('zaten ele geçirilmiş beden silindire girince ele geçirme sürer (SRD yalnızca yenisini engeller)', () => {
    const s = withZone(possessed(), zone('circle', { col: 7, row: 3 }, 1));
    const r = go(turnOf(s, 'H'), { type: 'end_turn', actorId: 'H' });
    expect(possessedEffect(r.state.combatants.H)?.dormant).toBeUndefined();
    expect(r.state.combatants.H?.side).toBe('enemies');
  });
});

describe('K64b Hallow', () => {
  it('alandaki bedende ele geçirme bastırılır, alandan çıkınca sürer (bitmez)', () => {
    const s = withZone(possessed(), zone('hallow', POS.H, 1));
    const r = go(turnOf(s, 'P'), { type: 'end_turn', actorId: 'P' }, P1);
    const h = r.state.combatants.H as Combatant;
    expect(possessedEffect(h)?.dormant).toBe(true);
    expect(h.side).toBe('party'); expect(h.ownerId).toBe('p1'); expect(h.conditions).not.toContain('Incapacitated'); expect(h.shape).toBeUndefined();
    expect(r.state.combatants.G?.possessing).toBe('H');
    // Beden ev sahibinin kontrolünde: dışarı yürür.
    const moved = at(r.state, 'H', { col: 10, row: 3 });
    const r2 = go(turnOf(moved, 'P'), { type: 'end_turn', actorId: 'P' }, P1);
    const h2 = r2.state.combatants.H as Combatant;
    expect(possessedEffect(h2)?.dormant).toBeUndefined();
    expect(h2.side).toBe('enemies'); expect(h2.conditions).toContain('Incapacitated'); expect(h2.shape?.possession).toBe(true);
  });
  it('bastırılmışken "Bedeni bırak" yok; Game Master bitirebilir; alandaki hedef yeniden ele geçirilemez', () => {
    const s = go(turnOf(withZone(possessed(), zone('hallow', POS.H, 1)), 'P'), { type: 'end_turn', actorId: 'P' }, P1).state;
    expect(tryRun(turnOf(s, 'H'), { type: 'possession_leave', actorId: 'H' }, P1).ok).toBe(false);
    expect(go(s, { type: 'possession_leave', actorId: 'H', gm: true }).events.some((e) => e.type === 'possession_ended')).toBe(true);
    const fresh = withZone(setup(), zone('hallow', POS.H, 1));
    expect(tryRun(fresh, possess(fresh)).ok).toBe(false);
  });
  it('bu türlerden gelen Frightened alanda bastırılır, alandan çıkınca geri gelir; başka türünki kalır', () => {
    const s = withZone(fear(setup()), zone('hallow', { col: 12, row: 3 }, 1));
    const inside = go(turnOf(at(s, 'H', { col: 12, row: 3 }), 'P'), { type: 'end_turn', actorId: 'P' }, P1).state;
    expect(inside.combatants.H?.conditions).not.toContain('Frightened');
    const back = go(turnOf(at(inside, 'H', POS.H), 'P'), { type: 'end_turn', actorId: 'P' }, P1).state;
    expect(back.combatants.H?.conditions).toContain('Frightened');
    const human = applyEvents(withZone(setup(48, [ghost(), host(), ally(), mk('K', { side: 'enemies', hp: 9, maxHp: 9 })], { ...POS, K: { col: 1, row: 1 } }), zone('hallow', POS.H, 1)),
      [{ type: 'effect_added', targetId: 'H', effect: { id: 'k', name: 'K', sourceId: 'K', until: 99, grants: ['Frightened'] } }]);
    expect(go(turnOf(human, 'P'), { type: 'end_turn', actorId: 'P' }, P1).state.combatants.H?.conditions).toContain('Frightened');
  });
});

describe('K64b "specifically target Undead"', () => {
  const sheet = (): CharacterSheet => ({ ...blankCharacter('c').sheet, name: 'Rahip', classId: 'cleric', subclassId: 'life-domain', level: 5, baseScores: suggestedScores('cleric'),
    armorName: 'Chain Shirt', weapons: [{ name: 'Mace' }], spellNames: ['Sacred Flame'] });
  const cleric = () => ({ ...combatantFromSheet(sheet(), { id: 'P', ownerId: 'p1' }), spellSaveDc: 30 });
  it('Turn Undead bedendeki Ghost\'a ulaşır; başarısızsa beden eylem yapamaz; başka hiçbir şey Ghost\'u hedefleyemez', () => {
    const s = turnOf(possessed(setup(48, [ghost(), host(), cleric()])), 'P');
    const r = go(s, { type: 'use_feature', actorId: 'P', feature: 'cleric:channel-divinity/turn-undead' }, P1, 1);
    expect(r.events.some((e) => e.type === 'save_resolved' && e.targetId === 'G')).toBe(true);
    expect(r.state.combatants.G?.conditions).toContain('Incapacitated');
    const body = turnOf(r.state, 'H');
    expect(tryRun(body, { type: 'possession_leave', actorId: 'H' }).ok).toBe(false);
    expect(chooseCommand(body).type).toBe('end_turn');
    // Sacred Flame gibi Undead'e özgü olmayan etki ulaşmaz.
    expect(tryRun(s, { type: 'cast_spell', actorId: 'P', spellName: 'Sacred Flame', targetIds: ['G'] }, P1).ok).toBe(false);
  });
  it('Dismissal (Dispel Evil and Good) bedendeki Ghost\'u sürgün eder: beden serbest, Ghost belirmez', () => {
    const s0 = possessed(setup(48, [ghost(), host(), ally({ spellSaveDc: 40 })]));
    const s = turnOf({ ...s0, combatants: { ...s0.combatants, P: { ...(s0.combatants.P as Combatant), concentration: { spell: 'Dispel Evil and Good', slotLevel: 5, turn: '' } as never } } }, 'P');
    const r = go(s, { type: 'spell_followup', actorId: 'P', targetId: 'G' } as Command, P1);
    expect(r.events.some((e) => e.type === 'exiled' && e.targetId === 'G')).toBe(true);
    expect(r.state.combatants.G).toMatchObject({ pos: null, exiled: true });
    expect(r.state.combatants.G?.offFloor).toBeUndefined();
    expect(possessedEffect(r.state.combatants.H)).toBeUndefined();
    expect(r.state.combatants.H?.side).toBe('party');
  });
});

describe('K64b yapay zekâ, çok altıgen, yetenekler', () => {
  it('yapay zekâ: can çeyreğin altına inince bedeni bırakır; dolu canda ve dostu varken bırakmaz', () => {
    const s = turnOf(possessed(setup(48, [ghost(), host(), ally(), mk('E', { side: 'enemies', hp: 20, maxHp: 20 })], { ...POS, E: { col: 1, row: 1 } })), 'H');
    expect(chooseCommand(s).type).not.toBe('possession_leave');
    const low = { ...s, combatants: { ...s.combatants, H: { ...(s.combatants.H as Combatant), hp: 8 } } };
    expect(chooseCommand(low)).toMatchObject({ type: 'possession_leave', actorId: 'H' });
  });
  it('yapay zekâ: beden düşmanların arasında tek başına (Ghost tarafında başka kimse yok, 2 bitişik düşman) bırakır', () => {
    const s = turnOf(possessed(setup(48, [ghost(), host(), ally(), mk('Q', { ownerId: 'p1', hp: 30, maxHp: 30 })], { ...POS, Q: { col: 6, row: 4 } })), 'H');
    expect(chooseCommand(s)).toMatchObject({ type: 'possession_leave' });
  });
  it('çok altıgen (Large beden): 5 ft gövdeler arası; Ghost gövdeye bitişik, gövdenin dışında belirir', () => {
    const base = { ...setup(48, [ghost(), host({ size: 'L' }), ally()], { G: { col: 1, row: 1 }, H: { col: 6, row: 3 }, P: { col: 12, row: 3 } }), multiHex: true };
    // Gövdeye bitişik (gövdeler arası 5 ft) ama merkeze 2 altıgen uzak bir yer.
    const spot = [3, 4, 5, 7, 8, 9].flatMap((c) => [1, 2, 3, 4, 5].map((r) => ({ col: c, row: r })))
      .find((h) => gap(base, { size: 'M', pos: h }, base.combatants.H as Combatant) === 1 && Math.abs(h.col - 6) + Math.abs(h.row - 3) >= 2) as { col: number; row: number };
    const big = at(base, 'G', spot);
    const r = go(big, possess(big));
    expect(r.events.some((e) => e.type === 'possessed')).toBe(true);
    const end = go(r.state, { type: 'possession_leave', actorId: 'H', gm: true }).state;
    const g = end.combatants.G as Combatant;
    expect(g.pos).not.toBeNull();
    expect(gap(end, g, end.combatants.H as Combatant)).toBe(1);
  });
  it('bedende Ghost\'un yetenekleri yok: Horrific Visage ve Possession listede değil, canavar yeteneği (Etherealness) reddedilir', () => {
    const s = possessed();
    expect((s.combatants.H as Combatant).attacks.map((a) => a.name)).toEqual(['Withering Touch']);
    expect(tryRun(turnOf(s, 'H'), { type: 'monster_ability', actorId: 'H', abilityId: 'etherealness' } as Command).ok).toBe(false);
    expect(tryRun(turnOf(s, 'G'), { type: 'monster_ability', actorId: 'G', abilityId: 'etherealness' } as Command).ok).toBe(false);
  });
  it('anahtar kapalı ve sürüm 47: koruma alanı ve Turn Undead ele geçirene ulaşmaz (ele geçirme hiç yok)', () => {
    for (const s of [setup(47), field([ghost(), host(), ally()], POS, 48, { possession: false })]) {
      const z = withZone(s, zone('circle', { col: 12, row: 3 }, 1));
      const r = go(z, possess(z));
      expect(r.events.some((e) => e.type === 'possessed')).toBe(false);
    }
  });
});
