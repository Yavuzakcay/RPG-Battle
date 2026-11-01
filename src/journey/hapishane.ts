/**
 * Kuyruk 36: Hapishane Adası verisi ve saf yardımcılar (`data/hapishane.json`; Serüven parçasıyla tembel). Durum
 * Serüven katmanında (`SeruvenState.hapis`, `tasma`, `suc`); komutlar `journey/seruven.ts`, savaş oturumu dönüşümleri
 * `app/seruvenBattle.ts`. Tasarım: docs/yolculuk/HAPISHANE.md.
 */
import data from '../../data/hapishane.json';
import { longRestStatus, type CharacterStatus } from '../rules/characterRest';
import type { CharacterSheet } from '../rules/stats';

export interface Suc { id: string; tr: string; en: string; aciklama: { tr: string; en: string }; scenario: string }
export interface HapisData {
  sayfa: string; baslangic: string; hub: string;
  donus: { page: string; at: string; flag: string };
  basarisizlik: { page: string; at: string; yerlesim: string; flag: string };
  suclar: Suc[]; baskin: string; sucOdulu: number;
  mahkum: { id: string; monster: string; hp: number; tr: string; en: string; hucre: [number, number] };
  hucreArkadasi: { id: string; monster: string; tr: string; en: string; dugumler: string[]; yer: [number, number] };
  takviye: { monster: string; alarmBasina: number; enCok: number };
  kolay: { eksik: number }; cezaSiniri: number; tasmaUcreti: number; kostum: { sinif: string };
}
export const HAPIS = data as unknown as HapisData;
export const sucById = (id: string): Suc | undefined => HAPIS.suclar.find((s) => s.id === id);

/** Adadaki durum: emanet (altın, iksir, eşya), iade edildi mi, gelinen düğüm, alarm düzeyi, kısa ceza sayısı, kurallar açık mı. */
export interface HapisDurum {
  suc: string;
  emanet: { gold: number; potions: number; items: string[] };
  iade?: boolean;
  from?: string | null;
  alarm: number;
  ceza: number;
  kurallar: boolean;
}

/** Nöbetçiler bayıltır: ölü sayılan karakter 0 HP'de yaşar (adada ve yakalanırken). */
export function nonlethal(st: CharacterStatus): CharacterStatus {
  if (!st.dead) return st;
  const { dead: _d, ...rest } = st;
  return { ...rest, hp: Math.max(0, rest.hp) };
}
/** Kısa ceza: hücreye geri, bayılanlar 1 HP ile uyanır. */
export const wakeUp = (st: CharacterStatus): CharacterStatus => ({ ...nonlethal(st), hp: Math.max(1, st.hp) });
/** Başarısızlık: şehre sürüklenip uyanırlar (uzun dinlenme; ölüm yok). */
export const dragBack = (sheet: CharacterSheet, st: CharacterStatus): CharacterStatus => longRestStatus(sheet, nonlethal(st));

/**
 * Emanet: adadaki savaşlarda ekipman yok (zırh, kalkan, silahlar, yan el, eşyalar). Büyüler sayfada kalır; tasma
 * oturumda savaşçının büyülerini kaldırır (`app/seruvenBattle.ts`).
 */
export function confiscated(sheet: CharacterSheet): CharacterSheet {
  const { offHand: _o, pactWeapon: _p, ...rest } = sheet;
  return { ...rest, armorName: 'Zırhsız', shield: false, weapons: [], itemNames: [], weaponMasteries: [] };
}
