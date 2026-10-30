/**
 * Görev K8b: soy renkleri. Her soyun rengi tanımlı; her ırk/soy/sınıf/cinsiyet birleşiminde jeton dosyası var ve
 * soyu olan ırkta boyama bilgisi taşır; dönüşüm yalnızca seçilen ton aralığındaki pikselleri değiştirir.
 */
import { describe, expect, it } from 'vitest';
import { classes, races } from '../data';
import { blankCharacter } from '../rules/builder';
import { lineageTint, sheetAvatar } from '../battle/avatar';
import { tintPixels } from './tint';
import soyRenkleri from '../../data/soy-renkleri.json';

const files = new Set(Object.keys(import.meta.glob('/public/characters/*.webp')).map((f) => f.replace('/public/', '')));

describe('soy → renk', () => {
  it('soyu olan her ırkın her soyunun rengi var; tabloda fazladan ırk/soy yok', () => {
    const table = soyRenkleri.races as Record<string, { lineages: Record<string, unknown> }>;
    const withLineage = races.filter((r) => (r.lineages ?? []).length > 0);
    expect(Object.keys(table).sort()).toEqual(withLineage.map((r) => r.id).sort());
    for (const r of withLineage) {
      expect(Object.keys(table[r.id]?.lineages ?? {}).sort(), r.id).toEqual((r.lineages ?? []).map((l) => l.id).sort());
      for (const l of r.lineages ?? []) expect(lineageTint(r.id, l.id), `${r.id}/${l.id}`).toBeDefined();
    }
  });
  it('her ırk/soy/sınıf/cinsiyet birleşiminde jeton dosyası var; soyu olan ırkta boyama bilgisi taşır', () => {
    for (const r of races) for (const lineageId of [...(r.lineages ?? []).map((l) => l.id), undefined]) {
      if ((r.lineages ?? []).length > 0 && !lineageId) continue;
      for (const k of classes) for (const gender of ['erkek', 'kadin'] as const) {
        const a = sheetAvatar({ ...blankCharacter('t').sheet, raceId: r.id, classId: k.id, gender, ...(lineageId ? { lineageId } : {}) });
        expect(files.has(a.src), a.src).toBe(true);
        expect(!!a.tint, `${r.id}/${lineageId}`).toBe(!!lineageId);
      }
    }
  });
  it('dönüşüm: Dragonborn ten pikseli Red/Blue soyunda boyanır, metal gri ve saydam piksel değişmez', () => {
    const px = () => new Uint8ClampedArray([200, 130, 80, 255, 160, 165, 170, 255, 200, 130, 80, 0]);
    const red = px();
    expect(tintPixels(red, lineageTint('dragonborn', 'red')!)).toBe(1);
    expect(red[0]).toBeGreaterThan(red[1]! + 60);
    expect(Array.from(red.slice(4))).toEqual([160, 165, 170, 255, 200, 130, 80, 0]);
    const blue = px();
    tintPixels(blue, lineageTint('dragonborn', 'blue')!);
    expect(blue[2]).toBeGreaterThan(blue[0]!);
    // Goliath Stone soyu tonu korur (temel görünüm).
    const stone = new Uint8ClampedArray([120, 130, 150, 255]);
    tintPixels(stone, lineageTint('goliath', 'stone')!);
    expect(Math.abs(stone[0]! - 120) + Math.abs(stone[2]! - 150)).toBeLessThanOrEqual(2);
  });
});

describe('sarmal ton aralığı', () => {
  it('Gnome (340°–40°): pembe ten (350°) seçilir, mavi kumaş seçilmez', () => {
    const px = new Uint8ClampedArray([230, 150, 170, 255, 60, 80, 200, 255]);
    expect(tintPixels(px, lineageTint('gnome', 'forest-gnome')!)).toBe(1);
    expect(Array.from(px.slice(4))).toEqual([60, 80, 200, 255]);
  });
});
