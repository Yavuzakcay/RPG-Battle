/**
 * Görev MC3 "eski = yeni" derlemi. Yalnız MC3 öncesinde de var olan API'leri kullanır; aynı dosya MC3 öncesi commit'te
 * çalıştırılarak `mc3-altin.json` üretildi (`scripts/mc3-eski-yeni.ts`; ilk `f85717ea` kural 103 / kayıt 25, MC3-BIRLESTIR'de
 * `a50fd8ed`, MC5'ten beri `304bcb60` kural 104 / kayıt 26, KARAR104 ve KARAR104-KALAN dahil).
 * - Tek sınıflı savaşçılar: sim partilerinin bütün üyeleri, 1/3/5/11/20. seviye (`combatantFromSheet` özeti).
 * - MC3 öncesi savaş kaydı: Çöl, 5. seviye standart parti, tohum 1, 3 tur; olay günlüğü + son durumun özeti (yeni kod aynı
 *   günlüğü aynı duruma oynatmalı).
 * - Dört senaryonun imzası (Çöl/Kale/Mağara/Orman; `ready` regresyonuyla aynı sabit listeler ve imza biçimi).
 */
import { combatantFromMonster, combatantFromSheet, setDefaultRuleVersion } from '../battle/create';
import { execute } from '../battle/commands';
import { replay } from '../battle/reduce';
import { currentActorId } from '../battle/common';
import { chooseCommand } from '../battle/ai';
import { contextFor } from '../ui/session';
import type { BattleEvent, BattleState, Command } from '../battle/types';
import { createMapBattle } from '../app/setup';
import { getMonster } from '../data';
import { partyAt, PARTY_KINDS, playBattle, SCENARIOS, seeded, setupBattle } from './balance';

/** FNV-1a (iki 32 bit tohum) → 12 onaltılık hane. */
export function hash12(text: string): string {
  let a = 0x811c9dc5, b = 0x01000193 ^ 0x5bd1e995;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    a = Math.imul(a ^ ch, 0x01000193) >>> 0;
    b = Math.imul(b ^ ch, 0x01000193) >>> 0;
  }
  return (a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0')).slice(0, 12);
}

/** Tek sınıflı savaşçıların özeti (anahtar parti/üye/seviye). */
export function combatantHashes(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const kind of Object.keys(PARTY_KINDS)) {
    for (const level of [1, 3, 5, 11, 20]) {
      let sheets;
      try { sheets = partyAt(level, kind); } catch { continue; }
      sheets.forEach((s, i) => {
        const key = `${s.name}/${s.classId}/${level}`;
        if (!(key in out)) out[key] = hash12(JSON.stringify(combatantFromSheet(s, { id: `pc${i + 1}`, ownerId: `p${i + 1}` })));
      });
    }
  }
  return out;
}

/** Sabit düşman listeleri (5. seviye; `readyRegresyon` ile aynı). */
export const PIN: Record<string, Record<string, number>> = {
  col: { 'giant-scorpion': 2, mummy: 2, manticore: 2, 'gnoll-warrior': 4, 'giant-hyena': 1, scout: 2, 'death-dog': 1 },
  kale: { 'hobgoblin-warrior': 4, 'goblin-warrior': 4, 'hobgoblin-captain': 1, 'bugbear-stalker': 1, berserker: 3, 'warrior-veteran': 2, 'bugbear-warrior': 2 },
  magara: { troll: 1, 'giant-spider': 2, ghoul: 1, darkmantle: 1, ettercap: 1, ogre: 1, grimlock: 1 },
  orman: { owlbear: 2, werewolf: 2, 'giant-spider': 3, 'dire-wolf': 3, ettercap: 2, wolf: 2 },
};

/** Olay günlüğüyle savaş (kaydın içeriği): standart parti, 5. seviye, `rounds` tur. */
export function recordBattle(id: string, seed: number, rounds: number): { events: BattleEvent[]; state: BattleState } {
  const s = SCENARIOS.find((x) => x.id === id)!;
  const rng = seeded(seed);
  const party = partyAt(5, 'standart').map((sheet, i) => combatantFromSheet(sheet, { id: `pc${i + 1}`, ownerId: `p${i + 1}` }));
  const foes = Object.entries(PIN[id]!).flatMap(([m, n]) => Array.from({ length: n }, (_, i) => combatantFromMonster(getMonster(m), { id: `${m}-${i + 1}`, name: `${getMonster(m).name} ${i + 1}` })));
  const session = createMapBattle([...party, ...foes], { ...s.map!, mirrored: false }, rng);
  let state = session.state;
  const events: BattleEvent[] = [...session.events];
  const apply = (cmd: Command, ctx = contextFor(state, 'actorId' in cmd ? cmd.actorId : '')): boolean => {
    const r = execute(state, cmd, ctx, rng);
    if (!r.ok) return false;
    state = r.state; events.push(...r.events);
    return true;
  };
  apply({ type: 'start_battle' }, { playerId: 'gm', isGm: true });
  for (let guard = 0; guard < 600 && state.status === 'active' && state.round <= rounds; guard++) {
    const actorId = currentActorId(state);
    for (let step = 0; step < 12; step++) {
      const cmd = chooseCommand(state);
      if (cmd.type === 'end_turn' || !apply(cmd)) break;
      if (state.status !== 'active' || currentActorId(state) !== actorId) break;
    }
    if (state.status === 'active' && currentActorId(state) === actorId) apply({ type: 'end_turn', actorId });
  }
  return { events, state };
}

/** Dört senaryonun imzası (tohum 1..seeds; can, durum, konum, irtifa). */
export function signature(id: string, seeds: number, ver: number): string {
  let text = '';
  for (let seed = 1; seed <= seeds; seed++) {
    setDefaultRuleVersion(ver);
    const s0 = SCENARIOS.find((x) => x.id === id)!;
    const { byLevel: _b, ...s } = { ...s0, enemies: PIN[id] ?? s0.enemies };
    const rng = seeded(seed);
    const end = playBattle(setupBattle(s, rng, 5), rng, 20);
    const cs = Object.values(end.combatants).map((c) => `${c.id}:${c.hp}:${c.life}:${c.pos ? `${c.pos.col},${c.pos.row}` : '-'}:${c.altitudeFt ?? 0}`).sort();
    text += `${end.status}|${end.winner ?? ''}|${end.round}|${cs.join(';')}\n`;
  }
  return hash12(text);
}

/** Kaydın son durumu ile yeniden oynatmanın aynı olduğunu da denetleyen özet. */
export const stateHash = (s: BattleState): string => hash12(JSON.stringify(s));
export const replayHash = (events: BattleEvent[]): string => stateHash(replay(events));
