/**
 * Kuyruk 19: büyü duvarlarının SRD 5.2.1 eksikleri (anahtar `spellsK19`, kural sürümü 16).
 * - Wall of Force/Stone açılırken altıgenindeki yaratık büyücünün seçtiği yana itilir (`near`/`far`; varsayılan dost yakına,
 *   düşman uzağa); Wall of Stone her yandan kapatılan yaratığa DEX save, başarıda tepkisiyle hızı kadar dışarı çıkar.
 * - Wall of Stone panelleri: altıgen başına AC 15, 90 HP (15 cm kalınlık × 30 HP/2,5 cm, 10 ft panel = 2 altıgen);
 *   Poison ve Psychic'e bağışık; 0'da altıgen duvardan düşer. Saldırı `attack_object` (`wall:<alan>:<sütun>,<satır>`) ve
 *   alan hasarı. Konsantrasyon tam süre sürerse duvar kalıcı olur (`permanent`).
 * - Wall of Fire: hasar veren yüz (büyücünün seçtiği yan, 10 ft) `endHexes`.
 */
import { barriersOn } from './barriers';
import { resolveAttack } from '../rules/attack';
import { formatDice, parseDice, rollTag, type Rng } from '../rules/dice';
import { distance, hexKey, isInside, neighbors, sameHex, withinRange, type Offset } from '../rules/hex';
import { resolveSave } from '../rules/attack';
import { fail, finish, type CommandResult } from './common';
import { saveMode } from './durations';
import { saveDice } from './effectDice';
import { applyEvents } from './reduce';
import { canReact } from './reactions';
import { saveEffect } from './maprules';
import { globalRule } from './ruleControl';
import type { AttackOption, BattleEvent, BattleState, Combatant, SpellZone } from './types';
import { spells, type ZoneSpec } from '../data';

export const PANEL_AC = 15;
export const PANEL_HP = 90;
const sizeOf = (s: BattleState) => ({ cols: s.map?.tiles[0]?.length ?? 0, rows: s.map?.tiles.length ?? 0 });
const specOf = (z: SpellZone) => z.spec ?? spells.find((s) => s.id === z.spellId)?.mechanics.zone;
/** Panel değerleri: engel > büyü kuralı (Wall of Ice) > Wall of Stone varsayılanı. */
export function panelStats(z: SpellZone): { hp: number; ac: number; immune: string[]; vuln: string[] } {
  const s = specOf(z);
  return { hp: z.barrier?.hp ?? s?.panelHp ?? PANEL_HP, ac: z.barrier?.ac ?? s?.panelAc ?? PANEL_AC, immune: s?.panelImmune ?? ['poison', 'psychic'], vuln: s?.panelVuln ?? [] };
}

/** Duvar açılırken içinde kalanlar yana itilir; Wall of Stone ile kapatılan DEX save ile dışarı çıkar. */
export function wallOpenEvents(state: BattleState, actor: Combatant, zone: SpellZone, side: string | undefined, rng: Rng): BattleEvent[] {
  if (!globalRule(state, 'spellsK19') || !actor.pos || !specOf(zone)?.solid) return [];
  const wallKeys = new Set(zone.hexes.map(hexKey));
  const size = sizeOf(state);
  const out: BattleEvent[] = [];
  let s = state;
  const free = (h: Offset, id: string) => !wallKeys.has(hexKey(h)) && isInside(h, size)
    && !Object.values(s.combatants).some((o) => o.id !== id && o.hp > 0 && o.pos && sameHex(o.pos, h)) && (s.map?.tiles[h.row]?.[h.col] ?? '#') !== '#';
  for (const c of Object.values(state.combatants)) {
    if (!c.pos || c.hp <= 0 || !wallKeys.has(hexKey(c.pos))) continue;
    const want = side ?? (c.side === actor.side ? 'near' : 'far');
    const here = distance(actor.pos, c.pos);
    const options = withinRange(c.pos, 3, size).filter((h) => free(h, c.id)).sort((a, b) => distance(c.pos as Offset, a) - distance(c.pos as Offset, b));
    const pick = options.find((h) => (want === 'near' ? distance(actor.pos as Offset, h) < here : distance(actor.pos as Offset, h) > here)) ?? options[0];
    if (!pick) continue;
    const ev: BattleEvent = { type: 'pushed', targetId: c.id, from: c.pos, to: pick, by: actor.id };
    out.push(ev);
    s = applyEvents(s, [ev]);
    // Kuyruk K62 (sürüm 46, Wall of Ice): duvarın içinden geçtiği yaratık itilir ve DEX save (başarısızlıkta tam, başarıda yarı Cold).
    const cut = specOf(zone)?.cutDamage;
    if (cut) {
      const spell = spells.find((x) => x.id === zone.spellId);
      const up = Math.max(0, zone.slotLevel - (spell?.level ?? zone.slotLevel));
      const base = parseDice(cut.dice);
      const per = parseDice(cut.upDice);
      const hit = saveEffect(s.combatants[c.id] as Combatant, 'wallCut', zone.name, cut.save, zone.dc, rng, { hit: { dice: formatDice(base.count + per.count * up, base.sides, base.bonus), type: cut.type, halfOnSave: true } });
      out.push(hit);
      s = applyEvents(s, [hit]);
    }
  }
  // Wall of Stone: kapatılan yaratık (dışarıya yol yok) DEX save; başarıda tepkisiyle hızı kadar dışarı.
  if (specOf(zone)?.panels) {
    const after = s;
    for (const c of Object.values(after.combatants)) {
      if (!c.pos || c.hp <= 0) continue;
      const region = reach(after, c.pos, wallKeys, 40);
      if (region.size >= 40) continue;
      const r = resolveSave({ extra: saveDice(c, 'dex'), modifier: c.saves.dex, dc: actor.spellSaveDc ?? 10, mode: saveMode('normal', c, 'dex') }, rollTag(rng, { by: c.id }));
      out.push({ type: 'map_note', text: `${c.name}: duvarla kapatıldı, DEX save ${r.total}/${actor.spellSaveDc ?? 10} — ${r.success ? 'kaçtı' : 'içeride kaldı'}` });
      if (!r.success || !canReact(c)) continue;
      const speed = Math.floor(c.speed / 5);
      const exit = withinRange(c.pos, speed, size).filter((h) => !region.has(hexKey(h)) && free(h, c.id)).sort((a, b) => distance(c.pos as Offset, a) - distance(c.pos as Offset, b))[0];
      if (exit) out.push({ type: 'reaction_used', actorId: c.id, reaction: 'wall-escape', name: 'Duvardan kaç', trigger: 'damaged' }, { type: 'pushed', targetId: c.id, from: c.pos, to: exit, by: c.id });
    }
  }
  return out;
}

/** Duvarları geçmeden ulaşılan altıgenler (en çok `limit`). */
function reach(state: BattleState, from: Offset, walls: Set<string>, limit: number): Set<string> {
  const size = sizeOf(state);
  const seen = new Set([hexKey(from)]);
  let ring = [from];
  while (ring.length && seen.size < limit) {
    const next: Offset[] = [];
    for (const h of ring) for (const n of neighbors(h, size)) {
      const k = hexKey(n);
      if (seen.has(k) || walls.has(k) || (state.map?.tiles[n.row]?.[n.col] ?? '#') === '#') continue;
      seen.add(k);
      next.push(n);
    }
    ring = next;
  }
  return seen;
}

/** `wall:<alan>:<sütun>,<satır>` kimliği. */
export const panelId = (z: SpellZone, h: Offset) => `wall:${z.id}:${h.col},${h.row}`;
export function panelOf(state: BattleState, id: string): { zone: SpellZone; hex: Offset } | null {
  const m = /^wall:(.+):(\d+),(\d+)$/.exec(id);
  if (!m) return null;
  const zone = state.map?.zones?.find((z) => z.id === m[1]);
  const hex = { col: Number(m[2]), row: Number(m[3]) };
  return zone && (specOf(zone)?.panels || (zone.barrier?.hp && barriersOn(state))) && zone.hexes.some((h) => sameHex(h, hex)) ? { zone, hex } : null;
}

/** Panele hasar; 0'da altıgen duvardan düşer. */
export function panelDamageEvents(state: BattleState, zone: SpellZone, hex: Offset, damage: number, damageType: string): BattleEvent[] {
  // Kuyruk K53 S4: geçici engelin HP'si veriden (`barrier.hp`); eski panel 90.
  if (zone.barrier ? !barriersOn(state) || !zone.barrier.hp : !globalRule(state, 'spellsK19')) return [];
  const st = panelStats(zone);
  // Kuyruk K62 (Wall of Ice): bağışık tür 0, zayıf tür iki kat (yalnız alanda saklanan kuralda; Wall of Stone eskisi gibi).
  const amount = st.immune.includes(damageType) ? 0 : Math.max(0, damage) * (st.vuln.includes(damageType) ? 2 : 1);
  if (!amount) return [];
  const k = hexKey(hex);
  const hp = st.hp - (zone.panelDamage?.[k] ?? 0) - amount;
  const out: BattleEvent[] = [{ type: 'zone_panel_damaged', zoneId: zone.id, hex, amount }];
  if (hp <= 0) {
    out.push({ type: 'zone_moved', zoneId: zone.id, hexes: zone.hexes.filter((h) => !sameHex(h, hex)) }, { type: 'map_note', text: `${zone.name}: bir panel yıkıldı.` });
    const fa = specOf(zone)?.frigidAir;
    if (fa) out.push(frigidAirEvent(zone, hex, fa));
  }
  return out;
}

/** Kuyruk K62 (sürüm 46): yıkılan Wall of Ice panelinin yerinde donuk hava perdesi; büyünün kalan süresi boyunca (konsantrasyon kopunca kalkar). */
function frigidAirEvent(zone: SpellZone, hex: Offset, fa: NonNullable<ZoneSpec['frigidAir']>): BattleEvent {
  const spell = spells.find((s) => s.id === zone.spellId);
  const up = Math.max(0, zone.slotLevel - (spell?.level ?? zone.slotLevel));
  const base = parseDice(fa.dice);
  const per = parseDice(fa.upDice);
  const spec: ZoneSpec = { rounds: zone.until !== undefined ? undefined : 100, on: ['enter'], once: true, save: fa.save, damage: fa.dice, damageType: fa.type, half: true, color: '#d6f0ff', icon: '❄' };
  return { type: 'zone_created', zone: {
    id: `${zone.id}:perde:${hex.col},${hex.row}`, spellId: zone.spellId, name: 'Donuk hava', casterId: zone.casterId, side: zone.side, dc: zone.dc, slotLevel: zone.slotLevel,
    hexes: [hex], spec, damage: formatDice(base.count + per.count * up, base.sides, base.bonus),
    ...(zone.concentration ? { concentration: zone.concentration } : {}), ...(zone.until !== undefined ? { until: zone.until } : {}),
  } };
}

export function executeAttackPanel(state: BattleState, actor: Combatant, id: string, option: AttackOption, rng: Rng): CommandResult {
  const p = panelOf(state, id);
  if (!p || !actor.pos) return fail('Duvar paneli yok.');
  const d = distance(actor.pos, p.hex);
  if (option.ranged ? d * 5 > (option.range?.[1] ?? Infinity) : d * 5 > (option.reachFt ?? 5)) return fail('Panel erişim dışında.');
  const r = resolveAttack({ attackBonus: option.attackBonus, targetAc: panelStats(p.zone).ac, mode: 'normal', damage: option.damage, autoCritical: false }, rollTag(rng, { by: actor.id }));
  const dealt = r.hit ? r.damage?.total ?? 0 : 0;
  return finish(state, [{ type: 'map_note', text: `${actor.name}: ${option.label} → ${p.zone.name} (d20 ${r.d20.kept}, ${r.total}/${panelStats(p.zone).ac}) ${r.hit ? `${dealt} hasar` : 'ıska'}` },
    { type: 'action_used', actorId: actor.id, kind: 'attack', what: option.label },
    ...panelDamageEvents(state, p.zone, p.hex, dealt, option.damageType ?? 'bludgeoning')]);
}

/** Alan hasarı panellere (komut sonu). */
export function panelAreaEvents(next: BattleState, hits: Array<{ hexes: Offset[]; damage: number; damageType: string }>): BattleEvent[] {
  const out: BattleEvent[] = [];
  let s = next;
  for (const hit of hits) {
    for (const z of s.map?.zones ?? []) {
      if (!specOf(z)?.panels) continue;
      for (const h of z.hexes.filter((x) => hit.hexes.some((y) => sameHex(x, y)))) {
        const live = s.map?.zones?.find((x) => x.id === z.id);
        if (!live) break;
        const evs = panelDamageEvents(s, live, h, hit.damage, hit.damageType);
        out.push(...evs);
        s = applyEvents(s, evs);
      }
    }
  }
  return out;
}

/** Wall of Fire: hasar veren yüz (büyücünün seçtiği yan, duvara 10 ft). */
export function fireSideHexes(state: BattleState, actor: Combatant, hexes: Offset[], side: string | undefined): Offset[] {
  if (!actor.pos) return [];
  const size = sizeOf(state);
  const keys = new Set(hexes.map(hexKey));
  const out = new Map<string, Offset>();
  for (const w0 of hexes) for (const h of withinRange(w0, 2, size)) {
    if (keys.has(hexKey(h)) || out.has(hexKey(h))) continue;
    const w = hexes.reduce((a, b) => (distance(h, b) < distance(h, a) ? b : a));
    const near = distance(actor.pos, h) < distance(actor.pos, w);
    if ((side === 'near') === near) out.set(hexKey(h), h);
  }
  return [...out.values()];
}
