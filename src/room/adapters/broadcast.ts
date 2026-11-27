/**
 * Görev ODA-1 (O1): aynı tarayıcıdaki sekmeler arası bağdaştırıcı (BroadcastChannel; ODA-TASARIM.md §2 (a)).
 * Kanal `dice-hex-oda-<kod>`. Host kodu sahiplenir: `kim_var` sorar, `sahiplenmeMs` içinde başka host yanıt vermezse
 * kod onundur (aynı anda iki host sorarsa küçük kimlik kazanır). Oyuncu `kim_var` sorar, host `benim` der; yanıt yoksa
 * `oda_yok`. Varlık: her üye `nabizMs`'de bir `nabiz` atar, `kopmaMs` duyulmayan koptu sayılır; `pagehide`'da `gitti`.
 * Zarf olduğu gibi gider (yapısal kopya); `kimden`'i bu bağdaştırıcı yazar, istemci yalnız host'tan gelene bakar.
 * Tarayıcı API'si (BroadcastChannel, zamanlayıcı, pagehide) yalnız bu dosyada.
 */
import { BaglantiHatasi, dinleyiciler, type BaglantiDurumu, type RoomTransport, type Uye, type Zarf } from '../transport';
import type { OdaMesaji } from '../protocol';

interface KanalBenzeri {
  postMessage(x: unknown): void;
  addEventListener(t: 'message', fn: (e: { data: unknown }) => void): void;
  close(): void;
}

type Cerceve =
  | { k: 'kim_var'; id: string; rol: Uye['rol'] }
  | { k: 'benim'; id: string }
  | { k: 'z'; z: Zarf }
  | { k: 'nabiz'; id: string }
  | { k: 'gitti'; id: string };

export interface SekmeSecenek {
  kanal?: (ad: string) => KanalBenzeri;
  sahiplenmeMs?: number;
  /** Oyuncunun host yanıtını bekleme süresi. */
  bulmaMs?: number;
  nabizMs?: number;
  kopmaMs?: number;
}

export const kanalAdi = (kod: string): string => `dice-hex-oda-${kod}`;

const varsayilanKanal = (ad: string): KanalBenzeri => {
  const BC = (globalThis as { BroadcastChannel?: new (n: string) => KanalBenzeri }).BroadcastChannel;
  if (!BC) throw new BaglantiHatasi('kapali');
  return new BC(ad);
};

export function sekmeBaglantisi(o: SekmeSecenek = {}): RoomTransport {
  const zarf = dinleyiciler<Zarf>();
  const durum = dinleyiciler<BaglantiDurumu>();
  const nabizMs = o.nabizMs ?? 5000, kopmaMs = o.kopmaMs ?? 15000;
  let kanal: KanalBenzeri | null = null;
  let ben: Uye | null = null;
  let kod = '';
  let hostId: string | null = null;
  let sahip = false;
  const sonDuyma = new Map<string, number>();
  const zamanlar: Array<ReturnType<typeof setInterval>> = [];
  let sayfaKapanis: (() => void) | null = null;

  const yolla = (c: Cerceve) => { try { kanal?.postMessage(c); } catch { /* kanal kapandı */ } };
  const duydum = (id: string) => {
    if (!ben || id === ben.istemciId) return;
    const yeni = !sonDuyma.has(id);
    sonDuyma.set(id, Date.now());
    if (yeni && sahip) durum.yay({ tur: 'uye_geldi', uye: { istemciId: id, rol: 'oyuncu' } });
  };
  const gitti = (id: string) => {
    if (!sonDuyma.delete(id)) return;
    if (sahip) durum.yay({ tur: 'uye_gitti', istemciId: id });
    else if (id === hostId) durum.yay({ tur: 'koptu', neden: 'host' });
  };
  const kapat = () => {
    zamanlar.splice(0).forEach((x) => clearInterval(x));
    if (sayfaKapanis && typeof removeEventListener === 'function') removeEventListener('pagehide', sayfaKapanis);
    sayfaKapanis = null;
    try { kanal?.close(); } catch { /* yok */ }
    kanal = null;
  };

  const t: RoomTransport = {
    tur: 'sekme',
    async katil(k, uye) {
      durum.yay({ tur: 'baglaniyor' });
      kod = k; ben = uye;
      const c = (o.kanal ?? varsayilanKanal)(kanalAdi(k));
      kanal = c;
      let rakip = false;
      let bulunan: string | null = null;
      let bulundu: (() => void) | null = null;
      c.addEventListener('message', (e) => {
        const f = e.data as Cerceve;
        if (!f || typeof f !== 'object' || !ben) return;
        switch (f.k) {
          case 'kim_var':
            if (sahip) yolla({ k: 'benim', id: ben.istemciId });
            else if (ben.rol === 'host' && f.rol === 'host' && f.id < ben.istemciId) rakip = true;
            return;
          case 'benim':
            if (ben.rol === 'host' && !sahip) rakip = true;
            if (ben.rol !== 'host' && !bulunan) { bulunan = f.id; bulundu?.(); }
            return;
          case 'nabiz': duydum(f.id); return;
          case 'gitti': gitti(f.id); return;
          case 'z': {
            const z = f.z;
            if (!z || z.oda !== kod) return;
            if (sahip) {
              if (z.kime !== ben.istemciId) return;
              duydum(z.kimden);
            } else {
              if (z.kimden !== hostId || (z.kime !== undefined && z.kime !== ben.istemciId)) return;
              sonDuyma.set(z.kimden, Date.now());
            }
            zarf.yay(z);
            return;
          }
        }
      });
      yolla({ k: 'kim_var', id: uye.istemciId, rol: uye.rol });
      if (uye.rol === 'host') {
        await new Promise((r) => setTimeout(r, o.sahiplenmeMs ?? 300));
        if (rakip) { kapat(); durum.yay({ tur: 'kod_dolu' }); throw new BaglantiHatasi('kod_dolu'); }
        sahip = true;
        hostId = uye.istemciId;
      } else {
        await new Promise<void>((r) => { bulundu = r; setTimeout(r, o.bulmaMs ?? 1000); });
        bulundu = null;
        if (!bulunan) { kapat(); durum.yay({ tur: 'oda_yok' }); throw new BaglantiHatasi('oda_yok'); }
        hostId = bulunan;
        sonDuyma.set(bulunan, Date.now());
      }
      zamanlar.push(setInterval(() => {
        if (!ben) return;
        yolla({ k: 'nabiz', id: ben.istemciId });
        const simdi = Date.now();
        for (const [id, at] of [...sonDuyma]) if (simdi - at > kopmaMs) gitti(id);
      }, nabizMs));
      if (typeof addEventListener === 'function') {
        sayfaKapanis = () => { void t.ayril(); };
        addEventListener('pagehide', sayfaKapanis);
      }
      durum.yay({ tur: 'bagli' });
    },
    gonder(m: OdaMesaji, kime?: string) {
      if (!ben || !kanal) return;
      const hedef = sahip ? kime : hostId ?? undefined;
      yolla({ k: 'z', z: { oda: kod, kimden: ben.istemciId, ...(hedef ? { kime: hedef } : {}), m } });
    },
    dinle: (fn) => zarf.ekle(fn),
    durum: (fn) => durum.ekle(fn),
    async ayril() {
      if (ben && kanal) yolla({ k: 'gitti', id: ben.istemciId });
      kapat();
      sahip = false; hostId = null; sonDuyma.clear();
    },
  };
  return t;
}
