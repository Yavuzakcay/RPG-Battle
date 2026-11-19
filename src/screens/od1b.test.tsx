/** Görev OD1B: düşman HP görünürlüğü günlükte, kayıtta; oluşturucu oda bağlamı. */
import { describe, expect, it, afterEach, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { describeEvent } from '../ui/log';
import { logEntries } from '../ui/logEntries';
import { hpFraction, hpModeFor, maskHpText } from '../ui/hpVisibility';
import { setBattleHpVis, setRoomOverlay } from '../oda/active';
import { DEFAULT_KURALLAR, newRoom, normalizeRoom, overlayOf } from '../oda/model';
import { restoreSession, serializeSession } from '../app/battleSave';
import { SCENARIOS, seeded } from '../sim/balance';
import { createMapBattle } from '../app/setup';
import { combatantFromMonster, combatantFromSheet } from '../battle';
import { getMonster } from '../data';
import { DEMO_SHEETS } from '../demo';
import { dispatch } from '../ui/session';
import { mk } from '../battle/fixtures';
import type { BattleEvent, BattleState } from '../battle/types';
import { Builder } from './Builder';
import { newCharacter } from '../rules/builder';
import { OdaKatil } from './OdaScreens';
import { saveRooms } from '../oda/store';
import { alignmentEnabled } from '../app/features';

function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, String(v)); }, removeItem: (k: string) => { m.delete(k); }, clear: () => m.clear(), key: (i: number) => [...m.keys()][i] ?? null, get length() { return m.size; } } as Storage;
}
beforeEach(() => { (globalThis as { localStorage?: Storage }).localStorage = memoryStorage(); });
afterEach(() => { setRoomOverlay(null); setBattleHpVis(null); });

const state = (): BattleState => ({ combatants: { hero: mk('hero', { name: 'Hero', hp: 10, maxHp: 20 }), orc: mk('orc', { name: 'Orc', side: 'enemies', hp: 10, maxHp: 40 }) } } as unknown as BattleState);
const hit = (target: string, after: number): BattleEvent => ({
  type: 'attack_resolved', actorId: target === 'orc' ? 'hero' : 'orc', targetId: target, label: 'Sword', mode: 'normal', reasons: [], d20: [15], natural: 15, total: 19, targetAc: 12,
  hit: true, critical: false, fumble: false, damageRolls: [6], rawDamage: 9, appliedDamage: 9, damageType: 'slashing', damageNote: null, targetHpAfter: after, effects: [],
} as unknown as BattleEvent);
const heal = (target: string, after: number): BattleEvent => ({ type: 'healed', actorId: 'hero', targetId: target, label: 'Cure Wounds', amount: 7, targetHpAfter: after } as unknown as BattleEvent);
const roomWith = (hp: 'gizli' | 'etiket' | 'yuzde' | 'tam') => { const r = newRoom('a', 'A', 'now'); setRoomOverlay(overlayOf({ ...r, ayarlar: { ...r.ayarlar, hpGorunurluk: hp } })); };

describe('OD1B günlük', () => {
  it('Tam: değişiklik yok (sayı görünür)', () => {
    roomWith('tam');
    expect(describeEvent(hit('orc', 10), state())).toContain('hasar 9');
    expect(describeEvent(heal('orc', 17), state())).toContain('7 HP');
  });
  it('Gizli: düşmanda sayısız ("yaralandı", "düştü", "iyileşti"); dostta sayı kalır', () => {
    roomWith('gizli');
    const orc = describeEvent(hit('orc', 10), state());
    expect(orc).toContain('yaralandı'); expect(orc).not.toMatch(/hasar|→ 9|slashing/);
    expect(describeEvent(hit('orc', 0), state())).toContain('düştü');
    const h = describeEvent(heal('orc', 17), state());
    expect(h).toContain('iyileşti'); expect(h).not.toContain('7');
    expect(describeEvent(hit('hero', 1), state())).toContain('hasar 9');
    expect(describeEvent(heal('hero', 17), state())).toContain('7 HP');
  });
  it('Etiket: durum etiketi; Yüzde: yüzde', () => {
    roomWith('etiket');
    expect(describeEvent(hit('orc', 10), state())).toContain('durumu: Ölmek üzere'); // 10/40 = %25
    roomWith('yuzde');
    const y = describeEvent(hit('orc', 10), state());
    expect(y).toContain('kalan can %25'); expect(y).not.toMatch(/hasar/);
    expect(describeEvent(hit('hero', 10), state())).toContain('hasar 9');
  });
  it('ayrıntı açılırı (logEntries) da sayısız; tur başlığı etkilenmez', () => {
    roomWith('gizli');
    const e = logEntries([hit('orc', 10)], state());
    expect(JSON.stringify(e)).not.toMatch(/hasar 9|slashing/);
  });
  it('jeton metni ve çubuk', () => {
    roomWith('gizli');
    const orc = state().combatants.orc!;
    expect(maskHpText('HP 10/40 · AC 12', orc)).toBe('HP gizli · AC 12'.replace('HP gizli', 'HP gizli'));
    expect(hpFraction(orc)).toBeNull();
    expect(hpModeFor(state().combatants.hero)).toBeNull();
    roomWith('yuzde');
    expect(maskHpText('HP 10/40 · AC 12', orc)).toBe('HP 25% · AC 12');
    expect(hpFraction(orc)).toBeCloseTo(0.25);
  });
});

describe('OD1B kayıt ve devam', () => {
  const session = () => {
    const s = SCENARIOS.find((x) => x.id === 'volkan-ejder') as (typeof SCENARIOS)[number];
    const party = Object.values(DEMO_SHEETS).map((sheet, i) => combatantFromSheet(sheet, { id: `pc${i}`, ownerId: `p${i}` }));
    const foes = Object.entries(s.enemies).flatMap(([id, n]) => Array.from({ length: n }, (_, k) => combatantFromMonster(getMonster(id), { id: `${id}-${k}` })));
    const rng = seeded(7);
    return dispatch(createMapBattle([...party, ...foes], { ...(s.map as NonNullable<typeof s.map>), mirrored: false }, rng), { type: 'start_battle' }, rng);
  };
  it('kayıt HP görünürlüğünü taşır, devamda uygulanır; eski kayıtta alan yoksa Tam', () => {
    roomWith('yuzde');
    const text = serializeSession(session());
    expect(JSON.parse(text).hp).toBe('yuzde');
    const r = restoreSession(text);
    expect(r.ok && r.hp).toBe('yuzde');
    const old = JSON.parse(text) as Record<string, unknown>; delete old.hp;
    const r2 = restoreSession(JSON.stringify(old));
    expect(r2.ok && r2.hp).toBe('tam');
    setRoomOverlay(null);
    expect(JSON.parse(serializeSession(session())).hp).toBe('tam');
  });
  it('devamda kayıtlı değer odayı ezer', () => {
    roomWith('tam');
    setBattleHpVis('gizli');
    expect(hpModeFor({ side: 'enemies' })).toBe('gizli');
  });
});

describe('OD1B oluşturucu oda bağlamı', () => {
  const build = () => renderToStaticMarkup(createElement(Builder, { initial: { ...newCharacter('x'), sheet: { ...newCharacter('x').sheet, level: 7 } }, onSave: () => {}, onCancel: () => {} }));
  it('cihaz bağlamında seviye 1–20 aynen, uyarı yok', () => {
    const html = build();
    expect(html).toContain('<option value="20"');
    expect(html).not.toContain('Üst seviye kapalı');
  });
  // 2026-11-19: "Üst seviye" anahtarı kalktı: oda bağlamında da her zaman 1–20, uyarı yok.
  it('oda bağlamında da 1–20; eski oda kaydındaki ustSeviye: false sınırlamaz', () => {
    const eski = normalizeRoom({ ...newRoom('a', 'A', 'now'), ayarlar: { ...newRoom('a', 'A', 'now').ayarlar, kurallar: { ...DEFAULT_KURALLAR, ustSeviye: false } } });
    expect(eski && 'ustSeviye' in eski.ayarlar.kurallar).toBe(false);
    setRoomOverlay(overlayOf(eski!));
    const html = build();
    expect(html).toContain('<option value="20"');
    expect(html).toContain('<option value="7"');
    expect(html).not.toContain('Üst seviye kapalı');
  });
  it('oda kuralları cihaz anahtarına yazılmaz', () => {
    setRoomOverlay(overlayOf(newRoom('a', 'A', 'now', { ...DEFAULT_KURALLAR, hizalanma: true })));
    expect(alignmentEnabled()).toBe(true);
    expect(build()).toContain('<option value="20"');
    setRoomOverlay(null);
    expect(localStorage.getItem('rpg-battle-deneysel')).toBeNull();
  });
  it('Odaya katıl: Karakter oluştur düğmesi', () => {
    saveRooms([newRoom('a', 'Masa', 'now')]);
    const html = renderToStaticMarkup(createElement(OdaKatil, { characters: [], onBack: () => {}, roomId: 'a', onBuild: () => {} }));
    expect(html).toContain('Karakter oluştur');
  });
});
