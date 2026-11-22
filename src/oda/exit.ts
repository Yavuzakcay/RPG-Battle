/** Görev OD1: odadan kurulan savaş ekranından çıkış (tembel): savaş bittiyse kilit açılır ve son savaş özeti yazılır. */
import type { BattleState } from '../battle/types';
import { loadRooms, saveRooms, unlockRoom, updateRoom } from './store';
import type { SonSavas } from './model';

export function roomBattleExit(roomId: string, final: BattleState | null | undefined): void {
  if (!final || final.status !== 'finished') return; // bitmedi: kayıtlı savaş için kilit sürer
  const sonuc: SonSavas['sonuc'] = final.winner === 'party' ? 'zafer' : 'yenilgi';
  const son: SonSavas = { zaman: new Date().toISOString(), harita: final.map?.id ?? '', sonuc };
  saveRooms(updateRoom(loadRooms(), roomId, (o) => unlockRoom(o, son)));
}
