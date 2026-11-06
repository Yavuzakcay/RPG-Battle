/**
 * Görev P0: ek paket alt sınıfının savaşçıya gömülen verisi (`Combatant.paket`). Karakter oluşturulurken alt sınıf
 * kaydından kopyalanır: seviyeye göre kazanılmış özelliklerin ilkelleri ve paketin çağrı yaratıkları. Savaş durumu
 * (ve `battle_started` olayı) veriyi taşıdığından paket sonradan silinse de kayıt/replay aynı çalışır. Saf.
 */
import { getProgression } from '../../data';
import { findSubclass } from '../../rules/subclasses';
import { ILKELLER, paketKaynakId } from '../../content/ilkelSema';
import type { CharacterSheet } from '../../rules/stats';

export type Ilkel = Record<string, unknown> & { tur: string };
export interface PaketOzellik {
  /** `<alt sınıf>/<özellik>`. */
  key: string;
  ad: string;
  ilkeller: Ilkel[];
}
export interface PaketBag {
  altSinif: string;
  ozellikler: PaketOzellik[];
  /** Paket yaratıkları (kimlik → tanım). */
  yaratiklar?: Record<string, Record<string, unknown>>;
  /** Yerel kaynak kimliği → sınıf kaynakları anahtarı (`pk-<alt sınıf>-<id>`). */
  kaynaklar?: Record<string, string>;
  /** Karakter zırhsız (koşul `zirhsiz`). */
  zirhsiz?: boolean;
}

/** Karakterin paket verisi (ilkelli özelliği yoksa undefined). */
export function paketBag(sheet: Pick<CharacterSheet, 'classId' | 'subclassId' | 'level' | 'armorName'>): PaketBag | undefined {
  const sub = findSubclass(sheet.classId, sheet.subclassId);
  if (!sub?.pack) return undefined;
  const at = getProgression(sheet.classId).subclassLevel ?? 3;
  if (sheet.level < at) return undefined;
  const ozellikler = sub.features.filter((f) => Math.max(f.level, at) <= sheet.level && f.ilkeller?.length)
    .map((f) => ({ key: `${sub.id}/${f.id}`, ad: f.name.tr || f.name.en, ilkeller: (f.ilkeller ?? []).filter((p) => !!ILKELLER[p.tur as string]) as Ilkel[] }))
    .filter((f) => f.ilkeller.length > 0);
  if (!ozellikler.length) return undefined;
  const kaynaklar: Record<string, string> = {};
  for (const f of sub.features) for (const p of f.ilkeller ?? []) if (p.tur === 'kaynak' && typeof p.id === 'string') kaynaklar[p.id] = paketKaynakId(sub.id, p.id);
  const refs = new Set(ozellikler.flatMap((f) => f.ilkeller.filter((p) => p.tur === 'cagir').map((p) => p.yaratik as string)));
  const yaratiklar = Object.fromEntries((sub.yaratiklar ?? []).filter((y) => refs.has(y.id as string)).map((y) => [y.id as string, y]));
  return {
    altSinif: sub.id, ozellikler,
    ...(Object.keys(yaratiklar).length ? { yaratiklar } : {}),
    ...(Object.keys(kaynaklar).length ? { kaynaklar } : {}),
    ...(sheet.armorName === 'Zırhsız' || !sheet.armorName ? { zirhsiz: true } : {}),
  };
}
