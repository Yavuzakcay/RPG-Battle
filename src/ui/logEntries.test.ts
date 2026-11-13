// Kuyruk K58 G3: açılabilir günlük satırları, tür renkleri, tur özeti.
import { describe, expect, it } from 'vitest';
import type { BattleEvent } from '../battle/types';
import { kindOf, logEntries, splitLine } from './logEntries';
import { execute } from '../battle/commands';
import { P2, scripted, setup, sword } from '../battle/fixtures';

describe('günlük satırları', () => {
  it('başlık + ayrıntı, metin kaybı yok', () => {
    const s = splitLine('Aras → Goblin: Uzun kılıç. d20 17 +5 = 22 vs AC 15: isabet. hasar 1d8 6 +3 = 9');
    expect(s.head).toBe('Aras → Goblin: Uzun kılıç');
    expect(s.detail.length).toBe(2);
    expect(splitLine('tek parça').detail).toEqual([]);
  });

  it('sıra sayısı ("3. seviye slot", "1. tur") cümle sonu sayılmaz (Görev SD2)', () => {
    const s = splitLine('Ayşe: 3. seviye slot harcandı (kalan 1). Sıra 2. tur başladı');
    expect(s.head).toBe('Ayşe: 3. seviye slot harcandı (kalan 1)');
    expect(s.detail).toEqual(['Sıra 2. tur başladı']);
    expect(splitLine('Ayşe: 3. seviye slot harcandı (kalan 1).').detail).toEqual([]);
    // Büyük harfle başlayan sonraki cümle, sayıyla bitse de ayrılır.
    expect(splitLine('hasar 29. Direnç uygulandı').detail).toEqual(['Direnç uygulandı']);
  });

  it('tür: tepki, yüzey, Moral', () => {
    expect(kindOf({ type: 'reaction_used' } as unknown as BattleEvent)).toBe('reaction');
    expect(kindOf({ type: 'surface_reacted' } as unknown as BattleEvent)).toBe('surface');
    expect(kindOf({ type: 'moral_changed' } as unknown as BattleEvent)).toBe('moral');
  });

  it('tur özeti: tur sonunda o turun saldırı/isabet/hasar toplamı; kapalıyken yok', () => {
    const s0 = setup('Düz');
    const at = execute(s0, { type: 'attack', actorId: 'C', targetId: 'B', option: sword }, P2, scripted([20, 15], [8, 5]));
    expect(at.ok).toBe(true);
    if (!at.ok) return;
    const end = execute(at.state, { type: 'end_turn', actorId: 'C' }, P2, scripted());
    expect(end.ok).toBe(true);
    if (!end.ok) return;
    const events: BattleEvent[] = [...at.events, ...end.events];
    const on = logEntries(events, end.state, { summary: true }).filter((e) => e.kind === 'summary');
    expect(on.length).toBe(1);
    expect(on[0]?.head).toMatch(/1 saldırı, 1 isabet.*8 hasar/);
    expect(logEntries(events, end.state).some((e) => e.kind === 'summary')).toBe(false);
    const hit = logEntries(events, end.state).find((e) => e.head.includes('Longsword'));
    expect(hit?.detail.length).toBeGreaterThan(0);
  });
});
