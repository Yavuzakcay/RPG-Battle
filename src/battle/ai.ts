/**
 * Düşman yapay zekâsı (Adım 9). Sırası gelen düşman için bir sonraki komutu seçer; tur,
 * `end_turn` dönene kadar adım adım oynanır (her komuttan sonra durum yeniden okunur).
 *
 * Haritalı savaşta: (1) batağa saplandıysa çıkmaya çalışır; (2) bulunduğu yerden bir hedefe
 * saldırabiliyorsa saldırır (yenilenen nefes > Multiattack > ilk uygun saldırı); (3)
 * saldıramıyorsa saldırabileceği en ucuz ve en güvenli altıgene yürür; (4) o da yoksa en
 * yakın hedefe doğru yaklaşır; (5) turu bitirir. Lavdan, lav kenarından, alevden, bataktan,
 * buzdan, bilinen tuzaktan ve lav uyarısı olan altıgenlerden kaçınır. Bir komutun yapılıp
 * yapılamayacağı motorda zarsız denenerek bulunur; kurallar kopyalanmaz.
 *
 * Haritasız savaşta eski davranış: en düşük HP oranlı hedefe saldırı.
 */
import { distance, hexKey, neighbors, type Offset } from '../rules/hex';
import { execute } from './commands';
import { currentActorId, isTargetable } from './common';
import { canSee, isRiskyHex, ruleOf, stuckInBog } from './maprules';
import { terrainAt } from './movement';
import type { BattleState, Combatant, Command, CommandContext } from './types';

const GM: CommandContext = { playerId: 'gm', isGm: true };
const noRoll = () => 0.5;
const tryCmd = (state: BattleState, cmd: Command) => execute(state, cmd, GM, noRoll);

/** Saldırılabilir parti üyeleri (masumlar dahil): ayakta, gizlenmemiş, görülen. */
function targetsOf(state: BattleState, actor: Combatant): Combatant[] {
  return Object.values(state.combatants).filter(
    (c) => c.side === 'party' && c.hp > 0 && isTargetable(c) && !c.hidden && canSee(state, actor, c),
  );
}

/** Bu düşmanın bir hedefe karşı denenecek saldırı komutları, öncelik sırasıyla. */
function attackCommands(actor: Combatant, targetId: string): Command[] {
  const ready = actor.attacks
    .map((a, i) => ({ a, i }))
    .filter(({ a, i }) => a.damageDice !== undefined && !(a.recharge !== undefined && actor.rechargeUsed.includes(i)));
  const out: Command[] = [];
  for (const { a, i } of ready) {
    if (a.recharge !== undefined && a.save !== undefined) out.push({ type: 'monster_attack', actorId: actor.id, targetId, attackIndex: i });
  }
  if (actor.multiattack) out.push({ type: 'multiattack', actorId: actor.id, targetId });
  for (const { a, i } of ready) {
    if (!(a.recharge !== undefined && a.save !== undefined)) out.push({ type: 'monster_attack', actorId: actor.id, targetId, attackIndex: i });
  }
  return out;
}

/** Hedef sırası: yakın olan, eşitse HP oranı düşük olan. */
function byPriority(actor: Combatant, targets: Combatant[]): Combatant[] {
  const d = (c: Combatant) => (actor.pos && c.pos ? distance(actor.pos, c.pos) : 0);
  return [...targets].sort((a, b) => d(a) - d(b) || a.hp / a.maxHp - b.hp / b.maxHp);
}

/** Şu an yapılabilen ilk saldırı. */
function attackNow(state: BattleState, actor: Combatant): Command | null {
  for (const t of byPriority(actor, targetsOf(state, actor))) {
    for (const cmd of attackCommands(actor, t.id)) if (tryCmd(state, cmd).ok) return cmd;
  }
  return null;
}

/** Bir altıgende durmanın riski (yapay zekânın kaçındığı yerler). */
function risk(state: BattleState, actor: Combatant, h: Offset): number {
  if (actor.fly > 0) return 0;
  let r = 0;
  if (isRiskyHex(state, h)) r += 50;
  if (state.map?.lavaWarning?.hexes.some((w) => w.col === h.col && w.row === h.row)) r += 100;
  const size = { cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 };
  if (ruleOf(state, 'lavaEdge') && neighbors(h, size).some((n) => terrainAt(state, n).movement === 'deadly')) r += 8;
  return r;
}

/** Yürünebilen altıgenler, maliyetleri ve yürüyüş sonrası durum (motor zarsız denenerek). */
function reachable(state: BattleState, actor: Combatant): Array<{ to: Offset; cost: number; after: BattleState }> {
  const out: Array<{ to: Offset; cost: number; after: BattleState }> = [];
  const rows = state.map?.tiles.length ?? 0;
  const cols = state.map?.tiles[0]?.length ?? 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const to = { col, row };
      const r = tryCmd(state, { type: 'move', actorId: actor.id, to });
      if (!r.ok) continue;
      const moved = r.events[0];
      const last = moved?.type === 'moved' ? moved.path[moved.path.length - 1] : undefined;
      if (moved?.type !== 'moved' || !last || hexKey(last) !== hexKey(to)) continue; // yol kesiliyor
      out.push({ to, cost: moved.cost, after: r.state });
    }
  }
  return out;
}

export function chooseEnemyCommand(state: BattleState): Command {
  const actorId = currentActorId(state);
  const actor = state.combatants[actorId];
  const end: Command = { type: 'end_turn', actorId };
  if (!actor || actor.side !== 'enemies' || state.status !== 'active') return end;
  const canAct = !actor.economy.action || actor.economy.attacksLeft > 0;

  // Haritasız savaş: en düşük HP oranlı hedefe saldırı.
  if (!state.map || !actor.pos) {
    if (!canAct) return end;
    const target = Object.values(state.combatants)
      .filter((c) => c.side === 'party' && c.hp > 0 && !c.hidden)
      .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    if (!target) return end;
    return attackCommands(actor, target.id).find((cmd) => tryCmd(state, cmd).ok) ?? end;
  }

  if (stuckInBog(state, actor)) return canAct && tryCmd(state, { type: 'escape', actorId }).ok ? { type: 'escape', actorId } : end;
  if (!canAct) return end;

  const now = attackNow(state, actor);
  if (now) return now;

  const targets = targetsOf(state, actor);
  if (targets.length === 0) return end;
  const spots = reachable(state, actor);

  // Saldırabileceği en ucuz ve en güvenli altıgen.
  let best: { to: Offset; score: number } | null = null;
  for (const s of spots) {
    const mover = s.after.combatants[actorId] as Combatant;
    if (!attackNow(s.after, mover)) continue;
    const score = s.cost + risk(state, actor, s.to);
    if (!best || score < best.score) best = { to: s.to, score };
  }
  if (best) return { type: 'move', actorId, to: best.to };

  // Yaklaş: en yakın hedefe mesafeyi en çok kısaltan güvenli altıgen.
  const nearest = (h: Offset) => Math.min(...targets.map((t) => distance(h, t.pos as Offset)));
  const here = nearest(actor.pos);
  let approach: { to: Offset; score: number } | null = null;
  for (const s of spots) {
    const d = nearest(s.to);
    if (d >= here) continue;
    const score = d * 10 + risk(state, actor, s.to) + s.cost;
    if (!approach || score < approach.score) approach = { to: s.to, score };
  }
  return approach ? { type: 'move', actorId, to: approach.to } : end;
}
