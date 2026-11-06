/**
 * Kuyruk K59 Görev 1: uyumluluk ve ev kuralları tek tek.
 *  - Kural sürümü 1–güncel: her sürümde savaş kurulur, oynanır, kaydedilir; kayıt her yüklenebilir kayıt sürümüyle (3–22)
 *    açılır, aynı durum çıkar ve savaş kaldığı yerden sürer.
 *  - Her ev kuralı tek başına açık / tek başına kapalı (diğerleri açık): çökme yok, olaylar baştan oynatılınca aynı durum.
 *  - Sürümle gelen ev kuralı (Moral 20, Karadul 21, imza 23, çarpma 24) kendi sürümünden önceki savaşta açık da olsa
 *    kapalıyla birebir aynı oynar (eski davranış); hizalanma bayrakları savaşa girmez.
 *  - Kapalı karakter kuralı (imza, Karadul) ve Moral savaşta iz bırakmaz.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { combatantFromMonster, combatantFromSheet, setDefaultRuleVersion } from '../battle/create';
import { createMapBattle } from '../app/setup';
import { execute } from '../battle/commands';
import { chooseCommand } from '../battle/ai';
import { replay } from '../battle/reduce';
import { currentActorId } from '../battle/common';
import { CURRENT_RULES } from '../battle/ruleVersion';
import { LOADABLE_VERSIONS, restoreSession, serializeSession } from '../app/battleSave';
import { contextFor } from '../ui/session';
import { classData, getMonster } from '../data';
import { seededRng } from '../rules/dice';
import { partyAt } from './balance';
import houseData from '../../data/ev-kurallari.json';
import type { BattleEvent, BattleState } from '../battle/types';

const GROUPS = { A: ['k18-barbarian', 'k18-bard', 'k18-cleric', 'k18-druid', 'k18-fighter', 'k18-monk'], B: ['k18-paladin', 'k18-ranger', 'k18-rogue', 'k18-sorcerer', 'k18-warlock', 'k18-wizard'] } as const;
const RULE_IDS = Object.entries(houseData.rules).filter(([, v]) => !(v as { gizli?: boolean }).gizli).map(([k]) => k);
const ALL_ON = Object.fromEntries(RULE_IDS.map((k) => [k, true]));
const ALL_OFF = Object.fromEntries(RULE_IDS.map((k) => [k, false]));
const imzaOf = (cls: string) => classData.subclasses.find((s) => s.ev && s.class === cls)?.id;
const groupOfRule = (id: string): keyof typeof GROUPS => {
  const sub = classData.subclasses.find((s) => s.evKurali === id || s.id === id);
  return sub && GROUPS.B.includes(`k18-${sub.class}` as never) ? 'B' : 'A';
};

afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

interface Run { state: BattleState; events: BattleEvent[] }
function play(opts: { group: keyof typeof GROUPS; level?: number; house: Record<string, boolean>; version?: number; rounds?: number; seed?: number; members?: number }): Run {
  const level = opts.level ?? 7;
  if (opts.version) setDefaultRuleVersion(opts.version);
  const rng = seededRng(opts.seed ?? 59);
  const pcs = GROUPS[opts.group].slice(0, opts.members ?? 6).map((kind, i) => {
    const sheet = partyAt(level, kind)[0] as NonNullable<ReturnType<typeof partyAt>[0]>;
    const sub = imzaOf(sheet.classId);
    return { ...combatantFromSheet(sub ? { ...sheet, subclassId: sub } : sheet, { id: `pc${i + 1}`, ownerId: `p${i + 1}` }), side: 'party' as const };
  });
  const foes = ['ogre', 'owlbear', 'goblin-warrior', 'bandit'].map((m, i) => combatantFromMonster(getMonster(m), { id: `e${i}`, name: m }));
  const session = createMapBattle([...pcs, ...foes], { mapId: 'kale', variantId: 'gunduz', mirrored: false, houseRules: opts.house }, rng);
  const r = execute(session.state, { type: 'start_battle' }, { playerId: 'gm', isGm: true }, rng);
  if (!r.ok) throw new Error(r.error);
  let state = r.state;
  const events: BattleEvent[] = [...session.events, ...r.events];
  const max = opts.rounds ?? 2;
  for (let g = 0; g < 600 && state.status === 'active' && state.round <= max; g++) {
    const cmd = chooseCommand(state);
    const actor = (cmd as { actorId?: string }).actorId ?? currentActorId(state);
    const x = execute(state, cmd, contextFor(state, actor), rng);
    if (!x.ok) throw new Error(`${cmd.type}: ${x.error}`);
    state = x.state; events.push(...x.events);
  }
  setDefaultRuleVersion(CURRENT_RULES);
  return { state, events };
}
const withoutHouse = (s: BattleState) => JSON.stringify({ ...s, houseRules: undefined });

describe('K59: kural sürümleri ve kayıt sürümleri', () => {
  it(`kural sürümü 1–${CURRENT_RULES}: kur, oyna, kaydet; her kayıt sürümüyle aç ve devam et`, () => {
    for (let v = 1; v <= CURRENT_RULES; v++) {
      const run = play({ group: v % 2 ? 'A' : 'B', house: ALL_ON, version: v, rounds: 1, members: 3, level: 5, seed: v });
      expect(run.state.kuralSurumu ?? 1, `sürüm ${v}`).toBe(v);
      expect(JSON.stringify(replay(run.events)), `sürüm ${v} replay`).toBe(JSON.stringify(run.state));
      const text = serializeSession({ state: run.state, events: run.events, lines: [], error: null });
      for (const sv of LOADABLE_VERSIONS) {
        const file = { ...JSON.parse(text), version: sv };
        const back = restoreSession(JSON.stringify(file));
        expect(back.ok, `kural ${v} / kayıt ${sv}`).toBe(true);
        if (!back.ok) continue;
        expect(JSON.stringify(back.session.state), `kural ${v} / kayıt ${sv}`).toBe(JSON.stringify(run.state));
      }
      // Yüklenen savaş sürer.
      const back = restoreSession(text);
      if (back.ok && back.session.state.status === 'active') {
        const s = back.session.state;
        const cmd = chooseCommand(s);
        const x = execute(s, cmd, contextFor(s, (cmd as { actorId?: string }).actorId ?? currentActorId(s)), seededRng(v));
        expect(x.ok, `sürüm ${v} devam`).toBe(true);
      }
    }
  }, 600_000);
});

describe('K59: ev kuralları tek tek', () => {
  it.each(RULE_IDS)('%s: yalnız açık ve yalnız kapalı (diğerleri açık): çökme yok, replay aynı', (id) => {
    for (const house of [{ ...ALL_OFF, [id]: true }, { ...ALL_ON, [id]: false }]) {
      const run = play({ group: groupOfRule(id), house });
      expect(JSON.stringify(replay(run.events)), id).toBe(JSON.stringify(run.state));
    }
  }, 120_000);

  const GATED: Array<[string, number]> = [['moralSistemi', 20], ['karadulCemberi', 21], ['carpmaHasari', 24],
    ...classData.subclasses.filter((s) => s.ev && s.evKurali?.startsWith('imza_')).map((s) => [s.evKurali as string, 23] as [string, number])];
  it.each(GATED)('%s: kendi sürümünden (%i) önceki savaşta açık = kapalı (eski davranış)', (id, intro) => {
    const on = play({ group: groupOfRule(id), house: { ...ALL_OFF, [id]: true }, version: intro - 1 });
    const off = play({ group: groupOfRule(id), house: { ...ALL_OFF, [id]: false }, version: intro - 1 });
    expect(withoutHouse(on.state)).toBe(withoutHouse(off.state));
  }, 120_000);

  it('duyarlılık: güncel sürümde Moral ve Karadul açık ≠ kapalı (yukarıdaki eşitlik boş değil)', () => {
    for (const id of ['moralSistemi', 'karadulCemberi']) {
      const on = play({ group: 'A', house: { ...ALL_OFF, [id]: true } });
      const off = play({ group: 'A', house: { ...ALL_OFF, [id]: false } });
      expect(withoutHouse(on.state), id).not.toBe(withoutHouse(off.state));
    }
  }, 120_000);

  it('hizalanma ve hizalanmaMoral savaşa girmez (açık = kapalı, Moral tam modu açıkken de)', () => {
    for (const group of ['A', 'B'] as const) {
      const on = play({ group, house: { ...ALL_ON, hizalanma: true, hizalanmaMoral: true } });
      const off = play({ group, house: { ...ALL_ON, hizalanma: false, hizalanmaMoral: false } });
      expect(withoutHouse(on.state)).toBe(withoutHouse(off.state));
    }
  }, 120_000);

  it('kapalı imza/Karadul/Moral savaşta iz bırakmaz', () => {
    for (const group of ['A', 'B'] as const) {
      const run = play({ group, house: ALL_OFF, rounds: 3 });
      const json = JSON.stringify(run.events.slice(1));
      expect(json).not.toMatch(/"feature":"imza:/);
      expect(json).not.toMatch(/ev:karadul\//);
      expect(run.events.some((e) => e.type === 'moral_changed')).toBe(false);
      expect(Object.values(run.state.combatants).some((c) => c.moral !== undefined)).toBe(false);
    }
  }, 120_000);
});
