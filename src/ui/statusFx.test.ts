/** Görev V: sürekli durum efektleri (öncelik, iki efekt sınırı, ekran bütçesi, ayar) ve jeton filtreleri. */
import { describe, it, expect } from 'vitest';
import spriteData from '../../data/efekt-sprites.json';
import { ENGEL_SPRITES, MAX_ANIMATED, STATUS_SPRITES, filterStyle, loopEffectsFor, placeLoops, tokenFilters } from './statusFx';
import { EFFECT_SPRITES, spriteFor, statusIcons } from './damageFloats';
import { mk, setup } from '../battle/fixtures';
import { SAVE_VERSION, restoreSession } from '../app/battleSave';

const effects = (spriteData as { effects: Record<string, { kind: string; loop: boolean; frames: number; size: number; file: string }> }).effects;
const ids = (xs: Array<{ id: string }>) => xs.map((x) => x.id);
const c = (id: string, conditions: string[]) => mk(id, { conditions });

describe('efekt verisi', () => {
  it('hasar efektleri tek seferlik, durum efektleri döngü, engel ayrı tür; kare sayıları', () => {
    for (const id of ['burn', 'poison', 'freeze', 'acid', 'bleed']) expect(effects[id]).toMatchObject({ kind: 'damage', loop: false });
    const frames = Object.fromEntries(STATUS_SPRITES.map((s) => [s.id, s.frames]));
    expect(frames).toEqual({ paralyzed: 8, stunned: 8, incapacitated: 8, frightened: 10, charmed: 10, restrained: 10, grappled: 10 });
    for (const s of STATUS_SPRITES) expect(effects[s.id]).toMatchObject({ kind: 'status', loop: true, size: 128, file: `efektler/${s.id}.webp` });
    const files = Object.keys(import.meta.glob('../../public/efektler/*.webp')).map((p) => `efektler/${p.split('/').pop() ?? ''}`).sort();
    expect(files).toEqual(Object.values(effects).map((e) => e.file).sort());
    expect(ENGEL_SPRITES).toEqual([expect.objectContaining({ id: 'engel-melodi', frames: 7, phases: { appear: [0, 3], loop: [4, 5], break: [6, 6] } })]);
  });
  it('hasar efekti seçimi durum ve engel sprite\'larını görmez (önceden yükleme yalnızca hasar efektleri)', () => {
    expect(ids(EFFECT_SPRITES)).toEqual(['burn', 'poison', 'freeze', 'acid', 'bleed']);
    expect(spriteFor({ condition: 'Paralyzed' })).toBeNull();
    expect(spriteFor({ damageType: 'fire' })?.id).toBe('burn');
  });
});

describe('döngü efektleri', () => {
  it('öncelik paralyzed > stunned > incapacitated > frightened > charmed > restrained > grappled; en çok iki', () => {
    expect(ids(STATUS_SPRITES)).toEqual(['paralyzed', 'stunned', 'incapacitated', 'frightened', 'charmed', 'restrained', 'grappled']);
    expect(ids(loopEffectsFor(c('a', ['Grappled', 'Charmed', 'Restrained'])))).toEqual(['charmed', 'restrained']);
    expect(ids(loopEffectsFor(c('a', ['Frightened', 'Paralyzed', 'Stunned', 'Grappled'])))).toEqual(['paralyzed', 'stunned']);
    expect(loopEffectsFor(c('a', ['Prone', 'Poisoned']))).toEqual([]);
  });
  it('Incapacitated\'ı içeren durumda ayrıca incapacitated efekti yok', () => {
    expect(ids(loopEffectsFor(c('a', ['Stunned', 'Incapacitated', 'Charmed'])))).toEqual(['stunned', 'charmed']);
    expect(ids(loopEffectsFor(c('a', ['Incapacitated'])))).toEqual(['incapacitated']);
  });
  it('fazlası rozetle: rozetler bütün durumları gösterir', () => {
    const keys = statusIcons(c('a', ['Grappled', 'Charmed', 'Restrained', 'Frightened'])).map((s) => s.key);
    expect(keys).toEqual(expect.arrayContaining(['grappled', 'charmed', 'restrained', 'frightened']));
  });
  it('ekran bütçesi: önce her jetonun ilk efekti; aşan statik kare', () => {
    const tokens = Array.from({ length: 6 }, (_, i) => c(`t${i}`, ['Paralyzed', 'Charmed']));
    const placed = placeLoops(tokens, { enabled: true, reduceMotion: false });
    const all = [...placed.values()].flat();
    expect(all).toHaveLength(12);
    expect(all.filter((p) => p.animated)).toHaveLength(MAX_ANIMATED);
    // Altı jetonun ilk efekti (paralyzed) animasyonlu, ikincilerden yalnızca ikisi.
    expect([...placed.values()].every((v) => v[0]?.animated)).toBe(true);
    expect([...placed.values()].filter((v) => v[1]?.animated)).toHaveLength(2);
  });
  it('efekt ayarı kapalıysa hiç döngü efekti yok; "hareketi azalt"ta statik tek kare', () => {
    const tokens = [c('a', ['Stunned'])];
    expect(placeLoops(tokens, { enabled: false, reduceMotion: false }).size).toBe(0);
    expect(placeLoops(tokens, { enabled: true, reduceMotion: true }).get('a')).toEqual([expect.objectContaining({ animated: false })]);
    expect(placeLoops([c('b', [])], { enabled: true, reduceMotion: false }).size).toBe(0);
  });
});

describe('jeton filtreleri', () => {
  it('durum adlarından eşleme', () => {
    expect(tokenFilters(c('a', ['Petrified']))).toEqual(['petrified']);
    expect(tokenFilters(c('a', ['Invisible', 'Prone']))).toEqual(['invisible', 'prone']);
    expect(tokenFilters(c('a', ['Unconscious']))).toEqual(['unconscious']);
    expect(tokenFilters(mk('a', { life: 'dying', hp: 0 }))).toEqual(['unconscious']);
    expect(tokenFilters(c('a', ['Exhaustion 2']))).toEqual(['exhaustion']);
    expect(tokenFilters(mk('a', { summon: { ownerId: 'o', spell: 'Find Steed', level: 2 } as never }))).toEqual(['spirit']);
    expect(tokenFilters(c('a', ['Charmed', 'Grappled']))).toEqual([]);
  });
  it('birleşik görünüm: gri tonlama, saydamlık, küçülme, hayalet', () => {
    expect(filterStyle(['petrified'])).toEqual({ filter: 'grayscale(1) contrast(0.85)', opacity: 1, shrink: 1 });
    expect(filterStyle(['invisible']).opacity).toBe(0.45);
    expect(filterStyle(['prone']).shrink).toBeLessThan(1);
    expect(filterStyle(['unconscious']).filter).toContain('brightness(0.6)');
    expect(filterStyle(['spirit'])).toMatchObject({ opacity: 0.7 });
    expect(filterStyle(['spirit']).filter).toContain('hue-rotate');
    expect(filterStyle(['invisible', 'spirit']).opacity).toBe(0.45);
    expect(filterStyle([])).toEqual({ filter: '', opacity: 1, shrink: 1 });
  });
});

describe('eski kayıtlar', () => {
  it('kayıt sürümü değişmedi (18); eski kayıttaki durumlar efekt ve filtreye dönüşür', () => {
    expect(SAVE_VERSION).toBe(18);
    const state = setup('Düz', { A: { conditions: ['Paralyzed', 'Charmed'] }, B: { conditions: ['Petrified'] } });
    const r = restoreSession(JSON.stringify({ version: 12, savedAt: '', events: [{ type: 'battle_started', state }] }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const cs = r.session.state.combatants;
    expect(ids(loopEffectsFor(cs.A as never))).toEqual(['paralyzed', 'charmed']);
    expect(tokenFilters(cs.B as never)).toEqual(['petrified']);
  });
});
