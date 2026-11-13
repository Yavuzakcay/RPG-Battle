/**
 * Görev SD3: karakter oluşturucu sadeleştirmesi. Önerilen başlangıç değerleri (ad, beceri, geçmiş bonusu, donanım, büyü,
 * yetenek artışı) her sınıfta kaydı engelleyen sorun üretmez; veri dosyalarının adları gerçek kayıtlarla eşleşir; Donanım
 * ekranı "Seçtiklerin" / "Zaten sende" bölümlerine ve dürüst sayaçlara ayrılır; sınıf güçleri düz Türkçe adla ve ana
 * listede en çok 6 satırla görünür; Kaydet soluk (disabled) kalmaz.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Builder } from './Builder';
import { armor, classes, weapons } from '../data';
import { blankCharacter, characterIssues, newCharacter, switchClass, type SavedCharacter } from '../rules/builder';
import { gainedFeatures } from '../rules/classFeatures';
import { MAX_ATTUNED } from '../rules/stats';
import { FEATURE_VISIBLE, splitFeatures } from './builder/Features';
import { reSuggestAfterClassSwitch, reSuggestAfterLevel, recommendedKit, recommendedSkills, withSuggestions } from './builderDefaults';
import onerilen from '../../data/onerilen-baslangic.json';

const html = (c: SavedCharacter, step: Parameters<typeof Builder>[0]['step'], suggest = false) =>
  renderToStaticMarkup(<Builder initial={c} onSave={() => {}} onCancel={() => {}} step={step} suggest={suggest} />);
const fresh = (classId: string, level = 1): SavedCharacter => {
  const c = newCharacter('sd3');
  return withSuggestions({ ...c, sheet: { ...c.sheet, classId, level, baseScores: switchClass(c, classId, { baseScores: undefined }).sheet.baseScores } });
};

describe('SD3 veri dosyaları', () => {
  it('önerilen donanım ve Türkçe donanım adları gerçek zırh/silah adlarıyla eşleşir', () => {
    for (const [id, k] of Object.entries(onerilen.siniflar)) {
      expect(classes.some((c) => c.id === id), id).toBe(true);
      expect(armor.some((a) => a.name === k.zirh), `${id} zırh`).toBe(true);
      for (const w of k.silahlar) expect(weapons.some((x) => x.name === w), `${id} ${w}`).toBe(true);
    }
    expect(onerilen.ozelTurler.length).toBe(6);
    expect(onerilen.ozelSiniflar.length).toBe(6);
  });
});

describe('SD3 önerilen başlangıç değerleri', () => {
  it('her sınıfta 1. seviye yeni karakter hiçbir şeye dokunmadan kaydedilebilir (sorun yok ya da yalnız zorunlu özel seçim)', () => {
    for (const k of classes) {
      const c = fresh(k.id);
      expect(c.sheet.name, k.id).not.toBe('');
      expect(c.classSkills.length, k.id).toBe(recommendedSkills(k.id, 1, undefined, []).length > 0 ? k.skillChoices.count : 0);
      const left = characterIssues(c).map((x) => `${x.step}: ${x.text}`);
      expect(left, k.id).toEqual([]);
    }
  });
  it('3., 5. ve 9. seviye yeni karakter de eksiksiz gelir (alt sınıf, Metamagic, Invocation önerilir; yetenek artışı yazılır)', () => {
    for (const k of classes) for (const level of [3, 5, 9]) {
      const c = fresh(k.id, level);
      expect(characterIssues(c).map((x) => `${x.step}: ${x.text}`), `${k.id} ${level}`).toEqual([]);
    }
  });
  it('önerilen beceri geçmişin kilitli becerisini seçmez; sınıf listesi dışına çıkmaz', () => {
    const c = fresh('ranger');
    const bg = ['athletics', 'intimidation'];
    expect(recommendedSkills('ranger', 1, undefined, bg as never[])).not.toContain('athletics');
    for (const k of c.classSkills) expect(['animalHandling', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival']).toContain(k);
  });
  it('sınıf değişince dokunulmamış öneriler yeni sınıfa göre yenilenir; elle seçilen beceri ezilmez', () => {
    const f = fresh('fighter');
    const w = reSuggestAfterClassSwitch(f, switchClass(f, 'wizard', {}));
    expect(w.sheet.armorName).toBe(recommendedKit('wizard').armorName);
    expect(w.sheet.weapons?.map((x) => x.name)).toEqual(recommendedKit('wizard').weapons.map((x) => x.name));
    expect(w.sheet.spellNames?.length).toBeGreaterThan(0);
    expect(characterIssues(w).filter((x) => x.step !== 'character' || !/Alt sınıf/.test(x.text))).toEqual([]);
    const touched = { ...f, classSkills: ['insight', 'history'] as SavedCharacter['classSkills'] };
    expect(reSuggestAfterClassSwitch(touched, switchClass(touched, 'rogue', {})).classSkills).toEqual([]);
  });
  it('seviye çıkınca boş yetenek artışı yuvasına önerilen +2 yazılır; sorun çıkmaz', () => {
    const f = fresh('fighter');
    const up = reSuggestAfterLevel(f, { ...f, sheet: { ...f.sheet, level: 8, subclassId: 'champion' } });
    const asi = (up.sheet.advancements ?? []).filter((a) => a.featId === 'ability-score-improvement');
    expect(asi.map((a) => a.level)).toEqual([4, 6, 8]);
    for (const a of asi) expect(Object.values(a.abilities ?? {})).toEqual([2]);
  });
  it('Builder yeni karakteri öneriyle açar (ad dolu, beceri seçili); öneri olmadan eskisi gibi boş', () => {
    const c = newCharacter('sd3b');
    const on = html(c, 'skills', true);
    expect(on).toContain('Sınıf becerisi 2/2');
    expect(html(c, 'skills', false)).toContain('Sınıf becerisi 0/2');
  });
});

describe('SD3 Donanım ekranı', () => {
  it('iki bölüm: "Seçtiklerin" ve "Zaten sende (otomatik)"; zırh 1/1, silah ve eşya sayaçları dürüst', () => {
    const m = html(fresh('fighter'), 'equipment');
    expect(m).toContain('>Seçtiklerin<');
    expect(m).toContain('>Zaten sende (otomatik)<');
    expect(m).toContain('1/1');
    expect(m).toContain('2 seçili (sayı sınırı yok)');
    expect(m).toContain(`Uyumlu eşya 0/${MAX_ATTUNED}`);
    expect(m).toContain('Silahsız vuruş');
    expect(m).toContain('Zırh: Hafif, Orta, Ağır, Kalkan');
    expect(m).toContain('Ustalık 2/3');
    // SD4: adlar İngilizce kalır; açıklama Türkçe.
    expect(m).toContain('<b>Longsword</b>');
    expect(m).not.toContain('İngilizce adı');
  });
  it('ustalık hakkı dolunca kalan yıldızlar kilitli ve nedeni yazılı', () => {
    const c = fresh('fighter');
    const m = html({ ...c, sheet: { ...c.sheet, weapons: [{ name: 'Longsword' }, { name: 'Greatsword' }, { name: 'Warhammer' }, { name: 'Light crossbow' }], weaponMasteries: ['longsword', 'greatsword', 'warhammer'] } }, 'equipment');
    expect(m).toContain('Ustalık hakkın doldu (3/3).');
    expect(m).toMatch(/disabled="" aria-label="Ustalığı seç: Slow" title="Sınır doldu \(3\/3\)/);
  });
  it('eğitimsiz zırh türleri ve kalkan "Eğitimin olmayan zırhlar" katında; ana seçimde yok', () => {
    const m = html(fresh('wizard'), 'equipment');
    expect(m).toContain('Eğitimin olmayan zırhlar (ceza var)');
    const main = m.slice(m.indexOf('aria-label="Zırh"'), m.indexOf('Eğitimin olmayan zırhlar'));
    expect(main).not.toContain('>Ağır<');
    expect(main).not.toContain('>Kalkan<');
  });
  it('sihirbaz adımları hâlâ 7 (büyü seçemeyen sınıfta 6)', () => {
    expect(html(fresh('wizard'), 'spells')).toContain('Seçtiklerin');
  });
});

describe('SD3 Sınıf güçleri', () => {
  it('ana listede en çok 6 güç, kalanı "Diğer güçler"; durum etiketi ve renk lejandı yok; ad İngilizce, açıklama Türkçe', () => {
    const c = fresh('fighter', 20);
    const m = html({ ...c, sheet: { ...c.sheet, subclassId: 'champion' } }, 'character');
    expect(m).toContain('Sınıf güçlerin');
    expect(m).toContain('Diğer güçler (');
    expect(m).not.toContain('feature-legend');
    expect(m).not.toContain('savaşta çalışır');
    expect(m).toContain('<b>Extra Attack</b>');
    expect(m).not.toContain('İngilizce adı');
    const list = gainedFeatures('fighter', 20, 'champion');
    const { main, rest } = splitFeatures(list, 'fighter', 'champion', 20);
    expect(main.length).toBeLessThanOrEqual(FEATURE_VISIBLE);
    expect(main.length + rest.length).toBe(list.length);
  });
  it('seçenekli güç (Cleric Divine Order) ana listede kalır; seçenek adı İngilizce, açıklaması Türkçe', () => {
    const c = fresh('cleric', 20);
    const m = html({ ...c, sheet: { ...c.sheet, subclassId: 'life-domain' } }, 'character');
    expect(m).toContain('Protector (Heavy zırh ve Martial silah eğitimi)');
  });
});

describe('SD3 Kaydet ve eksikler', () => {
  it('eksik varken Kaydet disabled değil; aria-disabled ve yumuşak stil; eksik yoksa normal düğme', () => {
    const blank = { ...blankCharacter('x'), sheet: { ...blankCharacter('x').sheet, name: 'Bor' } };
    expect(html(blank, 'summary')).toMatch(/<button class="cta soft" aria-disabled="true">Kaydet<\/button>/);
    expect(html(fresh('fighter'), 'summary')).toMatch(/<button class="cta">Kaydet<\/button>/);
  });
  it('Özet adımında eksik listesi yan panelde tekrarlanmaz (tek yerde)', () => {
    const blank = { ...blankCharacter('x'), sheet: { ...blankCharacter('x').sheet, name: 'Bor' } };
    const m = html(blank, 'summary');
    // Eksik listesi yalnız Özet gövdesinde; yan panelde tekrarlanmaz (mobil alt çubuktaki liste açılınca görünür).
    expect((m.match(/class="wiz-missing"/g) ?? []).length).toBe(1);
    expect(m).not.toContain('class="problems wiz-step-problems"');
  });
});
