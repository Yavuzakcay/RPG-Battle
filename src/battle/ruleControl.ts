/**
 * Kuyruk 24: Game Master'ın harita mekaniklerini açıp kapatması ve parametrelerini düzenlemesi (`data/kural-kontrol.json`).
 * Seçimler savaşın başlangıç durumunda (`MapState.ruleToggles`, `MapState.ruleParams`; `battle_started` olayı) durur,
 * yalnızca varsayılandan farklıysa yazılır: kayıtsız (eski) savaş eskisi gibi oynar, replay aynı. `activeRules`
 * (maprules) kapalı kuralı yok sayar ve parametreleri kuralın üstüne yazar; kapalı kuralın görseli, zemini ve nesneleri
 * aynı kalır. Kuralın `surum` alanı (Kuyruk 24 mekanikleri 3) kural sürümü daha eski savaşlarda kuralı kapatır. Saf.
 */
import data from '../../data/kural-kontrol.json';
import { getMap, type MapRuleData } from '../map/maps';
import type { BattleState, MapState } from './types';

export type RuleParamType = 'int' | 'dice' | 'dir';
export interface RuleParamSpec { key: string; type: RuleParamType; min?: number; max?: number; tr: string; en: string }
export interface RuleControlSpec { tr: string; en: string; default?: boolean; params: RuleParamSpec[];
  /** Kuyruk 24c: harita bağımsız mekanik (her haritada; değerler `defaults` + parametreler; `surum` gereken kural sürümü). */
  global?: boolean; surum?: number; defaults?: Record<string, RuleParamValue>;
  /** Kuyruk 26: yalnızca yükseklik katmanı (`heights`) olan haritalarda (panelde ve motorda). */
  heights?: boolean }
export const RULE_CONTROL = data.rules as unknown as Record<string, RuleControlSpec>;
export const WIND_DIRS = ['N', 'NE', 'SE', 'S', 'SW', 'NW'] as const;
export type RuleParamValue = number | string;
export type RuleParams = Record<string, Record<string, RuleParamValue>>;

/** Simülasyon (`--kural-kapali`, `--kural-acik`): Game Master seçimi verilmeyen savaşların varsayılan anahtarları. */
let defaultToggles: Record<string, boolean> = {};
export const setDefaultRuleToggles = (t: Record<string, boolean>): void => { defaultToggles = { ...t }; };
export const defaultRuleToggles = (): Record<string, boolean> => defaultToggles;

/** Kural bu savaşta açık mı (Game Master seçimi > veri varsayılanı; denetlenmeyen kural hep açık). */
export function ruleEnabled(map: Pick<MapState, 'ruleToggles'> | undefined, id: string): boolean {
  const spec = RULE_CONTROL[id];
  if (!spec) return true;
  return map?.ruleToggles?.[id] ?? spec.default !== false;
}

/** Kuralın Game Master parametreleriyle birleşmiş hâli. */
export function withParams(r: MapRuleData, params: RuleParams | undefined): MapRuleData {
  const p = params?.[r.id];
  return p ? { ...r, ...p } : r;
}

/** Kuyruk 24c: harita bağımsız mekanikler (her haritada denetlenir). */
const GLOBAL_RULES = (layered = false): Array<{ rule: MapRuleData; spec: RuleControlSpec }> =>
  Object.entries(RULE_CONTROL).filter(([, spec]) => spec.global && (!spec.heights || layered)).map(([id, spec]) => ({ rule: { id, ...(spec.defaults ?? {}) }, spec }));

/** Varyantın Game Master'ın denetleyebildiği kuralları (kurulum paneli) + harita bağımsız mekanikler. */
export function controllableRules(mapId: string, variantId: string): Array<{ rule: MapRuleData; spec: RuleControlSpec }> {
  const map = getMap(mapId);
  const variant = map.variants.find((v) => v.id === variantId) ?? map.variants[0];
  return [...(variant?.rules ?? []).filter((r) => RULE_CONTROL[r.id] && !RULE_CONTROL[r.id]?.global).map((r) => ({ rule: r, spec: RULE_CONTROL[r.id] as RuleControlSpec })), ...GLOBAL_RULES(!!map.heights)];
}

/**
 * Kuyruk 24c: harita bağımsız mekaniğin bu savaştaki değeri (`defaults` + Game Master parametreleri); kural sürümü yetmiyorsa
 * ya da Game Master kapattıysa undefined. Haritasız savaşta da varsayılanla çalışır.
 */
export function globalRule(state: Pick<BattleState, 'map' | 'kuralSurumu'>, id: string): MapRuleData | undefined {
  const spec = RULE_CONTROL[id];
  if (!spec?.global || (state.kuralSurumu ?? 1) < (spec.surum ?? 1) || !ruleEnabled(state.map, id)) return undefined;
  if (spec.heights && !state.map?.heights) return undefined;
  return { id, ...(spec.defaults ?? {}), ...(state.map?.ruleParams?.[id] ?? {}) };
}

/** Parametre değeri geçerli mi (arayüz ve doğrulama). */
export function validParam(spec: RuleParamSpec, v: unknown): boolean {
  if (spec.type === 'int') return typeof v === 'number' && Number.isInteger(v) && v >= (spec.min ?? -Infinity) && v <= (spec.max ?? Infinity);
  if (spec.type === 'dir') return typeof v === 'string' && (WIND_DIRS as readonly string[]).includes(v);
  return typeof v === 'string' && /^\d{1,2}d(4|6|8|10|12|20)( ?[+-] ?\d{1,2})?$/.test(v.trim());
}

/**
 * Kurulum seçiminden durumda saklanacak alanlar: varsayılandan farklı anahtarlar ve geçerli, kuraldakinden farklı
 * parametreler. Boşsa alan yazılmaz.
 */
export function controlState(mapId: string, variantId: string, toggles: Record<string, boolean> | undefined, params: RuleParams | undefined):
  { ruleToggles?: Record<string, boolean>; ruleParams?: RuleParams } {
  const out: { ruleToggles?: Record<string, boolean>; ruleParams?: RuleParams } = {};
  for (const { rule, spec } of controllableRules(mapId, variantId)) {
    const on = toggles?.[rule.id];
    if (on !== undefined && on !== (spec.default !== false)) out.ruleToggles = { ...out.ruleToggles, [rule.id]: on };
    for (const ps of spec.params) {
      const v = params?.[rule.id]?.[ps.key];
      if (v === undefined || v === rule[ps.key] || !validParam(ps, v)) continue;
      out.ruleParams = { ...out.ruleParams, [rule.id]: { ...out.ruleParams?.[rule.id], [ps.key]: v } };
    }
  }
  return out;
}
