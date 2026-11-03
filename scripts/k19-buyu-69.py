"""Kuyruk 19 (görev 3): SRD 5.2.1 6.–9. seviye büyüler → data/spells-69.json (tembel; loadClassData).

Seviye, okul, sınıflar, döküm süresi, menzil, süre ve konsantrasyon SRD'den (`data/srd/spells.json`); mekanik bu
tabloda (motorun büyü türleri: save, attack, heal, effect, zone, summon, teleport, revive, cure, dispel, utility).
Savaşta karşılığı olmayanlar `offCombat` + `gmNote`. Çalıştırma: python scripts/k19-buyu-69.py
"""
import json, re

srd = {s['name']: s for s in json.load(open('data/srd/spells.json', encoding='utf-8'))['spells']}
CLS = {'Bard': 'Brd', 'Cleric': 'Clr', 'Druid': 'Drd', 'Paladin': 'Pal', 'Ranger': 'Rgr', 'Sorcerer': 'Sor', 'Warlock': 'Wlk', 'Wizard': 'Wiz'}

def off(note):
    return {'kind': 'utility', 'offCombat': True, 'gmNote': note}

def sphere(r, origin='point'):
    return {'shape': 'sphere', 'sizeFt': r, 'origin': origin, 'targets': 'all'}

M = {
  # --- 6. seviye
  'Blade Barrier': ({'kind': 'save', 'save': 'dex', 'damage': '6d10', 'damageType': 'slashing', 'halfOnSave': True,
                     'zone': {'rounds': 100, 'difficult': 2, 'on': ['enter', 'start'], 'once': True, 'save': 'dex', 'damage': '6d10', 'damageType': 'slashing', 'half': True, 'color': '#c9c9d6', 'icon': '⚔'}},
                    {'shape': 'wall', 'sizeFt': 100, 'origin': 'point', 'targets': 'all'}),
  'Chain Lightning': ({'kind': 'save', 'save': 'dex', 'damage': '10d8', 'damageType': 'lightning', 'halfOnSave': True, 'extraTargets': 3, 'extraWithinFt': 30, 'upcast': {'other': True, 'applied': True}}, None),
  'Circle of Death': ({'kind': 'save', 'save': 'con', 'damage': '8d8', 'damageType': 'necrotic', 'halfOnSave': True, 'upcast': {'dice': '2d8', 'applied': True}}, sphere(60)),
  'Conjure Fey': ({'kind': 'save', 'save': 'wis', 'damage': '3d12', 'damageType': 'psychic', 'conditions': ['Frightened'], 'spellAttackInstead': True, 'repeat': {'cost': 'bonus', 'target': 'enemy'},
                   'upcast': {'dice': '2d12', 'applied': True}, 'approx': 'Fey ruhu ayrı yaratık değil: yapımda ve sonraki turlarda bonus eylemle bir düşmana büyü saldırısı (3d12 Psychic) ve WIS save ya da Frightened'}, None),
  'Contingency': (off('Koşula bağlı büyü saklar (10 gün)'), None),
  'Create Undead': (off('Geceleyin cesetlerden Ghoul yaratır (1 dakika döküm)'), None),
  'Disintegrate': ({'kind': 'save', 'save': 'dex', 'damage': '10d6+40', 'damageType': 'force', 'dustAtZero': True, 'upcast': {'dice': '3d6', 'applied': True}}, None),
  'Eyebite': ({'kind': 'save', 'save': 'wis', 'conditions': ['Unconscious'], 'conditionChoices': ['Unconscious', 'Frightened', 'Poisoned'], 'repeat': {'cost': 'action', 'target': 'enemy'}}, None),
  'Find the Path': (off('Bir yere en kısa yolu sezer (1 gün)'), None),
  'Flesh to Stone': ({'kind': 'save', 'save': 'con', 'conditions': ['Restrained'], 'escalate': {'condition': 'Petrified', 'fails': 3}}, None),
  'Forbiddance': (off('Bölgeye ışınlanmayı yasaklar (1 gün)'), None),
  'Freezing Sphere': ({'kind': 'save', 'save': 'con', 'damage': '10d6', 'damageType': 'cold', 'halfOnSave': True, 'upcast': {'dice': '1d6', 'applied': True}}, sphere(60)),
  'Globe of Invulnerability': ({'kind': 'effect', 'effect': {'targets': 1, 'side': 'ally', 'self': True, 'rounds': 10, 'spellGlobe': 5, 'globeRadiusFt': 10, 'icon': '🔮'}, 'upcast': {'other': True, 'applied': True}}, None),
  'Guards and Wards': (off('Bir yapıyı korur (24 saat)'), None),
  'Harm': ({'kind': 'save', 'save': 'con', 'damage': '14d6', 'damageType': 'necrotic', 'halfOnSave': True, 'notBelowOne': True, 'maxHpDrain': True}, None),
  'Heal': ({'kind': 'heal', 'damage': '70', 'cures': ['Blinded', 'Deafened', 'Poisoned'], 'upcast': {'dice': '10', 'applied': True}}, None),
  'Heroes’ Feast': (off('Ziyafet (1 saat): 24 saat Poisoned ve Frightened bağışıklığı, +2d10 HP'), None),
  'Instant Summons': (off('Nesneyi çağırır'), None),
  'Irresistible Dance': ({'kind': 'effect', 'save': 'wis', 'effect': {'targets': 1, 'side': 'enemy', 'rounds': 10, 'speedZero': True, 'attackDis': {}, 'saveDisAll': True, 'attackedAdv': True, 'repeatSave': True, 'icon': '💃'}}, None),
  'Magic Jar': (off('Ruh kaba geçer (savaş dışı hazırlık)'), None),
  'Mass Suggestion': ({'kind': 'effect', 'save': 'wis', 'effect': {'targets': 12, 'side': 'enemy', 'rounds': 14400, 'command': 'halt', 'charm': True, 'needsHearing': True, 'icon': '🗣'}, 'approx': 'Öneri savaşta "dur" olarak'}, None),
  'Move Earth': (off('Toprağı şekillendirir (10 dakikada bir)'), None),
  'Planar Ally': (off('Varlıktan yardım ister (pazarlık)'), None),
  'Programmed Illusion': (off('Tetiklenen yanılsama'), None),
  'Sunbeam': ({'kind': 'save', 'save': 'con', 'damage': '6d8', 'damageType': 'radiant', 'halfOnSave': True, 'conditions': ['Blinded'], 'repeat': {'cost': 'action', 'target': 'any'}},
              {'shape': 'line', 'sizeFt': 60, 'widthFt': 5, 'origin': 'self', 'targets': 'all'}),
  'Transport via Plants': (off('Bitkiler arası geçit'), None),
  'True Seeing': ({'kind': 'effect', 'effect': {'targets': 1, 'side': 'ally', 'rounds': 600, 'seeInvisible': True, 'darkvision': 120, 'icon': '👁'}}, None),
  'Wall of Ice': ({'kind': 'save', 'save': 'dex', 'damage': '10d6', 'damageType': 'cold', 'halfOnSave': True, 'upcast': {'dice': '2d6', 'applied': True},
                   'zone': {'rounds': 100, 'solid': True, 'color': '#bfe6ff', 'icon': '🧊'}}, {'shape': 'wall', 'sizeFt': 100, 'origin': 'point', 'targets': 'all'}),
  'Wall of Thorns': ({'kind': 'save', 'save': 'dex', 'damage': '7d8', 'damageType': 'piercing', 'halfOnSave': True, 'upcast': {'dice': '1d8', 'applied': True},
                      'zone': {'rounds': 100, 'difficult': 4, 'obscured': 'heavy', 'on': ['enter'], 'once': True, 'save': 'dex', 'damage': '7d8', 'damageType': 'slashing', 'half': True, 'color': '#4e7a3a', 'icon': '🌿'}},
                     {'shape': 'wall', 'sizeFt': 60, 'origin': 'point', 'targets': 'all'}),
  'Wind Walk': (off('Bulut biçiminde yolculuk (8 saat)'), None),
  'Word of Recall': (off('Büyücü ve 5 istekli dost sığınağa ışınlanır: savaştan kaçış (Game Master savaşı bitirir)'), None),
  # --- 7. seviye
  'Arcane Sword': ({'kind': 'attack', 'damage': '4d12', 'damageType': 'force', 'repeat': {'cost': 'bonus', 'target': 'enemy'}, 'melee': True}, None),
  'Conjure Celestial': ({'kind': 'save', 'save': 'dex', 'damage': '6d12', 'damageType': 'radiant', 'halfOnSave': True, 'upcast': {'dice': '1d12', 'applied': True},
                         'zone': {'rounds': 100, 'on': ['enter', 'start'], 'once': True, 'save': 'dex', 'damage': '6d12', 'damageType': 'radiant', 'half': True, 'targets': 'enemies', 'light': 2, 'healAllies': '4d12', 'color': '#fff1a8', 'icon': '✨'}},
                        {'shape': 'sphere', 'sizeFt': 10, 'origin': 'point', 'targets': 'enemies'}),
  'Delayed Blast Fireball': ({'kind': 'save', 'save': 'dex', 'damage': '12d6', 'damageType': 'fire', 'halfOnSave': True, 'upcast': {'dice': '1d6', 'applied': True}}, sphere(20)),
  'Divine Word': ({'kind': 'utility', 'save': 'cha', 'hpTiers': [[20, 'dead'], [30, 'Blinded+Deafened+Stunned'], [40, 'Blinded+Deafened'], [50, 'Deafened']]}, None),
  'Etherealness': ({'kind': 'effect', 'effect': {'targets': 1, 'side': 'ally', 'self': True, 'rounds': 4800, 'ethereal': True, 'icon': '👻'}}, None),
  'Finger of Death': ({'kind': 'save', 'save': 'con', 'damage': '7d8+30', 'damageType': 'necrotic', 'halfOnSave': True, 'riseZombie': True}, None),
  'Fire Storm': ({'kind': 'save', 'save': 'dex', 'damage': '7d10', 'damageType': 'fire', 'halfOnSave': True}, {'shape': 'sphere', 'sizeFt': 25, 'origin': 'point', 'targets': 'all'}),
  'Forcecage': ({'kind': 'effect', 'effect': {'targets': 1, 'side': 'enemy', 'rounds': 600, 'sealed': True, 'speedZero': True, 'icon': '▣'}}, None),
  'Magnificent Mansion': (off('Boyut ötesi konak (24 saat)'), None),
  'Mirage Arcane': (off('Arazi yanılsaması (10 gün)'), None),
  'Plane Shift': ({'kind': 'effect', 'spellAttack': True, 'save': 'cha', 'effect': {'targets': 1, 'side': 'enemy', 'rounds': 1e9, 'banished': True, 'grants': ['Incapacitated'], 'icon': '🌀'},
                   'approx': 'İstemsiz hedef: melee büyü saldırısı + CHA save; başka düzleme gider (savaş boyunca sürgün)'}, None),
  'Prismatic Spray': ({'kind': 'utility', 'save': 'dex', 'prismatic': True, 'aimHex': True}, None),
  'Project Image': (off('Uzak yerde suret (1 gün)'), None),
  'Regenerate': ({'kind': 'heal', 'damage': '4d8+15', 'regen': 1}, None),
  'Resurrection': ({'kind': 'revive', 'revive': 'raise', 'offCombat': True, 'gmNote': 'Bir yüzyıla kadar ölü yaratığı diriltir (1 saat)'}, None),
  'Reverse Gravity': ({'kind': 'utility', 'save': 'dex', 'reverseGravity': True, 'fallFt': 100, 'aimHex': True}, None),
  'Sequester': (off('Nesne/istekli yaratık saklanır'), None),
  'Simulacrum': (off('Kopya yaratık (12 saat döküm)'), None),
  'Symbol': (off('Tetiklenen glif (1 dakika döküm; tuzak olarak Game Master yerleştirir)'), None),
  'Teleport': (off('Büyücü ve 8 istekli dost başka yere ışınlanır: savaştan kaçış (Game Master savaşı bitirir)'), None),
  # --- 8. seviye
  'Animal Shapes': ({'kind': 'effect', 'effect': {'targets': 6, 'side': 'ally', 'rounds': 14400, 'polymorph': True, 'icon': '🐻'}, 'approx': 'Polymorph biçim olayıyla, istekli dostlar'}, None),
  'Antimagic Field': ({'kind': 'effect', 'effect': {'targets': 1, 'side': 'ally', 'self': True, 'rounds': 600, 'antimagic': 10, 'icon': '🚫'}}, None),
  'Antipathy/Sympathy': (off('Yer/nesne itme-çekme (10 gün)'), None),
  'Befuddlement': ({'kind': 'save', 'save': 'int', 'damage': '10d12', 'damageType': 'psychic', 'halfOnSave': True, 'failEffect': {'rounds': 1e9, 'noCast': True, 'repeatSaveEvery': 300}}, None),
  'Clone': (off('Yedek beden'), None),
  'Control Weather': (off('Hava durumu (8 saat)'), None),
  'Demiplane': (off('Yarı düzleme kapı'), None),
  'Dominate Monster': ({'kind': 'effect', 'save': 'wis', 'effect': {'targets': 1, 'side': 'enemy', 'rounds': 600, 'dominate': True, 'grants': ['Charmed'], 'damageSave': {}, 'saveAdvantage': True, 'icon': '👑'}}, None),
  'Earthquake': ({'kind': 'save', 'save': 'dex', 'conditions': ['Prone'], 'zone': {'rounds': 10, 'difficult': 2, 'on': ['start'], 'save': 'dex', 'conditions': ['Prone'], 'breakConcentration': True, 'color': '#8a6b3d', 'icon': '🌋'}},
                 {'shape': 'sphere', 'sizeFt': 100, 'origin': 'point', 'targets': 'all'}),
  'Glibness': ({'kind': 'effect', 'effect': {'targets': 1, 'side': 'ally', 'self': True, 'rounds': 600, 'chaFloor': 15, 'icon': '🗨'}}, None),
  'Holy Aura': ({'kind': 'effect', 'effect': {'targets': 8, 'side': 'ally', 'rounds': 10, 'saveAdv': ['str', 'dex', 'con', 'int', 'wis', 'cha'], 'attackedDis': True, 'icon': '😇'},
                 'approx': 'Fiend/Undead vurana CON save ya da Blinded yansıması yok'}, None),
  'Incendiary Cloud': ({'kind': 'save', 'save': 'dex', 'damage': '10d8', 'damageType': 'fire', 'halfOnSave': True,
                        'zone': {'rounds': 10, 'obscured': 'heavy', 'on': ['enter', 'end'], 'once': True, 'save': 'dex', 'damage': '10d8', 'damageType': 'fire', 'half': True, 'drift': 10, 'color': '#d9622b', 'icon': '🔥'}}, sphere(20)),
  'Maze': ({'kind': 'effect', 'effect': {'targets': 1, 'side': 'enemy', 'rounds': 100, 'banished': True, 'grants': ['Incapacitated'], 'escapeCheck': {'dc': 20, 'skills': ['investigation']}, 'icon': '🌀'}}, None),
  'Mind Blank': ({'kind': 'effect', 'effect': {'targets': 1, 'side': 'ally', 'rounds': 14400, 'immune': ['Charmed'], 'immuneDamage': ['psychic'], 'icon': '🧠'}}, None),
  'Power Word Stun': ({'kind': 'utility', 'powerWord': 'stun', 'needsTarget': True}, None),
  'Sunburst': ({'kind': 'save', 'save': 'con', 'damage': '12d6', 'damageType': 'radiant', 'halfOnSave': True, 'conditions': ['Blinded']}, sphere(60)),
  'Tsunami': ({'kind': 'save', 'save': 'str', 'damage': '6d10', 'damageType': 'bludgeoning', 'halfOnSave': True, 'pushFt': 30}, {'shape': 'wall', 'sizeFt': 300, 'origin': 'point', 'targets': 'all'}),
  # --- 9. seviye
  'Astral Projection': (off('Astral yolculuk'), None),
  'Foresight': ({'kind': 'effect', 'effect': {'targets': 1, 'side': 'ally', 'rounds': 4800, 'saveAdv': ['str', 'dex', 'con', 'int', 'wis', 'cha'], 'attackAdv': True, 'checkAdv': ['str', 'dex', 'con', 'int', 'wis', 'cha'], 'attackedDis': True, 'icon': '🔭'}}, None),
  'Gate': (off('Başka düzleme kapı; adı bilinen yaratığı çağırır (Game Master kurulumda yerleştirir)'), None),
  'Imprisonment': ({'kind': 'effect', 'save': 'wis', 'effect': {'targets': 1, 'side': 'enemy', 'rounds': 1e9, 'banished': True, 'grants': ['Incapacitated'], 'icon': '⛓'}}, None),
  'Mass Heal': ({'kind': 'utility', 'massHeal': 700, 'cures': ['Blinded', 'Deafened', 'Poisoned']}, None),
  'Meteor Swarm': ({'kind': 'save', 'save': 'dex', 'damage': '40d6', 'damageType': 'fire', 'split': [{'dice': '20d6', 'type': 'fire'}, {'dice': '20d6', 'type': 'bludgeoning'}], 'halfOnSave': True,
                    'approx': 'Dört 40 ft küre yerine bir küre (büyü tek hedef altıgeni alır); yapay zekâ en kalabalık noktayı seçer'}, sphere(40)),
  'Power Word Heal': ({'kind': 'utility', 'powerWord': 'heal', 'needsTarget': True}, None),
  'Power Word Kill': ({'kind': 'utility', 'powerWord': 'kill', 'needsTarget': True}, None),
  'Prismatic Wall': ({'kind': 'zone', 'zone': {'rounds': 100, 'solid': True, 'prismatic': True, 'on': ['enter'], 'save': 'dex', 'color': '#e0a3ff', 'icon': '🌈'}}, {'shape': 'wall', 'sizeFt': 90, 'origin': 'point', 'targets': 'all'}),
  'Shapechange': ({'kind': 'effect', 'effect': {'targets': 1, 'side': 'ally', 'self': True, 'rounds': 600, 'polymorph': True, 'keepMind': True, 'icon': '🐉'}}, None),
  'Storm of Vengeance': ({'kind': 'save', 'save': 'con', 'damage': '2d6', 'damageType': 'thunder', 'conditions': ['Deafened'],
                          'zone': {'rounds': 10, 'on': ['start'], 'stages': True, 'color': '#5a6b8c', 'icon': '⛈'}}, sphere(300)),
  'Time Stop': ({'kind': 'utility', 'timeStop': '1d4+1'}, None),
  'True Polymorph': ({'kind': 'effect', 'save': 'wis', 'effect': {'targets': 1, 'side': 'any', 'rounds': 600, 'polymorph': True, 'icon': '🦋'}}, None),
  'True Resurrection': ({'kind': 'revive', 'revive': 'raise', 'offCombat': True, 'gmNote': '200 yıla kadar ölüyü tam diriltir (1 saat)'}, None),
  'Weird': ({'kind': 'save', 'save': 'wis', 'damage': '10d10', 'damageType': 'psychic', 'halfOnSave': True, 'failEffect': {'rounds': 10, 'grants': ['Frightened'], 'repeatSave': True, 'repeatFailDamage': {'dice': '5d10', 'type': 'psychic'}}}, sphere(30)),
  'Wish': ({'kind': 'utility', 'wish': True, 'gmNote': '8. seviye ya da altı bir büyüyü malzemesiz kopyalar (seçim); diğer dilekler savaş dışı (Game Master)'}, None),
}

def rng(s):
    r = s['range']
    m = re.match(r'(\d+) feet', r)
    if m: return int(m.group(1))
    if r.startswith('Self'): return 0
    if r == 'Touch': return 5
    if 'mile' in r: return 5280 * int(re.match(r'(\d+)', r).group(1)) if re.match(r'(\d+)', r) else 5280
    return 120

out = []
for name, (mech, area) in M.items():
    s = srd[name]
    ct = s['castingTime'].lower()
    cast = 'bonus' if ct.startswith('bonus') else 'reaction' if ct.startswith('reaction') else 'action'
    if not ct.startswith(('action', 'bonus', 'reaction')) and not mech.get('offCombat'):
        # Uzun döküm (1 dakika ve üstü): savaşta yapılamaz; savaş öncesi hazırlık (SRD: döküm süresince konsantrasyon).
        mech = {'kind': 'utility', 'offCombat': True, 'gmNote': f"{s['castingTime']} döküm: savaştan önce yapılır", 'combatIfCast': mech}
    sid = s['id']
    rec = {'id': sid, 'name': name, 'srd': f'spells:{sid}', 'level': s['level'], 'castingTime': cast,
           'classes': [CLS[c] for c in s['classes'] if c in CLS], 'rangeFt': rng(s),
           **({'concentration': True} if s['concentration'] else {}), 'mechanics': mech, 'school': s['school'], 'srdPage': s['source']['page']}
    if area: rec['area'] = {**area, **({'rangeFt': rng(s)} if area.get('origin') == 'point' else {})}
    out.append(rec)
missing = [n for n, s in srd.items() if s['level'] >= 6 and n not in M]
assert not missing, missing
json.dump(out, open('data/spells-69.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(out), 'büyü;', sum(1 for r in out if r['mechanics'].get('offCombat')), 'savaş dışı')
