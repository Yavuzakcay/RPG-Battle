/**
 * Mekanik matris: Hazırla (Ready) eylemi satırları (SRD 5.2.1 s.186–187; kural sürümü 90, `src/battle/ready.ts`).
 * Her satır küçük bir sahnede komutları sırayla çalıştırır, beklenen SRD sonucunu motorun olaylarıyla karşılaştırır.
 */
import { execute } from '../../battle/commands';
import { applyEvents } from '../../battle/reduce';
import { readyFires } from '../../battle/ready';
import { seededRng } from '../../rules/dice';
import type { BattleEvent, BattleState, Combatant, Command } from '../../battle/types';
import { sword } from '../../battle/fixtures';
import { ally, caster, enemy, hex, scene } from './kurulum';
import type { Satir } from './ortak';

const P1 = { playerId: 'p1', isGm: false };
const GM = { playerId: 'gm', isGm: true };
const SRD = 'SRD 5.2.1 s.186–187 Ready';
const bow = { ...sword, label: 'Longbow', ranged: true, range: [150, 600] as [number, number] };

type Step = { cmd: Command; ctx: typeof P1 };
function play(state: BattleState, steps: Step[]): { state: BattleState; events: BattleEvent[]; error?: string } {
  let s = state;
  const events: BattleEvent[] = [];
  const rng = seededRng(7);
  for (const { cmd, ctx } of steps) {
    const r = execute(s, cmd, ctx, rng);
    if (!r.ok) return { state: s, events, error: r.error };
    s = r.state; events.push(...r.events);
  }
  return { state: s, events };
}
const of = <T extends BattleEvent['type']>(evs: BattleEvent[], t: T) => evs.filter((e): e is Extract<BattleEvent, { type: T }> => e.type === t);

function base(extra: Partial<Combatant> = {}, enemyAt = hex(9)): BattleState {
  return scene([
    caster({ weaponOptions: [sword, bow], spellNames: ['Guiding Bolt', 'Shield', 'Bless'], attacksPerAction: 2, ...extra }),
    enemy('B', enemyAt, { weaponOptions: [sword] }),
    ally('C', hex(2, 13)),
  ]);
}
const ready = (response: Extract<Command, { type: 'ready' }>['response'], trigger = 'erisime-girer'): Step =>
  ({ cmd: { type: 'ready', actorId: 'A', trigger, response }, ctx: P1 });
const endA: Step = { cmd: { type: 'end_turn', actorId: 'A' }, ctx: P1 };
const moveB = (row: number): Step => ({ cmd: { type: 'move', actorId: 'B', to: hex(row) }, ctx: GM });

function row(baglam: string, kategori: string, beklenen: string, f: () => string): Satir {
  let gercek: string;
  try { gercek = f(); } catch (e) { return { tur: 'eylem', ad: 'Ready (Hazırla)', seviye: '', siniflar: '', mekanik: 'ready', baglam, kategori, beklenen, gercek: String(e), sonuc: 'çökme', not: SRD }; }
  return { tur: 'eylem', ad: 'Ready (Hazırla)', seviye: '', siniflar: '', mekanik: 'ready', baglam, kategori, beklenen, gercek, sonuc: gercek === beklenen ? 'doğru' : 'yanlış', not: SRD };
}

export function hazirlaSatirlari(): Satir[] {
  return [
    row('düşman erişime girer → saldırı', 'tepki', 'tek saldırı, tepki ready', () => {
      const r = play(base(), [ready({ kind: 'attack', option: sword }), endA, moveB(3)]);
      const atk = of(r.events, 'attack_resolved').filter((e) => e.actorId === 'A' && e.ready);
      return r.error ?? `${atk.length === 1 ? 'tek saldırı' : `${atk.length} saldırı`}, tepki ${of(r.events, 'reaction_used').map((e) => e.trigger).join('+')}`;
    }),
    row('Extra Attack (2 saldırı) varken', 'saldırı zarı', '1', () => {
      const r = play(base(), [ready({ kind: 'attack', option: sword }), endA, moveB(3)]);
      return r.error ?? String(of(r.events, 'attack_resolved').filter((e) => e.actorId === 'A').length);
    }),
    row('hareket yanıtı', 'tepki', 'hareket tepkiyle, turun hareketi değişmedi', () => {
      const s0 = base();
      const r = play(s0, [ready({ kind: 'move', to: hex(0) }), endA, moveB(3)]);
      const a = r.state.combatants.A as Combatant;
      const mv = of(r.events, 'moved').find((e) => e.actorId === 'A');
      return r.error ?? `${mv?.reaction ? 'hareket tepkiyle' : 'hareket yok'}, turun hareketi ${a.movementUsed === (s0.combatants.A as Combatant).movementUsed ? 'değişmedi' : 'değişti'}`;
    }),
    row('büyü hazırlanınca slot', 'yukarı slot', '1. seviye slot 4 → 3, konsantrasyon ready:Guiding Bolt', () => {
      const r = play(base(), [ready({ kind: 'spell', spellName: 'Guiding Bolt' }, 'saldirir')]);
      const a = r.state.combatants.A as Combatant;
      return r.error ?? `1. seviye slot 4 → ${a.spellSlots[0]}, konsantrasyon ${a.concentration?.spell ?? 'yok'}`;
    }),
    row('tetik gelmezse (sonraki tur başı)', 'konsantrasyon', 'slot 3 (geri gelmedi), konsantrasyon yok, hazırlık bitti', () => {
      const r = play(base(), [ready({ kind: 'spell', spellName: 'Guiding Bolt' }, 'saldirir'), endA,
        { cmd: { type: 'end_turn', actorId: 'B' }, ctx: GM }, { cmd: { type: 'end_turn', actorId: 'C' }, ctx: P1 }]);
      const a = r.state.combatants.A as Combatant;
      return r.error ?? `slot ${a.spellSlots[0]} (${a.spellSlots[0] === 3 ? 'geri gelmedi' : 'geri geldi'}), konsantrasyon ${a.concentration ? 'var' : 'yok'}, hazırlık ${a.readied ? 'sürüyor' : 'bitti'}`;
    }),
    row('tutma konsantrasyonu bozulur', 'konsantrasyon', 'tetiklenmez', () => {
      const r = play(base(), [ready({ kind: 'spell', spellName: 'Guiding Bolt' }, 'saldirir')]);
      const s = applyEvents(r.state, [{ type: 'concentration_ended', actorId: 'A', label: 'CON save' }]);
      return readyFires(s, s.combatants.A as Combatant, { olay: 'saldiri', sourceId: 'B', targetId: 'C' }) ? 'tetiklenir' : 'tetiklenmez';
    }),
    row('döküm süresi tepki olan büyü (Shield)', 'yapım', 'red', () => {
      const r = play(base(), [ready({ kind: 'spell', spellName: 'Shield' }, 'saldirir')]);
      return r.error ? 'red' : 'kabul';
    }),
    row('fırsat saldırısı ile aynı tepki', 'tepki', 'leave', () => {
      const r = play(base({}, hex(3)), [ready({ kind: 'attack', option: bow }, 'hareket-eder'), endA, moveB(9)]);
      return r.error ?? of(r.events, 'reaction_used').filter((e) => e.actorId === 'A').map((e) => e.trigger).join('+');
    }),
    row('kural sürümü 89', 'yapım', 'red', () => {
      const r = play({ ...base(), kuralSurumu: 89 }, [ready({ kind: 'attack', option: sword })]);
      return r.error ? 'red' : 'kabul';
    }),
  ];
}
