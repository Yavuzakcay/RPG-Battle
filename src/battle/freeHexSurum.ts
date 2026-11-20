/**
 * Kuyruk FH1 (kural sürümü 81): hedefsiz altıgene büyü. Tek sabit; yaprak modül (yalnız tür bağı).
 * - Tek hedefli saldırı, otomatik isabet ve save büyüleri (alansız) menzil ve görüşteki her altıgene atılır (`cast_spell.targetHex`,
 *   `targetId` yok): slot/kaynak harcanır; altıgende yaratık varsa normal hedefleme (isabet/save), nesne varsa nesneye hasar,
 *   yoksa büyü boşa gider. Büyünün hasar türü K55 çözücüsüne (büyü × yüzey, arazi × büyü) altıgen dokunuşu olarak gider.
 * - Game Master anahtarı `freeHexTarget` kapsar (varsayılan açık). 80 ve altı: yalnız ateşli büyü ve yalnız yanıcı altıgen
 *   (anahtar `greaseFlammable`/`freeHexTarget` ile), eski kayıt ve replay aynen. Yapay zekâ bu yolu kullanmaz.
 */
import type { BattleState } from './types';

export const FREE_HEX_VERSION = 81;
export const freeHexVersionOn = (s: Pick<BattleState, 'kuralSurumu'> | undefined): boolean => (s?.kuralSurumu ?? 1) >= FREE_HEX_VERSION;
