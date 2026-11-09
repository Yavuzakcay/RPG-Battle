/**
 * Kuyruk U1a (kural sürümü 61): uçuş ilkeli kademeleri. Kurgusal fikstür `tests/fixtures/paket-u1a.json` (Bulut Yolcusu:
 * kalıcı, kısa süreli, süzülme, zorunlu inişli + seviye eşiği, uçan ejder çağrısı). Her kademe, süre bitişi, dinlenmede
 * yenilenme, 60'ta eski davranış, replay, Celestial 12 → 13, Draconic Flight, çağrılan ejderin uçuşu, YZ adayı.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import u1a from '../../tests/fixtures/paket-u1a.json';
import { validatePack } from '../content/schema';
import { applyPackSubclasses } from '../content/paket';
import { ilkelErrors } from '../content/ilkelSema';
import { classData } from '../data';
import { classResources, rechargeResources } from '../rules/classFeatures';
import { kitArena, o, type KitOpts } from './k54bKit';
import { replay } from './reduce';
import { altitudeCapFt, reachFt } from './altitude';
import { flySpeed, groundBound, hovers, ownFlyCapFt } from './flight';
import { highGroundOf } from './cover';
import { deepWaterBlocks } from './deepWater';
import { candidatesFor } from './ai/actions';
import { AWAKEN_KEY } from './celestial';
import { GM } from './fixtures';
import { execute } from './commands';
import type { BattleEvent, Combatant, Command } from './types';

const SUB = 'bulut-yolcusu';
const load = () => {
  const r = validatePack(u1a, { taken: classData.subclasses.map((s) => s.id), packs: [] });
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  applyPackSubclasses(r.pack.subclasses);
};
beforeEach(load);
afterEach(() => applyPackSubclasses([]));

type Run = ReturnType<typeof kitArena>;
const patch = (r: Run, id: string, p: Partial<Combatant>) => { r.state = { ...r.state, combatants: { ...r.state.combatants, [id]: { ...(r.state.combatants[id] as Combatant), ...p } } }; };
const patchMap = (r: Run, m: Partial<NonNullable<Run['state']['map']>>) => { r.state = { ...r.state, map: { ...(r.state.map as NonNullable<Run['state']['map']>), ...m } }; };
const rebase = (r: Run) => { r.events = [{ type: 'battle_started', state: r.state } as BattleEvent]; };
const btn = (feat: string, tetik = 'bonus') => `pk:${SUB}/${feat}:${tetik}`;
const use = (feat: string, tetik = 'bonus'): Command => ({ type: 'use_feature', actorId: 'A', feature: btn(feat, tetik) });
const up = (ft: number, actorId = 'A'): Command => ({ type: 'vertical_move', actorId, toFt: ft });
const same = (r: Run) => expect(JSON.stringify(replay(r.events).combatants)).toBe(JSON.stringify(r.state.combatants));
const res = (k: string) => `pk-${SUB}-kullanim-${k}`;

/** Bulut Yolcusu arenası: yalnız verilen özellikler (kalıcı kanadın pasif etkisi de yalnız istenince). */
function arena(feats: string[], opts: Partial<KitOpts> = {}): Run {
  const r = kitArena({ cls: 'fighter', sub: SUB, level: 5, ...opts });
  const c = r.c('A');
  patch(r, 'A', {
    paket: { ...(c.paket as NonNullable<Combatant['paket']>), ozellikler: (c.paket?.ozellikler ?? []).filter((f) => feats.some((x) => f.key.endsWith(`/${x}`))) },
    effects: (c.effects ?? []).filter((e) => feats.includes('kalici-kanat') || !e.id.includes('kalici-kanat')),
  });
  rebase(r);
  return r;
}
/** Sıradakinin turunu bitir (oyuncu tarafı oyuncuyla, düşman Game Master'la). */
const endTurn = (r: Run) => {
  const id = r.state.order[r.state.turnIndex] as string;
  const cmd = { type: 'end_turn', actorId: id } as Command;
  return r.c(id).side === 'party' ? r.do(cmd) : r.gm(cmd);
};
/** Sırayı verilen savaşçıya getirene dek tur bitir. */
function untilTurnOf(r: Run, id: string) {
  for (let i = 0; i < 10 && r.state.order[r.state.turnIndex] !== id; i++) endTurn(r);
}

describe('U1a şema', () => {
  const ctx = () => ({ kaynaklar: new Set<string>(), sinifKaynaklari: new Set<string>(), yaratiklar: new Set<string>() });
  const errs = (p: Record<string, unknown>) => ilkelErrors([{ tur: 'ucus', ...p }], 'x', ctx()).map((e) => `${e.kod}:${e.alan}`);
  it('fikstür geçerli; yeni alanların birliktelikleri ve aralıkları denetlenir', () => {
    expect(validatePack(u1a, { taken: [], packs: [] }).ok).toBe(true);
    expect(errs({ hizFt: 30, hizCarpani: 1 })).toContain('ilkelDeger:hizCarpani');
    expect(errs({ sure: 3, sureDakika: 1 })).toContain('ilkelDeger:sureDakika');
    expect(errs({ tetik: 'bonus', kullanim: { sayi: 1 } })).toContain('ilkelEksik:id');
    expect(errs({ id: 'u', tetik: 'pasif', kullanim: { sayi: 1 } })).toContain('ilkelDeger:kullanim');
    expect(errs({ id: 'u', tetik: 'bonus', kullanim: { sayi: 1, yenilenme: 'tur' } })).toContain('ilkelDeger:kullanim');
    expect(errs({ azamiIrtifaFt: 7 })).toContain('ilkelDeger:azamiIrtifaFt');
    expect(errs({ hizCarpani: 0 })).toContain('ilkelDeger:hizCarpani');
    expect(errs({ seviyeEsigi: 13 })).toContain('ilkelEksik:esikSonrasi');
    expect(errs({ seviyeEsigi: 13, esikSonrasi: { ucmaHizi: 1 } })).toContain('ilkelDeger:esikSonrasi');
    expect(errs({ bilinmeyen: 1 })).toContain('ilkelAlan:bilinmeyen');
    expect(errs({ id: 'u', tetik: 'bonus', sureDakika: 1, kullanim: { sayi: 1, yenilenme: 'uzun' }, azamiIrtifaFt: 5, yeredegmez: true })).toEqual([]);
  });
});

describe('U1a kalıcı ve kısa süreli uçuş', () => {
  it('kalıcı (pasif): yürüme hızı kadar uçuş, haritanın sınırı', () => {
    const r = arena(['kalici-kanat']);
    expect(flySpeed(r.c('A'))).toBe(r.c('A').speed);
    expect(ownFlyCapFt(r.c('A'))).toBeNull();
    expect(altitudeCapFt(r.state, r.c('A'))).toBe(60);
    r.do(up(30));
    expect(r.c('A').altitudeFt).toBe(30);
  });
  it('kısa süreli: bonus eylem, 1 dk (10 tur), uzun dinlenmede bir; süre bitince düşer', () => {
    const r = arena(['kisa-kanat']);
    expect(r.c('A').resources[res('kisa')]).toBe(1);
    r.do(use('kisa-kanat'));
    const e = r.c('A').effects?.find((x) => x.fly);
    expect(e?.fly).toBe(r.c('A').speed);
    expect(e?.until).toBe(r.state.round + 9);
    expect(r.c('A').resources[res('kisa')]).toBe(0);
    r.fresh();
    expect(r.try(use('kisa-kanat')).ok).toBe(false);
    r.do(up(10));
    const until = e?.until as number;
    for (let i = 0; i < 40 && r.state.round <= until; i++) endTurn(r);
    expect(r.c('A').effects?.some((x) => x.fly)).toBe(false);
    expect(r.c('A').altitudeFt ?? 0).toBe(0);
    same(r);
  });
  it('dinlenme: uzun yeniler, kısa yalnız `kisa` yenilenmeli kullanımı', () => {
    const max = classResources('fighter', 5, {}, 'human', undefined, SUB);
    expect(max[res('kisa')]).toBe(1);
    expect(max[res('kanat')]).toBe(3);
    const spent = { ...max, [res('kisa')]: 0, [res('kanat')]: 0 };
    expect(rechargeResources(spent, max, 'short', 5)[res('kisa')]).toBe(0);
    expect(rechargeResources(spent, max, 'short', 5)[res('kanat')]).toBe(3);
    expect(rechargeResources(spent, max, 'long', 5)[res('kisa')]).toBe(1);
  });
});

describe('U1a süzülme', () => {
  const hover = (opts: Partial<KitOpts> = {}, tiles?: string[]) => {
    const r = arena(['suzulme', 'kisa-kanat'], opts);
    if (tiles) { patchMap(r, { tiles }); rebase(r); }
    return r;
  };
  it('en çok 5 ft; yürüme hızı kadar; 10 ft reddedilir', () => {
    const r = hover();
    r.do(use('suzulme'));
    const a = r.c('A');
    expect(hovers(a)).toBe(true);
    expect(flySpeed(a)).toBe(a.speed);
    expect(altitudeCapFt(r.state, a)).toBe(5);
    expect(r.try(up(10)).ok).toBe(false);
    r.do(up(5));
    expect(r.c('A').altitudeFt).toBe(5);
    same(r);
  });
  it('başka uçuş kaynağı varken sınır ve süzülme yok', () => {
    const r = hover();
    r.do(use('suzulme'));
    r.fresh();
    r.do(use('kisa-kanat'));
    expect(hovers(r.c('A'))).toBe(false);
    expect(altitudeCapFt(r.state, r.c('A'))).toBe(60);
  });
  it('zorlu zemin (sığ su) işlemez; alev zemini ve lav işler', () => {
    const row = (s: string) => Array.from({ length: 9 }, (_, i) => (i === 3 ? s : '.'.repeat(15)));
    const away = { place: { B: o(12, 7) } };
    const r = hover(away, row('....nnnnnn.....'));
    r.do(use('suzulme'));
    r.do({ type: 'move', actorId: 'A', to: o(9, 3) });
    expect(r.c('A').pos).toEqual(o(9, 3));
    // Alev zemini: süzülen hasar alır; tam uçan almaz.
    const f = hover(away, row('....f..........'));
    f.do(use('suzulme'));
    const hit = f.do({ type: 'move', actorId: 'A', to: o(4, 3) });
    expect(hit.some((e) => e.type === 'map_effect' && e.targetId === 'A' && (e.text ?? '').includes('Alev'))).toBe(true);
    const g = hover(away, row('....f..........'));
    g.do(use('kisa-kanat'));
    expect(g.do({ type: 'move', actorId: 'A', to: o(4, 3) }).some((e) => e.type === 'map_effect' && e.targetId === 'A')).toBe(false);
    // Lav: süzülen gönüllü giremez; uçan girer.
    const l = hover(away, row('....~..........'));
    l.do(use('suzulme'));
    expect(l.try({ type: 'move', actorId: 'A', to: o(4, 3) }).ok).toBe(false);
    const m = hover(away, row('....~..........'));
    m.do(use('kisa-kanat'));
    expect(m.try({ type: 'move', actorId: 'A', to: o(4, 3) }).ok).toBe(true);
  });
  it('derin su: süzülen kıyıdan uzak derin suya giremez (uçan girer)', () => {
    const water = Array.from({ length: 9 }, () => '.....wwwwwwwwww');
    const r = hover({}, water);
    r.do(use('suzulme'));
    expect(deepWaterBlocks(r.state, r.c('A'))(o(11, 3))).toBe(true);
    expect(groundBound(r.c('A'))).toBe(true);
    const f = hover({}, water);
    f.do(use('kisa-kanat'));
    expect(deepWaterBlocks(f.state, f.c('A'))(o(11, 3))).toBe(false);
  });
  it('zemin alanı (yüzey) süzülene işler, uçana işlemez', () => {
    const go = (feat: string) => {
      const r = hover();
      r.gm({ type: 'place_surface', kind: 'fire', hexes: [o(5, 3)] } as Command);
      r.do(use(feat));
      return r.do({ type: 'move', actorId: 'A', to: o(5, 3) }).some((e) => e.type === 'zone_triggered' && (e as { targetId?: string }).targetId === 'A');
    };
    expect(go('suzulme')).toBe(true);
    expect(go('kisa-kanat')).toBe(false);
  });
  it('engel: 5 ft engelin üstünden 5 ft irtifada geçer; 10 ft engeli aşamaz', () => {
    const wall = Array.from({ length: 9 }, () => '.....v.........');
    const r = hover({}, wall);
    r.do(use('suzulme'));
    r.do(up(5));
    expect(r.try({ type: 'move', actorId: 'A', to: o(7, 3) }).ok).toBe(false);
    const low = hover({}, wall);
    patchMap(low, { dikey: { harfFt: { v: 5 } } });
    rebase(low);
    low.do(use('suzulme'));
    low.do(up(5));
    low.do({ type: 'move', actorId: 'A', to: o(7, 3) });
    expect(low.c('A').pos).toEqual(o(7, 3));
  });
  it('K8: sur tepesindeki düşman yerdeki uçana yüksek zemin; süzülene değil (aloft). Yerdeki düşman 5 ft erişimle vurur', () => {
    const tiles = Array.from({ length: 9 }, (_, i) => (i === 3 ? '....s..........' : '.'.repeat(15)));
    const go = (feat: string) => {
      const r = hover({}, tiles);
      patchMap(r, { dikey: { harfFt: { s: 20 }, surUstu: ['s'] } });
      patch(r, 'B', { pos: o(4, 3), altitudeFt: 20 });
      rebase(r);
      r.do(use(feat));
      return highGroundOf(r.state, r.c('B'), r.c('A'));
    };
    expect(go('kisa-kanat')?.side).toBe(1);
    expect(go('suzulme')).toMatchObject({ side: 0, aloft: true });
    const r = hover();
    r.do(use('suzulme'));
    r.do(up(5));
    expect(reachFt(r.state, r.c('B'), r.c('A'), 5)).toBe(5);
  });
  it('sürüm 60: yeni parametreler yok sayılır (yürüme hızı uçuşu, sınır ve süzülme yok)', () => {
    const r = hover({ kuralSurumu: 60 });
    r.do(use('suzulme'));
    const a = r.c('A');
    expect(flySpeed(a)).toBe(a.speed);
    expect(hovers(a)).toBe(false);
    expect(altitudeCapFt(r.state, a)).toBe(60);
    expect(a.effects?.some((e) => e.flyCapFt !== undefined || e.hover)).toBe(false);
    same(r);
  });
  it('YZ: düşman tarafındaki süzülme düğmesi aday komut ve geçerli', () => {
    const r = hover();
    patch(r, 'A', { side: 'enemies' });
    patch(r, 'B', { side: 'party' });
    const a = r.c('A');
    const h = { foes: [r.c('B')], allies: [a], ok: () => true, threat: () => 1, risk: () => 0, priorityKeys: () => [], canAct: true };
    const keys = candidatesFor(r.state, a, h).filter((c) => c.desc.id === 'paket').map((c) => (c.cmd.type === 'use_feature' ? c.cmd.feature : ''));
    expect(keys).toContain(btn('suzulme'));
    expect(execute(r.state, use('suzulme'), GM, () => 0.5).ok).toBe(true);
  });
});

describe('U1a zorunlu iniş ve seviye eşiği', () => {
  it('5. seviye: yarı hız, yalnız kendi turunda; tur sonunda biter, havadaysa iner; sonraki turda yeniden', () => {
    const r = arena(['kirik-kanat']);
    r.do(use('kirik-kanat'));
    const a = r.c('A');
    const parent = a.effects?.find((e) => e.pkGlide);
    expect(parent?.pkGlide).toBe(Math.floor(a.speed / 2 / 5) * 5);
    expect(flySpeed(a)).toBe(parent?.pkGlide);
    r.do(up(5));
    endTurn(r);
    expect(flySpeed(r.c('A'))).toBe(0);
    expect(r.c('A').altitudeFt ?? 0).toBe(0);
    untilTurnOf(r, 'A');
    expect(flySpeed(r.c('A'))).toBe(parent?.pkGlide);
    same(r);
  });
  it('13. seviye (eşik): yürüme hızı, zorunlu iniş yok', () => {
    const r = arena(['kirik-kanat'], { level: 13 });
    r.do(use('kirik-kanat'));
    const a = r.c('A');
    expect(a.effects?.some((e) => e.pkGlide)).toBe(false);
    expect(flySpeed(a)).toBe(a.speed);
    r.do(up(10));
    endTurn(r);
    expect(r.c('A').altitudeFt).toBe(10);
    same(r);
  });
});

describe('U1a ırklar', () => {
  const celestial = (level: number, kuralSurumu?: number) => {
    const r = kitArena({ cls: 'fighter', sub: 'champion', level, sheet: { raceId: 'celestial', celestialAwakening: 'kirik-kanat' }, ...(kuralSurumu ? { kuralSurumu } : {}) });
    r.do({ type: 'use_feature', actorId: 'A', feature: AWAKEN_KEY });
    return r;
  };
  it('Celestial Kırık Kanat: 12. seviye yarı hız ve iniş; 13. seviye normal uçuş (61); 60\'ta 13 de eski', () => {
    const r12 = celestial(12);
    const e12 = r12.c('A').effects?.find((e) => e.id === AWAKEN_KEY);
    expect(e12?.glide).toBe(Math.floor(r12.c('A').speed / 2 / 5) * 5);
    expect(e12?.fly).toBeUndefined();
    const r13 = celestial(13);
    const e13 = r13.c('A').effects?.find((e) => e.id === AWAKEN_KEY);
    expect(e13?.glide).toBeUndefined();
    expect(e13?.fly).toBe(r13.c('A').speed);
    expect(e13?.until).toBe(r13.state.round + 9);
    r13.do(up(10));
    endTurn(r13);
    expect(r13.c('A').altitudeFt).toBe(10);
    same(r13);
    const old = celestial(13, 60);
    expect(old.c('A').effects?.find((e) => e.id === AWAKEN_KEY)?.glide).toBe(Math.floor(old.c('A').speed / 2 / 5) * 5);
  });
  it('Dragonborn Draconic Flight (SRD, 5. seviye): bonus eylem, 10 dk, yürüme hızı', () => {
    const r = kitArena({ cls: 'fighter', sub: 'champion', level: 5, sheet: { raceId: 'dragonborn' } });
    const f = r.c('A').features?.find((x) => x.key === 'srd19:draconic-flight');
    expect(f?.type).toBe('bonus');
    r.do({ type: 'use_feature', actorId: 'A', feature: 'srd19:draconic-flight' });
    expect(flySpeed(r.c('A'))).toBe(r.c('A').speed);
    expect(hovers(r.c('A'))).toBe(false);
  });
});

describe('U1a çağrılan ejderin uçuşu (binek değil)', () => {
  it('paket yaratığı `hiz.ucma` ile uçar: dikey hareket ve birleşik uçuş', () => {
    const r = arena(['ejder-cagrisi']);
    const evs = r.do(use('ejder-cagrisi', 'eylem'));
    const made = evs.find((e) => e.type === 'summoned') as Extract<BattleEvent, { type: 'summoned' }> | undefined;
    expect(made).toBeDefined();
    const id = made?.combatant.id as string;
    expect(flySpeed(r.c(id))).toBe(60);
    r.state = { ...r.state, turnIndex: r.state.order.indexOf(id) };
    rebase(r);
    r.do(up(30, id));
    expect(r.c(id).altitudeFt).toBe(30);
    const from = r.c(id).pos as { col: number; row: number };
    r.do({ type: 'move', actorId: id, to: o(from.col + 3, from.row), toFt: 20 });
    expect(r.c(id).altitudeFt).toBe(20);
    expect(r.c(id).pos).toEqual(o(from.col + 3, from.row));
    same(r);
  });
});
