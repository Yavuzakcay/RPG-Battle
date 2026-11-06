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
import { mk } from '../fixtures';
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
const turnOf = (r: Run, id: string) => { while (r.state.order[r.state.turnIndex] !== id) { const cur = r.state.order[r.state.turnIndex] as string; const cmd = { type: 'end_turn' as const, actorId: cur }; if (r.c(cur).side === 'enemies') r.gm(cmd); else r.do(cmd); } };
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

describe('P11 G3: büyü yapımı', () => {
  const caster = (cls: string, sub: string, spellNames: string[], extra: Partial<Parameters<typeof kitArena>[0]> = {}, level = 7) => {
    const r = kitArena({ cls, sub, level, place: { A: o(3, 3), B: o(6, 3), C: o(4, 3) }, ...extra });
    patch(r, 'A', { spellNames: [...new Set([...r.c('A').spellNames, ...spellNames])], spellSlots: [4, 3, 3, 1, 0, 0, 0, 0, 0], spellSaveDc: 15, spellAttack: 7 });
    patch(r, 'B', { hp: 200, maxHp: 200, creatureType: 'humanoid' });
    rebase(r);
    return r;
  };
  const pk = (r: Run, sub: string, k: string) => r.c('A').resources[`pk-${sub}-${k}`];

  it('ikiz: Hold Person iki hedefe (paket kaynağıyla); 41\'de Twinned bilinmiyor', () => {
    const r = caster('wizard', 'ikiz-ayna', ['Hold Person']);
    expect(r.c('A').pkTwin).toMatchObject({ cost: 1 });
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Hold Person', targetIds: ['B', 'C'], slotLevel: 2, metamagic: ['twinned'] } as never, fixed(0.01));
    expect(pk(r, 'ikiz-ayna', 'ayna')).toBe(1);
    same(r);
    const old = caster('wizard', 'ikiz-ayna', ['Hold Person'], { kuralSurumu: 41 });
    expect(old.try({ type: 'cast_spell', actorId: 'A', spellName: 'Hold Person', targetIds: ['B', 'C'], slotLevel: 2, metamagic: ['twinned'] } as never).ok).toBe(false);
  });
  it('buyuSakla: Magic Missile saklanır (slot harcanır, hasar yok), bonus eylemle ateşlenir (slot yeniden harcanmaz)', () => {
    const r = caster('wizard', 'zaman-muhru', ['Magic Missile']);
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Magic Missile', targetId: 'B', slotLevel: 1, store: true } as never);
    expect(r.c('A').spellSlots[0]).toBe(3);
    expect(r.c('B').hp).toBe(200);
    expect(r.c('A').effects?.find((e) => e.storedSpell)?.storedSpell).toMatchObject({ spellName: 'Magic Missile', slotLevel: 1, cost: 'bonus' });
    r.do({ type: 'spell_followup', actorId: 'A', targetId: 'B', choice: 'sakli' });
    expect(r.c('B').hp).toBeLessThan(200);
    expect(r.c('A').spellSlots[0]).toBe(3);
    expect(r.c('A').effects?.some((e) => e.storedSpell)).toBe(false);
    expect(r.c('A').economy.bonus).toBe(true);
    same(r);
    const old = caster('wizard', 'zaman-muhru', ['Magic Missile'], { kuralSurumu: 41 });
    old.do({ type: 'cast_spell', actorId: 'A', spellName: 'Magic Missile', targetId: 'B', slotLevel: 1, store: true } as never);
    expect(old.c('B').hp).toBeLessThan(200);
  });
  it('konsantrasyonsuz (kaynakla): Bless konsantrasyonsuz, etkiler süreli; 41\'de konsantrasyon', () => {
    for (const v of [42, 41]) {
      const r = caster('wizard', 'murekkep-ruhu', ['Bless'], v === 41 ? { kuralSurumu: 41 } : {});
      r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Bless', targetIds: ['A', 'C'], slotLevel: 1 } as never);
      const fx = r.c('C').effects?.find((e) => e.dice);
      if (v === 42) { expect(r.c('A').concentration).toBeFalsy(); expect(fx?.concentration).toBeUndefined(); expect(fx?.until).toBeGreaterThan(1); expect(pk(r, 'murekkep-ruhu', 'murekkep')).toBe(1); }
      else expect(r.c('A').concentration?.spell).toBe('Bless');
      same(r);
    }
  });
  it('buyuVer konsantrasyonsuz (bedava listesi): Hold Person bedava ve konsantrasyonsuz', () => {
    const r = caster('warlock', 'derin-kavrayis', []);
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Hold Person', targetId: 'B' } as never, fixed(0.01));
    expect(r.c('A').concentration).toBeFalsy();
    expect(pk(r, 'derin-kavrayis', 'kavra')).toBe(0);
    expect(r.c('B').conditions).toContain('Paralyzed');
    same(r);
  });
  it('kopya: bilinmeyen 3. seviyeye dek büyü slotsuz (kaynakla); 41\'de bilinmiyor', () => {
    const r = caster('warlock', 'dilek-cini', []);
    const slots = [...r.c('A').spellSlots];
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Magic Missile', targetId: 'B' } as never);
    expect(r.c('B').hp).toBeLessThan(200);
    expect(r.c('A').spellSlots).toEqual(slots);
    expect(pk(r, 'dilek-cini', 'dilek')).toBe(0);
    expect(r.try({ type: 'cast_spell', actorId: 'A', spellName: 'Magic Missile', targetId: 'B' } as never).ok).toBe(false);
    same(r);
    const old = caster('warlock', 'dilek-cini', [], { kuralSurumu: 41 });
    expect(old.try({ type: 'cast_spell', actorId: 'A', spellName: 'Magic Missile', targetId: 'B' } as never).ok).toBe(false);
  });
  it('yalnızKendine: Polymorph bedava yalnız kendine; başkasına slotla', () => {
    const r = caster('wizard', 'bicim-ustasi', ['Polymorph']);
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Polymorph', targetId: 'B' } as never, fixed(0.01));
    expect(r.c('A').spellSlots[3]).toBe(0);
    expect(pk(r, 'bicim-ustasi', 'bicim')).toBe(1);
    const r2 = caster('wizard', 'bicim-ustasi', ['Polymorph']);
    r2.do({ type: 'cast_spell', actorId: 'A', spellName: 'Polymorph', targetId: 'A' } as never, fixed(0.01));
    expect(r2.c('A').spellSlots[3]).toBe(1);
    expect(pk(r2, 'bicim-ustasi', 'bicim')).toBe(0);
  });
  it('buyuIptal calar: engellenen büyü çalınır, slotsuz bir kez yapılır', () => {
    const r = kitArena({ cls: 'rogue', sub: 'el-cabuk', level: 17, place: { A: o(3, 3), B: o(6, 3), C: o(4, 3) },
      enemy: { spellNames: ['Magic Missile'], spellSlots: [4, 0, 0, 0, 0, 0, 0, 0, 0], spellAttack: 5, spellSaveDc: 13, spellMod: 3 } });
    patch(r, 'A', { spellAttack: 7, spellSaveDc: 15, spellMod: 3 });
    rebase(r);
    turnOf(r, 'B');
    r.gm({ type: 'cast_spell', actorId: 'B', spellName: 'Magic Missile', targetId: 'C' } as never);
    expect(r.c('A').effects?.find((e) => e.grantSpell)?.grantSpell?.spellName).toBe('Magic Missile');
    turnOf(r, 'A');
    const hp = r.c('B').hp;
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Magic Missile', targetId: 'B' } as never);
    expect(r.c('B').hp).toBeLessThan(hp);
    expect(r.c('A').effects?.some((e) => e.grantSpell)).toBe(false);
    same(r);
  });
  it('cikisCagri: büyü kendi çağrısının altıgeninden çıkar (menzil oradan); başkasının yaratığından olmaz', () => {
    const r = caster('wizard', 'murekkep-ruhu', ['Shocking Grasp'], { place: { A: o(0, 0), B: o(6, 3), C: o(1, 0) },
      extra: [mk('F', { ownerId: 'p1', hp: 5, maxHp: 5, summon: { by: 'A', spellId: 'pk', spell: 'pk', turn: 'after-owner', level: 1 } })] });
    patch(r, 'F', { pos: o(5, 3) });
    rebase(r);
    expect(r.try({ type: 'cast_spell', actorId: 'A', spellName: 'Shocking Grasp', targetId: 'B' } as never).ok).toBe(false);
    expect(r.try({ type: 'cast_spell', actorId: 'A', spellName: 'Shocking Grasp', targetId: 'B', originId: 'C' } as never).ok).toBe(false);
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Shocking Grasp', targetId: 'B', originId: 'F' } as never, fixed(0.9));
    expect(r.c('A').pos).toEqual(o(0, 0));
    same(r);
  });
  it('gucDeposu: slotlu büyüyle güç birikir, silah isabetinde boşalır', () => {
    const r = caster('bard', 'ezgi-deposu', ['Healing Word'], {}, 5);
    patch(r, 'A', { weaponOptions: [{ ...club, attackBonus: 20 }] });
    rebase(r);
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Healing Word', targetId: 'C' } as never);
    expect(r.c('A').effects?.find((e) => e.pkCharge)?.pkCharge).toBe(1);
    const ev = r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: { ...club, attackBonus: 20, reachFt: 15 } }, fixed(0.5));
    const atk = ev.find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>;
    expect(atk.extra?.some((x) => x.label === 'depo')).toBe(true);
    expect(r.c('A').effects?.some((e) => e.pkCharge)).toBe(false);
    same(r);
  });
});
