/**
 * Mekanik matris: CSV ve Markdown raporu. Bulgular kök nedene göre gruplanır (`KATALOG`); bir satır ilk eşleşen bulguya
 * bağlanır. Katalogdaki `sonuc` satırın sonucunu yeniden sınıflandırabilir (yorum gerektiren kalemler "karar bekliyor").
 */
import type { Satir, Sonuc } from './ortak';
import { CURRENT_RULES } from '../../battle/ruleVersion';

export interface Bulgu {
  id: string;
  sonuc: Sonuc;
  baslik: string;
  neden: string;
  oneri: string;
  /** Satır bu bulguya mı ait. */
  eslesir: (r: Satir) => boolean;
}

const ad = (r: Satir, ...names: string[]) => names.some((n) => r.ad === n || r.ad.startsWith(`${n}:`));
const bag = (r: Satir, s: string) => r.baglam.includes(s);
const kotu = (r: Satir) => r.sonuc !== 'doğru';

export const KATALOG: Bulgu[] = [
  { id: 'B01', sonuc: 'yanlış', baslik: 'Restrained hedefin DEX save\'i dezavantajlı atılmıyor',
    neden: 'SRD 5.2.1 Restrained: "You have Disadvantage on Dexterity saving throws." `saveMode` (src/battle/durations.ts) Restrained\'ı hiç okumuyor; büyü, canavar nefesi ve alan save\'lerinin hepsi normal kipte.',
    oneri: '`saveMode` içinde `ability === \'dex\' && s.conditions.includes(\'Restrained\')` → dezavantaj (yeni kural sürümüyle kapılı; eski kayıtlar aynı kalsın).',
    eslesir: (r) => kotu(r) && bag(r, 'DEX save dezavantajı') },
  { id: 'B02', sonuc: 'yanlış', baslik: '"Görebildiğin yaratık" isteyen büyüler Invisible hedefe yapılabiliyor',
    neden: 'SRD 5.2.1 Invisible: "You aren\'t affected by any effect that requires its target to be seen unless the effect\'s creator can somehow see you." Büyü metni "a creature (that) you can see" dediği hâlde motor Invisible hedefi kabul ediyor (görme yeteneği olmayan büyücüyle).',
    oneri: 'Büyü verisine SRD metninden "görme gerekir" bayrağı (ör. `seen: true`) ekleyip `castSpell`/`executeEffect`/`executeTrueStrike` hedef denetiminde Invisible hedefi, büyücü onu göremiyorsa (See Invisibility, Truesight, Blindsight menzili yoksa; `sight.ts` `sightConditions`/`truesightSees`) reddetmek.',
    eslesir: (r) => kotu(r) && r.tur === 'büyü' && bag(r, 'hedef Invisible') && r.beklenen.startsWith('red') },
  { id: 'Ç01', sonuc: 'çökme', baslik: 'Blowgun her isabette istisna fırlatıyor ("Geçersiz zar ifadesi: \\"1+2\\"")',
    neden: 'Blowgun hasarı sabit "1"; `weaponAttackOptions` (src/battle/weapons.ts `optionFor`) DEX değiştiricisini "1+2" diye ekliyor, `parseDice` sabit+sabit ifadesini ayrıştıramıyor. Iskada zar atılmadığı için yalnız isabet/kritik bağlamları çöküyor.',
    oneri: '`optionFor` içinde zar sabitse (`/^\\d+$/`) toplamı tek sabit yaz (`String(Number(dice) + bonus)` ya da `formatDice(0, 1, n)`).',
    eslesir: (r) => r.sonuc === 'çökme' && r.ad.startsWith('Blowgun') },
  { id: 'B03', sonuc: 'yanlış', baslik: 'Counterspell ile durdurulan 6.–9. seviye büyülerin etkisi yine uygulanıyor',
    neden: 'src/battle/spells.ts `executeCast`: `executeCastOver` Counterspell\'le durdurulmuş (slot harcanmamış) sonuç döndürse de `after69` kancası çalışıyor; Power Word Kill hasar veriyor, Power Word Stun etki koyuyor, Prismatic Spray, Mass Heal ve Reverse Gravity uygulanıyor.',
    oneri: '`executeCastWith` durdurmayı işaretlesin (ör. `countered: true`); `executeCast` bu durumda `after69` ve sonrası kancaları atlasın.',
    eslesir: (r) => kotu(r) && bag(r, 'Counterspell') && ad(r, 'Power Word Kill', 'Power Word Stun', 'Prismatic Spray', 'Mass Heal', 'Reverse Gravity') },
  { id: 'B04', sonuc: 'yanlış', baslik: 'Tepki büyüleri eylemle yapılabiliyor (Shield, Counterspell, Feather Fall, Hellish Rebuke)',
    neden: 'SRD: yapım süresi "Reaction, which you take when …". `cast_spell` komutu bunları eylemle kabul ediyor; slot harcanıyor, tetik olmadığı için etki yok (A0 bulgusu, hâlâ açık).',
    oneri: 'Büyü verisinde `castingTime: reaction` olanları `cast_spell` komutunda reddetmek (tepki akışı `reactions.ts` ayrı yoldan yapıyor).',
    eslesir: (r) => kotu(r) && bag(r, 'eylemle yapım') },
  { id: 'B05', sonuc: 'yanlış', baslik: 'Alan büyülerinin yapım anı save\'i eksik ya da tetik zamanı yanlış',
    neden: 'SRD: Incendiary Cloud "When the cloud appears … each creature in it makes a DEX save" ve giriş/tur sonu; veride `zone.on` = enter, end (cast yok). Wall of Thorns yapımda DEX 7d8 Piercing, giriş/tur sonunda 7d8 Slashing; veride yalnız enter. Blade Barrier yapımda save + giriş/tur sonu; veride enter, start. Conjure Celestial yapımda her yaratığa Searing Light (DEX 6d12) + giriş/tur sonu; veride enter, start. Storm of Vengeance belirince CON save, 2d6 Thunder + Deafened; veride yalnız aşamalı tur başı.',
    oneri: 'Büyü verisinde `zone.on` listelerini SRD\'ye çekmek (cast ekle; start → end), Wall of Thorns için yapım ve tetik hasar türlerini ayırmak, Storm of Vengeance\'a yapım anı save + Deafened eklemek.',
    eslesir: (r) => kotu(r) && ad(r, 'Incendiary Cloud', 'Wall of Thorns', 'Blade Barrier', 'Conjure Celestial', 'Storm of Vengeance') },
  { id: 'B06', sonuc: 'yanlış', baslik: 'Wall of Ice kesme hasarı save\'siz tam uygulanıyor',
    neden: 'SRD: duvarın kestiği yaratık itilir ve DEX save atar; başarıda yarı hasar. Motor 10d6 Cold\'u save olayı olmadan tam veriyor (`walls.ts` `cutDamage`).',
    oneri: '`cutDamage` yolunda DEX save (büyücünün DC\'si) ve başarıda yarı hasar; `save_resolved` olayı.',
    eslesir: (r) => kotu(r) && ad(r, 'Wall of Ice') },
  { id: 'B07', sonuc: 'yanlış', baslik: 'Ensnaring Strike: Large ve büyük hedefin save avantajı hiç verilmiyor',
    neden: 'src/battle/spells.ts (`executeSmite`, `largeAdvantage`): boyut `[\'Large\',\'Huge\',\'Gargantuan\'].includes(hit.size)` ile sınanıyor; savaşçı boyutları `L/H/G` kodlarıyla saklanıyor, koşul hiç tutmuyor.',
    oneri: 'Karşılaştırmayı `[\'L\',\'H\',\'G\']` yapmak.',
    eslesir: (r) => kotu(r) && ad(r, 'Ensnaring Strike') && bag(r, 'Large') },
  { id: 'B08', sonuc: 'yanlış', baslik: 'Sacred Flame siperden yararlandırıyor',
    neden: 'SRD: "The target gains no benefit from Half Cover or Three-Quarters Cover for this save." Motor DEX save\'e +2/+5 ekliyor.',
    oneri: 'Büyü verisine `ignoresCover` bayrağı; `castSpell` save yolunda `dexCover = 0`.',
    eslesir: (r) => kotu(r) && ad(r, 'Sacred Flame') && bag(r, 'siper') },
  { id: 'B09', sonuc: 'yanlış', baslik: 'Arcane Sword hasarına büyü yeteneği değiştiricisi eklenmiyor',
    neden: 'SRD: "Force damage equal to 4d12 plus your spellcasting ability modifier". Motor 4d12 atıyor; konsantrasyon DC\'si de düşük hesaplanıyor.',
    oneri: 'data/spells-69.json Arcane Sword mekaniğine `addCastingMod: true`.',
    eslesir: (r) => kotu(r) && ad(r, 'Arcane Sword') && !bag(r, 'Prone') },
  { id: 'B10', sonuc: 'yanlış', baslik: 'Arcane Hand yapımda etki uygulamıyor',
    neden: 'SRD: "When you cast the spell and as a Bonus Action on your later turns, you can move the hand … and then cause one of the following effects" (Clenched Fist 5d8 Force…). Motor eli çağırıyor ama yapım anında etki yok.',
    oneri: 'Çağrıdan hemen sonra bir el etkisi seçimi (yapım komutunda `choice` + hedef) ya da aynı turda bedava ilk etki.',
    eslesir: (r) => kotu(r) && ad(r, 'Arcane Hand') },
  { id: 'B11', sonuc: 'yanlış', baslik: 'Prismatic Spray hasar ışınlarında başarılı save yarı hasar vermiyor',
    neden: 'SRD Prismatic Rays (Red–Blue): "Failed Save: 12d6 … Successful Save: Half as much damage." Motor başarılı save\'de tam hasar uyguluyor.',
    oneri: 'src/battle/spells69.ts Prismatic Spray ışın çözümünde başarıda `Math.floor(raw / 2)`.',
    eslesir: (r) => kotu(r) && ad(r, 'Prismatic Spray') && !bag(r, 'Counterspell') },
  { id: 'B12', sonuc: 'yanlış', baslik: 'Chain Lightning yukarı slotta ek hedef eklemiyor',
    neden: 'SRD: "One additional bolt leaps from the first target to another target for each spell slot level above 6." Veride `extraTargets: 3` sabit, `upcast.other` uygulanmış görünse de hedef sayısı artmıyor.',
    oneri: 'Ek hedef sayısı = 3 + (slot − 6).',
    eslesir: (r) => kotu(r) && ad(r, 'Chain Lightning') && bag(r, 'yukarı slot') },
  { id: 'B13', sonuc: 'yanlış', baslik: 'Holy Aura dostlara yapılamıyor',
    neden: 'SRD: büyücüden 30 ft yayılım; seçilen yaratıklar yararlanır. Veride menzil 0 (Self) ve hedef dost listesi: motor her dostu "menzil dışında" reddediyor, yalnız büyücü etkilenebiliyor.',
    oneri: 'Etkiyi 30 ft içindeki seçilen dostlara (menzil denetimi yayılım yarıçapıyla) uygulamak.',
    eslesir: (r) => kotu(r) && ad(r, 'Holy Aura') },
  { id: 'B14', sonuc: 'yanlış', baslik: 'Weird dostları da etkiliyor',
    neden: 'SRD: "Each creature of your choice in a 30-foot-radius Sphere". Veride alan `targets: all`.',
    oneri: 'Weird alanını `targets: enemies` (seçilen yaratıklar) yapmak.',
    eslesir: (r) => kotu(r) && ad(r, 'Weird') && bag(r, 'dost ateşi') },
  { id: 'B15', sonuc: 'yanlış', baslik: 'Compulsion alanı SRD menzilinden geniş',
    neden: 'SRD: 30 ft menzilde, görülen ve seçilen yaratıklar. Motor 30 ft yarıçaplı küreyi büyücünün 15 ft önüne kuruyor; 45 ft\'teki yaratık da etkileniyor.',
    oneri: 'Compulsion\'ı büyücü merkezli 30 ft yayılım (seçilen düşmanlar) olarak tanımlamak.',
    eslesir: (r) => kotu(r) && ad(r, 'Compulsion') },
  { id: 'B16', sonuc: 'yanlış', baslik: 'Suggestion ve Mass Suggestion birkaç turda kendiliğinden bitiyor; Mass Suggestion Charmed vermiyor',
    neden: 'SRD: Suggestion Konsantrasyon en çok 8 saat, Mass Suggestion 24 saat (büyücü ya da dostları hasar verene dek); her ikisi Charmed. Motorda etki `until` = yapım turu + 1 (komut etkisi `commandPersist` olsa da 4. turda etki yok); Mass Suggestion etkisinde `grants: Charmed` yok.',
    oneri: 'Etkinin `until` değerini büyü süresinden almak (komut her tur yenilenebilir), Mass Suggestion\'a `grants: [\'Charmed\']`.',
    eslesir: (r) => kotu(r) && ad(r, 'Suggestion', 'Mass Suggestion') && !bag(r, 'Invisible') },
  { id: 'B17', sonuc: 'yanlış', baslik: 'Protection from Energy süresi 10 dakika',
    neden: 'SRD: Konsantrasyon, en çok 1 saat (600 tur). Veride `rounds: 100`.',
    oneri: 'data/spells.json Protection from Energy `effect.rounds: 600`.',
    eslesir: (r) => kotu(r) && ad(r, 'Protection from Energy') },
  { id: 'B18', sonuc: 'yanlış', baslik: 'Shining Smite işaretli hedefin Invisible yararını kaldırmıyor',
    neden: 'SRD: hedef "can\'t benefit from the Invisible condition"; işaretli Invisible hedefe saldırı avantajlı olmalı. Motor avantajı veriyor ama Invisible dezavantajını da sürdürüyor (sonuç normal).',
    oneri: 'Shining Smite koruma/ışık etkisinde hedefe `revealed` (Faerie Fire gibi) koymak.',
    eslesir: (r) => kotu(r) && ad(r, 'Shining Smite') },
  { id: 'B19', sonuc: 'yanlış', baslik: 'İki hasar türlü büyülerde yüzey verisi eski alanlardan okunuyor (Ice Storm, Flame Strike)',
    neden: 'Ice Storm ve Flame Strike hasarı `split` ile doğru (SRD 2d10 Bludgeoning + 4d6 Cold; 5d6 Fire + 5d6 Radiant), ama `spell_cast.area` eski `damage`/`damageType` alanlarını taşıyor: altıgen çözücüsü Ice Storm için eski 7d6 zarını atıyor, Flame Strike alanı Radiant sayıldığından yağı tutuşturmuyor.',
    oneri: '`executeAreaCast` alan olayında `split` varken hasar türü/zarı split\'ten (ateş parçası) yazmak; eski alanları veriden kaldırmak.',
    eslesir: (r) => kotu(r) && ((ad(r, 'Ice Storm') && r.not.includes('zar')) || (ad(r, 'Flame Strike') && bag(r, 'yüzey'))) },
  { id: 'B20', sonuc: 'yanlış', baslik: 'Alan (zone) yoluyla verilen ateş hasarı yüzey tablosuna girmiyor (Wall of Fire)',
    neden: 'Yüzey tablosunun `fireOil` satırı ateş hasarı değen yağı tutuşturur; `hexResolver.incomingOf` yalnız alan/isabet/save olaylarını okuyor, alan tetiğinin hasarını okumuyor.',
    oneri: '`incomingOf` alan tetiğinden (`zone_triggered` + hasar) element üretsin.',
    eslesir: (r) => kotu(r) && ad(r, 'Wall of Fire') && bag(r, 'yüzey') },
  { id: 'U01', sonuc: 'uygulanmıyor', baslik: 'Irresistible Dance Charmed durumunu vermiyor',
    neden: 'SRD 5.2.1: başarısız save\'de hedef büyü süresince Charmed; dans etkileri Charmed iken. Motor dans etkisini uyguluyor ama Charmed durumu yok (Charmed\'a bağlı kurallar: büyüleyene saldıramama, Countercharm vb. işlemez).',
    oneri: 'Etkiye `grants: [\'Charmed\']`.',
    eslesir: (r) => kotu(r) && ad(r, 'Irresistible Dance') && !bag(r, 'Charmed (hedef') },
  { id: 'U02', sonuc: 'uygulanmıyor', baslik: 'Control Water savaş dışı işaretli',
    neden: 'SRD: Action, konsantrasyon; girdap seçeneği 2d8 Bludgeoning ve STR save. Oyunda savaş dışı (Game Master notu).',
    oneri: 'Kapsam kararı: girdabı alan olarak eklemek ya da savaş dışı kalmasını DECISIONS\'a yazmak.',
    eslesir: (r) => kotu(r) && ad(r, 'Control Water') },
  { id: 'K01', sonuc: 'karar bekliyor', baslik: 'Charmed büyücü, büyüleyenine zarar vermeyen büyü yapabilir mi?',
    neden: 'SRD 5.2.1 Charmed: "You can\'t attack the charmer or target the charmer with damaging abilities or magical effects." "damaging" sözcüğünün "magical effects"i de nitelediği okunursa zarar vermeyen büyüler (Hold Person, Bane, Charm Person…) serbest; motor hepsini reddediyor (katı okuma).',
    oneri: 'Okuma kararı; katı okuma korunacaksa DECISIONS\'a yazmak.',
    eslesir: (r) => r.sonuc === 'karar bekliyor' && bag(r, 'büyücü Charmed') },
  { id: 'K02', sonuc: 'karar bekliyor', baslik: 'Spirit Guardians ve Conjure Woodland Beings yapımda içerideki yaratığa save attırır mı?',
    neden: 'SRD 5.2.1: "whenever the Emanation enters a creature\'s space …" Yapım anında yayılımın "girdiği" sayılıp sayılmayacağı yoruma açık; motor yapımda save attırıyor.',
    oneri: 'Okuma kararı (motor davranışı yaygın masa yorumuyla uyumlu).',
    eslesir: (r) => r.sonuc === 'karar bekliyor' && ad(r, 'Spirit Guardians', 'Conjure Woodland Beings') },
  { id: 'K03', sonuc: 'karar bekliyor', baslik: 'Güç/kılıç/ruh saldırısında Prone kuralı kimin uzaklığından? (Spiritual Weapon, Arcane Sword, Conjure Fey)',
    neden: 'SRD Prone: "Attack rolls against you have Advantage if the attacker is within 5 feet of you." Saldırıyı büyücü yapar ama güç hedefin 5 ft içinden vurur; motor büyücünün uzaklığını kullanıyor (Prone hedefe dezavantaj).',
    oneri: 'Okuma kararı; gücün yeri sayılacaksa `attackSources` 5 ft denetimi güç/çağrı altıgeninden.',
    eslesir: (r) => kotu(r) && bag(r, 'hedef Prone (yakın: avantaj)') && ad(r, 'Spiritual Weapon', 'Arcane Sword', 'Conjure Fey') },
  { id: 'K04', sonuc: 'karar bekliyor', baslik: 'Conjure Elemental: yakalandığı tur başında tutsak tekrar save\'i de atar mı?',
    neden: 'SRD: yaratık ruhun 5 ft içinde turuna başlayınca save (8d8 + Restrained); "At the start of each of its turns, the Restrained target repeats the save" (4d8). Motor aynı tur başında ikisini de uyguluyor (12d8).',
    oneri: 'Okuma kararı; tekrarın sonraki turdan başlaması daha muhafazakâr.',
    eslesir: (r) => kotu(r) && ad(r, 'Conjure Elemental') && bag(r, 'tetik') },
];

const CSV_COLS: Array<[keyof Satir | 'bulgu', string]> = [
  ['tur', 'tür'], ['ad', 'büyü/saldırı'], ['seviye', 'seviye'], ['siniflar', 'sınıflar'], ['mekanik', 'mekanik'], ['baglam', 'bağlam'], ['kategori', 'bağlam sınıfı'],
  ['beklenen', 'beklenen'], ['gercek', 'gerçek'], ['sonuc', 'sonuç'], ['bulgu', 'bulgu'], ['not', 'not'],
];

const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export interface Sinifli extends Satir { bulgu: string }

export function siniflandir(rows: Satir[]): Sinifli[] {
  return rows.map((r) => {
    const b = KATALOG.find((k) => k.eslesir(r));
    if (!b) return { ...r, bulgu: '' };
    // Katalog, yoruma bağlı kalemleri "karar bekliyor"a çeker (gerekçesi bulgu kaydında).
    const sonuc: Sonuc = b.sonuc === 'karar bekliyor' && r.sonuc !== 'doğru' ? 'karar bekliyor' : r.sonuc;
    return { ...r, sonuc, bulgu: b.id };
  });
}

export function csv(rows: Sinifli[]): string {
  const head = CSV_COLS.map(([, h]) => h).join(',');
  return `﻿${head}\n${rows.map((r) => CSV_COLS.map(([k]) => esc(String((r as unknown as Record<string, unknown>)[k] ?? ''))).join(',')).join('\n')}\n`;
}

const pct = (a: number, b: number) => (b ? `${((100 * a) / b).toFixed(1)}%` : '—');
const SONUCLAR: Sonuc[] = ['doğru', 'yanlış', 'çökme', 'uygulanmıyor', 'karar bekliyor'];
const SINIFLAR = ['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard'];

function tally(rows: Sinifli[]): Record<Sonuc, number> {
  const o = Object.fromEntries(SONUCLAR.map((s) => [s, 0])) as Record<Sonuc, number>;
  for (const r of rows) o[r.sonuc]++;
  return o;
}

export function markdown(rows: Sinifli[], ms: number): string {
  const t = tally(rows);
  const total = rows.length;
  const L: string[] = [];
  const spellRows = rows.filter((r) => r.tur === 'büyü');
  const wRows = rows.filter((r) => r.tur === 'silah');
  const mRows = rows.filter((r) => r.tur === 'canavar');
  const spells = new Set(spellRows.map((r) => r.ad));
  const weapons = new Set(wRows.map((r) => r.ad));
  const attacks = new Set(mRows.map((r) => r.ad));
  L.push('# Mekanik doğrulama matrisi (APK öncesi)', '');
  L.push(`Üretim: \`npx vite-node src/sim/mekanikMatris.ts -- --yaz\` (tek süreç, ≈${Math.round(ms / 1000)} sn). Kural sürümü ${CURRENT_RULES}. Mekaniğe dokunulmadı; yalnız ölçüm.`);
  L.push('Satır satır sonuçlar: [`mekanik-matris.csv`](mekanik-matris.csv) (UTF-8, virgülle ayrılmış; sütunlar: tür, büyü/saldırı, seviye, sınıflar, mekanik, bağlam, bağlam sınıfı, beklenen, gerçek, sonuç, bulgu, not).', '');
  L.push('## Özet', '');
  L.push(`- Toplam satır: **${total}** (büyü ${spellRows.length} satır / ${spells.size} büyü; silah ${wRows.length} satır / ${weapons.size} seçenek; canavar ${mRows.length} satır / ${attacks.size} saldırı).`);
  L.push(`- Doğru oranı: **${pct(t['doğru'], total)}** (${t['doğru']}/${total}); karar bekleyenler hariç ${pct(t['doğru'], total - t['karar bekliyor'])}.`);
  L.push(`- Sonuçlar: doğru ${t['doğru']} · yanlış ${t['yanlış']} · çökme ${t['çökme']} · uygulanmıyor ${t['uygulanmıyor']} · karar bekliyor ${t['karar bekliyor']}.`);
  const kok = KATALOG.filter((k) => rows.some((r) => r.bulgu === k.id && r.sonuc !== 'doğru'));
  L.push(`- Kök nedene göre: ${kok.filter((k) => k.sonuc === 'yanlış').length} yanlış, ${kok.filter((k) => k.sonuc === 'çökme').length} çökme, ${kok.filter((k) => k.sonuc === 'uygulanmıyor').length} uygulanmıyor, ${kok.filter((k) => k.sonuc === 'karar bekliyor').length} karar bekleyen bulgu.`, '');
  L.push('| Tür | Satır | Doğru | Yanlış | Çökme | Uygulanmıyor | Karar bekliyor | Doğru oranı |', '|---|---:|---:|---:|---:|---:|---:|---:|');
  for (const [k, rs] of [['Büyü', spellRows], ['Silah', wRows], ['Canavar', mRows]] as Array<[string, Sinifli[]]>) {
    const x = tally(rs);
    L.push(`| ${k} | ${rs.length} | ${x['doğru']} | ${x['yanlış']} | ${x['çökme']} | ${x['uygulanmıyor']} | ${x['karar bekliyor']} | ${pct(x['doğru'], rs.length)} |`);
  }
  L.push('');
  // Sınıflara göre yanlış dağılımı.
  L.push('## Yanlış dağılımı', '', '### Sınıflara göre (büyünün sınıf listesi; bir büyü birden çok sınıfta sayılır)', '');
  L.push('| Sınıf | Büyü satırı | Yanlış | Çökme | Uygulanmıyor | Karar bekliyor | Yanlış oranı |', '|---|---:|---:|---:|---:|---:|---:|');
  for (const c of SINIFLAR) {
    const rs = spellRows.filter((r) => r.siniflar.split(', ').includes(c));
    const x = tally(rs);
    L.push(`| ${c} | ${rs.length} | ${x['yanlış']} | ${x['çökme']} | ${x['uygulanmıyor']} | ${x['karar bekliyor']} | ${pct(x['yanlış'], rs.length)} |`);
  }
  for (const [k, rs] of [['Silah (karakter)', wRows], ['Canavar saldırısı', mRows]] as Array<[string, Sinifli[]]>) {
    const x = tally(rs);
    L.push(`| ${k} | ${rs.length} | ${x['yanlış']} | ${x['çökme']} | ${x['uygulanmıyor']} | ${x['karar bekliyor']} | ${pct(x['yanlış'], rs.length)} |`);
  }
  L.push('', '### Bağlam sınıfına göre', '');
  L.push('| Bağlam sınıfı | Satır | Doğru | Yanlış | Çökme | Uygulanmıyor | Karar bekliyor |', '|---|---:|---:|---:|---:|---:|---:|');
  const kats = [...new Set(rows.map((r) => r.kategori))].sort();
  for (const k of kats) {
    const x = tally(rows.filter((r) => r.kategori === k));
    L.push(`| ${k} | ${rows.filter((r) => r.kategori === k).length} | ${x['doğru']} | ${x['yanlış']} | ${x['çökme']} | ${x['uygulanmıyor']} | ${x['karar bekliyor']} |`);
  }
  L.push('');
  // Bulgular (öncelik: yanlış, çökme, uygulanmıyor, karar).
  L.push('## Bulgular (kök nedene göre; öncelik sırası: yanlış → çökme → uygulanmıyor → karar bekliyor)', '');
  L.push('Düzeltme yapılmadı; öneriler onaydan sonra uygulanacak.', '');
  const order: Sonuc[] = ['yanlış', 'çökme', 'uygulanmıyor', 'karar bekliyor'];
  for (const s of order) {
    for (const k of KATALOG.filter((x) => x.sonuc === s)) {
      const rs = rows.filter((r) => r.bulgu === k.id && r.sonuc !== 'doğru');
      if (!rs.length) continue;
      const items = [...new Set(rs.map((r) => r.ad))];
      L.push(`### ${k.id} — ${k.baslik} (${s}; ${rs.length} satır)`, '');
      L.push(`- **Neden:** ${k.neden}`);
      L.push(`- **Öneri:** ${k.oneri}`);
      L.push(`- **Etkilenen (${items.length}):** ${items.slice(0, 60).join(', ')}${items.length > 60 ? `, … (+${items.length - 60})` : ''}`);
      const ex = rs[0] as Sinifli;
      L.push(`- **Örnek:** ${ex.ad} — ${ex.baglam}: beklenen \`${ex.beklenen.slice(0, 160)}\`, gerçek \`${ex.gercek.slice(0, 160)}\``, '');
    }
  }
  const rest = rows.filter((r) => r.sonuc !== 'doğru' && !r.bulgu);
  if (rest.length) {
    L.push('### Sınıflandırılmamış', '', '| Büyü/saldırı | Bağlam | Sonuç | Not |', '|---|---|---|---|');
    for (const r of rest) L.push(`| ${r.ad} | ${r.baglam} | ${r.sonuc} | ${r.not.replace(/\|/g, '/').slice(0, 160)} |`);
    L.push('');
  }
  // Büyü tablosu.
  L.push('## Büyü matrisi (büyü başına)', '');
  L.push('Sembol: ✓ doğru, ✗ yanlış, ‼ çökme, ∅ uygulanmıyor, ? karar bekliyor. Bağlamların ayrıntısı CSV\'de.', '');
  L.push('| Büyü | Sv | Mekanik | Satır | ✓ | ✗ | ‼ | ∅ | ? | Bulgu |', '|---|---:|---|---:|---:|---:|---:|---:|---:|---|');
  for (const name of [...spells].sort((a, b) => a.localeCompare(b))) {
    const rs = spellRows.filter((r) => r.ad === name);
    const x = tally(rs);
    const b = [...new Set(rs.filter((r) => r.sonuc !== 'doğru' && r.bulgu).map((r) => r.bulgu))].join(' ');
    L.push(`| ${name} | ${rs[0]?.seviye} | ${rs[0]?.mekanik} | ${rs.length} | ${x['doğru']} | ${x['yanlış']} | ${x['çökme']} | ${x['uygulanmıyor']} | ${x['karar bekliyor']} | ${b} |`);
  }
  L.push('', '## Silah matrisi', '', '| Silah seçeneği | Özellik | Satır | ✓ | ✗ | ‼ | Bulgu |', '|---|---|---:|---:|---:|---:|---|');
  for (const name of [...weapons]) {
    const rs = wRows.filter((r) => r.ad === name);
    const x = tally(rs);
    L.push(`| ${name} | ${rs[0]?.mekanik} | ${rs.length} | ${x['doğru']} | ${x['yanlış']} | ${x['çökme']} | ${[...new Set(rs.filter((r) => r.bulgu && r.sonuc !== 'doğru').map((r) => r.bulgu))].join(' ')} |`);
  }
  const badM = [...attacks].filter((n) => mRows.some((r) => r.ad === n && r.sonuc !== 'doğru'));
  L.push('', `## Canavar saldırıları`, '', `${attacks.size} saldırının ${attacks.size - badM.length} tanesinin bütün bağlamları doğru. Sorunlu olanlar:`, '');
  L.push('| Saldırı | Mekanik | Satır | ✗ | Bulgu |', '|---|---|---:|---:|---|');
  for (const n of badM) {
    const rs = mRows.filter((r) => r.ad === n);
    L.push(`| ${n} | ${rs[0]?.mekanik} | ${rs.length} | ${rs.filter((r) => r.sonuc !== 'doğru').length} | ${[...new Set(rs.filter((r) => r.bulgu && r.sonuc !== 'doğru').map((r) => r.bulgu))].join(' ')} |`);
  }
  L.push('');
  return L.join('\n');
}

export function yazRapor(rows: Satir[], ms = 0, fs?: { writeFileSync(p: string, d: string): void }, ek = ''): string[] {
  const s = siniflandir(rows);
  if (!fs) return [];
  fs.writeFileSync('harita/belgeler/mekanik-matris.csv', csv(s));
  fs.writeFileSync('harita/belgeler/MEKANIK-MATRIS.md', `${markdown(s, ms)}\n${ek}`);
  return ['harita/belgeler/MEKANIK-MATRIS.md', 'harita/belgeler/mekanik-matris.csv'];
}
