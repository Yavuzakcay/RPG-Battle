/**
 * Kuyruk K59 Görev 2 (K58 ile gelenler): önizleme kartı (`movePreview`) sayıları gerçek çözücüyle tutarlı (1000 vuruş),
 * keşif modunda sonuç sızıntısı yok (kartın her alanı tepkimesiz çözümden), fırsat saldırılı yürüyüşte çentik ve
 * dokun-önizle / dokun-onayla akışı (`moveTap`).
 */
import { describe, expect, it } from 'vitest';
import { kitArena, o } from '../../battle/k54bKit';
import { GM, P1 } from '../../battle/fixtures';
import { execute } from '../../battle/commands';
import { seededRng } from '../../rules/dice';
import type { AttackOption, BattleState, Combatant, Command } from '../../battle/types';
import { DEFAULT_SETTINGS, emptyStore } from '../../app/discovery';
import { movePreview, moveTap } from './movePreview';

const patch = (s: BattleState, id: string, p: Partial<Combatant>): BattleState => ({ ...s, combatants: { ...s.combatants, [id]: { ...(s.combatants[id] as Combatant), ...p } } });
const pool = (c: Combatant | undefined) => (c ? Math.max(0, c.hp) + (c.tempHp ?? 0) : 0);
/** Binom oranı için 4 standart hata payı. */
const near = (obs: number, p: number, n: number) => Math.abs(obs - p) <= 4 * Math.sqrt(Math.max(p * (1 - p), 1e-4) / n) + 0.005;

describe('K59: önizleme kartı ↔ gerçek çözücü (1000 vuruş)', () => {
  it('silah saldırısı (avantajlı, yerdeki hedef): isabet, kritik, beklenen hasar', () => {
    const r = kitArena({ cls: 'fighter', sub: 'champion', level: 5, scores: { str: 16 }, sheet: { weapons: [{ name: 'Longsword' }] }, enemy: { ac: 16, hp: 500, maxHp: 500 } });
    let s = patch(r.state, 'B', { conditions: ['Prone'] });
    s = patch(s, 'A', { resources: { ...r.c('A').resources, heroicInspiration: 0 } });
    const opt = (s.combatants.A!.weaponOptions.find((w) => /Longsword/i.test(w.label)) ?? s.combatants.A!.weaponOptions[0]) as AttackOption;
    const cmd: Command = { type: 'attack', actorId: 'A', targetId: 'B', option: opt };
    const card = movePreview(s, cmd, P1, emptyStore(), DEFAULT_SETTINGS);
    const line = card.lines.find((l) => l.id === 'B')!;
    expect(line.reasons.join(' ')).toMatch(/advantage/);
    const rng = seededRng(59);
    const N = 1000;
    let hits = 0, crits = 0, dmg = 0;
    for (let i = 0; i < N; i++) {
      const x = execute(s, cmd, P1, rng);
      if (!x.ok) throw new Error(x.error);
      const ev = x.events.find((e) => e.type === 'attack_resolved');
      if (ev?.type === 'attack_resolved' && ev.hit) { hits++; if (ev.critical) crits++; }
      dmg += pool(s.combatants.B) - pool(x.state.combatants.B);
    }
    expect(near(hits / N, line.hitP ?? 0, N), `isabet ${hits / N} ~ ${line.hitP}`).toBe(true);
    expect(near(crits / N, line.critP ?? 0, N), `kritik ${crits / N} ~ ${line.critP}`).toBe(true);
    expect(Math.abs(dmg / N - line.damage.avg) / line.damage.avg).toBeLessThan(0.06);
    expect(line.damage.max).toBeGreaterThanOrEqual(line.damage.min);
  });
  it('save büyüsü: kurtulma olasılığı, DC, beklenen hasar; öldürme olasılığı düşük canlı hedefte', () => {
    for (const hp of [500, 8]) {
      const r = kitArena({ cls: 'cleric', sub: 'life-domain', level: 5, scores: { wis: 16 }, enemy: { hp, maxHp: 500 }, place: { B: o(6, 3) } });
      const s = patch(r.state, 'A', { spellNames: ['Sacred Flame'] });
      const cmd: Command = { type: 'cast_spell', actorId: 'A', spellName: 'Sacred Flame', targetId: 'B' };
      const card = movePreview(s, cmd, P1, emptyStore(), DEFAULT_SETTINGS);
      expect(card.ok).toBe(true);
      const line = card.lines.find((l) => l.id === 'B')!;
      expect(line.dc).toBe(s.combatants.A!.spellSaveDc);
      const rng = seededRng(hp);
      const N = 1000;
      let saved = 0, dmg = 0, kills = 0;
      for (let i = 0; i < N; i++) {
        const x = execute(s, cmd, P1, rng);
        if (!x.ok) throw new Error(x.error);
        const ev = x.events.find((e) => e.type === 'save_resolved');
        if (ev?.type === 'save_resolved' && ev.success) saved++;
        dmg += pool(s.combatants.B) - pool(x.state.combatants.B);
        if (pool(x.state.combatants.B) <= 0) kills++;
      }
      expect(near(saved / N, line.saveP ?? 0, N), `save ${saved / N} ~ ${line.saveP}`).toBe(true);
      expect(Math.abs(dmg / N - line.damage.avg) / Math.max(1, line.damage.avg)).toBeLessThan(0.06);
      // Öldürme olasılığı iki noktalı yaklaşım (zar toplamının %25/%75 yüzdeliği; K59): ±0,2.
      expect(Math.abs(kills / N - line.killP), `öldürme ${kills / N} ~ ${line.killP}`).toBeLessThanOrEqual(0.2);
    }
  });
});

describe('K59: keşif modunda sonuç sızıntısı yok', () => {
  it('keşfedilmemiş tepkimede kartın her sayısı tepkimesiz çözümden; ham önizlemede tepkime izi yok', () => {
    const r = kitArena({ cls: 'wizard', sub: 'evoker', level: 5, place: { A: o(1, 3), B: o(5, 3), C: o(0, 0) }, enemy: { hp: 200, maxHp: 200 } });
    let s = patch(r.state, 'A', { spellNames: ['Fire Bolt'], spellAttack: 30 });
    const placed = execute(s, { type: 'place_surface', kind: 'oil', hexes: [o(5, 3), o(6, 3)] } as Command, GM, () => 0.5);
    if (!placed.ok) throw new Error(placed.error);
    s = placed.state;
    const cmd = { type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetId: 'B' } as Command;
    const hidden = movePreview(s, cmd, P1, emptyStore(), DEFAULT_SETTINGS);
    const blind = movePreview({ ...s, yuzeyEtkilesimi: false }, cmd, P1, emptyStore(), DEFAULT_SETTINGS, true);
    expect(hidden.mystery).toBe(true);
    expect(hidden.reactions).toEqual([]);
    expect(JSON.stringify(hidden.lines)).toBe(JSON.stringify(blind.lines));
    expect(hidden.friendlyFire).toBe(blind.friendlyFire);
    expect(hidden.selfDamage).toBe(blind.selfDamage);
    expect(hidden.raw.events.some((e) => e.type === 'surface_reacted')).toBe(false);
    expect(hidden.raw.triggers.filter((t) => !t.startsWith('zone:'))).toEqual([]);
    // Game Master aynı komutta tepkimeyi görür (kıyas: sızıntı testi boş değil).
    const gm = movePreview(s, cmd, P1, emptyStore(), DEFAULT_SETTINGS, true);
    expect(gm.raw.events.some((e) => e.type === 'surface_reacted')).toBe(true);
  });
});

describe('K59: fırsat saldırılı yürüyüş — çentik ve onay akışı', () => {
  const club: AttackOption = { label: 'Sopa', attackBonus: 5, damage: '1d6+2', damageType: 'bludgeoning', ranged: false, spell: false, tag: 'y' };
  const arena = () => kitArena({ cls: 'fighter', sub: 'champion', level: 5, place: { A: o(3, 3), B: o(4, 3), C: o(0, 0) }, enemy: { weaponOptions: [club], hp: 50, maxHp: 50 } });
  it('ilk dokunuş önizleme (çentik terk edilen altıgende), aynı altıgene ikinci dokunuş yürür; başka altıgen yeni önizleme', () => {
    const r = arena();
    const pv = (to: { col: number; row: number }) => () => movePreview(r.state, { type: 'move', actorId: 'A', to } as Command, P1, emptyStore(), DEFAULT_SETTINGS);
    const first = moveTap(null, o(1, 3), true, pv(o(1, 3)));
    expect(first.kind).toBe('aim');
    if (first.kind !== 'aim') return;
    expect(first.pv.opportunity[0]?.at).toEqual(o(3, 3));
    expect(moveTap({ to: o(1, 3) }, o(1, 3), true, () => { throw new Error('ikinci dokunuşta önizleme yok'); }).kind).toBe('run');
    expect(moveTap({ to: o(1, 3) }, o(1, 4), true, pv(o(1, 4))).kind).toBe('aim');
  });
  it('fırsat saldırısı yoksa, önizleme kapalıysa ya da keşif modunda tek dokunuş yürür', () => {
    const r = kitArena({ cls: 'fighter', sub: 'champion', level: 5, place: { A: o(3, 3), B: o(12, 3), C: o(0, 0) }, enemy: { weaponOptions: [club], hp: 50, maxHp: 50 } });
    const safe = moveTap(null, o(3, 4), true, () => movePreview(r.state, { type: 'move', actorId: 'A', to: o(3, 4) } as Command, P1, emptyStore(), DEFAULT_SETTINGS));
    expect(safe.kind).toBe('run');
    expect(moveTap(null, o(1, 3), false, () => { throw new Error('kapalıyken önizleme yok'); }).kind).toBe('run');
  });
  it('önizleme durumu değiştirmez; onaylanan yürüyüşte fırsat saldırısı gerçekten olur', () => {
    const r = arena();
    const before = JSON.stringify(r.state);
    const cmd = { type: 'move', actorId: 'A', to: o(1, 3) } as Command;
    const pv = movePreview(r.state, cmd, P1, emptyStore(), DEFAULT_SETTINGS);
    expect(JSON.stringify(r.state)).toBe(before);
    const x = execute(r.state, cmd, P1, () => 0.5);
    expect(x.ok).toBe(true);
    if (x.ok) expect(x.events.some((e) => e.type === 'attack_resolved' && e.opportunity && e.actorId === pv.opportunity[0]?.attackerId)).toBe(true);
  });
});
