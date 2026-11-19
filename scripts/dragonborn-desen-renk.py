"""Dragonborn pul deseni renk tablosu (önizleme). Mavi referansın (pul bölgesinden ölçülen) parlaklık aralığı diğer soylara taşınır:
CIE LCh(ab) uzayında orta ton sabit; açık = orta L* + ΔL_açık, koyu = orta L* − ΔL_koyu (mavideki farklar), ton (h) korunur,
kroma mavideki C oranlarıyla (açıkta en az orta kroma; gam dışında kroma KROMA_TABAN altına düşecekse açık L* indirilir: beyaza karışmasın), koyuda gam dışında kroma kısılır, L* en çok AZAMI_L.
Kırmızı ve mavi kullanıcı değerleriyle sabit. Çıktı: renk tablosu JSON (stdout'a da yazar)."""
import json, math, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'docs/sabah/dragonborn-desen')
AZAMI_L, ASGARI_L, KROMA_TABAN = 97.0, 6.0, 0.9

def hex2rgb(h): return [int(h[i:i + 2], 16) for i in (1, 3, 5)]
def rgb2hex(c): return '#' + ''.join(f'{max(0, min(255, round(v))):02X}' for v in c)
def _lin(c): c /= 255; return ((c + 0.055) / 1.055) ** 2.4 if c > 0.04045 else c / 12.92
def _gam(c): return 255 * (1.055 * c ** (1 / 2.4) - 0.055 if c > 0.0031308 else 12.92 * c)
WP = (0.95047, 1.0, 1.08883)
def rgb2lch(h):
    r, g, b = (_lin(v) for v in hex2rgb(h))
    x, y, z = 0.4124 * r + 0.3576 * g + 0.1805 * b, 0.2126 * r + 0.7152 * g + 0.0722 * b, 0.0193 * r + 0.1192 * g + 0.9505 * b
    f = lambda t: t ** (1 / 3) if t > 0.008856 else 7.787 * t + 16 / 116
    fx, fy, fz = f(x / WP[0]), f(y / WP[1]), f(z / WP[2])
    L, a, bb = 116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)
    return L, math.hypot(a, bb), math.degrees(math.atan2(bb, a)) % 360
def lch2rgb(L, C, H):
    a, b = C * math.cos(math.radians(H)), C * math.sin(math.radians(H))
    fy = (L + 16) / 116; fx, fz = fy + a / 500, fy - b / 200
    fi = lambda t: t ** 3 if t ** 3 > 0.008856 else (t - 16 / 116) / 7.787
    x, y, z = fi(fx) * WP[0], fi(fy) * WP[1], fi(fz) * WP[2]
    r = 3.2406 * x - 1.5372 * y - 0.4986 * z; g = -0.9689 * x + 1.8758 * y + 0.0415 * z; bl = 0.0557 * x - 0.2040 * y + 1.0570 * z
    return [_gam(max(v, 0)) if v >= 0 else -1 for v in (r, g, bl)], all(-1e-4 <= v <= 1.0001 for v in (r, g, bl))
def fit(L, C, H):
    while C > 0:
        c, ok = lch2rgb(L, C, H)
        if ok: return rgb2hex(c), C
        C -= 0.5
    return rgb2hex(lch2rgb(L, 0, H)[0]), 0

KULLANICI = {
    'mavi': ('#6698B8', '#315C83', '#112F56'), 'kirmizi': ('#D4412B', '#A91101', '#5A0B02'),
    'siyah': ('#5C5C68', '#3A3A44', '#1E1E25'), 'pirinc': ('#D0B25C', '#A88A3C', '#5E4A1C'), 'bronz': ('#B8814A', '#8C5A2B', '#4A2D12'),
    'bakir': ('#CC7440', '#A24E24', '#5A2810'), 'altin': ('#E8C85A', '#C9A030', '#7A5E14'), 'yesil': ('#58A862', '#2F7A3A', '#17421E'),
    'gumus': ('#C0CAD4', '#8E9AA6', '#4E5964'), 'beyaz': ('#F0F4F8', '#C8CFD9', '#7C8696')}
SABIT = {'mavi', 'kirmizi'}
SOY_ID = {'siyah': 'black', 'mavi': 'blue', 'pirinc': 'brass', 'bronz': 'bronze', 'bakir': 'copper', 'altin': 'gold', 'yesil': 'green',
          'kirmizi': 'red', 'gumus': 'silver', 'beyaz': 'white'}

def table():
    bl = [rgb2lch(h) for h in KULLANICI['mavi']]
    dUp, dDn = bl[0][0] - bl[1][0], bl[1][0] - bl[2][0]
    kUp, kDn = bl[0][1] / bl[1][1], bl[2][1] / bl[1][1]
    out = {}
    for k, (a, o, d) in KULLANICI.items():
        Lm, Cm, Hm = rgb2lch(o)
        if k in SABIT:
            res = {'acik': a, 'orta': o, 'koyu': d, 'not': 'kullanıcı değeri (sabit)'}
        else:
            La = min(Lm + dUp, AZAMI_L); Ld = max(Lm - dDn, ASGARI_L)
            # açıkta kroma orta kromanın en az KROMA_TABAN katı (beyaza karışmasın): gamı aşarsa önce L* indirilir
            Ca = max(Cm * kUp, Cm); La0 = La
            while La > Lm and not lch2rgb(La, Ca * KROMA_TABAN, Hm)[1]: La -= 0.5
            ha, ca = fit(La, Ca, Hm)
            hd, cd = fit(Ld, Cm * kDn, Hm)
            notlar = []
            if La < La0 - 0.1: notlar.append(f'açık L* {La0:.0f} → {La:.0f} (kroma korunsun diye)')
            if Lm + dUp > AZAMI_L: notlar.append(f'açık L* {Lm + dUp:.0f} → {AZAMI_L:.0f} (tavan; aralık daraldı)')
            res = {'acik': ha, 'orta': o, 'koyu': hd, 'baslangic': {'acik': a, 'koyu': d}, 'not': '; '.join(notlar)}
        L3 = [rgb2lch(res[t]) for t in ('acik', 'orta', 'koyu')]
        res['Lab'] = {t: [round(v, 1) for v in L3[i]] for i, t in enumerate(('acik', 'orta', 'koyu'))}
        res['dL'] = [round(L3[0][0] - L3[1][0], 1), round(L3[1][0] - L3[2][0], 1)]
        res['soy'] = SOY_ID[k]
        out[k] = res
    return out, (round(dUp, 1), round(dDn, 1), round(kUp, 2), round(kDn, 2))

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')   # Windows konsolu (cp1254) Δ, → gibi karakterleri yazamaz
    t, ref = table()
    os.makedirs(OUT, exist_ok=True)
    json.dump({'not': 'scripts/dragonborn-desen-renk.py: mavi referans ΔL* (açık, koyu) ve kroma oranları ' + str(ref), 'soylar': t},
              open(os.path.join(OUT, 'renk-tablosu.json'), 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, indent=1)
    for k, v in t.items(): print(k, v['acik'], v['orta'], v['koyu'], v['dL'], v.get('baslangic'), v['not'])
    print('ref', ref)
