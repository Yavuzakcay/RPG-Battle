/**
 * Büyü prospektüsü: kayıt → bölüm listesi. Veriden: yapım süresi, menzil, alan, süre, konsantrasyon, bileşenler, malzeme
 * bedeli, hasar, kurtarma, durumlar, sınıf listeleri, oyundaki durum (`scripts/lib/buyu-durum.mjs` ölçütüyle aynı).
 * Türkçe paragraflar `data/prospektus/buyu.json` (SRD 5.2.1'den özet). Saf modül: React, DOM, localStorage yok.
 */
import { classes, spells } from '../../data';
import type { Spell } from '../../data';
import type { Lang } from '../../i18n';
import buyuJson from '../../../data/prospektus/buyu.json';
import dexCfg from '../../../data/dungeondex.json';
import { PRO_ORDER, type ProKey, type ProRow, type ProSection, type ProText, type ProTone } from './types';
import type { ProStrings } from './esya';

export interface BuyuSure { tip: 'aninda' | 'sure' | 'kaldirilana' | 'kaldirilanaTetik' | 'ozel'; n?: number; birim?: 'round' | 'minute' | 'hour' | 'day'; enCok?: boolean; kons?: boolean }
export interface BuyuKayit extends ProText { yukari?: string; malzeme?: string; bilesen?: string; bedel?: number; tuketir?: boolean; sure?: BuyuSure; ritual?: boolean }
export const BUYU_DATA = buyuJson as unknown as { kayitlar: Record<string, BuyuKayit> };

/** Tamamlama blokları (scripts/lib/buyu-durum.mjs `BLOCKS` ile aynı sıra; test eşitliği denetler). */
export const SPELL_BLOCKS = ['a4', 'a6', 'a7', 'a8', 's1', 's2', 'g6', 'k61', 'k62', 'k63', 'k64', 'k65', 'k66', 'k67', 'k68', 'k70', 'y1', 'k73c', 'b102'];

/** Oyundaki durum (BUYU-DURUM ölçütü): ton + not (Türkçe). */
export function spellStatus(s: Spell): { tone: ProTone; note?: string } {
  const raw = s.mechanics as unknown as Record<string, unknown>;
  const m = Object.assign({}, raw, ...SPELL_BLOCKS.map((k) => (raw[k] as object | undefined) ?? {})) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v : undefined);
  if (m.unsupported) return { tone: 'none', note: str(m.unsupported) };
  if (m.offCombat) return { tone: 'off', note: str(m.gmNote) };
  if (m.approx || (m.gmNote && !m.kapsamDisi && !m.sigmayan && !m.gmNoted)) return { tone: 'part', note: str(m.approx) ?? str(m.gmNote) };
  return { tone: 'ok', note: m.gmNoted ? str(m.gmNote) : undefined };
}

/**
 * Serüven öncesi: kartın "Etken içerik" satırları motorun bugünkü mekaniğinden (taban + bütün tamamlama blokları, `mechanicsAt`
 * güncel sürümle aynı sıra; haritaya bağlı `k84` hariç). Eskiden taban `mechanics` okunuyordu (Ice Storm'da 7d6 soğuk gibi).
 * Savaş motoru içe aktarılmaz (Dungeondex parçası hafif kalır).
 */
const EFFECTIVE_BLOCKS = [...SPELL_BLOCKS, 'mb7', 'm83'];
export function effectiveMechanics(s: Spell): Record<string, unknown> {
  const raw = s.mechanics as unknown as Record<string, unknown>;
  return Object.assign({}, raw, ...EFFECTIVE_BLOCKS.map((k) => (raw[k] as object | undefined) ?? {})) as Record<string, unknown>;
}

/** Büyü prospektüsü; bilinmeyen kimlikte null. */
export function buyuProspektus(id: string, L: ProStrings, lang: Lang): ProSection[] | null {
  const s = spells.find((x) => x.id === id);
  if (!s) return null;
  const P = L.spell;
  const k = BUYU_DATA.kayitlar[id] ?? {};
  const tr = lang === 'en';
  const par = (text: string | undefined): ProRow[] => (text && text.trim() ? [{ text: text.trim(), trOnly: tr || undefined }] : []);
  const row = (label: string, text: string | undefined | false, trOnly = false): ProRow[] => (text ? [{ label, text, trOnly: (tr && trOnly) || undefined }] : []);
  const unit = (n: number, u: string) => { const w = P.unit[u] ?? u; return lang === 'en' && n === 1 ? w.replace(/s$/, '') : w; };
  const S: Record<ProKey, ProRow[]> = { ne: [], nasil: [], etken: [], risk: [], kimler: [], maliyet: [], durum: [] };
  const m = effectiveMechanics(s);

  S.ne.push(...par(k.ne));
  S.nasil.push(...par(k.nasil));
  S.nasil.push(...row(P.castingL, P.casting[s.castingTime] ?? s.castingTime));
  if (k.ritual && s.castingTime !== 'ritual') S.nasil.push(...row(P.casting.ritual ?? '', P.ritualToo));
  S.nasil.push(...row(P.range, s.rangeFt === 0 ? P.self : s.rangeFt === 5 ? P.touch : `${s.rangeFt} ft`));
  if (s.area) S.nasil.push(...row(P.area, `${s.area.sizeFt} ft ${P.shape[s.area.shape] ?? s.area.shape}`));
  if (k.sure) {
    const d = k.sure;
    const base = d.tip === 'sure' && d.n && d.birim ? (d.enCok ? P.upTo(d.n, unit(d.n, d.birim)) : P.span(d.n, unit(d.n, d.birim))) : (P.dur[d.tip] ?? '');
    const text = d.kons || s.concentration ? P.concPrefix(base) : base;
    S.nasil.push(...row(P.duration, text ? text[0]!.toUpperCase() + text.slice(1) : ''));
  }
  if (k.bilesen) S.nasil.push(...row(P.comps, k.bilesen));

  const dmgName = (t: unknown) => (typeof t === 'string' ? L.dmg[t] ?? t : '');
  const split = Array.isArray(m.split) && m.split.length === 2 ? (m.split as Array<{ dice: string; type: string }>) : null;
  const dmgChoices = Array.isArray(m.damageChoices) && m.damageChoices.length ? (m.damageChoices as string[]) : null;
  if (split) S.etken.push(...row(L.l.damage, split.map((p) => `${p.dice} ${dmgName(p.type)}`).join(' + ')));
  else if (typeof m.damage === 'string') S.etken.push(...row(L.l.damage, `${m.damage}${dmgChoices ? ` ${dmgChoices.map(dmgName).join(P.or)}` : typeof m.damageType === 'string' ? ` ${dmgName(m.damageType)}` : ''}`));
  if (typeof m.save === 'string') S.etken.push(...row(L.l.save, `${L.ab[m.save] ?? m.save}${m.halfOnSave ? ` (${P.halfOnSave})` : ''}`));
  const condChoices = Array.isArray(m.conditionChoices) && m.conditionChoices.length ? (m.conditionChoices as string[]) : null;
  if (condChoices) S.etken.push(...row(L.l.conditions, condChoices.join(P.or)));
  else if (Array.isArray(m.conditions) && m.conditions.length) S.etken.push(...row(L.l.conditions, (m.conditions as string[]).join(', ')));
  S.etken.push(...row(P.upcast, k.yukari, true));

  S.risk.push(...par(k.risk));
  S.kimler.push(...par(k.kimler));
  const clsMap = dexCfg.buyuSiniflari as Record<string, string>;
  const clsNames = s.classes.map((c) => { const cid = clsMap[c] ?? c.toLowerCase(); return classes.find((x) => x.id === cid)?.name ?? c; });
  if (clsNames.length) S.kimler.push(...row(P.classes, clsNames.join(', ')));

  S.maliyet.push(...row(P.material, k.malzeme, true));
  if (k.bedel) S.maliyet.push(...row(P.materialCost, `${k.bedel}+ GP${k.tuketir ? ` (${P.consumed})` : ''}`));

  const st = spellStatus(s);
  if (st.note) S.durum.push({ label: L.l.reason, text: st.note, trOnly: tr || undefined });
  // Serüven öncesi: motorda SRD'den gerçekten farklı kalan parça (iki dilde; `dex.pro.spell.gameDiff`).
  const diff = P.gameDiff[id];
  if (diff) S.durum.push({ label: L.l.diff, text: diff });

  return PRO_ORDER.flatMap((key): ProSection[] => {
    if (key === 'durum') return [{ key, title: L.sec[key] ?? key, rows: S.durum, badge: { tone: st.tone, text: L.badge[st.tone] ?? st.tone } }];
    return S[key].length ? [{ key, title: (key === 'maliyet' ? L.sec.malzeme : L.sec[key]) ?? key, rows: S[key] }] : [];
  });
}
