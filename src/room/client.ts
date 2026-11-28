/**
 * Görev ODA-1 (O1): oda istemcisi (oyuncu cihazı; ODA-TASARIM.md §1). Saf: React/DOM yok; bağlantı enjekte. İstemci
 * hiç olay üretmez: host'tan gelen olayları kendi reducer'ıyla uygular, durumu host'unkiyle bire bir aynıdır.
 *
 * - `sonrakiSeq`: `ilkSeq === sonrakiSeq` uygula; küçükse yinelenen kısmı atla; büyükse (boşluk) uygulama, `yakala` iste.
 * - `donem` farklı `olaylar`/`ozet` (host yeni savaş kurmuş, `anlik` kaybolmuş) → tam anlık (`yakala{-1}`).
 * - `ozet`: kendi durumunun özeti tutmazsa tam anlık ister (sayılır; farklı build ya da reducer hatası).
 */
import { applyEvents, replay } from '../battle/reduce';
import type { BattleEvent, BattleState, Command } from '../battle/types';
import type { DiceRequest } from '../rules/dice';
import type { ReactionAnswer, ReactionRequest } from '../rules/reactionChoice';
import type { SavedCharacter } from '../rules/builder';
import { kanonikJson, ozet } from './hash';
import { mesajMi, type HostMesaji, type IstemciMesaji, type OdaOzeti, type RedNedeni, type SurumBilgisi } from './protocol';
import { dinleyiciler, type BaglantiDurumu, type Rol, type RoomTransport, type Zarf } from './transport';

export type IstemciOlayi =
  | { tur: 'kabul'; anahtar: string; rol: Rol }
  | { tur: 'red'; neden: RedNedeni; ayrinti?: string }
  /** Görev ODA-5: Game Master'ın katılım onayı bekleniyor. */
  | { tur: 'onay_bekle' }
  | { tur: 'oda' }
  /** Savaş durumu değişti. `sifirlandi`: anlık kuruldu (yeni oturum); değilse `yeni` olaylar eklendi. */
  | { tur: 'savas'; sifirlandi: boolean; yeni: BattleEvent[] }
  | { tur: 'karakter_red'; karakterId: string; neden: string; ayrinti?: string }
  | { tur: 'kapandi'; neden: string }
  /** Görev ODA-2: komut host'ta reddedildi. */
  | { tur: 'komut_red'; istekId: string; neden: string; hata?: string }
  | { tur: 'zar_iste'; istekId: string; istek: DiceRequest }
  | { tur: 'tepki_sor'; istekId: string; istek: ReactionRequest; sureMs: number }
  | { tur: 'istem_iptal'; istekId: string }
  | { tur: 'bekleniyor'; kim: string; neYi: 'zar' | 'tepki' }
  /** Görev ODA-4 (madde 8): savaş sonu karakter durumu. */
  | { tur: 'karakter_sonuc'; karakterId: string; durum: unknown; kimlik: string }
  | { tur: 'baglanti'; d: BaglantiDurumu };

export interface IstemciSecenek {
  transport: RoomTransport;
  kod: string;
  istemciId: string;
  ad: string;
  surum: SurumBilgisi;
  /** Önceki girişte host'un verdiği oturum anahtarı (yeniden giriş). */
  anahtar?: string;
  /** Tam günlükten durum kurma (varsayılan `replay`). */
  kur?: (events: BattleEvent[]) => BattleState;
  /** Özet tutmazlığı gibi tanı uyarıları. */
  uyar?: (metin: string) => void;
  /** Görev ODA-4: yeniden bağlanmada yeni bağlantı (verilmezse `yenidenBaglan` çalışmaz). */
  yeniBaglanti?: () => RoomTransport;
}

export class OdaIstemci {
  readonly kod: string;
  readonly istemciId: string;
  anahtar: string | undefined;
  rol: Rol | null = null;
  oda: OdaOzeti | null = null;
  /** Savaş durumu (lobide null). */
  durum: BattleState | null = null;
  /** Yerel günlük: `taban` sıradan başlayan olaylar (tam günlükte taban 0). */
  olaylar: BattleEvent[] = [];
  taban = 0;
  donem = -1;
  /** Sayaçlar (test ve tanı). */
  readonly sayac = { bozuk: 0, yinelenen: 0, bosluk: 0, ozetTutmadi: 0, anlik: 0 };
  private bekleyen: number | null = null;
  private istekSayaci = 0;
  private s: IstemciSecenek;
  private readonly ol = dinleyiciler<IstemciOlayi>();
  private readonly cozucu: Array<() => void> = [];

  constructor(s: IstemciSecenek) {
    this.s = s;
    this.kod = s.kod;
    this.istemciId = s.istemciId;
    this.anahtar = s.anahtar;
  }

  get sonrakiSeq(): number { return this.taban + this.olaylar.length; }

  abone(fn: (o: IstemciOlayi) => void): () => void { return this.ol.ekle(fn); }

  /** Odaya bağlanır ve `katil` gönderir (oda yoksa bağdaştırıcının hatası fırlar). */
  async baglan(): Promise<void> {
    this.cozucu.push(this.s.transport.dinle((z) => this.al(z)), this.s.transport.durum((d) => this.ol.yay({ tur: 'baglanti', d })));
    try {
      await this.s.transport.katil(this.kod, { istemciId: this.istemciId, rol: 'oyuncu' });
    } catch (e) {
      this.cozucu.splice(0).forEach((f) => f());
      throw e;
    }
    this.katilGonder();
  }

  /**
   * Aynı bağlantı üstünden yeniden `katil` (anahtarla). Görev ODA-4: elinde savaş varsa `sonSeq` + `donem`: host aynı
   * dönemdeyse yalnız eksik olayları yollar.
   */
  katilGonder(): void {
    this.gonder({ t: 'katil', istemciId: this.istemciId, ad: this.s.ad, ...(this.anahtar ? { anahtar: this.anahtar } : {}), ...(this.durum ? { sonSeq: this.sonrakiSeq, donem: this.donem } : {}), ...this.s.surum });
  }

  /**
   * Görev ODA-4: bağlantı koptu (host sayfası yenilendi, Wi-Fi gitti): yeni bağlantıyla aynı kimlik ve anahtarla yeniden
   * katılır; savaş durumu ve günlük elde kalır. Oda yoksa (host henüz dönmedi) false.
   */
  async yenidenBaglan(): Promise<boolean> {
    const yeni = this.s.yeniBaglanti?.();
    if (!yeni) return false;
    this.cozucu.splice(0).forEach((f) => f());
    try { await this.s.transport.ayril(); } catch { /* zaten kapalı */ }
    this.s = { ...this.s, transport: yeni };
    this.bekleyen = null;
    try {
      await this.baglan();
      return true;
    } catch {
      return false;
    }
  }

  /** Görev ODA-4 (madde 8): gönderilen kopyanın kanonik JSON'u (savaş sonucu dönünce asıl karakter değişmiş mi). */
  readonly gonderilen = new Map<string, string>();
  karakterGonder(kopya: SavedCharacter): void { this.gonderilen.set(kopya.id, kanonikJson(kopya)); this.gonder({ t: 'karakter_gonder', kopya }); }

  /** Görev ODA-2: kendi karakterinin komutu (host yetkiyi denetler, olaylar yayınla gelir). İstek kimliği döner. */
  komutGonder(cmd: Command): string {
    const istekId = `${this.istemciId}-${++this.istekSayaci}`;
    this.gonder({ t: 'komut', istekId, cmd, tabanSeq: this.sonrakiSeq });
    return istekId;
  }
  /** Zar istemine cevap (`null`: otomatik at). */
  zarCevap(istekId: string, degerler: number[] | null): void {
    this.gonder(degerler ? { t: 'zar_cevap', istekId, degerler } : { t: 'zar_cevap', istekId, otomatik: true });
  }
  tepkiCevap(istekId: string, cevap: ReactionAnswer): void { this.gonder({ t: 'tepki_cevap', istekId, cevap }); }
  karakterGeriAl(karakterId: string): void { this.gonder({ t: 'karakter_geri_al', karakterId }); }

  async ayril(): Promise<void> {
    this.gonder({ t: 'ayril' });
    this.cozucu.splice(0).forEach((f) => f());
    await this.s.transport.ayril();
  }

  /** Tanı: elle tam anlık iste. */
  yakala(sonSeq = -1): void { this.bekleyen = sonSeq; this.gonder({ t: 'yakala', sonSeq }); }

  // ---- iç ----

  private gonder(m: IstemciMesaji): void { this.s.transport.gonder(m); }

  private yakalaBir(sonSeq: number): void {
    if (this.bekleyen === sonSeq) return;
    this.yakala(sonSeq);
  }

  private al(z: Zarf): void {
    if (!mesajMi(z.m)) { this.sayac.bozuk++; return; }
    const m = z.m as HostMesaji;
    switch (m.t) {
      case 'kabul':
        this.anahtar = m.anahtar; this.rol = m.rol;
        this.ol.yay({ tur: 'kabul', anahtar: m.anahtar, rol: m.rol });
        return;
      case 'red': this.ol.yay({ tur: 'red', neden: m.neden, ...(m.ayrinti ? { ayrinti: m.ayrinti } : {}) }); return;
      case 'onay_bekle': this.ol.yay({ tur: 'onay_bekle' }); return;
      case 'oda_durumu': {
        const { t: _t, ...oda } = m;
        this.oda = oda;
        const ben = oda.uyeler.find((u) => u.istemciId === this.istemciId);
        if (ben) this.rol = ben.rol;
        this.ol.yay({ tur: 'oda' });
        return;
      }
      case 'anlik': this.anlik(m); return;
      case 'olaylar': this.olaylarAl(m); return;
      case 'ozet': this.ozetAl(m); return;
      case 'karakter_red': this.ol.yay({ tur: 'karakter_red', karakterId: m.karakterId, neden: m.neden, ...(m.ayrinti ? { ayrinti: m.ayrinti } : {}) }); return;
      case 'oda_kapandi': this.ol.yay({ tur: 'kapandi', neden: m.neden }); return;
      case 'komut_red': this.ol.yay({ tur: 'komut_red', istekId: m.istekId, neden: m.neden, ...(m.hata ? { hata: m.hata } : {}) }); return;
      case 'zar_iste': this.ol.yay({ tur: 'zar_iste', istekId: m.istekId, istek: m.istek as DiceRequest }); return;
      case 'tepki_sor': this.ol.yay({ tur: 'tepki_sor', istekId: m.istekId, istek: m.istek as ReactionRequest, sureMs: m.sureMs }); return;
      case 'istem_iptal': this.ol.yay({ tur: 'istem_iptal', istekId: m.istekId }); return;
      case 'bekleniyor': this.ol.yay({ tur: 'bekleniyor', kim: m.kim, neYi: m.tur }); return;
      case 'karakter_sonuc': this.ol.yay({ tur: 'karakter_sonuc', karakterId: m.karakterId, durum: m.durum, kimlik: m.kimlik }); return;
      case 'uye_durumu': {
        // oda_durumu da gelir; burada yalnız üyenin bağlantısı/kararı anında güncellenir.
        const u = this.oda?.uyeler.find((x) => x.istemciId === m.istemciId);
        if (u) { u.bagli = m.bagli; if (m.karar) u.karar = m.karar; else delete u.karar; this.ol.yay({ tur: 'oda' }); }
        return;
      }
      default: return;
    }
  }

  private anlik(m: HostMesaji & { t: 'anlik' }): void {
    try {
      const durum = m.durum ? applyEvents(m.durum, m.olaylar) : m.olaylar.length ? (this.s.kur ?? replay)(m.olaylar) : null;
      this.durum = durum;
      this.olaylar = [...m.olaylar];
      this.taban = m.durum ? m.tabanSeq : 0;
      this.donem = m.donem;
      this.bekleyen = null;
      this.sayac.anlik++;
      this.ol.yay({ tur: 'savas', sifirlandi: true, yeni: [] });
    } catch {
      this.sayac.bozuk++;
    }
  }

  private olaylarAl(m: HostMesaji & { t: 'olaylar' }): void {
    if (m.donem !== this.donem || !this.durum) { this.yakalaBir(-1); return; }
    const n = this.sonrakiSeq;
    if (m.ilkSeq > n) { this.sayac.bosluk++; this.yakalaBir(n); return; }
    const yeni = m.olaylar.slice(n - m.ilkSeq);
    if (!yeni.length) { this.sayac.yinelenen++; return; }
    if (m.ilkSeq < n) this.sayac.yinelenen++;
    this.durum = applyEvents(this.durum, yeni);
    this.olaylar = [...this.olaylar, ...yeni];
    this.bekleyen = null;
    this.ol.yay({ tur: 'savas', sifirlandi: false, yeni });
  }

  private ozetAl(m: HostMesaji & { t: 'ozet' }): void {
    if (m.donem !== this.donem || !this.durum) { this.yakalaBir(-1); return; }
    const n = this.sonrakiSeq;
    if (m.seq > n) { this.yakala(n); return; }
    if (m.seq < n) return;
    if (ozet(this.durum) === m.hash) return;
    this.sayac.ozetTutmadi++;
    this.s.uyar?.(`oda: durum özeti tutmadı (seq ${m.seq})`);
    this.yakala(-1);
  }
}
