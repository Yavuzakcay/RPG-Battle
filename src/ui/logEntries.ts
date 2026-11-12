/**
 * Kuyruk K58 G3: açılabilir günlük. Her satır bir başlık (ilk cümle) ve ayrıntılar (zarlar, kaynaklı bonuslar, DC,
 * sonuç; `describeEvent` metninin kalan parçaları): ikinci bir anlatım kodu yok. Tür rengi: tepki zinciri
 * (`reaction_used`, fırsat saldırısı, saldırıya tepki), yüzey tepkimesi, Moral. İsteğe bağlı tur özeti her
 * `turn_ended`'da o turun saldırı/isabet/hasar/iyileştirme toplamı. Saf.
 */
import { t } from '../i18n';
import type { BattleEvent, BattleState } from '../battle/types';
import { describeEvent } from './log';

export type LogKind = 'normal' | 'reaction' | 'surface' | 'moral' | 'summary' | 'round';
export interface LogEntry { key: string; head: string; detail: string[]; kind: LogKind }

export function kindOf(e: BattleEvent): LogKind {
  if (e.type === 'reaction_used' || (e.type === 'attack_resolved' && (e.opportunity || !!e.reacted))) return 'reaction';
  if (e.type === 'surface_reacted') return 'surface';
  if (e.type === 'moral_changed') return 'moral';
  if (e.type === 'turn_ended') return 'round';
  return 'normal';
}

/** Metni başlık + ayrıntıya böler ('. ' ayracı; sayılardaki nokta bölünmez). */
export function splitLine(text: string): { head: string; detail: string[] } {
  // Cümle sonu nokta + boşluk + sonraki cümle. Görev SD2: sıra sayısı ("3. seviye slot", "1. tur") cümle sonu değildir:
  // 1–2 basamaklı sayıdan sonra gelen nokta, ardından küçük harfle başlayan sözcük varsa bölünmez.
  const parts: string[] = [];
  let start = 0;
  for (const m of text.matchAll(/\.\s+(?=\S)/g)) {
    const at = m.index ?? 0;
    const next = text[at + m[0].length] ?? '';
    const lower = next === next.toLocaleLowerCase('tr') && next !== next.toLocaleUpperCase('tr');
    if (lower && /(?:^|[\s(])\d{1,2}$/.test(text.slice(start, at))) continue;
    parts.push(text.slice(start, at));
    start = at + m[0].length;
  }
  parts.push(text.slice(start));
  const cleaned = parts.map((p) => p.trim()).filter(Boolean);
  return { head: cleaned[0] ?? text, detail: cleaned.slice(1) };
}

interface Tally { attacks: number; hits: number; dmg: number; heal: number; saves: number }
const empty = (): Tally => ({ attacks: 0, hits: 0, dmg: 0, heal: 0, saves: 0 });

function tally(t0: Tally, e: BattleEvent, actorId: string): void {
  if (e.type === 'attack_resolved' && e.actorId === actorId && !e.opportunity) {
    t0.attacks++; if (e.hit) t0.hits++;
    t0.dmg += e.appliedDamage;
  }
  if (e.type === 'save_resolved' && e.actorId === actorId) { t0.saves++; t0.dmg += e.appliedDamage + (e.secondary?.applied ?? 0); }
  if (e.type === 'healed' && e.actorId === actorId) t0.heal += e.amount;
}

/**
 * Görev MB6b: binekten inme/düşme satırının açılır ayrıntısı: hangi binek, binek 0 HP'ye düştüyse save'siz iniş, Prone,
 * harcanan hareket, iniş irtifası. Binek, olaylardaki son `mounted` olayından (yoksa başlangıç durumundaki `riding`).
 */
function mountDetail(events: BattleEvent[], i: number, e: BattleEvent, state: BattleState): string[] {
  if (e.type !== 'dismounted') return [];
  const D = t().log.mountDetail;
  let mountId: string | undefined;
  for (let k = i - 1; k >= 0 && !mountId; k--) {
    const x = events[k];
    if (x?.type === 'mounted' && x.actorId === e.actorId) mountId = x.mountId;
    if (x?.type === 'battle_started') mountId = x.state.combatants[e.actorId]?.riding;
  }
  const m = mountId ? state.combatants[mountId] : undefined;
  const out: string[] = [];
  if (m) out.push(m.hp <= 0 ? D.down(m.name) : D.mount(m.name));
  if (e.fell) out.push(D.prone);
  else if (e.cost > 0) out.push(D.cost(e.cost * 5));
  if (e.toFt !== undefined) out.push(D.alt(e.toFt));
  return out;
}

export function logEntries(events: BattleEvent[], state: BattleState, opts: { summary?: boolean } = {}): LogEntry[] {
  const L = t().log;
  const out: LogEntry[] = [];
  // Tur sırasında yapan yaratığa göre toplam (tur sonunda sırası biten yaratığınki yazılır, sonra sıfırlanır).
  let tl = new Map<string, Tally>();
  events.forEach((e, i) => {
    if (opts.summary && 'actorId' in e && typeof e.actorId === 'string') {
      const k = e.actorId;
      if (!tl.has(k)) tl.set(k, empty());
      tally(tl.get(k) as Tally, e, k);
    }
    const text = describeEvent(e, state);
    if (text) {
      const { head, detail } = splitLine(text);
      out.push({ key: `e${i}`, head, detail: [...detail, ...mountDetail(events, i, e, state)], kind: kindOf(e) });
    }
    if (e.type === 'turn_ended') {
      const x = tl.get(e.actorId);
      if (opts.summary && x) {
        const who = state.combatants[e.actorId]?.name ?? e.actorId;
        out.push({ key: `s${i}`, head: L.turnSummary(who, x.hits, x.attacks, x.dmg, x.heal, x.saves), detail: [], kind: 'summary' });
      }
      tl = new Map();
    }
  });
  return out;
}
