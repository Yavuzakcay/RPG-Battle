import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { APP_NAME } from './src/app/appName';
import { splashDieCss, splashStaticHtml } from './src/ui/splashLogic';
import { odaAktarici } from './src/room/aktariciNode';

/**
 * index.html (Görev L, L2): başlık APP_NAME'den; açılış ekranının stili (zar dönüşü @keyframes dahil) satır içi ve ilk
 * statik karesi #root'un yanında `#splash-static` (JavaScript yüklenmeden kömür zemin ve 3D zarın ilk yönelimi
 * görünür; tembel açılış bileşeni aynı yapıyı çizip bunu kaldırır).
 */
function appShell(): Plugin {
  return {
    name: 'app-shell',
    transformIndexHtml(html) {
      const css = fs.readFileSync(new URL('./src/ui/splash.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ') + splashDieCss();
      return html
        .replaceAll('%APP_NAME%', APP_NAME.replace(/&/g, '&amp;'))
        .replace('</head>', `<style>${css}</style>\n  </head>`)
        .replace('<div id="root"></div>', `<div id="root"></div>\n    ${splashStaticHtml(APP_NAME)}`);
    },
  };
}

/**
 * Görev ODA-1: build kimliği (`__APP_BUILD__`). Çevrimiçi odaya katılımda host ile istemcinin build'i eşit olmalı
 * (src/room/surum.ts; farklı reducer sessizce ayrışır). Sürüm + git kısa kimliği + build/sunucu başlangıç zamanı.
 */
function buildId(): string {
  const pkg = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version?: string };
  let git = 'yerel';
  try { git = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || git; } catch { /* git yok */ }
  return `${pkg.version ?? '0'}+${git}.${Date.now().toString(36)}`;
}

/**
 * Görev ODA-2: geliştirme (`npm run dev -- --host`) ve önizleme (`npm run preview -- --host`) sunucusuna oda aktarıcısı
 * (`/oda`, WebSocket). Telefon aynı sunucudan açınca yerel ağ odası çalışır. Test sunucusunda (http sunucusu yok) etkisiz.
 */
function odaAktariciEklentisi(): Plugin {
  return {
    name: 'oda-aktarici',
    configureServer(server) { if (server.httpServer && 'on' in server.httpServer) odaAktarici(server.httpServer as import('node:http').Server); },
    configurePreviewServer(server) { if (server.httpServer && 'on' in server.httpServer) odaAktarici(server.httpServer as import('node:http').Server); },
  };
}

export default defineConfig({
  plugins: [react(), appShell(), odaAktariciEklentisi()],
  define: { __APP_BUILD__: JSON.stringify(buildId()) },
  // Kuyruk 19C: harita/ altındaki kaynak görseller, önizlemeler ve prompt'lar derlemeye girmez (yalnızca public/ ve
  // içe aktarılan JSON); geliştirme sunucusu bunlar değişince yeniden yüklenmesin.
  server: { watch: { ignored: ['**/harita/*/gorsel/**', '**/harita/*/onizleme/**', '**/harita/*/prompt/**', '**/assets-ham/**'] } },
  // Canavar verisi tembel yüklenir (src/data/index.ts loadMonsters); testlerden önce yüklenir.
  test: { setupFiles: ['src/test-setup.ts'] },
});
