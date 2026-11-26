/**
 * BOSS-GORSEL-1: Mühür Ruhu görsel eşlemesi (`data/boss-gorsel.json`, `scripts/boss-gorsel.mjs`). 30 kayıt (10 çizgi × 3 kademe),
 * ölçek Sv.1 0,25 / Sv.2 0,6 / Sv.3 1, her `dosya` public/ altında var. Görseller teste girmez: yalnız dosya adları listelenir.
 */
import { describe, expect, it } from 'vitest';
import data from '../../data/boss-gorsel.json';
import bosslar from '../../data/bosslar-muhur.json';

const files = new Set(Object.keys(import.meta.glob('/public/boss/*.webp')).map((p) => p.replace('/public/', '')));
const G = (data as unknown as { olcek: Record<string, number>; gorseller: Record<string, { dosya: string | null; kademe: number; cizgi: string; olcek: number }> }).gorseller;
const ids = (bosslar as unknown as { canavarlar: Array<{ id: string; kademe: number }> }).canavarlar;

describe('BOSS-GORSEL-1', () => {
  it('30 kayıt, hepsi bir Mühür Ruhu yaratığı; görseli olmayan yok, dosyalar var', () => {
    expect(Object.keys(G)).toHaveLength(30);
    expect(new Set(Object.keys(G))).toEqual(new Set(ids.map((m) => m.id)));
    for (const [id, g] of Object.entries(G)) {
      expect(g.dosya, id).toBe(`boss/${id}.webp`);
      expect(files.has(g.dosya as string), id).toBe(true);
    }
  });
  it('ölçek kademeden: Sv.1 0,25, Sv.2 0,6, Sv.3 1; çizgi başına üç kademe', () => {
    for (const m of ids) {
      expect(G[m.id]!.kademe, m.id).toBe(m.kademe);
      expect(G[m.id]!.olcek, m.id).toBe({ 1: 0.25, 2: 0.6, 3: 1 }[m.kademe]);
    }
    const byLine: Record<string, number[]> = {};
    for (const g of Object.values(G)) (byLine[g.cizgi] ??= []).push(g.kademe);
    expect(Object.keys(byLine)).toHaveLength(10);
    for (const k of Object.values(byLine)) expect(k.sort()).toEqual([1, 2, 3]);
  });
});
