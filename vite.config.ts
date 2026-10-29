import fs from 'node:fs';
import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { APP_NAME } from './src/app/appName';
import { splashStaticHtml } from './src/ui/splashLogic';

/**
 * index.html (Görev L): başlık APP_NAME'den; açılış ekranının stili satır içi ve ilk statik karesi #root içinde
 * (JavaScript yüklenmeden kömür zemin ve logo gövdesi görünür; React aynı yapıyı çizip devralır).
 */
function appShell(): Plugin {
  let base = '/';
  return {
    name: 'app-shell',
    configResolved(c) { base = c.base; },
    transformIndexHtml(html) {
      const css = fs.readFileSync(new URL('./src/ui/splash.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
      return html
        .replaceAll('%APP_NAME%', APP_NAME.replace(/&/g, '&amp;'))
        .replace('</head>', `<style>${css}</style>\n  </head>`)
        .replace('<div id="root"></div>', `<div id="root">${splashStaticHtml(base, APP_NAME)}</div>`);
    },
  };
}

export default defineConfig({
  plugins: [react(), appShell()],
  // Canavar verisi tembel yüklenir (src/data/index.ts loadMonsters); testlerden önce yüklenir.
  test: { setupFiles: ['src/test-setup.ts'] },
});
