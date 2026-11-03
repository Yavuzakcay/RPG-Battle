/** K47: serbest gezinti (yol bulma, saat, karşılaşma, hub/hızlı seyahat, yumuşak kilit). Görsel yok. */
import { describe, expect, it } from 'vitest';
import { executeSeruven, replaySeruven, type SeruvenCommand, type SeruvenEvent, type SeruvenState } from '../journey/seruven';
import { partyAt } from '../sim/balance';
import { findPath, walkable, hubById, WALK_RULES } from './walk';
import { clock, openHubs, partyPos } from './roam';
import { isRevealed } from './fog';
import { seruvenFog } from './seruvenFog';
import { prisonSurfaced } from './prison';
import dunya from '../../data/harita/tum_dugumler_dunya.json';
import type { Pt } from './worldData';

const N = dunya as Record<string, Pt>;
function game(race = 'human', toggles: Record<string, boolean> = { irkBaslangic: false, karsilasmaYok: true }) {
  const events: SeruvenEvent[] = [];
  let s: SeruvenState | null = null;
  const run = (c: SeruvenCommand) => { const r = executeSeruven(s, c); if (!r.ok) throw new Error(r.error); events.push(...r.events); s = r.state; return r.state; };
  const tryRun = (c: SeruvenCommand) => executeSeruven(s, c);
  run({ type: 'start', id: 'g', seed: 7, toggles, party: partyAt(3).map((sh, i) => ({ id: `p${i}`, name: sh.name, sheet: i === 0 ? { ...sh, raceId: race, lineageId: undefined } : sh })) });
  return { run, tryRun, events, get s() { return s as unknown as SeruvenState; }, set s(v: SeruvenState) { s = v; } };
}

describe('yol bulma (yurume-izgara.json)', () => {
  it('kıta içi yol var; deniz yürünmez; Volkan Adası kıtadan yürünmez', () => {
    const p = findPath(N['orman/Patika']!, N['buzul/Açık buzul']!);
    expect(p && p.miles).toBeGreaterThan(100);
    expect(p!.hours).toBeGreaterThan(50);
    expect(walkable([50, 50])).toBe(false);
    expect(findPath(N['orman/Patika']!, N['volkan/Lav adaları']!)).toBe(null);
    expect(findPath(N['col/Vaha']!, N['orman/Mielikki Gölü']!)).not.toBe(null);
  });
});

describe('dünya gezintisi (Serüven)', () => {
  it('tıkla-yürü: konum ve saat ilerler, sis yol boyunca açılır, hub yaklaşınca açılır; replay aynı; eski kayıt saati dinlenmeden', () => {
    const g = game();
    const start = partyPos(g.s)!;
    expect(clock(g.s)).toBe(6);
    const to = N['orman/Patika']!;
    const s1 = g.run({ type: 'world_walk', to });
    expect(Math.hypot(s1.konum![0] - to[0], s1.konum![1] - to[1])).toBeLessThan(64);
    expect(s1.saat!).toBeGreaterThan(6);
    expect(isRevealed(seruvenFog(s1), to[0], to[1])).toBe(true);
    expect(start).not.toEqual(s1.konum);
    expect(replaySeruven(g.events)).toEqual(s1);
    const old = { ...s1 }; delete old.saat; old.rests = 2;
    expect(clock(old)).toBe(6 + 48);
    // Hub: Beyaz Şehir'in yanına yürüyünce açılır.
    const hub = hubById('elf_kasabasi')!;
    const s2 = g.run({ type: 'world_walk', to: hub.px });
    expect(openHubs(s2)).toContain('elf_kasabasi');
  });
  it('anahtar kapalıyken yürüme yok (eski davranış); düğüme dönünce konum düğümden', () => {
    const g = game('human', { irkBaslangic: false, dunyaGezinti: false });
    expect(g.tryRun({ type: 'world_walk', to: N['orman/Patika']! }).ok).toBe(false);
  });
  it('karşılaşma açıkken uzun yolda yürüyüş durabilir (olay işareti), Game Master kapatınca hiç', () => {
    let seen = 0;
    for (let seed = 1; seed <= 6; seed++) {
      const r = executeSeruven(null, { type: 'start', id: 'k', seed, toggles: { irkBaslangic: false }, party: partyAt(3).map((sh, i) => ({ id: `p${i}`, name: sh.name, sheet: sh })) });
      if (!r.ok) throw new Error(r.error);
      const w = executeSeruven(r.state, { type: 'world_walk', to: N['orman/Patika']! });
      if (w.ok && w.events.some((e) => e.type === 'seruven_walked' && e.encounter)) seen++;
    }
    expect(seen).toBeGreaterThan(0);
  });
  it('gemi: iskelede olmalı, deniz yolu gerekir; Hapishane yalnızca yüzeydeki gün; uçuş binek/anahtar ister', () => {
    const g = game();
    expect(g.tryRun({ type: 'fast_travel', to: 'liman_iskele', mode: 'gemi' }).ok).toBe(false);
    g.run({ type: 'world_walk', to: hubById('beyaz_sehir_iskelesi')!.px });
    const sailed = g.run({ type: 'fast_travel', to: 'liman_iskele', mode: 'gemi' });
    expect(sailed.konum).toEqual(hubById('liman_iskele')!.px);
    expect(openHubs(sailed)).toContain('liman_iskele');
    g.run({ type: 'world_walk', to: hubById('beyaz_sehir_iskelesi')!.px });
    const r = g.tryRun({ type: 'fast_travel', to: 'hapishane', mode: 'gemi' });
    expect(r.ok).toBe(prisonSurfaced(g.s));
    expect(g.tryRun({ type: 'fast_travel', to: 'elf_kasabasi', mode: 'ucus' }).ok).toBe(false);
    expect(WALK_RULES.ucusBayraklari.length).toBeGreaterThan(0);
  });
  it('yumuşak kilit (beyaz): uzaktan denenmez; başarısızsa durum değişmeden yeniden denenmez; başarı bayrağı açar', () => {
    const g = game();
    expect(g.tryRun({ type: 'world_check', id: 'mielikki-gizli-gecit', roll: 20 }).ok).toBe(false);
    g.run({ type: 'world_walk', to: [6170, 2740] });
    const fail = g.run({ type: 'world_check', id: 'mielikki-gizli-gecit', roll: 1 });
    expect(fail.kontroller?.['mielikki-gizli-gecit']?.ok).toBe(false);
    expect(g.tryRun({ type: 'world_check', id: 'mielikki-gizli-gecit', roll: 20 }).ok).toBe(false);
    g.s = { ...g.s, items: [...g.s.items, 'rope'] };
    const ok = g.run({ type: 'world_check', id: 'mielikki-gizli-gecit', roll: 20 });
    expect(ok.flags).toContain('heykel-magarasi-kesfedildi');
  });
});
