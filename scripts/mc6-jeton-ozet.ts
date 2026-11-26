/**
 * Görev MC6: tek sınıflı jeton özeti (`sheetAvatar`). Bütün ırk × sınıf × cinsiyet × seviye (1, 3, 5, 20) × (alt sınıfsız, ilk alt
 * sınıf) için `sheetAvatar` çıktısının özeti; MC6 öncesi değer `src/battle/mc6Jeton.test.ts`'te altın.
 *   npx vite-node scripts/mc6-jeton-ozet.ts
 */
import '../src/test-setup';

const { jetonOzeti } = await import('../src/battle/mc6Ozet');
console.log(JSON.stringify(jetonOzeti()));
