/**
 * Hazırla (Ready) arayüzü (sunucuda çizilen HTML): panel tetikleri veriden, büyüde slot ve konsantrasyon uyarısı, taslaktan
 * komut, tepki sorusunun başlığı ("Hazırlanan eylemi uygula?") TR/EN, jeton rozeti ve menü yeri.
 */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { READY_DRAFT, ReadyPanel, readyCommand, readySpells, type ReadyDraft } from './ReadyPanel';
import { reactionAskText } from './ReactionPrompt';
import { statusIcons } from './damageFloats';
import { placeOf } from './actionMenu';
import { READY_TRIGGERS } from '../battle/ready';
import { mk, setup, sword } from '../battle/fixtures';
import { setLang, t } from '../i18n';
import type { Combatant } from '../battle';

const state = setup('Düz');
const actor = (extra: Partial<Combatant> = {}): Combatant => ({ ...(state.combatants.A as Combatant), weaponOptions: [sword], ...extra });
const html = (d: ReadyDraft, a = actor()) => renderToStaticMarkup(<ReadyPanel state={state} actor={a} draft={d} onDraft={() => {}} onPickHex={() => {}}
  onConfirm={() => {}} onCancel={() => {}} hexLabel={(h) => `${h.col},${h.row}`} />);

describe('Hazırla paneli', () => {
  it('tetikler veriden; saldırı seçeneği; eylemi harcadığı yazılı', () => {
    const m = html({ ...READY_DRAFT, weapon: 'Longsword' });
    for (const tr of READY_TRIGGERS) expect(m).toContain(tr.ad.tr);
    expect(m).toContain('Longsword');
    expect(m).toContain(t().readyUi.holds);
  });
  it('büyüde slotun hemen harcandığı ve konsantrasyon uyarısı; yalnız eylem süreli büyüler', () => {
    const a = actor({ spellNames: ['Guiding Bolt', 'Shield'], spellSlots: [2, 0, 0, 0, 0, 0, 0, 0, 0], concentration: { spell: 'Bless', slotLevel: 1, turn: '1:0' } });
    expect(readySpells(a).map((s) => s.name)).toEqual(['Guiding Bolt']);
    const m = html({ ...READY_DRAFT, kind: 'spell', spellName: 'Guiding Bolt' }, a);
    expect(m).toContain(t().readyUi.slotWarn);
    expect(m).toContain(t().readyUi.concWarn);
    expect(m).toContain(t().readyUi.concEnds('Bless'));
  });
  it('taslaktan komut: eksik seçimde null', () => {
    const a = actor();
    expect(readyCommand(a, { ...READY_DRAFT, kind: 'move' })).toBeNull();
    expect(readyCommand(a, { ...READY_DRAFT, kind: 'move', to: { col: 1, row: 1 } })?.response).toEqual({ kind: 'move', to: { col: 1, row: 1 } });
    expect(readyCommand(a, { ...READY_DRAFT, weapon: 'Longsword' })?.response.kind).toBe('attack');
  });
  it('tepki sorusu başlığı TR/EN; rozet ve menü yeri', () => {
    const req = { reactorId: 'A', trigger: 'ready' as const, sourceId: 'B', info: { label: READY_TRIGGERS[0]!.ad.tr }, options: [{ id: 'ready', name: 'x' }], suggested: null };
    expect(reactionAskText(req, state).title).toContain('Hazırlanan eylemi uygula?');
    expect(reactionAskText(req, state).line).toContain(READY_TRIGGERS[0]!.ad.tr);
    setLang('en');
    try {
      expect(reactionAskText(req, state).title).toContain('Use the readied action?');
      expect(reactionAskText(req, state).line).toContain(READY_TRIGGERS[0]!.ad.en);
    } finally { setLang('tr'); }
    expect(statusIcons({ ...mk('X'), readied: { trigger: 'saldirir', response: { kind: 'move', to: { col: 0, row: 0 } }, round: 1 } } as Combatant).some((s) => s.key === 'readied')).toBe(true);
    expect(placeOf('ready')).toEqual({ area: 'special', group: 'other' });
  });
});
