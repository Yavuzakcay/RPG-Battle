/** 2026-11-19: Serüven 6–20 seviye düşman seçimi (`journey/seruvenEnemies`, `app/seruvenBattle` `seruvenEnemies`). */
import { describe, expect, it } from 'vitest';
import { SCENARIOS, enemiesAt } from '../sim/balance';
import { seruvenEnemyPlan, lowerList } from './seruvenEnemies';
import seruven from '../../data/seruven.json';
import hapis from '../../data/hapishane.json';
import { executeSeruven } from './seruven';
import { partyAt } from '../sim/balance';
import { battleEnemyXp, nodeJourney, seruvenBattleSession, seruvenResultCommand } from '../app/seruvenBattle';
import { stopParticipants } from '../app/journeyBattle';
import { seededRng } from '../rules/dice';

const LEVELS = [6, 8, 12, 16, 20];
const pages = (seruven as { pages: Array<{ id: string; nodes: Array<{ id: string; scenario?: string; boss?: boolean; sefer?: string }> }> }).pages;
const plainScenarios = [...new Set(pages.filter((p) => p.id !== (hapis as { sayfa: string }).sayfa)
  .flatMap((p) => p.nodes.filter((n) => n.scenario && !n.boss && !n.sefer).map((n) => n.scenario as string)))];
const sc = (id: string) => { const s = SCENARIOS.find((x) => x.id === id); if (!s) throw new Error(id); return s; };

describe('Serüven 6–20 seviye düşman planı', () => {
  it('sıradan Serüven düğümlerinin hepsinde 6/8/12/16/20. seviyede düşman var, 5. seviye listesine düşmüyor', () => {
    expect(plainScenarios.length).toBeGreaterThan(15);
    for (const id of plainScenarios) for (const lv of LEVELS) {
      const p = seruvenEnemyPlan(sc(id), lv, { ozel: false, partySize: 4, seed: `t:${id}:${lv}` });
      expect(p.kaynak, `${id}/${lv}`).not.toBe('bes');
      expect(Object.values(p.enemies).reduce((a, b) => a + b, 0), `${id}/${lv}`).toBeGreaterThan(0);
      if (p.kaynak === 'uretec') expect(Object.values(p.enemies).reduce((a, b) => a + b, 0), `${id}/${lv}`).toBeLessThanOrEqual(6);
    }
  });
  it('en yakın alt 6+ liste: 8 → 7, 12 → 11, 16 → 15, 10 → 9; tam seviye kendi listesi', () => {
    const col = sc('col');
    expect([8, 10, 12, 16, 19].map((l) => lowerList(col, l)?.level)).toEqual([7, 9, 11, 15, 15]);
    expect(seruvenEnemyPlan(col, 12, { ozel: false, partySize: 4, seed: 'x' })).toMatchObject({ kaynak: 'altListe', seviye: 11, enemies: col.byLevel?.[11] });
    expect(seruvenEnemyPlan(col, 20, { ozel: false, partySize: 4, seed: 'x' })).toMatchObject({ kaynak: 'liste', seviye: 20 });
    expect(lowerList(col, 6)).toBeNull(); // 6 → 5'e inmez: üreteç
    expect(seruvenEnemyPlan(col, 6, { ozel: false, partySize: 4, seed: 'x' }).kaynak).toBe('uretec');
  });
  it('özel savaş üreteç almaz; 1–5. seviye eskisi gibi', () => {
    for (const s of SCENARIOS) for (const lv of LEVELS) expect(seruvenEnemyPlan(s, lv, { ozel: true, partySize: 4, seed: 'x' }).kaynak).not.toBe('uretec');
    for (const s of SCENARIOS) for (const lv of [1, 2, 3, 4, 5]) expect(seruvenEnemyPlan(s, lv, { ozel: false, partySize: 4, seed: 'x' }).enemies).toEqual(enemiesAt(s, lv));
  });
  it('aynı tohum aynı liste (kurulum ve sonuç XP\'si tutarlı)', () => {
    const a = seruvenEnemyPlan(sc('orman-ork'), 13, { ozel: false, partySize: 4, seed: 'q' });
    expect(seruvenEnemyPlan(sc('orman-ork'), 13, { ozel: false, partySize: 4, seed: 'q' })).toEqual(a);
  });
});

describe('Serüven savaşı 6+ seviyede', () => {
  const start = (level: number) => {
    const party = partyAt(level).map((sh, i) => ({ id: `p${i + 1}`, name: sh.name, sheet: sh }));
    const r = executeSeruven(null, { type: 'start', id: 's', seed: 7, party, toggles: { irkBaslangic: false, serbestAcilis: true } });
    if (!r.ok) throw new Error(r.error);
    return r.state;
  };
  it('düğüm savaşı plandaki düşmanlarla kurulur; kayıtlı savaş durumu düğümün planından bağımsız, XP savaştaki düşmanlardan', () => {
    const s = start(12);
    const node = pages.find((p) => p.id === s.page)?.nodes.find((n) => n.scenario && !n.boss && !n.sefer);
    if (!node) throw new Error('düğüm yok');
    const j = nodeJourney(s, node.id);
    const planned = j?.route.stops[0]?.enemies;
    expect(planned && Object.keys(planned).length).toBeGreaterThan(0);
    expect(planned).not.toEqual(sc(node.scenario as string).enemies);
    const sess = seruvenBattleSession(s, node.id, seededRng(1));
    const foes = Object.values(sess?.state.combatants ?? {}).filter((c) => c.side === 'enemies');
    expect(foes.length).toBe(Object.values(planned ?? {}).reduce((a, b) => a + b, 0));
    // Eski kayıt: savaş 5. seviye listesiyle kurulmuş olsun; sonuç XP'si o savaşın düşmanlarından gelir.
    const oldFoes = Object.fromEntries(Object.entries(sc(node.scenario as string).enemies).flatMap(([id, n]) => Array.from({ length: n }, (_, i) => [`${id}-${i}`, { id: `${id}-${i}`, side: 'enemies', monsterId: id, civilian: false, hp: 0 }])));
    const final = { ...sess!.state, status: 'finished' as const, winner: 'party' as const, combatants: { ...Object.fromEntries(Object.entries(sess!.state.combatants).filter(([, c]) => c.side === 'party')), ...oldFoes } } as never;
    const cmd = seruvenResultCommand(s, node.id, final);
    expect(cmd?.xp).toBe(battleEnemyXp(final));
    expect(cmd?.xp).not.toBe(j ? stopParticipants(j)?.xp : undefined);
  });
});
