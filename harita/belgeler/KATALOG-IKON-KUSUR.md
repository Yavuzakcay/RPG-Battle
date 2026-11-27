# KATALOG-IKON-KUSUR — katalog ikonlarında otomatik kusur taraması

Görev KATALOG-IKON-AKTAR-2. `node scripts/katalog-ikon-kusur.mjs` üretir (elle düzenlenmez). Hücreler gözle denetlenmedi; yalnız piksel sezgisi
(betiğin başındaki açıklama). Eşiği geçen "kusur", eşiğin yarısı ile eşik arası "belirsiz". Bir hücre birden çok satırda olabilir.

- Taranan ikon: 323
- Kusurlu hücre: 69 (kusur satırı 75: leylak/pembe hale 31, somon hale 5, macenta cep 0, sis 0, kenara dayanan parıltı 39)
- Belirsiz satır: 40 (leylak/pembe hale 15, somon hale 7, macenta cep 1, sis 12, kenara dayanan parıltı 5)
- Eşikler: leylak/pembe hale %12, somon hale %12, macenta cep 40 px, sis %30, kenara dayanan parıltı %3

| Sayfa | Hücre | Kimlik | Kusur türü | Ölçü | Durum |
|---|---|---|---|---|---|
| katalog-silah-01 | 2 | `starcleave` | leylak/pembe hale | %24 | kusur |
| katalog-silah-01 | 5 | `cinderheart-greatsword` | somon hale | %62 | kusur |
| katalog-silah-01 | 8 | `frostcrescent-greatsword` | leylak/pembe hale | %59 | kusur |
| katalog-silah-01 | 10 | `riftbreaker-greatsword` | leylak/pembe hale | %73 | kusur |
| katalog-silah-01 | 14 | `twin-starblades` | leylak/pembe hale | %60 | kusur |
| katalog-silah-01 | 15 | `whirlwind-katana` | leylak/pembe hale | %10 | belirsiz |
| katalog-silah-02 | 2 | `cinderfrost-katana` | leylak/pembe hale | %32 | kusur |
| katalog-silah-02 | 5 | `webrender-longsword` | sis | %15 | belirsiz |
| katalog-silah-02 | 8 | `whispering-rapier` | leylak/pembe hale | %22 | kusur |
| katalog-silah-02 | 9 | `harmonic-rapier` | sis | %18 | belirsiz |
| katalog-silah-02 | 11 | `windpoise` | leylak/pembe hale | %8 | belirsiz |
| katalog-silah-02 | 16 | `nebula-wing-scimitar` | leylak/pembe hale | %73 | kusur |
| katalog-silah-03 | 8 | `spiteful-dagger` | leylak/pembe hale | %30 | kusur |
| katalog-silah-03 | 9 | `frostbite-dagger` | leylak/pembe hale | %7 | belirsiz |
| katalog-silah-04 | 3 | `glacierbreak-maul` | leylak/pembe hale | %63 | kusur |
| katalog-silah-04 | 6 | `shadowbloom-maul` | kenara dayanan parıltı | %5 | kusur |
| katalog-silah-04 | 12 | `chainbreaker-warhammer` | leylak/pembe hale | %53 | kusur |
| katalog-silah-04 | 13 | `oathshatter-warhammer` | leylak/pembe hale | %20 | kusur |
| katalog-silah-04 | 15 | `homing-forge-hammer` | somon hale | %22 | kusur |
| katalog-silah-05 | 4 | `gale-light-hammer` | leylak/pembe hale | %9 | belirsiz |
| katalog-silah-05 | 5 | `sparkforge-hammer` | leylak/pembe hale | %10 | belirsiz |
| katalog-silah-05 | 6 | `dawnseal-mace` | kenara dayanan parıltı | %4 | kusur |
| katalog-silah-05 | 10 | `sunstar-morningstar` | kenara dayanan parıltı | %4 | kusur |
| katalog-silah-05 | 14 | `stardust-flail` | leylak/pembe hale | %33 | kusur |
| katalog-silah-05 | 15 | `barbed-chain-whip` | somon hale | %10 | belirsiz |
| katalog-silah-06 | 2 | `breeze-glaive` | leylak/pembe hale | %10 | belirsiz |
| katalog-silah-06 | 2 | `breeze-glaive` | sis | %20 | belirsiz |
| katalog-silah-06 | 5 | `homing-pike` | leylak/pembe hale | %23 | kusur |
| katalog-silah-06 | 5 | `homing-pike` | sis | %16 | belirsiz |
| katalog-silah-06 | 9 | `luster-twinblade` | kenara dayanan parıltı | %3 | kusur |
| katalog-silah-06 | 10 | `tempest-trident` | leylak/pembe hale | %7 | belirsiz |
| katalog-silah-06 | 10 | `tempest-trident` | sis | %16 | belirsiz |
| katalog-silah-06 | 11 | `tidecaller-trident` | leylak/pembe hale | %8 | belirsiz |
| katalog-silah-06 | 13 | `dusklight-spear` | leylak/pembe hale | %12 | belirsiz |
| katalog-silah-06 | 13 | `dusklight-spear` | kenara dayanan parıltı | %2 | belirsiz |
| katalog-silah-06 | 16 | `ribbon-whip-blade` | sis | %16 | belirsiz |
| katalog-silah-07 | 3 | `hoarfrost-staff` | leylak/pembe hale | %69 | kusur |
| katalog-silah-07 | 3 | `hoarfrost-staff` | kenara dayanan parıltı | %17 | kusur |
| katalog-silah-07 | 7 | `archmages-conduit-staff` | leylak/pembe hale | %18 | kusur |
| katalog-silah-07 | 7 | `archmages-conduit-staff` | kenara dayanan parıltı | %11 | kusur |
| katalog-silah-07 | 10 | `resonance-staff` | leylak/pembe hale | %13 | kusur |
| katalog-silah-07 | 10 | `resonance-staff` | sis | %21 | belirsiz |
| katalog-silah-07 | 14 | `pitchtorch-club` | somon hale | %13 | kusur |
| katalog-silah-07 | 16 | `silent-needle-blowgun` | sis | %20 | belirsiz |
| katalog-silah-08 | 1 | `skylight-longbow` | somon hale | %17 | kusur |
| katalog-silah-08 | 1 | `skylight-longbow` | kenara dayanan parıltı | %6 | kusur |
| katalog-silah-08 | 2 | `deadeye-longbow` | sis | %18 | belirsiz |
| katalog-silah-08 | 3 | `shadowveil-shortbow` | sis | %16 | belirsiz |
| katalog-silah-08 | 4 | `banshees-wail-shortbow` | leylak/pembe hale | %41 | kusur |
| katalog-silah-08 | 6 | `forcebolt-hand-crossbow` | leylak/pembe hale | %22 | kusur |
| katalog-silah-08 | 8 | `starstone-sling` | leylak/pembe hale | %9 | belirsiz |
| katalog-zirh-01 | 6 | `hellforge-plate` | somon hale | %13 | kusur |
| katalog-zirh-01 | 12 | `mindfortress-plate` | leylak/pembe hale | %11 | belirsiz |
| katalog-zirh-01 | 12 | `mindfortress-plate` | kenara dayanan parıltı | %53 | kusur |
| katalog-zirh-01 | 15 | `forcewave-chain-mail` | leylak/pembe hale | %47 | kusur |
| katalog-zirh-02 | 8 | `sparkmesh-chain-shirt` | somon hale | %12 | belirsiz |
| katalog-zirh-02 | 8 | `sparkmesh-chain-shirt` | macenta cep | 35 px | belirsiz |
| katalog-zirh-02 | 9 | `sunburst-breastplate` | kenara dayanan parıltı | %44 | kusur |
| katalog-zirh-03 | 1 | `raptor-feather-coat` | kenara dayanan parıltı | %28 | kusur |
| katalog-zirh-03 | 2 | `spellblade-coat` | kenara dayanan parıltı | %15 | kusur |
| katalog-zirh-03 | 3 | `moonshift-hide` | kenara dayanan parıltı | %20 | kusur |
| katalog-zirh-03 | 5 | `spidersilk-armor` | kenara dayanan parıltı | %7 | kusur |
| katalog-zirh-03 | 6 | `corsair-captains-coat` | kenara dayanan parıltı | %20 | kusur |
| katalog-zirh-03 | 7 | `minstrels-favor-jerkin` | kenara dayanan parıltı | %15 | kusur |
| katalog-zirh-03 | 9 | `vigil-shroud-robe` | kenara dayanan parıltı | %39 | kusur |
| katalog-zirh-03 | 10 | `weavewoven-robe` | kenara dayanan parıltı | %36 | kusur |
| katalog-zirh-03 | 11 | `resonant-caster-robe` | kenara dayanan parıltı | %21 | kusur |
| katalog-zirh-03 | 12 | `robe-of-supreme-focus` | leylak/pembe hale | %77 | kusur |
| katalog-zirh-03 | 12 | `robe-of-supreme-focus` | kenara dayanan parıltı | %24 | kusur |
| katalog-zirh-03 | 13 | `soulmender-monk-vest` | kenara dayanan parıltı | %21 | kusur |
| katalog-zirh-03 | 14 | `tidecaller-robe` | leylak/pembe hale | %78 | kusur |
| katalog-zirh-03 | 14 | `tidecaller-robe` | kenara dayanan parıltı | %31 | kusur |
| katalog-zirh-03 | 15 | `nimble-cat-tunic` | kenara dayanan parıltı | %17 | kusur |
| katalog-zirh-03 | 16 | `venomweaver-robe` | kenara dayanan parıltı | %18 | kusur |
| katalog-zirh-04 | 3 | `one-eyed-mortar-shield` | kenara dayanan parıltı | %2 | belirsiz |
| katalog-zirh-04 | 6 | `walking-bastion-shield` | kenara dayanan parıltı | %7 | kusur |
| katalog-giyilebilir-01 | 5 | `snow-witch-hat` | leylak/pembe hale | %6 | belirsiz |
| katalog-giyilebilir-02 | 4 | `weavefold-cloak` | leylak/pembe hale | %18 | kusur |
| katalog-giyilebilir-02 | 8 | `frostmist-cloak` | leylak/pembe hale | %76 | kusur |
| katalog-giyilebilir-03 | 5 | `skythunder-gloves` | leylak/pembe hale | %36 | kusur |
| katalog-giyilebilir-03 | 9 | `winterclaw-gloves` | leylak/pembe hale | %19 | kusur |
| katalog-giyilebilir-03 | 13 | `sparkhand-gloves` | somon hale | %7 | belirsiz |
| katalog-giyilebilir-04 | 3 | `skyvault-boots` | somon hale | %7 | belirsiz |
| katalog-giyilebilir-04 | 5 | `stormstep-boots` | kenara dayanan parıltı | %21 | kusur |
| katalog-yuzuk-01 | 1 | `shadowspark-ring` | kenara dayanan parıltı | %5 | kusur |
| katalog-yuzuk-01 | 2 | `high-command-ring` | leylak/pembe hale | %24 | kusur |
| katalog-yuzuk-01 | 2 | `high-command-ring` | kenara dayanan parıltı | %4 | kusur |
| katalog-yuzuk-01 | 3 | `gamblers-edge-ring` | kenara dayanan parıltı | %4 | kusur |
| katalog-yuzuk-01 | 4 | `dazzling-halo-ring` | kenara dayanan parıltı | %5 | kusur |
| katalog-yuzuk-01 | 5 | `snowburst-ring` | kenara dayanan parıltı | %4 | kusur |
| katalog-yuzuk-01 | 6 | `spellstrike-ring` | sis | %16 | belirsiz |
| katalog-yuzuk-01 | 6 | `spellstrike-ring` | kenara dayanan parıltı | %4 | kusur |
| katalog-yuzuk-01 | 7 | `eversight-shadow-ring` | kenara dayanan parıltı | %5 | kusur |
| katalog-yuzuk-01 | 8 | `whispering-promise-ring` | kenara dayanan parıltı | %6 | kusur |
| katalog-yuzuk-01 | 9 | `sparkswall-ring` | kenara dayanan parıltı | %5 | kusur |
| katalog-yuzuk-01 | 10 | `flinging-ring` | kenara dayanan parıltı | %6 | kusur |
| katalog-yuzuk-01 | 11 | `elemental-infusion-ring` | kenara dayanan parıltı | %5 | kusur |
| katalog-yuzuk-01 | 12 | `venomthorn-ring` | kenara dayanan parıltı | %5 | kusur |
| katalog-yuzuk-01 | 13 | `locksmiths-ring` | kenara dayanan parıltı | %5 | kusur |
| katalog-yuzuk-01 | 14 | `rootgrip-ring` | kenara dayanan parıltı | %4 | kusur |
| katalog-yuzuk-02 | 5 | `spellspark-pendant` | leylak/pembe hale | %30 | kusur |
| katalog-yuzuk-03 | 4 | `aether-core-stone` | leylak/pembe hale | %12 | belirsiz |
| katalog-yuzuk-03 | 7 | `ancient-imbuement-relic` | leylak/pembe hale | %49 | kusur |
| katalog-yuzuk-03 | 7 | `ancient-imbuement-relic` | kenara dayanan parıltı | %3 | belirsiz |
| katalog-tuketilebilir-01 | 12 | `cinder-cluster-bomb` | somon hale | %7 | belirsiz |
| katalog-tuketilebilir-02 | 2 | `steamveil-arrow` | kenara dayanan parıltı | %2 | belirsiz |
| katalog-tuketilebilir-02 | 3 | `hoarfrost-arrow` | leylak/pembe hale | %7 | belirsiz |
| katalog-tuketilebilir-02 | 5 | `blightbone-arrow` | kenara dayanan parıltı | %2 | belirsiz |
| katalog-tuketilebilir-02 | 7 | `splitflight-arrow` | leylak/pembe hale | %24 | kusur |
| katalog-tuketilebilir-02 | 8 | `transposition-arrow` | leylak/pembe hale | %24 | kusur |
| katalog-tuketilebilir-02 | 12 | `shadowpierce-arrow` | sis | %22 | belirsiz |
| katalog-tuketilebilir-03 | 1 | `hoarfrost-coating` | leylak/pembe hale | %40 | kusur |
| katalog-tuketilebilir-03 | 10 | `strong-will-draught` | somon hale | %9 | belirsiz |
| katalog-tuketilebilir-03 | 15 | `elixir-of-battlemage-focus` | leylak/pembe hale | %10 | belirsiz |
| katalog-bekleyen-01 | 6 | `lightcall-ring` | somon hale | %10 | belirsiz |

## Bütün public/esya: zemin kalıntısı ve kenar halesi (ESYA-IKON-ZEMIN-TEMIZLIK)

Taranan: `public/esya` (256), `public/esya/kucuk` (96) ve ayırt tabanları `assets/esya-taban` (ayırt çıktıları, hasar tonu meşru renk
eklediği için taranmaz; tabanından gelir). Ölçü ikonun kaynak sayfasının zemin kipiyle (yeşil sayfada yalnız yeşil/sarı-yeşil, macenta
sayfada yalnız macenta/pembe): anahtar kalıntısı = kenar bandı dışında opak anahtar rengi bileşenleri (256 px ölçeğinde px), kenar
halesi = saydama ≤ 3 px bantta hale rengi oranı. Eşikler: kalıntı 40 px, hale %10 (yarısı belirsiz).

- Taranan dosya: 1473; kaynak sayfası bilinmeyen (ölçülmeyen): yok
- Kusurlu: 0 (yeşil: kalıntı 0, hale 0; macenta: kalıntı 0, hale 0)
- Belirsiz: 11
- Meşru (manifest `zeminMesru`, gözle denetlendi; ölçüye takılan dosya 31):
  - asanın kendi mor-macenta gövde gölgesi (anahtar kalıntısı değil): `wand-of-the-war-mage-3`
  - şişenin kendi pembe camı ve parıltısı (macenta halesi değil): `sparkburst-flask`
  - kırmızı-turuncu ateş ya da ışık parıltısı, kırmızımsı kahve dış çizgi (macenta/pembe hale değil): `cinderheart-greatsword`, `golden-poise-greatsword`, `hellforge-plate`, `horizonlight-greatsword`, `ichorous-gloves`, `lightcall-ring`, `pitchtorch-club`, `radiant-sigil-stone`, `umbral-sigil-stone`, `skylight-longbow`, `sparkstride-boots`, `stormbolt-javelin`, `strong-will-draught`, `homing-forge-hammer`, `luster-twinblade`

| Dosya | Sayfa | Kip | Kusur | Ölçü | Durum |
|---|---|---|---|---|---|
| `barbed-chain-whip.webp` | katalog-silah-05 | macenta | macenta/pembe kenar halesi | %6 | belirsiz |
| `dawnmender-circlet.webp` | katalog-giyilebilir-01 | macenta | macenta/pembe kenar halesi | %6 | belirsiz |
| `pactbound-warhammer.webp` | katalog-silah-04 | macenta | macenta/pembe kenar halesi | %9 | belirsiz |
| `skybolt-spear.webp` | katalog-silah-06 | macenta | macenta/pembe kenar halesi | %7 | belirsiz |
| `sparkmesh-chain-shirt.webp` | katalog-zirh-02 | macenta | macenta/pembe anahtar kalıntısı | 20 px | belirsiz |
| `96/barbed-chain-whip.webp` | katalog-silah-05 | macenta | macenta/pembe kenar halesi | %6 | belirsiz |
| `96/druidic-focus.webp` | donanim-02 | yesil | yeşil/sarı-yeşil kenar halesi | %7 | belirsiz |
| `96/flinging-ring.webp` | katalog-yuzuk-01 | macenta | macenta/pembe anahtar kalıntısı | 21 px | belirsiz |
| `96/pactbound-warhammer.webp` | katalog-silah-04 | macenta | macenta/pembe kenar halesi | %7 | belirsiz |
| `96/staff-of-arcane-benediction.webp` | katalog-silah-07 | macenta | macenta/pembe kenar halesi | %6 | belirsiz |
| `96/whispering-promise-ring.webp` | katalog-yuzuk-01 | macenta | macenta/pembe kenar halesi | %5 | belirsiz |
