/** Vitest: canavar verisi tembel yüklenir; testlerden önce bir kez yüklenir. */
import { loadClassData, loadMonsters } from './data';

await Promise.all([loadMonsters(), loadClassData()]);
