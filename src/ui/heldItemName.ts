/**
 * Görev D: elde tutulan / yerdeki eşyanın okunur adı (yalnız arayüz). Motor eşyayı kimlikle taşır (`longsword`,
 * Wild Shape biçiminde `beast:giant-frog`, Karadul `karadul:spider`); düğmede, ipucunda ve günlükte ham kimlik görünmez.
 * Sıra: silah tablosu → biçim canavarı → Örümcek Biçimi → saldırı seçeneğinin adı → genel ad ("eşya").
 * Grup kimlikleri (harita `groups`) de aynı ilkeyle: çeviri tablosu, yoksa okunur biçim.
 */
import weaponData from '../../data/weapons.json';
import { getMonster } from '../data';
import { getLang, t } from '../i18n';
import { resourceDef } from '../rules/classFeatures';
import { entryOf } from '../battle/monsterAbilities';
import type { BattleState } from '../battle/types';

const WEAPON_NAME = new Map((weaponData as Array<{ id: string; name: string }>).map((w) => [w.id, w.name]));

/** Saldırı seçeneğinin (AttackOption) okunurluğa yetecek kısmı. */
export interface NamedOption { weaponId?: string; label: string }

export function heldItemName(id: string, options: ReadonlyArray<NamedOption> = []): string {
  const N = t().battle.held;
  const weapon = WEAPON_NAME.get(id);
  if (weapon) return weapon;
  const [prefix, rest] = id.includes(':') ? [id.slice(0, id.indexOf(':')), id.slice(id.indexOf(':') + 1)] : ['', id];
  if (prefix === 'beast' && rest) {
    try { return getMonster(rest).name; } catch { /* canavar verisi yok: aşağıda */ }
  }
  if (prefix === 'karadul') return N.spider;
  const opt = options.find((o) => o.weaponId === id)?.label;
  if (opt) return opt;
  return N.unknown;
}

/** Harita grubunun okunur adı: çeviri tablosu, yoksa kimlik sözcüklere ayrılır. */
export function groupName(id: string): string {
  const table = t().alarm.groupNames as Record<string, string>;
  if (table[id]) return table[id] as string;
  const words = id.replace(/([a-zçğıöşü])([A-ZÇĞİÖŞÜ])/g, '$1 $2').replace(/[-_]+/g, ' ').trim().toLocaleLowerCase();
  return words ? words.charAt(0).toLocaleUpperCase() + words.slice(1) : t().alarm.groupFallback;
}

/**
 * Görev D: günlükte kullanılan özelliğin / kaynağın okunur adı (`feature_used.feature` çoğu zaman kaynak kimliği:
 * `wildShape`, `sorceryPoints`, canavar yeteneğinde `mab:<id>`). Sıra: günlük çeviri tablosu → canavar yeteneğinin
 * TR/EN adı → sınıf kaynağının adı → genel ad.
 */
export function featureName(id: string, state: BattleState, actorId: string): string {
  const table = t().log.feature as Record<string, string>;
  if (table[id]) return table[id] as string;
  if (id.startsWith('mab:')) {
    const c = state.combatants[actorId];
    const a = c ? entryOf(c, state)?.abilities?.find((x) => x.id === id.slice(4)) : undefined;
    if (a) return getLang() === 'en' ? a.en : a.tr;
  }
  const def = resourceDef(id);
  if (def?.name) return def.name;
  return t().battle.held.feature;
}
