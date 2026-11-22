# Eksikler ham sayfaları: kaynak denetimi

Üretildi: `PYTHONUTF8=1 python scripts/eksikler-kaynak-denetim.py` (2026-11-22). **Yalnız rapor**: jeton yazılmadı. Ham klasör: `~/OneDrive/Masaüstü/sinif-sayfalari-final/Eksikler` (Celestial hale sayfaları hariç; onlar `CELESTIAL-KAYNAK-DENETIM.md`).

Hücreler kesicinin kendi işlevleriyle ayıklanır (`cc-kesim.py`); hücre → jeton tam sınıf sayfasında sınıf düzeninden (kesilmemiş hücreler dahil), ötekilerde kesim defterinden. Skor 0–100 (renk dağılımı; bütün figür + baş): aynı çizim ≈ 2–20, farklı ≈ 25+. Kesim defteri: `data/cc-kesim-kaynak.json` kazananı. Tam sınıf sayfasında aynı adlı ESKİ sayfa (2026-11-16 toplu kesimin kaynağı, `RPG-Battle-ham/assets-ham/karakter/`) varsa biçim karşılaştırması da yapılır (parlaklık deseni + örtüşme; renk kayması sayılmaz): jeton eski sayfaya belirgin yakınsa (≥ 3) "ESKİ SAYFADAN"; eski ve yeni sayfa aynı boyuttaysa hücre kutusunda ham piksel farkı da ölçülür (≤ 6: JPEG gürültüsü, çizim aynı). Görsel: `gorsel-dokum/eksikler-kaynak/eski-kalanlar.png` (eski sayfa | güncel sayfa | oyunda).

## Özet

| Durum | Hücre |
|---|---:|
| ESKİ SAYFADAN (yeni sayfadan kesilmemiş) | 6 |
| FARKLI (bu sayfadan kesilmemiş) | 2 |
| aynı çizim (bu sayfadan kesilmedi) | 7 |
| aynı çizim (eski ve yeni sayfa piksel düzeyinde aynı) | 8 |
| güncel | 227 |
| uygulanmadı: iki Goliath ayırt edilemedi (2026-11-19 kararı, cc-kesim.py SORC_BELIRSIZ) | 2 |

## Oyundaki jeton sayfadaki çizimden farklı

| Sayfa | Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni sayfa / eski sayfa (sayfalar arası) | Kesim defteri kazananı | Son commit |
|---|---:|---|---|---|---|---|---|
| druid-female-tiefling.jpg | 1 | `tiefling-kadin-druid-ID1` | ESKİ SAYFADAN (yeni sayfadan kesilmemiş) | 27.1 (33.0) | 27.6 / 16.0 (20.1) | kayıt yok | 987fc6de 2026-11-16 TOPLU-KESIM: 11 sınıfın alt sınıf jetonları kesildi (1890), Warlock/Sorcerer bağlandı |
| druid-female-tiefling.jpg | 2 | `tiefling-kadin-druid-ID2` | ESKİ SAYFADAN (yeni sayfadan kesilmemiş) | 29.5 (40.1) | 12.3 / 4.9 (10.8) | kayıt yok | 987fc6de 2026-11-16 TOPLU-KESIM: 11 sınıfın alt sınıf jetonları kesildi (1890), Warlock/Sorcerer bağlandı |
| druid-female-tiefling.jpg | 3 | `tiefling-kadin-druid-ID3` | ESKİ SAYFADAN (yeni sayfadan kesilmemiş) | 28.8 (37.7) | 25.8 / 20.4 (18.4) | kayıt yok | 987fc6de 2026-11-16 TOPLU-KESIM: 11 sınıfın alt sınıf jetonları kesildi (1890), Warlock/Sorcerer bağlandı |
| druid-female-tiefling.jpg | 5 | `tiefling-kadin-druid-ID5` | ESKİ SAYFADAN (yeni sayfadan kesilmemiş) | 35.2 (41.9) | 20.1 / 5.4 (20.6) | kayıt yok | 987fc6de 2026-11-16 TOPLU-KESIM: 11 sınıfın alt sınıf jetonları kesildi (1890), Warlock/Sorcerer bağlandı |
| druid-female-tiefling.jpg | 6 | `tiefling-kadin-druid-ID6` | FARKLI (bu sayfadan kesilmemiş) | 35.9 (42.1) | 21.2 / 21.4 (11.6) | kayıt yok | 987fc6de 2026-11-16 TOPLU-KESIM: 11 sınıfın alt sınıf jetonları kesildi (1890), Warlock/Sorcerer bağlandı |
| druid-female-tiefling.jpg | 7 | `tiefling-kadin-druid-ID7` | FARKLI (bu sayfadan kesilmemiş) | 32.5 (38.6) | 27.7 / 26.6 (13.5) | kayıt yok | 987fc6de 2026-11-16 TOPLU-KESIM: 11 sınıfın alt sınıf jetonları kesildi (1890), Warlock/Sorcerer bağlandı |
| druid-female-tiefling.jpg | 8 | `tiefling-kadin-druid-ID8` | ESKİ SAYFADAN (yeni sayfadan kesilmemiş) | 42.0 (42.3) | 71.0 / 27.6 (68.2) | kayıt yok | 987fc6de 2026-11-16 TOPLU-KESIM: 11 sınıfın alt sınıf jetonları kesildi (1890), Warlock/Sorcerer bağlandı |
| druid-male-tiefling.jpg | 7 | `tiefling-erkek-druid-ID7` | ESKİ SAYFADAN (yeni sayfadan kesilmemiş) | 15.0 (14.6) | 18.8 / 14.0 (18.6) | kayıt yok | 987fc6de 2026-11-16 TOPLU-KESIM: 11 sınıfın alt sınıf jetonları kesildi (1890), Warlock/Sorcerer bağlandı |

## Sayfa sayfa

### druid-female-tiefling.jpg

Druid Tiefling (tam sınıf sayfası; C adımında yalnız hücre 4 kesildi). Ayıklama `sinif:druid`; ESKİ SAYFADAN (yeni sayfadan kesilmemiş): 5, FARKLI (bu sayfadan kesilmemiş): 2, güncel: 1.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `tiefling-kadin-druid-ID1` | ESKİ SAYFADAN (yeni sayfadan kesilmemiş) | 27.1 (33.0) | 27.6 / 16.0 (20.1) | kayıt yok |
| 2 | `tiefling-kadin-druid-ID2` | ESKİ SAYFADAN (yeni sayfadan kesilmemiş) | 29.5 (40.1) | 12.3 / 4.9 (10.8) | kayıt yok |
| 3 | `tiefling-kadin-druid-ID3` | ESKİ SAYFADAN (yeni sayfadan kesilmemiş) | 28.8 (37.7) | 25.8 / 20.4 (18.4) | kayıt yok |
| 4 | `tiefling-kadin-druid-ID4` | güncel | 9.8 (11.1) | 2.3 / 57.8 (58.4) | druid-female-tiefling.jpg h4 |
| 5 | `tiefling-kadin-druid-ID5` | ESKİ SAYFADAN (yeni sayfadan kesilmemiş) | 35.2 (41.9) | 20.1 / 5.4 (20.6) | kayıt yok |
| 6 | `tiefling-kadin-druid-ID6` | FARKLI (bu sayfadan kesilmemiş) | 35.9 (42.1) | 21.2 / 21.4 (11.6) | kayıt yok |
| 7 | `tiefling-kadin-druid-ID7` | FARKLI (bu sayfadan kesilmemiş) | 32.5 (38.6) | 27.7 / 26.6 (13.5) | kayıt yok |
| 8 | `tiefling-kadin-druid-ID8` | ESKİ SAYFADAN (yeni sayfadan kesilmemiş) | 42.0 (42.3) | 71.0 / 27.6 (68.2) | kayıt yok |

Görsel: `gorsel-dokum/eksikler-kaynak/druid-female-tiefling.png`.

### druid-male-tiefling.jpg

Druid Tiefling (tam sınıf sayfası; C adımında yalnız hücre 4 kesildi). Ayıklama `sinif:druid`; ESKİ SAYFADAN (yeni sayfadan kesilmemiş): 1, aynı çizim (bu sayfadan kesilmedi): 5, güncel: 1.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `tiefling-erkek-druid-ID1` | aynı çizim (bu sayfadan kesilmedi) | 14.6 (15.1) | 18.7 / 21.1 (7.0) | kayıt yok |
| 2 | `tiefling-erkek-druid-ID2` | aynı çizim (bu sayfadan kesilmedi) | 17.2 (20.6) | 8.8 / 6.9 (4.7) | kayıt yok |
| 3 | `tiefling-erkek-druid-ID3` | aynı çizim (bu sayfadan kesilmedi) | 9.6 (9.8) | 12.6 / 11.5 (4.8) | kayıt yok |
| 4 | `tiefling-erkek-druid-ID4` | güncel | 10.8 (11.5) | 1.0 / 6.0 (5.8) | druid-male-tiefling.jpg h4 |
| 5 | `tiefling-erkek-druid-ID5` | aynı çizim (bu sayfadan kesilmedi) | 16.3 (13.1) | 23.7 / 23.6 (7.1) | kayıt yok |
| 6 | `tiefling-erkek-druid-ID6` | aynı çizim (bu sayfadan kesilmedi) | 18.4 (17.7) | 14.0 / 13.7 (6.8) | kayıt yok |
| 7 | `tiefling-erkek-druid-ID7` | ESKİ SAYFADAN (yeni sayfadan kesilmemiş) | 15.0 (14.6) | 18.8 / 14.0 (18.6) | kayıt yok |

Görsel: `gorsel-dokum/eksikler-kaynak/druid-male-tiefling.png`.

### cleric-male-tiefling.jpg

Cleric erkek Tiefling (tam sınıf sayfası; C adımında yalnız hücre 9 kesildi). Ayıklama `sinif:cleric`; aynı çizim (bu sayfadan kesilmedi): 1, aynı çizim (eski ve yeni sayfa piksel düzeyinde aynı): 8.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `tiefling-erkek-cleric-ID1` | aynı çizim (eski ve yeni sayfa piksel düzeyinde aynı) | 9.0 (8.5) | 22.9 / 22.7 (1.3) | kayıt yok |
| 2 | `tiefling-erkek-cleric-ID2` | aynı çizim (eski ve yeni sayfa piksel düzeyinde aynı) | 10.9 (12.7) | 24.8 / 24.8 (1.7) | kayıt yok |
| 3 | `tiefling-erkek-cleric-ID3` | aynı çizim (eski ve yeni sayfa piksel düzeyinde aynı) | 8.5 (9.9) | 20.1 / 18.5 (3.1) | kayıt yok |
| 4 | `tiefling-erkek-cleric-ID4` | aynı çizim (eski ve yeni sayfa piksel düzeyinde aynı) | 9.9 (12.0) | 2.8 / 2.6 (1.3) | kayıt yok |
| 5 | `tiefling-erkek-cleric-ID5` | aynı çizim (eski ve yeni sayfa piksel düzeyinde aynı) | 8.1 (10.5) | 14.3 / 14.9 (2.1) | kayıt yok |
| 6 | `tiefling-erkek-cleric-ID6` | aynı çizim (eski ve yeni sayfa piksel düzeyinde aynı) | 8.1 (10.2) | 18.4 / 8.2 (16.3) | kayıt yok |
| 7 | `tiefling-erkek-cleric-ID7` | aynı çizim (eski ve yeni sayfa piksel düzeyinde aynı) | 8.9 (9.8) | 17.3 / 16.7 (1.8) | kayıt yok |
| 8 | `tiefling-erkek-cleric-ID8` | aynı çizim (eski ve yeni sayfa piksel düzeyinde aynı) | 9.3 (12.4) | 8.7 / 8.9 (2.3) | kayıt yok |
| 9 | `tiefling-erkek-cleric-ID9` | aynı çizim (bu sayfadan kesilmedi) | 19.5 (22.0) | 2.6 / 40.3 (40.0) | cleric-id9-halka/aday + kalın halka h9 |

Görsel: `gorsel-dokum/eksikler-kaynak/cleric-male-tiefling.png`.

### tiefling-kadin-cleric-ID9.jpg

kadın Tiefling Cleric ID9 (tek figür; defterde "tiefling-kadin-cleric-ID9-yeni.jpg + halka"). Ayıklama `tek`; aynı çizim (bu sayfadan kesilmedi): 1.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `tiefling-kadin-cleric-ID9` | aynı çizim (bu sayfadan kesilmedi) | 15.0 (15.9) | - / - (-) | tiefling-kadin-cleric-ID9-yeni.jpg + halka h9 |

Görsel: `gorsel-dokum/eksikler-kaynak/tiefling-kadin-cleric-ID9.png`.

### barbarian-female-aurasiz.jpg

Barbarian aurasız ID8 (kadin; sıra human, elf, dwarf, halfling, gnome, orc, tiefling, goliath). Ayıklama `bodies:8`; güncel: 8.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `human-kadin-barbarian-ID8` | güncel | 8.1 (8.1) | - / - (-) | barbarian-female-aurasiz.jpg h1 |
| 2 | `elf-kadin-barbarian-ID8` | güncel | 8.4 (8.1) | - / - (-) | barbarian-female-aurasiz.jpg h2 |
| 3 | `dwarf-kadin-barbarian-ID8` | güncel | 9.9 (10.9) | - / - (-) | barbarian-female-aurasiz.jpg h3 |
| 4 | `halfling-kadin-barbarian-ID8` | güncel | 8.2 (8.2) | - / - (-) | barbarian-female-aurasiz.jpg h4 |
| 5 | `gnome-kadin-barbarian-ID8` | güncel | 14.1 (14.1) | - / - (-) | barbarian-female-aurasiz.jpg h5 |
| 6 | `orc-kadin-barbarian-ID8` | güncel | 6.1 (5.3) | - / - (-) | barbarian-female-aurasiz.jpg h6 |
| 7 | `tiefling-kadin-barbarian-ID8` | güncel | 7.6 (8.0) | - / - (-) | barbarian-female-aurasiz.jpg h7 |
| 8 | `goliath-kadin-barbarian-ID8` | güncel | 7.1 (7.6) | - / - (-) | barbarian-female-aurasiz.jpg h8 |

Görsel: `gorsel-dokum/eksikler-kaynak/barbarian-female-aurasiz.png`.

### barbarian-male-aurasiz.jpg

Barbarian aurasız ID8 (erkek; sıra human, elf, dwarf, halfling, gnome, orc, tiefling, goliath). Ayıklama `bodies:8`; güncel: 8.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `human-erkek-barbarian-ID8` | güncel | 11.4 (13.0) | - / - (-) | barbarian-male-aurasiz.jpg h1 |
| 2 | `elf-erkek-barbarian-ID8` | güncel | 8.7 (9.1) | - / - (-) | barbarian-male-aurasiz.jpg h2 |
| 3 | `dwarf-erkek-barbarian-ID8` | güncel | 7.1 (7.3) | - / - (-) | barbarian-male-aurasiz.jpg h3 |
| 4 | `halfling-erkek-barbarian-ID8` | güncel | 16.2 (15.7) | - / - (-) | barbarian-male-aurasiz.jpg h4 |
| 5 | `gnome-erkek-barbarian-ID8` | güncel | 7.8 (7.5) | - / - (-) | barbarian-male-aurasiz.jpg h5 |
| 6 | `orc-erkek-barbarian-ID8` | güncel | 5.9 (6.6) | - / - (-) | barbarian-male-aurasiz.jpg h6 |
| 7 | `tiefling-erkek-barbarian-ID8` | güncel | 9.1 (9.3) | - / - (-) | barbarian-male-aurasiz.jpg h7 |
| 8 | `goliath-erkek-barbarian-ID8` | güncel | 4.5 (4.7) | - / - (-) | barbarian-male-aurasiz.jpg h8 |

Görsel: `gorsel-dokum/eksikler-kaynak/barbarian-male-aurasiz.png`.

### fighter-male-human.jpg

Human Fighter erkek (tam sınıf sayfası). Ayıklama `sinif:fighter`; güncel: 11.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `human-erkek-fighter-ID1` | güncel | 8.8 (9.5) | 1.1 / 69.2 (69.0) | fighter-male-human.jpg h1 |
| 2 | `human-erkek-fighter-ID2` | güncel | 6.1 (6.5) | 2.2 / 65.2 (65.5) | fighter-male-human.jpg h2 |
| 3 | `human-erkek-fighter-ID3` | güncel | 7.2 (8.6) | 5.0 / 96.1 (95.8) | fighter-male-human.jpg h3 |
| 4 | `human-erkek-fighter-ID4` | güncel | 6.2 (6.9) | 1.3 / 79.0 (79.2) | fighter-male-human.jpg h4 |
| 5 | `human-erkek-fighter-ID5` | güncel | 7.2 (7.4) | 2.2 / 56.1 (55.6) | fighter-male-human.jpg h5 |
| 6 | `human-erkek-fighter-ID6` | güncel | 7.0 (7.7) | 1.1 / 55.3 (55.2) | fighter-male-human.jpg h6 |
| 7 | `human-erkek-fighter-ID7` | güncel | 7.4 (8.5) | 1.0 / 101.6 (101.6) | fighter-male-human.jpg h7 |
| 8 | `human-erkek-fighter-ID8` | güncel | 11.2 (12.0) | 2.1 / 89.2 (89.2) | fighter-male-human.jpg h8 |
| 9 | `human-erkek-fighter-ID9` | güncel | 11.2 (11.3) | 1.0 / 104.3 (104.5) | fighter-male-human.jpg h9 |
| 10 | `human-erkek-fighter-ID10` | güncel | 6.7 (7.9) | 2.0 / 61.6 (61.9) | fighter-male-human.jpg h10 |
| 11 | `human-erkek-fighter-ID11` | güncel | 10.1 (13.4) | 2.6 / 92.5 (92.2) | fighter-male-human.jpg h11 |

Görsel: `gorsel-dokum/eksikler-kaynak/fighter-male-human.png`.

### fighter-female-human.jpg

Human Fighter kadin (tam sınıf sayfası). Ayıklama `sinif:fighter`; güncel: 10.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `human-kadin-fighter-ID1` | güncel | 9.6 (10.9) | 1.7 / 49.3 (49.2) | fighter-female-human.jpg h1 |
| 2 | `human-kadin-fighter-ID2` | güncel | 8.4 (9.8) | 15.8 / 60.6 (61.4) | fighter-female-human.jpg h2 |
| 3 | `human-kadin-fighter-ID3` | güncel | 9.3 (10.1) | 1.2 / 70.0 (69.9) | fighter-female-human.jpg h3 |
| 4 | `human-kadin-fighter-ID4` | güncel | 7.8 (8.6) | 0.6 / 65.0 (65.0) | fighter-female-human.jpg h4 |
| 5 | `human-kadin-fighter-ID5` | güncel | 8.2 (8.5) | 0.6 / 64.3 (64.4) | fighter-female-human.jpg h5 |
| 6 | `human-kadin-fighter-ID6` | güncel | 8.0 (9.8) | 1.0 / 66.1 (66.2) | fighter-female-human.jpg h6 |
| 7 | `human-kadin-fighter-ID7` | güncel | 7.1 (7.3) | 1.9 / 61.0 (60.6) | fighter-female-human.jpg h7 |
| 8 | `human-kadin-fighter-ID8` | güncel | 9.1 (10.2) | 2.4 / 76.2 (75.6) | fighter-female-human.jpg h8 |
| 9 | `human-kadin-fighter-ID9` | güncel | 8.8 (9.1) | 0.9 / 91.8 (91.9) | fighter-female-human.jpg h9 |
| 10 | `human-kadin-fighter-ID10` | güncel | 9.7 (10.9) | 1.6 / 73.7 (73.6) | fighter-female-human.jpg h10 |

Görsel: `gorsel-dokum/eksikler-kaynak/fighter-female-human.png`.

### gladiator-dragonborn-female.jpg

Gladyatör ustası (champion, fighter ID12). Ayıklama `figures`; güncel: 1.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `dragonborn-kadin-fighter-ID12` | güncel | 12.9 (14.7) | - / - (-) | gladiator-dragonborn-female.jpg h1 |

Görsel: `gorsel-dokum/eksikler-kaynak/gladiator-dragonborn-female.png`.

### gladiator-dragonborn-male.jpg

Gladyatör ustası (champion, fighter ID12). Ayıklama `figures`; güncel: 1.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `dragonborn-erkek-fighter-ID12` | güncel | 15.5 (18.4) | - / - (-) | gladiator-dragonborn-male.jpg h1 |

Görsel: `gorsel-dokum/eksikler-kaynak/gladiator-dragonborn-male.png`.

### gladiator-dwarf-elf-female.jpg

Gladyatör ustası (champion, fighter ID12). Ayıklama `figures`; güncel: 2.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `dwarf-kadin-fighter-ID12` | güncel | 13.3 (15.2) | - / - (-) | gladiator-dwarf-elf-female.jpg h1 |
| 2 | `elf-kadin-fighter-ID12` | güncel | 14.0 (16.8) | - / - (-) | gladiator-dwarf-elf-female.jpg h2 |

Görsel: `gorsel-dokum/eksikler-kaynak/gladiator-dwarf-elf-female.png`.

### gladiator-dwarf-elf-male.jpg

Gladyatör ustası (champion, fighter ID12). Ayıklama `figures`; güncel: 2.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `dwarf-erkek-fighter-ID12` | güncel | 14.2 (16.8) | - / - (-) | gladiator-dwarf-elf-male.jpg h1 |
| 2 | `elf-erkek-fighter-ID12` | güncel | 13.4 (15.2) | - / - (-) | gladiator-dwarf-elf-male.jpg h2 |

Görsel: `gorsel-dokum/eksikler-kaynak/gladiator-dwarf-elf-male.png`.

### gladiator-gnome-goliath-female.jpg

Gladyatör ustası (champion, fighter ID12). Ayıklama `figures`; güncel: 2.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `gnome-kadin-fighter-ID12` | güncel | 14.0 (16.1) | - / - (-) | gladiator-gnome-goliath-female.jpg h1 |
| 2 | `goliath-kadin-fighter-ID12` | güncel | 11.8 (13.4) | - / - (-) | gladiator-gnome-goliath-female.jpg h2 |

Görsel: `gorsel-dokum/eksikler-kaynak/gladiator-gnome-goliath-female.png`.

### gladiator-gnome-goliath-male.jpg

Gladyatör ustası (champion, fighter ID12). Ayıklama `figures`; güncel: 2.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `gnome-erkek-fighter-ID12` | güncel | 15.1 (18.4) | - / - (-) | gladiator-gnome-goliath-male.jpg h1 |
| 2 | `goliath-erkek-fighter-ID12` | güncel | 10.9 (12.7) | - / - (-) | gladiator-gnome-goliath-male.jpg h2 |

Görsel: `gorsel-dokum/eksikler-kaynak/gladiator-gnome-goliath-male.png`.

### gladiator-halfling-female.jpg

Gladyatör ustası (champion, fighter ID12). Ayıklama `figures`; güncel: 1.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `halfling-kadin-fighter-ID12` | güncel | 14.8 (15.6) | - / - (-) | gladiator-halfling-female.jpg h1 |

Görsel: `gorsel-dokum/eksikler-kaynak/gladiator-halfling-female.png`.

### gladiator-halfling-orc-male.jpg

Gladyatör ustası (champion, fighter ID12). Ayıklama `figures`; güncel: 2.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `halfling-erkek-fighter-ID12` | güncel | 13.6 (15.8) | - / - (-) | gladiator-halfling-orc-male.jpg h1 |
| 2 | `orc-erkek-fighter-ID12` | güncel | 11.8 (13.2) | - / - (-) | gladiator-halfling-orc-male.jpg h2 |

Görsel: `gorsel-dokum/eksikler-kaynak/gladiator-halfling-orc-male.png`.

### gladiator-human-female.jpg

Gladyatör ustası (champion, fighter ID12). Ayıklama `figures`; güncel: 1.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `human-kadin-fighter-ID12` | güncel | 15.9 (17.6) | - / - (-) | gladiator-human-female.jpg h1 |

Görsel: `gorsel-dokum/eksikler-kaynak/gladiator-human-female.png`.

### gladiator-human-male.jpg

Gladyatör ustası (champion, fighter ID12). Ayıklama `figures`; güncel: 1.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `human-erkek-fighter-ID12` | güncel | 14.0 (14.7) | - / - (-) | gladiator-human-male.jpg h1 |

Görsel: `gorsel-dokum/eksikler-kaynak/gladiator-human-male.png`.

### gladiator-orc-female.jpg

Gladyatör ustası (champion, fighter ID12). Ayıklama `figures`; güncel: 1.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `orc-kadin-fighter-ID12` | güncel | 9.7 (8.7) | - / - (-) | gladiator-orc-female.jpg h1 |

Görsel: `gorsel-dokum/eksikler-kaynak/gladiator-orc-female.png`.

### gladiator-tiefling-celestial-female.jpg

Gladyatör ustası (champion, fighter ID12). Ayıklama `figures`; güncel: 2.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `tiefling-kadin-fighter-ID12` | güncel | 12.4 (13.4) | - / - (-) | gladiator-tiefling-celestial-female.jpg h1 |
| 2 | `celestial-kadin-fighter-ID12` | güncel | 14.0 (15.9) | - / - (-) | gladiator-tiefling-celestial-female.jpg h2 |

Görsel: `gorsel-dokum/eksikler-kaynak/gladiator-tiefling-celestial-female.png`.

### gladiator-tiefling-celestial-male.jpg

Gladyatör ustası (champion, fighter ID12). Ayıklama `figures`; güncel: 2.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `tiefling-erkek-fighter-ID12` | güncel | 14.3 (15.9) | - / - (-) | gladiator-tiefling-celestial-male.jpg h1 |
| 2 | `celestial-erkek-fighter-ID12` | güncel | 14.8 (17.8) | - / - (-) | gladiator-tiefling-celestial-male.jpg h2 |

Görsel: `gorsel-dokum/eksikler-kaynak/gladiator-tiefling-celestial-male.png`.

### warlock-female-dwarf.jpg

Warlock dwarf (tam sınıf sayfası). Ayıklama `sinif:warlock`; güncel: 11.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `dwarf-kadin-warlock-WL-1` | güncel | 5.9 (7.8) | 1.2 / 15.5 (15.1) | warlock-female-dwarf.jpg h1 |
| 2 | `dwarf-kadin-warlock-WL-2` | güncel | 11.7 (13.9) | 1.5 / 36.2 (35.8) | warlock-female-dwarf.jpg h2 |
| 3 | `dwarf-kadin-warlock-WL-3` | güncel | 8.9 (9.5) | 1.1 / 6.4 (5.8) | warlock-female-dwarf.jpg h3 |
| 4 | `dwarf-kadin-warlock-WL-4` | güncel | 7.1 (8.4) | 1.0 / 36.1 (35.7) | warlock-female-dwarf.jpg h4 |
| 5 | `dwarf-kadin-warlock-WL-5` | güncel | 5.2 (5.7) | 0.6 / 12.1 (12.0) | warlock-female-dwarf.jpg h5 |
| 6 | `dwarf-kadin-warlock-WL-6` | güncel | 7.2 (6.3) | 0.8 / 9.2 (9.1) | warlock-female-dwarf.jpg h6 |
| 7 | `dwarf-kadin-warlock-WL-7` | güncel | 6.5 (5.7) | 1.0 / 14.0 (13.9) | warlock-female-dwarf.jpg h7 |
| 8 | `dwarf-kadin-warlock-WL-8` | güncel | 15.6 (17.7) | 0.8 / 4.9 (4.5) | warlock-female-dwarf.jpg h8 |
| 9 | `dwarf-kadin-warlock-WL-9` | güncel | 7.3 (7.0) | 0.7 / 44.4 (44.4) | warlock-female-dwarf.jpg h9 |
| 10 | `dwarf-kadin-warlock-WL-10` | güncel | 8.2 (9.1) | 1.2 / 5.3 (5.3) | warlock-female-dwarf.jpg h10 |
| 11 | `dwarf-kadin-warlock-WL-11` | güncel | 6.8 (6.5) | 0.8 / 16.5 (16.2) | warlock-female-dwarf.jpg h11 |

Görsel: `gorsel-dokum/eksikler-kaynak/warlock-female-dwarf.png`.

### warlock-female-elf.jpg

Warlock elf (tam sınıf sayfası). Ayıklama `sinif:warlock`; güncel: 11.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `elf-kadin-warlock-WL-1` | güncel | 8.3 (10.5) | 1.5 / 9.2 (8.4) | warlock-female-elf.jpg h1 |
| 2 | `elf-kadin-warlock-WL-2` | güncel | 12.1 (14.3) | 1.6 / 9.0 (8.1) | warlock-female-elf.jpg h2 |
| 3 | `elf-kadin-warlock-WL-3` | güncel | 10.3 (12.5) | 2.0 / 8.9 (7.6) | warlock-female-elf.jpg h3 |
| 4 | `elf-kadin-warlock-WL-4` | güncel | 7.2 (8.3) | 1.1 / 34.1 (33.9) | warlock-female-elf.jpg h4 |
| 5 | `elf-kadin-warlock-WL-5` | güncel | 6.7 (8.1) | 0.6 / 13.5 (13.4) | warlock-female-elf.jpg h5 |
| 6 | `elf-kadin-warlock-WL-6` | güncel | 10.2 (10.2) | 0.9 / 25.8 (26.0) | warlock-female-elf.jpg h6 |
| 7 | `elf-kadin-warlock-WL-7` | güncel | 7.6 (8.5) | 0.9 / 14.4 (14.3) | warlock-female-elf.jpg h7 |
| 8 | `elf-kadin-warlock-WL-8` | güncel | 11.1 (11.6) | 25.8 / 14.7 (31.6) | warlock-female-elf.jpg h8 |
| 9 | `elf-kadin-warlock-WL-9` | güncel | 8.5 (8.6) | 0.7 / 20.8 (20.9) | warlock-female-elf.jpg h9 |
| 10 | `elf-kadin-warlock-WL-10` | güncel | 7.3 (7.6) | 1.1 / 6.7 (6.6) | warlock-female-elf.jpg h10 |
| 11 | `elf-kadin-warlock-WL-11` | güncel | 8.0 (8.1) | 0.7 / 15.6 (15.5) | warlock-female-elf.jpg h11 |

Görsel: `gorsel-dokum/eksikler-kaynak/warlock-female-elf.png`.

### warlock-female-human.jpg

Warlock human (tam sınıf sayfası). Ayıklama `sinif:warlock`; güncel: 11.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `human-kadin-warlock-WL-1` | güncel | 6.9 (8.4) | 1.8 / 1.8 (0.0) | warlock-female-human.jpg h1 |
| 2 | `human-kadin-warlock-WL-2` | güncel | 10.9 (12.3) | 20.1 / 20.1 (0.0) | warlock-female-human.jpg h2 |
| 3 | `human-kadin-warlock-WL-3` | güncel | 10.8 (13.1) | 1.5 / 1.5 (0.0) | warlock-female-human.jpg h3 |
| 4 | `human-kadin-warlock-WL-4` | güncel | 6.1 (6.8) | 0.9 / 0.9 (0.0) | warlock-female-human.jpg h4 |
| 5 | `human-kadin-warlock-WL-5` | güncel | 6.9 (8.8) | 0.5 / 0.5 (0.0) | warlock-female-human.jpg h5 |
| 6 | `human-kadin-warlock-WL-6` | güncel | 9.5 (8.8) | 15.6 / 15.6 (0.0) | warlock-female-human.jpg h6 |
| 7 | `human-kadin-warlock-WL-7` | güncel | 6.6 (7.0) | 1.0 / 1.0 (0.0) | warlock-female-human.jpg h7 |
| 8 | `human-kadin-warlock-WL-8` | güncel | 10.7 (10.8) | 0.7 / 0.7 (0.0) | warlock-female-human.jpg h8 |
| 9 | `human-kadin-warlock-WL-9` | güncel | 7.7 (8.0) | 0.8 / 0.8 (0.0) | warlock-female-human.jpg h9 |
| 10 | `human-kadin-warlock-WL-10` | güncel | 7.9 (8.1) | 1.1 / 1.1 (0.0) | warlock-female-human.jpg h10 |
| 11 | `human-kadin-warlock-WL-11` | güncel | 8.6 (9.7) | 0.6 / 0.6 (0.0) | warlock-female-human.jpg h11 |

Görsel: `gorsel-dokum/eksikler-kaynak/warlock-female-human.png`.

### warlock-female-tiefling.jpg

Warlock tiefling (tam sınıf sayfası). Ayıklama `sinif:warlock`; güncel: 11.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `tiefling-kadin-warlock-WL-1` | güncel | 5.9 (6.7) | 3.7 / 19.1 (18.1) | warlock-female-tiefling.jpg h1 |
| 2 | `tiefling-kadin-warlock-WL-2` | güncel | 8.4 (8.6) | 2.2 / 55.5 (54.5) | warlock-female-tiefling.jpg h2 |
| 3 | `tiefling-kadin-warlock-WL-3` | güncel | 9.0 (10.1) | 1.4 / 11.7 (11.0) | warlock-female-tiefling.jpg h3 |
| 4 | `tiefling-kadin-warlock-WL-4` | güncel | 7.9 (8.1) | 1.6 / 33.1 (33.2) | warlock-female-tiefling.jpg h4 |
| 5 | `tiefling-kadin-warlock-WL-5` | güncel | 5.4 (6.2) | 0.8 / 23.9 (23.8) | warlock-female-tiefling.jpg h5 |
| 6 | `tiefling-kadin-warlock-WL-6` | güncel | 7.4 (6.7) | 0.7 / 58.0 (58.0) | warlock-female-tiefling.jpg h6 |
| 7 | `tiefling-kadin-warlock-WL-7` | güncel | 7.3 (6.9) | 1.0 / 35.0 (35.0) | warlock-female-tiefling.jpg h7 |
| 8 | `tiefling-kadin-warlock-WL-8` | güncel | 12.9 (12.3) | 0.9 / 28.0 (27.7) | warlock-female-tiefling.jpg h8 |
| 9 | `tiefling-kadin-warlock-WL-9` | güncel | 7.8 (8.2) | 0.8 / 18.2 (18.1) | warlock-female-tiefling.jpg h9 |
| 10 | `tiefling-kadin-warlock-WL-10` | güncel | 9.5 (10.5) | 1.2 / 12.6 (13.0) | warlock-female-tiefling.jpg h10 |
| 11 | `tiefling-kadin-warlock-WL-11` | güncel | 8.2 (8.6) | 0.8 / 19.6 (19.2) | warlock-female-tiefling.jpg h11 |

Görsel: `gorsel-dokum/eksikler-kaynak/warlock-female-tiefling.png`.

### warlock-male-celestial.jpg

Warlock celestial (tam sınıf sayfası). Ayıklama `sinif:warlock`; güncel: 11.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `celestial-erkek-warlock-WL-1` | güncel | 8.0 (10.3) | 1.1 / 32.9 (32.7) | warlock-male-celestial.jpg h1 |
| 2 | `celestial-erkek-warlock-WL-2` | güncel | 9.6 (9.7) | 2.6 / 46.9 (45.6) | warlock-male-celestial.jpg h2 |
| 3 | `celestial-erkek-warlock-WL-3` | güncel | 10.4 (12.7) | 1.6 / 16.5 (15.9) | warlock-male-celestial.jpg h3 |
| 4 | `celestial-erkek-warlock-WL-4` | güncel | 6.3 (7.0) | 0.9 / 33.0 (32.8) | warlock-male-celestial.jpg h4 |
| 5 | `celestial-erkek-warlock-WL-5` | güncel | 6.7 (8.2) | 0.8 / 34.4 (34.3) | warlock-male-celestial.jpg h5 |
| 6 | `celestial-erkek-warlock-WL-6` | güncel | 10.2 (11.8) | 0.9 / 35.1 (35.1) | warlock-male-celestial.jpg h6 |
| 7 | `celestial-erkek-warlock-WL-7` | güncel | 6.8 (7.6) | 0.9 / 57.9 (58.0) | warlock-male-celestial.jpg h7 |
| 8 | `celestial-erkek-warlock-WL-8` | güncel | 18.6 (18.1) | 1.2 / 45.2 (45.2) | warlock-male-celestial.jpg h8 |
| 9 | `celestial-erkek-warlock-WL-9` | güncel | 7.7 (8.2) | 1.0 / 43.9 (44.3) | warlock-male-celestial.jpg h9 |
| 10 | `celestial-erkek-warlock-WL-10` | güncel | 8.5 (10.0) | 0.9 / 29.5 (29.6) | warlock-male-celestial.jpg h10 |
| 11 | `celestial-erkek-warlock-WL-11` | güncel | 8.0 (8.0) | 0.7 / 46.3 (46.5) | warlock-male-celestial.jpg h11 |

Görsel: `gorsel-dokum/eksikler-kaynak/warlock-male-celestial.png`.

### warlock-male-dwarf.jpg

Warlock dwarf (tam sınıf sayfası). Ayıklama `sinif:warlock`; güncel: 11.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `dwarf-erkek-warlock-WL-1` | güncel | 7.0 (8.1) | 1.7 / 20.5 (19.7) | warlock-male-dwarf.jpg h1 |
| 2 | `dwarf-erkek-warlock-WL-2` | güncel | 11.5 (12.9) | 2.3 / 60.8 (59.4) | warlock-male-dwarf.jpg h2 |
| 3 | `dwarf-erkek-warlock-WL-3` | güncel | 7.2 (7.8) | 0.8 / 3.8 (3.6) | warlock-male-dwarf.jpg h3 |
| 4 | `dwarf-erkek-warlock-WL-4` | güncel | 6.4 (7.3) | 2.5 / 33.1 (31.7) | warlock-male-dwarf.jpg h4 |
| 5 | `dwarf-erkek-warlock-WL-5` | güncel | 7.6 (9.8) | 0.7 / 10.8 (10.6) | warlock-male-dwarf.jpg h5 |
| 6 | `dwarf-erkek-warlock-WL-6` | güncel | 8.4 (9.2) | 0.8 / 4.2 (3.9) | warlock-male-dwarf.jpg h6 |
| 7 | `dwarf-erkek-warlock-WL-7` | güncel | 6.0 (6.5) | 0.7 / 14.8 (14.8) | warlock-male-dwarf.jpg h7 |
| 8 | `dwarf-erkek-warlock-WL-8` | güncel | 15.0 (15.2) | 30.1 / 29.7 (5.4) | warlock-male-dwarf.jpg h8 |
| 9 | `dwarf-erkek-warlock-WL-9` | güncel | 8.0 (8.2) | 0.8 / 8.5 (8.4) | warlock-male-dwarf.jpg h9 |
| 10 | `dwarf-erkek-warlock-WL-10` | güncel | 10.2 (11.8) | 15.9 / 14.5 (4.0) | warlock-male-dwarf.jpg h10 |
| 11 | `dwarf-erkek-warlock-WL-11` | güncel | 7.5 (7.9) | 0.7 / 4.6 (4.3) | warlock-male-dwarf.jpg h11 |

Görsel: `gorsel-dokum/eksikler-kaynak/warlock-male-dwarf.png`.

### warlock-male-elf.jpg

Warlock elf (tam sınıf sayfası). Ayıklama `sinif:warlock`; güncel: 11.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `elf-erkek-warlock-WL-1` | güncel | 8.3 (11.1) | 0.9 / 29.1 (29.1) | warlock-male-elf.jpg h1 |
| 2 | `elf-erkek-warlock-WL-2` | güncel | 11.9 (12.9) | 1.8 / 31.4 (30.5) | warlock-male-elf.jpg h2 |
| 3 | `elf-erkek-warlock-WL-3` | güncel | 10.9 (13.6) | 17.0 / 9.1 (18.4) | warlock-male-elf.jpg h3 |
| 4 | `elf-erkek-warlock-WL-4` | güncel | 6.1 (6.2) | 1.2 / 39.7 (39.1) | warlock-male-elf.jpg h4 |
| 5 | `elf-erkek-warlock-WL-5` | güncel | 7.8 (10.4) | 0.6 / 26.3 (26.2) | warlock-male-elf.jpg h5 |
| 6 | `elf-erkek-warlock-WL-6` | güncel | 10.9 (11.2) | 0.8 / 32.6 (32.6) | warlock-male-elf.jpg h6 |
| 7 | `elf-erkek-warlock-WL-7` | güncel | 7.9 (9.3) | 0.9 / 43.3 (43.6) | warlock-male-elf.jpg h7 |
| 8 | `elf-erkek-warlock-WL-8` | güncel | 12.1 (12.3) | 0.8 / 13.9 (13.7) | warlock-male-elf.jpg h8 |
| 9 | `elf-erkek-warlock-WL-9` | güncel | 10.4 (11.8) | 0.8 / 42.2 (42.3) | warlock-male-elf.jpg h9 |
| 10 | `elf-erkek-warlock-WL-10` | güncel | 7.1 (7.4) | 15.3 / 21.1 (10.7) | warlock-male-elf.jpg h10 |
| 11 | `elf-erkek-warlock-WL-11` | güncel | 8.8 (9.7) | 0.9 / 41.7 (41.8) | warlock-male-elf.jpg h11 |

Görsel: `gorsel-dokum/eksikler-kaynak/warlock-male-elf.png`.

### warlock-male-gnome.jpg

Warlock gnome (tam sınıf sayfası). Ayıklama `sinif:warlock`; güncel: 11.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `gnome-erkek-warlock-WL-1` | güncel | 7.4 (9.7) | 2.1 / 24.7 (24.1) | warlock-male-gnome.jpg h1 |
| 2 | `gnome-erkek-warlock-WL-2` | güncel | 10.6 (11.1) | 2.4 / 28.8 (27.9) | warlock-male-gnome.jpg h2 |
| 3 | `gnome-erkek-warlock-WL-3` | güncel | 10.7 (13.1) | 2.4 / 22.3 (21.4) | warlock-male-gnome.jpg h3 |
| 4 | `gnome-erkek-warlock-WL-4` | güncel | 5.4 (5.7) | 1.9 / 47.8 (46.8) | warlock-male-gnome.jpg h4 |
| 5 | `gnome-erkek-warlock-WL-5` | güncel | 5.5 (6.9) | 1.5 / 23.1 (23.6) | warlock-male-gnome.jpg h5 |
| 6 | `gnome-erkek-warlock-WL-6` | güncel | 7.6 (7.6) | 0.8 / 15.8 (15.6) | warlock-male-gnome.jpg h6 |
| 7 | `gnome-erkek-warlock-WL-7` | güncel | 6.1 (6.3) | 1.0 / 36.6 (36.6) | warlock-male-gnome.jpg h7 |
| 8 | `gnome-erkek-warlock-WL-8` | güncel | 19.4 (18.6) | 0.8 / 6.0 (5.8) | warlock-male-gnome.jpg h8 |
| 9 | `gnome-erkek-warlock-WL-9` | güncel | 7.6 (7.2) | 0.8 / 32.5 (32.6) | warlock-male-gnome.jpg h9 |
| 10 | `gnome-erkek-warlock-WL-10` | güncel | 11.1 (13.9) | 0.9 / 3.9 (4.0) | warlock-male-gnome.jpg h10 |
| 11 | `gnome-erkek-warlock-WL-11` | güncel | 7.1 (6.8) | 0.7 / 33.0 (33.0) | warlock-male-gnome.jpg h11 |

Görsel: `gorsel-dokum/eksikler-kaynak/warlock-male-gnome.png`.

### warlock-male-human.jpg

Warlock human (tam sınıf sayfası). Ayıklama `sinif:warlock`; güncel: 11.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `human-erkek-warlock-WL-1` | güncel | 7.5 (9.0) | 1.2 / 1.2 (0.0) | warlock-male-human.jpg h1 |
| 2 | `human-erkek-warlock-WL-2` | güncel | 10.5 (11.1) | 2.4 / 2.4 (0.0) | warlock-male-human.jpg h2 |
| 3 | `human-erkek-warlock-WL-3` | güncel | 11.1 (13.2) | 1.3 / 1.3 (0.0) | warlock-male-human.jpg h3 |
| 4 | `human-erkek-warlock-WL-4` | güncel | 6.0 (6.6) | 0.8 / 0.8 (0.0) | warlock-male-human.jpg h4 |
| 5 | `human-erkek-warlock-WL-5` | güncel | 7.0 (9.3) | 11.2 / 11.2 (0.0) | warlock-male-human.jpg h5 |
| 6 | `human-erkek-warlock-WL-6` | güncel | 9.1 (10.1) | 0.9 / 0.9 (0.0) | warlock-male-human.jpg h6 |
| 7 | `human-erkek-warlock-WL-7` | güncel | 6.6 (7.9) | 0.9 / 0.9 (0.0) | warlock-male-human.jpg h7 |
| 8 | `human-erkek-warlock-WL-8` | güncel | 15.2 (15.8) | 0.7 / 0.7 (0.0) | warlock-male-human.jpg h8 |
| 9 | `human-erkek-warlock-WL-9` | güncel | 10.2 (11.9) | 0.7 / 0.7 (0.0) | warlock-male-human.jpg h9 |
| 10 | `human-erkek-warlock-WL-10` | güncel | 9.6 (10.6) | 1.0 / 1.0 (0.0) | warlock-male-human.jpg h10 |
| 11 | `human-erkek-warlock-WL-11` | güncel | 8.5 (9.9) | 1.0 / 1.0 (0.0) | warlock-male-human.jpg h11 |

Görsel: `gorsel-dokum/eksikler-kaynak/warlock-male-human.png`.

### warlock-male-tiefling.jpg

Warlock tiefling (tam sınıf sayfası). Ayıklama `sinif:warlock`; güncel: 11.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `tiefling-erkek-warlock-WL-1` | güncel | 6.5 (7.9) | 1.2 / 44.9 (44.7) | warlock-male-tiefling.jpg h1 |
| 2 | `tiefling-erkek-warlock-WL-2` | güncel | 9.2 (9.0) | 1.4 / 32.9 (32.7) | warlock-male-tiefling.jpg h2 |
| 3 | `tiefling-erkek-warlock-WL-3` | güncel | 7.4 (7.6) | 3.2 / 51.7 (50.5) | warlock-male-tiefling.jpg h3 |
| 4 | `tiefling-erkek-warlock-WL-4` | güncel | 5.9 (6.7) | 1.1 / 61.5 (61.1) | warlock-male-tiefling.jpg h4 |
| 5 | `tiefling-erkek-warlock-WL-5` | güncel | 6.2 (7.8) | 1.0 / 27.8 (27.6) | warlock-male-tiefling.jpg h5 |
| 6 | `tiefling-erkek-warlock-WL-6` | güncel | 8.1 (7.5) | 6.4 / 26.3 (24.4) | warlock-male-tiefling.jpg h6 |
| 7 | `tiefling-erkek-warlock-WL-7` | güncel | 6.6 (6.6) | 1.2 / 36.9 (36.8) | warlock-male-tiefling.jpg h7 |
| 8 | `tiefling-erkek-warlock-WL-8` | güncel | 15.7 (16.5) | 0.9 / 29.4 (29.5) | warlock-male-tiefling.jpg h8 |
| 9 | `tiefling-erkek-warlock-WL-9` | güncel | 8.6 (8.9) | 1.4 / 26.9 (26.9) | warlock-male-tiefling.jpg h9 |
| 10 | `tiefling-erkek-warlock-WL-10` | güncel | 8.5 (9.4) | 0.9 / 14.6 (14.7) | warlock-male-tiefling.jpg h10 |
| 11 | `tiefling-erkek-warlock-WL-11` | güncel | 7.9 (8.0) | 1.1 / 36.5 (36.4) | warlock-male-tiefling.jpg h11 |

Görsel: `gorsel-dokum/eksikler-kaynak/warlock-male-tiefling.png`.

### sorcerer-duzelt-A-sonuc.jpg

Sorcerer düzeltme (SC-2; ızgara (2, 2)). Ayıklama `grid`; güncel: 4.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `orc-erkek-sorcerer-SC-2` | güncel | 10.7 (11.6) | - / - (-) | sorcerer-duzelt-A-sonuc.jpg h1 |
| 2 | `halfling-erkek-sorcerer-SC-2` | güncel | 7.8 (8.5) | - / - (-) | sorcerer-duzelt-A-sonuc.jpg h2 |
| 3 | `human-kadin-sorcerer-SC-2` | güncel | 8.0 (8.5) | - / - (-) | sorcerer-duzelt-A-sonuc.jpg h3 |
| 4 | `orc-kadin-sorcerer-SC-2` | güncel | 13.5 (15.7) | - / - (-) | sorcerer-duzelt-A-sonuc.jpg h4 |

Görsel: `gorsel-dokum/eksikler-kaynak/sorcerer-duzelt-A-sonuc.png`.

### sorcerer-duzelt-B-sonuc.jpg

Sorcerer düzeltme (SC-3; ızgara (2, 2)). Ayıklama `grid`; güncel: 4.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `celestial-kadin-sorcerer-SC-3` | güncel | 9.0 (7.3) | - / - (-) | sorcerer-duzelt-B-sonuc.jpg h1 |
| 2 | `halfling-kadin-sorcerer-SC-3` | güncel | 8.2 (6.1) | - / - (-) | sorcerer-duzelt-B-sonuc.jpg h2 |
| 3 | `human-kadin-sorcerer-SC-3` | güncel | 9.1 (7.6) | - / - (-) | sorcerer-duzelt-B-sonuc.jpg h3 |
| 4 | `tiefling-kadin-sorcerer-SC-3` | güncel | 10.2 (9.7) | - / - (-) | sorcerer-duzelt-B-sonuc.jpg h4 |

Görsel: `gorsel-dokum/eksikler-kaynak/sorcerer-duzelt-B-sonuc.png`.

### sorcerer-duzelt-C-sonuc.jpg

Sorcerer düzeltme (SC-9; ızgara (3, 3)). Ayıklama `grid`; güncel: 7, uygulanmadı: iki Goliath ayırt edilemedi (2026-11-19 kararı, cc-kesim.py SORC_BELIRSIZ): 2.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `goliath-erkek-sorcerer-SC-9` | uygulanmadı: iki Goliath ayırt edilemedi (2026-11-19 kararı, cc-kesim.py SORC_BELIRSIZ) | 14.9 (12.1) | - / - (-) | kayıt yok |
| 2 | `elf-erkek-sorcerer-SC-9` | güncel | 7.3 (8.0) | - / - (-) | sorcerer-duzelt-C-sonuc.jpg h2 |
| 3 | `tiefling-erkek-sorcerer-SC-9` | güncel | 7.2 (8.4) | - / - (-) | sorcerer-duzelt-C-sonuc.jpg h3 |
| 4 | `orc-erkek-sorcerer-SC-9` | güncel | 7.1 (9.3) | - / - (-) | sorcerer-duzelt-C-sonuc.jpg h4 |
| 5 | `dragonborn-kadin-sorcerer-SC-9` | güncel | 5.7 (6.5) | - / - (-) | sorcerer-duzelt-C-sonuc.jpg h5 |
| 6 | `dwarf-kadin-sorcerer-SC-9` | güncel | 4.9 (5.3) | - / - (-) | sorcerer-duzelt-C-sonuc.jpg h6 |
| 7 | `goliath-kadin-sorcerer-SC-9` | uygulanmadı: iki Goliath ayırt edilemedi (2026-11-19 kararı, cc-kesim.py SORC_BELIRSIZ) | 19.7 (17.9) | - / - (-) | kayıt yok |
| 8 | `human-kadin-sorcerer-SC-9` | güncel | 4.2 (3.7) | - / - (-) | sorcerer-duzelt-C-sonuc.jpg h8 |
| 9 | `tiefling-kadin-sorcerer-SC-9` | güncel | 5.9 (7.4) | - / - (-) | sorcerer-duzelt-C-sonuc.jpg h9 |

Görsel: `gorsel-dokum/eksikler-kaynak/sorcerer-duzelt-C-sonuc.png`.

### bard-m-tiefling-dragonborn.png

Bard hokkabaz (ID3). Ayıklama `bodies:2`; güncel: 2.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `tiefling-erkek-bard-ID3` | güncel | 11.0 (13.3) | - / - (-) | bard-m-tiefling-dragonborn.png h1 |
| 2 | `dragonborn-erkek-bard-ID3` | güncel | 10.9 (13.4) | - / - (-) | bard-m-tiefling-dragonborn.png h2 |

Görsel: `gorsel-dokum/eksikler-kaynak/bard-m-tiefling-dragonborn.png`.

### bard-f-halfling-orc-tiefling-dragonborn.png

Bard hokkabaz (ID3). Ayıklama `bodies:4`; güncel: 4.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `human-kadin-bard-ID3` | güncel | 10.3 (11.3) | - / - (-) | bard-f-halfling-orc-tiefling-dragonborn.png h1 |
| 2 | `orc-kadin-bard-ID3` | güncel | 7.3 (8.2) | - / - (-) | bard-f-halfling-orc-tiefling-dragonborn.png h2 |
| 3 | `tiefling-kadin-bard-ID3` | güncel | 7.0 (7.7) | - / - (-) | bard-f-halfling-orc-tiefling-dragonborn.png h3 |
| 4 | `dragonborn-kadin-bard-ID3` | güncel | 9.5 (12.4) | - / - (-) | bard-f-halfling-orc-tiefling-dragonborn.png h4 |

Görsel: `gorsel-dokum/eksikler-kaynak/bard-f-halfling-orc-tiefling-dragonborn.png`.

### kadin-5'li.jpg

Bard hokkabaz (ID3). Ayıklama `bodies:5`; güncel: 5.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `celestial-kadin-bard-ID3` | güncel | 7.3 (8.6) | - / - (-) | kadin-5'li.jpg h1 |
| 2 | `dwarf-kadin-bard-ID3` | güncel | 7.7 (9.8) | - / - (-) | kadin-5'li.jpg h2 |
| 3 | `elf-kadin-bard-ID3` | güncel | 11.8 (14.6) | - / - (-) | kadin-5'li.jpg h3 |
| 4 | `gnome-kadin-bard-ID3` | güncel | 9.5 (11.6) | - / - (-) | kadin-5'li.jpg h4 |
| 5 | `goliath-kadin-bard-ID3` | güncel | 9.3 (12.2) | - / - (-) | kadin-5'li.jpg h5 |

Görsel: `gorsel-dokum/eksikler-kaynak/kadin-5'li.png`.

### 4'lü.jpg

Bard hokkabaz (ID3). Ayıklama `bodies:4`; güncel: 4.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `human-erkek-bard-ID3` | güncel | 7.2 (6.9) | - / - (-) | 4'lü.jpg h1 |
| 2 | `orc-erkek-bard-ID3` | güncel | 8.3 (10.1) | - / - (-) | 4'lü.jpg h2 |
| 3 | `halfling-erkek-bard-ID3` | güncel | 9.1 (10.2) | - / - (-) | 4'lü.jpg h3 |
| 4 | `halfling-kadin-bard-ID3` | güncel | 9.0 (10.3) | - / - (-) | 4'lü.jpg h4 |

Görsel: `gorsel-dokum/eksikler-kaynak/4'lü.png`.

### erkek-5'li.jpg

Bard hokkabaz (ID3). Ayıklama `bodies:5`; güncel: 5.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `celestial-erkek-bard-ID3` | güncel | 10.9 (13.2) | - / - (-) | erkek-5'li.jpg h1 |
| 2 | `dwarf-erkek-bard-ID3` | güncel | 8.5 (10.4) | - / - (-) | erkek-5'li.jpg h2 |
| 3 | `elf-erkek-bard-ID3` | güncel | 9.9 (11.3) | - / - (-) | erkek-5'li.jpg h3 |
| 4 | `gnome-erkek-bard-ID3` | güncel | 7.8 (8.5) | - / - (-) | erkek-5'li.jpg h4 |
| 5 | `goliath-erkek-bard-ID3` | güncel | 7.4 (9.5) | - / - (-) | erkek-5'li.jpg h5 |

Görsel: `gorsel-dokum/eksikler-kaynak/erkek-5'li.png`.

### 4'lü.jpg

Bard hokkabaz (ID3): human-erkek, orc-erkek, halfling-erkek, halfling-kadin. Ayıklama `bodies:4`; güncel: 4.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `human-erkek-bard-ID3` | güncel | 7.2 (6.9) | - / - (-) | 4'lü.jpg h1 |
| 2 | `orc-erkek-bard-ID3` | güncel | 8.3 (10.1) | - / - (-) | 4'lü.jpg h2 |
| 3 | `halfling-erkek-bard-ID3` | güncel | 9.1 (10.2) | - / - (-) | 4'lü.jpg h3 |
| 4 | `halfling-kadin-bard-ID3` | güncel | 9.0 (10.3) | - / - (-) | 4'lü.jpg h4 |

Görsel: `gorsel-dokum/eksikler-kaynak/4'lü.png`.

### erkek-5'li.jpg

Bard hokkabaz (ID3): celestial-erkek, dwarf-erkek, elf-erkek, gnome-erkek, goliath-erkek. Ayıklama `bodies:5`; güncel: 5.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `celestial-erkek-bard-ID3` | güncel | 10.9 (13.2) | - / - (-) | erkek-5'li.jpg h1 |
| 2 | `dwarf-erkek-bard-ID3` | güncel | 8.5 (10.4) | - / - (-) | erkek-5'li.jpg h2 |
| 3 | `elf-erkek-bard-ID3` | güncel | 9.9 (11.3) | - / - (-) | erkek-5'li.jpg h3 |
| 4 | `gnome-erkek-bard-ID3` | güncel | 7.8 (8.5) | - / - (-) | erkek-5'li.jpg h4 |
| 5 | `goliath-erkek-bard-ID3` | güncel | 7.4 (9.5) | - / - (-) | erkek-5'li.jpg h5 |

Görsel: `gorsel-dokum/eksikler-kaynak/erkek-5'li.png`.

### kadin-5'li.jpg

Bard hokkabaz (ID3): celestial-kadin, dwarf-kadin, elf-kadin, gnome-kadin, goliath-kadin. Ayıklama `bodies:5`; güncel: 5.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `celestial-kadin-bard-ID3` | güncel | 7.3 (8.6) | - / - (-) | kadin-5'li.jpg h1 |
| 2 | `dwarf-kadin-bard-ID3` | güncel | 7.7 (9.8) | - / - (-) | kadin-5'li.jpg h2 |
| 3 | `elf-kadin-bard-ID3` | güncel | 11.8 (14.6) | - / - (-) | kadin-5'li.jpg h3 |
| 4 | `gnome-kadin-bard-ID3` | güncel | 9.5 (11.6) | - / - (-) | kadin-5'li.jpg h4 |
| 5 | `goliath-kadin-bard-ID3` | güncel | 9.3 (12.2) | - / - (-) | kadin-5'li.jpg h5 |

Görsel: `gorsel-dokum/eksikler-kaynak/kadin-5'li.png`.

### clerik-male-celestial.jpg

denetim kontrolü: Celestial erkek Cleric (2026-11-22 yeniden kesildi). Ayıklama `sinif:cleric`; güncel: 9.

| Hücre | Jeton | Durum | Renk skoru (baş) | Biçim: yeni / eski sayfa (sayfalar arası) | Defter kazananı |
|---:|---|---|---|---|---|
| 1 | `celestial-erkek-cleric-ID1` | güncel | 9.0 (9.1) | - / - (-) | clerik-male-celestial.jpg h1 |
| 2 | `celestial-erkek-cleric-ID2` | güncel | 9.4 (9.3) | - / - (-) | clerik-male-celestial.jpg h2 |
| 3 | `celestial-erkek-cleric-ID3` | güncel | 9.0 (9.7) | - / - (-) | clerik-male-celestial.jpg h3 |
| 4 | `celestial-erkek-cleric-ID4` | güncel | 8.0 (9.7) | - / - (-) | clerik-male-celestial.jpg h4 |
| 5 | `celestial-erkek-cleric-ID5` | güncel | 6.7 (8.2) | - / - (-) | clerik-male-celestial.jpg h5 |
| 6 | `celestial-erkek-cleric-ID6` | güncel | 6.2 (7.9) | - / - (-) | clerik-male-celestial.jpg h6 |
| 7 | `celestial-erkek-cleric-ID7` | güncel | 10.0 (11.1) | - / - (-) | clerik-male-celestial.jpg h7 |
| 8 | `celestial-erkek-cleric-ID8` | güncel | 8.9 (9.9) | - / - (-) | clerik-male-celestial.jpg h8 |
| 9 | `celestial-erkek-cleric-ID9` | güncel | 9.2 (9.7) | - / - (-) | clerik-male-celestial.jpg h9 |

Görsel: `gorsel-dokum/eksikler-kaynak/clerik-male-celestial.png`.

