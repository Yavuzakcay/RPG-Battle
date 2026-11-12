/**
 * Kuyruk K73c (kural sürümü 64+, Görev 1; `harita/belgeler/K73C-DENETIM.md` §1): kazma (SRD 5.2.1 Burrow Speed). Kullanıcı
 * kararı: kazan yaratık YER ALTINDA sayılır, saldırı alamaz, yalnız yüzeye çıkarken saldırır.
 *
 * - Kazma hızı canavar verisinden (`Combatant.burrowFt`). Kazılabilir zemin `data/dikey.json` `kazma` (kum, toprak, çamur,
 *   kar, buz; mağara/zindan ve kasaba ortamında açık zemin taş döşeme sayılır). Duvar, kaya, su, lav, kat döşemesi kazılmaz.
 * - Yer altına iniş/çıkış `vertical_move` (`toFt` −`derinlikFt` / 0): 5 ft kazma = 1 altıgen. Yer altı işareti `burrowed`
 *   (`altitude_changed.burrow`). Yer altında yürüyüş kazma hızıyla, yalnız kazılabilir altıgenlerden, yaratıkların altından.
 * - Yer altındaki hiçbir saldırı ve hedefli etki seçemez; yalnız kazma hızı ya da tremorsense'i olan (kendisi yerin üstünde)
 *   onu hedefleyebilir. Yer üstü alanlar (zemin bölgeleri, küreler, auralar) ona işlemez. Tünel bırakmaz (SRD varsayılanı).
 * Saf.
 */
import dikeyData from '../../data/dikey.json';
import { terrainAt } from './movement';
import { k73cOn } from './k73cSurum';
import type { Offset } from '../rules/hex';
import type { BattleState, Combatant } from './types';
import { binekMb3On } from './binekSurum';

const K = (dikeyData as unknown as { kazma: { harfler: string[]; kayaOrtam: string[]; kayaHarfler: string[]; derinlikFt: number } }).kazma;
export const BURROW_DEPTH_FT = K.derinlikFt;
const DIG = new Set(K.harfler);
const ROCK_ENV = new Set(K.kayaOrtam);
const ROCK_LETTER = new Set(K.kayaHarfler);

/** Kazabilir mi (64+, kazma hızı var). Kuyruk MB3 (69+, B13 ⚠): binicisi üstündeki binek hiçbir yoldan kazamaz (komut, YZ adayı). */
export const canBurrow = (state: Pick<BattleState, 'kuralSurumu'>, c: Pick<Combatant, 'burrowFt'> & { rider?: string }): boolean => k73cOn(state) && (c.burrowFt ?? 0) > 0 && !(c.rider && binekMb3On(state));

/** Yer altında mı (64+). */
export const isBurrowed = (state: Pick<BattleState, 'kuralSurumu'>, c: Pick<Combatant, 'burrowed'> | undefined): boolean => !!c?.burrowed && k73cOn(state);

/** Altıgen kazılabilir mi: kazılabilir harf, kaya ortamında açık zemin değil, geçilmez nesne/engel değil. */
export function diggable(state: BattleState, h: Offset): boolean {
  const ch = state.map?.tiles[h.row]?.[h.col];
  if (!ch || !DIG.has(ch)) return false;
  if (ROCK_ENV.has(state.environmentId) && ROCK_LETTER.has(ch)) return false;
  const t = terrainAt(state, h);
  return !t.outOfBounds && t.movement !== 'blocked' && t.movement !== 'deadly' && t.rule !== 'deepWater';
}

/** Tremorsense menzili (ft) ya da 0. */
export const tremorsenseFt = (c: Pick<Combatant, 'senses'>): number => c.senses?.tremorsense ?? 0;

/**
 * Hedefleme sorunu (yoksa null): yer altındaki saldıramaz/hedef seçemez (kendisi hariç); yer altındakini yalnız yerin üstündeki
 * kazma hızı ya da tremorsense'i (menzilinde) olan hedefler.
 */
export function burrowTargetProblem(state: BattleState, attacker: Combatant, target: Combatant, distFt: number): string | null {
  if (!k73cOn(state) || attacker.id === target.id) return null;
  if (attacker.burrowed) return `${attacker.name} yer altında: saldıramaz ve hedef seçemez (önce yüzeye çıkmalı).`;
  if (!target.burrowed) return null;
  const sense = tremorsenseFt(attacker);
  if ((attacker.burrowFt ?? 0) > 0 || (sense > 0 && distFt <= sense)) return null;
  return `${target.name} yer altında: yalnız kazan ya da titreşim algılayan (tremorsense) hedefleyebilir.`;
}

/** İki yaratıktan yalnız biri yer altında mı (bitişiklik, aura ve tepki menzili kesilir). */
export const burrowSplit = (state: Pick<BattleState, 'kuralSurumu'>, a: Pick<Combatant, 'burrowed'>, b: Pick<Combatant, 'burrowed'>): boolean =>
  k73cOn(state) && !!a.burrowed !== !!b.burrowed;
