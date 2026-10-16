import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Canavar verisi tembel yüklenir (src/data/index.ts loadMonsters); testlerden önce yüklenir.
  test: { setupFiles: ['src/test-setup.ts'] },
});
