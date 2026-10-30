/**
 * Çağırma ve yoldaş (Görev R3; SRD 5.2.1): Find Familiar, Find Steed (Paladin Faithful Steed), Summon Dragon.
 * Büyünün kuralları ve çağrılan yaratığın stat bloğu `data/summons.json`'dan; familiar biçimleri canavar verisinden.
 *
 * Çağrılan yaratık sıradaki ayrı bir savaşçıdır (`summon` bağı): kendi inisiyatifini atar (familiar) ya da sahibinin
 * inisiyatifini paylaşıp turunu sahibinin hemen ardından oynar (at, ejderha ruhu). Sahibiyle aynı tarafta, sahibinin
 * oyuncusu yönetir (düşman tarafında Game Master). Kaybolma `summonCleanup` ile her komuttan sonra olay olarak yazılır:
 * 0 HP, konsantrasyonun bitmesi, sahibin ölümü (at), süre; aynı büyü yeniden yapılınca önceki yaratık gider.
 */
import summonData from '../../data/summons.json';
import { getMonster, spells, type Monster, type MonsterAttack, type Spell } from '../data';
import { abilityModifier, type Ability } from '../rules/abilities';
import { rollDie, rollTag, type Rng } from '../rules/dice';
import { distance, isInside, neighbors, sameHex, type Offset } from '../rules/hex';
import { canControl, fail, finish, type CommandResult } from './common';
import { combatantFromMonster } from './create';
import { occupantAt, placeProblem } from './movement';
import { applyEvents } from './reduce';
import { concentrationEvent, spendSlot } from './slots';
import { anchoredZoneEvent, triggerEvents } from './zones';
import { costsFrom } from '../rules/hex';
import { executeMove, moveCostFn, terrainAt } from './movement';
import type { BattleEvent, BattleState, Combatant, Command, CommandContext, SummonInfo, SummonVanishReason } from './types';

type CastCommand = Extract<Command, { type: 'cast_spell' }>;

/** Seviyeyle ölçeklenen değer: base + perLevel × (seviye − fromLevel). */
interface Scaled { base: number; perLevel?: number; fromLevel?: number }
interface CreatureAttack {
  name: string;
  bonus?: 'spellAttack';
  save?: { ability: Ability; dc: 'spellSaveDc'; halfOnSave: boolean };
  dice: string;
  /** Görev B2: zar sayısı büyü seviyesiyle artar (bu seviyeden sonra seviye başına +1 zar; Flaming Sphere). */
  diceFromLevel?: number;
  plus?: number;
  plusLevel?: boolean;
  reachFt?: number;
  range?: [number, number];
  /** Alan (Görev R4): nefes konisi. */
  area?: import('../rules/areaParse').AttackArea;
  type?: string;
  typeByChoice?: Record<string, string>;
  repeat?: 'halfLevel';
}
interface CreatureDef {
  srd: string;
  name: string;
  size: Monster['size'];
  creatureType?: string;
  avatar: string;
  ac: Scaled;
  hp: Scaled;
  speed: number;
  fly?: { ft: number; minLevel?: number };
  darkvision?: number;
  abilities: Record<Ability, number>;
  resistances?: string[];
  multiattack?: boolean;
  attacks: CreatureAttack[];
  unsupported?: string[];
}
export interface SummonDef {
  srd: string;
  creature?: string;
  turn: 'own' | 'after-owner';
  rangeFt: number;
  setup?: boolean;
  /** Görev S1: kurulumda yapılır ama slot harcar (Animate Dead). */
  setupSlot?: boolean;
  replace?: boolean;
  canAttack?: boolean;
  endsOnOwnerDeath?: boolean;
  durationRounds?: number;
  choice?: { kind: 'creatureType' | 'damageType'; options: string[] };
  forms?: string[];
  /** Görev B2: dokunulamaz (hedef alınmaz, alanlardan etkilenmez; Flaming Sphere, ruh sürüsü). */
  intangible?: boolean;
  /** Görev B2: yaratıkla yürüyen büyü alanı (`mechanics.zone`), yarıçap (altıgen). */
  zoneRadius?: number;
  /** Görev B2: yaratık sayısı: base + perLevel × (slot − büyü seviyesi) (Animate Dead: 1 + 2). */
  count?: { base: number; perLevel: number };
  /**
   * CILA: kendi turu yok; sahibi bonus eylemle `moveFt` kadar taşır (Flaming Sphere, ruh sürüsü). `ram`: bitişik
   * yaratığa çarptırılır (alanın save'i ve hasarı).
   */
  ownerBonus?: { moveFt: number; ram?: boolean };
}

const DATA = summonData as unknown as { summons: Record<string, SummonDef>; creatures: Record<string, CreatureDef> };

/** Büyünün çağırma tanımı (büyü kimliğiyle). */
export const summonDef = (spellId: string): SummonDef | undefined => DATA.summons[spellId];
export const summonCreature = (id: string): CreatureDef | undefined => DATA.creatures[id];
export const isSummonSpell = (s: Pick<Spell, 'mechanics'>): boolean => s.mechanics.kind === 'summon';

const scaled = (s: Scaled, level: number) => s.base + (s.perLevel ?? 0) * (level - (s.fromLevel ?? 0));

/** Sahibinin büyü saldırı bonusu ve save DC'si (büyücü değilse yetkinlik + en iyi zihinsel değiştirici). */
function casterNumbers(owner: Combatant): { attack: number; dc: number } {
  const mod = owner.spellMod || Math.max(owner.modifiers.int, owner.modifiers.wis, owner.modifiers.cha);
  return { attack: owner.spellAttack ?? owner.proficiency + mod, dc: owner.spellSaveDc ?? 8 + owner.proficiency + mod };
}

/** Stat bloğu → canavar şablonu (seviye ve seçimle ölçeklenmiş). */
function creatureMonster(id: string, def: CreatureDef, owner: Combatant, level: number, choice: string | undefined): Monster {
  const n = casterNumbers(owner);
  const attacks: MonsterAttack[] = def.attacks.map((a) => {
    const plus = (a.plus ?? 0) + (a.plusLevel ? level : 0);
    const dm = /^(\d+)d(\d+)$/.exec(a.dice);
    const dice = a.diceFromLevel !== undefined && dm ? `${Number(dm[1]) + Math.max(0, level - a.diceFromLevel)}d${dm[2]}` : a.dice;
    const damageDice = plus ? `${dice}+${plus}` : dice;
    const damageType = a.typeByChoice ? a.typeByChoice[choice ?? ''] ?? Object.values(a.typeByChoice)[0] : a.type === 'choice' ? choice ?? 'fire' : a.type ?? 'bludgeoning';
    const repeat = a.repeat === 'halfLevel' ? Math.max(1, Math.floor(level / 2)) : 1;
    return {
      name: a.name, bonus: a.save ? 0 : n.attack, damage: `${damageDice} ${damageType}`, damageDice, damageType, repeat,
      ...(a.save ? { save: { ability: a.save.ability, dc: n.dc, halfOnSave: a.save.halfOnSave } } : {}),
      ...(a.range ? { ranged: true, range: a.range } : a.area ? { ranged: true } : { ranged: false, reachFt: a.reachFt ?? 5 }),
      ...(a.area ? { area: a.area } : {}),
    };
  });
  return {
    id, name: def.name, size: def.size, avatar: def.avatar, ac: scaled(def.ac, level), hp: scaled(def.hp, level), speed: def.speed,
    ...(def.fly && level >= (def.fly.minLevel ?? 0) ? { fly: def.fly.ft } : {}),
    ...(def.darkvision ? { darkvision: def.darkvision } : {}),
    abilities: def.abilities, cr: '0', attacks, traits: '', multiattack: def.multiattack ?? false,
    ...(def.resistances ? { resistances: def.resistances } : {}),
    ...(def.unsupported ? { unsupported: def.unsupported } : {}),
  };
}

/** Sahibin bu büyüyle çağırdığı, hâlâ savaştaki yaratıklar. */
export function summonsOf(state: BattleState, ownerId: string, spellId?: string): Combatant[] {
  return Object.values(state.combatants).filter((c) => c.summon && !c.summon.gone && c.summon.by === ownerId
    && (spellId === undefined || c.summon.spellId === spellId));
}

/** Çağrılmış ve kaybolmamış yaratık mı. */
export const isSummoned = (c: Combatant): boolean => !!c.summon && !c.summon.gone;

/** Çağırma yeri sorunu: harita içi, geçilebilir boş altıgen ve sahibine menzil içinde. */
export function summonHexProblem(state: BattleState, owner: Combatant, def: SummonDef, at: Offset): string | null {
  if (!state.map || !owner.pos) return null;
  const why = placeProblem(state, at);
  if (why) return why;
  if (distance(owner.pos, at) * 5 > def.rangeFt) return `Çağırma yeri menzil dışında (en çok ${def.rangeFt} ft).`;
  const other = occupantAt(state, at);
  if (other) return `Çağırma yeri dolu (${other.name}).`;
  return null;
}

/** Sahibine en yakın uygun boş altıgen (yapay zekâ ve kurulum; önce düşmana yakın olanlar, sonra sabit sıra). */
export function summonHexNear(state: BattleState, owner: Combatant, def: SummonDef): Offset | null {
  if (!state.map || !owner.pos) return null;
  const size = { cols: state.map.tiles[0]?.length ?? 0, rows: state.map.tiles.length };
  const foes = Object.values(state.combatants).filter((c) => c.side !== owner.side && c.pos && c.hp > 0 && !c.civilian);
  const near = (h: Offset) => (foes.length ? Math.min(...foes.map((f) => distance(h, f.pos as Offset))) : 0);
  // Sahibinden halka halka (menzil kadar) aranır.
  const seen = new Set<string>();
  let ring: Offset[] = [owner.pos];
  const out: Offset[] = [];
  for (let r = 1; r * 5 <= def.rangeFt && r < 20; r++) {
    const next: Offset[] = [];
    for (const h of ring) for (const n of neighbors(h, size)) {
      const k = `${n.col},${n.row}`;
      if (seen.has(k) || sameHex(n, owner.pos)) continue;
      seen.add(k);
      next.push(n);
    }
    const ok = next.filter((h) => isInside(h, size) && summonHexProblem(state, owner, def, h) === null);
    if (ok.length) {
      out.push(...ok.sort((a, b) => near(a) - near(b) || a.row - b.row || a.col - b.col));
      break;
    }
    ring = next;
  }
  return out[0] ?? null;
}

/** Çağrılan yaratığın sıradaki yeri: sahibinin (ve onun ardından oynayan çağrılarının) ardı ya da inisiyatifine göre. */
function orderIndex(state: BattleState, owner: Combatant, turn: SummonInfo['turn'], initiative: number): number {
  if (turn === 'after-owner') {
    let i = state.order.indexOf(owner.id) + 1;
    while (i < state.order.length) {
      const c = state.combatants[state.order[i] as string];
      if (!c?.summon || c.summon.by !== owner.id || c.summon.turn !== 'after-owner') break;
      i++;
    }
    return i;
  }
  // Kendi inisiyatifi: aynı toplamda önce gelen önce oynar (çağrılan sona).
  const i = state.order.findIndex((id) => (state.combatants[id]?.initiative ?? 0) < initiative);
  return i < 0 ? state.order.length : i;
}

/** Yeni yaratığın kimliği: sahip + sıra numarası (aynı büyü yeniden yapılınca yeni kimlik; olaylar karışmaz). */
function newId(state: BattleState, owner: Combatant): string {
  let n = 1;
  while (state.combatants[`${owner.id}-cagri${n}`]) n++;
  return `${owner.id}-cagri${n}`;
}

/**
 * Çağırma büyüsü (`mechanics.kind: summon`): slot (Find Steed'de Faithful Steed slotsuz), konsantrasyon, aynı büyünün
 * önceki yaratığı kaybolur, yaratık seçilen (ya da sahibine en yakın uygun) altıgende belirir.
 */
export function executeSummon(state: BattleState, actor: Combatant, cmd: CastCommand, spell: Spell, rng: Rng): CommandResult {
  const def = summonDef(spell.id);
  if (!def) return fail(`${spell.name}: çağırma verisi yok.`);
  if (def.setup && state.status !== 'setup') return fail(`${spell.name} savaştan önce (kurulumda) yapılır.`);
  if (!def.setup && state.status !== 'active') return fail('Savaş henüz başlamadı.');
  if (state.map && !actor.pos) return fail('Önce çağıranı yerleştir.');
  const choice = cmd.choice ?? def.choice?.options[0];
  if (def.choice && choice && !def.choice.options.includes(choice)) return fail(`Geçersiz seçim: ${choice}.`);
  const form = def.forms ? cmd.form ?? def.forms[0] : undefined;
  if (def.forms && form && !def.forms.includes(form)) return fail(`Geçersiz familiar biçimi: ${form}.`);
  const at = cmd.targetHex ?? summonHexNear(state, actor, def);
  if (state.map) {
    if (!at) return fail('Çağırma için boş yer yok.');
    const why = summonHexProblem(state, actor, def, at);
    if (why) return fail(why);
  }

  // Ritüel slot harcamaz (Find Familiar).
  const slot = def.setup && !def.setupSlot ? { ok: true as const, slotLevel: null, events: [] as BattleEvent[] } : spendSlot(actor, spell.level, cmd.slotLevel, spell.name);
  if (!slot.ok) return slot;
  const level = slot.slotLevel ?? spell.level;
  const events: BattleEvent[] = [...slot.events];
  // Aynı büyünün önceki yaratığı gider (tek familiar, tek at; yeni Summon Dragon).
  if (def.replace) {
    for (const old of summonsOf(state, actor.id, spell.id)) events.push({ type: 'summon_vanished', actorId: old.id, ownerId: actor.id, reason: 'replaced' });
  }
  events.push(...concentrationEvent(state, actor, spell, level));
  const current = applyEvents(state, events);

  // Görev B2: Animate Dead yukarı slotta birden çok yaratık; her biri sahibine en yakın boş altıgende.
  const count = def.count ? def.count.base + def.count.perLevel * Math.max(0, level - spell.level) : 1;
  let cur = current;
  for (let k = 0; k < count; k++) {
    const place = k === 0 ? at : summonHexNear(cur, actor, def);
    if (state.map && !place) break;
    const ev = summonedEvent(cur, actor, spell, def, level, choice, form, place, rng);
    events.push(ev);
    cur = applyEvents(cur, [ev]);
    // Görev B2: yaratıkla yürüyen alan (Flaming Sphere: bitişikte tur sonu; ruh sürüsü: 10 ft).
    if (def.zoneRadius !== undefined && spell.mechanics.zone && ev.type === 'summoned') {
      const zone = anchoredZoneEvent(cur, actor, spell, ev.combatant.id, def.zoneRadius, level);
      events.push(zone);
      cur = applyEvents(cur, [zone]);
    }
  }
  return finish(state, events);
}

/** Tek yaratığın `summoned` olayı (stat bloğu ya da biçim, inisiyatif, sıradaki yeri). */
function summonedEvent(current: BattleState, actor: Combatant, spell: Spell, def: SummonDef, level: number, choice: string | undefined,
  form: string | undefined, at: Offset | null | undefined, rng: Rng): BattleEvent {
  const id = newId(current, actor);
  const monster = form ? getMonster(form) : creatureMonster(def.creature ?? spell.id, summonCreature(def.creature ?? '') as CreatureDef, actor, level, choice);
  // Tepkileri alınmaz (hayvan biçiminin ya da canavar verisinin tepkisi yok sayılır).
  const { reactions: _r, reactionUses: _u, ...base } = combatantFromMonster(monster, { id, name: `${monster.name} (${actor.name})`, height: actor.height });
  const own = def.turn === 'own';
  const initiative = own
    ? rollDie(20, rollTag(rng, { kind: 'initiative', by: id, bonus: abilityModifier(monster.abilities.dex) })) + abilityModifier(monster.abilities.dex)
    : actor.initiative;
  const creature = summonCreature(def.creature ?? '');
  const typeOf = def.choice?.kind === 'creatureType' ? choice : creature?.creatureType;
  const summon: SummonInfo = {
    by: actor.id, spellId: spell.id, spell: spell.name, turn: def.turn, level,
    ...(choice ? { choice } : {}),
    ...(spell.concentration ? { concentration: true } : {}),
    ...(def.durationRounds ? { until: current.round + def.durationRounds - 1 } : {}),
    ...(def.endsOnOwnerDeath ? { endsOnOwnerDeath: true } : {}),
    ...(def.canAttack === false ? { noAttack: true } : {}),
    ...(def.intangible ? { intangible: true } : {}),
    ...(def.ownerBonus ? { ownerBonus: def.ownerBonus } : {}),
  };
  const combatant: Combatant = {
    ...base,
    side: actor.side, ownerId: actor.ownerId, initiative, pos: current.map && at ? at : null,
    avatar: { ...base.avatar, bg: actor.avatar.bg },
    ...(typeOf ? { creatureType: typeOf } : {}),
    // Familiar saldıramaz (SRD); başka eylemleri yapar (Kaçın, Yardım, Atıl…).
    ...(def.canAttack === false ? { attacks: [], multiattack: false } : {}),
    // Find Steed / Summon Dragon: yetkinlik bonusu sahibininki.
    ...(def.creature ? { proficiency: actor.proficiency } : {}),
    summon,
  };
  return {
    type: 'summoned', ownerId: actor.id, spell: spell.name, combatant,
    index: orderIndex(current, actor, def.turn, initiative),
  };
}

/** Kurulumda ritüel çağırma (Find Familiar): sahibini yöneten yapar; savaş öncesi, slotsuz. */
export function executeSetupSummon(state: BattleState, cmd: CastCommand, ctx: CommandContext, rng: Rng): CommandResult {
  const actor = state.combatants[cmd.actorId];
  if (!actor) return fail('Savaşçı bulunamadı.');
  if (!canControl(actor, ctx)) return fail('Bu savaşçıyı yönetme yetkin yok.');
  const spell = spells.find((s) => s.name === cmd.spellName);
  if (!spell || !actor.spellNames.includes(spell.name)) return fail('Bu büyüyü bilmiyor.');
  if (!summonDef(spell.id)?.setup) return fail('Savaş henüz başlamadı: önce herkes yerleşmeli ve GM başlatmalı.');
  return executeSummon(state, actor, cmd, spell, rng);
}

/**
 * Bağı kopan çağrılmış yaratıklar (her komuttan sonra): 0 HP (SRD: kaybolur), sahibinin bu büyüdeki konsantrasyonu
 * bitti, sahibi öldü (at), süre doldu.
 */
export function summonCleanup(state: BattleState): BattleEvent[] {
  const out: BattleEvent[] = [];
  for (const c of Object.values(state.combatants)) {
    const s = c.summon;
    if (!s || s.gone) continue;
    const owner = state.combatants[s.by];
    let reason: SummonVanishReason | null = null;
    if (c.hp <= 0) reason = 'hp';
    else if (s.concentration && owner?.concentration?.spell !== s.spell) reason = 'concentration';
    else if (s.endsOnOwnerDeath && (!owner || owner.life === 'dead')) reason = 'owner';
    else if (s.until !== undefined && state.round > s.until) reason = 'duration';
    if (reason) out.push({ type: 'summon_vanished', actorId: c.id, ownerId: s.by, reason });
  }
  return out;
}

/** Arayüz: büyünün çağırma tanımı adıyla (menü). */
export function summonDefByName(name: string): SummonDef | undefined {
  const s = spells.find((x) => x.name === name);
  return s ? summonDef(s.id) : undefined;
}

// ---------------------------------------------------------------- CILA: sahibinin bonus eylemiyle taşınan çağrı

/** Sahibin bonus eylemle taşıyabileceği çağrısı (Flaming Sphere, ruh sürüsü). */
export function steerableSummon(state: BattleState, owner: Combatant): Combatant | undefined {
  return Object.values(state.combatants).find((c) => c.summon?.by === owner.id && !!c.summon.ownerBonus && !c.summon.gone && c.hp > 0);
}

/** Çağrının bonus eylemle gidebileceği boş altıgenler (`moveFt` içinde, zorlu arazi dahil). */
export function steerHexes(state: BattleState, owner: Combatant): Offset[] {
  const s = steerableSummon(state, owner);
  if (!s?.pos || !s.summon?.ownerBonus || !state.map) return [];
  const size = { cols: state.map.tiles[0]?.length ?? 0, rows: state.map.tiles.length };
  const budget = Math.floor(s.summon.ownerBonus.moveFt / 5);
  const out: Offset[] = [];
  for (const [key, cost] of costsFrom(s.pos, size, moveCostFn(state, s), budget)) {
    if (cost === 0) continue;
    const [col, row] = key.split(',').map(Number) as [number, number];
    const to = { col, row };
    if (!occupantAt(state, to, s.id) && terrainAt(state, to).movement !== 'blocked') out.push(to);
  }
  return out;
}

/**
 * CILA: sahibi bonus eylemle çağrısını taşır (SRD 5.2.1 Flaming Sphere: 30 ft, bir yaratığa çarptırınca o yaratık save
 * yapar; Conjure Animals: 30 ft). Yürüyüş motorla (alan tetikleri `anchorMove` yürüyüşte); çarpma bitişik hedefe.
 */
export function executeSummonMove(state: BattleState, owner: Combatant, to: Offset, ramId: string | undefined, rng: Rng): CommandResult {
  const s = steerableSummon(state, owner);
  if (!s?.summon?.ownerBonus) return fail('Bonus eylemle taşınacak bir çağrı yok.');
  if (!steerHexes(state, owner).some((h) => sameHex(h, to))) return fail(`${s.name} oraya gidemez (en çok ${s.summon.ownerBonus.moveFt} ft).`);
  const events: BattleEvent[] = [{ type: 'summon_steered', summonId: s.id }];
  let current = applyEvents(state, events);
  const moved = executeMove(current, current.combatants[s.id] as Combatant, to, rng);
  if (!moved.ok) return moved;
  events.push(...moved.events);
  current = moved.state;
  if (ramId) {
    const target = current.combatants[ramId];
    const zone = (current.map?.zones ?? []).find((z) => z.anchorId === s.id);
    if (!s.summon.ownerBonus.ram) return fail(`${s.name} çarptırılamaz.`);
    if (!target || !target.pos || distance(target.pos, to) !== 1) return fail('Çarpılacak yaratık çağrının bitişiğinde olmalı.');
    if (zone) events.push(...triggerEvents(current, zone, target.id, rng));
  }
  return finish(state, events);
}
