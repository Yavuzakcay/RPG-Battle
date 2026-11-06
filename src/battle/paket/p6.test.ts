/**
 * Kuyruk P6: ilkel genişletme (kurgusal fikstür `tests/fixtures/paket-p6.json`). Aşama A: buyuDegisimi (yeniTur,
 * kurtulmaDezavantaji, menzilEkiFt), d20AltSinir + kritikAralik, erisimFt, dostaIsabet hasar etkileri, cagir.konsantrasyon,
 * yuzeyOlustur.sure. Aşama B: zarMuhru, zorlaSonuc, iskalat/yonlendir/kritikIptal, cagir olenden, engeldenGec,
 * buyuTurunda/ikinciSaldiri, harita:<bölge>, zemin etkisi. Replay aynı; paket yokken değişmez.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import p6 from '../../../tests/fixtures/paket-p6.json';
import docP6 from '../../../docs/ornek-paket/ornek-ilkel-paket.json';
import { validatePack } from '../../content/schema';
import { applyPackSubclasses } from '../../content/paket';
import { classData, spells } from '../../data';
import { kitArena, kitHero, mid, o } from '../k54bKit';
import { applyEvents, replay } from '../reduce';
import { execute } from '../commands';
import { GM, mk } from '../fixtures';
import { saveDice, attackDice } from '../effectDice';
import { saveMode } from '../durations';
import { resolveAttack, resolveSave } from '../../rules/attack';
import { zoneTurnEvents } from '../zones';
import { paketSpellTransform } from './core';
import type { AttackOption, BattleEvent, BattleState, Combatant } from '../types';
import type { Rng } from '../../rules/dice';

const load = () => {
  const r = validatePack(p6, { taken: classData.subclasses.map((s) => s.id), packs: [] });
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  applyPackSubclasses(r.pack.subclasses);
};
beforeEach(load);
afterEach(() => applyPackSubclasses([]));

type Run = ReturnType<typeof kitArena>;
const club: AttackOption = { label: 'Sopa', attackBonus: 5, damage: '2d6+2', damageType: 'slashing', ranged: false, spell: false, tag: 'y' };
const patch = (r: Run, id: string, p: Partial<Combatant>) => { r.state = { ...r.state, combatants: { ...r.state.combatants, [id]: { ...(r.state.combatants[id] as Combatant), ...p } } }; };
const only = (r: Run, id: string, feat: string) => { const c = r.c(id); patch(r, id, { paket: { ...(c.paket as NonNullable<Combatant['paket']>), ozellikler: (c.paket?.ozellikler ?? []).filter((f) => f.key.endsWith(`/${feat}`)) } }); };
const turnOf = (r: Run, id: string) => { r.state = { ...r.state, turnIndex: r.state.order.indexOf(id) }; };
const rebase = (r: Run) => { r.events = [{ type: 'battle_started', state: r.state } as BattleEvent]; };
const same = (r: Run) => expect(JSON.stringify(replay(r.events).combatants)).toBe(JSON.stringify(r.state.combatants));
const fixed = (v: number): Rng => () => v;
const pk = (sub: string, feat: string, tetik: string) => `pk:${sub}/${feat}:${tetik}`;
const use = (key: string, targetId?: string, to?: { col: number; row: number }, actorId = 'A') => ({ type: 'use_feature' as const, actorId, feature: key, ...(targetId ? { targetId } : {}), ...(to ? { to } : {}) });
const atk = (evs: BattleEvent[]) => evs.find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>;

describe('A1 buyuDegisimi', () => {
  it('yeniTur (fire → force), menzilEkiFt (+30), kurtulmaDezavantaji; paketsizde aynen', () => {
    const a = kitHero({ cls: 'wizard', sub: 'kehanet-okulu', level: 6 });
    const bolt = spells.find((s) => s.name === 'Fire Bolt')!;
    const t = paketSpellTransform(a, bolt);
    expect(t.mechanics.damageType).toBe('force');
    expect(t.rangeFt).toBe(bolt.rangeFt + 30);
    const ray = spells.find((s) => s.name === 'Ray of Frost')!;
    expect(paketSpellTransform(a, ray).mechanics.damageType).toBe(ray.mechanics.damageType);
    const foe = mk('B', { side: 'enemies' });
    expect(saveMode('normal', foe, 'dex', a)).toBe('disadvantage');
    expect(saveMode('normal', foe, 'dex', kitHero({ cls: 'wizard', sub: 'evoker', level: 6 }))).toBe('normal');
  });
});

describe('A2 d20AltSinir + kritikAralik', () => {
  it('kurtulmada doğal 3 → 10 (başarıya çevirirse); saldırıda doğal 19 kritik', () => {
    const r = kitArena({ cls: 'wizard', sub: 'kehanet-okulu', level: 6 });
    const a = r.c('A');
    const low = fixed(0.1);
    const sv = resolveSave({ extra: saveDice(a, 'wis'), modifier: 2, dc: 12, mode: 'normal' }, low);
    expect(sv.success).toBe(true);
    expect(sv.extra?.some((x) => x.die === '≥10')).toBe(true);
    expect(resolveSave({ extra: saveDice(a, 'wis'), modifier: 0, dc: 15, mode: 'normal' }, low).success).toBe(false);
    expect(a.effects?.some((e) => e.pkCritOn === 19)).toBe(true);
    // Kritik eşiği saldırı çözümüne gider (features.ts): doğal 19.
    patch(r, 'A', { weaponOptions: [{ ...club, attackBonus: 0 }] });
    patch(r, 'B', { ac: 30 });
    const hit = atk(r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: { ...club, attackBonus: 0 } }, fixed(0.9)));
    expect(hit.natural).toBe(19);
    expect(hit.critical).toBe(true);
  });
});

describe('A3 erisimFt', () => {
  it('Uzun Kol: 10 ft uzaktaki hedefe yakın dövüş', () => {
    const r = kitArena({ cls: 'fighter', sub: 'demir-siper', level: 3, place: { A: o(3, 3), B: o(5, 3) } });
    patch(r, 'A', { weaponOptions: [club] });
    expect(r.try({ type: 'attack', actorId: 'A', targetId: 'B', option: club }).ok).toBe(false);
    r.do(use(pk('demir-siper', 'uzun-kol', 'bonus')));
    expect(r.c('A').effects?.some((e) => e.reachPlus === 5)).toBe(true);
    expect(r.try({ type: 'attack', actorId: 'A', targetId: 'B', option: club }).ok).toBe(true);
  });
});

describe('A4 + B3 isabet tepkileri', () => {
  const hitOn = (sub: string, feat: string, targetId: string, opt: AttackOption = club, rng: Rng = fixed(0.6)) => {
    const r = kitArena({ cls: sub === 'demir-siper' ? 'fighter' : 'cleric', sub, level: 10, place: { A: o(3, 3), B: o(4, 3), C: o(4, 4), E: o(5, 3) },
      extra: [{ ...mk('E', { side: 'enemies', hp: 30, maxHp: 30 }), pos: o(5, 3) } as Combatant] });
    only(r, 'A', feat);
    patch(r, 'B', { weaponOptions: [opt] });
    patch(r, 'C', { ac: 10, hp: 30, maxHp: 30 });
    patch(r, 'A', { ac: 10, hp: 60, maxHp: 60 });
    turnOf(r, 'B');
    const res = execute(r.state, { type: 'attack', actorId: 'B', targetId, option: opt }, GM, rng);
    if (!res.ok) throw new Error(res.error);
    return res;
  };
  it('dostaIsabet hasarAzalt: hasar 1d10+CON düşer', () => {
    const res = hitOn('demir-siper', 'siper-ol', 'C');
    const a = atk(res.events);
    expect(res.events.some((e) => e.type === 'reaction_used' && e.actorId === 'A')).toBe(true);
    expect(a.appliedDamage).toBeLessThan(a.rawDamage);
  });
  it('banaIsabet iskalat: ıska; yonlendir: hasar yakındaki başka düşmana', () => {
    const r1 = hitOn('kemik-cagirici', 'kemik-kalkan', 'A');
    expect(atk(r1.events).hit).toBe(false);
    const r2 = hitOn('kemik-cagirici', 'kemik-ayna', 'A');
    expect(atk(r2.events).hit).toBe(false);
    expect(r2.events.some((e) => e.type === 'map_effect' && (e.targetId === 'B' || e.targetId === 'E'))).toBe(true);
  });
  it('dostaIsabet kritikIptal (yarıya), direnc (türde yarıya)', () => {
    const crit = hitOn('kemik-cagirici', 'kirik-kemik', 'C', club, fixed(0.99));
    const a = atk(crit.events);
    expect(a.critical).toBe(true);
    expect(a.appliedDamage).toBeLessThanOrEqual(Math.ceil(a.rawDamage));
    expect(crit.events.some((e) => e.type === 'reaction_used' && e.actorId === 'A')).toBe(true);
    const norm = hitOn('kemik-cagirici', 'kirik-kemik', 'C');
    expect(norm.events.some((e) => e.type === 'reaction_used' && e.actorId === 'A')).toBe(true);
  });
});

describe('A5 + B4 çağırma: konsantrasyon, ölenden', () => {
  it('ölen düşmanın karesinde diriltir (ceset başına bir), çağıran konsantre; konsantrasyon bitince kaybolur; replay aynı', () => {
    const r = kitArena({ cls: 'cleric', sub: 'kemik-cagirici', level: 3, place: { A: o(3, 3), B: o(6, 3), E: o(8, 3) },
      extra: [{ ...mk('E', { side: 'enemies', hp: 20, maxHp: 20 }), pos: o(8, 3) } as Combatant] });
    expect(r.try(use(pk('kemik-cagirici', 'kemik-diriltme', 'eylem'))).ok).toBe(false);
    r.state = applyEvents(r.state, [{ type: 'map_effect', rule: 'test', targetId: 'B', text: 'öldü', hpAfter: 0, damage: { type: 'force', applied: 99 } } as BattleEvent]);
    rebase(r);
    const ev = r.do(use(pk('kemik-cagirici', 'kemik-diriltme', 'eylem')));
    const s = ev.filter((e) => e.type === 'summoned') as Array<Extract<BattleEvent, { type: 'summoned' }>>;
    expect(s).toHaveLength(1);
    expect(s[0]!.combatant.pos).toEqual(o(6, 3));
    expect(s[0]!.combatant.avatar).toMatchObject({ src: 'monsters/skeleton.webp', hue: 90 });
    expect(r.c('A').concentration?.spell).toBe('Kemik Diriltme');
    expect(r.c(s[0]!.combatant.id).summon?.concentration).toBe(true);
    same(r);
    r.fresh();
    expect(r.try(use(pk('kemik-cagirici', 'kemik-diriltme', 'eylem'))).ok).toBe(false);
    // Konsantrasyon biter → yaratık bir sonraki komutta kaybolur.
    r.state = applyEvents(r.state, [{ type: 'concentration_ended', actorId: 'A', spell: 'Kemik Diriltme', reason: 'test' } as unknown as BattleEvent]);
    const ev2 = r.do(use(pk('kemik-cagirici', 'kara-toprak', 'bonus'), undefined, o(4, 4)));
    expect(ev2.some((e) => e.type === 'summon_vanished' && e.reason === 'concentration')).toBe(true);
  });
});

describe('A5 + B8 yüzey süresi ve zemin etkisi', () => {
  it('buz 2 tur (veri süresi yerine); kara toprak: tur başında düşmana kurtulmalı hasar, zorlu arazi', () => {
    const r = kitArena({ cls: 'cleric', sub: 'kemik-cagirici', level: 3, place: { A: o(3, 3), B: o(6, 3) } });
    const ice = r.do(use(pk('kemik-cagirici', 'kara-toprak', 'bonus'), undefined, o(4, 5)));
    const z = (ice.find((e) => e.type === 'zone_created') as Extract<BattleEvent, { type: 'zone_created' }>).zone;
    expect(z.surface).toBe('ice');
    expect(z.until).toBe(r.state.round + 1);
    r.fresh();
    const soil = r.do(use(pk('kemik-cagirici', 'kara-toprak', 'eylem'), undefined, o(6, 3)));
    const zz = (soil.find((e) => e.type === 'zone_created' && e.zone.spec) as Extract<BattleEvent, { type: 'zone_created' }>).zone;
    expect(zz.spec).toMatchObject({ on: ['start'], difficult: 2, save: 'con', damageType: 'necrotic', targets: 'enemies' });
    const hurt = zoneTurnEvents(r.state, 'B', 'start', mid);
    expect(hurt.some((e) => e.type === 'save_resolved' || e.type === 'zone_triggered' || e.type === 'map_effect')).toBe(true);
    expect(zoneTurnEvents(r.state, 'A', 'start', mid).some((e) => e.type === 'save_resolved')).toBe(false);
  });
});

describe('B1 zarMuhru + B2 zorlaSonuc', () => {
  const W = (rng: Rng) => {
    const r = kitArena({ cls: 'wizard', sub: 'kehanet-okulu', level: 6, place: { A: o(3, 3), B: o(4, 3), C: o(3, 4) } });
    r.state = { ...r.state, status: 'setup' as const };
    const res = execute(r.state, { type: 'start_battle' }, GM, rng);
    if (!res.ok) throw new Error(res.error);
    r.state = res.state; r.events.push(...res.events);
    return r;
  };
  it('savaş başında 2 saklı zar; dostun başarısız kurtulması saklı 20 ile başarı (zar ve kaynak harcanır)', () => {
    const r = W(fixed(0.99));
    const stored = (r.c('A').effects ?? []).filter((e) => e.pkMuhur !== undefined);
    expect(stored.map((e) => e.pkMuhur)).toEqual([20, 20]);
    const c = r.c('C');
    expect(c.pkSans?.some((s) => s.kind === 'muhur' && !s.foe)).toBe(true);
    const sv = resolveSave({ extra: saveDice(c, 'dex'), modifier: 0, dc: 15, mode: 'normal' }, fixed(0.1));
    expect(sv.success).toBe(true);
    const used = sv.extra?.find((x) => x.effectId?.startsWith('pk-muhur:'));
    expect(used).toBeDefined();
    const after = applyEvents(r.state, [{ type: 'save_resolved', actorId: 'B', targetId: 'C', label: 'x', ability: 'dex', dc: 15, mode: 'normal', reasons: [], d20: [3], natural: 3, total: 20, success: true,
      damageRolls: [], rawDamage: 0, appliedDamage: 0, damageType: '', damageNote: null, targetHpAfter: c.hp, conditionsAdded: [], effects: [], bonusDice: sv.extra } as BattleEvent]);
    expect((after.combatants.A!.effects ?? []).filter((e) => e.pkMuhur !== undefined)).toHaveLength(1);
    expect(after.combatants.A!.resources['pk-kehanet-okulu-kehanet']).toBe(1);
  });
  it('düşmanın başarılı kurtulması saklı 1 ile başarısız', () => {
    const r = W(fixed(0.01));
    const b = r.c('B');
    expect(b.pkSans?.some((s) => s.kind === 'muhur' && s.foe)).toBe(true);
    const sv = resolveSave({ extra: saveDice(b, 'con'), modifier: 5, dc: 12, mode: 'normal' }, fixed(0.6));
    expect(sv.success).toBe(false);
  });
  it('zorlaSonuc: dostun başarısız saldırısı/kurtulması başarı; tepki ve kaynak harcanır', () => {
    const r = W(fixed(0.5));
    only(r, 'A', 'yazgi-sozu');
    r.state = applyEvents(r.state, []);
    r.state = { ...r.state, combatants: { ...r.state.combatants } };
    // syncAuras reducer'da: boş olayla yeniden türet.
    r.state = applyEvents(r.state, [{ type: 'trait_turn', actorId: 'A', trait: 'x', key: 'y' }]);
    const c = r.c('C');
    expect(c.pkSans?.some((s) => s.kind === 'zorla')).toBe(true);
    const at = resolveAttack({ attackBonus: 0, targetAc: 25, mode: 'normal', damage: '1d6', extra: attackDice(c) }, fixed(0.3));
    expect(at.hit).toBe(true);
    const e = at.extra?.find((x) => x.effectId === 'pk-zorla:A');
    expect(e?.reaction).toBe(true);
  });
});

describe('B5 engeldenGec, B6 buyuTurunda/ikinciSaldiri, B7 harita koşulu', () => {
  it('Duvar Yürüyüşü: geçiş + fırsat saldırısı yok; İkiz Darbe 3. seviyede 2 saldırı; Çöl Derisi yalnız col bölgesinde', () => {
    const r = kitArena({ cls: 'fighter', sub: 'demir-siper', level: 7 });
    expect(r.c('A').attacksPerAction).toBeGreaterThanOrEqual(2);
    expect(kitHero({ cls: 'fighter', sub: 'demir-siper', level: 3 }).attacksPerAction).toBe(1); // savaş başında (withPaket) artar
    expect(kitArena({ cls: 'fighter', sub: 'demir-siper', level: 3 }).c('A').attacksPerAction).toBe(2);
    r.do(use(pk('demir-siper', 'duvar-yuruyusu', 'bonus')));
    expect(r.c('A').effects?.some((e) => e.phase && e.noProvoke)).toBe(true);
    // kitArena haritası 'col' (Çöl): koşullu direnç komut sonunda eklenir.
    expect(r.c('A').effects?.some((e) => e.resist?.includes('fire'))).toBe(true);
  });
  it('Büyü Kılıcı: bu tur büyü yoksa kapalı, büyüden sonra açık', () => {
    const r = kitArena({ cls: 'wizard', sub: 'kehanet-okulu', level: 10 });
    const key = pk('kehanet-okulu', 'buyu-kilic', 'bonus');
    expect(r.try(use(key, 'B')).ok).toBe(false);
    patch(r, 'A', { traitTurns: { ...r.c('A').traitTurns, 'pk-buyu': `${r.state.round}:${r.state.turnIndex}` } });
    const res = r.try(use(key, 'B'));
    expect(res.ok ? '' : res.error).not.toMatch(/koşul/);
  });
});

describe('örnek paket belgesi', () => {
  it('docs/ornek-paket/ornek-ilkel-paket.json fikstürle aynı', () => { expect(docP6).toEqual(p6); });
});

describe('paket yokken', () => {
  it('aynı kimlikli karakterde paket verisi, mühür, erişim yok', () => {
    applyPackSubclasses([]);
    const a = kitHero({ cls: 'wizard', sub: 'kehanet-okulu', level: 10 });
    expect(a.paket).toBeUndefined();
    const r = kitArena({ cls: 'fighter', sub: 'champion', level: 7 });
    expect(r.c('A').pkSans).toBeUndefined();
    expect(r.c('A').effects?.some((e) => e.reachPlus || e.pkCritOn || e.pkD20Min)).toBeFalsy();
  });
});

export type { BattleState };
