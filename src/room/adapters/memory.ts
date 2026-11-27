/**
 * Görev ODA-1 (O1): bellek içi bağdaştırıcı (yalnız test; ODA-TASARIM.md §2). Tek süreçte host + N sanal istemci.
 * Mesajlar kuyruğa girer, testte `bosalt()` ile teslim edilir; ağ yolculuğu JSON gidiş-dönüşüyle taklit edilir.
 * Hata kancaları: `dusur` (teslim etme), `cogalt` (iki kez), `geciktir` (kuyruğun sonuna bir kez daha).
 */
import { BaglantiHatasi, dinleyiciler, type BaglantiDurumu, type RoomTransport, type Uye, type Zarf } from '../transport';
import type { OdaMesaji } from '../protocol';

export interface HataKancalari {
  dusur?: (z: Zarf) => boolean;
  cogalt?: (z: Zarf) => boolean;
  geciktir?: (z: Zarf) => boolean;
}

interface Kayit { uye: Uye | null; oda: string | null; bagli: boolean; zarf: ReturnType<typeof dinleyiciler<Zarf>>; durum: ReturnType<typeof dinleyiciler<BaglantiDurumu>> }

export interface BellekHub {
  /** Yeni üye bağlantısı (katil çağrılınca odaya girer). */
  baglanti(): RoomTransport;
  /** Kuyruktaki mesajları teslim eder (teslim sırasında üretilenler dahil); teslim sayısı. */
  bosalt(azami?: number): number;
  hata: HataKancalari;
  /** Üyeyi düşürür (mesaj alıp veremez; host'a `uye_gitti`). */
  kopar(istemciId: string): void;
  bagla(istemciId: string): void;
  readonly bekleyen: number;
}

export function bellekHub(): BellekHub {
  const kayitlar: Kayit[] = [];
  const kuyruk: Array<{ z: Zarf; gecikti?: boolean }> = [];
  const hub: BellekHub = {
    hata: {},
    get bekleyen() { return kuyruk.length; },
    baglanti() {
      const k: Kayit = { uye: null, oda: null, bagli: false, zarf: dinleyiciler<Zarf>(), durum: dinleyiciler<BaglantiDurumu>() };
      kayitlar.push(k);
      const hostOf = (oda: string) => kayitlar.find((x) => x.oda === oda && x.uye?.rol === 'host' && x.bagli);
      const t: RoomTransport = {
        tur: 'bellek',
        async katil(kod, uye) {
          k.durum.yay({ tur: 'baglaniyor' });
          if (uye.rol === 'host' && hostOf(kod)) { k.durum.yay({ tur: 'kod_dolu' }); throw new BaglantiHatasi('kod_dolu'); }
          const host = hostOf(kod);
          if (uye.rol !== 'host' && !host) { k.durum.yay({ tur: 'oda_yok' }); throw new BaglantiHatasi('oda_yok'); }
          k.uye = uye; k.oda = kod; k.bagli = true;
          k.durum.yay({ tur: 'bagli' });
          if (host && host !== k) host.durum.yay({ tur: 'uye_geldi', uye });
        },
        gonder(m: OdaMesaji, kime?: string) {
          if (!k.bagli || !k.uye || !k.oda) return;
          const host = hostOf(k.oda);
          const hedef = k.uye.rol === 'host' ? kime : host?.uye?.istemciId;
          kuyruk.push({ z: JSON.parse(JSON.stringify({ oda: k.oda, kimden: k.uye.istemciId, ...(hedef ? { kime: hedef } : {}), m })) as Zarf });
        },
        dinle: (fn) => k.zarf.ekle(fn),
        durum: (fn) => k.durum.ekle(fn),
        async ayril() {
          const host = k.oda ? hostOf(k.oda) : undefined;
          const id = k.uye?.istemciId;
          k.bagli = false; k.oda = null;
          if (host && host !== k && id) host.durum.yay({ tur: 'uye_gitti', istemciId: id });
        },
      };
      return t;
    },
    bosalt(azami = 100_000) {
      let n = 0;
      while (kuyruk.length && n < azami) {
        const q = kuyruk.shift()!;
        if (!q.gecikti && hub.hata.geciktir?.(q.z)) { kuyruk.push({ z: q.z, gecikti: true }); continue; }
        if (hub.hata.dusur?.(q.z)) continue;
        const kez = hub.hata.cogalt?.(q.z) ? 2 : 1;
        for (let i = 0; i < kez; i++) {
          const gonderen = kayitlar.find((x) => x.uye?.istemciId === q.z.kimden && x.oda === q.z.oda);
          if (!gonderen?.bagli) break;
          // Aynı kimlikle birden çok bağlantı varsa adresli mesaj en son katılana gider (aktarıcı kimliği bağlantıya eşler).
          const alicilar = q.z.kime
            ? [...kayitlar].reverse().filter((x) => x.bagli && x.oda === q.z.oda && x !== gonderen && x.uye?.istemciId === q.z.kime).slice(0, 1)
            : gonderen.uye?.rol === 'host' ? kayitlar.filter((x) => x.bagli && x.oda === q.z.oda && x !== gonderen) : [];
          for (const a of alicilar) { a.zarf.yay(JSON.parse(JSON.stringify(q.z)) as Zarf); n++; }
        }
      }
      return n;
    },
    kopar(id) {
      const k = kayitlar.find((x) => x.uye?.istemciId === id && x.bagli);
      if (!k || !k.oda) return;
      const host = kayitlar.find((x) => x.oda === k.oda && x.uye?.rol === 'host' && x.bagli);
      k.bagli = false;
      k.durum.yay({ tur: 'koptu', neden: 'test' });
      if (host && host !== k) host.durum.yay({ tur: 'uye_gitti', istemciId: id });
    },
    bagla(id) {
      const k = kayitlar.find((x) => x.uye?.istemciId === id && !x.bagli && x.oda);
      if (!k || !k.oda || !k.uye) return;
      k.bagli = true;
      k.durum.yay({ tur: 'bagli' });
      const host = kayitlar.find((x) => x.oda === k.oda && x.uye?.rol === 'host' && x.bagli);
      if (host && host !== k) host.durum.yay({ tur: 'uye_geldi', uye: k.uye });
    },
  };
  return hub;
}
