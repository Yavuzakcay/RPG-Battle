/**
 * Görev SWARM95 (yalnız görünüm): sürü parçacıkları. Efekt ayarı kapalıyken parçacık yok; hareketi azaltta sabit;
 * animasyon bütçesi (ekranda en çok 8, statusFx) aşılınca kalan sabit; tür biçim/canavar kimliğinden.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import SwarmMotes from './SwarmMotes';
import { planMotes, swarmKind } from './swarmView';
import type { Combatant } from '../battle/types';

const items = [
  { id: 'S1', x: 100, y: 100, r: 30, kind: 'kanat' as const },
  { id: 'S2', x: 200, y: 100, r: 30, kind: 'bocek' as const },
];

describe('SWARM95 sürü parçacıkları', () => {
  it('efekt ayarı kapalıyken parçacık yok', () => {
    const motes = planMotes(items, { enabled: false, reduceMotion: false, budget: 8 });
    expect(motes).toEqual([]);
    expect(renderToStaticMarkup(<svg><SwarmMotes motes={motes} /></svg>)).not.toContain('swarm-motes');
  });
  it('açıkken jeton başına iki halka; bütçe kadar animasyon, kalanı ve hareketi azaltta hepsi sabit', () => {
    const on = planMotes(items, { enabled: true, reduceMotion: false, budget: 1 });
    expect(on.map((m) => m.animated)).toEqual([true, false]);
    const html = renderToStaticMarkup(<svg><SwarmMotes motes={on} /></svg>);
    expect(html.match(/class="swarm-motes /g)?.length).toBe(2);
    expect(html).toContain('data-swarm="S1"');
    expect(planMotes(items, { enabled: true, reduceMotion: true, budget: 8 }).every((m) => !m.animated)).toBe(true);
    const still = renderToStaticMarkup(<svg><SwarmMotes motes={planMotes(items, { enabled: true, reduceMotion: true, budget: 8 })} /></svg>);
    expect(still.match(/swarm-ring still/g)?.length).toBe(4);
  });
  it('tür: canavar kimliği, Wild Shape biçimi; sürü olmayan null', () => {
    expect(swarmKind({ monsterId: 'swarm-of-rats' } as Combatant)).toBe('kemirgen');
    expect(swarmKind({ monsterId: 'wolf' } as Combatant)).toBeNull();
    expect(swarmKind({ shape: { monster: {}, form: 'swarm-of-bats' } } as unknown as Combatant)).toBe('kanat');
    expect(swarmKind({ effects: [{ id: 'x', name: 'x', sourceId: 'x', swarm: true }] } as unknown as Combatant)).toBe('bocek');
  });
});
