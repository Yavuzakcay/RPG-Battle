/**
 * Görev MC6: tek sınıflı karakter jetonunun özeti (test ve `scripts/mc6-jeton-ozet.ts`). Irk (soylarıyla) × sınıf × cinsiyet ×
 * seviye × alt sınıf için `sheetAvatar` çıktısı; FNV-1a özeti ve örnek sayısı.
 */
import { classes, races } from '../data';
import { newCharacter } from '../rules/builder';
import { subclassesOf } from '../rules/classFeatures';
import type { CharacterSheet } from '../rules/stats';
import { sheetAvatar } from './avatar';

const fnv = (s: string): string => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
};

export function jetonOzeti(): { sayi: number; ozet: string } {
  const base = newCharacter('mc6').sheet;
  const out: string[] = [];
  for (const r of races) {
    const lins = [undefined, ...((r as { lineages?: { id: string }[] }).lineages ?? []).map((l) => l.id)];
    for (const lin of lins) for (const k of classes) for (const g of ['erkek', 'kadin'] as const) for (const lv of [1, 3, 5, 20]) {
      const sub = subclassesOf(k.id)[0]?.id;
      for (const sc of [undefined, sub]) {
        const s: CharacterSheet = { ...base, raceId: r.id, lineageId: lin, classId: k.id, gender: g, level: lv, subclassId: sc };
        out.push(`${r.id}/${lin}/${k.id}/${g}/${lv}/${sc}=${JSON.stringify(sheetAvatar(s))}`);
      }
    }
  }
  return { sayi: out.length, ozet: fnv(out.join('\n')) };
}
