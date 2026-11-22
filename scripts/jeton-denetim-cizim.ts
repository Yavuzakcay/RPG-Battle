/**
 * JETON-DENETIM çizim sürücüsü (yalnız okur; jeton/maske/veri değişmez). Oyunun kendi çözücü ve bileşenleriyle
 * (`scripts/jeton-denetim-sayfa.tsx`, Vite + Playwright Chromium) çizer ve `gorsel-dokum/jeton-denetim/` altına döker (git dışı):
 *   veri/kombinasyonlar.json   bütün görünüşler (sınıf × satır × ırk/soy/ton/uyanış × cinsiyet → jeton, boya, görünüm)
 *   veri/human-yollari.json    Human kültür/Sürgün yolları → ten tonu
 *   boya/<anahtar>.png         `tintedUrl` çıktısı (boyalı jeton, 256 px; maskeli boya başarısızsa yok) + veri/boya.json (maske, yedek filtre)
 *   cizim/jeton-<n>.png        savaş jetonu ızgarası (TokenFigure, kanatsız; filtre, oran, yedek filtre, taç dahil) + veri/jeton.json (hücre sırası)
 *   cizim/rozet-<n>-{kirp,serbest}.png  LookFrame + AvatarBadge 84 px, kırpmalı ve kırpmasız + veri/rozet.json
 *   cizim/kanat-<n>.png        uçarken açık kanatlı savaş jetonu (kanat slotu × soy başına örnekler) + veri/kanat.json
 * Çalıştırma: `npx vite-node scripts/jeton-denetim-cizim.ts` (ya da `python scripts/jeton-denetim.py --ciz`). Analiz: `scripts/jeton-denetim.py`.
 */
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = 'gorsel-dokum/jeton-denetim';
const argv = process.argv.slice(2);
const ONLY = argv.includes('--yalniz') ? argv[argv.indexOf('--yalniz') + 1]!.split(',') : null; // boya,jeton,rozet,kanat
const want = (k: string) => !ONLY || ONLY.includes(k);
for (const d of ['veri', 'boya', 'cizim']) mkdirSync(`${OUT}/${d}`, { recursive: true });
const h = (s: string) => createHash('sha1').update(s).digest('hex').slice(0, 12);
const t0 = Date.now();
const log = (...a: unknown[]) => console.log(`[${((Date.now() - t0) / 1000).toFixed(0)} sn]`, ...a);

interface Look { filter: string; sx: number; sy: number; hideHalo: boolean; wing: { id: string; src: string; filtre: string; palet: unknown; ayna: boolean } | null; crown: unknown; mirror: boolean }
interface Combo { id: string; cls: string; row: string; kind: string; subId?: string; race: string; variant: string; gender: string; level: number;
  avatar: { src: string; tint?: unknown; look?: Record<string, unknown>; fallbacks?: string[] }; look: Look | null; lookFly: Look | null }

async function main() {
  const server = await createServer({ server: { port: 0, host: '127.0.0.1', watch: { ignored: ['**/gorsel-dokum/**', '**/harita/*/gorsel/**', '**/harita/*/onizleme/**'] } }, logLevel: 'error',
    optimizeDeps: { entries: ['scripts/jeton-denetim-sayfa.tsx'] } });
  await server.listen();
  const base = server.resolvedUrls!.local[0]!;
  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const ctx = await browser.newContext({ viewport: { width: 2100, height: 2100 }, reducedMotion: 'reduce', deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.setDefaultTimeout(600_000);
  page.on('pageerror', (e) => console.error('sayfa hatası:', String(e).split('\n')[0]));
  await page.addInitScript(() => { try { localStorage.setItem('rpg-battle-effects', 'off'); localStorage.setItem('rpg-battle-acilis', 'off'); } catch { /* yok */ } });
  // Vite HTML dönüşümü olmadan: React yenileme ön yüklemesi elle (eklenti modülleri bunu bekler).
  await page.route(`${base}__jeton-denetim.html`, (r) => r.fulfill({ contentType: 'text/html', body: `<!doctype html><html><head><meta charset="utf-8">
<script type="module">import R from '/@react-refresh'; R.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => (t) => t; window.__vite_plugin_react_preamble_installed__ = true;</script>
<script type="module" src="/@vite/client"></script></head><body style="margin:0;background:transparent"><div id="root"></div>
<script type="module" src="/scripts/jeton-denetim-sayfa.tsx"></script></body></html>` }));
  await page.goto(`${base}__jeton-denetim.html`);
  await page.waitForFunction(() => !!(window as unknown as { __jd?: unknown }).__jd || !!(window as unknown as { __jdHata?: string }).__jdHata);
  const err = await page.evaluate(() => (window as unknown as { __jdHata?: string }).__jdHata);
  if (err) throw new Error(err);
  const J = <T>(fn: string, ...args: unknown[]) => page.evaluate(([f, a]) => ((window as unknown as { __jd: Record<string, (...x: unknown[]) => unknown> }).__jd[f as string]!)(...(a as unknown[])), [fn, args] as const) as Promise<T>;

  const combos = await J<Combo[]>('combos');
  writeFileSync(`${OUT}/veri/kombinasyonlar.json`, JSON.stringify(combos));
  writeFileSync(`${OUT}/veri/human-yollari.json`, JSON.stringify(await J('humanPaths'), null, 1));
  log(`kombinasyon: ${combos.length}`);

  // 1) Boya: benzersiz (jeton, boya) → tintedUrl çıktısı.
  if (want('boya')) {
    const tints = new Map<string, Combo>();
    for (const c of combos) if (c.avatar.tint) { const k = h(c.avatar.src + JSON.stringify(c.avatar.tint)); if (!tints.has(k)) tints.set(k, c); }
    const meta: Record<string, { src: string; tint: unknown; mask: string | null; fb: string; png: boolean }> = {};
    const list = [...tints.entries()];
    for (let i = 0; i < list.length; i += 24) {
      const part = list.slice(i, i + 24);
      const res = await Promise.all(part.map(([, c]) => J<{ png: string | null; mask: string | null; fb: string }>('tint', c.avatar.src, c.avatar.tint, c.avatar.look)));
      part.forEach(([k, c], j) => {
        const r = res[j]!;
        if (r.png) writeFileSync(`${OUT}/boya/${k}.png`, Buffer.from(r.png, 'base64'));
        meta[k] = { src: c.avatar.src, tint: c.avatar.tint, mask: r.mask, fb: r.fb, png: !!r.png };
      });
      if (i % 480 === 0) log(`boya ${i}/${list.length}`);
    }
    writeFileSync(`${OUT}/veri/boya.json`, JSON.stringify(meta));
    log(`boya: ${list.length}`);
  }

  type Cell = { key: string; view: 'jeton' | 'jeton-kanat' | 'rozet'; avatar: Combo['avatar'] };
  async function shots(prefix: string, cells: Cell[], cols: number, per: number, clipBoth: boolean) {
    const index: Array<{ shot: number; i: number; key: string }> = [];
    for (let s = 0, n = 0; s < cells.length; s += per, n++) {
      const part = cells.slice(s, s + per);
      for (const pass of clipBoth ? ['kirp', 'serbest'] : ['']) {
        const size = await J<{ w: number; h: number }>('draw', part, cols, pass !== 'serbest');
        await page.screenshot({ path: `${OUT}/cizim/${prefix}-${n}${pass ? `-${pass}` : ''}.png`, clip: { x: 0, y: 0, width: size.w, height: size.h }, omitBackground: true });
      }
      part.forEach((c, i) => index.push({ shot: n, i, key: c.key }));
      if (n % 10 === 0) log(`${prefix} ${s}/${cells.length}`);
    }
    return index;
  }

  // 2) Savaş jetonu (kanatsız): benzersiz (jeton, boya, görünüm filtresi/oran/taç).
  if (want('jeton')) {
    const seen = new Map<string, Cell>();
    for (const c of combos) {
      const k = h(c.avatar.src + JSON.stringify(c.avatar.tint ?? null) + JSON.stringify(c.look ? { f: c.look.filter, sx: c.look.sx, sy: c.look.sy, cr: c.look.crown, lin: c.avatar.look?.lineageId ?? null, r: c.avatar.look?.raceId ?? null } : null));
      if (!seen.has(k)) seen.set(k, { key: k, view: 'jeton', avatar: c.avatar });
    }
    const index = await shots('jeton', [...seen.values()], 8, 64, false);
    writeFileSync(`${OUT}/veri/jeton.json`, JSON.stringify({ cols: 8, cell: 256, index, cells: Object.fromEntries([...seen.entries()].map(([k, c]) => [k, c.avatar])) }));
    log(`jeton: ${seen.size}`);
  }

  // 3) Rozet kırpması: benzersiz (jeton, oran, hale, taç, iç kanat); boya kırpmayı değiştirmez (boyasız çizilir).
  if (want('rozet')) {
    const seen = new Map<string, Cell>();
    for (const c of combos) {
      const k = h(c.avatar.src + JSON.stringify(c.look ? { sx: c.look.sx, sy: c.look.sy, hh: c.look.hideHalo, cr: c.look.crown, w: c.look.wing?.ayna ? c.look.wing.id : null } : null) + JSON.stringify(c.avatar.look ?? null));
      if (!seen.has(k)) seen.set(k, { key: k, view: 'rozet', avatar: c.avatar });
    }
    const index = await shots('rozet', [...seen.values()], 12, 144, true);
    writeFileSync(`${OUT}/veri/rozet.json`, JSON.stringify({ cols: 12, cell: 164, pad: 40, size: 84, index, cells: Object.fromEntries([...seen.entries()].map(([k, c]) => [k, c.avatar])) }));
    log(`rozet: ${seen.size}`);
  }

  // 4) Kanat: uçarken açık kanat; kanat (slot, dosya, palet/filtre) başına sınıf başına bir jeton.
  if (want('kanat')) {
    const seen = new Map<string, Cell>();
    const perWing = new Map<string, Set<string>>();
    for (const c of combos) {
      const w = c.lookFly?.wing;
      if (!w) continue;
      const wk = JSON.stringify(w);
      const s = perWing.get(wk) ?? new Set<string>();
      perWing.set(wk, s);
      if (s.has(c.cls)) continue;
      s.add(c.cls);
      const k = h(c.avatar.src + JSON.stringify(c.avatar.tint ?? null) + wk);
      if (!seen.has(k)) seen.set(k, { key: k, view: 'jeton-kanat', avatar: c.avatar });
    }
    const index = await shots('kanat', [...seen.values()], 8, 64, false);
    writeFileSync(`${OUT}/veri/kanat.json`, JSON.stringify({ cols: 8, cell: 256, index, cells: Object.fromEntries([...seen.entries()].map(([k, c]) => [k, c.avatar])) }));
    log(`kanat: ${seen.size}`);
  }
  await browser.close();
  await server.close();
  log('bitti');
}
main().catch((e) => { console.error(e); process.exit(1); });
