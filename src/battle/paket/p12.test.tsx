/**
 * Kuyruk P12: ilkel genişletme 6 (kurgusal fikstür `tests/fixtures/paket-p12.json`; kural sürümü 43). Her yeni alan:
 * davranış (43), eski sürümde etkisizlik (42), uçtan uca komutlar baştan oynatılınca aynı durum.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import p12 from '../../../tests/fixtures/paket-p12.json';
import { validatePack } from '../../content/schema';
import { applyPackSubclasses } from '../../content/paket';
import { ilkelErrors } from '../../content/ilkelSema';
import { classData } from '../../data';
import { blankCharacter } from '../../rules/builder';
import { fullStatus, longRestStatus, shortRestStatus } from '../../rules/characterRest';
import { gainedFeatures, missingFeatures } from '../../rules/classFeatures';
import { rollExploding, type Rng } from '../../rules/dice';
import type { CharacterSheet } from '../../rules/stats';
import { combatantFromSheet } from '../create';
import { kitArena, o } from '../k54bKit';
import { replay } from '../reduce';
import { withPaket } from './core';
import { P12_VERSION } from './p12surum';
import { BOOK, vertigoRow } from './p12core';
import { castOrigins } from './p11cast';
import { actionDescriptors } from '../ai/actions';
import { renderToStaticMarkup } from 'react-dom/server';
import { Builder } from '../../screens/Builder';
import type { BattleEvent, Combatant, Command } from '../types';

beforeEach(() => {
  const r = validatePack(p12, { taken: classData.subclasses.map((s) => s.id), packs: [] });
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  applyPackSubclasses(r.pack.subclasses);
});
afterEach(() => applyPackSubclasses([]));

type Run = ReturnType<typeof kitArena>;
const patch = (r: Run, id: string, p: Partial<Combatant>) => { r.state = { ...r.state, combatants: { ...r.state.combatants, [id]: { ...(r.state.combatants[id] as Combatant), ...p } } }; };
const rebase = (r: Run) => { r.events = [{ type: 'battle_started', state: r.state } as BattleEvent]; };
const same = (r: Run) => {
  const a = replay(r.events).combatants; const b = r.state.combatants;
  for (const id of Object.keys(b)) for (const k of Object.keys({ ...a[id], ...b[id] })) {
    expect(JSON.stringify((a[id] as unknown as Record<string, unknown>)?.[k]), `${id}.${k}`).toBe(JSON.stringify((b[id] as unknown as Record<string, unknown>)[k]));
  }
  expect(JSON.stringify(replay(r.events).map?.objects ?? [])).toBe(JSON.stringify(r.state.map?.objects ?? []));
};
const fixed = (v: number): Rng => () => v;
const seqRng = (vs: number[], rest = 0.5): Rng => { let i = 0; return () => (i < vs.length ? vs[i++] as number : rest); };
/** dN zarında yüz `f` veren rng değeri. */
const face = (f: number, n: number) => (f - 0.5) / n;
const turnOf = (r: Run, id: string) => { while (r.state.order[r.state.turnIndex] !== id) { const cur = r.state.order[r.state.turnIndex] as string; const cmd = { type: 'end_turn' as const, actorId: cur }; if (r.c(cur).side === 'enemies') r.gm(cmd); else r.do(cmd); } };
const feat = (c: Combatant, part: string) => (c.features ?? []).find((f) => f.key.includes(part)) as NonNullable<Combatant['features']>[number];

const WIZ_SPELLS = ['Magic Missile', 'Dispel Magic', 'Counterspell', 'Hold Person', 'Blindness/Deafness', 'Fire Bolt', 'Ray of Frost'];
function arena(cls: string, sub: string, level: number, v?: number, sheet: Partial<CharacterSheet> = {}): Run {
  const r = kitArena({ cls, sub, level, ...(v ? { kuralSurumu: v } : {}), scores: { int: 16, str: 16 }, place: { A: o(3, 3), B: o(5, 3), C: o(4, 4) },
    sheet: cls === 'wizard' ? { spellNames: WIZ_SPELLS, spellbook: WIZ_SPELLS, ...sheet } as Partial<CharacterSheet> : sheet });
  patch(r, 'B', { hp: 60, maxHp: 60 });
  rebase(r);
  return r;
}
const sheetOf = (cls: string, level: number, p: Partial<CharacterSheet> = {}): CharacterSheet =>
  ({ ...blankCharacter('p12').sheet, name: 'P12', raceId: 'human', classId: cls, level, baseScores: { str: 12, dex: 14, con: 14, int: 16, wis: 12, cha: 14 }, ...p } as CharacterSheet);

describe('P12: şema, sürüm, fikstür', () => {
  it('kural sürümü 43 (tek sabit); fikstür geçerli; yeni alanlar doğrulanır', () => {
    expect(P12_VERSION).toBe(43);
    const ctx = { kaynaklar: new Set(['k']), sinifKaynaklari: new Set<string>(), yaratiklar: new Set<string>() };
    expect(ilkelErrors([{ tur: 'gucDeposu', harca: 'buyuHasari' }], 'p', ctx).map((e) => e.alan)).toEqual(['harcaHasar']);
    expect(ilkelErrors([{ tur: 'gucDeposu', olay: 'karsiBuyu', depo: { id: 'k' }, harca: 'buyuHasari', harcaHasar: '$lvlYari' }], 'p', ctx)).toEqual([]);
    expect(ilkelErrors([{ tur: 'buyuVer', rastgeleListe: { sayi: 1 } }], 'p', ctx).map((e) => e.alan)).toEqual(['rastgeleListe']);
    expect(ilkelErrors([{ tur: 'vertigo', tablo: [{ etki: 'patlama' }] }], 'p', ctx).map((e) => e.alan)).toEqual(['tablo']);
    expect(ilkelErrors([{ tur: 'vertigo', zar: 4, tablo: [{ etki: 'acBonusu', yuzler: [5] }] }], 'p', ctx).map((e) => e.alan)).toEqual(['tablo']);
    expect(ilkelErrors([{ tur: 'zarHavuzu', zar: '1d8', patlar: true, havuz: { 3: 4, 7: 5 } }], 'p', ctx)).toEqual([]);
  });
});

describe('P12 G1: güç deposu (kaynak, karşı büyü, büyü hasarı)', () => {
  const KEY = 'pk-kivilcim-okulu-kivilcim';
  it('sayaç başlangıçta 1, üst sınır INT (en az 1); uzun dinlenme 1; kısa dinlenme yalnız 0\'da 1', () => {
    const s = sheetOf('wizard', 6, { subclassId: 'kivilcim-okulu' });
    const full = fullStatus(s);
    expect(full.resources[KEY]).toBe(1);
    expect(full.resourceMax?.[KEY]).toBe(3);
    expect(combatantFromSheet(s, { id: 'W', ownerId: 'p1' }).resources[KEY]).toBe(1);
    expect(longRestStatus(s, { ...full, resources: { ...full.resources, [KEY]: 3 } }).resources[KEY]).toBe(1);
    expect(shortRestStatus(s, { ...full, resources: { ...full.resources, [KEY]: 0 } }, 0, fixed(0.5)).status.resources[KEY]).toBe(1);
    expect(shortRestStatus(s, { ...full, resources: { ...full.resources, [KEY]: 2 } }, 0, fixed(0.5)).status.resources[KEY]).toBe(2);
    // INT 8 (−1): en az 1.
    expect(fullStatus({ ...s, baseScores: { ...s.baseScores, int: 8 } }).resourceMax?.[KEY]).toBe(1);
  });
  it('karsiBuyu: Dispel Magic düşman büyüsünü kırınca +1 (üst sınırda durur); 42\'de artmaz', () => {
    for (const v of [43, 42]) {
      const r = arena('wizard', 'kivilcim-okulu', 6, v);
      patch(r, 'B', { effects: [{ id: 'spells:bless', name: 'Bless', sourceId: 'B' }] });
      rebase(r);
      r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Dispel Magic', targetId: 'B', slotLevel: 3 } as Command);
      expect(r.c('B').effects?.some((e) => e.id === 'spells:bless')).toBe(false);
      expect(r.c('A').resources[KEY]).toBe(v === 43 ? 2 : 1);
      same(r);
    }
  });
  it('karsiBuyu: Counterspell ile durdurunca +1', () => {
    const r = arena('wizard', 'kivilcim-okulu', 6);
    const foe = combatantFromSheet(sheetOf('wizard', 5, { spellNames: ['Magic Missile'], spellbook: ['Magic Missile'] } as Partial<CharacterSheet>), { id: 'E', ownerId: 'gm' });
    r.state = { ...r.state, combatants: { ...r.state.combatants, E: { ...foe, side: 'enemies', ownerId: null, pos: o(6, 3) } as Combatant }, order: [...r.state.order, 'E'] };
    rebase(r);
    turnOf(r, 'E');
    const ev = r.gm({ type: 'cast_spell', actorId: 'E', spellName: 'Magic Missile', targetId: 'C', slotLevel: 1 } as Command, fixed(0.05));
    expect(ev.some((e) => e.type === 'reaction_used' && e.actorId === 'A' && e.trigger === 'cast')).toBe(true);
    expect(r.c('A').resources[KEY]).toBe(2);
    same(r);
  });
  it('buyuHasari: Wizard büyüsü hasar verince turda bir 1 güç → seviye/2 force (tek hedefe); ikinci büyüde yok', () => {
    const r = arena('wizard', 'kivilcim-okulu', 6);
    const hp0 = r.c('B').hp;
    const ev = r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetId: 'B' } as Command, fixed(0.9));
    const extra = ev.find((e) => e.type === 'map_effect' && e.targetId === 'B') as Extract<BattleEvent, { type: 'map_effect' }> | undefined;
    expect(extra?.damage?.applied).toBe(3);
    expect(extra?.damage?.type).toBe('force');
    expect(r.c('A').resources[KEY]).toBe(0);
    expect(r.c('B').hp).toBeLessThan(hp0 - 3);
    // Aynı tur ikinci büyü: güç yok ve turda bir.
    patch(r, 'A', { resources: { ...r.c('A').resources, [KEY]: 2 } });
    r.fresh();
    const ev2 = r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Ray of Frost', targetId: 'B' } as Command, fixed(0.9));
    expect(ev2.some((e) => e.type === 'map_effect')).toBe(false);
  });
  it('isabet + depo: silah isabetinde bütün güç × zar, kaynak 0', () => {
    const r = arena('wizard', 'yanki-okulu', 5);
    patch(r, 'A', { resources: { ...r.c('A').resources, 'pk-yanki-okulu-yanki': 2 }, weaponOptions: [{ label: 'Hançer', attackBonus: 10, damage: '1d4', damageType: 'piercing', ranged: false, spell: false, tag: 'y' }] });
    patch(r, 'B', { pos: o(4, 3) });
    rebase(r);
    const ev = r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: r.c('A').weaponOptions[0] } as Command, fixed(0.9));
    const atk = ev.find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>;
    expect(atk.extra?.find((x) => x.label === 'yanki')?.rolls).toHaveLength(2);
    expect(r.c('A').resources['pk-yanki-okulu-yanki']).toBe(0);
    same(r);
  });
});

describe('P12 G2: rastgele büyü listesi (Sınırlı Dilek)', () => {
  const pick = (names: string[]) => Object.fromEntries(names.map((n, i) => [`warlock/sans-cini:sans/dilek${i + 1}`, n]));
  it('dN listeden seçer; geçersiz hedefli büyü yeniden atılır; büyü slotsuz bir kez; zar defterine yazılır; replay aynı', () => {
    const r = arena('warlock', 'sans-cini', 5, undefined, { featureChoices: pick(['Cure Wounds', 'Magic Missile', 'Cure Wounds', 'Cure Wounds', 'Cure Wounds', 'Cure Wounds', 'Cure Wounds', 'Cure Wounds']) });
    patch(r, 'A', { spellSlots: [0, 0, 0, 0, 0, 0, 0, 0, 0], hp: r.c('A').maxHp });
    patch(r, 'C', { hp: 30, maxHp: 30 });
    rebase(r);
    const f = feat(r.c('A'), 'pk12:dilek:');
    expect(f?.type).toBe('free');
    const res = r.c('A').resources[f.resource as string] as number;
    const ev = r.do({ type: 'use_feature', actorId: 'A', feature: f.key }, seqRng([face(1, 8), face(2, 8)]));
    const note = ev.find((e) => e.type === 'map_note') as Extract<BattleEvent, { type: 'map_note' }>;
    expect(note.text).toContain('d8 = 1 → Cure Wounds (geçersiz, yeniden)');
    expect(note.text).toContain('d8 = 2 → Magic Missile');
    expect(r.c('A').resources[f.resource as string]).toBe(res - 1);
    expect(r.c('A').effects?.find((e) => e.grantSpell)?.grantSpell?.spellName).toBe('Magic Missile');
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Magic Missile', targetId: 'B' } as Command);
    expect(r.c('A').effects?.some((e) => e.grantSpell)).toBe(false);
    expect(r.c('B').hp).toBeLessThan(60);
    same(r);
  });
  it('liste yoksa düğme gerekçeli kapalı; hiçbiri geçerli değilse kullanım harcanmaz; 42\'de düğme yok', () => {
    const r = arena('warlock', 'sans-cini', 5);
    const f = feat(r.c('A'), 'pk12:dilek:');
    expect(r.try({ type: 'use_feature', actorId: 'A', feature: f.key })).toMatchObject({ ok: false, error: expect.stringContaining('liste seçilmedi') });
    const r2 = arena('warlock', 'sans-cini', 5, undefined, { featureChoices: pick(['Cure Wounds']) });
    patch(r2, 'A', { hp: r2.c('A').maxHp }); patch(r2, 'C', { hp: 30, maxHp: 30 }); rebase(r2);
    const res = r2.try({ type: 'use_feature', actorId: 'A', feature: f.key });
    expect(res).toMatchObject({ ok: false, error: expect.stringContaining('geçerli hedefi yok') });
    expect(feat(arena('warlock', 'sans-cini', 5, 42).c('A'), 'pk12:dilek:')).toBeUndefined();
  });
});

describe('P12 G3: vertigo (Kaos Yolu S3/S10/S14 yolu)', () => {
  it('tablo yüzleri: 4 satır d8\'e eşit dağılır', () => {
    const p = (p12.subclasses.find((s) => s.id === 'girdap-yolu')?.features[0]?.ilkeller?.[0]) as Record<string, unknown> & { tur: string };
    expect([1, 2, 3, 4, 5, 6, 7, 8].map((f) => vertigoRow(p, f)?.etki)).toEqual(['patlama', 'patlama', 'isinlan', 'isinlan', 'isik', 'isik', 'acBonusu', 'acBonusu']);
  });
  it('öfkeye girince zar: AC satırı öfke boyunca; öfke bitince biter; 42\'de yok', () => {
    for (const v of [43, 42]) {
      const r = arena('barbarian', 'girdap-yolu', 3, v);
      const ac = r.c('A').ac;
      r.do({ type: 'rage', actorId: 'A' }, fixed(face(8, 8)));
      const fx = r.c('A').effects?.find((e) => e.pkVertigo);
      if (v === 42) { expect(fx).toBeUndefined(); continue; }
      expect(fx?.pkVertigo?.face).toBe(8);
      expect(fx?.ac).toBe(1);
      void ac;
      same(r);
      patch(r, 'A', { rage: null }); rebase(r);
      r.do({ type: 'end_turn', actorId: 'A' });
      expect(r.c('A').effects?.some((e) => e.pkVertigo)).toBe(false);
    }
  });
  it('patlama: 10 ft içindeki düşmanlar CON save, hasar; yinele düğmesi bonus eylemle', () => {
    const r = arena('barbarian', 'girdap-yolu', 3);
    patch(r, 'B', { pos: o(4, 3) }); rebase(r);
    const ev = r.do({ type: 'rage', actorId: 'A' }, fixed(face(1, 8)));
    expect(ev.some((e) => e.type === 'save_resolved' && e.targetId === 'B' && e.damageType === 'force')).toBe(true);
    const tek = feat(r.c('A'), ':tekrar');
    r.fresh();
    const ev2 = r.do({ type: 'use_feature', actorId: 'A', feature: tek.key }, fixed(0.1));
    expect(ev2.some((e) => e.type === 'save_resolved' && e.targetId === 'B')).toBe(true);
    same(r);
  });
  it('ışınlanma: ilki bedava (bir kez), sonra bonus eylemle', () => {
    const r = arena('barbarian', 'girdap-yolu', 3);
    r.do({ type: 'rage', actorId: 'A' }, fixed(face(3, 8)));
    const free = feat(r.c('A'), ':hemen');
    r.do({ type: 'use_feature', actorId: 'A', feature: free.key, to: o(3, 6) });
    expect(r.c('A').pos).toEqual(o(3, 6));
    expect(r.try({ type: 'use_feature', actorId: 'A', feature: free.key, to: o(3, 7) })).toMatchObject({ ok: false });
    const bonus = feat(r.c('A'), ':isinlan');
    expect(r.try({ type: 'use_feature', actorId: 'A', feature: bonus.key, to: o(3, 7) }).ok).toBe(false); // bonus eylem öfkeyle harcandı
    same(r);
  });
  it('Denge Arayışı (S10): öfkedeyken hasar alınca tepkiyle yeniden atılır (önerilen: harcanmış kör edici ışık)', () => {
    const r = arena('barbarian', 'girdap-yolu', 10);
    patch(r, 'B', { pos: o(4, 3), weaponOptions: [{ label: 'Sopa', attackBonus: 20, damage: '1d6', damageType: 'bludgeoning', ranged: false, spell: false, tag: 'y' }] });
    rebase(r);
    r.do({ type: 'rage', actorId: 'A' }, fixed(face(5, 8)));
    expect(r.c('A').effects?.find((e) => e.pkVertigo)?.pkVertigo?.face).toBe(5);
    turnOf(r, 'B');
    const ev = r.gm({ type: 'attack', actorId: 'B', targetId: 'A', option: r.c('B').weaponOptions[0] } as Command, fixed(face(8, 8)));
    expect(ev.some((e) => e.type === 'reaction_used' && e.actorId === 'A' && e.trigger === 'damaged')).toBe(true);
    expect(r.c('A').effects?.find((e) => e.pkVertigo)?.pkVertigo?.face).toBe(8);
    same(r);
  });
  it('Kontrol Sağlama (S14): iki zar atılır, satır seçilir (öneri: alanda düşman yokken AC)', () => {
    const r = arena('barbarian', 'girdap-yolu', 14);
    patch(r, 'B', { pos: o(12, 3) }); rebase(r);
    const ev = r.do({ type: 'rage', actorId: 'A' }, seqRng([face(1, 8), face(7, 8)]));
    expect(ev.filter((e) => e.type === 'map_note' && e.text.includes('girdap'))).toHaveLength(1);
    expect(r.c('A').effects?.find((e) => e.pkVertigo)?.pkVertigo?.face).toBe(7);
    same(r);
  });
});

describe('P12 G4: patlayan havuz zarı ve havuz kademeleri', () => {
  it('rollExploding: en yüksek yüz zincirlenir (en çok 10 ek zar), her zar ayrı', () => {
    expect(rollExploding('1d8', seqRng([0.99, 0.99, 0.2]))).toMatchObject({ rolls: [8, 8, 2], total: 18 });
    expect(rollExploding('1d8', fixed(0.99)).rolls).toHaveLength(11);
    expect(rollExploding('1d8', fixed(0.1)).rolls).toEqual([1]);
  });
  it('havuz büyüklüğü seviyeyle: 3→4, 7→5, 10→5, 15→6, 18→6', () => {
    const cap = (l: number) => fullStatus(sheetOf('fighter', l, { subclassId: 'golge-taktik' })).resourceMax?.['pk-golge-taktik-golge'];
    expect([3, 7, 10, 15, 18].map(cap)).toEqual([4, 5, 5, 6, 6]);
  });
  it('isabette havuz zarı patlar (43), 42\'de patlamaz', () => {
    for (const v of [43, 42]) {
      const r = arena('fighter', 'golge-taktik', 3, v);
      patch(r, 'B', { pos: o(4, 3), ac: 5 });
      patch(r, 'A', { weaponOptions: [{ label: 'Kılıç', attackBonus: 10, damage: '1d8', damageType: 'slashing', ranged: false, spell: false, tag: 'y' }] });
      rebase(r);
      const ev = r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: r.c('A').weaponOptions[0] } as Command, seqRng([0.9, 0.5, 0.99, 0.99, 0.2]));
      const atk = ev.find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>;
      const pool = atk.extra?.find((x) => x.label === 'golge');
      expect(pool?.rolls).toEqual(v === 43 ? [8, 8, 2] : [8]);
      same(r);
    }
  });
});

describe('P12 G5: okul ikiz büyüsü (İkiz Büyüleme)', () => {
  it('Enchantment tek hedefli büyü iki hedefe (slot, konsantrasyon bir kez); başka okul ve 42\'de iki hedef olmaz', () => {
    const two = (r: Run, spell: string) => r.try({ type: 'cast_spell', actorId: 'A', spellName: spell, targetIds: ['B', 'E'], slotLevel: 2 } as Command, fixed(0.01));
    for (const v of [43, 42]) {
      const r = arena('wizard', 'buyu-ikizi', 5, v);
      r.state = { ...r.state, combatants: { ...r.state.combatants, E: { ...(r.state.combatants.B as Combatant), id: 'E', name: 'E', pos: o(6, 4) } }, order: [...r.state.order, 'E'] };
      rebase(r);
      const res = two(r, 'Hold Person');
      expect(res.ok).toBe(v === 43);
      if (res.ok) {
        expect(res.events.filter((e) => e.type === 'slot_spent')).toHaveLength(1);
        expect(res.events.filter((e) => e.type === 'save_resolved').map((e) => (e as { targetId: string }).targetId).sort()).toEqual(['B', 'E']);
      }
      expect(two(r, 'Blindness/Deafness').ok).toBe(false);
    }
  });
});

describe('P12 G6: kitabın altıgeninden büyü (Kitabın Ruhu)', () => {
  it('savaş başında kitap sahibinin elinde (43; 42\'de yok); bırak/al; büyü kitabın altıgeninden', () => {
    const r = arena('wizard', 'kitap-ruhu', 5);
    expect(withPaket({ ...r.state, map: { ...(r.state.map as NonNullable<Run['state']['map']>), objects: [] } }).map?.objects?.find((x) => x.id === BOOK('A'))?.carriedBy).toBe('A');
    expect(withPaket({ ...r.state, kuralSurumu: 42, map: { ...(r.state.map as NonNullable<Run['state']['map']>), objects: [] } }).map?.objects ?? []).toEqual([]);
    r.state = { ...r.state, map: { ...(r.state.map as NonNullable<Run['state']['map']>), objects: [{ id: BOOK('A'), kind: 'spellbook', at: o(3, 3), hp: 2, carriedBy: 'A' }] } };
    patch(r, 'B', { pos: o(14, 3) });
    patch(r, 'A', { pos: o(10, 3) });
    rebase(r);
    expect(castOrigins(r.state, r.c('A'))).toEqual([]);
    r.do({ type: 'object_use', actorId: 'A', objectId: BOOK('A'), action: 'put' } as Command);
    expect(r.state.map?.objects?.[0]).toMatchObject({ at: o(10, 3) });
    expect(r.state.map?.objects?.[0]?.carriedBy).toBeUndefined();
    patch(r, 'A', { pos: o(0, 3) }); rebase(r);
    // Fire Bolt 120 ft: kendinden 70 ft yetmez mi? Menzil küçük büyü: Ray of Frost 60 ft; A'dan B 70 ft, kitaptan 20 ft.
    expect(r.try({ type: 'cast_spell', actorId: 'A', spellName: 'Ray of Frost', targetId: 'B' } as Command).ok).toBe(false);
    expect(castOrigins(r.state, r.c('A')).map((x) => x.id)).toEqual([BOOK('A')]);
    r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Ray of Frost', targetId: 'B', originId: BOOK('A') } as Command, fixed(0.9));
    expect(r.c('B').hp).toBeLessThan(60);
    expect(r.c('A').pos).toEqual(o(0, 3));
    same(r);
  });
});

describe('P12 G7: dostun tetiklediği mühürlü büyü (Büyü Mühürleme)', () => {
  it('dost saklı büyüyü kendi turunda bedava tetikler (dostun eylemi harcanmaz); büyüyü saklayan yapar; 42\'de olmaz', () => {
    for (const v of [43, 42]) {
      const r = arena('wizard', 'muhur-okulu', 5, v);
      r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Magic Missile', targetId: 'B', slotLevel: 1, store: true } as Command);
      expect(r.c('A').effects?.find((e) => e.storedSpell)?.storedSpell?.allies).toBe(v === 43 ? true : undefined);
      turnOf(r, 'C');
      const cmd = { type: 'spell_followup', actorId: 'C', sourceId: 'A', targetId: 'B', choice: 'sakli' } as Command;
      const res = r.try(cmd);
      expect(res.ok).toBe(v === 43);
      if (!res.ok) continue;
      r.do(cmd);
      expect(r.c('C').economy.action).toBe(false);
      expect(r.c('A').effects?.some((e) => e.storedSpell)).toBe(false);
      expect(r.c('B').hp).toBeLessThan(60);
      same(r);
    }
  });
});

describe('P12 G8: hikâye özellikleri', () => {
  it('ilkelsiz hikâye özelliği "Hikâye" etiketli (story), eksik sayılmaz', () => {
    const f = gainedFeatures('rogue', 3, 'masal-yolu').find((x) => x.id === 'anlati');
    expect(f?.mechanic).toMatchObject({ status: 'none', story: true });
    expect(missingFeatures('rogue', 3, 'masal-yolu').some((x) => x.id === 'anlati')).toBe(false);
  });
});

describe('P12 G8/G2: oluşturucu çizimi', () => {
  const draw = (classId: string, sub: string, level: number, extra: Partial<CharacterSheet> = {}) => {
    const c = blankCharacter('p12');
    return renderToStaticMarkup(<Builder initial={{ ...c, sheet: { ...c.sheet, name: 'Yara', classId, subclassId: sub, level, armorName: 'Zırhsız', ...extra } }} onSave={() => {}} onCancel={() => {}} step="character" />);
  };
  it('hikâye özelliği satırında "Hikâye" etiketi (eksik değil)', () => {
    const m = draw('rogue', 'masal-yolu', 3);
    expect(m).toMatch(/3\. anlati <span class="feature-tag">Hikâye<\/span>/);
    expect(m).toContain('hikâye: savaş dışı');
  });
  it('rastgele liste: 8 seçim kutusu, seçilen sayısı', () => {
    const m = draw('warlock', 'sans-cini', 3, { spellNames: ['Eldritch Blast', 'Hex'], featureChoices: { 'warlock/sans-cini:sans/dilek1': 'Hex' } });
    expect(m).toContain('Rastgele liste: 8 bildiğin/hazırladığın büyüyü seç (1/8)');
    expect((m.match(/aria-label="sans \d\. büyü"/g) ?? []).length).toBe(8);
  });
});

describe('P12: yapay zekâ açıklayıcıları', () => {
  it('dilek, vertigo, okul ikizi ve mühür adayları kayıtlı', () => {
    const ids = actionDescriptors().map((d) => d.id);
    for (const id of ['paket:dilek', 'paket:vertigo', 'paket:ikizOkul', 'paket:muhur', 'paket:cikis']) expect(ids).toContain(id);
  });
});
