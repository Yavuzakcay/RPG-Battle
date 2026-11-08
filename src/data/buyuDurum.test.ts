// Kuyruk K58 G7: 339 büyünün durumu (BUYU-KISMI ile aynı ölçüt). Kısmi ve yok sıfır ya da izin listesinde; GM notlu ve
// kapsam dışı notluların "oyuna uyar mı" kararı yazılı; BUYU-DURUM.md güncel (`node scripts/buyu-denetimi.mjs`).
import { describe, expect, it } from 'vitest';
import { durumRows } from '../../scripts/lib/buyu-durum.mjs';
import srdFile from '../../data/srd/spells.json';
import s03 from '../../data/spells.json';
import s45 from '../../data/spells-45.json';
import s69 from '../../data/spells-69.json';
import notes from '../../data/buyu-durum-notlari.json';

const doc = Object.values(import.meta.glob('../../harita/belgeler/BUYU-DURUM.md', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>)[0] ?? '';
/** Bilerek kısmi/yok bırakılanlar (gerekçesi DECISIONS.md'de). Şu an yok. */
const ALLOWED: string[] = [];

type Row = { id: string; level: number; durum: string; gm?: string; kapsam?: string };
const rows = durumRows((srdFile as { spells: Array<{ id: string; name: string; level: number }> }).spells,
  [...s03, ...s45, ...s69] as unknown as Array<Record<string, unknown>>) as Row[];

describe('BUYU-DURUM', () => {
  it('339 = savaşta 225 + savaş dışı 114; kısmi ve yok sıfır ya da listede', () => {
    expect(rows.length).toBe(339);
    expect(rows.filter((r) => r.durum === 'savaş dışı').length).toBe(114); // Kuyruk G6: Animal Shapes ve Enhance Ability savaş dışı (kullanıcı kararı)
    expect(rows.filter((r) => r.durum !== 'savaş dışı').length).toBe(225);
    const open = rows.filter((r) => (r.durum === 'kısmi' || r.durum === 'yok') && !ALLOWED.includes(r.id)).map((r) => r.id);
    expect(open).toEqual([]);
  });
  it('Game Master notlu ve kapsam dışı notluların kararı yazılı', () => {
    const N = (notes as { notlar: Record<string, { uyar: string; neden: string }> }).notlar;
    const need = rows.filter((r) => r.gm !== undefined || r.kapsam).map((r) => r.id);
    // Kuyruk K67c: sayı veriye bağlı (sürüme bağlanamaz): K67b'de Dancing Lights'ın kapsam dışı notu kalktı (dört ışık + birleşik biçim): 29 → 28.
    // Kuyruk K68a: Sleet Storm'un kapsam dışı notu kalktı (40 ft silindir): 28 → 27.
    expect(need.length).toBe(27); // Kuyruk K67a: Faerie Fire'ın kapsam dışı notu kalktı (loş ışık uygulandı); Kuyruk G6: Fear ve Beacon kapsam dışından çıktı; Animal Shapes/Enhance Ability savaş dışı; K64a: PfEG (ele geçirme uygulandı)
    for (const id of need) { expect(N[id], id).toBeDefined(); expect(['evet', 'kismen', 'hayir']).toContain(N[id]?.uyar); }
  });
  it('belge güncel', () => {
    expect(doc).toContain(`| **Toplam** | ${['çalışır', 'kısmi', 'yok', 'savaş dışı'].map((s) => rows.filter((r) => r.durum === s).length).join(' | ')} | 339 |`);
    expect(doc).not.toContain('**bulunamadı**');
  });
});
