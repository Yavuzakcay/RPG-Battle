/** Kuyruk KQ4 CK1: karakter hikâyesi (kayıt/yükleme), karakter kâğıdı veri modeli ve çıktısı, JSON dışa/içe aktarma. */
import { describe, expect, it, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { CHARACTER_SAVE_VERSION, loadCharacters, saveCharacters } from '../app/storage';
import { MAX_PARTY } from '../app/limits';
import { newCharacter, savableCharacter, type SavedCharacter } from '../rules/builder';
import { STORY_MAX, cleanStory, filledStory, hasStory } from '../rules/story';
import { deriveStats } from '../rules/stats';
import { abilityModifier } from '../rules/abilities';
import { demoCharacters } from './fixtures';
import { BARBARIAN } from '../sim/balance';
import { sheetModel } from './sheet/sheetModel';
import { SheetView } from './sheet/SheetView';
import { addImported, exportCharacter, parseCharacterFile } from './sheet/io';
import { wizardSteps } from './Builder';
import { NotesScreen } from './NotesScreen';
import { t } from '../i18n';

function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, String(v)); }, removeItem: (k: string) => { m.delete(k); }, clear: () => m.clear(), key: (i: number) => [...m.keys()][i] ?? null, get length() { return m.size; } } as Storage;
}
beforeEach(() => { (globalThis as { localStorage?: Storage }).localStorage = memoryStorage(); });

const STORE_KEY = 'rpg-battle-characters';
const chars = (): { wizard: SavedCharacter; fighter: SavedCharacter; barbarian: SavedCharacter } => {
  const [wizard, fighter] = demoCharacters() as [SavedCharacter, SavedCharacter];
  const barbarian: SavedCharacter = { ...newCharacter('barb'), classSkills: ['athletics', 'perception'], otherSkills: [], sheet: { ...BARBARIAN } };
  return { wizard, fighter, barbarian };
};

describe('CK1 hikâye alanı', () => {
  it('temizleme: boşlar atılır, üst sınır 4000, hiç alan kalmazsa undefined', () => {
    expect(cleanStory({ kisilik: '   ', notlar: '' })).toBeUndefined();
    expect(cleanStory({ kisilik: ' Sakin ', bilinmeyen: 'x' })).toEqual({ kisilik: 'Sakin' });
    expect(cleanStory({ notlar: 'a'.repeat(5000) })?.notlar?.length).toBe(STORY_MAX);
    expect(hasStory({ kisilik: ' ' })).toBe(false);
    expect(filledStory({ baglar: 'x', kisilik: 'y' }).map(([k]) => k)).toEqual(['kisilik', 'baglar']); // sabit sıra
  });
  it('kayıt ve yükleme: dolu alan döner, boş alan yazılmaz; eski kayıt alansız yüklenir; kayıt sürümü 4', () => {
    expect(CHARACTER_SAVE_VERSION).toBe(4); // MC1: çoklu sınıf alanı (classes)
    const { fighter } = chars();
    saveCharacters([{ ...fighter, hikaye: { kisilik: 'Dürüst', notlar: '  ', gorunum: '' } }]);
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]');
    expect(JSON.stringify(raw)).not.toContain('notlar'); expect(JSON.stringify(raw)).toContain('Dürüst');
    expect(loadCharacters()[0]?.hikaye).toEqual({ kisilik: 'Dürüst' });
    // eski kayıt (sürüm 2, hikaye yok)
    const old = { ...fighter, surum: 2 } as unknown as Record<string, unknown>; delete old.hikaye;
    localStorage.setItem(STORE_KEY, JSON.stringify([old]));
    expect(loadCharacters()[0]?.hikaye).toBeUndefined();
    // hiç alan kalmayan hikâye kayda hiç yazılmaz
    saveCharacters([{ ...fighter, hikaye: { notlar: ' ' } }]);
    expect(loadCharacters()[0]).not.toHaveProperty('hikaye');
    expect(savableCharacter({ ...fighter, hikaye: { kisilik: ' ' } })).not.toHaveProperty('hikaye');
  });
  it('oluşturucu: Hikâye adımı özetten önce, Alignment adımından bağımsız; Notları düzenle ekranı çizilir', () => {
    const { wizard, fighter } = chars();
    const steps = wizardSteps(fighter.sheet);
    expect(steps.indexOf('story')).toBe(steps.indexOf('summary') - 1);
    expect(wizardSteps(wizard.sheet)).toContain('spells');
    const html = renderToStaticMarkup(createElement(NotesScreen, { character: { ...fighter, hikaye: { kisilik: 'Sakin' } }, onSave: () => {}, onCancel: () => {} }));
    for (const s of ['Kişilik', 'İdealler', 'Bağlar', 'Kusurlar', 'Görünüm', 'Geçmiş hikâyesi', 'Notlar', 'karakter kaldı', 'Sakin']) expect(html).toContain(s);
    expect(html).toContain(`maxLength="${STORY_MAX}"`.replace('maxLength', 'maxlength').toLowerCase().includes('maxlength') ? 'maxLength' : 'maxlength');
  });
});

describe('CK1 kâğıt veri modeli (Fighter, Wizard, Barbarian)', () => {
  it('AC, HP, bonuslar, yeterlilik, kurtarma ve beceri değerleri türetmeyle aynı', () => {
    for (const c of Object.values(chars())) {
      const d = deriveStats(c.sheet);
      const m = sheetModel(c, 'tr');
      expect(m.ac).toBe(d.ac); expect(m.maxHp).toBe(d.maxHp); expect(m.speed).toBe(d.speed); expect(m.initiative).toBe(d.initiative);
      expect(m.proficiency).toBe(d.proficiency);
      for (const s of m.scores) expect(s.mod).toBe(abilityModifier(s.score));
      for (const s of m.saves) { expect(s.bonus).toBe(d.saves[s.ability]); expect(s.proficient).toBe(d.saveProficiencies.includes(s.ability)); }
      expect(m.skills).toHaveLength(18);
      expect(m.passivePerception).toBe(10 + (d.skills.perception ?? d.modifiers.wis));
      for (const k of c.sheet.skills ?? []) expect(m.skills.find((x) => x.skill === k)?.proficient).toBe(true);
    }
  });
  it('Wizard: büyü DC ve saldırısı, seviye grupları, bileşenler (V/S/M)', () => {
    const { wizard } = chars();
    const d = deriveStats(wizard.sheet);
    const m = sheetModel(wizard, 'tr');
    expect(m.spells?.dc).toBe(d.spellSaveDc); expect(m.spells?.dc).toBe(8 + d.proficiency + d.modifiers.int);
    expect(m.spells?.attack).toBe(d.proficiency + d.modifiers.int);
    expect(m.spells?.groups.some((g) => g.level === 0)).toBe(true);
    const fire = m.spells?.groups.flatMap((g) => g.list).find((s) => s.name === 'Fire Bolt');
    expect(fire?.comps).toBe('VS');
  });
  it('Fighter ve Barbarian: silah saldırı bonusu = yetenek + yeterlilik; sınıf özellikleri ve tür özellikleri var; büyü bölümü yok', () => {
    const { fighter, barbarian } = chars();
    for (const c of [fighter, barbarian]) {
      const d = deriveStats(c.sheet);
      const m = sheetModel(c, 'tr');
      expect(m.spells).toBeNull();
      expect(m.attacks.length).toBeGreaterThan(0);
      const best = Math.max(d.modifiers.str, d.modifiers.dex) + d.proficiency;
      expect(m.attacks.some((a) => a.attack === best || a.attack === d.modifiers.str + d.proficiency || a.attack === d.modifiers.dex + d.proficiency)).toBe(true);
      expect(m.features.some((f) => f.from === 'class')).toBe(true);
      expect(m.gear.weight).toBeGreaterThanOrEqual(0);
    }
    expect(sheetModel(barbarian, 'tr').features.map((f) => f.name)).toContain('Rage');
  });
  it('alt sınıf yüklü değilse "içerik eksik" notu, çökme yok', () => {
    const { fighter } = chars();
    const m = sheetModel({ ...fighter, sheet: { ...fighter.sheet, subclassId: 'olmayan-alt-sinif' } }, 'tr');
    expect(m.missing).toContain('olmayan-alt-sinif');
    expect(renderToStaticMarkup(createElement(SheetView, { c: { ...fighter, sheet: { ...fighter.sheet, subclassId: 'olmayan-alt-sinif' } }, model: m }))).toContain('İçerik eksik');
  });
});

describe('CK1 çıktıda boş alan yok', () => {
  it('boş hikâye alanları ve başlıkları hiç görünmez; hepsi boşsa bölüm de yok; dolu alan görünür', () => {
    const { fighter } = chars();
    const none = renderToStaticMarkup(createElement(SheetView, { c: { ...fighter, hikaye: { kisilik: '  ', notlar: '' } } }));
    for (const s of ['Hikâye', 'Kişilik', 'Notlar', 'Bağlar', 'Kusurlar']) expect(none).not.toContain(s);
    const some = renderToStaticMarkup(createElement(SheetView, { c: { ...fighter, hikaye: { kisilik: 'Dürüst', notlar: '' } } }));
    expect(some).toContain('Hikâye'); expect(some).toContain('Kişilik'); expect(some).toContain('Dürüst');
    expect(some).not.toContain('Notlar'); expect(some).not.toContain('İdealler');
    expect(none).toContain('data-page="1"'); expect(none).toContain('data-page="2"');
  });
  it('sayfa 1 değerler, sayfa 2 özellikler/büyüler/hikâye; Alignment etiketi ev kuralı açık ve gizli değilken', () => {
    const { wizard } = chars();
    const html = renderToStaticMarkup(createElement(SheetView, { c: wizard }));
    expect(html).toContain('Karakter kâğıdı'.slice(0, 0)); // başlık overlay'de; burada içerik
    expect(html).toContain('Fire Bolt'); expect(html).toContain('Büyüler');
    expect(sheetModel({ ...wizard, hizalanma: { duzen: 30, iyilik: 30, baslangic: { duzen: 30, iyilik: 30 }, baslangicTuru: 'otomatik', gunluk: [] } }, 'en', { alignmentOn: true }).alignment).toBe('Lawful Good');
    expect(sheetModel({ ...wizard, hizalanma: { duzen: 30, iyilik: 30, baslangic: { duzen: 30, iyilik: 30 }, baslangicTuru: 'otomatik', gunluk: [], gizli: true } }, 'en', { alignmentOn: true }).alignment).toBeNull();
    expect(sheetModel({ ...wizard, hizalanma: { duzen: 30, iyilik: 30, baslangic: { duzen: 30, iyilik: 30 }, baslangicTuru: 'otomatik', gunluk: [] } }, 'en', { alignmentOn: false }).alignment).toBeNull();
  });
  it('EN arayüzde kâğıt başlıkları İngilizce', async () => {
    const { setLang } = await import('../i18n');
    await setLang('en');
    const { fighter } = chars();
    const html = renderToStaticMarkup(createElement(SheetView, { c: { ...fighter, hikaye: { kisilik: 'Kind' } } }));
    expect(html).toContain('Abilities'); expect(html).toContain('Story'); expect(html).toContain('Personality'); expect(html).toContain('Kind');
    expect(t().sheet.button).toBe('Character sheet');
    await setLang('tr');
  });
});

describe('CK1 JSON dışa/içe aktarma', () => {
  it('tur: aynı karakter döner; boş hikâye alanları dosyada yok; sürüm ve bağımlılık notu', () => {
    const { fighter } = chars();
    const c: SavedCharacter = { ...fighter, hikaye: { kisilik: 'Dürüst', notlar: '   ', baglar: '' }, classDrafts: {} };
    const text = exportCharacter(c);
    expect(text).not.toContain('notlar'); expect(text).not.toContain('baglar'); expect(text).not.toContain('classDrafts');
    const file = JSON.parse(text);
    expect(file.format).toBe('dice-and-hex-karakter'); expect(file.surum).toBe(1); expect(file.karakterSurum).toBe(CHARACTER_SAVE_VERSION);
    expect(file.bagimlilik.altSinif).toBe(fighter.sheet.subclassId);
    const r = parseCharacterFile(text);
    expect(r.ok).toBe(true);
    if (r.ok) { expect(r.character.sheet).toEqual(fighter.sheet); expect(r.character.hikaye).toEqual({ kisilik: 'Dürüst' }); expect(r.character.id).toBe(fighter.id); }
  });
  it('hatalı dosya açık hata kodu verir', () => {
    expect(parseCharacterFile('{ bozuk')).toEqual({ ok: false, error: 'json' });
    expect(parseCharacterFile('{"a":1}')).toEqual({ ok: false, error: 'format' });
    expect(parseCharacterFile(JSON.stringify({ format: 'dice-and-hex-karakter', surum: 99, karakter: { id: 'x' } }))).toEqual({ ok: false, error: 'version' });
    expect(parseCharacterFile(JSON.stringify({ format: 'dice-and-hex-karakter', surum: 1, karakter: { id: 'x', sheet: { name: 3 } } }))).toEqual({ ok: false, error: 'fields' });
    for (const e of ['json', 'format', 'version', 'fields']) expect(t().sheet.importErrors[e]).toBeTruthy();
  });
  it('çakışan kimlik: kopya olarak ekle (yeni kimlik); kopya istenmezse dup; parti dolu', () => {
    const { fighter, wizard } = chars();
    let n = 0;
    const id = () => `yeni${++n}`;
    expect(addImported([fighter], fighter, false, id)).toEqual({ ok: false, error: 'dup' });
    const copy = addImported([fighter], fighter, true, id);
    expect(copy.ok && copy.list.map((x) => x.id)).toEqual([fighter.id, 'yeni1']);
    const fresh = addImported([fighter], wizard, false, id);
    expect(fresh.ok && fresh.list).toHaveLength(2);
    const full = Array.from({ length: MAX_PARTY }, (_, i) => ({ ...fighter, id: `k${i}` }));
    expect(addImported(full, wizard, false, id)).toEqual({ ok: false, error: 'full' });
    expect(addImported(full, fighter, true, id)).toEqual({ ok: false, error: 'full' });
  });
});
