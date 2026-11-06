/**
 * Kuyruk 33 M2: boss paketi (kural sürümü 11). Efsanevi eylemler (SRD 5.2.1 Legendary Actions, `data/efsanevi.json`):
 * boss başka bir yaratığın turunun hemen ardından bir kullanım harcar, kendi turunun başında yenilenir; in olayı
 * (Volkan `lairEruption`): tur başında (inisiyatif 20) lav püskürmesi. Uçan boss yapay zekâsı `ai.ts`'te
 * (`bossFlightMove`). Hepsi Game Master anahtarı; eski savaşlar (sürüm < 11) birebir aynı.
 */
import { forcedMove, MOTION_VERSION } from './motion';
import { ruleVersion } from './ruleVersion';
import data from '../../data/efsanevi.json';
import { distance, sameHex, type Offset } from '../rules/hex';
import { rollD20, rollDice, rollTag, type Rng } from '../rules/dice';
import { isIncapacitated } from '../rules/conditions';
import { globalRule } from './ruleControl';
import { canSee, damageEffect, isUnderwater, ruleOf, saveEffect } from './maprules';
import { applyEvents } from './reduce';
import { isTargetable } from './common';
import { effectiveAc } from './divine';
import { strikeApi } from './reactions';
import { costsFrom } from '../rules/hex';
import { executeMove, moveCostFn, occupantAt, terrainAt } from './movement';
import { speedHexes } from './reduce';
import { surfaceEvent } from './surfaces';
import { isAirborne } from './flight';
import type { ActiveEffect, BattleEvent, BattleState, Combatant } from './types';
import type { Ability } from '../rules/abilities';
import { monsterAttackEvents } from './monsters';
import { monsterAreaEvents, bestAim } from './areaAttack';
import { checkReach, monsterAttackReach } from './range';
import { ring } from '../rules/hex';
import { castWithoutAction } from './castHook';
export { registerLegendaryCaster } from './castHook';

export interface LegendaryAction {
  id: string; tr: string; en: string; kind: 'strike' | 'rays' | 'command' | 'spell' | 'save' | 'teleport' | 'buff' | 'quake' | 'drain';
  /** Kuyruk 19 (SRD Legendary Actions; `scripts/k19-efsanevi.mjs`): ikinci saldırı seçeneği, ışınlanıp vuruş (Arcane Prowl), fırsat saldırısız yürüyüş. */
  alt?: string; teleportFt?: number; noOA?: boolean;
  /** Büyü (Spellcasting'den; seviye, DC, kendine, ardından yarım uçuş). */
  spell?: string; level?: number; self?: boolean; flyHalf?: boolean;
  /** Save: yetenek, menzil ya da alan, hasar (yarısı), durumlar (1 dk ya da sonraki turunun sonuna dek), süren etki, itme, Exhaustion, sürgün, atlanan türler, su altı. */
  save?: Ability; area?: { shape: 'sphere' | 'emanation' | 'line' | 'cone'; sizeFt: number; origin: 'point' | 'self'; widthFt?: number; rangeFt?: number };
  damage?: string; half?: boolean; conditions?: string[]; minute?: boolean; effect?: Partial<ActiveEffect>; push?: number;
  exhaustion?: number; banish?: boolean; skipTypes?: string[]; underwater?: boolean; moveAfter?: 'full';
  /** Işınlanma (Deathly/Radiant Teleport): uzaklık, uzaklaş/yaklaş, kalkış ya da varış noktasında patlama. */
  ft?: number; away?: boolean; toward?: boolean; burst?: { radiusFt: number; dice: string; type: string; at: 'origin' | 'dest'; save?: Ability; half?: boolean };
  /** Shimmering Shield; World-Shaking Movement; Psychic Drain. */
  tempHp?: string; ac?: number; radiusFt?: number; needs?: string[];
  attack?: string; count?: number; dice?: string; damageType?: string; bonus?: number; rangeFt?: number; oncePerTurn?: boolean;
  /** Kuyruk 43: Pounce: saldırıdan önce hızın yarısı kadar hareket (SRD 5.2.1). */
  halfMove?: boolean;
  /** Kuyruk 43: Commanding Presence: Command (2. seviye: iki hedef), WIS save DC'si ve söz. */
  dc?: number; word?: 'grovel' | 'halt';
}
export interface LegendarySpec { uses: number; actions: LegendaryAction[]; /** Kuyruk 19: SRD'den eklenen (anahtar `srdK19`). */ k19?: boolean }
const DATA = data as unknown as { defaultUses: number; monsters: Record<string, LegendarySpec>; yuva: LegendarySpec };

/** Savaşçının efsanevi eylemleri (anahtar kapalıysa, eski savaşta ya da boss değilse null). */
export function legendaryOf(state: BattleState, c: Combatant): LegendarySpec | null {
  if (!globalRule(state, 'legendaryActions')) return null;
  if (c.monsterId && DATA.monsters[c.monsterId]) {
    const spec = DATA.monsters[c.monsterId] as LegendarySpec;
    return spec.k19 && !globalRule(state, 'srdK19') ? null : spec;
  }
  if (state.map?.dragon?.id === c.id) return DATA.yuva;
  return null;
}
export const legendaryLeft = (c: Combatant, spec: LegendarySpec): number => c.legendaryLeft ?? spec.uses;

const awake = (c: Combatant) => c.hp > 0 && c.life !== 'dead' && !c.asleep && !c.unaware && !c.summon?.gone && !!c.pos && !isIncapacitated(c.conditions);
const foesOf = (s: BattleState, c: Combatant) =>
  Object.values(s.combatants).filter((o) => o.side !== c.side && !o.civilian && o.hp > 0 && o.life !== 'dead' && o.pos && isTargetable(o));

/** Bosslar (ayakta, uyanık, efsanevi eylemli). */
export function bosses(state: BattleState): Array<{ c: Combatant; spec: LegendarySpec }> {
  const out: Array<{ c: Combatant; spec: LegendarySpec }> = [];
  for (const c of Object.values(state.combatants)) {
    const spec = legendaryOf(state, c);
    if (spec) out.push({ c, spec });
  }
  return out;
}

/** Boss'un turu başlıyor: kullanımlar yenilenir (yalnızca harcanmışsa olay). */
export function legendaryRefreshEvents(state: BattleState, actorId: string): BattleEvent[] {
  const c = state.combatants[actorId];
  const spec = c ? legendaryOf(state, c) : null;
  if (!c || !spec || (c.legendaryLeft === undefined && !c.legendaryUsed?.length)) return [];
  return [{ type: 'legendary_refresh', actorId, left: spec.uses }];
}

/** Işın: büyü saldırısı (d20 + bonus, AC'ye karşı), isabette ateş hasarı. */
function rayEvents(state: BattleState, boss: Combatant, a: LegendaryAction, target: Combatant, rng: Rng): BattleEvent[] {
  const events: BattleEvent[] = [];
  let cur = state;
  for (let i = 0; i < (a.count ?? 1); i++) {
    const t = cur.combatants[target.id];
    if (!t || t.hp <= 0) break;
    const d = rollD20('normal', rollTag(rng, { by: boss.id, kind: 'attack' }));
    const total = d.kept + (a.bonus ?? 0);
    const hit = d.kept === 20 || (d.kept !== 1 && total >= effectiveAc(cur, t));
    const what = `${a.tr} ${i + 1}: d20 ${d.kept} + ${a.bonus ?? 0} = ${total} → ${hit ? 'isabet' : 'ıska'}`;
    const ev: BattleEvent = hit
      ? damageEffect(t, 'legendaryActions', what, { dice: d.kept === 20 ? doubled(a.dice ?? '1d6') : (a.dice ?? '1d6'), type: a.damageType ?? 'fire' }, rng)
      : { type: 'map_note', text: `${boss.name} → ${t.name}: ${what}.` };
    events.push(ev);
    cur = applyEvents(cur, [ev]);
  }
  return events;
}
const doubled = (dice: string) => dice.replace(/^(\d+)d/, (_, n: string) => `${Number(n) * 2}d`);

/**
 * Bir yaratığın turu bitti: her boss (başka biri, uyanık, kullanımı kalan) bir efsanevi eylem dener. Sıra: kullanılabilir
 * ışın (görüş + menzil), sonra erişimdeki düşmana tek saldırı. Kuralsız ya da eski savaşta boş.
 */
export function legendaryEvents(state: BattleState, endedId: string, rng: Rng): BattleEvent[] {
  if (state.status !== 'active' || !state.map) return [];
  const events: BattleEvent[] = [];
  let cur = state;
  for (const { c: b0, spec } of bosses(state)) {
    const b = cur.combatants[b0.id];
    if (!b || b.id === endedId || !awake(b) || legendaryLeft(b, spec) <= 0) continue;
    const foes = foesOf(cur, b).sort((x, y) => distance(x.pos as Offset, b.pos as Offset) - distance(y.pos as Offset, b.pos as Offset) || x.hp - y.hp);
    let done: BattleEvent[] = [];
    let used: LegendaryAction | null = null;
    // Kuyruk 19: koruyucu eylem (Shimmering Shield) yalnızca yarı HP'nin altındaki dost varken ve önce denenir.
    const hurt = Object.values(cur.combatants).some((c) => c.side === b.side && c.hp > 0 && c.hp < c.maxHp / 2);
    const order = spec.actions.filter((a) => a.kind !== 'buff' || hurt).sort((x, y) => Number(y.kind === 'buff') - Number(x.kind === 'buff'));
    for (const a of order) {
      if (a.oncePerTurn && b.legendaryUsed?.includes(a.id)) continue;
      if (a.kind === 'rays') {
        const t = foes.find((f) => distance(f.pos as Offset, b.pos as Offset) * 5 <= (a.rangeFt ?? 120) && canSee(cur, b, f));
        if (!t) continue;
        done = rayEvents(cur, b, a, t, rng); used = a; break;
      }
      if (a.kind === 'command') {
        const r = commandEvents(cur, b, a, foes, rng);
        if (!r.length) continue;
        done = r; used = a; break;
      }
      if (a.kind !== 'strike' || a.alt || a.teleportFt || a.noOA || (a.attack && !meleeAttack(b, a.attack))) {
        const r = k19Legendary(cur, b, a, foes, rng);
        if (!r.length) continue;
        done = r; used = a; break;
      }
      const api = strikeApi();
      let t = api ? foes.find((f) => api.can(cur, b.id, f.id)) : undefined;
      // Kuyruk 43: Pounce: erişimde düşman yoksa önce hızın yarısı kadar en yakın düşmana yürür (SRD 5.2.1).
      let moved: BattleEvent[] = [];
      if (api && !t && a.halfMove) {
        moved = pounceMove(cur, b, foes, rng);
        if (moved.length) {
          const after = applyEvents(cur, moved);
          t = foesOf(after, after.combatants[b.id] as Combatant).find((f) => api.can(after, b.id, f.id));
          if (t) { done = [...moved, ...api.strike(after, b.id, t.id, rng, a.attack)]; used = a; break; }
        }
        continue;
      }
      if (!api || !t) continue;
      done = api.strike(cur, b.id, t.id, rng, a.attack);
      if (!done.length) continue;
      used = a; break;
    }
    if (!used) continue;
    const note: BattleEvent = { type: 'legendary_used', actorId: b.id, actionId: used.id, name: used.tr, left: legendaryLeft(b, spec) - 1 };
    events.push(note, ...done);
    cur = applyEvents(cur, [note, ...done]);
  }
  return events;
}

/** Kuyruk 43: Pounce hareketi: hızın yarısı kadar, en yakın düşmanın bitişiğine (yol bulma, fırsat saldırısı dahil). */
export function pounceMove(state: BattleState, b: Combatant, foes: Combatant[], rng: Rng, allowFar = false): BattleEvent[] {
  if (!state.map || !b.pos) return [];
  const budget = Math.floor(speedHexes(b) / 2);
  if (budget <= 0) return [];
  const size = { cols: state.map.tiles[0]?.length ?? 0, rows: state.map.tiles.length };
  const costs = costsFrom(b.pos, size, moveCostFn(state, b), budget);
  let best: { to: Offset; d: number; cost: number } | null = null;
  for (const [key, cost] of costs) {
    if (cost === 0) continue;
    const [col, row] = key.split(',').map(Number) as [number, number];
    const to = { col, row };
    if (occupantAt(state, to, b.id) || terrainAt(state, to).movement !== 'normal' && terrainAt(state, to).movement !== 'difficult') continue;
    const d = Math.min(...foes.map((f) => distance(to, f.pos as Offset)));
    if (!best || d < best.d || (d === best.d && cost < best.cost)) best = { to, d, cost };
  }
  if (!best || (best.d > 1 && !allowFar)) return [];
  // Hareket bütçesi: kendi turunun dışında; hızın yarısı (yürüyüş sınırı için harcanmış sayılır).
  const mover = { ...b, movementUsed: speedHexes(b) - budget };
  const r = executeMove({ ...state, combatants: { ...state.combatants, [b.id]: mover } }, mover, best.to, rng);
  return r.ok ? r.events : [];
}

/**
 * Kuyruk 43: Commanding Presence (SRD 5.2.1): Command (2. seviye, iki hedef), WIS save; başarısızsa söz (yapay zekâ
 * Grovel: Prone ve sonraki turu kayıp). Hedef seçimi: menzilde ve görüşte, henüz komut altında olmayan, en tehlikeli
 * (büyücü önce, sonra en yüksek HP) iki düşman.
 */
function commandEvents(state: BattleState, b: Combatant, a: LegendaryAction, foes: Combatant[], rng: Rng): BattleEvent[] {
  const range = (a.rangeFt ?? 60) / 5;
  const pick = foes.filter((f) => distance(f.pos as Offset, b.pos as Offset) <= range && canSee(state, b, f) && !f.effects?.some((e) => e.command))
    .sort((x, y) => Number(y.spellNames.length > 0) - Number(x.spellNames.length > 0) || y.hp - x.hp).slice(0, a.count ?? 2);
  const events: BattleEvent[] = [];
  for (const t of pick) {
    const ev = saveEffect(t, 'legendaryActions', `${a.tr}: Command`, 'wis', a.dc ?? 15, rng);
    events.push(ev);
    if (ev.type === 'map_effect' && ev.roll && !ev.roll.success) {
      events.push({ type: 'effect_added', targetId: t.id, effect: { id: `command:${b.id}:${state.round}:${t.id}`, name: `${a.tr} (Command)`, sourceId: b.id, command: a.word ?? 'grovel', until: state.round + 1 } });
    }
  }
  return events;
}

/**
 * İn olayı (inisiyatif 20 = tur başı): Volkan'da ejderha (boss) uyanık ve ayaktayken yerdeki parti üyelerinden en
 * çok `count` tanesinin altıgeninde lav püskürür: DEX save, ateş hasarı (başarıda yarı; zar bir kez), altıgenler bir
 * tur alev yüzeyi.
 */
export function lairEvents(state: BattleState, rng: Rng): BattleEvent[] {
  const r = ruleOf(state, 'lairEruption');
  if (!r || state.status !== 'active') return [];
  const boss = bosses(state).map((x) => x.c).find(awake);
  if (!boss) return [];
  const victims = foesOf(state, boss).filter((f) => !isAirborne(f))
    .sort((a, b) => b.hp - a.hp || a.id.localeCompare(b.id)).slice(0, typeof r.count === 'number' ? r.count : 2);
  if (!victims.length) return [];
  const dice = typeof r.damage === 'string' ? r.damage : '3d6';
  const rolled = rollDice(dice, rollTag(rng, { by: boss.id, kind: 'damage' }));
  const hexes = victims.map((v) => v.pos as Offset);
  const events: BattleEvent[] = [{ type: 'map_note', text: `İn olayı: ${boss.name} lav püskürtüyor (${hexes.map((h) => `${h.col + 1},${h.row + 1}`).join('; ')}), hasar ${rolled.rolls.join('+')} = ${rolled.total}.` }];
  for (const v of victims) {
    events.push(saveEffect(v, 'lairEruption', 'lav püskürmesi', 'dex', typeof r.dc === 'number' ? r.dc : 15, rng,
      { hit: { dice, type: typeof r.damageType === 'string' ? r.damageType : 'fire', rolled, halfOnSave: true } }));
  }
  const fire = surfaceEvent(state, 'fire', hexes.filter((h, i) => hexes.findIndex((x) => sameHex(x, h)) === i), boss.id, boss.side);
  if (fire.type === 'zone_created') fire.zone.until = state.round;
  events.push(fire);
  return events;
}

// ------------------------------------------------------------------ Kuyruk 19: SRD efsanevi eylemleri

const attackIndex = (b: Combatant, name?: string) => (name ? b.attacks.findIndex((x) => x.name === name) : -1);
/** Saldırı yakın dövüş mü (eski `strike` yolu yalnızca yakın dövüş için). */
function meleeAttack(b: Combatant, name: string): boolean {
  const atk = b.attacks[attackIndex(b, name)];
  return !!atk && !atk.ranged && !atk.save;
}
const hexOf = (c: Combatant) => c.pos as Offset;
const sizeOfMap = (s: BattleState) => ({ cols: s.map?.tiles[0]?.length ?? 0, rows: s.map?.tiles.length ?? 0 });
const freeHex = (s: BattleState, h: Offset, self: string) => !occupantAt(s, h, self) && terrainAt(s, h).movement === 'normal';

/** Adlandırılmış saldırı (yakın dövüş, menzilli ya da save'li) erişimdeki ilk düşmana. */
function namedStrike(s: BattleState, b: Combatant, names: string[], foes: Combatant[], rng: Rng): BattleEvent[] {
  for (const n of names) {
    const i = attackIndex(b, n);
    const atk = b.attacks[i];
    if (!atk) continue;
    const t = foes.find((f) => checkReach(s, b, f, monsterAttackReach(atk)).ok);
    if (!t) continue;
    const r = atk.area && s.map ? monsterAreaEvents(s, b, i, hexOf(t), null, rng) : monsterAttackEvents(s, b, t, i, rng);
    if (r.ok && r.events.length) return r.events;
  }
  return [];
}

/** Yeni efsanevi eylem türleri (SRD 5.2.1; veri `data/efsanevi.json`, `k19: true`). */
export function k19Legendary(s: BattleState, b: Combatant, a: LegendaryAction, foes: Combatant[], rng: Rng): BattleEvent[] {
  const names = [a.attack, a.alt].filter((x): x is string => !!x);
  if (a.kind === 'strike') {
    let cur = s; let pre: BattleEvent[] = [];
    if (a.teleportFt) {
      // Arcane Prowl: görülen bir düşmanın yanındaki boş altıgene ışınlanır (yoksa yerinde vurur).
      const r = Math.floor(a.teleportFt / 5);
      const spots = foes.filter((f) => distance(hexOf(f), hexOf(b)) <= r + 1 && canSee(s, b, f))
        .flatMap((f) => ring(hexOf(f), 1, sizeOfMap(s))).filter((h) => distance(h, hexOf(b)) <= r && freeHex(s, h, b.id));
      if (spots[0] && !foes.some((f) => distance(hexOf(f), hexOf(b)) <= 1)) {
        pre = [{ type: 'teleported', actorId: b.id, from: hexOf(b), to: spots[0], label: a.tr }];
        cur = applyEvents(s, pre);
      }
    } else if (a.halfMove) {
      const mover = cur.combatants[b.id] as Combatant;
      const near = foesOf(cur, mover).filter((f) => names.some((n) => { const k = mover.attacks[attackIndex(mover, n)]; return k && checkReach(cur, mover, f, monsterAttackReach(k)).ok; }));
      if (!near.length) {
        pre = pounceMove(a.noOA ? { ...cur, combatants: { ...cur.combatants, [b.id]: { ...mover, economy: { ...mover.economy, disengaged: true } } } } : cur, mover, foes, rng);
        cur = applyEvents(cur, pre);
      }
    }
    const me = cur.combatants[b.id] as Combatant;
    const hit = namedStrike(cur, me, names, foesOf(cur, me), rng);
    return hit.length ? [...pre, ...hit] : [];
  }
  if (a.kind === 'spell') return legendarySpell(s, b, a, foes, rng);
  if (a.kind === 'save') return legendarySave(s, b, a, foes, rng);
  if (a.kind === 'teleport') return legendaryTeleport(s, b, a, foes, rng);
  if (a.kind === 'buff') {
    // Shimmering Shield: en düşük HP'li dost (kendisi dahil) 60 ft içinde: geçici HP ve AC +2 (sonraki turunun sonuna dek).
    const allies = Object.values(s.combatants).filter((c) => c.side === b.side && c.hp > 0 && c.pos && distance(hexOf(c), hexOf(b)) * 5 <= (a.rangeFt ?? 60))
      .sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp);
    const t = allies[0];
    if (!t) return [];
    const hp = rollDice(a.tempHp ?? '3d6', rollTag(rng, { by: b.id })).total;
    return [{ type: 'temp_hp', targetId: t.id, amount: hp, label: a.tr },
      { type: 'effect_added', targetId: t.id, effect: { id: `leg:${b.id}:${a.id}`, name: a.tr, sourceId: b.id, ac: a.ac ?? 2, until: s.round + 1 } }];
  }
  if (a.kind === 'quake') {
    // World-Shaking Movement: hızı kadar yürür; 60 ft'teki herkes konsantrasyonu kaybeder, Medium ve küçükler Prone.
    const moved = foes.some((f) => distance(hexOf(f), hexOf(b)) <= 1) ? [] : pounceMove({ ...s, combatants: { ...s.combatants, [b.id]: { ...b, movementUsed: -speedHexes(b) } } }, b, foes, rng);
    const cur = applyEvents(s, moved);
    const me = cur.combatants[b.id] as Combatant;
    const out: BattleEvent[] = [...moved];
    for (const c of Object.values(cur.combatants)) {
      if (c.id === me.id || c.hp <= 0 || !c.pos || isAirborne(c) || distance(hexOf(c), hexOf(me)) * 5 > (a.radiusFt ?? 60)) continue;
      if (c.concentration) out.push({ type: 'concentration_ended', actorId: c.id, label: a.tr });
      if (!['L', 'H', 'G'].includes(c.size ?? 'M') && !c.conditions.includes('Prone')) out.push({ type: 'map_effect', rule: 'legendaryActions', targetId: c.id, text: `${a.tr}: Prone`, addCondition: 'Prone' });
    }
    return out.length > moved.length ? out : [];
  }
  if (a.kind === 'drain') {
    // Psychic Drain: Charmed ya da Grappled bir yaratık varsa 1d10 HP (Consume Memories).
    const has = Object.values(s.combatants).some((c) => c.side !== b.side && c.hp > 0 && (a.needs ?? []).some((n) => c.conditions.includes(n)));
    if (!has || b.hp >= b.maxHp) return [];
    const amount = Math.min(b.maxHp - b.hp, rollDice(a.dice ?? '1d10', rollTag(rng, { by: b.id })).total);
    return [{ type: 'healed', actorId: b.id, targetId: b.id, label: a.tr, amount, targetHpAfter: b.hp + amount }];
  }
  return [];
}

/** Efsanevi büyü: büyü yapan canavarın Spellcasting'inden, eylem harcamadan (`castHook.ts`). */
function legendarySpell(s: BattleState, b: Combatant, a: LegendaryAction, foes: Combatant[], rng: Rng): BattleEvent[] {
  if (!a.spell) return [];
  const tries: Array<{ targetId?: string; targetHex?: Offset }> = a.self ? [{ targetId: b.id }] : foes.flatMap((f) => [{ targetId: f.id }, { targetHex: hexOf(f) }]);
  for (const t of tries) {
    const evs = castWithoutAction(s, b, a.spell, t, rng, { ...(a.level ? { level: a.level } : {}), ...(a.dc ? { dc: a.dc } : {}) });
    if (!evs) continue;
    // Kendi tarafını vuran alan büyüsü kullanılmaz.
    if (!a.self && evs.some((e) => e.type === 'save_resolved' && s.combatants[e.targetId]?.side === b.side)) continue;
    if (a.self && a.flyHalf) {
      const after = applyEvents(s, evs);
      const mover = after.combatants[b.id] as Combatant;
      return [...evs, ...(foes.some((f) => distance(hexOf(f), hexOf(mover)) <= 1) ? retreatMove(after, mover, foes, rng) : [])];
    }
    return evs;
  }
  return [];
}

/** Uzaklaşma hareketi (Cloaked Flight): hızın yarısı, en yakın düşmandan en uzak altıgen. */
export function retreatMove(s: BattleState, b: Combatant, foes: Combatant[], rng: Rng): BattleEvent[] {
  if (!s.map || !b.pos) return [];
  const budget = Math.floor(speedHexes(b) / 2);
  const costs = costsFrom(b.pos, sizeOfMap(s), moveCostFn(s, b), budget);
  let best: { to: Offset; d: number } | null = null;
  for (const [key, cost] of costs) {
    if (cost === 0) continue;
    const [col, row] = key.split(',').map(Number) as [number, number];
    const to = { col, row };
    if (!freeHex(s, to, b.id)) continue;
    const d = Math.min(...foes.map((f) => distance(to, hexOf(f))));
    if (!best || d > best.d) best = { to, d };
  }
  if (!best) return [];
  const mover = { ...b, movementUsed: speedHexes(b) - budget, economy: { ...b.economy, disengaged: true } };
  const r = executeMove({ ...s, combatants: { ...s.combatants, [b.id]: mover } }, mover, best.to, rng);
  return r.ok ? r.events : [];
}

/** Efsanevi save'li etki: canavar saldırısı yolundan (tek hedef ya da alan), başarısızlara durum/etki/itme/Exhaustion. */
export function legendarySave(s: BattleState, b: Combatant, a: LegendaryAction, foes0: Combatant[], rng: Rng): BattleEvent[] {
  if (!a.save) return [];
  if (a.underwater && !isUnderwater(s, b)) return [];
  const foes = foes0.filter((f) => !(a.skipTypes ?? []).includes(f.creatureType ?? ''));
  const atk = { name: a.tr, bonus: 0, damageDice: a.damage, damageType: a.damageType, save: { ability: a.save, dc: a.dc ?? 15, halfOnSave: !!a.half },
    repeat: 0, ranged: true, range: [a.rangeFt ?? 120, a.rangeFt ?? 120] as [number, number], text: a.en,
    ...(a.area ? { area: { ...a.area, targets: 'all' as const } } : {}) } as unknown as Combatant['attacks'][number];
  const fake: Combatant = { ...b, attacks: [atk], rechargeUsed: [] };
  let r: { ok: true; events: BattleEvent[] } | { ok: false; error: string } = { ok: false, error: '' };
  if (a.area) {
    const visible = new Set(foes.map((f) => f.id));
    if (a.area.origin === 'self' && a.area.shape === 'emanation') {
      const inside = Object.values(s.combatants).filter((c) => c.id !== b.id && c.hp > 0 && c.pos && distance(hexOf(c), hexOf(b)) * 5 <= a.area!.sizeFt);
      if (!inside.some((c) => visible.has(c.id)) || inside.some((c) => c.side === b.side && !(a.skipTypes ?? []).includes(c.creatureType ?? ''))) return [];
      r = monsterAreaEvents(s, fake, 0, hexOf(b), null, rng);
    } else {
      const best = bestAim(s, fake, { ...a.area, targets: 'all' } as never, a.area.rangeFt ?? 0, (c) => visible.has(c.id));
      if (!best || best.allies > 0 || best.foes < 1) return [];
      r = monsterAreaEvents(s, fake, 0, best.aim ?? hexOf(foes[0] as Combatant), null, rng);
    }
  } else {
    const t = foes.find((f) => distance(hexOf(f), hexOf(b)) * 5 <= (a.rangeFt ?? 120) && canSee(s, b, f) && !(a.conditions?.length && a.conditions.every((c) => f.conditions.includes(c))));
    if (!t) return [];
    r = monsterAttackEvents(s, fake, t, 0, rng);
  }
  if (!r.ok) return [];
  const out = [...r.events];
  for (const e of r.events) {
    if (e.type !== 'save_resolved' || e.success) continue;
    const t = s.combatants[e.targetId];
    if (!t || (a.skipTypes ?? []).includes(t.creatureType ?? '')) continue;
    if ((e.targetHpAfter ?? 1) <= 0) continue;
    const until = a.minute ? s.round + 10 : s.round + 1;
    const fx: Partial<ActiveEffect> = { ...(a.effect ?? {}) };
    if (a.conditions?.length) fx.grants = a.conditions;
    if (a.banish) fx.banished = true as never;
    if (Object.keys(fx).length) out.push({ type: 'effect_added', targetId: t.id, effect: { id: `leg:${b.id}:${a.id}:${t.id}`, name: a.tr, sourceId: b.id, until, ...fx } as ActiveEffect });
    if (a.exhaustion) out.push({ type: 'exhaustion_changed', targetId: t.id, level: Math.min(6, (t.exhaustion ?? 0) + a.exhaustion), reason: a.tr });
    if (a.push && t.pos && b.pos) out.push(...pushAway(applyEvents(s, out), b, t, Math.floor(a.push / 5), rng));
  }
  if (a.moveAfter === 'full') out.push(...pounceMove({ ...applyEvents(s, out), combatants: { ...applyEvents(s, out).combatants, [b.id]: { ...b, movementUsed: -speedHexes(b) } } }, b, foes, rng));
  return out;
}

/** Işınlanma (Deathly Teleport: düşmanlardan uzağa, kalkıştaki 10 ft'e hasar; Radiant Teleport: en çok düşmanın yanına, varışta DEX save). */
export function legendaryTeleport(s: BattleState, b: Combatant, a: LegendaryAction, foes: Combatant[], rng: Rng): BattleEvent[] {
  if (!s.map || !b.pos) return [];
  const r = Math.floor((a.ft ?? 60) / 5);
  const near = (h: Offset, rad: number) => foes.filter((f) => distance(hexOf(f), h) * 5 <= rad);
  const burstR = a.burst?.radiusFt ?? 10;
  const cand: Offset[] = [];
  const size = sizeOfMap(s);
  for (let row = 0; row < size.rows; row++) for (let col = 0; col < size.cols; col++) {
    const h = { col, row };
    if (distance(h, hexOf(b)) > r || sameHex(h, hexOf(b)) || !freeHex(s, h, b.id)) continue;
    cand.push(h);
  }
  if (!cand.length) return [];
  let to: Offset;
  if (a.away) {
    if (!near(hexOf(b), burstR).length) return [];
    to = cand.sort((x, y) => Math.min(...foes.map((f) => distance(hexOf(f), y))) - Math.min(...foes.map((f) => distance(hexOf(f), x))))[0] as Offset;
  } else {
    const scored = cand.map((h) => ({ h, n: near(h, burstR).length, al: Object.values(s.combatants).filter((c) => c.side === b.side && c.id !== b.id && c.pos && distance(hexOf(c), h) * 5 <= burstR).length }))
      .filter((x) => x.n >= 2 && x.al === 0).sort((x, y) => y.n - x.n);
    if (!scored[0]) return [];
    to = scored[0].h;
  }
  const from = hexOf(b);
  const out: BattleEvent[] = [{ type: 'teleported', actorId: b.id, from, to, label: a.tr }];
  const center = a.burst?.at === 'dest' ? to : from;
  for (const c of Object.values(s.combatants)) {
    if (c.id === b.id || c.hp <= 0 || !c.pos || distance(hexOf(c), center) * 5 > burstR || !a.burst) continue;
    if (a.burst.at === 'dest' && c.side === b.side) continue;
    out.push(a.burst.save
      ? saveEffect(c, 'legendaryActions', `${a.tr}`, a.burst.save, a.dc ?? 15, rng, { hit: { dice: a.burst.dice, type: a.burst.type, halfOnSave: !!a.burst.half } })
      : damageEffect(c, 'legendaryActions', a.tr, { dice: a.burst.dice, type: a.burst.type }, rng));
  }
  return out;
}

/** Düz itme (Cold Gale): kaynaktan uzağa `hexes` altıgen, engelde durur. */
export function pushAway(s: BattleState, src: Combatant, t: Combatant, hexes: number, rng: Rng): BattleEvent[] {
  // Kuyruk K53: sürüm 24+ tek zorla hareket girişi (varış kuralları, çarpma).
  if (ruleVersion(s) >= MOTION_VERSION && src.pos) return forcedMove(s, t.id, 'push', hexes * 5, 'legendary', rng, { origin: src.pos });
  let at = hexOf(t);
  const size = sizeOfMap(s);
  for (let i = 0; i < hexes; i++) {
    const next = ring(at, 1, size).filter((h) => distance(h, hexOf(src)) > distance(at, hexOf(src)) && freeHex(s, h, t.id))
      .sort((x, y) => distance(y, hexOf(src)) - distance(x, hexOf(src)))[0];
    if (!next) break;
    at = next;
  }
  return sameHex(at, hexOf(t)) ? [] : [{ type: 'pushed', targetId: t.id, from: hexOf(t), to: at, by: 'legendary' }];
}


