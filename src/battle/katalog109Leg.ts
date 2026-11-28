/**
 * Görev KATALOG-GUC-TAM (kural sürümü 109): yeni efsanevi eylem türleri (yalnız `data/katalog-gucler.json` eklemeleri):
 * - `heal` (Star Tear): menzildeki en yaralı ya da olumsuz durumlu dost (kendisi hariç): durumlar silinir, zar kadar iyileşir.
 * - `seal` (Seal-Melting Talon): menzildeki en düşük canlı düşman 1 tur mühürlenir (0 HP'de ölüm save'i yok, iyileşemez).
 * - `pull` (Seal Pull): menzildeki (isteğe bağlı eşya taşıyan) düşman save atar, başarısızsa çekilir.
 * Saf; `rng` enjekte.
 */
import { distance, type Offset } from '../rules/hex';
import { rollDice, rollTag, type Rng } from '../rules/dice';
import { canSee, saveEffect } from './maprules';
import { forcedMove } from './motion';
import type { LegendaryAction } from './boss';
import type { BattleEvent, BattleState, Combatant } from './types';

const hexOf = (c: Combatant) => c.pos as Offset;
const within = (a: Combatant, b: Combatant, ft: number) => !!a.pos && !!b.pos && distance(hexOf(a), hexOf(b)) * 5 <= ft;
/** Taşıdığı eşyalardan biri verilen öneklerden biriyle başlıyor mu. */
export const carries = (c: Combatant, prefixes: string[] | undefined): boolean => !prefixes?.length || !!c.carried?.some((x) => prefixes.some((p) => x === p || x.startsWith(p)));

export function k109LegendaryEvents(s: BattleState, b: Combatant, a: LegendaryAction, foes: Combatant[], rng: Rng): BattleEvent[] {
  if (a.kind === 'heal') {
    const bad = a.cleanse ?? [];
    const allies = Object.values(s.combatants).filter((c) => c.id !== b.id && c.side === b.side && c.hp > 0 && !c.summon?.gone && within(b, c, a.rangeFt ?? 60)
      && (c.hp < c.maxHp * 0.75 || c.conditions.some((x) => bad.includes(x))))
      .sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp || x.id.localeCompare(y.id));
    const t = allies[0];
    if (!t) return [];
    const out: BattleEvent[] = [];
    for (const x of t.conditions.filter((y) => bad.includes(y))) out.push({ type: 'map_effect', rule: 'legendaryActions', targetId: t.id, text: `${a.tr}: ${x} silindi`, removeCondition: x });
    for (const e of t.effects ?? []) if (e.grants?.some((g) => bad.includes(g)) && e.sourceId !== t.id) out.push({ type: 'effect_ended', targetId: t.id, effectId: e.id, name: e.name, reason: 'dispelled' });
    const amount = Math.min(t.maxHp - t.hp, rollDice(a.dice ?? '6d10+10', rollTag(rng, { by: b.id, kind: 'heal' })).total);
    if (amount > 0) out.push({ type: 'healed', actorId: b.id, targetId: t.id, label: a.tr, amount, targetHpAfter: t.hp + amount });
    return out;
  }
  if (a.kind === 'seal') {
    const t = foes.filter((f) => within(b, f, a.rangeFt ?? 60) && canSee(s, b, f) && !f.effects?.some((e) => e.k109?.sealed))
      .sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp || x.id.localeCompare(y.id))[0];
    if (!t) return [];
    return [{ type: 'effect_added', targetId: t.id, effect: { id: `leg:${b.id}:${a.id}:${t.id}`, name: a.tr, sourceId: b.id, until: s.round + 1, icon: '🔒', k109: { sealed: true } } }];
  }
  if (a.kind === 'pull') {
    const t = foes.filter((f) => within(b, f, a.rangeFt ?? 30) && distance(hexOf(f), hexOf(b)) > 1 && carries(f, a.needsItem) && canSee(s, b, f))
      .sort((x, y) => distance(hexOf(y), hexOf(b)) - distance(hexOf(x), hexOf(b)) || x.id.localeCompare(y.id))[0];
    if (!t || !b.pos) return [];
    const sv = saveEffect(t, 'legendaryActions', a.tr, a.save ?? 'str', a.dc ?? 15, rng);
    const failed = sv.type === 'map_effect' && sv.roll && !sv.roll.success;
    return [sv, ...(failed ? forcedMove(s, t.id, 'pull', a.pullFt ?? 30, b.id, rng, { origin: b.pos }) : [])];
  }
  return [];
}
