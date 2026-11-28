/**
 * Görev KATALOG-GUC-TAM (kural sürümü 109): save'li canavar saldırısının ikinci hasar türü (`saveEk`: Continent Roar Breath
 * 15d8 kuvvet + 8d8 gök gürültüsü, Continent Judgment Breath, Cosmic Fling, Void-Lightning Strike). Zar bir kez atılır (alan
 * saldırısında bütün hedeflere aynı), başarıda yarı (`halfOnSave`), hedefin direnciyle (`damageEffect`). 108 ve altında boş.
 */
import { rollDice, rollTag, type Rng } from '../rules/dice';
import { gucOf } from './katalog109Data';
import { damageEffect } from './maprules';
import { formMonsterId } from './shapeMonsterCore';
import type { BattleEvent, BattleState, Combatant } from './types';

export interface SaveExtraRoll { type: string; total: number; rolls: number[] }

/** Saldırının ek zarları (yoksa boş). */
export function saveExtraRolls(state: BattleState, actor: Combatant, attackName: string, rng: Rng): SaveExtraRoll[] {
  const parts = gucOf(state, formMonsterId(actor))?.saveEk?.[attackName];
  if (!parts?.length) return [];
  return parts.map((p) => { const r = rollDice(p.dice, rollTag(rng, { kind: 'damage', by: actor.id })); return { type: p.type, total: r.total, rolls: r.rolls }; });
}

/** Ek zarların bir hedefe uygulanması (`target` ana hasardan sonraki HP'siyle; 0 HP'de boş). */
export function saveExtraEvents(target: Combatant, label: string, rolls: SaveExtraRoll[], success: boolean, half: boolean): BattleEvent[] {
  const out: BattleEvent[] = [];
  let hp = target.hp;
  for (const r of rolls) {
    if (hp <= 0) break;
    const amount = success ? (half ? Math.floor(r.total / 2) : 0) : r.total;
    if (amount <= 0) continue;
    const ev = damageEffect({ ...target, hp }, 'katalog109', `${label} (${r.type})`, { dice: String(amount), type: r.type }, () => 0);
    out.push(ev);
    if (ev.type === 'map_effect' && typeof ev.hpAfter === 'number') hp = ev.hpAfter;
  }
  return out;
}
