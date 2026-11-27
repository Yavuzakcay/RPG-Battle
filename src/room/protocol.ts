/**
 * Görev ODA-1 (O1): oda mesaj protokolü (harita/belgeler/ODA-TASARIM.md §3). Saf: düz JSON mesaj tipleri, doğrulayıcı
 * (`mesajMi`), boyut sınırı ve parçalama. Bütün mesajlar `{ t: <tür>, ... }`. Bozuk ya da bilinmeyen mesaj sessizce
 * atılır (çağıran sayar). O1'de host salt izleme yayını yapar: `komut`/`zar_*`/`tepki_*` tipleri O2 için tanımlı,
 * host O1'de `komut`'u `komut_red` ile geri çevirir.
 */
import type { BattleEvent, BattleState, Command } from '../battle/types';
import type { SavedCharacter } from '../rules/builder';
import type { Rol } from './transport';

/** Protokol sürümü: mesaj biçimi değişince artar (katılımda eşit olmalı). */
export const ODA_PROTOKOL = 1;
/** Tek mesajın azami boyutu (JSON karakter sayısı); büyük `anlik` parçalanır. */
export const MESAJ_AZAMI = 4_000_000;

/** Katılımda karşılaştırılan sürüm bilgisi (Karar 3: build + kural sürümü + içerik özeti eşit olmalı). */
export interface SurumBilgisi {
  protokol: number;
  /** Build kimliği (Vite `define` `__APP_BUILD__`). */
  uygulama: string;
  /** `defaultRuleVersion()`: yeni savaşın kural sürümü. */
  kuralSurumu: number;
  /** Yüklü dış içeriğin özeti (`icerikOzeti`). Karar 4: paket JSON gönderilmez, aynı içerik şart. */
  icerik: string;
}

export type RedNedeni = 'surum' | 'anahtar' | 'dolu' | 'kilitli' | 'kapali';
export type Asama = 'lobi' | 'kurulum' | 'savas' | 'bitti';

export interface UyeOzeti { istemciId: string; ad: string; rol: Rol; bagli: boolean; karakterler: string[] }

/** Oda ayarlarının istemciye giden özeti (`src/oda/model.ts`'ten türetilir). */
export interface OdaOzeti {
  ad: string;
  gmAdi: string;
  asama: Asama;
  uyeler: UyeOzeti[];
  /** `rulesSummary` satırları: [kimlik, değer]. */
  kurallarOzeti: Array<{ id: string; value: boolean | string }>;
  hpGorunurluk: string;
  zarModu: string;
  yzKarakterler: string[];
}

/** İstemci → host. */
export type IstemciMesaji =
  | ({ t: 'katil'; istemciId: string; ad: string; anahtar?: string; sonSeq?: number } & SurumBilgisi)
  | { t: 'karakter_gonder'; kopya: SavedCharacter }
  | { t: 'karakter_geri_al'; karakterId: string }
  | { t: 'komut'; istekId: string; cmd: Command; tabanSeq: number }
  | { t: 'zar_cevap'; istekId: string; degerler?: number[]; otomatik?: true }
  | { t: 'tepki_cevap'; istekId: string; cevap: unknown }
  | { t: 'yakala'; sonSeq: number }
  | { t: 'ayril' }
  | { t: 'nabiz' };

/** Host → istemci(ler). */
export type HostMesaji =
  | { t: 'kabul'; istemciId: string; anahtar: string; rol: Rol; karakterler: string[] }
  | { t: 'red'; neden: RedNedeni; ayrinti?: string }
  | ({ t: 'oda_durumu' } & OdaOzeti)
  /**
   * Eşitleme tabanı: `durum` yoksa `olaylar` tam günlüktür (seq 0'dan); varsa `durum` ilk `tabanSeq` olayın sonucudur.
   * `donem`: host'un savaş dönemi (yeni savaş ya da kayıttan yükleme günlüğü baştan kurunca artar); dönemi farklı
   * `olaylar`/`ozet` istemcide uygulanmaz, tam anlık istenir.
   */
  | { t: 'anlik'; donem: number; tabanSeq: number; durum?: BattleState; olaylar: BattleEvent[] }
  | { t: 'olaylar'; donem: number; ilkSeq: number; olaylar: BattleEvent[]; istekId?: string; kimden?: string }
  /** Karakter kopyası kabul edilmedi (geçersiz, oda dolu, savaş sürüyor). */
  | { t: 'karakter_red'; karakterId: string; neden: 'gecersiz' | 'dolu' | 'kilitli'; ayrinti?: string }
  | { t: 'komut_red'; istekId: string; neden: 'yetki' | 'gecersiz' | 'bekle' | 'izleyici'; hata?: string }
  | { t: 'zar_iste'; istekId: string; istek: unknown }
  | { t: 'tepki_sor'; istekId: string; istek: unknown; sureMs: number }
  | { t: 'bekleniyor'; kim: string; tur: 'zar' | 'tepki' }
  | { t: 'ozet'; donem: number; seq: number; hash: string }
  | { t: 'uye_durumu'; istemciId: string; bagli: boolean; karar?: 'bekle' | 'yz' | 'gm' }
  | { t: 'karakter_sonuc'; karakterId: string; durum: unknown }
  | { t: 'oda_kapandi'; neden: string };

/** Büyük mesajın parçası (O5 aktarıcısının boyut sınırı için; bellek ve sekmede gerekmez). */
export type ParcaMesaji = { t: 'parca'; kimlik: string; i: number; n: number; veri: string };

export type OdaMesaji = IstemciMesaji | HostMesaji | ParcaMesaji;

const str = (v: unknown): v is string => typeof v === 'string';
const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const int = (v: unknown): v is number => Number.isInteger(v);
const arr = (v: unknown): v is unknown[] => Array.isArray(v);
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const opt = <T>(v: unknown, f: (x: unknown) => x is T): boolean => v === undefined || f(v);
const ROLLER: readonly string[] = ['host', 'oyuncu', 'izleyici'];
const REDLER: readonly string[] = ['surum', 'anahtar', 'dolu', 'kilitli', 'kapali'];
const ASAMALAR: readonly string[] = ['lobi', 'kurulum', 'savas', 'bitti'];
const strArr = (v: unknown): v is string[] => arr(v) && v.every(str);

/** Tür başına alan denetimi (boyut ayrı). */
const DENETIM: Record<string, (m: Record<string, unknown>) => boolean> = {
  katil: (m) => str(m.istemciId) && !!m.istemciId && str(m.ad) && opt(m.anahtar, str) && opt(m.sonSeq, int)
    && int(m.protokol) && str(m.uygulama) && num(m.kuralSurumu) && str(m.icerik),
  karakter_gonder: (m) => obj(m.kopya) && str(m.kopya.id) && obj(m.kopya.sheet),
  karakter_geri_al: (m) => str(m.karakterId),
  komut: (m) => str(m.istekId) && obj(m.cmd) && str(m.cmd.type) && int(m.tabanSeq),
  zar_cevap: (m) => str(m.istekId) && (m.otomatik === true || (arr(m.degerler) && m.degerler.every(num))),
  tepki_cevap: (m) => str(m.istekId),
  yakala: (m) => int(m.sonSeq) && (m.sonSeq as number) >= -1,
  ayril: () => true,
  nabiz: () => true,
  kabul: (m) => str(m.istemciId) && str(m.anahtar) && ROLLER.includes(m.rol as string) && strArr(m.karakterler),
  red: (m) => REDLER.includes(m.neden as string) && opt(m.ayrinti, str),
  oda_durumu: (m) => str(m.ad) && str(m.gmAdi) && ASAMALAR.includes(m.asama as string)
    && arr(m.uyeler) && m.uyeler.every((u) => obj(u) && str(u.istemciId) && str(u.ad) && ROLLER.includes(u.rol as string) && typeof u.bagli === 'boolean' && strArr(u.karakterler))
    && arr(m.kurallarOzeti) && str(m.hpGorunurluk) && str(m.zarModu) && strArr(m.yzKarakterler),
  anlik: (m) => int(m.donem) && int(m.tabanSeq) && (m.tabanSeq as number) >= 0 && arr(m.olaylar) && m.olaylar.every(obj) && opt(m.durum, obj)
    && (m.durum !== undefined || m.tabanSeq === 0),
  olaylar: (m) => int(m.donem) && int(m.ilkSeq) && (m.ilkSeq as number) >= 0 && arr(m.olaylar) && m.olaylar.every((e) => obj(e) && str(e.type)) && opt(m.istekId, str) && opt(m.kimden, str),
  komut_red: (m) => str(m.istekId) && ['yetki', 'gecersiz', 'bekle', 'izleyici'].includes(m.neden as string) && opt(m.hata, str),
  zar_iste: (m) => str(m.istekId),
  tepki_sor: (m) => str(m.istekId) && num(m.sureMs),
  bekleniyor: (m) => str(m.kim) && (m.tur === 'zar' || m.tur === 'tepki'),
  ozet: (m) => int(m.donem) && int(m.seq) && str(m.hash),
  karakter_red: (m) => str(m.karakterId) && ['gecersiz', 'dolu', 'kilitli'].includes(m.neden as string) && opt(m.ayrinti, str),
  uye_durumu: (m) => str(m.istemciId) && typeof m.bagli === 'boolean',
  karakter_sonuc: (m) => str(m.karakterId),
  oda_kapandi: (m) => str(m.neden),
  parca: (m) => str(m.kimlik) && int(m.i) && int(m.n) && (m.n as number) > 0 && (m.i as number) >= 0 && (m.i as number) < (m.n as number) && str(m.veri),
};

/** Mesajın JSON boyutu (karakter). */
export const mesajBoyutu = (m: unknown): number => { try { return JSON.stringify(m).length; } catch { return Infinity; } };

/** Geçerli bir oda mesajı mı: bilinen tür, gerekli alanlar, boyut sınırı. */
export function mesajMi(x: unknown, azami = MESAJ_AZAMI): x is OdaMesaji {
  if (!obj(x) || !str(x.t)) return false;
  const f = DENETIM[x.t];
  if (!f) return false;
  try { if (!f(x)) return false; } catch { return false; }
  return mesajBoyutu(x) <= azami;
}

/** İstemciden host'a gidebilecek tür mü (host yalnız bunları işler). */
export const istemciMesajiMi = (m: OdaMesaji): m is IstemciMesaji =>
  ['katil', 'karakter_gonder', 'karakter_geri_al', 'komut', 'zar_cevap', 'tepki_cevap', 'yakala', 'ayril', 'nabiz'].includes(m.t);

/** Büyük mesajı `azami` karakterlik parçalara böler (sığıyorsa tek öğe: mesajın kendisi). */
export function parcala(m: OdaMesaji, kimlik: string, azami = MESAJ_AZAMI): OdaMesaji[] {
  const s = JSON.stringify(m);
  if (s.length <= azami) return [m];
  const boy = Math.max(1, azami - 200);
  const n = Math.ceil(s.length / boy);
  return Array.from({ length: n }, (_, i) => ({ t: 'parca', kimlik, i, n, veri: s.slice(i * boy, (i + 1) * boy) }));
}

/** Parçaları birleştirir; tamamlanınca asıl mesajı döner (bozuksa null). */
export function birlestirici(): (p: ParcaMesaji) => OdaMesaji | null | undefined {
  const acik = new Map<string, { n: number; parcalar: string[]; gelen: number }>();
  return (p) => {
    const k = acik.get(p.kimlik) ?? { n: p.n, parcalar: new Array<string>(p.n), gelen: 0 };
    if (k.n !== p.n) { acik.delete(p.kimlik); return null; }
    if (k.parcalar[p.i] === undefined) { k.parcalar[p.i] = p.veri; k.gelen++; }
    acik.set(p.kimlik, k);
    if (k.gelen < k.n) return undefined;
    acik.delete(p.kimlik);
    try {
      const m: unknown = JSON.parse(k.parcalar.join(''));
      return mesajMi(m, Infinity) && m.t !== 'parca' ? m : null;
    } catch { return null; }
  };
}
