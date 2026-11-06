/**
 * Kuyruk K54c (kural sürümü 28): imza alt sınıfların ikinci yarısı. Veri `data/imza.json` (pasif `surumMin: 28`).
 * - Şair: Ölümsüz Dize (dost 0 HP'ye düşünce tepkiyle 1 HP + seviye kadar geçici can; komut sonu, her hasar kaynağı).
 *   Nakarat ve Usta Şair `imza.ts` eylem yolunda.
 * - İmparator: Ferman (Action Surge'de bir dosta tek seferlik ek eylem, Haste ek eylem yolu), Ölümsüz Taht'ın dost
 *   avantajı (ilk saldırı), Buyruk'ta dostun tepkisi ve yer değiştirme (`imza.ts`).
 * - Astrolog: Yazgı Değişir (dosta isabeti ıskaya çeviren tepki; bedel: sonraki turunun sonuna dek saldırı
 *   dezavantajı), Yazgı Mührü (mühürlüye turun ilk silah saldırısı kendiliğinden isabet, dostların isabetine +PB).
 * - Geride Kalan: Yaralı Kalp tavanı ve Yıpranma (Moral kapalıyken aynı alanlarla), Dostunun Yası (tepki: öfke +
 *   geçici can, 1 puan), Küllerden Doğan (öfke + dostlara Motivasyon ya da geçici can), Öfkeyle Ayakta / Alışkın Acı
 *   (`morale.ts` etki bayrakları).
 * Saf; `rng` enjekte.
 */
import { imzaOn, imzaPasifler } from './imzaCore';
import { ruleVersion } from './ruleVersion';
import { canReact, reactionUsed, registerAllyHit } from './reactions';
import { registerCommandEnd } from './turnHooks';
import { moraleOn } from './morale';
import { askReaction } from '../rules/reactionChoice';
import { isIncapacitated } from '../rules/conditions';
import { distance } from '../rules/hex';
import { resourceLeft, type ActiveEffect, type BattleEvent, type BattleState, type Combatant } from './types';

export const K54C_VERSION = 28;
type Etki = Record<string, unknown>;
const ftOf = (a: Combatant, b: Combatant) => (a.pos && b.pos ? distance(a.pos, b.pos) * 5 : 0);
const alive = (c: Combatant | undefined): c is Combatant => !!c && c.hp > 0 && c.life !== 'dead' && !c.summon?.gone;
/** K54c pasifinin etkisi (alt sınıf, seviye, sürüm 28+, ev kuralı). */
export function pasif28(state: BattleState, c: Combatant | undefined, ozellik: string): Etki | null {
  if (!c?.imza || ruleVersion(state) < K54C_VERSION || !imzaOn(state, c.imza)) return null;
  return imzaPasifler(c).find((p) => p.ozellik === ozellik)?.etki ?? null;
}
const used = (c: Combatant, res: string): BattleEvent => ({ type: 'feature_used', actorId: c.id, feature: res, remaining: resourceLeft(c, res) - 1 });
const fx = (target: Combatant, e: Omit<ActiveEffect, 'sourceId'> & { sourceId?: string }, owner: Combatant): BattleEvent =>
  ({ type: 'effect_added', targetId: target.id, effect: { sourceId: owner.id, ...e } as ActiveEffect });

// ---------------------------------------------------------------- İmparator: Ferman

/** Action Surge kullanılınca: 60 ft içindeki bir dosta (en çok saldırılı, sonra en yakın) tek seferlik ek eylem. */
export function edictEvents(state: BattleState, emperor: Combatant): BattleEvent[] {
  const p = pasif28(state, emperor, 'edict')?.ferman as { menzilFt: number; kaynak: string } | undefined;
  if (!p || resourceLeft(emperor, p.kaynak) < 1) return [];
  const ally = Object.values(state.combatants).filter((c) => alive(c) && c.id !== emperor.id && c.side === emperor.side && !c.civilian && !isIncapacitated(c.conditions)
    && ftOf(emperor, c) <= p.menzilFt && !c.effects?.some((e) => e.extraActionOnce))
    .sort((a, b) => b.attacksPerAction - a.attacksPerAction || ftOf(emperor, a) - ftOf(emperor, b) || a.id.localeCompare(b.id))[0];
  if (!ally) return [];
  return [used(emperor, p.kaynak), fx(ally, { id: `imza:ferman:${emperor.id}`, name: 'Ferman', until: state.round + 1, extraAction: true, extraActionOnce: true, icon: '📜' } as ActiveEffect, emperor)];
}

// ---------------------------------------------------------------- Astrolog: Yazgı Değişir, Yazgı Mührü

registerAllyHit((state, ctx, rng) => {
  const t = ctx.target;
  for (const a of Object.values(state.combatants)) {
    if (a.id === t.id || a.side !== t.side || !alive(a) || !canReact(a)) continue;
    const p = pasif28(state, a, 'fate-turned')?.yazgi as { menzilFt: number; kaynak: string } | undefined;
    if (!p || resourceLeft(a, p.kaynak) < 1 || ftOf(a, t) > p.menzilFt) continue;
    const heavy = ctx.damage >= Math.max(6, Math.ceil(t.hp / 3)) || ctx.damage >= t.hp || ctx.critical;
    const ans = askReaction(rng, { reactorId: a.id, trigger: 'ally', sourceId: ctx.attacker.id, info: { label: 'Yazgı Değişir', total: ctx.total, ac: ctx.ac, damage: ctx.damage },
      options: [{ id: 'imza-yazgi', name: 'Yazgı Değişir' }], suggested: heavy ? { option: 'imza-yazgi' } : null });
    if (ans?.option !== 'imza-yazgi') continue;
    return { name: 'Yazgı Değişir', events: [used(a, p.kaynak), reactionUsed(a, { id: 'imza-yazgi', name: 'Yazgı Değişir' }, 'ally', ctx.attacker.id),
      fx(a, { id: `imza:yazgi-bedel:${a.id}`, name: 'Yazgı Değişir (bedel)', until: state.round + 1, attackDis: {}, icon: '🌘' } as ActiveEffect, a)] };
  }
  return null;
});

/** Yazgı Mührü: saldıranın bu turdaki ilk saldırısı mühürlüye mi (kendiliğinden isabet; `key` saldıranın tur işareti). */
export function sealAutoHit(state: BattleState, attacker: Combatant, target: Combatant, key: string): boolean {
  const seal = target.effects?.find((e) => e.fateSeal);
  if (!seal || ruleVersion(state) < K54C_VERSION) return false;
  const owner = state.combatants[seal.sourceId];
  return !!owner && owner.side === attacker.side && attacker.traitTurns?.['imza:muhur'] !== key;
}
/** Yazgı Mührü: mühürlüye isabet eden dostun ek hasarı (mühürleyenin yeterliliği). */
export function sealBonus(state: BattleState, attacker: Combatant, target: Combatant): number {
  const seal = target.effects?.find((e) => e.fateSeal);
  if (!seal?.fateSeal || ruleVersion(state) < K54C_VERSION) return 0;
  const owner = state.combatants[seal.sourceId];
  return owner && owner.side === attacker.side ? seal.fateSeal.pb : 0;
}

// ---------------------------------------------------------------- Geride Kalan: Yaralı Kalp, Yıpranma

/** Savaş başı (withImza): Yaralı Kalp tavanı (üçte bir); Moral kapalıyken Yıpranma havuzu aynı alanlarla. */
export function woundedHeartPatch(state: BattleState, c: Combatant): Partial<Combatant> | null {
  const p = pasif28(state, c, 'wounded-heart')?.yaraliKalp as { bolen: number } | undefined;
  if (!p) return null;
  const normal = c.moralMax ?? (3 + Math.max(0, c.modifiers.wis) + c.proficiency);
  const cap = Math.max(1, Math.floor(normal / p.bolen));
  return { moralMax: cap, moral: Math.min(c.moral ?? cap, cap), yipranmaNormal: normal };
}
const moralEv = (c: Combatant, delta: number, reason: 'dost' | 'korku' | 'toparlama', byId?: string): BattleEvent | null => {
  if (c.moralMax === undefined) return null;
  const now = c.moral ?? c.moralMax;
  const to = Math.max(0, Math.min(c.moralMax, now + delta));
  return to === now ? null : { type: 'moral_changed', targetId: c.id, delta: to - now, moral: to, reason, ...(byId ? { byId } : {}) };
};
const freeRage = (c: Combatant): BattleEvent | null => (c.rage ? null
  : { type: 'rage_started', actorId: c.id, added: (c.rageResist ?? []).filter((r) => !c.resistances.includes(r)) });

registerCommandEnd((before, next, events, _cmd, rng) => {
  if (ruleVersion(next) < K54C_VERSION || next.status !== 'active') return [];
  const out: BattleEvent[] = [];
  const fell = Object.values(next.combatants).filter((c) => (before.combatants[c.id]?.hp ?? 0) > 0 && c.hp <= 0 && c.life !== 'dead' && !c.summon);
  const collapsedNow = Object.values(next.combatants).filter((c) => !before.combatants[c.id]?.effects?.some((e) => e.id === 'moral:cokmus') && c.effects?.some((e) => e.id === 'moral:cokmus'));
  // Şair: Ölümsüz Dize (her hasar kaynağı; komut sonunda).
  for (const a of fell) {
    for (const b of Object.values(next.combatants)) {
      if (b.id === a.id || b.side !== a.side || !alive(b) || !canReact(b)) continue;
      const p = pasif28(next, b, 'undying-verse')?.olumsuz as { menzilFt: number; kaynak: string } | undefined;
      if (!p || resourceLeft(b, p.kaynak) < 1 || ftOf(b, a) > p.menzilFt) continue;
      const ans = askReaction(rng, { reactorId: b.id, trigger: 'ally', sourceId: a.id, info: { label: 'Ölümsüz Dize' }, options: [{ id: 'imza-olumsuz-dize', name: 'Ölümsüz Dize' }], suggested: { option: 'imza-olumsuz-dize' } });
      if (ans?.option !== 'imza-olumsuz-dize') continue;
      out.push(used(b, p.kaynak), reactionUsed(b, { id: 'imza-olumsuz-dize', name: 'Ölümsüz Dize' }, 'ally', a.id),
        { type: 'healed', actorId: b.id, targetId: a.id, label: 'Ölümsüz Dize', amount: 1, targetHpAfter: 1 }, { type: 'temp_hp', targetId: a.id, amount: b.level, label: 'Ölümsüz Dize' });
      break;
    }
  }
  // Geride Kalan: Dostunun Yası (dost düştü ya da çöktü).
  for (const a of [...fell, ...collapsedNow]) {
    for (const g of Object.values(next.combatants)) {
      if (g.id === a.id || g.side !== a.side || !alive(g) || !canReact(g) || out.some((e) => e.type === 'reaction_used' && e.actorId === g.id)) continue;
      const p = pasif28(next, g, 'mourning-wrath')?.yas as { menzilFt: number; kaynak: string } | undefined;
      if (!p || resourceLeft(g, p.kaynak) < 1 || ftOf(g, a) > p.menzilFt) continue;
      const ans = askReaction(rng, { reactorId: g.id, trigger: 'ally', sourceId: a.id, info: { label: 'Dostunun Yası' }, options: [{ id: 'imza-yas', name: 'Dostunun Yası' }], suggested: { option: 'imza-yas' } });
      if (ans?.option !== 'imza-yas') continue;
      const r = freeRage(g);
      const m = moralEv(g, -1, 'dost');
      out.push(used(g, p.kaynak), reactionUsed(g, { id: 'imza-yas', name: 'Dostunun Yası' }, 'ally', a.id), ...(r ? [r] : []),
        { type: 'temp_hp', targetId: g.id, amount: 2 * g.level, label: 'Dostunun Yası' }, ...(m ? [m] : []));
    }
  }
  // Ölüme direnme sonrası (Death Ward düştü, ayakta): Küllerden Doğan, Ölümsüz Taht.
  for (const c of Object.values(next.combatants)) {
    const had = (id: string) => !!before.combatants[c.id]?.effects?.some((e) => e.id === id) && !c.effects?.some((e) => e.id === id) && c.hp > 0;
    if (had('imza:imza_geride_kalan/risen-from-ashes') && pasif28(next, c, 'risen-from-ashes')) {
      const r = freeRage(c);
      if (r) out.push(r);
      for (const a of Object.values(next.combatants)) {
        if (a.id === c.id || a.side !== c.side || !alive(a) || ftOf(c, a) > 30) continue;
        const m = moraleOn(next) ? moralEv(a, 1, 'toparlama', c.id) : null;
        out.push(m ?? { type: 'temp_hp', targetId: a.id, amount: c.level, label: 'Küllerden Doğan' });
      }
    }
    if (had('imza:imza_imparator/undying-throne') && pasif28(next, c, 'undying-throne-allies')) {
      for (const a of Object.values(next.combatants)) {
        if (a.id === c.id || a.side !== c.side || !alive(a) || ftOf(c, a) > 30) continue;
        out.push(fx(a, { id: `imza:olumsuz-taht:${c.id}`, name: 'Ölümsüz Taht', until: next.round + 10, firstRoll: { mode: 'advantage', on: ['attack'] }, icon: '👑' } as ActiveEffect, c));
      }
    }
  }
  // Yıpranma (Moral kapalıyken, yalnız Geride Kalan): ilk kez yarı canın altı, kritik vuruş yemek.
  if (!moraleOn(next)) {
    for (const g of Object.values(next.combatants)) {
      if (!alive(g) || g.moralMax === undefined || !pasif28(next, g, 'wounded-heart')) continue;
      const b = before.combatants[g.id];
      let loss = 0;
      const half: BattleEvent[] = [];
      if (b && b.hp >= g.maxHp / 2 && g.hp < g.maxHp / 2 && !g.traitTurns?.['imza:yipranma-yari']) { loss++; half.push({ type: 'trait_turn', actorId: g.id, trait: 'imza:yipranma-yari', key: 'bir' }); }
      loss += events.filter((e) => e.type === 'attack_resolved' && e.targetId === g.id && e.critical).length;
      const m = loss ? moralEv(g, -loss, 'dost') : null;
      out.push(...half, ...(m ? [m] : []));
    }
  }
  return out;
});
