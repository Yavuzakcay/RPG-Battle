/**
 * Görev OD1C: hedef taslağı (kurulumda yalnız tür seçilir; altıgen ve nesne haritada seçilir). Saf veri: oda kaydında ve
 * Hızlı savaş kurulumunda aynı biçim. Taslaktaki tamamlanmış hedefler `Goals`'a çevrilip `createMapBattle`'a gider;
 * bekleyenler harita açılınca (savaş öncesi yerleştirme) tamamlanır. Hedef motoruna (`state.goals`, `goalEvents`) dokunulmaz.
 */
import type { Goal, GoalFail, GoalFailKind, GoalKind, Goals } from '../battle/types';
import type { Offset } from '../rules/hex';

export interface DraftGoal {
  id: string; kind: GoalKind; rounds?: number; who?: 'any' | 'all'; hexes?: Offset[]; objectId?: string;
  /** Koru: masumlar yerine haritadaki bir nesne (haritada seçilir). */
  wantsObject?: boolean;
}
export interface GoalsDraft { mode: 'all' | 'any'; list: DraftGoal[]; fail?: GoalFail[] }

/** Hedefin haritadan neye ihtiyacı var. */
export function needsOf(g: DraftGoal): { hexes: boolean; object: boolean } {
  return {
    hexes: g.kind === 'reach' || g.kind === 'retrieve',
    object: g.kind === 'destroy' || g.kind === 'retrieve' || (g.kind === 'protect' && g.wantsObject === true),
  };
}

/** Tamamlanmamış (haritada seçim bekleyen) hedef mi. */
export function isPending(g: DraftGoal): boolean {
  const n = needsOf(g);
  return (n.hexes && !g.hexes?.length) || (n.object && !g.objectId);
}

/** Bekleyen hedefin yönlendirme anahtarı ("hex" / "object" / ikisi). */
export function pendingNeeds(g: DraftGoal): Array<'hex' | 'object'> {
  const n = needsOf(g);
  return [...(n.hexes && !g.hexes?.length ? ['hex' as const] : []), ...(n.object && !g.objectId ? ['object' as const] : [])];
}

const toGoal = (g: DraftGoal): Goal => ({
  id: g.id, kind: g.kind, ...(g.hexes?.length ? { hexes: g.hexes } : {}), ...(g.objectId ? { objectId: g.objectId } : {}),
  ...(g.rounds !== undefined && g.rounds > 0 ? { rounds: g.rounds } : {}), ...(g.who ? { who: g.who } : {}),
});

/** Taslağı ikiye ayırır: tamamlanmışlar (`Goals`; yoksa null) ve bekleyenler. */
export function resolveDraft(d: GoalsDraft | null | undefined): { goals: Goals | null | undefined; pending: DraftGoal[] } {
  if (d === undefined) return { goals: undefined, pending: [] };
  if (d === null) return { goals: null, pending: [] };
  const done = d.list.filter((g) => !isPending(g)).map(toGoal);
  const pending = d.list.filter(isPending);
  const fail = (d.fail ?? []).filter((f) => !failPending(f));
  const goals: Goals | null = done.length || fail.length ? { mode: d.mode, list: done, ...(fail.length ? { fail } : {}) } : null;
  return { goals, pending };
}

/** Harita hedeflerini (hazır şablonlar) taslağa çevirir. */
export function draftFromGoals(g: Goals | null | undefined): GoalsDraft | null {
  if (!g) return null;
  return { mode: g.mode, list: g.list.map((x) => ({ id: x.id, kind: x.kind, ...(x.rounds !== undefined ? { rounds: x.rounds } : {}), ...(x.who ? { who: x.who } : {}),
    ...(x.hexes ? { hexes: x.hexes } : {}), ...(x.objectId ? { objectId: x.objectId } : {}), ...(x.kind === 'protect' && x.objectId ? { wantsObject: true } : {}) })),
  ...(g.fail?.length ? { fail: g.fail } : {}) };
}

/** Harita değişince altıgen ve nesne bağları sıfırlanır; tür, tur sayısı ve başarısızlık koşulları kalır. */
export function resetForMap(d: GoalsDraft | null | undefined): GoalsDraft | null | undefined {
  if (!d) return d;
  return {
    ...d,
    list: d.list.map((g) => {
      const n = needsOf(g);
      const { hexes: _h, objectId: _o, ...rest } = g;
      return { ...rest, ...(n.hexes ? {} : g.hexes ? { hexes: g.hexes } : {}), ...(n.object ? {} : g.objectId ? { objectId: g.objectId } : {}) };
    }),
    ...(d.fail ? { fail: d.fail.map((f) => (f.kind === 'object' ? { ...f, objectId: '' } : f)) } : {}),
  };
}

/** Başarısızlık koşulu nesne bekliyor mu. */
export const failPending = (f: GoalFail): boolean => f.kind === 'object' && !f.objectId;

/** Taslağa yeni hedef ekler (kimlik `g<n>`). */
export function addDraftGoal(d: GoalsDraft | null | undefined, kind: GoalKind, extra: Partial<DraftGoal> = {}): GoalsDraft {
  const base: GoalsDraft = d ?? { mode: 'all', list: [] };
  let n = base.list.length + 1;
  while (base.list.some((g) => g.id === `g${n}`)) n++;
  return { ...base, list: [...base.list, { id: `g${n}`, kind, ...extra }] };
}

/** Hedefe altıgen ekler/çıkarır (tekrar dokununca kaldırılır). */
export function toggleHex(d: GoalsDraft, goalId: string, h: Offset): GoalsDraft {
  return { ...d, list: d.list.map((g) => {
    if (g.id !== goalId) return g;
    const cur = g.hexes ?? [];
    const has = cur.some((x) => x.col === h.col && x.row === h.row);
    const hexes = has ? cur.filter((x) => !(x.col === h.col && x.row === h.row)) : [...cur, h];
    const { hexes: _x, ...rest } = g;
    return hexes.length ? { ...rest, hexes } : rest;
  }) };
}

/** Kuyruk KQ5 GH1: hedefin seçili altıgenlerini temizler. */
export const clearHexes = (d: GoalsDraft, goalId: string): GoalsDraft => ({ ...d, list: d.list.map((g) => { if (g.id !== goalId) return g; const { hexes: _h, ...rest } = g; return rest; }) });

/** Haritada düzenlenebilen hedef var mı (altıgen ya da nesne isteyen; hazır "Kaç" ön ayarı da): savaş ekranı şeridi açılır. */
export const hasMapGoals = (d: GoalsDraft | null | undefined): boolean => !!d && (d.list.some((g) => { const n = needsOf(g); return n.hexes || n.object; }) || (d.fail ?? []).some(failPending));

/** Hedefe nesne bağlar (`fail:<i>` = i. başarısızlık koşulu). */
export function bindObject(d: GoalsDraft, goalId: string, objectId: string): GoalsDraft {
  if (goalId.startsWith('fail:')) {
    const i = Number(goalId.slice(5));
    return { ...d, fail: (d.fail ?? []).map((f, j) => (j === i ? { ...f, objectId } : f)) };
  }
  return { ...d, list: d.list.map((g) => (g.id === goalId ? { ...g, objectId } : g)) };
}

/** Bekleyen kalemler (hedefler ve nesne bekleyen başarısızlıklar), yönlendirme şeridi için. */
export interface PendingItem { id: string; kind: GoalKind | 'fail'; needs: Array<'hex' | 'object'>; hexes: number; failKind?: GoalFailKind }
export function pendingItems(d: GoalsDraft | null | undefined): PendingItem[] {
  if (!d) return [];
  return [
    ...d.list.filter(isPending).map((g) => ({ id: g.id, kind: g.kind, needs: pendingNeeds(g), hexes: g.hexes?.length ?? 0 })),
    ...(d.fail ?? []).flatMap((f, i) => (failPending(f) ? [{ id: `fail:${i}`, kind: 'fail' as const, needs: ['object' as const], hexes: 0, failKind: f.kind }] : [])),
  ];
}

export const FAIL_KINDS: GoalFailKind[] = ['rounds', 'civilians', 'object', 'alarm'];

const KINDS: GoalKind[] = ['defeat', 'reach', 'protect', 'destroy', 'survive', 'retrieve'];
const isHex = (h: unknown): h is Offset => !!h && typeof h === 'object' && Number.isInteger((h as Offset).col) && Number.isInteger((h as Offset).row);

/** Bozuk ya da eski oda kaydındaki taslağı onarır (geçersiz hedefler atılır); yoksa undefined. */
export function normalizeDraft(raw: unknown): GoalsDraft | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as { mode?: unknown; list?: unknown; fail?: unknown };
  if (!Array.isArray(r.list)) return undefined;
  const list: DraftGoal[] = r.list.flatMap((x: unknown, i: number) => {
    if (!x || typeof x !== 'object') return [];
    const g = x as Record<string, unknown>;
    if (!KINDS.includes(g.kind as GoalKind)) return [];
    return [{ id: typeof g.id === 'string' && g.id ? g.id : `g${i + 1}`, kind: g.kind as GoalKind,
      ...(typeof g.rounds === 'number' ? { rounds: g.rounds } : {}), ...(g.who === 'all' || g.who === 'any' ? { who: g.who } : {}),
      ...(Array.isArray(g.hexes) ? { hexes: g.hexes.filter(isHex) } : {}), ...(typeof g.objectId === 'string' ? { objectId: g.objectId } : {}),
      ...(g.wantsObject === true ? { wantsObject: true } : {}) }];
  });
  const fail = Array.isArray(r.fail) ? (r.fail as unknown[]).filter((f): f is GoalFail => !!f && typeof f === 'object' && FAIL_KINDS.concat(['down']).includes((f as GoalFail).kind)) : [];
  return { mode: r.mode === 'any' ? 'any' : 'all', list, ...(fail.length ? { fail } : {}) };
}
