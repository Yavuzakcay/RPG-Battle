"""Kuyruk 19 (görev 7): SRD 5.2.1 canavar yetenekleri → data/canavar-yetenekleri.json (anahtar `srdK19`).

Her canavar için `abilities` (eylem / bonus eylem; komut `monster_ability`; tür: strike, spell, save, teleport, buff,
grant, heal, pull, swallow, summon) ve `passive` (savaş başında: süren etki, işaret, emme, hasar tepkisi, auralar, tur
başı/sonu, ölüm patlaması, baş sayısı). Değerler SRD stat bloğundan (sayfa `docs/SRD_CC_v5.2.1.pdf` Monsters A–Z).
Çalıştırma: python scripts/k19-canavar-yetenek.py
"""
import json

def ab(id, en, tr, cost, kind, **kw):
    return {'id': id, 'en': en, 'tr': tr, 'cost': cost, 'kind': kind, **kw}

D = {}
def add(mid, abilities=None, **passive):
    cur = D.setdefault(mid, {})
    if abilities:
        have = {a['id'] for a in cur.get('abilities', [])}
        cur.setdefault('abilities', []).extend(a for a in abilities if a['id'] not in have)
    if passive:
        cur.setdefault('passive', {}).update(passive)

# --- bonus eylem / eylem yetenekleri
add('troll', [ab('charge', 'Charge', 'Hücum', 'bonus', 'strike', halfMove=True, moveOnly=True)], loathsomeLimbs={'uses': 4, 'slashing': 15})
add('xorn', [ab('charge', 'Charge', 'Hücum', 'bonus', 'strike', halfMove=True, moveOnly=True)], passCreatures=False)
add('spy', bonusGrant=['dash', 'disengage', 'hide'])
add('assassin', bonusGrant=['dash', 'disengage', 'hide'], traits=['evasion'])
add('vampire-familiar', bonusGrant=['dash', 'disengage'])
add('vampire-spawn', bonusGrant=['dash', 'disengage'], sunlight={'dice': '20', 'type': 'radiant'}, runningWater={'dice': '20', 'type': 'acid'})
add('clay-golem', [ab('hasten', 'Hasten', 'Hızlan', 'bonus', 'grant', grant=['dash', 'disengage'], recharge=5)], absorb=['acid'], berserk=True, traits=['immutable-form'])
add('weretiger', [ab('prowl', 'Prowl', 'Sinsi Yürüyüş', 'bonus', 'grant', grant=['dash', 'disengage', 'hide'], fullMoveNoOA=True)])
add('shadow', [ab('shadow-stealth', 'Shadow Stealth', 'Gölge Gizlenmesi', 'bonus', 'grant', grant=['hide'], dimOnly=True)], sunlightWeak=True)
add('sahuagin-warrior', [ab('aquatic-charge', 'Aquatic Charge', 'Suda Hücum', 'bonus', 'strike', fullMove=True, moveOnly=True, waterOnly=True)], bloodFrenzy=True)
add('seahorse', [ab('bubble-dash', 'Bubble Dash', 'Kabarcık Atılışı', 'action', 'grant', grant=['dash', 'disengage'], waterOnly=True)])
add('giant-seahorse', [ab('bubble-dash', 'Bubble Dash', 'Kabarcık Atılışı', 'bonus', 'grant', grant=['dash', 'disengage'], waterOnly=True)])
add('centaur-trooper', [ab('trampling-charge', 'Trampling Charge', 'Çiğneyen Hücum', 'bonus', 'save', recharge=5, trample=True, save='str', dc=14, damage='1d6+4', damageType='bludgeoning', conditions=['Prone'], noHalf=True)])
for m, dc, dmg in (('gorgon', 16, '2d10+5'), ('elephant', 12, '2d10+4'), ('mammoth', 18, '4d10+7')):
    add(m, [ab('trample', 'Trample', 'Çiğneme', 'bonus', 'save', save='dex', dc=dc, rangeFt=5, damage=dmg, damageType='bludgeoning', half=True, needsCondition='Prone')])
for m, dmg, dc, rng in (('gnoll-warrior', None, None, None), ('giant-hyena', None, None, None)):
    pass
add('gnoll-warrior', [ab('rampage', 'Rampage', 'Kudurma', 'bonus', 'strike', uses=1, halfMove=True, attack='Rend', afterBloodiedHit=True)])
add('giant-hyena', [ab('rampage', 'Rampage', 'Kudurma', 'bonus', 'strike', uses=1, halfMove=True, attack='Bite', afterBloodiedHit=True)])
add('bulette', [ab('leap', 'Leap', 'Sıçrama', 'bonus', 'save', leapFt=15, save='dex', dc=15, damage='3d12', damageType='bludgeoning', conditions=['Prone'], half=True, pushOnSave=5)])
add('half-dragon', [ab('leap', 'Leap', 'Sıçrama', 'bonus', 'grant', jumpFt=30)])
add('giant-ape', [ab('leap', 'Leap', 'Sıçrama', 'bonus', 'grant', jumpFt=30)])
add('giant-frog', [ab('leap', 'Leap', 'Sıçrama', 'bonus', 'grant', jumpFt=20)], jump={'long': 20})
add('giant-toad', [ab('leap', 'Leap', 'Sıçrama', 'bonus', 'grant', jumpFt=20)], jump={'long': 20})
add('frog', jump={'long': 10})
add('cat', jump={'long': 10})
add('lion', jump={'long': 25})
add('saber-toothed-tiger', jump={'long': 25})
add('deer', traits=['agile'])
add('rat', traits=['agile'])
add('medusa', [ab('petrifying-gaze', 'Petrifying Gaze', 'Taşlaştıran Bakış', 'bonus', 'save', recharge=5, save='con', dc=13, area={'shape': 'cone', 'sizeFt': 30, 'origin': 'self'}, conditions=['Restrained'], escalate='Petrified')])
add('basilisk', [ab('petrifying-gaze', 'Petrifying Gaze', 'Taşlaştıran Bakış', 'bonus', 'save', recharge=4, save='con', dc=12, area={'shape': 'cone', 'sizeFt': 30, 'origin': 'self'}, conditions=['Restrained'], escalate='Petrified')])
add('balor', [ab('teleport', 'Teleport', 'Işınlanma', 'bonus', 'teleport', ft=60, toward=True)], deathBurst={'radiusFt': 30, 'save': 'dex', 'dc': 20, 'dice': '9d6', 'type': 'fire', 'dice2': '9d6', 'type2': 'force', 'half': True})
add('blink-dog', [ab('teleport', 'Teleport', 'Işınlanma', 'bonus', 'teleport', ft=40, recharge=4, away=True)])
add('marilith', [ab('teleport', 'Teleport', 'Işınlanma', 'bonus', 'teleport', ft=120, recharge=5, toward=True)], traits=['reactive'])
add('nalfeshnee', [ab('teleport', 'Teleport', 'Işınlanma', 'action', 'teleport', ft=120, toward=True),
                   ab('horror-nimbus', 'Horror Nimbus', 'Dehşet Halesi', 'bonus', 'save', recharge=5, save='wis', dc=15, area={'shape': 'emanation', 'sizeFt': 15, 'origin': 'self'}, damage='8d6', damageType='psychic', conditions=['Frightened'], minute=True, breakOnDamage=True)])
add('phase-spider', [ab('ethereal-jaunt', 'Ethereal Jaunt', 'Ruhani Sıçrayış', 'bonus', 'ethereal')])
add('nightmare', [ab('ethereal-stride', 'Ethereal Stride', 'Ruhani Adım', 'action', 'ethereal')], illumination=2)
add('ghost', [ab('etherealness', 'Etherealness', 'Ruhanilik', 'action', 'ethereal')])
add('dryad', [ab('tree-stride', 'Tree Stride', 'Ağaç Geçişi', 'bonus', 'teleport', ft=60, nearTree=True)])
add('ettercap', [ab('reel', 'Reel', 'Sarma', 'bonus', 'pull', rangeFt=30, pullFt=25, needsCondition='Restrained')])
add('roper', [ab('reel', 'Reel', 'Sarma', 'action', 'pull', rangeFt=60, pullFt=30, needsCondition='Grappled')])
add('roc', [ab('swoop', 'Swoop', 'Pike', 'bonus', 'drop', recharge=5)])
add('bugbear-stalker', [ab('quick-grapple', 'Quick Grapple', 'Çabuk Kavrayış', 'bonus', 'save', save='dex', dc=13, rangeFt=10, conditions=['Grappled'], grappleDc=13, untilEscape=True)], abduct=True)
add('bugbear-warrior', abduct=True)
add('frost-giant', [ab('war-cry', 'War Cry', 'Savaş Narası', 'bonus', 'buff', recharge=5, tempHp='2d10+5', attackAdv=True, rangeFt=60)])
add('pirate-captain', [ab('captains-charm', 'Captain’s Charm', 'Kaptan Cazibesi', 'bonus', 'save', save='wis', dc=14, rangeFt=30, conditions=['Charmed'])])
add('incubus', [ab('nightmare', 'Nightmare', 'Kâbus', 'bonus', 'save', recharge=6, save='wis', dc=15, rangeFt=60, damage='4d8', damageType='psychic', sleepUnder=20)])
add('will-o-wisp', [ab('consume-life', 'Consume Life', 'Can Emme', 'bonus', 'heal', save='con', dc=10, rangeFt=5, healDice='3d6'),
                    ab('vanish', 'Vanish', 'Kayboluş', 'bonus', 'buff', self=True, grants=['Invisible'], breakOnAct=True, concentration=True)])
add('cloaker', [ab('moan', 'Moan', 'İnilti', 'bonus', 'save', save='wis', dc=13, area={'shape': 'emanation', 'sizeFt': 60, 'origin': 'self'}, conditions=['Frightened'])],
    lightSensitivity=True)
add('oni', [ab('invisibility', 'Invisibility', 'Görünmezlik', 'bonus', 'spell', spell='Invisibility', self=True)])
add('magmin', [ab('ignited-illumination', 'Ignited Illumination', 'Tutuşan Işık', 'bonus', 'buff', self=True, light=2, toggle=True)], deathBurst={'radiusFt': 10, 'save': 'dex', 'dc': 11, 'dice': '2d6', 'type': 'fire', 'half': True})
add('treant', [ab('animate-trees', 'Animate Trees', 'Ağaçları Canlandır', 'action', 'summon', uses=1, monster='treant', count=2, onlyAttacks=['Slam'], noRepeat=True)], siegeMonster=True)
add('wraith', [ab('create-specter', 'Create Specter', 'Hortlak Yarat', 'action', 'summon', monster='specter', count=1, fromCorpse=True)])
add('tarrasque', [ab('swallow', 'Swallow', 'Yutma', 'bonus', 'swallow', save='str', dc=27, dice='16d6', type='acid', escapeDamage=60, escapeDc=20)],
    siegeMonster=True, reflectiveCarapace=True)
add('behir', [ab('swallow', 'Swallow', 'Yutma', 'bonus', 'swallow', save='dex', dc=18, dice='6d6', type='acid', escapeDamage=30, escapeDc=14)])
add('remorhaz', [ab('swallow', 'Swallow', 'Yutma', 'bonus', 'swallow', save='str', dc=17, dice='3d6', type='acid', dice2='5d6', type2='fire', escapeDamage=30, escapeDc=15)],
    ownerTurn=[{'when': 'end', 'radiusFt': 5, 'dice': '3d10', 'type': 'fire'}])
add('purple-worm', [ab('swallow', 'Swallow', 'Yutma', 'bonus', 'swallow', save='dex', dc=19, dice='5d6', type='acid', escapeDamage=30, escapeDc=21)])
add('giant-frog', [ab('leap', 'Leap', 'Sıçrama', 'bonus', 'grant', jumpFt=20), ab('swallow', 'Swallow', 'Yutma', 'action', 'swallow', save='str', dc=11, dice='2d4', type='acid', escapeDamage=0, escapeDc=11, small=True)], jump={'long': 20})
add('giant-toad', [ab('leap', 'Leap', 'Sıçrama', 'bonus', 'grant', jumpFt=20), ab('swallow', 'Swallow', 'Yutma', 'action', 'swallow', save='str', dc=13, dice='3d6', type='acid', escapeDamage=0, escapeDc=13, small=True)], jump={'long': 20})
add('drider', [ab('spider-queen', 'Magic of the Spider Queen', 'Örümcek Kraliçe Büyüsü', 'bonus', 'spell', recharge=5, spells=['Web', 'Faerie Fire', 'Darkness'], dc=14)])
add('stone-golem', [ab('slow', 'Slow', 'Yavaşlat', 'bonus', 'spell', recharge=5, spell='Slow', dc=17)], traits=['immutable-form'])
add('cultist-fanatic', [ab('spiritual-weapon', 'Spiritual Weapon', 'Ruhani Silah', 'bonus', 'spell', uses=2, spell='Spiritual Weapon')])
add('ice-devil', [ab('ice-wall', 'Ice Wall', 'Buz Duvarı', 'action', 'spell', recharge=6, spell='Wall of Ice', level=8, dc=17)])
add('pit-fiend', [ab('hellfire', 'Hellfire Spellcasting', 'Cehennem Ateşi Büyüsü', 'action', 'spell', recharge=4, spell='Fireball', level=5, dc=21, twice=True)],
    auras=[{'name': 'Fear Aura', 'radiusFt': 20, 'save': 'wis', 'dc': 21, 'conditions': ['Frightened'], 'on': ['start'], 'targets': 'enemies'}])
add('darkmantle', [ab('darkness-aura', 'Darkness Aura', 'Karanlık Hale', 'action', 'spell', uses=1, spell='Darkness', self=True)])
add('sphinx-of-valor', roarSequence=['First Roar', 'Second Roar', 'Third Roar'])
add('unicorn', [ab('blessing', 'Unicorn’s Blessing', 'Tekboynuz Kutsaması', 'bonus', 'spell', uses=3, spells=['Cure Wounds', 'Lesser Restoration'], ally=True)])
add('djinni', [ab('storm-bolt', 'Storm Bolt', 'Fırtına Şimşeği', 'action', 'save', rangeFt=120, attackBonus=9, damage='3d8', damageType='thunder', conditions=['Prone'])])
# --- pasifler
add('steam-mephit', blurred=True, deathBurst={'radiusFt': 5, 'save': 'dex', 'dc': 10, 'dice': '2d4', 'type': 'fire', 'half': True})
add('dust-mephit', deathBurst={'radiusFt': 5, 'save': 'con', 'dc': 10, 'conditions': ['Blinded']})
add('ice-mephit', deathBurst={'radiusFt': 5, 'save': 'con', 'dc': 10, 'dice': '2d6', 'type': 'cold', 'half': True})
add('magma-mephit', deathBurst={'radiusFt': 5, 'save': 'dex', 'dc': 11, 'dice': '2d6', 'type': 'fire', 'half': True})
for m in ('swarm-of-bats', 'swarm-of-ravens', 'swarm-of-insects', 'swarm-of-piranhas', 'swarm-of-rats', 'swarm-of-venomous-snakes', 'swarm-of-crawling-claws'):
    add(m, swarm=True)
add('air-elemental', passCreatures=True)
add('water-elemental', passCreatures=True, onDamage=[{'type': 'cold', 'effect': {'speedFt': -20}, 'name': 'Freeze'}])
add('fire-elemental', passCreatures=True, fireForm={'dice': '1d10', 'type': 'fire'}, waterSusceptible={'dice': '1d6', 'type': 'cold'})
add('earth-elemental', siegeMonster=True, earthGlide=True)
add('kraken', siegeMonster=True)
add('hobgoblin-captain', authority={'radiusFt': 10})
add('boar', bloodied={'attack': True})
add('giant-boar', bloodied={'attack': True})
add('berserker', bloodied={'attack': True, 'save': True})
add('flesh-golem', absorb=['lightning'], berserk=True, traits=['immutable-form'], onDamage=[{'type': 'fire', 'effect': {'attackDis': {}, 'checkDis': ['str', 'dex', 'con', 'int', 'wis', 'cha']}, 'name': 'Aversion to Fire'}])
add('shambling-mound', absorb=['lightning'])
add('iron-golem', absorb=['fire'], traits=['immutable-form'])
add('gray-ooze', corrosive=True)
add('black-pudding', corrosive=True)
add('gibbering-mouther', auras=[{'name': 'Aberrant Ground', 'radiusFt': 10, 'difficult': True}, {'name': 'Gibbering', 'radiusFt': 20, 'save': 'wis', 'dc': 10, 'on': ['start'], 'targets': 'all', 'gibbering': True}])
add('sea-hag', auras=[{'name': 'Vile Appearance', 'radiusFt': 30, 'save': 'wis', 'dc': 11, 'conditions': ['Frightened'], 'on': ['start'], 'targets': 'enemies'}])
add('barbed-devil', ownerTurn=[{'when': 'start', 'grappled': True, 'dice': '1d10', 'type': 'piercing'}])
add('aboleth', ownerTurn=[{'when': 'end', 'radiusFt': 5, 'underwater': True, 'save': 'con', 'dc': 14, 'effect': {'noHeal': True}, 'name': 'Mucus Cloud'}])
add('vampire', sunlight={'dice': '20', 'type': 'radiant'}, runningWater={'dice': '20', 'type': 'acid'}, mistyEscape=True)
add('hydra', heads=5)
add('rakshasa', greaterMagicResistance=True)
add('gelatinous-cube', transparent=15)
add('cloaker', lightSensitivity=True)
for m in ('stone-golem',):
    pass
add('shield-guardian', traits=['immutable-form'])

add('dust-mephit', [ab('sleep', 'Sleep', 'Uyku', 'action', 'spell', uses=1, spell='Sleep', dc=10)])
add('cloaker', [ab('phantasms', 'Phantasms', 'Hayaletler', 'bonus', 'spell', uses=1, spell='Mirror Image', self=True)])
add('vampire', [ab('charm', 'Charm', 'Büyüleme', 'bonus', 'spell', recharge=5, spell='Charm Person', dc=17)])
add('invisible-stalker', passCreatures=True)
add('xorn', earthGlide=True)
add('ankheg', tunneler=True)
add('purple-worm', tunneler=True)
add('ochre-jelly', split=True)
add('black-pudding', split=True)
json.dump(D, open('data/canavar-yetenekleri.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(D), 'canavar')
