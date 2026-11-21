/**
 * Görsel döküm (yalnız geliştirme): otomatik kusur taraması. Oyunun kendi çözücüleriyle (`sheetAvatar` zinciri, `tintedUrl`,
 * `maskUrlFor`, `basUrlFor`, `lineageLook`, `thumbOf`) her görünüşü tarayıcıda yükler ve ölçer; hiçbir şeyi düzeltmez.
 * Kusur kodları (rapor `harita/belgeler/GORSEL-DOKUM.md`):
 * - `jeton-404`: jeton yüklenemedi, yedek zincirdeki sonraki görsel çizildi. `yer-tutucu`: hiçbiri yüklenemedi (baş harfli daire).
 * - `kucuk-404`: rozet (≤ 48 px) küçük kopyası yok (asıl görsele düşer).
 * - `alt-sinif-jeton-eksik`: jeton tablosunda alt sınıf hücresi var ama bu ırk × cinsiyet listede yok (sınıf-genel/Gariban jetona düşer).
 * - `cinsiyet-yedek`: cinsiyet kısıtlı alt sınıf seçildikten sonra cinsiyet değişti (seçim görünür kalır), jeton yedeğe düşer.
 * - `gariban-eksik`: seviye < 3'te Gariban jetonu yok (sınıf-genel jeton).
 * - `alt-sinif-jetonsuz` (bilgi): alt sınıf jeton tablosunda yok, sınıf-genel/Gariban jeton kullanılır.
 * - `maske-eksik`: maskeli soy boyası için maske yok (jeton boyasız çıkar). `boya-basarisiz`: boyama null döndü. `boya-etkisiz`: hiç piksel değişmedi.
 * - `bas-404`: kafa kaplaması kaydı var, görseli yok.
 * - `kanat-dosya-null`: kanat slotu ve seviye uyuyor ama açık kanat görseli `dosya: null`. `kanat-404`: kanat (ya da katman) görseli yok.
 *   `kanat-slot-yok`: görünüm verisi bir slota bağlı ama `kanat-esleme.json`'da slot yok.
 * - `bos-seffaf`: çizilen görselin opak payı < %2.
 * - `portre-cercevesiz`: karakter sayfası portresi (SheetView) soyun görünüm çerçevesini (filtre/oran/kanat) çizmiyor.
 * - `kucuk-farkli` (betik türetir): rozet küçük kopyası asıl jetonun küçültülmüş hâlinden belirgin farklı (eski kopya).
 */
import { lineageLook, ownWingToken, wingSlotOfSubclass, type LookSheet } from '../ui/lineageLook';
import { thumbOf } from '../ui/Avatar';
import { crownSpec } from '../ui/haloCrown';
import { basUrlFor, maskUrlFor, maskedTint, tintedUrl } from '../ui/tint';
import { wingTable } from '../ui/wingData';
import { findSubclass } from '../rules/subclasses';
import type { Avatar } from '../battle/types';
import gorunum from '../../data/alt-soy-gorunum.json';
import { JETON, tokenCode, type Gender } from './gorselDokumVeri';

const D = gorunum as unknown as { altSoylar: Record<string, { kanat?: string }>; celestialUyanis: Record<string, { kanat?: string }> };
const u = (src: string) => (src.startsWith('/') || src.startsWith('blob:') || src.startsWith('data:') ? src : `/${src}`);

const probes = new Map<string, Promise<boolean>>();
/** Görsel yüklenebiliyor mu (oyunun yedek zinciri gibi `Image` ile). */
export function probe(src: string): Promise<boolean> {
  const url = u(src);
  let p = probes.get(url);
  if (!p) {
    // Zaman aşımı (yüklü makinede sunucu geç yanıt verebilir): 30 sn'de yanıt yoksa yüklenemedi sayılır.
    p = new Promise<boolean>((resolve) => { const img = new Image(); const t = setTimeout(() => resolve(false), IMG_TIMEOUT); img.onload = () => { clearTimeout(t); resolve(img.naturalWidth > 0); }; img.onerror = () => { clearTimeout(t); resolve(false); }; img.src = url; });
    probes.set(url, p);
  }
  return p;
}

const IMG_TIMEOUT = 30_000;
const loadImg = (url: string) => new Promise<HTMLImageElement | null>((resolve) => {
  const img = new Image(); const t = setTimeout(() => resolve(null), IMG_TIMEOUT);
  img.onload = () => { clearTimeout(t); resolve(img); }; img.onerror = () => { clearTimeout(t); resolve(null); }; img.src = url;
});
/** Söz zaman aşımıyla (boyama ve piksel işleri takılırsa tarama durmasın). */
export const withTimeout = <T,>(p: Promise<T>, ms: number, fallback: T): Promise<T> => Promise.race([p, new Promise<T>((r) => setTimeout(() => r(fallback), ms))]);
async function pixels(url: string): Promise<{ w: number; h: number; data: Uint8ClampedArray } | null> {
  const img = await loadImg(u(url));
  if (!img || !img.naturalWidth) return null;
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const x = c.getContext('2d', { willReadFrequently: true });
  if (!x) return null;
  x.drawImage(img, 0, 0);
  return { w: c.width, h: c.height, data: x.getImageData(0, 0, c.width, c.height).data };
}
export interface ImgStat { w: number; h: number; opaque: number; hash: string }
const stats = new Map<string, Promise<ImgStat | null>>();
/** Görselin boyutu, opak payı (alfa > 16) ve piksel özeti (FNV-1a; aynı görseli farklı dosyada bulmak için). */
export function imgStat(src: string): Promise<ImgStat | null> {
  const url = u(src);
  let p = stats.get(url);
  if (!p) {
    p = pixels(url).then((px) => {
      if (!px) return null;
      let h = 0x811c9dc5, op = 0;
      const d = px.data;
      for (let i = 0; i < d.length; i += 4) {
        const a = d[i + 3]!;
        if (a > 16) op++;
        // Saydam piksellerin rengi önemsiz: özet yalnız görünen pikselden.
        const v = a > 16 ? ((d[i]! << 24) | (d[i + 1]! << 16) | (d[i + 2]! << 8) | a) >>> 0 : 0;
        h ^= v; h = Math.imul(h, 0x01000193) >>> 0;
      }
      return { w: px.w, h: px.h, opaque: op / (d.length / 4), hash: `${px.w}x${px.h}-${h.toString(16)}` };
    });
    stats.set(url, p);
  }
  return p;
}
/** İki görselin farklı piksel sayısı (aynı boyutta; kanal farkı > 2). */
async function diffCount(a: string, b: string): Promise<number> {
  const [x, y] = await Promise.all([pixels(a), pixels(b)]);
  if (!x || !y || x.w !== y.w || x.h !== y.h) return -1;
  let n = 0;
  for (let i = 0; i < x.data.length; i += 4) {
    if (Math.abs(x.data[i]! - y.data[i]!) > 2 || Math.abs(x.data[i + 1]! - y.data[i + 1]!) > 2 || Math.abs(x.data[i + 2]! - y.data[i + 2]!) > 2) n++;
  }
  return n;
}

const thumbDiffs = new Map<string, Promise<number>>();
/** Küçük kopya (96 px) ile asıl jetonun aynı boya ölçeklenmiş hâli arasındaki ortalama kanal farkı (0–255; görünen piksellerde). */
export function thumbDiff(src: string, thumb: string): Promise<number> {
  let p = thumbDiffs.get(thumb);
  if (!p) {
    p = (async () => {
      const [a, b] = await Promise.all([loadImg(u(src)), loadImg(u(thumb))]);
      if (!a || !b || !b.naturalWidth) return -1;
      const W = b.naturalWidth, H = b.naturalHeight;
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const x = c.getContext('2d', { willReadFrequently: true });
      if (!x) return -1;
      x.imageSmoothingQuality = 'high';
      x.drawImage(a, 0, 0, W, H);
      const da = x.getImageData(0, 0, W, H).data;
      x.clearRect(0, 0, W, H);
      x.drawImage(b, 0, 0);
      const db = x.getImageData(0, 0, W, H).data;
      let sum = 0, n = 0;
      for (let i = 0; i < da.length; i += 4) {
        if (da[i + 3]! < 32 && db[i + 3]! < 32) continue;
        sum += (Math.abs(da[i]! - db[i]!) + Math.abs(da[i + 1]! - db[i + 1]!) + Math.abs(da[i + 2]! - db[i + 2]!) + Math.abs(da[i + 3]! - db[i + 3]!)) / 4;
        n++;
      }
      return n ? sum / n : -1;
    })();
    thumbDiffs.set(thumb, p);
  }
  return p;
}

/** Görünüm verisinin bağladığı kanat slotu (dosya ve seviye denetiminden önce; `lineageLook` ile aynı seçim sırası). */
export function intendedWing(look: LookSheet): string | undefined {
  let id: string | undefined;
  if (look.raceId === 'celestial') id = (look.level ?? 1) >= 3 ? D.celestialUyanis[look.celestialAwakening ?? 'parlayan-ruh']?.kanat : undefined;
  else id = look.lineageId ? D.altSoylar[`${look.raceId}/${look.lineageId}`]?.kanat : undefined;
  const sub = wingSlotOfSubclass(look.subclassId);
  if (sub && (!look.classId || findSubclass(look.classId, look.subclassId))) id = sub;
  if (!id && look.raceId === 'dragonborn') id = 'dragonborn';
  return id;
}

export interface Kusur { kod: string; combo: string; grup: string; anahtar: string; ayrinti: string }
export interface Tarama {
  id: string; grup: string;
  /** Çizilen jeton (yedek zincirin yüklenen ilki; yoksa null) ve kısa kimliği. */
  src: string | null; code: string; chainIdx: number;
  tinted: boolean; changed: number; wing: string | null; srcHash: string | null; renderKey: string; kusurlar: string[];
  /** Küçük kopya ↔ asıl jeton ortalama farkı (eşik betikte; yoksa -1). */ thumbDiff: number; thumb: string | null;
}
export interface ScanCtx {
  id: string; grup: string;
  /** Sınıf hücresi: jeton tablosu beklentileri. */
  cls?: string; race?: string; gender?: Gender; subId?: string; level?: number; reach?: 'normal' | 'cinsiyet-sonra';
  /** Karakter ekranında uçma yeteneği (kanat) denetlensin. */
  wingCheck?: boolean;
  /** Karakter sayfası portresi (SheetView: `AvatarBadge` 84, `LookFrame` yok): soy görünümü kayboluyor mu. */
  portre?: boolean;
}

/** Bir görünüşü tarar; kusurları `out`'a ekler. */
export async function scanAvatar(av: Avatar, ctx: ScanCtx, out: Kusur[]): Promise<Tarama> {
  const k: string[] = [];
  const add = (kod: string, anahtar: string, ayrinti: string) => { k.push(kod); out.push({ kod, combo: ctx.id, grup: ctx.grup, anahtar, ayrinti }); };
  const chain = [av.src, ...(av.fallbacks ?? [])];
  const ok = await Promise.all(chain.map(probe));
  const idx = ok.indexOf(true);
  const src = idx >= 0 ? chain[idx]! : null;
  if (idx < 0) add('yer-tutucu', chain.join(' → '), `hiçbir görsel yüklenmedi: ${chain.join(', ')}`);
  else if (idx > 0) add('jeton-404', av.src, `${av.src} yok → ${src}`);
  let thDiff = -1, thumb: string | null = null;
  if (src) {
    const th = thumbOf(src);
    if (th && !(await probe(th))) add('kucuk-404', th, `küçük kopya yok: ${th}`);
    else if (th) { thumb = th; thDiff = await thumbDiff(src, th); }
  }
  // Jeton tablosu beklentileri (yalnız sınıf hücreleri; veri karşılaştırması, görsel yüklemesi değil).
  const T = ctx.cls ? JETON[ctx.cls] : undefined;
  if (T && ctx.race && ctx.gender) {
    const has = !!T.irklar[ctx.race]?.includes(ctx.gender);
    if (ctx.subId && (ctx.level ?? 1) >= 3) {
      const cell = T.altSiniflar[ctx.subId];
      if (!cell) add('alt-sinif-jetonsuz', `${ctx.cls}/${ctx.subId}`, `${ctx.cls}/${ctx.subId}: jeton tablosunda hücre yok → ${tokenCode(av.src)}`);
      else if (ctx.reach === 'cinsiyet-sonra') add('cinsiyet-yedek', `${ctx.cls}/${ctx.subId}/${ctx.gender}`, `${ctx.subId} yalnız ${T.cinsiyet?.[ctx.subId]}; ${ctx.gender} karakterde ${tokenCode(av.src)}`);
      else if (!has) add('alt-sinif-jeton-eksik', `${ctx.race}-${ctx.gender}-${ctx.cls}-${cell}`, `${ctx.race}-${ctx.gender}-${ctx.cls}-${cell} tabloda yok → ${tokenCode(av.src)}`);
    } else if (!ctx.subId && (ctx.level ?? 1) < 3 && !has) add('gariban-eksik', `${ctx.race}-${ctx.gender}-${ctx.cls}-GR`, `Gariban jetonu yok → ${tokenCode(av.src)}`);
  }
  // Soy boyası (oyundaki gibi yalnız `characters/` jetonlarında; aynı URL ile: `useTinted` önbelleği paylaşılır).
  let tinted = false, changed = 0, shown = src;
  if (src && av.tint && /(^|\/)characters\//.test(src)) {
    const url = u(src);
    const masked = maskedTint(av.tint);
    let maskOk = true;
    if (masked) {
      const m = maskUrlFor(url, av.tint);
      if (m && !(await probe(m))) { maskOk = false; add('maske-eksik', m, `maske yok (${'pul' in av.tint.to ? 'pul' : 'ten'}): ${m}`); }
      const bas = !('pul' in av.tint.to) ? basUrlFor(url) : null;
      if (bas && !(await probe(bas))) add('bas-404', bas, `kafa kaplaması görseli yok: ${bas}`);
    }
    const res = await withTimeout(tintedUrl(url, av.tint), 90_000, null);
    if (!res) { if (maskOk) add('boya-basarisiz', src, `boyama başarısız: ${src}`); }
    else {
      tinted = true; shown = res;
      changed = await diffCount(url, res);
      if (changed === 0) add('boya-etkisiz', `${src}|${JSON.stringify(av.tint.to).slice(0, 40)}`, `boya hiçbir pikseli değiştirmedi: ${src}`);
    }
  }
  const st = shown ? await imgStat(shown) : null;
  if (shown && st && st.opaque < 0.02) add('bos-seffaf', src ?? '', `görsel neredeyse boş (opak %${(st.opaque * 100).toFixed(1)}): ${src}`);
  // Kanat (karakter ekranı: uçma yeteneği; savaşta yalnız havada açılır).
  let wing: string | null = null;
  if (av.look) {
    const lk = lineageLook(av.look, { ability: true });
    const id = intendedWing(av.look);
    const slot = id ? wingTable.slotlar[id] : undefined;
    if (id && !slot) add('kanat-slot-yok', id, `görünüm verisi '${id}' slotuna bağlı, kanat-esleme.json'da yok`);
    if (lk.wing && !(src && ownWingToken(lk.wing, src))) {
      wing = lk.wing.id;
      for (const f of [lk.wing.src, ...(lk.wing.katmanlar ?? []).map((x) => x.src)]) if (!(await probe(f))) add('kanat-404', f, `kanat görseli yok: ${f}`);
    } else if (ctx.wingCheck !== false && id && slot && (av.look.level ?? 1) >= (slot.minSeviye ?? 1) && !slot.dosya) {
      add('kanat-dosya-null', id, `'${id}' slotu seviyede açık olmalı ama dosya: null`);
    }
  }
  const lk0 = av.look ? lineageLook(av.look, { ability: true }) : null;
  if (ctx.portre && av.look && lk0) {
    // SheetView portresi LookFrame'siz: filtre (--look-filter), oran (--look-sx/sy) ve kanat katmanı çizilmez; taç `crownSpec` ile doğru.
    const lost = [lk0.filter ? `filtre (${lk0.filter})` : '', lk0.scaleX !== 1 || lk0.scaleY !== 1 ? `oran ${lk0.scaleX}×${lk0.scaleY}` : '', lk0.wing && !(src && ownWingToken(lk0.wing, src)) ? `kanat ${lk0.wing.id}` : ''].filter(Boolean);
    const who = `${av.look.raceId}/${av.look.lineageId ?? av.look.celestialAwakening ?? '—'}`;
    if (lost.length) add('portre-cercevesiz', who, `${who}: karakter sayfası portresinde yok: ${lost.join(', ')} (SheetView AvatarBadge 84, LookFrame yok)`);
  }
  const srcStat = src ? await imgStat(src) : null;
  return { id: ctx.id, grup: ctx.grup, src, code: src ? tokenCode(src) : '—', chainIdx: idx, tinted, changed, wing, srcHash: srcStat?.hash ?? null,
    renderKey: [st?.hash ?? 'yok', lk0?.filter ?? '', lk0 ? `${lk0.scaleX}x${lk0.scaleY}` : '', wing ?? '', lk0?.hideHalo ? 'halesiz' : '', src && crownSpec(src, av.look) ? 'tac' : '', av.hue ?? '', av.ring ?? '', av.outfit ?? ''].join('|'), kusurlar: k,
    thumbDiff: thDiff, thumb };
}
