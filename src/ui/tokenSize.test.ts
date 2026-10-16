/** Jeton boyutu (JSON ölçekleri) ve çizim sırası. */
import { describe, it, expect } from 'vitest';
import sizes from '../../data/token-sizes.json';
import { drawOrder, overhang, tokenScale } from './tokenSize';
import { combatantFromSheet } from '../battle';
import { blankCharacter } from '../rules/builder';
import { races } from '../data';

const t = (id: string, col: number, row: number, scale: number) => ({ id, pos: { col, row }, y: row * 100 + (col % 2) * 50, scale });

describe('jeton boyutu', () => {
  it('ölçekler JSON\'dan: Tiny 0.3, Small 0.5, Medium 1, Large 1.5, Huge 2, Gargantuan 3', () => {
    expect(sizes.scale).toEqual({ T: 0.3, S: 0.5, M: 1, L: 1.5, H: 2, G: 3 });
    expect((['T', 'S', 'M', 'L', 'H', 'G'] as const).map((size) => tokenScale({ side: 'enemies', size }))).toEqual([0.3, 0.5, 1, 1.5, 2, 3]);
  });
  it('oyuncu karakterleri ırktan (JSON), boyut sınıfından değil; tabloda olmayan ırk ve masum 1', () => {
    expect(sizes.race).toEqual({ halfling: 0.5, gnome: 0.5, dwarf: 0.75, human: 1, elf: 1, tiefling: 1, celestial: 1.05, orc: 1.2, dragonborn: 1.25, goliath: 1.4 });
    expect(tokenScale({ side: 'party', size: 'S', raceId: 'halfling' })).toBe(0.5);
    expect(tokenScale({ side: 'party', size: 'M', raceId: 'goliath' })).toBe(1.4);
    expect(tokenScale({ side: 'party', size: 'M', raceId: 'dwarf' })).toBe(0.75);
    expect(tokenScale({ side: 'party', size: 'M', raceId: 'yok-boyle-irk' })).toBe(1);
    expect(tokenScale({ side: 'party', civilian: true, size: 'T' })).toBe(1);
  });
  it('karakter sayfasından gelen savaşçı ırkını taşır; her oyun ırkının ölçeği tabloda', () => {
    const c = combatantFromSheet({ ...blankCharacter('t').sheet, raceId: 'gnome', classId: 'wizard' }, { id: 'a', ownerId: 'p' });
    expect(c.raceId).toBe('gnome');
    expect(tokenScale(c)).toBe(0.5);
    for (const r of races) expect(Object.keys(sizes.race), r.id).toContain(r.id);
  });
  it('taşma menzili: Large ve Huge 1 altıgen, Gargantuan 2', () => {
    expect([0.3, 1, 1.5, 2, 3].map(overhang)).toEqual([0, 0, 1, 1, 2]);
  });
});

describe('çizim sırası', () => {
  it('ekranda aşağıdaki jeton üstte (sonra çizilir)', () => {
    expect(drawOrder([t('alt', 4, 3, 1), t('ust', 4, 2, 1)]).map((x) => x.id)).toEqual(['ust', 'alt']);
  });
  it('büyük jeton yanındaki küçüğü örtmez: küçük, üstüne taşan büyükten sonra çizilir', () => {
    // Gargantuan (4,3) küçük jetonun (4,2) bir alt satırında: normalde üstte olurdu.
    const order = drawOrder([t('kucuk', 4, 2, 0.3), t('dev', 4, 3, 3), t('uzak', 10, 0, 1)]).map((x) => x.id);
    expect(order.indexOf('kucuk')).toBeGreaterThan(order.indexOf('dev'));
    expect(order.indexOf('uzak')).toBeLessThan(order.indexOf('dev'));
  });
  it('taşma menzili dışındaki küçük jeton normal sırada kalır', () => {
    const order = drawOrder([t('kucuk', 4, 0, 1), t('buyuk', 4, 3, 1.5)]).map((x) => x.id);
    expect(order).toEqual(['kucuk', 'buyuk']);
  });
});
