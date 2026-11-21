/**
 * Görev AS2: simülasyon ve belge betikleri için alt sınıf paketi. Uygulamada SRD'nin 12 alt sınıfı (ve 96 paket alt sınıfı)
 * dış pakettedir (`icerik/ek-<sınıf>.json`, depoya girmez). Betik yerel `icerik/` klasörünü uygulamayla aynı yoldan yükler
 * (`loadLocalFolder`, depolamasız); klasör yoksa (CI, temiz kopya) aynı kimlik ve mekanikteki 12 kaydın test fikstürü
 * (`src/rules/fixtures/srd-alt-siniflar.json`) oyunun kendi alt sınıflarına eklenir: sim partileri (`data/sim-partiler.json`)
 * her iki durumda da aynı alt sınıflarla oynar. Yalnız betikler içe aktarır (uygulama paketine girmez).
 */
import { classData, loadClassData, type SubclassDef } from '../data';
import { loadLocalFolder } from '../content/store';
import { subclassDefs } from '../rules/subclasses';
import fixture from '../rules/fixtures/srd-alt-siniflar.json';

/** Yüklenen kaynak: `icerik` (yerel klasör) ya da `fikstur` (12 kayıt). */
export async function loadSimContent(): Promise<'icerik' | 'fikstur'> {
  await loadClassData();
  await loadLocalFolder(null);
  const subs = (fixture as unknown as { subclasses: SubclassDef[] }).subclasses;
  // 2026-11-21: doğrudan kayıtta mı (findSubclass life-domain'i kayıtta yoksa Birlik Manastırı'na yönlendirir). Paketten silinen
  // Yaşam Manastırı fikstürden eklenir: sim partisi (`data/sim-partiler.json`) iki ortamda da eski mekanikle oynar (altın imzalar aynı).
  const has = (s: SubclassDef) => subclassDefs(s.class).some((x) => x.id === s.id);
  if (subs.every(has)) return 'icerik';
  for (const s of subs) if (!has(s)) classData.subclasses.push(s);
  return 'fikstur';
}
