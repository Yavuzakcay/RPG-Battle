/**
 * Süren etkilerin zar eklentileri (Görev R2): savaşçının üzerindeki etkilerden saldırı, save ya da (beceri) kontrol
 * zarına eklenecek ±zarlar. Saf; zarlar `rules/attack.ts` `rollExtras` ile atılır.
 */
import { exhaustionD20Penalty } from '../rules/exhaustion';
import { extrasTotal, rollExtras, secondChance, type ExtraDie, type RolledExtra } from '../rules/attack';
import { rollTag, type Rng, type RollMode } from '../rules/dice';
import { resourceLeft, type Combatant } from './types';
import type { Ability } from '../rules/abilities';

function diceOn(c: Combatant | undefined, on: 'attack' | 'save' | 'check', skill?: string): ExtraDie[] {
  return (c?.effects ?? [])
    .filter((e) => e.dice?.on.includes(on) && (on !== 'check' || !e.dice.skill || e.dice.skill === skill))
    .map((e) => ({ label: e.name, die: e.dice?.die ?? '1d4', sign: e.dice?.sign ?? 1, effectId: e.id, holderId: c?.id ?? '',
      ...(e.dice?.single ? { single: true } : {}) }));
}

/**
 * Görev F: başarısız zardan sonra ikinci şans (sınıf özelliği işaretlerinden; `rules/attack.ts` `secondChance`).
 * Indomitable: başarısız save yeniden atılır, + Fighter seviyesi. Stroke of Luck: başarısız D20 Testi 20 sayılır.
 * Tactical Mind: başarısız kontrole 1d10; tutarsa Second Wind harcanır.
 */
function secondChances(c: Combatant | undefined, on: 'attack' | 'save' | 'check'): ExtraDie[] {
  if (!c) return [];
  // Görev BARD: Bardic Inspiration (dosttaki süren etki): başarısız D20 Testine zar; atılınca etki biter.
  const inspired: ExtraDie[] = (c.effects ?? []).filter((e) => e.inspire)
    .map((e) => ({ label: e.name, die: e.inspire as string, sign: 1, reroll: 'onFail', single: true, effectId: e.id, holderId: c.id }));
  // Kuyruk 43: Legendary Resistance (SRD 5.2.1; günde N): başarısız save'i başarıya çevirir; boss'un turları arasında en
  // çok bir kez (`lrLock`, kendi turunun başında kalkar: aynı tur içinde art arda harcamaz).
  if (on === 'save' && resourceLeft(c, 'legendaryResistance') > 0 && !c.lrLock) {
    return [{ label: 'Legendary Resistance', die: 'LR', sign: 1, reroll: 'success', resource: 'legendaryResistance', holderId: c.id }, ...inspired];
  }
  // Kuyruk 18 H3: Countercharm (Bard 7): 30 ft içindeki Bard'ın tepkisiyle Charmed/Frightened save'i avantajla yeniden
  // atılır (`countercharmBy`: reducer `syncAuras` yazar).
  const k18: ExtraDie[] = [];
  if (on === 'save' && c.countercharmBy) {
    k18.push({ label: 'Countercharm', die: 'd20', sign: 1, reroll: 'd20', rerollMode: 'advantage', against: ['Charmed', 'Frightened'], reaction: true, holderId: c.countercharmBy });
  }
  // Kuyruk 19: Disciplined Survivor (Monk 14): başarısız save 1 Focus ile yeniden atılır.
  if (on === 'save' && c.traits?.includes('disciplined-survivor') && resourceLeft(c, 'focus') > 0) {
    k18.push({ label: 'Disciplined Survivor', die: 'd20', sign: 1, reroll: 'd20', resource: 'focus', holderId: c.id });
  }
  // Kuyruk 18 H3: Heroic Warrior: Heroic Inspiration ile başarısız d20 bir kez yeniden atılır (tur başında yenilenir).
  if (c.traits?.includes('heroic-warrior') && resourceLeft(c, 'heroicInspiration') > 0) {
    k18.push({ label: 'Heroic Inspiration', die: 'd20', sign: 1, reroll: 'd20', resource: 'heroicInspiration', holderId: c.id });
  }
  const traits = c.traits;
  // Not (Kuyruk 18): kural sürümü < 16'da işaretli savaşçıda `inspired` aşağıda düşüyor (eski davranış; replay için korunur).
  // Kuyruk 19: `inspireFix` (reducer `syncAuras`, Game Master anahtarı `bardicInspirationFix`) varken listede kalır.
  if (!traits?.length) return [...inspired, ...k18];
  const out: ExtraDie[] = [];
  if (traits.includes('stroke-of-luck') && resourceLeft(c, 'strokeOfLuck') > 0) {
    out.push({ label: 'Stroke of Luck', die: '20', sign: 1, reroll: 'twenty', resource: 'strokeOfLuck', holderId: c.id });
  }
  if (on === 'save' && traits.includes('indomitable') && resourceLeft(c, 'indomitable') > 0) {
    out.push({ label: 'Indomitable', die: 'd20', sign: 1, reroll: 'd20', rerollBonus: c.level, resource: 'indomitable', holderId: c.id });
  }
  // Görev WARLOCK: Dark One's Own Luck (Fiend): başarısız kontrol ya da save'e 1d10; tutarsa kullanım harcanır.
  if (on !== 'attack' && traits.includes('dark-ones-own-luck') && resourceLeft(c, 'darkOnesLuck') > 0) {
    out.push({ label: "Dark One's Own Luck", die: '1d10', sign: 1, reroll: 'onFail', resource: 'darkOnesLuck', holderId: c.id });
  }
  // Kuyruk 19 (11–20): Peerless Skill (Lore 14): başarısız kontrol ya da saldırıya Bardic Inspiration zarı; yine başarısızsa harcanmaz.
  if (on !== 'save' && c.k19Traits && traits.includes('peerless-skill') && resourceLeft(c, 'bardicInspiration') > 0) {
    const die = (c.features ?? []).map((f) => f.effect).find((e) => e.kind === 'inspire');
    out.push({ label: 'Peerless Skill', die: die?.kind === 'inspire' ? die.die ?? '1d6' : '1d6', sign: 1, reroll: 'onFail', resource: 'bardicInspiration', holderId: c.id });
  }
  if (on === 'check' && traits.includes('tactical-mind') && resourceLeft(c, 'secondWind') > 0) {
    out.push({ label: 'Tactical Mind', die: '1d10', sign: 1, reroll: 'onFail', resource: 'secondWind', holderId: c.id });
  }
  return [...out, ...(c.inspireFix ? inspired : []), ...k18];
}

/** Görev S1: bitkinlik (Exhaustion) her d20 Testine −2 × seviye (sabit eklenti; zar atılmaz). */
function exhaustionDice(c: Combatant | undefined): ExtraDie[] {
  const p = exhaustionD20Penalty(c?.exhaustion);
  return p > 0 ? [{ label: `Exhaustion ${c?.exhaustion ?? 0}`, die: String(p), sign: -1 }] : [];
}

/** Saldırı zarına (Bless +1d4, Bane −1d4). */
export const attackDice = (c: Combatant | undefined): ExtraDie[] => [...diceOn(c, 'attack'), ...exhaustionDice(c), ...secondChances(c, 'attack')];
/** CILA: süren etkinin save'e sabit eklentisi (Slow: DEX −2; zar atılmaz). */
function saveModDice(c: Combatant | undefined, ability: Ability | undefined): ExtraDie[] {
  if (!ability) return [];
  return (c?.effects ?? []).filter((e) => e.saveMod?.[ability]).map((e) => {
    const v = e.saveMod?.[ability] ?? 0;
    return { label: e.name, die: String(Math.abs(v)), sign: v < 0 ? -1 as const : 1 as const };
  });
}

/** Kuyruk 18 H3: dost Paladin'in Aura of Protection'ı (sabit eklenti; `syncAuras` yazar). */
const auraDice = (c: Combatant | undefined): ExtraDie[] => (c?.auraSave ? [{ label: 'Aura of Protection', die: String(c.auraSave), sign: 1 }] : []);

/** Kurtarma zarına (Bless, Bane; CILA: yetenek verilirse sabit eklentiler, Slow DEX −2). */
export const saveDice = (c: Combatant | undefined, ability?: Ability): ExtraDie[] =>
  [...diceOn(c, 'save'), ...saveModDice(c, ability), ...auraDice(c), ...exhaustionDice(c), ...secondChances(c, 'save'), ...mightFloor(c, ability)];
/** Kuyruk 19: Indomitable Might (Barbarian 18): STR save/kontrol toplamı STR skorundan küçükse skor sayılır. */
const mightFloor = (c: Combatant | undefined, ability?: Ability): ExtraDie[] =>
  c && ability === 'str' && c.traits?.includes('indomitable-might') ? [{ label: 'Indomitable Might', die: 'STR', sign: 1, reroll: 'floor', rerollBonus: c.strScore }] : [];
/** Yetenek kontrolüne (Guidance: seçilen beceri). */
export const checkDice = (c: Combatant | undefined, skill?: string): ExtraDie[] => [...diceOn(c, 'check', skill), ...exhaustionDice(c), ...secondChances(c, 'check'), ...(skill === 'athletics' ? mightFloor(c, 'str') : [])];

/**
 * Görev F, Reliable Talent: yetkin olunan becerinin kontrolünde 9 ve altı d20 10 sayılır (`skills` yalnızca yetkin
 * becerileri tutar).
 */
export function checkNatural(c: Combatant, skill: string, natural: number): number {
  return natural < 10 && c.traits?.includes('reliable-talent') && skill in c.skills ? 10 : natural;
}

/**
 * Beceri kontrolünün zar sonrası kısmı (Görev F): Reliable Talent, eklenti zarları (Guidance), DC varsa başarısızlıkta
 * ikinci şans (Tactical Mind, Stroke of Luck). `bonusDice` olayın kaynak tüketimi için.
 */
export function finishCheck(
  c: Combatant, skill: string, kept: number, bonus: number, dc: number | null, mode: RollMode, rng: Rng,
): { natural: number; total: number; extra: RolledExtra[] } {
  const natural = checkNatural(c, skill, kept);
  const dice = checkDice(c, skill);
  const extra = rollExtras(dice, 'check', rollTag(rng, { by: c.id }));
  let total = natural + bonus + extrasTotal(extra);
  if (dc !== null && total < dc) {
    const again = secondChance(dice, { total, natural, bonus, need: dc, mode, kind: 'check' }, rollTag(rng, { by: c.id }));
    if (again) { total = again.total; extra.push(again.entry); }
  }
  return { natural, total, extra };
}
