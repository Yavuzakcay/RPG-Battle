"""
K50: 11 imza alt sınıfın verisi → data/imza.json (alt sınıf kaydı + motor eylem/pasif tanımları). Kaynak belgeler
docs/imza-alt-siniflar/. Oyuncu metinleri imza-alt-siniflar-tum.md'deki sade metinler. Sayılar burada (kodda değil).
Durum: `calisir` motorda çalışır (yaklaşık olanlar `not` alanında), `planli` henüz motorda yok (kartta görünür).

    python scripts/k50-imza-veri.py
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SURUM = 23

def F(fid, level, tr, en, dtr, den, status='calisir'):
    return {'id': fid, 'level': level, 'name': {'tr': tr, 'en': en}, 'status': status, 'description': {'tr': dtr, 'en': den}}

alt = []
eylem = {}
pasif = []

def sub(sid, cls, tr, en, rtr, ren, feats, beceri=None, kural=True):
    d = {'id': sid, 'class': cls, 'ev': True, 'evKurali': sid if kural else None, 'name': {'tr': tr, 'en': en}, 'role': {'tr': rtr, 'en': ren}, 'features': feats}
    if beceri:
        d['ekBeceriler'] = beceri
    alt.append(d)

def act(sid, fid, **spec):
    if 'not_' in spec:
        spec['not'] = spec.pop('not_')
    eylem[f'imza:{sid}/{fid}'] = {'sinif': sid, 'ozellik': spec.pop('ozellikAdi', fid), **spec}

def pas(sid, fid, seviye, etki, not_=None):
    pasif.append({'sinif': sid, 'ozellik': fid, 'seviye': seviye, 'etki': etki, **({'not': not_} if not_ else {})})

PB = {'sayi': 'pb', 'yenilenme': 'short'}

# ---------------- Fighter: İmparator ----------------
s = 'imza_imparator'
sub(s, 'fighter', 'İmparator', 'Emperor', 'Komutan: dostlarını büyüten hükümdar', 'Commander: a ruler who lifts allies', [
    F('noble-upbringing', 3, 'Asil Terbiye', 'Noble Upbringing', 'İkna becerisinde ustasın (Korkutma yerine İkna varsayılan), bir dil daha bilirsin.', 'You gain Persuasion proficiency (default over Intimidation) and one language.'),
    F('decree', 3, 'Buyruk', 'Decree', 'Bir dostuna seslen: hemen bir saldırı yapar. Dinlenmeden önce birkaç kez kullanırsın.', 'Call to an ally: they make an attack at once. A few times between rests.'),
    F('crown-presence', 7, 'Taht Varlığı', 'Crown Presence', 'Etrafındaki dostlar (sen dahil) korkuya ve büyülenmeye karşı daha dirençli olur.', 'Nearby allies (you included) resist fear and charm better.'),
    F('royal-word', 7, 'Hükümdar Sözü', 'Royal Word', 'Bir düşmana emret; direnemezse bir tur boyunca sana vurmakta zorlanır.', 'Command a foe; if it fails to resist it struggles to hit you for a round.'),
    F('edict', 10, 'Ferman', 'Edict', 'Ek eylem kullandığında bir dostun da ek bir eylem kazanır.', 'When you surge, an ally also gains an extra action.', 'planli'),
    F('wider-throne', 10, 'Genişleyen Taht', 'Wider Throne', "Taht Varlığı'nın alanı büyür.", 'Crown Presence reaches farther.'),
    F('exalted-throne', 15, 'Yüce Taht', 'Exalted Throne', '10 tur boyunca dostların daha sert vurur, sen hasara dayanıklı olur ve canın yenilenir.', 'For 10 rounds allies hit harder, you resist damage and regain vigor.'),
    F('undying-throne', 15, 'Ölümsüz Taht', 'Undying Throne', 'Ölecekken bir kez 1 canla ayakta kalırsın.', 'Once, when you would drop, you stay up at 1 HP.'),
], beceri=['persuasion'])
act(s, 'decree', seviye=3, tur='bonus', kaynak={'id': 'imzaBuyruk', **PB}, hedef='ally', menzilFt=30, ozel='buyruk',
    ad='Buyruk', not_='Dost tepkisini harcamadan en yakın düşmana tek silah saldırısı yapar (yer değiştirme seçeneği yok).')
act(s, 'royal-word', seviye=7, tur='bonus', kaynak={'id': 'imzaHukumdar', 'sayi': 1, 'yenilenme': 'short'}, hedef='enemy', menzilFt=60,
    save={'yetenek': 'wis', 'dc': ['str', 'cha']}, etki={'name': 'Hükümdar Sözü', 'sure': 1, 'attackDisVs': '$actor', 'icon': '👑'},
    ad='Hükümdar Sözü', not_='Dezavantaj yalnız sana karşı (yanındaki dostlar hariç).')
act(s, 'exalted-throne', seviye=15, tur='bonus', kaynak={'id': 'imzaYuceTaht', 'sayi': 1, 'yenilenme': 'long'}, hedef='allies', yaricapFt=30, kendisi=True,
    etki={'name': 'Yüce Taht', 'sure': 10, 'dice': {'die': '$pbHalf', 'sign': 1, 'on': ['attack']}, 'hitDie': '$pbHalf', 'icon': '👑'},
    kendiEtki={'name': 'Yüce Taht', 'sure': 10, 'resist': ['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder'], 'tempHp': '$lvl2', 'icon': '👑'},
    ad='Yüce Taht')
pas(s, 'crown-presence', 7, {'aura': {'yaricapFt': {'7': 10, '10': 20}, 'save': {'7': 1, '15': 2}, 'yetenekler': ['wis']}},
    'Kurtulma bonusu WIS kurtulmalarına (korku ve büyülenme çoğunlukla WIS); auranın içi savaş başında ve her olayda yenilenir.')
pas(s, 'undying-throne', 15, {'name': 'Ölümsüz Taht', 'deathWard': True, 'icon': '👑'}, 'Dostlara avantaj kısmı yok.')

# ---------------- Rogue: İnfazcı ----------------
s = 'imza_infazci'
sub(s, 'rogue', 'İnfazcı', 'Vigilante', 'Hüküm veren gizli avcı', 'A hidden hunter who passes verdicts', [
    F('verdict', 3, 'Hüküm', 'Verdict', 'Gördüğün birini "hükümlü" ilan et: 10 tur boyunca ona karşı gizli saldırın çok daha sert vurur.', 'Declare a foe "condemned": for 10 rounds your sneak attacks hit it much harder.'),
    F('masked-justice', 3, 'Maskeli Adalet', 'Masked Justice', 'Kılık değiştirmede ustasın; sezgide de ustasın.', 'You master disguise and gain Insight proficiency.'),
    F('final-warning', 9, 'Son Uyarı', 'Final Warning', 'Hükümlüye bir uyarı yap: direnemezse korkar ve sana vurmakta zorlanır.', 'Warn the condemned: if it fails to resist it is frightened and struggles to hit you.'),
    F('intervention', 9, 'Müdahale', 'Intervention', 'Hükümlü dostuna vurursa hemen yetişir ve ona karşılık verirsin.', 'If the condemned hits an ally you rush in and strike back.', 'planli'),
    F('relentless-pursuit', 13, 'Peşini Bırakmayan', 'Relentless Pursuit', 'Hükümlü kaçamaz; nerede olduğunu bilirsin ve peşinden gidersin.', 'The condemned cannot escape you.', 'planli'),
    F('execution', 17, 'İnfaz', 'Execution', 'Hükümlüye bir kez, ölümcül bir vuruş yaparsın; zayıflamışsa bu vuruş onu öldürür.', 'Once, a deadly strike on the condemned; if weakened it dies.'),
], beceri=['insight'])
act(s, 'verdict', seviye=3, tur='bonus', kaynak={'id': 'imzaHukum', **PB}, hedef='enemy', menzilFt=60, tek=True,
    etki={'name': 'Hükümlü', 'sure': 10, 'icon': '⚖'}, ad='Hüküm', not_='Sneak Attack d6 → d8: hükümlüye isabette Sneak Attack zarı başına +1 ek hasar (ortalama eşdeğer).')
act(s, 'final-warning', seviye=9, tur='action', kaynak={'id': 'imzaSonUyari', 'sayi': 1, 'yenilenme': 'short'}, hedef='enemy', menzilFt=30, yalnizIsaretli='verdict',
    save={'yetenek': 'wis', 'dc': ['dex']}, etki={'name': 'Son Uyarı', 'sure': 2, 'sureEfsanevi': 1, 'grants': ['Frightened'], 'attackDisVs': '$actor', 'icon': '⚖'}, ad='Son Uyarı')
pas(s, 'execution', 17, {'kaynak': {'id': 'imzaInfaz', 'sayi': 1, 'yenilenme': 'long'}}, 'Hükümlüye Sneak Attack isabetinde: zarlar en yüksek; canı Rogue seviyesi × 4 altındaysa ve efsanevi değilse CON kurtulması, başarısızsa ölür (kritik sayılmaz).')

# ---------------- Ranger: Çiftçi ----------------
s = 'imza_ciftci'
sub(s, 'ranger', 'Çiftçi', 'Farmer', 'Ürünüyle besleyen, mantarıyla zehirleyen', 'Feeds with grain, poisons with fungus', [
    F('farm-lore', 3, 'Çiftlik Bilgisi', 'Farm Lore', "Doğa'da ustalık (Hayvan Bakımı yerine varsayılan) ve Şifacı Takımı.", 'Nature proficiency (default over Animal Handling) and the Herbalism Kit.'),
    F('provisions', 3, 'Erzak', 'Provisions', 'Dinlenirken ürün hazırlarsın: başak dostunu iyileştirir, mantar düşmanını zehirler ve yavaşlatır.', 'You prepare produce while resting: grain heals an ally, fungus poisons and slows a foe.'),
    F('harvest', 7, 'Hasat', 'Harvest', 'İki ürünü birden harca: yakındaki dostları iyileştirir, yanındaki düşmanları oraklarsın ya da mantar sporlarını saçıp zehirlersin.', 'Spend two produce: heal nearby allies, scythe adjacent foes or scatter poisoning spores.'),
    F('spore-hardened', 7, 'Mantar Tutkunu', 'Spore-Hardened', 'Zehirden etkilenmezsin.', 'Poison does not affect you.'),
    F('bounty', 11, 'Bereket', 'Bounty', 'Ürünlerin daha güçlüdür; başağı yiyen dostların bir süre zehire karşı dirençli olur.', 'Your produce is stronger; grain grants poison resistance for a while.'),
], beceri=['nature'])
URUN = {'id': 'imzaUrun', 'sayi': 'pb', 'yenilenme': 'long'}
act(s, 'grain', seviye=3, tur='bonus', kaynak=URUN, hedef='allyOrSelf', menzilFt=30, iyilestir={'3': '1d4+$wis', '11': '1d8+$wis'},
    etkiSeviye={'11': {'name': 'Bereket', 'sure': 10, 'resist': ['poison'], 'saveAdvVs': ['Poisoned'], 'icon': '🌾'}}, ad='Başak', ozellikAdi='provisions')
act(s, 'fungus', seviye=3, tur='bonus', kaynak=URUN, hedef='enemy', menzilFt=30, hasar={'zar': {'3': '1d4', '11': '1d8'}, 'tur': 'poison'},
    etki={'name': 'Mantar', 'sure': 1, 'speedMult': 0.5, 'icon': '🍄'}, ad='Mantar', ozellikAdi='provisions')
act(s, 'feed', seviye=7, tur='bonus', kaynak=URUN, maliyet=2, hedef='allies', yaricapFt=30, kendisi=True, iyilestir={'7': '2d6+$wis'}, ad='Hasat: Besle', ozellikAdi='harvest')
act(s, 'scythe', seviye=7, tur='bonus', kaynak=URUN, maliyet=2, hedef='adjEnemies', save={'yetenek': 'dex', 'dc': ['wis']}, yari=True,
    hasar={'zar': {'7': '2d6+$wis'}, 'tur': 'slashing'}, ad='Hasat: Orakla', ozellikAdi='harvest')
act(s, 'spores', seviye=7, tur='bonus', kaynak=URUN, maliyet=2, hedef='adjEnemies', save={'yetenek': 'con', 'dc': ['wis']}, yari=True,
    hasar={'zar': {'7': '2d6'}, 'tur': 'poison'}, etki={'name': 'Spor', 'sure': 2, 'grants': ['Poisoned'], 'icon': '🍄'}, ad='Hasat: Spor Saç', ozellikAdi='harvest',
    not_='"En az bir Mantar" koşulu yok (ürün türü ayrımı tutulmaz; tek sayaç).')
pas(s, 'spore-hardened', 7, {'name': 'Mantar Tutkunu', 'immune': ['Poisoned'], 'immuneDamage': ['poison'], 'icon': '🍄'})

# ---------------- Sorcerer: Dunganga ----------------
s = 'imza_dunganga'
sub(s, 'sorcerer', 'Dunganga', 'Dunganga', 'Ninniyle uyutan, sepete atan', 'Lulls foes to sleep and baskets them', [
    F('lullaby-blood', 3, 'Ninni Kanı', 'Lullaby Blood', 'Uyku, korku ve kabus büyüleri hep elinin altında. Bir ninni mırıldan: duyan düşmanlar uykulanır, yavaşlar ve vurmakta zorlanır.', 'Sleep, fear and nightmare spells are always at hand. Hum a lullaby: listening foes grow drowsy, slow and clumsy.'),
    F('basket', 6, 'Sepet', 'Basket', 'Bir düşmanı sepete at: direnemezse birkaç tur uykuya dalıp beklemek zorunda kalır.', 'Toss a foe into the basket: if it fails to resist it sleeps for a few rounds.'),
    F('nightmare', 14, 'Kâbus', 'Nightmare', 'Uykudan, korkudan ve büyüden etkilenmezsin; korkan düşmanlar her tur acı çeker. Ninni daha çok kişiye ulaşır.', 'Sleep, fear and charm do not affect you; frightened foes suffer each round.'),
    F('call', 18, 'Dunganga Çağrısı', 'Call of Dunganga', '10 tur boyunca etrafını karanlık bir ninni sarar: içindeki düşmanlar uykulanır, acı çeker ve can yenileyemez.', 'For 10 rounds a dark lullaby surrounds you: foes grow drowsy, suffer and cannot heal.'),
    F('standing-firm', 3, 'Cesaret', 'Standing Firm', 'Etkiye direnen yaratık, o etkiye 10 tur bağışık olur.', 'A creature that resists an effect is immune to it for 10 rounds.'),
])
UYKULU = {'name': 'Uykulu', 'sure': 1, 'speedMult': 0.5, 'attackDis': {}, 'icon': '💤'}
act(s, 'lullaby', seviye=3, tur='action', kaynak={'id': 'imzaNinni', **PB}, hedef='enemies', yaricapFt=30, enCok='$cha', enCokCarpan={'14': 2},
    save={'yetenek': 'wis', 'dc': ['cha'], 'dezVs': ['Frightened']}, cesaret=10, etki=UYKULU, ad='Ninni', ozellikAdi='lullaby-blood',
    not_='Ücretsiz kullanım bitince Büyücülük Puanı seçeneği yok.')
act(s, 'basket', seviye=6, tur='action', kaynak={'id': 'imzaSepet', 'sayi': 1, 'yenilenme': 'long'}, hedef='enemy', menzilFt=30,
    save={'yetenek': 'wis', 'dc': ['cha'], 'dezVs': ['Frightened'], 'dezEtki': ['Uykulu']}, cesaret=10,
    etki={'name': 'Sepet', 'sure': 2, 'sureEfsanevi': 1, 'grants': ['Incapacitated'], 'speedZero': True, 'breakOnDamage': True, 'icon': '🧺'}, ad='Sepet',
    not_='3 Büyücülük Puanıyla ek kullanım yok (uzun dinlenmede bir kez).')
act(s, 'call', seviye=18, tur='action', kaynak={'id': 'imzaCagri', 'sayi': 1, 'yenilenme': 'long'}, hedef='enemies', yaricapFt=30,
    save={'yetenek': 'wis', 'dc': ['cha']}, cesaret=10, hasar={'zar': {'18': '2d10'}, 'tur': 'psychic'}, hasarHep=True,
    etki={**UYKULU, 'sure': 10, 'noHeal': True}, ad='Dunganga Çağrısı',
    not_='Alan seninle hareket etmez: yapıldığı anda 30 ft içindekiler bir kez kurtulma atar (başarısızsa 10 tur Uykulu + can yenileyemez); hasar kurtulma başarısında yarı değil, yalnız başarısızsa.')
pas(s, 'lullaby-blood', 3, {'alwaysPrepared': {'3': ['Sleep', 'Bane', 'Invisibility', 'Darkness', 'Fear', 'Hypnotic Pattern'], '7': ['Phantasmal Killer', 'Confusion'], '9': ['Dream', 'Modify Memory']}})
pas(s, 'nightmare', 14, {'name': 'Kâbus', 'immune': ['Frightened', 'Charmed', 'Unconscious'], 'icon': '🌙'}, 'Korkan düşmana tur başı hasar yok (planlı).')

# ---------------- Warlock: Astrolog ----------------
s = 'imza_astrolog'
sub(s, 'warlock', 'Astrolog', 'Astrologer', 'Yıldızlardan yazgı okuyan', 'Reads and bends fate from the stars', [
    F('expanded', 3, 'Genişletilmiş büyüler', 'Expanded Spells', 'Işık, ay ve kehanet büyüleri listene eklenir.', 'Light, moon and divination spells join your list.'),
    F('star-reading', 3, 'Yıldız Falı', 'Star Reading', 'Bir dostuna uğur, bir düşmanına uğursuzluk getir: ilk zarı daha iyi ya da daha kötü gelir.', 'Bring luck to an ally or ill luck to a foe: their first roll goes better or worse.'),
    F('sky-guide', 3, 'Gök Rehberi', 'Sky Guide', 'Arcana becerisinde ustasın. Yıldızlı gecede dinlenmek partinin cesaretini artırır.', 'You gain Arcana proficiency. Resting under stars lifts the party.', 'planli'),
    F('fate-turned', 6, 'Yazgı Değişir', 'Fate Turned', 'Bir dostuna isabet eden saldırıyı iskaya çevirirsin; karşılığında sonraki turunda vurmak zorlaşır.', 'Turn a hit on an ally into a miss; your own attacks suffer next turn.', 'planli'),
    F('comet', 10, 'Kuyruklu Yıldız', 'Comet', 'Açık havada gökten yıldız düşür: alandakiler ışıkla yanar. Kapalı yerde çalışmaz.', 'Under open sky, call down a star: all in the area burn with light.'),
    F('seal-of-fate', 14, 'Yazgı Mührü', 'Seal of Fate', 'Açık havada bir düşmanın yazgısını mühürle: ona vurmak kolaylaşır, o ise zor kurtulur.', 'Under open sky, seal a foe’s fate: easier to hit, harder to resist.'),
], beceri=['arcana'])
act(s, 'luck', seviye=3, tur='bonus', kaynak={'id': 'imzaFal', **PB}, hedef='ally', menzilFt=60,
    etki={'name': 'Uğurlu', 'sure': 2, 'dice': {'die': '1d6', 'sign': 1, 'on': ['attack', 'save', 'check'], 'single': True}, 'icon': '⭐'}, ad='Yıldız Falı: Uğur', ozellikAdi='star-reading',
    not_='Avantaj yerine ilk zara +1d6 (tek kullanım).')
act(s, 'ill-luck', seviye=3, tur='bonus', kaynak={'id': 'imzaFal', **PB}, hedef='enemy', menzilFt=60, save={'yetenek': 'wis', 'dc': ['cha']},
    etki={'name': 'Uğursuz', 'sure': 2, 'dice': {'die': '1d6', 'sign': -1, 'on': ['attack', 'save', 'check'], 'single': True}, 'icon': '🌑'}, ad='Yıldız Falı: Uğursuzluk', ozellikAdi='star-reading',
    not_='Dezavantaj yerine ilk zardan −1d6 (tek kullanım).')
act(s, 'comet', seviye=10, tur='action', kaynak={'id': 'imzaKuyruklu', 'sayi': 1, 'yenilenme': 'short'}, hedef='areaEnemies', menzilFt=120, yaricapFt=20, acikHava=True,
    save={'yetenek': 'dex', 'dc': ['cha']}, yari=True, hasar={'zar': {'10': '6d10'}, 'tur': 'radiant'}, ad='Kuyruklu Yıldız', dostlarDahil=True,
    not_='Merkez seçilen düşmanın altıgeni; alandaki dostlar da kurtulma atar.')
act(s, 'seal-of-fate', seviye=14, tur='action', kaynak={'id': 'imzaMuhur', 'sayi': 1, 'yenilenme': 'long'}, hedef='enemy', menzilFt=60, acikHava=True,
    save={'yetenek': 'wis', 'dc': ['cha']}, efsaneviBasariSure=1,
    etki={'name': 'Yazgı Mührü', 'sure': 3, 'attackedAdv': True, 'dice': {'die': '$cha', 'sign': -1, 'on': ['save']}, 'icon': '🔯'}, ad='Yazgı Mührü',
    not_='Kendiliğinden isabet yerine ona yapılan saldırılar avantajlı; dostlara ek hasar yok.')
pas(s, 'expanded', 3, {'alwaysPrepared': {'3': ['Guiding Bolt', 'Faerie Fire', 'Augury', 'Moonbeam'], '5': ['Clairvoyance', 'Daylight'], '7': ['Divination', 'Guardian of Faith'], '9': ['Scrying', 'Flame Strike']}},
    'Genişletilmiş liste her zaman hazır sayılır (Warlock büyü seçiminde ayrı liste yok).')

# ---------------- Cleric: Birlik Manastırı (ev kuralı değil) ----------------
s = 'imza_birlik'
sub(s, 'cleric', 'Birlik Manastırı', 'Unity Monastery', 'Yükü paylaşan: bağ, ortak can', 'Shares the burden: bonds and a shared life pool', [
    F('forge-bond', 3, 'Bağ Kurma', 'Forge Bond', 'Yakındaki üç dostunu birbirine bağlarsın, 10 tur sürer.', 'Bind up to three nearby allies together for 10 rounds.'),
    F('lend-shoulder', 3, 'Omuz Ver', 'Lend a Shoulder', 'Bağlı bir dost zar tutturamazsa yanındaki bir dost ona destek olur.', 'When a bonded ally fails a roll, another bonded ally steadies them.', 'planli'),
    F('vigil', 3, 'Teselli Nöbeti', 'Vigil of Solace', 'Bağlı dostların geçici can ve biraz cesaret kazanır.', 'Bonded allies gain temporary HP and a little heart.'),
    F('shared-vitality', 6, 'Birlik Can Havuzu', 'Shared Vitality', 'Bağlı dostların canı tek bir havuzda toplanır, hasar havuzdan düşer. Dikkat: havuz biterse bağlı herkes ölür.', 'Bonded allies pool their HP; damage comes off the pool. Warning: if the pool empties, all of them die.'),
    F('common-cure', 8, 'Ortak Şifa', 'Common Cure', 'Birini iyileştirince diğer bağlı dostlar da biraz iyileşir.', 'Healing one bonded ally heals the others a little.', 'planli'),
    F('unbroken-union', 17, 'Yıkılmaz Birlik', 'Unbroken Union', 'Havuz bitecekken ayakta kalır ve herkesin cesareti tazelenir.', 'When the pool would empty, it holds.', 'planli'),
], kural=False)
act(s, 'forge-bond', seviye=3, tur='bonus', kaynak={'id': 'imzaBag', 'sayi': 'pb', 'yenilenme': 'long'}, hedef='allies', yaricapFt=30, kendisi=True, enCok=3, bag=True,
    etki={'name': 'Bağlı', 'sure': 10, 'icon': '🔗'}, ad='Bağ Kurma', not_='Rahip kendisini de bağlar (3 dosta ek); yeni bağ eskisini bitirir.')
act(s, 'vigil', seviye=3, tur='action', kullan={'id': 'channelDivinity', 'maliyet': 1}, hedef='bonded', tempHp='$lvl', moral=1, ad='Teselli Nöbeti')
act(s, 'shared-vitality', seviye=6, tur='action', kaynak={'id': 'imzaHavuz', 'sayi': 1, 'yenilenme': 'long'}, hedef='bonded', ozel='havuz', ad='Birlik Can Havuzu',
    uyari={'tr': 'Dikkat: havuz biterse bağlı herkes ölür.', 'en': 'Warning: if the pool empties, everyone bonded dies.'})

# ---------------- Barbarian: Geride Kalanın Yolu ----------------
s = 'imza_geride_kalan'
sub(s, 'barbarian', 'Geride Kalanın Yolu', 'Path of the Survivor', 'Yıpranmışlığından güç alan', 'Draws power from being worn down', [
    F('wounded-heart', 3, 'Yaralı Kalp', 'Wounded Heart', 'Umudun hiçbir zaman tam dolmaz; en çok üçte birine kadar toparlanırsın.', 'Your heart never fills; it recovers to a third at most.'),
    F('strength-of-the-worn', 3, 'Yıpranmışlığın Gücü', 'Strength of the Worn', 'Ne kadar yıpranmışsan, öfkeyle o kadar sert vurursun.', 'The more worn you are, the harder you hit in rage.'),
    F('standing-in-rage', 3, 'Öfkeyle Ayakta', 'Standing in Rage', 'Öfkedeyken umudun bitse bile yıkılmazsın; öfken bitince yıkılırsın.', 'While raging you do not break even at zero heart.', 'planli'),
    F('mourning-wrath', 6, 'Dostunun Yası', 'Mourning Wrath', 'Bir dostun düşünce öfken taşar: hemen öfkelenir, dayanıklılık kazanırsın.', 'When an ally falls your rage overflows.', 'planli'),
    F('used-to-grief', 10, 'Alışkın Acı', 'Used to Grief', 'Yıpranmışlığın seni artık zayıflatmaz; ölümün eşiğinde daha dirençlisin.', 'Wear no longer weakens you; you resist death better.'),
    F('risen-from-ashes', 14, 'Küllerden Doğan', 'Risen from Ashes', 'Ölecekken bir kez ayağa kalkarsın.', 'Once, when you would drop, you rise.'),
])
pas(s, 'strength-of-the-worn', 3, {'yipranma': {'tavanBolen': 3, 'carpan': 0.5}}, 'Öfkedeyken silah isabetine +min(PB, ⌊eksik puan / 2⌋); puan Moral (tam mod) ya da yoksa sabit üçte bir (Yıpranma sayacı tutulmaz).')
pas(s, 'used-to-grief', 10, {'name': 'Alışkın Acı', 'deathSaveAdv': True, 'icon': '🔥'})
pas(s, 'risen-from-ashes', 14, {'name': 'Küllerden Doğan', 'deathWard': True, 'icon': '🔥'}, 'Öfkeye kendiliğinden girme ve dostlara geçici can yok.')

# ---------------- Bard: Şair Koleji ----------------
s = 'imza_sair'
sub(s, 'bard', 'Şair Koleji', 'College of Poets', 'Övgüyle kaldıran, hicivle sarsan', 'Lifts with praise, shakes with satire', [
    F('verse', 3, 'Mısra', 'Verse', 'Bir dize söyle: dostuna dayanıklılık ve umut verir, düşmanı sözlerinle sarsar; direnemezse hasar görür ve bir sonraki saldırısını kötü yapar.', 'Speak a verse: an ally gains resilience and heart, or a foe is shaken, taking damage and fumbling its next attack.'),
    F('pens-power', 3, 'Kalemin Gücü', "Pen's Power", 'İki becerinde daha usta olursun.', 'You gain two more skill proficiencies.'),
    F('night-verse', 3, 'Gece Şiiri', 'Night Verse', 'Dinlenirken şiir okursun, dostlarının Motivasyonu daha çok yenilenir.', 'Your poetry at rest restores more heart.', 'planli'),
    F('refrain', 6, 'Nakarat', 'Refrain', 'Dizen ikinci bir kişiye de ulaşır, ama etkisi daha zayıftır.', 'Your verse reaches a second target, more weakly.', 'planli'),
    F('undying-verse', 14, 'Ölümsüz Dize', 'Undying Verse', 'Bir dostun ölecekken dizenle ayakta kalır.', 'An ally about to fall stays up with your verse.', 'planli'),
    F('master-poet', 14, 'Usta Şair', 'Master Poet', 'Bir mısra için artık ilham zarı harcamazsın (kısa dinlenmede bir kez).', 'Once per short rest a verse costs no inspiration.', 'planli'),
], beceri=['performance', 'history'])
act(s, 'praise', seviye=3, tur='bonus', kullan={'id': 'bardicInspiration', 'maliyet': 1}, hedef='ally', menzilFt=60, tempHp='$bardic+$cha', moral=1, ad='Mısra: Övgü', ozellikAdi='verse')
act(s, 'satire', seviye=3, tur='bonus', kullan={'id': 'bardicInspiration', 'maliyet': 1}, hedef='enemy', menzilFt=60, save={'yetenek': 'wis', 'dc': ['cha']},
    hasar={'zar': {'3': '$bardic+$cha'}, 'tur': 'psychic'}, etki={'name': 'Hiciv', 'sure': 1, 'attackDis': {'single': True}, 'icon': '📜'}, ad='Mısra: Hiciv', ozellikAdi='verse')

# ---------------- Monk: Yaşlı Bilge Disiplini ----------------
s = 'imza_bilge'
sub(s, 'monk', 'Yaşlı Bilge Disiplini', 'Elder Sage Discipline', 'Gücü sabrından gelen yaşlı usta', 'An old master whose power is patience', [
    F('elder-wisdom', 3, 'Yaşlı Bilgelik', 'Elder Wisdom', "İçgörü'de ustasın.", 'You gain Insight proficiency.'),
    F('mind-might', 3, 'Zihin Gücü', 'Mind Might', 'Zihninle bir düşmanı itersin.', 'You push a foe with your mind.'),
    F('patience', 3, 'Sabır', 'Patience', 'Bir düşman sana vurmayı kaçırırsa karşılık verirsin.', 'When a foe misses you, you strike back.', 'planli'),
    F('calm-word', 6, 'Sakin Söz', 'Calm Word', 'Bir dostunun korkusunu ve büyüsünü dağıtır, cesaretini tazelersin.', 'Dispel an ally’s fear and charm and lift their heart.'),
    F('greater-mind-might', 11, 'Zihin Gücü genişler', 'Greater Mind Might', 'Daha uzağa iter; bir nesneyi fırlatıp hedefe çarpabilirsin.', 'Push farther; hurl an object at a target.', 'planli'),
    F('nimble-elder', 11, 'Çevik Yaşlı', 'Nimble Elder', 'Daha hızlısın.', 'You move faster.'),
    F('final-lesson', 17, 'Son Ders', 'Final Lesson', '10 tur boyunca dostların etrafında dinginlik yayılır: daha dirençli olurlar.', 'For 10 rounds calm spreads around your allies: they resist better.'),
], beceri=['insight'])
act(s, 'mind-might', seviye=3, tur='bonus', kullan={'id': 'focus', 'maliyet': 1}, hedef='enemy', menzilFt=30, save={'yetenek': 'str', 'dc': ['wis']}, itme=10, ad='Zihin Gücü',
    not_='Yalnız itme (çekme ve nesne yok); Large ve küçük sınırı yok.')
act(s, 'calm-word', seviye=6, tur='bonus', kullan={'id': 'focus', 'maliyet': 1}, hedef='allyOrSelf', menzilFt=30, temizle=['Frightened', 'Charmed'], moral=1, ad='Sakin Söz')
act(s, 'final-lesson', seviye=17, tur='action', kaynak={'id': 'imzaSonDers', 'sayi': 1, 'yenilenme': 'long'}, hedef='allies', yaricapFt=30, kendisi=True,
    etki={'name': 'Son Ders', 'sure': 10, 'dice': {'die': '$wis', 'sign': 1, 'on': ['save']}, 'icon': '🍃'}, ad='Son Ders',
    not_='Alan seninle hareket etmez: yapıldığı anda 30 ft içindekiler etkilenir; tur başı Motivasyon ve fırsat saldırısı dezavantajı yok.')
pas(s, 'nimble-elder', 11, {'name': 'Çevik Yaşlı', 'speedFt': 10, 'icon': '🍃'}, 'Fırsat saldırısı muafiyeti ve Yönlendir yok.')

# ---------------- Paladin: Hızır Yemini ----------------
s = 'imza_hizir'
sub(s, 'paladin', 'Hızır Yemini', 'Oath of Hızır', 'İmdada yetişen', 'Arrives just in time', [
    F('oath-spells', 3, 'Yemin büyüleri', 'Oath Spells', 'İyileştirme ve koruma büyüleri listene eklenir.', 'Healing and warding spells join your list.'),
    F('just-in-time', 3, 'Tam Zamanında', 'Just in Time', 'Bir dostuna vurulurken yanına belirir, vuruşu sen karşılarsın.', 'You appear beside an ally as they are struck and take the blow.', 'planli'),
    F('sense-of-need', 3, 'Muhtaç Sezgisi', 'Sense of Need', 'Yere düşen ya da cesareti tükenen dostlarını her yerde bilirsin.', 'You always know where fallen allies are.', 'planli'),
    F('aura-hard-times', 7, 'Dar Gün Aurası', 'Aura of Hard Times', 'Zor durumdaki dostların ölüme daha dirençli olur ve geçici can kazanır.', 'Struggling allies resist death and gain temporary HP.', 'planli'),
    F('miracle-in-time', 15, 'Yetişen Mucize', 'Miracle in Time', 'Ölecek dostunun yanına yetişir, ölümü engellersin.', 'You reach a dying ally and stop death.', 'planli'),
    F('hastening-road', 20, 'Yetişen Yol', 'The Hastening Road', '10 tur boyunca dostların daha dirençli.', 'For 10 rounds your allies are hardier.'),
])
act(s, 'hastening-road', seviye=20, tur='action', kaynak={'id': 'imzaYetisenYol', 'sayi': 1, 'yenilenme': 'long'}, hedef='allies', yaricapFt=30, kendisi=True,
    etki={'name': 'Yetişen Yol', 'sure': 10, 'resist': ['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder'], 'icon': '🕊'},
    ad='Yetişen Yol', not_='Işınlanma ve hasar devralma yok.')
pas(s, 'oath-spells', 3, {'alwaysPrepared': {'3': ['Cure Wounds', 'Sanctuary'], '5': ['Aid', 'Warding Bond'], '9': ['Beacon of Hope', 'Revivify'], '13': ['Death Ward', 'Guardian of Faith'], '17': ['Mass Cure Wounds', 'Greater Restoration']}},
    'Büyü listesi belgede yok: SRD iyileştirme/koruma büyülerinden seçildi.')

# ---------------- Wizard: Harita Öğretisi ----------------
s = 'imza_harita'
sub(s, 'wizard', 'Harita Öğretisi', 'Doctrine of the Map', 'Araziyi yeniden yazan', 'Rewrites the battlefield', [
    F('read-the-land', 3, 'Arazi Okuma', 'Read the Land', "Doğa'da ustasın. Haritada daha uzağı keşfedersin.", 'You gain Nature proficiency and scout farther.'),
    F('mark-the-ground', 3, 'Mevzi İşareti', 'Mark the Ground', 'Birkaç altıgeni işaretle: üzerindeki dostlar zemin engellerinden etkilenmez, daha dirençli olur.', 'Mark a few hexes: allies there ignore ground hazards.', 'planli'),
    F('rewrite-the-ground', 6, 'Zemin Yeniden Yaz', 'Rewrite the Ground', 'Bir alanın zeminini değiştir: düşmanı yavaşlat.', 'Rewrite an area’s ground: slow your foes.'),
    F('drawn-wall', 10, 'Çizili Duvar', 'Drawn Wall', 'Yere duvar çiz: geçici bir engel yükselir.', 'Draw a wall: a temporary barrier rises.', 'planli'),
    F('birds-eye', 14, 'Kuşbakışı Plan', "Bird's-Eye Plan", '10 tur boyunca savaşı tepeden yönet.', 'Command the battle from above for 10 rounds.', 'planli'),
], beceri=['nature'])
act(s, 'rewrite-the-ground', seviye=6, tur='action', kaynak={'id': 'imzaZemin', 'sayi': 'int', 'yenilenme': 'long'}, hedef='areaEnemies', menzilFt=60, yaricapFt=20,
    etki={'name': 'Yeniden Yazılmış Zemin', 'sure': 10, 'speedMult': 0.5, 'icon': '🗺'}, ad='Zemin Yeniden Yaz',
    not_='Zemin değişmez: alandaki düşmanlar 10 tur yarı hızda (zor zemin karşılığı); dost temizliği ve yüzey seçeneği yok.')

# Her zaman hazır büyüler özelliğin `effect`'inde (sınıf kiti okur; Karadul gibi). Pasif listeden çıkar.
for p_ in [x for x in pasif if 'alwaysPrepared' in x['etki']]:
    sub_ = next(a for a in alt if a['id'] == p_['sinif'])
    feat = next(f for f in sub_['features'] if f['id'] == p_['ozellik'])
    feat['effect'] = {'type': 'passive', 'status': 'ok', 'alwaysPrepared': p_['etki']['alwaysPrepared'], **({'note': p_['not']} if p_.get('not') else {})}
pasif = [x for x in pasif if 'alwaysPrepared' not in x['etki']]

# Kaynaklar (data/class-features.json `resources` biçimi; yüklemede birleşir, dinlenme yenilemesi oradan).
CLS = {a['id']: a['class'] for a in alt}
kaynak = {}
def add_res(sid, fid, k, ad):
    u = k['sayi']
    uses = {'proficiency': True} if u == 'pb' else {'abilityMod': u, 'min': 1} if isinstance(u, str) else {'fixed': u}
    rec = {'short': 'all', 'long': 'all'} if k['yenilenme'] == 'short' else {'long': 'all'}
    key = f"{CLS[sid]}/{sid}:{fid}"
    old = kaynak.get(k['id'])
    if old:
        if key not in old['feature']:
            old['feature'].append(key)
        return
    kaynak[k['id']] = {'name': ad, 'feature': [key], 'uses': uses, 'recharge': rec}
for e in eylem.values():
    if 'kaynak' in e:
        add_res(e['sinif'], e['ozellik'], e['kaynak'], e.get('ad', e['ozellik']))
for p_ in pasif:
    if 'kaynak' in p_['etki']:
        add_res(p_['sinif'], p_['ozellik'], p_['etki']['kaynak'], p_['ozellik'])

out = {
    'note': 'K50: imza alt sınıflar (ev kuralı; kaynak docs/imza-alt-siniflar/). `python scripts/k50-imza-veri.py` üretir; elle düzenleme betikte. '
            '`altSiniflar` oluşturucu kaydı (SubclassDef; `evKurali` ev kuralı kimliği, Birlik Manastırı için null: her zaman açık), '
            '`eylemler` savaşta use_feature (src/battle/imza.ts), `pasifler` savaş başı etkileri. `$pb`, `$lvl`, `$wis` gibi belirteçler savaşçıdan.',
    'surum': SURUM,
    'kapaliOrtam': {'bolgeler': ['derinlikler', 'yeralti', 'hapishane'], 'varyantSozcukleri': ['karanlik', 'los', 'ic'], 'haritalar': ['kale-taht-salonu', 'kasaba-lagim', 'magara', 'magara-genis', 'dungeon', 'orman-heykel-magarasi', 'yeralti-nehri']},
    'eskiKimlik': {'baris-alani': 'imza_birlik'},
    'altSiniflar': alt,
    'kaynaklar': kaynak,
    'eylemler': eylem,
    'pasifler': pasif,
}
json.dump(out, open(os.path.join(ROOT, 'data', 'imza.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(alt), 'alt sınıf,', len(eylem), 'eylem,', len(pasif), 'pasif')
