/**
 * Kuyruk 44: yerleşim şehir görünümü (tek üstten görsel; binalar = düğüm). Veri `data/sehir-gorunum.json`: yerleşim
 * başına görsel (`npm run sehir-gorunum` üretir: public/yerlesim/<id>.webp), görsel boyutu ve düğümler (kalıcı kimlik
 * `<yerlesim>/<bina>`, 0–1 koordinat, ileride yürüme modu için `komsular`). Düğümün işlevi adından (`kurallar`) ve
 * yerleşimin haritalarından/hub'ından çözülür: hizmet (han, şifa evi, dükkân, görevler, çıkış), savaş haritası,
 * "Yakında" ya da NPC yer tutucu. Saf.
 */
import data from '../../data/sehir-gorunum.json';
import type { Yerlesim, YerlesimHarita } from './yerlesim';

export interface SehirDugum { id: string; tr: string; en: string; x: number; y: number; ev?: boolean; komsular: string[] }
export interface SehirGorunum { gorsel?: string; boyut?: [number, number]; dugumler: SehirDugum[] }
export type Islev = 'npc' | 'yakinda' | 'han' | 'sifa' | 'demirci' | 'taverna' | 'lagim' | 'gorev' | 'dukkan' | 'yer' | 'meydan' | 'kapi';
export type Hizmet = 'han' | 'sifa' | 'dukkan' | 'gorev' | 'cikis';
/** Düğümün hedefi: hizmet (isteğe bağlı harita ile), savaş haritası (yerleşim harita kimliği), "Yakında" ya da NPC. */
export type DugumHedefi =
  | { tur: 'hizmet'; hizmet: Hizmet; harita?: string }
  | { tur: 'harita'; harita: string }
  | { tur: 'yakinda' }
  | { tur: 'npc' };

interface Data {
  kurallar: Array<{ islev: Islev; ad: string[] }>;
  yerHaritalari: Array<{ ad: string[]; harita: string[] }>;
  yerlesimler: Record<string, SehirGorunum>;
}
const D = data as unknown as Data;

/** Ad → ASCII küçük harf sözcükler (Türkçe karakterler sadeleşir). */
export function sadeAd(s: string): string {
  return s.replace(/ı/g, 'i').replace(/İ/g, 'i').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').trim();
}
const hasWords = (name: string, p: string): boolean => p.trim() === '' || ` ${name} `.includes(` ${sadeAd(p)} `);

export const sehirGorunumu = (id: string): SehirGorunum | undefined => D.yerlesimler[id];
export const SEHIR_YERLESIMLER = Object.keys(D.yerlesimler);

/** Düğüm adının işlevi (kuralların ilk eşleşeni; ev düğümleri NPC). */
export function islevOf(n: Pick<SehirDugum, 'tr' | 'ev'>): Islev {
  if (n.ev) return 'npc';
  const name = sadeAd(n.tr);
  return D.kurallar.find((k) => k.ad.some((p) => hasWords(name, p)))?.islev ?? 'npc';
}

/** Yerleşimin, kimliğinde ya da harita kimliğinde parçalardan biri geçen ilk haritası. */
function haritaBul(y: Yerlesim, parts: string[]): YerlesimHarita | undefined {
  for (const p of parts) {
    const h = y.haritalar.find((x) => x.id.includes(p) || x.mapId.includes(p));
    if (h) return h;
  }
  return undefined;
}

/** Düğümün hedefi (Kuyruk 44 eşleme tablosu: DECISIONS.md). */
export function dugumHedefi(y: Yerlesim, n: Pick<SehirDugum, 'tr' | 'ev'>): DugumHedefi {
  const islev = islevOf(n);
  const withMap = (hizmet: Hizmet, h?: YerlesimHarita): DugumHedefi => ({ tur: 'hizmet', hizmet, ...(h ? { harita: h.id } : {}) });
  const map = (h?: YerlesimHarita, yoksa: DugumHedefi = { tur: 'npc' }): DugumHedefi => (h ? { tur: 'harita', harita: h.id } : yoksa);
  switch (islev) {
    case 'han': return y.hub.han ? withMap('han', haritaBul(y, ['kasaba-han'])) : map(haritaBul(y, ['kasaba-han']));
    case 'sifa': return y.hub.han || y.hub.tapinak ? withMap('sifa') : { tur: 'npc' };
    case 'dukkan': return y.hub.dukkan ? withMap('dukkan') : { tur: 'yakinda' };
    case 'gorev': return y.hub.gorevler.length ? withMap('gorev') : { tur: 'npc' };
    case 'kapi': return withMap('cikis', haritaBul(y, ['dis-kapi', 'kale-onu']));
    case 'meydan': return map(haritaBul(y, ['meydan', 'pazar']));
    case 'demirci': return map(haritaBul(y, ['demirci']), { tur: 'yakinda' });
    case 'taverna': return map(haritaBul(y, ['taverna']));
    case 'lagim': return map(haritaBul(y, ['lagim', 'zindan']));
    case 'yer': {
      const name = sadeAd(n.tr);
      const rule = D.yerHaritalari.find((r) => r.ad.some((p) => hasWords(name, p)));
      return map(rule ? haritaBul(y, rule.harita) : undefined);
    }
    case 'yakinda': return { tur: 'yakinda' };
    default: return { tur: 'npc' };
  }
}

/** Şehir görünümü kullanılabilir mi (görsel üretilmiş ve düğüm var). */
export const sehirHazir = (id: string): boolean => {
  const g = sehirGorunumu(id);
  return !!g?.gorsel && !!g.boyut && g.dugumler.length > 0;
};
