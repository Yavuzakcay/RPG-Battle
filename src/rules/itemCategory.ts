/**
 * Kuyruk K49 B6: oluşturucuda eşya kategorileri (yalnızca görünüm; eşya verisi, sayılar ve fiyatlar aynı). Tür SRD
 * kaydından (`srd: "magic-items:…"` → SRD büyülü eşya türü; `gear:…` → donanım), etki seviyesi SRD nadirliğinden
 * (donanım sıradan). Tablolar `data/esya-kategori.json` (`srd` alanı `node scripts/esya-kategori.mjs`). Saf.
 */
import cat from '../../data/esya-kategori.json';
import type { Item } from '../data';

export type ItemKind = 'silah' | 'zirh' | 'kalkan' | 'tuketilebilir' | 'aksesuar' | 'sihirli' | 'arac';
export type ItemTier = 'siradan' | 'olagandisi' | 'nadir' | 'cokNadir' | 'efsanevi';
export const ITEM_KINDS = cat.turler as ItemKind[];
export const ITEM_TIERS = cat.seviyeler as ItemTier[];

const SRD = cat.srd as Record<string, string[]>;
const has = (name: string, words: string[]) => words.some((w) => name.toLowerCase().includes(w.toLowerCase()));
const srdOf = (it: Pick<Item, 'srd'>) => { if (!it.srd) return undefined; const [file, id] = it.srd.split(':'); return file === 'magic-items' ? SRD[id ?? ''] ?? ['Wondrous', 'Uncommon'] : undefined; };
/** Görev KATALOG-1: özgün katalog eşyasının etki seviyesi; Yadigâr (Artifact) görünümde Efsanevi kademesinde. */
const KATALOG_TIER: Record<string, ItemTier> = { olagandisi: 'olagandisi', nadir: 'nadir', cokNadir: 'cokNadir', efsanevi: 'efsanevi', yadigar: 'efsanevi' };

export function itemKind(it: Pick<Item, 'srd' | 'name' | 'use'> & Partial<Pick<Item, 'katalog'>>): ItemKind {
  // Görev KATALOG-1: özgün eşyanın türü PDF'ten (SRD kaydı yok).
  if (it.katalog) return it.katalog.tur;
  const m = srdOf(it);
  if (!m) return it.use || has(it.name, cat.tuketilebilirSozcukleri) ? 'tuketilebilir' : 'arac';
  const map = cat.turEsleme as Record<string, ItemKind>;
  if (m[0] === 'Wondrous') return it.use ? 'tuketilebilir' : has(it.name, cat.aksesuarSozcukleri) ? 'aksesuar' : 'sihirli';
  return map[m[0] ?? ''] ?? 'sihirli';
}

export function itemTier(it: Pick<Item, 'srd'> & Partial<Pick<Item, 'katalog'>>): ItemTier {
  if (it.katalog) return KATALOG_TIER[it.katalog.nadirlik] ?? 'olagandisi';
  const m = srdOf(it);
  return m ? (cat.nadirlik as Record<string, ItemTier>)[m[1] ?? ''] ?? 'olagandisi' : 'siradan';
}
