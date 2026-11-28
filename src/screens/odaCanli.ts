/**
 * Görev ODA-1/ODA-2: uygulamadaki etkin çevrimiçi oda (host ya da istemci; sayfa başına en çok biri). Ekran tarafı
 * yapıştırıcısı (bileşen yok; `src/room/` saf çekirdeğini oturum/günlük metniyle ve savaş ekranıyla birleştirir).
 * Ekranlar (`src/screens/OdaLobi.tsx`), savaş ekranı (tembel `import()`) ve uygulama kökü buradan kullanır.
 *
 * Bağlantı türü tek yerde seçilir (`baglantiSec`): sayfa http(s) ile açıldıysa önce yerel ağ aktarıcısı (aynı kökenin
 * `/oda` yolu: `npm run oda-sunucu` ya da geliştirme sunucusu), bağlanamazsa aynı tarayıcının sekmeleri. İlk çalışan
 * tür sayfa boyunca kullanılır. Yerel oda kaydı `src/oda/` aynen; çevrimiçi parti girdileri (`Oda.cevrimici`) ekran
 * tarafında `addOnlineCopy`/`removeOnlineCopy` ile yazılır.
 */
import type { BattleEvent, BattleState, Command } from '../battle/types';
import { characterProblems } from '../rules/builder';
import type { DiceRequest } from '../rules/dice';
import type { ReactionAnswer, ReactionRequest } from '../rules/reactionChoice';
import { createSession, type RemotePrompt, type Session, type SessionWatch } from '../ui/session';
import type { RemoteAsker } from '../ui/diceFlow';
import { describeEvents } from '../ui/log';
import { t } from '../i18n';
import { MAX_PARTY } from '../app/limits';
import { applyBattleResult } from '../app/partyStatus';
import { loadRooms } from '../oda/store';
import { kanonikJson } from '../room/hash';
import type { SavedCharacter } from '../rules/builder';
import type { UyeKarari } from '../room/protocol';
import { rulesSummary, type Oda } from '../oda/model';
import { sekmeBaglantisi } from '../room/adapters/broadcast';
import { agBaglantisi, odaUrl } from '../room/adapters/websocket';
import { OdaHost, type HostOlayi, type KayitliUye, type OdaBilgisi, type UzakKomut } from '../room/host';
import { OdaIstemci, type IstemciOlayi } from '../room/client';
import { guvenliRng, istemciIdUret, kodGecerli, kodUret } from '../room/code';
import { yerelSurum } from '../room/surum';
import { olaylariSuz, type Izleyici } from '../room/view';
import { HP_VIS, setViewerHpVis, type HpVis } from '../oda/active';
import { BaglantiHatasi, dinleyiciler, type RoomTransport, type TransportTuru } from '../room/transport';

const agAdresi = (): string | null =>
  typeof location !== 'undefined' && /^https?:$/.test(location.protocol) ? odaUrl(location) : null;

/** Bağlantı türü seçimi (O2: yerel ağ ya da sekme; O5 supabase). */
export function baglantiSec(tur: TransportTuru): RoomTransport {
  if (tur === 'sekme') return sekmeBaglantisi();
  const url = agAdresi();
  if (tur === 'yerel-ag' && url) return agBaglantisi({ url, baglanmaMs: 2000 });
  throw new BaglantiHatasi('kapali');
}

/** Sayfa boyunca çalışan bağlantı türü (ilk başarılı bağlantıda seçilir). */
let secilen: TransportTuru | null = null;
const denenecek = (): TransportTuru[] => (secilen ? [secilen] : agAdresi() ? ['yerel-ag', 'sekme'] : ['sekme']);
export const baglantiTuru = (): TransportTuru | null => secilen;

export const odaBilgisi = (o: Oda): OdaBilgisi => ({
  ad: o.ad, gmAdi: o.gmAdi, kurallarOzeti: rulesSummary(o.ayarlar.kurallar), hpGorunurluk: o.ayarlar.hpGorunurluk, zarModu: o.ayarlar.zarModu, yzKarakterler: [],
});

// ---- host (GM sekmesi) ----

interface AktifHost { odaId: string; host: OdaHost; tur: TransportTuru }
let aktif: AktifHost | null = null;
let odaAnlik: Oda | null = null;
/** Lobi ekranı açık mı (kapalıyken karakter kopyası kabul edilmez: oda kaydına yazacak ekran yok). */
let lobiAcik = false;
const hostOlaylari = dinleyiciler<HostOlayi>();

export const aktifHost = (odaId?: string): OdaHost | null => (aktif && (!odaId || aktif.odaId === odaId) ? aktif.host : null);
export const hostAbone = (fn: (o: HostOlayi) => void): (() => void) => hostOlaylari.ekle(fn);

/** Lobi ekranı oda kaydını her çizimde bildirir (parti doluluğu ve oda özeti). */
export function hostOdaGuncelle(o: Oda, acik: boolean): void {
  odaAnlik = o;
  lobiAcik = acik;
  if (aktif?.odaId === o.id) aktif.host.odaAyarla(odaBilgisi(o));
}

// ---- Görev ODA-4: host'u diriltme (sayfa yenilenince aynı kod, aynı üyeler ve anahtarlar) ----

const CANLI_KEY = 'rpg-battle-oda-canli';
interface CanliKayit { odaId: string; kod: string; uyeler: Array<Omit<KayitliUye, 'kopyalar'> & { kopyalar: string[] }> }
function canliOku(): CanliKayit | null {
  try { const v = JSON.parse(localStorage.getItem(CANLI_KEY) ?? 'null') as CanliKayit | null; return v && typeof v.odaId === 'string' && kodGecerli(v.kod) && Array.isArray(v.uyeler) ? v : null; } catch { return null; }
}
function canliYaz(h: AktifHost | null): void {
  try {
    if (!h) { localStorage.removeItem(CANLI_KEY); return; }
    const k: CanliKayit = { odaId: h.odaId, kod: h.host.kod, uyeler: h.host.kayitliUyeler().map((u) => ({ ...u, kopyalar: u.kopyalar.map((x) => x.id) })) };
    localStorage.setItem(CANLI_KEY, JSON.stringify(k));
  } catch { /* depolama yok: diriltme olmaz */ }
}
/** Kopyalar oda kaydında (`Oda.cevrimici`); saklanan üye kimlikleri ve anahtarlarıyla birleştirilir. */
function oncekiUyeler(o: Oda, k: CanliKayit): KayitliUye[] {
  const kopya = new Map(o.cevrimici.map((g) => [g.karakterId, g.kopya]));
  return k.uyeler.map((u) => ({ ...u, kopyalar: u.kopyalar.flatMap((id) => { const x = kopya.get(id); return x ? [x] : []; }) }));
}

/** Bu oda bir önceki sayfada çevrimiçiydi ve host şu an yok mu (savaş ekranı ya da lobi açılınca diriltilir). */
export const diriltilebilir = (odaId: string): boolean => !aktif && canliOku()?.odaId === odaId;

/** Görev ODA-4: önceki sayfadaki çevrimiçi odayı aynı kodla geri açar (üyeler kopuk başlar, anahtarla döner). */
export async function hostDirilt(odaId: string, oda?: Oda): Promise<OdaHost | null> {
  if (aktif?.odaId === odaId) return aktif.host;
  const k = canliOku();
  if (!k || k.odaId !== odaId) return null;
  const o = oda ?? loadRooms().find((x) => x.id === odaId);
  if (!o) { canliYaz(null); return null; }
  try { return await cevrimiciAc({ ...o, kod: k.kod }, oncekiUyeler(o, k)); } catch { return null; }
}

/** Odayı çevrimiçi açar (kayıtlı kod boşsa ya da doluysa yeni kod). `onceki`: diriltmede üyeler. */
export async function cevrimiciAc(o: Oda, onceki?: readonly KayitliUye[]): Promise<OdaHost> {
  if (aktif?.odaId === o.id) return aktif.host;
  if (aktif) await cevrimiciKapat();
  if (istemci) await istemciAyril();
  odaAnlik = o;
  const rng = guvenliRng();
  const surum = yerelSurum();
  const adaylar = [...(kodGecerli(o.kod) ? [o.kod] : []), ...Array.from({ length: 5 }, () => kodUret(rng))];
  for (const tur of denenecek()) {
    for (const kod of adaylar) {
      const host = new OdaHost({
        transport: baglantiSec(tur), kod, hostId: `gm-${istemciIdUret(rng)}`, surum, rng, oda: odaBilgisi(o),
        // Diriltilen host'un dönemi öncekininkiyle çakışmasın (eski istemci eksik-olay yoluna girmesin).
        donemTabani: Math.floor(rng() * 1e9),
        ...(onceki && kod === o.kod ? { oncekiUyeler: onceki } : {}),
        sonuc: (kopya: SavedCharacter, st: BattleState) => applyBattleResult([kopya], st)[0]?.status ?? null,
        karakterKabul: (_id, kopya) => {
          const oda = odaAnlik;
          if (!lobiAcik || !oda) return { neden: 'kilitli' };
          if (characterProblems(kopya).length) return { neden: 'gecersiz' };
          if (!oda.parti.includes(kopya.id) && oda.parti.length >= MAX_PARTY) return { neden: 'dolu' };
          return null;
        },
        olay: (e) => { if (aktif?.host === host) canliYaz(aktif); hostOlaylari.yay(e); },
      });
      try {
        await host.baslat();
        aktif = { odaId: o.id, host, tur };
        canliYaz(aktif);
        secilen = tur;
        hostOlaylari.yay({ tur: 'uyeler' });
        return host;
      } catch (e) {
        if (!(e instanceof BaglantiHatasi)) throw e;
        if (e.neden === 'kapali') break; // bu tür yok: sonraki tür
      }
    }
  }
  throw new BaglantiHatasi('kod_dolu');
}

export const aktifHostTuru = (): TransportTuru | null => aktif?.tur ?? null;

export async function cevrimiciKapat(): Promise<void> {
  const a = aktif;
  aktif = null;
  canliYaz(null);
  if (a) await a.host.kapat('gm');
  hostOlaylari.yay({ tur: 'uyeler' });
}

/** GM savaş ekranının olay günlüğü (her değişiklikte): etkin host varsa yayar. */
export function hostYayinla(odaId: string, events: BattleEvent[]): void {
  aktifHost(odaId)?.yayinla(events);
}

/**
 * Görev ODA-2: GM'in savaş ekranı host'a bağlanır. Yetkisi denetlenmiş uzak komutlar `komut`'a gelir; ekran boşken
 * çalıştırır ve `sonuc` ile bildirir. `remote`: zar akışı uzak oyuncunun zar/tepki istemini onun cihazına yollar.
 */
/**
 * Zar/tepki istemini sahibinin cihazına yollayan soru (savaş ekranı ve kurulum ekranının zar akışı). `ownerOf`: savaşçı
 * kimliğinden `ownerId` (karakter kimliği). Etkin host yoksa null.
 */
export function uzakSorucu(odaId: string, ownerOf: (combatantId: string) => string | null | undefined): RemoteAsker | null {
  const host = aktifHost(odaId);
  if (!host) return null;
  const sahibi = (id: string | undefined) => (id ? host.sahibi(ownerOf(id)) : null);
  return {
    dice: (req: DiceRequest) => { const ist = sahibi(req.by); if (!ist) return null; const r = host.zarIste(ist, req); return { id: r.istekId, result: r.sonuc }; },
    reaction: (req: ReactionRequest) => { const ist = sahibi(req.reactorId); if (!ist) return null; const r = host.tepkiSor(ist, req); return { id: r.istekId, result: r.sonuc }; },
    close: (id) => host.istemKapat(id),
  };
}

/** Görev ODA-4: savaş ekranının gördüğü uzak sahip (kopukluk rozeti ve GM karar menüsü). */
export interface UzakSahip { istemciId: string; ad: string; bagli: boolean; karar: UyeKarari | null }

export interface HostKoprusu {
  remote: RemoteAsker;
  sonuc: (k: UzakKomut, hata: string | null) => void;
  kapat: () => void;
  /** Görev ODA-4: bu karakterin (ownerId) uzak sahibi; yoksa null (GM cihazındaki karakter). */
  sahip: (ownerId: string | null | undefined) => UzakSahip | null;
  karar: (istemciId: string, k: UyeKarari | null) => void;
  /** Bu karakter yapay zekâya verildi mi (GM kararı). */
  yz: (ownerId: string | null | undefined) => boolean;
  /** Üye bağlantısı ya da kararı değişince. */
  abone: (fn: () => void) => () => void;
}

export function hostSavasBagla(odaId: string, komut: (k: UzakKomut) => void, durum: () => BattleState): HostKoprusu | null {
  const host = aktifHost(odaId);
  const remote = uzakSorucu(odaId, (id) => durum().combatants[id]?.ownerId);
  if (!host || !remote) return null;
  host.yurutucu = komut;
  return {
    remote,
    sonuc: (k, hata) => host.komutSonucu(k.istemciId, k.istekId, hata),
    kapat: () => { if (host.yurutucu === komut) host.yurutucu = null; for (const i of host.acikIstemler()) host.istemKapat(i.istekId); },
    sahip: (ownerId) => { const u = host.uyesi(ownerId); return u ? { istemciId: u.istemciId, ad: u.ad, bagli: u.bagli, karar: u.karar ?? null } : null; },
    karar: (id, k) => host.kararVer(id, k),
    yz: (ownerId) => !!ownerId && host.yzKarakterler.has(ownerId),
    abone: (fn) => hostOlaylari.ekle((e) => { if (e.tur === 'karar' || e.tur === 'uyeler') fn(); }),
  };
}

/** Bu tepki uzak bir oyuncunun mu (GM cihazında yerel tepki ayarı yerine o oyuncuya sorulur). */
export function uzakSahipMi(odaId: string, state: BattleState, combatantId: string): boolean {
  const host = aktifHost(odaId);
  return !!host && !!host.sahibi(state.combatants[combatantId]?.ownerId);
}

// ---- istemci (oyuncu sekmesi) ----

let istemci: OdaIstemci | null = null;
let oturum: Session | null = null;
/** Görev ODA-4: istemci bağlantısı (kopunca kendiliğinden yeniden bağlanır). */
export type IstemciBaglantisi = 'bagli' | 'yeniden' | 'koptu';
let baglanti: IstemciBaglantisi = 'bagli';
let yenidenZamani: ReturnType<typeof setTimeout> | null = null;
/** Yeniden bağlanma: 2 sn arayla en çok 3 dakika (Game Master sayfayı yeniliyor olabilir). */
const YENIDEN_MS = 2000, YENIDEN_DENEME = 90;
export const istemciBaglantisi = (): IstemciBaglantisi => baglanti;
function baglantiAyarla(b: IstemciBaglantisi): void {
  if (baglanti === b) return;
  baglanti = b;
  if (oturum) { oturum = { ...oturum }; oturumAbone.yay(oturum); }
}
function yenidenBaslat(c: OdaIstemci, deneme = 0): void {
  if (istemci !== c) return;
  if (deneme >= YENIDEN_DENEME) { baglantiAyarla('koptu'); return; }
  baglantiAyarla('yeniden');
  yenidenZamani = setTimeout(() => {
    yenidenZamani = null;
    void c.yenidenBaglan().then((ok) => { if (istemci !== c) return; if (ok) baglantiAyarla('bagli'); else yenidenBaslat(c, deneme + 1); });
  }, YENIDEN_MS);
}

// ---- Görev ODA-4 (madde 8): savaş sonucu ----

export interface BekleyenSonuc { kimlik: string; karakterId: string; durum: SavedCharacter['status'] }
const bekleyenSonuclar = new Map<string, BekleyenSonuc>();
const uygulananSonuclar = new Set<string>();
export const savasSonuclari = (): BekleyenSonuc[] => [...bekleyenSonuclar.values()];
/** Sonuç uygulandı ya da atlandı. */
export function sonucKapat(kimlik: string): void { bekleyenSonuclar.delete(kimlik); uygulananSonuclar.add(kimlik); }
/**
 * Sonuç karaktere sorusuz yazılabilir mi: asıl karakter kopya gönderildiğinden beri değişmedi (Karar 8). Değiştiyse
 * oyuncuya "üzerine yaz / atla" sorulur. Gönderim bu sayfada bilinmiyorsa (sayfa yenilendi) sorulur.
 */
export function sonucSorusuz(ch: SavedCharacter): boolean {
  const g = istemci?.gonderilen.get(ch.id);
  return !!g && g === kanonikJson(ch);
}
/** Sonucu karaktere uygular (yalnız savaşlar arası durum). */
export const sonucUygula = (ch: SavedCharacter, r: BekleyenSonuc): SavedCharacter => ({ ...ch, ...(r.durum ? { status: r.durum } : {}) });
const oturumAbone = dinleyiciler<Session>();
const istemAbone = dinleyiciler<RemotePrompt>();
/** Cevaplanmamış istemler: ekran değişince (lobi ↔ savaş) yeni abone bunları yeniden alır. */
const acikIstemler = new Map<string, RemotePrompt>();
function istemAc(p: RemotePrompt): void { acikIstemler.set(p.id, p); istemAbone.yay(p); }

export const aktifIstemci = (): OdaIstemci | null => istemci;

function oturumGuncelle(c: OdaIstemci, o: IstemciOlayi): void {
  if (o.tur === 'karakter_sonuc') {
    if (!uygulananSonuclar.has(o.kimlik)) bekleyenSonuclar.set(o.kimlik, { kimlik: o.kimlik, karakterId: o.karakterId, durum: o.durum as SavedCharacter['status'] });
    return;
  }
  if (o.tur === 'baglanti') {
    if (o.d.tur === 'koptu' && o.d.neden !== 'degisti' && istemci === c && !yenidenZamani) yenidenBaslat(c);
    return;
  }
  if (o.tur === 'kapandi') { if (yenidenZamani) clearTimeout(yenidenZamani); yenidenZamani = null; baglantiAyarla('koptu'); return; }
  if (o.tur === 'kabul') baglantiAyarla('bagli');
  if (o.tur === 'komut_red' && oturum) {
    const C = t().odaCevrimici;
    oturum = { ...oturum, error: o.hata && o.neden === 'gecersiz' ? o.hata : C.cmdRejected[o.neden] ?? o.neden };
    oturumAbone.yay(oturum);
    return;
  }
  if (o.tur === 'zar_iste') { istemAc({ kind: 'dice', id: o.istekId, request: o.istek, answer: (v) => { acikIstemler.delete(o.istekId); c.zarCevap(o.istekId, v); } }); return; }
  if (o.tur === 'tepki_sor') { istemAc({ kind: 'reaction', id: o.istekId, request: o.istek, answer: (a: ReactionAnswer) => { acikIstemler.delete(o.istekId); c.tepkiCevap(o.istekId, a); } }); return; }
  if (o.tur === 'istem_iptal') { if (acikIstemler.delete(o.istekId)) istemAbone.yay({ kind: 'cancel', id: o.istekId }); return; }
  if (o.tur === 'oda' && c.oda) { setViewerHpVis((HP_VIS as readonly string[]).includes(c.oda.hpGorunurluk) ? c.oda.hpGorunurluk as HpVis : 'tam'); return; }
  if (o.tur !== 'savas') return;
  if (!c.durum) { oturum = null; return; }
  // Görev ODA-3: oturumun olayları ve günlüğü izleyiciye göre süzülür (yalnız gösterim; durum host'unkiyle aynı).
  const iz = izleyiciOf(c);
  const sec = { hp: (c.oda?.hpGorunurluk ?? 'tam') as HpVis };
  oturum = o.sifirlandi || !oturum
    ? createSession(c.durum, olaylariSuz(c.olaylar, null, c.durum, iz, sec))
    : ((yeni) => ({ state: c.durum as BattleState, events: [...(oturum as Session).events, ...yeni], lines: [...(oturum as Session).lines, ...describeEvents(yeni, c.durum as BattleState)], error: null }))(olaylariSuz(o.yeni, oturum.state, c.durum, iz, sec));
  oturumAbone.yay(oturum);
}

/**
 * Kodla katılır (sekmede saklanan istemciId ve yeniden girişte anahtar). Oda yoksa `BaglantiHatasi('oda_yok')`.
 */
export async function kodlaKatil(p: { kod: string; ad: string; istemciId?: string; anahtar?: string }): Promise<OdaIstemci> {
  if (istemci) await istemciAyril();
  const istemciId = p.istemciId ?? istemciIdUret(guvenliRng());
  for (const tur of denenecek()) {
    const c = new OdaIstemci({
      transport: baglantiSec(tur), kod: p.kod, istemciId, ad: p.ad, surum: yerelSurum(), yeniBaglanti: () => baglantiSec(tur),
      ...(p.anahtar ? { anahtar: p.anahtar } : {}),
      uyar: (m) => { console.warn(m); },
    });
    c.abone((o) => oturumGuncelle(c, o));
    try {
      await c.baglan();
    } catch (e) {
      if (!(e instanceof BaglantiHatasi)) throw e;
      continue; // bu türde oda yok ya da tür kapalı: sonraki tür
    }
    secilen = tur;
    istemci = c;
    oturum = null;
    baglanti = 'bagli';
    return c;
  }
  throw new BaglantiHatasi('oda_yok');
}

export async function istemciAyril(): Promise<void> {
  const c = istemci;
  istemci = null;
  oturum = null;
  setViewerHpVis(null);
  if (yenidenZamani) clearTimeout(yenidenZamani);
  yenidenZamani = null;
  baglanti = 'bagli';
  acikIstemler.clear();
  if (c) await c.ayril();
}

/** Görev ODA-3: bu cihazın izleyicisi: oyuncu rolünde kendi karakter kopyaları (savaşta `ownerId`), yoksa izleyici. */
function izleyiciOf(c: OdaIstemci): Izleyici {
  if (c.rol !== 'oyuncu') return { tur: 'izleyici' };
  return { tur: 'oyuncu', ownerIds: c.oda?.uyeler.find((u) => u.istemciId === c.istemciId)?.karakterler ?? [] };
}

/** Bu cihazın oyuncusu savaştaki bir karakterin sahibi mi (dokunma açık, komutlar host'a). */
function kontrolVar(): boolean {
  const c = istemci;
  if (!c || c.rol !== 'oyuncu' || !c.durum || !c.oda) return false;
  const benim = new Set(c.oda.uyeler.find((u) => u.istemciId === c.istemciId)?.karakterler ?? []);
  return Object.values(c.durum.combatants).some((x) => !!x.ownerId && benim.has(x.ownerId));
}

/** Oyuncu sekmesinin savaş oturumu: izleme; kendi karakteri varsa komut ve istemler (O2). */
export const izleme: SessionWatch = {
  current: () => oturum,
  subscribe: (fn) => oturumAbone.ekle(fn),
  control: kontrolVar,
  send: (cmd: Command) => { istemci?.komutGonder(cmd); },
  prompts: (fn) => { for (const p of [...acikIstemler.values()]) fn(p); return istemAbone.ekle(fn); },
  viewer: () => (istemci ? izleyiciOf(istemci) : { tur: 'izleyici' }),
  connection: () => baglanti,
};
