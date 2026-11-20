/** Görev OD1C: hedeflerde altıgen ve nesne haritada seçilir: taslak, bekleyen durum, oturuma yazım, eski oda kaydı. */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { addDraftGoal, bindObject, draftFromGoals, isPending, normalizeDraft, pendingItems, resetForMap, resolveDraft, toggleHex } from '../oda/hedef';
import { GoalsPanel } from '../ui/gm/GoalsPanel';
import { withGoals } from '../ui/goalSetup';
import { createMapBattle } from '../app/setup';
import { combatantFromMonster, combatantFromSheet } from '../battle';
import { getMonster } from '../data';
import { DEMO_SHEETS } from '../demo';
import { seeded } from '../sim/balance';
import { dispatch, GM_CONTEXT } from '../ui/session';
import { normalizeRoom, newRoom } from '../oda/model';
import { goalHexes, goalStatus } from '../battle/goals';

const h = (col: number, row: number) => ({ col, row });

describe('OD1C taslak', () => {
  it('hedef türü eklenir; altıgen/nesne gereken hedef bekliyor; ötekiler tamam', () => {
    let d = addDraftGoal(null, 'reach');
    d = addDraftGoal(d, 'retrieve'); d = addDraftGoal(d, 'destroy'); d = addDraftGoal(d, 'defeat'); d = addDraftGoal(d, 'survive', { rounds: 5 });
    d = addDraftGoal(d, 'protect'); d = addDraftGoal(d, 'protect', { wantsObject: true });
    expect(d.list.map((g) => isPending(g))).toEqual([true, true, true, false, false, false, true]);
    const r = resolveDraft(d);
    expect(r.goals?.list.map((g) => g.kind)).toEqual(['defeat', 'survive', 'protect']);
    expect(r.pending.map((g) => g.kind)).toEqual(['reach', 'retrieve', 'destroy', 'protect']);
    expect(pendingItems(d).find((x) => x.kind === 'retrieve')?.needs).toEqual(['hex', 'object']);
  });
  it('altıgen işaretle (tekrar dokununca kalkar), nesne bağla → tamamlanır ve goals\'a doğru yazılır', () => {
    let d = addDraftGoal(addDraftGoal(null, 'reach'), 'retrieve');
    d = toggleHex(d, 'g1', h(3, 2)); d = toggleHex(d, 'g1', h(4, 2));
    expect(d.list[0]?.hexes).toEqual([h(3, 2), h(4, 2)]);
    d = toggleHex(d, 'g1', h(3, 2));
    expect(d.list[0]?.hexes).toEqual([h(4, 2)]);
    expect(toggleHex(d, 'g1', h(4, 2)).list[0]?.hexes).toBeUndefined();
    d = toggleHex(d, 'g2', h(9, 9)); d = bindObject(d, 'g2', 'o7');
    const r = resolveDraft(d);
    expect(r.pending).toEqual([]);
    expect(r.goals?.list).toEqual([{ id: 'g1', kind: 'reach', hexes: [h(4, 2)] }, { id: 'g2', kind: 'retrieve', hexes: [h(9, 9)], objectId: 'o7' }]);
  });
  it('nesne bekleyen başarısızlık koşulu goals\'a girmez, bağlanınca girer', () => {
    let d = { mode: 'all' as const, list: [], fail: [{ kind: 'object' as const, objectId: '' }] };
    expect(resolveDraft(d).goals).toBeNull();
    expect(pendingItems(d)[0]?.id).toBe('fail:0');
    d = bindObject(d, 'fail:0', 'o1') as typeof d;
    expect(resolveDraft(d).goals?.fail).toEqual([{ kind: 'object', objectId: 'o1' }]);
  });
  it('harita değişince koordinatlar ve nesne bağları sıfırlanır, tür kalır', () => {
    let d = bindObject(toggleHex(addDraftGoal(addDraftGoal(null, 'reach'), 'retrieve'), 'g2', h(1, 1)), 'g2', 'o1');
    d = toggleHex(d, 'g1', h(2, 2));
    const r = resetForMap(d);
    expect(r?.list.map((g) => [g.kind, g.hexes, g.objectId])).toEqual([['reach', undefined, undefined], ['retrieve', undefined, undefined]]);
    expect(resetForMap(undefined)).toBeUndefined();
  });
  it('haritanın hazır hedefleri taslağa çevrilir', () => {
    const d = draftFromGoals({ mode: 'any', list: [{ id: 'a', kind: 'reach', hexes: [h(1, 1)] }, { id: 'b', kind: 'defeat' }] });
    expect(d?.list.every((g) => !isPending(g))).toBe(true);
    expect(draftFromGoals(null)).toBeNull();
  });
});

describe('OD1C panel', () => {
  const render = (value: Parameters<typeof GoalsPanel>[0]['value'], objects: Array<{ id: string; kind: string }> = []) =>
    renderToStaticMarkup(createElement(GoalsPanel, { value, mapGoals: null, objects, size: { cols: 15, rows: 7 }, onChange: () => {} }));
  it('koordinat kutusu yok; bekleyen hedef "bekliyor" ve yönlendirme gösterir; "Haritada nesne yok" yazısı yok', () => {
    const d = addDraftGoal(addDraftGoal(null, 'reach'), 'destroy');
    const html = render(d);
    expect(html).not.toContain('sütun'); expect(html).not.toContain('Haritada nesne yok');
    expect(html).not.toMatch(/placeholder="[^"]*,/);
    expect(html).toContain('bekliyor'); expect(html).toContain('Haritada altıgen seç'); expect(html).toContain('Haritada nesne seç/yerleştir');
    expect(html).toContain('Haritaya girince nesne seç ya da yerleştir');
  });
});

describe('OD1C kurulumda oturuma yazım', () => {
  const session = () => {
    const party = Object.values(DEMO_SHEETS).slice(0, 2).map((sheet, i) => combatantFromSheet(sheet, { id: `pc${i}`, ownerId: `p${i}` }));
    const foes = [combatantFromMonster(getMonster('wolf'), { id: 'wolf-0' })];
    return createMapBattle([...party, ...foes], { mapId: 'col', variantId: 'gunduz' }, seeded(3));
  };
  it('nesne yerleştir → bağla → goals\'a yazılır; replay aynı; tamamlanmayan yok sayılır ve günlüğe girer', () => {
    let s = session();
    expect(s.state.status).toBe('setup');
    s = dispatch(s, { type: 'place_object', kind: 'chest', at: h(5, 1) }, Math.random, GM_CONTEXT);
    expect(s.error).toBeNull();
    const ob = s.state.map?.objects?.at(-1);
    expect(ob?.kind).toBe('chest');
    let d = addDraftGoal(addDraftGoal(addDraftGoal(null, 'retrieve'), 'reach'), 'defeat');
    d = bindObject(toggleHex(d, 'g1', h(14, 3)), 'g1', ob?.id ?? '');
    const patched = withGoals(s, resolveDraft(d).goals, undefined);
    expect(patched.state.goals?.list.map((g) => g.kind)).toEqual(['retrieve', 'defeat']);
    expect(goalHexes(patched.state)).toEqual(expect.arrayContaining([h(14, 3)]));
    expect(goalStatus(patched.state, patched.state.goals!.list[0]!)).toBe('open');
    // eksik hedef (reach, altıgensiz) yok sayıldı → not
    const noted = withGoals(s, resolveDraft(d).goals, '1 hedef tamamlanmadığı için yok sayıldı.');
    expect(noted.events.at(-1)).toMatchObject({ type: 'map_note' });
    expect(noted.lines.at(-1)).toContain('yok sayıldı');
    const started = dispatch(patched, { type: 'start_battle' }, seeded(1));
    expect(started.error).toBeNull();
    expect(started.state.goals?.list.length).toBe(2);
  });
  it('başladıktan sonra yazılmaz', () => {
    let s = session();
    s = dispatch(s, { type: 'start_battle' }, seeded(1));
    expect(withGoals(s, { mode: 'all', list: [{ id: 'x', kind: 'defeat' }] })).toBe(s);
  });
});

describe('OD1C oda kaydı', () => {
  it('hedef taslağı kayda yazılır ve okunur; eski kayıtta alan yok → undefined; bozuk girdi atılır', () => {
    const r = newRoom('a', 'A', 'now');
    expect(normalizeRoom(JSON.parse(JSON.stringify(r)))?.ayarlar.hedefler).toBeUndefined();
    const withDraft = { ...r, ayarlar: { ...r.ayarlar, hedefler: addDraftGoal(null, 'reach') } };
    expect(normalizeRoom(JSON.parse(JSON.stringify(withDraft)))?.ayarlar.hedefler?.list[0]).toMatchObject({ kind: 'reach' });
    expect(normalizeRoom(JSON.parse(JSON.stringify({ ...r, ayarlar: { ...r.ayarlar, hedefler: null } })))?.ayarlar.hedefler).toBeNull();
    expect(normalizeDraft({ mode: 'any', list: [{ kind: 'xx' }, 5, { kind: 'survive', rounds: 4 }] })?.list).toEqual([{ id: 'g3', kind: 'survive', rounds: 4 }]);
    expect(normalizeDraft('x')).toBeUndefined();
  });
});
