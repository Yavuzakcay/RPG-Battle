/**
 * Görev ODA-1 (O1): çevrimiçi oda bağlantı arayüzü (harita/belgeler/ODA-TASARIM.md §2). Saf: yalnız tipler.
 * Oyun kodu (host, istemci, ekranlar) yalnız `RoomTransport`'u görür; hangi bağdaştırıcıda (bellek, sekme, yerel ağ,
 * supabase) olduğunu bilmez. Aktarıcı mesajın içine bakmaz, yalnız zarfı (`kime`) okur.
 */
import type { OdaMesaji } from './protocol';

export type Rol = 'host' | 'oyuncu' | 'izleyici';
export interface Uye { istemciId: string; rol: Rol }

export interface Zarf {
  /** 6 haneli oda kodu. */
  oda: string;
  /** Gönderen istemciId (bağdaştırıcı doldurur; istemcinin mesaj içinde yazdığına güvenilmez). */
  kimden: string;
  /** Yoksa: host'tan herkese yayın / istemciden host'a. */
  kime?: string;
  m: OdaMesaji;
}

export type BaglantiDurumu =
  | { tur: 'baglaniyor' } | { tur: 'bagli' } | { tur: 'koptu'; neden: string }
  | { tur: 'uye_geldi'; uye: Uye } | { tur: 'uye_gitti'; istemciId: string }
  | { tur: 'kod_dolu' } | { tur: 'oda_yok' };

export type TransportTuru = 'bellek' | 'sekme' | 'yerel-ag' | 'supabase';

export interface RoomTransport {
  readonly tur: TransportTuru;
  /** Host için: kodu sahiplenir (doluysa `kod_dolu` durumu ve hata). Oyuncu için: odaya bağlanır (yoksa `oda_yok` ve hata). */
  katil(kod: string, uye: Uye): Promise<void>;
  /** `kime` verilmezse: host gönderiyorsa herkese, istemci gönderiyorsa host'a. */
  gonder(m: OdaMesaji, kime?: string): void;
  dinle(fn: (z: Zarf) => void): () => void;
  durum(fn: (d: BaglantiDurumu) => void): () => void;
  ayril(): Promise<void>;
}

/** Bağdaştırıcının `katil` hatası (durum olarak da bildirilir). */
export class BaglantiHatasi extends Error {
  constructor(readonly neden: 'kod_dolu' | 'oda_yok' | 'kapali') { super(neden); }
}

/** Küçük dinleyici kümesi (bağdaştırıcılar ortak kullanır). */
export function dinleyiciler<T>(): { ekle: (fn: (x: T) => void) => () => void; yay: (x: T) => void } {
  const set = new Set<(x: T) => void>();
  return {
    ekle: (fn) => { set.add(fn); return () => { set.delete(fn); }; },
    yay: (x) => { for (const fn of [...set]) fn(x); },
  };
}
