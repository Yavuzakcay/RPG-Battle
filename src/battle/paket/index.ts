/**
 * Görev P0: ek paket ilkel yorumlayıcısı. Paket verisi savaşçıda (`Combatant.paket`); her ilkel mevcut bir sisteme
 * bağlanır (ikinci hesap kodu yok): düğmeler `use_feature` (`kind: 'paket'`), isabet kancası (`hitHooks.ts`), tur başı
 * ve komut sonu kancaları (`turnHooks.ts`), dosta isabet tepkisi (`registerAllyHit`), çağırma (`summoned` olayı),
 * yapay zekâ açıklayıcısı (`ai/actions.ts`; puan kuru çalıştırmayla). Tanımsız/kapalı ilkel çökmez, etkisiz kalır.
 * Saf; zar `rng` ile. Paketsiz savaşta kancalar hiçbir olay üretmez.
 */
import { gap } from '../body';
import { damageProfile as profileOf, fail, finish, type CommandResult } from '../common';
import { saveDice } from '../effectDice';
import { BEACON_K70_VERSION, beaconMax } from '../healMax';
import { saveMode } from '../durations';
import { damageEffects } from '../damage-effects';
import { saveDamage } from '../classTraits';
import { canReact, reactionUsed, registerAfterAttack, registerAllyHit, strikeApi } from '../reactions';
import { forcedMove, withArrival, type ForcedMode } from '../motion';
import { teleportEvent, teleportProblem } from '../teleport';
import { resistImmunityEvent, resistImmunityId } from '../auraCore';
import { moraleOn } from '../morale';
import { applyEvents } from '../reduce';
import { turnKey } from '../economy';
import { surfaceEvent } from '../surfaces';
import { hitEffect } from '../maprules';
import { barrierEvents } from '../barriers';
import { sizeRank } from '../forced';
import { combatantFromMonster } from '../create';
import { registerSummonRider } from '../riders';
import { registerHitHook, type HitAfter } from '../hitHooks';
import { registerCommandEnd, registerTurnStart } from '../turnHooks';
import { registerAction } from '../ai/actions';
import { bondRecallEvents } from '../heldItems';
import { p11On } from './p11';
import { castOrigins } from './p11cast';
import { spellOf } from '../features';
import { JETON_ARKETIP, JETON_YEDEK } from '../../content/ilkelSema';
import { resolveSave } from '../../rules/attack';
import { askReaction } from '../../rules/reactionChoice';
import { adjustDamage } from '../../rules/damage';
import { isIncapacitated } from '../../rules/conditions';
import { abilityModifier, type Ability } from '../../rules/abilities';
import { rollDice, rollDie, rollTag, type Rng } from '../../rules/dice';
import { distance, isInside, type Offset } from '../../rules/hex';
import { getMonster, type Monster, type MonsterAttack } from '../../data';
import type { ActiveEffect, BattleEvent, BattleState, Combatant, Command, ExtraDamage, SummonInfo, UsableFeature } from '../types';
import {
  alive, amount, canPay, costOf, dcOf, dugmeNeeds, dugmeOf, effId, flatNum, formId, formul, kosulOk, markId, passiveBody, resKey, tetikOf,
  auraSpec, p10On, p9On, usedKey, usedThisTurn, val, within, zarBody, type Dugme, type Ilkel, type PaketOzellik,
} from './core';
import './p9';
import './p10';
import './p11hooks';
import { isP12Feature, p12Execute, p12Problem } from './p12';

export { paketHex, paketTargeted, withPaket } from './core';

interface Ctx {
  actor: Combatant;
  feat: PaketOzellik;
  p: Ilkel;
  i: number;
  rng: Rng;
  targetId?: string;
  to?: Offset;
  /** İsabet edilen / öldürülen / tetikleyen yaratık. */
  hit?: Combatant;
  /** Düğmeyle mi (hedef komutta) yoksa otomatik tetikle mi. */
  manual: boolean;
}

const nameOf = (c: Ctx) => (c.p.ad as string | undefined) ?? c.feat.ad;
const untilOf = (state: BattleState, p: Ilkel): Partial<ActiveEffect> => {
  const s = val<number | 'kalici' | undefined>(p, 'sure');
  return s === 'kalici' || s === undefined ? {} : { until: state.round + s - 1 };
};
const foesOf = (state: BattleState, a: Combatant) => Object.values(state.combatants).filter((c) => alive(c) && c.side !== a.side && !c.civilian);
const alliesOf = (state: BattleState, a: Combatant) => Object.values(state.combatants).filter((c) => alive(c) && c.side === a.side && !c.civilian);
const near = (state: BattleState, a: Combatant) => (c: Combatant) => (state.map && a.pos && c.pos ? gap(state, a, c) : 0);
const ft = (p: Ilkel, f: string, c: Combatant) => flatNum(val(p, f), c);

/** Merkez altıgen etrafındaki altıgenler (yarıçap altıgen). */
function hexesAround(state: BattleState, center: Offset, r: number): Offset[] {
  if (!state.map) return [];
  const size = { cols: state.map.tiles[0]?.length ?? 0, rows: state.map.tiles.length };
  const out: Offset[] = [];
  for (let row = Math.max(0, center.row - r - 1); row <= Math.min(size.rows - 1, center.row + r + 1); row++) {
    for (let col = Math.max(0, center.col - r - 1); col <= Math.min(size.cols - 1, center.col + r + 1); col++) {
      const h = { col, row };
      if (isInside(h, size) && distance(h, center) <= r) out.push(h);
    }
  }
  return out;
}

/** İlkelin hedefleri (ya da sorun metni). */
function targetsOf(state: BattleState, c: Ctx): Combatant[] | string {
  const a = c.actor;
  const p = c.p;
  const h = val<string>(p, 'hedef');
  const menzil = p.menzilFt !== undefined || ['dost', 'dostVeyaKendi', 'dusman', 'alan'].includes(h) ? ft(p, 'menzilFt', a) : undefined;
  const yaricap = ft(p, 'yaricapFt', a);
  const cap = (list: Combatant[]) => (p.enCok !== undefined ? list.slice(0, Math.max(1, flatNum(p.enCok, a))) : list);
  const t = c.targetId ? state.combatants[c.targetId] : undefined;
  switch (h) {
    case undefined: case 'kendi': return [a];
    case 'vurulan': {
      const v = c.hit ?? t;
      if (!alive(v) || v.side === a.side) return 'Bir düşman seç.';
      if (!c.hit && !within(state, a, v, menzil)) return `${menzil} ft içinde olmalı.`;
      return [v];
    }
    case 'dusman': {
      const v = c.manual ? t : c.hit && alive(c.hit) ? c.hit : foesOf(state, a).filter((x) => within(state, a, x, menzil)).sort((x, y) => near(state, a)(x) - near(state, a)(y))[0];
      if (!alive(v) || v.side === a.side) return 'Bir düşman seç.';
      if (!within(state, a, v, menzil)) return `${menzil} ft içinde olmalı.`;
      return [v];
    }
    case 'dost': case 'dostVeyaKendi': {
      const pool = alliesOf(state, a).filter((x) => (h === 'dostVeyaKendi' || x.id !== a.id) && within(state, a, x, menzil));
      const v = c.manual ? t : pool.sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0];
      if (!v || v.life === 'dead' || v.side !== a.side) return 'Bir dost seç.';
      if (h === 'dost' && v.id === a.id) return 'Başka bir dost seç.';
      if (!within(state, a, v, menzil)) return `${menzil} ft içinde olmalı.`;
      return [v];
    }
    case 'dostlar': {
      const list = alliesOf(state, a).filter((x) => within(state, a, x, yaricap)).sort((x, y) => (x.id === a.id ? -1 : y.id === a.id ? 1 : near(state, a)(x) - near(state, a)(y)));
      return cap(list);
    }
    case 'dusmanlar': case 'bitisikDusmanlar': {
      const list = cap(foesOf(state, a).filter((x) => within(state, a, x, h === 'bitisikDusmanlar' ? 5 : yaricap)).sort((x, y) => near(state, a)(x) - near(state, a)(y)));
      return list.length ? list : 'Menzilde düşman yok.';
    }
    case 'alan': {
      const center = c.to ?? t?.pos ?? (c.manual ? undefined : c.hit?.pos ?? foesOf(state, a).sort((x, y) => near(state, a)(x) - near(state, a)(y))[0]?.pos);
      if (!center) return 'Alanın merkezini seç.';
      if (state.map && a.pos && menzil !== undefined && distance(a.pos, center) * 5 > menzil) return `${menzil} ft içinde olmalı.`;
      const r = Math.floor(yaricap / 5);
      const list = cap(foesOf(state, a).filter((x) => x.pos && distance(x.pos, center) <= r));
      return list.length ? list : 'Alanda düşman yok.';
    }
    default: return [a];
  }
}

/** Kurtulma atışı (`save_resolved` olayı; hasarlı ya da hasarsız). */
function saveEvent(state: BattleState, c: Ctx, t: Combatant, dice: string | null, type: string, half: boolean): { ev: BattleEvent; success: boolean } {
  const save = c.p.save as Record<string, unknown> | undefined;
  const ab = (save?.yetenek ?? 'con') as Ability;
  const dc = save ? dcOf(save, c.actor) : 0;
  const sv = save ? resolveSave({ extra: saveDice(t, ab), modifier: t.saves[ab], dc, mode: saveMode('normal', t, ab, c.actor) }, rollTag(c.rng, { by: t.id })) : null;
  const success = !!sv?.success;
  const roll = dice && (!success || half) ? rollDice(dice, rollTag(c.rng, { kind: 'damage', by: c.actor.id })) : { rolls: [] as number[], total: 0 };
  const raw = save ? saveDamage(t, ab, success, roll.total, half) : roll.total;
  const adj = raw > 0 ? adjustDamage(raw, type, profileOf(t)) : { amount: 0, note: null };
  const fx = damageEffects(t, adj.amount, type, false, c.rng);
  return {
    success,
    ev: { type: 'save_resolved', actorId: c.actor.id, targetId: t.id, label: nameOf(c), ability: ab, dc, mode: sv ? saveMode('normal', t, ab, c.actor) : 'normal', reasons: [],
      d20: sv?.d20?.rolls ?? [], natural: sv?.d20?.kept ?? null, total: sv?.total ?? 0, success, damageRolls: roll.rolls, rawDamage: roll.total, appliedDamage: adj.amount,
      damageType: type, damageNote: adj.note, targetHpAfter: fx.hpAfter, conditionsAdded: [], effects: fx.effects, ...(sv?.extra ? { bonusDice: sv.extra } : {}) },
  };
}

/** Bir ilkeli çalıştırır (düğme ya da otomatik tetik). */
function runPrim(state: BattleState, c: Ctx): BattleEvent[] | string {
  const { actor: a, p, rng } = c;
  const name = nameOf(c);
  const key = c.feat.key;
  const id = effId(key, c.i, a.id);
  const effect = (t: Combatant, body: Partial<ActiveEffect>, eid = id): BattleEvent =>
    ({ type: 'effect_added', targetId: t.id, effect: { ...body, id: eid, name, sourceId: a.id, ...untilOf(state, p) } as ActiveEffect });
  const out: BattleEvent[] = [];
  switch (p.tur) {
    case 'gecicCan': case 'iyilestirme': case 'hasar': case 'durumUygula': case 'isaret': case 'zarEtkisi': case 'gorunmezlik': case 'moralEtkisi': case 'zorlaHareket': case 'meydanOkuma': {
      const ts = targetsOf(state, c);
      if (typeof ts === 'string') return ts;
      for (const t of ts) {
        if (p.tur === 'gecicCan') { const n = amount(p.miktar, a, rng); if (n > 0) out.push({ type: 'temp_hp', targetId: t.id, amount: n, label: name }); }
        if (p.tur === 'iyilestirme') {
          if (t.life === 'dead') continue;
          // Kuyruk K70 (sürüm 54): Beacon of Hope altındaki hedefe en yüksek değer (tek kural `healMax.ts`).
          const n = Math.max(0, Math.min(beaconMax(state, t, formul(p.miktar, a), BEACON_K70_VERSION) ?? amount(p.miktar, a, rng), t.maxHp - t.hp));
          out.push({ type: 'healed', actorId: a.id, targetId: t.id, label: name, amount: n, targetHpAfter: t.hp + n });
          for (const d of (p.durumKaldir as string[] | undefined) ?? []) if (t.conditions.includes(d)) out.push({ type: 'condition_ended', targetId: t.id, condition: d, reason: name });
        }
        if (p.tur === 'hasar') out.push(saveEvent(state, c, t, formul(p.zar, a), p.hasarTuru as string, !!(p.save as { yari?: boolean } | undefined)?.yari).ev);
        if (p.tur === 'durumUygula') {
          const ck = `${key}#${c.i}`;
          if (t.effects?.some((e) => e.id === resistImmunityId('pk', ck, a.id))) continue;
          const foe = t.side !== a.side;
          const sv = p.save && foe ? saveEvent(state, c, t, null, '', false) : null;
          if (sv) out.push(sv.ev);
          if (sv?.success) { if (p.cesaret !== undefined) out.push(resistImmunityEvent(state, t, 'pk', ck, a, p.cesaret as number)); continue; }
          const save = p.save as Record<string, unknown> | undefined;
          out.push(effect(t, { grants: [p.durum as string], ...(p.tekrarKurtulma && save ? { repeatSave: { ability: save.yetenek as Ability, dc: dcOf(save, a) } } : {}) }));
        }
        if (p.tur === 'isaret') {
          const mid = markId(a.id, (p.id as string | undefined) ?? `${key}-${c.i}`);
          if (val<boolean>(p, 'tek')) for (const o of Object.values(state.combatants)) if (o.id !== t.id && o.effects?.some((e) => e.id === mid)) out.push({ type: 'effect_ended', targetId: o.id, effectId: mid, name, reason: 'used' });
          const av = val<string>(p, 'avantaj');
          out.push(effect(t, { icon: '◎', ...(av === 'herkes' ? { attackedAdv: true } : av === 'isaretleyen' ? { attackedAdvBy: a.id } : {}),
            // P10 (sürüm 39+): işaretlinin etkilerine karşı işaretleyenin kurtulmaları avantajlı.
            ...(p.kurtulmaAvantaji === true && p10On(state) ? { pkSaveAdvFor: a.id } : {}) }, mid));
        }
        if (p.tur === 'zarEtkisi') out.push(effect(t, zarBody(p, a)));
        // P7: meydan okuma (kurtulmalıysa başarısızlıkta).
        if (p.tur === 'meydanOkuma') {
          if (p.save) { const sv = saveEvent(state, c, t, null, '', false); out.push(sv.ev); if (sv.success) continue; }
          out.push(effect(t, { tauntBy: a.id, icon: '⚔' }));
        }
        if (p.tur === 'gorunmezlik') out.push(effect(t, { grants: ['Invisible'], ...(val<boolean>(p, 'saldirincaBiter') ? { breakOnAct: true } : {}) }));
        if (p.tur === 'moralEtkisi' && moraleOn(state) && t.moralMax !== undefined) {
          const now = t.moral ?? t.moralMax;
          const to = Math.max(0, Math.min(t.moralMax, now + flatNum(p.miktar, a)));
          if (to !== now) out.push({ type: 'moral_changed', targetId: t.id, delta: to - now, moral: to, reason: 'toparlama', byId: a.id });
        }
        if (p.tur === 'zorlaHareket' && a.pos && t.pos) {
          const lim = p.boyutSiniri as string | undefined;
          if (lim && sizeRank(t.size) > sizeRank(lim as Combatant['size'])) continue;
          if (p.save) { const sv = saveEvent(state, c, t, null, '', false); out.push(sv.ev); if (sv.success) continue; }
          const mode: ForcedMode = ({ it: 'push', cek: 'pull', yana: 'slide' } as Record<string, ForcedMode>)[val<string>(p, 'yon')] ?? 'push';
          out.push(...forcedMove(applyEvents(state, out), t.id, mode, ft(p, 'mesafeFt', a), a.id, rng, { origin: a.pos }));
          // P7: itmeden sonra yere serme.
          const moved = applyEvents(state, out).combatants[t.id];
          if (val<string>(p, 'sonrasi') === 'yereSer' && moved && moved.hp > 0 && !moved.conditions.includes('Prone')) out.push({ type: 'condition_changed', targetId: t.id, condition: 'Prone', present: true, reason: name, sourceId: a.id });
        }
      }
      return out;
    }
    // P10 (sürüm 39+): hız dosta ya da düşmana (eksi değerle yavaşlatma; düşmanda kurtulmalı).
    case 'hiz': {
      if ((val<string>(p, 'hedef') ?? 'kendi') !== 'kendi') {
        if (!p10On(state)) return [];
        const ts = targetsOf(state, c);
        if (typeof ts === 'string') return ts;
        for (const t of ts) {
          if (p.save && t.side !== a.side) { const sv = saveEvent(state, c, t, null, '', false); out.push(sv.ev); if (sv.success) continue; }
          out.push(effect(t, { speedFt: flatNum(p.artiFt, a), icon: flatNum(p.artiFt, a) < 0 ? '🐢' : '💨' }));
        }
        return out;
      }
      const body = passiveBody(p, a);
      return body ? [effect(a, body as Partial<ActiveEffect>)] : [];
    }
    case 'boyut': case 'ucus': case 'aura': case 'engeldenGec': case 'koruma': case 'algi': case 'saldirmadanSave': {
      const body = p.tur === 'aura' ? { auras: [auraSpec(p, a, c.i)] } : passiveBody(p, a);
      return body ? [effect(a, body as Partial<ActiveEffect>)] : [];
    }
    case 'bicim': {
      const body: Record<string, unknown> = {};
      if (p.acBonusu !== undefined) body.ac = flatNum(p.acBonusu, a);
      if (p.hizFt !== undefined) body.speedFt = flatNum(p.hizFt, a);
      if (p.ucusFt !== undefined) body.fly = flatNum(p.ucusFt, a);
      if (p.direncler) body.resist = p.direncler;
      if (p.ekHasar !== undefined) { body.hitDie = formul(p.ekHasar, a); if (p.hasarTuru && p.hasarTuru !== 'silah') body.hitType = p.hasarTuru; }
      if (p.saldiriAvantaji) body.attackAdv = true;
      out.push(effect(a, { ...body, icon: '✦' } as Partial<ActiveEffect>, formId(a.id, p.id as string)));
      if (p.gecicCan !== undefined) { const n = amount(p.gecicCan, a, rng); if (n > 0) out.push({ type: 'temp_hp', targetId: a.id, amount: n, label: name }); }
      return out;
    }
    case 'isinlan': {
      if (!state.map || !a.pos) return 'Işınlanma yalnızca haritalı savaşta.';
      const to = c.to;
      if (!to) return 'Varış altıgenini seç.';
      const why = teleportProblem(state, a, to, { rangeFt: ft(p, 'mesafeFt', a), sight: val<boolean>(p, 'gorus') });
      if (why) return why;
      return withArrival(state, [], [teleportEvent(a, to, name)], rng);
    }
    case 'yuzeyOlustur': {
      // P7: otomatik tetikte merkez: vurulan/öldürülen, yoksa sahibinin altıgeni.
      const center = c.to ?? c.hit?.pos ?? (c.manual ? undefined : a.pos ?? undefined);
      if (!state.map || !center) return 'Yüzeyin yerini seç.';
      if (a.pos && distance(a.pos, center) * 5 > ft(p, 'menzilFt', a)) return `${ft(p, 'menzilFt', a)} ft içinde olmalı.`;
      const hexes = hexesAround(state, center, Math.floor(ft(p, 'yaricapFt', a) / 5));
      const kind = p.yuzey as string;
      if (kind.startsWith('engel:')) {
        const s = val<number | 'kalici' | undefined>(p, 'sure');
        return barrierEvents(state, a, kind.slice(6), hexes, typeof s === 'number' ? s : undefined);
      }
      const s0 = val<number | 'kalici' | undefined>(p, 'sure');
      const evs: BattleEvent[] = [];
      if (kind !== 'alan') {
        const ev = surfaceEvent(state, kind as Parameters<typeof surfaceEvent>[1], hexes, a.id, a.side);
        // P6: verilen süre yüzeyin veri süresinin yerine (kalıcı: süresiz).
        if (ev.type === 'zone_created' && s0 !== undefined) { const { until: _u, ...z } = ev.zone; evs.push({ ...ev, zone: s0 === 'kalici' ? z : { ...z, until: state.round + s0 - 1 } }); } else evs.push(ev);
      }
      // P6: zemin etkisi (satır içi kurallı alan: tur başı/sonu/giriş, kurtulma, hasar, durum, zorlu arazi).
      const zaman = (p.zaman as string[] | undefined) ?? [];
      if (zaman.length || p.zorluArazi || p.hasar !== undefined || p.durum !== undefined || p.iyilestir !== undefined) {
        const save = p.save as Record<string, unknown> | undefined;
        const on = zaman.map((z) => (z === 'turBasi' ? 'start' : z === 'turSonu' ? 'end' : 'enter') as 'start' | 'end' | 'enter');
        const spec = {
          ...(on.length ? { on } : {}), ...(p.zorluArazi ? { difficult: 2 } : {}), ...(save ? { save: save.yetenek as Ability, ...(save.yari ? { half: true } : {}) } : {}),
          ...(p.hasar !== undefined ? { damage: formul(p.hasar, a), damageType: p.hasarTuru as string } : {}), ...(p.durum ? { conditions: [p.durum as string] } : {}),
          ...(val<string>(p, 'hedefler') === 'dusmanlar' ? { targets: 'enemies' as const } : val<string>(p, 'hedefler') === 'dostlar' ? { targets: 'allies' as const } : {}),
          ...(p.iyilestir !== undefined ? { heal: formul(p.iyilestir, a) } : {}), ground: true, icon: '◈',
        };
        let n = 1;
        while ((state.map.zones ?? []).some((z) => z.id === `pk-zemin:${a.id}:${n}`)) n++;
        evs.push({ type: 'zone_created', zone: { id: `pk-zemin:${a.id}:${n}`, spellId: `pk:${key}#${c.i}`, name, casterId: a.id, side: a.side, dc: save ? dcOf(save, a) : 0, slotLevel: 0, hexes,
          ...(s0 === undefined ? { until: state.round + 9 } : s0 === 'kalici' ? {} : { until: state.round + s0 - 1 }), spec, ...(p.hasar !== undefined ? { damage: formul(p.hasar, a) } : {}) } });
      }
      return evs;
    }
    case 'ekSaldiri': {
      const api = strikeApi();
      if (!api) return 'Saldırı yok.';
      if (val<string>(p, 'hedef') === 'dost') {
        const ally = c.manual && c.targetId ? state.combatants[c.targetId] : undefined;
        if (!ally || !alive(ally) || ally.side !== a.side || ally.id === a.id) return 'Bir dost seç.';
        if (!within(state, a, ally, ft(p, 'menzilFt', a))) return `${ft(p, 'menzilFt', a)} ft içinde olmalı.`;
        const allyName = ally.name;
        if (!canReact(ally)) return `${allyName} tepkisini kullandı.`;
        const foe = foesOf(state, ally).filter((f) => api.can(state, ally.id, f.id)).sort((x, y) => x.hp - y.hp)[0];
        if (!foe) return `${ally.name} hiçbir düşmana erişemiyor.`;
        const react = reactionUsed(ally, { id: usedKey(key, c.i), name }, 'ally', a.id);
        return [react, ...api.strike(applyEvents(state, [react]), ally.id, foe.id, rng)];
      }
      const foe = c.manual && c.targetId ? state.combatants[c.targetId]
        : foesOf(state, a).filter((f) => api.can(state, a.id, f.id)).sort((x, y) => x.hp - y.hp)[0];
      if (!foe || !alive(foe) || foe.side === a.side) return 'Bir düşman seç.';
      if (!api.can(state, a.id, foe.id)) return 'Hedef erişimde değil.';
      return api.strike(state, a.id, foe.id, rng);
    }
    case 'cagir': return summonEvents(state, c);
    // P9 (sürüm 38+): düşmanı yönet (taraf değiştirme `dominate`; türe göre süzgeç, kurtulmalı).
    // P11 (sürüm 42+): zar yarışı (karşılıklı d20 + değiştirici; elle zar dahil, zar defteri). Kazanınca hedefte işaret
    // (`pk-yaris:<sen>`, `kosul: zarYarisi`; avantajsız Sneak Attack `sneakFor`).
    case 'zarYarisi': {
      if (!p11On(state)) return [];
      const ts = targetsOf(state, c);
      if (typeof ts === 'string') return ts;
      const t = ts[0];
      if (!t) return 'Bir düşman seç.';
      const modOf = (x: Combatant, key: string | undefined) => (key && (x.skills as Record<string, number>)[key] !== undefined ? (x.skills as Record<string, number>)[key] as number
        : (x.modifiers as Record<string, number>)[key ?? 'wis'] ?? 0);
      const mine = rollDie(20, rollTag(rng, { kind: 'check', by: a.id })) + modOf(a, val<string>(p, 'beceri') ?? val<string>(p, 'yetenek'));
      const theirs = rollDie(20, rollTag(rng, { kind: 'check', by: t.id })) + modOf(t, val<string>(p, 'hedefBeceri') ?? val<string>(p, 'hedefYetenek'));
      out.push({ type: 'map_note', text: `${name}: ${a.name} ${mine} – ${t.name} ${theirs}` });
      if (mine > theirs) out.push({ type: 'effect_added', targetId: t.id, effect: { id: `pk-yaris:${a.id}`, name, sourceId: a.id, sneakFor: a.id, icon: '🔍', ...untilOf(state, p) } as ActiveEffect });
      return out;
    }
    case 'kontrolEt': {
      if (!p9On(state)) return [];
      const ts = targetsOf(state, c);
      if (typeof ts === 'string') return ts;
      const turler = typeof p.turler === 'string' ? p.turler.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean) : [];
      for (const t of ts) {
        if (turler.length && !turler.includes((t.creatureType ?? '').toLowerCase())) { if (c.manual) return 'Bu yaratık türü yönetilemez.'; continue; }
        // P10 (sürüm 39+): Incapacitated hedefte kurtulma yok.
        const helpless = p.kurtulmasiz === true && p10On(state) && isIncapacitated(t.conditions);
        if (!helpless) {
          const sv = saveEvent(state, c, t, null, '', false);
          out.push(sv.ev);
          if (sv.success) continue;
        }
        const save = p.save as Record<string, unknown>;
        out.push(effect(t, { dominate: true, icon: '♛', ...(p.tekrarKurtulma ? { repeatSave: { ability: save.yetenek as Ability, dc: dcOf(save, a) } } : {}) }));
      }
      return out;
    }
    // Kuyruk S2 (sürüm 41+): bağlı silahı ele çağır.
    case 'silahBagi': return bondRecallEvents(state, a, name);
    // P9 (sürüm 38+): zaman durdurma (Time Stop yolu).
    case 'zamanDurdur': {
      if (!p9On(state)) return [];
      const n = Math.max(1, Math.min(6, amount(p.sayi, a, rng)));
      return [{ type: 'time_stop', actorId: a.id, turns: n }];
    }
    // P7: ortak can havuzu (sahip + yarıçaptaki dostlar, en çok `enCok`).
    case 'ortakCan': {
      const list = (targetsOf(state, { ...c, p: { ...p, hedef: 'dostlar' } }) as Combatant[]).filter((x) => !x.poolId && !x.summon).slice(0, Math.max(2, flatNum(val(p, 'enCok'), a)));
      if (list.length < 2) return 'Havuza katılacak dost yok.';
      let n = Object.keys(state.hpPools ?? {}).length + 1;
      while (state.hpPools?.[`havuz-${n}`]) n++;
      const max = list.reduce((x, m) => x + m.maxHp, 0);
      const pool: BattleEvent = { type: 'hp_pool_created', poolId: `havuz-${n}`, memberIds: list.map((x) => x.id), hp: Math.min(max, list.reduce((x, m) => x + m.hp, 0)), max, label: name };
      // P10 (sürüm 39+): havuz üyelerine direnç (havuza düşen hasar yarıya).
      const res = Array.isArray(p.direncler) && p10On(state) ? list.map((m) => effect(m, { resist: p.direncler as string[], icon: '🛡' }, `pk-havuz-direnc:havuz-${n}:${m.id}`)) : [];
      return [pool, ...res];
    }
    // P7: büyü yuvası geri kazanma (sınır içindeki en yüksek seviye).
    case 'yuvaGeriKazan': {
      const cap = Math.min(flatNum(val(p, 'enCokSeviye'), a), a.spellSlots.length);
      if (cap < 1) return 'Büyü yuvası yok.';
      return [{ type: 'slot_created', actorId: a.id, level: cap }];
    }
    // P7: kaynak geri kazanma (üst sınır: verilen ya da savaş başındaki değer).
    case 'kaynakYenile': {
      const r = p.yenile as { id: string; maliyet?: number };
      const id = resKey(a, r.id);
      const cap = p.enCok !== undefined ? flatNum(p.enCok, a) : a.paket?.kaynakBas?.[id] ?? (a.resources[id] ?? 0);
      const now = a.resources[id] ?? 0;
      const to = Math.min(cap, now + (r.maliyet ?? 1));
      return to > now ? [{ type: 'feature_used', actorId: a.id, feature: id, remaining: to }] : [];
    }
    default: return [];
  }
}

// ------------------------------------------------------------------ çağırma

/** Paket yaratığı → canavar şablonu (sahibinin seviyesi ve yeterliliğiyle). */
function creatureMonster(def: Record<string, unknown>, owner: Combatant, monsterId: string): Monster {
  // P7: SRD canavarından stat bloğu (eşyadan çağırma: Staff of the Python, Figurine…).
  if (typeof def.canavar === 'string') {
    const m = getMonster(def.canavar);
    return { ...m, id: monsterId, name: def.ad ? (def.ad as { tr: string }).tr : m.name };
  }
  const n = (v: unknown) => flatNum(v, owner);
  const caster = owner.spellAttack ?? owner.proficiency + Math.max(owner.modifiers.int, owner.modifiers.wis, owner.modifiers.cha);
  const list = (def.saldirilar as Array<Record<string, unknown>> | undefined) ?? [];
  const multi = Math.max(1, (def.cokluSaldiri as number | undefined) ?? 1);
  const attacks: MonsterAttack[] = list.map((s, i) => {
    const dmg = formul(s.hasar, owner);
    const type = s.hasarTuru as string;
    const save = s.save as Record<string, unknown> | undefined;
    const ranged = s.tur === 'menzilli';
    return {
      name: s.ad as string, bonus: s.bonus === undefined || s.bonus === 'sahip' ? caster : n(s.bonus), damage: `${dmg} ${type}`, damageDice: dmg, damageType: type,
      repeat: i === 0 ? Math.max(1, multi - (list.length - 1)) : 1,
      ...(save ? { save: { ability: save.yetenek as Ability, dc: dcOf(save, owner), halfOnSave: !!save.yari } } : {}),
      ...(ranged ? { ranged: true, range: (s.menzil as [number, number] | undefined) ?? [30, 120] } : { ranged: false, reachFt: (s.erisimFt as number | undefined) ?? 5 }),
    };
  });
  const hiz = (def.hiz as Record<string, number> | undefined) ?? {};
  const jeton = (def.jeton as Record<string, unknown> | undefined) ?? {};
  const g = typeof jeton.gorsel === 'string' ? jeton.gorsel : JETON_YEDEK;
  const art = JETON_ARKETIP[g] ?? (JETON_ARKETIP[g] === undefined && g !== JETON_YEDEK ? g : JETON_ARKETIP[JETON_YEDEK]);
  const ozel = (def.ozellikler as string[] | undefined) ?? [];
  return {
    id: monsterId, name: (def.ad as { tr: string }).tr, size: (def.boyut as Monster['size']) ?? 'M', ac: n(def.ac), hp: Math.max(1, n(def.hp)), speed: hiz.yurume ?? 30,
    ...(hiz.ucma ? { fly: hiz.ucma } : {}), avatar: `monsters/${art}.webp`, abilities: def.yetenekler as Record<Ability, number>, cr: '0', attacks, traits: '',
    multiattack: multi > 1, ...(ozel.includes('surudeTaktik') ? { packTactics: true } : {}),
    ...(def.direncler ? { resistances: def.direncler as string[] } : {}), ...(def.bagisikliklar ? { immunities: def.bagisikliklar as string[] } : {}),
    ...(def.karanlikGorus ? { darkvision: def.karanlikGorus as number } : {}),
  };
}

/** Sahibine en yakın boş altıgen (menzil içinde). */
function freeHexNear(state: BattleState, owner: Combatant, rangeFt: number, prefer?: Offset): Offset | null {
  if (!state.map || !owner.pos) return null;
  const taken = new Set(Object.values(state.combatants).filter((x) => x.pos && !x.summon?.gone && x.hp > 0).map((x) => `${x.pos?.col},${x.pos?.row}`));
  const cands = hexesAround(state, prefer ?? owner.pos, Math.max(1, Math.floor(rangeFt / 5)))
    .filter((h) => !taken.has(`${h.col},${h.row}`) && distance(owner.pos as Offset, h) * 5 <= rangeFt && !'#WwLl'.includes(state.map?.tiles[h.row]?.[h.col] ?? '#'))
    .sort((x, y) => distance(prefer ?? (owner.pos as Offset), x) - distance(prefer ?? (owner.pos as Offset), y) || x.row - y.row || x.col - y.col);
  return cands[0] ?? null;
}

export const paketMonsterId = (sub: string, id: string) => `pk-${sub}-${id}`;

function summonEvents(state: BattleState, c: Ctx): BattleEvent[] | string {
  const a = c.actor;
  const p = c.p;
  // P7: rastgele yaratık (Bag of Tricks): listeden zarla.
  const pool = Array.isArray(p.rastgele) ? p.rastgele as string[] : null;
  const ref = pool?.length ? pool[rollDie(pool.length, rollTag(c.rng, { by: a.id })) - 1] as string : p.yaratik as string;
  const def = a.paket?.yaratiklar?.[ref];
  if (!def) return 'Yaratık tanımı yok.';
  const spellId = `pk:${c.feat.key}#${c.i}`;
  const out: BattleEvent[] = [];
  if (val<string>(p, 'tekrar') === 'degistir') {
    for (const o of Object.values(state.combatants)) if (o.summon && !o.summon.gone && o.summon.by === a.id && o.summon.spellId === spellId) out.push({ type: 'summon_vanished', actorId: o.id, ownerId: a.id, reason: 'replaced' });
  }
  // P6: konsantrasyon (çağıran konsantre olur; bozulunca `summonCleanup` yaratığı kaldırır).
  const conc = !!p.konsantrasyon;
  if (conc) out.push({ type: 'concentration_started', actorId: a.id, spell: nameOf(c), slotLevel: 0, turn: turnKey(state) });
  let cur = applyEvents(state, out);
  // P6: ölenden mod: bu savaşta ölenlerin karesinde (ceset başına bir kez; taraf ve boyut süzgeci).
  const olenden = val<string>(p, 'mod') === 'olenden';
  const taraf = val<string>(p, 'taraf');
  const lim = (p.boyutSiniri as string | undefined) ?? 'L';
  const corpses = olenden ? Object.values(cur.combatants).filter((x) => x.pos && !x.summon && x.id !== a.id
    && (x.life === 'dead' || (x.side !== a.side && x.hp <= 0)) && a.traitTurns?.[`pk-ceset:${x.id}`] !== 'kullanildi'
    && (taraf === 'hepsi' || (taraf === 'dost') === (x.side === a.side)) && sizeRank(x.size) <= sizeRank(lim as Combatant['size'])
    && !Object.values(cur.combatants).some((o) => o.id !== x.id && o.hp > 0 && !o.summon?.gone && o.pos && x.pos && o.pos.col === x.pos.col && o.pos.row === x.pos.row)
    && (!a.pos || !x.pos || distance(a.pos, x.pos) * 5 <= ft(p, 'menzilFt', a)))
    .sort((x, y) => (a.pos && x.pos && y.pos ? distance(a.pos, x.pos) - distance(a.pos, y.pos) : 0) || x.id.localeCompare(y.id)) : [];
  if (olenden && !corpses.length) return 'Menzilde diriltilecek ölü yok.';
  const count = Math.max(1, Math.min(8, flatNum(val(p, 'sayi'), a), olenden ? corpses.length : 8));
  const monsterId = paketMonsterId(a.paket?.altSinif ?? 'x', ref);
  const monster = creatureMonster(def, a, monsterId);
  registerRiders(def, monsterId);
  const own = val<string>(p, 'inisiyatif') === 'ayri';
  const sure = val<number | 'kalici'>(p, 'sure');
  const jeton = (def.jeton as Record<string, unknown> | undefined) ?? {};
  const eylemler = (def.eylemler as string[] | undefined) ?? ['saldiri', 'kacin', 'yardim'];
  for (let k = 0; k < count; k++) {
    const corpse = olenden ? corpses[k] : undefined;
    if (corpse) { const used: BattleEvent = { type: 'trait_turn', actorId: a.id, trait: `pk-ceset:${corpse.id}`, key: 'kullanildi' }; out.push(used); cur = applyEvents(cur, [used]); }
    const at = corpse?.pos ?? (state.map ? freeHexNear(cur, a, ft(p, 'menzilFt', a), k === 0 ? c.to : undefined) : null);
    if (state.map && !at) break;
    let n = 1;
    while (cur.combatants[`${a.id}-cagri${n}`]) n++;
    const id = `${a.id}-cagri${n}`;
    const { reactions: _r, reactionUses: _u, ...base } = combatantFromMonster(monster, { id, name: `${monster.name} (${a.name})`, height: a.height });
    const initiative = own ? rollDie(20, rollTag(c.rng, { kind: 'initiative', by: id, bonus: abilityModifier(monster.abilities.dex) })) + abilityModifier(monster.abilities.dex) : a.initiative;
    const summon: SummonInfo = {
      by: a.id, spellId, spell: nameOf(c), turn: own ? 'own' : 'after-owner', level: a.level, ...(conc ? { concentration: true } : {}),
      ...(sure === 'kalici' ? {} : { until: cur.round + sure - 1 }),
      ...(val<boolean>(p, 'sahipOlunceKaybolur') ? { endsOnOwnerDeath: true } : {}),
      ...(!eylemler.includes('saldiri') ? { noAttack: true } : {}),
      ...(val<string>(p, 'komut') === 'bonus' ? { commandBonus: true } : {}),
    };
    const immune = def.durumBagisikliklari as string[] | undefined;
    const combatant: Combatant = {
      ...base, side: a.side, ownerId: a.ownerId, initiative, pos: cur.map && at ? at : null, proficiency: a.proficiency,
      avatar: { ...base.avatar, bg: a.avatar.bg, ...(jeton.ton !== undefined ? { hue: jeton.ton as number } : {}), ...(jeton.halka ? { ring: jeton.halka as string } : {}) },
      creatureType: (def.tur as string | undefined) ?? (typeof def.canavar === 'string' ? base.creatureType : undefined) ?? 'beast',
      ...(Array.isArray(def.buyusuzDirencler) ? { nonmagicalResist: def.buyusuzDirencler as string[] } : {}),
      ...((def.ozellikler as string[] | undefined)?.includes('tirmanici') ? { traits: [...(base.traits ?? []), 'climber'] } : {}),
      ...(!eylemler.includes('saldiri') ? { attacks: [], multiattack: false } : {}),
      ...(immune?.length ? { effects: [{ id: `pk-bagisik:${id}`, name: 'Bağışıklık', sourceId: id, auras: [{ id: `pk-bagisik:${id}`, name: 'Bağışıklık', radius: 0, filter: 'allies', trigger: 'passive', effect: { kind: 'conditionImmune', conditions: immune } }] } as ActiveEffect] } : {}),
      summon,
    };
    // Sıradaki yer: sahibinin (ve onun ardından oynayan çağrılarının) ardı ya da kendi inisiyatifi.
    let index: number;
    if (!own) {
      index = cur.order.indexOf(a.id) + 1;
      while (index < cur.order.length && cur.combatants[cur.order[index] as string]?.summon?.by === a.id && cur.combatants[cur.order[index] as string]?.summon?.turn === 'after-owner') index++;
    } else {
      const j = cur.order.findIndex((oid) => (cur.combatants[oid]?.initiative ?? 0) < initiative);
      index = j < 0 ? cur.order.length : j;
    }
    const ev: BattleEvent = { type: 'summoned', ownerId: a.id, spell: nameOf(c), combatant, index };
    out.push(ev);
    cur = applyEvents(cur, [ev]);
  }
  return out.some((e) => e.type === 'summoned') ? out : 'Çağırma için boş yer yok.';
}

/** Paket yaratığının saldırı eklerini kaydeder (`attack-riders` biçimi; olaylar değil, yürütme verisi). */
function registerRiders(def: Record<string, unknown>, monsterId: string): void {
  for (const s of (def.saldirilar as Array<Record<string, unknown>> | undefined) ?? []) {
    if (s.ek && typeof s.ek === 'object') registerSummonRider(`${monsterId}:${s.ad as string}`, { status: 'uygulandı', ...(s.ek as object) } as Parameters<typeof registerSummonRider>[1]);
  }
}
function registerAllRiders(state: BattleState): void {
  for (const c of Object.values(state.combatants)) for (const [ref, def] of Object.entries(c.paket?.yaratiklar ?? {})) registerRiders(def, paketMonsterId(c.paket?.altSinif ?? 'x', ref));
}

// ------------------------------------------------------------------ düğme (use_feature)

function pickDugme(actor: Combatant, f: UsableFeature): Dugme | undefined { return dugmeOf(actor, f.key); }

export function paketProblem(state: BattleState, actor: Combatant, f: UsableFeature, targetId?: string, to?: Offset): string | null {
  // Kuyruk P12 (sürüm 43+): rastgele büyü listesi ve vertigo düğmeleri.
  if (isP12Feature(f.key)) return p12Problem(state, actor, f, targetId, to);
  const d = pickDugme(actor, f);
  if (!d) return 'Bilinmeyen özellik.';
  if (actor.hp <= 0) return 'Ayakta değil.';
  const pay = d.prims.find((x) => x.p.kaynak);
  if (pay && !canPay(actor, pay.p)) return `${f.name}: kullanım kalmadı.`;
  if (d.prims.some((x) => x.p.turdaBir && usedThisTurn(state, actor, d.feat.key, x.i))) return `${f.name}: bu tur kullanıldı.`;
  if (d.prims.every((x) => !kosulOk(state, actor, x.p, targetId ? state.combatants[targetId] : undefined))) return `${f.name}: koşul sağlanmıyor.`;
  const need = dugmeNeeds(d);
  if (need.target && !targetId) return 'Bir hedef seç.';
  if (need.hex && !to && !targetId) return 'Bir altıgen seç.';
  // Hedef ve altıgen denetimi: ilk hedefli ilkelin hedefleri.
  for (const { p, i } of d.prims) {
    if (p.tur === 'isinlan' && to && state.map && actor.pos) {
      const why = teleportProblem(state, actor, to, { rangeFt: ft(p, 'mesafeFt', actor), sight: val<boolean>(p, 'gorus') });
      if (why) return why;
    }
    if (['dost', 'dostVeyaKendi', 'dusman', 'vurulan', 'alan'].includes(val<string>(p, 'hedef'))) {
      const ts = targetsOf(state, { actor, feat: d.feat, p, i, rng: () => 0.5, targetId, to, manual: true });
      if (typeof ts === 'string') return ts;
    }
  }
  return null;
}

export function executePaket(state: BattleState, actor: Combatant, f: UsableFeature, targetId: string | undefined, rng: Rng | undefined, to?: Offset): CommandResult {
  if (isP12Feature(f.key)) return p12Execute(state, actor, f, rng, to);
  const why = paketProblem(state, actor, f, targetId, to);
  if (why) return fail(why);
  if (!rng) return fail('Zar gerekli.');
  const d = pickDugme(actor, f) as Dugme;
  const events: BattleEvent[] = [];
  const pay = d.prims.find((x) => x.p.kaynak);
  const k = pay ? costOf(actor, pay.p) : null;
  if (k) events.push({ type: 'feature_used', actorId: actor.id, feature: k.id, remaining: (actor.resources[k.id] ?? 0) - k.cost });
  let cur = applyEvents(state, events);
  for (const { p, i } of d.prims) {
    const a = cur.combatants[actor.id] as Combatant;
    if (!kosulOk(cur, a, p, targetId ? cur.combatants[targetId] : undefined)) continue;
    const r = runPrim(cur, { actor: a, feat: d.feat, p, i, rng, targetId, to, manual: true });
    if (typeof r === 'string') { if (d.prims.length === 1) return fail(r); continue; }
    const mark: BattleEvent[] = p.turdaBir ? [{ type: 'trait_turn', actorId: actor.id, trait: usedKey(d.feat.key, i), key: turnKey(cur) }] : [];
    events.push(...r, ...mark);
    cur = applyEvents(cur, [...r, ...mark]);
  }
  return finish(state, events);
}

// ------------------------------------------------------------------ otomatik tetikler

/** Bir yaratığın verilen tetikli ilkelleri (koşul, kaynak, turda bir). */
function autoEvents(state: BattleState, actorId: string, tetik: string, rng: Rng, hit?: Combatant, only?: (p: Ilkel) => boolean): BattleEvent[] {
  const out: BattleEvent[] = [];
  let cur = state;
  const a0 = state.combatants[actorId];
  for (const feat of a0?.paket?.ozellikler ?? []) feat.ilkeller.forEach((p, i) => {
    const a = cur.combatants[actorId];
    if (!a || tetikOf(p) !== tetik || (only && !only(p))) return;
    if (a.hp <= 0 && tetik !== 'sifirCan') return;
    if (!kosulOk(cur, a, p, hit) || !canPay(a, p) || (p.turdaBir && usedThisTurn(cur, a, feat.key, i))) return;
    const r = runPrim(cur, { actor: a, feat, p, i, rng, hit, manual: false });
    if (typeof r === 'string' || !r.length) return;
    const k = costOf(a, p);
    const evs: BattleEvent[] = [
      ...(k ? [{ type: 'feature_used' as const, actorId: a.id, feature: k.id, remaining: (a.resources[k.id] ?? 0) - k.cost }] : []),
      ...r,
      ...(p.turdaBir ? [{ type: 'trait_turn' as const, actorId: a.id, trait: usedKey(feat.key, i), key: turnKey(cur) }] : []),
    ];
    out.push(...evs);
    cur = applyEvents(cur, evs);
  });
  return out;
}

/** İsabet kancası: ek hasar zarı (hasara eklenir) ve isabet sonrası ilkeller. */
registerHitHook((state, actor, target, ctx, rng) => {
  if (!actor.paket) return null;
  const extras: ExtraDamage[] = [];
  const marks: BattleEvent[] = [];
  let any = false;
  for (const feat of actor.paket.ozellikler) feat.ilkeller.forEach((p, i) => {
    if (tetikOf(p) !== 'isabet') return;
    any = true;
    if (p.tur === 'zarDegistir') { const x = diceChange(state, actor, target, feat, p, i, ctx, rng); if (x) { extras.push(x.extra); marks.push(...x.marks); } return; }
    if (p.tur !== 'ekHasar') return;
    const s = val<string>(p, 'saldiri');
    const okKind = s === 'hepsi' || (s === 'buyu' ? ctx.spell : !ctx.spell && (s === 'silah' || (s === 'yakin' && ctx.melee) || (s === 'menzilli' && ctx.ranged)));
    if (!okKind || !kosulOk(state, actor, p, target, ctx.advantage) || !canPay(actor, p) || (p.turdaBir && usedThisTurn(state, actor, feat.key, i))) return;
    const roll = rollDice(formul(p.zar, actor), rollTag(rng, { kind: 'damage', by: actor.id }), ctx.critical);
    const type = val<string>(p, 'hasarTuru') === 'silah' ? ctx.weaponType : val<string>(p, 'hasarTuru');
    // P10 (sürüm 39+): yan hedef: vurulana bitişik başka bir düşmana (yoksa vurulana).
    const side = p.yanHedef === true && p10On(state) && target.pos ? Object.values(state.combatants)
      .filter((o) => alive(o) && o.id !== target.id && o.side === target.side && !o.civilian && o.pos && gap(state, o, target) <= 1)
      .sort((x, y) => x.hp - y.hp || x.id.localeCompare(y.id))[0] : undefined;
    if (side) marks.push(hitEffect(side, 'paket', (p.ad as string | undefined) ?? feat.ad, { damage: String(roll.total), damageType: type || 'force' }, rng));
    else {
      const adj = adjustDamage(roll.total, type, profileOf(target));
      extras.push({ label: (p.ad as string | undefined) ?? feat.ad, rolls: roll.rolls, raw: roll.total, applied: adj.amount, type, note: adj.note });
    }
    const k = costOf(actor, p);
    if (k) marks.push({ type: 'feature_used', actorId: actor.id, feature: k.id, remaining: (actor.resources[k.id] ?? 0) - k.cost });
    if (p.turdaBir) marks.push({ type: 'trait_turn', actorId: actor.id, trait: usedKey(feat.key, i), key: turnKey(state) });
  });
  if (!extras.length && !any) return null;
  const after: HitAfter[] = [() => marks, (s) => autoEvents(s, actor.id, 'isabet', rng, s.combatants[target.id], (p) => p.tur !== 'ekHasar' && p.tur !== 'zarDegistir')];
  return { extras, after };
});

/** P7: saldırı türü süzgeci (ekHasar ile aynı). */
function attackKindOk(p: Ilkel, ctx: { spell: boolean; melee: boolean; ranged: boolean }): boolean {
  const s = val<string>(p, 'saldiri');
  return s === 'hepsi' || (s === 'buyu' ? ctx.spell : !ctx.spell && (s === 'silah' || (s === 'yakin' && ctx.melee) || (s === 'menzilli' && ctx.ranged)));
}

/**
 * P7 `zarDegistir`: saldırının atılan hasar zarlarına göre fark ek hasar olarak: maks (zarlar en yüksek), yenidenAt
 * (eşik ve altı bir kez yeniden), carpan (zarlar bir kez daha), zarBuyut (her zar bir boy büyük). Zar ifadesi yoksa etkisiz.
 */
function diceChange(state: BattleState, actor: Combatant, target: Combatant, feat: PaketOzellik, p: Ilkel, i: number,
  ctx: { spell: boolean; melee: boolean; ranged: boolean; critical: boolean; advantage: boolean; weaponType: string; rolls?: number[]; dice?: string }, rng: Rng): { extra: ExtraDamage; marks: BattleEvent[] } | null {
  if (!attackKindOk(p, ctx) || !kosulOk(state, actor, p, target, ctx.advantage) || !canPay(actor, p) || (p.turdaBir && usedThisTurn(state, actor, feat.key, i))) return null;
  const types = p.hasarTurleri as string[] | undefined;
  if (types && !types.includes(ctx.weaponType)) return null;
  const sides = Number(/d(\d+)/.exec(ctx.dice ?? '')?.[1] ?? 0);
  const rolls = ctx.rolls ?? [];
  if (!sides || !rolls.length) return null;
  const mode = p.mod as string;
  const tag = rollTag(rng, { kind: 'damage', by: actor.id });
  let plus = 0;
  const extraRolls: number[] = [];
  if (mode === 'maks') plus = rolls.reduce((n, r) => n + (sides - r), 0);
  else if (mode === 'carpan') { plus = rolls.reduce((n, r) => n + r, 0); extraRolls.push(...rolls); }
  else if (mode === 'yenidenAt') {
    const esik = flatNum(val(p, 'esik'), actor);
    for (const r of rolls) if (r <= esik) { const v = rollDie(sides, tag); extraRolls.push(v); plus += v - r; }
  } else if (mode === 'ikiAtSec' && p10On(state)) {
    // P10: bütün hasar zarları bir kez daha; büyük toplam seçilir.
    let sum = 0;
    for (let k = 0; k < rolls.length; k++) { const v = rollDie(sides, tag); extraRolls.push(v); sum += v; }
    plus = Math.max(0, sum - rolls.reduce((n, r) => n + r, 0));
  } else if (mode === 'zarBuyut') {
    const up = ({ 4: 6, 6: 8, 8: 10, 10: 12, 12: 12 } as Record<number, number>)[sides] ?? sides;
    for (const r of rolls) { const v = rollDie(up, tag); extraRolls.push(v); plus += v - r; }
  }
  if (plus <= 0) return null;
  const adj = adjustDamage(plus, ctx.weaponType, profileOf(target));
  const k = costOf(actor, p);
  const marks: BattleEvent[] = [...(k ? [{ type: 'feature_used' as const, actorId: actor.id, feature: k.id, remaining: (actor.resources[k.id] ?? 0) - k.cost }] : []),
    ...(p.turdaBir ? [{ type: 'trait_turn' as const, actorId: actor.id, trait: usedKey(feat.key, i), key: turnKey(state) }] : [])];
  return { extra: { label: (p.ad as string | undefined) ?? feat.ad, rolls: extraRolls, raw: plus, applied: adj.amount, type: ctx.weaponType, note: adj.note }, marks };
}

/**
 * P7 tepki genişletmesi (saldırı sonrası kancası): dostaVuruldu (menzildeki dosta isabet + hasar) → saldiriYap / yansit;
 * banaIsabet / hasarAldim → yansit (alınan hasarın `oran` katı saldırgana; kurtulma verilirse başarıda yarısı), banaIsabet
 * → saldiriYap. Tepki ve kaynak harcanır; karar `askReaction`.
 */
registerAfterAttack((state, attackerId, targetId, info, rng) => {
  const attacker = state.combatants[attackerId];
  const target = state.combatants[targetId];
  if (!attacker || !target || !info.hit || attacker.side === target.side) return [];
  for (const g of Object.values(state.combatants)) {
    if (!g.paket || g.side !== target.side || !canReact(g) || g.hp <= 0) continue;
    const self = g.id === target.id;
    for (const feat of g.paket.ozellikler) for (const [i, p] of feat.ilkeller.entries()) {
      if (p.tur !== 'tepki' || (p.etki !== 'saldiriYap' && p.etki !== 'yansit')) continue;
      const olay = val<string>(p, 'olay');
      const okOlay = self ? (olay === 'banaIsabet' || (olay === 'hasarAldim' && info.melee)) : olay === 'dostaVuruldu';
      if (!okOlay || (info.dealt <= 0 && p.etki === 'yansit') || (olay === 'dostaVuruldu' && info.dealt <= 0)) continue;
      if (!canPay(g, p) || !kosulOk(state, g, p, attacker) || (!self && !within(state, g, target, ft(p, 'menzilFt', g)))) continue;
      const s = val<string>(p, 'saldiri');
      if ((s === 'yakin' && !info.melee) || (s === 'menzilli' && info.melee)) continue;
      const name = (p.ad as string | undefined) ?? feat.ad;
      const api = strikeApi();
      if (p.etki === 'saldiriYap' && !(api && api.can(state, g.id, attacker.id))) continue;
      const opt = { id: usedKey(feat.key, i), name };
      if (!askReactionSafe(rng, g, { attacker, label: name, total: 0, ac: 0, damage: info.dealt }, opt)) continue;
      const k = costOf(g, p);
      const react = reactionUsed(g, { ...opt, ...(k ? { resource: k.id } : {}) }, 'ally', attacker.id);
      if (p.etki === 'saldiriYap') return [react, ...(api as NonNullable<typeof api>).strike(applyEvents(state, [react]), g.id, attacker.id, rng)];
      // Yansıt: hasarın oranı (kurtulmalıysa başarıda yarısı).
      let dmg = Math.max(1, Math.floor(info.dealt * Number(val(p, 'oran') ?? 1)));
      const out: BattleEvent[] = [react];
      if (p.save) { const sv = saveEvent(applyEvents(state, [react]), { actor: g, feat, p, i, rng, manual: false }, attacker, null, '', false); out.push(sv.ev); if (sv.success) dmg = Math.floor(dmg / 2); }
      if (dmg > 0) out.push(hitEffect(attacker, 'paket', name, { damage: String(dmg), damageType: info.damageType || 'force' }, rng));
      return out;
    }
  }
  return [];
});

/** Tur başı: yaratık ekleri (yükleme sonrası) ve `turBasi` ilkelleri. */
registerTurnStart((state, id, rng) => {
  registerAllRiders(state);
  return state.combatants[id]?.paket ? autoEvents(state, id, 'turBasi', rng) : [];
});

/** Komut sonu: savaş başı, öldürünce, hasar alınca, koşullu pasiflerin eşitlenmesi, ölümden dönüş. */
registerCommandEnd((before, next, events0, cmd, rng) => {
  const owners = Object.values(next.combatants).filter((c) => c.paket);
  if (!owners.length) return [];
  const out: BattleEvent[] = [];
  let cur = next;
  const push = (evs: BattleEvent[]) => { if (evs.length) { out.push(...evs); cur = applyEvents(cur, evs); } };
  if (cmd.type === 'start_battle') {
    registerAllRiders(cur);
    for (const c of owners) push(autoEvents(cur, c.id, 'savasBasi', rng));
    // P6: zar mührü: saklı d20'ler (her biri ayrı süren etki; kaynak verilirse kalan kullanım kadar).
    for (const c0 of owners) for (const f of c0.paket?.ozellikler ?? []) for (const p of f.ilkeller.filter((x) => x.tur === 'zarMuhru')) {
      const c = cur.combatants[c0.id] as Combatant;
      const k = costOf(c, p);
      const n = Math.max(0, Math.min(flatNum(p.sayi, c), k ? c.resources[k.id] ?? 0 : 20));
      const evs: BattleEvent[] = [];
      for (let j = 0; j < n; j++) {
        const v = rollDie(20, rollTag(rng, { kind: 'check', by: c.id }));
        evs.push({ type: 'effect_added', targetId: c.id, effect: { id: `pk-muhur:${c.id}:${j + 1}`, name: (p.ad as string | undefined) ?? f.ad, sourceId: c.id, pkMuhur: v, icon: '◉' } });
      }
      push(evs);
    }
  }
  // P6: bu tur büyü yapıldı (koşul `buyuTurunda`).
  if (cmd.type === 'cast_spell' && next.combatants[cmd.actorId]?.paket) push([{ type: 'trait_turn', actorId: cmd.actorId, trait: 'pk-buyu', key: turnKey(next) }]);
  if (cmd.type === 'end_turn' && 'actorId' in cmd && next.combatants[cmd.actorId]?.paket) push(autoEvents(cur, cmd.actorId, 'turSonu', rng));
  // Öldürünce: komutu veren paket sahibinin rakiplerinden biri bu komutla 0 HP'ye düştü.
  const actorId = 'actorId' in cmd ? (cmd as { actorId: string }).actorId : undefined;
  const killer = actorId ? next.combatants[actorId] : undefined;
  if (killer?.paket) {
    const dropped = Object.values(next.combatants).find((c) => c.side !== killer.side && c.hp <= 0 && (before.combatants[c.id]?.hp ?? 0) > 0);
    if (dropped) push(autoEvents(cur, killer.id, 'oldurunce', rng, dropped));
  }
  // Hasar alınca.
  for (const c of owners) {
    const b = before.combatants[c.id];
    const n = cur.combatants[c.id];
    if (b && n && n.hp > 0 && (n.hp < b.hp || (n.tempHp ?? 0) < (b.tempHp ?? 0))) push(autoEvents(cur, c.id, 'hasarAlinca', rng));
  }
  // P7: slotlu büyü yapınca (`buyuYuvasi`; merkez kendi altıgeni).
  if (cmd.type === 'cast_spell' && events0.some((e) => e.type === 'slot_spent' && e.actorId === cmd.actorId) && cur.combatants[cmd.actorId]?.paket) push(autoEvents(cur, cmd.actorId, 'buyuYuvasi', rng));
  // P7: sıfır cana düşünce (ölümden dönüş dışındaki ilkeller; ör. koruyucu çağırma).
  for (const c of owners) {
    const b = before.combatants[c.id];
    const n = cur.combatants[c.id];
    if (b && n && b.hp > 0 && n.hp <= 0) push(autoEvents(cur, c.id, 'sifirCan', rng, undefined, (p) => p.tur !== 'olumdenDon'));
  }
  // P7: çağrı güçlendirme: bu komutta çağrılan ve sahibi `cagirGuclendir` taşıyan yaratıklar.
  for (const ev of [...events0, ...out]) {
    if (ev.type !== 'summoned') continue;
    const owner = cur.combatants[ev.ownerId];
    const made = cur.combatants[ev.combatant.id];
    if (!owner?.paket || !made || made.effects?.some((e) => e.id.startsWith('pk-guc:'))) continue;
    for (const f of owner.paket.ozellikler) for (const p of f.ilkeller.filter((x) => x.tur === 'cagirGuclendir')) {
      const body: Record<string, unknown> = { id: `pk-guc:${made.id}`, name: (p.ad as string | undefined) ?? f.ad, sourceId: owner.id, icon: '✦' };
      if (p.acBonusu !== undefined) body.ac = flatNum(p.acBonusu, owner);
      if (p.ekHasar !== undefined) body.hitDie = formul(p.ekHasar, owner);
      if (p.buyuluVurus || owner.effects?.some((e) => e.pkMagic?.includes('cagrilanlar'))) body.pkMagic = ['kendi'];
      const evs: BattleEvent[] = [{ type: 'effect_added', targetId: made.id, effect: body as unknown as ActiveEffect }];
      const th = p.gecicCan !== undefined ? amount(p.gecicCan, owner, rng) : 0;
      if (th > 0) evs.push({ type: 'temp_hp', targetId: made.id, amount: th, label: body.name as string });
      push(evs);
    }
    // Büyülü vuruş (`cagrilanlar`) güçlendirmesiz sahipte de.
    const m2 = cur.combatants[made.id];
    if (m2 && !m2.effects?.some((e) => e.pkMagic) && owner.effects?.some((e) => e.pkMagic?.includes('cagrilanlar'))) push([{ type: 'effect_added', targetId: made.id, effect: { id: `pk-guc:${made.id}`, name: 'Büyülü vuruş', sourceId: owner.id, pkMagic: ['kendi'] } }]);
  }
  // Koşullu pasifler ve ölümden dönüş.
  for (const c0 of owners) {
    const c = cur.combatants[c0.id] as Combatant;
    if (c.life === 'dead') continue;
    for (const feat of c.paket?.ozellikler ?? []) feat.ilkeller.forEach((p, i) => {
      const me = cur.combatants[c.id] as Combatant;
      const eid = effId(feat.key, i);
      const has = !!me.effects?.some((e) => e.id === eid);
      if (tetikOf(p) === 'pasif' && p.kosul) {
        const want = me.hp > 0 && kosulOk(cur, me, p);
        if (want && !has) {
          const body = passiveBody(p, me, cur);
          if (body && Object.keys(body).length) push([{ type: 'effect_added', targetId: me.id, effect: { ...body, id: eid, name: (p.ad as string | undefined) ?? feat.ad, sourceId: me.id } as ActiveEffect }]);
        } else if (!want && has) push([{ type: 'effect_ended', targetId: me.id, effectId: eid, name: (p.ad as string | undefined) ?? feat.ad, reason: 'expired' }]);
      }
      if (p.tur === 'olumdenDon') {
        const hadBefore = !!before.combatants[c.id]?.effects?.some((e) => e.id === eid);
        const usedFlag = `pk-olum:${feat.key}#${i}`;
        // Kullanıldı: koruma bu komutta harcandı (1 HP'de kaldı).
        if (hadBefore && !has && me.hp > 0 && cmd.type !== 'start_battle') {
          const k = costOf(me, p);
          const evs: BattleEvent[] = [...(k ? [{ type: 'feature_used' as const, actorId: me.id, feature: k.id, remaining: (me.resources[k.id] ?? 0) - k.cost }] : []),
            { type: 'trait_turn', actorId: me.id, trait: usedFlag, key: 'kullanildi' }];
          const hp = val<unknown>(p, 'hp');
          const target = hp === 'yari' ? Math.floor(me.maxHp / 2) : flatNum(hp, me);
          if (target > me.hp) evs.push({ type: 'healed', actorId: me.id, targetId: me.id, label: (p.ad as string | undefined) ?? feat.ad, amount: target - me.hp, targetHpAfter: Math.min(me.maxHp, target) });
          push(evs);
          return;
        }
        const me2 = cur.combatants[c.id] as Combatant;
        const ready = me2.hp > 0 && kosulOk(cur, me2, p) && canPay(me2, p) && (!!p.kaynak || me2.traitTurns?.[usedFlag] !== 'kullanildi');
        if (ready && !me2.effects?.some((e) => e.id === eid)) push([{ type: 'effect_added', targetId: me2.id, effect: { id: eid, name: (p.ad as string | undefined) ?? feat.ad, sourceId: me2.id, deathWard: true, icon: '✚' } }]);
        else if (!ready && me2.effects?.some((e) => e.id === eid)) push([{ type: 'effect_ended', targetId: me2.id, effectId: eid, name: (p.ad as string | undefined) ?? feat.ad, reason: 'expired' }]);
      }
    });
  }
  return out;
});

/** Dosta isabet tepkisi (`tepki`, olay dostaIsabet, etki acBonusu): AC eklentisi yetiyorsa ıskaya çevirir. */
/**
 * İsabet tepkileri (`tepki`): dostaIsabet (acBonusu, hasarAzalt, yariya, direnc, iskalat, yonlendir, kritikIptal) ve
 * banaIsabet'in yeni etkileri (iskalat, yonlendir, kritikIptal; diğerleri `ReactionSpec` yolundan). Hasar değişirse
 * `damage` döner (0 → ıska); karar `askReaction`.
 */
const HIT_ETKI = ['acBonusu', 'hasarAzalt', 'yariya', 'direnc', 'iskalat', 'yonlendir', 'kritikIptal'];
const SELF_ETKI = ['iskalat', 'yonlendir', 'kritikIptal'];
registerAllyHit((state, hit, rng) => {
  for (const g of Object.values(state.combatants)) {
    if (!g.paket || g.side !== hit.target.side || !canReact(g)) continue;
    const self = g.id === hit.target.id;
    for (const feat of g.paket.ozellikler) for (const [i, p] of feat.ilkeller.entries()) {
      if (p.tur !== 'tepki' || !HIT_ETKI.includes(p.etki as string)) continue;
      const olay = val<string>(p, 'olay');
      if (self ? olay !== 'banaIsabet' || !SELF_ETKI.includes(p.etki as string) : olay !== 'dostaIsabet') continue;
      if (!canPay(g, p) || !kosulOk(state, g, p, hit.attacker) || (!self && !within(state, g, hit.target, ft(p, 'menzilFt', g)))) continue;
      const s = val<string>(p, 'saldiri');
      if ((s === 'yakin' && !hit.melee) || (s === 'menzilli' && !hit.ranged)) continue;
      if (p.turler && !(p.turler as string[]).includes(hit.damageType)) continue;
      const etki = p.etki as string;
      if (etki === 'acBonusu' && (hit.critical || hit.total >= hit.ac + flatNum(p.miktar, g))) continue;
      if (etki === 'kritikIptal' && !hit.critical) continue;
      const name = (p.ad as string | undefined) ?? feat.ad;
      const opt = { id: usedKey(feat.key, i), name };
      if (!askReactionSafe(rng, g, hit, opt)) continue;
      const k = costOf(g, p);
      const events: BattleEvent[] = [reactionUsed(g, { ...opt, ...(k ? { resource: k.id } : {}) }, 'ally', hit.attacker.id)];
      if (etki === 'acBonusu' || etki === 'iskalat') return { name, events };
      if (etki === 'yonlendir') {
        // Saldırı ıskalar; hasar asıl hedefin menzilindeki başka bir (tepki verenin düşmanı) yaratığa.
        const r = ft(p, 'menzilFt', g);
        const other = Object.values(state.combatants).filter((c) => alive(c) && c.id !== hit.target.id && c.side !== g.side && within(state, hit.target, c, r))
          .sort((x, y) => (state.map && x.pos && y.pos && hit.target.pos ? gap(state, hit.target, x) - gap(state, hit.target, y) : 0) || x.id.localeCompare(y.id))[0];
        if (other) events.push(hitEffect(other, 'paket', name, { damage: String(hit.damage), damageType: hit.damageType || 'force' }, rng));
        return { name, events };
      }
      const dmg = etki === 'hasarAzalt' ? hit.damage - amount(p.miktar, g, rng) : etki === 'kritikIptal' ? Math.ceil(hit.damage / 2) : Math.floor(hit.damage / 2);
      return { name, events, damage: Math.max(0, dmg) };
    }
  }
  return null;
});

function askReactionSafe(rng: Rng, g: Combatant, hit: { attacker: Combatant; label: string; total: number; ac: number; damage: number }, opt: { id: string; name: string }): boolean {
  return askReaction(rng, { reactorId: g.id, trigger: 'ally', sourceId: hit.attacker.id, info: { label: hit.label, total: hit.total, ac: hit.ac, damage: hit.damage },
    options: [opt], suggested: { option: opt.id } })?.option === opt.id;
}

// ------------------------------------------------------------------ yapay zekâ

/** Paket düğmelerinin aday komutları (puanı değerlendirici kuru çalıştırmayla verir). */
registerAction({
  id: 'paket', kind: 'utility', note: 'Ek paket ilkel düğmeleri (P0): hedefli/altıgenli adaylar, puan kuru çalıştırmayla.',
  gen: (state, actor, h) => {
    if (!actor.paket) return [];
    const out: Command[] = [];
    for (const f of (actor.features ?? []).filter((x) => x.effect.kind === 'paket')) {
      const d = dugmeOf(actor, f.key);
      if (!d) continue;
      const need = dugmeNeeds(d);
      const base = { type: 'use_feature' as const, actorId: actor.id, feature: f.key };
      const targets = need.target === 'enemy' ? h.foes.slice(0, 3) : need.target === 'ally' ? h.allies.filter((x) => x.hp < x.maxHp || d.prims.some((y) => y.p.tur !== 'iyilestirme')).slice(0, 3)
        : need.target === 'any' ? [...h.foes.slice(0, 2), ...h.allies.slice(0, 2)] : [null];
      for (const t of targets) {
        if (!need.hex) { out.push({ ...base, ...(t ? { targetId: t.id } : {}) }); continue; }
        // Altıgen adayları: düşmanın kendisi (alan/yüzey) ya da düşmana bitişik boş altıgen (ışınlanma).
        const foe = h.foes[0];
        if (!foe?.pos) continue;
        const tele = d.prims.some((x) => x.p.tur === 'isinlan');
        const hexes = tele ? hexesAround(state, foe.pos, 1).filter((x) => !Object.values(state.combatants).some((c) => c.pos && c.pos.col === x.col && c.pos.row === x.row)).slice(0, 2) : [foe.pos];
        for (const hx of hexes) out.push({ ...base, ...(t ? { targetId: t.id } : {}), to: hx } as Command);
      }
    }
    return out;
  },
});

/**
 * Kuyruk K58 G8: paket `buyuDegisimi.cikisCagri`: hedefli saldırı/kurtulma büyüleri çağrının altıgeninden (`originId`)
 * aday olur; puanı kuru çalıştırma verir (menzil ve görüş çağrıdan; çağrı düşmana yakınsa seçilir).
 */
registerAction({
  id: 'paket:cikis', kind: 'damage', note: 'Ek paket: büyü çağrının altıgeninden (cikisCagri), hedefli saldırı/kurtulma büyüleri',
  gen: (state, actor, h) => {
    // Kuyruk P12: büyü kitabı da çıkış adayı (`castOrigins`).
    const origins = castOrigins(state, actor);
    if (!origins.length || !h.canAct) return [];
    const sp = actor.spellNames.map((n) => spellOf(n)).filter((x): x is NonNullable<typeof x> => !!x && (x.mechanics.kind === 'attack' || x.mechanics.kind === 'save') && !x.area).slice(0, 4);
    const out: Command[] = [];
    for (const o of origins.slice(0, 2)) for (const x of sp) for (const t of h.foes.slice(0, 2)) out.push({ type: 'cast_spell', actorId: actor.id, spellName: x.name, targetId: t.id, originId: o.id });
    return out;
  },
});

export type { PaketBag } from './bag';
