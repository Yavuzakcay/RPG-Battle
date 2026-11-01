/**
 * Kuyruk 29 K27b: Buzul, Dağ ve Bataklık paketleri (12 harita; 21×11, gündüz + gece). Duman testi: kurulum
 * ekranının yolu (yükle, jetonlar başlangıç bölgelerine), başlat, sırası gelen bir altıgen yürür, kaydet ve kayıttan
 * yükle (replay aynı durum). Ayrıca erişilebilirlik, gündüz/gece tek kart, ad ve açıklama TR + EN.
 */
import { describe, expect, it } from 'vitest';
import { getMap, maps, tileAt } from './maps';
import { createMapBattle, planParticipants } from '../app/setup';
import { dispatch, contextFor } from '../ui/session';
import { serializeSession, restoreSession } from '../app/battleSave';
import { demoCharacters } from '../screens/fixtures';
import { getMonster } from '../data';
import { currentActorId } from '../battle/common';
import { movableHexes } from '../ui/mapView';
import { dayNight, mapRegions } from '../screens/GmScreen';
import { STRINGS_TR } from '../i18n/strings';
import { en } from '../i18n/strings.en';
import { neighbors, hexKey, type Offset } from '../rules/hex';
import { seededRng } from '../rules/dice';
import { isCliff, heightAt } from '../battle/heights';
import { startBattle } from '../battle/create';
import { mk } from '../battle/fixtures';
import { moveCostFn } from '../battle/movement';
import { findPath } from '../rules/hex';
import type { BattleState, Combatant } from '../battle/types';

const PAKET = ['batak-adalar', 'batak-cukur', 'batak-kale', 'batak-kamp', 'buzul-acik', 'buzul-kamp', 'buzul-kayalik', 'buzul-tapinak', 'dag-karakol', 'dag-kayalik', 'dag-kopru', 'dag-nobetci'];
const REGION: Record<string, string> = { batak: 'bataklik', buzul: 'buzul', dag: 'dag' };

describe('K27b: Buzul, Dağ, Bataklık paketleri', () => {
  it('haritalar kendi bölgelerinde, gündüz/gece tek kart; Buzul ayrı bölge', () => {
    const regions = mapRegions(maps.filter((m) => !m.gizli));
    for (const id of PAKET) {
      const g = regions.find((x) => x.id === REGION[id.split('-')[0]!]);
      expect(g?.list.map((m) => m.id), id).toContain(id);
      expect(dayNight(getMap(id)), id).toBeTruthy();
    }
    expect(regions.map((g) => g.id)).toContain('buzul');
  });
  it('ad ve açıklama TR + EN; her başlangıç altıgeni karşı tarafa ulaşır', () => {
    for (const id of PAKET) {
      expect(STRINGS_TR.gm.mapInfo[id]?.name).toBeTruthy(); expect(en.gm.mapInfo[id]?.name).toBeTruthy();
      const m = getMap(id);
      const ok = (h: Offset) => { const t = tileAt(m, h); return t.movement !== 'blocked' && t.movement !== 'deadly' && !t.outOfBounds; };
      const seen = new Set([hexKey(m.startZones.players[0]!)]);
      const q = [m.startZones.players[0]!];
      while (q.length) { const h = q.shift()!; for (const n of neighbors(h, m.size)) if (ok(n) && !seen.has(hexKey(n))) { seen.add(hexKey(n)); q.push(n); } }
      for (const s of [...m.startZones.players, ...m.startZones.enemies]) expect(seen.has(hexKey(s)), `${id} ${hexKey(s)}`).toBe(true);
    }
  });
  it.each(PAKET.flatMap((id) => [[id, 'gunduz'], [id, 'gece']] as const))('%s/%s: yükle, jeton koy, yürü, kaydet ve yükle', (mapId, variantId) => {
    const plan = { party: demoCharacters().map((c) => ({ id: c.id, sheet: c.sheet })), enemies: [{ monster: getMonster('wolf'), count: 2 }], mapId, variantId, mirrored: false };
    const rng = seededRng(5);
    let s = createMapBattle(planParticipants(plan), plan, rng);
    expect(Object.values(s.state.combatants).every((c) => c.pos !== null)).toBe(true);
    s = dispatch(s, { type: 'start_battle' }, rng);
    expect(s.error ?? null).toBeNull();
    const id = currentActorId(s.state);
    const to = [...movableHexes(s.state, id).keys()][0];
    expect(to).toBeTruthy();
    const [col, row] = (to as string).split(',').map(Number);
    s = dispatch(s, { type: 'move', actorId: id, to: { col: col!, row: row! } }, rng, contextFor(s.state, id));
    expect(s.error ?? null).toBeNull();
    expect(s.state.combatants[id]?.pos).toEqual({ col, row });
    const back = restoreSession(serializeSession(s));
    expect(back.ok).toBe(true);
    if (back.ok) expect(back.session.state).toEqual(s.state);
  });
  it('K26b: beş haritada yükseklik katmanı; köprü uçurumu aşan tek yol, donmuş şelale tırmanılır', () => {
    for (const id of ['dag-kayalik', 'dag-karakol', 'dag-kopru', 'buzul-kamp', 'buzul-kayalik']) expect(getMap(id).heights, id).toBeTruthy();
    const st = startBattle('k26b', 'da-u-urum', [mk('A', { ownerId: 'p1' }), mk('B', { side: 'enemies' })], () => 0.5, { map: { id: 'dag-kopru' } }).state;
    const s = { ...st, combatants: { ...st.combatants, A: { ...(st.combatants.A as Combatant), pos: { col: 7, row: 5 } } } } as BattleState;
    expect(heightAt(s, { col: 10, row: 3 })).toBe(-3);
    const path = findPath({ col: 7, row: 5 }, { col: 15, row: 4 }, { cols: 21, rows: 11 }, moveCostFn(s, s.combatants.A as Combatant));
    expect(path?.path.some((h) => h.col === 10 && h.row === 5)).toBe(true);
    const kamp = startBattle('k26b', 'buzul-dondurucu-so-uk', [mk('A', { ownerId: 'p1' }), mk('B', { side: 'enemies' })], () => 0.5, { map: { id: 'buzul-kamp' } }).state;
    expect(isCliff(kamp, { col: 15, row: 5 }, { col: 16, row: 5 })).toBe(true);
  });
});
