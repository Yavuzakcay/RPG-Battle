/**
 * Görev B94 (kural sürümü 94): Druid, Paladin ve Ranger özelliklerinin yapay zekâ kararları (basit kurallar, yalnız 94+;
 * sınıf adı yok, özellik etkisinin türünden). Komutu motor dener (`ok`: ai.ts `tryCmd`); aday sayısı küçük (YZ süresi).
 * - Land's Aid (`landsAid`): 0 HP'deki dost alandaysa onu kaldırmak için, yoksa iki ya da daha çok düşman kümesine.
 * - Nature's Sanctuary (`sanctuary`): yarı canın altındaki kendisi ya da bitişik dost, yakında düşman varken.
 */
import { distance, type Offset } from '../../rules/hex';
import { b94On } from '../b94Surum';
import { resourceLeft, type BattleState, type Combatant, type Command, type UsableFeature } from '../types';

type Ok = (c: Command) => boolean;
const ftBetween = (a: Offset, b: Offset) => distance(a, b) * 5;
const usable = (actor: Combatant, f: UsableFeature) => !f.resource || resourceLeft(actor, f.resource) > 0;

/** Eylemle kullanılan Druid kararları (Land's Aid, Nature's Sanctuary). */
export function druidChoice94(state: BattleState, actor: Combatant, foes: Combatant[], canAct: boolean, ok: Ok): Command | null {
  if (!b94On(state) || !canAct || !actor.pos || !state.map || foes.length === 0) return null;
  const feats = actor.features ?? [];
  const allies = Object.values(state.combatants).filter((c) => c.side === actor.side && !c.civilian && !c.summon && c.life !== 'dead' && !!c.pos);
  const aid = feats.find((f) => f.effect.kind === 'landsAid' && usable(actor, f));
  if (aid && aid.effect.kind === 'landsAid') {
    const e = aid.effect;
    const r = Math.round(e.radiusFt / 5);
    const down = allies.find((c) => c.hp <= 0 && ftBetween(actor.pos!, c.pos!) <= e.rangeFt);
    const spots: Offset[] = down ? [down.pos!] : foes.filter((c) => c.pos && ftBetween(actor.pos!, c.pos) <= e.rangeFt)
      .map((c) => ({ at: c.pos!, n: foes.filter((o) => o.pos && distance(o.pos, c.pos!) <= r).length }))
      .filter((x) => x.n >= 2).sort((a, b) => b.n - a.n).slice(0, 2).map((x) => x.at);
    for (const to of spots) {
      const cmd: Command = { type: 'use_feature', actorId: actor.id, feature: aid.key, to };
      if (ok(cmd)) return cmd;
    }
  }
  const sanct = feats.find((f) => f.effect.kind === 'sanctuary' && usable(actor, f));
  if (sanct && !state.map.zones?.some((z) => z.casterId === actor.id && z.spellId === `feature:${sanct.key}`)) {
    const hurt = allies.filter((c) => c.hp > 0 && c.hp < c.maxHp / 2 && distance(c.pos!, actor.pos!) <= 1);
    const near = foes.some((c) => c.pos && ftBetween(c.pos, actor.pos!) <= 30);
    if (hurt.length && near) {
      const cmd: Command = { type: 'use_feature', actorId: actor.id, feature: sanct.key, to: actor.pos };
      if (ok(cmd)) return cmd;
    }
  }
  return null;
}
