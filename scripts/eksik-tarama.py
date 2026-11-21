"""Gece kuyruğu Aşama 6 (salt okuma): açık satırları belgelerden toplar, bayatlık için güncel koda/belgeye bakar.
Çıktı: harita/belgeler/EKSIK-TARAMA.md (otomatik bölüm). Çalıştırma: python3 scripts/eksik-tarama.py"""
import re, glob, os, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R = lambda p: open(os.path.join(ROOT, p), encoding='utf8').read()
rows = []  # (bölüm, kaynak, konu, durum, kontrol, öneri)

# Bayatlık: gece kuyruğunda (ve öncesinde) kapanan konular (anahtar sözcük → kapandığı yer)
CLOSED = [
  (r'Knocking Out', 'KARAR101 (101)'), (r'Dropping Prone|isteğe bağlı yere yatma|yere yatma', 'KARAR101 (101)'),
  (r'Kalkan tak|Don or Doff|kalkan tak/çıkar', 'KARAR101 (101)'), (r'Stone.s Endurance', 'KARAR101 (101)'),
  (r'sürünme|Crawling', 'KARAR101 (101)'), (r'High Jump', 'KARAR101 (101)'), (r'nightVision', 'KARAR101 (101, varsayılan açık; denge ölçülecek)'),
  (r'yakalamayı bırak|release', 'KARAR101 (101)'), (r'Dash ve hız|Dash: özel hız|A7/E3', 'KARAR101 (101)'),
  (r'inisiyatif SRD|Canavar inisiyatifi|Initiative \(\+X', 'KAPSAM103 (103)'), (r'Weakening Breath', 'KAPSAM103 (103)'),
  (r'Weight of Years', 'KAPSAM103 (103)'), (r'Cloud Giant.*Misty Step|Misty Step \(bonus\)', 'KAPSAM103 (103)'),
  (r'Gift of the Depths', 'KAPSAM103 (103)'), (r'Empowered Evocation', 'KAPSAM103 (103)'), (r'Evocation Savant', 'KAPSAM103 (oluşturucu)'),
  (r'Reliable Talent.*(kilit|Thieves)', 'KAPSAM103 (103)'), (r'Etherealness', 'BUYU-TAM (102)'), (r'Mass Cure Wounds', 'BUYU-TAM (102)'),
  (r'Confusion.*(yarıçap|radius|slot)', 'BUYU-TAM (102)'), (r'Hazırla \(Ready\) eylemi.*yok|Ready eylemi oyunda yok', 'Ready sürüm 90'),
  (r'Arcane Recovery.*yok|Sorcerous Restoration.*yok', 'characterRest.ts (var)'),
]
def stale(text):
    for pat, where in CLOSED:
        if re.search(pat, text, re.I): return where
    return ''
DEC = r'karar gerekli|karar bekliyor|Karar:'
DEFER = r'ertelendi|Serüven sonrası|sonraki tur|tam test turu'
OFF = r'savaş dışı|keşif|sosyal|zaman modeli|Influence|dil(ler)?\b|alet|zehir|tuzak|eşya yapımı|çoklu sınıf|Multiclass'

def classify(text, status):
    if re.search(DEC, text, re.I) or status == 'karar gerekli': return 3
    if re.search(DEFER, text, re.I) or status == 'ertelendi': return 2
    return 1

# 1) SRD-KAPSAM kısmi/yok satırları
for l in R('harita/belgeler/SRD-KAPSAM.md').split('\n'):
    if not l.startswith('| ') or '|---' in l: continue
    c = [x.strip() for x in l.split('|')]
    if len(c) < 7 or c[3] not in ('kısmi', 'yok'): continue
    text = f'{c[2]} — {c[5]}'
    rows.append(('SRD-KAPSAM ' + c[1], c[2][:90], c[3], c[5][:200]))
# 2) GENEL-SAVAS-DENETIM durum sütunu kısmi/yok/sapma
for l in R('harita/belgeler/GENEL-SAVAS-DENETIM.md').split('\n'):
    m = re.match(r'^\| ([A-H]\d+) \| (.*?) \| (.*?) \| (kısmi|yok|bilinçli sapma|hatalı)[^|]* \| (.*)$', l)
    if m: rows.append(('GENEL-SAVAS-DENETIM ' + m.group(1), m.group(2)[:90], m.group(4), m.group(3)[:200]))
# 3) DECISIONS satırları
for i, l in enumerate(R('DECISIONS.md').split('\n')):
    if re.search(r'\*\*(Ertelendi|ertelendi|Doğrulanmadı|Karar gerekli|Eksik, ertelendi|Ertelendi, karar gerekli)[^*]*\*\*', l) or re.search(r'karar gerekli', l, re.I):
        rows.append((f'DECISIONS.md:{i+1}', re.sub(r'\s+', ' ', l.strip('- '))[:110], 'karar gerekli' if re.search(DEC, l, re.I) else 'ertelendi', ''))
# 4) CLAUDE.md Bilinen eksikler
cm = R('CLAUDE.md'); blk = cm[cm.find('## Bilinen eksikler'):cm.find('Önerilen sıra')]
for l in blk.split('\n'):
    c = [x.strip() for x in l.split('|')]
    if len(c) >= 4 and c[2] in ('yok', 'kısmen'): rows.append(('CLAUDE.md Bilinen eksikler', c[1], c[2], c[3][:200]))
# 5) BUYU-TAM-TARAMA Karar gerekli
bt = R('harita/belgeler/BUYU-TAM-TARAMA.md'); kb = bt[bt.find('## 4. Karar gerekli'):bt.find('<!-- otomatik:başla')]
for m in re.finditer(r'^(\d+)\. \*\*(.+?)\*\*', kb, re.M): rows.append(('BUYU-TAM-TARAMA §4.' + m.group(1), m.group(2)[:90], 'karar gerekli', ''))
# 6) BUYU-KISMI açık satırları (durum sütunu "tamam" olmayan)
for l in R('harita/belgeler/BUYU-KISMI.md').split('\n'):
    c = [x.strip() for x in l.split('|')]
    if len(c) > 4 and c[1] and not c[1].startswith('---') and 'tamam' not in l and re.search(r'kısmi|yok|eksik', l): rows.append(('BUYU-KISMI', c[1][:60], 'kısmi', ' '.join(c[2:4])[:160]))
# 7) PAKET-SIGMAYAN
for l in R('harita/belgeler/PAKET-SIGMAYAN.md').split('\n'):
    c = [x.strip() for x in l.split('|')]
    if len(c) > 4 and c[1] and not c[1].startswith('---') and c[1] != 'Özellik': rows.append(('PAKET-SIGMAYAN', c[1][:60] + ' (' + c[2][:40] + ')', 'kısmi', c[-2][:120]))
# 8) *-DENETIM.md: "yok"/"ertelendi"/"karar" satırları
for f in sorted(glob.glob(os.path.join(ROOT, 'harita/belgeler/*-DENETIM.md'))):
    if f.endswith('GENEL-SAVAS-DENETIM.md'): continue
    name = os.path.basename(f)
    for l in open(f, encoding='utf8').read().split('\n'):
        if not l.startswith('| ') or '|---' in l: continue
        if re.search(r'\| (yok|ertelendi|karar gerekli|açık)\b', l, re.I) and not re.search(r'düzeldi|tamam|kapandı', l, re.I):
            c = [x.strip() for x in l.split('|')]
            rows.append((name, (c[1] + ' ' + c[2])[:90], 'yok/ertelendi', ' '.join(c[3:6])[:160]))

out = {1: [], 2: [], 3: [], 4: []}
seen = set()
for src, konu, durum, note in rows:
    key = (src.split(':')[0], konu)
    if key in seen: continue
    seen.add(key)
    st = stale(konu + ' ' + note)
    if st and durum in ('kısmi', 'yok', 'kısmen', 'ertelendi', 'karar gerekli', 'yok/ertelendi'):
        # kapanan konunun satırı: SRD-KAPSAM'da zaten güncellendiyse "[Gece kuyruğu]" işaretli → bayat sayılmaz
        if '[Gece kuyruğu]' not in note: out[4].append((src, konu, durum, f'bayat: {st}')); continue
    k = classify(konu + ' ' + note, durum)
    out[k].append((src, konu, durum, note))
OFFROWS = [r for r in out[1] if re.search(OFF, r[1] + ' ' + r[3], re.I)]
out[1] = [r for r in out[1] if r not in OFFROWS]
res = {'acik': out[1], 'ertelenen': out[2], 'karar': out[3], 'bayat': out[4], 'savasdisi': OFFROWS}
print({k: len(v) for k, v in res.items()}, 'toplam', len(seen))

# ---------------------------------------------------------------- belge
def esc(x): return (x or '').replace('|', '/').replace('\n', ' ')
def table(rs, kontrol):
    t = ['| Kaynak | Konu | Durum | Güncel kodla kontrol | Önerilen adım / not |', '|---|---|---|---|---|']
    for src, konu, durum, note in rs:
        t.append(f'| {esc(src)} | {esc(konu)} | {esc(durum)} | {esc(kontrol(note))} | {esc(note)} |')
    return '\n'.join(t)
curated = open(os.path.join(ROOT, 'scripts/eksik-tarama-elle.md'), encoding='utf8').read()
c = {k: len(v) for k, v in res.items()}
md = [ '# Eksik taraması (gece kuyruğu Aşama 6)', '',
  '`python3 scripts/eksik-tarama.py` üretir (salt okuma; elle bölümler `scripts/eksik-tarama-elle.md`). Kural sürümü 103, `birlesik`.', '',
  '## Yöntem', '',
  'Kaynaklar: `harita/belgeler/SRD-KAPSAM.md` (kısmi/yok satırları), `GENEL-SAVAS-DENETIM.md` (durum sütunu kısmi/yok/sapma),',
  '`DECISIONS.md` (ertelendi / doğrulanmadı / karar gerekli satırları), CLAUDE.md "Bilinen eksikler", `BUYU-TAM-TARAMA.md` §4,',
  '`BUYU-KISMI.md`, `PAKET-SIGMAYAN.md`, bütün `harita/belgeler/*-DENETIM.md` tablolarındaki yok/ertelendi/açık satırları. Aynı kaynak +',
  'konu bir kez. **Bayatlık:** satırın konusu gece kuyruğunda ya da önceki görevlerde kapanan bir konu listesine (KARAR101, BUYU-TAM,',
  'KAPSAM103, Ready, dinlenme özellikleri) uyuyor ve satırda "[Gece kuyruğu]" güncellemesi yoksa bayat (bölüm 4); kalanlar güncel',
  'sayıldı (kodla tek tek denenmedi; örnekleme ve kapanış listesi). Sınıflama: "karar gerekli/bekliyor" → bölüm 3, "ertelendi/Serüven',
  'sonrası/tam test turu" → bölüm 2, savaş dışı anahtar sözcükleri → bölüm 6, kalanı bölüm 1. DECISIONS.md eski kayıtları tarih',
  'kaydıdır: bayat satırları kapanmış konuları gösterir, belge düzeltilmedi.', '',
  '## Sayılar (ölçülmüş)', '',
  '| Bölüm | Satır |', '|---|---:|',
  f'| 1. Hâlâ açık ve SRD\'de olan | {c["acik"]} |', f'| 2. Bilinçli ertelenen | {c["ertelenen"]} |',
  f'| 3. Karar gerektiren (otomatik toplanan) | {c["karar"]} |', f'| 4. Bayat | {c["bayat"]} |',
  f'| 6. Savaş dışı (otomatik toplanan) | {c["savasdisi"]} |', f'| **Toplam (tekil kaynak + konu)** | **{sum(c.values())}** |', '',
  curated, '',
  '## 1. Hâlâ açık ve SRD\'de olan (otomatik)', '', table(res['acik'], lambda n: 'güncel (kapanış kaydı yok)'), '',
  '## 2. Bilinçli ertelenen (otomatik)', '', table(res['ertelenen'], lambda n: 'güncel, ertelendi'), '',
  '## 3. Karar gerektiren (otomatik toplanan; numaralı sorular yukarıda "Karar gerekli" bölümünde)', '', table(res['karar'], lambda n: 'güncel, karar bekliyor'), '',
  '## 4. Bayat satırlar (kapanmış konu, kaynak belge güncellenmemiş)', '', table(res['bayat'], lambda n: n), '',
  '## 6. Savaş dışı satırlar (otomatik)', '', table(res['savasdisi'], lambda n: 'savaş dışı'), '' ]
open(os.path.join(ROOT, 'harita/belgeler/EKSIK-TARAMA.md'), 'w', encoding='utf8').write('\n'.join(md))
print('yazıldı')
