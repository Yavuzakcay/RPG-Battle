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

# ---------------------------------------------------------------- Grup 2: saldırı ekleri, pasifler, ikinci hasar
def put(mid, **kw):
    e = C.setdefault(mid, {})
    for k, v in kw.items():
        if isinstance(v, dict) and isinstance(e.get(k), dict):
            for kk, vv in v.items():
                if isinstance(vv, dict) and isinstance(e[k].get(kk), dict): e[k][kk] = {**e[k][kk], **vv}
                else: e[k][kk] = vv
        else: e[k] = v
fx = lambda name, sure, **k: {"name": name, "sure": sure, **k}
# Mühür Ruhu (KATALOG-F-TASARIM §5; KATALOG-SIGMAYAN "Yaklaşık yazılanlar")
put('hydraxe', ekler={"Bite": {"corrode": {"armor": True}, "tur": "aşındırma"}},
    faz2={"etki": {"k109": {"meleeRetaliate": {"dice": "1d8", "type": "acid"}}}})
put('cimbombom', ekler={"Bite": {"effect": fx("Yanma", "rounds:10", icon="🔥", ongoing={"dice": "2d6", "type": "fire", "save": "dex", "dc": 21, "extinguish": True}), "tur": "süre"}})
put('wolfgang', ekler={"Claw": {"effect": fx("Ayaz Pençesi", "sourceTurnStart", speedMult=0.5), "tur": "hız"}})
put('cerbones', ekler={"Crematorium Breath": {"effect": fx("Krematoryum", "rounds:1", noHeal=True), "tur": "süre"}},
    faz2={"auralar": [dict(id='cremation-halve', name='Krematoryum Gölgesi', radius=2, filter='enemies', trigger='passive', effect={"kind": "healMult", "mult": 0.5}, cesaret=0)],
          "etki": {"hitDie": "1d8", "hitType": "necrotic"}})
put('mothraq', pasif={"k109": {"pierceResist": {"types": ["poison"]}}})
put('gongar', pasif={"k109": {"forcedImmune": True}})
put('kongark', pasif={"k109": {"forcedImmune": True}})
# Kadim (KATALOG-F2-OZELLIKLER)
put('tutsak-dragon', ekler={"Tail": {"push": {"mode": "push", "ft": 20}, "tur": "itme"},
    "Continent Roar Breath": {"push": {"mode": "push", "ft": 30}, "tur": "itme"}},
    saveEk={"Continent Roar Breath": [{"dice": "8d8", "type": "thunder"}]})
for h in ['dragon-of-hexonia-a', 'dragon-of-hexonia-b']:
    put(h, ekler={"Continent-Shaper Claw": {"effect": fx("Kıta Pençesi", "rounds:1", ac=-3), "tur": "süre"},
                  "Continent Tail": {"splash": {"radiusFt": 15, "pushFt": 40, "prone": True}, "tur": "itme"},
                  "Continent Judgment Breath": {"zeroHp": {"dies": True}, "tur": "0 HP"}},
        saveEk={"Continent Judgment Breath": [{"dice": "20d10", "type": "radiant"}]},
        pasif={"k109": {"pierceResist": {"ignoreImmune": True}, "forcedImmune": True}})
for a in ['kozmik-anka', 'kozmik-anka-savas']:
    star = {"effect": fx("Star Mark", "rounds:1", icon="✴", k109={"starMark": True}), "tur": "süre"}
    put(a, ekler={"Cosmic Beak": star, "Starfire Talons": star}, pasif={"k109": {"pierceResist": {"types": ["fire", "radiant"], "immuneToResist": True}}})
for o in ['ocean-nightmare', 'ocean-nightmare-open-sea']:
    put(o, ekler={"Fling": {"push": {"mode": "push", "ft": 60}, "tur": "itme"}}, hedefSayisi={"Storm Lightning": 3}, pasif={"freeMove": True})
put('titan-of-nightmare', ekler={"Cosmic Fling": {"push": {"mode": "push", "ft": 90}, "tur": "itme"},
    "Void-Lightning Strike": {"dropConc": True, "tur": "süre"}},
    saveEk={"Cosmic Fling": [{"dice": "3d8", "type": "force"}], "Void-Lightning Strike": [{"dice": "4d10", "type": "psychic"}]},
    hedefSayisi={"Void-Lightning Strike": 3})
# Mücevher nefes ekleri (Yavru *let, Genç *yr, Yetişkin *drake)
GEM = {
  'omeg': ('Necrotic Breath', [{"effect": fx("İyileşme yok", "rounds:1", noHeal=True)}]*3),
  'delt': ('Psychic Breath', [{"effect": fx("Zihin Sarsıntısı", "rounds:1", dice={"die": "1d4", "sign": -1, "on": ["attack", "save", "check"]})},
                              {"effect": fx("Zihin Sarsıntısı", "rounds:1", dice={"die": "1d6", "sign": -1, "on": ["attack", "save", "check"]})},
                              {"effect": fx("Zihin Kırılması", "rounds:1", grants=["Stunned"], k109={"noResist": True})}]),
  'alph': ('Thunder Breath', [{"push": {"mode": "push", "ft": 10}}, {"push": {"mode": "push", "ft": 15}}, {"push": {"mode": "push", "ft": 30}, "dropConc": True}]),
  'gamm': ('Force Breath', [{"push": {"mode": "pull", "ft": 10, "adjacent": False}}, {"push": {"mode": "pull", "ft": 15}, "effect": fx("Yerçekimi", "sourceTurnStart", speedZero=True)},
                            {"push": {"mode": "pull", "ft": 30}, "effect": fx("Yerçekimi", "sourceTurnStart", speedZero=True, grants=["Prone"])}]),
}
for base, (atkn, tiers) in GEM.items():
    for suf, spec in zip(['let', 'yr', 'adrake'], tiers):
        mid = {'gammlet': 'gamlet'}.get(base + suf, base + suf)
        put(mid, ekler={atkn: {**spec, "tur": "nefes"}})


# ---------------------------------------------------------------- Grup 3: canavar eylemi (alan bırakma, yamalar, efsanevi türleri)
SV3_STONES = ['ember-core', 'frost-heart', 'storm-spire', 'resonance-seal', 'dissolution-drop', 'venom-essence', 'blinding-sun-shard', 'sepulcher-orb', 'whisper-crystal', 'void-fracture']
STONES = ['cracked-elemental-stone', 'awakened-elemental-stone', *SV3_STONES]
NEG = ['Blinded', 'Charmed', 'Deafened', 'Frightened', 'Paralyzed', 'Poisoned', 'Restrained', 'Stunned', 'Grappled']
# Sanat yüzeyleri (KATALOG-F-TASARIM §5: "N tur yüzey sığmıyor"): ateş, buz, asit, zehir, su.
put('cimbombom', alanBirak={"molten-anvil-burst": {"yuzey": {"kind": "fire", "rounds": 2}}})
put('wolfgang', alanBirak={"rime-breath": {"yuzey": {"kind": "ice", "rounds": 3}}})
put('mothraq', alanBirak={"plague-cloud": {"yuzey": {"kind": "poison", "rounds": 10}}})
put('stormer', alanBirak={"sky-spear": {"yuzey": {"kind": "water", "rounds": 3}}})
put('hydraxe', yetenekler={"sulphur-deluge": {"minute": False, "rounds": 3}},
    alanBirak={"sulphur-deluge": {"alanlar": [{"name": "Sülfür Gölü", "rounds": 3, "spec": {"on": ["start", "enter"], "damage": "2d6", "damageType": "acid", "targets": "all", "hold": "turn", "color": "#7a9a2a", "icon": "🧪"}}]}})
put('lightaur', yetenekler={"golden-judgment": {"area": {"shape": "cylinder", "sizeFt": 20, "origin": "point", "rangeFt": 60, "heightFt": 40}}},
    alanBirak={"golden-judgment": {"karanlikSil": True}})
put('kongark', yetenekler={"star-collapse": {"pre": {"kind": "pull", "rangeFt": 30, "pullFt": 15, "save": {"ability": "str", "dc": 16}}}})
# Menzilli efsanevi ışın uzaktakini seçer (Mühür Ruhu Sv.3).
for boss, ray in [('cimbombom', 'flame-spit'), ('kongark', 'void-stone'), ('cerbones', 'black-spark'), ('mirage', 'mind-needle'), ('gongar', 'echo-shot'),
                  ('lightaur', 'ray-spear'), ('hydraxe', 'acid-spit'), ('mothraq', 'venom-needle'), ('stormer', 'chain-lightning'), ('wolfgang', 'ice-spear')]:
    put(boss, efsanevi=[{"id": ray, "patch": {"target": "far"}}])
put('mirage', yetenekEkle=[
    {"id": "misty-step", "tr": "Misty Step", "en": "Misty Step", "cost": "bonus", "kind": "teleport", "ft": 30, "toward": True, "uses": 3},
    {"id": "false-shadow", "tr": "Sahte Gölge", "en": "False Shadow", "cost": "action", "kind": "summon", "monster": "shadow", "count": 2, "adjacent": True, "uses": 1}])
put('mirath', yetenekEkle=[{"id": "misty-step", "tr": "Misty Step", "en": "Misty Step", "cost": "bonus", "kind": "teleport", "ft": 30, "toward": True, "uses": 1}])
# Kadim
put('tutsak-dragon', alanBirak={"Continent Roar Breath": {"alanlar": [{"name": "Çatlak Kaya", "rounds": 100000, "spec": {"difficult": 2, "targets": "all", "color": "#6b5a3a", "icon": "🪨"}}]}},
    efsanevi=[{"id": "seal-pull", "add": {"tr": "Mühür Çekimi", "en": "Seal Pull", "kind": "pull", "save": "str", "dc": 25, "rangeFt": 30, "pullFt": 30, "needsItem": STONES, "oncePerTurn": True}}])
for a in ['kozmik-anka', 'kozmik-anka-savas']:
    put(a, alanBirak={"Celestial Glide": {"tasi": True, "alanlar": [
            {"name": "Kozmik Anka Alevi", "rounds": 3, "spec": {"on": ["start"], "damage": "4d8", "damageType": "fire", "targets": "enemies", "hold": "turn", "color": "#ff8a3d", "icon": "🔥"}},
            {"name": "Kozmik Anka Alevi (şifa)", "rounds": 3, "spec": {"on": ["start"], "heal": "3d8+10", "targets": "allies", "hold": "turn", "color": "#ffd27a", "icon": "✨"}}]},
        "Köz Kanat Çırpışı": {"karanlikSil": True}},
        efsanevi=[{"id": "seal-melting-talon", "add": {"tr": "Mühür Eriten Pençe", "en": "Seal-Melting Talon", "kind": "seal", "rangeFt": 10, "oncePerTurn": True}},
                  {"id": "star-tear", "add": {"tr": "Yıldız Gözyaşı", "en": "Star Tear", "kind": "heal", "rangeFt": 60, "dice": "6d10+10", "cleanse": NEG, "oncePerTurn": True}}])
put('ocean-nightmare-open-sea', alanBirak={"Ink Cloud": {"alanlar": [{"name": "Mürekkep Bulutu", "rounds": 10, "spec": {"on": ["start"], "save": "con", "conditions": ["Blinded", "Poisoned"], "obscured": "heavy", "hold": "turn", "targets": "enemies", "color": "#1d1b2e", "icon": "🦑"}}]}})
put('titan-of-nightmare', alanBirak={"Uçurum Zehir Mürekkebi": {"alanlar": [{"name": "Uçurum Mürekkebi", "rounds": 10, "spec": {"on": ["start"], "save": "con", "conditions": ["Blinded", "Poisoned"], "obscured": "heavy", "silence": True, "hold": "turn", "targets": "enemies", "color": "#1d1b2e", "icon": "🦑"}}]}})

out = {"_not": "Görev KATALOG-GUC-TAM (kural sürümü 109): KATALOG-SIGMAYAN.md güçlerinin verisi, canavar kimliğine göre (src/battle/katalog109Types.ts K109Monster). 108 ve altında okunmaz. Elle düzenlenir; aura yarıçapı altıgen (5 ft). Kaynak harita/belgeler/KATALOG-F2-OZELLIKLER.md, KATALOG-F-TASARIM.md.", "canavarlar": C}
json.dump(out, open('data/katalog-gucler.json','w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(C), 'canavar yazıldı')
