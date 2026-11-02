/** Kuyruk 19 (-1): Windows'ta harf büyüklüğüyle çakışan modül adı olmasın (TS1149). */
import { describe, it, expect } from 'vitest';

const files = Object.keys(import.meta.glob(['/src/**/*.{ts,tsx}', '/scripts/**/*.{ts,mjs,cjs}', '/data/**/*.json', '/harita/**/*.json']));

describe('dosya adı büyük/küçük harf çakışması', () => {
  it('uzantısız yol yalnızca harf büyüklüğüyle ayrışmaz', () => {
    const seen = new Map<string, string>();
    const clash: string[] = [];
    for (const f of files) {
      const key = f.replace(/\.(tsx?|mjs|cjs|json)$/, '').toLowerCase();
      const prev = seen.get(key);
      if (prev && prev !== f) clash.push(`${prev} ↔ ${f}`);
      seen.set(key, f);
    }
    expect(clash).toEqual([]);
  });
});
