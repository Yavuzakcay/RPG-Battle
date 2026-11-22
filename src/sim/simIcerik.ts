/**
 * Görev AS2: simülasyon ve belge betikleri için alt sınıf paketi. Uygulamada SRD'nin 12 alt sınıfı (ve 96 paket alt sınıfı)
 * dış pakettedir (`icerik/ek-<sınıf>.json`, depoya girmez). Betik yerel `icerik/` klasörünü uygulamayla aynı yoldan yükler
 * (`loadLocalFolder`, depolamasız); klasör yoksa (CI, temiz kopya) aynı kimlik ve mekanikteki 12 kaydın test fikstürü
 * (`src/rules/fixtures/srd-alt-siniflar.json`) oyunun kendi alt sınıflarına eklenir: sim partileri (`data/sim-partiler.json`)
 * her iki durumda da aynı alt sınıflarla oynar. Yalnız betikler içe aktarır (uygulama paketine girmez).
 */
import { classData, loadClassData, type SubclassDef } from '../data';
import { loadLocalFolder } from '../content/store';
import { findSubclass } from '../rules/subclasses';
import fixture from '../rules/fixtures/srd-alt-siniflar.json';

/** Yüklenen kaynak: `icerik` (yerel klasör) ya da `fikstur` (12 kayıt). */
export async function loadSimContent(): Promise<'icerik' | 'fikstur'> {
  await loadClassData();
  await loadLocalFolder(null);
  const subs = (fixture as unknown as { subclasses: SubclassDef[] }).subclasses;
  if (subs.every((s) => findSubclass(s.class, s.id))) return 'icerik';
  for (const s of subs) if (!findSubclass(s.class, s.id)) classData.subclasses.push(s);
  return 'fikstur';
}
