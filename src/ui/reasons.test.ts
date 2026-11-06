// Kuyruk K58 G2: neden tablosu (data/neden-metinleri.json) bütün ve motorun eylem ekonomisi gerekçeleri çevrili.
import { describe, expect, it } from 'vitest';
import table from '../../data/neden-metinleri.json';
import { hasPattern, reasonOr, reasonText, whyTable } from './reasons';

describe('neden metinleri', () => {
  it('her arayüz gerekçesinin TR ve EN metni var', () => {
    for (const [k, v] of Object.entries(table.arayuz)) {
      expect(v.tr.length, k).toBeGreaterThan(3);
      expect(v.en.length, k).toBeGreaterThan(3);
    }
    expect(Object.keys(whyTable('tr'))).toEqual(Object.keys(whyTable('en')));
  });

  it('eylem ekonomisinin bütün gerekçeleri kalıplı (economy.ts fail metinleri)', () => {
    const src = Object.values(import.meta.glob('../battle/economy.ts', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>)[0] ?? '';
    const msgs = [...src.matchAll(/fail\('((?:[^'\\]|\\.)+)'\)/g)].map((m) => (m[1] as string).replace(/\\'/g, "'"));
    // Şablon metinler örnek değerle.
    msgs.push('Eylem bu tur kullanıldı.', 'Bonus eylem bu tur kullanıldı.', 'Tepki bu tur kullanıldı.', 'Cephane bitti (arrows).', 'Dash bonus eylemle yapılamaz.', 'Fireball ritüeldir: savaştan önce (kurulumda) yapılır.');
    expect(msgs.length).toBeGreaterThan(15);
    for (const m of msgs) expect(hasPattern(m), m).toBe(true);
  });

  it('çeviri ve yakalanan parçalar', () => {
    expect(reasonText('Cephane bitti (arrows).', 'en')).toBe('Out of ammunition (arrows).');
    expect(reasonText('Hareket yetmiyor: 3 altıgen gerekli, 1 kaldı.', 'en')).toBe('Not enough movement: 3 hexes needed, 1 left.');
    expect(reasonText('Eylem bu tur kullanıldı.', 'tr')).toBe('Eylem bu tur kullanıldı.');
    expect(reasonText('Bilinmeyen bir şey oldu', 'en')).toBe('Bilinmeyen bir şey oldu');
    expect(reasonOr(null, 'en')).toBe(table.genel.en);
  });
});
