/**
 * Görev ODA-2: yerel ağ oda sunucusu (`npm run oda-sunucu`). Tek portta hem derlenmiş uygulamayı (`dist/`) sunar hem
 * `/oda` yolunda WebSocket aktarıcısı çalıştırır (çekirdek `src/room/aktarici.ts`, bağlama `src/room/aktariciNode.ts`).
 * Telefonlar uygulamayı bu adresten açar: aynı köken (CORS/karışık içerik yok) ve aynı build (sürüm el sıkışması).
 * Oyun mantığı yok, kalıcılık yok. Açılınca yerel ağ adreslerini ve ilk adresin QR kodunu yazar.
 *
 * Kullanım (PowerShell):  npm run build; npm run oda-sunucu            (port 5180)
 *                         npm run oda-sunucu -- --port 5200
 * Seçenekler: --port N (ya da $env:PORT), --dist <klasör>, --qr-yok.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { adresYaniti, odaAktarici, ODA_ADRES_YOLU, ODA_YOLU, yerelAdresler } from '../src/room/aktariciNode';

const arg = (ad: string): string | undefined => { const i = process.argv.indexOf(ad); return i >= 0 ? process.argv[i + 1] : undefined; };
const PORT = Number(arg('--port') ?? process.env.PORT ?? 5180);
const DIST = resolve(arg('--dist') ?? 'dist');
const QR = !process.argv.includes('--qr-yok');

if (!existsSync(join(DIST, 'index.html'))) {
  console.error(`oda-sunucu: ${DIST}/index.html yok. Önce derle:  npm run build`);
  process.exit(1);
}

const TUR: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm',
};

function sun(req: IncomingMessage, res: ServerResponse): void {
  const yol = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/');
  // Görev ODA-5 (madde 6): oda lobisi telefonlara bu sunucunun yerel ağ adresini gösterir.
  if (yol === ODA_ADRES_YOLU) { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.end(adresYaniti(PORT)); return; }
  let dosya = normalize(join(DIST, yol));
  if (!dosya.startsWith(DIST + sep) && dosya !== DIST) { res.statusCode = 403; res.end(); return; }
  if (!existsSync(dosya) || statSync(dosya).isDirectory()) dosya = existsSync(join(dosya, 'index.html')) ? join(dosya, 'index.html') : join(DIST, 'index.html');
  try {
    const veri = readFileSync(dosya);
    res.setHeader('Content-Type', TUR[extname(dosya).toLowerCase()] ?? 'application/octet-stream');
    // index.html önbelleğe alınmaz (yeni build hemen gelsin; sürüm el sıkışması eşit build ister).
    res.setHeader('Cache-Control', dosya.endsWith('index.html') ? 'no-cache' : 'public, max-age=3600');
    res.end(veri);
  } catch {
    res.statusCode = 404; res.end();
  }
}

const adresler = yerelAdresler;

const server = createServer(sun);
const ak = odaAktarici(server);
server.listen(PORT, '0.0.0.0', async () => {
  const ipler = adresler();
  console.log(`Dice & Hex oda sunucusu: port ${PORT}, uygulama ${DIST}, aktarıcı ${ODA_YOLU}`);
  console.log(`  Bu bilgisayar (Game Master):  http://localhost:${PORT}`);
  for (const ip of ipler) console.log(`  Yerel ağ (telefonlar):        http://${ip}:${PORT}`);
  if (!ipler.length) console.log('  Yerel ağ adresi bulunamadı (Wi-Fi bağlı mı?).');
  console.log('  Game Master ve oyuncular uygulamayı BU adreslerden açmalı (aynı build). Durdurmak için Ctrl+C.');
  if (QR && ipler[0]) {
    try {
      const qr = (await import('qrcode-terminal')).default as { generate: (t: string, o: { small: boolean }, cb: (s: string) => void) => void };
      qr.generate(`http://${ipler[0]}:${PORT}`, { small: true }, (s) => console.log(s));
    } catch { /* QR isteğe bağlı */ }
  }
});
server.on('error', (e: NodeJS.ErrnoException) => {
  console.error(e.code === 'EADDRINUSE' ? `oda-sunucu: port ${PORT} kullanımda (--port ile başka port seç).` : `oda-sunucu: ${e.message}`);
  process.exit(1);
});
const kapat = () => { void ak.kapat().then(() => server.close(() => process.exit(0))); };
process.on('SIGINT', kapat);
process.on('SIGTERM', kapat);
