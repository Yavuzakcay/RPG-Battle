/**
 * Kuyruk P11: ilkel genişletme 5 (kurgusal fikstür `tests/fixtures/paket-p11.json`; kural sürümü 42). Her yeni alan:
 * davranış (42), eski sürümde etkisizlik (41), uçtan uca komutlar baştan oynatılınca aynı durum.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import p11 from '../../../tests/fixtures/paket-p11.json';
import { validatePack } from '../../content/schema';
import { applyPackSubclasses } from '../../content/paket';
import { classData, armor, weapons } from '../../data';
import { armorProficient } from '../../rules/stats';
import { weaponProficient } from '../../rules/mastery';
import { kitArena, o } from '../k54bKit';
import { replay } from '../reduce';
import type { AttackOption, BattleEvent, Combatant } from '../types';
import type { Rng } from '../../rules/dice';

beforeEach(() => {
  const r = validatePack(p11, { taken: classData.subclasses.map((s) => s.id), packs: [] });
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  applyPackSubclasses(r.pack.subclasses);
});
afterEach(() => applyPackSubclasses([]));

type Run = ReturnType<typeof kitArena>;
const club: AttackOption = { label: 'Sopa', attackBonus: 0, damage: '1d6', damageType: 'bludgeoning', ranged: false, spell: false, tag: 'y' };
const patch = (r: Run, id: string, p: Partial<Combatant>) => { r.state = { ...r.state, combatants: { ...r.state.combatants, [id]: { ...(r.state.combatants[id] as Combatant), ...p } } }; };
const only = (r: Run, id: string, ...feats: string[]) => { const c = r.c(id); patch(r, id, { paket: { ...(c.paket as NonNullable<Combatant['paket']>), ozellikler: (c.paket?.ozellikler ?? []).filter((f) => feats.some((x) => f.key.endsWith(`/${x}`))) } }); };
const rebase = (r: Run) => { r.events = [{ type: 'battle_started', state: r.state } as BattleEvent]; };
const same = (r: Run) => {
  const a = replay(r.events).combatants; const b = r.state.combatants;
  for (const id of Object.keys(b)) for (const k of Object.keys({ ...a[id], ...b[id] })) {
    const x = JSON.stringify((a[id] as unknown as Record<string, unknown>)?.[k]); const y = JSON.stringify((b[id] as unknown as Record<string, unknown>)[k]);
    expect(x, `${id}.${k}`).toBe(y);
  }
};
const fixed = (v: number): Rng => () => v;
const turnOf = (r: Run, id: string) => { while (r.state.order[r.state.turnIndex] !== id) r.do({ type: 'end_turn', actorId: r.state.order[r.state.turnIndex] as string }); };
const inspireKey = (c: Combatant) => (c.features ?? []).find((f) => f.effect.kind === 'inspire') as NonNullable<Combatant['features']>[number];

function bard(feats: string[], kuralSurumu?: number): Run {
  const r = kitArena({ cls: 'bard', sub: 'nagme-okulu', level: 5, ...(kuralSurumu ? { kuralSurumu } : {}), place: { A: o(3, 3), B: o(5, 3), C: o(4, 3) } });
  only(r, 'A', ...feats);
  patch(r, 'B', { ac: 30, weaponOptions: [club], hp: 200, maxHp: 200 });
  patch(r, 'C', { weaponOptions: [club] });
  rebase(r);
  return r;
}

describe('P11 G1: ilham zarı yolu', () => {
  it('iade kaynaga: ilhamlı saldırı yine ıskalarsa Bard kullanımı geri gelir; 41\'de gelmez', () => {
    for (const v of [42, 41]) {
      const r = bard(['iade'], v);
      const f = inspireKey(r.c('A'));
      const before = r.c('A').resources[f.resource as string] as number;
      r.do({ type: 'use_feature', actorId: 'A', feature: f.key, targetId: 'C' });
      expect(r.c('A').resources[f.resource as string]).toBe(before - 1);
      turnOf(r, 'C');

      r.do({ type: 'attack', actorId: 'C', targetId: 'B', option: club }, fixed(0.3));
      expect(r.c('C').effects?.some((e) => e.inspire)).toBe(false);
      expect(r.c('A').resources[f.resource as string]).toBe(v === 42 ? before : before - 1);
      same(r);
    }
  });
  it('kaynaksız: kullanım bitince d6 ilham yine verilir; 41\'de verilmez', () => {
    for (const v of [42, 41]) {
      const r = bard(['bedava'], v);
      const f = inspireKey(r.c('A'));
      patch(r, 'A', { resources: { ...r.c('A').resources, [f.resource as string]: 0 }, spellSlots: [0, 0, 0, 0, 0, 0, 0, 0, 0] });
      rebase(r);
      const res = r.try({ type: 'use_feature', actorId: 'A', feature: f.key, targetId: 'C' });
      expect(res.ok).toBe(v === 42);
      if (res.ok) expect(res.state.combatants.C?.effects?.find((e) => e.inspire)?.inspire).toBe('1d6');
    }
  });
  it('hedefler hasar/ac: ilhamlı dost isabette zarı hasara ekler; vurulunca AC\'ye ekleyip ıskalatır', () => {
    const r = bard(['mars']);
    const f = inspireKey(r.c('A'));
    patch(r, 'B', { ac: 5 });
    rebase(r);
    r.do({ type: 'use_feature', actorId: 'A', feature: f.key, targetId: 'C' });
    expect(r.c('C').effects?.find((e) => e.inspire)?.inspireUses).toEqual(['damage', 'ac']);
    turnOf(r, 'C');

    const ev = r.do({ type: 'attack', actorId: 'C', targetId: 'B', option: club }, fixed(0.6));
    const atk = ev.find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>;
    expect(atk.extra?.some((x) => x.label === f.name)).toBe(true);
    expect(r.c('C').effects?.some((e) => e.inspire)).toBe(false);
    same(r);
    // AC: yeniden ilham; B (canavar) C'ye saldırır; zar AC'ye eklenir.
    const r2 = bard(['mars']);
    r2.do({ type: 'use_feature', actorId: 'A', feature: f.key, targetId: 'C' });
    patch(r2, 'C', { ac: 12 });
    turnOf(r2, 'B');
    const hit = r2.gm({ type: 'attack', actorId: 'B', targetId: 'C', option: { ...club, attackBonus: 0 } }, fixed(0.6));
    expect(hit.some((e) => e.type === 'reaction_used' && e.actorId === 'C')).toBe(true);
    expect(r2.c('C').effects?.some((e) => e.inspire)).toBe(false);
  });
  it('yetkinlik: paket alt sınıfı orta zırh, kalkan ve harp silahı verir (seviye ve alt sınıfla)', () => {
    const lw = weapons.find((w) => w.id === 'longsword');
    const who = { subclassId: 'nagme-okulu', level: 3 };
    expect(armorProficient('bard', 'medium')).toBe(false);
    expect(armorProficient('bard', 'medium', {}, who)).toBe(true);
    expect(armorProficient('bard', 'shield', {}, who)).toBe(true);
    expect(armorProficient('bard', 'heavy', {}, who)).toBe(false);
    expect(weaponProficient('bard', lw as NonNullable<typeof lw>, {}, who)).toBe(true);
    expect(armorProficient('bard', 'medium', {}, { subclassId: 'nagme-okulu', level: 2 })).toBe(false);
    void armor;
  });
});

describe('P11 G2: iyileştirme zarı', () => {
  it('zarDegistir kapsam iyilestirme maks: Cure Wounds zarları en yüksek; healed.rolls; 41\'de normal', () => {
    for (const v of [42, 41]) {
      const r = kitArena({ cls: 'sorcerer', sub: 'sifa-damari', level: 5, ...(v === 41 ? { kuralSurumu: 41 } : {}), ally: { hp: 1, maxHp: 60 }, place: { A: o(3, 3), B: o(8, 3), C: o(4, 3) } });
      patch(r, 'A', { spellNames: ['Cure Wounds'], spellSlots: [4, 3, 2, 0, 0, 0, 0, 0, 0] });
      rebase(r);
      const ev = r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Cure Wounds', targetId: 'C', slotLevel: 1 } as never, fixed(0.01));
      const h = ev.find((e) => e.type === 'healed') as Extract<BattleEvent, { type: 'healed' }>;
      if (v === 42) { expect(h.rolls).toEqual([8, 8]); expect(h.changed).toBe('sifa'); } else expect(h.rolls).toBeUndefined();
      same(r);
    }
  });
});
