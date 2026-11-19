/**
 * Görev D1 (kural sürümü 86): SRD veri düzeltmelerinin eski değer katmanı. Veri dosyaları (`monsters.json`,
 * `canavar-turleri.json`, `yuzme-hizi.json`, `canavar-yetenekleri.json`, `multiattack.json`) yeni (SRD) değerleri tutar;
 * kural sürümü < 86 olan savaş bu modülden eski değerleri alır (`data/srd-duzeltme.json`: kayıt başına alan, eski, yeni,
 * sayfa). Sürüm verilmezse (oluşturucu, arayüz) güncel değer. Saf; yalnız veri.
 *
 * `alan` yolu: nokta alt alan (`abilities.str`), `[x]` dizide `id`/`name` = x olan nesne ya da x ile başlayan metin
 * (`attacks[Slam].repeat`, `unsupported[Durum bağışıklığı:]`); `eski: null` = alan eski veride yoktu (silinir).
 */
import katman from '../../data/srd-duzeltme.json';
import turler from '../../data/canavar-turleri.json';
import yuzme from '../../data/yuzme-hizi.json';
import { SRD_D1_VERSION } from './srdD1Surum';

export interface SrdDuzeltme { dosya: string; kayit: string; alan: string; eski: unknown; yeni: unknown; sayfa: number; not?: string }
export const SRD_DUZELTMELER = (katman as { kayitlar: SrdDuzeltme[] }).kayitlar;

const TYPES = (turler as { types: Record<string, string> }).types;
const SWIM = (yuzme as { hiz: Record<string, number | null> }).hiz;
/** Eski değer mi okunmalı (sürüm verilmemişse güncel). */
const eskiMi = (v: number | undefined): boolean => v !== undefined && v < SRD_D1_VERSION;

const byKey = new Map<string, SrdDuzeltme[]>();
for (const d of SRD_DUZELTMELER) {
  const k = `${d.dosya}|${d.kayit}`;
  byKey.set(k, [...(byKey.get(k) ?? []), d]);
}

type Seg = { key: string; sel?: string };
const parse = (alan: string): Seg[] => alan.split('.').map((s) => {
  const m = /^([^[]*)\[(.+)\]$/.exec(s);
  return m ? { key: m[1] as string, sel: m[2] as string } : { key: s };
});
const matches = (el: unknown, sel: string): boolean => (typeof el === 'string' ? el.startsWith(sel)
  : !!el && typeof el === 'object' && ((el as { id?: unknown }).id === sel || (el as { name?: unknown }).name === sel));

/** `obj` içinde yola değeri yazar (null: siler). Yerinde değiştirir (kopya üzerinde çağrılır). */
function setPath(obj: Record<string, unknown>, segs: Seg[], value: unknown): void {
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < segs.length; i++) {
    const { key, sel } = segs[i] as Seg;
    const last = i === segs.length - 1;
    if (sel === undefined) {
      if (last) { if (value === null) delete cur[key]; else cur[key] = value; return; }
      cur = (cur[key] ??= {}) as Record<string, unknown>;
      continue;
    }
    const arr = (key ? (cur[key] ??= []) : cur) as unknown[];
    const idx = arr.findIndex((el) => matches(el, sel));
    if (last) {
      if (value === null) { if (idx >= 0) arr.splice(idx, 1); } else if (idx >= 0) arr[idx] = value; else arr.unshift(value);
      if (key && Array.isArray(cur[key]) && (cur[key] as unknown[]).length === 0 && value === null) delete cur[key];
      return;
    }
    if (idx < 0) return;
    cur = arr[idx] as Record<string, unknown>;
  }
}

const cache = new WeakMap<object, unknown>();
/**
 * Kaydın sürümdeki hâli: sürüm < 86 ise eski değerler uygulanmış kopya (önbellekli), değilse kaydın kendisi. `kayit` canavar
 * kimliği; `cur` veri dosyasındaki güncel kayıt.
 */
export function srdKayit<T>(dosya: string, kayit: string, cur: T, v: number | undefined): T {
  if (!eskiMi(v) || cur === undefined || cur === null) return cur;
  const list = byKey.get(`${dosya}|${kayit}`);
  if (!list) return cur;
  const hit = cache.get(cur as object);
  if (hit !== undefined) return hit as T;
  const copy = structuredClone(cur) as unknown as Record<string, unknown>;
  for (const d of list) setPath(copy, parse(d.alan), d.eski);
  cache.set(cur as object, copy);
  return copy as unknown as T;
}

/** Yaratık türü (`canavar-turleri.json`) sürümde. */
export function creatureTypeAt(id: string, v?: number): string | undefined {
  if (eskiMi(v)) {
    const d = byKey.get(`data/canavar-turleri.json|${id}`)?.[0];
    if (d) return d.eski as string;
  }
  return TYPES[id];
}

/** Yüzme hızı (`yuzme-hizi.json`, ft) sürümde; yüzücü değilse undefined. */
export function swimSpeedAt(id: string | undefined, v?: number): number | undefined {
  if (!id) return undefined;
  if (eskiMi(v)) {
    const d = byKey.get(`data/yuzme-hizi.json|${id}`)?.[0];
    if (d) return (d.eski as number | null) ?? undefined;
  }
  return SWIM[id] ?? undefined;
}

/** Canavar kaydı (`monsters.json`) sürümde: yetenek puanları, kurtarmalar, durum bağışıklığı notu, saldırı tekrarı. */
export const monsterAt = <M extends { id: string }>(m: M, v?: number): M => srdKayit('data/monsters.json', m.id, m, v);

const IDS = new Set(SRD_DUZELTMELER.map((d) => d.kayit));
/** Bu canavarın D1 düzeltmesi var mı (savaşçı geri alması yalnız bunlara bakar). */
export const hasSrdD1 = (id: string): boolean => IDS.has(id);
