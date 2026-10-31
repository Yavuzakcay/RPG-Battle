/**
 * Yolculuk (Görev Y0/Y1; docs/yolculuk/TASARIM.md): savaşları kalıcı parti durumu olan bir güzergâha bağlayan katman.
 * Savaş motoru değişmez; yolculuk kendi komut → olay → reducer döngüsünü tutar (savaştakiyle aynı kalıp, replay).
 */
import type { CharacterSheet } from '../rules/stats';
import type { CharacterStatus } from '../rules/characterRest';

export type Difficulty = 'kolay' | 'normal' | 'zor';
export type Progression = 'milestone' | 'xp';

export interface JourneyStop {
  id: string;
  kind: 'battle' | 'rest' | 'reward';
  name: { tr: string; en: string };
  /** Önceki duraktan buraya yürüyüş (saat). */
  travelHours: number;
  /** Savaş durağı: sim senaryosu (`data/sim-senaryolar.json`), partinin seviyesindeki düşman listesi. */
  scenario?: string;
  /** Kuyruk 15 K15B: bu durağa özel düşman listesi (canavar kimliği → sayı); yoksa senaryonun seviye listesi. */
  enemies?: Record<string, number>;
  /** Kazanılınca iksir ödülü. */
  potions?: number;
  /** Kilometre taşı: bu durakta (savaş kazanılınca ya da dinlenme yerine varınca) seviye atlanır. */
  levelUp?: boolean;
  /** Kuyruk 18 V2 (sefer): haritanın hedefi yerine bu (ham hedef verisi, 1 tabanlı altıgenler). */
  goals?: unknown;
  /** Kuyruk 18 V2 (sefer): parti başlangıç altıgenleri (1 tabanlı); yoksa haritanınki. */
  partyStart?: Array<[number, number]>;
  /** Kuyruk 18 V3: ödül durağı (savaşsız): altın, iksir, SRD sihirli eşyaları (`magic-items:<kimlik>`). */
  reward?: { gold: number; potions: number; items: string[] };
}

export interface JourneyRoute { id: string; name: { tr: string; en: string }; level: number; stops: JourneyStop[] }

export interface JourneyMember { id: string; name: string; sheet: CharacterSheet; status: CharacterStatus }

export interface JourneyState {
  id: string;
  route: JourneyRoute;
  seed: number;
  difficulty: Difficulty;
  progression: Progression;
  /** Bulunulan durak. */
  stop: number;
  /** Duraktaki iş bitti mi (savaş sonuçlandı; dinlenme yerinde hep true). */
  stopDone: boolean;
  /** Yolculuğun saati (başlangıç günü 0. saatten). */
  hour: number;
  /** Son uzun dinlenmenin bittiği saat (başlangıçta: yola çıkış). */
  lastLongRest: number;
  /** Son uzun dinlenmeden beri kısa dinlenme sayısı (ev kuralı sınırı). */
  shortRests: number;
  gold: number;
  potions: number;
  xp: number;
  level: number;
  party: JourneyMember[];
  result: 'won' | 'lost' | null;
  /** Kuyruk 18 V3: kazanılan eşyalar (SRD kimlikleri). */
  items?: string[];
}

export type JourneyCommand =
  | { type: 'start'; id: string; route: JourneyRoute; seed: number; difficulty: Difficulty; progression: Progression; party: Array<{ id: string; name: string; sheet: CharacterSheet; status?: CharacterStatus }> }
  | { type: 'battle_result'; outcome: 'won' | 'lost'; statuses: Record<string, CharacterStatus>; xp: number }
  | { type: 'short_rest'; dice: Record<string, number> }
  | { type: 'long_rest' }
  | { type: 'advance' }
  | { type: 'drink_potion'; memberId: string }
  /** Kuyruk 18 V3: ödül durağında ganimeti al (son duraksa yolculuk biter). */
  | { type: 'claim_reward' };

export type JourneyEvent =
  | { type: 'journey_started'; state: JourneyState }
  | { type: 'battle_recorded'; stopId: string; outcome: 'won' | 'lost'; statuses: Record<string, CharacterStatus>; xp: number; gold: number; potions: number }
  | { type: 'leveled'; level: number }
  | { type: 'short_rested'; statuses: Record<string, CharacterStatus>; rolls: Record<string, number[]>; hour: number }
  | { type: 'long_rested'; statuses: Record<string, CharacterStatus>; hour: number }
  | { type: 'advanced'; stop: number; hour: number; revived: string[] }
  | { type: 'potion_drunk'; memberId: string; rolls: number[]; hp: number }
  | { type: 'journey_finished'; result: 'won' | 'lost' }
  | { type: 'reward_claimed'; stopId: string; gold: number; potions: number; items: string[] };

export type JourneyResult = { ok: true; state: JourneyState; events: JourneyEvent[] } | { ok: false; error: string };
