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
export const FORMUL_TOKENS = ['$pbYari', '$pb', /** P12: seviyenin yarısı (aşağı, en az 1). */ '$lvlYari', '$lvl2', '$lvl', '$str', '$dex', '$con', '$int', '$wis', '$cha', '$buyu'] as const;
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
export const KOSULLAR = ['ofke', 'yarimCanAlti', 'zirhsiz', 'avantajli', 'dostBitisik', 'konsantrasyon', /** P6. */ 'buyuTurunda', 'seviyeliBuyuTurunda', /** P7: hedef sahibinden büyük. */ 'hedefBuyuk',
  /** P9: bu tur Flurry of Blows sürüyor; savaşın ilk turu. */ 'flurryVurusu', 'ilkTur', /** P11: zar yarışını kazandığın hedef. */ 'zarYarisi'] as const;
/** P6: `harita:<bölge>` koşulunun bölgeleri (`harita/_ortak/harita-bolgeleri.json`). */
export const HARITA_TEMALARI: readonly string[] = ((bolgeler as { bolgeler?: Array<{ id: string }> }).bolgeler ?? []).map((b) => b.id);
export const HEDEFLER = ['kendi', 'dost', 'dostVeyaKendi', 'dostlar', 'dusman', 'dusmanlar', 'bitisikDusmanlar', 'alan', 'vurulan'] as const;
export type Hedef = typeof HEDEFLER[number];

export type AlanTip = 'tamsayi' | 'sayi' | 'bool' | 'metin' | 'enum' | 'formul' | 'hasarTuru' | 'hasarTurleri' | 'durum' | 'durumlar'
  | 'yetenek' | 'yetenekler' | 'kaynakRef' | 'save' | 'yaratikRef' | 'buyular' | 'kosullar' | 'sure' | 'kimlik' | 'enumListe' | 'yaratikRefler'
  /** P12: `{ "sayi": 8 }` (oyuncunun seçtiği büyü listesi), vertigo tablosu (satır listesi). */
  | 'rastgeleListe' | 'vertigoTablo'
  /** U1a: `ucus.kullanim` (`{ "sayi", "yenilenme" }`) ve `ucus.esikSonrasi` (uçuş parametrelerinin alt kümesi). */
  | 'kullanim' | 'ucusEsik';
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
  kosul: { tip: 'kosullar', not: 'Hepsi doğruysa çalışır: ofke, yarimCanAlti, zirhsiz, avantajli (isabet), dostBitisik (hedefe bitişik dost), konsantrasyon, buyuTurunda (bu tur büyü yaptın), seviyeliBuyuTurunda (bu tur slotlu büyü), hedefBuyuk (hedef senden büyük), bicim:<id>, isaretli:<id> (hedef bu işaretle işaretli), harita:<bölge> (savaş haritasının bölgesi); P9: flurryVurusu (bu tur Flurry of Blows kullanıldı), ilkTur (savaşın 1. turu); P11: zarYarisi (hedefe karşı `zarYarisi` kazanıldı).' },
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
      yanHedef: B('P10: ek hasar vurulan yerine ona bitişik başka bir düşmana (yoksa vurulana).'),
    },
    sistem: 'Saldırı çözümü (`features.ts` `weaponAttackEvents`) → isabet kanca kaydı (`hitHooks.ts`); `ExtraDamage` (direnç/bağışıklık hedefe göre).',
    ornek: { tur: 'ekHasar', zar: { 3: '1d6', 11: '2d6' }, hasarTuru: 'radiant', saldiri: 'silah', turdaBir: true },
  },
  direnc: {
    not: 'Hasar direnci, bağışıklığı ya da zaafı (koşula bağlı olabilir).', tetikler: ['pasif'],
    alanlar: {
      turler: { tip: 'hasarTurleri', not: 'Hasar türleri (`hasarKaynagi: buyu` yoksa gerekli).' },
      tip: E(['direnc', 'bagisiklik', 'zaaf'], 'Direnç (yarı), bağışıklık (sıfır), zaaf (iki kat).'),
      /** P11 */ hasarKaynagi: E(['hepsi', 'buyu'], 'P11: buyu = yalnız büyülerden gelen hasara (her türüne) direnç; sürüm 42+.'),
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
      hasarKaynagi: E(['hepsi', 'buyu'], 'P11 direnc: buyu = auradakiler büyü hasarına (her türüne) dirençli; sürüm 42+.'),
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
      olay: E(['banaIsabet', 'dostaIsabet', 'hasarAldim', 'zarTesti', /** P7 */ 'dostaVuruldu',
        /** P9 */ 'firsatSaldirisi', 'dusmanBuyuAtiyor', 'isaretliVurdu', 'komsuHedefVuruldu', 'kurtulmaAttirildi',
        /** P10 */ 'hedefAlindi', 'dusmanYaklasti', 'buyuBasardi'],
      'Tetikleyen olay: sana isabet, menzildeki dosta isabet, yakın dövüşte hasar aldın, menzildeki bir yaratığın d20 testi (yalnız zorlaSonuc), menzildeki dosta saldırı isabet edip hasar verdi (P7; saldırgana karşılık); P9: firsatSaldirisi (senin fırsat saldırın isabet etti; tepki zaten harcandı, ek tepki harcanmaz), dusmanBuyuAtiyor (menzildeki düşman büyü yapmaya başlıyor; Counterspell anı), isaretliVurdu (senin `isaret`inle işaretli düşman sana ya da dostuna isabet etti), komsuHedefVuruldu (sana bitişik düşmana bir dostun isabet etti), kurtulmaAttirildi (senin etkinle bir düşman kurtulma attı; `sonuc` ile süzülür); P10: hedefAlindi (menzildeki dosta ya da sana saldırı zarı atılmak üzere), dusmanYaklasti (düşman yürüyüşte sana bitişik oldu), buyuBasardi (büyün isabet etti ya da hedef kurtulmayı geçemedi).'),
      etki: E(['acBonusu', 'hasarAzalt', 'yariya', 'direnc', 'karsiVurus', 'iskalat', 'yonlendir', 'kritikIptal', 'zorlaSonuc', /** P7 */ 'saldiriYap', 'yansit',
        /** P9 */ 'hizSifir', 'hareketEt', 'buyuIptal', 'hasarEkle', /** P10 */ 'avantajSifirla'], 'Tepkinin etkisi: AC, hasar azaltma, yarıya, direnç (yarıya), karşı vuruş, ıskalatma, başka hedefe saptırma, kritiği normal vuruşa çevirme, d20 testini başarı/başarısızlık sayma; P7: saldiriYap (saldırgana silah saldırısı, erişimdeyse), yansit (alınan hasarın `oran` katı saldırgana; kurtulma verilirse yarıya); P9: hizSifir (olaydaki düşmanın hızı turunun sonuna dek 0; kurtulma verilirse başarısızlıkta), hareketEt (yarı hızın kadar fırsat saldırısı tetiklemeden uzaklaş; banaIsabet), buyuIptal (büyü boşa gider; kurtulma verilirse başarısızlıkta; eylem harcanır, yuva harcanmaz), hasarEkle (olaydaki düşmana `miktar` hasar, tür `hasarTuru`); P10: avantajSifirla (hedefAlindi: bu saldırıda avantaj ve dezavantaj sıfırlanır, zar normal).', { zorunlu: true, varsayilan: undefined }),
      yon: E(['uzak', 'yakin'], 'P10 hareketEt: olaydaki yaratıktan uzaklaş ya da ona yaklaş (bitişiğe).'),
      geriTepme: F('P10 buyuIptal: büyü boşa gidince büyücüye bu hasar (tür `hasarTuru`).'),
      hasarTuru: { tip: 'hasarTuru', varsayilan: 'force', not: 'P9 hasarEkle: hasar türü.' },
      iptal: B('P9 dusmanBuyuAtiyor + saldiriYap: saldırı isabet ederse büyü boşa gider.'),
      calar: B('P11 buyuIptal: boşa giden büyü çalınır (süren etki `grantSpell`; slotsuz bir kez yapılır). Sürüm 42+.'),
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
    sistem: 'P10: hedefAlindi hedef alınma kancasında (`registerTargeted`, zardan önce; avantajSifirla = hedefe bu komutluk `attackedAdv` + `attackedDis`), dusmanYaklasti yürüyüş adımı kancasında (`registerAfterStep`), buyuBasardi komut sonunda. P9: firsatSaldirisi/kurtulmaAttirildi komut sonu kancası (fırsat saldırısı `attack_resolved.opportunity`, `save_resolved.actorId`), isaretliVurdu/komsuHedefVuruldu saldırı sonrası kancası (`registerAfterAttack`), dusmanBuyuAtiyor büyü kancası (`registerCastHook`, Counterspell ile aynı an); hizSifir süren etki `speedZero` + `untilOwnTurnEnd` (yürüyüş fırsat saldırısından sonra durur, sürüm 38), hareketEt ışınlanma girişiyle yarı hız (`teleportEvent`; yol bulmaz, kısmi). Tepki sistemi (`reactions.ts`): banaIsabet → `ReactionSpec` (parry/reduce/halve/resist), hasarAldim+karsiVurus → retaliate; dostaIsabet etkileri ve iskalat/yonlendir/kritikIptal isabet tepki kancasında (`registerAllyHit`, hasar değiştirebilir); zorlaSonuc ikinci şans girişinde (`effectDice.ts` `secondChances`, `ExtraDie.reroll` success/forceFail). Karar `askReaction` (oyuncuya sorulur).',
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
      avantaj: E(['yok', 'isaretleyen', 'herkes'], 'İşaretliye saldırı avantajı: yok, yalnız işaretleyen, herkes.'), menzilFt: MENZIL,
      aktar: B('P9: işaretli 0 cana düşünce işaret `menzilFt` içindeki en yakın düşmana geçer (lanet aktarımı; kalan süreyle).'),
      kurtulmaAvantaji: B('P10: işaretlinin etkilerine karşı kurtulmaların avantajlı (kaynağı bilinen kurtulmalarda).', false, { kismi: 'Kaynağı taşımayan kurtulmalarda (bazı canavar yetenekleri, harita kuralları) uygulanmaz.' }) },
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
    not: 'Uçuş hızı. Kuyruk U1a (sürüm 61+) kademeleri: kalıcı (pasif), kısa süreli (bonus + `sureDakika` + `kullanim`), süzülme (`azamiIrtifaFt: 5` + `yeredegmez`), zorunlu inişli (`zorunluInis`); seviye eşiğinde parametre değişimi (`seviyeEsigi` + `esikSonrasi`). Sürüm 60 ve altında yalnız `hizFt` ve `sure`.',
    tetikler: ['pasif', 'bonus', 'eylem', 'savasBasi'],
    alanlar: { hizFt: F('Uçuş hızı (ft; "yurume" yürüme hızı kadar). `hizCarpani` ile birlikte yazılmaz.', { varsayilan: 'yurume' }), sure: SURE,
      hizCarpani: { tip: 'sayi', not: 'U1a: uçuş hızı = yürüme hızı × çarpan (5\'in katına aşağı; 0 < çarpan ≤ 4; varsayılan 1). `hizFt` ile birlikte yazılmaz.' },
      azamiIrtifaFt: N('U1a: bu uçuşla çıkılabilecek en yüksek irtifa (ft, 5\'in katı; yoksa haritanın uçuş sınırı). Süzülme 5. Tırmanırken ve duruş yüzeyinde (sur tepesi, kat) uygulanmaz; başka uçuş kaynağı (kendi uçuş hızı, sınırsız uçuş etkisi, Levitate) varsa sınır yok.'),
      sureDakika: { tip: 'sayi', not: 'U1a: süre (dakika; 1 dk = 10 tur; 0 < süre ≤ 600). `sure` ile birlikte yazılmaz.' },
      kullanim: { tip: 'kullanim', not: 'U1a: dinlenme başına kullanım `{ "sayi": 1, "yenilenme": "uzun" | "kisa" }` (`sayi`: `kaynak` ilkelinin `sayi` biçimi, varsayılan 1; `yenilenme` varsayılan `uzun`). İlkelde `id` gerekir; örtük kaynak `kullanim-<id>` (alt sınıfta benzersiz). Yalnız düğme tetiğiyle (`bonus`, `eylem`); `kaynak` ile birlikte yazılmaz.' },
      yeredegmez: B('U1a: süzülme: zorlu zemin, çamur, tuzak plakası, sığ su, çukur işlemez; lav (gönüllü girilmez), derin su ve zemin alanı büyüleri/yüzeyler işler; yüksek zemin (K8) verilmez.'),
      zorunluInis: B('U1a: uçuş yalnız kendi turunda (tur başında açılır, tur sonunda biter; havadaysa düşer). Celestial Kırık Kanat kipi.'),
      seviyeEsigi: N('U1a: bu karakter seviyesinden itibaren `esikSonrasi` parametreleri geçerli (2–20).'),
      esikSonrasi: { tip: 'ucusEsik', not: 'U1a: eşikten sonra üste yazılan parametreler (`hizFt`, `hizCarpani`, `azamiIrtifaFt`, `sureDakika`, `sure`, `yeredegmez`, `zorunluInis`).' } },
    sistem: 'Süren etki `fly` (`flight.ts` `flySpeed`, `isAirborne`); U1a: `flightPrim.ts` `ucusAt`/`ucusBody` (etkide `flyCapFt`, `hover`, `pkGlide`), sınır `altitude.ts` `altitudeCapFt`, süzülme `flight.ts` `hovers`/`groundBound`, zorunlu iniş tur kancaları `glideTurnStartEvents`/`glideTurnEndEvents`, kullanım `content/paket.ts` örtük kaynak.',
    ornek: { tur: 'ucus', id: 'suzul', tetik: 'bonus', hizCarpani: 1, sureDakika: 1, kullanim: { sayi: 1, yenilenme: 'uzun' }, azamiIrtifaFt: 5, yeredegmez: true },
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
      inisiyatifAvantaji: B('P9: inisiyatif avantajlı (yalnız koşulsuz pasif; savaş başında atılır).'),
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
      yenilenme: E(['uzun', 'kisa', 'tur', /** P12 */ 'depo'], 'Yenilenme: uzun dinlenme, kısa (ve uzun) dinlenme, her tur başı; P12 `depo`: sayaç (güç deposu): yeni karakter ve uzun dinlenme 1, kısa dinlenme yalnız 0\'daysa 1; `sayi` üst sınır.') },
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
    alanlar: { buyular: { tip: 'buyular', not: 'Büyü adları (SRD adı, `data/spells*.json`; `kopyaEnCokSeviye` yoksa gerekli).' }, bedava: { tip: 'kaynakRef', not: 'Bu kaynak kaldıkça slotsuz (`{ "id": "<kaynak>" }`).' },
      /** P11 */ yalnizKendine: B('P11: bedava (kaynakla) yapım yalnız kendine; başkasına slotla.'),
      konsantrasyonsuz: B('P11: listedeki büyüler konsantrasyonsuz (süreleri kadar).'),
      kopyaEnCokSeviye: N('P11: bu seviyeye dek (1+) herhangi bir büyü, bilmeden, slotsuz (kaynakla; Wish benzeri kopya).'),
      /** P12 */ rastgeleListe: { tip: 'rastgeleListe', not: 'P12: `{ "sayi": 8 }`: oyuncu oluşturucuda bildiği/hazırladığı N büyüyü seçer; düğmeyle (eylem, kaynakla) dN zarı listeden birini seçer, büyü slotsuz bir kez yapılır (hedefi oyuncu seçer). Geçerli hedefi olmayan büyü yeniden atılır; hiçbiri geçerli değilse kullanım harcanmaz.' } },
    sistem: 'Sınıf kiti `alwaysPrepared` ve kaynak `freeSpellList` (Favored Enemy yolu). P11 (sürüm 42+): `paket/p11cast.ts` (yalnız kendine, konsantrasyonsuz, kopya). P12 (sürüm 45+): `paket/p12.ts` rastgele liste (düğme `pk12:dilek:<özellik>`, seçimler `featureChoices["<özellik>/dilek<n>"]`, süren etki `grantSpell`).',
    ornek: { tur: 'buyuVer', buyular: ['Misty Step', 'Shield'], bedava: { id: 'sis-adimi' } },
  },
  buyuDegisimi: {
    not: 'Büyü hasarına eklenti (türe/okula göre).', tetikler: ['pasif'],
    alanlar: { hasarEki: F('Büyü hasarına eklenti (bir kez).'), hasarTurleri: { tip: 'hasarTurleri', not: 'Yalnız bu türlerde.' },
      okul: { tip: 'metin', not: 'Yalnız bu okul (Evocation…).' },
      kurtulmaDezavantaji: B('Büyülerine ve alan etkilerine karşı kurtulmalar dezavantajlı.'), menzilEkiFt: N('Menzilli (5 ft üstü) büyülerin menziline eklenen.'),
      yeniTur: { tip: 'hasarTuru', not: 'Hasar türünü değiştir (`hasarTurleri` verilirse yalnız onlardan).' },
      /** P11 */ ikiz: B('P11: Twinned Spell (yukarı slotta ek hedef alan büyü ikinci hedefe; kaynak verilirse onunla).'),
      konsantrasyonsuz: B('P11: konsantrasyonlu büyü konsantrasyonsuz yapılır (kaynakla; `okul`/`enCokSeviye` süzer).'),
      enCokSeviye: N('P11 konsantrasyonsuz: en çok bu seviyedeki büyüler.'),
      cikisCagri: B('P11: büyü senin çağrının (paket `cagir`) altıgeninden çıkabilir (`cast_spell.originId`).'),
      yetenekEki: { tip: 'yetenek', not: 'P11: menzili en çok `menzilEnCokFt` (varsayılan 5) olan büyünün hasarına bu yetenek değiştiricisi.' },
      menzilEnCokFt: N('P11 yetenekEki: en çok bu menzil (ft).', { varsayilan: 5 }),
      /** P12 */ ikizOkul: { tip: 'metin', not: 'P12: bu okulun (Enchantment…) tek hedefli büyüsü menzildeki ikinci bir hedefe de (kaynaksız; eylem, slot, Counterspell ve konsantrasyon bir kez). `ikiz`ten ayrı.' },
      kitapCikis: B('P12: büyü kitabı savaş başında senin altıgeninde taşınan nesne (`spellbook`); büyü kitabın altıgeninden çıkabilir (`cast_spell.originId` = kitap; menzil ve görüş oradan). Bırak (`object_use put`) / al (`take`).') },
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
    not: 'Hız artışı (pasif ya da süreli); P10: dosta ya da düşmana (eksi değerle yavaşlatma).', tetikler: ['pasif', 'bonus', 'eylem', 'savasBasi'],
    hedefler: ['kendi', 'dost', 'dusman'],
    alanlar: { artiFt: F('Hıza eklenen (ft; eksi olabilir).', { zorunlu: true }), sure: SURE, menzilFt: MENZIL, save: SAVE },
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
    not: 'İsabette hasar zarlarını değiştirir: en yükseğe çek, düşükleri yeniden at, ikiye katla ya da büyüt. P11: `kapsam: iyilestirme` (tetik pasif) büyü iyileştirmesinin zarlarına.', tetikler: ['isabet', 'pasif'],
    alanlar: { mod: E(['maks', 'yenidenAt', 'carpan', 'zarBuyut', /** P10 */ 'ikiAtSec'], 'maks: zarlar en yüksek; yenidenAt: `esik` ve altı bir kez yeniden; carpan: zarlar bir kez daha eklenir; zarBuyut: her zar bir boy büyük (d6→d8); P10 ikiAtSec: bütün hasar zarları bir kez daha atılır, büyük toplam seçilir.', { zorunlu: true, varsayilan: undefined }),
      esik: N('yenidenAt: bu değer ve altındaki zarlar (varsayılan 2).', { varsayilan: 2 }),
      saldiri: E(['silah', 'yakin', 'menzilli', 'buyu', 'hepsi'], 'Hangi saldırılar.'), hasarTurleri: { tip: 'hasarTurleri', not: 'Yalnız bu hasar türlerinde.' },
      /** P11 */ kapsam: E(['saldiri', 'iyilestirme'], 'P11: saldiri (isabet hasarı) ya da iyilestirme (büyü iyileştirmesi; tetik pasif, `healed.rolls`). Sürüm 42+.') },
    sistem: 'İsabet kancası (`hitHooks.ts`; bağlam artık saldırının zarlarını taşır): fark ek hasar olarak (`ExtraDamage`, direnç hedefe göre). Kurtulmalı büyü hasarı kapsam dışı (kısmi).',
    ornek: { tur: 'zarDegistir', mod: 'maks', hasarTurleri: ['lightning', 'thunder'], kaynak: { id: 'focus', maliyet: 1 } },
  },
  koruma: {
    not: 'Pasif koruma: kritik vuruş bağışıklığı, konsantrasyon kurtulmasında avantaj, durumlara karşı kurtulma avantajı.', tetikler: ['pasif', 'bonus', 'eylem'],
    alanlar: { kritikBagisikligi: B('Kritik vuruş normal vuruş sayılır.'), konsantrasyonAvantaji: B('Konsantrasyon kurtulması avantajlı.'),
      durumAvantaji: { tip: 'durumlar', not: 'Bu durumlara karşı kurtulmalar avantajlı.' }, buyulereAvantaj: B('Büyülere karşı kurtulmalar avantajlı.'), sure: SURE,
      /** P11 */ itmeDirenci: B('P11: bir yaratığın zorla hareketine (itme/çekme/kaydırma) avantajlı STR kurtulması; başarıda kımıldamaz (`motion.ts` `forcedMove`); sürüm 42+.') },
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
    alanlar: { gecicCan: F('Çağrılınca geçici can.'), acBonusu: F('AC eklentisi.'), ekHasar: F('İsabette ek zar (silah ve canavar saldırısı).'), buyuluVurus: B('Saldırıları büyülü.'),
      turBasiCan: F('P9: çağrılan her yaratık kendi tur başında bu kadar geçici can alır (yükseği kalır).'),
      komutSaldiri: F('P11: komut verdiğin turda (`command_summons`) komutlu çağrı bu kadar ek saldırı yapar (eylemi harcanmışken); sürüm 42+.') },
    sistem: 'Komut sonu: bu komutta çağrılan (`summoned` olayı) ve sahibi bu ilkeli taşıyan yaratığa süren etki (`ac`, `hitDie`, `pkMagic`) ve `temp_hp`.',
    ornek: { tur: 'cagirGuclendir', gecicCan: '$lvl', acBonusu: 2, ekHasar: '1d6' },
  },
  ortakCan: {
    not: 'Dostları ortak can havuzuna bağlar (hasar havuzdan düşer).', tetikler: ['eylem', 'bonus'], hedefler: ['dostlar'],
    alanlar: { yaricapFt: { ...YARICAP, varsayilan: 30 }, enCok: N('En çok üye (sahip dahil).', { varsayilan: 4 }),
      direncler: { tip: 'hasarTurleri', not: 'P10: havuz üyelerine bu türlere direnç (havuz sürdükçe; havuza düşen hasar yarıya).' } },
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
  // ---------------------------------------------------------------- P9: ilkel genişletme 3 (kural sürümü 38)
  tepkiHakki: {
    not: 'Ek tepki hakkı: her yaratığın turunda bir tepki (tur başına bir değil).', tetikler: ['pasif'],
    alanlar: { herTur: B('Her yaratığın turunda tepki yenilenir (Marilith Reactive yolu).', true) },
    sistem: 'Süren etki `pkReactive` (reducer `turn_ended`: `reactive` özelliğiyle aynı yenilenme). Sürüm 38+.',
    ornek: { tur: 'tepkiHakki', herTur: true },
  },
  zarYenile: {
    not: 'Başarısız d20 testini yeniden attırır (kendin ya da menzildeki dost); ikiAtSec: iki zar atılır, iyisi seçilir.', tetikler: ['pasif'],
    alanlar: { kim: { tip: 'enumListe', degerler: ['kendi', 'dost'], varsayilan: ['kendi'], not: 'Kimin testinde (dost kendini kapsamaz).' },
      testler: { tip: 'enumListe', degerler: ['saldiri', 'kurtulma', 'kontrol'], varsayilan: ['saldiri', 'kurtulma', 'kontrol'], not: 'Hangi d20 testleri.' },
      mod: E(['yenidenAt', 'ikiAtSec'], 'yenidenAt: bir zar yeniden; ikiAtSec: iki zar, yüksek olan (avantajla yeniden atış).'),
      tepkiyle: B('Tepki harcar (verilmezse yalnız kaynak; kaynak da yoksa sınırsız: turdaBir ile sınırla).'), menzilFt: { ...MENZIL, varsayilan: 30 } },
    sistem: 'İkinci şans girişi (`effectDice.ts` `secondChances`, `ExtraDie.reroll: d20` + `rerollMode: advantage`); menzil reducer türetimi (`syncAuras` → `pkSans`, tür `yenile`). Sürüm 38+.',
    ornek: { tur: 'zarYenile', kim: ['kendi', 'dost'], testler: ['saldiri', 'kurtulma'], mod: 'ikiAtSec', kaynak: { id: 'kehanet', maliyet: 1 } },
  },
  buyuPaylas: {
    not: 'Kendine yaptığın büyünün süren etkisi menzildeki bir dosta da uygulanır (aynı süre ve konsantrasyon).', tetikler: ['pasif'],
    alanlar: { menzilFt: { ...MENZIL, varsayilan: 30 }, enCokSeviye: N('Yalnız bu seviye ve altı büyüler.', { varsayilan: 9 }) },
    sistem: 'Komut sonu: `cast_spell` ile büyücüye eklenen etki (`effect_added`, kaynak büyücü) en zayıf dosta kopyalanır (`…:pk-paylas`). Sürüm 38+.',
    ornek: { tur: 'buyuPaylas', menzilFt: 30, enCokSeviye: 3, kaynak: { id: 'cagri', maliyet: 1 } },
  },
  kontrolEt: {
    not: 'Düşmanı yönetir: kurtulmayı geçemezse süre boyunca senin tarafında savaşır.', tetikler: ['eylem', 'bonus', 'isabet', 'oldurunce'], hedefler: ['dusman', 'vurulan'],
    alanlar: { save: { ...SAVE, zorunlu: true }, sure: { ...SURE, varsayilan: 10 }, menzilFt: MENZIL, turler: { tip: 'metin', not: 'Yalnız bu yaratık türleri (virgüllü: "undead,beast").' },
      tekrarKurtulma: B('Her tur sonunda yeniden kurtulma (başarıda biter).'),
      kurtulmasiz: B('P10: hedef Incapacitated (ve onu içeren durumlar) ise kurtulma atılmaz.') },
    sistem: 'Taraf değiştirme (`allegiance.ts`: süren etki `dominate`; Game Master anahtarı `allegianceSwap`). Sürüm 38+.',
    ornek: { tur: 'kontrolEt', tetik: 'eylem', hedef: 'dusman', save: { yetenek: 'wis', dc: 'buyu' }, sure: 10, turler: 'undead', kaynak: { id: 'cagri', maliyet: 1 } },
  },
  zamanDurdur: {
    not: 'Zamanı durdurur: art arda N tur oynarsın (Time Stop yolu; başkasını etkileyince biter).', tetikler: ['eylem', 'bonus'],
    alanlar: { sayi: F('Ek tur sayısı (zar olabilir: "1d4+1").', { zorunlu: true }) },
    sistem: '`time_stop` olayı (`spells69.ts` Time Stop ile aynı: art arda tur, başkasına etki edince biter). Sürüm 38+.',
    ornek: { tur: 'zamanDurdur', tetik: 'eylem', sayi: 2, kaynak: { id: 'kehanet', maliyet: 1 } },
  },
  flurryEk: {
    not: 'Flurry of Blows ek vuruş sayısı (vuruşlar farklı hedeflere dağıtılabilir; hedef her vuruşta seçilir).', tetikler: ['pasif'],
    alanlar: { ekVurus: N('Ek vuruş.', { zorunlu: true }) },
    sistem: 'Süren etki `pkFlurry` (`economy.ts` Flurry kalanı). Flurry vuruşuna bağlı etkiler `kosul: ["flurryVurusu"]` ile (ör. isabette `iyilestirme`). Sürüm 38+.',
    ornek: { tur: 'flurryEk', ekVurus: 2 },
  },
  olumZari: {
    not: 'Ölüm kurtulmasında başarı atınca can kazanırsın (ayağa kalkarsın).', tetikler: ['pasif'],
    alanlar: { iyilestir: F('Kazanılan can.', { zorunlu: true }) },
    sistem: 'Komut sonu: `death_save` (başarı) → `healed` (0 HP\'den kalkış). Sürüm 38+.',
    ornek: { tur: 'olumZari', iyilestir: '1d4+$con', kaynak: { id: 'son-nefes', maliyet: 1 } },
  },
  canArtisi: {
    not: 'Savaş başında en çok can artar (ve can).', tetikler: ['pasif'],
    alanlar: { miktar: F('Artış (formül; ör. "$lvl").', { zorunlu: true }) },
    sistem: 'Savaş kuruluşunda (`withPaket`) en çok can ve can artar (başlangıç olayı taşır; Aid yolu). Sürüm 38+.',
    ornek: { tur: 'canArtisi', miktar: '$lvl' },
  },
  yetkinlik: {
    not: 'Alt sınıfın verdiği zırh/kalkan ve silah eğitimi (oluşturucu ve savaş: AC, yetkin saldırı, eğitimsiz zırh cezası yok).', tetikler: ['pasif'],
    alanlar: { zirhlar: { tip: 'enumListe', degerler: ['hafif', 'orta', 'agir', 'kalkan'], not: 'Zırh eğitimi.' },
      silahlar: { tip: 'enumListe', degerler: ['basit', 'harp'], not: 'Silah yetkinliği (harp: bütün harp silahları).' } },
    sistem: '`rules/classFeatures.ts` `packTraining` → `armorProficient` / `weaponProficient` (karakter sayfasının alt sınıf ve seviyesiyle). Oluşturucu ve savaş kuruluşu; kural sürümünden bağımsız (karakter verisi).',
    ornek: { tur: 'yetkinlik', zirhlar: ['orta', 'kalkan'], silahlar: ['harp'] },
  },
  ilham: {
    not: 'Bardic Inspiration yolunu değiştirir: başarısız kalan zar kalır ya da Bard\'a döner, kaynak bitince küçük zarla bedava ilham, ilham zarı silah hasarına ya da isabet alınca AC\'ye.', tetikler: ['pasif'],
    alanlar: {
      iade: E(['yok', 'hedefte', 'kaynaga'], 'Zar başarıyı getirmezse: yok (harcanır), hedefte (dostta kalır), kaynaga (Bard kullanımı geri gelir).'),
      kaynaksiz: B('Kullanım (ve Font of Inspiration) bitince ilham yine verilir (zar `zarBoyu`).'),
      zarBoyu: E(['d6', 'd4', 'd8', 'd10', 'd12'], 'Kaynaksız ilhamın zarı.'),
      hedefler: { tip: 'enumListe', degerler: ['hasar', 'ac'], not: 'İlhamlı dost zarı silah hasarına ekleyebilir (seçim) ya da vurulunca tepkisiyle AC\'ye (ıskaya dönebilir).' },
    },
    sistem: '`bard.ts` `ilhamOf` (ödeme ve etki alanları `inspireKeep`/`inspireRes`/`inspireUses`), `rules/attack.ts` ikinci şans `keepOnFail` → reducer iadesi (`refund`), `paket/p11hooks.ts` isabet kancası (hasar) ve dosta isabet kancası (AC). Sürüm 42+.',
    ornek: { tur: 'ilham', iade: 'kaynaga', hedefler: ['hasar', 'ac'] },
  },
  buyuSakla: {
    not: 'Büyüyü yapar ama saklarsın (slot ve eylem harcanır); sonra ateşlersin (bekleyen büyü).', tetikler: ['pasif'],
    alanlar: { ateslemeEylemi: E(['bonus', 'eylem', 'tepki', 'serbest'], 'Ateşleme maliyeti.'), enCokSeviye: N('En çok bu seviyedeki büyü.'), sure: { ...SURE, varsayilan: undefined },
      /** P12 */ dostTetikler: B('P12: saklı büyüyü bir dost da tetikleyebilir (`spell_followup` `choice: "sakli"`, `sourceId`: saklayan); dostun eylem ekonomisi harcanmaz, büyüyü saklayan yapar (menzil ve görüş saklayandan).') },
    sistem: '`cast_spell.store` → süren etki `storedSpell`; ateşleme `spell_followup` `choice: "sakli"` (`paket/p11cast.ts`; slot yeniden harcanmaz). Sürüm 42+; dost tetiği sürüm 45+.',
    ornek: { tur: 'buyuSakla', ateslemeEylemi: 'bonus', enCokSeviye: 3, kaynak: { id: 'kehanet', maliyet: 1 } },
  },
  gucDeposu: {
    not: 'Olay oldukça güç biriktirirsin; silah isabetinde biriken güç × zar ek hasar olarak boşalır.', tetikler: ['pasif'],
    alanlar: { olay: E(['buyuYuvasi', 'hasarAlinca', 'iskalandi', /** P12 */ 'karsiBuyu'], 'Sayaç ne zaman artar: slotlu büyü yaptın, hasar aldın, sana saldırı ıskaladı; P12 `karsiBuyu`: düşman büyüsünü Counterspell ile durdurdun ya da Dispel Magic ile kırdın (komut başına +1).'),
      zar: F('Güç başına ek hasar (`harca: isabet`te gerekli).'), enCok: N('Sayaç üst sınırı (P12 `depo` verilirse kaynağın üst sınırı geçerli).'), hasarTuru: { tip: 'hasarTuru', not: 'Ek hasar türü (yoksa silahınki; `buyuHasari`nda varsayılan force).' },
      /** P12 */ depo: { tip: 'kaynakRef', not: 'P12: sayaç bir kaynakta (`kaynak` ilkeli, `yenilenme: "depo"`, `sayi` üst sınır ör. "$int"): savaşlar arası taşınır, dinlenmeyle döner.' },
      harca: E(['isabet', 'buyuHasari'], 'Nasıl boşalır: isabet = silah isabetinde sayaç × zar (P11); P12 buyuHasari = büyün bir yaratığa/nesneye hasar verince turda bir kez 1 güç harcayıp `harcaHasar` ek hasar (çok hedefli/çok oklu büyüde tek hedefe bir kez; seçim).'),
      harcaHasar: F('P12 buyuHasari: ek hasar (ör. "$lvlYari": seviyenin yarısı).'), buyuListesi: { tip: 'metin', not: 'P12 buyuHasari: yalnız bu sınıf listesinin büyüleri (Wiz, Sor…; `data/spells*.json` `classes`).' } },
    sistem: 'Komut sonu sayaç (`pkCharge` süren etki; P12 `depo` kaynağı), isabet kancası boşaltır (seçim; `paket/p11hooks.ts`); P12 büyü hasarı ve karşı büyü `paket/p12.ts` (komut sonu). Sürüm 42+; P12 alanları 45+.',
    ornek: { tur: 'gucDeposu', olay: 'buyuYuvasi', zar: '1d6', enCok: 4 },
  },
  zarYarisi: {
    not: 'Hedefle karşılıklı zar yarışı (d20 + beceri/yetenek); kazanırsan hedef işaretlenir (`kosul: zarYarisi`, avantajsız Sneak Attack).', tetikler: ['bonus', 'eylem'], hedefler: ['dusman'],
    alanlar: { beceri: { tip: 'metin', not: 'Senin becerin (Insight, Investigation…; yoksa `yetenek`).' }, yetenek: { tip: 'yetenek', varsayilan: 'int', not: 'Senin yeteneğin.' },
      hedefBeceri: { tip: 'metin', not: 'Hedefin becerisi (Deception…).' }, hedefYetenek: { tip: 'yetenek', varsayilan: 'cha', not: 'Hedefin yeteneği.' }, menzilFt: MENZIL, sure: { ...SURE, varsayilan: 'kalici' } },
    sistem: 'Düğme (`use_feature`): iki d20 zar defterinden (elle zar dahil); kazanınca hedefte süren etki `pk-yaris:<sen>` + `sneakFor` (`features.ts` `canSneak`). Sürüm 42+.',
    ornek: { tur: 'zarYarisi', tetik: 'bonus', hedef: 'dusman', beceri: 'Insight', hedefBeceri: 'Deception', menzilFt: 30 },
  },
  zarHavuzu: {
    not: 'Kaynakla sayılan kendi zarların: başarısız saldırıya/kurtulmaya ekle, silah isabetinde hasara ekle ya da vurulunca tepkiyle AC\'ye.', tetikler: ['pasif'],
    alanlar: { zar: F('Havuz zarı (seviye tablosu olabilir: `{ "3": "1d8", "10": "1d10" }`).', { zorunlu: true }),
      kullanim: { tip: 'enumListe', degerler: ['saldiri', 'kurtulma', 'kontrol', 'hasar', 'ac'], varsayilan: ['saldiri', 'hasar'], not: 'Nerede kullanılır.' },
      savasBasiEnAz: F('Savaş başında havuz en az bu kadar (yenilenir).'),
      /** P12 */ patlar: B('P12: havuz zarı patlar: en yüksek yüz gelirse bir zar daha atılır ve eklenir (zincir en çok 10; her ek zar zar defterinde).'),
      havuz: F('P12: havuz büyüklüğü seviye tablosu (`{ "3": 4, "7": 5, "15": 6 }`); `kaynak` ilkelinin `sayi`sının yerine geçer.') },
    sistem: 'Ortak `kaynak` alanı havuzu sayar (`kaynak` ilkeli). İkinci şans (`effectDice.ts`, `onFail`: başarıya çevirince harcanır), isabet kancası (seçim) ve dosta isabet kancası (tepki) `paket/p11hooks.ts`. Sürüm 42+.',
    ornek: { tur: 'zarHavuzu', zar: { 3: '1d8', 10: '1d10' }, kullanim: ['saldiri', 'hasar', 'ac'], savasBasiEnAz: 1, kaynak: { id: 'kehanet', maliyet: 1 } },
  },
  vertigo: {
    not: 'P12: öfkeye girince vertigo zarı (dN) atılır; tablodaki satırın etkisi öfke sürdükçe geçerli (patlama, ışınlanma, kör edici ışık, AC). Tablo sırası zar yüzüne eşit dağılır (4 satır d8: 1–2, 3–4, 5–6, 7–8) ya da satırda `yuzler`.', tetikler: ['pasif'],
    alanlar: { zar: N('Zar yüzü (d8 → 8).', { varsayilan: 8 }), tablo: { tip: 'vertigoTablo', zorunlu: true, not: 'Satırlar (1–20): `{ "etki": "patlama" | "isinlan" | "isik" | "acBonusu", "ad"?, "yuzler"?: [1,2], "zar"?: "1d12", "hasarTuru"?, "yaricapFt"?: 10, "save"?, "durum"?: "Blinded", "sure"?: 1, "miktar"?: 1, "mesafeFt"?: 30, "tekrar"?: true, "hemen"?: true, "suzgec"?: "dusmanlar" | "hepsi" }`. patlama: alandakilere hasar (save varsa kurtulma, `yari`); isik: alandakilere kurtulma ya da `durum` (varsayılan Blinded) `sure` tur; acBonusu: öfke boyunca AC +miktar; isinlan: `mesafeFt` ışınlanma düğmesi (bonus eylem, öfke boyunca her tur; `hemen`: ilki bedava). `tekrar`: patlama/ışığı öfke boyunca bonus eylemle yinele.' } },
    sistem: 'Komut sonu (`paket/p12.ts`): öfke başlayınca zar (zar defteri), süren etki `pkVertigo` (öfke bitince biter); düğmeler `pk12:vertigo:<özellik>:isinlan|hemen|tekrar` (`use_feature`). Sürüm 45+.',
    ornek: { tur: 'vertigo', zar: 8, tablo: [{ etki: 'patlama', zar: '1d12', hasarTuru: 'force', yaricapFt: 10, save: { yetenek: 'con', dc: ['con'] } }, { etki: 'isinlan', mesafeFt: 30, hemen: true }, { etki: 'isik', yaricapFt: 10, save: { yetenek: 'con', dc: ['con'] }, sure: 1 }, { etki: 'acBonusu', miktar: 1 }] },
  },
  vertigoKontrol: {
    not: 'P12: vertigo zarını yönet (aynı alt sınıfın `vertigo` ilkeline uygulanır). hasardaYenile: öfkedeyken hasar alınca tepkiyle zar yeniden atılır (yeni satır eskisinin yerine). ikiAtSec: vertigo zarı iki kez atılır, satırı sen seçersin.', tetikler: ['pasif'],
    alanlar: { mod: E(['hasardaYenile', 'ikiAtSec'], 'Kip.', { zorunlu: true, varsayilan: undefined }), tepkiyle: B('hasardaYenile: tepki harcar.', true) },
    sistem: '`paket/p12.ts`: hasar sonrası tepki istemi (`askReaction`, tetik `damaged`), iki zar için seçim istemi (`askChoice`). Sürüm 45+.',
    ornek: { tur: 'vertigoKontrol', mod: 'hasardaYenile' },
  },
  silahFirlat: {
    not: 'Yakın dövüş silahın fırlatılabilir olur ve saldırıdan sonra eline döner (Thrown özelliği + dönüş).', tetikler: ['pasif'],
    alanlar: {
      normalFt: N('Normal menzil (ft).', { varsayilan: 20 }), uzunFt: N('Uzun menzil (ft).', { varsayilan: 60 }),
      silah: { tip: 'metin', not: 'Yalnız bu silah kimliği (yoksa eldeki bütün yakın dövüş silahları).' },
    },
    sistem: 'Savaş kuruluşunda (`withPaket`) Thrown özelliği olmayan her yakın dövüş silahına fırlatma seçeneği (`returns`; SRD Thrown: STR, tek el). Fırlatılan silah elden çıkmaz (döner). Sürüm 41+ (Kuyruk S2 el modeli).',
    ornek: { tur: 'silahFirlat', normalFt: 20, uzunFt: 60 },
  },
  silahBagi: {
    not: 'Silahla bağ: zorla elinden alınamaz (Incapacitated değilken) ve yere düşmüşse düğmeyle eline çağrılır (aynı savaş alanında, uzaklık yok).', tetikler: ['bonus', 'eylem', 'serbest'],
    alanlar: { silah: { tip: 'metin', not: 'Yalnız bu silah kimliği (yoksa eldeki bütün silahlar).' } },
    sistem: 'Savaşçıda `bonded` (savaş kuruluşu); zorlamayla bırakma (`dropEvents` `forced`, ör. Command "Drop") bağlı silahı düşürmez. Düğme: yerdeki bağlı silah `item_picked` (`bond`, nesne etkileşimi harcamaz). Sürüm 41+ (Kuyruk S2 el modeli).',
    ornek: { tur: 'silahBagi', tetik: 'bonus' },
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

/** Kuyruk U1a: `ucus.kullanim` örtük kaynağı (kimlik `kullanim-<ilkel id>`, kullanım sayısı, yenilenme); yoksa null. */
export function kullanimKaynak(p: Record<string, unknown>): { id: string; sayi: unknown; yenilenme: string } | null {
  if (p.tur !== 'ucus' || !isObj(p.kullanim) || typeof p.id !== 'string') return null;
  return { id: `kullanim-${p.id}`, sayi: p.kullanim.sayi ?? 1, yenilenme: typeof p.kullanim.yenilenme === 'string' ? p.kullanim.yenilenme : 'uzun' };
}
/** İlkelin harcadığı kaynak: `kaynak` alanı, yoksa (U1a) örtük `kullanim` kaynağı (maliyet 1). */
export function kaynakRefOf(p: Record<string, unknown>): { id: string; maliyet?: number } | undefined {
  if (p.kaynak) return p.kaynak as { id: string; maliyet?: number };
  const k = kullanimKaynak(p);
  return k ? { id: k.id, maliyet: 1 } : undefined;
}
/** U1a: `esikSonrasi` nesnesinde yazılabilen uçuş parametreleri. */
export const UCUS_ESIK_ALANLARI = ['hizFt', 'hizCarpani', 'azamiIrtifaFt', 'sureDakika', 'sure', 'yeredegmez', 'zorunluInis'] as const;

interface Ctx { kaynaklar: Set<string>; sinifKaynaklari: Set<string>; yaratiklar: Set<string>; ilkelIdleri: Set<string> }

/** P12: vertigo tablo satırının alan denetimi. */
export const VERTIGO_ETKILERI = ['patlama', 'isinlan', 'isik', 'acBonusu'] as const;
const VERTIGO_ALANLARI: Record<string, AlanSpec> = {
  etki: { tip: 'enum', degerler: VERTIGO_ETKILERI, zorunlu: true, not: '' }, ad: { tip: 'metin', not: '' }, zar: { tip: 'formul', not: '' }, hasarTuru: { tip: 'hasarTuru', not: '' },
  yaricapFt: { tip: 'tamsayi', not: '' }, save: { tip: 'save', not: '' }, durum: { tip: 'durum', not: '' }, sure: { tip: 'sure', not: '' }, miktar: { tip: 'formul', not: '' },
  mesafeFt: { tip: 'tamsayi', not: '' }, tekrar: { tip: 'bool', not: '' }, hemen: { tip: 'bool', not: '' }, suzgec: { tip: 'enum', degerler: ['dusmanlar', 'hepsi'], not: '' },
};
function vertigoSatirHatasi(x: unknown, ctx: Ctx): boolean {
  if (!isObj(x) || typeof x.etki !== 'string' || !(VERTIGO_ETKILERI as readonly string[]).includes(x.etki)) return true;
  if (x.yuzler !== undefined && (!Array.isArray(x.yuzler) || x.yuzler.length === 0 || x.yuzler.some((n) => !Number.isInteger(n) || (n as number) < 1 || (n as number) > 20))) return true;
  if (x.etki === 'patlama' && (x.zar === undefined || x.hasarTuru === undefined)) return true;
  return Object.entries(x).some(([k, v]) => k !== 'yuzler' && (!VERTIGO_ALANLARI[k] || alanHatasi(VERTIGO_ALANLARI[k] as AlanSpec, v, ctx)));
}

/** U1a: uçuş parametrelerinin değer aralıkları (tip denetiminin ötesi). */
function ucusDegerHatasi(k: string, v: unknown): boolean {
  if (k === 'hizCarpani') return typeof v !== 'number' || !(v > 0 && v <= 4);
  if (k === 'sureDakika') return typeof v !== 'number' || !(v > 0 && v <= 600);
  if (k === 'azamiIrtifaFt') return !Number.isInteger(v) || (v as number) % 5 !== 0;
  if (k === 'seviyeEsigi') return !Number.isInteger(v) || (v as number) < 2 || (v as number) > 20;
  return false;
}

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
    case 'rastgeleListe': return !isObj(v) || !Number.isInteger(v.sayi) || (v.sayi as number) < 2 || (v.sayi as number) > 20 || Object.keys(v).some((k) => k !== 'sayi');
    case 'vertigoTablo': return !Array.isArray(v) || v.length === 0 || v.length > 20 || v.some((x) => vertigoSatirHatasi(x, ctx));
    case 'kullanim': return !isObj(v) || Object.keys(v).some((k) => k !== 'sayi' && k !== 'yenilenme')
      || (v.sayi !== undefined && !kaynakSayiOk(v.sayi)) || (v.yenilenme !== undefined && v.yenilenme !== 'uzun' && v.yenilenme !== 'kisa');
    case 'ucusEsik': return !isObj(v) || Object.keys(v).length === 0 || Object.entries(v).some(([k, x]) => !(UCUS_ESIK_ALANLARI as readonly string[]).includes(k)
      || alanHatasi((ILKELLER.ucus as IlkelSpec).alanlar[k] as AlanSpec, x, ctx) || ucusDegerHatasi(k, x));
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
      if (f && raw[f] === undefined && !(f === 'turler' && raw.hasarKaynagi === 'buyu')) out.push({ path: `${p}.${f}`, kod: 'ilkelEksik', alan: f });
      if (raw.etki === 'hasar' && raw.hasarTuru === undefined) out.push({ path: `${p}.hasarTuru`, kod: 'ilkelEksik', alan: 'hasarTuru' });
    }
    // P11: direnc türsüz yalnız büyü kaynaklıysa; buyuVer büyüsüz yalnız kopyaysa.
    if (raw.tur === 'direnc' && raw.turler === undefined && raw.hasarKaynagi !== 'buyu') out.push({ path: `${p}.turler`, kod: 'ilkelEksik', alan: 'turler' });
    if (raw.tur === 'buyuVer' && raw.buyular === undefined && raw.kopyaEnCokSeviye === undefined && raw.rastgeleListe === undefined) out.push({ path: `${p}.buyular`, kod: 'ilkelEksik', alan: 'buyular' });
    // P12: güç deposu: isabette boşalan zar ister, büyü hasarında harcaHasar.
    if (raw.tur === 'gucDeposu' && raw.harca !== 'buyuHasari' && raw.zar === undefined) out.push({ path: `${p}.zar`, kod: 'ilkelEksik', alan: 'zar' });
    if (raw.tur === 'gucDeposu' && raw.harca === 'buyuHasari' && raw.harcaHasar === undefined) out.push({ path: `${p}.harcaHasar`, kod: 'ilkelEksik', alan: 'harcaHasar' });
    // P12: vertigo tablosunun yüzleri zarı aşmaz.
    if (raw.tur === 'vertigo' && Array.isArray(raw.tablo) && raw.tablo.some((x) => isObj(x) && Array.isArray(x.yuzler) && x.yuzler.some((n) => (n as number) > (Number.isInteger(raw.zar) ? raw.zar as number : 8)))) out.push({ path: `${p}.tablo`, kod: 'ilkelDeger', alan: 'tablo' });
    if (raw.tur === 'tepki' && (raw.etki === 'acBonusu' || raw.etki === 'hasarAzalt') && raw.miktar === undefined) out.push({ path: `${p}.miktar`, kod: 'ilkelEksik', alan: 'miktar' });
    if (raw.tur === 'kaynak' && raw.sayi !== undefined && !kaynakSayiOk(raw.sayi)) out.push({ path: `${p}.sayi`, kod: 'ilkelDeger', alan: 'sayi' });
    // P6: etki/tetik birlikteliği.
    const bad = (alan: string) => out.push({ path: `${p}.${alan}`, kod: 'ilkelDeger', alan });
    if (raw.tur === 'tepki' && (raw.olay === 'zarTesti') !== (raw.etki === 'zorlaSonuc')) bad(raw.olay === 'zarTesti' ? 'etki' : 'olay');
    // P7: dostaVuruldu yalnız saldiriYap/yansit; yansit dostaVuruldu/banaIsabet/hasarAldim; saldiriYap dostaVuruldu/banaIsabet.
    if (raw.tur === 'tepki' && raw.olay === 'dostaVuruldu' && raw.etki !== 'saldiriYap' && raw.etki !== 'yansit') bad('etki');
    if (raw.tur === 'tepki' && raw.etki === 'yansit' && !['dostaVuruldu', 'banaIsabet', 'hasarAldim'].includes(raw.olay as string)) bad('olay');
    if (raw.tur === 'tepki' && raw.etki === 'saldiriYap' && !['dostaVuruldu', 'banaIsabet', 'isaretliVurdu', 'komsuHedefVuruldu', 'dusmanBuyuAtiyor', 'kurtulmaAttirildi'].includes(raw.olay as string)) bad('olay');
    // P9: yeni olay/etki birliktelikleri.
    if (raw.tur === 'tepki') {
      const P9: Record<string, string[]> = { firsatSaldirisi: ['hizSifir', 'hasarEkle', 'hareketEt'], isaretliVurdu: ['saldiriYap', 'hasarEkle', 'hizSifir'],
        komsuHedefVuruldu: ['saldiriYap', 'hasarEkle'], dusmanBuyuAtiyor: ['buyuIptal', 'saldiriYap'], kurtulmaAttirildi: ['hasarEkle', 'hizSifir', 'saldiriYap'],
        /** P10 */ hedefAlindi: ['avantajSifirla'], dusmanYaklasti: ['hareketEt', 'hizSifir'], buyuBasardi: ['hasarEkle'] };
      const allowed = P9[raw.olay as string];
      const newEtki = ['hizSifir', 'buyuIptal', 'hasarEkle', 'avantajSifirla'].includes(raw.etki as string);
      if (allowed && !allowed.includes(raw.etki as string)) bad('etki');
      else if (!allowed && newEtki) bad('olay');
      if (raw.etki === 'hareketEt' && !['banaIsabet', 'dusmanYaklasti', 'firsatSaldirisi'].includes(raw.olay as string)) bad('olay');
      if (raw.geriTepme !== undefined && raw.etki !== 'buyuIptal') bad('geriTepme');
      if (raw.yon !== undefined && raw.etki !== 'hareketEt') bad('yon');
      if (raw.etki === 'hasarEkle' && raw.miktar === undefined) out.push({ path: `${p}.miktar`, kod: 'ilkelEksik', alan: 'miktar' });
      if (raw.iptal !== undefined && raw.olay !== 'dusmanBuyuAtiyor') bad('iptal');
    }
    // P10: hız başkasına yalnız düğme/otomatik tetikle (pasif kendine).
    if (raw.tur === 'hiz' && raw.hedef !== undefined && raw.hedef !== 'kendi' && (raw.tetik === undefined || raw.tetik === 'pasif')) bad('tetik');
    if (raw.tur === 'koruma' && !raw.kritikBagisikligi && !raw.konsantrasyonAvantaji && !raw.durumAvantaji && !raw.buyulereAvantaj && !raw.itmeDirenci) out.push({ path: `${p}.kritikBagisikligi`, kod: 'ilkelEksik', alan: 'kritikBagisikligi' });
    if (raw.tur === 'algi' && raw.karanlikGorusFt === undefined && raw.gercekGorusFt === undefined && !raw.gorunmezGor) out.push({ path: `${p}.karanlikGorusFt`, kod: 'ilkelEksik', alan: 'karanlikGorusFt' });
    if (raw.tur === 'ekSaldiri' && (raw.tetik === 'pasif') !== (raw.saldiriSayisi !== undefined)) bad(raw.tetik === 'pasif' ? 'saldiriSayisi' : 'tetik');
    if (raw.tur === 'yuzeyOlustur' && raw.yuzey === 'alan' && raw.hasar === undefined && !raw.zorluArazi && raw.durum === undefined && raw.iyilestir === undefined) out.push({ path: `${p}.hasar`, kod: 'ilkelEksik', alan: 'hasar' });
    if (raw.tur === 'yuzeyOlustur' && raw.hasar !== undefined && raw.hasarTuru === undefined) out.push({ path: `${p}.hasarTuru`, kod: 'ilkelEksik', alan: 'hasarTuru' });
    if (raw.tur === 'durumUygula' && raw.durum === 'Invisible') out.push({ path: `${p}.durum`, kod: 'ilkelDeger', alan: 'durum' });
    // U1a: uçuş kademeleri.
    if (raw.tur === 'ucus') {
      for (const k of ['hizCarpani', 'sureDakika', 'azamiIrtifaFt', 'seviyeEsigi']) if (raw[k] !== undefined && ucusDegerHatasi(k, raw[k])) bad(k);
      if (raw.hizFt !== undefined && raw.hizCarpani !== undefined) bad('hizCarpani');
      if (raw.sure !== undefined && raw.sureDakika !== undefined) bad('sureDakika');
      if ((raw.seviyeEsigi === undefined) !== (raw.esikSonrasi === undefined)) out.push({ path: `${p}.${raw.seviyeEsigi === undefined ? 'seviyeEsigi' : 'esikSonrasi'}`, kod: 'ilkelEksik', alan: raw.seviyeEsigi === undefined ? 'seviyeEsigi' : 'esikSonrasi' });
      if (isObj(raw.esikSonrasi) && ((raw.esikSonrasi.hizFt !== undefined && (raw.hizCarpani !== undefined || raw.esikSonrasi.hizCarpani !== undefined))
        || (raw.esikSonrasi.sure !== undefined && (raw.sureDakika !== undefined || raw.esikSonrasi.sureDakika !== undefined)))) bad('esikSonrasi');
      if (raw.kullanim !== undefined) {
        if (typeof raw.id !== 'string') out.push({ path: `${p}.id`, kod: 'ilkelEksik', alan: 'id' });
        else if (c.kaynaklar.has(`kullanim-${raw.id}`)) bad('id');
        if (raw.kaynak !== undefined) bad('kullanim');
        if (raw.tetik !== 'bonus' && raw.tetik !== 'eylem') bad('kullanim');
      }
    }
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
  // P9: hareketEt yol bulmaz (ışınlanma girişiyle yarı hız; arada engel/zemin tetikleri yok).
  if (raw.tur === 'tepki' && raw.etki === 'hareketEt') out.push('etki');
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
