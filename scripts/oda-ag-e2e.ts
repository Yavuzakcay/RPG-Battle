/**
 * Görev ODA-2 (O2) bitti ölçütü, uçtan uca (npm test dışında): gerçek `npm run oda-sunucu` (dist + yerel ağ aktarıcısı)
 * üstünde üç ayrı tarayıcı bağlamı (ayrı "cihazlar": ayrı depolama): Game Master + iki oyuncu. GM oda açar; oyuncular
 * kodla katılıp kendi karakter kopyasını gönderir; GM savaşı başlatır; oyuncu kendi sırasında komut gönderir (Turu
 * bitir), öbür oyuncu ve GM aynı sırayı görür; yetkisiz komut (başkasının sırasında) reddedilir. Tek ekran görüntüsü
 * `docs/oda-2/oyuncu.png` (`--ekran`).
 *
 * Çalıştırma (PowerShell):  npm run build; npx vite-node scripts/oda-ag-e2e.ts -- --ekran
 * Chromium yolu gerekirse $env:PW_CHROMIUM.
 */
import { chromium, type Page } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { loadClassData, loadMonsters } from '../src/data';
import { demoCharacters } from '../src/screens/fixtures';

await Promise.all([loadMonsters(), loadClassData()]);
const ekran = process.argv.includes('--ekran');
const PORT = 5000 + Math.floor(Math.random() * 900);
const url = `http://127.0.0.1:${PORT}`;
const [K1, K2] = demoCharacters();
if (!K1 || !K2) throw new Error('fikstür karakterleri yok');

const sunucu = spawn('npx', ['vite-node', 'scripts/oda-sunucu.ts', '--', '--port', String(PORT), '--qr-yok'], { stdio: ['ignore', 'pipe', 'pipe'], detached: true });
await new Promise<void>((r, j) => {
  const t = setTimeout(() => j(new Error('sunucu açılmadı')), 60_000);
  sunucu.stdout.on('data', (d: Buffer) => { if (String(d).includes('oda sunucusu')) { clearTimeout(t); r(); } });
  sunucu.on('exit', () => j(new Error('sunucu kapandı')));
});

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const hatalar: string[] = [];
const adim = (s: string) => console.log(`· ${s}`);
async function cihaz(ad: string, karakterler: unknown[], boyut = { width: 1280, height: 720 }): Promise<Page> {
  const ctx = await browser.newContext({ viewport: boyut });
  await ctx.addInitScript((k: string) => {
    try {
      localStorage.setItem('rpg-battle-effects', 'off'); localStorage.setItem('rpg-battle-dice-anim', 'off'); localStorage.setItem('rpg-battle-acilis', 'off');
      if (!localStorage.getItem('rpg-battle-characters')) localStorage.setItem('rpg-battle-characters', k);
    } catch { /* yok */ }
  }, JSON.stringify(karakterler));
  const p = await ctx.newPage();
  p.setDefaultTimeout(60_000);
  p.on('pageerror', (e) => hatalar.push(`${ad}: ${e}`));
  await p.goto(url);
  return p;
}
const simdiki = (p: Page) => p.locator('.turn-strip .strip-item.now').first().getAttribute('aria-label').catch(() => null);
const ayni = (p: Page, x: string | null) => p.waitForFunction((v) => document.querySelector('.turn-strip .strip-item.now')?.getAttribute('aria-label') === v, x, { timeout: 15_000 });

let sonuc = 1;
try {
  const gm = await cihaz('gm', []);
  await gm.click('[data-testid="home-room-create"]');
  await gm.click('[data-testid="oda-create"]');
  await gm.waitForSelector('[data-testid="map-region"]');
  await gm.click('[data-testid="oda-cevrimici-ac"]');
  const kod = (await gm.locator('[data-testid="oda-kod"]').textContent())?.trim() ?? '';
  const tur = await gm.locator('.oda-kod small').textContent();
  adim(`GM oda açtı: kod ${kod} (${tur})`);
  if (!tur?.includes('Yerel ağ')) throw new Error(`bağlantı türü yerel ağ değil: ${tur}`);

  const oyuncular: Page[] = [];
  for (const [ad, k] of [['Ada', K1], ['Bora', K2]] as const) {
    const p = await cihaz(ad, [k], { width: 844, height: 390 });
    await p.click('.home-card.join');
    await p.fill('[data-testid="oda-kod-gir"]', kod);
    await p.fill('[aria-label="Adın"]', ad);
    await p.click('[data-testid="oda-katil"]');
    await p.waitForSelector('[data-testid="oda-lobi"]');
    await p.click('[data-testid="oda-kopya-gonder"]');
    oyuncular.push(p);
    adim(`${ad} kodla katıldı, ${k.sheet.name} kopyasını gönderdi`);
  }
  const [a, b] = oyuncular as [Page, Page];
  await gm.waitForFunction(() => document.querySelectorAll('[data-testid="party-chip"] input:checked').length === 2);
  // Zar modu "yalnızca oyuncular": oyuncu karakterlerinin zarları (inisiyatif) sahibinin cihazında istenir.
  await gm.locator('[role="radiogroup"][aria-label="Zar modu"] button', { hasText: 'yalnızca oyuncu' }).click();
  await gm.click('[data-testid="map-start"]');
  let gmBekledi = false, uzakZar = 0;
  for (let i = 0; i < 40 && uzakZar < 2; i++) {
    if (await gm.locator('.dice-prompt .dice-remote-note').count()) gmBekledi = true;
    for (const p of oyuncular) {
      const istem = p.locator('.dice-prompt', { has: p.locator('.dice-remote-note') });
      if (await istem.count()) { await istem.locator('.dice-actions button:not(.cta):not(.ghost)').click(); uzakZar++; }
    }
    await gm.waitForTimeout(250);
  }
  if (uzakZar < 2) throw new Error(`oyuncu cihazına zar istemi gelmedi (${uzakZar})`);
  await gm.waitForSelector('[data-testid="battle-stage"]');
  for (const p of oyuncular) await p.waitForSelector('[data-testid="battle-stage"]');
  await gm.click('[data-testid="battle-start"]');
  for (const p of oyuncular) await p.waitForSelector('[data-testid="oda-izle-bar"].playing');
  await gm.waitForSelector('.turn-strip .strip-item.now');
  adim(`savaş başladı: inisiyatif zarları oyuncuların cihazında atıldı (${uzakZar}; GM bekleme notu ${gmBekledi ? 'göründü' : 'görülmedi'}); iki oyuncu da kendi karakteriyle oynuyor`);

  const sahip = (ad: string | null) => (ad?.includes(K1.sheet.name) ? a : ad?.includes(K2.sheet.name) ? b : null);
  let oyuncuKomutu = 0, yetkiRed = false;
  for (let i = 0; i < 12 && oyuncuKomutu < 2; i++) {
    const once = await simdiki(gm);
    const kim = sahip(once);
    if (!kim) {
      await gm.locator('.hud-btn.enemy-play').first().click();
    } else {
      const obur = kim === a ? b : a;
      if (!yetkiRed) {
        // Öbür oyuncu başkasının sırasında "Turu bitir" der: host reddeder, sıra değişmez.
        await obur.locator('.radial-btn', { hasText: 'Turu bitir' }).first().click();
        await obur.waitForSelector('.toast.error, [role="alert"], .toasts .error', { timeout: 10_000 }).catch(() => null);
        await gm.waitForTimeout(500);
        if ((await simdiki(gm)) !== once) throw new Error('yetkisiz komut çalıştı');
        yetkiRed = true;
        adim('başkasının sırasında gönderilen komut reddedildi, sıra değişmedi');
      }
      await kim.locator('.radial-btn', { hasText: 'Turu bitir' }).first().click();
      oyuncuKomutu++;
    }
    await gm.waitForFunction((o) => document.querySelector('.turn-strip .strip-item.now')?.getAttribute('aria-label') !== o, once, { timeout: 20_000 });
    const g = await simdiki(gm);
    await ayni(a, g); await ayni(b, g);
    adim(`${kim ? `oyuncu (${once}) komut gönderdi` : 'GM düşmanı oynattı'}: GM ve iki oyuncuda sıra ${g}`);
  }
  if (oyuncuKomutu < 1) throw new Error('oyuncu sırası gelmedi');
  // Görev ODA-3: görünüm süzgeci. Seçenekler menüsünde Game Master araçları ve kayıt/yükleme oyuncu cihazında yok.
  const kaydet = async (p: Page): Promise<number> => {
    await p.locator('.hud-corner.tl > .hud-btn').first().click();
    const n = await p.locator('.hud-corner.tl .hud-pop button', { hasText: /^Kaydet$/ }).count();
    await p.locator('.hud-corner.tl > .hud-btn').first().click();
    return n;
  };
  if ((await kaydet(gm)) !== 1) throw new Error('GM seçeneklerinde Kaydet yok');
  if ((await kaydet(a)) !== 0) throw new Error('oyuncu cihazında Game Master araçları görünüyor');
  adim('O3: Game Master araçları ve kayıt yalnız GM cihazında');
  // Görev ODA-4: Ada'nın cihazı kapanır (bağlantı kopar). Sırası gelince GM'e karar menüsü çıkar; "Yapay zekâ oynasın".
  await a.context().close();
  let yzOynadi = false;
  for (let i = 0; i < 14 && !yzOynadi; i++) {
    const once = await simdiki(gm);
    const kim = sahip(once);
    if (kim === a) {
      await gm.waitForSelector('[data-testid="oda-karar"]', { timeout: 20_000 });
      await gm.click('[data-testid="oda-karar-yz"]');
      yzOynadi = true;
    } else if (kim === b) await b.locator('.radial-btn', { hasText: 'Turu bitir' }).first().click();
    else await gm.locator('.hud-btn.enemy-play').first().click();
    await gm.waitForFunction((o) => document.querySelector('.turn-strip .strip-item.now')?.getAttribute('aria-label') !== o, once, { timeout: 30_000 });
  }
  if (!yzOynadi) throw new Error('kopan oyuncunun sırası gelmedi');
  adim('O4: kopan oyuncunun sırasında GM karar menüsü çıktı; "Yapay zekâ oynasın" turu oynadı');
  if (ekran) {
    mkdirSync('docs/oda-2', { recursive: true });
    await b.screenshot({ path: 'docs/oda-2/oyuncu.png' });
    adim('ekran görüntüsü docs/oda-2/oyuncu.png');
  }
  if (hatalar.length) throw new Error(hatalar[0]);
  console.log(`tamam: O2/O3/O4 yerel ağ akışı (oyuncu komutu ${oyuncuKomutu}, yetki reddi ${yetkiRed ? 'var' : 'denenmedi'})`);
  sonuc = 0;
} catch (e) {
  console.error(`HATA: ${String((e as Error)?.message ?? e).split('\n')[0]}`);
  if (process.env.E2E_HATA_DIR) for (const [i, c] of browser.contexts().entries()) for (const pg of c.pages()) await pg.screenshot({ path: `${process.env.E2E_HATA_DIR}/sayfa-${i}.png` }).catch(() => {});
  for (const h of hatalar) console.error(`  sayfa hatası ${h}`);
} finally {
  await browser.close();
  try { process.kill(-(sunucu.pid as number), 'SIGTERM'); } catch { sunucu.kill('SIGTERM'); }
}
process.exit(sonuc);
