# M1: 6.–9. seviye büyü metni ↔ motor farkları (yalnız rapor)

Kuyruk M1'de `data/spells-69.json` `text` alanı SRD 5.2.1 metninden yazıldı. Aşağıdaki satırlarda metin (SRD) ile motorun bugünkü hâli (birleşik mekanik: taban + `a4`/`a6`/`a7`/`a8`/`s1`/`s2` blokları, kural sürümü 42) ayrılıyor. **Hiçbiri düzeltilmedi** (mekanik donması); karar kullanıcının. Zaten `approx`/`sigmayan`/`kapsamDisi`/Game Master notuyla belgelenmiş yaklaşıklar (Mass Suggestion iki seçenek, Plane Shift, Animal Shapes, Wish, silindirin küre sayılması) listeye alınmadı.

| Kimlik | Metin (SRD) | Motor |
|---|---|---|
| blade-barrier | hasar Force (kuvvet) | `damageType: slashing` (döküm ve alan tetiği) |
| conjure-fey | üst slot başına +1d12 | `upcast.dice: 2d12` |
| delayed-blast-fireball | 12d6, büyü sürdükçe her tur sonu +1d6 birikir, büyü bitince patlar | dökümde hemen 12d6 (birikme ve gecikme yok) |
| fire-storm | on adede dek bitişik 10 ft küp | tek 25 ft küre |
| wall-of-ice | duvar bölümü AC 12, 30 HP; kırılan yerde soğuk hava perdesi (CON save 5d6 cold) | katı duvar alanı; kırılma ve perde yok |
| earthquake | save dökümde ve büyücünün tur sonlarında; yarıklar, yapılara 50 bludgeoning | save tur başında (`on: start`); yarık ve yapı hasarı yok |
| forcecage | alan (20 ft kafes ya da 10 ft kutu), içindeki herkes | tek hedef (`targets: 1`, `sealed`) |
| irresistible-dance | başarılı save'de bir tur yerinde dans | başarılı save'de etki yok |
| flesh-to-stone | başarılı save'de bir tur hız 0; 3 başarı büyüyü bitirir | başarılı save'de hız 0 yok; yalnız 3 başarısızlık → Petrified |
| sunburst | Blinded 1 dakika, tur sonlarında CON save | Blinded veride süre/yeniden save tanımı olmadan |
| true-seeing | 120 ft Truesight | `seeInvisible` + 120 ft karanlık görüş (yaklaşık) |

11 satır.
