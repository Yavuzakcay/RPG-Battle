/**
 * Kuyruk K48 Adım B: Moral (ev kuralı; `data/moral.json`). Karakter başına ikinci can havuzu: en çok = taban + yetenek
 * değiştiricisi (WIS) + yeterlilik bonusu (en az `enAz`). Karakter durumunda `moral` (yoksa dolu: sistem hiç
 * kullanılmamış eski kayıt). Saf: yalnızca veri ve aritmetik (savaş ve Serüven katmanları buradan okur).
 */
import data from '../../data/moral.json';
import type { Ability } from './abilities';

export const MORAL = data;
export const MORAL_VERSION = data.surum;

/** Havuzun en çoğu (yetenek değiştiricisi ve yeterlilik bonusundan). */
export function moralMaxFrom(mods: Partial<Record<Ability, number>>, proficiency: number): number {
  const h = MORAL.havuz;
  return Math.max(h.enAz, h.taban + (mods[h.yetenek as Ability] ?? 0) + (h.yeterlilik ? proficiency : 0));
}

/** Geçerli Moral (kayıtta yoksa en çok), 0..en çok. */
export const moralNow = (moral: number | undefined, max: number): number => Math.max(0, Math.min(max, moral ?? max));

/** Eşikler: yarı ve altı (WIS/CHA cezası), üçte bir ve altı (korku/büyülenme save dezavantajı). */
export const moralHalf = (moral: number, max: number): boolean => moral <= max * MORAL.etkiler.yariOran;
export const moralThird = (moral: number, max: number): boolean => moral <= max * MORAL.etkiler.ucteBirOran;

/** Dinlenme kazancı: `hepsi` = en çoğa, `yarisi` = en çoğun yarısı (yukarı), sayı = o kadar. */
export function moralRestGain(kind: 'han' | 'kamp', max: number): number {
  const v = MORAL.seruven.kazanc[kind] as string | number;
  return v === 'hepsi' ? max : v === 'yarisi' ? Math.ceil(max / 2) : Number(v) || 0;
}

/** Moral ölümünün anlatımı (nötr; yöntem ya da sahne betimi yok). */
export const moralDeathText = (name: string, lang: 'tr' | 'en'): string => MORAL.metin.olum[lang].replace('{ad}', name);

