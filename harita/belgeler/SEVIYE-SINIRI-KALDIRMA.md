# Seviye sınırının kaldırılması (2026-11-19)

Kullanıcı kararı: 5. seviye sınırı yalnız "ilk aşama" içindi; artık her yerde 1–20, "Üst seviye (6–20)" anahtarı yok.
Tek sabit `LEVEL_CAP = 20` (`src/app/limits.ts`). Savaş kuralı değişmedi: kural sürümü (83) ve kayıt sürümleri (savaş 22, karakter 3, yolculuk 2) aynı.

## Denetim (önce salt okunur tarama, sonra uygulama)

| Dosya | Ne yapıyordu | Ne oldu |
|---|---|---|
| `src/app/limits.ts` | `LEVEL_CAP` 5, `UPPER_LEVEL_CAP` 20, `levelCap(upper)` | Tek sabit `LEVEL_CAP` 20; `UPPER_LEVEL_CAP`/`levelCap` silindi |
| `src/app/features.ts` | `upperLevelsEnabled` / `setUpperLevelsEnabled` (`rpg-battle-deneysel.ustSeviye`) | Silindi; saklanan ayarda `ustSeviye` varsa okunmaz ve sonraki yazmada düşer (`stored`) |
| `src/ui/settings/RoomRules.tsx` | Oda kuralları katında "Üst seviye (6–20)" satırı | Satır kalktı (boşluk yok: satırlar liste, diğerleri yukarı kaydı) |
| `src/oda/model.ts` | `OdaKurallar.ustSeviye`, varsayılan, onarım, örtü, özet | Alan kalktı; eski oda kaydındaki `ustSeviye` `normalizeRoom`'da atılır (bilinmeyen alan), özet 5 satır |
| `src/oda/active.ts` | Örtü yorumunda `ustSeviye` | Yorum güncellendi |
| `src/screens/OdaScreens.tsx` | Yeni odaya cihaz değerini kopyalama, salt okunur özette satır, Odaya katıl'da "5 üstü karakter" uyarısı | Üçü de kalktı |
| `src/screens/Builder.tsx` | Oda bağlamında seçici `levelCap(upperLevelsEnabled())`, "Bu odada Üst seviye kapalı" uyarısı | Seçici her bağlamda 1–20 (`LEVEL_CAP`); uyarı kalktı; 6+ "deneysel" uyarısı aynen (veriden, `experimentalFrom`) |
| `src/rules/builder.ts` | `characterIssues`/türetmede elle yazılmış 20 | `LEVEL_CAP` (değer aynı, sorun metinleri ve Kaydet davranışı aynı) |
| `src/screens/GmScreen.tsx`, `src/map/maps.ts` | Harita seçici `pickerVisible(m, upperLevelsEnabled())`: Üst seviye açıkken `ustSeviyeGizli` (1–5. seviye) haritaları gizler | `pickerVisible(m)` yalnız `gizli`; `ustSeviyeGizli` alanı ve yükleyicisi silindi |
| `harita/kale/kale-baskini.json` | `ustSeviyeGizli: true` | Alan silindi (harita zaten `gizli: true`, seçicide görünmüyordu; Serüven açar) |
| `src/journey/seruven.ts` | `level_up` sınırı `levelCap(toggleOn('ustSeviye'))`; `nodeVisible` `ustSeviyeGizli` düğümü gizler | `level_up` 20'ye dek (XP eşiği `data/yolculuk/ayarlar.json` `xpEsikleri` 20 değer); düğüm alanı silindi; eski kayıttaki `toggles.ustSeviye` yok sayılır |
| `data/seruven.json` | Serüven anahtarı `ustSeviye` (kural panelinde satır) | Silindi (panel satırları veriden, satır kendiliğinden kalktı) |
| `src/i18n/strings.ts`, `strings.tr2.ts`, `strings.en.ts` | `roomRules.upper/upperHelp`, `oda.levelCapWarn`, kullanılmayan `journey.upperFlag/upperNote` | Silindi (TR ve EN) |
| `scripts/sd9-kurulum-tablo.mjs` → `harita/belgeler/SD9-KURULUM.md` | Kurulum tablosunda "Oda kuralları: Üst seviye (6–20)" | Satır kalktı, belge yeniden üretildi |
| `data/yapay-zeka.json` `turSiniri.ustSeviye` | Simülasyonda 6+ seviyede tur sınırı 30 | Değişmedi (seviyeye bağlı sim ayarı, anahtar değil) |
| `data/butce.json`, `src/rules/budget.ts` | Bütçe 1–20 tanımlı, 20'ye kırpar | Değişmedi; `docs/A2-BUTCE.md`'ye not |
| `data/sim-partiler.json` | `levels.<N>` seçimleri 20'ye dek | Değişmedi |
| `src/journey/encounter.ts`, `data/bolge-karsilasma.json` | Bölge karşılaşma üreteci | Değişmedi; denetim aşağıda |
| `harita/belgeler/SD8-AYARLAR.md`, `SADELESTIRME-DENETIM.md` | Eski görev belgelerinde "Üst seviye" satırı | Tarihî kayıt olarak bırakıldı |
| Testler | `k38`, `maps`, `od1-oda`, `od1b`, `sd8-ayarlar` anahtara bağlıydı | Anahtarsız davranışa güncellendi (gerekçe commit'te); yeni `src/screens/seviyeSiniri.test.tsx`; `k19smoke` 6. seviyeyi de oynar |

## 6–20 seviye denetimi (ayar yapılmadı; denge turu ayrı)

- **Bölge karşılaşma üreteci:** 7 bölge × seviye 6/9/12/15/20 × Low/Moderate: hepsinde düşman çıkıyor, XP bütçeyi aşmıyor. Sorun yok.
- **Serüven düğüm savaşları:** düşman listesi senaryonun `enemies.<seviye>`'sinden; yoksa 5. seviye listesine düşüyor (`enemiesAt`). 74 senaryonun hepsinde 1/3/5 var; 7'de 9, 9/11/15/20'de 4 senaryo (Çöl/Kale/Mağara/Orman). Yani Serüven'de 6+ seviyede çoğu düğüm 5. seviye düşmanlarıyla oynanır (kolay); 6, 8, 10, 12–14, 16–19 için hiçbir senaryoda liste yok. Çökme yok, denge turuna kaldı.
- **Kolay/Normal listeleri** (`data/sim-a2.json`): 7 ve 9. seviye; diğer 6+ seviyeler yok (aynı not).
- **Duman:** 12 sınıf × 6/12/16/20 (`src/sim/k19smoke.test.ts`) çökmeden oynar.
