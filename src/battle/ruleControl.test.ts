/**
 * Kuyruk 24: Game Master'ın harita mekaniği anahtarları ve parametreleri (`ruleControl.ts`). Kapalı kural `ruleOf`'ta yok;
 * parametre kurala yazılır; seçim başlangıç durumunda (replay aynı); seçimsiz savaşta durum alanı yazılmaz (eski kayıt aynı);
 * `surum` gerektiren kural eski kural sürümünde çalışmaz.
 */
import { describe, expect, it } from 'vitest';
import { startBattle } from './index';
import { mk, scripted } from './fixtures';
import { ruleOf } from './maprules';
import { controlState, controllableRules, ruleEnabled, setDefaultRuleToggles, validParam, RULE_CONTROL } from './ruleControl';
import type { BattleState } from './types';
import { getMap } from '../map/maps';

const parts = () => [mk('A', { ownerId: 'p1' }), mk('B', { side: 'enemies' })];
const start = (map: Record<string, unknown>, kuralSurumu?: number): BattleState =>
  startBattle('k24', 'col', parts(), scripted([10, 10], [10, 10]), { map: map as { id: string }, ...(kuralSurumu ? { kuralSurumu } : {}) }).state;

describe('harita mekaniği anahtarları (Kuyruk 24)', () => {
  it('seçimsiz savaş: alan yazılmaz, kural açık (eski davranış)', () => {
    const s = start({ id: 'col', variantId: 'gunduz' });
    expect(s.map?.ruleToggles).toBeUndefined();
    expect(s.map?.ruleParams).toBeUndefined();
    expect(ruleOf(s, 'heat')?.dc).toBe(12);
  });
  it('Game Master kapatınca kural yok; parametre kurala yazılır; varsayılana eşit değer yazılmaz', () => {
    const off = start({ id: 'col', variantId: 'gunduz', ruleToggles: { heat: false } });
    expect(off.map?.ruleToggles).toEqual({ heat: false });
    expect(ruleOf(off, 'heat')).toBeUndefined();
    const tuned = start({ id: 'col', variantId: 'gunduz', ruleToggles: { heat: true }, ruleParams: { heat: { dc: 15, damage: '2d4' } } });
    expect(tuned.map?.ruleToggles).toBeUndefined();
    expect(ruleOf(tuned, 'heat')).toMatchObject({ dc: 15, damage: '2d4' });
    expect(controlState('col', 'gunduz', {}, { heat: { dc: 12, damage: 'abc' } })).toEqual({});
  });
  it('sürüm 3 kuralı (rüzgâr) eski kural sürümünde çalışmaz; varsayılanı kapalı kural açılmadıkça yok', () => {
    expect(ruleOf(start({ id: 'col', variantId: 'aksam' }), 'wind')).toMatchObject({ kind: 'sand', dir: 'NE' });
    expect(ruleOf(start({ id: 'col', variantId: 'aksam' }, 2), 'wind')).toBeUndefined();
    expect(ruleOf(start({ id: 'col', variantId: 'aksam', ruleParams: { wind: { dir: 'S' } } }), 'wind')?.dir).toBe('S');
    expect(ruleEnabled({}, 'riverBlocked')).toBe(false);
    expect(ruleEnabled({ ruleToggles: { riverBlocked: true } }, 'riverBlocked')).toBe(true);
  });
  it('simülasyon varsayılanı (--kural-kapali)', () => {
    setDefaultRuleToggles({ sandstorm: false });
    try { expect(ruleOf(start({ id: 'col', variantId: 'aksam' }), 'sandstorm')).toBeUndefined(); } finally { setDefaultRuleToggles({}); }
    expect(ruleOf(start({ id: 'col', variantId: 'aksam' }), 'sandstorm')).toBeTruthy();
  });
  it('mevcut mekanikler denetlenir: sıcak, kum fırtınası, lav kenarı, patlama, lav yükselmesi; parametreler kuralda var', () => {
    for (const id of ['heat', 'sandstorm', 'lavaEdge', 'eruption', 'lavaRise']) expect(RULE_CONTROL[id], id).toBeTruthy();
    expect(controllableRules('volkan', 'normal').map((x) => x.rule.id).sort()).toEqual(expect.arrayContaining(['eruption', 'lavaRise']));
    // Her denetlenen kuralın haritadaki parametresi (varsa) geçerli bir varsayılan.
    for (const m of ['col', 'volkan', 'derinlikler-lav-salonu']) for (const v of getMap(m).variants) for (const { rule, spec } of controllableRules(m, v.id)) {
      for (const p of spec.params) if (rule[p.key] !== undefined) expect(validParam(p, rule[p.key]), `${m}/${v.id} ${rule.id}.${p.key}`).toBe(true);
    }
  });
});
