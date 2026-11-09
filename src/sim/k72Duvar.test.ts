/**
 * Kuyruk K72: duvarlı 6 haritada hızlı ölçüm (sürüm 59 ↔ 60; denge ayarı yok, yalnız rapor). Kale avlusu, Kale Baskını, Ork
 * Kampı, Kale İç Avlusu, Hapishane Dış Halka, Kasaba Hanı (3. seviye standart parti). Her tohumda iki sürüm aynı tohumla
 * oynanır: parti kazancı, ortalama tur, tırmanma kontrolü sayısı (tutan/toplam), düşme. Çökme ya da kilitlenme olmamalı.
 * Tohum sayısı varsayılan 1; ölçüm `K72_DUVAR=50` (PowerShell: `$env:K72_DUVAR=50; npx vitest run src/sim/k72Duvar.test.ts`).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { setDefaultRuleVersion } from '../battle/create';
import { CURRENT_RULES } from '../battle/ruleVersion';
import { execute } from '../battle/index';
import { chooseCommand } from '../battle/ai';
import { currentActorId } from '../battle/common';
import { contextFor } from '../ui/session';
import { SCENARIOS, seeded, setupBattle } from './balance';
import type { Rng } from '../rules/dice';
import type { BattleState, Command } from '../battle/types';

declare const process: { env: Record<string, string | undefined> };
const SEEDS = Number(process.env.K72_DUVAR ?? 1);
const IDS = ['kale-avlu-savunma', 'kale-baskini', 'orman-ork', 'k34-kale-ic-avlu', 'k36-dis-halka', 'k34-kasaba-han'];

afterEach(() => setDefaultRuleVersion(CURRENT_RULES));

interface Run { win: boolean; rounds: number; climbs: number; held: number; falls: number }

function play(start: BattleState, rng: Rng, maxRounds = 20): Run {
  let state = start;
  const out = { climbs: 0, held: 0, falls: 0 };
  const apply = (cmd: Command): boolean => {
    const actorId = 'actorId' in cmd ? cmd.actorId : '';
    const r = execute(state, cmd, contextFor(state, actorId), rng);
    if (!r.ok) return false;
    for (const e of r.events) {
      if (e.type === 'map_effect' && e.rule === 'climb') { out.climbs++; if (e.roll?.success) out.held++; }
      if (e.type === 'map_effect' && e.rule === 'fall') out.falls++;
    }
    state = r.state;
    return true;
  };
  for (let guard = 0; guard < 2000 && state.status === 'active' && state.round <= maxRounds; guard++) {
    const actorId = currentActorId(state);
    for (let step = 0; step < 12; step++) {
      const cmd = chooseCommand(state);
      if (cmd.type === 'end_turn' || !apply(cmd)) break;
      if (state.status !== 'active' || currentActorId(state) !== actorId) break;
    }
    if (state.status === 'active' && currentActorId(state) === actorId) apply({ type: 'end_turn', actorId });
  }
  return { win: state.winner === 'party', rounds: state.round, ...out };
}

function measure(id: string, ver: number): Run[] {
  setDefaultRuleVersion(ver);
  const s = SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`senaryo yok: ${id}`);
  const runs: Run[] = [];
  for (let seed = 1; seed <= SEEDS; seed++) {
    const rng = seeded(seed);
    runs.push(play(setupBattle(s, rng, 3), rng));
  }
  return runs;
}

describe('K72 duvarlı 6 harita (59 ↔ 60, rapor)', () => {
  for (const id of IDS) {
    it(`${id}: ${SEEDS} tohum çökmeden; satır`, () => {
      const rows = [59, 60].map((v) => {
        const r = measure(id, v);
        const n = r.length;
        const sum = (f: (x: Run) => number) => r.reduce((a, x) => a + f(x), 0);
        return { v, win: sum((x) => (x.win ? 1 : 0)) / n, rounds: sum((x) => x.rounds) / n, climbs: sum((x) => x.climbs), held: sum((x) => x.held), falls: sum((x) => x.falls) };
      });
      console.log(`K72-DUVAR ${id} | ${rows.map((x) => `v${x.v}: kazanç %${(x.win * 100).toFixed(0)}, tur ${x.rounds.toFixed(1)}, tırmanma ${x.held}/${x.climbs}, düşme ${x.falls}`).join(' | ')}`);
      expect(rows[1]?.win).toBe(rows[0]?.win);
    }, 1_800_000);
  }
});
