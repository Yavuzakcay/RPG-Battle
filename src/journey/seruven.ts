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
import { gorevById, irkBaslangic, urunById, satisFiyati, yerlesimById, yerlesimHarita, YERLESIM } from '../yerlesim/yerlesim';
import { levelCap } from '../app/limits';
import { HAPIS, dragBack, nonlethal, sucById, wakeUp, type HapisDurum } from './hapishane';

export interface SeruvenNode {
  id: string; x: number; y: number; requires: string[]; all?: boolean; optional?: boolean; boss?: boolean; zorluk?: number;
  /** Sim senaryosu (harita + seviyeye göre düşman). */ scenario?: string;
  /** Gece için ayrı senaryo (yoksa haritanın `gece` varyantı). */ gece?: string;
  /** Sefer düğümü `<sefer>:<düğüm>` (data/seferler.json). */ sefer?: string;
  /** Kuyruk 32: keşif bayrağıyla açılan gizli düğüm (bayrak yokken görünmez; ör. Heykel Mağarası). */ bayrak?: string;
  /** Kuyruk 41b: yalnızca 1–5. seviye senaryosu; "Üst seviye" (ustSeviye) açıkken görünmez. */ ustSeviyeGizli?: boolean;
  /** Kuyruk 33: yerleşim düğümü (K34'te dolacak kart verisinin kimliği): savaşsız, "Yakında", yolu kapatmaz (geçilmiş sayılır). */ yerlesim?: string;
  /** Kuyruk 33: haritası olmayan düğümün görünen adı. */ ad?: { tr: string; en: string };
  /**
   * Kuyruk 36: düğüm haritasının kapıları (1 tabanlı altıgenler → komşu düğüm; null = sayfadan kaçış) ve gelinen
   * düğüme göre varış altıgenleri (Hapishane Adası; K34b yerleşim kapı mantığı).
   */
  kapilar?: Array<{ hexes: Array<[number, number]>; to: string | null }>;
  girisler?: Record<string, Array<[number, number]>>;
}
/** Kuyruk 32: sayfalar arası savaşsız bağlantı (yeraltı nehri): iki uç, koridor senaryosu, açılış sınavı. */
export interface SeruvenLink {
  id: string; scenario: string; dc: number; skills: string[];
  a: { page: string; node: string }; b: { page: string; node: string };
  /** b → a yönü bu düğüm tamamlanmadan kapalı (Game Master "Serbest gezinti" açar). */ geriKilit?: string;
  /** Koridor haritasında uçların altıgenleri (1 tabanlı): a ucundan girilir, b ucunda çıkılır (ters yönde tersi). */
  uclar: { a: Array<[number, number]>; b: Array<[number, number]> };
  /** Su Altı Geçidi: bu keşif bayrağı alınmışsa bağlantı sınavsız ve iki yönde açık (`geriKilit` uygulanmaz). */ bayrak?: string;
  /** Yolculuk süresi (gün). 0 = anında geçit (Su Altı Geçidi; gün sayacı ilerlemez); > 0 düğmede gösterilir. */ sureGun?: number;
}
export interface SeruvenGate { x: number; y: number; requires: string[]; all?: boolean; to?: string }
export interface SeruvenPage {
  id: string; bolge: string; name: { tr: string; en: string }; gorsel: string; renk: string; ada?: boolean;
  /** Kuyruk 36: sayfa sırasında yok; yalnızca olayla girilir (Hapishane Adası). */ gizli?: boolean;
  /** Kuyruk 32: kıta resminin boyutu (yoksa 2752×1536); sayfa kutusunun oranı (düğümler resme oturur). */
  boyut?: [number, number];
  entry: { x: number; y: number }; exit: SeruvenGate | null; next: string | null; portal?: SeruvenGate;
  nodes: SeruvenNode[]; susler?: Array<{ id: string; x: number; y: number; icon: string }>;
}
export interface SeruvenData {
  baslangic: string; yurumeMs: number; pages: SeruvenPage[]; baglantilar?: SeruvenLink[];
  anahtarlar: Record<string, { default: boolean; tr: string; en: string; /** Kuyruk 35: kural panelinde bölüm ("test"). */ bolum?: string }>;
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
  /** Kuyruk 35: atlanan savaş düğümleri (`savaslariAtla` test anahtarı; "atlandı"). */
  skipped?: string[];
  /** Kuyruk 34b: ırka göre başlangıç sayfası (varsa sayfa geçişleri iki yönde serbest); bulunulan yerleşim; görevler. */
  startPage?: string;
  yerlesim?: { id: string; map: string | null; from: string | null; seen: string[] } | null;
  quests?: Record<string, 'taken' | 'done'>;
  /** Kuyruk 36: Büyük suç zinciri (Beyaz Şehir hub'ı): seçilen suç ve aşama (ön savaş, muhafız baskını). */
  suc?: { id: string; asama: 'on' | 'baskin' } | null;
  /** Kuyruk 36: Hapishane Adası durumu (adadayken). */
  hapis?: HapisDurum | null;
  /** Kuyruk 36: büyü bastırıcı tasma takılı (adadan sonra da kalır; tapınakta çıkar). */
  tasma?: boolean;
}

/** Kuyruk 36: hapis olaylarının durum yaması (yalnızca verilen alanlar değişir; replay güvenli). */
export type SeruvenPatch = Partial<Pick<SeruvenState, 'page' | 'at' | 'gold' | 'potions' | 'items' | 'xp' | 'rests' | 'done' | 'flags' | 'yerlesim' | 'quests' | 'suc' | 'hapis' | 'tasma'>>;

export type SeruvenCommand =
  | { type: 'start'; id: string; seed: number; party: Array<{ id: string; name: string; sheet: CharacterSheet; status?: CharacterStatus }>; level?: number;
      /** Kuyruk 34b: başlangıçtaki Serüven anahtarları (ırka göre başlangıç). */ toggles?: Record<string, boolean> }
  | { type: 'move'; to: string }
  | { type: 'set_night'; node: string; on: boolean }
  | { type: 'set_toggle'; key: string; on: boolean }
  | { type: 'battle_result'; node: string; outcome: 'won' | 'lost'; statuses: Record<string, CharacterStatus>; xp: number; flags?: string[];
      /** Kuyruk 35: "Savaşları atla (önizleme)": savaş oynanmadan kazanılmış sayıldı (anahtar açık olmalı). */ skipped?: boolean;
      /** Kuyruk 36 (adada): nöbetçiler alarm verdi; emanet sandığı alındı; tasma anahtarı alındı. */ hapisBulgu?: HapisBulgu }
  /** Savaşsız düğüm (ödül, anlatım, dinlenme): alınır, tamamlanır. */
  | { type: 'visit'; node: string }
  /** Kuyruk 32: Game Master seviye atlatır (XP eşiği aşılmışsa). */
  | { type: 'level_up' }
  /** Kuyruk 32: bağlantı girişini arar (beceri sınavı; `roll` d20 sonucu, arayüz rng'den atar). */
  | { type: 'link_check'; link: string; roll: number }
  /** Kuyruk 32: bağlantıdan geçildi (koridorun çıkışına varıldı): karşı uçtaki düğümde ortaya çıkılır. */
  | { type: 'link_cross'; link: string; flags?: string[]; statuses?: Record<string, CharacterStatus> }
  /** Kuyruk 34b: yerleşim (hub) girişi/çıkışı, haritalar arası geçiş (kapı ya da hub), dükkân, han, görev. */
  | { type: 'yerlesim_enter' }
  | { type: 'yerlesim_leave' }
  | { type: 'yerlesim_map'; map: string | null; via?: 'kapi' | 'hub'; statuses?: Record<string, CharacterStatus> }
  | { type: 'shop_buy'; item: string }
  | { type: 'shop_sell'; item: string }
  | { type: 'inn_rest' }
  | { type: 'quest_take'; quest: string }
  | { type: 'quest_claim'; quest: string }
  /** Kuyruk 36: Büyük suç zinciri (seç, savaş sonucu, teslim ol), Hapse at (Game Master), adada kapı geçişi, tasma çıkarma. */
  | { type: 'suc_basla'; suc: string }
  | { type: 'suc_sonuc'; outcome: 'won' | 'lost'; statuses: Record<string, CharacterStatus>; xp: number }
  | { type: 'teslim_ol' }
  | { type: 'hapse_at'; suc?: string }
  | { type: 'hapis_kapi'; to: string | null; statuses?: Record<string, CharacterStatus>; hapisBulgu?: HapisBulgu }
  | { type: 'tasma_cikar'; yol: 'altin' | 'hizmet' };

/** Kuyruk 36: adadaki savaştan çıkan bulgular (alarm, emanet sandığı, tasma anahtarı). */
export interface HapisBulgu { alarm?: boolean; iade?: boolean; tasmaAnahtari?: boolean }

export type SeruvenEvent =
  | { type: 'seruven_started'; state: SeruvenState }
  | { type: 'seruven_moved'; to: string }
  | { type: 'seruven_page'; page: string; resetNight: boolean; /** Kuyruk 34b: geri dönüşte varış (çıkış işareti). */ at?: string }
  | { type: 'seruven_night'; key: string; on: boolean }
  | { type: 'seruven_toggle'; key: string; on: boolean }
  | { type: 'seruven_result'; key: string; outcome: 'won' | 'lost'; statuses: Record<string, CharacterStatus>; xp: number; gold: number; potions: number; flags?: string[]; /** Kuyruk 32: bozgunda uzun dinlenildi. */ rested?: boolean;
      /** Kuyruk 35: savaş atlandı (test anahtarı); kayıtta "atlandı" işareti. */ skipped?: boolean }
  | { type: 'seruven_visited'; key: string; gold: number; potions: number; items: string[] }
  | { type: 'seruven_finished'; result: 'won' | 'lost' }
  | { type: 'seruven_rested'; key: string; statuses: Record<string, CharacterStatus> }
  | { type: 'seruven_leveled'; level: number }
  | { type: 'seruven_link_checked'; link: string; total: number; dc: number; success: boolean; by: string }
  | { type: 'seruven_link_crossed'; link: string; page: string; node: string; flags?: string[]; statuses?: Record<string, CharacterStatus> }
  | { type: 'seruven_yerlesim'; yerlesim: { id: string; map: string | null; from: string | null; seen: string[] } | null; statuses?: Record<string, CharacterStatus> }
  | { type: 'seruven_shop'; gold: number; potions: number; add?: string; remove?: string }
  | { type: 'seruven_inn'; gold: number; statuses: Record<string, CharacterStatus> }
  | { type: 'seruven_quest'; quest: string; state: 'taken' | 'done'; gold: number }
  /** Kuyruk 36: Büyük suç / hapis geçişleri (durum yaması + parti durumları). */
  | { type: 'seruven_hapis'; patch: SeruvenPatch; statuses?: Record<string, CharacterStatus>; label: string };

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

/** Düğüm geçilmiş mi: tamamlanmış ya da yerleşim (Kuyruk 33: "Yakında" yerleşimler yolu kapatmaz). */
const passed = (s: SeruvenState, page: string, id: string) =>
  s.done.includes(nodeKey(page, id)) || !!pageById(page)?.nodes.find((n) => n.id === id)?.yerlesim;
const reqMet = (s: SeruvenState, page: string, req: string[], all?: boolean) =>
  req.length === 0 || (all ? req.every((r) => passed(s, page, r)) : req.some((r) => passed(s, page, r)));

/** Düğüm açık mı (tamamlanmış da açık sayılır). */
export function nodeOpen(s: SeruvenState, page: SeruvenPage, node: SeruvenNode): boolean {
  if (!nodeVisible(s, node)) return false;
  return s.done.includes(nodeKey(page.id, node.id)) || toggleOn(s, 'serbestAcilis') || reqMet(s, page.id, node.requires, node.all);
}
/** Kuyruk 33: Game Master "Serbest gezinti" sayfa sırası kuralını da aşar (çıkış/portal her zaman açık). */
export const gateOpen = (s: SeruvenState, page: SeruvenPage, gate: SeruvenGate | null | undefined): boolean =>
  !!gate && (toggleOn(s, 'serbestGezinti') || (!!s.startPage && gate === page.exit) || reqMet(s, page.id, gate.requires, gate.all));

const statusOf = (m: JourneyMember, statuses: Record<string, CharacterStatus>) => statuses[m.id] ?? m.status;

export function executeSeruven(state: SeruvenState | null, cmd: SeruvenCommand): SeruvenResult {
  if (cmd.type === 'start') {
    if (!cmd.party.length) return fail('Parti boş.');
    const start = pageById(SERUVEN.baslangic);
    if (!start) return fail('Başlangıç sayfası yok.');
    const level = cmd.level ?? Math.max(1, ...cmd.party.map((p) => p.sheet.level));
    // Kuyruk 34b: ırka göre başlangıç (anahtar açıksa; ilk karakterin türü). Kapalıysa eski başlangıç (Buzul girişi).
    const toggles = cmd.toggles ?? {};
    const irkOn = toggles.irkBaslangic ?? SERUVEN.anahtarlar.irkBaslangic?.default ?? false;
    const home = irkOn ? irkBaslangic(cmd.party[0]?.sheet.raceId) : null;
    const homePage = home ? pageById(home.page) : undefined;
    const s: SeruvenState = {
      id: cmd.id, seed: cmd.seed, level, page: homePage?.id ?? start.id, at: homePage ? home!.at : 'giris', done: [], flags: [],
      party: cmd.party.map((p) => ({ id: p.id, name: p.name, sheet: p.sheet, status: p.status ?? longRestStatus(p.sheet, undefined) })),
      gold: 0, potions: 0, xp: 0, items: [], toggles, night: [], result: null,
      ...(homePage ? { startPage: homePage.id } : {}),
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
      // Kuyruk 34b: ırka göre başlangıçta önceki sayfaya geri dönüş (o sayfanın çıkışına varılır).
      if (cmd.to === 'geri') {
        const prev = prevPage(state, page);
        if (!prev) return fail('Geri dönülecek sayfa yok.');
        return done(state, [{ type: 'seruven_moved', to: 'giris' }, { type: 'seruven_page', page: prev.id, resetNight: toggleOn(state, 'otomatikGunduz'), at: 'cikis' }]);
      }
      if (cmd.to === 'cikis' && page.id === HAPIS.sayfa && state.hapis) {
        if (!gateOpen(state, page, page.exit)) return fail('Çıkış henüz kapalı.');
        return done(state, [kacisEvent(state)]);
      }
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
    case 'yerlesim_enter': case 'yerlesim_leave': case 'yerlesim_map': case 'shop_buy': case 'shop_sell': case 'inn_rest': case 'quest_take': case 'quest_claim':
      return yerlesimCommand(state, page, cmd);
    case 'suc_basla': case 'suc_sonuc': case 'teslim_ol': case 'hapse_at': case 'hapis_kapi': case 'tasma_cikar':
      return hapisCommand(state, page, cmd);
    case 'level_up': {
      if (!toggleOn(state, 'seviyeAtlama')) return fail('Serüven seviye atlama kapalı.');
      // Kuyruk 38: seviye sınırı 5; "Üst seviye" açıkken 20 (Kuyruk 19; önce 10).
      if (state.level >= levelCap(toggleOn(state, 'ustSeviye'))) return fail('Seviye sınırına ulaşıldı.');
      const need = levelXp(state.level);
      if (need === null || state.xp < need) return fail('XP eşiği aşılmadı.');
      return done(state, [{ type: 'seruven_leveled', level: state.level + 1 }]);
    }
    case 'link_check': {
      const link = linkById(cmd.link);
      if (!link || !linkAt(state, link)) return fail('Burada bağlantı yok.');
      if (linkOpen(state, link)) return fail('Bağlantı zaten açık.');
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
      if (node.yerlesim) return fail('Yerleşimde savaş yok.');
      const stop = nodeStop(node, state.level);
      if (cmd.skipped && (!toggleOn(state, 'savaslariAtla') || cmd.outcome !== 'won' || stop?.kind !== 'battle')) return fail('Savaş atlanamaz.');
      const key = nodeKey(page.id, node.id);
      // Kuyruk 36: adada (Hapishane kuralları açıkken) 0 HP öldürmez; yenilgi kısa ceza ya da başarısızlık.
      const kural = !!state.hapis?.kurallar && page.id === HAPIS.sayfa;
      if (kural && cmd.outcome === 'lost') return done(state, [hapisYenilgi(state, cmd.statuses)]);
      let statuses = kural ? Object.fromEntries(Object.entries(cmd.statuses).map(([k, v]) => [k, nonlethal(v)])) : cmd.statuses;
      // Bozgunda (anahtar açıksa) parti uzun dinlenir ve yeniden dener; mevcut dinlenme kuralı (ölü ölü kalır).
      const rested = cmd.outcome === 'lost' && toggleOn(state, 'bozgundaYenidenDene');
      if (rested) {
        statuses = Object.fromEntries(state.party.map((m) => [m.id, longRestStatus(m.sheet, statusOf(m, cmd.statuses))]));
      }
      const evs: SeruvenEvent[] = [{
        type: 'seruven_result', key, outcome: cmd.outcome, statuses, xp: cmd.xp,
        gold: cmd.outcome === 'won' ? stop?.reward?.gold ?? 0 : 0, potions: cmd.outcome === 'won' ? (stop?.potions ?? 0) + (stop?.reward?.potions ?? 0) : 0,
        ...(cmd.flags?.length ? { flags: cmd.flags } : {}), ...(rested ? { rested: true } : {}), ...(cmd.skipped ? { skipped: true } : {}),
      }];
      const able = state.party.some((m) => { const st = statusOf(m, statuses); return !st.dead && st.hp > 0; });
      if (!able && !kural) evs.push({ type: 'seruven_finished', result: 'lost' });
      const bulgu = state.hapis && page.id === HAPIS.sayfa ? bulguEvent(applySeruvenEvents(state, evs) ?? state, cmd.hapisBulgu) : null;
      if (bulgu) evs.push(bulgu);
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
    case 'seruven_page': return { ...s, page: e.page, at: e.at ?? 'giris', ...(e.resetNight ? { night: [] } : {}) };
    case 'seruven_night': return { ...s, night: e.on ? [...new Set([...s.night, e.key])] : s.night.filter((k) => k !== e.key) };
    case 'seruven_toggle': return { ...s, toggles: { ...s.toggles, [e.key]: e.on } };
    case 'seruven_result': return {
      ...s, ...(e.outcome === 'lost' && e.rested ? { rests: (s.rests ?? 0) + 1 } : {}), done: e.outcome === 'won' && !s.done.includes(e.key) ? [...s.done, e.key] : s.done,
      party: s.party.map((m) => ({ ...m, status: e.statuses[m.id] ?? m.status })),
      xp: s.xp + e.xp, gold: s.gold + e.gold, potions: s.potions + e.potions,
      flags: [...new Set([...s.flags, ...(e.flags ?? [])])],
      ...(e.skipped ? { skipped: [...new Set([...(s.skipped ?? []), e.key])] } : {}),
    };
    case 'seruven_visited': return { ...s, done: [...s.done, e.key], gold: s.gold + e.gold, potions: s.potions + e.potions, items: [...s.items, ...e.items] };
    case 'seruven_finished': return { ...s, result: e.result };
    case 'seruven_rested': return { ...s, done: [...s.done, e.key], rests: (s.rests ?? 0) + 1, party: s.party.map((m) => ({ ...m, status: e.statuses[m.id] ?? m.status })) };
    case 'seruven_leveled': return { ...s, level: e.level, party: s.party.map((m) => (m.sheet.level < e.level ? { ...m, sheet: { ...m.sheet, level: e.level } } : m)) };
    case 'seruven_link_checked': return e.success ? { ...s, links: [...new Set([...(s.links ?? []), e.link])] } : { ...s, linkTry: { ...(s.linkTry ?? {}), [e.link]: s.rests ?? 0 } };
    case 'seruven_yerlesim': return {
      ...s, yerlesim: e.yerlesim, ...(e.statuses ? { party: s.party.map((m) => ({ ...m, status: e.statuses?.[m.id] ?? m.status })) } : {}),
    };
    case 'seruven_shop': return {
      ...s, gold: s.gold + e.gold, potions: s.potions + e.potions,
      items: e.remove ? (() => { const i = s.items.indexOf(e.remove as string); return i < 0 ? s.items : [...s.items.slice(0, i), ...s.items.slice(i + 1)]; })() : e.add ? [...s.items, e.add] : s.items,
    };
    case 'seruven_inn': return { ...s, gold: s.gold + e.gold, rests: (s.rests ?? 0) + 1, party: s.party.map((m) => ({ ...m, status: e.statuses[m.id] ?? m.status })) };
    case 'seruven_quest': return { ...s, gold: s.gold + e.gold, quests: { ...(s.quests ?? {}), [e.quest]: e.state } };
    case 'seruven_hapis': return {
      ...s, ...e.patch, ...(e.statuses ? { party: s.party.map((m) => ({ ...m, status: e.statuses?.[m.id] ?? m.status })) } : {}),
    };
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
/**
 * Düğüm görünür mü: bayraklı alt düğüm bayrak alınınca; Kuyruk 41b: `ustSeviyeGizli` düğüm (yalnızca 1–5. seviye
 * senaryosu, ör. Kale Baskını haritası) "Üst seviye" anahtarı açıkken gizli.
 */
export const nodeVisible = (s: Pick<SeruvenState, 'flags' | 'toggles'>, node: SeruvenNode): boolean =>
  (!node.bayrak || s.flags.includes(node.bayrak)) && !(node.ustSeviyeGizli && toggleOn(s, 'ustSeviye'));

/** Bir sonraki seviyenin XP eşiği (yolculuk kuralları; SRD 5.2.1). */
export const levelXp = (level: number): number | null => nextLevelXp(level);

export const linkById = (id: string): SeruvenLink | undefined => (SERUVEN.baglantilar ?? []).find((l) => l.id === id);
/** Parti bu bağlantının bir ucunda mı. */
export const linkAt = (s: SeruvenState, l: SeruvenLink): boolean =>
  (s.page === l.a.page && s.at === l.a.node) || (s.page === l.b.page && s.at === l.b.node);
/** Su Altı Geçidi: bağlantının keşif bayrağı alınmış mı. */
export const linkFound = (s: SeruvenState, l: SeruvenLink): boolean => !!l.bayrak && s.flags.includes(l.bayrak);
/** Bağlantı açık mı: beceri sınavıyla bulunmuş ya da keşif bayrağı alınmış. */
export const linkOpen = (s: SeruvenState, l: SeruvenLink): boolean => !!s.links?.includes(l.id) || linkFound(s, l);
/** Bulunulan düğümdeki bağlantılar. */
export const linksHere = (s: SeruvenState): SeruvenLink[] => (SERUVEN.baglantilar ?? []).filter((l) => linkAt(s, l));
/** Bağlantıdan geçilebilir mi: açık, partinin bulunduğu uçta; b → a yönü `geriKilit` tamamlanmadan kapalı (Serbest gezinti açar). */
export function linkCrossable(s: SeruvenState, l: SeruvenLink): boolean {
  if (!linkOpen(s, l) || !linkAt(s, l)) return false;
  // Su Altı Geçidi: şelale geçidinden keşfedilen bağlantı iki yönde açık.
  if (linkFound(s, l)) return true;
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


/** Kuyruk 34b: ırka göre başlangıçta önceki sayfa (bu sayfayı `next` olarak gösteren; Volkan Adası'nın öncesi yok). */
export function prevPage(s: Pick<SeruvenState, 'startPage'>, page: SeruvenPage): SeruvenPage | undefined {
  if (!s.startPage) return undefined;
  return SERUVEN.pages.find((p) => p.next === page.id && !p.ada);
}

/** Kuyruk 34b: bulunulan düğümün yerleşimi (yerleşim verisi olan düğüm; "Yakında" olanlarda yok). */
export function nodeYerlesim(s: SeruvenState): string | null {
  const node = pageById(s.page)?.nodes.find((n) => n.id === s.at);
  return node?.yerlesim && yerlesimById(node.yerlesim) ? node.yerlesim : null;
}

function yerlesimCommand(state: SeruvenState, page: SeruvenPage, cmd: SeruvenCommand): SeruvenResult {
  const cur = state.yerlesim;
  const y = cur ? yerlesimById(cur.id) : undefined;
  switch (cmd.type) {
    case 'yerlesim_enter': {
      if (!toggleOn(state, 'yerlesimler')) return fail('Yerleşimler kapalı.');
      const id = nodeYerlesim(state);
      if (!id) return fail('Burada yerleşim yok.');
      return done(state, [{ type: 'seruven_yerlesim', yerlesim: { id, map: null, from: null, seen: [] } }]);
    }
    case 'yerlesim_leave':
      if (!cur) return fail('Yerleşimde değilsiniz.');
      return done(state, [{ type: 'seruven_yerlesim', yerlesim: null }]);
    case 'yerlesim_map': {
      if (!cur || !y) return fail('Yerleşimde değilsiniz.');
      if (cmd.map === null) return done(state, [{ type: 'seruven_yerlesim', yerlesim: { ...cur, map: null, from: cur.map }, ...(cmd.statuses ? { statuses: cmd.statuses } : {}) }]);
      const target = yerlesimHarita(y, cmd.map);
      if (!target) return fail('Yerleşimde böyle harita yok.');
      if (cmd.via === 'kapi') {
        const from = cur.map ? yerlesimHarita(y, cur.map) : undefined;
        if (!toggleOn(state, 'yerlesimKapi') || !from?.kapilar.some((k) => k.to === cmd.map)) return fail('Bu kapı oraya açılmıyor.');
      } else if (cur.map !== null) {
        return fail('Haritadan hub\'a dönmeden başka haritaya geçilemez.');
      } else if (toggleOn(state, 'yerlesimKapi') && cmd.map !== y.baslangic && !cur.seen.includes(cmd.map)) {
        return fail('Bu haritaya önce kapıdan ulaşılmalı.');
      }
      const seen = cur.seen.includes(cmd.map) ? cur.seen : [...cur.seen, cmd.map];
      return done(state, [{ type: 'seruven_yerlesim', yerlesim: { id: cur.id, map: cmd.map, from: cmd.via === 'kapi' ? cur.map : null, seen }, ...(cmd.statuses ? { statuses: cmd.statuses } : {}) }]);
    }
    case 'shop_buy': case 'shop_sell': {
      if (!cur || !y?.hub.dukkan) return fail('Burada dükkân yok.');
      const u = urunById(cmd.item);
      if (!u) return fail('Ürün yok.');
      if (cmd.type === 'shop_buy') {
        if (state.gold < u.fiyat) return fail('Altın yetmiyor.');
        return done(state, [{ type: 'seruven_shop', gold: -u.fiyat, potions: u.tur === 'iksir' ? 1 : 0, ...(u.tur === 'iksir' ? {} : { add: u.id }) }]);
      }
      if (u.tur === 'iksir' ? state.potions < 1 : !state.items.includes(u.id)) return fail('Satılacak ürün yok.');
      return done(state, [{ type: 'seruven_shop', gold: satisFiyati(u), potions: u.tur === 'iksir' ? -1 : 0, ...(u.tur === 'iksir' ? {} : { remove: u.id }) }]);
    }
    case 'inn_rest': {
      if (!cur || !y?.hub.han) return fail('Burada han yok.');
      if (state.gold < YERLESIM.hanUcreti) return fail('Altın yetmiyor.');
      return done(state, [{ type: 'seruven_inn', gold: -YERLESIM.hanUcreti, statuses: Object.fromEntries(state.party.map((m) => [m.id, longRestStatus(m.sheet, m.status)])) }]);
    }
    case 'quest_take': case 'quest_claim': {
      if (!cur || !y?.hub.gorevler.includes(cmd.quest)) return fail('Bu görev burada yok.');
      const g = gorevById(cmd.quest);
      if (!g) return fail('Görev yok.');
      if (g.zincir) return fail('Bu görev kendi akışıyla yürür.');
      const st = state.quests?.[g.id];
      if (cmd.type === 'quest_take') return st ? fail('Görev zaten alındı.') : done(state, [{ type: 'seruven_quest', quest: g.id, state: 'taken', gold: 0 }]);
      if (st !== 'taken') return fail('Görev alınmadı ya da ödülü alındı.');
      if (!state.done.includes(nodeKey(g.hedef.page, g.hedef.node))) return fail('Görev henüz tamamlanmadı.');
      return done(state, [{ type: 'seruven_quest', quest: g.id, state: 'done', gold: g.odul.gold }]);
    }
    default: return fail('Bilinmeyen komut.');
  }
  void page;
}

// ——— Kuyruk 36: Büyük suç ve Hapishane Adası ———

const prisonKeys = (s: SeruvenState) => s.done.filter((k) => !k.startsWith(`${HAPIS.sayfa}/`));
const allStatuses = (s: SeruvenState, f: (m: JourneyMember, st: CharacterStatus) => CharacterStatus, given?: Record<string, CharacterStatus>) =>
  Object.fromEntries(s.party.map((m) => [m.id, f(m, given?.[m.id] ?? m.status)]));

/** Hapse atılma: Hapishane Adası'nın hücre bloğu; kurallar açıksa altın/iksir/eşya emanete, tasma takılır, bayılanlar yaşar. */
export function hapseAtEvent(state: SeruvenState, suc: string, statuses?: Record<string, CharacterStatus>): SeruvenEvent {
  const kurallar = toggleOn(state, 'hapishaneKurallari');
  const hapis: HapisDurum = {
    suc, emanet: kurallar ? { gold: state.gold, potions: state.potions, items: [...state.items] } : { gold: 0, potions: 0, items: [] },
    alarm: 0, ceza: 0, from: null, kurallar,
  };
  return {
    type: 'seruven_hapis', label: 'hapis',
    patch: { page: HAPIS.sayfa, at: HAPIS.baslangic, yerlesim: null, suc: null, hapis, done: prisonKeys(state), ...(kurallar ? { gold: 0, potions: 0, items: [], tasma: true } : {}) },
    ...(statuses || kurallar ? { statuses: allStatuses(state, (_m, st) => (kurallar ? nonlethal(st) : st), statuses) } : {}),
  };
}

/**
 * Kuyruk 41b: adadan çıkışta ve başarısızlıkta emanet geri verilir (iade edilmediyse altın/iksir/eşya) ve tasma çıkar
 * (büyüler döner). Ada içinde emanet sandığı ve tasma anahtarı yine erken kazanır.
 */
function emanetGeri(state: SeruvenState): Partial<SeruvenState> {
  const h = state.hapis;
  const back = h && h.kurallar && !h.iade ? h.emanet : { gold: 0, potions: 0, items: [] as string[] };
  return { gold: state.gold + back.gold, potions: state.potions + back.potions, items: [...state.items, ...back.items], tasma: false };
}

/** Kaçış (iskeleden kayıkla ya da sayfa çıkışından): Batı Kıyısı Liman, "kacis-tamam"; emanet geri, tasma çıkar (Kuyruk 41b). */
function kacisEvent(state: SeruvenState, statuses?: Record<string, CharacterStatus>): SeruvenEvent {
  return {
    type: 'seruven_hapis', label: 'kacis',
    patch: { page: HAPIS.donus.page, at: HAPIS.donus.at, hapis: null, flags: [...new Set([...state.flags, HAPIS.donus.flag])], ...emanetGeri(state) },
    ...(statuses ? { statuses } : {}),
  };
}

/** Adada yenilgi: hücre bloğunda `cezaSiniri` kez kısa ceza (hücreye geri, alarm +1); sonra başarısızlık (Beyaz Şehir hub'ı; Kuyruk 41b: emanet geri, tasma çıkar). */
function hapisYenilgi(state: SeruvenState, statuses: Record<string, CharacterStatus>): SeruvenEvent {
  const h = state.hapis as HapisDurum;
  if (state.at === HAPIS.baslangic && h.ceza < HAPIS.cezaSiniri) {
    return { type: 'seruven_hapis', label: 'ceza', patch: { hapis: { ...h, ceza: h.ceza + 1, alarm: h.alarm + 1 } }, statuses: allStatuses(state, (_m, st) => wakeUp(st), statuses) };
  }
  const b = HAPIS.basarisizlik;
  return {
    type: 'seruven_hapis', label: 'basarisiz',
    patch: { page: b.page, at: b.at, yerlesim: { id: b.yerlesim, map: null, from: null, seen: [] }, hapis: null, ...emanetGeri(state),
      done: prisonKeys(state), flags: [...new Set([...state.flags, b.flag])], rests: (state.rests ?? 0) + 1 },
    statuses: allStatuses(state, (m, st) => dragBack(m.sheet, st), statuses),
  };
}

/** Bulgular: alarm düzeyi, emanet iadesi (altın/iksir/eşya geri), tasma anahtarı (tasma çıkar). */
function bulguEvent(state: SeruvenState, b: HapisBulgu | undefined): SeruvenEvent | null {
  const h = state.hapis;
  if (!h || !b || !(b.alarm || (b.iade && !h.iade) || (b.tasmaAnahtari && state.tasma))) return null;
  const iade = !!b.iade && !h.iade;
  return {
    type: 'seruven_hapis', label: 'bulgu',
    patch: {
      hapis: { ...h, alarm: h.alarm + (b.alarm ? 1 : 0), ...(iade ? { iade: true, emanet: { gold: 0, potions: 0, items: [] } } : {}) },
      ...(iade ? { gold: state.gold + h.emanet.gold, potions: state.potions + h.emanet.potions, items: [...state.items, ...h.emanet.items] } : {}),
      ...(b.tasmaAnahtari && state.tasma ? { tasma: false } : {}),
    },
  };
}

function hapisCommand(state: SeruvenState, page: SeruvenPage, cmd: SeruvenCommand): SeruvenResult {
  switch (cmd.type) {
    case 'suc_basla': {
      if (state.hapis || state.suc) return fail('Zaten bir suç zinciri ya da hapis sürüyor.');
      const y = state.yerlesim ? yerlesimById(state.yerlesim.id) : undefined;
      if (y?.id !== HAPIS.hub || !y.hub.gorevler.some((g) => gorevById(g)?.zincir === 'buyuk-suc')) return fail('Büyük suç yalnızca Beyaz Şehir\'de.');
      if (!sucById(cmd.suc)) return fail('Böyle bir suç yok.');
      return done(state, [{ type: 'seruven_hapis', label: 'suc', patch: { suc: { id: cmd.suc, asama: 'on' } } }]);
    }
    case 'suc_sonuc': {
      const suc = state.suc;
      if (!suc) return fail('Suç zinciri yok.');
      if (cmd.outcome === 'lost') return done(state, [hapseAtEvent(state, suc.id, cmd.statuses)]);
      if (suc.asama === 'on') return done(state, [{ type: 'seruven_hapis', label: 'suc-baskin', patch: { suc: { ...suc, asama: 'baskin' }, xp: state.xp + cmd.xp }, statuses: cmd.statuses }]);
      return done(state, [{
        type: 'seruven_hapis', label: 'suc-tamam',
        patch: { suc: null, xp: state.xp + cmd.xp, gold: state.gold + HAPIS.sucOdulu, quests: { ...(state.quests ?? {}), 'buyuk-suc': 'done' }, flags: [...new Set([...state.flags, 'buyuk-suc-tamam'])] },
        statuses: cmd.statuses,
      }]);
    }
    case 'teslim_ol':
      if (!state.suc) return fail('Teslim olunacak bir baskın yok.');
      return done(state, [hapseAtEvent(state, state.suc.id)]);
    case 'hapse_at':
      if (state.hapis) return fail('Parti zaten hapiste.');
      return done(state, [hapseAtEvent(state, cmd.suc ?? 'gm')]);
    case 'hapis_kapi': {
      if (!state.hapis || page.id !== HAPIS.sayfa) return fail('Adada değilsiniz.');
      const node = page.nodes.find((n) => n.id === state.at);
      if (!node || !state.done.includes(nodeKey(page.id, node.id))) return fail('Önce bu bölümü geç.');
      const after = (s: SeruvenState): SeruvenEvent | null => bulguEvent(s, cmd.hapisBulgu);
      const st = state.hapis.kurallar && cmd.statuses ? Object.fromEntries(Object.entries(cmd.statuses).map(([k, v]) => [k, nonlethal(v)])) : cmd.statuses;
      if (cmd.to === node.id) {
        const evs: SeruvenEvent[] = [{ type: 'seruven_hapis', label: 'kal', patch: {}, ...(st ? { statuses: st } : {}) }];
        const b = after(applySeruvenEvents(state, evs) ?? state); if (b) evs.push(b);
        return done(state, evs);
      }
      if (!node.kapilar?.some((k) => k.to === cmd.to)) return fail('Bu kapı oraya açılmıyor.');
      const evs: SeruvenEvent[] = [];
      const b = after(state); if (b) evs.push(b);
      const mid = applySeruvenEvents(state, evs) ?? state;
      if (cmd.to === null) evs.push(kacisEvent(mid, st));
      else evs.push({ type: 'seruven_hapis', label: 'kapi', patch: { at: cmd.to, hapis: { ...(mid.hapis as HapisDurum), from: node.id } }, ...(st ? { statuses: st } : {}) });
      return done(state, evs);
    }
    case 'tasma_cikar': {
      if (!state.tasma) return fail('Tasma takılı değil.');
      const y = state.yerlesim ? yerlesimById(state.yerlesim.id) : undefined;
      if (!y?.hub.tapinak) return fail('Burada tapınak yok.');
      if (cmd.yol === 'altin') {
        if (state.gold < HAPIS.tasmaUcreti) return fail('Altın yetmiyor.');
        return done(state, [{ type: 'seruven_hapis', label: 'tasma', patch: { tasma: false, gold: state.gold - HAPIS.tasmaUcreti } }]);
      }
      return done(state, [{ type: 'seruven_hapis', label: 'tasma', patch: { tasma: false, rests: (state.rests ?? 0) + 1 } }]);
    }
    default:
      return fail('Bilinmeyen komut.');
  }
}

/** Kuyruk 36: düğüm haritasında kapı (0 tabanlı konum). */
export function nodeKapiAt(node: SeruvenNode, pos: { col: number; row: number }): { to: string | null } | undefined {
  return node.kapilar?.find((k) => k.hexes.some(([c, r]) => c - 1 === pos.col && r - 1 === pos.row));
}
