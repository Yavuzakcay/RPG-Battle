/**
 * Görev Y4: simülasyon "zincir" kipi. Aynı parti bir yolculuk güzergâhını (Görev Y1) yolculuk motoruyla oynar: her
 * savaş durağında yapay zekâ savaşı, aralarda kural tabanlı dinlenme kararı (yaralı varsa kısa dinlenme, hak varsa;
 * dinlenme yerinde süre uygunsa uzun dinlenme; çok yaralıya iksir). Ölçülen: zinciri bitirme, durak başına ölüm ve
 * düşme, kaynak tüketimi (kalan slot ve HP zarı oranı). Hedef (TASARIM): 3. seviye, 3 savaş, %70–85 bitirme.
 */
import { execute } from '../battle';
import { fullStatus } from '../rules/characterRest';
import { autoShortRestDice, executeJourney, longRestBlock, shortRestsLeft } from '../journey/engine';
import type { Difficulty, JourneyCommand, JourneyRoute, JourneyState } from '../journey/types';
import { battleResultCommand, journeyBattleSession } from '../app/journeyBattle';
import { partyAt, playBattle, seeded, type PartyKind } from './balance';

export interface ChainResult {
  finished: boolean;
  /** Kazanılan savaş sayısı. */
  battlesWon: number;
  deaths: number[];
  downs: number[];
  /** Zincir sonunda kalan slot ve HP zarı oranı (0–1, sağ kalanların ortalaması). */
  slotsLeft: number;
  hitDiceLeft: number;
  shortRests: number;
  longRests: number;
}

const GM = { playerId: 'gm', isGm: true };

export function simulateChain(route: JourneyRoute, seed: number, kind: PartyKind, difficulty: Difficulty = 'normal'): ChainResult {
  const rng = seeded(seed);
  const sheets = partyAt(route.level, kind);
  let j: JourneyState | null = null;
  const run = (cmd: JourneyCommand): boolean => {
    const r = executeJourney(j, cmd, rng);
    if (r.ok) j = r.state;
    return r.ok;
  };
  run({ type: 'start', id: `zincir-${seed}`, route, seed, difficulty, progression: 'milestone',
    party: sheets.map((sh, i) => ({ id: `p${i + 1}`, name: sh.name, sheet: sh })) });
  const out: ChainResult = { finished: false, battlesWon: 0, deaths: [], downs: [], slotsLeft: 0, hitDiceLeft: 0, shortRests: 0, longRests: 0 };
  for (let guard = 0; guard < 40 && j && !(j as JourneyState).result; guard++) {
    const s = j as JourneyState;
    const stop = s.route.stops[s.stop];
    if (stop?.kind === 'battle' && !s.stopDone) {
      // İçmeden önce: çok yaralıya iksir (yarı HP'nin altı).
      for (const m of s.party) if (!m.status.dead && m.status.hp > 0 && m.status.hp < fullStatus(m.sheet).hp / 2 && (j as JourneyState).potions > 0) run({ type: 'drink_potion', memberId: m.id });
      const session = journeyBattleSession(j as JourneyState, rng);
      if (!session) break;
      const begun = execute(session.state, { type: 'start_battle' }, GM, rng);
      if (!begun.ok) break;
      const final = playBattle(begun.state, rng);
      const before = (j as JourneyState).party.filter((m) => !m.status.dead).length;
      run(battleResultCommand(j as JourneyState, final));
      const after = j as JourneyState;
      out.deaths.push(before - after.party.filter((m) => !m.status.dead).length);
      out.downs.push(after.party.filter((m) => !m.status.dead && m.status.hp <= 0).length);
      if (after.stopDone && !after.result && final.winner === 'party') out.battlesWon++;
      if (after.result === 'won') out.battlesWon++;
      continue;
    }
    // Kuyruk 18 V3: ödül durağı: ganimeti al (son duraksa sefer biter).
    if (stop?.kind === 'reward' && !s.stopDone) { run({ type: 'claim_reward' }); continue; }
    // Dinlenme kararı: dinlenme yerinde uzun (süre uygunsa), değilse yaralı varsa kısa (hak varsa).
    if (stop?.kind === 'rest' && !longRestBlock(s)) { if (run({ type: 'long_rest' })) out.longRests++; }
    const hurt = s.party.some((m) => !m.status.dead && m.status.hp < fullStatus(m.sheet).hp * 0.7);
    if (hurt && shortRestsLeft(j as JourneyState) !== 0) {
      const dice = autoShortRestDice(j as JourneyState);
      if (run({ type: 'short_rest', dice })) out.shortRests++;
    }
    if (!run({ type: 'advance' })) break;
  }
  const end = j as JourneyState | null;
  out.finished = end?.result === 'won';
  const living = (end?.party ?? []).filter((m) => !m.status.dead);
  const frac = (a: number, b: number) => (b > 0 ? a / b : 1);
  out.slotsLeft = living.length ? living.reduce((n, m) => n + frac(m.status.slots.reduce((x, y) => x + y, 0), fullStatus(m.sheet).slots.reduce((x, y) => x + y, 0)), 0) / living.length : 0;
  out.hitDiceLeft = living.length ? living.reduce((n, m) => n + frac(m.sheet.level - m.status.hitDiceSpent, m.sheet.level), 0) / living.length : 0;
  return out;
}
