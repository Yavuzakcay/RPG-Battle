# KATALOG-IKON-KUSUR — katalog ikonlarında otomatik kusur taraması

Görev KATALOG-IKON-AKTAR-2. `node scripts/katalog-ikon-kusur.mjs` üretir (elle düzenlenmez). Hücreler gözle denetlenmedi; yalnız piksel sezgisi
(betiğin başındaki açıklama). Eşiği geçen "kusur", eşiğin yarısı ile eşik arası "belirsiz". Bir hücre birden çok satırda olabilir.

- Taranan ikon: 323
- Kusurlu hücre: 99 (kusur satırı 116: leylak/pembe hale 32, somon hale 38, macenta cep 7, sis 0, kenara dayanan parıltı 39)
- Belirsiz satır: 40 (leylak/pembe hale 14, somon hale 9, macenta cep 3, sis 9, kenara dayanan parıltı 5)
- Eşikler: leylak/pembe hale %12, somon hale %12, macenta cep 40 px, sis %30, kenara dayanan parıltı %3

| Sayfa | Hücre | Kimlik | Kusur türü | Ölçü | Durum |
|---|---|---|---|---|---|
| katalog-silah-01 | 1 | `giantbreaker-blade` | somon hale | %100 | kusur |
| katalog-silah-01 | 2 | `starcleave` | leylak/pembe hale | %25 | kusur |
| katalog-silah-01 | 5 | `cinderheart-greatsword` | somon hale | %69 | kusur |
| katalog-silah-01 | 8 | `frostcrescent-greatsword` | leylak/pembe hale | %61 | kusur |
| katalog-silah-01 | 10 | `riftbreaker-greatsword` | leylak/pembe hale | %77 | kusur |
| katalog-silah-01 | 11 | `horizonlight-greatsword` | somon hale | %98 | kusur |
| katalog-silah-01 | 13 | `golden-poise-greatsword` | somon hale | %83 | kusur |
| katalog-silah-01 | 14 | `twin-starblades` | leylak/pembe hale | %60 | kusur |
| katalog-silah-01 | 15 | `whirlwind-katana` | leylak/pembe hale | %10 | belirsiz |
| katalog-silah-02 | 2 | `cinderfrost-katana` | leylak/pembe hale | %34 | kusur |
| katalog-silah-02 | 4 | `stormbrand` | somon hale | %7 | belirsiz |
| katalog-silah-02 | 8 | `whispering-rapier` | leylak/pembe hale | %23 | kusur |
| katalog-silah-02 | 9 | `harmonic-rapier` | macenta cep | 84 px | kusur |
| katalog-silah-02 | 11 | `windpoise` | leylak/pembe hale | %9 | belirsiz |
| katalog-silah-02 | 14 | `nightjudge-scimitar` | macenta cep | 357 px | kusur |
| katalog-silah-02 | 16 | `nebula-wing-scimitar` | leylak/pembe hale | %77 | kusur |
| katalog-silah-03 | 2 | `gloomfang` | macenta cep | 120 px | kusur |
| katalog-silah-03 | 8 | `spiteful-dagger` | leylak/pembe hale | %33 | kusur |
| katalog-silah-03 | 9 | `frostbite-dagger` | leylak/pembe hale | %8 | belirsiz |
| katalog-silah-04 | 3 | `glacierbreak-maul` | leylak/pembe hale | %66 | kusur |
| katalog-silah-04 | 6 | `shadowbloom-maul` | somon hale | %66 | kusur |
| katalog-silah-04 | 6 | `shadowbloom-maul` | kenara dayanan parıltı | %5 | kusur |
| katalog-silah-04 | 9 | `twinspark-greataxe` | somon hale | %6 | belirsiz |
| katalog-silah-04 | 12 | `chainbreaker-warhammer` | leylak/pembe hale | %54 | kusur |
| katalog-silah-04 | 13 | `oathshatter-warhammer` | leylak/pembe hale | %21 | kusur |
| katalog-silah-04 | 14 | `pactbound-warhammer` | somon hale | %53 | kusur |
| katalog-silah-04 | 15 | `homing-forge-hammer` | somon hale | %24 | kusur |
| katalog-silah-05 | 3 | `sparkling-handaxe` | somon hale | %12 | belirsiz |
| katalog-silah-05 | 4 | `gale-light-hammer` | leylak/pembe hale | %8 | belirsiz |
| katalog-silah-05 | 5 | `sparkforge-hammer` | leylak/pembe hale | %12 | belirsiz |
| katalog-silah-05 | 6 | `dawnseal-mace` | somon hale | %32 | kusur |
| katalog-silah-05 | 6 | `dawnseal-mace` | kenara dayanan parıltı | %4 | kusur |
| katalog-silah-05 | 10 | `sunstar-morningstar` | somon hale | %63 | kusur |
| katalog-silah-05 | 10 | `sunstar-morningstar` | kenara dayanan parıltı | %4 | kusur |
| katalog-silah-05 | 12 | `brimstone-flail` | somon hale | %34 | kusur |
| katalog-silah-05 | 14 | `stardust-flail` | leylak/pembe hale | %37 | kusur |
| katalog-silah-05 | 15 | `barbed-chain-whip` | somon hale | %9 | belirsiz |
| katalog-silah-06 | 2 | `breeze-glaive` | leylak/pembe hale | %10 | belirsiz |
| katalog-silah-06 | 2 | `breeze-glaive` | sis | %19 | belirsiz |
| katalog-silah-06 | 5 | `homing-pike` | leylak/pembe hale | %27 | kusur |
| katalog-silah-06 | 5 | `homing-pike` | sis | %17 | belirsiz |
| katalog-silah-06 | 9 | `luster-twinblade` | somon hale | %99 | kusur |
| katalog-silah-06 | 9 | `luster-twinblade` | kenara dayanan parıltı | %3 | kusur |
| katalog-silah-06 | 10 | `tempest-trident` | leylak/pembe hale | %7 | belirsiz |
| katalog-silah-06 | 10 | `tempest-trident` | sis | %16 | belirsiz |
| katalog-silah-06 | 11 | `tidecaller-trident` | leylak/pembe hale | %9 | belirsiz |
| katalog-silah-06 | 13 | `dusklight-spear` | leylak/pembe hale | %11 | belirsiz |
| katalog-silah-06 | 13 | `dusklight-spear` | kenara dayanan parıltı | %2 | belirsiz |
| katalog-silah-06 | 14 | `skybolt-spear` | somon hale | %23 | kusur |
| katalog-silah-06 | 15 | `stormbolt-javelin` | somon hale | %43 | kusur |
| katalog-silah-06 | 16 | `ribbon-whip-blade` | sis | %16 | belirsiz |
| katalog-silah-07 | 3 | `hoarfrost-staff` | leylak/pembe hale | %65 | kusur |
| katalog-silah-07 | 3 | `hoarfrost-staff` | kenara dayanan parıltı | %17 | kusur |
| katalog-silah-07 | 4 | `sparkweave-staff` | somon hale | %9 | belirsiz |
| katalog-silah-07 | 7 | `archmages-conduit-staff` | leylak/pembe hale | %18 | kusur |
| katalog-silah-07 | 7 | `archmages-conduit-staff` | kenara dayanan parıltı | %11 | kusur |
| katalog-silah-07 | 10 | `resonance-staff` | leylak/pembe hale | %14 | kusur |
| katalog-silah-07 | 10 | `resonance-staff` | sis | %20 | belirsiz |
| katalog-silah-07 | 11 | `staff-of-arcane-benediction` | somon hale | %99 | kusur |
| katalog-silah-07 | 14 | `pitchtorch-club` | somon hale | %22 | kusur |
| katalog-silah-07 | 16 | `silent-needle-blowgun` | sis | %20 | belirsiz |
| katalog-silah-08 | 1 | `skylight-longbow` | somon hale | %94 | kusur |
| katalog-silah-08 | 1 | `skylight-longbow` | kenara dayanan parıltı | %6 | kusur |
| katalog-silah-08 | 2 | `deadeye-longbow` | sis | %17 | belirsiz |
| katalog-silah-08 | 3 | `shadowveil-shortbow` | sis | %15 | belirsiz |
| katalog-silah-08 | 4 | `banshees-wail-shortbow` | leylak/pembe hale | %43 | kusur |
| katalog-silah-08 | 6 | `forcebolt-hand-crossbow` | leylak/pembe hale | %22 | kusur |
| katalog-silah-08 | 8 | `starstone-sling` | leylak/pembe hale | %10 | belirsiz |
| katalog-zirh-01 | 6 | `hellforge-plate` | somon hale | %44 | kusur |
| katalog-zirh-01 | 12 | `mindfortress-plate` | leylak/pembe hale | %11 | belirsiz |
| katalog-zirh-01 | 12 | `mindfortress-plate` | kenara dayanan parıltı | %53 | kusur |
| katalog-zirh-01 | 15 | `forcewave-chain-mail` | leylak/pembe hale | %55 | kusur |
| katalog-zirh-02 | 8 | `sparkmesh-chain-shirt` | macenta cep | 45 px | kusur |
| katalog-zirh-02 | 9 | `sunburst-breastplate` | somon hale | %99 | kusur |
| katalog-zirh-02 | 9 | `sunburst-breastplate` | kenara dayanan parıltı | %44 | kusur |
| katalog-zirh-03 | 1 | `raptor-feather-coat` | somon hale | %76 | kusur |
| katalog-zirh-03 | 1 | `raptor-feather-coat` | kenara dayanan parıltı | %28 | kusur |
| katalog-zirh-03 | 2 | `spellblade-coat` | kenara dayanan parıltı | %15 | kusur |
| katalog-zirh-03 | 3 | `moonshift-hide` | somon hale | %15 | kusur |
| katalog-zirh-03 | 3 | `moonshift-hide` | kenara dayanan parıltı | %20 | kusur |
| katalog-zirh-03 | 5 | `spidersilk-armor` | kenara dayanan parıltı | %7 | kusur |
| katalog-zirh-03 | 6 | `corsair-captains-coat` | somon hale | %10 | belirsiz |
| katalog-zirh-03 | 6 | `corsair-captains-coat` | kenara dayanan parıltı | %20 | kusur |
| katalog-zirh-03 | 7 | `minstrels-favor-jerkin` | somon hale | %61 | kusur |
| katalog-zirh-03 | 7 | `minstrels-favor-jerkin` | kenara dayanan parıltı | %15 | kusur |
| katalog-zirh-03 | 9 | `vigil-shroud-robe` | somon hale | %64 | kusur |
| katalog-zirh-03 | 9 | `vigil-shroud-robe` | kenara dayanan parıltı | %39 | kusur |
| katalog-zirh-03 | 10 | `weavewoven-robe` | somon hale | %49 | kusur |
| katalog-zirh-03 | 10 | `weavewoven-robe` | kenara dayanan parıltı | %36 | kusur |
| katalog-zirh-03 | 11 | `resonant-caster-robe` | somon hale | %66 | kusur |
| katalog-zirh-03 | 11 | `resonant-caster-robe` | kenara dayanan parıltı | %21 | kusur |
| katalog-zirh-03 | 12 | `robe-of-supreme-focus` | leylak/pembe hale | %78 | kusur |
| katalog-zirh-03 | 12 | `robe-of-supreme-focus` | kenara dayanan parıltı | %24 | kusur |
| katalog-zirh-03 | 13 | `soulmender-monk-vest` | kenara dayanan parıltı | %21 | kusur |
| katalog-zirh-03 | 14 | `tidecaller-robe` | leylak/pembe hale | %79 | kusur |
| katalog-zirh-03 | 14 | `tidecaller-robe` | kenara dayanan parıltı | %31 | kusur |
| katalog-zirh-03 | 15 | `nimble-cat-tunic` | kenara dayanan parıltı | %17 | kusur |
| katalog-zirh-03 | 16 | `venomweaver-robe` | kenara dayanan parıltı | %18 | kusur |
| katalog-zirh-04 | 3 | `one-eyed-mortar-shield` | kenara dayanan parıltı | %2 | belirsiz |
| katalog-zirh-04 | 6 | `walking-bastion-shield` | kenara dayanan parıltı | %7 | kusur |
| katalog-zirh-04 | 9 | `sunward-shield` | somon hale | %98 | kusur |
| katalog-giyilebilir-01 | 4 | `fungal-crown` | somon hale | %25 | kusur |
| katalog-giyilebilir-01 | 5 | `snow-witch-hat` | leylak/pembe hale | %7 | belirsiz |
| katalog-giyilebilir-01 | 13 | `dawnmender-circlet` | somon hale | %49 | kusur |
| katalog-giyilebilir-02 | 4 | `weavefold-cloak` | leylak/pembe hale | %20 | kusur |
| katalog-giyilebilir-02 | 8 | `frostmist-cloak` | leylak/pembe hale | %81 | kusur |
| katalog-giyilebilir-03 | 5 | `skythunder-gloves` | leylak/pembe hale | %36 | kusur |
| katalog-giyilebilir-03 | 5 | `skythunder-gloves` | macenta cep | 25 px | belirsiz |
| katalog-giyilebilir-03 | 7 | `luminous-gauntlets` | somon hale | %14 | kusur |
| katalog-giyilebilir-03 | 9 | `winterclaw-gloves` | leylak/pembe hale | %19 | kusur |
| katalog-giyilebilir-03 | 11 | `ichorous-gloves` | somon hale | %78 | kusur |
| katalog-giyilebilir-03 | 13 | `sparkhand-gloves` | somon hale | %12 | belirsiz |
| katalog-giyilebilir-04 | 3 | `skyvault-boots` | somon hale | %8 | belirsiz |
| katalog-giyilebilir-04 | 5 | `stormstep-boots` | kenara dayanan parıltı | %21 | kusur |
| katalog-giyilebilir-04 | 7 | `springvault-boots` | macenta cep | 123 px | kusur |
| katalog-giyilebilir-04 | 8 | `waterskipper-sandals` | macenta cep | 35 px | belirsiz |
| katalog-giyilebilir-04 | 10 | `sparkstride-boots` | somon hale | %40 | kusur |
| katalog-yuzuk-01 | 1 | `shadowspark-ring` | kenara dayanan parıltı | %5 | kusur |
| katalog-yuzuk-01 | 2 | `high-command-ring` | leylak/pembe hale | %27 | kusur |
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
| katalog-yuzuk-02 | 4 | `devouts-medallion` | somon hale | %94 | kusur |
| katalog-yuzuk-02 | 5 | `spellspark-pendant` | leylak/pembe hale | %27 | kusur |
| katalog-yuzuk-02 | 6 | `subjugation-pendant` | macenta cep | 211 px | kusur |
| katalog-yuzuk-02 | 14 | `silverthread-locket` | somon hale | %88 | kusur |
| katalog-yuzuk-03 | 3 | `umbral-sigil-stone` | somon hale | %100 | kusur |
| katalog-yuzuk-03 | 4 | `aether-core-stone` | leylak/pembe hale | %11 | belirsiz |
| katalog-yuzuk-03 | 7 | `ancient-imbuement-relic` | leylak/pembe hale | %52 | kusur |
| katalog-yuzuk-03 | 7 | `ancient-imbuement-relic` | kenara dayanan parıltı | %3 | belirsiz |
| katalog-tuketilebilir-01 | 4 | `flashblind-capsule` | somon hale | %63 | kusur |
| katalog-tuketilebilir-01 | 12 | `cinder-cluster-bomb` | somon hale | %6 | belirsiz |
| katalog-tuketilebilir-02 | 2 | `steamveil-arrow` | kenara dayanan parıltı | %2 | belirsiz |
| katalog-tuketilebilir-02 | 3 | `hoarfrost-arrow` | leylak/pembe hale | %7 | belirsiz |
| katalog-tuketilebilir-02 | 5 | `blightbone-arrow` | kenara dayanan parıltı | %2 | belirsiz |
| katalog-tuketilebilir-02 | 6 | `arcing-bolt-arrow` | somon hale | %36 | kusur |
| katalog-tuketilebilir-02 | 7 | `splitflight-arrow` | leylak/pembe hale | %26 | kusur |
| katalog-tuketilebilir-02 | 8 | `transposition-arrow` | leylak/pembe hale | %21 | kusur |
| katalog-tuketilebilir-02 | 11 | `blessed-mending-arrow` | somon hale | %65 | kusur |
| katalog-tuketilebilir-02 | 12 | `shadowpierce-arrow` | macenta cep | 76 px | kusur |
| katalog-tuketilebilir-03 | 1 | `hoarfrost-coating` | leylak/pembe hale | %43 | kusur |
| katalog-tuketilebilir-03 | 10 | `strong-will-draught` | somon hale | %85 | kusur |
| katalog-tuketilebilir-03 | 15 | `elixir-of-battlemage-focus` | leylak/pembe hale | %16 | kusur |
| katalog-bekleyen-01 | 2 | `helldusk-gauntlets` | macenta cep | 35 px | belirsiz |
| katalog-bekleyen-01 | 6 | `callous-glow-ring` | somon hale | %21 | kusur |
