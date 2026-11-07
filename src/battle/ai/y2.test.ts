/**
 * Y2: Y1 regresyon düzeltmeleri. Tur içi ileri-geri yürüme yok (Mağara, karanlık), sağlıklı yakın dövüşçü yaklaşır
 * (kendini koruma can oranına bağlı), kovalama savaşı bitirir, önbellekli karar önbelleksizle aynı, Usta öldürmeyi
 * garantiler, Trol uzvu kimlik çakışması sırayı kilitlemez.
 */
import { describe, expect, it } from 'vitest';
import { kitArena, o } from '../k54bKit';
import { chooseCommand, scoredCandidates } from '../ai';
import { execute } from '../commands';
import { currentActorId } from '../common';
import { GM, P1, mk } from '../fixtures';
import { seededRng } from '../../rules/dice';
import { distance } from '../../rules/hex';
import { difficultyNote, scoreCommand } from './evaluate';
import { SCENARIOS, setupBattle, seeded } from '../../sim/balance';
import { contextFor } from '../../ui/session';
import type { BattleState, Combatant, Command } from '../types';

const set = (s: BattleState, id: string, patch: Partial<Combatant>): BattleState => ({ ...s, combatants: { ...s.combatants, [id]: { ...(s.combatants[id] as Combatant), ...patch } } });

/** Senaryoyu `rounds` tur oynar; tur içi aynı altıgene dönüşleri sayar. */
function play(id: string, seed: number, rounds: number, each?: (s: BattleState) => void) {
  const sc = SCENARIOS.find((x) => x.id === id);
  if (!sc) throw new Error(id);
  const rng = seeded(seed);
  let state = setupBattle(sc, rng, 5);
  let back = 0;
  for (let g = 0; g < 600 && state.status === 'active' && state.round <= rounds; g++) {
    const actor = currentActorId(state);
    const seen = new Set<string>();
    const p0 = state.combatants[actor]?.pos;
    if (p0) seen.add(`${p0.col},${p0.row}`);
    for (let step = 0; step < 12; step++) {
      each?.(state);
      const cmd = chooseCommand(state);
      if (cmd.type === 'end_turn') break;
      const r = execute(state, cmd, contextFor(state, actor), rng);
      if (!r.ok) break;
      state = r.state;
      const p = state.combatants[actor]?.pos;
      if ((cmd.type === 'move' || cmd.type === 'shift_move' || cmd.type === 'jump') && p) {
        const k = `${p.col},${p.row}`;
        if (seen.has(k)) back++;
        seen.add(k);
      }
      if (state.status !== 'active' || currentActorId(state) !== actor) break;
    }
    if (state.status === 'active' && currentActorId(state) === actor) {
      const r = execute(state, { type: 'end_turn', actorId: actor } as Command, contextFor(state, actor), rng);
      if (r.ok) state = r.state;
    }
  }
  return { state, back };
}

describe('Y2 G1: savaşı bitirememe', () => {
  it('Mağara (karanlık): tur içinde iki altıgen arasında ileri-geri yürüme yok', () => {
    // Y1'de 25 tohumda 264 dönüş vardı (kötü koşul / daha iyi yer karşılaştırması iki ayrı seçiciyle).
    const { back } = play('magara', 1, 4);
    expect(back).toBe(0);
  }, 120_000);

  it('Mağara: savaş 20 tur sınırına takılmadan biter (tohum 1–2)', () => {
    for (const seed of [1, 2]) {
      const { state } = play('magara', seed, 20);
      expect(state.status, `tohum ${seed}`).toBe('finished');
    }
  }, 240_000);

  it('kendini koruma can oranına bağlı: tam canda yaklaşmak cezasız, düşük canda cezalı', () => {
    const r = kitArena({ cls: 'fighter', sub: 'champion', level: 3, sheet: { weapons: [{ name: 'Longsword' }] }, place: { A: o(3, 4), B: o(9, 4), C: o(0, 8) } });
    const a = r.c('A');
    const h = scoredCandidates(r.state, a).helpers;
    const step: Command = { type: 'move', actorId: 'A', to: o(8, 4) };
    expect(scoreCommand(r.state, a, step, h, 'hasarci').parts.korunma ?? 0).toBe(0);
    const hurt = set(r.state, 'A', { hp: 2 });
    expect(scoreCommand(hurt, hurt.combatants.A as Combatant, step, h, 'hasarci').parts.korunma ?? 0).toBeLessThan(0);
  });

  it('kovalama: uzaktaki düşmana her tur yaklaşır ve savaş biter', () => {
    const r = kitArena({ cls: 'fighter', sub: 'champion', level: 5, sheet: { weapons: [{ name: 'Longsword' }] },
      enemy: { hp: 30, maxHp: 30, speed: 30 }, place: { A: o(0, 4), B: o(14, 4), C: o(0, 8) } });
    let s: BattleState = set(r.state, 'C', { hp: 0, life: 'dead' });
    const rng = seededRng(3);
    let closest = 99;
    for (let i = 0; i < 300 && s.status === 'active' && s.round <= 12; i++) {
      const cmd = chooseCommand(s);
      const actor = s.combatants[(cmd as { actorId?: string }).actorId ?? ''];
      const x = execute(s, cmd, actor?.side === 'enemies' ? GM : P1, rng);
      if (!x.ok) break;
      s = x.state;
      const A = s.combatants.A, B = s.combatants.B;
      if (A?.pos && B?.pos) closest = Math.min(closest, distance(A.pos, B.pos));
    }
    expect(closest).toBeLessThanOrEqual(1);
    expect(s.status).toBe('finished');
  });

  it('Trol uzvu: aynı turda ikinci uzuv ayrı kimlik alır (sıra kilitlenmez)', () => {
    // Y1'de Mağara tohum 3: aynı turda iki uzuv aynı kimlikle çağrıldı, sırada iki kez yer aldı, tur ilerlemedi.
    const { state } = play('magara', 3, 20);
    expect(state.status).toBe('finished');
    const ids = state.order;
    expect(new Set(ids).size).toBe(ids.length);
  }, 120_000);
});

describe('Y2 G2: önbellek ve aynı karar', () => {
  it('önbellekli karar, soğuk (kopyalanmış) durumdaki kararla aynı', () => {
    let n = 0;
    play('kale', 1, 2, (s) => {
      if (n++ % 3) return;
      const warm = chooseCommand(s);
      const again = chooseCommand(s);
      const cold = chooseCommand(structuredClone(s));
      expect(JSON.stringify(again)).toBe(JSON.stringify(warm));
      expect(JSON.stringify(cold)).toBe(JSON.stringify(warm));
    });
    expect(n).toBeGreaterThan(20);
  }, 240_000);
});

describe('Y2 G3: Usta', () => {
  it('öldürme garantisi: Usta tek vuruşta düşecek hedefe vurur (kesin terimi)', () => {
    const weak = mk('W', { side: 'enemies', hp: 3, maxHp: 40, monsterId: 'bandit' });
    const r = kitArena({ cls: 'fighter', sub: 'champion', level: 5, sheet: { weapons: [{ name: 'Longsword' }] },
      extra: [weak], place: { A: o(5, 4), B: o(6, 4), W: o(4, 4), C: o(0, 8) } });
    const s: BattleState = { ...r.state, yz: { zorluk: { party: 'usta' } } };
    const { scored } = scoredCandidates(s, s.combatants.A as Combatant);
    const top = scored[0];
    expect((top?.cmd as { targetId?: string }).targetId).toBe('W');
    expect(top?.parts.kesin ?? 0).toBeGreaterThan(0);
    // Normal'de Usta terimleri yok.
    const n = scoredCandidates(r.state, r.c('A')).scored[0];
    expect(n?.parts.kesin).toBeUndefined();
  });

  it('Usta deneysel etiketli ve açıklaması dürüst (K59 ölçümü: parti tarafında güçlü, düşman tarafında az)', () => {
    const n = difficultyNote('usta');
    expect(n?.experimental).toBe(true);
    expect(n?.text).toMatch(/parti tarafında Normal'den güçlü/);
    expect(difficultyNote('usta', 'en')?.text).toMatch(/stronger than Normal on the party side/);
    expect(difficultyNote('normal')).toBeNull();
  });
});
