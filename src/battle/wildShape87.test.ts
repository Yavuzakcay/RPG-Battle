/**
 * Görev WS87 (kural sürümü 87; kullanıcı kararı 2026-11-19, SRD 5.2.1 PDF'inden doğrulandı): Druid Wild Shape ve Polymorph
 * düzeltmeleri. Seviye tablosu (s.43), D1 türleri (86) ile uygun biçimler, biçimin yüzme hızı (Game Master anahtarı
 * `bicimYuzme`), geçersiz seçili biçimlerin sayılmaması, SRD aktarımı (Wild Shape kurtarma yetkinliği / stat bloğu kurtarması,
 * Polymorph INT/WIS/CHA ve kurtarmalar biçimden) ve Barbed Devil/Medusa Multiattack seçenekleri. 86 ve altı aynen.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromMonster, combatantFromSheet, setDefaultRuleVersion, startBattle } from './create';
import { applyEvents, replay, speedHexes } from './reduce';
import { GM, P1, mk } from './fixtures';
import { blankCharacter, suggestedScores } from '../rules/builder';
import { getMonster, monsters } from '../data';
import { availableForms, eligibleForms, shapeLimits, validKnownForms, wildShapeFeature, wildShapeProblem } from './druid';
import { polymorphEvents, polymorphForms } from './polymorph';
import { bicimYuzmeOn, WS87_VERSION } from './wildShape87Surum';
import { swimSpeedAt } from './srdD1';
import { canEnterVeryDeep } from './deepWater';
import { CURRENT_RULES } from './ruleVersion';
import type { CharacterSheet } from '../rules/stats';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const drSheet = (level: number, patch: Partial<CharacterSheet> = {}): CharacterSheet => ({
  ...blankCharacter('d').sheet, name: 'Ayla', classId: 'druid', subclassId: 'circle-of-the-land', level, baseScores: suggestedScores('druid'), ...patch,
});
const druid = (level: number, patch: Partial<CharacterSheet> = {}) => combatantFromSheet(drSheet(level, patch), { id: 'A', ownerId: 'p1' });
const ids = (ms: Array<{ id: string }>) => ms.map((m) => m.id);
type ShapeEv = Extract<BattleEvent, { type: 'shape_changed' }>;
const shapeEv = (evs: BattleEvent[]) => evs.find((e): e is ShapeEv => e.type === 'shape_changed')!;

/** Düz zemin, A sütun 3; isteğe bağlı su şeridi (derin su `w`, satır 2–4). */
function arena(v: number, a: Combatant, water = false, toggles?: Record<string, boolean>, foe?: Combatant): BattleState {
  const t = foe ?? mk('T', { side: 'enemies', hp: 40, maxHp: 40 });
  const s = startBattle('ws', 'd', [a, t], () => 0.5, { kuralSurumu: v, map: { id: 'col' } } as never).state;
  const tiles = Array.from({ length: 7 }, (_, r) => (water && r >= 2 && r <= 4 ? 'w'.repeat(15) : '.'.repeat(15)));
  return { ...s, kuralSurumu: v, status: 'active', order: [a.id, t.id], turnIndex: 0,
    combatants: { ...s.combatants, [a.id]: { ...(s.combatants[a.id] as Combatant), pos: { col: 3, row: 3 } }, [t.id]: { ...(s.combatants[t.id] as Combatant), pos: { col: 12, row: 0 } } },
    map: { ...(s.map as NonNullable<BattleState['map']>), tiles, ...(toggles ? { ruleToggles: toggles } : {}) } };
}
function shape(st: BattleState, form: string) {
  const r = execute(st, { type: 'wild_shape', actorId: 'A', form } as Command, P1, () => 0.5);
  if (!r.ok) throw new Error(r.error);
  return r;
}

afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

describe('WS87: sabit', () => {
  it('güncel sürüm 87', () => {
    expect(WS87_VERSION).toBe(87);
    expect(CURRENT_RULES).toBeGreaterThanOrEqual(87);
  });
});

describe('WS87: seviye tablosu ve uygun biçimler', () => {
  it('SRD s.43: 2 → 4 biçim CR 1/4 uçuşsuz; 4 → 6, CR 1/2 uçuşsuz; 8 → 8, CR 1 uçuş serbest', () => {
    const f = wildShapeFeature(druid(2))!;
    expect(shapeLimits(f, 2)).toEqual({ known: 4, maxCr: 0.25, fly: false });
    expect(shapeLimits(f, 4)).toEqual({ known: 6, maxCr: 0.5, fly: false });
    expect(shapeLimits(f, 8)).toEqual({ known: 8, maxCr: 1, fly: true });
  });
  it('2/4/8 × uçan/yüzen: uçan yalnız 8\'de, yüzen her seviyede; sayı 86+: 40/47/69 (85: 40/47/72)', () => {
    const f = wildShapeFeature(druid(2))!;
    const at = (l: number, v: number) => eligibleForms(monsters, f, l, v);
    expect([2, 4, 8].map((l) => at(l, 87).length)).toEqual([40, 47, 69]);
    expect([2, 4, 8].map((l) => at(l, 86).length)).toEqual([40, 47, 69]);
    expect([2, 4, 8].map((l) => at(l, 85).length)).toEqual([40, 47, 72]);
    const fly = (l: number) => at(l, 87).filter((m) => !!m.fly).length;
    const swim = (l: number) => at(l, 87).filter((m) => !!swimSpeedAt(m.id, 87)).length;
    expect([fly(2), fly(4)]).toEqual([0, 0]);
    expect(fly(8)).toBeGreaterThan(0);
    for (const l of [2, 4, 8]) expect(swim(l), String(l)).toBeGreaterThan(0);
    expect(swim(2)).toBeLessThan(swim(4));
    expect(swim(4)).toBeLessThan(swim(8));
  });
  it('Giant Eagle, Giant Owl, Death Dog Wild Shape\'te yok (D1 türü); Giant Elk CR 2; Polymorph da Beast değil sayar', () => {
    const f = wildShapeFeature(druid(8))!;
    const n87 = ids(eligibleForms(monsters, f, 8, 87)), n85 = ids(eligibleForms(monsters, f, 8, 85));
    for (const id of ['giant-eagle', 'giant-owl', 'death-dog']) { expect(n87).not.toContain(id); expect(n85).toContain(id); }
    expect(n87).not.toContain('giant-elk');
    const t = { ...mk('T'), level: 20 } as Combatant;
    expect(ids(polymorphForms(t, 87))).not.toContain('giant-eagle');
  });
});

describe('WS87: geçersiz seçili biçimler', () => {
  it('seviye düşünce ya da tür düzeltmesiyle alınamayanlar sayılmaz, kayıtta kalır; 86 eskisi gibi', () => {
    const c = druid(4, { wildShapeForms: ['brown-bear', 'giant-eagle', 'wolf'] });
    expect(c.wildShapeForms).toEqual(['brown-bear', 'giant-eagle', 'wolf']);
    expect(ids(availableForms(monsters, c, 87))).toEqual(['wolf']);
    expect(ids(availableForms(monsters, c, 86))).toEqual(['wolf']);
    // Geçerli seçim kalmadıysa 87: seçimsiz gibi en güçlü 4; 86: hiç biçim yok (eski hata).
    const none = druid(2, { wildShapeForms: ['brown-bear', 'giant-eagle'] });
    expect(availableForms(monsters, none, 87)).toHaveLength(4);
    expect(availableForms(monsters, none, 86)).toHaveLength(0);
    // Bilinen biçim denetimi: 87'de geçersiz seçim sayılmaz (Wolf'a girilir); 86'da "bilinen biçimlerin arasında değil".
    const wolf = [getMonster('wolf')!];
    expect(wildShapeProblem(arena(87, none), none, 'wolf', wolf)).toBeNull();
    expect(wildShapeProblem(arena(86, none), none, 'wolf', wolf)).toMatch(/bilinen biçimlerin/);
    // 8. seviyede Brown Bear yeniden geçerli (seviye geri gelince); Giant Eagle tür yüzünden hiç.
    const f = wildShapeFeature(druid(8))!;
    expect(validKnownForms(['brown-bear', 'giant-eagle', 'wolf'], f, 8, 87)).toEqual(['brown-bear', 'wolf']);
    expect(validKnownForms(['brown-bear', 'giant-eagle', 'wolf'], f, 4, 87)).toEqual(['wolf']);
  });
});

describe('WS87: biçimin yüzme hızı (`bicimYuzme`)', () => {
  it('Crocodile: yüzme 30 ft biçime geçer, suda hız yüzmeden, çok derin suya girer; bırakınca gider; replay', () => {
    const st0 = arena(87, druid(5), true);
    expect(bicimYuzmeOn(st0)).toBe(true);
    const base = st0.combatants.A as Combatant;
    expect(canEnterVeryDeep(base, st0)).toBe(false);
    const r = shape(st0, 'crocodile');
    expect(shapeEv(r.events).stats?.swimFt).toBe(30);
    const a = r.state.combatants.A as Combatant;
    expect([a.swimFt, a.inWater, speedHexes(a), canEnterVeryDeep(a, r.state)]).toEqual([30, true, 6, true]);
    const off = applyEvents(r.state, [{ type: 'shape_changed', actorId: 'A', stats: null, reason: 'bıraktı' }]);
    expect(off.combatants.A?.swimFt).toBeUndefined();
    expect(off.combatants.A?.speed).toBe(base.speed);
    expect(canEnterVeryDeep(off.combatants.A as Combatant, off)).toBe(false);
    expect(replay([{ type: 'battle_started', state: st0 }, ...r.events] as BattleEvent[])).toEqual(r.state);
  });
  it('86 ve anahtar kapalı: biçimde yüzme hızı yok (olayda alan yok), çok derin suya giremez', () => {
    for (const st of [arena(86, druid(5), true), arena(87, druid(5), true, { bicimYuzme: false })]) {
      const r = shape(st, 'crocodile');
      expect('swimFt' in (shapeEv(r.events).stats ?? {})).toBe(false);
      expect(r.state.combatants.A?.swimFt).toBeUndefined();
      expect(canEnterVeryDeep(r.state.combatants.A as Combatant, r.state)).toBe(false);
    }
  });
  it('yüzmesiz biçim (Wolf) 87\'de swimFt 0 yazar, yaratık yüzmez', () => {
    const r = shape(arena(87, druid(5), true), 'wolf');
    expect(shapeEv(r.events).stats?.swimFt).toBe(0);
    expect(r.state.combatants.A?.swimFt).toBeUndefined();
  });
  it('Polymorph aynı anahtarla: Crocodile biçimindeki hedef yüzer (87), 86\'da yüzmez', () => {
    for (const [v, want] of [[87, 30], [86, undefined]] as const) {
      const st = arena(v, druid(5), true);
      const evs = polymorphEvents(st, st.combatants.T as Combatant, st.combatants.A as Combatant, 'crocodile');
      const after = applyEvents(st, evs);
      expect(after.combatants.A?.swimFt, String(v)).toBe(want);
    }
  });
});

describe('WS87: SRD aktarımı (s.43 Wild Shape, s.153 Polymorph)', () => {
  it('Wild Shape: kurtarma yetkinliği korunur, stat bloğu kurtarması yüksekse o (Crocodile CON +3); INT/WIS/CHA Druid\'in', () => {
    const d = druid(5);
    const s87 = shapeEv(shape(arena(87, d), 'crocodile').events).stats!;
    const s86 = shapeEv(shape(arena(86, d), 'crocodile').events).stats!;
    expect(s87.saves.con).toBe(3);
    expect(s86.saves.con).toBe(1);
    expect([s87.saves.int, s87.saves.wis, s87.saves.cha]).toEqual([d.saves.int, d.saves.wis, d.saves.cha]);
    expect([s87.modifiers.int, s87.modifiers.wis]).toEqual([d.modifiers.int, d.modifiers.wis]);
    // Resilient (CON) gibi Druid'in fiziksel kurtarma yetkinliği: biçimin değiştiricisine eklenir (87); 86'da düşerdi.
    const res = { ...d, saves: { ...d.saves, con: d.modifiers.con + d.proficiency } };
    const w87 = shapeEv(shape(arena(87, res), 'wolf').events).stats!;
    const w86 = shapeEv(shape(arena(86, res), 'wolf').events).stats!;
    expect(w87.saves.con).toBe(w87.modifiers.con + d.proficiency);
    expect(w86.saves.con).toBe(w86.modifiers.con);
  });
  it('Polymorph: INT/WIS/CHA ve kurtarmalar biçimin stat bloğundan (87); 86\'da hedefinkiler kalır', () => {
    const wiz = mk('A', { ownerId: 'p1', level: 9, hp: 50, maxHp: 50, modifiers: { str: 0, dex: 2, con: 1, int: 5, wis: 2, cha: 0 }, saves: { str: 0, dex: 2, con: 1, int: 9, wis: 6, cha: 0 } });
    const mod = (n: number) => Math.floor((n - 10) / 2);
    const croc = getMonster('crocodile')!;
    for (const v of [87, 86]) {
      const st = arena(v, wiz);
      const s = shapeEv(polymorphEvents(st, st.combatants.T as Combatant, st.combatants.A as Combatant, 'crocodile')).stats!;
      if (v === 87) {
        expect(s.modifiers.int).toBe(mod(croc.abilities.int));
        expect(s.saves.wis).toBe(mod(croc.abilities.wis));
        expect(s.saves.con).toBe(3);
      } else {
        expect([s.modifiers.int, s.saves.int, s.saves.wis]).toEqual([5, 9, 6]);
      }
    }
  });
});

describe('WS87: Multiattack seçenekleri (SRD s.262 Barbed Devil, s.306 Medusa)', () => {
  const attacks = (evs: BattleEvent[], id: string) => evs.filter((e) => e.type === 'attack_resolved' && e.actorId === id).map((e) => (e as { label: string }).label);
  function duel(v: number, monsterId: string, far = false) {
    const m = combatantFromMonster(getMonster(monsterId)!, { id: 'M', name: monsterId, side: 'enemies', kuralSurumu: v } as never);
    const st = arena(v, { ...mk('A', { ownerId: 'p1', hp: 999, maxHp: 999, ac: 1 }) }, false, undefined, m);
    return { ...st, order: ['M', 'A'], combatants: { ...st.combatants, M: { ...(st.combatants.M as Combatant), pos: far ? { col: 9, row: 3 } : { col: 4, row: 3 } } } };
  }
  const run = (st: BattleState, plan?: unknown) => execute(st, { type: 'multiattack', actorId: 'M', targetId: 'A', ...(plan ? { plan } : {}) } as Command, GM, () => 0.5);
  it('plansız düğme: 87 bitişikte yakın seçenek (Barbed Devil Claws + Tail, Medusa 2 Claw + Snake Hair), uzakta menzilli; 86 hepsi', () => {
    const r = (v: number, id: string, far = false) => { const x = run(duel(v, id, far)); if (!x.ok) throw new Error(x.error); return attacks(x.events, 'M'); };
    expect(r(87, 'barbed-devil')).toEqual(['Claws', 'Tail']);
    expect(r(87, 'barbed-devil', true)).toEqual(['Hurl Flame', 'Hurl Flame']);
    expect(r(86, 'barbed-devil')).toHaveLength(4);
    expect(r(87, 'medusa')).toEqual(['Claw', 'Claw', 'Snake Hair']);
    expect(r(87, 'medusa', true)).toEqual(['Poison Ray', 'Poison Ray', 'Poison Ray']);
    expect(r(86, 'medusa')).toHaveLength(6);
  });
  it('plan: 87 karışık bileşim (Claws + Hurl Flame) reddedilir, 86 kabul; tek seçenek kabul', () => {
    const mix = [{ attack: 'Claws', targetId: 'A' }, { attack: 'Hurl Flame', targetId: 'A' }];
    expect(run(duel(87, 'barbed-devil'), mix).ok).toBe(false);
    expect(run(duel(86, 'barbed-devil'), mix).ok).toBe(true);
    expect(run(duel(87, 'barbed-devil'), [{ attack: 'Claws', targetId: 'A' }, { attack: 'Tail', targetId: 'A' }]).ok).toBe(true);
  });
  it('replay', () => {
    const st = duel(87, 'medusa');
    const x = run(st);
    if (!x.ok) throw new Error(x.error);
    expect(replay([{ type: 'battle_started', state: st }, ...x.events] as BattleEvent[])).toEqual(x.state);
  });
});
