/**
 * Görev P0: ek paket etki ilkelleri ve çağrı yaratığı şeması (tek kaynak). Doğrulayıcı (`ilkelErrors`,
 * `yaratikErrors`), savaş yorumlayıcısı (`src/battle/paket/`) ve belge (`harita/belgeler/PAKET-ILKELLER.md`,
 * `npx vite-node scripts/paket-ilkeller-belge.ts` üretir; test eşitliği denetler) bu tabloyu okur. Paket yalnızca JSON
 * veridir: formüller yalnızca belirteç + zar + sabit (kod/ifade değerlendirilmez). Saf; tembel parçada (`content/`).
 */
import { spells } from '../data';
import bolgeler from '../../harita/_ortak/harita-bolgeleri.json';

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
export const TETIKLER = ['pasif', 'eylem', 'bonus', 'serbest', 'isabet', 'turBasi', 'turSonu', 'savasBasi', 'oldurunce', 'hasarAlinca', 'sifirCan', 'tepki', /** P7: slotlu büyü yapınca. */ 'buyuYuvasi'] as const;
export type Tetik = typeof TETIKLER[number];
/** Düğme üreten tetikler (aynı özellikte aynı tetikli ilkeller tek düğmede, sırayla). */
export const DUGME_TETIKLERI: readonly Tetik[] = ['eylem', 'bonus', 'serbest'];
/** Koşul sözcükleri; `bicim:<id>` ve `isaretli:<id>` önekli. */
export const KOSULLAR = ['ofke', 'yarimCanAlti', 'zirhsiz', 'avantajli', 'dostBitisik', 'konsantrasyon', /** P6. */ 'buyuTurunda', 'seviyeliBuyuTurunda', /** P7: hedef sahibinden büyük. */ 'hedefBuyuk'] as const;
/** P6: `harita:<bölge>` koşulunun bölgeleri (`harita/_ortak/harita-bolgeleri.json`). */
export const HARITA_TEMALARI: readonly string[] = ((bolgeler as { bolgeler?: Array<{ id: string }> }).bolgeler ?? []).map((b) => b.id);
export const HEDEFLER = ['kendi', 'dost', 'dostVeyaKendi', 'dostlar', 'dusman', 'dusmanlar', 'bitisikDusmanlar', 'alan', 'vurulan'] as const;
export type Hedef = typeof HEDEFLER[number];

export type AlanTip = 'tamsayi' | 'sayi' | 'bool' | 'metin' | 'enum' | 'formul' | 'hasarTuru' | 'hasarTurleri' | 'durum' | 'durumlar'
  | 'yetenek' | 'yetenekler' | 'kaynakRef' | 'save' | 'yaratikRef' | 'buyular' | 'kosullar' | 'sure' | 'kimlik' | 'enumListe' | 'yaratikRefler';
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
  kosul: { tip: 'kosullar', not: 'Hepsi doğruysa çalışır: ofke, yarimCanAlti, zirhsiz, avantajli (isabet), dostBitisik (hedefe bitişik dost), konsantrasyon, buyuTurunda (bu tur büyü yaptın), seviyeliBuyuTurunda (bu tur slotlu büyü), hedefBuyuk (hedef senden büyük), bicim:<id>, isaretli:<id> (hedef bu işaretle işaretli), harita:<bölge> (savaş haritasının bölgesi).' },
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
      etki: E(['kurtulmaBonusu', 'hasar', 'durum', 'durumBagisikligi', 'gecicCan', 'iyilestirmeYok', 'olumKurtulmaAvantaji', 'olumKurtulmaDezavantaji', 'moral', /** P7 */ 'direnc', 'kurtulmaDezavantaji'], 'Etki türü (P7: direnc = auradakilere `turler` direnci; kurtulmaDezavantaji = auradakilerin kurtulmaları dezavantajlı; ikisi de pasif).', { zorunlu: true, varsayilan: undefined }),
      turler: { tip: 'hasarTurleri', not: 'direnc etkisinin türleri (P7).' },
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
      olay: E(['banaIsabet', 'dostaIsabet', 'hasarAldim', 'zarTesti', /** P7 */ 'dostaVuruldu'], 'Tetikleyen olay: sana isabet, menzildeki dosta isabet, yakın dövüşte hasar aldın, menzildeki bir yaratığın d20 testi (yalnız zorlaSonuc), menzildeki dosta saldırı isabet edip hasar verdi (P7; saldırgana karşılık).'),
      etki: E(['acBonusu', 'hasarAzalt', 'yariya', 'direnc', 'karsiVurus', 'iskalat', 'yonlendir', 'kritikIptal', 'zorlaSonuc', /** P7 */ 'saldiriYap', 'yansit'], 'Tepkinin etkisi: AC, hasar azaltma, yarıya, direnç (yarıya), karşı vuruş, ıskalatma, başka hedefe saptırma, kritiği normal vuruşa çevirme, d20 testini başarı/başarısızlık sayma; P7: saldiriYap (saldırgana silah saldırısı, erişimdeyse), yansit (alınan hasarın `oran` katı saldırgana; kurtulma verilirse yarıya).', { zorunlu: true, varsayilan: undefined }),
      oran: { tip: 'sayi', varsayilan: 1, not: 'yansit: hasarın oranı (0,5 = yarısı; P7).' },
      save: SAVE,
      miktar: F('acBonusu (sayı) ya da hasarAzalt zarı (`"1d10+$wis"`).'),
      saldiri: E(['hepsi', 'yakin', 'menzilli'], 'Yalnız bu saldırılarda.'),
      turler: { tip: 'hasarTurleri', not: 'hasarAzalt/direnc yalnız bu türlerde.' },
      menzilFt: N('dostaIsabet / zarTesti: yaratığa uzaklık; yonlendir: yeni hedefin asıl hedefe uzaklığı (ft).', { varsayilan: 30 }),
      sonuc: E(['basari', 'basarisiz'], 'zorlaSonuc: test başarı (dost/kendi) ya da başarısızlık (düşman) sayılır.'),
      kim: E(['dost', 'kendi', 'dusman'], 'zorlaSonuc: kimin testi (dost kendini de kapsar).'),
      testler: { tip: 'enumListe', degerler: ['saldiri', 'kurtulma', 'kontrol'], varsayilan: ['saldiri', 'kurtulma', 'kontrol'], not: 'zorlaSonuc: hangi d20 testleri.' },
    },
    sistem: 'Tepki sistemi (`reactions.ts`): banaIsabet → `ReactionSpec` (parry/reduce/halve/resist), hasarAldim+karsiVurus → retaliate; dostaIsabet etkileri ve iskalat/yonlendir/kritikIptal isabet tepki kancasında (`registerAllyHit`, hasar değiştirebilir); zorlaSonuc ikinci şans girişinde (`effectDice.ts` `secondChances`, `ExtraDie.reroll` success/forceFail). Karar `askReaction` (oyuncuya sorulur).',
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
    not: 'Paketin `yaratiklar` tanımından yaratık çağırır.', tetikler: ['eylem', 'bonus', 'savasBasi', /** P7 */ 'sifirCan', 'oldurunce'],
    alanlar: { yaratik: { tip: 'yaratikRef', zorunlu: true, not: 'Paket `yaratiklar` kimliği.' }, sayi: F('Kaç tane.', { varsayilan: 1 }), sure: SURE,
      konsantrasyon: B('Konsantrasyon: çağıran konsantre olur (`concentration_started`; başka konsantrasyon ya da bozulma yaratığı kaldırır).'),
      mod: E(['normal', 'olenden'], 'olenden: bu savaşta ölen yaratıkların karesinde diriltir (ceset başına bir kez).'),
      taraf: E(['hepsi', 'dusman', 'dost'], 'olenden: hangi tarafın ölüleri.'),
      boyutSiniri: E(['L', 'T', 'S', 'M', 'H', 'G'], 'olenden: bu boyut ve küçükleri (varsayılan L).'),
      inisiyatif: E(['sahip', 'ayri'], 'sahip: sahibinin hemen ardından oynar; ayri: kendi inisiyatifi.'), menzilFt: { ...MENZIL, varsayilan: 30 },
      tekrar: E(['degistir', 'ekle'], 'Yeniden çağırınca: öncekiler kaybolur (degistir) ya da eklenir.'),
      rastgele: { tip: 'yaratikRefler', not: 'P7: her çağırmada bu listeden zarla bir yaratık (`yaratik` yerine; eşit olasılık).' },
      sahipOlunceKaybolur: B('Sahibi ölünce kaybolur.', true), komut: E(['serbest', 'bonus'], 'serbest: kendi turunda kendisi oynar; bonus: sahibi bonus eylemle emretmezse yalnız Kaçın.') },
    sistem: 'R3 çağırma (`summons.ts`): `summoned` olayı (yaratık olayın içinde, replay aynı), `summonCleanup` (0 HP, süre, sahip ölümü).',
    ornek: { tur: 'cagir', tetik: 'eylem', yaratik: 'kul-kurdu', sayi: 2, sure: 10, inisiyatif: 'sahip', kaynak: { id: 'cagri', maliyet: 1 } },
  },
  boyut: {
    not: 'Büyüme (Large/Huge): ek hasar zarı, jeton ölçeği.', tetikler: ['bonus', 'eylem', 'pasif'],
    alanlar: { boyut: E(['L', 'H'], 'Hedef boyut (jeton etiketi; tek altıgen).'), sure: SURE, ekHasar: F('Silah isabetinde ek zar (`"1d4"`).'),
      erisimFt: N('Yakın dövüş erişimine eklenen (ft; saldırı ve fırsat saldırısı).') },
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
      sonrasi: E(['yok', 'yereSer'], 'P7: itmeden sonra (kurtulmayı geçemediyse) Prone.'),
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
    not: 'Ek silah saldırısı: kendin (bonus/öldürünce) ya da bir dostun (tepkisiyle); pasifte Saldırı eylemindeki saldırı sayısı.', tetikler: ['bonus', 'oldurunce', 'eylem', 'pasif'],
    hedefler: ['dusman', 'dost'],
    alanlar: { menzilFt: { ...MENZIL, varsayilan: 60 }, saldiriSayisi: N('Pasif: Saldırı eylemindeki saldırı sayısı (en az; ör. 2 = ikinci saldırı).') },
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
      d20AltSinir: N('d20 alt sınırı: doğal zar bundan küçükse bu sayılır (başarıya çevirecekse uygulanır).'),
      d20Icin: { tip: 'enumListe', degerler: ['saldiri', 'kurtulma', 'kontrol'], varsayilan: ['saldiri', 'kurtulma', 'kontrol'], not: 'd20AltSinir hangi testlerde.' },
      kritikAralik: N('Saldırıda doğal zar bu değer ve üstüyse kritik (ör. 19).'),
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
    not: 'Altıgenlere yüzey (yağ, buz, alev…) ya da geçici engel koyar.', tetikler: ['eylem', 'bonus', /** P7: merkez öldürülen/vurulan ya da kendi altıgeni */ 'oldurunce', 'isabet', 'buyuYuvasi', 'turBasi'],
    alanlar: { yuzey: { tip: 'enum', zorunlu: true, degerler: [...SURFACE_KINDS, ...BARRIER_KINDS.map((k) => `engel:${k}`), 'alan'], not: 'Yüzey türü (`data/yuzeyler.json`), `engel:<tür>` (`data/engeller.json`) ya da `alan` (yalnız zemin etkisi).' },
      yaricapFt: N('Yarıçap (ft; 0 tek altıgen).', { varsayilan: 5 }), menzilFt: { ...MENZIL, varsayilan: 30 }, sure: { ...SURE, varsayilan: undefined, not: 'Süre (yoksa verideki).' },
      zaman: { tip: 'enumListe', degerler: ['turBasi', 'turSonu', 'girince'], not: 'Zemin etkisi ne zaman işler (yuzey "alan" ya da yüzeye ek).' },
      hasar: F('Zemin hasarı.'), hasarTuru: { tip: 'hasarTuru', not: 'Zemin hasarının türü.' }, save: SAVE, durum: { tip: 'durum', not: 'Başarısız kurtulmada durum.' },
      zorluArazi: B('Zorlu arazi (hız düşürme: altıgen başına 2 hareket).'), hedefler: E(['hepsi', 'dusmanlar', 'dostlar'], 'Kimleri etkiler (P7: dostlar).'), iyilestir: F('P7: zaman tetiğinde alandaki (hedefler) yaratıkları iyileştirir (hasar yerine).') },
    sistem: 'Yüzey olayı (`surfaces.ts` `surfaceEvent`; K55 çözücüsü komut sonunda tepkimeleri işler), K53 geçici engel (`barriers.ts` `barrierEvents`) ya da satır içi kurallı alan (`SpellZone.spec`: tur başı/sonu/giriş tetikleri, kurtulma, hasar, durum, zorlu arazi; `zones.ts`).',
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
      kurtulmaDezavantaji: B('Büyülerine ve alan etkilerine karşı kurtulmalar dezavantajlı.'), menzilEkiFt: N('Menzilli (5 ft üstü) büyülerin menziline eklenen.'),
      yeniTur: { tip: 'hasarTuru', not: 'Hasar türünü değiştir (`hasarTurleri` verilirse yalnız onlardan).' } },
    sistem: 'Büyü hasar ifadesi (`spells.ts` `damageExpr`; Empowered Evocation / Elemental Affinity yolu), yapım öncesi büyü dönüşümü (menzil, tür; Eldritch Spear/Transmuted yolu), kurtulma kipi (`durations.ts` `saveMode`).',
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
  zarMuhru: {
    not: 'Savaş başında N adet d20 atılıp saklanır; bir d20 testinin doğal zarı saklı zarla değiştirilir (sonucu çevirecekse).', tetikler: ['pasif'],
    alanlar: { sayi: F('Saklanan zar sayısı (kaynak verilirse kalan kullanım kadar, en çok bu).', { zorunlu: true }),
      kim: { tip: 'enumListe', degerler: ['kendi', 'dost', 'dusman'], varsayilan: ['kendi', 'dost', 'dusman'], not: 'Kimin testinde: kendi, dost (başarısızı başarıya), düşman (başarılıyı başarısıza).' },
      menzilFt: { ...MENZIL, varsayilan: 60 } },
    sistem: 'Savaş başında saklı zarlar sahibinde süren etki (`pkMuhur`, her zar ayrı etki); ikinci şans girişi (`effectDice.ts` `secondChances`, `ExtraDie.reroll` set/setSpoil); menzil reducer türetimi (`syncAuras` → `pkSans`). Harcanan zarın etkisi biter, kaynak düşer.',
    ornek: { tur: 'zarMuhru', sayi: 2, kim: ['kendi', 'dost', 'dusman'], kaynak: { id: 'kehanet', maliyet: 1 } },
  },
  engeldenGec: {
    not: 'Duvar, engel ve yaratıkların içinden geçer; fırsat saldırısı tetiklemez.', tetikler: ['bonus', 'eylem', 'pasif'],
    alanlar: { sure: { ...SURE, varsayilan: 1 }, firsatYok: B('Fırsat saldırısı tetiklemez.', true), zorluArazi: B('Engel içi zorlu arazi.', true) },
    sistem: 'Engelden geçme (`phase.ts`: süren etki `phase`) ve `noProvoke`.',
    ornek: { tur: 'engeldenGec', tetik: 'bonus', sure: 1, kaynak: { id: 'golge-adimi', maliyet: 1 } },
  },
  hiz: {
    not: 'Hız artışı (pasif ya da süreli).', tetikler: ['pasif', 'bonus', 'eylem', 'savasBasi'],
    alanlar: { artiFt: F('Hıza eklenen (ft).', { zorunlu: true }), sure: SURE },
    sistem: 'Süren etki `speedFt`.',
    ornek: { tur: 'hiz', artiFt: 10, kosul: ['zirhsiz'] },
  },
  // ---------------------------------------------------------------- P7: ilkel genişletme 2
  buyuluVurus: {
    not: 'Saldırılar büyülü sayılır: büyüsüz saldırıya direnç/bağışıklık (`buyusuzDirencler`) aşılır.', tetikler: ['pasif'],
    alanlar: { kapsam: { tip: 'enumListe', degerler: ['kendi', 'cagrilanlar'], varsayilan: ['kendi'], not: 'kendi saldırıları; cagrilanlar: çağırdığı yaratıkların saldırıları.' } },
    sistem: 'Süren etki `pkMagic`; hasar profili (`magicStrike.ts` `nonmagicalProfile`: silah ve canavar saldırısı). SRD 5.2.1 canavarlarında büyüsüz direnç yok; paket yaratıkları `buyusuzDirencler` ile tanımlar.',
    ornek: { tur: 'buyuluVurus', kapsam: ['kendi', 'cagrilanlar'] },
  },
  zarDegistir: {
    not: 'İsabette hasar zarlarını değiştirir: en yükseğe çek, düşükleri yeniden at, ikiye katla ya da büyüt.', tetikler: ['isabet'],
    alanlar: { mod: E(['maks', 'yenidenAt', 'carpan', 'zarBuyut'], 'maks: zarlar en yüksek; yenidenAt: `esik` ve altı bir kez yeniden; carpan: zarlar bir kez daha eklenir; zarBuyut: her zar bir boy büyük (d6→d8).', { zorunlu: true, varsayilan: undefined }),
      esik: N('yenidenAt: bu değer ve altındaki zarlar (varsayılan 2).', { varsayilan: 2 }),
      saldiri: E(['silah', 'yakin', 'menzilli', 'buyu', 'hepsi'], 'Hangi saldırılar.'), hasarTurleri: { tip: 'hasarTurleri', not: 'Yalnız bu hasar türlerinde.' } },
    sistem: 'İsabet kancası (`hitHooks.ts`; bağlam artık saldırının zarlarını taşır): fark ek hasar olarak (`ExtraDamage`, direnç hedefe göre). Kurtulmalı büyü hasarı kapsam dışı (kısmi).',
    ornek: { tur: 'zarDegistir', mod: 'maks', hasarTurleri: ['lightning', 'thunder'], kaynak: { id: 'focus', maliyet: 1 } },
  },
  koruma: {
    not: 'Pasif koruma: kritik vuruş bağışıklığı, konsantrasyon kurtulmasında avantaj, durumlara karşı kurtulma avantajı.', tetikler: ['pasif', 'bonus', 'eylem'],
    alanlar: { kritikBagisikligi: B('Kritik vuruş normal vuruş sayılır.'), konsantrasyonAvantaji: B('Konsantrasyon kurtulması avantajlı.'),
      durumAvantaji: { tip: 'durumlar', not: 'Bu durumlara karşı kurtulmalar avantajlı.' }, buyulereAvantaj: B('Büyülere karşı kurtulmalar avantajlı.'), sure: SURE },
    sistem: 'Süren etki `noCrit` (`rules/attack.ts`), `concAdv` (`damage-effects.ts` konsantrasyon), `saveAdvAgainst` (`effectDice.ts`).',
    ornek: { tur: 'koruma', kritikBagisikligi: true, konsantrasyonAvantaji: true },
  },
  algi: {
    not: 'Algı: karanlık görüş, gerçek görüş (Truesight), görünmezi görme.', tetikler: ['pasif', 'bonus', 'eylem'],
    alanlar: { karanlikGorusFt: N('Karanlık görüş (ft; büyüğü geçerli).'), gercekGorusFt: N('Gerçek görüş (ft; görünmez ve büyülü karanlık).'), gorunmezGor: B('Görünmezi görür.'), sure: SURE },
    sistem: 'Süren etki `darkvision` (`darkvisionOf`), `pkTruesight` (`sight.ts` `senseSees`), `seeInvisible`.',
    ornek: { tur: 'algi', karanlikGorusFt: 120, gercekGorusFt: 30 },
  },
  cagirGuclendir: {
    not: 'Sahibin çağırdığı her yaratık (büyü ya da paket) geçici can, AC ve isabette ek zar kazanır.', tetikler: ['pasif'],
    alanlar: { gecicCan: F('Çağrılınca geçici can.'), acBonusu: F('AC eklentisi.'), ekHasar: F('İsabette ek zar (silah ve canavar saldırısı).'), buyuluVurus: B('Saldırıları büyülü.') },
    sistem: 'Komut sonu: bu komutta çağrılan (`summoned` olayı) ve sahibi bu ilkeli taşıyan yaratığa süren etki (`ac`, `hitDie`, `pkMagic`) ve `temp_hp`.',
    ornek: { tur: 'cagirGuclendir', gecicCan: '$lvl', acBonusu: 2, ekHasar: '1d6' },
  },
  ortakCan: {
    not: 'Dostları ortak can havuzuna bağlar (hasar havuzdan düşer).', tetikler: ['eylem', 'bonus'], hedefler: ['dostlar'],
    alanlar: { yaricapFt: { ...YARICAP, varsayilan: 30 }, enCok: N('En çok üye (sahip dahil).', { varsayilan: 4 }) },
    sistem: 'Ortak can havuzu (`hpPool.ts`, `hp_pool_created`; A1).',
    ornek: { tur: 'ortakCan', tetik: 'eylem', yaricapFt: 30, enCok: 3, kaynak: { id: 'cagri', maliyet: 1 } },
  },
  yuvaGeriKazan: {
    not: 'Bir büyü yuvası geri kazanılır (en çok `enCokSeviye`; büyücünün en yüksek uygun seviyesinde).', tetikler: ['bonus', 'eylem', 'oldurunce', 'turBasi', 'buyuYuvasi'],
    alanlar: { enCokSeviye: N('Yuva seviyesi sınırı.', { varsayilan: 3 }) },
    sistem: '`slot_created` olayı (Flexible Casting yolu). Hangi yuvanın harcandığı bilinmez: uygun en yüksek seviye (kısmi değil, sınır veride).',
    ornek: { tur: 'yuvaGeriKazan', tetik: 'bonus', enCokSeviye: 2, kaynak: { id: 'kehanet', maliyet: 1 } },
  },
  meydanOkuma: {
    not: 'Hedef senden başkasına saldırırken dezavantajlı.', tetikler: ['bonus', 'eylem', 'isabet'], hedefler: ['dusman', 'vurulan'],
    alanlar: { sure: { ...SURE, varsayilan: 1 }, menzilFt: MENZIL, save: SAVE },
    sistem: 'Hedefte süren etki `tauntBy` (`divine.ts` `wardSources`).',
    ornek: { tur: 'meydanOkuma', tetik: 'isabet', hedef: 'vurulan', sure: 1, save: { yetenek: 'wis', dc: 'buyu' } },
  },
  saldirmadanSave: {
    not: 'Sana saldırmak isteyen önce kurtulma atar; başarısızsa başka hedef seçer ya da saldırı boşa gider.', tetikler: ['pasif', 'bonus', 'eylem'],
    alanlar: { save: { ...SAVE, zorunlu: true }, sure: SURE },
    sistem: 'Sanctuary yolu (süren etki `sanctuary`, olay `sanctuary_save`).',
    ornek: { tur: 'saldirmadanSave', save: { yetenek: 'wis', dc: 'buyu' } },
  },
  kaynakYenile: {
    not: 'Bir kaynaktan kullanım geri kazanılır.', tetikler: ['savasBasi', 'turBasi', 'oldurunce', 'isabet', 'bonus'],
    alanlar: { yenile: { tip: 'kaynakRef', zorunlu: true, not: 'Geri kazanılan kaynak `{ "id": "<kaynak>", "maliyet": <miktar> }` (maliyet = kazanılan, varsayılan 1).' },
      enCok: F('Üst sınır (yoksa savaş başındaki değer).') },
    sistem: '`feature_used` olayı (kalan artar); üst sınır savaşçıdaki `paket.kaynakBas`.',
    ornek: { tur: 'kaynakYenile', tetik: 'savasBasi', yenile: { id: 'focus', maliyet: 1 } },
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
  buyusuzDirencler: { tip: 'hasarTurleri', not: 'P7: büyüsüz saldırılara direnç (büyülü vuruş aşar).' },
  canavar: { tip: 'metin', not: 'P7: SRD canavar kimliği (`data/monsters.json`); verilirse stat bloğu oradan (ac/hp/yetenekler/saldırılar gerekmez).' },
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
    case 'yaratikRefler': return !Array.isArray(v) || v.length === 0 || v.length > 12 || v.some((x) => typeof x !== 'string' || !ctx.yaratiklar.has(x));
    case 'buyular': return !Array.isArray(v) || v.length === 0 || v.some((n) => typeof n !== 'string' || !spells.some((s) => s.name === n));
    case 'kosullar': return !Array.isArray(v) || v.some((x) => typeof x !== 'string' || !((KOSULLAR as readonly string[]).includes(x)
      || (/^bicim:[a-z0-9-]+$/.test(x) && ctx.ilkelIdleri.has(x.slice(6))) || /^isaretli:[a-z0-9-]+$/.test(x) || (x.startsWith('harita:') && HARITA_TEMALARI.includes(x.slice(7)))));
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
      const need: Record<string, string> = { kurtulmaBonusu: 'miktar', gecicCan: 'miktar', moral: 'miktar', hasar: 'zar', durum: 'durum', durumBagisikligi: 'durumlar', direnc: 'turler' };
      const f = need[raw.etki as string];
      if (f && raw[f] === undefined) out.push({ path: `${p}.${f}`, kod: 'ilkelEksik', alan: f });
      if (raw.etki === 'hasar' && raw.hasarTuru === undefined) out.push({ path: `${p}.hasarTuru`, kod: 'ilkelEksik', alan: 'hasarTuru' });
    }
    if (raw.tur === 'tepki' && (raw.etki === 'acBonusu' || raw.etki === 'hasarAzalt') && raw.miktar === undefined) out.push({ path: `${p}.miktar`, kod: 'ilkelEksik', alan: 'miktar' });
    if (raw.tur === 'kaynak' && raw.sayi !== undefined && !kaynakSayiOk(raw.sayi)) out.push({ path: `${p}.sayi`, kod: 'ilkelDeger', alan: 'sayi' });
    // P6: etki/tetik birlikteliği.
    const bad = (alan: string) => out.push({ path: `${p}.${alan}`, kod: 'ilkelDeger', alan });
    if (raw.tur === 'tepki' && (raw.olay === 'zarTesti') !== (raw.etki === 'zorlaSonuc')) bad(raw.olay === 'zarTesti' ? 'etki' : 'olay');
    // P7: dostaVuruldu yalnız saldiriYap/yansit; yansit dostaVuruldu/banaIsabet/hasarAldim; saldiriYap dostaVuruldu/banaIsabet.
    if (raw.tur === 'tepki' && raw.olay === 'dostaVuruldu' && raw.etki !== 'saldiriYap' && raw.etki !== 'yansit') bad('etki');
    if (raw.tur === 'tepki' && raw.etki === 'yansit' && !['dostaVuruldu', 'banaIsabet', 'hasarAldim'].includes(raw.olay as string)) bad('olay');
    if (raw.tur === 'tepki' && raw.etki === 'saldiriYap' && !['dostaVuruldu', 'banaIsabet'].includes(raw.olay as string)) bad('olay');
    if (raw.tur === 'koruma' && !raw.kritikBagisikligi && !raw.konsantrasyonAvantaji && !raw.durumAvantaji && !raw.buyulereAvantaj) out.push({ path: `${p}.kritikBagisikligi`, kod: 'ilkelEksik', alan: 'kritikBagisikligi' });
    if (raw.tur === 'algi' && raw.karanlikGorusFt === undefined && raw.gercekGorusFt === undefined && !raw.gorunmezGor) out.push({ path: `${p}.karanlikGorusFt`, kod: 'ilkelEksik', alan: 'karanlikGorusFt' });
    if (raw.tur === 'ekSaldiri' && (raw.tetik === 'pasif') !== (raw.saldiriSayisi !== undefined)) bad(raw.tetik === 'pasif' ? 'saldiriSayisi' : 'tetik');
    if (raw.tur === 'yuzeyOlustur' && raw.yuzey === 'alan' && raw.hasar === undefined && !raw.zorluArazi && raw.durum === undefined && raw.iyilestir === undefined) out.push({ path: `${p}.hasar`, kod: 'ilkelEksik', alan: 'hasar' });
    if (raw.tur === 'yuzeyOlustur' && raw.hasar !== undefined && raw.hasarTuru === undefined) out.push({ path: `${p}.hasarTuru`, kod: 'ilkelEksik', alan: 'hasarTuru' });
    if (raw.tur === 'durumUygula' && raw.durum === 'Invisible') out.push({ path: `${p}.durum`, kod: 'ilkelDeger', alan: 'durum' });
  });
  return out;
}

/** İlkelin yorumlayıcıda kısmi kalan alanları (check:icerik uyarısı; boşsa tam). */
export function ilkelKismi(raw: Record<string, unknown>): string[] {
  const spec = ILKELLER[raw.tur as string];
  if (!spec) return ['tur'];
  const out = Object.keys(raw).filter((k) => spec.alanlar[k]?.kismi);
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
  // P7: `canavar` verilirse stat bloğu SRD canavarından (ac/hp/yetenekler gerekmez); kimlik bilinmeli.
  const ref = typeof raw.canavar === 'string';
  if (ref && monsterIds && !monsterIds.has(raw.canavar as string)) bad('canavar');
  for (const [k, a] of Object.entries(YARATIK_ALANLARI)) if (a.zorunlu && raw[k] === undefined && !(ref && ['ac', 'hp', 'yetenekler'].includes(k))) hatalar.push({ path: `${path}.${k}`, kod: 'ilkelEksik', alan: k });
  if (raw.jeton === undefined) uyarilar.push({ path: `${path}.jeton.gorsel`, kod: 'ilkelDeger', alan: 'jeton.gorsel' });
  return { hatalar, uyarilar };
}
