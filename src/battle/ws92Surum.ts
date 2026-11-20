/**
 * Görev WS92 (kural sürümü 92): Wild Shape, biçim özellikleri ve Swallow'un SRD 5.2.1 uyumu. Tek sabit; yaprak modül.
 * - Swallow (Giant Frog s. 351, Giant Toad s. 354 ve diğer yutanlar): yutulan yutanın midesinde (konumu yutanınki, hücre
 *   kaplamaz, dışarıdan Total Cover: hedef alınmaz, alan/etki işlemez; içeriden yalnız yutanı hedefler), yakalama biter,
 *   yutan Bite'ı kullanamaz (`blocks`), Giant Toad bir seferde bir yaratık (`single`), yutan ölünce yutulan Restrained değil
 *   ve sonraki turunda 5 ft hareketle cesetten Prone çıkar, kusulan/serbest kalan yutanın bitişiğine Prone çıkar, biçimi
 *   biten (Wild Shape/Polymorph) yutan yutulanı bırakır.
 * - Wild Shape çekirdeği (s. 42–43): biçimde eşyanın kurtarma eki düşer (Objects), Beast Spells malzeme istisnası, Wild
 *   Companion familiar'ı Fey, yapay zekâ en güçlü seçili biçimi seçer ve slot kazanınca biçimden çıkar.
 * - Biçim özellikleri: STR/DEX skoru biçimden, Rampage biçimde, Illumination parlak + loş, atlama özellikleri doğal atlama
 *   kuralıyla, Water Breathing karada nefes, Bubble Dash yalnız o hareket, Cacophony dezavantajları, sabit 1 hasar, Multiattack
 *   bileşimi (Brown Bear, Lion).
 * 91 ve altı (eski kayıt, replay) aynen.
 */
import type { BattleState } from './types';

export const WS92_VERSION = 92;
export const ws92On = (s: Pick<BattleState, 'kuralSurumu'> | undefined): boolean => (s?.kuralSurumu ?? 1) >= WS92_VERSION;
