/**
 * Gece kuyruğu Aşama 2 (kural sürümü 101, Görev KARAR101): KALAN100'ün karar kalanları SRD 5.2.1'e göre. Her madde 100'de
 * eski davranış, 101'de SRD; replay aynı durumu verir.
 */
import { describe, expect, it } from 'vitest';
import { execute, replay, startBattle } from './index';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command } from './index';
import { P1, mk, scripted, sword } from './fixtures';
import { KARAR101_VERSION, karar101On, walkBudgetHexes } from './karar101Surum';
import { CURRENT_RULES } from './ruleVersion';
import { highJumpFt, moveCostFn, speedHexes } from './movement';
import { winnerOf } from './common';
import { globalRule, ruleEnabled, specDefault, RULE_CONTROL } from './ruleControl';
import { damageEffects } from './damage-effects';
import type { Offset } from '../rules/hex';
import type { Rng } from '../rules/dice';
import type { ReactionAnswer, ReactionRequest } from '../rules/reactionChoice';

const NEW = KARAR101_VERSION;
const OLD = KARAR101_VERSION - 1;
const o = (col: number, row: number): Offset => ({ col, row });
const OPEN = Array.from({ length: 7 }, () => '.'.repeat(15));
const LOW = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };
const greatsword: AttackOption = { label: 'Greatsword', attackBonus: 30, damage: '2d6+3', damageType: 'slashing', ranged: false, spell: false, tag: 'greatsword', weaponId: 'greatsword', reachFt: 5, twoHands: true };
const longsword2: AttackOption = { label: 'Longsword', attackBonus: 30, damage: '1d10+3', damageType: 'slashing', ranged: false, spell: false, tag: 'longsword', weaponId: 'longsword', reachFt: 5, twoHands: true, minDie: 3 };
const club: AttackOption = { ...sword, label: 'Club', attackBonus: 30, damage: '1d4+3', weaponId: 'club', reachFt: 5 };

function field(v: number, pos: Record<string, Offset>, parts: Partial<Record<'A' | 'B' | 'C', Partial<Combatant>>> = {}, tiles = OPEN): BattleState {
  const list = [
    mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, attacksPerAction: 1, weaponOptions: [sword], ...parts.A }),
    mk('B', { side: 'enemies', ac: 5, hp: 60, maxHp: 60, weaponOptions: [sword], saves: LOW, ...parts.B }),
    mk('C', { side: 'enemies', ac: 5, hp: 60, maxHp: 60, weaponOptions: [sword], saves: LOW, ...parts.C }),
  ];
  const { state } = startBattle('k101', 'd-z-zemin', list, scripted([20, 20], [20, 19], [20, 18]), { map: { id: 'volkan' }, kuralSurumu: v });
  const combatants = { ...state.combatants };
  for (const id of Object.keys(combatants)) combatants[id] = { ...(combatants[id] as Combatant), pos: pos[id] ?? null };
  return { ...state, status: 'active', round: 1, order: ['A', 'B', 'C'], turnIndex: 0, combatants, map: { ...(state.map as NonNullable<BattleState['map']>), tiles, zones: [], objects: [] } };
}
const withC = (s: BattleState, id: string, patch: Partial<Combatant>): BattleState =>
  ({ ...s, combatants: { ...s.combatants, [id]: { ...(s.combatants[id] as Combatant), ...patch } } });
type R = ReturnType<typeof execute>;
const ok = (r: R) => { if (!r.ok) throw new Error(r.error); return r; };
const run = (s: BattleState, cmd: Command, rng: Rng = () => 0.5, ctx = P1) => ok(execute(s, cmd, ctx, rng));
const replays = (start: BattleState, ...steps: Array<{ state: BattleState; events: BattleEvent[] }>) =>
  expect(replay([{ type: 'battle_started', state: start }, ...steps.flatMap((x) => x.events)])).toEqual(steps[steps.length - 1]?.state);
/** Kararı veren Rng (seçim ve tepki istemleri), zarlar sabit. */
function deciding(answer: (q: ReactionRequest) => ReactionAnswer, roll = 0.5, seen: ReactionRequest[] = []): Rng {
  const r = (() => roll) as Rng & { react: (q: ReactionRequest) => ReactionAnswer };
  r.react = (q) => { seen.push(q); return answer(q); };
  return r;
}

describe('KARAR101: sabit', () => {
  it('kural sürümü 101; 100 eski', () => {
    expect(KARAR101_VERSION).toBe(101);
    expect(CURRENT_RULES).toBeGreaterThanOrEqual(KARAR101_VERSION);
    expect(karar101On({ kuralSurumu: 101 })).toBe(true);
    expect(karar101On({ kuralSurumu: 100 })).toBe(false);
  });
});

describe('KARAR101: sürünme + zorlu arazi (SRD s. 179 Crawling)', () => {
  const tiles = OPEN.map((r, i) => (i === 3 ? `${r.slice(0, 4)}t${r.slice(5)}` : r));
  const cost = (v: number, to: Offset) => {
    const s = field(v, { A: o(3, 3) }, { A: { conditions: ['Prone'] } }, tiles);
    return moveCostFn(s, s.combatants.A as Combatant)(to, o(3, 3));
  };
  it('101: normal zeminde 2, zorlu arazide 3 (ft başına toplam 3 ft)', () => {
    expect(cost(NEW, o(2, 3))).toBe(2);
    expect(cost(NEW, o(4, 3))).toBe(3);
  });
  it('100: zorlu arazide 4 (eski ×2 × 2)', () => {
    expect(cost(OLD, o(2, 3))).toBe(2);
    expect(cost(OLD, o(4, 3))).toBe(4);
  });
});

describe('KARAR101: Knocking Out (SRD s. 17)', () => {
  const ko = (v: number, rng: Rng) => {
    const s = field(v, { A: o(3, 3), B: o(4, 3) }, { A: { weaponOptions: [club] }, B: { hp: 3, maxHp: 60 } });
    return { s, r: run(s, { type: 'attack', actorId: 'A', targetId: 'B', option: club }, rng) };
  };
  it('101: oyuncu bayıltmayı seçerse hedef 1 HP + Unconscious, savaş partiyle biter (bayıltılan yenilmiş)', () => {
    const seen: ReactionRequest[] = [];
    const { s, r } = ko(NEW, deciding((q) => (q.trigger === 'choice' ? { option: 'choice', choice: 'knockout' } : null), 0.5, seen));
    const b = r.state.combatants.B as Combatant;
    expect(b.hp).toBe(1);
    expect(b.conditions).toContain('Unconscious');
    expect(b.knockedOut).toBe(true);
    expect(seen.some((q) => q.trigger === 'choice' && q.reactorId === 'A')).toBe(true);
    const lone = withC(r.state, 'C', { hp: 0 });
    expect(winnerOf(lone)).toBe('party');
    replays(s, r);
  });
  it('101: öneri (yapay zekâ / kancasız) bayıltmaz: 0 HP', () => {
    const { r } = ko(NEW, () => 0.5);
    expect(r.state.combatants.B?.hp).toBe(0);
    expect(r.state.combatants.B?.knockedOut).toBeUndefined();
  });
  it('100: soru yok, 0 HP', () => {
    const seen: ReactionRequest[] = [];
    const { r } = ko(OLD, deciding(() => ({ option: 'choice', choice: 'knockout' }), 0.5, seen));
    expect(r.state.combatants.B?.hp).toBe(0);
    expect(seen.some((q) => q.trigger === 'choice')).toBe(false);
  });
  it('101: menzilli saldırıda soru yok', () => {
    const bow: AttackOption = { ...club, label: 'Shortbow', ranged: true, range: [80, 320], weaponId: 'shortbow' };
    const seen: ReactionRequest[] = [];
    const s = field(NEW, { A: o(3, 3), B: o(6, 3) }, { A: { weaponOptions: [bow] }, B: { hp: 3 } });
    const r = run(s, { type: 'attack', actorId: 'A', targetId: 'B', option: bow }, deciding(() => ({ option: 'choice', choice: 'knockout' }), 0.5, seen));
    expect(r.state.combatants.B?.hp).toBe(0);
    expect(seen.some((q) => q.trigger === 'choice')).toBe(false);
  });
  it('101: HP kazanınca ve ilk yardımla (DC 10 Medicine) Unconscious biter', () => {
    const { r } = ko(NEW, deciding((q) => (q.trigger === 'choice' ? { option: 'choice', choice: 'knockout' } : null)));
    const healed = replay([{ type: 'battle_started', state: r.state }, { type: 'healed', actorId: 'C', targetId: 'B', label: 'test', amount: 3, targetHpAfter: 4 }]);
    expect(healed.combatants.B?.conditions).not.toContain('Unconscious');
    expect(healed.combatants.B?.knockedOut).toBeUndefined();
    // İlk yardım: C (B'nin dostu) bitişik, Medicine 20.
    const s2 = withC(withC({ ...r.state, turnIndex: 2 }, 'C', { pos: o(5, 3), skills: { medicine: 20 } }), 'C', { economy: { ...r.state.combatants.C!.economy, action: false } });
    const aid = ok(execute(s2, { type: 'stabilize', actorId: 'C', targetId: 'B' }, { playerId: 'gm', isGm: true }, () => 0.5));
    expect(aid.state.combatants.B?.conditions).not.toContain('Unconscious');
  });
});

describe('KARAR101: Dash ve çoklu hız (SRD s. 188 Speed, s. 180 Dash)', () => {
  it('101: Dash eki Dash anındaki hızdan sabit; sonradan uçuş hızı gelince ek aynı kalır', () => {
    const s = field(NEW, { A: o(3, 3) });
    const d = run(s, { type: 'dash', actorId: 'A' });
    const a = d.state.combatants.A as Combatant;
    expect(a.economy.dashFt).toBe(30);
    expect(speedHexes(a)).toBe(12);
    // Uçuş etkisi (Fly 60) Dash'ten sonra: bütçe 60 + 30 = 90 ft (eski: 60 × 2 = 120).
    const fly = { ...a, effects: [{ id: 'fly', name: 'Fly', sourceId: 'A', fly: 60 }] } as Combatant;
    expect(speedHexes(fly)).toBe(18);
    expect(walkBudgetHexes(a)).toBe(12);
    replays(s, d);
  });
  it('100: hız × (1 + Dash)', () => {
    const s = field(OLD, { A: o(3, 3) });
    const a = run(s, { type: 'dash', actorId: 'A' }).state.combatants.A as Combatant;
    expect(a.economy.dashFt).toBeUndefined();
    const fly = { ...a, effects: [{ id: 'fly', name: 'Fly', sourceId: 'A', fly: 60 }] } as Combatant;
    expect(speedHexes(fly)).toBe(24);
  });
});

describe('KARAR101: nightVision yeni savaşta varsayılan açık', () => {
  it('veri: acikSurum 101; varsayılan sürüme göre', () => {
    const spec = RULE_CONTROL.nightVision!;
    expect(spec.acikSurum).toBe(101);
    expect(specDefault(spec, 101)).toBe(true);
    expect(specDefault(spec, 100)).toBe(false);
    expect(ruleEnabled(undefined, 'nightVision', 100)).toBe(false);
  });
  it('101 savaşta açık, 100 savaşta kapalı; Game Master kapatabilir', () => {
    expect(globalRule(field(NEW, {}), 'nightVision')).toBeTruthy();
    expect(globalRule(field(OLD, {}), 'nightVision')).toBeUndefined();
    const off = field(NEW, {});
    expect(globalRule({ ...off, map: { ...off.map!, ruleToggles: { nightVision: false } } }, 'nightVision')).toBeUndefined();
  });
});

describe('KARAR101: yakalama ve iki el (SRD s. 182, s. 90)', () => {
  const held = (v: number, opt: AttackOption) => field(v, { A: o(3, 3), B: o(4, 3), C: o(3, 4) }, {
    A: { weaponOptions: [opt] }, B: { conditions: ['Grappled'], grapple: { by: 'A', escapeDc: 12, restrained: false } },
  });
  it('101: yakalama tutarken Two-Handed silahla saldırı yok; 100 serbest', () => {
    const r = execute(held(NEW, greatsword), { type: 'attack', actorId: 'A', targetId: 'C', option: greatsword }, P1, () => 0.5);
    expect(r.ok).toBe(false);
    expect(execute(held(OLD, greatsword), { type: 'attack', actorId: 'A', targetId: 'C', option: greatsword }, P1, () => 0.5).ok).toBe(true);
  });
  it('101: Versatile tek elle (1d8, Great Weapon Fighting yok)', () => {
    const r = run(held(NEW, longsword2), { type: 'attack', actorId: 'A', targetId: 'C', option: longsword2 }, () => 0.99);
    const ev = r.events.find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>;
    expect(ev.damageRolls.every((x) => x <= 8)).toBe(true);
  });
  it('101: yakalamayı bırakma eylemsiz; sonra Two-Handed serbest', () => {
    const s = held(NEW, greatsword);
    const rel = run(s, { type: 'release_grapple', actorId: 'A', targetId: 'B' });
    expect(rel.state.combatants.B?.conditions).not.toContain('Grappled');
    expect(rel.state.combatants.A?.economy.action).toBe(false);
    expect(execute(rel.state, { type: 'attack', actorId: 'A', targetId: 'C', option: greatsword }, P1, () => 0.5).ok).toBe(true);
    expect(execute(held(OLD, greatsword), { type: 'release_grapple', actorId: 'A', targetId: 'B' }, P1, () => 0.5).ok).toBe(false);
    replays(s, rel);
  });
});

describe('KARAR101: High Jump koşusu "immediately before" (SRD s. 183)', () => {
  const str = { str: 3, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
  it('101: 10 ft yürüyüp hemen zıplayan tam yükseklik; araya iş girince yarısı', () => {
    const s = field(NEW, { A: o(2, 3), B: o(10, 3) }, { A: { modifiers: str, strScore: 16 } });
    const m = run(s, { type: 'move', actorId: 'A', to: o(4, 3) });
    expect(m.state.combatants.A?.walkStreak).toBe(2);
    expect(highJumpFt(m.state, m.state.combatants.A as Combatant)).toBe(6);
    const d = run(m.state, { type: 'dodge', actorId: 'A' });
    expect(d.state.combatants.A?.walkStreak).toBeUndefined();
    expect(highJumpFt(d.state, d.state.combatants.A as Combatant)).toBe(3);
  });
  it('100: arada iş olsa da koşu sayılır (eski)', () => {
    const s = field(OLD, { A: o(2, 3), B: o(10, 3) }, { A: { modifiers: str, strScore: 16 } });
    const m = run(s, { type: 'move', actorId: 'A', to: o(4, 3) });
    const d = run(m.state, { type: 'dodge', actorId: 'A' });
    expect(highJumpFt(d.state, d.state.combatants.A as Combatant)).toBe(6);
  });
});

describe("KARAR101: Stone's Endurance her hasarda (SRD s. 85)", () => {
  const goliath = (v: number): BattleState => {
    const s = field(v, { A: o(3, 3), B: o(4, 3) });
    const spec = { id: 'species:goliath/stones-endurance', name: "Stone's Endurance", kind: 'reduce' as const, dice: '1d12+2', resource: 'giantAncestry', ...(v >= NEW ? { anyDamage: true } : {}) };
    return withC(s, 'A', { reactions: [spec], resources: { ...s.combatants.A!.resources, giantAncestry: 2 } });
  };
  it('101: save hasarında (isabet olmadan) tepki sorar ve azaltır; tepki + kaynak harcanır', () => {
    const s = goliath(NEW);
    const a = s.combatants.A as Combatant;
    const fx = damageEffects(a, 10, 'fire', false, deciding((q) => (q.trigger === 'damaged' ? { option: q.options[0]!.id } : null), 0.5));
    const st = fx.effects.find((e) => e.kind === 'stone_endurance');
    expect(st).toBeTruthy();
    expect(fx.hpAfter).toBe(30 - 10 + (st as { amount: number }).amount);
    const after = replay([{ type: 'battle_started', state: s }, { type: 'bond_damage', targetId: 'A', fromId: 'B', label: 't', amount: 10, targetHpAfter: fx.hpAfter, effects: fx.effects }]);
    expect(after.combatants.A?.economy.reaction).toBe(true);
    expect(after.combatants.A?.resources.giantAncestry).toBe(1);
  });
  it('100: isabet dışı hasarda tepki yok (eski: yalnız isabette)', () => {
    const a = goliath(OLD).combatants.A as Combatant;
    const fx = damageEffects(a, 10, 'fire', false, deciding(() => ({ option: 'species:goliath/stones-endurance' })));
    expect(fx.effects.some((e) => e.kind === 'stone_endurance')).toBe(false);
  });
});

describe('KARAR101: kalkan tak/çıkar (SRD s. 92, Utilize)', () => {
  const shielded = (v: number) => {
    const s = field(v, { A: o(3, 3), C: o(4, 3) }, { A: { ac: 18, shieldHeld: true, weaponOptions: [sword], shieldBlocked: [{ ...greatsword, shieldBusy: true }], ...(v >= NEW ? { shieldAc: 2 } : {}) } });
    return s;
  };
  it('101: çıkarınca AC −2, eylem harcanır, Two-Handed seçeneği açılır; takınca geri', () => {
    const s = shielded(NEW);
    const off = run(s, { type: 'shield_toggle', actorId: 'A' });
    const a = off.state.combatants.A as Combatant;
    expect(a.ac).toBe(16);
    expect(a.shieldOff).toBe(true);
    expect(a.shieldHeld).toBeUndefined();
    expect(a.economy.action).toBe(true);
    expect(a.weaponOptions.some((x) => x.label === 'Greatsword')).toBe(true);
    replays(s, off);
    const next = withC(off.state, 'A', { economy: { ...a.economy, action: false } });
    const on = run(next, { type: 'shield_toggle', actorId: 'A' });
    expect(on.state.combatants.A?.ac).toBe(18);
    expect(on.state.combatants.A?.weaponOptions.some((x) => x.label === 'Greatsword')).toBe(false);
  });
  it('100: komut yok', () => {
    expect(execute(shielded(OLD), { type: 'shield_toggle', actorId: 'A' }, P1, () => 0.5).ok).toBe(false);
  });
});

describe('KARAR101: Dropping Prone (SRD s. 14)', () => {
  it('101: eylemsiz, hızsız yere yatar; hız 0 iken yatamaz; 100 komut yok', () => {
    const s = field(NEW, { A: o(3, 3) });
    const r = run(s, { type: 'drop_prone', actorId: 'A' });
    const a = r.state.combatants.A as Combatant;
    expect(a.conditions).toContain('Prone');
    expect(a.economy.action).toBe(false);
    expect(a.movementUsed).toBe(0);
    replays(s, r);
    const held = field(NEW, { A: o(3, 3), B: o(4, 3) }, { A: { conditions: ['Grappled'], grapple: { by: 'B', escapeDc: 12, restrained: false } } });
    expect(execute(held, { type: 'drop_prone', actorId: 'A' }, P1, () => 0.5).ok).toBe(false);
    expect(execute(field(OLD, { A: o(3, 3) }), { type: 'drop_prone', actorId: 'A' }, P1, () => 0.5).ok).toBe(false);
  });
});
