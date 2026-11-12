/**
 * Kuyruk K73c (kural sürümü 64+, Görev 5): çok altıgenli gövdenin ayak izi, yaprak modül. `heights.ts` ve `vertical.ts`
 * `body.ts`'i içe aktarmaz (o `ruleVersion` → `cover` → savaş modülleri döngüsünü açar; `app/modulBaslatma.test.ts`). 64+'da
 * K69 koşulu (sürüm ≥ 53) her zaman sağlanır; sonuç `body.ts` `bodyAt`/`isMultiHex53` ile birebir aynıdır.
 */
import { footprint } from '../rules/footprint';
import type { Offset } from '../rules/hex';
import { k73cOn } from './k73cSurum';
import { binekMb4On } from './binekSurum';
import type { BattleState, Combatant } from './types';

type St = Pick<BattleState, 'kuralSurumu'> & Partial<Pick<BattleState, 'multiHex' | 'multiHexMax'>>;

/** 64+'da çok altıgenli gövdenin `at` çapasındaki altıgenleri; tek altıgenli, bayrak kapalı ya da 63 ve altında null. */
/**
 * Kuyruk MB4 (72+, çok altıgen): bineğinin üstündeki binicinin ayak altı bineğin gövdesi (binici çapada; zemini ve katman seviyesi
 * bineğinkiyle aynı). Öteki herkes için `c.size`.
 */
export function footSize(state: St, c: { size?: Combatant['size']; riding?: string }): Combatant['size'] | undefined {
  if (!c.riding || !binekMb4On(state as Pick<BattleState, 'kuralSurumu' | 'multiHex'>)) return c.size;
  const m = (state as Partial<Pick<BattleState, 'combatants'>>).combatants?.[c.riding];
  return m?.size ?? c.size;
}

export function body64At(state: St, size: Combatant['size'] | undefined, at: Offset): Offset[] | null {
  if (!size || !state.multiHex || !k73cOn(state)) return null;
  if (size !== 'L' && size !== 'H' && size !== 'G') return null;
  return footprint(at, size === 'G' && state.multiHexMax === 'H' ? 'H' : size);
}
