/**
 * Kuyruk K56: arazi × büyü (kural sürümü 33, anahtar `araziBuyuEtkisi`). Zemin etiketleri, ateş/soğuk dokunuşunun
 * bıraktığı yüzey, yayılma, eski sürüm ve anahtar kapalıyken etkisizlik, hasar zarı değişmez, replay (`run`), bilgi
 * kartı, yapay zekâ sezgisi.
 */
import { describe, expect, it } from 'vitest';
import { mk } from './fixtures';
import { caster, field, run } from './k19spells.test';
import { tagsOfChar, terrainEndangersSide, terrainTags } from './terrainSpell';
import { terrainInfo } from '../ui/mapView';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const foe = (id: string, p: Partial<Combatant> = {}) => mk(id, { side: 'enemies', hp: 300, maxHp: 300, ...p });
/** Haritanın sütun aralığını verilen zemin harfiyle doldur (bütün satırlarda). */
function paint(s: BattleState, ch: string, cols: [number, number]): BattleState {
  const tiles = s.map!.tiles.map((row) => row.split('').map((c, i) => (i >= cols[0] && i <= cols[1] && c !== '#' ? ch : c)).join(''));
  return { ...s, map: { ...s.map!, tiles } };
}
const pos = { A: { col: 1, row: 3 }, F0: { col: 8, row: 3 } };
const fireball = (k: number, ch = 'g', toggles?: Record<string, boolean>) => {
  const s = paint(field([caster({ spellNames: ['Fireball'] }), foe('F0')], pos, k, toggles), ch, [4, 13]);
  return run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Fireball', targetHex: { col: 8, row: 3 } } as Command);
};
const terrainEv = (evs: BattleEvent[]) => evs.filter((e): e is Extract<BattleEvent, { type: 'surface_reacted' }> => e.type === 'surface_reacted' && e.reaction === 'terrain');

describe('K56 zemin etiketleri', () => {
  it('zemin türünden etiket', () => {
    expect(tagsOfChar('g')).toEqual(['yanici', 'kuru']);
    expect(tagsOfChar('w')).toContain('derin-su');
    expect(tagsOfChar('o')).toEqual([]);
  });
});

describe('K56 ateş × arazi', () => {
  it('kuru çalılıkta Fireball alev yüzeyi bırakır, bir halka yayılır (sürüm 33)', () => {
    const r = fireball(33);
    const t = terrainEv(r.events);
    expect(t).toHaveLength(1);
    expect(t[0]?.row).toBe('arazi:ates-kuru-yanici');
    const fire = r.state.map?.zones?.find((z) => z.surface === 'fire');
    expect(fire).toBeTruthy();
    // Yayılma: alanın (4 altıgen yarıçap) bir halka dışı da yanar.
    expect(fire!.hexes.some((h) => Math.abs(h.col - 8) === 5)).toBe(true);
    expect(fire!.until).toBe(r.state.round + 1);
  });
  it('karda su; ıslak zemin K55 tablosunda (buhar, arazi satırı yinelenmez)', () => {
    expect(terrainEv(fireball(33, 'q').events)[0]?.row).toBe('arazi:ates-soguk');
    const wet = fireball(33, 'n').events;
    expect(terrainEv(wet)).toHaveLength(0);
    expect(wet.some((e) => e.type === 'surface_reacted' && e.reaction === 'steam')).toBe(true);
  });
  it('sürüm 32 ve anahtar kapalıyken etkisiz', () => {
    expect(terrainEv(fireball(32).events)).toHaveLength(0);
    expect(terrainEv(fireball(33, 'g', { araziBuyuEtkisi: false }).events)).toHaveLength(0);
  });
  it('hasar zarları değişmez (aynı tohum, sürüm 32 ↔ 33)', () => {
    const dmg = (k: number) => fireball(k).events.filter((e) => e.type === 'save_resolved').map((e) => (e as { appliedDamage: number }).appliedDamage);
    expect(dmg(33)).toEqual(dmg(32));
  });
  it('kayalık zeminde etki yok', () => {
    expect(terrainEv(fireball(33, 't').events)).toHaveLength(0);
  });
});

describe('K56 soğuk × arazi', () => {
  it('Cone of Cold sıcak zeminde buhar bırakır; kayalıkta etki yok', () => {
    const cone = (ch: string) => {
      const s = paint(field([caster({ spellNames: ['Cone of Cold'] }), foe('F0')], { A: { col: 1, row: 3 }, F0: { col: 4, row: 3 } }, 33), ch, [2, 13]);
      return run(s, { type: 'cast_spell', actorId: 'A', spellName: 'Cone of Cold', targetHex: { col: 4, row: 3 } } as Command);
    };
    const r = cone('f');
    expect(terrainEv(r.events)[0]?.row).toBe('arazi:soguk-sicak');
    expect(r.state.map?.zones?.some((z) => z.surface === 'steam')).toBe(true);
    expect(terrainEv(cone('t').events)).toHaveLength(0);
  });
});

describe('K56 bilgi kartı ve yapay zekâ', () => {
  it('bilgi kartı zemin türünü yazar (sürüm 33), eskisinde yazmaz', () => {
    const s33 = paint(field([caster(), foe('F0')], pos, 33), 'g', [4, 6]);
    expect(terrainTags(s33, { col: 5, row: 3 })).toEqual(['yanici', 'kuru']);
    expect(terrainInfo(s33, { col: 5, row: 3 })).toContain('(yanıcı, kuru)');
    expect(terrainInfo(paint(field([caster(), foe('F0')], pos, 32), 'g', [4, 6]), { col: 5, row: 3 })).not.toContain('yanıcı');
  });
  it('dostun yanında yüzey bırakacak arazi etkisi tehlikeli sayılır', () => {
    const r = fireball(33);
    const ally = { ...r.state, combatants: { ...r.state.combatants, C: { ...mk('C', { ownerId: 'p1' }), pos: { col: 9, row: 3 } } } };
    expect(terrainEndangersSide(ally, r.events, 'party')).toBe(true);
    expect(terrainEndangersSide(r.state, r.events, 'party')).toBe(false);
  });
});
