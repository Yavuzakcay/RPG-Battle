/**
 * Dil seçimi (TR/EN): Türkçe metinler `strings.ts`'te (ana parçada), İngilizce `strings.en.ts`'te (F1: ayrı parça,
 * gerekince yüklenir). Seçim tarayıcı belleğinde hatırlanır; bellek yoksa Türkçe. Arayüz metni `t()` ile okur; dil
 * değişince `useLang` kullanan kök yeniden çizer. Kayıtlı dil EN ise `main.tsx` ilk çizimden önce `ensureLang()` bekler.
 */
import { useSyncExternalStore } from 'react';
import { STRINGS_TR, addTrExtra, type Lang, type Strings } from './strings';
import { setIssueTexts } from '../rules/issueText';

export type { Lang, Strings };
export const LANGS: readonly Lang[] = ['tr', 'en'];
const KEY = 'rpg-battle-lang';

function load(): Lang {
  try {
    return localStorage.getItem(KEY) === 'en' ? 'en' : 'tr';
  } catch {
    return 'tr';
  }
}

let current: Lang = load();
const listeners = new Set<() => void>();
/** Yüklenmiş metin tabloları (TR her zaman). */
const tables: Partial<Record<Lang, Strings>> = { tr: STRINGS_TR };

export const getLang = (): Lang => current;

/** Kuyruk 34a M0: Türkçe savaş metinleri (tembel parça) bir kez yüklenip TR tablosuna eklenir. */
let trExtra: Promise<void> | null = null;
export function loadTrExtra(): Promise<void> {
  trExtra ??= import('./strings.tr2').then((m) => addTrExtra(m.TR_EXTRA));
  return trExtra;
}

/** Dilin metinlerini yükler (EN ayrı parça); yüklüyse hemen döner. TR'nin tembel bölümü her zaman yüklenir. */
export async function loadLang(lang: Lang): Promise<void> {
  await loadTrExtra();
  if (tables[lang]) return;
  if (lang === 'en') tables.en = (await import('./strings.en')).en;
}

/** Testler ve önyükleme için: tabloyu doğrudan kaydeder. */
export function registerLang(lang: Lang, table: Strings): void {
  tables[lang] = table;
}

/** Kayıtlı dilin metinleri hazır olsun (ilk çizimden önce). Yüklenemezse Türkçe. */
export async function ensureLang(): Promise<void> {
  await loadTrExtra();
  try { await loadLang(current); } catch { current = 'tr'; }
}

function apply(lang: Lang): void {
  current = lang;
  try { localStorage.setItem(KEY, lang); } catch { /* yalnızca bu oturumda */ }
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
  for (const f of listeners) f();
}

/** Dili değiştirir; tablo yüklü değilse önce yüklenir (yüklenene dek eski dil kalır). */
export function setLang(lang: Lang): void {
  if (lang === current) return;
  if (tables[lang]) { apply(lang); return; }
  void loadLang(lang).then(() => apply(lang), () => { /* yüklenemedi: dil değişmez */ });
}

/** Geçerli dilin metinleri (yüklenmemişse Türkçe). */
export const t = (): Strings => tables[current] ?? STRINGS_TR;
// Görev SD4: kural modüllerinin oluşturucu sorun metinleri arayüz diliyle (saf modüller i18n'i içe aktarmaz).
setIssueTexts(() => t().issues);

/** Kök bileşen için: dil değişince yeniden çizilir. */
export function useLang(): Lang {
  return useSyncExternalStore((f) => { listeners.add(f); return () => listeners.delete(f); }, getLang, getLang);
}
