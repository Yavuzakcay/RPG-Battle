/**
 * Görev KALAN100 (kural sürümü 100): genel savaş denetiminden ertelenen kalanlar (SRD 5.2.1; harita/belgeler/GENEL-SAVAS-DENETIM.md
 * "Düzeltme durumu", DECISIONS.md "KALAN100"). Tek sabit; yaprak modül.
 * - Sürükleme (B20): Tiny ya da sürükleyenden iki+ boy küçük yakalanan ek hareket istemez (s. 182 Grappled "Movable").
 * - Charmed (B9): süreli durum sayacından gelen Charmed (saldırı eki) de büyüleyene saldırıyı engeller (s. 178).
 * - Grapple (C17): boş el gerekir (kalkan ve tutulan her yakalama bir el; s. 182 "One Grapple per Hand", s. 190).
 * - Nesne etkileşimi (A32): kapı aç/kapa, al, bırak ve yerden alma turda tek serbest etkileşimi paylaşır; ikincisi Utilize (s. 13).
 * - High Jump (E13/F15): büyüsüz yerinde zıplama 3 + STR (koşarak; 10 ft yürüdükten sonra), durarak yarısı (s. 183).
 * - Yapay zekâ Dash'i (A45): yaklaşırken bütün hareketini harcamış, eylemi boş ve düşmana yetişemeyen yaratık Dash yapar.
 * 99 ve altı (eski kayıt, replay) aynen.
 */
import type { BattleState } from './types';

export const KALAN100_VERSION = 100;
export const kalan100On = (s: Pick<BattleState, 'kuralSurumu'> | undefined): boolean => (s?.kuralSurumu ?? 1) >= KALAN100_VERSION;
