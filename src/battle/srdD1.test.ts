/**
 * Görev D1 (kural sürümü 86): SRD 5.2.1 veri düzeltmeleri. Her grup için sürüm 86'da yeni (SRD) değer, 85'te eski değer
 * (eski kayıt ve replay): yaratık türü (Turn Undead, Wild Shape, Polymorph), durum bağışıklığı, yetenek puanı/kurtarma,
 * canavar yetenekleri (Trample, yutma, ölüm patlaması, atlama), Clay Golem Multiattack, yüzme hızı; katman tutarlılığı.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromMonster, combatantFromSheet, srdD1Revert, startBattle } from './create';
import { replay } from './reduce';
import { GM, P1, mk } from './fixtures';
import { getMonster, monsters } from '../data';
import { blankCharacter, suggestedScores } from '../rules/builder';
import { eligibleForms, wildShapeFeature } from './druid';
import { polymorphForms } from './polymorph';
import { abilitiesOf, monsterTurnEvents, passiveOf } from './monsterAbilities';
import { multiPlanProblem, multiSpecOf } from './monsters';
import { creatureTypeAt, SRD_DUZELTMELER, srdKayit, swimSpeedAt } from './srdD1';
import { SRD_D1_VERSION, srdD1On } from './srdD1Surum';
import { CURRENT_RULES } from './ruleVersion';
import type { CharacterSheet } from '../rules/stats';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, Command, UsableFeature } from './types';
import yetenekler from '../../data/canavar-yetenekleri.json';
import multi from '../../data/multiattack.json';
import turler from '../../data/canavar-turleri.json';
import yuzme from '../../data/yuzme-hizi.json';

const NEW = SRD_D1_VERSION;
const OLD = SRD_D1_VERSION - 1;
const o = (col: number, row: number): Offset => ({ col, row });
const LOW: Rng = () => 0.01;
const MID: Rng = () => 0.5;
const flat = () => Array.from({ length: 7 }, () => '.'.repeat(15));

/** Canavar X (düşman, 7,3) ve oyuncu A (6,3) düz haritada; sürüm `v`. Canavar güncel veriden kurulur (geri alma `startBattle`'da). */
function arena(monId: string, v: number, a: Partial<Combatant> = {}, extra: Combatant[] = []): BattleState {
  const m = { ...combatantFromMonster(getMonster(monId), { id: 'X', kuralSurumu: CURRENT_RULES }), side: 'enemies' as const };
  const parts = [mk('A', { ownerId: 'p1', hp: 200, maxHp: 200, speed: 30, creatureType: 'humanoid' }), m, ...extra];
  const { state } = startBattle('d1', 'd-z-zemin', parts, MID, { kuralSurumu: v, map: { id: 'col' } });
  const combatants = { ...state.combatants };
  combatants.X = { ...(combatants.X as Combatant), pos: o(7, 3) };
  combatants.A = { ...(combatants.A as Combatant), pos: o(6, 3), ...a };
  return { ...state, status: 'active', round: 1, order: ['X', 'A', ...extra.map((e) => e.id)], turnIndex: 0, combatants,
    map: { ...(state.map as NonNullable<BattleState['map']>), tiles: flat() } };
}
const run = (s: BattleState, cmd: Command, rng: Rng = LOW) => { const r = execute(s, cmd, GM, rng); if (!r.ok) throw new Error(r.error); return r; };
const replays = (s0: BattleState, r: { state: BattleState; events: BattleEvent[] }) => expect(replay([{ type: 'battle_started', state: s0 }, ...r.events])).toEqual(r.state);
const held = (by = 'X'): Partial<Combatant> => ({ conditions: ['Grappled'], grapple: { by, escapeDc: 15, restrained: false } });
const get = (obj: unknown, alan: string): unknown => {
  let cur: unknown = obj;
  for (const seg of alan.split('.')) {
    const m = /^([^[]*)\[(.+)\]$/.exec(seg);
    if (!m) { cur = (cur as Record<string, unknown> | undefined)?.[seg]; continue; }
    const arr = (m[1] ? (cur as Record<string, unknown>)[m[1]] : cur) as unknown[] | undefined;
    cur = arr?.find((el) => (typeof el === 'string' ? el.startsWith(m[2] as string) : (el as { id?: string; name?: string }).id === m[2] || (el as { name?: string }).name === m[2]));
  }
  return cur ?? null;
};
const FILES: Record<string, (id: string) => unknown> = {
  'data/monsters.json': (id) => getMonster(id),
  'data/canavar-yetenekleri.json': (id) => (yetenekler as Record<string, unknown>)[id],
  'data/multiattack.json': (id) => (multi as Record<string, unknown>)[id],
};

describe('D1 katmanı (data/srd-duzeltme.json)', () => {
  it('sürüm 86, 77 düzeltme; her `yeni` veride, her `eski` 85 görünümünde', () => {
    expect(SRD_D1_VERSION).toBe(86);
    expect(CURRENT_RULES).toBeGreaterThanOrEqual(SRD_D1_VERSION);
    expect(srdD1On({ kuralSurumu: 86 })).toBe(true);
    expect(srdD1On({ kuralSurumu: 85 })).toBe(false);
    expect(SRD_DUZELTMELER).toHaveLength(77);
    for (const d of SRD_DUZELTMELER) {
      expect(d.sayfa, `${d.kayit} sayfa`).toBeGreaterThanOrEqual(254);
      if (d.dosya === 'data/canavar-turleri.json') {
        expect((turler as { types: Record<string, string> }).types[d.kayit]).toBe(d.yeni);
        expect(creatureTypeAt(d.kayit, OLD)).toBe(d.eski);
        expect(creatureTypeAt(d.kayit, NEW)).toBe(d.yeni);
        expect(creatureTypeAt(d.kayit)).toBe(d.yeni);
        continue;
      }
      if (d.dosya === 'data/yuzme-hizi.json') {
        expect((yuzme as { hiz: Record<string, number> }).hiz[d.kayit]).toBe(d.yeni);
        expect(swimSpeedAt(d.kayit, OLD)).toBe(d.eski);
        expect(swimSpeedAt(d.kayit, NEW)).toBe(d.yeni);
        continue;
      }
      const cur = FILES[d.dosya]?.(d.kayit);
      expect(get(cur, d.alan), `${d.dosya} ${d.kayit} ${d.alan} yeni`).toEqual(d.yeni);
      expect(get(srdKayit(d.dosya, d.kayit, cur, OLD), d.alan), `${d.kayit} ${d.alan} eski`).toEqual(d.eski);
      expect(srdKayit(d.dosya, d.kayit, cur, NEW)).toBe(cur);
    }
  });
});

describe('D1 yaratık türü (23)', () => {
  const sheet = (classId: string, level: number, patch: Partial<CharacterSheet> = {}): CharacterSheet => ({
    ...blankCharacter('c').sheet, name: 'T', classId, level, baseScores: suggestedScores(classId), ...patch,
  });
  it('Specter/Wight/Wraith 86 Undead, 85 eski tür; savaşçıda creatureType sürüme göre (geri alma `startBattle`da)', () => {
    for (const [id, eski] of [['specter', 'celestial'], ['wight', 'dragon'], ['wraith', 'monstrosity']] as const) {
      expect(combatantFromMonster(getMonster(id), { id: 'B', kuralSurumu: NEW }).creatureType).toBe('undead');
      expect(combatantFromMonster(getMonster(id), { id: 'B', kuralSurumu: OLD }).creatureType).toBe(eski);
      expect(arena(id, NEW).combatants.X?.creatureType).toBe('undead');
      expect(arena(id, OLD).combatants.X?.creatureType).toBe(eski);
    }
    // Efreeti artık Fiend değil (Divine Smite +1d8 yok), Night Hag Fiend, goblinoid Fey.
    expect(arena('efreeti', NEW).combatants.X?.creatureType).toBe('elemental');
    expect(arena('efreeti', OLD).combatants.X?.creatureType).toBe('fiend');
    expect(arena('night-hag', NEW).combatants.X?.creatureType).toBe('fiend');
    expect(arena('goblin-warrior', NEW).combatants.X?.creatureType).toBe('fey');
    expect(arena('goblin-warrior', OLD).combatants.X?.creatureType).toBe('humanoid');
  });
  it('Turn Undead: 86\'da Specter döner, 85\'te (Celestial sayılır) "Undead yok"', () => {
    const cleric = combatantFromSheet(sheet('cleric', 5, { subclassId: 'life-domain', armorName: 'Chain Shirt', weapons: [{ name: 'Mace' }] }), { id: 'C', ownerId: 'p1' });
    const s86 = arena('specter', NEW, {}, [cleric]);
    const s85 = arena('specter', OLD, {}, [cleric]);
    const at = (s: BattleState) => ({ ...s, order: ['C', 'X', 'A'], combatants: { ...s.combatants, C: { ...(s.combatants.C as Combatant), pos: o(5, 3) } } });
    const cmd: Command = { type: 'use_feature', actorId: 'C', feature: 'cleric:channel-divinity/turn-undead' };
    const r = execute(at(s86), cmd, P1, LOW);
    expect(r.ok).toBe(true);
    if (r.ok) { expect(r.events.some((e) => e.type === 'save_resolved' && e.targetId === 'X')).toBe(true); replays(at(s86), r); }
    const old = execute(at(s85), cmd, P1, LOW);
    expect(old.ok ? '' : old.error).toContain('Undead yok');
  });
  it('Wild Shape ve Polymorph biçimleri: Giant Eagle/Owl/Elk ve Death Dog 86\'da Beast değil', () => {
    const druid = combatantFromSheet(sheet('druid', 8, { subclassId: 'circle-of-the-land', spellNames: ['Produce Flame'] }), { id: 'D', ownerId: 'p1' });
    const f = wildShapeFeature(druid) as UsableFeature;
    const ids = (v?: number) => eligibleForms(monsters, f, 8, v).map((m) => m.id);
    for (const id of ['giant-eagle', 'giant-owl', 'death-dog']) {
      expect(ids(OLD), id).toContain(id);
      expect(ids(NEW), id).not.toContain(id);
      expect(ids(), `${id} (oluşturucu: güncel)`).not.toContain(id);
    }
    const target = mk('T', { level: 5 });
    expect(polymorphForms(target, OLD).map((m) => m.id)).toEqual(expect.arrayContaining(['giant-eagle', 'death-dog']));
    expect(polymorphForms(target, NEW).map((m) => m.id)).not.toEqual(expect.arrayContaining(['giant-eagle']));
    expect(polymorphForms(target, NEW).map((m) => m.id)).not.toContain('death-dog');
  });
});

describe('D1 durum bağışıklığı (23)', () => {
  const immune = (s: BattleState) => (s.combatants.X?.effects ?? []).flatMap((e) => e.immune ?? []);
  it('Swarm of Bats, Hydra, Cockatrice, Death Dog: 86\'da SRD bağışıklıkları, 85\'te yok', () => {
    expect(immune(arena('swarm-of-bats', NEW))).toEqual(expect.arrayContaining(['Charmed', 'Frightened', 'Grappled', 'Paralyzed', 'Petrified', 'Prone', 'Restrained', 'Stunned']));
    expect(immune(arena('hydra', NEW))).toEqual(expect.arrayContaining(['Blinded', 'Charmed', 'Deafened', 'Frightened', 'Stunned', 'Unconscious']));
    expect(immune(arena('cockatrice', NEW))).toEqual(['Petrified']);
    expect(immune(arena('death-dog', NEW))).toContain('Unconscious');
    for (const id of ['swarm-of-bats', 'hydra', 'cockatrice', 'death-dog']) expect(immune(arena(id, OLD)), id).toEqual([]);
    // Bağışıklığı zaten olan (Zombie) iki sürümde aynı.
    expect(immune(arena('zombie', OLD))).toEqual(immune(arena('zombie', NEW)));
  });
  it('bağışık sürü yere düşürülemez (86): reducer `immuneTo` durumu süzer', () => {
    const s = arena('swarm-of-rats', NEW);
    const ev = { type: 'condition_changed', targetId: 'X', condition: 'Prone', present: true } as BattleEvent;
    const r = replay([{ type: 'battle_started', state: s }, ev]);
    expect(r.combatants.X?.conditions).not.toContain('Prone');
    const r85 = replay([{ type: 'battle_started', state: arena('swarm-of-rats', OLD) }, ev]);
    expect(r85.combatants.X?.conditions).toContain('Prone');
  });
});

describe('D1 yetenek puanı ve kurtarma', () => {
  const c = (id: string, v: number) => combatantFromMonster(getMonster(id), { id: 'B', kuralSurumu: v });
  it('Giant Centipede STR 5 / INT 1; Adult White Dragon CON 22; Young White Dragon INT 6; Bandit Captain WIS +2', () => {
    expect(c('giant-centipede', NEW)).toMatchObject({ strScore: 5, modifiers: { str: -3, int: -5 }, saves: { str: -3, int: -5 } });
    expect(c('giant-centipede', OLD)).toMatchObject({ strScore: 10, modifiers: { str: 0, int: 0 }, saves: { str: 0, int: 0 } });
    expect(c('adult-white-dragon', NEW).saves.con).toBe(6);
    expect(c('adult-white-dragon', OLD).saves.con).toBe(0);
    expect(c('young-white-dragon', NEW).saves.int).toBe(-2);
    expect(c('young-white-dragon', OLD).saves.int).toBe(0);
    expect(c('bandit-captain', NEW).saves.wis).toBe(2);
    expect(c('bandit-captain', OLD).saves.wis).toBe(0);
  });
  it('geri alma: güncel veriden kurulup 85 savaşa giren = 85 veriyle kurulan; 86\'da dokunulmaz; tekrar çağrı aynı', () => {
    for (const id of ['giant-centipede', 'adult-white-dragon', 'bandit-captain', 'specter', 'archelon', 'clay-golem', 'wolf']) {
      const now = c(id, NEW);
      expect(srdD1Revert(now, OLD), id).toEqual(c(id, OLD));
      expect(srdD1Revert(srdD1Revert(now, OLD), OLD)).toEqual(c(id, OLD));
      expect(srdD1Revert(now, NEW)).toBe(now);
    }
    // Çağrı seçimiyle değişmiş tür korunur (familiar Fey).
    expect(srdD1Revert({ ...c('specter', NEW), creatureType: 'fey' }, OLD).creatureType).toBe('fey');
  });
});

describe('D1 canavar yetenekleri', () => {
  const ab = (s: BattleState, id: string) => abilitiesOf(s, s.combatants.X as Combatant).find((a) => a.id === id);
  it('Elephant Trample DC 16 / 2d10+6; Remorhaz yutma DC 19 / ateş 3d6; Purple Worm STR; Ice Mephit 2d4; Cat atlama 15', () => {
    expect(ab(arena('elephant', NEW), 'trample')).toMatchObject({ dc: 16, damage: '2d10+6' });
    expect(ab(arena('elephant', OLD), 'trample')).toMatchObject({ dc: 12, damage: '2d10+4' });
    expect(ab(arena('remorhaz', NEW), 'swallow')).toMatchObject({ dc: 19, dice2: '3d6' });
    expect(ab(arena('remorhaz', OLD), 'swallow')).toMatchObject({ dc: 17, dice2: '5d6' });
    expect(ab(arena('purple-worm', NEW), 'swallow')?.save).toBe('str');
    expect(ab(arena('purple-worm', OLD), 'swallow')?.save).toBe('dex');
    const s = arena('ice-mephit', NEW);
    expect(passiveOf(s, s.combatants.X as Combatant)?.deathBurst?.dice).toBe('2d4');
    const s85 = arena('ice-mephit', OLD);
    expect(passiveOf(s85, s85.combatants.X as Combatant)?.deathBurst?.dice).toBe('2d6');
    const jump = (st: BattleState) => (st.combatants.X?.effects ?? []).find((e) => e.id === 'srd19:X:passive')?.jumpFt;
    expect(jump(arena('cat', NEW))).toBe(15);
    expect(jump(arena('cat', OLD))).toBe(10);
  });
  it('Elephant Trample 86: DC 16 kurtarma (zar 0,5 → 11 + DEX; düşük zarla başarısız) ve replay', () => {
    const s = arena('elephant', NEW, { conditions: ['Prone'] });
    const r = run(s, { type: 'monster_ability', actorId: 'X', abilityId: 'trample' });
    expect(r.events.find((e) => e.type === 'save_resolved')).toMatchObject({ targetId: 'A', dc: 16 });
    replays(s, r);
  });
  it('Giant Frog 86: tuttuğu Small hedefi kurtarmasız yutar, Medium\'u yutamaz; sonraki turunun sonunda 2d4 Acid, ölmezse kusar (Prone)', () => {
    const small = { ...held(), size: 'S' as const };
    const s = arena('giant-frog', NEW, small);
    const r = run(s, { type: 'monster_ability', actorId: 'X', abilityId: 'swallow' });
    expect(r.events.some((e) => e.type === 'map_effect' && !!e.roll)).toBe(false);
    expect(r.state.combatants.A?.effects?.some((e) => e.swallowedBy === 'X')).toBe(true);
    replays(s, r);
    expect(execute(arena('giant-frog', NEW, held()), { type: 'monster_ability', actorId: 'X', abilityId: 'swallow' }, GM, LOW).ok).toBe(false);
    const frog = r.state.combatants.X as Combatant;
    // Aynı turun sonunda hasar yok; sonraki turun sonunda hasar + kusma.
    expect(monsterTurnEvents(r.state, frog, 'end', MID)).toEqual([]);
    expect(monsterTurnEvents(r.state, frog, 'start', MID)).toEqual([]);
    const next = { ...r.state, round: 2 };
    const evs = monsterTurnEvents(next, frog, 'end', MID);
    expect(evs.some((e) => e.type === 'map_effect' && e.targetId === 'A' && e.addCondition === 'Prone')).toBe(true);
    expect(evs.some((e) => e.type === 'effect_ended' && e.targetId === 'A')).toBe(true);
    // 85: eski kural (STR kurtarması; Medium da yutulur; hasar tur başında, kusma yok).
    const s85 = arena('giant-frog', OLD, held());
    const r85 = run(s85, { type: 'monster_ability', actorId: 'X', abilityId: 'swallow' });
    expect(r85.events.some((e) => e.type === 'map_effect' && !!e.roll)).toBe(true);
    const f85 = r85.state.combatants.X as Combatant;
    expect(monsterTurnEvents({ ...r85.state, round: 2 }, f85, 'end', MID)).toEqual([]);
    expect(monsterTurnEvents({ ...r85.state, round: 2 }, f85, 'start', MID).length).toBeGreaterThan(0);
  });
  it('Giant Toad 86: kurtarmasız, her tur sonunda 3d6 Acid (başta değil)', () => {
    const s = arena('giant-toad', NEW, held());
    const r = run(s, { type: 'monster_ability', actorId: 'X', abilityId: 'swallow' });
    expect(r.events.some((e) => e.type === 'map_effect' && !!e.roll)).toBe(false);
    const toad = r.state.combatants.X as Combatant;
    expect(monsterTurnEvents(r.state, toad, 'start', MID)).toEqual([]);
    expect(monsterTurnEvents(r.state, toad, 'end', MID).length).toBeGreaterThan(0);
  });
  it('Clay Golem 86: Multiattack 2 Slam, Hasten turunda 3 (plan ve plansız); 85: plan 3, plansız 5', () => {
    const atks = (evs: BattleEvent[]) => evs.filter((e) => e.type === 'attack_resolved' && e.actorId === 'X').length;
    const s = arena('clay-golem', NEW);
    expect(atks(run(s, { type: 'multiattack', actorId: 'X', targetId: 'A' }).events)).toBe(2);
    const spec = multiSpecOf(s, s.combatants.X as Combatant);
    expect(spec).toMatchObject({ total: 2, ifUsed: { ability: 'hasten', total: 3 } });
    const three = [{ attack: 'Slam', targetId: 'A' }, { attack: 'Slam', targetId: 'A' }, { attack: 'Slam', targetId: 'A' }];
    expect(multiPlanProblem(spec!, s.combatants.X as Combatant, three, s)).toContain('en çok 2');
    const h = run(s, { type: 'monster_ability', actorId: 'X', abilityId: 'hasten' });
    expect(h.events.some((e) => e.type === 'trait_turn' && e.trait === 'mab:hasten')).toBe(true);
    expect(multiPlanProblem(spec!, h.state.combatants.X as Combatant, three, h.state)).toBeNull();
    const m = run(h.state, { type: 'multiattack', actorId: 'X', targetId: 'A' });
    expect(atks(m.events)).toBe(3);
    replays(s, { state: m.state, events: [...h.events, ...m.events] });
    const s85 = arena('clay-golem', OLD);
    expect(multiSpecOf(s85, s85.combatants.X as Combatant)).toMatchObject({ total: 3 });
    expect(multiSpecOf(s85, s85.combatants.X as Combatant)?.ifUsed).toBeUndefined();
    expect(atks(run(s85, { type: 'multiattack', actorId: 'X', targetId: 'A' }).events)).toBe(5);
    expect(run(s85, { type: 'monster_ability', actorId: 'X', abilityId: 'hasten' }).events.some((e) => e.type === 'trait_turn')).toBe(false);
  });
});

describe('D1 yüzme hızı (7)', () => {
  it('SRD değerleri 86\'da, bellekten yazılmış eski değerler 85\'te (savaşçının swimFt\'si)', () => {
    const sw = (id: string, v: number) => combatantFromMonster(getMonster(id), { id: 'B', kuralSurumu: v }).swimFt;
    const want: Record<string, [number, number]> = {
      archelon: [80, 40], 'dragon-turtle': [50, 40], 'giant-shark': [60, 50], 'giant-venomous-snake': [40, 30],
      'gibbering-mouther': [20, 10], 'polar-bear': [40, 30], 'reef-shark': [30, 40],
    };
    for (const [id, [yeni, eski]] of Object.entries(want)) {
      expect(sw(id, NEW), id).toBe(yeni);
      expect(sw(id, OLD), id).toBe(eski);
      expect(arena(id, OLD).combatants.X?.swimFt, `${id} geri alma`).toBe(eski);
    }
    expect(sw('crocodile', OLD)).toBe(sw('crocodile', NEW));
  });
});
