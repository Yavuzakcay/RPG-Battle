/**
 * Gizlenme (haritalı savaş, Görev K). Kurallar veriden: `data/stealth.json` (genel: DC, çalılık `g` +2, kum tepesi `d`)
 * ve haritanın `hide` alanı (kendi harfleri: çöl kumu, ağaç `a`, direk `m`, sandık `x` arkası…). Gizlenme yeri SRD'deki
 * "yoğun örtü ya da 3/4 siper arkası" şartının haritadaki karşılığıdır.
 *
 * SRD 5.2.1 Hide: DC 15 Dexterity (Stealth); düşmanın görüş hattı dışında olmalı. Başarıda Invisible; toplam, bulmak
 * için gereken Wisdom (Perception) DC'sidir. Ses, bulunma, saldırı ya da sözlü büyü bitirir. Buradaki sapmalar
 * (DECISIONS.md, Görev K): toplam ayrıca seni görebilen düşmanların en yüksek pasif Algısını geçmeli; bitişikteki
 * düşman seni her zaman fark eder (gizlenemezsin, gizliysen turunun başında bulur); yürüyünce de ortaya çıkarsın.
 * Gece (`night` kuralı): ışıksız altıgende karanlık görüşü olmayan gözcünün pasif Algısı düşer, Stealth avantajlı.
 */
import { extrasTotal, rollExtras } from '../rules/attack';
import { finishCheck } from './effectDice';
import stealthJson from '../../data/stealth.json';
import { getMap, type HideCover } from '../map/maps';
import { rollD20, rollTag, type Rng } from '../rules/dice';
import type { Offset } from '../rules/hex';
import { isIncapacitated } from '../rules/conditions';
import { checkMode, skillBonus, strCheckAdvantage } from '../rules/skills';
import { fail, type CommandResult } from './common';
import { lineOfFire } from './cover';
import { canSee, isUnlit, litHexes, mapHideSources, nightStealth, ruleNumber, ruleOf, trapHexes } from './maprules';
import { distance, neighbors } from '../rules/hex';
import { combineModes } from '../rules/modes';
import { terrainAt } from './movement';
import { applyEvents } from './reduce';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

/** SRD 5.2.1 Hide eyleminin zorluğu (data/stealth.json). */
export const HIDE_DC: number = stealthJson.dc;

interface HideRules { terrain: Record<string, number>; adjacentTo: Record<string, number>; cover: Record<string, HideCover> }

/** Genel kurallar ve haritanınkiler birleşik (aynı harf haritada ezilir). */
export function hideRulesOf(state: BattleState): HideRules {
  const own = state.map ? getMap(state.map.id).hide : {};
  return {
    terrain: { ...stealthJson.terrain, ...(own.terrain ?? {}) } as Record<string, number>,
    adjacentTo: { ...stealthJson.adjacentTo, ...(own.adjacentTo ?? {}) } as Record<string, number>,
    cover: { ...stealthJson.cover, ...(own.cover ?? {}) } as Record<string, HideCover>,
  };
}

/** Altıgen gizlenme yeriyse Stealth bonusu ve dayanağı (zemin ya da bitişik engel), değilse null. */
export function hideSpot(state: BattleState, at: Offset): { bonus: number; char: string; adjacent: boolean } | null {
  if (!state.map) return null;
  const t = terrainAt(state, at);
  if (t.movement === 'blocked' || t.movement === 'deadly') return null;
  const rules = hideRulesOf(state);
  const own = rules.terrain[t.char];
  const size = { cols: state.map.tiles[0]?.length ?? 0, rows: state.map.tiles.length };
  let best: { bonus: number; char: string; adjacent: boolean } | null = own !== undefined ? { bonus: own, char: t.char, adjacent: false } : null;
  for (const h of neighbors(at, size)) {
    const ch = terrainAt(state, h).char;
    const b = rules.adjacentTo[ch];
    if (b !== undefined && (!best || b > best.bonus)) best = { bonus: b, char: ch, adjacent: true };
  }
  return best;
}

/** Altıgen gizlenme yeriyse Stealth bonusu, değilse null. */
export function hideSpotBonus(state: BattleState, at: Offset): number | null {
  return hideSpot(state, at)?.bonus ?? null;
}

/** Gözcü olabilecek (uyanık, aklı başında) bir düşman mı. */
const watching = (w: Combatant, of: Combatant): boolean =>
  w.side !== of.side && !w.civilian && w.hp > 0 && !w.asleep && !!w.pos && !isIncapacitated(w.conditions);

/** Gözcünün pasif Algısı (10 + Algı); gece ışıksız altıgendeki hedefe karşı karanlık görüşsüzse ceza. */
export function passivePerception(state: BattleState, watcher: Combatant, at: Offset, lit = litHexes(state)): number {
  const night = nightStealth(state);
  const dark = night && watcher.darkvision === 0 && isUnlit(state, at, lit) ? night.penalty : 0;
  return stealthJson.passivePerceptionBase + skillBonus(watcher, 'perception') - dark;
}

export interface HideCheck {
  /** Burada gizlenilebilir mi; değilse neden (`reason`). */
  ok: boolean;
  reason: 'noMap' | 'notSpot' | 'adjacentEnemy' | null;
  /** Gizlenme yeri bonusu (yer değilse null) ve dayanağı. */
  spot: { bonus: number; char: string; adjacent: boolean } | null;
  /** Geçilmesi gereken toplam: DC 15 ya da seni görebilen düşmanların en yüksek pasif Algısı. */
  dc: number;
  /** En keskin gözcü (varsa). */
  watcher: { id: string; passive: number } | null;
  /** Gece ışıksız altıgen: Stealth avantajlı mı. */
  advantage: boolean;
  unlit: boolean;
  /** Bitişikteki (fark eden) düşman. */
  adjacentId: string | null;
}

/** `actor` `at` altıgeninde gizlenebilir mi ve hangi zorlukla (arayüz önizlemesi ve Gizlen komutu aynı hesap). */
export function hideCheck(state: BattleState, actor: Combatant, at: Offset | null = actor.pos): HideCheck {
  const base: HideCheck = { ok: false, reason: 'noMap', spot: null, dc: HIDE_DC, watcher: null, advantage: false, unlit: false, adjacentId: null };
  if (!state.map || !at) return base;
  const spot = hideSpot(state, at);
  const lit = litHexes(state);
  const unlit = isUnlit(state, at, lit);
  const night = nightStealth(state);
  const me = { ...actor, pos: at };
  const foes = Object.values(state.combatants).filter((w) => w.id !== actor.id && watching(w, actor));
  const adjacent = stealthJson.adjacentEnemyNotices
    ? foes.find((w) => distance(w.pos as Offset, at) <= 1 && canSee(state, w, me, lit)) : undefined;
  let watcher: HideCheck['watcher'] = null;
  for (const w of foes) {
    if (!canSee(state, w, me, lit) || lineOfFire(state, w, me).blocked) continue;
    const passive = passivePerception(state, w, at, lit);
    if (!watcher || passive > watcher.passive) watcher = { id: w.id, passive };
  }
  const dc = Math.max(HIDE_DC, watcher?.passive ?? 0);
  const reason = !spot ? 'notSpot' : adjacent ? 'adjacentEnemy' : null;
  return { ok: reason === null, reason, spot, dc, watcher, advantage: !!night?.advantage && unlit, unlit, adjacentId: adjacent?.id ?? null };
}

export function executeHide(state: BattleState, actor: Combatant, rng: Rng): CommandResult {
  if (!state.map || !actor.pos) return fail('Gizlenme yalnızca haritalı savaşta yapılır.');
  if (actor.hidden) return fail('Zaten gizlenmiş.');
  const check = hideCheck(state, actor);
  if (check.reason === 'notSpot') return fail(`Burada gizlenilemez (${terrainAt(state, actor.pos).name}).`);
  if (check.reason === 'adjacentEnemy') return fail(`Gizlenilemez: ${state.combatants[check.adjacentId ?? '']?.name ?? 'bir düşman'} hemen yanında, seni görüyor.`);
  const bonus = check.spot?.bonus ?? 0;
  const mode = combineModes([
    ...(actor.stealthDisadvantage ? [{ effect: 'disadvantage' as const, reason: 'Zırh' }] : []),
    ...mapHideSources(state),
    ...(check.advantage ? [{ effect: 'advantage' as const, reason: 'Karanlık (gece)' }] : []),
    // Rage + Primal Knowledge: Stealth STR ile yapılırsa Strength avantajı.
    ...(strCheckAdvantage(actor, 'stealth') ? [{ effect: 'advantage' as const, reason: 'Rage' }] : []),
  ]);
  const roll = rollD20(mode, rollTag(rng, { kind: 'check', by: actor.id, bonus: skillBonus(actor, 'stealth') + bonus }));
  // Zar eklentisi (Guidance: Stealth; Görev R2).
  const { total, extra } = finishCheck(actor, 'stealth', roll.kept, skillBonus(actor, 'stealth') + bonus, check.dc, mode, rng);
  const events: BattleEvent[] = [{
    type: 'hide_attempted', actorId: actor.id, mode, d20: roll.rolls, natural: roll.kept, total, bonus,
    dc: check.dc, success: total >= check.dc, ...(extra.length ? { bonusDice: extra } : {}),
    ...(check.watcher && check.watcher.passive > HIDE_DC ? { watcherId: check.watcher.id } : {}),
  }];
  return { ok: true, state: applyEvents(state, events), events };
}

/**
 * Bitişikteki düşman fark eder (Görev K): sırası gelen yaratığın yanındaki, onu görebileceği gizli düşmanlar
 * turunun başında bulunur. Gecede ve gündüzde aynı: karanlık uzaktan gizlenmeyi kolaylaştırır, yanı başından değil.
 */
export function noticeEvents(state: BattleState, c: Combatant): BattleEvent[] {
  if (!stealthJson.adjacentEnemyNotices || !state.map || !c.pos) return [];
  if (!Object.values(state.combatants).some((h) => h.hidden)) return [];
  const lit = litHexes(state);
  return Object.values(state.combatants)
    .filter((h) => h.hidden && h.pos && watching(c, h) && distance(h.pos, c.pos as Offset) <= 1 && canSee(state, c, h, lit))
    .map((h) => ({ type: 'revealed', actorId: h.id, reason: `${c.name} yanı başında fark etti` }));
}

/**
 * Arama: Wisdom (Perception) zarı; görüş hattındaki gizlenmiş düşmanlardan bulunma DC'si
 * toplamı aşmayanlar bulunur.
 */
export function executeSearch(state: BattleState, actor: Combatant, rng: Rng): CommandResult {
  if (!state.map || !actor.pos) return fail('Arama yalnızca haritalı savaşta yapılır.');
  const pmode = checkMode(actor, 'perception');
  const roll = rollD20(pmode, rollTag(rng, { kind: 'check', by: actor.id, bonus: skillBonus(actor, 'perception') }));
  const { total, extra } = finishCheck(actor, 'perception', roll.kept, skillBonus(actor, 'perception'), null, pmode, rng);
  const found = Object.values(state.combatants)
    .filter((c) => c.side !== actor.side && c.hidden && c.hidden.dc <= total && !lineOfFire(state, actor, c).blocked)
    .map((c) => c.id);
  const events: BattleEvent[] = [{ type: 'searched', actorId: actor.id, natural: roll.kept, total, found, ...(extra.length ? { bonusDice: extra } : {}) }];
  // Tuzaklar (Adım 8): 6 altıgen içindeki, bulunmamış ve tetiklenmemiş tuzak Perception DC'sine karşı.
  const trap = ruleOf(state, 'trap');
  const known = new Set([...(state.map.trapsFound ?? []), ...(state.map.trapsSprung ?? [])]);
  const pos = actor.pos;
  for (const h of trapHexes(state)) {
    if (trap && !known.has(`${h.col},${h.row}`) && distance(pos, h) <= 6 && total >= ruleNumber(trap, 'perceptionDc')) {
      events.push({ type: 'map_note', text: `${actor.name} bir tuzak buldu (${h.col + 1},${h.row + 1}).`, trapFound: h });
    }
  }
  return { ok: true, state: applyEvents(state, events), events };
}

/** Gizlenmiş yaratığı ortaya çıkaran komutlar ve sebepleri. */
const REVEALING: Partial<Record<Command['type'], string>> = {
  attack: 'saldırdı',
  monster_attack: 'saldırdı',
  multiattack: 'saldırdı',
  attack_gate: 'kapıya saldırdı',
  shove: 'itti',
  cast_spell: 'büyü yaptı',
  move: 'yürüdü',
  jump: 'atladı',
};

/** Başarılı bir komuttan sonra, komutu veren gizlenmişse ortaya çıkma olayı. */
export function revealEvent(before: BattleState, after: BattleState, cmd: Command): BattleEvent | null {
  if (!('actorId' in cmd)) return null;
  const reason = REVEALING[cmd.type];
  if (!reason || !before.combatants[cmd.actorId]?.hidden) return null;
  if (after.status !== 'active' || !after.combatants[cmd.actorId]?.hidden) return null;
  return { type: 'revealed', actorId: cmd.actorId, reason };
}
