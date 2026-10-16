/** Vitest: canavar verisi tembel yüklenir; testlerden önce bir kez yüklenir. */
import { loadMonsters } from './data';

await loadMonsters();
