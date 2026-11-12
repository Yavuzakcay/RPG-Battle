/**
 * Kuyruk AS1b (kural sürümü 71, `altSoySurum.ts`): alt soy mekaniğinin savaş tarafı. Veri `data/races.json`
 * `lineages[].etki` (kodda alt soy adıyla koşul yok): karakter türetmesi `rules/lineage.ts` `lineageEtki`; burada
 * - savaşçıya süren etki (`soy:<tür>/<soy>`: alanlar `ActiveEffect` alanlarıdır: saveDis, checkDis, saveDisVs, checkDisSkill,
 *   concDis, fallMult, teleportEnds, plantWalker, swim, zorluArazideHiz, soyHarita) ve kullanılabilir özellik (Kanat Süzülüşü);
 * - savaş başında haritaya bağlı koşullar (`withSoy`): gün ışığında saldırı dezavantajı, iç mekânda saldırı/inisiyatif farkı;
 * - sorgular: kontrol dezavantajı (beceri + ışık/su/yerleşim koşulu), kurtarma dezavantajı (hasar türü/durum), düşme çarpanı.
 * Yorumlar (SRD'de yazmıyor): "gün ışığı" = karanlık kavramı olmayan harita (Sunlight Sensitivity gibi) ya da Daylight alanı; "iç mekân" =
 * varyantı tavanlı harita; "yerleşim" = bölgesi `yerlesim`/`sehir` olan harita; "suda" = ıslak zemin etiketli altıgen; Celestial
 * Parlayan Ruh'un "karanlıkta" cezası parıltısı kendi ışığını verdiği için harita düzeyinde (karanlık harita) sayılır.
 */
import { lineageName, lineageEtki, lineageOf } from '../rules/lineage';
import type { Offset } from '../rules/hex';
import { SKILLS, type Skill } from '../rules/skills';
import type { CharacterSheet } from '../rules/stats';
import soy from '../../data/alt-soy.json';
import { maps } from '../map/maps';
import { ceilingFt } from './altitude';
import { altSoyOn, registerSoyCheck } from './altSoySurum';
export { isPlantZone, plantChar, saveDisVs, soyFallMult, soyPlantWalker, soyTeleportEnds, type SaveCtx } from './altSoySurum';
import { ucusBody } from './flightPrim';
import { hasDarkness, lightLevelAt } from './maprules';
import { terrainTags } from './terrainSpell';
import { terrainAt } from './movement';
import { zoneMoveCost } from './zones';
import type { ActiveEffect, BattleEvent, BattleState, Combatant, UsableFeature } from './types';

export const SOY_EFFECT = 'soy:';
export const SOY_FEATURE = 'alt:';

/** Karakterin alt soyundan savaşa süren etki (sürüm ≥ 71'de oluşan savaşçı; `lineageEtki` kapalıysa boş). */
export function soyEffects(sheet: CharacterSheet, id: string): ActiveEffect[] {
  const e = lineageEtki(sheet);
  const l = lineageOf(sheet);
  if (!e || !l) return [];
  const fx = { ...(e.efekt ?? {}), ...(e.harita ? { soyHarita: e.harita } : {}) } as Partial<ActiveEffect>;
  if (Object.keys(fx).length === 0) return [];
  return [{ id: `${SOY_EFFECT}${sheet.raceId}/${l.id}`, name: lineageName(l, 'tr'), sourceId: id, ...fx }];
}

/** Alt soyun kullanılabilir özelliği (Kanat Süzülüşü): `ucus` parametreleriyle kendine süreli uçuş/süzülme etkisi. */
export function soyFeatures(sheet: CharacterSheet, speed: number): UsableFeature[] {
  const o = lineageEtki(sheet)?.ozellik;
  if (!o) return [];
  const p = o.ucus as Record<string, unknown>;
  const rounds = typeof p.sureDakika === 'number' ? Math.max(1, Math.round(p.sureDakika * 10)) : 10;
  return [{
    key: `${SOY_FEATURE}${sheet.raceId}/${o.anahtar}`, name: o.ad.tr, type: o.tur, resource: `${SOY_EFFECT}${o.anahtar}`,
    ...(o.zirhYok ? { noArmor: o.zirhYok } : {}),
    effect: { kind: 'selfEffect', rounds, effect: ucusBody(p, speed, () => speed) as Record<string, unknown> },
  }];
}

/** Zırh kısıtı sorunu (özellik kullanılamıyorsa metin). */
export function soyFeatureProblem(actor: Combatant, f: UsableFeature): string | null {
  if (f.noArmor?.includes('heavy') && actor.heavyArmor) return `${f.name}: ağır zırhla kullanılamaz.`;
  if (f.noArmor?.includes('medium') && actor.mediumArmor) return `${f.name}: orta zırhla kullanılamaz.`;
  return null;
}

const mapRecord = (state: Pick<BattleState, 'map'>) => maps.find((m) => m.id === state.map?.id);
/** İç mekân haritası (varyantın tavanı var). */
export const indoorMap = (state: Pick<BattleState, 'kuralSurumu' | 'map'>): boolean => !!state.map && ceilingFt(state) !== null;
/** Yerleşim haritası (kasaba, şehir, han). */
export const settlementMap = (state: Pick<BattleState, 'map'>): boolean => !!state.map && (soy.yerlesimBolgeleri as string[]).includes(mapRecord(state)?.bolge ?? '');

/** Savaşçının kontrol dezavantajının koşulu şu an sağlanıyor mu. */
function whenOk(state: BattleState, c: Combatant, when: string | undefined): boolean {
  if (!when) return true;
  if (when === 'darkMap') return hasDarkness(state);
  if (when === 'settlement') return settlementMap(state);
  if (!c.pos || !state.map) return false;
  if (when === 'bright') return lightLevelAt(state, c.pos) === 'bright';
  if (when === 'water') return terrainTags(state, c.pos).includes('islak');
  return false;
}

/** Bu beceri kontrolü alt soy etkisiyle dezavantajlı mı (süren etkilerin `checkDisSkill` kaydı). */
export function soyCheckDis(state: BattleState, c: Combatant, skill: Skill): boolean {
  for (const e of c.effects ?? []) for (const r of e.checkDisSkill ?? []) {
    if (r.skill && r.skill !== skill) continue;
    if (r.ability && SKILLS[skill].ability !== r.ability) continue;
    if (whenOk(state, c, r.when)) return true;
  }
  return false;
}


/** İç mekân inisiyatif farkı (savaşçıdan önce zar atılırken; sürüm ≥ 71 ve etki varsa). */
export function soyInitMod(c: Combatant, state: Pick<BattleState, 'kuralSurumu' | 'map'>): number {
  if (!altSoyOn(state) || !indoorMap(state)) return 0;
  return (c.effects ?? []).reduce((n, e) => n + (e.soyHarita?.icMekanInisiyatif ?? 0), 0);
}

/**
 * Savaş başı: sürüm ≥ 71 değilse alt soy etkileri kaldırılır (karakter türetmesi başka yerde); sürüm ≥ 71'de haritaya bağlı
 * koşullar çözülür: gün ışığında saldırı dezavantajı (Sunlight Sensitivity gibi etki + Daylight alanı için özellik işareti),
 * iç mekânda silah ve büyü saldırı bonusu farkı.
 */
export function withSoy(state: BattleState): BattleState {
  const on = altSoyOn(state);
  const combatants: Record<string, Combatant> = {};
  let changed = false;
  for (const [id, c] of Object.entries(state.combatants)) {
    const mine = (c.effects ?? []).filter((e) => e.id.startsWith(SOY_EFFECT));
    const hasFeature = (c.features ?? []).some((f) => f.key.startsWith(SOY_FEATURE));
    if (mine.length === 0 && !hasFeature) { combatants[id] = c; continue; }
    changed = true;
    if (!on) {
      combatants[id] = { ...c, effects: (c.effects ?? []).filter((e) => !e.id.startsWith(SOY_EFFECT)), features: (c.features ?? []).filter((f) => !f.key.startsWith(SOY_FEATURE)) };
      continue;
    }
    let next: Combatant = c;
    const extra: ActiveEffect[] = [];
    for (const e of mine) {
      const h = e.soyHarita;
      if (!h || !state.map) continue;
      if (h.gunisigiSaldiriDez) {
        if (!hasDarkness(state)) extra.push({ id: `${e.id}:gunisigi`, name: e.name, sourceId: e.sourceId, attackDis: {} });
        next = { ...next, traits: [...new Set([...(next.traits ?? []), 'sunlight-sensitive'])] };
      }
      if (h.icMekanSaldiri && indoorMap(state)) {
        const n = h.icMekanSaldiri;
        next = { ...next, weaponOptions: next.weaponOptions.map((o) => ({ ...o, attackBonus: o.attackBonus + n })),
          ...(next.spellAttack !== null && next.spellAttack !== undefined ? { spellAttack: next.spellAttack + n } : {}) };
      }
    }
    combatants[id] = extra.length ? { ...next, effects: [...(next.effects ?? []), ...extra] } : next;
  }
  return changed ? { ...state, combatants } : state;
}

/**
 * Tur başı (alt soy etkisi `zorluArazideHiz`, Khadyrga): turun başında zorlu arazi altıgeninde (zemin ya da alan) duran
 * yaratığın o tur hızı 5 ft azalır (yorum: SRD'de yok; hareketten `burnMove` olarak düşülür).
 */
export function soyTurnStartEvents(state: BattleState, id: string): BattleEvent[] {
  const c = state.combatants[id];
  if (!c?.pos || !state.map) return [];
  const n = (c.effects ?? []).reduce((sum, e) => sum + (e.zorluArazideHiz ?? 0), 0);
  if (n >= 0) return [];
  const at = c.pos as Offset;
  const difficult = terrainAt(state, at).movement === 'difficult' || (zoneMoveCost(state, c)(at) ?? 0) > 1;
  return difficult ? [{ type: 'map_effect', rule: 'soy', targetId: id, text: `zorlu arazide hız ${n} ft`, burnMove: Math.ceil(-n / 5) }] : [];
}

registerSoyCheck(soyCheckDis);
