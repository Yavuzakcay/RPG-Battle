/**
 * Y1 G2: ortak eylem açıklayıcı kaydı. Her açıklayıcı bir eylem ailesinin aday komutlarını üretir (`gen`); puanı
 * değerlendirici (`evaluate.ts`) kuru çalıştırmayla verir. Eski elle yazılmış kurallar (alan büyüsü, zemin büyüsü,
 * iyileştirme, kontrol, Multiattack planı…) birer açıklayıcı olarak `ai.ts`'te kaydedilir; yeni davranışlar
 * (G3: Zihin Gücü kipleri, nesne fırlatma, çarpmalı itme, ışınlanma kaçışı, sarf eşyası…) aynı yoldan eklenir.
 * Döngüsel içe aktarma olmasın diye yardımcılar (`AiHelpers`) çağıran tarafından verilir. Saf.
 */
import type { Offset } from '../../rules/hex';
import type { BattleState, Combatant, Command } from '../types';

export type ActionKind = 'damage' | 'control' | 'heal' | 'support' | 'escape' | 'move' | 'utility';

/** `ai.ts`'in değerlendiriciye ve üreticilere verdiği yardımcılar (aynı karar için önbellekli). */
export interface AiHelpers {
  /** Saldırılabilir, görülen düşmanlar (öncelik sırasıyla). */
  foes: Combatant[];
  /** Ayaktaki dostlar (kendisi dahil, masumlar hariç). */
  allies: Combatant[];
  /** Komut motorca geçerli mi (ortalama zarla bir kez). */
  ok: (cmd: Command) => boolean;
  /** Yaratığın bir turluk tehdidi (beklenen hasar). */
  threat: (c: Combatant) => number;
  /** Bu yaratığın bu altıgende durma riski (`ai.ts` `risk`). */
  risk: (c: Combatant, h: Offset) => number;
  /** Hedef öncelik anahtarları (`data/yz-roller.json` `hedefOnceligi`): yakalanan, koşucu, hükümlü, Vex, sahip koruma. */
  priorityKeys: (c: Combatant) => string[];
  /** Eylemi var mı (Attack eyleminin kalan saldırıları dahil). */
  canAct: boolean;
}

export interface ActionDescriptor {
  id: string;
  kind: ActionKind;
  /** Hangi taraf üretir (yoksa iki taraf). */
  side?: 'party' | 'enemies';
  /** Aday komutlar (geçersizler değerlendirmede düşer). */
  gen: (state: BattleState, actor: Combatant, h: AiHelpers) => Array<Command | null | undefined>;
  /** Kısa açıklama (YZ-DENETIM.md). */
  note: string;
  /** Eski elle yazılmış kural üreticisi (koşullarını kendisi denetler): adaylarına `kuralOncelik` eklenir. */
  rule?: boolean;
}

const REGISTRY = new Map<string, ActionDescriptor>();

/** Açıklayıcı kaydı (aynı kimlik yeniden kaydedilirse yenisi geçerli). */
export function registerAction(d: ActionDescriptor): void {
  REGISTRY.set(d.id, d);
}

export const actionDescriptors = (): ActionDescriptor[] => [...REGISTRY.values()];

export interface Candidate { cmd: Command; desc: ActionDescriptor }

const cmdKey = (c: Command): string => JSON.stringify(c);

/** Bütün açıklayıcıların adayları (yinelenenler bir kez; kural üreticisi varsa onunki kalır). */
export function candidatesFor(state: BattleState, actor: Combatant, h: AiHelpers): Candidate[] {
  const out: Candidate[] = [];
  const seen = new Map<string, number>();
  for (const d of REGISTRY.values()) {
    if (d.side && d.side !== actor.side) continue;
    let cmds: Array<Command | null | undefined> = [];
    try { cmds = d.gen(state, actor, h); } catch { cmds = []; }
    for (const cmd of cmds) {
      if (!cmd) continue;
      const k = cmdKey(cmd);
      const at = seen.get(k);
      // Yinelenen aday: kural üreticisinin kaydı (önceliği olan) kalır.
      if (at !== undefined) { if (d.rule && !out[at]?.desc.rule) out[at] = { cmd, desc: d }; continue; }
      seen.set(k, out.length);
      out.push({ cmd, desc: d });
    }
  }
  return out;
}
