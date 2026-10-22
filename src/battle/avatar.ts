/**
 * Jeton görselleri (karakter ve canavar): dosya adı kuralı ve yer tutucu. Savaş motorundan bağımsız küçük modül:
 * giriş ekranı ve oluşturucu bunu motoru (ana parçaya) çekmeden kullanır.
 */
import type { Monster } from '../data';
import type { CharacterSheet } from '../rules/stats';
import type { Avatar } from './types';

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
  };
}

/** Canavar jetonu: `public/monsters/<id>.webp`; uyurken (varsa) `<id>-uyku.webp`. */
export function monsterAvatar(monster: Monster): Avatar {
  const words = monster.name.split(' ');
  const label = words.length > 1 ? `${words[0]?.[0] ?? ''}${words[1]?.[0] ?? ''}` : monster.name.slice(0, 2);
  return { src: monster.avatar ?? `monsters/${monster.id}.webp`, asleepSrc: `monsters/${monster.id}-uyku.webp`, bg: '#6b2a2f', label };
}

