/**
 * Görev SD4: `data/aciklamalar-tr.json` (Türkçe açıklamalar; ad İngilizce, açıklama Türkçe). Kimlik kuralı: her anahtar
 * gerçek bir SRD kaydına bağlanır; her büyü ve SRD tür özelliği kapsanır; metin Türkçe, kısa ve tek satır; eşya kartında
 * İngilizce SRD ham metni kalmaz; İngilizce arayüzde Türkçe metin yerine "yalnız Türkçe" notu çıkar.
 */
import { describe, expect, it } from 'vitest';
import { items, spells, classData, trAciklama } from './index';
import { looksEnglish } from './aciklamaDil';
import { itemSummary } from '../ui/equipmentText';
import { describeTr } from '../ui/trDesc';
import { setLang, t } from '../i18n';
import srdSpecies from '../../data/srd/species.json';
import data from '../../data/aciklamalar-tr.json';

const D = data as unknown as Record<string, Record<string, string>>;
const traitIds = srdSpecies.species.flatMap((s) => s.traits.map((x) => `${s.id}/${x.id}`));

describe('SD4 Türkçe açıklamalar', () => {
  it('her anahtar gerçek bir kayda bağlanır', () => {
    const spellIds = new Set(spells.map((s) => s.id));
    const itemIds = new Set(items.map((i) => i.id));
    for (const k of Object.keys(D.buyu ?? {})) expect(spellIds.has(k), `buyu ${k}`).toBe(true);
    for (const k of Object.keys(D.esya ?? {})) expect(itemIds.has(k), `esya ${k}`).toBe(true);
    for (const k of Object.keys(D.tur ?? {})) expect(traitIds.includes(k), `tur ${k}`).toBe(true);
    const invs = new Set(Object.values(classData.mechanics.features).flatMap((m) => (m.invocations ?? []).map((v) => v.id)).concat(Object.values(classData.mechanics.features).map((m) => (m as { id?: string }).id ?? '')));
    for (const k of Object.keys(D.invocation ?? {})) expect(invs.size > 0 && (classData.mechanics.features[`warlock:${k}`] !== undefined || invs.has(k)), `invocation ${k}`).toBe(true);
    for (const k of Object.keys(D.yetenek ?? {})) expect(classData.mechanics.features[k] !== undefined || k.includes(':'), `yetenek ${k}`).toBe(true);
  });
  it('339 büyünün hepsi ve 41 SRD tür özelliğinin hepsi Türkçe açıklamalı', () => {
    expect(spells.length).toBe(339);
    for (const s of spells) expect(D.buyu?.[s.id], s.id).toBeTruthy();
    for (const id of traitIds) expect(D.tur?.[id], id).toBeTruthy();
  });
  it('metinler Türkçe, kısa ve tek satır; İngilizce SRD ham metni değil', () => {
    for (const [tur, tablo] of Object.entries(D)) {
      if (tur.startsWith('_') || typeof tablo !== 'object') continue;
      for (const [id, text] of Object.entries(tablo)) {
        expect(text.length, `${tur}/${id} uzunluk`).toBeGreaterThan(10);
        expect(text.length, `${tur}/${id} uzunluk`).toBeLessThanOrEqual(240);
        expect(text.includes('\n'), `${tur}/${id} satır`).toBe(false);
        expect(looksEnglish(text), `${tur}/${id} İngilizce`).toBe(false);
      }
    }
  });
  it('hiçbir eşya kartı özetinde İngilizce SRD ham metni kalmaz', () => {
    const bad = items.filter((i) => looksEnglish(itemSummary(i))).map((i) => i.id);
    expect(bad).toEqual([]);
  });
  it('İngilizce arayüzde Türkçe açıklama yerine kısa "yalnız Türkçe" notu; Türkçede açıklama', () => {
    expect(trAciklama('buyu', 'fireball')).toMatch(/8d6/);
    setLang('tr');
    expect(describeTr('buyu', 'fireball')).toMatch(/8d6/);
    setLang('en');
    try {
      expect(describeTr('buyu', 'fireball')).toBe(t().common.descTrOnly);
      expect(describeTr('buyu', 'fireball')).not.toMatch(/8d6/);
      expect(describeTr('buyu', 'yok-boyle-buyu')).toBeUndefined();
    } finally { setLang('tr'); }
  });
});
