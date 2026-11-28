/**
 * Görev KATALOG-GUC-TAM D: mühür taşı yuvaları (zırha/kalkana/cübbeye takılan artifact; `data/yuva-kurallari.json`).
 * Taş ayrı bir kapsayıcı değil: yuvaya takılınca etkisini yuvanın eşyasını giyene verir; yuvada olmayan (gevşek) taş etkisizdir.
 * - Konaklar: giyilen SRD zırhı (`$armor`) ve kalkanı (`$shield`): kademe 1 yuva; katalog zırhı/kalkanı/cübbesi (taşınan): 1 yuva,
 *   nadirlikte kademe 2; özel konaklar (Hex'in Paladin Zırhı, Koruyucu Ejderha Mührü): 10 yuva, yalnız Seviye 3.
 * - Taş kademesi ≤ yuva kademesi; Sv.1 cübbeye takılmaz (PDF); Sv.3 yalnız özel konaklarda.
 * - Etkiler: Sv.1 türüne sabit −3 (`k109.flatReduce`), Sv.2 eşya kaydının kendisi (`activeItemNames`'e girer: direnç + paket
 *   ekHasar), Sv.3 türüne bağışıklık; Hex'in zırhı 5+ taşta AC +1 ve fiziksel direnç, 10 taşta AC +2 ve fiziksel bağışıklık,
 *   Hükümdar Vuruşu (silah isabetine ilk taşın türünden 1d6 / 1d8 / 2d6).
 * Saf (React, DOM, localStorage yok).
 */
import data from '../../data/yuva-kurallari.json';
import { items } from '../data';

type Tier = 1 | 2 | 3;
interface Stone { kademe: Tier; tur: string; etki?: Record<string, unknown>; esya?: boolean }
interface Special { yuva: number; kademe: Tier; yalnizKademe?: Tier; kalici?: boolean; ruh?: boolean;
  kademeler?: Array<{ enAz: number; etki: Record<string, unknown> }>; vurus?: Array<{ enAz: number; zar: string }> }
const D = data as unknown as { konak: { kademe2Nadirlik: string[]; turler: Record<string, boolean>; cubbeYuvasi: string; cubbeEnAz: Tier; ozel: Record<string, Special> }; taslar: Record<string, Stone> };

export interface SocketHost { key: string; name: string; slots: number; tier: Tier; only?: Tier; robe?: boolean; permanent?: boolean }
type SheetLike = { itemNames: string[]; armorName?: string | null; shield?: boolean; yuvalar?: Record<string, string[]> };

export const stoneOf = (id: string): Stone | undefined => D.taslar[id];
export const isStone = (id: string): boolean => !!D.taslar[id];
export const STONE_IDS = Object.keys(D.taslar);
const itemById = (id: string) => items.find((i) => i.id === id);
const itemByName = (n: string) => items.find((i) => i.name === n);

/** Karakterin yuva taşıyan eşyaları. */
export function socketHosts(s: SheetLike): SocketHost[] {
  const out: SocketHost[] = [];
  if (s.armorName) out.push({ key: '$armor', name: s.armorName, slots: 1, tier: 1 });
  if (s.shield) out.push({ key: '$shield', name: 'Shield', slots: 1, tier: 1 });
  for (const n of s.itemNames) {
    const it = itemByName(n);
    const k = (it as { katalog?: { tur?: string; yuva?: string; nadirlik?: string } } | undefined)?.katalog;
    if (!it || !k) continue;
    const sp = D.konak.ozel[it.id];
    if (sp) { out.push({ key: it.id, name: it.name, slots: sp.yuva, tier: sp.kademe, ...(sp.yalnizKademe ? { only: sp.yalnizKademe } : {}), ...(sp.kalici ? { permanent: true } : {}) }); continue; }
    if (!k.tur || !D.konak.turler[k.tur]) continue;
    const tier: Tier = D.konak.kademe2Nadirlik.includes(k.nadirlik ?? '') ? 2 : 1;
    const robe = k.yuva === D.konak.cubbeYuvasi;
    if (robe && tier < D.konak.cubbeEnAz) continue;
    out.push({ key: it.id, name: it.name, slots: 1, tier, ...(robe ? { robe: true } : {}) });
  }
  return out;
}

/** Taş bu konağa takılabilir mi (sorun kodu ya da null). */
export function socketProblem(host: SocketHost, stoneId: string): 'tas' | 'kademe' | 'cubbe' | 'ozel' | null {
  const st = stoneOf(stoneId);
  if (!st) return 'tas';
  if (host.only && st.kademe !== host.only) return 'ozel';
  if (!host.only && st.kademe === 3) return 'ozel';
  if (st.kademe > host.tier) return 'kademe';
  if (host.robe && st.kademe === 1) return 'cubbe';
  return null;
}

/** Geçerli yuvalardaki taşlar (konak → taş kimlikleri); geçersiz, fazla ya da konağı olmayan taş düşer. */
export function socketedStones(s: SheetLike): Array<{ host: SocketHost; stones: string[] }> {
  const hosts = socketHosts(s);
  return hosts.map((h) => ({ host: h, stones: (s.yuvalar?.[h.key] ?? []).filter((id) => !socketProblem(h, id)).slice(0, h.slots) })).filter((x) => x.stones.length);
}

/** Yuvadaki taşların eşya adları (yalnız eşya kaydıyla etki veren Sv.2: `activeItemNames`'e eklenir). */
export function socketItemNames(s: SheetLike): string[] {
  return socketedStones(s).flatMap((x) => x.stones).filter((id) => stoneOf(id)?.esya).map((id) => itemById(id)?.name).filter((n): n is string => !!n);
}

/** Savaşçıya giden yuva etkileri (süren etki alanları) ve isabet ekleri. */
export function socketParts(s: SheetLike): { effects: Array<Record<string, unknown> & { id: string; name: string }>; hits: Array<{ label: string; dice: string; type: string }> } {
  const effects: Array<Record<string, unknown> & { id: string; name: string }> = [];
  const hits: Array<{ label: string; dice: string; type: string }> = [];
  for (const { host, stones } of socketedStones(s)) {
    for (const id of stones) {
      const st = stoneOf(id);
      if (st?.etki) effects.push({ ...st.etki, id: `yuva:${host.key}:${id}`, name: itemById(id)?.name ?? id });
    }
    const sp = D.konak.ozel[host.key];
    if (!sp) continue;
    const n = stones.length;
    const tier = [...(sp.kademeler ?? [])].filter((k) => n >= k.enAz).pop();
    if (tier) effects.push({ ...tier.etki, id: `yuva:${host.key}:kademe`, name: `${host.name} (${n} taş)` });
    const hit = [...(sp.vurus ?? [])].filter((k) => n >= k.enAz).pop();
    const type = stoneOf(stones[0] as string)?.tur;
    if (hit && type) hits.push({ label: `${host.name}: Hükümdar Vuruşu`, dice: hit.zar, type });
  }
  return { effects, hits };
}

/** Taşın takılabileceği konak türleri (Dungeondex "takılabilir" satırı). */
export function stoneHostKinds(stoneId: string): Array<'zirh' | 'kalkan' | 'cubbe' | 'ozel'> {
  const st = stoneOf(stoneId);
  if (!st) return [];
  if (st.kademe === 3) return ['ozel'];
  return st.kademe === 1 ? ['zirh', 'kalkan'] : ['zirh', 'kalkan', 'cubbe'];
}
/** Seviye 3 taşı kabul eden özel konakların eşya kimlikleri. */
export const specialHostIds = (): string[] => Object.keys(D.konak.ozel);
