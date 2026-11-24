/**
 * Görev MC1: çoklu sınıf verisi (`data/cok-sinif.json`) SRD 5.2.1 kaydıyla tutarlı, yardımcılar tek sınıfta eski üç
 * alanla aynı, tek sınıflı karakter kaydı sürüm 4'te de sürüm 3'teki gibi yazılıyor ve göçsüz yükleniyor.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import srdClasses from '../../data/srd/classes.json';
import srdTools from '../../data/srd/tools.json';
import gameClasses from '../../data/classes.json';
import { ABILITIES, type Ability } from './abilities';
import type { Skill } from './skills';
import type { CharacterSheet, Scores } from './stats';
import {
  MULTICLASS_MIN_SCORE, addClassProblems, classLevel, classesOf, isMulticlass, meetsPrimary, multiclassClassIds,
  multiclassInfo, multiclassProblems, syncClassFields, totalLevel,
} from './multiclass';
import { LEVEL_CAP, MAX_CLASSES } from '../app/limits';
import { CHARACTER_SAVE_VERSION, loadCharacters, saveCharacters } from '../app/storage';
import { newCharacter, type SavedCharacter } from './builder';
import { demoCharacters } from '../screens/fixtures';

type SrdClass = { id: string; source: { page: number }; core: Record<string, string> };
type GameClass = { id: string; casting?: { type: string } | null; armorTraining: string[]; weaponProficiency: string; skillChoices: { from: Skill[] | 'any' } };
const SRD = (srdClasses as unknown as { classes: SrdClass[] }).classes;
const GAME = gameClasses as unknown as GameClass[];
const ABILITY_NAME: Record<string, Ability> = { Strength: 'str', Dexterity: 'dex', Constitution: 'con', Intelligence: 'int', Wisdom: 'wis', Charisma: 'cha' };
const skillsOf = (id: string): readonly Skill[] | 'any' => GAME.find((c) => c.id === id)!.skillChoices.from;
const scores = (v: Partial<Scores>): Scores => ({ ...Object.fromEntries(ABILITIES.map((a) => [a, 10])), ...v }) as Scores;

describe('MC1 veri: data/cok-sinif.json ↔ SRD 5.2.1', () => {
  it('12 SRD sınıfının hepsi var, fazlası yok; sayfa SRD sınıf bölümünün sayfası', () => {
    expect(multiclassClassIds().sort()).toEqual(SRD.map((c) => c.id).sort());
    for (const c of SRD) expect(multiclassInfo(c.id)!.sayfa, c.id).toBe(c.source.page);
  });
  it('ana yetenek "Core Traits" metninden: "and" → hepsi, "or" → biri; eşik 13 (s. 24)', () => {
    expect(MULTICLASS_MIN_SCORE).toBe(13);
    for (const c of SRD) {
      const text = c.core['Primary Ability']!;
      const names = text.split(/ and | or /).map((x) => ABILITY_NAME[x.trim()]);
      expect(names.every(Boolean), `${c.id}: ${text}`).toBe(true);
      const a = multiclassInfo(c.id)!.anaYetenek;
      if (text.includes(' or ')) expect(a, c.id).toEqual({ biri: names });
      else expect(a, c.id).toEqual({ hepsi: names });
    }
  });
  it('yuva katkısı s. 25 listesiyle ve sınıfın büyücülük türüyle aynı (tam/yarı/pact/yok)', () => {
    const want: Record<string, string | null> = { full: 'tam', half: 'yari', pact: 'pact' };
    for (const c of GAME) expect(multiclassInfo(c.id)!.yuva, c.id).toBe(c.casting?.type ? want[c.casting.type] : null);
    // SRD s. 25: tamamı Bard, Cleric, Druid, Sorcerer, Wizard; yarısı Paladin, Ranger.
    expect(multiclassClassIds().filter((id) => multiclassInfo(id)!.yuva === 'tam').sort()).toEqual(['bard', 'cleric', 'druid', 'sorcerer', 'wizard']);
    expect(multiclassClassIds().filter((id) => multiclassInfo(id)!.yuva === 'yari').sort()).toEqual(['paladin', 'ranger']);
  });
  it('ek yetkinlikler sınıfın kendi başlangıç yetkinliklerinin alt kümesi; alet SRD kimliği; liste becerisi yalnız listeli sınıfta', () => {
    const tools = new Set((srdTools as unknown as { tools: Array<{ id: string }> }).tools.map((t) => t.id));
    for (const c of GAME) {
      const ek = multiclassInfo(c.id)!.ek;
      for (const z of ek.zirh ?? []) expect(c.armorTraining, `${c.id} ${z}`).toContain(z);
      for (const s of ek.silah ?? []) expect(c.weaponProficiency, `${c.id} ${s}`).toBe(s);
      for (const t of ek.alet ?? []) expect(tools.has(t), t).toBe(true);
      if (ek.beceri?.liste === 'sinif') expect(c.skillChoices.from, c.id).not.toBe('any');
    }
  });
  it('ek sınıfın ilk seviyesi tablosu (SRD sınıf kutuları "As a Multiclass Character")', () => {
    const ek = (id: string) => multiclassInfo(id)!.ek;
    expect(ek('barbarian')).toEqual({ silah: ['martial'], zirh: ['shield'] });
    expect(ek('bard')).toEqual({ zirh: ['light'], beceri: { sayi: 1, liste: 'hepsi' }, calgi: 1 });
    expect(ek('rogue')).toEqual({ zirh: ['light'], beceri: { sayi: 1, liste: 'sinif' }, alet: ['thieves-tools'] });
    for (const id of ['monk', 'sorcerer', 'wizard']) expect(ek(id), id).toEqual({});
    // Hiçbir sınıfta kurtarma zarı yetkinliği ya da ağır zırh yok.
    for (const id of multiclassClassIds()) expect(ek(id).zirh ?? [], id).not.toContain('heavy');
  });
});

describe('MC1 yardımcılar', () => {
  const fighter: Pick<CharacterSheet, 'classId' | 'level' | 'subclassId' | 'classes'> = { classId: 'fighter', level: 5, subclassId: 'champion' };
  const multi = { classId: 'x', level: 0, classes: [{ classId: 'fighter', level: 3, subclassId: 'champion' }, { classId: 'rogue', level: 2, ekBeceri: 'stealth' as Skill }] };

  it('tek sınıf: classesOf eski üç alandan tek öğe; seviye ve toplam aynı', () => {
    expect(classesOf(fighter)).toEqual([{ classId: 'fighter', level: 5, subclassId: 'champion' }]);
    expect(classesOf({ classId: 'wizard', level: 1 })).toEqual([{ classId: 'wizard', level: 1 }]);
    expect(classLevel(fighter, 'fighter')).toBe(5);
    expect(classLevel(fighter, 'rogue')).toBe(0);
    expect(isMulticlass(fighter)).toBe(false);
    expect(totalLevel(fighter)).toBe(5);
  });
  it('çoklu sınıf: sınıf seviyeleri ve toplam (SRD örneği Fighter 3 / Rogue 2 = 5. seviye)', () => {
    expect(isMulticlass(multi)).toBe(true);
    expect(classLevel(multi, 'rogue')).toBe(2);
    expect(totalLevel(multi)).toBe(5);
  });
  it('syncClassFields: tek sınıfta aynı nesne; çoklu sınıfta ilk öğe + toplam; tek öğe eski biçime katlanır; boş dizi silinir', () => {
    expect(syncClassFields(fighter)).toBe(fighter);
    const s = syncClassFields(multi);
    expect(s).toMatchObject({ classId: 'fighter', subclassId: 'champion', level: 5 });
    expect(s.classes).toBe(multi.classes);
    const one = syncClassFields({ classId: 'x', level: 9, classes: [{ classId: 'fighter', level: 5, subclassId: 'champion' }] });
    expect(one).toEqual(fighter);
    expect('classes' in one).toBe(false);
    const empty = syncClassFields({ ...fighter, classes: [] });
    expect(empty).toEqual(fighter);
    expect('classes' in empty).toBe(false);
  });
  it('ana yetenek: Fighter STR ya da DEX, Monk DEX ve WIS; Barbarian → Druid STR ve WIS 13 (SRD s. 24 örneği)', () => {
    expect(meetsPrimary('fighter', scores({ dex: 13 }))).toBe(true);
    expect(meetsPrimary('fighter', scores({ str: 12, dex: 12 }))).toBe(false);
    expect(meetsPrimary('monk', scores({ dex: 13, wis: 12 }))).toBe(false);
    expect(meetsPrimary('monk', scores({ dex: 13, wis: 13 }))).toBe(true);
    const barb = { classId: 'barbarian', level: 3 };
    expect(addClassProblems(barb, 'druid', scores({ str: 13, wis: 13 }))).toEqual([]);
    expect(addClassProblems(barb, 'druid', scores({ str: 12, wis: 13 }))).toEqual([{ kind: 'onKosul', classId: 'barbarian', abilities: ['str'], any: false }]);
    expect(addClassProblems(barb, 'druid', scores({ str: 13, wis: 12 }))).toEqual([{ kind: 'onKosul', classId: 'druid', abilities: ['wis'], any: false }]);
    expect(meetsPrimary('bilinmeyen-sinif', scores({}))).toBe(false);
  });
  it('sınır: en çok 3 sınıf, aynı sınıf iki kez yok, toplam seviye sınırı', () => {
    expect(MAX_CLASSES).toBe(3);
    const hi = scores({ str: 15, dex: 15, con: 15, int: 15, wis: 15, cha: 15 });
    const three = { classId: 'fighter', level: 3, classes: [{ classId: 'fighter', level: 1 }, { classId: 'rogue', level: 1 }, { classId: 'wizard', level: 1 }] };
    expect(addClassProblems(three, 'cleric', hi)).toEqual([{ kind: 'cok', max: 3, count: 4 }]);
    expect(addClassProblems(three, 'rogue', hi).map((p) => p.kind)).toContain('tekrar');
    expect(addClassProblems({ classId: 'fighter', level: LEVEL_CAP }, 'rogue', hi)).toEqual([{ kind: 'toplam', total: LEVEL_CAP + 1, max: LEVEL_CAP }]);
    expect(multiclassProblems(three, hi, skillsOf)).toEqual([]);
    const four = { ...three, classes: [...three.classes, { classId: 'cleric', level: 1 }] };
    expect(multiclassProblems(four, hi, skillsOf)).toEqual([{ kind: 'cok', max: 3, count: 4 }]);
  });
  it('tek sınıfta ön koşul aranmaz; çoklu sınıfta bütün sınıfların ön koşulu ve ek beceri listesi denetlenir', () => {
    expect(multiclassProblems({ classId: 'wizard', level: 3 }, scores({ int: 8 }), skillsOf)).toEqual([]);
    const ok = scores({ str: 13, dex: 13 });
    expect(multiclassProblems(multi, ok, skillsOf)).toEqual([]);
    const bad = { ...multi, classes: [multi.classes[0]!, { classId: 'rogue', level: 2, ekBeceri: 'religion' as Skill }] };
    expect(multiclassProblems(bad, ok, skillsOf)).toEqual([{ kind: 'ekBeceri', classId: 'rogue', skill: 'religion' }]);
    expect(multiclassProblems(multi, scores({ str: 13, dex: 12 }), skillsOf)).toEqual([{ kind: 'onKosul', classId: 'rogue', abilities: ['dex'], any: false }]);
  });
});

describe('MC1 kayıt: sürüm 4, tek sınıflı karakter sürüm 3 gibi yazılır ve göçsüz yüklenir', () => {
  const STORE_KEY = 'rpg-battle-characters';
  beforeEach(() => {
    const m = new Map<string, string>();
    (globalThis as { localStorage?: Storage }).localStorage = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, String(v)); }, removeItem: (k: string) => { m.delete(k); }, clear: () => m.clear(), key: (i: number) => [...m.keys()][i] ?? null, get length() { return m.size; } } as Storage;
  });
  const singles = (): SavedCharacter[] => [...demoCharacters(), newCharacter('mc1-yeni')];

  it('kayıt sürümü 4', () => expect(CHARACTER_SAVE_VERSION).toBe(4));
  it('tek sınıflı karakter: yazılan JSON sürüm 3 yazımıyla yalnız `surum` değerinde ayrışır; `classes` yazılmaz', () => {
    const list = singles();
    saveCharacters(list);
    const raw = localStorage.getItem(STORE_KEY)!;
    expect(raw).not.toContain('"classes"');
    // Sürüm 3 yazımı: aynı liste, `surum: 3` (MC1 öncesi saveCharacters bu dökümü üretiyordu; kancasız ve hikâyesiz liste).
    const v3 = JSON.stringify(list.map((c) => ({ ...c, surum: 3 })));
    expect(raw).toBe(v3.replaceAll('"surum":3', '"surum":4'));
    for (const c of list) expect(syncClassFields(c.sheet), c.sheet.name).toBe(c.sheet);
  });
  it('sürüm 3 kaydı göçsüz yüklenir; karakter tek sınıf, sayfa bayt bayt aynı', () => {
    const list = singles().map((c) => ({ ...c, surum: 3 }));
    const raw = JSON.stringify(list);
    localStorage.setItem(STORE_KEY, raw);
    const loaded = loadCharacters();
    expect(JSON.stringify(loaded)).toBe(raw);
    for (const c of loaded) {
      expect(classesOf(c.sheet)).toEqual([{ classId: c.sheet.classId, level: c.sheet.level, ...(c.sheet.subclassId !== undefined ? { subclassId: c.sheet.subclassId } : {}) }]);
      expect(isMulticlass(c.sheet)).toBe(false);
    }
  });
  it('çoklu sınıflı karakter `classes` ile yazılır ve aynen geri okunur', () => {
    const [c] = singles();
    const sheet = syncClassFields({ ...c!.sheet, classes: [{ classId: 'fighter', level: 3 }, { classId: 'wizard', level: 2 }] });
    saveCharacters([{ ...c!, sheet }]);
    const back = loadCharacters()[0]!;
    expect(back.surum).toBe(4);
    expect(classesOf(back.sheet).map((x) => [x.classId, x.level])).toEqual([['fighter', 3], ['wizard', 2]]);
    expect(back.sheet).toMatchObject({ classId: 'fighter', level: 5 });
  });
});
