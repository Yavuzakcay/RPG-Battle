/**
 * Kuyruk E4b: bıçak, duvar-ek, prizma, yerçekimi, durum-ek ve su sayfalarının içe aktarılması; duvarlar (taş, diken, bıçak,
 * prizma dikişsiz; rüzgâr dikişsiz değil), Reverse Gravity ve taşlaşma halkası bağlamaları (yalnız görsel).
 */
import { describe, expect, it } from 'vitest';
import e2 from '../../../data/efekt-e2.json';
import { applyEvents, execute, replay } from '../../battle';
import type { BattleEvent, Combatant } from '../../battle/types';
import { P1 } from '../../battle/fixtures';
import { spells } from '../../data';
import { seededRng } from '../../rules/dice';
import { getMap } from '../../map/maps';
import { B, FX, SPELL_FX, SU, fxShots, groundFx, waterHexes } from './fxPlan';
import { field, verifySpell } from './e2Verify';

type Rec = { kare: number; yol: string; kaynak: string; kullanilmiyor?: boolean; dongu: boolean; karisim: string; tur: string };
const recs = (e2 as unknown as { efektler: Record<string, Rec> }).efektler;
const spell = (id: string) => spells.find((s) => s.id === id)!;

describe('Kuyruk E4b: içe aktarma', () => {
  it('on iki şerit kayıtlı; kullanılmayan üçü işaretli ve hiçbir bağlamada yok', () => {
    const names = ['duvar-bicak', 'duvar-bicak-hilal', 'duvar-tas', 'duvar-diken', 'duvar-ruzgar', 'isin-prizma-yatay', 'duvar-prizma',
      'zemin-kuyu-yeni', 'zemin-ters-yercekimi', 'durum-tas-halka', 'su-dalga', 'su-havuz'];
    for (const n of names) expect(recs[`efekt-${n}`], n).toBeDefined();
    const unused = names.filter((n) => recs[`efekt-${n}`]?.kullanilmiyor);
    expect(unused.sort()).toEqual(['duvar-bicak-hilal', 'isin-prizma-yatay', 'zemin-kuyu-yeni']);
    const bound = JSON.stringify([B, SPELL_FX]);
    for (const n of unused) expect(bound, n).not.toContain(`"${n}"`);
    // Taşlaşma halkası: 2×2 sayfanın dört karesi tek efekt.
    expect(recs['efekt-durum-tas-halka']?.kare).toBe(4);
    for (const n of ['su-dalga', 'su-havuz']) expect(recs[`efekt-${n}`]).toMatchObject({ kare: 4, karisim: 'normal', tur: 'su' });
    for (const n of ['duvar-tas', 'duvar-diken', 'duvar-ruzgar', 'duvar-bicak', 'duvar-prizma']) expect(FX[n]).toMatchObject({ frames: 4, loop: true, kind: 'duvar' });
  });
});

describe('Kuyruk E4b: duvar bağlama (gerçek motor → duvar parçası çizilir)', () => {
  const WALL: Record<string, string> = { 'wall-of-stone': 'duvar-tas', 'wall-of-thorns': 'duvar-diken', 'blade-barrier': 'duvar-bicak', 'prismatic-wall': 'duvar-prizma', 'wind-wall': 'duvar-ruzgar' };
  for (const [id, sprite] of Object.entries(WALL)) {
    it(`${id} → ${sprite}`, () => {
      const v = verifySpell(spell(id));
      expect(v.ok, JSON.stringify(v)).toBe(true);
      expect(v.expected).toContain(`duvar:${sprite}`);
    });
  }
  it('yalnız rüzgâr duvarı dikişsiz değil (uç yumuşatma); taş, diken, bıçak, prizma dikişsiz', () => {
    expect(Object.keys((B as unknown as { duvarYumusak: Record<string, number> }).duvarYumusak)).toEqual(['duvar-ruzgar']);
    const sp = spell('wind-wall');
    const s = field(sp);
    const r = execute(s, { type: 'cast_spell', actorId: 'A', spellName: sp.name, slotLevel: 3, targetId: 'B' }, P1, seededRng(2));
    if (!r.ok) throw new Error(r.error);
    const walls = groundFx(applyEvents(s, r.events)).walls;
    expect(walls.length).toBeGreaterThan(0);
    expect(walls.every((w) => w.sprite.id === 'duvar-ruzgar' && (w.soft ?? 0) > 0)).toBe(true);
    for (const id of ['wall-of-stone', 'wall-of-thorns', 'blade-barrier', 'prismatic-wall']) {
      const sp2 = spell(id);
      const s2 = field(sp2);
      const r2 = execute(s2, { type: 'cast_spell', actorId: 'A', spellName: sp2.name, slotLevel: Math.max(1, sp2.level), targetId: 'B' }, P1, seededRng(2));
      if (!r2.ok) throw new Error(r2.error);
      const w2 = groundFx(applyEvents(s2, r2.events)).walls;
      expect(w2.length, id).toBeGreaterThan(0);
      expect(w2.every((w) => !w.soft), id).toBe(true);
    }
  });
  it('Çizili Duvar yalnız Harita Öğretisi barikatında kalır; Wall of Stone yeni taş duvara bağlı', () => {
    expect((B.duvar as Record<string, string>)['cizili-duvar']).toBe('duvar-cizili');
    expect((B.duvar as Record<string, string>)['wall-of-stone']).toBe('duvar-tas');
    expect(Object.entries(B.duvar as Record<string, string>).filter(([, v]) => v === 'duvar-cizili').map(([k]) => k)).toEqual(['cizili-duvar']);
  });
});

describe('Kuyruk E4b: Reverse Gravity ve taşlaşma halkası', () => {
  it('Reverse Gravity: etkilenen yaratığın üstünde yerçekimi sütunu (satır 2); kuyu satırı bağlı değil', () => {
    const v = verifySpell(spell('reverse-gravity'));
    expect(v.ok, JSON.stringify(v)).toBe(true);
    expect(v.expected).toContain('zemin-ters-yercekimi');
    expect(JSON.stringify(B)).not.toContain('zemin-kuyu-yeni');
    const sp = spell('reverse-gravity');
    const s = field(sp);
    const r = execute(s, { type: 'cast_spell', actorId: 'A', spellName: sp.name, slotLevel: 7, targetId: 'B' }, P1, seededRng(3));
    if (!r.ok) throw new Error(r.error);
    const shots = fxShots(r.events, s).filter((x) => x.sprite.id === 'zemin-ters-yercekimi');
    expect(shots.length).toBeGreaterThan(0);
    expect(new Set(shots.map((x) => x.targetId)).size).toBe(shots.length); // yaratık başına bir
  });
  it('Petrified: jeton çevresinde taş halka (ölçek jetona uyar); halka olmadan başka durumda yok', () => {
    const sp = spell('flesh-to-stone');
    const s = field(sp);
    const stone = { ...(s.combatants.B as Combatant), conditions: ['Petrified'] } as Combatant;
    const none = groundFx(s).auras.filter((a) => a.ring !== undefined);
    expect(none).toHaveLength(0);
    const after = { ...s, combatants: { ...s.combatants, B: stone } };
    const rings = groundFx(after).auras.filter((a) => a.ring !== undefined);
    expect(rings).toHaveLength(1);
    expect(rings[0]).toMatchObject({ ownerId: 'B', radius: 0, sprite: { id: 'durum-tas-halka' } });
    expect(rings[0]!.ring).toBeGreaterThanOrEqual(1);
    const big = { ...s, combatants: { ...s.combatants, B: { ...stone, size: 'H' } as Combatant } };
    expect(groundFx(big).auras.find((a) => a.ring !== undefined)!.ring).toBeGreaterThan(1);
  });
});

describe('Kuyruk E4b: yalnız görsel (kural, durum, replay aynı)', () => {
  it('Wall of Stone ve Reverse Gravity: efekt hesabı durumu değiştirmez; replay aynı sonucu verir', () => {
    for (const [id, lv] of [['wall-of-stone', 5], ['reverse-gravity', 7]] as const) {
      const sp = spell(id);
      const s = field(sp);
      const r = execute(s, { type: 'cast_spell', actorId: 'A', spellName: sp.name, slotLevel: lv, targetId: 'B' }, P1, seededRng(5));
      if (!r.ok) throw new Error(r.error);
      const before = JSON.stringify(s);
      const after = applyEvents(s, r.events);
      const frozen = JSON.stringify(after);
      fxShots(r.events, s);
      groundFx(after);
      expect(JSON.stringify(s)).toBe(before);
      expect(JSON.stringify(after)).toBe(frozen);
      const base: BattleEvent[] = [{ type: 'battle_started', state: s } as BattleEvent, ...r.events];
      expect(JSON.stringify(replay(base).combatants)).toBe(JSON.stringify(r.state.combatants));
    }
  });
});

describe('Kuyruk E4b: su dokusu (SU-DALGA / SU-HAVUZ su altıgenlerinde)', () => {
  const kinds = (id: string, variantId?: string) => {
    const m = getMap(id, { variantId });
    const w = waterHexes({ map: { id, tiles: m.tiles } } as never);
    return { w, dalga: w.filter((x) => x.kind === 'dalga').length, havuz: w.filter((x) => x.kind === 'havuz').length, tiles: m.tiles };
  };
  it('su harfleri w ve R; yalnız bu harfli altıgenler listelenir (kara ve sığ su n çizilmez)', () => {
    const k = kinds('orman-heykel-golu', 'gunduz');
    expect(k.w.length).toBe(k.tiles.join('').split('').filter((c) => SU.harf.includes(c)).length);
    for (const x of k.w) expect(SU.harf).toContain(k.tiles[x.at.row]![x.at.col]);
  });
  it('göl ve vaha (orman-heykel-golu, col-vaha) ve hendek (kale-onu) bütün suyu havuz; nehir ve kıyı dalga', () => {
    for (const id of ['orman-heykel-golu', 'col-vaha', 'kale-onu']) { const k = kinds(id); expect(k.w.length, id).toBeGreaterThan(0); expect(k.dalga, id).toBe(0); }
    for (const id of ['col-kanyon-nehri', 'kasaba-lagim', 'orman-oduncu-kampi']) { const k = kinds(id); expect(k.havuz, id).toBe(0); expect(k.dalga, id).toBeGreaterThan(0); }
  });
  it('okyanus (ada): kıyıya yakın dalga, açık deniz havuz (sığ su kıyı sayılmaz)', () => {
    const k = kinds('ada', 'gunes');
    expect(k.dalga).toBeGreaterThan(0);
    expect(k.havuz).toBeGreaterThan(0);
  });
  it('R (coşkun nehir) harfi her zaman dalga; zemin dizisi aynıyken sonuç önbellekli', () => {
    const state = { map: { id: 'x', tiles: ['.R.', 'ww.'] } } as never;
    const a = waterHexes(state);
    expect(a.find((x) => x.at.col === 1 && x.at.row === 0)?.kind).toBe('dalga');
    expect(waterHexes(state)).toBe(a);
  });
  it('doku opak kayıtlı (normal karışım), kare sayısı 4; opaklık %55–65', () => {
    for (const k of ['dalga', 'havuz'] as const) {
      expect(FX[SU.sprite[k]]).toMatchObject({ frames: 4, blend: 'normal', kind: 'su' });
      expect(SU.opaklik[k]).toBeGreaterThanOrEqual(0.55);
      expect(SU.opaklik[k]).toBeLessThanOrEqual(0.65);
    }
  });
});

describe('Kuyruk E4b: zemin dokusu altıgen maskesi (yama altıgenleri)', () => {
  it('her zemin yaması alanın altıgenlerini taşır (kırpma bu liste ile)', () => {
    const sp = spell('spike-growth');
    const s = field(sp);
    const r = execute(s, { type: 'cast_spell', actorId: 'A', spellName: sp.name, slotLevel: 2, targetHex: { col: 9, row: 5 } }, P1, seededRng(2));
    if (!r.ok) throw new Error(r.error);
    const patches = groundFx(applyEvents(s, r.events)).patches;
    expect(patches.length).toBeGreaterThan(0);
    for (const p of patches) { expect(p.hexes.length).toBeGreaterThan(0); expect(p.hexes.some((h) => h.col === p.at.col && h.row === p.at.row)).toBe(true); }
  });
});
