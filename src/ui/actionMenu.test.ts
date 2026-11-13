/** Görev SD2: savaş eylem menüsünün yapısı (saf işlevler) ve menüde çıkabilecek her özelliğin Türkçe adı. */
import { describe, it, expect } from 'vitest';
import { activeSpecialGroups, costOfKey, pageOf, placeOf, spellGroups, splitMenu, visible, SPECIAL_GROUPS, TOP_KEYS, type MenuItem } from './actionMenu';
import { classes, races } from '../data';
import { classKit } from '../rules/classFeatures';
import { allSubclassIds, findSubclass } from '../rules/subclasses';
import { combatantFromSheet } from '../battle/create';
import { setLang, t } from '../i18n';
import type { CharacterSheet } from '../rules/stats';

const it0 = (key: string, reason?: string): MenuItem => ({ key, label: key, ...(reason ? { reason } : {}), act: () => undefined });

describe('menü yeri', () => {
  it('üst düzey 6 anahtar, hareket, eşya ve özel grupları', () => {
    expect(TOP_KEYS).toHaveLength(6);
    for (const k of TOP_KEYS) expect(placeOf(k)).toEqual({ area: 'top' });
    expect(placeOf('walk')).toEqual({ area: 'move' });
    expect(placeOf('escape_grapple')).toEqual({ area: 'move' });
    expect(placeOf('item-potions-of-healing')).toEqual({ area: 'items' });
    expect(placeOf('object')).toEqual({ area: 'items' });
    expect(placeOf('dodge')).toEqual({ area: 'special', group: 'other' });
    expect(placeOf('help')).toEqual({ area: 'special', group: 'other' });
    expect(placeOf('hide')).toEqual({ area: 'special', group: 'other' });
    expect(placeOf('shape-tiger')).toEqual({ area: 'special', group: 'shape' });
    expect(placeOf('magician-3')).toEqual({ area: 'special', group: 'slots' });
    expect(placeOf('resurge-slot')).toEqual({ area: 'special', group: 'slots' });
    expect(placeOf('font-slot')).toEqual({ area: 'special', group: 'slots' });
    expect(placeOf('paladin:lay-on-hands')).toEqual({ area: 'special', group: 'heal' });
    expect(placeOf('wind')).toEqual({ area: 'special', group: 'heal' });
    expect(placeOf('rage')).toEqual({ area: 'special', group: 'combat' });
    expect(placeOf('steed-fey-step')).toEqual({ area: 'special', group: 'summon' });
    expect(placeOf('srd19:stonecunning')).toEqual({ area: 'special', group: 'other' });
    expect(placeOf('mountWhy')).toEqual({ area: 'hidden' });
  });
  it('bilinmeyen (yeni) yetenek kaybolmaz: Özel ▸ Dövüş', () => {
    expect(placeOf('yeni:yetenek')).toEqual({ area: 'special', group: 'combat' });
  });
  it('hızlı eylem rozeti: özellik türü, sabit anahtarlar, hayvan formu', () => {
    expect(costOfKey('x', 'bonus')).toBe('bonus');
    expect(costOfKey('x', 'action')).toBeUndefined();
    expect(costOfKey('rage')).toBe('bonus');
    expect(costOfKey('shape-wolf')).toBe('bonus');
    expect(costOfKey('attack')).toBeUndefined();
  });
});

describe('menü bölme, sayfalama, görünürlük', () => {
  const list = ['attack', 'move', 'spell', 'end', 'jump', 'dodge', 'rage', 'item-potion', 'shape-bear', 'steer'].map((k) => it0(k));
  it('öğeler üst düzey, hareket, eşya ve özel gruplarına bölünür', () => {
    const s = splitMenu(list);
    expect(Object.keys(s.top).sort()).toEqual(['attack', 'end', 'move', 'spell']);
    expect(s.move.map((i) => i.key)).toEqual(['jump']);
    expect(s.items.map((i) => i.key)).toEqual(['item-potion']);
    expect(s.special.other.map((i) => i.key)).toEqual(['dodge']);
    expect(s.special.combat.map((i) => i.key)).toEqual(['rage']);
    expect(s.special.shape.map((i) => i.key)).toEqual(['shape-bear']);
    expect(s.special.summon.map((i) => i.key)).toEqual(['steer']);
    expect(activeSpecialGroups(s)).toEqual(['combat', 'shape', 'summon', 'other'].filter((g) => SPECIAL_GROUPS.includes(g as never)));
  });
  it('alt menüde yapılamayan öğe gizlenir; yalnız yapılamayanı olan grup sekmesi çıkmaz', () => {
    const s = splitMenu([it0('rage', 'kullanıldı'), it0('dodge'), it0('help', 'yakında düşman yok')]);
    expect(visible(s.special.combat)).toEqual([]);
    expect(activeSpecialGroups(s)).toEqual(['other']);
    expect(visible(s.special.other).map((i) => i.key)).toEqual(['dodge']);
  });
  it('halka alt menüsü: sığıyorsa tek sayfa (içerik + Geri ≤ 6), değilse 4 öğe + Daha fazla + Geri', () => {
    const five = Array.from({ length: 5 }, (_, i) => i);
    expect(pageOf(five, 0)).toEqual({ shown: five, more: false, pages: 1 });
    const nine = Array.from({ length: 9 }, (_, i) => i);
    expect(pageOf(nine, 0)).toEqual({ shown: [0, 1, 2, 3], more: true, pages: 3 });
    expect(pageOf(nine, 1).shown).toEqual([4, 5, 6, 7]);
    expect(pageOf(nine, 2).shown).toEqual([8]);
    expect(pageOf(nine, 3).shown).toEqual([0, 1, 2, 3]);
    for (let p = 0; p < 6; p++) expect(pageOf(nine, p).shown.length + 2).toBeLessThanOrEqual(6);
  });
  it('büyü sekmeleri seviyeye göre, küçükten büyüğe; boş seviye yok', () => {
    const g = spellGroups([{ level: 2, n: 'a' }, { level: 0, n: 'b' }, { level: 2, n: 'c' }, { level: 5, n: 'd' }]);
    expect(g.map((x) => [x.level, x.items.length])).toEqual([[0, 1], [2, 2], [5, 1]]);
  });
});

describe('menüde çıkan her özelliğin Türkçe adı var (ham İngilizce kural adı kalmasın)', () => {
  const sheet = (over: Partial<CharacterSheet>): CharacterSheet => ({ name: 'T', raceId: 'human', classId: 'fighter', level: 20, gender: 'erkek', baseScores: { str: 15, dex: 13, con: 14, int: 10, wis: 12, cha: 8 }, backgroundBonuses: { str: 2, con: 1 }, armorName: 'Chain Mail', shield: false, itemNames: [], weapons: [{ name: 'Longsword' }], skills: [], advancements: [], weaponMasteries: [], spellNames: [], ...over } as CharacterSheet);
  const known = (): Set<string> => {
    const feats = new Map<string, { name: string; kind: string }>();
    const add = (f: { key: string; name: string; effect: { kind: string } }) => feats.set(f.key, { name: f.name, kind: f.effect.kind });
    for (const c of classes) for (const sid of [undefined, ...allSubclassIds().filter((id) => findSubclass(c.id, id))]) {
      for (let l = 1; l <= 20; l++) { try { for (const f of classKit(c.id, l, sid).usable) add(f); } catch { /* seviyede yok */ } }
      try { for (const f of combatantFromSheet(sheet({ classId: c.id, subclassId: sid }), { id: 'x', ownerId: 'p' }).features ?? []) add(f); } catch { /* alt sınıf bu sınıfa ait değil */ }
    }
    for (const r of races) for (const ln of [undefined, ...((r as { lineages?: Array<{ id: string }> }).lineages ?? []).map((l) => l.id)]) {
      try { for (const f of combatantFromSheet(sheet({ raceId: r.id, lineageId: ln }), { id: 'x', ownerId: 'p' }).features ?? []) add(f); } catch { /* yok */ }
    }
    return new Set([...feats.entries()].filter(([k, v]) => v.kind !== 'wildShape' && !k.startsWith('imza:')).map(([k]) => k));
  };
  it('TR ve EN featureName bütün menü özelliklerini kapsar', () => {
    const keys = known();
    expect(keys.size).toBeGreaterThan(20);
    for (const lang of ['tr', 'en'] as const) {
      setLang(lang);
      const names = t().battle.label.featureName;
      for (const k of keys) expect(names[k], `${lang}: ${k}`).toBeTruthy();
    }
    setLang('tr');
  });
  it('TR adlarda ham İngilizce kural adı kalmaz (yalnız özel ad olan çeviri dışı kayıtlar hariç)', () => {
    setLang('tr');
    const L = t().battle.label;
    const raw = /Wild Shape|Wild Resurgence|Nature Magician|Sorcery Point|Superior Defense|Channel Divinity|Divine Spark|Stonecunning|Adrenaline|Draconic Flight|Lay On Hands/;
    for (const v of Object.values(L.featureName)) expect(v).not.toMatch(raw);
    for (const s of [L.natureMagician(1, 2), L.resurgeShape, L.resurgeSlot, L.fontToPoints(1), L.fontToSlot(5), L.shapeOn('Bear', '1'), L.shapeOff('Bear'), L.superiorDefense, L.iswap, L.gaze, L.eldritchSmite]) expect(s).not.toMatch(raw);
  });
});
