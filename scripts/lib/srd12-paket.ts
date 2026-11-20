/** SRD 12 alt sınıf kaydını dış paket kaydına çevirir (fikstürdeki kayıttan; `srd` alanı pakette yasak). Saf: dosya erişimi betikte. */
import type { SubclassDef } from '../../src/data';

/**
 * Paketteki Türkçe ad (kitapçık adı): `harita/belgeler/AS2-FARKLAR.md` "Alt sınıf adı farkı" ve `AS2-ENVANTER.md` tablosundan.
 * Burada olmayan kimlik için ad uydurulmaz (betik listeler ve durur).
 */
export const AD_TR: Record<string, string> = {
  'path-of-the-berserker': 'Berserker Yolu', 'college-of-lore': 'Kadim Bilgi Koleji', 'life-domain': 'Yaşam Alanı', 'circle-of-the-land': 'Toprak Çemberi',
  'champion': 'Gladyatör', 'warrior-of-the-open-hand': 'Sadelik Disiplini', 'oath-of-devotion': 'Sadakat Yemini', 'hunter': 'Avcı', 'thief': 'Hırsız',
  'draconic-sorcery': 'Pulkanat', 'fiend-patron': 'Zebani', 'evoker': 'Azap Öğretisi',
};
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
