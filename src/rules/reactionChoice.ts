/**
 * Tepki kararları (Görev R1). Arayüzden bağımsız, yan etkisiz.
 *
 * Motor bir tetik oluşunca (isabet, erişimden çıkma, büyü yapılması, hasar, düşme) tepki hakkı olan yaratık için
 * bir istek (`ReactionRequest`) kurar ve `askReaction(rng, istek)` ile karar ister. Kararı Rng'ye iliştirilmiş kanca
 * verir (zar kancasıyla aynı yol, `dice.ts`): arayüzün kaydedici Rng'si kararı defterden okur, yoksa oyuncuya sorar
 * (`NeedReaction`, `manualDice.ts`) ya da politikaya göre verir. Kancasız Rng'de (simülasyon, testler) motorun
 * kural tabanlı önerisi (`suggested`, yapay zekâ kararı) kullanılır. Karar olaylara yazılır; replay aynı sonucu verir.
 */
import type { Rng } from './dice';

/** Seçilebilecek tepki: kimlik (SRD kimliği ya da `opportunity-attack`), ad ve gerekiyorsa hedef/seçim listesi. */
export interface ReactionOption {
  /** Tepkinin kimliği: `opportunity-attack`, `spells:shield`, `monk:deflect-attacks`, `knight:parry`… */
  id: string;
  /** Görünen ad (SRD adı: Shield, Deflect Attacks, Parry). */
  name: string;
  /** Seçim (hedef, slot seviyesi); yoksa yalnızca Evet/Hayır. */
  choices?: Array<{ id: string; label: string }>;
}

/** Tetik türü: isabet, hedef alınma, erişimden çıkma, büyü yapılması, hasar, düşme, geri yöneltme, tur başı. */
export type ReactionTrigger = 'hit' | 'targeted' | 'leave' | 'cast' | 'damaged' | 'fall' | 'redirect' | 'turnStart';

export interface ReactionRequest {
  /** Tepkiyi verecek yaratık. */
  reactorId: string;
  trigger: ReactionTrigger;
  /** Tetikleyen yaratık (saldıran, uzaklaşan, büyü yapan). */
  sourceId?: string;
  /** Tetiğin ayrıntısı (gösterim için): saldırı adı, toplam, AC, hasar, büyü adı, düşme yüksekliği. */
  info?: { label?: string; total?: number; ac?: number; damage?: number; feet?: number; spell?: string; level?: number };
  options: ReactionOption[];
  /** Kural tabanlı öneri (yapay zekâ): kullanılmazsa null. */
  suggested: ReactionAnswer;
}

/** Karar: seçilen tepki (ve seçim) ya da null (kullanma). */
export type ReactionAnswer = { option: string; choice?: string } | null;

export type ReactHook = (req: ReactionRequest) => ReactionAnswer;
type ReactRng = Rng & { react?: ReactHook };

export const reactHookOf = (rng: Rng): ReactHook | undefined => (rng as ReactRng).react;

/** Karar ister: kanca varsa ona, yoksa önerilen. Yanıt seçeneklerden biri değilse null sayılır. */
export function askReaction(rng: Rng, req: ReactionRequest): ReactionAnswer {
  const hook = reactHookOf(rng);
  const answer = hook ? hook(req) : req.suggested;
  return validAnswer(req, answer) ? answer : null;
}

/** Yanıt istekteki bir seçeneğe (ve varsa seçimine) uyuyor mu. */
export function validAnswer(req: ReactionRequest, answer: ReactionAnswer): boolean {
  if (!answer) return true;
  const o = req.options.find((x) => x.id === answer.option);
  if (!o) return false;
  if (!o.choices?.length) return answer.choice === undefined;
  return o.choices.some((c) => c.id === answer.choice);
}

/** "Her zaman kullan": öneri varsa o, yoksa ilk seçenek (ilk seçimiyle). */
export function alwaysAnswer(req: ReactionRequest): ReactionAnswer {
  if (req.suggested) return req.suggested;
  const o = req.options[0];
  if (!o) return null;
  const c = o.choices?.[0];
  return c ? { option: o.id, choice: c.id } : { option: o.id };
}

/** Tepki politikası: oyuncu karakterine sor / her zaman / asla; yapay zekâ ve Game Master'ın düşmanları için `ai`. */
export type ReactionPolicy = 'ask' | 'always' | 'never' | 'ai';
export const PLAYER_POLICIES: readonly ReactionPolicy[] = ['ask', 'always', 'never'];
export const ENEMY_POLICIES: readonly ReactionPolicy[] = ['ai', 'always', 'never'];

/** Politikaya göre karar; `ask` için `'ask'` döner (arayüz oyuncuya sorar). */
export function decideBy(policy: ReactionPolicy, req: ReactionRequest): ReactionAnswer | 'ask' {
  if (policy === 'ask') return 'ask';
  if (policy === 'never') return null;
  if (policy === 'always') return alwaysAnswer(req);
  return req.suggested;
}
