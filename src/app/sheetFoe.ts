/**
 * Görev DUSMAN-KAGIT-1: karakter kâğıdından düşman. Genel yetenek: kod hiçbir karakter adı ya da kimliği bilmez.
 * - Game Master kurulumu kayıtlı karakteri düşman seçer (`BattlePlan.sheetEnemies`); savaşçı kâğıdın tam (dinlenmiş)
 *   kopyasıdır, sahibi yoktur (`ownerId: null`), savaş sonu karaktere yazılmaz (`applyBattleResult` yalnız partiye bakar).
 * - Serüven/sefer düşman listesinde `kagit:<kimlik>` anahtarı `data/kagit-dusmanlar.json` kaydına gider.
 * - CR (Serüven XP'si) özel canavar tahmininin aynısıyla (`estimateCr`): kâğıdın savaştaki can, AC ve en iyi saldırısı.
 */
import registry from '../../data/kagit-dusmanlar.json';
import { combatantFromSheet, type Combatant } from '../battle';
import { spells } from '../data';
import type { CarryRule } from '../rules/carry';
import { averageDamage, estimateCr, type CrEstimate } from '../rules/crEstimate';
import type { CharacterSheet } from '../rules/stats';

export const KAGIT_PREFIX = 'kagit:';
export const isKagitKey = (key: string): boolean => key.startsWith(KAGIT_PREFIX);

interface KagitKaydi { sheet: CharacterSheet; cr?: string }
const KAYITLAR = (registry as unknown as { kagitlar: Record<string, KagitKaydi> }).kagitlar;

/** `kagit:<kimlik>` anahtarının kaydı (yoksa undefined). */
export function kagitKaydi(key: string): KagitKaydi | undefined {
  return isKagitKey(key) ? KAYITLAR[key.slice(KAGIT_PREFIX.length)] : undefined;
}

/** Kâğıttan düşman savaşçı (tam can, dolu kaynak; sahibi yok). */
export function sheetFoeCombatant(sheet: CharacterSheet, opts: { id: string; name?: string; carryRule?: CarryRule }): Combatant {
  const c = combatantFromSheet(sheet, { id: opts.id, ownerId: '', side: 'enemies', ...(opts.carryRule ? { carryRule: opts.carryRule } : {}) });
  return opts.name ? { ...c, name: opts.name } : c;
}

/**
 * Kâğıdın tahmini CR'si: savaşçının can ve AC'si, en yüksek ortalamalı saldırısı (silah: Attack eyleminin saldırı sayısıyla;
 * hasar cantrip'i ölçeğiyle). Slotlu büyüler hesaba girmez (KARAR GEREKİYOR: büyücülerde düşük kalabilir).
 */
export function sheetFoeCr(sheet: CharacterSheet): CrEstimate {
  return combatantCr(combatantFromSheet(sheet, { id: 'cr', ownerId: '', side: 'enemies' }));
}

/** Savaştaki kâğıt düşmanın CR tahmini (savaş başındaki can ve AC; `sheetFoeCr` ile aynı hesap). */
export function combatantCr(c: Combatant): CrEstimate {
  let best = { attackBonus: 0, damage: '1', perRound: 1 };
  let bestDpr = -1;
  const consider = (attackBonus: number, damage: string, per: number) => {
    let avg = 0;
    try { avg = averageDamage(damage); } catch { return; }
    if (avg * per > bestDpr) { bestDpr = avg * per; best = { attackBonus, damage, perRound: per }; }
  };
  for (const o of c.weaponOptions) consider(o.attackBonus, o.damage.replace(/\s/g, ''), o.spell ? 1 : Math.max(1, c.attacksPerAction));
  // Bilinen hasar cantrip'leri (SRD cantrip ölçeği: 5/11/17. seviyede zar ya da ışın artar). Save'li cantrip'te bonus yerine
  // büyü saldırısı (= DC − 8). Slotlu büyüler hesaba girmez.
  const tier = 1 + (c.level >= 5 ? 1 : 0) + (c.level >= 11 ? 1 : 0) + (c.level >= 17 ? 1 : 0);
  for (const sp of spells.filter((x) => x.level === 0 && c.spellNames.includes(x.name))) {
    const m = sp.mechanics;
    if ((m.kind !== 'attack' && m.kind !== 'save') || !m.damage || c.spellAttack === null) continue;
    const d = /^(\d+)d(\d+)([+-]\d+)?$/.exec(m.damage.replace(/\s/g, ''));
    if (!d) continue;
    const count = Number(d[1]) * (m.scalesWithLevel ? tier : 1);
    const flat = Number(d[3] ?? 0) + (m.addCastingMod ? c.spellMod : 0);
    consider(c.spellAttack, `${count}d${d[2]}${flat ? (flat > 0 ? `+${flat}` : `${flat}`) : ''}`, m.raysByLevel ? tier : 1);
  }
  return estimateCr({ hp: c.maxHp, ac: c.ac, attackBonus: best.attackBonus, damage: best.damage, attacksPerRound: best.perRound });
}

/** Listedeki `kagit:` anahtarının CR'si (kayıttaki `cr`, yoksa tahmin; kayıt yoksa null). */
export function kagitCr(key: string): string | null {
  const k = kagitKaydi(key);
  return k ? k.cr ?? sheetFoeCr(k.sheet).cr : null;
}
