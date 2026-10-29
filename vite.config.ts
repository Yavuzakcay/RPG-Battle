import fs from 'node:fs';
import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { APP_NAME } from './src/app/appName';
import { splashDieCss, splashStaticHtml } from './src/ui/splashLogic';

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

export default defineConfig({
  plugins: [react(), appShell()],
  // Canavar verisi tembel yüklenir (src/data/index.ts loadMonsters); testlerden önce yüklenir.
  test: { setupFiles: ['src/test-setup.ts'] },
});
