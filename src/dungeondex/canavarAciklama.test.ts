/**
 * Kuyruk A İş 4: canavar özellik ve eylemlerinin Türkçe açıklamaları (`data/aciklamalar-tr-canavar.json` `canavar`; liste ve adlar
 * `data/canavar-ozellik.json`, SRD 5.2.1 PDF'inden `scripts/srd-canavar-ozellik.mjs`). Kimlikler listede; kapsam; sayısal
 * tutarlılık (zar, saldırı bonusu, kurtarma DC'si `data/monsters.json` saldırı alanlarıyla); SRD İngilizce ham metni yok;
 * Dungeondex kartı açıklamayı okur, eksikte "henüz yok".
 * Görev KATALOG-F2: kadim yaratıkların listesi ayrı (`data/canavarlar-kadim.json` `ozellikler`, `scripts/katalog-f2-kadim.mjs`);
 * açıklamaları aynı dosyada. SRD listesi (330 canavar, 1318 kayıt) aynen denetlenir, kadim liste ayrıca.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { kadimMonsters, loadMonsters, monsters } from '../data';
import { looksEnglish } from '../data/aciklamaDil';
import { setLang } from '../i18n';
import { buildDex, loadDexExtras, type DexEntry } from './catalog';
import liste from '../../data/canavar-ozellik.json';
import kadimJson from '../../data/canavarlar-kadim.json';
import aciklama from '../../data/aciklamalar-tr-canavar.json';

type Feat = { anahtar: string; ad: string; tur: string };
const SRD_L = (liste as unknown as { canavarlar: Record<string, Feat[]> }).canavarlar;
const KADIM_L = (kadimJson as unknown as { ozellikler: Record<string, Feat[]> }).ozellikler;
const L: Record<string, Feat[]> = { ...SRD_L, ...KADIM_L };
const TR = ((aciklama as unknown as Record<string, Record<string, string>>).canavar ?? {});
const SRD_ALL = Object.values(SRD_L).flat();
const KADIM_ALL = Object.values(KADIM_L).flat();
const ALL = [...SRD_ALL, ...KADIM_ALL];
const slug = (s: string) => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const norm = (s: string) => s.replace(/[−–]/g, '-').replace(/\s+/g, '');

let canavar: DexEntry[];
beforeAll(async () => {
  await loadMonsters();
  setLang('tr');
  canavar = buildDex({ ...(await loadDexExtras()), mapNames: {} }).canavar;
});

describe('Canavar özellik ve eylem açıklamaları', () => {
  it('liste: 330 canavarın hepsi, kayıt kimlikleri tekil; açıklama anahtarları listede', () => {
    expect(Object.keys(SRD_L).sort()).toEqual(monsters.map((m) => m.id).sort());
    expect(SRD_ALL.length).toBe(1318);
    // KATALOG-F2: kadim liste kadim kayıtlarla aynı, SRD kimlikleriyle çakışmaz.
    expect(Object.keys(KADIM_L).sort()).toEqual(kadimMonsters.map((m) => m.id).sort());
    for (const id of Object.keys(KADIM_L)) expect(SRD_L[id], id).toBeUndefined();
    expect(new Set(ALL.map((e) => e.anahtar)).size).toBe(ALL.length);
    const keys = new Set(ALL.map((e) => e.anahtar));
    for (const k of Object.keys(TR)) expect(keys.has(k), k).toBe(true);
  });
  it('kapsam: açıklaması olan canavarın bütün özellik/eylemleri açıklamalı (parti bütünlüğü); sayı', () => {
    const covered = Object.entries(L).filter(([, l]) => l.some((e) => TR[e.anahtar]));
    for (const [id, l] of covered) for (const e of l) expect(TR[e.anahtar], `${id}: ${e.anahtar}`).toBeTruthy();
    console.log(`canavar açıklaması: ${Object.keys(TR).length}/${ALL.length} kayıt (SRD ${SRD_ALL.length}, kadim ${KADIM_ALL.length}), ${covered.length} canavar`);
    expect(Object.keys(TR).length).toBe(ALL.length);
  });
  it('sayısal tutarlılık: saldırının zarı, isabet bonusu ve kurtarma DC\'si açıklamada', () => {
    const bad: string[] = [];
    for (const m of [...monsters, ...kadimMonsters]) for (const a of m.attacks) {
      const key = L[m.id]?.find((e) => e.tur !== 'trait' && slug(e.ad.replace(/ \(.*$/, '')) === slug(a.name))?.anahtar;
      const tr = key ? TR[key] : undefined;
      if (!tr) continue;
      const t = norm(tr);
      // SRD'de zarsız sabit hasar ("Hit: 1 Piercing damage") oyun verisinde 1d2 + (N − 1) diye yaklaşıklanır; o zaman sabit sayı aranır.
      const fixed = a.damage ? /^(\d+) [A-Z]/.exec(a.damage)?.[1] : undefined;
      if (fixed) { if (!new RegExp(`(^|\\D)${fixed}(\\D|$)`).test(tr)) bad.push(`${key} sabit ${fixed}`); }
      else if (a.damageDice && /^\d+d\d+([+-]\d+)?$/.test(norm(a.damageDice)) && !t.includes(norm(a.damageDice))) bad.push(`${key} zar ${a.damageDice}`);
      if (a.save?.dc && !t.includes(`DC${a.save.dc}`)) bad.push(`${key} DC ${a.save.dc}`);
      if (!a.save && a.bonus > 0 && !t.includes(`+${a.bonus}`)) bad.push(`${key} +${a.bonus}`);
    }
    expect(bad).toEqual([]);
  });
  it('metin Türkçe; listede İngilizce SRD metni yok (yalnız ad ve tür)', () => {
    for (const [k, v] of Object.entries(TR)) expect(looksEnglish(v), k).toBe(false);
    for (const e of ALL) expect(Object.keys(e).sort()).toEqual(['ad', 'anahtar', 'tur']);
  });
  it('Dungeondex kartı: özellik/eylem satırları Türkçe açıklamalı, "henüz yok" yalnız eksikte', () => {
    const ab = canavar.find((e) => e.id === 'aboleth')!;
    const rows = ab.sections[0]!.rows;
    expect(rows.map((r) => r.name)).toContain('Tentacle');
    for (const r of rows) expect(r.text?.tr ?? r.text?.ui, r.name).toBeTruthy();
    const missing = canavar.flatMap((e) => e.sections.flatMap((s) => s.rows)).filter((r) => !r.text?.tr).length;
    expect(missing).toBe(ALL.length - Object.keys(TR).length);
  });
});
