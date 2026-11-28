/**
 * Görev ODA-1 (O1): oda host'u (GM cihazı; ODA-TASARIM.md §1, §3). Saf: React/DOM yok; bağlantı (`RoomTransport`) ve
 * anahtar Rng'si enjekte. Yetkili tek taraf: savaş olaylarını yalnız GM'in oturumu üretir, host bunları `yayinla` ile
 * sıra numarasıyla (`seq` = günlükteki sıra, `battle_started` = 0) yayar. İstemciler yalnız izler (O1: salt izleme;
 * `komut` geri çevrilir, O2'de açılır).
 *
 * - Katılım: sürüm el sıkışması (protokol + build + kural sürümü; Karar 3; içerik özeti ODA-3'te kalktı), oturum anahtarı (ilk girişte üretilir,
 *   yeniden girişte `istemciId` ile birlikte istenir; yanlışsa `red{anahtar}`).
 * - Eşitleme: yeni katılana / yakalayana `anlik` (tam günlük; günlük `anlikEsik` karakteri aşarsa durum tabanı + son
 *   olaylar), boşluk isteyene eksik `olaylar`, her `ozetAraligi` yayında bir `ozet{seq, hash}`.
 * - Lobi: karakter kopyası alma/geri alma (`karakterKabul` kancası doğrular), `oda_durumu`.
 *
 * Host durumu olaylardan kendisi kurar (`replay` + `applyEvents`): istemcilerle aynı reducer yolu, özet bu durumdan.
 */
import { applyEvents, replay } from '../battle/reduce';
import type { BattleEvent, BattleState, Command, CommandContext } from '../battle/types';
import type { DiceRequest, Rng } from '../rules/dice';
import type { ReactionAnswer, ReactionRequest } from '../rules/reactionChoice';
import { komutYetkisi } from './auth';
import type { SavedCharacter } from '../rules/builder';
import { anahtarUret } from './code';
import { kanonikJson, ozet } from './hash';
import { istemciMesajiMi, mesajMi, type Asama, type HostMesaji, type IstemciMesaji, type OdaOzeti, type SurumBilgisi, type UyeKarari, type UyeOzeti } from './protocol';
import { surumUyusmazligi } from './surum';
import type { BaglantiDurumu, Rol, RoomTransport, Zarf } from './transport';

/** Oda ayarlarının yayına giden kısmı (aşama ve üyeler host'tan). */
export type OdaBilgisi = Omit<OdaOzeti, 'asama' | 'uyeler'>;

export interface HostUye {
  istemciId: string;
  ad: string;
  anahtar: string;
  rol: Rol;
  bagli: boolean;
  /** Gönderilen karakter kopyaları (kimlik → kopya). */
  kopyalar: Map<string, SavedCharacter>;
  /** Son komut istek kimlikleri (çift gönderim; en çok 64). */
  istekler?: string[];
  /** Görev ODA-4: kopukken Game Master kararı (bekle / yapay zekâ / GM oynasın). */
  karar?: UyeKarari;
}

/** Görev ODA-4: host sayfası yeniden açılınca odayı aynı kodla diriltmek için saklanan üye bilgisi (kopyalar oda kaydında). */
export interface KayitliUye { istemciId: string; ad: string; anahtar: string; rol: Rol; kopyalar: SavedCharacter[] }

/** Görev ODA-2: yetkisi denetlenmiş uzak komut (GM'in savaş ekranı çalıştırır, sonucu `komutSonucu` ile bildirir). */
export interface UzakKomut { istemciId: string; istekId: string; cmd: Command; ctx: CommandContext; ownerId: string }

/** Görev ODA-2: oyuncunun cihazına giden açık zar/tepki istemi. */
export interface AcikIstem { istekId: string; istemciId: string; tur: 'zar' | 'tepki' }

export type HostOlayi =
  | { tur: 'uyeler' }
  | { tur: 'karakter_geldi'; istemciId: string; kopya: SavedCharacter }
  | { tur: 'karakter_gitti'; istemciId: string; karakterId: string }
  | { tur: 'reddedildi'; istemciId: string; neden: string }
  | { tur: 'istemler' }
  | { tur: 'yetkisiz'; istemciId: string; sayi: number }
  /** Görev ODA-4: üyenin bağlantısı ya da kararı değişti. */
  | { tur: 'karar'; istemciId: string }
  /** Görev ODA-5: katılım onayı açıkken yeni biri katılmak istiyor (ya da istek kapandı). */
  | { tur: 'katilim' };

export interface HostSecenek {
  transport: RoomTransport;
  kod: string;
  /** Host'un kendi istemciId'si (bağdaştırıcıda üye kimliği). */
  hostId: string;
  surum: SurumBilgisi;
  /** Anahtar üretimi (uygulamada `guvenliRng`, testte tohumlu). */
  rng: Rng;
  oda: OdaBilgisi;
  /** Karakter kopyasını kabul et (null) ya da reddet. Varsayılan: kabul. */
  karakterKabul?: (istemciId: string, kopya: SavedCharacter, asama: Asama) => null | { neden: 'gecersiz' | 'dolu' | 'kilitli'; ayrinti?: string };
  /** Her kaç `olaylar` yayınında bir `ozet` (öneri 20). */
  ozetAraligi?: number;
  /** Tam günlük `anlik` için JSON karakter eşiği; aşılırsa durum tabanı (öneri 2 MB). */
  anlikEsik?: number;
  /** Durum tabanı yeniden çekme aralığı (olay): taban + en çok bu kadar son olay. */
  tabanAraligi?: number;
  olay?: (o: HostOlayi) => void;
  /** Görev ODA-4: dönem sayacının tabanı (diriltilen host farklı dönemle başlasın: eski istemci eksik-olay yoluna girmez). */
  donemTabani?: number;
  /** Görev ODA-4: diriltilen odanın üyeleri (anahtarlarıyla; hepsi kopuk başlar). */
  oncekiUyeler?: readonly KayitliUye[];
  /**
   * Görev ODA-5 (madde 7): yeni üyenin katılımı Game Master'ın onayına bağlı (anahtarıyla dönen eski üye onaysız).
   * Yerel ağda varsayılan kapalı; internet odasında (Supabase) açık olacak.
   */
  katilimOnayi?: boolean;
  /** Görev ODA-4 (madde 8): savaş bitince kopyanın yeni durumu (`applyBattleResult`); null: savaşta değil. */
  sonuc?: (kopya: SavedCharacter, state: BattleState) => unknown;
}

const asamaOf = (s: BattleState | null): Asama =>
  !s ? 'lobi' : s.status === 'setup' ? 'kurulum' : s.status === 'finished' ? 'bitti' : 'savas';

const ayniOlay = (a: BattleEvent | undefined, b: BattleEvent | undefined): boolean =>
  a === b || (!!a && !!b && kanonikJson(a) === kanonikJson(b));

export class OdaHost {
  readonly kod: string;
  readonly uyeler = new Map<string, HostUye>();
  /** Reddedilen/bozuk mesaj sayısı (test ve tanı). */
  bozuk = 0;
  /** Görev ODA-2: GM'in savaş ekranı (yoksa komut `bekle` ile geri çevrilir). */
  yurutucu: ((k: UzakKomut) => void) | null = null;
  /** "Yapay zekâ oynasın" işaretli karakterler (O4; komutları `bekle`). */
  readonly yzKarakterler = new Set<string>();
  private readonly istemler = new Map<string, AcikIstem & { coz: (x: unknown) => void; zaman?: ReturnType<typeof setTimeout>; istek: DiceRequest | ReactionRequest }>();
  private istemSayaci = 0;
  private readonly yetkisiz = new Map<string, number>();
  private readonly s: HostSecenek;
  private log: BattleEvent[] = [];
  private durumu: BattleState | null = null;
  private donem: number;
  /** Görev ODA-4: gönderilmeyi bekleyen savaş sonuçları (kopuk üye döndüğünde). */
  private readonly sonuclar = new Map<string, Array<{ karakterId: string; durum: unknown; kimlik: string }>>();
  /** Görev ODA-5: onay bekleyen katılımlar (istemciId → istek). */
  private readonly bekleyenKatilim = new Map<string, { ad: string; m: IstemciMesaji & { t: 'katil' }; bag?: string }>();
  /** Görev ODA-5: katılım onayı açık mı. */
  katilimOnayi: boolean;
  private yayinSayaci = 0;
  private taban: { seq: number; durum: BattleState } | null = null;
  private oda: OdaBilgisi;
  private kapali = false;
  private readonly cozucu: Array<() => void> = [];

  constructor(s: HostSecenek) {
    this.s = s;
    this.kod = s.kod;
    this.oda = s.oda;
    this.donem = s.donemTabani ?? 0;
    this.katilimOnayi = s.katilimOnayi ?? false;
    for (const u of s.oncekiUyeler ?? []) {
      this.uyeler.set(u.istemciId, { istemciId: u.istemciId, ad: u.ad, anahtar: u.anahtar, rol: u.rol, bagli: false, kopyalar: new Map(u.kopyalar.map((k) => [k.id, k])) });
    }
  }

  /** Görev ODA-4: diriltme için üyeler (anahtar + kopyalar). */
  kayitliUyeler(): KayitliUye[] {
    return [...this.uyeler.values()].map((u) => ({ istemciId: u.istemciId, ad: u.ad, anahtar: u.anahtar, rol: u.rol, kopyalar: [...u.kopyalar.values()] }));
  }

  /** Görev ODA-4: bu `ownerId`'nin (karakter kopyası) sahibi üye, bağlı olsun olmasın. */
  uyesi(ownerId: string | null | undefined): HostUye | null {
    if (!ownerId) return null;
    for (const u of this.uyeler.values()) if (u.kopyalar.has(ownerId)) return u;
    return null;
  }

  /**
   * Görev ODA-4: kopan üye için Game Master kararı. `yz`: üyenin karakterlerini yapay zekâ oynar (komutları `bekle`);
   * `gm`: GM kendi cihazından oynar; `bekle`: dönmesi beklenir; null: karar kalkar.
   */
  kararVer(istemciId: string, karar: UyeKarari | null): void {
    const u = this.uyeler.get(istemciId);
    if (!u) return;
    if (karar) u.karar = karar; else delete u.karar;
    for (const id of u.kopyalar.keys()) { if (karar === 'yz') this.yzKarakterler.add(id); else this.yzKarakterler.delete(id); }
    this.gonder({ t: 'uye_durumu', istemciId, bagli: u.bagli, ...(u.karar ? { karar: u.karar } : {}) });
    this.s.olay?.({ tur: 'karar', istemciId });
    this.durumYay();
  }

  /**
   * Dönen üyenin kararı: `yz` ise o an oynanan turu yapay zekâ bitirir, sıra başkasına geçince kalkar; öteki kararlar
   * döner dönmez kalkar.
   */
  private kararlariGozden(): void {
    const s = this.durumu;
    const sira = s && s.status === 'active' ? s.combatants[s.order[s.turnIndex] ?? '']?.ownerId : undefined;
    for (const u of this.uyeler.values()) {
      if (!u.bagli || !u.karar) continue;
      if (u.karar === 'yz' && sira && u.kopyalar.has(sira)) continue;
      this.kararVer(u.istemciId, null);
    }
  }

  /** Kodu sahiplenir ve dinlemeye başlar (kod doluysa bağdaştırıcının hatası fırlar). */
  async baslat(): Promise<void> {
    this.cozucu.push(this.s.transport.dinle((z) => this.al(z)), this.s.transport.durum((d) => this.baglanti(d)));
    try {
      await this.s.transport.katil(this.kod, { istemciId: this.s.hostId, rol: 'host' });
    } catch (e) {
      this.cozucu.splice(0).forEach((f) => f());
      throw e;
    }
  }

  get asama(): Asama { return asamaOf(this.durumu); }
  get seq(): number { return this.log.length; }
  get durum(): BattleState | null { return this.durumu; }
  get olaylar(): readonly BattleEvent[] { return this.log; }
  /** Günlüğün JSON boyutu (karakter; ölçüm ve eşik). */
  gunlukBoyutu(): number { return JSON.stringify(this.log).length; }

  /** Bütün karakter kopyaları (istemci → kopya listesi). */
  kopyalar(): Array<{ istemciId: string; kopya: SavedCharacter }> {
    return [...this.uyeler.values()].flatMap((u) => [...u.kopyalar.values()].map((kopya) => ({ istemciId: u.istemciId, kopya })));
  }

  odaOzeti(): OdaOzeti {
    const uyeler: UyeOzeti[] = [...this.uyeler.values()].map((u) => ({ istemciId: u.istemciId, ad: u.ad, rol: u.rol, bagli: u.bagli, karakterler: [...u.kopyalar.keys()], ...(u.karar ? { karar: u.karar } : {}) }));
    return { ...this.oda, asama: this.asama, uyeler, yzKarakterler: [...this.yzKarakterler] };
  }

  /** Oda ayarları değişti (ad, kurallar…): herkese `oda_durumu`. */
  odaAyarla(p: Partial<OdaBilgisi>): void {
    const yeni = { ...this.oda, ...p };
    if (kanonikJson(yeni) === kanonikJson(this.oda)) return;
    this.oda = yeni;
    this.durumYay();
  }

  /**
   * GM oturumunun tam olay günlüğü. Önceki günlüğün devamıysa yalnız yeni olaylar yayılır; değilse (yeni savaş,
   * kayıttan yükleme) dönem artar ve herkese tam `anlik` gider.
   */
  yayinla(events: readonly BattleEvent[]): void {
    if (this.kapali) return;
    const n = this.log.length;
    const devam = n > 0 && events.length >= n && ayniOlay(events[0], this.log[0]) && ayniOlay(events[n - 1], this.log[n - 1]);
    const oncekiAsama = this.asama;
    if (!devam) {
      if (n === 0 && events.length === 0) return;
      this.log = [...events];
      this.donem++;
      this.durumu = this.log.length ? replay(this.log) : null;
      this.taban = this.durumu ? { seq: this.log.length, durum: this.durumu } : null;
      this.yayinSayaci = 0;
      for (const u of this.uyeler.values()) if (u.bagli) this.anlikGonder(u.istemciId);
      this.durumYay();
      return;
    }
    if (events.length === n) return;
    const yeni = events.slice(n);
    this.log = [...this.log, ...yeni];
    this.durumu = applyEvents(this.durumu as BattleState, yeni);
    if (!this.taban || this.log.length - this.taban.seq >= (this.s.tabanAraligi ?? 200)) this.taban = { seq: this.log.length, durum: this.durumu };
    this.gonder({ t: 'olaylar', donem: this.donem, ilkSeq: n, olaylar: yeni });
    this.yayinSayaci++;
    if (this.yayinSayaci % (this.s.ozetAraligi ?? 20) === 0) this.ozetGonder();
    if (this.asama !== oncekiAsama) this.durumYay();
    if (this.asama === 'bitti' && oncekiAsama !== 'bitti') this.sonuclariGonder();
    this.kararlariGozden();
  }

  /** Görev ODA-4 (madde 8): savaş bitti: her kopyanın yeni durumu sahibine (kopuksa döndüğünde). */
  private sonuclariGonder(): void {
    const st = this.durumu;
    const f = this.s.sonuc;
    if (!st || !f) return;
    for (const u of this.uyeler.values()) {
      const liste = [...u.kopyalar.values()].flatMap((k) => {
        if (!Object.values(st.combatants).some((c) => c.ownerId === k.id && c.side === 'party')) return [];
        const durum = f(k, st);
        return durum && typeof durum === 'object' ? [{ karakterId: k.id, durum, kimlik: `${this.donem}:${this.log.length}:${k.id}` }] : [];
      });
      if (!liste.length) continue;
      this.sonuclar.set(u.istemciId, liste);
      if (u.bagli) this.sonucYolla(u.istemciId);
    }
  }

  private sonucYolla(istemciId: string): void {
    const liste = this.sonuclar.get(istemciId);
    if (!liste) return;
    this.sonuclar.delete(istemciId);
    for (const x of liste) this.gonder({ t: 'karakter_sonuc', ...x }, istemciId);
  }

  /** Herkese durum özeti (istemci kendi durumunu karşılaştırır; geride kalan yakalar). */
  ozetGonder(kime?: string): void {
    if (!this.durumu) return;
    this.gonder({ t: 'ozet', donem: this.donem, seq: this.log.length, hash: ozet(this.durumu) }, kime);
  }

  // ---- Görev ODA-2: komut, zar, tepki ----

  /** Bu `ownerId`'nin bağlı uzak sahibi (istemciId); yoksa null (GM kendi cihazında karar verir). */
  sahibi(ownerId: string | null | undefined): string | null {
    if (!ownerId) return null;
    for (const u of this.uyeler.values()) if (u.bagli && u.kopyalar.has(ownerId)) return u.istemciId;
    return null;
  }

  /** GM'in savaş ekranı uzak komutun sonucunu bildirir (hata: motorun `fail` metni; başarıda olaylar zaten yayılır). */
  komutSonucu(istemciId: string, istekId: string, hata: string | null): void {
    if (hata) this.gonder({ t: 'komut_red', istekId, neden: 'gecersiz', hata }, istemciId);
  }

  acikIstemler(): AcikIstem[] { return [...this.istemler.values()].map(({ istekId, istemciId, tur }) => ({ istekId, istemciId, tur })); }

  /** Oyuncunun cihazından zar ister; `null`: oyuncu "otomatik" dedi ya da istem iptal edildi (GM otomatik atar). */
  zarIste(istemciId: string, istek: DiceRequest): { istekId: string; sonuc: Promise<number[] | null> } {
    const istekId = `z${++this.istemSayaci}`;
    const sonuc = new Promise<number[] | null>((coz) => {
      this.istemler.set(istekId, { istekId, istemciId, tur: 'zar', istek, coz: (x) => coz(x as number[] | null) });
    });
    this.gonder({ t: 'zar_iste', istekId, istek }, istemciId);
    this.gonder({ t: 'bekleniyor', kim: istemciId, tur: 'zar' });
    this.s.olay?.({ tur: 'istemler' });
    return { istekId, sonuc };
  }

  /** Oyuncuya tepki sorar; `sureMs` dolunca motorun önerisi (`suggested`). */
  tepkiSor(istemciId: string, istek: ReactionRequest, sureMs = 20_000): { istekId: string; sonuc: Promise<ReactionAnswer> } {
    const istekId = `t${++this.istemSayaci}`;
    const sonuc = new Promise<ReactionAnswer>((coz) => {
      const zaman = setTimeout(() => this.istemKapat(istekId, istek.suggested), sureMs);
      this.istemler.set(istekId, { istekId, istemciId, tur: 'tepki', istek, coz: (x) => coz(x as ReactionAnswer), zaman });
    });
    this.gonder({ t: 'tepki_sor', istekId, istek, sureMs }, istemciId);
    this.gonder({ t: 'bekleniyor', kim: istemciId, tur: 'tepki' });
    this.s.olay?.({ tur: 'istemler' });
    return { istekId, sonuc };
  }

  /** Açık istemi GM kapatır (zar: `null` = otomatik; tepki: verilen karar ya da öneri); oyuncunun istemi kalkar. */
  istemKapat(istekId: string, deger?: unknown): void {
    const i = this.istemler.get(istekId);
    if (!i) return;
    this.istemler.delete(istekId);
    if (i.zaman) clearTimeout(i.zaman);
    this.gonder({ t: 'istem_iptal', istekId }, i.istemciId);
    i.coz(deger === undefined ? (i.tur === 'zar' ? null : (i.istek as ReactionRequest).suggested) : deger);
    this.s.olay?.({ tur: 'istemler' });
  }

  async kapat(neden = 'kapandi'): Promise<void> {
    if (this.kapali) return;
    for (const id of [...this.istemler.keys()]) this.istemKapat(id);
    this.gonder({ t: 'oda_kapandi', neden });
    this.kapali = true;
    this.cozucu.splice(0).forEach((f) => f());
    await this.s.transport.ayril();
  }

  /** Görev ODA-5: onay bekleyen katılımlar. */
  katilimIstekleri(): Array<{ istemciId: string; ad: string }> {
    return [...this.bekleyenKatilim.entries()].map(([istemciId, x]) => ({ istemciId, ad: x.ad }));
  }

  /** Görev ODA-5: Game Master bekleyen katılımı kabul eder ya da reddeder (`red{onay}`). */
  katilimKarar(istemciId: string, kabul: boolean): void {
    const x = this.bekleyenKatilim.get(istemciId);
    if (!x) return;
    this.bekleyenKatilim.delete(istemciId);
    if (kabul) this.katilim(istemciId, x.m, x.bag, true);
    else this.reddet(istemciId, { t: 'red', neden: 'onay' }, x.bag);
    this.s.olay?.({ tur: 'katilim' });
  }

  /** Katılım onayını aç/kapa; kapatınca bekleyenler kabul edilir. */
  katilimOnayiAyarla(acik: boolean): void {
    this.katilimOnayi = acik;
    if (!acik) for (const id of [...this.bekleyenKatilim.keys()]) this.katilimKarar(id, true);
    this.s.olay?.({ tur: 'katilim' });
  }

  // ---- iç ----

  private gonder(m: HostMesaji, kime?: string, bag?: string): void {
    if (!this.kapali) this.s.transport.gonder(m, kime, bag);
  }

  private durumYay(): void {
    this.gonder({ t: 'oda_durumu', ...this.odaOzeti() });
    this.s.olay?.({ tur: 'uyeler' });
  }

  private anlikGonder(kime: string): void {
    if (!this.log.length) { this.gonder({ t: 'anlik', donem: this.donem, tabanSeq: 0, olaylar: [] }, kime); return; }
    if (this.taban && this.gunlukBoyutu() > (this.s.anlikEsik ?? 2_000_000)) {
      this.gonder({ t: 'anlik', donem: this.donem, tabanSeq: this.taban.seq, durum: this.taban.durum, olaylar: this.log.slice(this.taban.seq) }, kime);
      return;
    }
    this.gonder({ t: 'anlik', donem: this.donem, tabanSeq: 0, olaylar: [...this.log] }, kime);
  }

  private baglanti(d: BaglantiDurumu): void {
    if (d.tur !== 'uye_gitti') return;
    const u = this.uyeler.get(d.istemciId);
    if (!u || !u.bagli) return;
    u.bagli = false;
    this.gonder({ t: 'uye_durumu', istemciId: u.istemciId, bagli: false, ...(u.karar ? { karar: u.karar } : {}) });
    this.s.olay?.({ tur: 'karar', istemciId: u.istemciId });
    this.durumYay();
  }

  private reddet(kime: string, m: HostMesaji & { t: 'red' }, bag?: string): void {
    this.gonder(m, kime, bag);
    this.s.olay?.({ tur: 'reddedildi', istemciId: kime, neden: m.neden });
  }

  private al(z: Zarf): void {
    if (this.kapali || z.kimden === this.s.hostId) return;
    if (!mesajMi(z.m) || !istemciMesajiMi(z.m)) { this.bozuk++; return; }
    const m: IstemciMesaji = z.m;
    if (m.t === 'katil') { this.katilim(z.kimden, m, z.bag); return; }
    const u = this.uyeler.get(z.kimden);
    if (!u) { this.bozuk++; return; }
    if (!u.bagli) { u.bagli = true; this.s.olay?.({ tur: 'karar', istemciId: u.istemciId }); this.durumYay(); this.kararlariGozden(); }
    switch (m.t) {
      case 'karakter_gonder': this.karakterAl(u, m.kopya); return;
      case 'karakter_geri_al':
        if (u.kopyalar.delete(m.karakterId)) { this.s.olay?.({ tur: 'karakter_gitti', istemciId: u.istemciId, karakterId: m.karakterId }); this.durumYay(); }
        return;
      case 'yakala':
        if (m.sonSeq < 0 || m.sonSeq > this.log.length) this.anlikGonder(u.istemciId);
        else if (m.sonSeq < this.log.length) this.gonder({ t: 'olaylar', donem: this.donem, ilkSeq: m.sonSeq, olaylar: this.log.slice(m.sonSeq) }, u.istemciId);
        else this.ozetGonder(u.istemciId);
        return;
      case 'ayril':
        this.uyeler.delete(u.istemciId);
        for (const id of u.kopyalar.keys()) this.s.olay?.({ tur: 'karakter_gitti', istemciId: u.istemciId, karakterId: id });
        this.durumYay();
        return;
      case 'komut': this.komutAl(u, m.istekId, m.cmd); return;
      case 'zar_cevap': {
        const i = this.istemler.get(m.istekId);
        if (!i || i.istemciId !== u.istemciId || i.tur !== 'zar') { this.bozuk++; return; }
        const req = i.istek as DiceRequest;
        const ok = m.degerler && m.degerler.length === req.count && m.degerler.every((v) => Number.isInteger(v) && v >= 1 && v <= req.sides);
        this.istemKapat(m.istekId, m.otomatik || !ok ? null : m.degerler);
        return;
      }
      case 'tepki_cevap': {
        const i = this.istemler.get(m.istekId);
        if (!i || i.istemciId !== u.istemciId || i.tur !== 'tepki') { this.bozuk++; return; }
        const c = m.cevap as { option?: unknown; choice?: unknown } | null;
        const gecerli = c === null || (typeof c === 'object' && typeof c.option === 'string' && (c.choice === undefined || typeof c.choice === 'string'));
        this.istemKapat(m.istekId, gecerli ? (c === null ? null : { option: c.option as string, ...(typeof c.choice === 'string' ? { choice: c.choice } : {}) }) : undefined);
        return;
      }
      default:
        return; // nabız
    }
  }

  private komutAl(u: HostUye, istekId: string, cmd: Command): void {
    const son = (u.istekler ??= []);
    if (son.includes(istekId)) return; // çift gönderim: bir kez çalışır
    son.push(istekId);
    if (son.length > 64) son.shift();
    const red = (neden: 'yetki' | 'gecersiz' | 'bekle' | 'izleyici', hata: string) => this.gonder({ t: 'komut_red', istekId, neden, hata }, u.istemciId);
    const y = komutYetkisi(this.durumu, cmd, { rol: u.rol, karakterler: new Set(u.kopyalar.keys()) }, this.yzKarakterler);
    if (!y.ok) {
      if (y.neden === 'yetki') {
        const n = (this.yetkisiz.get(u.istemciId) ?? 0) + 1;
        this.yetkisiz.set(u.istemciId, n);
        if (n === 20) this.s.olay?.({ tur: 'yetkisiz', istemciId: u.istemciId, sayi: n });
      }
      red(y.neden, y.hata);
      return;
    }
    if (!this.yurutucu) { red('bekle', 'savaş ekranı açık değil'); return; }
    this.yurutucu({ istemciId: u.istemciId, istekId, cmd, ctx: y.ctx, ownerId: y.ownerId });
  }

  private katilim(kimden: string, m: IstemciMesaji & { t: 'katil' }, bag?: string, onaylandi = false): void {
    if (m.istemciId !== kimden) { this.bozuk++; return; }
    const fark = surumUyusmazligi(this.s.surum, m);
    if (fark) { this.reddet(kimden, { t: 'red', neden: 'surum', ayrinti: fark }, bag); return; }
    const eski = this.uyeler.get(kimden);
    if (eski && m.anahtar !== eski.anahtar) { this.reddet(kimden, { t: 'red', neden: 'anahtar' }, bag); return; }
    // Görev ODA-5 (madde 7): yeni üye onay bekler (aynı kimliğin yeni denemesi eskisinin yerini alır).
    if (!eski && this.katilimOnayi && !onaylandi) {
      this.bekleyenKatilim.set(kimden, { ad: m.ad.trim().slice(0, 40) || '?', m, ...(bag ? { bag } : {}) });
      this.gonder({ t: 'onay_bekle' }, kimden, bag);
      this.s.olay?.({ tur: 'katilim' });
      return;
    }
    const ad = m.ad.trim().slice(0, 40) || '?';
    const u: HostUye = eski
      ? { ...eski, ad, bagli: true }
      : { istemciId: kimden, ad, anahtar: anahtarUret(this.s.rng), rol: this.asama === 'savas' ? 'izleyici' : 'oyuncu', bagli: true, kopyalar: new Map() };
    if (eski && eski.rol === 'izleyici' && u.kopyalar.size === 0 && this.asama !== 'savas') u.rol = 'oyuncu';
    this.uyeler.set(kimden, u);
    this.gonder({ t: 'kabul', istemciId: kimden, anahtar: u.anahtar, rol: u.rol, karakterler: [...u.kopyalar.keys()] }, kimden, bag);
    // Yeniden bağlanana açık istemleri yeniden gönder.
    for (const i of this.istemler.values()) {
      if (i.istemciId !== kimden) continue;
      if (i.tur === 'zar') this.gonder({ t: 'zar_iste', istekId: i.istekId, istek: i.istek }, kimden);
      else this.gonder({ t: 'tepki_sor', istekId: i.istekId, istek: i.istek, sureMs: 20_000 }, kimden);
    }
    this.durumYay();
    if (eski) { this.s.olay?.({ tur: 'karar', istemciId: kimden }); this.kararlariGozden(); }
    // Görev ODA-4: yeniden bağlanan aynı dönemin öneki elindeyse yalnız eksik olaylar; değilse tam anlık.
    const son = m.sonSeq;
    if (eski && m.donem === this.donem && son !== undefined && son >= 0 && son <= this.log.length && this.log.length) {
      if (son < this.log.length) this.gonder({ t: 'olaylar', donem: this.donem, ilkSeq: son, olaylar: this.log.slice(son) }, kimden);
      else this.ozetGonder(kimden);
    } else if (this.log.length || eski) this.anlikGonder(kimden);
    this.sonucYolla(kimden);
  }

  private karakterAl(u: HostUye, kopya: SavedCharacter): void {
    const asama = this.asama;
    const red = asama === 'savas' || asama === 'kurulum' ? { neden: 'kilitli' as const } : this.s.karakterKabul?.(u.istemciId, kopya, asama) ?? null;
    if (red) { this.gonder({ t: 'karakter_red', karakterId: kopya.id, ...red }, u.istemciId); return; }
    // Başka üyenin aynı kimlikli kopyası varsa reddedilir (kimlik savaşta `ownerId`).
    if ([...this.uyeler.values()].some((x) => x !== u && x.kopyalar.has(kopya.id))) {
      this.gonder({ t: 'karakter_red', karakterId: kopya.id, neden: 'gecersiz', ayrinti: 'kimlik' }, u.istemciId);
      return;
    }
    u.kopyalar.set(kopya.id, kopya);
    if (u.rol === 'izleyici') u.rol = 'oyuncu';
    this.s.olay?.({ tur: 'karakter_geldi', istemciId: u.istemciId, kopya });
    this.durumYay();
  }
}
