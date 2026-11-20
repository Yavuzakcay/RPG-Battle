/**
 * Dungeondex (harita/belgeler/DUNGEONDEX-TASARIM.md): kayıt sayıları, kimlikler = SRD kimlikleri (yeni kimlik yok),
 * Türkçe açıklama kapsamı, SRD ham metni gösterilmez, EN arayüzde Türkçe metin + "yalnız Türkçe" notu, arama/süzgeç
 * ve ekranın sunucu çizimi (kategori, kart, Lisanslar ve atıf).
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { armor, classes, items, loadMonsters, monsters, races, spells, weapons } from '../data';
import { subclassesOf } from '../rules/classFeatures';
import { looksEnglish } from '../data/aciklamaDil';
import { setLang, t } from '../i18n';
import { APP_NAME } from '../app/appName';
import { buildDex, dexFilters, dexSearch, loadDexExtras, shownText, CLASS_KINDS, CONDITION_IDS, DEX_CATS, DEX_VISIBLE_FILTERS, type DexCat, type DexEntry, type DexExtras } from './catalog';
import { Dungeondex, type DexView } from '../screens/Dungeondex';
import srdMonsters from '../../data/srd/monsters.json';
import srdClasses from '../../data/srd/classes.json';
import { allInvocations } from '../rules/invocations';
import { classData } from '../data';
import notice from '../../NOTICE?raw';

let extras: Omit<DexExtras, 'mapNames'>;
let dex: Record<DexCat, DexEntry[]>;
beforeAll(async () => {
  await loadMonsters();
  extras = await loadDexExtras();
  setLang('tr');
  dex = buildDex({ ...extras, mapNames: {} });
});
const html = (initial: DexView) => renderToStaticMarkup(<Dungeondex onBack={() => {}} extras={extras} initial={initial} />);

describe('Dungeondex kataloğu', () => {
  it('kategori sayıları ve kimlikler mevcut kayıtlarla aynı', () => {
    // Görev DX-S: Sınıflar kategorisi eklendi (9 → 10).
    expect(DEX_CATS).toHaveLength(10);
    expect(dex.buyu.map((e) => e.id).sort()).toEqual(spells.map((s) => s.id).sort());
    expect(dex.buyu).toHaveLength(339);
    expect(dex.canavar).toHaveLength(330);
    for (const e of dex.canavar) expect((srdMonsters.monsters as Record<string, unknown>)[e.id], e.id).toBeDefined();
    const armorCount = armor.filter((a) => (a as { srd?: string }).srd).length;
    expect(dex.esya).toHaveLength(items.length + weapons.length + armorCount);
    expect(dex.tur.map((e) => e.id).sort()).toEqual(races.map((r) => r.id).sort());
    expect(dex.altsoy).toHaveLength(41);
    expect(dex.feat).toHaveLength(17);
    expect(dex.gecmis).toHaveLength(12);
    expect(dex.durum.map((e) => e.id).sort()).toEqual([...CONDITION_IDS].sort());
    // Yüklü her alt sınıf görünür (bulutta fikstür + bizim; yerelde 120).
    expect(dex.altsinif.map((e) => e.id).sort()).toEqual(classes.flatMap((c) => subclassesOf(c.id).map((s) => s.id)).sort());
    for (const c of DEX_CATS) expect(new Set(dex[c].map((e) => e.id)).size, c).toBe(dex[c].length);
  });
  it('Türkçe açıklama kapsamı; SRD İngilizce ham metni hiçbir kartta yok', () => {
    for (const c of ['buyu', 'altsoy', 'feat', 'gecmis', 'durum'] as const) for (const e of dex[c]) expect(e.desc?.tr, `${c}/${e.id}`).toBeTruthy();
    for (const e of dex.esya) expect(e.desc?.tr ?? e.desc?.ui, e.id).toBeTruthy();
    for (const e of dex.canavar) expect(e.summary?.ui, e.id).toBeTruthy();
    for (const e of dex.altsinif) for (const r of e.sections[0]!.rows) expect(r.text?.tr, `${e.id}/${r.name}`).toBeTruthy();
    const raw = new Set([...spells.map((s) => s.text), ...items.map((i) => i.text)].filter((x) => x && x.length > 30));
    for (const c of DEX_CATS) for (const e of dex[c]) {
      for (const d of [e.desc, e.summary, e.extra, ...e.sections.flatMap((s) => s.rows.map((r) => r.text))]) {
        if (!d?.tr) continue;
        expect(raw.has(d.tr), `${c}/${e.id} ham metin`).toBe(false);
        expect(looksEnglish(d.tr), `${c}/${e.id} İngilizce`).toBe(false);
      }
    }
  });
  // Görev EN-ACIKLAMA: EN karşılığı (data/aciklamalar-en.json) artık var; yoksa Türkçe metin + "yalnız Türkçe" notu.
  it('EN arayüz: EN metni varsa o; yoksa Türkçe metin + "yalnız Türkçe" notu', () => {
    const fb = dex.buyu.find((e) => e.id === 'fireball')!;
    expect(shownText(fb.desc, 'tr')).toEqual({ text: fb.desc!.tr, trOnly: false });
    expect(shownText(fb.desc, 'en')).toEqual({ text: fb.desc!.en, trOnly: false });
    expect(fb.desc!.en).toMatch(/8d6 Fire damage/);
    expect(shownText({ tr: 'a' }, 'en')).toEqual({ text: 'a', trOnly: true });
    expect(shownText({ tr: 'a', en: 'b' }, 'en')).toEqual({ text: 'b', trOnly: false });
  });
  it('arama (TR ve EN ad, aksan duyarsız) ve süzgeçler', () => {
    expect(dexSearch(dex.buyu, 'FIREBALL', {}).map((e) => e.id)).toContain('fireball');
    expect(dexSearch(dex.durum, 'sağır', {}).map((e) => e.id)).toEqual(['deafened']);
    expect(dexSearch(dex.durum, 'SAGIR', {}).map((e) => e.id)).toEqual(['deafened']);
    expect(dexSearch(dex.buyu, '', { level: '3' }).every((e) => e.f.level === '3')).toBe(true);
    expect(dexSearch(dex.buyu, '', { cls: 'wizard' }).length).toBeGreaterThan(50);
    expect(dexSearch(dex.canavar, '', { type: 'dragon' }).length).toBeGreaterThan(10);
    expect(dexSearch(dex.esya, '', { kind: 'weapon' })).toHaveLength(weapons.length);
    const sf = dexFilters('buyu', dex.buyu);
    expect(sf.map((f) => f.key)).toEqual(['level', 'school', 'cls']);
    expect(sf[0]!.options).toHaveLength(10);
    expect(dexFilters('canavar', dex.canavar).map((f) => f.key)).toEqual(['cr', 'type']);
    for (const c of DEX_CATS) expect(dexFilters(c, dex[c]).length).toBeLessThanOrEqual(DEX_VISIBLE_FILTERS);
  });
  it('bağlantılar yalnız var olan kayıtlara', () => {
    for (const c of DEX_CATS) for (const e of dex[c]) for (const l of e.links) if (l.id) expect(dex[l.cat].some((x) => x.id === l.id), `${e.id} → ${l.cat}/${l.id}`).toBe(true);
    expect(dex.canavar.find((e) => e.id === 'adult-black-dragon')!.links.some((l) => l.cat === 'buyu')).toBe(true);
    expect(dex.canavar.find((e) => e.id === 'aboleth')!.facts.some(([, v]) => v === 'Lawful Evil')).toBe(true);
  });
});

describe('Dungeondex ekranı', () => {
  it('kategori listesi ve Lisanslar ve atıf', () => {
    const m = html({ cat: null, id: null });
    for (const c of DEX_CATS) expect(m).toContain(`dex-cat-${c}`);
    const lic = html({ cat: 'lisans', id: null });
    expect(lic).toContain('Creative Commons Attribution 4.0');
    expect(lic).toContain(APP_NAME.replace('&', '&amp;'));
    expect(notice).toContain('SRD 5.2.1');
  });
  it('kayıt kartı: ad İngilizce, açıklama Türkçe, bağlantılar; EN arayüzde İngilizce açıklama', () => {
    const m = html({ cat: 'buyu', id: 'fireball' });
    expect(m).toContain('data-testid="dex-card"');
    expect(m).toContain('Fireball');
    expect(m).toContain('8d6');
    expect(m).not.toContain('srdPage');
    setLang('en');
    try {
      dex = buildDex({ ...extras, mapNames: {} });
      const e = html({ cat: 'buyu', id: 'fireball' });
      expect(e).toContain('8d6 Fire damage');
      expect(e).not.toContain(t().common.descTrOnly);
      expect(e).toContain('Spells');
    } finally { setLang('tr'); }
  });
  it('alt sınıf listesi: yüklü sayı beklenenin altındaysa "içerik eksik" notu, çökmez', () => {
    const m = html({ cat: 'altsinif', id: null });
    if (dex.altsinif.length < 120) expect(m).toContain('İçerik eksik');
    else expect(m).not.toContain('İçerik eksik');
  });
});

describe('Dungeondex: Sınıflar kategorisi (Görev DX-S)', () => {
  beforeAll(() => { setLang('tr'); dex = buildDex({ ...extras, mapNames: {} }); });
  const kind = (k: string) => dex.sinif.filter((e) => e.f.kind === k);
  it('12 sınıf + Eldritch Invocation + Metamagic kayıtları; kimlikler veriden', () => {
    expect(kind('class')).toHaveLength(12);
    expect(kind('class').map((e) => e.id).sort()).toEqual(classes.map((c) => c.id).sort());
    expect(kind('invocation').map((e) => e.id).sort()).toEqual(allInvocations().map((v) => v.id).sort());
    const mm = Object.values(classData.mechanics.features).find((m) => m.metamagic)?.metamagic;
    expect(kind('metamagic').map((e) => e.id).sort()).toEqual(Object.keys(mm?.costs ?? {}).sort());
    expect(dex.sinif).toHaveLength(12 + allInvocations().length + Object.keys(mm?.costs ?? {}).length);
    expect(dexFilters('sinif', dex.sinif).map((f) => f.key)).toEqual(['kind']);
    expect(dexFilters('sinif', dex.sinif)[0]!.options.map((o) => o.value)).toEqual(CLASS_KINDS);
  });
  it('sınıf kartı: zar, birincil yetenek, kurtarma, zırh/silah; seviye 1–20 özellikleri SRD tablosundan; bağlantılar', () => {
    const b = dex.sinif.find((e) => e.id === 'barbarian')!;
    const facts = Object.fromEntries(b.facts);
    expect(facts['Can zarı']).toBe('d12');
    expect(facts['Birincil yetenek']).toBe('Güç (STR)');
    expect(facts['Kurtarma yetkinlikleri']).toBe('Güç (STR), Dayanıklılık (CON)');
    expect(dex.sinif.find((e) => e.id === 'fighter')!.facts.find(([k]) => k === 'Birincil yetenek')?.[1]).toBe('Güç (STR) ya da Çeviklik (DEX)');
    for (const c of classData.progression) {
      const e = dex.sinif.find((x) => x.id === c.id)!;
      const rows = e.sections[0]!.rows;
      expect(rows.length, c.id).toBe(c.rows.reduce((n, r) => n + r.features.length, 0));
      expect(Math.max(...rows.map((r) => r.level ?? 0)), c.id).toBe(20);
      expect(e.links.some((l) => l.cat === 'altsinif' && l.filter?.[1] === c.id), c.id).toBe(true);
    }
    expect(dex.sinif.find((e) => e.id === 'wizard')!.links.some((l) => l.cat === 'buyu')).toBe(true);
    expect(b.links.some((l) => l.cat === 'buyu')).toBe(false);
    expect(dex.sinif.find((e) => e.id === 'fighter')!.links.some((l) => l.cat === 'feat' && l.filter?.[1] === 'Fighting Style')).toBe(true);
    expect(dex.sinif.find((e) => e.id === 'warlock')!.links.some((l) => l.filter?.[1] === 'invocation')).toBe(true);
    expect(dex.sinif.find((e) => e.id === 'sorcerer')!.links.some((l) => l.filter?.[1] === 'metamagic')).toBe(true);
    // Bağlantılı alt sınıflar: süzgeç o sınıfın yüklü alt sınıflarının hepsini verir.
    expect(dexSearch(dex.altsinif, '', { cls: 'warlock' }).map((e) => e.id).sort()).toEqual(subclassesOf('warlock').map((s) => s.id).sort());
  });
  it('açıklama kapsamı: her özellik satırında Türkçe açıklama ya da "Açıklama yok"; eksikler yalnız genel yer tutucular', () => {
    const missing: string[] = [];
    for (const e of kind('class')) for (const r of e.sections[0]!.rows) {
      expect(r.text?.tr ?? r.text?.ui, `${e.id}/${r.name}`).toBeTruthy();
      if (!r.text?.tr) missing.push(`${e.id}/${r.name}`);
    }
    // 12 sınıf × (alt sınıf seçimi, Ability Score Improvement, alt sınıf özelliği, Epic Boon) = 48; bunlar kartta "Açıklama yok".
    const generic = /Subclass$|Ability Score Improvement|Subclass feature|Epic Boon/;
    expect(missing.filter((m) => !generic.test(m))).toEqual([]);
    console.log(`DX-S sınıf özelliği açıklaması yok: ${missing.length} satır, ${new Set(missing).size} benzersiz özellik`);
    for (const e of kind('invocation')) expect(e.desc?.tr, e.id).toBeTruthy();
    for (const e of kind('metamagic')) expect(e.desc?.ui, e.id).toBeTruthy();
  });
  it('SRD İngilizce ham metni ve sayfa numarası yok', () => {
    const raw = (srdClasses.classes as Array<{ features: Array<{ text?: string }>; source: { page: number } }>).flatMap((c) => c.features.map((f) => f.text ?? ''))
      .filter((x) => x.length > 30).map((x) => x.slice(0, 40));
    // Görev EN-ACIKLAMA: `en` alanı SRD İngilizce metnini taşıyabilir (EN arayüz); Türkçe alanlarda ham metin yok.
    const all = JSON.stringify(dex.sinif, (k, v) => (k === 'en' ? undefined : v));
    for (const r of raw) expect(all.includes(r), r).toBe(false);
    expect(all).not.toMatch(/"(page|source|srdPage)"/);
    for (const e of dex.sinif) for (const d of [e.desc, e.summary, ...e.sections.flatMap((s) => s.rows.map((r) => r.text))]) {
      if (d?.tr) expect(looksEnglish(d.tr), `${e.id} İngilizce`).toBe(false);
    }
    const m = html({ cat: 'sinif', id: 'barbarian' });
    expect(m).toContain('Rage');
    expect(m).not.toMatch(/s\. ?\d{2,3}\b|page \d/i);
  });
  it('EN arayüz: başlıklar İngilizce, açıklamalar İngilizce', () => {
    setLang('en');
    try {
      dex = buildDex({ ...extras, mapNames: {} });
      const m = html({ cat: 'sinif', id: 'barbarian' });
      expect(m).toContain('Hit Point Die');
      expect(m).not.toContain(t().common.descTrOnly);
      expect(m).toContain('Classes');
    } finally { setLang('tr'); dex = buildDex({ ...extras, mapNames: {} }); }
  });
});
