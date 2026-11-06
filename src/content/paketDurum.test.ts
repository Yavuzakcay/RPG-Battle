// Kuyruk K58 G8: PAKET-DURUM sayıları check:icerik (summarize) ile aynı; paket metni (açıklama) belgeye girmez;
// PAKET-SIGMAYAN satırları kısmi nedenine bağlanır. Kurgusal fikstürler (tests/fixtures/paket-*.json).
import { describe, expect, it } from 'vitest';
import { classData, monsters } from '../data';
import { parsePack, summarize, type ContentPack } from './schema';
import { paketDurum, paketDurumMd, sigmayanReasons } from './paketDurum';

const files = import.meta.glob('../../tests/fixtures/paket-*.json', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;

function load(): Array<{ pack: ContentPack; raw: unknown }> {
  const taken = classData.subclasses.map((s) => s.id);
  const ids: string[] = [];
  const out: Array<{ pack: ContentPack; raw: unknown }> = [];
  for (const k of Object.keys(files).sort()) {
    const text = files[k] as string;
    const r = parsePack(text, text.length, { taken, packs: ids, monsterIds: new Set(monsters.map((m) => m.id)) });
    if (!r.ok) continue;
    ids.push(r.pack.id); taken.push(...r.pack.subclasses.map((s) => s.id));
    out.push({ pack: r.pack, raw: JSON.parse(text) });
  }
  return out;
}

describe('PAKET-DURUM', () => {
  it('sayılar summarize (check:icerik) ile aynı, satır sayısı özellik sayısı', () => {
    const packs = load();
    expect(packs.length).toBeGreaterThan(3);
    const d = paketDurum(packs);
    const want = { calisir: 0, kismi: 0, calismiyor: 0, planli: 0, hikaye: 0 };
    for (const p of packs) for (const s of summarize(p.pack).subclasses) for (const k of Object.keys(want) as Array<keyof typeof want>) want[k] += s.counts[k];
    expect(d.totals).toEqual(want);
    expect(d.rows.length).toBe(Object.values(want).reduce((a, b) => a + b, 0));
    expect(d.rows.filter((r) => r.status === 'kismi').every((r) => !!r.reason)).toBe(true);
  });
  it('paket metni (açıklama) belgeye girmez', () => {
    const packs = load();
    const md = paketDurumMd(paketDurum(packs), packs.length);
    for (const p of packs) for (const s of p.pack.subclasses) for (const f of s.features) {
      const tr = typeof f.description === 'string' ? f.description : f.description.tr;
      if (tr && tr.length > 20) expect(md.includes(tr), `${s.id}/${f.id}`).toBe(false);
    }
  });
  it('PAKET-SIGMAYAN satırı kısmi nedenine bağlanır', () => {
    const md = '| Özellik | Sınıf / alt sınıf / sv | İlkel | Kalan yaklaşıklık |\n|---|---|---|---|\n| Örnek Vuruş | fighter / ornek-yol / 3 | `ekHasar` | Yalnız yakın dövüş |\n| Tam | rogue / x / 1 | y | — |';
    const m = sigmayanReasons(md);
    expect(m.get('ornek-yol|Örnek Vuruş')).toBe('Yalnız yakın dövüş');
    expect(m.has('x|Tam')).toBe(false);
  });
});
