/**
 * Kuyruk 18 V2/V3: sefer grafiği (data/seferler.json) → yolculuk güzergâhı; düğüm geçişleri, ödül durağı, ejder düğümünün
 * hedef ve girişi sefer verisinde; replay aynı.
 */
import { describe, expect, it } from 'vitest';
import { SEFERLER, seferById, seferOfRoute, seferRoute } from './sefer';
import { executeJourney, replayJourney } from './engine';
import { partyAt } from '../sim/balance';
import { SCENARIOS } from '../sim/balance';
import { getMap } from '../map/maps';
import { getMonster } from '../data';
import type { JourneyEvent, JourneyState } from './types';

const volkan = seferById('volkan')!;

describe('Volkan Seferi verisi', () => {
  it('düğüm sırası salon → tapınak → köprü → demirhane → ejder → ödül; bağlantılar ödülden salona döner', () => {
    expect(volkan.nodes.map((n) => n.id)).toEqual(['salon', 'tapinak', 'kopru', 'demirhane', 'ejder', 'odul']);
    expect(volkan.edges.map((e) => `${e.from}>${e.to}`)).toEqual(['salon>tapinak', 'tapinak>kopru', 'kopru>demirhane', 'demirhane>ejder', 'ejder>odul', 'odul>salon']);
    expect(volkan.edges.filter((e) => e.style === 'dashed').map((e) => e.from)).toEqual(['salon', 'odul']);
    for (const n of volkan.nodes) { expect(n.x).toBeGreaterThanOrEqual(0); expect(n.x).toBeLessThanOrEqual(1); expect(n.y).toBeGreaterThanOrEqual(0); expect(n.y).toBeLessThanOrEqual(1); }
    expect(SEFERLER.length).toBeGreaterThan(0);
  });
  it('savaş düğümlerinin senaryosu var (3. ve 5. seviye listesi); ejder Volkan uyuyan ejderha (wyrmling), giriş batı, çıkış doğu', () => {
    for (const n of volkan.nodes.filter((x) => x.kind === 'battle')) {
      const sc = SCENARIOS.find((s) => s.id === n.scenario);
      expect(sc, n.id).toBeTruthy();
      for (const lv of [3, 5]) for (const id of Object.keys((sc as { byLevel?: Record<number, Record<string, number>> }).byLevel?.[lv] ?? sc!.enemies)) expect(() => getMonster(id)).not.toThrow();
    }
    const ejder = volkan.nodes.find((n) => n.id === 'ejder')!;
    expect(SCENARIOS.find((s) => s.id === ejder.scenario)?.map).toMatchObject({ mapId: 'volkan', variantId: 'uyuyan-ejderha', dragon: 'red-dragon-wyrmling' });
    const m = getMap('volkan');
    expect(ejder.giris?.every(([c]) => c <= 3)).toBe(true);
    expect(ejder.cikis?.every(([c]) => c === m.size.cols)).toBe(true);
  });
  it('güzergâh: sefer kimliği, ödül durağı savaşsız; geçişler ve ödül alınınca sefer biter; replay aynı', () => {
    const route = seferRoute(volkan, 3);
    expect(seferOfRoute(route)).toBe('volkan');
    expect(route.stops.map((s) => s.kind)).toEqual(['battle', 'battle', 'battle', 'battle', 'battle', 'reward']);
    expect(route.stops[4]?.goals).toBeTruthy();
    const events: JourneyEvent[] = [];
    let s: JourneyState | null = null;
    const run = (cmd: Parameters<typeof executeJourney>[1]) => { const r = executeJourney(s, cmd, () => 0.5); if (!r.ok) throw new Error(r.error); events.push(...r.events); s = r.state; return r.state; };
    run({ type: 'start', id: 's', route, seed: 1, difficulty: 'normal', progression: 'milestone', party: partyAt(3).map((sh, i) => ({ id: `p${i}`, name: sh.name, sheet: sh })) });
    for (let i = 0; i < 5; i++) {
      const cur = s as unknown as JourneyState;
      run({ type: 'battle_result', outcome: 'won', statuses: Object.fromEntries(cur.party.map((m) => [m.id, m.status])), xp: 100 });
      run({ type: 'advance' });
    }
    let cur = s as unknown as JourneyState;
    expect(cur.route.stops[cur.stop]?.id).toBe('odul');
    expect(cur.stopDone).toBe(false);
    expect(executeJourney(cur, { type: 'advance' }, () => 0.5).ok).toBe(false);
    run({ type: 'claim_reward' });
    cur = s as unknown as JourneyState;
    expect(cur.result).toBe('won');
    expect(cur.items).toEqual(['magic-items:cloak-of-protection', 'magic-items:potion-of-resistance']);
    expect(replayJourney(events)).toEqual(cur);
  });
});
