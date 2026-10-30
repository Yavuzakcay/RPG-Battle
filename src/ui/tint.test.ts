/**
 * Görev K8b, K15: soy renkleri. Her soyun kaydı var (Wood Elf: boyama yok); her jetonun dosyası ve (soylu ırkta) ten
 * maskesi var; maskeli dönüşüm yalnızca maskedeki pikselleri değiştirir, açıklık farklarını korur; High Elf eski yolda;
 * soylar arası ten rengi farkı ölçüm dosyasından (data/soy-olcum.json, npm run soy-maske) eşiğin üstünde.
 */
import { describe, expect, it, vi } from 'vitest';
import { classes, races } from '../data';
import { blankCharacter } from '../rules/builder';
import { lineageBadge, lineagePalette, lineageTint, paletteTint, resolvePalette, sheetAvatar } from '../battle/avatar';
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
    // Drow (Görev K21; DROW-PALET varsayılan A kömür-mavi): koyu piksel siyaha yakın, açık piksel mavi-gri (mor yok: a ≤ 1,
    // b < 0). En açık sınırı 55 → 60: yeni 7 duraklı skalanın vurgusu L 56 (K19 kuralı L ≈ 60).
    const drow = new Uint8ClampedArray([90, 60, 40, 255, 240, 200, 180, 255]);
    tintPixels(drow, lineageTint('elf', 'drow')!, new Uint8Array([1, 1]));
    expect(rgbToLab(drow[0]!, drow[1]!, drow[2]!)[0]).toBeLessThan(20);
    const hi = rgbToLab(drow[4]!, drow[5]!, drow[6]!);
    expect(hi[0]).toBeLessThanOrEqual(60);
    expect(hi[1]).toBeLessThanOrEqual(1);
    expect(hi[2]).toBeLessThan(-4);
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

describe('DROW-PALET: seçilebilir paletler', () => {
  it('seçim veriden (elf.drowPalet, varsayılan A); geçersiz anahtar varsayılana düşer ve uyarır', () => {
    expect(soyRenkleri.races.elf.drowPalet).toBe('A');
    expect(lineagePalette('elf', 'drow')).toMatchObject({ key: 'A', valid: true });
    expect(lineageTint('elf', 'drow')?.to).toEqual(paletteTint('elf', 'drow', 'A')?.to);
    const pal = soyRenkleri.races.elf.paletler.drow;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolvePalette(pal, 'Z', 'test.drowPalet')).toEqual({ key: 'A', valid: false });
    expect(resolvePalette(pal, 3, 'test2.drowPalet')).toEqual({ key: 'A', valid: false });
    expect(warn).toHaveBeenCalledTimes(2);
    expect(resolvePalette(pal, 'C', 'test3.drowPalet')).toEqual({ key: 'C', valid: true });
    warn.mockRestore();
  });
  it(`dört palet: her jetonda High Elf ve Wood Elf'e ΔE ≥ ${MIN_DELTA_E} (data/soy-olcum.json paletler)`, () => {
    const E = (olcum.races as Record<string, Record<string, Record<string, number[]>>>).elf!;
    const P = (olcum as unknown as { paletler: Record<string, Record<string, Record<string, number[]>>> }).paletler['elf/drow']!;
    const low: string[] = [];
    for (const [k, rows] of Object.entries(P)) for (const [name, lab] of Object.entries(rows)) {
      for (const o of ['high-elf', 'wood-elf']) { const d = deltaE(lab, E[name]![o]!); if (d < MIN_DELTA_E) low.push(`${k} ${name} ${o} ${d.toFixed(1)}`); }
    }
    expect(low).toEqual([]);
    // Seçili paletin ölçümü races içindekiyle aynı.
    for (const [name, lab] of Object.entries(P.A!)) expect(E[name]!.drow).toEqual(lab);
  });
  it('gradyan: contrast/chromaKeep verilmezse eski davranış bit bit aynı; S-eğrisi tekdüze, kroma sapması korunur', () => {
    const stops: Array<[number, number, number]> = [[5, 0, -5], [25, 0, -15], [50, 0, -8]];
    const px = () => new Uint8ClampedArray([60, 40, 30, 255, 120, 90, 70, 255, 200, 170, 150, 255, 230, 200, 160, 255]);
    const mask = new Uint8Array([1, 1, 1, 1]);
    const a = px(), b = px();
    tintPixels(a, { select: { hMin: 0, hMax: 0, sMin: 0, lMin: 0, lMax: 1 }, to: { gradient: stops } }, mask);
    tintPixels(b, { select: { hMin: 0, hMax: 0, sMin: 0, lMin: 0, lMax: 1 }, to: { gradient: stops, contrast: 0, chromaKeep: 0 } }, mask);
    expect(Array.from(b)).toEqual(Array.from(a));
    const c = px();
    tintPixels(c, { select: { hMin: 0, hMax: 0, sMin: 0, lMin: 0, lMax: 1 }, to: { gradient: stops, contrast: 0.35, chromaKeep: 0.35 } }, mask);
    const L = (d: Uint8ClampedArray) => [0, 4, 8, 12].map((i) => rgbToLab(d[i]!, d[i + 1]!, d[i + 2]!)[0]);
    const lc = L(c);
    for (let i = 1; i < 4; i++) expect(lc[i]!).toBeGreaterThanOrEqual(lc[i - 1]!);
    expect(Array.from(c)).not.toEqual(Array.from(a));
  });
});

describe('K13/K15/K19: soy rozeti', () => {
  it('yalnızca o cinsiyette renk farkı ΔE < 20 kalan çiftlerde (çiftin bir tarafı)', () => {
    type Part = { badges?: Record<string, string> };
    const table = soyRenkleri.races as Record<string, { lineages: Record<string, unknown>; badges?: Record<string, string>; byGender?: Record<string, Part> }>;
    const list = (g: 'male' | 'female') => Object.entries(table).flatMap(([r, t]) => Object.keys((t.byGender?.[g] ?? t).badges ?? {}).map((l) => `${r}/${l}`)).sort();
    // Görev K22: kafa kaplamasıyla Goliath Hill çiftleri (Fire/Hill, Hill/Stone) 20'nin altına indi: Hill rozeti.
    expect(list('female')).toEqual(['dragonborn/brass', 'dragonborn/copper', 'dragonborn/silver', 'elf/wood-elf', 'goliath/frost', 'goliath/hill']);
    expect(list('male')).toEqual(['dragonborn/copper', 'dragonborn/gold', 'dragonborn/silver', 'goliath/hill']);
    // Her rozetli soy, o cinsiyette eşiğin (20) altında kalan bir çiftin tarafı; rozetsiz kalan her çiftin bir tarafı rozetli.
    const R = olcum.races as Record<string, Record<string, Record<string, number[]>>>;
    for (const g of ['female', 'male'] as const) for (const [race, rows] of Object.entries(R)) {
      const low = new Map<string, number>();
      for (const [name, lins] of Object.entries(rows)) {
        if (!name.includes(`-${g}-`)) continue;
        const ids = Object.keys(lins);
        for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
          const k = `${ids[i]}|${ids[j]}`; low.set(k, Math.min(low.get(k) ?? 99, deltaE(lins[ids[i]!]!, lins[ids[j]!]!)));
        }
      }
      const badged = new Set(list(g).filter((x) => x.startsWith(`${race}/`)).map((x) => x.split('/')[1]));
      const close = [...low].filter(([, d]) => d < 20).map(([k]) => k.split('|'));
      for (const [a, b] of close) expect(badged.has(a!) || badged.has(b!), `${race} ${g} ${a}/${b}`).toBe(true);
      for (const l of badged) expect(close.some((p) => p.includes(l!)), `${race} ${g} ${l}`).toBe(true);
    }
    expect(lineageBadge('dragonborn', 'red', 'erkek')).toBeUndefined();
    expect(lineageBadge('goliath', 'fire', 'kadin')).toBeUndefined();
    expect(lineageBadge('goliath', 'frost', 'erkek')).toBeUndefined();
    const a = sheetAvatar({ ...blankCharacter('t').sheet, raceId: 'goliath', classId: 'fighter', lineageId: 'frost', gender: 'kadin' });
    expect(a.badge).toBe(lineageBadge('goliath', 'frost', 'kadin'));
    expect(sheetAvatar({ ...blankCharacter('t').sheet, raceId: 'goliath', classId: 'fighter', lineageId: 'frost', gender: 'kadin', avatar: 'x.webp' }).badge).toBeUndefined();
  });
});

describe('K19: cinsiyete göre soy boyaması', () => {
  it('erkek Dragonborn: Black, Green, White maskeli (K15); diğerleri eski K8b yolu (maskesiz HSL); kadınlar maskeli', () => {
    const masked = (to: object | undefined) => !!to && ('lch' in to || 'gradient' in to);
    for (const l of ['black', 'green', 'white']) expect(masked(lineageTint('dragonborn', l, 'erkek')?.to), l).toBe(true);
    for (const l of ['blue', 'brass', 'bronze', 'copper', 'gold', 'red', 'silver']) {
      expect(masked(lineageTint('dragonborn', l, 'erkek')?.to), l).toBe(false);
      expect(masked(lineageTint('dragonborn', l, 'kadin')?.to), l).toBe(true);
    }
    // Eski yol: K8b değerleri (Copper tonu 14 → 20: Red ile ΔE 11,4 → 16,5).
    expect(lineageTint('dragonborn', 'blue', 'erkek')?.to).toEqual({ h: 215, s: 1.1, l: 0.9 });
    expect(lineageTint('dragonborn', 'copper', 'erkek')?.to).toEqual({ h: 20, s: 1.15, l: 0.85 });
    // Cinsiyetsiz eski kayıt erkek sayılır.
    expect(lineageTint('dragonborn', 'blue')).toEqual(lineageTint('dragonborn', 'blue', 'erkek'));
  });
  it('Goliath: yalnızca kadın Cloud değişti (dövme kontrastı); diğer soylar ve erkek Cloud aynı', () => {
    expect(lineageTint('goliath', 'cloud', 'erkek')?.to).toEqual({ lch: { h: 250, c: 3, gain: 0.6, dL: 38 } });
    const f = lineageTint('goliath', 'cloud', 'kadin')?.to as { lch: { contrast?: number } };
    expect(f.lch.contrast).toBeGreaterThan(1);
    for (const l of ['fire', 'frost', 'hill', 'stone', 'storm']) expect(lineageTint('goliath', l, 'kadin')).toEqual(lineageTint('goliath', l, 'erkek'));
    // Kontrast: açık ve koyu ten pikseli arasındaki açıklık farkı erkek Cloud'dan büyük.
    const px = () => new Uint8ClampedArray([90, 95, 108, 255, 175, 180, 192, 255]);
    const L = (d: Uint8ClampedArray, i: number) => rgbToLab(d[i]!, d[i + 1]!, d[i + 2]!)[0];
    const m = px(), w = px();
    tintPixels(m, lineageTint('goliath', 'cloud', 'erkek')!, new Uint8Array([1, 1]));
    tintPixels(w, lineageTint('goliath', 'cloud', 'kadin')!, new Uint8Array([1, 1]));
    expect(L(w, 4) - L(w, 0)).toBeGreaterThan((L(m, 4) - L(m, 0)) * 1.5);
  });
  // DROW-PALET: ortalama sınırı 33 → 40: 7 duraklı skala, S-eğrisi ve korunan kroma sapması gölge/ışık detayını geri
  // getirdi (eski 4 duraklı skala düz ve mat görünüyordu); en açık durak sınırı (L ≤ 60, K19) aynı.
  it('Drow koyu: her palette ten ortalama açıklığı ≤ 40, en açık durak L ≤ 60, en az 6 durak; High ve Wood Elf aynı', () => {
    const E = (olcum.races as Record<string, Record<string, Record<string, number[]>>>).elf!;
    const Ls = Object.values(E).map((r) => r.drow![0]!);
    expect(Ls.reduce((a, b) => a + b, 0) / Ls.length).toBeLessThanOrEqual(40);
    const P = (olcum as unknown as { paletler: Record<string, Record<string, Record<string, number[]>>> }).paletler['elf/drow']!;
    expect(Object.keys(P).sort()).toEqual(['A', 'B', 'C', 'D']);
    for (const [k, rows] of Object.entries(P)) {
      const m = Object.values(rows).reduce((a, v) => a + v[0]!, 0) / Object.keys(rows).length;
      expect(m, k).toBeLessThanOrEqual(40);
      const g = (paletteTint('elf', 'drow', k)?.to as { gradient: number[][] }).gradient;
      expect(g.length, k).toBeGreaterThanOrEqual(6);
      expect(Math.max(...g.map((s) => s[0]!)), k).toBeLessThanOrEqual(60);
    }
    const g = (lineageTint('elf', 'drow')?.to as { gradient: number[][] }).gradient;
    expect(Math.max(...g.map((s) => s[0]!))).toBeLessThanOrEqual(60);
    expect(lineageTint('elf', 'high-elf', 'kadin')?.to).toEqual({ h: 30, s: 0.7, l: 1.08 });
    expect(lineageTint('elf', 'wood-elf', 'kadin')).toBeUndefined();
  });
});
