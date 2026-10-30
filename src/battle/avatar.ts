/**
 * Jeton görselleri (karakter ve canavar): dosya adı kuralı ve yer tutucu. Savaş motorundan bağımsız küçük modül:
 * giriş ekranı ve oluşturucu bunu motoru (ana parçaya) çekmeden kullanır.
 */
import type { Monster } from '../data';
import type { CharacterSheet } from '../rules/stats';
import type { Avatar, TintSpec } from './types';
import soyRenkleri from '../../data/soy-renkleri.json';

type Lineages = Record<string, TintSpec['to'] | null>;
type GenderPart = { lineages?: Lineages; badges?: Record<string, string> };
type TintTable = Record<string, { select: TintSpec['select']; lineages: Lineages; badges?: Record<string, string>; byGender?: Partial<Record<'male' | 'female', GenderPart>> }>;
const TINTS = soyRenkleri.races as unknown as TintTable;
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
  return to ? { select: race.select, to } : undefined;
}

/** K13: renk farkı yetersiz kalan soyun köşe rozeti rengi (veride `badges`, K19: cinsiyete göre); yeterli soylarda undefined. */
export function lineageBadge(raceId: string, lineageId: string | undefined, gender?: Gender): string | undefined {
  if (!lineageId) return undefined;
  const race = TINTS[raceId];
  const own = race?.byGender?.[genderKey(gender)]?.badges;
  return own ? own[lineageId] : race?.badges?.[lineageId];
}

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
    ...(!sheet.avatar && lineageBadge(sheet.raceId, sheet.lineageId, gender) ? { badge: lineageBadge(sheet.raceId, sheet.lineageId, gender) } : {}),
  };
}

/** Canavar jetonu: `public/monsters/<id>.webp`; uyurken (varsa) `<id>-uyku.webp`. */
export function monsterAvatar(monster: Monster): Avatar {
  const words = monster.name.split(' ');
  const label = words.length > 1 ? `${words[0]?.[0] ?? ''}${words[1]?.[0] ?? ''}` : monster.name.slice(0, 2);
  return { src: monster.avatar ?? `monsters/${monster.id}.webp`, asleepSrc: `monsters/${monster.id}-uyku.webp`, bg: '#6b2a2f', label };
}

