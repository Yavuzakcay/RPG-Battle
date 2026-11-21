/** SRD 12 alt sınıf kaydını (2026-11-21'den beri 11: life-domain pakette yok) dış paket kaydına çevirir (fikstürdeki kayıttan; `srd` alanı pakette yasak). Saf: dosya erişimi betikte. */
import type { SubclassDef } from '../../src/data';

/**
 * Paketteki Türkçe ad (kitapçık adı): `harita/belgeler/AS2-FARKLAR.md` "Alt sınıf adı farkı" ve `AS2-ENVANTER.md` tablosundan.
 * Burada olmayan kimlik için ad uydurulmaz (betik listeler ve durur).
 */
export const AD_TR: Record<string, string> = {
  'path-of-the-berserker': 'Berserker Yolu', 'college-of-lore': 'Kadim Bilgi Koleji', 'circle-of-the-land': 'Toprak Çemberi',
  'champion': 'Gladyatör', 'warrior-of-the-open-hand': 'Sadelik Disiplini', 'oath-of-devotion': 'Sadakat Yemini', 'hunter': 'Avcı', 'thief': 'Hırsız',
  'draconic-sorcery': 'Pulkanat', 'fiend-patron': 'Zebani', 'evoker': 'Azap Öğretisi',
};
/**
 * Fikstürde kalan ama pakete eklenmeyen SRD alt sınıfları (`data/alt-sinif-gorunum.json` `kaldirilan`; 2026-11-21 kullanıcı
 * kararı: Yaşam Manastırı `life-domain` paketten silindi, kimliği Birlik Manastırı'na yönlenir). Mekanik fikstürde test için kalır.
 */
export const isRemovedFromPack = (id: string, removed: ReadonlyArray<{ id: string }>): boolean => removed.some((r) => r.id === id);
/** Alt ad (kayıt adı; seçicide görünmez, rol satırının başında): yalnız Warlock'ta kullanıcı kararı. */
export const ALT_AD: Record<string, string> = { 'fiend-patron': 'İblis Hamisi' };

export function toPackRecord(s: SubclassDef, adTr: string, altAd?: string): Record<string, unknown> {
  const { srd: _srd, pack: _pack, ...rest } = s as SubclassDef & { srd?: string; pack?: string };
  const role = altAd ? { ...s.role, tr: `${altAd}: ${s.role.tr}` } : s.role;
  return { ...rest, name: { tr: adTr, en: s.name.en }, role };
}

/** Paket dosyasının alt sınıf listesine kaydı (yoksa) başa ekler; eklendiyse true. Kimlik zaten varsa dokunmaz (idempotent). */
export function addIfMissing(pack: { subclasses: Array<{ id: string }> }, rec: { id: string }): boolean {
  if (pack.subclasses.some((x) => x.id === rec.id)) return false;
  pack.subclasses.unshift(rec);
  return true;
}
