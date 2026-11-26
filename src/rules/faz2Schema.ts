/**
 * Görev KATALOG-F0: canavar kaydındaki `faz2` (yarı can fazı) bloğunun doğrulaması. Saf; bilinmeyen alan, yanlış tür ve
 * geçersiz zar reddedilir. Veri yükleyici (KATALOG-1 F Aşama 2) ve testler kullanır.
 */
import { parseDice } from './dice';

const LISTS = ['direncEkle', 'direncKaldir', 'zayiflikEkle', 'zayiflikKaldir', 'bagisiklikEkle', 'bagisiklikKaldir'] as const;
const DICE = ['geciciCan', 'saldiri', 'hasar'] as const;
const KNOWN = new Set<string>(['esik', 'ac', 'hasarTuru', 'nefesDoldur', 'nefesAlan', 'efsaneviEk', 'not', ...LISTS, ...DICE]);

const diceOk = (v: unknown): boolean => {
  if (typeof v === 'number') return Number.isFinite(v);
  if (typeof v !== 'string') return false;
  try { parseDice(v); return true; } catch { return false; }
};

/** Hatalar (boş liste: geçerli). `where`: hata metnindeki konum (canavar kimliği). */
export function faz2Errors(block: unknown, where = 'faz2'): string[] {
  if (!block || typeof block !== 'object' || Array.isArray(block)) return [`${where}: nesne olmalı`];
  const b = block as Record<string, unknown>;
  const out: string[] = [];
  for (const k of Object.keys(b)) if (!KNOWN.has(k)) out.push(`${where}: bilinmeyen alan "${k}"`);
  if (b.esik !== undefined && !(typeof b.esik === 'number' && b.esik > 0 && b.esik < 1)) out.push(`${where}.esik: 0 ile 1 arasında olmalı`);
  for (const k of DICE) if (b[k] !== undefined && !diceOk(b[k])) out.push(`${where}.${k}: sayı ya da zar ifadesi olmalı`);
  if (b.ac !== undefined && !Number.isInteger(b.ac)) out.push(`${where}.ac: tam sayı olmalı`);
  if (b.efsaneviEk !== undefined && !(Number.isInteger(b.efsaneviEk) && (b.efsaneviEk as number) >= 0)) out.push(`${where}.efsaneviEk: 0 ya da pozitif tam sayı olmalı`);
  if (b.nefesAlan !== undefined && !(typeof b.nefesAlan === 'number' && b.nefesAlan >= 1 && b.nefesAlan <= 3)) out.push(`${where}.nefesAlan: 1 ile 3 arasında olmalı`);
  if (b.nefesDoldur !== undefined && typeof b.nefesDoldur !== 'boolean') out.push(`${where}.nefesDoldur: true/false olmalı`);
  if (b.hasarTuru !== undefined && typeof b.hasarTuru !== 'string') out.push(`${where}.hasarTuru: metin olmalı`);
  for (const k of LISTS) if (b[k] !== undefined && !(Array.isArray(b[k]) && (b[k] as unknown[]).every((x) => typeof x === 'string'))) out.push(`${where}.${k}: metin listesi olmalı`);
  if (b.not !== undefined) {
    const n = b.not as Record<string, unknown> | null;
    if (!n || typeof n !== 'object' || typeof n.tr !== 'string' || typeof n.en !== 'string') out.push(`${where}.not: { tr, en } olmalı`);
  }
  return out;
}
