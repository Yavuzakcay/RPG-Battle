/**
 * Test fikstürü: kaldırılan eski Volkan haritasının düzeni (kimliği "eski-volkan"). Hareket, yerleştirme
 * ve doğrulama testleri bu sabit geometriye bağlıdır; katalogda (data/maps) yer almaz.
 */
import type { RawMap } from '../maps';

export const ESKI_VOLKAN = {
  "id": "eski-volkan",
  "name": "Eski Volkan",
  "environmentId": "volkan-lav",
  "orientation": "flat-top",
  "offset": "odd-q",
  "size": {
    "cols": 15,
    "rows": 7
  },
  "hexFeet": 5,
  "tiles": [
    "#.~~~.~~~~~~#.#",
    "~..f~~~.~~....~",
    "~...~~~H~~~...~",
    "~....~HHH~....~",
    "~...~~...~~f..~",
    "~...~.~.~.~...~",
    "##.~~#~~~~~~.##"
  ],
  "startZones": {
    "players": {
      "colRange": [
        2,
        4
      ]
    },
    "enemies": {
      "colRange": [
        12,
        14
      ]
    },
    "note": "Sadece geçilebilir ve tehlikesiz altıgenler: engel, lav, alev ve 3/4 siperli kaya kümesi (r) hariç; t ve k dahil. Her iki adada 16 altıgen."
  },
  "variants": [
    {
      "id": "varsayilan",
      "name": "Volkan",
      "image": "maps/harita-volkan-adalar.webp",
      "rules": [
        {
          "id": "lavaEdge",
          "save": null,
          "damage": "1d6",
          "damageType": "fire",
          "when": "startOfOwnTurn",
          "requires": [
            "adjacentToLava"
          ]
        },
        {
          "id": "eruption",
          "optional": true,
          "trigger": "gm",
          "everyRounds": 3,
          "radius": 1,
          "save": "DEX",
          "dc": 13,
          "damage": "4d6",
          "damageType": "fire",
          "halfOnSave": true
        },
        {
          "id": "lavaRise",
          "optional": true,
          "trigger": "gm",
          "startRound": 4,
          "everyRounds": 2,
          "warnRoundsBefore": 1,
          "effect": "edgeRingOfLandBecomesLava"
        },
        {
          "id": "lavJump",
          "over": [
            "~"
          ],
          "check": {
            "skill": "athletics",
            "dcBase": 10,
            "dcPerExtraHex": 2
          },
          "natural20": "safe",
          "natural1": "fall",
          "onFail": {
            "damage": "2d6",
            "damageType": "fire",
            "condition": "Burning"
          },
          "fall": "deadly",
          "burning": {
            "damage": "1d6",
            "damageType": "fire",
            "save": "DEX",
            "dc": 10
          },
          "note": "Ada atlaması (veri): lav üstünden herhangi bir adanın herhangi bir boş altıgenine, mesafe sınırı yok; hareketin yerine geçer (bu tur yürünmemiş olmalı, tüm hareketi harcar). Hedef adada düşman olabilir (foeIsland: allow; \"reject\" ise reddedilir); dolu hedef altıgen reddedilir. d20 + Athletics, DC = dcBase + dcPerExtraHex × (lav altıgeni − 1), üst sınır yok; uçan zarsız. Doğal 20 güvenli, doğal 1 lava düşer, başarısızsa hedefe iner ama yanar (2d6 ateş + Burning). Burning: tur başında 1d6 ateş, DEX DC 10 ile söner.",
          "foeIsland": "allow"
        }
      ],
      "effects": [
        {
          "type": "lavaGlow",
          "intensity": 0.7
        },
        {
          "type": "sparks",
          "intensity": 0.6
        },
        {
          "type": "heatHaze",
          "intensity": 0.4
        }
      ]
    },
    {
      "id": "uyuyan-ejderha",
      "name": "Uyuyan ejderha",
      "image": "maps/harita-volkan-adalar.webp",
      "rules": [
        {
          "id": "lavaEdge",
          "save": null,
          "damage": "1d6",
          "damageType": "fire",
          "when": "startOfOwnTurn",
          "requires": [
            "adjacentToLava"
          ]
        },
        {
          "id": "eruption",
          "optional": true,
          "trigger": "gm",
          "everyRounds": 3,
          "radius": 1,
          "save": "DEX",
          "dc": 13,
          "damage": "4d6",
          "damageType": "fire",
          "halfOnSave": true
        },
        {
          "id": "lavaRise",
          "optional": true,
          "trigger": "gm",
          "startRound": 4,
          "everyRounds": 2,
          "warnRoundsBefore": 1,
          "effect": "edgeRingOfLandBecomesLava"
        },
        {
          "id": "lavJump",
          "over": [
            "~"
          ],
          "check": {
            "skill": "athletics",
            "dcBase": 10,
            "dcPerExtraHex": 2
          },
          "natural20": "safe",
          "natural1": "fall",
          "onFail": {
            "damage": "2d6",
            "damageType": "fire",
            "condition": "Burning"
          },
          "fall": "deadly",
          "burning": {
            "damage": "1d6",
            "damageType": "fire",
            "save": "DEX",
            "dc": 10
          },
          "note": "Ada atlaması (veri): lav üstünden herhangi bir adanın herhangi bir boş altıgenine, mesafe sınırı yok; hareketin yerine geçer (bu tur yürünmemiş olmalı, tüm hareketi harcar). Hedef adada düşman olabilir (foeIsland: allow; \"reject\" ise reddedilir); dolu hedef altıgen reddedilir. d20 + Athletics, DC = dcBase + dcPerExtraHex × (lav altıgeni − 1), üst sınır yok; uçan zarsız. Doğal 20 güvenli, doğal 1 lava düşer, başarısızsa hedefe iner ama yanar (2d6 ateş + Burning). Burning: tur başında 1d6 ateş, DEX DC 10 ile söner.",
          "foeIsland": "allow"
        },
        {
          "id": "sleepingDragon",
          "dragon": "young-red-dragon",
          "dragons": [
            "young-red-dragon",
            "adult-red-dragon",
            "red-dragon-wyrmling"
          ],
          "at": [
            8,
            3
          ],
          "wake": {
            "onDamage": true,
            "adjacent": true,
            "loudFt": 25,
            "loud": {
              "damageTypes": [
                "thunder"
              ],
              "names": [
                "Thunderwave",
                "Shatter",
                "Thunderclap",
                "Thunder Step"
              ],
              "words": [
                "roar",
                "screech",
                "shriek",
                "howl",
                "thunder"
              ]
            },
            "perceptionFt": 25,
            "perceptionDc": 12
          },
          "dragonWake": "never",
          "chancePct": 25,
          "note": "Ortadaki büyük adanın tepesinde (H, sütun 8 satır 3) uyuyan kırmızı ejderha. Uykuda turunu atlar, hareket etmez, ona yakın dövüş saldırıları avantajlı. Uyanır: herhangi bir hasar; 25 ft içinde gürültülü büyü/yetenek (gök gürültüsü vb.); bitişik altıgene bir yaratık girerse; her tur sonunda 25 ft içindeki gizlenmemiş her karakter için Algı (d20 + Perception ≥ 12). Uyanık düşmanlar yenilince parti kazanır (ejderha uyurken sıvışılır). dragonWake (yalnızca yapay zekâ düşmanları): never / chance (chancePct) / gm."
        }
      ],
      "effects": [
        {
          "type": "lavaGlow",
          "intensity": 0.7
        },
        {
          "type": "sparks",
          "intensity": 0.6
        },
        {
          "type": "heatHaze",
          "intensity": 0.4
        }
      ]
    }
  ],
  "mirrorable": true
} as unknown as RawMap;

type MapsModule = typeof import('../maps');

/**
 * `vi.mock('../map/maps', ...)` için: katalog aynen kalır, yalnızca "eski-volkan" kimliği bu
 * fikstürden yüklenir (varyant seçimi ve aynalama dahil).
 */
export function withEskiVolkan(orig: MapsModule): MapsModule {
  const layout = (variantId?: string) => {
    const v = (ESKI_VOLKAN.variants.find((x) => x.id === variantId) ?? ESKI_VOLKAN.variants[0]) as RawMap['variants'][number];
    return orig.loadMap({ ...ESKI_VOLKAN, variants: [v, ...ESKI_VOLKAN.variants.filter((x) => x !== v)] } as RawMap);
  };
  return {
    ...orig,
    getMap: (id, opts = {}) => {
      if (id !== ESKI_VOLKAN.id) return orig.getMap(id, opts);
      const m = layout(opts.variantId);
      return opts.mirrored ? orig.mirrorMap(m) : m;
    },
    resolveMapChoice: (id, variantId) => (id === ESKI_VOLKAN.id
      ? { id, variantId: layout(variantId).variantId }
      : orig.resolveMapChoice(id, variantId)),
  };
}
