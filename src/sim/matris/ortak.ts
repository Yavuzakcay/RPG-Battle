/**
 * Mekanik matris: ortak türler, komut çalıştırma, olaylardan gözlem ve beklenti karşılaştırması.
 */
import { execute } from '../../battle/commands';
import type { BattleEvent, BattleState, Combatant, Command, CommandContext } from '../../battle/types';
import type { Offset } from '../../rules/hex';
import { makeRng, type Logged, type Plan } from './zar';

export type Sonuc = 'doğru' | 'yanlış' | 'çökme' | 'uygulanmıyor' | 'karar bekliyor';
export type Mode = 'normal' | 'advantage' | 'disadvantage';

export interface Satir {
  tur: 'büyü' | 'silah' | 'canavar';
  ad: string;
  seviye: string;
  siniflar: string;
  mekanik: string;
  baglam: string;
  /** Bağlam sınıfı (hasar türü, save, saldırı zarı, siper, durum, konsantrasyon, yukarı slot, alan, yüzey, tepki, yapım). */
  kategori: string;
  beklenen: string;
  gercek: string;
  sonuc: Sonuc;
  not: string;
}

export interface SaldiriG { hedef: string; kip: Mode; dogal: number; toplam: number; ac: number; isabet: boolean; kritik: boolean; ham: number; uygulanan: number; tur: string; siper?: number; tepki?: string }
export interface SaveG { hedef: string; yetenek: string; dc: number; kip: Mode; dogal: number | null; basari: boolean; ham: number; uygulanan: number; tur: string; ikincil?: { tur: string; uygulanan: number }; siper?: number; durumlar: string[] }

export interface Gozlem {
  kabul: boolean;
  hata?: string;
  /** Sonraki komutun (tur sonu, saldırı) reddi. */
  sonraHata?: string;
  cokme?: string;
  /** Yaratık başına HP kaybı (önceki − sonraki; geçici HP ayrı). */
  hp: Record<string, number>;
  gecici: Record<string, number>;
  /** Komut sonunda yaratıkta yeni olan durumlar. */
  durum: Record<string, string[]>;
  saldirilar: SaldiriG[];
  saveler: SaveG[];
  slot: number[];
  /** Yaratık başına harcanan slotlar. */
  slotBy: Record<string, number[]>;
  kons: string | null;
  /** Komut sonunda konsantrasyonu biten yaratıklar. */
  konsBitti: string[];
  konsSave: Array<{ hedef: string; dc: number; basari: boolean }>;
  tepki: string[];
  iyilesme: Record<string, number>;
  /** Hasar zarı grupları (yüz ≠ 20). */
  zarlar: Logged[];
  yuzey: string[];
  etkiler: Record<string, Array<{ id: string; ad: string; until?: number; kons?: string; grants: string[] }>>;
  alan: Offset[] | null;
  olaylar: BattleEvent[];
  after: BattleState | null;
  /** İlk komuttan sonraki durum ve olay sayısı (tetikler ayrı ölçülsün). */
  ilk: BattleState | null;
  ilkSay: number;
  eylem: string[];
}

/** Komut bağlamı: oyuncunun yaratığı P1, düşman Game Master. */
export const ctxOf = (state: BattleState, actorId: string): CommandContext => {
  const c = state.combatants[actorId];
  return c && c.side === 'enemies' ? { playerId: 'gm', isGm: true } : { playerId: c?.ownerId ?? 'p1', isGm: false };
};

/**
 * Komutu (ve ardından gelenleri: tur sonu, saldırı) çalıştırır; gözlem bütün olaylardan ve ilk/son durum farkından.
 * İlk komut reddedilirse `kabul` yanlış; sonraki bir komut reddedilirse `sonraHata`.
 */
export function run(state: BattleState, cmd: Command | Command[], ctx: CommandContext, p: Plan): Gozlem {
  const log: Logged[] = [];
  const rng = makeRng(p, log);
  const cmds = Array.isArray(cmd) ? cmd : [cmd];
  const main = cmds[0] as Command;
  const g: Gozlem = { kabul: false, hp: {}, gecici: {}, durum: {}, saldirilar: [], saveler: [], slot: [], slotBy: {}, kons: null, konsBitti: [], konsSave: [], tepki: [],
    iyilesme: {}, zarlar: [], yuzey: [], etkiler: {}, alan: null, olaylar: [], after: null, ilk: null, ilkSay: 0, eylem: [] };
  let cur = state;
  const events: BattleEvent[] = [];
  for (let i = 0; i < cmds.length; i++) {
    const c = cmds[i] as Command;
    let r;
    try {
      r = execute(cur, c, i === 0 ? ctx : ctxOf(cur, (c as { actorId?: string }).actorId ?? ''), rng);
    } catch (e) {
      g.cokme = `${i === 0 ? '' : `${c.type}: `}${String(e instanceof Error ? e.message : e).slice(0, 160)}`;
      if (i === 0) return g;
      break;
    }
    if (!r.ok) {
      if (i === 0) { g.hata = r.error; return g; }
      g.sonraHata = `${c.type}: ${r.error}`;
      break;
    }
    cur = r.state;
    events.push(...r.events);
    if (i === 0) { g.ilk = cur; g.ilkSay = events.length; }
  }
  g.kabul = true;
  g.after = cur;
  g.olaylar = events;
  g.zarlar = log.filter((x) => x.sides !== 20);
  const r = { state: cur, events };
  const cmd0 = main as Command & { actorId?: string };
  for (const [id, b] of Object.entries(state.combatants)) {
    const a = r.state.combatants[id];
    if (!a) continue;
    g.hp[id] = b.hp - a.hp;
    g.gecici[id] = (a.tempHp ?? 0) - (b.tempHp ?? 0);
    const added = a.conditions.filter((c) => !b.conditions.includes(c));
    if (added.length) g.durum[id] = added;
    if (b.concentration && !a.concentration) g.konsBitti.push(id);
  }
  for (const e of r.events) {
    if (e.type === 'attack_resolved') {
      g.saldirilar.push({ hedef: e.targetId, kip: e.mode, dogal: e.natural, toplam: e.total, ac: e.targetAc, isabet: e.hit, kritik: e.critical, ham: e.rawDamage,
        uygulanan: e.appliedDamage, tur: e.damageType, ...(e.cover ? { siper: e.cover } : {}), ...(e.reacted ? { tepki: e.reacted.name } : {}) });
    } else if (e.type === 'save_resolved') {
      g.saveler.push({ hedef: e.targetId, yetenek: e.ability, dc: e.dc, kip: e.mode, dogal: e.natural, basari: e.success, ham: e.rawDamage, uygulanan: e.appliedDamage,
        tur: e.damageType, ...(e.secondary ? { ikincil: { tur: e.secondary.type, uygulanan: e.secondary.applied } } : {}), ...(e.cover ? { siper: e.cover } : {}), durumlar: e.conditionsAdded });
    } else if (e.type === 'slot_spent') {
      if (e.actorId === cmd0.actorId) g.slot.push(e.level);
      (g.slotBy[e.actorId] ??= []).push(e.level);
    }
    else if (e.type === 'concentration_started' && e.actorId === cmd0.actorId) g.kons = e.spell;
    else if (e.type === 'reaction_used') g.tepki.push(`${e.actorId}:${e.name}`);
    else if (e.type === 'healed') g.iyilesme[e.targetId] = (g.iyilesme[e.targetId] ?? 0) + e.amount;
    else if (e.type === 'surface_reacted') g.yuzey.push(e.row ?? e.reaction);
    else if (e.type === 'effect_added') (g.etkiler[e.targetId] ??= []).push({ id: e.effect.id, ad: e.effect.name, ...(e.effect.until !== undefined ? { until: e.effect.until } : {}),
      ...(e.effect.concentration ? { kons: e.effect.concentration } : {}), grants: e.effect.grants ?? [] });
    else if (e.type === 'spell_cast' && e.area && !g.alan) g.alan = e.area.hexes;
    else if (e.type === 'action_used' && e.actorId === cmd0.actorId) g.eylem.push(e.kind);
    const fx = (e as { effects?: Array<{ kind: string; dc?: number; success?: boolean }> }).effects;
    const tid = (e as { targetId?: string }).targetId;
    if (Array.isArray(fx) && tid) for (const f of fx) if (f.kind === 'concentration') g.konsSave.push({ hedef: tid, dc: f.dc ?? 0, basari: !!f.success });
  }
  return g;
}

/** Karşılaştırma alanı: ad, beklenen, gerçek (metin). Eşit değilse fark. */
export interface Alan { k: string; b: string; g: string }
export const alan = (k: string, b: unknown, g: unknown): Alan => ({ k, b: fmt(b), g: fmt(g) });
export function fmt(x: unknown): string {
  if (x === undefined) return '—';
  if (x === null) return 'yok';
  if (typeof x === 'boolean') return x ? 'evet' : 'hayır';
  if (Array.isArray(x)) return x.length ? x.map(fmt).join('+') : 'yok';
  if (typeof x === 'object') return Object.entries(x as Record<string, unknown>).map(([k, v]) => `${k}=${fmt(v)}`).join(',');
  return String(x);
}

/** Kanonik zar: yüz başına toplam zar sayısı + sabitlerin toplamı ("2d10+4d6+4"); gruplamadan bağımsız. */
export function kanon(groups: Array<{ count: number; sides: number; bonus?: number }>): string {
  if (!groups.length) return 'yok';
  const by = new Map<number, number>();
  let bonus = 0;
  for (const g of groups) { if (g.count > 0) by.set(g.sides, (by.get(g.sides) ?? 0) + g.count); bonus += g.bonus ?? 0; }
  const dice = [...by.entries()].sort((a, b) => b[0] - a[0]).map(([s, n]) => `${n}d${s}`);
  return [...dice, ...(bonus ? [String(bonus)] : [])].join('+') || 'yok';
}
/** "8d6+4" ifadelerinin listesi → kanonik (kritikte zar sayısı iki kat). */
export function kanonExpr(exprs: string[], crit = false): string {
  return kanon(exprs.map((e) => {
    const c = /^\s*(-?\d+)\s*$/.exec(e);
    if (c) return { count: 0, sides: 1, bonus: Number(c[1]) };
    const m = /^\s*(\d*)d(\d+)\s*(?:([+-])\s*(\d+))?\s*$/.exec(e);
    if (!m) return { count: 0, sides: 1 };
    return { count: (m[1] ? Number(m[1]) : 1) * (crit ? 2 : 1), sides: Number(m[2]), bonus: m[3] ? (m[3] === '-' ? -1 : 1) * Number(m[4]) : 0 };
  }));
}
export const zarIfadesi = (z: Logged[]): string => z.map((x) => `${x.count}d${x.sides}${x.bonus ? (x.bonus > 0 ? `+${x.bonus}` : String(x.bonus)) : ''}`).join(' + ') || 'yok';

/** Hasar düzeltmesi (SRD 5.2.1: bağışıklık 0, zayıflık ×2, direnç yarısı aşağı). */
export function adjust(amount: number, type: string, prof: { res?: string[]; imm?: string[]; vul?: string[] }): number {
  const t = type.toLowerCase();
  if (prof.imm?.includes(t)) return 0;
  if (prof.vul?.includes(t)) return amount * 2;
  if (prof.res?.includes(t)) return Math.floor(amount / 2);
  return amount;
}

export function mode(adv: boolean, dis: boolean): Mode {
  return adv && !dis ? 'advantage' : dis && !adv ? 'disadvantage' : 'normal';
}
