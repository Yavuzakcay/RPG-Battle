/**
 * Kuyruk K48 Adım B: Moral'ın Serüven katmanı (anahtar `moralSistemi`; hafif mod savaşa etki etmez). Kayıp/kazanç,
 * savaş dışında 0 → Moral ölümü, diriltme (Moral 1), anahtar kapalıyken eski davranış, replay.
 */
import { describe, expect, it } from 'vitest';
import { executeSeruven, replaySeruven, type SeruvenCommand, type SeruvenEvent, type SeruvenState } from './seruven';
import { memberMoral, memberMoralMax, moralDeltas, moralStatuses } from './moral';
import { moralHouse, seruvenBattleSession } from '../app/seruvenBattle';
import { partyAt } from '../sim/balance';
import { moralDeathText } from '../rules/moral';

type G = { state: SeruvenState; events: SeruvenEvent[] };
function begin(toggles: Record<string, boolean> = { moralSistemi: true }): G {
  const r = executeSeruven(null, { type: 'start', id: 's', seed: 1, toggles: { irkBaslangic: false, ...toggles }, party: partyAt(3).map((sh, i) => ({ id: `p${i + 1}`, name: sh.name, sheet: sh })) });
  if (!r.ok) throw new Error(r.error);
  return { state: r.state, events: r.events };
}
function step(g: G, cmd: SeruvenCommand): G {
  const r = executeSeruven(g.state, cmd);
  if (!r.ok) throw new Error(r.error);
  return { state: r.state, events: [...g.events, ...r.events] };
}
const moralOf = (g: G, id: string) => memberMoral(g.state.party.find((m) => m.id === id)!);
const maxOf = (g: G, id: string) => memberMoralMax(g.state.party.find((m) => m.id === id)!);

describe('Moral (Serüven)', () => {
  it('kapalıyken olay yok, durumlarda Moral alanı yok', () => {
    let g = begin({});
    g = step(step(g, { type: 'move', to: 'acik-buzul' }), { type: 'battle_result', node: 'acik-buzul', outcome: 'lost', statuses: {}, xp: 0 });
    expect(g.events.some((e) => e.type === 'seruven_moral')).toBe(false);
    expect(g.state.party.every((m) => m.status.moral === undefined)).toBe(true);
  });
  it('hafif mod: yenilgi −2, dost düşünce öbürleri −1 (bozgun dinlenmesi kapalı); replay', () => {
    let g = begin({ moralSistemi: true, bozgundaYenidenDene: false });
    const p1 = g.state.party[0]!;
    const down = { ...p1.status, hp: 0 };
    g = step(step(g, { type: 'move', to: 'acik-buzul' }), { type: 'battle_result', node: 'acik-buzul', outcome: 'lost', statuses: { p1: down }, xp: 0 });
    const ev = g.events.find((e) => e.type === 'seruven_moral') as Extract<SeruvenEvent, { type: 'seruven_moral' }>;
    expect(ev.reasons).toEqual(expect.arrayContaining(['dostDustu', 'yenilgi']));
    expect(moralOf(g, 'p2')).toBe(maxOf(g, 'p2') - 3);
    expect(moralOf(g, 'p1')).toBe(maxOf(g, 'p1') - 2);
    expect(replaySeruven(g.events)).toEqual(g.state);
  });
  it('han: hepsi dolar; kamp (dinlenme): yarısı', () => {
    const g = begin();
    const st = { ...g.state, party: g.state.party.map((m) => ({ ...m, status: { ...m.status, moral: 1 } })) };
    const inn = moralStatuses(st, moralDeltas(st, st, [{ type: 'seruven_inn' }], false));
    expect(inn.statuses.p1?.moral).toBe(maxOf(g, 'p1'));
    const camp = moralStatuses(st, moralDeltas(st, st, [{ type: 'seruven_rested' }], false));
    expect(camp.statuses.p1?.moral).toBe(Math.min(maxOf(g, 'p1'), 1 + Math.ceil(maxOf(g, 'p1') / 2)));
  });
  it('savaş dışında 0: Moral ölümü (dead + moralOlum; önce kayıp, sonra dinlenme); diriltme Moral 1 ile', () => {
    let g = begin();
    g = { ...g, state: { ...g.state, gold: 1000, party: g.state.party.map((m, i) => ({ ...m, status: { ...m.status, moral: i === 0 ? 1 : 9 } })) } };
    g = step(step(g, { type: 'move', to: 'acik-buzul' }), { type: 'battle_result', node: 'acik-buzul', outcome: 'lost', statuses: {}, xp: 0 });
    const p1 = g.state.party[0]!;
    expect(p1.status).toMatchObject({ dead: true, moralOlum: true, moral: 0 });
    const ev = g.events.find((e) => e.type === 'seruven_moral') as Extract<SeruvenEvent, { type: 'seruven_moral' }>;
    expect(ev.deaths).toEqual(['p1']);
    expect(moralDeathText('Ada', 'tr')).toBe('Ada umudunu yitirdi, sönüp gitti.');
    // Tapınak yok: reddedilir; tapınaklı yerleşimde altınla dirilir.
    expect(executeSeruven(g.state, { type: 'moral_dirilt', memberId: 'p1', yol: 'tapinak' }).ok).toBe(false);
    const inTemple = { ...g.state, yerlesim: { id: 'beyaz-sehir', map: null, from: null, seen: [] } };
    const r = executeSeruven(inTemple, { type: 'moral_dirilt', memberId: 'p1', yol: 'tapinak' });
    if (!r.ok) throw new Error(r.error);
    const back = r.state.party[0]!;
    expect(back.status.dead).toBeUndefined();
    expect(back.status.moralOlum).toBeUndefined();
    expect(back.status.moral).toBe(1);
    expect(back.status.hp).toBe(1);
    expect(r.state.gold).toBe(700);
  });
  it('hafif mod savaşa etki etmez; tam mod savaşta ev kuralı açar', () => {
    const light = begin();
    expect(moralHouse(light.state)).toEqual({});
    const full = begin({ moralSistemi: true, moralTam: true });
    expect(moralHouse(full.state)).toEqual({ houseRules: { moralSistemi: true } });
    const g = step(full, { type: 'move', to: 'acik-buzul' });
    const ses = seruvenBattleSession(g.state, 'acik-buzul', () => 0.5);
    const pcs = Object.values(ses?.state.combatants ?? {}).filter((c) => c.side === 'party' && !c.civilian);
    expect(pcs.length).toBeGreaterThan(0);
    expect(pcs.every((c) => c.moralMax !== undefined)).toBe(true);
    const ses2 = seruvenBattleSession(step(light, { type: 'move', to: 'acik-buzul' }).state, 'acik-buzul', () => 0.5);
    expect(Object.values(ses2?.state.combatants ?? {}).every((c) => c.moralMax === undefined)).toBe(true);
  });
  it('tam mod: savaş sonucu çift sayılmaz (dost düştü/yenilgi savaştan gelir)', () => {
    let g = begin({ moralSistemi: true, moralTam: true });
    g = step(step(g, { type: 'move', to: 'acik-buzul' }), { type: 'battle_result', node: 'acik-buzul', outcome: 'lost', statuses: {}, xp: 0 });
    expect(g.events.some((e) => e.type === 'seruven_moral' && e.reasons.includes('yenilgi'))).toBe(false);
  });
});
