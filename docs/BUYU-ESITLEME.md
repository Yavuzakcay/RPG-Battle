# Büyü verisi ↔ SRD 5.2.1 eşitleme raporu

`scripts/srd-buyu-esitle.mjs` üretir (elle düzenleme). Kaynak: `data/srd/spells.json` (`npm run srd`, PDF'ten).

Oyundaki büyü: 82. SRD 5.2.1'deki büyü: 339.

## Kendiliğinden düzeltilenler

- Yok (veri SRD ile eşit).

## Denetim notları

Menzil kuralı: dokunma 5 ft, kendi 0 ft; kendinden çıkan alanda alanın boyu (`rangeFt`).

- **Shillelagh**: mekanik yok (utility) — oyunda etki elle uygulanır
- **Guidance**: mekanik yok (utility) — oyunda etki elle uygulanır
- **Resistance**: mekanik yok (utility) — oyunda etki elle uygulanır
- **Spare the Dying**: mekanik yok (utility) — oyunda etki elle uygulanır
- **True Strike**: mekanik yok (utility) — oyunda etki elle uygulanır
- **Mage Hand**: mekanik yok (utility) — oyunda etki elle uygulanır
- **Shield**: mekanik yok (utility) — oyunda etki elle uygulanır
- **Mage Armor**: mekanik yok (utility) — oyunda etki elle uygulanır
- **Bless**: mekanik yok (utility) — oyunda etki elle uygulanır
- **Command**: mekanik yok (utility) — oyunda etki elle uygulanır
- **Shield of Faith**: mekanik yok (utility) — oyunda etki elle uygulanır
- **Divine Favor**: mekanik yok (utility) — oyunda etki elle uygulanır
- **Searing Smite**: mekanik yok (utility) — oyunda etki elle uygulanır
- **Faerie Fire**: mekanik yok (utility) — oyunda etki elle uygulanır
- **Hex**: mekanik yok (utility) — oyunda etki elle uygulanır
- **Misty Step**: mekanik yok (utility) — oyunda etki elle uygulanır
- **Mirror Image**: mekanik yok (utility) — oyunda etki elle uygulanır
- **Blur**: mekanik yok (utility) — oyunda etki elle uygulanır
- **Invisibility**: mekanik yok (utility) — oyunda etki elle uygulanır
- **Darkness**: mekanik yok (utility) — oyunda etki elle uygulanır
- **Aid**: mekanik yok (utility) — oyunda etki elle uygulanır
- **Lesser Restoration**: mekanik yok (utility) — oyunda etki elle uygulanır
- **Shining Smite**: mekanik yok (utility) — oyunda etki elle uygulanır
- **Barkskin**: mekanik yok (utility) — oyunda etki elle uygulanır
- **Counterspell**: mekanik yok (utility) — oyunda etki elle uygulanır
- **Haste**: mekanik yok (utility) — oyunda etki elle uygulanır
- **Slow**: mekanik yok (utility) — oyunda etki elle uygulanır
- **Fly**: mekanik yok (utility) — oyunda etki elle uygulanır
- **Blink**: mekanik yok (utility) — oyunda etki elle uygulanır
- **Bestow Curse**: mekanik yok (utility) — oyunda etki elle uygulanır
- **Dispel Magic**: mekanik yok (utility) — oyunda etki elle uygulanır
- **Dispel Magic** yukarı slot etkisi yapılandırılamadı: "You automatically end a spell on the target if the spell’s level is equal to or less than the level of the spell slot you use."
- **Protection from Energy**: mekanik yok (utility) — oyunda etki elle uygulanır
- **Remove Curse**: mekanik yok (utility) — oyunda etki elle uygulanır
- **Revivify**: mekanik yok (utility) — oyunda etki elle uygulanır
- **Beacon of Hope**: mekanik yok (utility) — oyunda etki elle uygulanır
- **Conjure Animals**: mekanik yok (utility) — oyunda etki elle uygulanır

## Bilinen yaklaşıklıklar (veride `mechanics.approx`)

- **Produce Flame**: SRD: alev bonus eylemle yaratılır, Magic eylemiyle 60 ft fırlatılır; oyunda yaratıp fırlatmak tek bonus eylem
- **Sleep**: SRD: başarısızlıkta Incapacitated, sonraki tur sonu ikinci başarısız save Unconscious; ikinci aşama yok, her tur sonu save ile biten Incapacitated
- **Mass Healing Word**: SRD: altı hedefe kadar; oyunda tek hedef

## Yukarı slot (upcast)

`mechanics.upcast` SRD metninden üretilir: `dice` (slot başına ek zar), `rays` (ek ışın/dart), `targets` (ek hedef), `hp` (ek HP), `duration` (yalnızca süre). Motor yalnızca `applied: true` olanları uygular (şimdilik Spiritual Weapon ve Spirit Guardians); diğerleri Aşama 1'de.

- Burning Hands: {"dice":"1d6"}
- Magic Missile: {"rays":1}
- Thunderwave: {"dice":"1d8"}
- Chromatic Orb: {"dice":"1d8"}
- Ray of Sickness: {"dice":"1d8"}
- Charm Person: {"targets":1}
- Hideous Laughter: {"targets":1}
- Dissonant Whispers: {"dice":"1d6"}
- Bless: {"targets":1}
- Command: {"targets":1}
- Cure Wounds: {"dice":"2d8"}
- Healing Word: {"dice":"2d4"}
- Guiding Bolt: {"dice":"1d6"}
- Inflict Wounds: {"dice":"1d10"}
- Searing Smite: {"dice":"1d6"}
- Hunter's Mark: {"duration":true}
- Hex: {"duration":true}
- Hellish Rebuke: {"dice":"1d10"}
- Scorching Ray: {"rays":1}
- Shatter: {"dice":"1d8"}
- Invisibility: {"targets":1}
- Hold Person: {"targets":1}
- Acid Arrow: {"dice":"1d4"}
- Flaming Sphere: {"dice":"1d6"}
- Moonbeam: {"dice":"1d10"}
- Heat Metal: {"dice":"1d8"}
- Blindness/Deafness: {"targets":1}
- Spiritual Weapon: {"dice":"1d8","applied":true}
- Aid: {"hp":5}
- Shining Smite: {"dice":"1d6"}
- Fireball: {"dice":"1d6"}
- Lightning Bolt: {"dice":"1d6"}
- Fly: {"targets":1}
- Vampiric Touch: {"dice":"1d6"}
- Bestow Curse: {"duration":true}
- Dispel Magic: {"other":true}
- Spirit Guardians: {"dice":"1d8","applied":true}
- Mass Healing Word: {"dice":"1d4"}
- Call Lightning: {"dice":"1d10"}
- Conjure Animals: {"dice":"1d10"}
