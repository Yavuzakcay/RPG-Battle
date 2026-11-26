/**
 * Görev MC5: karakterin sınıf etiketi. Tek sınıfta sınıf adı (ve "Sınıf N"); çoklu sınıfta sınıf başına seviyeyle
 * "Fighter 3 · Wizard 2" (alınış sırasıyla). Yalnız görünüm.
 */
import { classes } from '../data';
import { isMultiSheet } from '../rules/mcHook';
import type { CharacterSheet } from '../rules/stats';
import { t } from '../i18n';

type Sheet = Pick<CharacterSheet, 'classId' | 'level' | 'classes'>;
const nameOf = (id: string): string => classes.find((c) => c.id === id)?.name ?? id;

/** Sınıf adı: tek sınıfta ad, çoklu sınıfta "Fighter 3 · Wizard 2". */
export const sheetClassName = (s: Sheet): string =>
  (isMultiSheet(s) ? t().builder.mc.label((s.classes ?? []).map((e) => `${nameOf(e.classId)} ${e.level}`)) : nameOf(s.classId));

/** Sınıf ve seviye: tek sınıfta "Fighter 5", çoklu sınıfta "Fighter 3 · Wizard 2". */
export const sheetClassLevel = (s: Sheet): string => (isMultiSheet(s) ? sheetClassName(s) : `${nameOf(s.classId)} ${s.level}`);

/**
 * Görev MC5 (MC4 K6 kalanı): kaynağın okunur adı; sınıf ekli kaynakta sınıf etiketiyle ("Channel Divinity (Paladin)"),
 * böylece Cleric + Paladin'in iki ayrı havuzu ayırt edilir.
 */
export function resourceLabel(id: string, name: string | undefined): string {
  const base = name ?? id;
  return id.includes('@') ? `${base} (${nameOf(id.slice(id.indexOf('@') + 1))})` : base;
}
