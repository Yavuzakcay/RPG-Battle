/**
 * 2026-11-03: Yeraltı Nehri (Su Altı Geçidi) dünya haritası yönüne göre aynalandı: şelale ve taş yüz SOLDA (Orman /
 * Mielikki Gölü), vaha kumu SAĞDA (Çöl). Zemin, başlangıç bölgeleri ve Serüven bağlantı uçları aynalı; şelale geçidi
 * bayrağı bağlantıyı iki yönde açar; eski kayıtların çizimi `migrateFlippedMaps` ile eski yöne döner.
 */
import { describe, expect, it } from 'vitest';
import { getMap } from '../map/maps';
import { terrainOf } from '../map/terrain';
import { executeSeruven, linkById, linkCrossable, linkOpen, type SeruvenCommand, type SeruvenState } from './seruven';
import { linkSession } from '../app/seruvenBattle';
import { migrateFlippedMaps } from '../app/battleSave';
import { partyAt } from '../sim/balance';
import type { BattleEvent } from '../battle';

/** Aynalamadan önceki zemin (scripts/k32-yeralti-nehri.py `T`). */
const ESKI = [
  '#####################', '#####################', '###########...#.##...', '#.........#......#...', '..........#......nnn.',
  '....nnnnnnnnnnnnnnnnn', '..........#.....n....', '#.........##.........', '##..#.....###########', '########..###########',
  '#####################',
];
const m = getMap('yeralti-nehri');

type G = { state: SeruvenState };
const begin = (): G => {
  const r = executeSeruven(null, { type: 'start', id: 's', seed: 1, toggles: { irkBaslangic: false }, party: partyAt(3).map((sh, i) => ({ id: `p${i + 1}`, name: sh.name, sheet: sh })) });
  if (!r.ok) throw new Error(r.error);
  return { state: r.state };
};
const step = (g: G, cmd: SeruvenCommand): G => { const r = executeSeruven(g.state, cmd); if (!r.ok) throw new Error(r.error); return { state: r.state }; };
const atNode = (page: string, node: string, flags: string[] = [], pusu = false): SeruvenState => {
  const g = pusu ? step(begin(), { type: 'set_toggle', key: 'koridorPususu', on: true }) : begin();
  return { ...g.state, page, at: node, flags };
};
const link = linkById('yeralti-nehri')!;

describe('Yeraltı Nehri aynalandı (Su Altı Geçidi)', () => {
  it('zemin eski zeminin yatay aynası (21×11, odd-q tek sütun); parti bölgesi vaha tarafında (sağ), başlangıçlar geçilebilir', () => {
    expect([m.size.cols, m.size.rows]).toEqual([21, 11]);
    expect(m.tiles).toEqual(ESKI.map((r) => [...r].reverse().join('')));
    expect(m.startZones.players.every((h) => h.col >= 18)).toBe(true);
    for (const h of [...m.startZones.players, ...m.startZones.enemies]) expect(terrainOf(m.tiles[h.row]![h.col]!).movement).not.toBe('blocked');
  });

  it('bağlantı uçları: a (Vaha) sağda, b (Mielikki Gölü) solda; anında geçit (0 gün); keşif bayrağı şelale geçidi', () => {
    expect(link.uclar.a.every(([c]) => c >= 19)).toBe(true);
    expect(link.uclar.b.every(([c]) => c <= 3)).toBe(true);
    expect([link.sureGun, link.bayrak]).toEqual([0, 'heykel-magarasi-kesfedildi']);
    for (const [c, r] of [...link.uclar.a, ...link.uclar.b]) expect(terrainOf(m.tiles[r - 1]![c - 1]!).movement).not.toBe('blocked');
  });

  it('Orman\'dan giren şelale tarafında (sol), Çöl\'den giren vaha tarafında (sağ) başlar; çıkış karşı uçta', () => {
    for (const [page, node, west] of [['orman', 'mielikki-golu', true], ['col', 'vaha', false]] as const) {
      const s = linkSession(atNode(page, node, ['heykel-magarasi-kesfedildi']), 'yeralti-nehri', () => 0.5)!;
      const party = Object.values(s.state.combatants).filter((c) => c.side === 'party' && c.pos);
      expect(party.length).toBeGreaterThan(0);
      expect(party.every((c) => (west ? c.pos!.col <= 2 : c.pos!.col >= 18))).toBe(true);
      expect(s.state.explore!.exits.every((h) => (west ? h.col >= 18 : h.col <= 2))).toBe(true);
    }
  });

  it('şelale geçidini bulan (bayrak) iki yönde sınavsız geçer, geri kilit uygulanmaz; bayraksız Orman ucunda kapalı', () => {
    const found = atNode('orman', 'mielikki-golu', ['heykel-magarasi-kesfedildi']);
    expect([linkOpen(found, link), linkCrossable(found, link)]).toEqual([true, true]);
    const none = atNode('orman', 'mielikki-golu');
    expect([linkOpen(none, link), linkCrossable(none, link)]).toEqual([false, false]);
    expect(executeSeruven(atNode('col', 'vaha', ['heykel-magarasi-kesfedildi']), { type: 'link_check', link: 'yeralti-nehri', roll: 20 }).ok).toBe(false);
  });

  it('eski kayıt: zemini eski yönde olan savaşın çizim bayrağı çevrilir (görsel eski zemine oturur); yeni kayıt değişmez', () => {
    const s = linkSession(atNode('col', 'vaha', ['heykel-magarasi-kesfedildi']), 'yeralti-nehri', () => 0.5)!;
    const start = s.events.find((e) => e.type === 'battle_started') as Extract<BattleEvent, { type: 'battle_started' }>;
    expect(migrateFlippedMaps([start])).toEqual([start]);
    const old = { ...start, state: { ...start.state, map: { ...start.state.map!, tiles: [...ESKI], mirrored: false } } };
    const [mig] = migrateFlippedMaps([old]) as Array<typeof start>;
    expect(mig!.state.map!.mirrored).toBe(true);
    expect(mig!.state.map!.tiles).toEqual(ESKI);
    expect(getMap('yeralti-nehri', { mirrored: true }).tiles).toEqual(ESKI);
    // Eski aynalı kayıt (zemini bugünkü yönde): bayrak kalkar.
    const oldMirrored = { ...start, state: { ...start.state, map: { ...start.state.map!, mirrored: true } } };
    expect((migrateFlippedMaps([oldMirrored]) as Array<typeof start>)[0]!.state.map!.mirrored).toBe(false);
  });
});
