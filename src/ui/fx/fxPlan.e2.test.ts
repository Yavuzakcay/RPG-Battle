/**
 * Kuyruk E2: E2 sayfalarının kayıtları, büyü bağlamaları (gerçek motordan: büyü olayı → beklenen efekt anahtarı), kalıcı
 * zemin/aura, rozet ve kontur; motor olayına eklenen görsel alanların (`spell_cast.area.shape`/`aim`) replay ve kayıt sonucunu
 * değiştirmediği. Görsel dosyası okunmaz; yalnız adlar (`import.meta.glob`).
 */
import { describe, expect, it } from 'vitest';
import e2 from '../../../data/efekt-e2.json';
import kesim from '../../../data/efekt-kesim.json';
import dogrulama from '../../../data/efekt-e2-dogrulama.json';
import { applyEvents, execute, replay } from '../../battle';
import type { BattleEvent, BattleState, Combatant } from '../../battle/types';
import { P1 } from '../../battle/fixtures';
import { spells } from '../../data';
import { seededRng } from '../../rules/dice';
import { B, FX, SIMGE, SPELL_FX, fxShots, groundFx, simgeSprite, spellSlug, summonSprite, summonTint } from './fxPlan';
import { field, verifyAll, verifyBadges } from './e2Verify';
import { effectIcons } from '../effectsView';
import { filterStyle, outlineColor, tokenFilters } from '../statusFx';

type Rec = { kare: number; sure: number; tur: string; en: number; boy: number; dongu: boolean; kaynak: string; yol: string };
const recs = (e2 as unknown as { efektler: Record<string, Rec> }).efektler;
const sheets = (kesim as unknown as { sayfalar: Record<string, { klasor?: string; satir: number; sutun: number; sutunlar?: number[]; adlar: string[]; kareMs?: number; ikon?: boolean; onek?: string }> }).sayfalar;
const files = new Set(Object.keys(import.meta.glob('../../../public/efekt/*.webp')).map((p) => `efekt/${p.split('/').pop()!.replace(/\.webp$/, '')}`));
const E2_SHEETS = ['buyu-yardimci', 'donusum-kanat', 'duman-ag-kafes', 'gokten-dusen', 'isaret-simgeleri', 'koni-doku', 'mermi', 'patlama-ek', 'sayi-oklari', 'silah-parilti', 'zaman', 'zemin-kutulari'];

describe('Kuyruk E2: içe aktarılan sayfalar', () => {
  it('12 sayfanın kesim kaydı var; şerit kayıtları dosyalı, kare sayısı ızgarayla tutarlı', () => {
    for (const s of E2_SHEETS) expect(sheets[s]?.klasor, s).toBe('efekt');
    expect(Object.keys(recs)).toHaveLength(79); // 52 (E2) + 10 (E4: zemin-ek 6, isin-ek 4) + 12 (E4b: bıçak 2, duvar-ek 3, prizma 2, yerçekimi 2, durum-ek 1, su 2) + 5 (E4c: efekt-eksik)
    for (const [name, r] of Object.entries(recs)) {
      expect(files.has(r.yol), name).toBe(true);
      expect(r.yol).toBe(`efekt/${name}`);
      const sh = sheets[r.kaynak]!;
      const row = sh.adlar.indexOf(name.replace(/^efekt-/, ''));
      const cols = sh.sutunlar?.[row] ?? sh.sutun;
      expect(r.kare, name).toBeGreaterThan(0);
      expect(cols - r.kare, name).toBeLessThanOrEqual(2);
      // Kuyruk E4c: şeride özel kare süresi (`kareMsler`) varsa o geçerli.
      const ad = name.replace(/^efekt-/, '');
      expect(r.sure).toBe(r.kare * ((sh as unknown as { kareMsler?: Record<string, number> }).kareMsler?.[ad] ?? sh.kareMs!));
      expect(FX[name.replace(/^efekt-/, '')]?.file).toBe(`${r.yol}.webp`);
    }
  });
  it('ikon sayfaları: 16 işaret simgesi, 16 sayı oku; hepsi dosyalı', () => {
    expect(Object.keys(SIMGE.isaret ?? {})).toHaveLength(16);
    expect(Object.keys(SIMGE.ok ?? {})).toHaveLength(16);
    for (const g of Object.values(SIMGE)) for (const y of Object.values(g)) expect(files.has(y), y).toBe(true);
  });
  it('bağlama tablolarındaki her sprite/simge kayıtlı', () => {
    for (const [id, f] of Object.entries(SPELL_FX)) {
      if (f.yol === 'isaret') expect(simgeSprite('isaret', f.simge), id).not.toBeNull();
      else expect(FX[f.sprite!], `${id}: ${f.sprite}`).toBeDefined();
      if (f.ek) expect(FX[f.ek], f.ek).toBeDefined();
    }
    const T = B as unknown as { zemin: Record<string, string>; auraBuyu: Record<string, { sprite: string }>; cagirRenk: Record<string, { sprite: string }>;
      koni: Record<string, { sprite: string }>; alanEk: Record<string, string>; rozetBuyu: Record<string, string> };
    for (const v of Object.values(T.zemin)) expect(FX[v], v).toBeDefined();
    for (const v of [...Object.values(T.auraBuyu), ...Object.values(T.cagirRenk), ...Object.values(T.koni)]) expect(FX[v.sprite], v.sprite).toBeDefined();
    for (const v of Object.values(T.alanEk)) expect(FX[v], v).toBeDefined();
    for (const v of Object.values(T.rozetBuyu)) expect(SIMGE.ok?.[v], v).toBe(`efekt/efekt-ok-${v}`);
    // Bağlanan her kimlik gerçek bir büyü (olay etiketi → kimlik dönüşümü bütün büyülerde birebir).
    const ids = new Set(spells.map((s) => s.id));
    for (const id of [...Object.keys(SPELL_FX), ...Object.keys(T.zemin), ...Object.keys(T.auraBuyu), ...Object.keys(T.cagirRenk), ...Object.keys(T.rozetBuyu)]) expect(ids.has(id), id).toBe(true);
    for (const s of spells) expect(spellSlug(s.name)).toBe(s.id);
    expect(spellSlug('Fire Bolt (tekrar)')).toBe('fire-bolt');
    expect(spellSlug("Meteor Swarm: patlama")).toBe('meteor-swarm');
  });
});

describe('Kuyruk E2: büyü → efekt (gerçek motor)', () => {
  it('her bağlı büyü dökülünce beklenen efekt anahtarı çizilir; doğrulama dosyası güncel', () => {
    const v = verifyAll();
    expect(v.filter((x) => !x.ok).map((x) => `${x.id}: ${x.how}`)).toEqual([]);
    expect(Object.keys((dogrulama as { efekt: Record<string, string> }).efekt).sort()).toEqual(v.map((x) => x.id).sort());
  }, 60000);
  it('her rozet büyüsü dökülünce jetonda sayı oku rozeti kalır; doğrulama dosyası güncel', () => {
    const v = verifyBadges();
    expect(v.filter((x) => !x.ok).map((x) => `${x.id}: ${x.how}`)).toEqual([]);
    expect(Object.keys((dogrulama as { rozet: Record<string, string> }).rozet).sort()).toEqual(v.map((x) => x.id).sort());
  }, 60000);
});

const cast = (name: string, extra: Record<string, unknown>) => {
  const sp = spells.find((s) => s.name === name)!;
  const s = field(sp);
  const r = execute(s, { type: 'cast_spell', actorId: 'A', spellName: name, slotLevel: Math.max(1, sp.level), ...extra } as never, P1, seededRng(3));
  if (!r.ok) throw new Error(r.error);
  return { s, events: r.events, after: applyEvents(s, r.events) };
};
const strip = (events: BattleEvent[]): BattleEvent[] => events.map((e) => {
  if (e.type !== 'spell_cast' || !e.area) return e;
  const { shape: _s, aim: _a, ...area } = e.area;
  return { ...e, area };
});

describe('Kuyruk E2: kod maddeleri', () => {
  it('1: çizgi alan ışın (Lightning Bolt → isin-sok), koni doku (Burning Hands → koni-ates); olayda görsel shape/aim', () => {
    const lb = cast('Lightning Bolt', { targetHex: { col: 9, row: 5 } });
    const area = lb.events.find((e): e is Extract<BattleEvent, { type: 'spell_cast' }> => e.type === 'spell_cast')!.area!;
    expect(area.shape).toBe('line');
    expect(area.aim).toEqual({ col: 9, row: 5 });
    const shot = fxShots(lb.events, lb.s).find((x) => x.sprite.id === 'isin-sok')!;
    expect(shot.from).toEqual({ col: 6, row: 5 });
    expect(fxShots(lb.events, lb.s).some((x) => x.sprite.id === 'alan-yildirim')).toBe(false);
    const bh = cast('Burning Hands', { targetId: 'C' });
    expect(fxShots(bh.events, bh.s).find((x) => x.cone)?.sprite.id).toBe('koni-ates');
  });
  it('replay ve kayıt: görsel alanlar durumu değiştirmez (alanlı, alansız ve JSON gidiş-dönüş aynı)', () => {
    for (const [name, extra] of [['Lightning Bolt', { targetHex: { col: 9, row: 5 } }], ['Burning Hands', { targetId: 'C' }], ['Fireball', { targetHex: { col: 9, row: 5 } }]] as const) {
      const { s, events, after } = cast(name, extra);
      expect(events.some((e) => e.type === 'spell_cast' && e.area?.shape)).toBe(true);
      expect(applyEvents(s, strip(events))).toEqual(after);
      expect(applyEvents(s, JSON.parse(JSON.stringify(events)) as BattleEvent[])).toEqual(after);
      const start: BattleEvent = { type: 'battle_started', state: s } as BattleEvent;
      expect(replay([start, ...events])).toEqual(replay([start, ...strip(events)]));
    }
  });
  it('2–3: ışın ve tek hedef darbesi (Ray of Frost → isin-buz; Mind Spike → alan-psisik hedefte)', () => {
    const rf = cast('Ray of Frost', { targetId: 'B' });
    expect(fxShots(rf.events, rf.s).some((x) => x.sprite.id === 'isin-buz' && x.from && x.to)).toBe(true);
    const ms = cast('Mind Spike', { targetId: 'B' });
    expect(fxShots(ms.events, ms.s).find((x) => x.sprite.id === 'alan-psisik')?.targetId).toBe('B');
  });
  it('mermi uçar (Fire Bolt: travel + ton), işaret simgesi ve bağ çizgisi (Hunter\'s Mark)', () => {
    const fb = cast('Fire Bolt', { targetId: 'B' });
    expect(fxShots(fb.events, fb.s).find((x) => x.travel)).toMatchObject({ sprite: { id: 'mermi-kure' }, ton: '#ff8a3a', to: { col: 9, row: 5 } });
    const hm = cast("Hunter's Mark", { targetId: 'B' });
    const shots = fxShots(hm.events, hm.s);
    expect(shots.find((x) => x.sprite.kind === 'isaret')?.targetId).toBe('B');
    expect(shots.some((x) => x.link)).toBe(true);
  });
  it('4: dokunuş darbesi tonu (Shocking Grasp: darbe-buyu + yıldırım tonu)', () => {
    const ev = { type: 'attack_resolved', actorId: 'A', targetId: 'N', label: 'Shocking Grasp', hit: true, critical: false, damageType: 'lightning' } as unknown as BattleEvent;
    expect(fxShots([ev], field(spells[0]!))[0]).toMatchObject({ sprite: { id: 'darbe-buyu' }, ton: (B as unknown as { darbeTon: Record<string, string> }).darbeTon.lightning });
  });
  it('6: Spirit Guardians yayılımı (konsantrasyon) aura olarak çizilir', () => {
    const sg = cast('Spirit Guardians', {});
    expect(groundFx(sg.after).auras.some((a) => a.ownerId === 'A' && a.sprite.id === 'aura-altin' && a.radius === 3)).toBe(true);
  });
  it('7, 9: dirilme ve geçici HP (olay → efekt, aynı jetonda bir kez)', () => {
    const s = field(spells[0]!);
    const life = { type: 'life_restored', targetId: 'F', hpAfter: 1, life: 'alive', label: 'X' } as BattleEvent;
    const temp = { type: 'temp_hp', targetId: 'C', amount: 5, label: 'X' } as BattleEvent;
    const ids = fxShots([life, temp, temp], s).map((x) => `${x.sprite.id}:${x.targetId}`);
    expect(ids).toEqual(['iyilestir-buyuk:F', 'koruma-kutsama:C']);
  });
  it('kalıcı alan zemin dokusu (Spike Growth → zemin-dikenli; Kuyruk E4: eski zemin-diken yerine zemin-ek diken zemini)', () => {
    const sg = cast('Spike Growth', { targetHex: { col: 9, row: 5 } });
    expect(groundFx(sg.after).patches.map((p) => p.sprite.id)).toContain('zemin-dikenli');
  });
  it('11: Faerie Fire konturu jeton filtresinde; 13: rozet sayı oku simgesi', () => {
    const c = { conditions: [], life: 'alive', exhaustion: 0, effects: [{ id: 'x', name: 'Faerie Fire', sourceId: 'A' }] } as unknown as Combatant;
    expect(outlineColor(c)).toBe('#c58cff');
    expect(tokenFilters(c)).toContain('outlined');
    expect(filterStyle(['outlined'], '#c58cff').filter).toContain('drop-shadow');
    const bl = cast('Bless', { targetIds: ['A', 'C'], targetId: 'C' });
    const icons = effectIcons(bl.after, bl.after.combatants.C as Combatant);
    expect(icons.some((x) => x.img?.includes('efekt-ok-zar-arti'))).toBe(true);
  });
  it('12: çağrı portalı tonu (Summon Dragon, Flaming Sphere)', () => {
    expect(summonTint({ summon: { spellId: 'summon-dragon' } } as Combatant)).toBe('#ff7a5a');
    expect(summonSprite({ summon: { spellId: 'flaming-sphere', intangible: true } } as Combatant)?.id).toBe('cagir-ruh');
    expect(summonTint({ summon: { spellId: 'find-familiar' } } as Combatant)).toBeUndefined();
  });
  it('bağlı büyünün alanı genel patlamayla yinelenmez (Call Lightning: yalnız gökten yıldırım)', () => {
    const s = field(spells[0]!) as BattleState;
    const ev = { type: 'spell_cast', actorId: 'A', targetId: null, label: 'Call Lightning', slotLevel: 3, note: '', area: { hexes: [{ col: 9, row: 5 }], damageType: 'lightning', shape: 'cylinder' } } as BattleEvent;
    expect(fxShots([ev], s).map((x) => x.sprite.id)).toEqual(['gokten-yildirim']);
  });
});
