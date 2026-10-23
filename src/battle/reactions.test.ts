/**
 * Tepki sistemi (Görev R1; SRD 5.2.1): tepki hakkı (tek yer, tur başında yenilenir), oyuncu kararı (zar defteri
 * üstünden istek ve yeniden çalıştırma, replay), yapay zekâ önerisi ve her tepki: fırsat saldırısı, Shield, Counterspell,
 * Hellish Rebuke, Feather Fall, Uncanny Dodge, Deflect Attacks (geri yöneltme), Slow Fall, Retaliation, Superior Hunter's
 * Defense ve canavar tepkileri (Parry, Riposte, Protective Magic, Deflect Missile, Redirect Attack, Unnerving Gaze).
 */
import { describe, it, expect } from 'vitest';
import { execute } from './commands';
import { combatantFromMonster, combatantFromSheet, startBattle } from './create';
import { applyEvents, replay } from './reduce';
import { advanceTo, envId, GM, mk, P1, scripted, setup, sword } from './fixtures';
import { effectiveAc } from './divine';
import { fallReactions } from './reactions';
import { getMonster } from '../data';
import { enterReaction, newBook, runStep, type DiceBook } from '../rules/manualDice';
import type { ReactionAnswer, ReactionRequest } from '../rules/reactionChoice';
import type { Rng } from '../rules/dice';
import type { CharacterSheet } from '../rules/stats';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

const sheet = (classId: string, level: number, p: Partial<CharacterSheet> = {}): CharacterSheet => ({
  name: 'X', raceId: 'human', classId, level, armorName: 'Zırhsız', shield: false, itemNames: [],
  baseScores: { str: 14, dex: 15, con: 13, int: 14, wis: 12, cha: 14 }, weapons: [{ name: 'Shortsword' }], ...p,
});
/** Karakterin savaş alanları (kimlik, ad, sahip ve inisiyatif dışında; `setup` üstüne yazmak için). */
const fields = (s: CharacterSheet, p: Partial<Combatant> = {}): Partial<Combatant> => {
  const { id: _i, name: _n, ownerId: _o, initiativeBonus: _b, ...f } = combatantFromSheet(s, { id: 'x', ownerId: 'p1' });
  return { ...f, ...p };
};
const monster = (id: string, p: Partial<Combatant> = {}): Partial<Combatant> => {
  const { id: _i, name: _n, initiativeBonus: _b, ...f } = combatantFromMonster(getMonster(id), { id: 'x' });
  return { ...f, ...p };
};
const claw = { name: 'Claw', bonus: 5, damageDice: '1d8+3', damageType: 'slashing', repeat: 1, ranged: false, reachFt: 5, text: '' };
const pad = (...xs: Array<[number, number]>) => scripted(...xs, ...Array.from({ length: 30 }, () => [20, 10] as [number, number]));

/** Rng'ye karar kancası: istekleri kaydeder, sırayla verilen yanıtları döndürür (yanıt kalmazsa öneri). */
function answering(base: Rng, answers: ReactionAnswer[] = []): Rng & { seen: ReactionRequest[] } {
  const seen: ReactionRequest[] = [];
  const r = (() => base()) as Rng & { seen: ReactionRequest[]; react: (q: ReactionRequest) => ReactionAnswer };
  r.seen = seen;
  r.react = (q) => { seen.push(q); return answers.length ? answers.shift() ?? null : q.suggested; };
  return r;
}
const ok = (r: ReturnType<typeof execute>) => { if (!r.ok) throw new Error(r.error); return r; };
const attackOf = (events: BattleEvent[], actorId?: string) =>
  events.find((e) => e.type === 'attack_resolved' && (!actorId || e.actorId === actorId)) as Extract<BattleEvent, { type: 'attack_resolved' }>;
const used = (events: BattleEvent[]) => events.filter((e) => e.type === 'reaction_used') as Array<Extract<BattleEvent, { type: 'reaction_used' }>>;

/** A oyuncu (sıra B'de, B saldırır). */
function hitOnA(a: Partial<Combatant>, b: Partial<Combatant> = {}): BattleState {
  return advanceTo(setup('Düz', { A: a, B: { attacks: [claw], hp: 60, maxHp: 60, ...b } }), 'B');
}
const claws = (s: BattleState, rng: Rng) => execute(s, { type: 'monster_attack', actorId: 'B', targetId: 'A', attackIndex: 0 }, GM, rng);

describe('tepki ekonomisi', () => {
  it('turda bir tepki; tek yerden harcanır, kendi turunun başında yenilenir', () => {
    const s = hitOnA(fields(sheet('wizard', 5, { spellNames: ['Shield'] }), { ac: 13 }));
    const r = ok(claws(s, pad([20, 10], [8, 5])));
    expect(used(r.events)).toEqual([{ type: 'reaction_used', actorId: 'A', reaction: 'spells:shield', name: 'Shield', trigger: 'hit', sourceId: 'B',
      mark: { kind: 'shield', by: 'A', ac: 5, end: 'turnStart', count: 1 } }]);
    expect(r.state.combatants.A?.economy.reaction).toBe(true);
    // Aynı tur ikinci isabette tepki yok.
    const fresh = { ...r.state, combatants: { ...r.state.combatants, B: { ...(r.state.combatants.B as Combatant), economy: { ...(r.state.combatants.B as Combatant).economy, action: false } } } };
    expect(used(ok(claws(fresh, pad([20, 19], [8, 5]))).events)).toHaveLength(0);
    // A'nın turu: tepki ve Shield işareti biter.
    const own = advanceTo(ok(execute(r.state, { type: 'end_turn', actorId: 'B' }, GM, scripted())).state, 'A');
    expect(own.combatants.A?.economy.reaction).toBe(false);
    expect(own.combatants.A?.marks ?? []).toEqual([]);
  });
});

describe('oyuncu kararı: istek, yeniden çalıştırma, replay', () => {
  /** Mapless fırsat saldırısı: B (düşman) yükseklik değiştirir, A'nın (oyuncu) tepkisi sorulur. */
  const start = () => advanceTo(setup('Düz', { A: { weaponOptions: [sword], height: 1 }, B: { height: 1, hp: 40, maxHp: 40 } }), 'B');
  const move: Command = { type: 'change_height', actorId: 'B', toHeight: 0 };
  const opts = { ask: () => false, auto: pad([20, 15], [8, 6]), reaction: () => 'ask' as const };

  it('oyuncuya sorulur (NeedReaction); "Hayır" saldırmaz, "Evet" saldırır ve tepkiyi harcar', () => {
    const s = start();
    const first = runStep((rng) => execute(s, move, GM, rng), newBook(), opts);
    expect(first.ok).toBe(false);
    const req = (first as { reaction: ReactionRequest }).reaction;
    expect(req).toMatchObject({ reactorId: 'A', trigger: 'leave', sourceId: 'B', options: [{ id: 'opportunity-attack' }], suggested: { option: 'opportunity-attack' } });
    let book: DiceBook = newBook();
    runStep((rng) => execute(s, move, GM, rng), book, opts);
    const no = runStep((rng) => execute(s, move, GM, rng), enterReaction(book, null), opts);
    expect(no.ok && no.value.ok && no.value.events.some((e) => e.type === 'attack_resolved')).toBe(false);
    book = newBook();
    runStep((rng) => execute(s, move, GM, rng), book, opts);
    const yes = runStep((rng) => execute(s, move, GM, rng), enterReaction(book, { option: 'opportunity-attack' }), opts);
    if (!yes.ok || !yes.value.ok) throw new Error('çalışmadı');
    expect(attackOf(yes.value.events, 'A')).toMatchObject({ opportunity: true, targetId: 'B' });
    expect(yes.value.state.combatants.A?.economy.reaction).toBe(true);
    // Replay: olaylar baştan oynatılınca aynı durum.
    const startEvents: BattleEvent[] = [{ type: 'battle_started', state: s }];
    expect(replay([...startEvents, ...yes.value.events])).toEqual(yes.value.state);
  });
  it('politika: "asla" kullanmaz, "her zaman" kullanır; kancasız Rng yapay zekâ önerisini uygular', () => {
    const s = start();
    const never = runStep((rng) => execute(s, move, GM, rng), newBook(), { ...opts, reaction: () => null });
    expect(never.ok && never.value.ok && never.value.events.some((e) => e.type === 'attack_resolved')).toBe(false);
    const ai = ok(execute(s, move, GM, pad([20, 15], [8, 6])));
    expect(attackOf(ai.events, 'A')).toMatchObject({ opportunity: true });
  });
});

describe('isabet tepkileri', () => {
  it('Shield: ıskalatırsa yapay zekâ kullanır, slot harcanır, AC +5 sonraki turunun başına dek', () => {
    const s = hitOnA(fields(sheet('wizard', 5, { spellNames: ['Shield'] }), { ac: 13 }));
    const r = ok(claws(s, pad([20, 10], [8, 5])));
    expect(attackOf(r.events)).toMatchObject({ hit: false, targetAc: 18, appliedDamage: 0, reacted: { name: 'Shield', ac: 5 } });
    expect(r.events).toContainEqual({ type: 'slot_spent', actorId: 'A', level: 1, remaining: 3 });
    expect(effectiveAc(r.state, r.state.combatants.A as Combatant)).toBe(18);
    // Iskalatamayacaksa (toplam ≥ AC + 5) önerilmez.
    const high = ok(claws(s, pad([20, 18], [8, 5])));
    expect(used(high.events)).toHaveLength(0);
    // Oyuncu yine de seçebilir: isabet kalır, slot gider.
    const forced = ok(claws(s, answering(pad([20, 18], [8, 5]), [{ option: 'spells:shield', choice: '2' }])));
    expect(attackOf(forced.events)).toMatchObject({ hit: true, targetAc: 18 });
    expect(forced.events).toContainEqual({ type: 'slot_spent', actorId: 'A', level: 2, remaining: 2 });
  });
  it('Shield, Magic Missile\'ın hasarını keser', () => {
    const caster: Partial<Combatant> = { spellNames: ['Magic Missile'], spellSlots: [2, 0, 0, 0, 0, 0, 0, 0, 0], spellMod: 3, spellAttack: 5, spellSaveDc: 13, level: 3 };
    const s = hitOnA(fields(sheet('wizard', 5, { spellNames: ['Shield'] })), caster);
    const r = ok(execute(s, { type: 'cast_spell', actorId: 'B', spellName: 'Magic Missile', targetId: 'A' }, GM, pad()));
    const darts = r.events.filter((e) => e.type === 'attack_resolved');
    expect(darts).toHaveLength(3);
    expect(darts.every((e) => e.type === 'attack_resolved' && e.appliedDamage === 0)).toBe(true);
    expect(used(r.events)[0]).toMatchObject({ name: 'Shield', trigger: 'targeted' });
  });
  it('Uncanny Dodge (Rogue 5): ağır isabette hasar yarıya iner', () => {
    const s = hitOnA(fields(sheet('rogue', 5, { subclassId: 'thief' }), { hp: 30, maxHp: 30 }));
    const r = ok(claws(s, pad([20, 15], [8, 8])));
    expect(attackOf(r.events)).toMatchObject({ hit: true, appliedDamage: 5, reacted: { name: 'Uncanny Dodge', reduced: 6 } });
    expect(used(r.events)[0]).toMatchObject({ reaction: 'rogue:uncanny-dodge' });
  });
  it('Deflect Attacks: hasar 0\'a inerse 1 Focus ile geri yöneltme (DEX save, iki Martial Arts zarı + DEX)', () => {
    const s = hitOnA(fields(sheet('monk', 3, { subclassId: 'warrior-of-the-open-hand' })), { saves: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 } });
    const r = ok(claws(s, pad([20, 15], [8, 2], [10, 10], [20, 3], [6, 4], [6, 4])));
    expect(attackOf(r.events)).toMatchObject({ hit: true, appliedDamage: 0, deflected: 5 });
    expect(r.events).toContainEqual({ type: 'feature_used', actorId: 'A', feature: 'focus', remaining: 2 });
    const back = r.events.find((e) => e.type === 'save_resolved') as Extract<BattleEvent, { type: 'save_resolved' }>;
    expect(back).toMatchObject({ actorId: 'A', targetId: 'B', label: 'Deflect Attacks', ability: 'dex', success: false, appliedDamage: 4 + 4 + 2, damageType: 'slashing' });
  });
  it('Superior Hunter\'s Defense (Hunter 15, kısmen): isabetin hasarına direnç', () => {
    const s = hitOnA(fields(sheet('ranger', 15, { subclassId: 'hunter' }), { hp: 30, maxHp: 30 }));
    const r = ok(claws(s, pad([20, 15], [8, 8])));
    expect(attackOf(r.events)).toMatchObject({ appliedDamage: 5, reacted: { name: 'Superior Hunter’s Defense' } });
  });
});

describe('hasar ve büyü tepkileri', () => {
  it('Hellish Rebuke: hasar verene DEX save, 2d10 fire (slot seviyesi başına +1d10)', () => {
    const s = hitOnA(fields(sheet('warlock', 1, { spellNames: ['Hellish Rebuke'] }), { hp: 30, maxHp: 30 }));
    const r = ok(claws(s, pad([20, 15], [8, 4], [20, 2], [10, 6], [10, 5])));
    expect(used(r.events)[0]).toMatchObject({ reaction: 'spells:hellish-rebuke', trigger: 'damaged' });
    expect(r.events.find((e) => e.type === 'save_resolved')).toMatchObject({ actorId: 'A', targetId: 'B', label: 'Hellish Rebuke', success: false, appliedDamage: 11, damageType: 'fire' });
    expect(r.state.combatants.B?.hp).toBe(49);
  });
  it('Counterspell: slotlu büyü durdurulur (CON save başarısız), eylem gider, slot harcanmaz', () => {
    const enemy = fields(sheet('wizard', 5, { spellNames: ['Counterspell'] }), { side: 'enemies', ownerId: null });
    const s = advanceTo(setup('Düz', { A: fields(sheet('wizard', 5, { spellNames: ['Magic Missile'] })), B: enemy }), 'A');
    const r = ok(execute(s, { type: 'cast_spell', actorId: 'A', spellName: 'Magic Missile', targetId: 'B' }, P1, pad([20, 2])));
    expect(used(r.events)[0]).toMatchObject({ actorId: 'B', reaction: 'spells:counterspell', trigger: 'cast' });
    expect(r.events).toContainEqual({ type: 'slot_spent', actorId: 'B', level: 3, remaining: 1 });
    expect(r.events.some((e) => e.type === 'slot_spent' && e.actorId === 'A')).toBe(false);
    expect(r.events.some((e) => e.type === 'attack_resolved')).toBe(false);
    expect(r.state.combatants.A?.economy.action).toBe(true);
    // CON save başarılıysa büyü olur.
    const pass = ok(execute(s, { type: 'cast_spell', actorId: 'A', spellName: 'Magic Missile', targetId: 'B' }, P1, pad([20, 19])));
    expect(pass.events.filter((e) => e.type === 'attack_resolved')).toHaveLength(3);
    // Cantrip'e yapay zekâ Counterspell harcamaz.
    const cantrip = fields(sheet('wizard', 5, { spellNames: ['Fire Bolt'] }));
    const s2 = advanceTo(setup('Düz', { A: cantrip, B: enemy }), 'A');
    expect(used(ok(execute(s2, { type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetId: 'B' }, P1, pad())).events)).toHaveLength(0);
  });
  it('Retaliation (Berserker 10): 5 ft içinden hasar alınca yakın dövüş saldırısı', () => {
    const s = hitOnA(fields(sheet('barbarian', 10, { subclassId: 'path-of-the-berserker', weapons: [{ name: 'Greataxe' }] }), { hp: 60, maxHp: 60 }));
    const r = ok(claws(s, pad([20, 15], [8, 4])));
    expect(used(r.events)[0]).toMatchObject({ reaction: 'barbarian/path-of-the-berserker:retaliation' });
    expect(attackOf(r.events, 'A')).toMatchObject({ targetId: 'B', label: 'Greataxe' });
  });
  it('Slow Fall ve Feather Fall: düşme tepkisi (düşenin, yoksa 60 ft içindeki dostun)', () => {
    const monk = fields(sheet('monk', 4, { subclassId: 'warrior-of-the-open-hand' }));
    const s = setup('Düz', { A: monk, C: fields(sheet('wizard', 5, { spellNames: ['Feather Fall'] })) });
    const slow = fallReactions(s, 'A', 40, pad());
    expect(slow).toMatchObject({ reduce: 20, negate: false });
    expect(used(slow.events)[0]).toMatchObject({ actorId: 'A', reaction: 'monk:slow-fall', trigger: 'fall' });
    const s2 = applyEvents(s, slow.events);
    // Tepkisi gitti: dost Feather Fall yapar (hasar yok).
    const feather = fallReactions(s2, 'A', 40, pad());
    expect(feather).toMatchObject({ negate: true });
    expect(used(feather.events)[0]).toMatchObject({ actorId: 'C', reaction: 'spells:feather-fall' });
    // 10 ft düşmeye yapay zekâ slot harcamaz.
    expect(fallReactions(s2, 'A', 10, pad()).events).toHaveLength(0);
  });
});

describe('canavar tepkileri', () => {
  const attackB = (s: BattleState, rng: Rng, option = sword) => execute(s, { type: 'attack', actorId: 'A', targetId: 'B', option }, P1, rng);
  const vs = (id: string, p: Partial<Combatant> = {}) => advanceTo(setup('Düz', { A: { weaponOptions: [sword], hp: 40, maxHp: 40 }, B: monster(id, p) }), 'A');

  it('Parry: yakın dövüş isabetine AC +2 (ıskalatırsa); menzilli saldırıda yok', () => {
    const s = vs('knight');
    const r = ok(attackB(s, pad([20, 13], [8, 5])));
    expect(attackOf(r.events)).toMatchObject({ hit: false, targetAc: 20, reacted: { name: 'Parry', ac: 2 } });
    expect(used(r.events)[0]).toMatchObject({ actorId: 'B', reaction: 'knight:parry' });
    const bow = { ...sword, label: 'Shortbow', ranged: true, range: [80, 320] as [number, number] };
    expect(used(ok(attackB(s, pad([20, 13], [8, 5]), bow)).events)).toHaveLength(0);
  });
  it('Riposte: ıskalatınca saldırana Rapier saldırısı', () => {
    const s = vs('pirate-captain');
    const r = ok(attackB(s, pad([20, 12], [8, 5], [20, 15], [8, 4])));
    expect(attackOf(r.events, 'A')).toMatchObject({ hit: false });
    expect(attackOf(r.events, 'B')).toMatchObject({ targetId: 'A', label: 'Rapier' });
  });
  it('Protective Magic: Shield havuzdan (3/Day) harcanır', () => {
    const s = vs('mage');
    const r = ok(attackB(s, pad([20, 12], [8, 5])));
    expect(used(r.events)[0]).toMatchObject({ reaction: 'mage:protective-magic-shield', pool: { id: 'protective-magic', remaining: 2 } });
    expect(r.state.combatants.B?.reactionUses).toEqual({ 'protective-magic': 2 });
  });
  it('Deflect Missile: menzilli B/P/S isabetinde 1d10 + 6 azalır; Recharge 5–6 tur başında', () => {
    const bow = { ...sword, label: 'Longbow', ranged: true, range: [150, 600] as [number, number], damage: '1d8+3', damageType: 'piercing' };
    const s = vs('stone-giant');
    const r = ok(attackB(s, pad([20, 19], [8, 8], [10, 1]), bow));
    expect(attackOf(r.events)).toMatchObject({ appliedDamage: 4, reacted: { name: 'Deflect Missile', reduced: 7 } });
    expect(r.state.combatants.B?.reactionSpent).toEqual(['stone-giant:deflect-missile']);
    const c = ok(execute(r.state, { type: 'end_turn', actorId: 'A' }, P1, scripted()));
    const next = ok(execute(c.state, { type: 'end_turn', actorId: 'C' }, { playerId: 'p2', isGm: false }, pad([6, 6])));
    expect(next.events).toContainEqual({ type: 'reaction_recharged', actorId: 'B', reaction: 'stone-giant:deflect-missile', d6: 6, recharged: true });
  });
  it('Redirect Attack: saldırı yanındaki dosta gider, yer değiştirirler', () => {
    const parts = [
      mk('A', { ownerId: 'p1', initiativeBonus: 5, weaponOptions: [sword] }),
      combatantFromMonster(getMonster('goblin-boss'), { id: 'B' }),
      combatantFromMonster(getMonster('goblin-warrior'), { id: 'G' }),
    ];
    let s = startBattle('b', envId('Düz'), parts, scripted([20, 15], [20, 2], [20, 2])).state;
    s = advanceTo(s, 'A');
    const r = ok(attackB(s, pad([20, 15], [8, 5])));
    expect(r.events).toContainEqual({ type: 'swapped', actorId: 'B', otherId: 'G' });
    expect(attackOf(r.events)).toMatchObject({ targetId: 'G' });
  });
  it('Unnerving Gaze: 30 ft içinde tur başlatan WIS save, başarısızsa turunun sonuna dek Frightened', () => {
    const s = advanceTo(setup('Düz', { B: monster('chain-devil') }), 'B');
    const r = ok(execute(s, { type: 'end_turn', actorId: 'B' }, GM, pad([20, 3])));
    expect(used(r.events)[0]).toMatchObject({ actorId: 'B', reaction: 'chain-devil:unnerving-gaze', trigger: 'turnStart', sourceId: 'A' });
    expect(r.state.combatants.A?.conditions).toContain('Frightened');
  });
  it('desteklenmeyen tepkiler veride nedeniyle işaretli (none) ve savaşçıya geçmez', () => {
    expect(combatantFromMonster(getMonster('ochre-jelly'), { id: 'o' }).reactions).toBeUndefined();
    expect(combatantFromMonster(getMonster('knight'), { id: 'k' }).reactions?.map((r) => r.id)).toEqual(['knight:parry']);
  });
});
