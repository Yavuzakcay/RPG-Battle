# İmparator / Emperor: Fighter imza alt sınıfı (ev kuralı, taslak v1, 2026-11-04)

## Çerçeve
- Ev kuralı: `houseRule("imza_imparator")`, varsayılan KAPALI (Celestial ve Karadul gibi). Ad ve metin özgün; yalnız güç bütçesi SRD Fighter alt sınıfı (Champion) ile kıyaslanır.
- Seçim 3. seviyede. Fighter alt sınıf seviyeleri 3 / 7 / 10 / 15 (Champion'daki düzen), dört basamak kullanıcının sırasıyla: **Prens → Kral → İmparator → Tanrı İmparator**. 18. seviyede ek özellik yok (isteğe bağlı sonraya).
- Evren içi kaynak: hükümdar hanedanı geleneği. Yurt kullanılmaz (yurt ırka bağlı); isteğe bağlı yer bağı: Tenhausser Kalesi (Kral'ın yeri). Kullanıcı onaylar.

## Kimlik
Doğuştan lider: kılıcıyla kadar sözüyle de hükmeden bir komutan. Kendi gücünden çok çevresindeki müttefiklerin gücünü büyüten, her basamakta "taht" biraz daha genişleyen bir savaşçı. Fighter'ın savaş ustalığı tam, alt sınıf ek olarak **komuta ve ağırlık (auranın)** verir.

## Özellikler (TR / EN; sayılar JSON parametresi)
Alt sınıf özelliklerinin DC'si: **8 + yeterlilik bonusu + CHA modifiyesi** (Fighter için CHA genelde düşük: bu bilinçli bir bedel; istenirse STR/CHA'dan yüksek olan seçilir, parametre `dcYetenegi`).

- **S3 · PRENS / Prince**
  - *Asil Terbiye / Noble Upbringing:* Persuasion ya da Intimidation yeterliliği (birini seç) + bir dil. Ek yeterlilik kısıt dışı.
  - *Buyruk / Decree:* Bonus eylem. 30 ft içinde sesini duyabilen bir müttefik, tepkisini hemen kullanarak tek silahlı saldırı yapar ya da hareketinin yarısı kadar sağlam bir şekilde yer değiştirir (fırsat saldırısı doğurmaz). Kullanım: yeterlilik bonusu kadar, kısa dinlenmede yenilenir. Sen aynı turda saldırı yapabilirsin (kendi saldırından vazgeçmezsin; bu yüzden müttefik başına tur başına en çok bir).
- **S7 · KRAL / King**
  - *Taht Varlığı / Crown Presence:* 10 ft'lik aura (parametre): sen ve içindeki müttefikler Frightened ve Charmed'a karşı kurtulma zarlarında +1 alır (parametre; S15'te +2); sen etkisiz bırakılmadıkça sürer.
  - *Hükümdar Sözü / Royal Word:* Bonus eylem. 60 ft içinde bir düşman WIS kurtulması atar (DC yukarıdaki); başarısızsa seni son hedef sayarak 1 tur boyunca sana ve seninle 5 ft içindeki müttefiklere saldırırken dezavantajlı olur (zorla yönlendirme yok, yalnız dezavantaj). Kullanım: 1, kısa dinlenmede yenilenir.
- **S10 · İMPARATOR / Emperor**
  - *Ferman / Edict:* Action Surge kullandığında 60 ft içinde sesini duyan bir müttefik de ek bir eylem kazanır (yalnız Attack, Dash, Dodge, Help, Hide ya da bir kez büyü olmayan eylem; büyü yapma ve bonus eylem verilmez). Ferman uzun dinlenmede en çok bir kez çalışır. Sen Action Surge'i kullanmadıkça işlemez (bedel: eylem sensin).
  - *Taht Aurası genişler:* Taht Varlığı yarıçapı 20 ft olur.
- **S15 · TANRI İMPARATOR / Divine Emperor**
  - *Yüce Taht / Exalted Throne:* Bonus eylem. 10 tur boyunca aura 30 ft olur; içindeki müttefikler saldırı zarlarına ve hasara +yeterlilik bonusu kadar (parametre: PB/2) ekler, sen ek olarak tüm hasar türlerine dirençlisin ve her turun başında 2 × Fighter seviyesi kadar geçici can kazanırsın. Kullanım: uzun dinlenmede 1.
  - *Ölümsüz Taht / Undying Throne:* 0 HP'ye düştüğünde 1 HP'de kalırsın (uzun dinlenmede bir kez); aynı anda 30 ft içindeki müttefikler bir sonraki saldırılarında avantaj kazanır.

## İsim notu (ticari/telif kontrolü)
"God Emperor" ifadesi Warhammer 40.000 ("God-Emperor of Mankind") ve Dune ("God Emperor of Dune") için tanınmış bir addır. Oyun içi metinde ve mağaza adında bunun yerine **Tanrı İmparator / Divine Emperor** (özgün) kullanılması öneri; kullanıcı onayı bekliyor. Özellik adları ve metinleri özgün yazıldı.

## Motor ihtiyaçları
- Bonus eylemle müttefikin tepkisini tetikleme (`Buyruk`): mevcut tepki ve "tek silahlı saldırı" altyapısı; "yer değiştirme" için fırsat saldırısı doğurmayan hareket kancası.
- Aura (S7, S10, S15): 10/20/30 ft yarıçaplı müttefik aurası ve kurtulma zarına bonus; mevcut aura altyapısı (Paladin Aura of Protection) yeniden kullanılır.
- Hükümdar Sözü: "bu hedefe saldırırken sana ve 5 ft'tekilere dezavantaj" durum etiketi (1 tur).
- Ferman: Action Surge'e bağlı "başka birine eylem ver" kancası (yalnız izinli eylem listesi).
- Yüce Taht: geçici can ve tüm hasar direnci (mevcut); Ölümsüz Taht: Indomitable/0 HP kancası ile aynı mekanizma.
- Alt sınıf seçilince sınıf özelliklerini DEĞİŞTİRME (Karadul'un aksine); yalnız ekleme.

## Denge
Champion ile 100 tohum karşılaştırma, ±5 puan (S3/S7/S10/S15). Risk: aura + Ferman + Yüce Taht birlikte çok güçlü olabilir; CHA bedeli (düşük DC) ve kullanım sınırları ilk ayar noktası. Parti kurulumunda Fighter'a **yalnız bir** İmparator (aura çakışmaz: aynı etki bir kez uygulanır) kuralı.

## Açık sorular (varsayılanlar yazıldı, kullanıcı değiştirir)
1. İsteğe bağlı yer bağı: Tenhausser Kalesi kalsın mı?
2. DC yeteneği: CHA mı, STR/CHA'dan yüksek olan mı?
3. "God Emperor" yerine "Divine Emperor" onayı.
4. Sanat: alt sınıf simgesi (taç/asa) ve renk; ilk sürümde mevcut Fighter jetonu yeter.

## Oyuncuya görünen metin (sade, kartta bu çıkar)
Kural: terim yok (DC, save, aura, reaksiyon yazılmaz); her özellik en çok iki cümle; sayılar kartta ayrı kısa satır.
- **Prens (3):** Asil Terbiye: İkna ya da Korkutma becerilerinden birinde ustasın, bir dil daha bilirsin. Buyruk: Bir dostuna seslen, hemen bir saldırı yapar ya da güvenle yer değiştirir (dinlenmeden önce birkaç kez).
- **Kral (7):** Taht Varlığı: Etrafındaki dostlar (sen dahil) korkuya ve büyülenmeye karşı daha dirençli olur. Hükümdar Sözü: Bir düşmana emret; direnemezse bir tur boyunca seni ve yanındakileri vurmakta zorlanır.
- **İmparator (10):** Ferman: Ek eylem kullandığında bir dostun da ek bir eylem kazanır. Genişleyen Taht: Taht Varlığı'nın alanı büyür.
- **Tanrı İmparator (15):** Yüce Taht: 10 tur boyunca dostların daha sert vurur, sen hasara dayanıklı olur ve canın yenilenir. Ölümsüz Taht: Ölecekken bir kez 1 canla ayakta kalırsın, dostların da güçlenir.
(EN karşılıkları aynı sadelikte yazılır; teknik sayı satırı: menzil, kullanım, bonus.)
Bu kural diğer imza alt sınıflar için de geçerli: önce sade oyuncu metni, teknik ayrıntı altında.
