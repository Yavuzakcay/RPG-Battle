/**
 * Kuyruk 19 (SRD denetimi, görev 7): sihirli eşyaların savaş etkileri (`data/items.json`). Savaşçı oluşturulurken:
 * - `passive`: kalıcı süren etki `item:<id>` (direnç, uçuş, karanlık görüş, save avantajı, AC…; mevcut etki makinesi);
 * - `bonus.weapon`: bütün silah saldırılarına saldırı/hasar; `bonus.spell`: büyü saldırısı ve DC'si;
 * - `onHit`: silah isabetinde ek hasar (`itemHits`, yaratık türüne ve yakın/menzilliye göre);
 * - `spells` + `charges`: yüklü büyüler slotsuz yapılır (kaynak `item:<id>`, DC/saldırı eşyanınki).
 * Hepsi `srdK19` anahtarına bağlı (kapalıyken savaş başında kaldırılır: `create.ts` `stripItemsWhenOff`).
 */
import { items, type Item } from '../data';
import type { ActiveEffect, AttackOption, Combatant } from './types';


export type ItemHit = { label: string; dice: string; type: string; vs?: string[]; ranged?: boolean; melee?: boolean; critOnly?: boolean };

/** Bu saldırıya uygulanacak eşya isabet ekleri. */
export function itemHitsFor(actor: Combatant, option: AttackOption, target: Combatant, natural20 = false): ItemHit[] {
  const type = (target.creatureType ?? '').toLowerCase();
  return (actor.itemHits ?? []).filter((h) => (!h.critOnly || natural20) && (!h.vs || h.vs.includes(type)) && (!h.ranged || option.ranged) && (!h.melee || !option.ranged));
}

/** Karakterin etkin (ayarlanmış) eşyalarından savaşçı parçaları. */
export interface ItemParts {
  traits: string[]; fallReduction: number; noStealthDis: boolean; rangedReduce?: string;
  effects: ActiveEffect[]; hits: ItemHit[]; casts: Record<string, { dc?: number; attack?: number }>; spellBonus: number;
  addSpells: string[]; addResources: Record<string, number>; addFree: Record<string, string>; weaponBonus: number;
}
export function itemParts(owned: string[], ownerId: string): ItemParts {
  const list = owned.map((n) => items.find((i) => i.name === n)).filter((i): i is Item => !!i);
  const effects: ActiveEffect[] = [];
  const hits: ItemHit[] = [];
  const addSpells: string[] = [];
  const addResources: Record<string, number> = {};
  const addFree: Record<string, string> = {};
  const casts: Record<string, { dc?: number; attack?: number }> = {};
  const traits: string[] = [];
  let fallReduction = 0;
  let noStealthDis = false;
  let rangedReduce: string | undefined;
  let weaponBonus = 0;
  let spellBonus = 0;
  for (const it of list) {
    if (it.passive) {
      // Savaşçı alanına giden özel anahtarlar (işaretler, düşme, gizlilik, eldiven tepkisi); kalanı süren etki.
      const { traits: tr, fallReduction: fr, noStealthDis: ns, rangedReduce: rr, ...rest } = it.passive as Record<string, unknown>;
      for (const t of (tr as string[] | undefined) ?? []) if (!traits.includes(t)) traits.push(t);
      if (typeof fr === 'number') fallReduction = Math.max(fallReduction, fr);
      if (ns) noStealthDis = true;
      if (typeof rr === 'string') rangedReduce = rr;
      if (Object.keys(rest).length) effects.push({ ...(rest as Partial<ActiveEffect>), id: `item:${it.id}`, name: it.name, sourceId: ownerId } as ActiveEffect);
    }
    if (it.onHit) hits.push({ label: it.onHit.label ?? it.name, dice: it.onHit.dice, type: it.onHit.type, ...(it.onHit.vs ? { vs: it.onHit.vs } : {}), ...(it.onHit.ranged ? { ranged: true } : {}), ...(it.onHit.melee ? { melee: true } : {}), ...(it.onHit.critOnly ? { critOnly: true } : {}) });
    weaponBonus = Math.max(weaponBonus, it.bonus?.weapon ?? 0);
    spellBonus = Math.max(spellBonus, it.bonus?.spell ?? 0);
    if (it.spells?.length) {
      const res = `item:${it.id}`;
      addResources[res] = it.charges ?? 1;
      casts[res] = { ...(it.dc ? { dc: it.dc } : {}), ...(it.attack ? { attack: it.attack } : {}) };
      for (const sp of it.spells) { addFree[sp.name] ??= res; addSpells.push(sp.name); }
    }
  }
  return { traits, fallReduction, noStealthDis, ...(rangedReduce ? { rangedReduce } : {}), effects, hits, casts, spellBonus, addSpells, addResources, addFree, weaponBonus };
}

/**
 * Kuyruk 19: süreli eşya etkisinden saldırı ve hasar bonusu: Oil of Sharpness (`weaponPlus`), Potion of Giant Strength
 * (`strFloor`: STR saldırısında skor farkının değiştiricisi). Büyü saldırısına uygulanmaz.
 */
export function itemAttackPlus(actor: Combatant, option: AttackOption, on: boolean): number {
  if (!on || option.spell) return 0;
  const fx = actor.effects ?? [];
  const plus = Math.max(0, ...fx.map((e) => e.weaponPlus ?? 0));
  const floor = Math.max(0, ...fx.map((e) => e.strFloor ?? 0));
  const str = option.ability === 'str' && floor > actor.strScore ? Math.floor((floor - 10) / 2) - Math.floor((actor.strScore - 10) / 2) : 0;
  return plus + Math.max(0, str);
}
