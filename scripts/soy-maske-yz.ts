// Görev K24: yapay zekâ ham maskelerinin kaydı ve yolları (soy-maske-ice yazar, soy-incele okur).
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { RawMaskResult } from '../src/ui/rawMask';
import { ELLE, INCELE, ROOT } from './soy-maske-yollar';

export const HAM = path.join(ROOT, 'assets/soy-maske-ham');
export const YZ_KAYIT = path.join(ROOT, 'data/soy-maske-yz.json');
export const HAM_ONIZLEME = path.join(INCELE, 'ham');

export interface YzEntry { kaynak: string; durum: 'yazildi' | 'atlandi'; sha1?: string; fit?: RawMaskResult['fit']; olcum?: RawMaskResult['metrics']; uyarilar: string[] }
export type YzKayit = { note: string; sprites: Record<string, YzEntry>; atlanan: string[] };

export const sha1 = (buf: Buffer) => crypto.createHash('sha1').update(buf).digest('hex');
export const readYz = (): YzKayit => (fs.existsSync(YZ_KAYIT) ? JSON.parse(fs.readFileSync(YZ_KAYIT, 'utf8')) as YzKayit : { note: '', sprites: {}, atlanan: [] });

/** Elle maske klasöründeki dosya bu araçla yazılmış ve o günden beri değişmemiş mi. */
export function isYzMask(name: string, kayit: YzKayit = readYz()): boolean {
  const e = kayit.sprites[name];
  const f = path.join(ELLE, `${name}.png`);
  return !!e?.sha1 && fs.existsSync(f) && sha1(fs.readFileSync(f)) === e.sha1;
}

