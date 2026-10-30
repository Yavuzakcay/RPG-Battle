/**
 * Tür soyları (Görev K3; SRD 5.2.1): Dragonborn ata türü, Tiefling Fiendish Legacy, Elf Elven Lineage, Gnome Gnomish
 * Lineage, Goliath Giant Ancestry. Veri `data/races.json` (`lineages`; her seçenekte TR/EN `summary`), kaynaklar
 * `data/class-features.json` (`race` + `lineage` + `minLevel`). Saf: ekran ya da depolama bilmez.
 */
import { getRace, races, spells, type Lineage } from '../data';
import type { CharacterSheet } from './stats';

type LineageSheet = Pick<CharacterSheet, 'raceId' | 'lineageId'>;

/** Karakterin soyu (seçilmemişse türün varsayılanı); soyu olmayan türde undefined. */
export function lineageOf(sheet: LineageSheet): Lineage | undefined {
  const race = races.find((r) => r.id === sheet.raceId);
  const id = sheet.lineageId ?? race?.defaultLineage;
  return race?.lineages?.find((l) => l.id === id);
}

/** Türün ve soyun hızı (Wood Elf 35 ft). */
export function raceSpeed(sheet: LineageSheet): number {
  return lineageOf(sheet)?.speed ?? getRace(sheet.raceId).speed;
}

/** Türün ve soyun karanlık görüşü (Drow 120 ft). */
export function raceDarkvision(sheet: LineageSheet): number {
  return lineageOf(sheet)?.darkvision ?? getRace(sheet.raceId).darkvision;
}

/** Bu seviyede soydan gelen büyüler (cantrip'ler her zaman; seviyeli büyüler eşikten itibaren, slotsuz kullanımla). */
export function lineageSpells(sheet: LineageSheet & Pick<CharacterSheet, 'level'>): string[] {
  return (lineageOf(sheet)?.spells ?? []).filter((s) => sheet.level >= s.level).map((s) => s.name);
}

/** Soy seçeneğinin özeti (geçerli dilde). */
export const lineageSummary = (l: Lineage, lang: 'tr' | 'en'): string => l.summary[lang] ?? l.summary.tr;

/** Kartta ve özette gösterilen soy yeteneği: "Drow: Faerie Fire"; oyunda olmayan ya da kısmi olanın notu ipucunda. */
export interface LineageAbility { label: string; status: 'ok' | 'partial' | 'none'; note?: string }

/**
 * Seçili soyun karakterin bu seviyesinde verdiği yetenekler (büyüler, Giant Ancestry, oyunda olmayan özellikler).
 * Büyünün oyundaki durumu büyü verisinden: savaş dışı ya da desteklenmeyen büyü `none`, yaklaşık olan `partial`.
 */
export function lineageAbilities(sheet: LineageSheet & Pick<CharacterSheet, 'level'>, lang: 'tr' | 'en', notes: LineageNotes): LineageAbility[] {
  const l = lineageOf(sheet);
  if (!l) return [];
  const out: LineageAbility[] = [];
  for (const s of l.spells ?? []) {
    if (sheet.level < s.level) continue;
    const m = spells.find((x) => x.name === s.name)?.mechanics;
    const status = !m || m.unsupported || m.offCombat ? 'none' : m.approx ? 'partial' : 'ok';
    const note = !m || m.unsupported ? notes.notInGame : m.offCombat ? notes.offCombat : m.approx;
    out.push({ label: `${l.name}: ${s.name}`, status, ...(note ? { note } : {}) });
  }
  if (l.giant) {
    const g = notes.giant[l.giant];
    out.push({ label: `${getRace(sheet.raceId).name}: ${l.name}`, status: g.status, ...(g.note ? { note: g.note } : {}) });
  }
  for (const x of l.extras ?? []) out.push({ label: `${l.name}: ${x.name[lang]}`, status: x.status, note: x.note[lang] });
  return out;
}

/** Durum notları (ekran metinlerinden; kural modülü dil dosyasını içe aktarmaz). */
export interface LineageNotes {
  notInGame: string;
  offCombat: string;
  giant: Record<NonNullable<Lineage['giant']>, { status: 'ok' | 'partial'; note?: string }>;
}

/**
 * Eski kayıtlar (Görev K3): soyu boş (ya da artık bulunmayan) karakterlere türün ilk soyu atanır; kimlere atandığı döner
 * (bir kerelik not). Soyu olmayan türler ve geçerli soy değişmez; değişiklik yoksa aynı liste.
 */
export function migrateLineages<T extends { sheet: CharacterSheet }>(list: T[]): { list: T[]; assigned: Array<{ name: string; lineage: string }> } {
  const assigned: Array<{ name: string; lineage: string }> = [];
  const out = list.map((c) => {
    const race = races.find((r) => r.id === c.sheet.raceId);
    const first = race?.lineages?.[0];
    if (!race || !first || race.lineages?.some((l) => l.id === c.sheet.lineageId)) return c;
    const pick = race.lineages?.find((l) => l.id === race.defaultLineage) ?? first;
    assigned.push({ name: c.sheet.name, lineage: `${race.name} ${pick.name}` });
    return { ...c, sheet: { ...c.sheet, lineageId: pick.id } };
  });
  return { list: assigned.length > 0 ? out : list, assigned };
}
