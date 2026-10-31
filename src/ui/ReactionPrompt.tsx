/**
 * Tepki istemi (Görev R1): motor oyuncu karakterinin tepkisini soruyor. Tetik (kim, ne), seçenekler (tepki; hedef ya
 * da slot seçimi varsa her biri ayrı düğme) ve "Kullanma". Önerilen (yapay zekânın seçeceği) seçenek vurgulanır.
 * Sırası olmayan oyuncunun tepkisi de buradan sorulur (tek ekran).
 */
import { useEffect, useRef } from 'react';
import type { BattleState } from '../battle';
import type { ReactionAnswer, ReactionRequest } from '../rules/reactionChoice';
import { t } from '../i18n';

/** İstemin başlığı ve tetik satırı (saf; testlerde de kullanılır). */
export function reactionAskText(req: ReactionRequest, state: BattleState): { title: string; line: string } {
  const R = t().reactions;
  const n = (id?: string) => (id ? state.combatants[id]?.name ?? id : '');
  const i = req.info ?? {};
  const T = R.trigger as unknown as Record<string, (...a: Array<string | number>) => string>;
  const line = req.trigger === 'hit' ? T.hit?.(n(req.sourceId), i.label ?? '', i.total ?? 0, i.ac ?? 0, i.damage ?? 0)
    : req.trigger === 'targeted' ? T.targeted?.(n(req.sourceId), i.label ?? '')
      : req.trigger === 'cast' ? T.cast?.(n(req.sourceId), i.spell ?? '', i.level ?? 0)
        : req.trigger === 'fall' ? T.fall?.(n(req.sourceId), i.feet ?? 0)
          : T[req.trigger]?.(n(req.sourceId));
  return { title: R.title(n(req.reactorId)), line: line ?? '' };
}

/** Düğmeler: seçimsiz seçenek bir düğme, seçimli seçenekte her seçim bir düğme (slot seviyesi ya da hedef adı). */
export function reactionButtons(req: ReactionRequest): Array<{ key: string; label: string; answer: ReactionAnswer; suggested: boolean }> {
  const R = t().reactions;
  const same = (a: ReactionAnswer) => !!req.suggested && !!a && a.option === req.suggested.option && a.choice === req.suggested.choice;
  return req.options.flatMap((o) => (o.choices?.length
    ? o.choices.map((c) => {
      const answer = { option: o.id, choice: c.id };
      const label = /^\d+$/.test(c.id) && c.label === c.id ? `${o.name} — ${R.slot(Number(c.id))}`
        : `${o.name} — ${c.label === c.id && R.choice[c.id] ? R.choice[c.id] : c.label}`;
      return { key: `${o.id}:${c.id}`, label, answer, suggested: same(answer) };
    })
    : [{ key: o.id, label: o.name, answer: { option: o.id }, suggested: same({ option: o.id }) }]));
}

export function ReactionPrompt(props: { request: ReactionRequest; state: BattleState; onAnswer: (a: ReactionAnswer) => void }) {
  const R = t().reactions;
  const text = reactionAskText(props.request, props.state);
  const first = useRef<HTMLButtonElement>(null);
  // Her istek ayrı bir bileşen (çağıran `key` verir); açılınca ilk düğmeye odaklanır.
  useEffect(() => { first.current?.focus(); }, []);
  const buttons = reactionButtons(props.request);
  return (
    <div className="dice-prompt-backdrop">
      <div className="dice-prompt reaction-prompt" role="dialog" aria-modal="true" aria-label={text.title}>
        <strong>{text.title}</strong>
        <small>{text.line}</small>
        <div className="dice-actions reaction-actions">
          {buttons.map((b, i) => (
            <button key={b.key} ref={i === 0 ? first : undefined} type="button" className={b.suggested ? 'cta' : undefined}
              onClick={() => props.onAnswer(b.answer)}>
              {b.label}{b.suggested ? ` (${R.suggested})` : ''}
            </button>
          ))}
          <button type="button" className="ghost" onClick={() => props.onAnswer(null)}>{R.no}</button>
        </div>
      </div>
    </div>
  );
}
