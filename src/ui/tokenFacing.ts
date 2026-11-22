/**
 * Kuyruk K75b: jeton yönü (yalnız görünüm). Sprite'lar sağa bakar; jeton en yakın canlı karşı taraf
 * yaratığına dönük çizilir (karşı taraf solundaysa figür aynalanır). Parti ve düşman aynı işlevi kullanır.
 * Saf: olay, durum, kayıt ve replay etkilenmez.
 */
import { distance, type Offset } from '../rules/hex';
import type { Combatant } from '../battle/types';
import { hexCenter } from './mapView';

/**
 * `true` = sola bakar (aynalanır). Karşı taraf: parti için düşmanlar, düşman için parti (sivil olanlar hedef değil).
 * Eşit uzaklıkta farklı yönlerde iki yaratık ya da aynı sütunda hedef varsa `prev` korunur (titreme yok);
 * karşı taraf yoksa `prev`, o da yoksa harita ortasına göre (sağ yarıdaki sola bakar).
 */
export function facesLeft(combatants: Record<string, Combatant>, c: Combatant, worldW: number, prev?: boolean): boolean {
  if (!c.pos) return prev ?? false;
  const me = hexCenter(c.pos);
  const foeSide = c.side === 'party' ? 'enemies' : 'party';
  const foes = Object.values(combatants).filter((x) => x.side === foeSide && !x.civilian && x.pos && x.hp > 0);
  if (foes.length === 0) return prev ?? me.x > worldW / 2;
  let best = Infinity;
  for (const f of foes) best = Math.min(best, distance(f.pos as Offset, c.pos));
  const dirs = new Set<number>();
  for (const f of foes) if (distance(f.pos as Offset, c.pos) === best) dirs.add(Math.sign(hexCenter(f.pos as Offset).x - me.x));
  if (dirs.size === 1) {
    const d = [...dirs][0] as number;
    if (d < 0) return true;
    if (d > 0) return false;
  }
  return prev ?? me.x > worldW / 2;
}
