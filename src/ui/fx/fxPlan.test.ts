/** Görev E1: efekt sprite eşlemesi, ikonlar, olay → efekt bağlama, kalıcı aura/duvar, animasyon bütçesi ve ayarlar. */
import { describe, it, expect } from 'vitest';
import esleme from '../../../data/sprite-esleme.json';
import kesim from '../../../data/efekt-kesim.json';
import mevcut from '../../../data/sprite-mevcut.json';
import mapBattleSrc from '../../MapBattle.tsx?raw';
import layerSrc from './FxLayer.tsx?raw';
import { FX, SCREEN_BUDGET, STATUS_ICON_FILES, TOKEN_BUDGET, allocate, angleDeg, deathShots, fxShots, groundFx, protectionSprite, stillFrame, wallAngle } from './fxPlan';
import { statusIcons } from '../damageFloats';
import { mk, setup } from '../../battle/fixtures';
import type { BattleEvent, BattleState } from '../../battle/types';

type Rec = { kare: number; sure: number; tur: string; karisim: string; yon: string | null; en: number; boy: number; dongu: boolean; kaynak: string };
const recs = (esleme as unknown as { efektler: Record<string, Rec> }).efektler;
const sheets = (kesim as unknown as { sayfalar: Record<string, { satir: number; sutun: number; adlar: string[]; blokSatir?: number; kareMs?: number; ikon?: boolean }> }).sayfalar;
const files = new Set(Object.keys(import.meta.glob('../../../public/sprites/*.webp')).map((p) => p.split('/').pop()!.replace(/\.webp$/, '')));

describe('efekt sprite eşlemesi', () => {
  it('her kayıt: dosya var, kare > 0, süre = kare × kare süresi, ızgarayla tutarlı, screen karışımı', () => {
    expect(Object.keys(recs)).toHaveLength(41);
    for (const [name, r] of Object.entries(recs)) {
      expect(files.has(name), name).toBe(true);
      expect((mevcut as { sprites: string[] }).sprites).toContain(name);
      const sheet = sheets[r.kaynak]!;
      const perName = (sheet.sutun * (sheet.blokSatir ?? 1));
      expect(r.kare, name).toBeGreaterThan(0);
      expect(r.kare, name).toBeLessThanOrEqual(perName);
      // Sondaki boş kareler dışında ızgara tam: en çok 2 kare atılmış.
      expect(perName - r.kare, name).toBeLessThanOrEqual(2);
      expect(r.sure).toBe(r.kare * sheet.kareMs!);
      expect(r.en).toBeGreaterThan(0);
      expect(r.boy).toBeGreaterThan(0);
      expect(r.karisim).toBe('screen');
      expect(sheet.adlar.map((a) => `efekt-${a}`)).toContain(name);
    }
  });
  it('sayfa satırları beklenen sırada; aura 12 kare, vuruşlar tek seferlik, aura/ışın/duvar döngü', () => {
    expect(sheets['kritik-darbe']!.adlar).toEqual(['kritik-vurus', 'darbe-kesik', 'darbe-ezme', 'darbe-delme', 'darbe-buyu']);
    expect(sheets['alan-patlamalari']!.adlar).toEqual(['alan-ates', 'alan-yildirim', 'alan-isik', 'alan-nekrotik', 'alan-psisik', 'alan-kuvvet', 'alan-ses']);
    for (const a of ['altin', 'kirmizi', 'buz']) expect(recs[`efekt-aura-${a}`]).toMatchObject({ kare: 12, dongu: true, tur: 'aura' });
    expect(recs['efekt-itme-toz']!.yon).toBe('sag');
    expect(recs['efekt-kritik-vurus']!.dongu).toBe(false);
    for (const n of ['isin-ates', 'isin-isik', 'isin-sok', 'isin-buz', 'duvar-kuvvet', 'duvar-ates', 'duvar-buz', 'duvar-cizili']) expect(recs[`efekt-${n}`]!.dongu).toBe(true);
    expect(recs['efekt-duvar-cizili']!.kare).toBe(4);
  });
  it('15 durum ikonu, her biri dosyalı', () => {
    expect(Object.keys(STATUS_ICON_FILES)).toEqual(sheets['durum-ikonlari']!.adlar);
    for (const f of Object.values(STATUS_ICON_FILES)) expect(files.has(f.replace(/^sprites\//, '').replace(/\.webp$/, ''))).toBe(true);
    const icons = statusIcons({ ...mk('a', { conditions: ['Grappled', 'Deafened'], exhaustion: 2 }) });
    expect(icons.find((i) => i.key === 'grappled')?.img).toBe('sprites/efekt-ikon-grappled.webp');
    expect(icons.find((i) => i.key === 'deafened')?.img).toBe('sprites/efekt-ikon-deafened.webp');
    expect(icons.find((i) => i.key === 'exhaustion')).toMatchObject({ img: 'sprites/efekt-ikon-exhaustion.webp', count: 2 });
  });
});

describe('olay → efekt', () => {
  const st = (): BattleState => {
    const s = setup();
    s.combatants.A!.pos = { col: 2, row: 2 };
    s.combatants.B!.pos = { col: 3, row: 2 };
    return s;
  };
  const atk = (hit: boolean, critical: boolean, damageType: string) => ({ type: 'attack_resolved', actorId: 'A', targetId: 'B', hit, critical, damageType }) as unknown as BattleEvent;
  const ids = (evs: BattleEvent[], s = st()) => fxShots(evs, s).map((x) => x.sprite.id);

  it('isabet hasar türüne göre darbe, kritikte kritik vuruş, ıskada yok', () => {
    expect(ids([atk(true, false, 'slashing'), atk(true, false, 'bludgeoning'), atk(true, false, 'piercing'), atk(true, false, 'fire')]))
      .toEqual(['darbe-kesik', 'darbe-ezme', 'darbe-delme', 'darbe-buyu']);
    expect(ids([atk(true, true, 'slashing')])).toEqual(['kritik-vurus']);
    expect(ids([atk(false, false, 'slashing')])).toEqual([]);
  });
  it('iyileştirme küçük/büyük, ışınlanma çıkış + giriş, itme yönlü, çarpma, Moral', () => {
    const heal = (amount: number) => ({ type: 'healed', actorId: 'A', targetId: 'B', label: '', amount, targetHpAfter: 10 }) as BattleEvent;
    expect(ids([heal(4), heal(12), heal(0)])).toEqual(['iyilestir-kucuk', 'iyilestir-buyuk']);
    const tp = fxShots([{ type: 'teleported', actorId: 'A', from: { col: 1, row: 1 }, to: { col: 5, row: 1 }, label: '' }], st());
    expect(tp.map((x) => [x.sprite.id, x.at])).toEqual([['isinlan-cikis', { col: 1, row: 1 }], ['isinlan-giris', { col: 5, row: 1 }]]);
    expect(tp[1]!.delay).toBeGreaterThan(tp[0]!.delay);
    const push = fxShots([{ type: 'pushed', targetId: 'B', from: { col: 3, row: 2 }, to: { col: 4, row: 2 }, by: 'A' }], st());
    expect(push[0]).toMatchObject({ sprite: { id: 'itme-toz' }, at: { col: 3, row: 2 } });
    expect(push[0]!.rotate).toBeCloseTo(angleDeg({ col: 3, row: 2 }, { col: 4, row: 2 }));
    const me = (rule: string, text: string) => ({ type: 'map_effect', rule, targetId: 'B', text }) as unknown as BattleEvent;
    expect(ids([me('carpmaHasari', 'çarpma'), me('carpmaHasari', 'nesne çarptı'), me('objectThrow', 'kaya fırlatıldı'), me('lava', 'x')])).toEqual(['carpma-sok', 'carpma-enkaz', 'carpma-enkaz']);
    const moral = (reason: string) => ({ type: 'moral_changed', targetId: 'A', delta: 1, moral: 3, reason }) as unknown as BattleEvent;
    expect(ids([moral('toparlama'), moral('zafer'), moral('dost')])).toEqual(['moral-yeniyol', 'moral-huzur', 'moral-vicdan']);
  });
  it('alan: hasar türüne göre patlama, çizgi alanda ışın; aynı alan iki olayda bir kez', () => {
    const hexes = [{ col: 5, row: 3 }, { col: 5, row: 4 }, { col: 6, row: 3 }];
    const area = (shape: string, damageType: string) => ({ type: 'area_used', actorId: 'A', label: '', shape, sizeFt: 15, hexes, targetIds: [], damageType }) as BattleEvent;
    expect(ids([area('sphere', 'fire')])).toEqual(['alan-ates']);
    expect(ids([area('cone', 'thunder')])).toEqual(['alan-ses']);
    expect(ids([area('sphere', 'cold')])).toEqual([]);
    const line = fxShots([area('line', 'lightning')], st());
    expect(line[0]).toMatchObject({ sprite: { id: 'isin-sok' }, from: { col: 2, row: 2 } });
    const cast = { type: 'spell_cast', actorId: 'A', targetId: null, label: '', slotLevel: 3, note: '', area: { hexes, damageType: 'fire' } } as BattleEvent;
    expect(ids([area('sphere', 'fire'), cast])).toEqual(['alan-ates']);
  });
  it('koruma etkisi (dosta), çağırma türü', () => {
    expect(protectionSprite({ ac: 5 })?.id).toBe('koruma-kalkan');
    expect(protectionSprite({ dice: { die: '1d4', sign: 1, on: ['attack'] } })?.id).toBe('koruma-kutsama');
    expect(protectionSprite({ dice: { die: '1d4', sign: -1, on: ['attack'] } })).toBeNull();
    expect(protectionSprite({ wardedFrom: ['fiend'] })?.id).toBe('koruma-ruh');
    const eff = (sourceId: string) => ({ type: 'effect_added', targetId: 'A', effect: { id: 'x', name: 'Shield of Faith', sourceId, ac: 2 } }) as BattleEvent;
    expect(ids([eff('C'), eff('B')])).toEqual(['koruma-kalkan']);
    const sum = (spellId: string, intangible = false) => ({ type: 'summoned', ownerId: 'A', spell: '', index: 3,
      combatant: mk('S', { pos: { col: 1, row: 1 }, summon: { ownerId: 'A', spellId, intangible } as never }) }) as BattleEvent;
    expect(ids([sum('find-steed'), sum('summon-dragon'), sum('flaming-sphere', true)])).toEqual(['cagir-dogal', 'cagir-portal', 'cagir-ruh']);
  });
  it('ölüm: haritadaki jeton ölünce/0 HP canavar düşünce toz; ölmekte olan karakterde yok', () => {
    const before = st();
    const after = st();
    after.combatants.B!.hp = 0;
    after.combatants.A!.hp = 0; after.combatants.A!.life = 'dying';
    expect(deathShots(before, after).map((x) => [x.sprite.id, x.at])).toEqual([['olum-toz', { col: 3, row: 2 }]]);
  });
});

describe('kalıcı efektler', () => {
  it('aura etkisi ve yaratığa bağlı alan halkası; duvar parçaları eksene göre döner, çizili duvar boyanır', () => {
    const s = setup();
    s.combatants.A!.pos = { col: 2, row: 2 };
    s.combatants.A!.effects = [{ id: 'e', name: 'Aura', sourceId: 'A', aura: { id: 'a', name: 'a', radius: 2, filter: 'enemies', trigger: 'turnStart', effect: { kind: 'damage', dice: '1d6', type: 'cold' } } }];
    s.map = { ...(s.map ?? {}), zones: [
      { id: 'w', spellId: 'barrier:cizili-duvar', name: 'Çizili Duvar', casterId: 'A', side: 'party', dc: 0, slotLevel: 0, hexes: [{ col: 4, row: 1 }, { col: 4, row: 2 }, { col: 4, row: 3 }],
        barrier: { kind: 'cizili-duvar', blocksMove: true, blocksSight: true } },
      { id: 'sg', spellId: 'spirit-guardians', name: 'Spirit Guardians', casterId: 'A', side: 'party', dc: 13, slotLevel: 3, hexes: [], anchorId: 'A', radius: 3 },
    ] } as never;
    const g = groundFx(s);
    expect(g.auras.map((a) => [a.sprite.id, a.radius])).toEqual([['aura-buz', 2], ['aura-altin', 3]]);
    expect(g.walls).toHaveLength(1);
    expect(g.walls[0]).toMatchObject({ sprite: { id: 'duvar-cizili' }, tint: '#8a6d4a' });
    expect(g.walls[0]!.hexes.map((h) => h.rotate)).toEqual([90, 90, 90]);
    // odd-q: tek sütunlar yarım altıgen aşağıda; (2,1)→(3,1) aşağı-sağ 30°, (1,1)→(2,1) yukarı-sağ 150°.
    expect(wallAngle({ col: 2, row: 1 }, [{ col: 2, row: 1 }, { col: 3, row: 1 }])).toBe(30);
    expect(wallAngle({ col: 1, row: 1 }, [{ col: 1, row: 1 }, { col: 2, row: 1 }])).toBe(150);
  });
});

describe('animasyon bütçesi ve ayarlar', () => {
  const reqs = (n: number, token?: (i: number) => string) => Array.from({ length: n }, (_, i) => ({ key: `k${i}`, tokenId: token?.(i) }));
  it('ekranda en çok 12, jeton başına en çok 2; aşan statik', () => {
    expect(SCREEN_BUDGET).toBe(12);
    expect(TOKEN_BUDGET).toBe(2);
    expect(allocate(reqs(20), { enabled: true, reduceMotion: false }).size).toBe(12);
    expect(allocate(reqs(20), { enabled: true, reduceMotion: false, used: 9 }).size).toBe(3);
    expect(allocate(reqs(5, () => 't'), { enabled: true, reduceMotion: false }).size).toBe(2);
    expect(allocate(reqs(5, () => 't'), { enabled: true, reduceMotion: false, tokenUsed: new Map([['t', 1]]) }).size).toBe(1);
  });
  it('efekt animasyonu ayarı kapalıyken ya da hareketi azaltta hiç animasyon yok (tek sabit kare)', () => {
    expect(allocate(reqs(3), { enabled: false, reduceMotion: false }).size).toBe(0);
    expect(allocate(reqs(3), { enabled: true, reduceMotion: true }).size).toBe(0);
    expect(stillFrame(FX['alan-ates']!)).toBe(3);
    // Statik kare animasyonsuz çizilir; savaş ekranı ayarı ve hareketi azaltı efekt katmanına ve durum döngülerine geçirir.
    expect(layerSrc).toContain("transform: `translateX(${-s.w * frame}px)`");
    expect(mapBattleSrc).toContain('reduceMotion: reduceMotion || !fxOn');
    expect(mapBattleSrc).toMatch(/<FxShots[^>]*enabled=\{fxOn\} reduceMotion=\{reduceMotion\}/);
    expect(mapBattleSrc).toMatch(/<FxGround[^>]*enabled=\{fxOn\} reduceMotion=\{reduceMotion\}/);
  });
  it('efekt katmanı tembel parça (savaş ekranı statik içe aktarmaz)', () => {
    expect(mapBattleSrc).toContain("lazy(() => import('./ui/fx/FxLayer')");
    expect(mapBattleSrc).not.toMatch(/^import .*ui\/fx\//m);
  });
});
