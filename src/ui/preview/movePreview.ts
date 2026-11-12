/**
 * Kuyruk K58 G1: oyuncu önizlemesi. Gerçek çözücünün kuru çalıştırması (`battle/ai/preview.ts` `previewCommand`)
 * üzerine arayüz özeti: hedef başına isabet/kritik olasılığı, hasar aralığı, kurtulma DC'si ve başarı olasılığı,
 * avantaj/dezavantaj kaynakları, dost ateşi, zorla hareket/ışınlanma varışı, fırsat saldırısı altıgenleri, tepkimeler.
 * İkinci hesap kodu yok. Keşif modu (G1b): keşfedilmemiş yüzey tepkimesi varsa sayılar tepkimesiz bir kuru
 * çalıştırmadan gelir (`yuzeyEtkilesimi: false`), sonuç hiç gösterilmez, yalnız "?" ipucu. Saf; durum değişmez.
 */
import { previewCommand, type CommandPreview, type Range } from '../../battle/ai/preview';
import { distance, type Offset } from '../../rules/hex';
import type { BattleEvent, BattleState, Command, CommandContext } from '../../battle/types';
import { visibleReactions, type DiscoveryStore, type PreviewSettings } from '../../app/discovery';

import { flySpeed } from '../../battle/flight';

export interface TargetLine {
  id: string;
  name: string;
  ally: boolean;
  self: boolean;
  hitP?: number;
  critP?: number;
  saveP?: number;
  dc?: number;
  ability?: string;
  damage: Range;
  healing: Range;
  killP: number;
  conditions: string[];
  movedTo?: Offset;
  teleportedTo?: Offset;
  /** Avantaj/dezavantaj kaynakları ("yükseklik: avantaj"). */
  reasons: string[];
}

export interface MovePreview {
  ok: boolean;
  error?: string;
  lines: TargetLine[];
  friendlyFire: number;
  selfDamage: number;
  /** Fırsat saldırısı: saldıran ve terk edilen altıgen (kırmızı çentik), beklenen hasar. */
  opportunity: Array<{ attackerId: string; at?: Offset; damage: number }>;
  /** Gösterilebilen tepkime satırları ve keşfedilmemiş tepkime var mı ("?" rozeti). */
  reactions: string[];
  mystery: boolean;
  /** Görev MB6b: binme/inme maliyeti (ft; hızın yarısı), kalan hareket, binek kontrollü olur mu, havadan düşme. */
  mount?: { kind: 'mount' | 'dismount'; costFt: number; leftFt: number; control?: 'kontrollu'; fell?: boolean };
  /** Ham önizleme (testler). */
  raw: CommandPreview;
}

/** Görev MB6b: binme/inme satırı (motorun `mounted`/`dismounted` olayından; kural yok). */
function mountLine(state: BattleState, cmd: Command, p: CommandPreview): MovePreview['mount'] {
  if (cmd.type !== 'mount' && cmd.type !== 'dismount') return undefined;
  const e = p.events.find((x) => (x.type === 'mounted' || x.type === 'dismounted') && x.actorId === cmd.actorId) as Extract<BattleEvent, { type: 'mounted' | 'dismounted' }> | undefined;
  const a = state.combatants[cmd.actorId];
  if (!e || !a) return undefined;
  const budget = Math.floor(a.speed / 5) * (1 + a.economy.dashes);
  const left = Math.max(0, budget - a.movementUsed - e.cost) * 5;
  // Uçamayan binici havadaki binekten inince komut sonunda düşer (MB3).
  const fell = (e.type === 'dismounted' && (e.toFt ?? a.altitudeFt ?? 0) > 0 && flySpeed(a) <= 0) || undefined;
  return { kind: e.type === 'mounted' ? 'mount' : 'dismount', costFt: e.cost * 5, leftFt: left,
    ...(e.type === 'mounted' && e.control === 'kontrollu' ? { control: 'kontrollu' as const } : {}), ...(fell ? { fell } : {}) };
}

const reasonsOf = (events: BattleEvent[], targetId: string): string[] => {
  const out = new Set<string>();
  for (const e of events) {
    if (e.type === 'attack_resolved' && e.targetId === targetId && e.mode !== 'normal') for (const r of e.reasons ?? []) out.add(`${r}: ${e.mode}`);
    if (e.type === 'save_resolved' && e.targetId === targetId && e.mode !== 'normal') for (const r of e.reasons ?? []) out.add(`${r}: ${e.mode}`);
  }
  return [...out];
};

/** Fırsat saldırılarının terk edilen altıgeni: yürüyüş yolunda saldıranın erişiminden çıkılan son altıgen. */
function oaHexes(state: BattleState, cmd: Command, events: BattleEvent[]): Array<{ attackerId: string; at?: Offset }> {
  const mover = 'actorId' in cmd ? cmd.actorId : undefined;
  const start = mover ? state.combatants[mover]?.pos ?? undefined : undefined;
  const path = [...(start ? [start] : []), ...events.flatMap((e) => (e.type === 'moved' && e.actorId === mover ? e.path : []))];
  const out: Array<{ attackerId: string; at?: Offset }> = [];
  for (const e of events) {
    if (!(e.type === 'attack_resolved' && e.opportunity && e.targetId === mover)) continue;
    const ap = state.combatants[e.actorId]?.pos;
    const reach = Math.max(1, Math.round(((e as { reachFt?: number }).reachFt ?? 5) / 5));
    const i = ap ? path.findIndex((h, k) => k < path.length - 1 && distance(h, ap) <= reach && distance(path[k + 1] as Offset, ap) > reach) : -1;
    out.push({ attackerId: e.actorId, ...(i >= 0 ? { at: path[i] } : {}) });
  }
  return out;
}

/** Tepkimesiz durum (keşfedilmemiş tepkimenin sonucu sızmasın). */
const noReactions = (s: BattleState): BattleState => ({ ...s, yuzeyEtkilesimi: false });

/** `gm`: Game Master görünümü (her şeyi görür; varsayılan: bağlam Game Master'sa). */
export function movePreview(state: BattleState, cmd: Command, ctx: CommandContext | undefined, disc: DiscoveryStore, set: PreviewSettings, gm = !!ctx?.isGm): MovePreview {
  const full = previewCommand(state, cmd, ctx);
  const rows = [...new Set(full.triggers.filter((x) => !x.startsWith('zone:')))];
  const vis = visibleReactions(rows, disc, set, gm);
  const p = vis.hidden.length ? previewCommand(noReactions(state), cmd, ctx) : full;
  const oa = oaHexes(state, cmd, p.events);
  return {
    ok: p.ok, ...(p.error ? { error: p.error } : {}),
    lines: p.targets.map((t) => {
      const sv = p.events.find((e): e is Extract<BattleEvent, { type: 'save_resolved' }> => e.type === 'save_resolved' && e.targetId === t.id);
      return {
        id: t.id, name: state.combatants[t.id]?.name ?? t.id, ally: t.ally, self: t.self,
        ...(t.hitP !== undefined ? { hitP: t.hitP } : {}), ...(t.critP !== undefined ? { critP: t.critP } : {}),
        ...(t.saveP !== undefined ? { saveP: t.saveP } : {}), ...(sv ? { dc: sv.dc, ability: sv.ability } : {}),
        damage: t.damage, healing: t.healing, killP: t.killP,
        conditions: Object.entries(t.conditions).filter(([, v]) => v > 0.01).map(([k]) => k),
        ...(t.movedTo ? { movedTo: t.movedTo } : {}), ...(t.teleportedTo ? { teleportedTo: t.teleportedTo } : {}),
        reasons: reasonsOf(p.events, t.id),
      };
    }),
    friendlyFire: p.friendlyFire, selfDamage: p.selfDamage,
    opportunity: p.opportunity.map((o, i) => ({ ...o, ...(oa[i]?.at ? { at: oa[i]?.at } : {}) })),
    reactions: vis.shown, mystery: vis.hidden.length > 0 && set.hints,
    ...(mountLine(state, cmd, p) ? { mount: mountLine(state, cmd, p) } : {}),
    raw: p,
  };
}

/**
 * K59: yürüyüş dokunuşunun kararı (dokun-önizle / dokun-onayla; arayüz `MapBattle` bunu çağırır). Önizleme açık ve
 * fırsat saldırısı varsa ilk dokunuş önizleme (çentik), aynı altıgene ikinci dokunuş yürür; başka altıgene dokunmak
 * yeni önizleme; fırsat saldırısı yoksa ya da önizleme kapalı/keşif modunda doğrudan yürür.
 */
export function moveTap(aim: { to: Offset } | null, to: Offset, on: boolean, preview: () => MovePreview): { kind: 'aim'; pv: MovePreview } | { kind: 'run' } {
  if (!on || (aim && aim.to.col === to.col && aim.to.row === to.row)) return { kind: 'run' };
  const pv = preview();
  return pv.ok && pv.opportunity.length ? { kind: 'aim', pv } : { kind: 'run' };
}

export const pct = (p: number | undefined): string => (p === undefined ? '–' : `%${Math.round(p * 100)}`);
export const rangeText = (r: Range): string => (r.max <= 0 ? '0' : r.min === r.max ? String(r.max) : `${r.min}–${Math.round(r.avg)}–${r.max}`);
