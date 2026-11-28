/**
 * Görev SAKATLIK-S1 (kural sürümü 111, ev kuralı `sakatlik`): kalıcı yaralanma motoru. Saf; tablo `data/sakatlik.json`
 * (kodda hasar türü ya da sakatlık adıyla koşul yok). Kurallar `harita/belgeler/SAKATLIK.md`.
 *
 * - Savaş başı (`withSakatlikMarks`): sürüm ≥ 111 ve ev kuralı açıkken yalnız parti tarafındaki oyuncu kâğıtlarına
 *   (`raceId` var; canavar, masum, çağrı değil) `sakatlikOn` işareti. Kâğıt düşman, boss, canavar işaret almaz.
 * - Hasar (`sakatlikFor`, `damage-effects.ts`): işaretli hedef 0 HP'ye düşer ve artan (hasar − o anki HP) azami HP'nin
 *   `oran` katı ile 1 katı arasındaysa `dying` etkisine `injury` eklenir (zarsız, deterministik). Anında ölüm kodu aynen.
 * - Reducer (`sakatlikPatch` + `sakatlikEffect`): süren etki `sakatlik:<id>`, azami HP düşüşü (`maxHpLoss`), yetenek düşüşü
 *   (`abilityLoss`) ve savaşçının kalıcı listesi `sakatliklar` (S2 karaktere yazar).
 */
import data from '../../data/sakatlik.json';
import type { Ability } from '../rules/abilities';
import { houseRule } from './houseRules';
import { sakatlikSurumOn } from './sakatlikSurum';
import type { ActiveEffect, BattleState, Combatant } from './types';

export type SakatlikKademe = 'hafif' | 'orta' | 'agir';

/** Savaşçıdaki (ve S2'de karakterdeki) kalıcı sakatlık kaydı. Değerler o sakatlığın uygulanmış toplamıdır. */
export interface SakatlikKaydi {
  id: string;
  kademe: SakatlikKademe;
  /** İlk kez veren hasar türü (bilgi). */
  tur: string;
  /** Azami HP'den düşen toplam (yalnız azami HP düşüşlü sakatlıkta). */
  hp?: number;
  /** Yetenek puanı düşüşü (toplam puan ve değiştirici farkı). */
  yetenek?: { ability: Ability; amount: number; mod: number };
}

/** `dying` hasar etkisindeki sakatlık (olay; reducer uygular). `hp`, `yetenek` bu vuruşun farkıdır. */
export interface SakatlikOlayi {
  id: string;
  kademe: SakatlikKademe;
  /** Bu vuruşun (baskın) hasar türü. */
  tur: string;
  /** Artanın azami HP'ye oranı (bilgi, günlük). */
  oran: number;
  /** Önceki kademe (tekrar ya da dolu liste: kademe artışı). */
  onceki?: SakatlikKademe;
  hp?: number;
  yetenek?: { ability: Ability; amount: number; modDelta: number };
}

interface KademeDef { tr: string; en: string; etki?: Partial<ActiveEffect>; azamiHpOran?: number; yetenek?: { yetenek?: string; yuksek?: string[]; miktar: number } }
interface SakatlikDef { tr: string; en: string; kademe: Record<SakatlikKademe, KademeDef> }
const TABLO = data as unknown as {
  oran: number; kademeler: Array<{ id: SakatlikKademe; min: number }>; enCok: number; doluysa: string;
  turler: Record<string, string>; sakatliklar: Record<string, SakatlikDef>;
};
const SIRA: SakatlikKademe[] = TABLO.kademeler.map((k) => k.id);

/** Savaşta sakatlık kuralı açık mı (sürüm ≥ 111 ve ev kuralı). */
export const sakatlikOn = (state: Pick<BattleState, 'kuralSurumu' | 'houseRules' | 'map'>): boolean =>
  sakatlikSurumOn(state) && houseRule(state, 'sakatlik');

/** Sakatlanabilir mi: parti tarafındaki oyuncu kâğıdı (canavar, kâğıt düşman, masum, çağrı değil). */
export const sakatlikAday = (c: Combatant): boolean =>
  c.side === 'party' && !!c.raceId && !c.monsterId && !c.civilian && !c.summon;

/** Savaş başı işareti (başlangıç olayındaki duruma girer; replay aynı). Kural kapalıysa durum aynen. */
export function withSakatlikMarks(state: BattleState): BattleState {
  if (!sakatlikOn(state)) return state;
  const combatants = Object.fromEntries(Object.entries(state.combatants).map(([k, c]) => [k, sakatlikAday(c) ? { ...c, sakatlikOn: true as const } : c]));
  return { ...state, combatants };
}

/** Oranın kademesi (en büyük `min` ≤ oran); eşik altıysa null. */
export function kademeOf(oran: number): SakatlikKademe | null {
  let out: SakatlikKademe | null = null;
  for (const k of TABLO.kademeler) if (oran >= k.min) out = k.id;
  return out;
}

const up = (k: SakatlikKademe): SakatlikKademe => SIRA[Math.min(SIRA.length - 1, SIRA.indexOf(k) + 1)] as SakatlikKademe;
const maxK = (a: SakatlikKademe, b: SakatlikKademe): SakatlikKademe => (SIRA.indexOf(a) >= SIRA.indexOf(b) ? a : b);

/** Çok türlü vuruşta baskın tür: türe göre toplanan en büyük bileşen (eşitlikte ilk gelen). */
export function dominantType(parts: Array<{ amount: number; type: string | undefined }>): string {
  const sum = new Map<string, number>();
  for (const p of parts) {
    const t = (p.type ?? '').trim().toLowerCase();
    if (!t || p.amount <= 0) continue;
    sum.set(t, (sum.get(t) ?? 0) + p.amount);
  }
  let best = ''; let n = 0;
  for (const [t, v] of sum) if (v > n) { best = t; n = v; }
  return best;
}

const scoreOf = (c: Combatant, ab: Ability): number =>
  10 + 2 * (c.modifiers[ab] - (c.abilityLoss?.[ab]?.mod ?? 0)) - (c.abilityLoss?.[ab]?.amount ?? 0);

/**
 * Bu hasar sakatlık verir mi (`damage-effects.ts`, `dying` dalında). `applied`: geçici HP sonrası hasar; `type`: baskın tür.
 * İşaretsiz hedef, eşik dışı oran, tabloda olmayan tür ya da değişmeyen kademe: null.
 */
export function sakatlikFor(target: Combatant, applied: number, type: string): SakatlikOlayi | null {
  if (!target.sakatlikOn || target.maxHp <= 0) return null;
  const oran = (applied - target.hp) / target.maxHp;
  if (oran < TABLO.oran || oran >= 1) return null;
  const tur = type.trim().toLowerCase();
  const id = TABLO.turler[tur];
  const hesap = kademeOf(oran);
  if (!id || !hesap || !TABLO.sakatliklar[id]) return null;
  const list = target.sakatliklar ?? [];
  let rec = list.find((r) => r.id === id);
  let kademe: SakatlikKademe;
  if (rec) kademe = maxK(hesap, up(rec.kademe));
  else if (list.length >= TABLO.enCok) {
    // Liste dolu: en hafif kaydın kademesi +1 (`doluysa: enHafifArtar`); hepsi ağırsa değişmez.
    if (TABLO.doluysa !== 'enHafifArtar') return null;
    rec = [...list].sort((a, b) => SIRA.indexOf(a.kademe) - SIRA.indexOf(b.kademe))[0];
    if (!rec) return null;
    kademe = up(rec.kademe);
  } else kademe = hesap;
  if (rec && rec.kademe === kademe) return null;
  const sid = rec?.id ?? id;
  const def = TABLO.sakatliklar[sid]?.kademe[kademe];
  if (!def) return null;
  const out: SakatlikOlayi = { id: sid, kademe, tur, oran: Math.round(oran * 1000) / 1000, ...(rec ? { onceki: rec.kademe } : {}) };
  if (def.azamiHpOran) {
    const had = rec?.hp ?? 0;
    const base = target.maxHp + had;
    const total = Math.max(1, Math.floor(base * def.azamiHpOran));
    const delta = Math.min(Math.max(0, total - had), Math.max(0, target.maxHp - 1));
    if (delta > 0) out.hp = delta;
  }
  if (def.yetenek) {
    const ab = (rec?.yetenek?.ability ?? def.yetenek.yetenek
      ?? [...(def.yetenek.yuksek ?? [])].sort((a, b) => scoreOf(target, b as Ability) - scoreOf(target, a as Ability))[0]) as Ability | undefined;
    if (ab && ab in target.modifiers) {
      const want = def.yetenek.miktar - (rec?.yetenek?.amount ?? 0);
      const before = scoreOf(target, ab);
      const after = Math.max(1, before - Math.max(0, want));
      if (before > after) out.yetenek = { ability: ab, amount: before - after, modDelta: Math.floor((after - 10) / 2) - Math.floor((before - 10) / 2) };
    }
  }
  return out;
}

/** Sakatlığın süren etkisi (kademenin `etki` alanları); etkisiz kademede null. */
export function sakatlikEffect(id: string, kademe: SakatlikKademe): ActiveEffect | null {
  const def = TABLO.sakatliklar[id]?.kademe[kademe];
  if (!def?.etki) return null;
  return { ...(def.etki as Partial<ActiveEffect>), id: `sakatlik:${id}`, name: `Sakatlık: ${def.tr}`, sourceId: '', until: 1_000_000 } as ActiveEffect;
}

/** Reducer yaması: kalıcı liste, azami HP ve yetenek düşüşü (süren etki ayrı: `sakatlikEffect`). */
export function sakatlikPatch(c: Combatant, inj: SakatlikOlayi): Partial<Combatant> {
  const list = c.sakatliklar ?? [];
  const old = list.find((r) => r.id === inj.id);
  const yet = inj.yetenek
    ? { ability: inj.yetenek.ability, amount: (old?.yetenek?.amount ?? 0) + inj.yetenek.amount, mod: (old?.yetenek?.mod ?? 0) + inj.yetenek.modDelta }
    : old?.yetenek;
  const hpLoss = (old?.hp ?? 0) + (inj.hp ?? 0);
  const rec: SakatlikKaydi = { id: inj.id, kademe: inj.kademe, tur: old?.tur ?? inj.tur, ...(hpLoss ? { hp: hpLoss } : {}), ...(yet ? { yetenek: yet } : {}) };
  const patch: Partial<Combatant> = { sakatliklar: old ? list.map((r) => (r.id === inj.id ? rec : r)) : [...list, rec] };
  if (inj.hp) {
    const maxHp = Math.max(1, c.maxHp - inj.hp);
    Object.assign(patch, { maxHp, hp: Math.min(c.hp, maxHp), maxHpLoss: (c.maxHpLoss ?? 0) + (c.maxHp - maxHp) });
  }
  if (inj.yetenek) {
    const ab = inj.yetenek.ability;
    const prev = c.abilityLoss?.[ab] ?? { amount: 0, mod: 0 };
    Object.assign(patch, {
      abilityLoss: { ...c.abilityLoss, [ab]: { amount: prev.amount + inj.yetenek.amount, mod: prev.mod + inj.yetenek.modDelta } },
      modifiers: { ...c.modifiers, [ab]: c.modifiers[ab] + inj.yetenek.modDelta },
      saves: { ...c.saves, [ab]: c.saves[ab] + inj.yetenek.modDelta },
    });
  }
  return patch;
}

/** Görünen ad (S4 arayüzü; dil `tr`/`en`). */
export function sakatlikName(id: string, kademe: SakatlikKademe, lang: 'tr' | 'en' = 'tr'): string {
  return TABLO.sakatliklar[id]?.kademe[kademe]?.[lang] ?? id;
}
