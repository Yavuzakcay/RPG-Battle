/**
 * Kuyruk 19 (görev 7, SRD canavar yetenekleri; anahtar `srdK19`): canavar verisinde "desteklenmiyor" diye duran
 * yaygın özellikler savaş başında savaşçıya işlenir (veri `unsupported` metninden ayrıştırılır; `data/monsters.json`
 * değişmez):
 * - Durum bağışıklıkları (`immune`), Magic Resistance (büyülere save avantajı), Climb/Swim hızları (tırmanma,
 *   yüzme), Blindsight/Truesight/Tremorsense (özel duyular), Sunlight Sensitivity (gündüz haritasında saldırı
 *   dezavantajı), Illumination (ışık), Flyby (uçarken fırsat saldırısı almaz), Fire Aura (dokunana/başlayana 1d10
 *   Fire), Stench (5 ft'te tur başlayan CON save ya da Poisoned), Spider Climb, Ice Walk / Web Walker (zorlu arazi).
 */
import { getMonster } from '../data';
import { hasDarkness } from './maprules';
import type { ActiveEffect, BattleEvent, BattleState, Combatant, SpellZone } from './types';

const CONDS = ['Blinded', 'Charmed', 'Deafened', 'Exhaustion', 'Frightened', 'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious'];

export function monsterTraitParts(state: BattleState, c: Combatant): { effects: ActiveEffect[]; traits: string[]; senses?: Combatant['senses']; zones: SpellZone[] } {
  const out = { effects: [] as ActiveEffect[], traits: [] as string[], zones: [] as SpellZone[] } as { effects: ActiveEffect[]; traits: string[]; senses?: Combatant['senses']; zones: SpellZone[] };
  if (!c.monsterId) return out;
  let m;
  try { m = getMonster(c.monsterId); } catch { return out; }
  const u = (m.unsupported ?? []) as string[];
  const fx: Partial<ActiveEffect> = {};
  for (const s of u) {
    if (s.startsWith('Durum bağışıklığı:')) fx.immune = s.slice(18).split(',').map((x) => x.trim()).filter((x) => CONDS.includes(x));
    else if (s.startsWith('Hız: Climb') || s === 'Trait: Spider Climb') fx.climb = true;
    else if (s.startsWith('Hız: Swim')) out.traits.push('gift-of-the-depths');
    else if (s.startsWith('Duyu:')) {
      const sense = /(Blindsight|Truesight|Tremorsense) (\d+)/.exec(s);
      if (sense) out.senses = { ...(out.senses ?? c.senses ?? {}), [sense[1]!.toLowerCase()]: Number(sense[2]) };
    } else if (s === 'Trait: Magic Resistance') fx.saveAdvAgainst = ['spell'];
    else if (s === 'Trait: Sunlight Sensitivity' && state.map && !hasDarkness(state)) fx.attackDis = {};
    else if (s === 'Trait: Illumination') fx.light = 6;
    else if (s === 'Trait: Flyby') out.traits.push('flyby');
    else if (s === 'Trait: Ice Walk' || s === 'Trait: Web Walker') fx.freeMove = true;
    else if (s === 'Trait: Fire Aura' || s === 'Trait: Stench') {
      const stench = s === 'Trait: Stench';
      out.zones.push({ id: `srd19:${c.id}:${stench ? 'stench' : 'fire'}`, spellId: `srd19:${stench ? 'stench' : 'fire-aura'}`, name: stench ? 'Stench' : 'Fire Aura',
        casterId: c.id, side: c.side, dc: stench ? 10 : 0, slotLevel: 0, hexes: [], anchorId: c.id, radius: 1,
        ...(stench ? {} : { damage: '1d10' }),
        spec: stench ? { on: ['start'], targets: 'enemies', save: 'con', conditions: ['Poisoned'], hold: 'turn', color: '#7a8f3a', icon: '🤢' }
          : { on: ['start', 'enter'], once: true, targets: 'enemies', damageType: 'fire', color: '#ff7a33', icon: '🔥' } });
    }
  }
  if (Object.keys(fx).length) out.effects.push({ ...fx, id: `srd19:${c.id}:traits`, name: m.name, sourceId: c.id } as ActiveEffect);
  return out;
}

/** Savaş başında bütün canavarlara (ve haritaya: auralar) uygulanır. */
export function withMonsterTraits(state: BattleState): BattleState {
  const combatants: Record<string, Combatant> = {};
  const zones: SpellZone[] = [];
  for (const [id, c] of Object.entries(state.combatants)) {
    const p = monsterTraitParts(state, c);
    zones.push(...p.zones);
    combatants[id] = !p.effects.length && !p.traits.length && !p.senses ? c : {
      ...c, effects: [...(c.effects ?? []), ...p.effects], ...(p.traits.length ? { traits: [...new Set([...(c.traits ?? []), ...p.traits])] } : {}),
      ...(p.senses ? { senses: p.senses } : {}),
    };
  }
  const map = state.map && zones.length ? { ...state.map, zones: [...(state.map.zones ?? []), ...zones] } : state.map;
  return { ...state, combatants, ...(map ? { map } : {}) };
}

export type { BattleEvent };
