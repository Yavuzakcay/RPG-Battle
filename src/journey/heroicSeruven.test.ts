/**
 * Görev HEROIC-INSPIRATION-TAM: Serüven'de Game Master'ın Heroic Inspiration vermesi (`ilham_ver`) ve olay ödülü
 * (`reward.ilham`); bir seferde en çok bir, replay aynı.
 */
import { describe, expect, it } from 'vitest';
import { executeSeruven, replaySeruven, type SeruvenCommand, type SeruvenEvent, type SeruvenState } from './seruven';
import { partyAt } from '../sim/balance';
import { hasHeroic } from '../rules/heroicInspiration';
import seferler from '../../data/seferler.json';

type G = { state: SeruvenState; events: SeruvenEvent[] };
function begin(): G {
  const r = executeSeruven(null, { type: 'start', id: 's', seed: 1, toggles: { irkBaslangic: false }, party: partyAt(3).map((sh, i) => ({ id: `p${i + 1}`, name: sh.name, sheet: sh })) });
  if (!r.ok) throw new Error(r.error);
  return { state: r.state, events: r.events };
}
function step(g: G, cmd: SeruvenCommand): G {
  const r = executeSeruven(g.state, cmd);
  if (!r.ok) throw new Error(r.error);
  return { state: r.state, events: [...g.events, ...r.events] };
}
const has = (g: G, id: string) => hasHeroic(g.state.party.find((m) => m.id === id)?.status);
/** Üyelerin hakkını sıfırla (Human dahil), başlangıç noktası. */
function cleared(g: G): G {
  return { ...g, state: { ...g.state, party: g.state.party.map((m) => ({ ...m, status: { ...m.status, resources: { ...m.status.resources, heroicInspiration: 0 } } })) } };
}

describe('Serüven: Heroic Inspiration', () => {
  it('Game Master verir; varken aktarılır ya da kaybolur; replay aynı', () => {
    const g0 = begin();
    let g = step(g0, { type: 'ilham_ver', memberId: 'p1' });
    // Başlangıçta hakkı olmayan üyeye hak gelir; Human zaten taşıyorsa yeni hak kaybolur.
    expect(has(g, 'p1')).toBe(true);
    const c = cleared(g0);
    g = step(c, { type: 'ilham_ver', memberId: 'p1' });
    expect(has(g, 'p1')).toBe(true);
    expect(has(g, 'p2')).toBe(false);
    const lost = step(g, { type: 'ilham_ver', memberId: 'p1' });
    expect(lost.events.at(-1)).toMatchObject({ type: 'seruven_ilham', lost: 'p1' });
    g = step(g, { type: 'ilham_ver', memberId: 'p1', passTo: 'p2' });
    expect(has(g, 'p2')).toBe(true);
    expect(executeSeruven(g.state, { type: 'ilham_ver', memberId: 'p1', passTo: 'p2' }).ok).toBe(false);
    const fromStart = replaySeruven([{ type: 'seruven_started', state: c.state }, ...g.events.slice(c.events.length)]);
    expect(fromStart?.party.map((m) => hasHeroic(m.status))).toEqual(g.state.party.map((m) => hasHeroic(m.status)));
  });
  it('olay düğümü ödülü (`reward.ilham`): hakkı olmayan her canlı üyeye bir hak', () => {
    const sefer = (seferler as unknown as { seferler: Array<{ id: string; nodes: Array<{ id: string; reward?: Record<string, unknown> }> }> }).seferler.find((x) => x.id === 'derinlikler');
    const node = sefer?.nodes.find((n) => n.id === 'sandik');
    if (!node) throw new Error('derinlikler:sandik yok');
    const before = node.reward;
    node.reward = { gold: 0, potions: 0, items: [], ilham: true };
    try {
      const g0 = cleared(begin());
      const at = { ...g0, state: { ...g0.state, page: 'derinlikler', at: 'sandik' } };
      const g = step(at, { type: 'visit', node: 'sandik' });
      expect(g.events.some((e) => e.type === 'seruven_ilham' && e.neden === 'odul')).toBe(true);
      expect(g.state.party.every((m) => m.status.dead || hasHeroic(m.status))).toBe(true);
    } finally {
      if (before === undefined) delete node.reward; else node.reward = before;
    }
  });
});
