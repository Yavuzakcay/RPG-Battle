/**
 * Mekanik matris: sahne kurulumu. Düz, kuralsız, 31×45 altıgenlik zemin (kale-onu haritasının "Düz zemin" ortamı;
 * ortam kuralları zara avantaj/dezavantaj eklemesin diye). Yaratıklar eksen sütununda (flat-top odd-q'da aynı sütun düz
 * bir hattır): büyücü üstte, hedefler aşağıda.
 */
import { startBattle } from '../../battle/create';
import { mk, zero } from '../../battle/fixtures';
import type { ActiveEffect, BattleState, Combatant } from '../../battle/types';
import type { Offset } from '../../rules/hex';

export const COLS = 31;
export const ROWS = 45;
/** Eksen sütunu ve büyücünün satırı. */
export const AX = 15;
export const A_ROW = 2;
export const hex = (row: number, col = AX): Offset => ({ col, row });

export const flatTiles = (): string[] => Array.from({ length: ROWS }, () => '.'.repeat(COLS));

/** Satır aralığını (iki uç dahil) bir zemin harfiyle doldurur (siper bandı: `d` yarım, `c` 3/4). */
export function band(tiles: string[], fromRow: number, toRow: number, ch: string): string[] {
  return tiles.map((r, i) => (i >= fromRow && i <= toRow ? ch.repeat(COLS) : r));
}

export interface Kisi { c: Combatant }

export const CASTER_DC = 18;
export const CASTER_ATTACK = 10;
export const CASTER_MOD = 4;
export const TARGET_AC = 15;
export const TARGET_HP = 300;

export function caster(extra: Partial<Combatant> = {}): Combatant {
  return mk('A', {
    ownerId: 'p1', side: 'party', hp: 200, maxHp: 200, ac: TARGET_AC, level: 20, proficiency: 6, spellMod: CASTER_MOD,
    spellSaveDc: CASTER_DC, spellAttack: CASTER_ATTACK, spellSlots: [4, 4, 4, 4, 4, 4, 4, 4, 4], spellNames: [],
    modifiers: { ...zero }, saves: { ...zero }, creatureType: 'humanoid', casterTag: 'a', pos: hex(A_ROW), ...extra,
  });
}

export function enemy(id: string, pos: Offset, extra: Partial<Combatant> = {}): Combatant {
  return mk(id, { side: 'enemies', hp: TARGET_HP, maxHp: TARGET_HP, ac: TARGET_AC, creatureType: 'humanoid', saves: { ...zero },
    modifiers: { ...zero }, casterTag: id.toLowerCase(), pos, ...extra });
}

export function ally(id: string, pos: Offset, extra: Partial<Combatant> = {}): Combatant {
  return mk(id, { ownerId: 'p1', side: 'party', hp: 100, maxHp: 200, ac: TARGET_AC, creatureType: 'humanoid', saves: { ...zero },
    modifiers: { ...zero }, casterTag: id.toLowerCase(), pos, ...extra });
}

/** Savaşı kurar; sıra listedeki ilk yaratıkta (büyücü). */
export function scene(parts: Combatant[], tiles: string[] = flatTiles()): BattleState {
  const st = startBattle('matris', 'matris', parts.map((p) => ({ ...p, pos: null })), () => 0.5, { map: { id: 'kale-onu', variantId: 'gunduz' } }).state;
  const combatants: Record<string, Combatant> = {};
  for (const p of parts) combatants[p.id] = { ...(st.combatants[p.id] as Combatant), pos: p.pos, initiative: 0 };
  const map = st.map as NonNullable<BattleState['map']>;
  return {
    ...st, status: 'active', round: 1, order: parts.map((p) => p.id), turnIndex: 0, combatants,
    map: { ...map, tiles, objects: [], zones: [] },
  };
}

/** Charmed: büyüleyen `sourceId` (SRD 5.2.1 "Can't Harm the Charmer"). */
export const charmedBy = (sourceId: string): Partial<Combatant> => ({
  conditions: ['Charmed'],
  effects: [{ id: 'matris:charm', name: 'Charm Person', sourceId, until: 99, charm: true, grants: ['Charmed'] } as ActiveEffect],
});

/** Frightened: korku kaynağı `sourceId` (görüş hattında). */
export const frightenedBy = (sourceId: string): Partial<Combatant> => ({
  conditions: ['Frightened'],
  effects: [{ id: 'matris:fear', name: 'Fear', sourceId, until: 99, grants: ['Frightened'] } as ActiveEffect],
});

/** Hedef bir konsantrasyon büyüsü sürdürüyor (Bless). */
export const concentrating = (): Partial<Combatant> => ({ concentration: { spell: 'Bless', slotLevel: 1, turn: '0:0' } });

/** Shield tepkisi (bildiği büyü ve 1. seviye slotu). */
export const shieldCaster = (): Partial<Combatant> => ({
  spellNames: ['Shield'], spellSlots: [2, 0, 0, 0, 0, 0, 0, 0, 0], spellSaveDc: 15, spellAttack: 7, spellMod: 3,
  reactions: [{ id: 'spells:shield', name: 'Shield', spell: 'Shield', kind: 'shield', acBonus: 5, blocks: ['spells:magic-missile'] }],
});

/** Counterspell tepkisi (3. seviye slotu, 60 ft). */
export const counterCaster = (): Partial<Combatant> => ({
  spellNames: ['Counterspell'], spellSlots: [0, 0, 2, 0, 0, 0, 0, 0, 0], spellSaveDc: 15, spellAttack: 7, spellMod: 3,
  reactions: [{ id: 'spells:counterspell', name: 'Counterspell', spell: 'Counterspell', kind: 'counterspell', save: 'con', rangeFt: 60 }],
});
