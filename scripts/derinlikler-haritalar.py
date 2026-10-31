# Kuyruk 21 D2: Derinlikler haritalarının üreticisi (python3 scripts/derinlikler-haritalar.py). Depo kökünde çalıştırılır.
# Zemin: `npm run harita-zemin` önerisi + harita/derinlikler/duzeltme/<ad>.json elle düzeltmesi (D1). Bu betik zemine
# yalnızca iki kural uygular: (1) geçilebilir altıgene bitişik boşluk (#) duvar (s) olur (görüşü keser: labirent ve
# mağara duvarları); (2) oyuncu başlangıcından ulaşılamayan geçilebilir cepler boşluğa (#) döner. Nesneler, hedefler,
# başlangıçlar, yüzeyler ve varyant kuralları burada. Koordinatlar 0 tabanlı (sütun, satır); JSON'a 1 tabanlı yazılır.
import json, os, subprocess, tempfile
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')
OUT=os.path.join(ROOT,'harita','derinlikler')
one=lambda c,r:[c+1,r+1]
BLOCKED=set('#scumvaeOr') - set('r')   # r (kaya kümesi) zorlu, geçilebilir
BLOCKED=set('#scumvaeO')
DEADLY=set('~')
def passable(ch): return ch not in BLOCKED and ch not in DEADLY
def nbrs(c,r,W,H):
  d=[(1,-1),(1,0),(-1,-1),(-1,0),(0,-1),(0,1)] if c%2==0 else [(1,0),(1,1),(-1,0),(-1,1),(0,-1),(0,1)]
  return [(c+dc,r+dr) for dc,dr in d if 0<=c+dc<W and 0<=r+dr<H]
def zemin(ad,size):
  with tempfile.TemporaryDirectory() as td:
    out=os.path.join(td,'z.json')
    subprocess.run(['npm','run','-s','harita-zemin','--',ad,'--boyut',size,'--gorsel','derinlikler/'+ad,'--k','12','--cikti',out],cwd=ROOT,check=True,capture_output=True)
    return [list(l) for l in json.load(open(out))['tiles']]
def finish(T,start):
  H,W=len(T),len(T[0])
  for r in range(H):
    for c in range(W):
      if T[r][c]=='#' and any(passable(T[rr][cc]) or T[rr][cc] in DEADLY for cc,rr in nbrs(c,r,W,H)): T[r][c]='s'
  seen={start}; q=[start]
  while q:
    c,r=q.pop()
    for cc,rr in nbrs(c,r,W,H):
      if (cc,rr) not in seen and passable(T[rr][cc]): seen.add((cc,rr)); q.append((cc,rr))
  for r in range(H):
    for c in range(W):
      if passable(T[r][c]) and (c,r) not in seen and T[r][c] not in 'u': T[r][c]='s'
  return T
SAFE=lambda T,c,r: T[r][c] in '.pnlo'
def snap(T,pts,taken):
  # Tasarım konumu duvara düştüyse en yakın güvenli, boş altıgen (görsel ızgarası yaklaşık; düşman yerleri yalnızca başlangıç).
  H,W=len(T),len(T[0]); out=[]; taken=set(taken)
  for p in pts:
    q=[p]; seen={p}
    while q:
      c,r=q.pop(0)
      if SAFE(T,c,r) and (c,r) not in taken: break
      for n in nbrs(c,r,W,H):
        if n not in seen: seen.add(n); q.append(n)
    out.append((c,r)); taken.add((c,r))
  return out
TRAP={"id":"trap","hidden":True,"perceptionDc":13,"save":"DEX","dc":13,"damage":"2d6","damageType":"piercing","once":True}
DARK={"id":"darkness","optional":True,"unlitSightHexes":3,"darkvisionHexes":12,"lightRadiusHexes":4,"lights":[],"unseenTargetsUntargetable":True,"unseenAttackerAdvantage":True}
LAVA=[{"id":"lavaEdge","save":None,"damage":"1d6","damageType":"fire","when":"startOfOwnTurn","requires":["adjacentToLava"],"note":"Lava bitişik altıgende tur başında 1d6 ateş (Volkan kuralı)."}]
def write(ad,name,nameEn,size,env,players,enemies,objects,goals,note,rules,effects,surfaces=None):
  T=finish(zemin(ad,size),players[0])
  enemies=snap(T,enemies,set(players))
  bad=[(c,r) for c,r in players+enemies if not SAFE(T,c,r)]
  if bad: raise SystemExit(f'{ad}: güvenli olmayan başlangıç {bad} ' + str([T[r][c] for c,r in bad]))
  for o in objects:
    c,r=o['at'][0]-1,o['at'][1]-1
    if T[r][c] in BLOCKED or T[r][c] in DEADLY: raise SystemExit(f'{ad}: nesne geçilmez zeminde {o}')
  surf=[{"kind":s["kind"],"hexes":[one(c,r) for c,r in s["hexes"] if passable(T[r][c])]} for s in (surfaces or [])]
  m={"id":ad,"bolge":"derinlikler","gorsel":f"derinlikler/{ad}","name":name,"nameEn":nameEn,"environmentId":env,"orientation":"flat-top","offset":"odd-q",
     "size":{"cols":len(T[0]),"rows":len(T)},"hexFeet":5,"tiles":[''.join(r) for r in T],
     "startZones":{"players":{"colRange":[min(p[0] for p in players)+1,max(p[0] for p in players)+1],"hexes":[one(*p) for p in players]},
                   "enemies":{"colRange":[min(p[0] for p in enemies)+1,max(p[0] for p in enemies)+1],"hexes":[one(*p) for p in enemies]},
                   "note":"Kuyruk 21 D2: başlangıçlar sefer tasarımındaki girişlerden."},
     "mirrorable":False,"sefer":"derinlikler",
     "hide":{"terrain":{},"adjacentTo":{"m":0,"x":0,"r":0,"v":0},"note":"Sütun, kaya, dikit, sandık ve fıçı arkasında gizlenilir."},
     "objects":objects,"goals":goals,
     "variants":[{"id":"varsayilan","name":"Derinlikler","nameEn":"The Depths","image":f"maps/derinlikler/{ad}.webp","rules":rules,"effects":effects}],
     "notes":{"tasarim":note}}
  if [s for s in surf if s["hexes"]]: m["surfaces"]=[s for s in surf if s["hexes"]]
  open(os.path.join(OUT,ad+'.json'),'w').write(json.dumps(m,ensure_ascii=False,indent=1)+'\n')
  print(ad); print('\n'.join(m['tiles']))

def veya(gid,*options): return {"mode":"any","list":[{"id":gid,"kind":"veya","options":[[{"id":gid+"-yen","kind":"defeat"}]]+list(options)}]}
def reach(gid,hexes,who="all"): return [{"id":gid,"kind":"reach","who":who,"hexes":[one(*h) for h in hexes]}]

# 1) Mağara ve karakol 31×17: yüzeyden ağız (KD), karakolda aşağı inen merdiven (çıkış).
write('derinlikler-magara-karakol','Maden Ocağı','Mine Works','31x17','yeralt-ma-ara',
  players=[(25,1),(26,1),(27,1),(24,2),(25,2),(26,2),(27,2),(28,2),(24,3),(25,3),(26,3),(27,3)],
  enemies=[(13,9),(16,9),(25,9),(27,9),(19,11),(21,11),(13,12),(15,12),(26,11),(14,10),(8,4),(10,5),(4,8),(5,10),(3,5),(12,3)],
  objects=[{"id":"karakol-kapi","kind":"door","at":one(20,8),"state":"closed"},{"id":"maden-kapi","kind":"door","at":one(11,12),"state":"closed"},
           {"kind":"oilBarrel","at":one(16,9)},{"kind":"powderKeg","at":one(7,15)},{"id":"karakol-sandik","kind":"chest","at":one(29,10)},
           {"kind":"table","at":one(21,12)},{"kind":"brazier","at":one(22,3)}],
  goals=veya('karakol',reach('karakol-merdiven',[(14,8),(15,8)])),
  note="Kuyruk 21 D2: madenci mağarası (üst bant, sol alt göletler, obruklar) ve taş karakol (A odası ve aşağı inen merdiven 14–15,8; kuyulu B odası; sıralı salon; sağ oda; ray koridoru; maden odası). Parti KD'deki mağara ağzından (yüzey) girer. Haydutlar karakolda, iskelet ve ghoul mağarada. Hedef VEYA: düşmanları yen ya da herkes merdivene.",
  rules=[TRAP,DARK],effects=[{"type":"dust","intensity":0.4},{"type":"drip","intensity":0.4}])

# 2) Mezar labirenti 31×17: iki çıkış (batı → lav, doğu → mantar), zehir sisi.
write('derinlikler-mezar-labirenti','Mezar Labirenti','Tomb Labyrinth','31x17','yeralt-ma-ara',
  players=[(13,0),(14,0),(15,0),(16,0),(12,1),(13,1),(14,1),(15,1),(16,1),(13,2),(14,2),(15,2)],
  enemies=[(3,4),(5,8),(2,11),(8,12),(10,6),(20,2),(26,3),(28,8),(24,10),(19,12),(16,9),(22,14),(12,15),(6,14)],
  objects=[{"kind":"brazier","at":one(4,1)},{"kind":"brazier","at":one(22,8)},{"kind":"brazier","at":one(14,11)},
           {"id":"mezar-sandik-1","kind":"chest","at":one(28,1)},{"id":"mezar-sandik-2","kind":"chest","at":one(29,7)},
           {"id":"mezar-parmaklik","kind":"door","at":one(28,6),"state":"closed"}],
  goals=veya('mezar',reach('mezar-bati',[(0,7),(0,8)]),reach('mezar-dogu',[(30,13),(30,14)])),
  note="Kuyruk 21 D2: mor tuğlalı labirent; yeşil ateşli mangallar, tabutlar, sandıklar, parmaklık kapı; dört zehir sisi yüzeyi. Parti kuzeyden (karakol merdiveni) girer. İki çıkış: batı (0,7–8) lav salonuna, doğu (30,13–14) mantar mağarasına. Hedef VEYA: düşmanları yen ya da herkes bir çıkışa; seferde dal, haritadan sonra seçilir.",
  rules=[TRAP,DARK],effects=[{"type":"groundFog","intensity":0.5},{"type":"dust","intensity":0.3}],
  surfaces=[{"kind":"poison","hexes":[(3,2),(4,2),(3,3),(5,2)]},{"kind":"poison","hexes":[(20,5),(21,5),(20,6),(21,6),(19,7)]},
            {"kind":"poison","hexes":[(11,9),(12,9),(12,10)]},{"kind":"poison","hexes":[(14,14),(15,14),(16,14),(15,15)]}])

# 3) Mantar mağarası 31×17: gölet, orta çukur, zehirli mantar alanları, doğu ucunda tuzaklı sandık.
write('derinlikler-mantar-magarasi','Mantar Mağarası','Mushroom Cavern','31x17','yeralt-ma-ara',
  players=[(0,7),(0,8),(0,9),(1,8),(2,8),(1,9),(2,9),(1,7),(2,7)],
  enemies=[(12,3),(6,2),(20,2),(22,4),(13,5),(17,6),(21,9),(24,8),(20,13),(22,15),(6,14),(14,13),(17,9),(27,9)],
  objects=[{"id":"tuzakli-sandik","kind":"chest","at":one(29,8)}],
  goals=veya('mantar',reach('mantar-sandik',[(29,8),(28,8),(29,9),(30,8),(28,9)],who="any")),
  note="Kuyruk 21 D2: mantar ve kristal mağarası. Batıda merdivenli giriş (parti), gölet (5–7,7–8), ortada çukur (14–15,7–9) çevresinde halka tünel, KD camgöbeği ve GD mor mantar mağaraları (dev mantarlar ışıklı kristal: geçilmez), zehirli mantar alanları (zehir yüzeyi). En doğuda TUZAKLI SANDIK (29,8). Hedef VEYA: düşmanları yen ya da biri sandığa ulaşsın (açılınca sefer 'yutulma' geçişi).",
  rules=[TRAP,DARK],effects=[{"type":"crystalFlicker","intensity":0.6},{"type":"motes","intensity":0.5},{"type":"drip","intensity":0.3}],
  surfaces=[{"kind":"poison","hexes":[(5,2),(6,2),(5,3),(6,1)]},{"kind":"poison","hexes":[(5,13),(5,14),(6,13),(4,13)]},
            {"kind":"poison","hexes":[(21,13),(22,13),(22,14),(21,14)]},{"kind":"poison","hexes":[(13,0),(12,1)]}])

# 4) Lav salonu 21×11: orta lav akıntısı, 3 köprü (orta yıkık), iki yönlü kapılar.
write('derinlikler-lav-salonu','Lav Salonu','Lava Hall','21x11','volkan-lav',
  players=[(17,4),(18,4),(17,5),(18,5),(19,5),(17,6),(18,6),(16,5),(15,5)],
  enemies=[(2,2),(3,5),(2,8),(5,4),(5,6),(6,2),(6,8),(4,3),(4,7),(7,5),(8,4),(8,6)],
  objects=[{"kind":"brazier","at":one(16,3)},{"kind":"brazier","at":one(19,3)},{"kind":"brazier","at":one(16,7)},{"kind":"brazier","at":one(19,7)}],
  goals=veya('lav',reach('lav-bati',[(0,5),(1,4),(1,5)])),
  note="Kuyruk 21 D2: ortada lav akıntısı (sütun 9–11), üç köprü (satır 2 ve 8 sağlam, 5 yıkık: moloz). Batı kapısı (0,5) volkan tüneli, doğu kapısı (20,5) labirent; iki yönlü giriş: varsayılan başlangıç doğu (rün çemberi, mangallar), sefer düğümü girişi `giris` ile seçer. Hedef VEYA: düşmanları yen ya da herkes batı kapısına.",
  rules=[TRAP]+LAVA,effects=[{"type":"lavaGlow","intensity":0.6},{"type":"sparks","intensity":0.5},{"type":"heatHaze","intensity":0.4}])
