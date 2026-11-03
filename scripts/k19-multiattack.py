"""Kuyruk 19 (görev 7): SRD Multiattack metinleri → data/multiattack.json (elle düzenlenmez).

Eski motorda "kısmi" kalan Multiattack'lar (herhangi bir bileşim, saldırının yerine nefes/büyü/özel eylem, "and uses X")
için plan kuralı: `total` saldırı sayısı, `names` bileşimde kullanılabilen saldırılar (`max` sabit sayılı metinde ad başına
üst sınır), `extra` saldırıya ek kullanımlar ("and uses Frightful Presence"), `replace` bir ya da daha çok saldırının
yerine geçenler (`cost` kaç saldırı yerine, `spell` büyüyse seviye). Çalıştırma: python scripts/k19-multiattack.py
"""
import json, re

NUM = {'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'any': 1}
ms = json.load(open('data/monsters.json', encoding='utf-8'))
out = {'_not': 'SRD 5.2.1 Multiattack planları; scripts/k19-multiattack.py üretir, elle düzenlenmez.'}
for m in ms:
    src = next((u for u in m.get('unsupported', []) if u.startswith('Multiattack')), None)
    if not src:
        continue
    text = src.split(':', 1)[1].strip()
    attacks = [a['name'] for a in m['attacks']]
    def known(n):
        n = n.strip()
        for a in attacks:
            if a.lower() == n.lower() or a.lower().startswith(n.lower() + ' ('):
                return a
        return None
    main, *rest = re.split(r'(?<=\.) (?=It can|The [a-z ]+ can|[A-Z])', text)
    plan = {'total': 0, 'names': [], 'extra': [], 'replace': []}
    mx = {}
    anycomb = 'any combination' in main
    # "makes two Claw attacks and one Bite attack" / "makes two attacks, using A or B"
    for n, name in re.findall(r'(one|two|three|four|five|six|seven|eight) ((?:[A-Z][\w’\'-]*(?: (?:of |the )?[A-Z][\w’\'-]*)*)(?: or [A-Z][\w’\'-]*(?: [A-Z][\w’\'-]*)*)?) attacks?', main):
        k = NUM[n]
        plan['total'] = max(plan['total'], plan['total'] + k if ' or it makes' not in main else k)
        for nm in re.split(r' or ', name):
            a = known(nm)
            if a and a not in plan['names']:
                plan['names'].append(a)
            if a and (not anycomb or ' other attacks' in main) and ' or ' not in name:
                mx[a] = max(mx.get(a, 0), k)
    g = re.match(r'.*?makes (one|two|three|four|five|six) (?:other )?attacks, using (.+?) in any combination', main)
    if g:
        plan['total'] = max(plan['total'], NUM[g.group(1)] + sum(mx.values()) if 'other' in main else NUM[g.group(1)])
        for nm in re.split(r', or |, | or | and ', g.group(2)):
            a = known(nm)
            if a and a not in plan['names']:
                plan['names'].append(a)
    o = re.search(r'(one|two|three|four|five|six) other attacks, using (.+?) in any combination', main)
    if o:
        plan['total'] += NUM[o.group(1)]
        for nm in re.split(r', or |, | or | and ', o.group(2)):
            a = known(nm)
            if a and a not in plan['names']:
                plan['names'].append(a)
    if 'as many Bite attacks as it has heads' in main:
        plan.update({'total': 5, 'names': ['Bite'], 'heads': True})
    for u in re.findall(r'(?:and |, and |it )uses? (?:either )?([A-Z][^.]*?)(?: if available)?(?: twice)?(?:\.|$|, and)', main):
        for nm in re.split(r', or |, | or ', u):
            a = known(nm) or nm.strip()
            if a and a not in plan['extra']:
                plan['extra'].append(a)
    if 'twice' in main and plan['extra']:
        plan['extraTwice'] = True
    for r in rest:
        c = re.search(r'replace (one|two|three|any|the [A-Z][\w ]+?) attacks? with (?:a use of |an? )?(.+?)(?: attack)?\.?$', r)
        if not c:
            continue
        cost = NUM.get(c.group(1), 1)
        for opt in re.split(r' or \(B\) | or (?=\()|^\(A\) ', c.group(2)):
            opt = re.sub(r'^\([AB]\) ', '', opt.strip()).strip()
            if not opt:
                continue
            sp = re.match(r'Spellcasting to cast (.+?)(?: \(level (\d) version\))?(?: if available)?$', opt)
            if sp:
                plan['replace'].append({'spell': sp.group(1).strip(), **({'level': int(sp.group(2))} if sp.group(2) else {}), 'cost': cost})
            else:
                nm = re.sub(r' if available$', '', opt)
                plan['replace'].append({'name': known(nm) or nm, 'cost': cost})
    if mx:
        plan['max'] = mx
    if not plan['total']:
        plan['total'] = sum(a.get('repeat', 1) for a in m['attacks'] if a.get('repeat'))
    out[m['id']] = {k: v for k, v in plan.items() if v not in ([], {}, None)}
json.dump(out, open('data/multiattack.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(out) - 1, 'canavar')
