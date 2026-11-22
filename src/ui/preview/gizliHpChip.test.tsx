/**
 * Görev OD1B × K58: gizli düşman HP kipinde önizleme kartı (var olan davranış; davranış değişmedi). Gizli kipte hedefin
 * canını ele veren "düşürme olasılığı" çip'i yok; saldıranın beklenen hasar aralığı ve hasar türü çip'i (DamageChip) kalır.
 * Tam kipte düşürme olasılığı görünür. TR ve EN. 390×844 taşma: kartın satırları sarılır (`.pv-line` esnek), çip metni kısa.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { kitArena } from '../../battle/k54bKit';
import { P1 } from '../../battle/fixtures';
import type { AttackOption, BattleState, Combatant, Command } from '../../battle/types';
import { DEFAULT_SETTINGS, emptyStore } from '../../app/discovery';
import { setBattleHpVis } from '../../oda/active';
import { setLang, t } from '../../i18n';
import PreviewCard from './PreviewCard';

afterEach(() => { setBattleHpVis(null); setLang('tr'); });

function setup() {
  const r = kitArena({ cls: 'fighter', sub: 'champion', level: 5, scores: { str: 16 }, sheet: { weapons: [{ name: 'Longsword' }] }, enemy: { ac: 10, hp: 6, maxHp: 40 } });
  const s: BattleState = { ...r.state, combatants: { ...r.state.combatants, A: { ...(r.state.combatants.A as Combatant), resources: { ...r.c('A').resources, heroicInspiration: 0 } } } };
  const opt = (s.combatants.A!.weaponOptions.find((w) => /Longsword/i.test(w.label)) ?? s.combatants.A!.weaponOptions[0]) as AttackOption;
  const cmd: Command = { type: 'attack', actorId: 'A', targetId: 'B', option: opt };
  return renderToStaticMarkup(createElement(PreviewCard, { state: s, cmd, ctx: P1, disc: emptyStore(), settings: DEFAULT_SETTINGS }));
}
const killWord = () => t().battle.preview.kill('').trim();

describe('gizli HP: önizleme kartı çip\'leri', () => {
  for (const lang of ['tr', 'en'] as const) {
    it(`${lang.toUpperCase()}: gizlide düşürme olasılığı yok, hasar aralığı ve hasar türü çip'i var; tamda düşürme olasılığı var`, async () => {
      await setLang(lang);
      setBattleHpVis('tam');
      const tam = setup();
      expect(tam).toContain(killWord());
      setBattleHpVis('gizli');
      const gizli = setup();
      expect(gizli).not.toContain(killWord());
      expect(gizli).toContain(t().battle.preview.dmg('').trim());
      expect(gizli).toMatch(/class="[^"]*dmg-chip|data-glif="slashing"/);
      // Hedefin canı hiçbir biçimde sayı olarak geçmez (6/40).
      expect(gizli).not.toMatch(/6\s*\/\s*40|HP 6/);
      // 390×844: satır başına kısa metin (çip etiketi tek sözcük), uzun bölünmez dizgi yok.
      const longest = Math.max(...gizli.replace(/<[^>]+>/g, ' ').split(/\s+/).map((w) => w.length));
      expect(longest).toBeLessThanOrEqual(24);
    });
  }
});
