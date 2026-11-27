/**
 * Görev ODA-1 (O1): uygulamadaki etkin çevrimiçi oda (host ya da istemci; sayfa başına en çok biri). Ekran tarafı
 * yapıştırıcısı (bileşen yok; `src/room/` saf çekirdeğini oturum/günlük metniyle birleştirir). Ekranlar
 * (`src/screens/OdaLobi.tsx`) ve uygulama kökü (tembel `import()`) buradan kullanır. Bağlantı türü tek yerde
 * seçilir (`baglantiSec`): O1'de yalnız sekme (BroadcastChannel). Yerel oda kaydı `src/oda/` aynen; çevrimiçi parti
 * girdileri (`Oda.cevrimici`) ekran tarafında `addOnlineCopy`/`removeOnlineCopy` ile yazılır.
 */
import type { BattleEvent } from '../battle/types';
import { characterProblems } from '../rules/builder';
import { createSession, type Session, type SessionWatch } from '../ui/session';
import { describeEvents } from '../ui/log';
import { MAX_PARTY } from '../app/limits';
import { rulesSummary, type Oda } from '../oda/model';
import { sekmeBaglantisi } from '../room/adapters/broadcast';
import { OdaHost, type HostOlayi, type OdaBilgisi } from '../room/host';
import { OdaIstemci, type IstemciOlayi } from '../room/client';
import { guvenliRng, istemciIdUret, kodGecerli, kodUret } from '../room/code';
import { yerelSurum } from '../room/surum';
import { BaglantiHatasi, dinleyiciler, type RoomTransport, type TransportTuru } from '../room/transport';

/** Bağlantı türü seçimi (O1: yalnız sekme; O2 yerel ağ, O5 supabase). */
export function baglantiSec(tur: TransportTuru = 'sekme'): RoomTransport {
  if (tur === 'sekme') return sekmeBaglantisi();
  throw new BaglantiHatasi('kapali');
}

export const odaBilgisi = (o: Oda): OdaBilgisi => ({
  ad: o.ad, gmAdi: o.gmAdi, kurallarOzeti: rulesSummary(o.ayarlar.kurallar), hpGorunurluk: o.ayarlar.hpGorunurluk, zarModu: o.ayarlar.zarModu, yzKarakterler: [],
});

// ---- host (GM sekmesi) ----

interface AktifHost { odaId: string; host: OdaHost }
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

/** Odayı çevrimiçi açar (kayıtlı kod boşsa ya da doluysa yeni kod). Kodu döner. */
export async function cevrimiciAc(o: Oda): Promise<OdaHost> {
  if (aktif?.odaId === o.id) return aktif.host;
  if (aktif) await cevrimiciKapat();
  if (istemci) await istemciAyril();
  odaAnlik = o;
  const rng = guvenliRng();
  const surum = yerelSurum();
  const adaylar = [...(kodGecerli(o.kod) ? [o.kod] : []), ...Array.from({ length: 5 }, () => kodUret(rng))];
  for (const kod of adaylar) {
    const host = new OdaHost({
      transport: baglantiSec(), kod, hostId: `gm-${istemciIdUret(rng)}`, surum, rng, oda: odaBilgisi(o),
      karakterKabul: (_id, kopya) => {
        const oda = odaAnlik;
        if (!lobiAcik || !oda) return { neden: 'kilitli' };
        if (characterProblems(kopya).length) return { neden: 'gecersiz' };
        if (!oda.parti.includes(kopya.id) && oda.parti.length >= MAX_PARTY) return { neden: 'dolu' };
        return null;
      },
      olay: (e) => hostOlaylari.yay(e),
    });
    try {
      await host.baslat();
      aktif = { odaId: o.id, host };
      hostOlaylari.yay({ tur: 'uyeler' });
      return host;
    } catch (e) {
      if (!(e instanceof BaglantiHatasi) || e.neden !== 'kod_dolu') throw e;
    }
  }
  throw new BaglantiHatasi('kod_dolu');
}

export async function cevrimiciKapat(): Promise<void> {
  const a = aktif;
  aktif = null;
  if (a) await a.host.kapat('gm');
  hostOlaylari.yay({ tur: 'uyeler' });
}

/** GM savaş ekranının olay günlüğü (her değişiklikte): etkin host varsa yayar. */
export function hostYayinla(odaId: string, events: BattleEvent[]): void {
  aktifHost(odaId)?.yayinla(events);
}

// ---- istemci (oyuncu sekmesi) ----

let istemci: OdaIstemci | null = null;
let oturum: Session | null = null;
const oturumAbone = dinleyiciler<Session>();

export const aktifIstemci = (): OdaIstemci | null => istemci;

function oturumGuncelle(c: OdaIstemci, o: IstemciOlayi): void {
  if (o.tur !== 'savas') return;
  if (!c.durum) { oturum = null; return; }
  oturum = o.sifirlandi || !oturum
    ? createSession(c.durum, c.olaylar)
    : { state: c.durum, events: [...oturum.events, ...o.yeni], lines: [...oturum.lines, ...describeEvents(o.yeni, c.durum)], error: null };
  oturumAbone.yay(oturum);
}

/**
 * Kodla katılır. `kimlik`: sekmede saklanan istemciId ve (yeniden girişte) anahtar; `anahtarAlindi` yeni anahtarı
 * saklamak için. Oda yoksa `BaglantiHatasi('oda_yok')`.
 */
export async function kodlaKatil(p: { kod: string; ad: string; istemciId?: string; anahtar?: string }): Promise<OdaIstemci> {
  if (istemci) await istemciAyril();
  const c = new OdaIstemci({
    transport: baglantiSec(), kod: p.kod, istemciId: p.istemciId ?? istemciIdUret(guvenliRng()), ad: p.ad, surum: yerelSurum(),
    ...(p.anahtar ? { anahtar: p.anahtar } : {}),
    uyar: (m) => { console.warn(m); },
  });
  c.abone((o) => oturumGuncelle(c, o));
  await c.baglan();
  istemci = c;
  oturum = null;
  return c;
}

export async function istemciAyril(): Promise<void> {
  const c = istemci;
  istemci = null;
  oturum = null;
  if (c) await c.ayril();
}

/** Oyuncu sekmesinin salt izleme oturumu (savaş ekranı abone olur). */
export const izleme: SessionWatch = {
  current: () => oturum,
  subscribe: (fn) => oturumAbone.ekle(fn),
};

