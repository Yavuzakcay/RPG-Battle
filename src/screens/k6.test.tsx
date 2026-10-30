/**
 * Görev K6: büyü seçim sınırları. SRD sınıf tablosu sayıları (her büyücü sınıf, 1–5), sihirbazda sayaç ve sınır, kilitli
 * seviyeler ve "oyunda yok", eski kayıtta fazla seçim eksik olarak, Wizard büyü kitabı, turda tek slotlu büyü kuralı.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Builder } from './Builder';
import { blankCharacter, characterIssues, spellLimits, suggestedScores, type SavedCharacter } from '../rules/builder';
import { classSpellList } from '../rules/spellList';
import { execute } from '../battle/commands';
import { startBattle } from '../battle/create';
import { P1, mk } from '../battle/fixtures';
import { spells } from '../data';
import srd from '../../data/srd/spells.json';
import type { BattleState } from '../battle/types';

const EXPECT: Record<string, { cantrips: number[]; prepared: number[]; max: number[]; book?: number[] }> = {
  bard: { cantrips: [2, 2, 2, 3, 3], prepared: [4, 5, 6, 7, 9], max: [1, 1, 2, 2, 3] },
  cleric: { cantrips: [3, 3, 3, 4, 4], prepared: [4, 5, 6, 7, 9], max: [1, 1, 2, 2, 3] },
  druid: { cantrips: [2, 2, 2, 3, 3], prepared: [4, 5, 6, 7, 9], max: [1, 1, 2, 2, 3] },
  sorcerer: { cantrips: [4, 4, 4, 5, 5], prepared: [2, 4, 6, 7, 9], max: [1, 1, 2, 2, 3] },
  warlock: { cantrips: [2, 2, 2, 3, 3], prepared: [2, 3, 4, 5, 6], max: [1, 1, 2, 2, 3] },
  wizard: { cantrips: [3, 3, 3, 4, 4], prepared: [4, 5, 6, 7, 9], max: [1, 1, 2, 2, 3], book: [6, 8, 10, 12, 14] },
  paladin: { cantrips: [0, 0, 0, 0, 0], prepared: [2, 3, 4, 5, 6], max: [1, 1, 1, 1, 2] },
  ranger: { cantrips: [0, 0, 0, 0, 0], prepared: [2, 3, 4, 5, 6], max: [1, 1, 1, 1, 2] },
};

const caster = (classId: string, level: number, patch: Partial<SavedCharacter['sheet']> = {}): SavedCharacter => {
  const c = blankCharacter('k6');
  return { ...c, classSkills: classId === 'wizard' ? ['arcana', 'history'] : [], sheet: { ...c.sheet, name: 'Mira', classId, level, armorName: 'Zırhsız',
    baseScores: suggestedScores(classId), ...(level >= 3 && classId === 'wizard' ? { subclassId: 'evoker' } : {}), ...patch } };
};
const html = (c: SavedCharacter) => renderToStaticMarkup(<Builder initial={c} onSave={() => {}} onCancel={() => {}} step="spells" />);

describe('SRD tablo sayıları', () => {
  it('her büyücü sınıf, 1–5. seviye: cantrip, hazırlanan, en yüksek seviye, Wizard kitabı', () => {
    for (const [cls, e] of Object.entries(EXPECT)) for (let l = 1; l <= 5; l++) {
      const lim = spellLimits(cls, l);
      expect([lim.cantrips, lim.prepared, lim.maxLevel], `${cls} ${l}`).toEqual([e.cantrips[l - 1], e.prepared[l - 1], e.max[l - 1]]);
      expect(lim.spellbook, `${cls} ${l}`).toBe(e.book ? e.book[l - 1] : null);
    }
  });
  it('sınıf listeleri SRD büyü verisiyle aynı; oyundaki kayıt kimlikle bağlı', () => {
    for (const cls of Object.keys(EXPECT)) {
      const want = srd.spells.filter((x) => x.classes.map((c) => c.toLowerCase()).includes(cls)).map((x) => x.id).sort();
      expect(classSpellList(cls).map((x) => x.id).sort(), cls).toEqual(want);
    }
    const wiz = classSpellList('wizard');
    expect(wiz.find((x) => x.id === 'fireball')?.spell?.name).toBe('Fireball');
    expect(wiz.some((x) => !x.spell)).toBe(true);
    expect(wiz.every((x) => !x.spell || x.spell.id === x.id)).toBe(true);
  });
});

describe('sihirbaz', () => {
  it('Wizard 5: sayaçlar, gruplar, 4+ seviye kilitli, oyunda olmayan soluk', () => {
    const m = html(caster('wizard', 5, { spellNames: ['Fire Bolt', 'Magic Missile', 'Shield', 'Fireball'], spellbook: ['Magic Missile', 'Shield', 'Fireball', 'Sleep'] }));
    expect(m).toContain('Cantrip 1 / 4');
    expect(m).toContain('Hazırlanan 3 / 9');
    expect(m).toContain('Büyü kitabı 4 / 14');
    expect(m).toContain('<h3>3. seviye</h3>');
    expect(m).toMatch(/<details class="spell-group locked"><summary>🔒 4\. seviye/);
    // Görev K9a'dan beri Wizard'ın 0–3. seviye SRD büyülerinin hepsi oyunda; oyunda olmayanlar kilitli 4+ seviyede soluk.
    expect(m).toContain('class="spell-row missing"');
  });
  it('sınıra gelince seçilmemiş hazırlama düğmeleri kapalı; kitapta olmayan hazırlanamaz', () => {
    const nine = spells.filter((x) => x.classes.includes('Wiz') && x.level >= 1 && x.level <= 3).slice(0, 9).map((x) => x.name);
    const m = html(caster('wizard', 5, { spellNames: nine, spellbook: nine }));
    expect(m).toContain('Hazırlanan 9 / 9');
    const free = spells.find((x) => x.classes.includes('Wiz') && x.level === 1 && !nine.includes(x.name)) as { name: string };
    expect(new RegExp(`aria-label="${free.name}: Hazır"[^>]*disabled`).test(m) || new RegExp(`disabled=""[^>]*aria-label="${free.name}: Hazır"`).test(m)).toBe(true);
  });
  it('eski kayıt: fazla seçim ayıklanmaz, Özet\'te "Hazırlanan büyü fazla"; kitaptan dışarıdaki hazırlanan eksik', () => {
    const many = spells.filter((x) => x.classes.includes('Wiz') && x.level === 1).slice(0, 6).map((x) => x.name);
    const old = caster('wizard', 1, { spellNames: many });
    const issues = characterIssues(old);
    expect(issues).toEqual(expect.arrayContaining([expect.objectContaining({ step: 'spells', text: 'Hazırlanan büyü fazla (6 / 4).' })]));
    const book = caster('wizard', 1, { spellNames: many.slice(0, 2), spellbook: [many[0] as string] });
    expect(characterIssues(book).map((x) => x.text)).toContain(`${many[1]} büyü kitabında değil.`);
    expect(characterIssues(caster('wizard', 1, { spellNames: many.slice(0, 4) })).filter((x) => x.step === 'spells')).toEqual([]);
  });
});

describe('savaşta turda tek slotlu büyü (SRD 5.2.1)', () => {
  it('bonus eylemle slotlu büyüden sonra eylemle slotlu büyü olmaz, cantrip olur', () => {
    const a = mk('A', { ownerId: 'p1', spellNames: ['Healing Word', 'Magic Missile', 'Fire Bolt'], spellSlots: [4, 3, 0, 0, 0, 0, 0, 0, 0], spellAttack: 5, spellSaveDc: 13, spellMod: 3 });
    const b = mk('B', { side: 'enemies', hp: 50, maxHp: 50 });
    const st = startBattle('k6', 'd-z-zemin', [a, b], () => 0.5).state;
    const state: BattleState = { ...st, status: 'active', order: ['A', 'B'], turnIndex: 0 };
    const r1 = execute(state, { type: 'cast_spell', actorId: 'A', spellName: 'Healing Word', targetId: 'A' }, P1, () => 0.5);
    if (!r1.ok) throw new Error(r1.error);
    const r2 = execute(r1.state, { type: 'cast_spell', actorId: 'A', spellName: 'Magic Missile', targetId: 'B' }, P1, () => 0.5);
    expect(r2.ok ? null : r2.error).toMatch(/turda bir slotlu büyü/);
    const r3 = execute(r1.state, { type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetId: 'B' }, P1, () => 0.5);
    expect(r3.ok).toBe(true);
  });
});
