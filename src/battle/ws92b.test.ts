/**
 * Görev WS92 aşama 2 (kural sürümü 92; SRD 5.2.1 s. 42–43): Wild Shape çekirdeğinin kalan satırları: biçimde eşya kaynaşır
 * (kurtarma eki düşer), Beast Spells malzeme istisnası, Wild Companion familiar'ı Fey, Wild Resurgence slotu savaş sonunda
 * karaktere yazılır, yapay zekâ en güçlü seçili biçime girer ve slot kazanınca biçimden çıkar. 91 eski davranış.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, setDefaultRuleVersion, startBattle } from './create';
import { replay } from './reduce';
import { P1, mk } from './fixtures';
import { chooseCommand } from './ai';
import { availableForms } from './druid';
import { monsters } from '../data';
import { WS92_VERSION } from './ws92Surum';
import { CURRENT_RULES } from './ruleVersion';
import { applyBattleResult, withStatus } from '../app/partyStatus';
import { fullStatus } from '../rules/characterRest';
import { blankCharacter, suggestedScores } from '../rules/builder';
import type { CharacterSheet } from '../rules/stats';
import type { SavedCharacter } from '../rules/builder';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const NEW = WS92_VERSION;
const OLD = WS92_VERSION - 1;
const ok = (r: ReturnType<typeof execute>) => { if (!r.ok) throw new Error(r.error); return r; };
afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

const sheet = (patch: Partial<CharacterSheet> = {}): CharacterSheet => ({
  ...blankCharacter('d').sheet, name: 'Ayla', classId: 'druid', subclassId: 'circle-of-the-land', level: 8, baseScores: suggestedScores('druid'), ...patch,
});
/** Druid A (3,3), düşman T (5,3); sürüm `v`, sıra A'da. */
function arena(v: number, d: Combatant, a: Partial<Combatant> = {}): BattleState {
  const s0 = startBattle('ws92b', 'd', [d, mk('T', { side: 'enemies', hp: 40, maxHp: 40 })], () => 0.5, { kuralSurumu: v, map: { id: 'col' } } as never).state;
  return { ...s0, kuralSurumu: v, status: 'active', turnIndex: s0.order.indexOf('A'), map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) },
    combatants: { ...s0.combatants, A: { ...(s0.combatants.A as Combatant), pos: { col: 3, row: 3 }, ...a }, T: { ...(s0.combatants.T as Combatant), pos: { col: 5, row: 3 } } } };
}
const freshBonus = (s: BattleState) => ({ ...s, combatants: { ...s.combatants, A: { ...(s.combatants.A as Combatant), economy: { ...(s.combatants.A as Combatant).economy, bonus: false, action: false } } } });

describe('WS92-2 Objects: eşya biçime kaynaşır (s. 43)', () => {
  it('Cloak of Protection kurtarma eki biçimde düşer (92); 91 korunur', () => {
    const d = combatantFromSheet(sheet({ itemNames: ['Cloak of Protection'], wildShapeForms: ['wolf'] }), { id: 'A', ownerId: 'p1' });
    expect(d.itemSaveBonus).toBe(1);
    const plain = combatantFromSheet(sheet({ wildShapeForms: ['wolf'] }), { id: 'A', ownerId: 'p1' });
    const n = ok(execute(arena(NEW, d), { type: 'wild_shape', actorId: 'A', form: 'wolf' } as Command, P1, () => 0.5));
    const p = ok(execute(arena(NEW, plain), { type: 'wild_shape', actorId: 'A', form: 'wolf' } as Command, P1, () => 0.5));
    expect(n.state.combatants.A?.saves).toEqual(p.state.combatants.A?.saves);
    const o = ok(execute(arena(OLD, d), { type: 'wild_shape', actorId: 'A', form: 'wolf' } as Command, P1, () => 0.5));
    expect(o.state.combatants.A!.saves.wis).toBe(p.state.combatants.A!.saves.wis + 1);
    // Biçim bitince eşyanın eki geri gelir.
    const back = ok(execute(freshBonus(n.state), { type: 'wild_shape', actorId: 'A' } as Command, P1, () => 0.5));
    expect(back.state.combatants.A?.saves).toEqual(d.saves);
  });
});

describe('WS92-2 Beast Spells: bedelli/tükenen malzemeli büyü yok (s. 43)', () => {
  it('18. sv kurt biçiminde Stoneskin (100+ GP, tükenir) reddedilir; malzemesiz büyü yapılır; 91 eski', () => {
    const d = combatantFromSheet(sheet({ level: 18, wildShapeForms: ['wolf'] }), { id: 'A', ownerId: 'p1' });
    const withSpells = { ...d, spellNames: [...d.spellNames, 'Stoneskin', 'Cure Wounds'], spellSlots: [4, 3, 3, 3, 3, 1, 1, 1, 1] };
    const go = (v: number, spellName: string) => {
      const w = ok(execute(arena(v, withSpells), { type: 'wild_shape', actorId: 'A', form: 'wolf' } as Command, P1, () => 0.5));
      return execute(w.state, { type: 'cast_spell', actorId: 'A', spellName, targetIds: ['A'], targetId: 'A' } as Command, P1, () => 0.5);
    };
    const r = go(NEW, 'Stoneskin');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('Beast Spells');
    expect(go(NEW, 'Cure Wounds').ok).toBe(true);
    expect(go(OLD, 'Stoneskin').ok).toBe(true);
  });
});

describe('WS92-2 Wild Companion familiar Fey (s. 42)', () => {
  it('Wild Shape kullanımıyla çağrılan familiar Fey (92); 91 canavar türü', () => {
    const druid = mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, traits: ['wild-companion', 'wild-companion-only'], spellNames: ['Find Familiar'],
      spellSlots: [2, 0, 0, 0, 0, 0, 0, 0, 0], resources: { wildShape: 2 } as Combatant['resources'], spellSaveDc: 13, spellMod: 3 });
    const fam = (v: number) => {
      const r = ok(execute(arena(v, druid), { type: 'cast_spell', actorId: 'A', spellName: 'Find Familiar', targetHex: { col: 3, row: 2 }, free: true } as Command, P1, () => 0.5));
      return { r, c: Object.values(r.state.combatants).find((c) => c.summon?.spellId === 'find-familiar') as Combatant };
    };
    const n = fam(NEW);
    expect(n.c.creatureType).toBe('fey');
    expect(replay([{ type: 'battle_started', state: arena(NEW, druid) }, ...n.r.events] as BattleEvent[])).toEqual(n.r.state);
    expect(fam(OLD).c.creatureType).not.toBe('fey');
  });
});

describe('WS92-2 Wild Resurgence slotu savaş sonunda karakterde (s. 42)', () => {
  it('savaşta kazanılan 1. seviye slot (tablonun en çoğuna dek) yazılır', () => {
    const sh = sheet({ level: 5 });
    const ch: SavedCharacter = { ...blankCharacter('k1'), sheet: sh, status: { ...fullStatus(sh), slots: [0, 0, 0, 0, 0, 0, 0, 0, 0] } };
    const c = withStatus(combatantFromSheet(sh, { id: 'pc1', ownerId: 'k1' }), ch);
    const state = { status: 'finished', combatants: { pc1: { ...c, spellSlots: [1, 0, 0, 0, 0, 0, 0, 0, 0] } } } as unknown as BattleState;
    const [after] = applyBattleResult([ch], state);
    expect(after?.status?.slots[0]).toBe(1);
    // Tablonun üstüne çıkmaz.
    const over = { status: 'finished', combatants: { pc1: { ...c, spellSlots: [9, 9, 9, 0, 0, 0, 0, 0, 0] } } } as unknown as BattleState;
    expect(applyBattleResult([ch], over)[0]?.status?.slots.slice(0, 3)).toEqual(fullStatus(sh).slots.slice(0, 3));
  });
});

describe('WS92-2 yapay zekâ: en güçlü seçili biçim, slot kazanınca çıkış', () => {
  it('seçili biçimler arasında CR/HP en yükseği (veri sırası değil)', () => {
    const d = combatantFromSheet(sheet({ wildShapeForms: ['rat', 'brown-bear', 'wolf'] }), { id: 'A', ownerId: 'p1' });
    const s = arena(NEW, { ...d, spellSlots: [0, 0, 0, 0, 0, 0, 0, 0, 0] });
    const cmd = chooseCommand(s);
    expect(cmd).toMatchObject({ type: 'wild_shape', form: 'brown-bear' });
    // 91: veri sırasındaki ilk seçili biçim (en güçlü olmayabilir).
    const old = chooseCommand(arena(OLD, { ...d, spellSlots: [0, 0, 0, 0, 0, 0, 0, 0, 0] }));
    expect(old).toMatchObject({ type: 'wild_shape', form: availableForms(monsters, d, OLD)[0]?.id });
  });
  it("biçimin geçici HP'si bitmiş ve slotu olan druid bonus eylemle normal hâline döner", () => {
    const d = combatantFromSheet(sheet({ wildShapeForms: ['wolf'] }), { id: 'A', ownerId: 'p1' });
    const w = ok(execute(arena(NEW, d), { type: 'wild_shape', actorId: 'A', form: 'wolf' } as Command, P1, () => 0.5));
    const a = w.state.combatants.A as Combatant;
    const s = { ...w.state, combatants: { ...w.state.combatants, A: { ...a, tempHp: 0, spellSlots: [1, 0, 0, 0, 0, 0, 0, 0, 0], economy: { ...a.economy, bonus: false } } } };
    expect(chooseCommand(s)).toEqual({ type: 'wild_shape', actorId: 'A' });
    const keep = { ...s, combatants: { ...s.combatants, A: { ...(s.combatants.A as Combatant), tempHp: 3 } } };
    expect(chooseCommand(keep)).not.toEqual({ type: 'wild_shape', actorId: 'A' });
  });
});
