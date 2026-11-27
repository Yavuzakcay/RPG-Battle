/**
 * Görev KATALOG-F2 / KATALOG-F2-DUZELT: Kadim Yaratıklar ve mücevher ejderhaları (`data/canavarlar-kadim.json`,
 * `scripts/katalog-f2-kadim.mjs`; tek kaynak `harita/belgeler/KATALOG-F2-OZELLIKLER.md`). Mühür Ruhu ile aynı katalog dizisi
 * (`katalogMonsters`), kayıt şeması, belge sayıları (CR/AC/HP, nefes DC/zar, hızlar), TR/EN açıklamalar, yasaklı ad taraması,
 * efsanevi eylem ve Faz 2 bağları, 19 altıgen sığma, Dragon of Hexonia yön ve gizli varyant, yükleyici ve `getMonster`.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { attackRiders, getMonster, kadimMonsters, katalogMonsters, loadMonsters, monsters, type Monster } from './index';
import { looksEnglish, looksTurkish } from './aciklamaDil';
import { faz2Errors } from '../rules/faz2Schema';
import { fits, hexCount } from '../rules/footprint';
import { combatantFromMonster } from '../battle/create';
import { MULTIHEX_GARGANTUAN_MIN } from '../app/setup';
import kadimJson from '../../data/canavarlar-kadim.json';
import trJson from '../../data/aciklamalar-tr-canavar.json';
import enJson from '../../data/aciklamalar-en-canavar.json';
import efsanevi from '../../data/efsanevi.json';
import bossGorsel from '../../data/boss-gorsel.json';

interface Kadim {
  hatlar: Record<string, { hasar: string; kimlikler: string[] }>;
  dexGizli: string[];
  canavarlar: Monster[];
  dex: Record<string, { type: string; alignment: string; conditionImmunities: string[]; yon?: string; gizli?: boolean; tirmanma?: number; suzulme?: boolean }>;
  yer: Record<string, { tema: string; ortam: string[] }>;
  ozellikler: Record<string, Array<{ anahtar: string; ad: string; tur: string }>>;
}
const K = kadimJson as unknown as Kadim;
const TR = (trJson as unknown as { canavar: Record<string, string> }).canavar;
const EN = (enJson as unknown as { canavar: Record<string, string> }).canavar;
const EF = (efsanevi as unknown as { monsters: Record<string, { uses: number; actions: Array<{ id: string; kind: string; attack?: string; damageType?: string }> }> }).monsters;

/** Belgedeki sayılar (KATALOG-F2-OZELLIKLER.md; mücevher evreleri §6 tablosu, Yavru dahil). */
const DOC: Record<string, { cr: string; ac: number; hp: number; size: string }> = {
  'tutsak-dragon': { cr: '30', ac: 24, hp: 697, size: 'G' },
  'dragon-of-hexonia-a': { cr: '40', ac: 30, hp: 2500, size: 'G' },
  'dragon-of-hexonia-b': { cr: '40', ac: 30, hp: 2500, size: 'G' },
  'kozmik-anka': { cr: '32', ac: 26, hp: 780, size: 'H' },
  'kozmik-anka-savas': { cr: '32', ac: 26, hp: 780, size: 'H' },
  'ember-egg': { cr: '0', ac: 22, hp: 150, size: 'M' },
  'ocean-nightmare': { cr: '30', ac: 24, hp: 700, size: 'G' },
  'ocean-nightmare-open-sea': { cr: '30', ac: 24, hp: 600, size: 'G' },
  'titan-of-nightmare': { cr: '35', ac: 26, hp: 1150, size: 'G' },
  // KATALOG-DENGE-DUZELT: Genç HP'si DMG bandının alt sınırı, nefes zarı tur hasarı hedefine göre (belge tablosundan sapar; DECISIONS.md).
  sigmlet: { cr: '5', ac: 16, hp: 120, size: 'M' }, sigmyr: { cr: '16', ac: 19, hp: 296, size: 'L' }, sigmadrake: { cr: '25', ac: 22, hp: 480, size: 'H' },
  omeglet: { cr: '6', ac: 16, hp: 135, size: 'M' }, omegyr: { cr: '17', ac: 19, hp: 311, size: 'L' }, omegadrake: { cr: '26', ac: 23, hp: 515, size: 'H' },
  deltlet: { cr: '6', ac: 17, hp: 140, size: 'M' }, deltyr: { cr: '18', ac: 20, hp: 326, size: 'L' }, deltadrake: { cr: '27', ac: 23, hp: 545, size: 'H' },
  alphlet: { cr: '7', ac: 17, hp: 155, size: 'M' }, alphyr: { cr: '19', ac: 20, hp: 341, size: 'L' }, alphadrake: { cr: '28', ac: 24, hp: 585, size: 'H' },
  gamlet: { cr: '8', ac: 18, hp: 175, size: 'M' }, gammyr: { cr: '20', ac: 21, hp: 356, size: 'L' }, gammadrake: { cr: '30', ac: 25, hp: 650, size: 'H' },
};
/** Nefes: kurtarma yeteneği, DC, zar, koni (ft). */
const BREATH: Record<string, [string, number, string, number]> = {
  sigmlet: ['con', 15, '6d8', 30], sigmyr: ['con', 19, '14d8', 60], sigmadrake: ['con', 23, '16d10', 90],
  omeglet: ['con', 15, '7d8', 30], omegyr: ['con', 20, '15d8', 60], omegadrake: ['con', 24, '17d10', 90],
  deltlet: ['int', 15, '7d8', 30], deltyr: ['int', 20, '16d8', 60], deltadrake: ['int', 24, '18d10', 90],
  alphlet: ['con', 16, '8d8', 30], alphyr: ['con', 21, '17d8', 60], alphadrake: ['con', 25, '19d10', 90],
  gamlet: ['str', 16, '8d8', 30], gammyr: ['str', 22, '17d8', 60], gammadrake: ['str', 26, '20d10', 90],
};
/** Hızlar (ft): yürüme, uçuş, yüzme, tırmanma (Yavru / Genç / Yetişkin). */
const SPEED: Record<string, [number, number | undefined, number | undefined, number | undefined]> = {
  alphlet: [20, undefined, 60, undefined], alphyr: [30, undefined, 80, undefined], alphadrake: [30, undefined, 90, undefined],
  omeglet: [40, undefined, undefined, 30], omegyr: [40, undefined, undefined, 40], omegadrake: [50, undefined, undefined, 40],
  deltlet: [30, 60, undefined, undefined], deltyr: [30, 80, undefined, undefined], deltadrake: [30, 100, undefined, undefined],
  sigmlet: [30, 60, undefined, undefined], sigmyr: [40, 80, undefined, undefined], sigmadrake: [40, 80, undefined, undefined],
  gamlet: [30, 60, undefined, undefined], gammyr: [40, 80, undefined, undefined], gammadrake: [40, 80, undefined, undefined],
};
/** Veride, açıklamada ve efsanevi kayıtta geçmeyen adlar (görev: yasaklı adlar; taş adları; eski ad Continent Dragon). */
const PROTECTED = [/Thangorodrim/i, /Zettaflare/i, /Ancalagon/i, /Placidusax/i, /Bahamut/i, /Tiamat/i, /Cthulhu/i, /Yıldız-Kâbusu/i, /Star-Nightmare/i, /Kraken/i,
  /Jewel Dragon/i, /Gem Dragon/i, /Continent Dragon/i, /Mücevher Ejderhası/i,
  /Sapphire/i, /Emerald/i, /Amethyst/i, /Topaz/i, /Ruby/i, /Crystal Dragon/i, /Safir/i, /Zümrüt/i, /Ametist/i, /Yakut/i, /Kristal Ejderha/i];
const MONSTER_KEYS = new Set(['id', 'faz2', 'creatureType', 'swim', 'kaynak', 'riders', 'name', 'initiative', 'srdPage', 'egitimli', 'size', 'ac', 'hp', 'speed', 'fly',
  'avatar', 'jetonOlcek', 'abilities', 'saves', 'skills', 'darkvision', 'bonusActions', 'cr', 'attacks', 'traits', 'packTactics', 'undeadFortitude', 'multiattack',
  'regeneration', 'resistances', 'immunities', 'vulnerabilities', 'unsupported']);
const ATTACK_KEYS = new Set(['name', 'bonusAction', 'bonus', 'damage', 'recharge', 'repeat', 'damageDice', 'damageType', 'save', 'rider', 'ranged', 'reachFt', 'range', 'area']);
const DAMAGE = ['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder'];
const ids = () => K.canavarlar.map((m) => m.id);
const kadimKeys = () => Object.keys(TR).filter((k) => K.dex[k.split('/')[0]!]);

beforeAll(async () => { await loadMonsters(); });

describe('KATALOG-F2: kadim yaratık kayıtları', () => {
  it('24 kayıt (9 kadim + 15 mücevher), kebab-case tekil kimlik; Mühür Ruhu ile aynı katalog dizisi; SRD 330 ve Mühür Ruhu araması bozulmadı', () => {
    expect(K.canavarlar).toHaveLength(24);
    expect(kadimMonsters().map((m) => m.id)).toEqual(ids());
    expect(monsters).toHaveLength(330);
    expect(katalogMonsters.filter((m) => m.kaynak === 'katalog-1')).toHaveLength(30);
    expect(katalogMonsters).toHaveLength(30 + 24);
    // SRD ve Mühür Ruhu araması (birleşmeden sonra).
    expect(getMonster('goblin-warrior').id).toBe('goblin-warrior');
    expect(getMonster('kraken').name).toBe('Kraken');
    expect(getMonster('cimbombom').kaynak).toBe('katalog-1');
    expect(() => getMonster('continent-dragon')).toThrow();
    expect(new Set(ids()).size).toBe(24);
    for (const id of ids()) {
      expect(id, id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(monsters.some((m) => m.id === id), id).toBe(false);
      expect(getMonster(id).kaynak).toBe('katalog-f2');
    }
    for (const t of ['dex', 'yer', 'ozellikler'] as const) expect(Object.keys(K[t]).sort()).toEqual([...ids()].sort());
  });
  // GORSEL-MUCEVHER-EJDERHA / KATALOG-DEX-DENGE-HAZIRLIK: görsel `data/boss-gorsel.json` `mucevher` ve `kadim` bölümlerinden
  // (`avatar`; Ocean-Nightmare açık deniz fazı Ocean-Nightmare görselini paylaşır); görseli olmayan (Ember Egg) kayıtta yok.
  it('şema: yalnız Monster alanları; yetenekler, boyut, saldırılar ve ekler geçerli; görsel boss-gorsel.json\'dan', () => {
    const BG = bossGorsel as unknown as { mucevher: Record<string, { dosya: string }>; kadim: Record<string, { dosya: string }> };
    const dosya = (id: string) => (BG.mucevher[id] ?? BG.kadim[id])?.dosya;
    for (const m of K.canavarlar) {
      for (const k of Object.keys(m)) expect(MONSTER_KEYS.has(k), `${m.id}.${k}`).toBe(true);
      expect(m.avatar, m.id).toBe(dosya(m.id));
      expect(['T', 'S', 'M', 'L', 'H', 'G']).toContain(m.size);
      expect(Object.keys(m.abilities).sort()).toEqual(['cha', 'con', 'dex', 'int', 'str', 'wis']);
      for (const v of Object.values(m.abilities)) expect(v >= 1 && v <= 36).toBe(true);
      expect(['dragon', 'celestial', 'monstrosity', 'aberration']).toContain(m.creatureType);
      for (const t of [...(m.immunities ?? []), ...(m.resistances ?? []), ...(m.vulnerabilities ?? [])]) expect(DAMAGE, `${m.id}: ${t}`).toContain(t);
      for (const a of m.attacks) {
        for (const k of Object.keys(a)) expect(ATTACK_KEYS.has(k), `${m.id}/${a.name}.${k}`).toBe(true);
        if (a.damageType) expect(DAMAGE).toContain(a.damageType);
        if (a.save) expect(a.bonus).toBe(0);
        else expect(a.bonus).toBeGreaterThan(0);
      }
      for (const atk of Object.keys(m.riders ?? {})) {
        expect(m.attacks.some((a) => a.name === atk), `${m.id}:${atk}`).toBe(true);
        expect(attackRiders[`${m.id}:${atk}`], `${m.id}:${atk}`).toBeDefined();
      }
    }
  });
  it('belge sayıları: CR, AC, HP, boyut; mücevher nefesi ve hızlar; Faz 2 blokları; varyantlar', () => {
    expect(Object.keys(DOC).sort()).toEqual([...ids()].sort());
    for (const [id, p] of Object.entries(DOC)) {
      const m = getMonster(id);
      expect({ cr: m.cr, ac: m.ac, hp: m.hp, size: m.size }, id).toEqual(p);
    }
    for (const [id, [ab, dc, dice, cone]] of Object.entries(BREATH)) {
      const b = getMonster(id).attacks.find((a) => a.save)!;
      expect([b.save!.ability, b.save!.dc, b.damageDice, b.area?.sizeFt], id).toEqual([ab, dc, dice, cone]);
    }
    for (const [id, [walk, fly, swim, climb]] of Object.entries(SPEED)) {
      const m = getMonster(id);
      expect([m.speed, m.fly, m.swim, K.dex[id]!.tirmanma], id).toEqual([walk, fly, swim, climb]);
    }
    expect(['deltlet', 'deltyr', 'deltadrake'].every((id) => K.dex[id]!.suzulme)).toBe(true);
    expect(getMonster('kozmik-anka').faz2?.geciciCan).toBe(450);
    expect(getMonster('titan-of-nightmare').faz2).toMatchObject({ esik: 0.5 });
    expect(getMonster('titan-of-nightmare').faz2?.geciciCan).toBeUndefined();
    expect(getMonster('ocean-nightmare').faz2).toBeUndefined();
    for (const m of K.canavarlar) if (m.faz2) expect(faz2Errors(m.faz2, m.id)).toEqual([]);
    // -savas varyantı kozmik-anka ile aynı değerler; Hexonia a/b aynı değerler, yön a sağa, b sola; gizli varyantlar.
    // Görsel (`avatar`) varyanta göre ayrı (Anka savaş biçimi, Hexonia b aynalı); değerler aynı.
    const strip = (id: string) => { const { id: _i, unsupported: _u, avatar: _a, ...rest } = getMonster(id); return rest; };
    expect(strip('kozmik-anka-savas')).toEqual(strip('kozmik-anka'));
    expect(strip('dragon-of-hexonia-b')).toEqual(strip('dragon-of-hexonia-a'));
    expect([K.dex['dragon-of-hexonia-a']!.yon, K.dex['dragon-of-hexonia-b']!.yon]).toEqual(['sag', 'sol']);
    expect([...K.dexGizli].sort()).toEqual(['dragon-of-hexonia-b', 'kozmik-anka-savas']);
  });
  it('19 altıgen sığma: Gargantuan kayıtlar 19 altıgen ve 21×11 haritaya sığar; hiçbir kayıt 19 altıgeni aşmaz', () => {
    for (const m of K.canavarlar) {
      const n = hexCount(m.size ?? 'M');
      expect(n, m.id).toBeLessThanOrEqual(19);
      if (m.size === 'G') {
        expect(n).toBe(19);
        expect(fits({ col: 10, row: 5 }, 'G', { cols: MULTIHEX_GARGANTUAN_MIN.cols, rows: MULTIHEX_GARGANTUAN_MIN.rows }), m.id).toBe(true);
      }
    }
  });
  it('mücevher hatları: nefes türü ve bağışıklık hat tablosundan (tek yer); Yetişkin efsanevi Tail + Body Sweep/Wing Buffet + Elemental Pulse', () => {
    expect(Object.fromEntries(Object.entries(K.hatlar).map(([k, h]) => [k, h.hasar]))).toEqual({ alpha: 'thunder', omega: 'necrotic', delta: 'psychic', sigma: 'radiant', gamma: 'force' });
    for (const [hat, h] of Object.entries(K.hatlar)) {
      expect(h.kimlikler).toHaveLength(3);
      for (const id of h.kimlikler) {
        const m = getMonster(id);
        expect(m.attacks.find((a) => a.save)!.damageType, id).toBe(h.hasar);
        expect(m.immunities, id).toEqual([h.hasar]);
        expect(m.attacks.map((a) => a.name).slice(0, 2), id).toEqual(['Bite', 'Claw']);
      }
      const adult = EF[h.kimlikler[2]!]!;
      const sweep = ['alpha', 'omega', 'delta'].includes(hat) ? 'body-sweep' : 'wing-buffet';
      // KATALOG-LA-SRD: her eylem 1 hak (SRD 5.2.1); bedelli 3 puanla eş hasar için 2 hak.
      expect(adult.uses).toBe(2);
      expect(adult.actions.map((a) => a.id)).toEqual(['tail', sweep, 'elemental-pulse']);
      expect(adult.actions[2]!.damageType).toBe(h.hasar);
      expect(EF[h.kimlikler[0]!]).toBeUndefined();
    }
  });
  it('Legendary Resistance metinden okunur; efsanevi eylemler yalnız yeni kimliklerle; saldırı adları kayıtta', () => {
    const LR: Record<string, number> = { 'tutsak-dragon': 4, 'dragon-of-hexonia-a': 6, 'dragon-of-hexonia-b': 6, 'kozmik-anka': 4, 'kozmik-anka-savas': 4,
      'ocean-nightmare': 3, 'ocean-nightmare-open-sea': 3, 'titan-of-nightmare': 5 };
    for (const m of K.canavarlar) {
      const c = combatantFromMonster(m, { id: 'X', name: m.name });
      expect(c.maxHp, m.id).toBe(m.hp);
      expect(c.creatureType, m.id).toBe(m.creatureType);
      expect(c.resources.legendaryResistance ?? 0, m.id).toBe(LR[m.id] ?? 0);
      const spec = EF[m.id];
      expect(!!spec, m.id).toBe(m.id !== 'ember-egg' && !/(let|yr)$/.test(m.id));
      for (const a of spec?.actions ?? []) if (a.attack) expect(m.attacks.some((x) => x.name === a.attack), `${m.id}: ${a.attack}`).toBe(true);
    }
    for (const old of ['continent-dragon', 'ancient-continent-spirit', 'cosmic-phoenix', 'abyssal-star-nightmare', 'adult-alpha-jewel-dragon']) expect(EF[old], old).toBeUndefined();
  });
});

describe('KATALOG-F2: Dungeondex açıklamaları', () => {
  it('her özellik/eylem için TR ve EN açıklama dolu; TR Türkçe, EN İngilizce; adlar İngilizce; eski F2 anahtarları yok', () => {
    for (const [id, list] of Object.entries(K.ozellikler)) {
      expect(list.length, id).toBeGreaterThan(0);
      for (const f of list) {
        expect(f.anahtar.startsWith(`${id}/${f.tur}:`), f.anahtar).toBe(true);
        expect(TR[f.anahtar], f.anahtar).toBeTruthy();
        expect(EN[f.anahtar], f.anahtar).toBeTruthy();
        expect(looksEnglish(TR[f.anahtar]!), f.anahtar).toBe(false);
        expect(looksTurkish(EN[f.anahtar]!), f.anahtar).toBe(false);
        expect(EN[f.anahtar], f.anahtar).not.toBe(TR[f.anahtar]);
        expect(f.ad, f.anahtar).toMatch(/^[A-Za-z0-9 ,'’()/–-]+$/);
      }
    }
    expect(kadimKeys().length).toBe(Object.values(K.ozellikler).flat().length);
    expect(Object.keys(TR).filter((k) => /^(continent-dragon|ancient-continent-spirit|cosmic-phoenix|abyssal-star-nightmare|.*jewel-dragon.*)\//.test(k))).toEqual([]);
    expect(Object.keys(EN)).toHaveLength(Object.keys(TR).length);
  });
  it('yasaklı ad taraması: veri, açıklamalar ve efsanevi kayıtlarda yok', () => {
    const texts = [JSON.stringify(K), ...kadimKeys().flatMap((k) => [TR[k]!, EN[k]!]), ...ids().map((id) => JSON.stringify(EF[id] ?? {}))];
    const hits = texts.flatMap((t) => PROTECTED.filter((re) => re.test(t)).map((re) => `${re} → ${t.slice(0, 80)}`));
    expect(hits).toEqual([]);
  });
});
