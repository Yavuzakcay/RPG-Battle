/**
 * Kuyruk 44b: Liman 12. yerleşim; kıta ızgarası (data/kita-izgara.json) tek tablo; kıta sayfasında yerleşim simgeleri.
 */
import { describe, expect, it } from 'vitest';
import { SERUVEN } from '../journey/seruven';
import { KITA_IZGARA, hucreKonum, yerlesimIkonu } from '../journey/kitaIzgara';
import { getMap } from '../map/maps';
import { YERLESIM, yerlesimById } from './yerlesim';
import { dugumHedefi, sehirGorunumu } from './sehirGorunum';

describe('Kuyruk 44b: Liman', () => {
  it('12 yerleşim kaydı; Liman kendi kaydı (kasaba şablonu, kopya değil), haritası gerçek', () => {
    expect(YERLESIM.yerlesimler).toHaveLength(12);
    const l = yerlesimById('liman')!;
    expect([l.tr, l.en, l.sablon, l.kopya]).toEqual(['Liman', 'Harbour', 'kasaba', undefined]);
    expect(l.haritalar.map((h) => h.id)).toEqual(['liman-meydan']);
    for (const h of l.haritalar) expect(getMap(h.mapId, { variantId: h.variantId }).id).toBe(h.mapId);
  });
  it('şehir görünümü yer tutucu: düğümler `liman/<bina>`, komsular boş; Taverna NPC, Demirci Yakında (oynanabilir değil)', () => {
    const g = sehirGorunumu('liman')!;
    expect(g.yerTutucu).toBe(true);
    expect(g.gorsel).toBeUndefined();
    const l = yerlesimById('liman')!;
    for (const n of g.dugumler) {
      expect(n.id.startsWith('liman/')).toBe(true);
      expect(n.komsular).toEqual([]);
    }
    const by = (id: string) => dugumHedefi(l, g.dugumler.find((n) => n.id === `liman/${id}`)!);
    expect(by('taverna')).toEqual({ tur: 'npc' });
    expect(by('demirci')).toEqual({ tur: 'yakinda' });
    expect(by('han')).toEqual({ tur: 'hizmet', hizmet: 'han' });
    expect(by('liman-meydani')).toEqual({ tur: 'harita', harita: 'liman-meydan' });
    expect(by('dis-kapi')).toEqual({ tur: 'hizmet', hizmet: 'cikis' });
  });
});

describe('Kuyruk 44b: kıta ızgarası', () => {
  const nodes = SERUVEN.pages.flatMap((p) => p.nodes.filter((n) => n.yerlesim).map((n) => ({ page: p.id, node: n.id, yerlesim: n.yerlesim! })));
  it('her yerleşimin tabloda kaydı var; hücreler ızgarada ve benzersiz', () => {
    const cells: string[] = [];
    for (const y of YERLESIM.yerlesimler) {
      const e = KITA_IZGARA.yerlesimler[y.id];
      expect(e, y.id).toBeTruthy();
      if (e!.hucre) {
        expect(hucreKonum(e!.hucre), `${y.id} ${e!.hucre}`).not.toBeNull();
        cells.push(e!.hucre);
      }
    }
    expect(new Set(cells).size).toBe(cells.length);
    expect(cells).toHaveLength(11);
  });
  it('Kuyruk 44c: ızgara A–L × 1–6; L ve 6 geçerli, M ve 7 dışarıda; Ejderha Kalesi alanı K5–L6', () => {
    expect([KITA_IZGARA.sutunlar, KITA_IZGARA.satirlar]).toEqual(['ABCDEFGHIJKL', 6]);
    expect(hucreKonum('A1')).toEqual({ sutun: 0, satir: 0 });
    expect(hucreKonum('L6')).toEqual({ sutun: 11, satir: 5 });
    expect(hucreKonum('K5')).toEqual({ sutun: 10, satir: 4 });
    expect(hucreKonum('M1')).toBeNull();
    expect(hucreKonum('A7')).toBeNull();
    expect(hucreKonum('A0')).toBeNull();
    const alan = KITA_IZGARA.yerlesimler['ejder-kalesi']!.alan!;
    expect(alan).toEqual(['K5', 'L6']);
    for (const h of alan) expect(hucreKonum(h)).not.toBeNull();
  });
  it('görevdeki hücreler', () => {
    const want = { liman: 'D3', 'beyaz-sehir': 'C4', 'kral-kalesi': 'E5', 'gnom-kasabasi': 'F4', 'elf-kasabasi': 'E3', 'yarimcik-kasabasi': 'H3',
      'ork-kasabasi': 'I3', 'cuce-kalesi': 'H2', 'goliath-kalesi': 'J2', 'tiefling-kasabasi': 'J5', 'ejder-kalesi': 'K5' };
    for (const [id, h] of Object.entries(want)) expect(KITA_IZGARA.yerlesimler[id]?.hucre, id).toBe(h);
  });
  it('tablodaki sayfa/düğüm kıtada var ve o yerleşime bağlı; kıtadaki her yerleşim düğümü tabloda (ikon boşluğu yok)', () => {
    for (const [id, e] of Object.entries(KITA_IZGARA.yerlesimler)) {
      if (!e.hucre) continue;
      expect(nodes.some((n) => n.page === e.sayfa && n.node === e.dugum && n.yerlesim === id), id).toBe(true);
    }
    for (const n of nodes) {
      expect(KITA_IZGARA.yerlesimler[n.yerlesim]?.dugum, n.yerlesim).toBe(n.node);
      expect(yerlesimById(n.yerlesim), n.yerlesim).toBeTruthy();
    }
    expect(nodes).toHaveLength(11);
  });
  it('simgeler: kale ♜, kasaba ⌂, şehir ♛, Liman ⚓', () => {
    expect(yerlesimIkonu('kral-kalesi')).toBe('♜');
    expect(yerlesimIkonu('ejder-kalesi')).toBe('♜');
    expect(yerlesimIkonu('elf-kasabasi')).toBe('⌂');
    expect(yerlesimIkonu('tiefling-kasabasi')).toBe('⌂');
    expect(yerlesimIkonu('yarimcik-kasabasi')).toBe('⌂');
    expect(yerlesimIkonu('gnom-kasabasi')).toBe('⌂');
    expect(yerlesimIkonu('beyaz-sehir')).toBe('♛');
    expect(yerlesimIkonu('liman')).toBe('⚓');
    expect(yerlesimIkonu('bilinmeyen')).toBe('⌂');
  });
});
