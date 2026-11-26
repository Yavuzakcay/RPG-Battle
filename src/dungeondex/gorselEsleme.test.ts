/**
 * Görsel envanter: Dungeondex görsel eşlemesi (`data/dungeondex-gorsel-esleme.json`, `npm run dd-gorsel` üretir).
 * Her SRD kimliği ve her Dungeondex kaydı için eşleme var; her kaynak gerçekten çözülüyor (public/ dosyası, efekt kaydı ya da
 * yedek glifi). Testler görsel açmaz: yalnız dosya adları listelenir (`import.meta.glob`, tembel).
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { classData, isMagicItem, items, loadMonsters, monsters, races, spells, weapons, armor } from '../data';
import { subclassesOf } from '../rules/classFeatures';
import { classes } from '../data';
import { setLang } from '../i18n';
import { buildDex, loadDexExtras, CONDITION_IDS, DEX_CATS, type DexCat, type DexEntry } from './catalog';
import { FX, SIMGE } from '../ui/fx/fxPlan';
import { STATUS_SPRITES } from '../ui/statusFx';
import esleme from '../../data/dungeondex-gorsel-esleme.json';
import srdSpells from '../../data/srd/spells.json';
import srdMagic from '../../data/srd/magic-items.json';
import srdGear from '../../data/srd/gear.json';
import srdMonsters from '../../data/srd/monsters.json';
import srdFeats from '../../data/srd/feats.json';
import srdSpecies from '../../data/srd/species.json';

interface Rec { kaynak: string; ref: string; durum: string; efekt?: string; nadirlikRengi?: string; gorunum?: { raceId: string } }
const E = esleme as unknown as { yedekler: Record<string, { glif: string; tr: string; en: string }>; nadirlikRenkleri: Record<string, string>;
  kategoriler: Record<DexCat, Record<string, Rec>>; ek: Record<string, Record<string, Rec>> };
const PUBLIC = new Set(Object.keys(import.meta.glob('/public/**/*.{webp,png,jpg}')).map((f) => f.replace('/public/', '')));
const resolves = (r: Rec): boolean => (r.ref.startsWith('yedek:') ? r.ref.slice(6) in E.yedekler : PUBLIC.has(r.ref));

let dex: Record<DexCat, DexEntry[]>;
beforeAll(async () => {
  await loadMonsters();
  setLang('tr');
  dex = buildDex({ ...(await loadDexExtras()), mapNames: {} });
});

describe('Dungeondex görsel eşlemesi', () => {
  it('kategoriler Dungeondex kategorileriyle aynı; her Dungeondex kaydının eşlemesi var', () => {
    expect(Object.keys(E.kategoriler).sort()).toEqual([...DEX_CATS].sort());
    for (const cat of DEX_CATS) for (const e of dex[cat]) expect(E.kategoriler[cat][e.id], `${cat}/${e.id}`).toBeDefined();
  });

  it('her SRD kimliği için kayıt var', () => {
    const has = (cat: DexCat, id: string) => expect(E.kategoriler[cat][id], `${cat}/${id}`).toBeDefined();
    const srdIds = (list: Array<{ id: string }>) => list.map((x) => x.id);
    for (const id of srdIds((srdSpells as unknown as { spells: Array<{ id: string }> }).spells)) has('buyu', id);
    expect(Object.keys(E.kategoriler.buyu)).toHaveLength(spells.length);
    // SRD eşya kimliği oyunda bir ya da birkaç kayda açılır (Potion of Healing → dört iksir; `srd: "magic-items:<kimlik>"`).
    const viaSrd = (ref: string) => { const its = items.filter((i) => i.srd === ref); expect(its.length, ref).toBeGreaterThan(0); for (const i of its) has('esya', i.id); };
    for (const id of srdIds((srdMagic as unknown as { items: Array<{ id: string }> }).items)) viaSrd(`magic-items:${id}`);
    for (const i of items.filter((x) => !isMagicItem(x))) has('esya', i.id);
    expect((srdGear as unknown as { gear: unknown[] }).gear.length).toBeGreaterThan(0);
    for (const w of weapons) has('esya', w.id);
    for (const a of armor as Array<{ srd?: string }>) if (a.srd) has('esya', a.srd.split(':')[1]!);
    // Görev KATALOG-1 A: 449 SRD/oyun eşyası + 125 özgün katalog silahı (yedek ikon); B: + 66 zırh/cübbe/kalkan/imza eşyası; C: + 55 giyilebilir; D: + 76 yüzük, tılsım, taş; E: + 45 tüketilebilir (ikonlu).
    expect(Object.keys(E.kategoriler.esya)).toHaveLength(816);
    for (const id of Object.keys((srdMonsters as unknown as { monsters: Record<string, unknown> }).monsters)) has('canavar', id);
    expect(Object.keys(E.kategoriler.canavar)).toHaveLength(monsters.length);
    for (const id of srdIds((srdFeats as unknown as { feats: Array<{ id: string }> }).feats)) has('feat', id);
    for (const s of (srdSpecies as unknown as { species: Array<{ id: string }> }).species) has('tur', s.id);
    for (const r of races) for (const l of r.lineages ?? []) has('altsoy', `${r.id}/${l.id}`);
    for (const id of CONDITION_IDS) has('durum', id);
    for (const c of classes) has('sinif', c.id);
    for (const c of classes) for (const s of subclassesOf(c.id)) has('altsinif', s.id);
    expect(Object.keys(E.kategoriler.altsinif)).toHaveLength(120);
    expect(classData.feats.every((f) => E.kategoriler.feat[f.id])).toBe(true);
  });

  it('her kaynak çözülüyor: public/ dosyası, efekt kaydı ya da yedek glifi', () => {
    const groups = { ...E.kategoriler, ...Object.fromEntries(Object.entries(E.ek).map(([k, v]) => [`ek:${k}`, v])) } as Record<string, Record<string, Rec>>;
    const bad: string[] = [];
    for (const [cat, recs] of Object.entries(groups)) {
      for (const [id, r] of Object.entries(recs)) {
        if (!['efekt', 'jeton', 'ikon', 'yedek'].includes(r.kaynak) || !['var', 'genel', 'yedek'].includes(r.durum)) bad.push(`${cat}/${id}: biçim`);
        if ((r.kaynak === 'yedek') !== r.ref.startsWith('yedek:')) bad.push(`${cat}/${id}: kaynak/ref uyuşmuyor`);
        if (!resolves(r)) bad.push(`${cat}/${id}: ${r.ref}`);
        if (r.efekt) {
          const ok = r.efekt.startsWith('dongu:') ? STATUS_SPRITES.some((s) => s.id === r.efekt!.slice(6) && s.file === r.ref)
            : r.efekt.startsWith('isaret-') ? `${SIMGE.isaret?.[r.efekt.slice(7)]}.webp` === r.ref : FX[r.efekt]?.file === r.ref;
          if (!ok) bad.push(`${cat}/${id}: efekt ${r.efekt}`);
        }
        if (r.nadirlikRengi && !Object.values(E.nadirlikRenkleri).includes(r.nadirlikRengi)) bad.push(`${cat}/${id}: renk`);
        if (r.gorunum && !races.some((x) => x.id === r.gorunum!.raceId)) bad.push(`${cat}/${id}: görünüm`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('nadirlik rengi yalnız sihirli eşyada; canavar ve jetonlar kendi dosyasına bağlı', () => {
    for (const it of items) expect(!!E.kategoriler.esya[it.id]?.nadirlikRengi, it.id).toBe(isMagicItem(it));
    for (const m of monsters) expect(E.kategoriler.canavar[m.id]!.ref).toBe(`monsters/${m.id}.webp`);
  });
});
