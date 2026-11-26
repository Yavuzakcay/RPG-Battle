/**
 * Görev MC4 (kural sürümü 105; SRD 5.2.1 s. 25 "class features ... based on your level in that class"): savaşta sınıf
 * özelliğinin seviyesi. Çoklu sınıflı oyuncu savaşçısında `classLevels` (sınıf ve alt sınıf kimliği → o sınıfın seviyesi);
 * tek sınıflı savaşçıda, canavarda ve bilinmeyen kimlikte karakter seviyesi (`level`): eski davranış aynen. Sınıf, özellik
 * ya da kaynak anahtarının önekinden okunur (kodda sınıf adıyla koşul yok).
 */
import { resourceDef } from '../rules/classFeatures';
import { keyClassOf } from '../rules/mcHook';
import type { Combatant } from './types';

type Who = Pick<Combatant, 'level' | 'classLevels'>;

/** Sınıf ya da alt sınıf kimliğinin seviyesi. */
export const levelIn = (c: Who, id: string | undefined): number => (id !== undefined ? c.classLevels?.[id] : undefined) ?? c.level;

/** Özellik anahtarının (`sınıf:özellik`, `sınıf/alt sınıf:özellik`) sınıfının seviyesi. */
export const featureLevel = (c: Who, key: string): number => (c.classLevels ? levelIn(c, keyClassOf(key)) : c.level);

/** Kaynağı veren sınıfın seviyesi (K6 `kaynak@sınıf` ekinden ya da kaynağın özellik anahtarından). */
export function resourceLevel(c: Who, id: string): number {
  if (!c.classLevels) return c.level;
  if (id.includes('@')) return levelIn(c, keyClassOf(id));
  const f = resourceDef(id)?.feature;
  for (const k of f ? (Array.isArray(f) ? f : [f]) : []) { const v = c.classLevels[keyClassOf(k)]; if (v !== undefined) return v; }
  return c.level;
}
