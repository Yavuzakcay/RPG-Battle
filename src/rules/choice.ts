/**
 * Kuyruk S1: seçim istemi ("NeedChoice"). Büyünün yapanına sorduğu tek seçim (sıçrama hedefi, dönüş altıgeni, yeni
 * hedef): tepki kararıyla aynı yoldan (`askReaction`, tetik `choice`); arayüz oyuncuya sorar (`NeedReaction` →
 * `ReactionPrompt`), kararı zar defterine yazar ve adım aynı zarlarla yeniden çalışır. Kancasız Rng'de (simülasyon,
 * testler) ve yapay zekânın yaratığında öneri (`suggested`). Seçim olaylara yazılır; replay aynı sonucu verir. Saf.
 */
import type { Rng } from './dice';
import { askReaction } from './reactionChoice';

export interface ChoiceRequest {
  /** Seçimi yapacak yaratık (büyüyü yapan, saldıran). */
  actorId: string;
  /** Neyin seçildiği (gösterim: "Chromatic Orb: sıçrama hedefi"). */
  label: string;
  sourceId?: string;
  options: Array<{ id: string; label: string }>;
  /** Önerilen seçim (yapay zekâ); null: seçmemek (ör. sıçramamak) önerilir. */
  suggested: string | null;
}

/** Seçim kimliği ya da null (seçilmedi; çağıran varsayılanı uygular). Seçenek yoksa sormaz. */
export function askChoice(rng: Rng, req: ChoiceRequest): string | null {
  if (!req.options.length) return null;
  const a = askReaction(rng, {
    reactorId: req.actorId, trigger: 'choice', sourceId: req.sourceId, info: { label: req.label },
    options: [{ id: 'choice', name: req.label, choices: req.options }],
    suggested: req.suggested ? { option: 'choice', choice: req.suggested } : null,
  });
  return a?.choice ?? null;
}

/**
 * Görev KARAR104 (A5): sıralı çoklu seçim ("seçtiğin yaratıklar"): her adımda kalan adaylardan biri sorulur, öneri `suggested`
 * sırasındaki sıradaki aday (bugünkü otomatik seçim); oyuncu "Seçme" derse ya da `max`'a ulaşılınca biter. Kancasız Rng'de,
 * "Her zaman"/"Asla" ayarında ve yapay zekâda sonuç önerinin aynısı (`suggested.slice(0, max)`).
 */
export function askPicks(rng: Rng, req: { actorId: string; label: string; sourceId?: string; options: Array<{ id: string; label: string }>; suggested: string[]; max: number }): string[] {
  const picked: string[] = [];
  while (picked.length < req.max) {
    const left = req.options.filter((o) => !picked.includes(o.id));
    if (!left.length) break;
    const next = req.suggested.find((id) => !picked.includes(id) && left.some((o) => o.id === id)) ?? null;
    const id = askChoice(rng, { actorId: req.actorId, label: `${req.label} (${picked.length + 1}/${req.max})`, ...(req.sourceId ? { sourceId: req.sourceId } : {}), options: left, suggested: next });
    if (!id || !left.some((o) => o.id === id)) break;
    picked.push(id);
  }
  return picked;
}
