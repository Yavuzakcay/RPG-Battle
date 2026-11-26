import { describe, it, expect } from 'vitest';
import { combatantFromSheet } from '../battle';
import { getMonster } from '../data';
import { averageDamage } from '../battle/ai';
import { DEFAULT_LEVEL, PARTY, PARTY_KINDS, SCENARIOS, partyAt, scenarioXp, seeded, setupBattle, setPartyKind, simulate } from './balance';
import { tableValue } from '../rules/classFeatures';
import { alternativeCantrips, spellOptions } from '../rules/builder';
import { spells } from '../data';
import monsterEnvs from '../../data/monster-ortamlari.json';
import { planProblems } from '../app/setup';
import { advancementProblems, sheetAdvancementSlots } from '../rules/advancement';
import { classesOf } from '../rules/multiclass';
import { mcImpl } from '../rules/mcHook';
import { classKit, subclassLevel } from '../rules/classFeatures';
import { spellLimits } from '../rules/builder';
import { finalScores } from '../rules/stats';
import { getClass } from '../data';
import { chooseCommand } from '../battle/ai';
import { execute } from '../battle';
import { contextFor } from '../ui/session';

const MC_KINDS = Object.keys(PARTY_KINDS).filter((k) => partyAt(DEFAULT_LEVEL, k).some((s) => (s.classes?.length ?? 0) > 1));

describe('denge simülasyonu', () => {
  it('parti: 5 karakter, 5. seviye, sorunsuz kurulur', () => {
    expect(PARTY).toHaveLength(5);
    for (const s of PARTY) expect(combatantFromSheet(s, { id: 'x', ownerId: 'p' }).level).toBe(5);
  });
  it('seviyeli parti üreteci: 5. seviyede PARTY birebir; diğer seviyelerde aynı üyeler, istenen seviye', () => {
    expect(partyAt()).toEqual(PARTY);
    partyAt(5).forEach((s, i) => expect(s).toBe(PARTY[i]));
    const p11 = partyAt(11);
    expect(p11.map((s) => [s.name, s.level])).toEqual(PARTY.map((s) => [s.name, 11]));
    expect(p11.map((s) => s.classId)).toEqual(PARTY.map((s) => s.classId));
    expect(partyAt(1).find((s) => s.classId === 'wizard')?.spellNames).not.toContain('Fireball');
    expect(() => partyAt(21)).toThrow();
    const s = SCENARIOS[0] as (typeof SCENARIOS)[number];
    expect(Object.values(setupBattle(s, seeded(1), 11).combatants).filter((c) => c.side === 'party').every((c) => c.level === 11)).toBe(true);
    expect(simulate(s, 1)).toEqual(simulate(s, 1, 20, 5));
  });
  it('1. ve 3. seviye partiler gerçek: büyü sayısı SRD tablosunda, seçilebilir büyüler, seviye yuvaları ve ustalık hakkı', () => {
    for (const kind of ['standart', 'barbar']) {
      expect(PARTY_KINDS[kind]).toBeTruthy();
      for (const level of [1, 3, 5]) {
        for (const s of partyAt(level, kind)) {
          expect(s.level).toBe(level);
          const allowed = new Set([...spellOptions(s.classId, level), ...alternativeCantrips(s).options]);
          const chosen = (s.spellNames ?? []).map((n) => spells.find((x) => x.name === n));
          expect(chosen.every((x) => x && allowed.has(x.name))).toBe(true);
          const row = { Cantrips: tableValue(s.classId, level, 'Cantrips'), 'Prepared Spells': tableValue(s.classId, level, 'Prepared Spells') };
          const cantrips = chosen.filter((x) => x?.level === 0).length;
          const prepared = chosen.length - cantrips;
          expect(cantrips).toBeLessThanOrEqual(Number(row['Cantrips'] ?? 0));
          expect(prepared).toBeLessThanOrEqual(Number(row['Prepared Spells'] ?? 0));
          // 1. ve 3. seviyede hazır büyü listesi tablo kadar dolu (5. seviye partisi önceki ölçümlerle aynı kalsın diye eksik).
          if (level < DEFAULT_LEVEL && row['Prepared Spells']) {
            const pool = spells.filter((x) => x.level > 0 && allowed.has(x.name)).length;
            expect(prepared).toBe(Math.min(Number(row['Prepared Spells']), pool));
          }
          expect((s.advancements ?? []).every((a) => a.level <= level)).toBe(true);
          expect(combatantFromSheet(s, { id: 'x', ownerId: 'p' }).level).toBe(level);
        }
      }
    }
  });
  it("partiler eksiksiz (Görev B2): köken feat'i, alt sınıf (3+), 4. seviye ASI, 5. seviyede tablo kadar büyü; yuva sorunu yok", () => {
    // Kuyruk 41: Aşama 2 partileri 7. ve 9. seviyede de eksiksiz (8. seviye ASI, 4.–5. seviye büyüler).
    // Görev MC7: çoklu sınıflı parti ayrı testte (sınıf başına).
    const plan = Object.keys(PARTY_KINDS).filter((kind) => !MC_KINDS.includes(kind)).flatMap((kind) => [1, 3, 5, ...(kind.startsWith('a2-') ? [7, 9] : [])].map((level) => [kind, level] as const));
    for (const [kind, level] of plan) {
      {
        for (const s of partyAt(level, kind)) {
          expect(s.originFeat, `${kind} ${s.name}`).toBeTruthy();
          if (level >= 3) expect(s.subclassId, `${kind} ${s.name}`).toBeTruthy();
          expect(advancementProblems(s, { scores: finalScores({ ...s, advancements: [] }), casterClass: getClass(s.classId).casting !== null })).toEqual([]);
          if (level >= 4) expect((s.advancements ?? []).some((a) => a.level === 4), `${s.name} 4. seviye yuvası`).toBe(true);
          if (level >= 8) expect((s.advancements ?? []).some((a) => a.level === 8), `${s.name} 8. seviye yuvası`).toBe(true);
          // Fighter'ın ek ASI yuvası (SRD 5.2.1: 6. seviye).
          if (level >= 6 && s.classId === 'fighter') expect((s.advancements ?? []).some((a) => a.level === 6), `${s.name} 6. seviye yuvası`).toBe(true);
          const cantripsMax = Number(tableValue(s.classId, level, 'Cantrips') ?? 0);
          const preparedMax = Number(tableValue(s.classId, level, 'Prepared Spells') ?? 0);
          const chosen = (s.spellNames ?? []).map((n) => spells.find((x) => x.name === n));
          if (cantripsMax) expect(chosen.filter((x) => x?.level === 0).length, `${s.name} cantrip`).toBe(cantripsMax);
          if (preparedMax) {
            const allowed = new Set(spellOptions(s.classId, level));
            const pool = spells.filter((x) => x.level > 0 && allowed.has(x.name)).length;
            expect(chosen.filter((x) => (x?.level ?? 0) > 0).length, `${s.name} hazır büyü`).toBe(Math.min(preparedMax, pool));
          }
        }
      }
    }
  });
  it("Görev MC7: çoklu sınıflı parti eksiksiz, sınıf başına (SRD 5.2.1 s. 24–26): ön koşul, alt sınıf, yuvalar, büyü ve Invocation sayısı", () => {
    expect(MC_KINDS).toEqual(['mc-karma']);
    for (const level of [5, 9]) {
      const party = partyAt(level, 'mc-karma');
      expect(party.map((s) => s.classes?.map((e) => e.classId).join('/'))).toEqual(['fighter/wizard', 'paladin/warlock', 'rogue/ranger', 'cleric/monk']);
      for (const s of party) {
        const who = `${s.name} ${level}`;
        expect(s.level, who).toBe(level);
        expect(s.originFeat, who).toBeTruthy();
        const scores = finalScores({ ...s, advancements: [] });
        expect(mcImpl().problems(s, scores), who).toEqual([]);
        expect(mcImpl().spellProblems(s, new Set()), who).toEqual([]);
        expect(advancementProblems(s, { scores, ...mcImpl().casterCtx(s) }), who).toEqual([]);
        for (const slot of sheetAdvancementSlots(s)) {
          expect((s.advancements ?? []).some((a) => a.level === slot.level && (a.classId ?? s.classId) === slot.classId), `${who} ${slot.classId} ${slot.level}. seviye yuvası`).toBe(true);
        }
        for (const e of classesOf(s)) {
          const sub = subclassLevel(e.classId);
          if (sub !== null && e.level >= sub) expect(e.subclassId, `${who} ${e.classId} alt sınıf`).toBeTruthy();
          const lim = spellLimits(e.classId, e.level, s.featureChoices, s.invocations, e.subclassId);
          const always = new Set(classKit(e.classId, e.level, e.subclassId, s.featureChoices).alwaysPrepared);
          const mine = (s.spellNames ?? []).filter((n) => !always.has(n) && mcImpl().spellClassOf(s, n) === e.classId).map((n) => spells.find((x) => x.name === n)!);
          const opts = new Set(spellOptions(e.classId, e.level, e.subclassId));
          const pool = spells.filter((x) => x.level > 0 && opts.has(x.name) && !always.has(x.name)).length;
          expect(mine.filter((x) => x.level === 0).length, `${who} ${e.classId} cantrip`).toBe(lim.cantrips);
          expect(mine.filter((x) => x.level > 0).length, `${who} ${e.classId} hazır büyü`).toBe(Math.min(lim.prepared, pool));
          const inv = Number(tableValue(e.classId, e.level, 'Eldritch Invocations') ?? 0);
          if (inv) expect(s.invocations?.length, `${who} Invocation`).toBe(inv);
        }
        const c = combatantFromSheet(s, { id: 'x', ownerId: 'p' });
        expect(c.level).toBe(level);
        expect(c.classLevels).toMatchObject(Object.fromEntries(classesOf(s).map((e) => [e.classId, e.level])));
      }
    }
    expect(() => partyAt(3, 'mc-karma')).toThrow();
  });
  it('Frenzy simülasyonda çalışır (Barbarian partisi, 3. ve 5. seviye; sayaç)', () => {
    setPartyKind('barbar');
    try {
      for (const level of [3, 5]) {
        let frenzy = 0;
        const s = SCENARIOS.find((x) => x.id === 'duz') as (typeof SCENARIOS)[number];
        for (let seed = 1; seed <= 3; seed++) {
          const rng = seeded(seed);
          let state = setupBattle(s, rng, level);
          for (let g = 0; g < 1500 && state.status === 'active' && state.round <= 20; g++) {
            const id = state.order[state.turnIndex] as string;
            let r = execute(state, chooseCommand(state), contextFor(state, id), rng);
            if (!r.ok) r = execute(state, { type: 'end_turn', actorId: id }, contextFor(state, id), rng);
            if (!r.ok) break;
            for (const e of r.events) if (e.type === 'attack_resolved' && (e.extra ?? []).some((x) => x.label === 'Frenzy')) frenzy++;
            state = r.state;
          }
        }
        expect(frenzy, `${level}. seviye Frenzy isabeti`).toBeGreaterThan(0);
      }
    } finally {
      setPartyKind('standart');
    }
  });
  it('1. ve 3. seviye düşman listeleri haritanın ortam listesinden', () => {
    const envOf = new Map((monsterEnvs as Array<{ id: string; ortam: string[] }>).map((m) => [m.id, m.ortam]));
    for (const s of SCENARIOS) {
      const env = s.map?.mapId ?? 'duz-zemin';
      for (const level of [1, 3]) {
        const list = s.byLevel?.[level];
        expect(list, `${s.id} ${level}. seviye listesi`).toBeTruthy();
        for (const id of Object.keys(list ?? {})) {
          expect(getMonster(id).id).toBe(id);
          expect(envOf.get(id), `${s.id}: ${id}`).toContain(env);
        }
      }
    }
  });
  it('senaryolar haritaya sığar ve en az 5 farklı harita türü var', () => {
    const kinds = new Set(SCENARIOS.map((s) => s.map?.mapId ?? 'duz'));
    expect(kinds.size).toBeGreaterThanOrEqual(5);
    for (const s of SCENARIOS.filter((x) => x.map)) {
      const plan = {
        party: PARTY.map((sheet, i) => ({ id: `p${i}`, sheet })),
        enemies: Object.entries(s.enemies).map(([id, count]) => ({ monster: getMonster(id), count })),
        mapId: s.map?.mapId ?? '', variantId: s.map?.variantId ?? '', mirrored: false,
      };
      expect(planProblems(plan)).toEqual([]);
      expect(setupBattle(s, seeded(1)).status).toBe('active');
      // Her seviyenin listesi de başlangıç bölgesine sığar (Görev B1).
      for (const level of Object.keys(s.byLevel ?? {}).map(Number)) expect(setupBattle(s, seeded(1), level).status).toBe('active');
    }
    // Düz: 2 Ogre 900 + Bandit Captain 450 + 4 Gnoll 400 + 2 Wolf 100 + 2 Worg 200 + 2 Boar 100
    // (Görev E: kurt Prone'u uygulanınca parti %51'e düştü; 4 kurttan 2'ye inildi. Görev P-Barbarian: Barbarian
    // partisi %96 olunca Ogre 1 → 2; standart parti %63).
    expect(scenarioXp(SCENARIOS[0] as (typeof SCENARIOS)[number])).toBe(2150);
  });
  it('aynı tohum aynı sonucu verir; savaş biter', () => {
    const s = SCENARIOS.find((x) => x.id === 'volkan') as (typeof SCENARIOS)[number];
    const a = simulate(s, 7);
    expect(simulate(s, 7)).toEqual(a);
    expect(['party', 'enemies', 'timeout']).toContain(a.winner);
    expect(seeded(3)()).toBe(seeded(3)());
  });
  it('ortalama hasar', () => {
    expect(averageDamage('2d6+3')).toBe(10);
    expect(averageDamage('1d10')).toBe(5.5);
  });
});
