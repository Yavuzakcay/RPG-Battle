/**
 * Görev ODA-2 (O2): yerel ağ aktarıcısının saf çekirdeği (ODA-TASARIM.md §2 (b)). Oyun mantığı çalıştırmaz, mesajın
 * içine bakmaz (yalnız `kabul`/`red` türüne: bağlantı bağlamak için); zarfı yönlendirir. Soket soyut (`AktariciSoket`):
 * node bağlaması `aktariciNode.ts` (`ws`), testte bellek içi soketler.
 *
 * - Oda kodu → bir host bağlantısı + oyuncu bağlantıları. `kimden`'i aktarıcı yazar (bağlantının söylediği kimlik).
 * - Her oyuncu bağlantısı önce **aday**dır: yalnız `katil` gönderebilir, aktarıcı zarfa bağlantı kimliğini (`bag`)
 *   yazar. Host `kabul`'ü aynı `bag` ile yanıtlarsa kimlik o bağlantıya bağlanır; aynı kimliğin eski bağlantısı varsa
 *   `degisti` ile düşürülür (doğru oturum anahtarıyla yeni bağlantı eskinin yerini alır). `red` adaya gider ve
 *   bağlantı kapanır; yanlış anahtarla gelen hiçbir zaman bağlanmaz, başkasının mesajını alamaz.
 * - Host kopunca odadakilere `host_gitti` gider ve oda kapanır (yeniden açma O4). Bağlı oyuncu kopunca host'a
 *   `uye_gitti`.
 * - Görev ODA-5 (madde 7): hız sınırı. Aynı kaynaktan (soketin `kaynak`ı: uzak adres; yoksa soket) dakikada en çok
 *   `katilDk` katılım denemesi (6 haneli kodu deneyerek odaya düşmeyi zorlaştırır); fazlasına `hiz` ve kapanış. Bağlantı
 *   başına saniyede `mesajSn` mesaj (kova `mesajSn × 3`); taşan mesaj atılır, kova üç kez taşarsa bağlantı kapanır.
 */
import type { OdaMesaji } from './protocol';
import { MESAJ_AZAMI } from './protocol';
import type { Rol, Zarf } from './transport';

export interface AktariciSoket {
  readonly id: string;
  /** Görev ODA-5: hız sınırı anahtarı (node bağlamasında uzak IP adresi). */
  readonly kaynak?: string;
  gonder(veri: string): void;
  kapat(): void;
}

/** İstemci (tarayıcı) → aktarıcı çerçeveleri. */
export type IstemciCercevesi =
  | { k: 'katil'; kod: string; uye: { istemciId: string; rol: Rol } }
  | { k: 'z'; kime?: string; bag?: string; m: OdaMesaji }
  | { k: 'ayril' };

/** Aktarıcı → istemci çerçeveleri. */
export type SunucuCercevesi =
  | { k: 'bagli'; hostId?: string }
  | { k: 'kod_dolu' } | { k: 'oda_yok' } | { k: 'gecersiz' }
  | { k: 'z'; z: Zarf }
  | { k: 'uye_gitti'; istemciId: string }
  | { k: 'host_gitti' }
  | { k: 'degisti' }
  /** Görev ODA-5: hız sınırı aşıldı (bağlantı kapanır). */
  | { k: 'hiz' };

/** Görev ODA-5: hız sınırı ayarı. */
export interface HizSiniri { katilDk: number; mesajSn: number }
export const HIZ_VARSAYILAN: HizSiniri = { katilDk: 20, mesajSn: 60 };

interface Baglanti { soket: AktariciSoket; oda: string | null; istemciId: string | null; rol: Rol | null; bagli: boolean; kapandi: boolean; kova: number; kovaZamani: number; tasma: number }
interface Oda { kod: string; host: Baglanti; uyeler: Map<string, Baglanti> }

const KIMLIK = /^[\w.:-]{1,64}$/;
const KOD = /^[1-9]\d{5}$/;

export class Aktarici {
  readonly sayac = { bozuk: 0, iletilen: 0, hiz: 0 };
  private readonly baglantilar = new Map<string, Baglanti>();
  private readonly odalar = new Map<string, Oda>();
  /** Kaynak başına son katılım denemelerinin zamanları (ms). */
  private readonly katilimlar = new Map<string, number[]>();
  constructor(private readonly azami = MESAJ_AZAMI + 1000, private readonly hiz: HizSiniri = HIZ_VARSAYILAN, private readonly simdi: () => number = Date.now) {}

  get odaSayisi(): number { return this.odalar.size; }
  /** Tanı: odadaki bağlı oyuncu kimlikleri. */
  uyeler(kod: string): string[] { return [...(this.odalar.get(kod)?.uyeler.keys() ?? [])]; }

  baglandi(soket: AktariciSoket): void {
    this.baglantilar.set(soket.id, { soket, oda: null, istemciId: null, rol: null, bagli: false, kapandi: false, kova: this.hiz.mesajSn * 3, kovaZamani: this.simdi(), tasma: 0 });
  }

  kapandi(soket: AktariciSoket): void {
    const b = this.baglantilar.get(soket.id);
    if (!b || b.kapandi) return;
    b.kapandi = true;
    this.baglantilar.delete(soket.id);
    const oda = b.oda ? this.odalar.get(b.oda) : undefined;
    if (!oda) return;
    if (oda.host === b) {
      this.odalar.delete(oda.kod);
      for (const x of this.baglantilar.values()) {
        if (x.oda !== oda.kod) continue;
        this.yolla(x, { k: 'host_gitti' });
        x.oda = null; x.bagli = false;
        this.kapat(x);
      }
      return;
    }
    if (b.bagli && b.istemciId && oda.uyeler.get(b.istemciId) === b) {
      oda.uyeler.delete(b.istemciId);
      this.yolla(oda.host, { k: 'uye_gitti', istemciId: b.istemciId });
    }
  }

  mesaj(soket: AktariciSoket, veri: string): void {
    const b = this.baglantilar.get(soket.id);
    if (!b || b.kapandi) return;
    if (veri.length > this.azami) { this.sayac.bozuk++; return; }
    // Host (Game Master) sınırsız: komut başına yayın yapar; düşen yayın istemcide boşluk açardı.
    if (b.rol !== 'host' && !this.kovadan(b)) return;
    let f: IstemciCercevesi;
    try { f = JSON.parse(veri) as IstemciCercevesi; } catch { this.sayac.bozuk++; return; }
    if (!f || typeof f !== 'object' || typeof (f as { k?: unknown }).k !== 'string') { this.sayac.bozuk++; return; }
    if (f.k === 'ayril') { this.kapat(b); this.kapandi(soket); return; }
    if (f.k === 'katil') { this.katil(b, f); return; }
    if (f.k !== 'z' || !f.m || typeof f.m !== 'object' || typeof (f.m as { t?: unknown }).t !== 'string') { this.sayac.bozuk++; return; }
    const oda = b.oda ? this.odalar.get(b.oda) : undefined;
    if (!oda || !b.istemciId) { this.sayac.bozuk++; return; }
    if (oda.host === b) this.hosttan(oda, f);
    else this.oyuncudan(oda, b, f);
  }

  // ---- iç ----

  private yolla(b: Baglanti, c: SunucuCercevesi): void {
    if (b.kapandi) return;
    try { b.soket.gonder(JSON.stringify(c)); } catch { /* kapanmış soket */ }
  }

  private kapat(b: Baglanti): void {
    try { b.soket.kapat(); } catch { /* zaten kapalı */ }
  }

  /** Bağlantının mesaj kovası: doluysa bir mesaj harcar; taşarsa atar, üçüncü taşmada bağlantıyı kapatır. */
  private kovadan(b: Baglanti): boolean {
    const t = this.simdi();
    const azami = this.hiz.mesajSn * 3;
    b.kova = Math.min(azami, b.kova + ((t - b.kovaZamani) / 1000) * this.hiz.mesajSn);
    b.kovaZamani = t;
    if (b.kova >= 1) { b.kova -= 1; return true; }
    this.sayac.hiz++;
    if (++b.tasma >= 3 * azami) { this.yolla(b, { k: 'hiz' }); this.kapat(b); this.kapandi(b.soket); }
    return false;
  }

  /** Kaynağın son bir dakikadaki katılım denemesi sınırı aşıldı mı (aşmadıysa denemeyi sayar). */
  private katilimFazla(b: Baglanti): boolean {
    const k = b.soket.kaynak ?? b.soket.id;
    const t = this.simdi();
    const liste = (this.katilimlar.get(k) ?? []).filter((x) => t - x < 60_000);
    if (liste.length >= this.hiz.katilDk) { this.katilimlar.set(k, liste); return true; }
    liste.push(t);
    this.katilimlar.set(k, liste);
    if (this.katilimlar.size > 10_000) this.katilimlar.clear(); // bellek sınırı
    return false;
  }

  private katil(b: Baglanti, f: IstemciCercevesi & { k: 'katil' }): void {
    if (f.uye?.rol !== 'host' && this.katilimFazla(b)) {
      this.sayac.hiz++;
      this.yolla(b, { k: 'hiz' }); this.kapat(b); return;
    }
    const id = f.uye?.istemciId, rol = f.uye?.rol;
    if (b.oda || typeof f.kod !== 'string' || !KOD.test(f.kod) || typeof id !== 'string' || !KIMLIK.test(id) || (rol !== 'host' && rol !== 'oyuncu' && rol !== 'izleyici')) {
      this.yolla(b, { k: 'gecersiz' }); this.kapat(b); return;
    }
    const oda = this.odalar.get(f.kod);
    if (rol === 'host') {
      if (oda) { this.yolla(b, { k: 'kod_dolu' }); this.kapat(b); return; }
      b.oda = f.kod; b.istemciId = id; b.rol = 'host'; b.bagli = true;
      this.odalar.set(f.kod, { kod: f.kod, host: b, uyeler: new Map() });
      this.yolla(b, { k: 'bagli' });
      return;
    }
    if (!oda || id === oda.host.istemciId) { this.yolla(b, { k: 'oda_yok' }); this.kapat(b); return; }
    // Aday: bağlanana dek yalnız `katil` iletilir.
    b.oda = f.kod; b.istemciId = id; b.rol = rol; b.bagli = false;
    this.yolla(b, { k: 'bagli', ...(oda.host.istemciId ? { hostId: oda.host.istemciId } : {}) });
  }

  private oyuncudan(oda: Oda, b: Baglanti, f: IstemciCercevesi & { k: 'z' }): void {
    if (!b.bagli && f.m.t !== 'katil') { this.sayac.bozuk++; return; }
    const z: Zarf = { oda: oda.kod, kimden: b.istemciId as string, kime: oda.host.istemciId as string, ...(!b.bagli ? { bag: b.soket.id } : {}), m: f.m };
    this.yolla(oda.host, { k: 'z', z });
    this.sayac.iletilen++;
  }

  private hosttan(oda: Oda, f: IstemciCercevesi & { k: 'z' }): void {
    const kimden = oda.host.istemciId as string;
    const z = (kime?: string): Zarf => ({ oda: oda.kod, kimden, ...(kime ? { kime } : {}), m: f.m });
    if (f.bag) {
      const aday = this.baglantilar.get(f.bag);
      if (!aday || aday.oda !== oda.kod || aday === oda.host) return;
      this.yolla(aday, { k: 'z', z: z(f.kime) });
      this.sayac.iletilen++;
      if (f.m.t === 'kabul' && f.kime === aday.istemciId) {
        const eski = oda.uyeler.get(aday.istemciId);
        if (eski && eski !== aday) {
          this.yolla(eski, { k: 'degisti' });
          eski.bagli = false; eski.oda = null;
          this.kapat(eski);
        }
        aday.bagli = true;
        oda.uyeler.set(aday.istemciId, aday);
      } else if (f.m.t === 'red' && !aday.bagli) {
        aday.oda = null;
        this.kapat(aday);
      }
      return;
    }
    if (f.kime) {
      const hedef = oda.uyeler.get(f.kime);
      if (hedef) { this.yolla(hedef, { k: 'z', z: z(f.kime) }); this.sayac.iletilen++; }
      return;
    }
    for (const u of oda.uyeler.values()) { this.yolla(u, { k: 'z', z: z() }); this.sayac.iletilen++; }
  }
}
