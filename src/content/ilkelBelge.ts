/**
 * Görev P0: `harita/belgeler/PAKET-ILKELLER.md` metni şema tablosundan (`ilkelSema.ts`) üretilir; belge ile şema
 * ayrışamaz (`ilkelSema.test.ts` dosyayı bu çıktıyla karşılaştırır). Üretim: `npx vite-node scripts/paket-ilkeller-belge.ts`.
 * Yalnız test ve betik içe aktarır (uygulama parçasına girmez).
 */
import { DUGME_TETIKLERI, ILKELLER, JETON_ARKETIP, JETON_YEDEK, KOSULLAR, ORTAK_ALANLAR, SALDIRI_ALANLARI, TETIKLER, YARATIK_ALANLARI, type AlanSpec } from './ilkelSema';

const TIP_ADI: Record<AlanSpec['tip'], string> = {
  tamsayi: 'tamsayı', sayi: 'sayı', bool: 'true/false', metin: 'metin', enum: 'seçenek', formul: 'formül', hasarTuru: 'hasar türü',
  hasarTurleri: 'hasar türü listesi', durum: 'durum', durumlar: 'durum listesi', yetenek: 'yetenek', yetenekler: 'yetenek listesi',
  kaynakRef: 'kaynak başvurusu', save: 'nesne', yaratikRef: 'yaratık kimliği', buyular: 'büyü adı listesi', kosullar: 'koşul listesi',
  sure: 'süre', kimlik: 'kimlik', enumListe: 'seçenek listesi',
};
const v = (x: unknown) => (x === undefined ? '—' : `\`${JSON.stringify(x)}\``);
const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
function table(alanlar: Record<string, AlanSpec>): string[] {
  const out = ['| Alan | Tip | Zorunlu | Varsayılan | Açıklama |', '|---|---|---|---|---|'];
  for (const [k, a] of Object.entries(alanlar)) {
    const tip = a.degerler && (a.tip === 'enum' || a.tip === 'enumListe') ? `${TIP_ADI[a.tip]}: ${a.degerler.map((d) => `\`${d}\``).join(', ')}` : TIP_ADI[a.tip];
    out.push(`| \`${k}\` | ${cell(tip)} | ${a.zorunlu ? 'evet' : 'hayır'} | ${cell(v(a.varsayilan))} | ${cell(a.not)}${a.kismi ? ` **Kısmi:** ${cell(a.kismi)}.` : ''} |`);
  }
  return out;
}

/** "Kalıba uymayan" ilk tahmin listesi: ilkel olmayan kalıplar (≥ 3 özellik kullanmıyor ya da motorda karşılığı yok). */
export const KALIBA_UYMAYAN: Array<{ kalip: string; neden: string; yol: string }> = [
  { kalip: 'Yapışma (attach): hedefle birlikte hareket, her tur hasar, eylemle sökme', neden: 'Canavar tarafında 3 kalem (ENVANTER 7d), alt sınıflarda tekil.', yol: 'Arcane Hand Grasping / yakalama sürüklemesi üstüne ortak ilkel (P1 adayı).' },
  { kalip: 'Taraf değiştirme / ele geçirme (Dominate, likantrop laneti)', neden: 'Savaş dengesi büyük; alt sınıf özelliklerinde nadir.', yol: '`allegianceSwap` (Kuyruk 18); ev kuralı anahtarıyla özel.' },
  { kalip: 'Yanılsama nesnesi (görüş keser, geçilir, incelemeyle bozulur)', neden: 'Büyülerde 6 kalem, alt sınıfta Aldatma tarzı birkaç özellik; motorda yanılsama nesnesi yok.', yol: 'K53 geçici engel `blocksSight` + bozulma eylemi (P1 adayı).' },
  { kalip: 'Biçim değişiminde jeton ve stat bloğu değişimi (gerçek Wild Shape)', neden: '`bicim` ilkeli yalnız süren etki; stat bloğu değişmez.', yol: 'Wild Shape `shape_changed` yolu (canavar kimliğiyle) ileride `bicim.canavar` alanı.' },
  { kalip: 'Yeniden atma / yeniden attırma (Lucky, Portent tarzı)', neden: 'Tepki kararı d20 sonrası; tek yol `ExtraDie.reroll` sınıf özelliklerine bağlı.', yol: '`secondChance` yolu genelleştirilince `zarEtkisi.yenidenAt` alanı.' },
  { kalip: 'Tepkide yönlendirme (saldırıyı başka hedefe çevirme)', neden: 'Yalnız canavar tepkisi `redirectAttack` var; oyuncu yolu yok.', yol: 'Tepki `yonlendir` etkisi (P1).' },
  { kalip: 'Büyü kurtulmasına dezavantaj, büyü menzili, hasar türü değişimi', neden: '`buyuDegisimi` alanları kabul edilir ama motorda tek kanca yok.', yol: 'Büyü save ve hedefleme kancası (P1); şimdilik kısmi.' },
  { kalip: 'Savaş dışı yetenekler (sosyal, keşif, zanaat, dil, ritüel)', neden: 'Savaş motoru dışı.', yol: '`hikaye` durumu.' },
  { kalip: 'Erişim (reach) artışı', neden: 'Silah erişimi saldırı seçeneğinden; süren etki alanı yok.', yol: '`boyut.erisimFt` kısmi (P1).' },
  { kalip: 'Eşya üretme / sarf eşyası (iksir, ok, bomba yaratma)', neden: '`consumables` savaş başında karakterden.', yol: '`use_item` + süreli sarf eşyası ilkeli (P1 adayı).' },
];

export function belgeMetni(): string {
  const L: string[] = [];
  L.push('# Ek paket ilkelleri (Görev P0)', '');
  L.push('Bu belge `src/content/ilkelSema.ts` tablosundan üretilir (`npx vite-node scripts/paket-ilkeller-belge.ts`); elle düzenleme. Şema, doğrulayıcı (`npm run check:icerik`) ve savaş yorumlayıcısı (`src/battle/paket/`) aynı tabloyu okur. Örnekler kurgusal ve SRD tarzıdır.', '');
  L.push('## Özet', '');
  L.push('Ek paket alt sınıfının her özelliği `ilkeller` dizisi taşıyabilir: `"ilkeller": [{ "tur": "ekHasar", ... }, ...]`. Eski alanlar (`effect`: stat, trait, reaction, effect) aynen çalışır; ikisi birlikte de yazılabilir. Paket düzeyinde `yaratiklar` dizisi `cagir` ilkelinin çağırdığı yaratıkları tanımlar.', '');
  L.push(`İlkeller (${Object.keys(ILKELLER).length}):`, '');
  L.push('| İlkel | Ne yapar | Tetikler | Mevcut sistem |', '|---|---|---|---|');
  for (const [k, s] of Object.entries(ILKELLER)) L.push(`| \`${k}\` | ${cell(s.not)} | ${s.tetikler.map((t) => `\`${t}\``).join(', ')} | ${cell(s.sistem)} |`);
  L.push('');
  L.push('## Ortak kurallar', '');
  L.push('- **Tetik** (`tetik`): ' + TETIKLER.map((t) => `\`${t}\``).join(', ') + '. Yazılmazsa ilkelin ilk izinli tetiği.');
  L.push(`- **Düğme:** aynı özellikte aynı düğme tetikli (${DUGME_TETIKLERI.map((t) => `\`${t}\``).join(', ')}) ilkeller tek düğmede birleşir ve sırayla çalışır; düğme bir hedef (dost/düşman) ve/veya bir altıgen ister (ilkellerin ihtiyacına göre). Kaynağı düğmedeki ilk \`kaynak\` alanlı ilkel belirler; düğme başına bir kez harcanır. \`eylem\` eylem, \`bonus\` bonus eylem harcar, \`serbest\` harcamaz.`);
  L.push('- **Otomatik tetikler:** `isabet` (kendi saldırın isabet edince; ek hasar zarı hasardan önce, diğerleri sonra), `turBasi`/`turSonu` (kendi turun), `savasBasi` (savaş başlarken), `oldurunce` (komutunla bir düşman 0 HP\'ye düşünce), `hasarAlinca` (hasar alınca), `sifirCan` (0 HP\'ye düşecekken), `tepki` (tepki hakkı; oyuncuya sorulur). `pasif` sürekli (koşullu olanlar her komut sonunda eşitlenir).');
  L.push('- **Formül:** sayı, zar ve belirteçler: ' + ['$pb (yeterlilik)', '$pbYari (yarısı, en az 1)', '$lvl (karakter seviyesi)', '$lvl2 (iki katı)', '$str…$cha (değiştirici, en az 0)', '$buyu (büyü değiştiricisi)'].map((x) => `\`${x}\``).join(', ') + '. En çok bir zar terimi; yalnız `+` ve `-` (çarpma yok): `"1d8+$wis"`, `"$lvl+2"`. Seviye tablosu: `{ "3": "1d6", "11": "2d6" }` (karakter seviyesine göre en yüksek eşik).');
  L.push('- **Koşul** (`kosul`, hepsi doğru olmalı): ' + KOSULLAR.map((k) => `\`${k}\``).join(', ') + ', `bicim:<id>` (bu özelliğin `bicim` ilkeli etkin), `isaretli:<id>` (hedef senin bu işaretinle işaretli).');
  L.push('- **Kaynak:** `{ "id": "...", "maliyet": 1 }`; kimlik aynı alt sınıftaki bir `kaynak` ilkelinin `id`\'si ya da sınıf kaynağı (`rage`, `focus`, `channelDivinity`, `bardicInspiration`, `sorceryPoints`, `wildShape`, `layOnHands`…). Kaynak bitince düğme kapanır, otomatik tetik çalışmaz.');
  L.push('- **Süre:** tur sayısı ya da `"kalici"`. Kurtulma DC\'si: `"buyu"`, sayı ya da yetenek listesi (8 + PB + en iyisi).');
  L.push('- **Kısmi:** tabloda **Kısmi** işaretli alanlar doğrulanır ama motorda yaklaşık uygulanır; böyle bir alan kullanan özellik `"kismi"` durumuyla yazılmalı (`check:icerik` uyarır).', '');
  L.push('### Ortak alanlar (her ilkelde)', '');
  L.push(...table(ORTAK_ALANLAR), '');
  for (const [k, s] of Object.entries(ILKELLER)) {
    L.push(`## \`${k}\``, '');
    L.push(s.not, '');
    L.push(`- Tetikler: ${s.tetikler.map((t) => `\`${t}\``).join(', ')} (varsayılan \`${s.tetikler[0]}\`).`);
    if (s.hedefler) L.push(`- Hedefler: ${s.hedefler.map((t) => `\`${t}\``).join(', ')} (varsayılan \`${s.hedefler[0]}\`).`);
    L.push(`- Sistem ve kanca: ${s.sistem}`, '');
    L.push(...table(s.alanlar), '');
    L.push('Örnek:', '', '```json', JSON.stringify(s.ornek), '```', '');
  }
  L.push('## Çağrı yaratığı (`yaratiklar`)', '');
  L.push('Paket düzeyinde (alt sınıfların yanında) `"yaratiklar": [ ... ]`. `cagir` ilkeli `yaratik` alanıyla buna başvurur. Yaratık R3 çağırma yolundan sıraya girer (`summoned` olayı yaratığın tamamını taşır: replay ve kayıt paket silinse de aynı). Biçim SRD canavar şemasıyla aynı alanların Türkçe karşılığı.', '');
  L.push(...table(YARATIK_ALANLARI), '');
  L.push('### Saldırı (`saldirilar[]`)', '');
  L.push(...table(SALDIRI_ALANLARI), '');
  L.push('### Jeton', '');
  L.push('Yeni görsel dosyası gerekmez. `jeton.gorsel` mevcut bir canavar kimliği (`public/monsters/<id>.webp`) ya da arketiptir; `ton` renk tonunu kaydırır (CSS `hue-rotate`, derece), `halka` jetonun altına renkli halka çizer (çizim anında; `src/ui/Avatar.tsx`). Görsel yoksa ya da tanınmazsa yedek arketip (`' + JETON_YEDEK + '`) kullanılır; bu hata değil uyarıdır (`check:icerik` "jetonYedek").', '');
  L.push('| Arketip | Ödünç görsel |', '|---|---|');
  for (const [a, m] of Object.entries(JETON_ARKETIP)) L.push(`| \`${a}\` | \`${m}\` |`);
  L.push('', 'Örnek:', '', '```json');
  L.push(JSON.stringify({ id: 'kul-kurdu', ad: { tr: 'Kül Kurdu', en: 'Ash Wolf' }, boyut: 'M', tur: 'beast', ac: '12+$pbYari', hp: { 3: 15, 11: 40 }, hiz: { yurume: 40 },
    yetenekler: { str: 12, dex: 15, con: 12, int: 3, wis: 12, cha: 6 }, saldirilar: [{ ad: 'Isırık', tur: 'yakin', bonus: 'sahip', hasar: '1d6+$pb', hasarTuru: 'piercing', ek: { prone: { maxSize: 'M', save: { ability: 'str', dc: 11 } }, status: 'uygulandı' } }],
    ozellikler: ['surudeTaktik'], jeton: { gorsel: 'kurt', ton: 200, halka: '#7fb3ff' } }));
  L.push('```', '');
  L.push('## Kalıba uymayan (ilkel olmayan) kalıplar: ilk tahmin', '');
  L.push('| Kalıp | Neden ilkel değil | Yol |', '|---|---|---|');
  for (const k of KALIBA_UYMAYAN) L.push(`| ${cell(k.kalip)} | ${cell(k.neden)} | ${cell(k.yol)} |`);
  L.push('');
  L.push('## Yazım kılavuzu', '');
  L.push('1. Özelliği oku; savaşta ne yaptığını tek cümleyle yaz (tetik + hedef + etki). Savaş dışıysa `"status": "hikaye"`, ilkel yazma.');
  L.push('2. Kullanım sınırı varsa önce bir `kaynak` ilkeli yaz (`id`, `sayi`, `yenilenme`) ya da sınıf kaynağını kullan.');
  L.push('3. Etkiyi yukarıdaki ilkellerden kur: bir düğmede birden çok ilkel olabilir (örn. `isinlan` + `gecicCan`, ikisi `"tetik": "bonus"`). Koşulları `kosul` ile, sınırları `turdaBir` ve `kaynak` ile ver.');
  L.push('4. Yaratık çağırıyorsa paket düzeyinde `yaratiklar` tanımla, `cagir.yaratik` ile başvur; jeton için arketip ya da canavar kimliği, isteğe bağlı `ton`/`halka`.');
  L.push('5. Durum etiketi: ilkeller özelliği tam karşılıyorsa `"calisir"`; bir kısmı eksik ya da **Kısmi** alan kullanıyorsa `"kismi"`; ilkelle karşılanamıyorsa `"calismiyor"` (motorda sistem bekliyorsa `"planli"`, savaş dışıysa `"hikaye"`). `calisir`/`kismi` yalnız `ilkeller` (ya da ok/partial `effect`) varken geçerlidir; ilkelsiz `calisir` hata verir.');
  L.push('6. `npm run check:icerik` çalıştır. Çıktıda hata satırı `alt-sinif/ozellik ilkeller[2].zar ilkelDeger` biçimindedir: alt sınıf ve özellik kimliği, ilkelin dizideki sırası, alan adı ve hata kodu (metin yazılmaz).');
  L.push('', '### Hata kodları', '');
  L.push('| Kod | Anlamı |', '|---|---|');
  for (const [k, d] of [['ilkelTur', 'bilinmeyen ilkel adı (`tur`)'], ['ilkelAlan', 'ilkelde (ya da yaratıkta) bilinmeyen alan'], ['ilkelDeger', 'geçersiz değer (tip, seçenek, formül sözdizimi, tetik/hedef bu ilkelde izinli değil)'],
    ['ilkelEksik', 'zorunlu alan yok'], ['yaratikRef', '`cagir.yaratik` paketin yaratıklarında yok'], ['kaynakRef', '`kaynak.id` alt sınıfın kaynaklarında ya da sınıf kaynaklarında yok'],
    ['effectStatus', '`calisir`/`kismi` ama ilkel ya da çalışan etki yok (ya da tersi)'], ['jetonYedek', '(uyarı) jeton görseli yok ya da tanınmadı; yedek arketip']] as const) L.push(`| \`${k}\` | ${d} |`);
  L.push('');
  return L.join('\n');
}
