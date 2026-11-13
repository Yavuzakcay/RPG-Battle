/**
 * Kuyruk K50: imza alt sınıflar (ev kuralı, kural sürümü 23). Kural kapalı / eski sürüm, eski kimlik, alt sınıf
 * başına çalışan ana eylemler, pasifler, saldırı kancası, Birlik Can Havuzu, açık gökyüzü, replay.
 */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { replay } from './reduce';
import { P1, mk } from './fixtures';
import { blankCharacter } from '../rules/builder';
import { findSubclass } from '../rules/subclasses';
import { classData } from '../data';
import { IMZA_SPECS, imzaOn, openSky } from './imza';
import { imzaAuraBonus } from './imzaCore';
import type { Rng } from '../rules/dice';
import type { CharacterSheet } from '../rules/stats';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const low: Rng = () => 0.01;
const mid: Rng = () => 0.5;
const sheet = (classId: string, subclassId: string, level: number, patch: Partial<CharacterSheet> = {}): CharacterSheet => ({
  ...blankCharacter('im').sheet, name: 'İmza', raceId: 'human', classId, subclassId, level, gender: 'kadin',
  baseScores: { str: 14, dex: 16, con: 14, int: 12, wis: 16, cha: 16 }, weapons: [{ name: 'Shortsword' }], ...patch,
});
const hero = (classId: string, subclassId: string, level: number, patch: Partial<CharacterSheet> = {}) => combatantFromSheet(sheet(classId, subclassId, level, patch), { id: 'A', ownerId: 'p1' });
const RULES: Record<string, string> = { imza_imparator: 'imza_imparator', imza_infazci: 'imza_infazci', imza_ciftci: 'imza_ciftci', imza_dunganga: 'imza_dunganga',
  imza_astrolog: 'imza_astrolog', imza_geride_kalan: 'imza_geride_kalan', imza_sair: 'imza_sair', imza_bilge: 'imza_bilge', imza_hizir: 'imza_hizir', imza_harita: 'imza_harita' };

function arena(a: Combatant, opts: { on?: boolean; kuralSurumu?: number; mapId?: string; foes?: number; c?: Partial<Combatant>; b?: Partial<Combatant>; ally?: Combatant } = {}) {
  const foes = Array.from({ length: opts.foes ?? 1 }, (_, i) => mk(i ? `B${i}` : 'B', { side: 'enemies', hp: 60, maxHp: 60, monsterId: 'bandit', saves: { str: -5, dex: -5, con: -5, int: -5, wis: -5, cha: -5 }, ...opts.b }));
  const houseRules = opts.on === false ? {} : Object.fromEntries(Object.values(RULES).map((r) => [r, true]));
  const s0 = startBattle('im', 'd-z-zemin', [a, opts.ally ?? mk('C', { ownerId: 'p1', hp: 10, maxHp: 30, ...opts.c }), ...foes], () => 0.5, {
    map: { id: opts.mapId ?? 'col' }, houseRules, ...(opts.kuralSurumu ? { kuralSurumu: opts.kuralSurumu } : {}) }).state;
  const combatants = { ...s0.combatants };
  const place: Record<string, { col: number; row: number }> = { A: { col: 3, row: 3 }, C: { col: 5, row: 3 }, B: { col: 4, row: 3 }, B1: { col: 4, row: 2 }, B2: { col: 4, row: 4 } };
  for (const [id, p] of Object.entries(place)) if (combatants[id]) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  const state: BattleState = { ...s0, status: 'active', order: Object.keys(combatants), turnIndex: 0, combatants, map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } };
  const run = {
    state, events: [{ type: 'battle_started', state } as BattleEvent],
    do(cmd: Command, rng: Rng = mid) {
      const r = execute(run.state, cmd, P1, rng);
      if (!r.ok) throw new Error(r.error);
      run.state = r.state; run.events.push(...r.events);
      return r.events;
    },
    try: (cmd: Command, rng: Rng = mid) => execute(run.state, cmd, P1, rng),
    c: (id: string) => run.state.combatants[id] as Combatant,
  };
  return run;
}
const use = (feature: string, targetId?: string): Command => ({ type: 'use_feature', actorId: 'A', feature, ...(targetId ? { targetId } : {}) });

describe('imza: kayıt ve kural', () => {
  it('11 alt sınıf kayıtta; Birlik Manastırı eski "baris-alani" kimliğiyle de bulunur', () => {
    expect(classData.subclasses.filter((s) => s.evKurali !== undefined)).toHaveLength(11);
    expect(findSubclass('cleric', 'baris-alani')?.id).toBe('imza_birlik');
  });
  it('kural kapalıyken (sürüm 77) ya da eski sürümde (22) özellik yok; 78+ kapı yok; Birlik Manastırı kuralsız ama sürüme bağlı', () => {
    // Görev AS2 (kural sürümü 78): ev kuralı kapısı yalnız 77 ve altı kayıt/replay için; 78+ kural kapalıyken de çalışır.
    for (const r of [arena(hero('ranger', 'imza_ciftci', 7), { on: false, kuralSurumu: 77 }), arena(hero('ranger', 'imza_ciftci', 7), { kuralSurumu: 22 })]) {
      expect(r.c('A').features?.some((f) => f.key.startsWith('imza:'))).toBeFalsy();
      expect(r.c('A').effects?.some((e) => e.id.startsWith('imza:'))).toBeFalsy();
    }
    expect(imzaOn({ houseRules: {}, kuralSurumu: 23 }, 'imza_birlik')).toBe(true);
    expect(imzaOn({ houseRules: {}, kuralSurumu: 22 }, 'imza_birlik')).toBe(false);
    expect(imzaOn({ houseRules: {}, kuralSurumu: 23 }, 'imza_ciftci')).toBe(false);
    expect(imzaOn({ houseRules: {}, kuralSurumu: 77 }, 'imza_ciftci')).toBe(false);
    expect(imzaOn({ houseRules: {}, kuralSurumu: 78 }, 'imza_ciftci')).toBe(true);
    expect(arena(hero('ranger', 'imza_ciftci', 7), { on: false }).c('A').features?.some((f) => f.key.startsWith('imza:'))).toBe(true);
  });
  it('her eylemin anahtarı veride ve alt sınıfı kayıtta', () => {
    for (const [key, s] of Object.entries(IMZA_SPECS)) {
      expect(key.startsWith(`imza:${s.sinif}/`)).toBe(true);
      expect(classData.subclasses.some((x) => x.id === s.sinif)).toBe(true);
    }
  });
});

describe('imza: alt sınıf eylemleri', () => {
  it('Çiftçi: Başak iyileştirir, Mantar zehirler ve yavaşlatır, Mantar Tutkunu zehir bağışıklığı; replay aynı', () => {
    const r = arena(hero('ranger', 'imza_ciftci', 7));
    expect(r.c('A').effects?.some((e) => e.immune?.includes('Poisoned'))).toBe(true);
    const n0 = r.c('A').resources.imzaUrun ?? 0;
    expect(n0).toBe(3);
    r.do(use('imza:imza_ciftci/grain', 'C'));
    expect(r.c('C').hp).toBeGreaterThan(10);
    r.state = { ...r.state, combatants: { ...r.state.combatants, A: { ...r.c('A'), economy: { ...r.c('A').economy, bonus: false } } } };
    r.do(use('imza:imza_ciftci/fungus', 'B'));
    expect(r.c('B').hp).toBeLessThan(60);
    expect(r.c('B').effects?.some((e) => e.name === 'Mantar' && e.speedMult === 0.5)).toBe(true);
    expect(r.c('A').resources.imzaUrun).toBe(n0 - 2);
    expect(replay(r.events)).toEqual(r.state);
  });
  it('İnfazcı: Hüküm hedefi işaretler; hükümlüye Sneak Attack isabetinde ek "Hüküm" hasarı', () => {
    const r = arena(hero('rogue', 'imza_infazci', 3));
    r.do(use('imza:imza_infazci/verdict', 'B'));
    expect(r.c('B').effects?.some((e) => e.name === 'Hükümlü')).toBe(true);
    const ev = r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: r.c('A').weaponOptions[0] as never }, () => 0.9)
      .find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>;
    if (ev.extra?.some((x) => x.label === 'Sneak Attack')) expect(ev.extra?.some((x) => x.label === 'Hüküm')).toBe(true);
  });
  it('İmparator: Buyruk dostu saldırtır; Hükümdar Sözü başarısız düşmana sana karşı dezavantaj', () => {
    // Kuyruk K54c: eski Hükümdar Sözü (yalnız sana dezavantaj) sürüm 23–27 savaşında; 28+ `royal-word-2` (k54cImparator.test).
    const r = arena(hero('fighter', 'imza_imparator', 7), { kuralSurumu: 27, ally: combatantFromSheet(sheet('fighter', 'champion', 3), { id: 'C', ownerId: 'p1' }) });
    const ev = r.do(use('imza:imza_imparator/decree', 'C'), () => 0.9);
    expect(ev.some((e) => e.type === 'attack_resolved' && e.actorId === 'C')).toBe(true);
    r.state = { ...r.state, combatants: { ...r.state.combatants, A: { ...r.c('A'), economy: { ...r.c('A').economy, bonus: false } } } };
    r.do(use('imza:imza_imparator/royal-word', 'B'), low);
    expect(r.c('B').effects?.some((e) => e.attackDisVs === 'A')).toBe(true);
  });
  it('Taht Varlığı: 10 ft içindeki dosta WIS kurtulma bonusu (aura senkronu)', () => {
    const r = arena(hero('fighter', 'imza_imparator', 7));
    expect(imzaAuraBonus(r.state, r.c('C'), 'wis')).toBe(1);
    expect(imzaAuraBonus(r.state, r.c('C'), 'dex')).toBe(0);
    expect(imzaAuraBonus(r.state, r.c('B'), 'wis')).toBe(0);
  });
  it('Dunganga: Ninni başarısızlara Uykulu, başaranlara Cesaret (aynı özelliğe bağışık)', () => {
    const r = arena(hero('sorcerer', 'imza_dunganga', 3), { foes: 2 });
    r.do(use('imza:imza_dunganga/lullaby'), low);
    expect(r.c('B').effects?.some((e) => e.name === 'Uykulu')).toBe(true);
    const r2 = arena(hero('sorcerer', 'imza_dunganga', 3), { b: { saves: { str: 30, dex: 30, con: 30, int: 30, wis: 30, cha: 30 } } });
    r2.do(use('imza:imza_dunganga/lullaby'), mid);
    expect(r2.c('B').effects?.some((e) => e.name === 'Cesaret')).toBe(true);
  });
  it('Astrolog: Kuyruklu Yıldız açık gökte çalışır, kapalı haritada (Derinlikler) çalışmaz', () => {
    const r = arena(hero('warlock', 'imza_astrolog', 10));
    expect(openSky(r.state)).toBe(true);
    r.do(use('imza:imza_astrolog/comet', 'B'), low);
    expect(r.c('B').hp).toBeLessThan(60);
    const closed = arena(hero('warlock', 'imza_astrolog', 10), { mapId: 'dungeon' });
    expect(closed.try(use('imza:imza_astrolog/comet', 'B')).ok).toBe(false);
  });
  it('Birlik Manastırı: Bağ Kurma, Teselli Nöbeti geçici can, Birlik Can Havuzu (havuz kurulur)', () => {
    const r = arena(hero('cleric', 'imza_birlik', 6));
    r.do(use('imza:imza_birlik/forge-bond'));
    expect(r.c('C').effects?.some((e) => e.name === 'Bağlı')).toBe(true);
    r.do(use('imza:imza_birlik/vigil'));
    expect(r.c('C').tempHp).toBe(6);
    r.state = { ...r.state, combatants: { ...r.state.combatants, A: { ...r.c('A'), economy: { ...r.c('A').economy, action: false } } } };
    r.do(use('imza:imza_birlik/shared-vitality'));
    expect(r.c('C').poolId).toBeTruthy();
    expect(r.c('A').poolId).toBe(r.c('C').poolId);
    expect(replay(r.events)).toEqual(r.state);
  });
  it('Şair: Övgü geçici can, Hiciv hasar + tek saldırı dezavantajı', () => {
    const r = arena(hero('bard', 'imza_sair', 3));
    r.do(use('imza:imza_sair/praise', 'C'));
    expect((r.c('C').tempHp ?? 0)).toBeGreaterThan(0);
    r.state = { ...r.state, combatants: { ...r.state.combatants, A: { ...r.c('A'), economy: { ...r.c('A').economy, bonus: false } } } };
    r.do(use('imza:imza_sair/satire', 'B'), low);
    expect(r.c('B').hp).toBeLessThan(60);
  });
  it('Bilge: Zihin Gücü başarısız hedefi iter; Çevik Yaşlı +10 ft', () => {
    const r = arena(hero('monk', 'imza_bilge', 11));
    const before = r.c('B').pos;
    r.do(use('imza:imza_bilge/mind-might', 'B'), low);
    expect(r.c('B').pos).not.toEqual(before);
    expect(r.c('A').effects?.some((e) => e.speedFt === 10)).toBe(true);
  });
  it('Geride Kalan: öfkedeyken silah isabetine Yıpranmışlığın Gücü eki', () => {
    const r = arena(hero('barbarian', 'imza_geride_kalan', 3, { weapons: [{ name: 'Greataxe' }] }));
    r.state = { ...r.state, combatants: { ...r.state.combatants, A: { ...r.c('A'), rage: { refreshed: true, added: [] } } } };
    const ev = r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: r.c('A').weaponOptions[0] as never }, () => 0.9)
      .find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>;
    expect(ev.extra?.some((x) => x.label === 'Yıpranmışlığın Gücü')).toBe(true);
  });
  it('Hızır (20) ve Harita (6): Yetişen Yol direnç, Zemin Yeniden Yaz yavaşlatma', () => {
    const p = arena(hero('paladin', 'imza_hizir', 20));
    p.do(use('imza:imza_hizir/hastening-road'));
    expect(p.c('C').effects?.some((e) => e.name === 'Yetişen Yol' && e.resist?.includes('fire'))).toBe(true);
    // Kuyruk K54b: eski tek kipli Zemin Yeniden Yaz yalnız sürüm 23–26 savaşında (27+ üç kip, k54bHarita.test).
    const w = arena(hero('wizard', 'imza_harita', 6), { kuralSurumu: 26 });
    w.do(use('imza:imza_harita/rewrite-the-ground', 'B'));
    expect(w.c('B').effects?.some((e) => e.speedMult === 0.5)).toBe(true);
  });
});
