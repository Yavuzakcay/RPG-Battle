/**
 * Kuyruk A7: nesne, el ve ışık büyüleri (kural sürümü 36, mekaniğin `a7` hâli). Yeni davranış (36) ve eski (35);
 * replay aynı (`run` denetler).
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { applyEvents } from './reduce';
import { effectTurnStartEvents } from './effects';
import { wardSources } from './divine';
import { litHexes } from './maprules';
import { zoneAttackSources } from './zones';
import { GM, P1, mk } from './fixtures';
import { seededRng } from '../rules/dice';
import { spells } from '../data';
import { caster, field, run } from './k19spells.test';
import type { BattleState, Combatant, Command, MapObject } from './types';

const foe = (id: string, p: Partial<Combatant> = {}) => mk(id, { side: 'enemies', hp: 200, maxHp: 200, ...p });
const ally = (id: string, p: Partial<Combatant> = {}) => mk(id, { ownerId: 'p1', hp: 40, maxHp: 40, ...p });
const fx = (s: BattleState, id: string, srd: string) => s.combatants[id]?.effects?.find((e) => e.id === srd);
const pos = { A: { col: 2, row: 3 }, C: { col: 3, row: 3 }, F0: { col: 4, row: 3 } };
const cast = (spellName: string, extra: Partial<Command> = {}) => ({ type: 'cast_spell', actorId: 'A', spellName, ...extra }) as Command;
const ALL = [4, 3, 3, 3, 3, 2, 2, 1, 1];
const LOW = { str: -9, dex: -9, con: -9, int: -9, wis: -9, cha: -9 };
const wiz = (spellNames: string[], p: Partial<Combatant> = {}) => caster({ spellNames, spellSlots: ALL, ...p });
const tryCmd = (s: BattleState, cmd: Command, seed = 3) => execute(s, cmd, s.combatants[(cmd as { actorId: string }).actorId]?.side === 'enemies' ? GM : P1, seededRng(seed));
const withObj = (s: BattleState, o: MapObject): BattleState => ({ ...s, map: { ...(s.map as NonNullable<BattleState['map']>), objects: [...(s.map?.objects ?? []), o] } });
const nextRound = (s: BattleState): BattleState => ({ ...s, round: s.round + 1, combatants: Object.fromEntries(Object.entries(s.combatants).map(([k, c]) => [k, { ...c, economy: { ...c.economy, action: false, bonus: false, slotTurn: null } }])) });

describe('A7 el ve nesne', () => {
  it('Command Approach: büyücüye varamayan turuna devam eder (36); 35\'te turu biter', () => {
    for (const [k, lost] of [[36, false], [35, true]] as const) {
      const s = field([wiz(['Command']), foe('F0', { saves: LOW, speed: 5 })], { A: { col: 1, row: 3 }, F0: { col: 12, row: 3 } }, k);
      const r = run(s, cast('Command', { targetIds: ['F0'], choice: 'approach' }));
      expect(fx(r.state, 'F0', 'spells:command')?.command).toBe('approach');
      const t = effectTurnStartEvents(r.state, 'F0', seededRng(1));
      expect(t.skip).toBe(lost);
    }
  });
  it('Dragon\'s Breath: dokunulan dost Magic eylemiyle 15 ft koni nefes verir, seçilen tür (36)', () => {
    const s = field([wiz(['Dragon\'s Breath']), ally('C'), foe('F0', { saves: LOW })], pos, 36);
    const r = run(s, cast('Dragon\'s Breath', { targetIds: ['C'], choice: 'cold' }));
    expect(fx(r.state, 'C', 'spells:dragons-breath')?.breath).toMatchObject({ damageType: 'cold', dice: '3d6' });
    const turnC = { ...r.state, turnIndex: r.state.order.indexOf('C') };
    const b = run(turnC, { type: 'breath_weapon', actorId: 'C', shape: 'cone', targetHex: { col: 4, row: 3 } });
    expect(b.events.find((e) => e.type === 'save_resolved' && e.targetId === 'F0')).toMatchObject({ damageType: 'cold' });
    expect(b.events.some((e) => e.type === 'action_used' && e.kind === 'action')).toBe(true);
    // Yukarı slot: slot başına +1d6 nefeste.
    const up = run(field([wiz(['Dragon\'s Breath']), ally('C'), foe('F0')], pos, 36), cast('Dragon\'s Breath', { targetIds: ['C'], choice: 'fire', slotLevel: 3 }));
    expect(fx(up.state, 'C', 'spells:dragons-breath')?.breath?.dice).toBe('4d6');
  });
  it('Enlarge: STR kontrollerinde avantaj (36)', () => {
    const r = run(field([wiz(['Enlarge/Reduce']), ally('C'), foe('F0')], pos, 36), cast('Enlarge/Reduce', { targetIds: ['C'], choice: 'Enlarge' }));
    expect(fx(r.state, 'C', 'spells:enlarge-reduce')?.checkAdv).toEqual(['str']);
  });
  it('Flame Blade: kalkan ya da yan el silahı varken yapılamaz (36); 35\'te yapılır', () => {
    const s = (k: number) => field([wiz(['Flame Blade'], { shieldHeld: true }), foe('F0')], pos, k);
    expect(tryCmd(s(36), cast('Flame Blade')).ok).toBe(false);
    expect(run(s(35), cast('Flame Blade')).ok).toBe(true);
    expect(run(field([wiz(['Flame Blade']), foe('F0')], pos, 36), cast('Flame Blade')).ok).toBe(true);
  });
  it('Heat Metal: başarısız save\'de kontrollerde de dezavantaj (36)', () => {
    let ok = false;
    for (let seed = 1; seed < 30 && !ok; seed++) {
      const r = tryCmd(field([wiz(['Heat Metal']), foe('F0', { saves: LOW })], pos, 36), cast('Heat Metal', { targetId: 'F0' }), seed);
      const e = r.ok ? fx(r.state, 'F0', 'spells:heat-metal') : undefined;
      if (e) { expect(e.checkDis).toEqual(['str', 'dex', 'con', 'int', 'wis', 'cha']); ok = true; }
    }
    expect(ok).toBe(true);
  });
  it('Magic Weapon: dokunulan dostun silahına; yeniden yapınca önceki biter (36)', () => {
    const s = field([wiz(['Magic Weapon']), ally('C'), ally('D'), foe('F0')], { ...pos, D: { col: 2, row: 4 } }, 36);
    const r1 = run(s, cast('Magic Weapon', { targetId: 'C' }));
    expect(r1.state.combatants.C?.buffs?.some((b) => b.source === 'Magic Weapon')).toBe(true);
    const r2 = run(nextRound(r1.state), cast('Magic Weapon', { targetId: 'D' }));
    expect(r2.state.combatants.C?.buffs?.some((b) => b.source === 'Magic Weapon')).toBe(false);
    expect(r2.state.combatants.D?.buffs?.some((b) => b.source === 'Magic Weapon')).toBe(true);
    const old = run(field([wiz(['Magic Weapon']), ally('C'), foe('F0')], pos, 35), cast('Magic Weapon', { targetId: 'C' }));
    expect(old.state.combatants.A?.buffs?.some((b) => b.source === 'Magic Weapon')).toBe(true);
  });
});

describe('A7 ışık ve karanlık', () => {
  const dark = (s: BattleState): BattleState => s; // ışık kümesi yalnızca karanlık kuralı olan haritada; nesne kaynağını doğrudan sınarız
  it('Light: taşınmayan nesneye ışık; nesneyi alan taşıdıkça ışık onunla gider (36)', () => {
    const torch: MapObject = { id: 'o1', kind: 'chest' as MapObject['kind'], at: { col: 2, row: 4 }, hp: 10 };
    const s = withObj(field([wiz(['Light']), ally('C'), foe('F0')], pos, 36), torch);
    const r = run(dark(s), cast('Light', { targetHex: { col: 2, row: 4 } }));
    expect(r.state.map?.objects?.find((o) => o.id === 'o1')).toMatchObject({ light: 4, lightSpell: 'light', lightBy: 'A' });
    const carried = applyEvents(r.state, [{ type: 'object_changed', objectId: 'o1', label: 'al', carriedBy: 'C' }]);
    expect(carried.map?.objects?.find((o) => o.id === 'o1')?.light).toBe(4);
    // Yeniden yapınca (kendine) önceki nesne ışığı söner.
    const again = run(nextRound(r.state), cast('Light', { targetIds: ['A'] }));
    expect(again.state.map?.objects?.find((o) => o.id === 'o1')?.light).toBeUndefined();
    expect(litHexes(again.state)).toBeInstanceOf(Set);
  });
  it('Continual Flame yeniden yapılınca önceki ışık sürer; Dispel Magic altıgendeki nesne ışığını kaldırır (36)', () => {
    const o = (id: string, col: number, row: number): MapObject => ({ id, kind: 'chest' as MapObject['kind'], at: { col, row }, hp: 10 });
    let s = withObj(withObj(field([wiz(['Continual Flame', 'Dispel Magic']), foe('F0')], pos, 36), o('o1', 2, 4)), o('o2', 1, 3));
    s = run(s, cast('Continual Flame', { targetHex: { col: 2, row: 4 } })).state;
    s = run(nextRound(s), cast('Continual Flame', { targetHex: { col: 1, row: 3 } })).state;
    expect(s.map?.objects?.filter((x) => x.light !== undefined).length).toBe(2);
    const d = run(nextRound(s), cast('Dispel Magic', { targetHex: { col: 2, row: 4 } }));
    expect(d.state.map?.objects?.find((x) => x.id === 'o1')?.light).toBeUndefined();
    expect(d.state.map?.objects?.find((x) => x.id === 'o2')?.light).toBe(4);
  });
  it('Darkness: örtüştüğü 2. seviye ve altı ışık büyüleri kalkar (36); 35\'te kalmaz', () => {
    for (const [k, gone] of [[36, true], [35, false]] as const) {
      const s = field([wiz(['Darkness']), ally('C', { effects: [{ id: 'spells:light', name: 'Light', sourceId: 'C', light: 4 }] }), foe('F0')], { A: { col: 1, row: 3 }, C: { col: 6, row: 3 }, F0: { col: 12, row: 3 } }, k);
      const r = run(s, cast('Darkness', { targetHex: { col: 6, row: 3 } }));
      expect(!fx(r.state, 'C', 'spells:light')).toBe(gone);
    }
  });
  it('Yoğun örtüde Blindsight menzilindeki saldıran hedefi görür (36)', () => {
    for (const [k, dis] of [[36, false], [35, true]] as const) {
      const s = field([wiz(['Darkness']), foe('F0', { senses: { blindsight: 30 } })], { A: { col: 3, row: 3 }, F0: { col: 4, row: 3 } }, k, { specialSenses: true });
      const r = run(s, cast('Darkness', { targetHex: { col: 3, row: 3 } }));
      const src = zoneAttackSources(r.state, r.state.combatants.F0 as Combatant, r.state.combatants.A as Combatant, false, false).sources;
      expect(src.some((x) => x.reason.startsWith('Görülmeyen hedef'))).toBe(dis);
    }
  });
  it('Daylight: güneş ışığına duyarlı saldıran alanda dezavantajlı (36)', () => {
    const s = field([wiz(['Daylight']), foe('F0', { traits: ['sunlight-sensitive'] })], { A: { col: 2, row: 3 }, F0: { col: 3, row: 3 } }, 36);
    const r = run(s, cast('Daylight', { targetHex: { col: 3, row: 3 } }));
    expect(wardSources(r.state, r.state.combatants.F0 as Combatant, r.state.combatants.A as Combatant).some((x) => x.reason === 'Sunlight Sensitivity')).toBe(true);
  });
  it('Faerie Fire: Blinded saldıran avantaj almaz (36)', () => {
    const t = mk('T', { side: 'enemies', effects: [{ id: 'spells:faerie-fire', name: 'Faerie Fire', sourceId: 'A', attackedAdv: true, attackedAdvSee: true }] });
    const s = field([wiz([]), t], { A: { col: 2, row: 3 }, T: { col: 3, row: 3 } }, 36);
    const see = wardSources(s, s.combatants.A as Combatant, s.combatants.T as Combatant).some((x) => x.reason === 'Faerie Fire');
    const blind = wardSources(s, { ...(s.combatants.A as Combatant), conditions: ['Blinded'] }, s.combatants.T as Combatant).some((x) => x.reason === 'Faerie Fire');
    expect([see, blind]).toEqual([true, false]);
  });
  it('Dancing Lights: bonus eylemle 60 ft taşınır (36)', () => {
    const s = field([wiz(['Dancing Lights']), foe('F0')], { A: { col: 2, row: 3 }, F0: { col: 12, row: 3 } }, 36);
    const r = run(s, cast('Dancing Lights', { targetHex: { col: 4, row: 3 } }));
    const m = run(nextRound(r.state), { type: 'spell_followup', actorId: 'A', targetId: 'A', targetHex: { col: 8, row: 3 } });
    expect(m.events.some((e) => e.type === 'zone_moved')).toBe(true);
    expect(m.events.some((e) => e.type === 'action_used' && e.kind === 'bonus')).toBe(true);
  });
});

describe('A7 Game Master notlu', () => {
  it('altı büyüde TR/EN Game Master notu; yapınca günlükte (36)', () => {
    for (const id of ['charm-person', 'hideous-laughter', 'enhance-ability', 'see-invisibility', 'animal-shapes', 'wish']) {
      const a7 = spells.find((x) => x.id === id)?.mechanics.a7;
      expect(a7?.gmNoted && a7.gmNote && a7.gmNoteEn).toBeTruthy();
    }
    const r = run(field([wiz(['Enhance Ability']), ally('C'), foe('F0')], pos, 36), cast('Enhance Ability', { targetIds: ['C'], choice: 'str' }));
    expect(r.events.some((e) => e.type === 'map_note' && e.text.startsWith('Game Master notu — Enhance Ability'))).toBe(true);
  });
});
