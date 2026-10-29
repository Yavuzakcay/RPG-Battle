/** Görev V, V2: sürekli durum efektleri (öncelik, tek efekt + sırayla, ekran bütçesi, ayar), hüzme önceliği, halka ve jeton filtreleri. */
import { describe, it, expect } from 'vitest';
import spriteData from '../../data/efekt-sprites.json';
import mapBattleSrc from '../MapBattle.tsx?raw';
import { BEAM_PRIORITY, ENGEL_SPRITES, MAX_ANIMATED, ROTATE_MS, STATUS_SPRITES, beamFor, filterStyle, loopEffectsFor, placeLoops, rotationIndex, tokenFilters } from './statusFx';
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
  it('öncelik paralyzed > stunned > incapacitated > frightened > charmed > restrained > grappled', () => {
    expect(ids(STATUS_SPRITES)).toEqual(['paralyzed', 'stunned', 'incapacitated', 'frightened', 'charmed', 'restrained', 'grappled']);
    expect(ids(loopEffectsFor(c('a', ['Grappled', 'Charmed', 'Restrained'])))).toEqual(['charmed', 'restrained', 'grappled']);
    expect(ids(loopEffectsFor(c('a', ['Frightened', 'Paralyzed', 'Stunned', 'Grappled'])))).toEqual(['paralyzed', 'stunned', 'frightened', 'grappled']);
    expect(loopEffectsFor(c('a', ['Prone', 'Poisoned']))).toEqual([]);
  });
  it('Incapacitated\'ı içeren durumda ayrıca incapacitated efekti yok', () => {
    expect(ids(loopEffectsFor(c('a', ['Stunned', 'Incapacitated', 'Charmed'])))).toEqual(['stunned', 'charmed']);
    expect(ids(loopEffectsFor(c('a', ['Incapacitated'])))).toEqual(['incapacitated']);
  });
  it('rozetler bütün durumları gösterir', () => {
    const keys = statusIcons(c('a', ['Grappled', 'Charmed', 'Restrained', 'Frightened'])).map((s) => s.key);
    expect(keys).toEqual(expect.arrayContaining(['grappled', 'charmed', 'restrained', 'frightened']));
  });
  it('Görev V2: jetonda tek döngü efekti; birden çok durumda öncelik sırasıyla ROTATE_MS aralıkla döner', () => {
    expect(ROTATE_MS).toBe(2500);
    const t = [c('a', ['Charmed', 'Paralyzed', 'Grappled'])];
    const at = (now: number) => placeLoops(t, { enabled: true, reduceMotion: false, now }).get('a');
    expect(at(0)).toMatchObject({ sprite: { id: 'paralyzed' }, count: 3, animated: true });
    expect(at(ROTATE_MS)?.sprite.id).toBe('charmed');
    expect(at(2 * ROTATE_MS + 100)?.sprite.id).toBe('grappled');
    expect(at(3 * ROTATE_MS)?.sprite.id).toBe('paralyzed');
    expect([rotationIndex(1, 9999, false), rotationIndex(3, ROTATE_MS * 4, true), rotationIndex(0, 0, false)]).toEqual([0, 0, 0]);
  });
  it('ekran bütçesi: en çok MAX_ANIMATED animasyon; aşan statik kare', () => {
    const tokens = Array.from({ length: 11 }, (_, i) => c(`t${i}`, ['Paralyzed', 'Charmed']));
    const placed = [...placeLoops(tokens, { enabled: true, reduceMotion: false }).values()];
    expect(placed).toHaveLength(11);
    expect(placed.filter((p) => p.animated)).toHaveLength(MAX_ANIMATED);
    expect(placed.slice(0, MAX_ANIMATED).every((p) => p.animated)).toBe(true);
  });
  it('efekt ayarı kapalıysa hiç döngü efekti yok; "hareketi azalt"ta statik tek kare ve sıra değişmez', () => {
    const tokens = [c('a', ['Stunned', 'Charmed'])];
    expect(placeLoops(tokens, { enabled: false, reduceMotion: false }).size).toBe(0);
    expect(placeLoops(tokens, { enabled: true, reduceMotion: true, now: ROTATE_MS }).get('a')).toMatchObject({ sprite: { id: 'stunned' }, animated: false });
    expect(placeLoops([c('b', [])], { enabled: true, reduceMotion: false }).size).toBe(0);
  });
  it('tek seferlik hasar efekti oynarken o jetonun döngüsü duraklar', () => {
    const placed = placeLoops([c('a', ['Stunned']), c('b', ['Charmed'])], { enabled: true, reduceMotion: false, paused: new Set(['a']) });
    expect([...placed.keys()]).toEqual(['b']);
  });
});

describe('ışık hüzmesi (Görev V2)', () => {
  it('öncelik: sırası gelen > kurulumda seçili > seçili hedef > seçilmiş > seçilebilir > alan düşman > alan dost', () => {
    expect(BEAM_PRIORITY).toEqual(['turn', 'selected', 'target', 'picked', 'pickable', 'area-foe', 'area-friend']);
    expect(beamFor({ turn: true, target: true, pickable: true })).toBe('turn');
    expect(beamFor({ target: true, picked: true, pickable: true, 'area-foe': true })).toBe('target');
    expect(beamFor({ picked: true, pickable: true })).toBe('picked');
    expect(beamFor({ pickable: true, 'area-friend': true })).toBe('pickable');
    expect(beamFor({ 'area-foe': true, 'area-friend': true })).toBe('area-foe');
    expect(beamFor({ 'area-friend': true })).toBe('area-friend');
    expect(beamFor({})).toBeNull();
  });
  it('halka yalnızca resimsiz jetonda: halka figürle aynı grupta (`.fig ~ .ring` gizler); eski işaret halkaları yok', () => {
    // Vitest CSS'i işlemediği için CSS kuralı ekran görüntüsüyle doğrulandı; burada çizim yapısı denetlenir.
    const tsx = mapBattleSrc;
    expect(tsx).toMatch(/<AvatarCircle[^>]*\/>\s*\{\/\*[^*]*\*\/\}\s*<circle cx=\{p\.x\} cy=\{p\.y\} r=\{r\} className="ring" \/>\s*<\/g>/);
    for (const old of ['className="pick-ring"', 'area-mark']) expect(tsx).not.toContain(old);
    expect(tsx).toContain('className="beams"');
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
