# İmza alt sınıflar (Dice & Hex'e özel, ev kuralı) — dizin ve şablon

Kullanıcı kararı (2026-11-03): her sınıf için oyuna özel bir "imza alt sınıf" olacak. Kullanıcı aklına geldikçe yazar, Claude taslağı yazıp projeye kaydeder. Tek dizin burasıdır; her alt sınıfın tam tasarımı kendi belgesinde.

## Ortak kurallar
- Çekirdekte yalnız SRD 5.2.1'in 12 alt sınıfı. İmza alt sınıflar **ev kuralı**dır (`houseRule("imza_<ad>")`, varsayılan KAPALI), Celestial ve Karadul gibi. Ad ve metin ÖZGÜN; yayınlanmış alt sınıflardan kopya yok.
- Seçim 3. seviyede (etkin seviye = max(seviye,3)); özellikler sınıfın alt sınıf seviyelerinde (örn. Druid 3/6/10/14, Fighter 3/7/10/15).
- Güç bütçesi aynı sınıfın SRD alt sınıflarıyla kıyaslanır, denge ölçümü ±5 puan (100 tohum).
- Sayılar JSON parametresi, kodda sabit değil. Gerekirse kısıt (örn. cinsiyet) GM anahtarıyla kapatılabilir.
- Evren içi kaynak: her imza alt sınıfın bir tarikatı/okulu/geleneği olsun. **Yurt YOK:** yurtlar sınıfa değil ırka bağlıdır (`irklar-ve-yurtlar.md`); alt sınıf herhangi bir ırktan oyuncuya açıktır. Haritadaki bir yerle bağ isteğe bağlıdır (gelenek bir yerde doğmuş olabilir) ama oyuncunun başlangıç yurdunu belirlemez.
- Telif: ad ve özellik adları tanınmış markalardan (Warhammer, Dune vb.) alınmaz; özgün karşılık yazılır.

## Şablon (yeni alt sınıf için)
Ad TR/EN · Sınıf · Evren içi kaynak · Kimlik (tek cümle) · Kısıt varsa · 4 özellik (S3/S6/S10/S14 ya da sınıfın seviyeleri) · Motor ihtiyaçları · Denge notu · Sanat.

## Dizin
| Sınıf | Alt sınıf | Durum | Belge |
|---|---|---|---|
| Barbarian | **Geride Kalanın Yolu / Path of the Survivor** (Motivasyonu hep sınırda; yıpranmışlıktan güç, 3/6/10/14; sistem kapalıyken kendi Yıpranma sayacı) | taslak v1, kullanıcı onayı bekliyor | imza-barbarian-geride-kalan.md |
| Bard | **Şair Koleji / College of Poets** (mısra: övgü ve hiciv, 3/6/14) | taslak v1, kullanıcı onayı bekliyor | imza-bard-sair-koleji.md |
| Cleric | **Birlik Manastırı / Unity Monastery** (eski Barış Alanı, tamamen yeniden yazıldı; Bağ, Ortak Can Havuzu (biterse hepsi ölür); Motivasyon kaybı bölüşülür; 1/2/6/8/17) | taslak v2, kullanıcı onayı bekliyor | imza-cleric-birlik-manastiri.md |
| Druid | **Karadul / Black Widow** (yalnız kadın, cazibe avcısı, skor takaslı örümcek biçimi) | taslak v3, görev K48'de | karadul-alt-sinif-tasarim.md |
| Fighter | **İmparator / Emperor** (komutan; Prens → Kral → İmparator → Tanrı İmparator, 3/7/10/15) | taslak v1, kullanıcı onayı bekliyor | imza-fighter-imparator.md |
| Monk | **Yaşlı Bilge Disiplini / Elder Sage Discipline** (küçük yaşlı bilge usta arketipi; zihin gücüyle itme/çekme, sabır, yönlendirme, sakin söz; 3/6/11/17) | taslak v1, kullanıcı onayı bekliyor | imza-monk-bilge-usta.md |
| Paladin | **Hızır Yemini / Oath of Hızır** (halk kültüründeki imdada yetişen yardımcı; ışınlanıp dostu korur; 3/7/15/20) | taslak v1, kullanıcı onayı bekliyor | imza-paladin-yetisen-yemin.md |
| Ranger | **Çiftçi / Farmer** (Erzak: dinlenmede hazırlanan başak/mantar ürünü; hasat; zehir bağışıklığı; savaşta ekin yok; 3/7/11) | v1.3 ONAYLI (2026-11-05) | imza-ranger-ciftci.md |
| Rogue | **İnfazcı / Vigilante** (hüküm: hedefe karşı sert vuruş, takip, infaz; 3/9/13/17) | taslak v1, kullanıcı onayı bekliyor | imza-rogue-infazci.md |
| Sorcerer | **Dunganga / Dunganga** (Türk halk ninnisinin korku figürü; uyku, sepet/hapis, ömür elinde, Cesaret kuralı; 1/6/14/18) | taslak v2, kullanıcı onayı bekliyor | imza-sorcerer-dunganga.md |
| Warlock | **Astrolog / Astrologer** (yıldız falı, uğur/uğursuzluk, yazgı bükme; açık gökyüzünde güçlü; 3/6/10/14) | taslak v1, kullanıcı onayı bekliyor | imza-warlock-astrolog.md |
| Wizard | **Harita Öğretisi / Doctrine of the Map** (araziyi okuyup yeniden yazar; zemin değiştirme, çizili duvar, dost takası; 2/6/10/14) | taslak v1, kullanıcı onayı bekliyor | imza-wizard-harita-ogretisi.md |

## Karadul'dan çıkan genel mekanikler (diğerleri kullanabilir)
- Biçim bazlı skor takası (STR↔CHA, CON↔WIS): "iki yüzlü" alt sınıflar için şablon.
- Charmed + sürpriz vuruş zinciri: bir kez bozulma kuralı.
- Alt sınıf seçimiyle sınıf özelliğinin değiştirilmesi (Wild Shape → Örümcek Biçimi): `<özellik>:false` bayrağı.

## İmparator'dan çıkan genel mekanikler
- Çok basamaklı aura (10/20/30 ft) ve müttefik kurtulma bonusu (Paladin aurası altyapısı).
- Action Surge'e bağlı "müttefike eylem ver" kancası (yalnız izinli eylemler).
- Bonus eylemle müttefik tepkisi tetikleme (komuta).
