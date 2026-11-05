/**
 * Y1 G2–G4: değerlendirici ve yeni davranışlar. Dost ateşinden kaçınma, tehlikeli altıgenden çıkma, yükseklik tercihi,
 * konsantrasyon kırma, kaynak tasarrufu, zorluk seçimi, replay, Game Master rolü, G3 açıklayıcıları (Cloud's Jaunt
 * kaçışı, iksir, Zihin Gücü kipleri, Yetişen Yol: Adım) ve kayıt.
 */
import { describe, expect, it } from 'vitest';
import { kitArena, o } from '../k54bKit';
import { bonusScored, chooseCommand, scoredCandidates } from '../ai';
import { execute } from '../commands';
import { replay } from '../reduce';
import { mk, GM, P1 } from '../fixtures';
import { seededRng } from '../../rules/dice';
import { distance } from '../../rules/hex';
import { actionDescriptors } from './actions';
import { pickByDifficulty, roleOf, scoreCommand, type Scored } from './evaluate';
import { previewCommand } from './preview';
import { combatantFromMonster } from '../index';
import { getMonster } from '../../data';
import type { BattleState, Combatant, Command } from '../types';

const bandit = (id: string, extra: Partial<Combatant> = {}) => mk(id, { side: 'enemies', hp: 40, maxHp: 40, monsterId: 'bandit', ...extra });
const set = (s: BattleState, id: string, patch: Partial<Combatant>): BattleState => ({ ...s, combatants: { ...s.combatants, [id]: { ...(s.combatants[id] as Combatant), ...patch } } });

describe('Y1 değerlendirici', () => {
  it('kayıt: eski kurallar ve G3 davranışları açıklayıcı olarak kayıtlı', () => {
    const ids = actionDescriptors().map((d) => d.id);
    for (const id of ['eski:alan', 'eski:zemin', 'eski:kontrol', 'eski:tek', 'eski:imzaIpucu', 'eski:saldiri', 'eski:coklu', 'g3:itme', 'g3:zihin', 'g3:yetenek']) expect(ids).toContain(id);
    expect(actionDescriptors().every((d) => d.note.length > 0)).toBe(true);
  });

  it('dost ateşi: dostu da içine alan Fireball cezalı; seçilen komut dosta hasar vermez', () => {
    const r = kitArena({ cls: 'sorcerer', sub: 'draconic-sorcery', level: 5, scores: { cha: 16 }, sheet: { spellNames: ['Fireball', 'Fire Bolt'] },
      extra: [bandit('E')], place: { A: o(2, 3), B: o(8, 3), E: o(8, 4), C: o(9, 3) } });
    const a = r.c('A');
    const h = scoredCandidates(r.state, a).helpers;
    const ff: Command = { type: 'cast_spell', actorId: 'A', spellName: 'Fireball', targetHex: o(8, 3) };
    const hit = scoreCommand(r.state, a, ff, h, 'hasarci');
    expect(hit.preview.friendlyFire).toBeGreaterThan(0);
    expect(hit.parts.dostAtesi ?? 0).toBeLessThan(0);
    const away = set(r.state, 'C', { pos: o(0, 8) });
    const clean = scoreCommand(away, away.combatants.A as Combatant, ff, scoredCandidates(away, away.combatants.A as Combatant).helpers, 'hasarci');
    expect(clean.score).toBeGreaterThan(hit.score);
    const cmd = chooseCommand(r.state);
    if (cmd.type === 'cast_spell') expect(previewCommand(r.state, cmd).friendlyFire).toBe(0);
  });

  it('tehlike: alev yüzeyinde duran yaratık önce daha güvenli altıgene yürür', () => {
    const r = kitArena({ cls: 'fighter', sub: 'champion', level: 3, sheet: { weapons: [{ name: 'Longsword' }] }, place: { A: o(3, 3), B: o(9, 3), C: o(0, 8) } });
    r.gm({ type: 'place_surface', kind: 'fire', hexes: [o(3, 3), o(4, 3), o(3, 4)] });
    const cmd = chooseCommand(r.state);
    expect(cmd.type).toBe('move');
    const to = cmd.type === 'move' ? cmd.to : o(3, 3);
    expect(r.state.map?.zones?.some((z) => z.hexes?.some((x) => x.col === to.col && x.row === to.row))).toBe(false);
  });

  it('yükseklik: menzilli saldırı yeri seçerken yüksek zemini tercih eder', () => {
    const r = kitArena({ cls: 'fighter', sub: 'champion', level: 3, scores: { dex: 16 }, sheet: { weapons: [{ name: 'Shortbow' }] }, place: { A: o(5, 4), B: o(6, 4), C: o(0, 8) } });
    const heights = Array.from({ length: 9 }, () => Array.from({ length: 15 }, () => 0));
    (heights[4] as number[])[3] = 2;
    r.state = { ...r.state, map: { ...(r.state.map as NonNullable<BattleState['map']>), heights, ruleToggles: { heightCombat: true, heightMove: false } } };
    const cmd = chooseCommand(r.state);
    expect(cmd.type).toBe('move');
    if (cmd.type === 'move') expect(cmd.to).toEqual(o(3, 4));
  });

  it('konsantrasyon: konsantre düşmana isabetin ek değeri var', () => {
    const r = kitArena({ cls: 'fighter', sub: 'champion', level: 3, sheet: { weapons: [{ name: 'Longsword' }] } });
    const opt = r.c('A').weaponOptions[0] as Combatant['weaponOptions'][number];
    const cmd: Command = { type: 'attack', actorId: 'A', targetId: 'B', option: opt };
    const h = scoredCandidates(r.state, r.c('A')).helpers;
    expect(scoreCommand(r.state, r.c('A'), cmd, h, 'hasarci').parts.konsantrasyon).toBeUndefined();
    const conc = set(r.state, 'B', { concentration: { spell: 'Bless', spellId: 'bless' } as unknown as Combatant['concentration'] });
    expect(scoreCommand(conc, conc.combatants.A as Combatant, cmd, h, 'hasarci').parts.konsantrasyon).toBeGreaterThan(0);
  });

  it('kaynak tasarrufu: 2 canlı düşmana slot harcanmaz', () => {
    const r = kitArena({ cls: 'sorcerer', sub: 'draconic-sorcery', level: 5, scores: { cha: 16 }, sheet: { spellNames: ['Fire Bolt', 'Chromatic Orb', 'Scorching Ray'] },
      enemy: { hp: 2, maxHp: 40 }, place: { A: o(3, 3), B: o(7, 3) } });
    const cmd = chooseCommand(r.state);
    const p = previewCommand(r.state, cmd);
    expect(p.spent.slots.length).toBe(0);
  });

  it('zorluk: Kolay en iyiyi yaklaşık %60, Normal hep, Usta ileri bakışla', () => {
    const r = kitArena({ cls: 'fighter', sub: 'champion', level: 3 });
    const a = r.c('A');
    const mkS = (score: number, id: string) => ({ cmd: { type: 'end_turn', actorId: id }, desc: { id, kind: 'utility', note: id, gen: () => [] }, score, parts: {}, preview: previewCommand(r.state, { type: 'end_turn', actorId: 'A' }) }) as unknown as Scored;
    const list = [mkS(10, 'a'), mkS(8, 'b'), mkS(6, 'c'), mkS(4, 'd')];
    let best = 0;
    for (let round = 1; round <= 200; round++) if (pickByDifficulty({ ...r.state, round }, a, list, 'kolay')?.desc.id === 'a') best++;
    expect(best / 200).toBeGreaterThan(0.45);
    expect(best / 200).toBeLessThan(0.75);
    expect(pickByDifficulty(r.state, a, list, 'normal')?.desc.id).toBe('a');
    const follow = (cmd: Command) => ((cmd as { actorId: string }).actorId === 'b' ? 20 : 0);
    expect(pickByDifficulty(r.state, a, list, 'usta', follow)?.desc.id).toBe('b');
  });

  it('replay: yapay zekâ kararları olay değil; olaylar baştan oynatılınca aynı durum', () => {
    const r = kitArena({ cls: 'fighter', sub: 'champion', level: 3, sheet: { weapons: [{ name: 'Longsword' }] }, enemy: { hp: 30, maxHp: 30 }, place: { A: o(3, 3), B: o(6, 3), C: o(0, 8) } });
    const rng = seededRng(7);
    let s = r.state;
    const events = [...r.events];
    for (let i = 0; i < 80 && s.status === 'active'; i++) {
      const cmd = chooseCommand(s);
      const actor = s.combatants[(cmd as { actorId?: string }).actorId ?? ''];
      const x = execute(s, cmd, actor && actor.side === 'enemies' ? GM : P1, rng);
      if (!x.ok) break;
      s = x.state; events.push(...x.events);
    }
    expect(JSON.stringify(replay(events))).toBe(JSON.stringify(s));
  });

  it('Game Master rolü: set_ai_role atar, veriden türetmeyi geçersiz kılar; oyuncu atayamaz', () => {
    const r = kitArena({ cls: 'fighter', sub: 'champion', level: 3 });
    expect(execute(r.state, { type: 'set_ai_role', targetId: 'B', role: 'destek' }, P1, () => 0.5).ok).toBe(false);
    r.gm({ type: 'set_ai_role', targetId: 'B', role: 'destek' });
    expect(roleOf(r.c('B'))).toBe('destek');
    r.gm({ type: 'set_ai_role', targetId: 'B', role: null });
    expect(r.c('B').aiRole).toBeUndefined();
  });
});

describe('Y1 G3 davranışları', () => {
  it("Cloud's Jaunt: yarı canın altında, bitişik düşmandan uzağa ışınlanma adayı", () => {
    const ogre = combatantFromMonster(getMonster('ogre'), { id: 'O' });
    const r = kitArena({ cls: 'wizard', sub: 'evoker', level: 5, sheet: { raceId: 'goliath', lineageId: 'cloud' }, extra: [ogre], place: { A: o(5, 4), O: o(6, 4), B: o(14, 0), C: o(0, 8) } });
    r.state = set(r.state, 'A', { hp: 5 });
    const { scored } = bonusScored(r.state, r.c('A'));
    const jaunt = scored.find((x) => x.cmd.type === 'use_feature' && x.cmd.feature === 'species:goliath/clouds-jaunt');
    expect(jaunt).toBeTruthy();
    expect(jaunt?.score).toBeGreaterThan(0);
    const to = jaunt?.cmd.type === 'use_feature' ? jaunt.cmd.to : undefined;
    expect(to && distance(to, o(6, 4))).toBeGreaterThan(1);
  });

  it('iksir: yaralı yaratık iyileştirme iksirini bonus eylemle içer', () => {
    const r = kitArena({ cls: 'wizard', sub: 'evoker', level: 3, place: { A: o(3, 3), B: o(10, 3), C: o(0, 8) } });
    r.state = set(r.state, 'A', { hp: 4, consumables: { 'potion-of-healing': 1 } });
    const { scored } = bonusScored(r.state, r.c('A'));
    const pot = scored.find((x) => x.cmd.type === 'use_item');
    expect(pot?.score).toBeGreaterThan(0);
    expect(scored[0]?.cmd.type).toBe('use_item');
  });

  it('Zihin Gücü: İt, Çek ve Yana kaydır ayrı adaylar; puanla seçilir', () => {
    const r = kitArena({ cls: 'monk', sub: 'imza_bilge', level: 5, kuralSurumu: 28, place: { A: o(3, 3), B: o(5, 3), C: o(0, 8) } });
    const keys = bonusScored(r.state, r.c('A')).scored.map((x) => (x.cmd.type === 'use_feature' ? x.cmd.feature : ''));
    for (const k of ['mind-might', 'mind-pull', 'mind-slide']) expect(keys).toContain(`imza:imza_bilge/${k}`);
  });
});
