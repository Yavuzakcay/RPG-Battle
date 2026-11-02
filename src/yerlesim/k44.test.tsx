/**
 * Kuyruk 44: yerleşim şehir görünümü. Veri (her yerleşim için düğümler tanımlı, koordinat 0–1, kimlik kalıcı ve
 * benzersiz, her düğümün hedefi var, bağlı haritalar gerçekten var), işlev eşlemesi, arayüz (görünüm ve eski hub).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import data from '../../data/sehir-gorunum.json';
import { executeSeruven, type SeruvenCommand, type SeruvenState } from '../journey/seruven';
import { partyAt } from '../sim/balance';
import { getMap } from '../map/maps';
import { YERLESIM, yerlesimById } from './yerlesim';
import { SEHIR_YERLESIMLER, dugumHedefi, islevOf, sehirGorunumu, sehirHazir, type SehirGorunum } from './sehirGorunum';
import { YerlesimHub } from '../screens/YerlesimHub';
import { SehirGorunumEkrani } from '../screens/SehirGorunum';

const step = (s: SeruvenState, cmd: SeruvenCommand): SeruvenState => {
  const r = executeSeruven(s, cmd);
  if (!r.ok) throw new Error(r.error);
  return r.state;
};
function inSettlement(id: string): SeruvenState {
  const party = partyAt(3).map((sh, i) => ({ id: `p${i + 1}`, name: sh.name, sheet: sh }));
  const r = executeSeruven(null, { type: 'start', id: 's', seed: 1, party });
  if (!r.ok) throw new Error(r.error);
  return { ...r.state, yerlesim: { id, at: null, seen: [] } } as unknown as SeruvenState;
}

describe('Kuyruk 44: şehir görünümü verisi', () => {
  it('her yerleşimin kaydı var; düğüm kimlikleri `<yerlesim>/<bina>`, benzersiz; koordinatlar 0–1; komsular boş dizi', () => {
    for (const y of YERLESIM.yerlesimler) expect(SEHIR_YERLESIMLER, y.id).toContain(y.id);
    const all = new Set<string>();
    for (const id of SEHIR_YERLESIMLER) {
      expect(yerlesimById(id), id).toBeTruthy();
      const g = sehirGorunumu(id) as SehirGorunum;
      for (const n of g.dugumler) {
        expect(n.id.startsWith(`${id}/`), n.id).toBe(true);
        expect(all.has(n.id), n.id).toBe(false);
        all.add(n.id);
        expect(n.x >= 0 && n.x <= 1 && n.y >= 0 && n.y <= 1, n.id).toBe(true);
        expect(n.tr && n.en, n.id).toBeTruthy();
        expect(n.komsular).toEqual([]);
      }
      if (g.gorsel) expect(g.boyut?.length, id).toBe(2);
    }
  });
  it('Beyaz Şehir: görevdeki 11 bina + 10 ev düğümü', () => {
    const g = sehirGorunumu('beyaz-sehir')!;
    expect(g.dugumler).toHaveLength(21);
    expect(g.dugumler.filter((n) => n.ev)).toHaveLength(10);
    expect(g.boyut).toEqual([2576, 1438]);
  });
  it('her düğümün bir hedefi var; bağlı harita yerleşimde ve harita verisinde var', () => {
    for (const id of SEHIR_YERLESIMLER) {
      const y = yerlesimById(id)!;
      for (const n of sehirGorunumu(id)!.dugumler) {
        const tg = dugumHedefi(y, n);
        expect(['hizmet', 'harita', 'yakinda', 'npc']).toContain(tg.tur);
        const harita = tg.tur === 'harita' ? tg.harita : tg.tur === 'hizmet' ? tg.harita : undefined;
        if (harita) {
          const h = y.haritalar.find((x) => x.id === harita);
          expect(h, `${n.id} → ${harita}`).toBeTruthy();
          expect(getMap(h!.mapId, { variantId: h!.variantId }).id).toBe(h!.mapId);
        }
      }
    }
  });
  it('Beyaz Şehir eşlemesi (DECISIONS tablosu)', () => {
    const y = yerlesimById('beyaz-sehir')!;
    const by = (slug: string) => dugumHedefi(y, sehirGorunumu('beyaz-sehir')!.dugumler.find((n) => n.id === `beyaz-sehir/${slug}`)!);
    expect(by('han')).toEqual({ tur: 'hizmet', hizmet: 'han' });
    expect(by('sifa-evi')).toEqual({ tur: 'hizmet', hizmet: 'sifa' });
    expect(by('gorev-loncasi')).toEqual({ tur: 'hizmet', hizmet: 'gorev' });
    expect(by('dis-kapi')).toEqual({ tur: 'hizmet', hizmet: 'cikis', harita: 'beyaz-sehir-dis-kapi' });
    expect(by('pazar-meydani')).toEqual({ tur: 'harita', harita: 'pazar' });
    expect(by('saray')).toEqual({ tur: 'harita', harita: 'beyaz-sehir-saray-avlusu' });
    expect(by('lagim-kapagi')).toEqual({ tur: 'harita', harita: 'lagim' });
    expect(by('demirci')).toEqual({ tur: 'yakinda' });
    expect(by('silah-zirh')).toEqual({ tur: 'yakinda' });
    expect(by('buyu-kulesi')).toEqual({ tur: 'yakinda' });
    expect(by('taverna')).toEqual({ tur: 'npc' });
    expect(by('ev-1')).toEqual({ tur: 'npc' });
  });
  it('kasaba ve kale şablonunda ad kuralları (dugumler.json adlarıyla)', () => {
    const k = yerlesimById('ork-kasabasi')!;
    expect(dugumHedefi(k, { tr: 'Taverna' })).toEqual({ tur: 'harita', harita: 'taverna' });
    expect(dugumHedefi(k, { tr: 'Demirci' })).toEqual({ tur: 'harita', harita: 'kasaba-demirci-tapinak' });
    expect(dugumHedefi(k, { tr: 'Rogar' })).toEqual({ tur: 'harita', harita: 'kasaba-lagim' });
    expect(dugumHedefi(k, { tr: 'Han' })).toEqual({ tur: 'hizmet', hizmet: 'han', harita: 'kasaba-han' });
    expect(dugumHedefi(k, { tr: 'Meydan' })).toEqual({ tur: 'harita', harita: 'meydan' });
    expect(dugumHedefi(k, { tr: 'Sef salonu' })).toEqual({ tur: 'npc' });
    const c = yerlesimById('cuce-kalesi')!;
    expect(dugumHedefi(c, { tr: 'Kral salonu' })).toEqual({ tur: 'harita', harita: 'kale-taht-salonu' });
    expect(dugumHedefi(c, { tr: 'Gizli gecit' })).toEqual({ tur: 'harita', harita: 'zindan' });
    expect(dugumHedefi(c, { tr: 'Maden kapisi' })).toEqual({ tur: 'npc' });
    expect(dugumHedefi(c, { tr: 'Dis kapi' })).toEqual({ tur: 'hizmet', hizmet: 'cikis', harita: 'kale-onu' });
    expect(islevOf({ tr: 'Büyü dükkânı' })).toBe('yakinda');
    expect(islevOf({ tr: 'Genel dükkân' })).toBe('dukkan');
  });
});

describe('Kuyruk 44: arayüz', () => {
  const g = (data as unknown as { yerlesimler: Record<string, SehirGorunum> }).yerlesimler['beyaz-sehir']!;
  afterEach(() => { delete g.gorsel; });
  it('görsel üretilmemişse şehir görünümü hazır değil (eski hub)', () => {
    expect(sehirHazir('beyaz-sehir')).toBe(!!g.gorsel);
  });
  it('eski hub aynen: haritalar, dükkân, han, görevler, çıkış', () => {
    const m = renderToStaticMarkup(<YerlesimHub state={inSettlement('beyaz-sehir')} run={() => true} onMap={() => {}} error={null} />);
    for (const s of ['seruven-hub', 'Haritalar', 'Dükkân', 'Han', 'Görevler', 'Yerleşimden çık']) expect(m).toContain(s);
  });
  it('şehir görünümü: görsel, 21 düğüm (soluk Yakında), çıkış her zaman erişilebilir', () => {
    g.gorsel = 'yerlesim/beyaz-sehir.webp';
    expect(sehirHazir('beyaz-sehir')).toBe(true);
    const m = renderToStaticMarkup(<SehirGorunumEkrani state={inSettlement('beyaz-sehir')} run={() => true} onMap={() => {}} onFail={() => {}} error={null} />);
    expect(m).toContain('yerlesim/beyaz-sehir.webp');
    expect(m.match(/class="sehir-dugum /g)).toHaveLength(21);
    expect(m.match(/sehir-dugum yakinda/g)).toHaveLength(3);
    expect(m).toContain('data-dugum="beyaz-sehir/saray"');
    expect(m).toContain('Yerleşimden çık');
  });
  it('Serüven yerleşim akışıyla (kale): hub komutları şehir görünümünde de aynı', () => {
    const s = step(step(inSettlementStart(), { type: 'move', to: 'kral-kalesi' }), { type: 'yerlesim_enter' });
    expect(s.yerlesim?.id).toBe('kral-kalesi');
    expect(executeSeruven(s, { type: 'inn_rest' }).ok).toBe(true);
  });
});

function inSettlementStart(): SeruvenState {
  const party = partyAt(3).map((sh, i) => ({ id: `p${i + 1}`, name: sh.name, sheet: { ...sh, raceId: i === 0 ? 'human' : sh.raceId } }));
  const r = executeSeruven(null, { type: 'start', id: 's', seed: 1, party });
  if (!r.ok) throw new Error(r.error);
  return r.state;
}
