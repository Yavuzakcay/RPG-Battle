# Celestial hale denetimi ve Gece Gözyaşı (İŞ 2, yalnız önizleme)

`python3 scripts/hale-tespit.py` (tespit), `python3 scripts/hale-onizleme.py` (önizleme). 264 Celestial jeton (sınıf-genel 24 + alt sınıf jetonları).

| Durum | Jeton | Anlamı |
|---|---|---|
| tam | 185 | başın/şapkanın üstünde ince altın halka bulundu, kanvas kenarına değmiyor |
| kesik | 9 | halka bulundu ama dar (< 30 px) ya da üst kenara değiyor |
| yok | 70 | halka tespit edilemedi (kasklı/taçlı/saç örtüyor olabilir ya da tespit kaçırdı; bu jetonlarda hiçbir şey silinmez) |

Kesik liste: celestial-erkek-barbarian-ID7, celestial-erkek-druid-ID1, celestial-erkek-rogue-ID4, celestial-erkek-warlock-WL-5, celestial-erkek-warlock-WL-7, celestial-kadin-bard-ID9, celestial-kadin-ranger-ID8, celestial-kadin-rogue-ID4, celestial-kadin-rogue-ID7.

## Bulgular
- **Hale gizlemesi şimdi:** `data/alt-soy-gorunum.json` `hale.gizleUstYuzde` 9,5: `lineageLook` `hideHalo` (Gece Gözyaşı ve Kırık Kanat uyanışı) → `Avatar.tsx` SVG `clipPath` / `LookFrame.tsx` `--halo-clip` ile görselin üst %9,5'i (256 px'te ilk 24 satır) KIRPILIR. Sabit kutu: halka çoğu jetonda 22–33. satırlarda olduğundan halkanın üst yarısı gider, alt yarısı kalır ("yarım hale"); uzun şapka/taç (Bard davul) 24. satırın üstüne çıkınca şapka ucu da kesilir.
- Jetonlardaki halelerin çoğu bütün (tam 185); "kesik hale" şikâyeti çoğunlukla bu sabit kırpmadan, jeton kesiminden değil. İŞ 1'den sonra yarım-hale kesikliği ayrıca düzeltilmeye gerek görünmüyor.
- **Önerilen çözüm (uygulanmadı):** her Celestial jetonun halesini önceden tespit edip (`hale-tespit.py`: başın/şapkanın üstündeki altın ince halka) hale pikselleri silinmiş `characters/halesiz/<ad>.webp` üret; `hideHalo` iken avatar bunu kullansın (çalışma anında maliyet yok, kırpma yok); tespit edilemeyen jetonda halesiz kopya üretilmez ve hiçbir şey silinmez. Hale olmayan jetonlarda (70 "yok") isteğe bağlı kodla çizilen tek tip altın hale (`hale-onizleme.py` `draw_halo`, figürün arkasında, baş üstüne ortalı).
- Sınırlar: tespit sezgisel (altın/sarı-yeşilimsi ton + ince halka). Sarı saç ve altın zırhla bitişik halelerde silme artığı kalabilir (önizlemede Paladin/Ranger/Wizard'da hafif nokta); tam doğruluk için el kontrollü liste gerekebilir.

Önizlemeler: `docs/sabah/hale-gece-gozyasi-onizleme.png` (üst: şimdiki sabit kırpma, alt: gerçek hale pikselleri silinmiş; 12 sınıf + yeşil şapkalı Bard), `docs/sabah/hale-durum-onizleme.png` (kesik/yok/tam örnekleri ve çizilen hale).
