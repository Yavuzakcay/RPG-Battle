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
import { forcedMove } from '../motion';
import { poolChances } from './p11';
import { summonOrigins } from './p11cast';
import { actionDescriptors } from '../ai/actions';
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
const seqRng = (vs: number[], rest = 0.5): Rng => { let i = 0; return () => (i < vs.length ? vs[i++] as number : rest); };
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
  it('K58 G8: çıkış noktası seçenekleri ve yapay zekâ adayı (originId)', () => {
    const r = caster('wizard', 'murekkep-ruhu', ['Shocking Grasp'], { place: { A: o(0, 0), B: o(6, 3), C: o(1, 0) },
      extra: [mk('F', { ownerId: 'p1', hp: 5, maxHp: 5, summon: { by: 'A', spellId: 'pk', spell: 'pk', turn: 'after-owner', level: 1 } })] });
    patch(r, 'F', { pos: o(5, 3) });
    expect(summonOrigins(r.state, r.c('A')).map((c) => c.id)).toEqual(['F']);
    expect(summonOrigins(r.state, r.c('C'))).toEqual([]);
    const d = actionDescriptors().find((x) => x.id === 'paket:cikis');
    const cands = d?.gen(r.state, r.c('A'), { canAct: true, foes: [r.c('B')], allies: [] } as never) ?? [];
    const c = cands.find((x) => x && x.type === 'cast_spell' && x.spellName === 'Shocking Grasp' && x.targetId === 'B');
    expect(c && 'originId' in c ? c.originId : undefined).toBe('F');
    expect(r.try(c as never).ok).toBe(true);
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

describe('P11 G4–G7', () => {
  it('komutSaldiri: komut verilen çağrı eylemden sonra bir ek saldırı yapar; 41\'de yapamaz', () => {
    for (const v of [42, 41]) {
      const bite = { name: 'Bite', bonus: 20, damageDice: '1d4', damageType: 'piercing', repeat: 1, ranged: false, reachFt: 5, text: '' };
      const r = kitArena({ cls: 'ranger', sub: 'suru-cobani', level: 11, ...(v === 41 ? { kuralSurumu: 41 } : {}), place: { A: o(3, 3), B: o(6, 3), C: o(0, 0) },
        extra: [mk('W', { ownerId: 'p1', hp: 20, maxHp: 20, attacks: [bite], summon: { by: 'A', spellId: 'pk', spell: 'pk', turn: 'after-owner', level: 1, commandBonus: true } })] });
      patch(r, 'W', { pos: o(5, 3) });
      patch(r, 'B', { hp: 200, maxHp: 200 });
      rebase(r);
      r.do({ type: 'command_summons', actorId: 'A' } as never);
      turnOf(r, 'W');
      r.do({ type: 'monster_attack', actorId: 'W', targetId: 'B', attackIndex: 0 } as never);
      const second = r.try({ type: 'monster_attack', actorId: 'W', targetId: 'B', attackIndex: 0 } as never);
      expect(second.ok).toBe(v === 42);
    }
  });
  it('zarYarisi: kazanınca hedef işaretlenir ve avantajsız Sneak Attack; kaybedince işaret yok', () => {
    const run = (rng: Rng) => {
      const r = kitArena({ cls: 'rogue', sub: 'iz-surucu', level: 5, place: { A: o(3, 3), B: o(4, 3), C: o(0, 0) } });
      patch(r, 'B', { hp: 200, maxHp: 200, ac: 5 });
      rebase(r);
      r.do({ type: 'use_feature', actorId: 'A', feature: 'pk:iz-surucu/yaris:bonus', targetId: 'B' }, rng);
      return r;
    };
    const win = run(seqRng([0.95, 0.05]));
    expect(win.c('B').effects?.find((e) => e.sneakFor === 'A')).toBeDefined();
    const dagger = win.c('A').weaponOptions.find((w) => w.finesse) ?? { ...club, finesse: true };
    const ev = win.do({ type: 'attack', actorId: 'A', targetId: 'B', option: { ...dagger, finesse: true } }, fixed(0.6));
    const atk = ev.find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>;
    expect(atk.extra?.some((x) => x.label === 'Sneak Attack')).toBe(true);
    same(win);
    const lose = run(seqRng([0.05, 0.95]));
    expect(lose.c('B').effects?.some((e) => e.sneakFor)).toBeFalsy();
  });
  it('direnc hasarKaynagi buyu: büyü hasarı yarıya, silah hasarı tam; aura dostu da korur', () => {
    const r = kitArena({ cls: 'paladin', sub: 'buyu-kalkani', level: 7, place: { A: o(3, 3), B: o(6, 3), C: o(4, 3) },
      enemy: { spellNames: ['Fire Bolt'], spellAttack: 30, spellSaveDc: 13, spellMod: 3, level: 5, weaponOptions: [{ ...club, attackBonus: 30, reachFt: 30 }] } });
    rebase(r);
    turnOf(r, 'B');
    const hp = r.c('C').hp;
    const ev = r.gm({ type: 'cast_spell', actorId: 'B', spellName: 'Fire Bolt', targetId: 'C' } as never, fixed(0.6));
    const a = ev.find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>;
    expect(a.damageNote).toBe('resistant');
    expect(r.c('C').hp).toBe(hp - (a.appliedDamage ?? 0));
    // Silah hasarı direnilmez.
    r.fresh('B');
    const w = r.gm({ type: 'attack', actorId: 'B', targetId: 'C', option: { ...club, attackBonus: 30, reachFt: 30 } }, fixed(0.6)).find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>;
    expect(w.damageNote).toBeNull();
    // 41: direnç yok.
    const old = kitArena({ cls: 'paladin', sub: 'buyu-kalkani', level: 7, kuralSurumu: 41, place: { A: o(3, 3), B: o(6, 3), C: o(4, 3) },
      enemy: { spellNames: ['Fire Bolt'], spellAttack: 30, spellSaveDc: 13, spellMod: 3, level: 5 } });
    turnOf(old, 'B');
    const o41 = old.gm({ type: 'cast_spell', actorId: 'B', spellName: 'Fire Bolt', targetId: 'C' } as never, fixed(0.6)).find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>;
    expect(o41.damageNote).toBeNull();
  });
  it('itmeDirenci: itmeye avantajlı STR kurtulması (başarıda kımıldamaz); yetenekEki: yakın büyüye CON', () => {
    const r = kitArena({ cls: 'sorcerer', sub: 'tas-kani', level: 5, scores: { con: 18 }, place: { A: o(3, 3), B: o(4, 3), C: o(0, 0) } });
    patch(r, 'B', { hp: 200, maxHp: 200 });
    rebase(r);
    const before = r.c('A').pos;
    const evs = forcedMove(r.state, 'A', 'push', 10, 'B', fixed(0.99), { origin: o(4, 3) });
    expect(evs.some((e) => e.type === 'pushed')).toBe(false);
    const moved = forcedMove(r.state, 'A', 'push', 10, 'B', fixed(0.01), { origin: o(4, 3) });
    expect(moved.some((e) => e.type === 'pushed')).toBe(true);
    void before;
    patch(r, 'A', { spellNames: ['Shocking Grasp'] });
    rebase(r);
    const ev = r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Shocking Grasp', targetId: 'B' } as never, fixed(0.95));
    const sg = ev.find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>;
    expect(sg.rawDamage).toBe((sg.damageRolls ?? []).reduce((n, x) => n + x, 0) + 4);
  });
  it('zarHavuzu: savaş başı en az 2; başarısız saldırıya zar (tutarsa harcanır), hasara zar, seviye tablosu', () => {
    const r = kitArena({ cls: 'fighter', sub: 'taktik-zar', level: 10, place: { A: o(3, 3), B: o(4, 3), C: o(0, 0) } });
    const key = 'pk-taktik-zar-taktik';
    expect(r.c('A').resources[key]).toBeGreaterThanOrEqual(2);
    patch(r, 'A', { weaponOptions: [club], resources: { ...r.c('A').resources, [key]: 2 } });
    patch(r, 'B', { hp: 200, maxHp: 200, ac: 12 });
    rebase(r);
    expect(poolChances(r.c('A'), 'attack')).toMatchObject([{ die: '1d10', reroll: 'onFail', resource: key }]);
    expect(poolChances(r.c('A'), 'save')).toEqual([]);
    const ev = r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: club }, fixed(0.6));
    const atk = ev.find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>;
    expect(atk.extra?.find((x) => x.label === 'taktik')?.rolls.every((v) => v <= 10)).toBe(true);
    expect(r.c('A').resources[key]).toBe(1);
    same(r);
  });
});
