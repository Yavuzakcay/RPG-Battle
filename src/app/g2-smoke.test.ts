/**
 * G2 duman testi: her harita bölgesinden bir harita için Game Master kurulumundan savaşa (yerleşim, başlat) ve bir tur
 * yapay zekâ oyununa kadar programatik akış (kurulum ekranının kullandığı `createMapBattle` + `planParticipants`).
 */
import { describe, expect, it } from 'vitest';
import { createMapBattle, planParticipants } from './setup';
import { dispatch } from '../ui/session';
import { demoCharacters } from '../screens/fixtures';
import { getMonster } from '../data';
import { maps } from '../map/maps';
import { mapRegions } from '../screens/GmScreen';
import { playBattle } from '../sim/balance';
import { seededRng } from '../rules/dice';

describe('G2: bölge başına duman testi', () => {
  const regions = mapRegions(maps.filter((m) => !m.gizli));
  it.each(regions.map((g) => [g.id, g.list[0]!.id, g.list[0]!.variants[0]!.id] as const))('%s: %s kurulur, başlar, bir tur oynanır', (_region, mapId, variantId) => {
    const plan = { party: demoCharacters().map((c) => ({ id: c.id, sheet: c.sheet })), enemies: [{ monster: getMonster('wolf'), count: 2 }], mapId, variantId, mirrored: false };
    const rng = seededRng(7);
    const session = createMapBattle(planParticipants(plan), plan, rng);
    expect(session.state.status).toBe('setup');
    const started = dispatch(session, { type: 'start_battle' }, rng);
    expect(started.error ?? null).toBeNull();
    expect(started.state.status).toBe('active');
    const after = playBattle(started.state, rng, 1);
    expect(after.round > 1 || after.status === 'finished').toBe(true);
  });
});
