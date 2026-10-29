import { describe, it, expect } from 'vitest';
import { execute, replay, startBattle } from './index';
import type { BattleEvent, BattleState, Command, CommandContext } from './index';
import { spells } from '../data';
import srdSpells from '../../data/srd/spells.json';
import type { Rng } from '../rules/dice';
import { GM, P1, advanceTo, dice, envId, mk, scripted } from './fixtures';

const KNOWN = ['Fire Bolt', 'Eldritch Blast', 'Fireball', 'Sacred Flame', 'Magic Missile', 'Cure Wounds',
  'Hold Person', 'Sleep', 'Mage Armor', 'Shocking Grasp'];

/** A: seviye 5 büyücü (slotlar 4/3/2), B: 40 HP düşman, C: ikinci oyuncu. Sıra A'da. */
function caster(env = 'Düz', a: Record<string, unknown> = {}, b: Record<string, unknown> = {}): BattleState {
  const parts = [
    mk('A', {
      ownerId: 'p1', initiativeBonus: 2, level: 5, spellMod: 4, spellSaveDc: 14, spellAttack: 6,
      spellNames: KNOWN, casterTag: 'elf wizard', spellSlots: [4, 3, 2, 0, 0, 0, 0, 0, 0], hp: 20, ...a,
    }),
    mk('B', { side: 'enemies', hp: 40, maxHp: 40, ...b }),
    mk('C', { ownerId: 'p2', initiativeBonus: 1 }),
  ];
  const s = startBattle('b1', envId(env), parts, scripted([20, 10], [20, 15], [20, 15])).state;
  return advanceTo(s, 'A');
}

function cast(s: BattleState, spellName: string, targetId: string | undefined, rng: Rng, slotLevel?: number,
  ctx: CommandContext = P1) {
  const cmd: Command = { type: 'cast_spell', actorId: 'A', spellName, slotLevel, ...(targetId ? { targetId } : {}) };
  return execute(s, cmd, ctx, rng);
}

function ok(r: ReturnType<typeof execute>) {
  if (!r.ok) throw new Error(r.error);
  return r;
}
/** Olay türleri; eylem ekonomisi olayı (`action_used`, economy.test.ts) dışarıda. */
const types = (events: BattleEvent[]) => events.filter((e) => e.type !== 'action_used').map((e) => e.type);

describe('büyü saldırısı: dokunma yakın dövüş, diğerleri menzilli', () => {
  const attackEvent = (r: ReturnType<typeof execute>) => {
    const ev = ok(r).events[0];
    if (!ev || ev.type !== 'attack_resolved') throw new Error('beklenmeyen olay');
    return ev;
  };
  it('yerdeki hedefe Fire Bolt (120 ft) dezavantajlı, Shocking Grasp (dokunma) avantajlı', () => {
    const far = attackEvent(cast(caster('Düz', {}, { conditions: ['Prone'] }), 'Fire Bolt', 'B',
      scripted([20, 12], [20, 3], ...dice(10, 1, 1))));
    expect(far.mode).toBe('disadvantage');
    expect(far.reasons).toContain('Hedef yerde (uzaktan)');
    const touch = attackEvent(cast(caster('Düz', {}, { conditions: ['Prone'] }), 'Shocking Grasp', 'B',
      scripted([20, 12], [20, 3], ...dice(8, 1, 1))));
    expect(touch.mode).toBe('advantage');
  });
  it('baygın hedefe yalnızca dokunma büyüsü otomatik kritik vurur', () => {
    const far = attackEvent(cast(caster('Düz', {}, { conditions: ['Unconscious'] }), 'Fire Bolt', 'B',
      scripted([20, 12], [20, 12], ...dice(10, 1, 1))));
    expect(far.critical).toBe(false);
    const touch = attackEvent(cast(caster('Düz', {}, { conditions: ['Unconscious'] }), 'Shocking Grasp', 'B',
      scripted([20, 12], [20, 12], ...dice(8, 1, 1, 1, 1))));
    expect(touch.critical).toBe(true);
  });
});

describe('saldırı büyüleri', () => {
  it('Fire Bolt 5. seviyede 2d10 atar, slot harcamaz', () => {
    const r = ok(cast(caster(), 'Fire Bolt', 'B', scripted([20, 12], [10, 4], [10, 6])));
    expect(types(r.events)).toEqual(['attack_resolved']);
    expect(r.state.combatants.B?.hp).toBe(30); // 40 - (4 + 6)
    expect(r.state.combatants.A?.spellSlots).toEqual([4, 3, 2, 0, 0, 0, 0, 0, 0]);
  });
  it('buzulda ateş büyüsü dezavantajlı atılır', () => {
    const r = ok(cast(caster('Buzul'), 'Fire Bolt', 'B', scripted([20, 18], [20, 6], [10, 3], [10, 3])));
    const ev = r.events[0];
    if (!ev || ev.type !== 'attack_resolved') throw new Error('beklenmeyen olay');
    expect(ev.mode).toBe('disadvantage');
    expect(ev.natural).toBe(6);
    expect(ev.reasons.includes('Soğuk ateşi bastırır')).toBe(true);
  });
  it('ıskada hasar yok', () => {
    const r = ok(cast(caster(), 'Fire Bolt', 'B', scripted([20, 2])));
    expect(r.state.combatants.B?.hp).toBe(40);
  });
  it('Eldritch Blast 5. seviyede iki ışın atar', () => {
    const r = ok(cast(caster(), 'Eldritch Blast', 'B', scripted([20, 15], [10, 5], [20, 14], [10, 4])));
    expect(types(r.events)).toEqual(['attack_resolved', 'attack_resolved']);
    expect(r.state.combatants.B?.hp).toBe(31);
  });
});

describe('otomatik isabet', () => {
  it('Magic Missile: 3 dart, her biri 1d4+1, 1. seviye slot harcar', () => {
    const r = ok(cast(caster(), 'Magic Missile', 'B', scripted(...dice(4, 1, 2, 3))));
    expect(types(r.events)).toEqual(['slot_spent', 'attack_resolved', 'attack_resolved', 'attack_resolved']);
    expect(r.state.combatants.B?.hp).toBe(31); // 2 + 3 + 4 = 9
    expect(r.state.combatants.A?.spellSlots[0]).toBe(3);
  });
  it('daha yüksek seviye slotla yapılabilir (upcast): slot yükselir, ek hasar yok', () => {
    const r = ok(cast(caster(), 'Magic Missile', 'B', scripted(...dice(4, 1, 1, 1)), 2));
    expect(r.state.combatants.A?.spellSlots).toEqual([4, 2, 2, 0, 0, 0, 0, 0, 0]);
  });
});

describe('save büyüleri', () => {
  it('Fireball: save başarısızsa tam hasar, 3. seviye slot harcar', () => {
    const r = ok(cast(caster(), 'Fireball', 'B', scripted([20, 5], ...dice(6, 3, 3, 3, 3, 3, 3, 3, 3))));
    expect(r.state.combatants.B?.hp).toBe(16); // 40 - 24
    expect(r.state.combatants.A?.spellSlots[2]).toBe(1);
  });
  it('Fireball: save başarılıysa yarım hasar', () => {
    const r = ok(cast(caster(), 'Fireball', 'B', scripted([20, 15], ...dice(6, 3, 3, 3, 3, 3, 3, 3, 3))));
    expect(r.state.combatants.B?.hp).toBe(28); // 40 - 12
  });
  it('Cantrip save başarılıysa hasar yok (Sacred Flame)', () => {
    const r = ok(cast(caster(), 'Sacred Flame', 'B', scripted([20, 15], [8, 5], [8, 5])));
    expect(r.state.combatants.B?.hp).toBe(40);
    expect(r.state.combatants.A?.spellSlots[0]).toBe(4);
  });
  it('buzulda ateş büyüsünün hedefi save\'de avantaj alır', () => {
    const r = ok(cast(caster('Buzul'), 'Fireball', 'B', scripted([20, 3], [20, 16], ...dice(6, 3, 3, 3, 3, 3, 3, 3, 3))));
    const ev = r.events.find((e) => e.type === 'save_resolved');
    if (!ev || ev.type !== 'save_resolved') throw new Error('save olayı yok');
    expect(ev.mode).toBe('advantage');
    expect(ev.natural).toBe(16);
    expect(ev.success).toBe(true);
  });
  it('Paralyzed hedef DEX save\'i otomatik kaybeder', () => {
    const r = ok(cast(caster('Düz', {}, { conditions: ['Paralyzed'] }), 'Fireball', 'B', scripted(...dice(6, 3, 3, 3, 3, 3, 3, 3, 3))));
    const ev = r.events.find((e) => e.type === 'save_resolved');
    if (!ev || ev.type !== 'save_resolved') throw new Error('save olayı yok');
    expect(ev.success).toBe(false);
    expect(ev.natural).toBe(null);
  });
  it('Hold Person: save başarısızsa Paralyzed eklenir', () => {
    const r = ok(cast(caster(), 'Hold Person', 'B', scripted([20, 3])));
    expect(r.state.combatants.B?.conditions).toEqual(['Paralyzed']);
    expect(r.state.combatants.A?.spellSlots[1]).toBe(2);
  });
  it('Hold Person: save başarılıysa durum eklenmez', () => {
    const r = ok(cast(caster(), 'Hold Person', 'B', scripted([20, 16])));
    expect(r.state.combatants.B?.conditions).toEqual([]);
  });
});

describe('iyileştirme, uyku ve etkisi elle uygulanan büyüler', () => {
  it('Cure Wounds: 2d8 + büyü modifier (SRD 5.2.1), maksimum HP\'yi aşmaz', () => {
    const a = ok(cast(caster('Düz', { hp: 2 }), 'Cure Wounds', 'A', scripted([8, 5], [8, 3])));
    expect(a.state.combatants.A?.hp).toBe(14); // 2 + 5 + 3 + 4
    const b = ok(cast(caster('Düz', { hp: 18 }), 'Cure Wounds', 'A', scripted([8, 5], [8, 3])));
    expect(b.state.combatants.A?.hp).toBe(20);
  });
  it('Sleep (SRD 5.2.1): WIS save başarısızsa Incapacitated, başarılıysa etkisiz', () => {
    const asleep = ok(cast(caster(), 'Sleep', 'B', scripted([20, 5])));
    expect(asleep.state.combatants.B?.conditions).toEqual(['Incapacitated']);
    const awake = ok(cast(caster(), 'Sleep', 'B', scripted([20, 18])));
    expect(awake.state.combatants.B?.conditions).toEqual([]);
  });
  it('Mage Armor (Görev S1): kendine yapılır, slot harcar; temel AC 13 + DEX süren etki olarak', () => {
    const r = ok(cast(caster(), 'Mage Armor', undefined, scripted()));
    expect(types(r.events)).toEqual(['slot_spent', 'spell_cast', 'effect_added']);
    expect(r.state.combatants.A?.spellSlots[0]).toBe(3);
    const a = r.state.combatants.A;
    expect(a?.effects?.[0]).toMatchObject({ acMin: 13 + (a?.modifiers.dex ?? 0) });
  });
});

describe('büyü hataları', () => {
  it('bilinmeyen veya bilinmeyen büyüyü reddeder', () => {
    expect(cast(caster(), 'Yok Büyü', 'B', scripted()).ok).toBe(false);
    expect(cast(caster('Düz', { spellNames: ['Fire Bolt'] }), 'Fireball', 'B', scripted()).ok).toBe(false);
  });
  it('slot kalmadıysa reddeder', () => {
    expect(cast(caster('Düz', { spellSlots: [4, 3, 0, 0, 0, 0, 0, 0, 0] }), 'Fireball', 'B', scripted()).ok).toBe(false);
    expect(cast(caster(), 'Magic Missile', 'B', scripted(), 4).ok).toBe(false);
  });
  it('hedef gerekli, düşmüş hedef ve kendini hedefleme reddedilir', () => {
    expect(cast(caster(), 'Fireball', undefined, scripted()).ok).toBe(false);
    expect(cast(caster('Düz', {}, { hp: 0 }), 'Fire Bolt', 'B', scripted()).ok).toBe(false);
    expect(cast(caster(), 'Fire Bolt', 'A', scripted()).ok).toBe(false);
  });
  it('aksiyon yapamayan büyücü büyü yapamaz', () => {
    expect(cast(caster('Düz', { conditions: ['Stunned'] }), 'Fire Bolt', 'B', scripted()).ok).toBe(false);
  });
  it('sırası gelmeyen büyücü büyü yapamaz', () => {
    const parts = [mk('A', { ownerId: 'p1', spellNames: ['Fire Bolt'], spellAttack: 5 }), mk('B', { side: 'enemies' })];
    const s = startBattle('b', envId('Düz'), parts, scripted([20, 5], [20, 15])).state; // sıra B'de
    expect(cast(s, 'Fire Bolt', 'B', scripted()).ok).toBe(false);
  });
});

describe('durum yönetimi (GM)', () => {
  it('GM durum ekleyip kaldırabilir, oyuncu yapamaz', () => {
    const s = caster();
    const add = execute(s, { type: 'set_condition', targetId: 'A', condition: 'Prone', present: true }, GM, scripted());
    expect(ok(add).state.combatants.A?.conditions).toEqual(['Prone']);
    const rm = execute(ok(add).state, { type: 'set_condition', targetId: 'A', condition: 'Prone', present: false }, GM, scripted());
    expect(ok(rm).state.combatants.A?.conditions).toEqual([]);
    expect(execute(s, { type: 'set_condition', targetId: 'A', condition: 'Prone', present: true }, P1, scripted()).ok).toBe(false);
  });
});

describe('savaşın bitişi ve yeniden oynatma', () => {
  it('son düşman büyüyle düşünce savaş biter', () => {
    const r = ok(cast(caster('Düz', {}, { hp: 5 }), 'Magic Missile', 'B', scripted(...dice(4, 4, 4, 4))));
    expect(r.state.status).toBe('finished');
    expect(r.state.winner).toBe('party');
    expect(types(r.events).includes('battle_finished')).toBe(true);
  });
  it('büyü olayları baştan oynatılınca aynı durum çıkar', () => {
    const parts = [
      mk('A', { ownerId: 'p1', initiativeBonus: 5, level: 5, spellMod: 4, spellSaveDc: 14, spellAttack: 6,
        spellNames: KNOWN, casterTag: 'elf wizard', spellSlots: [4, 3, 2, 0, 0, 0, 0, 0, 0] }),
      mk('B', { side: 'enemies', hp: 60, maxHp: 60 }),
    ];
    const start = startBattle('b', envId('Buzul'), parts, scripted([20, 15], [20, 5]));
    let state = start.state;
    const all: BattleEvent[] = [...start.events];
    const run = (cmd: Command, rng: Rng) => {
      const r = ok(execute(state, cmd, P1, rng));
      state = r.state;
      all.push(...r.events);
    };
    run({ type: 'cast_spell', actorId: 'A', spellName: 'Fireball', targetId: 'B' }, scripted([20, 4], [20, 17], ...dice(6, 2, 2, 2, 2, 2, 2, 2, 2)));
    // Turda tek slotlu büyü: Hold Person bir sonraki turda.
    for (const [actorId, ctx] of [['A', P1], ['B', GM]] as const) {
      const r = ok(execute(state, { type: 'end_turn', actorId }, ctx, scripted()));
      state = r.state;
      all.push(...r.events);
    }
    run({ type: 'cast_spell', actorId: 'A', spellName: 'Hold Person', targetId: 'B' }, scripted([20, 3]));
    expect(replay(all)).toEqual(state);
    expect(state.combatants.A?.spellSlots).toEqual([4, 2, 1, 0, 0, 0, 0, 0, 0]);
  });
});

describe('büyü verileri', () => {
  it('her büyünün mekaniği var ve türüne göre gerekli alanlar dolu', () => {
    for (const s of spells) {
      const m = s.mechanics;
      expect(m !== undefined).toBe(true);
      // True Strike (Görev B1): silahla saldırı, zarı silahtan.
      if ((m.kind === 'attack' && !m.weaponStrike) || m.kind === 'auto' || m.kind === 'heal') expect(typeof m.damage).toBe('string');
      if (m.kind === 'save') expect(m.save !== undefined).toBe(true);
    }
  });
  it('en az 40 büyünün savaş mekaniği tanımlı', () => {
    expect(spells.filter((s) => s.mechanics.kind !== 'utility').length).toBeGreaterThanOrEqual(40);
  });
});

describe('SRD 5.2.1 eşitlemesi ve yukarı slot verisi (Görev N)', () => {
  const srd = srdSpells.spells;
  const norm = (n: string) => n.toLowerCase().replace(/’/g, "'");
  const code: Record<string, string> = { Bard: 'Brd', Cleric: 'Clr', Druid: 'Drd', Paladin: 'Pal', Ranger: 'Rgr', Sorcerer: 'Sor', Warlock: 'Wlk', Wizard: 'Wiz' };
  it('her büyünün seviyesi, sınıfları, süresi ve konsantrasyonu SRD ile aynı (npm run srd:buyu)', () => {
    for (const s of spells) {
      const x = srd.find((y) => norm(y.name) === norm(s.name));
      expect(x, s.name).toBeDefined();
      if (!x) continue;
      expect(s.level, s.name).toBe(x.level);
      expect([...s.classes].sort(), s.name).toEqual(x.classes.map((c) => code[c] ?? c).sort());
      expect(!!s.concentration, s.name).toBe(x.concentration);
      expect(s.school, s.name).toBe(x.school);
    }
  });
  it('düzeltilen zarlar: Cure Wounds 2d8, Healing Word 2d4, Chill Touch 1d10, Vicious Mockery 1d6, Inflict Wounds 2d10 CON', () => {
    const m = (n: string) => spells.find((s) => s.name === n)?.mechanics;
    expect([m('Cure Wounds')?.damage, m('Healing Word')?.damage, m('Mass Healing Word')?.damage]).toEqual(['2d8', '2d4', '2d4']);
    expect([m('Chill Touch')?.damage, m('Vicious Mockery')?.damage]).toEqual(['1d10', '1d6']);
    expect(m('Inflict Wounds')).toMatchObject({ kind: 'save', save: 'con', damage: '2d10', halfOnSave: true });
    expect(m('Poison Spray')?.kind).toBe('attack');
  });
  it('yukarı slot: yalnızca uygulanan etki (Spiritual Weapon/Spirit Guardians, smite büyüleri); diğerleri veri olarak durur', () => {
    const applied = spells.filter((s) => s.mechanics.upcast?.applied).map((s) => s.name).sort();
    // Görev P-Paladin: smite büyülerinin yukarı slot zarı uygulanıyor.
    // Görev R3: çağırma büyülerinde slot seviyesi stat bloğundaki büyü seviyesidir (Find Steed, Summon Dragon).
    // Görev S1: yeni büyülerde yukarı slot uygulanıyor (False Life +5 geçici HP, Longstrider +1 hedef, Mind Spike +1d8).
    // Görev B1: Ensnaring Strike'ın süregelen zarı slot başına +1d6.
    // Görev B2: alan ve çağrı hasarı slot başına artar (Conjure Animals +1d10, Flaming Sphere +1d6, Moonbeam +1d10).
    expect(applied).toEqual(['Conjure Animals', 'Divine Smite', 'Ensnaring Strike', 'False Life', 'Find Steed', 'Flaming Sphere', 'Longstrider', 'Mind Spike', 'Moonbeam', 'Searing Smite', 'Shining Smite', 'Spirit Guardians', 'Spiritual Weapon', 'Summon Dragon']);
    expect(spells.find((s) => s.name === 'Fireball')?.mechanics.upcast).toEqual({ dice: '1d6' });
    expect(spells.find((s) => s.name === 'Magic Missile')?.mechanics.upcast).toEqual({ rays: 1 });
    expect(spells.find((s) => s.name === 'Hold Person')?.mechanics.upcast).toEqual({ targets: 1 });
  });
  it('istenen slotla atılır; slot seçilmezse en düşük uygun slot (yapay zekâ böyle atar)', () => {
    const low = ok(cast(caster(), 'Magic Missile', 'B', scripted()));
    expect(low.events.find((e) => e.type === 'slot_spent')).toMatchObject({ level: 1 });
    const high = ok(cast(caster(), 'Magic Missile', 'B', scripted(), 3));
    expect(high.events.find((e) => e.type === 'slot_spent')).toMatchObject({ level: 3 });
  });
});
