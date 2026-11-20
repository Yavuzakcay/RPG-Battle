# Pehlivan iki form tablosu (KQ6-5)

Alt sınıf kimliği `pehlivan` (Fighter, dış paket `icerik-liste.txt`); veri `data/fighter-jeton.json` `altSiniflar.pehlivan = ID4` (1. form) ve `formlar.pehlivan = { esik: 10, ikinci: ID5 }` (seviye ≥ 10: dev hali). Çözücü `src/battle/avatar.ts` `subclassTokenFile(…, level)`; `sheetAvatar` karakter listesi, savaş, oluşturucu ve Game Master kurulumunda aynı. Kayıtlı eski savaşın jetonu savaşçıda sabit (etkilenmez).

| Irk | Cinsiyet | 1. form (ID4) | 2. form (ID5) |
|---|---|---|---|
| human | erkek | var | var |
| human | kadin | var | var |
| elf | erkek | var | var |
| elf | kadin | var | var |
| dwarf | erkek | var | var |
| dwarf | kadin | var | var |
| halfling | erkek | var | var |
| halfling | kadin | var | var |
| gnome | erkek | var | var |
| gnome | kadin | var | var |
| orc | erkek | var | var |
| orc | kadin | var | var |
| tiefling | erkek | var | var |
| tiefling | kadin | var | var |
| goliath | erkek | var | var |
| goliath | kadin | var | var |
| celestial | erkek | var | var |
| celestial | kadin | var | var |

Dragonborn: Fighter alt sınıf jetonu yok (eksik uyarısı, sınıf-genel jeton). 2. formu olmayan kombinasyon yok. Başka iki formlu alt sınıf: yok (hücre sırasında yalnız Pehlivan "dev hali" var).
