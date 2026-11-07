/**
 * Kuyruk P11 (kural sürümü 42): ek paket büyü yapımı genişletmeleri. `spells.ts` yapım girişi (`executeCastPlain`)
 * ve `commands.ts` `spell_followup` buradan geçer; paket ya da ilgili etki yoksa null (eski yol aynen).
 * - Bekleyen büyü (`buyuSakla`): `cast_spell.store` slotu ve eylemi harcar, büyü yapılmaz; süren etki `storedSpell`.
 *   Ateşleme `spell_followup` `choice: 'sakli'` (maliyet ilkelde): büyü aynı slot seviyesiyle yeniden slot harcamadan
 *   (geçici +1 slot hilesi: `slot_spent.remaining` eski sayıyı yazar; replay aynı) çalışır.
 * - Çalınan büyü (`grantSpell`, `buyuIptal.calar`) ve kopya (`buyuVer.kopya.enCokSeviye`): bilinmeyen büyü slotsuz
 *   (bir kez / kaynakla); geçici `spellNames` + `atWill`.
 * - Yalnız kendine (`buyuVer.yalnizKendine`): bedava kaynakla yapım yalnız kendine; başkasına slotla.
 * - Konsantrasyonsuz (`buyuVer.konsantrasyonsuz` listedeki büyüler; `buyuDegisimi.konsantrasyonsuz` kaynakla):
 *   konsantrasyon başlamaz, etkiler ve alanlar büyünün süresi kadar (`until`); çağrı yapan büyüde uygulanmaz.
 * - Çağrıdan çıkış (`buyuDegisimi.cikisCagri`): büyü sahibinin paket çağrısının altıgeninden (menzil, görüş).
 * Saf; zar `rng` ile.
 */
import { spells, type Spell } from '../../data';
import { fail, finish, type CommandResult } from '../common';
import { freeCastResource } from '../economy';
import { spendSlot } from '../slots';
import type { ActiveEffect, BattleEvent, BattleState, Combatant, Command } from '../types';
import { canPay, flatNum, val } from './core';
import { p11On, payEvents, prims } from './p11';
import { p12On } from './p12surum';
import { BOOK, bookHex, hasBook } from './p12core';

type CastCommand = Extract<Command, { type: 'cast_spell' }>;
type Run = (state: BattleState, actor: Combatant, cmd: CastCommand) => CommandResult;

const withActor = (state: BattleState, a: Combatant): BattleState => ({ ...state, combatants: { ...state.combatants, [a.id]: a } });
const listed = (p: Record<string, unknown>, name: string) => Array.isArray(p.buyular) && (p.buyular as string[]).includes(name);
const STORED = (actorId: string) => `pk-sakli:${actorId}`;

/** Büyü yapımı (paket genişletmeleri). null: uygulanmaz, çağıran eski yolu sürdürür. */
export function paketCast(state: BattleState, actor: Combatant, cmd: CastCommand, run: Run): CommandResult | null {
  if (!p11On(state)) return null;
  const spell = spells.find((s) => s.name === cmd.spellName);
  if (!spell) return null;
  const hasPaket = !!actor.paket;
  const grant = actor.effects?.find((e) => e.grantSpell?.spellName === spell.name);
  if (!hasPaket && !grant) return null;
  // 1) Bekleyen büyü: sakla.
  if (cmd.store) return storeSpell(state, actor, cmd, spell);
  let a = actor;
  const pre: BattleEvent[] = [];
  // 2) Bilinmeyen büyü: çalınan büyü ya da kopya (slotsuz). Kuyruk P12 (sürüm 43+): rastgele listeden verilen (`grantSpell`)
  // bilinen büyü de slotsuz.
  if (!a.spellNames.includes(spell.name) || (grant && p12On(state))) {
    if (grant) {
      pre.push({ type: 'effect_ended', targetId: a.id, effectId: grant.id, name: grant.name, reason: 'used' });
    } else {
      const k = prims(a, 'buyuVer').find((x) => {
        const kop = x.p.kopyaEnCokSeviye as number | undefined;
        return kop !== undefined && spell.level <= kop && spell.level > 0 && canPay(a, x.p);
      });
      if (!k) return null;
      pre.push(...payEvents(state, a, k.feat, k.p, k.i));
    }
    a = { ...a, spellNames: [...a.spellNames, spell.name], atWill: { ...a.atWill, [spell.name]: 'any' } };
    cmd = { ...cmd, slotLevel: undefined };
  }
  // 3) Yalnız kendine bedava yapım: başkasına yöneltilirse bedava kaynak kapatılır (slotla yapılır).
  if (a.pkSelfOnly?.includes(spell.name) && cmd.slotLevel === undefined) {
    const ts = [...(cmd.targetIds ?? []), ...(cmd.targetId ? [cmd.targetId] : [])];
    const free = freeCastResource(a, spell.name, undefined);
    if (free && ts.some((x) => x !== a.id)) a = { ...a, resources: { ...a.resources, [free]: 0 } };
  }
  // 4) Çağrıdan çıkış. Kuyruk P12 (sürüm 43+): büyü kitabının altıgeninden (`buyuDegisimi.kitapCikis`).
  if (cmd.originId && cmd.originId === BOOK(a.id) && p12On(state)) {
    const at = hasBook(a) ? bookHex(state, a) : null;
    if (!at) return fail('Büyü kitabı yok.');
    a = { ...a, pos: at };
  } else if (cmd.originId) {
    const s = state.combatants[cmd.originId];
    const ok = prims(a, 'buyuDegisimi').some((x) => x.p.cikisCagri === true);
    if (!ok || !s || s.summon?.by !== a.id || s.summon.gone || !s.pos) return fail('Büyü bu yaratıktan çıkamaz.');
    a = { ...a, pos: s.pos };
  }
  const changed = a !== actor;
  const r = run(changed ? withActor(state, a) : state, a, cmd);
  if (!r.ok) return r;
  // Yalnız kendine kapatması gerçek kaynağı silmez: olaylar gerçek durumda yeniden uygulanır.
  const events = [...pre, ...noConcentration(state, actor, spell, r.events)];
  return finish(state, events);
}

/** Konsantrasyonsuz yapım (paket): konsantrasyon olayı düşer, etkiler/alanlar süreli olur. */
function noConcentration(state: BattleState, actor: Combatant, spell: Spell, events: BattleEvent[]): BattleEvent[] {
  if (!spell.concentration || !events.some((e) => e.type === 'concentration_started' && e.actorId === actor.id)) return events;
  if (events.some((e) => e.type === 'summoned')) return events;
  const byList = prims(actor, 'buyuVer').some((x) => x.p.konsantrasyonsuz === true && listed(x.p, spell.name));
  const paid = byList ? null : prims(actor, 'buyuDegisimi').find((x) => x.p.konsantrasyonsuz === true && (!x.p.okul || x.p.okul === spell.school)
    && (x.p.enCokSeviye === undefined || spell.level <= flatNum(x.p.enCokSeviye, actor)) && canPay(actor, x.p));
  if (!byList && !paid) return events;
  const rounds = spell.mechanics.effect?.rounds ?? spell.mechanics.zone?.rounds ?? 10;
  const until = state.round + rounds - 1;
  const out = events.filter((e) => !(e.type === 'concentration_started' && e.actorId === actor.id)).map((e): BattleEvent => {
    if (e.type === 'effect_added' && e.effect.concentration === spell.name) {
      const { concentration: _c, ...rest } = e.effect;
      return { ...e, effect: { ...rest, until: rest.until ?? until } as ActiveEffect };
    }
    if (e.type === 'zone_created' && e.zone.concentration === spell.name) {
      const { concentration: _c, ...rest } = e.zone;
      return { ...e, zone: { ...rest, until: rest.until ?? until } };
    }
    return e;
  });
  return [...(paid ? payEvents(state, actor, paid.feat, paid.p, paid.i) : []), ...out,
    { type: 'map_note', text: `${actor.name}: ${spell.name} konsantrasyonsuz (${rounds} tur)` }];
}

/** Bekleyen büyü: slot ve eylem (economy) harcanır, büyü saklanır. */
function storeSpell(state: BattleState, actor: Combatant, cmd: CastCommand, spell: Spell): CommandResult {
  const k = prims(actor, 'buyuSakla').find((x) => canPay(actor, x.p) && (x.p.enCokSeviye === undefined || spell.level <= flatNum(x.p.enCokSeviye, actor)));
  if (!k) return fail('Büyü saklanamaz (özellik ya da kullanım yok).');
  if (!actor.spellNames.includes(spell.name)) return fail('Bu büyüyü bilmiyor.');
  if (actor.effects?.some((e) => e.storedSpell)) return fail('Zaten saklı bir büyü var.');
  const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name);
  if (!slot.ok) return slot;
  const cost = ({ eylem: 'action', bonus: 'bonus', tepki: 'reaction', serbest: 'free' } as const)[(val<string>(k.p, 'ateslemeEylemi') ?? 'bonus') as 'bonus'] ?? 'bonus';
  const sure = k.p.sure === undefined ? undefined : flatNum(k.p.sure, actor);
  return finish(state, [...slot.events, ...payEvents(state, actor, k.feat, k.p, k.i),
    { type: 'effect_added', targetId: actor.id, effect: { id: STORED(actor.id), name: `${(k.p.ad as string | undefined) ?? k.feat.ad}: ${spell.name}`, sourceId: actor.id,
      storedSpell: { spellName: spell.name, slotLevel: slot.slotLevel, cost, ...(k.p.dostTetikler === true && p12On(state) ? { allies: true } : {}) }, icon: '⏳', ...(sure ? { until: state.round + sure - 1 } : {}) } },
    { type: 'map_note', text: `${actor.name}: ${spell.name} saklandı` }]);
}

/** Bekleyen büyünün ateşlenmesi (`spell_followup` `choice: 'sakli'`). */
export function fireStored(state: BattleState, actor: Combatant, cmd: { targetId?: string; targetHex?: { col: number; row: number } }, run: Run): CommandResult {
  const fx = actor.effects?.find((e) => e.storedSpell);
  if (!fx?.storedSpell) return fail('Saklı büyü yok.');
  const { spellName, slotLevel } = fx.storedSpell;
  // Slot önceden harcandı: geçici +1 slot; olay eski sayıyı yazar (durum değişmez).
  const slots = [...actor.spellSlots];
  if (slotLevel) slots[slotLevel - 1] = (slots[slotLevel - 1] ?? 0) + 1;
  const a: Combatant = { ...actor, spellSlots: slots, spellNames: actor.spellNames.includes(spellName) ? actor.spellNames : [...actor.spellNames, spellName] };
  const r = run(withActor(state, a), a, { type: 'cast_spell', actorId: actor.id, spellName, ...(slotLevel ? { slotLevel } : {}),
    ...(cmd.targetId ? { targetId: cmd.targetId } : {}), ...(cmd.targetHex ? { targetHex: cmd.targetHex } : {}) });
  if (!r.ok) return r;
  return finish(state, [{ type: 'effect_ended', targetId: actor.id, effectId: fx.id, name: fx.name, reason: 'used' }, ...r.events]);
}

export const storedCost = (actor: Combatant): 'action' | 'bonus' | 'reaction' | 'free' | null => actor.effects?.find((e) => e.storedSpell)?.storedSpell?.cost ?? null;

/**
 * Kuyruk P12: büyünün çıkabileceği noktalar (arayüz seçici ve yapay zekâ adayları): paket çağrıları (`cikisCagri`) ve
 * büyü kitabı (`kitapCikis`, sürüm 43+; kitap büyücünün elindeyse aday değil).
 */
export function castOrigins(state: BattleState, actor: Combatant): Array<{ id: string; name: string; pos: { col: number; row: number } }> {
  const out = summonOrigins(state, actor).map((c) => ({ id: c.id, name: c.name, pos: c.pos as { col: number; row: number } }));
  const book = p12On(state) && hasBook(actor) ? state.map?.objects?.find((o) => o.id === BOOK(actor.id)) : undefined;
  const at = book ? bookHex(state, actor) : null;
  if (book && at && book.carriedBy !== actor.id) out.push({ id: book.id, name: 'Büyü kitabı', pos: at });
  return out;
}

/** Kuyruk P12: dost tetiğiyle saklı büyü (`buyuSakla.dostTetikler`): saklayan aynı tarafta, ayakta ve etkide `allies`. */
export function allyStoredOwner(state: BattleState, actor: Combatant, sourceId: string | undefined): Combatant | null | 'yok' {
  if (!sourceId || sourceId === actor.id) return null;
  const o = state.combatants[sourceId];
  if (!p12On(state) || !o || o.side !== actor.side || o.hp <= 0 || !o.effects?.some((e) => e.storedSpell?.allies)) return 'yok';
  return o;
}

/** Kuyruk K58 G8: büyünün çıkabileceği çağrılar (paket `buyuDegisimi.cikisCagri`; arayüz seçici ve yapay zekâ adayları). */
export function summonOrigins(state: BattleState, actor: Combatant): Combatant[] {
  if (!prims(actor, 'buyuDegisimi').some((x) => x.p.cikisCagri === true)) return [];
  return Object.values(state.combatants).filter((c) => c.summon?.by === actor.id && !c.summon.gone && !!c.pos && c.hp > 0);
}
