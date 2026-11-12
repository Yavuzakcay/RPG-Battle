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
  rejectOptions, startContributions, startValue, toggleUndo, ALIGN_EVENTS,
} from './alignment';
import { blankCharacter } from './builder';
import { classes, races } from '../data';
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

describe('başlangıç hesabı', () => {
  it('katkılar toplanır, ±50 kırpılır; ırk satırı en sonda; tabloda olmayan kalem 0 (çökme yok)', () => {
    const list = startContributions(sheet({ classId: 'paladin', backgroundId: 'acolyte', subclassId: 'oath-of-devotion', raceId: 'dwarf' }));
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
      const v = startValue(startContributions({ classId, backgroundId, subclassId, raceId }));
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
      const v = startValue(startContributions(sh));
      expect(v).toEqual({ duzen: d, iyilik: g });
      expect(labelOf(newAlignment(v, 'otomatik'), 'tr')).toBe(label);
    });
  }
  it('"Kabul etme" artık çoğu karakterde görünür (Paladin + Soldier + Human)', () => {
    expect(rejectOptions(startValue(startContributions({ classId: 'paladin', backgroundId: 'soldier', raceId: 'human' })))).toContain('orta');
  });
});

describe('etiket ve histerezis', () => {
  it('9 etiket (SD4: her dilde İngilizce); eşik ±17; 2 puan histerezis', () => {
    expect(alignmentLabel('pos', 'pos', 'tr')).toBe('Lawful Good');
    expect(alignmentLabel('neu', 'neu', 'tr')).toBe('True Neutral');
    expect(alignmentLabel('neg', 'neg', 'en')).toBe('Chaotic Evil');
    expect(alignmentLabel('neg', 'neg', 'tr')).toBe('Chaotic Evil');
    expect(bucketOf(17)).toBe('pos');
    expect(bucketOf(16)).toBe('neu');
    expect(bucketOf(-17)).toBe('neg');
    expect(bucketOf(15, 'pos')).toBe('pos'); // histerezis: 17−2
    expect(bucketOf(14, 'pos')).toBe('neu');
    expect(bucketOf(16, 'neu')).toBe('neu');
  });
});

describe('başlangıç seçenekleri', () => {
  it('üç geçiş; orta çizgideki seçenek gizli; Gerçek Tarafsız ise kabul etmeme yok', () => {
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
  it('azalan getiri: aynı hazır olay art arda 3. kez yarı etki; serbest girişe uygulanmaz; araya başka olay girince sıfırlanır', () => {
    const ev = ALIGN_EVENTS.find((e) => e.id === 'zulum')!;
    let a = newAlignment({ duzen: 0, iyilik: 0 }, 'otomatik');
    a = addEvent(addEvent(addEvent(a, 'zulum', 'gm', Z), 'zulum', 'gm', Z), 'zulum', 'gm', Z);
    expect(a.gunluk.map((e) => e.iyilik)).toEqual([ev.iyilik, ev.iyilik, -Math.ceil(Math.abs(ev.iyilik) / 2)]); // K52: Zorbalık −5 → −3 (yarım yukarı)
    expect(a.gunluk.at(-1)?.yarim).toBe(true);
    a = addEvent(addEvent(a, 'merhamet', 'gm', Z), 'zulum', 'gm', Z);
    expect(a.gunluk.at(-1)?.yarim).toBeFalsy();
    const b = addFree(addFree(addFree(newAlignment({ duzen: 0, iyilik: 0 }, 'otomatik'), 'iyilik', -4, 'x', 'gm', Z), 'iyilik', -4, 'x', 'gm', Z), 'iyilik', -4, 'x', 'gm', Z);
    expect(b.iyilik).toBe(-12);
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
      const v = startValue(startContributions({ classId: c.id, backgroundId: b, raceId: r.id }, irk));
      expect(Math.abs(v.duzen)).toBeLessThanOrEqual(50);
      expect(Math.abs(v.iyilik)).toBeLessThanOrEqual(50);
      n++;
    }
    expect(n).toBeGreaterThanOrEqual(12 * bgs.length * races.length);
  });
});
