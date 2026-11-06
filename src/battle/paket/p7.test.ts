/**
 * Görev P7: ilkel genişletme 2 (kurgusal fikstür `tests/fixtures/paket-p7.json`): buyuluVurus, zarDegistir, koruma,
 * algi, meydanOkuma, tepki saldiriYap/yansit, kaynakYenile, zorlaHareket.sonrasi, kosul hedefBuyuk, ortakCan, aura
 * direnc/kurtulmaDezavantaji, saldirmadanSave, yuzeyOlustur oldurunce+iyilestir, yuvaGeriKazan, cagir sifirCan+rastgele,
 * cagirGuclendir, yaratık canavar/buyusuzDirencler, eşya kancaları; canavar saldırısında hitDie (sürüm 34). Replay aynı.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import p7 from '../../../tests/fixtures/paket-p7.json';
import { validatePack } from '../../content/schema';
import { applyPackSubclasses } from '../../content/paket';
import { classData, getMonster } from '../../data';
import { kitArena, o } from '../k54bKit';
import { applyEvents, replay } from '../reduce';
import { execute } from '../commands';
import { GM, mk } from '../fixtures';
import { saveMode } from '../durations';
import { wardSources } from '../divine';
import { senseSees } from '../sight';
import { zoneTurnEvents } from '../zones';
import { nonmagicalProfile } from '../magicStrike';
import { combatantFromSheet, combatantFromMonster } from '../create';
import { blankCharacter } from '../../rules/builder';
import { ilkelOzet } from '../../ui/ilkelOzet';
import { withPaket } from './core';
import { validatePack as vp } from '../../content/schema';
import type { AttackOption, BattleEvent, Combatant } from '../types';
import type { Rng } from '../../rules/dice';
import type { CharacterSheet } from '../../rules/stats';

const load = () => {
  const r = validatePack(p7, { taken: classData.subclasses.map((s) => s.id), packs: [] });
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  applyPackSubclasses(r.pack.subclasses);
};
beforeEach(load);
afterEach(() => applyPackSubclasses([]));

type Run = ReturnType<typeof kitArena>;
const club: AttackOption = { label: 'Sopa', attackBonus: 9, damage: '2d6+2', damageType: 'slashing', ranged: false, spell: false, tag: 'y' };
const patch = (r: Run, id: string, p: Partial<Combatant>) => { r.state = { ...r.state, combatants: { ...r.state.combatants, [id]: { ...(r.state.combatants[id] as Combatant), ...p } } }; };
const only = (r: Run, id: string, ...feats: string[]) => { const c = r.c(id); patch(r, id, { paket: { ...(c.paket as NonNullable<Combatant['paket']>), ozellikler: (c.paket?.ozellikler ?? []).filter((f) => feats.some((x) => f.key.endsWith(`/${x}`))) } }); };
const turnOf = (r: Run, id: string) => { r.state = { ...r.state, turnIndex: r.state.order.indexOf(id) }; };
const rebase = (r: Run) => { r.events = [{ type: 'battle_started', state: r.state } as BattleEvent]; };
const same = (r: Run) => {
  const a = replay(r.events).combatants;
  for (const id of Object.keys(r.state.combatants)) {
    const x = JSON.stringify(a[id]); const y = JSON.stringify(r.state.combatants[id]);
    if (x !== y) { const i = [...x].findIndex((ch, k) => ch !== y[k]); console.log('DIFF', id, x.slice(Math.max(0, i - 120), i + 80), '||', y.slice(Math.max(0, i - 120), i + 80)); }
  }
  expect(JSON.stringify(a)).toBe(JSON.stringify(r.state.combatants));
};
const fixed = (v: number): Rng => () => v;
const pk = (sub: string, feat: string, tetik: string) => `pk:${sub}/${feat}:${tetik}`;
const use = (key: string, targetId?: string, to?: { col: number; row: number }, actorId = 'A') => ({ type: 'use_feature' as const, actorId, feature: key, ...(targetId ? { targetId } : {}), ...(to ? { to } : {}) });
const atk = (evs: BattleEvent[]) => evs.find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>;
const fighter = (feats: string[], extra: Partial<Parameters<typeof kitArena>[0]> = {}) => {
  const r = kitArena({ cls: 'fighter', sub: 'tunc-kalkan', level: 5, ...extra });
  only(r, 'A', ...feats);
  patch(r, 'A', { weaponOptions: [club] });
  rebase(r);
  return r;
};
const hitB = (r: Run, rng: Rng = fixed(0.6), option = club) => r.do({ type: 'attack', actorId: 'A', targetId: 'B', option }, rng);

describe('P7 şema', () => {
  it('fikstür geçerli; yanlış birleşimler reddedilir', () => {
    const bad = JSON.parse(JSON.stringify(p7));
    bad.id = 'p7-bozuk';
    bad.subclasses = [bad.subclasses[0]];
    bad.subclasses[0].id = 'tunc-bozuk';
    bad.subclasses[0].features[6].ilkeller[0].etki = 'acBonusu'; // dostaVuruldu + acBonusu
    const r = vp(bad, { taken: [], packs: [] });
    expect(r.ok).toBe(false);
  });
  it('ilkel özeti (UI) türleri yazar, kaynağı yazmaz', () => {
    expect(ilkelOzet([{ tur: 'kaynak' }, { tur: 'buyuluVurus' }, { tur: 'zarDegistir' }])).toBe('büyülü vuruş · hasar zarlarını değiştirir');
    expect(ilkelOzet([])).toBe('');
  });
});

describe('buyuluVurus', () => {
  it('profil: büyüsüz saldırıya direnç; büyülü vuruşta yok', () => {
    const t = mk('B', { side: 'enemies', nonmagicalResist: ['slashing'] });
    const plain = mk('X');
    const magic = mk('Y', { effects: [{ id: 'm', name: 'm', sourceId: 'Y', pkMagic: ['kendi'] }] });
    expect(nonmagicalProfile(plain, t, 'slashing', { resistances: [] as string[] }).resistances).toEqual(['slashing']);
    expect(nonmagicalProfile(magic, t, 'slashing', { resistances: [] as string[] }).resistances).toEqual([]);
    expect(nonmagicalProfile(plain, t, 'fire', { resistances: [] as string[] }).resistances).toEqual([]);
  });
  it('uçtan uca: büyüsüz dirençli hedefe tam hasar (özellikle), yarım (özelliksiz)', () => {
    const go = (feats: string[]) => { const r = fighter(feats); patch(r, 'B', { nonmagicalResist: ['slashing'], hp: 200, maxHp: 200 });
      if (!feats.length) patch(r, 'A', { effects: (r.c('A').effects ?? []).filter((e) => !e.pkMagic) }); return atk(hitB(r)); };
    const a = go(['buyulu-yumruk']);
    const b = go([]);
    expect(a.appliedDamage).toBe(a.rawDamage);
    expect(b.appliedDamage).toBe(Math.floor(b.rawDamage / 2));
  });
});

describe('zarDegistir', () => {
  it('maks: kesme hasarında zarlar en yükseğe (fark ek hasar); turda bir', () => {
    const r = fighter(['firtina-vurus']);
    patch(r, 'B', { hp: 200, maxHp: 200 });
    rebase(r);
    const a = atk(hitB(r, fixed(0.6)));
    const ex = a.extra?.find((x) => x.label === 'Firtina Vurus');
    expect(ex).toBeTruthy();
    expect(a.damageRolls.reduce((n, x) => n + x, 0) + (ex?.raw ?? 0)).toBe(12);
    same(r);
  });
  it('başka hasar türünde etkisiz', () => {
    const r = fighter(['firtina-vurus']);
    const a = atk(hitB(r, fixed(0.6), { ...club, damageType: 'piercing' }));
    expect(a.extra?.some((x) => x.label === 'Firtina Vurus')).toBeFalsy();
  });
});

describe('koruma ve algi', () => {
  it('koruma: kritik bağışıklığı ve konsantrasyon avantajı; doğal 20 normal vuruş', () => {
    const r = fighter(['tunc-beden']);
    expect(r.c('A').effects?.some((e) => e.noCrit && e.concAdv)).toBe(true);
    patch(r, 'B', { weaponOptions: [club] });
    turnOf(r, 'B');
    const res = execute(r.state, { type: 'attack', actorId: 'B', targetId: 'A', option: club }, GM, fixed(0.99));
    if (!res.ok) throw new Error(res.error);
    expect(atk(res.events).critical).toBe(false);
  });
  it('algı: karanlık görüş ve gerçek görüş (görünmezi yakında görür)', () => {
    const r = fighter(['tunc-goz']);
    const a = r.c('A');
    expect(a.effects?.some((e) => e.darkvision === 120 && e.pkTruesight === 30)).toBe(true);
    expect(senseSees(r.state, a, { ...r.c('B'), conditions: ['Invisible'] })).toBe(true);
    patch(r, 'B', { pos: o(12, 3) });
    expect(senseSees(r.state, r.c('A'), r.c('B'))).toBe(false);
  });
});

describe('meydanOkuma', () => {
  it('isabette hedef meydan okunur; başkasına saldırısı dezavantajlı, sahibine değil', () => {
    const r = fighter(['meydan']);
    patch(r, 'B', { hp: 200, maxHp: 200 });
    rebase(r);
    hitB(r);
    expect(r.c('B').effects?.some((e) => e.tauntBy === 'A')).toBe(true);
    expect(wardSources(r.state, r.c('B'), r.c('C')).some((x) => x.effect === 'disadvantage')).toBe(true);
    expect(wardSources(r.state, r.c('B'), r.c('A')).some((x) => x.effect === 'disadvantage')).toBe(false);
    same(r);
  });
  it('kurtulmalı biçimde başarıda etki yok', () => {
    const r = fighter(['meydan']);
    const c = r.c('A');
    patch(r, 'A', { paket: { ...(c.paket as NonNullable<Combatant['paket']>), ozellikler: c.paket!.ozellikler.map((f) => ({ ...f, ilkeller: f.ilkeller.map((p) => ({ ...p, save: { yetenek: 'wis', dc: 1 } })) })) } });
    patch(r, 'B', { hp: 200, maxHp: 200, saves: { str: 30, dex: 30, con: 30, int: 30, wis: 30, cha: 30 } });
    hitB(r);
    expect(r.c('B').effects?.some((e) => e.tauntBy)).toBeFalsy();
  });
});

describe('tepki: saldiriYap ve yansit', () => {
  const enemyHits = (r: Run, targetId: string, rng: Rng = fixed(0.6)) => {
    patch(r, 'B', { weaponOptions: [club] });
    turnOf(r, 'B');
    const res = execute(r.state, { type: 'attack', actorId: 'B', targetId, option: club }, GM, rng);
    if (!res.ok) throw new Error(res.error);
    return res;
  };
  it('dostaVuruldu → saldırgana saldırı (tepki harcanır); menzil dışındaki dostta yok', () => {
    const r = fighter(['muhafiz-hatti'], { place: { A: o(3, 3), B: o(4, 3), C: o(4, 4) } });
    patch(r, 'C', { ac: 5 });
    const res = enemyHits(r, 'C');
    expect(res.events.some((e) => e.type === 'reaction_used' && e.actorId === 'A')).toBe(true);
    expect(res.events.filter((e) => e.type === 'attack_resolved').some((e) => (e as { actorId: string }).actorId === 'A')).toBe(true);
    const far = fighter(['muhafiz-hatti'], { place: { A: o(0, 0), B: o(4, 3), C: o(4, 4) } });
    patch(far, 'C', { ac: 5 });
    expect(enemyHits(far, 'C').events.some((e) => e.type === 'reaction_used' && e.actorId === 'A')).toBe(false);
  });
  it('banaIsabet yansit: hasarın yarısı saldırgana; ıskada yok', () => {
    const r = fighter(['diken']);
    patch(r, 'A', { ac: 5, hp: 100, maxHp: 100 });
    const res = enemyHits(r, 'A');
    const dealt = atk(res.events).appliedDamage;
    const back = res.events.find((e) => e.type === 'map_effect' && e.targetId === 'B') as { damage?: { applied: number } } | undefined;
    expect(back?.damage?.applied).toBe(Math.max(1, Math.floor(dealt * 0.5)));
    patch(r, 'A', { ac: 40 });
    expect(enemyHits(r, 'A', fixed(0.1)).events.some((e) => e.type === 'map_effect')).toBe(false);
  });
});

describe('kaynakYenile, zorlaHareket.sonrasi, hedefBuyuk', () => {
  it('öldürünce kaynak geri gelir; savaş başı üst sınırı aşmaz', () => {
    const r = fighter(['tunc-havuz', 'tazelen']);
    const key = Object.keys(r.c('A').resources).find((k) => k.includes('tunc')) as string;
    expect(r.c('A').paket?.kaynakBas?.[key]).toBe(2);
    patch(r, 'A', { resources: { ...r.c('A').resources, [key]: 0 } });
    patch(r, 'B', { hp: 1 });
    rebase(r);
    hitB(r);
    expect(r.c('A').resources[key]).toBe(1);
    same(r);
  });
  it('itmeden sonra yere serer; ölü hedefte değil', () => {
    const r = fighter(['devirme']);
    patch(r, 'B', { hp: 200, maxHp: 200 });
    hitB(r);
    expect(r.c('B').conditions).toContain('Prone');
    const k = fighter(['devirme']);
    patch(k, 'B', { hp: 1 });
    hitB(k);
    expect(k.c('B').conditions).not.toContain('Prone');
  });
  it('hedefBuyuk: büyük hedefe ek zar, orta boyda yok', () => {
    const big = fighter(['dev-avcisi']);
    patch(big, 'B', { size: 'L', hp: 200, maxHp: 200 });
    expect(atk(hitB(big)).extra?.some((x) => x.label === 'Dev Avcisi')).toBe(true);
    const med = fighter(['dev-avcisi']);
    patch(med, 'B', { size: 'M', hp: 200, maxHp: 200 });
    expect(atk(hitB(med)).extra?.some((x) => x.label === 'Dev Avcisi')).toBeFalsy();
  });
});

describe('birlik-yolu: ortakCan, aura, saldırmadanSave, iyileştiren zemin, yuva', () => {
  const cleric = (feats: string[], extra: Partial<Parameters<typeof kitArena>[0]> = {}) => {
    const r = kitArena({ cls: 'cleric', sub: 'birlik-yolu', level: 5, place: { A: o(3, 3), B: o(4, 3), C: o(3, 4) }, ...extra });
    only(r, 'A', ...feats);
    patch(r, 'A', { weaponOptions: [club] });
    rebase(r);
    return r;
  };
  it('ortakCan: sahip + yakındaki dost tek havuzda; kaynak bitince olmaz', () => {
    const r = cleric(['birlik-havuz', 'ortak-yurek']);
    const ev = r.do(use(pk('birlik-yolu', 'ortak-yurek', 'eylem')));
    const pool = ev.find((e) => e.type === 'hp_pool_created') as Extract<BattleEvent, { type: 'hp_pool_created' }>;
    expect(pool.memberIds.sort()).toEqual(['A', 'C']);
    expect(r.c('A').poolId).toBe(r.c('C').poolId);
    same(r);
    r.fresh();
    expect(r.try(use(pk('birlik-yolu', 'ortak-yurek', 'eylem'))).ok).toBe(false);
  });
  it('aura direnç (yakındaki dosta, uzaktakine değil) ve kurtulma dezavantajı (yakındaki düşmana)', () => {
    const r = cleric(['kalkan-aurasi', 'isik-aurasi']);
    r.do({ type: 'end_turn', actorId: 'A' });
    expect(r.c('C').auraResist).toContain('fire');
    expect(saveMode('normal', r.c('B'), 'dex')).toBe('disadvantage');
    patch(r, 'C', { pos: o(12, 8) });
    patch(r, 'B', { pos: o(12, 1) });
    r.state = applyEvents(r.state, [{ type: 'map_note', text: 'eşitle' } as BattleEvent]);
    expect(r.c('C').auraResist ?? []).not.toContain('fire');
    expect(saveMode('normal', r.c('B'), 'dex')).toBe('normal');
  });
  it('saldırmadanSave: sahibine saldıran kurtulma atar', () => {
    const r = cleric(['dokunulmaz']);
    expect(r.c('A').effects?.some((e) => e.sanctuary?.dc === 15)).toBe(true);
    patch(r, 'B', { weaponOptions: [club] });
    turnOf(r, 'B');
    const res = execute(r.state, { type: 'attack', actorId: 'B', targetId: 'A', option: club }, GM, fixed(0.6));
    expect(res.ok ? res.events.some((e) => e.type === 'sanctuary_save') : true).toBe(true);
  });
  it('öldürünce iyileştiren zemin: dostu tur başında iyileştirir, düşmanı değil', () => {
    const r = cleric(['koz-sifasi'], { place: { A: o(3, 3), B: o(4, 3), C: o(4, 4) } });
    patch(r, 'B', { hp: 1 });
    patch(r, 'C', { hp: 5, maxHp: 30 });
    rebase(r);
    hitB(r);
    const z = r.state.map?.zones?.find((x) => x.spec?.heal);
    expect(z).toBeTruthy();
    const ev = zoneTurnEvents(r.state, 'C', 'start', fixed(0.5));
    expect(ev.some((e) => e.type === 'healed' && e.targetId === 'C')).toBe(true);
    same(r);
  });
  it('yuvaGeriKazan: sınırdaki yuva geri gelir; kaynak bitince olmaz', () => {
    const r = cleric(['birlik-havuz', 'yuva-geri']);
    patch(r, 'A', { spellSlots: [0, 0, 0] });
    rebase(r);
    r.do(use(pk('birlik-yolu', 'yuva-geri', 'bonus')));
    expect(r.c('A').spellSlots[1]).toBe(1);
    same(r);
    r.fresh();
    expect(r.try(use(pk('birlik-yolu', 'yuva-geri', 'bonus'))).ok).toBe(false);
  });
});

describe('suru-cemberi: çağırma güçlendirme, sıfır can, SRD canavarı', () => {
  const druid = (feats: string[]) => {
    const r = kitArena({ cls: 'druid', sub: 'suru-cemberi', level: 5, place: { A: o(3, 3), B: o(4, 3), C: o(0, 0) } });
    only(r, 'A', ...feats);
    rebase(r);
    return r;
  };
  it('çağrılana geçici can, AC ve isabet zarı; büyüsüz direnç tanımdan', () => {
    const r = druid(['suru', 'suru-gucu']);
    const ev = r.do(use(pk('suru-cemberi', 'suru', 'bonus')));
    const s = ev.find((e) => e.type === 'summoned') as Extract<BattleEvent, { type: 'summoned' }>;
    const made = r.c(s.combatant.id);
    expect(made.effects?.some((e) => e.id.startsWith('pk-guc:') && e.ac === 2 && e.hitDie === '1d4')).toBe(true);
    expect(made.tempHp).toBe(5);
    expect(made.nonmagicalResist).toEqual(['piercing', 'slashing', 'bludgeoning']);
    same(r);
  });
  it('sıfır cana düşünce rastgele yaratık çağrılır (SRD canavarından stat bloğu)', () => {
    const r = druid(['son-koruyucu']);
    r.state = applyEvents(r.state, []);
    patch(r, 'B', { weaponOptions: [{ ...club, damage: '1d4+200' }] });
    turnOf(r, 'B');
    const res = execute(r.state, { type: 'attack', actorId: 'B', targetId: 'A', option: { ...club, damage: '1d4+200' } }, GM, fixed(0.6));
    if (!res.ok) throw new Error(res.error);
    const s = res.events.find((e) => e.type === 'summoned') as Extract<BattleEvent, { type: 'summoned' }> | undefined;
    expect(s).toBeTruthy();
    const bear = getMonster('brown-bear');
    expect([bear.hp, 20]).toContain(s!.combatant.maxHp);
  });
});

describe('eşya kancaları', () => {
  const hero = (items: string[]) => combatantFromSheet({ ...blankCharacter('p7').sheet, name: 'E', raceId: 'human', classId: 'fighter', level: 5,
    baseScores: { str: 14, dex: 14, con: 14, int: 10, wis: 10, cha: 10 }, itemNames: items } as CharacterSheet, { id: 'A', ownerId: 'p1' });
  it('Staff of the Python: bonus eylemle Giant Constrictor Snake', () => {
    const a = hero(['Staff of the Python']);
    expect(a.paket?.ozellikler.some((f) => f.key === 'esya:staff-of-the-python')).toBe(true);
    const r = kitArena({ cls: 'fighter', sub: 'tunc-kalkan', level: 5, place: { A: o(3, 3), B: o(9, 3) } });
    patch(r, 'A', { paket: a.paket, features: a.features, resources: { ...r.c('A').resources, ...a.resources } });
    r.state = withPaket(r.state);
    rebase(r);
    const ev = r.do(use('pk:esya:staff-of-the-python:bonus'));
    const s = ev.find((e) => e.type === 'summoned') as Extract<BattleEvent, { type: 'summoned' }>;
    expect(s.combatant.maxHp).toBe(getMonster('giant-constrictor-snake').hp);
    same(r);
  });
  it('Bag of Tricks: kaynak ve rastgele hayvan; Scimitar of Speed: bonus saldırı düğmesi', () => {
    const b = hero(['Bag of Tricks']);
    expect(Object.entries(b.resources).some(([k, v]) => k.startsWith('pk-esya-bag-of-tricks') && v === 3)).toBe(true);
    expect(Object.keys(b.paket?.yaratiklar ?? {})).toHaveLength(8);
    const s = hero(['Scimitar of Speed']);
    expect(s.paket?.ozellikler[0]?.ilkeller[0]?.tur).toBe('ekSaldiri');
  });
});

describe('canavar saldırısında isabet zarı (sürüm 34)', () => {
  it('Enlarge benzeri `hitDie` canavar saldırısına eklenir; sürüm 33\'te değil', () => {
    const run = (k: number) => {
      const r = kitArena({ cls: 'fighter', sub: 'tunc-kalkan', level: 5, kuralSurumu: k });
      const ogre = { ...combatantFromMonster(getMonster('ogre'), { id: 'O', name: 'Ogre' }), side: 'enemies' as const, pos: o(4, 4),
        effects: [{ id: 'x', name: 'Büyüme', sourceId: 'O', hitDie: '1d4' }] };
      r.state = { ...r.state, combatants: { ...r.state.combatants, O: ogre as Combatant }, order: [...r.state.order, 'O'] };
      patch(r, 'A', { ac: 5, hp: 200, maxHp: 200 });
      turnOf(r, 'O');
      const m = execute(r.state, { type: 'monster_attack', actorId: 'O', targetId: 'A', attackIndex: 0 }, GM, fixed(0.6));
      if (!m.ok) throw new Error(m.error);
      return m.events;
    };
    const has = (evs: BattleEvent[]) => evs.some((e) => e.type === 'attack_resolved' && (e.extra ?? []).some((x) => x.label === 'Büyüme'));
    expect(has(run(34))).toBe(true);
    expect(has(run(33))).toBe(false);
  });
});
