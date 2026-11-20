/**
 * Feat, tür özelliği, sınıf özelliği ve alt sınıf prospektüsü: kayıt → bölüm listesi. Türkçe paragraflar
 * `data/prospektus/{feat,tur-ozellik,sinif-ozellik}.json` (SRD 5.2.1'den özet); alt sınıf metni yüklü alt sınıf verisinden
 * (`SubclassDef` rol ve özellik açıklamaları, TR/EN; dış paket metni depoya girmez). Veride karşılığı olmayan bölüm
 * (ör. tür özelliğinde oyundaki durum) hiç üretilmez. Saf modül: React, DOM, localStorage yok.
 */
import { classData, classes, races } from '../../data';
import type { FeatureMechanic, SubclassDef } from '../../data';
import type { Lang } from '../../i18n';
import featJson from '../../../data/prospektus/feat.json';
import turJson from '../../../data/prospektus/tur-ozellik.json';
import sinifJson from '../../../data/prospektus/sinif-ozellik.json';
import { PRO_ORDER, type ProKey, type ProRow, type ProSection, type ProText, type ProTone } from './types';
import type { ProStrings } from './esya';

interface FeatKayit extends ProText { kategori?: string; tekrar?: boolean }
interface SinifKayit extends ProText { sinif?: string; seviye?: number }
interface TurKayit extends ProText { tur?: string }
export const OZELLIK_DATA = {
  feat: featJson as unknown as { kayitlar: Record<string, FeatKayit> },
  tur: turJson as unknown as { kayitlar: Record<string, TurKayit> },
  sinif: sinifJson as unknown as { kayitlar: Record<string, SinifKayit> },
};

const FEATURE_TONE: Record<string, ProTone> = { ok: 'ok', partial: 'part', none: 'none', missing: 'none' };

function sections(S: Record<ProKey, ProRow[]>, L: ProStrings, tone?: ProTone): ProSection[] {
  return PRO_ORDER.flatMap((key): ProSection[] => {
    if (key === 'durum') return tone ? [{ key, title: L.sec[key] ?? key, rows: S.durum, badge: { tone, text: L.badge[tone] ?? tone } }] : [];
    return S[key].length ? [{ key, title: L.sec[key] ?? key, rows: S[key] }] : [];
  });
}

function base(k: ProText, lang: Lang) {
  const tr = lang === 'en';
  const par = (text: string | undefined): ProRow[] => (text && text.trim() ? [{ text: text.trim(), trOnly: tr || undefined }] : []);
  const S: Record<ProKey, ProRow[]> = { ne: par(k.ne), nasil: par(k.nasil), etken: [], risk: par(k.risk), kimler: par(k.kimler), maliyet: [], durum: [] };
  return { S, tr };
}
const row = (label: string, text: string | undefined | false): ProRow[] => (text ? [{ label, text }] : []);
const className = (id: string) => classes.find((c) => c.id === id)?.name ?? id;

/** Kullanım türü ve kaynak yenilenmesi (class-features.json). */
function mechanicRows(m: FeatureMechanic | undefined, key: string, L: ProStrings): ProRow[] {
  if (!m) return [];
  const F = L.feature;
  const out = row(F.type, F.kind[m.type]);
  const res = Object.values(classData.mechanics.resources as Record<string, { name: string; feature?: string; recharge?: { short?: unknown; long?: unknown } }>).find((r) => r.feature === key);
  if (res) {
    out.push(...row(F.uses, res.name));
    const rc = [res.recharge?.short ? F.recharge.short : '', res.recharge?.long ? F.recharge.long : ''].filter(Boolean).join(', ');
    out.push(...row(F.rechargeL, rc));
  }
  return out;
}

/** Feat prospektüsü (kimlik = SRD feat kimliği). */
export function featProspektus(id: string, L: ProStrings, lang: Lang): ProSection[] | null {
  const k = OZELLIK_DATA.feat.kayitlar[id];
  if (!k) return null;
  const { S } = base(k, lang);
  const F = L.feature;
  if (k.kategori) S.etken.push(...row(F.category, F.featCat[k.kategori] ?? k.kategori));
  if (k.tekrar) S.etken.push(...row(F.repeatable, F.yes));
  const m = (classData.mechanics.feats as Record<string, { status?: string }>)[id];
  return sections(S, L, m?.status ? FEATURE_TONE[m.status] : undefined);
}

/** Tür özelliği prospektüsü (kimlik `<tür>/<özellik>`, `species:` öneki olmadan). */
export function turOzellikProspektus(id: string, L: ProStrings, lang: Lang): ProSection[] | null {
  const k = OZELLIK_DATA.tur.kayitlar[id];
  if (!k) return null;
  const { S } = base(k, lang);
  const sp = id.split('/')[0]!;
  S.kimler.push(...row(L.feature.species, races.find((r) => r.id === sp)?.name ?? sp));
  return sections(S, L);
}

/** Sınıf özelliği prospektüsü (kimlik `<sınıf>:<özellik>`; aynı özellik ikinci kez gelirse `@<seviye>`). */
export function sinifOzellikProspektus(id: string, L: ProStrings, lang: Lang): ProSection[] | null {
  const k = OZELLIK_DATA.sinif.kayitlar[id];
  if (!k) return null;
  const { S } = base(k, lang);
  const F = L.feature;
  const key = id.split('@')[0]!;
  const m = (classData.mechanics.features as Record<string, FeatureMechanic>)[key];
  S.nasil.push(...mechanicRows(m, key, L));
  if (k.sinif) S.kimler.push(...row(F.cls, `${className(k.sinif)}${k.seviye ? ` · ${F.lvl(k.seviye)}` : ''}`));
  return sections(S, L, m ? FEATURE_TONE[m.status] : undefined);
}

/**
 * Alt sınıf prospektüsü: yalnız Dungeondex kartında olmayan bilgi. Kart rolü (özet), sınıfı/cinsiyeti (başlık, etiket) ve
 * özellik listesini (seviye, ad, durum, açıklama) zaten gösterir; prospektüs bunları tekrar etmez. Kalan: yerine geçtiği
 * sınıf özelliği (risk) ve özellik durumlarının sayımı + genel durum rozeti (durum).
 */
export function altSinifProspektus(sc: SubclassDef, L: ProStrings, _lang: Lang): ProSection[] {
  const F = L.feature;
  const S: Record<ProKey, ProRow[]> = { ne: [], nasil: [], etken: [], risk: [], kimler: [], maliyet: [], durum: [] };
  if (sc.replaces?.length) S.risk.push(...row(F.replaces, sc.replaces.map((r) => (r.split(':')[1] ?? r).split('-').map((w) => w[0]!.toUpperCase() + w.slice(1)).join(' ')).join(', ')));
  const st = sc.features.map((f) => f.status);
  const counts = new Map<string, number>();
  for (const x of st) counts.set(x, (counts.get(x) ?? 0) + 1);
  const summary = [...counts].map(([k, n]) => `${n} ${F.fstatus[k] ?? k}`).join(', ');
  if (summary) S.durum.push(...row(F.features, summary));
  const tone: ProTone | undefined = !st.length ? undefined : st.every((s) => s === 'calisir') ? 'ok' : st.some((s) => s === 'calisir' || s === 'kismi') ? 'part' : 'none';
  return sections(S, L, tone);
}
