/**
 * Harita ekranının saf yardımcıları: altıgen çizim geometrisi, yürünebilir ve atlanabilir
 * altıgenler, saldırı önizlemesi, alan önizlemesi ve zemin bilgisi. Kuralları kopyalamaz:
 * yürüme ve atlama komutları zar atmadığı için motor üzerinde denenerek bulunur, saldırı
 * önizlemesi motorun menzil/siper/görüş denetimini kullanır.
 */
import { spells, type Spell } from '../data';
import { execute, type BattleState, type Combatant, type Command } from '../battle';
import { heightOf } from '../battle/cover';
import { terrainAt } from '../battle/movement';
import { checkReach, monsterAttackReach, optionReach, spellReach, type Reach } from '../battle/range';
import { hideInfo } from './stealthView';
import { getMap } from '../map/maps';
import { TRIGGERED, activeRules, isBog, litHexes, ruleHex, ruleOf } from '../battle/maprules';
import { gateAt } from '../battle/mapcommands';
import { areaHexes } from '../rules/area';
import { distance, hexKey, type Offset } from '../rules/hex';
import { GM_CONTEXT, contextFor } from './session';
import { hexText } from './log';
import { t } from '../i18n';

/** Harita görselinin piksel boyutu; ızgara bu koordinatlarda çizilir. */
export const VIEW = { w: 1280, h: 715 };
const COLS = 15;
const ROWS = 7;
/** Altıgen yarı genişliği ve yüksekliği (görsel 23 yarım genişlik × 7,5 altıgen yüksekliği). */
const S = VIEW.w / 23;
const HH = VIEW.h / (ROWS + 0.5);

export function hexCenter(o: Offset): { x: number; y: number } {
  return { x: S + o.col * 1.5 * S, y: HH / 2 + o.row * HH + (o.col % 2 === 1 ? HH / 2 : 0) };
}

/** Düz üstlü altıgenin köşeleri (SVG polygon `points`); `scale` < 1 içe çekilmiş altıgen. */
export function hexPoints(o: Offset, scale = 1): string {
  const { x, y } = hexCenter(o);
  const w = S * scale;
  const h = (HH / 2) * scale;
  return [[x - w, y], [x - w / 2, y - h], [x + w / 2, y - h], [x + w, y], [x + w / 2, y + h], [x - w / 2, y + h]]
    .map(([px, py]) => `${(px ?? 0).toFixed(1)},${(py ?? 0).toFixed(1)}`).join(' ');
}

export function allHexes(): Offset[] {
  const out: Offset[] = [];
  for (let row = 0; row < ROWS; row++) for (let col = 0; col < COLS; col++) out.push({ col, row });
  return out;
}

const noRoll = () => 0.5;
const tryCommand = (state: BattleState, cmd: Command) =>
  execute(state, cmd, contextFor(state, 'actorId' in cmd ? cmd.actorId : ''), noRoll);

/** Yürüyerek gidilebilen altıgenler ve maliyetleri (motorun `move` komutu denenerek). */
export function movableHexes(state: BattleState, actorId: string): Map<string, number> {
  const out = new Map<string, number>();
  const actor = state.combatants[actorId];
  if (!actor?.pos || state.status !== 'active') return out;
  for (const h of allHexes()) {
    const r = tryCommand(state, { type: 'move', actorId, to: h });
    const ev = r.ok ? r.events[0] : undefined;
    // Yol bir kural yüzünden yarıda kesiliyorsa (batak, buz) o altıgene varılamaz.
    const last = ev?.type === 'moved' ? ev.path[ev.path.length - 1] : undefined;
    if (ev?.type === 'moved' && last && last.col === h.col && last.row === h.row) out.set(hexKey(h), ev.cost);
  }
  return out;
}

/** Atlanabilen altıgenler (motorun `jump` komutu denenerek; yarım altıgen kayması dahil). */
export function jumpHexes(state: BattleState, actorId: string): Offset[] {
  const actor = state.combatants[actorId];
  if (!actor?.pos || state.status !== 'active') return [];
  return allHexes().filter((h) => tryCommand(state, { type: 'jump', actorId, to: h }).ok);
}

export interface AttackChoice {
  id: string;
  label: string;
  /** Yapılabilirse komut; yapılamıyorsa null ve nedeni `detail`de. */
  command: Command | null;
  detail: string;
}

/** Tek hedefli büyü mü (alan büyüleri haritada hedef altıgen ister). */
export function isAreaSpell(spell: Spell): boolean {
  return spell.area !== undefined && (spell.mechanics.kind === 'save' || spell.mechanics.kind === 'sleep');
}

function previewText(state: BattleState, actor: Combatant, target: Combatant, reach: Reach): { ok: boolean; text: string } {
  const r = checkReach(state, actor, target, reach);
  if (!r.ok) return { ok: false, text: r.error };
  const V = t().view;
  const parts: string[] = [];
  if (actor.pos && target.pos) {
    const d = distance(actor.pos, target.pos);
    parts.push(V.distance(d));
  }
  if (r.cover) parts.push(V.cover(r.cover));
  const ha = heightOf(state, actor);
  const ht = heightOf(state, target);
  if (ha > ht) parts.push(V.highGround);
  if (ha < ht) parts.push(V.lowGround);
  for (const s of r.sources) parts.push(`${s.reason} (${s.effect === 'advantage' ? V.adv : V.dis})`);
  return { ok: true, text: parts.join(' · ') };
}

/** Hedef seçilince: sıradaki savaşçının o hedefe yapabileceği saldırılar ve önizlemesi. */
export function attackChoices(state: BattleState, actorId: string, targetId: string): AttackChoice[] {
  const actor = state.combatants[actorId];
  const target = state.combatants[targetId];
  if (!actor || !target || actor.id === target.id) return [];
  const out: AttackChoice[] = [];
  const add = (id: string, label: string, reach: Reach, command: Command) => {
    const p = previewText(state, actor, target, reach);
    out.push({ id, label, command: p.ok ? command : null, detail: p.text });
  };
  actor.weaponOptions.forEach((o, i) =>
    add(`w${i}`, o.label, optionReach(o), { type: 'attack', actorId, targetId, option: o }));
  actor.attacks.forEach((a, i) => {
    const used = a.recharge !== undefined && actor.rechargeUsed.includes(i);
    if (used) out.push({ id: `m${i}`, label: a.name, command: null, detail: t().view.noRecharge });
    else add(`m${i}`, a.name, monsterAttackReach(a), { type: 'monster_attack', actorId, targetId, attackIndex: i });
  });
  if (actor.multiattack) {
    const first = actor.attacks.find((a) => !a.recharge && a.repeat > 0);
    if (first) add('multi', 'Multiattack', monsterAttackReach(first), { type: 'multiattack', actorId, targetId });
  }
  for (const name of actor.spellNames) {
    const spell = spells.find((s) => s.name === name);
    if (!spell || spell.mechanics.kind === 'utility' || isAreaSpell(spell)) continue;
    if (spell.mechanics.kind === 'buff' && !spell.mechanics.ward) continue;
    // İyileştirme ve koruma (Shield of Faith) dostlara, diğerleri düşmanlara.
    const friendly = spell.mechanics.kind === 'heal' || spell.mechanics.kind === 'buff';
    if (friendly ? target.side !== actor.side : target.side === actor.side) continue;
    add(`s-${name}`, spell.name, spellReach(spell), { type: 'cast_spell', actorId, spellName: name, targetId });
  }
  return out;
}

/** Sıradaki savaşçının alan büyüleri (haritada hedef altıgen seçilir). */
export function areaSpellsOf(actor: Combatant): Spell[] {
  return actor.spellNames.map((n) => spells.find((s) => s.name === n)).filter((s): s is Spell => !!s && isAreaSpell(s));
}

/** Alan büyüsünün seçilen noktada kaplayacağı altıgenler. */
export function areaPreview(state: BattleState, actor: Combatant, spell: Spell, aim: Offset | null): Offset[] {
  if (!spell.area || !actor.pos) return [];
  return areaHexes(spell.area, actor.pos, aim, { cols: COLS, rows: ROWS });
}

/** Altıgenin zemin bilgisi: harf, ad, siper, yükseklik, hareket, gizlenme. */
export function terrainInfo(state: BattleState, o: Offset, actor?: Combatant): string {
  const V = t().view;
  const tt = terrainAt(state, o);
  const parts = [`${hexText(o)} · "${tt.char}" ${tt.name}`, V.height(tt.height), V.move[tt.movement] ?? tt.movement];
  if (tt.cover) parts.push(V.coverPlain(tt.cover));
  if (tt.blocksSight) parts.push(V.blocksSight);
  // Gizlenme (Görev K): saklanılabilir mi, neden; sırası gelen savaşçıya göre (bitişik düşman, gece, gözcü).
  if (state.map) parts.push(hideInfo(state, actor, o));
  if (tt.hazard) parts.push(`${tt.hazard.damage} ${tt.hazard.damageType}`);
  if (isBog(state, o)) parts.push(V.bog);
  else if (tt.rule === 'deepWater' || (ruleOf(state, 'moat')?.terrain === tt.char)) parts.push(V.deepWater);
  if (tt.rule === 'ice' && ruleOf(state, 'ice')) parts.push(V.ice);
  if (tt.stairs) parts.push(V.stairs);
  const loot = ruleOf(state, 'loot');
  if (loot && (tt.char === 'h' || tt.char === 'k')) parts.push(V.loot(String(loot.note ?? V.lootDefault)));
  const marks = mapMarks(state);
  if (marks.traps.has(hexKey(o))) parts.push(V.trap);
  if (marks.warn.has(hexKey(o))) parts.push(V.lavaRising);
  if (marks.dark.has(hexKey(o))) parts.push(V.dark);
  return parts.join(' · ');
}

/** Kurulumda bir tarafın başlangıç altıgenleri. */
export function startZoneOf(state: BattleState, side: Combatant['side']): Offset[] {
  if (!state.map) return [];
  const map = getMap(state.map.id, { mirrored: state.map.mirrored, variantId: state.map.variantId });
  return side === 'party' ? map.startZones.players : map.startZones.enemies;
}

/** Kurulumda savaşçının konabileceği altıgenler (motorun `place` komutu denenerek; masumlar dahil). */
export function placeHexes(state: BattleState, actorId: string): Offset[] {
  if (state.status !== 'setup') return [];
  // Kurulumu GM yapar: herkes haritanın her geçerli, boş altıgenine (Görev F).
  return allHexes().filter((h) => execute(state, { type: 'place', actorId, at: h }, GM_CONTEXT, noRoll).ok);
}

/** Haritadaki işaretler: lav uyarısı, bulunmuş tuzaklar, kapalı kapı, karanlık (ışıksız) altıgenler. */
export function mapMarks(state: BattleState): { warn: Set<string>; traps: Set<string>; dark: Set<string> } {
  const warn = new Set((state.map?.lavaWarning?.hexes ?? []).map(hexKey));
  const traps = new Set([...(state.map?.trapsFound ?? []), ...(state.map?.trapsSprung ?? [])]);
  const dark = new Set<string>();
  // Karartma yalnızca görüş sınırı olan karanlıkta (`darkness`); gecenin ışıksız altıgeni bilgi kutusunda.
  if (ruleOf(state, 'darkness')) {
    const lit = litHexes(state);
    for (const h of allHexes()) if (!lit.has(hexKey(h))) dark.add(hexKey(h));
  }
  return { warn, traps, dark };
}

/** GM'in tetikleyebileceği harita olayları ve kapı (bu haritada varsa). */
export function gmMapActions(state: BattleState): { triggers: string[]; gate: { at: Offset; state: string } | null } {
  const triggers = activeRules(state).map((r) => r.id).filter((id) => (TRIGGERED as readonly string[]).includes(id));
  const rule = ruleOf(state, 'gate');
  if (!rule || !state.map) return { triggers, gate: null };
  const at = ruleHex(state, rule.hex);
  return { triggers, gate: { at, state: gateAt(state, at)?.state ?? 'open' } };
}
