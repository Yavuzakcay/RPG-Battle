# Hale v2 önizleme (KQ6-10, yalnız önizleme — uygulanmadı)

`python3 scripts/hale-v2.py` → bu klasör. Yöntem: halka şekli (içi boş ince elips ya da yay) bulunur, baş kütlesi (3 px açılmış opak kütle + 3 px genişletme, baş satırının altı tümüyle) korunur; renk eşiği tek başına silmez. Baş kutusu (macenta çerçeve) alfa>0 sayısı değişirse ya da başa değen halka kalıntısı >40 px ise silme iptal → ELLE. Tam halka: dokunulmaz (çizim modunda); belirsiz (başın üstünde halka olabilecek artık): çizim yapılmaz, ELLE.

| Mod | Jeton | Durum | Baş kutusu önce→sonra | Silinen hale px | Kalan hale px | Çizilen px | Sonuç |
|---|---|---|---|---:|---:|---:|---|
| cizim | celestial-erkek-barbarian-ID7 | tam | 4297 → 4297 | 0 | 0 | 0 | dokunulmadı |
| cizim | celestial-erkek-druid-ID1 | tam | 7619 → 7619 | 0 | 1 | 0 | dokunulmadı |
| cizim | celestial-erkek-barbarian-ID1 | belirsiz | 5254 → 5254 | 0 | 0 | 0 | iptal → ELLE: başın üstünde halka olabilecek artık var (çift hale riski) |
| cizim | celestial-erkek-barbarian-ID3 | tam | 4533 → 4533 | 0 | 188 | 0 | dokunulmadı |
| cizim | celestial-erkek-barbarian-ID2 | kesik | 4271 → 4271 | 655 | 47 | 0 | iptal → ELLE: halka başa değiyor: 47 px silinemedi (kalıntı) |
| cizim | celestial-erkek-barbarian-ID4 | belirsiz | 6357 → 6357 | 0 | 0 | 0 | iptal → ELLE: başın üstünde halka olabilecek artık var (çift hale riski) |
| gece | celestial-erkek-barbarian-ID1 | belirsiz | 5254 → 5254 | 0 | 0 | 0 | iptal → ELLE: başın üstünde halka olabilecek artık var (çift hale riski) |
| gece | celestial-erkek-bard-ID5 | belirsiz | 4524 → 4524 | 0 | 0 | 0 | iptal → ELLE: başın üstünde halka olabilecek artık var (çift hale riski) |
| gece | celestial-erkek-cleric-ID3 | tam | 4678 → 4678 | 682 | 0 | 0 | tamam |
| gece | celestial-erkek-druid-ID7 | tam | 4338 → 4338 | 658 | 0 | 0 | tamam |
| gece | celestial-erkek-fighter-ID1 | tam | 5276 → 5276 | 716 | 0 | 0 | tamam |
| gece | celestial-erkek-monk-ID4 | tam | 3834 → 3834 | 658 | 0 | 0 | tamam |
| gece | celestial-erkek-paladin-ID8 | kesik | 3551 → 3551 | 0 | 69 | 0 | iptal → ELLE: halka başa değiyor: 69 px silinemedi (kalıntı) |
| gece | celestial-erkek-ranger-ID5 | kesik | 5101 → 5101 | 410 | 39 | 0 | tamam |
| gece | celestial-erkek-rogue-ID3 | tam | 6493 → 6493 | 570 | 38 | 0 | tamam |
| gece | celestial-erkek-sorcerer-SC-1 | tam | 5262 → 5262 | 605 | 0 | 0 | tamam |
| gece | celestial-erkek-warlock-WL-3 | tam | 5769 → 5769 | 0 | 125 | 0 | iptal → ELLE: halka başa değiyor: 125 px silinemedi (kalıntı) |
| gece | celestial-erkek-wizard-WZ-A1 | tam | 4573 → 4573 | 539 | 0 | 0 | tamam |

ELLE listesi: celestial-erkek-barbarian-ID1, celestial-erkek-barbarian-ID2, celestial-erkek-barbarian-ID4, celestial-erkek-barbarian-ID1, celestial-erkek-bard-ID5, celestial-erkek-paladin-ID8, celestial-erkek-warlock-WL-3
