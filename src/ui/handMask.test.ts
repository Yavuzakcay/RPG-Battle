/**
 * Görev K21: elle çizilmiş ten maskesi önceliği. Doğrulama (ad, boyut, gri ton), kaynak seçimi (elle → otomatik),
 * kısmi ağırlıklı boyama, elle maske yokken sonucun bit bit aynı kalması, betiklerin elle maske klasörüne yazmaması.
 * Görsel okunmaz (yalnızca dosya adları ve betik kaynağı).
 */
import { describe, expect, it } from 'vitest';
import { checkHandMask, maskSources } from './handMask';
import { handMasked, maskUrlFor, tintPixels } from './tint';
import { lineageTint } from '../battle/avatar';
import rapor from '../../data/soy-maske-rapor.json';
import soyRenkleri from '../../data/soy-renkleri.json';
import { classes } from '../data';
import yollar from '../../scripts/soy-maske-yollar.ts?raw';
import maskeBetik from '../../scripts/soy-maske.ts?raw';
import elBetik from '../../scripts/soy-maske-el.ts?raw';
import inceleBetik from '../../scripts/soy-incele.ts?raw';

const size = (n: string) => (n === 'goliath-male-fighter' ? { w: 256, h: 256 } : undefined);

describe('elle maske', () => {
  it('doğrulama: geçerli dosya; yanlış boyut, renkli dosya ve eşleşmeyen ad uyarıyla yok sayılır (çökmez)', () => {
    expect(checkHandMask({ file: 'goliath-male-fighter.png', width: 256, height: 256, colored: 0 }, size)).toEqual({ ok: true, name: 'goliath-male-fighter' });
    const bad = [
      { file: 'goliath-male-fighter.png', width: 128, height: 128, colored: 0 },
      { file: 'goliath-male-fighter.png', width: 256, height: 256, colored: 900 },
      { file: 'goliath-male-bilinmez.png', width: 256, height: 256, colored: 0 },
      { file: 'notlar.txt', width: 0, height: 0, colored: 0 },
    ];
    const r = bad.map((b) => checkHandMask(b, size));
    expect(r.every((x) => !x.ok)).toBe(true);
    expect(r.map((x) => (x.ok ? '' : x.warning))).toEqual([expect.stringContaining('boyut'), expect.stringContaining('renkli'), expect.stringContaining('jeton yok'), expect.stringContaining('ad kurala')]);
  });
  it('öncelik: geçerli elle maske varsa el, yoksa otomatik; çalışma anı yolu buna göre', () => {
    expect(maskSources(['a-male-x', 'b-female-y'], ['b-female-y'])).toEqual({ 'a-male-x': 'oto', 'b-female-y': 'el' });
    const sprites = (rapor as { sprites: Record<string, string> }).sprites;
    // KJ4: rapor kapsamı veriden (sabit sayı yok): `npm run soy-maske` ana döngüsüyle aynı küme = soy-renkleri.json'daki her ırk
    // (Human dahil: AS1c ten maskesi, 2026-11-12) × cinsiyet × sınıf. Eski sabit 120, Human eklenmeden önceki raporun sayısıydı (6 × 2 × 12 = 144).
    const beklenen = Object.keys(soyRenkleri.races).flatMap((r) => ['female', 'male'].flatMap((g) => classes.map((c) => `${r}-${g}-${c.id}`)));
    // GORSEL-DUZELTME: ayrıca elle maskesi olan alt sınıf/Gariban jetonları (`<ırk>-<erkek|kadin>-<sınıf>-<kod>`), yalnız 'el' olarak.
    const ek = Object.keys(sprites).filter((k) => !beklenen.includes(k));
    expect(Object.keys(sprites).filter((k) => beklenen.includes(k)).sort()).toEqual(beklenen.sort());
    expect(ek.every((k) => /^[a-z]+-(erkek|kadin)-[a-z]+-[A-Za-z0-9-]+$/.test(k) && sprites[k] === 'el')).toBe(true);
    expect(checkHandMask({ file: 'human-erkek-sorcerer-SC-9.png', width: 256, height: 256, colored: 0 }, (n) => (n === 'human-erkek-sorcerer-SC-9' ? { w: 256, h: 256 } : undefined)))
      .toEqual({ ok: true, name: 'human-erkek-sorcerer-SC-9' });
    for (const [name, src] of Object.entries(sprites)) {
      expect(handMasked(name)).toBe(src === 'el');
      // 2026-11-22: otomatik maskesi ırkta kapalıysa (`otoMaske: false`, Goliath) yalnız elle maske; yoksa adres yok (yedek filtre).
      const oto = (soyRenkleri.races as unknown as Record<string, { otoMaske?: false }>)[name.split('-')[0] ?? '']?.otoMaske !== false;
      expect(maskUrlFor(`characters/${name}.webp`)).toBe(src === 'el' ? `characters/maske-el/${name}.png` : oto ? `characters/maske/${name}.png` : null);
    }
  });
  it('kısmi ağırlık: 255 tam boya (ikili maskeyle bit bit aynı), 0 dokunulmaz, arası karışım', () => {
    const t = lineageTint('goliath', 'fire')!;
    const px = () => new Uint8ClampedArray([120, 125, 138, 255, 175, 180, 192, 255, 122, 126, 136, 255]);
    const bin = px(); tintPixels(bin, t, new Uint8Array([1, 1, 0]));
    const full = px(); tintPixels(full, t, undefined, new Uint8Array([255, 255, 0]));
    expect(Array.from(full)).toEqual(Array.from(bin));
    const half = px(); tintPixels(half, t, undefined, new Uint8Array([255, 128, 0]));
    expect(Array.from(half.slice(0, 4))).toEqual(Array.from(bin.slice(0, 4)));
    expect(Array.from(half.slice(8))).toEqual([122, 126, 136, 255]);
    for (let k = 0; k < 3; k++) {
      const lo = Math.min(px()[4 + k]!, bin[4 + k]!), up = Math.max(px()[4 + k]!, bin[4 + k]!);
      expect(half[4 + k]).toBeGreaterThanOrEqual(lo);
      expect(half[4 + k]).toBeLessThanOrEqual(up);
    }
  });
  it('betikler elle maske klasörüne yazmaz ve oradan silmez; otomatik maske ayrı klasörde', () => {
    expect(yollar).toMatch(/ELLE = path\.join\(ROOT, 'assets\/soy-maske-el'\)/);
    expect(yollar).toMatch(/OTO = path\.join\(CHAR, 'maske'\)/);
    for (const src of [maskeBetik, elBetik, inceleBetik]) {
      // ELLE yalnızca okunur: yazma/silme çağrılarında geçmez.
      for (const line of src.split('\n').filter((l) => /writeFile|unlink|rmSync|toFile|mkdirSync|copyFile|renameSync/.test(l))) expect(line, line).not.toMatch(/\bELLE\b/);
    }
  });
});
