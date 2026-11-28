/**
 * GECE-KATALOG-KALAN (kural sürümü 110): KATALOG-1 kanca listesinin 2. turu. Eşya güçleri `paket.s110.ilkeller`
 * (`scripts/katalog-kanca-110.py`): 110+ savaşta eşya torbasına girer, 109 ve altında yok. Yeni koşullar (hedefin durumu/türü/boyu/
 * canı, kritik, kendi canı, kalkansız) veriden; kodda eşya adı yok.
 */
import { describe, expect, it } from 'vitest';
import katalog from '../../data/items-katalog.json';
import { execute } from './commands';
import { combatantFromSheet, setDefaultRuleVersion, startBattle } from './create';
import { itemBag } from './paket/bag';
import { kosulOk } from './paket/core';
import { P1, mk } from './fixtures';
import { blankCharacter } from '../rules/builder';
import { CURRENT_RULES } from './ruleVersion';
import { ilkelErrors } from '../content/ilkelSema';
import type { AttackOption, BattleEvent, BattleState, Combatant } from './types';
import type { CharacterSheet } from '../rules/stats';
import type { Ilkel } from './paket/bag';

type Pk = { ilkeller?: Ilkel[]; s110?: { ilkeller: Ilkel[] } };
const KAT = (katalog as unknown as { esyalar: Array<{ id: string; name: string; paket?: Pk; katalog: { ozellikler: Array<{ ad: string; durum: string; not?: string }> } }> }).esyalar;
const sheet = (itemNames: string[], weapons: string[]) => ({ ...blankCharacter('p1').sheet, name: 'Savaşçı', classId: 'fighter', level: 5,
  weapons: weapons.map((name) => ({ name })), itemNames }) as CharacterSheet;

function arena(itemNames: string[], weapons: string[], foe: Partial<Combatant> = {}, v = CURRENT_RULES): BattleState {
  setDefaultRuleVersion(v);
  const a = combatantFromSheet(sheet(itemNames, weapons), { id: 'A', ownerId: 'p1' });
  setDefaultRuleVersion(CURRENT_RULES);
  const parts = [{ ...a, id: 'A', ownerId: 'p1' }, mk('B', { side: 'enemies', hp: 200, maxHp: 200, ac: 5, ...foe })];
  const s0 = startBattle('kat-110', 'd-z-zemin', parts, () => 0.5, { kuralSurumu: v, map: { id: 'col' } }).state;
  const combatants = { ...s0.combatants };
  for (const [id, p] of Object.entries({ A: { col: 4, row: 3 }, B: { col: 5, row: 3 } })) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return { ...s0, status: 'active', round: 2, order: ['A', 'B'], turnIndex: 0, combatants, map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } } as BattleState;
}
const extras = (s: BattleState, weaponId: string, rng: () => number) => {
  const o = s.combatants.A!.weaponOptions.find((x) => x.weaponId === weaponId && !x.ranged) as AttackOption;
  const r = execute(s, { type: 'attack', actorId: 'A', targetId: 'B', option: { ...o, attackBonus: 30 } }, P1, rng);
  if (!r.ok) throw new Error(r.error);
  return (r.events.find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>).extra ?? [];
};

describe('GECE-KATALOG-KALAN: kanca listesi 2. tur', () => {
  it('s110 ilkelleri şemaya uyar; bağlanan güçlerin notu 110 der', () => {
    let n = 0;
    for (const x of KAT) {
      const list = x.paket?.s110?.ilkeller;
      if (!list) continue;
      const own = new Set(list.filter((p) => p.tur === 'kaynak').map((p) => p.id as string));
      expect(ilkelErrors(list, x.id, { kaynaklar: own, sinifKaynaklari: new Set(['channelDivinity']), yaratiklar: new Set() }), x.id).toEqual([]);
      n++;
    }
    expect(n).toBe(30);
    expect(KAT.flatMap((x) => x.katalog.ozellikler).filter((o) => o.not?.startsWith('GECE-KATALOG-KALAN'))).toHaveLength(32);
  });

  it('109 savaşta s110 eşya torbasına girmez, 110 savaşta girer', () => {
    expect(itemBag(['Mirefang Scimitar'], 109)).toBeUndefined();
    expect(itemBag(['Mirefang Scimitar'], 110)?.bag.ozellikler[0]?.ilkeller.map((p) => p.tur)).toEqual(['ekHasar']);
  });

  it('Zehir Takibi: yalnız Poisoned hedefe +1d4 zehir; 109 savaşta hiç', () => {
    const hit = (cond: string[], v = CURRENT_RULES) => extras(arena(['Mirefang Scimitar'], ['Scimitar'], { conditions: cond }, v), 'scimitar', () => 0.7).filter((e) => e.type === 'poison');
    // Silahın kendi koşulsuz zehir eki de var: koşullu ek onun üstüne bir tane daha.
    const base = hit([]).length;
    expect(hit(['Poisoned'])).toHaveLength(base + 1);
    expect(hit(['Poisoned'], 109)).toHaveLength(base);
  });

  it('Göz Alıcı Darbe: yalnız Undead hedefe +1d6 ışıltı', () => {
    const hit = (type?: string) => extras(arena(['Sunstar Morningstar'], ['Morningstar'], type ? { creatureType: type } : {}), 'morningstar', () => 0.7).filter((e) => e.type === 'radiant');
    const base = hit('beast').length;
    expect(hit('undead')).toHaveLength(base + 1);
  });

  it('Acı Kesiği: kritikte +6 sabit delici (ıskada/kritiksiz yok)', () => {
    const s = arena(['Sorrowthorn Dagger'], ['Dagger']);
    const crit = extras(s, 'dagger', () => 0.99).filter((e) => e.raw === 6 && e.type === 'piercing');
    expect(crit).toHaveLength(1);
    expect(extras(s, 'dagger', () => 0.7).filter((e) => e.raw === 6 && e.type === 'piercing')).toHaveLength(0);
  });

  it('yeni koşullar: hedefDurum / hedefTur / hedefBoyut / yariCan / kalkansiz / hedefOynamadi', () => {
    const s = arena([], ['Dagger']);
    const a = s.combatants.A as Combatant;
    const b = { ...(s.combatants.B as Combatant), conditions: ['Grappled'], creatureType: 'monstrosity', size: 'L' as const, hp: 100 };
    const k = (kosul: string[], actor = a, st = s) => kosulOk(st, actor, { tur: 'ekHasar', kosul } as Ilkel, b);
    expect(k(['hedefDurum:Restrained/Grappled'])).toBe(true);
    expect(k(['hedefDurum:Restrained'])).toBe(false);
    expect(k(['hedefTur:monstrosity'])).toBe(true);
    expect(k(['hedefBoyut:L'])).toBe(true);
    expect(k(['hedefBoyut:H'])).toBe(false);
    expect(k(['hedefYariCan'])).toBe(true);
    expect(k(['yariCan'])).toBe(false);
    expect(k(['yariCan'], { ...a, hp: Math.floor(a.maxHp / 2) })).toBe(true);
    expect(k(['kalkansiz'], { ...a, shieldHeld: true })).toBe(false);
    expect(k(['kalkansiz'], { ...a, shieldHeld: true, shieldOff: true })).toBe(true);
    expect(k(['hedefOynamadi'])).toBe(false);
    expect(k(['hedefOynamadi'], a, { ...s, round: 1 })).toBe(true);
    expect(kosulOk(s, a, { tur: 'ekHasar', kosul: ['kritik'] } as Ilkel, b, false, true)).toBe(true);
  });

  it('Kök Şifası: yük kaynağı (1) ve bonus eylemle iyileştirme düğmesi', () => {
    const r = itemBag(['Rootgrip Ring'], 110);
    expect(Object.values(r?.resources ?? {})).toEqual([1]);
    expect(r?.bag.ozellikler[0]?.ilkeller.find((p) => p.tur === 'iyilestirme')).toMatchObject({ tetik: 'bonus', miktar: '2d4+2' });
  });
});
