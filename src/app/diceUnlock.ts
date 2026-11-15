/**
 * SD9: zar sahipliği. Her zaman açık: Klasik, sınıf zarları, ırk zarları. Ödülle açılanlar (düşman, harita, malzeme, eşya zarları)
 * oyuncu profili başına, karakterler arası ortak; karakter başına seçim: Sınıf (varsayılan) / Irk / Klasik / açılmış temalar.
 * Kayıt Keşif Defteri modeliyle (`discovery.ts`) ayrı anahtarda (`rpg-battle-zar-acilanlar`); savaşa, kayda ve replay'e girmez.
 * Açılma kuralları `data/zar-esleme.json`'dan; olayları DİNLER (savaş sonu durumu/olayları, Serüven olayları): komut, reducer
 * ve olay biçimi değişmez. Saf çekirdek + ince depo katmanı.
 */
import esleme from '../../data/zar-esleme.json';
import gorseller from '../../data/zar-gorselleri.json';
import types from '../../data/canavar-turleri.json';
import type { BattleEvent, BattleState, Combatant } from '../battle/types';
import type { SeruvenEvent } from '../journey/seruven';
import { DEFAULT_PROFILE, loadStore as loadDiscovery } from './discovery';

export interface DiceProfile { acilan: Record<string, number>; secim: Record<string, string>; yeni: string[] }
export interface DiceStore { profiller: Record<string, DiceProfile>; hepsiAcik: boolean }
type Cat = 'malzeme' | 'sinif' | 'irk' | 'harita' | 'dusman' | 'esya';
interface Rule { tema: string; id?: string[]; tur?: string[] }
const E = esleme as unknown as {
  varsayilan: string; siniflar: Record<string, string>; irklar: Record<string, string>; dusmanlar: Rule[];
  bolgeler: Record<string, string>; seruvenSayfalar: Record<string, string>; yerlesimler: Record<string, string>;
  oduller: Record<string, string>; hazineSirasi: string[]; esyalar: Record<string, string>; buyuler: Record<string, string>;
  ipuclari: Record<string, { tr: string; en: string }>; ipucuOzel: Record<string, { tr: string; en: string }>;
};
const THEMES = (gorseller.themes as unknown as Array<{ id: string; kategori?: Cat; name: { tr: string; en: string } }>);
export const DEFAULT_CHOICE = 'sinif';
/** Karakter seçimi: sözde değerler `sinif`/`irk`; öbürleri tema kimliği. `*`: karakterin kendi seçimi yokken geçerli varsayılan. */
export const ALL_CHARACTERS = '*';
const KEY = 'rpg-battle-zar-acilanlar';
const EVENT = 'rpg-dice-unlock';

export const categoryOf = (id: string): Cat => THEMES.find((x) => x.id === id)?.kategori ?? 'malzeme';
/** Her zaman açık: Klasik + sınıf + ırk zarları. */
export const alwaysOpen = (id: string): boolean => id === E.varsayilan || categoryOf(id) === 'sinif' || categoryOf(id) === 'irk';

export const emptyStore = (): DiceStore => ({ profiller: {}, hepsiAcik: false });
const prof = (s: DiceStore, name: string): DiceProfile => s.profiller[name] ?? { acilan: {}, secim: {}, yeni: [] };
export const activeProfile = (): string => { try { return loadDiscovery().profil; } catch { return DEFAULT_PROFILE; } };

export function normalize(raw: unknown): DiceStore {
  const out = emptyStore();
  if (!raw || typeof raw !== 'object') return out;
  const r = raw as Partial<DiceStore>;
  out.hepsiAcik = r.hepsiAcik === true;
  const ids = new Set(THEMES.map((x) => x.id));
  for (const [name, p0] of Object.entries(r.profiller ?? {})) {
    const p = p0 as Partial<DiceProfile>;
    const acilan: Record<string, number> = {};
    for (const [id, n] of Object.entries(p?.acilan ?? {})) if (ids.has(id) && typeof n === 'number' && n > 0) acilan[id] = Math.floor(n);
    const secim: Record<string, string> = {};
    for (const [c, v] of Object.entries(p?.secim ?? {})) if (typeof v === 'string') secim[c] = v;
    out.profiller[name] = { acilan, secim, yeni: (p?.yeni ?? []).filter((id) => ids.has(id)) };
  }
  return out;
}
export function loadDiceStore(): DiceStore { try { return normalize(JSON.parse(localStorage.getItem(KEY) ?? 'null')); } catch { return emptyStore(); } }
export function saveDiceStore(s: DiceStore): void { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* bu oturumda */ } }

/** Tema oyuncu için açık mı (GM/test anahtarı hepsini açar). */
export const isUnlocked = (s: DiceStore, id: string, profil = activeProfile()): boolean =>
  s.hepsiAcik || alwaysOpen(id) || (prof(s, profil).acilan[id] ?? 0) > 0;

/** Temaları aç (idempotent): yeni açılanlar `fresh` ve bildirim kuyruğu `yeni`; zaten açık olan sayılmaz. */
export function unlock(s: DiceStore, ids: string[], profil = activeProfile()): { store: DiceStore; fresh: string[] } {
  const p = prof(s, profil);
  const fresh: string[] = [];
  const acilan = { ...p.acilan };
  for (const id of ids) {
    if (!THEMES.some((x) => x.id === id) || alwaysOpen(id) || (acilan[id] ?? 0) > 0 || fresh.includes(id)) continue;
    acilan[id] = 1; fresh.push(id);
  }
  if (fresh.length === 0) return { store: s, fresh };
  return { store: { ...s, profiller: { ...s.profiller, [profil]: { ...p, acilan, yeni: [...p.yeni, ...fresh] } } }, fresh };
}

/** Yeni zar bildirimi (kaydı bırakır); bildirim kuyruğu profilde. */
export const pendingNotices = (s: DiceStore, profil = activeProfile()): string[] => prof(s, profil).yeni;
export function clearNotices(s: DiceStore, profil = activeProfile()): DiceStore {
  const p = prof(s, profil);
  return p.yeni.length ? { ...s, profiller: { ...s.profiller, [profil]: { ...p, yeni: [] } } } : s;
}

/** Karakterin seçimi (yoksa `*` varsayılanı, o da yoksa Sınıf). Kilitli tema seçilemez: açık değilse Sınıf. */
export function choiceOf(s: DiceStore, charId: string | undefined, profil = activeProfile()): string {
  const p = prof(s, profil);
  const v = (charId ? p.secim[charId] : undefined) ?? p.secim[ALL_CHARACTERS] ?? DEFAULT_CHOICE;
  return v === 'sinif' || v === 'irk' || isUnlocked(s, v, profil) ? v : DEFAULT_CHOICE;
}
/** Seçimi kaydet; kilitli tema seçilemez (store aynen döner). */
export function setChoice(s: DiceStore, charId: string, value: string, profil = activeProfile()): DiceStore {
  if (value !== 'sinif' && value !== 'irk' && (!THEMES.some((x) => x.id === value) || !isUnlocked(s, value, profil))) return s;
  const p = prof(s, profil);
  return { ...s, profiller: { ...s.profiller, [profil]: { ...p, secim: { ...p.secim, [charId]: value } } } };
}

// ------------------------------------------------------------------ kilit ipucu

const fill = (t: string, name: string) => t.replace('{ad}', name);
/** Kilitli temanın tek satırlık açılma ipucu (veriden, TR/EN); sınıf/ırk/klasik için boş. */
export function unlockHint(id: string, lang: 'tr' | 'en'): string {
  if (alwaysOpen(id)) return '';
  const o = E.ipucuOzel[id]; if (o) return o[lang];
  const th = THEMES.find((x) => x.id === id);
  const h = E.ipuclari[categoryOf(id)];
  return h && th ? fill(h[lang], th.name[lang]) : '';
}

// ------------------------------------------------------------------ eşleme (zar teması çözümleme)

const typeOf = (monsterId: string): string | undefined => (types as { types: Record<string, string> }).types[monsterId];
/** Canavar → düşman zarı teması (kural sırası; eşleşme yoksa null). */
export function monsterTheme(monsterId: string | undefined): string | null {
  if (!monsterId) return null;
  const ty = typeOf(monsterId);
  for (const r of E.dusmanlar) if (r.id?.includes(monsterId) || (ty !== undefined && r.tur?.includes(ty))) return r.tema;
  return null;
}
export const classTheme = (classId: string | undefined): string | null => (classId ? E.siniflar[classId] ?? null : null);
export const raceTheme = (raceId: string | undefined): string | null => (raceId ? E.irklar[raceId] ?? null : null);
export const regionTheme = (bolge: string | undefined): string | null => (bolge ? E.bolgeler[bolge] ?? null : null);

/** Oyuncu savaşçısının sınıfı (jeton görsel adından: `characters/<ırk>-<cinsiyet>-<sınıf>` ya da `avatars/<ırk>-<sınıf>-<cinsiyet>`). */
export function classOfCombatant(c: Pick<Combatant, 'avatar'>): string | undefined {
  const src = c.avatar?.src ?? '';
  const a = /(?:^|\/)[a-z]+-(?:male|female|erkek|kadin)-([a-z]+)\.[a-z]+$/.exec(src);
  if (a) return a[1];
  const b = /(?:^|\/)[a-z]+-([a-z]+)-(?:male|female|erkek|kadin)\.[a-z]+$/.exec(src);
  return b?.[1];
}

export interface RollThemeCtx { state: Pick<BattleState, 'combatants' | 'map'>; store: DiceStore; regionOf?: (mapId: string) => string | undefined }
/**
 * Atışın zar teması: düşman/boss atışı canavar teması (açılma şartı yok, herkese görünür); oyuncu atışı karakterin seçimi
 * (Sınıf/Irk/Klasik/açık tema); atıcısız ya da eşleşmesiz atış (harita) bölge zarı, o da yoksa Klasik.
 */
export function themeForRoll(by: string | undefined, ctx: RollThemeCtx): string {
  const c = by ? ctx.state.combatants[by] : undefined;
  const region = (() => { const m = ctx.state.map?.id; const b = m && ctx.regionOf ? ctx.regionOf(m) : undefined; return regionTheme(b); })();
  if (!c) return region ?? E.varsayilan;
  if (c.side === 'enemies' && !c.civilian) return monsterTheme(c.monsterId) ?? region ?? E.varsayilan;
  const owner = c.summon ? ctx.state.combatants[c.summon.by] ?? c : c;
  const pick = choiceOf(ctx.store, owner.ownerId ?? undefined);
  if (pick === 'irk') return raceTheme(owner.raceId) ?? E.varsayilan;
  if (pick === 'sinif') return classTheme(classOfCombatant(owner)) ?? raceTheme(owner.raceId) ?? E.varsayilan;
  return pick;
}

// ------------------------------------------------------------------ açılma kancaları (olayı dinler)

/**
 * Savaş sonu: kazanılırsa yenilen düşmanların zarları ve savaş haritasının bölge zarı; kazanma şartı olmadan parti atışlarından
 * kullanılan eşya/büyü zarları. `state` son durum, `events` savaşın bütün olayları. Saf.
 */
export function unlocksFromBattle(state: BattleState, events: BattleEvent[], regionOf?: (mapId: string) => string | undefined): string[] {
  const out: string[] = [];
  const won = state.winner === 'party' || events.some((e) => e.type === 'battle_finished' && e.winner === 'party');
  if (state.status === 'finished' && won) {
    for (const c of Object.values(state.combatants)) {
      if (c.side !== 'enemies' || c.civilian || c.summon || c.hp > 0) continue;
      const t = monsterTheme(c.monsterId); if (t) out.push(t);
    }
    const mid = state.map?.id; const rt = mid && regionOf ? regionTheme(regionOf(mid)) : null; if (rt) out.push(rt);
  }
  const party = (id: string) => state.combatants[id]?.side === 'party';
  for (const e of events) {
    if (e.type === 'item_used' && party(e.actorId)) { for (const [k, t] of Object.entries(E.esyalar)) if (e.itemId.includes(k)) out.push(t); }
    if (e.type === 'spell_cast' && party(e.actorId)) { const t = E.buyuler[e.label]; if (t) out.push(t); }
  }
  return out;
}

/**
 * Serüven olayları: kazanılan düğüm → sayfa/bölge zarı; yerleşime giriş → yerleşim zarı; ödül/hazine ziyareti → malzeme zarı
 * (`oduller` tablosu; tabloda olmayan ödül ziyareti `hazineSirasi`ndaki sıradaki sahip olunmayan malzemeyi açar). `owned`: o an
 * sahip olunan (idempotent sıra için).
 */
export function unlocksFromSeruven(events: SeruvenEvent[], owned: (id: string) => boolean): string[] {
  const out: string[] = [];
  const have = (id: string) => owned(id) || out.includes(id);
  for (const e of events) {
    if (e.type === 'seruven_result' && e.outcome === 'won' && !e.skipped) { const t = E.seruvenSayfalar[e.key.split('/')[0] ?? '']; if (t) out.push(t); }
    if (e.type === 'seruven_yerlesim' && e.yerlesim) { const t = E.yerlesimler[e.yerlesim.id]; if (t) out.push(t); }
    if (e.type === 'seruven_visited' && (e.gold > 0 || e.potions > 0 || e.items.length > 0)) {
      const t = E.oduller[e.key] ?? E.hazineSirasi.find((m) => !have(m));
      if (t) out.push(t);
    }
  }
  return out;
}

/** Açılışları profile yazar (idempotent), yeni olanları döner ve ekrana bildirim olayı yayar. */
export function recordUnlocks(ids: string[]): string[] {
  if (ids.length === 0) return [];
  const { store, fresh } = unlock(loadDiceStore(), ids);
  if (fresh.length) { saveDiceStore(store); try { window.dispatchEvent(new CustomEvent(EVENT, { detail: fresh })); } catch { /* arayüz yok */ } }
  return fresh;
}
export const DICE_UNLOCK_EVENT = EVENT;
export const themeLabel = (id: string, lang: 'tr' | 'en'): string => THEMES.find((x) => x.id === id)?.name[lang] ?? id;
