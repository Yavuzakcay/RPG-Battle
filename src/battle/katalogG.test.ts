/**
 * Görev KATALOG-1 G: Hex anlatım verisi (`data/katalog-anlatim.json`). Yalnız veri (K4, K14): kod, kural ve savaş
 * etkisi yok. Denetlenen: kimlikler (sabit, tekil, eşya kimlikleriyle çakışmaz), sayılar (14 kayıt, tablolar, On Mühür bağı),
 * metin eşleşmesi (Kararma tablosu PDF'in tek satır kuralıyla, bağ eşya kayıtlarıyla, eski boss adı yalnız `eskiAd`).
 */
import { describe, expect, it } from 'vitest';
import anlatimData from '../../data/katalog-anlatim.json';
import katalog from '../../data/items-katalog.json';
import { items } from '../data';

type Tablo = { baslik?: string; sutunlar: string[]; satirlar: string[][] };
type Bag = { sira: number; hasarTuru: string; elementTr: string; tas: string; tasTr: string; bolge: string; tasEskiTr?: string;
  boss: { ad: string; unvan: string; eskiAd: string } };
type Kayit = { id: string; ref: string; tr: string; en: string; enAdOneri?: boolean; bolum: string; durum: string; yer: string;
  kanca?: string; kancalar?: string[]; paragraflar?: Array<{ baslik?: string; metin: string }>; maddeler?: string[];
  tablolar?: Tablo[]; esyalar?: string[]; baglar?: Bag[]; bossSinifi?: { tr: string; en: string }; odul?: string };
type Esya = { id: string; name: string; katalog: { ref: string; tr: string; eskiTr?: string; ozet?: string; riskler?: string } };

const doc = anlatimData as unknown as { kaynak: string; anlatimlar: Kayit[] };
const A = doc.anlatimlar;
const K = (id: string) => A.find((k) => k.id === id)!;
const kat = (katalog as unknown as { esyalar: Esya[] }).esyalar;
const E = (id: string) => kat.find((x) => x.id === id)!;
const BOSS = kat.filter((x) => x.katalog.ref.startsWith('BOSS#'));
const tablo = (id: string, i = 0) => K(id).tablolar![i]!;

describe('KATALOG-1 G: Hex anlatım verisi', () => {
  it('kimlikler: 14 sabit kayıt, tekil, eşya ve 39 boss/imza kimliğiyle çakışmaz; hepsi anlatım (Serüven)', () => {
    expect(A.map((k) => k.id)).toEqual(['kaltakkiran-paketi', 'kaltakkiran-bes-kural', 'kaltakkiran', 'kaltakkiran-yenilme-anahtari',
      'kararma-sayaci', 'kararma-esikleri', 'psikolojik-ihanet', 'kararma-kilidi-kirilimi', 'tas-soket-sistemi', 'on-muhur',
      'iki-final-yolu', 'yol-a', 'yol-b', 'sistem-ozeti']);
    expect(new Set(A.map((k) => k.ref)).size).toBe(A.length);
    expect(BOSS).toHaveLength(39); // Görev BOSS-IMZA-GORSEL: + iki yumurta (BOSS#20–21)
    const itemIds = new Set(items.map((i) => i.id));
    for (const k of A) {
      expect(k.id, k.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(itemIds.has(k.id), `${k.id} eşya kimliğiyle çakışıyor`).toBe(false);
      expect([k.durum, k.yer], k.id).toEqual(['anlatim', 'seruven']);
      expect(k.tr && k.en && k.bolum, k.id).toBeTruthy();
      for (const e of k.esyalar ?? []) expect(itemIds.has(e), `${k.id} → ${e}`).toBe(true);
    }
    expect(doc.kaynak).toBe('katalog-1');
  });

  it('sayılar: beş kural, tablolar, dokuz motor modülü ve her kanca modül tablosunda', () => {
    expect(K('kaltakkiran-bes-kural').maddeler).toHaveLength(5);
    const boyut = (t: Tablo) => [t.satirlar.length, ...new Set(t.satirlar.map((r) => r.length))];
    expect(boyut(tablo('kararma-sayaci'))).toEqual([5, 5]);
    expect(boyut(tablo('kararma-esikleri'))).toEqual([5, 4]);
    expect(boyut(tablo('tas-soket-sistemi'))).toEqual([3, 5]);
    expect(boyut(tablo('iki-final-yolu'))).toEqual([4, 3]);
    const mod = tablo('sistem-ozeti').satirlar.map((r) => r[0]);
    expect(mod).toEqual(['permanentSocketFuse', 'normalArmorSocket', 'corruptionTrack', 'dialogueAlignmentLock', 'superiorBeingBetrayal',
      'adaptiveWeaknessResolver', 'chainFormTether', 'dragonEvolutionFinale', 'bondSacrificeLedger']);
    for (const k of A) for (const m of [k.kanca, ...(k.kancalar ?? [])].filter(Boolean)) expect(mod, `${k.id} → ${m}`).toContain(m);
    // PDF modülü olan kaydın EN adı modül kimliğinden okunur ad; olmayanda öneri işareti
    for (const k of A) if (!k.kanca && k.id !== 'kaltakkiran') expect(k.enAdOneri, k.id).toBe(true);
    expect(K('kararma-sayaci').en).toBe('Corruption Track');
    expect(K('yol-b').en).toBe('Bond Sacrifice Ledger');
  });

  it('Kararma tablosu PDF\'in tek satır kuralıyla aynı: savaş 2 + 2×taş, uzun dinlenme 5 + 3×taş, çıkarma DC 10 + taş', () => {
    const kural = K('kararma-sayaci').paragraflar!.find((p) => p.baslik === 'Tek Satır Kural')!.metin;
    expect(kural).toContain('Savaş başına kararma = 2 + (2 × Kaynaşmış Taş); zırhla uzun dinlenme = 5 + (3 × Kaynaşmış Taş).');
    const sayilar = (s: string) => [...s.matchAll(/\d+/g)].map((m) => Number(m[0]));
    const taslar = [[0], [1, 2, 3], [4, 5, 6], [7, 8, 9], [10]];
    tablo('kararma-sayaci').satirlar.forEach((r, i) => {
      const n = taslar[i]!;
      expect(sayilar(r[2]!), r[0]).toEqual(n.map((t) => 2 + 2 * t));
      expect(sayilar(r[3]!), r[0]).toEqual(n.map((t) => 5 + 3 * t));
      const dc = sayilar(r[4]!);
      expect(dc, r[0]).toEqual(n.length > 1 ? [10 + n[0]!, 10 + n[2]!] : [10 + n[0]!]);
    });
    expect(tablo('kararma-esikleri').satirlar.map((r) => `${r[0]} ${r[1]}`)).toEqual(['0–24 Berrak', '25–49 Fısıltı', '50–74 Gölgelenme',
      "75–99 Hex'in İradesi", '100 Mühürlü İrade (Kalıcı Kilit)']);
  });

  it('On Mühür: 10 bölge ↔ Sv.3 taşı ↔ Mühür Ruhu; taş adları eşya kayıtlarıyla, bölge taşın özetinde; PDF boss adı yalnız eskiAd', () => {
    const om = K('on-muhur');
    expect(om.bossSinifi).toEqual({ tr: 'Mühür Ruhu', en: 'Seal Spirit' });
    const b = om.baglar!;
    expect(b).toHaveLength(10);
    expect(new Set(b.map((x) => x.hasarTuru))).toEqual(new Set(['fire', 'cold', 'lightning', 'thunder', 'acid', 'poison', 'radiant', 'necrotic', 'psychic', 'force']));
    expect(b.map((x) => x.boss.ad)).toEqual(['Cimbombom', 'Wolfgang', 'Stormer', 'Gongar', 'Hydraxe', 'Mothraq', 'Lightaur', 'Cerbones', 'Mirage', 'Kongark']);
    for (const x of b) {
      const e = E(x.tas);
      expect(e.katalog.ref, x.tas).toMatch(/^BOSS#(9|1[0-8])$/);
      expect(e.katalog.tr, x.tas).toBe(`${x.tasTr} (${x.elementTr})`);
      expect(e.katalog.ozet, x.tas).toContain(x.bolge);
      expect(om.esyalar).toContain(x.tas);
    }
    const metin = JSON.stringify({ ...doc, anlatimlar: A.map((k) => ({ ...k, baglar: k.baglar?.map((x) => ({ ...x, boss: { ...x.boss, eskiAd: '' } })) })) });
    for (const x of b) expect(metin.includes(x.boss.eskiAd), x.boss.eskiAd).toBe(false);
    // Işıltı taşı adı kullanıcı kararıyla (kimlik ve EN ad aynı)
    const gunes = E('blinding-sun-shard');
    expect([gunes.name, gunes.katalog.tr, gunes.katalog.eskiTr]).toEqual(['Blinding Sun Shard', 'Güneş Parçası (Işıltı)', 'Kör Güneş Parçası (Işıltı)']);
  });

  it('iki final yolu: Yol A Koruyucu Ejderha Mührü\'nü verir, kılıcın akıbeti ve Yol B bedeli eşya metinleriyle tutarlı', () => {
    const ya = K('yol-a');
    expect(ya.odul).toBe('guardian-dragon-sigil');
    const sigil = E('guardian-dragon-sigil');
    expect(ya.paragraflar!.find((p) => p.baslik === 'Ejderhanın Armağanı')!.metin).toContain(sigil.katalog.tr);
    expect(sigil.katalog.riskler).toContain('Yol A');
    expect(ya.paragraflar!.map((p) => p.baslik)).toEqual(['Ejderhanın Bilgeliği ve Evrimi', "Kaltakkıran'ın Akıbeti (Devrim Simgesi)", 'Ejderhanın Armağanı']);
    expect(K('yol-b').paragraflar!.map((p) => p.baslik)).toEqual(['Mutlak Gücü Sahiplenme', 'Sevilenlerin Bedeli', 'Yalnız Hükümdarlık']);
    expect(K('yol-b').paragraflar![1]!.metin).toContain('(bondSacrificeLedger)');
    const kilic = E('kaltakkirans-maw-chain-greatsword').katalog.riskler!;
    expect(kilic).toContain('Devrim Simgesi');
    expect(kilic).toContain('3/UD Boğucu Kıskaç');
    const kars = tablo('iki-final-yolu').satirlar;
    expect(kars.map((r) => r[0])).toEqual(['Paladin Zırhı', 'Kaltakkıran', 'Ödül / Kazanç', 'Ödenen Bedel']);
    expect(kars[2]![1]).toContain(sigil.katalog.tr);
    // Hex: yalnız anlatım (K4); savaş/karakter alanı yok
    const kk = K('kaltakkiran');
    expect(kk.paragraflar).toHaveLength(1);
    expect(kk.paragraflar![0]!.metin).toMatch(/^Bir zamanlar düzeni koruyan göksel bir şövalyeyken/);
    // Görev BOSS-IMZA-GORSEL: boss adı Hex, Princeps Tenebrarum (PDF adı `eskiAd`), görsel `boss/hex.webp`.
    expect(kk.tr).toBe('Hex, Princeps Tenebrarum');
    expect(Object.keys(kk).sort()).toEqual(['bolum', 'durum', 'en', 'eskiAd', 'gorsel', 'id', 'not', 'paragraflar', 'ref', 'tr', 'yer']);
  });
});
