/**
 * Görev P0: ek paket etki ilkelleri ve çağrı yaratığı şeması (tek kaynak). Doğrulayıcı (`ilkelErrors`,
 * `yaratikErrors`), savaş yorumlayıcısı (`src/battle/paket/`) ve belge (`harita/belgeler/PAKET-ILKELLER.md`,
 * `npx vite-node scripts/paket-ilkeller-belge.ts` üretir; test eşitliği denetler) bu tabloyu okur. Paket yalnızca JSON
 * veridir: formüller yalnızca belirteç + zar + sabit (kod/ifade değerlendirilmez). Saf; tembel parçada (`content/`).
 */
import { spells } from '../data';

export const DAMAGE_TYPES = ['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder'] as const;
export const CONDITIONS = ['Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious'] as const;
export const ABILITY_IDS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;
/** Formül belirteçleri: yeterlilik, yarısı (en az 1), karakter seviyesi, iki katı, yetenek değiştiricileri (en az 0), büyü değiştiricisi. */
export const FORMUL_TOKENS = ['$pbYari', '$pb', '$lvl2', '$lvl', '$str', '$dex', '$con', '$int', '$wis', '$cha', '$buyu'] as const;
export const SURFACE_KINDS = ['oil', 'water', 'ice', 'fire', 'burningWeb', 'steam', 'slick', 'poison'] as const;
export const BARRIER_KINDS = ['cizili-duvar', 'dost-kalkani', 'enkaz-yigini'] as const;
export const SIZES = ['T', 'S', 'M', 'L', 'H', 'G'] as const;
/** Ödünç jeton arketipleri → mevcut canavar görseli (`public/monsters/<id>.webp`). Bilinmeyen/eksik: `yaratik` (yedek). */
export const JETON_ARKETIP: Record<string, string> = {
  ejderha: 'red-dragon-wyrmling', element: 'fire-elemental', ruzgar: 'air-elemental', kurt: 'dire-wolf', kopek: 'mastiff', bocek: 'giant-spider',
  golem: 'animated-armor', melek: 'deva', peri: 'sprite', binek: 'draft-horse', kus: 'hawk', zombi: 'zombie', iskelet: 'skeleton',
  hayalet: 'specter', bitki: 'awakened-tree', dokunac: 'roper', seytan: 'imp', kukla: 'homunculus', yaratik: 'wolf',
};
export const JETON_YEDEK = 'yaratik';

/** Tetik: ilkelin ne zaman çalıştığı. */
export const TETIKLER = ['pasif', 'eylem', 'bonus', 'serbest', 'isabet', 'turBasi', 'turSonu', 'savasBasi', 'oldurunce', 'hasarAlinca', 'sifirCan', 'tepki'] as const;
export type Tetik = typeof TETIKLER[number];
/** Düğme üreten tetikler (aynı özellikte aynı tetikli ilkeller tek düğmede, sırayla). */
export const DUGME_TETIKLERI: readonly Tetik[] = ['eylem', 'bonus', 'serbest'];
/** Koşul sözcükleri; `bicim:<id>` ve `isaretli:<id>` önekli. */
export const KOSULLAR = ['ofke', 'yarimCanAlti', 'zirhsiz', 'avantajli', 'dostBitisik', 'konsantrasyon'] as const;
export const HEDEFLER = ['kendi', 'dost', 'dostVeyaKendi', 'dostlar', 'dusman', 'dusmanlar', 'bitisikDusmanlar', 'alan', 'vurulan'] as const;
export type Hedef = typeof HEDEFLER[number];

export type AlanTip = 'tamsayi' | 'sayi' | 'bool' | 'metin' | 'enum' | 'formul' | 'hasarTuru' | 'hasarTurleri' | 'durum' | 'durumlar'
  | 'yetenek' | 'yetenekler' | 'kaynakRef' | 'save' | 'yaratikRef' | 'buyular' | 'kosullar' | 'sure' | 'kimlik' | 'enumListe';
export interface AlanSpec {
  tip: AlanTip;
  zorunlu?: boolean;
  varsayilan?: unknown;
  degerler?: readonly string[];
  /** Belge: kısa açıklama. */
  not: string;
  /** Yorumlayıcı bu alanı yaklaşık uygular (alan kullanılırsa ilkel "kısmi"). */
  kismi?: string;
}
export interface IlkelSpec {
  /** Belge: ne yapar. */
  not: string;
  /** İzin verilen tetikler (ilki varsayılan). */
  tetikler: readonly Tetik[];
  /** İzin verilen hedefler (ilki varsayılan; yoksa hedef alanı yok). */
  hedefler?: readonly Hedef[];
  alanlar: Record<string, AlanSpec>;
  /** Hangi mevcut sistemi kullanır, hangi kancaya bağlanır (belge). */
  sistem: string;
  /** SRD tarzı KURGUSAL örnek (belge; test doğrular). */
  ornek: Record<string, unknown>;
  /** Bu tetik/hedef birleşimleri yaklaşık (belge + kısmi tespiti). */
  kismiTetik?: readonly Tetik[];
}

const F = (not: string, extra: Partial<AlanSpec> = {}): AlanSpec => ({ tip: 'formul', not, ...extra });
const N = (not: string, extra: Partial<AlanSpec> = {}): AlanSpec => ({ tip: 'tamsayi', not, ...extra });
const B = (not: string, varsayilan = false, extra: Partial<AlanSpec> = {}): AlanSpec => ({ tip: 'bool', not, varsayilan, ...extra });
const E = (degerler: readonly string[], not: string, extra: Partial<AlanSpec> = {}): AlanSpec => ({ tip: 'enum', degerler, varsayilan: degerler[0], not, ...extra });
const SURE: AlanSpec = { tip: 'sure', varsayilan: 10, not: 'Süre: tur sayısı (1 tur = 6 sn) ya da "kalici" (savaş boyu).' };
const MENZIL: AlanSpec = N('Hedef menzili (ft).', { varsayilan: 30 });
const YARICAP: AlanSpec = N('Alan/çoklu hedef yarıçapı (ft; `dostlar`, `dusmanlar`, `alan` hedefinde).', { varsayilan: 10 });
const SAVE: AlanSpec = { tip: 'save', not: 'Kurtulma: `{ "yetenek": "wis", "dc": "buyu" | 14 | ["wis","cha"], "yari": false }`. dc: "buyu" büyü DC\'si (yoksa 8 + PB + en iyi INT/WIS/CHA), sayı sabit, liste 8 + PB + listedeki en iyi değiştirici. `yari`: başarıda yarım hasar.' };

/** Bütün ilkellerde ortak alanlar (`tur` dışında hepsi isteğe bağlı). */
export const ORTAK_ALANLAR: Record<string, AlanSpec> = {
  tur: { tip: 'metin', zorunlu: true, not: 'İlkelin adı (aşağıdaki listeden).' },
  id: { tip: 'kimlik', not: 'Bu ilkelin kimliği (özellik içinde benzersiz; `bicim:<id>`, `isaretli:<id>` koşulları ve `kaynak` tanımı buna başvurur).' },
  tetik: { tip: 'enum', degerler: TETIKLER, not: 'Ne zaman çalışır (ilkelin izin verdikleri; yazılmazsa ilki).' },
  hedef: { tip: 'enum', degerler: HEDEFLER, not: 'Kime (ilkelin izin verdikleri; yazılmazsa ilki).' },
  kaynak: { tip: 'kaynakRef', not: 'Harcanan kaynak: `{ "id": "<kaynak ilkeli id ya da sınıf kaynağı (rage, focus, channelDivinity…)>", "maliyet": 1 }`. Düğmede yalnızca ilk kaynaklı ilkel harcar (düğme başına bir kez).' },
  kosul: { tip: 'kosullar', not: 'Hepsi doğruysa çalışır: ofke, yarimCanAlti, zirhsiz, avantajli (isabet), dostBitisik (hedefe bitişik dost), konsantrasyon, bicim:<id>, isaretli:<id> (hedef bu işaretle işaretli).' },
  turdaBir: B('Turda en çok bir kez (her savaşçının kendi turu sayılır).'),
  ad: { tip: 'metin', not: 'Düğme/günlük adı (yoksa özelliğin TR adı).' },
};

export const ILKELLER: Record<string, IlkelSpec> = {
  ekHasar: {
    not: 'Saldırı isabetinde ek hasar zarı.', tetikler: ['isabet'],
    alanlar: {
      zar: F('Ek hasar (`"1d8"`, `"2d6+$wis"`, seviye tablosu `{ "3": "1d6", "11": "2d6" }`); kritikte zarlar iki kat.', { zorunlu: true }),
      hasarTuru: { tip: 'hasarTuru', varsayilan: 'silah', not: 'Hasar türü; "silah" saldırının türü.' },
      saldiri: E(['silah', 'yakin', 'menzilli', 'buyu', 'hepsi'], 'Hangi saldırılar: silah (yakın+menzilli silah), yakin, menzilli, buyu (büyü saldırısı), hepsi.'),
    },
    sistem: 'Saldırı çözümü (`features.ts` `weaponAttackEvents`) → isabet kanca kaydı (`hitHooks.ts`); `ExtraDamage` (direnç/bağışıklık hedefe göre).',
    ornek: { tur: 'ekHasar', zar: { 3: '1d6', 11: '2d6' }, hasarTuru: 'radiant', saldiri: 'silah', turdaBir: true },
  },
  direnc: {
    not: 'Hasar direnci, bağışıklığı ya da zaafı (koşula bağlı olabilir).', tetikler: ['pasif'],
    alanlar: {
      turler: { tip: 'hasarTurleri', zorunlu: true, not: 'Hasar türleri.' },
      tip: E(['direnc', 'bagisiklik', 'zaaf'], 'Direnç (yarı), bağışıklık (sıfır), zaaf (iki kat).'),
    },
    sistem: 'Süren etki `resist` / `immune` / `vulnerable` (`damageProfile`); koşullu olanlar komut sonu eşitlemesiyle eklenir/kalkar.',
    ornek: { tur: 'direnc', turler: ['cold', 'necrotic'], kosul: ['ofke'] },
  },
  aura: {
    not: 'Sahibiyle yürüyen aura (dost ya da düşmanlara etki).', tetikler: ['pasif', 'eylem', 'bonus'],
    alanlar: {
      yaricapFt: N('Yarıçap (ft).', { zorunlu: true }),
      suzgec: E(['dostlar', 'dusmanlar', 'hepsi', 'digerleri'], 'Kimleri etkiler (dostlar sahibini de kapsar; digerleri sahibi hariç herkes).'),
      zaman: E(['pasif', 'turBasi', 'turSonu', 'girince'], 'Etki ne zaman işler (pasif: aura içindeyken sürekli).'),
      etki: E(['kurtulmaBonusu', 'hasar', 'durum', 'durumBagisikligi', 'gecicCan', 'iyilestirmeYok', 'olumKurtulmaAvantaji', 'olumKurtulmaDezavantaji', 'moral'], 'Etki türü.', { zorunlu: true, varsayilan: undefined }),
      miktar: F('kurtulmaBonusu / gecicCan / moral miktarı (en az 1).'),
      zar: F('hasar etkisinin zarı.'),
      hasarTuru: { tip: 'hasarTuru', not: 'hasar etkisinin türü.' },
      durum: { tip: 'durum', not: 'durum etkisinin durumu.' },
      durumlar: { tip: 'durumlar', not: 'durumBagisikligi listesi.' },
      save: SAVE,
      cesaret: N('Kurtulmayı başaran bu auraya N tur bağışık (Cesaret sayacı).'),
      sure: { ...SURE, not: 'Eylem/bonus ile açılan auranın süresi.' },
    },
    sistem: 'K53 aura altyapısı (`auraCore.ts`; süren etkide `auras`, en güçlüsü uygulanır, turda bir). GM anahtarı `auraCore` kapalıysa sessiz etkisiz.',
    ornek: { tur: 'aura', yaricapFt: 10, suzgec: 'dostlar', etki: 'kurtulmaBonusu', miktar: '$cha' },
  },
  tepki: {
    not: 'Tepkiyle çalışan koruma ya da karşılık.', tetikler: ['tepki'],
    alanlar: {
      olay: E(['banaIsabet', 'dostaIsabet', 'hasarAldim'], 'Tetikleyen olay: sana isabet, menzildeki dosta isabet, yakın dövüşte hasar aldın.'),
      etki: E(['acBonusu', 'hasarAzalt', 'yariya', 'direnc', 'karsiVurus'], 'Tepkinin etkisi.', { zorunlu: true, varsayilan: undefined }),
      miktar: F('acBonusu (sayı) ya da hasarAzalt zarı (`"1d10+$wis"`).'),
      saldiri: E(['hepsi', 'yakin', 'menzilli'], 'Yalnız bu saldırılarda.'),
      turler: { tip: 'hasarTurleri', not: 'hasarAzalt yalnız bu türlerde.' },
      menzilFt: N('dostaIsabet: dosta uzaklık (ft).', { varsayilan: 30 }),
    },
    sistem: 'Tepki sistemi (`reactions.ts`): banaIsabet → `ReactionSpec` (parry/reduce/halve/resist), hasarAldim+karsiVurus → retaliate, dostaIsabet+acBonusu → `registerAllyHit`. Karar `askReaction` (oyuncuya sorulur).',
    ornek: { tur: 'tepki', olay: 'dostaIsabet', etki: 'acBonusu', miktar: 2, menzilFt: 30, kaynak: { id: 'kalkan-sozu', maliyet: 1 } },
    kismiTetik: [],
  },
  gecicCan: {
    not: 'Geçici can.', tetikler: ['eylem', 'bonus', 'serbest', 'savasBasi', 'turBasi', 'oldurunce', 'isabet', 'hasarAlinca'],
    hedefler: ['kendi', 'dost', 'dostVeyaKendi', 'dostlar'],
    alanlar: { miktar: F('Geçici can (`"1d8+$lvl"`).', { zorunlu: true }), menzilFt: MENZIL, yaricapFt: YARICAP },
    sistem: '`temp_hp` olayı (fazlası birikmez; yükseği kalır).',
    ornek: { tur: 'gecicCan', tetik: 'oldurunce', miktar: '$lvl' },
  },
  iyilestirme: {
    not: 'İyileştirme (ve isteğe bağlı durum kaldırma).', tetikler: ['eylem', 'bonus', 'serbest', 'turBasi', 'oldurunce', 'isabet'],
    hedefler: ['dostVeyaKendi', 'kendi', 'dost', 'dostlar'],
    alanlar: { miktar: F('İyileşen can.', { zorunlu: true }), durumKaldir: { tip: 'durumlar', not: 'Varsa bu durumlar da kalkar.' }, menzilFt: MENZIL, yaricapFt: YARICAP },
    sistem: '`healed` / `condition_ended` olayları (en çok HP aşılmaz; ölüyü kaldırmaz).',
    ornek: { tur: 'iyilestirme', tetik: 'bonus', hedef: 'dostVeyaKendi', miktar: '2d4+$wis', menzilFt: 30, kaynak: { id: 'sifa', maliyet: 1 } },
  },
  hasar: {
    not: 'Doğrudan hasar (kurtulmalı ya da kurtulmasız).', tetikler: ['eylem', 'bonus', 'serbest', 'turBasi', 'oldurunce'],
    hedefler: ['dusman', 'dusmanlar', 'bitisikDusmanlar', 'alan'],
    alanlar: { zar: F('Hasar.', { zorunlu: true }), hasarTuru: { tip: 'hasarTuru', zorunlu: true, not: 'Hasar türü.' }, save: SAVE, menzilFt: MENZIL, yaricapFt: YARICAP,
      enCok: N('En çok hedef (dusmanlar/alan).') },
    sistem: '`save_resolved` olayı (imza eylemleriyle aynı yol: `resolveSave`, `saveDamage` Evasion, `adjustDamage`, `damageEffects`).',
    ornek: { tur: 'hasar', tetik: 'eylem', hedef: 'alan', menzilFt: 60, yaricapFt: 10, zar: { 3: '2d8', 11: '3d8' }, hasarTuru: 'thunder', save: { yetenek: 'con', dc: 'buyu', yari: true } },
  },
  durumUygula: {
    not: 'Durum uygular (kurtulmalı, süreli, tekrar kurtulmalı).', tetikler: ['eylem', 'bonus', 'isabet', 'oldurunce'],
    hedefler: ['dusman', 'dusmanlar', 'bitisikDusmanlar', 'alan', 'vurulan', 'kendi'],
    alanlar: { durum: { tip: 'durum', zorunlu: true, not: 'SRD durumu.' }, save: SAVE, sure: { ...SURE, varsayilan: 1 },
      tekrarKurtulma: B('Hedef her tur sonunda yeniden kurtulma atar (başarıda biter).'),
      cesaret: N('Kurtulmayı başaran N tur bağışık (K53 Cesaret sayacı).'), menzilFt: MENZIL, yaricapFt: YARICAP, enCok: N('En çok hedef.') },
    sistem: 'Süren etki `grants` + `repeatSave` (`effects.ts`), Cesaret `resistImmunityEvent` (`auraCore.ts`).',
    ornek: { tur: 'durumUygula', tetik: 'isabet', hedef: 'vurulan', durum: 'Frightened', save: { yetenek: 'wis', dc: ['cha'] }, sure: 1, turdaBir: true, cesaret: 10 },
  },
  isaret: {
    not: 'Hedefi işaretler; işaretliye avantaj ve diğer ilkellerin `isaretli:<id>` koşulu.', tetikler: ['bonus', 'eylem', 'isabet'],
    hedefler: ['dusman', 'vurulan'],
    alanlar: { sure: { ...SURE, varsayilan: 10 }, tek: B('Aynı anda tek işaret (yenisi eskisini kaldırır).', true),
      avantaj: E(['yok', 'isaretleyen', 'herkes'], 'İşaretliye saldırı avantajı: yok, yalnız işaretleyen, herkes.'), menzilFt: MENZIL },
    sistem: 'Hedefte süren etki (`attackedAdvBy` işaretleyene, `attackedAdv` herkese; `wardSources`).',
    ornek: { tur: 'isaret', id: 'av', tetik: 'bonus', menzilFt: 60, sure: 10, avantaj: 'isaretleyen' },
  },
  cagir: {
    not: 'Paketin `yaratiklar` tanımından yaratık çağırır.', tetikler: ['eylem', 'bonus', 'savasBasi'],
    alanlar: { yaratik: { tip: 'yaratikRef', zorunlu: true, not: 'Paket `yaratiklar` kimliği.' }, sayi: F('Kaç tane.', { varsayilan: 1 }), sure: SURE,
      konsantrasyon: B('Konsantrasyon (bozulunca kaybolur).', false, { kismi: 'konsantrasyon büyüsüz özellikte süre olarak işler' }),
      inisiyatif: E(['sahip', 'ayri'], 'sahip: sahibinin hemen ardından oynar; ayri: kendi inisiyatifi.'), menzilFt: { ...MENZIL, varsayilan: 30 },
      tekrar: E(['degistir', 'ekle'], 'Yeniden çağırınca: öncekiler kaybolur (degistir) ya da eklenir.'),
      sahipOlunceKaybolur: B('Sahibi ölünce kaybolur.', true), komut: E(['serbest', 'bonus'], 'serbest: kendi turunda kendisi oynar; bonus: sahibi bonus eylemle emretmezse yalnız Kaçın.') },
    sistem: 'R3 çağırma (`summons.ts`): `summoned` olayı (yaratık olayın içinde, replay aynı), `summonCleanup` (0 HP, süre, sahip ölümü).',
    ornek: { tur: 'cagir', tetik: 'eylem', yaratik: 'kul-kurdu', sayi: 2, sure: 10, inisiyatif: 'sahip', kaynak: { id: 'cagri', maliyet: 1 } },
  },
  boyut: {
    not: 'Büyüme (Large/Huge): ek hasar zarı, jeton ölçeği.', tetikler: ['bonus', 'eylem', 'pasif'],
    alanlar: { boyut: E(['L', 'H'], 'Hedef boyut (jeton etiketi; tek altıgen).'), sure: SURE, ekHasar: F('Silah isabetinde ek zar (`"1d4"`).'),
      erisimFt: N('Ek erişim (ft).', { kismi: 'erişim artışı uygulanmaz' }) },
    sistem: 'Süren etki `size` (+1) ve `hitDie` (Enlarge yolu).',
    ornek: { tur: 'boyut', tetik: 'bonus', boyut: 'L', sure: 10, ekHasar: '1d4', kaynak: { id: 'dev-ofkesi', maliyet: 1 } },
  },
  ucus: {
    not: 'Uçuş hızı.', tetikler: ['pasif', 'bonus', 'eylem', 'savasBasi'],
    alanlar: { hizFt: F('Uçuş hızı (ft; "yurume" yürüme hızı kadar).', { varsayilan: 'yurume' }), sure: SURE },
    sistem: 'Süren etki `fly` (`flight.ts` `flySpeed`, `isAirborne`).',
    ornek: { tur: 'ucus', tetik: 'bonus', hizFt: 30, sure: 10 },
  },
  isinlan: {
    not: 'Kendini görülen boş altıgene ışınlar.', tetikler: ['bonus', 'eylem', 'serbest'],
    alanlar: { mesafeFt: N('En çok uzaklık (ft).', { zorunlu: true }), gorus: B('Varış görülmeli.', true) },
    sistem: 'K53 tek ışınlanma girişi (`teleport.ts` `teleportEvent`, `motion.ts` `withArrival`).',
    ornek: { tur: 'isinlan', tetik: 'bonus', mesafeFt: 30, kaynak: { id: 'golge-adimi', maliyet: 1 } },
  },
  zorlaHareket: {
    not: 'İtme/çekme/yana kaydırma (isabette ya da eylemle).', tetikler: ['isabet', 'eylem', 'bonus'], hedefler: ['vurulan', 'dusman'],
    alanlar: { yon: E(['it', 'cek', 'yana'], 'Yön (sahibine göre).'), mesafeFt: N('Uzaklık (ft).', { zorunlu: true }), save: SAVE,
      boyutSiniri: E(['L', 'M', 'H', 'G'], 'Bu boyut ve küçükleri.'), menzilFt: MENZIL },
    sistem: 'K53 tek zorla hareket girişi (`motion.ts` `forcedMove`: çarpma, düşme, zemin tetikleri).',
    ornek: { tur: 'zorlaHareket', tetik: 'isabet', yon: 'it', mesafeFt: 10, boyutSiniri: 'L', turdaBir: true },
  },
  olumdenDon: {
    not: '0 HP\'ye düşecekken ayakta kalır.', tetikler: ['sifirCan'],
    alanlar: { hp: F('Kalan can ("1", "yari" = en çok canın yarısı, ya da formül).', { varsayilan: '1' }) },
    sistem: 'Death Ward yolu (`damage-effects.ts` `deathWard` etkisi; kullanılınca kaynak harcanır, gerekirse `healed`).',
    ornek: { tur: 'olumdenDon', hp: 'yari', kaynak: { id: 'son-nefes', maliyet: 1 } },
  },
  ekSaldiri: {
    not: 'Ek silah saldırısı: kendin (bonus/öldürünce) ya da bir dostun (tepkisiyle).', tetikler: ['bonus', 'oldurunce', 'eylem'],
    hedefler: ['dusman', 'dost'],
    alanlar: { menzilFt: { ...MENZIL, varsayilan: 60 } },
    sistem: 'Kayıtlı saldırı yolu (`reactions.ts` `strikeApi`); dost: dostun tepkisi harcanır (`reactionUsed`), en zayıf düşmana.',
    ornek: { tur: 'ekSaldiri', tetik: 'bonus', hedef: 'dusman', kaynak: { id: 'ofke-hamlesi', maliyet: 1 } },
  },
  zarEtkisi: {
    not: 'Zar ve savunma eklentileri: AC, kurtulma, avantaj/dezavantaj, bonus zar, inisiyatif.', tetikler: ['pasif', 'bonus', 'eylem', 'isabet', 'savasBasi'],
    hedefler: ['kendi', 'dost', 'dostVeyaKendi', 'dostlar', 'dusman', 'vurulan'],
    alanlar: {
      acBonusu: F('AC eklentisi.'), kurtulmaBonusu: F('Kurtulma eklentisi.'), kurtulmalar: { tip: 'yetenekler', not: 'kurtulmaBonusu/avantaj hangi yeteneklerde (yoksa hepsi).' },
      avantaj: { tip: 'enumListe', degerler: ['saldiri', 'kurtulma', 'kontrol'], not: 'Avantaj (kurtulma/kontrol `kurtulmalar` yetenekleriyle).' },
      dezavantaj: { tip: 'enumListe', degerler: ['saldiri', 'kurtulma'], not: 'Hedefe dezavantaj (saldırıları / kurtulmaları).' },
      zar: F('Bonus zar (`"1d4"`; Bless gibi), `zarYonu` ile çıkarılabilir.'), zarYonu: E(['arti', 'eksi'], 'Bonus zarın yönü.'),
      zarIcin: { tip: 'enumListe', degerler: ['saldiri', 'kurtulma', 'kontrol'], varsayilan: ['saldiri', 'kurtulma'], not: 'Bonus zar hangi d20 testlerine.' },
      inisiyatifBonusu: F('İnisiyatif eklentisi (yalnız pasif).'),
      d20AltSinir: N('d20 alt sınırı.', { kismi: 'uygulanmaz' }),
      sure: SURE, menzilFt: MENZIL, yaricapFt: YARICAP,
    },
    sistem: 'Süren etki alanları `ac`, `saveMod`, `saveAdv`, `attackAdv`, `checkAdv`, `attackDis`, `saveDis`, `dice` (`effectDice.ts`); inisiyatif `initiativeBonus`.',
    ornek: { tur: 'zarEtkisi', tetik: 'pasif', kurtulmaBonusu: '$cha', kurtulmalar: ['wis'], kosul: ['yarimCanAlti'] },
  },
  kaynak: {
    not: 'Kullanım havuzu tanımı (diğer ilkeller `kaynak.id` ile harcar).', tetikler: ['pasif'],
    alanlar: { id: { tip: 'kimlik', zorunlu: true, not: 'Kaynak kimliği (alt sınıf içinde).' },
      sayi: { tip: 'formul', zorunlu: true, not: 'Kullanım: sayı, "$pb", "$str"…"$cha" (en az 1) ya da seviye tablosu `{ "3": 2, "11": 3 }`.' },
      yenilenme: E(['uzun', 'kisa', 'tur'], 'Yenilenme: uzun dinlenme, kısa (ve uzun) dinlenme, her tur başı.') },
    sistem: 'Sınıf kaynakları (`data/class-features.json` `resources` biçimi; `classResources`, `rechargeResources`, savaş sonu karaktere yazılır).',
    ornek: { tur: 'kaynak', id: 'cagri', sayi: '$pb', yenilenme: 'uzun' },
  },
  bicim: {
    not: 'Süreli biçim (dönüşüm): geçici can, AC, hız, direnç, ek hasar, uçuş, avantaj.', tetikler: ['bonus', 'eylem'],
    alanlar: { id: { tip: 'kimlik', zorunlu: true, not: 'Biçim kimliği (`bicim:<id>` koşulu).' }, sure: SURE, gecicCan: F('Girişte geçici can.'), acBonusu: F('AC eklentisi.'),
      hizFt: F('Hız eklentisi (ft).'), ucusFt: F('Uçuş hızı (ft).'), direncler: { tip: 'hasarTurleri', not: 'Direnç türleri.' },
      ekHasar: F('Silah isabetinde ek zar.'), hasarTuru: { tip: 'hasarTuru', not: 'ekHasar türü (yoksa silahın).' }, saldiriAvantaji: B('Saldırılar avantajlı.') },
    sistem: 'Wild Shape/Karadul biçim yolu yerine tek süren etki (`tempHpNow`, `ac`, `speedFt`, `fly`, `resist`, `hitDie`, `attackAdv`); jeton değişmez.',
    ornek: { tur: 'bicim', id: 'gece', tetik: 'bonus', sure: 10, gecicCan: '$lvl', acBonusu: 1, direncler: ['necrotic'], ekHasar: '1d6', hasarTuru: 'necrotic', kaynak: { id: 'gece-bicimi', maliyet: 1 } },
  },
  yuzeyOlustur: {
    not: 'Altıgenlere yüzey (yağ, buz, alev…) ya da geçici engel koyar.', tetikler: ['eylem', 'bonus'],
    alanlar: { yuzey: { tip: 'enum', zorunlu: true, degerler: [...SURFACE_KINDS, ...BARRIER_KINDS.map((k) => `engel:${k}`)], not: 'Yüzey türü (`data/yuzeyler.json`) ya da `engel:<tür>` (`data/engeller.json`).' },
      yaricapFt: N('Yarıçap (ft; 0 tek altıgen).', { varsayilan: 5 }), menzilFt: { ...MENZIL, varsayilan: 30 }, sure: { ...SURE, varsayilan: undefined, not: 'Engel süresi (yoksa verideki).', kismi: 'yüzeyde süre verideki' } },
    sistem: 'Yüzey olayı (`surfaces.ts` `surfaceEvent`; K55 çözücüsü komut sonunda tepkimeleri işler) ya da K53 geçici engel (`barriers.ts` `barrierEvents`).',
    ornek: { tur: 'yuzeyOlustur', tetik: 'eylem', yuzey: 'ice', yaricapFt: 5, menzilFt: 30 },
  },
  buyuVer: {
    not: 'Her an hazır büyüler; isteğe bağlı kaynakla slotsuz.', tetikler: ['pasif'],
    alanlar: { buyular: { tip: 'buyular', zorunlu: true, not: 'Büyü adları (SRD adı, `data/spells*.json`).' }, bedava: { tip: 'kaynakRef', not: 'Bu kaynak kaldıkça slotsuz (`{ "id": "<kaynak>" }`).' } },
    sistem: 'Sınıf kiti `alwaysPrepared` ve kaynak `freeSpellList` (Favored Enemy yolu).',
    ornek: { tur: 'buyuVer', buyular: ['Misty Step', 'Shield'], bedava: { id: 'sis-adimi' } },
  },
  buyuDegisimi: {
    not: 'Büyü hasarına eklenti (türe/okula göre).', tetikler: ['pasif'],
    alanlar: { hasarEki: F('Büyü hasarına eklenti (bir kez).'), hasarTurleri: { tip: 'hasarTurleri', not: 'Yalnız bu türlerde.' },
      okul: { tip: 'metin', not: 'Yalnız bu okul (Evocation…).' },
      kurtulmaDezavantaji: B('Hedefler kurtulmada dezavantajlı.', false, { kismi: 'uygulanmaz' }), menzilEkiFt: N('Menzil eki.', { kismi: 'uygulanmaz' }),
      yeniTur: { tip: 'hasarTuru', not: 'Hasar türünü değiştir.', kismi: 'uygulanmaz' } },
    sistem: 'Büyü hasar ifadesi (`spells.ts` `damageExpr`; Empowered Evocation / Elemental Affinity yolu).',
    ornek: { tur: 'buyuDegisimi', hasarEki: '$buyu', hasarTurleri: ['fire', 'cold'] },
  },
  gorunmezlik: {
    not: 'Invisible durumu (saldırınca/büyü yapınca biter).', tetikler: ['bonus', 'eylem', 'oldurunce', 'hasarAlinca'], hedefler: ['kendi', 'dost'],
    alanlar: { sure: { ...SURE, varsayilan: 1 }, saldirincaBiter: B('Saldırı/büyüyle biter.', true), menzilFt: MENZIL },
    sistem: 'Süren etki `grants: ["Invisible"]` + `breakOnAct` (Invisibility yolu).',
    ornek: { tur: 'gorunmezlik', tetik: 'hasarAlinca', sure: 1, turdaBir: true, kaynak: { id: 'sis-perde', maliyet: 1 } },
  },
  moralEtkisi: {
    not: 'Moral havuzuna ekleme/çıkarma (K48; Moral kapalıyken sessiz yok sayılır).', tetikler: ['bonus', 'eylem', 'turBasi', 'oldurunce', 'isabet'],
    hedefler: ['kendi', 'dost', 'dostVeyaKendi', 'dostlar', 'dusman', 'vurulan'],
    alanlar: { miktar: F('Moral değişimi (eksi olabilir).', { zorunlu: true }), menzilFt: MENZIL, yaricapFt: YARICAP },
    sistem: '`moral_changed` olayı (`morale.ts` `moraleOn`).',
    ornek: { tur: 'moralEtkisi', tetik: 'oldurunce', hedef: 'dostlar', yaricapFt: 30, miktar: 1 },
  },
  hiz: {
    not: 'Hız artışı (pasif ya da süreli).', tetikler: ['pasif', 'bonus', 'eylem', 'savasBasi'],
    alanlar: { artiFt: F('Hıza eklenen (ft).', { zorunlu: true }), sure: SURE },
    sistem: 'Süren etki `speedFt`.',
    ornek: { tur: 'hiz', artiFt: 10, kosul: ['zirhsiz'] },
  },
};
export const ILKEL_ADLARI = Object.keys(ILKELLER);

// ------------------------------------------------------------------ çağrı yaratığı

export const YARATIK_ALANLARI: Record<string, AlanSpec> = {
  id: { tip: 'kimlik', zorunlu: true, not: 'Paket içinde benzersiz kimlik (`cagir.yaratik`).' },
  ad: { tip: 'metin', zorunlu: true, not: '`{ "tr": "...", "en": "..." }`.' },
  boyut: { tip: 'enum', degerler: SIZES, varsayilan: 'M', not: 'Boyut (T, S, M, L, H, G).' },
  tur: { tip: 'metin', varsayilan: 'beast', not: 'Yaratık türü (beast, fey, undead, construct, elemental, celestial, fiend, dragon, plant, aberration…).' },
  ac: F('Zırh sınıfı (sayı ya da formül: `"13+$pb"`).', { zorunlu: true }),
  hp: F('Can (sayı, formül `"5+$lvl2"` ya da seviye tablosu `{ "3": 20, "11": 45 }`; çarpma yok).', { zorunlu: true }),
  hiz: { tip: 'save', not: '`{ "yurume": 30, "ucma": 0, "yuzme": 0, "tirmanma": 0 }` (ft).' },
  yetenekler: { tip: 'save', zorunlu: true, not: '`{ "str": 12, "dex": 14, "con": 12, "int": 6, "wis": 12, "cha": 6 }`.' },
  saldirilar: { tip: 'save', not: 'Saldırılar (aşağıda).' },
  cokluSaldiri: N('Saldırı eylemiyle kaç saldırı (Multiattack; 1 yok).', { varsayilan: 1 }),
  direncler: { tip: 'hasarTurleri', not: 'Direnç.' }, bagisikliklar: { tip: 'hasarTurleri', not: 'Bağışıklık.' },
  durumBagisikliklari: { tip: 'durumlar', not: 'Durum bağışıklıkları.' },
  karanlikGorus: N('Karanlık görüş (ft).'),
  ozellikler: { tip: 'enumListe', degerler: ['tirmanici', 'surudeTaktik'], not: 'Motorun bildiği özellikler: tirmanici (Spider Climb), surudeTaktik (Pack Tactics).' },
  eylemler: { tip: 'enumListe', degerler: ['saldiri', 'kacin', 'yardim'], varsayilan: ['saldiri', 'kacin', 'yardim'], not: 'Eylem seçenekleri; `saldiri` yoksa saldıramaz (familiar gibi).' },
  jeton: { tip: 'save', not: 'Jeton: `{ "gorsel": "<canavar kimliği ya da arketip>", "ton": 0–359 (renk tonu kaydırma, derece), "halka": "#rrggbb" }`.' },
};
export const SALDIRI_ALANLARI: Record<string, AlanSpec> = {
  ad: { tip: 'metin', zorunlu: true, not: 'Saldırı adı (TR).' },
  tur: E(['yakin', 'menzilli'], 'Yakın dövüş ya da menzilli.'),
  bonus: { tip: 'formul', varsayilan: 'sahip', not: 'İsabet bonusu: sayı, formül ya da "sahip" (sahibinin büyü saldırı bonusu).' },
  hasar: F('Hasar (`"1d8+$pb"`).', { zorunlu: true }),
  hasarTuru: { tip: 'hasarTuru', zorunlu: true, not: 'Hasar türü.' },
  erisimFt: N('Erişim (ft).', { varsayilan: 5 }),
  menzil: { tip: 'save', not: '`[normal, uzun]` (ft; menzilli).' },
  save: SAVE,
  ek: { tip: 'save', not: 'Saldırı eki (`data/attack-riders.json` biçimi: `prone`, `grapple`, `conditions`, `extra`…).' },
};

// ------------------------------------------------------------------ doğrulama

export interface IlkelHata { path: string; kod: 'ilkelTur' | 'ilkelAlan' | 'ilkelDeger' | 'ilkelEksik' | 'yaratikRef' | 'kaynakRef'; alan: string }
const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

/** Formül sözdizimi: belirteçler, tek zar terimi, sabitler, + / −. Seviye tablosu nesnesi de olur. */
export function formulOk(v: unknown): boolean {
  if (typeof v === 'number') return Number.isFinite(v);
  if (isObj(v)) return Object.keys(v).length > 0 && Object.entries(v).every(([l, x]) => /^\d+$/.test(l) && Number(l) >= 1 && Number(l) <= 20 && formulOk(x));
  if (typeof v !== 'string' || v.length > 60) return false;
  let s = v.replace(/\s+/g, '');
  for (const t of FORMUL_TOKENS) s = s.split(t).join('1');
  if (/\$/.test(s)) return false;
  if (!/^[+-]?(\d+(d\d+)?)([+-]\d+(d\d+)?)*$/.test(s)) return false;
  return (s.match(/d/g) ?? []).length <= 1;
}

/** Kaynak kullanım sayısı: tamsayı, "$pb", "$str"…"$cha" ya da seviye → tamsayı tablosu. */
export function kaynakSayiOk(v: unknown): boolean {
  if (Number.isInteger(v)) return (v as number) >= 1 && (v as number) <= 50;
  if (typeof v === 'string') return v === '$pb' || ABILITY_IDS.some((a) => v === `$${a}`);
  return isObj(v) && Object.keys(v).length > 0 && Object.entries(v).every(([l, x]) => /^\d+$/.test(l) && Number(l) <= 20 && Number.isInteger(x) && (x as number) >= 0 && (x as number) <= 50);
}
/** Paket kaynağının sınıf kaynakları tablosundaki anahtarı (alt sınıf kimliğiyle; çakışmaz). */
export const paketKaynakId = (subId: string, id: string): string => `pk-${subId}-${id}`;

interface Ctx { kaynaklar: Set<string>; sinifKaynaklari: Set<string>; yaratiklar: Set<string>; ilkelIdleri: Set<string> }

function alanHatasi(spec: AlanSpec, v: unknown, ctx: Ctx): boolean {
  switch (spec.tip) {
    case 'tamsayi': return !Number.isInteger(v) || (v as number) < 0 || (v as number) > 1000;
    case 'sayi': return typeof v !== 'number' || !Number.isFinite(v);
    case 'bool': return typeof v !== 'boolean';
    case 'metin': return typeof v !== 'string' || v.length > 200;
    case 'kimlik': return typeof v !== 'string' || !/^[a-z0-9][a-z0-9-]{0,47}$/.test(v);
    case 'enum': return typeof v !== 'string' || !spec.degerler?.includes(v);
    case 'enumListe': return !Array.isArray(v) || v.length === 0 || v.some((x) => typeof x !== 'string' || !spec.degerler?.includes(x));
    case 'formul': return !(formulOk(v) || (v === 'yurume' || v === 'yari'));
    case 'hasarTuru': return typeof v !== 'string' || !(DAMAGE_TYPES as readonly string[]).includes(v) && v !== 'silah';
    case 'hasarTurleri': return !Array.isArray(v) || v.length === 0 || v.some((x) => !(DAMAGE_TYPES as readonly string[]).includes(x as string));
    case 'durum': return typeof v !== 'string' || !(CONDITIONS as readonly string[]).includes(v);
    case 'durumlar': return !Array.isArray(v) || v.length === 0 || v.some((x) => !(CONDITIONS as readonly string[]).includes(x as string));
    case 'yetenek': return typeof v !== 'string' || !(ABILITY_IDS as readonly string[]).includes(v);
    case 'yetenekler': return !Array.isArray(v) || v.length === 0 || v.some((x) => !(ABILITY_IDS as readonly string[]).includes(x as string));
    case 'sure': return !(v === 'kalici' || (Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 100));
    case 'yaratikRef': return typeof v !== 'string' || !ctx.yaratiklar.has(v);
    case 'buyular': return !Array.isArray(v) || v.length === 0 || v.some((n) => typeof n !== 'string' || !spells.some((s) => s.name === n));
    case 'kosullar': return !Array.isArray(v) || v.some((x) => typeof x !== 'string' || !((KOSULLAR as readonly string[]).includes(x)
      || (/^bicim:[a-z0-9-]+$/.test(x) && ctx.ilkelIdleri.has(x.slice(6))) || /^isaretli:[a-z0-9-]+$/.test(x)));
    case 'kaynakRef': return !isObj(v) || typeof v.id !== 'string' || !(ctx.kaynaklar.has(v.id) || ctx.sinifKaynaklari.has(v.id))
      || (v.maliyet !== undefined && (!Number.isInteger(v.maliyet) || (v.maliyet as number) < 0)) || Object.keys(v).some((k) => k !== 'id' && k !== 'maliyet');
    case 'save': return !isObj(v) || !(ABILITY_IDS as readonly string[]).includes(v.yetenek as string)
      || !(v.dc === undefined || v.dc === 'buyu' || (Number.isInteger(v.dc) && (v.dc as number) >= 1 && (v.dc as number) <= 30)
        || (Array.isArray(v.dc) && v.dc.length > 0 && v.dc.every((a) => (ABILITY_IDS as readonly string[]).includes(a as string))))
      || (v.yari !== undefined && typeof v.yari !== 'boolean') || Object.keys(v).some((k) => !['yetenek', 'dc', 'yari'].includes(k));
  }
}

/**
 * Bir özelliğin ilkel listesinin hataları (yalnız kimlik ve alan adı; metin yok). `kaynaklar`: alt sınıfın `kaynak`
 * ilkel kimlikleri; `yaratiklar`: paketin yaratık kimlikleri; sınıf kaynakları `sinifKaynaklari`.
 */
export function ilkelErrors(list: unknown, path: string, ctx: { kaynaklar: Set<string>; sinifKaynaklari: Set<string>; yaratiklar: Set<string> }): IlkelHata[] {
  const out: IlkelHata[] = [];
  if (!Array.isArray(list) || list.length === 0 || list.length > 12) return [{ path, kod: 'ilkelDeger', alan: 'ilkeller' }];
  const ilkelIdleri = new Set(list.filter(isObj).map((x) => x.id).filter((x): x is string => typeof x === 'string'));
  const c: Ctx = { ...ctx, ilkelIdleri };
  list.forEach((raw, i) => {
    const p = `${path}[${i}]`;
    if (!isObj(raw)) { out.push({ path: p, kod: 'ilkelDeger', alan: 'ilkel' }); return; }
    const spec = typeof raw.tur === 'string' ? ILKELLER[raw.tur] : undefined;
    if (!spec) { out.push({ path: `${p}.tur`, kod: 'ilkelTur', alan: String(raw.tur) }); return; }
    for (const [k, v] of Object.entries(raw)) {
      if (k === 'tur') continue;
      const a = spec.alanlar[k] ?? ORTAK_ALANLAR[k];
      if (!a || (k === 'hedef' && !spec.hedefler)) { out.push({ path: `${p}.${k}`, kod: 'ilkelAlan', alan: k }); continue; }
      if (k === 'tetik') { if (!spec.tetikler.includes(v as Tetik)) out.push({ path: `${p}.${k}`, kod: 'ilkelDeger', alan: k }); continue; }
      if (k === 'hedef') { if (!spec.hedefler?.includes(v as Hedef)) out.push({ path: `${p}.${k}`, kod: 'ilkelDeger', alan: k }); continue; }
      if (alanHatasi(a, v, c)) out.push({ path: `${p}.${k}`, kod: a.tip === 'yaratikRef' ? 'yaratikRef' : a.tip === 'kaynakRef' ? 'kaynakRef' : 'ilkelDeger', alan: k });
    }
    for (const [k, a] of Object.entries(spec.alanlar)) if (a.zorunlu && raw[k] === undefined) out.push({ path: `${p}.${k}`, kod: 'ilkelEksik', alan: k });
    // Etkiye göre gerekenler.
    if (raw.tur === 'aura') {
      const need: Record<string, string> = { kurtulmaBonusu: 'miktar', gecicCan: 'miktar', moral: 'miktar', hasar: 'zar', durum: 'durum', durumBagisikligi: 'durumlar' };
      const f = need[raw.etki as string];
      if (f && raw[f] === undefined) out.push({ path: `${p}.${f}`, kod: 'ilkelEksik', alan: f });
      if (raw.etki === 'hasar' && raw.hasarTuru === undefined) out.push({ path: `${p}.hasarTuru`, kod: 'ilkelEksik', alan: 'hasarTuru' });
    }
    if (raw.tur === 'tepki' && (raw.etki === 'acBonusu' || raw.etki === 'hasarAzalt') && raw.miktar === undefined) out.push({ path: `${p}.miktar`, kod: 'ilkelEksik', alan: 'miktar' });
    if (raw.tur === 'kaynak' && raw.sayi !== undefined && !kaynakSayiOk(raw.sayi)) out.push({ path: `${p}.sayi`, kod: 'ilkelDeger', alan: 'sayi' });
    if (raw.tur === 'durumUygula' && raw.durum === 'Invisible') out.push({ path: `${p}.durum`, kod: 'ilkelDeger', alan: 'durum' });
  });
  return out;
}

/** İlkelin yorumlayıcıda kısmi kalan alanları (check:icerik uyarısı; boşsa tam). */
export function ilkelKismi(raw: Record<string, unknown>): string[] {
  const spec = ILKELLER[raw.tur as string];
  if (!spec) return ['tur'];
  const out = Object.keys(raw).filter((k) => spec.alanlar[k]?.kismi);
  if (raw.tur === 'tepki' && raw.olay === 'dostaIsabet' && raw.etki !== 'acBonusu') out.push('etki');
  if (raw.tur === 'tepki' && raw.olay === 'hasarAldim' && raw.etki !== 'karsiVurus') out.push('etki');
  if (raw.tur === 'tepki' && raw.olay !== 'hasarAldim' && raw.etki === 'karsiVurus') out.push('olay');
  return out;
}

/** Yaratık tanımının hataları; `uyarilar`: eksik jeton (yedek arketiple dolar). */
export function yaratikErrors(raw: unknown, path: string, monsterIds?: Set<string>): { hatalar: IlkelHata[]; uyarilar: IlkelHata[] } {
  const hatalar: IlkelHata[] = [];
  const uyarilar: IlkelHata[] = [];
  const bad = (alan: string, kod: IlkelHata['kod'] = 'ilkelDeger') => hatalar.push({ path: `${path}.${alan}`, kod, alan });
  if (!isObj(raw)) return { hatalar: [{ path, kod: 'ilkelDeger', alan: 'yaratik' }], uyarilar };
  const c: Ctx = { kaynaklar: new Set(), sinifKaynaklari: new Set(), yaratiklar: new Set(), ilkelIdleri: new Set() };
  for (const [k, v] of Object.entries(raw)) {
    const a = YARATIK_ALANLARI[k];
    if (!a) { bad(k, 'ilkelAlan'); continue; }
    if (k === 'ad') { if (!isObj(v) || typeof v.tr !== 'string' || typeof v.en !== 'string' || !v.tr.trim() || v.tr.length > 60 || v.en.length > 60) bad(k); continue; }
    if (k === 'hiz') { if (!isObj(v) || Object.entries(v).some(([h, x]) => !['yurume', 'ucma', 'yuzme', 'tirmanma'].includes(h) || !Number.isInteger(x) || (x as number) < 0 || (x as number) > 200)) bad(k); continue; }
    if (k === 'yetenekler') { if (!isObj(v) || ABILITY_IDS.some((ab) => !Number.isInteger(v[ab]) || (v[ab] as number) < 1 || (v[ab] as number) > 30) || Object.keys(v).length !== 6) bad(k); continue; }
    if (k === 'jeton') {
      if (!isObj(v) || Object.keys(v).some((x) => !['gorsel', 'ton', 'halka'].includes(x))
        || (v.ton !== undefined && (!Number.isInteger(v.ton) || (v.ton as number) < 0 || (v.ton as number) > 359))
        || (v.halka !== undefined && (typeof v.halka !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(v.halka)))
        || (v.gorsel !== undefined && (typeof v.gorsel !== 'string' || !/^[a-z0-9-]{1,48}$/.test(v.gorsel)))) { bad(k); continue; }
      const g = v.gorsel as string | undefined;
      if (!g || (!JETON_ARKETIP[g] && monsterIds && !monsterIds.has(g))) uyarilar.push({ path: `${path}.jeton.gorsel`, kod: 'ilkelDeger', alan: 'jeton.gorsel' });
      continue;
    }
    if (k === 'saldirilar') {
      if (!Array.isArray(v) || v.length > 6) { bad(k); continue; }
      v.forEach((s, i) => {
        const sp = `${path}.saldirilar[${i}]`;
        if (!isObj(s)) { hatalar.push({ path: sp, kod: 'ilkelDeger', alan: 'saldiri' }); return; }
        for (const [sk, sv] of Object.entries(s)) {
          const sa = SALDIRI_ALANLARI[sk];
          if (!sa) { hatalar.push({ path: `${sp}.${sk}`, kod: 'ilkelAlan', alan: sk }); continue; }
          if (sk === 'menzil') { if (!Array.isArray(sv) || sv.length !== 2 || sv.some((x) => !Number.isInteger(x) || x < 5)) hatalar.push({ path: `${sp}.${sk}`, kod: 'ilkelDeger', alan: sk }); continue; }
          if (sk === 'ek') { if (!isObj(sv)) hatalar.push({ path: `${sp}.${sk}`, kod: 'ilkelDeger', alan: sk }); continue; }
          if (sk === 'bonus' && sv === 'sahip') continue;
          if (alanHatasi(sa, sv, c)) hatalar.push({ path: `${sp}.${sk}`, kod: 'ilkelDeger', alan: sk });
        }
        for (const [sk, sa] of Object.entries(SALDIRI_ALANLARI)) if (sa.zorunlu && s[sk] === undefined) hatalar.push({ path: `${sp}.${sk}`, kod: 'ilkelEksik', alan: sk });
      });
      continue;
    }
    if (alanHatasi(a, v, c)) bad(k);
  }
  for (const [k, a] of Object.entries(YARATIK_ALANLARI)) if (a.zorunlu && raw[k] === undefined) hatalar.push({ path: `${path}.${k}`, kod: 'ilkelEksik', alan: k });
  if (raw.jeton === undefined) uyarilar.push({ path: `${path}.jeton.gorsel`, kod: 'ilkelDeger', alan: 'jeton.gorsel' });
  return { hatalar, uyarilar };
}
