/**
 * Görev Y4: zincir ölçümü. Çalıştırma: `npm run sim:zincir -- 30 [--parti standart] [--zorluk normal] [--guzergah ilk-gun]`.
 * Sonuç tablosu `docs/harita/DENGE.md`'ye elle yazılır.
 */
import { loadClassData, loadMonsters } from '../data';
await Promise.all([loadMonsters(), loadClassData()]);
const { simulateChain } = await import('./chain');
const { setPartyKind } = await import('./balance');

declare const process: { argv: string[] };
const args = process.argv.slice(2).filter((a: string) => a !== '--');
const opt = (n: string, d: string) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] as string : d; };
const runs = Number(args.find((a) => /^\d+$/.test(a)) ?? 30);
const kind = opt('--parti', 'standart');
const difficulty = opt('--zorluk', 'normal') as 'kolay' | 'normal' | 'zor';
const routeId = opt('--guzergah', 'ilk-gun');
const routes = import.meta.glob('../../data/yolculuk/*.json', { eager: true }) as Record<string, { default: { id?: string } }>;
const route = Object.values(routes).map((m) => m.default).find((r) => r.id === routeId) as unknown as import('../journey/types').JourneyRoute;
if (!route) throw new Error(`Güzergâh yok: ${routeId}`);
setPartyKind(kind);
const t0 = Date.now();
const res = Array.from({ length: runs }, (_, i) => simulateChain(route, i + 1, kind, difficulty));
const battles = route.stops.filter((s) => s.kind === 'battle').length;
const avg = (f: (r: (typeof res)[number]) => number) => (res.reduce((n, r) => n + f(r), 0) / res.length);
const per = (k: 'deaths' | 'downs') => Array.from({ length: battles }, (_, i) => avg((r) => r[k][i] ?? 0).toFixed(2)).join(' / ');
console.log(`> Zincir: ${route.name.tr}, parti ${kind}, ${difficulty}, seviye ${route.level}, ${runs} tohum, ${((Date.now() - t0) / 60000).toFixed(1)} dk`);
console.log('| Bitirme | Ort. kazanılan savaş | Durak başına ölüm | Durak başına düşmüş | Kalan slot | Kalan HP zarı | Kısa dinlenme | Uzun dinlenme |');
console.log('|---:|---:|---|---|---:|---:|---:|---:|');
console.log(`| ${Math.round(avg((r) => (r.finished ? 1 : 0)) * 100)}% | ${avg((r) => r.battlesWon).toFixed(2)}/${battles} | ${per('deaths')} | ${per('downs')} | ${Math.round(avg((r) => r.slotsLeft) * 100)}% | ${Math.round(avg((r) => r.hitDiceLeft) * 100)}% | ${avg((r) => r.shortRests).toFixed(1)} | ${avg((r) => r.longRests).toFixed(1)} |`);
