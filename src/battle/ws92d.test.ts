/**
 * Görev WS92 aşama 4: Serüven ve kurulum akışı. Kurulumda "biçimde başla" (92+; Wild Shape kullanımı harcanır), Serüven'de
 * biçim listesi (boş yere ekleme her zaman, dolu listede uzun dinlenmeden sonra bir değişim; SRD s. 42 "Known Forms"),
 * savaş sonunda biçim biter (karaktere asıl HP ve kullanım yazılır, geçici HP yazılmaz).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, setDefaultRuleVersion, startBattle } from './create';
import { replay } from './reduce';
import { P1, mk } from './fixtures';
import { WS92_VERSION } from './ws92Surum';
import { CURRENT_RULES } from './ruleVersion';
import { applyBattleResult, withStatus } from '../app/partyStatus';
import { fullStatus } from '../rules/characterRest';
import { blankCharacter, suggestedScores, type SavedCharacter } from '../rules/builder';
import { executeSeruven, formSwapReady, memberForms, type SeruvenState } from '../journey/seruven';
import type { CharacterSheet } from '../rules/stats';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const NEW = WS92_VERSION;
const OLD = WS92_VERSION - 1;
afterEach(() => setDefaultRuleVersion(CURRENT_RULES));
const sheet = (forms: string[], patch: Partial<CharacterSheet> = {}): CharacterSheet => ({
  ...blankCharacter('d').sheet, name: 'Ayla', classId: 'druid', subclassId: 'circle-of-the-land', level: 4, baseScores: suggestedScores('druid'),
  wildShapeForms: forms, ...patch,
});

function setupState(v: number): BattleState {
  const d = combatantFromSheet(sheet(['wolf', 'crocodile']), { id: 'A', ownerId: 'p1' });
  const s0 = startBattle('ws92d', 'd', [d, mk('T', { side: 'enemies' })], () => 0.5, { kuralSurumu: v, map: { id: 'col' } } as never).state;
  return { ...s0, combatants: { ...s0.combatants, A: { ...(s0.combatants.A as Combatant), pos: { col: 3, row: 3 } } } };
}

describe('WS92-4 kurulumda biçimde başla', () => {
  it('kurulumda Wild Shape: biçim, geçici HP, kullanım düşer (92); 91 reddedilir; kurulumda çıkış yok', () => {
    const s = setupState(NEW);
    expect(s.status).toBe('setup');
    const left = s.combatants.A!.resources.wildShape ?? 0;
    const r = execute(s, { type: 'wild_shape', actorId: 'A', form: 'wolf' } as Command, P1, () => 0.5);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const a = r.state.combatants.A as Combatant;
    expect(a.shape?.form).toBe('wolf');
    expect(a.tempHp).toBe(4);
    expect(a.resources.wildShape).toBe(left - 1);
    expect(replay([{ type: 'battle_started', state: s }, ...r.events] as BattleEvent[])).toEqual(r.state);
    expect(execute(r.state, { type: 'wild_shape', actorId: 'A' } as Command, P1, () => 0.5).ok).toBe(false);
    expect(execute(setupState(OLD), { type: 'wild_shape', actorId: 'A', form: 'wolf' } as Command, P1, () => 0.5).ok).toBe(false);
  });
});

describe('WS92-4 savaş sonunda biçim biter', () => {
  it('biçimdeki druidin asıl HP ve kullanımı yazılır; geçici HP ve biçim yazılmaz', () => {
    const sh = sheet(['wolf']);
    const ch: SavedCharacter = { ...blankCharacter('k1'), sheet: sh, status: fullStatus(sh) };
    const c = withStatus(combatantFromSheet(sh, { id: 'pc1', ownerId: 'k1' }), ch);
    const shaped = { ...c, hp: c.hp - 3, tempHp: 4, resources: { ...c.resources, wildShape: 1 }, shape: { form: 'wolf' } } as unknown as Combatant;
    const [after] = applyBattleResult([ch], { status: 'finished', combatants: { pc1: shaped } } as unknown as BattleState);
    expect(after?.status?.hp).toBe(c.hp - 3);
    expect(after?.status?.resources.wildShape).toBe(1);
    expect(JSON.stringify(after?.status)).not.toContain('tempHp');
    expect(JSON.stringify(after?.status)).not.toContain('shape');
  });
});

describe('WS92-4 Serüven biçim listesi (Known Forms)', () => {
  const begin = (forms: string[]): SeruvenState => {
    const r = executeSeruven(null, { type: 'start', id: 's', seed: 1, party: [{ id: 'p1', name: 'Ayla', sheet: sheet(forms) }], toggles: { irkBaslangic: false } });
    if (!r.ok) throw new Error(r.error);
    return r.state;
  };
  it('boş yere ekleme her zaman; dolu listede değişim uzun dinlenmeden sonra bir kez', () => {
    let s = begin(['wolf', 'rat', 'spider', 'crocodile', 'boar']);
    const lim = memberForms(s.party[0]!);
    expect(lim?.known).toBe(6);
    const add = executeSeruven(s, { type: 'form_swap', memberId: 'p1', from: null, to: 'mastiff' });
    expect(add.ok).toBe(true);
    if (!add.ok) return;
    s = add.state;
    expect(s.party[0]!.sheet.wildShapeForms).toContain('mastiff');
    expect(executeSeruven(s, { type: 'form_swap', memberId: 'p1', from: null, to: 'pony' }).ok).toBe(false);
    // Uzun dinlenme yok: değişim reddedilir.
    expect(formSwapReady(s, 'p1')).toBe(false);
    expect(executeSeruven(s, { type: 'form_swap', memberId: 'p1', from: 'rat', to: 'pony' }).ok).toBe(false);
    s = { ...s, rests: 1 };
    const sw = executeSeruven(s, { type: 'form_swap', memberId: 'p1', from: 'rat', to: 'pony' });
    expect(sw.ok).toBe(true);
    if (!sw.ok) return;
    expect(sw.state.party[0]!.sheet.wildShapeForms).toEqual(expect.arrayContaining(['pony', 'wolf']));
    expect(sw.state.party[0]!.sheet.wildShapeForms).not.toContain('rat');
    expect(executeSeruven(sw.state, { type: 'form_swap', memberId: 'p1', from: 'wolf', to: 'goat' }).ok).toBe(false);
    // Uygun olmayan biçim (4. seviyede uçan).
    expect(executeSeruven({ ...sw.state, rests: 2 }, { type: 'form_swap', memberId: 'p1', from: 'wolf', to: 'owl' }).ok).toBe(false);
  });
});
