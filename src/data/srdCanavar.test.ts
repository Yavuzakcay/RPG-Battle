/**
 * Görev D1: oyunun canavar verisi SRD 5.2.1 stat bloklarıyla aynı (`data/srd/monsters.json` ← `npm run srd:canavar`,
 * docs/SRD_CC_v5.2.1.pdf s. 254–364). Yeni (86+) değerler denetlenir; eski değerler `data/srd-duzeltme.json`'da.
 * Bilinçli farklar burada adıyla: Archmage "Charmed (with Mind Blank)" koşullu (motor uygulamaz), Young White Dragon INT
 * kurtarması PDF'te işaretsiz "2" (değiştirici −2 alındı), Swarm of Insects "Climb or Fly 20 ft (GM's choice)" (uçma).
 */
import { describe, expect, it } from 'vitest';
import srd from '../../data/srd/monsters.json';
import turler from '../../data/canavar-turleri.json';
import yuzme from '../../data/yuzme-hizi.json';
import derinSu from '../../data/derin-su.json';
import { monsters } from './index';

interface SrdMon {
  id: string; name: string; page: number; size: string[]; type: string; ac: number; hp: number; cr: string | null;
  speed: Record<string, number | boolean>; senses: Record<string, number>; abilities: Record<string, number>; saves: Record<string, number>;
  skills: Record<string, number>; resistances: string[]; immunities: string[]; vulnerabilities: string[]; conditionImmunities: string[];
}
const S = (srd as unknown as { monsters: Record<string, SrdMon> }).monsters;
const ABIL = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
const mod = (n: number) => Math.floor((n - 10) / 2);
const note = (u: string[] | undefined, re: RegExp): number => { for (const x of u ?? []) { const m = re.exec(x); if (m) return Number(m[1]); } return 0; };

describe('SRD canavar tablosu (data/srd/monsters.json)', () => {
  it('oyundaki 330 canavarın hepsi SRD tablosunda; tek bilinen PDF yazım hatası raporlu', () => {
    expect(monsters).toHaveLength(330);
    for (const m of monsters) expect(S[m.id], m.id).toBeDefined();
    expect((srd as unknown as { sorunlar: Array<{ id: string }> }).sorunlar.map((p) => p.id)).toEqual(['young-white-dragon']);
  });
  it('yaratık türü (data/canavar-turleri.json) SRD tür satırıyla aynı; "temadan" listesi yok', () => {
    const t = turler as { types: Record<string, string>; temadan?: unknown };
    expect(t.temadan).toBeUndefined();
    for (const m of monsters) expect(t.types[m.id], m.id).toBe(S[m.id]?.type);
  });
  it('yüzme hızı (data/yuzme-hizi.json) SRD hız satırıyla aynı, sayfası yazılı; anahtarlar derin su yüzücüleri', () => {
    const y = yuzme as { hiz: Record<string, number>; sayfa: Record<string, number>; _not: string };
    expect(y._not).not.toMatch(/doğrulanmalı/);
    expect(y._not).toMatch(/SRD 5\.2\.1 hız satırından/);
    const swimmers = monsters.filter((m) => S[m.id]?.speed.swim).map((m) => m.id).sort();
    expect(Object.keys(y.hiz).sort()).toEqual(swimmers);
    const d = derinSu as { swimmers: string[]; swimmers66: string[] };
    expect([...d.swimmers, ...d.swimmers66].sort()).toEqual(swimmers);
    for (const id of swimmers) {
      expect(y.hiz[id], id).toBe(S[id]?.speed.swim);
      expect(y.sayfa[id], id).toBe(S[id]?.page);
    }
  });
  it('monsters.json: boyut, AC, HP, CR, yürüme/uçma hızı, "Hız:" tırmanma/yüzme/kazma notları', () => {
    for (const m of monsters) {
      const s = S[m.id] as SrdMon;
      expect(s.size, `${m.id} boyut`).toContain(m.size);
      expect([m.ac, m.hp, m.cr], m.id).toEqual([s.ac, s.hp, s.cr]);
      expect(m.speed, `${m.id} yürüme`).toBe(s.speed.walk ?? 0);
      expect(m.fly ?? 0, `${m.id} uçma`).toBe((s.speed.fly as number | undefined) ?? (s.speed.climbOrFly as number | undefined) ?? 0);
      const u = m.unsupported as string[] | undefined;
      // Swarm of Insects "Climb or Fly 20 ft (GM's choice)": oyun uçmayı seçti (tırmanma yok).
      expect(note(u, /^Hız:.*\bClimb (\d+) ft/), `${m.id} tırmanma`).toBe((s.speed.climb as number | undefined) ?? 0);
      expect(note(u, /^Hız:.*\bSwim (\d+) ft/), `${m.id} yüzme`).toBe((s.speed.swim as number | undefined) ?? 0);
      expect(note(u, /^Hız:.*\bBurrow (\d+) ft/), `${m.id} kazma`).toBe((s.speed.burrow as number | undefined) ?? 0);
      expect((u ?? []).includes('Hover'), `${m.id} hover`).toBe(!!s.speed.hover);
    }
  });
  it('monsters.json: duyular, yetenek puanları, kurtarmalar, beceriler', () => {
    for (const m of monsters) {
      const s = S[m.id] as SrdMon;
      expect(m.darkvision ?? 0, `${m.id} darkvision`).toBe(s.senses.darkvision ?? 0);
      for (const k of ['Blindsight', 'Tremorsense', 'Truesight']) {
        expect(note(m.unsupported as string[] | undefined, new RegExp(`^Duyu:.*\\b${k} (\\d+) ft`)), `${m.id} ${k}`).toBe(s.senses[k.toLowerCase()] ?? 0);
      }
      expect(m.abilities, `${m.id} yetenek`).toEqual(s.abilities);
      for (const a of ABIL) {
        const want = m.id === 'young-white-dragon' && a === 'int' ? -2 : s.saves[a];
        expect(m.saves?.[a] ?? mod(m.abilities[a]), `${m.id} ${a} kurtarma`).toBe(want);
      }
      expect(m.skills ?? {}, `${m.id} beceri`).toEqual(s.skills);
    }
  });
  it('monsters.json: direnç, hasar bağışıklığı, zayıflık, "Durum bağışıklığı:" notu', () => {
    for (const m of monsters) {
      const s = S[m.id] as SrdMon;
      expect([...(m.resistances ?? [])].sort(), `${m.id} direnç`).toEqual(s.resistances);
      expect([...(m.immunities ?? [])].sort(), `${m.id} bağışıklık`).toEqual(s.immunities);
      expect([...(m.vulnerabilities ?? [])].sort(), `${m.id} zayıflık`).toEqual(s.vulnerabilities);
      const n = (m.unsupported as string[] | undefined)?.find((x) => x.startsWith('Durum bağışıklığı:'));
      const got = n ? n.slice(18).split(',').map((x) => x.trim()).filter((x) => /^[A-Z][a-z]+$/.test(x)).sort() : [];
      expect(got, `${m.id} durum bağışıklığı`).toEqual(m.id === 'archmage' ? [] : s.conditionImmunities);
    }
  });
});
