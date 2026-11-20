#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""TG1: Goliath maske deliği onarımı ve Tiefling boynuz/kuyruk gölge yarısı: teşhis rakamları ve önce/sonra sayfaları.
YALNIZ OKUR: jeton, maske ve veri dosyalarına yazmaz; çıktı klasörlerine yazar. numpy, scipy, Pillow gerekir.

Kullanım (PowerShell/bash):
  python scripts/soy-golge-teshis.py                  # ikisi birden
  python scripts/soy-golge-teshis.py --irk goliath    # docs/sabah/goliath-maske-delik/
  python scripts/soy-golge-teshis.py --irk tiefling   # docs/sabah/tiefling-boynuz-kuyruk/
  python scripts/soy-golge-teshis.py --gorsel 0       # görselsiz (hızlı)

Onarımın kendisi `src/ui/maskClose.ts` `fixSkinMask`; bu betik `scripts/soy-benek-teshis.py` içindeki numpy portunu kullanır (TypeScript ile
Tiefling, Goliath 256 ve 96 px'te piksel piksel aynı). Tiefling teşhisi için maske üretecinin (`scripts/soy-maske.ts` `skinMask`) numpy portu da
burada (285 Tiefling maske PNG'siyle piksel piksel aynı): gölge pikselinin maskede NEDEN olmadığı üretecin aşamalarından okunur.
"""
import argparse
import csv
import importlib.util
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parent.parent
_s = importlib.util.spec_from_file_location('benek', ROOT / 'scripts' / 'soy-benek-teshis.py')
T = importlib.util.module_from_spec(_s)
_s.loader.exec_module(T)
SOY, S8 = T.SOY, T.S8
FIX = json.loads((ROOT / 'data' / 'soy-renkleri.json').read_text(encoding='utf-8')).get('maskFix', {})
DARK, LIGHT = (24, 24, 32), (236, 236, 240)
yy_, xx_ = np.mgrid[-4:5, -4:5]
disk4 = (xx_ ** 2 + yy_ ** 2) <= 16   # yarıçap 4 disk (ince yapı açılımı)


# ───────── maske üretecinin numpy portu (scripts/soy-maske.ts skinMask; Tiefling: fill yok) ─────────
def skin_mask(name, cfg, rgba):
    """Döner: cand (gevşek ten kutusu), pal (en parlak kümeler: palet), big (tüm büyük kümeler), clean (üretecin maskesi), lab."""
    H, W = rgba.shape[:2]
    lab = T.rgb_to_lab(rgba[..., :3].astype(float))
    L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
    op = rgba[..., 3] >= 128
    C, h = np.hypot(a, b), (np.degrees(np.arctan2(b, a)) + 360) % 360
    hin = np.zeros(h.shape, bool)
    for lo, hi in cfg['h']:
        hin |= ((h >= lo) & (h <= hi)) if lo <= hi else ((h >= lo) | (h <= hi))
    cand = op & (L >= cfg['L'][0]) & (L <= cfg['L'][1]) & (C >= cfg['C'][0]) & (C <= cfg['C'][1]) & hin
    ys, xs = np.where(op)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    zx0, zx1, zy1 = x0 + (x1 - x0) * 0.15, x1 - (x1 - x0) * 0.15, y0 + (y1 - y0) * cfg.get('zone', 0.4)
    yy, xx = np.mgrid[0:H, 0:W]
    inzone = (xx >= zx0) & (xx <= zx1) & (yy <= zy1)
    lab_c, nc = ndi.label(cand, structure=S8)
    seed, best = -1, 0
    for c in range(1, nc + 1):
        z = int((inzone & (lab_c == c)).sum())
        if z > best:
            best, seed = z, c
    mask, pal, big = np.zeros_like(cand), np.zeros((0, 3)), np.zeros((0, 3))
    seedbox = FIX.get(name, {}).get('seed')
    if seed > 0 or seedbox:
        if seedbox:
            sel = cand & (xx >= seedbox[0]) & (yy >= seedbox[1]) & (xx <= seedbox[2]) & (yy <= seedbox[3])
        else:
            sel = (lab_c == seed) & inzone
        pts = lab[sel]
        sp = pts[np.argsort(pts[:, 0], kind='stable')]
        k = min(5, len(pts))
        cen = np.array([sp[int(math.floor(((j + 0.5) / k) * len(sp)))] for j in range(k)], float)
        count = np.zeros(k, int)
        for _ in range(15):
            asg = np.argmin(np.sqrt(((pts[:, None, :] - cen[None, :, :]) ** 2).sum(-1)), axis=1)
            new, cnt = cen.copy(), np.zeros(k, int)
            for j in range(k):
                m = asg == j
                cnt[j] = int(m.sum())
                if cnt[j]:
                    new[j] = pts[m].mean(axis=0)
            cen, count = new, cnt
        big = cen[count >= len(pts) * 0.08]
        pal = big[big[:, 0] >= big[:, 0].max() - cfg['bright']]
        dmin = np.min(np.sqrt(((lab[:, :, None, :] - pal[None, None, :, :]) ** 2).sum(-1)), axis=2)
        mask = cand & (dmin <= cfg['th'])
    nb = ndi.convolve(mask.astype(int), np.ones((3, 3), int), mode='constant') - mask
    clean = mask & (nb >= 2)
    fx = FIX.get(name)
    if fx:
        if fx.get('head'):
            clean = np.where(yy > y0 + (y1 - y0) * 0.3, False, clean)
        for bx in fx.get('exclude', []) or []:
            clean &= ~((xx >= bx[0]) & (yy >= bx[1]) & (xx <= bx[2]) & (yy <= bx[3]))
        for bx in fx.get('include', []) or []:
            clean |= ((xx >= bx[0]) & (yy >= bx[1]) & (xx <= bx[2]) & (yy <= bx[3])) & cand
    return dict(cand=cand, pal=pal, big=big, clean=clean, lab=lab)


def dmin_to(lab, cen):
    if len(cen) == 0:
        return np.full(lab.shape[:2], 1e9)
    return np.min(np.sqrt(((lab[:, :, None, :] - cen[None, None, :, :]) ** 2).sum(-1)), axis=2)


# ───────── sayfa ─────────
def windows(wgt, body, win, mod):
    """Değişen piksellerin (ağırlık) en yoğun win×win pencereleri, birbirinden ayrık. mod 'bant': gövdenin üst/orta/alt bandında birer;
    mod 'yogun': bant gözetmeden en yoğun 3."""
    ys, xs = np.where(body)
    y0, y1 = ys.min(), ys.max()
    box = ndi.uniform_filter(wgt.astype(float), size=win, mode='constant') * win * win
    out = []
    bands = (('üst (baş, boynuz)', 0, .40), ('orta (gövde)', .40, .75), ('alt (kuyruk, ayak)', .75, 1.01)) if mod == 'bant' else (('1. yoğun bölge', 0, 2), ('2. yoğun bölge', 0, 2), ('3. yoğun bölge', 0, 2))
    for nm, lo, hi in bands:
        band = np.zeros_like(box, bool)
        band[int(y0 + lo * (y1 - y0 + 1)):int(y0 + min(hi, 1.0) * (y1 - y0 + 1)) + (1 if hi > 1 else 0), :] = True
        sc = np.where(band, box, -1)
        if sc.max() <= 0:
            continue
        cy, cx = np.unravel_index(np.argmax(sc), sc.shape)
        out.append((nm, int(np.clip(cx - win // 2, 0, box.shape[1] - win)), int(np.clip(cy - win // 2, 0, box.shape[0] - win)), float(sc.max())))
        box[max(0, cy - win):cy + win, max(0, cx - win):cx + win] = -1
    return out


def sayfa(path, baslik, rgba, before, after, spec, wgt, mod, win=32, zoom=8):
    """Üstte tam jeton 1× [önce koyu | sonra koyu | önce açık | sonra açık]; altta en yoğun değişen pencereler 8× aynı dört sütunda."""
    pb, pa = T.paint(rgba, before, spec), T.paint(rgba, after, spec)
    wins = windows(wgt, rgba[..., 3] >= 128, win, mod)
    PW = win * zoom
    img = Image.new('RGB', (PW * 4 + 50, 44 + 260 + len(wins) * (PW + 28) + 10), (250, 250, 250))
    d = ImageDraw.Draw(img)
    d.text((10, 6), T.tr(baslik), fill=(0, 0, 0), font=T.FONT)
    for k, (cap, a) in enumerate((('önce (koyu zemin)', T.over(pb, DARK)), ('sonra (koyu zemin)', T.over(pa, DARK)),
                                  ('önce (açık zemin)', T.over(pb, LIGHT)), ('sonra (açık zemin)', T.over(pa, LIGHT)))):
        d.text((10 + k * (PW + 10), 26), T.tr(cap), fill=(60, 60, 60), font=T.FONT)
        img.paste(a.resize((256, 256), Image.NEAREST), (10 + k * (PW + 10), 44))
    for r, (cap, x, y, sc) in enumerate(wins):
        oy = 44 + 260 + r * (PW + 28)
        d.text((10, oy), T.tr(f'{cap}: x {x}–{x + win - 1}, y {y}–{y + win - 1} ({zoom}×)'), fill=(0, 0, 0), font=T.FONT)
        for k, (b, bg) in enumerate(((pb, DARK), (pa, DARK), (pb, LIGHT), (pa, LIGHT))):
            img.paste(T.over(b, bg).crop((x, y, x + win, y + win)).resize((PW, PW), Image.NEAREST), (10 + k * (PW + 10), oy + 20))
    img.save(path)


def pct(v, q):
    return [round(float(x), 1) for x in np.percentile(v, q)] if len(v) else []


# ───────── Tiefling: boynuz ve kuyruk gölge yarısı ─────────
def tiefling(cikti, gorsel):
    mcfg, TT, th = SOY['tiefling']['mask'], SOY['tiefling']['temizlik'], SOY['tiefling']['mask']['th']
    spec = T.tints_of('tiefling')['abyssal']
    rows, art = [], {}
    agg = dict(dh=[], C=[], L=[], dpal=[], palL=[])
    tot = dict(golge=0, ince=0, ust=0, orta=0, alt=0, kutu_disi=0, palet_disi=0, koyu_kume=0, kume_disi=0, palet_ici=0, sari=0, uzak=0, acik=0, goz_eklenen=0, goz_maskede=0, i_ust=0, i_orta=0, i_alt=0, engel=0, engel_jeton=0)
    TT0 = {**TT, 'golge': {**TT['golge'], 'kromaKomsu': 0}}   # kroma kapısı kapalı (kapının neyi elediği)
    for name in T.tokens_of('tiefling'):
        M0 = T.load_mask(name)
        if M0 is None:
            continue
        rgba = T.load_token(name)
        Mt, Ht, Kt = T.fix_mask(rgba, M0, mcfg, TT, golge=False)     # TB1 sonrası: oyundaki şimdiki durum
        Mf, Hf, Kf = T.fix_mask(rgba, M0, mcfg, TT)                   # TG1 sonrası
        G = Mf & ~Mt & ~Kf
        Mk, _, Kk = T.fix_mask(rgba, M0, mcfg, TT0)
        engel = int(((Mk & ~Mt & ~Kk) & ~G).sum())
        r = skin_mask(name, mcfg, rgba)
        lab = r['lab']
        L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
        C, h = np.hypot(a, b), (np.degrees(np.arctan2(b, a)) + 360) % 360
        sel = Mt & (rgba[..., 3] >= 10)
        h0 = math.degrees(math.atan2(b[sel].sum(), a[sel].sum())) % 360
        dh = np.abs((h - h0 + 180) % 360 - 180)
        dpal, dall = dmin_to(lab, r['pal']), dmin_to(lab, r['big'])
        cand = r['cand']
        kutu_disi = G & ~cand
        palet_disi = G & cand & (dpal > th)
        koyu_kume = palet_disi & (dall <= th)
        kume_disi = palet_disi & (dall > th)
        palet_ici = G & cand & (dpal <= th)
        # ince yapı (boynuz, kuyruk, kulak, parmak): son maskenin 9×9 (yarıçap 4) elmas açılımında kalmayan çıkıntılar (genişlik <= 8 px); kol/bacak/gövde kalır
        ince = G & ~ndi.binary_opening(Mf, structure=disk4)
        ys, _ = np.where(rgba[..., 3] >= 128)
        rel = (np.where(G)[0] - ys.min()) / (ys.max() - ys.min() + 1)
        goz = (rgba[..., 3] >= 128) & (h >= 55) & (h <= 100) & (C > 40) & (L > 55)
        n = int(G.sum())
        iy = np.where(ince)[0]; irel = (iy - ys.min()) / (ys.max() - ys.min() + 1)
        i_ust, i_orta, i_alt = int((irel < .35).sum()), int(((irel >= .35) & (irel < .65)).sum()), int((irel >= .65).sum())
        rows.append(dict(jeton=name, maske_px=int(M0.sum()), tb1_sonrasi_maske_px=int(Mt.sum()), golge_px=n, kroma_kapisi_engellenen_px=engel, golge_maske_orani=round(n / max(1, int(Mt.sum())), 3),
                         ince_yapi_px=int(ince.sum()), ince_ust_boynuz_px=i_ust, ince_orta_el_px=i_orta, ince_alt_kuyruk_px=i_alt, ust_px=int((rel < .35).sum()), orta_px=int(((rel >= .35) & (rel < .7)).sum()), alt_px=int((rel >= .7).sum()),
                         kutu_disi_px=int(kutu_disi.sum()), palet_disi_px=int(palet_disi.sum()), koyu_kume_px=int(koyu_kume.sum()), kume_disi_px=int(kume_disi.sum()),
                         palet_ici_px=int(palet_ici.sum()), ton_sapma_p90=round(float(np.percentile(dh[G], 90)), 1) if n else 0,
                         kroma_medyan=round(float(np.median(C[G])), 1) if n else 0, L_medyan=round(float(np.median(L[G])), 1) if n else 0))
        for k, v in dict(i_ust=i_ust, i_orta=i_orta, i_alt=i_alt, golge=n, ince=int(ince.sum()), ust=int((rel < .35).sum()), orta=int(((rel >= .35) & (rel < .7)).sum()), alt=int((rel >= .7).sum()),
                         kutu_disi=int(kutu_disi.sum()), palet_disi=int(palet_disi.sum()), koyu_kume=int(koyu_kume.sum()), kume_disi=int(kume_disi.sum()), palet_ici=int(palet_ici.sum()),
                         sari=int((G & (h >= 55) & (h <= 120)).sum()), uzak=int((G & (dh > 40)).sum()), acik=int((G & (L > 70)).sum()), goz_eklenen=int((G & goz).sum()), goz_maskede=int((Mf & goz).sum())).items():
            tot[k] += v
        tot['engel'] += engel; tot['engel_jeton'] += int(engel > 0)
        agg['dh'] += dh[G].tolist(); agg['C'] += C[G].tolist(); agg['L'] += L[G].tolist(); agg['dpal'] += dpal[G].tolist()
        if len(r['pal']): agg['palL'].append(float(r['pal'][:, 0].min()))
        art[name] = (rgba, Mt, Mf, G, ince)
    cikti.mkdir(parents=True, exist_ok=True)
    cols = list(rows[0])
    with open(cikti / 'tiefling-golge.csv', 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=cols, lineterminator='\n'); w.writeheader(); w.writerows(rows)
    px = np.array([r['golge_px'] for r in rows]); ince = np.array([r['ince_yapi_px'] for r in rows])
    ozet = dict(jeton=len(rows), golge_toplam=int(px.sum()), golge_jeton_basina=dict(medyan=int(np.median(px)), p90=int(np.percentile(px, 90)), en_cok=int(px.max()), sifir_jeton=int((px == 0).sum())),
                maske_orani_medyan=round(float(np.median([r['golge_maske_orani'] for r in rows])), 3), ince_yapi_toplam=int(ince.sum()),
                ince_yapi_bant_px=dict(ust_boynuz=tot['i_ust'], orta_el_parmak=tot['i_orta'], alt_kuyruk=tot['i_alt']),
                ince_yapi_jeton_basina=dict(medyan=int(np.median(ince)), p90=int(np.percentile(ince, 90)), en_cok=int(ince.max())),
                bant_yuzde=dict(ust=round(100 * tot['ust'] / max(1, tot['golge']), 1), orta=round(100 * tot['orta'] / max(1, tot['golge']), 1), alt=round(100 * tot['alt'] / max(1, tot['golge']), 1)),
                palete_uzaklik_dE_p10_p50_p90=pct(agg['dpal'], [10, 50, 90]), paletin_en_koyu_kumesi_L_medyan=round(float(np.median(agg['palL'])), 1),
                neden_px=dict(kutu_disi=tot['kutu_disi'], palet_disi_toplam=tot['palet_disi'], palet_disi_koyu_kume_var=tot['koyu_kume'], palet_disi_kume_yok=tot['kume_disi'], palet_ici_elenmis=tot['palet_ici']),
                boyanan_dagilim=dict(ton_sapma_derece_p50_p90_p99_max=pct(agg['dh'], [50, 90, 99, 100]), kroma_p5_p50_p95=pct(agg['C'], [5, 50, 95]), L_p5_p50_p95=pct(agg['L'], [5, 50, 95])),
                kroma_kapisi=dict(esik_komsu_maske_kroma=TT['golge']['kromaKomsu'], engellenen_px=tot['engel'], etkilenen_jeton=tot['engel_jeton'],
                                  en_cok_engellenen=[(r['jeton'], r['kroma_kapisi_engellenen_px']) for r in sorted(rows, key=lambda r: -r['kroma_kapisi_engellenen_px'])[:8]]),
                yasak=dict(sari_ton_55_120_px=tot['sari'], ton_sapma_40_ustu_px=tot['uzak'], L70_ustu_px=tot['acik'], sari_goz_adayi_eklenen_px=tot['goz_eklenen'], sari_goz_adayi_son_maskede_px=tot['goz_maskede']))
    en = sorted(rows, key=lambda r: -(r['ince_ust_boynuz_px'] + r['ince_alt_kuyruk_px']))[:10]
    ozet['en_cok_degisen_10_boynuz_kuyruk'] = [(r['jeton'], r['ince_ust_boynuz_px'], r['ince_alt_kuyruk_px'], r['golge_px']) for r in en]
    (cikti / 'ozet.json').write_text(json.dumps(ozet, ensure_ascii=False, indent=2), encoding='utf-8')
    if gorsel:
        for i, r in enumerate(en[:gorsel], 1):
            rgba, Mt, Mf, G, ince = art[r['jeton']]
            sayfa(cikti / f'{i:02d}-{r["jeton"]}.png', f'{r["jeton"]} · soy: abyssal · önce = TB1 sonrası (oyundaki şimdiki) maske {int(Mt.sum())} px · eklenen gölge bandı {r["golge_px"]} px (ince yapı: boynuz {r["ince_ust_boynuz_px"]} px, kuyruk {r["ince_alt_kuyruk_px"]} px)',
                  rgba, Mt, Mf, spec, G.astype(float) + 3 * ince.astype(float), 'bant')
    return ozet


# ───────── Goliath: maske deliği ─────────
def goliath(cikti, gorsel):
    mcfg, TT = SOY['goliath']['mask'], SOY['goliath']['temizlik']
    spec = ('lch', SOY['goliath']['lineages']['frost'])
    eski = {'referans': 256, 'delik': {**TT['delik'], 'enCok': 80}}   # TB1 ayarı: ırk maske kutusu (L 18–96), enCok 80, vurgu/gölge yok (karşılaştırma)
    kaplama = set(json.loads((ROOT / 'data' / 'soy-bas.json').read_text(encoding='utf-8'))['sprites'])
    rows, art = [], {}
    tot = dict(delik=0, eski=0, eski_parlak=0, eski_koyu=0, L_alt=0, L_ust=0)
    for name in T.tokens_of('goliath'):
        M0 = T.load_mask(name)
        if M0 is None:
            continue
        rgba = T.load_token(name)
        k = name in kaplama
        Mf, H, K = T.fix_mask(rgba, M0, mcfg, TT)
        _, Ho, _ = T.fix_mask(rgba, M0, mcfg, eski)
        lab = T.rgb_to_lab(rgba[..., :3].astype(float))
        L, C = lab[..., 0], np.hypot(lab[..., 1], lab[..., 2])
        n, no = int(H.sum()), int(Ho.sum())
        rows.append(dict(jeton=name, kafa_kaplamasi='var (onarım atlanır)' if k else 'yok', maske_px=int(M0.sum()), delik_px=0 if k else n, delik_maske_orani=0 if k else round(n / max(1, int(M0.sum())), 3),
                         eski_ayar_delik_px=no, eski_ayar_L72_ustu_px=int((Ho & (L > 72)).sum()), eski_ayar_L28_alti_px=int((Ho & (L < 28)).sum()),
                         delik_L_min=round(float(L[H].min()), 1) if n else 0, delik_L_max=round(float(L[H].max()), 1) if n else 0))
        if not k:
            tot['delik'] += n; tot['eski'] += no; tot['eski_parlak'] += int((Ho & (L > 72)).sum()); tot['eski_koyu'] += int((Ho & (L < 28)).sum())
            tot['L_alt'] += int((H & (L < 28)).sum()); tot['L_ust'] += int((H & (L > 72)).sum())
            art[name] = (rgba, M0, Mf, H)
    cikti.mkdir(parents=True, exist_ok=True)
    with open(cikti / 'goliath-delik.csv', 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]), lineterminator='\n'); w.writeheader(); w.writerows(rows)
    px = np.array([r['delik_px'] for r in rows if r['kafa_kaplamasi'] == 'yok'])
    ozet = dict(jeton=len(rows), kafa_kaplamasi_atlanan=sum(1 for r in rows if r['kafa_kaplamasi'] != 'yok'), delik_toplam=tot['delik'],
                delik_jeton_basina=dict(medyan=int(np.median(px)), p90=int(np.percentile(px, 90)), en_cok=int(px.max()), sifir_jeton=int((px == 0).sum())),
                eski_ayar_toplam=tot['eski'], eski_ayar_L72_ustu_px=tot['eski_parlak'], eski_ayar_L28_alti_px=tot['eski_koyu'],
                yeni_ayar_L28_alti_px=tot['L_alt'], yeni_ayar_L72_ustu_px=tot['L_ust'])
    en = sorted([r for r in rows if r['kafa_kaplamasi'] == 'yok'], key=lambda r: -r['delik_px'])[:10]
    ozet['en_kotu_10'] = [(r['jeton'], r['delik_px']) for r in en]
    (cikti / 'ozet.json').write_text(json.dumps(ozet, ensure_ascii=False, indent=2), encoding='utf-8')
    if gorsel:
        for i, r in enumerate(en[:gorsel], 1):
            rgba, M0, Mf, H = art[r['jeton']]
            sayfa(cikti / f'{i:02d}-{r["jeton"]}.png', f'{r["jeton"]} · soy: frost · maske {int(M0.sum())} px · eklenen delik {r["delik_px"]} px (kutu L 28–72, enCok 12)', rgba, M0, Mf, spec, H.astype(float), 'yogun')
    return ozet


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--irk', default='hepsi', help='goliath | tiefling | hepsi')
    ap.add_argument('--gorsel', type=int, default=10, help='en kötü / en çok değişen N jeton için 8× önce/sonra sayfası (0: görselsiz)')
    ap.add_argument('--cikti-goliath', default=str(ROOT / 'docs' / 'sabah' / 'goliath-maske-delik'))
    ap.add_argument('--cikti-tiefling', default=str(ROOT / 'docs' / 'sabah' / 'tiefling-boynuz-kuyruk'))
    a = ap.parse_args()
    if a.irk in ('goliath', 'hepsi'):
        print('goliath', json.dumps(goliath(Path(a.cikti_goliath), a.gorsel), ensure_ascii=False))
    if a.irk in ('tiefling', 'hepsi'):
        print('tiefling', json.dumps(tiefling(Path(a.cikti_tiefling), a.gorsel), ensure_ascii=False))


if __name__ == '__main__':
    main()
