/**
 * Görev E1: efekt bağlama (yalnızca görsel; motoru, kuralları, sayıları ve kural sürümünü değiştirmez). Saf: React/DOM yok.
 * Sprite tablosu `npm run sprite-ice -- --efekt` → data/sprite-esleme.json `efektler` (public/sprites/efekt-<ad>.webp, yatay
 * şerit, siyah zeminli sayfalardan parlaklık alfası, `screen` karışımı). Olay → efekt kuralları data/efekt-baglama.json.
 * - Tek seferlik efektler (`fxShots`): yalnızca motorda ZATEN olan olaylardan (saldırı isabeti, iyileştirme, ışınlanma,
 *   alan, koruma etkisi, çağırma, itme, çarpma, Moral); ölüm olay değil durum farkıdır (`deathShots`: önceki durumda
 *   ayakta olup şimdi ölü/kaybolmuş jeton).
 * - Kalıcı efektler (`groundFx`): aura (K53 aura etkisi ya da yaratığa bağlı büyü alanı) ve engel/duvar alanları.
 * - Bütçe (`allocate`): ekranda en çok `butce.ekran` animasyon, jeton başına en çok `butce.jeton`; aşan statik tek kare.
 *   Efekt ayarı kapalı ya da "hareketi azalt" açıkken hepsi statik tek kare.
 */
import esleme from '../../../data/sprite-esleme.json';
import e2 from '../../../data/efekt-e2.json';
import baglama from '../../../data/efekt-baglama.json';
import { distance, type Offset } from '../../rules/hex';
import type { ActiveEffect, BattleEvent, BattleState, Combatant, SpellZone } from '../../battle/types';
import { tokenScale } from '../tokenSize';

export interface FxSprite {
  /** Sprite adı (efekt- öneki olmadan, ör. `darbe-kesik`). */
  id: string; file: string; frames: number; ms: number; kind: string; loop: boolean; w: number; h: number;
  dir: 'sag' | null; blend: string; overlap: number;
  /** Kuyruk E4c: hareketi azaltta gösterilen kare (0 tabanlı; yoksa ortadaki). */
  still?: number;
}
interface Rec { kare: number; sure: number; tur: string; karisim: string; yon: string | null; en: number; boy: number; dongu: boolean; ortusme?: number; yol?: string; sabit?: number }

// Kuyruk E2: E2 sayfaları ayrı kayıtta (data/efekt-e2.json, public/efekt/; yalnızca bu tembel parça okur).
const RECS = { ...((esleme as unknown as { efektler?: Record<string, Rec> }).efektler ?? {}), ...((e2 as unknown as { efektler?: Record<string, Rec> }).efektler ?? {}) };
export const FX: Record<string, FxSprite> = Object.fromEntries(Object.entries(RECS).map(([name, r]) => {
  const id = name.replace(/^efekt-/, '');
  return [id, { id, file: r.yol ? `${r.yol}.webp` : `sprites/${name}.webp`, frames: r.kare, ms: r.sure, kind: r.tur, loop: r.dongu, w: r.en, h: r.boy,
    dir: r.yon === 'sag' ? 'sag' : null, blend: r.karisim, overlap: r.ortusme ?? 0, ...(r.sabit !== undefined ? { still: r.sabit } : {}) }];
}));
/** Kuyruk E2: ikon sayfaları (işaret simgeleri, sayı okları): önek → ad → public/ yolu (uzantısız). */
export const SIMGE: Record<string, Record<string, string>> = (e2 as unknown as { simgeler?: Record<string, Record<string, string>> }).simgeler ?? {};
/** Simge tek kareli sprite olarak (işaret: hedefin üstünde kısa süre). */
export function simgeSprite(onek: string, ad: string | undefined): FxSprite | null {
  const yol = ad ? SIMGE[onek]?.[ad] : undefined;
  return yol ? { id: `${onek}-${ad}`, file: `${yol}.webp`, frames: 1, ms: 1100, kind: 'isaret', loop: false, w: 128, h: 128, dir: null, blend: 'normal', overlap: 0 } : null;
}

/**
 * Kuyruk E2: olay etiketinden büyü kimliği (SRD kimliği adın küçük harfli, tireli biçimi; 339 büyünün hepsinde aynı).
 * Ekler ("(tekrar)", ": patlama") atılır.
 */
export const spellSlug = (label: string | undefined): string =>
  (label ?? '').split(/ \(|: /)[0]!.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
/** Durum ikonları (SRD durum adı küçük harf → sprite yolu). */
export const STATUS_ICON_FILES: Record<string, string> = Object.fromEntries(
  Object.entries((esleme as unknown as { efektIkonlari?: Record<string, string> }).efektIkonlari ?? {}).map(([k, v]) => [k, `sprites/${v}.webp`]));

export const B = baglama;
export const SCREEN_BUDGET = B.butce.ekran;
export const TOKEN_BUDGET = B.butce.jeton;

/** Tek seferlik efekt: jetonun üstünde (`targetId`) ya da altıgende (`at`); ışın `from`→`to`. */
export interface FxShot {
  sprite: FxSprite; delay: number;
  targetId?: string; at?: Offset; from?: Offset; to?: Offset;
  /** Çizim boyu (altıgen eni katı; alanda yarıçaptan). */
  scale: number;
  /** Derece; yönlü sprite (itme) hedefin itilme yönüne. */
  rotate?: number;
  /** Kuyruk E2: `from`→`to` arasında uçan tek sprite (mermi); yoksa ışın parçaları. */
  travel?: boolean;
  /** Kuyruk E2: koni dokusu (`from` çıkış, `to` nişan; `scale` boy altıgen). */
  cone?: boolean;
  /** Kuyruk E2: bağ çizgisi (`from`→`to`, sprite yok sayılır). */
  link?: boolean;
  /** Kuyruk E2: renk çarpanı (beyaz sprite) ve CSS hue-rotate derecesi. */
  ton?: string;
  hue?: number;
  /** Kuyruk E2: jeton merkezinden dikey kayma (altıgen eni katı; simge jetonun üstünde). */
  dy?: number;
  /** Kuyruk E4c: çapa oranı (karenin üstten) jetonun tabanına, saydamlık. */
  anchor?: number;
  alpha?: number;
}

/** Kuyruk E2: büyü bağlaması (data/efekt-baglama.json `buyu`). */
export interface SpellFx { yol: 'mermi' | 'isin' | 'hedef' | 'kendi' | 'alan' | 'gokten' | 'koni' | 'isaret'; sprite?: string; simge?: string; ton?: string; hue?: number;
  olcek?: number; ek?: string; zincir?: boolean; hedefBasina?: boolean; bag?: boolean;
  /** Kuyruk E4c: şeridin çapa yeri (karenin üstten oranı): jetonun tabanına oturur (yükselen toz); `opaklik` tek seferlik efektin saydamlığı. */
  ankraj?: number; opaklik?: number }
export const SPELL_FX = (baglama as unknown as { buyu?: Record<string, SpellFx> }).buyu ?? {};

const sp = (id: string | undefined): FxSprite | null => (id && FX[id]) || null;
const scaleOf = (kind: string): number => (B.olcek as Record<string, number>)[kind] ?? 2;

/** Flat-top odd-q altıgen merkezi (birim: altıgen eni 1; yalnızca açı ve uzaklık için). */
function center(h: Offset): { x: number; y: number } {
  return { x: h.col * 0.75, y: (h.row + (h.col & 1 ? 0.5 : 0)) * (Math.sqrt(3) / 2) };
}
export const angleDeg = (a: Offset, b: Offset): number => {
  const p = center(a); const q = center(b);
  return (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
};

/** Koruma satırı: süren etkinin ilk eşleşen alanı (data `koruma`). */
export function protectionSprite(e: Partial<ActiveEffect> & Record<string, unknown>): FxSprite | null {
  for (const r of B.koruma as Array<{ alan: string; isaret?: number; sprite: string }>) {
    const v = (e as Record<string, unknown>)[r.alan];
    if (v === undefined || v === null || v === false) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (typeof v === 'number' && v <= 0) continue;
    if (r.isaret !== undefined && (v as { sign?: number }).sign !== r.isaret) continue;
    return sp(r.sprite);
  }
  return null;
}

/** Çağırma satırı: dokunulamaz (ruh sürüsü, Flaming Sphere) ya da veri listesi; yoksa portal. */
export function summonSprite(c: Pick<Combatant, 'summon'>): FxSprite | null {
  const id = c.summon?.spellId ?? '';
  const C = B.cagir;
  // Kuyruk E2: büyüye özel portal (renk `summonTint`).
  const R = (B as unknown as { cagirRenk?: Record<string, { sprite: string }> }).cagirRenk?.[id];
  if (R && sp(R.sprite)) return sp(R.sprite);
  if (c.summon?.intangible || C.ruhBuyuler.includes(id)) return sp(C.ruh);
  if (C.dogalBuyuler.includes(id)) return sp(C.dogal);
  return sp(C.varsayilan);
}

/** Alanın kapladığı yarıçap (altıgen): altıgen sayısından (1 + 3r(r+1) ≈ n). */
const radiusOf = (n: number): number => Math.max(1, (-3 + Math.sqrt(9 + 12 * Math.max(0, n - 1))) / 6);
const centroid = (hexes: Offset[]): Offset => {
  const c = hexes.reduce((s, h) => ({ col: s.col + h.col, row: s.row + h.row }), { col: 0, row: 0 });
  const p = { col: c.col / hexes.length, row: c.row / hexes.length };
  return hexes.reduce((b, h) => (Math.hypot(h.col - p.col, h.row - p.row) < Math.hypot(b.col - p.col, b.row - p.row) ? h : b), hexes[0]!);
};

/** Bu olaylardaki tek seferlik efektler (sırayla; `stagger` ms aralıkla). `before`: olaylardan önceki durum (konumlar). */
export function fxShots(events: BattleEvent[], before: BattleState, stagger = 120): FxShot[] {
  const out: FxShot[] = [];
  let d = 0;
  const push = (s: FxSprite | null, x: Omit<FxShot, 'sprite' | 'delay' | 'scale'> & { scale?: number; delay?: number }) => {
    if (!s) return;
    out.push({ sprite: s, scale: x.scale ?? scaleOf(s.kind), ...x, delay: d + (x.delay ?? 0) });
    d += stagger;
  };
  const posOf = (id: string): Offset | null => before.combatants[id]?.pos ?? null;
  const areas = new Set<string>();
  const area = (actorId: string, hexes: Offset[], type: string | undefined, shape?: string, aim?: Offset) => {
    if (!hexes.length || !type) return;
    const key = hexes.map((h) => `${h.col},${h.row}`).sort().join(';');
    if (areas.has(key)) return;
    areas.add(key);
    const from = posOf(actorId);
    // Kuyruk E2: koni alan dokusu (hasar türünden; çıkış büyücü, yön nişan ya da alanın merkezi).
    if (shape === 'cone' && from) {
      const k = coneOf(type);
      const s = sp(k?.sprite);
      if (s) { push(s, { from, to: aim ?? centroid(hexes), cone: true, scale: coneLen(from, hexes), ...(k?.hue ? { hue: k.hue } : {}) }); return; }
    }
    if (shape === 'line' && from) {
      // Çizgi alan: ışın parçaları, çıkıştan en uzak altıgene.
      const far = hexes.reduce((b, h) => (Math.hypot(h.col - from.col, h.row - from.row) > Math.hypot(b.col - from.col, b.row - from.row) ? h : b), hexes[0]!);
      push(sp((B.isin as Record<string, string>)[type]), { from, to: far, scale: 1 });
      return;
    }
    const at = aim ?? centroid(hexes);
    push(sp(alanOf(type)), { at, scale: 2 * radiusOf(hexes.length) + 1.2 });
  };
  // Kuyruk E2: bu olaylardaki bağlı büyüler (kimlik → büyücü, alan, hedefler); bağlı büyünün alanı genel patlamayla yinelenmez.
  const spells = collectSpells(events);
  const once = new Set<string>();
  const pushOnce = (key: string, s: FxSprite | null, x: Parameters<typeof push>[1]) => { if (!s || once.has(key)) return; once.add(key); push(s, x); };
  for (const e of events) {
    switch (e.type) {
      case 'attack_resolved':
        if (e.hit) {
          const named = (B.darbe as Record<string, string>)[e.damageType];
          const ton = !e.critical && !named ? (B as unknown as { darbeTon?: Record<string, string> }).darbeTon?.[e.damageType] : undefined;
          push(sp(e.critical ? B.darbe.kritik : named ?? B.darbe.varsayilan), { targetId: e.targetId, ...(ton ? { ton } : {}) });
        }
        break;
      case 'healed':
        if (e.amount > 0) push(sp(e.amount >= B.iyilestirBuyuk ? 'iyilestir-buyuk' : 'iyilestir-kucuk'), { targetId: e.targetId });
        break;
      case 'teleported':
        push(sp(B.isinlan.cikis), { at: e.from });
        push(sp(B.isinlan.giris), { at: e.to, delay: B.isinlan.girisGecikme });
        break;
      case 'area_used':
        area(e.actorId, e.hexes, e.damageType, e.shape, e.aim);
        break;
      case 'spell_cast':
        if (e.area && !areaBound(spells.get(spellSlug(e.label)))) area(e.actorId, e.area.hexes.length ? e.area.hexes : e.area.airHexes ?? [], e.area.damageType, e.area.shape, e.area.aim);
        break;
      case 'temp_hp':
        if (e.amount > 0) pushOnce(`${(B as unknown as { tempHp?: string }).tempHp}:${e.targetId}`, sp((B as unknown as { tempHp?: string }).tempHp), { targetId: e.targetId });
        break;
      case 'life_restored':
        pushOnce(`${(B as unknown as { dirilme?: string }).dirilme}:${e.targetId}`, sp((B as unknown as { dirilme?: string }).dirilme), { targetId: e.targetId });
        break;
      case 'effect_added':
        if (e.effect.sourceId === e.targetId || before.combatants[e.effect.sourceId]?.side === before.combatants[e.targetId]?.side) {
          const s = protectionSprite(e.effect as unknown as Record<string, unknown>);
          // Kuyruk E2: aynı jetonda aynı koruma bir kez (bağlı büyü, geçici HP olayı).
          pushOnce(`${s?.id}:${e.targetId}`, s, { targetId: e.targetId });
        }
        break;
      case 'summoned':
        if (e.combatant.pos) {
          const ton = summonTint(e.combatant);
          push(summonSprite(e.combatant), { at: e.combatant.pos, ...(ton ? { ton } : {}) });
        }
        break;
      case 'pushed':
        push(sp(B.itme), { at: e.from, rotate: angleDeg(e.from, e.to) });
        break;
      case 'map_effect': {
        const C = B.carpma as Record<string, string>;
        if (e.rule === 'carpmaHasari') push(sp(/nesne/.test(e.text) ? C.nesne : C.carpmaHasari), { targetId: e.targetId });
        else if (C[e.rule]) push(sp(C[e.rule]), { targetId: e.targetId });
        break;
      }
      case 'moral_changed':
        push(sp((B.moral as Record<string, string>)[e.reason]), { targetId: e.targetId });
        break;
      default:
        break;
    }
  }
  // Kuyruk E2: bağlı büyülerin efektleri (olay sırasıyla).
  for (const [id, u] of spells) spellShots(id, u, before, push, pushOnce);
  return out;
}

/** Kuyruk E2: koni dokusu (hasar türü → satır; yoksa varsayılan). */
function coneOf(type: string | undefined): { sprite: string; hue?: number } | undefined {
  const K = (B as unknown as { koni?: Record<string, { sprite: string; hue?: number }> }).koni ?? {};
  return (type && K[type]) || K.varsayilan;
}
/** Alan patlaması: alan tablosu + Kuyruk E2 ek türleri (soğuk, asit, zehir, ezme). */
export function alanOf(type: string | undefined): string | undefined {
  if (!type) return undefined;
  return (B.alan as Record<string, string>)[type] ?? (B as unknown as { alanEk?: Record<string, string> }).alanEk?.[type];
}
/** Koni boyu (altıgen): çıkıştan en uzak alan altıgenine. */
const coneLen = (from: Offset, hexes: Offset[]): number => Math.max(1, ...hexes.map((h) => Math.hypot(center(h).x - center(from).x, center(h).y - center(from).y)));

/** Bağlı büyünün kendi alan görseli var (genel patlama yinelenmesin). */
const areaBound = (u: SpellUse | undefined): boolean => !!u && ['alan', 'gokten', 'koni', 'isin'].includes(u.fx.yol);

interface SpellUse { fx: SpellFx; actorId?: string; area?: { hexes: Offset[]; shape?: string; aim?: Offset }; targets: string[]; hits: string[] }

/** Olay → büyü kimliği (etiket, tepki adı, etki adı, buff kaynağı) ve yapan/hedef. */
function spellRef(e: BattleEvent): { id: string; actorId?: string; targetId?: string | null; hit?: boolean } | null {
  switch (e.type) {
    case 'spell_cast': return { id: spellSlug(e.label), actorId: e.actorId, targetId: e.targetId };
    case 'reaction_used': return { id: spellSlug(e.name), actorId: e.actorId };
    case 'attack_resolved': return { id: spellSlug(e.label), actorId: e.actorId, targetId: e.targetId, hit: true };
    case 'save_resolved': return { id: spellSlug(e.label), actorId: e.actorId, targetId: e.targetId, hit: true };
    case 'healed': return { id: spellSlug(e.label), actorId: e.actorId, targetId: e.targetId };
    case 'temp_hp': return { id: spellSlug(e.label), targetId: e.targetId };
    case 'hp_boosted': return { id: spellSlug(e.label), targetId: e.targetId };
    case 'life_restored': return { id: spellSlug(e.label), targetId: e.targetId };
    case 'effect_added': return { id: spellSlug(e.effect.name), actorId: e.effect.sourceId, targetId: e.targetId };
    case 'buff_added': return { id: spellSlug(e.buff.source), actorId: e.buff.by, targetId: e.targetId };
    case 'time_stop': return { id: 'time-stop', actorId: e.actorId };
    // Kuyruk E4: özel yollu büyü (Prismatic Spray: `spell_cast` hedefsiz, ışınlar hedef başına `map_effect`; etiket "Büyü (Renk)").
    // Kuyruk E4b: Reverse Gravity (alandaki her yaratık için save/düşüş olayı; sütun yaratığın üstünde). Kuyruk E4c: Power Word Kill (hedefte `map_effect`; `spell_cast` hedefsiz).
    case 'map_effect': return e.rule === 'spells69' && (e.text.startsWith('Prismatic Spray (') || e.text.startsWith('Reverse Gravity') || e.text.startsWith('Power Word Kill')) ? { id: spellSlug(e.text), actorId: undefined, targetId: e.targetId, hit: true } : null;
    default: return null;
  }
}

/** Olaylardaki bağlı büyüler (ilk geçiş sırasıyla). */
export function collectSpells(events: BattleEvent[]): Map<string, SpellUse> {
  const out = new Map<string, SpellUse>();
  for (const e of events) {
    const r = spellRef(e);
    const fx = r && SPELL_FX[r.id];
    if (!r || !fx) continue;
    let u = out.get(r.id);
    if (!u) { u = { fx, targets: [], hits: [] }; out.set(r.id, u); }
    if (r.actorId && !u.actorId) u.actorId = r.actorId;
    if (e.type === 'spell_cast' && e.area?.hexes.length && !u.area) u.area = { hexes: e.area.hexes, shape: e.area.shape, aim: e.area.aim };
    if (r.targetId && !u.targets.includes(r.targetId)) u.targets.push(r.targetId);
    // Mermi/ışın: saldırı başına bir (Magic Missile, Scorching Ray); en çok 6.
    if (r.hit && r.targetId && u.hits.length < 6) u.hits.push(r.targetId);
  }
  return out;
}

type Push = (s: FxSprite | null, x: Omit<FxShot, 'sprite' | 'delay' | 'scale'> & { scale?: number; delay?: number }) => void;

/** Tek bağlı büyünün efektleri. */
function spellShots(id: string, u: SpellUse, before: BattleState, push: Push, pushOnce: (k: string, s: FxSprite | null, x: Parameters<Push>[1]) => void): void {
  const f = u.fx;
  const tint = { ...(f.ton ? { ton: f.ton } : {}), ...(f.hue ? { hue: f.hue } : {}) };
  const s = f.yol === 'isaret' ? simgeSprite('isaret', f.simge) : sp(f.sprite);
  if (!s) return;
  const pos = (cid: string | undefined): Offset | null => (cid ? before.combatants[cid]?.pos ?? null : null);
  const from = pos(u.actorId);
  const targets = u.targets.filter((t) => t !== u.actorId || f.yol === 'hedef' || f.yol === 'isaret');
  const onTargets = (list: string[]) => {
    const scale = f.olcek ? { scale: f.olcek } : {};
    const extra = { ...(f.ankraj !== undefined ? { anchor: f.ankraj } : {}), ...(f.opaklik !== undefined ? { alpha: f.opaklik } : {}) };
    for (const t of list) pushOnce(`${s.id}:${t}`, s, { targetId: t, ...scale, ...tint, ...extra });
  };
  switch (f.yol) {
    case 'mermi':
    case 'isin': {
      if (!from) break;
      const hits = u.hits.length ? u.hits : targets;
      const line = f.yol === 'isin' && u.area?.shape === 'line' && u.area.hexes.length;
      if (line) {
        const far = u.area!.hexes.reduce((b, h) => (Math.hypot(h.col - from.col, h.row - from.row) > Math.hypot(b.col - from.col, b.row - from.row) ? h : b), u.area!.hexes[0]!);
        push(s, { from, to: far, scale: 1, ...tint });
        break;
      }
      let prev = from;
      for (const t of hits) {
        const to = pos(t);
        if (!to) continue;
        push(s, { from: f.zincir ? prev : from, to, scale: 1, ...(f.yol === 'mermi' ? { travel: true } : {}), ...tint });
        if (f.zincir) prev = to;
        if (f.ek) pushOnce(`${id}:ek:${t}`, sp(f.ek), { targetId: t, scale: 1.6, delay: 200 });
      }
      break;
    }
    case 'koni': {
      if (!from || !u.area) break;
      push(s, { from, to: u.area.aim ?? centroid(u.area.hexes), cone: true, scale: coneLen(from, u.area.hexes), ...tint });
      break;
    }
    case 'alan':
    case 'gokten': {
      if (u.area && !f.hedefBasina) { push(s, { at: u.area.aim ?? centroid(u.area.hexes), scale: f.olcek ?? 2 * radiusOf(u.area.hexes.length) + 1.2, ...tint }); break; }
      const list = targets.length ? targets : u.actorId ? [u.actorId] : [];
      for (const t of list) pushOnce(`${s.id}:${t}`, s, { targetId: t, scale: f.olcek ?? (f.yol === 'gokten' ? 2 : 1.8), ...tint });
      break;
    }
    case 'hedef':
      onTargets(targets.length ? targets : u.actorId ? [u.actorId] : []);
      break;
    case 'kendi':
      onTargets(u.actorId ? [u.actorId] : []);
      break;
    case 'isaret':
      for (const t of targets) {
        pushOnce(`${id}:${t}`, s, { targetId: t, scale: 0.9, dy: -0.55 });
        const to = pos(t);
        if (f.bag && from && to && t !== u.actorId) push(s, { from, to, link: true, scale: 1, ton: f.ton ?? '#e8d8ff' });
      }
      break;
    default:
      break;
  }
}

/** Kuyruk E2: çağrının portal tonu (veride büyü kimliğiyle; paket çağrısında yok). */
export function summonTint(c: Pick<Combatant, 'summon'>): string | undefined {
  return (B as unknown as { cagirRenk?: Record<string, { ton?: string }> }).cagirRenk?.[c.summon?.spellId ?? '']?.ton;
}

/** Haritada çizilen (ayakta ya da ölmekte) jeton: savaş ekranının jeton süzgeciyle aynı. */
export const onBoard = (c: Combatant | undefined): boolean =>
  !!c && !!c.pos && c.life !== 'dead' && !c.summon?.gone && (c.hp > 0 || c.life !== 'alive' || !!c.regenPending);

/** Ölüm: önceki durumda haritada olan, şimdi ölü ya da kaybolmuş (0 HP canavar, çağrı) jeton → toz (son konumunda). */
export function deathShots(before: BattleState, after: BattleState): FxShot[] {
  const s = sp(B.olum);
  if (!s) return [];
  const out: FxShot[] = [];
  for (const c of Object.values(before.combatants)) {
    if (!onBoard(c) || onBoard(after.combatants[c.id])) continue;
    // Kat değişimi ya da keşifte haritadan alınan (ölmeyen) jeton toz bırakmaz.
    const n = after.combatants[c.id];
    if (n && n.life === 'alive' && n.hp > 0 && !n.summon?.gone) continue;
    out.push({ sprite: s, at: c.pos as Offset, scale: scaleOf(s.kind), delay: 0 });
  }
  return out;
}

/** Aura rengi: hasar türü (ateş/nekrotik kırmızı, soğuk buz), düşmana yönelik kırmızı, yoksa altın. */
function auraSprite(type: string | undefined, filter: string | undefined): FxSprite | null {
  const A = B.aura as Record<string, string>;
  return sp((type && A[type]) || (filter === 'enemies' ? A.enemies : undefined) || A.varsayilan);
}

export interface GroundAura {
  key: string; ownerId: string; radius: number; sprite: FxSprite;
  /** Kuyruk E4b: durum halkası (taşlaşma): yarıçap 0, jetonun görsel ölçeği (halka jetona uyar). */
  ring?: number;
}
/** Kuyruk E2: kalıcı alan zemin dokusu (alanın merkezinde, alan kadar). */
/** Kuyruk E4c: altıgenin 12 çeşit görünümü (6 döndürme × aynalama), koordinattan türetilmiş (aynı altıgen her çizimde aynı). */
export const hexVariant = (h: Offset): number => (((h.col * 73856093) ^ (h.row * 19349663)) >>> 0) % 12;
/** Kuyruk E4c: altıgen başına döşenen zemin dokuları (data/efekt-baglama.json `zeminKaro`). */
const KARO = ((B as unknown as { zeminKaro?: Record<string, { opaklik: number }> }).zeminKaro ?? {});
export interface GroundPatch {
  key: string; at: Offset; radius: number; sprite: FxSprite; ton?: string;
  /** Kuyruk E4b: alanın altıgenleri (zemin dokusu bu altıgenlerin birleşimine kırpılır). */
  hexes: Offset[];
  /** Kuyruk E4c: dokuyu altıgen başına (koordinattan türetilmiş döndürme/aynalama) döşe; opaklık. Tek seferlik (loop=false) doku son karede kalır. */
  karo?: { opaklik: number };
  loop: boolean;
}
export interface GroundWall {
  key: string; hexes: Array<{ at: Offset; rotate: number }>; sprite: FxSprite; tint?: string; outline?: string;
  /** Kuyruk E4b: dikişsiz olmayan duvar (rüzgâr): parça uçlarının yumuşama oranı (parça enine); yoksa dikişsiz. */
  soft?: number;
}

/** Kalıcı efektler: auralar (yaratığa bağlı) ve duvarlar (engel alanları). */
export function groundFx(state: BattleState): { auras: GroundAura[]; walls: GroundWall[]; patches: GroundPatch[] } {
  const auras: GroundAura[] = []; const walls: GroundWall[] = []; const patches: GroundPatch[] = [];
  const AB = (B as unknown as { auraBuyu?: Record<string, { sprite: string; ft: number }> }).auraBuyu ?? {};
  for (const c of Object.values(state.combatants)) {
    if (!c.pos || c.hp <= 0 || c.summon?.gone) continue;
    // Kuyruk E2: konsantrasyon yayılımı (Spirit Guardians) ve kendi üstündeki aura büyüleri (Fire Shield).
    const own = new Set<string>();
    if (c.concentration) own.add(spellSlug(c.concentration.spell));
    for (const e of c.effects ?? []) if (e.sourceId === c.id) own.add(spellSlug(e.name));
    for (const id of own) {
      const a = AB[id];
      const s = a && sp(a.sprite);
      if (s) auras.push({ key: `${c.id}:buyu:${id}`, ownerId: c.id, radius: Math.max(1, Math.round(a.ft / 5)), sprite: s });
    }
    // Kuyruk E4b: durum halkası (Petrified → taş halka; Flesh to Stone'un üçüncü başarısızlığı ve her taşlaşma).
    const H = (B as unknown as { durumHalka?: Record<string, string> }).durumHalka ?? {};
    for (const cond of c.conditions ?? []) {
      const rs = H[cond] && sp(H[cond]);
      if (rs) auras.push({ key: `${c.id}:durum:${cond}`, ownerId: c.id, radius: 0, sprite: rs, ring: tokenScale(c) });
    }
    // Kuyruk E5: süren etkiye bağlı döngü (Irresistible Dance: etki sürdükçe jetonun üstünde döner; `etkiHalka[büyü kimliği]` → sprite).
    const EH = (B as unknown as { etkiHalka?: Record<string, { sprite: string; olcek: number }> }).etkiHalka ?? {};
    for (const e of c.effects ?? []) {
      const id = spellSlug(e.name);
      const es = EH[id] && sp(EH[id].sprite);
      if (es) auras.push({ key: `${c.id}:etki:${id}`, ownerId: c.id, radius: 0, sprite: es, ring: tokenScale(c) * EH[id]!.olcek });
    }
    for (const e of c.effects ?? []) {
      for (const a of [...(e.aura ? [e.aura] : []), ...(e.auras ?? [])]) {
        const type = a.effect.kind === 'damage' ? a.effect.type : undefined;
        const s = auraSprite(type, a.filter);
        if (s) auras.push({ key: `${c.id}:${e.id}:${a.id}`, ownerId: c.id, radius: a.radius, sprite: s });
      }
    }
  }
  const zones: SpellZone[] = state.map?.zones ?? [];
  const Z = (B as unknown as { zemin?: Record<string, string> }).zemin ?? {};
  for (const z of zones) {
    const zs = !z.surface && z.hexes.length ? sp(Z[z.spellId]) : null;
    if (zs) patches.push({ key: `zp:${z.id}`, at: centroid(z.hexes), radius: radiusOf(z.hexes.length), sprite: zs, hexes: z.hexes, loop: zs.loop, ...(KARO[zs.id] ? { karo: KARO[zs.id]! } : {}) });
    if (z.anchorId && z.radius !== undefined && state.combatants[z.anchorId]?.pos && !z.surface) {
      const s = auraSprite(z.spec?.damageType, undefined);
      if (s) auras.push({ key: `z:${z.id}`, ownerId: z.anchorId, radius: z.radius, sprite: s });
    }
    const D = B.duvar as Record<string, string>;
    const name = (z.barrier && D[z.barrier.kind]) || D[z.spellId];
    const s = sp(name);
    if (!s || !name || !z.hexes.length) continue;
    const outline = ((B as unknown as { kontur?: Record<string, string> }).kontur ?? {})[name];
    const soft = (B as unknown as { duvarYumusak?: Record<string, number> }).duvarYumusak?.[name];
    walls.push({ key: z.id, sprite: s, tint: (B.ton as Record<string, string>)[name], ...(outline ? { outline } : {}), ...(soft ? { soft } : {}), hexes: z.hexes.map((h) => ({ at: h, rotate: wallAngle(h, z.hexes) })) });
  }
  return { auras, walls, patches };
}

/** Duvar parçasının açısı: duvarın komşu altıgenine doğru (üç eksenden biri: dikey eksene göre 0°/60°/120°). */
export function wallAngle(h: Offset, all: Offset[]): number {
  const nb = all.filter((o) => (o.col !== h.col || o.row !== h.row) && Math.hypot(center(o).x - center(h).x, center(o).y - center(h).y) < 0.9);
  if (!nb.length) return 0;
  // Komşuların ortalama doğrultusu (180° katlı), üç eksenden en yakını: 90° (dikey), 30°, 150°.
  const deg = nb.map((o) => ((angleDeg(h, o) % 180) + 180) % 180);
  const AXES = [30, 90, 150];
  const score = (ax: number) => deg.reduce((s, d) => s + Math.min(Math.abs(d - ax), 180 - Math.abs(d - ax)), 0);
  return AXES.reduce((b, ax) => (score(ax) < score(b) ? ax : b), AXES[0]!);
}

/** Kuyruk E4b: su altıgeni ve dokusu (nehir/kıyı = dalga, göl/vaha/okyanus = havuz). */
export interface WaterHex { at: Offset; kind: 'dalga' | 'havuz' }
interface SuData { harf: string[]; nehirHarf: string[]; kiyiUzaklik: number; havuzHaritalari: string[]; denizHaritalari: string[]; sigHarf: string[]; sprite: Record<'dalga' | 'havuz', string>; opaklik: Record<'dalga' | 'havuz', number>; karoEn: number }
export const SU = (baglama as unknown as { su: SuData }).su;
const waterCache = new WeakMap<string[], WaterHex[]>();

/**
 * Savaş haritasının su altıgenleri ve türleri (yalnız görsel; zemin harfleri `tiles`'tan). Su arka plan resminde pişmiştir; bu
 * liste üstüne yarı saydam hareketli doku çizmek içindir. Tür: `R` harfi ya da kıyıya (suda olmayan altıgen) `kiyiUzaklik`
 * altıgen içindeki su dalga, daha açık su havuz; `havuzHaritalari` (göl, vaha, hendek) bütün suyu havuz yapar. Önbellekli
 * (zemin dizisi aynı kaldıkça; suyun kuruması ya da taşması `tiles`'ı değiştirir).
 */
export function waterHexes(state: Pick<BattleState, 'map'>): WaterHex[] {
  const m = state.map;
  if (!m?.tiles?.length) return [];
  const hit = waterCache.get(m.tiles);
  if (hit) return hit;
  const isWater = (ch: string | undefined): boolean => !!ch && SU.harf.includes(ch);
  const water: Array<{ at: Offset; ch: string }> = []; const land: Offset[] = [];
  m.tiles.forEach((line, row) => {
    for (let col = 0; col < line.length; col++) {
      const ch = line[col]!;
      if (isWater(ch)) water.push({ at: { col, row }, ch }); else land.push({ col, row });
    }
  });
  const id = (m as { id?: string }).id ?? '';
  const lake = SU.havuzHaritalari.includes(id);
  // Okyanus haritasında sığ su (n) kıyı sayılmaz: kıyı yalnız gerçek karadır.
  const shores = SU.denizHaritalari.includes(id) ? land.filter((l) => !SU.sigHarf.includes(m.tiles[l.row]![l.col]!)) : land;
  const out: WaterHex[] = water.map(({ at, ch }) => {
    if (lake) return { at, kind: 'havuz' as const };
    if (SU.nehirHarf.includes(ch)) return { at, kind: 'dalga' as const };
    // Kıyıya uzaklık: suda olmayan en yakın altıgen (haritanın kenarı kıyı sayılmaz).
    const shore = shores.some((l) => distance(at, l) <= SU.kiyiUzaklik);
    return { at, kind: shore ? 'dalga' as const : 'havuz' as const };
  });
  waterCache.set(m.tiles, out);
  return out;
}

/** Bütçe isteği: anahtar, jeton (varsa) ve öncelik sırası (dizideki sıra). */
export interface FxReq { key: string; tokenId?: string }

/**
 * Animasyon bütçesi: istekler sırayla (öncelik dizideki sıra); ekranda en çok `screen`, jeton başına en çok `perToken`.
 * Ayar kapalı ya da hareketi azaltta hiçbiri animasyonlu değil (statik tek kare). Dönen küme animasyonlu anahtarlar.
 */
export function allocate(reqs: FxReq[], opts: { enabled: boolean; reduceMotion: boolean; screen?: number; perToken?: number; used?: number; tokenUsed?: ReadonlyMap<string, number> }): Set<string> {
  const out = new Set<string>();
  if (!opts.enabled || opts.reduceMotion) return out;
  let left = (opts.screen ?? SCREEN_BUDGET) - (opts.used ?? 0);
  const per = new Map(opts.tokenUsed ?? []);
  const cap = opts.perToken ?? TOKEN_BUDGET;
  for (const r of reqs) {
    if (left <= 0) break;
    if (r.tokenId) {
      const n = per.get(r.tokenId) ?? 0;
      if (n >= cap) continue;
      per.set(r.tokenId, n + 1);
    }
    out.add(r.key);
    left--;
  }
  return out;
}

/** Statik görünümde gösterilecek kare (ortadaki; tek kare). */
export const stillFrame = (s: Pick<FxSprite, 'frames'> & { still?: number }): number => Math.min(s.frames - 1, s.still ?? Math.floor(s.frames / 2));
