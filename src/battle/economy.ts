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
import { fail, type Failure } from './common';
import type { BattleEvent, BattleState, BonusOption, Combatant, Command, Resources } from './types';

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
};

/** Bu turun anahtarı: slotlu büyü sınırı için. */
export const turnKey = (state: BattleState) => `${state.round}:${state.turnIndex}`;

/** Sınıf ve seviyeden Attack eylemindeki saldırı sayısı (SRD 5.2.1 Extra Attack). */
export function attacksPerActionFor(classId: string, level: number): number {
  if (classId === 'fighter') return level >= 20 ? 4 : level >= 11 ? 3 : level >= 5 ? 2 : 1;
  if (['barbarian', 'monk', 'paladin', 'ranger'].includes(classId)) return level >= 5 ? 2 : 1;
  return 1;
}

/** Sınıftan bonus eylem seçenekleri (Rogue 2. seviye Cunning Action). */
export function bonusActionsFor(classId: string, level: number): BonusOption[] {
  return classId === 'rogue' && level >= 2 ? ['dash', 'disengage', 'hide'] : [];
}

/** Sınıf özelliklerinin kullanım sayıları (SRD 5.2.1 sınıf tabloları). */
export function classResources(classId: string, level: number): Resources {
  return {
    // Fighter: Action Surge 2. seviyede bir, 17'de iki; Second Wind 1–3: 2, 4–9: 3, 10+: 4.
    actionSurge: classId === 'fighter' ? (level >= 17 ? 2 : level >= 2 ? 1 : 0) : 0,
    secondWind: classId === 'fighter' ? (level >= 10 ? 4 : level >= 4 ? 3 : 2) : 0,
    // Ranger: Favored Enemy 1–4: 2, 5–8: 3, 9–12: 4, 13–16: 5, 17+: 6.
    favoredEnemy: classId === 'ranger' ? 2 + Math.floor((Math.min(level, 20) - 1) / 4) : 0,
  };
}

/** Sneak Attack zarı: haydut seviyesinin yarısı (yukarı yuvarlanır) kadar d6. */
export function sneakAttackDiceFor(classId: string, level: number): number {
  return classId === 'rogue' ? Math.ceil(level / 2) : 0;
}

/**
 * Slotsuz yapılan büyü: Ranger Favored Enemy kullanımı kaldıkça Hunter's Mark slot harcamaz
 * (slot seviyesi açıkça istenmediyse).
 */
export function freeCast(actor: Combatant, spellName: string, slotLevel?: number): boolean {
  return spellName === "Hunter's Mark" && actor.resources.favoredEnemy > 0 && slotLevel === undefined;
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

/** Komutun harcayacağı eylem; yapılamıyorsa hata. Eylem harcamayan komutta olay yok. */
export function economyCost(state: BattleState, actor: Combatant, cmd: Command): Cost {
  const e = actor.economy;
  switch (cmd.type) {
    case 'attack':
    case 'attack_gate':
      if (e.attacksLeft > 0) {
        return { ok: true, event: { type: 'action_used', actorId: actor.id, kind: 'attack', what: 'Attack', attacksLeft: e.attacksLeft - 1 } };
      }
      return spend(actor, 'action', 'Attack', { attacksLeft: actor.attacksPerAction - 1 });
    case 'monster_attack':
    case 'multiattack':
    case 'search':
    case 'stabilize':
    case 'escape':
    case 'pull':
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
    case 'spell_followup':
      return spend(actor, 'bonus', actor.concentration?.spell ?? 'büyü');
    case 'cast_spell': {
      const spell = spells.find((s) => s.name === cmd.spellName);
      if (!spell) return { ok: true, event: null }; // hatayı büyü komutu verir
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
