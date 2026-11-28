/**
 * Görev KATALOG-1 A: özgün katalog silahları (data/items-katalog.json). Temsilci silahlarla savaşta: büyülü bonus ve koşulsuz ek
 * hasar yalnız taban SRD silahında (KARAR104 A10 bağı), eşyadan SRD büyüsü yükle, eldeyken pasif direnç; PDF'teki her güç kayıtta.
 */
import { describe, expect, it } from 'vitest';
import katalog from '../../data/items-katalog.json';
import { combatantFromSheet } from './index';
import { startBattle } from './create';
import { itemHitsFor, itemParts } from './itemEffects';
import { mk } from './fixtures';
import { blankCharacter } from '../rules/builder';
import { boundWeaponName } from '../rules/itemBinding';
import type { CharacterSheet } from '../rules/stats';
import { CURRENT_RULES } from './ruleVersion';
import { items } from '../data';
import type { Combatant } from './types';
import { ilkelErrors } from '../content/ilkelSema';
import { esyaProspektus } from '../dungeondex/prospektus/esya';
import { t } from '../i18n';

const kat = (katalog as unknown as { esyalar: Array<{ id: string; name: string; katalog: { ref: string; tur: string; taban: string; ozellikler: Array<{ durum: string }> } }> }).esyalar;
const sheet = (itemNames: string[], weapons: string[], patch: Partial<CharacterSheet> = {}) => ({ ...blankCharacter('p1').sheet, name: 'Savaşçı', classId: 'fighter', level: 5,
  weapons: weapons.map((name) => ({ name })), itemNames, ...patch }) as CharacterSheet;
const opts = (sh: CharacterSheet) => {
  const c = combatantFromSheet(sh, { id: 'A', ownerId: 'p1' });
  const s = startBattle('kat-a', 'd', [{ ...c, pos: null }], () => 0.5, { kuralSurumu: CURRENT_RULES } as never).state;
  const a = s.combatants.A as Combatant;
  return { a, by: (id: string) => a.weaponOptions.find((o) => o.weaponId === id && !o.ranged)! };
};

describe('KATALOG-1 A: silahlar', () => {
  it('125 silah, hepsi listede ve taban SRD silahına bağlı; her silahın en az bir gücü kayıtta', () => {
    // Görev KATALOG-1 B: imza silahları (BOSS#) B'de; A'nın 125 silahı katalog kaynaklı.
    const silah = kat.filter((x) => x.katalog.tur === 'silah');
    expect(silah.filter((x) => !x.katalog.ref.startsWith('BOSS#'))).toHaveLength(125);
    for (const x of silah) {
      expect(items.some((i) => i.id === x.id), x.id).toBe(true);
      expect(boundWeaponName({ weapons: [{ name: 'Dagger' }] }, x.name) === null || x.katalog.taban === 'dagger', x.id).toBe(true);
      expect(x.katalog.ozellikler.length, x.id).toBeGreaterThan(0);
    }
  });
  it('Yıldız Kesiği (Starcleave): +2 ve 1d6 psişik yalnız bağlı Greatsword ile, Dagger ile değil', () => {
    const { a, by } = opts(sheet(['Starcleave'], ['Greatsword', 'Dagger']));
    const gs = by('greatsword'), dg = by('dagger');
    expect(gs.enchant).toBe(2);
    expect(dg.enchant ?? 0).toBe(0);
    const foe = mk('F', { side: 'enemies' });
    expect(itemHitsFor(a, gs, foe).map((h) => `${h.dice} ${h.type}`)).toContain('1d6 psychic');
    expect(itemHitsFor(a, dg, foe).map((h) => h.type)).not.toContain('psychic');
  });
  it('taban silah taşınmıyorsa bağ yok: bonus hiçbir silaha gitmez', () => {
    const { by } = opts(sheet(['Starcleave'], ['Longsword']));
    expect(by('longsword').enchant ?? 0).toBe(0);
  });
  it('Kıvılcım Kılıcı (Stormbrand): eşyadan 3. seviye Lightning Bolt, 1 yük, DC 15', () => {
    const p = itemParts(['Stormbrand'], 'p1');
    expect(p.addSpells).toContain('Lightning Bolt');
    expect(p.addResources['item:stormbrand']).toBe(1);
    expect(p.casts['item:stormbrand']).toEqual({ dc: 15 });
  });
  it('Kor Ağızlı Balta (Embermaw): eldeyken ateş direnci; Kor Alev Asası: Fireball ve +1 bonus', () => {
    const p = itemParts(['Embermaw Greataxe'], 'p1');
    expect(p.effects.find((e) => e.id === 'item:embermaw-greataxe')?.resist).toEqual(['fire']);
    const q = itemParts(['Incandescent Ember Staff'], 'p1');
    expect(q.addSpells).toContain('Fireball');
  });
  it('eşya paket ilkelleri şemaya uyar; her silahın prospektüsü boş bölüm üretmez (Ne işe yarar, Nasıl kullanılır dolu)', () => {
    const L = t().dex.pro;
    for (const x of kat) {
      const it = items.find((i) => i.id === x.id)!;
      // GECE-KATALOG-KALAN: yalnız `paket.s110` taşıyan eşyada taban ilkel listesi yok (s110 katalogKanca110.test.ts'te).
      if (it.paket?.ilkeller) expect(ilkelErrors(it.paket.ilkeller, x.id, { kaynaklar: new Set(), sinifKaynaklari: new Set(), yaratiklar: new Set() }), x.id).toEqual([]);
      const pro = esyaProspektus(x.id, L, 'tr')!;
      for (const s of pro) if (s.key !== 'durum') expect(s.rows.length, `${x.id}/${s.key}`).toBeGreaterThan(0);
      expect(pro.map((s) => s.key)).toEqual(expect.arrayContaining(['ne', 'nasil', 'etken', 'maliyet', 'durum']));
    }
  });
  it('K7: Titanstring Longbow adı Giant-Sinew Longbow; eski ad yok', () => {
    expect(items.some((i) => i.name === 'Giant-Sinew Longbow')).toBe(true);
    expect(items.some((i) => i.name === 'Titanstring Longbow')).toBe(false);
  });
});
