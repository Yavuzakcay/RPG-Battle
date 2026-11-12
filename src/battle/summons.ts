/**
 * Çağırma ve yoldaş (Görev R3; SRD 5.2.1): Find Familiar, Find Steed (Paladin Faithful Steed), Summon Dragon.
 * Büyünün kuralları ve çağrılan yaratığın stat bloğu `data/summons.json`'dan; familiar biçimleri canavar verisinden.
 *
 * Çağrılan yaratık sıradaki ayrı bir savaşçıdır (`summon` bağı): kendi inisiyatifini atar (familiar) ya da sahibinin
 * inisiyatifini paylaşıp turunu sahibinin hemen ardından oynar (at, ejderha ruhu). Sahibiyle aynı tarafta, sahibinin
 * oyuncusu yönetir (düşman tarafında Game Master). Kaybolma `summonCleanup` ile her komuttan sonra olay olarak yazılır:
 * 0 HP, konsantrasyonun bitmesi, sahibin ölümü (at), süre; aynı büyü yeniden yapılınca önceki yaratık gider.
 */
import { mechanicsAt } from './spellVersion';
import { OBJECTS } from './objectData';
import { surfaceEvent } from './surfaces';
import { CHAIN_FORMS, chainOn } from './chainPact';
import { HAND_EFFECTS, handEffectEvents, type HandEffect } from './arcaneHand';
import { registerSummonRider } from './riders';
import { globalRule } from './ruleControl';
import { ruleVersion } from './ruleVersion';
import { castBarrier } from './castBarrier';
import summonData from '../../data/summons.json';
import { getMonster, spells, type Monster, type MonsterAttack, type Spell } from '../data';
import { abilityModifier, type Ability } from '../rules/abilities';
import { rollDie, rollTag, type Rng } from '../rules/dice';
import { distance, isInside, neighbors, sameHex, type Offset } from '../rules/hex';
import { canControl, fail, finish, type CommandResult } from './common';
import { combatantFromMonster } from './create';
import { bodyFitProblem, occupantAt, placeProblem } from './movement';
import { reachToHex } from './body';
import { applyEvents } from './reduce';
import { concentrationEvent, spendSlot } from './slots';
import { anchoredZoneEvent, triggerEvents } from './zones';
import { costsFrom } from '../rules/hex';
import { executeMove, moveCostFn, terrainAt } from './movement';
import type { BattleEvent, BattleState, Combatant, Command, CommandContext, SummonInfo, SummonVanishReason } from './types';
import { binekMb7On } from './binekSurum';
import { binekMb2On } from './binekMb2Surum';
import { mountRuleOf } from './riderCore';

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
  /** Kuyruk 18 H2: seviye başına zar sayısı (Clenched Fist: 2). */
  diceStep?: number;
  plus?: number;
  plusLevel?: boolean;
  reachFt?: number;
  range?: [number, number];
  /** Alan (Görev R4): nefes konisi. */
  area?: import('../rules/areaParse').AttackArea;
  type?: string;
  typeByChoice?: Record<string, string>;
  repeat?: 'halfLevel';
  /** Kuyruk 19: yalnızca bu seçimlerde (Giant Insect biçimi), bonus eylemle, isabet ek etkisi (attack-riders biçimi). */
  onlyChoice?: string[];
  bonusAction?: boolean;
  rider?: import('./riders').RiderSpec;
  /** Kuyruk 19: bu saldırı yalnızca kural sürümü 16+ (spellsK19). */
  k19?: boolean;
}
interface CreatureDef {
  srd: string;
  /** Kuyruk 19: boyut biçimleri (Animate Objects): HP, Slam zarı, büyü değiştiricisi eklenir mi. */
  sizes?: Record<string, { size: Monster['size']; hp: number; dice: string; plusMod?: boolean }>;
  /** Kuyruk 18 H2: HP büyücünün en çok HP'si (Arcane Hand). */
  hpOwnerMax?: boolean;
  name: string;
  size: Monster['size'];
  creatureType?: string;
  avatar: string;
  /** Kuyruk B1: seçime göre jeton (Giant Insect: örümcek/kırkayak/eşek arısı) ve halka rengi (yalnız görsel). */
  avatarByChoice?: Record<string, string>;
  ringByChoice?: Record<string, string>;
  ac: Scaled;
  hp: Scaled;
  speed: number;
  fly?: { ft: number; minLevel?: number; onlyChoice?: string[] };
  darkvision?: number;
  /** Kuyruk 19: savaşçı özellikleri (`climber`: Spider Climb). */
  traits?: string[];
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
  choice?: { kind: 'creatureType' | 'damageType' | 'form'; options: string[] };
  forms?: string[];
  /** Görev B2: dokunulamaz (hedef alınmaz, alanlardan etkilenmez; Flaming Sphere, ruh sürüsü). */
  intangible?: boolean;
  /** Görev B2: yaratıkla yürüyen büyü alanı (`mechanics.zone`), yarıçap (altıgen). */
  zoneRadius?: number;
  /** Görev B2: yaratık sayısı: base + perLevel × (slot − büyü seviyesi) (Animate Dead: 1 + 2). */
  count?: { base: number; perLevel: number; fromMod?: boolean };
  /**
   * CILA: kendi turu yok; sahibi bonus eylemle `moveFt` kadar taşır (Flaming Sphere, ruh sürüsü). `ram`: bitişik
   * yaratığa çarptırılır (alanın save'i ve hasarı).
   */
  ownerBonus?: { moveFt: number; ram?: boolean };
  /** Kuyruk 19: bonus eylemle emir (Animate Objects; emirsiz turda Kaçın). */
  commandBonus?: boolean;
  /** Kuyruk A6 (sürüm 35; Animate Dead): bonus eylemle emir, emir yoksa Kaçın; emir menzili ft. */
  commandBonusV35?: number;
  /** Kuyruk A6 (sürüm 35; Conjure Animals): sahibiyle birlikte taşınır (yürüdüğü tur bonus eylemsiz) ve STR save avantajı. */
  withOwnerV35?: boolean;
  /** Kuyruk 19: Arcane Hand: sahibinin bonus eylemiyle 60 ft taşınır ve etki seçer, yer kaplamaz. */
  handK19?: boolean;
  /** Kuyruk 19: boyut karışımı (Animate Objects: Large 2, Huge 3 sayılır; seçim `form` medium|large|huge). */
  sizeMix?: boolean;
  /** Kuyruk MB7 (70+): binek kuralı (`kural: sahip|dost`, `enBuyukBinici`, `minSeviye`); yoksa çağrıya binilmez. */
  mount?: { kural: 'sahip' | 'dost'; enBuyukBinici?: string; minSeviye?: number; kontrol?: 'kontrollu' | 'bagimsiz' };
  /** Kuyruk MB7 (70+): yürüme hızı (ft; Phantom Steed 100). */
  speedFt?: number;
  /** Kuyruk MB7 (70+): hasar alınca kaybolur (Phantom Steed). */
  endsOnDamage?: boolean;
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
function creatureMonster(id: string, def0: CreatureDef, owner: Combatant, level: number, choice: string | undefined, k19 = false, sizeKey?: string): Monster {
  const n = casterNumbers(owner);
  const sz = sizeKey && k19 ? def0.sizes?.[sizeKey] : undefined;
  const def: CreatureDef = sz ? { ...def0, size: sz.size, hp: { base: sz.hp }, attacks: def0.attacks.map((a, i) => (i === 0 ? { ...a, dice: sz.dice, plus: (a.plus ?? 0) + (sz.plusMod ? owner.spellMod : 0) } : a)) } : def0;
  const attacks: MonsterAttack[] = def.attacks.filter((a) => (!a.k19 || k19) && (!a.onlyChoice || (k19 && a.onlyChoice.includes(choice ?? '')))).map((a) => {
    const plus = (a.plus ?? 0) + (a.plusLevel ? level : 0);
    const dm = /^(\d+)d(\d+)$/.exec(a.dice);
    const dice = a.diceFromLevel !== undefined && dm ? `${Number(dm[1]) + (a.diceStep ?? 1) * Math.max(0, level - a.diceFromLevel)}d${dm[2]}` : a.dice;
    const damageDice = plus ? `${dice}+${plus}` : dice;
    const damageType = a.typeByChoice ? a.typeByChoice[choice ?? ''] ?? Object.values(a.typeByChoice)[0] : a.type === 'choice' ? choice ?? 'fire' : a.type ?? 'bludgeoning';
    const repeat = a.bonusAction ? 0 : a.repeat === 'halfLevel' ? Math.max(1, Math.floor(level / 2)) : 1;
    if (a.rider && k19) registerSummonRider(`${id}:${a.name}`, a.rider);
    return {
      ...(a.bonusAction ? { bonusAction: true } : {}),
      name: a.name, bonus: a.save ? 0 : n.attack, damage: `${damageDice} ${damageType}`, damageDice, damageType, repeat,
      ...(a.save ? { save: { ability: a.save.ability, dc: n.dc, halfOnSave: a.save.halfOnSave } } : {}),
      ...(a.range ? { ranged: true, range: a.range } : a.area ? { ranged: true } : { ranged: false, reachFt: a.reachFt ?? 5 }),
      ...(a.area ? { area: a.area } : {}),
    };
  });
  return {
    // Kuyruk 18 H2: `hpOwnerMax` (Arcane Hand): HP büyücünün en çok HP'si.
    id, name: def.name, size: def.size, avatar: def.avatarByChoice?.[choice ?? ''] ?? def.avatar, ac: scaled(def.ac, level), hp: def.hpOwnerMax ? owner.maxHp : scaled(def.hp, level), speed: def.speed,
    ...(def.fly && level >= (def.fly.minLevel ?? 0) && (!def.fly.onlyChoice || (k19 && def.fly.onlyChoice.includes(choice ?? ''))) ? { fly: def.fly.ft } : {}),
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

/**
 * Çağırma yeri sorunu: harita içi, geçilebilir boş altıgen ve sahibine menzil içinde. Kuyruk K69 (sürüm 53, çok altıgen):
 * menzil sahibinin gövdesinden, çağrılanın boyutu (`size`) verilirse gövdesi sığmalı.
 */
export function summonHexProblem(state: BattleState, owner: Combatant, def: SummonDef, at: Offset, size?: Monster['size']): string | null {
  if (!state.map || !owner.pos) return null;
  const why = placeProblem(state, at);
  if (why) return why;
  if (reachToHex(state, owner, at) * 5 > def.rangeFt) return `Çağırma yeri menzil dışında (en çok ${def.rangeFt} ft).`;
  const other = occupantAt(state, at);
  if (other) return `Çağırma yeri dolu (${other.name}).`;
  if (size) {
    const fit = bodyFitProblem(state, { id: '__cagri', name: summonCreature(def.creature ?? '')?.name ?? 'Çağrı', size } as Pick<Combatant, 'id' | 'name' | 'size'>, at);
    if (fit) return fit;
  }
  return null;
}

/** Kuyruk K69: çağrılanın boyutu (biçim ya da çağırma verisi; Animate Objects boyut karışımı). */
export function summonSizeOf(state: BattleState, def: SummonDef, form?: string, sizeKey?: string): Monster['size'] | undefined {
  if (form) return getMonster(form)?.size;
  const cr = summonCreature(def.creature ?? '');
  return (sizeKey && globalRule(state, 'spellsK19') ? cr?.sizes?.[sizeKey]?.size : undefined) ?? cr?.size;
}

/** Sahibine en yakın uygun boş altıgen (yapay zekâ ve kurulum; önce düşmana yakın olanlar, sonra sabit sıra). */
export function summonHexNear(state: BattleState, owner: Combatant, def: SummonDef, size?: Monster['size']): Offset | null {
  if (!state.map || !owner.pos) return null;
  const grid = { cols: state.map.tiles[0]?.length ?? 0, rows: state.map.tiles.length };
  const foes = Object.values(state.combatants).filter((c) => c.side !== owner.side && c.pos && c.hp > 0 && !c.civilian);
  const near = (h: Offset) => (foes.length ? Math.min(...foes.map((f) => distance(h, f.pos as Offset))) : 0);
  // Sahibinden halka halka (menzil kadar) aranır.
  const seen = new Set<string>();
  let ring: Offset[] = [owner.pos];
  const out: Offset[] = [];
  for (let r = 1; r * 5 <= def.rangeFt && r < 20; r++) {
    const next: Offset[] = [];
    for (const h of ring) for (const n of neighbors(h, grid)) {
      const k = `${n.col},${n.row}`;
      if (seen.has(k) || sameHex(n, owner.pos)) continue;
      seen.add(k);
      next.push(n);
    }
    const ok = next.filter((h) => isInside(h, grid) && summonHexProblem(state, owner, def, h, size) === null);
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
  // Kuyruk 19 (featuresK19): Wild Companion: Find Familiar savaşta Magic eylemiyle, slot ya da Wild Shape harcayarak.
  const companion = spell.id === 'find-familiar' && !!actor.traits?.includes('wild-companion') && !!globalRule(state, 'featuresK19');
  if (def.setup && state.status !== 'setup' && !companion) return fail(`${spell.name} savaştan önce (kurulumda) yapılır.`);
  if (!def.setup && state.status !== 'active') return fail('Savaş henüz başlamadı.');
  if (state.map && !actor.pos) return fail('Önce çağıranı yerleştir.');
  const choice = cmd.choice ?? def.choice?.options[0];
  if (def.choice && choice && !def.choice.options.includes(choice)) return fail(`Geçersiz seçim: ${choice}.`);
  const form = def.forms ? cmd.form ?? def.forms[0] : undefined;
  const chain = spell.id === 'find-familiar' && chainOn(state) && !!actor.traits?.includes('pact-of-the-chain');
  if (def.forms && form && !def.forms.includes(form) && !(chain && CHAIN_FORMS.includes(form))) return fail(`Geçersiz familiar biçimi: ${form}.`);
  // Kuyruk K69 (sürüm 53, çok altıgen): ilk yaratığın gövdesi çağırma yerine sığmalı; sığan en yakın yer aranır.
  // Boyut karışımında (Animate Objects) büyükler önce dizilir: ilk yaratık seçilen büyük boyut.
  const key0 = def.sizeMix && globalRule(state, 'spellsK19') ? (choice === 'huge' ? 'H' : choice === 'large' ? 'L' : undefined) : undefined;
  const size0 = state.multiHex && ruleVersion(state) >= 53 ? summonSizeOf(state, def, form, key0) : undefined;
  const at = cmd.targetHex ?? summonHexNear(state, actor, def, size0);
  if (state.map) {
    if (!at) return fail('Çağırma için boş yer yok (gövde hiçbir yere sığmıyor).');
    const why = summonHexProblem(state, actor, def, at, size0);
    if (why) return fail(why);
  }

  // Ritüel slot harcamaz (Find Familiar).
  // Kuyruk 19: büyüyü yalnızca Wild Companion'dan bilen (ritüel yapamaz) kurulumda da slot ya da Wild Shape harcar.
  const paid = companion && (state.status === 'active' || !!actor.traits?.includes('wild-companion-only'));
  const slot = def.setup && !def.setupSlot && !paid ? { ok: true as const, slotLevel: null, events: [] as BattleEvent[] } : spendSlot(actor, spell.level, cmd.slotLevel, spell.name, cmd.free);
  if (!slot.ok) return slot;
  const level = slot.slotLevel ?? spell.level;
  const events: BattleEvent[] = [...slot.events];
  // Aynı büyünün önceki yaratığı gider (tek familiar, tek at; yeni Summon Dragon).
  if (def.replace) {
    for (const old of summonsOf(state, actor.id, spell.id)) events.push({ type: 'summon_vanished', actorId: old.id, ownerId: actor.id, reason: 'replaced' });
  }
  // Kuyruk 19 (11–20): Dragon Companion (Draconic 18): Summon Dragon uzun dinlenmede bir slotsuz ve konsantrasyonsuz (1 dakika).
  const companionFree = slot.events.some((e) => e.type === 'feature_used' && e.feature === 'dragonCompanion');
  if (!companionFree) events.push(...concentrationEvent(state, actor, spell, level));
  const current = applyEvents(state, events);

  // Görev B2: Animate Dead yukarı slotta birden çok yaratık; her biri sahibine en yakın boş altıgende.
  // Kuyruk 41b: Animate Objects: sayı büyü yeteneği değiştiricisi kadar (en az 1).
  const count = def.count?.fromMod ? Math.max(1, actor.spellMod ?? def.count.base)
    : def.count ? def.count.base + def.count.perLevel * Math.max(0, level - spell.level) : 1;
  // Kuyruk 19: Animate Objects boyut karışımı: bütçe = değiştirici; Large 2, Huge 3 sayılır, kalan Medium.
  const sizes: Array<string | undefined> = def.sizeMix && globalRule(state, 'spellsK19') ? sizeMixOf(count, choice) : Array.from({ length: count }, () => undefined);
  let cur = current;
  for (let k = 0; k < sizes.length; k++) {
    const place = k === 0 ? at : summonHexNear(cur, actor, def, state.multiHex && ruleVersion(state) >= 53 ? summonSizeOf(cur, def, form, sizes[k]) : undefined);
    if (state.map && !place) break;
    const ev = summonedEvent(cur, actor, spell, def, level, choice, form, place, rng, sizes[k], companionFree);
    events.push(ev);
    cur = applyEvents(cur, [ev]);
    // Görev B2: yaratıkla yürüyen alan (Flaming Sphere: bitişikte tur sonu; ruh sürüsü: 10 ft).
    // Kuyruk 19: Arcane Hand: yapımda da etki seçilebilir (hedef elin 5 ft içinde).
    if (k === 0 && ev.type === 'summoned' && ev.combatant.summon?.hand && cmd.choice && (HAND_EFFECTS as string[]).includes(cmd.choice)) {
      const fx = handEffectEvents(cur, actor, cur.combatants[ev.combatant.id] as Combatant, cmd.choice as HandEffect, cmd.targetId, rng);
      if (typeof fx !== 'string') { events.push(...fx); cur = applyEvents(cur, fx); }
    }
    if (def.zoneRadius !== undefined && spell.mechanics.zone && ev.type === 'summoned') {
      const zone = anchoredZoneEvent(cur, actor, spell, ev.combatant.id, def.zoneRadius, level, def.choice?.kind === 'damageType' ? choice : undefined);
      events.push(zone);
      cur = applyEvents(cur, [zone]);
    }
  }
  return finish(state, events);
}

/** Kuyruk 19: Animate Objects: seçilen boyuttan en çok, kalan bütçe Medium. */
function sizeMixOf(budget: number, choice: string | undefined): Array<string | undefined> {
  const cost = choice === 'huge' ? 3 : choice === 'large' ? 2 : 1;
  const big = cost > 1 ? Math.floor(budget / cost) : 0;
  const key = choice === 'huge' ? 'H' : choice === 'large' ? 'L' : undefined;
  return [...Array.from({ length: big }, () => key), ...Array.from({ length: budget - big * cost }, () => undefined)];
}

/** Kuyruk 19: Animate Objects: bonus eylemle emir (bu tur çağrılanlar emirle oynar; emirsiz turda Kaçın). */
export function executeCommandSummons(state: BattleState, actor: Combatant): CommandResult {
  if (!globalRule(state, 'spellsK19') && ruleVersion(state) < 35) return fail('Bu kural sürümünde yok.');
  // Kuyruk A6 (Animate Dead): emir menzili (60 ft).
  const near = (c: Combatant) => !c.summon?.commandFt || !c.pos || !actor.pos || distance(c.pos, actor.pos) * 5 <= c.summon.commandFt;
  const mine = Object.values(state.combatants).filter((c) => c.summon?.by === actor.id && c.summon.commandBonus && !c.summon.gone && c.hp > 0 && near(c));
  if (!mine.length) return fail('Emir verilecek yaratık yok.');
  if (actor.economy.summonCommand) return fail('Bu tur zaten emir verdin.');
  return finish(state, [{ type: 'summons_commanded', actorId: actor.id }]);
}

/** Tek yaratığın `summoned` olayı (stat bloğu ya da biçim, inisiyatif, sıradaki yeri). */
function summonedEvent(current: BattleState, actor: Combatant, spell: Spell, def: SummonDef, level: number, choice: string | undefined,
  form: string | undefined, at: Offset | null | undefined, rng: Rng, sizeKey?: string, companionFree = false): BattleEvent {
  const id = newId(current, actor);
  const k19 = !!globalRule(current, 'spellsK19');
  const monster = form ? getMonster(form) : creatureMonster(def.creature ?? spell.id, summonCreature(def.creature ?? '') as CreatureDef, actor, level, choice, k19, sizeKey);
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
    ...(spell.concentration && !companionFree ? { concentration: true } : {}),
    ...(companionFree ? { until: current.round + 9 } : def.durationRounds ? { until: current.round + def.durationRounds - 1 } : {}),
    ...(def.endsOnOwnerDeath ? { endsOnOwnerDeath: true } : {}),
    ...(def.canAttack === false ? { noAttack: true } : {}),
    ...(def.intangible ? { intangible: true } : {}),
    ...(def.ownerBonus ? { ownerBonus: def.ownerBonus } : {}),
    ...(def.commandBonus && k19 ? { commandBonus: true } : {}),
    ...(def.commandBonusV35 && ruleVersion(current) >= 35 ? { commandBonus: true, commandFt: def.commandBonusV35 } : {}),
    ...(def.withOwnerV35 && ruleVersion(current) >= 35 ? { withOwner: true } : {}),
    ...(def.handK19 && k19 ? { hand: true, noSpace: true, ownerBonus: { moveFt: 60 } } : {}),
    // Kuyruk MB7 (70+): binek kuralı ve hasarla kaybolma.
    ...(def.mount && binekMb7On(current) ? { mount: mountRuleOf(def.mount, binekMb2On(current)) } : {}),
    ...(def.endsOnDamage && binekMb7On(current) ? { endsOnDamage: true as const } : {}),
  };
  const combatant: Combatant = {
    ...base,
    side: actor.side, ownerId: actor.ownerId, initiative, pos: current.map && at ? at : null,
    ...(def.speedFt && binekMb7On(current) ? { speed: def.speedFt } : {}),
    avatar: { ...base.avatar, bg: actor.avatar.bg, ...(creature?.ringByChoice?.[choice ?? ''] ? { ring: creature.ringByChoice[choice ?? ''] } : {}) },
    ...(typeOf ? { creatureType: typeOf } : {}),
    ...(k19 && creature?.traits?.length ? { traits: [...(base.traits ?? []), ...creature.traits] } : {}),
    // Familiar saldıramaz (SRD); başka eylemleri yapar (Kaçın, Yardım, Atıl…).
    // Kuyruk 19: Pact of the Chain familiar'ı saldırılarını korur (yalnızca büyücünün Attack eyleminden ya da emirle).
    ...(def.canAttack === false && !(chainOn(current) && actor.traits?.includes('pact-of-the-chain') && spell.id === 'find-familiar') ? { attacks: [], multiattack: false } : {}),
    // Kuyruk 19: Investment of the Chain Master: 40 ft uçuş, büyücünün save DC'si, BPS → Necrotic/Radiant.
    ...(chainOn(current) && actor.traits?.includes('chain-master') && spell.id === 'find-familiar' ? {
      fly: Math.max(base.fly ?? 0, 40), chainDamage: true,
      attacks: base.attacks.map((a) => (a.save ? { ...a, save: { ...a.save, dc: actor.spellSaveDc ?? a.save.dc } } : a)),
    } : {}),
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
  // Kuyruk MB7: büyünün çağırma oluşu sürüme bağlı olabilir (Phantom Steed `mb7`: 70+).
  if (!summonDef(spell.id)?.setup || mechanicsAt(state, spell).kind !== 'summon') return fail('Savaş henüz başlamadı: önce herkes yerleşmeli ve GM başlatmalı.');
  // Görev B1 (kuyruk 14): ritüel de büyüdür; eğitimsiz zırh engeli savaştakiyle aynı.
  const barrier = castBarrier(state, actor, spell);
  if (barrier) return fail(barrier);
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
    // Kuyruk MB7 (70+): Phantom Steed herhangi bir hasar alınca biter (SRD "The spell ends early if the steed takes any damage").
    else if (s.endsOnDamage && c.hp < c.maxHp) reason = 'damaged';
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
 * Kuyruk 19 (SRD 5.2.1 Flaming Sphere): küre yolu üstünde bir yaratığın alanına girerse o yaratık save yapar ve küre o tur
 * durur. Hedefin bitişiğinde, yoldan ulaşılabilen (giriş bütçesi içinde) en ucuz altıgen; sahibin kendi yerindeyse orası.
 */
export function ramStop(state: BattleState, owner: Combatant, targetId: string): Offset | null {
  const s = steerableSummon(state, owner);
  const t = state.combatants[targetId];
  if (!s?.pos || !t?.pos || !s.summon?.ownerBonus?.ram || !state.map || !globalRule(state, 'spellsK19')) return null;
  if (distance(s.pos, t.pos) === 1) return s.pos;
  const size = { cols: state.map.tiles[0]?.length ?? 0, rows: state.map.tiles.length };
  const budget = Math.floor(s.summon.ownerBonus.moveFt / 5);
  const costs = costsFrom(s.pos, size, moveCostFn(state, s), budget - 1);
  const free = new Set(steerHexes(state, owner).map((h) => `${h.col},${h.row}`));
  let best: { h: Offset; c: number } | null = null;
  for (const h of neighbors(t.pos)) {
    const c = costs.get(`${h.col},${h.row}`);
    if (c === undefined || c === 0 || !free.has(`${h.col},${h.row}`)) continue;
    if (!best || c < best.c) best = { h, c };
  }
  return best?.h ?? null;
}

/** Kuyruk 19: küreyle çarpılabilecek yaratıklar (yol üstünde alanına girilebilenler). */
export function ramTargets(state: BattleState, owner: Combatant): Combatant[] {
  if (!globalRule(state, 'spellsK19')) return [];
  return Object.values(state.combatants).filter((c) => c.pos && c.hp > 0 && !c.summon?.intangible && c.id !== owner.id && !c.summon?.gone && ramStop(state, owner, c.id));
}

/**
 * CILA: sahibi bonus eylemle çağrısını taşır (SRD 5.2.1 Flaming Sphere: 30 ft, bir yaratığa çarptırınca o yaratık save
 * yapar; Conjure Animals: 30 ft). Yürüyüş motorla (alan tetikleri `anchorMove` yürüyüşte); çarpma bitişik hedefe.
 */
function sphereIgniteEvents(state: BattleState, owner: Combatant, s: Combatant, evs: BattleEvent[]): BattleEvent[] {
  const sp = spells.find((x) => x.id === s.summon?.spellId);
  if (!sp || !mechanicsAt(state, sp).sphereTerrain || !state.map) return [];
  const path = evs.flatMap((e) => (e.type === 'moved' && e.actorId === s.id ? e.path : []));
  const end = path[path.length - 1];
  const touched = (h: Offset) => path.some((p) => sameHex(p, h)) || (!!end && distance(end, h) <= 1);
  const burning = new Set((state.map.zones ?? []).filter((z) => z.surface === 'fire').flatMap((z) => z.hexes.map((h) => `${h.col},${h.row}`)));
  const hexes = (state.map.objects ?? []).filter((o) => !o.carriedBy && OBJECTS[o.kind]?.flammable && touched(o.at) && !burning.has(`${o.at.col},${o.at.row}`)).map((o) => o.at);
  return hexes.length ? [surfaceEvent(state, 'fire', hexes, owner.id, owner.side)] : [];
}

export function executeSummonMove(state: BattleState, owner: Combatant, to: Offset, ramId: string | undefined, rng: Rng, hand?: HandEffect): CommandResult {
  const s = steerableSummon(state, owner);
  if (!s?.summon?.ownerBonus) return fail('Bonus eylemle taşınacak bir çağrı yok.');
  // Kuyruk 19: hedefin kendi altıgeni seçildiyse küre yolda ona çarpar, bitişiğinde durur.
  const rt = ramId && !s.summon.hand ? state.combatants[ramId] : undefined;
  if (rt?.pos && sameHex(rt.pos, to) && s.summon.ownerBonus.ram) {
    const stop = ramStop(state, owner, rt.id);
    if (!stop) return fail(`${s.name} ${rt.name} yaratığına ulaşamıyor.`);
    to = stop;
  }
  const stay = !!s.pos && sameHex(s.pos, to) && (!!s.summon.hand || !!rt);
  if (!stay && !steerHexes(state, owner).some((h) => sameHex(h, to))) return fail(`${s.name} oraya gidemez (en çok ${s.summon.ownerBonus.moveFt} ft).`);
  const events: BattleEvent[] = [{ type: 'summon_steered', summonId: s.id }];
  let current = applyEvents(state, events);
  if (!stay) {
    const moved = executeMove(current, current.combatants[s.id] as Combatant, to, rng);
    if (!moved.ok) return moved;
    events.push(...moved.events);
    current = moved.state;
    // Kuyruk S2 (sürüm 41, Flaming Sphere `sphereTerrain`): yuvarlandığı yoldaki ve durduğu yerin bitişiğindeki yanıcı
    // (taşınmayan) nesneler tutuşur (altıgenleri alev yüzeyi).
    const lit = sphereIgniteEvents(current, owner, s, moved.events);
    events.push(...lit); current = applyEvents(current, lit);
  }
  // Kuyruk 19: Arcane Hand etkisi (taşımadan sonra).
  if (s.summon.hand) {
    if (!hand) return finish(state, events);
    const fx = handEffectEvents(current, owner, current.combatants[s.id] as Combatant, hand, ramId, rng);
    if (typeof fx === 'string') return fail(fx);
    return finish(state, [...events, ...fx]);
  }
  if (ramId) {
    const target = current.combatants[ramId];
    const zone = (current.map?.zones ?? []).find((z) => z.anchorId === s.id);
    if (!s.summon.ownerBonus.ram) return fail(`${s.name} çarptırılamaz.`);
    if (!target || !target.pos || distance(target.pos, to) !== 1) return fail('Çarpılacak yaratık çağrının bitişiğinde olmalı.');
    if (zone) events.push(...triggerEvents(current, zone, target.id, rng));
  }
  return finish(state, events);
}
