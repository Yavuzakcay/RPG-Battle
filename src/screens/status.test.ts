import { describe, it, expect } from 'vitest';
import gorev from '../../docs/harita/GOREV.md?raw';
import { parseStatus } from './StatusScreen';
import { READY_BATTLE, demoCharacters } from './fixtures';
import { getMonster } from '../data';
import { planProblems } from '../app/setup';
import { characterProblems } from '../rules/builder';

describe('durum sayfası', () => {
  it('GOREV.md adımlarını ve "(tamam)" işaretini okur', () => {
    const steps = parseStatus(gorev);
    const ids = steps.map((s) => s.id);
    expect(ids).toEqual(expect.arrayContaining(['1', '5b', '5c', '5d', '8', '9', '10b', '11', '12', 'A', 'B', 'C']));
    const done = Object.fromEntries(steps.map((s) => [s.id, s.done]));
    expect(done).toMatchObject({ '8': true, '9': true, '11': false, '12': false, A: true });
    expect(parseStatus('7. Gizlenme (çöl): hide (tamam)\n- **Z) Yeni iş:** açıklama')).toEqual([
      { id: '7', title: 'Gizlenme', done: true }, { id: 'Z', title: 'Yeni iş', done: false },
    ]);
    // Windows'ta CRLF satır sonlu GOREV.md de aynı adımları verir.
    expect(parseStatus(gorev.replace(/\r?\n/g, '\r\n'))).toEqual(steps);
  });
});

describe('örnek karakterler', () => {
  it('oluşturucu kurallarına uyar', () => {
    for (const c of demoCharacters()) expect(characterProblems(c)).toEqual([]);
  });
});

describe('hazır savaş', () => {
  it('örnek karakterler, harita ve canavarlarla kurulabilir', () => {
    const plan = {
      party: demoCharacters().map((c) => ({ id: c.id, sheet: c.sheet })),
      enemies: Object.entries(READY_BATTLE.enemies).map(([id, count]) => ({ monster: getMonster(id), count })),
      mapId: READY_BATTLE.mapId, variantId: READY_BATTLE.variantId, mirrored: false,
    };
    expect(planProblems(plan)).toEqual([]);
  });
});
