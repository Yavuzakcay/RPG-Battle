/**
 * Görsel döküm (test turu öncesi; yalnız araç + rapor, oyun kodu/veri değişmez): oyuncunun arayüzde ulaşabildiği bütün karakter
 * görünüşlerini oyunun gerçek bileşenleriyle (src/preview/gorselDokum.tsx, /onizleme-dokum.html) gerçek tarayıcıda (Chromium,
 * Playwright; check:harita altyapısı) çizer, sayfa sayfa PNG'ye alır ve otomatik kusur taraması yapar.
 *
 * Çalıştırma: `npm run gorsel-dokum` (önce bir kez `npx playwright install chromium`; tarayıcı yolu `PW_CHROMIUM`).
 *   --grup a,b     yalnız bu gruplar (sınıf kimlikleri, ozel, kanat, durum, ek)
 *   --tarama       yalnız tarama (ekran görüntüsü yok)
 *   --rapor-yok    harita/belgeler/GORSEL-DOKUM.md yazılmaz
 *   --devam        önceki çalıştırmanın grup kayıtları (gorsel-dokum/ham/<grup>.json) olan grupları atla, kalanları çalıştır
 *   --yeniden      tarayıcı açmadan grup kayıtlarından index, CSV ve raporu yeniden üret
 * Çıktı: gorsel-dokum/ (git dışı): index.html, <bölüm>/<sayfa>.png (+ kucuk/ önizleme), ham/ (grup kayıtları), veri.json, kusurlar.csv.
 * Sayfa içi işler ilerleme sayacıyla izlenir; 5 dk ilerlemeyen grup bir kez yeniden denenir (makine yüklüyken yavaşlık kusur sayılmaz).
 * Rapor: harita/belgeler/GORSEL-DOKUM.md (sayılar bu çalıştırmadan; elle yazılmaz).
 */
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { createServer } from 'vite';
import sharp from 'sharp';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import gorunum from '../data/alt-soy-gorunum.json';

/** Boyasız orijinal jetonla gelen soylar (`alt-soy-gorunum.json` `orijinal`): aynı görünmeleri tasarım gereği. */
const ORIJINAL = new Set((gorunum as unknown as { orijinal: string[] }).orijinal);

interface PageMeta { id: string; grup: string; bolum: 'sinif' | 'ozel' | 'durum' | 'ek'; baslik: string; aciklama: string; adet: number }
interface Kusur { kod: string; combo: string; grup: string; anahtar: string; ayrinti: string }
interface Tarama { id: string; grup: string; src: string | null; code: string; chainIdx: number; tinted: boolean; changed: number; wing: string | null; srcHash: string | null; renderKey: string; kusurlar: string[]; thumbDiff: number; thumb: string | null }
declare global { interface Window { __dokum?: { meta(): { pages: PageMeta[]; zemin: string; altSinifSeviye: number }; scan(g: string): Promise<{ taramalar: Tarama[]; kusurlar: Kusur[] }>; show(id: string): Promise<{ adet: number; durdu: boolean }> }; __dokumHata?: string } }

const argv = process.argv.slice(2);
const opt = (k: string) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
const ONLY = opt('--grup')?.split(',').filter(Boolean);
const SCAN_ONLY = argv.includes('--tarama');
const NO_REPORT = argv.includes('--rapor-yok');
const REUSE = argv.includes('--yeniden');
const RESUME = argv.includes('--devam');
/** Sayfa içi iş bu kadar süre ilerlemezse takıldı sayılır (grup bir kez yeniden denenir). */
const STALL_MS = 300_000;
const OUT = 'gorsel-dokum';
const REPORT = 'harita/belgeler/GORSEL-DOKUM.md';
const MAX_PX = 16000;
const TIMEOUT = 600_000;

/** Kusur kodları: önem sırası ve açıklama (rapor + index). `bilgi`: kusur sayılmaz. */
const KODLAR: Record<string, { sira: number; ad: string; bilgi?: true }> = {
  'yer-tutucu': { sira: 1, ad: 'Görsel hiç yüklenmedi (baş harfli yer tutucu)' },
  'jeton-404': { sira: 2, ad: 'Jeton 404, yedek zincirdeki görsele düştü' },
  'maske-eksik': { sira: 3, ad: 'Maskeli soy boyasının maskesi yok (jeton boyasız)' },
  'boya-basarisiz': { sira: 4, ad: 'Boyama başarısız (tintedUrl null)' },
  'kanat-dosya-null': { sira: 5, ad: 'Kanatlı olmalı ama kanat slotu dosya: null' },
  'kanat-404': { sira: 6, ad: 'Kanat görseli 404' },
  'kanat-slot-yok': { sira: 7, ad: 'Görünüm verisindeki kanat slotu kanat-esleme.json\'da yok' },
  'bos-seffaf': { sira: 8, ad: 'Çizilen görsel boş/şeffaf' },
  'alt-sinif-jeton-eksik': { sira: 9, ad: 'Alt sınıf hücresi var, bu ırk × cinsiyet jetonu yok (yedeğe düşer)' },
  'gariban-eksik': { sira: 10, ad: 'Gariban jetonu yok (sınıf-genel jeton)' },
  'kucuk-404': { sira: 11, ad: 'Rozet küçük kopyası (characters/kucuk/) yok' },
  'bas-404': { sira: 12, ad: 'Kafa kaplaması görseli yok' },
  'boya-etkisiz': { sira: 13, ad: 'Soy boyası hiçbir pikseli değiştirmedi' },
  'kucuk-farkli': { sira: 13.5, ad: 'Rozet küçük kopyası asıl jetondan belirgin farklı (eski kopya)' },
  'portre-cercevesiz': { sira: 13.7, ad: 'Karakter sayfası portresi soy görünümünü (filtre/oran/kanat) çizmiyor' },
  'ayni-gorsel-farkli-dosya': { sira: 14, ad: 'Farklı dosya adları, piksel piksel aynı görsel' },
  'cinsiyet-yedek': { sira: 15, ad: 'Cinsiyet kısıtlı alt sınıf, cinsiyet sonradan değişince yedek jeton' },
  'ayni-jeton-farkli-alt-sinif': { sira: 16, ad: 'Farklı alt sınıf kimlikleri aynı jetona düşüyor', bilgi: true },
  'alt-sinif-jetonsuz': { sira: 17, ad: 'Alt sınıf jeton tablosunda yok (sınıf-genel/Gariban jeton)', bilgi: true },
  'ayirt-edilemez-soy': { sira: 18, ad: 'Farklı soy/uyanış seçimleri aynı görünüşü veriyor', bilgi: true },
  'yedek-filtre': { sira: 19, ad: 'Maske yok: soy rengi yedek CSS filtresiyle (data/soy-filtre-yedek.json)', bilgi: true },
  'tensiz-jeton': { sira: 20, ad: 'Maske bilerek boş: jetonda çıplak ten yok (ten tonu görünmez)', bilgi: true },
};

/* ---------- Toplama (tarayıcı) ya da önceki ham veri ---------- */
interface Shot { id: string; file: string; thumb: string; w: number; h: number; durdu: boolean; kesik: boolean }
interface Ham { tarih: string; commit: string; sure: string; meta: { pages: PageMeta[]; zemin: string; altSinifSeviye: number }; groups: string[]; taramalar: Tarama[]; kusurlar: Kusur[]; shots: Shot[]; pageErrors: string[] }
const t0 = Date.now();
const sec = () => `${((Date.now() - t0) / 1000).toFixed(0)} sn`;

async function collect(): Promise<Ham> {
  const server = await createServer({
    // Çıktı klasörü (büyük PNG'ler) izlenmez.
    server: { port: 0, host: '127.0.0.1', watch: { ignored: [`**/${OUT}/**`, '**/harita/*/gorsel/**', '**/harita/*/onizleme/**', '**/assets-ham/**'] } }, logLevel: 'error',
    optimizeDeps: { entries: ['onizleme-dokum.html', 'src/preview/gorselDokum.tsx'] },
  });
  await server.listen();
  const base = server.resolvedUrls!.local[0]!;
  const browser: Browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  async function open(): Promise<{ ctx: BrowserContext; page: Page; errors: string[] }> {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, reducedMotion: 'reduce', deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.setDefaultTimeout(TIMEOUT);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e).split(/\r?\n/)[0]!));
    // Efekt ve açılış kapalı (bu sayfa ikisini de yüklemez; ayarlar oyun gibi).
    await page.addInitScript(() => { try { localStorage.setItem('rpg-battle-effects', 'off'); localStorage.setItem('rpg-battle-acilis', 'off'); } catch { /* yok */ } });
    await page.goto(`${base}onizleme-dokum.html`);
    await page.waitForFunction(() => !!window.__dokum || !!window.__dokumHata, null, { timeout: TIMEOUT });
    const err = await page.evaluate(() => window.__dokumHata);
    if (err) throw new Error(`döküm sayfası açılmadı: ${err}`);
    return { ctx, page, errors };
  }
  let meta: Ham['meta'];
  {
    const { ctx, page } = await open();
    meta = await page.evaluate(() => window.__dokum!.meta());
    await ctx.close();
  }
  const groups = [...new Set(meta.pages.map((p) => p.grup))].filter((g) => !ONLY || ONLY.includes(g));
  console.log(`döküm: ${meta.pages.length} sayfa, ${groups.length} grup (${groups.join(', ')})${RESUME ? ' · --devam: kaydı olan gruplar atlanır' : ''}`);
  if (!ONLY && !SCAN_ONLY && !RESUME && existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
  mkdirSync(`${OUT}/kucuk`, { recursive: true });
  mkdirSync(`${OUT}/ham`, { recursive: true });
  // Kayıtta BÜTÜN gruplar (`--grup` ile tek grup yenilense de): `--yeniden` öteki grupların eski kayıtlarıyla tam raporu üretir.
  const allGroups = [...new Set(meta.pages.map((p) => p.grup))];
  writeFileSync(`${OUT}/ham/_meta.json`, JSON.stringify({ tarih: new Date().toISOString(), commit: git('git rev-parse --short HEAD'), meta, groups: allGroups }));

  type IsDurum = { ok?: unknown; hata?: string };
  /** Sayfa içi işi başlatır ve ilerlemeyi izler: `STALL_MS` boyunca ilerleme yoksa takıldı sayılır (grup yeniden denenir). */
  async function watched<T>(page: Page, label: string, start: (pg: Page) => Promise<void>): Promise<T> {
    await page.evaluate(() => { (window as unknown as { __is?: IsDurum }).__is = undefined; });
    await start(page);
    let lastT = 0, lastChange = Date.now(), lastLog = Date.now();
    for (;;) {
      await new Promise((r) => setTimeout(r, 2000));
      const st = await page.evaluate(() => ({ is: (window as unknown as { __is?: IsDurum }).__is, p: window.__dokumIlerleme }));
      if (st.is?.hata) throw new Error(`${label}: ${st.is.hata}`);
      if (st.is && 'ok' in st.is) return st.is.ok as T;
      const t = st.p?.t ?? 0;
      if (t !== lastT) { lastT = t; lastChange = Date.now(); }
      if (Date.now() - lastLog > 60_000) { lastLog = Date.now(); console.log(`      … ${label}: ${st.p?.faz ?? '?'} ${st.p?.yapilan ?? 0}/${st.p?.toplam ?? 0} (${sec()})`); }
      if (Date.now() - lastChange > STALL_MS) throw new Error(`${label}: ${STALL_MS / 1000} sn ilerleme yok (${st.p?.faz ?? '?'} ${st.p?.yapilan ?? 0}/${st.p?.toplam ?? 0})`);
    }
  }
  type Parca = { taramalar: Tarama[]; kusurlar: Kusur[]; shots: Shot[]; pageErrors: string[] };
  async function runGroup(g: string): Promise<Parca> {
    const { ctx, page, errors } = await open();
    const part: Parca = { taramalar: [], kusurlar: [], shots: [], pageErrors: [] };
    try {
      const r = await watched<{ taramalar: Tarama[]; kusurlar: Kusur[] }>(page, `tarama ${g}`, (pg) => pg.evaluate((gg) => {
        const w = window as unknown as { __is?: IsDurum };
        void window.__dokum!.scan(gg).then((ok) => { w.__is = { ok }; }, (e) => { w.__is = { hata: String(e) }; });
      }, g));
      part.taramalar.push(...r.taramalar);
      part.kusurlar.push(...r.kusurlar);
      console.log(`  ${g}: ${r.taramalar.length} görünüş tarandı, ${r.kusurlar.filter((k) => !KODLAR[k.kod]?.bilgi).length} kusur (${sec()})`);
      if (!SCAN_ONLY) {
        for (const p of meta.pages.filter((x) => x.grup === g)) {
          await page.setViewportSize({ width: 1600, height: 1000 });
          const res = await watched<{ adet: number; durdu: boolean }>(page, p.id, (pg) => pg.evaluate((id) => {
            const w = window as unknown as { __is?: IsDurum };
            void window.__dokum!.show(id).then((ok) => { w.__is = { ok }; }, (e) => { w.__is = { hata: String(e) }; });
          }, p.id));
          const box = (await page.locator('#sayfa').boundingBox())!;
          const w = Math.ceil(box.width), h = Math.ceil(box.height);
          const kesik = w > MAX_PX || h > MAX_PX;
          await page.setViewportSize({ width: Math.min(MAX_PX, Math.max(w, 400)), height: Math.min(MAX_PX, Math.max(h, 300)) });
          await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
          const dir = `${OUT}/${p.bolum}`;
          mkdirSync(dir, { recursive: true });
          const file = `${dir}/${p.id}.png`;
          await page.screenshot({ path: file, clip: { x: 0, y: 0, width: Math.min(w, MAX_PX), height: Math.min(h, MAX_PX) } });
          const thumb = `${OUT}/kucuk/${p.id}.jpg`;
          await sharp(file, { limitInputPixels: false }).resize({ width: 640, withoutEnlargement: true }).jpeg({ quality: 78 }).toFile(thumb);
          part.shots.push({ id: p.id, file: file.slice(OUT.length + 1), thumb: thumb.slice(OUT.length + 1), w, h, durdu: res.durdu, kesik });
          console.log(`    ${p.id}: ${res.adet} hücre, ${w}×${h}${res.durdu ? '' : ' (DURULMADI)'}${kesik ? ' (KESİK)' : ''}`);
        }
      }
    } finally {
      part.pageErrors.push(...errors.map((e) => `${g}: ${e}`));
      await ctx.close().catch(() => undefined);
    }
    return part;
  }
  for (const g of groups) {
    const file = `${OUT}/ham/${g}.json`;
    if (RESUME && existsSync(file)) { console.log(`  ${g}: önceki kayıttan`); continue; }
    let part: Parca | null = null;
    for (let deneme = 1; deneme <= 2 && !part; deneme++) {
      try { part = await runGroup(g); } catch (e) { console.log(`  ${g}: deneme ${deneme} başarısız: ${String((e as Error)?.message ?? e).split(/\r?\n/)[0]}`); }
    }
    part ??= { taramalar: [], kusurlar: [], shots: [], pageErrors: [`${g}: iki denemede de tamamlanmadı`] };
    writeFileSync(file, JSON.stringify(part));
  }
  await browser.close();
  await server.close();
  return assemble();
}
/** Grup kayıtlarından (gorsel-dokum/ham/) tek ham veri. */
function assemble(): Ham {
  const m = JSON.parse(readFileSync(`${OUT}/ham/_meta.json`, 'utf8')) as { tarih: string; commit: string; meta: Ham['meta']; groups: string[] };
  const have = (g: string) => existsSync(`${OUT}/ham/${g}.json`);
  const parts = m.groups.filter(have).map((g) => JSON.parse(readFileSync(`${OUT}/ham/${g}.json`, 'utf8')) as { taramalar: Tarama[]; kusurlar: Kusur[]; shots: Shot[]; pageErrors: string[] });
  return { tarih: m.tarih, commit: m.commit, sure: REUSE ? '(yeniden üretim)' : sec(), meta: m.meta, groups: m.groups,
    taramalar: parts.flatMap((p) => p.taramalar), kusurlar: parts.flatMap((p) => p.kusurlar), shots: parts.flatMap((p) => p.shots),
    pageErrors: [...parts.flatMap((p) => p.pageErrors), ...m.groups.filter((g) => !have(g)).map((g) => `${g}: kayıt yok`)] };
}
/** `--yeniden`: tarayıcı açılmaz; grup kayıtlarından (gorsel-dokum/ham/) index, CSV ve rapor yeniden üretilir. */
const ham: Ham = REUSE ? assemble() : await collect();
const { meta, groups, taramalar, kusurlar, shots, pageErrors } = ham;

/* ---------- Türetilmiş bulgular ---------- */
const derived: Kusur[] = [];
/** Küçük kopya farkı eşiği (ortalama kanal farkı, 0–255): lanczos küçültme ile tarayıcı küçültmesi arasındaki olağan fark bunun altında kalır. */
const THUMB_ESIK = Number(opt('--kucuk-esik') ?? 24);
{
  const seen = new Set<string>();
  for (const t of taramalar) if (t.thumb && t.thumbDiff > THUMB_ESIK && !seen.has(t.thumb)) {
    seen.add(t.thumb);
    derived.push({ kod: 'kucuk-farkli', combo: t.id, grup: t.grup, anahtar: t.thumb, ayrinti: `${t.thumb} asıl jetondan farklı (ortalama kanal farkı ${t.thumbDiff.toFixed(1)} > ${THUMB_ESIK}): ${t.src}` });
  }
}
// Farklı dosya, aynı piksel.
{
  const byHash = new Map<string, Set<string>>();
  for (const t of taramalar) if (t.src && t.srcHash) { const s = byHash.get(t.srcHash) ?? new Set(); s.add(t.src); byHash.set(t.srcHash, s); }
  for (const [h, set] of byHash) if (set.size > 1) {
    const list = [...set].sort();
    derived.push({ kod: 'ayni-gorsel-farkli-dosya', combo: list.join(' = '), grup: 'tumu', anahtar: h, ayrinti: list.join(' = ') });
  }
}
// Sınıf tablosu: kimliği `<sınıf>/<satır>/<ırk>/<soy>/<E|K>`.
const parse = (id: string) => { const [cls, row, race, variant, g] = id.split('/'); return { cls: cls!, row: row!, race: race!, variant: variant!, g: g! }; };
const classGroups = new Set(meta.pages.filter((p) => p.bolum === 'sinif').map((p) => p.grup));
const classScans = taramalar.filter((t) => classGroups.has(t.grup) && t.id.split('/').length === 5);
{
  // Aynı jetona düşen farklı alt sınıflar (aynı ırk/soy/cinsiyet; Gariban hariç).
  const cells = new Map<string, Map<string, string[]>>();
  for (const t of classScans) {
    const p = parse(t.id);
    if (p.row === 'GR' || p.row.includes('@') || !t.src) continue;
    const k = `${p.cls}|${p.race}/${p.variant}|${p.g}`;
    const m = cells.get(k) ?? new Map<string, string[]>();
    m.set(t.src, [...(m.get(t.src) ?? []), p.row]);
    cells.set(k, m);
  }
  const agg = new Map<string, { cls: string; rows: string[]; codes: Set<string>; n: number }>();
  for (const [k, m] of cells) for (const [src, rows] of m) if (rows.length > 1) {
    const cls = k.split('|')[0]!;
    const key = `${cls}|${rows.sort().join(',')}`;
    const a = agg.get(key) ?? { cls, rows, codes: new Set<string>(), n: 0 };
    a.codes.add(src.replace(/^.*\//, '').replace(/^[a-z]+-(?:erkek|kadin|male|female)-[a-z]+-?/, '').replace(/\.webp$/, '') || 'genel');
    a.n++;
    agg.set(key, a);
  }
  for (const a of agg.values()) derived.push({ kod: 'ayni-jeton-farkli-alt-sinif', combo: `${a.cls}: ${a.rows.join(', ')}`, grup: a.cls, anahtar: `${a.cls}|${a.rows.join(',')}`,
    ayrinti: `${a.cls}: ${a.rows.join(', ')} → aynı jeton (${[...a.codes].slice(0, 6).join(', ')}${a.codes.size > 6 ? '…' : ''}; ${a.n} ırk/soy × cinsiyet hücresinde)` });
  // Aynı görünüşü veren soylar (aynı sınıf/satır/cinsiyet, aynı ırk).
  const looks = new Map<string, Map<string, string[]>>();
  for (const t of classScans) {
    const p = parse(t.id);
    const k = `${p.cls}|${p.row}|${p.race}|${p.g}`;
    const m = looks.get(k) ?? new Map<string, string[]>();
    m.set(t.renderKey, [...(m.get(t.renderKey) ?? []), p.variant]);
    looks.set(k, m);
  }
  const lagg = new Map<string, { race: string; vs: string[]; n: number; rows: Set<string> }>();
  for (const [k, m] of looks) for (const vs of m.values()) if (vs.length > 1) {
    const [, row, race] = k.split('|');
    const key = `${race}|${vs.sort().join('≡')}`;
    const a = lagg.get(key) ?? { race: race!, vs, n: 0, rows: new Set<string>() };
    a.n++; a.rows.add(row === 'GR' ? 'Gariban' : 'alt sınıf');
    lagg.set(key, a);
  }
  for (const a of lagg.values()) {
    // Tasarım gereği: hepsi orijinal (boyasız) soy ya da yalnız Gariban satırında Celestial (uyanış 3. seviyeden).
    const tasarim = a.vs.every((v) => ORIJINAL.has(`${a.race}/${v}`)) || (a.race === 'celestial' && a.rows.size === 1 && a.rows.has('Gariban'));
    derived.push({ kod: 'ayirt-edilemez-soy', combo: `${a.race}: ${a.vs.join(' ≡ ')}`, grup: a.race, anahtar: `${a.race}|${a.vs.join('≡')}`,
      ayrinti: `${a.race}: ${a.vs.join(' ≡ ')} (${a.n} hücre grubunda; ${[...a.rows].join(', ')}) · ${tasarim ? 'tasarım gereği (orijinal soylar / uyanış seviye < 3)' : 'BEKLENMEYEN: boya uygulanmıyor (maske eksik ya da boya etkisiz)'}` });
  }
}
const all = [...kusurlar, ...derived];

/* ---------- Toplama ---------- */
const byCode = new Map<string, Kusur[]>();
for (const k of all) byCode.set(k.kod, [...(byCode.get(k.kod) ?? []), k]);
const codes = [...byCode.keys()].sort((a, b) => (KODLAR[a]?.sira ?? 99) - (KODLAR[b]?.sira ?? 99));
/** Aynı nedenli (anahtar) kayıtlar tek satırda: kaç görünüşü etkiliyor. */
const causes = (kod: string) => {
  const m = new Map<string, { k: Kusur; n: number }>();
  for (const k of byCode.get(kod) ?? []) { const e = m.get(k.anahtar); if (e) e.n++; else m.set(k.anahtar, { k, n: 1 }); }
  return [...m.values()].sort((a, b) => b.n - a.n || a.k.anahtar.localeCompare(b.k.anahtar));
};
const defects = codes.filter((c) => !KODLAR[c]?.bilgi);
const defectCauses = defects.flatMap((c) => causes(c).map((x) => ({ kod: c, ...x })));
const defectHits = all.filter((k) => !KODLAR[k.kod]?.bilgi);
const pagesIn = meta.pages.filter((p) => groups.includes(p.grup));
const sumBy = (f: (p: PageMeta) => boolean) => pagesIn.filter(f).reduce((n, p) => n + p.adet, 0);
const uniq = new Set(taramalar.map((t) => t.id)).size;
const classCombos = classScans.length;
const classAfter = classScans.filter((t) => t.kusurlar.includes('cinsiyet-yedek')).length;
const perClass = [...new Set(classScans.map((t) => t.grup))].map((g) => ({ g, n: classScans.filter((t) => t.grup === g).length }));
/** Alt sınıf (satır) ve sütun sayıları sınıf taramasının kimliklerinden (`<sınıf>/<satır>/<ırk>/<soy>/<E|K>`). */
const subRows = [...new Set(classScans.map((t) => t.id.split('/').slice(0, 2).join('/')).filter((r) => !r.endsWith('/GR') && !r.includes('@')))];
const formRows = [...new Set(classScans.map((t) => t.id.split('/').slice(0, 2).join('/')).filter((r) => r.includes('@')))];
const variantCols = [...new Set(classScans.map((t) => t.id.split('/').slice(2, 4).join('/')))];
const humanPaths = (meta.pages.find((p) => p.id === 'ozel-human')?.adet ?? 0) / 24;
const uniqueSrc = new Set(taramalar.map((t) => t.src).filter(Boolean)).size;
const tintedN = taramalar.filter((t) => t.tinted).length;
const wingN = taramalar.filter((t) => t.wing).length;

/* ---------- Dosyalar ---------- */
const csvq = (s: string) => `"${s.replace(/"/g, '""')}"`;
writeFileSync(`${OUT}/kusurlar.csv`, '﻿kod;bilgi;grup;kombinasyon;anahtar;ayrinti\n' + all.sort((a, b) => (KODLAR[a.kod]?.sira ?? 99) - (KODLAR[b.kod]?.sira ?? 99) || a.combo.localeCompare(b.combo))
  .map((k) => [k.kod, KODLAR[k.kod]?.bilgi ? 'bilgi' : 'kusur', k.grup, k.combo, k.anahtar, k.ayrinti].map(csvq).join(';')).join('\n'));
const veri = { tarih: ham.tarih, commit: ham.commit, sure: ham.sure, meta, groups, shots, sayim: { sayfa: pagesIn.length, hucre: sumBy(() => true), gorunus: uniq, sinif: classCombos, sinifCinsiyetSonra: classAfter, perClass, uniqueSrc, tintedN, wingN },
  kodlar: KODLAR, kusurlar: all, taramalar: taramalar.map((t) => ({ id: t.id, src: t.src, code: t.code, tinted: t.tinted, wing: t.wing, k: t.kusurlar, td: Math.round(t.thumbDiff * 10) / 10 })), pageErrors };
writeFileSync(`${OUT}/veri.json`, JSON.stringify(veri));
writeFileSync(`${OUT}/index.html`, indexHtml());
if (!NO_REPORT && !ONLY) writeFileSync(REPORT, reportMd());
console.log(`bitti (${REUSE ? 'yeniden üretim' : sec()}): ${uniq} görünüş, ${defectHits.length} kusur kaydı (${defectCauses.length} neden); ${OUT}/index.html${!NO_REPORT && !ONLY ? `, ${REPORT}` : ''}`);
if (pageErrors.length) console.log(`sayfa hataları: ${pageErrors.length}\n  ${pageErrors.slice(0, 10).join('\n  ')}`);

function git(cmd: string): string { try { return execSync(cmd).toString().trim(); } catch { return '?'; } }

function indexHtml(): string {
  const BOL: Record<string, string> = { sinif: '1. Sınıf bazlı (satır = alt sınıf, sütun = ırk/soy × cinsiyet)', ozel: '2. Özel varyantlar', durum: '3. Durum / filtre', ek: '4. Görünüşü etkileyen diğer girdiler' };
  const shotOf = new Map(shots.map((s) => [s.id, s]));
  const kOf = (pid: string) => { const p = meta.pages.find((x) => x.id === pid)!; return all.filter((k) => !KODLAR[k.kod]?.bilgi && k.grup === p.grup).length; };
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const card = (p: PageMeta) => {
    const s = shotOf.get(p.id);
    return `<figure class="card" data-full="${s ? esc(s.file) : ''}">${s ? `<img loading="lazy" src="${esc(s.thumb)}" alt="">` : '<div class="noimg">görüntü yok</div>'}<figcaption><b>${esc(p.baslik)}</b><small>${p.adet} hücre${s ? ` · ${s.w}×${s.h}${s.kesik ? ' · KESİK' : ''}${s.durdu ? '' : ' · durulmadı'}` : ''} · grup ${esc(p.grup)} (${kOf(p.id)} kusur kaydı)</small></figcaption></figure>`;
  };
  const sections = Object.entries(BOL).map(([b, t]) => {
    const ps = pagesIn.filter((p) => p.bolum === b);
    const gs = [...new Set(ps.map((p) => p.grup))];
    const body = gs.length > 1 ? gs.map((g) => `<h3>${esc(g)}</h3><div class="cards">${ps.filter((p) => p.grup === g).map(card).join('')}</div>`).join('') : `<div class="cards">${ps.map(card).join('')}</div>`;
    return `<section><h2>${esc(t)}</h2>${body}</section>`;
  }).join('');
  const data = JSON.stringify({ kodlar: KODLAR, kusurlar: all.map((k) => [k.kod, k.grup, k.combo, k.ayrinti]) }).replace(/</g, '\\u003c');
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Görsel döküm</title>
<style>
:root{--bg:#15191f;--card:#1f252e;--ink:#e8e4da;--mute:#9aa3b2;--acc:#f5d76e;--bad:#ff8a8e}
body{margin:0;background:var(--bg);color:var(--ink);font:14px system-ui,sans-serif}main{max-width:1500px;margin:0 auto;padding:16px}
h1{margin:.2em 0}h2{margin-top:1.6em;border-bottom:1px solid #333a46;padding-bottom:4px}h3{color:var(--acc);margin:1em 0 .4em}
.sum{border-collapse:collapse}.sum td,.sum th{border:1px solid #333a46;padding:4px 8px;text-align:left}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px}.card{margin:0;background:var(--card);border-radius:6px;overflow:hidden;cursor:zoom-in}
.card img{width:100%;height:170px;object-fit:cover;object-position:left top;display:block;background:#111}.card figcaption{padding:6px 8px}.card small{display:block;color:var(--mute)}
.noimg{height:170px;display:flex;align-items:center;justify-content:center;color:var(--mute)}
#lb{position:fixed;inset:0;background:rgba(0,0,0,.92);display:none;z-index:9;overflow:auto}#lb.on{display:block}#lb img{display:block;image-rendering:pixelated}#lb.fit img{max-width:100vw;max-height:100vh;margin:auto}
#lbbar{position:fixed;top:8px;right:12px;z-index:10;display:none;gap:6px}#lb.on~#lbbar{display:flex}#lbbar button{background:#333a46;color:#fff;border:0;border-radius:4px;padding:6px 10px;cursor:pointer}
.k{width:100%;border-collapse:collapse;font-size:12px}.k td,.k th{border-bottom:1px solid #2c333e;padding:3px 6px;text-align:left;vertical-align:top}.k .bilgi{color:var(--mute)}
input,select{background:#222831;color:var(--ink);border:1px solid #3a4250;border-radius:4px;padding:4px 6px}
</style></head><body><main>
<h1>Görsel döküm</h1>
<p>${esc(veri.tarih)} · commit ${esc(veri.commit)} · ${esc(veri.sure)} · ${pagesIn.length} sayfa · ${veri.sayim.hucre} hücre · ${uniq} ayrı görünüş tarandı · ${defectHits.length} kusur kaydı (${defectCauses.length} ayrı neden). Görsele tıkla: tam boy (kaydır); "Sığdır" düğmesi.</p>
<table class="sum"><tr><th>Kod</th><th>Açıklama</th><th>Kayıt</th><th>Neden</th></tr>${codes.map((c) => `<tr${KODLAR[c]?.bilgi ? ' class="bilgi"' : ''}><td>${c}</td><td>${esc(KODLAR[c]?.ad ?? c)}${KODLAR[c]?.bilgi ? ' (bilgi)' : ''}</td><td>${byCode.get(c)!.length}</td><td>${causes(c).length}</td></tr>`).join('')}</table>
${sections}
<section><h2>5. Kusur listesi</h2><p><select id="fk"><option value="">bütün kodlar</option>${codes.map((c) => `<option>${c}</option>`).join('')}</select> <input id="fq" placeholder="ara (kombinasyon, dosya…)" size="40"> <span id="fn"></span></p>
<table class="k"><thead><tr><th>kod</th><th>grup</th><th>kombinasyon</th><th>ayrıntı</th></tr></thead><tbody id="kb"></tbody></table></section>
</main><div id="lb"></div><div id="lbbar"><button id="lbfit">Sığdır / 1:1</button><button id="lbx">Kapat ✕</button></div>
<script>
const D=${data};
const lb=document.getElementById('lb');
document.querySelectorAll('.card').forEach(c=>c.addEventListener('click',()=>{const f=c.dataset.full;if(!f)return;lb.innerHTML='<img src="'+f+'">';lb.classList.add('on');lb.classList.remove('fit');lb.scrollTo(0,0);}));
document.getElementById('lbx').onclick=()=>lb.classList.remove('on');document.getElementById('lbfit').onclick=()=>lb.classList.toggle('fit');
addEventListener('keydown',e=>{if(e.key==='Escape')lb.classList.remove('on');});
const fk=document.getElementById('fk'),fq=document.getElementById('fq'),kb=document.getElementById('kb'),fn=document.getElementById('fn');
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function draw(){const k=fk.value,q=fq.value.toLowerCase();const r=D.kusurlar.filter(x=>(!k||x[0]===k)&&(!q||(x[2]+' '+x[3]).toLowerCase().includes(q)));fn.textContent=r.length+' kayıt'+(r.length>1000?' (ilk 1000)':'');
kb.innerHTML=r.slice(0,1000).map(x=>'<tr class="'+(D.kodlar[x[0]]&&D.kodlar[x[0]].bilgi?'bilgi':'')+'"><td>'+esc(x[0])+'</td><td>'+esc(x[1])+'</td><td>'+esc(x[2])+'</td><td>'+esc(x[3])+'</td></tr>').join('');}
fk.onchange=draw;fq.oninput=draw;draw();
</script></body></html>`;
}

function reportMd(): string {
  const L: string[] = [];
  const bolumN = (b: string) => pagesIn.filter((p) => p.bolum === b);
  L.push('# Görsel döküm (seçilebilir bütün karakter görünüşleri)', '');
  L.push(`Üretim: \`npm run gorsel-dokum\` (${veri.tarih.slice(0, 10)}, commit ${veri.commit}, süre ${veri.sure}). Bu dosyadaki bütün sayılar o çalıştırmadan; elle yazılmaz, betik yeniden yazar.`, '');
  L.push('Araç: `scripts/gorsel-dokum.ts` (Playwright + Vite, `check:harita` altyapısı) → `/onizleme-dokum.html` (`src/preview/gorselDokum.tsx`; yalnız geliştirme sunucusu, build girdisi değil). '
    + 'Çizim oyunun kendi bileşenleriyle: `CharacterFigure` (karakter listesi kartı / sihirbaz önizlemesi), `LookFrame` + `AvatarBadge` (savaş çekmecesi 56 px, sıra şeridi 30 px: küçük kopya), `AvatarBadge` 84 (karakter sayfası portresi), `AvatarCircle` → `TokenFigure` (savaş jetonu; `tokenFilters`/`filterStyle`, `tokenScale`, `TOKEN_R`, `hexPoints`). '
    + 'Jeton, boya, maske, kafa kaplaması, kanat ve taç `sheetAvatar` → `lineageLook`/`tintedUrl`/`crownSpec` çözücülerinden; kopya çizici yok. Savaş jetonunun `.token` sarmalayıcısı `MapBattle.tsx`\'teki jeton grubunun aynısıdır (dışa aktarılmış bileşen yok); öfke alevleri ve döngü efekt sprite\'ları çizilmez.', '');
  L.push('## Nasıl açılır', '');
  L.push('```powershell', 'npm run gorsel-dokum', '```', '');
  L.push('Sonra `gorsel-dokum/index.html` dosyasını tarayıcıda aç (git dışı; `.gitignore`). Kartlara tıklayınca sayfanın tam boy PNG\'si açılır (kaydır; "Sığdır" düğmesi), altta süzülebilir kusur listesi. '
    + 'Tek sayfayı elle incelemek: `npm run dev` → `/onizleme-dokum.html?sayfa=<kimlik>` (ör. `sinif-wizard-rozet-K`). Yalnız bazı gruplar: `npm run gorsel-dokum -- --grup wizard,ozel` (rapor yazılmaz); yalnız tarama: `-- --tarama`.', '');
  L.push('## Kombinasyon sayıları (ölçülmüş)', '');
  L.push(`- Sayfa: **${pagesIn.length}**, hücre (sayfalardaki toplam çizim): **${veri.sayim.hucre}**, ayrı görünüş (taranan kimlik): **${uniq}**; ayrı jeton dosyası: ${uniqueSrc}; boyalı: ${tintedN}; karakter ekranında kanatlı: ${wingN}.`);
  L.push(`- Sınıf tablosu (bölüm 1): **${classCombos}** kombinasyon = alt sınıf satırı (Gariban seviye 1, alt sınıflar seviye ${meta.altSinifSeviye}, ikinci formlar eşikte) × ırk/soy sütunu × cinsiyet; bunların ${classAfter}'i "cinsiyet sonradan değişti" (Karadul/İmparator gibi kısıtlı alt sınıf seçildikten sonra cinsiyet değişirse seçim kalır).`);
  L.push(`- Sınıf başına: ${perClass.map((x) => `${x.g} ${x.n}`).join(', ')}.`);
  L.push(`- Sınıf tablosu satırları: **${subRows.length}** alt sınıf (\`visibleSubclasses\`, ${perClass.map((x) => `${x.g} ${subRows.filter((r) => r.startsWith(`${x.g}/`)).length}`).join(', ')}) + ${perClass.length} Gariban + ${formRows.length} ikinci form (${formRows.join(', ')}); sütunlar: **${variantCols.length}** ırk/soy görünüşü × 2 cinsiyet (Human ten başına bir sütun; Human'ın ${humanPaths} UI yolu özel bölümde).`);
  L.push('', '| Bölüm | Sayfa | Hücre |', '|---|---:|---:|');
  for (const b of ['sinif', 'ozel', 'durum', 'ek'] as const) L.push(`| ${b} | ${bolumN(b).length} | ${bolumN(b).reduce((n, p) => n + p.adet, 0)} |`);
  L.push('', '| Sayfa | Hücre |', '|---|---:|');
  for (const p of pagesIn.filter((x) => x.bolum !== 'sinif')) L.push(`| ${p.baslik} (\`${p.id}\`) | ${p.adet} |`);
  L.push('', 'Kombinasyon kuralları (veriden): ırk/soy `data/races.json` (tür kartı ilk soyu seçer; yalnız yeni karakterin Human\'ı soysuz başlar: özel bölüm); Human görünüşünü yalnız ten tonu belirler (alt soyları `orijinal`): sınıf tablosunda ton başına bir sütun, bütün kültür/Sürgün yolları özel bölümde; Celestial 3 Göksel Uyanış; '
    + 'alt sınıflar `visibleSubclasses` (dış paket + imza + Karadul) ve `genderVisible`; Drow paleti veri ayarıdır (oyuncu seçmez), A–D yalnız karşılaştırma için. '
    + 'Görünüşü etkileyen diğer girdiler (bölüm 4): seviye eşikleri (Gariban < 3, Dragonborn kanadı ≥ 5, uyanış ≥ 3, ikinci jeton formu), Wild Shape/Polymorph biçimi (canavar jetonu; oyuncu tarafında ölçek ırktan), çağrılan yaratıklar (`spirit` filtresi, paket ton/halka), masum jetonları, Hapishane mahkûm kıyafeti. '
    + 'Donanım (silah/zırh/kalkan) görünüşü değiştirmez: `Avatar` alanlarında donanım yok (`src/battle/types.ts`).', '');
  L.push('## Kusurlar', '');
  L.push(`Toplam **${defectHits.length}** kusur kaydı, **${defectCauses.length}** ayrı neden (aynı dosya/maske/slot bir kez). Bilgi satırları kusur sayılmaz.`, '');
  L.push('| Kod | Açıklama | Kayıt | Neden |', '|---|---|---:|---:|');
  for (const c of codes) L.push(`| \`${c}\` | ${KODLAR[c]?.ad ?? c}${KODLAR[c]?.bilgi ? ' (bilgi)' : ''} | ${byCode.get(c)!.length} | ${causes(c).length} |`);
  L.push('');
  // GORSEL-DUZELTME: maskesi olmayan jetonlar yedek filtreyle (ayrı sayım) ve seçim bekleyen soylar.
  const yf = byCode.get('yedek-filtre') ?? [];
  const yedekVeri = JSON.parse(readFileSync('data/soy-filtre-yedek.json', 'utf8')) as { soylar: Record<string, { aday: number; bekliyor?: true }> };
  const bekleyen = Object.entries(yedekVeri.soylar).filter(([, v]) => v.bekliyor).map(([k]) => k);
  L.push('### Yedek filtreyle çizilenler (maske yok)', '');
  L.push(`- **${yf.length}** görünüş (${causes('yedek-filtre').length} jeton/neden) soy boyası yerine yedek CSS filtresiyle çiziliyor (\`data/soy-filtre-yedek.json\`; karar \`src/ui/tint.ts\` \`fallbackFilterFor\`). Maske eklenince yedek kendiliğinden kalkar.`);
  L.push(`- Seçim bekleyen soy: **${bekleyen.length}**/${Object.keys(yedekVeri.soylar).length}${bekleyen.length ? ` (geçici olarak 1. aday): ${bekleyen.join(', ')}` : ''}. Seçim: \`npm run dev\` → \`/onizleme-filtre.html\` → Kaydet.`);
  L.push(`- Bilerek boş maske (çıplak ten yok): ${(byCode.get('tensiz-jeton') ?? []).length} görünüş (${causes('tensiz-jeton').length} jeton).`, '');
  L.push('### İlk 15 kusur (önem sırasıyla, neden başına)', '');
  defectCauses.slice(0, 15).forEach((x, i) => L.push(`${i + 1}. \`${x.kod}\`: ${x.k.ayrinti}${x.n > 1 ? ` (${x.n} görünüşte)` : ''}`));
  if (!defectCauses.length) L.push('Kusur bulunmadı.');
  L.push('');
  for (const c of codes) {
    const cs = causes(c);
    L.push(`### \`${c}\`: ${KODLAR[c]?.ad ?? c} (${cs.length} neden)`, '');
    const MAX = 60;
    for (const x of cs.slice(0, MAX)) L.push(`- ${x.k.ayrinti}${x.n > 1 ? ` (${x.n} görünüş)` : ''}`);
    if (cs.length > MAX) L.push(`- … ve ${cs.length - MAX} neden daha (tamamı \`gorsel-dokum/kusurlar.csv\`).`);
    L.push('');
  }
  if (pageErrors.length) { L.push('## Sayfa hataları', ''); for (const e of [...new Set(pageErrors)].slice(0, 20)) L.push(`- ${e}`); L.push(''); }
  const kesik = shots.filter((s) => s.kesik || !s.durdu);
  if (kesik.length) { L.push('## Görüntü notları', ''); for (const s of kesik) L.push(`- \`${s.id}\`: ${s.kesik ? `${MAX_PX} px sınırında kesildi (${s.w}×${s.h})` : ''}${!s.durdu ? ' durulma süresi doldu' : ''}`); L.push(''); }
  return L.join('\n');
}
