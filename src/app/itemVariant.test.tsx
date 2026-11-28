/**
 * GECE-KATALOG-KALAN (yalnız görünüm): eşya görsel varyantları. Varsayılan, "boss yenilince" kuralı (Hex → Hex'in Paladin Zırhı
 * hasarlı), bitmiş savaştan yenilen boss, depo; Dungeondex vitrininde varyant seçici (varyantsız eşyada yok), TR ve EN adlar.
 */
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { bossDefeatsIn, currentVariant, defeatedBosses, itemVariants, markBossesDefeated } from './itemVariant';
import { mk } from '../battle/fixtures';
import { loadMonsters } from '../data';
import { loadDexExtras, type DexExtras } from '../dungeondex/catalog';
import { Dungeondex } from '../screens/Dungeondex';
import { setLang } from '../i18n';
import type { BattleState } from '../battle/types';

const ARMOR = 'kaltakkirans-paladin-armor';
const SWORD = 'kaltakkirans-maw-chain-greatsword';
// Test ortamında localStorage yoksa bellek deposu.
if (typeof (globalThis as { localStorage?: Storage }).localStorage === 'undefined') {
  const m = new Map<string, string>();
  (globalThis as { localStorage?: unknown }).localStorage = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); }, removeItem: (k: string) => { m.delete(k); } };
}
afterEach(() => { localStorage.removeItem('rpg-battle-boss-yenilgi'); });

describe('eşya görsel varyantı', () => {
  it('varsayılan kapalı; Hex yenilince zırh hasarlı, kılıç aynı kalır', () => {
    expect(currentVariant(ARMOR, [])).toBe('kapali');
    expect(currentVariant(ARMOR, ['hex'])).toBe('hasarli');
    expect(currentVariant(SWORD, ['hex'])).toBe('kapali');
    expect(currentVariant('longsword', ['hex'])).toBeNull();
    expect(Object.keys(itemVariants(ARMOR)!.varyantlar)).toEqual(['kapali', 'acik', 'hasarli']);
  });

  it('bitmiş savaşta düşman tarafında yenilen kurallı boss; sürerken ya da dost tarafında değil', () => {
    const boss = mk('H', { side: 'enemies', hp: 0, maxHp: 500, monsterId: 'hex' });
    const st = (status: BattleState['status'], b = boss) => ({ status, combatants: { H: b } }) as unknown as BattleState;
    expect(bossDefeatsIn(st('finished'))).toEqual(['hex']);
    expect(bossDefeatsIn(st('active'))).toEqual([]);
    expect(bossDefeatsIn(st('finished', { ...boss, hp: 10 }))).toEqual([]);
    expect(bossDefeatsIn(st('finished', { ...boss, side: 'party' }))).toEqual([]);
  });

  it('depo: işaretlenen boss kalır, tekrar eklenmez', () => {
    expect(defeatedBosses()).toEqual([]);
    expect(markBossesDefeated(['hex'])).toBe(true);
    expect(markBossesDefeated(['hex'])).toBe(false);
    expect(defeatedBosses()).toEqual(['hex']);
  });
});

describe('Dungeondex varyant seçici', () => {
  let extras: Omit<DexExtras, 'mapNames'>;
  beforeAll(async () => { await loadMonsters(); extras = await loadDexExtras(); });
  const html = (id: string) => renderToStaticMarkup(<Dungeondex onBack={() => {}} extras={extras} initial={{ cat: 'esya', id }} />);

  it('zırhta üç varyant düğmesi (TR), varsayılan seçili; hasarlı Hex yenilince seçili', () => {
    setLang('tr');
    const a = html(ARMOR);
    expect(a).toContain('data-testid="dex-variant"');
    expect(a).toContain('Kapalı');
    expect(a).toContain('Açık (uyanık)');
    expect(a).toContain('Hasarlı');
    expect(a).toMatch(/aria-checked="true"[^>]*>Kapalı/);
    markBossesDefeated(['hex']);
    expect(html(ARMOR)).toMatch(/aria-checked="true"[^>]*>Hasarlı/);
    expect(html(ARMOR)).toContain('kaltakkirans-paladin-armor--hasarli.webp');
  });

  it('EN adlar; varyantsız eşyada seçici yok', () => {
    setLang('en');
    expect(html(SWORD)).toContain('Open (awakened)');
    expect(html('firstblood-shortsword')).not.toContain('dex-variant');
    setLang('tr');
  });
});
