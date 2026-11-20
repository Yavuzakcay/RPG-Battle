/**
 * Dungeondex prospektüsü (harita/belgeler/DUNGEONDEX-PROSPEKTUS.md): kapsam, sayısal tutarlılık (Türkçe metindeki zar,
 * DC, menzil, maliyet, bonus SRD kaydıyla birebir), SRD'den gelen alanlar (maliyet, ustalık, nadirlik, zırh süreleri),
 * SRD ham metni ve sayfa numarası görünmez, boş bölüm gizli, bölüm modülü saf (React yok).
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { armor, items, weapons } from '../../data';
import { setLang, t } from '../../i18n';
import { looksEnglish } from '../../data/aciklamaDil';
import { ESYA_DATA, esyaIds, esyaProspektus, type EsyaTur } from './index';
import { ProspektusSections } from './ProspektusSections';
import srdWeapons from '../../../data/srd/weapons.json';
import srdArmor from '../../../data/srd/armor.json';
import srdGear from '../../../data/srd/gear.json';
import srdTools from '../../../data/srd/tools.json';
import srdMagic from '../../../data/srd/magic-items.json';

type Rec = Record<string, unknown> & { id: string };
const byId = (list: Rec[]) => new Map(list.map((r) => [r.id, r]));
const SRD = {
  weapons: byId((srdWeapons as unknown as { weapons: Rec[] }).weapons),
  armor: byId((srdArmor as unknown as { armor: Rec[] }).armor),
  gear: byId((srdGear as unknown as { gear: Rec[] }).gear),
  tools: byId((srdTools as unknown as { tools: Rec[] }).tools),
  'magic-items': byId((srdMagic as unknown as { items: Rec[] }).items),
};
const srdOf = (ref: string): Rec | undefined => {
  const [file, id] = ref.split(':') as [keyof typeof SRD, string];
  return SRD[file]?.get(id);
};
const gameOf = (tur: EsyaTur, id: string): Rec & { srd: string } => {
  if (tur === 'silah') return weapons.find((w) => w.id === id) as unknown as Rec & { srd: string };
  if (tur === 'zirh') return (armor as unknown as Array<Rec & { srd: string }>).find((a) => a.srd?.endsWith(`:${id}`))!;
  return items.find((i) => i.id === id) as unknown as Rec & { srd: string };
};
const EXPECTED: Record<EsyaTur, number> = { silah: 38, zirh: 12, donanim: 80, sihirli: 319 };
const TEXT_KEYS = ['ne', 'nasil', 'risk', 'kimler', 'oyunFarki'] as const;
const norm = (s: string) => s.replace(/[’]/g, "'").replace(/[−–]/g, '-').replace(/(\d+)[- ](feet|foot)/g, '$1 ft');

/** Metindeki sayısal ifadeler kaynakta yoksa liste döner (zar, DC, ft, para, ±bonus). */
function numberProblems(text: string, source: string): string[] {
  const nums = new Set(source.match(/(?<![\d.])\d+(?![\d.])/g) ?? []);
  const out: string[] = [];
  for (const d of text.match(/\b\d*d\d+\b/g) ?? []) if (!source.includes(d)) out.push(d);
  for (const m of text.matchAll(/DC (\d+)/g)) if (!source.includes(`DC ${m[1]}`) && !source.includes(`"dc":${m[1]}`)) out.push(m[0]);
  for (const m of text.matchAll(/(\d+) ft/g)) if (!nums.has(m[1]!)) out.push(m[0]);
  for (const m of text.matchAll(/(\d+) (GP|SP|CP)/g)) if (!source.includes(m[0])) out.push(m[0]);
  for (const m of text.matchAll(/(?<![\w])[+-](\d+)/g)) if (!nums.has(m[1]!)) out.push(m[0]);
  return out;
}

describe('Dungeondex prospektüsü: eşyalar', () => {
  const ids = esyaIds();
  const TURS = Object.keys(EXPECTED) as EsyaTur[];

  it('kapsam: her eşyanın Türkçe "Ne işe yarar" paragrafı var (38 silah, 12 zırh, 80 donanım, 319 sihirli eşya)', () => {
    for (const tur of TURS) {
      expect(ids[tur].length, tur).toBe(EXPECTED[tur]);
      const kay = ESYA_DATA[tur].kayitlar;
      const missing = ids[tur].filter((id) => !(kay[id] as { ne?: string } | undefined)?.ne?.trim());
      expect(missing, tur).toEqual([]);
      expect(Object.keys(kay).filter((id) => !ids[tur].includes(id)), `${tur}: fazla kayıt`).toEqual([]);
    }
  });

  it('sayısal tutarlılık: metindeki zar, DC, menzil, maliyet ve bonus kaydın SRD/oyun alanlarında birebir', () => {
    const bad: string[] = [];
    for (const tur of TURS) {
      for (const [id, k] of Object.entries(ESYA_DATA[tur].kayitlar) as Array<[string, Record<string, string>]>) {
        const g = gameOf(tur, id);
        const source = norm(JSON.stringify([srdOf(g.srd) ?? {}, g]));
        for (const f of TEXT_KEYS) {
          const v = k[f];
          if (v === undefined) continue;
          if (!v.trim()) bad.push(`${tur}/${id}.${f}: boş`);
          if (looksEnglish(v)) bad.push(`${tur}/${id}.${f}: İngilizce görünüyor`);
          for (const p of numberProblems(v, source)) bad.push(`${tur}/${id}.${f}: ${p}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('SRD alanları: maliyet, ustalık, nadirlik ve zırh süreleri data/srd ile aynı', () => {
    for (const [id, k] of Object.entries(ESYA_DATA.silah.kayitlar)) {
      const s = SRD.weapons.get(id)!;
      expect(k.maliyet, id).toBe(s.cost);
      expect(k.ustalik, id).toBe(s.mastery);
    }
    for (const [id, k] of Object.entries(ESYA_DATA.zirh.kayitlar)) {
      const s = SRD.armor.get(id) as Rec & { ac: string; category: string; columns: Record<string, string> };
      expect(k.maliyet, id).toBe(s.columns.Cost);
      expect(s.category, id).toContain(`${k.giyDk} Minute`);
      expect(k.dex, id).toBe(s.ac.includes('Dex'));
      if (k.dexMax !== undefined) expect(s.ac, id).toContain(`max ${k.dexMax}`);
    }
    for (const [id, k] of Object.entries(ESYA_DATA.donanim.kayitlar)) expect(k.maliyet, id).toBe(srdOf(gameOf('donanim', id).srd)?.cost);
    for (const [id, k] of Object.entries(ESYA_DATA.sihirli.kayitlar)) expect(k.nadirlik, id).toBe(srdOf(gameOf('sihirli', id).srd)?.rarity);
  });

  it('SRD ham metni ve sayfa numarası hiçbir bölümde görünmez', () => {
    const L = t().dex.pro;
    const bad: string[] = [];
    for (const tur of TURS) {
      for (const id of ids[tur]) {
        const g = gameOf(tur, id);
        const raw = [String(srdOf(g.srd)?.text ?? ''), looksEnglish(String(g.text ?? '')) ? String(g.text) : '']
          .flatMap((s) => s.split(/(?<=\.)\s+/)).map((s) => s.trim()).filter((s) => s.length >= 30 && /^[A-Z]/.test(s) && /[a-z]{3} [a-z]{3}/.test(s));
        for (const sec of esyaProspektus(id, L, 'tr') ?? []) {
          for (const r of sec.rows) {
            if (raw.some((s) => r.text.includes(s.slice(0, 30)))) bad.push(`${id}: ham metin`);
            if (/\b(page|sayfa)\s*\d/i.test(r.text)) bad.push(`${id}: sayfa`);
          }
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it("boş bölüm üretilmez; Alchemist's fire bütün bölümleri taşır", () => {
    const L = t().dex.pro;
    for (const tur of TURS) for (const id of ids[tur]) {
      for (const s of esyaProspektus(id, L, 'tr') ?? []) if (s.key !== 'durum') expect(s.rows.length, `${id}/${s.key}`).toBeGreaterThan(0);
    }
    const af = esyaProspektus('alchemists-fire', L, 'tr')!;
    expect(af.map((s) => s.key)).toEqual(['ne', 'nasil', 'etken', 'risk', 'maliyet', 'durum']);
    const etken = af.find((s) => s.key === 'etken')!.rows.map((r) => r.text).join(' | ');
    expect(etken).toContain('1d4 ateş');
    expect(af.find((s) => s.key === 'maliyet')!.rows.map((r) => r.text)).toContain('50 GP');
    expect(af.find((s) => s.key === 'durum')!.badge?.tone).toBe('ok');
  });

  it('bileşen: satırsız bölüm gizli, rozet görünür; EN arayüzde başlık İngilizce, içerik Türkçe + not', async () => {
    const html = renderToStaticMarkup(createElement(ProspektusSections, { sections: [
      { key: 'ne', title: 'Ne işe yarar', rows: [{ text: 'Deneme' }] },
      { key: 'risk', title: 'Riskler', rows: [] },
      { key: 'durum', title: 'Oyundaki durum', rows: [], badge: { tone: 'ok', text: 'Savaşta çalışır' } },
    ] }));
    expect(html).toContain('Deneme');
    expect(html).not.toContain('Riskler');
    expect(html).toContain('Savaşta çalışır');
    expect(renderToStaticMarkup(createElement(ProspektusSections, { sections: [{ key: 'risk', title: 'Riskler', rows: [] }] }))).toBe('');
    await setLang('en');
    try {
      const en = esyaProspektus('alchemists-fire', t().dex.pro, 'en')!;
      expect(en[0]!.title).toBe('What it does');
      expect(en[0]!.rows[0]!.trOnly).toBe(true);
      expect(renderToStaticMarkup(createElement(ProspektusSections, { sections: en }))).toContain(t().common.descTrOnly);
    } finally { await setLang('tr'); }
  });

  it('bölüm modülü saf: React, DOM ve localStorage yok', () => {
    const src = import.meta.glob<string>(['./esya.ts', './types.ts', './index.ts'], { query: '?raw', import: 'default', eager: true });
    expect(Object.keys(src).length).toBe(3);
    for (const [f, s] of Object.entries(src)) {
      expect(s, f).not.toMatch(/from ['"]react|\bdocument\.|\bwindow\.|localStorage\./);
    }
  });
});
