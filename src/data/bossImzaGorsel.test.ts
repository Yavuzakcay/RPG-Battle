/**
 * Görev BOSS-IMZA-GORSEL: üç ana boss görseli (`data/boss-gorsel.json` `ana`), imza eşya görsel varyantları
 * (`data/esya-gorsel-varyant.json`), yumurtalar ve ad birleştirmesi (Hex, Princeps Tenebrarum; kılıç Kaltakkıran).
 * Görseller teste girmez: yalnız dosya adları listelenir.
 */
import { describe, expect, it } from 'vitest';
import boss from '../../data/boss-gorsel.json';
import varyant from '../../data/esya-gorsel-varyant.json';
import katalog from '../../data/items-katalog.json';
import anlatim from '../../data/katalog-anlatim.json';
import adDegisim from '../../data/esya-ad-degisim.json';
import { t } from '../i18n';
import { currentItemName, migrateItemNames, renameSheetItems } from '../rules/itemRename';
import type { CharacterSheet } from '../rules/stats';

const files = new Set([
  ...Object.keys(import.meta.glob('/public/boss/*.webp')),
  ...Object.keys(import.meta.glob('/public/esya/*.webp')),
  ...Object.keys(import.meta.glob('/public/esya/kucuk/*.webp')),
].map((p) => p.replace('/public/', '')));
type E = { id: string; name: string; katalog: { tr: string; ref: string; eskiAd?: string } };
const ES = (katalog as unknown as { esyalar: E[] }).esyalar;
const esya = (id: string) => ES.find((e) => e.id === id)!;

describe('BOSS-IMZA-GORSEL', () => {
  it('üç ana bossun görseli var; Hex ve Mora kapalı alanda yalnız saf macentayı siler', () => {
    const A = (boss as unknown as { ana: Record<string, { dosya: string; icBosluk: string }> }).ana;
    expect(Object.keys(A)).toEqual(['hex', 'tarvok', 'mora']);
    for (const [id, g] of Object.entries(A)) { expect(g.dosya, id).toBe(`boss/${id}.webp`); expect(files.has(g.dosya), id).toBe(true); }
    expect(A.hex!.icBosluk).toBe('saf');
    expect(A.mora!.icBosluk).toBe('saf+ton');
  });
  it('boss adları iki dilde; anlatım kaydı Hex, eski adı Kaltakkıran, görseli bağlı', () => {
    const k = (anlatim as unknown as { anlatimlar: Array<{ id: string; tr: string; en: string; eskiAd?: string; gorsel?: string }> }).anlatimlar
      .find((r) => r.id === 'kaltakkiran')!;
    expect([k.tr, k.en, k.eskiAd, k.gorsel]).toEqual(['Hex, Princeps Tenebrarum', 'Hex, Princeps Tenebrarum', 'Kaltakkıran', 'boss/hex.webp']);
    const B = t().dex.pro.anaBoss;
    expect(Object.keys(B)).toEqual(['hex', 'tarvok', 'mora']);
    expect(B.hex!.tam).toBe('Hex, Princeps Tenebrarum');
    expect(B.tarvok!.tam).toBe('Dağezen Tarvok');
    expect(B.mora!.tam).toBe('Al-İha Mora');
  });
  it('imza kılıç Kaltakkıran, zırh Hex’in; kimlikler aynı, eski adlar geçişte', () => {
    expect([esya('kaltakkirans-maw-chain-greatsword').name, esya('kaltakkirans-maw-chain-greatsword').katalog.tr]).toEqual(['Kaltakkıran', 'Kaltakkıran']);
    expect([esya('kaltakkirans-paladin-armor').name, esya('kaltakkirans-paladin-armor').katalog.tr]).toEqual(["Hex's Paladin Armor", "Hex'in Paladin Zırhı"]);
    const adlar = (adDegisim as { adlar: Record<string, string> }).adlar;
    for (const e of ES) if (e.katalog.eskiAd) expect(adlar[e.katalog.eskiAd], e.id).toBe(e.name);
    // Görünen metinde kişi olarak "Kaltakkıran" kalmadı (yalnız kılıç adı ve PDF başlığı).
    for (const e of ES) {
      const metin = JSON.stringify({ ...e, katalog: { ...e.katalog, eskiAd: undefined } }).replace(/Kaltakkıran'ın Paladin Zırhı ve On Mühür Taşı Sistemi/g, '');
      expect(metin, e.id).not.toMatch(/Kaltakkıran'ın Paladin|Kaltakkıran's Paladin|Çeneli Zincir Kılıcı|Maw-Chain/);
    }
  });
  it('görsel varyantları: dosyalar ve 96 px kopyaları var, varsayılan ana ikon, adlar iki dilde', () => {
    const V = (varyant as unknown as { esyalar: Record<string, { varsayilan: string; varyantlar: Record<string, string> }> }).esyalar;
    expect(Object.keys(V).sort()).toEqual(['kaltakkirans-maw-chain-greatsword', 'kaltakkirans-paladin-armor']);
    expect(Object.keys(V['kaltakkirans-maw-chain-greatsword']!.varyantlar)).toEqual(['kapali', 'acik']);
    expect(Object.keys(V['kaltakkirans-paladin-armor']!.varyantlar)).toEqual(['kapali', 'acik', 'hasarli']);
    for (const [id, v] of Object.entries(V)) {
      expect(ES.some((e) => e.id === id), id).toBe(true);
      expect(v.varyantlar[v.varsayilan], id).toBe(`esya/${id}.webp`);
      for (const [k, dosya] of Object.entries(v.varyantlar)) {
        expect(files.has(dosya), `${id}/${k}`).toBe(true);
        expect(files.has(dosya.replace('esya/', 'esya/kucuk/')), `${id}/${k} küçük`).toBe(true);
        expect(t().dex.pro.gorselVaryant[k], k).toBeTruthy();
      }
    }
  });
  it('yumurtalar katalogda, ikonları var; boss imza eşyalarının hepsinin ikonu var', () => {
    expect([esya('mucevher-ejderha-yumurtasi').katalog.tr, esya('kor-yumurtasi').katalog.tr]).toEqual(['Mücevher Ejderha Yumurtası', 'Kor Yumurtası']);
    for (const id of ['mucevher-ejderha-yumurtasi', 'kor-yumurtasi', 'abandoned-phylactery-pendulum', 'robe-of-the-blindspot',
      'mountain-crushers-chained-monolith', 'champions-crag-harness', 'kaltakkirans-paladin-armor', 'kaltakkirans-maw-chain-greatsword']) {
      expect(files.has(`esya/${id}.webp`), id).toBe(true);
    }
  });
  it('eşya adı geçişi: eski ad yeniye, silah bağı anahtarı da; değişiklik yoksa aynı nesne', () => {
    expect(currentItemName("Kaltakkıran's Maw-Chain Greatsword")).toBe('Kaltakkıran');
    expect(currentItemName('Longsword')).toBe('Longsword');
    const sheet = { itemNames: ["Kaltakkıran's Paladin Armor", 'Potion of Healing'], silahBagi: { "Kaltakkıran's Maw-Chain Greatsword": 'Greatsword' } } as unknown as CharacterSheet;
    const yeni = renameSheetItems(sheet);
    expect(yeni.itemNames).toEqual(["Hex's Paladin Armor", 'Potion of Healing']);
    expect(yeni.silahBagi).toEqual({ Kaltakkıran: 'Greatsword' });
    const ayni = { itemNames: ['Potion of Healing'] } as unknown as CharacterSheet;
    expect(renameSheetItems(ayni)).toBe(ayni);
    const list = [{ sheet: ayni }];
    expect(migrateItemNames(list)).toBe(list);
    expect(migrateItemNames([{ sheet }])[0]!.sheet.itemNames[0]).toBe("Hex's Paladin Armor");
  });
});
