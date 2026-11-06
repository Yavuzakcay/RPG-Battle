/**
 * Kuyruk K58 G5: imza alt sınıf eylemleri yapay zekâda kullanılıyor mu (büyüye karşı)? Alt sınıf başına imza
 * eylemi (`use_feature` `imza:`), büyü (`cast_spell`) ve saldırı sayısı (imza karakterinin komutları).
 *   npx vite-node src/sim/k58ImzaKullanim.ts -- 10 [--seviye 7]
 */
import { loadTrExtra } from '../i18n';
import { classData, loadClassData, loadMonsters } from '../data';
await Promise.all([loadMonsters(), loadClassData(), loadTrExtra()]);
const { SCENARIOS, setupBattle, seeded, setPartyKind, setPartySubclass, setSimHouseRules, roundLimit } = await import('./balance');
const { execute } = await import('../battle/commands');
const { chooseCommand } = await import('../battle/ai');
const { contextFor } = await import('../ui/session');
import type { Command } from '../battle/types';

declare const process: { argv: string[] };
const args = process.argv.slice(2).filter((a) => a !== '--');
const opt = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const runs = Number(args.find((a, i) => /^\d+$/.test(a) && !(args[i - 1] ?? '').startsWith('--')) ?? 10);
const level = Number(opt('--seviye') ?? 7);
const scen = ['col', 'kale', 'magara', 'orman'].map((id) => SCENARIOS.find((s) => s.id === id)).filter((s): s is NonNullable<typeof s> => !!s);
console.log(`| Alt sınıf | imza eylemi | büyü | saldırı | imza/savaş |`);
console.log(`|---|---|---|---|---|`);
for (const sub of classData.subclasses.filter((s) => s.ev && s.id.startsWith('imza_'))) {
  setPartyKind(`k18-${sub.class}`);
  setSimHouseRules(sub.evKurali ? { [sub.evKurali]: true } : {});
  setPartySubclass({ classId: sub.class, subclassId: sub.id });
  let imza = 0, cast = 0, atk = 0, n = 0;
  for (const sc of scen) for (let seed = 1; seed <= runs; seed++) {
    const rng = seeded(seed);
    let state = setupBattle(sc, rng, level);
    const who = new Set(Object.values(state.combatants).filter((c) => c.imza === sub.id).map((c) => c.id));
    n++;
    const max = roundLimit(level);
    for (let g = 0; g < 2000 && state.status === 'active' && state.round <= max; g++) {
      const actorId = state.order[state.turnIndex] ?? '';
      let moved = false;
      for (let step = 0; step < 12; step++) {
        const cmd: Command = chooseCommand(state);
        if (cmd.type === 'end_turn') break;
        const r = execute(state, cmd, contextFor(state, actorId), rng);
        if (!r.ok) break;
        if (who.has(actorId)) {
          if (cmd.type === 'use_feature' && String((cmd as { feature?: string }).feature ?? '').startsWith('imza:')) imza++;
          if (cmd.type === 'cast_spell') cast++;
          if (cmd.type === 'attack') atk++;
        }
        state = r.state; moved = true;
        if (state.status !== 'active' || state.order[state.turnIndex] !== actorId) break;
      }
      void moved;
      if (state.status === 'active' && state.order[state.turnIndex] === actorId) {
        const r = execute(state, { type: 'end_turn', actorId }, contextFor(state, actorId), rng);
        if (r.ok) state = r.state; else break;
      }
    }
  }
  console.log(`| ${sub.name.tr} | ${imza} | ${cast} | ${atk} | ${(imza / n).toFixed(2)} |`);
}
