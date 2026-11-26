/**
 * Görev KARAR104-KALAN (kural sürümü 104; A4'ün ⚠'si): likantrop laneti savaşta (SRD 5.2.1 s. 339 Werewolf Bite, Wererat/Wereboar/
 * Weretiger/Werebear aynı: "If the cursed target drops to 0 Hit Points, it instead becomes a Werewolf under the GM's control and has
 * 10 Hit Points"). Komut sonu kancası: bu komutta 0 HP'ye düşen (ölmeyen) lanetli yaratık savaştan çekilir (`retreated`,
 * `floor: 'likantrop'`; ölüm save'i atmaz, tarafını ayakta tutmaz) ve aynı altıgende Game Master'ın tarafında, laneti verenin stat
 * bloğuyla 10 HP'li canavar olarak girer (savaş başındaki canavar kurulumu, `lateSummonEvents`). Savaş sonunda karaktere
 * `lanet.donustu` yazılır (`partyStatus.ts`). Lanet sonraki savaşlara karakter durumundan taşınır (`withStatus`). 103: yalnız işaret.
 * Yan etkisiz.
 */
import { getMonster } from '../data';
import { combatantFromMonster } from './create';
import { karar104On } from './karar104Surum';
import { lateSummonEvents } from './monsterSetup';
import { applyEvents } from './reduce';
import { registerCommandEnd } from './turnHooks';
import type { BattleEvent, BattleState } from './types';

export const LYCAN_FLOOR = 'likantrop';
/** Dönüşenin yeni savaşçısının kimliği. */
export const lycanFormId = (id: string): string => `${id}-likantrop`;

export function lycanthropeEvents(before: BattleState, next: BattleState): BattleEvent[] {
  if (!karar104On(next) || next.status !== 'active') return [];
  const out: BattleEvent[] = [];
  let s = next;
  for (const c of Object.values(next.combatants)) {
    const kind = c.effects?.find((e) => e.lycanthropy)?.lycanthropy;
    const was = before.combatants[c.id];
    if (!kind || !was || was.hp <= 0 || c.hp > 0 || c.life === 'dead' || c.offFloor || !c.pos || s.combatants[lycanFormId(c.id)]) continue;
    let m;
    try { m = getMonster(kind); } catch { continue; }
    const pos = c.pos;
    const away: BattleEvent = { type: 'retreated', actorId: c.id, ids: [c.id], label: 'likantropi: canavara dönüştü', floor: LYCAN_FLOOR };
    out.push(away);
    s = applyEvents(s, [away]);
    const w0 = combatantFromMonster(m, { id: lycanFormId(c.id), name: `${m.name} (${c.name})`, kuralSurumu: s.kuralSurumu ?? 1 });
    const w = { ...w0, side: 'enemies' as const, ownerId: null, pos, hp: 10, initiative: c.initiative };
    const evs = lateSummonEvents(s, { type: 'summoned', ownerId: 'harita', spell: 'Likantropi', combatant: w, index: Math.max(0, s.order.indexOf(c.id)) + 1 }, m);
    out.push(...evs);
    s = applyEvents(s, evs);
  }
  return out;
}

registerCommandEnd((before, next) => lycanthropeEvents(before, next));
