/**
 * Görev AS2 (kural sürümü 78): 120 alt sınıf tek pakette, hepsi her zaman seçilebilir. Sürüm numarası yalnız burada (MB
 * kalıbı). 78+ savaşta imza alt sınıfları (`imza_<ad>`) ve Karadul Çemberi ev kuralına bakmadan çalışır (kapılar kalktı);
 * 77 ve altı (eski kayıt, replay) eskisi gibi ev kuralına (`houseRules`) ve kendi sürüm eşiklerine (21, 23) bakar. Yaprak.
 */
import type { BattleState } from './types';

export const AS2_VERSION = 78;
export const as2On = (s: Pick<BattleState, 'kuralSurumu'>): boolean => (s.kuralSurumu ?? 1) >= AS2_VERSION;
