/**
 * DROW-MASKE-TOPLU: verilen jetonların Dark Elf (Drow) görünüşünü oyunun kendi çizimiyle döker (yalnız okur; jeton/maske/veri
 * değişmez). JETON-DENETIM sayfasını (`scripts/jeton-denetim-sayfa.tsx`: `sheetAvatar` → `tintedUrl` → `TokenFigure`, `LookFrame` +
 * `AvatarBadge` 84 px) kullanır. Çıktı `gorsel-dokum/drow-maske-toplu/<etiket>/<jeton>-{jeton,rozet}.png` (git dışı); önce/sonra
 * sayfaları `python scripts/drow-maske-sayfa.py`.
 * Çalıştırma: `npx vite-node scripts/drow-maske-cizim.ts -- --etiket once|sonra jeton1,jeton2,...`
 */
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { existsSync, mkdirSync } from 'node:fs';
import sharp from 'sharp';

const argv = process.argv.slice(2).filter((a) => a !== '--');
const etiket = argv.includes('--etiket') ? argv[argv.indexOf('--etiket') + 1]! : 'once';
const names = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--etiket').flatMap((a) => a.split(',')).filter(Boolean);
const OUT = `gorsel-dokum/drow-maske-toplu/${etiket}`;
const VARIANT = process.env.DROW_VARIANT ?? 'elf/drow';
mkdirSync(OUT, { recursive: true });

interface Combo { variant: string; row: string; avatar: { src: string; tint?: unknown; look?: unknown } }

async function main() {
  const server = await createServer({ server: { port: 0, host: '127.0.0.1', watch: { ignored: ['**/gorsel-dokum/**', '**/harita/*/gorsel/**', '**/harita/*/onizleme/**'] } }, logLevel: 'error',
    optimizeDeps: { entries: ['scripts/jeton-denetim-sayfa.tsx'] } });
  await server.listen();
  const base = server.resolvedUrls!.local[0]!;
  const exe = process.env.PW_CHROMIUM ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});
  const ctx = await browser.newContext({ viewport: { width: 2100, height: 2100 }, reducedMotion: 'reduce', deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.setDefaultTimeout(300_000);
  page.on('pageerror', (e) => console.error('sayfa hatası:', String(e).split('\n')[0]));
  await page.addInitScript(() => { try { localStorage.setItem('rpg-battle-effects', 'off'); localStorage.setItem('rpg-battle-acilis', 'off'); } catch { /* yok */ } });
  await page.route(`${base}__drow.html`, (r) => r.fulfill({ contentType: 'text/html', body: `<!doctype html><html><head><meta charset="utf-8">
<script type="module">import R from '/@react-refresh'; R.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => (t) => t; window.__vite_plugin_react_preamble_installed__ = true;</script>
<script type="module" src="/@vite/client"></script></head><body style="margin:0;background:transparent"><div id="root"></div>
<script type="module" src="/scripts/jeton-denetim-sayfa.tsx"></script></body></html>` }));
  await page.goto(`${base}__drow.html`);
  await page.waitForFunction(() => !!(window as unknown as { __jd?: unknown }).__jd || !!(window as unknown as { __jdHata?: string }).__jdHata);
  const err = await page.evaluate(() => (window as unknown as { __jdHata?: string }).__jdHata);
  if (err) throw new Error(err);
  const J = <T>(fn: string, ...args: unknown[]) => page.evaluate(([f, a]) => ((window as unknown as { __jd: Record<string, (...x: unknown[]) => unknown> }).__jd[f as string]!)(...(a as unknown[])), [fn, args] as const) as Promise<T>;

  const combos = await J<Combo[]>('combos');
  const bySrc = new Map<string, Combo>();
  for (const c of combos) {
    if (c.variant !== VARIANT) continue;
    const n = c.avatar.src.replace(/^.*\//, '').replace(/\.webp$/, '');
    if (names.includes(n) && !bySrc.has(n)) bySrc.set(n, c);
  }
  const missing = names.filter((n) => !bySrc.has(n));
  if (missing.length) console.warn('oyunda Drow görünüşü bulunamadı:', missing.join(', '));
  const list = [...bySrc.entries()];
  for (const view of ['jeton', 'rozet'] as const) {
    const cols = 8, cell = view === 'jeton' ? 256 : 164;
    for (let s = 0; s < list.length; s += 32) {
      const part = list.slice(s, s + 32);
      const size = await J<{ w: number; h: number }>('draw', part.map(([n, c]) => ({ key: n, view, avatar: c.avatar, boyali: true })), cols, true);
      const shot = await page.screenshot({ clip: { x: 0, y: 0, width: size.w, height: size.h }, omitBackground: true });
      for (const [i, [n]] of part.entries()) {
        await sharp(shot).extract({ left: (i % cols) * cell, top: Math.floor(i / cols) * cell, width: cell, height: cell }).png().toFile(`${OUT}/${n}-${view}.png`);
      }
    }
  }
  console.log(`${etiket}: ${list.length} jeton → ${OUT}`);
  await browser.close();
  await server.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
