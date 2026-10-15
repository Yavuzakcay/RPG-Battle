import { describe, it, expect } from 'vitest';
import { createMapSession } from '../demo';
import { maps } from '../map/maps';
import { hexKey } from '../rules/hex';
import { scripted } from '../battle/fixtures';
import {
  VIEW, areaPreview, areaSpellsOf, attackChoices, hexCenter, hexPoints, jumpHexes, movableHexes, startZoneOf, terrainInfo,
} from './mapView';
import { dispatch, type Session } from './session';

const started = (mapId: string, variantId?: string): Session => {
  const map = maps.find((m) => m.id === mapId);
  const s = createMapSession(mapId, variantId ?? map?.variants[0]?.id ?? '', false, scripted());
  return dispatch(s, { type: 'start_battle' }, scripted());
};

describe('altıgen geometrisi (görsel pikseli)', () => {
  it('ızgara görseli tam kaplar: 23 yarım genişlik × 7,5 altıgen yüksekliği', () => {
    const s = VIEW.w / 23;
    const hh = VIEW.h / 7.5;
    expect(hexCenter({ col: 0, row: 0 })).toEqual({ x: s, y: hh / 2 });
    expect(hexCenter({ col: 1, row: 0 }).y).toBeCloseTo(hh); // tek sütun yarım altıgen aşağıda
    const last = hexCenter({ col: 14, row: 6 });
    expect(last.x + s).toBeCloseTo(VIEW.w);
    expect(last.y + hh / 2).toBeCloseTo(VIEW.h - hh / 2);
    expect(hexPoints({ col: 0, row: 0 }).split(' ')).toHaveLength(6);
  });
});

describe('haritalı demo oturumu', () => {
  it('12 haritanın her varyantında herkes kendi bölgesine yerleşir, kurulumda başlar', () => {
    for (const m of maps) {
      for (const v of m.variants) {
        const s = createMapSession(m.id, v.id, false, scripted());
        expect(s.error).toBe(null);
        expect(s.state.status).toBe('setup');
        for (const c of Object.values(s.state.combatants)) {
          expect(c.pos).not.toBe(null);
          const zone = startZoneOf(s.state, c.side).map(hexKey);
          expect(zone).toContain(hexKey(c.pos as NonNullable<typeof c.pos>));
        }
      }
    }
  });
  it('aynalanabilir haritada aynalı oturum açılır', () => {
    const s = createMapSession('col', 'gunduz', true, scripted());
    expect(s.state.map?.mirrored).toBe(true);
  });
  it('GM başlatınca savaş başlar', () => {
    expect(started('volkan').state.status).toBe('active');
  });
});

describe('etkileşim yardımcıları', () => {
  it('yürünebilir ve atlanabilir altıgenler motorla tutarlı', () => {
    const s = started('volkan');
    const actorId = s.state.order[s.state.turnIndex] ?? '';
    const movable = movableHexes(s.state, actorId);
    expect(movable.size).toBeGreaterThan(0);
    for (const cost of movable.values()) expect(cost).toBeGreaterThan(0);
    expect(Array.isArray(jumpHexes(s.state, actorId))).toBe(true);
  });
  it('saldırı önizlemesi menzil dışını gerekçesiyle gösterir', () => {
    const s = started('col');
    const st = { ...s.state, turnIndex: s.state.order.indexOf('bor') };
    const choices = attackChoices(st, 'bor', 'troll');
    const sword = choices.find((c) => c.label.startsWith('Longsword'));
    expect(sword?.command).toBe(null);
    expect(sword?.detail).toContain('erişim dışında');
    const bow = choices.find((c) => c.label === 'Light crossbow');
    expect(bow?.detail).toMatch(/altıgen/);
  });
  it('alan büyüsü önizlemesi ve zemin bilgisi', () => {
    const s = started('col');
    const mira = s.state.combatants.mira;
    if (!mira) throw new Error('Mira yok');
    const fireball = areaSpellsOf(mira).find((x) => x.name === 'Fireball');
    expect(fireball).toBeDefined();
    if (fireball) expect(areaPreview(s.state, mira, fireball, { col: 7, row: 3 }).length).toBeGreaterThan(20);
    expect(terrainInfo(s.state, { col: 0, row: 0 })).toContain('"r" Kaya kümesi');
    expect(terrainInfo(s.state, { col: 0, row: 0 })).toContain('3/4 siper');
  });
});
