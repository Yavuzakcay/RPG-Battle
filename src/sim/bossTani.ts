/**
 * KATALOG-1 F: tek tohumlu boss savaşı tanısı (yalnız sim; motor ve veri değişmez). Boss'un saldırıları, nefesi (Recharge),
 * efsanevi eylemleri, Legendary Resistance, sanatı, Faz 2 tetiği, hasar türleri ve partinin dirençleri, tur başı hasar.
 *   npx vite-node src/sim/bossTani.ts -- --boss wolfgang --parti k18-fighter --tohum 1 [--kol hazırlıklı] [--zorluk kolay]
 */
import { loadTrExtra } from '../i18n';
import { loadClassData, loadMonsters } from '../data';
import data from '../../data/sim-boss.json';
await Promise.all([loadMonsters(), loadClassData(), loadTrExtra()]);
await (await import('./simIcerik')).loadSimContent();
const { SCENARIOS, setupBattle, setPartyKind, setPartyResist, roundLimit } = await import('./balance');
const { execute } = await import('../battle');
const { currentActorId } = await import('../battle/common');
const { chooseCommand } = await import('../battle/ai');
const { contextFor } = await import('../ui/session');
const { seededRng } = await import('../rules/dice');
import type { BattleEvent, BattleState, Command } from '../battle';

declare const process: { argv: string[] };
const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
type Boss = { id: string; senaryo: string; seviye: number; normal: Record<string, number>; kolay: Record<string, number>; element?: string };
const b = (data.bosslar as unknown as Boss[]).find((x) => x.id === (opt('--boss') ?? 'wolfgang'))!;
const d = (opt('--zorluk') ?? 'normal') as 'normal' | 'kolay';
setPartyKind(opt('--parti') ?? 'k18-fighter');
setPartyResist(opt('--kol') === 'hazırlıklı' && b.element ? [b.element] : null);
const base = SCENARIOS.find((s) => s.id === b.senaryo)!;
const s = { ...base, byLevel: { ...base.byLevel, [b.seviye]: b[d] } };
const rng = seededRng(Number(opt('--tohum') ?? 1));
let state: BattleState = setupBattle(s, rng, b.seviye);
const events: BattleEvent[] = [];
const roundOf: number[] = [];
const hpLoss: Record<number, number> = {};
const apply = (cmd: Command): boolean => {
  const actorId = 'actorId' in cmd ? cmd.actorId : '';
  const r = execute(state, cmd, contextFor(state, actorId), rng);
  if (!r.ok) return false;
  for (const c of Object.values(state.combatants)) {
    if (c.side !== 'party' || c.civilian) continue;
    const after = r.state.combatants[c.id]!;
    const lost = (c.hp + (c.tempHp ?? 0)) - (after.hp + (after.tempHp ?? 0));
    if (lost > 0) hpLoss[state.round] = (hpLoss[state.round] ?? 0) + lost;
  }
  for (const e of r.events) { events.push(e); roundOf.push(state.round); }
  state = r.state;
  return true;
};
const maxRounds = roundLimit(b.seviye);
const bossId = Object.values(state.combatants).find((c) => c.monsterId === b.id)!.id;
const partyIds = new Set(Object.values(state.combatants).filter((c) => c.side === 'party' && !c.civilian).map((c) => c.id));
const partyHp0 = [...partyIds].reduce((n, id) => n + (state.combatants[id]!.maxHp), 0);
const commands: Record<string, number> = {};
for (let guard = 0; guard < 2000 && state.status === 'active' && state.round <= maxRounds; guard++) {
  const actorId = currentActorId(state);
  for (let step = 0; step < 12; step++) {
    const cmd = chooseCommand(state);
    if (actorId === bossId) commands[cmd.type] = (commands[cmd.type] ?? 0) + 1;
    if (cmd.type === 'end_turn' || !apply(cmd)) break;
    if (state.status !== 'active' || currentActorId(state) !== actorId) break;
  }
  if (state.status === 'active' && currentActorId(state) === actorId) apply({ type: 'end_turn', actorId });
}
// Boss'un verdiği hasar: hedef parti üyesinin HP düşüşleri (olay öncesi/sonrası yerine olaylardaki uygulanan değerler).
const dmgByType: Record<string, number> = {};
const dmgByRound: Record<number, number> = {};
const add = (r: number, type: string, n: number) => { if (n <= 0) return; dmgByType[type] = (dmgByType[type] ?? 0) + n; dmgByRound[r] = (dmgByRound[r] ?? 0) + n; };
const attacks: Record<string, { n: number; hit: number }> = {};
let breaths = 0, legendary: Record<string, number> = {}, lr = 0, phase: number | null = null, sanat = 0, recharged = 0;
const anyE = (e: BattleEvent) => e as unknown as Record<string, unknown>;
events.forEach((e, i) => {
  const r = roundOf[i]!; const x = anyE(e);
  if (e.type === 'attack_resolved' && x.actorId === bossId) {
    const k = String(x.label ?? x.attackName ?? x.weapon ?? 'saldırı');
    attacks[k] ??= { n: 0, hit: 0 }; attacks[k].n++; if (x.hit) attacks[k].hit++;
    if (partyIds.has(String(x.targetId))) {
      const extras = (x.extra as Array<Record<string, unknown>> | undefined) ?? [];
      const exSum = extras.reduce((n, ex) => n + Number(ex.applied ?? 0), 0);
      add(r, String(x.damageType ?? '?'), Number(x.appliedDamage ?? 0) - exSum);
      for (const ex of extras) add(r, String(ex.type), Number(ex.applied ?? 0));
    }
  }
  if (e.type === 'area_used' && x.actorId === bossId) breaths++;
  if (e.type === 'save_resolved' && partyIds.has(String(x.targetId)) && x.actorId === bossId) add(r, String(x.damageType ?? '?'), Number(x.appliedDamage ?? 0));
  if (e.type === 'legendary_used' && x.actorId === bossId) legendary[String(x.actionId)] = (legendary[String(x.actionId)] ?? 0) + 1;
  if (e.type === 'feature_used' && x.actorId === bossId && x.feature === 'legendaryResistance') lr++;
  if (e.type === 'feature_used' && x.actorId === bossId && String(x.feature).startsWith('mab:')) sanat++;
  if (e.type === 'recharge_rolled' && x.actorId === bossId && x.recharged) recharged++;
  if (e.type === 'phase_changed' && x.targetId === bossId) phase = r;
});
const boss = state.combatants[bossId]!;
const partyHpEnd = [...partyIds].reduce((n, id) => n + Math.max(0, state.combatants[id]!.hp), 0);
const rounds = state.round;
const totalDmg = Object.values(dmgByType).reduce((a, x) => a + x, 0);
const partyRes = [...partyIds].map((id) => { const c = state.combatants[id]!; return `${c.name}: ${[...c.resistances, ...(c.effects ?? []).flatMap((e) => e.resist ?? [])].join('/') || '—'}`; });
const out = {
  boss: b.id, parti: opt('--parti') ?? 'k18-fighter', kol: opt('--kol') ?? 'dirençsiz', zorluk: d, tohum: Number(opt('--tohum') ?? 1),
  sonuc: state.winner ?? state.status, tur: rounds, bossHp: `${boss.hp}/${boss.maxHp}`, bossFaz: boss.faz ?? 1, faz2Turu: phase,
  bossKomutlari: commands, saldirilar: attacks, nefes: breaths, nefesYenilendi: recharged, efsanevi: legendary, legendaryResistance: lr, sanat,
  bossHasariTurBasi: Math.round(totalDmg / Math.max(1, rounds)), hasarTurleri: dmgByType, turBasina: dmgByRound,
  partiHpKaybiTurBasina: hpLoss, legendaryResistanceKalan: boss.resources.legendaryResistance,
  partiHpKaybi: `${Math.round((100 * (partyHp0 - partyHpEnd)) / partyHp0)}%`, partiDirencleri: partyRes,
};
console.log(JSON.stringify(out, null, 1));
