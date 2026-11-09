/**
 * Kuyruk K73c (kural sürümü 64+; `harita/belgeler/K73C-DENETIM.md`): YZ parametreleri. Kazan düşman (`ai.ts`
 * `burrowCommand`), batık yaratığın yüzeye çıkışı (`waterCommand`), yüzme hızı olmayanın derin su riski (`risk`).
 */
import aiData from '../../../data/yapay-zeka.json';

/** Parametreler (`data/yapay-zeka.json` `k73c`). */
export const K73C = (aiData as unknown as { k73c: { suRiski: number } }).k73c;
