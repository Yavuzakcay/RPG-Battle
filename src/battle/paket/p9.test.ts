/**
 * Kuyruk P9: ilkel genişletme 3 (kurgusal fikstür `tests/fixtures/paket-p9.json`; kural sürümü 38). Her yeni ilkel, olay ve
 * etki: davranış (38) ve eski sürümde etkisizlik (37); uçtan uca komutlar baştan oynatılınca aynı durum.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import p9 from '../../../tests/fixtures/paket-p9.json';
import { validatePack } from '../../content/schema';
import { applyPackSubclasses } from '../../content/paket';
import { classData } from '../../data';
import { kitArena, kitHero, o } from '../k54bKit';
import { applyEvents, replay } from '../reduce';
import { startBattle } from '../create';
import { mk } from '../fixtures';
import { ilkelOzet } from '../../ui/ilkelOzet';
import { paketInitAdv } from './core';
import { attackDice, saveDice } from '../effectDice';
import type { AttackOption, BattleEvent, Combatant } from '../types';
import type { Rng } from '../../rules/dice';

const load = () => {
  const r = validatePack(p9, { taken: classData.subclasses.map((s) => s.id), packs: [] });
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  applyPackSubclasses(r.pack.subclasses);
};
beforeEach(load);
afterEach(() => applyPackSubclasses([]));

type Run = ReturnType<typeof kitArena>;
const club: AttackOption = { label: 'Sopa', attackBonus: 9, damage: '2d6+2', damageType: 'slashing', ranged: false, spell: false, tag: 'y' };
const patch = (r: Run, id: string, p: Partial<Combatant>) => { r.state = { ...r.state, combatants: { ...r.state.combatants, [id]: { ...(r.state.combatants[id] as Combatant), ...p } } }; };
const only = (r: Run, id: string, ...feats: string[]) => { const c = r.c(id); patch(r, id, { paket: { ...(c.paket as NonNullable<Combatant['paket']>), ozellikler: (c.paket?.ozellikler ?? []).filter((f) => feats.some((x) => f.key.endsWith(`/${x}`))) } }); };
const turnOf = (r: Run, id: string) => { r.state = { ...r.state, turnIndex: r.state.order.indexOf(id) }; if (r.events.length === 1) r.events = [{ type: 'battle_started', state: r.state } as BattleEvent]; };
const rebase = (r: Run) => { r.events = [{ type: 'battle_started', state: r.state } as BattleEvent]; };
const same = (r: Run) => {
  const a = replay(r.events).combatants;
  for (const id of Object.keys(r.state.combatants)) {
    const x = JSON.stringify(a[id]); const y = JSON.stringify(r.state.combatants[id]);
    if (x !== y) { const i = [...x].findIndex((ch, k) => ch !== y[k]); console.log('DIFF', id, x.slice(Math.max(0, i - 150), i + 80), '||', y.slice(Math.max(0, i - 150), i + 80)); }
  }
  expect(JSON.stringify(a)).toBe(JSON.stringify(r.state.combatants));
};
const fixed = (v: number): Rng => () => v;
const cycle = (vs: number[]): Rng => { let i = 0; return () => vs[i++ % vs.length] as number; };
const pk = (sub: string, feat: string, tetik: string) => `pk:${sub}/${feat}:${tetik}`;
const use = (key: string, targetId?: string, actorId = 'A') => ({ type: 'use_feature' as const, actorId, feature: key, ...(targetId ? { targetId } : {}) });
const hasPk = (evs: BattleEvent[], label: string) => evs.some((e) => e.type === 'map_effect' && e.rule === 'paket' && e.text.includes(label));

function arena(cls: string, sub: string, feats: string[], extra: Partial<Parameters<typeof kitArena>[0]> = {}): Run {
  const r = kitArena({ cls, sub, level: 5, ...extra });
  only(r, 'A', ...feats);
  patch(r, 'A', { weaponOptions: [club] });
  patch(r, 'B', { weaponOptions: [club], hp: 200, maxHp: 200 });
  patch(r, 'C', { weaponOptions: [club] });
  rebase(r);
  return r;
}
const fighter = (feats: string[], extra: Partial<Parameters<typeof kitArena>[0]> = {}) => arena('fighter', 'demir-nobet', ['nobet-havuz', ...feats], extra);

describe('P9 şema ve özet', () => {
  it('fikstür geçerli; yeni olay/etki birliktelikleri denetlenir', () => {
    const bad = JSON.parse(JSON.stringify(p9));
    bad.id = 'p9-bozuk';
    bad.subclasses = [bad.subclasses[0]];
    bad.subclasses[0].id = 'demir-bozuk';
    bad.subclasses[0].features[1].ilkeller[0].etki = 'saldiriYap'; // firsatSaldirisi + saldiriYap
    expect(validatePack(bad, { taken: [], packs: [] }).ok).toBe(false);
    const bad2 = JSON.parse(JSON.stringify(bad));
    bad2.subclasses[0].features[1].ilkeller[0] = { tur: 'tepki', olay: 'banaIsabet', etki: 'hizSifir' };
    expect(validatePack(bad2, { taken: [], packs: [] }).ok).toBe(false);
    const bad3 = JSON.parse(JSON.stringify(bad));
    bad3.subclasses[0].features[1].ilkeller[0] = { tur: 'tepki', olay: 'isaretliVurdu', etki: 'hasarEkle' }; // miktar eksik
    expect(validatePack(bad3, { taken: [], packs: [] }).ok).toBe(false);
  });
  it('ilkel özeti yeni türleri yazar', () => {
    expect(ilkelOzet([{ tur: 'tepkiHakki' }, { tur: 'zarYenile' }, { tur: 'kontrolEt' }])).toBe('her turda tepki · zarı yeniden attırır · yaratık yönetir');
    expect(ilkelOzet([{ tur: 'zamanDurdur' }, { tur: 'flurryEk' }, { tur: 'olumZari' }, { tur: 'canArtisi' }, { tur: 'buyuPaylas' }]))
      .toBe('zamanı durdurur · ek Flurry vuruşu · ölüm kurtulmasında can · en çok can artışı · büyüyü dostla paylaşır');
  });
});

describe('tepkiHakki', () => {
  it('38: her yaratığın turu bitince tepki yenilenir', () => {
    const r = fighter(['nobetci-gozu']);
    expect(r.c('A').effects?.some((e) => e.pkReactive)).toBe(true);
    patch(r, 'A', { economy: { ...r.c('A').economy, reaction: true } });
    turnOf(r, 'C');
    r.do({ type: 'end_turn', actorId: 'C' });
    expect(r.c('A').economy.reaction).toBe(false);
  });
  it('37: etki yok, tepki harcanmış kalır', () => {
    const r = fighter(['nobetci-gozu'], { kuralSurumu: 37 });
    expect(r.c('A').effects?.some((e) => e.pkReactive)).toBe(false);
    patch(r, 'A', { economy: { ...r.c('A').economy, reaction: true } });
    turnOf(r, 'C');
    r.do({ type: 'end_turn', actorId: 'C' });
    expect(r.c('A').economy.reaction).toBe(true);
  });
});

describe('tepki firsatSaldirisi + hizSifir', () => {
  const go = (v?: number) => {
    const r = fighter(['durdurucu'], v ? { kuralSurumu: v } : {});
    turnOf(r, 'B');
    rebase(r);
    const evs = r.gm({ type: 'move', actorId: 'B', to: o(8, 3) }, fixed(0.95));
    return { r, evs };
  };
  it('38: fırsat saldırısı isabet edince düşmanın hızı 0, yürüyüş durur; replay aynı', () => {
    const { r, evs } = go();
    expect(evs.some((e) => e.type === 'attack_resolved' && e.opportunity && e.hit)).toBe(true);
    expect(evs.some((e) => e.type === 'effect_added' && e.targetId === 'B' && e.effect.speedZero)).toBe(true);
    expect(r.c('B').effects?.some((e) => e.speedZero)).toBe(true);
    expect(r.c('B').pos).toEqual(o(4, 3));
    same(r);
  });
  it('37: hız etkisi yok, yürüyüş sürer', () => {
    const { r } = go(37);
    expect(r.c('B').effects?.some((e) => e.speedZero)).toBeFalsy();
    expect(r.c('B').pos).not.toEqual(o(4, 3));
  });
});

describe('isaret.aktar ve tepki isaretliVurdu', () => {
  it('işaretli düşman dosta isabet edince ek hasar; işaretsizde yok', () => {
    const r = fighter(['lanet-isareti', 'lanet-karsilik'], { place: { A: o(3, 3), B: o(4, 3), C: o(5, 3) } });
    r.do(use(pk('demir-nobet', 'lanet-isareti', 'bonus'), 'B'));
    turnOf(r, 'B');
    const evs = r.gm({ type: 'attack', actorId: 'B', targetId: 'C', option: club }, fixed(0.9));
    expect(hasPk(evs, 'Lanet Karsilik')).toBe(true);
    const r2 = fighter(['lanet-karsilik'], { place: { A: o(3, 3), B: o(4, 3), C: o(5, 3) } });
    turnOf(r2, 'B');
    expect(hasPk(r2.gm({ type: 'attack', actorId: 'B', targetId: 'C', option: club }, fixed(0.9)), 'Lanet Karsilik')).toBe(false);
  });
  it('aktar: işaretli 0 cana düşünce işaret en yakın düşmana geçer', () => {
    const D = mk('D', { side: 'enemies', hp: 50, maxHp: 50, pos: o(6, 3) });
    const r = fighter(['lanet-isareti'], { extra: [D], place: { A: o(3, 3), B: o(4, 3), D: o(6, 3) } });
    patch(r, 'B', { hp: 3 });
    rebase(r);
    r.do(use(pk('demir-nobet', 'lanet-isareti', 'bonus'), 'B'));
    r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: club }, fixed(0.9));
    expect(r.c('B').hp).toBe(0);
    expect(r.c('D').effects?.some((e) => e.id.startsWith('pk-isaret:lanet:'))).toBe(true);
    same(r);
  });
});

describe('tepki komsuHedefVuruldu + hasarEkle', () => {
  it('dost bitişik düşmana isabet edince ek hasar (tepki harcanır)', () => {
    const r = fighter(['komsu-vurus'], { place: { A: o(3, 3), B: o(4, 3), C: o(5, 3) } });
    turnOf(r, 'C');
    const evs = r.do({ type: 'attack', actorId: 'C', targetId: 'B', option: club }, fixed(0.9));
    expect(hasPk(evs, 'Komsu Vurus')).toBe(true);
    expect(r.c('A').economy.reaction).toBe(true);
    same(r);
  });
  it('düşman bitişik değilse yok', () => {
    const r = fighter(['komsu-vurus'], { place: { A: o(0, 0), B: o(4, 3), C: o(5, 3) } });
    turnOf(r, 'C');
    expect(hasPk(r.do({ type: 'attack', actorId: 'C', targetId: 'B', option: club }, fixed(0.9)), 'Komsu Vurus')).toBe(false);
  });
});

describe('tepki banaIsabet + hareketEt', () => {
  it('vurulunca yarı hız kadar uzaklaşır (ışınlanma girişi), kaynak harcanır', () => {
    const r = fighter(['siyrilma']);
    turnOf(r, 'B');
    const before = r.c('A').resources;
    const evs = r.gm({ type: 'attack', actorId: 'B', targetId: 'A', option: club }, fixed(0.9));
    expect(evs.some((e) => e.type === 'teleported' && e.actorId === 'A')).toBe(true);
    const key = Object.keys(before).find((k) => k.includes('nobet')) as string;
    expect(r.c('A').resources[key]).toBe((before[key] ?? 0) - 1);
    same(r);
  });
  it('37: uzaklaşmaz', () => {
    const r = fighter(['siyrilma'], { kuralSurumu: 37 });
    turnOf(r, 'B');
    expect(r.gm({ type: 'attack', actorId: 'B', targetId: 'A', option: club }, fixed(0.9)).some((e) => e.type === 'teleported')).toBe(false);
  });
});

describe('tepki kurtulmaAttirildi + hizSifir', () => {
  it('düşman kurtulmayı geçince (sonuc basari) hızı 0', () => {
    const r = fighter(['sarsma', 'kacamaz']);
    r.do(use(pk('demir-nobet', 'sarsma', 'eylem'), 'B'), fixed(0.99));
    expect(r.c('B').effects?.some((e) => e.speedZero)).toBe(true);
    same(r);
  });
  it('başarısız kurtulmada tetiklenmez', () => {
    const r = fighter(['sarsma', 'kacamaz']);
    r.do(use(pk('demir-nobet', 'sarsma', 'eylem'), 'B'), fixed(0.01));
    expect(r.c('B').effects?.some((e) => e.speedZero)).toBeFalsy();
    expect(r.c('B').conditions).toContain('Frightened');
  });
});

describe('tepki dusmanBuyuAtiyor', () => {
  const caster = (r: Run) => {
    patch(r, 'B', { spellNames: ['Fire Bolt'], spellAttack: 5, spellSaveDc: 13, spellMod: 3, saves: { str: 0, dex: 0, con: -5, int: 0, wis: 0, cha: 0 } });
    turnOf(r, 'B');
    rebase(r);
  };
  it('buyuIptal: büyücü kurtulmayı geçemezse büyü boşa gider', () => {
    const r = fighter(['buyu-kesici']);
    caster(r);
    const evs = r.gm({ type: 'cast_spell', actorId: 'B', spellName: 'Fire Bolt', targetId: 'A' }, fixed(0.5));
    expect(evs.some((e) => e.type === 'reaction_used' && e.actorId === 'A')).toBe(true);
    expect(evs.some((e) => e.type === 'attack_resolved' && e.actorId === 'B')).toBe(false);
    same(r);
  });
  it('saldiriYap + iptal: isabet ederse büyü boşa; 37\'de tepki yok', () => {
    const r = fighter(['buyu-avcisi']);
    caster(r);
    const evs = r.gm({ type: 'cast_spell', actorId: 'B', spellName: 'Fire Bolt', targetId: 'A' }, fixed(0.9));
    expect(evs.some((e) => e.type === 'attack_resolved' && e.actorId === 'A' && e.hit)).toBe(true);
    expect(evs.some((e) => e.type === 'attack_resolved' && e.actorId === 'B')).toBe(false);
    const old = fighter(['buyu-avcisi'], { kuralSurumu: 37 });
    caster(old);
    expect(old.gm({ type: 'cast_spell', actorId: 'B', spellName: 'Fire Bolt', targetId: 'A' }, fixed(0.9)).some((e) => e.type === 'reaction_used')).toBe(false);
  });
});

describe('zarEtkisi.inisiyatifAvantaji ve kosul ilkTur', () => {
  it('inisiyatif avantajlı (38), 37\'de değil', () => {
    const hero = kitHero({ cls: 'fighter', sub: 'demir-nobet', level: 5 });
    expect(paketInitAdv(hero)).toBe(true);
    const init = (v: number) => startBattle('t', 't', [hero], cycle([0.01, 0.99]), { map: { id: 'col' }, kuralSurumu: v }).state.combatants.A as Combatant;
    const a38 = init(38);
    const a37 = init(37);
    expect(a38.initiative - a38.initiativeBonus).toBe(20);
    expect(a37.initiative - a37.initiativeBonus).toBe(1);
  });
  it('ilkTur: ek hasar yalnız 1. turda', () => {
    const r = fighter(['pusu-oncusu']);
    const a1 = r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: club }, fixed(0.6)).find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>;
    expect(a1.extra?.some((x) => x.label === 'Pusu Oncusu')).toBe(true);
    const r2 = fighter(['pusu-oncusu']);
    r2.state = { ...r2.state, round: 2 };
    const a2 = r2.do({ type: 'attack', actorId: 'A', targetId: 'B', option: club }, fixed(0.6)).find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>;
    expect(a2.extra?.some((x) => x.label === 'Pusu Oncusu')).toBeFalsy();
  });
});

describe('canArtisi ve olumZari', () => {
  it('canArtisi: savaş kuruluşunda en çok can +seviye (38), 37\'de yok', () => {
    // Fikstür alt sınıfının bütün özellikleri savaş kuruluşunda etkin (`only` yalnız düğmeleri süzer).
    expect(fighter(['sert-beden']).c('A').maxHp).toBe(fighter(['sert-beden'], { kuralSurumu: 37 }).c('A').maxHp + 5);
    expect(fighter(['sert-beden']).c('A').hp).toBe(fighter(['sert-beden'], { kuralSurumu: 37 }).c('A').hp + 5);
  });
  const dying = (v?: number) => {
    const r = fighter(['yeniden-dogus'], v ? { kuralSurumu: v } : {});
    patch(r, 'A', { hp: 0, life: 'dying', conditions: ['Unconscious', 'Prone'] });
    r.state = { ...r.state, turnIndex: r.state.order.length - 1 };
    rebase(r);
    r.gm({ type: 'end_turn', actorId: r.state.order[r.state.order.length - 1] as string }, fixed(0.6));
    return r;
  };
  it('olumZari: ölüm kurtulmasında başarı → 3 can, ayağa kalkar; replay aynı', () => {
    const r = dying();
    expect(r.c('A').hp).toBe(3);
    expect(r.c('A').life).toBe('alive');
    same(r);
  });
  it('37: can yok', () => {
    expect(dying(37).c('A').hp).toBe(0);
  });
});

describe('zarYenile', () => {
  const chances = (v?: number) => {
    const r = fighter(['zar-ustasi'], v ? { kuralSurumu: v } : {});
    const s1 = applyEvents(r.state, [{ type: 'trait_turn', actorId: 'A', trait: 'x', key: 'y' }]);
    return { a: attackDice(s1.combatants.A), c: saveDice(s1.combatants.C as Combatant, 'wis'), b: attackDice(s1.combatants.B) };
  };
  it('38: kendi saldırısına ve menzildeki dostun kurtulmasına ikiAtSec yeniden atış (kaynaklı); düşmana yok', () => {
    const x = chances();
    expect(x.a.some((d) => d.reroll === 'd20' && d.rerollMode === 'advantage' && d.label === 'Zar Ustasi' && !!d.resource)).toBe(true);
    expect(x.c.some((d) => d.reroll === 'd20' && d.label === 'Zar Ustasi')).toBe(true);
    expect(x.b.some((d) => d.label === 'Zar Ustasi')).toBe(false);
  });
  it('37: yeniden atış girişi yok; kaynak bitince de yok', () => {
    expect(chances(37).a.some((d) => d.label === 'Zar Ustasi')).toBe(false);
    const r = fighter(['zar-ustasi']);
    const key = Object.keys(r.c('A').resources).find((k) => k.includes('nobet')) as string;
    patch(r, 'A', { resources: { ...r.c('A').resources, [key]: 0 } });
    const s1 = applyEvents(r.state, [{ type: 'trait_turn', actorId: 'A', trait: 'x', key: 'y' }]);
    expect(attackDice(s1.combatants.A).some((d) => d.label === 'Zar Ustasi')).toBe(false);
  });
});

describe('flurryEk ve kosul flurryVurusu', () => {
  const monk = (v?: number) => arena('monk', 'ruzgar-avucu', ['ruzgar-kasirgasi', 'ruzgar-sifasi'], v ? { kuralSurumu: v } : {});
  it('Flurry of Blows 2 + 2 vuruş (38), 2 (37)', () => {
    const r = monk();
    expect(r.c('A').effects?.some((e) => e.pkFlurry === 2)).toBe(true);
    r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: club }, fixed(0.6));
    r.do({ type: 'focus_action', actorId: 'A', action: 'flurry-of-blows' });
    expect(r.c('A').economy.flurryLeft).toBe(4);
    const old = monk(37);
    old.do({ type: 'attack', actorId: 'A', targetId: 'B', option: club }, fixed(0.6));
    old.do({ type: 'focus_action', actorId: 'A', action: 'flurry-of-blows' });
    expect(old.c('A').economy.flurryLeft).toBe(2);
  });
  it('flurryVurusu: Flurry vuruşu isabetinde dost iyileşir; Flurry yokken değil', () => {
    const r = monk();
    patch(r, 'C', { hp: 10 });
    rebase(r);
    r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: club }, fixed(0.6));
    expect(r.c('C').hp).toBe(10);
    r.do({ type: 'focus_action', actorId: 'A', action: 'flurry-of-blows' });
    r.do({ type: 'bonus_strike', actorId: 'A', targetId: 'B' } as Parameters<Run['do']>[0], fixed(0.6));
    expect(r.c('C').hp).toBeGreaterThan(10);
    same(r);
  });
});

describe('büyücü: buyuPaylas, zamanDurdur, kontrolEt, cagirGuclendir.turBasiCan', () => {
  const wiz = (feats: string[], v?: number) => arena('wizard', 'zaman-katibi', ['katip-havuz', ...feats], v ? { kuralSurumu: v } : {});
  it('buyuPaylas: kendine yapılan Mage Armor dosta da (38), 37\'de yok', () => {
    const go = (v?: number) => {
      const r = wiz(['buyu-ortakligi'], v);
      patch(r, 'A', { spellNames: ['Mage Armor'], spellSlots: [4, 3, 2], slotsMax: [4, 3, 2] } as Partial<Combatant>);
      patch(r, 'C', { pos: o(2, 3) });
      rebase(r);
      r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Mage Armor', targetId: 'A' });
      return r;
    };
    const r = go();
    expect(r.c('C').effects?.some((e) => e.id.includes(':pk-paylas:C'))).toBe(true);
    same(r);
    expect(go(37).c('C').effects?.some((e) => e.id.includes(':pk-paylas:'))).toBeFalsy();
  });
  it('zamanDurdur: time_stop olayı, art arda tur; 37\'de etkisiz', () => {
    const r = wiz(['zaman-cizgisi']);
    r.do(use(pk('zaman-katibi', 'zaman-cizgisi', 'eylem')));
    expect(r.state.timeStop).toEqual({ actorId: 'A', left: 2 });
    same(r);
    const old = wiz(['zaman-cizgisi'], 37);
    old.do(use(pk('zaman-katibi', 'zaman-cizgisi', 'eylem')));
    expect(old.state.timeStop).toBeUndefined();
  });
  it('kontrolEt: kurtulmayı geçemeyen insansı düşman senin tarafına geçer; tür dışı reddedilir', () => {
    const r = wiz(['olu-efendisi']);
    patch(r, 'B', { creatureType: 'humanoid' });
    rebase(r);
    r.do(use(pk('zaman-katibi', 'olu-efendisi', 'eylem'), 'B'), fixed(0.01));
    expect(r.c('B').side).toBe('party');
    expect(r.c('B').allegiance?.side).toBe('enemies');
    same(r);
    const r2 = wiz(['olu-efendisi']);
    patch(r2, 'B', { creatureType: 'construct' });
    expect(r2.try(use(pk('zaman-katibi', 'olu-efendisi', 'eylem'), 'B')).ok).toBe(false);
  });
  it('cagirGuclendir.turBasiCan: çağrı kendi tur başında geçici can alır', () => {
    const r = wiz(['ruh-cagrisi', 'ruh-besleme']);
    r.do(use(pk('zaman-katibi', 'ruh-cagrisi', 'bonus')));
    const id = Object.keys(r.state.combatants).find((k) => k.startsWith('A-cagri')) as string;
    expect(id).toBeTruthy();
    // Sahibin turu bitince çağrı (sahibin ardından) oynar: tur başında geçici can (PB 3).
    r.do({ type: 'end_turn', actorId: 'A' });
    expect(r.c(id).tempHp).toBe(3);
    same(r);
  });
});

describe('PAKET-ILKELLER belgesi yeni ilkelleri içerir', () => {
  it('ilkel listesi', async () => {
    const { ILKEL_ADLARI } = await import('../../content/ilkelSema');
    for (const n of ['tepkiHakki', 'zarYenile', 'buyuPaylas', 'kontrolEt', 'zamanDurdur', 'flurryEk', 'olumZari', 'canArtisi']) expect(ILKEL_ADLARI).toContain(n);
  });
});

