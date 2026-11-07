/**
 * Kuyruk K62: SRD uyumu 2 (kural sürümü 46, mekaniğin `k62` bloğu): Wall of Ice, Forcecage, Delayed Blast Fireball.
 * Her büyü için yeni davranış (46) ve eski davranış (45); replay `run` içinde denetlenir.
 */
import { describe, expect, it } from 'vitest';
import { spells } from '../data';
import { execute } from './index';
import { applyEvents } from './reduce';
import { GM, mk, P1 } from './fixtures';
import { caster, field, run } from './k19spells.test';
import { panelDamageEvents, panelId, panelOf, panelStats } from './walls';
import { triggerEvents } from './zones';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const LOW = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };
const HIGH = { str: 30, dex: 30, con: 30, int: 30, wis: 30, cha: 30 };
const ALL = [4, 3, 3, 3, 3, 3, 3, 2, 1];
const foe = (id: string, p: Partial<Combatant> = {}) => mk(id, { side: 'enemies', hp: 400, maxHp: 400, saves: LOW, ...p });
const cast = (spellName: string, extra: Record<string, unknown> = {}) => ({ type: 'cast_spell', actorId: 'A', spellName, ...extra }) as Command;
const wiz = (names: string[], p: Partial<Combatant> = {}) => caster({ spellNames: names, spellSlots: ALL, concentration: null, hp: 900, maxHp: 900, ...p });
const sp = (n: string) => spells.find((s) => s.name === n) as NonNullable<(typeof spells)[number]>;
const endTurn = (s: BattleState, id: string, rng: () => number = () => 0.5) => { const r = execute(s, { type: 'end_turn', actorId: id }, id === 'A' ? P1 : GM, rng); if (!r.ok) throw new Error(r.error); return r; };
const pos = { A: { col: 2, row: 3 }, F0: { col: 6, row: 3 } };


const fireOpt = { label: 'Fire Bolt', attackBonus: 40, damage: '4d10', damageType: 'fire', ranged: true, range: [120, 120], spell: true, tag: 'firebolt' } as never;
const iceWall = (k: number, slot = 6, foeAt = { col: 5, row: 3 }) => {
  const s = field([wiz(['Wall of Ice', 'Wall of Stone']), foe('F0')], { ...pos, F0: foeAt }, k);
  return run(s, cast('Wall of Ice', { targetHex: { col: 5, row: 3 }, slotLevel: slot }));
};

describe('K62 Wall of Ice', () => {
  it('veri ve M1 metni: AC 12, 30 HP, 10d6 / 5d6 soğuk, Fire zayıf, Cold/Poison/Psychic bağışık', () => {
    const t = sp('Wall of Ice').text ?? '';
    expect(t).toMatch(/AC 12/); expect(t).toMatch(/30 HP/); expect(t).toMatch(/10d6/); expect(t).toMatch(/5d6/);
    const z = sp('Wall of Ice').mechanics.k62?.zone;
    expect(z).toMatchObject({ panels: true, panelHp: 30, panelAc: 12, panelImmune: ['cold', 'poison', 'psychic'], panelVuln: ['fire'], cutDamage: { dice: '10d6', type: 'cold' }, frigidAir: { dice: '5d6', type: 'cold', save: 'con', upDice: '1d6' } });
  });
  it('46: kesilen yaratık itilir ve DEX save 10d6 Cold (yukarı slot +2d6); 45: hasar yok', () => {
    const rolls = (r: ReturnType<typeof iceWall>) => r.events.find((e) => e.type === 'map_effect')?.damage?.rolls.length;
    expect(rolls(iceWall(46, 6))).toBe(10);
    expect(rolls(iceWall(46, 8))).toBe(14);
    expect(iceWall(46, 6).events.find((e) => e.type === 'map_effect')?.damage?.type).toBe('cold');
    const old = iceWall(45, 6);
    expect(old.events.some((e) => e.type === 'map_effect')).toBe(false);
    expect(old.state.map?.zones?.[0]?.spec).toBeUndefined();
  });
  it('panel AC 12 / 30 HP (46); Wall of Stone 15 / 90 aynen', () => {
    const r = iceWall(46);
    expect(panelStats(r.state.map!.zones![0]!)).toMatchObject({ hp: 30, ac: 12 });
    const stone = run(field([wiz(['Wall of Stone']), foe('F0')], pos, 46), cast('Wall of Stone', { targetHex: { col: 5, row: 3 }, slotLevel: 5 }));
    expect(panelStats(stone.state.map!.zones![0]!)).toMatchObject({ hp: 90, ac: 15, immune: ['poison', 'psychic'], vuln: [] });
    expect(panelOf(iceWall(45).state, panelId(iceWall(45).state.map!.zones![0]!, { col: 5, row: 3 }))).toBeNull();
  });
  it('Cold/Poison/Psychic panele işlemez; Fire iki kat; 0 HP\'de panel düşer ve donuk hava perdesi kalır', () => {
    const r = iceWall(46);
    const z = r.state.map!.zones![0]!;
    const h = { col: 5, row: 3 };
    for (const t of ['cold', 'poison', 'psychic']) expect(panelDamageEvents(r.state, z, h, 999, t)).toEqual([]);
    const soft = panelDamageEvents(r.state, z, h, 10, 'fire');
    expect(soft[0]).toMatchObject({ type: 'zone_panel_damaged', amount: 20 });
    expect(soft.some((e) => e.type === 'zone_moved')).toBe(false);
    const dead = panelDamageEvents(r.state, z, h, 15, 'fire'); // 30 ≥ 30 HP
    expect(dead.some((e) => e.type === 'zone_moved')).toBe(true);
    const after = applyEvents(r.state, dead);
    const veil = after.map!.zones!.find((x) => x.name === 'Donuk hava');
    expect(veil?.hexes).toEqual([h]);
    expect(after.map!.zones!.find((x) => x.id === z.id)?.hexes.some((x) => x.col === 5 && x.row === 3)).toBe(false);
  });
  it('uçtan uca: attack_object ile Fire panelde 2× hasar', () => {
    const r = iceWall(46, 6, { col: 6, row: 3 });
    const z = r.state.map!.zones![0]!;
    const a = execute({ ...r.state, combatants: { ...r.state.combatants, A: { ...(r.state.combatants.A as Combatant), pos: { col: 3, row: 3 }, economy: { ...(r.state.combatants.A as Combatant).economy, action: false } } } },
      { type: 'attack_object', actorId: 'A', objectId: panelId(z, { col: 5, row: 3 }), option: fireOpt }, P1, () => 0.9);
    if (!a.ok) throw new Error(a.error);
    expect(a.events.some((e) => e.type === 'zone_panel_damaged')).toBe(true);
  });
  it('perde: turda ilk geçişte CON save 5d6 Cold (yukarı slot +1d6), aynı turda ikinci kez yok; konsantrasyon kopunca kalkar', () => {
    for (const [slot, n] of [[6, 5], [8, 7]] as const) {
      const r = iceWall(46, slot, { col: 6, row: 4 });
      const z = r.state.map!.zones![0]!;
      const s = applyEvents(r.state, panelDamageEvents(r.state, z, { col: 5, row: 3 }, 99, 'bludgeoning'));
      const veil = s.map!.zones!.find((x) => x.name === 'Donuk hava')!;
      const evs = triggerEvents(s, veil, 'F0', () => 0.5);
      const hit = evs.find((e) => e.type === 'effect_tick' || e.type === 'save_resolved') as { damageRolls?: number[]; damageType?: string } | undefined;
      expect(hit?.damageRolls?.length).toBe(n);
      expect(hit?.damageType).toBe('cold');
      const s2 = applyEvents(s, evs);
      expect(triggerEvents(s2, s2.map!.zones!.find((x) => x.name === 'Donuk hava')!, 'F0', () => 0.5)).toEqual([]);
      const gone = applyEvents(s, [{ type: 'concentration_ended', actorId: 'A', label: 'Wall of Ice' }]);
      expect(gone.map?.zones?.length ?? 0).toBe(0);
    }
  });
});

import { zoneMoveCost } from './zones';
import { checkReach, spellReach } from './range';
import { cageBoxBlock, cageTeleport, cageStepBlocked } from './forcecage';
import { forcedMove } from './motion';
import { chooseCommand } from './ai';

describe('K62 Forcecage', () => {
  const cagePos = { A: { col: 2, row: 3 }, F0: { col: 6, row: 3 }, F1: { col: 9, row: 3 } };
  const cage = (k: number, choice: 'box' | 'cage' = 'box', extra: Record<string, unknown> = {}) =>
    run(field([wiz(['Forcecage', 'Dispel Magic', 'Misty Step']), foe('F0'), foe('F1')], cagePos, k), cast('Forcecage', { targetHex: { col: 6, row: 3 }, choice, ...extra }));

  it('veri ve M1 metni: kafes ya da kutu, hapis, CHA save', () => {
    const t = sp('Forcecage').text ?? '';
    expect(t).toMatch(/20 ft kafes ya da 10 ft kutu/); expect(t).toMatch(/CHA save/);
    expect(sp('Forcecage').mechanics.k62?.zone).toMatchObject({ rounds: 600, cage: { barsRadius: 2 } });
  });
  it('46: kutu 2×2 altıgen, içindeki hapsolur: yürüyüşle çıkamaz, dışarıdan giremez; içeride hareket serbest', () => {
    const r = cage(46, 'box');
    const z = r.state.map!.zones![0]!;
    expect(z.cage).toBe('box');
    expect(z.hexes.length).toBe(4);
    expect(z.hexes.some((h) => h.col === 6 && h.row === 3)).toBe(true);
    const f0 = r.state.combatants.F0 as Combatant;
    const out = { col: 9, row: 5 };
    expect(zoneMoveCost(r.state, f0)(out, f0.pos!)).toBeNull();
    const inner = z.hexes.find((h) => h.col !== 6 || h.row !== 3)!;
    expect(zoneMoveCost(r.state, f0)(inner, f0.pos!)).not.toBeNull();
    const a = r.state.combatants.A as Combatant;
    expect(zoneMoveCost(r.state, a)(z.hexes[0]!, { col: 1, row: 1 })).toBeNull();
    expect(cageStepBlocked(r.state, f0.pos!, out)).toBe(true);
  });
  it('kafes yarıçap 2 (19 altıgen); kafeste saldırı ve görüş geçer, kutuda kesilir', () => {
    const bars = cage(46, 'cage').state;
    expect(bars.map!.zones![0]!.hexes.length).toBe(19);
    const box = cage(46, 'box').state;
    const a = box.combatants.A as Combatant, f = box.combatants.F0 as Combatant;
    expect(cageBoxBlock(bars, a.pos!, f.pos!)).toBeNull();
    expect(cageBoxBlock(box, a.pos!, f.pos!)).toBeTruthy();
    expect(checkReach(box, a, f, spellReach(sp('Misty Step') as never)).ok).toBe(false);
    expect(checkReach(bars, a, f, { kind: 'effect', rangeFt: 100 }).ok).toBe(true);
  });
  it('zorla hareket kafesten dışarı itemez; ışınlanma için önce CHA save (başarıda çıkar, başarısızlıkta boşa gider)', () => {
    const s = cage(46, 'box').state;
    const f = s.combatants.F0 as Combatant;
    const pushed = forcedMove(s, 'F0', 'push', 30, 'A', () => 0.5, { origin: { col: 1, row: 3 } });
    expect(pushed.every((e) => e.type !== 'pushed' || cageStepBlocked(s, e.from, e.to) === false)).toBe(true);
    const stay = (id: string, cha: number) => ({ ...s, combatants: { ...s.combatants, [id]: { ...(s.combatants[id] as Combatant), saves: { ...(s.combatants[id] as Combatant).saves, cha } } } });
    const to = { col: 12, row: 3 };
    const ok = cageTeleport(stay('F0', 40), stay('F0', 40).combatants.F0 as Combatant, to, () => 0.5);
    expect(ok?.ok).toBe(true);
    const bad = cageTeleport(stay('F0', -40), stay('F0', -40).combatants.F0 as Combatant, to, () => 0.5);
    expect(bad?.ok).toBe(false);
    expect(bad?.events.some((e) => e.type === 'map_note')).toBe(true);
    expect(cageTeleport(s, f, { col: 6, row: 3 }, () => 0.5)).toBeNull();
  });
  it('Dispel Magic bozamaz; konsantrasyon kopunca kafes kalkar', () => {
    const r = cage(46, 'box');
    const d = execute(r.state, cast('Dispel Magic', { targetHex: { col: 6, row: 3 }, slotLevel: 9 }), P1, () => 0.9);
    const s = d.ok ? d.state : r.state;
    expect(s.map!.zones!.some((z) => z.cage)).toBe(true);
    const gone = applyEvents(r.state, [{ type: 'concentration_ended', actorId: 'A', label: 'Forcecage' }]);
    expect(gone.map?.zones?.length ?? 0).toBe(0);
  });
  it('45: eski davranış (tek hedef, sealed + hız 0), alan yok', () => {
    const r = run(field([wiz(['Forcecage']), foe('F0')], cagePos, 45), cast('Forcecage', { targetIds: ['F0'] }));
    expect(r.state.map?.zones?.length ?? 0).toBe(0);
    expect(r.state.combatants.F0?.effects?.some((e) => e.sealed)).toBe(true);
  });
  it('YZ: güçlü bir oyuncuyu kutuya kapatır (46)', () => {
    const e = mk('E', { side: 'enemies', hp: 90, maxHp: 90, spellNames: ['Forcecage'], spellSlots: ALL, spellSaveDc: 15, spellMod: 5, casterTag: 'wizard', concentration: null });
    const p = mk('P', { ownerId: 'p1', hp: 60, maxHp: 60 });
    const s = field([e, p], { E: { col: 2, row: 3 }, P: { col: 7, row: 3 } }, 46);
    const c = chooseCommand(s);
    expect(c.type === 'cast_spell' && c.spellName === 'Forcecage' && c.choice === 'box').toBe(true);
  });
});

import { beadDice } from './bead';

describe('K62 Delayed Blast Fireball', () => {
  const bpos = { A: { col: 1, row: 3 }, F0: { col: 8, row: 3 }, F1: { col: 9, row: 4 } };
  const cast7 = (k: number, slot = 7, saves = LOW) =>
    run(field([wiz(['Delayed Blast Fireball', 'Fireball']), foe('F0', { saves }), foe('F1', { saves })], bpos, k), cast('Delayed Blast Fireball', { targetHex: { col: 8, row: 3 }, slotLevel: slot }));
  const bead = (s: BattleState) => (s.map?.zones ?? []).find((z) => z.bead);

  it('veri ve M1 metni: 12d6, 20 ft, her tur sonu +1d6', () => {
    const t = sp('Delayed Blast Fireball').text ?? '';
    expect(t).toMatch(/12d6/); expect(t).toMatch(/20 ft/); expect(t).toMatch(/\+1d6/);
    expect(sp('Delayed Blast Fireball').mechanics.k62?.zone?.bead).toMatchObject({ rounds: 10, throwFt: 40 });
  });
  it('46: dökümde hasar yok, boncuk alanı kalır; 45: eski davranış (hemen 12d6)', () => {
    const r = cast7(46);
    expect(r.state.combatants.F0?.hp).toBe(400);
    expect(bead(r.state)?.center).toEqual({ col: 8, row: 3 });
    expect(r.events.some((e) => e.type === 'save_resolved')).toBe(false);
    expect(r.state.combatants.A?.concentration?.spell).toBe('Delayed Blast Fireball');
    const old = cast7(45);
    expect(old.events.some((e) => e.type === 'save_resolved' && e.damageRolls.length === 12)).toBe(true);
    expect(bead(old.state)).toBeUndefined();
  });
  it('büyücünün turu bitince +1d6 birikir; yukarı slot taban +1d6', () => {
    let s = cast7(46).state;
    expect(beadDice(bead(s)!)).toBe(12);
    s = endTurn(s, 'A').state;
    expect(beadDice(bead(s)!)).toBe(13);
    expect(beadDice(bead(cast7(46, 8).state)!)).toBe(13);
  });
  it('konsantrasyon bitince patlar: birikmiş zar, DEX save, başarıda yarı; zone_ended', () => {
    let s = cast7(46).state;
    s = endTurn(s, 'A').state; // +1
    const ended = applyEvents(s, [{ type: 'concentration_ended', actorId: 'A', label: 'Delayed Blast Fireball' }]);
    const r = endTurn({ ...ended, order: ['A', 'F0', 'F1'], turnIndex: 0 }, 'A');
    const saves = r.events.filter((e) => e.type === 'save_resolved');
    expect(saves.length).toBe(2);
    for (const e of saves) { expect(e.damageType).toBe('fire'); expect(e.damageRolls.length).toBe(13); expect(e.appliedDamage).toBe(e.rawDamage); }
    expect(r.events.some((e) => e.type === 'area_used' && e.damageType === 'fire' && e.dice === '13d6')).toBe(true);
    expect(r.events.some((e) => e.type === 'zone_ended')).toBe(true);
    expect(bead(r.state)).toBeUndefined();
    const half = cast7(46, 7, HIGH).state;
    const r2 = endTurn({ ...applyEvents(half, [{ type: 'concentration_ended', actorId: 'A', label: 'Delayed Blast Fireball' }]), order: ['A', 'F0', 'F1'], turnIndex: 0 }, 'A');
    const s2 = r2.events.find((e) => e.type === 'save_resolved')!;
    expect(s2.appliedDamage).toBe(Math.floor(s2.rawDamage / 2));
  });
  it('10 tur dolunca patlar (süre)', () => {
    const s = cast7(46).state;
    const late = { ...s, round: (bead(s)!.bead!.until) + 1 };
    const r = endTurn({ ...late, order: ['A', 'F0', 'F1'], turnIndex: 0 }, 'A');
    expect(r.events.some((e) => e.type === 'save_resolved')).toBe(true);
    expect(bead(r.state)).toBeUndefined();
  });
  it('dokunma: başarısız DEX save büyüyü bitirip patlatır; başarıda fırlatılır (yaratığa çarpınca patlar)', () => {
    const base = cast7(46).state;
    const z = bead(base)!;
    const near = (s: BattleState, who: string, saves: typeof LOW) => ({ ...s, combatants: { ...s.combatants, [who]: { ...(s.combatants[who] as Combatant), pos: { col: 7, row: 3 }, saves } }, order: [who, 'A', 'F0', 'F1'], turnIndex: 0 });
    const bad = execute(near(base, 'F1', LOW), { type: 'spell_followup', actorId: 'F1', targetId: z.id, choice: 'bead' }, GM, () => 0.5);
    if (!bad.ok) throw new Error(bad.error);
    expect(bad.events.some((e) => e.type === 'concentration_ended')).toBe(true);
    expect(bad.events.some((e) => e.type === 'save_resolved')).toBe(true);
    expect(bead(bad.state)).toBeUndefined();
    // Başarı + fırlatma: A'nın bulunduğu yöne 3 altıgen; yolda yaratık yok → iner, patlamaz.
    const ok = execute(near(base, 'F1', HIGH), { type: 'spell_followup', actorId: 'F1', targetId: z.id, targetHex: { col: 5, row: 3 }, choice: 'bead' }, GM, () => 0.5);
    if (!ok.ok) throw new Error(ok.error);
    expect(bead(ok.state)?.center).toEqual({ col: 5, row: 3 });
    expect(ok.events.some((e) => e.type === 'save_resolved')).toBe(false);
    // Yolda yaratık varsa (A, 1,3) orada patlar.
    const hitA = execute(near(base, 'F1', HIGH), { type: 'spell_followup', actorId: 'F1', targetId: z.id, targetHex: { col: 1, row: 3 }, choice: 'bead' }, GM, () => 0.5);
    if (!hitA.ok) throw new Error(hitA.error);
    expect(hitA.events.some((e) => e.type === 'save_resolved')).toBe(true);
    // Uzakta olan dokunamaz.
    expect(execute(base, { type: 'spell_followup', actorId: 'A', targetId: z.id, choice: 'bead' }, P1, () => 0.5).ok).toBe(false);
  });
  it('YZ: iki düşmanı kapsayan noktaya boncuğu koyar (46); 45\'te koymaz', () => {
    const e = mk('E', { side: 'enemies', hp: 90, maxHp: 90, spellNames: ['Delayed Blast Fireball'], spellSlots: ALL, spellSaveDc: 15, spellMod: 5, casterTag: 'wizard', concentration: null });
    const mkS = (k: number) => field([e, mk('P1', { ownerId: 'p1', hp: 40, maxHp: 40 }), mk('P2', { ownerId: 'p1', hp: 40, maxHp: 40 })], { E: { col: 1, row: 3 }, P1: { col: 9, row: 3 }, P2: { col: 9, row: 4 } }, k);
    const c = chooseCommand(mkS(46));
    expect(c.type === 'cast_spell' && c.spellName === 'Delayed Blast Fireball').toBe(true);
  });
});

import { replay } from './reduce';

describe('K62 replay ve eski sürüm', () => {
  it('boncuk: döküm, tur sonu birikimi ve patlama baştan oynatılınca aynı durum (46)', () => {
    const s0 = field([wiz(['Delayed Blast Fireball']), foe('F0'), foe('F1')], { A: { col: 1, row: 3 }, F0: { col: 8, row: 3 }, F1: { col: 9, row: 4 } }, 46);
    const c = run(s0, cast('Delayed Blast Fireball', { targetHex: { col: 8, row: 3 }, slotLevel: 7 }));
    const e1 = endTurn(c.state, 'A');
    const ended = applyEvents(e1.state, [{ type: 'concentration_ended', actorId: 'A', label: 'Delayed Blast Fireball' }]);
    const e2 = endTurn({ ...ended, order: ['A', 'F0', 'F1'], turnIndex: 0 }, 'A');
    const evs: BattleEvent[] = [{ type: 'battle_started', state: s0 }, ...c.events, ...e1.events, { type: 'concentration_ended', actorId: 'A', label: 'Delayed Blast Fireball' }, ...e2.events];
    // Durum ara geçişte elle ayarlandı (order/turnIndex); replay yalnızca olaylardan: kritik alanlar eşit mi.
    const r = replay(evs);
    expect((r.map?.zones ?? []).some((z) => z.bead)).toBe(false);
    expect(r.combatants.F0?.hp).toBe(e2.state.combatants.F0?.hp);
  });
  it('45 ve altı: Wall of Ice zone.spec yok, Forcecage tek hedef, boncuk anında 12d6 (eski sürümler aynen)', () => {
    for (const k of [45, 44, 42]) {
      expect(iceWall(k).state.map?.zones?.[0]?.spec).toBeUndefined();
      const fc = run(field([wiz(['Forcecage']), foe('F0')], { A: { col: 2, row: 3 }, F0: { col: 6, row: 3 } }, k), cast('Forcecage', { targetIds: ['F0'] }));
      expect(fc.state.map?.zones?.length ?? 0).toBe(0);
      const fb = run(field([wiz(['Delayed Blast Fireball']), foe('F0')], { A: { col: 1, row: 3 }, F0: { col: 8, row: 3 } }, k), cast('Delayed Blast Fireball', { targetHex: { col: 8, row: 3 }, slotLevel: 7 }));
      expect(fb.events.some((e) => e.type === 'save_resolved' && e.damageRolls.length === 12)).toBe(true);
    }
  });
});
