# Kuyruk 18 V1: Volkan Seferi haritalarının zemin verisi üreticisi (python3 scripts/sefer-haritalar.py).
# Koordinatlar sefer tasarımındaki (sütun, satır; 0 tabanlı) değerler. Referans görseller (docs/harita/referans/<ad>.jpg)
# gelince ızgara karşılaştırmasıyla düzeltilir; görsel `npm run harita-gorsel -- <ad>` ile ortadan kırpılıp işlenir.
import json
import os
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','data','maps')+os.sep
def grid(W,H,ch='.'): return [[ch]*W for _ in range(H)]
def fill(T,c0,r0,c1,r1,ch):
  for r in range(r0,r1+1):
    for c in range(c0,c1+1):
      if 0<=r<len(T) and 0<=c<len(T[0]): T[r][c]=ch
def put(T,pts,ch):
  for c,r in pts: T[r][c]=ch
one=lambda c,r:[c+1,r+1]
LAVA_RULES=[{"id":"lavaEdge","save":None,"damage":"1d6","damageType":"fire","when":"startOfOwnTurn","requires":["adjacentToLava"],"note":"Lava bitişik altıgende tur başında 1d6 ateş (Volkan kuralı)."},
            {"id":"climb","heightDiffCost":2,"note":"Bir seviye yukarı çıkmak 2 altıgenlik hareket harcar (merdivenler basamak: ek maliyet yok)."}]
def write(id,name,nameEn,T,players,enemies,objects,goals,note,surfaces=None,hide=None):
  m={"id":id,"name":name,"nameEn":nameEn,"environmentId":"volkan-lav","orientation":"flat-top","offset":"odd-q",
     "size":{"cols":len(T[0]),"rows":len(T)},"hexFeet":5,"tiles":[''.join(r) for r in T],
     "startZones":{"players":{"colRange":[min(p[0] for p in players)+1,max(p[0] for p in players)+1],"hexes":[one(*p) for p in players]},
                   "enemies":{"colRange":[min(p[0] for p in enemies)+1,max(p[0] for p in enemies)+1],"hexes":[one(*p) for p in enemies]},
                   "note":"Kuyruk 18 V1: başlangıçlar sefer tasarımındaki konumlardan."},
     "mirrorable":False,"sefer":"volkan",
     "hide":hide or {"terrain":{},"adjacentTo":{"m":0,"c":0,"x":0,"r":0},"note":"Sütun, heykel, sandık ve kaya arkasında gizlenilir."},
     "seferKurallari":["barutPatlama"],
     "objects":objects,"goals":goals,
     "variants":[{"id":"varsayilan","name":"Volkan Seferi","nameEn":"Volcano Expedition","image":f"maps/harita-{id}.webp","rules":LAVA_RULES,"effects":[{"type":"lavaGlow","intensity":0.6},{"type":"sparks","intensity":0.5}]}],
     "notes":{"tasarim":note}}
  if surfaces: m["surfaces"]=surfaces
  open(OUT+id+'.json','w').write(json.dumps(m,ensure_ascii=False,indent=1)+'\n')
  print(id); print('\n'.join(m['tiles']))

# 1) isinlanma-salonu 21x11
T=grid(21,11)
fill(T,0,0,1,10,'~'); fill(T,19,0,20,10,'~')
put(T,[(2,0),(3,0),(2,10),(3,10),(17,0),(18,0),(17,10),(18,10)],'~')
fill(T,7,4,13,7,'p'); put(T,[(7,4),(13,4),(7,7),(13,7)],'.')  # sekizgen köşeler
fill(T,9,1,11,2,'l'); put(T,[(9,0),(11,0)],'s'); put(T,[(10,0)],'O')
fill(T,9,8,11,10,'l')
fill(T,4,1,5,3,'m'); fill(T,15,1,16,3,'m')
put(T,[(4,4),(4,6),(16,4),(16,6)],'c')
salon_obj=[{"id":"malzeme1","kind":"chest","at":one(2,4)},{"id":"malzeme2","kind":"chest","at":one(3,6)},{"id":"malzeme3","kind":"chest","at":one(18,5)},
           {"kind":"powderKeg","at":one(17,4)}]
unit=[one(10,5)]
salon_goals={"mode":"any","list":[{"id":"salon","kind":"veya","options":[
  [{"id":"salon-yen","kind":"defeat"}],
  [{"id":"malzeme1","kind":"retrieve","objectId":"malzeme1","hexes":unit},{"id":"malzeme2","kind":"retrieve","objectId":"malzeme2","hexes":unit},{"id":"malzeme3","kind":"retrieve","objectId":"malzeme3","hexes":unit}]]}]}
players=[(c,r) for r in (8,9,10) for c in (9,10,11)]+[(8,9),(12,9),(8,10),(12,10)]
enemies=[(c,r) for r in (1,2,3) for c in (6,7,8,12,13,14)]+[(9,4),(11,4)]
write('isinlanma-salonu','Işınlanma Salonu','Teleportation Hall',T,players,enemies,salon_obj,salon_goals,
 "Kuyruk 18 V1: orta sekizgen kaide ve ışınlanma ünitesi (10,5); kuzeyde mühürlü rün kapısı (kapalı, dekor), güneyde parti merdiveni; heykel kaideleri ve meşale sütunları siper; yanlarda üç malzeme sandığı. Hedef VEYA: düşmanları yen ya da 3 malzemeyi üniteye taşı.")

# 2) lav-tapinagi 21x11
T=grid(21,11)
fill(T,1,0,7,3,'h'); put(T,[(4,2)],'m'); fill(T,4,4,5,5,'l')
fill(T,15,0,20,3,'h'); put(T,[(18,1)],'o'); fill(T,15,3,17,5,'l'); put(T,[(15,4),(16,4),(17,4)],'l')
put(T,[(c,0) for c in range(8,15)],'~'); put(T,[(c,1) for c in range(10,15)],'~'); put(T,[(c,2) for c in range(12,15)],'~')
put(T,[(8,1),(9,2),(8,3)],'c')
fill(T,7,4,13,7,'p'); fill(T,9,5,11,6,'~')
put(T,[(11,3),(14,6)],'c')
put(T,[(0,9),(0,10),(1,10),(20,9),(20,10),(19,10)],'~')
put(T,[(0,0),(0,1)],'s')
players=[(c,r) for r in (6,7,8) for c in (5,6,7)]+[(4,7),(4,8)]
enemies=[(2,1),(3,1),(5,1),(6,2),(16,1),(17,2),(19,2),(20,1),(16,0),(19,0),(12,5),(8,5),(13,8),(10,8)]
kegs=[{"kind":"powderKeg","at":one(13,3)},{"kind":"powderKeg","at":one(15,7)}]
goals={"mode":"any","list":[{"id":"tapinak","kind":"veya","options":[[{"id":"tapinak-yen","kind":"defeat"}],[{"id":"tapinak-cikis","kind":"reach","who":"all","hexes":[one(18,1)]}]]}]}
write('lav-tapinagi','Lav Tapınağı','Lava Temple',T,players,enemies,kegs,goals,
 "Kuyruk 18 V1: GB varış çemberi (parti), KB yüksek taht odası (taht 4,2) ve merdiveni, doğuda yüksek teras ve çıkış kapısı (18,1), ortada lav havuzlu halka, kuzeyde lav nehri. Okçular yüksekte; iki barut fıçısı. Hedef VEYA: düşmanları yen ya da çıkış kapısına ulaş.")

# 3) kanyon-koprusu 21x11
T=grid(21,11)
fill(T,8,0,19,3,'~'); fill(T,1,7,11,10,'~')
fill(T,5,4,15,6,'p')
put(T,[(5,3),(5,7),(15,3),(15,7)],'m')
fill(T,15,3,20,7,'.'); put(T,[(15,3),(15,7)],'m')
put(T,[(19,2),(20,2),(18,2),(20,0),(20,1)],'s'); put(T,[(18,8),(19,8),(20,8)],'s')
fill(T,0,0,4,1,'v'); put(T,[(0,2),(1,2)],'r'); fill(T,0,9,0,10,'v'); put(T,[(0,8)],'r')
fill(T,6,7,7,7,'r')
put(T,[(6,3),(7,3),(12,7),(13,7),(14,7)],'~')
players=[(c,r) for r in (3,4,5,6,7) for c in (17,18,19,20)]
enemies=[(c,r) for c in (1,2,3) for r in (3,4,5,6)]+[(7,4),(7,6),(9,4),(9,6)]
exitw=[one(0,r) for r in range(2,8)]
kegs=[{"kind":"powderKeg","at":one(20,6)},{"kind":"powderKeg","at":one(16,7)},{"kind":"oilBarrel","at":one(16,3)}]
goals={"mode":"any","list":[{"id":"kopru","kind":"veya","options":[[{"id":"kopru-yen","kind":"defeat"}],[{"id":"kopru-cikis","kind":"reach","who":"all","hexes":exitw}]]}]}
write('kanyon-koprusu','Kanyon Köprüsü','Canyon Bridge',T,players,enemies,kegs,goals,
 "Kuyruk 18 V1: üç altıgen genişliğinde köprü (5–15, 4–6), ortada rün çemberi, dört kule siper; lav nehri köprünün altından KD→GB. Parti doğu platformda (demir kapı), çıkış batı platform kenarı (sütun 0). Kaya dikenleri batıda. Hedef VEYA: düşmanları yen ya da batı kenara ulaş.")

# 4) volkanik-demirhane 31x17
T=grid(31,17)
fill(T,1,0,2,11,'~')
fill(T,3,12,30,16,'~'); fill(T,0,12,2,16,'~')
chain=[(14,12),(14,13)]+[(c,14) for c in range(14,31)]
put(T,chain,'t')
fill(T,20,1,27,3,'h'); fill(T,22,0,25,0,'o'); put(T,[(20,0),(21,0),(26,0),(27,0)],'s'); fill(T,22,4,25,8,'l')
fill(T,6,4,15,10,'p'); fill(T,9,6,11,8,'m'); put(T,[(10,4)],'e'); put(T,[(13,7)],'x'); put(T,[(10,9),(10,10)],'p')
fill(T,3,0,19,0,'.'); fill(T,0,0,0,11,'#')
players=[(c,r) for r in (1,2,3) for c in range(20,28)]
enemies=[(6,4),(7,4),(14,4),(15,5),(6,9),(7,10),(14,10),(15,9),(12,5),(8,9),(12,9),(13,4),(5,7),(16,7)]
objs=[{"kind":"oilBarrel","at":one(c,1)} for c in (6,9,12)]+[{"kind":"powderKeg","at":one(c,2)} for c in (8,14)]+[{"kind":"powderKeg","at":one(5,10)},{"kind":"powderKeg","at":one(16,9)},{"kind":"powderKeg","at":one(18,6)}]
surf=[{"kind":"oil","hexes":[one(17,8),one(18,8),one(17,9),one(18,9)]},{"kind":"oil","hexes":[one(4,5),one(5,5),one(4,6)]}]
goals={"mode":"any","list":[{"id":"demirhane","kind":"veya","options":[[{"id":"demirhane-yen","kind":"defeat"}],[{"id":"demirhane-cikis","kind":"reach","who":"all","hexes":[one(30,14)]}]]}]}
write('volkanik-demirhane','Volkanik Demirhane','Volcanic Forge',T,players,enemies,objs,goals,
 "Kuyruk 18 V1: KD iniş platformu ve kapısı (parti), merdiven; demirhane platformu (kazan 3×3, fırın, örs, rün çemberi), batıda lav akıntısı, kuzey şeritte fıçılar, iki yağ birikintisi. Çıkış: güneydeki lav gölünde taş zinciri (satır 14, sütun 14–30), doğu ucu (30,14); kuru zemin çıkışa varmaz. Hedef VEYA: düşmanları yen ya da çıkışa ulaş. İkincil hedef (fırını söndür) yok.",
 surfaces=surf)
