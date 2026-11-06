/**
 * Görev P0: ek paket alt sınıfının savaşçıya gömülen verisi (`Combatant.paket`). Karakter oluşturulurken alt sınıf
 * kaydından kopyalanır: seviyeye göre kazanılmış özelliklerin ilkelleri ve paketin çağrı yaratıkları. Savaş durumu
 * (ve `battle_started` olayı) veriyi taşıdığından paket sonradan silinse de kayıt/replay aynı çalışır. Saf.
 */
import { getProgression, items } from '../../data';
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
  /** Görev P7: savaş başındaki kaynak değerleri (`kaynakYenile` üst sınırı; `withPaket` yazar). */
  kaynakBas?: Record<string, number>;
  /** Kuyruk P11: savaş kural sürümü 42+ (durumsuz okuyan yollar için; `damageExpr`). */
  v42?: boolean;
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

/**
 * Görev P7: eşya kancaları. Eşyanın `paket` verisi (ilkeller + yaratıklar; ör. Staff of the Python → `cagir`, Scimitar of
 * Speed → `ekSaldiri`) savaşçının paketine eklenir. Özellik anahtarı `esya:<eşya>`, yaratık ve kaynak kimlikleri eşya
 * kimliğiyle öneklenir (çakışmaz); kaynaklar sınıf tablosunda değil, savaşçıda başlar (her savaş dolu; dinlenme takibi yok).
 */
export function itemBag(names: string[]): { bag: PaketBag; resources: Record<string, number> } | undefined {
  const ozellikler: PaketOzellik[] = [];
  const yaratiklar: Record<string, Record<string, unknown>> = {};
  const kaynaklar: Record<string, string> = {};
  const resources: Record<string, number> = {};
  for (const n of names) {
    const it = items.find((i) => i.name === n) as ({ id: string; name: string; paket?: { ilkeller: Ilkel[]; yaratiklar?: Array<Record<string, unknown>> } } | undefined);
    if (!it?.paket?.ilkeller?.length) continue;
    const ref = (id: string) => `${it.id}-${id}`;
    for (const y of it.paket.yaratiklar ?? []) yaratiklar[ref(y.id as string)] = { ...y, id: ref(y.id as string) };
    const ilkeller = it.paket.ilkeller.filter((p) => !!ILKELLER[p.tur]).map((p) => {
      const q: Ilkel = { ...p };
      if (typeof q.yaratik === 'string') q.yaratik = ref(q.yaratik);
      if (Array.isArray(q.rastgele)) q.rastgele = (q.rastgele as string[]).map(ref);
      if (q.tur === 'kaynak' && typeof q.id === 'string') {
        const key = `pk-esya-${it.id}-${q.id}`;
        kaynaklar[q.id] = key;
        resources[key] = typeof q.sayi === 'number' ? q.sayi : 1;
      }
      return q;
    });
    ozellikler.push({ key: `esya:${it.id}`, ad: it.name, ilkeller });
  }
  if (!ozellikler.length) return undefined;
  return { bag: { altSinif: 'esya', ozellikler, ...(Object.keys(yaratiklar).length ? { yaratiklar } : {}), ...(Object.keys(kaynaklar).length ? { kaynaklar } : {}) }, resources };
}

/** İki paketi birleştirir (alt sınıf + eşya). */
export function mergeBags(a: PaketBag | undefined, b: PaketBag): PaketBag {
  if (!a) return b;
  return { ...a, ozellikler: [...a.ozellikler, ...b.ozellikler], yaratiklar: { ...a.yaratiklar, ...b.yaratiklar }, kaynaklar: { ...a.kaynaklar, ...b.kaynaklar } };
}
