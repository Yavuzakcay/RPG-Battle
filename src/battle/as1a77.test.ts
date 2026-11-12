/**
 * Görev AS1a (toplu; kural sürümü 77): alt soyun "X hasarına/durumuna karşı kurtarma dezavantajı" ek paket, imza, eşya,
 * harita mekaniği, itme (Cunning Strike Trip), tepki (Hellish Rebuke, bakış) ve boncuk kurtarmalarında da. 76 ve altı aynen
 * (yeni yollar `SaveCtx.genis`; yalnız 77+ savaşın başında `saveDisVsGenis` alan alt soy etkisi bakar).
 */
import { describe, expect, it } from 'vitest';
import { startBattle } from './create';
import { mk } from './fixtures';
import { saveEffect } from './maprules';
import { saveMode } from './durations';
import { ALT_SOY_77_VERSION, saveDisVs } from './altSoySurum';
import { CURRENT_RULES } from './ruleVersion';
import type { ActiveEffect, BattleState, Combatant } from './types';

const RED: ActiveEffect = { id: 'soy:dragonborn/red', name: 'Red', sourceId: 'A', until: 99999, saveDisVs: [{ damage: 'cold' }] } as ActiveEffect;
const HILL: ActiveEffect = { id: 'soy:goliath/hill', name: 'Hill', sourceId: 'A', until: 99999, saveDisVs: [{ condition: 'Prone' }] } as ActiveEffect;
const battle = (ver: number, fx: ActiveEffect): BattleState =>
  startBattle('as1a', 'd-z-zemin', [mk('A', { ownerId: 'p1', effects: [fx] }), mk('B', { side: 'enemies' })], () => 0.5, { kuralSurumu: ver, map: { id: 'col' } }).state;
const A = (s: BattleState) => s.combatants.A as Combatant;

describe('AS1a (77): alt soy kurtarma dezavantajı yeni yollarda', () => {
  it('sabit 77; savaş başında alt soy etkisi 77+ `saveDisVsGenis` alır, 76\'da almaz', () => {
    expect(ALT_SOY_77_VERSION).toBe(77);
    expect(CURRENT_RULES).toBeGreaterThanOrEqual(77);
    expect(A(battle(77, RED)).effects?.find((e) => e.id === RED.id)?.saveDisVsGenis).toBe(true);
    expect(A(battle(76, RED)).effects?.find((e) => e.id === RED.id)?.saveDisVsGenis).toBeUndefined();
  });
  it('genis bağlam yalnız işaretli etkiye işler; eski yollar (genis yok) her ikisinde', () => {
    expect(saveDisVs([RED], { damage: 'cold', genis: true })).toBe(false);
    expect(saveDisVs([{ ...RED, saveDisVsGenis: true }], { damage: 'cold', genis: true })).toBe(true);
    expect(saveDisVs([RED], { damage: 'cold' })).toBe(true);
    expect(saveMode('normal', A(battle(77, RED)), 'con', undefined, { damage: 'cold', genis: true })).toBe('disadvantage');
    expect(saveMode('normal', A(battle(76, RED)), 'con', undefined, { damage: 'cold', genis: true })).toBe('normal');
  });
  it('harita mekaniği (ince buz: soğuk hasar + Prone): Red soğuk, Hill Prone; 76\'da normal', () => {
    const ice = (s: BattleState) => saveEffect(A(s), 'thinIce', 'buz', 'dex', 10, () => 0.5, { hit: { dice: '1d6', type: 'cold' }, onFailCondition: 'Prone' });
    const mode = (s: BattleState) => { const e = ice(s); return e.type === 'map_effect' ? e.roll?.mode : undefined; };
    expect(mode(battle(77, RED))).toBe('disadvantage');
    expect(mode(battle(77, HILL))).toBe('disadvantage');
    expect(mode(battle(76, RED))).toBe('normal');
    expect(mode(battle(76, HILL))).toBe('normal');
  });
});
