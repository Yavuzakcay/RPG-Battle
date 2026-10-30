/**
 * Görev K20: İlerleme adımı. Köken feat'i ayrı kutuda, feat kartları (Ne yapar? / Örnek), Skilled beceri seçimi
 * (eksik/fazla/çakışan seçim kaydı engeller), eski kayıtta Skilled becerilerinin ayrılması, Türkçe + İngilizce
 * terim etiketleri ve 12 sınıf × seviye 1/5/9 × birkaç ırk duman testi.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Builder } from './Builder';
import { blankCharacter, characterIssues, featSkillCount, normalizeFeatSkills, suggestedScores, withSkills, type SavedCharacter } from '../rules/builder';
import { subclassesOf } from '../rules/classFeatures';
import { classes, races } from '../data';
import type { Skill } from '../rules/skills';

const fighter = (patch: Partial<SavedCharacter['sheet']> = {}, extra: Partial<SavedCharacter> = {}): SavedCharacter => {
  const b = blankCharacter('k20');
  return { ...b, classSkills: ['athletics', 'perception'], ...extra, sheet: { ...b.sheet, name: 'Bor', ...patch } };
};
const progressIssues = (c: SavedCharacter) => characterIssues(c).filter((i) => i.step === 'progress').map((i) => i.text);
const html = (c: SavedCharacter) => renderToStaticMarkup(<Builder initial={c} onSave={() => {}} onCancel={() => {}} step="progress" />);

describe('Skilled beceri seçimi', () => {
  it('eksik seçim kaydı engeller; tam seçim geçer ve becerilere eklenir', () => {
    const c = fighter({ originFeat: 'skilled' });
    expect(featSkillCount(c)).toBe(3);
    expect(progressIssues(c)).toContain('Skilled: 3 beceri seçilmeli (0 seçildi).');
    const two = fighter({ originFeat: 'skilled' }, { featSkills: ['stealth', 'insight'] });
    expect(progressIssues(two)).toContain('Skilled: 3 beceri seçilmeli (2 seçildi).');
    const ok = fighter({ originFeat: 'skilled' }, { featSkills: ['stealth', 'insight', 'arcana'] });
    expect(progressIssues(ok)).toEqual([]);
    expect(withSkills(ok).sheet.skills).toEqual(expect.arrayContaining(['athletics', 'perception', 'stealth', 'insight', 'arcana']));
  });
  it('fazla seçim ve başka kaynaktan gelen beceri engeller', () => {
    const many = fighter({ originFeat: 'skilled' }, { featSkills: ['stealth', 'insight', 'arcana', 'history'] });
    expect(progressIssues(many)).toContain('Skilled: 3 beceri seçilmeli (4 seçildi).');
    const dup = fighter({ originFeat: 'skilled' }, { featSkills: ['athletics', 'insight', 'arcana'] });
    expect(progressIssues(dup).join()).toContain('athletics zaten sınıftan geliyor');
    const other = fighter({ originFeat: 'skilled' }, { otherSkills: ['survival'], featSkills: ['survival', 'insight', 'arcana'] });
    expect(progressIssues(other).join()).toContain('survival zaten geçmiş ya da türden geliyor');
  });
  it('eski kayıt: diğer becerilerin 3\'ü aşan kısmı Skilled\'a taşınır', () => {
    const old = fighter({ originFeat: 'skilled' }, { otherSkills: ['survival', 'intimidation', 'history', 'stealth', 'insight', 'arcana'] as Skill[] });
    const n = normalizeFeatSkills(old);
    expect([n.otherSkills, n.featSkills]).toEqual([['survival', 'intimidation', 'history'], ['stealth', 'insight', 'arcana']]);
    expect(progressIssues(old)).toEqual([]);
    expect(characterIssues(old).filter((i) => i.step === 'skills')).toEqual([]);
    // Skilled yokken dokunulmaz.
    expect(normalizeFeatSkills(fighter())).toEqual(fighter());
  });
});

describe('İlerleme ekranı', () => {
  it('köken feat\'i ayrı kutuda; Skilled seçimi ve Great Weapon Fighting kartı; Türkçe + İngilizce terim', () => {
    const m = html(fighter({ originFeat: 'skilled', advancements: [{ level: 1, featId: 'great-weapon-fighting' }] }));
    expect(m).toContain('Geçmişinden gelen başlangıç yeteneği');
    expect(m).toContain('Bu, ASI ve feat yuvalarından ayrıdır.');
    expect(m).toContain('Skilled: 3 beceri seç');
    expect(m).toContain('Ne yapar?');
    expect(m).toContain('1 ya da 2 gelirse 3 sayılır');
    expect(m).toContain('1. seviye: Dövüş Stili (Fighting Style)');
    expect(m).toMatch(/class="feat-card selected"><b>Great Weapon Fighting/);
  });
  it('duman testi: 12 sınıf × seviye 1, 5, 9 × beş ırk İlerleme adımı çökmeden çizilir', () => {
    const picks = ['human', 'elf', 'dragonborn', 'goliath', 'tiefling'].map((id) => races.find((r) => r.id === id)!);
    const failed: string[] = [];
    let n = 0;
    for (const k of classes) for (const level of [1, 5, 9]) for (const r of picks) {
      const b = blankCharacter('smoke');
      const sub = level >= 3 ? subclassesOf(k.id)[0]?.id : undefined;
      const c: SavedCharacter = { ...b, sheet: { ...b.sheet, name: 'Duman', classId: k.id, raceId: r.id, level, baseScores: suggestedScores(k.id),
        ...(r.lineages?.length ? { lineageId: r.lineages[0]!.id } : {}), ...(sub ? { subclassId: sub } : {}), originFeat: n % 2 ? 'skilled' : 'alert' } };
      try {
        const m = html(c);
        if (!m.includes('Geçmişinden gelen başlangıç yeteneği') || m.includes('step-crash')) failed.push(`${k.id}/${level}/${r.id}: içerik eksik`);
      } catch (e) {
        failed.push(`${k.id}/${level}/${r.id}: ${(e as Error).message}`);
      }
      n++;
    }
    expect(n).toBe(180);
    expect(failed).toEqual([]);
  });
});
