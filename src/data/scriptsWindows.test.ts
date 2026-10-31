/**
 * Kuyruk 15 K15C: betiklerde Windows uyumu. `import.meta.url === \`file://${process.argv[1]}\`` Windows'ta hiç eşleşmez
 * (sürücü harfi ve ters bölü); ana blok çalışmaz. Doğrusu `pathToFileURL(process.argv[1]).href`.
 */
import { describe, expect, it } from 'vitest';

const sources = import.meta.glob('../../scripts/*.{mjs,js,cjs,ts}', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;

describe('betikler Windows uyumu', () => {
  it('ana blok denetimi file:// birleştirmesiyle yazılmaz', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(5);
    const bad = Object.entries(sources).filter(([, src]) => /import\.meta\.url\s*===\s*`file:\/\/\$\{process\.argv\[1\]\}`/.test(src)).map(([f]) => f);
    expect(bad).toEqual([]);
  });
  it('process.argv[1] ile ana blok denetimi yapan betik pathToFileURL kullanır', () => {
    for (const [f, src] of Object.entries(sources)) {
      if (/import\.meta\.url\s*===/.test(src) && src.includes('process.argv[1]')) expect(src, f).toContain('pathToFileURL');
    }
  });
});
