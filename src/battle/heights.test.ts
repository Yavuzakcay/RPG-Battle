/**
 * Kuyruk 26 (H3): yükseklik katmanı (kural sürümü 6, Game Master anahtarları heightMove/heightFall/heightCombat/heightSight).
 * Fikstür: `src/map/fixtures/yukseklikSahnesi.ts` (sırt 4. sütun seviye 1, plato 7–9. sütun seviye 2, rampa (6, 3)).
 */
import { describe, expect, it, vi } from 'vitest';
vi.mock('../map/maps', async (importOriginal) => (await import('../map/fixtures/yukseklikSahnesi')).withYukseklik(await importOriginal()));
import { execute } from './commands';
import { startBattle } from './create';
import { GM, P1, mk } from './fixtures';
import { applyEvents, replay } from './reduce';
import { moveCostFn } from './movement';
import { heightOf, lineOfFire } from './cover';
import { heightAt, isCliff, rangeBonusFt, rampEdges } from './heights';
import { pushOutcome } from './forced';
import { climbTargets, collapseFallEvents } from './climb';
import { chooseCommand } from './ai';
import { currentActorId } from './common';
import { contextFor, createSession } from '../ui/session';
import { restoreSession, serializeSession } from '../app/battleSave';
import { attackSources } from '../rules/conditions';
import { YUKSEKLIK_SAHNESI } from '../map/fixtures/yukseklikSahnesi';
import { loadMap, validateMap } from '../map/maps';
import { seededRng, type Rng } from '../rules/dice';
import type { Offset } from '../rules/hex';
import type { BattleEvent, BattleState, Combatant } from './types';

const o = (col: number, row: number): Offset => ({ col, row });
const high: Rng = () => 0.99;
const low: Rng = () => 0.01;
const MAP = 'yukseklik-sahnesi';

function scene(at: Offset, b: Offset = o(13, 6), opt: { v?: number; toggles?: Record<string, boolean>; a?: Partial<Combatant> } = {}): { st: BattleState; events: BattleEvent[] } {
  const r = startBattle('k26', 'da-u-urum', [mk('A', { ownerId: 'p1', ...opt.a }), mk('B', { side: 'enemies' })], () => 0.5, {
    map: { id: MAP, ...(opt.toggles ? { ruleToggles: opt.toggles } : {}) }, ...(opt.v ? { kuralSurumu: opt.v } : {}),
  });
  const st = { ...r.state, status: 'active', order: ['A', 'B'], turnIndex: 0, round: 1,
    combatants: { A: { ...(r.state.combatants.A as Combatant), pos: at, movementUsed: 0 }, B: { ...(r.state.combatants.B as Combatant), pos: b } } } as BattleState;
  return { st, events: r.events };
}
const A = (s: BattleState) => s.combatants.A as Combatant;
const run = (s: BattleState, cmd: Parameters<typeof execute>[1], rng: Rng = high) => execute(s, cmd, P1, rng);

describe('K26: veri ve yükleyici', () => {
  it('katman ve rampa yüklenir; seviye yardımcıları', () => {
    const { st } = scene(o(1, 1));
    expect(st.map?.heights?.[3]?.[6]).toBe(2);
    expect(st.map?.ramps).toEqual(['6,3']);
    expect(heightAt(st, o(8, 2))).toBe(2);
    expect(isCliff(st, o(6, 2), o(7, 2))).toBe(true);
    expect(isCliff(st, o(5, 3), o(6, 3))).toBe(false); // rampa
  });
  it('doğrulama: boyut ve aralık', () => {
    expect(validateMap(YUKSEKLIK_SAHNESI)).toEqual([]);
    const bad = { ...YUKSEKLIK_SAHNESI, heights: [...(YUKSEKLIK_SAHNESI.heights ?? []).slice(0, 6), Array(15).fill(9)] };
    expect(validateMap(bad).some((e) => e.includes('-3..8'))).toBe(true);
    const short = { ...YUKSEKLIK_SAHNESI, heights: (YUKSEKLIK_SAHNESI.heights ?? []).slice(0, 5) };
    expect(validateMap(short).some((e) => e.includes('7 satır'))).toBe(true);
    expect(() => loadMap(bad)).toThrow();
  });
  it('katmansız haritada seviye zeminden (H, h = 1; z = 2) ve mekanik yok', () => {
    const st = startBattle('k26', 'da-u-urum', [mk('A', { ownerId: 'p1' }), mk('B', { side: 'enemies' })], () => 0.5, { map: { id: 'dag' } }).state;
    expect(st.map?.heights).toBeUndefined();
    const z = st.map!.tiles.findIndex((r) => r.includes('z'));
    expect(heightAt(st, o(st.map!.tiles[z]!.indexOf('z'), z))).toBe(2);
    expect(climbTargets({ ...st, combatants: { ...st.combatants, A: { ...(st.combatants.A as Combatant), pos: o(7, 1) } } }, { ...(st.combatants.A as Combatant), pos: o(7, 1) })).toEqual([]);
  });
});

describe('K26: hareket', () => {
  it('bir seviye çıkmak 1 + 1 hareket; inmek normal', () => {
    const { st } = scene(o(3, 1));
    const cost = moveCostFn(st, A(st));
    expect(cost(o(4, 1), o(3, 1))).toBe(2);
    expect(cost(o(5, 1), o(4, 1))).toBe(1);
    const r = run(st, { type: 'move', actorId: 'A', to: o(4, 1) });
    expect(r.ok && r.events.find((e) => e.type === 'moved')).toMatchObject({ cost: 2 });
  });
  it('2 seviye fark yürünmez; rampadan geçilir', () => {
    const { st } = scene(o(6, 2));
    expect(moveCostFn(st, A(st))(o(7, 2), o(6, 2))).toBeNull();
    const r = run(st, { type: 'move', actorId: 'A', to: o(7, 2) });
    expect(r.ok).toBe(true);
    const path = r.ok ? (r.events.find((e) => e.type === 'moved') as Extract<BattleEvent, { type: 'moved' }>).path : [];
    expect(path.some((h) => h.col === 6 && h.row === 3)).toBe(true);
  });
  // Kuyruk K71b: Atletizm DC 12 ve hareket sonu sürüm 56'ya kadar; 57+'da tek tırmanma kuralı (`k71b.test.ts`).
  it('tırmanma: Atletizm geçer (çıkar) ya da geçmez (hareket biter, yer aynı) — sürüm 56', () => {
    const { st } = scene(o(6, 2), o(13, 6), { v: 56 });
    expect(climbTargets(st, A(st)).some((h) => h.col === 7 && h.row === 2)).toBe(true);
    const ok = run(st, { type: 'climb', actorId: 'A', to: o(7, 2) }, high);
    expect(ok.ok && A(ok.state).pos).toEqual(o(7, 2));
    expect(ok.ok && A(ok.state).movementUsed).toBe(3);
    const no = run(st, { type: 'climb', actorId: 'A', to: o(7, 2) }, low);
    expect(no.ok && A(no.state).pos).toEqual(o(6, 2));
    expect(no.ok && A(no.state).movementUsed).toBeGreaterThanOrEqual(6);
    const roll = no.ok ? no.events.find((e) => e.type === 'map_effect') : undefined;
    expect(roll).toMatchObject({ rule: 'heightClimb', stopMovement: true });
  });
  it('Game Master "tırmanma" anahtarı kapalı ya da eski kural sürümü: eski davranış (duvar yok, ek maliyet yok)', () => {
    for (const s of [scene(o(6, 2), undefined, { toggles: { heightMove: false } }).st, scene(o(6, 2), undefined, { v: 5 }).st]) {
      expect(moveCostFn(s, A(s))(o(7, 2), o(6, 2))).toBe(1);
      expect(run(s, { type: 'climb', actorId: 'A', to: o(7, 2) }).ok).toBe(false);
    }
  });
  it('uçan yaratık muaf', () => {
    const { st } = scene(o(6, 2), undefined, { a: { fly: 30 } });
    expect(moveCostFn(st, A(st))(o(7, 2), o(6, 2))).toBe(1);
  });
});

describe('K26: düşme', () => {
  it('aşağı atlama: 20 ft → 2d6 ezici hasar ve Prone; olay kayıtta', () => {
    const { st } = scene(o(7, 2), undefined, { a: { hp: 40, maxHp: 40 } });
    const r = run(st, { type: 'climb', actorId: 'A', to: o(6, 2) }, () => 0.5);
    expect(r.ok).toBe(true);
    const fall = r.ok ? r.events.find((e) => e.type === 'map_effect' && e.rule === 'fall') as Extract<BattleEvent, { type: 'map_effect' }> : undefined;
    expect(fall?.damage?.rolls.length).toBe(2);
    expect(A(r.ok ? r.state : st).conditions).toContain('Prone');
  });
  it('itilerek düşme seviye farkıyla; anahtar kapalıyken hasarsız itilme', () => {
    const { st } = scene(o(7, 2));
    expect(pushOutcome(st, A(st), o(7, 2), o(6, 2))).toMatchObject({ ok: true, kind: 'fall', fallFeet: 20 });
    expect(pushOutcome(st, A(st), o(6, 2), o(7, 2))).toMatchObject({ ok: false });
    const off = scene(o(7, 2), undefined, { toggles: { heightFall: false } }).st;
    expect(pushOutcome(off, A(off), o(7, 2), o(6, 2))).toMatchObject({ ok: true, kind: 'move' });
  });
  it('zemin uçuruma dönerse üstündeki düşer', () => {
    const { st } = scene(o(2, 2), undefined, { a: { hp: 60, maxHp: 60 } });
    const sunk: BattleEvent = { type: 'tile_changed', at: o(2, 2), to: 'u' };
    const evs = collapseFallEvents(applyEvents(st, [sunk]), [sunk], () => 0.5);
    expect(evs.find((e) => e.type === 'map_effect' && e.rule === 'fall')).toMatchObject({ text: '30 ft düştü' });
  });
});

describe('K26: yüksek zemin, menzil, siper, görüş', () => {
  it('platodan saldıran avantajlı, aşağıdan dezavantajlı; anahtar kapalıyken eski (zemin) yükseklik', () => {
    const { st } = scene(o(7, 2), o(6, 2));
    expect(heightOf(st, A(st))).toBe(2);
    expect(heightOf(st, st.combatants.B as Combatant)).toBe(0);
    const src = attackSources({ attackerHeight: 2, targetHeight: 0, attackerConditions: [], targetConditions: [], ranged: false, spell: false } as never);
    expect(src[0]?.effect).toBe('advantage');
    const off = scene(o(7, 2), o(6, 2), { toggles: { heightCombat: false } }).st;
    expect(heightOf(off, A(off))).toBe(0);
  });
  it('2+ seviye üstten menzil +1 altıgen', () => {
    const { st } = scene(o(8, 2));
    expect(rangeBonusFt(st, o(8, 2), o(12, 2))).toBe(5);
    expect(rangeBonusFt(st, o(12, 2), o(8, 2))).toBe(0);
  });
  // Kuyruk K71d: 2B seviye kuralı sürüm 58 ve altında (59+ geometrik: `k71d.test.ts`).
  it('sırt iki uçtan yüksekse görüş kapalı, eşitse açık; kenar yarım siper (sürüm 58)', () => {
    const { st } = scene(o(3, 1), o(5, 1), { v: 58 });
    expect(lineOfFire(st, A(st), st.combatants.B as Combatant)).toMatchObject({ blocked: true, blockedBy: 'yükselti' });
    const off = scene(o(3, 1), o(5, 1), { toggles: { heightSight: false }, v: 58 }).st;
    expect(lineOfFire(off, A(off), off.combatants.B as Combatant).blocked).toBe(false);
    const eq = scene(o(4, 0), o(4, 2), { v: 58 }).st;
    expect(lineOfFire(eq, A(eq), eq.combatants.B as Combatant).blocked).toBe(false);
    const ledge = scene(o(8, 2), o(10, 2), { v: 58 }).st;
    expect(lineOfFire(ledge, A(ledge), ledge.combatants.B as Combatant).cover).toBe(2);
  });
});

describe('K26: kayıt', () => {
  // Kuyruk K71d: 59+'da 20 ft uçurum SRD maliyetiyle (9 altıgen) tek turda tırmanılmaz; kayıt denetimi sürüm 58'de.
  it('katmanlı savaş kaydedilir ve yüklenir; katman, anahtarlar ve tırmanma sonucu aynı', () => {
    const { st, events } = scene(o(6, 2), undefined, { toggles: { heightShow: false }, v: 58 });
    const r = run(st, { type: 'climb', actorId: 'A', to: o(7, 2) }, high);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const session = createSession(r.state, [{ type: 'battle_started', state: st }, ...r.events]);
    void events;
    const back = restoreSession(serializeSession(session));
    expect(back.ok).toBe(true);
    if (!back.ok) return;
    expect(back.session.state).toEqual(r.state);
    expect(back.session.state.map?.heights).toEqual(st.map?.heights);
    expect(back.session.state.map?.ruleToggles).toEqual({ heightShow: false });
  });
});

describe('K26: arayüz yardımcıları, yapay zekâ, replay', () => {
  it('rampa oku platoya bakar', () => {
    const { st } = scene(o(1, 1));
    expect(rampEdges(st).some((e) => e.to.col === 6 && e.to.row === 3 && e.from.col === 5)).toBe(true);
    const off = scene(o(1, 1), undefined, { toggles: { heightShow: false } }).st;
    expect(rampEdges(off)).toEqual([]);
  });
  it('yapay zekâ savaşı: uçurumdan yürümez, tırmanma komutu vermez, rampayı kullanır; replay aynı', () => {
    const r = startBattle('k26ai', 'da-u-urum', [mk('A', { ownerId: 'p1' }), mk('C', { ownerId: 'p1' }), mk('B', { side: 'enemies' }), mk('D', { side: 'enemies' })], seededRng(3), { map: { id: MAP } });
    const s0 = { ...r.state, status: 'active', order: ['A', 'C', 'B', 'D'], turnIndex: 0, round: 1,
      combatants: { ...r.state.combatants, A: { ...(r.state.combatants.A as Combatant), pos: o(1, 3) }, C: { ...(r.state.combatants.C as Combatant), pos: o(1, 4) },
        B: { ...(r.state.combatants.B as Combatant), pos: o(8, 3) }, D: { ...(r.state.combatants.D as Combatant), pos: o(8, 4) } } } as BattleState;
    const rng = seededRng(11);
    let s = s0;
    const events: BattleEvent[] = [];
    const cmds: string[] = [];
    for (let guard = 0; guard < 120 && s.status === 'active' && s.round <= 4; guard++) {
      const cmd = chooseCommand(s);
      cmds.push(cmd.type);
      const res = execute(s, cmd, contextFor(s, 'actorId' in cmd ? cmd.actorId : ''), rng);
      if (!res.ok) { const id = currentActorId(s); const e = execute(s, { type: 'end_turn', actorId: id }, contextFor(s, id), rng); if (!e.ok) break; events.push(...e.events); s = e.state; continue; }
      events.push(...res.events); s = res.state;
    }
    expect(cmds).not.toContain('climb');
    const moves = events.filter((e): e is Extract<BattleEvent, { type: 'moved' }> => e.type === 'moved');
    expect(moves.length).toBeGreaterThan(0);
    for (const m of moves) {
      for (let i = 1; i < m.path.length; i++) expect(isCliff(s0, m.path[i - 1] as Offset, m.path[i] as Offset)).toBe(false);
    }
    expect(moves.some((m) => m.path.some((h) => h.col === 6 && h.row === 3))).toBe(true);
    expect(replay([{ type: 'battle_started', state: s0 }, ...events])).toEqual(s);
  });
});
