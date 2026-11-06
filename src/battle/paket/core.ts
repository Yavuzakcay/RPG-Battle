/**
 * Görev P0: ek paket yorumlayıcısının ortak çekirdeği: ilkel alanlarının varsayılanları, formül, koşul, DC, hedef seçimi,
 * düğme gruplama ve savaş başı kurulumu (`withPaket`). Ağır bağımlılık yok (oluşturucu `create.ts` buradan içe aktarır).
 * Saf; zar `rng` ile.
 */
import { gap } from '../body';
import { isTargetable } from '../common';
import { turnKey } from '../economy';
import { auraCoreOn } from '../auraCore';
import { getMap } from '../../map/maps';
import { sizeRank } from '../forced';
import { DUGME_TETIKLERI, ILKELLER, ORTAK_ALANLAR, type Tetik } from '../../content/ilkelSema';
import { ruleVersion } from '../ruleVersion';
import { rollDice, rollTag, type Rng } from '../../rules/dice';
import type { ActiveEffect, BattleState, Combatant, ReactionSpec, UsableFeature } from '../types';
import type { Ilkel, PaketBag, PaketOzellik } from './bag';

export type { Ilkel, PaketBag, PaketOzellik };

/** Alanın değeri ya da şemadaki varsayılanı. */
export function val<T = unknown>(p: Ilkel, field: string): T {
  if (p[field] !== undefined) return p[field] as T;
  if (field === 'tetik') return ILKELLER[p.tur]?.tetikler[0] as T;
  if (field === 'hedef') return ILKELLER[p.tur]?.hedefler?.[0] as T;
  return (ILKELLER[p.tur]?.alanlar[field]?.varsayilan ?? ORTAK_ALANLAR[field]?.varsayilan) as T;
}
export const tetikOf = (p: Ilkel): Tetik => val<Tetik>(p, 'tetik');

const mod = (c: Combatant, a: string) => (c.modifiers as Record<string, number>)[a] ?? 0;
const castMod = (c: Combatant) => c.spellMod || Math.max(mod(c, 'int'), mod(c, 'wis'), mod(c, 'cha'));

/** Seviye tablosundan değer (`{ "3": x, "11": y }`: seviyeye göre en yüksek eşik). */
function byLevel(v: unknown, level: number): unknown {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return v;
  return Object.entries(v as Record<string, unknown>).filter(([l]) => level >= Number(l)).sort((a, b) => Number(b[0]) - Number(a[0]))[0]?.[1];
}
/** Formül → zar ifadesi ya da sayı (belirteçler çözülür; şema sözdizimini doğrulamıştır). */
export function formul(v: unknown, c: Combatant): string {
  const x = byLevel(v, c.level);
  if (typeof x === 'number') return String(x);
  if (typeof x !== 'string') return '0';
  const s = x.replace(/\s+/g, '').replace(/\$(pbYari|pb|lvl2|lvl|str|dex|con|int|wis|cha|buyu)/g, (_, k: string) => {
    switch (k) {
      case 'pb': return String(c.proficiency);
      case 'pbYari': return String(Math.max(1, Math.floor(c.proficiency / 2)));
      case 'lvl': return String(c.level);
      case 'lvl2': return String(2 * c.level);
      case 'buyu': return String(Math.max(0, castMod(c)));
      default: return String(Math.max(0, mod(c, k)));
    }
  });
  // Zar terimi tek; sabitler toplanır ("2+1d6-1" → "1d6+1").
  const terms = s.match(/[+-]?[^+-]+/g) ?? [];
  let dice = '';
  let flat = 0;
  for (const t of terms) {
    if (t.includes('d')) dice = t.replace(/^\+/, '');
    else flat += Number(t) || 0;
  }
  if (!dice) return String(flat);
  return flat ? `${dice}${flat > 0 ? '+' : ''}${flat}` : dice;
}
/** Sayı (zarlıysa ortalama değil: zar atılır). */
export function amount(v: unknown, c: Combatant, rng?: Rng, kind: 'damage' | 'heal' = 'heal'): number {
  const f = formul(v, c);
  if (!f.includes('d')) return Number(f) || 0;
  if (!rng) return Math.floor(rollDice(f, () => 0.5).total);
  return rollDice(f, rollTag(rng, { kind, by: c.id })).total;
}
/** Sabit sayı (zarsız; zarlıysa ortalama). */
export const flatNum = (v: unknown, c: Combatant): number => amount(v, c);

/** Kurtulma DC'si: "buyu" (yoksa 8 + PB + en iyi INT/WIS/CHA), sayı, yetenek listesi (8 + PB + en iyisi). */
export function dcOf(save: Record<string, unknown> | undefined, c: Combatant): number {
  const dc = save?.dc ?? 'buyu';
  if (typeof dc === 'number') return dc;
  if (Array.isArray(dc)) return 8 + c.proficiency + Math.max(...dc.map((a) => mod(c, a as string)));
  return c.spellSaveDc ?? 8 + c.proficiency + Math.max(mod(c, 'int'), mod(c, 'wis'), mod(c, 'cha'));
}

export const alive = (c: Combatant | undefined): c is Combatant => !!c && c.hp > 0 && c.life !== 'dead' && !c.summon?.gone && isTargetable(c);
export const within = (state: BattleState, a: Combatant, b: Combatant, ft: number | undefined): boolean =>
  ft === undefined || !state.map || !a.pos || !b.pos || gap(state, a, b) * 5 <= ft;

/** Etki kimlikleri. */
export const effId = (key: string, i: number, ownerId?: string): string => `pk:${key}#${i}${ownerId ? `:${ownerId}` : ''}`;
export const markId = (actorId: string, id: string): string => `pk-isaret:${id}:${actorId}`;
export const formId = (actorId: string, id: string): string => `pk-bicim:${id}:${actorId}`;
export const usedKey = (key: string, i: number): string => `pk:${key}#${i}`;

/** P6: savaş haritasının bölgesi (`harita/<bolge>/`; koşul `harita:<bölge>`). */
function mapRegion(state: BattleState): string | undefined {
  if (!state.map) return undefined;
  try { return getMap(state.map.id).bolge; } catch { return undefined; }
}

/** Koşullar (hepsi). `target`: isabet/hedef; `adv`: saldırı avantajlıydı. */
export function kosulOk(state: BattleState, actor: Combatant, p: Ilkel, target?: Combatant, adv = false): boolean {
  for (const k of (p.kosul as string[] | undefined) ?? []) {
    if (k === 'ofke' && !actor.rage) return false;
    if (k === 'yarimCanAlti' && !(actor.hp < actor.maxHp / 2)) return false;
    if (k === 'zirhsiz' && !actor.paket?.zirhsiz) return false;
    if (k === 'avantajli' && !adv) return false;
    if (k === 'konsantrasyon' && !actor.concentration) return false;
    if (k === 'dostBitisik' && !(target && Object.values(state.combatants).some((o) => o.id !== actor.id && o.side === actor.side && alive(o) && o.pos && target.pos && gap(state, o, target) <= 1))) return false;
    if (k.startsWith('bicim:') && !actor.effects?.some((e) => e.id === formId(actor.id, k.slice(6)))) return false;
    if (k.startsWith('isaretli:') && !target?.effects?.some((e) => e.id === markId(actor.id, k.slice(9)))) return false;
    // P6: bu tur büyü (her büyü: komut sonu işareti `pk-buyu`; slotlu: `economy.slotTurn`), harita bölgesi.
    if (k === 'buyuTurunda' && actor.traitTurns?.['pk-buyu'] !== turnKey(state)) return false;
    if (k === 'seviyeliBuyuTurunda' && actor.economy.slotTurn !== turnKey(state)) return false;
    if (k.startsWith('harita:') && mapRegion(state) !== k.slice(7)) return false;
    // P7: hedef sahibinden büyük.
    if (k === 'hedefBuyuk' && !(target && sizeRank(target.size) > sizeRank(actor.size))) return false;
    // P9: bu tur Flurry of Blows (kalan vuruş tanımlı), savaşın ilk turu.
    if (k === 'flurryVurusu' && actor.economy.flurryLeft === undefined) return false;
    if (k === 'ilkTur' && state.round !== 1) return false;
  }
  return true;
}

/** Kaynak anahtarı (yerel `kaynak` ilkeli → `pk-…`, yoksa sınıf kaynağı). */
export const resKey = (c: Combatant, id: string): string => c.paket?.kaynaklar?.[id] ?? id;
export function costOf(c: Combatant, p: Ilkel): { id: string; cost: number } | null {
  const k = p.kaynak as { id: string; maliyet?: number } | undefined;
  return k ? { id: resKey(c, k.id), cost: k.maliyet ?? 1 } : null;
}
export const canPay = (c: Combatant, p: Ilkel): boolean => { const k = costOf(c, p); return !k || (c.resources[k.id] ?? 0) >= k.cost; };
/** Turda bir kez: bu tur kullanıldı mı (`trait_turn`). */
export const usedThisTurn = (state: BattleState, c: Combatant, key: string, i: number): boolean => c.traitTurns?.[usedKey(key, i)] === turnKey(state);

/** Düğme: özellik × düğme tetiği; ilkellerin sırası korunur. */
export interface Dugme { key: string; feat: PaketOzellik; tetik: Tetik; prims: Array<{ p: Ilkel; i: number }> }
export const dugmeKey = (featKey: string, tetik: string): string => `pk:${featKey}:${tetik}`;
export function dugmeler(bag: PaketBag | undefined): Dugme[] {
  const out: Dugme[] = [];
  for (const f of bag?.ozellikler ?? []) for (const t of DUGME_TETIKLERI) {
    const prims = f.ilkeller.map((p, i) => ({ p, i })).filter((x) => tetikOf(x.p) === t);
    if (prims.length) out.push({ key: dugmeKey(f.key, t), feat: f, tetik: t, prims });
  }
  return out;
}
export const dugmeOf = (c: Combatant, key: string): Dugme | undefined => dugmeler(c.paket).find((d) => d.key === key);

/** Düğmenin hedef ihtiyacı: yaratık (tek hedef) ve/veya altıgen. */
export function dugmeNeeds(d: Dugme): { target: 'ally' | 'enemy' | 'any' | null; hex: boolean } {
  let target: 'ally' | 'enemy' | 'any' | null = null;
  let hex = false;
  for (const { p } of d.prims) {
    const h = val<string>(p, 'hedef');
    const want = h === 'dusman' || h === 'vurulan' ? 'enemy' : h === 'dost' || h === 'dostVeyaKendi' ? 'ally' : null;
    if (want) target = target && target !== want ? 'any' : want;
    if (h === 'alan' || p.tur === 'isinlan' || p.tur === 'yuzeyOlustur') hex = true;
  }
  return { target, hex };
}
/** Arayüz ve yapay zekâ: düğme hedef ister mi (`imzaTargeted` karşılığı). */
export const paketTargeted = (c: Combatant, key: string): boolean => { const d = dugmeOf(c, key); return !!d && dugmeNeeds(d).target !== null; };
export function paketHex(c: Combatant, key: string): 'hex' | 'after' | null {
  const d = dugmeOf(c, key);
  if (!d) return null;
  const n = dugmeNeeds(d);
  return n.hex ? (n.target ? 'after' : 'hex') : null;
}

/** Savaşçının paket özellikleri (düğmeler). */
export function paketFeatures(c: Combatant): UsableFeature[] {
  return dugmeler(c.paket).map((d) => {
    const pay = d.prims.find((x) => x.p.kaynak);
    return { key: d.key, name: (d.prims[0]?.p.ad as string | undefined) ?? d.feat.ad, type: d.tetik === 'eylem' ? 'action' : d.tetik === 'bonus' ? 'bonus' : 'free',
      ...(pay ? { resource: resKey(c, (pay.p.kaynak as { id: string }).id) } : {}),
      effect: { kind: 'paket' as const, ...((n) => ({ ...(n.target ? { target: n.target } : {}), ...(n.hex ? { hex: n.target ? 'after' as const : 'hex' as const } : {}) }))(dugmeNeeds(d)) } };
  });
}

// ------------------------------------------------------------------ pasif etkiler

/** Pasif ilkelin süren etki gövdesi (yoksa null: başka yoldan çalışır). */
export function passiveBody(p: Ilkel, c: Combatant, state?: BattleState): Partial<ActiveEffect> | null {
  switch (p.tur) {
    case 'direnc': {
      const tip = val<string>(p, 'tip');
      const turler = p.turler as string[];
      return tip === 'bagisiklik' ? { immuneDamage: turler } : tip === 'zaaf' ? { vulnerable: turler } : { resist: turler };
    }
    case 'zarEtkisi': return zarBody(p, c);
    case 'ucus': return { fly: p.hizFt === undefined || p.hizFt === 'yurume' ? c.speed : flatNum(p.hizFt, c) };
    case 'hiz': return { speedFt: flatNum(p.artiFt, c) };
    case 'boyut': return { size: 1, ...(p.ekHasar ? { hitDie: formul(p.ekHasar, c) } : {}), ...(typeof p.erisimFt === 'number' ? { reachPlus: p.erisimFt } : {}) };
    // P6: engelden geçme (`phase.ts`; zorlu arazi) ve fırsat saldırısı yok.
    case 'engeldenGec': return { phase: p.zorluArazi === false ? {} : { difficult: true }, ...(p.firsatYok === false ? {} : { noProvoke: true }) };
    case 'aura': return state && !auraCoreOn(state) ? null : { auras: [auraSpec(p, c, 0)] as unknown as ActiveEffect['auras'] };
    // P7: büyülü vuruş, koruma, algı, saldırmadan kurtulma.
    case 'buyuluVurus': return { pkMagic: val<string[]>(p, 'kapsam') ?? ['kendi'] };
    case 'koruma': return { ...(p.kritikBagisikligi ? { noCrit: true } : {}), ...(p.konsantrasyonAvantaji ? { concAdv: true } : {}),
      ...(Array.isArray(p.durumAvantaji) || p.buyulereAvantaj ? { saveAdvAgainst: [...((p.durumAvantaji as string[] | undefined) ?? []), ...(p.buyulereAvantaj ? ['spell'] : [])] } : {}) };
    case 'algi': return { ...(typeof p.karanlikGorusFt === 'number' ? { darkvision: p.karanlikGorusFt } : {}), ...(typeof p.gercekGorusFt === 'number' ? { pkTruesight: p.gercekGorusFt } : {}),
      ...(p.gorunmezGor ? { seeInvisible: true } : {}) };
    case 'saldirmadanSave': return { sanctuary: { dc: dcOf(p.save as Record<string, unknown>, c) } };
    // P9 (sürüm 38+): ek tepki hakkı, Flurry ek vuruşu.
    case 'tepkiHakki': return state && !p9On(state) ? null : val<boolean>(p, 'herTur') === false ? null : { pkReactive: true };
    case 'flurryEk': return state && !p9On(state) ? null : { pkFlurry: flatNum(p.ekVurus, c) };
    default: return null;
  }
}
/** Kuyruk P9: yeni ilkellerin kural sürümü kapısı. */
export const P9_VERSION = 38;
export const p9On = (state: Pick<BattleState, 'kuralSurumu'>): boolean => ruleVersion(state) >= P9_VERSION;
/** Kuyruk P10: ilkel genişletme 4 kapısı (kural sürümü 39). */
export const p10On = (state: Pick<BattleState, 'kuralSurumu'>): boolean => ruleVersion(state) >= 39;
/** Kuyruk P9: koşulsuz pasif `zarEtkisi.inisiyatifAvantaji` (savaş başında, paket henüz eşitlenmeden). */
export const paketInitAdv = (c: Combatant): boolean => !!c.paket?.ozellikler.some((f) => f.ilkeller.some((p) => p.tur === 'zarEtkisi' && p.inisiyatifAvantaji === true && tetikOf(p) === 'pasif' && !p.kosul));

/** zarEtkisi alanları → süren etki. */
export function zarBody(p: Ilkel, c: Combatant): Partial<ActiveEffect> {
  const out: Record<string, unknown> = {};
  const abs = (p.kurtulmalar as string[] | undefined) ?? ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  if (p.acBonusu !== undefined) out.ac = flatNum(p.acBonusu, c);
  if (p.kurtulmaBonusu !== undefined) { const n = flatNum(p.kurtulmaBonusu, c); out.saveMod = Object.fromEntries(abs.map((a) => [a, n])); }
  const av = (p.avantaj as string[] | undefined) ?? [];
  if (av.includes('saldiri')) out.attackAdv = true;
  if (av.includes('kurtulma')) out.saveAdv = abs;
  if (av.includes('kontrol')) out.checkAdv = abs;
  const dv = (p.dezavantaj as string[] | undefined) ?? [];
  if (dv.includes('saldiri')) out.attackDis = {};
  if (dv.includes('kurtulma')) out.saveDis = abs;
  // P6: d20 alt sınırı ve kritik eşiği.
  if (typeof p.d20AltSinir === 'number') out.pkD20Min = { value: p.d20AltSinir, on: (val<string[]>(p, 'd20Icin') ?? ['saldiri', 'kurtulma', 'kontrol']).map((x) => (x === 'saldiri' ? 'attack' : x === 'kurtulma' ? 'save' : 'check')) };
  if (typeof p.kritikAralik === 'number') out.pkCritOn = p.kritikAralik;
  if (p.zar !== undefined) {
    const on = ((val<string[]>(p, 'zarIcin')) ?? ['saldiri', 'kurtulma']).map((x) => (x === 'saldiri' ? 'attack' : x === 'kurtulma' ? 'save' : 'check'));
    out.dice = { die: formul(p.zar, c), sign: val<string>(p, 'zarYonu') === 'eksi' ? -1 : 1, on };
  }
  return out as Partial<ActiveEffect>;
}
/** aura ilkeli → K53 `AuraSpec`. */
export function auraSpec(p: Ilkel, c: Combatant, i: number): Record<string, unknown> {
  const zaman = val<string>(p, 'zaman');
  const trigger = zaman === 'turBasi' ? 'turnStart' : zaman === 'turSonu' ? 'turnEnd' : zaman === 'girince' ? 'enter' : 'passive';
  const filter = ({ dostlar: 'allies', dusmanlar: 'enemies', hepsi: 'all', digerleri: 'others' } as Record<string, string>)[val<string>(p, 'suzgec')] ?? 'allies';
  const n = () => Math.max(1, flatNum(p.miktar, c));
  const etki = p.etki as string;
  const effect = etki === 'kurtulmaBonusu' ? { kind: 'saveBonus', amount: n() }
    : etki === 'hasar' ? { kind: 'damage', dice: formul(p.zar, c), type: p.hasarTuru, ...((p.save as { yari?: boolean } | undefined)?.yari ? { half: true } : {}) }
      : etki === 'durum' ? { kind: 'condition', condition: p.durum }
        : etki === 'durumBagisikligi' ? { kind: 'conditionImmune', conditions: p.durumlar }
          : etki === 'gecicCan' ? { kind: 'tempHp', amount: n() }
            : etki === 'iyilestirmeYok' ? { kind: 'noHeal' }
              : etki === 'olumKurtulmaAvantaji' ? { kind: 'deathSaveAdv' }
                : etki === 'olumKurtulmaDezavantaji' ? { kind: 'deathSaveDis' }
                  : etki === 'direnc' ? { kind: 'resist', types: (p.turler as string[] | undefined) ?? [] }
                    : etki === 'kurtulmaDezavantaji' ? { kind: 'saveDis' } : { kind: 'moral', amount: n() };
  const save = p.save as Record<string, unknown> | undefined;
  return { id: `pk-aura:${c.id}:${i}`, name: (p.ad as string | undefined) ?? 'Aura', radius: Math.max(0, Math.floor(flatNum(p.yaricapFt, c) / 5)), filter, trigger, effect,
    ...(save ? { save: { ability: save.yetenek, dc: dcOf(save, c) } } : {}), ...(p.cesaret !== undefined ? { cesaret: p.cesaret } : {}) };
}

/** Tepki ilkeli → `ReactionSpec` (banaIsabet/hasarAldim; dostaIsabet kanca ile). */
export function reactionOf(p: Ilkel, c: Combatant, key: string, i: number, name: string): ReactionSpec | null {
  const olay = val<string>(p, 'olay');
  const etki = p.etki as string;
  const k = costOf(c, p);
  const base = { id: usedKey(key, i), name, ...(k ? { resource: k.id } : {}),
    ...(val<string>(p, 'saldiri') === 'yakin' ? { melee: true } : val<string>(p, 'saldiri') === 'menzilli' ? { ranged: true } : {}) };
  if (olay === 'banaIsabet') {
    if (etki === 'acBonusu') return { ...base, kind: 'parry', acBonus: flatNum(p.miktar, c) } as ReactionSpec;
    if (etki === 'hasarAzalt') return { ...base, kind: 'reduce', dice: formul(p.miktar, c), ...(p.turler ? { types: p.turler as string[] } : {}) } as ReactionSpec;
    if (etki === 'yariya') return { ...base, kind: 'halve' } as ReactionSpec;
    if (etki === 'direnc') return { ...base, kind: 'resist' } as ReactionSpec;
  }
  if (olay === 'hasarAldim' && etki === 'karsiVurus') return { ...base, kind: 'retaliate' } as ReactionSpec;
  return null;
}

/**
 * Savaş başı (oluşturucu): paket düğmeleri, tepkiler, pasif inisiyatif eklentisi ve koşulsuz pasif etkiler. Koşullu
 * pasifler ve ölümden dönüş komut sonunda eşitlenir (`index.ts`). Paketsiz savaşta durum aynen döner.
 */
export function withPaket(state: BattleState): BattleState {
  let changed = false;
  const combatants: Record<string, Combatant> = {};
  for (const [id, c] of Object.entries(state.combatants)) {
    if (!c.paket) { combatants[id] = c; continue; }
    changed = true;
    const feats = paketFeatures(c);
    const reactions: ReactionSpec[] = [];
    const effects: ActiveEffect[] = [];
    let init = 0;
    let attacks = c.attacksPerAction;
    // P9 (sürüm 38+): en çok can artışı savaş kuruluşunda (Aid yolu; başlangıç olayı durumu taşır, replay aynı).
    let hpPlus = 0;
    for (const f of c.paket.ozellikler) f.ilkeller.forEach((p, i) => {
      if (p.tur === 'tepki') { const r = reactionOf(p, c, f.key, i, (p.ad as string | undefined) ?? f.ad); if (r) reactions.push(r); }
      if (tetikOf(p) !== 'pasif' || p.kosul) return;
      // P6: ikinci saldırı (Saldırı eylemindeki saldırı sayısı en az bu).
      if (p.tur === 'ekSaldiri' && typeof p.saldiriSayisi === 'number') attacks = Math.max(attacks, p.saldiriSayisi);
      if (p.tur === 'zarEtkisi' && p.inisiyatifBonusu !== undefined) init += flatNum(p.inisiyatifBonusu, c);
      if (p.tur === 'canArtisi' && p9On(state)) hpPlus += Math.max(0, flatNum(p.miktar, c));
      const body = passiveBody(p, c, state);
      if (body && Object.keys(body).length) effects.push({ ...body, id: effId(f.key, i), name: (p.ad as string | undefined) ?? f.ad, sourceId: c.id } as ActiveEffect);
    });
    combatants[id] = {
      ...c,
      ...(feats.length ? { features: [...(c.features ?? []).filter((x) => x.effect.kind !== 'paket'), ...feats] } : {}),
      ...(reactions.length ? { reactions: [...(c.reactions ?? []), ...reactions] } : {}),
      ...(effects.length ? { effects: [...(c.effects ?? []), ...effects] } : {}),
      ...(init ? { initiativeBonus: c.initiativeBonus + init } : {}),
      ...(attacks !== c.attacksPerAction ? { attacksPerAction: attacks } : {}),
      ...(hpPlus ? { maxHp: c.maxHp + hpPlus, hp: c.hp + hpPlus } : {}),
      // P7: savaş başındaki kaynaklar (`kaynakYenile` üst sınırı).
      paket: { ...c.paket, kaynakBas: Object.fromEntries(Object.values(c.paket.kaynaklar ?? {}).map((k) => [k, c.resources[k] ?? 0])) },
    };
  }
  return changed ? { ...state, combatants } : state;
}

/** Büyü hasarı eklentisi (`buyuDegisimi.hasarEki`; türe/okula göre; koşulsuz pasifler). `spells.ts` `damageExpr` okur. */
export function paketSpellBonus(c: Combatant, damageType: string | undefined, school: string | undefined): number {
  let n = 0;
  for (const f of c.paket?.ozellikler ?? []) for (const p of f.ilkeller) {
    if (p.tur !== 'buyuDegisimi' || p.hasarEki === undefined || p.kosul) continue;
    if (p.hasarTurleri && !(p.hasarTurleri as string[]).includes(damageType ?? '')) continue;
    if (p.okul && p.okul !== school) continue;
    n += flatNum(p.hasarEki, c);
  }
  return n;
}

/**
 * Görev P6: büyü dönüşümü (`buyuDegisimi`; koşulsuz pasif): menzilli büyüye menzil eki, hasar türünü değiştirme
 * (`hasarTurleri` verilirse yalnız onlardan; `okul` süzgeci). Yapımdan önce (`spells.ts`, Eldritch Spear yolu).
 */
export function paketSpellTransform<S extends { rangeFt: number; school?: string; mechanics: { damageType?: string } }>(c: Combatant, spell: S): S {
  let out = spell;
  for (const f of c.paket?.ozellikler ?? []) for (const p of f.ilkeller) {
    if (p.tur !== 'buyuDegisimi' || p.kosul) continue;
    if (p.okul && p.okul !== out.school) continue;
    if (typeof p.menzilEkiFt === 'number' && out.rangeFt > 5) out = { ...out, rangeFt: out.rangeFt + p.menzilEkiFt };
    const t = out.mechanics.damageType;
    if (typeof p.yeniTur === 'string' && t && (!p.hasarTurleri || (p.hasarTurleri as string[]).includes(t))) out = { ...out, mechanics: { ...out.mechanics, damageType: p.yeniTur } };
  }
  return out;
}
