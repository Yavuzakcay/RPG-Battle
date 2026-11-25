/**
 * Görev KARAR104 (kural sürümü 104): bekleyen kullanıcı kararları SRD 5.2.1'e göre. Her madde 103 ↔ 104 ve replay.
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { combatantFromMonster, combatantFromSheet } from './index';
import { itemHitsFor } from './itemEffects';
import { superiorPreyEvents } from './classTraits';
import { attackDice } from './effectDice';
import { askPicks } from '../rules/choice';
import type { ReactionAnswer, ReactionRequest } from '../rules/reactionChoice';
import { boundWeaponName, eligibleWeaponsOf } from '../rules/itemBinding';
import type { CharacterSheet } from '../rules/stats';
import { getMonster } from '../data';
import { applyBattleResult } from '../app/partyStatus';
import { blankCharacter } from '../rules/builder';
import { currentStatus, fullStatus, longRestStatus } from '../rules/characterRest';
import { JOURNEY_RULES } from '../journey/engine';
import { zeroHpRest } from '../journey/seruven';
import { dragBack } from '../journey/hapishane';
import { startBattle } from './create';
import { replay } from './index';
import { GM, mk, P1 } from './fixtures';
import { KARAR104_VERSION, karar104On } from './karar104Surum';
import { CURRENT_RULES } from './ruleVersion';
import { distance } from '../rules/hex';
import { zoneAttackSources, zoneSpecOf } from './zones';
import type { DiceRequest, Rng } from '../rules/dice';
import { FRESH_ECONOMY, type BattleEvent, type BattleState, type Combatant, type Command } from './types';

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

describe('KARAR104 A11: 0 HP’de uzun dinlenme (SRD 5.2.1 s. 185, s. 18; Normal SRD, Kolay ev kuralı)', () => {
  const sh = { ...blankCharacter('p1').sheet, name: 'Kahraman', classId: 'wizard', level: 3 };
  const down = () => { const f = fullStatus(sh); return { ...f, hp: 0, hitDiceSpent: 2, slots: f.slots.map(() => 0) }; };
  it('SRD (varsayılan): uzun dinlenme başlamaz, 1 HP ile kalkar, başka kazanç yok; sonraki uzun dinlenme tam', () => {
    const r = longRestStatus(sh, down());
    expect(r.hp).toBe(1);
    expect(r.hitDiceSpent).toBe(2);
    expect(r.slots.every((n) => n === 0)).toBe(true);
    expect(longRestStatus(sh, r).hp).toBe(fullStatus(sh).hp);
  });
  it('ev kuralı: 0 HP’de tam uzun dinlenme (eski davranış); ölü dirilmez', () => {
    expect(longRestStatus(sh, down(), undefined, 'ev').hp).toBe(fullStatus(sh).hp);
    expect(longRestStatus(sh, { ...down(), dead: true }, undefined, 'ev').dead).toBe(true);
  });
  it('yolculuk zorluğa göre (Kolay ev, Normal/Zor SRD); Serüven anahtarı `kolayDinlenme`; Hapishane sürüklenişi tam dinlendirir', () => {
    expect(JOURNEY_RULES.zeroHpLongRest).toEqual({ kolay: 'ev', normal: 'srd', zor: 'srd' });
    expect(zeroHpRest({ toggles: {} })).toBe('srd');
    expect(zeroHpRest({ toggles: { kolayDinlenme: true } })).toBe('ev');
    expect(currentStatus(sh, dragBack(sh, { ...down(), dead: true })).hp).toBe(fullStatus(sh).hp);
  });
});

describe('KARAR104 A2: yapışma (Stirge, Darkmantle, Cloaker; SRD 5.2.1)', () => {
  const beast = (id: string, cid: string, pos: { col: number; row: number }, side: 'enemies' | 'party' = 'enemies'): Combatant =>
    ({ ...combatantFromMonster(getMonster(id), { id: cid }), side, pos, ...(side === 'party' ? { ownerId: 'p1' } : {}) });
  const hero = (p: Partial<Combatant> = {}) => mk('H', { ownerId: 'p1', hp: 300, maxHp: 300, ac: 5, speed: 30, pos: at(4, 5), ...p });
  const atk = (s: BattleState, actorId: string, name: string, targetId = 'H'): Command =>
    ({ type: 'monster_attack', actorId, targetId, attackIndex: (s.combatants[actorId] as Combatant).attacks.findIndex((a) => a.name === name) }) as Command;
  const attachOf = (s: BattleState, id = 'H') => s.combatants[id]?.effects?.find((e) => e.attachedBy);
  /** Eylemi tazelenmiş saldırganla dener (yalnız yapışma kısıtı sınanır). */
  const err = (s: BattleState, cmd: Command) => {
    const id = (cmd as { actorId: string }).actorId;
    const fresh = { ...s, combatants: { ...s.combatants, [id]: { ...(s.combatants[id] as Combatant), economy: { ...FRESH_ECONOMY } } } };
    const r = execute(fresh, cmd, (s.combatants[id] as Combatant).side === 'enemies' ? GM : P1, hooked(20));
    return r.ok ? '' : r.error;
  };

  it('104 Stirge: yapışır, Proboscis tekrar yok, stirge’nin tur başında 2d4 Necrotic; 103: yapışma yok', () => {
    const s = scene104(NEW, [beast('stirge', 'S', at(3, 5)), hero()]);
    const r = play(s, [atk(s, 'S', 'Proboscis')], hooked(20));
    expect(attachOf(r.state)).toMatchObject({ attachedBy: 'S', attachAuto: true, sourceTurnDamage: { dice: '2d4', type: 'necrotic' } });
    expect(err(r.state, atk(r.state, 'S', 'Proboscis'))).toContain('yapışıkken');
    const t = play(r.state, [{ type: 'end_turn', actorId: 'S' } as Command, { type: 'end_turn', actorId: 'H' } as Command], hooked(20));
    expect(t.events.some((e) => e.type === 'effect_tick' && e.targetId === 'H' && e.damageType === 'necrotic')).toBe(true);
    const o = scene104(OLD, [beast('stirge', 'S', at(3, 5)), hero()]);
    expect(attachOf(play(o, [atk(o, 'S', 'Proboscis')], hooked(20)).state)).toBeUndefined();
  });
  it('104: hedef yürüyünce yapışan birlikte gelir, fırsat saldırısı yok; eylemle zarsız ayırma; yapışan 5 ft ile ayrılır', () => {
    const s = scene104(NEW, [beast('stirge', 'S', at(3, 5)), hero()]);
    const r = play(s, [atk(s, 'S', 'Proboscis'), { type: 'end_turn', actorId: 'S' } as Command, { type: 'move', actorId: 'H', to: at(8, 5) } as Command], hooked(20));
    expect(r.events.some((e) => e.type === 'attack_resolved' && e.actorId === 'S' && e.targetId === 'H' && (e as { opportunity?: boolean }).opportunity)).toBe(false);
    const S = r.state.combatants.S as Combatant;
    expect(distance(S.pos!, r.state.combatants.H!.pos!)).toBe(1);
    expect(attachOf(r.state)).toBeDefined();
    const esc = play(r.state, [{ type: 'escape', actorId: 'H' } as Command], hooked(1));
    expect(attachOf(esc.state)).toBeUndefined();
    // Yapışan kendi hareketiyle ayrılır: ayrılma 5 ft harcar.
    const own = play(s, [atk(s, 'S', 'Proboscis'), { type: 'move', actorId: 'S', to: at(2, 5) } as Command], hooked(20));
    expect(attachOf(own.state)).toBeUndefined();
    expect(own.events.some((e) => e.type === 'moved' && e.actorId === 'S' && e.cost === 1 && e.path.length === 1)).toBe(true);
  });
  it('104 Darkmantle: avantajlı isabette örter (Blinded, nefes alamaz); avantajsızda yalnız yapışır; yalnız hedefe saldırır', () => {
    const adv = scene104(NEW, [beast('darkmantle', 'D', at(3, 5)), hero({ conditions: ['Prone'] }), beast('ogre', 'O', at(3, 4), 'party')]);
    const r = play(adv, [atk(adv, 'D', 'Crush')], hooked(20));
    expect(attachOf(r.state)).toMatchObject({ grants: ['Blinded'], noBreath: true, escapeCheck: { dc: 13 } });
    expect(err(r.state, atk(r.state, 'D', 'Crush', 'O'))).toContain('yalnız');
    const plain = scene104(NEW, [beast('darkmantle', 'D', at(3, 5)), hero()]);
    const p = play(plain, [atk(plain, 'D', 'Crush')], hooked(20));
    expect(attachOf(p.state)?.grants).toBeUndefined();
    expect(attachOf(p.state)?.noBreath).toBeUndefined();
  });
  it('104 Cloaker: hedef Blinded; cloaker aldığı hasarı yarıya indirir, hedef aynı miktarı alır', () => {
    const s = scene104(NEW, [beast('cloaker', 'C', at(3, 5)), hero(), beast('ogre', 'O', at(3, 4), 'party')]);
    const r = play(s, [atk(s, 'C', 'Attach')], hooked(20));
    expect(attachOf(r.state)).toMatchObject({ grants: ['Blinded'], escapeCheck: { dc: 14, allyHelp: true } });
    const hp0 = r.state.combatants.H!.hp;
    const c0 = r.state.combatants.C!.hp;
    const hit = play({ ...r.state, turnIndex: r.state.order.indexOf('O') }, [atk(r.state, 'O', 'Greatclub', 'C')], hooked(20));
    const raw = hit.events.find((e) => e.type === 'attack_resolved' && e.targetId === 'C') as Extract<BattleEvent, { type: 'attack_resolved' }>;
    const lost = c0 - hit.state.combatants.C!.hp;
    expect(lost).toBe(Math.floor(raw.rawDamage / 2));
    expect(hp0 - hit.state.combatants.H!.hp).toBe(lost);
  });
});

describe('KARAR104 A10: eşya ↔ silah bağı (SRD 5.2.1 "made with this magic weapon")', () => {
  const fighter = (patch: Partial<CharacterSheet> = {}) => ({ ...blankCharacter('p1').sheet, name: 'Savaşçı', classId: 'fighter', level: 3,
    weapons: [{ name: 'Longsword' }, { name: 'Dagger' }], itemNames: ['Weapon, +2', 'Flame Tongue'], ...patch }) as CharacterSheet;
  const opts = (v: number, sh: CharacterSheet) => {
    const c = combatantFromSheet(sh, { id: 'A', ownerId: 'p1' });
    const s = startBattle('a10', 'd', [{ ...c, pos: null }], () => 0.5, { kuralSurumu: v } as never).state;
    const a = s.combatants.A as Combatant;
    const by = (id: string) => a.weaponOptions.find((o) => o.weaponId === id && !o.ranged)!;
    return { a, long: by('longsword'), dagger: by('dagger') };
  };
  it('varsayılan ana silah: 104’te +2 yalnız Longsword’a; 103’te her silaha', () => {
    const n = opts(NEW, fighter());
    expect(n.long.attackBonus - n.dagger.attackBonus).toBeGreaterThanOrEqual(2);
    expect(n.long.enchant).toBe(2);
    expect(n.dagger.enchant ?? 0).toBe(0);
    const o = opts(OLD, fighter());
    expect(o.dagger.enchant).toBe(2);
  });
  it('oyuncu seçimi: +2 Dagger’a bağlanınca Longsword’da yok; Flame Tongue eki yalnız bağlı silahta', () => {
    const n = opts(NEW, fighter({ silahBagi: { 'Weapon, +2': 'Dagger' } }));
    expect(n.dagger.enchant).toBe(2);
    expect(n.long.enchant ?? 0).toBe(0);
    const foe = mk('F', { side: 'enemies' });
    expect(itemHitsFor(n.a, n.long, foe).map((h) => h.label)).toContain('Flame Tongue');
    expect(itemHitsFor(n.a, n.dagger, foe).map((h) => h.label)).not.toContain('Flame Tongue');
    const o = opts(OLD, fighter());
    expect(itemHitsFor(o.a, o.dagger, foe).map((h) => h.label)).toContain('Flame Tongue');
  });
  it('uygunluk veriden: Dagger of Venom yalnız Dagger; uygun silah yoksa bağ yok', () => {
    expect(eligibleWeaponsOf({ weapons: [{ name: 'Longsword' }, { name: 'Dagger' }] }, 'Dagger of Venom')).toEqual(['Dagger']);
    expect(boundWeaponName({ weapons: [{ name: 'Longsword' }] }, 'Dagger of Venom')).toBeNull();
    expect(boundWeaponName({ weapons: [{ name: 'Longsword' }, { name: 'Dagger' }], silahBagi: { 'Weapon, +1': 'Club' } }, 'Weapon, +1')).toBe('Longsword');
  });
});

describe('KARAR104 A5: otomatik seçimler "Sor"a bağlı (öneri = eski otomatik seçim)', () => {
  const deciding = (answer: (q: ReactionRequest) => ReactionAnswer, seen: ReactionRequest[] = []): Rng => {
    const r = (() => 0.5) as Rng & { react: (q: ReactionRequest) => ReactionAnswer };
    r.react = (q) => { seen.push(q); return answer(q); };
    return r;
  };
  const opts = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }];
  it('askPicks: kancasız Rng öneriyi aynen verir; oyuncu sırayı değiştirip erken bırakabilir', () => {
    expect(askPicks(() => 0.5, { actorId: 'X', label: 'L', options: opts, suggested: ['b', 'a'], max: 3 })).toEqual(['b', 'a']);
    expect(askPicks(() => 0.5, { actorId: 'X', label: 'L', options: opts, suggested: ['b', 'a', 'c'], max: 2 })).toEqual(['b', 'a']);
    const picks = ['c', null];
    let i = 0;
    expect(askPicks(deciding(() => { const p = picks[i++]; return p ? { option: 'choice', choice: p } : null; }), { actorId: 'X', label: 'L', options: opts, suggested: ['a', 'b'], max: 3 })).toEqual(['c']);
  });
  it("Superior Hunter's Prey: 104'te ikinci hedef sorulur (öneri en az HP'li); 103'te soru yok", () => {
    const parts = [mk('R', { ownerId: 'p1', traits: ['superior-hunters-prey'], pos: at(3, 5) }), mk('F1', { side: 'enemies', hp: 50, maxHp: 50, pos: at(4, 5) }),
      mk('F2', { side: 'enemies', hp: 40, maxHp: 50, pos: at(5, 5) }), mk('F3', { side: 'enemies', hp: 10, maxHp: 50, pos: at(4, 6) })];
    const mark = { raw: 6, rolls: [6], type: 'force' };
    const target = (v: number, rng: Rng) => {
      const s = scene104(v, parts);
      const ev = superiorPreyEvents(s, s.combatants.R as Combatant, s.combatants.F1 as Combatant, mark, rng);
      return (ev[0] as { targetId?: string } | undefined)?.targetId;
    };
    expect(target(NEW, () => 0.5)).toBe('F3');
    const seen: ReactionRequest[] = [];
    expect(target(NEW, deciding(() => ({ option: 'choice', choice: 'F2' }), seen))).toBe('F2');
    expect(seen[0]?.trigger).toBe('choice');
    const old: ReactionRequest[] = [];
    expect(target(OLD, deciding(() => ({ option: 'choice', choice: 'F2' }), old))).toBe('F3');
    expect(old).toHaveLength(0);
  });
  it('Stroke of Luck: 104 savaşçısında (`k104`) kullanmadan önce sorulur; 103’te sorusuz', () => {
    const c = mk('A', { traits: ['stroke-of-luck'], resources: { strokeOfLuck: 1 } });
    const luck = (k104?: true) => attackDice({ ...c, ...(k104 ? { k104 } : {}) }).find((x) => x.label === 'Stroke of Luck');
    expect(luck(true)).toMatchObject({ ask: true, askTrigger: 'boon' });
    expect(luck()?.ask).toBeUndefined();
  });
});
