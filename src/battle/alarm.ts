/**
 * Görev S4: uyuyan gruplar ve alarm (docs/harita/SEFER-TASARIMI.md §4). Grup alanı haritada (`groups[].hexes`); savaş
 * başında alanda duran düşmanlar grubun üyesi olur (`groups_formed`). Uyuyan üye `asleep` (mevcut uyku: turu atlanır,
 * yakın dövüş avantajlı), habersiz üye `unaware` (turu atlanır). Tetikler her komutun sonunda (`execute`): hasar,
 * gürültü (gök gürültüsü hasarı, kırılan kapı, barut patlaması; yarıçaplar `data/alarm.json`) ve pasif Algı (habersiz:
 * görüş çizgisindeki kahraman; uyuyan: −5, yalnızca yakındaki). Alarmlanan grup inisiyatifi dezavantajla atar ve sıraya
 * girer (SRD Surprise; `group_alarmed`). Komşu gruba haber 1 tur sonra (ev kuralı `alarmKosusu`, yalnızca sefer).
 * Uyuyan ejderha (Volkan) kendi kuralıyla kalır.
 */
import data from '../../data/alarm.json';
import { rollD20, rollTag, type Rng } from '../rules/dice';
import { distance, hexKey, type Offset } from '../rules/hex';
import { exhaustionD20Penalty } from '../rules/exhaustion';
import { currentActorId, fail, finish, type CommandResult } from './common';
import { houseRule } from './houseRules';
import { OBJECTS } from './objectData';
import { canSee } from './maprules';
import { lineOfFire } from './cover';
import { passivePerception } from './stealth';
import { applyEvents } from './reduce';
import type { BattleEvent, BattleState, Combatant, Command, CommandContext, SleepGroup } from './types';

export const ALARM = data;
const ft = (a: Offset, b: Offset) => distance(a, b) * 5;
const dormant = (g: SleepGroup) => g.state !== 'alarmed';

/** Savaş başı: grup alanında duran düşmanlar üye olur. */
export function formGroupsEvent(state: BattleState): BattleEvent | null {
  if (!state.groups?.length) return null;
  const members: Record<string, string[]> = {};
  const taken = new Set<string>();
  for (const g of state.groups) {
    const keys = new Set(g.hexes.map(hexKey));
    members[g.id] = Object.values(state.combatants)
      .filter((c) => c.side === 'enemies' && !c.civilian && !c.summon && c.pos && keys.has(hexKey(c.pos)) && !taken.has(c.id))
      .map((c) => c.id);
    members[g.id]?.forEach((id) => taken.add(id));
  }
  return { type: 'groups_formed', members };
}

/** Grubu alarmla: üyeler inisiyatifi dezavantajla atar, sıraya inisiyatif yerine girer; sırası gelen değişmez. */
export function alarmEvent(state: BattleState, g: SleepGroup, reason: string, byId: string | undefined, rng: Rng): BattleEvent {
  const members = (g.members ?? []).map((id) => state.combatants[id]).filter((c): c is Combatant => !!c && (c.hp > 0 || !!c.regenPending));
  const initiatives: Record<string, number> = {};
  for (const c of members) {
    const d = rollD20('disadvantage', rollTag(rng, { kind: 'initiative', by: c.id, bonus: c.initiativeBonus }));
    initiatives[c.id] = d.kept + c.initiativeBonus - exhaustionD20Penalty(c.exhaustion);
  }
  const ids = new Set(g.members ?? []);
  const current = state.status === 'active' ? currentActorId(state) : undefined;
  const order = state.order.filter((id) => !ids.has(id) || !(id in initiatives));
  const init = (id: string) => initiatives[id] ?? state.combatants[id]?.initiative ?? 0;
  for (const id of Object.keys(initiatives).sort((a, b) => init(b) - init(a))) {
    const at = order.findIndex((o) => o !== current && init(o) < init(id));
    order.splice(at < 0 ? order.length : at, 0, id);
  }
  const turnIndex = current ? Math.max(0, order.indexOf(current)) : state.turnIndex;
  return { type: 'group_alarmed', groupId: g.id, reason, ...(byId ? { byId } : {}), round: state.round, initiatives, order, turnIndex };
}

/** Uyanık/habersiz üye bu kahramanı fark eder mi (pasif Algı; uyuyan −5 ve yalnızca yakından duyar). Yapay zekâ da kullanır. */
export function notices(state: BattleState, w: Combatant, c: Combatant): boolean {
  if (!w.pos || !c.pos || w.hp <= 0) return false;
  const passive = passivePerception(state, w, c.pos) - (w.asleep ? ALARM.asleepPassivePenalty : 0);
  if (w.asleep) {
    if (ft(w.pos, c.pos) > ALARM.asleepHearFt) return false;
    return passive >= (c.hidden ? c.hidden.dc : ALARM.asleepNoticeDc);
  }
  if (ft(w.pos, c.pos) > ALARM.calmSightFt || !canSee(state, w, c) || lineOfFire(state, w, c).blocked) return false;
  return c.hidden ? passive >= c.hidden.dc : true;
}

/** Komuttaki gürültü kaynakları (yer + yarıçap ft). */
function noises(before: BattleState, after: BattleState, events: BattleEvent[], cmd: Command): Array<{ at: Offset; ft: number; label: string }> {
  const out: Array<{ at: Offset; ft: number; label: string }> = [];
  const actor = 'actorId' in cmd ? before.combatants[cmd.actorId] : undefined;
  for (const e of events) {
    const dt = (e as { damageType?: string }).damageType;
    if (dt === 'thunder') {
      const t = (e as { targetId?: string }).targetId;
      const at = (t && after.combatants[t]?.pos) || actor?.pos;
      if (at) out.push({ at, ft: ALARM.noise.thunderFt, label: 'gök gürültüsü' });
    }
    if (e.type === 'object_destroyed') {
      const o = before.map?.objects?.find((x) => x.id === e.objectId) ?? after.map?.objects?.find((x) => x.id === e.objectId);
      if (o && OBJECTS[o.kind]?.door) out.push({ at: o.at, ft: ALARM.noise.doorBreakFt, label: 'kapı kırıldı' });
      if (o?.kind === 'powderKeg' && houseRule(after, 'barutPatlama')) out.push({ at: o.at, ft: ALARM.noise.explosionFt, label: 'patlama' });
    }
  }
  return out;
}

/** Komut sonu tetikleri ve tur başında komşu gruba haber; her grup en çok bir kez alarmlanır. */
export function alarmEvents(before: BattleState, after: BattleState, events: BattleEvent[], cmd: Command, rng: Rng): BattleEvent[] {
  if (!after.groups?.some(dormant) || after.status !== 'active' || after.alarmEnabled === false) return [];
  const why = new Map<string, { reason: string; byId?: string }>();
  const party = Object.values(after.combatants).filter((c) => c.side === 'party' && !c.civilian && c.hp > 0 && c.pos);
  const sounds = noises(before, after, events, cmd);
  const byId = 'actorId' in cmd ? cmd.actorId : undefined;
  for (const g of after.groups.filter(dormant)) {
    for (const id of g.members ?? []) {
      const was = before.combatants[id];
      const m = after.combatants[id];
      if (!m || !was) continue;
      if (m.hp < was.hp) { why.set(g.id, { reason: 'hasar', ...(byId ? { byId } : {}) }); break; }
      const loud = m.pos ? sounds.find((n) => ft(n.at, m.pos as Offset) <= n.ft) : undefined;
      if (loud) { why.set(g.id, { reason: loud.label, ...(byId ? { byId } : {}) }); break; }
      const seen = party.find((c) => notices(after, m, c));
      if (seen) { why.set(g.id, { reason: m.asleep ? 'uykusunda duydu' : 'gördü', byId: seen.id }); break; }
    }
  }
  // Ev kuralı (sefer): alarmlı grup komşularını `linkDelayRounds` tur sonra uyandırır (haberci).
  if (after.round > before.round && houseRule(after, 'alarmKosusu')) {
    for (const g of after.groups) {
      if (g.state !== 'alarmed' || g.alarmedRound === undefined || after.round - g.alarmedRound < ALARM.linkDelayRounds) continue;
      for (const l of g.links ?? []) {
        const n = after.groups.find((x) => x.id === l);
        if (n && dormant(n) && !why.has(n.id)) why.set(n.id, { reason: `haberci (${g.id})` });
      }
    }
  }
  const out: BattleEvent[] = [];
  let s = after;
  for (const [gid, w] of why) {
    const g = s.groups?.find((x) => x.id === gid);
    if (!g || !dormant(g)) continue;
    const ev = alarmEvent(s, g, w.reason, w.byId, rng);
    out.push(ev);
    s = applyEvents(s, [ev]);
  }
  return out;
}

/**
 * Kuyruk 16 K16D: devriyedeki (rotası olan, habersiz grubun) üye mi. Devriye üyesinin turu atlanmaz; yalnızca yürür
 * (rotadaki sıradaki noktaya), fark edince alarm (mevcut tetikler) grubu savaşa sokar; alarmlı grup rotayı bırakır.
 */
export function patrolOf(state: BattleState, c: Combatant): SleepGroup | null {
  if (!c.unaware || !c.group) return null;
  const g = state.groups?.find((x) => x.id === c.group);
  return g && g.state === 'calm' && g.route?.length ? g : null;
}

/**
 * Devriye üyesi rotadaki noktaya (ya da bitişiğine) vardıysa sıradaki nokta; `pause` tur durak. Yürüyüşte ya da (nokta
 * zaten bitişikse) turu bitirirken; durak turu komutun başındaki turdan sayılır.
 */
export function patrolEvents(before: BattleState, after: BattleState, cmd: Command): BattleEvent[] {
  if ((cmd.type !== 'move' && cmd.type !== 'end_turn') || !after.groups?.some((g) => g.route?.length)) return [];
  const c = after.combatants[cmd.actorId];
  const g = c ? patrolOf(after, c) : null;
  if (!c?.pos || !g?.route) return [];
  if (cmd.type === 'end_turn' && before.round < (g.waitUntil ?? 0)) return [];
  const i = g.routeIndex ?? 0;
  const target = g.route[i % g.route.length] as Offset;
  if (distance(c.pos, target) > 1) return [];
  return [{ type: 'patrol_moved', groupId: g.id, index: (i + 1) % g.route.length, waitUntil: before.round + (g.pause ?? ALARM.patrolPauseRounds) }];
}

/** Game Master: grubu elle alarmla. */
export function executeAlarmGroup(state: BattleState, groupId: string, ctx: CommandContext, rng: Rng): CommandResult {
  if (!ctx.isGm) return fail('Alarmı yalnızca Game Master verir.');
  if (state.status !== 'active') return fail('Savaş başlamadı.');
  const g = state.groups?.find((x) => x.id === groupId);
  if (!g) return fail('Grup yok.');
  if (!dormant(g)) return fail('Grup zaten alarmda.');
  return finish(state, [alarmEvent(state, g, 'Game Master', 'gm', rng)]);
}

/** Harita verisinden gruplar (1 tabanlı altıgenler) ve Game Master'ın durum/bağlantı seçimleri. */
export function groupsFrom(raw: Array<{ id: string; state?: string; hexes: Array<[number, number] | Offset>; links?: string[]; route?: Array<[number, number] | Offset>; pause?: number }> | undefined,
  override?: Record<string, { state?: SleepGroup['state']; links?: string[] }>): SleepGroup[] | undefined {
  if (!raw?.length) return undefined;
  return raw.map((g) => {
    const o = override?.[g.id];
    const st = (o?.state ?? g.state ?? 'asleep') as SleepGroup['state'];
    const links = o?.links ?? g.links;
    const at = (h: [number, number] | Offset): Offset => (Array.isArray(h) ? { col: h[0] - 1, row: h[1] - 1 } : h);
    return { id: g.id, state: st, hexes: g.hexes.map(at), ...(links?.length ? { links: [...links] } : {}),
      ...(g.route?.length ? { route: g.route.map(at), routeIndex: 0, ...(g.pause !== undefined ? { pause: g.pause } : {}) } : {}) };
  });
}
