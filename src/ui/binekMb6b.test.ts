/**
 * Görev MB6b (yalnız arayüz; kural sürümü değişmez): binek düğmeleri (Binek bölümü), yığın jetonu, tur şeridi, kurulumda
 * "binmiş başla", önizleme kartında binme/inme maliyeti, günlükte inme ayrıntısı, TR/EN.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { startBattle } from '../battle/create';
import { execute } from '../battle/commands';
import { GM, P1, mk } from '../battle/fixtures';
import { getMonster } from '../data';
import { combatantFromMonster } from '../battle/create';
import { setLang, t } from '../i18n';
import { placeOf, costOfKey } from './actionMenu';
import { logEntries } from './logEntries';
import { movePreview } from './preview/movePreview';
import { hasPattern, reasonText } from './reasons';
import { mountActions, mountBadge, moverFor, ridersOnTop, riderStack, setupMountCandidates, stripMountOf } from './mountUi';
import type { Offset } from '../rules/hex';
import type { BattleEvent, BattleState, Combatant, Command, CommandContext } from '../battle/types';

const o = (col: number, row = 3): Offset => ({ col, row });
const flat = Array.from({ length: 7 }, () => '.'.repeat(15));
const PV = { on: true, detail: 'tam', hints: true } as never;
const DISC = { rows: {} } as never;

/** A binici (4,3), H savaş atı (5,3; eğitimli → kontrollü), B düşman (10,3). */
function scene(status: 'setup' | 'active' = 'active'): BattleState {
  const horse: Combatant = { ...combatantFromMonster(getMonster('warhorse'), { id: 'H' }), side: 'party', ownerId: 'p1' };
  const parts = [mk('A', { ownerId: 'p1', size: 'M', speed: 30, hp: 40, maxHp: 40 }), horse, mk('B', { side: 'enemies', hp: 50, maxHp: 50 })];
  const s0 = startBattle('b', 'd-z-zemin', parts, () => 0.5, { map: { id: 'col', variantId: 'gunduz', ruleToggles: { darkness: false, trap: false } } } as never).state;
  const cs = { ...s0.combatants };
  for (const [id, p] of Object.entries({ A: o(4), H: o(5), B: o(10) })) cs[id] = { ...(cs[id] as Combatant), pos: p };
  return { ...s0, status, round: 1, order: ['A', 'H', 'B'], turnIndex: 0, combatants: cs, map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: flat, objects: [] } };
}
const run = (s: BattleState, cmd: Command, ctx: CommandContext = P1) => { const r = execute(s, cmd, ctx, () => 0.5); if (!r.ok) throw new Error(r.error); return r; };
const C = (s: BattleState, id: string) => s.combatants[id] as Combatant;

afterEach(() => setLang('tr'));

describe('MB6b Binek bölümü (kontrollü bineğin eylemleri)', () => {
  it('kontrollü bineğin binicisine Dash/Disengage/Dodge (actorId = binek); motor kabul eder; binicisiz yok', () => {
    expect(mountActions(scene(), C(scene(), 'A'))).toBeNull();
    const s = run(scene(), { type: 'mount', actorId: 'A', mountId: 'H' }).state;
    const ma = mountActions(s, C(s, 'A'));
    expect(ma?.mount.id).toBe('H');
    expect(ma?.actions.map((a) => a.key)).toEqual(['dash', 'disengage', 'dodge']);
    for (const a of ma?.actions ?? []) expect(execute(s, a.cmd as Command, P1, () => 0.5).ok, a.key).toBe(true);
    // Eylem harcandıktan sonra ikinci eylem geçersiz: menü nedenini gösterir (motor gerekçesi).
    const dashed = run(s, { type: 'dash', actorId: 'H' }).state;
    expect(execute(dashed, { type: 'dodge', actorId: 'H' }, P1, () => 0.5).ok).toBe(false);
  });
  it('menü yeri Hareket alt menüsü; bonus eylemli binek eylemi hızlı eylem rozetli', () => {
    for (const k of ['mountDash', 'mountDisengage', 'mountDodge', 'mountSteed-fey-step']) expect(placeOf(k).area).toBe('move');
    expect(costOfKey('mountSteed-fey-step')).toBe('bonus');
  });
  it('hareket önizlemesi bineğin yaratığından (hızı 60 ft)', () => {
    const s = run(scene(), { type: 'mount', actorId: 'A', mountId: 'H' }).state;
    expect(moverFor(s, 'A')).toBe('H');
    expect(moverFor(scene(), 'A')).toBe('A');
  });
  it('kontrollü binek reddi gerekçeleri TR/EN kalıplı', () => {
    const msg = 'Savaş Atı kontrollü binek: eylemi yalnız Dash, Disengage ya da Dodge olur.';
    expect(hasPattern(msg)).toBe(true);
    expect(hasPattern('Binmiş başlatmayı kurulumda yalnızca Game Master seçer.')).toBe(true);
    setLang('en');
    expect(reasonText(msg, 'en')).toMatch(/controlled mount/);
  });
});

describe('MB6b yığın jetonu, rozet, tur şeridi', () => {
  it('binici üstte küçük ve yukarıda, binekten sonra çizilir; binek değil', () => {
    const s = run(scene(), { type: 'mount', actorId: 'A', mountId: 'H' }).state;
    expect(riderStack(s, C(s, 'A'))).toEqual({ scale: 0.72, lift: 0.55 });
    expect(riderStack(s, C(s, 'H'))).toBeNull();
    const xs = [{ c: C(s, 'A') }, { c: C(s, 'B') }, { c: C(s, 'H') }];
    expect(ridersOnTop(s, xs).map((x) => x.c.id)).toEqual(['B', 'H', 'A']);
  });
  it('rozet kontrollü / bağımsız; şeritte kontrollü binek gizli, binicinin kutusunda', () => {
    const s = run(scene(), { type: 'mount', actorId: 'A', mountId: 'H' }).state;
    expect(mountBadge(s, C(s, 'A'))).toBe('kontrollu');
    expect(mountBadge(s, C(s, 'H'))).toBe('kontrollu');
    expect(stripMountOf(s, 'H').hide).toBe(true);
    expect(stripMountOf(s, 'A').mount?.id).toBe('H');
    // Binici Incapacitated: binek bağımsız (MB2), şeritte kendi kutusunda.
    const inc = { ...s, combatants: { ...s.combatants, A: { ...C(s, 'A'), conditions: ['Incapacitated'] } } };
    expect(mountBadge(inc, C(inc, 'H'))).toBe('bagimsiz');
    expect(stripMountOf(inc, 'H').hide).toBe(false);
  });
});

describe('MB6b Game Master kurulumunda binmiş başla', () => {
  it('bitişik eğitimli binek aday; GM kurulumda biner ve indirir; oyuncu bağlamı reddedilir', () => {
    const s = scene('setup');
    expect(setupMountCandidates(s, 'A').map((m) => m.id)).toEqual(['H']);
    expect(execute(s, { type: 'mount', actorId: 'A', mountId: 'H' }, P1, () => 0.5).ok).toBe(false);
    const m = run(s, { type: 'mount', actorId: 'A', mountId: 'H' }, GM).state;
    expect(C(m, 'A').riding).toBe('H');
    expect(C(m, 'A').pos).toEqual(o(5));
    expect(setupMountCandidates(m, 'A')).toEqual([]);
    expect(C(run(m, { type: 'dismount', actorId: 'A' }, GM).state, 'A').riding).toBeUndefined();
    // Uzaktaki (bitişik olmayan) binek aday değil.
    const far = { ...s, combatants: { ...s.combatants, A: { ...C(s, 'A'), pos: o(1) } } };
    expect(setupMountCandidates(far, 'A')).toEqual([]);
  });
});

describe('MB6b önizleme kartı ve günlük', () => {
  it('binme ve inme maliyeti: hızın yarısı (15 ft), kalan hareket; binek kontrollü olur', () => {
    const pv = movePreview(scene(), { type: 'mount', actorId: 'A', mountId: 'H' }, P1, DISC, PV);
    expect(pv.mount).toEqual({ kind: 'mount', costFt: 15, leftFt: 15, control: 'kontrollu' });
    const s = run(scene(), { type: 'mount', actorId: 'A', mountId: 'H' }).state;
    expect(movePreview(s, { type: 'dismount', actorId: 'A' }, P1, DISC, PV).mount).toEqual({ kind: 'dismount', costFt: 15, leftFt: 0 });
  });
  it('inme satırı açılır ayrıntıda bineği ve harcanan hareketi yazar; binek 0 HP ise save\'siz iniş', () => {
    const s0 = scene();
    const r1 = run(s0, { type: 'mount', actorId: 'A', mountId: 'H' });
    const r2 = run(r1.state, { type: 'dismount', actorId: 'A' });
    const evs: BattleEvent[] = [{ type: 'battle_started', state: s0 }, ...r1.events, ...r2.events];
    const row = logEntries(evs, r2.state).find((e) => e.head.includes('binekten indi'));
    expect(row?.detail).toEqual([t().log.mountDetail.mount(C(s0, 'H').name), t().log.mountDetail.cost(15)]);
    const dead = { ...r2.state, combatants: { ...r2.state.combatants, H: { ...C(r2.state, 'H'), hp: 0 } } };
    expect(logEntries(evs, dead).find((e) => e.head.includes('binekten indi'))?.detail[0]).toMatch(/0 HP/);
  });
  it('TR/EN metinleri aynı yapıda', () => {
    const tr = t().battle.mb6b;
    setLang('en');
    const en = t().battle.mb6b;
    expect(Object.keys(en).sort()).toEqual(Object.keys(tr).sort());
    expect(en.act.dash).toBe('Mount: Dash');
    expect(t().battle.preview.mount(15, 15)).toMatch(/half your speed/);
  });
});
