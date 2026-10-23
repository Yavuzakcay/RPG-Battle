/** Tepki arayüzü (Görev R1): ayar ("hızlı mod"), karar verici, istem metni ve düğmeleri. */
import { describe, it, expect } from 'vitest';
import { setup } from '../battle/fixtures';
import { DEFAULT_POLICIES, reactionDecider, storedPolicies } from './reactionSetting';
import { reactionAskText, reactionButtons } from './ReactionPrompt';
import type { ReactionRequest } from '../rules/reactionChoice';

const req: ReactionRequest = {
  reactorId: 'A', trigger: 'hit', sourceId: 'B', info: { label: 'Claw', total: 15, ac: 13, damage: 8 },
  options: [{ id: 'spells:shield', name: 'Shield', choices: [{ id: '1', label: '1' }, { id: '2', label: '2' }] }, { id: 'rogue:uncanny-dodge', name: 'Uncanny Dodge' }],
  suggested: { option: 'spells:shield', choice: '1' },
};
const isPlayer = (id: string) => id === 'A';

describe('tepki ayarı ve karar verici', () => {
  it('varsayılan: oyuncuya sor, düşmanda yapay zekâ', () => {
    expect(storedPolicies()).toEqual(DEFAULT_POLICIES);
    const decide = reactionDecider(DEFAULT_POLICIES, isPlayer);
    expect(decide(req)).toBe('ask');
    expect(decide({ ...req, reactorId: 'B' })).toEqual({ option: 'spells:shield', choice: '1' });
  });
  it('asla: kullanmaz; her zaman: öneri, öneri yoksa ilk seçenek', () => {
    expect(reactionDecider({ player: 'never', enemy: 'never' }, isPlayer)(req)).toBeNull();
    const always = reactionDecider({ player: 'always', enemy: 'always' }, isPlayer);
    expect(always(req)).toEqual({ option: 'spells:shield', choice: '1' });
    expect(always({ ...req, suggested: null })).toEqual({ option: 'spells:shield', choice: '1' });
    expect(reactionDecider({ player: 'ask', enemy: 'never' }, isPlayer)({ ...req, reactorId: 'B' })).toBeNull();
  });
});

describe('tepki istemi', () => {
  it('başlık tepkiyi verecek olanın adı, satır tetik; slot seçimi ayrı düğmeler, öneri işaretli', () => {
    const s = setup();
    const text = reactionAskText(req, s);
    expect(text.title).toContain('A');
    expect(text.line).toContain('Claw');
    const b = reactionButtons(req);
    expect(b.map((x) => x.key)).toEqual(['spells:shield:1', 'spells:shield:2', 'rogue:uncanny-dodge']);
    expect(b.filter((x) => x.suggested).map((x) => x.key)).toEqual(['spells:shield:1']);
    expect(b[2]?.answer).toEqual({ option: 'rogue:uncanny-dodge' });
  });
});
