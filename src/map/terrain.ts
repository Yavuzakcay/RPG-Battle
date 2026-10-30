/**
 * Zemin türü kataloğu: bütün haritalar aynı harfleri paylaşır. Yeni harita yalnızca
 * bu harfleri kullanan veri ekler; yeni bir zemin türü gerekirse buraya bir satır eklenir.
 */
/** normal: 1 adım, zorlu: 2 adım, engel: girilemez, ölümcül: girene ölüm (lav). */
export type Movement = 'normal' | 'difficult' | 'blocked' | 'deadly';

/** Siperin AC'ye katkısı: yok 0, yarım +2, 3/4 +5 (5e kuralı). */
export type Cover = 0 | 2 | 5;

/** Altıgen yüksekliği: 0 zemin, 1 yükseltili (sur, plato), 2 zirve/kule üstü. */
export type TerrainHeight = 0 | 1 | 2;

/** Harita kural motorunun (Adım 8) bu zemine bağlayacağı kural kimlikleri. */
export type TerrainRule = 'ice' | 'bog' | 'deepWater' | 'trap';

export interface TerrainType {
  char: string;
  name: string;
  height: TerrainHeight;
  movement: Movement;
  cover: Cover;
  /** Kendisi ve bitişik altıgenler gölgedir (çöl sıcağı). */
  shade?: boolean;
  /** Girince veya turu orada bitirince alınan hasar (alev). */
  hazard?: { damage: string; damageType: string };
  /** Oyun alanı dışı. */
  outOfBounds?: boolean;
  /** Durulabilir olsa da başlangıç yeri sayılmaz (3/4 siperli kaya kümesi). */
  noStart?: boolean;
  /** Engel olsa da uçan yaratık üstünden geçer (uçurum, yarık). */
  flyersPass?: boolean;
  /** Görüş hattını keser (duvar, ağaç). */
  blocksSight?: boolean;
  /** Bir seviye çıkmanın hareket maliyeti (`climb` kuralı, Adım 8). */
  climbCost?: number;
  /** Işık kaynağı (`darkness` kuralı, Adım 8). */
  light?: { radiusHexes: number };
  /** Algı ile fark edilene kadar görünmez (tuzak). */
  hidden?: boolean;
  /**
   * Basamak (merdiven): yüksekliği var ama tırmanma yok, normal maliyet; basamaktan basamağa
   * itme düşme sayılmaz (yuvarlanma: `stairShove`), yukarı basamağa itilebilir.
   */
  stairs?: boolean;
  /** Bu zemine bağlı harita kuralı; davranışı Adım 8'de eklenecek. */
  rule?: TerrainRule;
}

const TYPES: TerrainType[] = [
  { char: '.', name: 'Açık zemin', height: 0, movement: 'normal', cover: 0 },
  { char: 'd', name: 'Kum tepesi', height: 0, movement: 'normal', cover: 2 },
  { char: 'r', name: 'Kaya kümesi', height: 0, movement: 'difficult', cover: 5, shade: true, noStart: true },
  { char: 'c', name: 'Ayakta sütun', height: 0, movement: 'blocked', cover: 5, shade: true },
  { char: 'k', name: 'Yıkık sütun', height: 0, movement: 'difficult', cover: 2, shade: true },
  { char: 't', name: 'Taşlık', height: 0, movement: 'difficult', cover: 0 },
  { char: 'H', name: 'Yüksek bazalt', height: 1, movement: 'normal', cover: 0 },
  { char: '~', name: 'Lav', height: 0, movement: 'deadly', cover: 0 },
  { char: 'f', name: 'Alev', height: 0, movement: 'normal', cover: 0, hazard: { damage: '1d6', damageType: 'fire' } },
  { char: '#', name: 'Dış kayalık', height: 0, movement: 'blocked', cover: 0, outOfBounds: true },
  // Yeni haritalar için ek harfler (docs/harita/terrain-ek.json).
  { char: 's', name: 'Duvar', height: 0, movement: 'blocked', cover: 0, blocksSight: true },
  { char: 'h', name: 'Yükseltili zemin', height: 1, movement: 'normal', cover: 0, climbCost: 2 },
  { char: 'z', name: 'Zirve, kule üstü', height: 2, movement: 'normal', cover: 0, climbCost: 2 },
  { char: 'u', name: 'Uçurum, yarık', height: 0, movement: 'blocked', cover: 0, flyersPass: true },
  { char: 'i', name: 'Buz', height: 0, movement: 'normal', cover: 0, rule: 'ice' },
  { char: 'q', name: 'Kar', height: 0, movement: 'difficult', cover: 0 },
  { char: 'a', name: 'Ağaç', height: 0, movement: 'blocked', cover: 5, blocksSight: true },
  { char: 'g', name: 'Çalılık, sazlık', height: 0, movement: 'difficult', cover: 2 },
  { char: 'v', name: 'Sarkıt, dikit', height: 0, movement: 'blocked', cover: 5 },
  { char: 'e', name: 'Işıklı kristal', height: 0, movement: 'blocked', cover: 5, light: { radiusHexes: 4 } },
  { char: 'n', name: 'Sığ su, çamur', height: 0, movement: 'difficult', cover: 0 },
  { char: 'b', name: 'Derin batak', height: 0, movement: 'normal', cover: 0, rule: 'bog' },
  { char: 'w', name: 'Derin su', height: 0, movement: 'difficult', cover: 0, rule: 'deepWater' },
  { char: 'p', name: 'Tahta zemin, kaldırım, köprü', height: 0, movement: 'normal', cover: 0 },
  { char: 'm', name: 'Direk, sütun, çeşme', height: 0, movement: 'blocked', cover: 5 },
  { char: 'x', name: 'Varil, sandık, masa', height: 0, movement: 'difficult', cover: 2 },
  { char: 'o', name: 'Kapı, geçit', height: 0, movement: 'normal', cover: 0 },
  // Kapanınca kapının yerini alır (`gate` kuralı); haritada başlangıçta kullanılmaz.
  { char: 'O', name: 'Kapalı kapı', height: 0, movement: 'blocked', cover: 0, blocksSight: true },
  // Dungeon merdiveni (GOREV-DUNGEON-MERDIVEN-HAZINE): basamaklar, tırmanma yok.
  { char: 'l', name: 'Alçak basamak', height: 1, movement: 'normal', cover: 0, stairs: true },
  { char: 'y', name: 'Yüksek basamak, sahanlık', height: 2, movement: 'normal', cover: 0, stairs: true },
  { char: 'j', name: 'Gizli tuzak', height: 0, movement: 'normal', cover: 0, rule: 'trap', hidden: true },
];

export const TERRAIN: Readonly<Record<string, TerrainType>> = Object.fromEntries(TYPES.map((t) => [t.char, t]));

/**
 * Görev H1/H2: zemin harfinin düz rengi (mini harita ve görselsiz geniş haritaların üretilen arka planı,
 * `npm run harita-gorsel`). Görsel; kurala dokunmaz.
 */
export const TERRAIN_COLOR: Readonly<Record<string, string>> = {
  '.': '#7d8a5a', d: '#c2a76a', r: '#6d6a62', c: '#8b8578', k: '#7a7468', t: '#8a8270', H: '#4a4440', '~': '#d2521f', f: '#e07a24',
  '#': '#1b1c20', s: '#4b4a50', h: '#9a9478', z: '#b0aa90', u: '#151515', i: '#b9dbe8', q: '#e6eef0', a: '#2f5a2c', g: '#557a3a',
  v: '#5b5650', e: '#7fe0e8', n: '#6b6a4a', b: '#3f4a2c', w: '#2b5d8a', p: '#a48a62', m: '#7b7268', x: '#8a6a44', o: '#b08a52',
  O: '#5a3e24', l: '#9a907a', y: '#b4a88e', j: '#7d8a5a',
};

export function terrainOf(char: string): TerrainType {
  const t = TERRAIN[char];
  if (!t) throw new Error(`Bilinmeyen zemin harfi: "${char}"`);
  return t;
}

/** Yürüyerek durulabilir mi (engel ve lav değil). */
export const isStandable = (t: TerrainType): boolean => t.movement !== 'blocked' && t.movement !== 'deadly';

/** Başlangıç için uygun mu: durulabilir, tehlikesiz (alev değil) ve kaya kümesi değil. */
export const isSafeStart = (t: TerrainType): boolean => isStandable(t) && !t.hazard && !t.noStart;

/**
 * Yürüyen bir yaratık için girme maliyeti (altıgen): normal 1, zorlu 2. Engel ve lav
 * null (girilemez; lava gönüllü girmek reddedilir). Uçan yaratık zorlu zeminden ve
 * lavdan etkilenmez; engelden etkilenir, yalnızca uçurumun (`flyersPass`) üstünden geçer.
 */
export function enterCost(t: TerrainType, flying = false): number | null {
  if (t.movement === 'blocked') return flying && t.flyersPass ? 1 : null;
  if (flying) return 1;
  if (t.movement === 'deadly') return null;
  return t.movement === 'difficult' ? 2 : 1;
}
