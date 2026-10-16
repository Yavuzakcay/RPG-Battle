/**
 * Harita ekranının saf yardımcıları: altıgen çizim geometrisi, yürünebilir ve atlanabilir
 * altıgenler, saldırı önizlemesi, alan önizlemesi ve zemin bilgisi. Kuralları kopyalamaz:
 * yürüme ve atlama komutları zar atmadığı için motor üzerinde denenerek bulunur, saldırı
 * önizlemesi motorun menzil/siper/görüş denetimini kullanır.
 */
import { spells, type Spell } from '../data';
import { execute, type BattleState, type Combatant, type Command } from '../battle';
import { heightOf } from '../battle/cover';
import { hexLabel, terrainAt } from '../battle/movement';
import { checkReach, monsterAttackReach, optionReach, spellReach, type Reach } from '../battle/range';
import { hideSpotBonus } from '../battle/stealth';
import { getMap } from '../map/maps';
import { TRIGGERED, activeRules, isBog, litHexes, ruleHex, ruleOf } from '../battle/maprules';
import { gateAt } from '../battle/mapcommands';
import { areaHexes } from '../rules/area';
import { distance, hexKey, type Offset } from '../rules/hex';
import { contextFor } from './session';

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
  const parts: string[] = [];
  if (actor.pos && target.pos) {
    const d = distance(actor.pos, target.pos);
    parts.push(`${d} altıgen (${d * 5} ft)`);
  }
  if (r.cover) parts.push(`${r.cover === 5 ? '3/4' : 'yarım'} siper +${r.cover}`);
  const ha = heightOf(state, actor);
  const ht = heightOf(state, target);
  if (ha > ht) parts.push('yüksekten: avantaj');
  if (ha < ht) parts.push('alçaktan: dezavantaj');
  for (const s of r.sources) parts.push(`${s.reason} (${s.effect === 'advantage' ? 'avantaj' : 'dezavantaj'})`);
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
    if (used) out.push({ id: `m${i}`, label: a.name, command: null, detail: 'Şarj olmadı' });
    else add(`m${i}`, a.name, monsterAttackReach(a), { type: 'monster_attack', actorId, targetId, attackIndex: i });
  });
  if (actor.multiattack) {
    const first = actor.attacks.find((a) => !a.recharge && a.repeat > 0);
    if (first) add('multi', 'Multiattack', monsterAttackReach(first), { type: 'multiattack', actorId, targetId });
  }
  for (const name of actor.spellNames) {
    const spell = spells.find((s) => s.name === name);
    if (!spell || spell.mechanics.kind === 'utility' || isAreaSpell(spell)) continue;
    if (spell.mechanics.kind === 'heal' ? target.side !== actor.side : target.side === actor.side) continue;
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
export function terrainInfo(state: BattleState, o: Offset): string {
  const t = terrainAt(state, o);
  const move = { normal: 'normal zemin', difficult: 'zorlu zemin (2)', blocked: 'geçilmez', deadly: 'ölümcül (lav)' }[t.movement];
  const parts = [`${hexLabel(o)} · "${t.char}" ${t.name}`, `yükseklik ${t.height}`, move];
  if (t.cover) parts.push(`${t.cover === 5 ? '3/4' : 'yarım'} siper`);
  if (t.blocksSight) parts.push('görüşü keser');
  const hide = hideSpotBonus(state, o);
  if (hide !== null) parts.push(`gizlenme yeri${hide ? ` +${hide}` : ''}`);
  if (t.hazard) parts.push(`${t.hazard.damage} ${t.hazard.damageType}`);
  if (isBog(state, o)) parts.push('derin batak: saplanırsın');
  else if (t.rule === 'deepWater' || (ruleOf(state, 'moat')?.terrain === t.char)) parts.push('ağır zırhla batılır');
  if (t.rule === 'ice' && ruleOf(state, 'ice')) parts.push('kaygan: DEX save');
  if (t.stairs) parts.push('basamak (tırmanma yok)');
  const loot = ruleOf(state, 'loot');
  if (loot && (t.char === 'h' || t.char === 'k')) parts.push(`hazine: ${String(loot.note ?? 'GM hikâyede işler')}`);
  const marks = mapMarks(state);
  if (marks.traps.has(hexKey(o))) parts.push('TUZAK');
  if (marks.warn.has(hexKey(o))) parts.push('lav yükseliyor!');
  if (marks.dark.has(hexKey(o))) parts.push('karanlık');
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
  return allHexes().filter((h) => tryCommand(state, { type: 'place', actorId, at: h }).ok);
}

/** Haritadaki işaretler: lav uyarısı, bulunmuş tuzaklar, kapalı kapı, karanlık (ışıksız) altıgenler. */
export function mapMarks(state: BattleState): { warn: Set<string>; traps: Set<string>; dark: Set<string> } {
  const warn = new Set((state.map?.lavaWarning?.hexes ?? []).map(hexKey));
  const traps = new Set([...(state.map?.trapsFound ?? []), ...(state.map?.trapsSprung ?? [])]);
  const dark = new Set<string>();
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
