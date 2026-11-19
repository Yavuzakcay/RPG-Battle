# Control Water dört seçenek (uzak daldaki girdabın üstüne; 2026-11-19)

- `girdap-gunluk.png`: Kale Önü (gündüz), Mira 5. slotla girdabı Ogre 1'in altıgenine açtı (yarıçap 3 altıgen, 31 altıgen). Ogre 1'in tur başı STR save'i dezavantajlı (örnek süren etki Enlarge/Reduce), başarısız: 3d8 Bludgeoning ve yakalanma. Günlükte save satırının ayrıntısı: "Dezavantaj: Enlarge/Reduce (STR save)".
- Seçim menüsü (savaş ekranı, büyü seçilince): Whirlpool, Flood, Part Water, Redirect Flow; seçilen seçeneğin notu menünün altında (TR `data/aciklamalar-tr.json` `buyuSecenek`, EN `strings.en.ts` `log.gmOptionText`).
- Üretim: `girdap-ekran.mjs` (Vite + Playwright; depo kökünde `scripts/` altına kopyalanıp `node scripts/<ad>.mjs <çıktı.png>`).
