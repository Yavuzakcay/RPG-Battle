/**
 * Görev SD13: büyü bileşenleri (V/S/M) bilgisi. Yalnız veri okuma: SRD 5.2.1 büyü kaydındaki `components` metni
 * (`data/srd/spells.json`, ör. "V, S, M (a diamond worth 300+ GP, which the spell consumes)") ayrıştırılır. Yeni kural yok.
 * Motorda yalnız V kısıtı çalışır (Silence alanı, `castBarrier.ts`); S ve M yalnız bilgidir.
 */
import srd from '../../data/srd/spells.json';

export interface SpellComponents {
  v: boolean; s: boolean; m: boolean;
  /** M için malzeme metni (SRD'deki İngilizce ad), altın değeri (en az, "N+ GP") ve büyünün tüketip tüketmediği. */
  material?: { text: string; gp?: number; consumed: boolean };
}

/** "V, S, M (…)" metnini ayrıştırır. */
export function parseComponents(raw: string): SpellComponents {
  const head = raw.replace(/\(.*$/s, '');
  const has = (c: string) => new RegExp(`(^|[\\s,])${c}($|[\\s,])`).test(head);
  const out: SpellComponents = { v: has('V'), s: has('S'), m: has('M') };
  if (out.m) {
    const text = (/\((.*)\)\s*$/s.exec(raw)?.[1] ?? '').trim();
    const gp = /(\d[\d,]*)\+?\s*(?:GP|gp)/.exec(text)?.[1];
    out.material = { text, ...(gp ? { gp: Number(gp.replace(/,/g, '')) } : {}), consumed: /consum/i.test(text) };
  }
  return out;
}

let table: Map<string, SpellComponents> | null = null;
const tableOf = (): Map<string, SpellComponents> => {
  if (!table) table = new Map((srd.spells as Array<{ id: string; components?: string }>).map((x) => [x.id, parseComponents(x.components ?? '')]));
  return table;
};

/** Oyundaki büyünün bileşenleri (SRD kimliği `srd: "spells:<id>"`, yoksa `id`); kayıt yoksa null. */
export function spellComponents(spell: { id: string; srd?: string }): SpellComponents | null {
  return tableOf().get(spell.srd?.split(':')[1] ?? spell.id) ?? null;
}

/** Bileşeni olmayan (V, S, M hiçbiri) SRD kayıtları: testte listelenir (beklenen: boş). */
export function spellsWithoutComponents(): string[] {
  return [...tableOf()].filter(([, c]) => !c.v && !c.s && !c.m).map(([id]) => id);
}
