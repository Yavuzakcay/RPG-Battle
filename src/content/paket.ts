/**
 * Görev P0: ek paket alt sınıflarının uygulanması. Alt sınıflar kayda (`setExternalSubclasses`), `kaynak` ilkelleri
 * sınıf kaynakları tablosuna (`classData.mechanics.resources`, anahtar `pk-<alt sınıf>-<kaynak>`) yazılır: en çok
 * kullanım, dinlenme yenilenmesi ve savaş sonu karaktere yazılması mevcut kaynak yoluyla çalışır. `buyuVer.bedava`
 * kaynağı o büyüleri slotsuz yaptırır (`freeSpells`). Yeniden uygulamada önceki paket kaynakları silinir. Saf veri.
 */
import { classData, type ResourceDef, type SubclassDef } from '../data';
import { setExternalSubclasses } from '../rules/subclasses';
import { kullanimKaynak, paketKaynakId } from './ilkelSema';

let registered: string[] = [];

const usesOf = (sayi: unknown): ResourceDef['uses'] => {
  if (typeof sayi === 'number') return { fixed: sayi };
  if (sayi === '$pb') return { proficiency: true };
  if (typeof sayi === 'string' && /^\$(str|dex|con|int|wis|cha)$/.test(sayi)) return { abilityMod: sayi.slice(1) as 'str', min: 1 };
  if (sayi && typeof sayi === 'object') return { byLevel: sayi as Record<string, number> };
  return { fixed: 1 };
};
const rechargeOf = (y: unknown): ResourceDef['recharge'] =>
  (y === 'tur' ? { turn: 'all', short: 'all', long: 'all' } : y === 'kisa' ? { short: 'all', long: 'all' } : { long: 'all' });
/** Kuyruk P12: `zarHavuzu.havuz` (seviye → havuz büyüklüğü) bu kaynağı sayan havuzun kademeleri; kaynağın `sayi`sının yerine. */
const poolTiers = (all: Array<{ p: Record<string, unknown> }>, id: string): Record<string, number> | undefined =>
  all.map((x) => x.p).find((q) => q.tur === 'zarHavuzu' && (q.kaynak as { id?: string } | undefined)?.id === id && q.havuz && typeof q.havuz === 'object')?.havuz as Record<string, number> | undefined;

/** Paket kaynaklarını tabloya yazar (öncekiler silinir). */
export function registerPackResources(list: SubclassDef[]): void {
  const table = classData.mechanics.resources;
  for (const id of registered) delete table[id];
  registered = [];
  for (const sub of list) {
    const all = sub.features.flatMap((f) => (f.ilkeller ?? []).map((p) => ({ f, p })));
    for (const { f, p } of all) {
      if (p.tur !== 'kaynak' || typeof p.id !== 'string') continue;
      const key = paketKaynakId(sub.id, p.id);
      const free = all.filter((x) => x.p.tur === 'buyuVer' && (x.p.bedava as { id?: string } | undefined)?.id === p.id)
        .flatMap((x) => (Array.isArray(x.p.buyular) ? x.p.buyular as string[] : []));
      table[key] = {
        name: typeof p.ad === 'string' ? p.ad : f.name.tr, feature: `${sub.class}/${sub.id}:${f.id}`,
        uses: usesOf(poolTiers(all, p.id) ?? p.sayi), recharge: rechargeOf(p.yenilenme), ...(free.length ? { freeSpells: free } : {}),
        // Kuyruk P12: sayaç kaynağı (güç deposu): başlangıç ve uzun dinlenme 1, kısa dinlenme 0'daysa 1.
        ...(p.yenilenme === 'depo' ? { depot: 1 } : {}),
        // Kuyruk E4c: kaynağı sayan zar havuzu varsa ikon üstünlük zarı (yalnız görünüm).
        ...(all.some((x) => x.p.tur === 'zarHavuzu' && (x.p.kaynak as { id?: string } | undefined)?.id === p.id) ? { icon: 'ustunluk-zari' } : {}),
      };
      registered.push(key);
    }
    // Kuyruk U1a: `ucus.kullanim` örtük kaynağı (dinlenme başına kullanım; anahtar `pk-<alt sınıf>-kullanim-<id>`).
    for (const { f, p } of all) {
      const k = kullanimKaynak(p);
      if (!k) continue;
      const key = paketKaynakId(sub.id, k.id);
      table[key] = { name: typeof p.ad === 'string' ? p.ad : f.name.tr, feature: `${sub.class}/${sub.id}:${f.id}`, uses: usesOf(k.sayi), recharge: rechargeOf(k.yenilenme) };
      registered.push(key);
    }
  }
}

/** Dış içerik alt sınıflarını uygular (kayıt + kaynaklar). */
export function applyPackSubclasses(list: SubclassDef[]): void {
  setExternalSubclasses(list);
  registerPackResources(list);
}
