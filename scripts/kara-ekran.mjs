/**
 * Kara ekran kontrolü: her harita × varyant × (aynasız, aynalı) × (efekt kapalı, açık; güçlü ölçekli Orman
 * efektlerinde açık "orta" ve "yüksek" yoğunluk ayrı) için savaş
 * ekranını gerçek tarayıcıda (Chromium, telefon yatay ve PC) açar, sahnenin ekran görüntüsünden
 * ortalama parlaklığı ve "boş" (neredeyse siyah) piksel oranını ölçer, aynı ölçümü harita
 * görselinin kendisi için de yapar ve karşılaştırır. Görsel yüklenemezse (arayüzdeki uyarı),
 * sayfa hatası olursa ya da sahne görselden belirgin biçimde karanlıksa başarısız olur.
 *
 * Çalıştırma: `npm run check:harita` (önce bir kez `npx playwright install chromium`).
 * Tarayıcı yolu `PW_CHROMIUM` ile verilebilir. `--hizli`: yalnızca telefon boyutu. Harita kimlikleri
 * verilirse yalnızca onlar (`npm run check:harita -- col magara`).
 * Menü videosu (H.264) savaş ekranında yok; başsız Chromium'da oynatılamaması kontrolü etkilemez.
 */
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';

const OUT = 'test-results/kara-ekran';
const quick = process.argv.includes('--hizli');
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const maps = readdirSync('data/maps').filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(`data/maps/${f}`, 'utf8')))
  .filter((m) => only.length === 0 || only.includes(m.id))
  .sort((a, b) => a.id.localeCompare(b.id));
const sizes = quick ? [['telefon', 844, 390]] : [['telefon', 844, 390], ['pc', 1440, 900]];

/** Sahne görüntüsü görselin parlaklığının en az bu oranında olmalı. */
const MIN_RATIO = 0.55;
/** Boş piksel oranı görseldekinden en çok bu kadar fazla olabilir. */
const MAX_EXTRA_EMPTY = 0.2;
/** Mutlak alt sınırlar: en karanlık görsel (mağara) ~32; altı görsel boş ya da çözülemedi demek. */
const MIN_ART = 15;
const MIN_STAGE = 25;

const server = await createServer({ server: { port: 0, host: '127.0.0.1' }, logLevel: 'error' });
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

let failures = 0;
const rows = [];
for (const map of maps) {
  for (const v of map.variants) {
    const mirrorable = v.mirrorable ?? map.mirrorable;
    for (const mirrored of mirrorable ? [false, true] : [false]) {
      // Görev M2: Orman efektleri "orta" (varsayılan) ve "yüksek" yoğunlukta ayrı ayrı denetlenir ve görüntülenir.
      const strong = (v.effects ?? []).some((e) => e.scale === 'strong');
      const modes = [[false, 'medium'], [true, 'medium'], ...(strong ? [[true, 'high']] : [])];
      for (const [fx, density] of modes) {
        for (const [size, width, height] of sizes) {
          const name = `${map.id}-${v.id}${mirrored ? '-ayna' : ''}-${fx ? 'efekt' : 'duz'}${strong && fx ? (density === 'high' ? '-yuksek' : '-orta') : ''}-${size}`;
          // Yerel makinede (özellikle Windows) sayfa ara sıra zamanında açılmayabiliyor: bir kez daha
          // denenir; yine olmazsa o kontrol HATA yazılır ve betik durmadan sıradakine geçer.
          for (let attempt = 1; attempt <= 2; attempt++) {
            let page;
            try {
              page = await browser.newPage({ viewport: { width, height } });
              const errors = [];
              page.on('pageerror', (e) => errors.push(String(e)));
              // Zar tepsisi (3D zar, koyu arka plan) haritanın önüne geçip ölçümü zamanlamaya bağlı yapmasın: zar animasyonu kapalı.
              await page.addInitScript(([on, d]) => {
                try { localStorage.setItem('rpg-battle-effects', on ? 'on' : 'off'); localStorage.setItem('rpg-battle-effects-density', d); localStorage.setItem('rpg-battle-dice-anim', 'off'); localStorage.setItem('rpg-battle-acilis', 'off'); } catch { /* yok */ }
              }, [fx, density]);
              await page.goto(url);
              // Örnek karakterler arayüzde yok (Görev G): test fikstürü Vite üzerinden belleğe yazılır.
              await page.evaluate(async () => {
                const f = await import('/src/screens/fixtures.ts');
                localStorage.setItem('rpg-battle-characters', JSON.stringify(f.demoCharacters()));
              });
              if (!mirrored) {
                await page.reload();
                await page.click('button.role >> nth=1');
                await page.selectOption('select[aria-label="Harita"]', map.id);
                await page.check(`[aria-label="Varyant"] input[value="${v.id}"]`);
                await page.click('button.cta');
                await page.waitForSelector('.hud-cta');
                await page.click('.hud-cta');
              } else {
                // "Aynala" arayüzden kaldırıldı; aynalı harita yalnızca eski kayıtlarla gelir. Aynalı bir savaş
                // kaydı üretilir ve "Kayıtlı savaşa devam et" ile açılır (eski kayıt uyumluluğu da sınanır).
                await page.evaluate(async ({ mapId, variantId }) => {
                  const data = await import('/src/data/index.ts');
                  await data.loadMonsters();
                  const setup = await import('/src/app/setup.ts');
                  const session = await import('/src/ui/session.ts');
                  const save = await import('/src/app/battleSave.ts');
                  const f = await import('/src/screens/fixtures.ts');
                  const plan = { party: f.demoCharacters().map((c) => ({ id: c.id, sheet: c.sheet })), enemies: [{ monster: data.getMonster('wolf'), count: 2 }],
                    mapId, variantId, mirrored: true };
                  const s = session.dispatch(setup.createMapBattle(setup.planParticipants(plan), plan, Math.random), { type: 'start_battle' }, Math.random);
                  if (s.error) throw new Error(s.error);
                  save.saveBattle(s);
                }, { mapId: map.id, variantId: v.id });
                await page.reload();
                await page.click('text=Kayıtlı savaşa devam et');
                await page.waitForSelector('.mb-stage');
                if (!(await page.locator('.map-art.mirrored').count())) throw new Error('aynalı harita açılmadı');
              }
              await page.mouse.move(1, 1);
              await page.waitForTimeout(fx ? 1200 : 400);
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
              // Görev M: Orman'ın hareketli katmanı efektli açılışta çiziliyor mu (tuvalde boş olmayan piksel); görüntü saklanır.
              if (fx && strong) {
                const drawn = await page.evaluate(() => {
                  const c = document.querySelector('canvas.fx-layer');
                  if (!c) return -1;
                  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
                  let n = 0;
                  for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
                  return n;
                });
                if (drawn <= 0) bad.push(drawn < 0 ? 'efekt katmanı yok' : 'efekt katmanı boş');
                await page.screenshot({ path: `${OUT}/${name}.png` });
              }
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
    }
  }
}
await browser.close();
await server.close();
console.log(`\n${rows.length} kontrol, ${failures} hata.${failures ? ` Ekran görüntüleri: ${OUT}/` : ''}`);
process.exit(failures ? 1 : 0);
