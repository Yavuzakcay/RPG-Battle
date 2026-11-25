/**
 * Görev MC3 (kural sürümü 105; SRD 5.2.1 s. 25–26): çoklu sınıflı oyuncu savaşçısının büyü parçaları.
 * - Kurulum (`mcCombatant`): ayrı Pact havuzu (`pactSlots`), sınıf başına büyü DC'si/saldırısı (`spellByClass`; eşya büyü
 *   bonusu dahil), hazırlanan büyünün sınıfı (`spellClassOf`), varsayılan büyü değiştiricisi ilk büyücü sınıftan.
 * - Yapım (`mcCastView`): `cast_spell` büyünün sınıfının DC/saldırı/değiştiricisiyle ve (`pact` ise) Pact havuzundan
 *   yürütülür. Komut gölge bir durumda çalışır (yalnız büyücünün bu alanları değişir), üretilen olaylar gerçek duruma
 *   uygulanır; Pact'ten harcanan yuva olayda `pact` işaretli (`slot_spent.pact`). Sonradan büyücünün o anki DC'sini okuyan
 *   etkiler (yapımdan sonraki tur) varsayılan sınıfın değerini görür (⚠ DECISIONS.md MC3).
 * Tek sınıflı savaşçıda alanlar yok ve bu modül hiçbir şey değiştirmez.
 */
import type { CharacterSheet } from '../rules/stats';
import { deriveStats } from '../rules/stats';
import { mcImpl } from '../rules/mcHook';
import type { BattleEvent, BattleState, Combatant, Command } from './types';
import { mc3On } from './mc3Surum';

/** Çoklu sınıflı sayfanın savaşçısına büyü parçalarını ekler (`combatantFromSheet`, kural sürümü 105+). */
export function mcCombatant(c: Combatant, sheet: CharacterSheet): Combatant {
  const d = deriveStats(sheet);
  const m = mcImpl().spellcasting(sheet);
  const ab = m.castClass ? m.abilities[m.castClass] : undefined;
  // Eşya büyü bonusu (`combatantFromSheet` varsayılan DC/saldırıya ekler) sınıf başına değerlere de.
  const dcBonus = c.spellSaveDc !== null && d.spellSaveDc !== null ? c.spellSaveDc - d.spellSaveDc : 0;
  const atkBonus = c.spellAttack !== null && d.spellAttack !== null ? c.spellAttack - d.spellAttack : 0;
  return {
    ...c,
    ...(ab ? { spellMod: d.modifiers[ab] } : {}),
    ...(d.pactSlots ? { pactSlots: { level: d.pactSlots.level, max: d.pactSlots.count, left: d.pactSlots.count } } : {}),
    ...(d.spellByClass ? {
      spellByClass: Object.fromEntries(Object.entries(d.spellByClass).map(([k, v]) => [k, { dc: v.dc + dcBonus, attack: v.attack + atkBonus, mod: v.mod }])),
      spellClassOf: mcImpl().spellClassMap(sheet),
    } : {}),
  };
}

/** Pact havuzu dizi biçiminde (yalnız Pact seviyesinde kalan yuva). */
const pactArray = (p: NonNullable<Combatant['pactSlots']>): number[] => [0, 0, 0, 0, 0, 0, 0, 0, 0].map((_, i) => (i === p.level - 1 ? p.left : 0));

/**
 * `cast_spell` için gölge durum: büyücünün büyü değerleri büyünün sınıfından, `pact` ise yuva dizisi Pact havuzu. Gerekmiyorsa
 * null (tek sınıf, sürüm < 105, varsayılan sınıfın büyüsü ve Pact seçilmedi).
 */
export function mcCastView(state: BattleState, cmd: Command): { state: BattleState; mapEvents: (events: BattleEvent[]) => BattleEvent[] } | { error: string } | null {
  if (cmd.type !== 'cast_spell' || !mc3On(state)) return null;
  const c = state.combatants[cmd.actorId];
  if (!c) return null;
  if (cmd.pact && !c.pactSlots) return { error: 'Ayrı Pact havuzu yok.' };
  const cls = c.spellClassOf?.[cmd.spellName];
  const by = cls ? c.spellByClass?.[cls] : undefined;
  if (!cmd.pact && !by) return null;
  if (cmd.pact && (c.pactSlots!.left <= 0)) return { error: 'Pact yuvası kalmadı.' };
  const shadow: Combatant = {
    ...c,
    ...(by ? { spellSaveDc: by.dc, spellAttack: by.attack, spellMod: by.mod } : {}),
    ...(cmd.pact ? { spellSlots: pactArray(c.pactSlots!) } : {}),
  };
  const view = { ...state, combatants: { ...state.combatants, [c.id]: shadow } };
  const mapEvents = (events: BattleEvent[]): BattleEvent[] => (!cmd.pact ? events
    : events.map((e) => (e.type === 'slot_spent' && e.actorId === c.id ? { ...e, pact: true as const } : e)));
  return { state: view, mapEvents };
}
