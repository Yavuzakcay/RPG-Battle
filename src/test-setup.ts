/** Vitest: canavar verisi tembel yüklenir; testlerden önce bir kez yüklenir. F1: İngilizce metinler de (ayrı parça). */
import { loadClassData, loadMonsters } from './data';
import { loadLang } from './i18n';

await Promise.all([loadMonsters(), loadClassData(), loadLang('en')]);
