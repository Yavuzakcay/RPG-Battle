/** KQ6-4 (FH1 düzeltmesi): Hızlı savaş kurulumu (createMapBattle, Game Master paneli yok) üstünde hedefsiz altıgen büyüsü. */
import { describe, expect, it } from 'vitest';
import { createMapBattle, planParticipants } from '../app/setup';
import { demoCharacters } from '../screens/fixtures';
import { getMonster } from '../data';
import { dispatch, contextFor } from '../ui/session';
import { execute } from './commands';
import { fireHexProblem, freeHexAnyOn } from './ignite';
import { hexKey, type Offset } from '../rules/hex';
import type { BattleState, Combatant } from './types';
import { CURRENT_RULES } from './ruleVersion';
import { surfaceStyle } from '../ui/sprites';

function quick(mapId = 'orman-heykel-golu'): BattleState {
  const chars = demoCharacters();
  const plan = { party: chars.map((c) => ({ id: c.id, sheet: c.sheet })), enemies: [{ monster: getMonster('wolf'), count: 1 }], mapId, variantId: 'gunduz' } as never;
  const sess = dispatch(createMapBattle(planParticipants(plan), plan, () => 0.5), { type: 'start_battle' }, () => 0.5);
  const s = sess.state;
  const wiz = Object.values(s.combatants).find((c) => c.spellNames.includes('Fire Bolt')) as Combatant;
  return { ...s, turnIndex: s.order.indexOf(wiz.id) } as BattleState;
}
const wizOf = (s: BattleState) => Object.values(s.combatants).find((c) => c.spellNames.includes('Fire Bolt')) as Combatant;
/** Büyücü için menzil ve görüşte, harfi `tile` olan, boş altıgen. */
function hexOf(s: BattleState, tile: string, spellName = 'Fire Bolt'): Offset {
  const me = wizOf(s); const sp = { name: spellName, rangeFt: spellName === 'Ray of Frost' ? 60 : 120 } as never;
  const occupied = new Set(Object.values(s.combatants).filter((c) => c.pos).map((c) => hexKey(c.pos as Offset)));
  const tiles = s.map?.tiles ?? [];
  for (let r = 0; r < tiles.length; r++) for (let c = 0; c < (tiles[0]?.length ?? 0); c++) {
    const h = { col: c, row: r };
    if (tiles[r]?.[c] === tile && !occupied.has(hexKey(h)) && !fireHexProblem(s, me, sp, h)) return h;
  }
  throw new Error(`uygun ${tile} altıgeni yok`);
}
const cast = (s: BattleState, spell: string, h: Offset) => execute(s, { type: 'cast_spell', actorId: wizOf(s).id, spellName: spell, targetHex: h } as never, contextFor(s, wizOf(s).id), () => 0.5);
const surf = (s: BattleState) => (s.map?.zones ?? []).filter((z) => z.surface).map((z) => ({ k: z.surface, n: z.hexes.length }));

describe('Hızlı savaşta hedefsiz altıgen (FH1 düzeltmesi)', () => {
  it('hızlı savaş yeni savaşı sürüm ≥ 81 ve freeHexTarget AÇIK başlar (Game Master paneli olmadan)', () => {
    const s = quick(); expect(s.kuralSurumu).toBe(CURRENT_RULES); expect(CURRENT_RULES).toBeGreaterThanOrEqual(81);
    expect(freeHexAnyOn(s)).toBe(true); expect(s.map?.ruleToggles?.freeHexTarget).toBeUndefined();
    expect(freeHexAnyOn({ ...s, kuralSurumu: 80 })).toBe(false); // eski kayıtlı savaş eski davranışta
  });
  it('Fire Bolt göle: buhar; boş zemine: boşa gitti; çimene: tutuşur', () => {
    const s = quick();
    const w = cast(s, 'Fire Bolt', hexOf(s, 'w')); if (!w.ok) throw new Error(w.error);
    expect(surf(w.state).map((x) => x.k)).toContain('steam');
    const e = cast(s, 'Fire Bolt', hexOf(s, '.')); if (!e.ok) throw new Error(e.error);
    expect(surf(e.state)).toEqual([]);
    expect(e.events.some((x) => x.type === 'spell_cast' && /boşa gitti/.test(x.note ?? ''))).toBe(true);
    const g = cast(s, 'Fire Bolt', hexOf(s, 'g')); if (!g.ok) throw new Error(g.error);
    expect(surf(g.state).map((x) => x.k)).toContain('fire');
  });
  it('Fire Bolt sandığa: nesnenin AC\'sine karşı isabet zarı (roll), isabette hasar', () => {
    const s0 = quick(); const h = hexOf(s0, '.');
    const withChest = execute(s0, { type: 'place_object', kind: 'chest', at: h } as never, { isGm: true } as never, () => 0.5);
    if (!withChest.ok) throw new Error(withChest.error);
    const r = cast(withChest.state, 'Fire Bolt', h); if (!r.ok) throw new Error(r.error);
    const dmg = r.events.find((x) => x.type === 'object_damaged') as { roll?: { d20: number; ac: number; hit: boolean } } | undefined;
    expect(dmg?.roll?.ac).toBeGreaterThanOrEqual(15); expect(typeof dmg?.roll?.d20).toBe('number');
  });
  it('Ray of Frost göle: yalnız O altıgen donar (komşu su altıgenleri değil); sığ (n) için de', () => {
    for (const tile of ['w', 'n']) {
      const s = quick(); const h = hexOf(s, tile, 'Ray of Frost');
      const r = cast(s, 'Ray of Frost', h); if (!r.ok) throw new Error(r.error);
      const ice = (r.state.map?.zones ?? []).filter((z) => z.surface === 'ice');
      expect(ice.length, tile).toBeGreaterThan(0);
      expect(ice.flatMap((z) => z.hexes).map(hexKey), tile).toEqual([hexKey(h)]);
    }
  });
  it('Guiding Bolt boş altıgene: 1. seviye slot gider', () => {
    const s = quick(); const w = wizOf(s); const h = hexOf(s, '.', 'Guiding Bolt');
    const r = cast({ ...s, combatants: { ...s.combatants, [w.id]: { ...w, spellNames: [...w.spellNames, 'Guiding Bolt'] } } }, 'Guiding Bolt', h); if (!r.ok) throw new Error(r.error);
    expect((wizOf(r.state).spellSlots?.[0] ?? 0)).toBe((w.spellSlots?.[0] ?? 0) - 1);
  });
  it('KQ6-11 gerçek hızlı savaş haritasında: Fire Bolt sığ (n) ve derin (w) göle: buhar yüzeyi + günlük notu; yüzey çizimi okunur (dolgu ≥ 0,6)', () => {
    for (const tile of ['n', 'w']) {
      const s = quick(); const h = hexOf(s, tile);
      const r = cast(s, 'Fire Bolt', h); if (!r.ok) throw new Error(r.error);
      const z = (r.state.map?.zones ?? []).filter((x) => x.surface === 'steam');
      expect(z.flatMap((x) => x.hexes).map(hexKey), tile).toEqual([hexKey(h)]);
      expect(r.events.some((e) => e.type === 'surface_reacted' && /buhar|steam/i.test(JSON.stringify(e))), tile).toBe(true);
    }
    expect(surfaceStyle('buhar').dolguOpak).toBeGreaterThanOrEqual(0.6);
    expect(surfaceStyle('buhar').dokuOpak).toBeGreaterThanOrEqual(0.6);
  });
  it('KQ6-11 yıldırım göle: bağlı su altıgenlerinde zincir (≤ 7) günlüğe yazılır, kurban olmasa da; sürüm 81 eski davranış', () => {
    const s0 = quick(); const w = wizOf(s0);
    const s = { ...s0, combatants: { ...s0.combatants, [w.id]: { ...w, spellNames: [...w.spellNames, 'Lightning Bolt'] } } } as BattleState;
    const tiles = s.map?.tiles ?? []; let found = false;
    for (let r = 0; r < tiles.length && !found; r++) for (let c = 0; c < (tiles[0]?.length ?? 0) && !found; c++) {
      if (tiles[r]?.[c] !== 'w') continue;
      const res = execute(s, { type: 'cast_spell', actorId: w.id, spellName: 'Lightning Bolt', targetHex: { col: c, row: r } } as never, contextFor(s, w.id), () => 0.5);
      if (!res.ok) continue;
      found = true;
      const chain = res.events.find((e) => e.type === 'surface_reacted' && (e as { row?: string }).row === 'lightningWater') as { hexes: Offset[] } | undefined;
      expect(chain, 'zincir notu').toBeTruthy(); expect(chain!.hexes.length).toBeGreaterThanOrEqual(1); expect(chain!.hexes.length).toBeLessThanOrEqual(7);
      const old = execute({ ...s, kuralSurumu: 81 }, { type: 'cast_spell', actorId: w.id, spellName: 'Lightning Bolt', targetHex: { col: c, row: r } } as never, contextFor(s, w.id), () => 0.5);
      if (old.ok) expect(old.events.some((e) => e.type === 'surface_reacted' && (e as { row?: string }).row === 'lightningWater')).toBe(false);
    }
    expect(found).toBe(true);
  });
});
