# SD8 (Ayarlar): Ayarlar ekranı denetimi ve dağılım

Kullanıcı kararı: Ayarlar 10 yaşında bir çocuğun anlayacağı kadar sade. Çoğu ayar oyuncuya verilmez, bir kısmı yalnız oda kurulurken
(Game Master kurulumu) seçilir. Tek sade arayüz; Kolay/Uzman modu yok, uzman seçenekleri "Gelişmiş" katında. Yalnız arayüz: hiçbir
ayarın işlevi ya da saklama anahtarı silinmedi, kural sürümü ve kayıt sürümü değişmedi.

## Denetim (eski Ayarlar ekranı, satır satır)

| # | Satır | Saklama | Kim değiştirmeli | Öneri / sonuç |
|---|---|---|---|---|
| 1 | Deneysel: Yolculuk | `rpg-battle-deneysel` (localStorage) `yolculuk` | Game Master kurulumu | Oda kuralları'na taşındı |
| 2 | Üst seviye (6–20) | `rpg-battle-deneysel` `ustSeviye` (Serüven anahtarı `ustSeviye` ayrı) | Game Master kurulumu | Oda kuralları'na taşındı |
| 3 | Alignment (ev kuralı) | `rpg-battle-deneysel` `hizalanma` | Game Master kurulumu | Oda kuralları'na taşındı |
| 4 | Alignment: ırk/kültür katkısı | `…` `hizalanmaIrk` | Game Master kurulumu | Alignment'ın altında |
| 5 | Alignment: kabul etmeme (yalnız otomatik) | `…` `hizalanmaYalnizOtomatik` | Game Master kurulumu | Alignment'ın altında |
| 6 | Alignment ↔ Moral | `…` `hizalanmaMoral` | Game Master kurulumu | Alignment'ın altında |
| 7 | Taşıma yükü kuralı | `rpg-battle-tasima` | Game Master kurulumu | Oda kuralları'na taşındı |
| 8 | Savaş sonu başlık videosu | `rpg-battle-son-video` | Oyuncu | Ayarlar, üstte |
| 9 | Zar teması (seçici) | oyuncu profili `rpg-battle-zar-acilanlar` (`diceUnlock.ts`) + karakter kaydında `zar` | Oyuncu, karakter başına | **Ayarlar'dan kalktı** (kullanıcı kararı, SD8 eki): karakter oluşturucunun son ekranına taşındı; profil seçimi eski karakter için yedek |
| 10 | Zar: "Tüm zarlar açık" | profil `hepsiAcik` | Gelişmiş | Gelişmiş katına |
| 11 | Hamle önizlemesi Açık/Kapalı + Kısa/Tam | `rpg-battle-onizleme` | Oyuncu | Ayarlar, üstte; "Game Master ayarı" ibaresi kalktı |
| 12 | Keşif modu | `rpg-battle-onizleme` `discovery` | Game Master kurulumu | Oda kuralları'na taşındı |
| 13 | İpucu rozetleri | `rpg-battle-onizleme` `hints` | Game Master kurulumu | Oda kuralları'na taşındı |
| 14 | Keşif Defteri (32 "???" satırı + profil) | `rpg-battle-kesif` | Oyuncu (okuma) / Gelişmiş (dışa-içe) | Ayrı küçük sayfa ("Keşif Defteri 1/32"); Ayarlar'da tek satır bağlantı; dışa/içe aktar Gelişmiş'te |
| 15 | Şehir görünümü | `rpg-battle-sehir-gorunum` | Oyuncu | Ayarlar, üstte |
| 16 | Yerleşim harita rengi | `rpg-battle-harita-renk` | Oyuncu | Ayarlar, üstte |
| 17 | Dış içerik (içe aktar, klasör, toplam, hatalar) | `rpg-battle-icerik` + yerel `icerik/` | Gelişmiş | Gelişmiş katı; "12 paketten 97 alt sınıf" satırı (120 alt sınıf zaten hep seçilebilir) "Yüklü paket: N" oldu |

## Ayarlar'da hiç olmayan ama istenen satırlar

Dil, ses seviyeleri ve efekt animasyonu başka yerlerdeydi (giriş ekranı araç satırı, savaş menüsü). Ayarlar'a aynı saklama
anahtarlarıyla ikinci bir kapı eklendi (eski yerleri çalışmaya devam eder):

| Satır | Saklama | Kaynak bileşen |
|---|---|---|
| Dil | `rpg-battle-lang` (`setLang`) | giriş ekranı dil düğmesiyle aynı |
| Ses (ana, ortam, müzik, efekt) | `useSoundSettings` | `SoundPanel` (aynı bileşen) |
| Efekt animasyonu | `rpg-battle-sprite-anim` (`useSpriteAnimSetting`) | savaş menüsüyle aynı |
| Harita efektleri | `rpg-battle-effects` (`useEffectsSetting`) | savaş menüsüyle aynı; "hareketi azalt" açıkken varsayılan kapalı |

## Yeni düzen

1. **Ayarlar** (üstte, oyuncu): Dil · Ses · Efekt animasyonu · Harita efektleri · Savaş sonu videosu · Hamle önizlemesi (Kısa/Tam) · Şehir görünümü · Yerleşim harita rengi · Keşif Defteri (tek satır bağlantı).
2. **Gelişmiş** (kapalı katman): Dış içerik · Keşif Defteri dışa/içe aktar · "Tüm zarlar açık".
3. **Game Master kurulumu → "Oda kuralları"** (kapalı katman): Üst seviye · Taşıma yükü · Alignment (+3 alt seçenek) · Keşif modu · İpucu rozetleri · Yolculuk (deneme).

Varsayılanlar ve saklama anahtarları aynı; yerel savaşın davranışı değişmez (ayarlar oda kurulumunda da aynı saklamaya yazar/okur).

## Çelişki notları

- Önizleme ayarı tek anahtarda (`rpg-battle-onizleme`) dört alan taşır; ekranda ikiye bölündü (açık/kapalı + ayrıntı Ayarlar'da, keşif modu + ipucu rozetleri oda kurarken), depolama aynı kaldı.
- Oda kurulumu "oda başına" kayıt değil, bu cihazın ayarına yazar (mevcut davranış); yeni bir oda başına anahtar eklenmedi (kural sürümü ve kayıt sürümü değişmez).
- "SD8" kimliği daha önce Dark Elf paletleri için kullanılmıştı; bu iş DECISIONS.md'de "SD8 (Ayarlar)" olarak ayrıdır.

## SD8 eki: zar seçimi karakter oluşturucuda

- Seçim karakter kaydında (`zar`: `klasik` | `sinif` | `irk` | açılmış tema kimliği); yoksa oyuncu profili seçimi (eski karakter yedeği), o da yoksa sınıf zarı. Karakter kayıt sürümü değişmedi (isteğe bağlı alanlar; eski kayıtlar aynen yüklenir). Karakter kartındaki zar seçici kalktı.
- Son ekranda (Alignment ev kuralı açıkken Alignment adımı, kapalıyken Özet) listelenenler: Klasik, sınıf, ırk, açılmış Alignment zarları, profilde açılmış ödül zarları. Açılmamışlar kilitli gösterilmez.
- Alignment zarları: 9 yer tutucu tema `hizalanma-<kare>` (`lawful-good` … `true-neutral` … `chaotic-evil`, kategori `hizalanma`, görsel yokken Klasik; `npm run zarlar` ham `zar-hizalanma-*.jpg` ile dolacak). Karakter başlangıç karesinin zarını kazanır; kare değişince yenisi açılır, eskisi silinmez (`hizalanmaZarlar`, tekrarsız, kalıcı). Ev kuralı kapansa da açılmışlar kalır. Seçili zar hiçbir koşulda otomatik değiştirilmez/sıfırlanmaz; kullanılamayan seçim yalnız çizimde sınıf zarına düşer (kayıt aynı kalır).
- Açılma kancası: `saveCharacters` öncesi kayıt kancası (`app/storage.ts` `addCharacterSaveHook`, kayıt `app/alignDiceHook.ts`; oluşturucu ve Game Master paneli içe aktarır): bulunduğu karenin zarını karaktere ekler. Savaşa, kural sürümüne ve replay'e girmez.
