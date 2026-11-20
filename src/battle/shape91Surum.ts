/**
 * Görev WS91 (kural sürümü 91): Wild Shape (SRD 5.2.1 s. 43 "Game Statistics") ve Polymorph (s. 153) biçim aktarımının
 * tamamlanması. Biçime geçince stat bloğunun kalan oyun değerleri (duyular, direnç/bağışıklık/zayıflık, durum bağışıklığı,
 * tırmanma/kazma, canavar özellikleri ve yetenekleri, tepkiler) savaş başındaki canavar kurulumunun aynı geçişinden
 * (`monsterSetup.ts` `setupMonster`) biçim savaşçısına işlenir, biçim bitince `shape.prev`'ten geri gelir
 * (`shapeMonster.ts`). Ayrıca: Polymorph bitince kalan geçici HP gider (s. 153), Hover'lı canavar Prone/Incapacitated/hız 0
 * iken havada kalır (s. 183 "Flying", "Hover"), Archmage'in "Charmed (with Mind Blank)" bağışıklığı (s. 305; Mind Blank
 * "cast before combat"). Tek sabit; yaprak modül. 90 ve altı (eski kayıt, replay) aynen.
 */
import type { BattleState } from './types';

export const SHAPE91_VERSION = 91;
export const shape91On = (s: Pick<BattleState, 'kuralSurumu'> | undefined): boolean => (s?.kuralSurumu ?? 1) >= SHAPE91_VERSION;
