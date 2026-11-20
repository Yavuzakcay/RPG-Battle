/**
 * Dungeondex prospektüsü (harita/belgeler/DUNGEONDEX-PROSPEKTUS.md): bir kaydın "ilaç prospektüsü" biçimindeki bölümleri.
 * Saf veri tipleri; React yok. Boş bölüm üretilmez (bileşen yine de satırsız bölümü gizler).
 */
export type ProKey = 'ne' | 'nasil' | 'etken' | 'risk' | 'kimler' | 'maliyet' | 'durum';

/** Bölüm sırası (şablon). */
export const PRO_ORDER: readonly ProKey[] = ['ne', 'nasil', 'etken', 'risk', 'kimler', 'maliyet', 'durum'];

export interface ProRow {
  /** Satır etiketi (veriden üretilen satırlarda: "Hasar", "Menzil"…). Paragraf satırında yok. */
  label?: string;
  text: string;
  /** Türkçe yazılmış içerik İngilizce arayüzde gösteriliyor ("yalnız Türkçe" notu). */
  trOnly?: boolean;
}

export type ProTone = 'ok' | 'gm' | 'off' | 'none';

export interface ProSection {
  key: ProKey;
  /** Başlık metni (dil tablosundan; başlık anahtarı `key`). */
  title: string;
  rows: ProRow[];
  /** Yalnız "Oyundaki durum" bölümünde. */
  badge?: { tone: ProTone; text: string };
}

/** Prospektüs veri dosyasındaki Türkçe paragraflar (data/prospektus/*.json). */
export interface ProText { ne?: string; nasil?: string; risk?: string; kimler?: string }
