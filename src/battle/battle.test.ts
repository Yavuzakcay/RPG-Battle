import { describe, it, expect } from 'vitest';
import { applyEvents, combatantFromMonster, combatantFromSheet, execute, replay, startBattle } from './index';
import type { AttackOption, BattleState, Combatant, CommandContext } from './index';
import { getMonster } from '../data';
import type { Rng } from '../rules/dice';
import { GM, P1, P2, advanceTo, envId, mk, scripted, setup, sword } from './fixtures';

describe('startBattle', () => {
  it('initiative atar ve yüksekten düşüğe sıralar', () => {
    const s = setup();
    expect(s.order).toEqual(['C', 'B', 'A']);
    expect(s.combatants.C?.initiative).toBe(16);
    expect(s.combatants.A?.initiative).toBe(12);
    expect(s.round).toBe(1);
    expect(s.turnIndex).toBe(0);
    expect(s.status).toBe('active');
  });
  it('eşit toplamda listedeki ilk savaşçı önce gelir', () => {
    const s = startBattle('b', envId('Düz'), [mk('X'), mk('Y')], scripted([20, 10], [20, 10])).state;
    expect(s.order).toEqual(['X', 'Y']);
  });
});

describe('yetkiler', () => {
  it('oyuncu başkasının karakterini yönetemez', () => {
    const s = setup();
    const r = execute(s, { type: 'end_turn', actorId: 'C' }, P1, scripted());
    expect(r.ok).toBe(false);
  });
  it('GM oyuncu karakterini yönetemez, düşmanı yönetir', () => {
    const s = setup();
    expect(execute(s, { type: 'end_turn', actorId: 'C' }, GM, scripted()).ok).toBe(false);
    const s2 = advanceTo(s, 'B');
    expect(execute(s2, { type: 'end_turn', actorId: 'B' }, GM, scripted()).ok).toBe(true);
  });
  it('sırası gelmeyen savaşçı hareket edemez', () => {
    const s = setup(); // sıra C'de
    const r = execute(s, { type: 'change_height', actorId: 'A', toHeight: -1 }, P1, scripted());
    expect(r.ok).toBe(false);
  });
  it('oyuncu sırası gelince kendi karakteriyle işlem yapabilir', () => {
    const r = execute(setup(), { type: 'end_turn', actorId: 'C' }, P2, scripted());
    expect(r.ok).toBe(true);
  });
});

describe('saldırı', () => {
  it('isabette hasar uygulanır ve durum güncellenir', () => {
    const s = advanceTo(setup(), 'A');
    const r = execute(s, { type: 'attack', actorId: 'A', targetId: 'B', option: sword }, P1, scripted([20, 12], [8, 4]));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const ev = r.events[0];
    expect(ev?.type).toBe('attack_resolved');
    expect(r.state.combatants.B?.hp).toBe(13); // 20 - (4 + 3)
    expect(s.combatants.B?.hp).toBe(20); // eski durum değişmez
  });
  it('ıskada hasar yok', () => {
    const s = advanceTo(setup(), 'A');
    const r = execute(s, { type: 'attack', actorId: 'A', targetId: 'B', option: sword }, P1, scripted([20, 2]));
    if (!r.ok) throw new Error(r.error);
    expect(r.state.combatants.B?.hp).toBe(20);
  });
  it('buzulda ateş büyüsü dezavantajlı atılır ve nedeni olayda yer alır', () => {
    const s = advanceTo(setup('Buzul'), 'A');
    const fire: AttackOption = {
      label: 'Fire Bolt', attackBonus: 6, damage: '1d10', damageType: 'fire',
      ranged: true, spell: true, tag: 'elf wizard fire bolt 120 ft 1d10 fire',
    };
    const r = execute(s, { type: 'attack', actorId: 'A', targetId: 'B', option: fire }, P1, scripted([20, 18], [20, 6], [10, 7]));
    if (!r.ok) throw new Error(r.error);
    const ev = r.events[0];
    if (!ev || ev.type !== 'attack_resolved') throw new Error('beklenmeyen olay');
    expect(ev.mode).toBe('disadvantage');
    expect(ev.natural).toBe(6); // iki zardan düşüğü
    expect(ev.reasons.includes('Soğuk ateşi bastırır')).toBe(true);
  });
  it('yüksek zeminden saldırı avantajlıdır', () => {
    const s = advanceTo(setup('Düz', { A: { height: 1 } }), 'A');
    const r = execute(s, { type: 'attack', actorId: 'A', targetId: 'B', option: sword }, P1, scripted([20, 3], [20, 16], [8, 4]));
    if (!r.ok) throw new Error(r.error);
    const ev = r.events[0];
    if (!ev || ev.type !== 'attack_resolved') throw new Error('beklenmeyen olay');
    expect(ev.mode).toBe('advantage');
    expect(ev.natural).toBe(16);
  });
  it('zayıflık hasarı iki katına çıkarır', () => {
    const s = advanceTo(setup('Düz', { B: { vulnerabilities: ['slashing'] } }), 'A');
    const r = execute(s, { type: 'attack', actorId: 'A', targetId: 'B', option: sword }, P1, scripted([20, 12], [8, 2]));
    if (!r.ok) throw new Error(r.error);
    const ev = r.events[0];
    if (!ev || ev.type !== 'attack_resolved') throw new Error('beklenmeyen olay');
    expect(ev.rawDamage).toBe(5);
    expect(ev.appliedDamage).toBe(10);
    expect(ev.damageNote).toBe('vulnerable');
    expect(r.state.combatants.B?.hp).toBe(10);
  });
  it('aksiyon yapamayan savaşçı saldıramaz', () => {
    const s = advanceTo(setup('Düz', { A: { conditions: ['Stunned'] } }), 'A');
    const r = execute(s, { type: 'attack', actorId: 'A', targetId: 'B', option: sword }, P1, scripted());
    expect(r.ok).toBe(false);
  });
  it('düşmüş hedefe ve kendine saldırılamaz', () => {
    const s = advanceTo(setup('Düz', { B: { hp: 0 } }), 'A');
    expect(execute(s, { type: 'attack', actorId: 'A', targetId: 'B', option: sword }, P1, scripted()).ok).toBe(false);
    expect(execute(s, { type: 'attack', actorId: 'A', targetId: 'A', option: sword }, P1, scripted()).ok).toBe(false);
  });
  it('son düşman düşünce savaş biter ve kazanan belli olur', () => {
    const s = advanceTo(setup('Düz', { B: { hp: 3 } }), 'A');
    const r = execute(s, { type: 'attack', actorId: 'A', targetId: 'B', option: sword }, P1, scripted([20, 12], [8, 4]));
    if (!r.ok) throw new Error(r.error);
    expect(r.events.map((e) => e.type)).toEqual(['attack_resolved', 'battle_finished', 'action_used']);
    expect(r.state.status).toBe('finished');
    expect(r.state.winner).toBe('party');
    expect(execute(r.state, { type: 'end_turn', actorId: 'A' }, P1, scripted()).ok).toBe(false);
  });
});

describe('konum değiştirme', () => {
  it('yukarı çıkmak zar kontrolü ister: başarılı', () => {
    const s = advanceTo(setup(), 'A'); // climbMod 2, DC 12
    const r = execute(s, { type: 'change_height', actorId: 'A', toHeight: 1 }, P1, scripted([20, 10]));
    if (!r.ok) throw new Error(r.error);
    expect(r.state.combatants.A?.height).toBe(1);
  });
  it('yukarı çıkmak: başarısız olursa konum değişmez', () => {
    const s = advanceTo(setup(), 'A');
    const r = execute(s, { type: 'change_height', actorId: 'A', toHeight: 1 }, P1, scripted([20, 9]));
    if (!r.ok) throw new Error(r.error);
    expect(r.state.combatants.A?.height).toBe(0);
    const ev = r.events[0];
    if (!ev || ev.type !== 'height_changed') throw new Error('beklenmeyen olay');
    expect(ev.moved).toBe(false);
    expect(ev.check?.dc).toBe(12);
  });
  it('iki seviye çıkmak DC 15 ister', () => {
    const s = advanceTo(setup('Düz', { A: { height: -1 } }), 'A');
    const r = execute(s, { type: 'change_height', actorId: 'A', toHeight: 1 }, P1, scripted([20, 10]));
    if (!r.ok) throw new Error(r.error);
    const ev = r.events[0];
    if (!ev || ev.type !== 'height_changed') throw new Error('beklenmeyen olay');
    expect(ev.check?.dc).toBe(15);
    expect(ev.moved).toBe(false); // 10 + 2 = 12 < 15
  });
  it('aşağı inmek otomatiktir, zar atılmaz', () => {
    const s = advanceTo(setup('Düz', { A: { height: 1 } }), 'A');
    const r = execute(s, { type: 'change_height', actorId: 'A', toHeight: -1 }, P1, scripted());
    if (!r.ok) throw new Error(r.error);
    expect(r.state.combatants.A?.height).toBe(-1);
  });
  it('Restrained savaşçı hareket edemez, aynı konuma geçilemez', () => {
    const s = advanceTo(setup('Düz', { A: { conditions: ['Restrained'] } }), 'A');
    expect(execute(s, { type: 'change_height', actorId: 'A', toHeight: 1 }, P1, scripted()).ok).toBe(false);
    const s2 = advanceTo(setup(), 'A');
    expect(execute(s2, { type: 'change_height', actorId: 'A', toHeight: 0 }, P1, scripted()).ok).toBe(false);
  });
});

describe('sıra', () => {
  it('düşmüş savaşçıyı atlar ve sıra sonunda tur sayısını artırır', () => {
    // Sıra: B (düşman), D (düşman, düşmüş), A (oyuncu)
    const parts = [
      mk('A', { ownerId: 'p1' }),
      mk('B', { side: 'enemies' }),
      mk('D', { side: 'enemies', hp: 0 }),
    ];
    let s = startBattle('b', envId('Düz'), parts, scripted([20, 2], [20, 20], [20, 19])).state;
    expect(s.order).toEqual(['B', 'D', 'A']);
    let r = execute(s, { type: 'end_turn', actorId: 'B' }, GM, scripted());
    if (!r.ok) throw new Error(r.error);
    s = r.state;
    expect(s.order[s.turnIndex]).toBe('A'); // D atlandı
    expect(s.round).toBe(1);
    r = execute(s, { type: 'end_turn', actorId: 'A' }, P1, scripted());
    if (!r.ok) throw new Error(r.error);
    expect(r.state.order[r.state.turnIndex]).toBe('B');
    expect(r.state.round).toBe(2);
  });
});

describe('olaylardan yeniden kurma', () => {
  it('tüm olaylar tekrar oynatılınca aynı durum çıkar', () => {
    const start = startBattle('b', envId('Buzul'), [
      mk('A', { ownerId: 'p1', initiativeBonus: 2 }), mk('B', { side: 'enemies' }),
    ], scripted([20, 10], [20, 5]));
    let state = start.state;
    const all = [...start.events];
    const run = (cmd: Parameters<typeof execute>[1], ctx: CommandContext, rng: Rng) => {
      const r = execute(state, cmd, ctx, rng);
      if (!r.ok) throw new Error(r.error);
      state = r.state;
      all.push(...r.events);
    };
    run({ type: 'attack', actorId: 'A', targetId: 'B', option: sword }, P1, scripted([20, 14], [8, 5]));
    run({ type: 'end_turn', actorId: 'A' }, P1, scripted());
    run({ type: 'attack', actorId: 'B', targetId: 'A', option: sword }, GM, scripted([20, 11], [8, 2]));
    run({ type: 'end_turn', actorId: 'B' }, GM, scripted());
    expect(replay(all)).toEqual(state);
    expect(applyEvents(start.state, all.slice(1))).toEqual(state);
  });
  it('replay ilk olay battle_started değilse hata verir', () => {
    expect(() => replay([])).toThrow();
  });
});

describe('verilerden savaşçı oluşturma', () => {
  it('karakter formu ve canavar şablonundan savaşçı kurar', () => {
    const mira = combatantFromSheet({
      name: 'Mira', raceId: 'elf', classId: 'wizard', level: 5,
      baseScores: { str: 8, dex: 14, con: 14, int: 16, wis: 10, cha: 10 }, backgroundBonuses: { dex: 2, int: 1 },
      armorName: 'Zırhsız', shield: false, itemNames: [],
    }, { id: 'mira', ownerId: 'p1', height: 1 });
    expect(mira.ac).toBe(13);
    expect(mira.maxHp).toBe(32);
    expect(mira.ownerId).toBe('p1');
    expect(mira.height).toBe(1);
    expect(mira.spellSlots).toEqual([4, 3, 2, 0, 0, 0, 0, 0, 0]);

    const troll = combatantFromMonster(getMonster('troll'), { id: 't1', name: 'Troll 1' });
    expect(troll.side).toBe('enemies');
    expect(troll.hp).toBe(94);
    expect(troll.name).toBe('Troll 1');

    const skeleton = combatantFromMonster(getMonster('skeleton'), { id: 's1' });
    expect(skeleton.vulnerabilities).toEqual(['bludgeoning']);
    const wolf = combatantFromMonster(getMonster('wolf'), { id: 'w1' });
    expect(wolf.packTactics).toBe(true);
  });
  it('Dwarf poison, Tiefling (varsayılan Infernal) fire, Celestial necrotic/radiant direncine sahiptir', () => {
    const base = { name: 'X', level: 1, baseScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      armorName: 'Zırhsız', shield: false, itemNames: [] };
    const dwarf = combatantFromSheet({ ...base, raceId: 'dwarf', classId: 'fighter' }, { id: 'd', ownerId: 'p' });
    const celestial = combatantFromSheet({ ...base, raceId: 'celestial', classId: 'cleric' }, { id: 'a', ownerId: 'p' });
    const tiefling = combatantFromSheet({ ...base, raceId: 'tiefling', classId: 'warlock' }, { id: 't', ownerId: 'p' });
    expect(dwarf.resistances).toEqual(['poison']);
    expect(tiefling.resistances).toEqual(['fire']);
    expect(celestial.resistances).toEqual(['necrotic', 'radiant']);
  });
  it('Tiefling ve Dragonborn direnci seçilen mirastan gelir', () => {
    const base = { name: 'X', level: 1, baseScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      armorName: 'Zırhsız', shield: false, itemNames: [], classId: 'warlock' };
    const of = (raceId: string, lineageId: string) =>
      combatantFromSheet({ ...base, raceId, lineageId }, { id: 'x', ownerId: 'p' }).resistances;
    expect(of('tiefling', 'abyssal')).toEqual(['poison']);
    expect(of('tiefling', 'chthonic')).toEqual(['necrotic']);
    expect(of('tiefling', 'infernal')).toEqual(['fire']);
    expect(of('dragonborn', 'silver')).toEqual(['cold']);
    expect(() => of('tiefling', 'yok')).toThrow();
    expect(() => of('dwarf', 'abyssal')).toThrow();
  });
});
