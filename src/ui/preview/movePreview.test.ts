/**
 * Kuyruk K58 G1/G1b: oyuncu önizlemesi ve keşif modu. Kuru çalıştırma çözücüden (Y1 `preview.test.ts` olasılık
 * tutarlılığını 1000 vuruşla ayrıca sınar); burada: dost ateşi uyarısı, itme varış altıgeni, fırsat saldırısı çentiği,
 * keşfedilmemiş tepkimenin sonucu sızmaz, keşif sonrası görünür, keşif modu kapalı/Game Master her şeyi görür,
 * önizleme durumu değiştirmez (replay), ayrı profiller ayrı defter.
 */
import { describe, expect, it } from 'vitest';
import { kitArena, o } from '../../battle/k54bKit';
import { GM, P1 } from '../../battle/fixtures';
import { execute } from '../../battle/commands';
import type { AttackOption, BattleState, Combatant, Command } from '../../battle/types';
import { DEFAULT_SETTINGS, emptyStore, normalize, record, switchProfile, counts, visibleReactions, isDiscovered } from '../../app/discovery';
import { movePreview } from './movePreview';

const club: AttackOption = { label: 'Sopa', attackBonus: 5, damage: '1d6+2', damageType: 'bludgeoning', ranged: false, spell: false, tag: 'y' };
const patch = (s: BattleState, id: string, p: Partial<Combatant>): BattleState => ({ ...s, combatants: { ...s.combatants, [id]: { ...(s.combatants[id] as Combatant), ...p } } });

describe('K58 keşif defteri', () => {
  it('kayıt: ilk görülen taze, sayaç artar; bilinmeyen kimlik yok sayılır; profiller ayrı', () => {
    let s = emptyStore();
    const a = record(s, ['fireGrease', 'fireGrease', 'yok']);
    expect(a.fresh).toEqual(['fireGrease']);
    s = a.store;
    expect(isDiscovered(s, 'fireGrease')).toBe(true);
    expect(record(s, ['fireGrease']).fresh).toEqual([]);
    const other = switchProfile(s, 'ayse');
    expect(isDiscovered(other, 'fireGrease')).toBe(false);
    expect(counts(other).found).toBe(0);
    expect(counts(s).found).toBe(1);
    expect(normalize(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });
  it('görünürlük: keşif modu açık oyuncu yalnız keşfedileni görür; kapalıysa ya da Game Master her şeyi', () => {
    const s = record(emptyStore(), ['fireOil']).store;
    expect(visibleReactions(['fireOil', 'fireGrease'], s, DEFAULT_SETTINGS, false)).toEqual({ shown: ['fireOil'], hidden: ['fireGrease'] });
    expect(visibleReactions(['fireGrease'], s, { ...DEFAULT_SETTINGS, discovery: false }, false).hidden).toEqual([]);
    expect(visibleReactions(['fireGrease'], s, DEFAULT_SETTINGS, true).hidden).toEqual([]);
  });
});

describe('K58 hamle önizlemesi', () => {
  it('dost ateşi: alan büyüsü dostu da vurursa satırı dost (kırmızı uyarı)', () => {
    const r = kitArena({ cls: 'wizard', sub: 'evoker', level: 5, place: { A: o(1, 3), B: o(5, 3), C: o(5, 2) }, enemy: { hp: 200, maxHp: 200 } });
    const s = patch(r.state, 'A', { spellNames: ['Fireball'], spellSlots: [4, 3, 2, 0, 0, 0, 0, 0, 0], spellSaveDc: 15 });
    const mp = movePreview(s, { type: 'cast_spell', actorId: 'A', spellName: 'Fireball', targetHex: o(5, 3) } as Command, P1, emptyStore(), DEFAULT_SETTINGS);
    expect(mp.ok).toBe(true);
    const ally = mp.lines.find((l) => l.id === 'C');
    expect(ally?.ally).toBe(true);
    expect(ally?.damage.max).toBeGreaterThan(0);
    expect(mp.friendlyFire).toBeGreaterThan(0);
    const foe = mp.lines.find((l) => l.id === 'B');
    expect(foe?.dc).toBe(15);
    expect(foe?.saveP).toBeGreaterThan(0);
  });
  it('itme: Shove varış altıgeni önizlemede; durum değişmez', () => {
    const r = kitArena({ cls: 'fighter', sub: 'champion', level: 5, place: { A: o(3, 3), B: o(4, 3), C: o(0, 0) } });
    const before = JSON.stringify(r.state);
    const mp = movePreview(r.state, { type: 'shove', actorId: 'A', targetId: 'B', effect: 'push' } as Command, P1, emptyStore(), DEFAULT_SETTINGS);
    expect(mp.lines.find((l) => l.id === 'B')?.movedTo).toBeDefined();
    expect(JSON.stringify(r.state)).toBe(before);
  });
  it('fırsat saldırısı: terk edilen altıgen (çentik) ve beklenen hasar', () => {
    const r = kitArena({ cls: 'fighter', sub: 'champion', level: 5, place: { A: o(3, 3), B: o(4, 3), C: o(0, 0) }, enemy: { weaponOptions: [club], hp: 50, maxHp: 50 } });
    const mp = movePreview(r.state, { type: 'move', actorId: 'A', to: o(1, 3) } as Command, P1, emptyStore(), DEFAULT_SETTINGS);
    expect(mp.ok).toBe(true);
    expect(mp.opportunity.length).toBeGreaterThan(0);
    expect(mp.opportunity[0]?.attackerId).toBe('B');
    expect(mp.opportunity[0]?.at).toEqual(o(3, 3));
  });
  it('keşfedilmemiş tepkime (Alev + Gres) sonucu sızmaz; keşfedilince ve Game Master görünümünde görünür', () => {
    const r = kitArena({ cls: 'wizard', sub: 'evoker', level: 5, place: { A: o(1, 3), B: o(5, 3), C: o(0, 0) }, enemy: { hp: 200, maxHp: 200 } });
    let s = patch(r.state, 'A', { spellNames: ['Fire Bolt'], spellAttack: 30 });
    const placed = execute(s, { type: 'place_surface', kind: 'oil', hexes: [o(5, 3), o(6, 3)] } as Command, GM, () => 0.5);
    if (!placed.ok) throw new Error(placed.error);
    s = placed.state;
    const cmd = { type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetId: 'B' } as Command;
    const gm = movePreview(s, cmd, P1, emptyStore(), DEFAULT_SETTINGS, true);
    expect(gm.reactions.length).toBeGreaterThan(0);
    const row = gm.reactions[0] as string;
    const hidden = movePreview(s, cmd, P1, emptyStore(), DEFAULT_SETTINGS);
    expect(hidden.reactions).toEqual([]);
    expect(hidden.mystery).toBe(true);
    expect(JSON.stringify(hidden)).not.toContain(row);
    expect(hidden.lines.find((l) => l.id === 'B')?.damage.max).toBeLessThanOrEqual(gm.lines.find((l) => l.id === 'B')?.damage.max ?? 0);
    const noHints = movePreview(s, cmd, P1, emptyStore(), { ...DEFAULT_SETTINGS, hints: false });
    expect(noHints.mystery).toBe(false);
    const known = movePreview(s, cmd, P1, record(emptyStore(), [row]).store, DEFAULT_SETTINGS);
    expect(known.reactions).toContain(row);
    const off = movePreview(s, cmd, P1, emptyStore(), { ...DEFAULT_SETTINGS, discovery: false });
    expect(off.reactions).toContain(row);
  });
});
