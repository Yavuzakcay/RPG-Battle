/**
 * Kuyruk M1: 6.–9. seviye büyülerin açıklama metni (`text`, yalnız metin). Biçim 0.–5. seviyeyle aynı: tek `text` alanı,
 * kısa Türkçe özet (EN alanı büyü verisinde yok). Metin mekaniğe dokunmaz: `spell.text` ortam kuralı anahtar sözcük
 * eşleşmesine girdiği için (`environmentSources`), metin eklenmeden önceki ve sonraki eşleşme her ortamda aynı olmalı.
 */
import { describe, expect, it } from 'vitest';
import { environments, spells } from './index';
import { environmentSources } from '../rules/modes';

const high = () => spells.filter((s) => s.level >= 6);

describe('Kuyruk M1: 6.–9. seviye büyü metinleri', () => {
  it('84 büyünün hepsinin metni dolu; bütün büyülerde boş metin yok', () => {
    expect(high()).toHaveLength(84);
    expect(high().filter((s) => !s.text?.trim()).map((s) => s.id)).toEqual([]);
    expect(spells.filter((s) => !s.text?.trim()).map((s) => s.id)).toEqual([]);
  });
  it('seviye dağılımı 31 / 20 / 17 / 16', () => {
    const n = (l: number) => high().filter((s) => s.level === l).length;
    expect([n(6), n(7), n(8), n(9)]).toEqual([31, 20, 17, 16]);
  });
  it('savaş dışı büyü "savaş dışı:" ile başlar, savaşta kullanılan başlamaz (0.–5. seviye kalıbı)', () => {
    for (const s of high()) expect(s.text!.startsWith('savaş dışı:'), s.id).toBe(!!s.mechanics.offCombat);
  });
  it('mekanik değişmedi: metin ortam kuralı eşleşmesini değiştirmez (her ortam, her büyü)', () => {
    for (const env of environments) for (const s of high()) {
      const before = environmentSources(env, `${s.name} undefined`.toLowerCase()).map((r) => r.reason);
      const after = environmentSources(env, `${s.name} ${s.text}`.toLowerCase()).map((r) => r.reason);
      expect(after, `${env.id} ${s.id}`).toEqual(before);
    }
  });
  it('büyü kartı taşmasın: en uzun metin 260 karakteri aşmaz', () => {
    for (const s of high()) expect(s.text!.length, s.id).toBeLessThanOrEqual(260);
  });
});
