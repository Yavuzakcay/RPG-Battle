/** Görev B93 (kural sürümü 93), aşama E: Sorcerer denetim düzeltmeleri (SORCERER-DENETIM.md). */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet } from './create';
import { arena, Run } from './b93fixtures';
import { P1, mk } from './fixtures';
import { innateFor } from './sorcerer';
import { spellTargets } from '../ui/hud';
import { applyBattleResult } from '../app/partyStatus';
import { blankCharacter, suggestedScores } from '../rules/builder';
import { currentStatus, fontOfMagicStatus, fullStatus, longRestStatus } from '../rules/characterRest';
import type { CharacterSheet } from '../rules/stats';
import type { BattleState, Combatant, Command } from './types';

const o = (col: number, row: number) => ({ col, row });
const MM = { careful: 1, distant: 1, empowered: 1, extended: 1, heightened: 2, quickened: 2, seeking: 1, subtle: 1, transmuted: 1, twinned: 1 };
const sorc = (p: Partial<Combatant> = {}) => mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, spellSlots: [4, 3, 2, 0, 0, 0, 0, 0, 0], spellSaveDc: 15, spellAttack: 30, spellMod: 4, level: 5,
  resources: { sorceryPoints: 10, innateSorcery: 2 }, resourceCap: { sorceryPoints: 10 }, metamagic: MM,
  modifiers: { str: 0, dex: 2, con: 1, int: 0, wis: 0, cha: 4 }, spellNames: ['Fire Bolt', 'Magic Missile', 'Hold Person', 'Burning Hands', 'Chromatic Orb'], ...p });
const sheet = (level: number, patch: Partial<CharacterSheet> = {}): CharacterSheet => ({
  ...blankCharacter('s').sheet, name: 'Ejder', classId: 'sorcerer', subclassId: 'draconic-sorcery', level, baseScores: suggestedScores('sorcerer'),
  metamagic: ['quickened', 'twinned'], spellNames: ['Fire Bolt', 'Burning Hands'], ...patch,
});
const tryRun = (r: Run, cmd: Command) => execute(r.state, cmd, P1, () => 0.5);

describe('Quickened Spell kısıtı (s. 67)', () => {
  it('1+ seviye büyüden sonra Quickened yok; Quickened\'dan sonra 1+ seviye büyü yok (93); 92\'de serbest', () => {
    for (const rules of [93, 92]) {
      const a = arena(sorc(), [['B', {}, o(5, 3)]], { rules });
      a.do({ type: 'cast_spell', actorId: 'A', spellName: 'Magic Missile', targetId: 'B' });
      expect(tryRun(a, { type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetId: 'B', metamagic: ['quickened'] }).ok).toBe(rules === 92);
      const b = arena(sorc(), [['B', {}, o(5, 3)]], { rules });
      b.do({ type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetId: 'B', metamagic: ['quickened'] });
      expect(tryRun(b, { type: 'cast_spell', actorId: 'A', spellName: 'Magic Missile', targetId: 'B' }).ok).toBe(rules === 92);
    }
  });
});

describe('Extended, Distant, Empowered kapsamı', () => {
  it('Extended süresi 1 dakika+ olan bütün büyülerde (Hold Person) ve konsantrasyon save avantajı (93)', () => {
    const r = arena(sorc(), [['B', {}, o(5, 3)]]);
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Hold Person', targetId: 'B', metamagic: ['extended'] });
    expect(r.c('A').effects?.some((e) => e.concAdv && e.concentration === 'Hold Person')).toBe(true);
    const old = arena(sorc(), [['B', {}, o(5, 3)]], { rules: 92 });
    expect(tryRun(old, { type: 'cast_spell', actorId: 'A', spellName: 'Hold Person', targetId: 'B', metamagic: ['extended'] }).ok).toBe(false);
  });
  it('Distant: hedef seçici motorun iki kat menzilini kullanır; kendinden çıkan alanda reddedilir; Empowered hasarsızda reddedilir', () => {
    // Hold Person 60 ft; B 14 altıgen (70 ft) uzakta: Distant ile 120 ft.
    const far = arena(sorc(), [['B', {}, o(3 + 14, 3)]]);
    const st: BattleState = { ...far.state, map: { ...far.state.map!, tiles: Array.from({ length: 7 }, () => '.'.repeat(30)) } };
    expect(spellTargets(st, 'A', 'Hold Person')).not.toContain('B');
    expect(spellTargets(st, 'A', 'Hold Person', ['distant'])).toContain('B');
    const near = arena(sorc(), [['B', {}, o(4, 3)]]);
    expect(tryRun(near, { type: 'cast_spell', actorId: 'A', spellName: 'Burning Hands', targetHex: o(4, 3), metamagic: ['distant'] }).ok).toBe(false);
    expect(tryRun(near, { type: 'cast_spell', actorId: 'A', spellName: 'Hold Person', targetId: 'B', metamagic: ['empowered'] }).ok).toBe(false);
  });
});

describe('Innate Sorcery ↔ Draconic Spells (kullanıcı onayı)', () => {
  it('her zaman hazır Draconic büyüleri Sorcerer büyüsü: Innate etkinken DC +1 ve avantaj (93)', () => {
    const c = combatantFromSheet(sheet(3), { id: 'A', ownerId: 'p1' });
    expect(c.classSpellsAlways).toEqual(expect.arrayContaining(['Command', 'Chromatic Orb']));
    const r = arena({ ...c, pos: o(3, 3) }, [['B', {}, o(5, 3)]]);
    const on = { ...r.state, round: 1, combatants: { ...r.state.combatants, A: { ...r.c('A'), effects: [{ id: 'sorcerer:innate-sorcery', name: 'Innate Sorcery', sourceId: 'A', until: 10 }] } } };
    expect(innateFor(on, on.combatants.A!, 'Command')).toBe(true);
    expect(innateFor({ ...on, kuralSurumu: 92 }, on.combatants.A!, 'Command')).toBe(false);
  });
});

describe('Font of Magic: yaratılan slot ve savaş dışı kullanım', () => {
  it('yaratılan slot savaş sonunda kalır (tablonun üstünde de), uzun dinlenmede kaybolur; savaş dışında slot ↔ puan', () => {
    const sh = sheet(5);
    const full = fullStatus(sh);
    const ch = { ...blankCharacter('p1'), id: 'p1', sheet: sh, status: full };
    const r = arena({ ...combatantFromSheet(sh, { id: 'A', ownerId: 'p1' }), pos: o(3, 3) }, [['B', {}, o(5, 3)]]);
    r.do({ type: 'font_of_magic', actorId: 'A', mode: 'toSlot', level: 1 });
    const fin: BattleState = { ...r.state, status: 'finished' };
    const after = applyBattleResult([ch], fin)[0]!.status!;
    expect(after.slots[0]).toBe((full.slots[0] ?? 0) + 1);
    expect(currentStatus(sh, after).slots[0]).toBe((full.slots[0] ?? 0) + 1);
    expect(longRestStatus(sh, after).slots[0]).toBe(full.slots[0]);
    const spent = { ...full, resources: { ...full.resources, sorceryPoints: 1 } };
    expect(fontOfMagicStatus(sh, spent, 'toPoints', 2)?.resources.sorceryPoints).toBe(3);
    expect(fontOfMagicStatus(sh, full, 'toSlot', 1)?.slots[0]).toBe((full.slots[0] ?? 0) + 1);
  });
});

describe('Yapay zekâ Metamagic (93)', () => {
  it('saldırı büyüsüne Seeking, hasar büyüsüne Empowered ekler (puan yedeği varken)', async () => {
    const { chooseCommand } = await import('./ai');
    const r = arena(sorc({ ownerId: undefined, side: 'party', spellNames: ['Chromatic Orb'], spellSlots: [4, 0, 0, 0, 0, 0, 0, 0, 0] }), [['B', {}, o(6, 3)]]);
    const cmd = chooseCommand(r.state);
    expect(cmd.type).toBe('cast_spell');
    if (cmd.type === 'cast_spell') expect(cmd.metamagic ?? []).toEqual(expect.arrayContaining(['seeking', 'empowered']));
  });
});
