/**
 * Mekanik matris düzeltmeleri (kural sürümü 83; harita/belgeler/MEKANIK-MATRIS.md). Her düzeltme 83'te açık, 82'de eski
 * davranış (eski kayıt ve replay aynen).
 */
import { describe, expect, it } from 'vitest';
import { execute } from './commands';
import { startBattle } from './create';
import { mk, P1 } from './fixtures';
import { MATRIS_VERSION, matrisOn } from './matrisSurum';
import { CURRENT_RULES } from './ruleVersion';
import { saveMode } from './durations';
import type { DiceRequest, Rng } from '../rules/dice';
import type { BattleEvent, BattleState, Combatant, Command } from './types';

type D20 = { one: number; two: [number, number] };
/** Kancalı zar: d20 tek zarda `one`, çift zarda `two`; diğer zarlar ⌊yüz/2⌋ + 1. */
function hooked(d20: D20): Rng {
  const f = (() => 0.5) as Rng & { dice?: (r: DiceRequest) => number[] };
  f.dice = (req) => (req.sides === 20 ? (req.count >= 2 ? [...d20.two] : [d20.one]) : Array.from({ length: req.count }, () => Math.floor(req.sides / 2) + 1));
  return f;
}
/** DC 15'e karşı: tek zarda başarılı (19), dezavantajda başarısız (3). */
const PROBE: D20 = { one: 19, two: [19, 3] };

const flat = (): string[] => Array.from({ length: 11 }, () => '.'.repeat(21));
function scene(v: number, parts: Combatant[]): BattleState {
  const s0 = startBattle('m83', 'd', parts.map((p) => ({ ...p, pos: null })), () => 0.5, { kuralSurumu: v, map: { id: 'kale-onu', variantId: 'gunduz' } } as never).state;
  const cs: Record<string, Combatant> = {};
  for (const p of parts) cs[p.id] = { ...(s0.combatants[p.id] as Combatant), pos: p.pos, initiative: 0 };
  return { ...s0, kuralSurumu: v, status: 'active', round: 1, order: parts.map((p) => p.id), turnIndex: 0, combatants: cs,
    map: { ...s0.map!, tiles: flat(), objects: [], zones: [] } };
}
const caster = (p: Partial<Combatant> = {}): Combatant => mk('A', { ownerId: 'p1', hp: 100, maxHp: 100, level: 9, spellSaveDc: 15, spellAttack: 7, spellMod: 4,
  spellSlots: [4, 3, 3, 3, 1, 0, 0, 0, 0], pos: { col: 3, row: 5 }, ...p });
const foe = (id: string, p: Partial<Combatant> = {}): Combatant => mk(id, { side: 'enemies', hp: 100, maxHp: 100, pos: { col: 4, row: 5 }, ...p });
function run(s: BattleState, cmd: Command, rng: Rng): { ok: boolean; error?: string; events: BattleEvent[]; state: BattleState } {
  const r = execute(s, cmd, P1, rng);
  return r.ok ? { ok: true, events: r.events, state: r.state } : { ok: false, error: r.error, events: [], state: s };
}
const saveOf = (events: BattleEvent[], id: string) => events.find((e): e is Extract<BattleEvent, { type: 'save_resolved' }> => e.type === 'save_resolved' && e.targetId === id);

describe('Matris: sürüm', () => {
  it('83; güncel sürüm 83+; 82 kapalı', () => {
    expect(MATRIS_VERSION).toBe(83);
    expect(CURRENT_RULES).toBeGreaterThanOrEqual(83);
    expect(matrisOn({ kuralSurumu: 82 })).toBe(false);
    expect(matrisOn({ kuralSurumu: 83 })).toBe(true);
  });
});

describe('B01: Restrained hedefin DEX save\'i dezavantajlı (SRD 5.2.1 Restrained)', () => {
  it('saveMode: yalnız `srd83` işaretiyle ve yalnız DEX', () => {
    expect(saveMode('normal', { conditions: ['Restrained'], srd83: true }, 'dex')).toBe('disadvantage');
    expect(saveMode('normal', { conditions: ['Restrained'], srd83: true }, 'str')).toBe('normal');
    expect(saveMode('normal', { conditions: ['Restrained'] }, 'dex')).toBe('normal');
    expect(saveMode('advantage', { conditions: ['Restrained'], srd83: true }, 'dex')).toBe('normal');
  });
  it('83: Burning Hands save\'i dezavantajlı (iki zar, düşük olan); 82: tek zar', () => {
    const parts = (): Combatant[] => [caster({ spellNames: ['Burning Hands'] }), foe('T', { conditions: ['Restrained'] })];
    const cmd: Command = { type: 'cast_spell', actorId: 'A', spellName: 'Burning Hands', slotLevel: 1, targetHex: { col: 4, row: 5 } } as Command;
    const s83 = scene(83, parts());
    expect(s83.combatants.T?.srd83).toBe(true);
    const r83 = run(s83, cmd, hooked(PROBE));
    expect(r83.ok, r83.error).toBe(true);
    const sv83 = saveOf(r83.events, 'T');
    expect(sv83?.d20).toEqual([19, 3]);
    expect(sv83?.success).toBe(false);
    const s82 = scene(82, parts());
    expect(s82.combatants.T?.srd83).toBeUndefined();
    const sv82 = saveOf(run(s82, cmd, hooked(PROBE)).events, 'T');
    expect(sv82?.d20).toEqual([19]);
    expect(sv82?.success).toBe(true);
  });
});
