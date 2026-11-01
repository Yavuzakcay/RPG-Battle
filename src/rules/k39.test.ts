/**
 * Kuyruk 39: 6–10. seviye özellikleri: Feral Instinct (inisiyatif avantajı), Monk Evasion, Aura of Protection (kısmi:
 * kendi save'leri), Magical Secrets (Bard 10: Cleric/Druid/Wizard listeleri); her sınıfta 6–10'da en az bir çalışan özellik.
 */
import { describe, expect, it } from 'vitest';
import { classKit, gainedFeatures, subclassesOf } from './classFeatures';
import { spellOptions } from './builder';
import { combatantFromSheet } from '../battle/create';
import { partyAt } from '../sim/balance';
import type { CharacterSheet } from './stats';

const sheet = (classId: string, level: number): CharacterSheet => ({
  name: 'T', raceId: 'human', classId, level, baseScores: { str: 14, dex: 14, con: 14, int: 10, wis: 12, cha: 16 },
  armorName: 'Zırhsız', shield: false, itemNames: [],
} as CharacterSheet);

describe('seviye 6–10 özellikleri', () => {
  it('Feral Instinct 7\'de, Monk Evasion 7\'de iz olarak', () => {
    expect(classKit('barbarian', 6).traits).not.toContain('feral-instinct');
    expect(classKit('barbarian', 7).traits).toContain('feral-instinct');
    expect(classKit('monk', 6).traits).not.toContain('evasion');
    expect(classKit('monk', 7).traits).toContain('evasion');
  });
  it('Aura of Protection (kısmi): 6. seviye Paladin\'in bütün save\'lerine CHA (+3)', () => {
    const five = combatantFromSheet(sheet('paladin', 5), { id: 'a', ownerId: 'o' });
    const six = combatantFromSheet(sheet('paladin', 6), { id: 'a', ownerId: 'o' });
    // 6. seviyede yeterlilik değişmez (+3); fark yalnızca aura.
    for (const k of ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const) expect(six.saves[k] - five.saves[k], k).toBe(3);
  });
  it('Magical Secrets: Bard 10\'da Wizard/Cleric/Druid büyüleri seçilebilir, 9\'da değil', () => {
    expect(spellOptions('bard', 9)).not.toContain('Fireball');
    expect(spellOptions('bard', 10)).toContain('Fireball');
    expect(spellOptions('bard', 10)).toContain('Spirit Guardians');
  });
  it('her sınıfta 6–10. seviyede en az bir çalışan (kısmi dahil) özellik', () => {
    for (const c of ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard']) {
      const sub = (subclassesOf(c) as Array<{ id: string; srd?: boolean }>).find((s) => s.srd);
      const ok = gainedFeatures(c, 10, sub?.id).filter((f) => (f.level ?? 0) >= 6 && ['ok', 'partial'].includes((f.mechanic as { status?: string } | undefined)?.status ?? ''));
      expect(ok.length, c).toBeGreaterThan(0);
    }
  });
  it('5. seviye simülasyon partileri değişmedi (özellikler 6+)', () => {
    for (const s of partyAt(5)) expect(combatantFromSheet(s, { id: 'x', ownerId: 'o' }).traits ?? []).not.toContain('feral-instinct');
  });
});
