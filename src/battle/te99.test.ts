/**
 * Görev TE99 (kural sürümü 99): tür, feat ve eşya denetimi düzeltmeleri (harita/belgeler/TUR-FEAT-ESYA-DENETIM.md
 * "Düzeltme durumu"; SRD 5.2.1). 98 ve altı eski davranış.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { combatantFromSheet, setDefaultRuleVersion, startBattle } from './create';
import { execute } from './commands';
import { effectiveAc, wardSources } from './divine';
import { profileIn } from './zones';
import { itemHitsFor } from './itemEffects';
import { applyEvents, replay } from './reduce';
import { moveCostFn } from './movement';
import { damageProfile } from './common';
import { SHIELD, armor, items } from '../data';
import { advancementProblems, casterCtx, sheetFeats } from '../rules/advancement';
import { magicInitiateAll, otherSkillMax } from '../rules/backgrounds';
import type { ReactionAnswer, ReactionRequest } from '../rules/reactionChoice';
import { CURRENT_RULES } from './ruleVersion';
import { TE99_VERSION } from './te99Surum';
import { P1, mk, scripted } from './fixtures';
import { timerEvents } from './durations';
import { saveVs } from './te99Surum';
import { attackConditions } from './riders';
import { applyBattleResult, withStatus } from '../app/partyStatus';
import { currentStatus, fullStatus, longRestStatus, shortRestStatus } from '../rules/characterRest';
import { blankCharacter, characterIssues, newCharacter, suggestedScores, type SavedCharacter } from '../rules/builder';
import { seededRng } from '../rules/dice';
import type { CharacterSheet } from '../rules/stats';
import type { BattleState, Combatant } from './types';

const NEW = TE99_VERSION;
const OLD = TE99_VERSION - 1;
afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

const sheet = (patch: Partial<CharacterSheet> = {}): CharacterSheet => ({
  ...blankCharacter('te').sheet, name: 'Deneme', classId: 'fighter', level: 5, baseScores: suggestedScores('fighter'), weapons: [{ name: 'Longsword' }], ...patch,
});
const saved = (s: CharacterSheet, status?: SavedCharacter['status']): SavedCharacter => ({ ...blankCharacter('te'), id: 'ch1', sheet: s, ...(status ? { status } : {}) });
const start = (v: number, c: Combatant): BattleState =>
  startBattle('te', 'd', [c, mk('T', { side: 'enemies', hp: 40, maxHp: 40 })], () => 0.5, { kuralSurumu: v, map: { id: 'col' } } as never).state;
const fighter = (ch: SavedCharacter): Combatant => withStatus(combatantFromSheet(ch.sheet, { id: 'A', ownerId: ch.id }), ch);
const finish = (s: BattleState, patch: Partial<Combatant>): BattleState =>
  ({ ...s, status: 'finished', combatants: { ...s.combatants, A: { ...(s.combatants.A as Combatant), ...patch } } });

describe('TE99-1 savaşlar arası kaynak taşıma (D33, T44)', () => {
  it('yüklü eşya: yük karakterde kalır, ikinci savaş harcanmış yükle başlar (eskiden yüksüzdü)', () => {
    const ch = saved(sheet({ itemNames: ['Wand of Magic Missiles'] }), fullStatus(sheet({ itemNames: ['Wand of Magic Missiles'] })));
    const s1 = start(NEW, fighter(ch));
    expect(s1.combatants.A?.resources['item:wand-of-magic-missiles']).toBe(7);
    const [after] = applyBattleResult([ch], finish(s1, { resources: { ...(s1.combatants.A as Combatant).resources, 'item:wand-of-magic-missiles': 4 } }));
    expect(after?.status?.resources['item:wand-of-magic-missiles']).toBe(4);
    const s2 = start(NEW, fighter(after as SavedCharacter));
    expect(s2.combatants.A?.resources['item:wand-of-magic-missiles']).toBe(4);
  });
  it('yenilenme veriden: uzun dinlenme 1d6+1 (en çok 7), kısa dinlenme değiştirmez; tek kullanımlık eşya dolmaz', () => {
    const sh = sheet({ itemNames: ['Wand of Magic Missiles', 'Bead of Force'] });
    const st = { ...fullStatus(sh), resources: { ...fullStatus(sh).resources, 'item:wand-of-magic-missiles': 0, 'item:bead-of-force': 0 } };
    expect(shortRestStatus(sh, st, 0, () => 0.5).status.resources['item:wand-of-magic-missiles']).toBe(0);
    const long = longRestStatus(sh, st, seededRng(3));
    const w = long.resources['item:wand-of-magic-missiles'] ?? -1;
    expect(w).toBeGreaterThanOrEqual(2);
    expect(w).toBeLessThanOrEqual(7);
    expect(long.resources['item:bead-of-force']).toBe(0);
    // rng verilmezse durumdan tohumlu (tekrarlanabilir).
    expect(longRestStatus(sh, st).resources['item:wand-of-magic-missiles']).toBe(longRestStatus(sh, st).resources['item:wand-of-magic-missiles']);
    // "all": Eyes of Charming her şafakta bütün yükler.
    const e = sheet({ itemNames: ['Eyes of Charming'] });
    expect(longRestStatus(e, { ...fullStatus(e), resources: { ...fullStatus(e).resources, 'item:eyes-of-charming': 0 } }).resources['item:eyes-of-charming']).toBe(3);
  });
  it('eski kayıt (durumda eşya kaynağı yok): eşya dolu gelir', () => {
    const sh = sheet({ itemNames: ['Wand of Fireballs'] });
    const st = fullStatus(sheet());
    expect(currentStatus(sh, st).resources['item:wand-of-fireballs']).toBe(7);
  });
  it('tür kaynakları (99): Relentless Endurance savaş başında dolmaz, uzun dinlenmede dolar; Adrenaline Rush kısa dinlenmede', () => {
    const sh = sheet({ raceId: 'orc' });
    const full = fullStatus(sh);
    expect(full.resources.relentlessEndurance).toBe(1);
    expect(full.resources.adrenalineRush).toBe(3);
    const ch = saved(sh, full);
    const s1 = start(NEW, fighter(ch));
    const [after] = applyBattleResult([ch], finish(s1, { resources: { ...(s1.combatants.A as Combatant).resources, relentlessEndurance: 0, adrenalineRush: 1 } }));
    expect(after?.status?.resources).toMatchObject({ relentlessEndurance: 0, adrenalineRush: 1 });
    const s2 = start(NEW, fighter(after as SavedCharacter));
    expect(s2.combatants.A?.resources).toMatchObject({ relentlessEndurance: 0, adrenalineRush: 1 });
    // 98: eski davranış (savaş başında dolu).
    expect(start(OLD, fighter(after as SavedCharacter)).combatants.A?.resources).toMatchObject({ relentlessEndurance: 1, adrenalineRush: 3 });
    const short = shortRestStatus(sh, after?.status, 0, () => 0.5).status;
    expect(short.resources).toMatchObject({ relentlessEndurance: 0, adrenalineRush: 3 });
    expect(longRestStatus(sh, short).resources.relentlessEndurance).toBe(1);
  });
  it('Human Heroic Inspiration, Dwarf Stonecunning, Dragonborn/Goliath 5+ kaynakları durumda', () => {
    expect(fullStatus(sheet({ raceId: 'human' })).resources.heroicInspiration).toBe(1);
    expect(fullStatus(sheet({ raceId: 'dwarf' })).resources.stonecunning).toBe(3);
    expect(fullStatus(sheet({ raceId: 'dragonborn' })).resources.draconicFlight).toBe(1);
    expect(fullStatus(sheet({ raceId: 'dragonborn', level: 4 })).resources.draconicFlight).toBeUndefined();
    expect(fullStatus(sheet({ raceId: 'goliath' })).resources.largeForm).toBe(1);
  });
});

describe('TE99-2 tür save avantajları bütün save yollarında (T9, T16, T32)', () => {
  const withTimer = (v: number, raceId: string, condition: string): BattleState => {
    const s = start(v, combatantFromSheet(sheet({ raceId }), { id: 'A', ownerId: 'p1' }));
    const a = s.combatants.A as Combatant;
    return { ...s, status: 'active', combatants: { ...s.combatants, A: { ...a, conditions: [...a.conditions, condition],
      conditionTimers: [{ condition, ownerId: 'A', end: 'turnEnd', count: 10, label: 'Deneme', save: { ability: 'con', dc: 15 } }] } } };
  };
  for (const [race, cond] of [['dwarf', 'Poisoned'], ['elf', 'Charmed'], ['halfling', 'Frightened']] as const) {
    it(`${race}: ${cond} tur sonu tekrar save'i 99'da avantajlı (2 → 19), 98'de değil`, () => {
      const r99 = timerEvents(withTimer(NEW, race, cond), 'A', 'turnEnd', scripted([20, 2], [20, 19]));
      expect(r99.find((e) => e.type === 'condition_save')).toMatchObject({ success: true });
      const r98 = timerEvents(withTimer(OLD, race, cond), 'A', 'turnEnd', scripted([20, 2], [20, 19]));
      expect(r98.find((e) => e.type === 'condition_save')).toMatchObject({ success: false });
    });
  }
  it('Human (avantaj yok) 99\'da da yeniden atmaz', () => {
    const s = withTimer(NEW, 'human', 'Poisoned');
    const noHeroic = { ...s, combatants: { ...s.combatants, A: { ...(s.combatants.A as Combatant), resources: { ...(s.combatants.A as Combatant).resources, heroicInspiration: 0 } } } };
    const r = timerEvents(noHeroic, 'A', 'turnEnd', scripted([20, 2], [20, 19]));
    expect(r.find((e) => e.type === 'condition_save')).toMatchObject({ success: false });
  });
  it('saveVs: işaretsiz (98) savaşçıda boş, işaretlide durum listesi', () => {
    expect(saveVs({}, ['Poisoned'])).toEqual({});
    expect(saveVs({ te99: true }, ['Poisoned', undefined, 'Poisoned'])).toEqual({ against: ['Poisoned'] });
    expect(attackConditions('chuul', 'Paralyzing Tentacles')).toContain('Paralyzed');
  });
});

/** Savaşçı A (3,3) sırada, düşman T (4,3) bitişik; sürüm `v`. */
function arena(v: number, c: Combatant, foe: Partial<Combatant> = {}): BattleState {
  const s0 = start(v, c);
  return { ...s0, kuralSurumu: v, status: 'active', turnIndex: s0.order.indexOf('A'), map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) },
    combatants: { ...s0.combatants, A: { ...(s0.combatants.A as Combatant), pos: { col: 3, row: 3 } }, T: { ...(s0.combatants.T as Combatant), pos: { col: 4, row: 3 }, ...foe } } };
}
const fromSheet = (sh: CharacterSheet) => combatantFromSheet(sh, { id: 'A', ownerId: 'p1' });

describe('TE99-3 kalkan + Two-Handed (S20, Z31)', () => {
  const sh = sheet({ shield: true, weapons: [{ name: 'Greatsword' }, { name: 'Longbow' }, { name: 'Longsword' }] });
  it('99: kalkanla Greatsword/Longbow seçeneği yok (nedeni arayüzde), Longsword var; komut reddedilir', () => {
    const s = arena(NEW, fromSheet(sh));
    const a = s.combatants.A as Combatant;
    expect(a.weaponOptions.map((o) => o.weaponId)).toEqual(expect.arrayContaining(['longsword']));
    expect(a.weaponOptions.some((o) => o.weaponId === 'greatsword' || o.weaponId === 'longbow')).toBe(false);
    expect(a.shieldBlocked?.map((o) => o.weaponId).sort()).toEqual(['greatsword', 'longbow']);
    const option = a.shieldBlocked?.[0] as NonNullable<Combatant['shieldBlocked']>[number];
    const r = execute(s, { type: 'attack', actorId: 'A', targetId: 'T', option }, P1, () => 0.5);
    expect(r.ok).toBe(false);
  });
  it('98: eski davranış (kalkanla Greatsword saldırısı serbest)', () => {
    const s = arena(OLD, fromSheet(sh));
    const option = (s.combatants.A as Combatant).weaponOptions.find((o) => o.weaponId === 'greatsword');
    expect(option).toBeDefined();
    expect(execute(s, { type: 'attack', actorId: 'A', targetId: 'T', option: option! }, P1, () => 0.5).ok).toBe(true);
  });
  it('kalkansız Greatsword serbest', () => {
    const s = arena(NEW, fromSheet(sheet({ weapons: [{ name: 'Greatsword' }] })));
    expect((s.combatants.A as Combatant).weaponOptions.some((o) => o.weaponId === 'greatsword')).toBe(true);
  });
});

describe('TE99-4 Mage Armor tabanı kalkan/eşya bonusunu yutmaz (Z25)', () => {
  const armored = (v: number, sh: CharacterSheet) => {
    const s = arena(v, fromSheet(sh));
    const a = s.combatants.A as Combatant;
    return { s, a: { ...a, effects: [...(a.effects ?? []), { id: 'mage-armor', name: 'Mage Armor', sourceId: 'A', acMin: 13 + a.modifiers.dex, acBase: 13 + a.modifiers.dex }] } };
  };
  it('zırhsız kalkanlı Fighter (DEX +3): 99 → 13 + 3 + 2 = 18; 98 → 16', () => {
    const sh = sheet({ armorName: 'Zırhsız', shield: true, baseScores: { str: 10, dex: 16, con: 14, int: 10, wis: 10, cha: 10 } });
    const n = armored(NEW, sh);
    expect(n.a.ac).toBe(15);
    expect(effectiveAc(n.s, n.a)).toBe(18);
    const o = armored(OLD, sh);
    expect(effectiveAc(o.s, o.a)).toBe(16);
  });
  it('Ring of Protection (+1): 13 + DEX + 1; Barkskin (acMin) toplamın tabanı kalır', () => {
    const sh = sheet({ classId: 'wizard', armorName: 'Zırhsız', itemNames: ['Ring of Protection'], baseScores: { str: 10, dex: 16, con: 14, int: 16, wis: 10, cha: 10 } });
    const n = armored(NEW, sh);
    expect(effectiveAc(n.s, n.a)).toBe(17);
    const bark = { ...n.a, effects: [...(n.a.effects ?? []), { id: 'barkskin', name: 'Barkskin', sourceId: 'A', acMin: 17 }] };
    expect(effectiveAc(n.s, { ...bark, effects: bark.effects.filter((e) => e.id !== 'mage-armor') })).toBe(17);
  });
});

describe('TE99-5 eğitimsiz zırh (SRD 5.2.1 s. 92: STR/DEX D20 Testleri, büyü yok)', () => {
  const wiz = sheet({ classId: 'wizard', armorName: 'Leather Armor', weapons: [{ name: 'Dagger' }], baseScores: { str: 10, dex: 14, con: 14, int: 16, wis: 10, cha: 10 } });
  it('inisiyatif 99\'da dezavantajlı (iki zar), 98\'de tek zar', () => {
    const count = (v: number) => { let n = 0; start(v, fromSheet(wiz)); const rng = () => { n += 1; return 0.5; }; startBattle('te', 'd', [fromSheet(wiz)], rng, { kuralSurumu: v, map: { id: 'col' } } as never); return n; };
    expect(count(NEW)).toBe(count(OLD) + 1);
  });
  it('Gizlen 99\'da dezavantajlı', () => {
    for (const [v, mode] of [[NEW, 'disadvantage'], [OLD, 'normal']] as const) {
      const s = arena(v, fromSheet(wiz), { pos: { col: 10, row: 5 } });
      const r = execute(s, { type: 'hide', actorId: 'A' }, P1, () => 0.5);
      if (!r.ok) throw new Error(r.error);
      expect(r.events.find((e) => e.type === 'hide_attempted')).toMatchObject({ mode });
    }
  });
  it('saldırı dezavantajı STR/DEX silahta; büyü saldırısı/pact (STR/DEX değil) 99\'da yok', () => {
    const s = arena(NEW, fromSheet(wiz));
    const a = s.combatants.A as Combatant;
    expect(wardSources(s, a, s.combatants.T as Combatant, { melee: true }).some((x) => x.reason === 'Eğitimsiz zırh')).toBe(true);
    expect(wardSources(s, a, s.combatants.T as Combatant, { melee: true, notStrDex: true }).some((x) => x.reason === 'Eğitimsiz zırh')).toBe(false);
    const o = arena(OLD, fromSheet(wiz));
    expect(wardSources(o, o.combatants.A as Combatant, o.combatants.T as Combatant, { melee: true, notStrDex: true }).some((x) => x.reason === 'Eğitimsiz zırh')).toBe(true);
  });
});

describe('TE99-6 feat hizalamaları (F20, F31, F33/F34)', () => {
  it('Savage Attacker 99\'da Unarmed Strike\'ta tetiklenmez (98\'de tetiklenir)', () => {
    const sh = sheet({ backgroundId: 'soldier', backgroundBonuses: { str: 2, con: 1 } });
    for (const [v, used] of [[NEW, false], [OLD, true]] as const) {
      const s = arena(v, fromSheet(sh));
      const option = (s.combatants.A as Combatant).weaponOptions.find((o) => o.weaponId === 'unarmed-strike');
      expect(option).toBeDefined();
      const r = execute(s, { type: 'attack', actorId: 'A', targetId: 'T', option: option! }, P1, () => 0.99);
      if (!r.ok) throw new Error(r.error);
      const ev = r.events.find((e) => e.type === 'attack_resolved') as { savage?: unknown } | undefined;
      expect(!!ev?.savage).toBe(used);
    }
  });
  it('Blink Steps 99\'da yalnız Attack ya da Magic eyleminden sonra (Dodge sonrası değil)', () => {
    const blinker = () => mk('A', { ownerId: 'p1', traits: ['blink-steps'], resources: { blinkSteps: 1 },
      features: [{ key: 'feat:blink-steps', name: 'Blink Steps', type: 'free', resource: 'blinkSteps', effect: { kind: 'blinkStep', rangeFt: 30 } }] });
    const blink = (st: BattleState) => execute(st, { type: 'use_feature', actorId: 'A', feature: 'feat:blink-steps', to: { col: 1, row: 1 } }, P1, () => 0.5);
    for (const [v, ok] of [[NEW, false], [OLD, true]] as const) {
      const d = execute(arena(v, blinker()), { type: 'dodge', actorId: 'A' }, P1, () => 0.5);
      if (!d.ok) throw new Error(d.error);
      const b = blink(d.state);
      expect(b.ok, b.ok ? '' : b.error).toBe(ok);
    }
  });
  it('Irresistible Offense: büyü hasarında da B/P/S direnci yok sayılır (profileIn kaynağıyla), 98\'de yalnız silahta', () => {
    const boon = mk('A', { ownerId: 'p1', traits: ['overcome-defenses'], k19Traits: true });
    const foe = mk('T', { side: 'enemies', resistances: ['piercing', 'fire'] });
    const s = arena(NEW, boon);
    expect(profileIn(s, foe, true, boon).resistances).toEqual(['fire']);
    expect(profileIn({ ...s, kuralSurumu: OLD }, foe, true, boon).resistances).toEqual(['piercing', 'fire']);
  });
});

describe('TE99-7 eşya bağları ve iksirler (D6, D7, D27, D29, D30)', () => {
  it('Ammunition, +1 yalnız cephaneli silaha (99); 98\'de yakın dövüşe de', () => {
    const ws = [{ name: 'Longsword' }, { name: 'Longbow' }];
    const at = (v: number, id: string, names: string[]) => (start(v, fromSheet(sheet({ itemNames: names, weapons: ws }))).combatants.A as Combatant).weaponOptions.find((o) => o.weaponId === id)?.attackBonus ?? 0;
    expect(at(NEW, 'longsword', ['Ammunition, +1'])).toBe(at(NEW, 'longsword', []));
    expect(at(NEW, 'longbow', ['Ammunition, +1'])).toBe(at(NEW, 'longbow', []) + 1);
    expect(at(OLD, 'longsword', ['Ammunition, +1'])).toBe(at(OLD, 'longsword', []) + 1);
  });
  it('Javelin of Lightning: 99\'da ek 4d6 yok, Javelin\'e Lightning türü; Ammunition of Slaying yalnız cephaneli silahta', () => {
    const sh = sheet({ itemNames: ['Javelin of Lightning', 'Ammunition of Slaying'], weapons: [{ name: 'Javelin' }, { name: 'Longbow' }, { name: 'Longsword' }] });
    const a = start(NEW, fromSheet(sh)).combatants.A as Combatant;
    const foe = mk('T', { side: 'enemies', creatureType: 'humanoid' });
    const bow = a.weaponOptions.find((o) => o.weaponId === 'longbow') as Combatant['weaponOptions'][number];
    const sword = a.weaponOptions.find((o) => o.weaponId === 'longsword') as Combatant['weaponOptions'][number];
    expect(itemHitsFor(a, bow, foe).map((h) => h.label)).toEqual(['Ammunition of Slaying']);
    expect(itemHitsFor(a, sword, foe)).toEqual([]);
    expect(a.weaponOptions.filter((o) => o.weaponId === 'javelin').every((o) => o.altDamageType === 'lightning')).toBe(true);
    const old = start(OLD, fromSheet(sh)).combatants.A as Combatant;
    expect(itemHitsFor(old, old.weaponOptions.find((o) => o.weaponId === 'longbow') as Combatant['weaponOptions'][number], foe).length).toBe(2);
  });
  const drink = (v: number, itemId: string, rng: () => number = () => 0.5) =>
    execute(arena(v, mk('A', { ownerId: 'p1', hp: 40, maxHp: 40, consumables: { [itemId]: 1 } })), { type: 'use_item', actorId: 'A', itemId, targetId: 'A' }, P1, rng);
  it('Potion of Poison: başarılı save\'de de tam hasar (99); 98\'de yarı', () => {
    const dmg = (v: number) => {
      const r = drink(v, 'potion-of-poison', scripted([20, 20], [6, 6], [6, 6], [6, 6], [6, 6]));
      if (!r.ok) throw new Error(r.error);
      return (r.events.find((e) => e.type === 'effect_tick') as { appliedDamage: number } | undefined)?.appliedDamage;
    };
    expect(dmg(NEW)).toBe(24);
    expect(dmg(OLD)).toBe(12);
  });
  it('Potion of Speed bitince 99\'da uyuşukluk yok, 98\'de var', () => {
    for (const [v, lethargy] of [[NEW, false], [OLD, true]] as const) {
      const r = drink(v, 'potion-of-speed');
      if (!r.ok) throw new Error(r.error);
      const fx = (r.state.combatants.A as Combatant).effects?.find((e) => e.id === 'item:potion-of-speed');
      expect(fx?.lethargy).toBe(true);
      const ended = applyEvents(r.state, [{ type: 'effect_ended', targetId: 'A', effectId: 'item:potion-of-speed', name: 'Potion of Speed', reason: 'süre' } as never]);
      expect((ended.combatants.A as Combatant).effects?.some((e) => e.id.endsWith('/lethargy')) ?? false).toBe(lethargy);
    }
  });
});

describe('TE99-13 doğrulanmayan iki satır (F25, D9)', () => {
  it('Grappler Fast Wrestler: kendi boyundakini sürüklemek ek hareket istemez, büyüğü ister', () => {
    for (const [size, wrestler, cost] of [['M', true, 1], ['M', false, 2], ['L', true, 2]] as const) {
      const s = arena(NEW, mk('A', { ownerId: 'p1', size: 'M', ...(wrestler ? { traits: ['grappler'] } : {}) }), { grapple: { by: 'A', escapeDc: 13, restrained: false }, size });
      expect(moveCostFn(s, s.combatants.A as Combatant)({ col: 2, row: 3 }, { col: 3, row: 3 }), `${size} ${wrestler}`).toBe(cost);
    }
  });
  it('44 içecek/yağ etkisi (use.kind: effect) kendine kullanılır, etki ya da hasar uygulanır, replay aynı', () => {
    const effectItems = items.filter((i) => i.use?.kind === 'effect');
    expect(effectItems.length).toBe(44);
    for (const it of effectItems) {
      const base = arena(NEW, mk('A', { ownerId: 'p1', hp: 60, maxHp: 60, consumables: { [it.id]: 1 } }));
      const r = execute(base, { type: 'use_item', actorId: 'A', itemId: it.id, targetId: 'A' }, P1, () => 0.5);
      if (!r.ok) throw new Error(`${it.name}: ${r.error}`);
      const added = r.events.find((e) => e.type === 'effect_added') as { effect: Record<string, unknown> } | undefined;
      const tick = r.events.find((e) => e.type === 'effect_tick' || e.type === 'temp_hp');
      expect(!!(added || tick), it.name).toBe(true);
      if (added) {
        const { id: _i, name: _n, sourceId: _s, until: _u, ...mech } = added.effect;
        expect(Object.keys(mech).length, `${it.name}: mekanik alanı yok`).toBeGreaterThan(0);
        expect(Number(added.effect.until), it.name).toBeGreaterThanOrEqual(base.round);
      }
      expect((r.state.combatants.A as Combatant).consumables?.[it.id] ?? 0, it.name).toBe(0);
      expect(replay([{ type: 'battle_started', state: base }, ...r.events]), it.name).toEqual(r.state);
    }
  });
  it('Potion of Resistance (fire) ateşe direnç verir', () => {
    const id = items.find((i) => i.name === 'Potion of Resistance (fire)')?.id as string;
    const r = execute(arena(NEW, mk('A', { ownerId: 'p1', consumables: { [id]: 1 } })), { type: 'use_item', actorId: 'A', itemId: id, targetId: 'A' }, P1, () => 0.5);
    if (!r.ok) throw new Error(r.error);
    expect(damageProfile(r.state.combatants.A as Combatant).resistances).toContain('fire');
  });
});

describe('TE99-8/9 oluşturucu (Versatile, tür becerisi, Fighting Style, Spell Recall, soy büyüsü yeteneği)', () => {
  it('Human Versatile ikinci köken feat\'i sheetFeats\'e girer; Human olmayanda yok sayılır; geçmişle aynı tekrarsız feat sorun', () => {
    expect(sheetFeats({ raceId: 'human', backgroundId: 'soldier', speciesFeat: 'alert' })).toEqual(['savage-attacker', 'alert']);
    expect(sheetFeats({ raceId: 'dwarf', backgroundId: 'soldier', speciesFeat: 'alert' })).toEqual(['savage-attacker']);
    const dup = advancementProblems({ classId: 'fighter', level: 1, raceId: 'human', backgroundId: 'soldier', speciesFeat: 'savage-attacker' }, { scores: suggestedScores('fighter'), casterClass: false });
    expect(dup.join(' ')).toContain('bir kez');
    // Magic Initiate listeyle: Versatile kaynağı.
    expect(magicInitiateAll({ raceId: 'human', backgroundId: 'soldier', speciesFeat: 'magic-initiate@wizard' }).map((x) => [x.source, x.list])).toEqual([['species', 'wizard']]);
  });
  it('tür becerisi yalnız Human (1) ve Elf (1, listeli); diğerleri geçmişle 0, geçmişsiz eski kayıt 3', () => {
    expect(otherSkillMax({ raceId: 'human', backgroundId: 'soldier' })).toBe(1);
    expect(otherSkillMax({ raceId: 'elf', backgroundId: 'soldier' })).toBe(1);
    expect(otherSkillMax({ raceId: 'dwarf', backgroundId: 'soldier' })).toBe(0);
    expect(otherSkillMax({ raceId: 'dwarf' })).toBe(3);
    const elf = { ...newCharacter('e'), classSkills: ['athletics', 'perception'] as never, otherSkills: ['history'] as never };
    const issues = characterIssues({ ...elf, sheet: { ...elf.sheet, raceId: 'elf', lineageId: 'drow' } }).map((x) => x.text).join(' ');
    expect(issues).toContain('Insight');
  });
  it('Boon of Spell Recall: Warlock (Pact Magic) ön koşulu tutmaz, Wizard tutar; Fighting Style yuvası olan sınıf hasStyle', () => {
    expect(casterCtx('warlock', 19).casterClass).toBe(false);
    expect(casterCtx('wizard', 19).casterClass).toBe(true);
    expect(casterCtx('fighter', 4).hasStyle).toBe(true);
    expect(casterCtx('rogue', 4).hasStyle).toBe(false);
  });
  it('soy büyüsü yeteneği seçilirse o kullanılır (Drow Faerie Fire WIS → DC 8 + PB + WIS)', () => {
    const sh = sheet({ raceId: 'elf', lineageId: 'drow', level: 3, lineageAbility: 'wis', baseScores: { str: 15, dex: 13, con: 14, int: 8, wis: 16, cha: 10 } });
    const c = fromSheet(sh);
    expect(c.spellStats?.['Faerie Fire']).toEqual({ dc: 8 + c.proficiency + c.modifiers.wis, attack: c.proficiency + c.modifiers.wis });
  });
  it('geçmiş bonusu zorunlu (geçmiş seçiliyse); yeni karakter önerilen +2/+1 ile başlar', () => {
    const c = newCharacter('n');
    expect(Object.values(c.sheet.backgroundBonuses ?? {}).sort()).toEqual([1, 2]);
    const empty = characterIssues({ ...c, sheet: { ...c.sheet, backgroundBonuses: {} } }).map((x) => x.text).join(' ');
    expect(empty).toContain('yetenek artışını dağıt');
    const legacy = characterIssues({ ...c, sheet: { ...c.sheet, backgroundId: undefined, backgroundBonuses: {} } }).map((x) => x.text).join(' ');
    expect(legacy).not.toContain('yetenek artışını dağıt');
  });
  it('kalkan verisi data/armor.json\'da (davranış aynı: +2), zırh listesinde görünmez', () => {
    expect(SHIELD.baseAc).toBe(2);
    expect(armor.some((a) => (a as { type: string }).type === 'shield')).toBe(false);
  });
});

describe('TE99-10 silah/donanım hizalamaları (S14, S26, S32, D12)', () => {
  it('Loading silah başına: 99\'da aynı eylemde iki ayrı Loading silahı ateşlenir, aynısı ikinci kez değil', () => {
    const lc = { label: 'Light crossbow', attackBonus: 5, damage: '1d8+3', damageType: 'piercing', ranged: true, spell: false, tag: 'x', weaponId: 'light-crossbow', loading: true, range: [80, 320] as [number, number] };
    const hc = { ...lc, label: 'Hand crossbow', weaponId: 'hand-crossbow', damage: '1d6+3', range: [30, 120] as [number, number] };
    for (const [v, second] of [[NEW, true], [OLD, false]] as const) {
      const s = arena(v, mk('A', { ownerId: 'p1', attacksPerAction: 2 }), { pos: { col: 6, row: 3 } });
      const r1 = execute(s, { type: 'attack', actorId: 'A', targetId: 'T', option: lc }, P1, () => 0.5);
      if (!r1.ok) throw new Error(r1.error);
      expect(execute(r1.state, { type: 'attack', actorId: 'A', targetId: 'T', option: lc }, P1, () => 0.5).ok).toBe(false);
      expect(execute(r1.state, { type: 'attack', actorId: 'A', targetId: 'T', option: hc }, P1, () => 0.5).ok).toBe(second);
    }
  });
  it('doğaçlama silah 99\'da 1d4 (Zincir 1d6 → 1d4); gerçek silah eşdeğeri (Kılıç) zarını korur', () => {
    for (const [kind, v, dmg] of [['chain', NEW, '1d4'], ['chain', OLD, '1d6'], ['sword', NEW, '1d8']] as const) {
      const s0 = arena(v, mk('A', { ownerId: 'p1', modifiers: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 } }));
      const s = { ...s0, map: { ...(s0.map as NonNullable<BattleState['map']>), objects: [{ id: 'o1', kind, at: { col: 3, row: 4 } }] } } as BattleState;
      const r = execute(s, { type: 'object_use', actorId: 'A', objectId: 'o1', action: 'take' }, P1, () => 0.5);
      if (!r.ok) throw new Error(r.error);
      const opt = (r.state.combatants.A as Combatant).weaponOptions.find((o) => o.weaponId === 'improvised');
      expect(opt?.damage, `${kind} ${v}`).toBe(dmg);
    }
  });
  it('Alchemist\'s Fire 99\'da tur başı save\'le sönmez; eylemle Prone olup söner', () => {
    const burning = { id: 'item:alchemists-fire:B', name: "Alchemist's Fire", sourceId: 'B', ongoing: { dice: '1d4', type: 'fire', save: 'dex' as const, dc: 10, noSave: true, extinguish: true } };
    const s = arena(NEW, mk('A', { ownerId: 'p1', effects: [burning] }));
    const r = execute(s, { type: 'escape', actorId: 'A' }, P1, () => 0.5);
    if (!r.ok) throw new Error(r.error);
    const a = r.state.combatants.A as Combatant;
    expect(a.conditions).toContain('Prone');
    expect(a.effects?.some((e) => e.id === burning.id)).toBe(false);
    expect(a.economy.action).toBe(true);
  });
});

describe('TE99-11/12 karar soruları ve Thieves\' Tools', () => {
  it('Heroic Inspiration 99\'da sorulur (boon); "kullanma" denirse yeniden atılmaz', () => {
    const s = arena(NEW, mk('A', { ownerId: 'p1', traits: ['resourceful'], resources: { heroicInspiration: 1 } }));
    const seen: ReactionRequest[] = [];
    const rng = Object.assign(scripted([20, 2], [20, 19]), { react: (q: ReactionRequest): ReactionAnswer => { seen.push(q); return q.trigger === 'boon' ? null : q.suggested ?? null; } });
    const swing = { label: 'Kılıç', attackBonus: 3, damage: '1d8+3', damageType: 'slashing', ranged: false, spell: false, tag: 'x' };
    const r = execute(s, { type: 'attack', actorId: 'A', targetId: 'T', option: swing }, P1, rng);
    if (!r.ok) throw new Error(r.error);
    expect(seen.some((q) => q.trigger === 'boon')).toBe(true);
    expect((r.state.combatants.A as Combatant).resources.heroicInspiration).toBe(1);
  });
  it('kancasız Rng (yapay zekâ, simülasyon) 99\'da da kullanır', () => {
    const s = arena(NEW, mk('A', { ownerId: 'p1', traits: ['resourceful'], resources: { heroicInspiration: 1 } }));
    const swing = { label: 'Kılıç', attackBonus: 3, damage: '1d8+3', damageType: 'slashing', ranged: false, spell: false, tag: 'x' };
    const r = execute(s, { type: 'attack', actorId: 'A', targetId: 'T', option: swing }, P1, scripted([20, 2], [20, 19], [8, 4]));
    if (!r.ok) throw new Error(r.error);
    expect((r.state.combatants.A as Combatant).resources.heroicInspiration).toBe(0);
  });
  it('Thieves\' Tools: 99\'da aletsiz kilit açılamaz; Rogue (alet yetkin) DEX + PB, Sleight of Hand yetkinse avantaj', () => {
    const door = (v: number, c: Combatant) => {
      const s0 = arena(v, c);
      return { ...s0, map: { ...(s0.map as NonNullable<BattleState['map']>), objects: [{ id: 'd1', kind: 'door', at: { col: 3, row: 4 }, state: 'locked' }] } } as BattleState;
    };
    const plain = fromSheet(sheet());
    expect(execute(door(NEW, plain), { type: 'object_use', actorId: 'A', objectId: 'd1', action: 'unlock' }, P1, () => 0.5).ok).toBe(false);
    expect(execute(door(OLD, plain), { type: 'object_use', actorId: 'A', objectId: 'd1', action: 'unlock' }, P1, () => 0.5).ok).toBe(true);
    const rogue = fromSheet(sheet({ classId: 'rogue', baseScores: suggestedScores('rogue') }));
    expect(rogue.toolProfs).toContain('thieves-tools');
    const r = execute(door(NEW, { ...rogue, skills: { ...rogue.skills, sleightOfHand: 5 } }), { type: 'object_use', actorId: 'A', objectId: 'd1', action: 'unlock' }, P1, scripted([20, 3], [20, 18]));
    if (!r.ok) throw new Error(r.error);
    const ev = r.events.find((e) => e.type === 'object_changed') as { check?: { d20: number; total: number } } | undefined;
    expect(ev?.check?.d20).toBe(18);
    expect(ev?.check?.total).toBe(18 + rogue.modifiers.dex + rogue.proficiency);
  });
  it('Giant Ancestry 99\'da sorulur ve turda bir sınırı yok', () => {
    const g = mk('A', { ownerId: 'p1', giant: 'fire', resources: { giantAncestry: 3 }, attacksPerAction: 2 });
    const s = arena(NEW, g);
    const swing = { label: 'Kılıç', attackBonus: 30, damage: '1d8+3', damageType: 'slashing', ranged: false, spell: false, tag: 'x' };
    const r1 = execute(s, { type: 'attack', actorId: 'A', targetId: 'T', option: swing }, P1, () => 0.5);
    if (!r1.ok) throw new Error(r1.error);
    const r2 = execute(r1.state, { type: 'attack', actorId: 'A', targetId: 'T', option: swing }, P1, () => 0.5);
    if (!r2.ok) throw new Error(r2.error);
    expect((r2.state.combatants.A as Combatant).resources.giantAncestry).toBe(1);
    const seen: string[] = [];
    const ask = Object.assign(() => 0.5, { react: (q: ReactionRequest): ReactionAnswer => { seen.push(q.trigger); return null; } });
    const r3 = execute(s, { type: 'attack', actorId: 'A', targetId: 'T', option: swing }, P1, ask);
    if (!r3.ok) throw new Error(r3.error);
    expect(seen).toContain('giant');
    expect((r3.state.combatants.A as Combatant).resources.giantAncestry).toBe(3);
  });
});
