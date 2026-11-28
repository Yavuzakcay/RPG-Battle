/**
 * Görev OD1: etkin odanın kural örtüsü (ağdan ve arayüzden bağımsız, bağımlılıksız küçük modül; ana parçada).
 * Bir oda ekranı ya da odadan kurulan savaş açıkken oda kuralları cihazın genel ayarlarının ÜSTÜNE biner
 * (`app/features`, `ui/carrySetting`, `app/discovery` okurken buraya bakar); kapanınca genel değerler aynen geri gelir.
 * Genel (cihaz) saklama anahtarlarına hiçbir şey yazılmaz: Hızlı savaş eski global değerleri kullanır.
 */
export type HpVis = 'gizli' | 'etiket' | 'yuzde' | 'tam';
export const HP_VIS: readonly HpVis[] = ['gizli', 'etiket', 'yuzde', 'tam'];

export interface RoomOverlay {
  /** `rpg-battle-deneysel` alanlarının odadaki karşılığı (hizalanma*, yolculuk). */
  deneysel: Record<string, boolean>;
  tasima?: string;
  kesif?: boolean;
  ipucu?: boolean;
  /** Düşman HP görünürlüğü (yalnız arayüz). */
  hp: HpVis;
}

let current: RoomOverlay | null = null;

export const roomOverlay = (): RoomOverlay | null => current;
export function setRoomOverlay(o: RoomOverlay | null): void { current = o; }
/** Görev OD1B: kayıttan devam eden savaşın kaydındaki HP görünürlüğü (oda örtüsünden önce gelir). */
let battleHp: HpVis | null = null;
export function setBattleHpVis(h: HpVis | null): void { battleHp = h; }
/**
 * Görev ODA-3 (O3): çevrimiçi odada HP kademesi izleyiciye bağlı. Game Master cihazı (host) her zaman tam; oyuncu
 * cihazı odanın kademesini (`oda_durumu.hpGorunurluk`) görür. Tek cihazda null (kayıt/oda değeri aynen).
 */
let viewerHp: HpVis | null = null;
export function setViewerHpVis(h: HpVis | null): void { viewerHp = h; }
/** Kayda yazılan HP görünürlüğü (izleyiciden bağımsız: GM'in tam görmesi kayda geçmez). */
export const savedHpVis = (): HpVis => battleHp ?? current?.hp ?? 'tam';
/** Savaş ekranındaki düşman HP görünürlüğü; çevrimiçi izleyici, kayıtlı değer, oda; hiçbiri yoksa (Hızlı savaş, Serüven…) tam. */
export const enemyHpVis = (): HpVis => viewerHp ?? savedHpVis();
