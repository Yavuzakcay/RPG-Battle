/**
 * Soy metinleri (Görev K3): seçim kartlarının özeti ve soy yeteneklerinin oyundaki durumu, geçerli dilde. Kural
 * modülü (`rules/lineage.ts`) dil dosyasını bilmez; notlar buradan verilir.
 */
import type { Lineage } from '../data';
import { lineageAbilities, lineageOf, lineageSummary, type LineageAbility } from '../rules/lineage';
import type { CharacterSheet } from '../rules/stats';
import { getLang, t } from '../i18n';

/** Goliath seçeneklerinin oyundaki durumu (yalnızca ipucunda). */
const GIANT_STATUS: Record<NonNullable<Lineage['giant']>, 'ok' | 'partial'> = {
  cloud: 'partial', fire: 'partial', frost: 'partial', hill: 'partial', stone: 'partial', storm: 'ok',
};

/** Seçili soyun bu seviyedeki yetenekleri ("Drow: Faerie Fire"), notlarıyla. */
export function lineageAbilityList(sheet: Pick<CharacterSheet, 'raceId' | 'lineageId' | 'level'>): LineageAbility[] {
  const W = t().builder.wiz;
  const giant = Object.fromEntries(Object.entries(GIANT_STATUS).map(([k, status]) => [k, { status, ...(W.giantNote[k] ? { note: W.giantNote[k] } : {}) }]));
  return lineageAbilities(sheet, getLang(), { notInGame: W.notInGame, offCombat: W.offCombat, giant: giant as never });
}

/** "Drow — Karanlık görüş 120 ft · …" (özet paneli ve karakter kartı); soyu olmayan türde null. */
export function lineageLine(sheet: Pick<CharacterSheet, 'raceId' | 'lineageId'>): string | null {
  const l = lineageOf(sheet);
  return l ? `${l.name} — ${lineageSummary(l, getLang())}` : null;
}

/** Bilgi ipucunun metni: oyunda olmayan ya da kısmi yetenekte not. */
export const abilityTip = (a: LineageAbility): string | null => (a.status === 'ok' ? null : a.note ?? t().builder.wiz.notInGame);
