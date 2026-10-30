/**
 * Jeton görselleri (karakter ve canavar): dosya adı kuralı ve yer tutucu. Savaş motorundan bağımsız küçük modül:
 * giriş ekranı ve oluşturucu bunu motoru (ana parçaya) çekmeden kullanır.
 */
import type { Monster } from '../data';
import type { CharacterSheet } from '../rules/stats';
import type { Avatar, TintSpec } from './types';
import soyRenkleri from '../../data/soy-renkleri.json';

/** DROW-PALET: `{ palet: "<anahtar>" }` soyun rengi ırk kaydındaki `paletler.<soy>`'dan, seçim `<anahtar>` alanından. */
type PaletRef = { palet: string };
type Lineages = Record<string, TintSpec['to'] | PaletRef | null>;
type GenderPart = { lineages?: Lineages };
type TintTable = Record<string, { select: TintSpec['select']; lineages: Lineages; byGender?: Partial<Record<'male' | 'female', GenderPart>>;
  paletler?: Record<string, { varsayilan: string; secenekler: Record<string, TintSpec['to']> }> } & Record<string, unknown>>;
const TINTS = soyRenkleri.races as unknown as TintTable;
const warned = new Set<string>();

/**
 * DROW-PALET: soyun seçili paleti (`<soy>Palet`, örneğin `drowPalet: "A"`); anahtar geçersizse varsayılan (bir kez uyarı).
 * Paletli olmayan soyda null.
 */
export function lineagePalette(raceId: string, lineageId: string): { key: string; valid: boolean; to: TintSpec['to'] } | null {
  const race = TINTS[raceId];
  const ref = race?.lineages[lineageId];
  const pal = race?.paletler?.[lineageId];
  if (!race || !pal || !ref || !('palet' in ref)) return null;
  const r = resolvePalette(pal, race[ref.palet], `${raceId}.${ref.palet}`);
  return { ...r, to: pal.secenekler[r.key]! };
}

/** Palet seçimi (saf): geçerli anahtar ya da varsayılan; geçersizse bir kez uyarı. */
export function resolvePalette(pal: { varsayilan: string; secenekler: Record<string, unknown> }, want: unknown, label: string): { key: string; valid: boolean } {
  const valid = typeof want === 'string' && want in pal.secenekler;
  if (!valid && !warned.has(label)) {
    warned.add(label);
    console.warn(`soy-renkleri: ${label} = ${JSON.stringify(want)} geçersiz; varsayılan palet ${pal.varsayilan} kullanılıyor.`);
  }
  return { key: valid ? want as string : pal.varsayilan, valid };
}
type Gender = 'erkek' | 'kadin' | 'male' | 'female' | undefined;
const genderKey = (g: Gender): 'male' | 'female' => (g === 'kadin' || g === 'female' ? 'female' : 'male');

/**
 * Görev K8b: ırk, soy ve cinsiyete göre jeton rengi; soyu olmayan ırkta ya da soy seçilmemişse undefined.
 * K19: cinsiyete özel kayıt (`byGender.<male|female>.lineages`) ırkın ortak kaydının önüne geçer (null: boyama yok).
 */
export function lineageTint(raceId: string, lineageId: string | undefined, gender?: Gender): TintSpec | undefined {
  const race = TINTS[raceId];
  if (!race || !lineageId) return undefined;
  const own = race.byGender?.[genderKey(gender)]?.lineages;
  const to = own && lineageId in own ? own[lineageId] : race.lineages[lineageId];
  if (to && 'palet' in to) { const p = lineagePalette(raceId, lineageId); return p ? { select: race.select, to: p.to } : undefined; }
  return to ? { select: race.select, to } : undefined;
}

/** DROW-PALET: belirli bir paletle boyama (inceleme sayfası, ölçüm, testler); palet yoksa undefined. */
export function paletteTint(raceId: string, lineageId: string, key: string): TintSpec | undefined {
  const race = TINTS[raceId];
  const to = race?.paletler?.[lineageId]?.secenekler[key];
  return race && to ? { select: race.select, to } : undefined;
}

/** DROW-PALET: soyun palet anahtarları (paletsiz soyda boş). */
export const paletteKeys = (raceId: string, lineageId: string): string[] => Object.keys(TINTS[raceId]?.paletler?.[lineageId]?.secenekler ?? {});

/** Yer tutucu zemin rengi: ırka göre. */
const RACE_COLOR: Record<string, string> = {
  celestial: '#b8932a', dragonborn: '#a84330', dwarf: '#8a5a2b', elf: '#3f8f4f', gnome: '#7a4fa0',
  goliath: '#5f6f7c', halfling: '#c27436', human: '#3d6fa8', orc: '#4f7a2a', tiefling: '#8c2f5a',
};
/** Yer tutucu yazısı: sınıfın kısa adı. */
const CLASS_LABEL: Record<string, string> = {
  barbarian: 'Bb', bard: 'Bd', cleric: 'Cl', druid: 'Dr', fighter: 'Fi', monk: 'Mo', paladin: 'Pa',
  ranger: 'Ra', rogue: 'Ro', sorcerer: 'So', warlock: 'Wa', wizard: 'Wi',
};

/** Koddaki cinsiyet → jeton dosya adındaki İngilizce karşılığı. */
const GENDER_FILE: Record<'erkek' | 'kadin', 'male' | 'female'> = { erkek: 'male', kadin: 'female' };

/**
 * Karakter jetonunun dosya adı (tek yer; başka biçimde kurulmaz): `<ırk>-<male|female>-<sınıf>.webp`.
 * Irk ve sınıf kimlikleri zaten İngilizce (celestial, dragonborn... / barbarian, bard...);
 * cinsiyet erkek→male, kadin→female; cinsiyetsiz eski kayıt male.
 */
export function characterTokenFile(raceId: string, gender: 'erkek' | 'kadin' | undefined, classId: string): string {
  return `${raceId}-${GENDER_FILE[gender ?? 'erkek']}-${classId}.webp`;
}

/**
 * Karakter jetonu (pixel art, karşıdan çizili): `characters/` + `characterTokenFile`.
 * Cinsiyeti olmayan eski kayıtlar erkek (male). Yoksa eski `avatars/<ırk>-<sınıf>-<cinsiyet>.webp`,
 * o da yoksa baş harfli rozet (yedek zinciri).
 */
export function sheetAvatar(sheet: CharacterSheet): Avatar {
  const gender = sheet.gender ?? 'erkek';
  return {
    src: sheet.avatar ?? `characters/${characterTokenFile(sheet.raceId, gender, sheet.classId)}`,
    fallbacks: sheet.avatar ? [] : [`avatars/${sheet.raceId}-${sheet.classId}-${gender}.webp`],
    bg: RACE_COLOR[sheet.raceId] ?? '#4a5560',
    label: CLASS_LABEL[sheet.classId] ?? sheet.classId.slice(0, 2),
    ...(!sheet.avatar && lineageTint(sheet.raceId, sheet.lineageId, gender) ? { tint: lineageTint(sheet.raceId, sheet.lineageId, gender) } : {}),
  };
}

/** Canavar jetonu: `public/monsters/<id>.webp`; uyurken (varsa) `<id>-uyku.webp`. */
export function monsterAvatar(monster: Monster): Avatar {
  const words = monster.name.split(' ');
  const label = words.length > 1 ? `${words[0]?.[0] ?? ''}${words[1]?.[0] ?? ''}` : monster.name.slice(0, 2);
  return { src: monster.avatar ?? `monsters/${monster.id}.webp`, asleepSrc: `monsters/${monster.id}-uyku.webp`, bg: '#6b2a2f', label };
}

