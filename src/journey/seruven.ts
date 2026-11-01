/**
 * Kuyruk 31: Serüven (kıta sayfaları). Yolculuk motorunun kalıbıyla (komut → olay → reducer, replay) ince bir katman:
 * sayfa (`data/seruven.json`), düğüm durumları, parti konumu, bayraklar, Serüven anahtarları. Savaşlar yolculuğun
 * parçalarıyla kurulur (sim senaryosu ya da sefer düğümü → `JourneyStop`, `app/seruvenBattle.ts`); parti durumu,
 * altın, iksir, XP aynı alanlarda. Saf; zarlar rng'den (şimdilik zar yok).
 */
import data from '../../data/seruven.json';
import { longRestStatus } from '../rules/characterRest';
import type { CharacterStatus } from '../rules/characterRest';
import type { CharacterSheet } from '../rules/stats';
import { seferById, seferRoute } from './sefer';
import type { JourneyMember, JourneyStop } from './types';

export interface SeruvenNode {
  id: string; x: number; y: number; requires: string[]; all?: boolean; optional?: boolean; boss?: boolean; zorluk?: number;
  /** Sim senaryosu (harita + seviyeye göre düşman). */ scenario?: string;
  /** Gece için ayrı senaryo (yoksa haritanın `gece` varyantı). */ gece?: string;
  /** Sefer düğümü `<sefer>:<düğüm>` (data/seferler.json). */ sefer?: string;
}
export interface SeruvenGate { x: number; y: number; requires: string[]; all?: boolean; to?: string }
export interface SeruvenPage {
  id: string; bolge: string; name: { tr: string; en: string }; gorsel: string; renk: string; ada?: boolean;
  entry: { x: number; y: number }; exit: SeruvenGate | null; next: string | null; portal?: SeruvenGate;
  nodes: SeruvenNode[]; susler?: Array<{ id: string; x: number; y: number; icon: string }>;
}
export interface SeruvenData {
  baslangic: string; yurumeMs: number; pages: SeruvenPage[];
  anahtarlar: Record<string, { default: boolean; tr: string; en: string }>;
}
export const SERUVEN = data as unknown as SeruvenData;
export const pageById = (id: string): SeruvenPage | undefined => SERUVEN.pages.find((p) => p.id === id);
export const TOGGLE_KEYS = Object.keys(SERUVEN.anahtarlar);

export interface SeruvenState {
  id: string; seed: number; level: number;
  page: string;
  /** Parti işareti: sayfa girişi (`giris`) ya da düğüm kimliği. */
  at: string;
  /** Tamamlanan düğümler (`sayfa/düğüm`). */
  done: string[];
  flags: string[];
  party: JourneyMember[];
  gold: number; potions: number; xp: number; items: string[];
  toggles: Record<string, boolean>;
  /** Gece seçilen düğümler (`sayfa/düğüm`). */
  night: string[];
  /** Kıta bitti (son sayfanın çıkışı) ya da parti yenildi. */
  result: 'won' | 'lost' | null;
}

export type SeruvenCommand =
  | { type: 'start'; id: string; seed: number; party: Array<{ id: string; name: string; sheet: CharacterSheet; status?: CharacterStatus }>; level?: number }
  | { type: 'move'; to: string }
  | { type: 'set_night'; node: string; on: boolean }
  | { type: 'set_toggle'; key: string; on: boolean }
  | { type: 'battle_result'; node: string; outcome: 'won' | 'lost'; statuses: Record<string, CharacterStatus>; xp: number; flags?: string[] }
  /** Savaşsız düğüm (ödül, anlatım): alınır, tamamlanır. */
  | { type: 'visit'; node: string };

export type SeruvenEvent =
  | { type: 'seruven_started'; state: SeruvenState }
  | { type: 'seruven_moved'; to: string }
  | { type: 'seruven_page'; page: string; resetNight: boolean }
  | { type: 'seruven_night'; key: string; on: boolean }
  | { type: 'seruven_toggle'; key: string; on: boolean }
  | { type: 'seruven_result'; key: string; outcome: 'won' | 'lost'; statuses: Record<string, CharacterStatus>; xp: number; gold: number; potions: number; flags?: string[] }
  | { type: 'seruven_visited'; key: string; gold: number; potions: number; items: string[] }
  | { type: 'seruven_finished'; result: 'won' | 'lost' };

export type SeruvenResult = { ok: true; state: SeruvenState; events: SeruvenEvent[] } | { ok: false; error: string };
const fail = (error: string): SeruvenResult => ({ ok: false, error });
export const nodeKey = (page: string, node: string) => `${page}/${node}`;

export const toggleOn = (s: Pick<SeruvenState, 'toggles'>, key: string): boolean => s.toggles[key] ?? SERUVEN.anahtarlar[key]?.default ?? false;

/** Düğümün yolculuk durağı (senaryo ya da sefer düğümü); verilen seviyede. Yoksa null (gizlenir). */
export function nodeStop(node: SeruvenNode, level: number, night = false): JourneyStop | null {
  if (node.sefer) {
    const [sid, nid] = node.sefer.split(':');
    const sefer = sid ? seferById(sid) : undefined;
    if (!sefer) return null;
    const lv = sefer.levels.includes(level) ? level : sefer.levels.reduce((a, b) => (Math.abs(b - level) < Math.abs(a - level) ? b : a), sefer.levels[0] ?? level);
    return seferRoute(sefer, lv).stops.find((x) => x.id === nid) ?? null;
  }
  const scenario = night && node.gece ? node.gece : node.scenario;
  if (!scenario) return null;
  return { id: node.id, kind: 'battle', name: { tr: node.id, en: node.id }, travelHours: 0, scenario };
}

const reqMet = (s: SeruvenState, page: string, req: string[], all?: boolean) =>
  req.length === 0 || (all ? req.every((r) => s.done.includes(nodeKey(page, r))) : req.some((r) => s.done.includes(nodeKey(page, r))));

/** Düğüm açık mı (tamamlanmış da açık sayılır). */
export function nodeOpen(s: SeruvenState, page: SeruvenPage, node: SeruvenNode): boolean {
  return s.done.includes(nodeKey(page.id, node.id)) || toggleOn(s, 'serbestAcilis') || reqMet(s, page.id, node.requires, node.all);
}
export const gateOpen = (s: SeruvenState, page: SeruvenPage, gate: SeruvenGate | null | undefined): boolean =>
  !!gate && reqMet(s, page.id, gate.requires, gate.all);

const statusOf = (m: JourneyMember, statuses: Record<string, CharacterStatus>) => statuses[m.id] ?? m.status;

export function executeSeruven(state: SeruvenState | null, cmd: SeruvenCommand): SeruvenResult {
  if (cmd.type === 'start') {
    if (!cmd.party.length) return fail('Parti boş.');
    const start = pageById(SERUVEN.baslangic);
    if (!start) return fail('Başlangıç sayfası yok.');
    const level = cmd.level ?? Math.max(1, ...cmd.party.map((p) => p.sheet.level));
    const s: SeruvenState = {
      id: cmd.id, seed: cmd.seed, level, page: start.id, at: 'giris', done: [], flags: [],
      party: cmd.party.map((p) => ({ id: p.id, name: p.name, sheet: p.sheet, status: p.status ?? longRestStatus(p.sheet, undefined) })),
      gold: 0, potions: 0, xp: 0, items: [], toggles: {}, night: [], result: null,
    };
    return done(null, [{ type: 'seruven_started', state: s }]);
  }
  if (!state) return fail('Serüven başlamadı.');
  if (state.result) return fail('Serüven bitti.');
  const page = pageById(state.page);
  if (!page) return fail('Sayfa bulunamadı.');
  switch (cmd.type) {
    case 'set_toggle':
      if (!TOGGLE_KEYS.includes(cmd.key)) return fail('Bilinmeyen anahtar.');
      return done(state, [{ type: 'seruven_toggle', key: cmd.key, on: cmd.on }]);
    case 'set_night': {
      if (!page.nodes.some((n) => n.id === cmd.node)) return fail('Düğüm yok.');
      return done(state, [{ type: 'seruven_night', key: nodeKey(page.id, cmd.node), on: cmd.on }]);
    }
    case 'move': {
      if (cmd.to === 'cikis' || cmd.to === 'portal') {
        const gate = cmd.to === 'cikis' ? page.exit : page.portal;
        if (!gateOpen(state, page, gate)) return fail('Çıkış henüz kapalı.');
        const to = gate?.to ?? (cmd.to === 'cikis' ? page.next : null);
        const evs: SeruvenEvent[] = [{ type: 'seruven_moved', to: cmd.to }];
        if (!to) evs.push({ type: 'seruven_finished', result: 'won' });
        else evs.push({ type: 'seruven_page', page: to, resetNight: toggleOn(state, 'otomatikGunduz') });
        return done(state, evs);
      }
      const node = page.nodes.find((n) => n.id === cmd.to);
      if (!node) return fail('Düğüm yok.');
      if (!nodeOpen(state, page, node)) return fail('Düğüm kilitli.');
      return done(state, [{ type: 'seruven_moved', to: node.id }]);
    }
    case 'visit': {
      const node = page.nodes.find((n) => n.id === cmd.node);
      if (!node || state.at !== node.id) return fail('Önce düğüme git.');
      const stop = nodeStop(node, state.level);
      if (!stop || stop.kind === 'battle') return fail('Bu düğüm savaş.');
      const key = nodeKey(page.id, node.id);
      if (state.done.includes(key)) return fail('Zaten alındı.');
      return done(state, [{ type: 'seruven_visited', key, gold: stop.reward?.gold ?? 0, potions: stop.reward?.potions ?? 0, items: stop.reward?.items ?? [] }]);
    }
    case 'battle_result': {
      const node = page.nodes.find((n) => n.id === cmd.node);
      if (!node) return fail('Düğüm yok.');
      const stop = nodeStop(node, state.level);
      const key = nodeKey(page.id, node.id);
      let statuses = cmd.statuses;
      // Bozgunda (anahtar açıksa) parti uzun dinlenir ve yeniden dener; mevcut dinlenme kuralı (ölü ölü kalır).
      if (cmd.outcome === 'lost' && toggleOn(state, 'bozgundaYenidenDene')) {
        statuses = Object.fromEntries(state.party.map((m) => [m.id, longRestStatus(m.sheet, statusOf(m, cmd.statuses))]));
      }
      const evs: SeruvenEvent[] = [{
        type: 'seruven_result', key, outcome: cmd.outcome, statuses, xp: cmd.xp,
        gold: cmd.outcome === 'won' ? stop?.reward?.gold ?? 0 : 0, potions: cmd.outcome === 'won' ? (stop?.potions ?? 0) + (stop?.reward?.potions ?? 0) : 0,
        ...(cmd.flags?.length ? { flags: cmd.flags } : {}),
      }];
      const able = state.party.some((m) => { const st = statusOf(m, statuses); return !st.dead && st.hp > 0; });
      if (!able) evs.push({ type: 'seruven_finished', result: 'lost' });
      return done(state, evs);
    }
  }
}

function done(state: SeruvenState | null, events: SeruvenEvent[]): SeruvenResult {
  const s = applySeruvenEvents(state, events);
  return s ? { ok: true, state: s, events } : fail('Durum yok.');
}

export function reduceSeruven(s: SeruvenState | null, e: SeruvenEvent): SeruvenState | null {
  if (e.type === 'seruven_started') return e.state;
  if (!s) return s;
  switch (e.type) {
    case 'seruven_moved': return { ...s, at: e.to };
    case 'seruven_page': return { ...s, page: e.page, at: 'giris', ...(e.resetNight ? { night: [] } : {}) };
    case 'seruven_night': return { ...s, night: e.on ? [...new Set([...s.night, e.key])] : s.night.filter((k) => k !== e.key) };
    case 'seruven_toggle': return { ...s, toggles: { ...s.toggles, [e.key]: e.on } };
    case 'seruven_result': return {
      ...s, done: e.outcome === 'won' && !s.done.includes(e.key) ? [...s.done, e.key] : s.done,
      party: s.party.map((m) => ({ ...m, status: e.statuses[m.id] ?? m.status })),
      xp: s.xp + e.xp, gold: s.gold + e.gold, potions: s.potions + e.potions,
      flags: [...new Set([...s.flags, ...(e.flags ?? [])])],
    };
    case 'seruven_visited': return { ...s, done: [...s.done, e.key], gold: s.gold + e.gold, potions: s.potions + e.potions, items: [...s.items, ...e.items] };
    case 'seruven_finished': return { ...s, result: e.result };
  }
}

export function applySeruvenEvents(s: SeruvenState | null, events: SeruvenEvent[]): SeruvenState | null {
  return events.reduce<SeruvenState | null>((acc, e) => reduceSeruven(acc, e), s);
}
export const replaySeruven = (events: SeruvenEvent[]): SeruvenState | null => applySeruvenEvents(null, events);

/** Sayfa sırası (kıta: doğudan batıya; Volkan Adası portalla, sırada değil). */
export function pageOrder(): SeruvenPage[] {
  const out: SeruvenPage[] = [];
  let p = pageById(SERUVEN.baslangic);
  while (p && !out.includes(p)) { out.push(p); p = p.next ? pageById(p.next) : undefined; }
  return out;
}
