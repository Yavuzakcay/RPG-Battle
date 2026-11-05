/**
 * Y2 G4: duman testi her zorlukta: 3 zorluk × 12 sınıf × 3./7./11. seviye, bütün ev kuralları açık, iki taraf aynı
 * zorlukta yapay zekâyla 4 tur, Ortamlar Diyarı'nda (Y2: Usta ek terimleri, önbellekler, hareket düzeltmeleri).
 * Çökme yok, her komut geçerli, olaylar baştan oynatılınca aynı durum.
 */
import { describe, expect, it } from 'vitest';
import { newCharacter, suggestedScores } from '../rules/builder';
import { combatantFromMonster, combatantFromSheet } from '../battle/create';
import { createMapBattle } from '../app/setup';
import { execute } from '../battle/commands';
import { chooseCommand } from '../battle/ai';
import { replay } from '../battle/reduce';
import { classData, classes, getMonster } from '../data';
import { seededRng as seeded } from '../rules/dice';
import houseData from '../../data/ev-kurallari.json';
import type { BattleEvent, BattleState } from '../battle/types';

const IMZA = classData.subclasses.filter((s) => s.ev && s.id.startsWith('imza_'));
const ALL = Object.fromEntries(Object.keys(houseData.rules).map((k) => [k, true]));
const GM = { playerId: 'gm', isGm: true };
const DIFFS = ['kolay', 'normal', 'usta'] as const;

describe('Y2: 3 zorluk × 12 sınıf × 3/7/11', () => {
  it.each(DIFFS.flatMap((d) => [3, 7, 11].map((l) => [d, l] as const)))('%s, seviye %i: çökme yok, replay aynı', (diff, level) => {
    for (const cls of classes) {
      const sub = IMZA.find((s) => s.class === cls.id);
      const sheet = { ...newCharacter(`y2-${cls.id}-${level}`).sheet, classId: cls.id, level, baseScores: suggestedScores(cls.id), ...(sub ? { subclassId: sub.id } : {}) };
      const pcs = [0, 1].map((i) => ({ ...combatantFromSheet(sheet, { id: `P${i}`, ownerId: 'p1' }), side: 'party' as const }));
      const foes = (level >= 7 ? ['ogre', 'owlbear', 'goblin-warrior'] : ['goblin-warrior', 'wolf', 'goblin-warrior']).map((m, i) => ({ ...combatantFromMonster(getMonster(m), { id: `O${i}`, name: m }), side: 'enemies' as const }));
      const rng = seeded(level * 53 + cls.id.length + diff.length);
      const session = createMapBattle([...pcs, ...foes], { mapId: 'ortamlar-diyari', variantId: 'gunduz', mirrored: false }, rng);
      const state: BattleState = { ...session.state, houseRules: { ...session.state.houseRules, ...ALL }, yz: { zorluk: { party: diff, enemies: diff } } };
      const r = execute(state, { type: 'start_battle' }, GM, rng);
      expect(r.ok, `${diff}/${cls.id}/${level}`).toBe(true);
      if (!r.ok) continue;
      let s = r.state;
      const events: BattleEvent[] = [{ type: 'battle_started', state } as BattleEvent, ...r.events];
      for (let i = 0; i < 400 && s.status === 'active' && s.round <= 4; i++) {
        const cmd = chooseCommand(s);
        const actor = s.combatants[(cmd as { actorId?: string }).actorId ?? ''];
        const ctx = !actor || actor.side === 'enemies' || actor.civilian ? GM : { playerId: actor.ownerId, isGm: false };
        const x = execute(s, cmd, ctx, rng);
        expect(x.ok, `${diff}/${cls.id}/${level}: ${JSON.stringify(cmd)} → ${x.ok ? '' : x.error}`).toBe(true);
        if (!x.ok) break;
        s = x.state;
        events.push(...x.events);
      }
      expect(s.round, `${diff}/${cls.id}/${level}`).toBeGreaterThan(0);
      expect(JSON.stringify(replay(events)), `${diff}/${cls.id}/${level} replay`).toBe(JSON.stringify(s));
    }
  }, 600_000);
});
