/** Ses sistemi (Görev S): eşleme verisinin tutarlılığı, Volkan + ejderha kuralı, döngü zamanlaması, ayarlar, zar sesleri. */
import { describe, expect, it } from 'vitest';
import klipler from '../../../data/ses-klipler.json';
import { maps } from '../../map/maps';
import { SCENARIOS, seeded, setupBattle } from '../../sim/balance';
import { emitDiceSound, onDiceSound } from '../diceSound';
import { SoundEngine } from './engine';
import {
  DEFAULT_SETTINGS, DICE_CLIPS, SCREEN_SOUND, SETTINGS_KEY, SOUND, battleScene, channelGain, diceGroups, effectiveCrossfade, equalPower,
  fadeCurve, loadSoundSettings, loopStarts, mapSound, menuTrack, pickClip, saveSoundSettings, type SoundContext,
} from './soundPlan';
import { battleSoundScene, menuScene } from './sound';

/** public/ses altındaki dosyaların adları (yalnızca adlar; dosyalar yüklenmez). */
const onDisk = new Set(Object.keys(import.meta.glob('../../../public/ses/*.mp3')).map((p) => p.replace(/^.*\/(.+)\.mp3$/, '$1')));
const ctx = (p: Partial<SoundContext>): SoundContext => ({ mapId: 'volkan', variantId: 'normal', enemyMonsterIds: [], dragonSetup: false, ...p });

describe('eşleme verisi (data/ses.json)', () => {
  it('üretilen her dosya diskte; manifest ile public/ses aynı', () => {
    expect([...onDisk].sort()).toEqual(Object.keys(klipler.files).sort());
  });
  it('her haritanın her varyantı eşli; her ortam ve müzik dosyası var; ortam yoksa "sessiz" işaretli', () => {
    for (const m of maps) {
      for (const v of m.variants) {
        const s = mapSound(m.id, v.id);
        expect(s.silent, `${m.id}/${v.id}`).toBeUndefined();
        expect(s.ambient.length, `${m.id}/${v.id}`).toBeGreaterThan(0);
        for (const a of s.ambient) expect(onDisk.has(a), a).toBe(true);
      }
    }
    for (const [mapId, vs] of Object.entries(SOUND.maps)) {
      for (const [vid, s] of Object.entries(vs)) {
        if (s.ambient.length === 0) expect(s.silent, `${mapId}/${vid}`).toBeTruthy();
        for (const a of s.ambient) expect(onDisk.has(a), a).toBe(true);
      }
    }
    for (const f of [...Object.values(SOUND.music), ...Object.values(SOUND.menu)]) expect(onDisk.has(f), f).toBe(true);
    for (const g of Object.values(SOUND.dice)) {
      expect(DICE_CLIPS[g]?.length, g).toBeGreaterThan(0);
      for (const c of DICE_CLIPS[g] ?? []) expect(onDisk.has(c), c).toBe(true);
    }
    // Eşlemede yalnızca oyundaki haritalar var; eşlemesi olmayan (haritasız savaş) hata vermez, sessiz kalır.
    expect(Object.keys(SOUND.maps).sort()).toEqual(maps.map((m) => m.id).sort());
    expect(mapSound('', '')).toMatchObject({ ambient: [], music: 'gunduz' });
    expect(mapSound('', '').silent).toBeTruthy();
  });
  it('varsayılan müzik: gündüz ve gece parçaları görevdeki listeye göre', () => {
    const music = (m: string, v: string) => mapSound(m, v).music;
    const day = [['col', 'gunduz'], ['volkan', 'normal'], ['ada', 'gunes'], ['dag', 'yaz'], ['gemi', 'gunes'], ['kale', 'gunduz'],
      ['orman', 'orman'], ['sehir-meydani', 'gun'], ['taverna', 'ic-mekan']];
    const night = [['col', 'aksam'], ['ada', 'firtina'], ['bataklik', 'bataklik'], ['dag', 'kis'], ['dungeon', 'mesale'], ['dungeon', 'merdiven'],
      ['dungeon', 'hazine'], ['gemi', 'firtina'], ['kale', 'gece'], ['magara', 'magara'], ['orman', 'gece'], ['sehir-meydani', 'gece']];
    for (const [m, v] of day) expect(music(m as string, v as string), `${m}/${v}`).toBe('gunduz');
    for (const [m, v] of night) expect(music(m as string, v as string), `${m}/${v}`).toBe('gece');
    expect(menuTrack('light')).toBe('menu-light');
    expect(menuTrack('dark')).toBe('menu-dark');
  });
});

describe('Volkan + ejderha kuralı', () => {
  it('ejderha yoksa gündüz; uyuyan ejderha ayarı ya da ejderha düşmanı varsa gece', () => {
    expect(battleScene(ctx({})).music).toBe('muzik-savas-gunduz');
    expect(battleScene(ctx({ variantId: 'uyuyan-ejderha', dragonSetup: true }))).toMatchObject({ music: 'muzik-savas-gece', rule: 'volkan-ejderha' });
    expect(battleScene(ctx({ enemyMonsterIds: ['wyvern', 'young-red-dragon'] })).music).toBe('muzik-savas-gece');
    expect(battleScene(ctx({ enemyMonsterIds: ['red-dragon-wyrmling'] })).music).toBe('muzik-savas-gece');
    expect(battleScene(ctx({ enemyMonsterIds: ['hell-hound', 'imp'] })).music).toBe('muzik-savas-gunduz');
    // Kural yalnızca Volkan'da: Çöl gündüzde ejderha gündüz müziğini değiştirmez.
    expect(battleScene(ctx({ mapId: 'col', variantId: 'gunduz', enemyMonsterIds: ['young-blue-dragon'] })).music).toBe('muzik-savas-gunduz');
  });
  it('gerçek savaş durumundan: uyuyan ejderha senaryosu gece, Volkan normal gündüz; savaş ekranında yerleşimde de çalar', () => {
    const sc = (id: string) => SCENARIOS.find((s) => s.id === id) as (typeof SCENARIOS)[number];
    const ejder = setupBattle(sc('volkan-ejder'), seeded(1));
    expect(battleSoundScene(ejder)).toMatchObject({ music: 'muzik-savas-gece', ambient: ['ortam-volkan-a', 'ortam-volkan-b'] });
    expect(battleSoundScene(setupBattle(sc('volkan'), seeded(1))).music).toBe('muzik-savas-gunduz');
    // Savaş ekranına girmek (yerleşim aşaması ya da kayıttan yükleme) ortamı ve müziği başlatır.
    expect(battleSoundScene({ ...ejder, status: 'setup' })).toMatchObject({ music: 'muzik-savas-gece', ambient: ['ortam-volkan-a', 'ortam-volkan-b'] });
    expect(menuScene('dark')).toMatchObject({ music: 'menu-dark', ambient: [], musicLevel: 'menu' });
  });
  it('kurulum ekranında ortam sesi yok: savaş dışındaki her ekran yalnızca menü müziği (Görev T)', () => {
    expect(SCREEN_SOUND.gm).toBe('menu');
    for (const [screen, kind] of Object.entries(SCREEN_SOUND)) expect(kind, screen).toBe(screen === 'battle' ? 'battle' : 'menu');
    for (const theme of ['light', 'dark'] as const) expect(menuScene(theme).ambient).toEqual([]);
  });
});

describe('döngü ve çapraz geçiş (saf)', () => {
  it('eşit güç: giden ve gelen kazançların kareleri toplamı 1', () => {
    for (const x of [0, 0.1, 0.25, 0.5, 0.9, 1]) {
      const g = equalPower(x);
      expect(g.out ** 2 + g.in ** 2).toBeCloseTo(1, 10);
    }
    expect(equalPower(0)).toEqual({ out: 1, in: 0 });
    const c = fadeCurve('in', 5);
    expect(c[0]).toBe(0);
    expect(c[4]).toBeCloseTo(1, 6);
  });
  it('döngü kopyaları çapraz geçiş kadar üst üste biner; kısa klipte geçiş yarıya iner', () => {
    expect(loopStarts(13, 2.5, 0, 40)).toEqual([0, 10.5, 21, 31.5]);
    expect(effectiveCrossfade(3, 2.5)).toBe(1.5);
    expect(loopStarts(3, 2.5, 5, 9)).toEqual([5, 6.5, 8]);
    // a ve b klipleri farklı uzunlukta: dikişleri aynı ana denk gelmez.
    const a = loopStarts(13.24, 2.5, 0, 60);
    const b = loopStarts(13.61, 2.5, 0, 60);
    expect(a.slice(1).some((t) => b.includes(t))).toBe(false);
  });
});

describe('ayarlar', () => {
  const memory = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); }, m }; };
  it('kaydedilir ve geri okunur; bozuk ya da eksik kayıt varsayılana düşer, değerler 0–1', () => {
    const s = memory();
    expect(loadSoundSettings(s)).toEqual(DEFAULT_SETTINGS);
    const v = { volume: { master: 0.5, ambient: 0.3, music: 0, effects: 1 }, muted: { master: false, ambient: false, music: true, effects: false } };
    saveSoundSettings(v, s);
    expect(loadSoundSettings(s)).toEqual(v);
    s.setItem(SETTINGS_KEY, '{bozuk');
    expect(loadSoundSettings(s)).toEqual(DEFAULT_SETTINGS);
    s.setItem(SETTINGS_KEY, JSON.stringify({ volume: { master: 7 } }));
    expect(loadSoundSettings(s).volume).toEqual({ ...DEFAULT_SETTINGS.volume, master: 1 });
  });
  it('kanal kazancı: kaydırıcı × seviye (dB); kapatılan kanal sessiz', () => {
    expect(channelGain(DEFAULT_SETTINGS, 'music', SOUND.levels.musicDb)).toBeCloseTo(10 ** (SOUND.levels.musicDb / 20), 6);
    expect(channelGain({ ...DEFAULT_SETTINGS, muted: { ...DEFAULT_SETTINGS.muted, effects: true } }, 'effects')).toBe(0);
    // Varsayılan oranlar: müzik ortamın altında, efekt ortamdan az değil.
    expect(SOUND.levels.musicDb).toBeLessThan(SOUND.levels.ambientDb);
    expect(SOUND.levels.effectsDb).toBeGreaterThanOrEqual(SOUND.levels.ambientDb);
  });
});

describe('zar sesleri', () => {
  it('olay → grup: atışta tekli/çoklu, sekmede sekme, durmada dur (+ doğal 20 kritik, doğal 1 kritik hata)', () => {
    expect(diceGroups({ type: 'throw', count: 1 })).toEqual(['single']);
    expect(diceGroups({ type: 'throw', count: 3 })).toEqual(['multi']);
    expect(diceGroups({ type: 'bounce' })).toEqual(['bounce']);
    expect(diceGroups({ type: 'settle', crit: true, fumble: false })).toEqual(['settle', 'crit']);
    expect(diceGroups({ type: 'settle', crit: false, fumble: true })).toEqual(['settle', 'fumble']);
  });
  it('klip rastgele seçilir ve art arda aynı klip gelmez (grupta birden çok klip varsa)', () => {
    let last: string | undefined;
    const seen = new Set<string>();
    let rnd = 0;
    for (let i = 0; i < 50; i++) {
      const c = pickClip('settle', last, () => (rnd = (rnd + 0.37) % 1));
      expect(c).not.toBe(last);
      seen.add(c as string);
      last = c ?? undefined;
    }
    expect(seen.size).toBeGreaterThan(3);
    expect(pickClip('crit', 'zar-kritik-1', () => 0.5)).toBe('zar-kritik-1'); // tek klip: tekrar olabilir
  });
  it('motor zar olaylarını dinler: atış, sekme ve durma kliplerini çalar', () => {
    const engine = new SoundEngine();
    const played: string[] = [];
    engine.playEffect = (name: string) => { played.push(name); };
    engine.dice({ type: 'throw', sides: 20, count: 2 });
    engine.dice({ type: 'bounce', sides: 20, strength: 1 });
    engine.dice({ type: 'settle', sides: 20, crit: true, fumble: false });
    expect(played.map((p) => p.replace(/-\d+$/, ''))).toEqual(['zar-coklu', 'zar-sekme', 'zar-dur', 'zar-kritik']);
    // Yayın kanalı: zar olayı motorun dice() yöntemine ulaşır (sound.tsx dinleyicisi bağlıyken).
    const heard: string[] = [];
    const engine2 = new SoundEngine();
    engine2.playEffect = (name: string) => { heard.push(name); };
    const off = onDiceSound((e) => engine2.dice(e));
    emitDiceSound({ type: 'throw', sides: 6, count: 1 });
    off();
    expect(heard.map((p) => p.replace(/-\d+$/, ''))).toEqual(['zar-tekli']);
  });
});
