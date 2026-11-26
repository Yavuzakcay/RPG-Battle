/**
 * Görev MC6: çoklu sınıflı karakterin jetonu (karar K11). Tek sınıflı jeton birebir aynı (MC6 öncesi altın özet
 * `scripts/mc6-jeton-ozet.ts`); çoklu sınıfta görünüm sınıfı en yüksek seviyeli sınıf, eşitlikte ilk sınıf; Gariban / alt sınıf
 * jetonu eşiği ve alt sınıf o sınıfınki; ırka bağlı görünüm seviyesi karakter seviyesi.
 */
import { describe, expect, it } from 'vitest';
import { garibanTokenFile, lookSheet, sheetAvatar, subclassTokenFile } from './avatar';
import { jetonOzeti } from './mc6Ozet';
import { newCharacter } from '../rules/builder';
import { syncClassFields } from '../rules/multiclass';
import type { CharacterSheet, ClassEntry } from '../rules/stats';

const base = (extra: Partial<CharacterSheet> = {}): CharacterSheet => ({ ...newCharacter('mc6').sheet, raceId: 'human', gender: 'erkek', ...extra });
const mc = (classes: ClassEntry[], extra: Partial<CharacterSheet> = {}): CharacterSheet => syncClassFields({ ...base(extra), classes });

describe('MC6 tek sınıflı jeton değişmez', () => {
  it('9216 ırk × soy × sınıf × cinsiyet × seviye × alt sınıf jetonu MC6 öncesiyle aynı', () => {
    expect(jetonOzeti()).toEqual({ sayi: 9216, ozet: 'a2de287d' });
  });
  it('tek sınıflı sayfa görünüm sayfasının kendisi', () => {
    const s = base({ classId: 'fighter', level: 5 });
    expect(lookSheet(s)).toBe(s);
  });
});

describe('MC6 çoklu sınıf görünüm sınıfı (K11)', () => {
  it('en yüksek seviyeli sınıf: Fighter 2 / Wizard 5 → Wizard 5 jetonu, etiket Wizard', () => {
    const s = mc([{ classId: 'fighter', level: 2 }, { classId: 'wizard', level: 5, subclassId: 'school-of-evocation' }]);
    const one = base({ classId: 'wizard', level: 5, subclassId: 'school-of-evocation' });
    const a = sheetAvatar(s);
    const b = sheetAvatar(one);
    expect(a.src).toBe(b.src);
    expect(a.label).toBe(b.label);
    expect(a.fallbacks).toEqual(b.fallbacks);
  });

  it('eşitlikte ilk sınıf: Rogue 3 / Fighter 3 → Rogue', () => {
    const s = mc([{ classId: 'rogue', level: 3, subclassId: 'thief' }, { classId: 'fighter', level: 3, subclassId: 'champion' }]);
    expect(lookSheet(s)).toMatchObject({ classId: 'rogue', subclassId: 'thief', level: 3 });
    expect(sheetAvatar(s).src).toBe(sheetAvatar(base({ classId: 'rogue', level: 3, subclassId: 'thief' })).src);
  });

  it('Gariban eşiği görünüm sınıfının seviyesiyle: Fighter 2 / Wizard 1 (toplam 3) Gariban jetonunda kalır', () => {
    const s = mc([{ classId: 'fighter', level: 2 }, { classId: 'wizard', level: 1 }]);
    const gr = garibanTokenFile('fighter', 'human', 'erkek', 2);
    expect(gr).toBeDefined();
    expect(sheetAvatar(s).src).toBe(`characters/${gr}`);
  });

  it('alt sınıf jetonu görünüm sınıfının alt sınıfından (ilk sınıfınkinden değil)', () => {
    const s = mc([{ classId: 'fighter', level: 3, subclassId: 'champion' }, { classId: 'wizard', level: 4, subclassId: 'school-of-evocation' }]);
    const wz = subclassTokenFile('wizard', 'human', 'erkek', 'school-of-evocation', 4);
    expect(sheetAvatar(s).src).toBe(wz ? `characters/${wz}` : sheetAvatar(base({ classId: 'wizard', level: 4, subclassId: 'school-of-evocation' })).src);
  });

  it('ırka bağlı görünüm seviyesi karakter seviyesi (Celestial uyanışı toplam seviyeyle)', () => {
    const s = mc([{ classId: 'fighter', level: 3 }, { classId: 'wizard', level: 2 }], { raceId: 'celestial' });
    expect(sheetAvatar(s).look?.level).toBe(5);
  });

  it('özel avatar her şeyin önünde (çoklu sınıfta da)', () => {
    const s = mc([{ classId: 'fighter', level: 2 }, { classId: 'wizard', level: 5 }], { avatar: 'ozel/x.webp' });
    expect(sheetAvatar(s)).toMatchObject({ src: 'ozel/x.webp', fallbacks: [] });
  });
});
