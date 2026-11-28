/**
 * Görev KATALOG-F0 (kural sürümü 107): yarı can fazı (Faz 2). Komut sonu kancası: `faz2` bloğu olan, canlı, henüz faza
 * geçmemiş yaratığın canı ⌊maxHp × eşik⌋'e indiyse bir kez `phase_changed`. Olay çözülmüş değerleri taşır (geçici HP zarı
 * burada atılır); reducer zar atmaz, replay aynı durumu verir. Kodda canavar adıyla koşul yok; blok veriden (canavar
 * kaydı → `combatantFromMonster` kopyası). Tasarım harita/belgeler/KATALOG-F-TASARIM.md §3.
 * - Tek vuruşta 0 HP'ye düşen yaratık faza girmez; biçim değişimindeyse (`shape`) biçim bitene dek bekler.
 * - Saldırı ve hasar eki süresiz etkide zar olarak (`dice` saldırıya, `hitDie` isabete; sabit sayı da zar ifadesidir).
 */
import { gucOf } from './katalog109Data';
import { k109PhaseEvents } from './katalog109Faz';
import { rollDice, rollTag, type Rng } from '../rules/dice';
import type { Faz2Block } from '../data';
import { faz2On } from './faz2Surum';
import { registerCommandEnd } from './turnHooks';
import type { ActiveEffect, BattleEvent, BattleState, Combatant } from './types';

const DEFAULT_ESIK = 0.5;

/** Yaratık şu an faza girmeli mi (eşik dahil; 0 HP'de değil). */
export function faz2Due(c: Combatant): boolean {
  const f = c.faz2;
  if (!f || c.faz === 2 || c.hp <= 0 || c.life === 'dead' || c.summon?.gone || c.shape) return false;
  return c.hp <= Math.floor(c.maxHp * (f.esik ?? DEFAULT_ESIK));
}

const asDice = (v: number | string): string => String(v);
const nonEmpty = (xs: string[] | undefined): string[] | undefined => (xs?.length ? [...xs] : undefined);

/** Faz bloğundan olay (geçici HP burada atılır). */
export function phaseChangedEvent(c: Combatant, f: Faz2Block, rng: Rng, /** Görev KATALOG-GUC-TAM: savaşın kural sürümü. */ k109v = 0): BattleEvent {
  const tempHp = f.geciciCan !== undefined ? Math.max(0, rollDice(asDice(f.geciciCan), rollTag(rng, { by: c.id })).total) : 0;
  const fx: Partial<ActiveEffect> = {
    ...(f.ac ? { ac: f.ac } : {}),
    ...(f.saldiri !== undefined ? { dice: { die: asDice(f.saldiri), sign: 1 as const, on: ['attack' as const] } } : {}),
    ...(f.hasar !== undefined ? { hitDie: asDice(f.hasar), ...(f.hasarTuru ? { hitType: f.hasarTuru } : {}) } : {}),
    ...(nonEmpty(f.direncEkle) ? { resist: nonEmpty(f.direncEkle) } : {}),
    ...(nonEmpty(f.zayiflikEkle) ? { vulnerable: nonEmpty(f.zayiflikEkle) } : {}),
    ...(nonEmpty(f.bagisiklikEkle) ? { immuneDamage: nonEmpty(f.bagisiklikEkle) } : {}),
  };
  const remove = {
    ...(nonEmpty(f.direncKaldir) ? { resistances: nonEmpty(f.direncKaldir) } : {}),
    ...(nonEmpty(f.zayiflikKaldir) ? { vulnerabilities: nonEmpty(f.zayiflikKaldir) } : {}),
    ...(nonEmpty(f.bagisiklikKaldir) ? { immunities: nonEmpty(f.bagisiklikKaldir) } : {}),
  };
  // Görev KATALOG-GUC-TAM (109+): katalog faz eklemeleri (auralar, süren etki alanları, saldırı tekrarı/sırası, ilk efsanevi).
  const k = c.monsterId ? gucOf({ kuralSurumu: k109v }, c.monsterId)?.faz2 : undefined;
  if (k) {
    if (k.auralar?.length) fx.auras = k.auralar;
    Object.assign(fx, k.etki ?? {});
    const kk = { ...((k.etki?.k109 as object) ?? {}), ...(k.tekrar ? { repeat: k.tekrar } : {}), ...(k.oncelik ? { order: k.oncelik } : {}), ...(k.efsaneviOnce ? { legendFirst: k.efsaneviOnce } : {}) };
    if (Object.keys(kk).length) fx.k109 = kk;
  }
  return {
    type: 'phase_changed', targetId: c.id, phase: 2,
    ...(tempHp > 0 ? { tempHp } : {}),
    ...(Object.keys(fx).length ? { effect: { id: `faz2:${c.id}`, name: f.not?.tr ?? 'Faz 2', sourceId: c.id, ...fx } } : {}),
    ...(Object.keys(remove).length ? { remove } : {}),
    ...(f.nefesDoldur ? { rechargeReset: true } : {}),
    ...(f.nefesAlan && f.nefesAlan !== 1 ? { areaScale: f.nefesAlan } : {}),
    ...(f.efsaneviEk ? { legendaryExtra: f.efsaneviEk } : {}),
    ...(f.not ? { note: f.not } : {}),
  };
}

/** Komut sonunda faza giren yaratıkların olayları (sıra: savaşçı sırası). */
export function faz2Events(state: BattleState, rng: Rng): BattleEvent[] {
  if (!faz2On(state)) return [];
  const out: BattleEvent[] = [];
  for (const c of Object.values(state.combatants)) {
    if (!c.faz2 || !faz2Due(c)) continue;
    out.push(phaseChangedEvent(c, c.faz2, rng, state.kuralSurumu ?? 1));
    // Görev KATALOG-GUC-TAM (109+): faz anında harita/çağırma eklemeleri.
    out.push(...k109PhaseEvents(state, c));
  }
  return out;
}

registerCommandEnd((_before, next, _events, _cmd, rng) => faz2Events(next, rng));
