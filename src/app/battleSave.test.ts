/** Savaşı kaydet/yükle: olay günlüğü baştan oynatılınca aynı durum; bozuk ya da eski kayıt çökmez. */
import { describe, it, expect } from 'vitest';
import { SCENARIOS, seeded } from '../sim/balance';
import { createMapBattle } from './setup';
import { combatantFromMonster, combatantFromSheet } from '../battle';
import { chooseCommand } from '../battle/ai';
import { getMonster } from '../data';
import { DEMO_SHEETS } from '../demo';
import { dispatch, type Session } from '../ui/session';
import { SAVE_KEY, SAVE_VERSION, hasSavedBattle, loadBattle, restoreSession, saveBattle, serializeSession } from './battleSave';

const memory = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); }, m }; };

/** Volkan (uyuyan ejderha) oturumu, birkaç tur yapay zekâyla oynanmış. */
function played(): Session {
  const s = SCENARIOS.find((x) => x.id === 'volkan-ejder') as (typeof SCENARIOS)[number];
  const party = Object.values(DEMO_SHEETS).map((sheet, i) => combatantFromSheet(sheet, { id: `pc${i}`, ownerId: `p${i}` }));
  const foes = Object.entries(s.enemies).flatMap(([id, n]) => Array.from({ length: n }, (_, k) => combatantFromMonster(getMonster(id), { id: `${id}-${k}` })));
  const rng = seeded(7);
  let sess = dispatch(createMapBattle([...party, ...foes], { ...(s.map as NonNullable<typeof s.map>), mirrored: false }, rng), { type: 'start_battle' }, rng);
  for (let i = 0; i < 60 && sess.state.status === 'active'; i++) {
    const cmd = chooseCommand(sess.state);
    const next = dispatch(sess, cmd, rng);
    sess = next.error && 'actorId' in cmd ? dispatch(sess, { type: 'end_turn', actorId: cmd.actorId }, rng) : next;
  }
  return sess;
}

describe('savaşı kaydet/yükle', () => {
  it('kaydet → yükle: aynı durum ve aynı günlük', () => {
    const sess = played();
    expect(sess.state.round).toBeGreaterThan(1);
    const store = memory();
    expect(saveBattle(sess, store)).toBe(true);
    expect(hasSavedBattle(store)).toBe(true);
    const r = loadBattle(store);
    if (!r.ok) throw new Error(r.error);
    expect(r.session.state).toEqual(sess.state);
    expect(r.session.events).toEqual(sess.events);
    expect(r.session.lines.length).toBe(sess.lines.length);
  });
  it('kayıt sürümlü; yüklenen savaş kaldığı yerden devam eder', () => {
    const sess = played();
    const file = JSON.parse(serializeSession(sess)) as { version: number };
    expect(file.version).toBe(SAVE_VERSION);
    const r = restoreSession(serializeSession(sess));
    if (!r.ok) throw new Error(r.error);
    if (r.session.state.status === 'active') {
      const cmd = chooseCommand(r.session.state);
      expect(dispatch(r.session, cmd, seeded(1)).state).toEqual(dispatch(sess, cmd, seeded(1)).state);
    }
  });
  it('sürüm 6 kayıt (kaynaklar üç alanlı nesne, sıfırlar dahil) yüklenir ve oynanmaya devam eder', () => {
    const sess = played();
    const old = sess.events.map((e) => (e.type !== 'battle_started' ? e : {
      ...e,
      state: {
        ...e.state,
        combatants: Object.fromEntries(Object.entries(e.state.combatants).map(([id, c]) => [id, {
          ...c, resources: { actionSurge: c.resources.actionSurge ?? 0, secondWind: c.resources.secondWind ?? 0, favoredEnemy: c.resources.favoredEnemy ?? 0 },
        }])),
      },
    }));
    const r = restoreSession(JSON.stringify({ version: 6, savedAt: '', events: old }));
    if (!r.ok) throw new Error(r.error);
    expect(r.session.state.round).toBe(sess.state.round);
    expect(Object.values(r.session.state.combatants).every((c) => typeof c.resources.secondWind === 'number')).toBe(true);
    if (r.session.state.status === 'active') expect(dispatch(r.session, chooseCommand(r.session.state), seeded(1)).error).toBeFalsy();
  });
  it('sürüm 3 kayıt (masum görünümü öncesi) hâlâ yüklenir', () => {
    const sess = played();
    const r = restoreSession(JSON.stringify({ version: 3, savedAt: '', events: sess.events }));
    if (!r.ok) throw new Error(r.error);
    expect(r.session.state).toEqual(sess.state);
  });
  it('kayıt yok, bozuk JSON, eski sürüm, boş ya da oynatılamayan günlük: hata fırlatmaz, "yüklenemedi" der', () => {
    expect(loadBattle(memory())).toEqual({ ok: false, error: 'Kayıt yok.' });
    const cases = ['{bozuk', JSON.stringify({ version: 0, events: [] }), JSON.stringify({ version: 1, events: played().events }), JSON.stringify({ version: 2, events: played().events }), JSON.stringify({ version: SAVE_VERSION, events: [] }),
      JSON.stringify({ version: SAVE_VERSION, events: [{ type: 'turn_ended' }] })];
    for (const text of cases) {
      const store = memory();
      store.setItem(SAVE_KEY, text);
      const r = loadBattle(store);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toMatch(/yüklenemedi/);
    }
    expect(loadBattle(null).ok).toBe(false);
  });
});
