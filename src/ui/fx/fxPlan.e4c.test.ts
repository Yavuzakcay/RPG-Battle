/**
 * Kuyruk E4c: efekt-eksik sayfası (yükselen toz, deprem yarığı, sessizlik küresi, gün ışığı, ölüm sözü): kesim kayıtları, ayarlar
 * (kare sırası, sabit kare, karışım), büyü bağlamaları (gerçek motor → beklenen sprite) ve yalnız görsel olma (replay aynı).
 */
import { describe, expect, it } from 'vitest';
import e2 from '../../../data/efekt-e2.json';
import kesim from '../../../data/efekt-kesim.json';
import { applyEvents, execute, replay } from '../../battle';
import type { BattleEvent } from '../../battle/types';
import { P1 } from '../../battle/fixtures';
import { spells } from '../../data';
import { seededRng } from '../../rules/dice';
import { B, FX, SPELL_FX, fxShots, groundFx, hexVariant, stillFrame } from './fxPlan';
import { field, verifySpell } from './e2Verify';

type Rec = { kare: number; sure: number; tur: string; karisim: string; dongu: boolean; sabit?: number; en: number; boy: number };
const recs = (e2 as unknown as { efektler: Record<string, Rec> }).efektler;
const spell = (id: string) => spells.find((s) => s.id === id)!;

describe('Kuyruk E4c: içe aktarma ve ayarlar', () => {
  it('beş şerit kayıtlı, hepsi 4 kare; kesim tablosunda sayfa ve ayarlar', () => {
    const sh = (kesim as unknown as { sayfalar: Record<string, Record<string, unknown>> }).sayfalar['efekt-eksik']!;
    expect(sh.adlar).toEqual(['yukselen-toz', 'zemin-deprem-yarigi', 'zemin-sessizlik', 'zemin-gunisigi', 'durum-olum-sozu']);
    for (const n of ['yukselen-toz', 'zemin-deprem-yarigi', 'zemin-sessizlik', 'zemin-gunisigi', 'durum-olum-sozu']) expect(recs[`efekt-${n}`]?.kare, n).toBe(4);
  });
  it('deprem yarığı opak (normal karışım), kare 352×352, tek seferlik, hareket azaltta kare 4; diğerleri toplamalı', () => {
    expect(recs['efekt-zemin-deprem-yarigi']).toMatchObject({ karisim: 'normal', en: 352, boy: 352, dongu: false, sabit: 3 });
    for (const n of ['yukselen-toz', 'zemin-sessizlik', 'zemin-gunisigi', 'durum-olum-sozu']) expect(recs[`efekt-${n}`]?.karisim, n).toBe('screen');
    expect(stillFrame(FX['zemin-deprem-yarigi']!)).toBe(3);
  });
  it('sessizlik küresi: kare 4 atıldı, 1-2-3-2 ileri-geri; hareket azaltta kare 1 (ilk); döngü', () => {
    expect(recs['efekt-zemin-sessizlik']).toMatchObject({ dongu: true, sabit: 0 });
    expect(stillFrame(FX['zemin-sessizlik']!)).toBe(0);
  });
  it('gün ışığı yavaş (≈4 fps) döngü, hareket azaltta kare 1 (disk); ölüm sözü tek seferlik, hareket azaltta kare 3', () => {
    expect(recs['efekt-zemin-gunisigi']).toMatchObject({ dongu: true, sabit: 0, sure: 1000 });
    expect(stillFrame(FX['zemin-gunisigi']!)).toBe(0);
    expect(recs['efekt-durum-olum-sozu']).toMatchObject({ dongu: false });
    expect(stillFrame(FX['durum-olum-sozu']!)).toBe(2);
  });
});

describe('Kuyruk E4c: büyü bağlama (gerçek motor → beklenen sprite çizimde)', () => {
  const WANT: Record<string, string> = {
    levitate: 'yukselen-toz', telekinesis: 'yukselen-toz', 'power-word-kill': 'durum-olum-sozu',
    earthquake: 'zemin-deprem-yarigi', silence: 'zemin-sessizlik', daylight: 'zemin-gunisigi',
  };
  for (const [id, sprite] of Object.entries(WANT)) {
    it(`${id} → ${sprite}`, () => {
      const v = verifySpell(spell(id));
      expect(v.ok, JSON.stringify(v)).toBe(true);
      expect(v.expected.some((e) => e.endsWith(sprite)), JSON.stringify(v.expected)).toBe(true);
    });
  }
  it('yükselen toz jetonun tabanına oturur (çapa 0,77) ve hedefte; Power Word Kill yalnız hedefte (büyücüde değil)', () => {
    for (const [id, lv] of [['levitate', 3], ['power-word-kill', 9]] as const) {
      const sp = spell(id);
      const s = field(sp);
      const r = execute(s, { type: 'cast_spell', actorId: 'A', spellName: sp.name, slotLevel: lv, targetId: 'D' }, P1, seededRng(3));
      if (!r.ok) throw new Error(r.error);
      const shots = fxShots(r.events, s).filter((x) => x.sprite.id === (id === 'levitate' ? 'yukselen-toz' : 'durum-olum-sozu'));
      expect(shots.map((x) => x.targetId), id).toEqual(['D']);
      if (id === 'levitate') expect(shots[0]).toMatchObject({ anchor: 0.77 });
    }
  });
  it('deprem yarığı altıgen başına döşenir (karo), diğerleri tek doku; deprem tek seferlik', () => {
    const eq = spell('earthquake');
    const s = field(eq);
    const r = execute(s, { type: 'cast_spell', actorId: 'A', spellName: eq.name, slotLevel: 8, targetHex: { col: 10, row: 5 } }, P1, seededRng(2));
    if (!r.ok) throw new Error(r.error);
    const p = groundFx(applyEvents(s, r.events)).patches.find((x) => x.sprite.id === 'zemin-deprem-yarigi')!;
    expect(p.karo).toMatchObject({ opaklik: 0.88 });
    expect(p.loop).toBe(false);
    expect(p.hexes.length).toBeGreaterThan(1);
    const sl = spell('silence');
    const s2 = field(sl);
    const r2 = execute(s2, { type: 'cast_spell', actorId: 'A', spellName: sl.name, slotLevel: 2, targetHex: { col: 5, row: 5 } }, P1, seededRng(2));
    if (!r2.ok) throw new Error(r2.error);
    const q = groundFx(applyEvents(s2, r2.events)).patches.find((x) => x.sprite.id === 'zemin-sessizlik')!;
    expect(q.karo).toBeUndefined();
    expect(q.loop).toBe(true);
  });
  it('altıgen görünümü koordinattan türetilir: aynı altıgen hep aynı, 12 görünümün hepsi kullanılır, komşular çoğunlukla farklı', () => {
    const seen = new Set<number>();
    let diff = 0; let n = 0;
    for (let col = 0; col < 31; col++) for (let row = 0; row < 17; row++) {
      const v = hexVariant({ col, row });
      expect(v).toBe(hexVariant({ col, row }));
      expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(12);
      seen.add(v);
      if (col + 1 < 31) { n++; if (hexVariant({ col: col + 1, row }) !== v) diff++; }
    }
    expect(seen.size).toBe(12);
    expect(diff / n).toBeGreaterThan(0.8);
  });
  it('bağlamalar kayıt defterinde; kullanılmayan şerit yok', () => {
    for (const id of ['levitate', 'telekinesis', 'power-word-kill']) expect(SPELL_FX[id]?.sprite).toBeTruthy();
    expect(Object.values((B as unknown as { zemin: Record<string, string> }).zemin)).toEqual(expect.arrayContaining(['zemin-deprem-yarigi', 'zemin-sessizlik', 'zemin-gunisigi']));
    for (const n of ['yukselen-toz', 'zemin-deprem-yarigi', 'zemin-sessizlik', 'zemin-gunisigi', 'durum-olum-sozu']) expect(recs[`efekt-${n}`] as { kullanilmiyor?: boolean }).not.toHaveProperty('kullanilmiyor');
  });
});

describe('Kuyruk E4c: yalnız görsel (kural, durum, replay aynı)', () => {
  it('Levitate, Power Word Kill, Earthquake, Silence: efekt hesabı durumu değiştirmez; replay aynı sonucu verir', () => {
    for (const [id, lv, aim] of [['levitate', 3, { targetId: 'D' }], ['power-word-kill', 9, { targetId: 'D' }], ['earthquake', 8, { targetHex: { col: 10, row: 5 } }], ['silence', 2, { targetHex: { col: 5, row: 5 } }]] as const) {
      const sp = spell(id);
      const s = field(sp);
      const r = execute(s, { type: 'cast_spell', actorId: 'A', spellName: sp.name, slotLevel: lv, ...aim }, P1, seededRng(5));
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
