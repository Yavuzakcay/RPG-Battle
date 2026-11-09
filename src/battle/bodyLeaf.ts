/**
 * Kuyruk K73c (kural sürümü 64+, Görev 5): çok altıgenli gövdenin ayak izi, yaprak modül. `heights.ts` ve `vertical.ts`
 * `body.ts`'i içe aktarmaz (o `ruleVersion` → `cover` → savaş modülleri döngüsünü açar; `app/modulBaslatma.test.ts`). 64+'da
 * K69 koşulu (sürüm ≥ 53) her zaman sağlanır; sonuç `body.ts` `bodyAt`/`isMultiHex53` ile birebir aynıdır.
 */
import { footprint } from '../rules/footprint';
import type { Offset } from '../rules/hex';
import { k73cOn } from './k73cSurum';
import type { BattleState, Combatant } from './types';

type St = Pick<BattleState, 'kuralSurumu'> & Partial<Pick<BattleState, 'multiHex' | 'multiHexMax'>>;

/** 64+'da çok altıgenli gövdenin `at` çapasındaki altıgenleri; tek altıgenli, bayrak kapalı ya da 63 ve altında null. */
export function body64At(state: St, size: Combatant['size'] | undefined, at: Offset): Offset[] | null {
  if (!size || !state.multiHex || !k73cOn(state)) return null;
  if (size !== 'L' && size !== 'H' && size !== 'G') return null;
  return footprint(at, size === 'G' && state.multiHexMax === 'H' ? 'H' : size);
}
