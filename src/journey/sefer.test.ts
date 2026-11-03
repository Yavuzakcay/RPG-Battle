/**
 * Kuyruk 18 V2/V3: sefer grafiği (data/seferler.json) → yolculuk güzergâhı; düğüm geçişleri, ödül durağı, ejder düğümünün
 * hedef ve girişi sefer verisinde; replay aynı.
 */
import { describe, expect, it } from 'vitest';
import { SEFERLER, seferById, seferOfRoute, seferRoute } from './sefer';
import { executeJourney, freeShortRest, longRestBlock, replayJourney } from './engine';
import { partyAt } from '../sim/balance';
import { SCENARIOS } from '../sim/balance';
import { getMap } from '../map/maps';
import { getMonster } from '../data';
import type { JourneyEvent, JourneyState } from './types';

const volkan = seferById('volkan')!;

describe('Volkan Seferi verisi', () => {
  it('düğüm sırası salon → tapınak → köprü → demirhane → ejder → ödül; bağlantılar ödülden salona döner', () => {
    // Kuyruk 19 V6: köprü ile demirhane arasında dinlenme durağı (kamp).
    expect(volkan.nodes.map((n) => n.id)).toEqual(['salon', 'tapinak', 'kopru', 'kamp', 'demirhane', 'ejder', 'odul']);
    expect(volkan.edges.map((e) => `${e.from}>${e.to}`)).toEqual(['salon>tapinak', 'tapinak>kopru', 'kopru>kamp', 'kamp>demirhane', 'demirhane>ejder', 'ejder>odul', 'odul>salon']);
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
    expect(route.stops.map((s) => s.kind)).toEqual(['battle', 'battle', 'battle', 'rest', 'battle', 'battle', 'reward']);
    expect(route.stops[5]?.goals).toBeTruthy();
    const events: JourneyEvent[] = [];
    let s: JourneyState | null = null;
    const run = (cmd: Parameters<typeof executeJourney>[1]) => { const r = executeJourney(s, cmd, () => 0.5); if (!r.ok) throw new Error(r.error); events.push(...r.events); s = r.state; return r.state; };
    run({ type: 'start', id: 's', route, seed: 1, difficulty: 'normal', progression: 'milestone', party: partyAt(3).map((sh, i) => ({ id: `p${i}`, name: sh.name, sheet: sh })) });
    for (let i = 0; i < 6; i++) {
      const cur = s as unknown as JourneyState;
      if (cur.route.stops[cur.stop]?.kind === 'rest') {
        // Kuyruk 19B V6: "Dinlenme" bir kez sınıra sayılmayan kısa dinlenme verir, ikincisi normal haktan düşer.
        // Denge turu (onaylı): kampa akşam varılır (13 saat yürüyüş), uzun dinlenme açıktır.
        expect(cur.stopDone).toBe(true);
        expect(longRestBlock(cur)).toBe(null);
        expect(executeJourney(cur, { type: 'long_rest' }, () => 0.5).ok).toBe(true);
        expect(freeShortRest(cur)).toBe(true);
        const before = cur.shortRests;
        const after = run({ type: 'short_rest', dice: {} });
        expect(after.shortRests).toBe(before);
        expect(after.freeRestAt).toBe('kamp');
        expect(freeShortRest(after)).toBe(false);
      } else run({ type: 'battle_result', outcome: 'won', statuses: Object.fromEntries(cur.party.map((m) => [m.id, m.status])), xp: 100 });
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

describe('V4 sefer haritası düğüm durumu', () => {
  it('geçilen düğüm tamam, bulunulan güncel, ileridekiler karanlık; sefer kazanılınca hepsi tamam', async () => {
    const { nodeState } = await import('../screens/SeferMap');
    expect([0, 1, 2, 3].map((i) => nodeState({ stop: 2, result: null }, i))).toEqual(['done', 'done', 'current', 'todo']);
    expect([4, 5].map((i) => nodeState({ stop: 5, result: 'won' }, i))).toEqual(['done', 'done']);
    expect(nodeState({ stop: 1, result: 'lost' }, 1)).toBe('current');
    // Kuyruk 19 V6: kayıttaki güzergâhta olmayan düğüm (eski kayıt, sonradan eklenen kamp) karanlık kalır.
    expect(nodeState({ stop: 3, result: null }, -1)).toBe('todo');
  });
});

describe('Kuyruk 19B V6: serbest kısa dinlenme yalnızca bayraklı durakta', () => {
  it('bayraksız dinlenme yerinde (eski güzergâhlar) serbest kısa dinlenme yok', () => {
    const route = { ...seferRoute(volkan, 3) };
    route.stops = route.stops.map((s) => ({ ...s, kisaDinlenme: false }));
    const r = executeJourney(null, { type: 'start', id: 'x', route, seed: 1, difficulty: 'normal', progression: 'milestone', party: partyAt(3).slice(0, 1).map((sh, i) => ({ id: `p${i}`, name: sh.name, sheet: sh })) }, () => 0.5);
    if (!r.ok) throw new Error(r.error);
    expect(freeShortRest({ ...r.state, stop: 3, stopDone: true })).toBe(false);
    // Kuyruk 21 D3: kamp Kanyon Köprüsü etiketiyle çakışmasın diye y 0.40 → 0.47.
    expect(volkan.nodes.find((n) => n.id === 'kamp')).toMatchObject({ kind: 'rest', kisaDinlenme: true, x: 0.14, y: 0.47, name: { tr: 'Dinlenme' } });
  });
});

describe('Derinlikler seferi: dallanan güzergâh (Kuyruk 21 D3)', () => {
  const der = seferById('derinlikler')!;
  const party = partyAt(5).slice(0, 2).map((sh, i) => ({ id: `p${i}`, name: sh.name, sheet: sh }));
  const go = (s: JourneyState | null, cmd: Parameters<typeof executeJourney>[1], log: JourneyEvent[]) => {
    const r = executeJourney(s, cmd, () => 0.5);
    if (!r.ok) throw new Error(r.error);
    log.push(...r.events);
    return r.state;
  };
  const win = (s: JourneyState, log: JourneyEvent[]) => go(s, { type: 'battle_result', outcome: 'won', statuses: Object.fromEntries(s.party.map((m) => [m.id, m.status])), xp: 100 }, log);
  it('veri: 5 ve 7. seviye, düğüm konumları, kenarlardan sonraki duraklar; Volkan doğrusal kalır', () => {
    expect(der.levels).toEqual([5, 7]);
    const at = Object.fromEntries(der.nodes.map((n) => [n.id, [n.x, n.y]]));
    expect(at).toMatchObject({ karakol: [0.10, 0.20], dinlenme: [0.22, 0.40], mezar: [0.38, 0.50], lav: [0.25, 0.80], 'volkan-cikis': [0.10, 0.88], mantar: [0.55, 0.40], mesale: [0.70, 0.30], merdiven: [0.82, 0.50], hazine: [0.92, 0.25] });
    const r = seferRoute(der, 5);
    expect(r.branching).toBe(true);
    const next = Object.fromEntries(r.stops.map((s) => [s.id, s.next]));
    expect(next).toMatchObject({ karakol: ['dinlenme'], dinlenme: ['mezar'], mezar: ['mantar', 'lav'], mantar: ['gece-kampi'], 'gece-kampi': ['sandik'], sandik: ['mesale'], mesale: ['merdiven'], merdiven: ['hazine'], hazine: [], lav: ['volkan-cikis'], 'volkan-cikis': [] });
    expect(r.stops.find((s) => s.id === 'hazine')?.reward).toEqual({ gold: 600, potions: 2, items: ['magic-items:cloak-of-protection', 'magic-items:ring-of-protection'] });
    expect(r.stops.find((s) => s.id === 'merdiven')?.scenario).toBe('derin-merdiven');
    for (const s of r.stops) if (s.scenario) expect(SCENARIOS.some((x) => x.id === s.scenario), s.scenario).toBe(true);
    const v = seferRoute(volkan, 3);
    expect(v.branching).toBeUndefined();
    expect(v.stops.some((s) => 'next' in s)).toBe(false);
  });
  it('mantar dalı: tuzaklı sandık olayı yutar, zindan zinciri hazinede ganimetle biter; replay aynı', () => {
    const log: JourneyEvent[] = [];
    let s = go(null, { type: 'start', id: 'd', route: seferRoute(der, 5), seed: 1, difficulty: 'normal', progression: 'milestone', party }, log);
    s = win(s, log);
    s = go(s, { type: 'advance' }, log);
    expect(s.route.stops[s.stop]?.id).toBe('dinlenme');
    s = go(s, { type: 'advance' }, log);
    s = win(s, log);
    expect(executeJourney(s, { type: 'advance' }, () => 0.5).ok).toBe(false);
    expect(executeJourney(s, { type: 'advance', to: 'hazine' }, () => 0.5).ok).toBe(false);
    s = go(s, { type: 'advance', to: 'mantar' }, log);
    s = win(s, log);
    s = go(s, { type: 'advance' }, log);
    // Denge turu (onaylı): uzun yolda akşama varılan Gece Kampı, uzun dinlenme açık.
    expect(s.route.stops[s.stop]).toMatchObject({ id: 'gece-kampi', kind: 'rest' });
    expect(longRestBlock(s)).toBe(null);
    s = go(s, { type: 'advance' }, log);
    expect(s.route.stops[s.stop]).toMatchObject({ id: 'sandik', kind: 'event' });
    expect(s.stopDone).toBe(true);
    expect(s.route.stops[s.stop]?.anlatim?.tr).toContain('yutar');
    for (const id of ['mesale', 'merdiven', 'hazine']) {
      s = go(s, { type: 'advance' }, log);
      expect(s.route.stops[s.stop]?.id).toBe(id);
      s = win(s, log);
    }
    expect(s.result).toBe('won');
    expect(s.items).toEqual(['magic-items:cloak-of-protection', 'magic-items:ring-of-protection']);
    expect(s.gold).toBeGreaterThanOrEqual(600);
    expect(s.path).toEqual(['karakol', 'dinlenme', 'mezar', 'mantar', 'gece-kampi', 'sandik', 'mesale', 'merdiven', 'hazine']);
    expect(replayJourney(log)).toEqual(s);
  });
  it('lav dalı: volkan çıkışı (ganimetsiz) seferi bitirir; seçilmeyen dal gidilmemiş', async () => {
    const { nodeState } = await import('../screens/SeferMap');
    const log: JourneyEvent[] = [];
    let s = go(null, { type: 'start', id: 'd', route: seferRoute(der, 7), seed: 1, difficulty: 'normal', progression: 'milestone', party }, log);
    s = win(s, log); s = go(s, { type: 'advance' }, log); s = go(s, { type: 'advance' }, log); s = win(s, log);
    s = go(s, { type: 'advance', to: 'lav' }, log);
    s = win(s, log);
    expect(s.result).toBeNull();
    s = go(s, { type: 'advance' }, log);
    expect(s.route.stops[s.stop]?.id).toBe('volkan-cikis');
    s = go(s, { type: 'claim_reward' }, log);
    expect(s.result).toBe('won');
    const idx = (id: string) => s.route.stops.findIndex((x) => x.id === id);
    expect(nodeState(s, idx('mezar'))).toBe('done');
    expect(nodeState(s, idx('mantar'))).toBe('todo');
    expect(nodeState(s, idx('volkan-cikis'))).toBe('done');
  });
});
