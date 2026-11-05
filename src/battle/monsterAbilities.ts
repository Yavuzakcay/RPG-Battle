/**
 * Kuyruk 19 (görev 7, SRD canavar yetenekleri; anahtar `srdK19`, kural sürümü 16). Veri `data/canavar-yetenekleri.json`
 * (`scripts/k19-canavar-yetenek.py`):
 * - `abilities`: eylem ya da bonus eylemle kullanılan yetenekler (komut `monster_ability`): hücum/sıçrama (strike),
 *   save'li etki (save; efsanevi eylemlerle aynı yol `boss.ts` `legendarySave`), ışınlanma, güçlendirme, Dash/Disengage/
 *   Hide (grant), can emme (heal), çekme (pull), bırakma (drop), yutma (swallow), çağırma (summon), büyü (spell),
 *   Ethereal (ethereal). Kullanım (`uses`, kaynak `mab:<id>`) ya da şarj (`recharge`, `abilityRecharge`).
 * - `passive`: savaş başında işlenir (`withMonsterAbilities`): bonus eylem seçenekleri, işaretler, süren etki, auralar
 *   (bağlı alan), Hydra başları, zıplama; tur başı/sonu (`monsterTurnEvents`), ölüm patlaması (`deathBurstEvents`),
 *   hasar tepkileri (`damage-effects.ts`: emme, Freeze, Aversion to Fire).
 */
import { forcedMove, MOTION_VERSION } from './motion';
import { ruleVersion } from './ruleVersion';
import data from '../../data/canavar-yetenekleri.json';
import { getMonster } from '../data';
import { distance, ring, type Offset } from '../rules/hex';
import { rollDice, rollDie, rollTag, type Rng } from '../rules/dice';
import { globalRule } from './ruleControl';
import { canSee, damageEffect, hasDarkness, isUnderwater, saveEffect } from './maprules';
import { applyEvents } from './reduce';
import { fail, finish, isTargetable, type CommandResult } from './common';
import { castWithoutAction } from './castHook';
import { k19Legendary, legendarySave, legendaryTeleport, pounceMove, type LegendaryAction } from './boss';
import { executeHide } from './stealth';
import { occupantAt, terrainAt } from './movement';
import { canReact, reactionUsable, reactionUsed, registerInk } from './reactions';
import { retreatMove } from './boss';
import { speedHexes } from './reduce';
import { timedCondition } from './durations';
import { combatantFromMonster } from './create';
import type { ActiveEffect, BattleEvent, BattleState, Combatant, SpellZone } from './types';

export interface MonsterAbility extends Omit<LegendaryAction, 'kind'> {
  kind: LegendaryAction['kind'] | 'grant' | 'heal' | 'pull' | 'drop' | 'swallow' | 'summon' | 'ethereal';
  cost: 'action' | 'bonus';
  uses?: number; recharge?: number;
  moveOnly?: boolean; fullMove?: boolean; waterOnly?: boolean; dimOnly?: boolean; fullMoveNoOA?: boolean;
  grant?: Array<'dash' | 'disengage' | 'hide'>; jumpFt?: number; leapFt?: number; pushOnSave?: number; noHalf?: boolean;
  needsCondition?: string; afterBloodiedHit?: boolean; escalate?: string; breakOnDamage?: boolean; sleepUnder?: number;
  attackBonus?: number; trample?: boolean; grappleDc?: number; untilEscape?: boolean; attackAdv?: boolean; grants?: string[];
  breakOnAct?: boolean; concentration?: boolean; light?: number; toggle?: boolean; healDice?: string; pullFt?: number;
  monster?: string; count?: number; onlyAttacks?: string[]; fromCorpse?: boolean; noRepeat?: boolean; spells?: string[]; ally?: boolean; twice?: boolean;
  adjacent?: boolean; dice2?: string; type2?: string; type?: string; escapeDamage?: number; escapeDc?: number; small?: boolean; nearTree?: boolean;
}
interface Aura { name: string; radiusFt: number; save?: 'wis' | 'con' | 'dex'; dc?: number; conditions?: string[]; on?: Array<'start'>; targets?: 'enemies' | 'all'; difficult?: boolean; gibbering?: boolean }
interface OwnerTurn { when: 'start' | 'end'; radiusFt?: number; grappled?: boolean; dice?: string; type?: string; save?: 'con'; dc?: number; effect?: Partial<ActiveEffect>; underwater?: boolean; name?: string }
export interface MonsterPassive {
  bonusGrant?: Array<'dash' | 'disengage' | 'hide'>; traits?: string[]; absorb?: string[];
  onDamage?: Array<{ type: string; effect: Partial<ActiveEffect>; name: string }>;
  auras?: Aura[]; ownerTurn?: OwnerTurn[];
  deathBurst?: { radiusFt: number; save: 'dex' | 'con'; dc: number; dice?: string; type?: string; dice2?: string; type2?: string; half?: boolean; conditions?: string[] };
  blurred?: boolean; lightSensitivity?: boolean; sunlightWeak?: boolean; sunlight?: { dice: string; type: string }; runningWater?: { dice: string; type: string };
  bloodied?: { attack?: boolean; save?: boolean }; bloodFrenzy?: boolean; authority?: { radiusFt: number };
  heads?: number; berserk?: boolean; mistyEscape?: boolean; transparent?: number; siegeMonster?: boolean; greaterMagicResistance?: boolean;
  reflectiveCarapace?: boolean; corrosive?: boolean; swarm?: boolean; passCreatures?: boolean; fireForm?: { dice: string; type: string };
  waterSusceptible?: { dice: string; type: string }; earthGlide?: boolean; tunneler?: boolean; abduct?: boolean; jump?: { long: number }; roarSequence?: string[];
  loathsomeLimbs?: { uses: number; slashing: number }; illumination?: number; split?: boolean;
}
type Entry = { abilities?: MonsterAbility[]; passive?: MonsterPassive };
const DATA = data as unknown as Record<string, Entry>;

const on = (s: BattleState) => !!globalRule(s, 'srdK19');
const isIncapacitatedNow = (c: Combatant) => c.conditions.some((x) => ['Incapacitated', 'Stunned', 'Paralyzed', 'Unconscious', 'Petrified'].includes(x));
/** Sabit hasar zarı için ("N" ifadesi zar atmaz). */
const rngZero: Rng = () => 0;
const hexOf = (c: Combatant) => c.pos as Offset;
const foesOf = (s: BattleState, c: Combatant) =>
  Object.values(s.combatants).filter((o) => o.side !== c.side && !o.civilian && o.hp > 0 && o.pos && isTargetable(o) && canSee(s, c, o))
    .sort((x, y) => distance(hexOf(x), hexOf(c)) - distance(hexOf(y), hexOf(c)));

export const entryOf = (c: Combatant): Entry | undefined => (c.monsterId ? DATA[c.monsterId] : undefined);
export const passiveOf = (s: BattleState, c: Combatant): MonsterPassive | undefined => (on(s) ? entryOf(c)?.passive : undefined);
// Yetenekle çağrılan yaratığın (Animate Trees ağacı) özel yeteneği yok (SRD: yalnızca Slam); zincirleme çağırma olmaz.
export const abilitiesOf = (s: BattleState, c: Combatant): MonsterAbility[] => (on(s) && !c.summon?.spellId.startsWith('mab:') ? entryOf(c)?.abilities ?? [] : []);

/** Kullanılabilir mi (kullanım hakkı, şarj). */
export function abilityReady(c: Combatant, a: MonsterAbility): boolean {
  if (a.uses !== undefined && (c.resources[`mab:${a.id}`] ?? a.uses) <= 0) return false;
  return !(a.recharge !== undefined && c.abilityRecharge?.includes(a.id));
}

// ------------------------------------------------------------------ savaş başı

/** Savaş başında pasifler: bonus eylem seçenekleri, işaretler, süren etki, auralar, kullanım kaynakları. */
export function withMonsterAbilities(state: BattleState): BattleState {
  if (!on(state)) return state;
  const combatants: Record<string, Combatant> = {};
  const zones: SpellZone[] = [];
  const dark = !!state.map && hasDarkness(state);
  for (const [id, c0] of Object.entries(state.combatants)) {
    if (!c0.monsterId) { combatants[id] = c0; continue; }
    const e: Entry = entryOf(c0) ?? {};
    const c = { ...c0 };
    const p = e.passive ?? {};
    const fx: Partial<ActiveEffect> = {};
    if (p.blurred) fx.attackedDis = true;
    if ((p.lightSensitivity || p.sunlight) && state.map && !dark) { fx.attackDis = {}; if (p.sunlight) fx.checkDis = ['str', 'dex', 'con', 'int', 'wis', 'cha']; }
    if (p.sunlightWeak && state.map && !dark) { fx.attackDis = {}; fx.saveDis = ['str', 'dex', 'con', 'int', 'wis', 'cha']; fx.checkDis = ['str', 'dex', 'con', 'int', 'wis', 'cha']; }
    if (p.absorb) fx.absorb = p.absorb;
    if (p.onDamage) fx.onDamageFx = p.onDamage;
    if (p.greaterMagicResistance) fx.saveAdvAgainst = ['spell'];
    if (p.jump) fx.jumpFt = p.jump.long;
    if (p.bloodied) fx.bloodiedAdv = p.bloodied;
    if (p.bloodFrenzy) fx.bloodFrenzy = true;
    if (p.authority) fx.authority = p.authority.radiusFt;
    if (p.passCreatures || p.swarm) fx.passCreatures = true;
    // Burrow: yer altında ilerler (yaratıkların altından geçer, zorlu arazi yok); Earth Glide / Tunneler: taş ve kayanın içinden.
    const burrow = ((m0: string[]) => m0.some((u) => /Burrow \d+ ft/.test(u)))(((() => { try { return getMonster(c.monsterId as string).unsupported ?? []; } catch { return []; } })()) as string[]);
    // Burrow yalnızca hareketi etkiler (Freedom of Movement değil): yaratıkların altından geçer, zorlu arazi yok.
    if (burrow) { fx.passCreatures = true; fx.burrow = true; }
    if (p.earthGlide || p.tunneler) fx.phase = { difficult: false } as ActiveEffect['phase'];
    if (p.swarm) fx.noHeal = true;
    if (Object.keys(fx).length) c.effects = [...(c.effects ?? []), { ...fx, id: `srd19:${id}:passive`, name: c.name, sourceId: id } as ActiveEffect];
    const traits = [...(p.traits ?? []), ...(p.siegeMonster ? ['siege-monster'] : []), ...(p.greaterMagicResistance ? ['greater-magic-resistance'] : []),
      ...(p.reflectiveCarapace ? ['reflective-carapace'] : []), ...(p.corrosive ? ['corrosive-form'] : []), ...(p.mistyEscape ? ['misty-escape'] : []),
      ...(p.abduct ? ['abduct'] : []), ...(p.earthGlide ? ['earth-glide'] : []), ...(p.berserk ? ['berserk'] : [])];
    if (traits.length) c.traits = [...new Set([...(c.traits ?? []), ...traits])];
    if (p.bonusGrant) c.bonusActions = [...new Set([...c.bonusActions, ...p.bonusGrant])];
    if (p.heads) c.heads = p.heads;
    if (p.transparent) c.hidden = { dc: p.transparent } as Combatant['hidden'];
    const res: Record<string, number> = {};
    for (const a of e.abilities ?? []) if (a.uses !== undefined) res[`mab:${a.id}`] = a.uses;
    if (p.loathsomeLimbs) res['mab:loathsome-limbs'] = p.loathsomeLimbs.uses;
    if (Object.keys(res).length) c.resources = { ...c.resources, ...res };
    // SRD "1/Day" saldırıları (eski veride Recharge 6 yaklaşığı): savaşta bir kez (şarj olmaz).
    let m; try { m = getMonster(c.monsterId as string); } catch { m = undefined; }
    const daily = (m?.unsupported ?? []).filter((u: string) => /: 1\/Day \(Recharge 6 olarak\)/.test(u)).map((u: string) => u.split(':')[0]!.trim());
    if (daily.length) c.attacks = c.attacks.map((a) => (daily.includes(a.name) ? { ...a, recharge: 7 } : a));
    // "N/Day (Recharge X olarak)" N > 1 (Aboleth Dominate Mind 2/Day): savaşta N kez (kalan hak `mab:day:<ad>`).
    for (const u of (m?.unsupported ?? []) as string[]) {
      const mm = /^(.+?): (\d)\/Day \(Recharge \d olarak\)/.exec(u);
      if (!mm || Number(mm[2]) < 2) continue;
      c.attacks = c.attacks.map((a) => (a.name === mm[1] ? { ...a, recharge: 7 } : a));
      c.resources = { ...c.resources, [`mab:day:${mm[1]}`]: Number(mm[2]) - 1 };
    }
    // SRD sabit hasar ("Hit: 1 Piercing damage"): eski verideki 1d2 yaklaşığı yerine sabit değer.
    c.attacks = c.attacks.map((a) => { const k = /^(\d+) [A-Za-z]+ damage/.exec(a.text ?? ''); return k && /^1d2/.test(a.damageDice ?? '') ? { ...a, damageDice: k[1] } : a; });
    if (p.roarSequence) {
      const idx = p.roarSequence.map((n) => c.attacks.findIndex((a) => a.name === n));
      c.attacks = c.attacks.map((a) => (p.roarSequence!.includes(a.name) ? { ...a, recharge: 7 } : a));
      c.rechargeUsed = [...new Set([...c.rechargeUsed, ...idx.slice(1).filter((i) => i >= 0)])];
      c.resources = { ...c.resources, 'mab:roar': 0 };
    }
    for (const au of p.auras ?? []) {
      zones.push({ id: `srd19:${id}:${au.name}`, spellId: `srd19:${au.name}`, name: au.name, casterId: id, side: c.side, dc: au.dc ?? 0, slotLevel: 0, hexes: [],
        anchorId: id, radius: Math.floor(au.radiusFt / 5),
        spec: au.difficult ? { difficult: 2, targets: 'all', color: '#6b5a3a', icon: '🫧' }
          : { on: au.on ?? ['start'], targets: au.targets ?? 'enemies', save: au.save, conditions: au.conditions, hold: 'turn', ...(au.gibbering ? { gibbering: true } : {}), color: '#5b3a6b', icon: '😱' } } as SpellZone);
    }
    combatants[id] = c;
  }
  const map = state.map && zones.length ? { ...state.map, zones: [...(state.map.zones ?? []), ...zones] } : state.map;
  return { ...state, combatants, ...(map ? { map } : {}) };
}

// ------------------------------------------------------------------ komut

export function executeMonsterAbility(state: BattleState, actor: Combatant, abilityId: string, targetId: string | undefined, targetHex: Offset | undefined,
  rng: Rng, opt?: string): CommandResult {
  const a = abilitiesOf(state, actor).find((x) => x.id === abilityId);
  if (!a) return fail('Bu yaratığın böyle bir yeteneği yok.');
  if (!abilityReady(actor, a)) return fail(`${a.tr}: kullanım hakkı yok ya da şarj olmadı.`);
  const events = abilityEvents(state, actor, a, targetId, targetHex, rng, opt);
  if (!events.length) return fail(`${a.tr} şu an kullanılamaz (uygun hedef ya da koşul yok).`);
  const cost: BattleEvent[] = [];
  if (a.uses !== undefined) cost.push({ type: 'feature_used', actorId: actor.id, feature: `mab:${a.id}`, remaining: (actor.resources[`mab:${a.id}`] ?? a.uses) - 1 });
  if (a.recharge !== undefined) cost.push({ type: 'ability_recharge', actorId: actor.id, abilityId: a.id, used: true });
  return finish(state, [...cost, { type: 'map_note', text: `${actor.name}: ${a.tr} (${a.en}).` }, ...events]);
}

/** Yeteneğin olayları (yapay zekâ da kullanır; boşsa kullanılamaz). */
export function abilityEvents(state: BattleState, actor: Combatant, a: MonsterAbility, targetId: string | undefined, targetHex: Offset | undefined,
  rng: Rng, opt?: string): BattleEvent[] {
  let foes = foesOf(state, actor);
  if (targetId) foes = foes.filter((f) => f.id === targetId);
  if (a.waterOnly && !isUnderwater(state, actor)) return [];
  switch (a.kind) {
    case 'strike': {
      if (a.moveOnly) {
        // Charge / Aquatic Charge: hızın yarısı (ya da tamamı) kadar bir düşmana doğru (saldırı yok).
        const budget = a.fullMove ? -actor.speed : 0;
        return pounceMove({ ...state, combatants: { ...state.combatants, [actor.id]: { ...actor, movementUsed: budget } } }, { ...actor, movementUsed: budget }, foes, rng, true);
      }
      if (a.afterBloodiedHit && !foes.some((f) => f.hp <= f.maxHp / 2)) return [];
      return k19Legendary(state, actor, { ...a, kind: 'strike', alt: a.alt ?? a.attack } as LegendaryAction, foes, rng);
    }
    case 'save': {
      if (a.needsCondition) foes = foes.filter((f) => f.conditions.includes(a.needsCondition as string) && distance(hexOf(f), hexOf(actor)) * 5 <= (a.rangeFt ?? 5));
      if (a.attackBonus !== undefined) return attackLike(state, actor, a, foes, rng);
      let pre: BattleEvent[] = [];
      let cur = state;
      if (a.leapFt || a.trample) {
        // Bulette Leap / Trampling Charge: hedefin yanına sıçrar (5 ft hareket) ya da fırsat saldırısız koşar; varışta save.
        const t = foes.find((f) => distance(hexOf(f), hexOf(actor)) * 5 <= (a.leapFt ?? actor.speed) + 5);
        if (!t) return [];
        const spot = ring(hexOf(t), 1, { cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 })
          .filter((h) => !occupantAt(state, h, actor.id) && terrainAt(state, h).movement === 'normal').sort((x, y) => distance(x, hexOf(actor)) - distance(y, hexOf(actor)))[0];
        if (spot && distance(spot, hexOf(actor)) > 0) { pre = [{ type: 'teleported', actorId: actor.id, from: hexOf(actor), to: spot, label: a.tr }]; cur = applyEvents(state, pre); }
        foes = [t];
      }
      const me = cur.combatants[actor.id] as Combatant;
      const spec = { ...a, kind: 'save', ...(a.noHalf ? { half: false } : {}) } as LegendaryAction;
      if (a.sleepUnder !== undefined) {
        const t = foes.find((f) => distance(hexOf(f), hexOf(me)) * 5 <= (a.rangeFt ?? 60));
        if (!t) return [];
        if (t.hp <= a.sleepUnder) {
          const ev = saveEffect(t, 'srdK19', `${a.tr}`, a.save as 'wis', a.dc ?? 15, rng);
          const failed = ev.type === 'map_effect' && ev.roll && !ev.roll.success;
          return [ev, ...(failed ? [{ type: 'effect_added', targetId: t.id, effect: { id: `mab:${me.id}:${a.id}`, name: a.tr, sourceId: me.id, grants: ['Unconscious'], breakOnDamage: true, until: state.round + 600 } } as BattleEvent] : [])];
        }
      }
      const out = [...pre, ...legendarySave(cur, me, spec, foes, rng)];
      if (out.length === pre.length) return [];
      // Petrifying Gaze: ilk başarısızlık Restrained + tekrar save, ikinci Petrified (cockatrice biçimi; `durations.ts`).
      if (a.escalate) {
        for (const e of out) {
          if (e.type !== 'save_resolved' || e.success) continue;
          out.push(timedCondition(applyEvents(state, out), e.targetId, { condition: 'Restrained', saveEnds: { ability: a.save as 'con', dc: a.dc ?? 13 }, maxRounds: 1, escalate: { condition: a.escalate, rounds: 14400 } } as never, me.id, a.tr));
        }
        return out.filter((e) => !(e.type === 'effect_added' && e.effect.id.startsWith(`leg:${me.id}:${a.id}`)));
      }
      if (a.pushOnSave) for (const e of [...out]) if (e.type === 'save_resolved' && e.success && cur.combatants[e.targetId]) out.push(...pushOne(cur, me, cur.combatants[e.targetId] as Combatant, 1, rng));
      if (a.untilEscape || a.breakOnDamage) {
        return out.map((e) => (e.type === 'effect_added' && e.effect.id.startsWith(`leg:${me.id}:${a.id}`)
          ? { ...e, effect: { ...e.effect, ...(a.untilEscape ? { until: state.round + 600, ...(a.grappleDc ? { escapeCheck: { dc: a.grappleDc, skills: ['athletics', 'acrobatics'] } } : {}) } : {}), ...(a.breakOnDamage ? { breakOnDamage: true } : {}) } as ActiveEffect }
          : e));
      }
      return out;
    }
    case 'teleport': {
      if (a.nearTree && !treeNear(state, hexOf(actor))) return [];
      return legendaryTeleport(state, actor, { ...a, kind: 'teleport', ...(a.toward ? { burst: { radiusFt: 5, dice: '0', type: 'force', at: 'dest' } } : {}) } as LegendaryAction, foes, rng)
        .filter((e) => e.type === 'teleported');
    }
    case 'buff': {
      if (a.self) {
        if (a.toggle && actor.effects?.some((e) => e.id === `mab:${actor.id}:${a.id}`)) return [{ type: 'effect_ended', targetId: actor.id, effectId: `mab:${actor.id}:${a.id}`, name: a.tr, reason: 'used' }];
        return [{ type: 'effect_added', targetId: actor.id, effect: { id: `mab:${actor.id}:${a.id}`, name: a.tr, sourceId: actor.id, ...(a.grants ? { grants: a.grants } : {}),
          ...(a.breakOnAct ? { breakOnAct: true } : {}), ...(a.light ? { light: a.light } : {}), until: state.round + (a.toggle ? 6000 : 100) } as ActiveEffect }];
      }
      // War Cry: kendisi ya da görülen bir dost: geçici HP ve saldırılarda avantaj (sonraki turunun başına dek).
      const allies = Object.values(state.combatants).filter((c) => c.side === actor.side && c.hp > 0 && c.pos && distance(hexOf(c), hexOf(actor)) * 5 <= (a.rangeFt ?? 60))
        .sort((x, y) => (targetId ? Number(y.id === targetId) - Number(x.id === targetId) : x.hp / x.maxHp - y.hp / y.maxHp));
      const t = allies[0];
      if (!t) return [];
      const hp = rollDice(a.tempHp ?? '2d10', rollTag(rng, { by: actor.id })).total;
      return [{ type: 'temp_hp', targetId: t.id, amount: hp, label: a.tr },
        ...(a.attackAdv ? [{ type: 'effect_added', targetId: t.id, effect: { id: `mab:${actor.id}:${a.id}`, name: a.tr, sourceId: actor.id, attackAdv: true, untilSourceTurn: true, until: state.round + 1 } } as BattleEvent] : [])];
    }
    case 'grant': {
      if (a.jumpFt) {
        const t = foes[0];
        if (!t) return [];
        const r = Math.floor(a.jumpFt / 5);
        const spot = ring(hexOf(t), 1, { cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 })
          .filter((h) => distance(h, hexOf(actor)) <= r && !occupantAt(state, h, actor.id) && terrainAt(state, h).movement === 'normal')[0];
        return spot && distance(hexOf(t), hexOf(actor)) > 1 ? [{ type: 'teleported', actorId: actor.id, from: hexOf(actor), to: spot, label: a.tr, cost: 2 }] : [];
      }
      const out: BattleEvent[] = [];
      const want = opt ? [opt] : a.grant ?? [];
      if (a.dimOnly && !(state.map && hasDarkness(state))) return [];
      if (want.includes('dash')) out.push({ type: 'dashed', actorId: actor.id });
      if (want.includes('disengage') || a.fullMoveNoOA) out.push({ type: 'disengaged', actorId: actor.id });
      if (want.includes('hide') && (want.length === 1 || opt === 'hide')) {
        const r = executeHide(applyEvents(state, out), actor, rng);
        if (r.ok) out.push(...r.events.filter((e) => e.type !== 'action_used'));
      }
      return out;
    }
    case 'heal': {
      // Consume Life: 5 ft içindeki 0 HP'deki canlı: CON save; başarısızsa ölür, wisp 3d6 HP kazanır.
      const t = Object.values(state.combatants).find((c) => c.id !== actor.id && c.hp <= 0 && c.life !== 'dead' && c.pos && distance(hexOf(c), hexOf(actor)) <= 1
        && !['undead', 'construct'].includes(c.creatureType ?? ''));
      if (!t) return [];
      const ev = saveEffect(t, 'srdK19', a.tr, a.save as 'con', a.dc ?? 10, rng);
      if (!(ev.type === 'map_effect' && ev.roll && !ev.roll.success)) return [ev];
      const amount = Math.min(actor.maxHp - actor.hp, rollDice(a.healDice ?? '3d6', rollTag(rng, { by: actor.id })).total);
      return [ev, damageEffect(t, 'srdK19', `${a.tr}: ölüm`, { dice: String(t.maxHp), type: 'necrotic' }, rng),
        ...(amount > 0 ? [{ type: 'healed', actorId: actor.id, targetId: actor.id, label: a.tr, amount, targetHpAfter: actor.hp + amount } as BattleEvent] : [])];
    }
    case 'pull': {
      // Reel: Restrained/Grappled hedefi düz çizgide kendine çeker.
      const t = Object.values(state.combatants).find((c) => c.side !== actor.side && c.hp > 0 && c.pos && c.conditions.includes(a.needsCondition ?? 'Restrained')
        && distance(hexOf(c), hexOf(actor)) * 5 <= (a.rangeFt ?? 30) && distance(hexOf(c), hexOf(actor)) > 1 && (!targetId || c.id === targetId));
      if (!t) return [];
      return pullToward(state, actor, t, Math.floor((a.pullFt ?? 25) / 5), rng);
    }
    case 'drop': {
      // Swoop: yakaladığı yaratığı yarım uçuş hızı yüksekliğinden bırakır (SRD düşme hasarı 1d6/10 ft, Prone; yakalama biter).
      const t = Object.values(state.combatants).find((c) => c.hp > 0 && c.conditions.includes('Grappled') && c.grapple?.by === actor.id);
      if (!t) return [];
      const ft = Math.floor((actor.fly ?? 0) / 2);
      const dice = `${Math.max(1, Math.min(20, Math.floor(ft / 10)))}d6`;
      return [{ ...damageEffect(t, 'srdK19', `${a.tr}: ${ft} ft düşüş`, { dice, type: 'bludgeoning' }, rng), removeCondition: 'Grappled' } as BattleEvent,
        { type: 'map_effect', rule: 'srdK19', targetId: t.id, text: `${a.tr}: Prone`, addCondition: 'Prone' }];
    }
    case 'swallow': return swallowEvents(state, actor, a, rng);
    case 'summon': return summonEvents(state, actor, a);
    case 'spell': {
      const list = a.spells ?? (a.spell ? [a.spell] : []);
      const pick = opt && list.includes(opt) ? [opt] : list;
      const targets = a.self ? [actor] : a.ally ? Object.values(state.combatants).filter((c) => c.side === actor.side && c.hp > 0 && c.pos && (!targetId || c.id === targetId))
        .sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp) : foes;
      for (const sp of pick) {
        for (const t of targets) {
          for (const how of [targetHex ? { targetHex } : { targetId: t.id }, { targetHex: hexOf(t) }]) {
            const evs = castWithoutAction(state, actor, sp, how, rng, { ...(a.level ? { level: a.level } : {}), ...(a.dc ? { dc: a.dc } : {}) });
            if (!evs) continue;
            if (!a.ally && !a.self && evs.some((e) => e.type === 'save_resolved' && state.combatants[e.targetId]?.side === actor.side)) continue;
            if (!a.twice) return evs;
            // Hellfire Spellcasting: ikinci Fireball (ikinci en iyi hedefe).
            const after = applyEvents(state, evs);
            const second = foesOf(after, after.combatants[actor.id] as Combatant).find((f) => f.id !== t.id) ?? t;
            const evs2 = castWithoutAction(after, after.combatants[actor.id] as Combatant, sp, { targetHex: hexOf(second) }, rng, { ...(a.level ? { level: a.level } : {}), ...(a.dc ? { dc: a.dc } : {}) });
            return [...evs, ...(evs2 ?? [])];
          }
        }
      }
      return [];
    }
    case 'ethereal': {
      // Ethereal Jaunt / Stride / Etherealness: Ethereal düzleme geçer (hedef alınmaz) ya da geri döner.
      const cur = actor.effects?.find((e) => e.id === `mab:${actor.id}:ethereal`);
      return cur ? [{ type: 'effect_ended', targetId: actor.id, effectId: cur.id, name: a.tr, reason: 'used' }]
        : [{ type: 'effect_added', targetId: actor.id, effect: { id: `mab:${actor.id}:ethereal`, name: a.tr, sourceId: actor.id, ethereal: true, until: state.round + 600 } as ActiveEffect }];
    }
    default:
      return [];
  }
}

/** Saldırı zarlı yetenek (Storm Bolt): menzilli saldırı, isabette hasar ve Large ya da küçükse Prone. */
function attackLike(state: BattleState, actor: Combatant, a: MonsterAbility, foes: Combatant[], rng: Rng): BattleEvent[] {
  const t = foes.find((f) => distance(hexOf(f), hexOf(actor)) * 5 <= (a.rangeFt ?? 120));
  if (!t) return [];
  const d = rollDie(20, rollTag(rng, { by: actor.id, kind: 'attack' }));
  const hit = d === 20 || (d !== 1 && d + (a.attackBonus ?? 0) >= t.ac);
  if (!hit) return [{ type: 'map_note', text: `${actor.name} → ${t.name}: ${a.tr} d20 ${d} + ${a.attackBonus} → ıska.` }];
  return [damageEffect(t, 'srdK19', `${a.tr}: d20 ${d} + ${a.attackBonus} → isabet`, { dice: d === 20 ? (a.damage ?? '1d6').replace(/^(\d+)d/, (_, n: string) => `${Number(n) * 2}d`) : a.damage ?? '1d6', type: a.damageType ?? 'thunder' }, rng),
    ...((a.conditions ?? []).includes('Prone') && !['H', 'G'].includes(t.size ?? 'M') ? [{ type: 'map_effect', rule: 'srdK19', targetId: t.id, text: `${a.tr}: Prone`, addCondition: 'Prone' } as BattleEvent] : [])];
}

function pushOne(s: BattleState, src: Combatant, t: Combatant, hexes: number, rng: Rng): BattleEvent[] {
  // Kuyruk K53: sürüm 24+ tek zorla hareket girişi (varış kuralları, çarpma).
  if (ruleVersion(s) >= MOTION_VERSION && src.pos) return forcedMove(s, t.id, 'push', hexes * 5, 'srdK19', rng, { origin: src.pos });
  let at = hexOf(t);
  const size = { cols: s.map?.tiles[0]?.length ?? 0, rows: s.map?.tiles.length ?? 0 };
  for (let i = 0; i < hexes; i++) {
    const n = ring(at, 1, size).filter((h) => distance(h, hexOf(src)) > distance(at, hexOf(src)) && !occupantAt(s, h, t.id) && terrainAt(s, h).movement === 'normal')[0];
    if (!n) break;
    at = n;
  }
  return at === hexOf(t) ? [] : [{ type: 'pushed', targetId: t.id, from: hexOf(t), to: at, by: 'srdK19' }];
}

function pullToward(s: BattleState, src: Combatant, t: Combatant, hexes: number, rng: Rng): BattleEvent[] {
  if (ruleVersion(s) >= MOTION_VERSION && src.pos) return forcedMove(s, t.id, 'pull', hexes * 5, 'srdK19', rng, { origin: src.pos });
  let at = hexOf(t);
  const size = { cols: s.map?.tiles[0]?.length ?? 0, rows: s.map?.tiles.length ?? 0 };
  for (let i = 0; i < hexes; i++) {
    if (distance(at, hexOf(src)) <= 1) break;
    const n = ring(at, 1, size).filter((h) => distance(h, hexOf(src)) < distance(at, hexOf(src)) && !occupantAt(s, h, t.id) && terrainAt(s, h).movement !== 'blocked')[0];
    if (!n) break;
    at = n;
  }
  return at === hexOf(t) ? [] : [{ type: 'pushed', targetId: t.id, from: hexOf(t), to: at, by: 'srdK19' }];
}

const treeNear = (s: BattleState, h: Offset) => [h, ...ring(h, 1, { cols: s.map?.tiles[0]?.length ?? 0, rows: s.map?.tiles.length ?? 0 })]
  .some((x) => /ağaç|tree|orman/i.test(terrainAt(s, x).name ?? ''));

/**
 * Yutma (SRD Swallow): yakaladığı (küçük ya da Large ve altı) hedef save; başarısızsa yutulur: Blinded + Restrained, hedef
 * alınamaz (tam siper), yutanın her tur başında asit (ve Remorhaz'da ateş) hasarı; yutan bir turda `escapeDamage`
 * hasar alırsa CON save'i (DC) başarısızsa kusar; yutan ölünce çıkar (`swallowCleanup`).
 */
function swallowEvents(state: BattleState, actor: Combatant, a: MonsterAbility, rng: Rng): BattleEvent[] {
  const big = a.small ? ['L', 'H', 'G'] : ['H', 'G'];
  const t = Object.values(state.combatants).find((c) => c.hp > 0 && c.side !== actor.side && c.grapple?.by === actor.id && !big.includes(c.size ?? 'M')
    && !c.effects?.some((e) => e.swallowedBy));
  if (!t) return [];
  const ev = saveEffect(t, 'srdK19', a.tr, a.save as 'str', a.dc ?? 15, rng);
  if (!(ev.type === 'map_effect' && ev.roll && !ev.roll.success)) return [ev];
  return [ev, { type: 'map_effect', rule: 'srdK19', targetId: t.id, text: `${a.tr}: yutuldu`, removeCondition: 'Grappled' },
    { type: 'effect_added', targetId: t.id, effect: { id: `swallow:${actor.id}:${t.id}`, name: `${a.tr} (${actor.name})`, sourceId: actor.id, swallowedBy: actor.id,
      grants: ['Blinded', 'Restrained'], until: state.round + 6000, swallow: { dice: a.dice ?? '2d6', type: a.type ?? 'acid', ...(a.dice2 ? { dice2: a.dice2, type2: a.type2 } : {}), escapeDamage: a.escapeDamage ?? 30, escapeDc: a.escapeDc ?? 15 } } as ActiveEffect }];
}

/** Çağırma (Animate Trees, Create Specter): SRD stat bloğuyla yeni savaşçı, sahibinin hemen ardından oynar. */
function summonEvents(state: BattleState, actor: Combatant, a: MonsterAbility): BattleEvent[] {
  if (!a.monster || !state.map) return [];
  let spots: Offset[] = [];
  if (a.fromCorpse) {
    const corpse = Object.values(state.combatants).find((c) => c.life === 'dead' && c.creatureType === 'humanoid' && c.pos && distance(hexOf(c), hexOf(actor)) <= 2 && !c.summon);
    if (!corpse) return [];
    spots = [hexOf(corpse), ...ring(hexOf(corpse), 1, { cols: state.map.tiles[0]?.length ?? 0, rows: state.map.tiles.length })].filter((h) => !occupantAt(state, h));
  } else if (a.adjacent) {
    spots = ring(hexOf(actor), 1, { cols: state.map.tiles[0]?.length ?? 0, rows: state.map.tiles.length }).filter((h) => !occupantAt(state, h) && terrainAt(state, h).movement === 'normal');
  } else {
    const size = { cols: state.map.tiles[0]?.length ?? 0, rows: state.map.tiles.length };
    for (let row = 0; row < size.rows; row++) for (let col = 0; col < size.cols; col++) {
      const h = { col, row };
      if (distance(h, hexOf(actor)) * 5 <= 60 && /ağaç|tree/i.test(terrainAt(state, h).name ?? '')) {
        const n = [h, ...ring(h, 1, size)].find((x) => !occupantAt(state, x) && terrainAt(state, x).movement === 'normal' && !spots.some((y) => y.col === x.col && y.row === x.row));
        if (n) spots.push(n);
      }
    }
  }
  const out: BattleEvent[] = [];
  const idx = state.order.indexOf(actor.id) + 1;
  for (let k = 0; k < Math.min(a.count ?? 1, spots.length); k++) {
    // Y2: aynı turda ikinci çağrı (Loathsome Limbs iki tur sonunda) aynı kimliği üretmesin (sıra kilitlenirdi).
    let id = `${actor.id}-${a.id}-${state.round}-${k}`;
    for (let n = 2; state.combatants[id] || state.order.includes(id); n++) id = `${actor.id}-${a.id}-${state.round}-${k}-${n}`;
    const base = combatantFromMonster(getMonster(a.monster), { id, name: `${getMonster(a.monster).name} (${actor.name})` });
    const kept = a.onlyAttacks ? base.attacks.filter((x) => a.onlyAttacks?.includes(x.name)) : base.attacks;
    const c: Combatant = { ...base, ...(a.onlyAttacks && kept.length ? { attacks: kept } : {}), side: actor.side, pos: spots[k] as Offset, initiative: actor.initiative,
      summon: { by: actor.id, spellId: `mab:${a.id}`, spell: a.en, level: 0, turn: 'after-owner' } };
    out.push({ type: 'summoned', ownerId: actor.id, spell: a.en, combatant: c, index: idx + k });
  }
  return out;
}

// ------------------------------------------------------------------ tur kancaları

/** Tur başı/sonu (canavarın kendi turu): Heat Aura, Barbed Hide, Mucus Cloud, güneş/akan su, yutulanların hasarı, Berserk, Hydra başları. */
export function monsterTurnEvents(state: BattleState, c: Combatant, when: 'start' | 'end', rng: Rng): BattleEvent[] {
  const p = passiveOf(state, c);
  const out: BattleEvent[] = [];
  if (!on(state) || !c.pos) return out;
  if (p && c.hp > 0) {
    for (const t of p.ownerTurn ?? []) {
      if (t.when !== when || (t.underwater && !isUnderwater(state, c))) continue;
      for (const o of Object.values(state.combatants)) {
        if (o.id === c.id || o.hp <= 0 || !o.pos) continue;
        const near = t.grappled ? (o.grapple?.by === c.id || c.grapple?.by === o.id) : distance(hexOf(o), hexOf(c)) * 5 <= (t.radiusFt ?? 5);
        if (!near) continue;
        if (t.save) {
          const ev = saveEffect(o, 'srdK19', t.name ?? 'aura', t.save, t.dc ?? 10, rng);
          out.push(ev);
          if (ev.type === 'map_effect' && ev.roll && !ev.roll.success && t.effect) out.push({ type: 'effect_added', targetId: o.id, effect: { id: `srd19:${c.id}:${t.name}:${o.id}`, name: t.name ?? 'aura', sourceId: c.id, ...t.effect, until: state.round + 600 } as ActiveEffect });
        } else if (t.dice) out.push(damageEffect(o, 'srdK19', t.name ?? `${c.name}`, { dice: t.dice, type: t.type ?? 'fire' }, rng));
      }
    }
    const dark = !!state.map && hasDarkness(state);
    if (when === 'start' && p.sunlight && state.map && !dark) out.push(damageEffect(c, 'srdK19', 'Sunlight', { dice: p.sunlight.dice, type: p.sunlight.type }, rng));
    if (when === 'end' && p.runningWater && terrainAt(state, hexOf(c)).char === 'R') out.push(damageEffect(c, 'srdK19', 'Running Water', { dice: p.runningWater.dice, type: p.runningWater.type }, rng));
    // Berserk: Bloodied başlarsa d6 = 6 → çılgın (en yakın yaratığa saldırır; taraf ayrımı yok).
    if (when === 'start' && p.berserk && c.hp <= c.maxHp / 2 && !c.effects?.some((e) => e.berserk)) {
      const d6 = rollDie(6, rollTag(rng, { by: c.id }));
      out.push({ type: 'map_note', text: `${c.name}: Berserk d6 = ${d6}` });
      if (d6 === 6) out.push({ type: 'effect_added', targetId: c.id, effect: { id: `srd19:${c.id}:berserk`, name: 'Berserk', sourceId: c.id, berserk: true, until: state.round + 6000 } as ActiveEffect });
    }
    // Hydra: turunun sonunda ölen her baş için iki baş (son turundan beri ateş hasarı almadıysa), 20 HP.
    if (when === 'end' && p.heads && (c.headsLost ?? 0) > 0 && (c.heads ?? 0) > 0) {
      const grow = c.headsFire ? 0 : 2 * (c.headsLost ?? 0);
      out.push({ type: 'heads_changed', actorId: c.id, heads: (c.heads ?? 0) + grow, lost: 0, fire: false, turnHp: c.headsTurnHp ?? c.hp });
      if (grow > 0 && c.hp < c.maxHp) out.push({ type: 'healed', actorId: c.id, targetId: c.id, label: 'Multiple Heads', amount: Math.min(20, c.maxHp - c.hp), targetHpAfter: Math.min(c.maxHp, c.hp + 20) });
    }
  }
  // Yutulanlar: yutanın tur başında hasar.
  if (when === 'start' && c.hp > 0) {
    for (const o of Object.values(state.combatants)) {
      const sw = o.effects?.find((e) => e.swallowedBy === c.id)?.swallow;
      if (!sw || o.hp <= 0) continue;
      out.push(damageEffect(o, 'srdK19', `${c.name}: mide`, { dice: sw.dice, type: sw.type }, rng));
      if (sw.dice2) out.push(damageEffect(o, 'srdK19', `${c.name}: mide`, { dice: sw.dice2, type: sw.type2 ?? 'fire' }, rng));
    }
  }
  return out;
}

/**
 * Her turun sonunda (kimin turu olursa olsun; SRD "on a single turn", "ends any turn"): Troll Loathsome Limbs (Bloodied
 * ve o turda 15+ hasar: uzuv kopar, Troll Limb, 1 Exhaustion) ve tur başı HP'sinin sıfırlanması (Hydra, Troll).
 */
export function anyTurnEndEvents(state: BattleState): BattleEvent[] {
  if (!on(state)) return [];
  const out: BattleEvent[] = [];
  for (const c of Object.values(state.combatants)) {
    const p = passiveOf(state, c);
    if (!p || (!p.heads && !p.loathsomeLimbs) || c.hp <= 0) continue;
    if (p.loathsomeLimbs && c.hp <= c.maxHp / 2 && (c.headsTurnHp ?? c.maxHp) - c.hp >= p.loathsomeLimbs.slashing && (c.resources?.['mab:loathsome-limbs'] ?? 0) > 0) {
      const limb = summonEvents(state, c, { id: 'loathsome-limbs', en: 'Loathsome Limbs', tr: 'İğrenç Uzuvlar', cost: 'action', kind: 'summon', monster: 'troll-limb', count: 1, adjacent: true } as MonsterAbility);
      out.push({ type: 'feature_used', actorId: c.id, feature: 'mab:loathsome-limbs', remaining: (c.resources?.['mab:loathsome-limbs'] ?? 1) - 1 }, ...limb,
        { type: 'exhaustion_changed', targetId: c.id, level: Math.min(6, (c.exhaustion ?? 0) + 1), reason: 'Loathsome Limbs' });
    }
    // Hydra Multiple Heads: bir turda 25+ hasar → bir baş ölür; hiç baş kalmazsa ölür.
    const lose = p.heads && (c.headsTurnHp ?? c.hp) - c.hp >= 25 ? 1 : 0;
    const heads = Math.max(0, (c.heads ?? p.heads ?? 0) - lose);
    out.push({ type: 'heads_changed', actorId: c.id, heads, lost: (c.headsLost ?? 0) + lose, fire: !!c.headsFire, turnHp: c.hp });
    if (p.heads && heads === 0) out.push(damageEffect(c, 'srdK19', 'Multiple Heads: bütün başlar öldü', { dice: String(c.hp + c.maxHp), type: 'force' }, rngZero));
  }
  return out;
}

/**
 * Komut sonu: ölüm patlaması (Death Burst / Death Throes, bir kez), yutan ölünce yutulanlar çıkar (Prone), yutan bir
 * turda çok hasar alınca kusar, Hydra baş kaybı (bir turda 25+ hasar), Misty Escape (0 HP'de sis olup kaçar).
 */
export function monsterAfterEvents(state: BattleState, rng: Rng, cmdEvents: BattleEvent[] = []): BattleEvent[] {
  // Ölüm patlaması savaşı bitiren son vuruşta da olur (SRD: öldüğünde patlar).
  if (!on(state) || (state.status !== 'active' && state.status !== 'finished')) return [];
  const out: BattleEvent[] = [];
  let cur = state;
  for (const c of Object.values(state.combatants)) {
    const p = passiveOf(state, c);
    if (p?.deathBurst && c.hp <= 0 && !c.burstDone && c.pos) {
      const b = p.deathBurst;
      const fake: Combatant = { ...c, hp: 1 };
      const ev = [{ type: 'burst_done', actorId: c.id } as BattleEvent,
        ...legendarySave(cur, fake, { id: 'death-burst', tr: 'Ölüm Patlaması', en: 'Death Burst', kind: 'save', save: b.save, dc: b.dc, damage: b.dice, damageType: b.type, half: b.half,
          conditions: b.conditions, area: { shape: 'emanation', sizeFt: b.radiusFt, origin: 'self' } }, Object.values(cur.combatants).filter((o) => o.id !== c.id && o.hp > 0), rng)];
      if (b.dice2) ev.push(...legendarySave(cur, fake, { id: 'death-burst-2', tr: 'Ölüm Patlaması', en: 'Death Burst', kind: 'save', save: b.save, dc: b.dc, damage: b.dice2, damageType: b.type2, half: b.half,
        area: { shape: 'emanation', sizeFt: b.radiusFt, origin: 'self' } }, Object.values(cur.combatants).filter((o) => o.id !== c.id && o.hp > 0), rng));
      out.push(...ev); cur = applyEvents(cur, ev);
    }
    if (p?.mistyEscape && c.hp <= 0 && !c.summon?.gone && c.life !== 'dead') {
      const ev: BattleEvent[] = [{ type: 'map_note', text: `${c.name}: Misty Escape — sis olup dinlenme yerine kaçtı.` }, { type: 'summon_vanished', id: c.id, reason: 'fled' } as unknown as BattleEvent];
      out.push(...ev); cur = applyEvents(cur, ev);
    }
  }
  // Sphinx of Valor Roar: kükremeler sırayla (First → Second → Third); kullanılınca sıradakinin kilidi açılır.
  for (const c of Object.values(cur.combatants)) {
    const seq = passiveOf(cur, c)?.roarSequence;
    if (!seq || c.hp <= 0) continue;
    const idx = seq.map((n) => c.attacks.findIndex((a) => a.name === n));
    const stage = c.resources?.['mab:roar'] ?? 0;
    const usedNow = idx[stage] !== undefined && idx[stage]! >= 0 && c.rechargeUsed.includes(idx[stage]!);
    if (usedNow && stage + 1 < seq.length) {
      const ev: BattleEvent[] = [{ type: 'feature_used', actorId: c.id, feature: 'mab:roar', remaining: stage + 1 },
        { type: 'recharge_rolled', actorId: c.id, attackIndex: idx[stage + 1]!, d6: 0, recharged: true }];
      out.push(...ev); cur = applyEvents(cur, ev);
    }
  }
  // Ochre Jelly / Black Pudding Split (tepki): Large ya da Medium ve 10+ HP iken Bloodied olur ya da Lightning/Slashing
  // hasar alırsa iki küçük jöleye bölünür (HP paylaşılır; yeni jöle kendi inisiyatifinde, burada sahibinin ardından).
  for (const c of Object.values(cur.combatants)) {
    if (!passiveOf(cur, c)?.split || c.hp < 10 || !['L', 'M'].includes(c.size ?? 'M') || c.economy.reaction || isIncapacitatedNow(c)) continue;
    let dmg = 0; let typed = false;
    for (const e of cmdEvents) {
      if (e.type === 'attack_resolved' && e.targetId === c.id && e.hit) { dmg += e.appliedDamage ?? 0; typed ||= ['slashing', 'lightning'].includes((e.damageType ?? '').toLowerCase()); }
      if (e.type === 'save_resolved' && e.targetId === c.id) { dmg += e.appliedDamage; typed ||= ['slashing', 'lightning'].includes(e.damageType.toLowerCase()); }
      if (e.type === 'map_effect' && e.targetId === c.id && e.damage) { dmg += e.damage.applied; typed ||= ['slashing', 'lightning'].includes(e.damage.type.toLowerCase()); }
    }
    const becameBloodied = dmg > 0 && c.hp <= c.maxHp / 2 && c.hp + dmg > c.maxHp / 2;
    if (!(typed || becameBloodied)) continue;
    const half = Math.floor(c.hp / 2);
    const smaller = c.size === 'L' ? 'M' : 'S';
    const twin = summonEvents(cur, c, { id: 'split', en: 'Split', tr: 'Bölünme', cost: 'action', kind: 'summon', monster: c.monsterId, count: 1, adjacent: true } as MonsterAbility)
      .map((e) => (e.type === 'summoned' ? { ...e, combatant: { ...e.combatant, hp: half, maxHp: half, size: smaller, summon: undefined, name: `${c.name} (bölünmüş)` } } as BattleEvent : e));
    if (!twin.length) continue;
    const ev: BattleEvent[] = [{ type: 'reaction_used', actorId: c.id, reaction: 'split', name: 'Split', trigger: 'damaged' as never },
      { type: 'map_effect', rule: 'srdK19', targetId: c.id, text: `${c.name}: Split`, hpAfter: c.hp - half },
      { type: 'effect_added', targetId: c.id, effect: { id: `srd19:${c.id}:split`, name: 'Split', sourceId: c.id, size: -1, until: 1e9 } as ActiveEffect }, ...twin];
    out.push(...ev); cur = applyEvents(cur, ev);
  }
  // N/Day saldırıları: kullanılınca kalan hak varsa yeniden açılır.
  for (const c of Object.values(cur.combatants)) {
    for (const [k, left] of Object.entries(c.resources ?? {})) {
      if (!k.startsWith('mab:day:') || left <= 0) continue;
      const i = c.attacks.findIndex((a) => a.name === k.slice(8));
      if (i < 0 || !c.rechargeUsed.includes(i)) continue;
      const ev: BattleEvent[] = [{ type: 'feature_used', actorId: c.id, feature: k, remaining: left - 1 }, { type: 'recharge_rolled', actorId: c.id, attackIndex: i, d6: 0, recharged: true }];
      out.push(...ev); cur = applyEvents(cur, ev);
    }
  }
  // Troll Loathsome Limbs: tur sonunda Bloodied ve o turda 15+ hasar aldıysa bir uzuv kopar (Troll Limb, 1 Exhaustion).
  // Yutulanlar: yutan öldüyse ya da yeterli hasar aldıysa çıkar.
  for (const o of Object.values(cur.combatants)) {
    const e = o.effects?.find((x) => x.swallowedBy);
    if (!e?.swallowedBy || !e.swallow) continue;
    const by = cur.combatants[e.swallowedBy];
    const dead = !by || by.hp <= 0;
    if (dead) {
      out.push({ type: 'effect_ended', targetId: o.id, effectId: e.id, name: e.name, reason: 'expired' }, { type: 'map_effect', rule: 'srdK19', targetId: o.id, text: 'Yutulan dışarı çıktı (Prone)', addCondition: 'Prone' });
    } else if (e.swallow.escapeDamage > 0 && (by.headsTurnHp ?? by.maxHp) - by.hp >= e.swallow.escapeDamage && !by.effects?.some((x) => x.id === `srd19:${by.id}:regurgitated:${state.round}`)) {
      const ev = saveEffect(by, 'srdK19', 'Kusma (CON save)', 'con', e.swallow.escapeDc, rng);
      out.push(ev, { type: 'effect_added', targetId: by.id, effect: { id: `srd19:${by.id}:regurgitated:${state.round}`, name: 'Kusma denendi', sourceId: by.id, until: state.round } as ActiveEffect });
      if (ev.type === 'map_effect' && ev.roll && !ev.roll.success) out.push({ type: 'effect_ended', targetId: o.id, effectId: e.id, name: e.name, reason: 'expired' }, { type: 'map_effect', rule: 'srdK19', targetId: o.id, text: 'Kusuldu (Prone)', addCondition: 'Prone' });
    }
  }
  return out;
}

export const hasMonsterTrait = (state: BattleState, c: Combatant | undefined, t: string): boolean => !!c && on(state) && !!c.traits?.includes(t);

// ------------------------------------------------------------------ Kuyruk 19: tepkiler (Ink Cloud, Pursuit; srdK19)

/** Ink Cloud (SRD): su altında; ahtapotun altıgeni (10 ft küpte komşuları da) 10 tur yoğun örtü, yüzme hızı kadar uzaklaşır. */
export function inkEvents(state: BattleState, id: string, on: 'turnEnd' | 'damaged', rng: Rng): BattleEvent[] {
  const o = state.combatants[id];
  if (!o || !o.pos || !state.map || !canReact(o) || !isUnderwater(state, o)) return [];
  const spec = (o.reactions ?? []).find((r) => r.kind === 'ink' && (r.on ?? 'turnEnd') === on && reactionUsable(o, r));
  if (!spec) return [];
  const size = { cols: state.map.tiles[0]?.length ?? 0, rows: state.map.tiles.length };
  const hexes = (spec.sizeFt ?? 5) >= 10 ? [o.pos, ...ring(o.pos, 1, size)] : [o.pos];
  const zone: SpellZone = { id: `ink:${o.id}:${state.round}`, spellId: 'ink-cloud', name: spec.name, casterId: o.id, side: o.side, dc: 0, slotLevel: 0, hexes,
    until: state.round + 10, spec: { obscured: 'heavy', color: '#1d1a2e', icon: '🦑' } } as SpellZone;
  const out: BattleEvent[] = [reactionUsed(o, spec, on === 'damaged' ? 'damaged' : 'turnStart'), { type: 'zone_created', zone }];
  const after = applyEvents(state, out);
  const me = after.combatants[o.id] as Combatant;
  const foes = Object.values(after.combatants).filter((c) => c.side !== o.side && c.hp > 0 && c.pos);
  // Yüzme hızı kadar: geri çekilme yarım hız kullanır; harcanmış hareket eksiye çekilerek bütçe ikiye katlanır.
  out.push(...retreatMove(after, { ...me, movementUsed: -speedHexes(me) }, foes, rng));
  return out;
}
registerInk(inkEvents);

/**
 * Tur sonu tepkileri: Ink Cloud (Octopus: bir yaratık 5 ft'te turunu bitirince) ve Pursuit (Nalfeshnee: 120 ft'te
 * gördüğü bir düşman hareket ederek turunu bitirince, ona 10 ft içindeki boş altıgene ışınlanır).
 */
export function reactionTurnEndEvents(state: BattleState, enderId: string, rng: Rng): BattleEvent[] {
  if (!on(state) || !state.map) return [];
  const ender = state.combatants[enderId];
  if (!ender || !ender.pos || ender.hp <= 0) return [];
  const out: BattleEvent[] = [];
  let cur = state;
  for (const c of Object.values(state.combatants)) {
    if (c.side === ender.side || !c.pos || !c.reactions?.length) continue;
    const me = cur.combatants[c.id] as Combatant;
    if (!me.pos || !canReact(me)) continue;
    if (me.reactions?.some((r) => r.kind === 'ink') && distance(me.pos, ender.pos) <= 1) {
      const ev = inkEvents(cur, me.id, 'turnEnd', rng);
      out.push(...ev); cur = applyEvents(cur, ev);
      continue;
    }
    const spec = me.reactions?.find((r) => r.kind === 'pursuit' && reactionUsable(me, r));
    if (!spec || (ender.movementUsed ?? 0) <= 0 || !canSee(cur, me, ender)) continue;
    const d = distance(me.pos, ender.pos);
    if (d * 5 > (spec.rangeFt ?? 120) || d <= 2) continue;
    const size = { cols: cur.map!.tiles[0]?.length ?? 0, rows: cur.map!.tiles.length };
    const spots = [...ring(ender.pos, 1, size), ...ring(ender.pos, 2, size)]
      .filter((h) => !occupantAt(cur, h, me.id) && terrainAt(cur, h).movement === 'normal')
      .sort((a, b) => distance(a, ender.pos as Offset) - distance(b, ender.pos as Offset) || distance(a, me.pos as Offset) - distance(b, me.pos as Offset));
    const to = spots[0];
    if (!to) continue;
    const ev: BattleEvent[] = [reactionUsed(me, spec, 'turnStart', ender.id), { type: 'teleported', actorId: me.id, from: me.pos, to, label: spec.name }];
    out.push(...ev); cur = applyEvents(cur, ev);
  }
  return out;
}
