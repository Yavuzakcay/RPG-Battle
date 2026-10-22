/**
 * Görev J, savaş düzeyi: fiziksel zarla kurulum ve oyun, girilen zarların kaydı, kayıttan yükleme ve yeniden
 * oynatma, zar animasyonunun yalnızca canlı olaylarda çalışması.
 */
import { describe, it, expect } from 'vitest';
import { combatantFromMonster, combatantFromSheet, type BattleEvent } from '../battle';
import { chooseCommand } from '../battle/ai';
import { getMonster } from '../data';
import { DEMO_SHEETS } from '../demo';
import { createMapBattle } from '../app/setup';
import { LOADABLE_VERSIONS, SAVE_VERSION, restoreSession, serializeSession } from '../app/battleSave';
import { seededRng, type DiceRequest, type Rng } from '../rules/dice';
import { askFor, enterDice, newBook, runWithDice, type DiceBook, type DiceMode } from '../rules/manualDice';
import { autoplayEnemyTurns } from './autoplay';
import { dispatch, type Session } from './session';
import { diceCaption, diceLead, diceSeenAtStart, diceTimings, keptIndex, liveDiceRolls } from './diceAnim';
import { diceAskText } from './DicePrompt';

const party = () => Object.values(DEMO_SHEETS).map((sheet, i) => combatantFromSheet(sheet, { id: `pc${i + 1}`, ownerId: `p${i}` }));
const foes = () => [combatantFromMonster(getMonster('wolf'), { id: 'foe1', name: 'Wolf 1' }), combatantFromMonster(getMonster('wolf'), { id: 'foe2', name: 'Wolf 2' })];
const isPc = (id: string) => id.startsWith('pc');

/** Arayüzün yaptığını yapar: istenen her zarı (`answer`) girer, adımı aynı zarlarla yeniden çalıştırır. */
function play<T>(fn: (rng: Rng) => T, mode: DiceMode, answer: (req: DiceRequest) => number[], auto: Rng) {
  let book: DiceBook = newBook();
  const asked: DiceRequest[] = [];
  const opts = { ask: askFor(mode, isPc), auto };
  for (let i = 0; i < 400; i++) {
    const r = runWithDice(fn, book, opts);
    if (r.ok) return { value: r.value, asked };
    asked.push(r.need);
    book = enterDice(book, r.need, answer(r.need));
  }
  throw new Error('adım bitmedi');
}
/** Sabit, geçerli değerler: d20'de 11, diğerlerinde yüzün yarısı. */
const steady = (req: DiceRequest) => Array.from({ length: req.count }, () => (req.sides === 20 ? 11 : Math.ceil(req.sides / 2)));

function manualBattle(mode: DiceMode): { session: Session; asked: DiceRequest[] } {
  const auto = seededRng(5);
  const setup = play((rng) => createMapBattle([...party(), ...foes()], { mapId: 'col', variantId: 'gunduz', mirrored: false, diceMode: mode }, rng), mode, steady, auto);
  const started = play((rng) => dispatch(setup.value, { type: 'start_battle' }, rng), mode, steady, auto);
  return { session: started.value, asked: setup.asked };
}

describe('fiziksel zarla savaş', () => {
  it('kurulumda yalnızca oyuncu karakterlerinin inisiyatifi istenir (bonusuyla); canavarlarınki otomatik', () => {
    const { session, asked } = manualBattle('players');
    expect(asked.map((q) => [q.kind, q.by])).toEqual([['initiative', 'pc1'], ['initiative', 'pc2']]);
    expect(asked[0]?.bonus).toBe(session.state.combatants.pc1?.initiativeBonus || undefined);
    expect(session.state.diceMode).toBe('players');
    const first = session.events.find((e) => e.type === 'dice_rolled');
    expect(first && first.type === 'dice_rolled' && first.rolls.map((r) => [r.by, r.manual === true])).toEqual([
      ['pc1', true], ['pc2', true], ['foe1', false], ['foe2', false],
    ]);
  });
  it('herkes kipinde yapay zekâ turunda canavar zarları Game Master\'dan istenir', () => {
    const { session } = manualBattle('everyone');
    let s = session;
    // Sıra bir canavara gelene dek oyuncular turu bitirir.
    for (let i = 0; i < 4 && s.state.combatants[s.state.order[s.state.turnIndex] ?? '']?.side === 'party'; i++) {
      s = dispatch(s, { type: 'end_turn', actorId: s.state.order[s.state.turnIndex] ?? '' }, seededRng(1));
    }
    // Kurt koşup saldırana dek birkaç tur oynatılır; ilk istenen zar bir canavarın.
    let asked: DiceRequest[] = [];
    for (let round = 0; round < 6 && asked.length === 0; round++) {
      const r = play((rng) => autoplayEnemyTurns(s, rng), 'everyone', steady, seededRng(2));
      asked = r.asked;
      s = r.value;
      while (s.state.status === 'active' && s.state.combatants[s.state.order[s.state.turnIndex] ?? '']?.side === 'party') {
        s = dispatch(s, { type: 'end_turn', actorId: s.state.order[s.state.turnIndex] ?? '' }, seededRng(1));
      }
    }
    expect(asked.length).toBeGreaterThan(0);
    expect(asked[0]?.by?.startsWith('foe')).toBe(true);
  });
  it('girilen zarlar olay günlüğüne yazılır; kayıt → yükleme aynı durumu verir (sürüm 5 ve sonrası)', () => {
    let { session: s } = manualBattle('players');
    for (let i = 0; i < 40 && s.state.status === 'active'; i++) {
      const cmd = chooseCommand(s.state);
      const r = play((rng) => dispatch(s, cmd, rng), 'players', steady, seededRng(100 + i));
      s = r.value.error && 'actorId' in cmd ? dispatch(s, { type: 'end_turn', actorId: cmd.actorId }, seededRng(1)) : r.value;
    }
    const manual = s.events.flatMap((e) => (e.type === 'dice_rolled' ? e.rolls.filter((x) => x.manual) : []));
    expect(manual.length).toBeGreaterThan(2);
    expect(SAVE_VERSION).toBeGreaterThanOrEqual(5);
    const text = serializeSession(s);
    expect(JSON.parse(text).version).toBe(SAVE_VERSION);
    const r = restoreSession(text);
    if (!r.ok) throw new Error(r.error);
    expect(r.session.state).toEqual(s.state);
    expect(r.session.events).toEqual(s.events);
  });
  it('eski kayıt (sürüm 4: zar olayı ve zar modu yok) yüklenmeye devam eder', () => {
    const { session } = manualBattle('auto');
    const events = session.events.filter((e) => e.type !== 'dice_rolled');
    expect(LOADABLE_VERSIONS).toContain(4);
    const r = restoreSession(JSON.stringify({ version: 4, savedAt: '', events }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.session.state.diceMode).toBeUndefined();
  });
});

describe('zar animasyonu', () => {
  const live = (): Session => manualBattle('auto').session;
  it('yeni kurulan savaşta inisiyatif zarları oynar; kayıttan yüklenince eski zarlar oynamaz', () => {
    const s = live();
    expect(liveDiceRolls(s.events, diceSeenAtStart(s.events, false)).length).toBe(4);
    const restored = restoreSession(serializeSession(s));
    if (!restored.ok) throw new Error(restored.error);
    expect(liveDiceRolls(restored.session.events, diceSeenAtStart(restored.session.events, true))).toEqual([]);
  });
  it('canlı komutun zarları animasyona girer (kaydedici Rng ile gelen dice_rolled)', () => {
    const s = live();
    const seen = s.events.length;
    const actor = s.state.order[s.state.turnIndex] ?? '';
    const r = runWithDice((rng) => dispatch(s, { type: 'search', actorId: actor }, rng), newBook(), { ask: () => false, auto: seededRng(3) });
    if (!r.ok) throw new Error('istek beklenmezdi');
    const rolls = liveDiceRolls(r.value.events, seen);
    expect(rolls).toHaveLength(1);
    expect(rolls[0]).toMatchObject({ sides: 20, kind: 'check', by: actor });
    // Düz Rng ile (testler, simülasyon) zar olayı yazılmaz: eski olay akışı değişmez.
    const plain = dispatch(s, { type: 'search', actorId: actor }, seededRng(3));
    expect(plain.events.slice(seen).some((e: BattleEvent) => e.type === 'dice_rolled')).toBe(false);
  });
  it('yazılar: toplam, kritik ve kritik hata; avantajda sayılan zar; çoklu zar', () => {
    expect(diceCaption({ sides: 20, values: [14], bonus: 5 })).toEqual({ text: 'd20: 14 +5 = 19', crit: false, fumble: false });
    expect(diceCaption({ sides: 20, values: [3, 20], mode: 'advantage', bonus: 2 })).toMatchObject({ text: 'd20: 20 +2 = 22', crit: true });
    expect(keptIndex({ sides: 20, values: [3, 20], mode: 'advantage' })).toBe(1);
    expect(keptIndex({ sides: 20, values: [3, 20], mode: 'disadvantage' })).toBe(0);
    expect(diceCaption({ sides: 20, values: [1], bonus: 4 }).fumble).toBe(true);
    expect(diceCaption({ sides: 6, values: [3, 5], bonus: 3 }).text).toBe('2d6: 3 + 5 +3 = 11');
    expect(diceCaption({ sides: 6, values: [1, 2, 3, 4], critical: true }).text).toBe('4d6 (kritik): 1 + 2 + 3 + 4 = 10');
  });
  it('ayar: Kapalı → animasyon yok; hareketi azaltmada dönme yok; hasar işaretleri zarlardan sonra (en çok 3,2 sn)', () => {
    expect(diceTimings('off', false)).toBe(null);
    expect(diceTimings('normal', true)?.spin).toBe(0);
    expect(diceTimings('fast', false)!.spin).toBeLessThan(diceTimings('normal', false)!.spin);
    expect(diceLead(2, diceTimings('normal', false))).toBe(3000);
    expect(diceLead(3, diceTimings('normal', false))).toBe(3200);
    expect(diceLead(1, diceTimings('fast', false))).toBe(750);
    expect(diceLead(3, null)).toBe(0);
  });
  it('istem metni: "Hasar: 2 adet d6 at (+3)", kritik ve avantaj notu', () => {
    const t = diceAskText({ sides: 6, count: 4, kind: 'damage', bonus: 3, critical: true }, 'Bor');
    expect(t.title).toBe('Hasar: 4 adet d6 at (+3)');
    expect(t.lines).toContain('Kritik vuruş: hasar zarları iki katı.');
    expect(t.lines).toContain("dört d6'nın değerini gir");
    expect(diceAskText({ sides: 20, count: 2, kind: 'attack', bonus: 5, mode: 'advantage' }, 'Mira').lines[1]).toMatch(/Avantaj/);
  });
});
