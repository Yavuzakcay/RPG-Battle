/**
 * K47: Serüven serbest gezinti (dünya haritası). Saf; `executeSeruven` komutları buraya yönlendirir, olaylar
 * `reduceSeruven`'de uygulanır. Kayıt alanları (yoksa eski davranış): `konum` (dünya pikseli; yoksa düğümden),
 * `saat` (Serüven başından saat; yoksa 06:00 + uzun dinlenme × 24), `hublar` (açılmış merkezler; yoksa ırk yurdu),
 * `kontroller` (çözülmüş yumuşak kilitler). Anahtarlar `dunyaGezinti` (yürüme), `hizliSeyahat` (gemi/uçuş).
 */
import type { SeruvenState } from '../journey/seruven';
import { seededRng } from '../rules/dice';
import { partyWorld } from './seruvenFog';
import { prisonSurfaced } from './prison';
import { ISLANDS, inPolygon, pxToMiles, type Pt } from './worldData';
import { WALK_RULES, encounterIndex, findPath, hubById, regionAt, seaRoute } from './walk';

export const START_HOUR = 6;

export type RoamEvent =
  | { type: 'seruven_walked'; path: Pt[]; hours: number; to: Pt; hubs: string[]; encounter?: { region: string | null; at: Pt } }
  | { type: 'seruven_traveled'; to: string; mode: 'gemi' | 'ucus'; path: Pt[]; hours: number; encounter?: { region: string } }
  | { type: 'seruven_world_check'; id: string; total: number; dc: number; success: boolean; by: string; durum: string; flag?: string };

export type RoamCommand =
  | { type: 'world_walk'; to: Pt }
  | { type: 'fast_travel'; to: string; mode: 'gemi' | 'ucus' }
  | { type: 'world_check'; id: string; roll: number };

/** Saat (Serüven başından); eski kayıtta 06:00 + her uzun dinlenme bir gün. */
export const clock = (s: Pick<SeruvenState, 'saat' | 'rests'>): number => s.saat ?? START_HOUR + (s.rests ?? 0) * 24;
export const dayOf = (s: Pick<SeruvenState, 'saat' | 'rests'>): number => Math.floor(clock(s) / 24) + 1;
export const hourOfDay = (s: Pick<SeruvenState, 'saat' | 'rests'>): number => clock(s) % 24;

/** Partinin dünya konumu. */
export const partyPos = (s: SeruvenState): Pt | null => s.konum ?? partyWorld(s.page, s.at);

/** Açık hub'lar (kayıtta yoksa ırk yurdu). */
export function openHubs(s: SeruvenState): string[] {
  if (s.hublar) return s.hublar;
  const race = s.party[0]?.sheet.raceId ?? '';
  return [...(WALK_RULES.irkHub[race] ?? [])];
}

/** Konuma yakın hub'lar. */
export const hubsNear = (p: Pt, r = WALK_RULES.hubYaricap): string[] => WALK_RULES.hublar.filter((h) => Math.hypot(h.px[0] - p[0], h.px[1] - p[1]) <= r).map((h) => h.id);

/** Yumuşak kilit kontrollerinin "durum imzası" (beyaz kontrol bu değişince yeniden denenir). */
export const checkSignature = (s: SeruvenState): string => `${s.level}|${s.items.length}|${s.party.length}`;

export type BestSkill = (state: SeruvenState, skills: readonly string[]) => { bonus: number; name: string };

/** Pasif Algı eşiği geçilen ve yakındaki gizli işaretler (kontrol kimlikleri). */
export function passiveHints(s: SeruvenState, best: BestSkill): string[] {
  const p = partyPos(s);
  if (!p) return [];
  const pp = 10 + best(s, ['perception']).bonus;
  return WALK_RULES.kontroller.filter((c) => c.pasifEsik !== undefined && pp >= c.pasifEsik && !s.flags.includes(c.bayrak)
    && Math.hypot(c.px[0] - p[0], c.px[1] - p[1]) <= c.yaricap * 2).map((c) => c.id);
}

const seedFor = (s: SeruvenState, salt: number) => seededRng((s.seed * 2654435761 + Math.round(clock(s) * 7) + salt) >>> 0);
const busy = (s: SeruvenState): string | null => (s.result ? 'Serüven bitti.' : s.yerlesim ? 'Önce yerleşimden çık.' : s.hapis ? 'Hapisteyken gezilemez.' : null);

/** Komut → olaylar ya da hata metni. `toggle(key)` Serüven anahtarı açık mı. */
export function roamEvents(s: SeruvenState, cmd: RoamCommand, toggle: (k: string) => boolean, best: BestSkill): RoamEvent[] | string {
  const why = busy(s);
  if (why) return why;
  const here = partyPos(s);
  if (!here) return 'Parti konumu yok.';
  if (cmd.type === 'world_walk') {
    if (!toggle('dunyaGezinti')) return 'Dünya gezintisi kapalı (Serüven kuralı).';
    const plan = findPath(here, cmd.to);
    if (!plan) return 'Oraya yürünemez (deniz, büyük nehir ya da kayalık; adalara gemi, portal ya da uçuşla gidilir).';
    const hit = encounterIndex(plan, hourOfDay(s), seedFor(s, 1), toggle('karsilasmaYok') ? 0 : undefined);
    const cells = hit >= 0 ? plan.cells.slice(0, hit + 1) : plan.cells;
    const cut = hit >= 0 ? findPath(here, [(cells[cells.length - 1]![0] + 0.5) * 32, (cells[cells.length - 1]![1] + 0.5) * 32]) ?? plan : plan;
    const to = cut.path[cut.path.length - 1] ?? here;
    const path = [here, ...cut.path];
    const hubs = [...new Set(path.flatMap((p) => hubsNear(p)))].filter((h) => !openHubs(s).includes(h));
    return [{ type: 'seruven_walked', path, hours: Math.round(cut.hours * 10) / 10, to, hubs, ...(hit >= 0 ? { encounter: { region: regionAt(to), at: to } } : {}) }];
  }
  if (cmd.type === 'fast_travel') {
    if (!toggle('hizliSeyahat')) return 'Hızlı seyahat kapalı (Serüven kuralı).';
    const target = hubById(cmd.to);
    if (!target) return 'Böyle bir merkez yok.';
    if (cmd.mode === 'gemi') {
      const from = WALK_RULES.hublar.find((h) => h.tur === 'iskele' && hubsNear(here).includes(h.id));
      if (!from || !from.iskele) return 'Gemi için bir iskelede olmalısın.';
      if (target.tur !== 'iskele' || !target.iskele) return 'Gemi yalnızca iskeleden iskeleye gider.';
      const route = seaRoute(from.iskele, target.iskele);
      if (!route) return 'Bu iki iskele arasında deniz yolu yok.';
      if (target.iskele === 'hapishane' && !prisonSurfaced(s, toggle('hapishaneHaftalik'))) return 'Hapishane Adası su altında; yalnızca yüzeydeki günde gidilir.';
      if (WALK_RULES.yalnizKorsan.includes(target.iskele) && !s.flags.includes(WALK_RULES.korsanBayragi)) return 'Bu adaya yalnızca Korsan seferiyle gidilir.';
      const krakenAt = route.noktalar.some((p) => ISLANDS.kraken && inPolygon(p, ISLANDS.kraken));
      const enc = seedFor(s, 2)() < (krakenAt ? WALK_RULES.karsilasma.kraken : WALK_RULES.karsilasma.gemi) * (toggle('karsilasmaYok') ? 0 : WALK_RULES.karsilasma.carpan);
      return [{ type: 'seruven_traveled', to: target.id, mode: 'gemi', path: route.noktalar, hours: Math.round((route.mil / WALK_RULES.gemiMilSaat) * 10) / 10, ...(enc ? { encounter: { region: krakenAt ? 'kraken' : 'deniz' } } : {}) }];
    }
    if (!WALK_RULES.ucusBayraklari.some((f) => s.flags.includes(f))) return 'Uçmak için uçan binek ya da Göksel anahtar gerekir.';
    if (!openHubs(s).includes(target.id)) return 'Uçuşla yalnızca keşfedilmiş merkezlere gidilir.';
    const miles = pxToMiles(Math.hypot(target.px[0] - here[0], target.px[1] - here[1]));
    const enc = seedFor(s, 3)() < WALK_RULES.karsilasma.ucus * (toggle('karsilasmaYok') ? 0 : WALK_RULES.karsilasma.carpan);
    return [{ type: 'seruven_traveled', to: target.id, mode: 'ucus', path: [here, target.px], hours: Math.round((miles / WALK_RULES.ucusMilSaat) * 10) / 10, ...(enc ? { encounter: { region: regionAt(target.px) ?? 'hava' } } : {}) }];
  }
  const c = WALK_RULES.kontroller.find((x) => x.id === cmd.id);
  if (!c) return 'Böyle bir kontrol yok.';
  if (Math.hypot(c.px[0] - here[0], c.px[1] - here[1]) > c.yaricap) return 'Buraya yeterince yakın değilsin.';
  if (s.flags.includes(c.bayrak)) return 'Zaten bulundu.';
  const prev = s.kontroller?.[c.id];
  if (prev && c.tur === 'kirmizi') return 'Bu kontrol bir kez denenir (kırmızı).';
  const durum = checkSignature(s);
  if (prev && prev.durum === durum) return 'Yeniden denemek için parti değişmeli (seviye, eşya ya da üye; beyaz kontrol).';
  const b = best(s, c.beceri);
  const total = cmd.roll + b.bonus;
  return [{ type: 'seruven_world_check', id: c.id, total, dc: c.dc, success: total >= c.dc, by: b.name, durum, ...(total >= c.dc ? { flag: c.bayrak } : {}) }];
}

/** Olayın durum etkisi (reducer). */
export function reduceRoam(s: SeruvenState, e: RoamEvent): SeruvenState {
  switch (e.type) {
    case 'seruven_walked': {
      const n: SeruvenState = { ...s, konum: e.to, saat: clock(s) + e.hours, hublar: [...new Set([...openHubs(s), ...e.hubs])], karsilasma: e.encounter ? { bolge: e.encounter.region, at: e.encounter.at } : null };
      return n;
    }
    case 'seruven_traveled': {
      const hub = hubById(e.to);
      return { ...s, konum: hub?.px ?? s.konum, saat: clock(s) + e.hours, hublar: [...new Set([...openHubs(s), e.to])], karsilasma: e.encounter ? { bolge: e.encounter.region, at: hub?.px ?? null } : null };
    }
    case 'seruven_world_check': return {
      ...s, kontroller: { ...(s.kontroller ?? {}), [e.id]: { ok: e.success, durum: e.durum } }, ...(e.flag ? { flags: [...new Set([...s.flags, e.flag])] } : {}),
    };
  }
}

/**
 * Kuyruk H1: dünya haritasında düğüme dokunuş. Görüntüleyiciden çıkılmaz: partinin bulunduğu sayfadaki düğümde bilgi
 * kartı (ziyaret akışı) açılır; başka sayfadaki düğüme yürüme açıksa parti oraya yürür; değilse hiçbir şey olmaz.
 */
export type NodeTap = { kind: 'card'; id: string } | { kind: 'walk'; to: Pt } | { kind: 'none' };
export function nodeTapAction(s: Pick<SeruvenState, 'page'>, page: string, id: string, pos: Pt, walkEnabled: boolean): NodeTap {
  if (page === s.page) return { kind: 'card', id };
  return walkEnabled ? { kind: 'walk', to: pos } : { kind: 'none' };
}
