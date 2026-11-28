/**
 * Görev KATALOG-1 B: özgün zırh, cübbe ve kalkanlar (Zırh Kataloğu #1–45, Karanlık Yadigârlar #36–44, #49–53, #55) ve boss
 * imza eşyaları (BOSS#1–6). Zırh AC'si taban SRD zırhı + sihirli eki, kalkan K8 (+N sihirli; "Toplam +N" metninde N − 2),
 * cübbe zırhsız eki; birebir karşılığı olan pasifler savaşta; PDF'teki her güç kayıtta.
 */
import { describe, expect, it } from 'vitest';
import katalog from '../../data/items-katalog.json';
import { combatantFromSheet } from './index';
import { startBattle } from './create';
import { itemHitsFor, itemParts } from './itemEffects';
import { mk } from './fixtures';
import { blankCharacter } from '../rules/builder';
import type { CharacterSheet } from '../rules/stats';
import { CURRENT_RULES } from './ruleVersion';
import type { BattleState, Combatant } from './types';
import { kosulOk, passiveBody } from './paket/core';

type K = { id: string; name: string; effects: Record<string, number>; katalog: { ref: string; tur: string; taban: string; ozellikler: Array<{ ad: string; durum: string }> } };
const kat = (katalog as unknown as { esyalar: K[] }).esyalar;
const B = kat.filter((x) => (/^ZK#/.test(x.katalog.ref) || /^BOSS#[1-6]$/.test(x.katalog.ref)) || (/^KY#/.test(x.katalog.ref) && Number(x.katalog.ref.slice(3)) >= 36 && ![45, 46, 47, 48, 54].includes(Number(x.katalog.ref.slice(3)))));
const sheet = (itemNames: string[], patch: Partial<CharacterSheet> = {}) => ({ ...blankCharacter('p1').sheet, name: 'Savaşçı', classId: 'fighter', level: 5,
  weapons: [{ name: 'Dagger' }], itemNames, ...patch }) as CharacterSheet;
const ac = (sh: CharacterSheet) => combatantFromSheet(sh, { id: 'A', ownerId: 'p1' }).ac;
const battle = (sh: CharacterSheet) => {
  const c = combatantFromSheet(sh, { id: 'A', ownerId: 'p1' });
  const s = startBattle('kat-b', 'd', [{ ...c, pos: null }], () => 0.5, { kuralSurumu: CURRENT_RULES } as never).state;
  return { s, a: s.combatants.A as Combatant };
};

describe('KATALOG-1 B: zırh, cübbe, kalkan ve imza eşyaları', () => {
  it('60 katalog parçası (45 + 15) ve 6 imza eşyası; her parçanın ilk gücü AC/taban satırı, her güç durum etiketli', () => {
    expect(B.filter((x) => !x.katalog.ref.startsWith('BOSS#'))).toHaveLength(60);
    expect(B.filter((x) => x.katalog.ref.startsWith('BOSS#')).map((x) => x.katalog.tur).sort()).toEqual(['silah', 'silah', 'silah', 'zirh', 'zirh', 'zirh']);
    for (const x of B) {
      expect(x.katalog.ozellikler.length, x.id).toBeGreaterThan(0);
      for (const f of x.katalog.ozellikler) expect(['calisir', 'kismi', 'planli', 'calismiyor'], `${x.id}/${f.ad}`).toContain(f.durum);
    }
  });
  it('Kuzgun Kanadı Derisi: Studded Leather (12) + 2; zırh giyilmezse ek yok', () => {
    expect(ac(sheet(['Ravenwing Leather'], { armorName: 'Studded Leather Armor' })) - ac(sheet([], { armorName: 'Studded Leather Armor' }))).toBe(2);
    expect(ac(sheet(['Ravenwing Leather'])) - ac(sheet([]))).toBe(0);
  });
  it('K8: "+2 AC sağlar" kalkanı Shield + 2, "Toplam +3 AC" kalkanı Shield + 1; kalkan taşınmazsa ek yok', () => {
    const shield = { shield: true };
    expect(ac(sheet(['Deflector Knight Shield'], shield)) - ac(sheet([], shield))).toBe(2);
    expect(ac(sheet(['Walking Bastion Shield'], shield)) - ac(sheet([], shield))).toBe(1);
    expect(ac(sheet(['Spellmirror Greatshield'], shield)) - ac(sheet([], shield))).toBe(1);
    expect(ac(sheet(['Deflector Knight Shield'])) - ac(sheet([]))).toBe(0);
  });
  it('Kör Nokta Cübbesi: zırhsız taban 15 + DEX (kalkan eklenir); Unarmored Defense ile toplanmaz, yüksek olan; psişik direnç, Charmed/Frightened bağışıklığı', () => {
    expect(ac(sheet(['Robe of the Blindspot'])) - ac(sheet([]))).toBe(5);
    expect(ac(sheet(['Robe of the Blindspot'], { shield: true })) - ac(sheet([], { shield: true }))).toBe(5);
    expect(ac(sheet(['Robe of the Blindspot'], { armorName: 'Studded Leather Armor' }))).toBe(ac(sheet([], { armorName: 'Studded Leather Armor' })));
    // Monk: 10 + DEX + WIS; WIS +5 ise eşik eşit (Unarmored Defense korunur), WIS +3 ise cübbenin 15'i (15 + DEX).
    const monk = (wis: number, names: string[]) => ac(sheet(names, { classId: 'monk', baseScores: { str: 10, dex: 10, con: 10, int: 10, wis, cha: 10 }, backgroundBonuses: {} }));
    expect(monk(16, ['Robe of the Blindspot'])).toBe(15);
    expect(monk(16, [])).toBe(13);
    const e = itemParts(['Robe of the Blindspot'], 'p1').effects.find((x) => x.id === 'item:robe-of-the-blindspot')!;
    expect(e.resist).toEqual(['psychic']);
    expect(e.immune).toEqual(['Charmed', 'Frightened']);
  });
  it('pasifler birebir: Zehirli Kabuk zehir/Poisoned bağışıklığı + CON +1; Yürüyen Hisar büyüye karşı avantaj + Warding Bond; Güneş Siperi büyü +1', () => {
    const v = itemParts(['Venomcarapace Scale'], 'p1').effects[0]!;
    expect(v.immuneDamage).toEqual(['poison']);
    expect(v.immune).toEqual(['Poisoned']);
    expect(v.saveMod).toEqual({ con: 1 });
    const w = itemParts(['Walking Bastion Shield'], 'p1');
    expect(w.effects[0]!.saveAdvAgainst).toEqual(['spell']);
    expect(w.addSpells).toContain('Warding Bond');
    expect(w.addResources['item:walking-bastion-shield']).toBe(1);
    expect(itemParts(['Sunward Shield'], 'p1').spellBonus).toBe(1);
    expect(itemParts(['Mossmantle Armor'], 'p1').addSpells).toContain('Plant Growth');
  });
  it('Kızıl Avcı Derisi: inisiyatif +2 (paket); Atik Kedi Tuniği inisiyatif avantajı (paket) + DEX kontrolü avantajı', () => {
    const { a } = battle(sheet(['Crimson Stalker Leather']));
    const { a: b0 } = battle(sheet([]));
    expect(a.initiativeBonus - b0.initiativeBonus).toBe(2);
    expect(itemParts(['Nimble Cat Tunic'], 'p1').effects[0]!.checkAdv).toEqual(['dex']);
  });
  it('Üstün Odak Cübbesi: AC eki yalnız konsantrasyonda (koşullu paket pasifi: +1 AC, kurtarmalara +2)', () => {
    expect(ac(sheet(['Robe of Supreme Focus'])) - ac(sheet([]))).toBe(0);
    const { s, a } = battle(sheet(['Robe of Supreme Focus']));
    const f = a.paket!.ozellikler.flatMap((x) => x.ilkeller).find((p) => p.tur === 'zarEtkisi' && (p.kosul as string[] | undefined)?.includes('konsantrasyon'))!;
    expect(kosulOk(s as BattleState, a, f)).toBe(false);
    expect(kosulOk(s as BattleState, { ...a, concentration: { spell: 'Bless' } } as Combatant, f)).toBe(true);
    const body = passiveBody(f, a, s as BattleState)!;
    expect(body.ac).toBe(1);
    expect(body.saveMod).toEqual({ str: 2, dex: 2, con: 2, int: 2, wis: 2, cha: 2 });
  });
  it('Zincirli Dikilitaş: +3 ve 1d8 gürültü yalnız bağlı Maul ile; Kaltakkıran zırh bağı yokken bonus vermez', () => {
    const { a } = battle(sheet(["Mountain-Crusher's Chained Monolith"], { weapons: [{ name: 'Maul' }, { name: 'Dagger' }] }));
    const maul = a.weaponOptions.find((o) => o.weaponId === 'maul' && !o.ranged)!, dg = a.weaponOptions.find((o) => o.weaponId === 'dagger' && !o.ranged)!;
    expect(maul.enchant).toBe(3);
    expect(dg.enchant ?? 0).toBe(0);
    const foe = mk('F', { side: 'enemies' });
    expect(itemHitsFor(a, maul, foe).map((h) => `${h.dice} ${h.type}`)).toContain('1d8 thunder');
    const { a: k } = battle(sheet(["Kaltakkıran"], { weapons: [{ name: 'Greatsword' }] }));
    expect(k.weaponOptions.find((o) => o.weaponId === 'greatsword')!.enchant ?? 0).toBe(0);
  });
});
