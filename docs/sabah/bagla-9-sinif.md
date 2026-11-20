# 9 sınıf alt sınıf jetonu bağlaması (TOPLU-KESIM → oyun)

Jeton dosyası: `public/characters/<irk>-<erkek|kadin>-<sınıf>-ID<n>.webp` (9 ırk × 2 cinsiyet; Dragonborn yok). Veri: `data/<sınıf>-jeton.json`; hücre adları `data/jeton-hucre-sirasi.json`. Boyası gereken karakter (maske yok) ve Dragonborn sınıf-genel jetonda kalır; eksikler `console.warn("<sınıf>-jeton eksik: …")`.

| Sınıf | Hücre | Alt sınıf adı | Alt sınıf kimliği | Jeton dosyası | Durum |
|---|---|---|---|---|---|
| barbarian | 1 | Varis | varis-yolu | …-barbarian-ID1.webp | bağlandı |
| barbarian | 2 | Element | element-yolu | …-barbarian-ID2.webp | bağlandı |
| barbarian | 3 | Kaos | kaos-yolu | …-barbarian-ID3.webp | bağlandı |
| barbarian | 4 | Şaman | saman-yolu | …-barbarian-ID4.webp | bağlandı |
| barbarian | 5 | İlkelliğin | ilkelligin-yolu | …-barbarian-ID5.webp | bağlandı |
| barbarian | 6 | Vahşet | vahset-yolu | …-barbarian-ID6.webp | bağlandı |
| barbarian | 7 | Heybet | heybet-yolu | …-barbarian-ID7.webp | bağlandı |
| barbarian | 8 | Çılgın Savaşçı | path-of-the-berserker | …-barbarian-ID8.webp | bağlandı |
| barbarian | 9 | Geride Kalanın | imza_geride_kalan | …-barbarian-ID9.webp | bağlandı |
| bard | 1 | Bilgi | college-of-lore | …-bard-ID1.webp | bağlandı |
| bard | 2 | Ağıt | agit-koleji | …-bard-ID2.webp | bağlandı |
| bard | 3 | Akrobat | akrobat-koleji | …-bard-ID3.webp | bağlandı |
| bard | 4 | Arzu | arzu-koleji | …-bard-ID4.webp | bağlandı |
| bard | 5 | Harp | harp-koleji | …-bard-ID5.webp | bağlandı |
| bard | 6 | Hatip | hatip-koleji | …-bard-ID6.webp | bağlandı |
| bard | 7 | Islık | islik-koleji | …-bard-ID7.webp | bağlandı |
| bard | 8 | Varoluş | varolus-koleji | …-bard-ID8.webp | bağlandı |
| bard | 9 | Şair | imza_sair | …-bard-ID9.webp | bağlandı |
| cleric | 1 | Yaşam | life-domain | …-cleric-ID1.webp | bağlandı |
| cleric | 2 | Aydın | aydin-alani | …-cleric-ID2.webp | bağlandı |
| cleric | 3 | Birlik Manastırı (3–16. seviye) | imza_birlik, baris-alani (eski) | …-cleric-ID3.webp | bağlandı (2026-11-19: seviye 3–16; 17+ hücre 9, `formlar`) |
| cleric | 4 | Demirci | demirci-alani | …-cleric-ID4.webp | bağlandı |
| cleric | 5 | Fırtına | firtina-alani | …-cleric-ID5.webp | bağlandı |
| cleric | 6 | Mezar | mezar-alani | …-cleric-ID6.webp | bağlandı |
| cleric | 7 | Savaş | savas-alani | …-cleric-ID7.webp | bağlandı |
| cleric | 8 | Yakamoz | yakamoz-alani | …-cleric-ID8.webp | bağlandı |
| cleric | 9 | Birlik Manastırı (17+. seviye) | imza_birlik | …-cleric-ID9.webp | bağlandı (ikinci form: `data/cleric-jeton.json` `formlar` eşik 17) |
| cleric | 9 | Birlik Manastırı (17+. seviye) | baris-alani (eski) → imza_birlik | …-cleric-ID9.webp | bağlandı (iki kimlik aynı jeton, aynı eşik) |
| druid | 1 | Toprak | circle-of-the-land | …-druid-ID1.webp | bağlandı |
| druid | 2 | Anka | anka-cemberi | …-druid-ID2.webp | bağlandı |
| druid | 3 | Çağrı | cagri-cemberi | …-druid-ID3.webp | bağlandı |
| druid | 4 | Çürüyüş | curuyus-cemberi | …-druid-ID4.webp | bağlandı |
| druid | 5 | Element | element-cemberi | …-druid-ID5.webp | bağlandı |
| druid | 6 | Feza | feza-cemberi | …-druid-ID6.webp | bağlandı |
| druid | 7 | Uyku | uyku-cemberi | …-druid-ID7.webp | bağlandı |
| druid | 8 | Karadul | karadul-cemberi | …-druid-ID8.webp | bağlandı (yalnız kadin) |
| fighter | 1 | Şahin Gözlü | sahin-gozlu | …-fighter-ID1.webp | bağlandı |
| fighter | 2 | Çapkın Kavalye | capkin-kavalye | …-fighter-ID2.webp | bağlandı |
| fighter | 3 | Hissi Kablel | hissi-kablel | …-fighter-ID3.webp | bağlandı |
| fighter | 4 | Pehlivan | pehlivan | …-fighter-ID4.webp | bağlandı |
| fighter | 5 | Pehlivan (dev/büyüme hali) | — | …-fighter-ID5.webp | bağlanmadı: Pehlivan dev (büyüme) hali, alt sınıf değil; dosya duruyor |
| fighter | 6 | Ninja | ninja | …-fighter-ID6.webp | bağlandı |
| fighter | 7 | Çift Dikiş | cift-dikis | …-fighter-ID7.webp | bağlandı |
| fighter | 8 | Samuray | samuray | …-fighter-ID8.webp | bağlandı |
| fighter | 9 | Hokkabaz | hokkabaz | …-fighter-ID9.webp | bağlandı |
| fighter | 10 | Sancaktar | sancaktar | …-fighter-ID10.webp | bağlandı |
| fighter | 11 | İmparator | imza_imparator | …-fighter-ID11.webp | bağlandı (yalnız erkek) |
| fighter | — | Şampiyon | champion | — | bağlanmadı: hücresi yok, sınıf-genel Fighter jetonu |
| monk | 1 | Açık El | warrior-of-the-open-hand | …-monk-ID1.webp | bağlandı |
| monk | 2 | Astral | astral-disiplini | …-monk-ID2.webp | bağlandı |
| monk | 3 | Ayyaşlık | ayyaslik-disiplini | …-monk-ID3.webp | bağlandı |
| monk | 4 | Azizlik | azizlik-disiplini | …-monk-ID4.webp | bağlandı |
| monk | 5 | Ejderha | ejderha-disiplini | …-monk-ID5.webp | bağlandı |
| monk | 6 | Element | element-disiplini | …-monk-ID6.webp | bağlandı |
| monk | 7 | Işık | isik-disiplini | …-monk-ID7.webp | bağlandı |
| monk | 8 | Karanlık | karanlik-disiplini | …-monk-ID8.webp | bağlandı |
| monk | 9 | Keskinlik | keskinlik-disiplini | …-monk-ID9.webp | bağlandı |
| monk | 10 | Ölümsüzlük | olumsuzluk-disiplini | …-monk-ID10.webp | bağlandı |
| monk | 11 | Yaşlı Bilge | imza_bilge | …-monk-ID11.webp | bağlandı |
| paladin | 1 | Bağlılık | oath-of-devotion | …-paladin-ID1.webp | bağlandı |
| paladin | 2 | Antik | antik-yemin | …-paladin-ID2.webp | bağlandı |
| paladin | 3 | Asi/Yemin Bozan | asi-yemin-bozan | …-paladin-ID3.webp | bağlandı |
| paladin | 4 | Biat | biat-yemini | …-paladin-ID4.webp | bağlandı |
| paladin | 5 | Fetih | fetih-yemini | …-paladin-ID5.webp | bağlandı |
| paladin | 6 | İntikam | intikam-yemini | …-paladin-ID6.webp | bağlandı |
| paladin | 7 | Kefaret | kefaret-yemini | …-paladin-ID7.webp | bağlandı |
| paladin | 8 | Muhafız | muhafiz-yemini | …-paladin-ID8.webp | bağlandı |
| paladin | 9 | Zafer | zafer-yemini | …-paladin-ID9.webp | bağlandı |
| paladin | 10 | Hızır | imza_hizir | …-paladin-ID10.webp | bağlandı |
| ranger | 1 | Avcı | hunter | …-ranger-ID1.webp | bağlandı |
| ranger | 2 | Avare | avare | …-ranger-ID2.webp | bağlandı |
| ranger | 3 | Çoban | coban | …-ranger-ID3.webp | bağlandı |
| ranger | 4 | Ejder Muhafızı | ejder-muhafizi | …-ranger-ID4.webp | bağlandı |
| ranger | 5 | İbliskıran | ibliskiran | …-ranger-ID5.webp | bağlandı |
| ranger | 6 | İzci | izci | …-ranger-ID6.webp | bağlandı |
| ranger | 7 | Kovancı | kovanci | …-ranger-ID7.webp | bağlandı |
| ranger | 8 | Seyyah | seyyah | …-ranger-ID8.webp | bağlandı |
| ranger | 9 | Çiftçi | imza_ciftci | …-ranger-ID9.webp | bağlandı |
| rogue | 1 | Hırsız | thief | …-rogue-ID1.webp | bağlandı |
| rogue | 2 | Dedektif | dedektif | …-rogue-ID2.webp | bağlandı |
| rogue | 3 | İllüzyonist | illuzyonist | …-rogue-ID3.webp | bağlandı |
| rogue | 4 | Kamufle | kamufle | …-rogue-ID4.webp | bağlandı |
| rogue | 5 | Kaşif | kasif | …-rogue-ID5.webp | bağlandı |
| rogue | 6 | Psişik Hançerler | psisik-hancerler-kirpi | …-rogue-ID6.webp | bağlandı |
| rogue | 7 | Silahşör | silahsor | …-rogue-ID7.webp | bağlandı |
| rogue | 8 | Suikastçı | suikastci | …-rogue-ID8.webp | bağlandı |
| rogue | 9 | Taktisyen | taktisyen | …-rogue-ID9.webp | bağlandı |
| rogue | 10 | İnfazcı | imza_infazci | …-rogue-ID10.webp | bağlandı |

**Bağlanan kimlik satırı: 85** (cleric Birlik Manastırı iki kimlik, tek jeton). **Bağlanmayan:** cleric hücre 3 Barış; fighter hücre 5 Pehlivan (dev/büyüme hali); fighter hücre — Şampiyon.
**Eşleşemeyen (kimlik bulunamayan) hücre: yok** (Cleric Barış hücresi 3 ve Pehlivan dev hâli bilinçli bağlanmadı). Kimlik kaynağı: fikstür (`src/rules/fixtures/srd-alt-siniflar.json`), `data/imza.json`, `data/karadul.json`, `icerik-liste.txt` (dış paket).

Özel durumlar: Cleric Birlik Manastırı = `imza_birlik` ve eski `baris-alani` aynı jeton (ID9); Fighter Şampiyon sınıf-genel jeton, İmparator yalnız erkek; Druid Karadul yalnız kadın (erkek sayfada hücre 8 boş); Barbarian human sayfaları yeni sürümle üzerine yazılabilir.

Görsel kanıt: `docs/sabah/bagla-9-sinif.png` (karakter listesi, Dwarf erkek, 9 sınıfta alt sınıf seçili).
