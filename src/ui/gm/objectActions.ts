/**
 * Görev S2: oyuncunun nesneyle varsayılan etkileşimi (arayüz): kapı kilitliyse kilidi aç, kapalıysa aç, açıksa kapa;
 * masa devir; mangalı karşı yöndeki bitişik altıgene dök. Sandık ve fıçılarla etkileşim yok (saldırıyla kırılır).
 */
import { distance, neighbors, type Offset } from '../../rules/hex';
import { objectAttackCommand } from '../../battle/objects';
import { OBJECTS } from '../../battle/objectData';
import { ruleOf } from '../../battle/maprules';
import { ballistaTarget } from '../../battle/highlands';

const hasBrazierLight = (s: BattleState) => !!ruleOf(s, 'brazierLight');
import type { BattleState, Combatant, Command, MapObject } from '../../battle/types';

export function objectCommand(state: BattleState, actor: Combatant, obj: MapObject): Command | null {
  if (!actor.pos || distance(actor.pos, obj.at) > 1) return null;
  const base = { type: 'object_use' as const, actorId: actor.id, objectId: obj.id };
  if (obj.kind === 'chest' && !obj.carriedBy) return { ...base, action: 'take' };
  if (OBJECTS[obj.kind]?.door) return { ...base, action: obj.state === 'locked' ? 'unlock' : obj.state === 'open' ? 'close' : 'open' };
  if (obj.kind === 'table' && obj.state !== 'tipped') return { ...base, action: 'tip' };
  if (obj.kind === 'lever' && obj.state !== 'tipped') return { ...base, action: 'pull' };
  // Görev K26: balista boşsa yükle, yüklüyse menzil ve görüşteki en yakın düşmana ateşle (motor `to` altıgenini alır).
  if (obj.kind === 'ballista') {
    if (obj.state === 'spent') return { ...base, action: 'load' };
    const to = ballistaTarget(state, actor, obj);
    return to ? { ...base, action: 'fire', to } : null;
  }
  // Kuyruk 24: Orman nesneleri (kural kapalıysa motor gerekçeyle reddeder): gözü çöz, çadırı tutuştur, ağacı devir, yığını dağıt.
  if (obj.kind === 'statueEye' && obj.state !== 'open') return { ...base, action: 'solve' };
  if (obj.kind === 'tent' && obj.state !== 'burning') return { ...base, action: 'ignite' };
  if (obj.kind === 'tree') return { ...base, action: 'fell' };
  if (obj.kind === 'bonePile') return { ...base, action: 'scatter' };
  // Kuyruk 29 K28b: plakayı oku, kaya yığınını yuvarla, kazanı söndür, (ışık veren) mangalı söndür.
  if (obj.kind === 'plaque' && obj.state !== 'read') return { ...base, action: 'read' };
  if (obj.kind === 'boulderPile') return { ...base, action: 'roll' };
  if (obj.kind === 'cauldron' && obj.state !== 'out') return { ...base, action: 'douse' };
  if (obj.kind === 'brazier' && obj.state !== 'out' && state.map?.variantId && hasBrazierLight(state)) return { ...base, action: 'douse' };
  if (obj.kind === 'brazier' && obj.state !== 'tipped') {
    const size = { cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 };
    const away = neighbors(obj.at, size).sort((a, b) => distance(b, actor.pos as Offset) - distance(a, actor.pos as Offset))[0];
    return away ? { ...base, action: 'knock', to: away } : null;
  }
  return null;
}

/** Saldırıda nesneye vurulacak silah (motorla aynı seçim). */
export const objectAttack = objectAttackCommand;
