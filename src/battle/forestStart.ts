/**
 * Kuyruk 24: Orman mekaniklerinin savaş başı kısmı (`startBattle` son adımı; sonuç başlangıç durumunda, replay aynı).
 * Kurallar `ruleOf` ile okunur: kural sürümü 3'ten eski savaşta ya da Game Master kapattıysa hiçbiri çalışmaz.
 * - `hornAlarm`: kuraldaki gruplar (nöbetçi + kamp) mevcut uyuyan/habersiz grup sistemine eklenir (`groupsFrom`).
 * - `logCover`: devrik kütük altıgenleri yarım siper zemine döner (`to`, varsayılan `k`); görsel aynı.
 * - `riverBlocked` (varsayılan kapalı): nehir zemini (`from`, `w`) geçilmez nehre (`to`, `R`) döner.
 * Saf; `create.ts` içe aktarır (döngü yok: `forest.ts` ayrı).
 */
import { groupsFrom } from './alarm';
import { ruleHex, ruleOf } from './maprules';
import type { BattleState, SleepGroup } from './types';

type RawGroup = { id: string; state?: string; hexes: Array<[number, number]>; links?: string[] };

export function applyForestStart(state: BattleState): BattleState {
  if (!state.map) return state;
  let s = state;
  const horn = ruleOf(s, 'hornAlarm');
  if (horn && Array.isArray(horn.groups)) {
    const extra = (groupsFrom(horn.groups as RawGroup[]) ?? []).filter((g) => !(s.groups ?? []).some((x) => x.id === g.id));
    if (extra.length) s = { ...s, groups: [...(s.groups ?? []), ...extra] as SleepGroup[] };
  }
  let tiles = s.map?.tiles ?? [];
  const set = (col: number, row: number, ch: string) => {
    const line = tiles[row];
    if (line === undefined || col < 0 || col >= line.length) return;
    tiles = tiles.map((l, r) => (r === row ? l.slice(0, col) + ch + l.slice(col + 1) : l));
  };
  const log = ruleOf(s, 'logCover');
  if (log && Array.isArray(log.hexes)) for (const xy of log.hexes) { const h = ruleHex(s, xy); set(h.col, h.row, String(log.to ?? 'k')); }
  const river = ruleOf(s, 'riverBlocked');
  if (river) {
    const from = String(river.from ?? 'w');
    const to = String(river.to ?? 'R');
    tiles = tiles.map((l) => l.split(from).join(to));
  }
  if (tiles !== s.map?.tiles) s = { ...s, map: { ...(s.map as NonNullable<BattleState['map']>), tiles } };
  return s;
}
