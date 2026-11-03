/**
 * Kuyruk 18 H2: Polymorph (SRD 5.2.1). Hedef bir Beast'e dönüşür: biçimin CR'si hedefin CR'sini (canavar) ya da
 * seviyesini (oyuncu) aşamaz; oyun değerleri biçiminkiyle değişir (Wild Shape'in `shape_changed` olayı; canavarda
 * saldırılar ve Multiattack da), biçimin HP'si kadar geçici HP. Geçici HP bitince ya da konsantrasyon düşünce asıl
 * hâline döner (`shapeCleanup`). Biçim seçimi `choice` (Beast kimliği); verilmezse düşmana en zayıf (en az HP), dosta
 * sınır içindeki en güçlü (CR, sonra HP) Beast.
 */
import creatureTypes from '../../data/canavar-turleri.json';
import { monsters, type Monster } from '../data';
import { combatantFromMonster } from './create';
import { shapeStats } from './druid';
import type { BattleEvent, BattleState, Combatant } from './types';

const TYPES = creatureTypes.types as Record<string, string>;
const crValue = (cr: string | number): number => (typeof cr === 'number' ? cr : cr.includes('/') ? Number(cr.split('/')[0]) / Number(cr.split('/')[1]) : Number(cr));

/** Hedefin alabileceği Beast biçimleri (CR sınırı). */
export function polymorphForms(target: Combatant): Monster[] {
  const limit = target.monsterId ? crValue(monsters.find((m) => m.id === target.monsterId)?.cr ?? 0) : target.level;
  return monsters.filter((m) => TYPES[m.id] === 'beast' && crValue(m.cr) <= limit);
}

export function polymorphForm(caster: Combatant, target: Combatant, choice?: string): Monster | undefined {
  const forms = polymorphForms(target);
  const chosen = choice ? forms.find((m) => m.id === choice) : undefined;
  if (chosen) return chosen;
  const hostile = target.side !== caster.side;
  return [...forms].sort((a, b) => (hostile ? a.hp - b.hp : crValue(b.cr) - crValue(a.cr) || b.hp - a.hp) || a.id.localeCompare(b.id))[0];
}

export function polymorphEvents(state: BattleState, caster: Combatant, target: Combatant, choice?: string): BattleEvent[] {
  const m = polymorphForm(caster, target, choice);
  if (!m) return [];
  // Kuyruk 19 (Golem Immutable Form; srdK19): şekil değiştirmez.
  if (target.traits?.includes('immutable-form')) return [{ type: 'map_note', text: `${target.name}: Immutable Form (şekil değiştirmez).` }];
  const beast = combatantFromMonster(m, { id: `${target.id}:poly`, name: m.name });
  const base = target.shape ? { ...target, ...target.shape.prev } : target;
  const stats = { ...shapeStats(m, base), polymorph: true, attacks: beast.attacks, multiattack: beast.multiattack };
  void state;
  return [{ type: 'shape_changed', actorId: target.id, stats }, { type: 'temp_hp', targetId: target.id, amount: m.hp, label: `Polymorph (${m.name})` }];
}
