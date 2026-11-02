/**
 * Kuyruk 19 (0g, "test edilecekler"): 12 sınıf × SRD alt sınıfı için savaş alanındaki bütün eylemlerin duman testi.
 * Her sınıf bir kurt ve bir dostla aynı haritada; eylem menüsündeki her komut (saldırı seçenekleri, Dash, Dodge,
 * Disengage, Help, Hide, Shove, her kullanılabilir özellik, her büyü, eşya, bonus vuruş, Focus eylemleri, Wild Shape,
 * Font of Magic, Action Surge, Second Wind, Rage) motorda denenir: çökme yok, sonuç ya geçerli olaylar ya da açıklamalı ret;
 * geçerli sonuç baştan oynatılınca aynı durumu verir.
 */
import { describe, expect, it } from 'vitest';
import { execute } from '../battle/commands';
import { combatantFromSheet, startBattle } from '../battle/create';
import { replay } from '../battle/reduce';
import { P1, mk } from '../battle/fixtures';
import { blankCharacter, suggestedScores } from '../rules/builder';
import { seededRng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, Command } from '../battle/types';

const SUB: Record<string, string> = {
  barbarian: 'path-of-the-berserker', bard: 'college-of-lore', cleric: 'life-domain', druid: 'circle-of-the-land', fighter: 'champion',
  monk: 'warrior-of-the-open-hand', paladin: 'oath-of-devotion', ranger: 'hunter', rogue: 'thief', sorcerer: 'draconic-sorcery',
  warlock: 'fiend-patron', wizard: 'evoker',
};

export function arena(hero: Combatant): BattleState {
  const parts = [hero, mk('ally', { ownerId: 'p1', hp: 20, maxHp: 20 }), mk('wolf', { side: 'enemies', hp: 40, maxHp: 40 })];
  const s = startBattle('k19', 'd-z-zemin', parts, () => 0.5, { map: { id: 'col' } }).state;
  const pos = { [hero.id]: { col: 4, row: 3 }, ally: { col: 3, row: 3 }, wolf: { col: 5, row: 3 } } as Record<string, { col: number; row: number }>;
  const combatants = { ...s.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return { ...s, status: 'active', order: [hero.id, 'wolf', 'ally'], turnIndex: 0, combatants,
    map: { ...(s.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } };
}

export function commandsFor(c: Combatant): Command[] {
  const id = c.id;
  const out: Command[] = [
    { type: 'dash', actorId: id }, { type: 'dodge', actorId: id }, { type: 'disengage', actorId: id }, { type: 'hide', actorId: id },
    { type: 'help', actorId: id, targetId: 'wolf' }, { type: 'shove', actorId: id, targetId: 'wolf', effect: 'prone' },
    { type: 'shove', actorId: id, targetId: 'wolf', effect: 'push' }, { type: 'action_surge', actorId: id }, { type: 'second_wind', actorId: id },
    { type: 'rage', actorId: id }, { type: 'bonus_strike', actorId: id, targetId: 'wolf' }, { type: 'wild_shape', actorId: id },
    { type: 'font_of_magic', actorId: id, mode: 'toPoints', level: 1 }, { type: 'offhand_attack', actorId: id, targetId: 'wolf' },
  ] as Command[];
  c.weaponOptions.forEach((o) => out.push({ type: 'attack', actorId: id, targetId: 'wolf', option: o }));
  for (const f of c.features ?? []) for (const t of [undefined, id, 'ally', 'wolf']) out.push({ type: 'use_feature', actorId: id, feature: f.key, ...(t ? { targetId: t } : {}) });
  for (const name of c.spellNames) for (const t of [undefined, id, 'ally', 'wolf']) out.push({ type: 'cast_spell', actorId: id, spellName: name, ...(t ? { targetId: t } : {}) } as Command);
  for (const a of ['flurry', 'patient-defense', 'step-of-the-wind']) out.push({ type: 'focus_action', actorId: id, action: a });
  for (const itemId of Object.keys(c.consumables ?? {})) for (const t of [id, 'ally']) out.push({ type: 'use_item', actorId: id, itemId, targetId: t });
  return out;
}

export function smoke(c: Combatant, seed = 1): { tried: number; ok: number } {
  const state = arena(c);
  let tried = 0; let ok = 0;
  for (const cmd of commandsFor(c)) {
    tried++;
    const r = execute(state, cmd, P1, seededRng(seed + tried));
    if (!r.ok) { expect(typeof r.error).toBe('string'); continue; }
    ok++;
    const events: BattleEvent[] = [{ type: 'battle_started', state }, ...r.events];
    expect(replay(events)).toEqual(r.state);
  }
  return { tried, ok };
}

describe('Kuyruk 19: 12 sınıf × SRD alt sınıfı, bütün eylemler (duman)', () => {
  it.each(Object.keys(SUB))('%s 5. seviye: her eylem çökmeden denenir', (classId) => {
    const sheet = { ...blankCharacter('h').sheet, name: classId, classId, subclassId: SUB[classId], level: 5, baseScores: suggestedScores(classId) };
    const c = combatantFromSheet(sheet, { id: 'hero', ownerId: 'p1' });
    const { tried, ok } = smoke(c);
    expect(tried).toBeGreaterThan(10);
    expect(ok).toBeGreaterThan(3);
  });
  it('eşya: iksir kendine ve bitişik dosta', () => {
    const sheet = { ...blankCharacter('h').sheet, name: 'f', classId: 'fighter', subclassId: 'champion', level: 3, baseScores: suggestedScores('fighter') };
    const base = combatantFromSheet(sheet, { id: 'hero', ownerId: 'p1' });
    const c: Combatant = { ...base, hp: 5, consumables: { 'potion-of-healing': 2 } };
    const st = arena(c);
    const r = execute(st, { type: 'use_item', actorId: 'hero', itemId: 'potion-of-healing', targetId: 'ally' }, P1, seededRng(3));
    expect(r.ok).toBe(true);
    expect(smoke(c).ok).toBeGreaterThan(3);
  });
});
