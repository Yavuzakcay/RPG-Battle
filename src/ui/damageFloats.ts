/**
 * Tur başı/sonu durum ve zemin hasarı animasyonu (yalnızca arayüz). Olay günlüğündeki yeni olaylardan
 * hangi jetonun ne kadar ve hangi türde hasar aldığını çıkarır; motor mantığına dokunmaz.
 * Kaynaklar: `map_effect` hasarı (Burning, lav kenarı, batak zehri, alev, sıcak, soğuk…) ve
 * yayılım save'i (`save_resolved` + `aura`, Spirit Guardians).
 */
import type { BattleEvent, Combatant } from '../battle/types';

export type FloatKind = 'fire' | 'poison' | 'cold' | 'acid' | 'hit';

export const kindOf = (damageType: string): FloatKind =>
  damageType === 'fire' ? 'fire' : damageType === 'poison' ? 'poison' : damageType === 'cold' ? 'cold' : damageType === 'acid' ? 'acid' : 'hit';

export const FLOAT_ICON: Record<FloatKind, string> = { fire: '🔥', poison: '☠', cold: '❄', acid: '💧', hit: '' };

export interface DamageHit { targetId: string; amount: number; kind: FloatKind }

/** Olaylardaki durum/zemin hasarları, sırasıyla. */
export function damageHits(events: BattleEvent[]): DamageHit[] {
  const out: DamageHit[] = [];
  for (const e of events) {
    if (e.type === 'map_effect' && e.damage && e.damage.applied > 0) out.push({ targetId: e.targetId, amount: e.damage.applied, kind: kindOf(e.damage.type) });
    if (e.type === 'save_resolved' && e.aura && e.appliedDamage > 0) out.push({ targetId: e.targetId, amount: e.appliedDamage, kind: kindOf(e.damageType) });
  }
  return out;
}

/** Aynı anda birden çok hasar: üst üste binmesin diye sırayla gecikme (ms). */
export const FLOAT_STAGGER_MS = 220;
export const FLOAT_MS = 950;

/** Süren durumların jetondaki kalıcı simgeleri (yanıyor, zehirli). */
export function statusIcons(c: Pick<Combatant, 'conditions' | 'mapStatus'>): Array<{ key: string; icon: string; title: string }> {
  const out: Array<{ key: string; icon: string; title: string }> = [];
  if (c.conditions.includes('Burning')) out.push({ key: 'burning', icon: '🔥', title: 'Yanıyor' });
  if (c.conditions.includes('Poisoned') || c.mapStatus.lingeringPoison) out.push({ key: 'poison', icon: '☠', title: 'Zehirli' });
  if (c.conditions.includes('Frozen')) out.push({ key: 'frozen', icon: '❄', title: 'Donmuş' });
  return out;
}
