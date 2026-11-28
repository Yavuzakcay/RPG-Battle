/**
 * GECE-KATALOG-KALAN (kural sürümü 110): katalog güçlerinin ⚠ düzeltmeleri, kanca listesinin 2. turu ve motor yaklaşıkları.
 * Veri `data/katalog-gucler.json` canavar kaydında `s110` bloğu (110+ savaşta kaydın üst anahtarlarının yerine geçer; üretici
 * `python scripts/katalog-gucler.py`); eşya güçleri `data/katalog-kanca.json`. 109 ve altı (eski kayıt, replay) aynen.
 * Tek sabit; yaprak modül. Kararlar DECISIONS.md "GECE-KATALOG-KALAN".
 */
import type { BattleState } from './types';

export const KATALOG110_VERSION = 110;
export const katalog110On = (s: Pick<BattleState, 'kuralSurumu'> | undefined): boolean => (s?.kuralSurumu ?? 1) >= KATALOG110_VERSION;
