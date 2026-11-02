/**
 * Kara ekran kontrolü (Kuyruk 19: hafif): her harita × mod (varyant) için tek kez, yalnızca telefon yatay görünümünde,
 * efektler kapalı savaş ekranını gerçek tarayıcıda (Chromium) açar; önce tek ısınma sayfası, sayfa başına 60 sn,
 * başarısız denetim bir kez yeniden denenir. Sahnenin ekran görüntüsünden
 * ortalama parlaklığı ve "boş" (neredeyse siyah) piksel oranını ölçer, aynı ölçümü harita
 * görselinin kendisi için de yapar ve karşılaştırır. Görsel yüklenemezse (arayüzdeki uyarı),
 * sayfa hatası olursa ya da sahne görselden belirgin biçimde karanlıksa başarısız olur.
 *
 * Çalıştırma: `npm run check:harita` (önce bir kez `npx playwright install chromium`).
 * Tarayıcı yolu `PW_CHROMIUM` ile verilebilir. Harita kimlikleri
 * verilirse yalnızca onlar (`npm run check:harita -- col magara`).
 * Menü videosu (H.264) savaş ekranında yok; başsız Chromium'da oynatılamaması kontrolü etkilemez.
 */
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';

const OUT = 'test-results/kara-ekran';
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
// Kuyruk 19C: harita/<bolge>/<ad>.json (belgeler ve _ortak hariç).
const mapFiles = readdirSync('harita').filter((d) => d !== 'belgeler' && d !== '_ortak').flatMap((d) => readdirSync(`harita/${d}`).filter((f) => f.endsWith('.json')).map((f) => `harita/${d}/${f}`));
const maps = mapFiles.map((f) => JSON.parse(readFileSync(f, 'utf8')))
  .filter((m) => only.length === 0 || only.includes(m.id))
  .sort((a, b) => a.id.localeCompare(b.id));
const sizes = [['telefon', 844, 390]];

/** Sahne görüntüsü görselin parlaklığının en az bu oranında olmalı. */
const MIN_RATIO = 0.55;
/** Boş piksel oranı görseldekinden en çok bu kadar fazla olabilir. */
const MAX_EXTRA_EMPTY = 0.2;
/** Mutlak alt sınırlar: en karanlık görsel (mağara) ~32; altı görsel boş ya da çözülemedi demek. */
const MIN_ART = 15;
const MIN_STAGE = 25;

// Kuyruk 19: bağımlılıklar baştan bütün kaynaklardan taranır. Yoksa Vite tembel parçalarda (three.js, Game Master,
// savaş ekranı) yeni bağımlılık bulunca sayfayı yeniden yükler ve ilk denetimler rastgele zaman aşımına düşer.
const server = await createServer({
  server: { port: 0, host: '127.0.0.1' }, logLevel: 'error',
  optimizeDeps: { entries: ['index.html', 'src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}', '!src/test-setup.ts'] },
});
await server.listen();
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
mkdirSync(OUT, { recursive: true });

const measure = (page, b64) => page.evaluate(async (src) => {
  const img = new Image();
  img.src = src;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = 320; c.height = Math.round((320 * img.height) / img.width);
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0, c.width, c.height);
  const d = x.getImageData(0, 0, c.width, c.height).data;
  let sum = 0; let empty = 0;
  for (let i = 0; i < d.length; i += 4) {
    const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    sum += l; if (l < 10) empty++;
  }
  return { mean: sum / (d.length / 4), empty: empty / (d.length / 4) };
}, b64);

/** Kuyruk 25: seçicide haritayı seç (bölge çiplerini sırayla dener). Gizli haritalar kayıtlı savaş yolundan açılır. */
export async function pickMap(page, id) {
  // Game Master ekranı tembel parça: çipler gelmeden sayılırsa liste boş kalır.
  await page.waitForSelector('[data-region]');
  for (const chip of await page.locator('[data-region]').all()) {
    if (await page.locator(`[data-map="${id}"]`).count()) break;
    await chip.click();
  }
  await page.click(`[data-map="${id}"]`);
}

/** Kuyruk 19 (-2): her denetimde sayfa en çok bu kadar beklenir (ilk yükleme Windows'ta yavaş olabiliyor). */
const TIMEOUT_MS = 60_000;
const [size, width, height] = sizes[0];

/** Örnek karakterler arayüzde yok (Görev G): test fikstürü Vite üzerinden belleğe yazılır. */
async function seedCharacters(page) {
  await page.evaluate(async () => {
    const f = await import('/src/screens/fixtures.ts');
    localStorage.setItem('rpg-battle-characters', JSON.stringify(f.demoCharacters()));
  });
}

async function newPage() {
  const page = await browser.newPage({ viewport: { width, height } });
  page.setDefaultTimeout(TIMEOUT_MS);
  page.setDefaultNavigationTimeout(TIMEOUT_MS);
  // Efekt ve zar animasyonu kapalı (efekt yalnızca görsel; Kuyruk 19: efekt varyantı denenmez), açılış ekranı atlanır.
  await page.addInitScript(() => {
    try { localStorage.setItem('rpg-battle-effects', 'off'); localStorage.setItem('rpg-battle-dice-anim', 'off'); localStorage.setItem('rpg-battle-acilis', 'off'); } catch { /* yok */ }
  });
  return page;
}

// Isınma: Vite ilk istekte modülleri dönüştürür; tek sayfa Game Master ekranına ve savaş ekranına kadar açılıp kapatılır
// (sonraki sayfalar önbellekten gelir). Isınmanın kendisi sayılmaz.
{
  const t0 = Date.now();
  const page = await newPage();
  try {
    await page.goto(url);
    await seedCharacters(page);
    await page.evaluate(async () => {
      await Promise.all(['/src/screens/GmScreen.tsx', '/src/MapBattle.tsx', '/src/app/setup.ts', '/src/app/battleSave.ts', '/src/data/index.ts']
        .map((m) => import(/* @vite-ignore */ m)));
    });
    await page.reload();
    await page.click('button.role >> nth=1');
    await page.waitForSelector('[data-region]');
    console.log(`ısınma  ${((Date.now() - t0) / 1000).toFixed(1)} sn`);
  } catch (e) {
    console.log(`ısınma  tamamlanmadı (${String(e?.message ?? e).split('\n')[0]}); denetim yine sürer`);
  } finally {
    await page.close().catch(() => {});
  }
}

let failures = 0;
const rows = [];
for (const map of maps) {
  // Kuyruk 19: her harita × mod (varyant: gündüz, gece, fırtına, sis…) tek kez, yalnızca telefon görünümü; PC, efekt ve
  // ayna varyantı denenmez.
  for (const v of map.variants) {
    const name = `${map.id}-${v.id}-${size}`;
    // Bir denetim başarısızsa bir kez daha denenir; yine olmazsa HATA yazılır ve sıradakine geçilir.
    for (let attempt = 1; attempt <= 2; attempt++) {
      let page;
      try {
        page = await newPage();
        const errors = [];
        page.on('pageerror', (e) => errors.push(String(e)));
        await page.goto(url);
        await seedCharacters(page);
        if (!map.gizli) {
          await page.reload();
          await page.click('button.role >> nth=1');
          // Kuyruk 25: iki adımlı seçici: haritanın kartını gösteren bölge çipi, sonra kart.
          await pickMap(page, map.id);
          await page.check(`[aria-label="Varyant"] input[value="${v.id}"]`);
          await page.click('button.cta');
          await page.waitForSelector('.hud-cta');
          await page.click('.hud-cta');
        } else {
          // Gizli haritalar seçicide yok: savaş kaydı üretilir ve "Kayıtlı savaşa devam et" ile açılır.
          await page.evaluate(async ({ mapId, variantId }) => {
            const data = await import('/src/data/index.ts');
            await data.loadMonsters();
            const setup = await import('/src/app/setup.ts');
            const session = await import('/src/ui/session.ts');
            const save = await import('/src/app/battleSave.ts');
            const f = await import('/src/screens/fixtures.ts');
            const plan = { party: f.demoCharacters().map((c) => ({ id: c.id, sheet: c.sheet })), enemies: [{ monster: data.getMonster('wolf'), count: 2 }], mapId, variantId };
            const s = session.dispatch(setup.createMapBattle(setup.planParticipants(plan), plan, Math.random), { type: 'start_battle' }, Math.random);
            if (s.error) throw new Error(s.error);
            save.saveBattle(s);
          }, { mapId: map.id, variantId: v.id });
          await page.reload();
          await page.click('text=Kayıtlı savaşa devam et');
        }
        await page.waitForSelector('.mb-stage');
        await page.mouse.move(1, 1);
        await page.waitForTimeout(400);
        const shot = await page.locator('.mb-stage').screenshot();
        const stage = await measure(page, `data:image/png;base64,${shot.toString('base64')}`);
        const art = await measure(page, `${url}${v.image}`).catch(() => ({ mean: 0, empty: 1 }));
        const artError = await page.locator('.art-error').count();
        const bad = [];
        if (artError) bad.push('görsel yüklenemedi');
        if (art.mean < MIN_ART) bad.push(`görsel boş ya da çözülemedi (parlaklık ${art.mean.toFixed(0)})`);
        if (stage.mean < MIN_STAGE) bad.push(`sahne kara (parlaklık ${stage.mean.toFixed(0)})`);
        if (errors.length) bad.push(`sayfa hatası: ${errors[0]}`);
        if (stage.mean < art.mean * MIN_RATIO) bad.push(`karanlık: parlaklık ${stage.mean.toFixed(0)} < ${(art.mean * MIN_RATIO).toFixed(0)}`);
        if (stage.empty > art.empty + MAX_EXTRA_EMPTY) bad.push(`boş piksel %${(stage.empty * 100).toFixed(0)} (görsel %${(art.empty * 100).toFixed(0)})`);
        if (bad.length && attempt === 1) { console.log(`yeniden  ${name.padEnd(42)} ${bad.join('; ')}`); continue; }
        if (bad.length) { failures++; await page.screenshot({ path: `${OUT}/${name}.png` }); }
        rows.push(`${bad.length ? 'HATA' : 'tamam'}  ${name.padEnd(42)} parlaklık ${stage.mean.toFixed(0).padStart(3)} / görsel ${art.mean.toFixed(0).padStart(3)}  boş %${(stage.empty * 100).toFixed(0).padStart(2)}${bad.length ? `  ${bad.join('; ')}` : ''}`);
        console.log(rows[rows.length - 1]);
        break;
      } catch (e) {
        const msg = String(e?.message ?? e).split('\n')[0];
        if (page) await page.screenshot({ path: `${OUT}/${name}.png` }).catch(() => {});
        if (attempt === 1) { console.log(`yeniden  ${name.padEnd(42)} ${msg}`); continue; }
        failures++;
        rows.push(`HATA   ${name.padEnd(42)} ${msg}`);
        console.log(rows[rows.length - 1]);
      } finally {
        await page?.close().catch(() => {});
      }
    }
  }
}
await browser.close();
await server.close();
console.log(`\n${rows.length} kontrol, ${failures} hata.${failures ? ` Ekran görüntüleri: ${OUT}/` : ''}`);
process.exit(failures ? 1 : 0);
