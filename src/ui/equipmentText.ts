/**
 * Donanım açıklamaları (Görev H): zırh, kalkan, silah ve eşyanın bir satır özeti ve ayrıntısı.
 * Yalnızca veri alanlarından üretilir (data/armor.json, weapons.json, items.json; SRD 5.2.1 tabloları).
 */
import type { Armor, Item, Weapon } from '../data/types';
import { t } from '../i18n';

const abilityShort = (a: string) => a.toUpperCase();

export function armorSummary(a: Armor): string {
  const e = t().equip;
  const ac = a.type === 'none' ? e.acNone : a.type === 'light' ? e.acLight(a.baseAc) : a.type === 'medium' ? e.acMedium(a.baseAc) : e.acHeavy(a.baseAc);
  return [ac, a.strength !== undefined ? e.strength(a.strength) : '', a.stealthDisadvantage ? e.stealthDis : ''].filter(Boolean).join(' · ');
}

export function armorDetail(a: Armor): string {
  const d = t().equip.armorDetail;
  const first = a.type === 'none' ? d.none : d[a.type](a.baseAc);
  return [first, a.strength !== undefined ? d.strength(a.strength) : '', a.stealthDisadvantage ? d.stealth : ''].filter(Boolean).join(' ');
}

/** Silahın özellik adları (SRD terimleriyle). */
function weaponProps(w: Weapon): string[] {
  const p = t().equip.prop;
  const out: string[] = [];
  if (w.finesse) out.push(p.finesse);
  if (w.light) out.push(p.light);
  if (w.heavy) out.push(p.heavy);
  if (w.twoHanded) out.push(p.twoHanded);
  if (w.reach) out.push(p.reach);
  if (w.versatileDamage) out.push(p.versatile(w.versatileDamage));
  if (w.thrown && w.range) out.push(`${p.thrown} ${p.range(w.range[0], w.range[1])}`);
  if (w.ammunition && w.range) out.push(`${p.ammunition} ${p.range(w.range[0], w.range[1])}`);
  if (w.loading) out.push(p.loading);
  return out;
}

export function weaponSummary(w: Weapon): string {
  const e = t().equip;
  return [`${w.damage} ${e.damageType[w.damageType] ?? w.damageType}`, w.ranged ? e.ranged : e.melee, ...weaponProps(w)].join(' · ');
}

export function weaponDetail(w: Weapon): string {
  const e = t().equip;
  const d = e.propDetail;
  const parts = [e.weaponDetail(w.name, e.category[w.category], w.damage, e.damageType[w.damageType] ?? w.damageType, w.ranged ? e.ranged : e.melee)];
  if (w.finesse) parts.push(d.finesse);
  if (w.light) parts.push(d.light);
  if (w.heavy) parts.push(d.heavy);
  if (w.twoHanded) parts.push(d.twoHanded);
  if (w.reach) parts.push(d.reach);
  if (w.versatileDamage) parts.push(d.versatile(w.versatileDamage));
  if (w.thrown && w.range) parts.push(d.thrown(w.range[0], w.range[1]));
  if (w.ammunition && w.range) parts.push(d.ammunition(w.range[0], w.range[1]));
  if (w.loading) parts.push(d.loading);
  return parts.join(' ');
}

/** Eşyanın oyunda uygulanan etkileri; uygulanmayanlarda verideki açıklama. */
export function itemSummary(it: Item): string {
  const e = t().equip;
  const fx: string[] = [];
  if (it.effects.acBonus) fx.push(e.itemEffect.acBonus(it.effects.acBonus));
  if (it.effects.saveBonus) fx.push(e.itemEffect.saveBonus(it.effects.saveBonus));
  if (it.effects.unarmoredAcBonus) fx.push(e.itemEffect.unarmored(it.effects.unarmoredAcBonus));
  for (const [a, v] of Object.entries(it.effects.setAbility ?? {})) if (v !== undefined) fx.push(e.itemEffect.setAbility(abilityShort(a), v));
  return [...(fx.length ? fx : [it.text]), it.attunement ? e.attunement : ''].filter(Boolean).join(' · ');
}

export function itemDetail(it: Item): string {
  const e = t().equip;
  const auto = Object.keys(it.effects).length > 0;
  return `${it.name}: ${itemSummary(it)}${auto ? '' : ` (${e.noMechanic})`}.`;
}
