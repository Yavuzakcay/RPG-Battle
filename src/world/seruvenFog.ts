/**
 * K46: Serüven keşif sisi (`SeruvenState.kesif`, base64 bit ızgarası). Saf; `reduceSeruven` her olaydan sonra çağırır,
 * böylece kayıt ve replay aynı sisi verir. Alan yoksa (eski kayıt) başlangıç durumu. Kural sürümüne ve savaşa bağlı değil.
 * - Başlangıç: ırk yurdu bölgesinin (ya da ırka göre başlangıç sayfasının) merkezi çevresinde `baslangicYaricap`.
 * - Düğümler arası yürüyüş: yol boyunca `yolculukYaricap`; sayfa geçişi (kapı/köprü): iki uçta `gecitYaricap`
 *   (komşuluk grafındaki geçit kapıları dahil); gizli geçitten geçiş: iki kapıda `gecitYaricap`.
 * - Yerleşime giriş: `yerlesimYaricap`. Ada bayrağı gelince bütün ada poligonu.
 */
import seruvenData from '../../data/seruven.json';
import type { SeruvenState } from '../journey/seruven';
import { decodeFog, encodeFog, revealCircle, revealPath, unlockIslands, type Fog } from './fog';
import { FOG_RULES, HIDDEN_PASSES, PASSES, nodeWorld, pageRegion, raceRegion, regionCenter, type Pt } from './worldData';

interface PageLite { id: string; entry?: { x: number; y: number }; exit?: { x: number; y: number }; nodes: Array<{ id: string; x: number; y: number }> }
const PAGES = (seruvenData as unknown as { pages: PageLite[] }).pages;

/** Partinin Serüven sayfasındaki konumu (dünya pikseli): düğüm, sayfa girişi ya da çıkışı. */
export function partyWorld(page: string, at: string): Pt | null {
  const p = PAGES.find((x) => x.id === page);
  if (!p) return null;
  const n = p.nodes.find((x) => x.id === at);
  if (n) return nodeWorld(page, n.id, n.x, n.y);
  const edge = at === 'cikis' ? p.exit : p.entry;
  return nodeWorld(page, `__${at}`, edge?.x ?? 0.5, edge?.y ?? 0.5);
}

/** Yurt bölgesi: ırka göre başlangıç sayfası varsa onun bölgesi, yoksa ilk üyenin ırkı, o da yoksa bulunulan sayfa. */
function homeCenter(s: SeruvenState): Pt | null {
  const fromPage = s.startPage ? pageRegion(s.startPage) : undefined;
  const race = s.party[0]?.sheet.raceId;
  const region = fromPage ?? (race ? raceRegion(race) : undefined) ?? pageRegion(s.page);
  return (region ? regionCenter(region) : null) ?? partyWorld(s.page, s.at);
}

/** Başlangıç sisi. */
export function startFog(s: SeruvenState): Fog {
  let fog = new Uint8Array(FOG_RULES.izgara[0] * FOG_RULES.izgara[1]) as Fog;
  const home = homeCenter(s);
  if (home) fog = revealCircle(fog, home, FOG_RULES.baslangicYaricap, s.flags);
  const here = partyWorld(s.page, s.at);
  if (here) fog = revealCircle(fog, here, FOG_RULES.yolculukYaricap, s.flags);
  return unlockIslands(fog, s.flags);
}

/** Durumun sisi (kayıtta yoksa başlangıç). */
export const seruvenFog = (s: SeruvenState): Fog => (s.kesif ? decodeFog(s.kesif) : null) ?? startFog(s);

/** Olaydan sonra sisi günceller (`kesif` alanı); değişiklik yoksa durumu aynen döner. */
export function withFog(prev: SeruvenState | null, next: SeruvenState | null, linkCrossed = false): SeruvenState | null {
  if (!next) return next;
  // Başlangıç: olayın durumunda sis varsa (kayıt) aynen, yoksa hesaplanır.
  if (!prev) return next.kesif && decodeFog(next.kesif) ? next : { ...next, kesif: encodeFog(startFog(next)) };
  let fog = seruvenFog(prev);
  const before = prev.kesif ? fog : null;
  const flags = next.flags;
  if (prev.page !== next.page || prev.at !== next.at) {
    const a = partyWorld(prev.page, prev.at), b = partyWorld(next.page, next.at);
    if (prev.page === next.page) {
      if (a && b) fog = revealPath(fog, [a, b], FOG_RULES.yolculukYaricap, flags);
      else if (b) fog = revealCircle(fog, b, FOG_RULES.yolculukYaricap, flags);
    } else {
      const ra = pageRegion(prev.page), rb = pageRegion(next.page);
      const hidden = linkCrossed ? HIDDEN_PASSES.find((h) => (h.a === ra && h.b === rb) || (h.a === rb && h.b === ra)) : undefined;
      const pass = PASSES.find((p) => (p.a === ra && p.b === rb) || (p.a === rb && p.b === ra));
      const gates: Pt[] = [...(hidden ? [hidden.kapi_a, hidden.kapi_b] : []), ...(!hidden && pass ? [pass.kapi_a, pass.kapi_b] : []), ...(a ? [a] : []), ...(b ? [b] : [])];
      for (const g of gates) fog = revealCircle(fog, g, FOG_RULES.gecitYaricap, flags);
    }
  }
  if (next.yerlesim && !prev.yerlesim) {
    const here = partyWorld(next.page, next.at);
    if (here) fog = revealCircle(fog, here, FOG_RULES.yerlesimYaricap, flags);
  }
  if (flags.length !== prev.flags.length) fog = unlockIslands(fog, flags);
  const enc = encodeFog(fog);
  if (before && enc === prev.kesif && next.kesif === prev.kesif) return next;
  return { ...next, kesif: enc };
}
