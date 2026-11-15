/**
 * Kuyruk K51: hizalanma. Başlangıç hesabı (kırpma, tabloda olmayan kalem, ırk anahtarı), üç geçiş seçeneği ve gizlenme,
 * alt sınıf sonradan (kabul/geçiş), günlük ekle/geri al, azalan getiri, histerezis, Game Master yeniden belirleme,
 * eski kayıt, oluşturucu adımı yalnız kural açıkken, duman testi (12 sınıf × geçmiş × ırk).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import {
  addEvent, addFree, alignmentLabel, alignmentOf, applyStartKind, bucketOf, gmRedetermine, labelOf, newAlignment, onSubclassChange,
  rejectOptions, startContributions, startValue, toggleUndo, ALIGN_EVENTS, repeatFactor, turningPoint, correctValue, labelPath, lastAnchorIndex, type Alignment,
} from './alignment';
import { alignmentLongRest } from './alignmentRest';
import backgrounds from '../../data/backgrounds.json';
import { wizardSteps } from '../screens/Builder';
import { setAlignmentEnabled } from '../app/features';
import AlignmentBadge from '../ui/AlignmentBadge';

// Test ortamında localStorage yok: basit bellek deposu.
const mem = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => { mem.set(k, v); }, removeItem: (k: string) => { mem.delete(k); } };
const sheet = (p: Record<string, string>) => ({ classId: 'fighter', raceId: 'human', ...p });
const Z = '2026-11-05T10:00:00.000Z';
afterEach(() => { try { localStorage.removeItem('rpg-battle-deneysel'); } catch { /* yok */ } });

// SD12: tablo değerleri ×1 çarpanla sınanır (katkiCarpani yalnız yeni karakterlerin hesabını ölçekler); dağılım ve çarpan testleri aşağıda.
describe('başlangıç hesabı', () => {
  it('katkılar toplanır, ±50 kırpılır; ırk satırı en sonda; tabloda olmayan kalem 0 (çökme yok)', () => {
    const list = startContributions(sheet({ classId: 'paladin', backgroundId: 'acolyte', subclassId: 'oath-of-devotion', raceId: 'dwarf' }), true, 1);
    expect(list.map((x) => x.kaynak)).toEqual(['sinif', 'gecmis', 'altSinif', 'irk']);
    expect(startValue(list)).toEqual({ duzen: 50, iyilik: 31 }); // 20+10+13+8 = 51 → 50; 15+5+13−2 = 31
    const g = { gerekce: { tr: '', en: '' } };
    expect(startValue([{ kaynak: 'sinif', id: 'a', duzen: 40, iyilik: -40, ...g }, { kaynak: 'irk', id: 'b', duzen: 30, iyilik: -30, ...g }])).toEqual({ duzen: 50, iyilik: -50 });
    const unknown = startContributions(sheet({ classId: 'yok-sinif', backgroundId: 'yok', subclassId: 'yok', raceId: 'yok' }));
    expect(unknown).toEqual([]);
    expect(startValue(unknown)).toEqual({ duzen: 0, iyilik: 0 });
  });
  it('ırk anahtarı kapalıyken ırk satırı yok', () => {
    expect(startContributions(sheet({ raceId: 'dwarf' }), false).some((x) => x.kaynak === 'irk')).toBe(false);
    expect(startContributions(sheet({ raceId: 'dwarf' }), true).some((x) => x.kaynak === 'irk')).toBe(true);
  });
});

describe('uç buildler (taslak v1.1, 3. seviye)', () => {
  const cases: Array<[string, string, string, string, number, number, string]> = [
    ['paladin', 'acolyte', 'imza_hizir', 'celestial', 45, 48, 'Lawful Good'],
    ['bard', 'criminal', 'imza_sair', 'elf', -36, 18, 'Chaotic Good'],
    ['fighter', 'soldier', 'imza_imparator', 'goliath', 36, -36, 'Lawful Evil'],
    ['rogue', 'criminal', 'imza_infazci', 'tiefling', -45, -48, 'Chaotic Evil'],
  ];
  for (const [classId, backgroundId, subclassId, raceId, d, g, label] of cases) {
    it(`${classId} + ${backgroundId} + ${subclassId} + ${raceId} = (${d}, ${g}) ${label}`, () => {
      const v = startValue(startContributions({ classId, backgroundId, subclassId, raceId }, true, 1));
      expect(v).toEqual({ duzen: d, iyilik: g });
      expect(labelOf(newAlignment(v, 'otomatik'), 'tr')).toBe(label);
    });
  }
  // Kuyruk AS1a/AS1a-2: aynı dört uç build alt soyla (alt soy satırı ırk satırının yerine geçer; soysuz kayıt yukarıdaki eski değere düşer; değerler AS1a-2 doğru tablosundan).
  const altCases: Array<[string, string, string, string, string, number, number, number, string]> = [
    ['paladin', 'acolyte', 'imza_hizir', 'celestial', 'parlayan-ruh', 3, 47, 49, 'Lawful Good'],
    ['bard', 'criminal', 'imza_sair', 'elf', 'wood-elf', 3, -38, 20, 'Chaotic Good'],
    ['fighter', 'soldier', 'imza_imparator', 'goliath', 'stone', 3, 38, -32, 'Lawful Evil'],
    ['rogue', 'criminal', 'imza_infazci', 'tiefling', 'abyssal', 3, -45, -50, 'Chaotic Evil'],
  ];
  for (const [classId, backgroundId, subclassId, raceId, lin, level, d, g, label] of altCases) {
    it(`alt soyla: ${classId} + ${backgroundId} + ${subclassId} + ${raceId}/${lin} = (${d}, ${g}) ${label}`, () => {
      const sh = { classId, backgroundId, subclassId, raceId, level, ...(raceId === 'celestial' ? { celestialAwakening: lin } : { lineageId: lin }) };
      const v = startValue(startContributions(sh, true, 1));
      expect(v).toEqual({ duzen: d, iyilik: g });
      expect(labelOf(newAlignment(v, 'otomatik'), 'tr')).toBe(label);
    });
  }
  it('"Kabul etme" artık çoğu karakterde görünür (Paladin + Soldier + Human)', () => {
    expect(rejectOptions(startValue(startContributions({ classId: 'paladin', backgroundId: 'soldier', raceId: 'human' }, true, 1)))).toContain('orta');
  });
});

describe('etiket ve histerezis', () => {
  it('9 etiket; eşik ±17; 2 puan histerezis', () => {
    // Görev SD4: etiket adları her arayüz dilinde İngilizce (kimlikler ve kayıt biçimi aynı).
    expect(alignmentLabel('pos', 'pos', 'tr')).toBe('Lawful Good');
    expect(alignmentLabel('neg', 'neg', 'tr')).toBe('Chaotic Evil');
    expect(alignmentLabel('neu', 'neu', 'tr')).toBe('True Neutral');
    expect(alignmentLabel('neg', 'neg', 'en')).toBe('Chaotic Evil');
    expect(bucketOf(17)).toBe('pos');
    expect(bucketOf(16)).toBe('neu');
    expect(bucketOf(-17)).toBe('neg');
    expect(bucketOf(15, 'pos')).toBe('pos'); // histerezis: 17−2
    expect(bucketOf(14, 'pos')).toBe('neu');
    expect(bucketOf(16, 'neu')).toBe('neu');
  });
});

describe('başlangıç seçenekleri', () => {
  it('üç geçiş; orta çizgideki seçenek gizli; True Neutral ise kabul etmeme yok', () => {
    expect(rejectOptions({ duzen: 20, iyilik: 20 })).toEqual(['orta', 'satir-orta', 'sutun-orta']);
    expect(rejectOptions({ duzen: 5, iyilik: 20 })).toEqual(['orta', 'sutun-orta']);
    expect(rejectOptions({ duzen: 20, iyilik: -3 })).toEqual(['orta', 'satir-orta']);
    expect(rejectOptions({ duzen: 3, iyilik: -3 })).toEqual([]);
    expect(applyStartKind('orta', { duzen: 20, iyilik: 18 })).toEqual({ duzen: 0, iyilik: 0 });
    expect(applyStartKind('satir-orta', { duzen: 20, iyilik: 18 })).toEqual({ duzen: 0, iyilik: 18 });
    expect(applyStartKind('sutun-orta', { duzen: 20, iyilik: 18 })).toEqual({ duzen: 20, iyilik: 0 });
  });
  it('alt sınıf sonradan: kabul etmişse güncellenir ve günlüğe yazılır; orta çizgiye geçmişse değişmez, öneri döner', () => {
    const auto = newAlignment({ duzen: 10, iyilik: 5 }, 'otomatik');
    const r = onSubclassChange(auto, { duzen: 18, iyilik: 13 }, 'oluşturucu', Z);
    expect(r.changed).toBe(true);
    expect(r.alignment.baslangic).toEqual({ duzen: 18, iyilik: 13 });
    expect(r.alignment.gunluk.at(-1)?.tur).toBe('altSinif');
    const mid = newAlignment({ duzen: 20, iyilik: 5 }, 'satir-orta');
    const r2 = onSubclassChange(mid, { duzen: 25, iyilik: 9 }, 'oluşturucu', Z);
    expect(r2.changed).toBe(false);
    expect(r2.alignment).toBe(mid);
    expect(r2.suggested).toEqual({ duzen: 25, iyilik: 9 });
  });
});

describe('günlük', () => {
  it('olay ekle, geri al, geri getir; serbest giriş −10…+10', () => {
    let a = newAlignment({ duzen: 0, iyilik: 0 }, 'otomatik');
    a = addEvent(a, 'fedakarlik', 'gm', Z);
    expect(a.iyilik).toBe(5);
    a = toggleUndo(a, a.gunluk[0]!.id);
    expect(a.iyilik).toBe(0);
    a = toggleUndo(a, a.gunluk[0]!.id);
    expect(a.iyilik).toBe(5);
    a = addFree(a, 'duzen', 40, 'deneme', 'gm', Z);
    expect(a.duzen).toBe(10);
    expect(a.gunluk.at(-1)).toMatchObject({ tur: 'serbest', kim: 'gm', gerekce: 'deneme' });
  });
  it('AL2 tekrar azalımı: pencerede aynı olay 1. tam, 2. yarı, 3. çeyrek, 4+ etkisiz; serbest giriş muaf', () => {
    let a = newAlignment({ duzen: 0, iyilik: 0 }, 'otomatik');
    for (let i = 0; i < 5; i++) a = addEvent(a, 'zulum', 'gm', Z);
    expect(a.gunluk.map((e) => e.iyilik)).toEqual([-5, -3, -2, 0, 0]);
    expect(a.gunluk.map((e) => e.azalim)).toEqual([undefined, 0.5, 0.25, 0, 0]);
    expect(a.gunluk[1]?.yarim).toBe(true);
    expect(repeatFactor(a, 'zulum')).toBe(0);
    expect(repeatFactor(a, 'merhamet')).toBe(1); // başka olay türü ayrı sayılır (art arda olmak gerekmez)
    const mid = addEvent(addEvent(addEvent(newAlignment({ duzen: 0, iyilik: 0 }, 'otomatik'), 'zulum', 'gm', Z), 'merhamet', 'gm', Z), 'zulum', 'gm', Z);
    expect(mid.gunluk.filter((e) => e.olay === 'zulum').map((e) => e.azalim)).toEqual([undefined, 0.5]);
    const b = addFree(addFree(addFree(newAlignment({ duzen: 0, iyilik: 0 }, 'otomatik'), 'iyilik', -4, 'x', 'gm', Z), 'iyilik', -4, 'x', 'gm', Z), 'iyilik', -4, 'x', 'gm', Z);
    expect(b.iyilik).toBe(-12);
  });
  it('AL2 uzun dinlenme sayacı sıfırlar; Geri al sayacı da geri alır; eski kayıt bozulmaz', () => {
    let a = newAlignment({ duzen: 0, iyilik: 0 }, 'otomatik');
    a = addEvent(addEvent(a, 'zulum', 'gm', Z), 'zulum', 'gm', Z);
    expect(repeatFactor(a, 'zulum')).toBe(0.25);
    const rested = alignmentLongRest({ hizalanma: a }).hizalanma as Alignment;
    expect(repeatFactor(rested, 'zulum')).toBe(1);
    expect(addEvent(rested, 'zulum', 'gm', Z).gunluk.at(-1)?.azalim).toBeUndefined();
    // geri al: 2. kayıt geri alınınca sayaç 1'e iner
    const undone = toggleUndo(a, a.gunluk[1]!.id);
    expect(repeatFactor(undone, 'zulum')).toBe(0.5);
    // eski kayıt (pencereBas yok, uzun günlük): ilk olay tam etkili, sayaç oradan başlar
    const old: Alignment = { ...newAlignment({ duzen: 0, iyilik: 0 }, 'otomatik'), gunluk: Array.from({ length: 6 }, (_, i) => ({ id: `o${i}`, tur: 'olay' as const, kim: 'gm', olay: 'zulum', duzen: 0, iyilik: -5, gerekce: 'x', zaman: Z })) };
    expect(repeatFactor(old, 'zulum')).toBe(1);
    expect(addEvent(old, 'zulum', 'gm', Z).gunluk.at(-1)?.iyilik).toBe(-5);
  });
  it('AL2 dönüm noktası: ◆ kaydı, etiket geçmişi (yalnız etiket değişince), sayaç sıfırlanır; Düzelt geçmişe girmez', () => {
    let a = newAlignment({ duzen: 25, iyilik: 25 }, 'otomatik'); // Lawful Good
    a = addEvent(a, 'zulum', 'gm', Z);
    expect(a.etiketGecmisi ?? []).toEqual([]); // etiket değişmedi
    const t = turningPoint(a, { duzen: 0, iyilik: -30 }, 'İhanet', 'Yemini bozdu', 'gm', Z);
    expect(t.duzen).toBe(0); expect(t.iyilik).toBe(-30);
    const e = t.gunluk.at(-1)!;
    expect(e.tur).toBe('donum');
    expect(e.donum?.eski.kova).toEqual({ duzen: 'pos', iyilik: 'pos' });
    expect(e.donum?.yeni.kova).toEqual({ duzen: 'neu', iyilik: 'neg' });
    expect(e.gerekce).toContain('İhanet');
    expect(t.etiketGecmisi?.length).toBe(1);
    expect(labelPath(t, 'en')).toEqual(['Lawful Good', 'Neutral Evil']);
    expect(repeatFactor(t, 'zulum')).toBe(1); // sayaç sıfırlandı
    // aynı etiket içinde dönüm noktası geçmişe girmez
    expect(turningPoint(t, { duzen: 0, iyilik: -40 }, 'Daha da', 'x', 'gm', Z).etiketGecmisi?.length).toBe(1);
    // gizli
    expect(turningPoint(a, { duzen: 0, iyilik: 0 }, 'B', 'g', 'gm', Z, true).gizli).toBe(true);
    // Düzelt: değer değişir, günlüğe "düzelt", geçmiş ve sayaçlar aynı
    const f = correctValue(t, { duzen: 0, iyilik: -10 }, 'gm', Z);
    expect(f.iyilik).toBe(-10);
    expect(f.gunluk.at(-1)?.tur).toBe('duzelt');
    expect(f.etiketGecmisi?.length).toBe(1);
    expect(f.pencereBas).toBe(t.pencereBas);
    // dönüm noktasından önceki kayıt artık geri alınamaz (arayüz), son çapa dizini
    expect(lastAnchorIndex(t)).toBe(t.gunluk.length - 1);
  });
  it('AL2 etiket geçmişi histerezisi korur: eşiğin hemen altına inince etiket geri dönmez', () => {
    let a = newAlignment({ duzen: 0, iyilik: 18 }, 'otomatik'); // Good (≥17)
    a = addFree(a, 'iyilik', -2, 'azaldı', 'gm', Z); // 16: histerezis (≥15) → hâlâ Good, geçmiş yok
    expect(a.etiketGecmisi ?? []).toEqual([]);
    a = addFree(a, 'iyilik', -2, 'daha azaldı', 'gm', Z); // 14 < 15 → Neutral
    expect(a.etiketGecmisi?.length).toBe(1);
  });
  it('Game Master yeniden belirler: yeni başlangıç, günlük kaydı, değişimler korunur', () => {
    let a = addEvent(newAlignment({ duzen: 10, iyilik: 10 }, 'otomatik'), 'yardim', 'gm', Z);
    a = gmRedetermine(a, { duzen: -20, iyilik: 0 }, 'gm', Z, 'yeniden');
    expect(a.baslangicTuru).toBe('gm');
    expect(a.duzen).toBe(-20);
    expect(a.iyilik).toBe(4); // K52: Masumu korudu İ +4 (taslak)
    expect(a.gunluk.at(-1)?.tur).toBe('yeniden');
  });
  it('eski kayıt (alan yok) 0/0 açılır; etiket True Neutral', () => {
    const a = alignmentOf(undefined);
    expect([a.duzen, a.iyilik]).toEqual([0, 0]);
    expect(labelOf(a, 'tr')).toBe('True Neutral');
    expect(blankCharacter('x').hizalanma).toBeUndefined();
  });
});

describe('kural kapalı / açık', () => {
  it('oluşturucu adımı yalnız kural açıkken (son adım)', () => {
    const s = blankCharacter('x').sheet;
    expect(wizardSteps(s)).not.toContain('alignment');
    setAlignmentEnabled(true);
    expect(wizardSteps(s).at(-1)).toBe('alignment');
  });
  it('kart etiketi: gizli işaretliyse çizilmez', () => {
    const a = newAlignment({ duzen: 20, iyilik: 20 }, 'otomatik');
    expect(renderToStaticMarkup(createElement(AlignmentBadge, { value: a }))).toContain('Lawful Good');
    expect(renderToStaticMarkup(createElement(AlignmentBadge, { value: { ...a, gizli: true } }))).toBe('');
  });
});

describe('duman testi', () => {
  it('12 sınıf × bütün geçmişler × bütün ırklar: çökme yok, ±50 içinde', () => {
    const bgs = (backgrounds as unknown as { backgrounds: Array<{ id: string }> }).backgrounds.map((b) => b.id);
    let n = 0;
    for (const c of classes) for (const b of bgs) for (const r of races) for (const irk of [true, false]) {
      const v = startValue(startContributions({ classId: c.id, backgroundId: b, raceId: r.id }, irk, 1));
      expect(Math.abs(v.duzen)).toBeLessThanOrEqual(50);
      expect(Math.abs(v.iyilik)).toBeLessThanOrEqual(50);
      n++;
    }
    expect(n).toBeGreaterThanOrEqual(12 * bgs.length * races.length);
  });
});

import tablo from '../../data/hizalanma-baslangic.json';
import { KATKI_CARPANI, newAlignmentAt, squareCenter, squareOf } from './alignment';
import { alignDiceOf, withAlignDice } from './alignDice';
import { blankCharacter } from './builder';
import { classes, races } from '../data';

describe('SD12: katkı çarpanı ve kare seçimi', () => {
  it('çarpan veride tek değer; dağılım raporundaki aralıkta (True Neutral %20–30)', () => {
    expect(KATKI_CARPANI).toBe(1.8);
    const bgs = Object.keys((tablo as unknown as { gecmis: Record<string, unknown> }).gecmis);
    const variants: Array<{ raceId: string; lineageId?: string }> = [];
    for (const r of races) { if (r.lineages?.length) for (const l of r.lineages) variants.push({ raceId: r.id, lineageId: l.id }); else variants.push({ raceId: r.id }); }
    let tn = 0, n = 0;
    const seen = new Set<string>();
    for (const cl of classes) for (const bg of bgs) for (const rv of variants) {
      const v = startValue(startContributions({ classId: cl.id, backgroundId: bg, ...rv }));
      const sq = squareOf(v); seen.add(`${sq.d}-${sq.g}`);
      if (sq.d === 'neu' && sq.g === 'neu') tn++; n++;
    }
    expect(tn / n).toBeGreaterThan(0.15); expect(tn / n).toBeLessThan(0.35);
    expect(seen.size).toBeGreaterThanOrEqual(8);
  });
  it('karenin merkezi: kare → değerler; True Neutral 0,0; kare seçimi kayıtta başlangıç türü kare', () => {
    expect(squareCenter('neu', 'neu')).toEqual({ duzen: 0, iyilik: 0 });
    const a = newAlignmentAt('pos', 'neg');
    expect([a.baslangic, a.baslangicTuru, a.duzen, a.iyilik]).toEqual([{ duzen: 33, iyilik: -33 }, 'kare', 33, -33]);
    expect(alignDiceOf(a)).toBe('hizalanma-lawful-evil');
    const tn = newAlignmentAt('neu', 'neu');
    expect(alignDiceOf(tn)).toBe('hizalanma-true-neutral');
  });
  it('otomatik hesap çarpanı kayda yazar; eski karakter (çarpan yok) ×1 ile hesaplanır, değeri değişmez', () => {
    const v = { duzen: 10, iyilik: 10 };
    expect(newAlignment(v, 'otomatik').katkiCarpani).toBe(KATKI_CARPANI);
    const old = newAlignment(v, 'otomatik', 1);
    delete (old as { katkiCarpani?: number }).katkiCarpani;
    const sheet = { classId: 'paladin', backgroundId: 'acolyte', raceId: 'dwarf' };
    const withOld = startValue(startContributions(sheet, true, old.katkiCarpani ?? 1));
    expect(withOld).toEqual(startValue(startContributions(sheet, true, 1)));
    // Seçilen karenin zarı kayıtla açılır (SD8 kancası)
    const c = withAlignDice({ ...blankCharacter('x'), hizalanma: newAlignmentAt('neg', 'pos') });
    expect(c.hizalanmaZarlar).toEqual(['hizalanma-chaotic-good']);
  });
});

describe('AL2 panel', () => {
  it('Game Master paneli: Dönüm noktası + Düzelt düğmeleri, ◆ günlük satırı, yol haritası, tekrar çarpanı; çapadan önceki kayıtta Geri al yok', async () => {
    const { AlignmentPanel } = await import('../ui/gm/AlignmentPanel');
    const { demoCharacters } = await import('../screens/fixtures');
    let a = newAlignment({ duzen: 25, iyilik: 25 }, 'otomatik');
    a = addEvent(addEvent(a, 'zulum', 'gm', Z), 'zulum', 'gm', Z);
    a = turningPoint(a, { duzen: 0, iyilik: -30 }, 'İhanet', 'Yemini bozdu', 'gm', Z);
    const c = { ...demoCharacters()[0]!, hizalanma: a };
    const html = renderToStaticMarkup(createElement(AlignmentPanel, { characters: [c], onUpdate: () => {} }));
    expect(html).toContain('Dönüm noktası'); expect(html).toContain('Düzelt');
    expect(html).toContain('◆ İhanet'); expect(html).toContain('Yol:'); expect(html).toContain('Lawful Good → Neutral Evil');
    expect(html).not.toContain('×0.'); // dönüm noktası sayaçları sıfırladı
    expect(html).not.toContain('Geri al');
  });
});
