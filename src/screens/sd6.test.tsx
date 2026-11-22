/**
 * Görev SD6: Dark Elf görünen adı, ten temizliği (kenar saçağı, Dark Elf kapsamı), Drow paletinde hafif mor, simetrik ızgara.
 * Yalnız arayüz/görsel; kimlikler ve kayıt aynı.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Builder } from './Builder';
import { blankCharacter } from '../rules/builder';
import { races } from '../data';
import { lineageName } from '../rules/lineage';
import { closeSkinHoles } from '../ui/maskClose';
import { skinCleanup } from '../ui/tint';
import { paletteTint, lineageTint } from '../battle/avatar';
import { setLang } from '../i18n';

const html = () => { const b = blankCharacter('sd6'); return renderToStaticMarkup(<Builder initial={{ ...b, sheet: { ...b.sheet, name: 'Ad', raceId: 'elf', lineageId: 'drow' } }} onSave={() => {}} onCancel={() => {}} step="character" />); };

describe('SD6', () => {
  beforeEach(() => { setLang('tr'); });
  it('Drow soyunun görünen adı Dark Elf; kimlik drow kalır', () => {
    const l = races.find((r) => r.id === 'elf')!.lineages!.find((x) => x.id === 'drow')!;
    expect(lineageName(l, 'tr')).toBe('Dark Elf'); expect(lineageName(l, 'en')).toBe('Dark Elf');
    const m = html();
    expect(m).toContain('Dark Elf'); expect(m).not.toContain('Drow');
  });
  it('ten temizliği yalnız Human ve Dark Elf (gradyan) jetonlarında', () => {
    const grad = lineageTint('elf', 'drow')!;
    expect(skinCleanup('human-male-bard', grad)).toBe(true);
    expect(skinCleanup('elf-male-fighter', grad)).toBe(true);
    expect(skinCleanup('elf-male-fighter', { select: grad.select, to: { h: 30, s: 1, l: 1 } })).toBe(false);
    expect(skinCleanup('goliath-male-fighter', grad)).toBe(false);
  });
  it('kenar saçağı: ten maskesine bitişik açık ten pikseli maskeye girer; yakadaki/göz akı beyazı girmez', () => {
    const W = 8, H = 4, data = new Uint8ClampedArray(W * H * 4);
    const set = (x: number, y: number, r: number, g: number, b: number) => { const i = (y * W + x) * 4; data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255; };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) set(x, y, 20, 20, 20);
    for (let y = 0; y < H; y++) for (let x = 0; x < 4; x++) set(x, y, 190, 130, 100); // ten
    set(4, 1, 235, 195, 170); // açık ten saçağı
    set(4, 2, 250, 250, 250); // beyaz (gömlek yakası / göz akı)
    const mask = new Uint8Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < 4; x++) mask[y * W + x] = 1;
    const r = closeSkinHoles(data, mask, undefined, W, H).mask!;
    expect(r[1 * W + 4]).toBe(1);
    expect(r[2 * W + 4]).toBe(0);
    expect(r[0 * W + 6]).toBe(0);
  });
  it('Drow paletleri (SD8 güncellemesi): koyu/orta duraklarda mor (a > 0), 7 durak, L sıralı artar, en açık ≤ 80', () => {
    for (const k of ['A', 'B', 'C', 'D']) {
      const g = (paletteTint('elf', 'drow', k)!.to as { gradient: number[][] }).gradient;
      for (const s of g.slice(0, 5)) expect(s[1]!, k).toBeGreaterThan(0);
      for (let i = 1; i < g.length; i++) expect(g[i]![0]!, k).toBeGreaterThan(g[i - 1]![0]!);
      expect(Math.max(...g.map((s) => s[0]!)), k).toBeLessThanOrEqual(80);
      expect(g.length).toBe(7);
    }
  });
  it('tür ve sınıf ızgarası: 10 tür, 12 sınıf kartı tek ızgarada (5+5 / 6+6 düzeni CSS: race-grid, class-grid)', () => {
    const m = html();
    expect(m).toContain('race-grid'); expect(m).toContain('class-grid');
    expect((m.match(/race-card-small/g) ?? []).length).toBe(10);
    expect((m.match(/class-card-small/g) ?? []).length).toBe(12);
  });
});
