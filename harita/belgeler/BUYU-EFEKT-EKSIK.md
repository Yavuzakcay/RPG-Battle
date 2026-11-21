# Efekt bağlaması olmayan SRD büyüleri (gece kuyruğu Aşama 3c)

`node scripts/buyu-efekt-eksik.mjs` üretir (salt okuma). Ölçüt: savaşta kullanılan (savaş dışı olmayan) büyünün kimliği
`data/efekt-baglama.json`'ın `buyu`, `zemin`, `auraBuyu`, `rozetBuyu`, `konturBuyu`, `cagirRenk`, `etkiHalka` tablolarının hiçbirinde yok. Genel bağlamalar (hasar türüne göre
darbe, iyileştirme, ışınlanma, çağırma, koruma, durum halkası) bu büyülerde de çalışabilir; liste yalnız büyüye özgü bağlamanın
olmadığını gösterir. Görsel üretilmedi, bağlama eklenmedi.

Toplam: 78 büyü (süren etkili 42, anlık 36); bağlı büyü kimliği 153.

## Süren etki ya da alan bırakanlar (rozet/halka/zemin adayı)

| Büyü | Sv | Mekanik türü |
|---|---:|---|
| Dancing Lights (`dancing-lights`) | 0 | zone |
| Guidance (`guidance`) | 0 | effect |
| Light (`light`) | 0 | effect |
| Animal Friendship (`animal-friendship`) | 1 | effect |
| Charm Person (`charm-person`) | 1 | effect |
| Fog Cloud (`fog-cloud`) | 1 | zone |
| Heroism (`heroism`) | 1 | effect |
| Hideous Laughter (`hideous-laughter`) | 1 | effect |
| Mage Armor (`mage-armor`) | 1 | effect |
| Barkskin (`barkskin`) | 2 | effect |
| Continual Flame (`continual-flame`) | 2 | effect |
| Dragon's Breath (`dragons-breath`) | 2 | effect |
| Invisibility (`invisibility`) | 2 | effect |
| Protection from Poison (`protection-from-poison`) | 2 | effect |
| Suggestion (`suggestion`) | 2 | effect |
| Web (`web`) | 2 | save |
| Beacon of Hope (`beacon-of-hope`) | 3 | effect |
| Conjure Animals (`conjure-animals`) | 3 | summon |
| Gaseous Form (`gaseous-form`) | 3 | effect |
| Hypnotic Pattern (`hypnotic-pattern`) | 3 | save |
| Protection from Energy (`protection-from-energy`) | 3 | effect |
| Stinking Cloud (`stinking-cloud`) | 3 | save |
| Wind Wall (`wind-wall`) | 3 | zone |
| Charm Monster (`charm-monster`) | 4 | effect |
| Compulsion (`compulsion`) | 4 | save |
| Freedom of Movement (`freedom-of-movement`) | 4 | effect |
| Greater Invisibility (`greater-invisibility`) | 4 | effect |
| Stoneskin (`stoneskin`) | 4 | effect |
| Vitriolic Sphere (`vitriolic-sphere`) | 4 | save |
| Wall of Fire (`wall-of-fire`) | 4 | save |
| Mislead (`mislead`) | 5 | effect |
| Modify Memory (`modify-memory`) | 5 | effect |
| Wall of Force (`wall-of-force`) | 5 | zone |
| Wall of Stone (`wall-of-stone`) | 5 | zone |
| Blade Barrier (`blade-barrier`) | 6 | save |
| Flesh to Stone (`flesh-to-stone`) | 6 | save |
| Mass Suggestion (`mass-suggestion`) | 6 | effect |
| Wall of Ice (`wall-of-ice`) | 6 | save |
| Wall of Thorns (`wall-of-thorns`) | 6 | save |
| Mind Blank (`mind-blank`) | 8 | effect |
| Prismatic Wall (`prismatic-wall`) | 9 | zone |
| Weird (`weird`) | 9 | save |

## Anlık (mermi/ışın/darbe adayı)

| Büyü | Sv | Mekanik türü |
|---|---:|---|
| Acid Splash (`acid-splash`) | 0 | save |
| Chill Touch (`chill-touch`) | 0 | attack |
| Shocking Grasp (`shocking-grasp`) | 0 | attack |
| Burning Hands (`burning-hands`) | 1 | save |
| Cure Wounds (`cure-wounds`) | 1 | heal |
| Find Familiar (`find-familiar`) | 1 | summon |
| Healing Word (`healing-word`) | 1 | heal |
| Sleep (`sleep`) | 1 | save |
| Thunderwave (`thunderwave`) | 1 | save |
| Blindness/Deafness (`blindness-deafness`) | 2 | save |
| Find Steed (`find-steed`) | 2 | summon |
| Hold Person (`hold-person`) | 2 | save |
| Misty Step (`misty-step`) | 2 | teleport |
| Shatter (`shatter`) | 2 | save |
| Animate Dead (`animate-dead`) | 3 | summon |
| Fireball (`fireball`) | 3 | save |
| Mass Healing Word (`mass-healing-word`) | 3 | heal |
| Vampiric Touch (`vampiric-touch`) | 3 | attack |
| Dimension Door (`dimension-door`) | 4 | teleport |
| Giant Insect (`giant-insect`) | 4 | summon |
| Stone Shape (`stone-shape`) | 4 | utility |
| Cone of Cold (`cone-of-cold`) | 5 | save |
| Hold Monster (`hold-monster`) | 5 | save |
| Mass Cure Wounds (`mass-cure-wounds`) | 5 | heal |
| Passwall (`passwall`) | 5 | utility |
| Tree Stride (`tree-stride`) | 5 | teleport |
| Circle of Death (`circle-of-death`) | 6 | save |
| Eyebite (`eyebite`) | 6 | save |
| Freezing Sphere (`freezing-sphere`) | 6 | save |
| Heal (`heal`) | 6 | heal |
| Fire Storm (`fire-storm`) | 7 | save |
| Power Word Stun (`power-word-stun`) | 8 | utility |
| Sunburst (`sunburst`) | 8 | save |
| Mass Heal (`mass-heal`) | 9 | utility |
| Power Word Heal (`power-word-heal`) | 9 | utility |
| Wish (`wish`) | 9 | utility |
