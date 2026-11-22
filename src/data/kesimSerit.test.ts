// @ts-nocheck — node modülü (child_process) kullanan betik testi; uygulama tsconfig'inde node tipleri yok
/**
 * KESIM-DUZELT (2026-11-22): kesim betiklerinin şerit silme kuralı (`scripts/toplu-kesim.py` `grid_lines`, `drop_lines`, `trim_lines`):
 * yalnız sayfanın gerçek ızgara çizgisi üstündeki koyu şerit silinir; figürün kontur/ayak tabanı/kalkan kenarı/kabza/asa parçaları kalır.
 * Testler Python'da (`scripts/test_kesim_serit.py`; sentetik sayfalar kodla üretilir, görsel dosyası yok). Ham sayfa vakaları yalnız ham
 * klasör (`CC_HAM` ya da assets-ham/karakter) varken çalışır. Python + numpy/scipy/Pillow yoksa atlanır.
 * Kesim parametreleri veride: data/kesim-parametre.json `izgara`; iş listesi data/kesim-duzelt.json.
 */
import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import param from '../../data/kesim-parametre.json';
import isler from '../../data/kesim-duzelt.json';

const py = ['python3', 'python'].find((p) => spawnSync(p, ['-c', 'import numpy, scipy, PIL'], { encoding: 'utf8' }).status === 0);
/** Jeton dosya adları (yalnız ad; görsel yüklenmez). */
const files = new Set(Object.keys(import.meta.glob('../../public/characters/*.webp')).map((p) => p.split('/').pop()?.replace('.webp', '')));

describe('kesim şerit silme', () => {
  it('ızgara parametreleri veride', () => {
    expect(param.izgara.uzunluk).toBeGreaterThanOrEqual(300);
    expect(param.izgara.kalinlik).toBeLessThanOrEqual(40);
    expect(param.izgara.seritOrani).toBeGreaterThan(0);
    expect(param.izgara.koyuOrani).toBeGreaterThan(0.5);
  });
  it('iş listesindeki her jeton oyunda var, aynı jeton iki kez yok', () => {
    const ad = isler.isler.map((j) => j.jeton);
    expect(new Set(ad).size).toBe(ad.length);
    for (const n of ad) expect(files.has(n), n).toBe(true);
    for (const j of isler.isler) expect(['eski', 'sayfa', 'kardes', 'sigdir'], j.jeton).toContain(j.yerlesim);
  });
  it.skipIf(!py)('Python testleri geçer (sentetik sayfalar + varsa ham sayfa vakaları)', () => {
    const r = spawnSync(py, ['-X', 'utf8', 'scripts/test_kesim_serit.py'], { encoding: 'utf8', timeout: 600000 });
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
  }, 600000);
});
