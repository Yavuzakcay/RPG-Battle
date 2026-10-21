/**
 * Tur başı/sonu durum ve zemin hasarı animasyonu (yalnızca arayüz). Olay günlüğündeki yeni olaylardan
 * hangi jetonun ne kadar ve hangi türde hasar aldığını çıkarır; motor mantığına dokunmaz.
 * Kaynaklar: `map_effect` hasarı (Burning, lav kenarı, batak zehri, alev, sıcak, soğuk…) ve
 * yayılım save'i (`save_resolved` + `aura`, Spirit Guardians).
 */
import type { BattleEvent, Combatant } from '../battle/types';
import spriteData from '../../data/efekt-sprites.json';

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

/** Süren durumların jetondaki kalıcı simgeleri (yanıyor, zehirli, donmuş, yakalandı, yerde). */
export function statusIcons(c: Pick<Combatant, 'conditions' | 'mapStatus'>): Array<{ key: string; icon: string; title: string }> {
  const out: Array<{ key: string; icon: string; title: string }> = [];
  if (c.conditions.includes('Burning')) out.push({ key: 'burning', icon: '🔥', title: 'Yanıyor' });
  if (c.conditions.includes('Poisoned') || c.mapStatus.lingeringPoison) out.push({ key: 'poison', icon: '☠', title: 'Zehirli' });
  if (c.conditions.includes('Frozen')) out.push({ key: 'frozen', icon: '❄', title: 'Donmuş' });
  if (c.conditions.includes('Grappled')) out.push({ key: 'grappled', icon: '✊', title: 'Yakalandı (Grappled)' });
  if (c.conditions.includes('Prone')) out.push({ key: 'prone', icon: '⤵', title: 'Yerde (Prone)' });
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
  const mark = (targetId: string, ok: boolean, what: string) => out.push({ targetId, ok, text: `${ok ? '✔' : '✖'} ${what}` });
  for (const e of events) {
    if (e.type === 'attack_resolved' && e.d20.length > 0) mark(e.targetId, e.hit, e.critical ? 'Kritik' : e.hit ? 'İsabet' : 'Iska');
    if (e.type === 'save_resolved' && e.d20.length > 0) mark(e.targetId, e.success, e.success ? 'Kurtardı' : 'Kurtaramadı');
    if (e.type === 'condition_save') mark(e.targetId, e.success, e.success ? 'Kurtardı' : 'Kurtaramadı');
    if (e.type === 'shove_resolved') mark(e.targetId, e.success, e.success ? 'Direndi' : e.effect === 'prone' ? 'Yere düştü' : 'İtildi');
    if (e.type === 'grapple_escape') mark(e.actorId, e.success, e.success ? 'Kurtuldu' : 'Kurtulamadı');
    if (e.type === 'skill_checked') mark(e.actorId, e.success, e.success ? 'Başarılı' : 'Başarısız');
    if (e.type === 'jump_check') mark(e.actorId, e.outcome === 'safe', e.outcome === 'safe' ? 'Atladı' : e.outcome === 'burned' ? 'Yandı' : 'Düştü');
  }
  return out;
}

/**
 * Hasar efekti sprite'ları (Görev D ek; `npm run efektler` → data/efekt-sprites.json, public/efektler/*.webp):
 * fire → burn, poison → poison, cold → freeze, acid → acid, kanama (Infernal Wound) → bleed. Yatay şerit,
 * `frames` kare, kare başına `frameMs`, tek sefer.
 */
export interface EffectSprite { id: string; file: string; frames: number; size: number; frameMs: number }
interface SpriteEntry { file: string; frames: number; size: number; damageTypes: string[]; conditions?: string[] }
const SPRITES = (spriteData as { frameMs: number; effects: Record<string, SpriteEntry> });
export const EFFECT_SPRITES: EffectSprite[] = Object.entries(SPRITES.effects)
  .map(([id, e]) => ({ id, file: e.file, frames: e.frames, size: e.size, frameMs: SPRITES.frameMs }));

/** Bu hasarın sprite'ı (yoksa null: emoji/CSS animasyonu). Önce durum (kanama), sonra hasar türü. */
export function spriteFor(hit: Pick<DamageHit, 'damageType' | 'condition'>): EffectSprite | null {
  const pick = Object.entries(SPRITES.effects).find(([, e]) => hit.condition !== undefined && (e.conditions ?? []).includes(hit.condition))
    ?? Object.entries(SPRITES.effects).find(([, e]) => hit.damageType !== undefined && e.damageTypes.includes(hit.damageType));
  return pick ? (EFFECT_SPRITES.find((s) => s.id === pick[0]) ?? null) : null;
}
