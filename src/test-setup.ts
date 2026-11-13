/** Vitest: canavar verisi tembel yüklenir; testlerden önce bir kez yüklenir. F1: İngilizce metinler de (ayrı parça). */
import { classData, loadClassData, loadMonsters, type SubclassDef } from './data';
import { loadLang } from './i18n';
import srdAltSiniflar from './rules/fixtures/srd-alt-siniflar.json';

await Promise.all([loadMonsters(), loadClassData(), loadLang('en')]);
// Görev AS2: SRD'nin 12 alt sınıfı uygulamada dış pakette (icerik/, depoya girmez). Testler depodaki aynı kimlik ve
// mekanikteki fikstürle oyunun kendi alt sınıflarının önüne alır (eski sıra; dış paket kaydını sıfırlayan testler etkilenmez).
classData.subclasses.unshift(...(srdAltSiniflar as unknown as { subclasses: SubclassDef[] }).subclasses);
