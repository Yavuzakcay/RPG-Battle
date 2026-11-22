/**
 * ROZET-CERCEVE-KIRPMA ölçüm sürücüsü (yalnız okur; jeton/maske/veri değişmez). `harita/belgeler/JETON-DENETIM.md` bölüm 2b'deki jetonların
 * (ya da `--ad a,b`) bütün görünüşlerini oyunun kendi bileşenleriyle (`scripts/rozet-cerceve-sayfa.tsx`, Vite + Playwright Chromium) dört
 * yerde çizer: rozet 44 px, rozet 84 px, savaş jetonu (96 px), oluşturucu figürü (200 px). Her çizim kırpmalı ve kırpmasız; kesilen
 * piksel = kırpmasızda opak (alfa > 60) olup kırpmalıda olmayan. Çıktı `gorsel-dokum/rozet-cerceve/<etiket>/` (git dışı):
 *   olcum.json            hücre başına kesilen piksel, rozette figür boyu/tepe payı
 *   <görünüm>-<boy>.png   kırpmalı çizim; kesilen pikseller kırmızı
 * `--karsilastir once,sonra`: iki etiketin yan yana kontak sayfası (`kontak-<n>.png`) ve özet.
 * Çalıştırma: `npx vite-node scripts/rozet-cerceve.ts -- --etiket once` (düzeltmeden önce), `-- --etiket sonra`, `-- --karsilastir once,sonra`.
 */
import { chromium } from 'playwright';
import { createServer } from 'vite';
import sharp from 'sharp';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const ROOT = 'gorsel-dokum/rozet-cerceve';
const argv = process.argv.slice(2);
const arg = (k: string) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : undefined);
const ESIK = 60;
type View = 'rozet' | 'jeton' | 'figur';
const VIEWS: Array<{ view: View; size: number; cols: number }> = [
  { view: 'rozet', size: 44, cols: 16 }, { view: 'rozet', size: 84, cols: 12 }, { view: 'jeton', size: 96, cols: 10 }, { view: 'figur', size: 200, cols: 6 }];
const cellW = (_v: View, size: number) => size * 2;

/** JETON-DENETIM 2b listesi (rozet kırpması ≥ 10 px). */
export function auditNames(): string[] {
  const md = readFileSync('harita/belgeler/JETON-DENETIM.md', 'utf8');
  const line = md.split('\n').find((l) => l.startsWith('Rozet kırpması ≥ 10 px'));
  if (!line) throw new Error('JETON-DENETIM.md: rozet listesi yok');
  return [...line.matchAll(/`([^`]+)` \d+/g)].map((m) => m[1]!);
}

interface CellOut { key: string; name: string; label: string; kesilen: Record<string, number>; boy: Record<string, number>; tepe: Record<string, number>; tasan: Record<string, number> }

async function measure(etiket: string) {
  const names = arg('--ad')?.split(',') ?? auditNames();
  const OUT = `${ROOT}/${etiket}`;
  mkdirSync(OUT, { recursive: true });
  const server = await createServer({ server: { port: 0, host: '127.0.0.1', watch: { ignored: ['**/gorsel-dokum/**', '**/harita/*/gorsel/**', '**/harita/*/onizleme/**'] } }, logLevel: 'error',
    optimizeDeps: { entries: ['scripts/rozet-cerceve-sayfa.tsx'] } });
  await server.listen();
  const base = server.resolvedUrls!.local[0]!;
  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const ctx = await browser.newContext({ viewport: { width: 2400, height: 2400 }, reducedMotion: 'reduce', deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.setDefaultTimeout(300_000);
  page.on('pageerror', (e) => console.error('sayfa hatası:', String(e).split('\n')[0]));
  await page.addInitScript(() => { try { localStorage.setItem('rpg-battle-effects', 'off'); localStorage.setItem('rpg-battle-acilis', 'off'); } catch { /* yok */ } });
  await page.route(`${base}__rozet-cerceve.html`, (r) => r.fulfill({ contentType: 'text/html', body: `<!doctype html><html><head><meta charset="utf-8">
<script type="module">import R from '/@react-refresh'; R.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => (t) => t; window.__vite_plugin_react_preamble_installed__ = true;</script>
<script type="module" src="/@vite/client"></script></head><body style="margin:0;background:transparent"><div id="root"></div>
<script type="module" src="/scripts/rozet-cerceve-sayfa.tsx"></script></body></html>` }));
  await page.goto(`${base}__rozet-cerceve.html`);
  await page.waitForFunction(() => !!(window as unknown as { __rc?: unknown }).__rc || !!(window as unknown as { __rcHata?: string }).__rcHata);
  const err = await page.evaluate(() => (window as unknown as { __rcHata?: string }).__rcHata);
  if (err) throw new Error(err);
  const J = <T>(fn: string, ...args: unknown[]) => page.evaluate(([f, a]) => ((window as unknown as { __rc: Record<string, (...x: unknown[]) => unknown> }).__rc[f as string]!)(...(a as unknown[])), [fn, args] as const) as Promise<T>;
  const cells = await J<Array<{ key: string; name: string; label: string; avatar: unknown }>>('cells', names);
  console.log(`jeton ${names.length}, görünüş ${cells.length}`);
  const out: CellOut[] = cells.map((c) => ({ key: c.key, name: c.name, label: c.label, kesilen: {}, boy: {}, tepe: {}, tasan: {} }));
  const raw = async (buf: Buffer) => { const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { data, w: info.width, h: info.height }; };
  for (const V of VIEWS) {
    const tag = `${V.view}-${V.size}`;
    const shots: Record<string, { data: Buffer; w: number; h: number }> = {};
    for (const clip of [true, false]) {
      const size = await J<{ w: number; h: number }>('draw', cells, V.view, V.size, V.cols, clip);
      shots[clip ? 'k' : 's'] = await raw(await page.screenshot({ clip: { x: 0, y: 0, width: size.w, height: size.h }, omitBackground: true, fullPage: true }));
    }
    const K = shots.k!, S = shots.s!;
    const cw = cellW(V.view, V.size);
    const red = Buffer.from(K.data);
    cells.forEach((_c, i) => {
      const x0 = (i % V.cols) * cw, y0 = Math.floor(i / V.cols) * cw;
      let lost = 0, out1 = 0, ymin = Infinity, ymax = -1;
      const b0 = (cw - V.size) / 2, b1 = b0 + V.size;
      for (let y = y0; y < y0 + cw; y++) for (let x = x0; x < x0 + cw; x++) {
        const o = (y * K.w + x) * 4 + 3;
        const k = K.data[o]! > ESIK, s = S.data[o]! > ESIK;
        if (k) { ymin = Math.min(ymin, y - y0); ymax = Math.max(ymax, y - y0); }
        // Rozet kutusunun (boy × boy) dışına taşan opak piksel (kanat ve taç dahil).
        if (k && V.view === 'rozet' && (x - x0 < b0 || x - x0 >= b1 || y - y0 < b0 || y - y0 >= b1)) out1++;
        if (s && !k) { lost++; red[o - 3] = 255; red[o - 2] = 0; red[o - 1] = 0; red[o] = 255; }
      }
      out[i]!.kesilen[tag] = lost;
      if (V.view === 'rozet') { out[i]!.tasan[tag] = out1; out[i]!.boy[tag] = ymax >= 0 ? ymax - ymin + 1 : 0; out[i]!.tepe[tag] = ymax >= 0 ? ymin - (cw - V.size) / 2 : 0; }
    });
    await sharp(red, { raw: { width: K.w, height: K.h, channels: 4 } }).png().toFile(`${OUT}/${tag}.png`);
    console.log(`${tag}: kesilen toplam ${out.reduce((n, c) => n + c.kesilen[tag]!, 0)}, ≥ 1 px kesilen görünüş ${out.filter((c) => c.kesilen[tag]! > 0).length}`);
  }
  writeFileSync(`${OUT}/olcum.json`, JSON.stringify({ views: VIEWS, cells: out }, null, 1));
  await browser.close();
  await server.close();
}

/**
 * İki etiketin kontak sayfası: satır = görünüş; sütunlar görünüm başına önce | sonra (kesilen kırmızı). Rozet karoları büyütülür
 * (en yakın komşu) ve rozetin dış çerçevesi (gri) ile görsel dairesi (ince) çizilir. `kontak-ozet.png`: jeton başına en çok kesilen
 * görünüş (69 satır); `kontak-<n>.png`: bütün görünüşler.
 */
async function compare(a: string, b: string) {
  const A = JSON.parse(readFileSync(`${ROOT}/${a}/olcum.json`, 'utf8')) as { cells: CellOut[] };
  const B = JSON.parse(readFileSync(`${ROOT}/${b}/olcum.json`, 'utf8')) as { cells: CellOut[] };
  const LBL = 250, T = 200, GAP = 12, PER = 40;
  const tile = async (et: string, V: (typeof VIEWS)[number], i: number) => {
    const cw = cellW(V.view, V.size), x = (i % V.cols) * cw, y = Math.floor(i / V.cols) * cw;
    // Rozet: rozet kutusu + %25 pay; jeton: hücre; figür: figürün çevresi.
    const side = V.view === 'rozet' ? Math.round(V.size * 1.5) : cw;
    const off = Math.round((cw - side) / 2);
    const img = await sharp(`${ROOT}/${et}/${V.view}-${V.size}.png`).extract({ left: x + off, top: y + off, width: side, height: side })
      .resize(T, T, { kernel: V.view === 'rozet' ? 'nearest' : 'lanczos3' }).toBuffer();
    const k = T / side, c = T / 2;
    const ring = V.view === 'rozet'
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="${T}" height="${T}"><circle cx="${c}" cy="${c}" r="${(V.size / 2 - 1.5) * k}" fill="#46525c" stroke="#8a96a0" stroke-width="${3 * k}"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="${T}" height="${T}"><rect width="${T}" height="${T}" fill="#3a434b"/></svg>`;
    return sharp(Buffer.from(ring)).composite([{ input: img, left: 0, top: 0 }]).png().toBuffer();
  };
  const W = LBL + VIEWS.length * (2 * T + GAP);
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const sheet = async (rows: number[], file: string) => {
    const comps: sharp.OverlayOptions[] = [];
    const H = 40 + rows.length * (T + 8);
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#232a30"/>`;
    VIEWS.forEach((V, vi) => { svg += `<text x="${LBL + vi * (2 * T + GAP) + 4}" y="26" fill="#fff" font-family="sans-serif" font-size="17">${V.view} ${V.size}: önce | sonra</text>`; });
    for (const [r, i] of rows.entries()) {
      const c = A.cells[i]!, bi = B.cells.findIndex((q) => q.key === c.key), y = 40 + r * (T + 8);
      const k = VIEWS.map((V) => `${V.size}: ${c.kesilen[`${V.view}-${V.size}`]}→${bi >= 0 ? B.cells[bi]!.kesilen[`${V.view}-${V.size}`] : '?'}`);
      svg += `<text x="6" y="${y + 22}" fill="#fff" font-family="sans-serif" font-size="14">${esc(c.name)}</text><text x="6" y="${y + 42}" fill="#bbb" font-family="sans-serif" font-size="12">${esc(c.label)}</text>`;
      svg += `<text x="6" y="${y + 66}" fill="#f88" font-family="sans-serif" font-size="12">kesilen px (önce→sonra)</text>`;
      k.forEach((t, j) => { svg += `<text x="12" y="${y + 84 + j * 16}" fill="#f88" font-family="sans-serif" font-size="12">${esc(t)}</text>`; });
      if (c.boy['rozet-84']) svg += `<text x="6" y="${y + 160}" fill="#9cf" font-family="sans-serif" font-size="12">figür boyu 84: ${c.boy['rozet-84']}→${bi >= 0 ? B.cells[bi]!.boy['rozet-84'] : '?'} px</text>`;
      for (const [vi, V] of VIEWS.entries()) {
        const x = LBL + vi * (2 * T + GAP);
        comps.push({ input: await tile(a, V, i), left: x, top: y });
        if (bi >= 0) comps.push({ input: await tile(b, V, bi), left: x + T, top: y });
      }
    }
    svg += '</svg>';
    await sharp(Buffer.from(svg)).composite(comps).png().toFile(`${ROOT}/${file}`);
  };
  // Jeton başına en çok kesilen görünüş.
  const worst = new Map<string, number>();
  A.cells.forEach((c, i) => { const w = worst.get(c.name); if (w === undefined || c.kesilen['rozet-84']! > A.cells[w]!.kesilen['rozet-84']!) worst.set(c.name, i); });
  const wl = [...worst.values()];
  for (let p = 0; p * PER < wl.length; p++) await sheet(wl.slice(p * PER, p * PER + PER), `kontak-ozet-${p + 1}.png`);
  const all = A.cells.map((_c, i) => i);
  for (let p = 0; p * PER < all.length; p++) await sheet(all.slice(p * PER, p * PER + PER), `kontak-${p + 1}.png`);
  const sum = (C: CellOut[], t: string) => ({ toplam: C.reduce((n, c) => n + (c.kesilen[t] ?? 0), 0), gorunus: C.filter((c) => (c.kesilen[t] ?? 0) > 0).length, en: Math.max(...C.map((c) => c.kesilen[t] ?? 0)) });
  const ozet = Object.fromEntries(VIEWS.map((V) => { const t = `${V.view}-${V.size}`; return [t, { [a]: sum(A.cells, t), [b]: sum(B.cells, t) }]; }));
  writeFileSync(`${ROOT}/ozet.json`, JSON.stringify(ozet, null, 1));
  console.log(JSON.stringify(ozet));
}

const cmp = arg('--karsilastir');
if (cmp) { const [a, b] = cmp.split(','); await compare(a!, b!); } else await measure(arg('--etiket') ?? 'once');
