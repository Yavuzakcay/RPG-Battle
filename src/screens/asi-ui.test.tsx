/**
 * Seviye artışı (Görev M4, K4; sunucuda çizilen HTML): puan dağıtımı İlerleme adımında, her ASI yuvasının kendi kartında
 * kalan puan göstergesiyle (+2 bir skora ya da +1 iki skora, 20 sınırı). Puanlar adımında seviye artışı yok.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Builder } from './Builder';
import { blankCharacter, withSkills } from '../rules/builder';
import type { Advancement } from '../rules/advancement';
import type { BuilderStep } from '../rules/builder';

function html(level: number, advancements: Advancement[] = [], step: BuilderStep = 'progress') {
  const c = blankCharacter('f1');
  const ch = withSkills({ ...c, classSkills: ['athletics', 'perception'], sheet: { ...c.sheet, name: 'Bor', classId: 'fighter', level, armorName: 'Chain Mail', advancements } });
  return renderToStaticMarkup(<Builder initial={ch} onSave={() => {}} onCancel={() => {}} step={step} />);
}
/** aria-label'ı verilen düğme pasif mi (yoksa null). */
const disabled = (m: string, label: string): boolean | null => {
  const b = new RegExp(`<button[^>]*aria-label="${label.replace(/[()+.]/g, '\\$&')}"[^>]*>`).exec(m)?.[0];
  return b === undefined ? null : /disabled/.test(b);
};
const ASI = 'ability-score-improvement';

describe('ASI dağıtımı İlerleme adımında (yuva başına kart)', () => {
  it('ASI yuvası yoksa kart yok; Puanlar adımında seviye artışı sayacı yok', () => {
    expect(html(3)).not.toContain('asi-card');
    expect(html(8, [], 'scores')).not.toContain('seviye: Güç (STR) +1');
    expect(html(8, [], 'scores')).not.toContain('asi-card');
  });
  it('her yuva kendi kartında 2 puanla: 8. seviyede üç kart (4, 6, 8)', () => {
    const m = html(8);
    expect((m.match(/class="asi-card"/g) ?? []).length).toBe(3);
    expect((m.match(/Kalan puan: 2 \/ 2/g) ?? []).length).toBe(3);
    expect(disabled(m, '4. seviye: Güç (STR) +1')).toBe(false);
    expect(disabled(m, '4. seviye: Güç (STR) artışını geri al')).toBe(true);
  });
  it('+2 verilen yuvada puan biter: + kapalı, − açık; önce → sonra skoru görünür', () => {
    const m = html(4, [{ level: 4, featId: ASI, abilities: { str: 2 } }]);
    expect(m).toContain('Kalan puan: 0 / 2');
    expect(disabled(m, '4. seviye: Çeviklik (DEX) +1')).toBe(true);
    expect(disabled(m, '4. seviye: Güç (STR) artışını geri al')).toBe(false);
    expect(m).toMatch(/15 → <b class="asi-final">17<\/b>/);
  });
  it('20 sınırı: 20 olan skora + kapalı (önceki yuvanın artışı sayılır)', () => {
    const c = blankCharacter('f2');
    const ch = withSkills({ ...c, classSkills: ['athletics', 'perception'], sheet: { ...c.sheet, name: 'Bor', classId: 'fighter', level: 6, armorName: 'Chain Mail',
      backgroundBonuses: { str: 2, con: 1 }, advancements: [{ level: 4, featId: ASI, abilities: { str: 2 } }, { level: 6, featId: ASI, abilities: { str: 1 } }] } });
    const m = renderToStaticMarkup(<Builder initial={ch} onSave={() => {}} onCancel={() => {}} step="progress" />);
    // 15 + 2 (geçmiş) + 2 (4. sv) = 19; 6. seviyede +1 → 20, bir daha olmaz.
    expect(disabled(m, '6. seviye: Güç (STR) +1')).toBe(true);
    expect(disabled(m, '6. seviye: Çeviklik (DEX) +1')).toBe(false);
  });
  it('feat seçilen yuvada puan kartı yok', () => {
    const m = html(4, [{ level: 4, featId: 'grappler', abilities: { str: 1 } }]);
    expect(m).not.toContain('asi-card');
  });
});
