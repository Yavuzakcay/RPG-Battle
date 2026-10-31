/**
 * Görev S2: oyuncunun nesneyle varsayılan etkileşimi (arayüz): kapı kilitliyse kilidi aç, kapalıysa aç, açıksa kapa;
 * masa devir; mangalı karşı yöndeki bitişik altıgene dök. Sandık ve fıçılarla etkileşim yok (saldırıyla kırılır).
 */
import { distance, neighbors, type Offset } from '../../rules/hex';
import { objectAttackCommand } from '../../battle/objects';
import { OBJECTS } from '../../battle/objectData';
import type { BattleState, Combatant, Command, MapObject } from '../../battle/types';

export function objectCommand(state: BattleState, actor: Combatant, obj: MapObject): Command | null {
  if (!actor.pos || distance(actor.pos, obj.at) > 1) return null;
  const base = { type: 'object_use' as const, actorId: actor.id, objectId: obj.id };
  if (obj.kind === 'chest' && !obj.carriedBy) return { ...base, action: 'take' };
  if (OBJECTS[obj.kind]?.door) return { ...base, action: obj.state === 'locked' ? 'unlock' : obj.state === 'open' ? 'close' : 'open' };
  if (obj.kind === 'table' && obj.state !== 'tipped') return { ...base, action: 'tip' };
  if (obj.kind === 'brazier' && obj.state !== 'tipped') {
    const size = { cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 };
    const away = neighbors(obj.at, size).sort((a, b) => distance(b, actor.pos as Offset) - distance(a, actor.pos as Offset))[0];
    return away ? { ...base, action: 'knock', to: away } : null;
  }
  return null;
}

/** Saldırıda nesneye vurulacak silah (motorla aynı seçim). */
export const objectAttack = objectAttackCommand;
