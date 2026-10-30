/**
 * Tur içi eylem ekonomisi (Adım 5d, SRD 5.2.1 "Playing the Game"): turunda bir eylem, bir bonus
 * eylem ve hareket; turlar arası bir tepki. Saldırı (Attack), büyü, gizlenme, arama, koşma,
 * ayrılma, stabilize etme ve canavar saldırıları birer eylem. Attack eylemi Extra Attack ile
 * birden çok saldırı içerir; Multiattack tek eylemdir. Turda yalnızca bir büyü slotu harcanır.
 *
 * Komut başarılı olursa `action_used` olayı komutun olaylarının ardına eklenir; başarısız
 * komut hiçbir şey harcamaz.
 */
import { spells } from '../data';
import { classKit, classResources as resourcesOfClass, freeSpellResource } from '../rules/classFeatures';
import type { Ability } from '../rules/abilities';
import { fail, type Failure } from './common';
import { stunningProblem } from './stunning';
import { resourceLeft, type BattleEvent, type BattleState, type BonusOption, type Combatant, type Command, type Resources } from './types';

const ACTION_NAMES: Partial<Record<Command['type'], string>> = {
  attack: 'Attack',
  monster_attack: 'saldırı',
  multiattack: 'Multiattack',
  search: 'Search',
  stabilize: 'stabilize',
  escape: 'bataktan çıkma',
  pull: 'çekme',
  hide: 'Hide',
  dash: 'Dash',
  disengage: 'Disengage',
  dodge: 'Dodge',
  help: 'Help',
  escape_grapple: 'yakalamadan kaçış',
};

/** Yan el ek saldırısı (Light; Görev P1) şu an yapılabilir mi: sorun yoksa null (hedef ayrıca denetlenir). */
export function offhandProblem(actor: Combatant): string | null {
  if (!actor.offHandOption) return 'Yan elde Light silah yok.';
  if (actor.economy.offhandUsed) return 'Light ek saldırısı bu tur yapıldı.';
  if (!actor.economy.lightAttack) return 'Önce Attack eylemiyle (yan eldekinden farklı) bir Light silahla saldırmalısın.';
  return null;
}

/** Bu turun anahtarı: slotlu büyü sınırı için. */
export const turnKey = (state: BattleState) => `${state.round}:${state.turnIndex}`;

/** Attack eylemindeki saldırı sayısı (SRD 5.2.1 Extra Attack; veriden, `classFeatures.ts`). */
export function attacksPerActionFor(classId: string, level: number, subclassId?: string): number {
  return classKit(classId, level, subclassId).attacksPerAction;
}

/** Sınıf özelliğinden bonus eylem seçenekleri (Cunning Action; veriden). */
export function bonusActionsFor(classId: string, level: number, subclassId?: string): BonusOption[] {
  return classKit(classId, level, subclassId).bonusActions;
}

/** Sınıf kaynaklarının kullanım sayıları (SRD 5.2.1 sınıf tabloları; tanımlar data/class-features.json). */
export function classResources(classId: string, level: number, mods: Partial<Record<Ability, number>> = {}): Resources {
  return resourcesOfClass(classId, level, mods);
}

/** Sneak Attack zarı (d6): SRD tablosunun Sneak Attack sütunu. */
export function sneakAttackDiceFor(classId: string, level: number, subclassId?: string): number {
  return classKit(classId, level, subclassId).sneakAttackDice;
}

/**
 * Slotsuz yapılan büyünün harcadığı kaynak: kaynak tanımında `freeSpell` (Favored Enemy → Hunter's Mark),
 * kullanım kaldıkça ve slot seviyesi açıkça istenmediyse. Yoksa null.
 */
export function freeCastResource(actor: Combatant, spellName: string, slotLevel?: number): string | null {
  if (slotLevel !== undefined) return null;
  const id = freeSpellResource(spellName, actor.resources);
  return id && resourceLeft(actor, id) > 0 ? id : null;
}

/** Slotsuz yapılan büyü mü (bkz. `freeCastResource`). */
export function freeCast(actor: Combatant, spellName: string, slotLevel?: number): boolean {
  return freeCastResource(actor, spellName, slotLevel) !== null;
}

/** Tepki büyüsü mü (başkasının turunda da yapılabilir). */
export function isReactionSpell(name: string): boolean {
  return spells.find((s) => s.name === name)?.castingTime === 'reaction';
}

type Cost = { ok: true; event: BattleEvent | null } | Failure;

const spend = (c: Combatant, kind: 'action' | 'bonus' | 'reaction', what: string, extra: object = {}): Cost => {
  if (c.economy[kind]) {
    const name = { action: 'Eylem', bonus: 'Bonus eylem', reaction: 'Tepki' }[kind];
    return fail(`${name} bu tur kullanıldı.`);
  }
  // Dazed (Cunning Strike: Daze; Görev F): turunda yalnızca biri: hareket, eylem ya da bonus eylem.
  if (kind !== 'reaction' && c.conditions.includes('Dazed') && (c.economy.action || c.economy.bonus || c.movementUsed > 0)) {
    return fail('Dazed: bu tur yalnızca birini yapabilir (hareket, eylem ya da bonus eylem).');
  }
  return { ok: true, event: { type: 'action_used', actorId: c.id, kind, what, ...extra } };
};

/**
 * Hide, Dash ve Disengage için arayüzün seçeceği komut: savaşçı bunu bonus eylemle yapabiliyor
 * ve bonus eylemi duruyorsa bonusla (eylem saldırıya kalır), değilse eylemle.
 */
export function preferBonus(actor: Combatant, what: BonusOption): boolean {
  return actor.bonusActions.includes(what) && !actor.economy.bonus;
}

/** Komut eylem ekonomisine takılıyorsa nedeni, değilse null (arayüz düğmeleri için). */
export function economyBlock(state: BattleState, actor: Combatant, cmd: Command): string | null {
  const cost = economyCost(state, actor, cmd);
  return cost.ok ? null : cost.error;
}

/** Haste'in ek eylemiyle yapılabilenler (SRD 5.2.1: tek silah saldırısı, Dash, Disengage, Hide, Utilize). */
const HASTE_ACTIONS: Array<Command['type']> = ['attack', 'dash', 'disengage', 'hide'];

/**
 * Komutun harcayacağı eylem; yapılamıyorsa hata. Eylem harcamayan komutta olay yok. CILA: Haste'in ek eylemi (yalnızca
 * tek saldırı, Dash, Disengage, Hide) ve Slow (eylem ya da bonus eylem, ikisi birden değil; Attack tek saldırı).
 */
export function economyCost(state: BattleState, actor: Combatant, cmd: Command): Cost {
  const cost = baseCost(state, actor, cmd);
  if (!cost.ok || cost.event?.type !== 'action_used') return cost;
  const e = actor.economy;
  const slowed = actor.effects?.some((x) => x.slowed) ?? false;
  if (cost.event.kind === 'action' && e.hasted) {
    if (!HASTE_ACTIONS.includes(cmd.type)) return fail('Haste\'in ek eylemiyle yalnızca tek silah saldırısı, Dash, Disengage ya da Hide yapılır.');
    if (cmd.type === 'attack') return { ok: true, event: { ...cost.event, attacksLeft: 0 } };
  }
  if (slowed && cost.event.kind === 'action' && e.bonus) return fail('Slow: bu tur bonus eylem kullanıldı, eylem yapılamaz.');
  if (slowed && cost.event.kind === 'bonus' && e.action) return fail('Slow: bu tur eylem kullanıldı, bonus eylem yapılamaz.');
  if (slowed && cost.event.kind === 'action' && cmd.type === 'attack') return { ok: true, event: { ...cost.event, attacksLeft: 0 } };
  return cost;
}

function baseCost(state: BattleState, actor: Combatant, cmd: Command): Cost {
  const e = actor.economy;
  switch (cmd.type) {
    case 'attack':
    case 'attack_gate':
    case 'breath_weapon':
    case 'shove': {
      // Light silahla saldırı (yan el silahından farklı): yan el ek saldırısını açar (Görev P1).
      const light = cmd.type === 'attack' && !!cmd.option.light && !cmd.option.offhand && cmd.option.weaponId !== actor.offHandOption?.weaponId
        ? { light: true } : {};
      if (e.attacksLeft > 0) {
        return { ok: true, event: { type: 'action_used', actorId: actor.id, kind: 'attack', what: 'Attack', attacksLeft: e.attacksLeft - 1, ...light } };
      }
      return spend(actor, 'action', 'Attack', { attacksLeft: actor.attacksPerAction - 1, ...light });
    }
    case 'offhand_attack': {
      // Önce kuralın kendisi (daha anlamlı neden), sonra eylem ekonomisi.
      const why = offhandProblem(actor);
      if (why) return fail(why);
      // Nick: Attack eyleminin içinde (bonus eylem boş kalır); değilse bonus eylem.
      return actor.nickOffhand
        ? { ok: true, event: { type: 'action_used', actorId: actor.id, kind: 'attack', what: 'Nick', attacksLeft: e.attacksLeft, offhand: true } }
        : spend(actor, 'bonus', 'Light ek saldırısı', { offhand: true });
    }
    case 'monster_attack':
    case 'multiattack':
    case 'search':
    case 'stabilize':
    case 'escape':
    case 'pull':
    case 'dodge':
    case 'help':
    case 'escape_grapple':
      return spend(actor, 'action', ACTION_NAMES[cmd.type] ?? cmd.type);
    case 'hide':
    case 'dash':
    case 'disengage': {
      const what = ACTION_NAMES[cmd.type] ?? cmd.type;
      if (!cmd.bonus) return spend(actor, 'action', what);
      if (!actor.bonusActions.includes(cmd.type)) return fail(`${what} bonus eylemle yapılamaz.`);
      return spend(actor, 'bonus', what);
    }
    case 'second_wind':
      return spend(actor, 'bonus', 'Second Wind');
    case 'steady_aim':
      return spend(actor, 'bonus', 'Steady Aim');
    case 'bonus_strike':
      // Flurry of Blows'un kalan vuruşu bedava; değilse Martial Arts'ın bonus vuruşu (bonus eylem).
      if ((e.flurryLeft ?? 0) > 0) {
        return { ok: true, event: { type: 'action_used', actorId: actor.id, kind: 'attack', what: 'Flurry of Blows', attacksLeft: e.attacksLeft, flurryLeft: (e.flurryLeft ?? 0) - 1 } };
      }
      return spend(actor, 'bonus', 'Martial Arts');
    case 'focus_action': {
      const a = (actor.focusActions ?? []).find((x) => x.id === cmd.action);
      if (!a) return fail('Bu Focus eylemi yok.');
      return spend(actor, 'bonus', a.name, a.strikes ? { flurryLeft: a.strikes } : {});
    }
    case 'stunning_strike': {
      // Eylemsiz; turda bir kez. Önce kuralın kendisi (daha anlamlı neden).
      const why = stunningProblem(actor, cmd.targetId);
      if (why) return fail(why);
      return { ok: true, event: { type: 'action_used', actorId: actor.id, kind: 'attack', what: 'Stunning Strike', attacksLeft: e.attacksLeft, stunUsed: true } };
    }
    case 'use_feature': {
      // Özelliğin türü veriden: bonus eylem (Lay On Hands), eylem ya da eylemsiz (Sacred Weapon).
      const f = (actor.features ?? []).find((x) => x.key === cmd.feature);
      if (!f || f.type === 'free') return { ok: true, event: null };
      return spend(actor, f.type, f.name);
    }
    case 'rage':
      return spend(actor, 'bonus', 'Rage');
    case 'summon_move':
      return spend(actor, 'bonus', 'Çağrıyı taşı');
    case 'spell_followup': {
      // Görev B1: süreli tekrarın maliyeti büyü verisinde (Call Lightning, Vampiric Touch: eylem).
      const cost = spells.find((x) => x.name === actor.concentration?.spell)?.mechanics.repeat?.cost ?? 'bonus';
      return spend(actor, cost, actor.concentration?.spell ?? 'büyü');
    }
    case 'cast_spell': {
      const spell = spells.find((s) => s.name === cmd.spellName);
      if (!spell) return { ok: true, event: null }; // hatayı büyü komutu verir
      // Ritüel (1 saat; Find Familiar): savaşta yapılamaz, kurulumda yapılır (Görev R3).
      if (spell.castingTime === 'ritual') return fail(`${spell.name} ritüeldir: savaştan önce (kurulumda) yapılır.`);
      // Action Surge'ün verdiği eylem Magic eylemi olamaz (SRD 5.2.1).
      if (e.surged && spell.castingTime === 'action') return fail('Action Surge\'ün ek eylemiyle büyü yapılamaz.');
      const usesSlot = spell.level > 0 && !freeCast(actor, spell.name, cmd.slotLevel);
      const key = turnKey(state);
      const cost = spend(actor, spell.castingTime, spell.name, usesSlot ? { slotTurn: key } : {});
      if (cost.ok && usesSlot && e.slotTurn === key) return fail('Bu tur zaten büyü slotu harcandı (turda bir slotlu büyü).');
      return cost;
    }
    default:
      return { ok: true, event: null };
  }
}
