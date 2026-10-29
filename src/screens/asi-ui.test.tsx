/** Oluşturucuda seviye artışı sayacı (Görev M4; sunucuda çizilen HTML): tek havuz, + / − durumu, rozet, feat geçişi. */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Builder } from './Builder';
import { blankCharacter, withSkills } from '../rules/builder';
import type { Advancement } from '../rules/advancement';

function html(level: number, advancements: Advancement[] = []) {
  const c = blankCharacter('f1');
  const ch = withSkills({ ...c, classSkills: ['athletics', 'perception'], sheet: { ...c.sheet, name: 'Bor', classId: 'fighter', level, armorName: 'Chain Mail', advancements } });
  return renderToStaticMarkup(<Builder initial={ch} onSave={() => {}} onCancel={() => {}} step="scores" />);
}
/** aria-label'ı verilen düğme pasif mi (yoksa null). */
const disabled = (m: string, label: string): boolean | null => {
  const b = new RegExp(`<button[^>]*aria-label="${label.replace(/[()+.]/g, '\\$&')}"[^>]*>`).exec(m)?.[0];
  return b === undefined ? null : /disabled/.test(b);
};
const ASI = 'ability-score-improvement';

describe('ASI sayacı arayüzü (tek havuz)', () => {
  it('ASI yuvası yoksa sayaç yok', () => {
    expect(html(3)).not.toContain('Seviye artışı puanı');
  });
  it('seviye arttıkça puan havuza eklenir: 4. seviye 2, 8. seviye 6 (4, 6, 8); yuva sekmesi yok', () => {
    expect(html(4)).toContain('Kalan: 2');
    const m = html(8);
    expect(m).toContain('Kalan: 6');
    expect(m).not.toContain('>4. sv<');
    expect(disabled(m, 'Güç (STR): seviye artışı +1')).toBe(false);
    expect(disabled(m, 'Güç (STR): seviye artışını geri al')).toBe(true);
    expect(m).not.toContain('aria-label="Yetenek seç"');
  });
  it('puan bitince + kapalı, − açık; skor farkı ve rozet görünür', () => {
    const m = html(4, [{ level: 4, featId: ASI, abilities: { str: 2 } }]);
    expect(m).toContain('Kalan: 0');
    expect(disabled(m, 'Çeviklik (DEX): seviye artışı +1')).toBe(true);
    expect(disabled(m, 'Güç (STR): seviye artışını geri al')).toBe(false);
    expect(m).toMatch(/→ <b class="asi-final">\d+<\/b> <span class="asi-badge">\+2<\/span>/);
  });
  it('feat seçilen yuva havuzdan düşer; feat\'in kendi +1\'i rozetle görünür', () => {
    const m = html(6, [{ level: 4, featId: 'grappler', abilities: { str: 1 } }]);
    expect(m).toContain('Kalan: 2');
    expect(m).toMatch(/<span class="asi-badge">\+1<\/span>/);
    expect(html(4, [{ level: 4, featId: 'grappler', abilities: { str: 1 } }])).toContain('Bütün yuvalarda feat seçili');
  });
});
