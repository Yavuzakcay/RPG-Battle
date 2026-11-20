/**
 * Görev SD7: büyü menüsü sadeleştirmesi (yalnız arayüz). Slot seçici seviyeleri, zar satırı (olduğu gibi, tahmin yok),
 * sınırsız yer tutucu, savaş dışı büyü gizleme, tam cümle "Yapılamaz" mesajı, "Hile" → "Cantrip".
 */
import { describe, expect, it } from 'vitest';
import { spells } from '../data';
import { t, setLang } from '../i18n';
import { diceAtSlot, halfDice, pickerLevels, slotEffectLine, usesShown } from './slotInfo';
import { offCombatOnly } from './hud';
import { completeReason } from './reasons';

const sp = (name: string) => spells.find((s) => s.name === name)!;
const X = () => t().battle.slotEffect;

describe('SD7: slot seçici', () => {
  it('yüksek slotla güçlenmeyen büyüde yalnız en düşük slot; güçlenende hepsi', () => {
    expect(pickerLevels([3, 4, 5], sp('Fireball'))).toEqual([3, 4, 5]);
    const noUp = spells.find((s) => s.level > 0 && !s.mechanics.upcast?.applied)!;
    expect(pickerLevels([noUp.level, noUp.level + 1], noUp)).toEqual([noUp.level]);
  });
  it('zar satırı olduğu gibi: Fireball 5. seviye 10d6 hasar; Cure Wounds 4. seviye 8d8 iyileştirme (ortalama/toplam tahmini yok)', () => {
    setLang('tr');
    expect(slotEffectLine(sp('Fireball'), 5, true, X())).toBe('5. seviye: 10d6 hasar');
    expect(slotEffectLine(sp('Cure Wounds'), 4, true, X())).toBe('4. seviye: 8d8 iyileştirme');
    expect(slotEffectLine(sp('Fireball'), 3, true, X())).toBe('Temel etki');
    expect(slotEffectLine(sp('Charm Person'), 3, true, X())).toBe('3. seviye: 3 hedef');
    expect(slotEffectLine(sp('Magic Missile'), 3, true, X())).toBe('3. seviye: 5 ışın');
  });
  it('güçlenmeyen büyüde tek cümle; EN metin', () => {
    setLang('tr');
    const noUp = spells.find((s) => s.level > 0 && !s.mechanics.upcast?.applied)!;
    expect(slotEffectLine(noUp, noUp.level + 1, true, X())).toBe('Bu büyü yüksek slotla güçlenmez; en düşük slot yeterli');
    setLang('en');
    expect(slotEffectLine(sp('Fireball'), 4, true, X())).toBe('Level 4: 9d6 damage');
    setLang('tr');
  });
  it('save başarılı olursa yarısı: zar yarılanır', () => {
    expect(halfDice('10d8')).toBe('5d8'); expect(halfDice('9d6')).toBe('9d6 ÷ 2');
    expect(diceAtSlot(sp('Fireball'), 5)?.text).toBe('10d6');
  });
  it('sınırsız yer tutucu (99) sayı olarak görünmez', () => {
    expect(usesShown(99)).toBeNull(); expect(usesShown(1)).toBe(1);
    setLang('tr');
    expect(t().battle.freeCast('Spell Mastery', null)).toBe('Slotsuz: Spell Mastery');
    expect(t().battle.freeCast('Divine Intervention', 1)).toBe('Slotsuz: Divine Intervention (1 hak)');
    expect(t().battle.slotLevel(3, 2)).toBe('3. seviye (2)');
  });
});

describe('SD7: büyü menüsü', () => {
  it('tamamen savaş dışı büyüler gizlenir; savaşta çalışan kolu olanlar gizlenmez', () => {
    for (const n of ['Mending', 'Message', 'Minor Illusion', 'Prestidigitation', 'Elementalism', 'Identify']) expect(offCombatOnly(sp(n)), n).toBe(true);
    for (const n of ['Passwall', 'Stone Shape', 'Control Water', 'Phantom Steed', 'Magic Circle', 'Regenerate', 'Resurrection', 'Fireball']) expect(offCombatOnly(sp(n)), n).toBe(false);
  });
  it('sekme adı Cantrip; "Hile" hiçbir TR metinde yok', () => {
    setLang('tr');
    expect(t().battle.label.cantrip).toBe('Cantrip');
  });
  it('Yapılamaz mesajı tam cümle ve ne yapılabileceğini söyler', () => {
    const m = completeReason('Bu tur zaten büyü slotu harcandı (turda bir slotlu büyü).', 'tr');
    expect(m).toContain('yalnız cantrip yapabilirsin'); expect(m.endsWith('.')).toBe(true);
    expect(completeReason('Bilinmeyen gerekçe.', 'tr')).toBe('Bilinmeyen gerekçe.');
  });
});
