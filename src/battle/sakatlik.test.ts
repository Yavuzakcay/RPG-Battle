/**
 * Görev SAKATLIK-S1 (kural sürümü 111, ev kuralı `sakatlik`): kalıcı yaralanma motoru. Eşik (kullanıcının 7 doğrulama
 * örneği), kademe, tablo türü, muafiyetler (kâğıt düşman, canavar, masum, çağrı), sürüm/ev kuralı kapısı, reducer
 * (liste, azami HP, yetenek, süren etki), tekrar ve sınır (G2), baskın tür (G4), uçtan uca saldırı + replay.
 */
import { describe, expect, it } from 'vitest';
import { combatantFromMonster, execute, replay, startBattle } from './index';
import type { AttackOption, BattleEvent, BattleState, Combatant, DamageEffect } from './index';
import { GM, mk, scripted, sword } from './fixtures';
import { damageEffects } from './damage-effects';
import { applyEvent } from './reduce';
import { dominantType, kademeOf, sakatlikAday, type SakatlikKaydi } from './sakatlik';
import { SAKATLIK_VERSION, sakatlikSurumOn } from './sakatlikSurum';
import { CURRENT_RULES } from './ruleVersion';
import { getMonster } from '../data';
import type { Offset } from '../rules/hex';

const NEW = SAKATLIK_VERSION;
const OLD = SAKATLIK_VERSION - 1;
const ON = { sakatlik: true };
const pc = (p: Partial<Combatant> = {}): Combatant => mk('A', { ownerId: 'p1', raceId: 'human', sakatlikOn: true, ...p });
const fx = (c: Combatant, dmg: number, type = 'slashing') => damageEffects(c, dmg, type, false, () => 0.5).effects;
const kindOf = (effects: DamageEffect[]) => {
  if (effects.some((e) => e.kind === 'instant_death')) return 'ölüm';
  const d = effects.find((e) => e.kind === 'dying');
  return d?.kind === 'dying' && d.injury ? 'sakatlık' : d ? 'yok' : '-';
};
const injuryOf = (effects: DamageEffect[]) => {
  const d = effects.find((e) => e.kind === 'dying');
  return d?.kind === 'dying' ? d.injury : undefined;
};

describe('SAKATLIK: sabit', () => {
  it('kural sürümü 111; 110 eski', () => {
    expect(SAKATLIK_VERSION).toBe(111);
    expect(CURRENT_RULES).toBeGreaterThanOrEqual(SAKATLIK_VERSION);
    expect(sakatlikSurumOn({ kuralSurumu: NEW })).toBe(true);
    expect(sakatlikSurumOn({ kuralSurumu: OLD })).toBe(false);
  });
});

describe('SAKATLIK: eşik (kullanıcının doğrulama örnekleri)', () => {
  const cases: Array<[number, number, number, string]> = [
    [40, 25, 40, 'yok'], [40, 25, 50, 'sakatlık'], [40, 25, 65, 'ölüm'],
    [60, 60, 80, 'yok'], [60, 60, 95, 'sakatlık'], [60, 60, 120, 'ölüm'],
    [60, 8, 45, 'sakatlık'],
  ];
  for (const [max, hp, dmg, want] of cases) {
    it(`azami ${max} / can ${hp}, ${dmg} hasar → ${want}`, () => {
      expect(kindOf(fx(pc({ maxHp: max, hp }), dmg))).toBe(want);
    });
  }
  it('kademe artanın azami HP\'ye oranından (hafif / orta / ağır)', () => {
    expect(kademeOf(0.49)).toBeNull();
    expect(injuryOf(fx(pc({ maxHp: 40, hp: 25 }), 50))?.kademe).toBe('hafif'); // 25/40
    expect(injuryOf(fx(pc({ maxHp: 40, hp: 25 }), 55))?.kademe).toBe('orta'); // 30/40
    expect(injuryOf(fx(pc({ maxHp: 40, hp: 25 }), 60))?.kademe).toBe('agir'); // 35/40
  });
  it('tür tablodan (Radiant → körlük, Thunder → sağırlık, Force → iç kanama); türsüz hasar sakatlık vermez', () => {
    expect(injuryOf(fx(pc({ maxHp: 40, hp: 25 }), 50, 'radiant'))?.id).toBe('korluk');
    expect(injuryOf(fx(pc({ maxHp: 40, hp: 25 }), 50, 'Thunder'))?.id).toBe('sagirlik');
    expect(injuryOf(fx(pc({ maxHp: 40, hp: 25 }), 50, 'force'))?.id).toBe('ic-kanama');
    expect(kindOf(fx(pc({ maxHp: 40, hp: 25 }), 50, ''))).toBe('yok');
  });
  it('işaretsiz hedef (canavar, kâğıt düşman, kural kapalı) sakatlanmaz; Death Ward 1 HP bırakır', () => {
    expect(kindOf(fx(pc({ maxHp: 40, hp: 25, sakatlikOn: undefined }), 50))).toBe('yok');
    const ward = pc({ maxHp: 40, hp: 25, effects: [{ id: 'dw', name: 'Death Ward', sourceId: 'A', deathWard: true }] });
    const r = damageEffects(ward, 50, 'slashing', false, () => 0.5);
    expect(r.hpAfter).toBe(1);
    expect(kindOf(r.effects)).toBe('-');
  });
  it('0 HP\'deki (ölmekte) karaktere hasar sakatlık vermez', () => {
    expect(fx(pc({ maxHp: 40, hp: 0, life: 'dying' }), 30).some((e) => e.kind === 'dying')).toBe(false);
  });
});

describe('SAKATLIK: savaş başı işareti yalnız parti kâğıdında', () => {
  const parts = (): Combatant[] => [
    mk('A', { ownerId: 'p1', raceId: 'human' }),
    mk('K', { side: 'enemies', raceId: 'human' }), // kâğıt düşman
    combatantFromMonster(getMonster('goblin-warrior'), { id: 'G', name: 'Goblin' }), // canavar
    { ...combatantFromMonster(getMonster('wolf'), { id: 'W', name: 'Wolf' }), side: 'party' as const }, // parti tarafında canavar
    mk('M', { civilian: true, raceId: 'human' }), // masum
  ];
  const start = (v: number, houseRules?: Record<string, boolean>) =>
    startBattle('s1', 'd', parts(), scripted([20, 20], [20, 19], [20, 18], [20, 17], [20, 16]), { kuralSurumu: v, ...(houseRules ? { houseRules } : {}) } as never).state;
  const marked = (s: BattleState) => Object.values(s.combatants).filter((c) => c.sakatlikOn).map((c) => c.id);
  it('111 + ev kuralı: yalnız A', () => {
    expect(marked(start(NEW, ON))).toEqual(['A']);
    expect(['K', 'G', 'W', 'M'].map((id) => sakatlikAday(start(NEW, ON).combatants[id] as Combatant))).toEqual([false, false, false, false]);
  });
  it('110 + ev kuralı ya da 111 ev kuralı kapalı (varsayılan): kimse', () => {
    expect(marked(start(OLD, ON))).toEqual([]);
    expect(marked(start(NEW))).toEqual([]);
  });
  it('ev kuralı kapalıyken 111 başlangıç durumu 110 ile aynı (sürüm alanı dışında)', () => {
    expect({ ...start(NEW), kuralSurumu: 0 }).toEqual({ ...start(OLD), kuralSurumu: 0 });
  });
});

describe('SAKATLIK: reducer', () => {
  const at = (c: Combatant): BattleState => ({ ...startBattle('s1r', 'd', [c], scripted([20, 20]), { kuralSurumu: NEW, houseRules: ON } as never).state, status: 'active', round: 1 });
  const hit = (s: BattleState, dmg: number, type: string): BattleState => {
    const t = s.combatants.A as Combatant;
    const r = damageEffects(t, dmg, type, false, () => 0.5);
    const ev: BattleEvent = { type: 'bond_damage', targetId: 'A', fromId: 'X', label: 'test', amount: dmg, targetHpAfter: r.hpAfter, effects: r.effects };
    return applyEvent(s, ev);
  };
  const revive = (s: BattleState, hp: number): BattleState =>
    ({ ...s, combatants: { ...s.combatants, A: { ...(s.combatants.A as Combatant), hp, life: 'alive', conditions: [] } } });
  const base = () => at(mk('A', { ownerId: 'p1', raceId: 'human', hp: 25, maxHp: 40, modifiers: { str: 0, dex: 0, con: 2, int: 1, wis: 3, cha: 0 }, saves: { str: 0, dex: 0, con: 2, int: 1, wis: 3, cha: 0 } }));
  const A = (s: BattleState) => s.combatants.A as Combatant;

  it('orta körlük: Blinded veren süren etki ve kalıcı kayıt; karakter ölmekte', () => {
    const s = hit(base(), 55, 'radiant');
    expect(A(s).life).toBe('dying');
    expect(A(s).sakatliklar).toEqual([{ id: 'korluk', kademe: 'orta', tur: 'radiant' }]);
    expect(A(s).effects?.find((e) => e.id === 'sakatlik:korluk')?.grants).toEqual(['Blinded']);
    expect(A(s).conditions).toEqual(expect.arrayContaining(['Unconscious', 'Blinded']));
  });
  it('hafif körlük (G6): görmeye dayalı Algı ve menzilli saldırı dezavantajı, durum yok', () => {
    const e = A(hit(base(), 50, 'radiant')).effects?.find((x) => x.id === 'sakatlik:korluk');
    expect(e?.checkDisSkill).toEqual([{ skill: 'perception' }]);
    expect(e?.attackDis).toEqual({ ranged: true });
    expect(e?.grants).toBeUndefined();
  });
  it('Necrotic: azami HP %20 düşer (orta; Greater Restoration alanı `maxHpLoss`)', () => {
    const s = hit(base(), 55, 'necrotic');
    expect(A(s).maxHp).toBe(32);
    expect(A(s).maxHpLoss).toBe(8);
    expect(A(s).sakatliklar?.[0]).toMatchObject({ id: 'solgunluk', kademe: 'orta', hp: 8 });
  });
  it('Psychic (G5): WIS/INT\'in yüksek olanı düşer; değiştirici ve save birlikte', () => {
    const s = hit(base(), 60, 'psychic'); // ağır: 3 puan; WIS 16 → 13 (değiştirici +3 → +1)
    const rec = A(s).sakatliklar?.[0] as SakatlikKaydi;
    expect(rec.yetenek).toEqual({ ability: 'wis', amount: 3, mod: -2 });
    expect(A(s).modifiers.wis).toBe(1);
    expect(A(s).saves.wis).toBe(1);
    expect(A(s).abilityLoss?.wis).toEqual({ amount: 3, mod: -2 });
  });
  it('G2: aynı tür tekrarında kademe +1; fark uygulanır, etki yenilenir', () => {
    let s = hit(base(), 50, 'necrotic'); // hafif: 4
    expect(A(s).maxHp).toBe(36);
    s = hit(revive(s, 20), 20 + 18, 'necrotic'); // yine hafif oran → kademe +1 = orta (toplam %20 = 8; fark 4)
    expect(A(s).sakatliklar).toEqual([{ id: 'solgunluk', kademe: 'orta', tur: 'necrotic', hp: 8 }]);
    expect(A(s).maxHp).toBe(32);
  });
  it('G2: en çok 3 sakatlık; dolu listede yeni tür en hafifin kademesini artırır', () => {
    let s = hit(base(), 55, 'radiant'); // korluk orta
    s = hit(revive(s, 25), 50, 'fire'); // yara-izi hafif
    s = hit(revive(s, 25), 55, 'cold'); // donuk-uzuv orta
    s = hit(revive(s, 25), 55, 'thunder'); // dolu: yara-izi hafif → orta
    expect(A(s).sakatliklar?.map((r) => `${r.id}:${r.kademe}`)).toEqual(['korluk:orta', 'yara-izi:orta', 'donuk-uzuv:orta']);
    expect(A(s).effects?.find((e) => e.id === 'sakatlik:yara-izi')?.checkDis).toEqual(['cha']);
    expect(A(s).effects?.find((e) => e.id === 'sakatlik:donuk-uzuv')?.speedFt).toBe(-10);
  });
});

describe('SAKATLIK: baskın tür (G4) ve uçtan uca', () => {
  it('dominantType: türe göre toplanan en büyük bileşen', () => {
    expect(dominantType([{ amount: 6, type: 'piercing' }, { amount: 4, type: 'fire' }, { amount: 4, type: 'fire' }])).toBe('fire');
    expect(dominantType([{ amount: 0, type: 'fire' }, { amount: 3, type: undefined }])).toBe('');
  });
  const o = (col: number, row: number): Offset => ({ col, row });
  const blast: AttackOption = { ...sword, label: 'Işın', attackBonus: 30, damage: '40', damageType: 'radiant', reachFt: 5 };
  const scene = (v: number, houseRules?: Record<string, boolean>): BattleState => {
    const list = [
      mk('A', { ownerId: 'p1', raceId: 'human', hp: 10, maxHp: 40 }),
      mk('B', { side: 'enemies', weaponOptions: [blast] }),
    ];
    const { state } = startBattle('s1e', 'd-z-zemin', list, scripted([20, 20], [20, 19]), { map: { id: 'volkan' }, kuralSurumu: v, ...(houseRules ? { houseRules } : {}) } as never);
    const pos: Record<string, Offset> = { A: o(3, 3), B: o(4, 3) };
    const combatants = Object.fromEntries(Object.entries(state.combatants).map(([k, c]) => [k, { ...c, pos: pos[k] ?? null }]));
    return { ...state, status: 'active', round: 1, order: ['B', 'A'], turnIndex: 0, combatants, map: { ...(state.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)), zones: [], objects: [] } };
  };
  const strike = (s: BattleState) => {
    const r = execute(s, { type: 'attack', actorId: 'B', targetId: 'A', option: blast }, GM, () => 0.5);
    if (!r.ok) throw new Error(r.error);
    expect(replay([{ type: 'battle_started', state: s }, ...r.events])).toEqual(r.state);
    return r.state.combatants.A as Combatant;
  };
  it('111 + ev kuralı: düşman saldırısı (artan 30/40) orta körlük verir; replay aynı', () => {
    const a = strike(scene(NEW, ON));
    expect(a.life).toBe('dying');
    expect(a.sakatliklar).toEqual([{ id: 'korluk', kademe: 'orta', tur: 'radiant' }]);
  });
  it('110 ve 111 ev kuralı kapalı: yalnız ölmekte', () => {
    for (const s of [scene(OLD, ON), scene(NEW)]) {
      const a = strike(s);
      expect(a.life).toBe('dying');
      expect(a.sakatliklar).toBeUndefined();
      expect(a.effects?.some((e) => e.id.startsWith('sakatlik:'))).toBeFalsy();
    }
  });
  it('kâğıt düşman ve canavar hedef hiç etkilenmez (parti saldırır)', () => {
    const s0 = scene(NEW, ON);
    const s = { ...s0, order: ['A', 'B'], combatants: { ...s0.combatants,
      A: { ...(s0.combatants.A as Combatant), hp: 40, weaponOptions: [blast] },
      B: { ...(s0.combatants.B as Combatant), raceId: 'human', hp: 10, maxHp: 40 } } };
    const r = execute(s, { type: 'attack', actorId: 'A', targetId: 'B', option: blast }, { playerId: 'p1', isGm: false }, () => 0.5);
    if (!r.ok) throw new Error(r.error);
    const b = r.state.combatants.B as Combatant;
    expect(b.sakatlikOn).toBeUndefined();
    expect(b.sakatliklar).toBeUndefined();
  });
});
