/**
 * Süren etkilerin zar eklentileri (Görev R2): savaşçının üzerindeki etkilerden saldırı, save ya da (beceri) kontrol
 * zarına eklenecek ±zarlar. Saf; zarlar `rules/attack.ts` `rollExtras` ile atılır.
 */
import { exhaustionD20Penalty } from '../rules/exhaustion';
import { moraleCheckDice, moraleSaveDice } from './morale';
import { extrasTotal, rollExtras, secondChanceAll, spoilChance, type ExtraDie, type RolledExtra } from '../rules/attack';
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
    .map((e) => ({ label: e.name, die: e.inspire as string, sign: 1, reroll: 'onFail', single: true, effectId: e.id, holderId: c.id,
      // Kuyruk K48 (sürüm 19, `bardicInspirationChain`): önceki ikinci şans tutmazsa ilham zarı yine atılır.
      ...(c.inspireChain ? { chain: true } : {}) }));
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
  // Kuyruk 19 (srdK19): Burst of Ingenuity (Sphinx of Wonder): kendisi ya da 30 ft'teki dostunun başarısız save/kontrolüne +2,
  // yalnızca başarıya çevirecekse; sfenksin tepkisi ve 2/Day havuzu harcanır (`burstBy`: reducer `syncAuras` yazar).
  if (on !== 'attack' && c.burstBy) k18.push({ label: 'Burst of Ingenuity', die: '+2', sign: 1, reroll: 'plus', rerollBonus: 2, reaction: true, holderId: c.burstBy.id, pool: c.burstBy.pool });
  // Kuyruk 19 (Epic Boon): Improve Fate: 60 ft'teki boon sahibi dostun başarısızına +2d4, düşmanın başarısına −2d4.
  if (c.fateBy) k18.push({ label: 'Improve Fate', die: '2d4', sign: 1, reroll: 'onFail', resource: 'improveFate', holderId: c.fateBy });
  if (c.fateFoe) k18.push({ label: 'Improve Fate', die: '2d4', sign: -1, reroll: 'onSuccess', resource: 'improveFate', holderId: c.fateFoe });
  // Kuyruk 19 (Epic Boon): Peerless Aim: ıskalanan saldırı isabet olur (sonraki turuna dek bir).
  if (on === 'attack' && c.k19Traits && c.traits?.includes('peerless-aim') && resourceLeft(c, 'peerlessAim') > 0) {
    k18.unshift({ label: 'Peerless Aim', die: 'hit', sign: 1, reroll: 'success', resource: 'peerlessAim', holderId: c.id });
  }
  // Kuyruk 19 (sihirli eşyalar, Antitoxin): belli durumlara/büyülere karşı save avantajı = başarısızlıkta yeniden atış (olasılık aynı).
  if (on === 'save') {
    const against = [...new Set((c.effects ?? []).flatMap((e) => e.saveAdvAgainst ?? []))];
    // Kuyruk 19 (Rakshasa Greater Magic Resistance): büyülere karşı save kendiliğinden başarılı.
    if (c.traits?.includes('greater-magic-resistance')) k18.push({ label: 'Greater Magic Resistance', die: 'd20', sign: 1, reroll: 'success', against: ['spell'], holderId: c.id });
    else if (against.length) k18.push({ label: 'Avantaj (eşya)', die: 'd20', sign: 1, reroll: 'd20', against, holderId: c.id });
  }
  // Kuyruk 19: Disciplined Survivor (Monk 14): başarısız save 1 Focus ile yeniden atılır.
  if (on === 'save' && c.traits?.includes('disciplined-survivor') && resourceLeft(c, 'focus') > 0) {
    k18.push({ label: 'Disciplined Survivor', die: 'd20', sign: 1, reroll: 'd20', resource: 'focus', holderId: c.id });
  }
  // Kuyruk 19 (Halfling Luck): doğal 1 yeniden atılır (önce; kaynak harcamaz).
  if (c.traits?.includes('halfling-luck')) k18.unshift({ label: 'Luck', die: 'd20', sign: 1, reroll: 'd20', onNatural1: true, holderId: c.id });
  // Kuyruk 18 H3: Heroic Warrior: Heroic Inspiration ile başarısız d20 bir kez yeniden atılır (tur başında yenilenir).
  // Kuyruk 19: Human Resourceful aynı kaynakla (savaş başında bir).
  if ((c.traits?.includes('heroic-warrior') || c.traits?.includes('resourceful')) && resourceLeft(c, 'heroicInspiration') > 0) {
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
  return [...out, ...(c.inspireFix || c.inspireChain ? inspired : []), ...k18];
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
  [...diceOn(c, 'save'), ...saveModDice(c, ability), ...auraDice(c), ...exhaustionDice(c), ...secondChances(c, 'save'), ...mightFloor(c, ability), ...moraleSaveDice(c, ability)];
/** Kuyruk 19: Indomitable Might (Barbarian 18): STR save/kontrol toplamı STR skorundan küçükse skor sayılır. */
const mightFloor = (c: Combatant | undefined, ability?: Ability): ExtraDie[] =>
  c && ability === 'str' && c.traits?.includes('indomitable-might') ? [{ label: 'Indomitable Might', die: 'STR', sign: 1, reroll: 'floor', rerollBonus: c.strScore }] : [];
/** Yetenek kontrolüne (Guidance: seçilen beceri). */
export const checkDice = (c: Combatant | undefined, skill?: string): ExtraDie[] => [...diceOn(c, 'check', skill), ...exhaustionDice(c), ...secondChances(c, 'check'), ...(skill === 'athletics' ? mightFloor(c, 'str') : []), ...moraleCheckDice(c, skill)];

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
    const again = secondChanceAll(dice, { total, natural, bonus, need: dc, mode, kind: 'check' }, rollTag(rng, { by: c.id }));
    if (again) { total = again.total; extra.push(...again.entries); }
  } else if (dc !== null) {
    const spoil = spoilChance(dice, { total, need: dc, kind: 'check' }, rollTag(rng, { by: c.id }));
    if (spoil) { total = spoil.total; extra.push(spoil.entry); }
  }
  return { natural, total, extra };
}
