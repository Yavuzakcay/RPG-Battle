# Dunganga / Dunganga: Sorcerer imza alt sınıfı (ev kuralı, taslak v2, 2026-11-05; Warlock'tan taşındı)

## Çerçeve
- Ev kuralı: `houseRule("imza_dunganga")`, varsayılan KAPALI. Ad ve metin özgün; yalnız güç bütçesi SRD Sorcerer alt sınıflarıyla kıyaslanır.
- Sınıf: **Sorcerer** (kullanıcı kararı 2026-11-05; önceki Warlock taslağı v1.1'den taşındı). Alt sınıf seviyeleri Sorcerer düzeninde **1 / 6 / 14 / 18**; alt sınıf 3. seviyede seçilir, 1. seviye özellikleri 3'te açılır (etkin seviye = max(seviye, 3)).
- Kaynak: Türk halk kültüründeki korkulu ninni karakteri "Dunganga" (1986 yapımı *Ahh Belinda* filminde tanınmış). Kullanıcının verdiği ninni metni incelendi (metin buraya alınmaz). Oyundaki soy özgün yorumdur ve üç imgeye dayanır: **sepet/hapis, ömür elinde, "kendin olursan korkma"**.
- Hassasiyet notu: ninni çocukları korkutan bir figür ve siyasi yergi tonu taşıyor. Oyun metinleri çocuklara zarar ya da kaçırma anlatmaz, gerçek dünya siyasetine gönderme yapmaz; "çocuk" kelimesi geçmez. Dunganga yalnız direnen *düşmanları* sepete/hapse alır. Betim yok.
- Evren içi: annelerin ninnilerinden doğmuş korkulu gölgenin kanı bir soyun damarlarında akıyor. Yurt kullanılmaz (yurt ırka bağlı); her ırktan Sorcerer seçebilir.

## Kimlik
Kanında ninni olan büyücü: gücü doğuştan gelir, sözleşmeyle değil. Uykuyu, korkuyu ve hapsi silah yapar; ama gücünün sınırı var: kendisi olan, direnen birinden korkulacak bir şey yoktur.

## Ortak kural: Cesaret / Standing Firm
Bir Dunganga özelliğine karşı kurtulma zarını başaran yaratık, o özelliğe karşı 10 tur bağışık olur (parametre `cesaretTur`). Böylece aynı hedefe aynı özellik sürekli tekrarlanamaz; denge buna dayanır.

## Soy büyüleri (her zaman bilinen; bilinen büyü sayısına SAYILMAZ; SRD büyüleri, varlığı CC doğrular)
Seviye 1: Sleep, Bane · Seviye 2: Invisibility, Darkness · Seviye 3: Fear, Hypnotic Pattern · Seviye 4: Phantasmal Killer, Confusion · Seviye 5: Dream, Modify Memory. Her büyü, büyü seviyesine erişildiğinde açılır.

## Özellikler (TR / EN; sayılar JSON parametresi)
DC: 8 + yeterlilik bonusu + CHA modifiyesi (Sorcerer'in doğal yeteneği).

- **S1 (3'te açılır) · Ninni Kanı / Lullaby Blood:** Soy büyüleri listene eklenir. **Ninni / Lullaby:** eylem; 30 ft içinde sesini duyan seçtiğin yaratıklar WIS kurtulması atar. Kaybedenler "Uykulu" olur: hızı yarıya iner ve bir sonraki turunun sonuna dek saldırı zarlarında dezavantajlıdır. Daha önce Frightened olan hedefler kurtulmada dezavantajlıdır. Aynı anda en çok CHA modifiyesi (en az 1) hedef. Kullanım: yeterlilik bonusu kadar ücretsiz (kısa dinlenmede yenilenir); sonrası 1 Büyücülük Puanı.
- **S6 · Sepet (Hapis) / Basket:** eylem; 30 ft içinde bir yaratık, 3 Büyücülük Puanı (uzun dinlenmede bir kez ücretsiz). Hedef WIS kurtulması atar; Uykulu ya da Frightened ise kurtulmada dezavantajlıdır. Kaybederse **sepete atılır**: 2 tur boyunca etkisiz bırakılmış olur ve hareket edemez; hasar alırsa biter. Efsanevi/boss hedeflerde yalnız 1 tur. Aynı anda en çok 1 sepet.
- **S14 · Kâbus / Nightmare:** Uyku, korku ve büyülenme etkilerine bağışıksın. Frightened olan düşmanlar kendi turlarının başında 1d10 + CHA modifiyesi zihin hasarı alır. Ayrıca Ninni artık 1 Büyücülük Puanıyla en çok 2 kat hedefe ulaşır (Metamagic benzeri, soy bonusu; parametre `ninniHedefCarpani`).
- **S18 · Dunganga Çağrısı / Call of Dunganga:** eylem; uzun dinlenmede 1 (ek kullanım 7 Büyücülük Puanı); 10 tur. 30 ft yarıçaplı bir karanlık ninni alanı, seninle hareket eder. İçindeki her düşman kendi turunun başında WIS kurtulması atar; kaybeden Uykulu olur ve 2d10 zihin hasarı alır. **Ömür Elinde:** alandaki düşmanlar can yenileyemez ve ölüm kurtulma zarlarında dezavantajlıdır. Bu sürede Sepet'i bonus eylemle kullanabilir ve aynı anda en çok yeterlilik bonusu kadar sepet taşıyabilirsin.

## Oyuncuya görünen metin (sade)
- **Ninni Kanı (3):** Uyku, korku ve kabus büyüleri hep elinin altında. Bir ninni mırıldan: duyan düşmanlar uykulanır, yavaşlar ve vurmakta zorlanır.
- **Sepet (6):** Bir düşmanı sepete at: direnemezse birkaç tur uykuya dalıp beklemek zorunda kalır.
- **Kâbus (14):** Uykudan, korkudan ve büyüden etkilenmezsin; korkan düşmanlar her tur acı çeker. Ninni daha çok kişiye ulaşır.
- **Dunganga Çağrısı (18):** 10 tur boyunca etrafını karanlık bir ninni sarar: içindeki düşmanlar uykulanır, acı çeker ve can yenileyemez.
- **Cesaret (ortak kural):** Etkiye direnen yaratık, o etkiye 10 tur bağışık olur.

## Motor ihtiyaçları
- "Uykulu" durumu: yeni hafif durum (hız ½, saldırı dezavantajı, bir tur süre). Sepet: "etkisiz + hareketsiz; hasar uyandırır" (SRD'de olmayan durum eklememek için).
- Büyücülük Puanı harcama kancası (mevcut Metamagic altyapısı); ücretsiz kullanım sayacı + SP seçeneği.
- Bağışıklık (uyku, korku, büyülenme): mevcut koşul bağışıklığı kancası; korkulu düşmana tur başı hasar (aura benzeri tur başı kancası).
- Dunganga Çağrısı: seninle hareket eden alan (aura altyapısı), tur başı kurtulma + hasar; Ömür Elinde: "can yenileyemez" + ölüm kurtulma dezavantajı bayrağı.
- Cesaret: yaratık başına, özellik başına bağışık sayacı (10 tur).
- Soy büyüleri: alt sınıf büyü ekleme kancası, "bilinen sayısına sayılmaz"; SRD'de olmayan büyü çıkarsa en yakın SRD büyüsüyle değiştir, raporla.
- Alt sınıf seçilince sınıf özellikleri değişmez (yalnız ekleme).

## Denge
SRD Sorcerer alt sınıflarıyla (Draconic Sorcery vb.) 100 tohum karşılaştırma, ±5 puan (S1/S6/S14/S18). Riskler: Sepet bir tür kısa süreli devre dışı bırakma (Hold Person/Banishment benzeri): boss'ta 1 tur, SP ve Cesaret ile sınırlı; Ninni'nin Uykulu durumu çok güçlüyse hız/dezavantaj ya da süre kırpılır. S18 capstone tek kullanımlık + 7 SP; Draconic Sorcery'nin S18'iyle karşılaştırılır. Sorcerer 3.–13. seviye arası alt sınıf özelliği az (S6 yalnız Sepet): bu aralıkta güç düşük çıkarsa Ninni/Sepet parametreleri ayarlanır.

## Açık sorular (varsayılan yazıldı)
1. "Uykulu" yerine mevcut bir durumla (yalnız hız ½ + dezavantaj) mı çalışalım?
2. İsteğe bağlı yer bağı: Negatif Alan Zaptı (hapis teması).
3. Sanat: simge (sepet/ay) ve renk; ilk sürümde mevcut Sorcerer jetonu yeter.
