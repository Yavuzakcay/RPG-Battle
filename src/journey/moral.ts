/**
 * Kuyruk K48 Adım B: Moral'ın Serüven katmanı (anahtar `moralSistemi`; `data/moral.json` `seruven` tablosu). Komutun
 * olaylarından sonra (`seruven.ts` `done`) parti Moral'ı değişir: `seruven_moral` olayı yeni durumları taşır (replay
 * aynı). Hafif modda (tam kapalı) savaş sonucu da buradan (dost düştü, yenilgi, zafer); tam modda savaşın kendi
 * hesabı (`app/partyStatus.ts`) durumlarda gelir. 0'a düşen karakter savaş dışında ölür (Moral ölümü). Saf.
 */
import { deriveStats } from '../rules/stats';
import { MORAL, moralMaxFrom, moralNow, moralRestGain } from '../rules/moral';
import type { CharacterStatus } from '../rules/characterRest';
import type { JourneyMember } from './types';

export type MoralReason = 'dostDustu' | 'yenilgi' | 'zafer' | 'kamp' | 'han' | 'gorev' | 'beyazKontrol' | 'kirmiziKontrol' | 'korkuYeri' | 'hapis' | 'siginaksizGece';

/** Üyenin Moral en çoğu (insan biçimindeki karakter kâğıdından). */
export function memberMoralMax(m: Pick<JourneyMember, 'sheet'>): number {
  const d = deriveStats(m.sheet);
  return moralMaxFrom(d.modifiers, d.proficiency);
}

/** Geçerli Moral (kayıtta yoksa dolu). */
export const memberMoral = (m: Pick<JourneyMember, 'sheet' | 'status'>): number => moralNow(m.status.moral, memberMoralMax(m));

interface Lite { party: JourneyMember[]; done: string[]; page: string; at: string; hapis?: unknown; saat?: number }
type Ev = { type: string; [k: string]: unknown };

const alive = (s: CharacterStatus | undefined) => !!s && !s.dead && s.hp > 0;
const K = MORAL.seruven.kayip, G = MORAL.seruven.kazanc;

/**
 * Olayların Moral değişimleri: üye başına fark ve (han) en çoğa dolum. `full`: tam mod (savaş sonucu savaştan gelir).
 * `after`: olaylar uygulanmış durum.
 */
export function moralDeltas(before: Lite, after: Lite, events: readonly Ev[], full: boolean): { delta: Record<string, number>; gain: Record<string, number>; fill: Set<string>; reasons: MoralReason[] } {
  const delta: Record<string, number> = {};
  /** Kazançlar kayıplardan sonra (0'a düşen önce ölür, sonra dinlenme yarım kalmaz). */
  const gain: Record<string, number> = {};
  const fill = new Set<string>();
  const reasons: MoralReason[] = [];
  const all = (n: number, why: MoralReason, ids = before.party.map((m) => m.id)) => {
    if (!n) return;
    const to = n > 0 ? gain : delta;
    for (const id of ids) to[id] = (to[id] ?? 0) + n;
    if (!reasons.includes(why)) reasons.push(why);
  };
  const half = (why: MoralReason) => { for (const m of before.party) gain[m.id] = (gain[m.id] ?? 0) + moralRestGain('kamp', memberMoralMax(m)); reasons.push(why); };
  for (const e of events) {
    switch (e.type) {
      case 'seruven_result': {
        const statuses = e.statuses as Record<string, CharacterStatus>;
        if (!full) {
          const fallen = (e.downed as string[] | undefined) ?? before.party.filter((m) => alive(m.status) && statuses[m.id] && !alive(statuses[m.id])).map((m) => m.id);
          for (const id of fallen) all(-K.dostDustu, 'dostDustu', before.party.map((m) => m.id).filter((x) => x !== id));
          if (e.outcome === 'lost') all(-K.yenilgi, 'yenilgi');
          else all(G.zafer, 'zafer');
        }
        if (e.rested) half('kamp');
        break;
      }
      case 'seruven_rested': half('kamp'); break;
      case 'seruven_inn': for (const m of before.party) fill.add(m.id); reasons.push('han'); break;
      case 'seruven_quest': if (e.state === 'done') all(G.gorev, 'gorev'); break;
      case 'seruven_link_checked': if (e.success && e.by) all(G.beyazKontrol, 'beyazKontrol'); break;
      case 'seruven_world_check': all(e.success ? G.beyazKontrol : -K.kirmiziKontrol, e.success ? 'beyazKontrol' : 'kirmiziKontrol'); break;
      case 'seruven_moved': {
        const key = `${after.page}/${String(e.to)}`;
        if (MORAL.seruven.korkuYerleri.includes(key) && !before.done.includes(key)) all(-K.korkuYeri, 'korkuYeri');
        break;
      }
      default: break;
    }
  }
  // Hapse düşmek (yolculuk felaketi) ve gece boyunca yürüyüş (sığınaksız gece; K47 serbest gezinti).
  if (!before.hapis && after.hapis) all(-K.hapis, 'hapis');
  const nights = Math.floor((after.saat ?? 0) / 24) - Math.floor((before.saat ?? 0) / 24);
  if (nights > 0 && events.some((e) => e.type === 'seruven_walked' || e.type === 'seruven_traveled')) all(-K.siginaksizGece * nights, 'siginaksizGece');
  return { delta, gain, fill, reasons };
}

/** Değişimler uygulanmış durumlar (yalnızca değişen üyeler); 0'a düşen savaş dışında ölür. */
export function moralStatuses(after: Lite, d: ReturnType<typeof moralDeltas>): { statuses: Record<string, CharacterStatus>; deaths: string[] } {
  const statuses: Record<string, CharacterStatus> = {};
  const deaths: string[] = [];
  for (const m of after.party) {
    if (m.status.dead) continue;
    const max = memberMoralMax(m);
    const cur = moralNow(m.status.moral, max);
    const lost = Math.max(0, Math.min(max, cur + (d.delta[m.id] ?? 0)));
    const next = lost <= 0 ? 0 : d.fill.has(m.id) ? max : Math.min(max, lost + (d.gain[m.id] ?? 0));
    if (next === cur) continue;
    statuses[m.id] = { ...m.status, moral: next, ...(next <= 0 ? { dead: true, moralOlum: true } : {}) };
    if (next <= 0) deaths.push(m.id);
  }
  return { statuses, deaths };
}

/** Diriltilen durum (Moral `dirilme.moral`, 1 HP; kalıcı ceza yok). */
export const revivedStatus = (s: CharacterStatus): CharacterStatus => {
  const { dead: _d, moralOlum: _m, ...rest } = s;
  return { ...rest, hp: 1, moral: MORAL.dirilme.moral };
};

/** Büyüyle diriltme: büyüyü bilen ve slotu olan canlı üye (SRD 5.2.1 Raise Dead ve üstü; maddi bileşen altın). */
export function reviveCaster(party: JourneyMember[]): { member: JourneyMember; spell: string; level: number; gold: number } | null {
  const list = Object.entries(MORAL.dirilme.buyuler as Record<string, { seviye: number; altin: number }>);
  for (const m of party) {
    if (!alive(m.status)) continue;
    for (const [spell, v] of list) {
      if (m.sheet.spellNames?.includes(spell) && (m.status.slots[v.seviye - 1] ?? 0) > 0) return { member: m, spell, level: v.seviye, gold: v.altin };
    }
  }
  return null;
}
