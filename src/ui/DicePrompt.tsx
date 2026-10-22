/**
 * Fiziksel zar istemi (Görev J): oyun bir zar grubu bekliyor. "Saldırı: 1 adet d20 at (+5)", avantajda iki d20,
 * kritikte iki kat hasar zarı. Her alan 1..yüz sayısı arasında tam sayı olmalı; "Otomatik at" her istekte var.
 */
import { useEffect, useRef, useState } from 'react';
import type { DiceRequest } from '../rules/dice';
import { parseDiceInput } from '../rules/manualDice';
import { t } from '../i18n';

/** İstemin başlığı ve açıklaması (saf; testlerde de kullanılır). */
export function diceAskText(req: DiceRequest, whoName: string | null): { title: string; lines: string[] } {
  const D = t().dice;
  const kind = D.kind[req.kind ?? 'other'] ?? D.kind.other ?? '';
  const lines = [whoName ? D.who(whoName) : D.environment];
  if (req.mode === 'advantage') lines.push(D.advantage);
  if (req.mode === 'disadvantage') lines.push(D.disadvantage);
  if (req.critical) lines.push(D.critical);
  lines.push(D.enter(req.count, req.sides));
  return { title: D.ask(kind, req.count, req.sides, req.bonus ?? 0), lines };
}

export function DicePrompt(props: {
  request: DiceRequest; whoName: string | null;
  onEnter: (values: number[]) => void; onAuto: () => void; onCancel: () => void;
}) {
  const { request: req } = props;
  const D = t().dice;
  const [texts, setTexts] = useState<string[]>(() => Array.from({ length: req.count }, () => ''));
  const [bad, setBad] = useState<number[]>([]);
  const first = useRef<HTMLInputElement>(null);
  // Her istek ayrı bir bileşen (çağıran `key` verir); açılınca ilk alana odaklanır.
  useEffect(() => { first.current?.focus(); }, []);
  const text = diceAskText(req, props.whoName);
  const submit = () => {
    const r = parseDiceInput(texts, req);
    if (r.ok) props.onEnter(r.values); else setBad(r.bad);
  };
  return (
    <div className="dice-prompt-backdrop">
      <form className="dice-prompt" noValidate role="dialog" aria-modal="true" aria-label={D.title}
        onSubmit={(e: { preventDefault: () => void }) => { e.preventDefault(); submit(); }}>
        <strong>{text.title}</strong>
        {text.lines.map((l) => <small key={l}>{l}</small>)}
        <div className="dice-inputs">
          {texts.map((v, i) => (
            <label key={i} className={bad.includes(i) ? 'bad' : undefined}>
              <span>{D.die(i + 1, req.sides)}</span>
              <input ref={i === 0 ? first : undefined} type="number" inputMode="numeric" min={1} max={req.sides} step={1} value={v}
                aria-invalid={bad.includes(i)} aria-label={D.die(i + 1, req.sides)}
                onChange={(e: { target: { value: string } }) => {
                  const next = [...texts]; next[i] = e.target.value; setTexts(next); setBad((b) => b.filter((x) => x !== i));
                }} />
            </label>
          ))}
        </div>
        {bad.length > 0 && <p className="error" role="alert">{D.invalid(req.sides)}</p>}
        <div className="dice-actions">
          <button type="submit" className="cta">{D.ok}</button>
          <button type="button" onClick={props.onAuto}>{D.auto}</button>
          <button type="button" className="ghost" onClick={props.onCancel}>{D.cancel}</button>
        </div>
      </form>
    </div>
  );
}
