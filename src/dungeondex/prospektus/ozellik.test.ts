/**
 * Dungeondex prospektüsü, feat / tür özelliği / sınıf özelliği / alt sınıf: kapsam (17 / 41 / 174 / yüklü alt sınıflar),
 * sayısal tutarlılık, SRD alanları (kategori, tekrar, sınıf, seviye), dil, ham metin yok, veride olmayan bölüm yok.
 */
import { describe, expect, it } from 'vitest';
import { classData } from '../../data';
import { t } from '../../i18n';
import { looksEnglish } from '../../data/aciklamaDil';
import { OZELLIK_DATA, altSinifProspektus, featProspektus, sinifOzellikProspektus, turOzellikProspektus } from './ozellik';
import srdFeats from '../../../data/srd/feats.json';
import srdSpecies from '../../../data/srd/species.json';
import srdClasses from '../../../data/srd/classes.json';
import cf from '../../../data/class-features.json';

type Src = { id: string; text?: string; category?: string; repeatable?: boolean; level?: number };
const FEATS = new Map((srdFeats as unknown as { feats: Src[] }).feats.map((f) => [f.id, f]));
const TRAITS = new Map<string, Src>((srdSpecies as unknown as { species: Array<{ id: string; traits: Src[] }> }).species.flatMap((s) => s.traits.map((tr) => [`${s.id}/${tr.id}`, tr] as const)));
const FEATURES = new Map<string, Src & { cls: string }>();
for (const c of (srdClasses as unknown as { classes: Array<{ id: string; features: Src[] }> }).classes) {
  for (const f of c.features) {
    const key = FEATURES.has(`${c.id}:${f.id}`) ? `${c.id}:${f.id}@${f.level}` : `${c.id}:${f.id}`;
    FEATURES.set(key, { ...f, cls: c.id });
  }
}
const GAME = cf as unknown as { features: Record<string, unknown>; feats: Record<string, unknown> };
const norm = (s: string) => s.replace(/[’]/g, "'").replace(/[−–]/g, '-').replace(/(\d+)[- ](feet|foot)/g, '$1 ft');
function numberProblems(text: string, source: string): string[] {
  const nums = new Set(source.match(/(?<![\d.])\d+(?![\d.])/g) ?? []);
  const out: string[] = [];
  for (const d of text.match(/\b\d*d\d+\b/g) ?? []) if (!source.includes(d)) out.push(d);
  for (const m of text.matchAll(/DC (\d+)/g)) if (!source.includes(`DC ${m[1]}`)) out.push(m[0]);
  for (const m of text.matchAll(/(\d+) ft/g)) if (!nums.has(m[1]!)) out.push(m[0]);
  for (const m of text.matchAll(/(?<![\w])[+-](\d+)/g)) if (!nums.has(m[1]!)) out.push(m[0]);
  return out;
}
const KEYS = ['ne', 'nasil', 'risk', 'kimler'] as const;
const CASES = [
  { kind: 'feat', data: OZELLIK_DATA.feat.kayitlar, src: FEATS, game: (id: string) => GAME.feats[id], n: 17 },
  { kind: 'tur', data: OZELLIK_DATA.tur.kayitlar, src: TRAITS, game: () => undefined, n: 41 },
  { kind: 'sinif', data: OZELLIK_DATA.sinif.kayitlar, src: FEATURES, game: (id: string) => GAME.features[id.split('@')[0]!], n: 174 },
] as const;

describe('Dungeondex prospektüsü: feat, tür özelliği, sınıf özelliği, alt sınıf', () => {
  it('kapsam: SRD kaydı başına bir Türkçe "Ne işe yarar"; fazla kayıt yok', () => {
    for (const c of CASES) {
      expect(c.src.size, c.kind).toBe(c.n);
      expect([...c.src.keys()].filter((id) => !(c.data as Record<string, { ne?: string }>)[id]?.ne?.trim()), c.kind).toEqual([]);
      expect(Object.keys(c.data).filter((id) => !c.src.has(id)), c.kind).toEqual([]);
    }
  });

  it('sayısal tutarlılık ve dil', () => {
    const bad: string[] = [];
    for (const c of CASES) {
      for (const [id, k] of Object.entries(c.data) as Array<[string, Record<string, string>]>) {
        const source = norm(JSON.stringify([c.src.get(id), c.game(id) ?? null]));
        for (const f of KEYS) {
          const v = k[f];
          if (v === undefined) continue;
          if (!v.trim()) bad.push(`${c.kind}/${id}.${f}: boş`);
          if (looksEnglish(v)) bad.push(`${c.kind}/${id}.${f}: İngilizce görünüyor`);
          for (const p of numberProblems(v, source)) bad.push(`${c.kind}/${id}.${f}: ${p}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('SRD alanları: feat kategorisi ve tekrarı, sınıf özelliğinin sınıfı ve seviyesi', () => {
    for (const [id, k] of Object.entries(OZELLIK_DATA.feat.kayitlar)) {
      expect(k.kategori, id).toBe(FEATS.get(id)!.category);
      expect(!!k.tekrar, id).toBe(!!FEATS.get(id)!.repeatable);
    }
    for (const [id, k] of Object.entries(OZELLIK_DATA.sinif.kayitlar)) {
      expect(k.sinif, id).toBe(FEATURES.get(id)!.cls);
      expect(k.seviye, id).toBe(FEATURES.get(id)!.level);
    }
  });

  it('bölümler: boş bölüm yok, SRD ham metni yok; tür özelliğinde oyundaki durum bölümü yok (veride yok)', () => {
    const L = t().dex.pro;
    const bad: string[] = [];
    const check = (id: string, raw: string | undefined, secs: ReturnType<typeof featProspektus>) => {
      const sent = (raw ?? '').split(/(?<=\.)\s+/).map((x) => x.trim()).filter((x) => x.length >= 30);
      for (const s of secs ?? []) {
        if (s.key !== 'durum' && !s.rows.length) bad.push(`${id}/${s.key}: boş`);
        for (const r of s.rows) if (sent.some((x) => r.text.includes(x.slice(0, 30)))) bad.push(`${id}: ham metin`);
      }
    };
    for (const id of FEATS.keys()) check(id, JSON.stringify(FEATS.get(id)), featProspektus(id, L, 'tr'));
    for (const id of TRAITS.keys()) {
      const secs = turOzellikProspektus(id, L, 'tr');
      check(id, TRAITS.get(id)!.text, secs);
      expect(secs!.some((s) => s.key === 'durum'), id).toBe(false);
    }
    for (const id of FEATURES.keys()) check(id, FEATURES.get(id)!.text, sinifOzellikProspektus(id, L, 'tr'));
    expect(bad).toEqual([]);
    const rage = sinifOzellikProspektus('barbarian:rage', L, 'tr')!;
    expect(rage.find((s) => s.key === 'durum')?.badge?.tone).toBe('ok');
  });

  it('alt sınıf: yüklü her alt sınıf için kartı tekrar etmeyen prospektüs (rol ve özellik satırı yok, durum sayımı var)', () => {
    const L = t().dex.pro;
    expect(classData.subclasses.length).toBeGreaterThanOrEqual(12);
    for (const sc of classData.subclasses) {
      const secs = altSinifProspektus(sc, L, 'tr');
      expect(secs.some((s) => s.key === 'ne' || s.key === 'etken'), sc.id).toBe(false);
      const durum = secs.find((s) => s.key === 'durum');
      if (sc.features.length) expect(durum?.rows[0]?.text, sc.id).toMatch(/\d/);
      for (const s of secs) if (s.key !== 'durum') expect(s.rows.length, `${sc.id}/${s.key}`).toBeGreaterThan(0);
    }
  });
});
