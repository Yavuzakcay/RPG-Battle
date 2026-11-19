/**
 * Serüven 6–20 seviye düşman seçimi (2026-11-19; kullanıcı görevi, denge turu öncesi). Saf; zar tohumdan.
 * Eskiden senaryonun o seviyeye özel listesi yoksa 5. seviye listesi kullanılıyordu (`enemiesAt`). Şimdi 6+ seviyede:
 *   1. `liste`: senaryonun tam bu seviyedeki el yazması listesi (`data/sim-senaryolar.json` `enemies.<seviye>`);
 *   2. `altListe`: en yakın ALT 6+ seviye listesi (8 → 7, 12 → 11; 5. seviyeye inmez);
 *   3. `uretec`: yalnız sıradan düğümde (özel değil) ve haritanın ortam havuzu boş değilse bölge karşılaşma üreteci
 *      (`regionEncounter`, `data/bolge-karsilasma.json`: SRD XP bütçesi parti seviyesine göre, lider CR ≤ seviye, en çok 6);
 *   4. `bes`: hiçbiri yoksa eski davranış (5. seviye listesi).
 * Özel savaşlar (sefer düğümleri, boss, Hapishane, Büyük suç, koridor) üreteç almaz: el yazması/alt liste ya da 5. seviye.
 * 1–5. seviye aynen (`enemiesAt`). Savaş kuralı değil: GM anahtarı ve kural sürümü yok; savaşa giren düşmanlar savaş
 * kaydında yazılı olduğundan kayıtlı savaş eski listesiyle sürer.
 */
import { DEFAULT_LEVEL, enemiesAt, type Scenario } from '../sim/balance';
import { regionEncounter, regionMonsters, type Region } from './encounter';
import { seededRng } from '../rules/dice';

export type EnemySource = 'liste' | 'altListe' | 'uretec' | 'bes';
export interface EnemyPlan { enemies: Record<string, number>; kaynak: EnemySource; /** `liste`/`altListe`: kullanılan listenin seviyesi. */ seviye?: number }

/** 6+ seviyede kullanılabilecek el yazması liste: tam seviye ya da en yakın alt 6+ seviye. */
export function lowerList(sc: Scenario, level: number): { level: number; enemies: Record<string, number> } | null {
  const lv = Object.keys(sc.byLevel ?? {}).map(Number).filter((l) => l > DEFAULT_LEVEL && l <= level).sort((a, b) => b - a)[0];
  return lv !== undefined && sc.byLevel?.[lv] ? { level: lv, enemies: sc.byLevel[lv] } : null;
}

/** Senaryonun haritasından sözde bölge (üreteç için; ortam havuzu haritanın kimliğiyle). */
export const scenarioRegion = (sc: Scenario): Region | null =>
  sc.map ? { id: sc.id, ad: { tr: sc.name, en: sc.name }, harita: { mapId: sc.map.mapId, variantId: sc.map.variantId }, carpan: 1 } : null;

/** Tohum dizgisinden 32 bit sayı (FNV-1a). */
export function seedOf(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}

/**
 * Düğümün düşman planı. `ozel`: özel savaş (üreteç yok). `partySize`: üreteç bütçesi için savaşabilen üye sayısı.
 * `seed`: aynı Serüven durumunda aynı listeyi verecek tohum dizgisi (kurulum ve sonuç XP'si aynı liste).
 */
export function seruvenEnemyPlan(sc: Scenario, level: number, opts: { ozel: boolean; partySize: number; seed: string }): EnemyPlan {
  if (level <= DEFAULT_LEVEL) return { enemies: enemiesAt(sc, level), kaynak: sc.byLevel?.[level] || level === DEFAULT_LEVEL ? 'liste' : 'bes' };
  const low = lowerList(sc, level);
  if (low) return { enemies: low.enemies, kaynak: low.level === level ? 'liste' : 'altListe', seviye: low.level };
  const region = opts.ozel ? null : scenarioRegion(sc);
  if (region && regionMonsters(region).length > 0) {
    const e = regionEncounter(region, Array.from({ length: Math.max(1, opts.partySize) }, () => level), seededRng(seedOf(opts.seed)));
    if (Object.keys(e.enemies).length > 0) return { enemies: e.enemies, kaynak: 'uretec' };
  }
  return { enemies: sc.enemies, kaynak: 'bes', seviye: DEFAULT_LEVEL };
}
