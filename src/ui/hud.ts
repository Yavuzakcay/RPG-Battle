/** Harita üstü arayüzün (HUD) saf yardımcıları: yüzen menü ve balon yerleşimi, parlayan hedefler. */
import { spells, type Spell } from '../data';
import { execute, type BattleState, type Combatant, type Command } from '../battle';
import { summonDef } from '../battle/summons';
import { axialToOffset, distance, offsetToAxial, type Offset } from '../rules/hex';
import { pickArea, type AreaTargetSpec } from '../battle/areaAttack';
import { contextFor } from './session';
import { attackChoices, isAreaSpell, type AttackChoice } from './mapView';
import { teleportHexes } from '../battle/teleport';

export interface Point {
  x: number;
  y: number;
}
export interface Box {
  w: number;
  h: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Jetonun çevresine dizilen düğmelerin merkezleri (px). Düğmeler, sahnenin içinde kalan açılar
 * arasından jetondan ortaya bakan yöne en yakın yaya, birbirine değmeyecek aralıkla dizilir;
 * böylece kenara yakın jetonda menü sığacak tarafa açılır. Yay sığmazsa yarıçap büyütülür.
 * Hiçbir yarıçap yetmezse düğmeler sahnenin içine itilir.
 */
export function radialLayout(token: Point, count: number, box: Box, radius: number, button: number): Point[] {
  const toCenter = Math.atan2(box.h / 2 - token.y, box.w / 2 - token.x);
  const half = button / 2 + 2;
  const STEP = Math.PI / 90;
  const N = 180;
  const at = (a: number, r: number): Point => ({ x: token.x + r * Math.cos(a), y: token.y + r * Math.sin(a) });
  const fits = (p: Point) => p.x >= half && p.x <= box.w - half && p.y >= half && p.y <= box.h - half;
  for (let r = radius; r <= radius * 4; r += 6) {
    const gap = 2 * Math.asin(Math.min(1, (button + 6) / (2 * r)));
    const spread = gap * (count - 1);
    if (gap * count > 2 * Math.PI) continue; // tam çemberde ilk ve son düğme çakışır
    const ok = Array.from({ length: N }, (_, i) => fits(at(toCenter + (i - N / 2) * STEP, r)));
    // Ortaya bakan yöne en yakın, yeterince uzun sığan aralığı ara (i: yayın başlangıcı).
    let best: number | null = null;
    const need = Math.ceil(spread / STEP);
    for (let i = 0; i + need < N; i++) {
      let all = true;
      for (let k = i; k <= i + need && all; k++) all = ok[k] as boolean;
      if (!all) continue;
      const mid = toCenter + (i + need / 2 - N / 2) * STEP;
      if (best === null || Math.abs(mid - toCenter) < Math.abs(best - toCenter)) best = mid;
    }
    if (best !== null) {
      return Array.from({ length: count }, (_, i) => at(best - spread / 2 + gap * i, r));
    }
  }
  // Tek yay sığmıyor (çok düğme, kenardaki jeton): iç içe halkalara, ortaya bakan yöne yakın
  // ve birbirine değmeyen yerlere sırayla yerleştir.
  const cands: Array<{ p: Point; ring: number; turn: number }> = [];
  for (let ring = 0; ring < 6; ring++) {
    const r = radius + ring * (button + 6);
    const step = 2 * Math.asin(Math.min(1, (button + 6) / (2 * r)));
    for (let k = 0; k * step < 2 * Math.PI; k++) {
      for (const sign of k === 0 ? [1] : [1, -1]) {
        const p = at(toCenter + sign * k * step, r);
        if (fits(p)) cands.push({ p, ring, turn: k * step });
      }
    }
  }
  cands.sort((x, y) => x.ring - y.ring || x.turn - y.turn);
  const picked: Point[] = [];
  for (const c of cands) {
    if (picked.length === count) break;
    if (picked.every((q) => Math.hypot(q.x - c.p.x, q.y - c.p.y) >= button + 4)) picked.push(c.p);
  }
  // Sahne gerçekten küçükse kalanlar kenara (son çare).
  for (let i = picked.length; i < count; i++) {
    const p = at(toCenter - Math.PI / 2 + (Math.PI * i) / Math.max(1, count - 1), radius);
    picked.push({ x: clamp(p.x, half, box.w - half), y: clamp(p.y, half, box.h - half) });
  }
  return picked;
}

/** Balonun sol üst köşesi (px): çapanın sağında, sığmazsa solunda; dikeyde sahnenin içinde. */
export function bubbleAt(anchor: Point, size: Box, box: Box, gap = 12): Point {
  const right = anchor.x + gap;
  const x = right + size.w <= box.w ? right : Math.max(0, anchor.x - gap - size.w);
  return { x, y: clamp(anchor.y - size.h / 2, 0, Math.max(0, box.h - size.h)) };
}

/** Saldırı seçenekleri (silah, canavar saldırısı, Multiattack) ve büyü seçenekleri ayrı. */
export const isSpellChoice = (c: AttackChoice) => c.id.startsWith('s-');

/** "Saldır" kipinde: en az bir saldırıyla vurulabilecek düşmanlar. */
export function attackTargets(state: BattleState, actorId: string): string[] {
  const side = state.combatants[actorId]?.side;
  return Object.values(state.combatants)
    .filter((c) => c.id !== actorId && c.side !== side)
    .filter((c) => attackChoices(state, actorId, c.id).some((ch) => !isSpellChoice(ch) && ch.command))
    .map((c) => c.id);
}

/** Tek hedefli büyünün yapılabileceği hedefler. */
export function spellTargets(state: BattleState, actorId: string, spellName: string): string[] {
  return Object.values(state.combatants)
    .filter((c) => attackChoices(state, actorId, c.id).some((ch) => ch.id === `s-${spellName}` && ch.command))
    .map((c) => c.id);
}

/** Büyü listesi: tek hedefli, alan ve elle uygulanan (hedefsiz) büyüler. */
export function spellMenu(actor: Combatant): Array<{ spell: Spell; kind: 'target' | 'area' | 'self' | 'effect' | 'summon' | 'teleport' }> {
  return actor.spellNames
    .map((n) => spells.find((s) => s.name === n))
    .filter((s): s is Spell => s !== undefined)
    // Tepki büyüleri menüde yok: tetik olunca sorulur (Görev R1).
    .filter((s) => s.castingTime !== 'reaction')
    // Ritüel (Find Familiar) savaşta yapılmaz: kurulumda (Görev R3).
    .filter((s) => s.castingTime !== 'ritual')
    .map((spell) => ({
      spell,
      kind: isAreaSpell(spell) ? 'area' as const
        // Çağırma büyüsü (Find Steed, Summon Dragon; Görev R3): yer ve tür seçimi.
        : spell.mechanics.kind === 'summon' ? 'summon' as const
        // Işınlanma (Misty Step; Görev S1): hedef altıgen seçimi.
        : spell.mechanics.kind === 'teleport' ? 'teleport' as const
        // Etki büyüsü (Bless, Bane, Guidance…; Görev R2): çoklu hedef ve seçim kipinde.
        // Görev B1: çok hedefli iyileştirme (Mass Healing Word) de çoklu hedef kipinde.
        : spell.mechanics.kind === 'effect' || spell.mechanics.healTargets ? 'effect' as const
        : spell.mechanics.kind === 'utility' || spell.mechanics.revive === 'revive' || (spell.mechanics.kind === 'buff' && !spell.mechanics.ward) ? 'self' as const : 'target' as const,
    }));
}

/** Büyünün atılabileceği slot seviyeleri (büyü seviyesi ve üstü, dolu olanlar), küçükten büyüğe. */
export function slotChoices(actor: Combatant, spell: Spell): number[] {
  if (spell.level === 0) return [];
  return actor.spellSlots.map((n, i) => (n > 0 && i + 1 >= spell.level ? i + 1 : 0)).filter((l) => l > 0);
}

/** Büyü slotu var mı (cantrip her zaman). */
export function hasSlotFor(actor: Combatant, spell: Spell): boolean {
  return spell.level === 0 || actor.spellSlots.some((n, i) => i + 1 >= spell.level && n > 0);
}

/**
 * Etki büyüsünün tek tek seçilebilecek hedefleri (Görev R2): motorda zarsız denenerek (dost ya da düşman, menzil).
 */
export function effectTargets(state: BattleState, actorId: string, spell: Spell): string[] {
  const choice = spell.mechanics.effect?.choices?.[0];
  return Object.values(state.combatants)
    .filter((c) => execute(state, { type: 'cast_spell', actorId, spellName: spell.name, targetIds: [c.id], ...(choice ? { choice } : {}) },
      contextFor(state, actorId), () => 0.5).ok)
    .map((c) => c.id);
}

/** Çağırma büyüsünün yapılabileceği altıgenler (Görev R3): menzil içinde, motorda zarsız denenerek. */
/** Işınlanılabilecek altıgenler (Görev S1; Misty Step). */
export function teleportTargets(state: BattleState, actorId: string, spell: Spell): Offset[] {
  const actor = state.combatants[actorId];
  return actor && spell.mechanics.teleport ? teleportHexes(state, actor, spell.mechanics.teleport) : [];
}

/** Görev K3: özelliğin ışınlanma hedefleri (Cloud's Jaunt). */
export function featureTeleportHexes(state: BattleState, actorId: string, featureKey: string): Offset[] {
  const actor = state.combatants[actorId];
  const e = actor?.features?.find((f) => f.key === featureKey)?.effect;
  return actor && e?.kind === 'teleport' ? teleportHexes(state, actor, e) : [];
}

export function summonHexes(state: BattleState, actorId: string, spell: Spell, choice?: string | null): Offset[] {
  const actor = state.combatants[actorId];
  const def = summonDef(spell.id);
  if (!actor?.pos || !def || !state.map) return [];
  const out: Offset[] = [];
  const rows = state.map.tiles.length;
  const cols = state.map.tiles[0]?.length ?? 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const at = { col, row };
      if (distance(actor.pos, at) * 5 > def.rangeFt) continue;
      const cmd: Command = { type: 'cast_spell', actorId, spellName: spell.name, targetHex: at, ...(choice ? { choice } : {}) };
      if (execute(state, cmd, contextFor(state, actorId), () => 0.5).ok) out.push(at);
    }
  }
  return out;
}

/**
 * Alan eylemi (Görev R4): alan büyüsü, canavarın alanlı saldırısı (nefes, koni, çizgi…) ya da Dragonborn nefesi.
 * Önizleme ve onaylanacak komut aynı veriden (motorun `pickArea`'sı: menzil, görüş, siper).
 */
export type AreaAct = { kind: 'spell'; spell: Spell } | { kind: 'monster'; index: number } | { kind: 'breath'; shape: 'cone' | 'line' };

export function areaActSpec(actor: Combatant, act: AreaAct): { spec: AreaTargetSpec; rangeFt: number; label: string } | null {
  if (act.kind === 'spell') return act.spell.area ? { spec: act.spell.area, rangeFt: act.spell.rangeFt, label: act.spell.name } : null;
  if (act.kind === 'monster') {
    const a = actor.attacks[act.index];
    return a?.area ? { spec: a.area, rangeFt: a.area.rangeFt ?? 0, label: a.name } : null;
  }
  const s = actor.breath?.shapes.find((x) => x.shape === act.shape);
  return s ? { spec: { shape: s.shape, sizeFt: s.sizeFt, origin: 'self', targets: 'all', ...(s.widthFt ? { widthFt: s.widthFt } : {}) }, rangeFt: 0, label: 'Breath Weapon' } : null;
}

export function areaActCommand(actorId: string, act: AreaAct, aim: Offset | null, slotLevel?: number | null, wallShape?: 'arc' | null): Command {
  if (act.kind === 'spell') return { type: 'cast_spell', actorId, spellName: act.spell.name, ...(aim ? { targetHex: aim } : {}), ...(slotLevel ? { slotLevel } : {}),
    ...(wallShape && act.spell.area?.shape === 'wall' ? { wallShape } : {}) };
  if (act.kind === 'monster') return { type: 'monster_attack', actorId, targetId: '', attackIndex: act.index, ...(aim ? { targetHex: aim } : {}) };
  return { type: 'breath_weapon', actorId, shape: act.shape, targetHex: aim ?? { col: 0, row: 0 } };
}

/** Önizleme: kaplanan altıgenler, etkilenecek dostlar ve düşmanlar (motorla aynı), yapılamıyorsa nedeni. */
export function areaActPreview(state: BattleState, actor: Combatant, act: AreaAct, aim: Offset | null, wallShape?: 'arc' | null):
  { hexes: Offset[]; friends: Combatant[]; foes: Combatant[]; error: string | null } {
  const s = areaActSpec(actor, act);
  if (!s) return { hexes: [], friends: [], foes: [], error: null };
  const spec = wallShape && s.spec.shape === 'wall' ? { ...s.spec, bend: wallShape } : s.spec;
  const pick = pickArea(state, actor, spec, s.rangeFt, aim);
  if ('ok' in pick) return { hexes: [], friends: [], foes: [], error: pick.error };
  const friend = (c: Combatant) => c.side === actor.side || c.civilian;
  return { hexes: pick.hexes, friends: pick.reached.filter((x) => friend(x.c)).map((x) => x.c), foes: pick.reached.filter((x) => !friend(x.c)).map((x) => x.c), error: null };
}

/**
 * Yön okları (Görev R4; dokunmatikte rahat seçim): yaratıktan çıkan koni/çizgi için altı altıgen yönünde alanın boyu kadar
 * ötedeki nişan noktası (harita dışında kalabilir; yalnızca yön verir). Sıra: saat yönünde, üstten başlayarak.
 */
export function directionAims(from: Offset, sizeFt: number): Array<{ dir: number; aim: Offset }> {
  const steps = Math.max(1, Math.floor(sizeFt / 5));
  const a = offsetToAxial(from);
  // Düz üstlü altıgen: üst, sağ üst, sağ alt, alt, sol alt, sol üst (eksenel yönler).
  const dirs = [[0, -1], [1, -1], [1, 0], [0, 1], [-1, 1], [-1, 0]] as const;
  return dirs.map(([dq, dr], i) => ({ dir: i, aim: axialToOffset({ q: a.q + dq * steps, r: a.r + dr * steps }) }));
}

/** Canavarın alanlı saldırıları (kullanılabilir olanlar; Recharge bekleyen işaretli). */
export function areaAttacksOf(actor: Combatant): Array<{ index: number; name: string; ready: boolean }> {
  return actor.attacks.flatMap((a, index) => (a.area && a.save ? [{ index, name: a.name, ready: !(a.recharge !== undefined && actor.rechargeUsed.includes(index)) }] : []));
}
