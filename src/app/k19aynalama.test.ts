/** Kuyruk 19 (-2): yeni savaş aynalanmaz (kural sürümü 16); eski aynalı kayıtlar aynen oynar. */
import { describe, it, expect, afterEach } from 'vitest';
import { scripted } from '../battle/fixtures';
import { setDefaultRuleVersion } from '../battle/create';
import { CURRENT_RULES } from '../battle/ruleVersion';
import { replay } from '../battle';
import { getMap } from '../map/maps';
import { DEMO_SHEETS } from '../demo';
import { getMonster } from '../data';
import { createMapBattle, planParticipants, type BattlePlan } from './setup';
import { restoreSession, serializeSession } from './battleSave';

const plan: BattlePlan = {
  party: [{ id: 'k1', sheet: DEMO_SHEETS.MIRA }], enemies: [{ monster: getMonster('wolf'), count: 1 }],
  mapId: 'col', variantId: 'gunduz',
};
const dice = () => scripted(...Array.from({ length: 6 }, () => [20, 10] as [number, number]));
const reversed = (rows: string[]) => rows.map((r) => [...r].reverse().join(''));

afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

describe('Kuyruk 19: aynalama kaldırıldı', () => {
  it('güncel sürümde aynalı istek yok sayılır', () => {
    expect(CURRENT_RULES).toBeGreaterThanOrEqual(16);
    const s = createMapBattle(planParticipants(plan), { mapId: 'col', variantId: 'gunduz', mirrored: true }, dice()).state;
    expect(s.map?.mirrored).toBe(false);
    expect(s.map?.tiles).toEqual(getMap('col').tiles);
  });
  it('eski sürüm (15) aynalar; olaylar yeni sürümde de aynı aynalı durumu verir (eski kayıt)', () => {
    setDefaultRuleVersion(15);
    const sess = createMapBattle(planParticipants(plan), { mapId: 'col', variantId: 'gunduz', mirrored: true }, dice());
    expect(sess.state.map?.mirrored).toBe(true);
    expect(sess.state.map?.tiles).toEqual(reversed(getMap('col').tiles));
    setDefaultRuleVersion(CURRENT_RULES);
    const again = replay(sess.events);
    const restored = restoreSession(serializeSession(sess));
    expect(restored.ok && restored.session.state.map?.mirrored).toBe(true);
    expect(again.map?.mirrored).toBe(true);
    expect(again.map?.tiles).toEqual(sess.state.map?.tiles);
    expect(again.kuralSurumu).toBe(15);
    // Çizim için aynalı harita hâlâ üretilebilir (mapView).
    expect(getMap('col', { mirrored: true }).tiles).toEqual(reversed(getMap('col').tiles));
  });
});
