/**
 * Kuyruk E2: bağlı büyülerin gerçek motordan doğrulanması → data/efekt-e2-dogrulama.json (tablo betiği yalnız bu listedekileri
 * "hazır" sayar; `src/ui/fx/fxPlan.e2.test.ts` dosyanın güncel olduğunu denetler). Çalıştırma: `npx vite-node scripts/e2-dogrula.ts`.
 */
import fs from 'node:fs';
import { loadClassData, loadMonsters } from '../src/data';
import { loadLang } from '../src/i18n';

await Promise.all([loadMonsters(), loadClassData(), loadLang('tr')]);
const { verifyAll, verifyBadges } = await import('../src/ui/fx/e2Verify');
const fx = verifyAll();
const rozet = verifyBadges();
const pick = (v: typeof fx) => Object.fromEntries(v.filter((x) => x.ok).map((x) => [x.id, x.how]));
const out = {
  not: 'Kuyruk E2 (npx vite-node scripts/e2-dogrula.ts üretir; elle düzenlenmez): gerçek motorla dökülüp fxPlan çıktısında beklenen efekt anahtarı çizilen büyüler (efekt) ve jetonda sayı oku rozeti kalan büyüler (rozet); değer: nasıl döküldüğü. Tablo betiği (scripts/buyu-efekt-tablosu.mjs) yalnız buradakileri E2 hazır sayar.',
  efekt: pick(fx), rozet: pick(rozet),
  basarisiz: [...fx, ...rozet].filter((x) => !x.ok).map((x) => `${x.id}: ${x.how}`),
};
fs.writeFileSync('data/efekt-e2-dogrulama.json', `${JSON.stringify(out, null, 2)}\n`);
console.log(`efekt ${Object.keys(out.efekt).length}/${fx.length}, rozet ${Object.keys(out.rozet).length}/${rozet.length}; başarısız ${out.basarisiz.length}`);
