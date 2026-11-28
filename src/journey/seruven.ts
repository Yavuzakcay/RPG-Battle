/**
 * Kuyruk 31: Serüven (kıta sayfaları). Yolculuk motorunun kalıbıyla (komut → olay → reducer, replay) ince bir katman:
 * sayfa (`data/seruven.json`), düğüm durumları, parti konumu, bayraklar, Serüven anahtarları. Savaşlar yolculuğun
 * parçalarıyla kurulur (sim senaryosu ya da sefer düğümü → `JourneyStop`, `app/seruvenBattle.ts`); parti durumu,
 * altın, iksir, XP aynı alanlarda. Saf; zarlar rng'den (şimdilik zar yok).
 */
import { reduceRoam, roamEvents, type RoamCommand, type RoamEvent } from '../world/roam';
import { withFog } from '../world/seruvenFog';
import data from '../../data/seruven.json';
import { longRestStatus, zeroHpWakeHours } from '../rules/characterRest';
import { grantHeroic, hasHeroic, withHeroic } from '../rules/heroicInspiration';
import { seededRng } from '../rules/dice';
import type { CharacterStatus } from '../rules/characterRest';
import type { CharacterSheet } from '../rules/stats';
import { seferById, seferRoute } from './sefer';
import { nextLevelXp } from './engine';
import { combatantFromSheet } from '../battle/create';
import { armor, monsters } from '../data';
import { classKit } from '../rules/classFeatures';
import { eligibleForms, shapeLimits } from '../battle/druid';
import { skillBonus, type Skill } from '../rules/skills';
import type { JourneyMember, JourneyStop } from './types';
import { gorevById, irkBaslangic, urunById, satisFiyati, yerlesimById, yerlesimHarita, YERLESIM } from '../yerlesim/yerlesim';
import { LEVEL_CAP } from '../app/limits';
import { HAPIS, dragBack, nonlethal, sucById, wakeUp, type HapisDurum } from './hapishane';
import { moralDeltas, moralStatuses, reviveCaster, revivedStatus, type MoralReason } from './moral';
import { MORAL } from '../rules/moral';
import { addUse, changeCounts, choicesBound, fitChanges, pickChoiceFields, type ChoiceUse, type ChoiceWindow } from '../rules/levelChoices';
import { blankCharacter, characterIssues, classScoped } from '../rules/builder';

export interface SeruvenNode {
  id: string; x: number; y: number; requires: string[]; all?: boolean; optional?: boolean; boss?: boolean; zorluk?: number;
  /** Sim senaryosu (harita + seviyeye göre düşman). */ scenario?: string;
  /** Gece için ayrı senaryo (yoksa haritanın `gece` varyantı). */ gece?: string;
  /** Sefer düğümü `<sefer>:<düğüm>` (data/seferler.json). */ sefer?: string;
  /** Kuyruk 32: keşif bayrağıyla açılan gizli düğüm (bayrak yokken görünmez; ör. Heykel Mağarası). */ bayrak?: string;
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
  /** Görev WS92: üye başına son Wild Shape biçim değişiminin yapıldığı dinlenme sayısı (uzun dinlenmede bir değişim). */
  formSwaps?: Record<string, number>;
  /**
   * Görev B93 (A2): Serüven'de son seviye atlamasının seviyesi (seviye penceresi bu seviyede açık) ve üye başına pencere
   * kullanımları (`seviye`: [seviye, kullanım], `dinlenme`: [dinlenme sayısı, kullanım]; `src/rules/levelChoices.ts`).
   */
  levelGained?: number;
  choiceUse?: Record<string, { seviye?: [number, Record<string, number>]; dinlenme?: [number, Record<string, number>] }>;
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
  /** K46: dünya haritası keşif sisi (96×42 bit, base64; `src/world/seruvenFog.ts`). Yoksa başlangıç durumu. */
  kesif?: string;
  /** K47: serbest gezinti (yoksa eski davranış): dünya konumu, saat (Serüven başından), açılmış hub'lar, yumuşak kilit kontrolleri. */
  konum?: [number, number]; saat?: number; hublar?: string[]; kontroller?: Record<string, { ok: boolean; durum: string }>;
  /** K47: son yürüyüş/seyahatte karşılaşma (altyapı; savaş bağlantısı denge turuna kadar bildirim). */
  karsilasma?: { bolge: string | null; at: [number, number] | null } | null;
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
  | { type: 'level_up'; /** Görev MC5 (K12): çoklu sınıflı üyenin seviye aldığı sınıf (üye → sınıf; yoksa ilk sınıfı). */ classOf?: Record<string, string> }
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
  | { type: 'tasma_cikar'; yol: 'altin' | 'hizmet' }
  /** Kuyruk K48: Moral: ölü üyeyi dirilt (yerleşim tapınağı altınla ya da partide diriltme büyüsü). */
  | { type: 'moral_dirilt'; memberId: string; yol: 'tapinak' | 'buyu' }
  /**
   * Görev HEROIC-INSPIRATION-TAM (SRD 5.2.1 s. 7): Game Master üyeye Heroic Inspiration verir (olay, diyalog, iyi oyun); üyede
   * varsa `passTo` (hakkı olmayan üye) alır, yoksa yeni hak kaybolur (bir seferde en çok bir).
   */
  | { type: 'ilham_ver'; memberId: string; passTo?: string }
  /**
   * Görev WS92 (SRD 5.2.1 s. 42 "Known Forms"): Wild Shape biçim listesi: boş yere biçim eklenir (sınıra dek, her zaman);
   * dolu listede bir biçim yenisiyle değişir (son uzun dinlenmeden beri bir kez).
   */
  | { type: 'form_swap'; memberId: string; from: string | null; to: string }
  /** Görev B93 (A2): seviye atlama / uzun dinlenme seçimleri (yalnız seçim alanları, `CHOICE_FIELDS`). */
  | { type: 'set_choices'; memberId: string; sheet: Partial<CharacterSheet> }
  /** K47: dünya haritasında yürü, hızlı seyahat (gemi/uçuş), yumuşak kilit kontrolü (`src/world/roam.ts`). */
  | RoamCommand;

/** Kuyruk 36: adadaki savaştan çıkan bulgular (alarm, emanet sandığı, tasma anahtarı). */
export interface HapisBulgu { alarm?: boolean; iade?: boolean; tasmaAnahtari?: boolean }

export type SeruvenEvent =
  | { type: 'seruven_started'; state: SeruvenState }
  | { type: 'seruven_moved'; to: string }
  | { type: 'seruven_page'; page: string; resetNight: boolean; /** Kuyruk 34b: geri dönüşte varış (çıkış işareti). */ at?: string }
  | { type: 'seruven_night'; key: string; on: boolean }
  | { type: 'seruven_toggle'; key: string; on: boolean }
  | { type: 'seruven_result'; key: string; outcome: 'won' | 'lost'; statuses: Record<string, CharacterStatus>; xp: number; gold: number; potions: number; flags?: string[]; /** Kuyruk 32: bozgunda uzun dinlenildi. */ rested?: boolean; /** KARAR104-KALAN: bozgun dinlenmesinde 0 HP'den kalkış saati. */ wakeHours?: number; /** Kuyruk K48: savaşta düşen üyeler (Moral). */ downed?: string[];
      /** Kuyruk 35: savaş atlandı (test anahtarı); kayıtta "atlandı" işareti. */ skipped?: boolean }
  | { type: 'seruven_visited'; key: string; gold: number; potions: number; items: string[] }
  | { type: 'seruven_finished'; result: 'won' | 'lost' }
  | { type: 'seruven_rested'; key: string; statuses: Record<string, CharacterStatus>; /** KARAR104-KALAN: 0 HP'den kalkış saati (`saat` varsa eklenir). */ wakeHours?: number }
  /** Kuyruk K48: Moral değişimi (nedenler, Moral ölümleri); yalnızca değişen üyelerin durumu. */
  | { type: 'seruven_moral'; statuses: Record<string, CharacterStatus>; reasons: MoralReason[]; deaths: string[] }
  /** Kuyruk K48: diriltme (tapınak ya da büyü): durumlar (dirilen + büyücünün slotu) ve harcanan altın. */
  | { type: 'seruven_dirildi'; memberId: string; yol: 'tapinak' | 'buyu'; statuses: Record<string, CharacterStatus>; gold: number }
  /** Görev HEROIC-INSPIRATION-TAM: Heroic Inspiration (Game Master ya da düğüm ödülü); `lost`: üyede vardı, aktarılmadı. */
  | { type: 'seruven_ilham'; statuses: Record<string, CharacterStatus>; neden: 'gm' | 'odul'; from?: string; lost?: string }
  | { type: 'seruven_leveled'; level: number; /** Görev MC5 (K12): çoklu sınıflı üyelerin seviye aldığı sınıf. */ classOf?: Record<string, string> }
  /** Görev WS92: üyenin Wild Shape biçim listesi değişti (`swap`: değişim, dinlenme sayısına bağlanır). */
  | { type: 'seruven_forms'; memberId: string; forms: string[]; swap: boolean }
  /** Görev B93 (A2): üyenin seçim alanları değişti; `use` açık pencerelerde harcanan değişimler. */
  | { type: 'seruven_choices'; memberId: string; patch: Partial<CharacterSheet>; use: ChoiceUse }
  | { type: 'seruven_link_checked'; link: string; total: number; dc: number; success: boolean; by: string }
  | { type: 'seruven_link_crossed'; link: string; page: string; node: string; flags?: string[]; statuses?: Record<string, CharacterStatus> }
  | { type: 'seruven_yerlesim'; yerlesim: { id: string; map: string | null; from: string | null; seen: string[] } | null; statuses?: Record<string, CharacterStatus> }
  | { type: 'seruven_shop'; gold: number; potions: number; add?: string; remove?: string }
  | { type: 'seruven_inn'; gold: number; statuses: Record<string, CharacterStatus>; wakeHours?: number }
  | { type: 'seruven_quest'; quest: string; state: 'taken' | 'done'; gold: number }
  /** Kuyruk 36: Büyük suç / hapis geçişleri (durum yaması + parti durumları). */
  | { type: 'seruven_hapis'; patch: SeruvenPatch; statuses?: Record<string, CharacterStatus>; label: string }
  | RoamEvent;

export type SeruvenResult = { ok: true; state: SeruvenState; events: SeruvenEvent[] } | { ok: false; error: string };
const fail = (error: string): SeruvenResult => ({ ok: false, error });
export const nodeKey = (page: string, node: string) => `${page}/${node}`;

export const toggleOn = (s: Pick<SeruvenState, 'toggles'>, key: string): boolean => s.toggles[key] ?? SERUVEN.anahtarlar[key]?.default ?? false;
/** Görev KARAR104 (A11): 0 HP'de uzun dinlenme; anahtar `kolayDinlenme` açıkken ev kuralı (tam), yoksa SRD (1 HP). */
export const zeroHpRest = (s: Pick<SeruvenState, 'toggles'>): 'srd' | 'ev' => (toggleOn(s, 'kolayDinlenme') ? 'ev' : 'srd');

/**
 * Görev KARAR104-KALAN (A11'in ⚠'si; SRD 5.2.1 s. 18): Serüven uzun dinlenmesinde 0 HP'deki üyenin kalkışı 1d4 saat. Saat yalnız
 * serbest gezintide tutulur (`saat`); yoksa (gün = dinlenme sayısı, eski kayıt) eklenecek saat yok: 0. Zar Serüven tohumundan ve
 * dinlenme sayısından (komutlar zarsız; replay aynı).
 */
function wakeHoursOf(state: SeruvenState, statuses: CharacterStatus[], salt: string): number {
  if (state.saat === undefined) return 0;
  let h = (state.seed ^ ((state.rests ?? 0) * 0x9e3779b1)) >>> 0;
  for (const ch of salt) h = (Math.imul(h ^ ch.charCodeAt(0), 16777619)) >>> 0;
  return zeroHpWakeHours(statuses, zeroHpRest(state), seededRng(h));
}

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
        const wake = wakeHoursOf(state, state.party.map((m) => m.status), key);
        return done(state, [{ type: 'seruven_rested', key, statuses: Object.fromEntries(state.party.map((m) => [m.id, longRestStatus(m.sheet, m.status, undefined, zeroHpRest(state))])), ...(wake ? { wakeHours: wake } : {}) }]);
      }
      const visited: SeruvenEvent = { type: 'seruven_visited', key, gold: stop.reward?.gold ?? 0, potions: stop.reward?.potions ?? 0, items: stop.reward?.items ?? [] };
      // Görev HEROIC-INSPIRATION-TAM: olay/diyalog ödülü: hakkı olmayan her canlı üyeye bir hak (varsa olduğu gibi kalır).
      const lacking = stop.reward?.ilham ? state.party.filter((m) => !m.status.dead && !hasHeroic(m.status)) : [];
      return done(state, lacking.length
        ? [visited, { type: 'seruven_ilham', neden: 'odul', statuses: Object.fromEntries(lacking.map((m) => [m.id, withHeroic(m.status)])) }]
        : [visited]);
    }
    case 'yerlesim_enter': case 'yerlesim_leave': case 'yerlesim_map': case 'shop_buy': case 'shop_sell': case 'inn_rest': case 'quest_take': case 'quest_claim':
      return yerlesimCommand(state, page, cmd);
    case 'suc_basla': case 'suc_sonuc': case 'teslim_ol': case 'hapse_at': case 'hapis_kapi': case 'tasma_cikar':
      return hapisCommand(state, page, cmd);
    case 'level_up': {
      if (!toggleOn(state, 'seviyeAtlama')) return fail('Serüven seviye atlama kapalı.');
      // 2026-11-19: seviye sınırı her zaman 20 (eski "ustSeviye" anahtarı kalktı; eski kayıtta varsa yok sayılır).
      if (state.level >= LEVEL_CAP) return fail('Seviye sınırına ulaşıldı.');
      const need = levelXp(state.level);
      if (need === null || state.xp < need) return fail('XP eşiği aşılmadı.');
      // Görev MC5 (K12): çoklu sınıflı üye seviyeyi mevcut sınıflarından birinde alır (varsayılan ilk sınıfı); yeni (yan)
      // sınıf yalnız kutsal ayna yanında (`yanSinifAcik`; ayna henüz yok: kapalı).
      const pick: Record<string, string> = {};
      for (const [id, cls] of Object.entries(cmd.classOf ?? {})) {
        const m = state.party.find((x) => x.id === id);
        if (!m || !(m.sheet.classes?.length ?? 0)) continue;
        if (!m.sheet.classes!.some((e) => e.classId === cls) && !yanSinifAcik(state)) return fail('Yan sınıf yalnız kutsal ayna yanında alınır.');
        pick[id] = cls;
      }
      return done(state, [{ type: 'seruven_leveled', level: state.level + 1, ...(Object.keys(pick).length ? { classOf: pick } : {}) }]);
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
      const wake = rested ? wakeHoursOf(state, state.party.map((m) => statusOf(m, cmd.statuses)), key) : 0;
      if (rested) {
        statuses = Object.fromEntries(state.party.map((m) => [m.id, longRestStatus(m.sheet, statusOf(m, cmd.statuses), undefined, zeroHpRest(state))]));
      }
      const evs: SeruvenEvent[] = [{
        type: 'seruven_result', key, outcome: cmd.outcome, statuses, xp: cmd.xp,
        gold: cmd.outcome === 'won' ? stop?.reward?.gold ?? 0 : 0, potions: cmd.outcome === 'won' ? (stop?.potions ?? 0) + (stop?.reward?.potions ?? 0) : 0,
        ...(cmd.flags?.length ? { flags: cmd.flags } : {}), ...(rested ? { rested: true } : {}), ...(wake ? { wakeHours: wake } : {}), ...(cmd.skipped ? { skipped: true } : {}),
        // Kuyruk K48 (Moral): savaşta düşen üyeler (bozgun dinlenmesinden önceki durum).
        ...(toggleOn(state, 'moralSistemi') ? ((d) => (d.length ? { downed: d } : {}))(state.party.filter((m) => { const st = cmd.statuses[m.id]; return !!st && (st.dead || st.hp <= 0) && !m.status.dead && m.status.hp > 0; }).map((m) => m.id)) : {}),
      }];
      const able = state.party.some((m) => { const st = statusOf(m, statuses); return !st.dead && st.hp > 0; });
      if (!able && !kural) evs.push({ type: 'seruven_finished', result: 'lost' });
      const bulgu = state.hapis && page.id === HAPIS.sayfa ? bulguEvent(applySeruvenEvents(state, evs) ?? state, cmd.hapisBulgu) : null;
      if (bulgu) evs.push(bulgu);
      return done(state, evs);
    }
    case 'moral_dirilt': return moralRevive(state, cmd);
    case 'ilham_ver': {
      const r = grantHeroic(state.party, cmd.memberId, cmd.passTo);
      if (!r.ok) return fail(r.error);
      const o = r.outcome;
      return done(state, [{ type: 'seruven_ilham', neden: 'gm', statuses: r.statuses,
        ...(o.kind === 'aktarildi' ? { from: o.from } : o.kind === 'kayboldu' ? { lost: o.from } : {}) }]);
    }
    case 'form_swap': return formSwap(state, cmd);
    case 'set_choices': return setChoices(state, cmd);
    case 'world_walk': case 'fast_travel': case 'world_check': {
      const r = roamEvents(state, cmd, (k) => toggleOn(state, k), bestSkill, heavyArmorMember);
      return typeof r === 'string' ? fail(r) : done(state, r);
    }
    default: return yerlesimCommand(state, page, cmd);
  }
}

function done(state: SeruvenState | null, events0: SeruvenEvent[]): SeruvenResult {
  let events = events0;
  // Kuyruk K48: Moral (anahtar `moralSistemi`): komutun olaylarından sonra kayıp/kazanç ve Moral ölümü.
  if (state && toggleOn(state, 'moralSistemi') && !events.some((e) => e.type === 'seruven_moral')) {
    const mid = applySeruvenEvents(state, events);
    if (mid) {
      const d = moralDeltas(state, mid, events, toggleOn(state, 'moralTam'));
      const r = moralStatuses(mid, d);
      if (Object.keys(r.statuses).length) {
        events = [...events, { type: 'seruven_moral', statuses: r.statuses, reasons: d.reasons, deaths: r.deaths }];
        // Moral ölümüyle savaşabilen kalmadıysa Serüven yenilgiyle biter.
        const after = applySeruvenEvents(mid, events.slice(-1));
        if (after && !after.result && !after.party.some((m) => !m.status.dead && m.status.hp > 0)) events = [...events, { type: 'seruven_finished', result: 'lost' }];
      }
    }
  }
  const s = applySeruvenEvents(state, events);
  return s ? { ok: true, state: s, events } : fail('Durum yok.');
}

/** K46: olaydan sonra keşif sisi (`kesif`) güncellenir (replay aynı sisi verir; `src/world/seruvenFog.ts`). */
export function reduceSeruven(s: SeruvenState | null, e: SeruvenEvent): SeruvenState | null {
  let next = reduceBase(s, e);
  // K47: düğüm/sayfa değişince serbest konum düğüme döner.
  if (s && next && next.konum && e.type !== 'seruven_walked' && e.type !== 'seruven_traveled' && (next.page !== s.page || next.at !== s.at)) { next = { ...next }; delete next.konum; }
  if (e.type === 'seruven_started') return withFog(null, next);
  const path = e.type === 'seruven_walked' || e.type === 'seruven_traveled' ? { path: e.path, ship: e.type === 'seruven_traveled' } : undefined;
  return withFog(s, next, e.type === 'seruven_link_crossed', path);
}

function reduceBase(s: SeruvenState | null, e: SeruvenEvent): SeruvenState | null {
  if (e.type === 'seruven_started') return e.state;
  if (!s) return s;
  switch (e.type) {
    case 'seruven_moved': return { ...s, at: e.to };
    case 'seruven_page': return { ...s, page: e.page, at: e.at ?? 'giris', ...(e.resetNight ? { night: [] } : {}) };
    case 'seruven_night': return { ...s, night: e.on ? [...new Set([...s.night, e.key])] : s.night.filter((k) => k !== e.key) };
    case 'seruven_toggle': return { ...s, toggles: { ...s.toggles, [e.key]: e.on } };
    case 'seruven_result': return {
      ...s, ...(e.outcome === 'lost' && e.rested ? { rests: (s.rests ?? 0) + 1 } : {}), ...(e.wakeHours && s.saat !== undefined ? { saat: s.saat + e.wakeHours } : {}), done: e.outcome === 'won' && !s.done.includes(e.key) ? [...s.done, e.key] : s.done,
      party: s.party.map((m) => ({ ...m, status: e.statuses[m.id] ?? m.status })),
      xp: s.xp + e.xp, gold: s.gold + e.gold, potions: s.potions + e.potions,
      flags: [...new Set([...s.flags, ...(e.flags ?? [])])],
      ...(e.skipped ? { skipped: [...new Set([...(s.skipped ?? []), e.key])] } : {}),
    };
    case 'seruven_visited': return { ...s, done: [...s.done, e.key], gold: s.gold + e.gold, potions: s.potions + e.potions, items: [...s.items, ...e.items] };
    case 'seruven_finished': return { ...s, result: e.result };
    case 'seruven_rested': return { ...s, done: [...s.done, e.key], rests: (s.rests ?? 0) + 1, ...(e.wakeHours && s.saat !== undefined ? { saat: s.saat + e.wakeHours } : {}), party: s.party.map((m) => ({ ...m, status: e.statuses[m.id] ?? m.status })) };
    case 'seruven_ilham': return { ...s, party: s.party.map((m) => ({ ...m, status: e.statuses[m.id] ?? m.status })) };
    case 'seruven_moral': return { ...s, party: s.party.map((m) => ({ ...m, status: e.statuses[m.id] ?? m.status })) };
    case 'seruven_dirildi': return { ...s, gold: s.gold - e.gold, party: s.party.map((m) => ({ ...m, status: e.statuses[m.id] ?? m.status })) };
    case 'seruven_forms': return { ...s, party: s.party.map((m) => (m.id === e.memberId ? { ...m, sheet: { ...m.sheet, wildShapeForms: [...e.forms] } } : m)),
      ...(e.swap ? { formSwaps: { ...(s.formSwaps ?? {}), [e.memberId]: s.rests ?? 0 } } : {}) };
    case 'seruven_choices': {
      const cur = memberChoiceUse(s, e.memberId);
      const sum = addUse(cur, e.use);
      return { ...s, party: s.party.map((m) => (m.id === e.memberId ? { ...m, sheet: { ...m.sheet, ...e.patch } } : m)),
        choiceUse: { ...(s.choiceUse ?? {}), [e.memberId]: {
          ...(sum.seviye ? { seviye: [s.level, sum.seviye] as [number, Record<string, number>] } : {}),
          ...(sum.dinlenme ? { dinlenme: [s.rests ?? 0, sum.dinlenme] as [number, Record<string, number>] } : {}) } } };
    }
    case 'seruven_leveled': return { ...s, level: e.level, levelGained: e.level, party: s.party.map((m) => (m.sheet.level < e.level ? { ...m, sheet: leveledSheet(m.sheet, e.level, e.classOf?.[m.id]) } : m)) };
    case 'seruven_link_checked': return e.success ? { ...s, links: [...new Set([...(s.links ?? []), e.link])] } : { ...s, linkTry: { ...(s.linkTry ?? {}), [e.link]: s.rests ?? 0 } };
    case 'seruven_yerlesim': return {
      ...s, yerlesim: e.yerlesim, ...(e.statuses ? { party: s.party.map((m) => ({ ...m, status: e.statuses?.[m.id] ?? m.status })) } : {}),
    };
    case 'seruven_shop': return {
      ...s, gold: s.gold + e.gold, potions: s.potions + e.potions,
      items: e.remove ? (() => { const i = s.items.indexOf(e.remove as string); return i < 0 ? s.items : [...s.items.slice(0, i), ...s.items.slice(i + 1)]; })() : e.add ? [...s.items, e.add] : s.items,
    };
    case 'seruven_inn': return { ...s, gold: s.gold + e.gold, rests: (s.rests ?? 0) + 1, ...(e.wakeHours && s.saat !== undefined ? { saat: s.saat + e.wakeHours } : {}), party: s.party.map((m) => ({ ...m, status: e.statuses[m.id] ?? m.status })) };
    case 'seruven_quest': return { ...s, gold: s.gold + e.gold, quests: { ...(s.quests ?? {}), [e.quest]: e.state } };
    case 'seruven_hapis': return {
      ...s, ...e.patch, ...(e.statuses ? { party: s.party.map((m) => ({ ...m, status: e.statuses?.[m.id] ?? m.status })) } : {}),
    };
    case 'seruven_walked': case 'seruven_traveled': case 'seruven_world_check': return reduceRoam(s, e);
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
/** Düğüm görünür mü: bayraklı alt düğüm bayrak alınınca (2026-11-19: Kuyruk 41b `ustSeviyeGizli` "Üst seviye" anahtarıyla kalktı). */
export const nodeVisible = (s: Pick<SeruvenState, 'flags' | 'toggles'>, node: SeruvenNode): boolean =>
  (!node.bayrak || s.flags.includes(node.bayrak));

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

/** K49 D: ağır zırh giyen yaşayan üye (yüzme kuralı); yoksa null. */
export function heavyArmorMember(s: SeruvenState): string | null {
  for (const m of s.party) {
    if (m.status.dead || m.status.hp <= 0) continue;
    if (armor.find((a) => a.name === m.sheet.armorName)?.type === 'heavy') return m.name;
  }
  return null;
}

/** Partide becerilerden en yüksek bonusu olan üye (K47: dünya kontrolleri ve pasif Algı da kullanır). */
export function bestSkill(s: SeruvenState, skills: readonly string[]): { bonus: number; name: string } {
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
      const wake = wakeHoursOf(state, state.party.map((m) => m.status), 'han');
      return done(state, [{ type: 'seruven_inn', gold: -YERLESIM.hanUcreti, statuses: Object.fromEntries(state.party.map((m) => [m.id, longRestStatus(m.sheet, m.status, undefined, zeroHpRest(state))])), ...(wake ? { wakeHours: wake } : {}) }]);
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

/**
 * Kuyruk K48: ölü üyeyi diriltme (Moral açıkken). Tapınak: yerleşimde tapınak ve `dirilme.tapinakUcreti` altın. Büyü:
 * partide diriltme büyüsünü bilen, slotu olan canlı üye ve maddi bileşenin altını (SRD 5.2.1; slot harcanır). Dirilen
 * 1 HP ve `dirilme.moral` Moral ile döner.
 */
function moralRevive(state: SeruvenState, cmd: { memberId: string; yol: 'tapinak' | 'buyu' }): SeruvenResult {
  if (!toggleOn(state, 'moralSistemi')) return fail('Moral kapalı.');
  const m = state.party.find((x) => x.id === cmd.memberId);
  if (!m?.status.dead) return fail('Diriltilecek ölü üye yok.');
  if (cmd.yol === 'tapinak') {
    const y = state.yerlesim ? yerlesimById(state.yerlesim.id) : undefined;
    if (!y?.hub.tapinak) return fail('Burada tapınak yok.');
    const cost = MORAL.dirilme.tapinakUcreti;
    if (state.gold < cost) return fail('Altın yetmiyor.');
    return done(state, [{ type: 'seruven_dirildi', memberId: m.id, yol: 'tapinak', statuses: { [m.id]: revivedStatus(m.status) }, gold: cost }]);
  }
  const caster = reviveCaster(state.party);
  if (!caster) return fail('Partide diriltme büyüsü (ve slotu) olan yok.');
  if (state.gold < caster.gold) return fail('Altın yetmiyor (maddi bileşen).');
  const slots = [...caster.member.status.slots];
  slots[caster.level - 1] = Math.max(0, (slots[caster.level - 1] ?? 0) - 1);
  return done(state, [{ type: 'seruven_dirildi', memberId: m.id, yol: 'buyu', gold: caster.gold,
    statuses: { [m.id]: revivedStatus(m.status), [caster.member.id]: { ...caster.member.status, slots } } }]);
}

/** Kuyruk 36: düğüm haritasında kapı (0 tabanlı konum). */
export function nodeKapiAt(node: SeruvenNode, pos: { col: number; row: number }): { to: string | null } | undefined {
  return node.kapilar?.find((k) => k.hexes.some(([c, r]) => c - 1 === pos.col && r - 1 === pos.row));
}

/** Görev WS92: üyenin Wild Shape biçim sınırı ve uygun biçimleri (Druid değilse null). */
export function memberForms(m: Pick<JourneyMember, 'sheet'>): { known: number; options: string[]; current: string[] } | null {
  const f = classKit(m.sheet.classId, m.sheet.level, m.sheet.subclassId).usable.find((u) => u.effect.kind === 'wildShape');
  const lim = f ? shapeLimits(f, m.sheet.level) : null;
  if (!f || !lim) return null;
  const options = eligibleForms(monsters, f, m.sheet.level).map((x) => x.id);
  return { known: lim.known, options, current: (m.sheet.wildShapeForms ?? []).filter((id) => options.includes(id)) };
}

/** Görev WS92: biçim değişimi bu dinlenmede yapılabilir mi (ilk uzun dinlenmeden sonra, dinlenme başına bir kez). */
export const formSwapReady = (s: Pick<SeruvenState, 'rests' | 'formSwaps'>, memberId: string): boolean => (s.rests ?? 0) > (s.formSwaps?.[memberId] ?? 0);

function formSwap(state: SeruvenState, cmd: Extract<SeruvenCommand, { type: 'form_swap' }>): SeruvenResult {
  const m = state.party.find((x) => x.id === cmd.memberId);
  if (!m) return fail('Üye yok.');
  const lim = memberForms(m);
  if (!lim) return fail('Wild Shape yok.');
  if (!lim.options.includes(cmd.to)) return fail('Bu biçim bu seviyede alınamaz.');
  if (lim.current.includes(cmd.to)) return fail('Bu biçim zaten biliniyor.');
  if (cmd.from === null) {
    if (lim.current.length >= lim.known) return fail(`Biçim listesi dolu (${lim.known}).`);
    return done(state, [{ type: 'seruven_forms', memberId: m.id, forms: [...lim.current, cmd.to], swap: false }]);
  }
  if (!lim.current.includes(cmd.from)) return fail('Değiştirilecek biçim bilinmiyor.');
  if (!formSwapReady(state, m.id)) return fail('Biçim değişimi uzun dinlenmeden sonra bir kez.');
  return done(state, [{ type: 'seruven_forms', memberId: m.id, forms: lim.current.map((x) => (x === cmd.from ? cmd.to : x)), swap: true }]);
}

/** Görev B93 (A2): hangi seçim pencereleri açık (seviye: bu seviyeye Serüven'de çıkıldı; dinlenme: en az bir uzun dinlenme). */
export const choiceWindows = (s: Pick<SeruvenState, 'level' | 'levelGained' | 'rests'>): Record<ChoiceWindow, boolean> =>
  ({ seviye: s.levelGained !== undefined && s.levelGained === s.level, dinlenme: (s.rests ?? 0) > 0 });

/** Görev B93 (A2): üyenin şimdiki pencerelerdeki kullanımı (eski pencerenin kaydı sayılmaz). */
export function memberChoiceUse(s: Pick<SeruvenState, 'level' | 'rests' | 'choiceUse'>, memberId: string): ChoiceUse {
  const u = s.choiceUse?.[memberId];
  return {
    ...(u?.seviye && u.seviye[0] === s.level ? { seviye: u.seviye[1] } : {}),
    ...(u?.dinlenme && u.dinlenme[0] === (s.rests ?? 0) ? { dinlenme: u.dinlenme[1] } : {}),
  };
}

/** Görev B93 (A2): seçimlerin sorunları (oluşturucu kuralları; yalnız sayfaya bakan kurallar). */
export function choiceIssues(sheet: CharacterSheet): string[] {
  return characterIssues({ ...blankCharacter('seruven'), sheet }).map((x) => x.text);
}

/**
 * Görev B93 (A2): seviye atlama / uzun dinlenme seçimleri. Yalnız seçim alanları yazılır; çıkarılan/değişen seçimler
 * sınıfın verisindeki pencereye ve sayıya sığmalı (`data/secim-degisim.json`); yeni sorun (liste, sayı, kitap, ön koşul) çıkmamalı.
 */
function setChoices(state: SeruvenState, cmd: Extract<SeruvenCommand, { type: 'set_choices' }>): SeruvenResult {
  const m = state.party.find((x) => x.id === cmd.memberId);
  if (!m) return fail('Üye yok.');
  if (!choicesBound(m.sheet.classId)) return fail('Bu sınıfın seçim değişimi henüz bağlı değil.');
  const patch = pickChoiceFields(cmd.sheet);
  const next: CharacterSheet = { ...m.sheet, ...patch };
  // Başka sınıfa ait seçim (oluşturucu sessizce yok sayar; burada kayda girmesin).
  const scoped = classScoped(next);
  if (Object.keys(patch).some((k) => JSON.stringify(scoped[k as keyof CharacterSheet]) !== JSON.stringify(next[k as keyof CharacterSheet]))) return fail('Bu sınıfın seçimi değil.');
  const fit = fitChanges(m.sheet.classId, changeCounts(m.sheet, next), choiceWindows(state), memberChoiceUse(state, m.id));
  if (!fit.ok) return fail(`Bu seçim şimdi değiştirilemez: ${fit.key}.`);
  const before = new Set(choiceIssues(m.sheet));
  const fresh = choiceIssues(next).filter((x) => !before.has(x));
  if (fresh.length) return fail(fresh[0]!);
  return done(state, [{ type: 'seruven_choices', memberId: m.id, patch, use: fit.use }]);
}

/**
 * Görev MC5 (K12, MULTICLASS-PLAN.md): Serüven'de yan sınıf (yeni sınıf) yalnız kutsal ayna yanında açılır. Ayna sahnesi
 * henüz yok (`harita/belgeler/SERUVEN-AYRIM.md`): koşulun girişi burada, şimdilik hep kapalı.
 */
export function yanSinifAcik(_state: SeruvenState): boolean {
  return false;
}

/**
 * Görev MC5: seviye atlayan üyenin sayfası. Tek sınıfta seviye değişir (eski davranış); çoklu sınıfta artış seçilen sınıfa
 * (yoksa ilk sınıfa) eklenir, toplam seviye `level` (değişmezler: `classId`/`subclassId` ilk sınıftan).
 */
function leveledSheet(sheet: JourneyMember['sheet'], level: number, classId: string | undefined): JourneyMember['sheet'] {
  const list = sheet.classes;
  if (!list || list.length < 2) return { ...sheet, level };
  const diff = level - sheet.level;
  const target = classId ?? list[0]!.classId;
  const known = list.some((x) => x.classId === target);
  const next = known ? list.map((x) => (x.classId === target ? { ...x, level: x.level + diff } : x)) : [...list, { classId: target as string, level: diff }];
  return { ...sheet, classes: next, level: next.reduce((n, x) => n + x.level, 0) };
}
