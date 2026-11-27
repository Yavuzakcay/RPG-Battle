/**
 * Dungeondex kataloğu (yalnız arayüz; harita/belgeler/DUNGEONDEX-TASARIM.md). Yüklü veriden kategori başına kayıt
 * kartları, süzgeç değerleri ve bağlantılar üretir. Kimlik = mevcut SRD kimliği (yeni kimlik açılmaz). Ad kuralı (SD4):
 * adlar İngilizce (alt sınıf ve Geçmiş adı Türkçe), açıklamalar Türkçe; SRD'nin İngilizce ham metni (`text`, `raw`)
 * hiçbir kartta kullanılmaz. Tembel parça: yalnız `src/screens/Dungeondex.tsx` içe aktarır.
 */
import { armor, classes, isMagicItem, items, katalogMonsters, monsters, races, spells, spellDescriptions, trAciklama, weapons, classData, enDescriptions, loadMonsterDescriptions, loadEnMonsterDescriptions } from '../data';
import type { Item, Monster, Spell, SubclassDef, Weapon } from '../data';
import { allFeats } from '../rules/advancement';
import { backgrounds } from '../rules/backgrounds';
import { subclassesOf } from '../rules/classFeatures';
import { displayName } from '../rules/subclasses';
import { armorDetail, itemSummary, weaponDetail } from '../ui/equipmentText';
import { featInfo, featureSummary, masteryDescription } from '../ui/descriptions';
import { allInvocations } from '../rules/invocations';
import { hexCount } from '../rules/footprint';
import { spellRitual } from '../rules/spellComponents';
import { actionGlyph, itemGlyphs, spellGlyphs } from '../ui/glyph/glyphs';
import { t, type Lang } from '../i18n';
import cfg from '../../data/dungeondex.json';
import srdSpecies from '../../data/srd/species.json';
import altSoyMetin from '../../data/alt-soy-metin.json';
import celestial from '../../data/celestial.json';

export type DexCat = 'buyu' | 'esya' | 'canavar' | 'tur' | 'altsoy' | 'sinif' | 'altsinif' | 'feat' | 'gecmis' | 'durum';
export const DEX_CATS = cfg.kategoriler as DexCat[];
export const DEX_PAGE = cfg.sayfa;
export const DEX_VISIBLE_FILTERS = cfg.gorunurSuzgec;
export const DEX_SUBCLASS_EXPECTED = cfg.altSinifBeklenen;
export const CONDITION_IDS = cfg.durumlar.map((d) => d.id);

/**
 * Açıklama metni dil anahtarlı: `tr` / `en` verideki açıklama (şimdilik yalnız tr; `data/aciklamalar-en.json` aynı
 * kimliklerle eklenince `en` dolar), `ui` arayüzün o dilde ürettiği özet (eşya etki özeti, silah/zırh satırı).
 */
export interface DexText { tr?: string; en?: string; ui?: string }
export interface DexRow { name: string; text?: DexText; tag?: string; level?: number; /** Ortak simge (glif): eylem türü. */ glif?: string }
export interface DexLink { cat: DexCat; id?: string; filter?: [string, string]; label: string }
export interface DexEntry {
  cat: DexCat; id: string; name: string; alt?: string; header: string;
  summary?: DexText; desc?: DexText; extra?: DexText;
  facts: Array<[string, string]>; sections: Array<{ title: string; rows: DexRow[] }>;
  links: DexLink[]; tags: string[];
  /** Ortak simgeler (glif; yalnız görünüm): başlıkta adın yanında (büyüde okul + Concentration/Ritual, eşyada Attunement). */
  glif?: string[];
  /** Süzgeç değerleri (anahtar → değer; çok değerli süzgeçte `|` ile). */
  f: Record<string, string>;
  /** Kimlik dışı sıralama anahtarı. */
  sort: string;
}
export interface DexFilter { key: string; label: string; options: Array<{ value: string; label: string }> }

/** Ek veri (canavar ayrıntıları; `loadDexExtras` doldurur). */
export interface DexExtras {
  srdMonsters: Record<string, { alignment?: string; type?: string; conditionImmunities?: string[]; size?: string[]; tirmanma?: number; suzulme?: boolean }>;
  monsterTypes: Record<string, string>;
  monsterSpells: Record<string, { spellcasting?: { atWill?: Array<{ name: string }>; daily?: Array<{ spells: Array<{ name: string }> }> } }>;
  monsterPlaces: Record<string, { tema?: string; ortam?: string[] }>;
  /** Harita kimliği → görünen ad (gizli haritalar yok). */
  mapNames: Record<string, string>;
  /** İngilizce açıklamalar (`data/aciklamalar-en.json` + `aciklamalar-en-canavar.json`; aynı tür → kimlik yapısı). */
  en: Record<string, Record<string, string>>;
  /** Kuyruk A İş 4: canavar → özellik/eylem listesi (`data/canavar-ozellik.json`; ad İngilizce, tür, sıra). */
  monsterFeatures: Record<string, Array<{ anahtar: string; ad: string; tur: string }>>;
  /** Sınıf → SRD sınıf tablosunun "Primary Ability" değeri (İngilizce yetenek adları; kartta yetenek kısaltmasına çevrilir). */
  classPrimary: Record<string, string>;
  /** KATALOG-F2: Dungeondex'te gösterilen katalog canavarları (`data/canavarlar-kadim.json` `dex`, `dexGizli` varyantları hariç). */
  katalogDex?: string[];
}


/** Canavar verisini ve ek tabloları yükler (hepsi uygulamaya gömülü; ağ yok). */
export async function loadDexExtras(): Promise<Omit<DexExtras, 'mapNames'>> {
  const [srd, types, sp, places, en, srdClasses] = await Promise.all([
    import('../../data/srd/monsters.json'), import('../../data/canavar-turleri.json'), import('../../data/canavar-buyuleri.json'),
    import('../../data/monster-ortamlari.json'),
    // Görev EN-ACIKLAMA: İngilizce açıklamalar (`loadClassData` yükler) + canavar özellikleri (yalnız burada).
    loadEnMonsterDescriptions().then(() => enDescriptions as unknown as Record<string, Record<string, string>>),
    import('../../data/srd/classes.json'),
  ]);
  const [feats, kadimJson] = await Promise.all([import('../../data/canavar-ozellik.json'), import('../../data/canavarlar-kadim.json'), loadMonsterDescriptions()]);
  const placeList = places.default as unknown as Array<{ id: string; tema?: string; ortam?: string[] }>;
  // KATALOG-F2: kadim yaratıkların yan tabloları (tür/hizalanma/durum bağışıklığı, tema, özellik listesi) SRD tablolarıyla aynı biçimde.
  const kadim = kadimJson.default as unknown as { dex: DexExtras['srdMonsters']; yer: DexExtras['monsterPlaces']; ozellikler: DexExtras['monsterFeatures']; dexGizli: string[] };
  return {
    srdMonsters: { ...(srd.default as unknown as { monsters: DexExtras['srdMonsters'] }).monsters, ...kadim.dex },
    monsterTypes: (types.default as unknown as { types: Record<string, string> }).types,
    monsterSpells: sp.default as unknown as DexExtras['monsterSpells'],
    monsterPlaces: { ...Object.fromEntries(placeList.map((p) => [p.id, p])), ...kadim.yer },
    en,
    monsterFeatures: { ...(feats.default as unknown as { canavarlar: DexExtras['monsterFeatures'] }).canavarlar, ...kadim.ozellikler },
    classPrimary: Object.fromEntries((srdClasses.default as unknown as { classes: Array<{ id: string; core: Record<string, string> }> }).classes
      .map((c) => [c.id, c.core['Primary Ability'] ?? ''])),
    katalogDex: Object.keys(kadim.dex).filter((id) => !kadim.dexGizli.includes(id)),
  };
}

/** Türkçe aksan ve büyük/küçük harf duyarsız arama anahtarı. */
export const fold = (s: string): string => s.toLocaleLowerCase('tr').replace(/ı/g, 'i').normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Gösterilecek açıklama: EN arayüzde `en` yoksa Türkçe metin + "yalnız Türkçe" notu. */
export function shownText(d: DexText | undefined, lang: Lang): { text: string; trOnly: boolean } | null {
  if (!d) return null;
  if (lang === 'en') {
    if (d.en) return { text: d.en, trOnly: false };
    if (d.tr) return { text: d.tr, trOnly: true };
    return d.ui ? { text: d.ui, trOnly: false } : null;
  }
  const text = d.tr ?? d.ui;
  return text ? { text, trOnly: false } : null;
}

const crNum = (cr: string): number => (cr.includes('/') ? Number(cr.split('/')[0]) / Number(cr.split('/')[1]) : Number(cr));
const crBand = (cr: string): string => {
  const n = crNum(cr);
  return cfg.crKademeleri.find((b) => n >= b.min && n <= b.max)?.id ?? cfg.crKademeleri[0]!.id;
};
const cap = (s: string) => (s ? s[0]!.toUpperCase() + s.slice(1) : s);
const className = (id: string) => classes.find((c) => c.id === id)?.name ?? cap(id);
const spellClassIds = (s: Spell): string[] => s.classes.map((c) => (cfg.buyuSiniflari as Record<string, string>)[c] ?? c.toLowerCase());
const spellKey = (name: string) => fold(name).replace(/[^a-z0-9]/g, '');

/** Bütün kategorilerin kayıtları (dil değişince yeniden üretilir; ucuz). */
export function buildDex(x: DexExtras): Record<DexCat, DexEntry[]> {
  const L = t().dex;
  const en = (kind: string, id: string): string | undefined => x.en[kind]?.[id];
  const condName = (id: string) => cfg.durumlar.find((d) => d.id === id)?.ad ?? cap(id);
  const condText = new Map(CONDITION_IDS.map((id) => [id, fold(condName(id))]));
  const spellsByName = new Map(spells.map((s) => [spellKey(s.name), s]));

  // Büyüler.
  const spellConds = (s: Spell): string[] => {
    const m = fold(JSON.stringify(s.mechanics ?? {}));
    return CONDITION_IDS.filter((id) => id !== 'exhaustion' && m.includes(`"${condText.get(id)}"`));
  };
  const buyu: DexEntry[] = spells.map((s) => {
    const cls = spellClassIds(s);
    const conds = spellConds(s);
    return {
      cat: 'buyu', id: s.id, name: s.name,
      header: `${s.level === 0 ? L.cantrip : L.level(s.level)} · ${s.school ?? ''}`.replace(/ · $/, ''),
      desc: { tr: trAciklama('buyu', s.id), en: en('buyu', s.id) },
      extra: spellDescriptions[s.id]?.tr ? { tr: spellDescriptions[s.id]?.tr, en: spellDescriptions[s.id]?.en } : undefined,
      facts: [
        [L.fact.casting, L.casting[s.castingTime] ?? s.castingTime],
        [L.fact.range, s.rangeFt === 0 ? L.self : s.rangeFt === 5 ? L.touch : L.ft(s.rangeFt)],
        ...(s.concentration ? [[L.fact.conc, L.yes] as [string, string]] : []),
        ...(s.area ? [[L.fact.area, `${L.shape[s.area.shape] ?? s.area.shape} ${L.ft(s.area.sizeFt)}`] as [string, string]] : []),
      ],
      sections: [],
      links: [
        ...cls.map((c): DexLink => ({ cat: 'buyu', filter: ['cls', c], label: L.spellsOf(className(c)) })),
        ...conds.map((c): DexLink => ({ cat: 'durum', id: c, label: condName(c) })),
      ],
      tags: [], f: { level: String(s.level), school: s.school ?? '', cls: cls.join('|') }, sort: `${s.level}${s.name}`,
      glif: spellGlyphs(s, spellRitual(s)),
    };
  });

  // Eşyalar: sihirli eşya, donanım, silah, zırh.
  const itemKind = (i: Item) => (isMagicItem(i) ? 'magic' : 'gear');
  const masteryOf = (w: Weapon) => classData.srdWeapons.find((s) => s.id === w.id)?.mastery;
  const esya: DexEntry[] = [
    ...items.map((i): DexEntry => ({
      cat: 'esya', id: i.id, name: i.name, header: L.itemKind[itemKind(i)] ?? '',
      // Görev KATALOG-1: özgün eşyada Türkçe açıklama yoksa PDF'in "Ne işe yarar" paragrafı.
      desc: { tr: trAciklama('esya', i.id), en: en('esya', i.id), ui: trAciklama('esya', i.id) ? undefined : i.katalog?.ozet ?? itemSummary(i) },
      facts: [
        ...(i.attunement ? [[L.fact.attune, L.yes] as [string, string]] : []),
        ...(i.weight !== undefined ? [[L.fact.weight, L.lb(i.weight)] as [string, string]] : []),
        ...(i.charges ? [[L.fact.charges, String(i.charges)] as [string, string]] : []),
      ],
      sections: [],
      links: (i.spells ?? []).flatMap((s) => { const sp = spellsByName.get(spellKey(s.name)); return sp ? [{ cat: 'buyu' as const, id: sp.id, label: sp.name }] : []; }),
      tags: [], f: { kind: itemKind(i) }, sort: i.name, glif: itemGlyphs(i),
    })),
    ...weapons.map((w): DexEntry => {
      const m = masteryOf(w);
      return {
        cat: 'esya', id: w.id, name: w.name, header: `${L.itemKind.weapon} · ${L.weaponCat[w.category] ?? w.category}`,
        desc: { ui: weaponDetail(w) },
        extra: m ? { tr: `${cap(m)}: ${masteryDescription(m, 'tr')}`, en: masteryDescription(m, 'en') ? `${cap(m)}: ${masteryDescription(m, 'en')}` : undefined } : undefined,
        facts: [[L.fact.damage, `${w.damage} ${w.damageType}`], ...(m ? [[L.fact.mastery, cap(m)] as [string, string]] : []),
          ...(w.weight !== undefined ? [[L.fact.weight, L.lb(w.weight)] as [string, string]] : [])],
        sections: [], links: [], tags: [], f: { kind: 'weapon' }, sort: w.name,
      };
    }),
    ...(armor as Array<(typeof armor)[number] & { srd?: string }>).filter((a) => a.srd).map((a): DexEntry => {
      const id = String(a.srd).split(':')[1]!;
      return {
        cat: 'esya', id, name: a.name, header: `${L.itemKind.armor} · ${L.armorType[a.type] ?? a.type}`,
        desc: { ui: armorDetail(a) },
        facts: [[L.fact.ac, String(a.baseAc)], ...(a.strength ? [[L.fact.strength, String(a.strength)] as [string, string]] : []),
          ...(a.stealthDisadvantage ? [[L.fact.stealth, L.disadvantage] as [string, string]] : []),
          ...(a.weight !== undefined ? [[L.fact.weight, L.lb(a.weight)] as [string, string]] : [])],
        sections: [], links: [], tags: [], f: { kind: 'armor' }, sort: a.name,
      };
    }),
  ];

  // Canavarlar.
  const monsterSpellIds = (id: string): Spell[] => {
    const sc = x.monsterSpells[id]?.spellcasting;
    const names = [...(sc?.atWill ?? []), ...(sc?.daily ?? []).flatMap((d) => d.spells)].map((s) => s.name);
    return [...new Map(names.flatMap((n) => { const s = spellsByName.get(spellKey(n)); return s ? [[s.id, s] as const] : []; })).values()];
  };
  // KATALOG-F2: katalog canavarlarından yalnız Dungeondex'e alınanlar (kadim yaratıklar; gizli varyantlar ve Mühür Ruhu hariç).
  const katalogDex = new Set(x.katalogDex ?? []);
  const canavar: DexEntry[] = [...monsters, ...katalogMonsters.filter((m) => katalogDex.has(m.id))].map((m: Monster) => {
    const srd = x.srdMonsters[m.id];
    const type = x.monsterTypes[m.id] ?? srd?.type ?? '';
    const size = L.size[m.size ?? 'M'] ?? m.size ?? '';
    const place = x.monsterPlaces[m.id];
    const immune = (srd?.conditionImmunities ?? []).map((c) => fold(c)).filter((c) => CONDITION_IDS.includes(c));
    const ab = m.abilities as unknown as Record<string, number>;
    const kat = katalogDex.has(m.id);
    const speed0 = typeof m.speed === 'number' ? L.ft(m.speed) : String(m.speed);
    // KATALOG-F2: katalog canavarında uçuş, yüzme, tırmanma ve süzülme de yazılır.
    const speed = !kat ? speed0 : [speed0, ...(m.fly ? [`${L.speedKind.fly} ${L.ft(m.fly)}`] : []), ...(m.swim ? [`${L.speedKind.swim} ${L.ft(m.swim)}`] : []),
      ...(srd?.tirmanma ? [`${L.speedKind.climb} ${L.ft(srd.tirmanma)}`] : []), ...(srd?.suzulme ? [L.speedKind.hover] : [])].join(' · ');
    return {
      cat: 'canavar', id: m.id, name: m.name, header: `${size} ${cap(type)} · CR ${m.cr}`,
      summary: { ui: L.monsterSummary(size, cap(type), m.cr, m.ac, m.hp) },
      facts: [
        ...(srd?.alignment ? [[L.fact.alignment, srd.alignment] as [string, string]] : []),
        [L.fact.ac, String(m.ac)], [L.fact.hp, String(m.hp)], [L.fact.speed, speed],
        ...(kat ? [[L.footprint, L.hexes(hexCount(m.size ?? 'M'))] as [string, string]] : []),
        [L.fact.abilities, ['str', 'dex', 'con', 'int', 'wis', 'cha'].map((k) => `${k.toUpperCase()} ${ab[k] ?? '—'}`).join(' · ')],
        ...(m.darkvision ? [[L.fact.darkvision, L.ft(m.darkvision)] as [string, string]] : []),
        ...(m.attacks?.length ? [[L.fact.attacks, m.attacks.map((a) => a.name).join(', ')] as [string, string]] : []),
      ],
      // Kuyruk A İş 4: özellik ve eylemler (ad İngilizce, açıklama Türkçe `aciklamalar-tr-canavar.json`, `loadMonsterDescriptions`); eksikte "henüz yok".
      sections: (x.monsterFeatures[m.id] ?? []).length ? [{ title: L.sec.monsterFeatures, rows: (x.monsterFeatures[m.id] ?? []).map((ft): DexRow => {
        const tr = trAciklama('canavar', ft.anahtar);
        return { name: ft.ad, tag: L.monsterKind[ft.tur] ?? ft.tur, glif: actionGlyph(ft.tur), text: tr ? { tr, en: en('canavar', ft.anahtar) } : { ui: L.noDesc } };
      }) }] : [],
      links: [
        ...immune.map((c): DexLink => ({ cat: 'durum', id: c, label: L.immuneTo(condName(c)) })),
        ...monsterSpellIds(m.id).map((s): DexLink => ({ cat: 'buyu', id: s.id, label: s.name })),
      ],
      tags: [...(place?.tema ? [L.monsterThemes[place.tema] ?? place.tema] : []), ...(place?.ortam ?? []).flatMap((o) => (x.mapNames[o] ? [x.mapNames[o]!] : []))],
      f: { cr: crBand(m.cr), type }, sort: `${String(crNum(m.cr)).padStart(6, '0')}${m.name}`,
    };
  });

  // Türler.
  const cel = celestial as unknown as { ad: { tr: string; en: string }; hikaye: { tr: string; en?: string }; ozellikler: Array<{ id: string; en: string; tr: string; metin: { tr: string; en?: string } }>;
    awakening: { minLevel: number; secenekler: Record<string, { tr: string; en: string; metin: { tr: string; en?: string }; debuff?: { tr: string; en?: string } }> } };
  const tur: DexEntry[] = races.map((r) => {
    const sp = srdSpecies.species.find((s) => s.id === r.id);
    const isCel = r.id === 'celestial';
    const rows: DexRow[] = isCel
      ? cel.ozellikler.map((o) => ({ name: o.en, text: { tr: o.metin.tr, en: en('tur', `celestial/${o.id}`) ?? o.metin.en } }))
      : (sp?.traits ?? []).map((tr) => ({ name: tr.name, text: { tr: trAciklama('tur', `${r.id}/${tr.id}`), en: en('tur', `${r.id}/${tr.id}`) } }));
    const lineages = isCel ? Object.entries(cel.awakening.secenekler).map(([id, o]) => ({ id: `celestial/${id}`, name: o.en }))
      : (r.lineages ?? []).map((l) => ({ id: `${r.id}/${l.id}`, name: l.name }));
    return {
      cat: 'tur', id: r.id, name: r.name, header: L.species,
      desc: isCel ? { tr: cel.hikaye.tr, en: cel.hikaye.en } : undefined,
      facts: [[L.fact.size, (r.sizes ?? []).map((s) => L.size[s] ?? s).join(' / ')], [L.fact.speed, L.ft(r.speed)],
        ...(r.darkvision ? [[L.fact.darkvision, L.ft(r.darkvision)] as [string, string]] : []),
        ...(r.resistances?.length ? [[L.fact.resist, r.resistances.join(', ')] as [string, string]] : [])],
      sections: [{ title: L.sec.traits, rows }],
      links: lineages.map((l): DexLink => ({ cat: 'altsoy', id: l.id, label: l.name })),
      tags: isCel ? [L.story] : [], f: {}, sort: r.name,
    };
  });

  // Alt soylar (38 tür soyu + 3 Celestial Göksel Uyanış).
  const soyMetin = (altSoyMetin as unknown as { soylar: Record<string, { buff?: Array<{ tr: string; en?: string }>; debuff?: Array<{ tr: string; en?: string }> }> }).soylar;
  const altsoy: DexEntry[] = [
    ...races.flatMap((r) => (r.lineages ?? []).map((l): DexEntry => {
      const key = `${r.id}/${l.id}`;
      const lx = l as unknown as { ad?: { tr: string; en: string }; summary?: { tr: string; en?: string }; durum?: string };
      const m = soyMetin[key];
      return {
        cat: 'altsoy', id: key, name: l.name, ...(lx.ad?.tr && lx.ad.tr !== l.name ? { alt: lx.ad.tr } : {}), header: `${L.lineageOf(r.name)}`,
        desc: lx.summary ? { tr: lx.summary.tr, en: lx.summary.en } : undefined,
        facts: [...(l.resistances?.length ? [[L.fact.resist, l.resistances.join(', ')] as [string, string]] : [])],
        sections: [
          ...(m?.buff?.length ? [{ title: L.sec.buff, rows: m.buff.map((b) => ({ name: '+', text: { tr: b.tr, en: b.en } })) }] : []),
          ...(m?.debuff?.length ? [{ title: L.sec.debuff, rows: m.debuff.map((b) => ({ name: '−', text: { tr: b.tr, en: b.en } })) }] : []),
        ],
        links: [{ cat: 'tur', id: r.id, label: r.name }], tags: lx.durum ? [L.status[lx.durum] ?? lx.durum] : [], f: { species: r.id }, sort: `${r.name}${l.name}`,
      };
    })),
    ...Object.entries(cel.awakening.secenekler).map(([id, o]): DexEntry => ({
      cat: 'altsoy', id: `celestial/${id}`, name: o.en, alt: o.tr, header: L.awakening(cel.awakening.minLevel),
      desc: { tr: o.metin.tr, en: o.metin.en },
      facts: [], sections: o.debuff ? [{ title: L.sec.debuff, rows: [{ name: '−', text: { tr: o.debuff.tr, en: o.debuff.en } }] }] : [],
      links: [{ cat: 'tur', id: 'celestial', label: 'Celestial' }], tags: [], f: { species: 'celestial' }, sort: `Celestial${o.en}`,
    })),
  ];

  // Sınıflar (Görev DX-S): 12 sınıf kartı + sınıf seçenekleri (Eldritch Invocation, Metamagic) aynı kategoride.
  const sinif = buildClasses(x, en);

  // Alt sınıflar (yüklü olanların hepsi: oyunun kendi + dış paket).
  const altsinif: DexEntry[] = classes.flatMap((c) => subclassesOf(c.id).map((s: SubclassDef): DexEntry => {
    const nm = displayName(s.name, c.id);
    return {
      cat: 'altsinif', id: s.id, name: nm.tr || nm.en || s.id, ...(nm.en && nm.en !== nm.tr ? { alt: nm.en } : {}),
      header: `${c.name} · ${s.role?.tr ?? ''}`.replace(/ · $/, ''),
      summary: s.role ? { tr: s.role.tr, en: s.role.en } : undefined,
      facts: [],
      sections: [{ title: L.sec.features, rows: s.features.map((f) => ({
        name: f.name.en || f.name.tr, level: f.level, tag: L.status[f.status] ?? f.status, glif: actionGlyph(f.effect?.type),
        text: { tr: trAciklama('altsinif', `${c.id}/${s.id}:${f.id}`) ?? f.description?.tr, en: en('altsinif', `${c.id}/${s.id}:${f.id}`) ?? f.description?.en },
      })) }],
      links: [{ cat: 'altsinif', filter: ['cls', c.id], label: L.subclassesOf(c.name) }, { cat: 'buyu', filter: ['cls', c.id], label: L.spellsOf(c.name) }]
        .filter((l) => l.cat !== 'buyu' || spells.some((sp) => spellClassIds(sp).includes(c.id))) as DexLink[],
      tags: [...(s.ev ? [L.houseRule] : []), ...(s.cinsiyet === 'kadin' ? [L.women] : s.cinsiyet === 'erkek' ? [L.men] : []),
        ...(s.features.some((f) => f.status === 'hikaye' || f.effect?.story) ? [L.story] : [])],
      f: { cls: c.id }, sort: `${c.name}${nm.tr}`,
    };
  }));

  // Feat'ler.
  const feat: DexEntry[] = allFeats().map((f) => {
    const tr = featInfo(f.id, 'tr');
    const enf = featInfo(f.id, 'en');
    return {
      cat: 'feat', id: f.id, name: f.name, header: L.featCat[f.category] ?? f.category,
      desc: tr ? { tr: `${tr.what} ${tr.example}`.trim(), en: enf ? `${enf.what} ${enf.example}`.trim() : en('feat', f.id) } : undefined,
      facts: [...(f.repeatable ? [[L.fact.repeatable, L.yes] as [string, string]] : [])],
      sections: [],
      links: backgrounds.filter((b) => b.feat === f.id).map((b): DexLink => ({ cat: 'gecmis', id: b.id, label: b.name.tr })),
      tags: [], f: { category: f.category }, sort: f.name,
    };
  });

  // Geçmişler.
  const gecmis: DexEntry[] = backgrounds.map((b) => {
    const bx = b as unknown as { ozgun?: boolean; skills?: string[]; abilities?: string[]; tool?: { tr: string; en: string }; summary?: { tr: string; en?: string } };
    const ft = allFeats().find((f) => f.id === b.feat);
    return {
      cat: 'gecmis', id: b.id, name: b.name.tr, ...(b.name.en && b.name.en !== b.name.tr ? { alt: b.name.en } : {}),
      header: bx.ozgun ? `${L.background} · ${L.original}` : L.background,
      desc: bx.summary ? { tr: bx.summary.tr, en: bx.summary.en } : undefined,
      facts: [
        ...(bx.abilities?.length ? [[L.fact.abilityBonus, bx.abilities.map((a) => a.toUpperCase()).join(', ')] as [string, string]] : []),
        ...(bx.skills?.length ? [[L.fact.skills, bx.skills.map(cap).join(', ')] as [string, string]] : []),
        ...(bx.tool ? [[L.fact.tool, bx.tool.tr] as [string, string]] : []),
      ],
      sections: [], links: ft ? [{ cat: 'feat', id: ft.id, label: ft.name }] : [], tags: [], f: {}, sort: b.name.tr,
    };
  });

  // Durumlar.
  const durum: DexEntry[] = cfg.durumlar.map((d) => ({
    cat: 'durum', id: d.id, name: d.ad, alt: (cfg.durumTr as Record<string, string>)[d.id], header: L.condition,
    desc: { tr: trAciklama('durum', d.id), en: en('durum', d.id) }, facts: [], sections: [],
    links: buyu.filter((s) => s.links.some((l) => l.cat === 'durum' && l.id === d.id)).map((s): DexLink => ({ cat: 'buyu', id: s.id, label: s.name })),
    tags: [], f: {}, sort: d.ad,
  }));

  const sortAll = (l: DexEntry[]) => l.sort((a, b) => a.sort.localeCompare(b.sort, 'en'));
  return { buyu: sortAll(buyu), esya: sortAll(esya), canavar: sortAll(canavar), tur: sortAll(tur), altsoy: sortAll(altsoy),
    sinif: sortAll(sinif), altsinif: sortAll(altsinif), feat: sortAll(feat), gecmis: sortAll(gecmis), durum: sortAll(durum) };
}

/** Kategorinin süzgeçleri (yalnız veride değeri olanlar). */
export function dexFilters(cat: DexCat, list: DexEntry[]): DexFilter[] {
  const L = t().dex;
  const vals = (key: string) => [...new Set(list.flatMap((e) => (e.f[key] ?? '').split('|').filter(Boolean)))];
  const mk = (key: string, label: string, opt: (v: string) => string, order?: (a: string, b: string) => number): DexFilter => {
    const v = vals(key);
    return { key, label, options: v.sort(order ?? ((a, b) => opt(a).localeCompare(opt(b), 'tr'))).map((value) => ({ value, label: opt(value) })) };
  };
  const num = (a: string, b: string) => Number(a) - Number(b);
  const out: DexFilter[] = [];
  if (cat === 'buyu') out.push(mk('level', L.filter.level, (v) => (v === '0' ? L.cantrip : L.level(Number(v))), num), mk('school', L.filter.school, (v) => v), mk('cls', L.filter.cls, className));
  if (cat === 'canavar') out.push(mk('cr', L.filter.cr, (v) => `CR ${v}`, (a, b) => cfg.crKademeleri.findIndex((k) => k.id === a) - cfg.crKademeleri.findIndex((k) => k.id === b)), mk('type', L.filter.type, cap));
  if (cat === 'esya') out.push(mk('kind', L.filter.kind, (v) => L.itemKind[v] ?? v));
  if (cat === 'sinif') out.push(mk('kind', L.filter.classKind, (v) => L.classKind[v] ?? v, (a, b) => CLASS_KINDS.indexOf(a) - CLASS_KINDS.indexOf(b)));
  if (cat === 'altsinif') out.push(mk('cls', L.filter.cls, className));
  if (cat === 'altsoy') out.push(mk('species', L.filter.species, (v) => races.find((r) => r.id === v)?.name ?? v));
  if (cat === 'feat') out.push(mk('category', L.filter.category, (v) => L.featCat[v] ?? v));
  return out.filter((f) => f.options.length > 1);
}

/** Arama + süzgeç. */
export function dexSearch(list: DexEntry[], query: string, sel: Record<string, string>): DexEntry[] {
  const q = fold(query.trim());
  return list.filter((e) => {
    for (const [k, v] of Object.entries(sel)) if (v && !(e.f[k] ?? '').split('|').includes(v)) return false;
    return !q || fold(e.name).includes(q) || (!!e.alt && fold(e.alt).includes(q));
  });
}

/** Sınıf kategorisindeki kayıt türleri (süzgeç sırası). */
export const CLASS_KINDS = ['class', 'invocation', 'metamagic'];
const ABILITY_IDS: Record<string, string> = { strength: 'str', dexterity: 'dex', constitution: 'con', intelligence: 'int', wisdom: 'wis', charisma: 'cha' };

/**
 * Görev DX-S: sınıf kartları ve sınıf seçenekleri. Kimlik = sınıf kimliği / Invocation kimliği / Metamagic kimliği
 * (`data/class-features.json`). Özellik adı İngilizce (SRD tablosu `data/srd/progression.json`), Türkçe açıklama
 * oluşturucuyla aynı zincirden (`featureSummary`: `aciklamalar-tr.json` `yetenek`, yoksa `aciklamalar.json` `features.tr`);
 * yoksa "açıklama yok". SRD'nin İngilizce özellik metni kullanılmaz.
 */
function buildClasses(x: DexExtras, en: (kind: string, id: string) => string | undefined): DexEntry[] {
  const L = t().dex;
  const B = t().builder;
  const A = t().abilities;
  const ab = (id: string) => A[id] ?? id.toUpperCase();
  const primary = (raw: string): string => {
    const ids = raw.split(/ or | and /).map((w) => ABILITY_IDS[w.trim().toLowerCase()]).filter((v): v is string => !!v);
    return ids.map(ab).join(/ or /.test(raw) ? L.or : L.and);
  };
  const isCaster = (id: string) => spells.some((sp) => spellClassIds(sp).includes(id));
  const out: DexEntry[] = classes.map((c) => {
    const prog = classData.progression.find((p) => p.id === c.id);
    const cx = c as unknown as { hitDie: number; saves: string[]; armorTraining: string[]; weaponProficiency: string; martialWeaponProperties: string[];
      casting: { type: string; ability: string } | null; skillChoices?: { count: number; from: string[] | 'any' } };
    const rows: DexRow[] = (prog?.rows ?? []).flatMap((r) => r.features.map((f): DexRow => {
      const key = `${c.id}:${f.id}`;
      const tr = featureSummary({ key, id: f.id, from: 'class' }, c.id, undefined, 'tr') || undefined;
      return { name: f.name, level: r.level, glif: actionGlyph(classData.mechanics.features[key]?.type), text: tr ? { tr, en: en('yetenek', key) ?? (featureSummary({ key, id: f.id, from: 'class' }, c.id, undefined, 'en') || undefined) } : { ui: L.noFeatureDesc } };
    }));
    const options: DexRow[] = Object.entries(classData.mechanics.features).filter(([k, m]) => k.startsWith(`${c.id}:`) && m.options?.length)
      .flatMap(([k, m]) => (m.options ?? []).map((o): DexRow => ({
        name: prog?.rows.flatMap((r) => r.features).find((f) => `${c.id}:${f.id}` === k)?.name ?? k, text: { ui: B.featureOption[o.id] ?? o.id },
      })));
    const weapons = cx.weaponProficiency === 'martial' ? L.weaponProf.martial
      : cx.martialWeaponProperties.length ? L.weaponProf.simplePlus(cx.martialWeaponProperties.map(cap).join(L.or)) : L.weaponProf.simple;
    const progFeatures = new Set((prog?.rows ?? []).flatMap((r) => r.features.map((f) => f.id)));
    const links: DexLink[] = [
      { cat: 'altsinif', filter: ['cls', c.id], label: L.subclassesOf(c.name) },
      ...(isCaster(c.id) ? [{ cat: 'buyu', filter: ['cls', c.id], label: L.spellsOf(c.name) } as DexLink] : []),
      ...(progFeatures.has('fighting-style') ? [{ cat: 'feat', filter: ['category', 'Fighting Style'], label: L.fightingStyles } as DexLink] : []),
      ...(progFeatures.has('eldritch-invocations') ? [{ cat: 'sinif', filter: ['kind', 'invocation'], label: L.classKind.invocation ?? '' } as DexLink] : []),
      ...(progFeatures.has('metamagic') ? [{ cat: 'sinif', filter: ['kind', 'metamagic'], label: L.classKind.metamagic ?? '' } as DexLink] : []),
      ...(progFeatures.has('epic-boon') ? [{ cat: 'feat', filter: ['category', 'Epic Boon'], label: L.featCat['Epic Boon'] ?? 'Epic Boon' } as DexLink] : []),
    ];
    return {
      cat: 'sinif', id: c.id, name: c.name, header: L.classKind.class ?? '',
      summary: { ui: L.classSummary(cx.hitDie, primary(x.classPrimary[c.id] ?? '')) },
      facts: [
        [L.fact.hitDie, `d${cx.hitDie}`],
        ...(x.classPrimary[c.id] ? [[L.fact.primary, primary(x.classPrimary[c.id]!)] as [string, string]] : []),
        [L.fact.saves, cx.saves.map(ab).join(', ')],
        [L.fact.armorTraining, cx.armorTraining.length ? cx.armorTraining.map((a) => L.armorType[a] ?? a).join(', ') : L.none],
        [L.fact.weaponProf, weapons],
        ...(cx.skillChoices ? [[L.fact.skills, L.skillChoice(cx.skillChoices.count, Array.isArray(cx.skillChoices.from) ? cx.skillChoices.from.map((k) => t().skillNames[k] ?? k).join(', ') : L.anySkill)] as [string, string]] : []),
        ...(cx.casting ? [[L.fact.spellcasting, `${L.castingType[cx.casting.type] ?? cx.casting.type} · ${ab(cx.casting.ability)}`] as [string, string]] : []),
      ],
      sections: [{ title: L.sec.classFeatures, rows }, ...(options.length ? [{ title: L.sec.classOptions, rows: options }] : [])],
      links, tags: [], f: { kind: 'class' }, sort: `0${c.name}`,
    };
  });
  const warlock = classes.find((c) => c.id === 'warlock');
  for (const inv of allInvocations()) {
    const note = (inv as unknown as { note?: string }).note;
    const req = inv.requires ? allInvocations().find((v) => v.id === inv.requires) : undefined;
    out.push({
      cat: 'sinif', id: inv.id, name: inv.name, header: `${L.classKind.invocation} · ${warlock?.name ?? 'Warlock'} ${L.level(inv.minLevel)}`,
      desc: trAciklama('invocation', inv.id) ?? note ? { tr: trAciklama('invocation', inv.id) ?? note, en: en('invocation', inv.id) } : undefined,
      facts: [[L.fact.minLevel, L.level(inv.minLevel)], ...(inv.repeatable ? [[L.fact.repeatable, L.yes] as [string, string]] : [])],
      sections: [], links: [{ cat: 'sinif', id: 'warlock', label: warlock?.name ?? 'Warlock' }, ...(req ? [{ cat: 'sinif', id: req.id, label: req.name } as DexLink] : [])],
      tags: inv.status && inv.status !== 'ok' ? [B.legend[inv.status] ?? inv.status] : [], f: { kind: 'invocation' }, sort: `1${inv.name}`,
    });
  }
  const sorcerer = classes.find((c) => c.id === 'sorcerer');
  const mm = Object.values(classData.mechanics.features).find((m) => m.metamagic)?.metamagic;
  for (const [id, cost] of Object.entries(mm?.costs ?? {})) {
    out.push({
      cat: 'sinif', id, name: B.metamagicName[id] ?? id, header: `${L.classKind.metamagic} · ${sorcerer?.name ?? 'Sorcerer'}`,
      desc: B.metamagicInfo[id] ? { ui: B.metamagicInfo[id] } : undefined,
      facts: [[L.fact.cost, B.metamagicCost(cost)]], sections: [],
      links: [{ cat: 'sinif', id: 'sorcerer', label: sorcerer?.name ?? 'Sorcerer' }], tags: [], f: { kind: 'metamagic' }, sort: `2${B.metamagicName[id] ?? id}`,
    });
  }
  return out;
}
