/**
 * Görev D3 (kural sürümü 89): SRD 5.2.1 farklarının son küçük maddeleri. Draconic Spirit'in Shared Resistances'ı (s. 166:
 * büyücü seçilen hasar türüne direnç; veri `data/summons.json` `sharedResistance`, eski değer `data/srd-duzeltme.json`
 * `surum: 89`), Vampire Familiar'ın efendisi dışındaki Charmed bağışıklığı (s. 334; `charmMaster.ts`), Wild Shape'te
 * biçimin beceri değiştiricisi yüksekse o (s. 43; `druid.ts` `wildSkills`). Tek sabit; yaprak modül. 88 ve altı (eski
 * kayıt, replay) aynen.
 */
import type { BattleState } from './types';

export const SRD_D3_VERSION = 89;
export const srdD3On = (s: Pick<BattleState, 'kuralSurumu'> | undefined): boolean => (s?.kuralSurumu ?? 1) >= SRD_D3_VERSION;
