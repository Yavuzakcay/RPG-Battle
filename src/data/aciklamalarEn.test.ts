/**
 * Görev EN-ACIKLAMA: `data/aciklamalar-en.json` + `data/aciklamalar-en-canavar.json` (İngilizce açıklamalar) ve büyü
 * betimlemelerinin `en` alanı. Her TR kaydın EN karşılığı var (eksik = hata), boş değil, kimlikler aynı (Invocation'da
 * oyunun bütün Invocation'ları da), Türkçe harf yok (özel adlar hariç); sayı/zar ifadeleri TR ile eşleşmiyorsa yalnız
 * uyarı (SRD metni TR özetten ayrıntılıdır). Gösterim: EN dilde gerçek İngilizce metin, kayıt yoksa eski "yalnız Türkçe" notu.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { classData, items, enAciklama, enDescriptions, loadEnMonsterDescriptions, spellDescriptionOf, spellDescriptionShown } from './index';
import { DESCRIPTION_MAX } from './betimleme';
import { describeTr } from '../ui/trDesc';
import { featureSummary, featInfo, raceTraitLines } from '../ui/descriptions';
import { itemSummary } from '../ui/equipmentText';
import { setLang, t } from '../i18n';
import trData from '../../data/aciklamalar-tr.json';
import enData from '../../data/aciklamalar-en.json';
import enMon from '../../data/aciklamalar-en-canavar.json';
import betimleme from '../../data/buyu-betimleme.json';

type Table = Record<string, Record<string, string>>;
const TR = trData as unknown as Table;
const EN: Table = { ...(enData as unknown as Table), canavar: (enMon as unknown as Table).canavar! };
const KINDS = Object.keys(TR).filter((k) => !k.startsWith('_'));
const TURKISH = /[çşğıöüÇŞĞİÖÜ]/;
/** Özel adlar: Türkçe harfli olup İngilizce metinde kalabilecek adlar (alt sınıf ve geçmiş adları SD4'te Türkçe). */
const PROPER_NAMES: string[] = [];
const numbersOf = (s: string) => new Set((s.replace(/(\d+)[- ](feet|foot)/g, '$1 ft').match(/\b\d+d\d+\b|DC \d+|\b\d+ ft\b/g) ?? []));
const invocationIds = () => Object.values(classData.mechanics.features).flatMap((m) => (m.invocations ?? []).map((v) => v.id));

describe('EN açıklamalar (aciklamalar-en.json)', () => {
  it('her TR kaydın EN karşılığı var, boş değil; EN kimlikleri TR ile aynı (Invocation: + oyunun bütün Invocation\'ları)', () => {
    const missing: string[] = [];
    for (const k of KINDS) for (const id of Object.keys(TR[k]!)) if (!EN[k]?.[id]?.trim()) missing.push(`${k}/${id}`);
    expect(missing).toEqual([]);
    for (const k of KINDS) {
      // Invocation: oyunun bütün Invocation'ları; eşya: TR dosyasında olmayıp Türkçe kısa notu olan oyun eşyaları da (EN'de SRD metni).
      const allowed = new Set([...Object.keys(TR[k]!), ...(k === 'invocation' ? invocationIds() : k === 'esya' ? items.map((i) => i.id) : [])]);
      expect(Object.keys(EN[k] ?? {}).filter((id) => !allowed.has(id)), k).toEqual([]);
    }
    expect(invocationIds().filter((id) => !EN.invocation?.[id])).toEqual([]);
  });

  it('EN metinde Türkçe harf yok (özel adlar hariç)', () => {
    const bad: string[] = [];
    for (const k of KINDS) for (const [id, text] of Object.entries(EN[k] ?? {})) {
      const rest = PROPER_NAMES.reduce((s, n) => s.split(n).join(''), text);
      if (TURKISH.test(rest)) bad.push(`${k}/${id}`);
    }
    expect(bad).toEqual([]);
  });

  it('sayı/zar/DC/mesafe ifadeleri TR ile eşleşir (uyarı düzeyi, hata değil)', () => {
    const warn: string[] = [];
    for (const k of KINDS) for (const [id, tr] of Object.entries(TR[k]!)) {
      const en = numbersOf(EN[k]?.[id] ?? '');
      const lost = [...numbersOf(tr)].filter((n) => !en.has(n));
      if (lost.length) warn.push(`${k}/${id}: ${lost.join(', ')}`);
    }
    if (warn.length) console.warn(`[EN açıklama] TR'deki ${warn.length} kayıtta sayı EN'de birebir yok (SRD metni farklı ifade ediyor olabilir):\n${warn.slice(0, 20).join('\n')}`);
    expect(Array.isArray(warn)).toBe(true);
  });

  it('büyü betimlemeleri: 339 kaydın hepsinde en, en çok 135 karakter, Türkçe harf yok; EN modunda gösterilir', () => {
    const B = betimleme as unknown as Record<string, { tr?: string; en?: string }>;
    const ids = Object.keys(B).filter((k) => !k.startsWith('_'));
    expect(ids.length).toBe(339);
    for (const id of ids) {
      const en = B[id]!.en ?? '';
      expect(en.trim().length, id).toBeGreaterThan(0);
      expect(en.length, id).toBeLessThanOrEqual(DESCRIPTION_MAX);
      expect(TURKISH.test(en), id).toBe(false);
    }
    expect(spellDescriptionOf('fireball', 'en')).toBe(B.fireball!.en);
    expect(spellDescriptionShown('fireball', 'en')).toBe(B.fireball!.en);
  });
});

describe('EN açıklama gösterimi', () => {
  it('EN dilde büyü, eşya, tür özelliği, sınıf özelliği, Invocation, feat ve canavar eylemi gerçek İngilizce metin', async () => {
    await setLang('en');
    try {
      expect(describeTr('buyu', 'fireball')).toMatch(/8d6 Fire damage/);
      expect(describeTr('esya', 'ammunition-of-slaying')).toMatch(/Differs in game: /);
      expect(describeTr('tur', 'dragonborn/breath-weapon')).toMatch(/Attack action/);
      expect(describeTr('invocation', 'eldritch-mind')).toMatch(/Concentration/);
      expect(describeTr('durum', 'prone')).toMatch(/Prone condition/);
      expect(featureSummary({ key: 'barbarian:improved-brutal-strike', id: 'improved-brutal-strike', from: 'class' }, 'barbarian', undefined, 'en')).toMatch(/Brutal Strike/);
      expect(featInfo('alert', 'en')?.what).toBeTruthy();
      expect(raceTraitLines('dragonborn', 'en').join(' ')).toMatch(/Breath Weapon: /);
      expect(itemSummary(items.find((i) => i.id === 'caltrops')!)).not.toContain(t().common.descTrOnly);
      await loadEnMonsterDescriptions();
      expect(enAciklama('canavar', 'aboleth/action:tentacle')).toMatch(/2d6 \+ 5/);
      // Kayıt yoksa eski davranış: "yalnız Türkçe" notu.
      const saved = enDescriptions.tur['dragonborn/breath-weapon'];
      delete enDescriptions.tur['dragonborn/breath-weapon'];
      try { expect(describeTr('tur', 'dragonborn/breath-weapon')).toBe(t().common.descTrOnly); } finally { enDescriptions.tur['dragonborn/breath-weapon'] = saved!; }
      // Bileşen düzeyinde çizim: yalnız metin, "yalnız Türkçe" notu yok.
      const html = renderToStaticMarkup(createElement('p', null, describeTr('buyu', 'fire-bolt')));
      expect(html).toMatch(/Cantrip Upgrade/);
    } finally { await setLang('tr'); }
  });
});
