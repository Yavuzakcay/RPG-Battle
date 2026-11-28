/**
 * Görev KATALOG-GUC-TAM (kural sürümü 109): katalog güçlerinin veri şeması (`data/katalog-gucler.json`) ve süren etki alanları
 * (`ActiveEffect.k109`). Yaprak modül (yalnız türler).
 */
import type { AuraSpec } from './auraCore';
import type { Ability } from '../rules/abilities';

/** Süren etkinin 109 alanları (savaşçının `effects` listesinde; reducer olduğu gibi taşır). */
export interface K109Fx {
  /** Cosmic Madness: tur başında d6 ≤ N ise ilk saldırısını en yakın dostuna yapar (eylem harcanır). */
  madAlly?: number;
  /** Sahibinin verdiği hasar dirençleri yok sayar (`types` yoksa hepsi); `immuneToResist`: bağışıklık dirence iner, `ignoreImmune`: bağışıklık da yok sayılır. */
  pierceResist?: { types?: string[]; immuneToResist?: boolean; ignoreImmune?: boolean };
  /** Zorla hareket (itme/çekme/fırlatma) işlemez (`smallerOnly`: yalnız kendinden küçük kaynağın). */
  forcedImmune?: boolean;
  /** Yakın dövüşle isabet eden saldırana hasar. */
  meleeRetaliate?: { dice: string; type: string };
  /** Aldığı iyileşme bu katsayıyla (aşağı yuvarlanır). */
  healMult?: number;
  /** Star Mark: görünmez olamaz (Invisible düşer), konsantrasyon save'ine bonus zarı yok. */
  starMark?: boolean;
  /** Seal-Melting Talon: 0 HP'de ölüm save'i atmaz ve iyileşemez (etki süresince). */
  sealed?: boolean;
  /** Spell-Reflecting Crystal Shell: hedef alan büyüde save'i geçerse büyü atıcısına seker. */
  reflectSpell?: boolean;
  /** Out-of-Time Storm: turda bir kez kendisine gelen saldırı ya da büyüyü tepkisiz iptal eder. */
  negateOnce?: boolean;
  /** Continent Scale: gövde altıgenleri dosta sığınak (yarım siper), düşmana zorlu arazi. */
  scale?: boolean;
  /** Armor's Betrayal: bu yaratığa saldırısı dezavantajlı, bu yaratığın ona saldırısı avantajlı. */
  betrayedBy?: string;
  /** Dirençler bu etki süresince yok (Delta Yetişkin nefesi). */
  noResist?: boolean;
  /** Hunter Soul Bond: bağlı yaratığın (Avcı) aldığı hasarın yarısını bu yaratık üstlenir (60 ft içinde). */
  soulBondOf?: string;
  /** Soul Bond'un Avcı tarafı: konsantrasyon save'leri avantajlı. */
  concAdv?: boolean;
}

/** Canavar saldırısı eki (A2 biçimi; `ekler`). */
export type K109Rider = Record<string, unknown>;

/** Yeteneğe (canavar-yetenekleri) ek alanlar: yetenek kimliğine göre birleştirilir. */
export interface K109AbilityPatch {
  /** Etki alanındaki altıgenler yüzey olur (`data/yuzeyler.json` kimliği) ya da kalıcı alan. */
  surface?: { kind: string; rounds?: number };
  zone?: { rounds: number; spec: Record<string, unknown> };
  /** Alanı silindir (yerde daire; yükseklik `heightFt`). */
  cylinder?: { radiusFt: number; heightFt: number };
  /** Önce bu yeteneği/çekmeyi uygula, sonra kendisini (Kongark Yıldız Çöküşü: çek sonra vur). */
  pre?: { kind: 'pull'; rangeFt: number; pullFt: number; save?: { ability: Ability; dc: number } };
  /** Alandaki büyülü karanlığı kaldırır. */
  dispelDark?: boolean;
}

/** Efsanevi eyleme ek alanlar ya da yeni eylemler. */
export interface K109LegendaryPatch {
  id: string;
  /** Mevcut eylemin üstüne yazılan alanlar. */
  patch?: Record<string, unknown>;
  /** Yeni eylem (yoksa `patch`). */
  add?: Record<string, unknown>;
}

/** Faz 2 eklemeleri (yalnız 109+). */
export interface K109Faz {
  auralar?: AuraSpec[];
  /** Haritadaki bu zemin harflerine (su/kıyı) zorlu arazi alanı. */
  zorluZemin?: { su?: boolean; harfler?: string[]; maliyet: number };
  /** Bossun çevresine yüzey (yarıçap ft, tur). */
  yuzey?: { kind: string; radiusFt: number; rounds: number };
  /** Çağrılan canavarlar (kimlik → sayı). */
  cagir?: Record<string, number>;
  /** Saldırı tekrarı değişimi (Multiattack: ad → sayı). */
  tekrar?: Record<string, number>;
  /** Yapay zekâ saldırı önceliği (önce denenecek saldırı adları). */
  oncelik?: string[];
  /** Tur başı bossun çevresindekilere hasar. */
  turBasiHasar?: { radiusFt: number; dice: string; type: string };
  /** Faz etkisine eklenen süren etki alanları (`hitDie`, `k109`…). */
  etki?: Record<string, unknown>;
}

export interface K109Monster {
  auralar?: AuraSpec[];
  ekler?: Record<string, K109Rider>;
  /** Savaş başında sahibine süren etki (`k109` alanları ve diğer ActiveEffect alanları). */
  pasif?: Record<string, unknown> & { k109?: K109Fx };
  /** Yetenek kimliğine göre yetenek alanlarına yama (`canavar-yetenekleri.json` kaydının üstüne) ve yeni yetenekler. */
  yetenekler?: Record<string, K109AbilityPatch & Record<string, unknown>>;
  yetenekEkle?: Array<Record<string, unknown>>;
  /**
   * Alan bırakma: saldırı adı (ya da yetenek kimliği/adı) → alanın altıgenlerine yüzey ya da kalıcı alan; `tasi`: saldıran alanın
   * ucundaki boş altıgene süzülür (fırsat saldırısız; Celestial Glide); `karanlikSil`: alandaki büyülü karanlık biter.
   */
  alanBirak?: Record<string, { yuzey?: { kind: string; rounds: number }; alanlar?: Array<{ name: string; rounds: number; spec: Record<string, unknown> }>; tasi?: boolean; karanlikSil?: boolean }>;
  efsanevi?: K109LegendaryPatch[];
  faz2?: K109Faz;
  /** Legendary Resistance kullanınca bir olumsuz etkiyi siler. */
  lrCleanse?: boolean;
  /** Save'li saldırının başarısız (ve yarı) hasarına ikinci zar (saldırı adı → parçalar). */
  saveEk?: Record<string, Array<{ dice: string; type: string }>>;
  /** Saldırı hedef sayısı (tek hedefli save saldırısı N hedefe). */
  hedefSayisi?: Record<string, number>;
  /** Özel güçler (katalog109Ozel.ts). */
  ozel?: Record<string, unknown>;
}
