/** Kuyruk 43b: Volkan boss listesi (Normal) gerçek Volkan senaryosunun 5. seviye listesine bağlı. */
import { describe, expect, it } from 'vitest';
import boss from '../../data/sim-boss.json';
import scen from '../../data/sim-senaryolar.json';

describe('Kuyruk 43b: boss listeleri', () => {
  it('Volkan Normal listesi volkan-ejder senaryosunun 5. seviye listesiyle aynı', () => {
    const b = (boss.bosslar as unknown as Array<{ id: string; senaryo: string; seviye: number; normal: Record<string, number> }>).find((x) => x.id === 'volkan')!;
    const s = (scen.scenarios as unknown as Array<{ id: string; enemies: Record<string, Record<string, number>> }>).find((x) => x.id === b.senaryo)!;
    expect(s.enemies[String(b.seviye)]).toEqual(b.normal);
  });
});
