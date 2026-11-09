/**
 * Kuyruk E4: zemin-ek (yağ, diken zemini, sulu kar, böcek sürüsü, kara dokunaç; su satırı kullanılmıyor) ve isin-ek
 * (prizma, kuvvet, nekrotik, asit-zehir ışını) sayfalarının içe aktarılması ve büyülere bağlanması (yalnız görsel).
 * Her bağlama gerçek motorla dökülür (e2Verify); replay ve durum değişmez.
 */
import { describe, expect, it } from 'vitest';
import e2 from '../../../data/efekt-e2.json';
import kesim from '../../../data/efekt-kesim.json';
import { applyEvents, execute, replay } from '../../battle';
import type { BattleEvent } from '../../battle/types';
import { P1 } from '../../battle/fixtures';
import { spells } from '../../data';
import { seededRng } from '../../rules/dice';
import { B, FX, SPELL_FX, fxShots, groundFx } from './fxPlan';
import { field, verifySpell } from './e2Verify';

type Rec = { kare: number; sure: number; yol: string; kaynak: string; kullanilmiyor?: boolean; dongu: boolean };
const recs = (e2 as unknown as { efektler: Record<string, Rec> }).efektler;
const spell = (id: string) => spells.find((s) => s.id === id)!;

describe('Kuyruk E4: içe aktarma', () => {
  it('iki sayfa kayıtlı (klasör efekt); su satırı işaretli "kullanılmıyor" ve hiçbir bağlamada yok', () => {
    const sh = (kesim as unknown as { sayfalar: Record<string, { klasor?: string; adlar: string[]; kullanilmiyor?: string[] }> }).sayfalar;
    expect(sh['zemin-ek']?.klasor).toBe('efekt');
    expect(sh['zemin-ek']?.adlar).toEqual(['zemin-yag', 'zemin-dikenli', 'zemin-sulu-kar', 'zemin-bocek', 'zemin-su-eski', 'zemin-dokunac']);
    expect(sh['isin-ek']?.adlar).toEqual(['isin-prizma', 'isin-kuvvet', 'isin-nekrotik', 'isin-asit']);
    expect(recs['efekt-zemin-su-eski']?.kullanilmiyor).toBe(true);
    const bound = JSON.stringify([B.zemin, B.isin, SPELL_FX]);
    expect(bound).not.toContain('zemin-su-eski');
    // Prizma satırının çıkış kıvılcımı olan ilk karesi döngüden çıkarıldı (3 kare); diğer ışınlar 4.
    expect(recs['efekt-isin-prizma']?.kare).toBe(3);
    for (const n of ['kuvvet', 'nekrotik', 'asit']) expect(recs[`efekt-isin-${n}`]?.kare).toBe(4);
    for (const n of ['yag', 'dikenli', 'sulu-kar', 'bocek', 'dokunac']) expect(FX[`zemin-${n}`]?.loop).toBe(true);
  });
});

describe('Kuyruk E4: büyü bağlama (gerçek motor → beklenen sprite çizimde)', () => {
  const WANT: Record<string, string> = {
    grease: 'zemin-yag', 'spike-growth': 'zemin-dikenli', 'sleet-storm': 'zemin-sulu-kar', 'insect-plague': 'zemin-bocek', 'black-tentacles': 'zemin-dokunac',
    'prismatic-spray': 'isin-prizma', disintegrate: 'isin-kuvvet', 'ray-of-sickness': 'isin-nekrotik', 'finger-of-death': 'isin-nekrotik', 'poison-spray': 'isin-asit',
  };
  for (const [id, sprite] of Object.entries(WANT)) {
    it(`${id} → ${sprite}`, () => {
      const v = verifySpell(spell(id));
      expect(v.ok, JSON.stringify(v)).toBe(true);
      expect(v.expected.some((e) => e.endsWith(sprite)), JSON.stringify(v.expected)).toBe(true);
    });
  }
  it('Prismatic Spray: hedef başına bir prizma ışını (hedefsiz spell_cast + hedef başına map_effect)', () => {
    const sp = spell('prismatic-spray');
    const s = field(sp);
    const r = execute(s, { type: 'cast_spell', actorId: 'A', spellName: sp.name, slotLevel: 7, targetId: 'B' }, P1, seededRng(3));
    if (!r.ok) throw new Error(r.error);
    const hit = r.events.filter((e) => e.type === 'map_effect' && e.text.startsWith('Prismatic Spray (')).length;
    expect(hit).toBeGreaterThan(0);
    const rays = fxShots(r.events, s).filter((x) => x.sprite.id === 'isin-prizma' && x.from && x.to);
    expect(rays).toHaveLength(Math.min(6, hit));
  });
  it('asit/zehir/nekrotik/kuvvet çizgi alanı ışın dokusu (B.isin)', () => {
    expect(B.isin).toMatchObject({ acid: 'isin-asit', poison: 'isin-asit', necrotic: 'isin-nekrotik', force: 'isin-kuvvet' });
  });
  it('Grease: eski gres yüzeyi korunur, yağ dokusu üstüne biner (aynı bölgede iki katman)', () => {
    const sp = spell('grease');
    const s = field(sp);
    const r = execute(s, { type: 'cast_spell', actorId: 'A', spellName: sp.name, slotLevel: 1, targetHex: { col: 9, row: 5 } }, P1, seededRng(2));
    if (!r.ok) throw new Error(r.error);
    expect(groundFx(applyEvents(s, r.events)).patches.map((p) => p.sprite.id)).toContain('zemin-yag');
  });
});

describe('Kuyruk E4: yalnız görsel (kural, durum, replay aynı)', () => {
  it('Prismatic Spray ve Spike Growth: efekt hesabı durumu değiştirmez; replay aynı sonucu verir', () => {
    for (const [id, aim] of [['prismatic-spray', { targetId: 'B' }], ['spike-growth', { targetHex: { col: 9, row: 5 } }]] as const) {
      const sp = spell(id);
      const s = field(sp);
      const r = execute(s, { type: 'cast_spell', actorId: 'A', spellName: sp.name, slotLevel: Math.max(1, sp.level), ...aim }, P1, seededRng(5));
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
