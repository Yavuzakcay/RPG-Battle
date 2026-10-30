# Elle soy maskesi çizme (Görev K21)

Soy renkleri (Goliath, Dragonborn, Drow, Tiefling, Gnome) jetonun yalnızca **ten bölgesine** uygulanır. Bu bölgeyi
otomatik maske bulur; ten ile zırh/saç/kürk aynı tondaysa yanılır. O jeton için maskeyi elle çizersiniz; elle maske
her zaman otomatik maskenin önüne geçer.

## Kurallar

- **Klasör:** `assets/soy-maske-el/`
- **Dosya adı:** jetonla aynı ad, `.png` uzantılı: `<ırk>-<male|female>-<sınıf>.png`
  (örnek: `goliath-male-paladin.png`, `dragonborn-female-barbarian.png`, `elf-female-rogue.png`). İnceleme sayfası her
  jeton için doğru adı yazar.
- **Boyut:** jetonla aynı piksel boyutu (256 × 256). Ölçeklemeyin, kırpmayın.
- **Renkler:** yalnızca siyah, beyaz ve gri.
  - **Beyaz:** boyanacak ten (pul, deri).
  - **Siyah** ya da **saydam:** dokunulmaz (saç, zırh, kıyafet, silah, göz).
  - **Gri:** kısmen boyanır (kenar yumuşatma; açık gri daha çok). Elle maskeye ek düzeltme yapılmaz.
- Kurala uymayan dosya (yanlış ad, yanlış boyut, renkli piksel) **yok sayılır**, o jetonda otomatik maske kullanılır;
  komut ve inceleme sayfası nedenini yazar.
- `npm run soy-maske` ve `npm run soy-incele` bu klasöre hiçbir şey yazmaz, oradan hiçbir şey silmez.

## Adımlar

1. Sonucu görün: PowerShell'de

   ```powershell
   npm run soy-incele
   ```

   `docs/sabah/soy-inceleme/index.html` dosyasını tarayıcıda açın. Her satır: orijinal jeton, kırmızı örtülü maske,
   maske kaynağı (otomatik/ELLE) ve soyların boyanmış hâlleri. Kırmızı örtü saça, zırha ya da kürke taşıyorsa o
   jetonun adını not edin.
2. Şablonu açın: `docs/sabah/soy-inceleme/sablon/<ad>.png` (siyah zemin üstünde soluk jeton; yalnızca yol gösterir).
   - **Photopea** (ücretsiz, tarayıcıda: photopea.com): Dosya → Aç → şablonu seçin.
   - **Paint.NET** (Windows): Dosya → Aç → şablonu seçin.
3. Yeni katman ekleyin (Photopea: Katman → Yeni → Katman; Paint.NET: Katmanlar → Yeni Katman Ekle).
4. Yeni katmanda **beyaz fırçayla** ten bölgelerini boyayın. Kenarları yumuşak bırakmak isterseniz düşük saydamlıklı
   fırça ya da gri kullanabilirsiniz. Saç, zırh, kemer, kıyafet ve silahı boyamayın.
5. Şablon (alttaki) katmanını **gizleyin** (göz simgesi). Görünen yalnızca beyaz boyamanız olmalı; geri kalanı saydam
   ya da siyah.
6. PNG olarak kaydedin (Photopea: Dosya → Farklı Dışa Aktar → PNG; Paint.NET: Farklı Kaydet → PNG, "düzleştir" sorusuna
   evet), adı jetonla aynı olsun, `assets/soy-maske-el/` klasörüne koyun.
   **Şablonun kendisini bu klasöre koymayın:** renkli olduğu için reddedilir.
7. Kontrol edin:

   ```powershell
   npm run soy-incele
   ```

   Satırda kaynak "ELLE" görünmeli, kırmızı örtü yalnızca tende olmalı. Uyarı varsa sayfanın başında yazar.
8. Soy renk ölçümünü güncelleyin (renk farkı testi bu dosyayı okur):

   ```powershell
   npm run soy-maske
   npm test -- src/ui/tint.test.ts
   ```
