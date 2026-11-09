/**
 * Kuyruk E2: bağlı büyülerin gerçek motordan doğrulanması (yalnız test ve `scripts/e2-dogrula.ts`; uygulama içe aktarmaz).
 * Her büyü açık haritada gerçek `cast_spell` komutuyla (birkaç hedefleme denemesi) dökülür; çıkan olaylar `fxShots`, sonraki
 * durum `groundFx` ile çizime çevrilir ve büyünün beklenen E2 anahtarı (sprite/simge/ton) çıktıda aranır. Tepki büyüleri motorun
 * tepki olayıyla (`reaction_used`, ad = büyü adı; `src/battle/create.ts` tepki büyüleri) sınanır.
 */
import { applyEvents, execute, startBattle } from '../../battle';
import type { BattleEvent, BattleState, Combatant, Command } from '../../battle';
import { mk, P1, sword } from '../../battle/fixtures';
import { spells } from '../../data';
import type { Spell } from '../../data/types';
import { seededRng } from '../../rules/dice';
import type { Offset } from '../../rules/hex';
import { effectIcons } from '../effectsView';
import { B, fxShots, groundFx, simgeSprite, SPELL_FX, FX, alanOf, type FxShot } from './fxPlan';

const OPEN = Array.from({ length: 11 }, () => '.'.repeat(21));
const o = (col: number, row: number): Offset => ({ col, row });
const POS: Record<string, Offset> = { A: o(6, 5), C: o(7, 5), B: o(9, 5), D: o(9, 6), N: o(5, 5), E: o(6, 4), F: o(6, 6) };

export function field(spell: Spell): BattleState {
  const A = mk('A', { ownerId: 'p1', level: 20, hp: 80, maxHp: 80, spellNames: [spell.name], spellAttack: 12, spellSaveDc: 19, spellMod: 5,
    spellSlots: [4, 4, 4, 4, 4, 4, 4, 4, 4], modifiers: { str: 0, dex: 2, con: 2, int: 5, wis: 5, cha: 5 } });
  const C = mk('C', { ownerId: 'p1', hp: 3, maxHp: 30, conditions: ['Poisoned', 'Charmed'] });
  const Bn = mk('B', { side: 'enemies', ac: 5, hp: 300, maxHp: 300 });
  const D = mk('D', { side: 'enemies', ac: 5, hp: 300, maxHp: 300 });
  // Bitişik düşman (dokunma büyüleri; canavar türü hayvan), ölmekte olan ve ölü dost (Spare the Dying, Revivify).
  const N = mk('N', { side: 'enemies', ac: 5, hp: 300, maxHp: 300, creatureType: 'beast' } as Partial<Combatant>);
  const E = mk('E', { ownerId: 'p1', hp: 0, maxHp: 30, life: 'dying' } as Partial<Combatant>);
  const F = mk('F', { ownerId: 'p1', hp: 0, maxHp: 30, life: 'dead' } as Partial<Combatant>);
  const parts = [{ ...A, weaponOptions: [{ ...sword, weaponId: 'longsword' }] }, C, Bn, D, N, E, F];
  const { state } = startBattle('e2', 'd-z-zemin', parts, seededRng(7), { map: { id: 'volkan' } });
  const combatants = { ...state.combatants };
  for (const [id, pos] of Object.entries(POS)) combatants[id] = { ...(combatants[id] as Combatant), pos };
  combatants.F = { ...(combatants.F as Combatant), diedRound: state.round } as Combatant;
  const order = ['A', 'C', 'B', 'D', 'N', 'E', 'F'];
  return { ...state, status: 'active', order, turnIndex: 0, combatants, map: { ...(state.map as NonNullable<BattleState['map']>), tiles: OPEN, heights: undefined } } as BattleState;
}

/** Büyünün beklenen E2 anahtarları (fxPlan kurallarıyla aynı; sprite kimliği, `ton:<renk>` ya da `simge:<kimlik>`). */
export function expectedKeys(spell: Spell): string[] {
  const id = spell.id;
  const m = spell.mechanics;
  const out: string[] = [];
  const f = SPELL_FX[id];
  if (f) out.push(f.yol === 'isaret' ? `simge:${simgeSprite('isaret', f.simge)?.id}` : f.sprite!);
  const T = B as unknown as { zemin?: Record<string, string>; auraBuyu?: Record<string, { sprite: string }>; cagirRenk?: Record<string, { ton: string }>;
    koni?: Record<string, { sprite: string }>; darbeTon?: Record<string, string>; isin: Record<string, string> };
  if (T.zemin?.[id] && m.zone) out.push(`zemin:${T.zemin[id]}`);
  // Kuyruk E4b: duvar bağlaması (`duvar[<id>]`; sürdüren alan duvar parçası olarak çizilir).
  const D = (B.duvar as Record<string, string>)[id];
  if (D && m.zone) out.push(`duvar:${D}`);
  if (T.auraBuyu?.[id]) out.push(`aura:${T.auraBuyu[id]!.sprite}`);
  if (T.cagirRenk?.[id] && m.kind === 'summon') out.push(`ton:${T.cagirRenk[id]!.ton}`);
  const dt = m.damageType;
  const shape = spell.area?.shape;
  if (!out.length && spell.area && (m.kind === 'save' || m.kind === 'sleep') && !m.zone && dt) {
    if (shape === 'cone' && T.koni?.[dt]) out.push(`koni:${T.koni[dt]!.sprite}`);
    else if (shape === 'line' && T.isin[dt]) out.push(T.isin[dt]!);
    else if (shape !== 'cone' && shape !== 'line' && !(B.alan as Record<string, string>)[dt] && alanOf(dt)) out.push(alanOf(dt)!);
  }
  if (!out.length && (m.kind === 'attack' || m.kind === 'auto') && (spell.rangeFt ?? 0) <= 5 && dt && !(B.darbe as Record<string, string>)[dt] && T.darbeTon?.[dt]) out.push(`ton:${T.darbeTon[dt]}`);
  return out;
}

/** Çizimdeki anahtarlar: sprite kimlikleri, `ton:`, `simge:`, `koni:`, `zemin:`, `aura:`. */
function drawnKeys(shots: FxShot[], after: BattleState): Set<string> {
  const k = new Set<string>();
  for (const s of shots) {
    k.add(s.sprite.id);
    if (s.ton) k.add(`ton:${s.ton}`);
    if (s.sprite.kind === 'isaret') k.add(`simge:${s.sprite.id}`);
    if (s.cone) k.add(`koni:${s.sprite.id}`);
  }
  const g = groundFx(after);
  for (const p of g.patches) k.add(`zemin:${p.sprite.id}`);
  for (const w of g.walls) k.add(`duvar:${w.sprite.id}`);
  for (const a of g.auras) k.add(`aura:${a.sprite.id}`);
  return k;
}

/** Smite: bu tur bitişik düşmana yakın dövüş isabeti (motorun `economy.meleeHit` işareti). */
const withHit = (s: BattleState): BattleState => {
  const a = s.combatants.A as Combatant;
  return { ...s, combatants: { ...s.combatants, A: { ...a, economy: { ...a.economy, meleeHit: { targetId: 'N', critical: false } } } } };
};
const PREP: Array<[(s: BattleState) => BattleState, (s: BattleState) => Partial<Command>]> = [
  [withHit, () => ({ targetId: 'N' })],
  [withHit, () => ({})],
  [(s) => s, () => ({ targetId: 'N' })],
  [(s) => s, () => ({ targetId: 'E' })],
  [(s) => s, () => ({ targetId: 'F' })],
];
const ATTEMPTS: Array<(s: BattleState) => Partial<Command>> = [
  () => ({ targetId: 'B' }),
  (s) => ({ targetHex: s.combatants.B!.pos as Offset }),
  () => ({ targetId: 'C' }),
  () => ({ targetId: 'A' }),
  () => ({}),
  () => ({ targetHex: o(9, 4) }),
  () => ({ targetHexes: [POS.B!, o(12, 5)] }),
];

export interface Verdict { id: string; ok: boolean; how: string; expected: string[]; got?: string[] }

/** Tek büyüyü gerçek motorla döker ve beklenen anahtarı çizimde arar. */
export function verifySpell(spell: Spell): Verdict {
  const expected = expectedKeys(spell);
  if (!expected.length) return { id: spell.id, ok: false, how: 'bağlama yok', expected };
  // Tepki büyüsü: motorun tepki olayı (ad = büyü adı).
  if (spell.mechanics.reaction) {
    const s = field(spell);
    const ev: BattleEvent[] = [{ type: 'reaction_used', actorId: 'A', reaction: spell.srd, name: spell.name, trigger: 'hit' } as BattleEvent];
    const got = drawnKeys(fxShots(ev, s), applyEvents(s, ev));
    return { id: spell.id, ok: expected.some((e) => got.has(e)), how: 'tepki olayı', expected, got: [...got] };
  }
  let last: string[] = [];
  let err = '';
  const tries: Array<[(s: BattleState) => BattleState, (s: BattleState) => Partial<Command>]> = [...ATTEMPTS.map((a) => [(s: BattleState) => s, a] as [(s: BattleState) => BattleState, typeof a]), ...PREP];
  for (let i = 0; i < tries.length; i++) {
    const [prep, aim] = tries[i]!;
    const s = prep(field(spell));
    const cmd = { type: 'cast_spell', actorId: 'A', spellName: spell.name, slotLevel: Math.max(1, spell.level) || undefined, ...aim(s) } as Command;
    let r;
    try { r = execute(s, cmd, P1, seededRng(11 + i)); } catch (e) { err = String(e); continue; }
    if (!r.ok) { err = r.error; continue; }
    let after = applyEvents(s, r.events);
    let got = drawnKeys(fxShots(r.events, s), after);
    // Süreli büyü: sürdürme (Produce Flame fırlatma) ve verilen nefes (Dragon's Breath: dost C nefesini düşmana üfler).
    if (!expected.some((e) => got.has(e))) {
      const follow: Command[] = [{ type: 'spell_followup', actorId: 'A', targetId: 'B' } as Command,
        { type: 'breath_weapon', actorId: String((cmd as { targetId?: string }).targetId ?? 'A'), shape: 'cone', targetHex: POS.B! } as Command];
      for (const f of follow) {
        let r2;
        try { r2 = execute(after, f, P1, seededRng(31)); } catch { continue; }
        if (!r2.ok) continue;
        const g2 = drawnKeys(fxShots(r2.events, after), applyEvents(after, r2.events));
        if (expected.some((e) => g2.has(e))) { after = applyEvents(after, r2.events); got = g2; break; }
      }
    }
    last = [...got];
    void after;
    if (expected.some((e) => got.has(e))) return { id: spell.id, ok: true, how: `cast_spell ${JSON.stringify(aim(s))}${i >= ATTEMPTS.length && i < ATTEMPTS.length + 2 ? ' (isabet sonrası)' : ''}`, expected, got: last };
  }
  return { id: spell.id, ok: false, how: last.length ? 'döküldü, anahtar çizilmedi' : `dökülemedi (${err})`, expected, got: last };
}

/** Bütün bağlı büyüler (E2 tabloları + genel koni/çizgi/ek patlama/dokunuş kuralları). */
export function verifyAll(): Verdict[] {
  return spells.filter((s) => expectedKeys(s).length > 0).map(verifySpell).sort((a, b) => a.id.localeCompare(b.id));
}

/** Kayıtlı sprite'lar (testte dosya kontrolü için). */
export const fxIds = (): string[] => Object.keys(FX);

/** Rozet: büyü dökülünce bir savaşçıda adı `rozetBuyu`'ya eşlenen süren etki ya da buff kalır (sayı oku simgesi çizilir). */
export function verifyBadge(spell: Spell): Verdict {
  const ad = (B as unknown as { rozetBuyu?: Record<string, string> }).rozetBuyu?.[spell.id];
  if (!ad) return { id: spell.id, ok: false, how: 'rozet yok', expected: [] };
  const all: Array<(s: BattleState) => Partial<Command>> = [...ATTEMPTS, () => ({ targetId: 'N' })];
  for (const aim of all) {
    const s = field(spell);
    let r;
    try { r = execute(s, { type: 'cast_spell', actorId: 'A', spellName: spell.name, slotLevel: Math.max(1, spell.level) || undefined, ...aim(s) } as Command, P1, seededRng(5)); } catch { continue; }
    if (!r.ok) continue;
    const after = applyEvents(s, r.events);
    const hit = Object.values(after.combatants).some((c) => effectIcons(after, c).some((x) => x.img?.includes(`ok-${ad}`)));
    if (hit) return { id: spell.id, ok: true, how: `cast_spell ${JSON.stringify(aim(s))}`, expected: [`ok-${ad}`] };
  }
  return { id: spell.id, ok: false, how: 'etki kalmadı', expected: [`ok-${ad}`] };
}

export function verifyBadges(): Verdict[] {
  const R = (B as unknown as { rozetBuyu?: Record<string, string> }).rozetBuyu ?? {};
  return spells.filter((s) => R[s.id]).map(verifyBadge).sort((a, b) => a.id.localeCompare(b.id));
}
