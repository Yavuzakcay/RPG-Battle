/**
 * Kuyruk K73b (kural sürümü 63+; `harita/belgeler/K73B-DENETIM.md`): YZ parametreleri. Çok turlu sur tırmanışı
 * (`ai.ts` `perchMulti`, `perchContinue`), gönüllü düşme (`dropCommand`), düşman tarafındaki uçan menzilliye yükselme
 * (K73a `riseCommand` iki tarafa).
 */
import aiData from '../../../data/yapay-zeka.json';

/** Parametreler (`data/yapay-zeka.json` `k73b`). */
export const K73B = (aiData as unknown as { k73b: { surTurSiniri: number; dusmeCanPayi: number } }).k73b;
