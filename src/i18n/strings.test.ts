/** Görev H: TR ve EN metinleri aynı yapıda; dil seçimi; donanım açıklamaları ve oluşturucu kuralları. */
import { describe, it, expect, afterEach } from 'vitest';
import { STRINGS } from './strings';
import { getLang, setLang, t } from './index';
import { armor, items, weapons } from '../data';
import { armorSummary, itemSummary, weaponSummary } from '../ui/equipmentText';
import { canRaiseBonus } from '../rules/builder';
import { deriveStats, type CharacterSheet } from '../rules/stats';

/** Nesnenin anahtar yolları ve değer türleri (fonksiyon/metin). */
function shape(o: unknown, path = ''): string[] {
  if (typeof o !== 'object' || o === null || Array.isArray(o)) return [`${path}:${Array.isArray(o) ? 'array' : typeof o}`];
  return Object.entries(o).flatMap(([k, v]) => shape(v, `${path}.${k}`)).sort();
}

afterEach(() => setLang('tr'));

describe('dil dosyası', () => {
  it('TR ve EN aynı anahtarlara ve türlere sahip, boş metin yok', () => {
    expect(shape(STRINGS.en)).toEqual(shape(STRINGS.tr));
    const empty = (o: unknown, p: string): string[] => typeof o === 'string' ? (o === '' ? [p] : [])
      : typeof o === 'object' && o !== null ? Object.entries(o).flatMap(([k, v]) => empty(v, `${p}.${k}`)) : [];
    // Bilerek boş: koşulsuz mod eki ve "ayakta" durum etiketi.
    const allowed = ['.log.mode.normal', '.battle.summary.status.ayakta'];
    expect(empty(STRINGS.tr, '').filter((p) => !allowed.includes(p))).toEqual([]);
    expect(empty(STRINGS.en, '').filter((p) => !allowed.includes(p))).toEqual([]);
  });
  it('varsayılan Türkçe; EN seçilince metinler değişir; "Game Master" yazılır', () => {
    expect(getLang()).toBe('tr');
    expect(t().gm.title).toBe('Game Master: savaşı kur');
    setLang('en');
    expect(t().gm.search(3)).toBe('Search: name or "CR 5" (3 monsters)');
    expect(t().common.gm).toBe('Game Master');
  });
});

describe('donanım açıklamaları (SRD verisinden)', () => {
  const a = (n: string) => armor.find((x) => x.name === n)!;
  it('zırh: AC, DEX sınırı, Güç şartı, Gizlenme dezavantajı', () => {
    expect(armorSummary(a('Chain Mail'))).toBe('AC 16 (DEX eklenmez) · Güç 13 · Gizlenmede dezavantaj');
    expect(armorSummary(a('Breastplate'))).toBe('AC 14 + DEX (en çok +2)');
    expect(armorSummary(a('Leather Armor'))).toBe('AC 11 + DEX');
  });
  it('silah: hasar, tür, menzil ve özellikler; eşya: etkiler ve uyum', () => {
    expect(weaponSummary(weapons.find((w) => w.name === 'Longbow')!)).toBe('1d8 delici · menzilli · Heavy · Two-Handed · Ammunition 150/600 ft');
    expect(weaponSummary(weapons.find((w) => w.name === 'Dagger')!)).toBe('1d4 delici · yakın dövüş · Finesse · Light · Thrown 20/60 ft');
    expect(itemSummary(items.find((i) => i.name === 'Ring of Protection')!)).toBe('AC +1 · bütün kurtarma zarları +1 · uyum (attunement) gerekir');
    setLang('en');
    expect(weaponSummary(weapons.find((w) => w.name === 'Longsword')!)).toBe('1d8 slashing · melee · Versatile (1d10)');
  });
});

describe('oluşturucu kuralları', () => {
  it('geçmiş bonusu: yalnızca +2/+1 ya da +1/+1/+1 kalıbına götüren artışlar', () => {
    expect(canRaiseBonus({}, 'str')).toBe(true);
    expect(canRaiseBonus({ str: 1 }, 'str')).toBe(true);
    expect(canRaiseBonus({ str: 2 }, 'str')).toBe(false);
    expect(canRaiseBonus({ str: 2, dex: 1 }, 'con')).toBe(false);
    expect(canRaiseBonus({ str: 1, dex: 1 }, 'con')).toBe(true);
    expect(canRaiseBonus({ str: 1, dex: 1, con: 1 }, 'str')).toBe(false);
  });
  it('AC bileşenleri ve zırhın Güç şartı (hız −10 ft)', () => {
    const sheet: CharacterSheet = { name: 'X', raceId: 'human', classId: 'fighter', level: 1, baseScores: { str: 12, dex: 14, con: 13, int: 10, wis: 10, cha: 8 },
      armorName: 'Chain Mail', shield: true, itemNames: ['Ring of Protection'] };
    const d = deriveStats(sheet);
    expect(d.acParts.map((p) => [p.kind, p.value])).toEqual([['armor', 16], ['shield', 2], ['item', 1]]);
    expect(d.ac).toBe(19);
    expect(d.armorStrengthShort).toBe(13);
    expect(d.speed).toBe(20);
    const strong = deriveStats({ ...sheet, baseScores: { ...sheet.baseScores, str: 13 } });
    expect([strong.armorStrengthShort, strong.speed]).toEqual([undefined, 30]);
  });
});
