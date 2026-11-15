/**
 * Görev OD1: etkin odanın kural örtüsü (ağdan ve arayüzden bağımsız, bağımlılıksız küçük modül; ana parçada).
 * Bir oda ekranı ya da odadan kurulan savaş açıkken oda kuralları cihazın genel ayarlarının ÜSTÜNE biner
 * (`app/features`, `ui/carrySetting`, `app/discovery` okurken buraya bakar); kapanınca genel değerler aynen geri gelir.
 * Genel (cihaz) saklama anahtarlarına hiçbir şey yazılmaz: Hızlı savaş eski global değerleri kullanır.
 */
export type HpVis = 'gizli' | 'etiket' | 'yuzde' | 'tam';
export const HP_VIS: readonly HpVis[] = ['gizli', 'etiket', 'yuzde', 'tam'];

export interface RoomOverlay {
  /** `rpg-battle-deneysel` alanlarının odadaki karşılığı (ustSeviye, hizalanma*, yolculuk). */
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
/** Savaş ekranındaki düşman HP görünürlüğü; kayıtlı değer, yoksa oda; ikisi de yoksa (Hızlı savaş, Serüven…) tam. */
export const enemyHpVis = (): HpVis => battleHp ?? current?.hp ?? 'tam';
