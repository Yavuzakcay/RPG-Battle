/**
 * Görev D2 (kural sürümü 88): canavar kurulumunun tek girişi. Savaş başında `withMonsterTraits` + `withMonsterAbilities`
 * (srdK19) bütün canavarlara canavar özelliklerini (durum bağışıklığı, Magic Resistance, duyular, tırmanma, auralar, canavar
 * büyüleri) ve yeteneklerini (pasifler, kullanım kaynakları, günlük saldırılar) işler; savaş sırasında eklenen canavar
 * (büyüyle çağrı, kurulum ritüeli, paket çağrısı, canavar yeteneğiyle çağrı, Finger of Death zombisi, Orman takviyesi ve
 * kemik yığını, kum pususu, buz mühür, kat değişimi) 88+'da aynı canavar başı işlevlerden geçer (`monsterTraitSetup`,
 * `monsterAbilitySetup`). 87 ve altı: eski davranış (sonradan eklenen kurulumsuz). Multiattack planı ve etkin yetenekler
 * çalışma anında `monsterId`'den okunur (her yolda vardı). Saf.
 */
import { globalRule } from './ruleControl';
import { monsterTraitSetup } from './monsterTraits';
import { monsterAbilitySetup } from './monsterAbilities';
import { srdD2On } from './srdD2Surum';
import type { Monster } from '../data';
import type { BattleEvent, BattleState, Combatant, SpellZone } from './types';

/** Canavarın kurulumu (savaş başındakiyle aynı işlevler). `m`: `monsters.json`'da olmayan kayıt (çağrı bloğu). */
export function setupMonster(state: BattleState, c: Combatant, m?: Monster): { combatant: Combatant; zones: SpellZone[] } {
  if (!c.monsterId || !globalRule(state, 'srdK19')) return { combatant: c, zones: [] };
  const t = monsterTraitSetup(state, c, m);
  const a = monsterAbilitySetup(state, t.c, m);
  return { combatant: a.c, zones: [...t.zones, ...a.zones] };
}

/** Savaş sırasında eklenen canavar: 88+ kurulumdan geçer, 87 ve altı olduğu gibi. */
export function lateMonster(state: BattleState, c: Combatant, m?: Monster): { combatant: Combatant; zones: SpellZone[] } {
  return srdD2On(state) ? setupMonster(state, c, m) : { combatant: c, zones: [] };
}

/** `summoned` olayı kurulmuş yaratıkla, ardından auraların `zone_created` olayları (yaratık sıraya girdikten sonra). */
export function lateSummonEvents(state: BattleState, ev: Extract<BattleEvent, { type: 'summoned' }>, m?: Monster): BattleEvent[] {
  const r = lateMonster(state, ev.combatant, m);
  return [{ ...ev, combatant: r.combatant }, ...r.zones.map((zone) => ({ type: 'zone_created', zone }) as BattleEvent)];
}
