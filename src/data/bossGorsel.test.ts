/**
 * BOSS-GORSEL-1: Mühür Ruhu görsel eşlemesi (`data/boss-gorsel.json`, `scripts/boss-gorsel.mjs`). 30 kayıt (10 çizgi × 3 kademe),
 * ölçek Sv.1 0,25 / Sv.2 0,6 / Sv.3 1, her `dosya` public/ altında var. Görseller teste girmez: yalnız dosya adları listelenir.
 */
import { describe, expect, it } from 'vitest';
import data from '../../data/boss-gorsel.json';
import bosslar from '../../data/bosslar-muhur.json';
import kadim from '../../data/canavarlar-kadim.json';
import dexEsleme from '../../data/dungeondex-gorsel-esleme.json';

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

/**
 * GORSEL-MUCEVHER-EJDERHA: 15 mücevher ejderhası (`boss-gorsel.json` `mucevher`, kimlikler `canavarlar-kadim.json` `hatlar`).
 * Her kimliğin görseli var, savaş jetonu/Dungeondex vitrini `avatar` aynı dosya, jeton ölçeği yazılmaz (boyut sınıfından).
 * Alfa Yetişkin `dragon-alpha-adult-a`dan; `-b` bağlanmaz. Görseller teste girmez: yalnız dosya adları.
 */
const K = kadim as unknown as { hatlar: Record<string, { kimlikler: string[] }>; canavarlar: Array<{ id: string; size: string; avatar?: string; jetonOlcek?: number }> };
const MU = (data as unknown as { mucevher: Record<string, { dosya: string | null; hat: string; evre: number; kaynak: string }> }).mucevher;
const DEX = (dexEsleme as unknown as { kategoriler: { canavar: Record<string, { kaynak: string; ref: string }> } }).kategoriler.canavar;
const KAYNAK: Record<string, string> = {
  alphlet: 'dragon-alpha-yavru', alphyr: 'dragon-alpha-genc', alphadrake: 'dragon-alpha-adult-a',
  omeglet: 'dragon-omega-yavru', omegyr: 'dragon-omega-genc', omegadrake: 'dragon-omega-adult',
  deltlet: 'dragon-delta-yavru', deltyr: 'dragon-delta-genc', deltadrake: 'dragon-delta-adult',
  sigmlet: 'dragon-sigma-yavru', sigmyr: 'dragon-sigma-genc', sigmadrake: 'dragon-sigma-adult',
  gamlet: 'dragon-gamma-yavru', gammyr: 'dragon-gamma-genc', gammadrake: 'dragon-gamma-adult',
};

/** KATALOG-DEX-DENGE-HAZIRLIK: kadim yaratık görselleri (`boss-gorsel.json` `kadim`); Ember Egg görselsiz, açık deniz fazı ortak görsel. */
describe('KATALOG-DEX-DENGE-HAZIRLIK kadim görselleri', () => {
  const KD = (data as unknown as { kadim: Record<string, { dosya: string; ortak?: string; ayna?: boolean }> }).kadim;
  it('görseli olan 7 kadim kaydı + ortak görselli açık deniz fazı; dosyalar var, avatar aynı dosya', () => {
    const own = ['tutsak-dragon', 'dragon-of-hexonia-a', 'dragon-of-hexonia-b', 'kozmik-anka', 'kozmik-anka-savas', 'ocean-nightmare', 'titan-of-nightmare'];
    expect(Object.keys(KD).sort()).toEqual([...own, 'ocean-nightmare-open-sea'].sort());
    for (const id of own) { expect(KD[id]!.dosya, id).toBe(`boss/${id}.webp`); expect(files.has(KD[id]!.dosya), id).toBe(true); }
    expect(KD['ocean-nightmare-open-sea']).toEqual({ dosya: 'boss/ocean-nightmare.webp', ortak: 'ocean-nightmare' });
    for (const id of Object.keys(KD)) expect(K.canavarlar.find((m) => m.id === id)!.avatar, id).toBe(KD[id]!.dosya);
    expect(K.canavarlar.find((m) => m.id === 'ember-egg')!.avatar).toBeUndefined();
  });
  it('Hexonia yönü veriden: b (yon sol) aynalı, a değil', () => {
    expect(KD['dragon-of-hexonia-b']!.ayna).toBe(true);
    expect(KD['dragon-of-hexonia-a']!.ayna).toBeUndefined();
  });
});

describe('GORSEL-MUCEVHER-EJDERHA', () => {
  const ids = Object.values(K.hatlar).flatMap((h) => h.kimlikler);
  it('15 kimliğin hepsinin görseli var; kaynak dosya eşlemesi doğru', () => {
    expect(ids).toHaveLength(15);
    expect(new Set(Object.keys(MU))).toEqual(new Set(ids));
    expect(new Set(Object.keys(KAYNAK))).toEqual(new Set(ids));
    for (const id of ids) {
      expect(MU[id]!.dosya, id).toBe(`boss/${id}.webp`);
      expect(files.has(`boss/${id}.webp`), id).toBe(true);
      expect(MU[id]!.kaynak.replace(/\.[^.]+$/, ''), id).toBe(KAYNAK[id]);
    }
    expect(Object.values(MU).some((g) => g.kaynak.startsWith('dragon-alpha-adult-b'))).toBe(false);
  });
  it('savaş jetonu ve Dungeondex vitrini aynı görsel; ölçek boyut sınıfından (jetonOlcek yok)', () => {
    for (const id of ids) {
      const m = K.canavarlar.find((x) => x.id === id)!;
      expect(m.avatar, id).toBe(`boss/${id}.webp`);
      expect(m.jetonOlcek, id).toBeUndefined();
      expect(['M', 'L', 'H'][MU[id]!.evre - 1], id).toBe(m.size);
      expect(DEX[id], id).toMatchObject({ kaynak: 'jeton', ref: `boss/${id}.webp` });
    }
  });
});
