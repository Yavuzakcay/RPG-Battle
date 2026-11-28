/**
 * Görev ODA-2 (O2): yerel ağ bağdaştırıcısı (tarayıcı/node `WebSocket` istemcisi; ODA-TASARIM.md §2 (b)). Aktarıcı
 * `src/room/aktarici.ts` (sunucu `npm run oda-sunucu` ya da geliştirme sunucusu eklentisi). Uygulama aktarıcıyla aynı
 * kökenden açılır: adres `ws://<host>/oda`. Tarayıcı API'si yalnız bu dosyada.
 */
import { BaglantiHatasi, dinleyiciler, type BaglantiDurumu, type RoomTransport, type Uye, type Zarf } from '../transport';
import type { OdaMesaji } from '../protocol';
import type { SunucuCercevesi } from '../aktarici';

interface SoketBenzeri {
  readyState: number;
  send(v: string): void;
  close(): void;
  addEventListener(t: 'open' | 'close' | 'error', fn: () => void): void;
  addEventListener(t: 'message', fn: (e: { data: unknown }) => void): void;
}

export interface AgSecenek {
  url: string;
  /** Bağlantı ve aktarıcı yanıtı için bekleme. */
  baglanmaMs?: number;
  soket?: (url: string) => SoketBenzeri;
}

const varsayilanSoket = (url: string): SoketBenzeri => {
  const WS = (globalThis as { WebSocket?: new (u: string) => SoketBenzeri }).WebSocket;
  if (!WS) throw new BaglantiHatasi('kapali');
  return new WS(url);
};

/** Sayfanın kökeninden aktarıcı adresi (`http` → `ws`, `https` → `wss`). */
export const odaUrl = (loc: { protocol: string; host: string }): string => `${loc.protocol === 'https:' ? 'wss' : 'ws'}://${loc.host}/oda`;

export function agBaglantisi(o: AgSecenek): RoomTransport {
  const zarf = dinleyiciler<Zarf>();
  const durum = dinleyiciler<BaglantiDurumu>();
  let ws: SoketBenzeri | null = null;
  let host = false;
  let ayrildi = false;
  const yolla = (x: unknown) => { try { if (ws && ws.readyState === 1) ws.send(JSON.stringify(x)); } catch { /* kapanıyor */ } };

  const t: RoomTransport = {
    tur: 'yerel-ag',
    async katil(kod: string, uye: Uye) {
      durum.yay({ tur: 'baglaniyor' });
      host = uye.rol === 'host';
      const s = (o.soket ?? varsayilanSoket)(o.url);
      ws = s;
      const sonuc = await new Promise<'bagli' | 'kod_dolu' | 'oda_yok' | 'kapali' | 'hiz'>((r) => {
        const sure = setTimeout(() => r('kapali'), o.baglanmaMs ?? 2500);
        const bitir = (x: 'bagli' | 'kod_dolu' | 'oda_yok' | 'kapali' | 'hiz') => { clearTimeout(sure); r(x); };
        s.addEventListener('open', () => yolla({ k: 'katil', kod, uye }));
        s.addEventListener('error', () => bitir('kapali'));
        s.addEventListener('close', () => {
          bitir('kapali');
          if (!ayrildi) durum.yay({ tur: 'koptu', neden: 'kapandi' });
        });
        s.addEventListener('message', (e) => {
          let f: SunucuCercevesi;
          try { f = JSON.parse(String(e.data)) as SunucuCercevesi; } catch { return; }
          switch (f.k) {
            case 'bagli': bitir('bagli'); return;
            case 'kod_dolu': bitir('kod_dolu'); return;
            case 'oda_yok': case 'gecersiz': bitir('oda_yok'); return;
            // Görev ODA-5: aktarıcının hız sınırı.
            case 'hiz': ayrildi = true; bitir('hiz'); durum.yay({ tur: 'koptu', neden: 'hiz' }); return;
            case 'z': if (f.z && typeof f.z === 'object') zarf.yay(f.z); return;
            case 'uye_gitti': durum.yay({ tur: 'uye_gitti', istemciId: f.istemciId }); return;
            case 'host_gitti': durum.yay({ tur: 'koptu', neden: 'host' }); return;
            case 'degisti': ayrildi = true; durum.yay({ tur: 'koptu', neden: 'degisti' }); return;
          }
        });
      });
      if (sonuc !== 'bagli') {
        ayrildi = true;
        try { s.close(); } catch { /* yok */ }
        ws = null;
        if (sonuc === 'kod_dolu' || sonuc === 'oda_yok' || sonuc === 'hiz') durum.yay({ tur: sonuc });
        throw new BaglantiHatasi(sonuc);
      }
      durum.yay({ tur: 'bagli' });
    },
    gonder(m: OdaMesaji, kime?: string, bag?: string) {
      yolla({ k: 'z', ...(host && kime ? { kime } : {}), ...(host && bag ? { bag } : {}), m });
    },
    dinle: (fn) => zarf.ekle(fn),
    durum: (fn) => durum.ekle(fn),
    async ayril() {
      ayrildi = true;
      yolla({ k: 'ayril' });
      try { ws?.close(); } catch { /* yok */ }
      ws = null;
    },
  };
  return t;
}
