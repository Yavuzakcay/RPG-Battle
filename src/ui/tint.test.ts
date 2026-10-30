/**
 * Görev K8b, K15: soy renkleri. Her soyun kaydı var (Wood Elf: boyama yok); her jetonun dosyası ve (soylu ırkta) ten
 * maskesi var; maskeli dönüşüm yalnızca maskedeki pikselleri değiştirir, açıklık farklarını korur; High Elf eski yolda;
 * soylar arası ten rengi farkı ölçüm dosyasından (data/soy-olcum.json, npm run soy-maske) eşiğin üstünde.
 */
import { describe, expect, it } from 'vitest';
import { classes, races } from '../data';
import { blankCharacter } from '../rules/builder';
import { lineageBadge, lineageTint, sheetAvatar } from '../battle/avatar';
import { maskUrlFor, tintPixels } from './tint';
import { deltaE, rgbToLab } from './color';
import olcum from '../../data/soy-olcum.json';
import soyRenkleri from '../../data/soy-renkleri.json';

const files = new Set(Object.keys(import.meta.glob('/public/characters/*.webp')).map((f) => f.replace('/public/', '')));
const masks = new Set(Object.keys(import.meta.glob('/public/characters/maske/*.png')).map((f) => f.replace('/public/', '')));
/** Görev K15: soy çiftleri arası en küçük ten rengi farkı (CIE76 ΔE, ortalama Lab). */
const MIN_DELTA_E = 15;

describe('soy → renk', () => {
  it('soyu olan her ırkın her soyu tabloda; Wood Elf boyamasız (klasik elf), diğerleri boyalı', () => {
    const table = soyRenkleri.races as Record<string, { lineages: Record<string, unknown> }>;
    const withLineage = races.filter((r) => (r.lineages ?? []).length > 0);
    expect(Object.keys(table).sort()).toEqual(withLineage.map((r) => r.id).sort());
    for (const r of withLineage) {
      expect(Object.keys(table[r.id]?.lineages ?? {}).sort(), r.id).toEqual((r.lineages ?? []).map((l) => l.id).sort());
      for (const l of r.lineages ?? []) expect(!!lineageTint(r.id, l.id), `${r.id}/${l.id}`).toBe(!(r.id === 'elf' && l.id === 'wood-elf'));
    }
  });
  it('her ırk/soy/sınıf/cinsiyet birleşiminde jeton dosyası var; soylu ırkta ten maskesi de var', () => {
    for (const r of races) for (const lineageId of [...(r.lineages ?? []).map((l) => l.id), undefined]) {
      if ((r.lineages ?? []).length > 0 && !lineageId) continue;
      for (const k of classes) for (const gender of ['erkek', 'kadin'] as const) {
        const a = sheetAvatar({ ...blankCharacter('t').sheet, raceId: r.id, classId: k.id, gender, ...(lineageId ? { lineageId } : {}) });
        expect(files.has(a.src), a.src).toBe(true);
        if (lineageId) expect(masks.has(maskUrlFor(a.src) ?? ''), `${a.src} maske`).toBe(true);
      }
    }
    expect(maskUrlFor('/base/characters/kucuk/goliath-male-fighter.webp')).toBe('/base/characters/maske/goliath-male-fighter.png');
  });
  it('maskeli dönüşüm: yalnızca maskedeki pikseller, açıklık sırası korunur; Goliath erkek gri teni de boyanır', () => {
    // Goliath gri-mavi ten (kroma ≈5; K8b'de doygunluk eşiğinin altında kaldığı için erkek jetonlar boyanmıyordu) ve aynı tonda metal.
    const px = () => new Uint8ClampedArray([120, 125, 138, 255, 175, 180, 192, 255, 122, 126, 136, 255]);
    const mask = new Uint8Array([1, 1, 0]);
    const fire = px();
    expect(tintPixels(fire, lineageTint('goliath', 'fire')!, mask)).toBe(2);
    expect(fire[0]).toBeGreaterThan(fire[2]! + 25);
    expect(Array.from(fire.slice(8))).toEqual([122, 126, 136, 255]);
    const L = (d: Uint8ClampedArray, i: number) => rgbToLab(d[i]!, d[i + 1]!, d[i + 2]!)[0];
    expect(L(fire, 4) - L(fire, 0)).toBeGreaterThan(15);
    expect(tintPixels(px(), lineageTint('goliath', 'fire')!)).toBe(0);
    // Drow: üç duraklı gradyan; koyu piksel indigo-siyah, açık piksel soluk menekşe.
    const drow = new Uint8ClampedArray([90, 60, 40, 255, 240, 200, 180, 255]);
    tintPixels(drow, lineageTint('elf', 'drow')!, new Uint8Array([1, 1]));
    expect(rgbToLab(drow[0]!, drow[1]!, drow[2]!)[0]).toBeLessThan(20);
    expect(rgbToLab(drow[4]!, drow[5]!, drow[6]!)[2]).toBeLessThan(-10);
    // Dragonborn Black: en koyu ten düz siyahın üstünde, hafif soğuk.
    const black = new Uint8ClampedArray([110, 80, 60, 255, 230, 190, 160, 255]);
    tintPixels(black, lineageTint('dragonborn', 'black')!, new Uint8Array([1, 1]));
    expect(rgbToLab(black[0]!, black[1]!, black[2]!)[0]).toBeGreaterThan(8);
    expect(black[2]).toBeGreaterThanOrEqual(black[0]!);
  });
  it('High Elf eski yolda (K8b; dokunulmadı): seçilen ton aralığı, maske gerekmez', () => {
    const px = new Uint8ClampedArray([230, 180, 150, 255, 60, 80, 200, 255]);
    expect(tintPixels(px, lineageTint('elf', 'high-elf')!)).toBe(1);
    expect(Array.from(px.slice(4))).toEqual([60, 80, 200, 255]);
  });
  it(`soylar arası ten rengi farkı her ırk, cinsiyet ve sınıfta ΔE ≥ ${MIN_DELTA_E} (data/soy-olcum.json)`, () => {
    const R = olcum.races as Record<string, Record<string, Record<string, number[]>>>;
    const low: string[] = [];
    for (const [race, rows] of Object.entries(R)) {
      expect(Object.keys(rows).length, race).toBe(24);
      for (const [name, lins] of Object.entries(rows)) {
        const ids = Object.keys(lins);
        for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
          const d = deltaE(lins[ids[i]!]!, lins[ids[j]!]!);
          if (d < MIN_DELTA_E) low.push(`${name} ${ids[i]}/${ids[j]} ${d.toFixed(1)}`);
        }
      }
    }
    expect(low).toEqual([]);
  });
});

describe('K13/K15: soy rozeti', () => {
  it('yalnızca renk farkı ΔE < 20 kalan çiftlerde (çiftin bir tarafı): Dragonborn metalikler ve Silver, Goliath Frost, Wood Elf', () => {
    const table = soyRenkleri.races as Record<string, { lineages: Record<string, unknown>; badges?: Record<string, string> }>;
    const withBadge = Object.entries(table).flatMap(([r, t]) => Object.keys(t.badges ?? {}).map((l) => `${r}/${l}`)).sort();
    expect(withBadge).toEqual(['dragonborn/brass', 'dragonborn/bronze', 'dragonborn/copper', 'dragonborn/gold', 'dragonborn/silver', 'elf/wood-elf', 'goliath/frost']);
    for (const t of Object.values(table)) {
      for (const l of Object.keys(t.badges ?? {})) expect(t.lineages[l], l).toBeDefined();
      const colors = Object.values(t.badges ?? {});
      expect(new Set(colors).size).toBe(colors.length);
    }
    expect(lineageBadge('dragonborn', 'red')).toBeUndefined();
    expect(lineageBadge('goliath', 'fire')).toBeUndefined();
    const a = sheetAvatar({ ...blankCharacter('t').sheet, raceId: 'goliath', classId: 'fighter', lineageId: 'frost' });
    expect(a.badge).toBe(lineageBadge('goliath', 'frost'));
    expect(sheetAvatar({ ...blankCharacter('t').sheet, raceId: 'goliath', classId: 'fighter', lineageId: 'frost', avatar: 'x.webp' }).badge).toBeUndefined();
  });
});
