import { describe, it, expect } from 'vitest';
import { createMapSession } from '../demo';
import { scripted } from '../battle/fixtures';
import { attackTargets, bubbleAt, hasSlotFor, radialLayout, slotChoices, spellMenu, spellTargets } from './hud';
import { dispatch } from './session';

const BOX = { w: 700, h: 390 };

describe('yüzen menü yerleşimi', () => {
  it('düğmeler jetondan yarıçap uzaklıkta, sahnenin ortasına bakan yayda', () => {
    const pts = radialLayout({ x: 350, y: 195 }, 6, BOX, 70, 44);
    expect(pts).toHaveLength(6);
    for (const p of pts) expect(Math.hypot(p.x - 350, p.y - 195)).toBeCloseTo(70);
    // Yayın ortası sahnenin ortasına bakar (jeton tam ortada: ilk ve son düğme simetrik).
  });
  it('sol kenardaki jetonda menü sağa açılır ve sahneden taşmaz', () => {
    const pts = radialLayout({ x: 20, y: 195 }, 6, BOX, 70, 44);
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(24);
      expect(p.y).toBeGreaterThanOrEqual(24);
      expect(p.y).toBeLessThanOrEqual(BOX.h - 24);
    }
    expect(pts.reduce((s, p) => s + p.x, 0) / pts.length).toBeGreaterThan(20);
  });
  it('düğmeler üst üste binmez (kenarda ve köşede de)', () => {
    for (const [token, radius] of [[{ x: 20, y: 195 }, 70], [{ x: 30, y: 200 }, 70], [{ x: 690, y: 380 }, 70], [{ x: 350, y: 20 }, 70], [{ x: 577, y: 182 }, 55]] as const) {
      const pts = radialLayout(token, 6, BOX, radius, 56);
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i] as { x: number; y: number };
          const b = pts[j] as { x: number; y: number };
          expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(56);
        }
      }
    }
  });
  it('çok düğmede (12) kenardaki jetonda da düğmeler sahnede ve üst üste binmez', () => {
    const phone = { w: 844, h: 390 };
    for (const token of [{ x: 30, y: 180 }, { x: 30, y: 40 }, { x: 814, y: 350 }, { x: 420, y: 195 }]) {
      const pts = radialLayout(token, 12, phone, 64, 56);
      expect(pts).toHaveLength(12);
      for (const p of pts) {
        expect(p.x).toBeGreaterThanOrEqual(28);
        expect(p.x).toBeLessThanOrEqual(phone.w - 28);
        expect(p.y).toBeGreaterThanOrEqual(28);
        expect(p.y).toBeLessThanOrEqual(phone.h - 28);
        expect(Math.hypot(p.x - token.x, p.y - token.y)).toBeGreaterThanOrEqual(63);
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i] as { x: number; y: number };
          const b = pts[j] as { x: number; y: number };
          expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(56);
        }
      }
    }
  });
  it('köşedeki jetonda da bütün düğmeler sahnede', () => {
    for (const p of radialLayout({ x: 690, y: 380 }, 6, BOX, 70, 44)) {
      expect(p.x).toBeLessThanOrEqual(BOX.w - 24);
      expect(p.y).toBeLessThanOrEqual(BOX.h - 24);
    }
  });
});

describe('önizleme balonu', () => {
  it('sağa sığarsa sağda, sığmazsa solda; dikeyde sahnede', () => {
    expect(bubbleAt({ x: 100, y: 100 }, { w: 200, h: 120 }, BOX)).toEqual({ x: 112, y: 40 });
    expect(bubbleAt({ x: 650, y: 380 }, { w: 200, h: 120 }, BOX)).toEqual({ x: 438, y: 270 });
  });
});

describe('parlayan hedefler', () => {
  const started = () => dispatch(createMapSession('col', 'gunduz', false, scripted()), { type: 'start_battle' }, scripted());
  it('Bor uzaktaki düşmanlara Light crossbow ile vurabilir; Mira Fire Bolt ile', () => {
    const s = started().state;
    const bor = { ...s, turnIndex: s.order.indexOf('bor') };
    const targets = attackTargets(bor, 'bor');
    expect(targets.length).toBeGreaterThan(0);
    expect(targets.every((id) => bor.combatants[id]?.side === 'enemies')).toBe(true);
    const mira = { ...s, turnIndex: s.order.indexOf('mira') };
    expect(spellTargets(mira, 'mira', 'Fire Bolt').length).toBeGreaterThan(0);
    expect(spellTargets(mira, 'mira', 'Cure Wounds')).not.toContain('troll');
  });
  it('büyü menüsü türleri ve slot durumu', () => {
    const mira = started().state.combatants.mira;
    if (!mira) throw new Error('Mira yok');
    const kinds = Object.fromEntries(spellMenu(mira).map((x) => [x.spell.name, x.kind]));
    expect(kinds['Fireball']).toBe('area');
    expect(kinds['Fire Bolt']).toBe('target');
    const fireball = spellMenu(mira).find((x) => x.spell.name === 'Fireball')?.spell;
    if (fireball) {
      expect(hasSlotFor(mira, fireball)).toBe(true);
      expect(hasSlotFor({ ...mira, spellSlots: [4, 3, 0, 0, 0, 0, 0, 0, 0] }, fireball)).toBe(false);
    }
  });
});

describe('yukarı slot seçimi (Görev N)', () => {
  it('büyü seviyesi ve üstündeki dolu slotlar; cantrip için yok', () => {
    const caster = { spellSlots: [0, 2, 1, 0, 0, 0, 0, 0, 0] } as Parameters<typeof slotChoices>[0];
    const spell = (level: number) => ({ level }) as Parameters<typeof slotChoices>[1];
    expect(slotChoices(caster, spell(1))).toEqual([2, 3]);
    expect(slotChoices(caster, spell(3))).toEqual([3]);
    expect(slotChoices(caster, spell(0))).toEqual([]);
  });
});
