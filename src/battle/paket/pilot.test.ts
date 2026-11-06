/**
 * Görev P0 G5: kurgusal pilot paketi (`tests/fixtures/paket-pilot.json`; 4 uydurma alt sınıf, 25 ilkelin hepsi) ile
 * uçtan uca: (a) tepki + işaret + direnç, (b) ek hasar + zorla hareket + uçuş + tepki, (c) çağırma + aura, (d) iyileştirme +
 * geçici can + ölümden dönüş; her ilkel en az bir kez; replay aynı; paket yüklü değilken hiçbir şey değişmez.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import pilot from '../../../tests/fixtures/paket-pilot.json';
import p6 from '../../../tests/fixtures/paket-p6.json';
import p7 from '../../../tests/fixtures/paket-p7.json';
import { validatePack } from '../../content/schema';
import { applyPackSubclasses } from '../../content/paket';
import { ILKEL_ADLARI } from '../../content/ilkelSema';
import { classData } from '../../data';
import { classKit, freeSpellResource } from '../../rules/classFeatures';
import { kitArena, kitHero, mid, high, low, o } from '../k54bKit';
import { applyEvents, replay } from '../reduce';
import { execute } from '../commands';
import { chooseCommand } from '../ai';
import { GM, P1 } from '../fixtures';
import { paketSpellBonus } from './core';
import { markId, formId } from './core';
import type { AttackOption, BattleEvent, BattleState, Combatant } from '../types';

const sword: AttackOption = { label: 'Kılıç', attackBonus: 8, damage: '1d8+3', damageType: 'slashing', ranged: false, spell: false, tag: 'x' };
const club: AttackOption = { label: 'Sopa', attackBonus: 10, damage: '1d6', damageType: 'bludgeoning', ranged: false, spell: false, tag: 'y' };
const load = () => {
  const r = validatePack(pilot, { taken: classData.subclasses.map((s) => s.id), packs: [] });
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  applyPackSubclasses(r.pack.subclasses);
  return r;
};
beforeEach(() => { load(); });
afterEach(() => applyPackSubclasses([]));

type Run = ReturnType<typeof kitArena>;
const arm = (r: Run, id: string, opt: AttackOption = sword) => { r.state = { ...r.state, combatants: { ...r.state.combatants, [id]: { ...(r.state.combatants[id] as Combatant), weaponOptions: [opt] } } }; };
const patch = (r: Run, id: string, p: Partial<Combatant>) => { r.state = { ...r.state, combatants: { ...r.state.combatants, [id]: { ...(r.state.combatants[id] as Combatant), ...p } } }; };
const pk = (sub: string, feat: string, tetik: string) => `pk:${sub}/${feat}:${tetik}`;
const use = (key: string, targetId?: string, to?: { col: number; row: number }) => ({ type: 'use_feature' as const, actorId: 'A', feature: key, ...(targetId ? { targetId } : {}), ...(to ? { to } : {}) });
const same = (r: Run) => expect(JSON.stringify(replay(r.events).combatants)).toBe(JSON.stringify(r.state.combatants));
/** Elle yamadan sonra kaydı yeniden başlat (replay yalnız olaylardan; test yamaları olay değildir). */
const rebase = (r: Run) => { r.events = [{ type: 'battle_started', state: r.state } as BattleEvent]; };
/** Sıra bu savaşçıda (GM komutları için). */
const turnOf = (r: Run, id: string) => { r.state = { ...r.state, turnIndex: r.state.order.indexOf(id) }; };

describe('pilot paketi', () => {
  it('doğrulanır: 1 uyarı (yedek jeton), her ilkel en az bir kez kullanılmış', () => {
    const r = load();
    expect(r.warnings.map((w) => w.code)).toEqual(['jetonYedek']);
    // P6/P7: yeni ilkeller sonraki kurgusal fikstürlerde (tests/fixtures/paket-p6.json, paket-p7.json).
    const used = new Set([...pilot.subclasses, ...p6.subclasses, ...p7.subclasses].flatMap((s) => s.features.flatMap((f) => ((f as { ilkeller?: Array<{ tur: string }> }).ilkeller ?? []).map((p) => p.tur))));
    expect([...used].sort()).toEqual([...ILKEL_ADLARI].sort());
  });
  it('kaynaklar sınıf kaynakları tablosunda; buyuVer.bedava büyüyü slotsuz yaptırır', () => {
    const a = kitHero({ cls: 'druid', sub: 'kul-cagirani', level: 10 });
    expect(a.resources['pk-kul-cagirani-cagri']).toBe(4);
    expect(freeSpellResource('Misty Step', a.resources)).toBe('pk-kul-cagirani-cagri');
    expect(classKit('druid', 10, 'kul-cagirani').alwaysPrepared).toContain('Misty Step');
    expect(a.paket?.ozellikler.map((f) => f.key)).toContain('kul-cagirani/kul-patlamasi');
  });
});

describe('(a) Kehribar Nöbetçisi: tepki + işaret + direnç', () => {
  const A = () => kitArena({ cls: 'fighter', sub: 'kehribar-nobetci', level: 10, place: { A: o(3, 3), B: o(4, 3), C: o(5, 3) } });
  it('düğmeler, pasifler (inisiyatif, WIS kurtulma), tepkiler', () => {
    const r = A();
    const a = r.c('A');
    expect(r.keys()).toEqual(expect.arrayContaining([pk('kehribar-nobetci', 'av-isareti', 'bonus'), pk('kehribar-nobetci', 'dev-boyu', 'bonus'), pk('kehribar-nobetci', 'omuz-omuza', 'bonus')]));
    expect(a.effects?.find((e) => e.saveMod)?.saveMod?.wis).toBe(1);
    expect(a.initiativeBonus).toBe(kitHero({ cls: 'fighter', sub: 'champion', level: 10 }).initiativeBonus + 2);
    expect(a.reactions?.find((x) => x.kind === 'reduce')?.dice).toBe('1d10+2');
  });
  it('işaret: işaretleyenin saldırısı avantajlı; düşük canda koşullu direnç eklenir', () => {
    const r = A();
    r.do(use(pk('kehribar-nobetci', 'av-isareti', 'bonus'), 'B'));
    expect(r.c('B').effects?.some((e) => e.id === markId('A', 'av') && e.attackedAdvBy === 'A')).toBe(true);
    same(r);
    arm(r, 'A');
    const ev = r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: sword }).find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>;
    expect(ev.mode).toBe('advantage');
    patch(r, 'A', { hp: 5 });
    r.fresh();
    rebase(r);
    r.do(use(pk('kehribar-nobetci', 'dev-boyu', 'bonus')));
    expect(r.c('A').effects?.some((e) => e.resist?.includes('necrotic'))).toBe(true);
    expect(r.c('A').effects?.some((e) => e.size === 1 && e.hitDie === '1d4')).toBe(true);
    expect(r.c('A').resources['pk-kehribar-nobetci-nobet']).toBe(3);
    same(r);
  });
  it('Kalkan Sözü: dosta isabet AC +2 ile ıskaya döner, kaynak harcanır', () => {
    const r = A();
    patch(r, 'C', { ac: 20 });
    arm(r, 'B', club);
    turnOf(r, 'B');
    const res = execute(r.state, { type: 'attack', actorId: 'B', targetId: 'C', option: club }, GM, mid);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const atk = res.events.find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>;
    expect(atk.total).toBe(21);
    expect(atk.hit).toBe(false);
    expect(res.events.some((e) => e.type === 'reaction_used' && e.actorId === 'A')).toBe(true);
    expect(res.state.combatants.A!.resources['pk-kehribar-nobetci-nobet']).toBe(3);
  });
  it('Omuz Omuza: dost tepkisiyle saldırır', () => {
    const r = A();
    arm(r, 'C');
    const ev = r.do(use(pk('kehribar-nobetci', 'omuz-omuza', 'bonus'), 'C'));
    expect(ev.some((e) => e.type === 'reaction_used' && e.actorId === 'C')).toBe(true);
    expect(ev.some((e) => e.type === 'attack_resolved' && e.actorId === 'C')).toBe(true);
  });
});

describe('(b) Rüzgâr Kartalı: ek hasar + zorla hareket + uçuş + tepki', () => {
  const B = () => kitArena({ cls: 'ranger', sub: 'ruzgar-kartali', level: 11, place: { A: o(3, 3), B: o(4, 3), C: o(0, 8) } });
  it('isabette 2d6 gök gürültüsü + 10 ft itme, turda bir', () => {
    const r = B();
    arm(r, 'A');
    rebase(r);
    const ev = r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: sword }, high);
    const atk = ev.find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>;
    expect(atk.extra?.find((x) => x.label === 'Fırtına Oku')?.rolls).toHaveLength(2 * (atk.critical ? 2 : 1));
    expect(ev.filter((e) => e.type === 'pushed').length).toBeGreaterThanOrEqual(1);
    expect(r.c('B').pos).not.toEqual(o(4, 3));
    patch(r, 'B', { pos: o(4, 3) });
    patch(r, 'A', { economy: { ...r.c('A').economy, attacksLeft: 1 } });
    const ev2 = r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: sword }, high);
    expect((ev2.find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>).extra?.some((x) => x.label === 'Fırtına Oku')).toBeFalsy();
  });
  it('pasif hız; uçuş (bonus, kaynak); ışınlanma; tepkiler', () => {
    const r = B();
    expect(r.c('A').effects?.some((e) => e.speedFt === 10)).toBe(true);
    r.do(use(pk('ruzgar-kartali', 'kanat-cirpisi', 'bonus')));
    expect(r.c('A').effects?.some((e) => e.fly === 30)).toBe(true);
    expect(r.c('A').resources['pk-ruzgar-kartali-kanat']).toBe(1);
    same(r);
    r.fresh();
    const ev = r.do(use(pk('ruzgar-kartali', 'ruzgar-adimi', 'bonus'), undefined, o(7, 5)));
    expect(ev.some((e) => e.type === 'teleported')).toBe(true);
    expect(r.c('A').pos).toEqual(o(7, 5));
    expect(r.c('A').resources['pk-ruzgar-kartali-kanat']).toBe(0);
    r.fresh();
    expect(r.try(use(pk('ruzgar-kartali', 'ruzgar-adimi', 'bonus'), undefined, o(8, 5))).ok).toBe(false);
    const kinds = (r.c('A').reactions ?? []).map((x) => x.kind);
    expect(kinds).toEqual(expect.arrayContaining(['parry', 'retaliate']));
    expect(r.c('A').reactions?.find((x) => x.kind === 'parry')).toMatchObject({ acBonus: 3, ranged: true });
  });
});

describe('(c) Kül Çağıranı: çağırma + aura', () => {
  const C = () => kitArena({ cls: 'druid', sub: 'kul-cagirani', level: 10, scores: { wis: 16 }, place: { A: o(3, 3), B: o(6, 3), C: o(0, 8) } });
  it('iki Kül Kurdu: sıraya girer (sahibin ardı), ton/halka, saldırır, ölür, süre bitince kaybolur; replay aynı', () => {
    const r = C();
    const ev = r.do(use(pk('kul-cagirani', 'kul-surusu', 'eylem')));
    const sum = ev.filter((e) => e.type === 'summoned') as Array<Extract<BattleEvent, { type: 'summoned' }>>;
    expect(sum).toHaveLength(2);
    const w = r.c(sum[0]!.combatant.id);
    expect(r.state.order.slice(1, 3)).toEqual(sum.map((s) => s.combatant.id));
    expect(w.avatar).toMatchObject({ src: 'monsters/dire-wolf.webp', hue: 200, ring: '#7fb3ff' });
    expect(w.maxHp).toBe(15);
    expect(w.ac).toBe(12 + 2);
    expect(w.attacks[0]?.bonus).toBe(r.c('A').spellAttack);
    expect(w.summon).toMatchObject({ by: 'A', turn: 'after-owner', until: r.state.round + 9 });
    expect(r.c('A').resources['pk-kul-cagirani-cagri']).toBe(3);
    same(r);
    // Kurdun turu: B'ye yanaşır ve saldırır.
    patch(r, w.id, { pos: o(5, 3) });
    r.state = { ...r.state, turnIndex: r.state.order.indexOf(w.id) };
    let attacked = false;
    for (let k = 0; k < 4 && !attacked; k++) {
      const cmd = chooseCommand(r.state);
      if (cmd.type === 'end_turn') break;
      // Çağrılanı sahibinin oyuncusu yönetir.
      const res = execute(r.state, cmd, P1, mid);
      if (!res.ok) break;
      r.state = res.state; r.events.push(...res.events);
      attacked = res.events.some((e) => e.type === 'attack_resolved' && e.actorId === w.id);
    }
    expect(attacked).toBe(true);
    // Ölüm: 0 HP → bir sonraki komutta kaybolur.
    r.state = applyEvents(r.state, [{ type: 'map_effect', rule: 'test', targetId: w.id, text: 'öldü', hpAfter: 0, damage: { type: 'force', applied: 99 } } as BattleEvent]);
    r.state = { ...r.state, turnIndex: 0 };
    r.fresh();
    const ev2 = r.do(use(pk('kul-cagirani', 'kor-cagrisi', 'bonus')));
    expect(ev2.some((e) => e.type === 'summon_vanished' && e.actorId === w.id && e.reason === 'hp')).toBe(true);
    const beetle = (ev2.find((e) => e.type === 'summoned') as Extract<BattleEvent, { type: 'summoned' }>).combatant;
    expect(beetle.avatar.src).toBe('monsters/wolf.webp');
    expect(beetle.attacks).toEqual([]);
    expect(beetle.summon?.turn).toBe('own');
    // Süre: tur sınırı geçince kalan kurt kaybolur.
    const other = sum[1]!.combatant.id;
    r.state = { ...r.state, round: r.state.round + 10 };
    r.fresh();
    const ev3 = r.do(use(pk('kul-cagirani', 'kul-korkusu', 'bonus')));
    expect(ev3.some((e) => e.type === 'summon_vanished' && e.actorId === other && e.reason === 'duration')).toBe(true);
  });
  it('auralar (pasif kurtulma bonusu, bonus eylemle hasar aurası), yüzey, alan hasarı, korku, görünmezlik, büyü eklentisi', () => {
    const r = C();
    expect(r.c('A').effects?.some((e) => e.auras?.some((a) => a.effect.kind === 'saveBonus'))).toBe(true);
    r.do(use(pk('kul-cagirani', 'sicak-hale', 'bonus')));
    expect(r.c('A').effects?.some((e) => e.auras?.some((a) => a.effect.kind === 'damage' && a.filter === 'enemies') && e.until !== undefined)).toBe(true);
    same(r);
    r.fresh();
    const ice = r.do(use(pk('kul-cagirani', 'kul-ustasi', 'eylem'), undefined, o(5, 5)));
    expect(ice.some((e) => e.type === 'zone_created' && e.zone.surface === 'ice')).toBe(true);
    r.fresh();
    const boom = r.do(use(pk('kul-cagirani', 'kul-patlamasi', 'eylem'), undefined, o(6, 3)));
    expect(boom.some((e) => e.type === 'save_resolved' && e.targetId === 'B' && e.damageType === 'fire')).toBe(true);
    r.fresh();
    r.do(use(pk('kul-cagirani', 'kul-korkusu', 'eylem'), 'B'), low);
    expect(r.c('B').conditions).toContain('Frightened');
    expect(r.c('B').effects?.find((e) => e.grants?.includes('Frightened'))?.repeatSave?.ability).toBe('wis');
    r.fresh();
    r.do(use(pk('kul-cagirani', 'kul-korkusu', 'bonus')));
    expect(r.c('A').conditions).toContain('Invisible');
    expect(paketSpellBonus(r.c('A'), 'fire', 'Evocation')).toBe(3);
    expect(paketSpellBonus(r.c('A'), 'cold', 'Evocation')).toBe(0);
  });
});

describe('(d) Şafak Bekçisi: iyileştirme + geçici can + ölümden dönüş', () => {
  const D = () => kitArena({ cls: 'cleric', sub: 'safak-bekcisi', level: 10, scores: { wis: 16 }, place: { A: o(3, 3), B: o(4, 3), C: o(3, 4) },
    ally: { conditions: ['Poisoned'] } });
  it('Şafak Eli: dosta 1d8+WIS, Poisoned kalkar, kaynak', () => {
    const r = D();
    const ev = r.do(use(pk('safak-bekcisi', 'safak-eli', 'bonus'), 'C'));
    expect(ev.find((e) => e.type === 'healed')).toMatchObject({ targetId: 'C', amount: 5 + 3 });
    expect(r.c('C').conditions).not.toContain('Poisoned');
    expect(r.c('A').resources['pk-safak-bekcisi-safak']).toBe(2);
  });
  it('öldürünce geçici can; ölümden dönüş yarı canla bir kez (kaynak)', () => {
    const r = D();
    arm(r, 'A');
    patch(r, 'B', { hp: 1 });
    r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: sword }, high);
    expect(r.c('B').hp).toBe(0);
    expect(r.c('A').tempHp).toBe(10);
    // Koruma komut sonunda kurulur; ölümcül hasar → 1 HP → yarı can.
    expect(r.c('A').effects?.some((e) => e.deathWard)).toBe(true);
    const big: AttackOption = { ...club, attackBonus: 30, damage: '1d6+200' };
    patch(r, 'B', { hp: 30, life: undefined, conditions: [] });
    r.state = { ...r.state, status: 'active', winner: undefined } as BattleState;
    arm(r, 'B', big);
    turnOf(r, 'B');
    const res = execute(r.state, { type: 'attack', actorId: 'B', targetId: 'A', option: big }, GM, mid);
    expect(res.ok ? '' : res.error).toBe('');
    if (!res.ok) return;
    expect(res.state.combatants.A!.hp).toBe(Math.floor(r.c('A').maxHp / 2));
    expect(res.state.combatants.A!.resources['pk-safak-bekcisi-son']).toBe(0);
    expect(res.state.combatants.A!.effects?.some((e) => e.deathWard)).toBe(false);
  });
  it('Şafak Biçimi: biçim etkisi + biçime bağlı direnç + büyüme tek düğmede', () => {
    const r = D();
    r.do(use(pk('safak-bekcisi', 'safak-bicimi', 'bonus')));
    const a = r.c('A');
    expect(a.effects?.find((e) => e.id === formId('A', 'safak'))).toMatchObject({ ac: 1, resist: ['radiant'], hitDie: '1d4', hitType: 'radiant' });
    expect(a.effects?.some((e) => e.resist?.includes('necrotic'))).toBe(true);
    expect(a.effects?.some((e) => e.size === 1)).toBe(true);
    expect(a.tempHp).toBe(10);
    same(r);
  });
});

describe('paket yüklü değilken', () => {
  it('aynı alt sınıf kimliği bulunamaz, savaşçıda paket verisi ve pk düğmesi yok', () => {
    applyPackSubclasses([]);
    const a = kitHero({ cls: 'druid', sub: 'kul-cagirani', level: 10 });
    expect(a.paket).toBeUndefined();
    expect((a.features ?? []).some((f) => f.key.startsWith('pk:'))).toBe(false);
    expect(Object.keys(classData.mechanics.resources).some((k) => k.startsWith('pk-'))).toBe(false);
  });
  it('paket silinse de kayıtlı savaş (replay) aynı çalışır: veri savaşçıda', () => {
    const r = kitArena({ cls: 'fighter', sub: 'kehribar-nobetci', level: 10 });
    r.do(use(pk('kehribar-nobetci', 'av-isareti', 'bonus'), 'B'));
    applyPackSubclasses([]);
    expect(JSON.stringify(replay(r.events).combatants)).toBe(JSON.stringify(r.state.combatants));
    r.fresh();
    expect(r.try(use(pk('kehribar-nobetci', 'dev-boyu', 'bonus'))).ok).toBe(true);
  });
});

export type { BattleState };
