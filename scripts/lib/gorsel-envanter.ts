/**
 * Görsel envanter ve Dungeondex görsel eşlemesi (yalnız okuma; harita/belgeler/GORSEL-ENVANTER.md). Kayıt başına oyunda
 * GERÇEKTE kullanılan görseli bulur: büyüde gerçek motorla döküm (`observeSpell`, `src/ui/fx/e2Verify.ts`), canavarda
 * `public/monsters/<id>.webp` (çözülmüş piksel özdeşliği sharp ile), karakterde jeton tabloları (`src/battle/avatar.ts`),
 * alt soyda görünüm verisi (`data/alt-soy-gorunum.json`, `data/soy-renkleri.json`, `data/kanat-esleme.json`), eşyada tür
 * yedeği (`src/rules/itemCategory.ts`). Oyun koduna, veriye ve görsellere dokunmaz; çağıran betik (`scripts/dungeondex-gorsel-esleme.ts`)
 * JSON, belge ve CSV yazar. Önce `loadMonsters()`, `loadClassData()`, `loadSimContent()` ve `loadLang('tr')` çağrılmalı.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { armor, classes, classData, items, monsters, races, spells, weapons } from '../../src/data';
import type { Spell } from '../../src/data/types';
import { buildDex, loadDexExtras, type DexCat } from '../../src/dungeondex/catalog';
import { observeSpell } from '../../src/ui/fx/e2Verify';
import { B, FX, simgeSprite, SPELL_FX, STATUS_ICON_FILES, summonSprite } from '../../src/ui/fx/fxPlan';
import { STATUS_SPRITES, loopEffectsFor } from '../../src/ui/statusFx';
import { zoneKey } from '../../src/ui/sprites';
import { itemKind, itemTier } from '../../src/rules/itemCategory';
import { characterTokenFile, classBaseTokenFile, genericTokenRetired, lineageTint } from '../../src/battle/avatar';
import { CULTURE_SKIN, SKIN_TONES } from '../../src/ui/lineageLook';
import { subclassesOf } from '../../src/rules/classFeatures';
import { displayName } from '../../src/rules/subclasses';
import { classify, mergedOf } from './buyu-durum.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = <T>(f: string): T => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8')) as T;
const pub = (p: string) => fs.existsSync(path.join(ROOT, 'public', p));
const ls = (d: string) => (fs.existsSync(path.join(ROOT, d)) ? fs.readdirSync(path.join(ROOT, d)) : []);

export type Kaynak = 'efekt' | 'jeton' | 'ikon' | 'yedek';
/** var: kayda özel görsel; genel: paylaşılan/aile görseli (çalışır ama kayda özel değil); yedek: görsel yok, kategori glifi. */
export type Durum = 'var' | 'genel' | 'yedek';
export interface Gorunum { raceId: string; lineageId?: string; celestialAwakening?: string; classId?: string; subclassId?: string; gender?: 'erkek' | 'kadin' }
export interface GRow {
  cat: string; id: string; ad: string; kaynak: Kaynak; ref: string; durum: Durum;
  /** Efekt kimliği (`fxPlan` `FX`), `dongu:<durum şeridi>` ya da tek kare simge kimliği. */
  efekt?: string;
  nadirlikRengi?: string; gorunum?: Gorunum; glif?: string;
  /** CSV: kayıt türü, ne eksik (yoksa CSV'ye girmez), önerilen dosya adı. */
  tur: string; eksik?: string; oneri?: string; not?: string;
}

// ───────────────────────── Yedek glifleri (ortak çerçeve + kategori glifi) ─────────────────────────
/** Görsel yokken kartta çizilen kategori glifi (Dungeondex vitrini ve galeri aynı tabloyu okur). */
export const YEDEKLER: Record<string, { glif: string; tr: string; en: string }> = {
  'esya-silah': { glif: '⚔', tr: 'Silah', en: 'Weapon' }, 'esya-zirh': { glif: '🛡', tr: 'Zırh', en: 'Armor' },
  'esya-kalkan': { glif: '◈', tr: 'Kalkan', en: 'Shield' }, 'esya-tuketilebilir': { glif: '⚗', tr: 'Tüketilebilir', en: 'Consumable' },
  'esya-aksesuar': { glif: '💍', tr: 'Aksesuar', en: 'Accessory' }, 'esya-sihirli': { glif: '✦', tr: 'Sihirli eşya', en: 'Magic item' },
  'esya-arac': { glif: '⚒', tr: 'Araç gereç', en: 'Gear' },
  'okul-abjuration': { glif: '⛨', tr: 'Abjuration', en: 'Abjuration' }, 'okul-conjuration': { glif: '✺', tr: 'Conjuration', en: 'Conjuration' },
  'okul-divination': { glif: '◉', tr: 'Divination', en: 'Divination' }, 'okul-enchantment': { glif: '♥', tr: 'Enchantment', en: 'Enchantment' },
  'okul-evocation': { glif: '✷', tr: 'Evocation', en: 'Evocation' }, 'okul-illusion': { glif: '◐', tr: 'Illusion', en: 'Illusion' },
  'okul-necromancy': { glif: '☠', tr: 'Necromancy', en: 'Necromancy' }, 'okul-transmutation': { glif: '⟳', tr: 'Transmutation', en: 'Transmutation' },
  'feat-origin': { glif: '❖', tr: 'Köken feat', en: 'Origin feat' }, 'feat-general': { glif: '✚', tr: 'Genel feat', en: 'General feat' },
  'feat-fighting-style': { glif: '⚔', tr: 'Fighting Style', en: 'Fighting Style' }, 'feat-epic-boon': { glif: '★', tr: 'Epic Boon', en: 'Epic Boon' },
  gecmis: { glif: '📜', tr: 'Geçmiş', en: 'Background' }, invocation: { glif: '⛧', tr: 'Invocation', en: 'Invocation' },
  metamagic: { glif: '⚛', tr: 'Metamagic', en: 'Metamagic' },
  'eylem-action': { glif: '●', tr: 'Eylem', en: 'Action' }, 'eylem-bonus': { glif: '▲', tr: 'Hızlı eylem', en: 'Bonus action' },
  'eylem-reaction': { glif: '↺', tr: 'Tepki', en: 'Reaction' }, 'eylem-passive': { glif: '◇', tr: 'Pasif', en: 'Passive' },
  'eylem-free': { glif: '○', tr: 'Serbest', en: 'Free' }, 'eylem-resource': { glif: '◆', tr: 'Kaynak', en: 'Resource' },
  'hasar-acid': { glif: '💧', tr: 'Acid', en: 'Acid' }, 'hasar-bludgeoning': { glif: '🔨', tr: 'Bludgeoning', en: 'Bludgeoning' },
  'hasar-cold': { glif: '❄', tr: 'Cold', en: 'Cold' }, 'hasar-fire': { glif: '🔥', tr: 'Fire', en: 'Fire' },
  'hasar-force': { glif: '✧', tr: 'Force', en: 'Force' }, 'hasar-lightning': { glif: 'ϟ', tr: 'Lightning', en: 'Lightning' },
  'hasar-necrotic': { glif: '☠', tr: 'Necrotic', en: 'Necrotic' }, 'hasar-piercing': { glif: '➶', tr: 'Piercing', en: 'Piercing' },
  'hasar-poison': { glif: '☣', tr: 'Poison', en: 'Poison' }, 'hasar-psychic': { glif: '◎', tr: 'Psychic', en: 'Psychic' },
  'hasar-radiant': { glif: '☀', tr: 'Radiant', en: 'Radiant' }, 'hasar-slashing': { glif: '⚔', tr: 'Slashing', en: 'Slashing' },
  'hasar-thunder': { glif: '♫', tr: 'Thunder', en: 'Thunder' },
  nesne: { glif: '▣', tr: 'Nesne', en: 'Object' }, alan: { glif: '⬡', tr: 'Alan (renkli altıgen)', en: 'Area (colored hex)' },
  zar: { glif: '⚀', tr: 'Klasik zar', en: 'Classic die' },
};
/** Etki seviyesi renkleri (oluşturucunun kenar şeridiyle aynı: `src/styles.css` `.chip.equip.tier-*`; sıradan gri). */
export const NADIRLIK_RENKLERI: Record<string, string> = { siradan: '#9aa0a6', olagandisi: '#4caf50', nadir: '#3d8bfd', cokNadir: '#a259ff', efsanevi: '#f0a020' };

// ───────────────────────── Büyüler ─────────────────────────
const BX = B as unknown as {
  zemin?: Record<string, string>; zeminKucuk?: Record<string, { efekt: string } | string>; duvar: Record<string, string>; auraBuyu?: Record<string, { sprite: string }>;
  etkiHalka?: Record<string, { sprite: string }>; cagirRenk?: Record<string, { sprite: string; ton?: string }>; rozetBuyu?: Record<string, string>;
};
const ZONES = read<{ zones: Record<string, { sprites: string[] }> }>('data/sprite-esleme.json').zones;
/** Büyüye özel bağlamanın çizim anahtarları (fxPlan kurallarıyla aynı önekler). */
function specificKeys(id: string): Set<string> {
  const k = new Set<string>();
  const f = SPELL_FX[id];
  if (f) { if (f.yol === 'isaret' && f.simge) k.add(`isaret-${f.simge}`); if (f.sprite) k.add(f.sprite); if (f.ek) k.add(f.ek); }
  if (BX.zemin?.[id]) k.add(`zemin:${BX.zemin[id]}`);
  // Control Water: küçük alanın ikinci varyantı (`zeminKucuk`) da büyüye özel.
  const zk = BX.zeminKucuk?.[id];
  if (zk && typeof zk === 'object') k.add(`zemin:${zk.efekt}`);
  if (BX.duvar[id]) k.add(`duvar:${BX.duvar[id]}`);
  if (BX.auraBuyu?.[id]) k.add(`aura:${BX.auraBuyu[id]!.sprite}`);
  if (BX.etkiHalka?.[id]) k.add(`aura:${BX.etkiHalka[id]!.sprite}`);
  if (BX.cagirRenk?.[id]) k.add(BX.cagirRenk[id]!.sprite);
  return k;
}
const GENERIC = new Set(['darbe-buyu', 'cagir-portal', 'aura:aura-altin']);
/** Efekt anahtarı → public/ yolu ve efekt kimliği. */
export function fxRef(key: string): { ref: string; efekt: string } | null {
  const id = key.replace(/^(zemin|duvar|aura):/, '');
  if (FX[id]) return { ref: FX[id]!.file, efekt: id };
  if (id.startsWith('isaret-')) { const s = simgeSprite('isaret', id.slice(7)); if (s) return { ref: s.file, efekt: id }; }
  return null;
}
const statusLoop = (id: string) => STATUS_SPRITES.find((s) => s.id === id);
const iconOfCond = (c: string) => STATUS_ICON_FILES[c.toLowerCase()];

export interface SpellObs { id: string; fx: string[]; yuzey: string[]; yerTutucu: number; dongu: string[]; filtre: string[]; rozet: string[]; durum: string[]; cast: boolean; how: string }

export function spellRows(): { rows: GRow[]; obs: SpellObs[]; combat: Set<string> } {
  const deps = { zoneKeyOf: (z: { surface?: string; spellId: string }) => zoneKey(z as never), zoneHas: (k: string) => k in ZONES, loopsOf: (c: Parameters<typeof loopEffectsFor>[0]) => loopEffectsFor(c).map((x) => x.id) };
  const obs: SpellObs[] = [];
  const combat = new Set<string>();
  const rows = [...spells].sort((a, b) => a.id.localeCompare(b.id)).map((s: Spell): GRow => {
    const o = observeSpell(s, deps as never) as SpellObs;
    obs.push(o);
    const off = classify(s as never).durum === 'savaş dışı';
    if (!off) combat.add(s.id);
    const m = mergedOf(s as never) as { kind?: string };
    const base = { cat: 'buyu', id: s.id, ad: s.name, tur: off ? 'savaş dışı büyü' : 'savaş büyüsü' };
    const spec = specificKeys(s.id);
    const yedekRef = `yedek:okul-${(s.school ?? 'evocation').toLowerCase()}`;
    const oneri = off ? `public/buyu/${s.id}.webp` : `public/efekt/efekt-${s.id}.webp`;
    // 1) Sprite efekti (tek seferlik/kalıcı).
    const keys = o.fx.filter((k) => fxRef(k));
    if (keys.length) {
      const pick = keys.find((k) => spec.has(k)) ?? keys.find((k) => !GENERIC.has(k)) ?? keys[0]!;
      const r = fxRef(pick)!;
      const own = spec.has(pick);
      return { ...base, kaynak: 'efekt', ref: r.ref, efekt: r.efekt, durum: own ? 'var' : 'genel',
        ...(own ? {} : { eksik: `büyüye özel efekt yok (genel: ${r.efekt})`, oneri }), not: o.fx.join(', ') };
    }
    // 2) Büyü alanı / yüzey sprite'ı (SurfaceLayer).
    if (o.yuzey.length) {
      const z = ZONES[o.yuzey[0]!]!;
      const own = o.yuzey[0] === `spells:${s.id}`;
      return { ...base, kaynak: 'efekt', ref: `sprites/${z.sprites[0]}.webp`, durum: own ? 'var' : 'genel', ...(own ? {} : { eksik: 'büyüye özel alan dokusu yok', oneri }), not: `alan dokusu ${o.yuzey.join(', ')}` };
    }
    // 3) Durum döngüsü, rozet, durum ikonu (CSS filtresi).
    if (o.dongu.length) {
      const l = statusLoop(o.dongu[0]!)!;
      return { ...base, kaynak: 'efekt', ref: l.file, efekt: `dongu:${l.id}`, durum: 'genel', eksik: `büyüye özel efekt yok (durum döngüsü: ${l.id})`, oneri, not: `durum: ${o.durum.join(', ')}` };
    }
    if (o.rozet.length) return { ...base, kaynak: 'ikon', ref: o.rozet[0]!, durum: 'genel', eksik: 'yalnız rozet (sayı oku)', oneri, not: 'rozet' };
    const cond = [...o.filtre, ...o.durum].find((c) => iconOfCond(c));
    if (cond) return { ...base, kaynak: 'ikon', ref: iconOfCond(cond)!, durum: 'genel', eksik: `yalnız durum ikonu/jeton filtresi (${cond})`, oneri, not: o.filtre.length ? `CSS filtresi: ${o.filtre.join(', ')}` : `durum: ${cond}` };
    // 4) Gözlenemeyen döküm (kurulumda ritüel, hedef gerektiren): fxPlan kuralından tahmin.
    if (!o.cast && m.kind === 'summon') {
      const sp = summonSprite({ summon: { spellId: s.id } } as never)!;
      return { ...base, kaynak: 'efekt', ref: sp.file, efekt: sp.id, durum: 'genel', eksik: `büyüye özel efekt yok (genel: ${sp.id})`, oneri, not: 'gözlenmedi: çağırma kuralı (kurulumda ritüel)' };
    }
    if (!o.cast && m.kind === 'teleport') {
      const r = fxRef(B.isinlan.giris)!;
      return { ...base, kaynak: 'efekt', ref: r.ref, efekt: r.efekt, durum: 'genel', eksik: `büyüye özel efekt yok (genel: ${r.efekt})`, oneri, not: 'gözlenmedi: ışınlanma kuralı (hedef ağaç gerekir)' };
    }
    // 5) Görsel yok.
    if (pub(`buyu/${s.id}.webp`)) return { ...base, kaynak: 'ikon', ref: `buyu/${s.id}.webp`, durum: off ? 'var' : 'genel', ...(off ? {} : { eksik: 'savaşta görsel yok (yalnız kart ikonu)', oneri }), not: 'kart ikonu' };
    const why = o.yerTutucu ? 'yalnız renkli altıgen yer tutucusu' : o.cast ? 'döküm görsel üretmiyor' : 'döküm gözlenemedi';
    return { ...base, kaynak: 'yedek', ref: yedekRef, durum: 'yedek', eksik: off ? 'görsel yok (savaş dışı; kartta okul glifi)' : `savaşta görsel yok (${why})`, oneri, not: why };
  });
  return { rows, obs, combat };
}

// ───────────────────────── Eşyalar ─────────────────────────
export function itemRows(): GRow[] {
  const out: GRow[] = [];
  for (const it of items) {
    const kind = itemKind(it);
    const magic = it.srd.startsWith('magic-items');
    const tier = itemTier(it);
    if (pub(`esya/${it.id}.webp`)) { out.push({ cat: 'esya', id: it.id, ad: it.name, kaynak: 'ikon', ref: `esya/${it.id}.webp`, durum: 'var', ...(magic ? { nadirlikRengi: NADIRLIK_RENKLERI[tier] } : {}), tur: magic ? `sihirli eşya (${tier})` : 'donanım' }); continue; }
    out.push({ cat: 'esya', id: it.id, ad: it.name, kaynak: 'yedek', ref: `yedek:esya-${kind}`, durum: 'yedek',
      ...(magic ? { nadirlikRengi: NADIRLIK_RENKLERI[tier] } : {}),
      tur: magic ? `sihirli eşya (${tier})` : it.srd.startsWith('tools') ? 'alet' : 'donanım', eksik: `ikon yok (tür yedeği: ${kind})`, oneri: `public/esya/${it.id}.webp` });
  }
  const own = (id: string, ad: string, tur: string): boolean => (pub(`esya/${id}.webp`) ? (out.push({ cat: 'esya', id, ad, kaynak: 'ikon', ref: `esya/${id}.webp`, durum: 'var', tur }), true) : false);
  for (const w of weapons) if (!own(w.id, w.name, 'silah')) out.push({ cat: 'esya', id: w.id, ad: w.name, kaynak: 'yedek', ref: 'yedek:esya-silah', durum: 'yedek', tur: 'silah', eksik: 'ikon yok (tür yedeği: silah)', oneri: `public/esya/${w.id}.webp` });
  for (const a of armor as Array<(typeof armor)[number] & { srd?: string; type?: string }>) {
    if (!a.srd) continue;
    const id = String(a.srd).split(':')[1]!;
    const k = a.type === 'shield' ? 'kalkan' : 'zirh';
    if (own(id, a.name, k === 'kalkan' ? 'kalkan' : 'zırh')) continue;
    out.push({ cat: 'esya', id, ad: a.name, kaynak: 'yedek', ref: `yedek:esya-${k}`, durum: 'yedek', tur: k === 'kalkan' ? 'kalkan' : 'zırh', eksik: `ikon yok (tür yedeği: ${k})`, oneri: `public/esya/${id}.webp` });
  }
  return out;
}

// ───────────────────────── Canavarlar ─────────────────────────
const SCALE = read<{ scale: Record<string, number>; race: Record<string, number> }>('data/token-sizes.json');
export interface MonsterInfo { sameAs: Map<string, string[]>; distinct: number; files: number; uyku: string[] }
export async function monsterRows(): Promise<{ rows: GRow[]; info: MonsterInfo }> {
  const files = ls('public/monsters').filter((f) => f.endsWith('.webp'));
  const hash = new Map<string, string>();
  for (const f of files) {
    const raw = await sharp(path.join(ROOT, 'public/monsters', f)).ensureAlpha().raw().toBuffer();
    hash.set(f.replace(/\.webp$/, ''), (await import('node:crypto')).createHash('sha1').update(raw).digest('hex'));
  }
  const byHash = new Map<string, string[]>();
  for (const [id, h] of hash) byHash.set(h, [...(byHash.get(h) ?? []), id]);
  const sameAs = new Map<string, string[]>();
  for (const ids of byHash.values()) if (ids.length > 1) for (const id of ids) sameAs.set(id, ids.filter((x) => x !== id));
  const rows = monsters.map((m): GRow => {
    const ref = (m.avatar ?? `monsters/${m.id}.webp`).replace(/^\//, '');
    const same = (sameAs.get(m.id) ?? []).filter((x) => !x.endsWith('-uyku'));
    const size = m.size ?? 'M';
    const base = { cat: 'canavar', id: m.id, ad: m.name, tur: `canavar ${size} (ölçek ${SCALE.scale[size] ?? 1})` };
    if (!pub(ref)) return { ...base, kaynak: 'yedek', ref: 'yedek:nesne', durum: 'yedek', eksik: 'jeton görseli yok', oneri: `public/monsters/${m.id}.webp` };
    return { ...base, kaynak: 'jeton', ref, durum: same.length ? 'genel' : 'var',
      ...(same.length ? { eksik: `kendi görseli yok (aynı görüntü: ${same.join(', ')})`, oneri: `public/monsters/${m.id}.webp`, not: `aynı görüntü: ${same.join(', ')}` } : {}) };
  });
  return { rows, info: { sameAs, distinct: byHash.size, files: files.length, uyku: files.filter((f) => f.endsWith('-uyku.webp')).map((f) => f.replace(/-uyku\.webp$/, '')) } };
}

// ───────────────────────── Tür, alt soy, sınıf, alt sınıf ─────────────────────────
const LOOK = read<{ altSoylar: Record<string, { orijinal?: boolean; filtre?: string; oran?: { en: number; boy: number }; kanat?: string }>;
  celestialUyanis: Record<string, { hale?: boolean; orijinal?: boolean; filtre?: string; kanat?: string }> }>('data/alt-soy-gorunum.json');
const WINGS = read<{ slotlar: Record<string, { dosya: string | null; altSinif?: string; minSeviye?: number; kanatsiz?: string[] }>; klasor?: string }>('data/kanat-esleme.json');
const REP_CLASS = 'fighter';
/** Irkın temsil jetonu: sınıf-genel jeton; sınıf-genel jetonu kaldırılmış ırkta (Dragonborn) temsil sınıfının Gariban jetonu. */
const raceToken = (raceId: string) => `characters/${classBaseTokenFile(raceId, 'erkek', REP_CLASS) ?? characterTokenFile(raceId, 'erkek', REP_CLASS)}`;

export function speciesRows(): GRow[] {
  return races.map((r): GRow => ({ cat: 'tur', id: r.id, ad: r.name, kaynak: 'jeton', ref: raceToken(r.id), durum: pub(raceToken(r.id)) ? 'var' : 'yedek',
    gorunum: { raceId: r.id, classId: REP_CLASS, gender: 'erkek' }, tur: `tür (jeton ölçeği ${SCALE.race[r.id] ?? 1})`,
    not: genericTokenRetired(r.id) ? `Gariban + alt sınıf jetonları (${r.id}-<erkek|kadin>-<sınıf>-<hücre>); sınıf-genel jeton yok` : `24 sınıf-genel jeton (${r.id}-<male|female>-<sınıf>)` }));
}

/** Alt soyun görünüm farkları (boş: ırk tabanıyla aynı). */
export function lineageLookParts(raceId: string, lineageId: string): string[] {
  const parts: string[] = [];
  if (lineageTint(raceId, lineageId, 'erkek')) parts.push('soy rengi');
  const l = LOOK.altSoylar[`${raceId}/${lineageId}`];
  if (l?.filtre) parts.push('CSS filtresi');
  if (l?.oran && (l.oran.en !== 1 || l.oran.boy !== 1)) parts.push(`oran ${l.oran.en}×${l.oran.boy}`);
  if (l?.kanat) parts.push(`kanat (${l.kanat})`);
  if (raceId === 'human') {
    const choices = (CULTURE_SKIN[lineageId] ?? []).map((id) => SKIN_TONES.find((x) => x.id === id)).filter((x) => !!x);
    if (choices.length > 1) parts.push(`ten tonu seçilebilir (${choices.map((x) => x!.ad.tr).join(', ')})`);
    else if (choices[0]?.renk) parts.push(`ten tonu ${choices[0].ad.tr}`);
  }
  if (raceId === 'dragonborn' && WINGS.slotlar.dragonborn) parts.push(`kanat ${WINGS.slotlar.dragonborn.minSeviye ?? 1}+. seviye`);
  return parts;
}

export function lineageRows(): GRow[] {
  const out: GRow[] = [];
  for (const r of races) {
    for (const l of r.lineages ?? []) {
      const parts = lineageLookParts(r.id, l.id);
      const orig = !!LOOK.altSoylar[`${r.id}/${l.id}`]?.orijinal;
      out.push({ cat: 'altsoy', id: `${r.id}/${l.id}`, ad: `${r.name} · ${l.name}`, kaynak: 'jeton', ref: raceToken(r.id), durum: parts.length ? 'var' : 'genel',
        gorunum: { raceId: r.id, lineageId: l.id, classId: REP_CLASS, gender: 'erkek' }, tur: 'alt soy',
        not: parts.length ? parts.join(', ') : orig ? 'orijinal görünüm (ırk tabanı; kullanıcı kararı)' : 'ırk tabanıyla aynı',
        ...(!parts.length && !orig ? { eksik: 'ayrı görünüm yok (ırk tabanı)', oneri: `data/alt-soy-gorunum.json altSoylar["${r.id}/${l.id}"]` } : {}) });
    }
  }
  for (const [id, v] of Object.entries(LOOK.celestialUyanis)) {
    const parts = [v.filtre ? 'CSS filtresi' : '', v.kanat ? `kanat (${v.kanat})` : '', v.hale ? 'hale' : ''].filter(Boolean);
    out.push({ cat: 'altsoy', id: `celestial/${id}`, ad: `Celestial · ${id}`, kaynak: 'jeton', ref: raceToken('celestial'), durum: parts.length ? 'var' : 'genel',
      gorunum: { raceId: 'celestial', celestialAwakening: id, classId: REP_CLASS, gender: 'erkek' }, tur: 'Göksel Uyanış', not: parts.join(', ') || 'ırk tabanı' });
  }
  return out;
}

interface JetonTable { sinif: string; irklar: Record<string, Array<'erkek' | 'kadin'>>; altSiniflar: Record<string, string>; cinsiyet?: Record<string, 'erkek' | 'kadin'>; formlar?: Record<string, { ikinci: string }> }
export function jetonTables(): JetonTable[] {
  return ls('data').filter((f) => f.endsWith('-jeton.json')).sort().map((f) => read<JetonTable>(`data/${f}`));
}
const KALDIRILAN = new Set(read<{ kaldirilan: Array<{ id: string }> }>('data/alt-sinif-gorunum.json').kaldirilan.map((x) => x.id));
const ICERIK_ADLARI = new Map(fs.existsSync(path.join(ROOT, 'icerik-liste.txt'))
  ? fs.readFileSync(path.join(ROOT, 'icerik-liste.txt'), 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter(Boolean).map((l) => l.split(' | ')).map((p) => [p[2]!, p[3]!] as [string, string]) : []);

export function subclassRows(): { rows: GRow[]; loaded: number; total: number } {
  const chars = new Set(ls('public/characters'));
  const loaded = new Map(classes.flatMap((c) => subclassesOf(c.id).map((s) => [s.id, { c: c.id, s }] as const)));
  const rows: GRow[] = [];
  for (const T of jetonTables()) {
    const cellUse = new Map<string, string[]>();
    for (const [sid, cell] of Object.entries(T.altSiniflar)) if (!KALDIRILAN.has(sid)) cellUse.set(cell, [...(cellUse.get(cell) ?? []), sid]);
    for (const [sid, cell] of Object.entries(T.altSiniflar)) {
      if (KALDIRILAN.has(sid)) continue;
      const only = T.cinsiyet?.[sid];
      const gender = only ?? 'erkek';
      const need = Object.entries(T.irklar).flatMap(([r, gs]) => gs.filter((g) => !only || g === only).map((g) => `${r}-${g}-${T.sinif}-${cell}.webp`));
      const missing = need.filter((f) => !chars.has(f));
      const L = loaded.get(sid);
      const nm = L ? displayName(L.s.name, T.sinif) : null;
      const ad = nm?.tr || nm?.en || ICERIK_ADLARI.get(sid) || sid;
      const shared = (cellUse.get(cell) ?? []).filter((x) => x !== sid);
      const ref = `characters/human-${gender}-${T.sinif}-${cell}.webp`;
      rows.push({ cat: 'altsinif', id: sid, ad, kaynak: 'jeton', ref, durum: missing.length === need.length ? 'yedek' : shared.length || missing.length ? 'genel' : 'var',
        gorunum: { raceId: 'human', classId: T.sinif, subclassId: sid, gender }, tur: `${T.sinif} alt sınıfı${L ? '' : ' (içerik eksik)'}`,
        not: [`hücre ${cell}`, `${need.length - missing.length}/${need.length} jeton`, only ? `yalnız ${only}` : '', T.formlar?.[sid] ? `2. form ${T.formlar[sid]!.ikinci}` : '', L ? '' : 'içerik bu ortamda yüklü değil'].filter(Boolean).join(', '),
        ...(missing.length ? { eksik: `${missing.length} jeton yok`, oneri: missing.slice(0, 3).join(' ') } : shared.length ? { eksik: `hücre paylaşılıyor (${shared.join(', ')})`, oneri: `characters/<ırk>-<cinsiyet>-${T.sinif}-<yeni hücre>.webp` } : {}) });
    }
  }
  return { rows: rows.sort((a, b) => a.id.localeCompare(b.id)), loaded: rows.filter((r) => loaded.has(r.id)).length, total: rows.length };
}

export function classRows(dexSinif: Array<{ id: string; name: string; f: Record<string, string> }>): GRow[] {
  return dexSinif.map((e): GRow => {
    const kind = e.f.kind ?? 'class';
    if (kind === 'class') {
      const ref = `characters/human-male-${e.id}.webp`;
      return { cat: 'sinif', id: e.id, ad: e.name, kaynak: 'jeton', ref, durum: pub(ref) ? 'var' : 'yedek', gorunum: { raceId: 'human', classId: e.id, gender: 'erkek' }, tur: 'sınıf', not: 'sınıf-genel jeton (10 tür × 2 cinsiyet)' };
    }
    return { cat: 'sinif', id: e.id, ad: e.name, kaynak: 'yedek', ref: `yedek:${kind}`, durum: 'yedek', tur: kind === 'invocation' ? 'Invocation' : 'Metamagic', not: 'kategori glifi yeterli (kayda özel resim gerekmez)' };
  });
}

// ───────────────────────── Feat, geçmiş, durum ─────────────────────────
export function featRows(): GRow[] {
  return classData.feats.map((f) => ({ cat: 'feat', id: f.id, ad: f.name, kaynak: 'yedek' as const, ref: `yedek:feat-${f.category.toLowerCase().replace(/\s+/g, '-')}`, durum: 'yedek' as const, tur: `feat (${f.category})`, not: 'kategori glifi' }));
}
export function backgroundRows(list: Array<{ id: string; name: string }>): GRow[] {
  return list.map((b) => ({ cat: 'gecmis', id: b.id, ad: b.name, kaynak: 'yedek' as const, ref: 'yedek:gecmis', durum: 'yedek' as const, tur: 'geçmiş', not: 'kategori glifi' }));
}
const CSS_FILTER = ['petrified', 'blinded', 'invisible', 'unconscious', 'prone', 'exhaustion'];
export function conditionRows(ids: string[], names: Record<string, string>): GRow[] {
  return ids.map((id): GRow => {
    const cap = id[0]!.toUpperCase() + id.slice(1);
    const loop = STATUS_SPRITES.find((s) => s.conditions.includes(cap));
    const icon = STATUS_ICON_FILES[id];
    const not = [loop ? `döngü ${loop.id}` : '', icon ? 'ikon' : '', CSS_FILTER.includes(id) ? 'CSS jeton filtresi' : ''].filter(Boolean).join(', ');
    if (loop) return { cat: 'durum', id, ad: names[id] ?? cap, kaynak: 'efekt', ref: loop.file, efekt: `dongu:${loop.id}`, durum: 'var', tur: 'durum', not };
    if (icon) return { cat: 'durum', id, ad: names[id] ?? cap, kaynak: 'ikon', ref: icon, durum: 'var', tur: 'durum', not };
    return { cat: 'durum', id, ad: names[id] ?? cap, kaynak: 'yedek', ref: 'yedek:nesne', durum: 'yedek', tur: 'durum', eksik: 'ikon yok', oneri: `public/sprites/efekt-ikon-${id}.webp` };
  });
}

// ───────────────────────── Ek: yüzey, nesne, alan, zar ─────────────────────────
export function extraRows(spellCombat: Set<string>): { yuzey: GRow[]; nesne: GRow[]; alan: GRow[]; zar: GRow[]; zarInfo: { tanimli: number; setli: number; hedef: number } } {
  const yz = read<{ kinds: Record<string, unknown> }>('data/yuzeyler.json');
  const yuzey = Object.keys(yz.kinds).map((k): GRow => {
    const z = ZONES[`surface:${k}`];
    return z ? { cat: 'yuzey', id: k, ad: k, kaynak: 'efekt', ref: `sprites/${z.sprites[0]}.webp`, durum: 'var', tur: 'yüzey', not: z.sprites.join(', ') }
      : { cat: 'yuzey', id: k, ad: k, kaynak: 'yedek', ref: 'yedek:alan', durum: 'yedek', tur: 'yüzey', eksik: 'sprite yok (renkli altıgen)', oneri: `assets-ham/sprite/yuzey-${k}-1.png → public/sprites/yuzey-${k}-1.webp` };
  });
  const obj = read<{ kinds: Record<string, { tr: string; icon?: string }> }>('data/nesneler.json');
  const objSp = read<{ objects: Record<string, { sprites: string[] }> }>('data/sprite-esleme.json').objects;
  const nesne = Object.entries(obj.kinds).map(([k, v]): GRow => {
    const sp = objSp[k];
    return sp && pub(`sprites/${sp.sprites[0]}.webp`) ? { cat: 'nesne', id: k, ad: v.tr, kaynak: 'efekt', ref: `sprites/${sp.sprites[0]}.webp`, durum: 'var', tur: 'harita nesnesi', glif: v.icon }
      : { cat: 'nesne', id: k, ad: v.tr, kaynak: 'yedek', ref: 'yedek:nesne', durum: 'yedek', glif: v.icon, tur: 'harita nesnesi', eksik: `sprite yok (emoji ${v.icon ?? ''})`, oneri: `assets-ham/sprite/nesne-${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}.png → public/sprites/nesne-${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}.webp` };
  });
  // Kalıcı büyü alanları (savaştaki): alan dokusu, zemin/duvar/aura bağlaması ya da renkli yer tutucu.
  const alan: GRow[] = [];
  for (const s of [...spells].sort((a, b) => a.id.localeCompare(b.id))) {
    const m = mergedOf(s as never) as { zone?: { anchorSelf?: boolean } };
    if (!m.zone || !spellCombat.has(s.id)) continue;
    const own = ZONES[`spells:${s.id}`] ? `sprites/${ZONES[`spells:${s.id}`]!.sprites[0]}.webp`
      : BX.zemin?.[s.id] ? fxRef(BX.zemin[s.id]!)?.ref : BX.duvar[s.id] ? fxRef(BX.duvar[s.id]!)?.ref : BX.auraBuyu?.[s.id] ? fxRef(BX.auraBuyu[s.id]!.sprite)?.ref : undefined;
    const anchored = !!(m.zone.anchorSelf || s.area?.shape === 'emanation');
    if (own) alan.push({ cat: 'alan', id: s.id, ad: s.name, kaynak: 'efekt', ref: own, durum: 'var', tur: 'büyü alanı' });
    else if (anchored) alan.push({ cat: 'alan', id: s.id, ad: s.name, kaynak: 'efekt', ref: fxRef(B.aura.varsayilan)!.ref, durum: 'genel', tur: 'büyü alanı (aura)', eksik: 'aura varsayılan rengi (aura-altin)', oneri: `public/efekt/efekt-zemin-${s.id}.webp` });
    else alan.push({ cat: 'alan', id: s.id, ad: s.name, kaynak: 'yedek', ref: 'yedek:alan', durum: 'yedek', tur: 'büyü alanı', eksik: 'alan dokusu yok (renkli altıgen yer tutucusu)', oneri: `public/efekt/efekt-zemin-${s.id}.webp` });
  }
  const zg = read<{ themes: Array<{ id: string; name: { tr: string }; kategori?: string; seti?: string; dice?: Record<string, { image: string }> }> }>('data/zar-gorselleri.json');
  const zar = zg.themes.map((th): GRow => {
    const dir = th.seti ?? (th.dice ? path.dirname(Object.values(th.dice)[0]!.image) : null);
    const n = dir ? ls(`public/${dir}`).filter((f) => f.endsWith('.webp')).length : 0;
    return n >= 7 ? { cat: 'zar', id: th.id, ad: th.name.tr, kaynak: 'ikon', ref: `${dir}/d20.webp`, durum: 'var', tur: `zar teması (${th.kategori ?? '—'})` }
      : { cat: 'zar', id: th.id, ad: th.name.tr, kaynak: 'yedek', ref: 'yedek:zar', durum: 'yedek', tur: `zar teması (${th.kategori ?? '—'})`, eksik: `zar seti yok (${n}/7; klasik görsel + 3D renkleri)`, oneri: `assets-ham/zarlar/zar-${th.id}.jpg → public/zarlar/${th.id}/d4..d100.webp` };
  });
  return { yuzey, nesne, alan, zar, zarInfo: { tanimli: zar.length, setli: zar.filter((z) => z.durum === 'var').length, hedef: 100 } };
}

// ───────────────────────── Dungeondex kayıtları ─────────────────────────
export async function dexEntries(): Promise<Record<DexCat, Array<{ id: string; name: string; f: Record<string, string> }>>> {
  const x = await loadDexExtras();
  return buildDex({ ...x, mapNames: {} }) as never;
}

/** Bir ref'in çözülüp çözülmediği (public dosyası ya da yedek tablosu). */
export const resolves = (ref: string): boolean => (ref.startsWith('yedek:') ? ref.slice(6) in YEDEKLER : pub(ref));
