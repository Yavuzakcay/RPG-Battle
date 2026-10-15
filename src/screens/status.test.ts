import { describe, it, expect } from 'vitest';
import gorev from '../../docs/harita/GOREV.md?raw';
import { demoCharacters, parseStatus } from './Screens';
import { characterProblems } from '../rules/builder';

describe('durum sayfası', () => {
  it('GOREV.md adımlarını ve "(tamam)" işaretini okur', () => {
    const steps = parseStatus(gorev);
    const ids = steps.map((s) => s.id);
    expect(ids).toEqual(expect.arrayContaining(['1', '5b', '5c', '5d', '8', '9', '10b', '11', '12', 'A', 'B', 'C']));
    const done = Object.fromEntries(steps.map((s) => [s.id, s.done]));
    expect(done).toMatchObject({ '8': true, '9': false, '11': false, '12': false, A: true });
    expect(parseStatus('7. Gizlenme (çöl): hide (tamam)\n- **Z) Yeni iş:** açıklama')).toEqual([
      { id: '7', title: 'Gizlenme', done: true }, { id: 'Z', title: 'Yeni iş', done: false },
    ]);
  });
});

describe('örnek karakterler', () => {
  it('oluşturucu kurallarına uyar', () => {
    for (const c of demoCharacters()) expect(characterProblems(c)).toEqual([]);
  });
});
