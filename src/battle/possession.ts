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
import { distance, neighbors, ring, withinRange, hexKey, type Offset } from '../rules/hex';
import { isIncapacitated } from '../rules/conditions';
import { bodyOf, gap } from './body';
import { canControl } from './common';
import { spendSlot } from './slots';
import { spells } from '../data';
import { mechanicsAt } from './spellVersion';
import { fail, finish, type CommandResult } from './common';
import { shapeStats } from './druid';
import { pfegTypesOf } from './mind';
import { occupantAt, placeProblem } from './movement';
import { K74, k74On } from './k74Surum';
import { activePossession, hallowAt, POSSESS_FLOOR, possessedEffect, wardProtects } from './possessionCore';
import { globalRule } from './ruleControl';
import { sightConditions } from './sight';
import { saveEffect } from './maprules';
import { k62acikOn } from './k62acikSurum';
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, Command, CommandContext, ShapeStats } from './types';

type CastCommand = Extract<Command, { type: 'cast_spell' }>;

export { activePossession, POSSESS_FLOOR, possessedEffect, controlConditions, isPossessedBody } from './possessionCore';

export interface PossessSpec {
  attack: string;
  types: string[];
  reachFt: number;
  leave: 'bonus';
  appearFt: number;
  physical: Array<'str' | 'dex' | 'con'>;
  untilRounds: number;
  /** Kuyruk K64b: bedende kullanılamayan saldırılar (Possession; Horrific Visage "görebilen" ister, ele geçiren kaybolmuştur). */
  bodyExclude?: string[];
}
const SPECS = data as unknown as Record<string, PossessSpec>;
/** Kuyruk K64b: yapay zekânın bedeni bırakma ölçütü (`data/ele-gecirme.json` `_yz`). */
const AI = (data as unknown as { _yz: { birakCanOrani: number; yalnizBitisikDusman: number } })._yz;

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
  // Kuyruk K64b: çok altıgenli gövdede uzaklık gövdeler arası (`gap`; bayrak kapalıyken `distance` ile aynı).
  if (gap(state, actor, target) * 5 > spec.reachFt) return `${target.name}: ${spec.reachFt} ft içinde olmalı.`;
  const sc = sightConditions(actor, target, state);
  if (sc.targetConditions.includes('Invisible') || sc.attackerConditions.includes('Blinded')) return `${actor.name} ${target.name} hedefini görmüyor.`;
  if (target.possessionImmune?.includes(actor.id)) return `${target.name} bu ele geçirmeye bağışık (savaş sonuna dek).`;
  if (possessedEffect(target)) return `${target.name} zaten ele geçirilmiş.`;
  if (possessionWarded(state, target.id, actor.id)) return `${target.name} Protection from Evil and Good ile korunuyor: ele geçirilemez.`;
  // Kuyruk K64b: Magic Circle / Hallow koruma alanı.
  const ward = wardProtects(state, target, actor);
  if (ward) return `${target.name} ${ward.name} alanıyla korunuyor: ele geçirilemez.`;
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
    attacks: ghost.attacks.filter((a) => a.name !== spec.attack && !(spec.bodyExclude ?? []).includes(a.name) && !a.recharge), multiattack: !!ghost.multiattack, possession: true,
  };
}

/** Başarısız save: ele geçirme başlar. */
export function possessionStartEvents(state: BattleState, actor: Combatant, target: Combatant, spec: PossessSpec, label: string): BattleEvent[] {
  return [
    { type: 'possessed', possessorId: actor.id, hostId: target.id, label, incap: !target.conditions.includes('Incapacitated'), until: state.round + spec.untilRounds },
    { type: 'shape_changed', actorId: target.id, stats: possessionStats(actor, target, spec) },
  ];
}

/**
 * Ele geçirenin belireceği boş altıgen: ev sahibinin 5 ft içinde; yoksa en yakın boş altıgen (deterministik sıra).
 * Kuyruk K64b (`multiHex`): ev sahibinin gövdesine bitişik altıgenler; ele geçirenin gövdesi (çok altıgenliyse) sığmalı.
 */
export function appearSpot(state: BattleState, center: Offset, host?: Combatant, who?: Combatant): Offset | null {
  const size = { cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 };
  const fits = (h: Offset) => (who ? bodyOf(state, { size: who.size, pos: h }) : [h]).every((x) => !placeProblem(state, x) && !occupantAt(state, x, who?.id));
  const order = (a: Offset, b: Offset) => a.row - b.row || a.col - b.col;
  const body = host?.pos ? bodyOf(state, { size: host.size, pos: host.pos }) : [center];
  const taken = new Set(body.map(hexKey));
  const near = [...new Map(body.flatMap((b) => neighbors(b, size)).filter((h) => !taken.has(hexKey(h))).map((h) => [hexKey(h), h])).values()].sort(order);
  const first = near.find(fits);
  if (first) return first;
  for (let r = 1; r <= Math.max(size.cols, size.rows); r++) {
    const spot = ring(center, r, size).filter((h) => !taken.has(hexKey(h)) && fits(h)).sort(order)[0];
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
  // Kuyruk K64b: sürgün edilen (Dismissal) ele geçiren belirmez.
  const to = center && !g?.exiled ? appearSpot(state, center, host, g) : null;
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
    out.push({ type: 'possession_ended', possessorId: g.id, hostId: g.possessing, reason: 'gone', to: center && !g.exiled ? appearSpot(state, center, h, g) : null, label: g.name });
  }
  return out;
}

/** Bedende izin verilen komutlar (ev sahibinin büyüleri, özellikleri, eşyaları ve tepkileri yok). */
export const BODY_COMMANDS: readonly string[] = ['end_turn', 'possession_leave', 'attack', 'monster_attack', 'multiattack', 'move', 'jump', 'climb', 'jump_down',
  'change_height', 'stand_up', 'shift_move', 'vertical_move', 'explore_move', 'hide', 'dash', 'disengage', 'search', 'dodge', 'help', 'grapple',
  'shove', 'escape', 'escape_grapple', 'attack_object', 'attack_gate', 'object_use', 'drop_item', 'pick_up', 'pull', 'gate'];

/** Komut bedende ya da ele geçirende yapılabilir mi (hata metni ya da null). */
export function possessionCommandProblem(actor: Combatant, type: string): string | null {
  if (actor.possessing) return type === 'end_turn' || type === 'possession_leave' ? null : `${actor.name} bir bedende: yalnızca bedeni bırakabilir.`;
  if (activePossession(actor) && !BODY_COMMANDS.includes(type)) return `${actor.name} ele geçirilmiş: beden yalnızca ele geçirenin eylemlerini yapar.`;
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
  if (!gm && eff.dormant) return fail(`${host.name}: ele geçirme Hallow alanında bastırılmış; beden şu an ele geçirenin değil.`);
  return finish(state, possessionEndEvents(state, host, gm ? 'gm' : 'leave', eff.name));
}

/**
 * Kuyruk K64b: Hallow (Hallowed Ward) bastırması, her komutun sonunda. SRD: alandaki yaratık seçilen türlerce "isn't
 * possessed, Charmed, or Frightened by them while in the area". Ele geçirme bitmez, bastırılır (`dormant`: taraf, durum ve
 * beden değerleri ev sahibine döner); alandan çıkınca sürer. Bu türlerden gelen Charmed/Frightened da bastırılır (Calm
 * Emotions'ın `suppressed` yolu: alandan çıkınca, kaynağı sürüyorsa geri gelir). Yeni durum `wardedFrom` ile hiç tutmaz.
 */
export function hallowSyncEvents(state: BattleState): BattleEvent[] {
  const hallows = (state.map?.zones ?? []).some((z) => z.ward?.kind === 'hallow');
  const out: BattleEvent[] = [];
  for (const h of Object.values(state.combatants)) {
    const e = possessedEffect(h);
    if (e && h.hp > 0) {
      const g = state.combatants[e.sourceId];
      const inside = hallows && !!hallowAt(state, h, g?.creatureType);
      if (inside && !e.dormant) {
        const { grants: _g, ...rest } = e;
        out.push(...(h.shape?.possession ? [{ type: 'shape_changed', actorId: h.id, stats: null, reason: 'Hallow' } as BattleEvent] : []),
          { type: 'effect_ended', targetId: h.id, effectId: e.id, name: e.name, reason: 'dispelled' },
          { type: 'effect_added', targetId: h.id, effect: { ...rest, dormant: true } },
          { type: 'map_note', text: `${h.name}: Hallow alanında ele geçirme bastırıldı (alandan çıkınca sürer).` });
      } else if (!inside && e.dormant && g) {
        const spec = possessSpecOf(state, g);
        const { dormant: _d, ...rest } = e;
        out.push({ type: 'effect_ended', targetId: h.id, effectId: e.id, name: e.name, reason: 'dispelled' },
          { type: 'effect_added', targetId: h.id, effect: { ...rest, ...(h.conditions.includes('Incapacitated') ? {} : { grants: ['Incapacitated'] }) } },
          ...(spec && !h.shape ? [{ type: 'shape_changed', actorId: h.id, stats: possessionStats(g, h, spec) } as BattleEvent] : []),
          { type: 'map_note', text: `${h.name}: Hallow alanından çıktı; ele geçirme yeniden sürüyor.` });
      }
    }
    const supId = `hallow:${h.id}`;
    const sup = h.effects?.find((x) => x.id === supId);
    if (!sup && hallows && h.hp > 0) {
      const list: NonNullable<import('./types').ActiveEffect['suppressed']> = [];
      let caster = '';
      for (const cond of ['Charmed', 'Frightened']) {
        if (!h.conditions.includes(cond)) continue;
        const fx = h.effects?.find((x) => x.grants?.includes(cond) || (cond === 'Charmed' && x.charm));
        const tm = (h.conditionTimers ?? []).find((x) => x.condition === cond);
        const src = state.combatants[fx?.sourceId ?? tm?.sourceId ?? ''];
        const z = hallowAt(state, h, src?.creatureType);
        if (!z) continue;
        caster = z.casterId;
        list.push({ condition: cond, ...(tm ? { timer: tm, round: state.round } : {}), ...(fx ? { by: fx.id } : {}) });
      }
      if (list.length) {
        for (const s of list) out.push({ type: 'condition_changed', targetId: h.id, condition: s.condition, present: false, reason: 'Hallow' });
        out.push({ type: 'effect_added', targetId: h.id, effect: { id: supId, name: 'Hallow', sourceId: caster, until: state.round + 6000, suppressed: list } });
      }
    } else if (sup && !(state.map?.zones ?? []).some((z) => z.ward?.kind === 'hallow' && !!h.pos && z.hexes.some((x) => x.col === h.pos?.col && x.row === h.pos?.row))) {
      out.push({ type: 'effect_ended', targetId: h.id, effectId: supId, name: 'Hallow', reason: 'expired' });
    }
  }
  return out;
}

/**
 * Kuyruk K64b (yapay zekâ, basit kural): beden bırakılır mı? Bonus eylem boşsa ve (1) bedenin canı en çok
 * `birakCanOrani` × en yüksek can ise, ya da (2) ele geçirenin tarafında beden dışında ayakta kimse yokken bedene en az
 * `yalnizBitisikDusman` düşman bitişikse (beden düşmanların arasında tek başına kalmış).
 */
export function aiLeaveWanted(state: BattleState, body: Combatant): boolean {
  const e = activePossession(body);
  if (!e || body.economy.bonus || !possessionOn(state)) return false;
  if (body.hp <= Math.max(1, Math.floor(body.maxHp * AI.birakCanOrani))) return true;
  const mates = Object.values(state.combatants).filter((c) => c.side === body.side && c.id !== body.id && c.id !== e.sourceId && c.hp > 0 && !c.offFloor && !c.civilian && !c.summon);
  const adj = Object.values(state.combatants).filter((c) => c.side !== body.side && c.hp > 0 && !!c.pos && !c.civilian && gap(state, body, c) <= 1);
  return mates.length === 0 && adj.length >= AI.yalnizBitisikDusman;
}

/** Kuyruk K64b: kurulumda koruma alanı büyüsü (Magic Circle, Hallow): mekaniğin `setupWard`'ı. */
export interface SetupWard { kind: 'circle' | 'hallow'; radiusFt: number; maxRadiusFt?: number; rangeFt: number; rounds?: number; types: string[]; reverse?: boolean; note?: string }
export const setupWardOf = (state: Pick<BattleState, 'kuralSurumu'>, name: string): SetupWard | undefined => {
  const sp = spells.find((s) => s.name === name);
  return sp ? (mechanicsAt(state, sp).setupWard as SetupWard | undefined) : undefined;
};

/**
 * Kuyruk K64b (sürüm 48): koruma alanını kurulumda (savaştan önce) kurar. Magic Circle 1 dakika, Hallow 24 saat sürer:
 * savaşta yapılamaz. Merkez `targetHex` (yoksa büyücünün altıgeni, menzil içinde), yarıçap veride (Hallow `choice` "r=NN"
 * ile 5–60 ft), türler `choice` "tur=undead,fiend" (yoksa hepsi), Magic Circle ters yön `choice` "ters". Slot harcanır.
 */
export function executeSetupWard(state: BattleState, cmd: CastCommand, ctx: CommandContext): CommandResult {
  const actor = state.combatants[cmd.actorId];
  if (!actor) return fail('Savaşçı bulunamadı.');
  if (!canControl(actor, ctx)) return fail('Bu savaşçıyı yönetme yetkin yok.');
  const spell = spells.find((s) => s.name === cmd.spellName);
  const w = setupWardOf(state, cmd.spellName);
  if (!spell || !w || !actor.spellNames.includes(spell.name)) return fail('Bu büyüyü bilmiyor.');
  if (!actor.pos) return fail(`${actor.name} henüz yerleşmedi.`);
  const center = cmd.targetHex ?? actor.pos;
  if (distance(center, actor.pos) * 5 > w.rangeFt) return fail(`${spell.name}: merkez ${w.rangeFt} ft içinde olmalı.`);
  const opts = (cmd.choice ?? '').split(';').map((x) => x.trim()).filter(Boolean);
  const kv = (k: string) => opts.find((o) => o.startsWith(`${k}=`))?.slice(k.length + 1);
  const picked = (kv('tur') ?? '').split(',').map((x) => x.trim().toLowerCase()).filter((x) => w.types.includes(x));
  const radiusFt = w.maxRadiusFt && kv('r') ? Math.max(5, Math.min(w.maxRadiusFt, Math.round(Number(kv('r')) / 5) * 5 || w.radiusFt)) : w.radiusFt;
  const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name);
  if (!slot.ok) return slot;
  const size = { cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 };
  // Kuyruk K74 (sürüm 75+): Hallow tek toplu koruma: seçim yok, SRD'nin altı türü birden (`data/k74.json`).
  const types = w.kind === 'hallow' && k74On(state) ? [...K74.hallow.turler] : picked.length ? picked : w.types;
  const ward = { kind: w.kind, types, ...(w.kind === 'circle' && opts.includes('ters') ? { reverse: true } : {}) };
  return finish(state, [...slot.events,
    { type: 'spell_cast', actorId: actor.id, targetId: null, label: spell.name, slotLevel: slot.slotLevel, note: `${radiusFt} ft; türler: ${ward.types.join(', ')}${ward.reverse ? '; ters yön' : ''}${w.note ? `. ${w.note}` : ''}` },
    { type: 'zone_created', zone: { id: `ward:${spell.id}:${actor.id}`, spellId: spell.id, name: spell.name, casterId: actor.id, side: actor.side, dc: 0,
      slotLevel: slot.slotLevel ?? spell.level, hexes: withinRange(center, Math.round(radiusFt / 5), size), center, ...(w.rounds ? { until: state.round + w.rounds } : {}), ward } }]);
}

/** Kuyruk K64b: bedeni yöneten ele geçiren Incapacitated mı (Turn Undead)? */
export const possessorIncapacitated = (state: BattleState, body: Combatant): boolean => {
  const e = activePossession(body);
  const g = e ? state.combatants[e.sourceId] : undefined;
  return !!g && isIncapacitated(g.conditions);
};

/**
 * Kuyruk K62-ACIK (sürüm 67+): Magic Circle'a ışınlanma (SRD 5.2.1: "If the creature tries to use teleportation or
 * interplanar travel to do so, it must first succeed on a Charisma saving throw"). Komutun `teleported` olaylarından seçilen
 * türün silindire girişi (ters yönde çıkışı): büyücünün büyü DC'sine CHA save; başarısızlıkta yaratık ışınlandığı yere geri
 * döner (`teleported`, ışınlanma boşa gider). Bütün ışınlanma yolları (büyü, özellik, canavar yeteneği, tepki) tek noktada.
 * ⚠ Save varıştan sonra atılır: varışta tetiklenen alan etkileri (aynı komutta) geri alınmaz.
 */
export function wardTeleportEvents(next: BattleState, events: readonly BattleEvent[], rng: Rng): BattleEvent[] {
  if (!k62acikOn(next) || !(next.map?.zones ?? []).some((z) => z.ward?.kind === 'circle')) return [];
  const out: BattleEvent[] = [];
  const has = (hexes: readonly Offset[], h: Offset) => hexes.some((x) => x.col === h.col && x.row === h.row);
  for (const e of events) {
    if (e.type !== 'teleported') continue;
    const c = next.combatants[e.actorId];
    if (!c?.creatureType || c.hp <= 0 || !c.pos || c.pos.col !== e.to.col || c.pos.row !== e.to.row) continue;
    const type = c.creatureType;
    const z = (next.map?.zones ?? []).find((w) => w.ward?.kind === 'circle' && w.ward.types.includes(type)
      && (w.ward.reverse ? has(w.hexes, e.from) && !has(w.hexes, e.to) : !has(w.hexes, e.from) && has(w.hexes, e.to)));
    if (!z) continue;
    const dc = next.combatants[z.casterId]?.spellSaveDc ?? 13;
    const save = saveEffect(c, 'magicCircle', `${z.name}: ışınlanma`, 'cha', dc, rng);
    out.push(save);
    if (save.type === 'map_effect' && save.roll?.success) continue;
    if (occupantAt(next, e.from, c.id)) { out.push({ type: 'map_note', text: `${c.name}: ${z.name} ışınlanmayı geri çevirdi ama çıkış yeri dolu (Game Master).` }); continue; }
    out.push({ type: 'teleported', actorId: c.id, from: e.to, to: e.from, label: z.name },
      { type: 'map_note', text: `${c.name}: ${z.name} ışınlanmayı geri çevirdi.` });
  }
  return out;
}
