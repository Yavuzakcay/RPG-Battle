/**
 * Kuyruk 31: Serüven (kıta sayfaları). Veri bütünlüğü, açılış kuralları, sayfa geçişi, ödül, bozgun, anahtarlar, kayıt,
 * her düğümden savaş kurulumu (duman), keşfe devam yürüyüşü.
 */
import { describe, expect, it } from 'vitest';
import { SERUVEN, executeSeruven, gateOpen, nodeKey, nodeOpen, nodeStop, pageById, pageOrder, replaySeruven, type SeruvenCommand, type SeruvenEvent, type SeruvenState } from './seruven';
import { saveJourney, loadJourney, JOURNEY_KEY } from '../app/journeySave';
import { loadSeruven, saveSeruven } from '../app/seruvenSave';
import { nightVariant, nodeJourney, seruvenBattleSession, seruvenResultCommand } from '../app/seruvenBattle';
import { stopParticipants } from '../app/journeyBattle';
import { contextFor, dispatch } from '../ui/session';
import { execute } from '../battle/commands';
import { partyAt } from '../sim/balance';
import { getMap } from '../map/maps';
import { replay } from '../battle/reduce';
import type { BattleState } from '../battle/types';

const memStore = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); }, removeItem: (k: string) => { m.delete(k); }, m }; };
function begin(): { state: SeruvenState; events: SeruvenEvent[] } {
  const r = executeSeruven(null, { type: 'start', id: 's', seed: 1, party: partyAt(3).map((sh, i) => ({ id: `p${i + 1}`, name: sh.name, sheet: sh })) });
  if (!r.ok) throw new Error(r.error);
  return { state: r.state, events: r.events };
}
function step(g: { state: SeruvenState; events: SeruvenEvent[] }, cmd: SeruvenCommand) {
  const r = executeSeruven(g.state, cmd);
  if (!r.ok) throw new Error(r.error);
  return { state: r.state, events: [...g.events, ...r.events] };
}
const win = (g: { state: SeruvenState; events: SeruvenEvent[] }, node: string) =>
  step(step(g, { type: 'move', to: node }), { type: 'battle_result', node, outcome: 'won', statuses: {}, xp: 10 });

describe('Serüven verisi', () => {
  it('sayfa sırası doğudan batıya, Volkan portalla; koordinatlar 0–1; her düğüm bir durağa ve haritaya bağlı', () => {
    expect(pageOrder().map((p) => p.id)).toEqual(['buzul', 'dag', 'orman', 'bataklik', 'col', 'derinlikler']);
    expect(pageById('derinlikler')?.portal?.to).toBe('volkan');
    for (const p of SERUVEN.pages) {
      const ids = new Set(p.nodes.map((n) => n.id));
      for (const pt of [p.entry, p.exit, ...p.nodes, ...(p.susler ?? [])].filter(Boolean) as Array<{ x: number; y: number }>) {
        expect(pt.x, p.id).toBeGreaterThanOrEqual(0); expect(pt.x).toBeLessThanOrEqual(1);
        expect(pt.y).toBeGreaterThanOrEqual(0); expect(pt.y).toBeLessThanOrEqual(1);
      }
      for (const n of p.nodes) {
        for (const r of n.requires) expect(ids.has(r), `${p.id}/${n.id} → ${r}`).toBe(true);
        const stop = nodeStop(n, 3);
        expect(stop, `${p.id}/${n.id}`).toBeTruthy();
      }
      for (const r of p.exit?.requires ?? []) expect(ids.has(r)).toBe(true);
    }
  });
  it('duman: her savaş düğümünden harita açılır (3. seviye), gece varyantı olan düğümde gece de açılır', () => {
    const g = begin();
    for (const p of SERUVEN.pages) for (const n of p.nodes) {
      const s: SeruvenState = { ...g.state, page: p.id };
      const stop = nodeStop(n, 3);
      if (stop?.kind !== 'battle') continue;
      const j = nodeJourney(s, n.id);
      expect(stopParticipants(j!)?.scenario.map, `${p.id}/${n.id}`).toBeTruthy();
      const session = seruvenBattleSession(s, n.id, () => 0.5);
      expect(session?.state.status, `${p.id}/${n.id}`).toBe('setup');
      if (nightVariant(s, n.id)) {
        const night = seruvenBattleSession({ ...s, night: [nodeKey(p.id, n.id)] }, n.id, () => 0.5);
        expect(night?.state.map?.variantId, `${p.id}/${n.id} gece`).toBe(n.gece ? stopParticipants(nodeJourney({ ...s, night: [nodeKey(p.id, n.id)] }, n.id)!)!.scenario.map!.variantId : 'gece');
      }
    }
  });
});

describe('Serüven motoru', () => {
  it('başlangıç Buzul girişi; ilk düğüm açık, sonrakiler kilitli; zafer sonrakini açar', () => {
    let g = begin();
    expect([g.state.page, g.state.at]).toEqual(['buzul', 'giris']);
    const buzul = pageById('buzul')!;
    expect(buzul.nodes.map((n) => nodeOpen(g.state, buzul, n))).toEqual([true, false, false, false]);
    expect(executeSeruven(g.state, { type: 'move', to: 'karli-kamp' }).ok).toBe(false);
    g = win(g, 'acik-buzul');
    expect(nodeOpen(g.state, buzul, buzul.nodes[1]!)).toBe(true);
    expect(gateOpen(g.state, buzul, buzul.exit)).toBe(false);
  });
  it('bozgunda düğüm açık kalır, parti uzun dinlenir (anahtar); anahtar kapalıyken durum aynen', () => {
    let g = step(begin(), { type: 'move', to: 'acik-buzul' });
    const hurt = Object.fromEntries(g.state.party.map((m) => [m.id, { ...m.status, hp: 1 }]));
    const lost = step(g, { type: 'battle_result', node: 'acik-buzul', outcome: 'lost', statuses: hurt, xp: 0 });
    expect(lost.state.done).toEqual([]);
    expect(lost.state.party[0]!.status.hp).toBeGreaterThan(1);
    g = step(g, { type: 'set_toggle', key: 'bozgundaYenidenDene', on: false });
    const raw = step(g, { type: 'battle_result', node: 'acik-buzul', outcome: 'lost', statuses: hurt, xp: 0 });
    expect(raw.state.party[0]!.status.hp).toBe(1);
  });
  it('sayfa çıkışı bir sonraki sayfanın girişine; gece seçimi sayfa değişince sıfırlanır (otomatik gündüz)', () => {
    let g = begin();
    g = step(g, { type: 'set_night', node: 'acik-buzul', on: true });
    for (const n of ['acik-buzul', 'karli-kamp', 'buzul-kayaliklari', 'buz-tapinagi']) g = win(g, n);
    g = step(g, { type: 'move', to: 'cikis' });
    expect([g.state.page, g.state.at, g.state.night]).toEqual(['dag', 'giris', []]);
  });
  it('Orman: iki kamptan biri Mielikki Gölü\'nü açar; Bataklık: Cadının Kampı isteğe bağlı; Çöl çıkışı iki son durağı ister', () => {
    const base = begin().state;
    const orman = pageById('orman')!;
    let g = { state: { ...base, page: 'orman' }, events: [] as SeruvenEvent[] };
    g = win(g, 'patika'); g = win(g, 'oduncu-kampi');
    expect(nodeOpen(g.state, orman, orman.nodes.find((n) => n.id === 'mielikki-golu')!)).toBe(true);
    const bat = pageById('bataklik')!;
    let b = { state: { ...base, page: 'bataklik' }, events: [] as SeruvenEvent[] };
    for (const n of ['kutuk-adalari', 'batik-cukur', 'batik-kale']) b = win(b, n);
    expect(gateOpen(b.state, bat, bat.exit)).toBe(true);
    const col = pageById('col')!;
    let c = { state: { ...base, page: 'col' }, events: [] as SeruvenEvent[] };
    for (const n of ['vaha', 'kanyon-nehri', 'gemi-enkazi']) c = win(c, n);
    expect(gateOpen(c.state, col, col.exit)).toBe(false);
    c = win(c, 'sutun-harabesi');
    expect(gateOpen(c.state, col, col.exit)).toBe(true);
  });
  it('serbest açılış anahtarı bütün düğümleri açar', () => {
    const g = step(begin(), { type: 'set_toggle', key: 'serbestAcilis', on: true });
    const buzul = pageById('buzul')!;
    expect(buzul.nodes.every((n) => nodeOpen(g.state, buzul, n))).toBe(true);
  });
  it('Derinlikler portalı Volkan Adası\'na; ödül düğümü alınır, Volkan çıkışı Derinliklere döner; son sayfa çıkışı kıta sonu', () => {
    const base = begin().state;
    let g = { state: { ...base, page: 'derinlikler' }, events: [] as SeruvenEvent[] };
    for (const n of ['karakol', 'mezar', 'lav']) g = win(g, n);
    g = step(g, { type: 'move', to: 'portal' });
    expect(g.state.page).toBe('volkan');
    for (const n of ['salon', 'tapinak', 'kopru', 'demirhane', 'ejder']) g = win(g, n);
    g = step(step(g, { type: 'move', to: 'odul' }), { type: 'visit', node: 'odul' });
    expect(g.state.gold).toBeGreaterThan(0);
    g = step(g, { type: 'move', to: 'cikis' });
    expect(g.state.page).toBe('derinlikler');
    g = win(g, 'mantar');
    g = step(step(g, { type: 'move', to: 'sandik' }), { type: 'visit', node: 'sandik' });
    for (const n of ['mesale', 'merdiven', 'hazine']) g = win(g, n);
    g = step(g, { type: 'move', to: 'cikis' });
    expect(g.state.result).toBe('won');
  });
});

describe('Serüven kaydı', () => {
  it('yolculuk dosyasına isteğe bağlı alan; replay aynı; yolculuk kaydı Serüven\'i silmez; eski kayıt Serüven\'siz açılır', () => {
    const st = memStore();
    saveJourney([], st);
    expect(loadSeruven(st).state).toBeNull();
    const g = win(begin(), 'acik-buzul');
    saveSeruven(g.events, st);
    expect(loadSeruven(st).state).toEqual(g.state);
    expect(replaySeruven(g.events)).toEqual(g.state);
    saveJourney([], st);
    expect(loadSeruven(st).state).toEqual(g.state);
    expect(loadJourney(st).ok).toBe(true);
    expect(JSON.parse(st.m.get(JOURNEY_KEY)!).version).toBe(1);
  });
});

describe('Serüven savaşı', () => {
  it('sonuç komutu ve keşfe devam: bitmiş savaşta parti yürür, replay aynı; anahtar kapalıyken keşif yok', () => {
    const g = step(begin(), { type: 'move', to: 'acik-buzul' });
    let s = seruvenBattleSession(g.state, 'acik-buzul', () => 0.5)!;
    expect(s.state.explore?.exits.length).toBeGreaterThan(0);
    s = dispatch(s, { type: 'start_battle' }, () => 0.5);
    const enemies = Object.values(s.state.combatants).filter((c) => c.side === 'enemies');
    const fin: BattleState = { ...s.state, status: 'finished', winner: 'party', combatants: { ...s.state.combatants, ...Object.fromEntries(enemies.map((c) => [c.id, { ...c, hp: 0, life: 'dead' as const }])) } };
    const pc = Object.values(fin.combatants).find((c) => c.side === 'party')!;
    const to = getMap('buzul-acik').startZones.players.find((h) => !Object.values(fin.combatants).some((c) => c.pos && c.pos.col === h.col && c.pos.row === h.row))!;
    const r = execute(fin, { type: 'explore_move', actorId: pc.id, to }, contextFor(fin, pc.id), () => 0.5);
    if (!r.ok) throw new Error(r.error);
    expect(r.state.combatants[pc.id]?.pos).toEqual(to);
    expect(r.state.status).toBe('finished');
    expect(replay([{ type: 'battle_started', state: fin }, ...r.events])).toEqual(r.state);
    expect(execute({ ...fin, explore: undefined }, { type: 'explore_move', actorId: pc.id, to }, contextFor(fin, pc.id), () => 0.5).ok).toBe(false);
    const cmd = seruvenResultCommand(g.state, 'acik-buzul', fin);
    expect(cmd?.outcome).toBe('won');
    const off = step(g, { type: 'set_toggle', key: 'kesfeDevam', on: false });
    expect(seruvenBattleSession(off.state, 'acik-buzul', () => 0.5)?.state.explore).toBeUndefined();
  });
});
