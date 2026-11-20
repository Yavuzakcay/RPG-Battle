/**
 * SD7: slot seçici yardımcıları (yalnız arayüz; kural ve motor değişmez). Büyü yaparken kullanılabilir slot seviyeleri, seçime göre
 * tek satırlık ek etki metni (mevcut `mechanics.upcast` verisinden; veri yoksa uydurma yok) ve sınırsız yer tutucu değerlerin
 * sayı olarak gösterilmemesi. Saf: DOM bilmez.
 */
import type { Spell } from '../data';
import { parseDice } from '../rules/dice';

/** Bu değer ve üstü "sınırsız yer tutucu" sayılır (ör. Spell Mastery `fixed: 99`); arayüzde sayı olarak görünmez. */
export const UNLIMITED_FROM = 50;
/** Kalan hak sayısı; sınırsız yer tutucuysa null (yalnız etiket). */
export const usesShown = (n: number): number | null => (n >= UNLIMITED_FROM ? null : n);

/** Slot seçicide görünecek seviyeler: yüksek slotla güçlenmeyen büyüde yalnız en düşük kullanılabilir slot. */
export function pickerLevels(usable: number[], spell: Spell): number[] {
  return spell.mechanics.upcast?.applied ? usable : usable.slice(0, 1);
}

/** Etki satırı metinleri (TR/EN `battle.slotEffect`). */
export interface SlotEffectText {
  level: (l: number) => string;
  base: string; noUpcast: string; generic: string;
  damage: (dice: string, extra: boolean) => string; heal: (dice: string, extra: boolean) => string;
  rays: (n: number, extra: boolean) => string; targets: (n: number, extra: boolean) => string; hp: (n: number) => string;
  radius: (ft: number) => string; burst: (dice: string) => string; bonus: (n: number) => string; duration: (rounds: number, concentration: boolean) => string;
  join: string;
}

const diceText = (count: number, sides: number, bonus = 0): string => `${count}d${sides}${bonus > 0 ? `+${bonus}` : bonus < 0 ? `${bonus}` : ''}`;

/** Temel hasar/iyileştirme zarı ve yukarı slot ek zarıyla bu slottaki toplam zar ("10d8"); toplanamıyorsa yalnız eklenen ("+2d8"). */
export function diceAtSlot(spell: Spell, slotLevel: number): { text: string; extra: boolean; heal: boolean } | null {
  const m = spell.mechanics;
  if (!m.damage) return null;
  const above = Math.max(0, slotLevel - spell.level);
  const heal = m.kind === 'heal';
  // İki hasar türlü büyü (Flame Strike, Ice Storm): her parça kendi `upcast` zarıyla ("6d6 fire + 6d6 radiant").
  if (m.split?.length) {
    try {
      const parts = m.split.map((sp) => {
        const b0 = parseDice(sp.dice); const u0 = sp.upcast && m.upcast?.applied ? parseDice(sp.upcast) : null;
        return `${diceText(b0.count + (u0 ? u0.count * above : 0), b0.sides, b0.bonus)} ${sp.type}`;
      });
      return { text: parts.join(' + '), extra: false, heal };
    } catch { /* tek zar */ }
  }
  let b;
  try { b = parseDice(m.damage); } catch { return null; }
  const u = m.upcast?.applied && m.upcast.dice && above > 0 ? parseDice(m.upcast.dice) : null;
  if (!u || u.count === 0) {
    const add = u ? u.bonus * above : 0;
    return { text: b.count > 0 ? diceText(b.count, b.sides, b.bonus + add) : String(b.bonus + add), extra: false, heal };
  }
  if (b.count > 0 && b.sides === u.sides) return { text: diceText(b.count + u.count * above, b.sides, b.bonus), extra: false, heal };
  return { text: `+${diceText(u.count * above, u.sides)}`, extra: true, heal };
}

/** Zarın yarısı ("10d8" → "5d8"; tek sayıda "9d8 ÷ 2"). */
export function halfDice(text: string): string {
  if (text.includes(' + ')) return text.split(' + ').map(halfDice).join(' + ');
  const m = /^(\d+)d(\d+)(.*)$/.exec(text);
  if (!m) return text;
  const n = Number(m[1]);
  return n % 2 === 0 ? `${n / 2}d${m[2]}${m[3]}` : `${text} ÷ 2`;
}

/**
 * Seçilen slotla atılacak zar, olduğu gibi: "5. seviye: 10d8 hasar", "4. seviye: 5d8 iyileştirme", "3. seviye: 4 hedef". Ortalama ya da tahmin yok.
 * Temel seviyede "Temel etki"; yukarı slotla güçlenmeyen büyüde "Bu büyü yüksek slotla güçlenmez; en düşük slot yeterli".
 */
export function slotEffectLine(spell: Spell, slotLevel: number, multi: boolean, tx: SlotEffectText): string {
  const up = spell.mechanics.upcast;
  if (!up?.applied) return multi ? tx.noUpcast : tx.base;
  const above = slotLevel - spell.level;
  if (above <= 0) return tx.base;
  const m = spell.mechanics;
  const parts: string[] = [];
  if (up.dice) {
    const d = diceAtSlot(spell, slotLevel);
    if (d) parts.push((d.heal ? tx.heal : tx.damage)(d.text, d.extra));
  }
  if (up.rays) { const add = up.rays * above; parts.push(m.rays !== undefined ? tx.rays(m.rays + add, false) : tx.rays(add, true)); }
  if (up.targets) {
    const add = up.targets * above;
    const base = m.effect?.targets ?? m.healTargets;
    parts.push(base !== undefined ? tx.targets(base + add, false) : tx.targets(add, true));
  }
  if (up.hp) parts.push(tx.hp(up.hp * above));
  if (up.radiusFt && spell.area) parts.push(tx.radius(up.radiusFt * above));
  if (up.burstDice) {
    const u = parseDice(up.burstDice);
    let text = `+${diceText(u.count * above, u.sides)}`;
    try { const b = m.burst ? parseDice(m.burst.damage) : null; if (b && b.sides === u.sides) text = diceText(b.count + u.count * above, b.sides, b.bonus); } catch { /* yalnız eklenen */ }
    parts.push(tx.burst(text));
  }
  const atLeast = <T,>(table: Record<string, T> | undefined): T | undefined =>
    Object.entries(table ?? {}).filter(([k]) => slotLevel >= Number(k)).sort((a, b) => Number(a[0]) - Number(b[0])).pop()?.[1];
  const bonus = atLeast(up.bonusBySlot);
  if (bonus !== undefined) parts.push(tx.bonus(bonus));
  const dur = atLeast(up.durationBySlot);
  if (dur) parts.push(tx.duration(dur.rounds, dur.concentration !== false));
  return `${tx.level(slotLevel)}${parts.length ? parts.join(tx.join) : tx.generic}`;
}
