// Kuyruk E3: büyü × efekt ve alt sınıf × görsel tablolarının tutarlılığı (görsel dosyası okunmaz; yalnız dosya adları).
import fs from 'node:fs';
import { describe, it, expect } from 'vitest';
import { spellRows, spellDoc, featureRows, featureDoc } from './buyu-efekt-tablosu.mjs';
import { AILELER, ILKEL_GORSEL } from './lib/buyu-efekt.mjs';

// Kuyruk E4b: E2/E4 sayfaları `public/efekt/` altındadır (duvar-ruzgar gibi öneksiz anahtarlar oradan); tablo betiği de üç klasöre bakar.
const sprites = new Set([...fs.readdirSync('public/sprites'), ...fs.readdirSync('public/efekt')]);

describe('büyü × efekt tablosu', () => {
  const rows = spellRows();
  it('339 satır, kimlikler tekil, durumlar geçerli', () => {
    expect(rows).toHaveLength(339);
    expect(new Set(rows.map((r) => r.id)).size).toBe(339);
    for (const r of rows) expect(['hazır', 'genel', 'eksik', 'savaş dışı']).toContain(r.durum);
  });
  it('özet sayıları satırlarla tutarlı', () => {
    const { stats } = spellDoc(rows);
    expect(stats.h + stats.g + stats.e).toBe(stats.fight);
    expect(stats.fight + stats.off).toBe(339);
    expect(stats.n).toBe(rows.filter((r) => r.durum !== 'hazır' && r.durum !== 'savaş dışı' && r.aile).length);
  });
  it('hazır satırın öneksiz anahtarı depoda; aileler tanımlı; hazır satırda aile yok', () => {
    for (const r of rows) {
      if (r.aile) expect(AILELER[r.aile], `${r.id}: ${r.aile}`).toBeTruthy();
      if (r.durum === 'hazır') expect(r.aile).toBeNull();
      if (r.durum !== 'hazır') continue;
      for (const k of r.anahtarlar.filter((k) => /^[a-z]+(-[a-z]+)+$/.test(k))) expect(sprites.has(`efekt-${k}.webp`), `${r.id}: ${k}`).toBe(true);
    }
  });
  it('savaş dışı büyü efekt ailesi taşımaz', () => {
    for (const r of rows.filter((x) => x.durum === 'savaş dışı')) expect(r.aile).toBeNull();
  });
});

describe('alt sınıf × görsel tablosu', () => {
  const fr = featureRows('icerik');
  // Görev AS2: K49 B5 ile gizlenen sekiz SRD alt sınıfı listeye döndü (120 hep seçilebilir): çekirdek 4 → 12.
  it('çekirdek 12 ve imza 12 alt sınıf; ilkeller eşlemede', () => {
    const subs = (k) => new Set(fr.rows.filter((r) => r.kaynak.startsWith(k)).map((r) => r.sub)).size;
    expect(subs('SRD')).toBe(12);
    expect(subs('imza')).toBe(12);
    for (const r of fr.rows) {
      expect(['hazır', 'genel', 'eksik', 'gerekmez']).toContain(r.durum);
      for (const i of r.ilkeller) expect(ILKEL_GORSEL[i], `${r.sub}/${r.id}: ${i}`).toBeTruthy();
      for (const a of r.aileler) expect(AILELER[a]).toBeTruthy();
    }
  });
  it('belge paket açıklaması içermez', () => {
    const { text } = featureDoc(fr);
    expect(text).not.toMatch(/Kurgusal test özelliği/);
  });
});
