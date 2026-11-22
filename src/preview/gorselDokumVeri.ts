/**
 * Görsel döküm (yalnız geliştirme; `npm run gorsel-dokum`, sayfa /onizleme-dokum.html): oyuncunun arayüzde ulaşabildiği bütün
 * karakter görünüşlerinin kombinasyon listesi. Liste VERİDEN üretilir (kopya tablo yok):
 * - ırk ve soy: `data/races.json` `lineages` (tür kartı ilk soyu seçer; soyu isteğe bağlı türde yalnız yeni karakterin Human'ı soysuz başlar),
 * - Human: kültür + Sur Dışı Sürgün seçimi; ten tonu tek çözücüden (`cultureSkinTone`). Görünüşü yalnız ton belirler (Human alt soyları
 *   `orijinal`): sınıf tablosunda ton başına bir sütun, her sütunun hangi UI yollarından geldiği `reach` alanında; tam yol listesi özel bölümde,
 * - Celestial: Göksel Uyanış seçenekleri (`alt-soy-gorunum.json` `celestialUyanis`; 3. seviyeden etkin),
 * - alt sınıflar: `visibleSubclasses` (120: paket + imza + Karadul) ve cinsiyet kuralı (`genderVisible`; "mevcut seçim hep görünür":
 *   seçtikten sonra cinsiyet değişirse kısıtlı alt sınıf kalır, bu da ulaşılabilir bir görünüştür),
 * - seviye: Gariban (seviye < 3), alt sınıf satırı kanat eşiğine kadar yükseltilmiş seviyede (`kanat-esleme.json` `minSeviye`'lerin en büyüğü),
 *   ikinci jeton formu (`<sınıf>-jeton.json` `formlar`).
 * Çizim yalnız oyunun bileşenleriyle (gorselDokum.tsx); burası saf liste.
 */
import { items, races, type SubclassDef } from '../data';
import { blankCharacter } from '../rules/builder';
import { defaultSubclassId, displayName, genderVisible, subclassForGender, visibleSubclasses } from '../rules/subclasses';
import { sheetAvatar } from '../battle/avatar';
import { CULTURE_SKIN, EXILE, SKIN_TONES, cultureSkinTone, exileOptions } from '../ui/lineageLook';
import { wingTable } from '../ui/wingData';
import { JETON_ARKETIP, JETON_YEDEK } from '../content/ilkelSema';
import type { CharacterSheet } from '../rules/stats';
import type { Avatar } from '../battle/types';
import gorunum from '../../data/alt-soy-gorunum.json';
import barbarian from '../../data/barbarian-jeton.json';
import bard from '../../data/bard-jeton.json';
import cleric from '../../data/cleric-jeton.json';
import druid from '../../data/druid-jeton.json';
import fighter from '../../data/fighter-jeton.json';
import monk from '../../data/monk-jeton.json';
import paladin from '../../data/paladin-jeton.json';
import ranger from '../../data/ranger-jeton.json';
import rogue from '../../data/rogue-jeton.json';
import sorcerer from '../../data/sorcerer-jeton.json';
import warlock from '../../data/warlock-jeton.json';
import wizard from '../../data/wizard-jeton.json';

export type Gender = 'erkek' | 'kadin';
export const GENDERS: Gender[] = ['erkek', 'kadin'];
export const G1: Record<Gender, string> = { erkek: 'E', kadin: 'K' };

/** Alt sınıf jeton tablosu (`data/<sınıf>-jeton.json`). */
export interface JetonTablo { sinif: string; irklar: Record<string, string[]>; altSiniflar: Record<string, string>; cinsiyet?: Record<string, Gender>;
  formlar?: Record<string, { esik: number; ikinci: string; ikinciYok?: string[] }> }
export const JETON: Record<string, JetonTablo> = Object.fromEntries(
  ([barbarian, bard, cleric, druid, fighter, monk, paladin, ranger, rogue, sorcerer, warlock, wizard] as unknown as JetonTablo[]).map((t) => [t.sinif, t]));
/** Sınıflar: jeton tablosu olan sınıflar (sınıf verisinin 12 sınıfı). */
export const CLASSES: string[] = Object.keys(JETON).sort();

const D = gorunum as unknown as {
  altSoylar: Record<string, { filtre?: string; oran?: { en: number; boy: number }; kanat?: string; orijinal?: true }>;
  celestialUyanis: Record<string, { hale: boolean; filtre?: string; kanat?: string; orijinal?: true }>;
};
export const AWAKENINGS: string[] = Object.keys(D.celestialUyanis);

/** Görünüş sütunu: ırk + soy (Human'da ton; Celestial'da uyanış). */
export interface Variant {
  key: string; race: string; lineage?: string; awakening?: string; skinTone?: string; exile?: string;
  /** Kısa etiket (hücre). */ label: string;
  /** Human: bu görünüşe giden UI yolları (kültür / Sürgün). */ reach?: string[];
}

/** Human'ın UI yolları: kültür kartı (+ Sur Dışı'nda Sürgün; Sürgünsüz Sur Dışı'nda ton önceki kültürden kalır). */
export interface HumanPath { key: string; label: string; lineage?: string; exile?: string; prevTone?: string; tone: string }
export function humanPaths(): HumanPath[] {
  const human = races.find((r) => r.id === 'human');
  const out: HumanPath[] = [];
  // Yeni karakter: Human, soy yok (lineageOptional; `blankCharacter`), ton yok → varsayılan.
  out.push({ key: 'soysuz', label: 'soysuz (yeni karakter)', tone: cultureSkinTone(undefined, undefined) ?? SKIN_TONES[0]!.id });
  for (const l of human?.lineages ?? []) {
    const exiles = exileOptions(l.id);
    // Kültür kartı tıklanınca (pickCulture): ton önceki tondan; tek tonlu kültürde ton kendiliğinden.
    const tones = [...new Set(SKIN_TONES.map((t) => cultureSkinTone(l.id, t.id)))].filter((x): x is string => !!x);
    if (exiles.length) {
      for (const prev of tones) out.push({ key: `${l.id}:surgunsuz:${prev}`, label: `${l.id} · Sürgünsüz (önceki ton ${prev})`, lineage: l.id, prevTone: prev, tone: cultureSkinTone(l.id, prev) ?? prev });
      for (const ex of exiles) out.push({ key: `${l.id}:${ex}`, label: `${l.id} · ${EXILE.ad[ex]?.tr ?? ex}`, lineage: l.id, exile: ex, tone: cultureSkinTone(l.id, undefined, ex) ?? '' });
    } else {
      for (const t of tones) out.push({ key: `${l.id}:${t}`, label: `${l.id}`, lineage: l.id, tone: t });
    }
  }
  // Aynı kültür/ton çiftini bir kez say.
  return out.filter((p, i) => out.findIndex((q) => q.lineage === p.lineage && q.exile === p.exile && q.tone === p.tone && q.prevTone === p.prevTone) === i);
}

/** Sınıf tablosunun sütunları (cinsiyetten bağımsız). */
export function classVariants(): Variant[] {
  const out: Variant[] = [];
  for (const r of races) {
    if (r.id === 'celestial') { for (const aw of AWAKENINGS) out.push({ key: `celestial/${aw}`, race: r.id, awakening: aw, label: aw }); continue; }
    if (r.id === 'human') {
      const paths = humanPaths();
      // Görünüşü ton belirler: ton başına bir sütun, temsilci yol sütunun sheet'i (tek tonlu kültür varsa o, yoksa ilk yol).
      for (const t of SKIN_TONES) {
        const ps = paths.filter((p) => p.tone === t.id);
        if (!ps.length) continue;
        const rep = ps.find((p) => p.lineage && !p.exile && !p.prevTone) ?? ps.find((p) => p.lineage) ?? ps[0]!;
        out.push({ key: `human/ten-${t.id}`, race: r.id, ...(rep.lineage ? { lineage: rep.lineage } : {}), ...(rep.exile ? { exile: rep.exile } : {}), skinTone: rep.prevTone ?? t.id,
          label: `ten ${t.id}`, reach: ps.map((p) => p.label) });
      }
      continue;
    }
    for (const l of r.lineages ?? []) out.push({ key: `${r.id}/${l.id}`, race: r.id, lineage: l.id, label: l.id });
  }
  return out;
}

/** Kanat eşiği: alt sınıf satırları bu seviyede (kanat ve uyanış görünsün; alt sınıf ≥ 3). */
export function subclassRowLevel(): number {
  const mins = Object.values(wingTable.slotlar).map((s) => s.minSeviye ?? 1);
  return Math.max(3, ...mins);
}

export interface Row { key: string; kind: 'gariban' | 'alt' | 'form'; subId?: string; level: number; label: string; name?: string; cinsiyet?: Gender; pack?: string }
export function classRows(cls: string): Row[] {
  const L = subclassRowLevel();
  const rows: Row[] = [{ key: 'GR', kind: 'gariban', level: 1, label: 'Gariban (seviye 1–2, alt sınıfsız)' }];
  const T = JETON[cls];
  const subs = visibleSubclasses(cls);
  for (const s of subs) rows.push({ key: s.id, kind: 'alt', subId: s.id, level: L, label: s.id, name: displayName(s.name, cls).tr, ...(s.cinsiyet ? { cinsiyet: s.cinsiyet } : {}), ...(s.pack ? { pack: s.pack } : {}) });
  for (const [id, f] of Object.entries(T?.formlar ?? {})) {
    const s = subs.find((x) => x.id === id);
    if (!s) continue; // eski kimlik (Barış Alanı → Birlik Manastırı) listede yok
    rows.push({ key: `${id}@${f.esik}`, kind: 'form', subId: id, level: Math.max(f.esik, L), label: `${id} ${f.esik}+ (ikinci form)`, name: displayName(s.name, cls).tr, ...(s.cinsiyet ? { cinsiyet: s.cinsiyet } : {}) });
  }
  return rows;
}

const base = blankCharacter('dokum').sheet;
export function sheetFor(o: { race: string; cls: string; gender: Gender; level: number; lineage?: string; awakening?: string; skinTone?: string; exile?: string; subId?: string }): CharacterSheet {
  return { ...base, name: 'dokum', raceId: o.race, classId: o.cls, gender: o.gender, level: o.level,
    ...(o.lineage ? { lineageId: o.lineage } : {}), ...(o.awakening ? { celestialAwakening: o.awakening } : {}),
    ...(o.skinTone ? { skinTone: o.skinTone } : {}), ...(o.exile ? { exileCulture: o.exile } : {}), ...(o.subId ? { subclassId: o.subId } : {}) } as CharacterSheet;
}

/** Bir hücre: görünüş + nasıl ulaşıldığı. */
export interface Combo {
  id: string; group: string; cls: string; race: string; variant: string; gender: Gender; row: string; subId?: string; level: number;
  /** `normal`: oluşturucuda doğrudan; `cinsiyet-sonra`: kısıtlı alt sınıf seçildikten sonra cinsiyet değişti ("mevcut seçim hep görünür"). */
  reach: 'normal' | 'cinsiyet-sonra';
  sheet: CharacterSheet; avatar: Avatar; label: string;
}
/** Jeton dosyasının kısa kimliği (`elf-kadin-wizard-WZ-B1.webp` → `WZ-B1`; sınıf-genel `elf-female-wizard.webp` → `genel`). */
export function tokenCode(src: string): string {
  const f = src.replace(/^.*\//, '').replace(/\.webp$/, '');
  const m = /^[a-z]+-(?:erkek|kadin)-[a-z]+-(.+)$/.exec(f);
  return m ? m[1]! : /-(male|female)-/.test(f) ? 'genel' : f;
}
export function classCombos(cls: string): Combo[] {
  const out: Combo[] = [];
  for (const row of classRows(cls)) for (const gender of GENDERS) for (const v of classVariants()) {
    const reach: Combo['reach'] = row.cinsiyet && row.cinsiyet !== gender ? 'cinsiyet-sonra' : 'normal';
    // genderVisible: kısıtlı alt sınıf yeni seçimde görünmez; mevcut seçim (subclassId aynı) görünür. GORSEL-DUZELTME: oluşturucu
    // cinsiyet değişiminde kısıtlı alt sınıfı önerilene çevirir (`subclassForGender`); öyleyse bu görünüş arayüzde ulaşılamaz.
    if (row.subId && reach === 'cinsiyet-sonra' && (!genderVisible({ id: row.subId, cinsiyet: row.cinsiyet }, { subclassId: row.subId, gender }) || subclassForGender(cls, row.subId, gender))) continue;
    const sheet = sheetFor({ race: v.race, cls, gender, level: row.level, ...(v.lineage ? { lineage: v.lineage } : {}), ...(v.awakening ? { awakening: v.awakening } : {}),
      ...(v.skinTone ? { skinTone: v.skinTone } : {}), ...(v.exile ? { exile: v.exile } : {}), ...(row.subId ? { subId: row.subId } : {}) });
    const avatar = sheetAvatar(sheet);
    out.push({ id: `${cls}/${row.key}/${v.key}/${G1[gender]}`, group: cls, cls, race: v.race, variant: v.key, gender, row: row.key, ...(row.subId ? { subId: row.subId } : {}), level: row.level, reach, sheet, avatar,
      label: `${v.key} ${G1[gender]} · ${cls}/${row.key} · ${tokenCode(avatar.src)}` });
  }
  return out;
}

/** Sınıfın örnek alt sınıfı (özel bölümler): veri varsayılanı, yoksa listedeki ilk. */
export const sampleSub = (cls: string): string | undefined => defaultSubclassId(cls) ?? visibleSubclasses(cls)[0]?.id;

/** Paket ve eşya çağrı yaratıkları (`yaratiklar`; jeton ödünç arketip/canavar + ton/halka; `battle/paket/index.ts` ile aynı arama). */
export interface PackCreature { key: string; source: string; ad: string; avatar: Avatar }
export function packCreatures(subs: SubclassDef[]): PackCreature[] {
  const out: PackCreature[] = [];
  const add = (source: string, y: Record<string, unknown>) => {
    const jeton = (y.jeton as Record<string, unknown> | undefined) ?? {};
    const g = typeof jeton.gorsel === 'string' ? jeton.gorsel : JETON_YEDEK;
    const art = JETON_ARKETIP[g] ?? (JETON_ARKETIP[g] === undefined && g !== JETON_YEDEK ? g : JETON_ARKETIP[JETON_YEDEK]);
    const ad = (y.ad as { tr?: string } | undefined)?.tr ?? String(y.id);
    out.push({ key: `${source}/${String(y.id)}`, source, ad, avatar: { src: `monsters/${art}.webp`, bg: '#4a5560', label: ad.slice(0, 2),
      ...(jeton.ton !== undefined ? { hue: jeton.ton as number } : {}), ...(jeton.halka ? { ring: jeton.halka as string } : {}) } });
  };
  const seen = new Set<string>();
  for (const s of subs) for (const y of s.yaratiklar ?? []) { const k = `${s.pack ?? s.class}:${String(y.id)}`; if (!seen.has(k)) { seen.add(k); add(`${s.class}/${s.id}`, y); } }
  for (const it of items as unknown as Array<{ name: string; paket?: { yaratiklar?: Array<Record<string, unknown>> } }>) for (const y of it.paket?.yaratiklar ?? []) add(`eşya/${it.name}`, y);
  return out;
}

/** Human kültür eşlemesi (rapor için). */
export const humanCultureTable = (): Record<string, string[]> => CULTURE_SKIN;
