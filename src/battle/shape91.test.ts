/**
 * Görev WS91 (kural sürümü 91; SRD 5.2.1 PDF'inden doğrulandı): Wild Shape (s. 43 "Game Statistics") ve Polymorph
 * (s. 153) biçim aktarımı; Hover (s. 183), Archmage "Charmed (with Mind Blank)" (s. 305). 90 ve altı aynen; replay.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromMonster, combatantFromSheet, setDefaultRuleVersion, startBattle } from './create';
import { applyEvents, replay } from './reduce';
import { P1, mk } from './fixtures';
import { setupMonster } from './monsterSetup';
import { polymorphEvents, polymorphForms } from './polymorph';
import { eligibleForms, wildShapeFeature } from './druid';
import { formMonsterId } from './shapeMonsterCore';
import { breathesWater } from './underwaterCore';
import { multiSpecOf } from './monsters';
import { abilitiesOf } from './monsterAbilities';
import { SHAPE91_VERSION, shape91On } from './shape91Surum';
import { CURRENT_RULES } from './ruleVersion';
import { seededRng } from '../rules/dice';
import { blankCharacter, suggestedScores } from '../rules/builder';
import { getMonster, monsters } from '../data';
import type { CharacterSheet } from '../rules/stats';
import type { BattleEvent, BattleState, Combatant, Command, UsableFeature } from './types';

const NEW = SHAPE91_VERSION;
const OLD = SHAPE91_VERSION - 1;
const ok = (r: ReturnType<typeof execute>) => { if (!r.ok) throw new Error(r.error); return r; };
const replays = (s0: BattleState, evs: BattleEvent[], after: BattleState) => expect(replay([{ type: 'battle_started', state: s0 }, ...evs])).toEqual(after);

afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

const FORMS = ['wolf', 'giant-spider', 'brown-bear', 'crocodile', 'giant-eagle', 'swarm-of-rats'];
const sheet = (patch: Partial<CharacterSheet> = {}): CharacterSheet => ({
  ...blankCharacter('d').sheet, name: 'Ayla', classId: 'druid', subclassId: 'circle-of-the-land', level: 8, baseScores: suggestedScores('druid'),
  wildShapeForms: FORMS, ...patch,
});
/** Druid A (3,3), düşman T (12,0); sürüm `v`, sıra A'da. */
function druidArena(v: number, others: Combatant[] = []): BattleState {
  const d = combatantFromSheet(sheet(), { id: 'A', ownerId: 'p1' });
  const s0 = startBattle('ws91', 'd', [d, mk('T', { side: 'enemies', hp: 40, maxHp: 40 }), ...others], () => 0.5, { kuralSurumu: v, map: { id: 'col' } } as never).state;
  return { ...s0, kuralSurumu: v, status: 'active', turnIndex: s0.order.indexOf('A'),
    combatants: { ...s0.combatants, A: { ...(s0.combatants.A as Combatant), pos: { col: 3, row: 3 } }, T: { ...(s0.combatants.T as Combatant), pos: { col: 12, row: 0 } } } };
}
const shape = (s: BattleState, form?: string) => {
  const a = s.combatants.A as Combatant;
  const fresh = { ...s, combatants: { ...s.combatants, A: { ...a, economy: { ...a.economy, bonus: false } } } };
  return ok(execute(fresh, { type: 'wild_shape', actorId: 'A', ...(form ? { form } : {}) } as Command, P1, () => 0.5));
};
/** Biçimin dokunduğu alanlar (geri yüklemede asıl değerlere dönmeli). */
const FIELDS = ['resistances', 'immunities', 'vulnerabilities', 'darkvision', 'senses', 'packTactics', 'traits', 'effects', 'burrowFt', 'phase',
  'reactions', 'reactionUses', 'bonusActions', 'attacks', 'multiattack', 'ac', 'speed', 'fly', 'size', 'modifiers', 'saves', 'skills', 'weaponOptions'] as const;
const pick = (c: Combatant) => Object.fromEntries(FIELDS.map((k) => [k, c[k]]));
const effectOf = (c: Combatant) => c.effects?.find((e) => e.id === `srd19:${c.id}:traits`);

describe('WS91: sabit', () => {
  it('sürüm 91 (90 Ready için ayrıldı)', () => {
    expect(SHAPE91_VERSION).toBe(91);
    expect(CURRENT_RULES).toBeGreaterThanOrEqual(SHAPE91_VERSION);
    expect(shape91On({ kuralSurumu: 91 })).toBe(true);
    expect(shape91On({ kuralSurumu: 90 })).toBe(false);
  });
});

describe('WS91: Wild Shape aktarımı (SRD s. 43)', () => {
  it('Wolf: Pack Tactics, Darkvision 60; bırakınca asıl değerler; 90: aktarım yok', () => {
    for (const v of [NEW, OLD]) {
      const s0 = druidArena(v);
      const before = pick(s0.combatants.A as Combatant);
      const r = shape(s0, 'wolf');
      const a = r.state.combatants.A as Combatant;
      expect(a.packTactics, String(v)).toBe(v === NEW);
      if (v === NEW) {
        expect(a.darkvision).toBe(60);
        expect(formMonsterId(a)).toBe('wolf');
        expect(a.shape?.monster).toBeDefined();
        replays(s0, r.events, r.state);
      } else {
        expect(a.darkvision).toBe(before.darkvision);
        expect(a.shape?.monster).toBeUndefined();
        expect(formMonsterId(a)).toBeUndefined();
      }
      const back = shape(r.state).state.combatants.A as Combatant;
      expect(pick(back), String(v)).toEqual(before);
      expect(back.shape).toBeUndefined();
    }
  });
  it('Giant Spider: Spider Climb + Web Walker etkisi, Web (save, Recharge 5–6) canavar saldırısı, ek etki biçimden', () => {
    const s0 = druidArena(NEW);
    const r = shape(s0, 'giant-spider');
    const a = r.state.combatants.A as Combatant;
    expect(effectOf(a)?.climb).toBe(true);
    expect(effectOf(a)?.webWalker).toBe(true);
    expect(a.darkvision).toBe(60);
    expect(a.attacks.map((x) => x.name)).toEqual(['Web']);
    expect(a.attacks[0]?.save?.dc).toBe(13);
    expect(a.multiattack).toBe(false);
    // Bite saldırı zarlı: silah seçeneği (87'den beri).
    expect(a.weaponOptions.some((o) => o.beast?.attack === 'Bite')).toBe(true);
    replays(s0, r.events, r.state);
    // 90: tırmanma etkisi ve Web yok.
    const old = shape(druidArena(OLD), 'giant-spider').state.combatants.A as Combatant;
    expect(effectOf(old)).toBeUndefined();
    expect(old.attacks).toEqual((druidArena(OLD).combatants.A as Combatant).attacks);
  });
  it('Brown Bear: tırmanma, Darkvision; ayıdan örümceğe geçişte ayının değerleri kalmaz, bırakınca asıl', () => {
    const s0 = druidArena(NEW);
    const before = pick(s0.combatants.A as Combatant);
    const bear = shape(s0, 'brown-bear');
    const a = bear.state.combatants.A as Combatant;
    expect(effectOf(a)?.climb).toBe(true);
    expect(a.darkvision).toBe(60);
    const spider = shape(bear.state, 'giant-spider').state.combatants.A as Combatant;
    expect(effectOf(spider)?.webWalker).toBe(true);
    expect(spider.attacks.map((x) => x.name)).toEqual(['Web']);
    expect(spider.effects?.filter((e) => e.id.startsWith('srd19:A:')).length).toBe(1);
    expect(pick(shape({ ...bear.state, combatants: { ...bear.state.combatants, A: spider } }).state.combatants.A as Combatant)).toEqual(before);
  });
  it('Crocodile: yüzme (bicimYuzme açıkken) ve Hold Breath ile su soluma; Darkvision yok', () => {
    const s0 = druidArena(NEW);
    const a = shape(s0, 'crocodile').state.combatants.A as Combatant;
    expect(a.traits).toContain('gift-of-the-depths');
    expect(a.swimFt).toBe(30);
    expect(a.darkvision).toBe(0);
    expect(breathesWater(a)).toBe(true);
    expect(breathesWater(s0.combatants.A as Combatant)).toBe(false);
    // Game Master anahtarı kapalıyken yüzme işareti aktarılmaz.
    const off = { ...s0, map: { ...(s0.map as NonNullable<BattleState['map']>), ruleToggles: { ...(s0.map?.ruleToggles ?? {}), bicimYuzme: false } } };
    expect((shape(off, 'crocodile').state.combatants.A as Combatant).traits ?? []).not.toContain('gift-of-the-depths');
  });
  it('Giant Eagle artık uygun değil (SRD 5.2.1: Celestial): Wild Shape ve Polymorph listesinde yok', () => {
    const d = druidArena(NEW).combatants.A as Combatant;
    const f = wildShapeFeature(d) as UsableFeature;
    expect(eligibleForms(monsters, f, 20, NEW).some((m) => m.id === 'giant-eagle')).toBe(false);
    expect(polymorphForms({ ...d, level: 20 }, NEW).some((m) => m.id === 'giant-eagle')).toBe(false);
    const s0 = druidArena(NEW);
    const a = s0.combatants.A as Combatant;
    expect(execute({ ...s0, combatants: { ...s0.combatants, A: { ...a, economy: { ...a.economy, bonus: false } } } },
      { type: 'wild_shape', actorId: 'A', form: 'giant-eagle' } as Command, P1, () => 0.5).ok).toBe(false);
  });
  it('direnç ve durum bağışıklığı: Swarm of Rats (direnç birleşir)', () => {
    const s0 = druidArena(NEW);
    const d = s0.combatants.A as Combatant;
    const own = { ...d, resistances: ['poison'] };
    const s1 = { ...s0, combatants: { ...s0.combatants, A: own } };
    const swarm = monsters.find((m) => m.id === 'swarm-of-rats')!;
    const r = shape(s1, swarm.id);
    const a = r.state.combatants.A as Combatant;
    // Sınıf/tür kaynağı ayrılamadığından kendi direnci kalır, biçiminki eklenir (⚠ DECISIONS WS91).
    expect(a.resistances).toEqual(expect.arrayContaining(['poison', ...(swarm.resistances ?? [])]));
    expect(effectOf(a)?.immune?.length).toBeGreaterThan(0);
    replays(s1, r.events, r.state);
    expect((shape(r.state).state.combatants.A as Combatant).resistances).toEqual(['poison']);
  });
});

describe('WS91: Polymorph aktarımı (SRD s. 153)', () => {
  /** Archmage (Magic Resistance, Psychic bağışıklığı, Charmed (with Mind Blank), canavar büyüleri). */
  function withArchmage(v: number): BattleState {
    const am = { ...combatantFromMonster(getMonster('archmage')!, { id: 'M', kuralSurumu: v }), pos: { col: 6, row: 3 } };
    const s0 = druidArena(v, [am]);
    return { ...s0, combatants: { ...s0.combatants, M: setupMonster(s0, s0.combatants.M as Combatant).combatant } };
  }
  it('canavar hedef: kendi etkileri, bağışıklıkları ve hakları biçim süresince kalkar; bitince geri ve kalan geçici HP gider', () => {
    const s0 = withArchmage(NEW);
    const m0 = s0.combatants.M as Combatant;
    expect(effectOf(m0)?.saveAdvAgainst).toEqual(['spell']);
    expect(m0.immunities).toContain('psychic');
    const owned = Object.keys(m0.resources).filter((k) => k.startsWith('mspell'));
    expect(owned.length).toBeGreaterThan(0);
    const evs = polymorphEvents(s0, s0.combatants.A as Combatant, m0, 'wolf');
    const poly = applyEvents(s0, evs);
    const m = poly.combatants.M as Combatant;
    expect(m.immunities).toEqual([]);
    expect(effectOf(m)).toBeUndefined();
    expect(m.packTactics).toBe(true);
    expect(m.darkvision).toBe(60);
    for (const k of owned) expect(m.resources[k]).toBe(0);
    expect(m.tempHp).toBe(getMonster('wolf')!.hp);
    replays(s0, evs, poly);
    const end = applyEvents(poly, [{ type: 'shape_changed', actorId: 'M', stats: null, reason: 'Polymorph bitti' }]);
    const back = end.combatants.M as Combatant;
    expect(pick(back)).toEqual(pick(m0));
    for (const k of owned) expect(back.resources[k]).toBe(m0.resources[k]);
    expect(back.tempHp ?? 0).toBe(0);
  });
  it('biçimin Multiattack planı (Lion) ve yetenekleri (Giant Toad) biçimin kimliğiyle; 90: canavarın kendi kimliği', () => {
    for (const v of [NEW, OLD]) {
      const s0 = withArchmage(v);
      const poly = applyEvents(s0, polymorphEvents(s0, s0.combatants.A as Combatant, s0.combatants.M as Combatant, 'giant-toad'));
      const m = poly.combatants.M as Combatant;
      expect(formMonsterId(m), String(v)).toBe(v === NEW ? 'giant-toad' : 'archmage');
      expect(abilitiesOf(poly, m).map((a) => a.id), String(v)).toEqual(v === NEW ? ['leap', 'swallow'] : []);
      if (v === OLD) expect(m.immunities).toContain('psychic');
      const lion = applyEvents(s0, polymorphEvents(s0, s0.combatants.A as Combatant, s0.combatants.M as Combatant, 'lion'));
      expect(multiSpecOf(lion, lion.combatants.M as Combatant) !== null, String(v)).toBe(v === NEW);
    }
  });
  it('90: Polymorph bitince geçici HP kalır (eski davranış)', () => {
    const s0 = withArchmage(OLD);
    const poly = applyEvents(s0, polymorphEvents(s0, s0.combatants.A as Combatant, s0.combatants.M as Combatant, 'wolf'));
    const end = applyEvents(poly, [{ type: 'shape_changed', actorId: 'M', stats: null, reason: 'Polymorph bitti' }]);
    expect(end.combatants.M?.tempHp).toBe(getMonster('wolf')!.hp);
  });
});

describe('WS91: Archmage Mind Blank ve Hover', () => {
  it('Archmage "Charmed (with Mind Blank)": 91 bağışık, 90 değil', () => {
    for (const v of [NEW, OLD]) {
      const s0 = druidArena(v);
      const am = setupMonster(s0, combatantFromMonster(getMonster('archmage')!, { id: 'M', kuralSurumu: v })).combatant;
      expect(effectOf(am)?.immune ?? [], String(v)).toEqual(v === NEW ? ['Charmed'] : []);
    }
  });
  it('Hover: Prone olan hayalet havada kalır (91), 90\'da düşer; Hover\'sız uçan düşer', () => {
    for (const v of [NEW, OLD]) {
      for (const id of ['ghost', 'giant-bat']) {
        const s0 = druidArena(v, [{ ...combatantFromMonster(getMonster(id)!, { id: 'G', kuralSurumu: v }), pos: { col: 7, row: 3 } }]);
        const g = setupMonster(s0, s0.combatants.G as Combatant).combatant;
        expect(g.traits?.includes('hover') ?? false, `${v} ${id}`).toBe(v === NEW && id === 'ghost');
        const up: BattleState = { ...s0, combatants: { ...s0.combatants, G: { ...g, altitudeFt: 20, conditions: ['Prone'] } } };
        const r = ok(execute(up, { type: 'end_turn', actorId: 'A' } as Command, P1, seededRng(3)));
        expect(r.state.combatants.G?.altitudeFt ?? 0, `${v} ${id}`).toBe(v === NEW && id === 'ghost' ? 20 : 0);
      }
    }
  });
});

describe('WS91: Karadul Örümcek Biçimi değişmez', () => {
  it('örümcek biçimine canavar parçası eklenmez (yalnız Wild Shape ve Polymorph)', async () => {
    const { spiderStats } = await import('./karadul');
    const s0 = druidArena(NEW);
    const st = spiderStats(getMonster('giant-spider')!, s0.combatants.A as Combatant);
    expect('monster' in st).toBe(false);
  });
});
