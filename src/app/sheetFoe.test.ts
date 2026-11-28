/**
 * Görev DUSMAN-KAGIT-1: karakter kâğıdından düşman. 5. seviye Wizard kâğıdı düşman, sim partisi parti: kurulum, çakışma,
 * çökmesiz savaş (yapay zekâ iki tarafı oynar), kayıt/replay ve kayıtlı karakterin değişmediği.
 */
import { describe, expect, it } from 'vitest';
import { chooseCommand } from '../battle/ai';
import { currentActorId, replay, sheetFoe, type BattleEvent } from '../battle';
import { CR_STEPS } from '../rules/crEstimate';
import { seededRng } from '../rules/dice';
import type { SavedCharacter } from '../rules/builder';
import { partyAt } from '../sim/balance';
import { dispatch, GM_CONTEXT, type Session } from '../ui/session';
import { restoreSession, serializeSession } from './battleSave';
import { applyBattleResult } from './partyStatus';
import { getMonster } from '../data';
import { createMapBattle, planParticipants, planProblems, type BattlePlan } from './setup';
import { isKagitKey, kagitCr, kagitKaydi, sheetFoeCombatant, sheetFoeCr } from './sheetFoe';

const party = partyAt(5, 'standart');
const wizard = party.find((s) => s.classId === 'wizard')!;
const rival = { ...wizard, name: 'Rakip Büyücü' };
const plan = (patch: Partial<BattlePlan> = {}): BattlePlan => ({
  party: party.map((sheet, i) => ({ id: `k${i + 1}`, sheet })),
  enemies: [],
  sheetEnemies: [{ id: 'rakip', sheet: rival }],
  mapId: 'col', variantId: 'gunduz', ...patch,
});

/** Yapay zekâ iki tarafı da oynar; olaylar oturumda birikir. */
function play(session: Session, seed: number, maxRounds = 12): Session {
  const rng = seededRng(seed);
  let s = dispatch(session, { type: 'start_battle' }, rng, GM_CONTEXT);
  for (let guard = 0; guard < 1500 && s.state.status === 'active' && s.state.round <= maxRounds; guard++) {
    const actorId = currentActorId(s.state);
    let moved = false;
    for (let step = 0; step < 12; step++) {
      const next = dispatch(s, chooseCommand(s.state), rng);
      if (next.error) break;
      s = next;
      moved = true;
      if (currentActorId(s.state) !== actorId || s.state.status !== 'active') break;
    }
    if (s.state.status === 'active' && currentActorId(s.state) === actorId) {
      const next = dispatch(s, { type: 'end_turn', actorId }, rng);
      if (next.error) break;
      s = next;
    }
    void moved;
  }
  return s;
}

describe('karakter kâğıdı düşman', () => {
  it('savaşçı: düşman tarafı, sahipsiz, kâğıdın büyüleri ve jetonu; parti aynen', () => {
    const asParty = sheetFoeCombatant(rival, { id: 'x' });
    expect(asParty.side).toBe('enemies');
    expect(asParty.ownerId).toBeNull();
    expect(sheetFoe(asParty)).toBe(true);
    expect(asParty.spellNames.length).toBeGreaterThan(0);
    expect(asParty.avatar).toBeTruthy();
    const ps = planParticipants(plan());
    const foe = ps.find((c) => c.side === 'enemies')!;
    expect(foe).toMatchObject({ id: 'foe1', name: 'Rakip Büyücü', ownerId: null, level: 5 });
    expect(ps.filter((c) => c.side === 'party').every((c) => !sheetFoe(c) && c.ownerId?.startsWith('k'))).toBe(true);
  });

  it('adet: aynı kâğıttan numaralı kopyalar; çakışma: partideki karakter düşman olamaz', () => {
    const ps = planParticipants(plan({ sheetEnemies: [{ id: 'rakip', sheet: rival, count: 2 }] }));
    expect(ps.filter((c) => c.side === 'enemies').map((c) => c.name)).toEqual(['Rakip Büyücü 1', 'Rakip Büyücü 2']);
    expect(planProblems(plan())).toEqual([]);
    expect(planProblems(plan({ sheetEnemies: [{ id: 'k2', sheet: rival }] })).join()).toContain('hem partide hem düşman');
    expect(planProblems(plan({ sheetEnemies: [] })).join()).toContain('En az bir düşman');
  });

  it('CR tahmini geçerli bir basamak; kayıt defterinde olmayan anahtar yok sayılır', () => {
    expect(CR_STEPS).toContain(sheetFoeCr(rival).cr);
    expect(isKagitKey('kagit:yok')).toBe(true);
    expect(isKagitKey('wolf')).toBe(false);
    expect(kagitKaydi('kagit:yok')).toBeUndefined();
    expect(kagitCr('kagit:yok')).toBeNull();
  });

  it('çökmesiz savaş, kâğıt düşman eylem yapar; kayıt/replay aynı; kayıtlı karakter değişmez', () => {
    // İki kişilik parti ↔ kâğıt Wizard + iki kurt (tek büyücü beş kişilik partiye karşı ilk turda düşüyor).
    const small = plan({ party: party.filter((s) => s.classId === 'fighter' || s.classId === 'cleric').map((sheet, i) => ({ id: `k${i + 1}`, sheet })),
      enemies: [{ monster: getMonster('wolf'), count: 2 }] });
    let anyCast = false;
    for (const seed of [1, 2, 3]) {
      const session = createMapBattle(planParticipants(small), { mapId: 'col', variantId: 'gunduz' }, seededRng(100 + seed));
      const foeId = Object.values(session.state.combatants).find(sheetFoe)!.id;
      const end = play(session, seed);
      expect(end.state.round).toBeGreaterThan(0);
      const byFoe = end.events.filter((e: BattleEvent) => 'actorId' in e && e.actorId === foeId);
      expect(byFoe.some((e) => e.type === 'spell_cast' || e.type === 'attack_resolved' || e.type === 'save_resolved'), `tohum ${seed}: kâğıt düşman eylem yapmadı`).toBe(true);
      anyCast ||= byFoe.some((e) => e.type === 'spell_cast');
      expect(JSON.stringify(replay(end.events))).toBe(JSON.stringify(end.state));
      const restored = restoreSession(serializeSession(end));
      expect(restored.ok).toBe(true);
      if (restored.ok) expect(JSON.stringify(restored.session.state)).toBe(JSON.stringify(end.state));
      // Kayıtlı karakter (düşman olarak seçilen) savaş sonunda değişmez; parti üyesinin durumu yazılır.
      const saved: SavedCharacter[] = [
        { id: 'rakip', method: 'standard', classSkills: [], otherSkills: [], sheet: rival },
        { id: 'k1', method: 'standard', classSkills: [], otherSkills: [], sheet: small.party[0]!.sheet },
      ];
      const after = applyBattleResult(saved, { ...end.state, status: 'finished' as const });
      expect(after[0]).toBe(saved[0]);
      expect(after[1]?.status).toBeDefined();
    }
    expect(anyCast, 'kâğıt Wizard hiç büyü yapmadı').toBe(true);
  }, 600_000);

  it('tepki: kâğıt düşman Shield kullanır (Shield bilen büyücü kâğıdı, üç kopya, 6 tohum)', () => {
    const caster = partyAt(5, 'buyucu').find((x) => (x.spellNames ?? []).includes('Shield'))!;
    const heroes = party.filter((x) => x.classId !== 'cleric');
    const used: string[] = [];
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const p = plan({ party: heroes.map((sheet, i) => ({ id: `k${i + 1}`, sheet })), sheetEnemies: [{ id: 'r', sheet: caster, count: 3 }] });
      const end = play(createMapBattle(planParticipants(p), { mapId: 'col', variantId: 'gunduz' }, seededRng(100 + seed)), seed);
      for (const e of end.events) if (e.type === 'reaction_used' && sheetFoe(end.state.combatants[e.actorId]!)) used.push(e.name);
    }
    expect(used).toContain('Shield');
  }, 600_000);
});
