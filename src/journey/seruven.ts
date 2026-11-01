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
import { nextLevelXp } from './engine';
import { combatantFromSheet } from '../battle/create';
import { skillBonus, type Skill } from '../rules/skills';
import type { JourneyMember, JourneyStop } from './types';

export interface SeruvenNode {
  id: string; x: number; y: number; requires: string[]; all?: boolean; optional?: boolean; boss?: boolean; zorluk?: number;
  /** Sim senaryosu (harita + seviyeye göre düşman). */ scenario?: string;
  /** Gece için ayrı senaryo (yoksa haritanın `gece` varyantı). */ gece?: string;
  /** Sefer düğümü `<sefer>:<düğüm>` (data/seferler.json). */ sefer?: string;
  /** Kuyruk 32: keşif bayrağıyla açılan gizli düğüm (bayrak yokken görünmez; ör. Heykel Mağarası). */ bayrak?: string;
}
/** Kuyruk 32: sayfalar arası savaşsız bağlantı (yeraltı nehri): iki uç, koridor senaryosu, açılış sınavı. */
export interface SeruvenLink {
  id: string; scenario: string; dc: number; skills: string[];
  a: { page: string; node: string }; b: { page: string; node: string };
  /** b → a yönü bu düğüm tamamlanmadan kapalı (Game Master "Serbest gezinti" açar). */ geriKilit?: string;
  /** Koridor haritasında uçların altıgenleri (1 tabanlı): a ucundan girilir, b ucunda çıkılır (ters yönde tersi). */
  uclar: { a: Array<[number, number]>; b: Array<[number, number]> };
}
export interface SeruvenGate { x: number; y: number; requires: string[]; all?: boolean; to?: string }
export interface SeruvenPage {
  id: string; bolge: string; name: { tr: string; en: string }; gorsel: string; renk: string; ada?: boolean;
  /** Kuyruk 32: kıta resminin boyutu (yoksa 2752×1536); sayfa kutusunun oranı (düğümler resme oturur). */
  boyut?: [number, number];
  entry: { x: number; y: number }; exit: SeruvenGate | null; next: string | null; portal?: SeruvenGate;
  nodes: SeruvenNode[]; susler?: Array<{ id: string; x: number; y: number; icon: string }>;
}
export interface SeruvenData {
  baslangic: string; yurumeMs: number; pages: SeruvenPage[]; baglantilar?: SeruvenLink[];
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
  /** Kuyruk 32: uzun dinlenme sayısı (bağlantı sınavı yeniden denemesi), açılan bağlantılar, son başarısız denemedeki dinlenme sayısı. */
  rests?: number; links?: string[]; linkTry?: Record<string, number>;
}

export type SeruvenCommand =
  | { type: 'start'; id: string; seed: number; party: Array<{ id: string; name: string; sheet: CharacterSheet; status?: CharacterStatus }>; level?: number }
  | { type: 'move'; to: string }
  | { type: 'set_night'; node: string; on: boolean }
  | { type: 'set_toggle'; key: string; on: boolean }
  | { type: 'battle_result'; node: string; outcome: 'won' | 'lost'; statuses: Record<string, CharacterStatus>; xp: number; flags?: string[] }
  /** Savaşsız düğüm (ödül, anlatım, dinlenme): alınır, tamamlanır. */
  | { type: 'visit'; node: string }
  /** Kuyruk 32: Game Master seviye atlatır (XP eşiği aşılmışsa). */
  | { type: 'level_up' }
  /** Kuyruk 32: bağlantı girişini arar (beceri sınavı; `roll` d20 sonucu, arayüz rng'den atar). */
  | { type: 'link_check'; link: string; roll: number }
  /** Kuyruk 32: bağlantıdan geçildi (koridorun çıkışına varıldı): karşı uçtaki düğümde ortaya çıkılır. */
  | { type: 'link_cross'; link: string; flags?: string[]; statuses?: Record<string, CharacterStatus> };

export type SeruvenEvent =
  | { type: 'seruven_started'; state: SeruvenState }
  | { type: 'seruven_moved'; to: string }
  | { type: 'seruven_page'; page: string; resetNight: boolean }
  | { type: 'seruven_night'; key: string; on: boolean }
  | { type: 'seruven_toggle'; key: string; on: boolean }
  | { type: 'seruven_result'; key: string; outcome: 'won' | 'lost'; statuses: Record<string, CharacterStatus>; xp: number; gold: number; potions: number; flags?: string[]; /** Kuyruk 32: bozgunda uzun dinlenildi. */ rested?: boolean }
  | { type: 'seruven_visited'; key: string; gold: number; potions: number; items: string[] }
  | { type: 'seruven_finished'; result: 'won' | 'lost' }
  | { type: 'seruven_rested'; key: string; statuses: Record<string, CharacterStatus> }
  | { type: 'seruven_leveled'; level: number }
  | { type: 'seruven_link_checked'; link: string; total: number; dc: number; success: boolean; by: string }
  | { type: 'seruven_link_crossed'; link: string; page: string; node: string; flags?: string[]; statuses?: Record<string, CharacterStatus> };

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
  if (!nodeVisible(s, node)) return false;
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
      // Kuyruk 32: dinlenme düğümü bir kez uzun dinlenme (mevcut kural; ölü ölü kalır).
      if (stop.kind === 'rest') {
        return done(state, [{ type: 'seruven_rested', key, statuses: Object.fromEntries(state.party.map((m) => [m.id, longRestStatus(m.sheet, m.status)])) }]);
      }
      return done(state, [{ type: 'seruven_visited', key, gold: stop.reward?.gold ?? 0, potions: stop.reward?.potions ?? 0, items: stop.reward?.items ?? [] }]);
    }
    case 'level_up': {
      if (!toggleOn(state, 'seviyeAtlama')) return fail('Serüven seviye atlama kapalı.');
      const need = levelXp(state.level);
      if (need === null || state.xp < need) return fail('XP eşiği aşılmadı.');
      return done(state, [{ type: 'seruven_leveled', level: state.level + 1 }]);
    }
    case 'link_check': {
      const link = linkById(cmd.link);
      if (!link || !linkAt(state, link)) return fail('Burada bağlantı yok.');
      if (state.links?.includes(link.id)) return fail('Bağlantı zaten açık.');
      if (!state.done.includes(nodeKey(link.a.page, link.a.node))) return fail('Önce bu düğümü tamamla.');
      if (state.linkTry?.[link.id] !== undefined && (state.rests ?? 0) <= (state.linkTry[link.id] ?? 0)) return fail('Yeniden denemek için uzun dinlenme gerekir.');
      if (toggleOn(state, 'yeraltiNehriAc')) return done(state, [{ type: 'seruven_link_checked', link: link.id, total: 0, dc: link.dc, success: true, by: '' }]);
      const best = bestSkill(state, link.skills);
      const total = cmd.roll + best.bonus;
      return done(state, [{ type: 'seruven_link_checked', link: link.id, total, dc: link.dc, success: total >= link.dc, by: best.name }]);
    }
    case 'link_cross': {
      const link = linkById(cmd.link);
      if (!link || !linkCrossable(state, link)) return fail('Bağlantı kapalı.');
      const to = state.page === link.a.page && state.at === link.a.node ? link.b : link.a;
      return done(state, [{ type: 'seruven_link_crossed', link: link.id, page: to.page, node: to.node, ...(cmd.flags?.length ? { flags: cmd.flags } : {}), ...(cmd.statuses ? { statuses: cmd.statuses } : {}) }]);
    }
    case 'battle_result': {
      const node = page.nodes.find((n) => n.id === cmd.node);
      if (!node) return fail('Düğüm yok.');
      const stop = nodeStop(node, state.level);
      const key = nodeKey(page.id, node.id);
      let statuses = cmd.statuses;
      // Bozgunda (anahtar açıksa) parti uzun dinlenir ve yeniden dener; mevcut dinlenme kuralı (ölü ölü kalır).
      const rested = cmd.outcome === 'lost' && toggleOn(state, 'bozgundaYenidenDene');
      if (rested) {
        statuses = Object.fromEntries(state.party.map((m) => [m.id, longRestStatus(m.sheet, statusOf(m, cmd.statuses))]));
      }
      const evs: SeruvenEvent[] = [{
        type: 'seruven_result', key, outcome: cmd.outcome, statuses, xp: cmd.xp,
        gold: cmd.outcome === 'won' ? stop?.reward?.gold ?? 0 : 0, potions: cmd.outcome === 'won' ? (stop?.potions ?? 0) + (stop?.reward?.potions ?? 0) : 0,
        ...(cmd.flags?.length ? { flags: cmd.flags } : {}), ...(rested ? { rested: true } : {}),
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
      ...s, ...(e.outcome === 'lost' && e.rested ? { rests: (s.rests ?? 0) + 1 } : {}), done: e.outcome === 'won' && !s.done.includes(e.key) ? [...s.done, e.key] : s.done,
      party: s.party.map((m) => ({ ...m, status: e.statuses[m.id] ?? m.status })),
      xp: s.xp + e.xp, gold: s.gold + e.gold, potions: s.potions + e.potions,
      flags: [...new Set([...s.flags, ...(e.flags ?? [])])],
    };
    case 'seruven_visited': return { ...s, done: [...s.done, e.key], gold: s.gold + e.gold, potions: s.potions + e.potions, items: [...s.items, ...e.items] };
    case 'seruven_finished': return { ...s, result: e.result };
    case 'seruven_rested': return { ...s, done: [...s.done, e.key], rests: (s.rests ?? 0) + 1, party: s.party.map((m) => ({ ...m, status: e.statuses[m.id] ?? m.status })) };
    case 'seruven_leveled': return { ...s, level: e.level, party: s.party.map((m) => (m.sheet.level < e.level ? { ...m, sheet: { ...m.sheet, level: e.level } } : m)) };
    case 'seruven_link_checked': return e.success ? { ...s, links: [...new Set([...(s.links ?? []), e.link])] } : { ...s, linkTry: { ...(s.linkTry ?? {}), [e.link]: s.rests ?? 0 } };
    case 'seruven_link_crossed': return {
      ...s, page: e.page, at: e.node, flags: [...new Set([...s.flags, ...(e.flags ?? [])])],
      ...(e.statuses ? { party: s.party.map((m) => ({ ...m, status: e.statuses?.[m.id] ?? m.status })) } : {}),
    };
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

/** Kuyruk 32: bayraklı düğüm bayrak bulunana dek görünmez. */
export const nodeVisible = (s: Pick<SeruvenState, 'flags'>, node: SeruvenNode): boolean => !node.bayrak || s.flags.includes(node.bayrak);

/** Bir sonraki seviyenin XP eşiği (yolculuk kuralları; SRD 5.2.1). */
export const levelXp = (level: number): number | null => nextLevelXp(level);

export const linkById = (id: string): SeruvenLink | undefined => (SERUVEN.baglantilar ?? []).find((l) => l.id === id);
/** Parti bu bağlantının bir ucunda mı. */
export const linkAt = (s: SeruvenState, l: SeruvenLink): boolean =>
  (s.page === l.a.page && s.at === l.a.node) || (s.page === l.b.page && s.at === l.b.node);
/** Bulunulan düğümdeki bağlantılar. */
export const linksHere = (s: SeruvenState): SeruvenLink[] => (SERUVEN.baglantilar ?? []).filter((l) => linkAt(s, l));
/** Bağlantıdan geçilebilir mi: açık, partinin bulunduğu uçta; b → a yönü `geriKilit` tamamlanmadan kapalı (Serbest gezinti açar). */
export function linkCrossable(s: SeruvenState, l: SeruvenLink): boolean {
  if (!s.links?.includes(l.id) || !linkAt(s, l)) return false;
  const back = s.page === l.b.page && s.at === l.b.node;
  return !back || !l.geriKilit || s.done.includes(l.geriKilit) || toggleOn(s, 'serbestGezinti');
}

/** Partinin bu becerilerdeki en iyi bonusu (karakter sayfasından türetilen savaşçı). */
function bestSkill(s: SeruvenState, skills: string[]): { bonus: number; name: string } {
  let best = { bonus: -99, name: '' };
  for (const m of s.party) {
    if (m.status.dead || m.status.hp <= 0) continue;
    const c = combatantFromSheet(m.sheet, { id: m.id, ownerId: m.id });
    for (const k of skills) {
      const b = skillBonus(c, k as Skill);
      if (b > best.bonus) best = { bonus: b, name: m.name };
    }
  }
  return best.bonus === -99 ? { bonus: 0, name: '' } : best;
}

