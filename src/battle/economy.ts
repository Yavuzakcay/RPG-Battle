/**
 * Tur içi eylem ekonomisi (Adım 5d, SRD 5.2.1 "Playing the Game"): turunda bir eylem, bir bonus
 * eylem ve hareket; turlar arası bir tepki. Saldırı (Attack), büyü, gizlenme, arama, koşma,
 * ayrılma, stabilize etme ve canavar saldırıları birer eylem. Attack eylemi Extra Attack ile
 * birden çok saldırı içerir; Multiattack tek eylemdir. Turda yalnızca bir büyü slotu harcanır.
 *
 * Komut başarılı olursa `action_used` olayı komutun olaylarının ardına eklenir; başarısız
 * komut hiçbir şey harcamaz.
 */
import { heldFollow, mechanicsAt } from './spellVersion';
import { breathOf } from './breath';
import { abilitiesOf } from './monsterAbilities';
import { apexCost, isApex } from './apex';
import { globalRule } from './ruleControl';
import { movableZoneOf } from './zones';
import { dispelEvilSpellOf, strideSpellOf } from './spells';
import { items, spells } from '../data';
import { classKit, classResources as resourcesOfClass, freeSpellResource, resourceDef } from '../rules/classFeatures';
import type { Ability } from '../rules/abilities';
import { fail, type Failure } from './common';
import { stunningProblem } from './stunning';
import { resourceLeft, type BattleEvent, type BattleState, type BonusOption, type Combatant, type Command, type Resources } from './types';
import { ruleVersion } from './ruleVersion';
const hasTrait = (c: Pick<Combatant, 'traits'>, t: string): boolean => !!c.traits?.includes(t);

const ACTION_NAMES: Partial<Record<Command['type'], string>> = {
  moral_rally: 'Toparla',
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
  distract: 'Dikkat dağıt',
  use_item: 'Eşya kullan',
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
/** Turun kimliği (turda bir kurallar). Kuyruk 19 (Time Stop): art arda ek turlar ayrı tur sayılır. */
export const turnKey = (state: BattleState) => `${state.round}:${state.turnIndex}${state.timeStopTurn ? `:t${state.timeStopTurn}` : ''}`;

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
export function freeCastResource(actor: Combatant, spellName: string, slotLevel?: number, forced = false): string | null {
  if (slotLevel !== undefined) return null;
  // Kuyruk 19: Wild Companion: Find Familiar'ı Wild Shape kullanımı harcayarak (oyuncu isteği; ritüel denetimi economy'de).
  if (forced && spellName === 'Find Familiar' && actor.traits?.includes('wild-companion') && resourceLeft(actor, 'wildShape') > 0) return 'wildShape';
  const id = freeSpellResource(spellName, actor.resources, actor.freeSpells);
  if (!id || resourceLeft(actor, id) <= 0) return null;
  // Kuyruk 43b: oyuncu isteğiyle (`cast_spell.free`) yalnızca listeli kaynak (Divine Intervention), slot kalmış olsa da.
  if (forced) return resourceDef(id)?.freeSpellList ? id : null;
  // Kuyruk 41b: son çare kaynağı (Divine Intervention) yalnızca büyünün seviyesinde ya da üstünde slot kalmadıysa.
  if (resourceDef(id)?.freeSpellList?.lastResort) {
    const level = spells.find((s) => s.name === spellName)?.level ?? 0;
    if (actor.spellSlots.some((n, i) => i + 1 >= level && n > 0)) return null;
  }
  return id;
}

/** Slotsuz yapılan büyü mü (bkz. `freeCastResource`). */
export function freeCast(actor: Combatant, spellName: string, slotLevel?: number): boolean {
  if (slotLevel === undefined && actor.atWill?.[spellName]) return true;
  return freeCastResource(actor, spellName, slotLevel) !== null;
}

/** Tepki büyüsü mü (başkasının turunda da yapılabilir). */
export function isReactionSpell(name: string): boolean {
  return spells.find((s) => s.name === name)?.castingTime === 'reaction';
}

type Cost = { ok: true; event: BattleEvent | null } | Failure;

/**
 * Görev A5: turda kaç ek bonus eylem var (genel kanca): savaşçının kendi sayısı (sınıf/alt sınıf özelliği
 * `stat: extraBonusActions`) + süren etkilerin `extraBonus`'u.
 */
export function extraBonusOf(c: Pick<Combatant, 'extraBonus' | 'effects'>): number {
  return (c.extraBonus ?? 0) + (c.effects ?? []).reduce((n, e) => n + (e.extraBonus ?? 0), 0);
}

const spend = (c: Combatant, kind: 'action' | 'bonus' | 'reaction', what: string, extra: object = {}): Cost => {
  // Görev A5: bonus eylem kullanıldıysa ek bonus eylem hakkı (varsa) harcanır.
  const extraBonus = kind === 'bonus' && c.economy.bonus && extraBonusOf(c) > (c.economy.bonusExtraUsed ?? 0);
  if (c.economy[kind] && !extraBonus) {
    const name = { action: 'Eylem', bonus: 'Bonus eylem', reaction: 'Tepki' }[kind];
    return fail(`${name} bu tur kullanıldı.`);
  }
  // Dazed (Cunning Strike: Daze; Görev F): turunda yalnızca biri: hareket, eylem ya da bonus eylem.
  if (kind !== 'reaction' && c.conditions.includes('Dazed') && (c.economy.action || c.economy.bonus || c.movementUsed > 0)) {
    return fail('Dazed: bu tur yalnızca birini yapabilir (hareket, eylem ya da bonus eylem).');
  }
  return { ok: true, event: { type: 'action_used', actorId: c.id, kind, what, ...extra, ...(extraBonus ? { extraBonus: true } : {}) } };
};

/**
 * Hide, Dash ve Disengage için arayüzün seçeceği komut: savaşçı bunu bonus eylemle yapabiliyor
 * ve bonus eylemi duruyorsa bonusla (eylem saldırıya kalır), değilse eylemle.
 */
export function preferBonus(actor: Combatant, what: BonusOption): boolean {
  return bonusOptionsOf(actor).includes(what) && !actor.economy.bonus;
}

/** Bonus eylemle yapılabilenler: sınıf kiti + süren etkilerin verdiği (Kuyruk 19: Conjure Woodland Beings → Disengage). */
export function bonusOptionsOf(actor: Combatant): BonusOption[] {
  const extra = (actor.effects ?? []).flatMap((e) => e.bonusGrant ?? []);
  return extra.length ? [...new Set([...actor.bonusActions, ...extra])] : actor.bonusActions;
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
/** Attack eyleminin saldırı sayısı: pact silahıyla başlarsa Thirsting Blade'in sayısı (`pactAttacks`), değilse sınıfınki. */
export function actionAttacks(actor: Combatant, pact: boolean): number {
  return pact ? Math.max(actor.attacksPerAction, actor.pactAttacks ?? 0) : actor.attacksPerAction;
}

export function economyCost(state: BattleState, actor: Combatant, cmd: Command): Cost {
  const cost = baseCost(state, actor, cmd);
  if (!cost.ok || cost.event?.type !== 'action_used') return cost;
  const e = actor.economy;
  const slowed = actor.effects?.some((x) => x.slowed) ?? false;
  if (cost.event.kind === 'action' && e.hasted) {
    // Kuyruk A6 (sürüm 35): Utilize (nesne kullanma) da.
    if (!HASTE_ACTIONS.includes(cmd.type) && !(cmd.type === 'object_use' && ruleVersion(state) >= 35)) return fail('Haste\'in ek eylemiyle yalnızca tek silah saldırısı, Dash, Disengage ya da Hide yapılır.');
    if (cmd.type === 'attack') return { ok: true, event: { ...cost.event, attacksLeft: 0 } };
  }
  // Kuyruk A8 (Stinking Cloud): eylem ve bonus eylem yok.
  if ((cost.event.kind === 'action' || cost.event.kind === 'bonus') && actor.effects?.some((x) => x.noActBonus)) return fail('Zehirli bulutun etkisinde: bu tur eylem ve bonus eylem yapılamaz.');
  // Kuyruk 19: Confusion: bonus eylem yok.
  if (cost.event.kind === 'bonus' && actor.effects?.some((x) => x.noBonus)) return fail('Bu durumda bonus eylem yapılamaz (Confusion).');
  if (slowed && cost.event.kind === 'action' && e.bonus) return fail('Slow: bu tur bonus eylem kullanıldı, eylem yapılamaz.');
  if (slowed && cost.event.kind === 'bonus' && e.action) return fail('Slow: bu tur eylem kullanıldı, bonus eylem yapılamaz.');
  if (slowed && cost.event.kind === 'action' && cmd.type === 'attack') return { ok: true, event: { ...cost.event, attacksLeft: 0 } };
  return cost;
}

function baseCost(state: BattleState, actor: Combatant, cmd: Command): Cost {
  const e = actor.economy;
  switch (cmd.type) {
    case 'attack':
    case 'breath_weapon':
      // Kuyruk A7: büyüyle verilen nefes Magic eylemidir (saldırının yerine değil).
      if (breathOf(actor)?.spell) return spend(actor, 'action', "Dragon's Breath");
    // falls through
    case 'attack_gate':
    case 'attack_object':
    case 'grapple':
    case 'shove': {
      // Light silahla saldırı (yan el silahından farklı): yan el ek saldırısını açar (Görev P1).
      const light = cmd.type === 'attack' && !!cmd.option.light && !cmd.option.offhand && cmd.option.weaponId !== actor.offHandOption?.weaponId
        ? { light: true } : {};
      // K13: Thirsting Blade'in ek saldırıları yalnızca pact silahıyla (SRD 5.2.1).
      const pact = cmd.type === 'attack' && !!cmd.option.pact;
      if (e.attacksLeft > 0 && e.pactOnly && !pact) return fail('Thirsting Blade: ek saldırı yalnızca pact silahıyla yapılır.');
      // Kuyruk 19 (SRD Loading, Ammunition): Loading silahla eylem başına tek atış; cephane biterse atılamaz.
      if (cmd.type === 'attack' && globalRule(state, 'srdK19')) {
        if (cmd.option.loading && e.loadingFired && e.attacksLeft > 0) return fail('Loading: bu silahla eylem başına tek atış.');
        if (cmd.option.ammo && actor.ammo && (actor.ammo[cmd.option.ammo] ?? 0) <= 0) return fail(`Cephane bitti (${cmd.option.ammo}).`);
      }
      const loading = cmd.type === 'attack' && cmd.option.loading && globalRule(state, 'srdK19') ? { loadingFired: true } : {};
      if (e.attacksLeft > 0) {
        return { ok: true, event: { type: 'action_used', actorId: actor.id, kind: 'attack', what: 'Attack', attacksLeft: e.attacksLeft - 1, ...light, ...loading } };
      }
      const n = actionAttacks(actor, pact);
      return spend(actor, 'action', 'Attack', { attacksLeft: n - 1, ...light, ...loading, ...(n > actor.attacksPerAction ? { pactOnly: true } : {}) });
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
    case 'use_item': {
      // Kuyruk 43: iksir (SRD 5.2.1): bonus eylem; verisinde `action` ise eylem.
      const it = items.find((x) => x.id === cmd.itemId);
      const u = it?.use;
      // Kuyruk 19: fırlatılan eşya (Acid, Alchemist's Fire, Holy Water, Net) Attack eyleminin bir saldırısı yerine.
      if (u?.kind === 'throw') {
        if (e.attacksLeft > 0) return { ok: true, event: { type: 'action_used', actorId: actor.id, kind: 'attack', what: it?.name ?? 'Fırlatma', attacksLeft: e.attacksLeft - 1 } };
        return spend(actor, 'action', 'Attack', { attacksLeft: actionAttacks(actor, false) - 1 });
      }
      return spend(actor, u && 'action' in u && u.action === 'action' ? 'action' : 'bonus', it?.name ?? 'Eşya');
    }
    case 'monster_attack': {
      // Kuyruk P11 (paket `cagirGuclendir.komutSaldiri`): komut turunda eylem harcanmışsa ek saldırı.
      const ex = actor.effects?.find((x) => x.pkExtraAttack);
      if (e.action && ex?.pkExtraAttack && !actor.attacks[cmd.attackIndex]?.bonusAction) {
        return { ok: true, event: ex.pkExtraAttack > 1 ? { type: 'effect_added', targetId: actor.id, effect: { ...ex, pkExtraAttack: ex.pkExtraAttack - 1 } }
          : { type: 'effect_ended', targetId: actor.id, effectId: ex.id, name: ex.name, reason: 'used' } };
      }
    }
      if (actor.attacks[cmd.attackIndex]?.bonusAction) return spend(actor, 'bonus', actor.attacks[cmd.attackIndex]?.name ?? 'Bonus saldırı');
      return spend(actor, 'action', ACTION_NAMES[cmd.type] ?? cmd.type);
    case 'multiattack':
    case 'search':
    case 'stabilize':
    case 'escape':
    case 'pull':
    case 'dodge':
    case 'escape_grapple':
      // Kuyruk 19: Freedom of Movement ile kurtulmak eylem değil (5 ft hareket).
      if (cmd.type === 'escape_grapple' && actor.effects?.some((e) => e.freeMove)) return { ok: true, event: null };
      // Kuyruk K68a (sürüm 52): enkazdan Freedom of Movement ile kurtulmak eylem değil (5 ft hareket).
      if (cmd.type === 'escape' && ruleVersion(state) >= 52 && actor.effects?.some((e) => e.freeMove) && actor.effects?.some((e) => e.pinned)) return { ok: true, event: null };
      return spend(actor, 'action', ACTION_NAMES[cmd.type] ?? cmd.type);
    case 'help':
    case 'distract':
    case 'moral_rally':
      return spend(actor, 'action', ACTION_NAMES[cmd.type] ?? cmd.type);
    case 'monster_ability': {
      // Kuyruk 19: SRD canavar yeteneği (eylem ya da bonus eylem; `monsterAbilities.ts`).
      const ab = abilitiesOf(state, actor).find((x) => x.id === cmd.abilityId);
      if (!ab) return fail('Bu yaratığın böyle bir yeteneği yok.');
      return spend(actor, ab.cost, ab.tr);
    }
    case 'hide':
    case 'dash':
    case 'disengage': {
      const what = ACTION_NAMES[cmd.type] ?? cmd.type;
      if (!cmd.bonus) return spend(actor, 'action', what);
      if (!bonusOptionsOf(actor).includes(cmd.type)) return fail(`${what} bonus eylemle yapılamaz.`);
      return spend(actor, 'bonus', what);
    }
    case 'object_use':
      // Görev S2: kapı açıp kapamak ve nesne almak (Görev S3) eylemsiz; kilit açma, masa devirme, mangal dökme eylem (Utilize).
      if (cmd.action === 'open' || cmd.action === 'close' || cmd.action === 'take') return { ok: true, event: null };
      // Kuyruk P12: büyü kitabını bırakmak serbest (nesne etkileşimi; almak `take` gibi).
      if (cmd.action === 'put') return { ok: true, event: null };
      // A1: nesne fırlatmak eylem (Utilize değil; Fast Hands kapsamaz).
      if (cmd.action === 'throw') return spend(actor, 'action', 'Nesne fırlat');
      // Kuyruk 19 (featuresK19): Thief'in Fast Hands'i: Utilize bonus eylemle (eylem kullanılmışsa ya da her zaman tercih edilir).
      if (actor.traits?.includes('fast-hands') && globalRule(state, 'featuresK19') && !e.bonus) return spend(actor, 'bonus', 'Utilize (Fast Hands)');
      return spend(actor, 'action', 'Utilize');
    case 'second_wind':
      return spend(actor, 'bonus', 'Second Wind');
    case 'steady_aim':
      return spend(actor, 'bonus', 'Steady Aim');
    // Kuyruk K64a: ele geçiren bedeni bonus eylemle bırakır (Game Master zorlaması eylemsiz).
    case 'possession_leave':
      return cmd.gm ? { ok: true, event: null } : spend(actor, 'bonus', 'Bedeni bırak');
    case 'bonus_strike':
      // Flurry of Blows'un kalan vuruşu bedava; değilse Martial Arts'ın bonus vuruşu (bonus eylem).
      if ((e.flurryLeft ?? 0) > 0) {
        return { ok: true, event: { type: 'action_used', actorId: actor.id, kind: 'attack', what: 'Flurry of Blows', attacksLeft: e.attacksLeft, flurryLeft: (e.flurryLeft ?? 0) - 1 } };
      }
      return spend(actor, 'bonus', 'Martial Arts');
    case 'focus_action': {
      const a = (actor.focusActions ?? []).find((x) => x.id === cmd.action);
      if (!a) return fail('Bu Focus eylemi yok.');
      // K17 G2 (kural sürümü 13): Heightened Focus: Flurry of Blows bir vuruş fazla.
      const extra = a.strikes && hasTrait(actor, 'heightened-focus') && ruleVersion(state) >= 13 ? 1 : 0;
      // Kuyruk 19 (11–20): Fleet Step: başka bir bonus eylemden sonra Step of the Wind bedava (turda bir).
      if (a.id === 'step-of-the-wind' && e.bonus && !e.fleetUsed && hasTrait(actor, 'fleet-step') && globalRule(state, 'featuresK19')) {
        return { ok: true, event: { type: 'action_used', actorId: actor.id, kind: 'attack', what: 'Fleet Step', attacksLeft: e.attacksLeft, fleet: true } };
      }
      // Kuyruk P9: ek paket `flurryEk` (süren etki `pkFlurry`; yalnız sürüm 38+ savaşta eklenir).
      const pk = (actor.effects ?? []).reduce((n, e) => n + (e.pkFlurry ?? 0), 0);
      return spend(actor, 'bonus', a.name, a.strikes ? { flurryLeft: a.strikes + extra + pk } : {});
    }
    case 'stunning_strike': {
      // Eylemsiz; turda bir kez. Önce kuralın kendisi (daha anlamlı neden).
      const why = stunningProblem(actor, cmd.targetId);
      if (why) return fail(why);
      return { ok: true, event: { type: 'action_used', actorId: actor.id, kind: 'attack', what: 'Stunning Strike', attacksLeft: e.attacksLeft, stunUsed: true } };
    }
    case 'wild_shape':
      return spend(actor, 'bonus', 'Wild Shape');
    case 'font_of_magic':
      return cmd.mode === 'toSlot' ? spend(actor, 'bonus', 'Font of Magic') : { ok: true, event: null };
    case 'use_feature': {
      // Özelliğin türü veriden: bonus eylem (Lay On Hands), eylem ya da eylemsiz (Sacred Weapon).
      const f = (actor.features ?? []).find((x) => x.key === cmd.feature);
      if (!f) return { ok: true, event: null };
      // Kuyruk 19 (11–20): Quivering Palm tetiği eylem, işareti eylemsiz; Nature's Sanctuary taşıması bonus eylem.
      const kind = isApex(f) ? apexCost(state, actor, f) : f.type;
      if (kind === 'free') return { ok: true, event: null };
      return spend(actor, kind, f.name);
    }
    case 'rage':
      return spend(actor, 'bonus', 'Rage');
    case 'familiar_strike':
    case 'superior_defense':
    case 'initiative_swap':
    case 'shift_move':
      return { ok: true, event: null };
    case 'familiar_order':
      return spend(actor, 'bonus', 'Familiar\'a saldırı emri');
    case 'gaze':
      return spend(actor, 'bonus', 'Gaze of Two Minds');
    case 'steed_action':
      return spend(actor, 'bonus', cmd.kind === 'fell-glare' ? 'Fell Glare' : cmd.kind === 'fey-step' ? 'Fey Step' : 'Healing Touch');
    case 'command_summons':
      return spend(actor, 'bonus', 'Yaratıklara emir');
    case 'summon_move': {
      // Kuyruk A6 (Conjure Animals): sahibi bu tur yürüdüyse sürüyü de taşır (bonus eylem değil; turda bir kez).
      const pack = Object.values(state.combatants).find((c) => c.summon?.by === actor.id && c.summon.withOwner && !c.summon.gone);
      if (pack && actor.movementUsed > 0 && !actor.economy.packMoved) return { ok: true, event: { type: 'action_used', actorId: actor.id, kind: 'attack', what: 'Sürü sahibiyle', packMoved: true } };
      return spend(actor, 'bonus', 'Çağrıyı taşı');
    }
    case 'spell_followup': {
      // Kuyruk P11: saklı büyüyü ateşleme maliyeti ilkelde (`buyuSakla.ateslemeEylemi`).
      // Kuyruk P12: dostun tetiklediği mühürlü büyü dostun ekonomisini harcamaz (geçerlilik komutta).
      // Kuyruk K62 (sürüm 46): boncuğa dokunmak eylem harcamaz (boncuk dokunanın kararı değil, yan etki).
      if (cmd.choice === 'bead') return { ok: true, event: null };
      // Kuyruk K66a (sürüm 50): yarık yerleştirmek eylem harcamaz (büyünün parçası).
      if (cmd.choice?.startsWith('fissure:')) return { ok: true, event: null };
      if (cmd.choice === 'sakli' && cmd.sourceId && cmd.sourceId !== actor.id) return { ok: true, event: null };
      if (cmd.choice === 'sakli') { const c = actor.effects?.find((x) => x.storedSpell)?.storedSpell?.cost; if (!c) return fail('Saklı büyü yok.'); return c === 'free' ? { ok: true, event: null } : spend(actor, c, 'Saklı büyü'); }
      // Görev B1: süreli tekrarın maliyeti büyü verisinde (Call Lightning, Vampiric Touch: eylem).
      if (dispelEvilSpellOf(state, actor)) return spend(actor, 'action', 'Dispel Evil and Good');
      // Kuyruk 19: Tree Stride eylem harcamaz (5 ft hareket).
      if (cmd.targetHex && strideSpellOf(state, actor)) return { ok: true, event: null };
      // Kuyruk 19: Faithful Hound taşıma Magic eylemi.
      const mz = cmd.targetHex ? movableZoneOf(state, actor) : null;
      // Kuyruk A7: taşıma maliyeti büyünün tekrarından (Dancing Lights bonus eylem); eski kayıtta Faithful Hound eylem.
      if (mz) return spend(actor, ruleVersion(state) >= 36 ? mz.spell.mechanics.repeat?.cost ?? 'action' : 'action', mz.spell.name);
      // Kuyruk A6: elde tutulan büyü (Produce Flame: Magic eylemi); tekrar alanları sürüme göre.
      const followed = heldFollow(state, actor)?.spell ?? actor.concentration?.spell;
      const fsp = spells.find((x) => x.name === followed);
      // Kuyruk S2 (Flame Blade): bırakılan bıçağı çağırmak bonus eylem.
      const recall = !!fsp && !!mechanicsAt(state, fsp).bladeRecall && !!actor.effects?.some((e) => e.id === fsp.srd && e.bladeGone);
      const cost = recall ? 'bonus' : (fsp ? mechanicsAt(state, fsp).repeat?.cost : undefined) ?? 'bonus';
      return spend(actor, cost, followed ?? 'büyü');
    }
    case 'cast_spell': {
      const spell = spells.find((s) => s.name === cmd.spellName);
      if (!spell) return { ok: true, event: null }; // hatayı büyü komutu verir
      // Ritüel (1 saat; Find Familiar): savaşta yapılamaz, kurulumda yapılır (Görev R3).
      // Kuyruk 19 (featuresK19): Wild Companion: Find Familiar savaşta Magic eylemiyle (slot ya da Wild Shape).
      const companion = spell.name === 'Find Familiar' && !!actor.traits?.includes('wild-companion') && !!globalRule(state, 'featuresK19');
      if (spell.castingTime === 'ritual' && !companion) return fail(`${spell.name} ritüeldir: savaştan önce (kurulumda) yapılır.`);
      if (companion) {
        if (cmd.free && !freeCastResource(actor, spell.name, undefined, true)) return fail('Wild Shape kullanımı kalmadı.');
        return spend(actor, 'action', spell.name, !cmd.free ? { slotTurn: turnKey(state) } : {});
      }
      // Action Surge'ün verdiği eylem Magic eylemi olamaz (SRD 5.2.1).
      if (e.surged && spell.castingTime === 'action') return fail('Action Surge\'ün ek eylemiyle büyü yapılamaz.');
      // Kuyruk 43b: Divine Intervention ile slotsuz yapım (oyuncu isteği): Magic eylemi, slot yok.
      if (cmd.free && (spell.level === 0 || !freeCastResource(actor, spell.name, cmd.slotLevel, true))) return fail('Bu büyü slotsuz yapılamaz (kullanım hakkı yok ya da büyü listede değil).');
      // Kuyruk P11: bilinmeyen büyü (paket çalınan/kopya) slotsuz yapılır.
      const usesSlot = spell.level > 0 && !cmd.free && !freeCast(actor, spell.name, cmd.slotLevel) && actor.spellNames.includes(spell.name);
      const key = turnKey(state);
      // Görev SORCERER: Quickened Spell: eylemlik büyü bonus eylemle.
      // Kuyruk 19: canavarın bonus eylem büyüsü (Divine Aid, Misty Step; kaynak `mspell-b:`) slotsuz yapımda bonus eylemle.
      const bonusSpell = cmd.slotLevel === undefined && !!actor.freeSpells?.[spell.name]?.startsWith('mspell-b:') && (actor.resources[actor.freeSpells[spell.name]!] ?? 0) > 0;
      const time = cmd.free ? 'action' : bonusSpell || (cmd.metamagic?.includes('quickened') && spell.castingTime === 'action') ? 'bonus' : spell.castingTime;
      const cost = spend(actor, time as 'action' | 'bonus' | 'reaction', spell.name, usesSlot ? { slotTurn: key } : {});
      if (cost.ok && usesSlot && e.slotTurn === key) return fail('Bu tur zaten büyü slotu harcandı (turda bir slotlu büyü).');
      return cost;
    }
    default:
      return { ok: true, event: null };
  }
}
