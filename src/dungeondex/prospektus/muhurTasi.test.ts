/**
 * Görev MUHUR-TASI-PROSPEKTUS: Mühür taşları Dungeondex'te bilgi olarak (mekanik yok). 30 taş (10 Çatlak, 10 Uyanmış,
 * 10 Sv.3) = 30 Mühür Ruhu; bağ tek kaynaktan (`data/bosslar-muhur.json` `ganimet`). Denetlenen: her taşın TR/EN bilgi
 * paragrafı dolu, kimlik eşya kimliği, prospektüste kademe + ruh + paragraf (TR ve EN), Sv.3 paragrafında taşın düştüğü
 * bölge (KATALOG-1 G bağı), korumalı adlar yok, taş olmayan katalog eşyasında bu satırlar yok.
 */
import { describe, expect, it } from 'vitest';
import { enAciklama, items, katalogMonsters, trAciklama } from '../../data';
import { setLang, t } from '../../i18n';
import { looksEnglish } from '../../data/aciklamaDil';
import { esyaProspektus, muhurRuhu } from './index';
import anlatim from '../../../data/katalog-anlatim.json';
import muhurData from '../../../data/bosslar-muhur.json';
import trData from '../../../data/aciklamalar-tr.json';
import enData from '../../../data/aciklamalar-en.json';

type Ruh = { id: string; kademe: number; element: string; ganimet: string };
// `katalogMonsters` KATALOG-F2'den beri kadim/mücevher yaratıklarını da taşır; Mühür Ruhları kendi dosyasından süzülür.
const MUHUR_IDS = new Set((muhurData as unknown as { canavarlar: Array<{ id: string }> }).canavarlar.map((c) => c.id));
const RUHLAR = (katalogMonsters as unknown as Ruh[]).filter((m) => MUHUR_IDS.has(m.id));
const TR = (trData as unknown as { muhurTasi: Record<string, string> }).muhurTasi;
const EN = (enData as unknown as { muhurTasi: Record<string, string> }).muhurTasi;
const BAG = (anlatim as unknown as { anlatimlar: Array<{ id: string; baglar?: Array<{ tas: string; bolge: string }> }> })
  .anlatimlar.find((a) => a.id === 'on-muhur')!.baglar!;
const KORUMALI = ['Thangorodrim', 'Ancalagon', 'Zettaflare', 'Bahamut', 'Placidusax', 'Cthulhu'];

const proOf = (id: string, lang: 'tr' | 'en') => {
  setLang(lang);
  try { return esyaProspektus(id, t().dex.pro, lang)!; } finally { setLang('tr'); }
};

describe('Mühür taşları (Dungeondex bilgisi)', () => {
  it('30 Mühür Ruhu ↔ 30 taş; her taş katalog eşyası, kademe başına 10, TR/EN paragraf dolu ve kimlikler aynı', () => {
    expect(RUHLAR).toHaveLength(30);
    const ids = RUHLAR.map((r) => r.ganimet);
    expect(new Set(ids).size).toBe(30);
    for (const k of [1, 2, 3]) expect(RUHLAR.filter((r) => r.kademe === k), `kademe ${k}`).toHaveLength(10);
    const itemIds = new Set(items.filter((i) => i.katalog).map((i) => i.id));
    for (const id of ids) {
      expect(itemIds.has(id), id).toBe(true);
      expect(trAciklama('muhurTasi', id), `TR ${id}`).toBeTruthy();
      expect(enAciklama('muhurTasi', id), `EN ${id}`).toBeTruthy();
    }
    expect(Object.keys(TR).sort()).toEqual([...ids].sort());
    expect(Object.keys(EN).sort()).toEqual([...ids].sort());
    // Kademe kimlikten de okunur: Sv.1 cracked-, Sv.2 awakened-, Sv.3 On Mühür bağındaki taş
    for (const r of RUHLAR) {
      const beklenen = r.kademe === 1 ? `cracked-elemental-stone-${r.element}` : r.kademe === 2 ? `awakened-elemental-stone-${r.element}` : BAG.find((b) => b.tas === r.ganimet)?.tas;
      expect(r.ganimet, r.id).toBe(beklenen);
      expect(muhurRuhu(r.ganimet)).toEqual({ id: r.id, name: expect.any(String), kademe: r.kademe });
    }
  });

  it('metinler: TR Türkçe, EN İngilizce; Sv.3 paragrafında düştüğü bölge; korumalı adlar yok', () => {
    for (const [id, s] of Object.entries(TR)) {
      expect(looksEnglish(s), id).toBe(false);
      expect(s, id).toContain('Mühür Ruhu');
    }
    for (const [id, s] of Object.entries(EN)) expect(s, id).toContain('Seal Spirit');
    for (const b of BAG) {
      expect(TR[b.tas], b.tas).toContain(b.bolge);
      expect(EN[b.tas], b.tas).toContain(b.bolge);
    }
    const hepsi = JSON.stringify([TR, EN, t().dex.pro.muhur]);
    for (const n of KORUMALI) expect(hepsi.toLowerCase().includes(n.toLowerCase()), n).toBe(false);
  });

  it('prospektüs: "Ne işe yarar" bölümünde kademe, Mühür Ruhu ve bilgi paragrafı (TR ve EN); taş olmayan eşyada yok', () => {
    const r = RUHLAR.find((x) => x.id === 'cim')!;
    const ne = (id: string, lang: 'tr' | 'en') => proOf(id, lang).find((s) => s.key === 'ne')!.rows;
    const tr = ne(r.ganimet, 'tr');
    expect(tr.find((x) => x.label === 'Kademe')?.text).toBe('Seviye 1 · Çatlak Taş');
    expect(tr.find((x) => x.label === 'Mühür Ruhu')?.text).toBe('Cim');
    expect(tr.some((x) => !x.label && x.text === TR[r.ganimet])).toBe(true);
    const en = ne(r.ganimet, 'en');
    expect(en.find((x) => x.label === 'Tier')?.text).toBe('Tier 1 · Cracked Stone');
    expect(en.find((x) => x.label === 'Seal Spirit')?.text).toBe('Cim');
    expect(en.some((x) => !x.label && x.text === EN[r.ganimet] && !x.trOnly)).toBe(true);
    const sv3 = ne('ember-core', 'tr');
    expect(sv3.find((x) => x.label === 'Kademe')?.text).toBe('Seviye 3 · Boss Taşı');
    expect(sv3.find((x) => x.label === 'Mühür Ruhu')?.text).toBe('Cimbombom, Lion of the Hell');
    // Taş olmayan katalog eşyası (soket mühür taşı YT#40 dahil) Mühür Ruhu satırı almaz
    for (const id of ['umbral-sigil-stone', 'brimstone-flail', 'kaltakkirans-paladin-armor']) {
      expect(muhurRuhu(id), id).toBeNull();
      expect(ne(id, 'tr').some((x) => x.label === 'Mühür Ruhu'), id).toBe(false);
    }
  });
});
