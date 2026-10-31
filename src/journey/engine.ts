/**
 * Yolculuk motoru (Görev Y0/Y1): saf `executeJourney` (doğrular, olay üretir) + `reduceJourney` (durumu değiştiren tek
 * yer) + `replayJourney`. Zar atan her adım `rng` alır (`rollTag` ile; elle zar defteri savaştakiyle aynı yol).
 * Kurallar `data/yolculuk/ayarlar.json`: saat sayacı, kısa/uzun dinlenme (SRD 5.2.1 Resting), kısa dinlenme sınırı ve
 * Kolay'da 1 HP ile kalkma (ev kuralları), ganimet (altın + iksir), kilometre taşı ya da XP ile seviye.
 */
import ayar from '../../data/yolculuk/ayarlar.json';
import { rollDice, rollTag, type Rng } from '../rules/dice';
import { getClass } from '../data';
import { currentStatus, fullStatus, longRestStatus, shortRestStatus, type CharacterStatus } from '../rules/characterRest';
import type { JourneyCommand, JourneyEvent, JourneyMember, JourneyResult, JourneyState } from './types';

export const JOURNEY_RULES = ayar as {
  startHour: number; shortRestHours: number; longRestHours: number; longRestGapHours: number;
  shortRestLimit: Record<string, number | null>; reviveOneHp: Record<string, boolean>;
  altinKatsayi: number; iksir: { dice: string; bonus: number }; xpEsikleri: number[];
};

const fail = (error: string): JourneyResult => ({ ok: false, error });
const done = (state: JourneyState, events: JourneyEvent[]): JourneyResult => ({ ok: true, state: applyJourneyEvents(state, events), events });
const alive = (m: JourneyMember) => !m.status.dead;

/** Bulunulan durak. */
export const currentStop = (s: JourneyState) => s.route.stops[s.stop];

/** Uzun dinlenme yapılabilir mi (dinlenme yeri + son uzun dinlenmeden en az 16 saat); değilse nedeni. */
export function longRestBlock(s: JourneyState): 'notRestStop' | 'tooSoon' | null {
  if (currentStop(s)?.kind !== 'rest') return 'notRestStop';
  return s.hour - s.lastLongRest < JOURNEY_RULES.longRestGapHours ? 'tooSoon' : null;
}

/** Kısa dinlenme hakkı kaldı mı (Kolay'da sınır yok). */
export function shortRestsLeft(s: JourneyState): number | null {
  const lim = JOURNEY_RULES.shortRestLimit[s.difficulty];
  return lim === null || lim === undefined ? null : Math.max(0, lim - s.shortRests);
}

/** XP kipinde bir sonraki seviyenin eşiği (yoksa null). */
export const nextLevelXp = (level: number): number | null => JOURNEY_RULES.xpEsikleri[level] ?? null;

/**
 * Kısa dinlenmede harcanacak HP zarı önerisi (arayüz ve zincir simülasyonu): yaşayan her üye HP'si en çok HP'nin
 * %80'ine yaklaşacak kadar (zar ortalamasıyla), kalan zar kadar.
 */
export function autoShortRestDice(s: JourneyState): Record<string, number> {
  return Object.fromEntries(s.party.filter(alive).map((m) => {
    const max = fullStatus(m.sheet).hp;
    const die = getClass(m.sheet.classId).hitDie;
    const want = Math.ceil(Math.max(0, max * 0.8 - m.status.hp) / (die / 2 + 1));
    return [m.id, Math.max(0, Math.min(want, m.sheet.level - m.status.hitDiceSpent))];
  }));
}

export function executeJourney(state: JourneyState | null, cmd: JourneyCommand, rng: Rng): JourneyResult {
  if (cmd.type === 'start') {
    if (state && !state.result) return fail('Süren bir yolculuk var.');
    if (!cmd.party.length) return fail('Partide en az bir karakter olmalı.');
    if (!cmd.route.stops.length) return fail('Güzergâhta durak yok.');
    const first = cmd.route.stops[0];
    const s: JourneyState = {
      id: cmd.id, route: cmd.route, seed: cmd.seed, difficulty: cmd.difficulty, progression: cmd.progression,
      stop: 0, stopDone: first?.kind === 'rest', hour: JOURNEY_RULES.startHour + (first?.travelHours ?? 0), lastLongRest: JOURNEY_RULES.startHour,
      shortRests: 0, gold: 0, potions: 0, xp: 0, level: cmd.route.level,
      party: cmd.party.map((p) => ({ id: p.id, name: p.name, sheet: p.sheet, status: currentStatus(p.sheet, p.status) })),
      result: null,
    };
    const ev: JourneyEvent = { type: 'journey_started', state: s };
    return { ok: true, state: s, events: [ev] };
  }
  if (!state) return fail('Yolculuk başlamadı.');
  if (state.result) return fail('Yolculuk bitti.');
  const stop = currentStop(state);
  if (!stop) return fail('Durak yok.');
  switch (cmd.type) {
    case 'battle_result': {
      if (stop.kind !== 'battle' || state.stopDone) return fail('Bu durakta sonuçlanacak savaş yok.');
      const won = cmd.outcome === 'won';
      const events: JourneyEvent[] = [{
        type: 'battle_recorded', stopId: stop.id, outcome: cmd.outcome, statuses: cmd.statuses, xp: won ? cmd.xp : 0,
        gold: won ? Math.round(cmd.xp * JOURNEY_RULES.altinKatsayi) : 0, potions: won ? stop.potions ?? 0 : 0,
      }];
      const after = applyJourneyEvents(state, events);
      if (won && stop.levelUp && state.progression === 'milestone') events.push({ type: 'leveled', level: state.level + 1 });
      const last = state.stop === state.route.stops.length - 1;
      if (!won || !after.party.some(alive)) events.push({ type: 'journey_finished', result: 'lost' });
      else if (last) events.push({ type: 'journey_finished', result: 'won' });
      return done(state, events);
    }
    case 'short_rest': {
      if (!state.stopDone) return fail('Savaş sürerken dinlenilmez.');
      if (shortRestsLeft(state) === 0) return fail('Kısa dinlenme hakkı bitti (iki uzun dinlenme arası en çok 2; ev kuralı).');
      const statuses: Record<string, CharacterStatus> = {};
      const rolls: Record<string, number[]> = {};
      for (const m of state.party.filter(alive)) {
        const r = shortRestStatus(m.sheet, m.status, Math.max(0, cmd.dice[m.id] ?? 0), rng);
        statuses[m.id] = r.status;
        rolls[m.id] = r.rolls;
      }
      return done(state, [{ type: 'short_rested', statuses, rolls, hour: state.hour + JOURNEY_RULES.shortRestHours }]);
    }
    case 'long_rest': {
      const why = longRestBlock(state);
      if (why === 'notRestStop') return fail('Uzun dinlenme yalnızca dinlenme yerinde.');
      if (why === 'tooSoon') return fail(`Uzun dinlenme için erken (son uzun dinlenmeden ${state.hour - state.lastLongRest} saat geçti; en az ${JOURNEY_RULES.longRestGapHours}).`);
      const statuses = Object.fromEntries(state.party.filter(alive).map((m) => [m.id, longRestStatus(m.sheet, m.status)]));
      const events: JourneyEvent[] = [{ type: 'long_rested', statuses, hour: state.hour + JOURNEY_RULES.longRestHours }];
      // XP kipinde seviye yalnızca uzun dinlenmede (TASARIM §3).
      const need = nextLevelXp(state.level);
      if (state.progression === 'xp' && need !== null && state.xp >= need) events.push({ type: 'leveled', level: state.level + 1 });
      return done(state, events);
    }
    case 'advance': {
      if (!state.stopDone) return fail('Önce bu duraktaki savaş bitmeli.');
      const next = state.route.stops[state.stop + 1];
      if (!next) return fail('Son duraktasınız.');
      // Ev kuralı (Kolay): düşen ya da ölen karakter durak sonunda 1 HP ile kalkar.
      const revived = JOURNEY_RULES.reviveOneHp[state.difficulty] ? state.party.filter((m) => m.status.dead || m.status.hp <= 0).map((m) => m.id) : [];
      const events: JourneyEvent[] = [{ type: 'advanced', stop: state.stop + 1, hour: state.hour + next.travelHours, revived }];
      if (next.kind === 'rest' && next.levelUp && state.progression === 'milestone') events.push({ type: 'leveled', level: state.level + 1 });
      return done(state, events);
    }
    case 'drink_potion': {
      if (state.potions <= 0) return fail('İksir yok.');
      const m = state.party.find((x) => x.id === cmd.memberId);
      if (!m || !alive(m)) return fail('Bu karakter iksir içemez.');
      const r = rollDice(JOURNEY_RULES.iksir.dice, rollTag(rng, { by: m.id, kind: 'heal' }));
      const max = fullStatus(m.sheet).hp;
      return done(state, [{ type: 'potion_drunk', memberId: m.id, rolls: r.rolls, hp: Math.min(max, m.status.hp + r.total + JOURNEY_RULES.iksir.bonus) }]);
    }
  }
}

const setStatuses = (s: JourneyState, statuses: Record<string, CharacterStatus>): JourneyState =>
  ({ ...s, party: s.party.map((m) => (statuses[m.id] ? { ...m, status: statuses[m.id] as CharacterStatus } : m)) });

export function reduceJourney(s: JourneyState | null, e: JourneyEvent): JourneyState | null {
  if (e.type === 'journey_started') return e.state;
  if (!s) return s;
  switch (e.type) {
    case 'battle_recorded':
      return { ...setStatuses(s, e.statuses), stopDone: true, xp: s.xp + e.xp, gold: s.gold + e.gold, potions: s.potions + e.potions };
    case 'leveled':
      return { ...s, level: e.level, party: s.party.map((m) => (m.sheet.level < e.level ? { ...m, sheet: { ...m.sheet, level: e.level } } : m)) };
    case 'short_rested':
      return { ...setStatuses(s, e.statuses), hour: e.hour, shortRests: s.shortRests + 1 };
    case 'long_rested':
      return { ...setStatuses(s, e.statuses), hour: e.hour, lastLongRest: e.hour, shortRests: 0 };
    case 'advanced': {
      const next = s.route.stops[e.stop];
      const up = (st: CharacterStatus): CharacterStatus => { const { dead: _d, ...rest } = st; return { ...rest, hp: 1 }; };
      const party = s.party.map((m) => (e.revived.includes(m.id) ? { ...m, status: up(m.status) } : m));
      return { ...s, party, stop: e.stop, hour: e.hour, stopDone: next?.kind === 'rest' };
    }
    case 'potion_drunk':
      return { ...s, potions: s.potions - 1, party: s.party.map((m) => (m.id === e.memberId ? { ...m, status: { ...m.status, hp: e.hp } } : m)) };
    case 'journey_finished':
      return { ...s, result: e.result };
  }
}

export function applyJourneyEvents(s: JourneyState, events: JourneyEvent[]): JourneyState {
  let out: JourneyState | null = s;
  for (const e of events) out = reduceJourney(out, e);
  return out as JourneyState;
}

/** Olaylar baştan oynatılınca durum (ilk olay `journey_started`). */
export function replayJourney(events: JourneyEvent[]): JourneyState | null {
  let s: JourneyState | null = null;
  for (const e of events) s = reduceJourney(s, e);
  return s;
}
