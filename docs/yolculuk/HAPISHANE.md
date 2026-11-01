# Hapishane Adası (Kuyruk 36)

Büyük suç → içeriden kurtarma + kaçış. Veri `data/hapishane.json`, Serüven sayfası `hapishane-adasi` (`data/seruven.json`, `gizli: true`), haritalar `harita/hapishane/` (`scripts/k36-hapishane.py`), motor `src/journey/seruven.ts` (komutlar), `src/journey/hapishane.ts` (veri, yardımcılar), oturum `src/app/seruvenBattle.ts` (`hapisSession`, `hapisResultCommands`, `sucSession`), arayüz `SeruvenScreen`, `YerlesimHub`. Hepsi Serüven tembel parçasında.

## Akış
1. **Büyük suç** (Beyaz Şehir hub'ı, Görevler; görev şablonu `buyuk-suc`, `zincir`): üç suç (soylu cinayeti, saray soygunu, hazine mührü) → ön savaş (`k36-suc-<suç>`) → muhafız baskını (`k36-baskin`; Guard + Warrior Veteran). Baskın kazanılırsa suç tamam (`sucOdulu` altın, `buyuk-suc-tamam`); kaybedilirse ya da **Teslim ol** → ada. Game Master "Hapse at" (Serüven kuralları paneli, Test bölümü) doğrudan adaya gönderir.
2. **Ada**: Hücre bloğu (başlangıç) → Dış halka → (Müdür kulesi, isteğe bağlı boss) → İskele → kayıkla kaçış: Batı Kıyısı **Liman** düğümü (hub'ı yok, "Yakında"), bayrak `kacis-tamam`.
3. **Kapılar** (K34b mantığı): her ada düğümünün haritasında kapı altıgenleri (`kapilar`) ve gelinen düğüme göre varış (`girisler`). Savaş bitince bir parti üyesi (öncelik mahkûm) kapıdaysa komşu düğümün savaşı hemen açılır; geçilmiş düğüm düşmansız keşiftir (ileri-geri, durum korunur).

## Mahkûm durumu ("Hapishane kuralları", varsayılan açık)
- **Emanet:** altın, iksir, eşya `hapis.emanet`'e; adadaki savaşlarda zırh, kalkan, silah ve eşya yok (`confiscated`). İskeledeki **emanet sandığı** (`emanet` nesnesi) taşınırken savaş biterse iade.
- **Tasma:** büyü yapılamaz (savaşçının büyüleri yok; sınıf özellikleri, kaynaklar, silahsız saldırı çalışır). Müdür kulesindeki **tasma anahtarı** (`tasmaAnahtari`) ya da Beyaz Şehir tapınağı ("Tasmayı çıkar": `tasmaUcreti` altın ya da hizmet = bir uzun dinlenme kadar zaman) çıkarır. Adadan sonra da kalır.
- **Doğaçlama silahlar:** bank bacağı, kova (1d4), zincir, nöbetçi sopası (1d6); alınınca SRD Improvised Weapons (STR, yetkinliksiz).
- **Kıyafet:** sınıf jetonunun yerine aynı tür/cinsiyetin Keşiş jetonu (soy rengi korunur) + turuncu hale ve hafif turuncu ton. Emanet iade edilince ya da adadan çıkınca normale döner.
- **Bayıltan nöbetçiler:** adada 0 HP öldürmez (`nonlethal`).

## Hedefler, alarm, yenilgi
- Her haritada VEYA hedefi: nöbetçileri yen **ya da** mahkûm çıkışa/kayığa varsın (`reach` + `ids: ["mahkum"]`); Müdür kulesinde yen ya da tasma anahtarını kapıya getir (`retrieve`). Mahkûm düşerse yenilgi (`fail: down`).
- Hedef hücre kilitli (`gate`, DC 15 Sleight of Hand) ya da salondaki **hücre anahtarı** (`key`) ile zarsız açılır.
- **Alarm:** haritadaki nöbetçi grubu (`groups`, calm) alarm verirse alarm +1; sonraki düğümlere alarm başına 1 ek nöbetçi (en çok `takviye.enCok`).
- **Hücre arkadaşı** (Tough) hücre bloğu ve dış halkada, **mahkûm** (Commoner, 16 HP) partiyle; ikisini de oyuncu yönetir.
- **Yenilgi:** hücre bloğunda `cezaSiniri` kez kısa ceza (hücreye geri, 1 HP ile uyanır, alarm +1); sonra ya da başka düğümde başarısızlık: Beyaz Şehir hub'ı, altın/iksir/eşya yok, tasma kalır (kalıcı büyü kaybı yok), görev yeniden alınabilir.

## Anahtarlar
`hapishaneKurallari` (açık), `hapishaneKolay` (kapalı; düğüm başına bir nöbetçi az), `savaslariAtla` (Test; atlanan düğümün sandığı/anahtarı alınmış sayılır).

## Ölçüm
`npm run sim:hapishane -- 100 [--kolay] [--parti buyucu]` (yapay zekâ iki tarafı da oynar; kazanınca mahkûm kapıya taşınmış sayılır). Sonuçlar `harita/belgeler/DENGE.md`.
