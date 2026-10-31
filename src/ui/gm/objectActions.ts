/**
 * Görev S2: oyuncunun nesneyle varsayılan etkileşimi (arayüz): kapı kilitliyse kilidi aç, kapalıysa aç, açıksa kapa;
 * masa devir; mangalı karşı yöndeki bitişik altıgene dök. Sandık ve fıçılarla etkileşim yok (saldırıyla kırılır).
 */
import { distance, neighbors, type Offset } from '../../rules/hex';
import type { BattleState, Combatant, Command, MapObject } from '../../battle/types';

export function objectCommand(state: BattleState, actor: Combatant, obj: MapObject): Command | null {
  if (!actor.pos || distance(actor.pos, obj.at) > 1) return null;
  const base = { type: 'object_use' as const, actorId: actor.id, objectId: obj.id };
  if (obj.kind === 'door') return { ...base, action: obj.state === 'locked' ? 'unlock' : obj.state === 'open' ? 'close' : 'open' };
  if (obj.kind === 'table' && obj.state !== 'tipped') return { ...base, action: 'tip' };
  if (obj.kind === 'brazier' && obj.state !== 'tipped') {
    const size = { cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 };
    const away = neighbors(obj.at, size).sort((a, b) => distance(b, actor.pos as Offset) - distance(a, actor.pos as Offset))[0];
    return away ? { ...base, action: 'knock', to: away } : null;
  }
  return null;
}

/** Saldırıda nesneye vurulacak silah: menzildeki ilk silah seçeneği (yakın dövüşte bitişik, menzillide uzun menzil). */
export function objectAttack(actor: Combatant, obj: MapObject): Command | null {
  if (!actor.pos) return null;
  const d = distance(actor.pos, obj.at) * 5;
  const option = actor.weaponOptions.find((o) => (o.ranged ? d <= (o.range?.[1] ?? 0) : d <= (o.reachFt ?? 5)));
  return option ? { type: 'attack_object', actorId: actor.id, objectId: obj.id, option } : null;
}
