/** SD12: Alignment başlangıç karesi seçici: önerilen etiketli ve seçili gelir; yalnız-otomatik açıkken kilitli. */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AlignmentPicker } from './Builder';

describe('SD12 kare seçici', () => {
  const rec = { d: 'pos', g: 'pos' } as const;
  it('9 kare; önerilen "Önerilen" etiketli ve seçili', () => {
    const html = renderToStaticMarkup(<AlignmentPicker rec={rec} sel={rec} locked={false} onPick={() => {}} />);
    expect((html.match(/data-kare=/g) ?? []).length).toBe(9);
    expect(html).toContain('True Neutral');
    expect(html).toContain('Önerilen');
    expect(html).toMatch(/data-kare="pos-pos"[^>]*>|aria-checked="true"[^>]*data-kare="pos-pos"/);
    expect(html).not.toContain('disabled');
  });
  it('yalnız otomatik açıkken (locked) seçili olmayan kareler kilitli', () => {
    const html = renderToStaticMarkup(<AlignmentPicker rec={rec} sel={rec} locked onPick={() => {}} />);
    expect((html.match(/disabled/g) ?? []).length).toBe(8);
  });
});
