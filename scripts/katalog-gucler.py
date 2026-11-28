# Görev KATALOG-GUC-TAM (kural sürümü 109): data/katalog-gucler.json üreticisi (tek kaynak). Çalıştırma: python scripts/katalog-gucler.py
import json
def both(id_, name, radius, filt, save, effect, triggers=('turnStart','enter')):
    return [dict(id=id_, name=name, radius=radius, filter=filt, trigger=t, **({'save':save} if save else {}), effect=effect, cesaret=0) for t in triggers]
madness = {"kind":"effect","rounds":1,"effect":{"name":"Cosmic Madness","icon":"🌀","dice":{"die":"1d6","sign":-1,"on":["attack","save"]},"noReactions":True,"k109":{"madAlly":2}}}
dread = {"kind":"effect","rounds":1,"effect":{"name":"Dread Tide","icon":"🌊","dice":{"die":"1d4","sign":-1,"on":["attack","save"]}}}
C = {}
C['titan-of-nightmare'] = {
  "auralar": both('non-euclidean','Non-Euclidean Aura',12,'enemies',{"ability":"wis","dc":26},madness),
  "faz2": {
    "auralar": both('non-euclidean','Non-Euclidean Aura',18,'enemies',{"ability":"wis","dc":26},madness)
      + [dict(id='sleeper-pull', name='The Sleeper Awakens', radius=18, filter='enemies', trigger='turnStart', save={"ability":"str","dc":26}, effect={"kind":"pull","ft":15}, cesaret=0)],
    "zorluZemin": {"su": True,"maliyet":2},
    "tekrar": {"Eldritch Tentacle": 4}
  }
}
for k in ['ocean-nightmare','ocean-nightmare-open-sea']:
  C[k] = {"auralar": both('dread-tide','Dread Tide',6,'enemies',{"ability":"wis","dc":23},dread)}
for k in ['kozmik-anka','kozmik-anka-savas']:
  C[k] = {"auralar": [
    dict(id='halo-cleanse', name='Halo That Burns Veil and Sleep', radius=8, filter='allies', trigger='turnStart', effect={"kind":"cleanse","conditions":["Frightened","Unconscious"]}, cesaret=0),
    dict(id='halo-reveal', name='Halo That Burns Veil and Sleep', radius=8, filter='enemies', trigger='turnStart', effect={"kind":"cleanse","conditions":["Invisible"]}, cesaret=0),
    dict(id='halo-reveal', name='Halo That Burns Veil and Sleep', radius=8, filter='enemies', trigger='enter', effect={"kind":"cleanse","conditions":["Invisible"]}, cesaret=0)]}
for k in ['dragon-of-hexonia-a','dragon-of-hexonia-b']:
  C[k] = {"auralar": [
    dict(id='ten-seals-save', name='Ten Seals Core', radius=60, filter='allies', trigger='passive', effect={"kind":"saveBonus","amount":6}, cesaret=0),
    dict(id='ten-seals-mind', name='Ten Seals Core', radius=60, filter='allies', trigger='passive', effect={"kind":"conditionImmune","conditions":["Frightened","Charmed"]}, cesaret=0),
    dict(id='ten-seals-hp', name='Ten Seals Core', radius=60, filter='allies', trigger='turnStart', effect={"kind":"tempHp","amount":50}, cesaret=0)]}
C['sigmadrake'] = {"auralar": [dict(id='attr20-cha', name='Attribute 20 Lock (CHA)', radius=12, filter='allies', trigger='passive', effect={"kind":"conditionImmune","conditions":["Blinded","Charmed"]}, cesaret=0)]}
C['deltadrake'] = {"auralar": [dict(id='attr20-int', name='Attribute 20 Lock (INT)', radius=12, filter='enemies', trigger='turnStart', effect={"kind":"cleanse","conditions":["Invisible"],"dice":"1d8","type":"psychic"}, cesaret=0)]}
out = {"_not": "Görev KATALOG-GUC-TAM (kural sürümü 109): KATALOG-SIGMAYAN.md güçlerinin verisi, canavar kimliğine göre (src/battle/katalog109Types.ts K109Monster). 108 ve altında okunmaz. Elle düzenlenir; aura yarıçapı altıgen (5 ft). Kaynak harita/belgeler/KATALOG-F2-OZELLIKLER.md, KATALOG-F-TASARIM.md.", "canavarlar": C}
json.dump(out, open('data/katalog-gucler.json','w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(C), 'canavar yazıldı')
