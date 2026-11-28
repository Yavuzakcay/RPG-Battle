/**
 * Görev KATALOG-1 D: özgün yüzük, tılsım ve mühür taşları (Yüzük ve Tılsım Kataloğu #1–45) ile Hex paketinin taşları
 * (Sv.1 ve Sv.2 on tür varyantı, Sv.3 on taş) ve Koruyucu Ejderha Mührü. K3: mühür taşları tılsım modunda (soket yok; yalnız
 * Tılsım yuvası etkisi), zanaat eklentileri yalnız veri; Sv.3 güçleri zırh bağı beklediği için planlı.
 */
import { describe, expect, it } from 'vitest';
import katalog from '../../data/items-katalog.json';
import { combatantFromSheet } from './index';
import { startBattle } from './create';
import { itemParts } from './itemEffects';
import { blankCharacter } from '../rules/builder';
import type { CharacterSheet } from '../rules/stats';
import { CURRENT_RULES } from './ruleVersion';
import { items } from '../data';
import type { Combatant } from './types';
import { formul, passiveBody } from './paket/core';
import { parseDice } from '../rules/dice';

type K = { id: string; name: string; katalog: { ref: string; tur: string; ozellikler: Array<{ ad: string; durum: string }> } };
const kat = (katalog as unknown as { esyalar: K[] }).esyalar;
const YT = kat.filter((x) => x.katalog.ref.startsWith('YT#'));
const TAS = kat.filter((x) => /^BOSS#(7|8)[a-j]$|^BOSS#(9|1[0-8])$/.test(x.katalog.ref));
const sheet = (itemNames: string[], patch: Partial<CharacterSheet> = {}) => ({ ...blankCharacter('p1').sheet, name: 'Savaşçı', classId: 'fighter', level: 5,
  weapons: [{ name: 'Dagger' }], itemNames, ...patch }) as CharacterSheet;
const make = (sh: CharacterSheet) => combatantFromSheet(sh, { id: 'A', ownerId: 'p1' });
const battle = (sh: CharacterSheet) => startBattle('kat-d', 'd', [{ ...make(sh), pos: null }], () => 0.5, { kuralSurumu: CURRENT_RULES } as never).state.combatants.A as Combatant;
const prims = (a: Combatant) => (a.paket?.ozellikler ?? []).flatMap((f) => f.ilkeller);

describe('KATALOG-1 D: yüzük, tılsım, mühür taşı', () => {
  it('45 katalog parçası; Hex taşları 10 + 10 varyant + 10 Sv.3 + Mühür; K7 adları', () => {
    expect(YT).toHaveLength(45);
    expect(TAS).toHaveLength(30);
    expect(kat.some((x) => x.katalog.ref === 'BOSS#19' && x.id === 'guardian-dragon-sigil')).toBe(true);
    for (const n of ['Searing Acid Ring', 'Lightcall Ring', 'Leaping Current Ring']) expect(items.some((i) => i.name === n), n).toBe(true);
    for (const n of ['Caustic Band', 'Callous Glow Ring', 'Strange Conduit Ring']) expect(items.some((i) => i.name === n), n).toBe(false);
  });
  it('Riskli Zar Yüzüğü: saldırılarda avantaj, kurtarmalarda dezavantaj (paket); Yakıcı Asit Yüzüğü: silaha sabit +2 asit', () => {
    const a = battle(sheet(["Gambler's Edge Ring"]));
    const z = prims(a).filter((p) => p.tur === 'zarEtkisi');
    expect(z.map((p) => passiveBody(p, a))).toEqual(expect.arrayContaining([expect.objectContaining({ attackAdv: true }), expect.objectContaining({ saveDis: ['str', 'dex', 'con', 'int', 'wis', 'cha'] })]));
    const b = battle(sheet(['Searing Acid Ring']));
    const e = prims(b).find((p) => p.tur === 'ekHasar')!;
    expect(parseDice(formul(e.zar, b))).toEqual({ count: 0, sides: 1, bonus: 2 });
  });
  it('Yaşam Kaynağı Tılsımı: CON 21 ve CON kurtarma avantajı; Peri Duruşu: INT/WIS/CHA avantajı', () => {
    expect(make(sheet(['Lifespring Amulet'])).modifiers.con).toBe(5);
    expect(itemParts(['Lifespring Amulet'], 'p1').effects[0]!.saveAdv).toEqual(['con']);
    expect(itemParts(['Feyward Amulet'], 'p1').effects[0]!.saveAdv).toEqual(['int', 'wis', 'cha']);
  });
  it('K3 tılsım modu: Fırtına Mühür Taşı +1 AC, Kaya Mühür Taşı en yüksek can +8, Kor Mühür Taşı 19–20 kritik', () => {
    expect(make(sheet(['Storm Sigil Stone'])).ac - make(sheet([])).ac).toBe(1);
    expect(battle(sheet(['Stone Sigil Stone'])).maxHp - battle(sheet([])).maxHp).toBe(8);
    const a = battle(sheet(['Ember Sigil Stone']));
    expect(passiveBody(prims(a).find((p) => p.tur === 'zarEtkisi')!, a)).toEqual(expect.objectContaining({ pkCritOn: 19 }));
  });
  // Görev KATALOG-GUC-TAM D (kullanıcı kararı): taş yalnız yuvada etki verir (gevşek taşınan etkisiz); Sv.2 etkileri yuvadan aynı.
  it('Sv.2 (yuvada): türüne direnç + turda bir silaha 1d4; gevşek taş etkisiz; Sv.1/Sv.3 temel etki yuvadan; Mühür kurtarma +1 ve Frightened bağışıklığı', () => {
    const p = itemParts(['Awakened Elemental Stone (Fire)'], 'p1').effects[0]!;
    expect(p.resist).toEqual(['fire']);
    expect(prims(battle(sheet(['Awakened Elemental Stone (Fire)']))).find((x) => x.tur === 'ekHasar')).toBeUndefined();
    const a = battle(sheet(['Twilight Leather'], { yuvalar: { 'twilight-leather': ['awakened-elemental-stone-fire'] } }));
    expect(prims(a).find((x) => x.tur === 'ekHasar')).toEqual(expect.objectContaining({ zar: '1d4', hasarTuru: 'fire', turdaBir: true }));
    // Yuva sistemiyle: Sv.1 temel etki çalışır, Sv.3 temel etki kısmi (bağışıklık); Savaş Sanatları planlı.
    for (const x of TAS.filter((t) => /^BOSS#(7[a-j]|9|1[0-8])$/.test(t.katalog.ref))) for (const f of x.katalog.ozellikler) {
      expect(f.durum, `${x.id}/${f.ad}`).toBe(f.ad === 'Temel etki' ? (x.katalog.ref.startsWith('BOSS#7') ? 'calisir' : 'kismi') : 'planli');
    }
    expect(make(sheet(['Guardian Dragon Sigil'])).saves.dex - make(sheet([])).saves.dex).toBe(1);
    expect(itemParts(['Guardian Dragon Sigil'], 'p1').effects[0]!.immune).toEqual(['Frightened']);
  });
});
