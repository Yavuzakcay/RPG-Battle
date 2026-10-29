/**
 * Savaş sonu görsel efekti (Görev U; tembel parça): zaferde altın parıltı ve konfeti, yenilgide kızıl karartma.
 * Yalnızca CSS dönüşüm ve saydamlık animasyonu (GPU), tıklamayı yutmaz, kendiliğinden kaybolur; hareket azaltmada
 * yalnızca hafif renk geçişi.
 */
import { useEffect, useState } from 'react';

export const END_FX_MS = 3600;
const PIECES = 26;
const COLORS = ['#ffd400', '#ffef8a', '#ff9f1c', '#7ad3ff', '#ffffff'];

export default function EndFx({ outcome }: { outcome: 'victory' | 'defeat' }) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setOn(false), END_FX_MS);
    return () => window.clearTimeout(id);
  }, []);
  if (!on) return null;
  return (
    <div className={`end-fx ${outcome}`} aria-hidden="true" data-testid="end-fx">
      <div className="end-fx-glow" />
      {outcome === 'victory' && Array.from({ length: PIECES }, (_, i) => (
        <span key={i} className="end-fx-bit" style={{
          left: `${(i * 37) % 100}%`, background: COLORS[i % COLORS.length],
          animationDelay: `${(i % 9) * 0.11}s`, '--drift': `${((i * 53) % 120) - 60}px`, '--spin': `${(i % 2 ? 1 : -1) * (240 + (i % 5) * 90)}deg`,
        } as React.CSSProperties} />
      ))}
    </div>
  );
}
