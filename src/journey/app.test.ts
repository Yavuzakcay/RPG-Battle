/**
 * Görev Y0/Y1/Y4: yolculuk kaydı (ayrı anahtar, sürüm, replay), deneysel bayrak (varsayılan kapalı), durak savaşı
 * (senaryo + kayıtlı durum) ve sonuç komutu, zincir simülasyonu (kısa duman).
 */
import { describe, expect, it } from 'vitest';
import route from '../../data/yolculuk/ilk-gun.json';
import { executeJourney } from './engine';
import { JOURNEY_KEY, loadJourney, saveJourney } from '../app/journeySave';
import { journeyEnabled, setJourneyEnabled } from '../app/features';
import { battleResultCommand, stopParticipants } from '../app/journeyBattle';
import { partyAt } from '../sim/balance';
import { simulateChain } from '../sim/chain';
import type { BattleState } from '../battle/types';
import type { JourneyRoute, JourneyState } from './types';

const R = route as unknown as JourneyRoute;
const memStore = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); }, removeItem: (k: string) => { m.delete(k); }, m }; };
function begin(): JourneyState {
  const sheets = partyAt(3);
  const r = executeJourney(null, { type: 'start', id: 'j', route: R, seed: 1, difficulty: 'normal', progression: 'milestone', party: sheets.map((sh, i) => ({ id: `p${i + 1}`, name: sh.name, sheet: sh })) }, () => 0.5);
  if (!r.ok) throw new Error(r.error);
  return r.state;
}

describe('yolculuk uygulama bağları', () => {
  it('kayıt ayrı anahtarda; olaylar baştan oynatılınca aynı durum; desteklenmeyen sürüm reddedilir', () => {
    const st = memStore();
    const r = executeJourney(null, { type: 'start', id: 'j', route: R, seed: 1, difficulty: 'normal', progression: 'milestone', party: [{ id: 'p1', name: 'A', sheet: partyAt(3)[0]! }] }, () => 0.5);
    if (!r.ok) throw new Error(r.error);
    saveJourney(r.events, st);
    expect([...st.m.keys()]).toEqual([JOURNEY_KEY]);
    expect(JOURNEY_KEY).toBe('rpg-battle-yolculuk');
    const back = loadJourney(st);
    expect(back.ok && back.state).toEqual(r.state);
    st.setItem(JOURNEY_KEY, JSON.stringify({ version: 99, events: [] }));
    expect(loadJourney(st).ok).toBe(false);
  });
  it('deneysel bayrak varsayılan kapalı; açılıp kapanır', () => {
    // Test ortamında localStorage yok: bellek deposu.
    (globalThis as { localStorage?: unknown }).localStorage = memStore();
    expect(journeyEnabled()).toBe(false);
    setJourneyEnabled(true);
    expect(journeyEnabled()).toBe(true);
    setJourneyEnabled(false);
    expect(journeyEnabled()).toBe(false);
  });
  it('durak savaşı: parti kayıtlı durumla, düşman senaryonun 3. seviye listesi; sonuç komutu durum ve XP taşır', () => {
    const j = begin();
    const p = stopParticipants(j);
    expect(p?.scenario.id).toBe('orman');
    expect(p?.participants.filter((c) => c.side === 'party').length).toBe(j.party.length);
    expect(p?.xp).toBeGreaterThan(0);
    const final = { status: 'finished', winner: 'party', combatants: Object.fromEntries(p!.participants.map((c) => [c.id, { ...c, hp: c.side === 'party' ? 7 : 0 }])) } as unknown as BattleState;
    const cmd = battleResultCommand(j, final);
    expect(cmd).toMatchObject({ type: 'battle_result', outcome: 'won', xp: p!.xp });
    expect(cmd.type === 'battle_result' && Object.values(cmd.statuses).every((s) => s.hp === 7)).toBe(true);
  });
  it('zincir: bir tohum güzergâhı oynar, ölçüleri döner', () => {
    const r = simulateChain(R, 1, 'standart');
    expect(r.deaths.length).toBeGreaterThan(0);
    expect(r.battlesWon).toBeGreaterThanOrEqual(0);
    expect(r.slotsLeft).toBeGreaterThanOrEqual(0);
  }, 60000);
});
