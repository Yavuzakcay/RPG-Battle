/**
 * Görev TE99 (SRD 5.2.1 s. 206 "Charges"): yüklü sihirli eşyaların yükü karakterin savaşlar arası durumunda tutulur
 * (`CharacterStatus.resources`, kaynak `item:<id>`; Görev P7 eşya kancası kaynakları `pk-esya-<id>-<kaynak>`).
 * Yenilenme eşyanın verisinden: `recharge` ("1d6+1", sabit sayı ya da "all"; SRD "daily at dawn", oyunda uzun dinlenme);
 * kancalarda `kaynak.yenilenme` ("uzun" / "kisa"). Yenilenmesi olmayan (tek kullanımlık) eşyanın yükü dolmaz.
 * Saf; zar `rng` ile.
 */
import { items as itemList } from '../data';
import { rollDice, seededRng, type Rng } from './dice';
import { activeItemNames, type CharacterSheet } from './stats';

type Rule = { long?: string; short?: boolean };

function itemRules(sheet: Pick<CharacterSheet, 'itemNames'>): Map<string, { max: number; rule: Rule }> {
  const out = new Map<string, { max: number; rule: Rule }>();
  for (const name of activeItemNames(sheet)) {
    const it = itemList.find((i) => i.name === name);
    if (!it) continue;
    if (it.spells?.length) out.set(`item:${it.id}`, { max: it.charges ?? 1, rule: it.recharge ? { long: it.recharge } : {} });
    for (const q of it.paket?.ilkeller ?? []) {
      if (q.tur !== 'kaynak' || typeof q.id !== 'string') continue;
      const y = q.yenilenme;
      out.set(`pk-esya-${it.id}-${q.id}`, { max: typeof q.sayi === 'number' ? q.sayi : 1,
        rule: y === 'kisa' ? { long: 'all', short: true } : y === 'uzun' ? { long: 'all' } : {} });
    }
  }
  return out;
}

/** Karakterin eşya yüklerinin en çok değerleri (dinlenmiş durum). */
export function itemResources(sheet: Pick<CharacterSheet, 'itemNames'>): Record<string, number> {
  return Object.fromEntries([...itemRules(sheet)].map(([id, r]) => [id, r.max]));
}

/** Eşya kaynağı mı (savaşta harcanıp karaktere yazılan yük). */
export const isItemResource = (id: string): boolean => id.startsWith('item:') || id.startsWith('pk-esya-');

/**
 * Dinlenmede eşya yükleri: uzun dinlenme (şafak) verideki kuralla, kısa dinlenme yalnız `kisa` kancası. Zarlı yenilenme
 * `rng` ile; verilmezse kayıt durumundan tohumlanan tekrarlanabilir zar (Serüven/yolculuk olayları zarsız hesaplanır).
 */
export function rechargeItems(sheet: Pick<CharacterSheet, 'itemNames' | 'name'>, resources: Record<string, number>, kind: 'short' | 'long', rng?: Rng): Record<string, number> {
  const rules = itemRules(sheet);
  if (!rules.size) return resources;
  const out = { ...resources };
  for (const [id, { max, rule }] of rules) {
    const now = Math.min(max, Math.max(0, out[id] ?? max));
    if (kind === 'short' && !rule.short) { out[id] = now; continue; }
    const r = rule.long;
    if (!r || now >= max) { out[id] = now; continue; }
    if (r === 'all') { out[id] = max; continue; }
    const gain = /^\d+$/.test(r) ? Number(r) : rollDice(r, rng ?? seededFrom(`${sheet.name}|${id}|${now}`)).total;
    out[id] = Math.min(max, now + gain);
  }
  return out;
}

/** Tohumlu zar, dizgeden (FNV-1a): aynı durum aynı sonuç. */
function seededFrom(key: string): Rng {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return seededRng(h >>> 0);
}
