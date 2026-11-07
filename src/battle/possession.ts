/**
 * Kuyruk K64a (kural sürümü 48; Game Master anahtarı `possession`): ele geçirme (SRD 5.2.1 Ghost Possession).
 * Veri `data/ele-gecirme.json` (canavar kimliği → saldırı adı, türler, menzil, bırakma, fiziksel değerler).
 *
 * - Başlangıç (`possessed`): hedef CHA save'i kaçırırsa bedene `possessed` etkisi (Incapacitated verir; beden
 *   ele geçirenin elinde: `controlConditions`), ele geçiren haritadan çekilir (`offFloor: 'beden'`, `possessing`).
 *   Bedenin değerleri `shape_changed` (`possession: true`): ele geçirenin saldırıları, Multiattack'ı, INT/WIS/CHA'sı;
 *   ev sahibinin hızı, STR/DEX/CON'u, AC'si, HP'si ve hasar profili (kullanıcı kararı 2).
 * - Taraf: `syncAllegiance` (`allegiance.ts`) bedeni ele geçirenin tarafına/sahibine geçirir; Dominate'ten baskın.
 * - Bitiş (`possession_ended`): beden 0 HP, ele geçiren düştü/yok, "Bedeni bırak" (bonus eylem), Dispel Evil and
 *   Good Break Enchantment, Game Master. Ele geçiren ev sahibinin 5 ft içinde boş altıgende belirir (olayda; replay
 *   aynı), ev sahibi ona savaş sonuna dek bağışık (`possessionImmune`).
 * - Protection from Evil and Good: korunan, korunan türlerce ele geçirilemez; zaten ele geçirilmişse SRD'nin "yeni
 *   save"ine avantaj verir, Ghost Possession'da yeni save olmadığı için etkisi yoktur (kendiliğinden bitiş yok).
 */
import data from '../../data/ele-gecirme.json';
import { monsters } from '../data';
import { distance, ring, type Offset } from '../rules/hex';
import { fail, finish, type CommandResult } from './common';
import { shapeStats } from './druid';
import { pfegTypesOf } from './mind';
import { occupantAt, placeProblem } from './movement';
import { POSSESS_FLOOR, possessedEffect } from './possessionCore';
import { globalRule } from './ruleControl';
import { sightConditions } from './sight';
import type { BattleEvent, BattleState, Combatant, CommandContext, ShapeStats } from './types';

export { POSSESS_FLOOR, possessedEffect, controlConditions, isPossessedBody } from './possessionCore';

export interface PossessSpec {
  attack: string;
  types: string[];
  reachFt: number;
  leave: 'bonus';
  appearFt: number;
  physical: Array<'str' | 'dex' | 'con'>;
  untilRounds: number;
}
const SPECS = data as unknown as Record<string, PossessSpec>;

/** Kuyruk K64a: ele geçirme açık mı (sürüm 48+ ve Game Master anahtarı). */
export const possessionOn = (state: Pick<BattleState, 'map' | 'kuralSurumu'>): boolean => !!globalRule(state, 'possession');

/** Canavarın ele geçirme kuralı (saldırı adı verilirse yalnızca o saldırı). */
export function possessSpecOf(state: Pick<BattleState, 'map' | 'kuralSurumu'>, actor: Combatant, attackName?: string): PossessSpec | undefined {
  if (!actor.monsterId || !possessionOn(state)) return undefined;
  const s = SPECS[actor.monsterId];
  if (!s || typeof s !== 'object' || (attackName !== undefined && s.attack !== attackName)) return undefined;
  return s;
}

/** Korunan, ele geçirenin türünden korunuyor mu (Protection from Evil and Good; konsantrasyon hedefi). */
export function possessionWarded(state: BattleState, hostId: string, possessorId: string): boolean {
  const type = state.combatants[possessorId]?.creatureType;
  if (!type || !pfegTypesOf().includes(type)) return false;
  return Object.values(state.combatants).some((c) => c.concentration?.spell === 'Protection from Evil and Good' && c.concentration.targetId === hostId);
}

/** Ele geçirme engeli (save'den önce; olaysız red) ya da null. */
export function possessionProblem(state: BattleState, actor: Combatant, target: Combatant, spec: PossessSpec): string | null {
  if (actor.possessing || possessedEffect(actor)) return `${actor.name} zaten bir bedende.`;
  if (target.id === actor.id || !actor.pos || !target.pos || target.hp <= 0 || target.offFloor) return 'Hedef ayakta değil.';
  if (!spec.types.includes(target.creatureType ?? 'humanoid') || target.shape) return `${target.name}: yalnızca ${spec.types.join('/')} ele geçirilebilir.`;
  if (distance(actor.pos, target.pos) * 5 > spec.reachFt) return `${target.name}: ${spec.reachFt} ft içinde olmalı.`;
  const sc = sightConditions(actor, target, state);
  if (sc.targetConditions.includes('Invisible') || sc.attackerConditions.includes('Blinded')) return `${actor.name} ${target.name} hedefini görmüyor.`;
  if (target.possessionImmune?.includes(actor.id)) return `${target.name} bu ele geçirmeye bağışık (savaş sonuna dek).`;
  if (possessedEffect(target)) return `${target.name} zaten ele geçirilmiş.`;
  if (possessionWarded(state, target.id, actor.id)) return `${target.name} Protection from Evil and Good ile korunuyor: ele geçirilemez.`;
  return null;
}

/** Bedenin değerleri: ele geçirenin saldırıları ve zihinsel değerleri; ev sahibinin hızı, fiziksel değerleri, AC'si. */
export function possessionStats(ghost: Combatant, host: Combatant, spec: PossessSpec): ShapeStats {
  const m = monsters.find((x) => x.id === ghost.monsterId);
  const base = m ? shapeStats(m, host) : null;
  const phys = Object.fromEntries(spec.physical.map((k) => [k, host.modifiers[k]])) as Partial<Combatant['modifiers']>;
  return {
    form: ghost.monsterId ?? ghost.id, name: ghost.name, ac: host.ac, speed: host.speed, fly: host.fly, size: host.size,
    modifiers: { ...ghost.modifiers, ...phys }, saves: { ...ghost.saves, ...phys },
    weaponOptions: base?.weaponOptions ?? [], attacksPerAction: base?.attacksPerAction ?? 1, avatar: host.avatar,
    attacks: ghost.attacks.filter((a) => a.name !== spec.attack && !a.recharge), multiattack: !!ghost.multiattack, possession: true,
  };
}

/** Başarısız save: ele geçirme başlar. */
export function possessionStartEvents(state: BattleState, actor: Combatant, target: Combatant, spec: PossessSpec, label: string): BattleEvent[] {
  return [
    { type: 'possessed', possessorId: actor.id, hostId: target.id, label, incap: !target.conditions.includes('Incapacitated'), until: state.round + spec.untilRounds },
    { type: 'shape_changed', actorId: target.id, stats: possessionStats(actor, target, spec) },
  ];
}

/** Ele geçirenin belireceği boş altıgen: ev sahibinin 5 ft içinde; yoksa en yakın boş altıgen (deterministik sıra). */
export function appearSpot(state: BattleState, center: Offset): Offset | null {
  const size = { cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 };
  for (let r = 1; r <= Math.max(size.cols, size.rows); r++) {
    const spot = ring(center, r, size).filter((h) => !placeProblem(state, h) && !occupantAt(state, h))
      .sort((a, b) => a.row - b.row || a.col - b.col)[0];
    if (spot) return spot;
  }
  return null;
}

/** Ele geçirmenin bitiş olayları (biçim geri döner, ele geçiren belirir). */
export function possessionEndEvents(state: BattleState, host: Combatant, reason: Extract<BattleEvent, { type: 'possession_ended' }>['reason'], label: string): BattleEvent[] {
  const eff = possessedEffect(host);
  const ghostId = eff?.sourceId ?? Object.values(state.combatants).find((c) => c.possessing === host.id)?.id;
  if (!ghostId) return [];
  const g = state.combatants[ghostId];
  const center = host.pos ?? g?.floorPos ?? null;
  const to = center ? appearSpot(state, center) : null;
  return [
    ...(host.shape?.possession ? [{ type: 'shape_changed', actorId: host.id, stats: null, reason: label } as BattleEvent] : []),
    { type: 'possession_ended', possessorId: ghostId, hostId: host.id, reason, to, label },
  ];
}

/** Her komutun sonunda: biten ele geçirmeler (beden 0 HP, ele geçiren yok/düştü, bağ kopmuş). */
export function possessionCleanup(state: BattleState): BattleEvent[] {
  const out: BattleEvent[] = [];
  for (const h of Object.values(state.combatants)) {
    const eff = possessedEffect(h);
    if (!eff) continue;
    const g = state.combatants[eff.sourceId];
    const reason = h.hp <= 0 || h.life === 'dead' ? 'hp0' : !g || g.hp <= 0 || g.life === 'dead' || g.possessing !== h.id ? 'gone' : null;
    if (reason) out.push(...possessionEndEvents(state, h, reason, eff.name));
  }
  // Etkisi başka bir yoldan kalkmış beden: ele geçiren yine de belirir.
  for (const g of Object.values(state.combatants)) {
    if (!g.possessing) continue;
    const h = state.combatants[g.possessing];
    if (h && possessedEffect(h)?.sourceId === g.id) continue;
    const center = h?.pos ?? g.floorPos ?? null;
    out.push({ type: 'possession_ended', possessorId: g.id, hostId: g.possessing, reason: 'gone', to: center ? appearSpot(state, center) : null, label: g.name });
  }
  return out;
}

/** Bedende izin verilen komutlar (ev sahibinin büyüleri, özellikleri, eşyaları ve tepkileri yok). */
export const BODY_COMMANDS: readonly string[] = ['end_turn', 'possession_leave', 'attack', 'monster_attack', 'multiattack', 'move', 'jump', 'climb',
  'change_height', 'stand_up', 'shift_move', 'vertical_move', 'explore_move', 'hide', 'dash', 'disengage', 'search', 'dodge', 'help', 'grapple',
  'shove', 'escape', 'escape_grapple', 'attack_object', 'attack_gate', 'object_use', 'drop_item', 'pick_up', 'pull', 'gate'];

/** Komut bedende ya da ele geçirende yapılabilir mi (hata metni ya da null). */
export function possessionCommandProblem(actor: Combatant, type: string): string | null {
  if (actor.possessing) return type === 'end_turn' || type === 'possession_leave' ? null : `${actor.name} bir bedende: yalnızca bedeni bırakabilir.`;
  if (possessedEffect(actor) && !BODY_COMMANDS.includes(type)) return `${actor.name} ele geçirilmiş: beden yalnızca ele geçirenin eylemlerini yapar.`;
  return null;
}

/** "Bedeni bırak": aktör beden ya da ele geçiren (bonus eylem economy'de); Game Master `gm: true` ile her an. */
export function executePossessionLeave(state: BattleState, actorId: string, gm: boolean, ctx: CommandContext): CommandResult {
  if (gm && !ctx.isGm) return fail('Ele geçirmeyi yalnızca Game Master bitirir.');
  const actor = state.combatants[actorId];
  if (!actor) return fail('Savaşçı bulunamadı.');
  const host = actor.possessing ? state.combatants[actor.possessing] : actor;
  const eff = host ? possessedEffect(host) : undefined;
  if (!host || !eff) return fail(`${actor.name} ele geçirilmiş değil.`);
  return finish(state, possessionEndEvents(state, host, gm ? 'gm' : 'leave', eff.name));
}
