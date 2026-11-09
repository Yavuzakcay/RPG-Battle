/**
 * Tur başı/sonu durum ve zemin hasarı animasyonu (yalnızca arayüz). Olay günlüğündeki yeni olaylardan
 * hangi jetonun ne kadar ve hangi türde hasar aldığını çıkarır; motor mantığına dokunmaz.
 * Kaynaklar: `map_effect` hasarı (Burning, lav kenarı, batak zehri, alev, sıcak, soğuk…) ve
 * yayılım save'i (`save_resolved` + `aura`, Spirit Guardians).
 */
import type { BattleEvent, Combatant } from '../battle/types';
import spriteData from '../../data/efekt-sprites.json';
import spriteMap from '../../data/sprite-esleme.json';
import baglama from '../../data/efekt-baglama.json';
import { t } from '../i18n';
import { hovers } from '../battle/flight';

export type FloatKind = 'fire' | 'poison' | 'cold' | 'acid' | 'hit';

export const kindOf = (damageType: string): FloatKind =>
  damageType === 'fire' ? 'fire' : damageType === 'poison' ? 'poison' : damageType === 'cold' ? 'cold' : damageType === 'acid' ? 'acid' : 'hit';

export const FLOAT_ICON: Record<FloatKind, string> = { fire: '🔥', poison: '☠', cold: '❄', acid: '💧', hit: '' };

export interface DamageHit {
  targetId: string; amount: number; kind: FloatKind;
  /** Hasar türü (sprite seçimi) ve süreli durum hasarıysa durumun adı (Infernal Wound → kanama). */
  damageType?: string; condition?: string;
}

/** Olaylardaki durum/zemin hasarları, sırasıyla. */
export function damageHits(events: BattleEvent[]): DamageHit[] {
  const out: DamageHit[] = [];
  for (const e of events) {
    if (e.type === 'map_effect' && e.damage && e.damage.applied > 0) {
      // Süreli durum hasarı (`dotEvents`): metin "<kaynak>: <durum>".
      const condition = e.rule === 'condition' ? e.text.split(': ').pop() : undefined;
      out.push({ targetId: e.targetId, amount: e.damage.applied, kind: kindOf(e.damage.type), damageType: e.damage.type, ...(condition ? { condition } : {}) });
    }
    if (e.type === 'mastery_applied' && e.damage && e.damage.applied > 0) {
      out.push({ targetId: e.targetId, amount: e.damage.applied, kind: kindOf(e.damage.type), damageType: e.damage.type });
    }
    if (e.type === 'save_resolved' && e.aura && e.appliedDamage > 0) {
      out.push({ targetId: e.targetId, amount: e.appliedDamage, kind: kindOf(e.damageType), damageType: e.damageType });
    }
  }
  return out;
}

/** Aynı anda birden çok hasar: üst üste binmesin diye sırayla gecikme (ms). */
export const FLOAT_STAGGER_MS = 220;
export const FLOAT_MS = 950;
/** Eylem sonucu işaretinin süresi (ms). */
export const OUTCOME_MS = 1050;

/**
 * Görev E1: durum ikonu görselleri (`npm run sprite-ice -- --efekt` → data/sprite-esleme.json `efektIkonlari`, 128 px).
 * Rozet anahtarı → ikon sayfasındaki durum; ikonu olmayan rozet emoji kalır.
 */
const ICONS = (spriteMap as unknown as { efektIkonlari?: Record<string, string> }).efektIkonlari ?? {};
const ICON_OF: Record<string, string> = { poison: 'poisoned', exhaustion: 'exhaustion', grappled: 'grappled', restrained: 'restrained', charmed: 'charmed',
  frightened: 'frightened', prone: 'prone', invisible: 'invisible', paralyzed: 'paralyzed', stunned: 'stunned', incapacitated: 'incapacitated', deafened: 'deafened' };
export interface StatusIcon { key: string; icon: string; title: string; img?: string; count?: number }

/** Süren durumların jetondaki kalıcı simgeleri (yanıyor, zehirli, donmuş, yakalandı, yerde). */
export function statusIcons(c: Pick<Combatant, 'conditions' | 'mapStatus'> & Partial<Pick<Combatant, 'exhaustion' | 'effects'>>): StatusIcon[] {
  const out = statusBadges(c);
  return out.map((s) => {
    const name = ICONS[ICON_OF[s.key] ?? ''];
    return name ? { ...s, img: `sprites/${name}.webp`, ...(s.key === 'exhaustion' ? { count: c.exhaustion ?? 0 } : {}) } : s;
  });
}

/** Kuyruk E2: süren büyü etkisinin (etki adı ya da buff kaynağı) sayı oku simgesi (data/efekt-baglama.json `rozetBuyu` → data/efekt-e2.json `simgeler.ok`). */
const ROZET_BUYU = (baglama as unknown as { rozetBuyu?: Record<string, string> }).rozetBuyu ?? {};
/** Simge yolu ad kuralından (efekt-kesim `sayi-oklari`: klasör efekt, önek ok); dosyanın varlığını fxPlan.e2.test denetler. */
const okSimge = (ad: string): string => `efekt/efekt-ok-${ad}`;
const slugOf = (label: string): string => label.split(/ \(|: /)[0]!.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export function spellBadgeImg(name: string): string | undefined {
  const ad = ROZET_BUYU[slugOf(name)];
  return ad ? `${okSimge(ad)}.webp` : undefined;
}

function statusBadges(c: Pick<Combatant, 'conditions' | 'mapStatus'> & Partial<Pick<Combatant, 'exhaustion' | 'effects'>>): StatusIcon[] {
  const out: StatusIcon[] = [];
  const S = t().view.status;
  if (c.conditions.includes('Burning')) out.push({ key: 'burning', icon: '🔥', title: S.burning });
  if (c.conditions.includes('Poisoned') || c.mapStatus.lingeringPoison) out.push({ key: 'poison', icon: '☠', title: S.poison });
  if (c.conditions.includes('Frozen')) out.push({ key: 'frozen', icon: '❄', title: S.frozen });
  if (c.conditions.includes('Infernal Wound')) out.push({ key: 'bleeding', icon: '🩸', title: S.bleeding });
  if (c.conditions.includes('Grappled')) out.push({ key: 'grappled', icon: '✊', title: S.grappled });
  if (c.conditions.includes('Restrained')) out.push({ key: 'restrained', icon: '🕸', title: S.restrained });
  if (c.conditions.includes('Charmed')) out.push({ key: 'charmed', icon: '💞', title: S.charmed });
  if (c.conditions.includes('Frightened')) out.push({ key: 'frightened', icon: '😱', title: S.frightened });
  if (c.conditions.includes('Prone')) out.push({ key: 'prone', icon: '⤵', title: S.prone });
  // Görev S1: bitkinlik seviyesi, büyüyle uçuş (kendi uçuş hızı olan yaratıkta rozet yok) ve görünmezlik.
  if ((c.exhaustion ?? 0) > 0) out.push({ key: 'exhaustion', icon: `😩${c.exhaustion}`, title: S.exhaustion(c.exhaustion ?? 0) });
  // Kuyruk U1a: süzülen (yere değmez) ayrı simgeyle.
  if (hovers(c)) out.push({ key: 'flying', icon: '〰', title: S.hovering });
  else if (c.effects?.some((e) => e.fly || e.airborne)) out.push({ key: 'flying', icon: '🪽', title: S.flying });
  if (c.conditions.includes('Invisible')) out.push({ key: 'invisible', icon: '👁', title: S.invisible });
  // Kuyruk K73c (sürüm 64+): yer altında (kazarak).
  if ((c as { burrowed?: true }).burrowed) out.push({ key: 'burrowed', icon: '⛏', title: S.burrowed });
  // Görev E1: Deafened rozetle (yalnızca görsel).
  if (c.conditions.includes('Deafened')) out.push({ key: 'deafened', icon: '🔇', title: S.deafened });
  // Kuyruk K48: Moral 0'da Çökmüş (belirgin simge; Incapacitated simgesinin yerine).
  const broken = c.effects?.some((e) => e.id === 'moral:cokmus');
  if (broken) out.push({ key: 'broken', icon: '💔', title: S.broken });
  // Etkisiz bırakan durumlar (Görev H): Paralyzed ve Stunned Incapacitated'ı içerir, yalnızca biri gösterilir.
  if (broken) { /* Çökmüş: Incapacitated simgesi yinelenmez */ } else if (c.conditions.includes('Paralyzed')) out.push({ key: 'paralyzed', icon: '⛓', title: S.paralyzed });
  else if (c.conditions.includes('Stunned')) out.push({ key: 'stunned', icon: '💫', title: S.stunned });
  else if (c.conditions.includes('Incapacitated')) out.push({ key: 'incapacitated', icon: '⊘', title: S.incapacitated });
  return out;
}

/**
 * Eylem sonucu işareti (Görev F): saldırı isabet/ıska, kurtarma zarı, kaçış, itme, beceri kontrolü.
 * `ok` zarın sonucudur (✔/✖): saldırı zarında isabet (hedefin üstünde), kurtarma zarında hedefin başarısı,
 * kaçış/beceri/atlama zarında yapanın başarısı.
 */
export interface OutcomeMark { targetId: string; ok: boolean; text: string }

export function outcomeMarks(events: BattleEvent[]): OutcomeMark[] {
  const out: OutcomeMark[] = [];
  const O = t().view.outcome;
  const mark = (targetId: string, ok: boolean, what: string) => out.push({ targetId, ok, text: `${ok ? '✔' : '✖'} ${what}` });
  for (const e of events) {
    if (e.type === 'attack_resolved' && e.d20.length > 0) mark(e.targetId, e.hit, e.critical ? O.crit : e.hit ? O.hit : O.miss);
    if (e.type === 'save_resolved' && e.d20.length > 0) mark(e.targetId, e.success, e.success ? O.saved : O.failed);
    if (e.type === 'condition_save') mark(e.targetId, e.success, e.success ? O.saved : O.failed);
    if (e.type === 'shove_resolved') mark(e.targetId, e.success, e.success ? O.resisted : e.effect === 'prone' ? O.prone : O.pushed);
    if (e.type === 'grapple_escape') mark(e.actorId, e.success, e.success ? O.escaped : O.stuck);
    if (e.type === 'skill_checked') mark(e.actorId, e.success, e.success ? O.success : O.failure);
    if (e.type === 'jump_check') mark(e.actorId, e.outcome === 'safe', e.outcome === 'safe' ? O.jumped : e.outcome === 'burned' ? O.burned : O.fell);
  }
  return out;
}

/**
 * Hasar efekti sprite'ları (Görev D ek; `npm run efektler` → data/efekt-sprites.json, public/efektler/*.webp):
 * fire → burn, poison → poison, cold → freeze, acid → acid, kanama (Infernal Wound) → bleed. Yatay şerit,
 * `frames` kare, kare başına `frameMs`, tek sefer.
 */
export interface EffectSprite { id: string; file: string; frames: number; size: number; frameMs: number }
interface SpriteEntry { file: string; frames: number; size: number; kind?: string; damageTypes: string[]; conditions?: string[] }
const ALL = (spriteData as { frameMs: number; effects: Record<string, SpriteEntry> });
// Yalnızca tek seferlik hasar efektleri (durum döngüleri ve engel `statusFx.ts`'te, gerekince yüklenir).
const SPRITES = { frameMs: ALL.frameMs, effects: Object.fromEntries(Object.entries(ALL.effects).filter(([, e]) => (e.kind ?? 'damage') === 'damage')) };
export const EFFECT_SPRITES: EffectSprite[] = Object.entries(SPRITES.effects)
  .map(([id, e]) => ({ id, file: e.file, frames: e.frames, size: e.size, frameMs: SPRITES.frameMs }));

/** Bu hasarın sprite'ı (yoksa null: emoji/CSS animasyonu). Önce durum (kanama), sonra hasar türü. */
export function spriteFor(hit: Pick<DamageHit, 'damageType' | 'condition'>): EffectSprite | null {
  const pick = Object.entries(SPRITES.effects).find(([, e]) => hit.condition !== undefined && (e.conditions ?? []).includes(hit.condition))
    ?? Object.entries(SPRITES.effects).find(([, e]) => hit.damageType !== undefined && e.damageTypes.includes(hit.damageType));
  return pick ? (EFFECT_SPRITES.find((s) => s.id === pick[0]) ?? null) : null;
}
