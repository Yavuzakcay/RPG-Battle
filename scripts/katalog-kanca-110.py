# GECE-KATALOG-KALAN (kural sürümü 110): KATALOG-1 kanca listesinin 2. turu. data/items-katalog.json'daki eşyalara
# `paket.s110.ilkeller` (ek paket ilkelleri; 110+ savaşta `itemBag` ekler, 109 ve altında yüklenmez) ve gücün durum/notu.
# Tekrar çalıştırılabilir (aynı çıktı). Çalıştırma: python scripts/katalog-kanca-110.py
# Kodda eşya adıyla koşul yok: hepsi ilkel verisi (src/content/ilkelSema.ts; yeni koşullar 110: yariCan, yarali, kalkansiz,
# hedefYariCan, hedefTamCan, kritik, hedefOynamadi, hedefDurum:, hedefTur:, hedefBoyut:).
import json

P = 'data/items-katalog.json'
d = json.load(open(P, encoding='utf-8'))
by = {e['id']: e for e in d['esyalar']}

def hit(zar, tur, kosul=None, saldiri='silah', **kw):
    return {"tur": "ekHasar", "zar": zar, "hasarTuru": tur, "saldiri": saldiri, **({"kosul": kosul} if kosul else {}), **kw}
def yuk(item, sayi):
    return {"tur": "kaynak", "id": item, "sayi": sayi, "yenilenme": "uzun"}
def ref(item, n=1):
    return {"id": item, "maliyet": n}
NOT110 = 'GECE-KATALOG-KALAN (kural sürümü 110) ile bağlandı'
YUK_NOT = 'yük her savaş başında dolu (eşya yükünde dinlenme takibi yok); UD 1d2 yenilenme yerine tam'

# (eşya, güç adı, ilkeller, durum, not ek)
B = [
  # Durum/koşul kancaları: hedefin durumu, türü, boyu, canı; kritik; kendi canı; zırh/kalkan.
  ('mirefang-scimitar', 'Zehir Takibi', [hit('1d4', 'poison', ['hedefDurum:Poisoned'])], 'calisir', ''),
  ('webrender-longsword', 'Avı Zehirle', [hit('1d6', 'poison', ['hedefDurum:Restrained/Grappled'])], 'calisir', ''),
  ('sunstar-morningstar', 'Göz Alıcı Darbe', [hit('1d6', 'radiant', ['hedefTur:undead'])], 'calisir', ''),
  ('vaulting-pike', 'Canavar Avcısı', [hit('1d4', 'piercing', ['hedefTur:monstrosity'])], 'calisir', ''),
  ('sorrowthorn-dagger', 'Savunmasız Av', [hit('1d6', 'necrotic', ['hedefDurum:Paralyzed/Unconscious'])], 'calisir', ''),
  ('sorrowthorn-dagger', 'Acı Kesiği', [hit('6', 'piercing', ['kritik'])], 'calisir', 'sabit +6 kritikte ikiye katlanmaz'),
  ('seeping-knife', 'Acı Yeri', [hit('1d8', 'piercing', ['kritik'])], 'calisir', '⚠ ek zar kritik kuralıyla iki kat atılır (SRD: kritikte bütün hasar zarları)'),
  ('crimson-whisper', 'Acımasız Kesik', [hit('1d8', 'piercing', ['avantajli'], turdaBir=True), hit('1d4', 'piercing', ['avantajli', 'hedefYariCan'], turdaBir=True)], 'calisir',
   '⚠ yarı can eki de avantajlı isabette (metin "ayrıca")'),
  ('mindrend-shortsword', 'Zihin Çatlağı', [hit('1d6', 'psychic', ['avantajli'], turdaBir=True)], 'calisir', ''),
  ('ambushers-shortsword', 'Öncü Darbesi', [hit('1d6', 'necrotic', ['hedefOynamadi'])], 'calisir', ''),
  ('banshees-wail-shortbow', 'Korku Avcısı', [hit('1d4', 'psychic', ['hedefDurum:Frightened'])], 'kismi', 'ek 1d4 psişik çalışır; saldırı zarına +2 yok (hedef koşullu saldırı bonusu yok)'),
  ('spellbreaker-battleaxe', 'Kan Hırsı', [hit('1d4', 'slashing', ['yariCan'])], 'calisir', ''),
  ('emberheart-talisman', 'Son Kor', [hit('1d4', 'fire', ['yariCan'], saldiri='yakin')], 'calisir', '⚠ Unarmed Strike yakın dövüş saldırısı olarak sayılır'),
  ('crimson-fury-circlet', 'Yaralı Öfke', [hit('2', 'necrotic', ['yarali'], saldiri='yakin')], 'kismi', '+2 nekrotik çalışır; +1 isabet yok'),
  ('giantbreaker-blade', 'İri Avı', [hit('1d8', 'slashing', ['hedefBoyut:L'], turdaBir=True)], 'kismi', 'ek 1d8 çalışır; STR 16 save ve Prone yok'),
  ('unbound-balance-staff', 'Özgür Savunma', [{"tur": "zarEtkisi", "tetik": "pasif", "kurtulmaBonusu": 1, "kosul": ["zirhsiz", "kalkansiz"]}], 'calisir', ''),
  ('chainbreaker-warhammer', 'Büyü Kalkanı', [{"tur": "koruma", "tetik": "pasif", "buyulereAvantaj": True}], 'calisir', ''),
  ('champions-crag-harness', 'Dağın Derisi', [{"tur": "direnc", "tetik": "pasif", "tip": "direnc", "kosul": ["ofke"],
    "turler": ["acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic", "piercing", "poison", "radiant", "slashing", "thunder"]}], 'calisir',
   '⚠ yalnız Barbar Öfkesi (benzeri savaş duruşu yok)'),
  ('champions-crag-harness', 'Yıkılmaz Duruş', [{"tur": "koruma", "tetik": "pasif", "itmeDirenci": True}], 'kismi', 'zorla itme/çekmeye direnç çalışır; irade dışı Prone bağışıklığı yok'),
  ('tempest-trident', 'Yel Örtüsü', [{"tur": "hiz", "tetik": "pasif", "artiFt": 10}], 'kismi', '+10 ft çalışır; düşme hasarı direnci yok'),
  # Yük harcayan aktifler: yük kaynağı + düğme (bonus/eylem) ya da isabet anında harcama.
  ('tidecaller-trident', 'Şimşek Ucu', [yuk('tidecaller-trident', 2), hit('1d8', 'lightning', None, kaynak=ref('tidecaller-trident'))], 'calisir',
   '⚠ yük varken her isabette kendiliğinden harcanır; su zinciri yok; ' + YUK_NOT),
  ('skylight-longbow', 'Işık İşareti', [yuk('skylight-longbow', 3), hit('2d6', 'radiant', None, kaynak=ref('skylight-longbow'))], 'kismi',
   'ek 2d6 ışıltı çalışır (yük varken her isabette kendiliğinden); sonraki saldırı avantajı yok; ' + YUK_NOT),
  ('rootgrip-ring', 'Kök Şifası', [yuk('rootgrip-ring', 1), {"tur": "iyilestirme", "tetik": "bonus", "hedef": "dostVeyaKendi", "miktar": "2d4+2", "menzilFt": 60,
    "kaynak": ref('rootgrip-ring')}], 'calisir', 'Healing Word yerine eşdeğer iyileştirme düğmesi'),
  ('lifespring-amulet', 'Yaşam Pınarı', [yuk('lifespring-amulet', 1), {"tur": "iyilestirme", "tetik": "bonus", "hedef": "kendi", "miktar": "4d8+4", "durumKaldir": ["Poisoned"],
    "kaynak": ref('lifespring-amulet')}], 'calisir', ''),
  ('silverthread-locket', 'Acil Müdahale', [yuk('silverthread-locket', 2), {"tur": "iyilestirme", "tetik": "bonus", "hedef": "dostVeyaKendi", "miktar": "2d4+2", "menzilFt": 60,
    "kaynak": ref('silverthread-locket')}], 'kismi', 'bonus eylem kolu çalışır; eylemle 3 dosta 1d6 + 2 kolu yok; ' + YUK_NOT),
  ('shadowknight-half-plate', 'Karanlık Kalkanı', [yuk('shadowknight-half-plate', 1), {"tur": "zarEtkisi", "tetik": "bonus", "hedef": "kendi", "acBonusu": 2, "sure": 3,
    "kaynak": ref('shadowknight-half-plate')}], 'kismi', '+2 AC 3 tur çalışır; konsantrasyon bağı yok'),
  ('hellforge-plate', 'Alev Kanadı', [yuk('hellforge-plate', 1), {"tur": "ucus", "tetik": "bonus", "hizFt": 60, "sure": 3, "kaynak": ref('hellforge-plate')}], 'calisir', ''),
  ('ravenwing-leather', 'Kuzgun Kanadı', [yuk('ravenwing-leather', 2), {"tur": "ucus", "tetik": "bonus", "hizFt": "yurume", "sure": 5, "kaynak": ref('ravenwing-leather')}], 'calisir', YUK_NOT),
  ('archmages-conduit-staff', 'Yuva Geri Kazanımı', [yuk('archmages-conduit-staff', 1), {"tur": "yuvaGeriKazan", "tetik": "bonus", "enCokSeviye": 5, "kaynak": ref('archmages-conduit-staff')}], 'calisir', ''),
  ('spellwell-amulet', 'Yuva Pınarı', [yuk('spellwell-amulet', 1), {"tur": "yuvaGeriKazan", "tetik": "bonus", "enCokSeviye": 6, "kaynak": ref('spellwell-amulet')}], 'kismi',
   'büyü yuvası çalışır; Warlock Pact Magic yuvası ayrı seçilmez'),
  ('devouts-medallion', 'İlahi Akış', [yuk('devouts-medallion', 1), {"tur": "kaynakYenile", "tetik": "bonus", "yenile": {"id": "channelDivinity", "maliyet": 1}, "kaynak": ref('devouts-medallion')}], 'calisir', ''),
  ('corsair-captains-coat', 'İnatçı Kaptan', [yuk('corsair-captains-coat', 1), {"tur": "olumdenDon", "hp": "1", "kaynak": ref('corsair-captains-coat')}], 'kismi', '1 HP\'de kalma çalışır; 8 geçici can yok'),
]

seen = set()
for item, ad, ilk, durum, ek in B:
    e = by[item]
    pw = [o for o in e['katalog']['ozellikler'] if o['ad'] == ad or o['ad'].startswith(ad + ' (')]
    assert len(pw) == 1, (item, ad)
    o = pw[0]
    if item not in seen:
        e.setdefault('paket', {})['s110'] = {"ilkeller": []}
        seen.add(item)
    ids = {p.get('id') for p in e['paket']['s110']['ilkeller']}
    e['paket']['s110']['ilkeller'] += [p for p in ilk if not (p['tur'] == 'kaynak' and p['id'] in ids)]
    o['durum'] = durum
    o['not'] = NOT110 + (': ' + ek if ek else '') + '.'

open(P, 'w', encoding='utf-8').write(json.dumps(d, ensure_ascii=False, indent=1))
print(len(B), 'güç bağlandı,', len(seen), 'eşya')
