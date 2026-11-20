/**
 * Görev D: telefon dikey savaş yerleşiminin ekran görüntüleri (gerçek tarayıcı, Chromium). Kayıtlı savaş yolundan açılır
 * (Dere Kenarı `orman`, klasik 15×7: Mira, Bor ve iki goblin; goblinler Mira'nın yanında), sahne düğümleri arayüzden sürülür.
 *
 * Çalıştırma: `node scripts/dikey-ekran.mjs [--cikti <klasör>] [--onek <ad>] [--boyut 390x844,360x740] [--sahne sira,menu,...]`
 * Sahneler: sira (kendi sıran, menü kapalı), menu (eylem menüsü açık), saldiri (saldırı hedefi seçerken), alan (Fireball
 * nişanı), tepki (Shield sorusu), zar (zar tepsisi). Her görüntüde sahnenin (harita) piksel yüksekliği konsola yazılır.
 * Tarayıcı yolu `PW_CHROMIUM` ile verilebilir.
 */
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { mkdirSync } from 'node:fs';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : d; };
const OUT = arg('--cikti', 'test-results/dikey');
const PREFIX = arg('--onek', '');
const SIZES = arg('--boyut', '390x844,360x740,412x915').split(',').map((s) => s.split('x').map(Number));
const SCENES = arg('--sahne', 'sira,menu,saldiri,alan,tepki,zar').split(',');
mkdirSync(OUT, { recursive: true });

const server = await createServer({
  server: { port: 0, host: '127.0.0.1' }, logLevel: 'error',
  optimizeDeps: { entries: ['index.html', 'src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}', '!src/test-setup.ts'] },
});
await server.listen();
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});

/** Kayıtlı savaş: `who` sırası gelene dek diğerleri turunu bitirir. `shield`: Mira'ya Shield (tepki sorusu için). */
async function seed(page, who, opts = {}) {
  await page.evaluate(async ({ who, opts }) => {
    // Belirlenimci tohum (önce/sonra karşılaştırması aynı savaşı açsın).
    let seedN = opts.seed ?? 7;
    const rnd = () => { seedN = (seedN + 0x6d2b79f5) | 0; let t = Math.imul(seedN ^ (seedN >>> 15), 1 | seedN); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const data = await import('/src/data/index.ts');
    await Promise.all([data.loadMonsters(), data.loadClassData()]);
    const setup = await import('/src/app/setup.ts');
    const session = await import('/src/ui/session.ts');
    const save = await import('/src/app/battleSave.ts');
    const f = await import('/src/screens/fixtures.ts');
    const chars = f.demoCharacters();
    if (opts.shield) for (const c of chars) if (c.sheet.classId === 'wizard') c.sheet = { ...c.sheet, spellNames: [...(c.sheet.spellNames ?? []), 'Shield'] };
    localStorage.setItem('rpg-battle-characters', JSON.stringify(chars));
    const plan = { party: chars.map((c) => ({ id: c.id, sheet: c.sheet })), enemies: [{ monster: data.getMonster(opts.foe ?? 'goblin-warrior'), count: 2 }], mapId: 'orman', variantId: 'orman' };
    let s = setup.createMapBattle(setup.planParticipants(plan), plan, rnd);
    // Yerleşim (Game Master `place`): Mira ortada, Bor yanında, bir goblin Mira'nın bitişiğinde, diğeri biraz uzakta.
    const cs = s.state.combatants;
    const party = Object.values(cs).filter((c) => c.side === 'party');
    const foes = Object.values(cs).filter((c) => c.side === 'enemies');
    const mira = party.find((c) => c.name === 'Mira') ?? party[0];
    const bor = party.find((c) => c !== mira);
    const want = [[mira, [5, 3]], [bor, opts.borFar ? [1, 5] : [5, 4]], [foes[0], [6, 3]], [foes[1], [8, 2]]];
    for (const [c, [col, row]] of want) {
      if (!c) continue;
      let ok = false;
      for (const [dc, dr] of [[0, 0], [0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [2, 0]]) {
        const n = session.dispatch(s, { type: 'place', actorId: c.id, at: { col: col + dc, row: row + dr } }, rnd, session.GM_CONTEXT);
        if (!n.error) { s = n; ok = true; break; }
      }
      if (!ok) console.warn('yerleşmedi', c.name);
    }
    s = session.dispatch(s, { type: 'start_battle' }, rnd);
    if (s.error) throw new Error(s.error);
    for (let i = 0; i < 12; i++) {
      const id = s.state.order[s.state.turnIndex];
      const c = s.state.combatants[id];
      if (who === 'enemy' ? c.side === 'enemies' : c.name === who) break;
      s = session.dispatch(s, { type: 'end_turn', actorId: id }, rnd);
      if (s.error) throw new Error(s.error);
    }
    save.saveBattle(s);
  }, { who, opts });
}

async function open(w, h, who, opts = {}) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: Number(process.env.OLCEK ?? 1), hasTouch: w < h, isMobile: false, ...(process.env.HAREKET === 'azalt' ? { reducedMotion: 'reduce' } : {}) });
  page.setDefaultTimeout(25_000);
  await page.addInitScript((anim) => {
    try {
      localStorage.setItem('rpg-battle-effects', 'off'); localStorage.setItem('rpg-battle-dice-anim', anim); localStorage.setItem('rpg-battle-acilis', 'off');
      localStorage.setItem('rpg-battle-reactions', JSON.stringify({ player: 'ask', enemy: 'ai' }));
    } catch { /* yok */ }
  }, opts.dice ? 'normal' : 'off');
  await page.goto(url);
  await seed(page, who, opts);
  await page.reload();
  await page.click('[data-testid="home-resume"]');
  await page.waitForSelector('[data-testid="battle-stage"]');
  await page.mouse.move(1, 1);
  await page.waitForTimeout(500);
  // Bir kerelik bildirimler (alt soy notu vb.) kapatılır.
  for (const b of await page.locator('button', { hasText: /^(Kapat|Close)$/ }).all()) await b.click().catch(() => {});
  await page.waitForTimeout(200);
  return page;
}

const stageH = async (page) => Math.round((await page.locator('[data-testid="battle-stage"]').boundingBox())?.height ?? 0);
const portrait = (w, h) => w < h && w <= 520;
/** Eylem menüsünü açar (dikeyde çekmece çubuğu; yatayda radyal zaten açık). */
async function openMenu(page, w, h) {
  if (portrait(w, h) && await page.locator('[data-testid="sheet-handle"]').count()) {
    if ((await page.locator('[data-testid="sheet-handle"]').getAttribute('aria-expanded')) !== 'true') await page.click('[data-testid="sheet-handle"]');
    await page.waitForTimeout(200);
  }
}
const clickAction = async (page, label) => page.locator(`.radial-btn[aria-label^="${label}"]`).first().click();

const rows = [];
async function shot(page, name, w, h) {
  const file = `${OUT}/${PREFIX}${name}-${w}x${h}.png`;
  await page.screenshot({ path: file });
  const sh = await stageH(page);
  rows.push(`${file}  sahne ${Math.round((await page.locator('[data-testid="battle-stage"]').boundingBox())?.width ?? 0)}×${sh}`);
  console.log(rows[rows.length - 1]);
}

for (const [w, h] of SIZES) {
  for (const scene of SCENES) {
    let page;
    try {
      if (scene === 'sira' || scene === 'menu') {
        page = await open(w, h, 'Bor');
        if (scene === 'menu') await openMenu(page, w, h);
        else if (portrait(w, h)) { /* çekmece kapalı */ }
        await shot(page, scene, w, h);
      } else if (scene === 'saldiri') {
        page = await open(w, h, 'Bor');
        await openMenu(page, w, h);
        await clickAction(page, 'Saldır');
        await page.waitForTimeout(200);
        await page.waitForTimeout(300);
        await shot(page, scene, w, h);
      } else if (scene === 'alan') {
        page = await open(w, h, 'Mira');
        await openMenu(page, w, h);
        await clickAction(page, 'Büyü');
        await page.waitForTimeout(300);
        await page.locator('.menu-tabs button', { hasText: /^3\./ }).first().click();
        await page.waitForTimeout(200);
        await page.locator('.bubble button', { hasText: 'Fireball' }).first().click();
        await page.waitForTimeout(300);
        // Hedef: ikinci goblinin altıgeni (önizleme ve sayılar).
        const foe = page.locator('[data-testid="battle-stage"] .token.enemies').last();
        if (await foe.count()) await foe.click({ force: true }).catch(() => {});
        await page.waitForTimeout(300);
        await shot(page, scene, w, h);
      } else if (scene === 'tepki' || scene === 'zar') {
        // Düşman turu: goblin Mira'ya saldırır; Shield sorulur (tohum denenir).
        let found = false;
        for (let tr = 0; tr < (process.env.DENEME ? Number(process.env.DENEME) : 8) && !found; tr++) {
          page = await open(w, h, 'enemy', { shield: scene === 'tepki', dice: scene === 'zar', borFar: true, foe: 'wolf', seed: 11 + tr });
          await page.locator('.hud-btn.enemy-play').first().click();
          if (scene === 'tepki') {
            found = await page.locator('.reaction-prompt').waitFor({ timeout: 6000 }).then(() => true).catch(() => false);
          } else {
            found = await page.locator('.dice-tray').waitFor({ timeout: 6000 }).then(() => true).catch(() => false);
            if (found) await page.waitForTimeout(250);
          }
          if (!found && tr === (process.env.DENEME ? Number(process.env.DENEME) : 8) - 1) {
            await page.locator('button', { hasText: /^Günlük/ }).first().click().catch(() => {});
            await page.waitForTimeout(300);
            await page.screenshot({ path: `${OUT}/${PREFIX}${scene}-${w}x${h}-yok.png` });
          }
          if (!found) await page.close();
        }
        if (found) await shot(page, scene, w, h);
        else console.log(`${scene} ${w}x${h}: bulunamadı`);
      }
    } catch (e) {
      console.log(`HATA ${scene} ${w}x${h}: ${String(e?.message ?? e).split('\n')[0]}`);
      if (page) await page.screenshot({ path: `${OUT}/${PREFIX}${scene}-${w}x${h}-hata.png` }).catch(() => {});
    } finally {
      await page?.close().catch(() => {});
    }
  }
}
await browser.close();
await server.close();
