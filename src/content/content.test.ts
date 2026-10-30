/**
 * Görev E1: jenerik alt sınıf şeması ve dış içerik yükleyici. SRD'nin 12 alt sınıfının regresyonu (şemaya taşımadan
 * önceki `gainedFeatures` + `classKit` çıktısının özeti), şema doğrulaması, yükleme, çakışma, silme ve 3. seviye kuralı.
 */
import { afterEach, describe, it, expect } from 'vitest';
import { classData } from '../data';
import srdSubclasses from '../../data/srd/subclasses.json';
import builtin from '../../data/subclasses.json';
import before from '../rules/fixtures/alt-sinif-oncesi.json';
import sample from './fixtures/ornek-paket.json';
import { classKit, gainedFeatures, subclassesOf } from '../rules/classFeatures';
import { findSubclass, setExternalSubclasses, subclassMissing } from '../rules/subclasses';
import { characterProblems } from '../rules/builder';
import { combatantFromSheet } from '../battle';
import { demoCharacters } from '../screens/fixtures';
import { effectErrors, LIMITS, parsePack, summarize, validatePack } from './schema';
import { applyStoredContent, importTexts, readStore, removePack, setPackEnabled } from './store';
import { SAVE_VERSION, restoreSession, serializeSession } from '../app/battleSave';
import { createSession } from '../ui/session';
import type { BattleState } from '../battle/types';

/** Bellek içi localStorage. */
function memStore() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); } };
}
const ctx = () => ({ taken: classData.subclasses.map((s) => s.id), packs: [] as string[] });
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const text = (x: unknown) => { const s = JSON.stringify(x); return { name: 'p.json', text: s, bytes: s.length }; };

afterEach(() => setExternalSubclasses([]));

describe('SRD alt sınıfları (data/subclasses.json)', () => {
  it('12 alt sınıf, kimlikler benzersiz, her biri ve her özelliği SRD kaydıyla eşleşir', () => {
    const list = builtin.subclasses;
    expect(list).toHaveLength(12);
    expect(new Set(list.map((s) => s.id)).size).toBe(12);
    for (const s of list) {
      const srd = srdSubclasses.subclasses.find((x) => x.id === s.id);
      expect(srd?.classId).toBe(s.class);
      expect(s.srd).toBe(`subclasses:${s.id}`);
      expect(s.features.map((f) => f.id)).toEqual(srd?.features.map((f) => f.id));
      for (const f of s.features) {
        expect(f.name.tr.length > 0 && f.name.en.length > 0 && f.description.tr.length > 0 && f.description.en.length > 0).toBe(true);
        expect(f.level).toBeGreaterThanOrEqual(1);
        expect(f.level).toBeLessThanOrEqual(20);
      }
    }
  });
  it('şemaya uyar: etkiler mevcut mekanizmalarla, "çalışır" yalnızca uygulanan etkiyle', () => {
    for (const s of classData.subclasses) {
      for (const f of s.features) {
        if (f.effect) expect(effectErrors(f.effect, `${s.id}.${f.id}`)).toEqual([]);
        const works = !!f.effect && (f.effect.status === 'ok' || f.effect.status === 'partial');
        expect(f.status === 'calisir').toBe(works);
      }
    }
  });
  it('regresyon: alt sınıflar × 1–20. seviye kazanılan özellikler ve sınıf kiti taşımadan öncekiyle birebir aynı (Görev F’nin üç sınıfı ve Görev CLERIC hariç)', async () => {
    // Özet: JSON'un SHA-256'sının ilk 16 onaltılık hanesi (Web Crypto; fikstür taşımadan önce üretildi).
    const sha = async (x: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(x))))
      .map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
    const now: Record<string, string> = {};
    for (const p of classData.progression) for (const s of p.subclasses) {
      for (let l = 1; l <= 20; l++) {
        // Görev F kite üç alan ekledi; F dışı sınıflarda varsayılan değerde olmalı, özet onlarsız (eski biçim).
        const { traits, critOn, saveProficiencies, ...kit } = classKit(p.id, l, s.id);
        if (!/^(fighter|rogue|ranger|cleric)$/.test(p.id)) expect([traits, critOn, saveProficiencies]).toEqual([[], 20, []]);
        now[`${p.id}/${s.id}@${l}`] = await sha(JSON.stringify({ gained: gainedFeatures(p.id, l, s.id), kit }));
      }
    }
    expect(Object.keys(now)).toHaveLength(240);
    // Görev F Fighter, Rogue ve Ranger'ı (ve alt sınıflarını) bilerek değiştirdi; diğer 9 sınıf birebir aynı kalmalı.
    // Görev CLERIC Cleric'i (Life Domain dahil) bilerek değiştirdi.
    const changed = /^(fighter|rogue|ranger|cleric)\//;
    const keep = (x: Record<string, string>) => Object.fromEntries(Object.entries(x).filter(([k]) => !changed.test(k)));
    expect(Object.keys(keep(now))).toHaveLength(160);
    expect(keep(now)).toEqual(keep(before));
  });
});

describe('paket şeması', () => {
  it('örnek kurgusal paket geçerli; özet alt sınıf başına durum sayıları', () => {
    const r = validatePack(sample, ctx());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.pack.subclasses.every((s) => s.pack === 'ornek-kurgusal')).toBe(true);
    expect(summarize(r.pack)).toEqual({
      id: 'ornek-kurgusal', notWorking: 2,
      subclasses: [
        { id: 'kehribar-muhafizi', class: 'fighter', features: 4, counts: { calisir: 1, planli: 1, hikaye: 1, calismiyor: 1 } },
        { id: 'sis-yolcusu', class: 'rogue', features: 2, counts: { calisir: 1, planli: 0, hikaye: 0, calismiyor: 1 } },
      ],
    });
  });
  it('bozuk JSON, büyük dosya, yanlış biçim hata olarak döner (fırlatmaz)', () => {
    expect(parsePack('{ bozuk', 7, ctx())).toMatchObject({ ok: false, errors: [{ code: 'json' }] });
    expect(parsePack('{}', LIMITS.fileBytes + 1, ctx())).toMatchObject({ ok: false, errors: [{ code: 'size' }] });
    expect(validatePack([], ctx())).toMatchObject({ ok: false, errors: [{ code: 'format' }] });
    expect(validatePack(null, ctx()).ok).toBe(false);
  });
  it('eksik alan, seviye aralığı, bilinmeyen sınıf, bilinmeyen etki, durum uyuşmazlığı, sınırlar', () => {
    const bad = clone(sample) as unknown as { subclasses: Array<Record<string, unknown> & { features: Array<Record<string, unknown>> }> };
    const s0 = bad.subclasses[0] as (typeof bad.subclasses)[number];
    const s1 = bad.subclasses[1] as (typeof bad.subclasses)[number];
    delete s0.role;
    (s0.features[0] as Record<string, unknown>).level = 25;
    (s0.features[1] as { effect: Record<string, unknown> }).effect.ucmak = true;
    (s0.features[2] as Record<string, unknown>).status = 'calisir';
    s1.class = 'sihirbaz';
    (s1.features[0] as { effect: Record<string, unknown> }).effect.resource = 'yok-boyle-kaynak';
    const r = validatePack(bad, ctx());
    expect(r.ok).toBe(false);
    if (r.ok) return;
    const codes = r.errors.map((e) => `${e.code}:${e.path}`);
    expect(codes).toEqual(expect.arrayContaining([
      'field:$.subclasses[0].role', 'level:$.subclasses[0].features[0].level', 'unknownEffect:$.subclasses[0].features[1].effect.ucmak',
      'effectStatus:$.subclasses[0].features[2].status', 'unknownClass:$.subclasses[1].class', 'effectValue:$.subclasses[1].features[0].effect.resource',
    ]));
    const many = clone(sample) as { subclasses: unknown[] };
    many.subclasses = Array.from({ length: LIMITS.subclasses + 1 }, (_, i) => ({ ...(sample.subclasses[0] as object), id: `alt-${i}` }));
    expect(validatePack(many, ctx())).toMatchObject({ ok: false, errors: expect.arrayContaining([expect.objectContaining({ code: 'subclassCount' })]) });
  });
  it('kimlik çakışması: SRD alt sınıfı, aynı paket içinde, yüklü paket', () => {
    const srd = clone(sample) as { subclasses: Array<{ id: string }> };
    (srd.subclasses[0] as { id: string }).id = 'champion';
    expect(validatePack(srd, ctx())).toMatchObject({ ok: false, errors: [expect.objectContaining({ code: 'idTaken', detail: 'champion' })] });
    const dup = clone(sample) as { subclasses: Array<{ id: string }> };
    (dup.subclasses[1] as { id: string }).id = 'kehribar-muhafizi';
    expect(validatePack(dup, ctx())).toMatchObject({ ok: false, errors: [expect.objectContaining({ code: 'duplicate' })] });
    expect(validatePack(sample, { ...ctx(), packs: ['ornek-kurgusal'] })).toMatchObject({ ok: false, errors: [expect.objectContaining({ code: 'packTaken' })] });
  });
});

describe('yükleme, açma/kapama, silme', () => {
  it('içe aktarılan alt sınıf normal alt sınıf gibi görünür; ikinci kez yükleme reddedilir', () => {
    const s = memStore();
    expect(importTexts([text(sample)], s)).toEqual([{ file: 'p.json', ok: true, packId: 'ornek-kurgusal', errors: [] }]);
    expect(subclassesOf('fighter').map((x) => x.id)).toEqual(['champion', 'kehribar-muhafizi']);
    expect(findSubclass('rogue', 'sis-yolcusu')?.pack).toBe('ornek-kurgusal');
    const again = importTexts([text(sample)], s);
    expect(again[0]).toMatchObject({ ok: false, errors: expect.arrayContaining([expect.objectContaining({ code: 'packTaken' })]) });
    expect(readStore(s)).toHaveLength(1);
    // Bozuk dosya diğerlerini bozmaz.
    expect(importTexts([{ name: 'x.json', text: '{', bytes: 1 }], s)[0]).toMatchObject({ ok: false, errors: [{ code: 'json' }] });
    expect(readStore(s)).toHaveLength(1);
  });
  it('3. seviye kuralı: etkin seviye max(özellik seviyesi, 3); etki motorda (hız +5, uzmanlık +1)', () => {
    importTexts([text(sample)], memStore());
    expect(gainedFeatures('fighter', 2, 'kehribar-muhafizi').some((f) => f.from === 'subclass')).toBe(false);
    const l3 = gainedFeatures('fighter', 3, 'kehribar-muhafizi').filter((f) => f.from === 'subclass');
    expect(l3.map((f) => [f.id, f.level])).toEqual([['muhafiz-yemini', 3], ['kehribar-adimi', 3]]);
    expect(gainedFeatures('fighter', 10, 'kehribar-muhafizi').filter((f) => f.from === 'subclass').map((f) => f.id))
      .toEqual(['muhafiz-yemini', 'kehribar-adimi', 'kehribar-kalkani', 'kehribar-cagrisi']);
    expect(classKit('rogue', 3, 'sis-yolcusu').expertise).toBe(classKit('rogue', 3).expertise + 1);
    const bor = demoCharacters()[1]?.sheet as NonNullable<ReturnType<typeof demoCharacters>[number]>['sheet'];
    const plain = combatantFromSheet({ ...bor, level: 3, subclassId: 'champion' }, { id: 'a', ownerId: 'p' });
    const amber = combatantFromSheet({ ...bor, level: 3, subclassId: 'kehribar-muhafizi' }, { id: 'a', ownerId: 'p' });
    expect(amber.speed).toBe(plain.speed + 5);
  });
  it('kapatılan ya da silinen içerik: karakter bozulmaz, "içerik eksik", alt sınıf özelliksiz savaşa girer', () => {
    const s = memStore();
    importTexts([text(sample)], s);
    const c = demoCharacters()[1] as NonNullable<ReturnType<typeof demoCharacters>[number]>;
    const ch = { ...c, sheet: { ...c.sheet, subclassId: 'kehribar-muhafizi' } };
    expect(subclassMissing('fighter', 'kehribar-muhafizi')).toBe(false);
    setPackEnabled('ornek-kurgusal', false, s);
    expect(subclassMissing('fighter', 'kehribar-muhafizi')).toBe(true);
    setPackEnabled('ornek-kurgusal', true, s);
    expect(subclassMissing('fighter', 'kehribar-muhafizi')).toBe(false);
    removePack('ornek-kurgusal', s);
    expect(readStore(s)).toEqual([]);
    expect(subclassMissing('fighter', 'kehribar-muhafizi')).toBe(true);
    expect(characterProblems(ch)).toEqual(characterProblems(c));
    expect(ch.sheet.subclassId).toBe('kehribar-muhafizi');
    const fighter = combatantFromSheet(ch.sheet, { id: 'a', ownerId: 'p' });
    expect(fighter.hp).toBeGreaterThan(0);
    expect(gainedFeatures('fighter', ch.sheet.level, 'kehribar-muhafizi').some((f) => f.from === 'subclass')).toBe(false);
  });
  it('kayıtlı içerik açılışta yeniden doğrulanır; bozuk kayıt boş liste', () => {
    const s = memStore();
    s.setItem('rpg-battle-icerik', '{ bozuk');
    expect(applyStoredContent(s)).toEqual([]);
    importTexts([text(sample)], s);
    setExternalSubclasses([]);
    expect(applyStoredContent(s).map((r) => [r.pack.id, r.errors.length])).toEqual([['ornek-kurgusal', 0]]);
    expect(findSubclass('fighter', 'kehribar-muhafizi')).toBeDefined();
  });
});

describe('kayıt sürümü', () => {
  it('17: açık dış içerik paketleri kayda yazılır; eksik paket bildirilir, savaş yine yüklenir; eski (16) kayıt yüklenir', () => {
    expect(SAVE_VERSION).toBeGreaterThanOrEqual(17);
    const state = { status: 'active' } as unknown as BattleState;
    const s = memStore();
    importTexts([text(sample)], s);
    const started = JSON.parse(serializeSession(createSession(state, []))) as { content?: string[] };
    expect(started.content).toEqual(['ornek-kurgusal']);
    const file = JSON.stringify({ version: 17, savedAt: '', content: ['ornek-kurgusal'], events: [{ type: 'battle_started', state: minimalState() }] });
    removePack('ornek-kurgusal', s);
    expect(restoreSession(file)).toMatchObject({ ok: true, missingContent: ['ornek-kurgusal'] });
    expect(restoreSession(JSON.stringify({ version: 16, savedAt: '', events: [{ type: 'battle_started', state: minimalState() }] })).ok).toBe(true);
  });
});

/** Kayıt testi için en küçük savaş durumu (yalnızca bir karakter). */
function minimalState(): BattleState {
  const c = demoCharacters()[1] as NonNullable<ReturnType<typeof demoCharacters>[number]>;
  const pc = combatantFromSheet(c.sheet, { id: 'pc1', ownerId: 'p1' });
  return { id: 'k', environmentId: 'duz', round: 1, turnIndex: 0, order: ['pc1'], status: 'active', combatants: { pc1: pc } } as unknown as BattleState;
}

