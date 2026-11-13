/**
 * Görev MB6b: binek arayüzünün saf yardımcıları (yalnız gösterim ve motor sorgusu; kural yok). Motor binek kodu MB1–MB8
 * (`battle/mounted.ts`, `binekMb2.ts`, `riderCore.ts`); burada yalnız arayüzün sorduğu sorular:
 * - binek rozeti (kontrollü / bağımsız), yığın jetonunun çizimi (binici üstte küçük, binek altta),
 * - binicinin "Binek" bölümü (kontrollü bineğin Dash/Disengage/Dodge'u ve bonus eylemleri, `actorId` = binek),
 * - tur şeridinde kontrollü bineğin binicinin kutusunda gösterilmesi,
 * - Game Master kurulumunda "binmiş başla" adayları (`mountProblem` ile).
 */
import { controlledMountOf, controlledNow } from '../battle/binekMb2';
import { mountProblem } from '../battle/mounted';
import { steedActions, type SteedAction } from '../battle/steed';
import { globalRule } from '../battle/ruleControl';
import type { BattleState, Combatant, Command } from '../battle/types';

export type MountBadge = 'kontrollu' | 'bagimsiz';

/** Binek/binicinin rozet türü: kontrollü binek (MB2) ya da bağımsız (yoksa null). */
export function mountBadge(state: BattleState, c: Combatant): MountBadge | null {
  const m = c.riding ? state.combatants[c.riding] : c.rider ? c : undefined;
  if (!m || (c.riding && m.rider !== c.id)) return null;
  return controlledNow(state, m) ? 'kontrollu' : 'bagimsiz';
}

/** Yığın çizimi: binici bineğin üstünde küçük ve yukarıda (jeton yarıçapı oranıyla). Binici değilse null. */
export const RIDER_SCALE = 0.72;
export const RIDER_LIFT = 0.55;
export function riderStack(state: BattleState, c: Combatant): { scale: number; lift: number } | null {
  const m = c.riding ? state.combatants[c.riding] : undefined;
  if (!m?.pos || !c.pos || m.rider !== c.id || m.hp <= 0) return null;
  return { scale: RIDER_SCALE, lift: RIDER_LIFT };
}

/** Çizim sırası: binici bineğinden sonra (üstte). Kararlı: başka sıra değişmez. */
export function ridersOnTop<T extends { c: Combatant }>(state: BattleState, xs: T[]): T[] {
  const riders = xs.filter((x) => riderStack(state, x.c));
  if (!riders.length) return xs;
  const rest = xs.filter((x) => !riders.includes(x));
  for (const r of riders) {
    const mi = rest.findIndex((x) => x.c.id === r.c.riding);
    if (mi < 0) rest.push(r); else rest.splice(mi + 1, 0, r);
  }
  return rest;
}

export interface MountAction { key: 'dash' | 'disengage' | 'dodge' | SteedAction; cmd: Command | null; steed?: SteedAction }

/** Binicinin "Binek" bölümü: kontrollü bineğin eylemleri (komut `actorId` = binek). Kontrollü binek yoksa boş. */
export function mountActions(state: BattleState, rider: Combatant): { mount: Combatant; actions: MountAction[] } | null {
  const m = controlledMountOf(state, rider);
  if (!m) return null;
  const base: MountAction[] = [
    { key: 'dash', cmd: { type: 'dash', actorId: m.id } },
    { key: 'disengage', cmd: { type: 'disengage', actorId: m.id } },
    { key: 'dodge', cmd: { type: 'dodge', actorId: m.id } },
  ];
  // Bineğin bonus eylemleri (Find Steed: Fey Step…): hedef/altıgen seçimiyle (komut seçimde kurulur).
  const steed = steedActions(state, m).map((k) => ({ key: k, cmd: null, steed: k }) as MountAction);
  return { mount: m, actions: [...base, ...steed] };
}

/** Hareket önizlemesinin yaratığı: kontrollü binekteki binicinin yürüyüşü bineğe gider (motor `move` yönlendirmesi). */
export function moverFor(state: BattleState, actorId: string): string {
  const m = controlledMountOf(state, state.combatants[actorId]);
  return m ? m.id : actorId;
}

/** Tur şeridi: kontrollü bineği kendi kutusunda göstermez (binicinin kutusunda rozet); binicinin bineği. */
export function stripMountOf(state: BattleState, id: string): { hide: boolean; mount?: Combatant } {
  const c = state.combatants[id];
  if (!c) return { hide: false };
  if (c.controlledBy && controlledNow(state, c)) return { hide: true };
  const m = controlledMountOf(state, c);
  return m ? { hide: false, mount: m } : { hide: false };
}

/** Game Master kurulumu "binmiş başla": seçili yaratığın binebileceği (motorun `mountProblem`'i) bitişik binekler. */
export function setupMountCandidates(state: BattleState, riderId: string): Combatant[] {
  const r = state.combatants[riderId];
  if (!r?.pos || r.riding || !globalRule(state, 'srdK19')) return [];
  return Object.values(state.combatants).filter((m) => m.id !== r.id && m.pos && !mountProblem(state, r, m.id));
}
