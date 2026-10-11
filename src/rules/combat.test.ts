import { describe, it, expect } from 'vitest';
import { combineModes, invertMode, environmentSources } from './modes';
import { attackSources, autoFailsStrDexSave, isAutoCritical, isIncapacitated, type AttackContext } from './conditions';
import { resolveAttack, resolveSave } from './attack';
import { adjustDamage, applyDamage, applyHealing, halfDamage } from './damage';
import { environments } from '../data';
import type { Rng } from './dice';

/** Sırayla verilen zar değerlerini üreten sahte rastgele üretici: { sides, value } listesi. */
function scripted(...rolls: Array<[number, number]>): Rng {
  let i = 0;
  return () => {
    const [sides, value] = rolls[i++] ?? [20, 1];
    return (value - 0.5) / sides;
  };
}

const env = (prefix: string) => {
  const found = environments.find((e) => e.name.startsWith(prefix));
  if (!found) throw new Error(`ortam yok: ${prefix}`);
  return found;
};

const base: AttackContext = {
  attackerConditions: [], targetConditions: [], attackerHeight: 0, targetHeight: 0, ranged: false, spell: false,
};

describe('combineModes', () => {
  it('kaynak yoksa normal', () => expect(combineModes([])).toBe('normal'));
  it('yalnızca avantaj veya yalnızca dezavantaj', () => {
    expect(combineModes([{ effect: 'advantage', reason: 'a' }])).toBe('advantage');
    expect(combineModes([{ effect: 'disadvantage', reason: 'd' }])).toBe('disadvantage');
  });
  it('avantaj ve dezavantaj birbirini iptal eder, sayı önemli değil', () => {
    const many = [
      { effect: 'advantage' as const, reason: '1' },
      { effect: 'advantage' as const, reason: '2' },
      { effect: 'disadvantage' as const, reason: '3' },
    ];
    expect(combineModes(many)).toBe('normal');
  });
  it('invertMode', () => {
    expect(invertMode('advantage')).toBe('disadvantage');
    expect(invertMode('disadvantage')).toBe('advantage');
    expect(invertMode('normal')).toBe('normal');
  });
});

describe('environmentSources', () => {
  it('buzulda ateş dezavantajlı, soğuk avantajlı', () => {
    const buzul = env('Buzul');
    expect(combineModes(environmentSources(buzul, 'wizard fire bolt 120 ft 1d10 fire'))).toBe('disadvantage');
    expect(combineModes(environmentSources(buzul, 'wizard ray of frost 1d8 cold'))).toBe('advantage');
    expect(combineModes(environmentSources(buzul, 'wizard magic missile 1d4+1 force'))).toBe('normal');
  });
  it('ormanda okçuluk dezavantajlı, Ranger avantajlı (iptal)', () => {
    const orman = env('Orman');
    const mode = combineModes(environmentSources(orman, 'ranger longbow piercing'));
    expect(mode).toBe('normal'); // ranger avantajı + yay dezavantajı birbirini iptal eder
  });
  it('anahtar kelimeler büyük küçük harften bağımsız eşleşir', () => {
    expect(environmentSources(env('Buzul'), 'FIRE BOLT').length).toBeGreaterThanOrEqual(1);
  });
});

describe('attackSources', () => {
  it('yüksek zemin avantaj, alçak zemin dezavantaj verir', () => {
    expect(combineModes(attackSources({ ...base, attackerHeight: 1, targetHeight: 0 }))).toBe('advantage');
    expect(combineModes(attackSources({ ...base, attackerHeight: -1, targetHeight: 1 }))).toBe('disadvantage');
    expect(combineModes(attackSources({ ...base }))).toBe('normal');
  });
  it('yerdeki hedefe yakından avantaj, uzaktan dezavantaj, büyüde etkisiz', () => {
    expect(combineModes(attackSources({ ...base, targetConditions: ['Prone'] }))).toBe('advantage');
    expect(combineModes(attackSources({ ...base, targetConditions: ['Prone'], ranged: true }))).toBe('disadvantage');
    expect(combineModes(attackSources({ ...base, targetConditions: ['Prone'], spell: true }))).toBe('normal');
  });
  it('saldıranın durumları dezavantaj, görünmezlik avantaj verir', () => {
    expect(combineModes(attackSources({ ...base, attackerConditions: ['Poisoned'] }))).toBe('disadvantage');
    expect(combineModes(attackSources({ ...base, attackerConditions: ['Invisible'] }))).toBe('advantage');
  });
  it('hedef Paralyzed ise avantaj, hedef görünmezse dezavantaj', () => {
    expect(combineModes(attackSources({ ...base, targetConditions: ['Paralyzed'] }))).toBe('advantage');
    expect(combineModes(attackSources({ ...base, targetConditions: ['Invisible'] }))).toBe('disadvantage');
  });
  it('Pack Tactics avantaj verir', () => {
    expect(combineModes(attackSources({ ...base, packTactics: true }))).toBe('advantage');
  });
  it('nedenler listede yer alır', () => {
    const reasons = attackSources({ ...base, attackerHeight: 1 }).map((s) => s.reason);
    expect(reasons.includes('Yüksek zemin avantajı')).toBe(true);
  });
});

describe('durum yardımcıları', () => {
  it('aksiyon yapamaz durumları', () => {
    expect(isIncapacitated(['Stunned'])).toBe(true);
    expect(isIncapacitated(['Poisoned'])).toBe(false);
  });
  it('STR/DEX save otomatik kaybı', () => {
    expect(autoFailsStrDexSave(['Paralyzed'])).toBe(true);
    expect(autoFailsStrDexSave(['Prone'])).toBe(false);
  });
  it('yakından saldırı Paralyzed hedefe kritik, uzaktan değil', () => {
    expect(isAutoCritical(['Paralyzed'], false)).toBe(true);
    expect(isAutoCritical(['Paralyzed'], true)).toBe(false);
    expect(isAutoCritical(['Prone'], false)).toBe(false);
  });
});

describe('resolveAttack', () => {
  const input = { attackBonus: 5, targetAc: 15, mode: 'normal' as const, damage: '1d8+3' };

  it('toplam AC\'ye eşitse isabet eder ve hasar atar', () => {
    const r = resolveAttack(input, scripted([20, 10], [8, 4]));
    expect(r.total).toBe(15);
    expect(r.hit).toBe(true);
    expect(r.critical).toBe(false);
    expect(r.damage?.total).toBe(7); // 4 + 3
  });
  it('AC\'nin altında ıskalar, hasar atılmaz', () => {
    const r = resolveAttack(input, scripted([20, 9]));
    expect(r.hit).toBe(false);
    expect(r.damage).toBe(null);
  });
  it('doğal 1 her zaman ıskalar', () => {
    const r = resolveAttack({ ...input, attackBonus: 30 }, scripted([20, 1]));
    expect(r.fumble).toBe(true);
    expect(r.hit).toBe(false);
  });
  it('doğal 20 her zaman isabet ve kritik, zarlar iki katı', () => {
    const r = resolveAttack({ ...input, targetAc: 40 }, scripted([20, 20], [8, 2], [8, 3]));
    expect(r.hit).toBe(true);
    expect(r.critical).toBe(true);
    expect(r.damage?.rolls).toEqual([2, 3]);
    expect(r.damage?.total).toBe(8); // 2 + 3 + 3
  });
  it('autoCritical sıradan bir isabeti kritik yapar', () => {
    const r = resolveAttack({ ...input, autoCritical: true }, scripted([20, 12], [8, 1], [8, 1]));
    expect(r.critical).toBe(true);
    expect(r.damage?.rolls.length).toBe(2);
  });
  it('autoCritical ıskayı kritik yapmaz', () => {
    const r = resolveAttack({ ...input, autoCritical: true }, scripted([20, 5]));
    expect(r.hit).toBe(false);
    expect(r.critical).toBe(false);
  });
  it('avantajda yüksek zar sayılır', () => {
    const r = resolveAttack({ ...input, mode: 'advantage' }, scripted([20, 4], [20, 17], [8, 5]));
    expect(r.d20.kept).toBe(17);
    expect(r.hit).toBe(true);
  });
  it('dezavantajda düşük zar sayılır', () => {
    const r = resolveAttack({ ...input, mode: 'disadvantage' }, scripted([20, 4], [20, 17]));
    expect(r.d20.kept).toBe(4);
    expect(r.hit).toBe(false);
  });
});

describe('resolveSave', () => {
  it('toplam DC\'ye eşitse başarılı', () => {
    expect(resolveSave({ modifier: 2, dc: 14, mode: 'normal' }, scripted([20, 12])).success).toBe(true);
    expect(resolveSave({ modifier: 2, dc: 14, mode: 'normal' }, scripted([20, 11])).success).toBe(false);
  });
  it('otomatik başarısızlıkta zar atılmaz', () => {
    const r = resolveSave({ modifier: 10, dc: 5, mode: 'normal', autoFail: true });
    expect(r.success).toBe(false);
    expect(r.d20).toBe(null);
  });
});

describe('damage', () => {
  it('direnç yarıya indirir (aşağı yuvarlar), zayıflık ikiye katlar, bağışıklık sıfırlar', () => {
    expect(adjustDamage(9, 'fire', { resistances: ['fire'] })).toEqual({ amount: 4, note: 'resistant' });
    expect(adjustDamage(9, 'fire', { vulnerabilities: ['fire'] })).toEqual({ amount: 18, note: 'vulnerable' });
    expect(adjustDamage(9, 'fire', { immunities: ['fire'] })).toEqual({ amount: 0, note: 'immune' });
  });
  it('öncelik: bağışıklık, sonra zayıflık, sonra direnç', () => {
    expect(adjustDamage(10, 'fire', { immunities: ['fire'], vulnerabilities: ['fire'] }).amount).toBe(0);
    expect(adjustDamage(10, 'fire', { vulnerabilities: ['fire'], resistances: ['fire'] }).amount).toBe(20);
  });
  it('tür boşsa veya eşleşmezse hasar değişmez, büyük harf ve boşluk önemsiz', () => {
    expect(adjustDamage(7, undefined, { immunities: ['fire'] }).amount).toBe(7);
    expect(adjustDamage(7, 'cold', { immunities: ['fire'] }).amount).toBe(7);
    expect(adjustDamage(7, 'FIRE', { immunities: [' fire '] }).amount).toBe(0);
  });
  it('HP 0\'ın altına inmez, iyileşme maksimumu aşmaz, yarım hasar aşağı yuvarlanır', () => {
    expect(applyDamage(5, 12)).toBe(0);
    expect(applyHealing(10, 12, 9)).toBe(12);
    expect(halfDamage(15)).toBe(7);
  });
});
