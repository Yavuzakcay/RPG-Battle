import { describe, expect, it } from 'vitest';
import fix from '../../tests/fixtures/paket-u1a.json';
import { envanterMarkdown, ucusEnvanteri, HEDEFLER } from '../../scripts/lib/ucus-envanter.mjs';

// Kuyruk U1b Görev 0: envanter mantığı (kurgusal U1a fikstürü üstünde; paket metni çıktıya girmez).

describe('U1b uçuş envanteri', () => {
  it('fikstürdeki dört uçuş kademesini ve çağrıyı bulur; metin yazmaz', () => {
    const e = ucusEnvanteri([{ dosya: 'paket-u1a.json', data: fix }]);
    const ids = e.satirlar.map((r) => r.ozellik);
    expect(ids).toEqual(expect.arrayContaining(['kalici-kanat', 'kisa-kanat', 'suzulme', 'kirik-kanat']));
    const suzul = e.satirlar.find((r) => r.ozellik === 'suzulme')!;
    expect(suzul.ucus[0]).toMatchObject({ azamiIrtifaFt: 5, yeredegmez: true, sureDakika: 1 });
    const cagri = e.satirlar.find((r) => r.ozellik === 'ejder-cagrisi')!;
    expect(cagri.cagir).toBe(true);
    expect(cagri.ucus).toEqual([]);
    expect(e.yaratiklar).toEqual([{ dosya: 'paket-u1a.json', id: 'sis-ejderi', ucma: 60, yanlisAnahtar: false }]);
    const md = envanterMarkdown(e);
    expect(md).toContain('kalici-kanat');
    expect(md).not.toContain('Kurgusal test özelliği');
  });

  it('bilinmeyen `ucus` alanı "?" önekiyle işaretlenir; hiz.ucus yanlış anahtar olarak raporlanır', () => {
    const data = { subclasses: [{ class: 'fighter', id: 'x', name: { tr: 'X' }, features: [{ id: 'f', level: 3, name: { tr: 'F' }, ilkeller: [{ tur: 'ucus', hizz: 30 }] }] }],
      yaratiklar: [{ id: 'y', hiz: { yurume: 30, ucus: 60 } }] };
    const e = ucusEnvanteri([{ dosya: 'a.json', data }]);
    expect(e.satirlar[0]!.ucus[0]).toEqual({ '?hizz': 30 });
    expect(e.yaratiklar[0]).toMatchObject({ id: 'y', ucma: null, yanlisAnahtar: true });
  });

  it('hedef tablosu: kimlik tahmini yok, bulunamayan "bulunamadı" olur', () => {
    const data = { subclasses: [{ class: 'cleric', id: 'firtina-alani', name: { tr: 'Fırtına Alanı' }, features: [] }] };
    const e = ucusEnvanteri([{ dosya: 'ek-cleric.json', data }]);
    expect(e.hedefler.find((h) => h.ad === 'Fırtına Alanı')).toMatchObject({ bulundu: true, id: 'firtina-alani' });
    expect(e.hedefler.find((h) => h.ad === 'Pulkanat')).toMatchObject({ bulundu: false, id: null });
    expect(e.hedefler).toHaveLength(HEDEFLER.length);
  });
});
