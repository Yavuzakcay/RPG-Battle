/**
 * Görev G1: geçmiş seçimi (SRD 5.2.1 Acolyte, Criminal, Sage, Soldier). Karakter adımında kartlar, bonus yalnızca
 * geçmişin üç yeteneğine, köken feat'i geçmişten (kilitli), iki beceri kilitli (sınıf ve Skilled çakışması uyarısı),
 * Magic Initiate büyüleri, geçmiş değişince yok sayılan seçimlerin geri gelmesi, geçmişsiz eski kayıt ve
 * 12 sınıf × 4 geçmiş duman testi.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Builder } from './Builder';
import { blankCharacter, characterIssues, featSkillProblems, newCharacter, suggestedScores, withSkills, type BuilderStep, type SavedCharacter } from '../rules/builder';
import { backgrounds, bonusesOf, magicInitiateOf, magicInitiateSpells, originFeatOf, otherSkillMax } from '../rules/backgrounds';
import { sheetFeats } from '../rules/advancement';
import { deriveStats, finalScores } from '../rules/stats';
import { subclassesOf } from '../rules/classFeatures';
import { combatantFromSheet } from '../battle/create';
import { classes } from '../data';
import { LOADABLE_VERSIONS, SAVE_VERSION } from '../app/battleSave';

const char = (patch: Partial<SavedCharacter['sheet']> = {}, extra: Partial<SavedCharacter> = {}): SavedCharacter => {
  const b = blankCharacter('g1');
  return { ...b, classSkills: ['athletics', 'perception'], ...extra, sheet: { ...b.sheet, name: 'Bor', ...patch } };
};
const issues = (c: SavedCharacter, step: BuilderStep) => characterIssues(c).filter((i) => i.step === step).map((i) => i.text);
const html = (c: SavedCharacter, step: BuilderStep) => renderToStaticMarkup(<Builder initial={c} onSave={() => {}} onCancel={() => {}} step={step} />);

describe('geçmiş verisi', () => {
  it('dört SRD geçmişi: yetenekler, köken feat\'i, beceriler (SRD 5.2.1 s. 83)', () => {
    expect(backgrounds.map((b) => [b.id, b.abilities.join('/'), b.feat + (b.featList ? `:${b.featList}` : ''), b.skills.join('+')])).toEqual([
      ['acolyte', 'int/wis/cha', 'magic-initiate:cleric', 'insight+religion'],
      ['criminal', 'dex/con/int', 'alert', 'sleightOfHand+stealth'],
      ['sage', 'con/int/wis', 'magic-initiate:wizard', 'arcana+history'],
      ['soldier', 'str/dex/con', 'savage-attacker', 'athletics+intimidation'],
    ]);
  });
  it('yeni karakter bir geçmişle başlar; Karakter adımında dört kart ve ne verdiği', () => {
    expect(newCharacter('x').sheet.backgroundId).toBe('soldier');
    const m = html({ ...newCharacter('x'), sheet: { ...newCharacter('x').sheet, name: 'Bor' } }, 'character');
    for (const n of ['Mürit', 'Suçlu', 'Bilge', 'Asker']) expect(m).toContain(n);
    expect(m).toMatch(/aria-checked="true" class="pick-card background-card on"><b>Asker/);
    expect(m).toContain('Savage Attacker ile turda bir kez');
    expect(m).toContain('Alet: Hırsız aletleri');
  });
});

describe('bonus sınırı', () => {
  it('bonus yalnızca geçmişin üç yeteneğine; diğerleri yok sayılır, geri dönünce gelir', () => {
    const c = char({ backgroundId: 'criminal', backgroundBonuses: { dex: 2, int: 1 } });
    expect(bonusesOf(c.sheet)).toEqual({ dex: 2, int: 1 });
    const soldier = { ...c.sheet, backgroundId: 'soldier' };
    // Kalan yarım kalıp (+2 tek) da yok sayılır: bonus dağıtılmamış (yumuşak uyarı), kayıt bozulmaz.
    expect(bonusesOf(soldier)).toEqual({});
    expect(finalScores(soldier).int).toBe(c.sheet.baseScores.int);
    expect(bonusesOf({ ...soldier, backgroundBonuses: { dex: 2, con: 1, int: 1 } })).toEqual({ dex: 2, con: 1 });
    expect(bonusesOf({ ...soldier, backgroundId: 'criminal' })).toEqual({ dex: 2, int: 1 });
  });
  it('Puanlar adımı: geçmişte olmayan yeteneğin + düğmesi kapalı', () => {
    const m = html(char({ backgroundId: 'soldier' }), 'scores');
    expect(m).toContain('Yalnızca geçmişin yetenekleri: Güç (STR), Çeviklik (DEX), Dayanıklılık (CON).');
    expect(m).toMatch(/stepper bg-bonus off" aria-label="Zekâ[^"]*"><small class="step-tag">INT<\/small><button[^>]*>−<\/button><b[^>]*>0<\/b><button[^>]*disabled/);
    expect(m).not.toMatch(/stepper bg-bonus off" aria-label="Güç/);
  });
});

describe('köken feat\'i ve beceriler', () => {
  it('köken feat\'i geçmişten, kilitli bilgi; serbest seçim yok', () => {
    const c = char({ backgroundId: 'criminal', originFeat: 'skilled' });
    expect(originFeatOf(c.sheet)).toBe('alert');
    expect(sheetFeats(c.sheet)).toEqual(['alert']);
    expect(deriveStats(c.sheet).initiative).toBe(deriveStats(char({ originFeat: 'alert' }).sheet).initiative);
    const m = html(c, 'progress');
    expect(m).toContain('Geçmişinden gelen başlangıç yeteneği: Alert');
    expect(m).not.toContain('<option value="skilled"');
  });
  it('iki beceri kilitli ve becerilere eklenir; serbest hak 3 − 2', () => {
    const c = char({ backgroundId: 'soldier' }, { classSkills: ['perception', 'survival'], otherSkills: ['insight', 'athletics', 'history'] });
    expect(otherSkillMax(c.sheet)).toBe(1);
    expect(withSkills(c).sheet.skills).toEqual(['perception', 'survival', 'athletics', 'intimidation', 'insight']);
    expect(issues(c, 'skills')).toEqual([]);
    const m = html(c, 'skills');
    expect(m).toContain('🔒 Geçmiş (Asker)');
    expect(m).toContain('Ek beceri (tür) 1/1');
  });
  it('çakışma: geçmiş becerisi sınıftan da seçilmişse uyarı; Skilled ile de', () => {
    const c = char({ backgroundId: 'soldier' }, { classSkills: ['athletics', 'perception'] });
    expect(issues(c, 'skills')).toContain('Athletics zaten geçmişten geliyor; başka bir sınıf becerisi seç.');
    expect(html(c, 'skills')).toContain('sınıftan da seçilmiş: başka bir sınıf becerisi seç');
    // Skilled (4. seviye yuvası) geçmişin becerisini seçerse K20 uyarısı.
    const skilled = char({ backgroundId: 'soldier', level: 4, advancements: [{ level: 4, featId: 'skilled' }] },
      { classSkills: ['perception', 'survival'], featSkills: ['intimidation', 'insight', 'arcana'] });
    expect(featSkillProblems(skilled)).toEqual(['Skilled: intimidation zaten geçmiş ya da türden geliyor; başka bir beceri seç.']);
  });
});

describe('Magic Initiate', () => {
  it('Acolyte: Cleric listesinden iki cantrip ve bir 1. seviye büyü; eksik seçim engeller; savaşa gider', () => {
    const c = char({ backgroundId: 'acolyte' });
    expect(issues(c, 'progress')).toEqual(['Magic Initiate: 2 cantrip seçilmeli (0 seçildi).', 'Magic Initiate: bir 1. seviye büyü seçilmeli.']);
    const ok = char({ backgroundId: 'acolyte', magicInitiate: { cleric: { cantrips: ['Sacred Flame', 'Guidance'], spell: 'Bless' } } });
    expect(issues(ok, 'progress')).toEqual([]);
    expect(magicInitiateSpells(ok.sheet)).toEqual(['Sacred Flame', 'Guidance', 'Bless']);
    const cb = combatantFromSheet(withSkills(ok).sheet, { id: 'a', ownerId: 'o' });
    expect(cb.spellNames).toEqual(expect.arrayContaining(['Sacred Flame', 'Guidance', 'Bless']));
    expect(cb.backgroundId).toBe('acolyte');
    const m = html(ok, 'progress');
    expect(m).toContain('Magic Initiate (Cleric): iki cantrip ve bir 1. seviye büyü');
  });
  it('Sage ↔ Acolyte: liste başına saklanır; başka listenin büyüsü yok sayılır', () => {
    const picks = { cleric: { cantrips: ['Sacred Flame', 'Guidance'], spell: 'Bless' }, wizard: { cantrips: ['Fire Bolt', 'Sacred Flame'], spell: 'Bless' } };
    const sage = char({ backgroundId: 'sage', magicInitiate: picks });
    expect(magicInitiateOf(sage.sheet)).toEqual({ list: 'wizard', cantrips: ['Fire Bolt'], ability: 'int' });
    expect(magicInitiateOf({ ...sage.sheet, backgroundId: 'acolyte' })?.spell).toBe('Bless');
    expect(magicInitiateOf({ ...sage.sheet, backgroundId: 'soldier' })).toBeUndefined();
  });
});

describe('eski kayıt (geçmişsiz)', () => {
  it('köken feat\'i ve skorlar korunur, kayıt engellenmez; İlerleme adımında "Geçmiş seç" önerisi', () => {
    const old = char({ originFeat: 'alert', backgroundBonuses: { str: 2, wis: 1 } }, { otherSkills: ['insight', 'religion', 'history'] });
    expect(sheetFeats(old.sheet)).toEqual(['alert']);
    expect(finalScores(old.sheet).wis).toBe(old.sheet.baseScores.wis + 1);
    expect(withSkills(old).sheet.skills).toEqual(['athletics', 'perception', 'insight', 'religion', 'history']);
    expect(characterIssues(old)).toEqual([]);
    expect(html(old, 'progress')).toContain('Geçmiş seç');
    expect(html(old, 'character')).toContain('Geçmiş seçilmemiş (eski kayıt)');
  });
});

describe('kayıt sürümü', () => {
  it('savaş kaydı sürüm 20 (savaşçıda geçmiş); 19 ve öncesi yüklenmeye devam eder', () => {
    expect(SAVE_VERSION).toBe(20);
    expect(LOADABLE_VERSIONS).toEqual(expect.arrayContaining([3, 19, 20]));
    // Eski karakter (geçmişsiz) savaşçısında geçmiş alanı yok; davranış eskisi gibi.
    const cb = combatantFromSheet(withSkills(char({ originFeat: 'alert' })).sheet, { id: 'a', ownerId: 'o' });
    expect(cb.backgroundId).toBeUndefined();
  });
});

describe('duman testi', () => {
  it('12 sınıf × 4 geçmiş: Karakter, Puanlar, Beceriler, İlerleme adımları çizilir, savaşçı oluşur', () => {
    const failed: string[] = [];
    let n = 0;
    for (const k of classes) for (const bg of backgrounds) {
      const b = blankCharacter('smoke');
      const level = 3;
      const sub = subclassesOf(k.id)[0]?.id;
      const c: SavedCharacter = { ...b, sheet: { ...b.sheet, name: 'Duman', classId: k.id, level, baseScores: suggestedScores(k.id), backgroundId: bg.id,
        backgroundBonuses: { [bg.abilities[0]!]: 2, [bg.abilities[1]!]: 1 }, ...(sub ? { subclassId: sub } : {}) } };
      try {
        for (const step of ['character', 'scores', 'skills', 'progress'] as const) {
          const m = html(c, step);
          if (m.includes('step-crash')) failed.push(`${k.id}/${bg.id}/${step}: çöktü`);
        }
        const cb = combatantFromSheet(withSkills(c).sheet, { id: 'a', ownerId: 'o' });
        if (cb.backgroundId !== bg.id) failed.push(`${k.id}/${bg.id}: savaşçıda geçmiş yok`);
        const d = deriveStats(c.sheet);
        if (d.scores[bg.abilities[0]!] !== Math.min(20, c.sheet.baseScores[bg.abilities[0]!] + 2)) failed.push(`${k.id}/${bg.id}: bonus`);
      } catch (e) {
        failed.push(`${k.id}/${bg.id}: ${(e as Error).message}`);
      }
      n++;
    }
    expect(n).toBe(48);
    expect(failed).toEqual([]);
  });
});
