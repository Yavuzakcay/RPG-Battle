/**
 * Görev KATALOG-1 E: özgün savaş donanımları ve tüketilebilirler (Tüketilebilirler Kataloğu #1–45): 12 bomba/küre, 12 özel ok,
 * 9 kaplama/zehir, 5 iksir + Melek Uykusu, 5 eliksir, 1 çay. Kullanıcı kararı (2026-11-26): O7 (alanlı fırlatma, kaplama şeması)
 * KATALOG-2'de; K12: özel oklar ve eliksirler yalnız veri. Savaşa yalnız mevcut `use` yollarına birebir oturan parça bağlandı
 * (kural ve kayıt sürümü değişmedi); hepsi `kismi`, eksik kısım notta.
 */
import { describe, expect, it } from 'vitest';
import katalog from '../../data/items-katalog.json';
import { execute } from './commands';
import { combatantFromSheet, startBattle } from './create';
import { replay } from './reduce';
import { P1, mk } from './fixtures';
import { blankCharacter } from '../rules/builder';
import { CURRENT_RULES } from './ruleVersion';
import { items } from '../data';
import { itemKind } from '../rules/itemCategory';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command } from './types';
import type { CharacterSheet } from '../rules/stats';
import type { Rng } from '../rules/dice';

type K = { id: string; name: string; attunement: boolean; use?: { kind: string }; katalog: { ref: string; tur: string; ozellikler: Array<{ ad: string; durum: string; not?: string }> } };
const TK = (katalog as unknown as { esyalar: K[] }).esyalar.filter((x) => x.katalog.ref.startsWith('TK#'));
const num = (x: K) => Number(x.katalog.ref.slice(3));
const sheet = (itemNames: string[]) => ({ ...blankCharacter('p1').sheet, name: 'Savaşçı', classId: 'fighter', level: 5, weapons: [{ name: 'Longsword' }], itemNames }) as CharacterSheet;
function arena(itemNames: string[]): BattleState {
  const a = combatantFromSheet(sheet(itemNames), { id: 'A', ownerId: 'p1' });
  const parts = [{ ...a, id: 'A', ownerId: 'p1' }, mk('C', { ownerId: 'p1', hp: 20, maxHp: 30 }),
    mk('B', { side: 'enemies', hp: 200, maxHp: 200, ac: 5, saves: { str: -5, dex: -5, con: -5, int: -5, wis: -5, cha: -5 } })];
  const s0 = startBattle('kat-e', 'd-z-zemin', parts, () => 0.5, { kuralSurumu: CURRENT_RULES, map: { id: 'col' } }).state;
  const combatants = { ...s0.combatants };
  for (const [id, p] of Object.entries({ A: { col: 4, row: 3 }, B: { col: 5, row: 3 }, C: { col: 3, row: 3 } })) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return { ...s0, status: 'active', round: 1, order: ['A', 'B', 'C'], turnIndex: 0, combatants, map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: Array.from({ length: 7 }, () => '.'.repeat(15)) } } as BattleState;
}
const run = (s: BattleState, cmd: Command, rng: Rng = () => 0.5) => { const r = execute(s, cmd, P1, rng); if (!r.ok) throw new Error(r.error); return r; };
const use = (s: BattleState, itemId: string, targetId = 'A') => run(s, { type: 'use_item', actorId: 'A', itemId, targetId });

describe('KATALOG-1 E: tüketilebilirler', () => {
  it('45 parça TK#1–45, tür tüketilebilir, uyum yok; oluşturucuda tüketilebilir grubu', () => {
    expect(TK.map(num)).toEqual(Array.from({ length: 45 }, (_, i) => i + 1));
    for (const x of TK) {
      expect(x.katalog.tur, x.id).toBe('tuketilebilir');
      expect(x.attunement, x.id).toBe(false);
      expect(itemKind(items.find((i) => i.id === x.id)!), x.id).toBe('tuketilebilir');
    }
  });
  it('bombalar (O7), özel oklar ve eliksirler (K12) savaşta kullanılmaz, güçleri planlı; yalnız 7 iksir/kaplama kısmen', () => {
    const veri = TK.filter((x) => num(x) <= 24 || (num(x) >= 40 && num(x) <= 44));
    expect(veri).toHaveLength(29);
    for (const x of veri) {
      expect(x.use, x.id).toBeUndefined();
      for (const f of x.katalog.ozellikler) expect(f.durum, x.id).toBe('planli');
    }
    const kul = TK.filter((x) => x.use).map((x) => x.id);
    expect(kul).toEqual(['hoarfrost-coating', 'ironhide-armour-potion', 'spellward-armour-potion', 'nimble-tumble-potion', 'stoneskin-draught', 'strong-will-draught', 'emerald-tea-brew']);
    for (const x of TK) for (const f of x.katalog.ozellikler) {
      expect(f.durum, x.id).toBe(x.use ? 'kismi' : 'planli');
      expect((f.not ?? '').length, x.id).toBeGreaterThan(10);
    }
  });
  it('Taş Deri İksiri: 20 geçici can, B/P/S direnci, Poisoned/Stunned bağışıklığı, yarı hız; bonus eylem, adet düşer, replay aynı', () => {
    const s = arena(['Stoneskin Draught']);
    expect(s.combatants.A?.consumables?.['stoneskin-draught']).toBe(1);
    const r = use(s, 'stoneskin-draught');
    const a = r.state.combatants.A!;
    expect(a.tempHp).toBe(20);
    const e = a.effects!.find((x) => x.id === 'item:stoneskin-draught')!;
    expect(e).toEqual(expect.objectContaining({ resist: ['bludgeoning', 'piercing', 'slashing'], immune: ['Poisoned', 'Stunned'], speedMult: 0.5, until: 3 }));
    expect(a.economy.bonus).toBe(true);
    expect(a.consumables?.['stoneskin-draught']).toBe(0);
    expect(replay([{ type: 'battle_started', state: s }, ...r.events])).toEqual(r.state);
  });
  it('Sağlam İrade İksiri 5 ft içindeki dosta: 3 tur Frightened/Charmed/Blinded bağışıklığı ve 10 geçici can', () => {
    const r = use(arena(['Strong Will Draught']), 'strong-will-draught', 'C');
    const c = r.state.combatants.C!;
    expect(c.tempHp).toBe(10);
    expect(c.effects!.find((x) => x.id === 'item:strong-will-draught')?.immune).toEqual(['Frightened', 'Charmed', 'Blinded']);
  });
  it('Çevik Savuşturma (yalnız kendine): saldırılar dezavantajlı, fırsat saldırısı yok; Zırh iksirleri 12 geçici can', () => {
    const s = arena(['Nimble Tumble Potion', 'Ironhide Armour Potion']);
    expect(execute(s, { type: 'use_item', actorId: 'A', itemId: 'nimble-tumble-potion', targetId: 'C' }, P1, () => 0.5).ok).toBe(false);
    const e = use(s, 'nimble-tumble-potion').state.combatants.A!.effects!.find((x) => x.id === 'item:nimble-tumble-potion')!;
    expect(e).toEqual(expect.objectContaining({ attackedDis: true, noProvoke: true, until: 2 }));
    expect(use(s, 'ironhide-armour-potion', 'C').state.combatants.C!.tempHp).toBe(12);
  });
  it('Zümrüt Çay: içtiği tur ek bonus eylem hakkı (+10 ft); Ayaz Kaplama: silah isabetine +1d4 soğuk', () => {
    const r = use(arena(['Emerald Tea Brew', 'Strong Will Draught']), 'emerald-tea-brew');
    expect(r.state.combatants.A!.effects!.find((x) => x.id === 'item:emerald-tea-brew')).toEqual(expect.objectContaining({ extraBonus: 1, speedFt: 10 }));
    // Bonus eylem çayla harcandı; ek hak ikinci bonus eyleme izin verir.
    expect(execute(r.state, { type: 'use_item', actorId: 'A', itemId: 'strong-will-draught', targetId: 'A' }, P1, () => 0.5).ok).toBe(true);
    const s2 = use(arena(['Hoarfrost Coating']), 'hoarfrost-coating').state;
    const o = s2.combatants.A!.weaponOptions[0] as AttackOption;
    const atk = run(s2, { type: 'attack', actorId: 'A', targetId: 'B', option: { ...o, attackBonus: 30 } }, () => 0.7).events
      .find((e) => e.type === 'attack_resolved') as Extract<BattleEvent, { type: 'attack_resolved' }>;
    expect(atk.extra?.some((x) => x.label === 'Hoarfrost Coating' && x.type === 'cold')).toBe(true);
  });
});
