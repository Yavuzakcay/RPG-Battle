/**
 * Görev D2 (kural sürümü 88): savaş sırasında eklenen canavarlar savaş başındakiyle aynı kurulumdan geçer (`monsterSetup.ts`:
 * canavar özellikleri ve yetenekleri) ve çağrı blokları SRD 5.2.1'e göre (`data/summons.json`; eski değerler
 * `data/srd-duzeltme.json` `surum: 88`). Tek sabit; yaprak modül. 87 ve altı (eski kayıt, replay) aynen.
 * 87 Wild Shape (WS87); 85 boş.
 */
import type { BattleState } from './types';

export const SRD_D2_VERSION = 88;
export const srdD2On = (s: Pick<BattleState, 'kuralSurumu'> | undefined): boolean => (s?.kuralSurumu ?? 1) >= SRD_D2_VERSION;
