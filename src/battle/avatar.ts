/**
 * Jeton görselleri (karakter ve canavar): dosya adı kuralı ve yer tutucu. Savaş motorundan bağımsız küçük modül:
 * giriş ekranı ve oluşturucu bunu motoru (ana parçaya) çekmeden kullanır.
 */
import type { Monster } from '../data';
import type { CharacterSheet } from '../rules/stats';
import type { Avatar, TintSpec } from './types';
import soyRenkleri from '../../data/soy-renkleri.json';
import wizardJeton from '../../data/wizard-jeton.json';
import warlockJeton from '../../data/warlock-jeton.json';
import sorcererJeton from '../../data/sorcerer-jeton.json';
import barbarianJeton from '../../data/barbarian-jeton.json';
import bardJeton from '../../data/bard-jeton.json';
import clericJeton from '../../data/cleric-jeton.json';
import druidJeton from '../../data/druid-jeton.json';
import fighterJeton from '../../data/fighter-jeton.json';
import monkJeton from '../../data/monk-jeton.json';
import paladinJeton from '../../data/paladin-jeton.json';
import rangerJeton from '../../data/ranger-jeton.json';
import rogueJeton from '../../data/rogue-jeton.json';
import { cultureSkinTone, hasSubclassWing, skinTint } from '../ui/lineageLook';

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
export function lineageTint(raceId: string, lineageId: string | undefined, gender?: Gender, beyazTaban = false): TintSpec | undefined {
  const race = TINTS[raceId];
  if (!race || !lineageId) return undefined;
  // KQ6: beyaz taban jetonlar (Dragonborn alt sınıf/Gariban) kendi renk tablosundan (`lineagesAlt`: pul deseni v2, maske `maske-pul/`).
  // KJ3: eski `lineagesAltMaske` yedek yolu (`'maske'` seçeneği, `maske/dragonborn-*` maskeleri) kaldırıldı; Dragonborn yalnız pul hattı.
  const alt = beyazTaban ? (race as { lineagesAlt?: Lineages }).lineagesAlt : undefined;
  if (alt && lineageId in alt) { const to = alt[lineageId]; return to ? { select: race.select, to: to as TintSpec['to'] } : undefined; }
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

/** Görev WZ-BAGLA / BAGLA-3: eksik alt sınıf jetonları bir kez geliştirici günlüğüne (arayüz metni yok). */
const subMissing = new Set<string>();
let subWarn = true;
/** Testlerde sahte alt sınıf kimlikleri günlüğü doldurmasın diye kapatılır (uygulamada hep açık; jeton testi açar). */
export const setSubTokenWarnings = (on: boolean): void => { subWarn = on; };
interface SubTokenTable { sinif: string; irklar: Record<string, string[]>; altSiniflar: Record<string, string>; cinsiyet?: Record<string, 'erkek' | 'kadin'>;
  /** Seviyeye göre ikinci jeton formu: alt sınıf kimliği → { esik (seviye ≥), ikinci (hücre), ikinciYok ('ırk-cinsiyet' listesi) }. */
  formlar?: Record<string, { esik: number; ikinci: string; ikinciYok?: string[] }> }
/** Alt sınıf jetonu olan sınıflar (veri dosyası başına bir sınıf; yeni sınıf yalnız buraya + veri dosyası). */
const SUB_TOKENS: Record<string, SubTokenTable> = {
  wizard: wizardJeton as unknown as SubTokenTable,
  warlock: warlockJeton as unknown as SubTokenTable,
  sorcerer: sorcererJeton as unknown as SubTokenTable,
  barbarian: barbarianJeton as unknown as SubTokenTable,
  bard: bardJeton as unknown as SubTokenTable,
  cleric: clericJeton as unknown as SubTokenTable,
  druid: druidJeton as unknown as SubTokenTable,
  fighter: fighterJeton as unknown as SubTokenTable,
  monk: monkJeton as unknown as SubTokenTable,
  paladin: paladinJeton as unknown as SubTokenTable,
  ranger: rangerJeton as unknown as SubTokenTable,
  rogue: rogueJeton as unknown as SubTokenTable,
};
/**
 * Alt sınıf jetonu (`<ırk>-<erkek|kadin>-<sınıf>-<hücre>.webp`). Kesilmiş jeton varsa her zaman bağlanır; ten/soy maskesi yoksa
 * boyama yalnızca uygulanmaz (`tint.ts`), jeton olduğu gibi çıkar. undefined (sınıf-genel jeton kalır) yalnız: sınıfta/alt sınıfta
 * hücre yoksa (sessiz; tabloda olmayan kimlik), alt sınıfın cinsiyet kısıtı uymuyorsa (sessiz; beklenen) ya da ırk×cinsiyet jetonu
 * yoksa (tek satır `console.warn("<sınıf>-jeton eksik: <ırk>-<cinsiyet>-<sınıf>-<hücre>")`, bir kez).
 */
export function subclassTokenFile(classId: string, raceId: string, gender: 'erkek' | 'kadin', subclassId: string | undefined, level?: number): string | undefined {
  const T = SUB_TOKENS[classId];
  if (!T || !subclassId) return undefined;
  const cell = T.altSiniflar[subclassId];
  if (!cell) return undefined;
  const only = T.cinsiyet?.[subclassId];
  if (only && only !== gender) return undefined;
  if (!T.irklar[raceId]?.includes(gender)) {
    const key = `${raceId}-${gender}-${classId}-${cell}`;
    if (subWarn && !subMissing.has(key)) { subMissing.add(key); console.warn(`${classId}-jeton eksik: ${key}`); }
    return undefined;
  }
  // KQ6-5: seviyeye bağlı ikinci form (Pehlivan seviye ≥ 10: dev hali); ikinci form yoksa ya da seviye bilinmiyorsa 1. form (uyarı yok).
  const f = T.formlar?.[subclassId];
  const second = f && level !== undefined && level >= f.esik && !(f.ikinciYok ?? []).includes(`${raceId}-${gender}`) ? f.ikinci : undefined;
  return `${raceId}-${gender}-${classId}-${second ?? cell}.webp`;
}
/**
 * Gariban (Kuyruk KQ6): alt sınıfı henüz olmayan (seviye < 3) karakterin jetonu `<ırk>-<erkek|kadin>-<sınıf>-GR.webp`. Her ırk×cinsiyet×sınıf için
 * var (Celestial dahil: hale işi bitti, Celestial GR jetonları halesiz; taç `haloCrown` ile); ırk tablosunda (`irklar`) yoksa ya da sınıfın tablosu yoksa undefined.
 */
export function garibanTokenFile(classId: string, raceId: string, gender: 'erkek' | 'kadin', level?: number): string | undefined {
  const T = SUB_TOKENS[classId];
  if (!T || (level ?? 1) >= 3 || !T.irklar[raceId]?.includes(gender)) return undefined;
  return `${raceId}-${gender}-${classId}-GR.webp`;
}
/** Eski ad (WZ-BAGLA testleri). */
export const wizardSubclassFile = (raceId: string, gender: 'erkek' | 'kadin', subclassId: string | undefined) => subclassTokenFile('wizard', raceId, gender, subclassId);

/**
 * Karakter jetonu (pixel art, karşıdan çizili): `characters/` + `characterTokenFile`.
 * Cinsiyeti olmayan eski kayıtlar erkek (male). Yoksa eski `avatars/<ırk>-<sınıf>-<cinsiyet>.webp`,
 * o da yoksa baş harfli rozet (yedek zinciri).
 */
export function sheetAvatar(sheet: CharacterSheet): Avatar {
  const gender = sheet.gender ?? 'erkek';
  const generic = `characters/${characterTokenFile(sheet.raceId, gender, sheet.classId)}`;
  // WZ-BAGLA/BAGLA-3: Wizard/Warlock/Sorcerer alt sınıf jetonu (maske yoksa boyama uygulanmaz, jeton yine çıkar); öncelik özel avatar > alt sınıf jetonu > genel.
  // KQ6: seviye < 3 Gariban (GR) jetonu; seviye ≥ 3 alt sınıf jetonu; ikisi de yoksa sınıf-genel jeton.
  const gr = !sheet.avatar ? garibanTokenFile(sheet.classId, sheet.raceId, gender, sheet.level) : undefined;
  let wz = gr ?? (!sheet.avatar ? subclassTokenFile(sheet.classId, sheet.raceId, gender, sheet.subclassId, sheet.level) : undefined);
  // Dragonborn: eski sınıf-genel jeton insansı çizimdir; alt sınıfsız seviye ≥ 3 de beyaz taban Gariban jetonunu kullanır.
  if (!wz && !sheet.avatar && sheet.raceId === 'dragonborn') wz = garibanTokenFile(sheet.classId, sheet.raceId, gender, 1);
  return {
    src: sheet.avatar ?? (wz ? `characters/${wz}` : generic),
    fallbacks: sheet.avatar ? [] : [...(wz ? [generic] : []), `avatars/${sheet.raceId}-${sheet.classId}-${gender}.webp`],
    bg: RACE_COLOR[sheet.raceId] ?? '#4a5560',
    label: CLASS_LABEL[sheet.classId] ?? sheet.classId.slice(0, 2),
    // Kuyruk AS1c: Human ten tonu ten maskesiyle (jetonun yalnız teni); diğer alt soylar soy rengiyle.
    ...((): Partial<Avatar> => {
      if (sheet.avatar) return {};
      const tint = skinTint(sheet.raceId, cultureSkinTone(sheet.lineageId, sheet.skinTone, sheet.exileCulture)) ?? lineageTint(sheet.raceId, sheet.lineageId, gender, !!wz && sheet.raceId === 'dragonborn');
      return tint ? { tint } : {};
    })(),
    // Kuyruk AS1c: alt soy görünümü (oran, hale, filtre, kanat) savaş jetonunda da aynı çözücüyle (`lineageLook`).
    ...(!sheet.avatar && (sheet.lineageId || sheet.raceId === 'celestial' || hasSubclassWing(sheet.subclassId))
      ? { look: { raceId: sheet.raceId, ...(hasSubclassWing(sheet.subclassId) ? { classId: sheet.classId, subclassId: sheet.subclassId } : {}), ...(sheet.lineageId ? { lineageId: sheet.lineageId } : {}), ...(sheet.celestialAwakening ? { celestialAwakening: sheet.celestialAwakening } : {}), level: sheet.level } } : {}),
  };
}

/** Canavar jetonu: `public/monsters/<id>.webp`; uyurken (varsa) `<id>-uyku.webp`. */
export function monsterAvatar(monster: Monster): Avatar {
  const words = monster.name.split(' ');
  const label = words.length > 1 ? `${words[0]?.[0] ?? ''}${words[1]?.[0] ?? ''}` : monster.name.slice(0, 2);
  return { src: monster.avatar ?? `monsters/${monster.id}.webp`, asleepSrc: `monsters/${monster.id}-uyku.webp`, bg: '#6b2a2f', label };
}

