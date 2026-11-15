/**
 * Görev OD1: oda (masa) kaydının veri modeli. Ağdan ve arayüzden bağımsız: saf veri + doğrulama + özet. Çevrimiçi aşama
 * (Supabase, hesap, davet kodu) aynı modeli kullanacak: `id` yerel kimlik, `kod` davet kodu (bu görevde hep boş).
 * Parti yalnız karakter kimlikleri taşır; masaya özel karakter kopyası bu görevde yok (çevrimiçi aşamaya bırakıldı).
 */
import type { DiceMode } from '../rules/manualDice';
import { DICE_MODES } from '../rules/manualDice';
import type { CarryRule } from '../rules/carry';
import { CARRY_RULES, DEFAULT_CARRY_RULE } from '../rules/carry';
import { HP_VIS, type HpVis, type RoomOverlay } from './active';
import { MAX_PARTY } from '../app/limits';
import type { GoalsDraft } from './hedef';
import { normalizeDraft } from './hedef';

export const ODA_SURUM = 1;
export const ODA_KEY = 'rpg-battle-oda';
export const ODA_AD_MAX = 40;

export type AiDiff = 'kolay' | 'normal' | 'usta';
const AI_DIFFS: readonly AiDiff[] = ['kolay', 'normal', 'usta'];

/** Oda kuralları: `app/features`, `carrySetting` ve önizleme ayarlarının odadaki kopyası (aynı varsayılanlar). */
export interface OdaKurallar {
  ustSeviye: boolean;
  tasima: CarryRule;
  hizalanma: boolean;
  hizalanmaIrk: boolean;
  hizalanmaYalnizOtomatik: boolean;
  hizalanmaMoral: boolean;
  kesif: boolean;
  ipucu: boolean;
  yolculuk: boolean;
}

export interface OdaGelismis {
  cokAltigen: boolean;
  /** Harita mekaniği anahtarları ve parametreleri (savaşa `ruleToggles`/`ruleParams` olarak yazılır). */
  ruleToggles: Record<string, boolean>;
  ruleParams: Record<string, Record<string, number | string>>;
}

export interface OdaAyarlar {
  zarModu: DiceMode;
  hpGorunurluk: HpVis;
  zorluk: { party: AiDiff; enemies: AiDiff };
  kurallar: OdaKurallar;
  gelismis: OdaGelismis;
  /** Görev OD1C: hedef taslağı (yalnız tür ve bekleyen durum; undefined = haritanın hedefleri, null = hedefsiz). */
  hedefler?: GoalsDraft | null;
}

export interface SonSavas { zaman: string; harita: string; sonuc: 'zafer' | 'yenilgi' | 'bitmedi' }

export interface Oda {
  surum: number;
  id: string;
  /** Davet kodu (çevrimiçi aşamada doldurulur; bu görevde boş). */
  kod: string;
  ad: string;
  olusturma: string;
  guncelleme: string;
  gmAdi: string;
  ayarlar: OdaAyarlar;
  /** Odaya katılan karakter kimlikleri (en çok `MAX_PARTY`). */
  parti: string[];
  /** Bitmemiş (kayıtlı) bir savaş varsa ayarlar o savaş için kilitli. */
  kilit: { baslangic: string } | null;
  sonSavas?: SonSavas;
}

/** Oda kurallarının varsayılanı: cihazın o anki genel değerleri (çağıran verir; model saf kalır). */
export const DEFAULT_KURALLAR: OdaKurallar = {
  ustSeviye: false, tasima: DEFAULT_CARRY_RULE, hizalanma: false, hizalanmaIrk: true, hizalanmaYalnizOtomatik: false, hizalanmaMoral: false,
  kesif: true, ipucu: true, yolculuk: false,
};

export const defaultAyarlar = (kurallar: OdaKurallar = DEFAULT_KURALLAR): OdaAyarlar => ({
  zarModu: 'auto', hpGorunurluk: 'tam', zorluk: { party: 'normal', enemies: 'normal' }, kurallar: { ...kurallar },
  gelismis: { cokAltigen: false, ruleToggles: {}, ruleParams: {} },
});

export function newRoom(id: string, ad: string, now: string, kurallar?: OdaKurallar, gmAdi = ''): Oda {
  return { surum: ODA_SURUM, id, kod: '', ad: cleanName(ad), olusturma: now, guncelleme: now, gmAdi: gmAdi.trim().slice(0, ODA_AD_MAX), ayarlar: defaultAyarlar(kurallar), parti: [], kilit: null };
}

export const cleanName = (s: string): string => s.trim().slice(0, ODA_AD_MAX);

const bool = (v: unknown, d: boolean): boolean => (typeof v === 'boolean' ? v : d);
const pick = <T extends string>(v: unknown, list: readonly T[], d: T): T => (typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T) : d);

/** Bozuk ya da eski kaydı onarır (bilinmeyen alanlar atılır, eksikler varsayılan). Geçersizse null. */
export function normalizeRoom(raw: unknown): Oda | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || !r.id) return null;
  const a = (r.ayarlar && typeof r.ayarlar === 'object' ? r.ayarlar : {}) as Record<string, unknown>;
  const k = (a.kurallar && typeof a.kurallar === 'object' ? a.kurallar : {}) as Record<string, unknown>;
  const z = (a.zorluk && typeof a.zorluk === 'object' ? a.zorluk : {}) as Record<string, unknown>;
  const g = (a.gelismis && typeof a.gelismis === 'object' ? a.gelismis : {}) as Record<string, unknown>;
  const d = DEFAULT_KURALLAR;
  const now = typeof r.guncelleme === 'string' ? r.guncelleme : new Date(0).toISOString();
  const kilit = r.kilit && typeof r.kilit === 'object' && typeof (r.kilit as { baslangic?: unknown }).baslangic === 'string' ? { baslangic: (r.kilit as { baslangic: string }).baslangic } : null;
  const son = r.sonSavas && typeof r.sonSavas === 'object' ? (r.sonSavas as Record<string, unknown>) : null;
  const parti = Array.isArray(r.parti) ? [...new Set(r.parti.filter((x): x is string => typeof x === 'string'))].slice(0, MAX_PARTY) : [];
  return {
    surum: ODA_SURUM, id: r.id, kod: typeof r.kod === 'string' ? r.kod : '', ad: cleanName(typeof r.ad === 'string' ? r.ad : '') || '?',
    olusturma: typeof r.olusturma === 'string' ? r.olusturma : now, guncelleme: now, gmAdi: typeof r.gmAdi === 'string' ? r.gmAdi.slice(0, ODA_AD_MAX) : '',
    ayarlar: {
      zarModu: pick(a.zarModu, DICE_MODES, 'auto'), hpGorunurluk: pick(a.hpGorunurluk, HP_VIS, 'tam'),
      zorluk: { party: pick(z.party, AI_DIFFS, 'normal'), enemies: pick(z.enemies, AI_DIFFS, 'normal') },
      kurallar: {
        ustSeviye: bool(k.ustSeviye, d.ustSeviye), tasima: pick(k.tasima, CARRY_RULES, d.tasima), hizalanma: bool(k.hizalanma, d.hizalanma),
        hizalanmaIrk: bool(k.hizalanmaIrk, d.hizalanmaIrk), hizalanmaYalnizOtomatik: bool(k.hizalanmaYalnizOtomatik, d.hizalanmaYalnizOtomatik),
        hizalanmaMoral: bool(k.hizalanmaMoral, d.hizalanmaMoral), kesif: bool(k.kesif, d.kesif), ipucu: bool(k.ipucu, d.ipucu), yolculuk: bool(k.yolculuk, d.yolculuk),
      },
      gelismis: {
        cokAltigen: bool(g.cokAltigen, false),
        ruleToggles: g.ruleToggles && typeof g.ruleToggles === 'object' ? Object.fromEntries(Object.entries(g.ruleToggles as Record<string, unknown>).filter(([, v]) => typeof v === 'boolean')) as Record<string, boolean> : {},
        ruleParams: g.ruleParams && typeof g.ruleParams === 'object' ? (g.ruleParams as OdaGelismis['ruleParams']) : {},
      },
      ...(a.hedefler === null ? { hedefler: null } : normalizeDraft(a.hedefler) ? { hedefler: normalizeDraft(a.hedefler) as GoalsDraft } : {}),
    },
    parti, kilit,
    ...(son && typeof son.zaman === 'string' ? { sonSavas: { zaman: son.zaman, harita: typeof son.harita === 'string' ? son.harita : '', sonuc: pick(son.sonuc, ['zafer', 'yenilgi', 'bitmedi'] as const, 'bitmedi') } } : {}),
  };
}

/** Oda kurallarının genel ayarların üstüne bineceği örtü (`oda/active`). */
export function overlayOf(o: Oda): RoomOverlay {
  const k = o.ayarlar.kurallar;
  return {
    deneysel: { ustSeviye: k.ustSeviye, hizalanma: k.hizalanma, hizalanmaIrk: k.hizalanmaIrk, hizalanmaYalnizOtomatik: k.hizalanmaYalnizOtomatik, hizalanmaMoral: k.hizalanmaMoral, yolculuk: k.yolculuk },
    tasima: k.tasima, kesif: k.kesif, ipucu: k.ipucu, hp: o.ayarlar.hpGorunurluk,
  };
}

/** Odaya katıl ekranındaki salt okunur özet satırları: [ad, açık mı ya da değer]. */
export function rulesSummary(k: OdaKurallar): Array<{ id: keyof OdaKurallar; value: boolean | CarryRule }> {
  return [
    { id: 'ustSeviye', value: k.ustSeviye }, { id: 'tasima', value: k.tasima }, { id: 'hizalanma', value: k.hizalanma },
    { id: 'kesif', value: k.kesif }, { id: 'ipucu', value: k.ipucu }, { id: 'yolculuk', value: k.yolculuk },
  ];
}
