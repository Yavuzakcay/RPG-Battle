/**
 * Gece kuyruğu Aşama 3b (kural sürümü 102, büyü verisinde `b102` bloğu): SRD 5.2.1 tam tarama düzeltmeleri. Her büyü 102'de
 * SRD, 101'de eski davranış; replay `run` içinde denetlenir.
 */
import { describe, expect, it } from 'vitest';
import { spells } from '../data';
import { execute } from './index';
import { GM, mk, P1 } from './fixtures';
import { caster, field, run } from './k19spells.test';
import { BUYU_TAM_VERSION, buyuTamOn } from './buyuTamSurum';
import { mechanicsAt } from './spellVersion';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const NEW = BUYU_TAM_VERSION;
const OLD = BUYU_TAM_VERSION - 1;
const LOW = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };
const ALL = [4, 3, 3, 3, 3, 3, 2, 2, 1];
const cast = (spellName: string, extra: Record<string, unknown> = {}) => ({ type: 'cast_spell', actorId: 'A', spellName, ...extra }) as Command;
const wiz = (names: string[], p: Partial<Combatant> = {}) => caster({ spellNames: names, spellSlots: ALL, concentration: null, level: 17, ...p });
const foe = (id: string) => mk(id, { side: 'enemies', hp: 400, maxHp: 400, saves: LOW });
const ally = (id: string, p: Partial<Combatant> = {}) => mk(id, { ownerId: 'p1', ...p });
const err = (s: BattleState, cmd: Command) => { const r = execute(s, cmd, P1, () => 0.5); return r.ok ? '' : r.error; };
const sp = (name: string) => spells.find((x) => x.name === name)!;

describe('BUYU-TAM: sabit', () => {
  it('kural sürümü 102', () => {
    expect(BUYU_TAM_VERSION).toBe(102);
    expect(buyuTamOn({ kuralSurumu: 102 })).toBe(true);
    expect(buyuTamOn({ kuralSurumu: 101 })).toBe(false);
  });
});

describe('BUYU-TAM Confusion: yukarı slotta yarıçap +5 ft (SRD "The Sphere’s radius increases by 5 feet")', () => {
  // Merkez (8,3); F0 merkezde, F1 3 altıgen (15 ft) uzakta.
  const pos = { A: { col: 1, row: 3 }, F0: { col: 8, row: 3 }, F1: { col: 11, row: 3 } };
  const hit = (v: number, slot: number) => {
    const r = run(field([wiz(['Confusion']), foe('F0'), foe('F1')], pos, v), cast('Confusion', { targetHex: { col: 8, row: 3 }, slotLevel: slot }));
    return r.events.filter((e): e is Extract<BattleEvent, { type: 'save_resolved' }> => e.type === 'save_resolved').map((e) => e.targetId);
  };
  it('102: 5. seviye slotta 15 ft yarıçap (F1 alanda); 4. seviyede 10 ft', () => {
    expect(hit(NEW, 5)).toContain('F1');
    expect(hit(NEW, 4)).not.toContain('F1');
  });
  it('101: yarıçap hep 10 ft', () => {
    expect(hit(OLD, 5)).not.toContain('F1');
  });
});

describe('BUYU-TAM Conjure Elemental: süre 10 dakika (SRD "Concentration, up to 10 minutes")', () => {
  it('102: alan 100 tur; 101: 10 tur', () => {
    expect((mechanicsAt({ kuralSurumu: NEW }, sp('Conjure Elemental')).zone as { rounds?: number }).rounds).toBe(100);
    expect((mechanicsAt({ kuralSurumu: OLD }, sp('Conjure Elemental')).zone as { rounds?: number }).rounds).toBe(10);
  });
});

describe('BUYU-TAM Etherealness: yukarı slotta slot başına 3 istekli yaratık, 10 ft içinde (SRD)', () => {
  const scene = (v: number) => field([wiz(['Etherealness']), ally('B'), foe('F0')], { A: { col: 2, row: 3 }, B: { col: 3, row: 3 }, F0: { col: 13, row: 3 } }, v);
  it('102: 8. seviye slotta büyücü + dost; 7. seviyede yalnız büyücü; büyücüsüz hedef olmaz', () => {
    const r = run(scene(NEW), cast('Etherealness', { targetIds: ['A', 'B'], slotLevel: 8 }));
    expect(r.state.combatants.B?.effects?.some((e) => e.ethereal)).toBe(true);
    expect(err(scene(NEW), cast('Etherealness', { targetIds: ['A', 'B'], slotLevel: 7 }))).not.toBe('');
    expect(err(scene(NEW), cast('Etherealness', { targetIds: ['B'], slotLevel: 8 }))).not.toBe('');
  });
  it('101: yalnız büyücü', () => {
    expect(err(scene(OLD), cast('Etherealness', { targetIds: ['A', 'B'], slotLevel: 8 }))).not.toBe('');
  });
});

describe('BUYU-TAM Mass Cure Wounds: hedefler menzil içinde merkezli 30 ft kürede (SRD)', () => {
  // B ve C 13 altıgen (65 ft) aralıklı: tek 30 ft küreye sığmaz (çap 60 ft); D, B'nin yanında.
  const scene = (v: number) => field([wiz(['Mass Cure Wounds']), ally('B', { hp: 5 }), ally('C', { hp: 5 }), ally('D', { hp: 5 }), foe('F0')],
    { A: { col: 7, row: 3 }, B: { col: 0, row: 3 }, C: { col: 13, row: 3 }, D: { col: 1, row: 3 }, F0: { col: 7, row: 6 } }, v);
  it('102: sığmayan hedefler reddedilir, aynı küredekiler iyileşir', () => {
    expect(err(scene(NEW), cast('Mass Cure Wounds', { targetIds: ['B', 'C'] }))).toMatch(/küre/);
    const r = run(scene(NEW), cast('Mass Cure Wounds', { targetIds: ['B', 'D'] }));
    expect(r.state.combatants.B!.hp).toBeGreaterThan(5);
  });
  it('101: menzil içindeki herkes (eski)', () => {
    expect(err(scene(OLD), cast('Mass Cure Wounds', { targetIds: ['B', 'C'] }))).toBe('');
  });
});

describe('BUYU-TAM Earthquake: başarısız save konsantrasyonu bozar (SRD "its Concentration is broken")', () => {
  const pos = { A: { col: 1, row: 3 }, F0: { col: 8, row: 3 } };
  const quake = (v: number) => run(field([wiz(['Earthquake']), mk('F0', { side: 'enemies', hp: 400, maxHp: 400, saves: LOW,
    concentration: { spell: 'Bless', slotLevel: 1, turn: '0:0' } as Combatant['concentration'] })], pos, v), cast('Earthquake', { targetHex: pos.F0 }));
  it('102: Prone + konsantrasyon biter; 101: konsantrasyon sürer (veri alanı `breakConcentration` okunmuyordu)', () => {
    const r = quake(NEW);
    expect(r.state.combatants.F0?.conditions).toContain('Prone');
    expect(r.state.combatants.F0?.concentration).toBeNull();
    expect(quake(OLD).state.combatants.F0?.concentration?.spell).toBe('Bless');
  });
});

// GM bağlamı yalnız ithalat bütünlüğü için.
void GM;
