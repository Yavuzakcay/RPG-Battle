/** Elle zar girişi (Görev J): zar kancası, istek akışı, geçersiz giriş, kritik zar sayısı. */
import { describe, it, expect } from 'vitest';
import { resolveAttack, resolveSave } from './attack';
import { rollTag, seededRng, type DiceRequest, type Rng } from './dice';
import { askFor, autoDice, enterDice, newBook, parseDiceInput, runWithDice, type DiceBook } from './manualDice';

const ALL = { ask: () => true, auto: seededRng(1) };
const attack = (rng: Rng, mode: 'normal' | 'advantage' | 'disadvantage' = 'normal') =>
  resolveAttack({ attackBonus: 5, targetAc: 15, mode, damage: '2d6+3' }, rollTag(rng, { by: 'pc1' }));

/** Adımı bitene dek çalıştırır; her istekte `answer` değerlerini girer. İstekleri sırayla döndürür. */
function playThrough<T>(fn: Parameters<typeof runWithDice<T>>[0], answer: (req: DiceRequest) => number[], opts = ALL) {
  let book: DiceBook = newBook();
  const asked: DiceRequest[] = [];
  for (let i = 0; i < 50; i++) {
    const r = runWithDice(fn, book, opts);
    if (r.ok) return { value: r.value, asked, groups: r.groups };
    asked.push(r.need);
    book = enterDice(book, r.need, answer(r.need));
  }
  throw new Error('bitmedi');
}

describe('zar kancası', () => {
  it('kancasız Rng aynen kalır: rollTag aynı fonksiyonu döndürür, sonuçlar değişmez', () => {
    const rng = seededRng(42);
    expect(rollTag(rng, { by: 'x', kind: 'attack' })).toBe(rng);
    const a = attack(seededRng(9));
    const b = resolveAttack({ attackBonus: 5, targetAc: 15, mode: 'normal', damage: '2d6+3' }, seededRng(9));
    expect(a).toEqual(b);
  });
  it('otomatik kaydedici aynı diziyi üretir (simülasyon ve testler etkilenmez)', () => {
    for (let seed = 1; seed < 30; seed++) {
      const r = runWithDice((rng) => attack(rng, 'advantage'), newBook(), { ask: () => false, auto: seededRng(seed) });
      expect(r.ok && r.value).toEqual(attack(seededRng(seed), 'advantage'));
    }
  });
});

describe('istek akışı', () => {
  it('saldırı: önce 1 adet d20 (+5) istenir; ıskada hasar zarı istenmez', () => {
    const r = runWithDice((rng) => attack(rng), newBook(), ALL);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.need).toEqual({ sides: 20, count: 1, kind: 'attack', by: 'pc1', bonus: 5 });
    const done = runWithDice((rng) => attack(rng), enterDice(newBook(), r.need, [4]), ALL);
    expect(done.ok && done.value.hit).toBe(false);
    expect(done.ok && done.groups.length).toBe(1);
  });
  it('isabette hasar: 2d6 +3 istenir, girilen değerler kullanılır', () => {
    const p = playThrough((rng) => attack(rng), (req) => (req.sides === 20 ? [12] : [3, 5]));
    expect(p.asked.map((q) => [q.kind, q.count, q.sides, q.bonus])).toEqual([['attack', 1, 20, 5], ['damage', 2, 6, 3]]);
    expect(p.value.damage?.total).toBe(11);
    expect(p.groups.every((g) => g.manual)).toBe(true);
  });
  it('kritik vuruş: hasar zarları iki katı istenir (2d6 → 4 adet d6)', () => {
    const p = playThrough((rng) => attack(rng), (req) => (req.sides === 20 ? [20] : [1, 2, 3, 4]));
    const dmg = p.asked[1];
    expect(dmg).toMatchObject({ kind: 'damage', sides: 6, count: 4, critical: true });
    expect(p.value.damage?.total).toBe(13);
  });
  it('avantajda iki d20 istenir, yüksek olan sayılır; dezavantajda düşük', () => {
    const adv = playThrough((rng) => attack(rng, 'advantage'), (req) => (req.sides === 20 ? [4, 17] : [1, 1]));
    expect(adv.asked[0]).toMatchObject({ count: 2, mode: 'advantage' });
    expect(adv.value.d20.kept).toBe(17);
    const dis = playThrough((rng) => attack(rng, 'disadvantage'), (req) => (req.sides === 20 ? [4, 17] : [1, 1]));
    expect(dis.value.d20.kept).toBe(4);
  });
  it('kurtarma zarı: zarı hedef atar (içteki bilgi önceliklidir)', () => {
    const r = runWithDice((rng) => resolveSave({ modifier: 2, dc: 13, mode: 'normal' }, rollTag(rng, { by: 'foe1', kind: 'check' })), newBook(), ALL);
    expect(!r.ok && r.need).toEqual({ sides: 20, count: 1, kind: 'save', by: 'foe1', bonus: 2 });
  });
  it('"Otomatik at" yalnızca o grubu atar; sıradaki elle istenir', () => {
    const r = runWithDice((rng) => attack(rng), newBook(), ALL);
    if (r.ok) throw new Error('istek beklenirdi');
    const book = autoDice(newBook(), r.need, () => 0.99); // doğal 20
    const next = runWithDice((rng) => attack(rng), book, ALL);
    expect(!next.ok && next.need).toMatchObject({ kind: 'damage', count: 4 });
  });
});

describe('zar modu ve giriş denetimi', () => {
  it('yalnızca oyuncular: oyuncunun zarı elle, canavarınki ve ortamınki otomatik; herkes: hepsi elle', () => {
    const players = askFor('players', (id) => id.startsWith('pc'));
    expect(players({ sides: 20, count: 1, by: 'pc1' })).toBe(true);
    expect(players({ sides: 20, count: 1, by: 'foe1' })).toBe(false);
    expect(players({ sides: 6, count: 2 })).toBe(false);
    expect(askFor('everyone', () => false)({ sides: 6, count: 2 })).toBe(true);
    expect(askFor('auto', () => true)({ sides: 20, count: 1, by: 'pc1' })).toBe(false);
  });
  it('geçersiz giriş reddedilir: 1..yüz sayısı dışı, ondalık, boş, harf, eksik alan', () => {
    const d6 = { sides: 6, count: 2 };
    expect(parseDiceInput(['3', '6'], d6)).toEqual({ ok: true, values: [3, 6] });
    expect(parseDiceInput(['0', '7'], d6)).toEqual({ ok: false, bad: [0, 1] });
    expect(parseDiceInput(['2.5', ''], d6)).toEqual({ ok: false, bad: [0, 1] });
    expect(parseDiceInput(['x', '4'], d6)).toEqual({ ok: false, bad: [0] });
    expect(parseDiceInput(['4'], d6)).toEqual({ ok: false, bad: [1] });
    expect(parseDiceInput([' 20 '], { sides: 20, count: 1 })).toEqual({ ok: true, values: [20] });
    expect(parseDiceInput(['21'], { sides: 20, count: 1 }).ok).toBe(false);
  });
});
