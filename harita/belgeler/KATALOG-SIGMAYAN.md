# KATALOG-1 F: sığmayan ve yaklaşık güçler

Mühür Ruhu verisinde (`data/bosslar-muhur.json`, üretici `scripts/katalog-f-bosslar.mjs`) mevcut motora sığmayan ya da yaklaşık yazılan güçler. Tasarım: `KATALOG-F-TASARIM.md`. Yarı can fazı (Faz 2) KATALOG-F0'da (kural sürümü 107) motor kuralı oldu ve bu listede yok.

## Sığmayanlar (veride yok; `gmNot` ya da anlatımda)

| Boss | Güç (PDF/tasarım) | Neden | Önerilen yol |
|---|---|---|---|
| Hepsi (5 sanat) | "Alan N tur alev/buz/asit yüzeyi olur" | Canavar eylemi yüzey oluşturamaz | Canavar `save` yeteneğine `surface` |
| Hepsi | PDF Faz 2 arena dönüşümü (buz yarısı, yağmur, sis, ışık, yerçekimi, çağırma, sütun yıkımı) | Faz bloğu harita kuralı açamaz | Faz bloğuna `harita`/`cagir` alanları |
| Hepsi | Menzilli efsanevi ışının uzaktakini seçmesi | `rays` en yakın görüneni seçer | `rays` hedef kipi `far` |
| Hepsi | Faz 2 hamle sırası değişimi ("kuyruk önce") | Yapay zekâ önceliği veride yok | Yapay zekâ önceliği alanı |
| Mothraq | Kalıcı zehir bulutu, zehir direncini aşma | Canavar yeteneği kalıcı alan ve direnç aşma yapamaz | `zone` + `ignoreResist` |
| Gongar, Kongark | Zorla itilmeye/çekilmeye bağışıklık | Canavar pasifi yok | `forcedImmune` |
| Hydraxe | Yakın dövüşte saldırana asit | Dokunana hasar yalnız Fire Aura (1d10 ateş) | `meleeRetaliate {dice, type}` |
| Lightaur | 40 ft silindir, karanlık dağıtma | Canavar alanında silindir yok | Canavar alanına `cylinder` |
| Cerbones | İyileşmeyi yarıya indirme, maks. HP/noHeal bağışıklığı | Aura alanı yok | Aurada `healMult` |
| Kongark | Yıldız Çöküşü'nde "önce çek, sonra vur" tek eylemde | Yetenek tek adımlı | Yetenekte `then` |
| Mirage | Sahte gölge çağırma | — | `summon` (Faz 1, PDF) |

## Yaklaşık yazılanlar (veride var, tasarımdan farkı)

| Yaratık | Tasarım | Veride | Fark |
|---|---|---|---|
| Kongark | Yıldız Çöküşü: 30 ft çek + 10 ft 6d6 + Prone | Sanat 10 ft 6d6 + Prone; ayrı bonus eylem "Çekim" 15 ft | Çekme ayrı eylem |
| Hydraxe | Isırıkta zırh aşındırma (AC −1) | Yok | A2 aşındırma biçimi bu görevde bağlanmadı |
| Cimbombom | Bite'ta yanma (tur başı 2d6) | Yok | A2 `dot` bu görevde bağlanmadı |
| Wolfgang | Claw'da hız yarı | Yok; efsanevi Ayaz Halesi hızı yarıya indirir | — |
| Cerbones | Krematoryum Nefesi'nde noHeal | Yok; sanat (Kara Alev Kesiği) noHeal verir | — |
| Mirage | Misty Step 3/gün | Yok | Canavar büyüsü bu görevde bağlanmadı |
| Hydraxe | Sülfür Tufanı AC −3 "3 tur" | AC −3 "1 dk" | Süre |
| Bütün yaratıklar | `monster-ortamlari.json` kaydı | Kayıt içinde `ortam` alanı | Game Master seçicisi 330 SRD canavarını sayan testlere ve ana parçaya dokunmamak için; seçiciye bağlama ayrı iş |
