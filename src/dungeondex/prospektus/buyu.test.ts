/**
 * Dungeondex prospektüsü, büyüler: kapsam (339), sayısal tutarlılık, SRD'den gelen alanlar (bileşen, malzeme bedeli,
 * süre, ritüel), oyundaki durum BUYU-DURUM ölçütüyle aynı, SRD ham metni görünmez, boş bölüm yok.
 */
import { describe, expect, it } from 'vitest';
import { spells } from '../../data';
import { t } from '../../i18n';
import { looksEnglish } from '../../data/aciklamaDil';
import { BUYU_DATA, SPELL_BLOCKS, buyuProspektus, spellStatus } from './buyu';
import { BLOCKS, classify } from '../../../scripts/lib/buyu-durum.mjs';
import srdSpells from '../../../data/srd/spells.json';

type SrdSpell = { id: string; text: string; components: string; duration: string; ritual?: boolean };
const SRD = new Map((srdSpells as unknown as { spells: SrdSpell[] }).spells.map((s) => [s.id, s]));
const srdOf = (id: string) => SRD.get(spells.find((s) => s.id === id)!.srd.split(':')[1]!)!;
const norm = (s: string) => s.replace(/[’]/g, "'").replace(/[−–]/g, '-').replace(/(\d+)[- ](feet|foot)/g, '$1 ft').replace(/(\d),(\d{3})/g, '$1$2');
const TEXT_KEYS = ['ne', 'nasil', 'yukari', 'risk', 'kimler', 'malzeme'] as const;

function numberProblems(text: string, source: string): string[] {
  const nums = new Set(source.match(/(?<![\d.])\d+(?![\d.])/g) ?? []);
  const out: string[] = [];
  for (const d of text.match(/\b\d*d\d+\b/g) ?? []) if (!source.includes(d)) out.push(d);
  for (const m of text.matchAll(/DC (\d+)/g)) if (!source.includes(`DC ${m[1]}`) && !source.includes(`"dc":${m[1]}`)) out.push(m[0]);
  for (const m of text.matchAll(/(\d+) ft/g)) if (!nums.has(m[1]!)) out.push(m[0]);
  for (const m of text.matchAll(/(\d+)\+? (GP|SP|CP)/g)) if (!nums.has(m[1]!)) out.push(m[0]);
  for (const m of text.matchAll(/(?<![\w])[+-](\d+)/g)) if (!nums.has(m[1]!)) out.push(m[0]);
  return out;
}

describe('Dungeondex prospektüsü: büyüler', () => {
  it('kapsam: 339 büyünün hepsinde Türkçe "Ne işe yarar"', () => {
    expect(spells.length).toBe(339);
    const kay = BUYU_DATA.kayitlar;
    expect(spells.filter((s) => !kay[s.id]?.ne?.trim()).map((s) => s.id)).toEqual([]);
    expect(Object.keys(kay).filter((id) => !spells.some((s) => s.id === id))).toEqual([]);
  });

  it('sayısal tutarlılık ve dil: zar, DC, ft, GP, ±N SRD/oyun kaydında; metin İngilizce değil', () => {
    const bad: string[] = [];
    for (const s of spells) {
      const k = BUYU_DATA.kayitlar[s.id] as unknown as Record<string, string | undefined>;
      const { text: _t, ...game } = s;
      const source = norm(JSON.stringify([srdOf(s.id), game]));
      for (const f of TEXT_KEYS) {
        const v = k[f];
        if (v === undefined) continue;
        if (!v.trim()) bad.push(`${s.id}.${f}: boş`);
        if (looksEnglish(v)) bad.push(`${s.id}.${f}: İngilizce görünüyor`);
        for (const p of numberProblems(v, source)) bad.push(`${s.id}.${f}: ${p}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('SRD alanları: bileşen harfleri, malzeme bedeli, tüketme, süre ve ritüel data/srd/spells.json ile aynı', () => {
    for (const s of spells) {
      const k = BUYU_DATA.kayitlar[s.id]!;
      const r = srdOf(s.id);
      expect(r.components.startsWith(k.bilesen ?? '?'), s.id).toBe(true);
      expect(k.malzeme === undefined || k.bilesen!.includes('M'), s.id).toBe(true);
      if (k.bedel) expect(norm(r.components), s.id).toContain(`${k.bedel}+ GP`);
      else expect(r.components, s.id).not.toMatch(/\d\+ GP/);
      expect(!!k.tuketir, s.id).toBe(r.components.includes('consume'));
      expect(!!k.ritual, s.id).toBe(!!r.ritual);
      const d = k.sure!;
      expect(!!d.kons, s.id).toBe(/^Concentration/i.test(r.duration));
      if (d.tip === 'sure') {
        expect(r.duration, s.id).toMatch(new RegExp(`\\b${d.n} ${d.birim}`, 'i'));
        expect(!!d.enCok, s.id).toBe(/up to/i.test(r.duration));
      } else expect(r.duration.toLowerCase(), s.id).toContain({ aninda: 'instantaneous', kaldirilana: 'until dispelled', kaldirilanaTetik: 'or triggered', ozel: 'special' }[d.tip]);
    }
  });

  it('oyundaki durum BUYU-DURUM ölçütüyle aynı (scripts/lib/buyu-durum.mjs)', () => {
    expect(SPELL_BLOCKS).toEqual(BLOCKS);
    const TONE: Record<string, string> = { yok: 'none', 'savaş dışı': 'off', 'kısmi': 'part', 'çalışır': 'ok' };
    for (const s of spells) expect(spellStatus(s).tone, s.id).toBe(TONE[classify(s as unknown as Record<string, unknown>).durum]);
  });

  it('SRD ham metni görünmez, boş bölüm yok; Fireball tam', () => {
    const L = t().dex.pro;
    const bad: string[] = [];
    for (const s of spells) {
      const raw = srdOf(s.id).text.split(/(?<=\.)\s+/).map((x) => x.trim()).filter((x) => x.length >= 30);
      for (const sec of buyuProspektus(s.id, L, 'tr')!) {
        if (sec.key !== 'durum' && !sec.rows.length) bad.push(`${s.id}/${sec.key}: boş`);
        for (const r of sec.rows) if (raw.some((x) => r.text.includes(x.slice(0, 30)))) bad.push(`${s.id}: ham metin`);
      }
    }
    expect(bad).toEqual([]);
    const fb = buyuProspektus('fireball', L, 'tr')!;
    expect(fb.map((x) => x.key)).toEqual(expect.arrayContaining(['ne', 'nasil', 'etken', 'kimler', 'maliyet', 'durum']));
    expect(fb.find((x) => x.key === 'nasil')!.rows.map((r) => r.text)).toContain('Anında');
  });
  it('Serüven öncesi: "Etken içerik" motorun bugünkü mekaniğinden; "Oyunda farklı" notu iki dilde ve yalnız gerçek farkta', async () => {
    const T = t().dex.pro;
    const etken = (id: string) => buyuProspektus(id, T, 'tr')!.find((x) => x.key === 'etken')!.rows.map((r) => `${r.label}: ${r.text}`);
    const durum = (id: string, L = T, lang: 'tr' | 'en' = 'tr') => buyuProspektus(id, L, lang)!.find((x) => x.key === 'durum')!.rows;
    expect(etken('ice-storm')).toContain(`${T.l.damage}: 2d10 ezici + 4d6 soğuk`);
    expect(etken('flame-strike')).toContain(`${T.l.damage}: 5d6 ateş + 5d6 ışıl`);
    expect(etken('meteor-swarm')).toContain(`${T.l.damage}: 20d6 ateş + 20d6 ezici`);
    expect(etken('dragons-breath')).toContain(`${T.l.damage}: 3d6 asit ya da soğuk ya da ateş ya da yıldırım ya da zehir`);
    expect(etken('blindness-deafness')).toContain(`${T.l.conditions}: Blinded ya da Deafened`);
    for (const id of ['ice-storm', 'flame-strike', 'meteor-swarm', 'bestow-curse']) expect(durum(id).some((r) => r.label === T.l.diff), id).toBe(true);
    for (const id of ['conjure-fey', 'divine-word', 'prayer-of-healing', 'blindness-deafness', 'dragons-breath', 'fireball']) expect(durum(id).some((r) => r.label === T.l.diff), id).toBe(false);
    const en = (await import('../../i18n/strings.en')).en.dex.pro;
    expect(Object.keys(en.spell.gameDiff).sort()).toEqual(Object.keys(T.spell.gameDiff).sort());
    expect(durum('ice-storm', en, 'en').find((r) => r.label === en.l.diff)!.text).toMatch(/7d6 Cold/);
  });
});
