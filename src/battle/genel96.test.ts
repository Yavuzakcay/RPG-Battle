/**
 * Görev GENEL96 (kural sürümü 96): genel savaş denetiminin (harita/belgeler/GENEL-SAVAS-DENETIM.md) sürümlü düzeltmeleri.
 * Her madde 95'te eski davranış, 96'da SRD 5.2.1; replay aynı durumu verir.
 */
import { describe, expect, it } from 'vitest';
import { execute, replay, startBattle } from './index';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command } from './index';
import { applyEvent, applyEvents } from './reduce';
import { GM, P1, P2, envId, mk, scripted, sword } from './fixtures';
import { GENEL96_VERSION, genel96On } from './genel96Surum';
import { attackCtx96, helpOnlySelf } from './genel96';
import { CURRENT_RULES, checkBase } from './ruleVersion';
import { adjustDamage } from '../rules/damage';
import { damageProfile } from './common';
import { attackSources } from '../rules/conditions';
import { passivePerception, attackRevealEvents } from './stealth';
import { standUpCost } from './grapple';
import { moveCostFn } from './movement';
import { enemyAdjacent } from './range';
import type { Offset } from '../rules/hex';

const NEW = GENEL96_VERSION;
const OLD = GENEL96_VERSION - 1;
const o = (col: number, row: number): Offset => ({ col, row });
type R = ReturnType<typeof execute>;
const ok = (r: R) => { if (!r.ok) throw new Error(r.error); return r; };
const of = <T extends BattleEvent['type']>(evs: BattleEvent[], t: T) => evs.filter((e): e is Extract<BattleEvent, { type: T }> => e.type === t);
const pad = (...xs: Array<[number, number]>) => scripted(...xs, ...Array.from({ length: 60 }, () => [20, 15] as [number, number]));
const ranged: AttackOption = { ...sword, ranged: true, range: [80, 320] };
const OPEN = Array.from({ length: 7 }, () => '.'.repeat(15));

/** Haritasız: sıra E (düşman), A (p1), C (p2). */
function scene(v: number, a: Partial<Combatant> = {}, c: Partial<Combatant> = {}): { s0: BattleState; events: BattleEvent[] } {
  const parts = [mk('E', { side: 'enemies', hp: 40, maxHp: 40 }), mk('A', { ownerId: 'p1', ...a }), mk('C', { ownerId: 'p2', ...c })];
  const r = startBattle('g96', envId('Düz'), parts, scripted([20, 20], [20, 10], [20, 2]), { kuralSurumu: v });
  return { s0: r.state, events: r.events };
}
const dyingA: Partial<Combatant> = { hp: 0, life: 'dying', conditions: ['Unconscious'] };

/** Açık harita; sıra A (p1), B (düşman), C (p2); A'nın turu. */
function field(v: number, pos: Record<string, Offset>, parts: Partial<Record<'A' | 'B' | 'C', Partial<Combatant>>> = {}, tiles = OPEN): BattleState {
  const list = [
    mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, weaponOptions: [sword], ...parts.A }),
    mk('B', { side: 'enemies', ac: 5, hp: 60, maxHp: 60, weaponOptions: [sword], ...parts.B }),
    mk('C', { ownerId: 'p2', weaponOptions: [sword], ...parts.C }),
  ];
  const { state } = startBattle('g96m', 'd-z-zemin', list, scripted([20, 20], [20, 19], [20, 18]), { map: { id: 'volkan' }, kuralSurumu: v });
  const combatants = { ...state.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return { ...state, status: 'active', turnIndex: 0, combatants, map: { ...(state.map as NonNullable<BattleState['map']>), tiles } };
}

describe('GENEL96: sabit', () => {
  it('kural sürümü 96, güncel sürüm en az 96; 95 eski', () => {
    expect(GENEL96_VERSION).toBe(96);
    expect(CURRENT_RULES).toBeGreaterThanOrEqual(GENEL96_VERSION);
    expect(genel96On({ kuralSurumu: 96 })).toBe(true);
    expect(genel96On({ kuralSurumu: 95 })).toBe(false);
  });
  it('savaşçılar sürüm işaretini (srd96) yalnız 96+ taşır', () => {
    expect(scene(NEW).s0.combatants.A?.srd96).toBe(true);
    expect(scene(OLD).s0.combatants.A?.srd96).toBeUndefined();
  });
});

describe('GENEL96 A1: ölüm save\'iyle stabil olunca sayaçlar sıfırlanır (SRD s. 17–18)', () => {
  const run = (v: number) => {
    const { s0 } = scene(v, { ...dyingA, deathSaves: { successes: 2, failures: 2 } });
    const st = ok(execute(s0, { type: 'end_turn', actorId: 'E' }, GM, scripted([20, 14])));
    const atE = ok(execute(st.state, { type: 'end_turn', actorId: 'C' }, P2, pad()));
    const hit = ok(execute(atE.state, { type: 'attack', actorId: 'E', targetId: 'A', option: ranged }, GM, scripted([20, 15], [8, 2])));
    return { s0, stable: st.state.combatants.A as Combatant, after: hit.state.combatants.A as Combatant, events: [...st.events, ...atE.events, ...hit.events], end: hit.state };
  };
  it('96: stabil 0/0; stabilken hasar 1 başarısızlıkla yeniden ölmekte', () => {
    const r = run(NEW);
    expect(r.stable.life).toBe('stable');
    expect(r.stable.deathSaves).toEqual({ successes: 0, failures: 0 });
    expect(r.after.life).toBe('dying');
    expect(r.after.deathSaves.failures).toBe(1);
  });
  it('95: sayaçlar kalır, aynı hasar öldürür', () => {
    const r = run(OLD);
    expect(r.stable.deathSaves).toEqual({ successes: 3, failures: 2 });
    expect(r.after.life).toBe('dead');
  });
  it('replay aynı durum', () => {
    const r = run(NEW);
    expect(replay([{ type: 'battle_started', state: r.s0 }, ...r.events])).toEqual(r.end);
  });
});

describe('GENEL96 A2: Unconscious = Incapacitated + Prone (SRD s. 191)', () => {
  const drop = (v: number) => {
    const { s0 } = scene(v, { hp: 5, maxHp: 20 });
    return ok(execute(s0, { type: 'attack', actorId: 'E', targetId: 'A', option: sword }, GM, scripted([20, 15], [8, 6])));
  };
  it('96: 0 HP\'ye düşen Prone da olur; uzaktan saldırı avantaj + dezavantaj = normal; uyanınca Prone kalır', () => {
    const r = drop(NEW);
    expect(r.state.combatants.A?.conditions).toEqual(expect.arrayContaining(['Unconscious', 'Prone']));
    // Sıra E'de kaldı (saldırı); ikinci saldırı hakkı yok: durumu doğrudan kullan.
    const s = { ...r.state, combatants: { ...r.state.combatants, E: { ...(r.state.combatants.E as Combatant), economy: { ...(r.state.combatants.E as Combatant).economy, action: false, attacksLeft: 0 } } } };
    const shot = ok(execute(s, { type: 'attack', actorId: 'E', targetId: 'A', option: ranged }, GM, scripted([20, 3], [20, 3])));
    expect(of(shot.events, 'attack_resolved')[0]?.mode).toBe('normal');
    const healed = applyEvent(r.state, { type: 'healed', actorId: 'C', targetId: 'A', amount: 5, targetHpAfter: 5, label: 'test' } as never);
    expect(healed.combatants.A?.conditions).toContain('Prone');
    expect(healed.combatants.A?.conditions).not.toContain('Unconscious');
  });
  it('95: yalnız Unconscious; uzaktan saldırı avantajlı', () => {
    const r = drop(OLD);
    expect(r.state.combatants.A?.conditions).not.toContain('Prone');
    const s = { ...r.state, combatants: { ...r.state.combatants, E: { ...(r.state.combatants.E as Combatant), economy: { ...(r.state.combatants.E as Combatant).economy, action: false, attacksLeft: 0 } } } };
    const shot = ok(execute(s, { type: 'attack', actorId: 'E', targetId: 'A', option: ranged }, GM, scripted([20, 3], [20, 3])));
    expect(of(shot.events, 'attack_resolved')[0]?.mode).toBe('advantage');
  });
  it('Prone\'a bağışık olana Prone eklenmez; replay aynı', () => {
    const { s0, events } = scene(NEW, { hp: 5, maxHp: 20, effects: [{ id: 'imm', name: 'imm', sourceId: 'A', immune: ['Prone'] } as never] });
    const r = ok(execute(s0, { type: 'attack', actorId: 'E', targetId: 'A', option: sword }, GM, scripted([20, 15], [8, 6])));
    expect(r.state.combatants.A?.conditions).not.toContain('Prone');
    const d = drop(NEW);
    expect(replay([...events.slice(0, 0), { type: 'battle_started', state: scene(NEW, { hp: 5, maxHp: 20 }).s0 }, ...d.events])).toEqual(d.state);
  });
});

describe('GENEL96 A3: önce direnç, sonra zayıflık (SRD s. 17)', () => {
  it('saf: srdOrder ile 10 → 5 → 10; işaretsiz (95) ×2', () => {
    expect(adjustDamage(10, 'fire', { resistances: ['fire'], vulnerabilities: ['fire'], srdOrder: true }).amount).toBe(10);
    expect(adjustDamage(11, 'fire', { resistances: ['fire'], vulnerabilities: ['fire'], srdOrder: true }).amount).toBe(10);
    expect(adjustDamage(10, 'fire', { resistances: ['fire'], vulnerabilities: ['fire'] }).amount).toBe(20);
    expect(adjustDamage(10, 'fire', { vulnerabilities: ['fire'], srdOrder: true }).amount).toBe(20);
  });
  it('savaşçı profili: 96 SRD sırası, 95 eski', () => {
    const p = { resistances: ['fire'], vulnerabilities: ['fire'] };
    expect(adjustDamage(10, 'fire', damageProfile(scene(NEW, p).s0.combatants.A as Combatant)).amount).toBe(10);
    expect(adjustDamage(10, 'fire', damageProfile(scene(OLD, p).s0.combatants.A as Combatant)).amount).toBe(20);
  });
});

describe('GENEL96 A4: Poisoned kontrolde dezavantaj; pasif Algı ±5 (SRD s. 186)', () => {
  it('checkBase: 96 dezavantaj, 95 normal', () => {
    const n = scene(NEW, { conditions: ['Poisoned'] }).s0;
    const old = scene(OLD, { conditions: ['Poisoned'] }).s0;
    expect(checkBase(n, n.combatants.A as Combatant)).toBe('disadvantage');
    expect(checkBase(old, old.combatants.A as Combatant)).toBe('normal');
  });
  it('pasif Algı: Poisoned −5, Algı avantajı +5 (96); 95 değişmez', () => {
    const base = (v: number, a: Partial<Combatant>) => { const s = field(v, { A: o(3, 3), B: o(8, 3), C: o(2, 5) }, { B: a }); return passivePerception(s, s.combatants.B as Combatant, o(3, 3)); };
    const plain = base(NEW, {});
    expect(base(NEW, { conditions: ['Poisoned'] })).toBe(plain - 5);
    expect(base(NEW, { effects: [{ id: 'ea', name: 'Enhance Ability', sourceId: 'B', checkAdv: ['wis'] } as never] })).toBe(plain + 5);
    expect(base(OLD, { conditions: ['Poisoned'] })).toBe(base(OLD, {}));
  });
});

describe('GENEL96 A5: Petrified, Exhaustion ve Prone bağışıklığı (SRD s. 184, 186)', () => {
  it('Petrified: bütün hasara direnç ve Poisoned bağışıklığı (96); 95 yok', () => {
    const n = scene(NEW, { conditions: ['Petrified'] }).s0;
    const old = scene(OLD, { conditions: ['Petrified'] }).s0;
    expect(adjustDamage(7, 'slashing', damageProfile(n.combatants.A as Combatant)).amount).toBe(3);
    expect(adjustDamage(7, 'slashing', damageProfile(old.combatants.A as Combatant)).amount).toBe(7);
    const pois = { type: 'condition_changed', targetId: 'A', condition: 'Poisoned', present: true, reason: 't' } as BattleEvent;
    expect(applyEvent(n, pois).combatants.A?.conditions).not.toContain('Poisoned');
    expect(applyEvent(old, pois).combatants.A?.conditions).toContain('Poisoned');
  });
  it('Exhaustion bağışıklığı seviye kazandırmaz (96); 95 kazandırır', () => {
    const imm = { effects: [{ id: 'z', name: 'Zombie', sourceId: 'A', immune: ['Exhaustion'] } as never] };
    const ev = { type: 'exhaustion_changed', targetId: 'A', level: 1, reason: 't' } as BattleEvent;
    expect(applyEvent(scene(NEW, imm).s0, ev).combatants.A?.exhaustion ?? 0).toBe(0);
    expect(applyEvent(scene(OLD, imm).s0, ev).combatants.A?.exhaustion).toBe(1);
  });
  it('Shove Prone bağışık hedefi düşürmez (96); 95 düşürür', () => {
    const imm = { effects: [{ id: 'p', name: 'imm', sourceId: 'A', immune: ['Prone'] } as never] };
    const ev = { type: 'shove_resolved', actorId: 'E', targetId: 'A', effect: 'prone', success: false } as unknown as BattleEvent;
    expect(applyEvent(scene(NEW, imm).s0, ev).combatants.A?.conditions).not.toContain('Prone');
    expect(applyEvent(scene(OLD, imm).s0, ev).combatants.A?.conditions).toContain('Prone');
  });
});

describe('GENEL96 A6: saldırı zarı atan gizlenmiş açığa çıkar (SRD s. 183)', () => {
  it('komut dışı saldırı (bonus vuruş, tepki): 96 revealed, 95 yok', () => {
    const hide = (v: number) => { const s = scene(v).s0; return { ...s, combatants: { ...s.combatants, A: { ...(s.combatants.A as Combatant), hidden: { dc: 15 } as never } } }; };
    const evs = [{ type: 'attack_resolved', actorId: 'A', targetId: 'E' } as unknown as BattleEvent];
    expect(attackRevealEvents(hide(NEW), hide(NEW), evs)).toEqual([{ type: 'revealed', actorId: 'A', reason: 'saldırdı' }]);
    expect(attackRevealEvents(hide(OLD), hide(OLD), evs)).toEqual([]);
    expect(attackRevealEvents(hide(NEW), hide(NEW), evs, 'A')).toEqual([]);
  });
});

describe('GENEL96 A7: Ready hareketi kendi turunun Disengage/Dash\'ini taşımaz (SRD s. 181, 186)', () => {
  const play = (v: number) => {
    let s = field(v, { A: o(3, 3), B: o(8, 3), C: o(2, 6) }, { A: { bonusActions: ['disengage'] } });
    s = ok(execute(s, { type: 'disengage', actorId: 'A', bonus: true } as Command, P1, pad())).state;
    s = ok(execute(s, { type: 'ready', actorId: 'A', trigger: 'erisime-girer', response: { kind: 'move', to: o(1, 1) } }, P1, pad())).state;
    s = ok(execute(s, { type: 'end_turn', actorId: 'A' }, P1, pad())).state;
    return ok(execute(s, { type: 'move', actorId: 'B', to: o(4, 3) }, GM, pad()));
  };
  it('96: tepkiyle uzaklaşan fırsat saldırısı alır; 95: Disengage taşınır', () => {
    const oa = (r: R) => of(r.ok ? r.events : [], 'attack_resolved').some((e) => e.actorId === 'B' && e.opportunity);
    expect(oa(play(NEW))).toBe(true);
    expect(oa(play(OLD))).toBe(false);
  });
});

describe('GENEL96 A8: Tiny ve iki boy farklı düşmanın altıgeninden geçiş (SRD s. 14)', () => {
  it('Tiny: geçilir, zorlu değil; Huge (M için iki boy): zorlu; Large geçilmez; 95 hepsi kapalı', () => {
    const cost = (v: number, size: Combatant['size']) => { const s = field(v, { A: o(3, 3), B: o(4, 3), C: o(2, 6) }, { B: { size } }); return moveCostFn(s, s.combatants.A as Combatant)(o(4, 3), o(3, 3)); };
    expect(cost(NEW, 'T')).toBe(1);
    expect(cost(NEW, 'H')).toBe(2);
    expect(cost(NEW, 'L')).toBeNull();
    expect(cost(OLD, 'T')).toBeNull();
    expect(cost(OLD, 'H')).toBeNull();
  });
  it('dolu altıgende durulamaz', () => {
    const s = field(NEW, { A: o(3, 3), B: o(4, 3), C: o(2, 6) }, { B: { size: 'T' } });
    expect(execute(s, { type: 'move', actorId: 'A', to: o(4, 3) }, P1, pad()).ok).toBe(false);
    expect(ok(execute(s, { type: 'move', actorId: 'A', to: o(5, 3) }, P1, pad())).state.combatants.A?.pos).toEqual(o(5, 3));
  });
});

describe('GENEL96 A9: stabilize (SRD s. 7, 18) ve Spare the Dying (s. 163)', () => {
  const stab = (v: number, nat: number) => {
    const { s0 } = scene(v, dyingA, { modifiers: { str: 0, dex: 0, con: 0, int: 0, wis: 9, cha: 0 } });
    const atC = ok(execute(s0, { type: 'end_turn', actorId: 'E' }, GM, scripted([20, 12]))).state;
    return ok(execute(atC, { type: 'stabilize', actorId: 'C', targetId: 'A' }, P2, scripted([20, nat])));
  };
  it('doğal 1 + 9 = 10: 96 başarılı, 95 başarısız', () => {
    expect(stab(NEW, 1).state.combatants.A?.life).toBe('stable');
    expect(stab(OLD, 1).state.combatants.A?.life).toBe('dying');
  });
  it('Spare the Dying: 5. seviyede 30 ft (96); 95 15 ft', () => {
    const cleric: Partial<Combatant> = { level: 5, spellNames: ['Spare the Dying'], spellMod: 3, spellSaveDc: 13 };
    const cast = (v: number) => {
      const s = field(v, { A: o(3, 3), B: o(12, 0), C: o(8, 3) }, { A: cleric, C: { hp: 0, life: 'dying', conditions: ['Unconscious', 'Prone'] } });
      return execute(s, { type: 'cast_spell', actorId: 'A', spellName: 'Spare the Dying', targetId: 'C' }, P1, pad());
    };
    expect(cast(NEW).ok).toBe(true);
    expect(cast(OLD).ok).toBe(false);
  });
});

describe('GENEL96 10: Dodge, Yardım, kalkma, Long Jump, menzilli bitişik, Stonecunning', () => {
  it('Kaçınan Blinded: Kaçın dezavantajı yok (96); 95 var', () => {
    const t = (v: number) => { const s = scene(v, { conditions: ['Dodge', 'Blinded'] }).s0; return { s, ctx: attackCtx96(s, s.combatants.E as Combatant, s.combatants.A as Combatant) }; };
    const reasons = (v: number) => {
      const { s, ctx } = t(v);
      return attackSources({ attackerConditions: [], targetConditions: (s.combatants.A as Combatant).conditions, attackerHeight: 0, targetHeight: 0, ranged: false, spell: false, ...ctx }).map((x) => x.reason);
    };
    expect(reasons(NEW)).not.toContain('Hedef kaçınıyor');
    expect(reasons(OLD)).toContain('Hedef kaçınıyor');
  });
  it('Yardım eden kendi saldırısında yararlanmaz (96); dostu yararlanır', () => {
    const mark = (v: number): BattleState => { const s = scene(v).s0; return { ...s, combatants: { ...s.combatants, E: { ...(s.combatants.E as Combatant), conditions: ['Help:party'], conditionTimers: [{ condition: 'Help:party', ownerId: 'A', end: 'turnStart' as const, count: 1, label: 'A: Yardım', sourceId: 'A' }] } } }; };
    const s = mark(NEW);
    expect(helpOnlySelf(s, s.combatants.A as Combatant, s.combatants.E as Combatant)).toBe(true);
    expect(attackCtx96(s, s.combatants.A as Combatant, s.combatants.E as Combatant).attackerSide).toBeUndefined();
    expect(attackCtx96(s, s.combatants.C as Combatant, s.combatants.E as Combatant).attackerSide).toBe('party');
    const old = mark(OLD);
    expect(attackCtx96(old, old.combatants.A as Combatant, old.combatants.E as Combatant).attackerSide).toBe('party');
  });
  it('kalkma şu anki hızın yarısı (Exhaustion 2: 20 ft → 2 altıgen); 95 temel hızdan 3', () => {
    expect(standUpCost(scene(NEW, { exhaustion: 2, conditions: ['Prone'] }).s0.combatants.A as Combatant)).toBe(2);
    expect(standUpCost(scene(OLD, { exhaustion: 2, conditions: ['Prone'] }).s0.combatants.A as Combatant)).toBe(3);
  });
  it('Long Jump zorlu araziye iniş: DC 10 Akrobasi, başarısızsa Prone (96); 95 zarsız', () => {
    const tiles = OPEN.map((row, r) => (r === 4 ? `${row.slice(0, 3)}t${row.slice(4)}` : row));
    const jump = (v: number) => {
      const s = field(v, { A: o(3, 1), B: o(12, 0), C: o(8, 6) }, { A: { strScore: 20 } }, tiles);
      return ok(execute(s, { type: 'jump', actorId: 'A', to: o(3, 4) }, P1, scripted([20, 1], [20, 1])));
    };
    const n = jump(NEW);
    expect(of(n.events, 'skill_checked')[0]?.skill).toBe('acrobatics');
    expect(n.state.combatants.A?.conditions).toContain('Prone');
    const old = jump(OLD);
    expect(of(old.events, 'skill_checked')).toHaveLength(0);
    expect(old.state.combatants.A?.conditions).not.toContain('Prone');
  });
  it('menzilli: yanındaki Blinded düşman dezavantaj vermez (96); 95 verir', () => {
    const adj = (v: number) => { const s = field(v, { A: o(3, 3), B: o(4, 3), C: o(2, 6) }, { B: { conditions: ['Blinded'] } }); return enemyAdjacent(s, s.combatants.A as Combatant); };
    expect(adj(NEW)).toBe(false);
    expect(adj(OLD)).toBe(true);
  });
  it('olaylar baştan oynatılınca aynı durum (Long Jump + kalkma)', () => {
    const tiles = OPEN.map((row, r) => (r === 4 ? `${row.slice(0, 3)}t${row.slice(4)}` : row));
    const s0 = field(NEW, { A: o(3, 1), B: o(12, 0), C: o(8, 6) }, { A: { strScore: 20 } }, tiles);
    const r = ok(execute(s0, { type: 'jump', actorId: 'A', to: o(3, 4) }, P1, scripted([20, 1], [20, 1])));
    expect(applyEvents(s0, r.events)).toEqual(r.state);
  });
});
