/**
 * Görev KARAR104 (kural sürümü 104): bekleyen kullanıcı kararları SRD 5.2.1'e göre. Her madde 103 ↔ 104 ve replay.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromMonster } from './index';
import { getMonster } from '../data';
import { applyBattleResult } from '../app/partyStatus';
import { blankCharacter } from '../rules/builder';
import { fullStatus, longRestStatus } from '../rules/characterRest';
import { startBattle } from './create';
import { replay } from './index';
import { GM, mk, P1 } from './fixtures';
import { KARAR104_VERSION, karar104On } from './karar104Surum';
import { CURRENT_RULES } from './ruleVersion';
import { zoneAttackSources, zoneSpecOf } from './zones';
import type { DiceRequest, Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const NEW = KARAR104_VERSION;
const OLD = KARAR104_VERSION - 1;

/** Kancalı zar: d20 hep `d20`; diğer zarlar ⌊yüz/2⌋ + 1 (4d6 = 16, 10d6 = 40, 2d6 = 8, 1d6 = 4). */
function hooked(d20: number): Rng {
  const f = (() => 0.5) as Rng & { dice?: (r: DiceRequest) => number[] };
  f.dice = (req) => (req.sides === 20 ? Array.from({ length: req.count }, () => d20) : Array.from({ length: req.count }, () => Math.floor(req.sides / 2) + 1));
  return f;
}
const flat = (): string[] => Array.from({ length: 11 }, () => '.'.repeat(21));
const at = (col: number, row: number) => ({ col, row });
export function scene104(v: number, parts: Combatant[]): BattleState {
  const s0 = startBattle('k104', 'd', parts.map((p) => ({ ...p, pos: null })), () => 0.5, { kuralSurumu: v, map: { id: 'kale-onu', variantId: 'gunduz' } } as never).state;
  const cs: Record<string, Combatant> = {};
  for (const p of parts) cs[p.id] = { ...(s0.combatants[p.id] as Combatant), pos: p.pos, initiative: 0 };
  return { ...s0, kuralSurumu: v, status: 'active', round: 1, order: parts.map((p) => p.id), turnIndex: 0, combatants: cs,
    map: { ...s0.map!, tiles: flat(), objects: [], zones: [] } };
}
/** Komutları sırayla çalıştırır; sonunda olaylar baştan oynatılınca aynı durum (replay). */
export function play(s0: BattleState, cmds: Command[], rng: Rng): { state: BattleState; events: BattleEvent[] } {
  let s = s0;
  const events: BattleEvent[] = [];
  for (const cmd of cmds) {
    const r = execute(s, cmd, s.combatants[(cmd as { actorId?: string }).actorId ?? '']?.side === 'enemies' ? GM : P1, rng);
    if (!r.ok) throw new Error(`${cmd.type}: ${r.error}`);
    s = r.state;
    events.push(...r.events);
  }
  expect(replay([{ type: 'battle_started', state: s0 }, ...events] as BattleEvent[])).toEqual(s);
  return { state: s, events };
}

describe('KARAR104: sabit', () => {
  it('kural sürümü 104; güncel sürüm 104', () => {
    expect(KARAR104_VERSION).toBe(104);
    expect(CURRENT_RULES).toBeGreaterThanOrEqual(104);
    expect(karar104On({ kuralSurumu: 104 })).toBe(true);
    expect(karar104On({ kuralSurumu: 103 })).toBe(false);
  });
});

describe('KARAR104 A1: Storm of Vengeance 2–10. tur aşamaları (SRD 5.2.1 s. 165)', () => {
  // Büyücü bulutun altında ama CON/DEX save'leri kesin başarılı (konsantrasyon bozulmasın).
  const druid = () => mk('A', { ownerId: 'p1', hp: 400, maxHp: 400, level: 17, spellSaveDc: 15, spellAttack: 7, spellMod: 4, spellNames: ['Storm of Vengeance'],
    spellSlots: [4, 3, 3, 3, 3, 2, 2, 1, 1], saves: { str: 0, dex: 30, con: 30, int: 0, wis: 0, cha: 0 }, pos: at(3, 5) });
  const foe = (id: string, pos: { col: number; row: number }) => mk(id, { side: 'enemies', hp: 400, maxHp: 400, pos });
  const cast: Command = { type: 'cast_spell', actorId: 'A', spellName: 'Storm of Vengeance', slotLevel: 9, targetHex: at(10, 5) } as Command;
  const end = (id: string): Command => ({ type: 'end_turn', actorId: id }) as Command;
  /** Yapım + n tam tur (her turda A ve T sırası biter). */
  const rounds = (v: number, n: number, d20 = 5) => {
    const cmds: Command[] = [cast];
    for (let i = 0; i < n; i++) cmds.push(end('A'), end('T'));
    return play(scene104(v, [druid(), foe('T', at(10, 5))]), cmds, hooked(d20));
  };
  const dmgOn = (events: BattleEvent[], id: string) => events.filter((e) => (e.type === 'save_resolved' || e.type === 'effect_tick') && e.targetId === id)
    .map((e) => `${(e as { damageType: string }).damageType}:${(e as { appliedDamage: number }).appliedDamage}`);
  it('104: 2. tur 4d6 Acid, 3. tur 10d6 Lightning (DEX), 4. tur 2d6 Bludgeoning, 5. tur 1d6 Cold', () => {
    const r = rounds(NEW, 4);
    expect(dmgOn(r.events, 'T')).toEqual(['thunder:8', 'acid:16', 'lightning:40', 'bludgeoning:8', 'cold:4']);
    expect(r.state.map?.zones?.find((z) => z.spellId === 'storm-of-vengeance')?.stage).toBe(5);
  });
  it('104: 5. turdan sonra alan zorlu arazi, yoğun örtü ve menzilli silah saldırısı yok', () => {
    const z4 = rounds(NEW, 3).state.map?.zones?.[0];
    expect(zoneSpecOf(z4!)?.difficult).toBeUndefined();
    const s5 = rounds(NEW, 4).state;
    const z5 = s5.map?.zones?.[0];
    expect(zoneSpecOf(z5!)).toMatchObject({ difficult: 2, obscured: 'heavy', noRangedWeapon: true });
    const A = s5.combatants.A as Combatant; const T = s5.combatants.T as Combatant;
    expect(zoneAttackSources(s5, A, T, true, false, 'Longbow').autoMiss).toBe('Storm of Vengeance');
    expect(zoneAttackSources(s5, A, T, true, true, 'Fire Bolt').autoMiss).toBeUndefined();
  });
  it('104: 3. tur yıldırımı büyücünün düşmanlarına, başarılı DEX save\'de yarı hasar', () => {
    const r = rounds(NEW, 2, 20);
    const bolt = r.events.find((e) => e.type === 'save_resolved' && e.damageType === 'lightning') as Extract<BattleEvent, { type: 'save_resolved' }>;
    expect(bolt.targetId).toBe('T');
    expect(bolt.success).toBe(true);
    expect(bolt.appliedDamage).toBe(20);
    expect(r.events.some((e) => e.type === 'save_resolved' && e.damageType === 'lightning' && e.targetId === 'A')).toBe(false);
  });
  it('103: yalnız yapım turu (aşama yok)', () => {
    const r = rounds(OLD, 4);
    expect(dmgOn(r.events, 'T')).toEqual(['thunder:8']);
    expect(r.state.map?.zones?.[0]?.stage).toBeUndefined();
  });
});

describe('KARAR104 A3: boğulma ("is suffocating"; SRD 5.2.1 Suffocation)', () => {
  const HIGH: Rng = () => 0.99;
  const LOW: Rng = () => 0.01;
  const monster = (id: string, cid: string): Combatant => ({ ...combatantFromMonster(getMonster(id), { id: cid }), side: 'enemies', pos: at(3, 5) });
  const hero = (p: Partial<Combatant> = {}) => mk('H', { ownerId: 'p1', hp: 300, maxHp: 300, ac: 10, pos: at(4, 5), ...p });
  const attack = (s: BattleState, actorId: string, name: string): Command =>
    ({ type: 'monster_attack', actorId, targetId: 'H', attackIndex: (s.combatants[actorId] as Combatant).attacks.findIndex((a) => a.name === name) }) as Command;
  /** Canavar saldırır, iki taraf da turunu bitirir; kahramanın nefes sayacı. */
  const smother = (v: number, monsterId: string, name: string, rng: Rng, p: Partial<Combatant> = {}) => {
    const s = scene104(v, [monster(monsterId, 'M'), hero(p)]);
    const r = play(s, [attack(s, 'M', name), { type: 'end_turn', actorId: 'M' } as Command, { type: 'end_turn', actorId: 'H' } as Command], rng);
    return r.state.combatants.H as Combatant;
  };
  it('104: Rug of Smothering Smother tutarken nefes alamaz (tur sonunda nefes sayacı); 103: sayaç yok', () => {
    const h = smother(NEW, 'animated-rug-of-smothering', 'Smother', HIGH);
    expect(h.effects?.some((e) => e.noBreath === true)).toBe(true);
    expect(h.mapStatus.breath).toBe(1);
    const o = smother(OLD, 'animated-rug-of-smothering', 'Smother', HIGH);
    expect(o.effects?.some((e) => e.noBreath)).toBe(false);
    expect(o.mapStatus.breath ?? 0).toBe(0);
  });
  it('104: Gelatinous Cube Engulf içine alınan nefes alamaz', () => {
    const h = smother(NEW, 'gelatinous-cube', 'Engulf', LOW);
    expect(h.effects?.find((e) => e.swallowedBy === 'M')?.noBreath).toBe(true);
    expect(h.mapStatus.breath).toBe(1);
  });
  it('104: Water Elemental Whelm su solumayanı boğar; Water Breathing etkisi olan nefes alır', () => {
    expect(smother(NEW, 'water-elemental', 'Whelm', LOW).mapStatus.breath).toBe(1);
    const wb = smother(NEW, 'water-elemental', 'Whelm', LOW, { effects: [{ id: 'water-breathing', name: 'Water Breathing', sourceId: 'H', until: 9999 }] });
    expect(wb.effects?.some((e) => e.noBreath === 'unlessWater')).toBe(true);
    expect(wb.mapStatus.breath ?? 0).toBe(0);
  });
});

describe('KARAR104 A4: likantrop laneti yalnız işaret (kullanıcı kararı)', () => {
  /** İlk d20 (saldırı) 20, sonrakiler (save) 1. */
  const biteRng = (): Rng => {
    let n = 0;
    const f = (() => 0.5) as Rng & { dice?: (r: DiceRequest) => number[] };
    f.dice = (req) => (req.sides === 20 ? Array.from({ length: req.count }, () => (n++ === 0 ? 20 : 1)) : Array.from({ length: req.count }, () => Math.floor(req.sides / 2) + 1));
    return f;
  };
  const wolf = (): Combatant => ({ ...combatantFromMonster(getMonster('werewolf'), { id: 'W' }), side: 'enemies', pos: at(3, 5) });
  const bite = (v: number, target: Partial<Combatant> = {}) => {
    const s = scene104(v, [wolf(), mk('H', { ownerId: 'p1', hp: 300, maxHp: 300, ac: 5, pos: at(4, 5), ...target })]);
    const idx = (s.combatants.W as Combatant).attacks.findIndex((a) => a.name === 'Bite');
    return play(s, [{ type: 'monster_attack', actorId: 'W', targetId: 'H', attackIndex: idx } as Command], biteRng());
  };
  it('104: Humanoid hedef CON save’i başaramazsa lanetli; 103: lanet yok', () => {
    const r = bite(NEW);
    const save = r.events.find((e) => e.type === 'condition_save' && e.condition === 'Likantropi') as Extract<BattleEvent, { type: 'condition_save' }>;
    expect(save).toMatchObject({ ability: 'con', dc: 12, success: false });
    expect(r.state.combatants.H?.effects?.find((e) => e.lycanthropy)?.lycanthropy).toBe('werewolf');
    expect(bite(OLD).state.combatants.H?.effects?.some((e) => e.lycanthropy) ?? false).toBe(false);
  });
  it('104: Humanoid olmayan (Beast biçimi) lanetlenmez', () => {
    expect(bite(NEW, { creatureType: 'beast' }).state.combatants.H?.effects?.some((e) => e.lycanthropy) ?? false).toBe(false);
  });
  it('savaş sonunda karaktere `lanet` yazılır; uzun dinlenme kaldırmaz; 0 HP’de biçim değişimi yok', () => {
    const r = bite(NEW);
    const sh = { ...blankCharacter('p1').sheet, name: 'Kahraman' };
    const ch = { ...blankCharacter('p1'), id: 'p1', sheet: sh, status: fullStatus(sh) };
    const fin: BattleState = { ...r.state, status: 'finished' };
    const st = applyBattleResult([ch], fin)[0]?.status;
    expect(st?.lanet).toEqual({ likantrop: 'werewolf' });
    expect(longRestStatus(sh, st).lanet).toEqual({ likantrop: 'werewolf' });
    // Lanetsiz savaş önceki işareti korur.
    const clean: BattleState = { ...fin, combatants: { ...fin.combatants, H: { ...(fin.combatants.H as Combatant), effects: [] } } };
    expect(applyBattleResult([{ ...ch, status: st }], clean)[0]?.status?.lanet).toEqual({ likantrop: 'werewolf' });
    expect(r.state.combatants.H?.side).toBe('party');
  });
});
