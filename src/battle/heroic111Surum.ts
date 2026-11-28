/**
 * Görev HEROIC-INSPIRATION-TAM (kural sürümü 111; SRD 5.2.1 s. 7 "Heroic Inspiration", s. 182 Sözlük): Heroic Inspiration
 * genel kural. 111+ savaşta hakkı olan her oyuncu karakteri (savaşçıda `hi111` işareti, savaş başında) onu kullanır: başarısız
 * d20 bir kez yeniden atılır (eskiden yalnız Human Resourceful ve Champion Heroic Warrior işaretiyle). Game Master savaşta hak
 * verir (`grant_inspiration` → `inspiration_granted`; en çok 1, varsa hakkı olmayan dosta aktarılır ya da kaybolur).
 * 110 ve altı (eski kayıt, replay) aynen. Tek sabit; yaprak modül. Kararlar DECISIONS.md "HEROIC-INSPIRATION-TAM".
 */
import type { BattleState } from './types';

export const HEROIC111_VERSION = 111;
export const heroic111On = (s: Pick<BattleState, 'kuralSurumu'> | undefined): boolean => (s?.kuralSurumu ?? 1) >= HEROIC111_VERSION;
