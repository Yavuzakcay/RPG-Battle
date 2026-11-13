/**
 * Kuyruk MB2 (kural sürümü 74; `harita/belgeler/BINEK-PLAN.md` §3.3, §17; kararlar B2, B4-A, B5, B7): kontrollü binek turu.
 * - Kontrollü binek (`controlledBy`): kendi turu yok (`common.ts` `nextActorPlain` atlar); binicinin turunda, binicinin
 *   kararıyla (binicinin oyuncusu ya da yapay zekâsı) hareket eder. Eylemi yalnız Dash, Disengage ya da Dodge (B5); bonus
 *   eylemleri (Fey Step) ve tepkileri serbest. Fırsat saldırısını yalnız binek tetikler (B7, MB1'den).
 * - Hangi binek kontrollü: veriden (`mountControlled`): çağrıda `mount.controlled` (`data/summons.json` `mount.kontrol`, paket
 *   `binek.kontrol`), çağrı değilse `data/binek.json` `egitimli` (eğitimli SRD binek hayvanları, B2). Kodda yaratık adı yok.
 * - Binici Incapacitated ya da 0 HP ise binek bağımsız davranır (SRD Find Steed; ⚠ bütün kontrollü bineklere genellendi).
 * Yaprak modül: yalnız tür, veri, koşul ve binek yaprakları.
 */
import binekData from '../../data/binek.json';
import { isIncapacitated, MOVE_ONLY_COMMANDS } from '../rules/conditions';
import { binekMb2On } from './binekMb2Surum';
import type { BattleState, Combatant, Command } from './types';

const TRAINED = new Set<string>((binekData as { egitimli?: string[] }).egitimli ?? []);

/** Binek kontrollü olabilir mi (veriden; sürümden bağımsız). */
export function mountControlled(m: Pick<Combatant, 'summon' | 'monsterId' | 'egitimli'>): boolean {
  if (m.summon) return !!m.summon.mount?.controlled;
  // Kuyruk K75: canavar verisindeki `egitimli` bayrağı (özel canavar) listeye ek; bayrak yalnız yeni savaşta kurulur.
  return !!m.egitimli || (!!m.monsterId && TRAINED.has(m.monsterId));
}

/** 74+: binek şu an kontrollü mü (binicisi üstünde, ayakta ve Incapacitated değil). */
export function controlledNow(state: Pick<BattleState, 'combatants' | 'kuralSurumu'>, m: Combatant | undefined): boolean {
  if (!m?.controlledBy || !binekMb2On(state)) return false;
  const r = state.combatants[m.controlledBy];
  return !!r && r.riding === m.id && r.hp > 0 && !isIncapacitated(r.conditions);
}

/** Binicinin şu an kontrol ettiği binek (yoksa undefined). */
export function controlledMountOf(state: Pick<BattleState, 'combatants' | 'kuralSurumu'>, rider: Combatant | undefined): Combatant | undefined {
  if (!rider?.riding || !binekMb2On(state)) return undefined;
  const m = state.combatants[rider.riding];
  return m && m.controlledBy === rider.id && controlledNow(state, m) ? m : undefined;
}

/** Bu tur binicinin turunda kancalarıyla oynayan binekler (binicinin tur başı/sonu kancaları onlara da çalışır). */
export function ridMountIds(state: Pick<BattleState, 'combatants' | 'kuralSurumu' | 'round'>, riderId: string): string[] {
  if (!binekMb2On(state)) return [];
  const out: string[] = [];
  for (const c of Object.values(state.combatants)) if (c.ridTurn?.hooks && c.ridTurn.by === riderId && c.ridTurn.round === state.round) out.push(c.id);
  return out;
}

/** Sırada atlanır mı: kontrollü binek ya da bu turdaki sırası binicinin turunda kullanılmış binek. */
export const mountSkipsTurn = (state: Pick<BattleState, 'combatants' | 'kuralSurumu'>, c: Combatant, round: number): boolean =>
  binekMb2On(state) && (controlledNow(state, c) || c.ridTurn?.round === round);

/** Kontrollü bineğin yapabildiği komutlar (B5): hareket, Dash, Disengage, Dodge ve bineğin bonus eylemleri. */
const ALLOWED = new Set<string>([...MOVE_ONLY_COMMANDS, 'dash', 'disengage', 'dodge', 'steed_action']);

/** Kontrollü bineğin komut sorunu (yoksa null). */
export function controlledCommandProblem(m: Combatant, cmd: Command): string | null {
  if (cmd.type === 'end_turn') return `${m.name} kontrollü binek: tur binicinin turuyla biter.`;
  if (!ALLOWED.has(cmd.type)) return `${m.name} kontrollü binek: eylemi yalnız Dash, Disengage ya da Dodge olur.`;
  if ((cmd.type === 'dash' || cmd.type === 'disengage') && cmd.bonus) return `${m.name} kontrollü binek: eylemi yalnız Dash, Disengage ya da Dodge olur.`;
  return null;
}
