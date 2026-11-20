/**
 * Görev SWARM95 (yalnız görünüm): sürü jetonunun parçacık planı ve paylaşılan altıgende jeton kayması. Mekaniğe, kural
 * sürümüne ve olay günlüğüne girmez. Veri `data/suru-parcacik.json`; çizim tembel `SwarmMotes.tsx`.
 */
import data from '../../data/suru-parcacik.json';
import { formMonsterId } from '../battle/shapeMonsterCore';
import { isSwarm } from '../battle/swarmShare';
import type { Combatant } from '../battle/types';

export type MoteKind = 'kanat' | 'bocek' | 'kemirgen' | 'balik';
export interface SwarmMote { id: string; x: number; y: number; r: number; kind: MoteKind; animated: boolean }

const TURLER = data.turler as Record<string, MoteKind>;

/** Sürünün parçacık türü (sürü değilse null): biçim/canavar kimliğinden, yoksa SRD Swarm etkisinden. */
export function swarmKind(c: Pick<Combatant, 'monsterId' | 'shape' | 'effects'>): MoteKind | null {
  const id = formMonsterId(c);
  if (id && TURLER[id]) return TURLER[id] as MoteKind;
  return isSwarm(c) ? (data.varsayilan as MoteKind) : null;
}

/**
 * Çizilecek parçacık grupları. Efekt ayarı kapalıysa hiç; hareketi azaltta hepsi sabit; animasyonlu olanlar `budget`
 * (ekrandaki animasyon sınırının kalanı) kadar, gerisi sabit.
 */
export function planMotes(items: Array<Omit<SwarmMote, 'animated'>>, opts: { enabled: boolean; reduceMotion: boolean; budget: number }): SwarmMote[] {
  if (!opts.enabled) return [];
  let left = opts.reduceMotion ? 0 : Math.max(0, opts.budget);
  return items.map((m) => { const animated = left > 0; if (animated) left--; return { ...m, animated }; });
}

/** Paylaşılan altıgendeki sürü jetonunun kayması (jeton yarıçapına oranla) ve ölçeği. */
export const SHARE_SHIFT = data.paylasimKaydir as { x: number; y: number; olcek: number };
export const MOTE_DATA = data as unknown as { sayi: number; halka: [number, number]; turSn: [number, number]; renk: Record<MoteKind, string> };
