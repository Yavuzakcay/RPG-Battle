/**
 * Hazırla (Ready) eylemi, SRD 5.2.1 s.186–187 (kural sürümü 89; `ready.ts`): tetik türleri, saldırı/hareket/büyü yanıtı,
 * slot harcanması ve geri gelmemesi, tutma konsantrasyonunun bozulması, tepki çakışması (fırsat saldırısı), kapılar
 * (Incapacitated, Time Stop, ele geçirme, kontrollü binek, Wild Shape), sürüm kapısı, replay ve kayıt sürümü 24.
 */
import { describe, expect, it } from 'vitest';
import { execute, replay } from './index';
import type { AttackOption, BattleEvent, BattleState, Combatant, Command } from './index';
import { applyEvents } from './reduce';
import { GM, P1, mk, scripted, sword } from './fixtures';
import { startBattle } from './index';
import { readyCleanupEvents, readyFires, READY_TRIGGERS } from './ready';
import { READY_VERSION } from './readySurum';
import { controlledCommandProblem } from './binekMb2';
import { possessionCommandProblem } from './possession';
import { CURRENT_RULES } from './ruleVersion';
import { LOADABLE_VERSIONS, SAVE_VERSION, restoreSession } from '../app/battleSave';
import type { Offset } from '../rules/hex';

const o = (col: number, row: number): Offset => ({ col, row });
const OPEN = Array.from({ length: 7 }, () => '.'.repeat(15));
type R = ReturnType<typeof execute>;
const ok = (r: R) => { if (!r.ok) throw new Error(r.error); return r; };
const err = (r: R) => (r.ok ? '' : r.error);
const of = <T extends BattleEvent['type']>(evs: BattleEvent[], t: T) => evs.filter((e): e is Extract<BattleEvent, { type: T }> => e.type === t);
const pad = (...xs: Array<[number, number]>) => scripted(...xs, ...Array.from({ length: 60 }, () => [20, 15] as [number, number]));
const bow: AttackOption = { ...sword, label: 'Longbow', ranged: true, range: [150, 600] };

/** Açık harita; sıra A (p1), B (düşman), C (p2); A'nın turu. */
function field(pos: Record<string, Offset>, a: Partial<Combatant> = {}, b: Partial<Combatant> = {}, c: Partial<Combatant> = {}): BattleState {
  const parts = [
    mk('A', { ownerId: 'p1', hp: 30, maxHp: 30, weaponOptions: [sword, bow], ...a }),
    mk('B', { side: 'enemies', ac: 5, hp: 60, maxHp: 60, weaponOptions: [sword], ...b }),
    mk('C', { ownerId: 'p2', weaponOptions: [sword], ...c }),
  ];
  const { state } = startBattle('h', 'd-z-zemin', parts, scripted([20, 20], [20, 19], [20, 18]), { map: { id: 'volkan' } });
  const combatants = { ...state.combatants };
  for (const [id, p] of Object.entries(pos)) combatants[id] = { ...(combatants[id] as Combatant), pos: p };
  return { ...state, status: 'active', turnIndex: 0, combatants, map: { ...(state.map as NonNullable<BattleState['map']>), tiles: OPEN } };
}
const ready = (s: BattleState, cmd: Omit<Extract<Command, { type: 'ready' }>, 'type' | 'actorId'>, rng = pad()) =>
  execute(s, { type: 'ready', actorId: 'A', ...cmd }, P1, rng);
const endA = (s: BattleState) => ok(execute(s, { type: 'end_turn', actorId: 'A' }, P1, pad())).state;
const moveB = (s: BattleState, to: Offset, rng = pad()) => execute(s, { type: 'move', actorId: 'B', to }, GM, rng);
const A = (s: BattleState) => s.combatants.A as Combatant;
const caster: Partial<Combatant> = { spellNames: ['Fire Bolt', 'Guiding Bolt', 'Bless'], spellSlots: [2, 0, 0, 0, 0, 0, 0, 0, 0], spellAttack: 7, spellSaveDc: 15 };

describe('Hazırla: veri ve sürüm', () => {
  it('kural sürümü 89 ve tetikler veride (en az dört olay türü)', () => {
    expect(READY_VERSION).toBe(89);
    expect(CURRENT_RULES).toBeGreaterThanOrEqual(READY_VERSION);
    expect(new Set(READY_TRIGGERS.map((t) => t.olay))).toEqual(new Set(['adim', 'saldiri', 'buyu', 'hareketBitti']));
  });
  it('sürüm 88 ve altında komut reddedilir; kayıt sürümü 24 ve 23 yüklenir', () => {
    const s = { ...field({ A: o(3, 3), B: o(8, 3), C: o(2, 5) }), kuralSurumu: 88 };
    expect(err(ready(s, { trigger: 'saldirir', response: { kind: 'attack', option: sword } }))).toMatch(/89/);
    expect(SAVE_VERSION).toBe(24);
    expect(LOADABLE_VERSIONS).toContain(23);
    expect(LOADABLE_VERSIONS).toContain(24);
  });
  it('eylem harcar; haritasız savaş, bilinmeyen tetik ve ikinci hazırlık reddedilir', () => {
    const s = field({ A: o(3, 3), B: o(8, 3), C: o(2, 5) });
    const r = ok(ready(s, { trigger: 'erisime-girer', response: { kind: 'attack', option: sword } }));
    expect(A(r.state).economy.action).toBe(true);
    expect(A(r.state).readied?.trigger).toBe('erisime-girer');
    expect(err(ready(s, { trigger: 'yok', response: { kind: 'attack', option: sword } }))).toMatch(/Bilinmeyen tetik/);
    expect(err(ready({ ...s, map: undefined }, { trigger: 'saldirir', response: { kind: 'attack', option: sword } }))).toMatch(/haritalı/);
    expect(err(ready(s, { trigger: 'altigene-girer', response: { kind: 'attack', option: sword } }))).toMatch(/altıgen/);
  });
});

describe('Hazırla: tetikler ve yanıtlar', () => {
  it('düşman erişime girince tek saldırı (tepki harcanır, Extra Attack yok), yürüyüş sürer', () => {
    let s = field({ A: o(3, 3), B: o(8, 3), C: o(2, 6) }, { attacksPerAction: 2 });
    s = endA(ok(ready(s, { trigger: 'erisime-girer', response: { kind: 'attack', option: sword } })).state);
    const r = ok(moveB(s, o(4, 3)));
    const atk = of(r.events, 'attack_resolved').filter((e) => e.actorId === 'A');
    expect(atk).toHaveLength(1);
    expect(atk[0]?.ready).toBe(true);
    expect(atk[0]?.opportunity).toBeUndefined();
    expect(of(r.events, 'reaction_used').map((e) => e.trigger)).toEqual(['ready']);
    expect(of(r.events, 'ready_released')).toHaveLength(1);
    expect(A(r.state).readied).toBeUndefined();
    expect(A(r.state).economy.reaction).toBe(true);
    expect((r.state.combatants.B as Combatant).pos).toEqual(o(4, 3));
  });
  it('seçilen altıgene girince; başka altıgende tetiklenmez', () => {
    let s = field({ A: o(3, 3), B: o(9, 3), C: o(2, 6) });
    s = endA(ok(ready(s, { trigger: 'altigene-girer', hex: o(6, 3), response: { kind: 'attack', option: bow } })).state);
    expect(of(ok(moveB(s, o(9, 5))).events, 'ready_released')).toHaveLength(0);
    expect(of(ok(moveB(s, o(6, 3))).events, 'ready_released')).toHaveLength(1);
  });
  it('30 ft içine girince (mesafe); dışarıda kalırsa tetiklenmez', () => {
    let s = field({ A: o(1, 3), B: o(13, 3), C: o(0, 6) });
    s = endA(ok(ready(s, { trigger: 'yakina-gelir', response: { kind: 'attack', option: bow } })).state);
    expect(of(ok(moveB(s, o(10, 3))).events, 'ready_released')).toHaveLength(0);
    expect(of(ok(moveB(s, o(7, 3))).events, 'ready_released')).toHaveLength(1);
  });
  it('düşman saldırınca (dosta saldırı), büyü yapınca ve hareketini bitirince', () => {
    // Dosta saldırı: B, C'ye saldırır → A (yay) hazırlanan saldırıyı yapar.
    let s = field({ A: o(3, 3), B: o(8, 3), C: o(8, 4) });
    s = endA(ok(ready(s, { trigger: 'dosta-saldirir', response: { kind: 'attack', option: bow } })).state);
    const hit = ok(execute(s, { type: 'attack', actorId: 'B', targetId: 'C', option: sword }, GM, pad()));
    expect(of(hit.events, 'ready_released')).toHaveLength(1);
    // Bana saldırı tetiği dosta saldırıda tetiklenmez.
    let s2 = field({ A: o(3, 3), B: o(8, 3), C: o(8, 4) });
    s2 = endA(ok(ready(s2, { trigger: 'bana-saldirir', response: { kind: 'attack', option: bow } })).state);
    expect(of(ok(execute(s2, { type: 'attack', actorId: 'B', targetId: 'C', option: sword }, GM, pad())).events, 'ready_released')).toHaveLength(0);
    // Büyü: B Fire Bolt yapar.
    let s3 = field({ A: o(3, 3), B: o(8, 3), C: o(2, 6) }, {}, { spellNames: ['Fire Bolt'], spellAttack: 5, spellSaveDc: 13 });
    s3 = endA(ok(ready(s3, { trigger: 'buyu-yapar', response: { kind: 'attack', option: bow } })).state);
    expect(of(ok(execute(s3, { type: 'cast_spell', actorId: 'B', spellName: 'Fire Bolt', targetId: 'C' }, GM, pad())).events, 'ready_released')).toHaveLength(1);
    // Hareket bitti.
    let s4 = field({ A: o(3, 3), B: o(10, 3), C: o(2, 6) });
    s4 = endA(ok(ready(s4, { trigger: 'hareket-eder', response: { kind: 'attack', option: bow } })).state);
    expect(of(ok(moveB(s4, o(9, 3))).events, 'ready_released')).toHaveLength(1);
  });
  it('yalnız seçilen yaratık tetikler (sourceId)', () => {
    let s = field({ A: o(3, 3), B: o(10, 3), C: o(2, 6) });
    s = endA(ok(ready(s, { trigger: 'hareket-eder', sourceId: 'B', response: { kind: 'attack', option: bow } })).state);
    expect(A(s).readied?.sourceId).toBe('B');
    expect(err(ready(field({ A: o(3, 3), B: o(10, 3), C: o(2, 6) }), { trigger: 'hareket-eder', sourceId: 'C', response: { kind: 'attack', option: bow } }))).toMatch(/düşman/);
  });
  it('hareket yanıtı: hızın kadar, turun hareketinden düşmez; yürüyen dolu altıgenden geçmez', () => {
    let s = field({ A: o(3, 3), B: o(8, 3), C: o(2, 6) });
    s = endA(ok(ready(s, { trigger: 'erisime-girer', response: { kind: 'move', to: o(1, 1) } })).state);
    const used = A(s).movementUsed;
    const r = ok(moveB(s, o(4, 3)));
    const mv = of(r.events, 'moved').find((e) => e.actorId === 'A');
    expect(mv?.reaction).toBe(true);
    expect(A(r.state).pos).toEqual(o(1, 1));
    expect(A(r.state).movementUsed).toBe(used);
  });
  it('kancasız Rng önerisi kullan; karar kancası reddederse hazırlık sürer ve tepki harcanmaz', () => {
    let s = field({ A: o(3, 3), B: o(8, 3), C: o(2, 6) });
    s = endA(ok(ready(s, { trigger: 'erisime-girer', response: { kind: 'attack', option: sword } })).state);
    const rng = Object.assign(pad(), { react: () => null });
    const r = ok(moveB(s, o(4, 3), rng));
    expect(of(r.events, 'ready_released')).toHaveLength(0);
    expect(A(r.state).readied).toBeDefined();
    expect(A(r.state).economy.reaction).toBe(false);
  });
  it('sonraki turunun başında biter (ready_lapsed turnStart)', () => {
    let s = field({ A: o(3, 3), B: o(10, 3), C: o(2, 6) });
    s = endA(ok(ready(s, { trigger: 'erisime-girer', response: { kind: 'attack', option: sword } })).state);
    s = ok(execute(s, { type: 'end_turn', actorId: 'B' }, GM, pad())).state;
    const r = ok(execute(s, { type: 'end_turn', actorId: 'C' }, { playerId: 'p2', isGm: false }, pad()));
    expect(of(r.events, 'ready_lapsed').map((e) => e.reason)).toEqual(['turnStart']);
    expect(A(r.state).readied).toBeUndefined();
  });
  it('görülmeyen (gizlenmiş) tetikleyen tetiklemez (algılanabilir)', () => {
    let s = field({ A: o(3, 3), B: o(8, 3), C: o(2, 6) });
    s = endA(ok(ready(s, { trigger: 'erisime-girer', response: { kind: 'attack', option: sword } })).state);
    const hidden = { ...s, combatants: { ...s.combatants, B: { ...(s.combatants.B as Combatant), hidden: { dc: 20 } } } } as BattleState;
    expect(readyFires(withB(hidden, o(4, 3)), A(hidden), { olay: 'adim', sourceId: 'B', from: o(5, 3) })).toBe(false);
    expect(readyFires(withB(s, o(4, 3)), A(s), { olay: 'adim', sourceId: 'B', from: o(5, 3) })).toBe(true);
  });
});
const withB = (s: BattleState, p: Offset): BattleState => ({ ...s, combatants: { ...s.combatants, B: { ...(s.combatants.B as Combatant), pos: p } } });

describe('Hazırla: büyü (R2)', () => {
  it('eylem süreli olmayan büyü hazırlanamaz; slot hazırlarken harcanır, tutma konsantrasyonu', () => {
    const s = field({ A: o(3, 3), B: o(8, 3), C: o(2, 6) }, caster);
    expect(err(ready({ ...s, combatants: { ...s.combatants, A: { ...A(s), spellNames: ['Shield'] } } }, { trigger: 'saldirir', response: { kind: 'spell', spellName: 'Shield' } }))).toMatch(/eylem/);
    const r = ok(ready(s, { trigger: 'saldirir', response: { kind: 'spell', spellName: 'Guiding Bolt' } }));
    expect(of(r.events, 'slot_spent')).toHaveLength(1);
    expect(A(r.state).spellSlots[0]).toBe(1);
    expect(A(r.state).concentration?.spell).toBe('ready:Guiding Bolt');
  });
  it('tetik gelmezse slot geri gelmez; tur başında konsantrasyon da biter', () => {
    let s = field({ A: o(3, 3), B: o(10, 3), C: o(2, 6) }, caster);
    s = endA(ok(ready(s, { trigger: 'saldirir', response: { kind: 'spell', spellName: 'Guiding Bolt' } })).state);
    s = ok(execute(s, { type: 'end_turn', actorId: 'B' }, GM, pad())).state;
    s = ok(execute(s, { type: 'end_turn', actorId: 'C' }, { playerId: 'p2', isGm: false }, pad())).state;
    expect(A(s).readied).toBeUndefined();
    expect(A(s).concentration).toBeNull();
    expect(A(s).spellSlots[0]).toBe(1);
  });
  it('salınınca hedef seçilir, slot yeniden düşmez; konsantrasyonsuz büyüde tutma biter', () => {
    let s = field({ A: o(3, 3), B: o(8, 3), C: o(8, 4) }, caster);
    s = endA(ok(ready(s, { trigger: 'saldirir', response: { kind: 'spell', spellName: 'Guiding Bolt' } })).state);
    const asked: string[][] = [];
    const rng = Object.assign(pad(), { react: (req: { options: Array<{ choices?: Array<{ id: string }> }> }) => { asked.push((req.options[0]?.choices ?? []).map((c) => c.id)); return { option: 'ready', choice: 'B' }; } });
    const r = ok(execute(s, { type: 'attack', actorId: 'B', targetId: 'C', option: sword }, GM, rng));
    expect(asked[0]).toContain('B');
    expect(of(r.events, 'ready_released')).toHaveLength(1);
    expect(of(r.events, 'attack_resolved').some((e) => e.actorId === 'A' && e.targetId === 'B' && /Guiding Bolt/.test(e.label))).toBe(true);
    expect(of(r.events, 'slot_spent').filter((e) => e.actorId === 'A')).toHaveLength(0);
    expect(A(r.state).spellSlots[0]).toBe(1);
    expect(A(r.state).concentration).toBeNull();
  });
  it('konsantrasyonlu büyü salınınca tek konsantrasyon (büyünün kendisi)', () => {
    let s = field({ A: o(3, 3), B: o(8, 3), C: o(8, 4) }, caster);
    s = endA(ok(ready(s, { trigger: 'saldirir', response: { kind: 'spell', spellName: 'Bless' } })).state);
    const rng = Object.assign(pad(), { react: (req: { options: Array<{ choices?: Array<{ id: string }> }> }) => ({ option: 'ready', choice: req.options[0]?.choices?.find((c) => c.id === 'C')?.id ?? req.options[0]?.choices?.[0]?.id }) });
    const r = ok(execute(s, { type: 'attack', actorId: 'B', targetId: 'C', option: sword }, GM, rng));
    expect(of(r.events, 'ready_released')).toHaveLength(1);
    expect(A(r.state).concentration?.spell).toBe('Bless');
  });
  it('tutma konsantrasyonu bozulursa büyü etkisiz dağılır (tetiklenmez, ready_lapsed)', () => {
    let s = field({ A: o(3, 3), B: o(8, 3), C: o(2, 6) }, caster);
    s = ok(ready(s, { trigger: 'saldirir', response: { kind: 'spell', spellName: 'Guiding Bolt' } })).state;
    const broken = applyEvents(s, [{ type: 'concentration_ended', actorId: 'A', label: 'CON save' }]);
    expect(readyFires(broken, A(broken), { olay: 'saldiri', sourceId: 'B', targetId: 'C' })).toBe(false);
    expect(readyCleanupEvents(broken).map((e) => (e as Extract<BattleEvent, { type: 'ready_lapsed' }>).reason)).toEqual(['concentration']);
  });
});

describe('Hazırla: tepki çakışması ve kapılar', () => {
  it('fırsat saldırısı ile aynı tepki hakkı: önce tetiklenen (fırsat saldırısı) harcar', () => {
    let s = field({ A: o(3, 3), B: o(4, 3), C: o(0, 6) });
    s = endA(ok(ready(s, { trigger: 'hareket-eder', response: { kind: 'attack', option: bow } })).state);
    const r = ok(moveB(s, o(8, 3)));
    expect(of(r.events, 'reaction_used').filter((e) => e.actorId === 'A').map((e) => e.trigger)).toEqual(['leave']);
    expect(of(r.events, 'ready_released')).toHaveLength(0);
  });
  it('Incapacitated hazırlayamaz; hazırlık Incapacitated olunca biter', () => {
    const s = field({ A: o(3, 3), B: o(8, 3), C: o(2, 6) });
    const inc = ok(execute(s, { type: 'set_condition', targetId: 'A', condition: 'Incapacitated', present: true }, GM, scripted())).state;
    expect(err(ready(inc, { trigger: 'saldirir', response: { kind: 'attack', option: sword } }))).toMatch(/Aksiyon yapamaz/);
    const rd = ok(ready(s, { trigger: 'saldirir', response: { kind: 'attack', option: sword } })).state;
    const r = ok(execute(rd, { type: 'set_condition', targetId: 'A', condition: 'Stunned', present: true }, GM, scripted()));
    expect(of(r.events, 'ready_lapsed').map((e) => e.reason)).toEqual(['incapacitated']);
  });
  it('Time Stop sürerken başkasının hazırlığı tetiklenmez', () => {
    let s = field({ A: o(3, 3), B: o(8, 3), C: o(2, 6) });
    s = endA(ok(ready(s, { trigger: 'erisime-girer', response: { kind: 'attack', option: sword } })).state);
    const ts = { ...s, timeStop: { actorId: 'B', left: 2 } } as BattleState;
    expect(readyFires(withB(ts, o(4, 3)), A(ts), { olay: 'adim', sourceId: 'B', from: o(5, 3) })).toBe(false);
  });
  it('ele geçirilmiş beden ve kontrollü binek hazırlayamaz; Wild Shape biçiminde büyü değil saldırı hazırlanır', () => {
    expect(possessionCommandProblem(mk('X', { effects: [{ id: 'possessed', name: 'Ele geçirildi', sourceId: 'G', possessed: true }] as Combatant['effects'] }), 'ready')).toBeTruthy();
    expect(possessionCommandProblem(mk('G', { possessing: 'X' } as Partial<Combatant>), 'ready')).toBeTruthy();
    expect(controlledCommandProblem(mk('M'), { type: 'ready', actorId: 'M', trigger: 'saldirir', response: { kind: 'move', to: o(1, 1) } })).toMatch(/Dash, Disengage ya da Dodge/);
    const shaped = field({ A: o(3, 3), B: o(8, 3), C: o(2, 6) }, { ...caster, shape: {} as Combatant['shape'] });
    expect(err(ready(shaped, { trigger: 'saldirir', response: { kind: 'spell', spellName: 'Fire Bolt' } }))).toMatch(/Wild Shape/);
    expect(ready(shaped, { trigger: 'saldirir', response: { kind: 'attack', option: sword } }).ok).toBe(true);
  });
  it('dışarıdan gönderilen salma komutu reddedilir', () => {
    const s = field({ A: o(3, 3), B: o(8, 3), C: o(2, 6) }, caster);
    expect(err(execute(s, { type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetId: 'B', fromReady: true }, P1, pad()))).toMatch(/tetikle/);
  });
});

describe('Hazırla: replay ve kayıt', () => {
  it('olaylar baştan oynatılınca aynı durum; kayıt sürümü 24 yüklenir', () => {
    const s0 = field({ A: o(3, 3), B: o(8, 3), C: o(2, 6) }, caster);
    const events: BattleEvent[] = [{ type: 'battle_started', state: s0 }];
    let s = s0;
    const run = (r: R) => { const x = ok(r); events.push(...x.events); s = x.state; };
    run(ready(s, { trigger: 'erisime-girer', response: { kind: 'spell', spellName: 'Fire Bolt' } }));
    run(execute(s, { type: 'end_turn', actorId: 'A' }, P1, pad()));
    run(moveB(s, o(4, 3)));
    expect(of(events, 'ready_released')).toHaveLength(1);
    expect(replay(events)).toEqual(s);
    const loaded = restoreSession(JSON.stringify({ version: 24, savedAt: '', events }));
    expect(loaded.ok).toBe(true);
  });
});
