/**
 * Görev ODA-5 hazırlığı: internet odası bağdaştırıcısının **yer tutucusu** (ODA-TASARIM.md §2 (c), §7 O5). Supabase ve
 * Google girişi bu görevde YOK (kullanıcı kararı 2026-11-28: hesap bağlama sonraya). Arayüz hazır: oyun kodu bu
 * bağdaştırıcıyı da yalnız `RoomTransport` olarak görür; `katil` şimdilik `BaglantiHatasi('kapali')` fırlatır, böylece
 * `baglantiSec` sıradaki türe geçer. SDK hiç içe aktarılmaz (ana parçaya ve savaş parçasına girmez).
 *
 * O5'te uygulanacak (aynı dosya, aynı imza):
 * - Kanal `<kanalOnEki><kod>` (Realtime Broadcast; `kimden` sunucudan değil oturumdan: anonim oturum kimliği, sonra
 *   Google girişi), varlık Presence ile (`uye_geldi`/`uye_gitti`).
 * - Mesaj boyutu sınırı: büyük `anlik` `protocol.ts` `parcala`/`birlestirici` ile parçalı.
 * - Katılım onayı varsayılan açık (`OdaHost.katilimOnayi`), hız sınırı Realtime tarafında; isteğe bağlı sıkı mod
 *   (host'un izdüşürdüğü durum, §4.4) burada karara bağlanır.
 * - SDK tembel: `await import('@supabase/supabase-js')` yalnız bu tür seçilince.
 */
import { BaglantiHatasi, dinleyiciler, type BaglantiDurumu, type RoomTransport, type Uye, type Zarf } from '../transport';
import type { OdaMesaji } from '../protocol';

export interface SupabaseSecenek {
  /** Proje adresi (`https://<proje>.supabase.co`). */
  url: string;
  /** Herkese açık anon anahtar (gizli değil; satır güvenliği sunucuda). Kodda ve depoda tutulmaz: ortam ayarı. */
  anonAnahtar: string;
  /** Kanal adı öneki (varsayılan `oda:`). */
  kanalOnEki?: string;
  /** Tek mesajın azami boyutu (parçalama eşiği). */
  mesajAzami?: number;
}

/** Bu derlemede internet odası var mı (O5'e dek hayır). */
export const supabaseHazir = false;

/** Yer tutucu: arayüzü tam, bağlantı kurmaz (`katil` → `kapali`). */
export function supabaseBaglantisi(_o: SupabaseSecenek): RoomTransport {
  const durum = dinleyiciler<BaglantiDurumu>();
  const zarf = dinleyiciler<Zarf>();
  return {
    tur: 'supabase',
    async katil(_kod: string, _uye: Uye) {
      durum.yay({ tur: 'baglaniyor' });
      durum.yay({ tur: 'koptu', neden: 'supabase-yok' });
      throw new BaglantiHatasi('kapali');
    },
    gonder(_m: OdaMesaji) { /* bağlı değil */ },
    dinle: (fn) => zarf.ekle(fn),
    durum: (fn) => durum.ekle(fn),
    async ayril() { /* bağlı değil */ },
  };
}
