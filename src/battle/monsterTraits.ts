/**
 * Kuyruk 19 (görev 7, SRD canavar yetenekleri; anahtar `srdK19`): canavar verisinde "desteklenmiyor" diye duran
 * yaygın özellikler savaş başında savaşçıya işlenir (veri `unsupported` metninden ayrıştırılır; `data/monsters.json`
 * değişmez):
 * - Durum bağışıklıkları (`immune`), Magic Resistance (büyülere save avantajı), Climb/Swim hızları (tırmanma,
 *   yüzme), Blindsight/Truesight/Tremorsense (özel duyular), Sunlight Sensitivity (gündüz haritasında saldırı
 *   dezavantajı), Illumination (ışık), Flyby (uçarken fırsat saldırısı almaz), Fire Aura (dokunana/başlayana 1d10
 *   Fire), Stench (5 ft'te tur başlayan CON save ya da Poisoned), Spider Climb, Ice Walk (buz/kar) / Web Walker (ağ).
 */
import { getMonster, monsterSpells, spells } from '../data';
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
    // SRD: Web Walker yalnızca ağların, Ice Walk yalnızca buz/karın hareket kısıtını kaldırır (Freedom of Movement değil).
    else if (s === 'Trait: Web Walker') fx.webWalker = true;
    else if (s === 'Trait: Ice Walk') fx.iceWalker = true;
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

type SpellRef = { name: string; level?: number; note?: string };
type MonsterSpellRec = {
  spellcasting?: { ability: string; dc: number; attack?: number; atWill: SpellRef[]; daily: { uses: number; spells: SpellRef[] }[] };
  bonus?: { entry: string; uses?: number; spells: SpellRef[] }[];
  action?: { entry: string; uses?: number; spells: SpellRef[] }[];
};

/**
 * SRD canavar büyüleri (`data/canavar-buyuleri.json`): At Will slotsuz ve sınırsız (`atWill`), N/Day büyü başına N
 * kullanımlık kaynak (`mspell:<büyü>`), bonus eylem girdileri (Misty Step, Divine Aid) `mspell-b:<girdi>` kaynağıyla bonus
 * eylemle; "level N version" `castLevels`. DC ve saldırı bonusu bloktan (saldırı yazmıyorsa DC − 8). Oyunda kaydı olmayan
 * büyüler (6.+ seviye; görev 3+6) ve savaş dışı büyüler listeye girmez; "included in AC" (Mage Armor) zaten AC'de.
 */
export function monsterSpellParts(c: Combatant): Partial<Combatant> | null {
  const rec = c.monsterId ? (monsterSpells[c.monsterId] as MonsterSpellRec | undefined) : undefined;
  if (!rec) return null;
  const known = (r: SpellRef) => { const sp = spells.find((x) => x.name === r.name); return sp && !sp.mechanics.offCombat && r.note !== 'included in AC' ? sp : undefined; };
  const names: string[] = []; const atWill: Record<string, 'any'> = {}; const resources: Record<string, number> = {};
  const free: Record<string, string> = {}; const levels: Record<string, number> = {};
  const add = (r: SpellRef) => { if (!names.includes(r.name)) names.push(r.name); if (r.level) levels[r.name] = r.level; };
  const sc = rec.spellcasting;
  for (const r of sc?.atWill ?? []) if (known(r)) { add(r); atWill[r.name] = 'any'; }
  for (const g of sc?.daily ?? []) for (const r of g.spells) if (known(r) && !atWill[r.name]) { add(r); const id = `mspell:${r.name}`; resources[id] = g.uses; free[r.name] = id; }
  for (const [kind, list] of [['b', rec.bonus], ['a', rec.action]] as const) {
    for (const e of list ?? []) {
      const ok = e.spells.filter((r) => known(r));
      if (!ok.length) continue;
      const id = `mspell-${kind}:${e.entry}`;
      for (const r of ok) { add(r); if (e.uses || kind === 'b') free[r.name] = id; else atWill[r.name] = 'any'; }
      if (e.uses || kind === 'b') resources[id] = e.uses ?? 99;
    }
  }
  if (!names.length) return null;
  const ability = (sc?.ability ?? 'cha') as keyof Combatant['modifiers'];
  const mod = c.modifiers[ability] ?? 0;
  const dc = sc?.dc || 8 + mod + 2;
  return {
    spellNames: [...new Set([...c.spellNames, ...names])], spellSaveDc: dc, spellAttack: sc?.attack ?? dc - 8, spellMod: mod,
    atWill: { ...(c.atWill ?? {}), ...atWill }, resources: { ...c.resources, ...resources }, freeSpells: { ...(c.freeSpells ?? {}), ...free },
    ...(Object.keys(levels).length ? { castLevels: levels } : {}),
  };
}

/** Savaş başında bütün canavarlara (ve haritaya: auralar) uygulanır. */
export function withMonsterTraits(state: BattleState): BattleState {
  const combatants: Record<string, Combatant> = {};
  const zones: SpellZone[] = [];
  for (let [id, c] of Object.entries(state.combatants)) {
    const p = monsterTraitParts(state, c);
    zones.push(...p.zones);
    const sp = monsterSpellParts(c);
    if (sp) c = { ...c, ...sp };
    combatants[id] = !p.effects.length && !p.traits.length && !p.senses ? c : {
      ...c, effects: [...(c.effects ?? []), ...p.effects], ...(p.traits.length ? { traits: [...new Set([...(c.traits ?? []), ...p.traits])] } : {}),
      ...(p.senses ? { senses: p.senses } : {}),
    };
  }
  const map = state.map && zones.length ? { ...state.map, zones: [...(state.map.zones ?? []), ...zones] } : state.map;
  return { ...state, combatants, ...(map ? { map } : {}) };
}

export type { BattleEvent };
