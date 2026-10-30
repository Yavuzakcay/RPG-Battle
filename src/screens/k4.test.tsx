/**
 * Görev K4: sihirbaz cilası. Standart dizide değer atama (çipler, soluk kullanılan değer), uyum (attunement) sınırı
 * (oluşturucu ve savaştaki etkiler), zırh/silah yetkinlik rozeti ve süzgeci, Özet'te tek Kaydet, Türkçe beceri ve alt
 * sınıf adları.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Builder } from './Builder';
import { blankCharacter, characterIssues, type BuilderStep, type SavedCharacter } from '../rules/builder';
import { activeItemNames, armorProficient, deriveStats } from '../rules/stats';
import { combatantFromSheet } from '../battle/create';
import { subclassLabel } from '../rules/subclasses';
import { classData } from '../data';

const ch = (patch: Partial<SavedCharacter['sheet']> = {}): SavedCharacter => {
  const c = blankCharacter('k4');
  return { ...c, classSkills: ['athletics', 'perception'], sheet: { ...c.sheet, name: 'Bor', armorName: 'Chain Mail', ...patch } };
};
const html = (c: SavedCharacter, step: BuilderStep) => renderToStaticMarkup(<Builder initial={c} onSave={() => {}} onCancel={() => {}} step={step} />);

describe('puanlar adımı', () => {
  it('standart dizi: altı değer çipi, açılır liste yok; seçili kutunun değeri vurgulu, diğerleri soluk', () => {
    const m = html(ch(), 'scores');
    expect(m).not.toContain('<select');
    expect((m.match(/class="value-chip/g) ?? []).length).toBe(6);
    // Varsayılan seçili kutu STR (15): 15 çipi açık, kalan beşi başka kutuda (soluk).
    expect((m.match(/class="value-chip on"/g) ?? []).length).toBe(1);
    expect((m.match(/class="value-chip used"/g) ?? []).length).toBe(5);
    expect(m).toContain('Güç (STR) için değer seç:');
    // Geçmiş bonusu tek satır; seviye artışı burada yok.
    expect((m.match(/class="stepper bg-bonus"/g) ?? []).length).toBe(6);
    expect(m).not.toContain('asi-card');
  });
});

describe('uyum (attunement) sınırı', () => {
  const four = ['Ring of Protection', 'Cloak of Protection', 'Amulet of Health', 'Headband of Intellect'];
  it('dördüncü uyumlu eşya sorun; uyum gerektirmeyenler sayılmaz', () => {
    expect(characterIssues(ch({ itemNames: four })).some((x) => x.step === 'equipment' && /en çok 3 eşya \(4 seçildi\)/.test(x.text))).toBe(true);
    expect(characterIssues(ch({ itemNames: [...four.slice(0, 3), 'Potion of Healing', 'Bag of Holding'] })).length).toBe(0);
  });
  it('savaşta yalnızca ilk 3 uyumlu eşyanın etkisi', () => {
    const s = ch({ itemNames: four }).sheet;
    expect(activeItemNames(s)).toEqual(four.slice(0, 3));
    // Headband (INT 19) dördüncü: etkisiz; Amulet (CON 19) üçüncü: etkili.
    const d = deriveStats(s);
    expect(d.scores.con).toBe(19);
    expect(d.scores.int).toBeLessThan(19);
    const c = combatantFromSheet(s, { id: 'a', ownerId: 'x' });
    expect(c.ac).toBe(deriveStats(ch({ itemNames: [] }).sheet).ac + 2);
  });
  it('arayüz: sayaç, dördüncü uyumlu eşya seçilemez', () => {
    const m = html(ch({ itemNames: four.slice(0, 3) }), 'equipment');
    expect(m).toContain('uyum 3 / 3');
    const headband = /<label[^>]*><input type="checkbox"[^>]*\/>(?:(?!<\/label>).)*Headband of Intellect/.exec(m)?.[0] ?? '';
    expect(headband).toContain('disabled');
    const potion = /<label[^>]*><input type="checkbox"[^>]*\/>(?:(?!<\/label>).)*Potion of Healing</.exec(m)?.[0] ?? '';
    expect(potion).not.toContain('disabled');
  });
});

describe('yetkinlik', () => {
  it('zırh eğitimi SRD tablosundan; Wizard zırhsız, Fighter ağır zırh ve kalkan', () => {
    expect(armorProficient('wizard', 'light')).toBe(false);
    expect(armorProficient('wizard', 'none')).toBe(true);
    expect(armorProficient('fighter', 'heavy')).toBe(true);
    expect(armorProficient('cleric', 'heavy')).toBe(false);
    expect(armorProficient('cleric', 'shield')).toBe(true);
  });
  it('rozetler; silah süzgeci varsayılan açık (Wizard\'da Longsword yok), zırhta uyarı metni yok (motorda ceza yok)', () => {
    const w = html(ch({ classId: 'wizard', armorName: 'Chain Mail' }), 'equipment');
    expect(w).toContain('prof-badge no');
    expect(w).toContain('Yalnızca yetkin olduklarım');
    expect(w).not.toContain('<b>Longsword</b>');
    expect(w).toContain('<b>Dagger</b>');
    expect(w).not.toContain('büyü yapılamaz');
    const f = html(ch(), 'equipment');
    expect(f).toContain('<b>Longsword</b>');
    expect(f).not.toContain('prof-badge no');
  });
});

describe('özet ve adlar', () => {
  it('Özet adımında tek Kaydet; dağıtılmamış geçmiş bonusu satırı yok', () => {
    const m = html(ch(), 'summary');
    expect((m.match(/>Kaydet</g) ?? []).length).toBe(1);
    expect(m).not.toContain('henüz dağıtılmadı');
  });
  it('beceri adları Türkçe (İngilizce adı yanında); alt sınıf "Evokasyon Ustası (Evoker)"', () => {
    const m = html(ch(), 'skills');
    expect(m).toContain('Atletizm <small class="skill-en">Athletics</small>');
    const evoker = classData.subclasses.find((x) => x.id === 'evoker');
    expect(evoker && subclassLabel(evoker.name, 'tr')).toBe('Evokasyon Ustası (Evoker)');
    expect(evoker && subclassLabel(evoker.name, 'en')).toBe('Evoker');
  });
});
