/**
 * GORSEL-DUZELTME: oluşturucuda cinsiyet değiştirilirken cinsiyet kısıtlı alt sınıf (Karadul Çemberi kadın, İmparator erkek) yeni
 * cinsiyete uymuyorsa önerilen alt sınıfa (veride `varsayilan`) çevrilir. Kayıt açılışı etkilenmez: mevcut seçim görünür kalır.
 */
import { describe, expect, it } from 'vitest';
import { defaultSubclassId, genderVisible, findSubclass, subclassForGender } from './subclasses';
import { t } from '../i18n';
import { en } from '../i18n/strings.en';

describe('cinsiyet değişince kısıtlı alt sınıf', () => {
  it('Karadul (kadın) → erkek: Druid varsayılanı; İmparator (erkek) → kadın: Fighter varsayılanı', () => {
    expect(subclassForGender('druid', 'karadul-cemberi', 'erkek')).toEqual({ from: 'karadul-cemberi', to: defaultSubclassId('druid') });
    expect(subclassForGender('fighter', 'imza_imparator', 'kadin')).toEqual({ from: 'imza_imparator', to: defaultSubclassId('fighter') });
    expect(defaultSubclassId('druid')).toBeTruthy();
    expect(findSubclass('druid', defaultSubclassId('druid'))?.cinsiyet).toBeUndefined();
  });
  it('kısıt uyuyorsa, kısıtsız alt sınıfta ya da alt sınıf yokken değişmez', () => {
    expect(subclassForGender('druid', 'karadul-cemberi', 'kadin')).toBeNull();
    expect(subclassForGender('fighter', 'imza_imparator', 'erkek')).toBeNull();
    expect(subclassForGender('druid', defaultSubclassId('druid'), 'erkek')).toBeNull();
    expect(subclassForGender('wizard', undefined, 'kadin')).toBeNull();
  });
  it('mevcut seçim kuralı korunur: eski kayıtta erkek Karadul görünür kalır (yalnız cinsiyet değişiminde çevrilir)', () => {
    const karadul = findSubclass('druid', 'karadul-cemberi')!;
    expect(genderVisible(karadul, { subclassId: 'karadul-cemberi', gender: 'erkek' })).toBe(true);
    expect(genderVisible(karadul, { gender: 'erkek' })).toBe(false);
  });
  it('bildirim metni TR ve EN', () => {
    expect(t().builder.genderSubclass('Karadul Çemberi', 'Toprak Çemberi')).toContain('Toprak Çemberi');
    expect(t().builder.genderSubclass('Karadul Çemberi', null)).toContain('boşaltıldı');
    expect(en.builder.genderSubclass('Black Widow', 'Circle of the Land')).toContain('Circle of the Land');
  });
});
