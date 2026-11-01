/**
 * Kuyruk 32: Serüven tamamlama. Volkan koordinatları, Derinlikler resim oranı, dinlenme düğümü, Heykel Mağarası (bayraklı
 * düğüm), seviye atlama, yeraltı nehri bağlantısı (sınav, yeniden deneme, koridor oturumu ve geçiş, b → a kilidi).
 */
import { describe, expect, it } from 'vitest';
import { SERUVEN, executeSeruven, levelXp, linkById, linkCrossable, nodeKey, nodeOpen, nodeVisible, pageById, type SeruvenCommand, type SeruvenEvent, type SeruvenState } from './seruven';
import { linkCrossCommand, linkSession } from '../app/seruvenBattle';
import { dispatch } from '../ui/session';
import { partyAt } from '../sim/balance';
import { getMap } from '../map/maps';

type G = { state: SeruvenState; events: SeruvenEvent[] };
function begin(): G {
  const r = executeSeruven(null, { type: 'start', id: 's', seed: 1, party: partyAt(3).map((sh, i) => ({ id: `p${i + 1}`, name: sh.name, sheet: sh })) });
  if (!r.ok) throw new Error(r.error);
  return { state: r.state, events: r.events };
}
function step(g: G, cmd: SeruvenCommand): G {
  const r = executeSeruven(g.state, cmd);
  if (!r.ok) throw new Error(r.error);
  return { state: r.state, events: [...g.events, ...r.events] };
}
const win = (g: G, node: string) => step(step(g, { type: 'move', to: node }), { type: 'battle_result', node, outcome: 'won', statuses: {}, xp: 10 });
const at = (page: string): G => { const g = begin(); return { state: { ...g.state, page }, events: g.events }; };

describe('Kuyruk 32 veri', () => {
  it('Volkan koordinatları ve rota; Derinlikler resim boyutu', () => {
    const v = pageById('volkan')!;
    expect(v.nodes.map((n) => [n.id, n.x, n.y])).toEqual([['salon', 0.95, 0.49], ['tapinak', 0.76, 0.31], ['kopru', 0.37, 0.3], ['demirhane', 0.2, 0.6], ['ejder', 0.5, 0.71], ['odul', 0.78, 0.68]]);
    expect(v.nodes.find((n) => n.id === 'ejder')?.boss).toBe(true);
    expect(pageById('derinlikler')?.boyut).toEqual([2576, 1654]);
    expect(SERUVEN.baglantilar?.[0]?.id).toBe('yeralti-nehri');
  });
});

describe('dinlenme, mağara, seviye', () => {
  it('Derinlikler dinlenme düğümü bir kez uzun dinlenme', () => {
    let g = win(at('derinlikler'), 'karakol');
    const hurt = { ...g.state, party: g.state.party.map((m) => ({ ...m, status: { ...m.status, hp: 1 } })) };
    g = step(step({ state: hurt, events: g.events }, { type: 'move', to: 'dinlenme' }), { type: 'visit', node: 'dinlenme' });
    expect(g.state.party[0]!.status.hp).toBeGreaterThan(1);
    expect(g.state.rests).toBe(1);
    expect(executeSeruven(g.state, { type: 'visit', node: 'dinlenme' }).ok).toBe(false);
  });
  it('Heykel Mağarası bayrak bulunana dek görünmez; bayrakla Mielikki Gölü\'nden açılır', () => {
    const orman = pageById('orman')!;
    const cave = orman.nodes.find((n) => n.id === 'heykel-magarasi')!;
    let g = win(win(win(at('orman'), 'patika'), 'oduncu-kampi'), 'mielikki-golu');
    expect(nodeVisible(g.state, cave)).toBe(false);
    expect(nodeOpen(g.state, orman, cave)).toBe(false);
    g = step(step(g, { type: 'move', to: 'mielikki-golu' }), { type: 'battle_result', node: 'mielikki-golu', outcome: 'won', statuses: {}, xp: 0, flags: ['heykel-magarasi-kesfedildi'] });
    expect(nodeOpen(g.state, orman, cave)).toBe(true);
    expect(step(g, { type: 'move', to: 'heykel-magarasi' }).state.at).toBe('heykel-magarasi');
  });
  it('seviye atlama XP eşiğinde; anahtar kapalıyken yok', () => {
    let g = begin();
    const need = levelXp(g.state.level)!;
    expect(executeSeruven(g.state, { type: 'level_up' }).ok).toBe(false);
    g = { state: { ...g.state, xp: need }, events: g.events };
    const up = step(g, { type: 'level_up' });
    expect(up.state.level).toBe(g.state.level + 1);
    expect(up.state.party.every((m) => m.sheet.level >= g.state.level + 1)).toBe(true);
    expect(executeSeruven(step(g, { type: 'set_toggle', key: 'seviyeAtlama', on: false }).state, { type: 'level_up' }).ok).toBe(false);
  });
});

describe('yeraltı nehri', () => {
  const vahaDone = () => win(at('col'), 'vaha');
  it('Vaha tamamlanmadan aranamaz; sınav başarısızsa uzun dinlenmeden önce tekrar yok; başarıyla açılır', () => {
    expect(executeSeruven(step(at('col'), { type: 'move', to: 'vaha' }).state, { type: 'link_check', link: 'yeralti-nehri', roll: 20 }).ok).toBe(false);
    let g = vahaDone();
    g = step(g, { type: 'link_check', link: 'yeralti-nehri', roll: 1 });
    expect(g.state.links ?? []).not.toContain('yeralti-nehri');
    expect(executeSeruven(g.state, { type: 'link_check', link: 'yeralti-nehri', roll: 20 }).ok).toBe(false);
    g = { state: { ...g.state, rests: (g.state.rests ?? 0) + 1 }, events: g.events };
    g = step(g, { type: 'link_check', link: 'yeralti-nehri', roll: 20 });
    expect(g.state.links).toContain('yeralti-nehri');
  });
  it('Game Master "Yeraltı nehrini aç" sınavı atlar', () => {
    const g = step(step(vahaDone(), { type: 'set_toggle', key: 'yeraltiNehriAc', on: true }), { type: 'link_check', link: 'yeralti-nehri', roll: 1 });
    expect(g.state.links).toContain('yeralti-nehri');
  });
  it('koridor: düşmansız keşif, çıkışa varınca Mielikki Gölü\'nde; geri yön Bataklık\'tan önce kapalı (serbest gezinti açar)', () => {
    let g = step(step(vahaDone(), { type: 'set_toggle', key: 'yeraltiNehriAc', on: true }), { type: 'link_check', link: 'yeralti-nehri', roll: 1 });
    let s = linkSession(g.state, 'yeralti-nehri', () => 0.5)!;
    expect(Object.values(s.state.combatants).every((c) => c.side === 'party')).toBe(true);
    expect(s.state.explore?.exits.length).toBeGreaterThan(0);
    s = dispatch(s, { type: 'start_battle' }, () => 0.5);
    expect(s.state.status).toBe('active');
    expect(linkCrossCommand(g.state, 'yeralti-nehri', s.state)).toBeNull();
    const pc = Object.values(s.state.combatants)[0]!;
    const exit = s.state.explore!.exits[0]!;
    const there = { ...s.state, combatants: { ...s.state.combatants, [pc.id]: { ...pc, pos: exit } } };
    const cmd = linkCrossCommand(g.state, 'yeralti-nehri', there)!;
    g = step(g, cmd);
    expect([g.state.page, g.state.at]).toEqual(['orman', 'mielikki-golu']);
    const link = linkById('yeralti-nehri')!;
    expect(linkCrossable(g.state, link)).toBe(false);
    expect(linkCrossable({ ...g.state, done: [...g.state.done, 'bataklik/batik-kale'] }, link)).toBe(true);
    expect(linkCrossable(step(g, { type: 'set_toggle', key: 'serbestGezinti', on: true }).state, link)).toBe(true);
  });
  it('koridor pususu açıkken SRD yaratıkları; harita gizli, 21×11, gece yok', () => {
    let g = step(step(vahaDone(), { type: 'set_toggle', key: 'yeraltiNehriAc', on: true }), { type: 'link_check', link: 'yeralti-nehri', roll: 1 });
    g = step(g, { type: 'set_toggle', key: 'koridorPususu', on: true });
    const s = linkSession(g.state, 'yeralti-nehri', () => 0.5)!;
    expect(Object.values(s.state.combatants).some((c) => c.side === 'enemies')).toBe(true);
    const m = getMap('yeralti-nehri');
    expect([m.size.cols, m.size.rows, m.variants.map((v) => v.id)]).toEqual([21, 11, ['gunduz']]);
    expect(nodeKey('col', 'vaha')).toBe('col/vaha');
  });
});
