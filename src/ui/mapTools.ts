/**
 * Kuyruk KQ5 GH1: tek "aktif harita aracı" modeli (saf). Haritaya dokunuşun sahibi her an tek araçtır: hedef (altıgen/nesne seçimi),
 * yüzey, nesne (yerleştir/ağırlık) ya da yaratık yerleştirme (varsayılan). Biri açılınca ötekiler kapanır; hedef aracı açıkken
 * yüzey/nesne araç çubukları görünmez ("yerleştir" nesnesi hedefe bağlama kipi hariç, o nesne aracını hedef için kullanır).
 * Önceki hata (OD1C): yüzey aracı açıkken hedef şeridine geçilince tıklama hedefe gitmiyordu.
 */
export type GoalPick = { id: string; how: 'hex' | 'obj' | 'place' };
export interface ToolState { mode: string; goalPick: GoalPick | null }
export type ActiveTool = 'goal' | 'surface' | 'object' | 'creature';
export type HexOwner = 'goal-hex' | 'goal-obj' | 'inspect' | 'object' | 'surface' | 'default';

export function activeTool(s: ToolState): ActiveTool {
  if (s.goalPick) return s.goalPick.how === 'place' ? 'object' : 'goal';
  return s.mode === 'gmSurface' ? 'surface' : s.mode === 'gmObject' ? 'object' : 'creature';
}

/** Hedef aracını açar (ya da aynı seçimi kapatır): yüzey/nesne çubukları kapanır; "yerleştir" nesne aracını hedef için açar. */
export function openGoalTool(s: ToolState, pick: GoalPick | null): ToolState {
  if (!pick) return { mode: s.goalPick?.how === 'place' ? 'idle' : s.mode === 'gmSurface' || s.mode === 'gmObject' ? 'idle' : s.mode, goalPick: null };
  return { mode: pick.how === 'place' ? 'gmObject' : 'idle', goalPick: pick };
}

/** Yüzey ya da nesne aracını açar: hedef aracı kapanır. */
export const openModeTool = (_s: ToolState, mode: 'gmSurface' | 'gmObject' | 'idle'): ToolState => ({ mode, goalPick: null });

/** Altıgene dokunuşu kim alır (öncelik: hedef, ağırlık, nesne, yüzey, varsayılan). */
export function hexOwner(s: ToolState, setup: boolean, objectPick?: string): HexOwner {
  if (s.goalPick && setup && s.goalPick.how === 'hex') return 'goal-hex';
  if (s.goalPick && setup && s.goalPick.how === 'obj') return 'goal-obj';
  if (s.mode === 'gmObject') return objectPick === 'inspect' ? 'inspect' : 'object';
  if (s.mode === 'gmSurface') return 'surface';
  return 'default';
}

/** Hangi araç çubuğu gösterilir: hedef aracı açıkken yüzey çubuğu yok; nesne çubuğu yalnız "yerleştir" bağlama kipinde. */
export const toolbarShown = (s: ToolState, bar: 'surface' | 'object'): boolean =>
  bar === 'surface' ? s.mode === 'gmSurface' && !s.goalPick : s.mode === 'gmObject' && (!s.goalPick || s.goalPick.how === 'place');
