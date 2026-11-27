/**
 * Görev KATALOG-F2: Kadim Yaratıklar ve Mücevher Ejderhası (`data/canavarlar-kadim.json`, `scripts/katalog-f2-kadim.mjs`).
 * Kayıt şeması (Monster, yeni alan yok), PDF sayıları (CR/AC/HP), TR/EN açıklamalar, korumalı ad taraması, efsanevi eylem ve
 * Faz 2 bağları, mücevher hatlarının nefes türü tek yerden, savaşçı oluşturma (duman).
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { getMonster, kadimMonsters, loadMonsters, monsters, type Monster } from './index';
import { looksEnglish, looksTurkish } from './aciklamaDil';
import { faz2Errors } from '../rules/faz2Schema';
import { combatantFromMonster } from '../battle/create';
import kadimJson from '../../data/canavarlar-kadim.json';
import trJson from '../../data/aciklamalar-tr-canavar.json';
import enJson from '../../data/aciklamalar-en-canavar.json';
import efsanevi from '../../data/efsanevi.json';

interface Kadim {
  hatlar: Record<string, { hasar: string; oneri: boolean; kimlikler: string[] }>;
  canavarlar: Monster[];
  dex: Record<string, { type: string; alignment: string; conditionImmunities: string[] }>;
  yer: Record<string, { tema: string; ortam: string[] }>;
  ozellikler: Record<string, Array<{ anahtar: string; ad: string; tur: string }>>;
  ekler: Record<string, { status: string }>;
}
const K = kadimJson as unknown as Kadim;
const TR = (trJson as unknown as { canavar: Record<string, string> }).canavar;
const EN = (enJson as unknown as { canavar: Record<string, string> }).canavar;
const EF = (efsanevi as unknown as { monsters: Record<string, { uses: number; actions: Array<{ kind: string; attack?: string; save?: string; dc?: number }> }> }).monsters;

/** PDF sayıları (Yavru evresi PDF'te yok: türetildi, KATALOG-F2-PROSPEKTUS.md). */
const PDF: Record<string, { cr: string; ac: number; hp: number; size: string }> = {
  'continent-dragon': { cr: '31', ac: 25, hp: 740, size: 'G' },
  'ancient-continent-spirit': { cr: '40', ac: 30, hp: 1850, size: 'G' },
  'cosmic-phoenix': { cr: '32', ac: 26, hp: 780, size: 'H' },
  'ember-egg': { cr: '0', ac: 22, hp: 150, size: 'M' },
  'abyssal-star-nightmare': { cr: '35', ac: 26, hp: 1150, size: 'G' },
  'young-sigma-jewel-dragon': { cr: '15', ac: 19, hp: 240, size: 'L' },
  'adult-sigma-jewel-dragon': { cr: '25', ac: 22, hp: 480, size: 'H' },
  'young-omega-jewel-dragon': { cr: '16', ac: 19, hp: 265, size: 'L' },
  'adult-omega-jewel-dragon': { cr: '26', ac: 23, hp: 515, size: 'H' },
  'young-delta-jewel-dragon': { cr: '17', ac: 20, hp: 285, size: 'L' },
  'adult-delta-jewel-dragon': { cr: '27', ac: 23, hp: 545, size: 'H' },
  'young-alpha-jewel-dragon': { cr: '18', ac: 20, hp: 310, size: 'L' },
  'adult-alpha-jewel-dragon': { cr: '28', ac: 24, hp: 585, size: 'H' },
  'young-gamma-jewel-dragon': { cr: '20', ac: 21, hp: 340, size: 'L' },
  'adult-gamma-jewel-dragon': { cr: '30', ac: 25, hp: 650, size: 'H' },
};
/** PDF nefes kurtarma DC'si ve zarı (Genç / Yetişkin). */
const BREATH: Record<string, [number, string]> = {
  'young-sigma-jewel-dragon': [19, '10d8'], 'adult-sigma-jewel-dragon': [23, '16d10'],
  'young-omega-jewel-dragon': [20, '11d8'], 'adult-omega-jewel-dragon': [24, '17d10'],
  'young-delta-jewel-dragon': [20, '11d8'], 'adult-delta-jewel-dragon': [24, '18d10'],
  'young-alpha-jewel-dragon': [21, '12d8'], 'adult-alpha-jewel-dragon': [25, '19d10'],
  'young-gamma-jewel-dragon': [22, '12d8'], 'adult-gamma-jewel-dragon': [26, '20d10'],
};
/** Veriye ve açıklamaya girmeyen adlar (ticari marka, D&D'ye özgü ad, PDF'teki esin kaynakları). */
const PROTECTED = [/Thangorodrim/i, /Zettaflare/i, /Ancalagon/i, /Placidusax/i, /Bahamut/i, /Tiamat/i, /Cthulhu/i, /Far Realm/i,
  /(Sapphire|Emerald|Amethyst|Topaz|Crystal|Ruby|Gold|Silver) (Gem |Jewel )?Dragon/i, /Gem Dragon/i, /Ametist/i, /Topaz/i,
  /(Safir|Zümrüt|Yakut|Altın|Gümüş|Kristal) Ejderha/i];
const MONSTER_KEYS = new Set(['id', 'faz2', 'name', 'initiative', 'srdPage', 'egitimli', 'size', 'ac', 'hp', 'speed', 'fly', 'avatar', 'abilities', 'saves', 'skills',
  'darkvision', 'bonusActions', 'cr', 'attacks', 'traits', 'packTactics', 'undeadFortitude', 'multiattack', 'regeneration', 'resistances', 'immunities', 'vulnerabilities', 'unsupported']);
const ATTACK_KEYS = new Set(['name', 'bonusAction', 'bonus', 'damage', 'recharge', 'repeat', 'damageDice', 'damageType', 'save', 'rider', 'ranged', 'reachFt', 'range', 'area']);
const DAMAGE = ['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder'];
const kadimKeys = () => Object.keys(TR).filter((k) => K.dex[k.split('/')[0]!]);

beforeAll(async () => { await loadMonsters(); });

describe('KATALOG-F2: kadim yaratık kayıtları', () => {
  it('20 kayıt (5 kadim + 15 mücevher), kebab-case tekil kimlik, SRD listesinde yok; yükleyici ayrı dizide', () => {
    expect(K.canavarlar).toHaveLength(20);
    expect(kadimMonsters.map((m) => m.id)).toEqual(K.canavarlar.map((m) => m.id));
    expect(monsters).toHaveLength(330);
    const ids = K.canavarlar.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id, id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(monsters.some((m) => m.id === id), id).toBe(false);
      expect(getMonster(id).id).toBe(id);
    }
    for (const t of ['dex', 'yer', 'ozellikler'] as const) expect(Object.keys(K[t]).sort()).toEqual([...ids].sort());
  });
  it('şema: yalnız Monster alanları; yetenekler, boyut, saldırılar geçerli; görsel alanı yok', () => {
    for (const m of K.canavarlar) {
      for (const k of Object.keys(m)) expect(MONSTER_KEYS.has(k), `${m.id}.${k}`).toBe(true);
      expect(m.avatar, m.id).toBeUndefined();
      expect(['T', 'S', 'M', 'L', 'H', 'G']).toContain(m.size);
      expect(Object.keys(m.abilities).sort()).toEqual(['cha', 'con', 'dex', 'int', 'str', 'wis']);
      for (const v of Object.values(m.abilities)) expect(v >= 1 && v <= 36).toBe(true);
      expect(typeof m.traits).toBe('string');
      for (const t of [...(m.immunities ?? []), ...(m.resistances ?? []), ...(m.vulnerabilities ?? [])]) expect(DAMAGE, `${m.id}: ${t}`).toContain(t);
      for (const a of m.attacks) {
        for (const k of Object.keys(a)) expect(ATTACK_KEYS.has(k), `${m.id}/${a.name}.${k}`).toBe(true);
        if (a.damageType) expect(DAMAGE).toContain(a.damageType);
        if (a.save) expect(a.bonus).toBe(0);
        else expect(a.bonus).toBeGreaterThan(0);
      }
    }
  });
  it('PDF sayıları: CR, AC, HP ve boyut (Gargantuan 19 altıgen sınırı); mücevher nefesi DC ve zarı', () => {
    for (const [id, p] of Object.entries(PDF)) {
      const m = getMonster(id);
      expect({ cr: m.cr, ac: m.ac, hp: m.hp, size: m.size }, id).toEqual(p);
    }
    for (const [id, [dc, dice]] of Object.entries(BREATH)) {
      const b = getMonster(id).attacks.find((a) => a.save)!;
      expect([b.save!.dc, b.damageDice], id).toEqual([dc, dice]);
      expect(b.area?.sizeFt, id).toBe(id.startsWith('adult') ? 90 : 60);
    }
    // Faz 2 (yaklaşık): Anka +450, Yıldız-Kâbusu +550 geçici can.
    expect(getMonster('cosmic-phoenix').faz2?.geciciCan).toBe(450);
    expect(getMonster('abyssal-star-nightmare').faz2?.geciciCan).toBe(550);
    for (const m of K.canavarlar) if (m.faz2) expect(faz2Errors(m.faz2, m.id)).toEqual([]);
  });
  it('mücevher hatları: nefes türü ve bağışıklık hat tablosundan (tek yer); 5 hat × 3 evre', () => {
    expect(Object.keys(K.hatlar).sort()).toEqual(['alpha', 'delta', 'gamma', 'omega', 'sigma']);
    expect(Object.fromEntries(Object.entries(K.hatlar).map(([k, h]) => [k, h.hasar]))).toEqual({ alpha: 'thunder', omega: 'necrotic', delta: 'psychic', sigma: 'radiant', gamma: 'force' });
    for (const h of Object.values(K.hatlar)) {
      expect(h.kimlikler).toHaveLength(3);
      for (const id of h.kimlikler) {
        const m = getMonster(id);
        expect(m.attacks.find((a) => a.save)!.damageType, id).toBe(h.hasar);
        expect(m.immunities, id).toEqual([h.hasar]);
      }
    }
  });
  it('Legendary Resistance metinden okunur; efsanevi eylemler kayıtlı ve saldırı adları kayıtta', () => {
    const LR: Record<string, number> = { 'continent-dragon': 4, 'ancient-continent-spirit': 6, 'cosmic-phoenix': 4, 'abyssal-star-nightmare': 5 };
    for (const h of Object.values(K.hatlar)) for (const id of h.kimlikler) if (id.startsWith('adult')) LR[id] = 3;
    for (const m of K.canavarlar) {
      const c = combatantFromMonster(m, { id: 'X', name: m.name });
      expect(c.maxHp, m.id).toBe(m.hp);
      expect(c.resources.legendaryResistance ?? 0, m.id).toBe(LR[m.id] ?? 0);
      const spec = EF[m.id];
      expect(!!spec, m.id).toBe(!!LR[m.id]);
      for (const a of spec?.actions ?? []) if (a.attack) expect(m.attacks.some((x) => x.name === a.attack), `${m.id}: ${a.attack}`).toBe(true);
    }
    for (const k of Object.keys(K.ekler)) {
      const [id, atk] = k.split(':') as [string, string];
      expect(getMonster(id).attacks.some((a) => a.name === atk), k).toBe(true);
    }
  });
});

describe('KATALOG-F2: Dungeondex açıklamaları', () => {
  it('her özellik/eylem için TR ve EN açıklama dolu; TR Türkçe, EN İngilizce; adlar İngilizce', () => {
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
  });
  it('korumalı ad taraması: veri, açıklamalar ve efsanevi kayıtlarda ticari marka / D&D adı yok', () => {
    const texts = [JSON.stringify(K), ...kadimKeys().flatMap((k) => [TR[k]!, EN[k]!]), ...Object.keys(K.dex).map((id) => JSON.stringify(EF[id] ?? {}))];
    const hits = texts.flatMap((t) => PROTECTED.filter((re) => re.test(t)).map((re) => `${re} → ${t.slice(0, 80)}`));
    expect(hits).toEqual([]);
  });
});
