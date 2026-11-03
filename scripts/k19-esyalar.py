"""
Kuyruk 19 (görev 7): SRD 5.2.1 maceracı eşyaları ve sihirli eşyalar -> data/items.json.
Var olan kayıtlar korunur (kimlik aynı); yeni alanlar (`use`, `passive`, `bonus`, `onHit`, `spells`, `offCombat`) eklenir.
Çalıştırma: python3 scripts/k19-esyalar.py
"""
import json, re

ITEMS = 'data/items.json'
cur = json.load(open(ITEMS))
try:
    cur += json.load(open('data/items-srd.json'))
except FileNotFoundError:
    pass
by_id = {x['id']: x for x in cur}
gear = {g['id']: g for g in json.load(open('data/srd/gear.json'))['gear']}
magic = {m['id']: m for m in json.load(open('data/srd/magic-items.json'))['items']}
DMG = ['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder']

def put(id_, name, srd, text, **kw):
    e = by_id.get(id_, {'id': id_, 'name': name, 'srd': srd, 'attunement': False, 'text': text, 'effects': {}})
    e['name'] = name; e['srd'] = srd
    if 'weight' not in e:
        e['weight'] = kw.pop('weight', 0); e['weightApprox'] = True
    else:
        kw.pop('weight', None)
    for k, v in kw.items():
        if v is None: e.pop(k, None)
        else: e[k] = v
    by_id[id_] = e

OFF = 'savaş dışı'
# ---------------------------------------------------------------- maceracı eşyaları (gear)
G = {
 'acid': dict(name="Acid (vial)", use={'kind': 'throw', 'rangeFt': 20, 'save': 'dex', 'damage': '2d6', 'damageType': 'acid'}, weight=1),
 'alchemists-fire': dict(name="Alchemist's fire", use={'kind': 'throw', 'rangeFt': 20, 'save': 'dex', 'damage': '1d4', 'damageType': 'fire', 'burning': '1d4'}, weight=1),
 'holy-water': dict(name="Holy water", use={'kind': 'throw', 'rangeFt': 20, 'save': 'dex', 'damage': '2d8', 'damageType': 'radiant', 'vs': ['fiend', 'undead']}, weight=1),
 'net': dict(name="Net", use={'kind': 'throw', 'rangeFt': 15, 'save': 'dex', 'grants': ['Restrained'], 'escapeDc': 10}, weight=3),
 'antitoxin': dict(name="Antitoxin", use={'kind': 'effect', 'action': 'bonus', 'reachFt': 0, 'rounds': 600, 'effect': {'saveAdvAgainst': ['Poisoned']}}),
 'poison-basic': dict(name="Basic Poison", use={'kind': 'coat', 'action': 'bonus', 'dice': '1d4', 'damageType': 'poison', 'rounds': 10}),
 'healers-kit': dict(name="Healer's kit", passive={'traits': ['healers-kit']}, weight=3),
 'torch': dict(name="Torch", passive={'light': 8}, weight=1),
 'lamp': dict(name="Lamp", passive={'light': 9}, weight=1),
 'lantern-hooded': dict(name="Hooded Lantern", passive={'light': 12}, weight=2),
 'lantern-bullseye': dict(name="Bullseye Lantern", passive={'light': 12}, weight=2),
 'candle': dict(name="Candle", passive={'light': 2}),
}
for gid, g in gear.items():
    spec = G.get(gid)
    nm = (spec or {}).pop('name', g['name']) if spec else g['name']
    iid = by_id and next((x['id'] for x in cur if x['srd'] == f'gear:{gid}'), gid)
    if spec:
        put(iid, nm, f'gear:{gid}', (g.get('text') or nm)[:160], **spec)
    else:
        why = 'kap/giysi/araç; savaşta mekanik karşılığı yok' if any(w in gid for w in ['pack', 'bag', 'case', 'barrel', 'basket', 'bucket', 'chest', 'pouch', 'sack', 'jug', 'flask', 'vial', 'bottle', 'pot', 'quiver', 'backpack', 'clothes', 'robe', 'costume']) else 'keşif/yolculuk eşyası (hikâye)'
        if gid in ('ammunition',): why = 'cephane savaşta sayılır (silah verisi, 20 adet)'
        if gid in ('potion-of-healing', 'spell-scroll'): continue
        if gid in ('ball-bearings', 'caltrops', 'hunting-trap', 'oil', 'chain', 'manacles', 'rope'):
            why = 'Game Master nesne/yüzey aracıyla (yağ yüzeyi, tuzak); oyuncu envanteri savaşta kullanmaz'
        put(gid, g['name'], f'gear:{gid}', (g.get('text') or g['name'])[:160], offCombat=why)

# ---------------------------------------------------------------- sihirli eşyalar
def eff(**k): return k
M = {}
def m(id_, **kw): M[id_] = kw
for n in (1, 2, 3):
    m(f'armor-{n}', src='armor-1-2-or-3', name=f'Armor, +{n}', effects={'armorAcBonus': n})
    m(f'shield-{n}', src='shield-1-2-or-3', name=f'Shield, +{n}', effects={'shieldAcBonus': n})
    m(f'weapon-{n}', src='weapon-1-2-or-3', name=f'Weapon, +{n}', bonus={'weapon': n})
    m(f'ammunition-{n}', src='ammunition-1-2-or-3', name=f'Ammunition, +{n}', bonus={'weapon': n}, note='menzilli silahlara')
    m(f'wand-of-the-war-mage-{n}', src='wand-of-the-war-mage-1-2-or-3', name=f'Wand of the War Mage, +{n}', bonus={'spell': n}, attune=True)
for t in DMG:
    m(f'armor-of-resistance-{t}', src='armor-of-resistance', name=f'Armor of Resistance ({t})', passive={'resist': [t]}, attune=True)
    m(f'ring-of-resistance-{t}', src='ring-of-resistance', name=f'Ring of Resistance ({t})', passive={'resist': [t]}, attune=True)
    m(f'potion-of-resistance-{t}', src='potion-of-resistance', name=f'Potion of Resistance ({t})', use={'kind': 'effect', 'action': 'bonus', 'reachFt': 5, 'rounds': 600, 'effect': {'resist': [t]}})
for t in ('bludgeoning', 'piercing', 'slashing'):
    others = [x for x in ('bludgeoning', 'piercing', 'slashing') if x != t]
    m(f'armor-of-vulnerability-{t}', src='armor-of-vulnerability', name=f'Armor of Vulnerability ({t})', passive={'resist': [t], 'vulnerable': others}, attune=True)
for g_, s_ in (('hill', 21), ('frost', 23), ('stone', 23), ('fire', 25), ('cloud', 27), ('storm', 29)):
    m(f'belt-of-{g_}-giant-strength', src='belt-of-giant-strength', name=f'Belt of {g_.title()} Giant Strength', effects={'setAbility': {'str': s_}}, attune=True)
    m(f'potion-of-{g_}-giant-strength', src='potion-of-giant-strength', name=f'Potion of {g_.title()} Giant Strength', use={'kind': 'effect', 'action': 'bonus', 'reachFt': 5, 'rounds': 600, 'effect': {'strFloor': s_}})

m('adamantine-armor', passive={'noCrit': True})
m('amulet-of-health', effects={'setAbility': {'con': 19}}, attune=True)
m('animated-shield', use={'kind': 'effect', 'action': 'bonus', 'reachFt': 0, 'rounds': 10, 'effect': {'ac': 2}}, attune=True, note='1 dakika eller boş +2 AC')
m('armor-of-invulnerability', passive={'resist': ['bludgeoning', 'piercing', 'slashing']}, use={'kind': 'effect', 'action': 'action', 'reachFt': 0, 'rounds': 100, 'effect': {'immune': ['bludgeoning', 'piercing', 'slashing']}}, attune=True)
m('arrow-catching-shield', passive={'acRanged': 2}, attune=True)
m('bead-of-force', spells=[{'name': 'Resilient Sphere'}], charges=1, dc=15, note='fırlatma: 10 ft küre 5d4 force ve küre; Resilient Sphere ile')
m('belt-of-dwarvenkind', passive={'darkvision': 60, 'resist': ['poison'], 'saveAdvAgainst': ['Poisoned']}, attune=True)
m('berserker-axe', bonus={'weapon': 1}, attune=True, note='+1 ve seviye başına HP (HP maksimumu sheet dışı: savaşta +1 saldırı/hasar)')
m('boots-of-elvenkind', passive={'checkAdv': ['dex']})
m('boots-of-levitation', spells=[{'name': 'Levitate'}], charges=99, attune=True)
m('boots-of-speed', use={'kind': 'effect', 'action': 'bonus', 'reachFt': 0, 'rounds': 100, 'effect': {'speedMult': 2}}, attune=True)
m('boots-of-striding-and-springing', passive={'jumpFt': 30}, attune=True)
m('boots-of-the-winterlands', passive={'resist': ['cold']}, attune=True)
m('bracers-of-archery', onHit={'dice': '2', 'type': 'piercing', 'ranged': True, 'label': 'Bracers of Archery'}, attune=True)
m('bracers-of-defense', effects={'unarmoredAcBonus': 2}, attune=True)
m('brooch-of-shielding', passive={'resist': ['force']}, note='Force direnci; Magic Missile bağışıklığı (`immuneSpells`)', attune=True)
m('broom-of-flying', passive={'fly': 50})
m('cape-of-the-mountebank', spells=[{'name': 'Dimension Door'}], charges=1)
m('carpet-of-flying', passive={'fly': 60})
m('circlet-of-blasting', spells=[{'name': 'Scorching Ray'}], charges=1, attack=5)
m('cloak-of-arachnida', passive={'resist': ['poison'], 'climb': True}, spells=[{'name': 'Web'}], charges=1, dc=13, attune=True)
m('cloak-of-displacement', passive={'attackedDis': True}, attune=True)
m('cloak-of-elvenkind', passive={'stealthAura': True}, attune=True)
m('cloak-of-invisibility', use={'kind': 'effect', 'action': 'action', 'reachFt': 0, 'rounds': 10, 'effect': {'grants': ['Invisible']}}, attune=True)
m('cloak-of-protection', effects={'acBonus': 1, 'saveBonus': 1}, attune=True)
m('cloak-of-the-bat', passive={'stealthAura': True}, spells=[{'name': 'Polymorph'}], charges=1, attune=True)
m('cloak-of-the-manta-ray', passive={'traits': ['gift-of-the-depths']})
m('cube-of-force', spells=[{'name': 'Wall of Force'}], charges=1, attune=True)
m('dagger-of-venom', bonus={'weapon': 1}, onHit={'dice': '2d10', 'type': 'poison', 'melee': True, 'label': 'Dagger of Venom'})
m('dancing-sword', bonus={'weapon': 0}, onHit={'dice': '0', 'type': 'slashing'}, attune=True, note='dans eden kılıç ayrı savaşçı değil; silah olarak normal')
m('defender', bonus={'weapon': 3}, attune=True)
m('demon-armor', effects={'armorAcBonus': 1}, onHit={'dice': '1d8', 'type': 'slashing', 'melee': True, 'label': 'Demon Armor pençesi'}, attune=True)
m('dimensional-shackles', note=OFF)
m('dragon-scale-mail', effects={'armorAcBonus': 1}, passive={'resist': ['fire']}, attune=True, note='direnç türü renkten; varsayılan Red (fire)')
m('dragon-slayer', bonus={'weapon': 1}, onHit={'dice': '3d6', 'type': 'slashing', 'vs': ['dragon'], 'label': 'Dragon Slayer'})
m('dust-of-disappearance', use={'kind': 'effect', 'action': 'action', 'reachFt': 10, 'rounds': 20, 'effect': {'grants': ['Invisible']}})
m('dust-of-sneezing-and-choking', use={'kind': 'throw', 'rangeFt': 15, 'save': 'con', 'dc': 15, 'grants': ['Incapacitated']})
m('dwarven-plate', effects={'armorAcBonus': 2})
m('dwarven-thrower', bonus={'weapon': 3}, onHit={'dice': '1d8', 'type': 'bludgeoning', 'ranged': True, 'vs': ['giant'], 'label': 'Dwarven Thrower'}, attune=True)
m('elixir-of-health', use={'kind': 'effect', 'action': 'bonus', 'reachFt': 5, 'rounds': 1, 'effect': {'cureOnCast': ['Blinded', 'Deafened', 'Paralyzed', 'Poisoned']}})
m('elven-chain', effects={'armorAcBonus': 1})
m('energy-bow', bonus={'weapon': 1}, attune=True)
m('eyes-of-charming', spells=[{'name': 'Charm Person'}], charges=3, dc=13, attune=True)
m('eyes-of-the-eagle', passive={'checkAdv': ['wis']}, attune=True)
m('flame-tongue', onHit={'dice': '2d6', 'type': 'fire', 'melee': True, 'label': 'Flame Tongue'}, passive={'light': 8}, attune=True)
m('frost-brand', onHit={'dice': '1d6', 'type': 'cold', 'melee': True, 'label': 'Frost Brand'}, passive={'resist': ['fire']}, attune=True)
m('gauntlets-of-ogre-power', effects={'setAbility': {'str': 19}}, attune=True)
m('gem-of-brightness', spells=[{'name': 'Daylight'}], charges=50)
m('giant-slayer', bonus={'weapon': 1}, onHit={'dice': '2d6', 'type': 'slashing', 'vs': ['giant'], 'label': 'Giant Slayer'})
m('glamoured-studded-leather', effects={'armorAcBonus': 1})
m('gloves-of-missile-snaring', passive={'rangedReduce': '1d10'}, attune=True)
m('goggles-of-night', passive={'darkvision': 60})
m('hammer-of-thunderbolts', bonus={'weapon': 1}, onHit={'dice': '2d6', 'type': 'thunder', 'vs': ['giant'], 'label': 'Hammer of Thunderbolts'}, effects={'setAbility': {'str': 21}}, attune=True)
m('hat-of-many-spells', bonus={'spell': 0}, attune=True, note='rastgele büyü: savaşta Wizard büyüsü yapabilir (büyü listesi zaten sınıftan)')
m('headband-of-intellect', effects={'setAbility': {'int': 19}}, attune=True)
m('helm-of-brilliance', spells=[{'name': 'Daylight'}, {'name': 'Fireball'}, {'name': 'Wall of Fire'}], charges=6, dc=18, passive={'resist': ['fire']}, attune=True)
m('helm-of-teleportation', spells=[{'name': 'Misty Step'}], charges=3, attune=True)
m('holy-avenger', bonus={'weapon': 3}, onHit={'dice': '2d10', 'type': 'radiant', 'vs': ['fiend', 'undead'], 'label': 'Holy Avenger'}, passive={'saveAdvAgainst': ['spell']}, attune=True)
m('horn-of-blasting', use={'kind': 'throw', 'rangeFt': 30, 'save': 'con', 'dc': 15, 'damage': '5d6', 'damageType': 'thunder', 'grants': ['Deafened']})
m('horseshoes-of-a-zephyr', passive={'speedFt': 0}, note='binek eşyası (binek savaşı: atın hızı)')
m('horseshoes-of-speed', passive={'speedFt': 30}, note='bineğe giydirilir; taşıyan yaratığın hızı +30')
m('ioun-stone', effects={'acBonus': 1}, attune=True, note='Protection çeşidi (+1 AC); diğer çeşitler savaş dışı ya da yetenek artışı')
m('iron-bands', use={'kind': 'throw', 'rangeFt': 60, 'save': 'str', 'dc': 20, 'grants': ['Restrained'], 'escapeDc': 20})
m('javelin-of-lightning', onHit={'dice': '4d6', 'type': 'lightning', 'ranged': True, 'label': 'Javelin of Lightning'})
m('luck-blade', bonus={'weapon': 1}, effects={'saveBonus': 1}, attune=True)
m('mace-of-disruption', onHit={'dice': '2d6', 'type': 'radiant', 'vs': ['fiend', 'undead'], 'label': 'Mace of Disruption'}, passive={'light': 4}, attune=True)
m('mace-of-smiting', bonus={'weapon': 1}, onHit={'dice': '2d6', 'type': 'bludgeoning', 'vs': ['construct'], 'label': 'Mace of Smiting'})
m('mace-of-terror', spells=[{'name': 'Fear'}], charges=3, dc=15, attune=True)
m('mantle-of-spell-resistance', passive={'saveAdvAgainst': ['spell']}, attune=True)
m('mithral-armor', passive={'noStealthDis': True})
m('necklace-of-adaptation', passive={'saveAdvAgainst': ['Poisoned']}, attune=True, note='gaz/zehirli bulut save avantajı')
m('necklace-of-fireballs', spells=[{'name': 'Fireball'}], charges=6, dc=15)
m('necklace-of-prayer-beads', spells=[{'name': 'Bless'}, {'name': 'Cure Wounds'}, {'name': 'Lesser Restoration'}], charges=4, attune=True)
m('nine-lives-stealer', bonus={'weapon': 2}, attune=True)
m('oathbow', onHit={'dice': '3d6', 'type': 'piercing', 'ranged': True, 'label': 'Oathbow'}, attune=True, note='yeminli düşman: ilk hedefe +3d6 (tek hedef ayrımı yok, her isabette)')
m('oil-of-etherealness', use={'kind': 'effect', 'action': 'action', 'reachFt': 0, 'rounds': 600, 'effect': {'ethereal': True}})
m('oil-of-sharpness', use={'kind': 'effect', 'action': 'action', 'reachFt': 0, 'rounds': 600, 'effect': {'weaponPlus': 3}})
m('oil-of-slipperiness', use={'kind': 'effect', 'action': 'action', 'reachFt': 5, 'rounds': 4800, 'effect': {'freeMove': True}})
m('pearl-of-power', note='Pearl of Power: bir slot geri (savaş dışı ayin değil: bonus eylem — Game Master notu)', attune=True)
m('periapt-of-health', passive={'saveAdvAgainst': ['Poisoned']})
m('periapt-of-proof-against-poison', passive={'immune': ['poison']})
m('periapt-of-wound-closure', passive={'deathSaveAdv': True}, attune=True)
m('plate-armor-of-etherealness', use={'kind': 'effect', 'action': 'action', 'reachFt': 0, 'rounds': 100, 'effect': {'ethereal': True}}, attune=True)
m('potion-of-climbing', use={'kind': 'effect', 'action': 'bonus', 'reachFt': 5, 'rounds': 600, 'effect': {'climb': True}})
m('potion-of-diminution', use={'kind': 'effect', 'action': 'bonus', 'reachFt': 5, 'rounds': 600, 'effect': {'size': -1, 'saveDis': ['str'], 'damagePenalty': {'die': '1d4', 'weaponOnly': True, 'min': 1}}})
m('potion-of-flying', use={'kind': 'effect', 'action': 'bonus', 'reachFt': 5, 'rounds': 600, 'effect': {'fly': 60}})
m('potion-of-gaseous-form', use={'kind': 'effect', 'action': 'bonus', 'reachFt': 5, 'rounds': 600, 'effect': {'resist': ['bludgeoning', 'piercing', 'slashing'], 'fly': 10, 'noAttack': True}})
m('potion-of-growth', use={'kind': 'effect', 'action': 'bonus', 'reachFt': 5, 'rounds': 100, 'effect': {'size': 1, 'saveAdv': ['str'], 'hitDie': '1d4'}})
m('potion-of-heroism', use={'kind': 'effect', 'action': 'bonus', 'reachFt': 5, 'rounds': 600, 'tempHp': '10', 'effect': {'dice': {'die': '1d4', 'sign': 1, 'on': ['attack', 'save']}}})
m('potion-of-invisibility', use={'kind': 'effect', 'action': 'bonus', 'reachFt': 5, 'rounds': 600, 'effect': {'grants': ['Invisible'], 'breakOnAct': True}})
m('potion-of-invulnerability', use={'kind': 'effect', 'action': 'bonus', 'reachFt': 5, 'rounds': 10, 'effect': {'resist': DMG}})
m('potion-of-poison', use={'kind': 'effect', 'action': 'bonus', 'reachFt': 5, 'rounds': 10, 'damage': '4d6', 'damageType': 'poison', 'save': {'ability': 'con', 'dc': 13}, 'effect': {'grants': ['Poisoned']}})
m('potion-of-speed', use={'kind': 'effect', 'action': 'bonus', 'reachFt': 5, 'rounds': 10, 'effect': {'speedMult': 2, 'ac': 2, 'saveAdv': ['dex'], 'extraAction': True, 'lethargy': True}})
m('potion-of-vitality', use={'kind': 'effect', 'action': 'bonus', 'reachFt': 5, 'rounds': 1, 'effect': {'cureOnCast': ['Poisoned']}, 'tempHp': None}, note='Exhaustion ve zehir kalkar')
m('quarterstaff-of-the-acrobat', bonus={'weapon': 2}, attune=True)
m('ring-of-evasion', passive={'traits': ['evasion']}, attune=True)
m('ring-of-feather-falling', passive={'fallReduction': 999}, attune=True)
m('ring-of-free-action', passive={'freeMove': True, 'immune': ['Paralyzed', 'Restrained']}, attune=True)
m('ring-of-invisibility', use={'kind': 'effect', 'action': 'action', 'reachFt': 0, 'rounds': 600, 'effect': {'grants': ['Invisible'], 'breakOnAct': True}}, attune=True)
m('ring-of-jumping', spells=[{'name': 'Jump'}], charges=99, attune=True)
m('ring-of-mind-shielding', passive={'saveAdvAgainst': ['Charmed']}, attune=True)
m('ring-of-protection', effects={'acBonus': 1, 'saveBonus': 1}, attune=True)
m('ring-of-regeneration', passive={'regen': 1}, attune=True, note='10 dakikada 1d6 = savaşta tur başına yaklaşık 1 HP (SRD hızı korunarak)')
m('ring-of-shooting-stars', spells=[{'name': 'Faerie Fire'}, {'name': 'Dancing Lights'}], charges=6, dc=15, attune=True)
m('ring-of-spell-storing', note='dolduran büyücünün büyüleri; savaşta Game Master notu (büyü listesine eklenir)', attune=True)
m('ring-of-spell-turning', passive={'saveAdvAgainst': ['spell']}, attune=True)
m('ring-of-swimming', passive={'traits': ['gift-of-the-depths']})
m('ring-of-telekinesis', spells=[{'name': 'Telekinesis'}], charges=99, attune=True)
m('ring-of-the-ram', use={'kind': 'throw', 'rangeFt': 60, 'save': 'str', 'dc': 15, 'damage': '2d10', 'damageType': 'force', 'grants': ['Prone']}, attune=True)
m('ring-of-warmth', passive={'resist': ['cold']}, attune=True)
m('ring-of-water-walking', passive={'waterWalk': True})
m('robe-of-eyes', passive={'darkvision': 120, 'seeInvisible': True}, attune=True)
m('robe-of-scintillating-colors', use={'kind': 'effect', 'action': 'action', 'reachFt': 0, 'rounds': 1, 'effect': {'attackedDis': True}}, attune=True)
m('robe-of-stars', spells=[{'name': 'Magic Missile'}], charges=6, effects={'saveBonus': 1}, attune=True)
m('robe-of-the-archmagi', effects={'acBonus': 5}, bonus={'spell': 2}, passive={'saveAdvAgainst': ['spell']}, attune=True)
m('rod-of-absorption', note='büyü emme (tepki); Counterspell benzeri: Game Master notu', attune=True)
m('rod-of-alertness', passive={'traits': ['initiative-advantage']}, attune=True)
m('rod-of-lordly-might', bonus={'weapon': 3}, attune=True)
m('rope-of-entanglement', use={'kind': 'throw', 'rangeFt': 20, 'save': 'dex', 'dc': 15, 'grants': ['Restrained'], 'escapeDc': 15})
m('scarab-of-protection', passive={'saveAdvAgainst': ['spell']}, attune=True)
m('scimitar-of-speed', bonus={'weapon': 2}, attune=True)
m('sentinel-shield', passive={'traits': ['initiative-advantage'], 'checkAdv': ['wis']})
m('shield-of-missile-attraction', passive={'resist': []}, attune=True, note='lanetli: menzilli saldırılar sana yönelir (Game Master)')
m('shield-of-the-cavalier', effects={'shieldAcBonus': 2}, attune=True)
m('slippers-of-spider-climbing', passive={'climb': True}, attune=True)
m('spellguard-shield', passive={'saveAdvAgainst': ['spell']}, attune=True)
m('staff-of-charming', spells=[{'name': 'Charm Person'}, {'name': 'Command'}, {'name': 'Comprehend Languages'}], charges=10, attune=True)
m('staff-of-fire', spells=[{'name': 'Burning Hands'}, {'name': 'Fireball'}, {'name': 'Wall of Fire'}], charges=10, passive={'resist': ['fire']}, attune=True)
m('staff-of-frost', spells=[{'name': 'Cone of Cold'}, {'name': 'Fog Cloud'}, {'name': 'Ice Storm'}], charges=10, passive={'resist': ['cold']}, attune=True)
m('staff-of-healing', spells=[{'name': 'Cure Wounds'}, {'name': 'Lesser Restoration'}, {'name': 'Mass Cure Wounds'}], charges=10, attune=True)
m('staff-of-power', bonus={'weapon': 2, 'spell': 2}, effects={'acBonus': 2, 'saveBonus': 2}, spells=[{'name': 'Cone of Cold'}, {'name': 'Fireball'}, {'name': 'Hold Monster'}, {'name': 'Levitate'}, {'name': 'Lightning Bolt'}, {'name': 'Magic Missile'}, {'name': 'Ray of Enfeeblement'}, {'name': 'Wall of Force'}], charges=20, attune=True)
m('staff-of-striking', bonus={'weapon': 3}, onHit={'dice': '1d6', 'type': 'force', 'melee': True, 'label': 'Staff of Striking'}, attune=True)
m('staff-of-swarming-insects', spells=[{'name': 'Giant Insect'}, {'name': 'Insect Plague'}], charges=10, attune=True)
m('staff-of-the-magi', bonus={'weapon': 2, 'spell': 2}, passive={'saveAdvAgainst': ['spell']}, spells=[{'name': 'Fireball'}, {'name': 'Lightning Bolt'}, {'name': 'Ice Storm'}, {'name': 'Wall of Fire'}, {'name': 'Dispel Magic'}, {'name': 'Flaming Sphere'}, {'name': 'Web'}, {'name': 'Knock'}], charges=50, attune=True)
m('staff-of-the-python', note='yılana dönüşen asa: çağırma (Giant Constrictor Snake) — Game Master', attune=True)
m('staff-of-the-woodlands', bonus={'weapon': 2, 'spell': 2}, spells=[{'name': 'Barkskin'}, {'name': 'Speak with Animals'}, {'name': 'Pass without Trace'}, {'name': 'Speak with Plants'}, {'name': 'Animal Friendship'}], charges=10, attune=True)
m('staff-of-thunder-and-lightning', bonus={'weapon': 2}, spells=[{'name': 'Lightning Bolt'}, {'name': 'Thunderwave'}], charges=5, dc=17, attune=True)
m('staff-of-withering', onHit={'dice': '2d10', 'type': 'necrotic', 'melee': True, 'label': 'Staff of Withering'}, attune=True)
m('stone-of-good-luck-luckstone', effects={'saveBonus': 1}, passive={'dice': {'die': '1d1', 'sign': 1, 'on': ['check']}}, attune=True)
m('sun-blade', bonus={'weapon': 2}, onHit={'dice': '1d8', 'type': 'radiant', 'vs': ['undead'], 'label': 'Sun Blade'}, passive={'light': 6}, attune=True)
m('sword-of-life-stealing', onHit={'dice': '3d6', 'type': 'necrotic', 'melee': True, 'critOnly': True, 'label': 'Sword of Life Stealing'}, attune=True)
m('sword-of-sharpness', onHit={'dice': '4d6', 'type': 'slashing', 'melee': True, 'critOnly': True, 'label': 'Sword of Sharpness'}, attune=True)
m('sword-of-wounding', onHit={'dice': '2d4', 'type': 'necrotic', 'melee': True, 'label': 'Sword of Wounding'}, attune=True)
m('talisman-of-pure-good', bonus={'spell': 2}, attune=True)
m('talisman-of-the-sphere', note=OFF, attune=True)
m('talisman-of-ultimate-evil', bonus={'spell': 2}, attune=True)
m('thunderous-greatclub', onHit={'dice': '1d8', 'type': 'thunder', 'melee': True, 'label': 'Thunderous Greatclub'}, effects={'setAbility': {'str': 20}}, attune=True)
m('trident-of-fish-command', spells=[{'name': 'Dominate Beast'}], charges=3, dc=15, attune=True)
m('vicious-weapon', onHit={'dice': '7', 'type': 'slashing', 'critOnly': True, 'label': 'Vicious Weapon'})
m('vorpal-sword', bonus={'weapon': 3}, attune=True, note='baş kesme: doğal 20 (Game Master)')
m('wand-of-binding', spells=[{'name': 'Hold Monster'}, {'name': 'Hold Person'}], charges=7, dc=17, attune=True)
m('wand-of-fear', spells=[{'name': 'Command'}, {'name': 'Fear'}], charges=7, dc=15, attune=True)
m('wand-of-fireballs', spells=[{'name': 'Fireball'}], charges=7, dc=15, attune=True)
m('wand-of-lightning-bolts', spells=[{'name': 'Lightning Bolt'}], charges=7, dc=15, attune=True)
m('wand-of-magic-missiles', spells=[{'name': 'Magic Missile'}], charges=7)
m('wand-of-paralysis', spells=[{'name': 'Hold Person'}], charges=7, dc=15, attune=True, note='60 ft ışın CON save: Hold Person ile (paralizi)')
m('wand-of-polymorph', spells=[{'name': 'Polymorph'}], charges=7, dc=15, attune=True)
m('wand-of-web', spells=[{'name': 'Web'}], charges=7, dc=15, attune=True)
m('wand-of-wonder', spells=[{'name': 'Fireball'}, {'name': 'Lightning Bolt'}, {'name': 'Slow'}, {'name': 'Faerie Fire'}], charges=7, dc=15, attune=True, note='rastgele etki yerine tablodan savaşta kullanılanlar')
m('weapon-of-warning', passive={'traits': ['initiative-advantage']}, attune=True)
m('winged-boots', passive={'fly': 30}, attune=True)
m('wings-of-flying', use={'kind': 'effect', 'action': 'action', 'reachFt': 0, 'rounds': 600, 'effect': {'fly': 60}}, attune=True)
m('wind-fan', spells=[{'name': 'Gust of Wind'}], charges=1, dc=13)
m('mace-of-terror', spells=[{'name': 'Fear'}], charges=3, dc=15, attune=True)
m('potions-of-healing', skip=True)
m('ammunition-of-slaying', onHit={'dice': '6d10', 'type': 'piercing', 'ranged': True, 'label': 'Ammunition of Slaying'}, note='seçilen tür (Game Master); tek kullanım değil')
m('elemental-gem', spells=[{'name': 'Conjure Minor Elementals'}], charges=1)
m('feather-token', spells=[{'name': 'Feather Fall'}], charges=1)
m('figurine-of-wondrous-power', note='çağrılan yaratık Game Master tarafından eklenir (canavar listesinden)')
m('instant-fortress', note=OFF)
m('spell-scroll', note='parşömen: içerdiği büyü envanterde adıyla (Game Master); büyü listesinden slotsuz')
m('deck-of-illusions', note=OFF)
m('mysterious-deck', note=OFF)
m('well-of-many-worlds', note=OFF)
m('sphere-of-annihilation', note='Game Master nesnesi (2d10 × 4 force); oyuncu envanteri değil')

COMBAT_KEYS = ('passive', 'use', 'bonus', 'onHit', 'spells', 'effects')
for mid, mg in magic.items():
    variants = {k: v for k, v in M.items() if v.get('src') == mid}
    if variants:
        for vid, spec in variants.items():
            spec = dict(spec); nm = spec.pop('name'); spec.pop('src'); att = spec.pop('attune', mg.get('attunement', False)); note = spec.pop('note', None)
            put(vid, nm, f'magic-items:{mid}', (note or mg['text'])[:160], attunement=bool(att), **{k: spec[k] for k in spec})
        continue
    spec = dict(M.get(mid, {}))
    if spec.pop('skip', False): continue
    exist = next((x for x in cur if x['srd'] == f'magic-items:{mid}'), None)
    iid = exist['id'] if exist else mid
    att = spec.pop('attune', mg.get('attunement', False)); note = spec.pop('note', None)
    combat = any(k in spec for k in COMBAT_KEYS)
    if not combat:
        spec['offCombat'] = note if note and note != OFF else 'savaşta mekanik etkisi yok (hikâye, keşif, yolculuk)'
    put(iid, exist['name'] if exist else mg['name'], f'magic-items:{mid}', (note or mg['text'])[:160], attunement=bool(att), **spec)

# Ana parça sınırı: ilk 23 eşya (Kuyruk 43 öncesi) `data/items.json`'da kalır; geri kalanı tembel `data/items-srd.json`
# (`loadClassData` ile gelir; oluşturucu ve savaş ekranından önce yüklenir).
BASE = ['potion-of-healing', 'potion-of-greater-healing', 'potion-of-superior-healing', 'potion-of-supreme-healing', 'alchemists-fire', 'acid', 'holy-water', 'antitoxin', 'healers-kit', 'ring-of-protection', 'cloak-of-protection', 'bracers-of-defense', 'amulet-of-health', 'gauntlets-of-ogre-power', 'headband-of-intellect', 'belt-of-hill-giant-strength', 'boots-of-speed', 'cloak-of-displacement', 'bag-of-holding', 'wand-of-magic-missiles', 'wand-of-fireballs', 'staff-of-healing', 'poisoners-kit']
out = sorted(by_id.values(), key=lambda x: (0 if x['srd'].startswith('magic-items:potions') else 1 if x['srd'].startswith('gear') else 2, x['name']))
base = [x for x in out if x['id'] in BASE]
rest = [x for x in out if x['id'] not in BASE]
for x in rest:
    x['text'] = x['text'][:90]
json.dump(base, open(ITEMS, 'w'), ensure_ascii=False, indent=2); open(ITEMS, 'a').write('\n')
json.dump(rest, open('data/items-srd.json', 'w'), ensure_ascii=False, separators=(',', ':')); open('data/items-srd.json', 'a').write('\n')
print(len(out), 'eşya;', sum(1 for x in out if 'offCombat' not in x), 'savaşta etkili; ana parçada', len(base))
